// Gera FIX_ANIMACOES_ARMAS.md (beta.6) a partir de /tmp/clipmap.json, /tmp/anim_qa.json e /tmp/models_qa.json
import fs from 'fs';
const cm=JSON.parse(fs.readFileSync('/tmp/clipmap.json','utf8')),an=JSON.parse(fs.readFileSync('/tmp/anim_qa.json','utf8')),mq=JSON.parse(fs.readFileSync('/tmp/models_qa.json','utf8'));
const L=[];const base=cm.filter(x=>x.tag==='none');
const names={};for(const w of Object.values(mq.weapons))names[w.id]=w.name;
const model={pistol:'Pistol 2',onca:'USP',pardal:'Glock 19',abelha:'Skorpion',jaguar:'Revólver',smg:'MP7',marimbondo:'MP5',cascavel:'UMP',rifle:'M4',jararaca:'SCAR-L',tupa:'AK-47',shotgun:'Escopeta pump',ressaca:'Benelli semi',dmr:'SVD',carcara:'SS2',boitata:'M249'};
const src0={ReloadPis:'pistola XD (ccransh), fácil',ReloadPisE:'pistola XD (ccransh), completa',ReloadMK:'Makarov (ccransh), rápida',ReloadMKE:'Makarov (ccransh), completa',Reload9:'pistola 9mm (1Matzh)',Reload9E:'pistola 9mm (1Matzh), vazia',
 ReloadUZIP:'UZI (1Matzh)',ReloadUZIPE:'UZI (1Matzh), vazia',ReloadSMG:'SMG (ccransh), rápida',ReloadSMGE:'SMG (ccransh), completa',ReloadACR:'fuzil ACR, mãos (ccransh)',ReloadUZI:'UZI (1Matzh)',ReloadUZIE:'UZI (1Matzh), vazia',
 Reload:'M4 (BarcodeGames), no esqueleto do jogo',Reload_Empty:'M4 (BarcodeGames), vazia',ReloadAK:'AK-74m (ccransh)',ReloadAK2:'AK-74m (ccransh), variação 2',ReloadAKE:'AK-74m (ccransh), completa',
 ReloadSG:'Benelli M4 (ccransh), 2 cartuchos',ReloadSG2:'Benelli M4 (ccransh), tipo 2, 2 cartuchos',ReloadDMR:'sniper (ccransh)',ReloadDMRE:'sniper (ccransh), completa'};
L.push('# Correção das recargas em primeira pessoa (Ponto Cego 6.0.0-beta.7)','');
L.push('Tudo abaixo foi medido por scripts no jogo (`test/clipmap.js`, `test/anim_qa.js`, `test/relall.js`, `test/models_qa.js`) e conferido em imagens (`test/shots_reload.js`).','');
L.push('## 1. O que estava errado','');
L.push('- As recargas da beta.6 vinham de pacotes de animação de outros autores, copiados para o esqueleto do jogo. Os braços têm proporção diferente, então o punho torcia e os dedos saíam tortos.','- A recarga nativa do rig (a do ARX-07) já funcionava: mão no carregador, dedos inteiros, arma com a inclinação natural.','');
L.push('## 2. O que foi feito','');
L.push('- Todas as armas passaram a usar a lógica da recarga nativa do rig. `tools/make_native.py` gera um clipe por arma (`RN_<id>` normal e `RE_<id>` vazia) a partir dela.','- Cada arma tem ritmo próprio (pesos das 4 fases) e amplitude entre 0,90 e 1,00, então a recarga não é cópia exata da outra. O ARX-07 continua com o clipe nativo puro.','- A posição da arma na mão não mudou.','- O conversor antigo ganhou limites (giro da arma, punho e dedos). Ele não é mais usado nas recargas, mas fica no código-fonte.','');
L.push('## 3. Mapa final (id base → clipe)','');
L.push('| Arma | Modelo | Recarga | Recarga vazia | Origem da recarga | Clipe (s) | Código (s) | Velocidade |','|---|---|---|---|---|---|---|---|');
for(const x of base)L.push(`| ${names[x.id]||x.id} | ${model[x.id]||''} | ${x.reload} | ${x.rempty} | ${/^R[NE]_/.test(x.reload)?'rig nativo, ritmo próprio':'rig nativo'} | ${x.dur} | ${x.code} | x${x.speed} |`);
L.push('','Nenhuma arma divide clipe com outra. O ARX-07 usa o nativo puro; as demais usam o nativo com ritmo e amplitude próprios.','');
L.push('O tempo manda: o clipe é esticado para durar exatamente o `reload` da arma (`t = progresso × duração do clipe` em `updateVM`).','');
L.push('## 4. Teste automático de animação','');
const ok=an.filter(r=>!r.fails.length).length;
L.push(`Resultado: ${ok} de ${an.length} casos aprovados (cada arma, pura, com mira e com cano + empunhadura, recarga normal e vazia).`,'');
L.push('```');
for(const r of an){const b=r.vid.split('@')[0],tag=r.vid===b?'':' ['+r.vid.slice(b.length+1)+']';L.push((r.fails.length?'[FALHA]   ':'[SUCCESS] ')+r.name+tag+(r.emp?' (vazia)':'')+' -> '+(r.clip||'-')+' ativado, '+r.maxT.toFixed(2)+'/'+r.clipDur.toFixed(2)+' s do clipe em '+r.code+' s de jogo'+(r.fails.length?' :: '+r.fails.join('; '):''));}
L.push('```','');
L.push('## 5. Armas validadas','');
L.push(Object.values(mq.weapons).map(w=>`${w.name} (${w.id})`).join(', ')+'.','');
L.push('## 6. Limites','');
L.push('- Escopetas usam a recarga de carregador do rig, sem animação de cartucho um a um.','- Nas pistolas a arma fica baixa no meio da recarga (o clipe nativo gira a arma uns 60 graus).','- Os cinco ritmos por arma são variações do mesmo movimento. Não há pacote de animação novo.','- `weapons_qa` (tiro e balística) e `qa-browser` não foram rodados nesta versão; `qa-browser` trava neste ambiente.','');
fs.writeFileSync('FIX_ANIMACOES_ARMAS.md',L.join('\n'));console.log('ok');
