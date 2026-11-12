const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' '+(e.stack||'').split('\n')[1]));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(4000);
await p.evaluate(()=>{__pc.flowOps();});await p.waitForTimeout(2500);await p.screenshot({path:'shots/ops.png'});
await p.evaluate(()=>{__pc.setMenuTab('arsenal');});await p.waitForTimeout(2500);await p.screenshot({path:'shots/arsenal.png'});
console.log(errs.join('\n'));await b.close();})();
