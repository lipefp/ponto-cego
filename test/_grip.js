// Fotos da pegada: node test/_grip.js rifle vert 0,1,-1   (arma, empunhadura, inclinações)
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const [wid='rifle',grip='vert',leans='0,1,-1',mv='0']=process.argv.slice(2);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(600000);p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1500);
await p.evaluate(([w,g])=>{for(let i=0;i<60*90&&__pc.G.phase!=='action';i++)__pc.simStep(__pc.SIM_DT);for(let i=0;i<30;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;pl.pitch=0;__pc.VM.noHolster=true;pl.cur='p';pl.w.p.id=__pc.wVariant(w,{sight:'x25',barrel:'none',grip:g,laser:0});},[wid,grip]);
await p.waitForTimeout(2500);console.log(await p.evaluate(()=>{const pl=__pc.player;return JSON.stringify({cur:pl.cur,ids:Object.keys(pl.w).map(k=>k+':'+pl.w[k].id),alive:pl.alive,phase:__pc.G.phase})}));
for(const l of leans.split(',')){await p.evaluate(([L,M])=>{window.__L=+L;window.__MV=+M;},[l,mv]);
 for(let i=0;i<(+mv?8:40);i++){await p.evaluate(()=>{const pl=__pc.player;if(__pc.INPUT)__pc.INPUT.lean=window.__L;try{__pc.SAVE.fov=+(window.__FOV||__pc.SAVE.fov);}catch(e){}try{for(const k in __pc.HUD){const c=__pc.HUD[k];if(c&&c.parent&&c.parent.parent==null&&'isVisible'in c)c.isVisible=false;}}catch(e){}pl.lean=window.__L;pl.ads=0;if(window.__MV){__pc.INPUT.side=window.__MV;__pc.INPUT.fwd=0;}else{pl.pos.x=40;pl.pos.z=28;}});await p.waitForTimeout(50);}
 await p.screenshot({path:`shots/grip_${wid}_${grip}_${l}.png`});}
await b.close();})();
