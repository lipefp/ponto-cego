/* avalia JS dentro da página com a partida pronta: node test/fpdbg.js "<expr>" [arma] */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
p.on('pageerror',e=>console.log('PE '+e.message+' | '+(e.stack||'').split('\n')[1]));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(3000);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1500);
await p.evaluate(w=>{for(let i=0;i<60*31;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.cur='p';pl.w.p.id=w||'rifle';},process.argv[3]);
await p.waitForTimeout(6000);
console.log(JSON.stringify(await p.evaluate(process.argv[2]),null,0));await b.close();})();
