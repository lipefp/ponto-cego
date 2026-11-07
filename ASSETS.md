# Assets: o que pode ir para um repositório público

O código deste projeto é MIT. Os assets (modelos, sons, texturas, animações) vêm de outros autores
e cada um tem a sua licença. Alguns permitem uso dentro de um jogo, mas **não** permitem distribuir
o arquivo solto, como acontece num repositório público. Esses ficam de fora da versão pública.

## Ficam de fora da versão pública

| Arquivos | Origem | Motivo |
|---|---|---|
| `assets/au_*` (62 sons) | Free Sounds Pack, Place Holder Assets (itch.io) | O autor proíbe redistribuir os arquivos soltos |
| `assets/op_swat.bin`, `op_anim.bin`, `op_body*.jpg`, `op_headc.jpg`, `op_headn.jpg` | Mixamo (Adobe) | Uso em jogo é livre; distribuir o arquivo bruto como asset avulso não é |
| `assets/fp_rifle.bin`, `fp_pistol.bin`, `fp_anim.json` | BarcodeGames (Fab) e pacotes CC-BY | Fab Standard License não permite redistribuir o conteúdo bruto |
| `assets/ph_*.webp` (11 texturas) | Texture_Pack_1 e matriax | A licença nunca foi confirmada |

O arquivo `PontoCego.html` gerado pelo build leva esses assets embutidos dentro do jogo. Isso é uso
em produto, que as licenças acima permitem. O que não vale é publicar os arquivos soltos.

## Podem ir para o repositório público

Os modelos de arma com CC-BY, os pacotes CC0 (Kenney, KayKit, Poly Haven, phaelax) e tudo que o
projeto gera por código. Os autores e os links estão em `CREDITOS.md`.

## Como gerar a versão pública

    sh tools/publico.sh ../PontoCego-publico

A cópia sai sem os arquivos da tabela e sem as notas internas de desenvolvimento (`docs/BRIEF.md`, `docs/NOTAS_DE_DESENVOLVIMENTO.md`) e alguns scripts de bancada em `test/`. Sem eles o jogo não faz o build completo: quem clonar precisa
trocá-los por arquivos próprios com os mesmos nomes, ou adaptar o carregamento. Escreva isso no README
da versão pública.

## Antes de abrir o repositório

- Confirme a licença das texturas (Texture_Pack_1, matriax) ou troque as fotos por texturas próprias.
- Releia as páginas de origem de cada pacote. Licenças podem mudar.
- Não envie `referencias/`, chaves SSH, tokens ou arquivos `.env`. O `.gitignore` já cobre isso.
