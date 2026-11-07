const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(3000);
await p.evaluate(()=>{__pc.engine.stopRenderLoop();__pc.freezeShow();__pc.setMenuTab('ops');});
const r=await p.evaluate(()=>{const o=[];for(let i=0;i<12;i++){const ch0=__pc.LA.ch;for(let k=0;k<30;k++)__pc.updateShowroom(1/60);o.push([__pc.LA.i,__pc.LA.t.toFixed(2),ch0===__pc.LA.ch,__pc.LA.off,__pc.LA.ch&&__pc.LA.ch.wReal]);}return o;});
console.log(JSON.stringify(r));await b.close();})();
