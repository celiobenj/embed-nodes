#include "GraphEngine.h"
#include "../blocks/BlockConstant.h"
#include "../blocks/BlockGain.h"
#include "../blocks/BlockPwmOut.h"
#include "../blocks/BlockAnalogIn.h"

GraphEngine::GraphEngine() : blockCount(0), ts_ms(10), decimation(1) {
    for (int i = 0; i < MAX_BLOCKS; i++) {
        pipeline[i] = nullptr;
    }
}

GraphEngine::~GraphEngine() {
    freeAll();
}

void GraphEngine::freeAll() {
    for (int i = 0; i < blockCount; i++) {
        if (pipeline[i]) {
            delete pipeline[i];
            pipeline[i] = nullptr;
        }
    }
    blockCount = 0;
}

void GraphEngine::resetAll() {
    for (int i = 0; i < blockCount; i++) {
        if (pipeline[i]) {
            pipeline[i]->reset();
        }
    }
}

Block* GraphEngine::createBlock(const char* type, JsonObject params) {
    if (strcmp(type, "Constant") == 0) {
        float val = params["value"] | 0.0f;
        return new BlockConstant(val);
    } 
    else if (strcmp(type, "Gain") == 0) {
        float k = params["k"] | 1.0f;
        return new BlockGain(k);
    } 
    else if (strcmp(type, "PwmOut") == 0) {
        uint8_t pin = params["pin"] | 255;
        uint8_t channel = params["channel"] | 0;
        uint32_t freq = params["freq"] | 1000;
        uint8_t res = params["res_bits"] | 8;
        return new BlockPwmOut(pin, channel, freq, res);
    } 
    else if (strcmp(type, "AnalogIn") == 0) {
        uint8_t pin = params["pin"] | 255;
        uint8_t avg = params["sample_avg"] | 1;
        return new BlockAnalogIn(pin, avg);
    }
    return nullptr;
}

Block* GraphEngine::findById(uint16_t id) {
    for (int i = 0; i < blockCount; i++) {
        if (pipeline[i] && pipeline[i]->id == id) {
            return pipeline[i];
        }
    }
    return nullptr;
}

bool GraphEngine::configure(JsonDocument& doc) {
    freeAll(); // Limpa grafo anterior

    // Configurações globais
    ts_ms = doc["ts"] | 10;
    decimation = doc["decimation"] | 1;

    // 1. Instanciação (Nós)
    JsonArray nodes = doc["nodes"].as<JsonArray>();
    for (JsonObject node : nodes) {
        if (blockCount >= MAX_BLOCKS) return false; // ERR:MEM_FULL

        uint16_t id = node["id"];
        const char* type = node["type"];
        JsonObject params = node["params"];

        Block* b = createBlock(type, params);
        if (b) {
            b->id = id;
            pipeline[blockCount++] = b;
        }
    }

    // 2. Roteamento (Links) - Ligação de Ponteiros
    JsonArray links = doc["links"].as<JsonArray>();
    for (JsonObject link : links) {
        uint16_t fromId = link["from"];
        uint8_t outPort = link["outPort"];
        uint16_t toId = link["to"];
        uint8_t inPort = link["inPort"];

        Block* source = findById(fromId);
        Block* target = findById(toId);

        if (source && target && outPort < MAX_OUTPUTS && inPort < MAX_INPUTS) {
            target->inputs[inPort] = &(source->outputs[outPort]);
        }
    }

    // 3. Inicialização
    for (int i = 0; i < blockCount; i++) {
        if (pipeline[i]) {
            pipeline[i]->init();
        }
    }

    return true; // ACK:READY
}

// Otimizado para execução rápida no Core 1 (sem verificações dinâmicas)
void GraphEngine::computeAll() {
    for (int i = 0; i < blockCount; i++) {
        pipeline[i]->compute();
    }
}
