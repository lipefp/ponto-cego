# QA Ponto Cego: modelos 3D, mãos, recarga e gadgets

Teste automático (`test/models_qa.js`), Chromium com SwiftShader, 640x360. Armas: 16/16 passaram. Gadgets: 9/9 passaram. Erros de console: 0.

## Armas

| Arma | Classe | Malhas | Vértices | Tamanho (m) | Mão esq. → apoio | Mão dir. → empunhadura | Desvio da mira | Recarga (tática / vazia) | Tela coberta | Resultado |
|---|---|---|---|---|---|---|---|---|---|---|
| KR-9 | pistol | 24 | 12682 | 0.136 x 0.083 x 0.077 | 0.05 | 0.048 | 0.001 / 0.001 | 2 s / 2 s (config 2 s) | 10% | Passou |
| HC-45 | pistol | 4 | 6285 | 0.124 x 0.08 x 0.074 | 0.05 | 0.048 | 0.001 / 0.003 | 2.1 s / 2.1 s (config 2.1 s) | 10% | Passou |
| SP-57 | pistol | 11 | 9755 | 0.123 x 0.096 x 0.072 | 0.05 | 0.048 | 0 / -0.003 | 2 s / 2 s (config 2 s) | 10% | Passou |
| MP-22X | mp | 3 | 5402 | 0.168 x 0.095 x 0.093 | 0.05 | 0.048 | -0.001 / -0.003 | 2.2 s / 2.2 s (config 2.2 s) | 15% | Passou |
| Rev-44 | rev | 2 | 8870 | 0.166 x 0.077 x 0.085 | 0.05 | 0.048 | -0.001 / 0.003 | 2.9 s / 2.9 s (config 2.9 s) | 9% | Passou |
| S-30 | smg | 6 | 27650 | 0.396 x 0.123 x 0.188 | 0.052 | 0.084 | -0.001 / 0.004 | 2.3 s / 2.3 s (config 2.3 s) | 13% | Passou |
| SMG-11 | smg | 6 | 5373 | 0.402 x 0.171 x 0.189 | 0.052 | 0.084 | -0.001 / -0.004 | 2.2 s / 2.2 s (config 2.2 s) | 13% | Passou |
| VX-45 | smg | 6 | 13829 | 0.417 x 0.15 x 0.204 | 0.052 | 0.084 | -0.001 / 0.001 | 2.4 s / 2.4 s (config 2.4 s) | 14% | Passou |
| ARX-07 | ar | 11 | 21915 | 0.408 x 0.157 x 0.193 | 0.052 | 0.084 | -0.001 / -0.003 | 2.5 s / 2.5 s (config 2.5 s) | 21% | Passou |
| J-56K | ar | 6 | 18192 | 0.56 x 0.17 x 0.251 | 0.052 | 0.084 | -0.001 / 0.005 | 2.4 s / 2.4 s (config 2.4 s) | 13% | Passou |
| AK-TY2 | ar | 5 | 24328 | 0.562 x 0.151 x 0.248 | 0.052 | 0.084 | -0.001 / -0.006 | 2.7 s / 2.7 s (config 2.7 s) | 14% | Passou |
| PS-12 | sg | 3 | 12564 | 0.553 x 0.11 x 0.245 | 0.05 | 0.081 | 0 / -0.001 | 3.2 s / 3.2 s (config 3.2 s) | 11% | Passou |
| RG-16 | sgs | 10 | 20041 | 0.559 x 0.133 x 0.247 | 0.05 | 0.081 | 0.001 / -0.004 | 3.4 s / 3.4 s (config 3.4 s) | 12% | Passou |
| DM-65 | dmr | 7 | 16047 | 0.57 x 0.121 x 0.249 | 0.052 | 0.084 | -0.002 / 0.002 | 2.8 s / 2.8 s (config 2.8 s) | 13% | Passou |
| CK-55 | dmr | 14 | 19174 | 0.467 x 0.184 x 0.212 | 0.052 | 0.084 | -0.001 / -0.005 | 2.6 s / 2.6 s (config 2.6 s) | 13% | Passou |
| BT-80 | lmg | 6 | 12962 | 0.437 x 0.149 x 0.195 | 0.037 | 0.06 | 0 / -0.002 | 4.6 s / 4.6 s (config 4.6 s) | 11% | Passou |

Limites: mão a até 0,09 m do ponto de apoio e da empunhadura; mira a menos de 12% da largura do centro; recarga termina dentro de 25% do tempo configurado; sem carregador solto; arma e braços ocupam até 30% da tela durante a recarga; mão esquerda fora da tela em até 35% da recarga (45% em pistolas e revólver, que buscam o carregador no cinto; puxar a mão para dentro da tela nelas cobria até 56% da tela com o antebraço).

## Gadgets na mão

| Gadget | Arma na mão | Apareceu | Distância à mão (m) | Tamanho (m) | Arma voltou | Resultado |
|---|---|---|---|---|---|---|
| breach | rifle | sim | 0.055 | 0.229 | sim | Passou |
| breach | pistol | sim | 0.049 | 0.206 | sim | Passou |
| breach | smg | sim | 0.055 | 0.229 | sim | Passou |
| frag | rifle | sim | 0.045 | 0.098 | sim | Passou |
| frag | pistol | sim | 0.04 | 0.087 | sim | Passou |
| frag | smg | sim | 0.045 | 0.098 | sim | Passou |
| pulse | rifle | sim | 0.055 | 0.083 | sim | Passou |
| pulse | pistol | sim | 0.049 | 0.074 | sim | Passou |
| pulse | smg | sim | 0.055 | 0.083 | sim | Passou |
| thermal | rifle | sim | 0.044 | 0.38 | sim | Passou |
| thermal | pistol | sim | 0.039 | 0.34 | sim | Passou |
| thermal | smg | sim | 0.044 | 0.38 | sim | Passou |
| flash | rifle | sim | 0.045 | 0.057 | sim | Passou |
| flash | pistol | sim | 0.04 | 0.05 | sim | Passou |
| flash | smg | sim | 0.045 | 0.057 | sim | Passou |
| shield | rifle | sim | 0.152 | 0.664 | sim | Passou |
| shield | pistol | sim | 0.134 | 0.588 | sim | Passou |
| shield | smg | sim | 0.152 | 0.664 | sim | Passou |
| impact | rifle | sim | 0.045 | 0.069 | sim | Passou |
| impact | pistol | sim | 0.04 | 0.061 | sim | Passou |
| impact | smg | sim | 0.045 | 0.069 | sim | Passou |
| wire | rifle | sim | 0.084 | 0.839 | sim | Passou |
| wire | pistol | sim | 0.079 | 0.745 | sim | Passou |
| wire | smg | sim | 0.084 | 0.839 | sim | Passou |
| jammer | rifle | sim | 0.076 | 0.282 | sim | Passou |
| jammer | pistol | sim | 0.068 | 0.254 | sim | Passou |
| jammer | smg | sim | 0.076 | 0.282 | sim | Passou |

## Falhas

Nenhuma falha.

## Avisos

- S-30: osso da mão direita abaixo da borda da tela em repouso (pulso); só aviso
- SMG-11: osso da mão direita abaixo da borda da tela em repouso (pulso); só aviso
- VX-45: osso da mão direita abaixo da borda da tela em repouso (pulso); só aviso
- ARX-07: osso da mão direita abaixo da borda da tela em repouso (pulso); só aviso
- J-56K: osso da mão direita abaixo da borda da tela em repouso (pulso); só aviso
- AK-TY2: osso da mão direita abaixo da borda da tela em repouso (pulso); só aviso
- PS-12: osso da mão direita abaixo da borda da tela em repouso (pulso); só aviso
- RG-16: osso da mão direita abaixo da borda da tela em repouso (pulso); só aviso
- DM-65: osso da mão direita abaixo da borda da tela em repouso (pulso); só aviso
- CK-55: osso da mão direita abaixo da borda da tela em repouso (pulso); só aviso
- BT-80: osso da mão direita abaixo da borda da tela em repouso (pulso); só aviso

## Log de erros do console

Sem erros (avisos de SwiftShader sobre ReadPixels foram ignorados).
