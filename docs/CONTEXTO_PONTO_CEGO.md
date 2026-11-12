# Contexto Ponto Cego

Este documento resume o estado atual do projeto Ponto Cego, um FPS tático 5v5 no navegador usando Babylon.js.

## Stack

- Linguagens: JavaScript (ES2020), Python para ferramentas
- Bibliotecas principais: 
  - Babylon.js para renderização 3D
  - Cannon.js para física
  - Howler.js para áudio
- Ferramentas: Node.js, Webpack, Prettier

## Jogo

- Modo bomba 5v5, rodando a 60 Hz no navegador
- Mapa único (escritório), totalmente destrutível
- 14 armas realistas e 6 gadgets (granada, flash, C4, jammers)
- Animações realistas retargetadas de capturas de movimentos
- Comandos de jogo: andar/correr, abaixar, mirar, atirar, recarregar, alternar arma, gadgets, uso, vault, melée, ping
- Física: colisão precisa, disparos com queda de projétil, penetração
- IAs com navegação de malha, lógica de equipe

## Netcode (beta.14)

- Arquitetura autoritativa com Node.js (sim a 60 Hz, snapshots a 20)
- Comandos binários compactos (32 bytes) com tick do servidor visto pelo cliente para compensação de lag
- Anel de histórico, rewind de até 21 ticks
- Snapshots interpolados no cliente
- Compressão no WebSocket, reconnexão segura

## Otimização (beta.14)

- Round 1 focado em geometria:
  - Antes: 272k triângulos/frame, 147k sombras
  - Depois: 91k-113k triângulos/frame, 48k-59k sombras
  - Texturas: 485 MB, inalterado (rodada 2 pendente)
- Occlusion culling de personagens, resolução adaptativa

## Estado atual

- beta.14: otimização rodada 1 + correções
- 100% jogável offline contra bots
- Multiplayer funcional com fluxo básico
- Licenças OK exceto 11 texturas (`ph_*`) 
- Pendente: texturas rodada 2, recargas por arma, trocar mapa, entrar em progresso

## Infra

- VM Oracle Cloud Always Free (Ubuntu)
- Caddy reverse-proxy com docker-compose
- Domínio `pontocego.duckdns.org` → IP fixo
- Deploy: copiar server.zip via Termius, docker compose up

## Repo

- Privado em `/tmp/w/repo`; público (sem assets restritos) em `/tmp/w/gitpub`
- Mensagens de commit terminam com coautoria + link da sessão Claude
- Regra de ouro: nunca assets restritos no público

## Histórico completo

- [NOTAS_DE_DESENVOLVIMENTO.md](docs/NOTAS_DE_DESENVOLVIMENTO.md) (49 KB)
- [BRIEF original](docs/BRIEF.md) (9 KB)

## Como Felipe trabalha

- Briefing no [BRIEF.md](docs/BRIEF.md), depois prompts ao Claude
- Nomes originais; assets CC com créditos; sem emojis; fixes em TODAS armas
- QA antes de cada entrega; trabalho autônomo sem perguntas quando pedido 
- Entregas com `SendUserFile` + resumo em português simples (sem "relevante" etc.)