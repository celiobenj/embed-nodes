#ifndef BLOCK_CONSTANT_H
#define BLOCK_CONSTANT_H

#include "Block.h"

class BlockConstant : public Block {
private:
    float value;

public:
    BlockConstant(float val) : value(val) {}

    void init() override {
        // Nada a inicializar
    }

    void compute() override {
        outputs[0] = value;
    }
};

#endif // BLOCK_CONSTANT_H
