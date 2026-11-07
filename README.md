# Ponto Cego

FPS tático 5 contra 5, modo bomba, que roda no navegador. Você joga contra bots, sem instalar nada
e sem internet. Tem também um modo online com fila de partida, em teste.

Feito com apoio de IA (Claude Code). Veja a seção Como foi feito.

O jogo é um único arquivo HTML. O motor 3D é o [Babylon.js](https://www.babylonjs.com/).

## Em resumo

- Cinco contra cinco, uma vida por rodada, o primeiro a quatro rodadas vence
- Ataque e defesa, com um mapa de prédio de escritórios e quatro pontos de bomba
- Armas com recarga, miras ajustáveis e acessórios
- Bots com táticas de entrada, defesa e desarme
- Modo online: o servidor roda a mesma simulação do jogo e os jogadores entram por uma fila


## Jogar agora

Uma cópia do jogo, com o modo online, roda em https://pontocego.duckdns.org. O servidor é pequeno e aceita uma partida por vez. Se ela estiver cheia ou lenta, tente mais tarde.

## Navegadores

Funciona em Chrome e Edge 100 ou mais novos e em Firefox 113 ou mais novo, com WebGL2 ativo e aceleração por hardware ligada. Se o jogo não abrir, a tela de carregamento diz o motivo: WebGL2 desligado ou bloqueado, navegador antigo demais, ou uma extensão (como o NoScript) barrando o código. Navegadores que desligam o WebGL por privacidade, como o Tor Browser e o LibreWolf em modo estrito, não rodam o jogo.

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

## Como foi feito

O Ponto Cego foi criado em conversa com o Claude Code, da Anthropic. Eu, Felipe, dei a ideia, defini o que o jogo deve ser (bomba 5 contra 5, bots, armas com recarga, modo online), escolhi os assets e as licenças, joguei, apontei o que estava errado e decidi o que entrava. O Claude escreveu o código, as ferramentas de build e os testes automáticos, e eu revisei o resultado jogando.

Isso quer dizer que o código não foi escrito linha a linha por uma pessoa. Se você achar um erro, abra uma issue. Pull requests são bem-vindos.

## Licença

O código é MIT (`LICENSE`). Os assets têm licenças próprias, listadas em `CREDITOS.md` e `ASSETS.md`.
