#include <Arduino.h>
#include <ArduinoJson.h>
#include <LittleFS.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/semphr.h>
#include <freertos/queue.h>

#include "engine/GraphEngine.h"
#include "comm/SerialProtocol.h"

// =========================================================================
// VARIÁVEIS GLOBAIS E SINCRONIZAÇÃO
// =========================================================================
GraphEngine engine;
SerialProtocol serialProto;

// Semáforo para disparar o controle a partir do ISR do timer
SemaphoreHandle_t timerSemaphore;
esp_timer_handle_t controlTimer;

// Fila para telemetria (Comunicação Core 1 -> Core 0)
struct TelemetrySample {
    uint16_t blockId;
    uint8_t outIndex;
    float value;
};
QueueHandle_t telemetryQueue;

bool isRunning = false;
uint32_t decimationCounter = 0;

// =========================================================================
// ARMAZENAMENTO (LittleFS)
// =========================================================================
bool loadConfig() {
    if (!LittleFS.begin(true)) {
        Serial.println("$ERR:FS_MOUNT#");
        return false;
    }

    if (!LittleFS.exists("/config.json")) {
        return false;
    }

    File file = LittleFS.open("/config.json", "r");
    if (!file) {
        Serial.println("$ERR:FS_READ#");
        return false;
    }

    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, file);
    file.close();

    if (error) {
        Serial.println("$ERR:PARSE_FAIL#");
        return false;
    }

    return engine.configure(doc);
}

void saveConfig(const char* jsonPayload) {
    if (!LittleFS.begin(true)) {
        Serial.println("$ERR:FS_MOUNT#");
        return;
    }

    File file = LittleFS.open("/config.json", "w");
    if (!file) {
        Serial.println("$ERR:FS_WRITE#");
        return;
    }
    
    file.print(jsonPayload);
    file.close();
    Serial.println("$ACK:SAVED#");
}

// =========================================================================
// CONTROLE DE TEMPO REAL (CORE 1)
// =========================================================================
void IRAM_ATTR timer_isr(void* arg) {
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    xSemaphoreGiveFromISR(timerSemaphore, &xHigherPriorityTaskWoken);
    if (xHigherPriorityTaskWoken == pdTRUE) {
        portYIELD_FROM_ISR();
    }
}

void TaskControl(void* pvParameters) {
    while (true) {
        // Aguarda o semáforo binário liberado pelo timer (Hardware Timer Sync)
        if (xSemaphoreTake(timerSemaphore, portMAX_DELAY) == pdTRUE) {
            
            // Execução Linear Polimórfica (Gargalo Crítico)
            engine.computeAll();

            // Decimação e Envio de Telemetria
            decimationCounter++;
            if (decimationCounter >= engine.getDecimation()) {
                decimationCounter = 0;
                
                // Envia amostra do primeiro output (output[0]) de todos os blocos no MVP
                // Pode ser otimizado no futuro para enviar apenas nós marcados com flag 'telemetry'
                for (int i = 0; i < engine.getBlockCount(); i++) {
                    Block* b = engine.getBlock(i);
                    if (b) {
                        TelemetrySample sample;
                        sample.blockId = b->id;
                        sample.outIndex = 0;
                        sample.value = b->outputs[0];
                        
                        // Envia para a fila sem bloquear (pdFALSE)
                        xQueueSend(telemetryQueue, &sample, 0); 
                    }
                }
            }
        }
    }
}

// =========================================================================
// COMUNICAÇÃO E MÁQUINA DE ESTADOS (CORE 0)
// =========================================================================
void TaskComm(void* pvParameters) {
    while (true) {
        // 1. Processamento da Serial
        while (Serial.available() > 0) {
            char c = Serial.read();
            serialProto.feed(c);

            if (serialProto.hasCommand()) {
                switch (serialProto.getCommandType()) {
                    case CMD_CONFIG: {
                        if (isRunning) {
                            esp_timer_stop(controlTimer);
                            isRunning = false;
                        }
                        
                        JsonDocument doc;
                        DeserializationError err = deserializeJson(doc, serialProto.getPayload());
                        
                        if (err) {
                            Serial.println("$ERR:PARSE_FAIL#");
                        } else {
                            if (engine.configure(doc)) {
                                Serial.println("$ACK:READY#");
                            } else {
                                Serial.println("$ERR:MEM_FULL#");
                            }
                        }
                        break;
                    }
                    
                    case CMD_START: {
                        if (!isRunning && engine.getBlockCount() > 0) {
                            decimationCounter = 0;
                            esp_timer_start_periodic(controlTimer, engine.getTsMs() * 1000ULL); // microsegundos
                            isRunning = true;
                        }
                        break;
                    }
                    
                    case CMD_STOP: {
                        if (isRunning) {
                            esp_timer_stop(controlTimer);
                            isRunning = false;
                        }
                        engine.resetAll(); // Zera PWM e saídas (Fail-safe)
                        break;
                    }
                    
                    case CMD_SAVE: {
                        // Atenção: no buffer atual o payload CONFIG fica sem o final '$CONFIG:'. 
                        // Para o MVP gravaremos o json completo se tivermos recebido um CONFIG recentemente,
                        // Mas como o protocolo separa os comandos, o SAVE precisaria ter o JSON junto,
                        // ou salvar o último valido. Vamos salvar o último Payload válido que configurou.
                        // Simplificação MVP: assume que SAVE é chamado logo após CONFIG, então o buffer ainda tem o json.
                        // (Ideal seria serializar a doc interna, mas gasta memória).
                        // Como o buffer contém só $CMD:SAVE#, não temos o json aqui.
                        // Recomenda-se para V2 ler a doc JSON em RAM. Por ora avisamos que precisa enviar no CONFIG.
                        Serial.println("$ACK:SAVE_NOT_IMPL_MVP#");
                        break;
                    }
                    
                    default:
                        break;
                }
                
                serialProto.clear();
            }
        }

        // 2. Transmissão de Telemetria (Teleplot format)
        TelemetrySample sample;
        // Esvazia a fila de telemetria e imprime
        while (xQueueReceive(telemetryQueue, &sample, 0) == pdTRUE) {
            Serial.printf(">blk%d_out%d:%f\n", sample.blockId, sample.outIndex, sample.value);
        }

        vTaskDelay(pdMS_TO_TICKS(10)); // Yield para o FreeRTOS Core 0
    }
}

// =========================================================================
// SETUP
// =========================================================================
void setup() {
    Serial.begin(115200);
    
    // Inicializa Objetos FreeRTOS
    timerSemaphore = xSemaphoreCreateBinary();
    telemetryQueue = xQueueCreate(64, sizeof(TelemetrySample));

    // Configuração do Timer de Hardware
    const esp_timer_create_args_t timer_args = {
        .callback = &timer_isr,
        .arg = NULL,
        .dispatch_method = ESP_TIMER_TASK,
        .name = "control_timer",
        .skip_unhandled_events = true
    };
    esp_timer_create(&timer_args, &controlTimer);

    // Boot Autônomo
    if (loadConfig()) {
        decimationCounter = 0;
        esp_timer_start_periodic(controlTimer, engine.getTsMs() * 1000ULL);
        isRunning = true;
    }

    // Cria as Tasks fixadas nos Cores
    // Core 0: Prioridade 1 (Baixa) para parse e comunicação
    xTaskCreatePinnedToCore(TaskComm, "TaskComm", 8192, NULL, 1, NULL, 0);
    
    // Core 1: Prioridade Máxima FreeRTOS (Alta) para laço de controle
    xTaskCreatePinnedToCore(TaskControl, "TaskControl", 4096, NULL, configMAX_PRIORITIES - 1, NULL, 1);
}

void loop() {
    // Vazio. Tudo roda nas Tasks FreeRTOS.
    vTaskDelete(NULL);
}
