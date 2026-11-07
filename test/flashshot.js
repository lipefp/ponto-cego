// Capturas: bloqueador no chão, granada de clarão no ar e tela branca
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;__pc.engine.stopRenderLoop();});
const out=process.argv[2]||'.';
const sh=async(n)=>{await p.evaluate(()=>{__pc.updateCamera(1/60);__pc.updateVM(1/60);__pc.updateHUD(1/60);__pc.game.render();});await p.screenshot({path:out+'/'+n+'.png'});};
const r=await p.evaluate(()=>{const P=__pc,pl=P.player;const f=P.dirFrom(pl.yaw,0);P.drone.active=false;P.drone.alive=false;pl.pitch=-.35;const px=pl.pos.x+f.x*1.3,pz=pl.pos.z+f.z*1.3;
  const pr={type:'jammer',cx:px,cz:pz,yaw:pl.yaw,owner:pl,pos:new P.V3(px,0,pz),r:9};P.addProp(pr);
  const fl={type:'flash',pos:new P.V3(px+.5,1.1,pz),vel:new P.V3(0,0,0),fuse:5,owner:pl,spin:0};P.projectiles.push(fl);P.HOOK.projAdd(fl);return Object.keys(P).includes('addProp');});
await sh('flash_jammer_world');
await p.evaluate(()=>{const P=__pc;P.projectiles.length=0;P.player.blindT=P.player.blindMax=4;});
await p.waitForTimeout(100);
for(let i=0;i<2;i++){await p.evaluate(()=>{});}
await sh('flash_white');
console.log(errs.join('\n')||'sem erros');await b.close();})();
