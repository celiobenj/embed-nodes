#include "SerialProtocol.h"
#include <string.h>

SerialProtocol::SerialProtocol() {
    clear();
}

void SerialProtocol::clear() {
    bufIndex = 0;
    receiving = false;
    cmdComplete = false;
    currentType = CMD_NONE;
    payloadStart = nullptr;
    buffer[0] = '\0';
}

void SerialProtocol::feed(char c) {
    if (cmdComplete) return; // Ignora até que o comando atual seja processado/limpo

    if (c == '$') {
        clear();
        receiving = true;
        buffer[bufIndex++] = c;
    } 
    else if (receiving) {
        if (bufIndex < SERIAL_BUFFER_SIZE - 1) {
            buffer[bufIndex++] = c;
            
            if (c == '#') {
                buffer[bufIndex] = '\0'; // Finaliza a string
                receiving = false;
                cmdComplete = true;

                // Identifica o comando
                if (strncmp(buffer, "$CONFIG:", 8) == 0) {
                    currentType = CMD_CONFIG;
                    payloadStart = buffer + 8;
                    // Remove o '#' do final para deixar um JSON limpo
                    buffer[bufIndex - 1] = '\0'; 
                } 
                else if (strncmp(buffer, "$CMD:START#", 11) == 0) {
                    currentType = CMD_START;
                } 
                else if (strncmp(buffer, "$CMD:STOP#", 10) == 0) {
                    currentType = CMD_STOP;
                } 
                else if (strncmp(buffer, "$CMD:SAVE#", 10) == 0) {
                    currentType = CMD_SAVE;
                } 
                else {
                    currentType = CMD_UNKNOWN;
                }
            }
        } else {
            // Estouro de buffer
            clear();
        }
    }
}
