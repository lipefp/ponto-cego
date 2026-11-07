# Ponto Cego

FPS tático 5 contra 5, modo bomba, que roda no navegador. Você joga contra bots, sem instalar nada
e sem internet. Tem também um modo online com fila de partida, em teste.

O jogo é um único arquivo HTML. O motor 3D é o [Babylon.js](https://www.babylonjs.com/).

## Em resumo

- Cinco contra cinco, uma vida por rodada, o primeiro a quatro rodadas vence
- Ataque e defesa, com um mapa de prédio de escritórios e quatro pontos de bomba
- Armas com recarga, miras ajustáveis e acessórios
- Bots com táticas de entrada, defesa e desarme
- Modo online: o servidor roda a mesma simulação do jogo e os jogadores entram por uma fila

Este projeto foi feito com apoio do Claude Code (Anthropic). A ideia, a direção e os testes são do autor.

## Como rodar

Você precisa do [Node.js](https://nodejs.org/) 20 ou mais novo.

    npm install
    npm run build

O jogo fica em `dist/PontoCego.html`. Abra o arquivo no Chrome, Edge ou Firefox.

Aviso: esta cópia pública não traz sons, personagem e animações de terceiros (veja `ASSETS.md`).
Para fazer o build completo, coloque seus próprios arquivos em `assets/` com os nomes da tabela de `ASSETS.md`.

## Estrutura

    src/sim/      regras, mapa, tiros, IA e rede. Não depende do Babylon e roda no Node
    src/render/   cena 3D, materiais, armas, personagens, áudio
    src/ui/       menus, HUD, lobby e aba Online
    src/main/     laço principal de 60 Hz e ciclo da partida
    server/       servidor multiplayer (Node + WebSocket)
    tools/        build, empacotamento do servidor e ferramentas de animação
    test/         testes automáticos
    assets/       modelos, sons, texturas (com as licenças em assets/LICENCAS)
    docs/         notas de desenvolvimento

## Testes

    npm run test:sim       40 partidas só com bots, confere o balanceamento
    npm run test:net       confere comandos e snapshots da rede
    node test/mp_server.js sobe o servidor e simula jogadores

## Servidor multiplayer

O servidor roda a simulação sem tela, a 60 passos por segundo, e envia o estado a 20 vezes por segundo.
Para gerar o pacote com Docker:

    npm run build
    node tools/mkserver.mjs saida/

Dentro da pasta gerada tem um README com os passos. Os jogadores abrem o endereço do servidor no
navegador e a aba Online conecta sozinha. O servidor aceita até 10 jogadores por partida e completa
as vagas com bots.

## Licença

O código é MIT (`LICENSE`). Os assets têm licenças próprias, listadas em `CREDITOS.md` e `ASSETS.md`.
