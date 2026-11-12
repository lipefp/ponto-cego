const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();const t0=Date.now();
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});const t1=Date.now();
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:300000,polling:100});const t2=Date.now();
console.log('assets prontos',(t1-t0)/1000,'s · modelos reais prontos +',(t2-t1)/1000,'s');console.log(JSON.stringify(await p.evaluate(()=>window.__pcProf)));await b.close();})();
