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


## Jogue online

**https://pontocego.duckdns.org**

O jogo está no ar nesse endereço. Você abre no navegador, sem instalar nada, e escolhe como jogar:

- **Offline, contra bots:** na aba Jogar, clique em Partida rápida. Tudo roda no seu computador. Depois de carregado, funciona sem internet.
- **Online, com outras pessoas:** na aba Online, clique em Buscar partida. O servidor junta quem estiver na fila e, se não chegar gente suficiente em 20 segundos, completa as vagas com bots. Quando a partida é encontrada, você tem 15 segundos para aceitar. Cada partida é 5 contra 5, com até 10 jogadores.

Para jogar com um amigo, os dois abrem o mesmo endereço e entram na fila ao mesmo tempo.

Pontos importantes:
- O modo online está em teste (beta). Pode ter erros, e o servidor pode estar fora do ar em alguns momentos.
- O servidor é pequeno e roda **uma partida de cada vez**. Se já houver uma em andamento, a fila espera.
- O jogo tem cerca de 20 MB. A primeira abertura demora um pouco, e depois o navegador guarda uma cópia.
- Pelo que o código faz, o servidor não usa banco de dados nem grava arquivos. O estado da partida fica só na memória e some quando ela termina.
- Você precisa de um navegador compatível (veja abaixo).

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

Para rodar o seu próprio servidor, use qualquer máquina com Docker. O servidor que está no ar roda
numa máquina gratuita da Oracle Cloud, com o Caddy na frente para ligar o HTTPS. O navegador exige
HTTPS (wss) para conectar de uma página segura, então publicar só a porta 8080 não basta.

Ajustes por variável de ambiente:

| Variável | Padrão | O que faz |
|---|---|---|
| `PORT` | 8080 | Porta do servidor |
| `SERVER_NAME` | Ponto Cego | Nome mostrado no jogo |
| `MAX_PLAYERS` | 10 | Jogadores por partida (1 a 10) |
| `MAX_MATCHES` | 4 | Partidas ao mesmo tempo. Cada uma gasta processador e memória |
| `QUEUE_WAIT_S` | 20 | Segundos de espera na fila antes de completar com bots |
| `ACCEPT_S` | 15 | Segundos para aceitar a partida encontrada |
| `BACK_TO_LOBBY_S` | 15 | Segundos na tela final antes de voltar ao lobby |

## Como foi feito

O Ponto Cego foi criado em conversa com o Claude Code, da Anthropic. Eu, Felipe, dei a ideia, defini o que o jogo deve ser (bomba 5 contra 5, bots, armas com recarga, modo online), escolhi os assets e as licenças, joguei, apontei o que estava errado e decidi o que entrava. O Claude escreveu o código, as ferramentas de build e os testes automáticos, e eu revisei o resultado jogando.

Isso quer dizer que o código não foi escrito linha a linha por uma pessoa. Se você achar um erro, abra uma issue. Pull requests são bem-vindos.

## Licença

O código é MIT (`LICENSE`). Os assets têm licenças próprias, listadas em `CREDITOS.md` e `ASSETS.md`.
