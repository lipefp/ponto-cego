const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();});
const ids=(await p.evaluate(()=>__pc.WLIST)).filter(x=>!process.env.ONLY||process.env.ONLY.split(',').includes(x));
for(const id of ids){
 const r=await p.evaluate(async([id,BAR])=>{const P=__pc,pl=P.player,W=P.WEAPONS[id],slot=W.slot;
  const vid=BAR==='none'?id:P.wVariant(id,{sight:'iron',barrel:BAR,grip:'none',laser:0});
  pl.w[slot]={id:vid,mag:W.mag,res:99};pl.cur=slot;for(let i=0;i<100;i++){if(P.G.phase!=='over'){P.G.phase='action';P.G.phaseT=100;}P.simStep(P.SIM_DT);P.updateCamera(1/60);P.updateVM(1/60);}
  for(let k=0;k<200;k++){P.game.render();const w=P.FPV&&P.FPV.cur&&P.FPV.cur.w;if(w&&w.g.getChildMeshes().every(m=>m.isReady(true)))break;await new Promise(r=>setTimeout(r,30));}
  const w=P.FPV.cur.w;const f=v=>v&&[v.x,v.y,v.z].map(x=>+x.toFixed(3));return {grip:f(w.grip),fore:f(w.fore),tip:f(w.tip),hold:w.hold,mag:w.magHome&&f(w.magHome)};},[id,process.env.BAR||'none']);
 console.log(id,JSON.stringify(r));}
await b.close();})();
