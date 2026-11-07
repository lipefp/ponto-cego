// sensação de movimento: tempo até 90% da velocidade e tempo para parar (ms)
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:480,height:300},offline:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const P=__pc,pl=P.player,I=P.INPUT;for(let i=0;i<60*46;i++)P.simStep(P.SIM_DT);pl.hp=1e6;P.engine.stopRenderLoop();
 const run=()=>{if(P.G.phase!=='over'){P.G.phase='action';P.G.phaseT=100;}P.simStep(P.SIM_DT);};
 pl.pos.x=40;pl.pos.z=28;pl.vel.set(0,0,0);I.fwd=1;I.side=0;let max=0;const v=[];for(let i=0;i<120;i++){run();const s=Math.hypot(pl.vel.x,pl.vel.z);max=Math.max(max,s);v.push(s);}
 const t90=v.findIndex(s=>s>=.9*max);I.fwd=0;let ts=-1;for(let i=0;i<120;i++){run();if(Math.hypot(pl.vel.x,pl.vel.z)<.05){ts=i;break;}}
 return {vmax:+max.toFixed(2),t90ms:Math.round((t90+1)*1000/60),stopms:Math.round((ts+1)*1000/60)};});
console.log(JSON.stringify(r));const ok=r.t90ms<=90&&r.stopms<=200;console.log(errs.join('\n'));console.log(ok&&!errs.length?'MOVIMENTO APROVADO':'MOVIMENTO REPROVADO');await b.close();process.exit(ok&&!errs.length?0:1);})();
