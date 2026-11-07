const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(3500);
for(const t of ['play','ops','arsenal','opts']){await p.evaluate(t=>__pc.setMenuTab(t),t);await p.waitForTimeout(900);await p.screenshot({path:`shots/menu_${t}.png`});}
await p.evaluate(()=>{__pc.setMenuTab('play');__pc.flowMap();});await p.waitForTimeout(1500);await p.screenshot({path:'shots/menu_map.png'});
await p.evaluate(()=>{__pc.flowSpawn();});await p.waitForTimeout(800);await p.screenshot({path:'shots/menu_spawn.png'});
await b.close();})();
