#ifndef BLOCK_GAIN_H
#define BLOCK_GAIN_H

#include "Block.h"

class BlockGain : public Block {
private:
    float k;

public:
    BlockGain(float gain) : k(gain) {}

    void init() override {
        // Nada a inicializar
    }

    void compute() override {
        outputs[0] = safeRead(inputs[0]) * k;
    }
};

#endif // BLOCK_GAIN_H
