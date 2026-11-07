const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const [VW,VH]=(process.env.VP||'640x360').split('x').map(Number);
const p=await (await b.newContext({viewport:{width:VW,height:VH},offline:true})).newPage();p.setDefaultTimeout(600000);const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;__pc.VM.noHolster=true;__pc.drone.active=false;__pc.drone.alive=false;__pc.engine.stopRenderLoop();});
const id=process.env.W||'boitata';
for(const st of (process.env.ST||'hip,ads,rel').split(',')){
await p.evaluate(([id,st])=>{const P=__pc,pl=P.player,slot=P.WEAPONS[id].slot;pl.w[slot]={id,mag:80,res:160};pl.cur=slot;pl.ads=st==='ads'?1:0;pl.reloadT=0;pl.yaw=1.2;pl.pitch=0;
  const stp=()=>{P.updateCamera(1/60);P.updateVM(1/60);};for(let i=0;i<90;i++)stp();
  if(st==='rel'){pl.w[slot].mag=0;P.INPUT.reload=true;for(let i=0;i<150;i++){stp();P.INPUT.reload=false;}}P.updateHUD(1/60);P.game.render();},[id,st]);
await p.screenshot({path:(process.env.OUT||'.')+'/'+id+'_'+st+'.png'});}
console.log(errs.join('\n')||'ok');await b.close();})();
