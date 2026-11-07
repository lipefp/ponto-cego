// mede o custo de renderização por nível de qualidade (swiftshader: serve só para comparar níveis)
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(900000);const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;__pc.drone.active=false;__pc.drone.alive=false;__pc.engine.stopRenderLoop();});
for(const q of (process.env.QS||'high,medium,low,min,high').split(',')){
  const r=await p.evaluate(async([q,WU])=>{const P=__pc;P.SAVE.quality=q;P.applyQuality();for(let i=0;i<WU*8;i++){const t=performance.now();P.updateCamera(1/60);P.updateVM(1/60);P.game.render();if(i>=WU&&performance.now()-t<(P.engine.getRenderWidth()>700?60:30))break;}
    const t0=performance.now();const N=40;for(let i=0;i<N;i++){P.updateCamera(1/60);P.updateVM(1/60);P.updateHUD(1/60);P.game.render();}return {ms:(performance.now()-t0)/N,hs:P.engine.getHardwareScalingLevel(),w:P.engine.getRenderWidth()};},[q,+(process.env.WU||25)]);
  console.log(q.padEnd(7),r.ms.toFixed(0)+' ms/frame','escala',r.hs,'largura',r.w);
  await p.screenshot({path:(process.env.OUT||'.')+'/q_'+q+'.png'});}
console.log(errs.join('\n')||'sem erros');await b.close();})();
