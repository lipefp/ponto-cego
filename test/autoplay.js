const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(600000);/*v4: máquina compartilhada*/
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n').slice(1,3).join(' ')));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});/*v4: boot assíncrono*/await p.waitForTimeout(3500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));__pc.player.bot=true;__pc.G.autoplay=true;});
for(let i=0;i<40;i++){const s=await p.evaluate(()=>{for(let k=0;k<60*15;k++)__pc.simStep(__pc.SIM_DT);return __pc.G.phase+' r'+__pc.G.round+' '+__pc.teams.A.score+'-'+__pc.teams.B.score;});await p.waitForTimeout(150);if(i%5==0)console.log(s);if(s.startsWith('over'))break;}
await p.waitForTimeout(1500);await p.screenshot({path:'shots/over.png'});
console.log('errors:',errs.length);console.log(errs.slice(0,8).join('\n'));await b.close();})();
