# Ponto Cego — servidor dedicado

Este pacote roda o servidor do Ponto Cego. Ele também entrega o jogo: os jogadores só abrem o endereço no navegador. Não precisa instalar nada neles.

## Subir

Na pasta deste pacote:

    docker compose up -d --build

O servidor fica na porta 8080. Abra no navegador:

    http://IP-DA-VPS:8080

Libere a porta 8080 (TCP) no firewall da VPS. Para usar outra porta, mude o `8080:8080` no `docker-compose.yml` (por exemplo `80:8080`).

Sem compose:

    docker build -t ponto-cego-servidor .
    docker run -d --name ponto-cego --restart unless-stopped -p 8080:8080 ponto-cego-servidor

## Como jogar

Passe aos jogadores o endereço `http://IP-DA-VPS:8080`. Quem abre esse link já cai conectado, sem digitar nada.

1. O jogador vai na aba **Online** e toca em **Buscar partida**.
2. O servidor junta quem está na fila. Com 10 na fila a partida sai na hora. Com menos, sai depois de alguns segundos (`QUEUE_WAIT_S`), e os bots completam as vagas.
3. Aparece **Partida encontrada**. Todos tocam em **Aceitar**. Se alguém não aceitar, a partida é desfeita e quem aceitou volta para a fila.
4. Os times são sorteados e equilibrados. Cada um joga com o operador e as armas que escolheu nas abas Operadores e Arsenal.
5. Quando a partida acaba, todos voltam ao menu e podem buscar outra.

O servidor roda até 4 partidas ao mesmo tempo (`MAX_MATCHES`). Ninguém entra no meio de uma partida. Quem cair vira bot na hora. O drone de reconhecimento fica desligado no online.

## Ver se está funcionando

    docker logs -f ponto-cego
    curl http://127.0.0.1:8080/status

O log mostra a fila, as partidas e quem entra e sai. A cada 30 segundos mostra o tempo de cada passo do servidor e o tráfego.

## Atualizar

Quando houver uma versão nova, troque os arquivos desta pasta e rode de novo `docker compose up -d --build`.

## Configurações (docker-compose.yml)

- `SERVER_NAME`: nome do servidor.
- `MAX_PLAYERS`: humanos por partida, de 1 a 10.
- `MAX_MATCHES`: partidas ao mesmo tempo.
- `QUEUE_WAIT_S`: espera máxima na fila antes de começar com bots.
- `ACCEPT_S`: segundos para aceitar a partida.
- `BACK_TO_LOBBY_S`: segundos na tela final.

## HTTPS (opcional)

O jogo funciona em `http://`. Se quiser HTTPS com domínio, ponha um proxy na frente, por exemplo Caddy:

    seudominio.com {
        reverse_proxy 127.0.0.1:8080
    }

O Caddy cuida do certificado e do WebSocket sozinho.

## Requisitos

Docker com Compose. Uso de CPU baixo: cada partida leva uma fração de um núcleo (cerca de 0,5 ms por passo). Banda: cerca de 50 a 100 KB/s de saída por jogador durante a rodada.
