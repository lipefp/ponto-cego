// Fotos da recarga: node test/shots_reload.js id1,id2 0.2,0.4,0.6,0.8  (env VAR=sg:vert para empunhadura, W=largura)
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const W=+(process.env.W||960),H=Math.round(W*9/16);
const p=await (await b.newContext({viewport:{width:W,height:H},offline:true})).newPage();p.setDefaultTimeout(600000);p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;pl.pitch=0;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();});
const ids=(process.argv[2]||'smg').split(','),fr=(process.argv[3]||'0,.25,.5,.75').split(',').map(Number),grip=process.env.GRIP||'none',empty=process.env.EMPTY==='1';
for(const id of ids){
 for(const f of fr){
  await p.evaluate(async([id,f,grip,empty,BAR])=>{const P=__pc,pl=P.player,W=P.WEAPONS[id],slot=W.slot;
   const vid=(grip==='none'&&BAR==='none')?id:P.wVariant(id,{sight:'iron',barrel:BAR,grip,laser:0});
   const step=dt=>{if(P.G.phase!=='over'){P.G.phase='action';P.G.phaseT=100;}P.simStep(P.SIM_DT);P.updateCamera(dt);P.updateVM(dt);};
   pl.w[slot]={id:vid,mag:empty?0:Math.max(1,W.mag-8),res:99};pl.cur=slot;P.INPUT.ads=false;for(let i=0;i<100;i++)step(1/60);
   for(let k=0;k<400;k++){P.game.render();if(P.FPV.cur.w.g.getChildMeshes().every(m=>m.isReady(true)))break;await new Promise(r=>setTimeout(r,40));}
   if(f>0){P.INPUT.reload=true;step(1/60);P.INPUT.reload=false;const n=Math.round(f*W.reload*60);for(let i=0;i<n;i++)step(1/60);}
   {const w=P.FPV.cur.w;for(let k=0;k<400;k++){P.game.render();if(w.g.getChildMeshes().every(m=>m.isReady(true)))break;await new Promise(r=>setTimeout(r,40));}}
   P.game.render();},[id,f,grip,empty,process.env.BAR||'none']);
  await p.screenshot({path:`/tmp/b_${process.env.BAR}_${id}${grip!=='none'?'_'+grip:''}${empty?'_E':''}_${Math.round(f*100)}.png`});
 }}
await b.close();})();
