#ifndef GRAPH_ENGINE_H
#define GRAPH_ENGINE_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "Block.h"

#define MAX_BLOCKS 50

class GraphEngine {
private:
    Block* pipeline[MAX_BLOCKS];
    uint8_t blockCount;
    uint32_t ts_ms;
    uint32_t decimation;

    Block* createBlock(const char* type, JsonObject params);

public:
    GraphEngine();
    ~GraphEngine();

    // Libera a memória de todos os blocos atuais e zera o contador
    void freeAll();

    // Inicializa hardware e chama reset de todos os blocos
    void resetAll();

    // Processa o JSON, instancia blocos, vincula ponteiros e chama init()
    // Retorna true se sucesso, false se erro de parse/memória
    bool configure(JsonDocument& doc);

    // Executa a malha de controle - DEVE SER DETERMINÍSTICO E RÁPIDO
    void computeAll();

    // Busca um bloco pelo seu ID
    Block* findById(uint16_t id);

    // Getters
    uint32_t getTsMs() const { return ts_ms; }
    uint32_t getDecimation() const { return decimation; }
    uint8_t getBlockCount() const { return blockCount; }
    Block* getBlock(uint8_t index) const { return index < blockCount ? pipeline[index] : nullptr; }
};

#endif // GRAPH_ENGINE_H
