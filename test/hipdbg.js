const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(900000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;__pc.VM.noHolster=true;__pc.drone.active=false;__pc.drone.alive=false;__pc.engine.stopRenderLoop();__pc.G.phase='action';});
const r=await p.evaluate(()=>{const P=__pc,pl=P.player,out=[];const stp=()=>{P.updateCamera(1/60);P.updateVM(1/60);};
  const w=P.WEAPONS.rifle;pl.w.p={id:'rifle',mag:30,res:90};pl.cur='p';pl.yaw=1.2;pl.pitch=0;
  for(const n of [10,150,400]){for(let i=0;i<n;i++)stp();out.push([n,P.VM.drawT,P.VM.holstering,!!P.FPV.cur,P.FPV.cur&&P.FPV.cur.w.g.isEnabled(),P.FPV.pending,P.VM.key]);}
  return out;});
console.log(JSON.stringify(r));
await p.evaluate(()=>{__pc.updateHUD(1/60);__pc.game.render();});await p.screenshot({path:'../shots/hip_a.png'});
await p.evaluate(()=>{const P=__pc,pl=P.player,stp=()=>{P.updateCamera(1/60);P.updateVM(1/60);};pl.ads=1;for(let i=0;i<40;i++)stp();pl.ads=0;for(let i=0;i<60;i++)stp();P.updateHUD(1/60);P.game.render();});await p.screenshot({path:'../shots/hip_b.png'});
console.log(JSON.stringify(await p.evaluate(()=>{const P=__pc,pl=P.player;return {sprint:pl.sprint,sk:P.VM.sprintK,crouch:pl.crouchK,lean:pl.lean,inputSprint:P.INPUT.sprint,vel:[pl.vel.x,pl.vel.z]};})));await b.close();})();
