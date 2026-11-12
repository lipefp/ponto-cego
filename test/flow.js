const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' '+(e.stack||'').split('\n')[1]));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(4000);
const shot=async n=>{await p.waitForTimeout(700);await p.screenshot({path:`shots/flow_${n}.png`});};
await shot('0menu');
await p.evaluate(()=>__pc.flowStart());await p.waitForTimeout(1200);await shot('1search');
await p.evaluate(()=>__pc.flowMap());await p.waitForTimeout(900);await shot('2map');
await p.waitForTimeout(5500);await shot('3ops');
await p.evaluate(()=>{__pc.SAVE.startSide='atk';__pc.flowSpawn();});await shot('4spawn_atk');
await p.evaluate(()=>{__pc.FLOW.pickZone=2;__pc.flowGo();});await p.waitForTimeout(2500);
console.log(JSON.stringify(await p.evaluate(()=>({ph:__pc.G.phase,side:__pc.player.side,x:__pc.player.pos.x/3,z:__pc.player.pos.z/3,pick:__pc.G.pick}))));
await p.evaluate(()=>{__pc.SAVE.startSide='def';__pc.G.phase='menu';__pc.flowSpawn();});await shot('5spawn_def');
await p.evaluate(()=>{__pc.FLOW.pickSite='B';__pc.flowGo();});await p.waitForTimeout(2500);
console.log(JSON.stringify(await p.evaluate(()=>({side:__pc.player.side,site:__pc.G.siteKey}))));
console.log(errs.join('\n'));await b.close();})();
