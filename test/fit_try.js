// Testa offsets de encaixe sem recompilar: node test/fit_try.js pistol,onca '[{"dy":-.02},{"dy":-.04}]' [yaw]
// (A e B têm a mesma classe; alterna entre os dois para forçar a remontagem da arma com o offset novo.)
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(600000);p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
const [A,Bw]=process.argv[2].split(','),tries=JSON.parse(process.argv[3]);const yaw=+(process.argv[4]||3.6);
await p.evaluate(yaw=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;pl.yaw=yaw;pl.pitch=0;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();},yaw);
let n=0;for(const t of tries){
 await p.evaluate(async([A,Bw,t,n])=>{const P=__pc,pl=P.player,id=n%2?Bw:A,W=P.WEAPONS[id],slot=W.slot;const cls=W.cls;P.FPV_CLS[cls]=t;
  const step=dt=>{if(P.G.phase!=='over'){P.G.phase='action';P.G.phaseT=100;}P.simStep(P.SIM_DT);P.updateCamera(dt);P.updateVM(dt);};
  pl.w[slot]={id,mag:W.mag,res:99};pl.cur=slot;P.INPUT.ads=false;for(let i=0;i<100;i++)step(1/60);
  for(let k=0;k<400;k++){P.game.render();if(P.FPV.cur.w.g.getChildMeshes().every(m=>m.isReady(true)))break;await new Promise(r=>setTimeout(r,40));}P.game.render();},[A,Bw,t,n]);
 await p.screenshot({path:`shots/fit_${A}_${n}.png`});n++;}
await b.close();})();
