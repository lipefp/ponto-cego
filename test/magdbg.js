// depuração: por quadro da recarga, mostra para cada carregador do rig: visível, dist da âncora de repouso, dist da mão, grab/disc
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const id=process.env.ID||'rifle';const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:560,height:420},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:300000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;pl.pitch=0;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();});
const slot=await p.evaluate(id=>__pc.WEAPONS[id].slot,id);
const out=await p.evaluate(async([id,slot])=>{const P=__pc,pl=P.player;pl.cur=slot;pl.w[slot].id=id;pl.w[slot].mag=3;pl.w[slot].res=99;
 const step=dt=>{if(P.G&&P.G.phase!=="over"){P.G.phase="action";P.G.phaseT=100;}const n=Math.round(dt/P.SIM_DT);for(let i=0;i<n;i++)P.simStep(P.SIM_DT);P.updateCamera(dt);P.updateVM(dt);};
 for(let i=0;i<40;i++)step(1/36);P.game.render();P.INPUT.reload=true;step(1/36);P.INPUT.reload=false;const T=P.WEAPONS[id].reload,rows=[];
 for(let t=0;t<T;t+=T/16){for(let x=0;x<T/16;x+=1/36)step(1/36);const rig=P.FPV.cur;rows.push((t/T).toFixed(2)+' '+(rig.mg||[]).map(m=>(m.node.isEnabled()?'V':'-')+' dist'+(m.dist||0).toFixed(2)+' dh'+(m.dh||0).toFixed(2)+(m.grab?' G':'')+(m.disc?' D':'')).join(' | '));}
 return rows;},[id,slot]);
console.log(out.join('\n'));await b.close();})();
