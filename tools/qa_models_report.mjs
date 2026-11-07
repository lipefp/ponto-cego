import fs from 'fs';
const d=JSON.parse(fs.readFileSync('/tmp/models_qa.json','utf8'));
const W=Object.values(d.weapons),G=Object.values(d.gadgets);
const L=[];const P=x=>x.fails.length?'Falhou':'Passou';
L.push('# QA Ponto Cego: modelos 3D, mãos, recarga e gadgets','');
L.push(`Teste automático (\`test/models_qa.js\`), Chromium com SwiftShader, 640x360. Armas: ${W.filter(x=>!x.fails.length).length}/${W.length} passaram. Gadgets: ${G.filter(x=>!x.fails.length).length}/${G.length} passaram. Erros de console: ${d.errors.length}.`,'');
L.push('## Armas','','| Arma | Classe | Malhas | Vértices | Tamanho (m) | Mão esq. → apoio | Mão dir. → empunhadura | Desvio da mira | Recarga (tática / vazia) | Tela coberta | Resultado |','|---|---|---|---|---|---|---|---|---|---|---|');
for(const w of W){const t=w.reload?.tat,v=w.reload?.vazia;L.push(`| ${w.name||w.id} | ${w.cls||''} | ${w.meshes??''} | ${w.verts??''} | ${(w.size||[]).join(' x ')} | ${w.dL??''} | ${w.dR??''} | ${(w.adsOff||[]).join(' / ')} | ${t?t.doneAt+' s / '+v.doneAt+' s (config '+t.cfg+' s)':''} | ${w.reload?.coverage!=null?Math.round(w.reload.coverage*100)+'%':''} | ${P(w)} |`);}
L.push('','Limites: mão a até 0,09 m do ponto de apoio e da empunhadura; mira a menos de 12% da largura do centro; recarga termina dentro de 25% do tempo configurado; sem carregador solto; arma e braços ocupam até 30% da tela durante a recarga; mão esquerda fora da tela em até 35% da recarga (45% em pistolas e revólver, que buscam o carregador no cinto; puxar a mão para dentro da tela nelas cobria até 56% da tela com o antebraço).','');
L.push('## Gadgets na mão','','| Gadget | Arma na mão | Apareceu | Distância à mão (m) | Tamanho (m) | Arma voltou | Resultado |','|---|---|---|---|---|---|---|');
for(const g of G)for(const [wid,o] of Object.entries(g.perWeapon||{}))L.push(`| ${g.kind} | ${wid} | ${o.sawHeld?'sim':'não'} | ${o.fitDist} | ${o.size} | ${o.gunBack?'sim':'não'} | ${g.fails.some(f=>f.startsWith(wid))?'Falhou':'Passou'} |`);
L.push('','## Falhas','');
const F=[...W.flatMap(w=>w.fails.map(f=>`- ${w.name||w.id}: ${f}`)),...G.flatMap(g=>g.fails.map(f=>`- gadget ${g.kind}: ${f}`))];
L.push(F.length?F.join('\n'):'Nenhuma falha.','','## Avisos','');
const N=W.flatMap(w=>(w.notes||[]).map(n=>`- ${w.name||w.id}: ${n}`));L.push(N.length?N.join('\n'):'Nenhum.','','## Log de erros do console','');
L.push(d.errors.length?d.errors.map(e=>'- '+e).join('\n'):'Sem erros (avisos de SwiftShader sobre ReadPixels foram ignorados).','');
fs.writeFileSync('QA_REPORT_MODELOS_3D.md',L.join('\n'));console.log(F.length+' falhas');
