#ifndef SERIAL_PROTOCOL_H
#define SERIAL_PROTOCOL_H

#include <Arduino.h>

#define SERIAL_BUFFER_SIZE 4096

enum CommandType {
    CMD_NONE,
    CMD_CONFIG,
    CMD_START,
    CMD_STOP,
    CMD_SAVE,
    CMD_UNKNOWN
};

class SerialProtocol {
private:
    char buffer[SERIAL_BUFFER_SIZE];
    uint16_t bufIndex;
    bool receiving;
    bool cmdComplete;
    CommandType currentType;
    char* payloadStart;

public:
    SerialProtocol();

    // Alimenta um byte recebido da serial
    void feed(char c);

    // Retorna true se um comando completo ($...#) está disponível
    bool hasCommand() const { return cmdComplete; }

    // Retorna o tipo do comando recebido
    CommandType getCommandType() const { return currentType; }

    // Retorna o ponteiro para a string JSON do payload (para CMD_CONFIG)
    const char* getPayload() const { return payloadStart; }

    // Retorna o buffer completo
    const char* getBuffer() const { return buffer; }

    // Limpa a máquina de estados para receber o próximo comando
    void clear();
};

#endif // SERIAL_PROTOCOL_H
