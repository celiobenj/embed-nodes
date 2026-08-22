# EmbedNodes

O EmbedNodes é uma plataforma de desenvolvimento baseada em modelos para prototipar, configurar e validar malhas de controle em sistemas embarcados. A aplicação web permite montar visualmente grafos de blocos, validar suas conexões e parâmetros, compilá-los em JSON e transmiti-los via Web Serial para um firmware executado em um ESP32.

O projeto combina um frontend em React e TypeScript com um motor de execução em C++ para controle em tempo real, incluindo comunicação serial, telemetria e visualização dos sinais.