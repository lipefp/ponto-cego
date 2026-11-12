const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await (await b.newContext()).newPage();p.setDefaultTimeout(600000);/*v4: máquina compartilhada*/p.on('pageerror',e=>console.log('PE',e.message,(e.stack||'').split('\n').slice(0,3).join(' | ')));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});/*v4: boot assíncrono*/await p.waitForTimeout(4000);console.log(await p.evaluate(()=>typeof __pc));await b.close();})();
