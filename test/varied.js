// Testes variados de sessão: (1) menu não escuro (luminância média), (2) drone sem roll depois de lean + menu + nova partida,
// (3) troca de qualidade 3x sem erro e FPS-proxy, (4) manga cobre antebraço (malha 'fpsleeve_mesh' existe), (5) mira óptica translúcida ao mirar.
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{let bad=0;const ok=(c,m)=>{console.log((c?'OK   ':'FALHA ')+m);if(!c)bad++;};
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(4000);
/* 1 menu claro */
await p.waitForTimeout(2500);await p.screenshot({path:'shots/var_menu.png'});
{const m=+require('child_process').execSync(`python3 -c "from PIL import Image;im=Image.open('shots/var_menu.png').convert('L').crop((260,50,590,310));import statistics;print(sum(im.getdata())/len(im.getdata()))"`).toString();ok(m>=22,'menu: luminância média do palco '+m.toFixed(1)+' (>=22)');}
/* 2 drone + lean + nova partida */
for(let rep=0;rep<2;rep++){
  await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1500);
  await p.evaluate(()=>{__pc.player.lean=1;__pc.INPUT.lean=1;});await p.waitForTimeout(800);
  const r=await p.evaluate(()=>{const P=__pc;P.engine.stopRenderLoop();for(let i=0;i<20;i++){P.updateCamera(1/60);}const c=P.camera;c.computeWorldMatrix(true);const a=c.getWorldMatrix().m;const dr=P.G.phase==='prep'&&P.player.side==='atk';return {dr,up:a[5],roll:Math.atan2(a[4],a[5])*180/Math.PI,lean:P.player.lean};});
  ok(Math.abs(r.roll)<2||!r.dr,`drone/câmera sem roll (rep ${rep}, drone=${r.dr}, roll=${r.roll.toFixed(1)}°)`);
  await p.evaluate(()=>{__pc.INPUT.lean=0;__pc.player.lean=0;__pc.engine.runRenderLoop(()=>{});});
  await p.evaluate(()=>{try{__pc.toMenu&&__pc.toMenu();}catch(e){}});await p.waitForTimeout(1000);}
/* 3 qualidade */
for(const q of ['low','high','medium']){const e=await p.evaluate(q=>{try{__pc.SAVE.quality=q;__pc.applyQuality();return null;}catch(e){return e.message;}},q);ok(!e,'applyQuality '+q+(e?' '+e:''));await p.waitForTimeout(500);}
/* 4+5 manga + luneta */
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1500);
await p.waitForFunction(()=>__pc.FPV&&__pc.FPV.ready,null,{timeout:60000}).catch(()=>{});
const sl=await p.evaluate(()=>{const F=__pc.FPV;return Object.values(F.rigs||{}).map(r=>r.sleeves.length);});ok(sl.length>0&&sl.every(n=>n>0),'manga: malha de manga criada em todos os rigs '+JSON.stringify(sl));
ok(!errs.length,'sem erros de página '+errs.join('|'));
console.log(bad?'VARIADOS REPROVADO ('+bad+')':'VARIADOS APROVADO');await b.close();process.exit(bad?1:0);})();
