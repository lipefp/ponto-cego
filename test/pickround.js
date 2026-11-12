// Seleção de operador/ponto entre rodadas (fluxo R6): fase 'pick' → ops → spawn → prep da próxima rodada, com troca de lado
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
const gates=[];const gate=(n,ok,v)=>gates.push([n,!!ok,v]);
await p.addInitScript(()=>{window.__pcBan=true;});
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(3000);
// entra pelo fluxo real (JOGAR → ... → COMEÇAR) saltando para o ponto de escolha
await p.evaluate(()=>{const P=__pc;P.SAVE.startSide='atk';P.FLOW.side=null;P.FLOW.mode=null;P.FLOW.pickZone=0;P.FLOW.pickSite=null;P.flowGo();document.dispatchEvent(new Event('pointerlockerror'));});
await p.waitForTimeout(1500);
const r1=await p.evaluate(()=>({phase:__pc.G.phase,round:__pc.G.round,pb:__pc.G.pickBetween}));
gate('Partida iniciada pelo fluxo liga a escolha entre rodadas',r1.pb&&r1.round===1&&r1.phase==='prep',JSON.stringify(r1));
async function endAndPick(winner){
  await p.evaluate(w=>{const P=__pc;P.G.phase='action';P.endRound(w,'teste');},winner);
  await p.evaluate(()=>{const P=__pc;for(let k=0;k<60*8&&P.G.phase==='end';k++)P.simStep(P.SIM_DT);});
  await p.waitForTimeout(800);
  return p.evaluate(()=>({phase:__pc.G.phase,step:__pc.FLOW.step,mode:__pc.FLOW.mode,side:__pc.FLOW.side,paused:__pc.isPaused(),round:__pc.G.round,hud:__pc.HUD.pause.isVisible}));
}
const e1=await endAndPick('A');
gate('Fim da rodada 1 abre a escolha de operador (fase pick, pausado, sem tela de pausa)',e1.phase==='pick'&&e1.step==='ops'&&e1.mode==='round'&&e1.paused&&!e1.hud,JSON.stringify(e1));
await p.screenshot({path:'shots/qa/pick-ops.png'});
// escolhe outro operador do lado de ataque e confirma
const pre=await p.evaluate(()=>{const P=__pc;const o=P.OPS[P.FLOW.side].find(x=>x.id!==P.SAVE.atkOp);P.SAVE.atkOp=o.id;P.flowSpawn();return {op:o.id,step:P.FLOW.step};});
await p.waitForTimeout(500);await p.screenshot({path:'shots/qa/pick-spawn.png'});
gate('Confirmar operador leva à escolha do ponto',pre.step==='spawn',JSON.stringify(pre));
await p.evaluate(()=>{const P=__pc;P.FLOW.pickZone=1;P.flowGo();});await p.waitForTimeout(1500);
const r2=await p.evaluate(()=>{const P=__pc;return {phase:P.G.phase,round:P.G.round,paused:P.isPaused(),op:P.player.op.id,side:P.player.side,mode:P.FLOW.mode};});
gate('Ponto escolhido: rodada 2 começa na preparação, com o operador escolhido',r2.phase==='prep'&&r2.round===2&&r2.op===pre.op&&r2.mode===null,JSON.stringify(r2));
gate('Rodada 2: jogo retomado (fora de pausa)',!r2.paused,String(r2.paused));
// rodadas 2 e 3 → antes da 4ª troca de lado
await endAndPick('B');await p.evaluate(()=>{__pc.FLOW.pickZone=null;__pc.flowSpawn();__pc.flowGo();});await p.waitForTimeout(1000);
const e3=await endAndPick('A');
gate('Antes da rodada 4 o lado troca (ataque→defesa) e abre o banimento',e3.step==='ban'&&e3.side==='def'&&e3.round===3,JSON.stringify(e3));
await p.evaluate(()=>{const B=__pc.FLOW.ban;B.tiles[0].__choose();B.go.onPointerUpObservable.notifyObservers({});});
await p.waitForFunction(()=>__pc.FLOW.step==='ops',null,{timeout:20000,polling:100});
gate('Depois do banimento, a tela de operador do novo lado',await p.evaluate(()=>__pc.FLOW.step==='ops'&&__pc.FLOW.side==='def'),'');
await p.evaluate(()=>{const P=__pc;P.flowSpawn();P.FLOW.pickSite='C';P.flowGo();});await p.waitForTimeout(1500);
const r4=await p.evaluate(()=>{const P=__pc;return {round:P.G.round,side:P.player.side,site:P.G.siteKey,phase:P.G.phase};});
gate('Rodada 4: defesa e objetivo escolhido (C) aplicado',r4.round===4&&r4.side==='def'&&r4.site==='C'&&r4.phase==='prep',JSON.stringify(r4));
// tempo esgotado: confirma sozinho
await endAndPick('B');
await p.evaluate(()=>{__pc.FLOW.t=1;});await p.waitForFunction(()=>__pc.FLOW.step==='spawn',null,{timeout:6000});
await p.evaluate(()=>{__pc.FLOW.t=1;});await p.waitForFunction(()=>__pc.G.phase==='prep'&&__pc.G.round===5,null,{timeout:8000});
gate('Tempo esgotado confirma sozinho (operador → ponto → rodada)',true,'ok');
gate('Sem erros de JavaScript',errs.length===0,errs.join(' | ').slice(0,300));
let bad=0;console.log('\nQA — escolha entre rodadas\n');for(const [n,ok,v] of gates){console.log((ok?'PASSOU ':'REPROVOU ')+' '+n+'  →  '+v);if(!ok)bad++;}
console.log(bad?'\nPICK REPROVADO':'\nPICK APROVADO');await b.close();process.exit(bad?1:0);})();
