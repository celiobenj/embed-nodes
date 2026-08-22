#ifndef BLOCK_PWM_OUT_H
#define BLOCK_PWM_OUT_H

#include "Block.h"
#include <Arduino.h>

class BlockPwmOut : public Block {
private:
    uint8_t pin;
    uint8_t channel;
    uint32_t freq;
    uint8_t resBits;
    float maxValue;

public:
    BlockPwmOut(uint8_t p, uint8_t ch, uint32_t f, uint8_t res) 
        : pin(p), channel(ch), freq(f), resBits(res) {
        maxValue = (float)((1 << resBits) - 1);
    }

    void init() override {
        ledcSetup(channel, freq, resBits);
        ledcAttachPin(pin, channel);
        ledcWrite(channel, 0);
    }

    void compute() override {
        float val = safeRead(inputs[0]);
        
        // Saturação
        if (val < 0.0f) val = 0.0f;
        if (val > maxValue) val = maxValue;

        ledcWrite(channel, (uint32_t)val);
        outputs[0] = val; // Repassa o valor aplicado
    }

    void reset() override {
        ledcWrite(channel, 0);
        Block::reset();
    }
};

#endif // BLOCK_PWM_OUT_H
