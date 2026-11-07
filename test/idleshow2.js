const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(3000);
await p.evaluate(()=>{__pc.setMenuTab('ops');__pc.engine.stopRenderLoop();__pc.freezeShow();__pc.setYaw(.5);});
const log=[];
for(let i=0;i<30;i++){const info=await p.evaluate(()=>{const LA=__pc.LA;for(let k=0;k<30;k++){__pc.updateShowroom(1/60);}__pc.lobby.render();return [LA.i,LA.t.toFixed(1)];});log.push(info.join(':'));await p.waitForTimeout(150);await p.screenshot({path:`shots/idle_${String(i).padStart(2,'0')}.png`,clip:{x:560,y:40,width:400,height:460}});}
console.log(log.join(' '));await b.close();})();
