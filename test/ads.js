const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);/*v4: máquina compartilhada*/
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});/*v4: boot assíncrono*/await p.waitForTimeout(4000);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1500);
await p.evaluate(()=>{for(let i=0;i<60*31;i++)__pc.simStep(__pc.SIM_DT);__pc.player.hp=1e6;for(const a of __pc.G.agents||[])if(a!==__pc.player)a.hp=1e6;const pl=__pc.player;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;pl.pitch=0;});
const list=JSON.parse(process.argv[2]);
for(const [w,sight,slot,pt] of list){
  const ok=await p.evaluate(([w,sight,slot,pt])=>{const pl=__pc.player;const id=__pc.wVariant?__pc.wVariant(w,{sight}):w;pl.cur=slot||'p';pl.pitch=pt||0;pl.w[pl.cur].id=id;__pc.INPUT.ads=true;__pc.VM.noHolster=true;__pc.VM.force=null;return id;},[w,sight,slot,pt]);
  await p.waitForTimeout(2500);{const f0=await p.evaluate(()=>__pc.game.getFrameId());await p.waitForFunction(f=>__pc.game.getFrameId()>=f+6,f0,{timeout:300000,polling:200});}await p.screenshot({path:`shots/ads_${w}_${sight}${pt?'_d':''}.png`});console.log(w,sight,ok);}
console.log(errs.slice(0,8).join('\n'));await b.close();})();
