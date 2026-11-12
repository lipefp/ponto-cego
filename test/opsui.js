const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const [W,H]=(process.env.VP||'1280x720').split('x').map(Number);
const p=await (await b.newContext({viewport:{width:W,height:H},offline:true})).newPage();p.setDefaultTimeout(600000);const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(4000);
await p.evaluate(()=>__pc.flowStart());await p.waitForTimeout(1500);
const st=await p.evaluate(()=>({step:__pc.FLOW.step,mode:__pc.FLOW.mode}));console.log(JSON.stringify(st));
await p.waitForFunction(()=>__pc.FLOW.step==='ops',null,{timeout:120000,polling:300}).catch(()=>{});console.log(await p.evaluate(()=>__pc.FLOW.step+' '+__pc.FLOW.mode));
await p.waitForTimeout(2500);await p.screenshot({path:'shots/opsui_1.png'});
// clicar no botão de acessórios: via tab direto
await p.evaluate(()=>{__pc.setMenuTab('arsenal');});await p.waitForTimeout(2500);await p.screenshot({path:'shots/opsui_2.png'});
console.log(errs.join('\n')||'ok');await b.close();})();
