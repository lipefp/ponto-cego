// Reproduz a imagem enviada: SMG-11 (mp5), mira vermelha, skin Ártico, janela 1127x694. Tira fotos em quadril, mira e recarga.
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:1127,height:694},offline:true})).newPage();p.setDefaultTimeout(900000);
const W=process.env.W||'marimbondo';const TAG=process.env.TAG||'';
await p.addInitScript(([z,y])=>{window.__RZ=z;window.__RY=y;},[+(process.env.RZ||0),+(process.env.RY||0)]);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.evaluate(w=>{const P=__pc;P.SAVE.skins[w]='artico';P.SAVE.att[w]={sight:'red'};P.SAVE.quality='high';P.startMatch();document.dispatchEvent(new Event('pointerlockerror'));},W);await p.waitForTimeout(1200);
await p.evaluate(w=>{const P=__pc;for(let i=0;i<60*46;i++)P.simStep(P.SIM_DT);const pl=P.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;P.VM.noHolster=true;P.drone.active=false;P.drone.alive=false;P.engine.stopRenderLoop();
 const d=P.WEAPONS[w];pl.w[d.slot]={id:w,mag:d.mag,res:d.res};pl.cur=d.slot;pl.skins[w]='artico';pl.yaw=1.2;pl.pitch=0;pl.ads=0;for(let i=0;i<40;i++){P.updateCamera(1/60);P.updateVM(1/60);}},W);
const shot=async(n)=>{await p.evaluate(()=>{__pc.updateHUD(1/60);__pc.game.render();});await p.screenshot({path:'../shots/rsmg_'+W+TAG+'_'+n+'.png'});};
await shot('hip');
await p.evaluate(()=>{__pc.player.ads=1;for(let i=0;i<120;i++){__pc.updateCamera(1/60);__pc.updateVM(1/60);}});await shot('ads');
await p.evaluate(()=>{const P=__pc,pl=P.player;pl.ads=0;pl.reloadT=2.2;pl.cur=pl.cur;});
for(let k=0;k<5;k++){await p.evaluate(()=>{for(let i=0;i<24;i++){__pc.player.reloadT=Math.max(0,__pc.player.reloadT-1/60);__pc.updateCamera(1/60);__pc.updateVM(1/60);}});await shot('rel'+k);}
await b.close();})();
