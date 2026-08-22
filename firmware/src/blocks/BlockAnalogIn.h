#ifndef BLOCK_ANALOG_IN_H
#define BLOCK_ANALOG_IN_H

#include "Block.h"
#include <Arduino.h>

#define MAX_AVG_SAMPLES 16

class BlockAnalogIn : public Block {
private:
    uint8_t pin;
    uint8_t numSamples;
    uint16_t buffer[MAX_AVG_SAMPLES];
    uint8_t bufIndex;
    uint32_t sum;

public:
    BlockAnalogIn(uint8_t p, uint8_t avg) 
        : pin(p), bufIndex(0), sum(0) {
        numSamples = (avg > 0 && avg <= MAX_AVG_SAMPLES) ? avg : 1;
        for (int i = 0; i < MAX_AVG_SAMPLES; i++) {
            buffer[i] = 0;
        }
    }

    void init() override {
        pinMode(pin, INPUT);
        sum = 0;
        bufIndex = 0;
        uint16_t initialVal = analogRead(pin);
        for (int i = 0; i < numSamples; i++) {
            buffer[i] = initialVal;
            sum += initialVal;
        }
    }

    void compute() override {
        uint16_t newVal = analogRead(pin);
        
        sum -= buffer[bufIndex];
        buffer[bufIndex] = newVal;
        sum += newVal;
        
        bufIndex++;
        if (bufIndex >= numSamples) {
            bufIndex = 0;
        }
        
        outputs[0] = (float)sum / numSamples;
    }
};

#endif // BLOCK_ANALOG_IN_H
