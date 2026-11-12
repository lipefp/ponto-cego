#!/usr/bin/env bash
# Prepara pacotes .glb para o jogo (Linux/Mac). Requer Node.js.
#   npm i -g @gltf-transform/cli obj2gltf   e, na pasta tools/: npm i @gltf-transform/core @gltf-transform/extensions
# Uso: tools/preparar_modelos.sh nome_do_pacote arquivo1.glb arquivo2.glb ...
#   - cada arquivo vira um "molde" com o nome do arquivo (ex.: desk.glb -> "desk")
#   - junta tudo num só .glb, remove duplicatas, solda vértices e quantiza (sem Draco/Meshopt:
#     o jogo não precisa de decodificador extra e continua 100% offline)
set -e
P=$1; shift
TMP=$(mktemp -d)
for f in "$@"; do cp "$f" "$TMP/"; done
node "$(dirname "$0")/wrap.js" "$TMP"/*.glb
gltf-transform merge "$TMP"/*.glb "$TMP/m.glb" --merge-scenes
gltf-transform dedup "$TMP/m.glb" "$TMP/a.glb"
gltf-transform prune "$TMP/a.glb" "$TMP/b.glb"
gltf-transform weld "$TMP/b.glb" "$TMP/c.glb"
gltf-transform quantize "$TMP/c.glb" "assets/$P.glb"
ls -la "assets/$P.glb"
echo "Pronto. Rode: python3 build.py  (o .glb é embutido em base64 no HTML)"
# OBJ -> GLB:  obj2gltf -i modelo.obj -o modelo.glb -b
# Base64 manual (se quiser ver): Linux/Mac: base64 -w 0 assets/$P.glb > $P.txt  · Windows: certutil -encode assets\\$P.glb $P.txt
