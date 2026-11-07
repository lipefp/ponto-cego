const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:300000,polling:500}).catch(()=>{});await p.waitForTimeout(1000);
await p.evaluate(()=>{__pc.engine.stopRenderLoop();__pc.freezeShow();__pc.setYaw(.5);__pc.setMenuTab('ops');});
const cfg=[['atk',0,'floresta'],['atk',2,'tigre'],['def',1,'padrao'],['def',3,'urbano']];let n=0;
for(const [side,i,sk] of cfg){
 await p.evaluate(([side,i,sk])=>{const o=__pc.OPS[side][i];if(side==='atk')__pc.SAVE.atkOp=o.id;else __pc.SAVE.defOp=o.id;const L=__pc.SAVE.load[o.id]||(__pc.SAVE.load[o.id]={p:o.prims[0],s:o.secs[0]});__pc.SAVE.skins[L.p]=sk;__pc.setMenuTab('ops');},[side,i,sk]);
 await p.evaluate(()=>{for(let k=0;k<20;k++)__pc.updateShowroom(1/60);__pc.lobby.render();});await p.waitForTimeout(600);
 await p.evaluate(()=>{for(let k=0;k<30;k++)__pc.updateShowroom(1/60);__pc.lobby.render();});
 await p.screenshot({path:`shots/cs_${n++}.png`,clip:{x:560,y:40,width:400,height:460}});}
await b.close();})();
