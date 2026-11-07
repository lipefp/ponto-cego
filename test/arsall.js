// foto de cada arma no Arsenal (apresentação real, modelo real): shots/ars/<id>.png
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
require('fs').mkdirSync('shots/ars',{recursive:true});
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:300000,polling:500}).catch(()=>{});await p.waitForTimeout(2000);
const ids=await p.evaluate(()=>__pc.WLIST);
await p.evaluate(()=>{__pc.setMenuTab('arsenal')});
for(const id of ids){await p.evaluate(id=>{__pc.setArs(id);__pc.renderMenu();},id);await p.waitForTimeout(3500);await p.screenshot({path:`shots/ars/${id}.png`});console.log(id);}
await b.close();})();
