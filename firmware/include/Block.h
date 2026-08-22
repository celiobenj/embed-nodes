#ifndef BLOCK_H
#define BLOCK_H

#include <Arduino.h>

#define MAX_INPUTS 4
#define MAX_OUTPUTS 4

class Block {
public:
    uint16_t id = 0;
    
    // Arrays fixos para evitar alocação dinâmica no runtime
    float outputs[MAX_OUTPUTS] = {0.0f}; 
    float* inputs[MAX_INPUTS] = {nullptr};

    virtual ~Block() {}

    // Inicializa hardware ou estados (chamado após a ligação dos ponteiros)
    virtual void init() = 0;
    
    // Executa a lógica do bloco no laço de controle (deve ser determinístico e rápido)
    virtual void compute() = 0;
    
    // Reseta o estado do bloco (ex: zera saídas e atuadores)
    virtual void reset() {
        for(int i = 0; i < MAX_OUTPUTS; i++) {
            outputs[i] = 0.0f;
        }
    }

protected:
    // Helper para leitura segura de ponteiros
    static inline float safeRead(const float* ptr) {
        return ptr ? *ptr : 0.0f;
    }
};

#endif // BLOCK_H
