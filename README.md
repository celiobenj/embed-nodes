# EmbedNodes

Plataforma de desenvolvimento baseada em modelos (Model-Based Design) para prototipagem, configuração e validação de malhas de controle em sistemas embarcados. A ferramenta permite a construção visual de diagramas de blocos no navegador, compilação do grafo em uma representação JSON estruturada e envio direto para o microcontrolador ESP32 via Web Serial API, sem necessidade de recompilação do firmware.

---

## Visao Geral

O EmbedNodes conecta uma interface visual reativa a um motor de execução em C++ embarcado no ESP32:
1. **Modelagem Visual:** O usuário monta a malha no canvas (entradas, ganhos, somadores, saídas PWM).
2. **Validacao e Ordenacao Topologica:** O frontend valida tipos de dados, conexões e dependências de portas para gerar uma ordem determinística de execução (Grafo Acíclico Dirigido - DAG).
3. **Transmissão Web Serial:** O payload JSON com a topologia e parâmetros é transmitido diretamente pela porta serial no navegador.
4. **Execucao e Telemetria:** O firmware instancia dinamicamente os blocos, roda o laço de controle periódico e devolve dados no formato Teleplot para visualização gráfica em tempo real.

## Blocos Suportados

| Bloco | Tipo | Funcao |
| :--- | :--- | :--- |
| **Constant** | Fonte | Injeta um valor numérico constante configurável na malha. |
| **AnalogIn** | Entrada / Hardware | Faz a leitura analógica (ADC) de pinos configurados do ESP32. |
| **Gain** | Operação Matemática | Aplica ganho proporcional (multiplicador) sobre o sinal de entrada. |
| **PwmOut** | Saída / Hardware | Modula sinal de saída PWM (LEDC) no pino especificado. |

## Arquitetura e Tecnologias

### Frontend
* **Framework:** React 18 com Vite e TypeScript
* **Interface & Estado:** Tailwind CSS e Zustand
* **Comunicação:** Web Serial API com parser de protocolo de telemetria

### Firmware
* **Plataforma:** ESP32 (Framework Arduino via PlatformIO)
* **Motor de Execução:** `GraphEngine` para instanciação dinâmica e execução sequencial dos blocos
* **Protocolo:** `SerialProtocol` para parsing e deserialização de comandos JSON

## Estrutura do Repositorio

```text
├── firmware/
│   ├── include/             # Interfaces base de blocos
│   ├── src/
│   │   ├── blocks/          # Implementação de blocos (Gain, AnalogIn, PwmOut, etc.)
│   │   ├── comm/            # Protocolo de comunicação serial e parsing JSON
│   │   ├── engine/          # Motor de execução e encadeamento de grafo
│   │   └── main.cpp         # Ponto de entrada do firmware
│   └── platformio.ini       # Configuração de build do PlatformIO
├── frontend/
│   ├── src/
│   │   ├── components/      # Canvas, painéis de propriedades e visualizador de gráficos
│   │   ├── engine/          # Validador de grafo, compilador e ordenação topológica
│   │   ├── nodes/           # Definição e UI dos blocos gráficos
│   │   ├── serial/          # Gerenciador Web Serial e parser Teleplot
│   │   └── store/           # Gerenciamento de estado global (Zustand)
│   └── package.json
└── README.md
```
