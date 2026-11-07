const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await (await b.newContext({viewport:{width:1280,height:720},offline:true})).newPage();p.setDefaultTimeout(600000);/*v4: máquina compartilhada*/
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n').slice(1,3).join(' ')));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});/*v4: boot assíncrono*/await p.waitForTimeout(3500);
await p.screenshot({path:'shots/lobby2.png'});
await p.mouse.click(1100,660);await p.waitForTimeout(500);
await p.evaluate(()=>document.dispatchEvent(new Event('pointerlockerror')));
await p.evaluate(()=>{for(let k=0;k<60*31;k++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=17.9*3;pl.pos.z=9.5*3;pl.yaw=-Math.PI/2;pl.pitch=-.1;for(const a of __pc.agents)if(a.team==='B')a.alive=false;__pc.agents.find(a=>a.team==='B').alive=true;__pc.agents.find(a=>a.team==='B').pos.set(3,0,3);});
await p.mouse.move(640,360);
await p.keyboard.down('KeyW');await p.waitForTimeout(300);await p.keyboard.up('KeyW');
await p.mouse.down();await p.waitForTimeout(1800);await p.mouse.up();
for(const k of['KeyQ','KeyE','KeyR','Digit2','Digit1','KeyV','KeyG','KeyG','Space','KeyC']){await p.keyboard.press(k);await p.waitForTimeout(120);}
await p.waitForTimeout(3000);const m0=await p.evaluate(()=>__pc.player.w.p.mag);await p.mouse.down({button:'right'});await p.waitForTimeout(500);await p.mouse.down();await p.waitForTimeout(400);await p.mouse.up();const m1=await p.evaluate(()=>__pc.player.w.p.mag);console.log('ADS fire mag',m0,'->',m1);await p.screenshot({path:'shots/ads.png'});await p.mouse.up({button:'right'});
await p.waitForTimeout(800);await p.screenshot({path:'shots/shotwall.png'});
await p.keyboard.down('Tab');await p.waitForTimeout(400);await p.screenshot({path:'shots/board.png'});await p.keyboard.up('Tab');
console.log(JSON.stringify(await p.evaluate(()=>({mag:__pc.player.w.p.mag,gad:__pc.player.gadgetN,phase:__pc.G.phase}))));
console.log('errors:',errs.length);console.log(errs.slice(0,8).join('\n'));await b.close();})();
