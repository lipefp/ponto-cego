const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(4000);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(2000);
await p.evaluate(()=>{const pl=__pc.player;pl.pos.set(17.9*3,0,9.5*3);pl.yaw=-Math.PI/2;pl.pitch=-.05;});
const r=await p.evaluate(()=>new Promise(res=>setTimeout(()=>__pc.game.onAfterRenderObservable.addOnce(()=>{const A=__pc.game.getActiveMeshes(),o=[];for(let i=0;i<A.length;i++){const m=A.data[i];if(!m||!m.subMeshes)o.push((m&&m.name)+'|'+(m&&m.getClassName())+'|'+(m&&m.parent&&m.parent.name));}res(o.slice(0,20));}),1500)));
console.log(JSON.stringify(r));await b.close();})();
