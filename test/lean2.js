const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(4000);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1500);
await p.evaluate(()=>{for(let i=0;i<60*31;i++)__pc.simStep(__pc.SIM_DT);__pc.player.hp=1e6;for(const a of __pc.G.agents||[])if(a!==__pc.player)a.hp=1e6;const pl=__pc.player;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;pl.pitch=0;__pc.VM.noHolster=true;pl.cur='p';pl.w.p.id='rifle';});
for(const [n,lean,sx,sy,pitch] of JSON.parse(process.argv[2])){
  await p.evaluate(([lean,sx,sy,pitch])=>{__pc.INPUT.lean=lean;__pc.player.pitch=pitch;window.__t=setInterval(()=>{__pc.VM.swayX=sx;__pc.VM.swayY=sy;},5);},[lean,sx,sy,pitch]);
  await p.waitForTimeout(2200);await p.screenshot({path:`shots/l2_${n}.png`});await p.evaluate(()=>clearInterval(window.__t));console.log(n);}
console.log(errs.join('\n'));await b.close();})();
