#!/bin/sh
# Gera uma cópia do repositório sem os assets que não podem ser redistribuídos.
# Uso: sh tools/publico.sh ../PontoCego-publico
set -e
DEST="${1:?informe a pasta de destino}"
mkdir -p "$DEST"
[ -z "$(ls -A "$DEST")" ] || { echo "A pasta $DEST não está vazia."; exit 1; }
# a lista tem curingas (au_*), então a exclusão usa o tar com --wildcards
tar cf - --exclude-from=tools/assets-restritos.txt --exclude=./node_modules --exclude=./dist --exclude=./.git . | tar xf - -C "$DEST"
echo "Cópia pública criada em $DEST (sem sons, Mixamo, mãos em 1ª pessoa e fotos de textura)."
echo "Leia ASSETS.md: lá está como colocar esses arquivos de volta ou trocá-los."
