#!/bin/bash
# QA de release: roda TUDO antes de entregar uma versão. Uso: tools/qa-release.sh   (falha = não entregar)
cd "$(dirname "$0")/.."; LOG=${QA_LOG:-qa-release.log}; : > "$LOG"; FAIL=0
step(){ local n="$1"; shift; echo "== $n" | tee -a "$LOG"; if timeout ${QA_T:-1500} "$@" >>"$LOG" 2>&1; then echo "   ok" | tee -a "$LOG"; else echo "   FALHOU ($n)" | tee -a "$LOG"; FAIL=1; fi; }
out=$(node tools/build.mjs --test 2>&1); echo "$out" | tail -3 >> "$LOG"; if echo "$out" | grep -qE "ERRO|abort"; then echo "BUILD FALHOU"; echo "$out"; exit 1; fi
out=$(node tools/build.mjs 2>&1); if echo "$out" | grep -qE "ERRO|abort"; then echo "BUILD FINAL FALHOU"; echo "$out"; exit 1; fi
step "qa.js 40 rodadas" node test/qa.js 60
step "qa-browser (fluxo real)" node test/qa-browser.js
step "net ida-e-volta" node test/net.js
step "audio" node test/audio.js
step "audio no jogo" node test/audio_game.js
step "banco de dados" node test/bank.js
step "fluxo de partida" node test/flow.js
step "skins" node test/skins.js
step "recargas de TODAS as armas" node test/relall.js
step "escolha entre rodadas" node test/pickround.js
step "ADS em todas as armas e miras" node test/adsall.js
step "inclinação (lean)" node test/lean.js '[["rifle",0,1.2],["rifle",1,1.2],["pistol",-1,1.2],["smg",1,1.2]]'
step "lean não inverte a câmera" node test/lean_up.js
step "testes variados (menu claro, drone sem roll, qualidade, manga)" node test/varied.js
step "opacidade das miras" node test/sightop.js
step "sorteio de lado e prorrogação" node test/coin.js
step "carregador sai da arma ao recarregar" node test/magmove.js
step "empunhadura de todas as armas" node test/holdqa.js
step "resposta do movimento" node test/movefeel.js
step "gadget em primeira pessoa" node test/gadfp.js
step "fluxo de menu isolado (banimento/operador)" node test/flowqa.js
grep -nE "FALHA|FAIL|REPROVAD|Error" "$LOG" | head -20
[ $FAIL = 0 ] && echo "QA APROVADA" || echo "QA REPROVADA — ver $LOG"; exit $FAIL
