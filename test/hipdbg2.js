const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(900000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;for(const a of __pc.agents)if(a!==pl)a.hp=1e6;pl.pos.x=40;pl.pos.z=28;__pc.VM.noHolster=true;__pc.drone.active=false;__pc.drone.alive=false;__pc.engine.stopRenderLoop();__pc.G.phase='action';});
for(const id of (process.env.IDS||'pistol').split(',')){
await p.evaluate((id)=>{const P=__pc,pl=P.player,w=P.WEAPONS[id],slot=w.slot;pl.w[slot]={id,mag:w.mag,res:w.res};pl.cur=slot;pl.ads=0;pl.yaw=1.2;pl.pitch=0;for(let i=0;i<30;i++){P.updateCamera(1/60);P.updateVM(1/60);}},id);
await p.waitForTimeout(600);
const r=await p.evaluate(()=>{const P=__pc;for(let i=0;i<150;i++){P.updateCamera(1/60);P.updateVM(1/60);}P.updateHUD(1/60);P.game.render();const rig=P.FPV.cur;return {key:P.VM.key,rig:!!rig,g:rig&&rig.w.g.isEnabled(),vis:rig&&rig.w.g.getChildMeshes().filter(m=>m.isVisible&&m.isEnabled()).length,pos:rig&&rig.w.g.getAbsolutePosition().asArray().map(x=>+x.toFixed(2)),cam:P.camera.position.asArray().map(x=>+x.toFixed(2)),root:P.VM.root&&P.VM.root.isEnabled&&P.VM.root.isEnabled()};});
console.log(id,JSON.stringify(r));await p.screenshot({path:'../shots/hd_'+id+'.png'});}
await b.close();})();
