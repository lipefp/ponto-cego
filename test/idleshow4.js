const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(3000);
await p.evaluate(()=>{__pc.engine.stopRenderLoop();__pc.freezeShow();__pc.setYaw(.25);__pc.setMenuTab('ops');__pc.updateShowroom(1/60);});
let n=0;
for(const [st,j] of [['reload',3],['gadget',7],['look',8]]){
 await p.evaluate(j=>{const LA=__pc.LA;LA.i=j-1;LA.t=99;__pc.updateShowroom(1/60);},j);
 for(let k=0;k<6;k++){await p.evaluate(()=>{for(let q=0;q<24;q++)__pc.updateShowroom(1/60);__pc.lobby.render();});await p.waitForTimeout(120);await p.screenshot({path:`shots/sx_${n++}.png`,clip:{x:560,y:40,width:400,height:460}});}}
await b.close();})();
