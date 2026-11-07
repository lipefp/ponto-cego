# Correção das recargas em primeira pessoa (Ponto Cego 6.0.0-beta.9)

Tudo abaixo foi medido por scripts no jogo (`test/clipmap.js`, `test/anim_qa.js`, `test/relall.js`, `test/models_qa.js`) e conferido em imagens (`test/shots_reload.js`).

## 1. O que estava errado

- As recargas da beta.6 vinham de pacotes de animação de outros autores, copiados para o esqueleto do jogo. Os braços têm proporção diferente, então o punho torcia e os dedos saíam tortos.
- A recarga nativa do rig (a do ARX-07) já funcionava: mão no carregador, dedos inteiros, arma com a inclinação natural.

## 2. O que foi feito

- Todas as armas passaram a usar a lógica da recarga nativa do rig. `tools/make_native.py` gera um clipe por arma (`RN_<id>` normal e `RE_<id>` vazia) a partir dela.
- Cada arma tem ritmo próprio (pesos das 4 fases) e amplitude entre 0,90 e 1,00, então a recarga não é cópia exata da outra. O ARX-07 continua com o clipe nativo puro.
- A posição da arma na mão não mudou.
- O conversor antigo ganhou limites (giro da arma, punho e dedos). Ele não é mais usado nas recargas, mas fica no código-fonte.

## 3. Mapa final (id base → clipe)

| Arma | Modelo | Recarga | Recarga vazia | Origem da recarga | Clipe (s) | Código (s) | Velocidade |
|---|---|---|---|---|---|---|---|
| KR-9 | Pistol 2 | RN_pistol | RE_pistol | rig nativo, ritmo próprio | 2.83 | 2 | x1.42 |
| HC-45 | USP | RN_onca | RE_onca | rig nativo, ritmo próprio | 2.83 | 2.1 | x1.35 |
| SP-57 | Glock 19 | RN_pardal | RE_pardal | rig nativo, ritmo próprio | 2.83 | 2 | x1.42 |
| MP-22X | Skorpion | RN_abelha | RE_abelha | rig nativo, ritmo próprio | 2.83 | 2.2 | x1.29 |
| Rev-44 | Revólver | RN_jaguar | RE_jaguar | rig nativo, ritmo próprio | 2.83 | 2.9 | x0.98 |
| S-30 | MP7 | RN_smg | RE_smg | rig nativo, ritmo próprio | 3.67 | 2.3 | x1.59 |
| SMG-11 | MP5 | RN_marimbondo | RE_marimbondo | rig nativo, ritmo próprio | 3.67 | 2.2 | x1.67 |
| VX-45 | UMP | RN_cascavel | RE_cascavel | rig nativo, ritmo próprio | 3.67 | 2.4 | x1.53 |
| ARX-07 | M4 | Reload | Reload_Empty | rig nativo | 3.67 | 2.5 | x1.47 |
| J-56K | SCAR-L | RN_jararaca | RE_jararaca | rig nativo, ritmo próprio | 3.67 | 2.4 | x1.53 |
| AK-TY2 | AK-47 | RN_tupa | RE_tupa | rig nativo, ritmo próprio | 3.67 | 2.7 | x1.36 |
| PS-12 | Escopeta pump | RN_shotgun | RE_shotgun | rig nativo, ritmo próprio | 3.67 | 3.2 | x1.15 |
| RG-16 | Benelli semi | RN_ressaca | RE_ressaca | rig nativo, ritmo próprio | 3.67 | 3.4 | x1.08 |
| DM-65 | SVD | RN_dmr | RE_dmr | rig nativo, ritmo próprio | 3.67 | 2.8 | x1.31 |
| CK-55 | SS2 | RN_carcara | RE_carcara | rig nativo, ritmo próprio | 3.67 | 2.6 | x1.41 |
| BT-80 | M249 | RN_boitata | RE_boitata | rig nativo, ritmo próprio | 3.67 | 4.6 | x0.8 |

Nenhuma arma divide clipe com outra. O ARX-07 usa o nativo puro; as demais usam o nativo com ritmo e amplitude próprios.

O tempo manda: o clipe é esticado para durar exatamente o `reload` da arma (`t = progresso × duração do clipe` em `updateVM`).

## 4. Teste automático de animação

Resultado: 96 de 96 casos aprovados (cada arma, pura, com mira e com cano + empunhadura, recarga normal e vazia).

```
[SUCCESS] KR-9 -> RN_pistol ativado, 2.83/2.83 s do clipe em 2 s de jogo
[SUCCESS] KR-9 (vazia) -> RE_pistol ativado, 3.04/3.04 s do clipe em 2 s de jogo
[SUCCESS] KR-9 [red.none.none.0] -> RN_pistol ativado, 2.83/2.83 s do clipe em 2 s de jogo
[SUCCESS] KR-9 [red.none.none.0] (vazia) -> RE_pistol ativado, 3.04/3.04 s do clipe em 2 s de jogo
[SUCCESS] KR-9 [iron.sup.none.0] -> RN_pistol ativado, 2.83/2.83 s do clipe em 2 s de jogo
[SUCCESS] KR-9 [iron.sup.none.0] (vazia) -> RE_pistol ativado, 3.04/3.04 s do clipe em 2 s de jogo
[SUCCESS] HC-45 -> RN_onca ativado, 2.83/2.83 s do clipe em 2.1 s de jogo
[SUCCESS] HC-45 (vazia) -> RE_onca ativado, 3.04/3.04 s do clipe em 2.1 s de jogo
[SUCCESS] HC-45 [red.none.none.0] -> RN_onca ativado, 2.83/2.83 s do clipe em 2.1 s de jogo
[SUCCESS] HC-45 [red.none.none.0] (vazia) -> RE_onca ativado, 3.04/3.04 s do clipe em 2.1 s de jogo
[SUCCESS] HC-45 [iron.sup.none.0] -> RN_onca ativado, 2.83/2.83 s do clipe em 2.1 s de jogo
[SUCCESS] HC-45 [iron.sup.none.0] (vazia) -> RE_onca ativado, 3.04/3.04 s do clipe em 2.1 s de jogo
[SUCCESS] SP-57 -> RN_pardal ativado, 2.83/2.83 s do clipe em 2 s de jogo
[SUCCESS] SP-57 (vazia) -> RE_pardal ativado, 3.04/3.04 s do clipe em 2 s de jogo
[SUCCESS] SP-57 -> RN_pardal ativado, 2.83/2.83 s do clipe em 2 s de jogo
[SUCCESS] SP-57 (vazia) -> RE_pardal ativado, 3.04/3.04 s do clipe em 2 s de jogo
[SUCCESS] SP-57 [iron.sup.none.0] -> RN_pardal ativado, 2.83/2.83 s do clipe em 2 s de jogo
[SUCCESS] SP-57 [iron.sup.none.0] (vazia) -> RE_pardal ativado, 3.04/3.04 s do clipe em 2 s de jogo
[SUCCESS] MP-22X -> RN_abelha ativado, 2.83/2.83 s do clipe em 2.2 s de jogo
[SUCCESS] MP-22X (vazia) -> RE_abelha ativado, 3.04/3.04 s do clipe em 2.2 s de jogo
[SUCCESS] MP-22X [red.none.none.0] -> RN_abelha ativado, 2.83/2.83 s do clipe em 2.2 s de jogo
[SUCCESS] MP-22X [red.none.none.0] (vazia) -> RE_abelha ativado, 3.04/3.04 s do clipe em 2.2 s de jogo
[SUCCESS] MP-22X [iron.sup.none.0] -> RN_abelha ativado, 2.83/2.83 s do clipe em 2.2 s de jogo
[SUCCESS] MP-22X [iron.sup.none.0] (vazia) -> RE_abelha ativado, 3.04/3.04 s do clipe em 2.2 s de jogo
[SUCCESS] Rev-44 -> RN_jaguar ativado, 2.83/2.83 s do clipe em 2.9 s de jogo
[SUCCESS] Rev-44 (vazia) -> RE_jaguar ativado, 3.04/3.04 s do clipe em 2.9 s de jogo
[SUCCESS] Rev-44 [red.none.none.0] -> RN_jaguar ativado, 2.83/2.83 s do clipe em 2.9 s de jogo
[SUCCESS] Rev-44 [red.none.none.0] (vazia) -> RE_jaguar ativado, 3.04/3.04 s do clipe em 2.9 s de jogo
[SUCCESS] Rev-44 -> RN_jaguar ativado, 2.83/2.83 s do clipe em 2.9 s de jogo
[SUCCESS] Rev-44 (vazia) -> RE_jaguar ativado, 3.04/3.04 s do clipe em 2.9 s de jogo
[SUCCESS] S-30 -> RN_smg ativado, 3.67/3.67 s do clipe em 2.3 s de jogo
[SUCCESS] S-30 (vazia) -> RE_smg ativado, 3.83/3.83 s do clipe em 2.3 s de jogo
[SUCCESS] S-30 [red.none.none.0] -> RN_smg ativado, 3.67/3.67 s do clipe em 2.3 s de jogo
[SUCCESS] S-30 [red.none.none.0] (vazia) -> RE_smg ativado, 3.83/3.83 s do clipe em 2.3 s de jogo
[SUCCESS] S-30 [iron.sup.none.0] -> RN_smg ativado, 3.67/3.67 s do clipe em 2.3 s de jogo
[SUCCESS] S-30 [iron.sup.none.0] (vazia) -> RE_smg ativado, 3.83/3.83 s do clipe em 2.3 s de jogo
[SUCCESS] SMG-11 -> RN_marimbondo ativado, 3.67/3.67 s do clipe em 2.2 s de jogo
[SUCCESS] SMG-11 (vazia) -> RE_marimbondo ativado, 3.83/3.83 s do clipe em 2.2 s de jogo
[SUCCESS] SMG-11 [red.none.none.0] -> RN_marimbondo ativado, 3.67/3.67 s do clipe em 2.2 s de jogo
[SUCCESS] SMG-11 [red.none.none.0] (vazia) -> RE_marimbondo ativado, 3.83/3.83 s do clipe em 2.2 s de jogo
[SUCCESS] SMG-11 [iron.sup.vert.0] -> RN_marimbondo ativado, 3.67/3.67 s do clipe em 2.2 s de jogo
[SUCCESS] SMG-11 [iron.sup.vert.0] (vazia) -> RE_marimbondo ativado, 3.83/3.83 s do clipe em 2.2 s de jogo
[SUCCESS] VX-45 -> RN_cascavel ativado, 3.67/3.67 s do clipe em 2.4 s de jogo
[SUCCESS] VX-45 (vazia) -> RE_cascavel ativado, 3.83/3.83 s do clipe em 2.4 s de jogo
[SUCCESS] VX-45 [red.none.none.0] -> RN_cascavel ativado, 3.67/3.67 s do clipe em 2.4 s de jogo
[SUCCESS] VX-45 [red.none.none.0] (vazia) -> RE_cascavel ativado, 3.83/3.83 s do clipe em 2.4 s de jogo
[SUCCESS] VX-45 [iron.sup.vert.0] -> RN_cascavel ativado, 3.67/3.67 s do clipe em 2.4 s de jogo
[SUCCESS] VX-45 [iron.sup.vert.0] (vazia) -> RE_cascavel ativado, 3.83/3.83 s do clipe em 2.4 s de jogo
[SUCCESS] ARX-07 -> Reload ativado, 3.67/3.67 s do clipe em 2.5 s de jogo
[SUCCESS] ARX-07 (vazia) -> Reload_Empty ativado, 3.83/3.83 s do clipe em 2.5 s de jogo
[SUCCESS] ARX-07 [red.none.none.0] -> Reload ativado, 3.67/3.67 s do clipe em 2.5 s de jogo
[SUCCESS] ARX-07 [red.none.none.0] (vazia) -> Reload_Empty ativado, 3.83/3.83 s do clipe em 2.5 s de jogo
[SUCCESS] ARX-07 [iron.sup.vert.0] -> Reload ativado, 3.67/3.67 s do clipe em 2.5 s de jogo
[SUCCESS] ARX-07 [iron.sup.vert.0] (vazia) -> Reload_Empty ativado, 3.83/3.83 s do clipe em 2.5 s de jogo
[SUCCESS] J-56K -> RN_jararaca ativado, 3.67/3.67 s do clipe em 2.4 s de jogo
[SUCCESS] J-56K (vazia) -> RE_jararaca ativado, 3.83/3.83 s do clipe em 2.4 s de jogo
[SUCCESS] J-56K [red.none.none.0] -> RN_jararaca ativado, 3.67/3.67 s do clipe em 2.4 s de jogo
[SUCCESS] J-56K [red.none.none.0] (vazia) -> RE_jararaca ativado, 3.83/3.83 s do clipe em 2.4 s de jogo
[SUCCESS] J-56K [iron.sup.vert.0] -> RN_jararaca ativado, 3.67/3.67 s do clipe em 2.4 s de jogo
[SUCCESS] J-56K [iron.sup.vert.0] (vazia) -> RE_jararaca ativado, 3.83/3.83 s do clipe em 2.4 s de jogo
[SUCCESS] AK-TY2 -> RN_tupa ativado, 3.67/3.67 s do clipe em 2.7 s de jogo
[SUCCESS] AK-TY2 (vazia) -> RE_tupa ativado, 3.83/3.83 s do clipe em 2.7 s de jogo
[SUCCESS] AK-TY2 [red.none.none.0] -> RN_tupa ativado, 3.67/3.67 s do clipe em 2.7 s de jogo
[SUCCESS] AK-TY2 [red.none.none.0] (vazia) -> RE_tupa ativado, 3.83/3.83 s do clipe em 2.7 s de jogo
[SUCCESS] AK-TY2 [iron.sup.vert.0] -> RN_tupa ativado, 3.67/3.67 s do clipe em 2.7 s de jogo
[SUCCESS] AK-TY2 [iron.sup.vert.0] (vazia) -> RE_tupa ativado, 3.83/3.83 s do clipe em 2.7 s de jogo
[SUCCESS] PS-12 -> RN_shotgun ativado, 3.67/3.67 s do clipe em 3.2 s de jogo
[SUCCESS] PS-12 (vazia) -> RE_shotgun ativado, 3.83/3.83 s do clipe em 3.2 s de jogo
[SUCCESS] PS-12 [red.none.none.0] -> RN_shotgun ativado, 3.67/3.67 s do clipe em 3.2 s de jogo
[SUCCESS] PS-12 [red.none.none.0] (vazia) -> RE_shotgun ativado, 3.83/3.83 s do clipe em 3.2 s de jogo
[SUCCESS] PS-12 [iron.sup.none.0] -> RN_shotgun ativado, 3.67/3.67 s do clipe em 3.2 s de jogo
[SUCCESS] PS-12 [iron.sup.none.0] (vazia) -> RE_shotgun ativado, 3.83/3.83 s do clipe em 3.2 s de jogo
[SUCCESS] RG-16 -> RN_ressaca ativado, 3.67/3.67 s do clipe em 3.4 s de jogo
[SUCCESS] RG-16 (vazia) -> RE_ressaca ativado, 3.83/3.83 s do clipe em 3.4 s de jogo
[SUCCESS] RG-16 [red.none.none.0] -> RN_ressaca ativado, 3.67/3.67 s do clipe em 3.4 s de jogo
[SUCCESS] RG-16 [red.none.none.0] (vazia) -> RE_ressaca ativado, 3.83/3.83 s do clipe em 3.4 s de jogo
[SUCCESS] RG-16 [iron.sup.vert.0] -> RN_ressaca ativado, 3.67/3.67 s do clipe em 3.4 s de jogo
[SUCCESS] RG-16 [iron.sup.vert.0] (vazia) -> RE_ressaca ativado, 3.83/3.83 s do clipe em 3.4 s de jogo
[SUCCESS] DM-65 -> RN_dmr ativado, 3.67/3.67 s do clipe em 2.8 s de jogo
[SUCCESS] DM-65 (vazia) -> RE_dmr ativado, 3.83/3.83 s do clipe em 2.8 s de jogo
[SUCCESS] DM-65 [red.none.none.0] -> RN_dmr ativado, 3.67/3.67 s do clipe em 2.8 s de jogo
[SUCCESS] DM-65 [red.none.none.0] (vazia) -> RE_dmr ativado, 3.83/3.83 s do clipe em 2.8 s de jogo
[SUCCESS] DM-65 [iron.sup.vert.0] -> RN_dmr ativado, 3.67/3.67 s do clipe em 2.8 s de jogo
[SUCCESS] DM-65 [iron.sup.vert.0] (vazia) -> RE_dmr ativado, 3.83/3.83 s do clipe em 2.8 s de jogo
[SUCCESS] CK-55 -> RN_carcara ativado, 3.67/3.67 s do clipe em 2.6 s de jogo
[SUCCESS] CK-55 (vazia) -> RE_carcara ativado, 3.83/3.83 s do clipe em 2.6 s de jogo
[SUCCESS] CK-55 [red.none.none.0] -> RN_carcara ativado, 3.67/3.67 s do clipe em 2.6 s de jogo
[SUCCESS] CK-55 [red.none.none.0] (vazia) -> RE_carcara ativado, 3.83/3.83 s do clipe em 2.6 s de jogo
[SUCCESS] CK-55 [iron.sup.vert.0] -> RN_carcara ativado, 3.67/3.67 s do clipe em 2.6 s de jogo
[SUCCESS] CK-55 [iron.sup.vert.0] (vazia) -> RE_carcara ativado, 3.83/3.83 s do clipe em 2.6 s de jogo
[SUCCESS] BT-80 -> RN_boitata ativado, 3.67/3.67 s do clipe em 4.6 s de jogo
[SUCCESS] BT-80 (vazia) -> RE_boitata ativado, 3.83/3.83 s do clipe em 4.6 s de jogo
[SUCCESS] BT-80 [red.none.none.0] -> RN_boitata ativado, 3.67/3.67 s do clipe em 4.6 s de jogo
[SUCCESS] BT-80 [red.none.none.0] (vazia) -> RE_boitata ativado, 3.83/3.83 s do clipe em 4.6 s de jogo
[SUCCESS] BT-80 [iron.none.vert.0] -> RN_boitata ativado, 3.67/3.67 s do clipe em 4.6 s de jogo
[SUCCESS] BT-80 [iron.none.vert.0] (vazia) -> RE_boitata ativado, 3.83/3.83 s do clipe em 4.6 s de jogo
```

## 5. Armas validadas

KR-9 (pistol), HC-45 (onca), SP-57 (pardal), MP-22X (abelha), Rev-44 (jaguar), S-30 (smg), SMG-11 (marimbondo), VX-45 (cascavel), ARX-07 (rifle), J-56K (jararaca), AK-TY2 (tupa), PS-12 (shotgun), RG-16 (ressaca), DM-65 (dmr), CK-55 (carcara), BT-80 (boitata).

## 6. Limites

- Escopetas usam a recarga de carregador do rig, sem animação de cartucho um a um.
- Nas pistolas a arma fica baixa no meio da recarga (o clipe nativo gira a arma uns 60 graus).
- Os cinco ritmos por arma são variações do mesmo movimento. Não há pacote de animação novo.
- `weapons_qa` (tiro e balística) e `qa-browser` não foram rodados nesta versão; `qa-browser` trava neste ambiente.

## 7. Gráfico e desempenho (beta.9)

- SSAO removido: dobrava o custo de desenho da cena e borrava o chão.
- MSAA no lugar do FXAA (a textura não borra). Bloom e sombra do sol mais leves. Nitidez um pouco maior.
- Não consegui medir ganho em quadros por segundo: o ambiente de teste não tem GPU.

## 8. Mão na empunhadura vertical (beta.9)

- A mão esquerda ficava 2 a 3 cm atrás da empunhadura vertical. Agora ela cai sobre a empunhadura no ARX-07 e nas armas de classe SMG e LMG. Conferido em imagem com a empunhadura em 8 armas.
- Empurrar a mão mais para frente mostra a ponta aberta da manga, porque o braço do modelo é curto. Fica como limite.
