const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:1280,height:720},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.addInitScript(()=>{window.__X=1});await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(2000);
await p.evaluate(()=>{__pc.setMenuTab('ops')});await p.waitForTimeout(2500);
for(const [n,sec] of [['a',1],['b',5]]){
 await p.evaluate(s=>{for(let i=0;i<60*s;i++)__pc.lobbyLive(1/60);},sec);await p.waitForTimeout(1500);
 await p.screenshot({path:'shots/nr_'+n+'.png'});}
await b.close();})();
