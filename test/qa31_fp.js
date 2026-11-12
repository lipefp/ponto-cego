const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(600000);/*v4: máquina compartilhada*/
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});/*v4: boot assíncrono*/await p.waitForTimeout(4000);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1000);
await p.evaluate(()=>{
  const P=__pc,E=P.engine,loop=E._activeRenderLoops[0];E.stopRenderLoop();E.getDeltaTime=()=>1000/60;
  for(let i=0;i<60*31;i++)P.simStep(P.SIM_DT);
  window.__adv=(n,pre)=>{const g=P.game,r=g.render;g.render=function(){};for(let i=0;i<n;i++){if(pre)pre(i);if(i===n-1)g.render=r;loop();}g.render=r;};
  const pl=P.player;pl.hp=1e6;
  const bots=P.agents.filter(a=>a!==pl);bots.forEach((a,i)=>{a.bot=false;a.alive=true;a.hp=1e9;a.pos.set(3+i*.6,0,3);a.vel.set(0,0,0);});
  window.__R={};
});
const shot=async(n)=>{await p.waitForTimeout(200);await p.screenshot({path:`shots/q31/fp_${n}.png`});};
const X=52.5,Z=33;
for(const w of ['rifle','smg','shotgun','dmr','pistol']){
  await p.evaluate(([w,X,Z])=>{const P=__pc,pl=P.player;pl.w.p={id:w,mag:P.WEAPONS[w].mag,res:P.WEAPONS[w].res};pl.cur='p';pl.pos.set(X,0,Z+6);pl.yaw=0;pl.pitch=0;pl.ads=0;P.INPUT.ads=false;
    const e=P.agents.find(a=>a.team==='B');e.pos.set(X,0,Z-6);e.yaw=Math.PI;__adv(40);},[w,X,Z]);
  await shot(w+'_hip');
  await p.evaluate(()=>{__pc.INPUT.ads=true;__adv(40);});await shot(w+'_ads');
  // fire with ADS: hold 0.5s, record pitch climb & hits on dummy enemy (hp tracked)
  const r=await p.evaluate(()=>{const P=__pc,pl=P.player,e=P.agents.find(a=>a.team==='B');e.hp=1e9;const p0=pl.pitch,m0=pl.w.p.mag;P.INPUT.fire=true;__adv(8);P.INPUT.fire=false;__adv(1);return {climb:+(pl.pitch-p0).toFixed(3),shots:m0-pl.w.p.mag,dmg:1e9-e.hp};});
  await shot(w+'_fire');
  await p.evaluate(()=>{__pc.INPUT.fire=false;__pc.INPUT.ads=false;__pc.INPUT.reload=true;__adv(30);});await shot(w+'_reload');
  console.log(w,JSON.stringify(r));
}
// sprint + lean + crouch view
await p.evaluate(([X,Z])=>{const P=__pc,pl=P.player;pl.pos.set(X,0,Z+8);pl.yaw=0;P.INPUT.fwd=1;P.INPUT.sprint=true;__adv(40);},[X,Z]);await shot('sprint');
await p.evaluate(()=>{const P=__pc;P.INPUT.fwd=0;P.INPUT.sprint=false;P.INPUT.lean=-1;__adv(30);});await shot('leanL');
await p.evaluate(()=>{const P=__pc;P.INPUT.lean=0;P.INPUT.crouch=true;__adv(30);});await shot('crouch');
// movement metrics: time to top speed and stop distance
const mv=await p.evaluate(([X,Z])=>{const P=__pc,pl=P.player;P.INPUT.crouch=false;__adv(20);pl.pos.set(X,0,Z+10);pl.vel.set(0,0,0);pl.yaw=0;P.INPUT.fwd=1;let t90=null;
  const g=P.game,r=g.render;g.render=()=>{};for(let i=0;i<120;i++){P.simStep(P.SIM_DT);const s=Math.hypot(pl.vel.x,pl.vel.z);if(t90==null&&s>4.7*.9)t90=i/60;}
  const top=Math.hypot(pl.vel.x,pl.vel.z);P.INPUT.fwd=0;const z0=pl.pos.z;let ts=null;for(let i=0;i<120;i++){P.simStep(P.SIM_DT);if(ts==null&&Math.hypot(pl.vel.x,pl.vel.z)<.05)ts=i/60;}
  g.render=r;return {top:+top.toFixed(2),t90,stopDist:+(z0-pl.pos.z).toFixed(2),stopT:ts};},[X,Z]);
console.log('move',JSON.stringify(mv));
// get hit: enemy bot shoots player
await p.evaluate(([X,Z])=>{const P=__pc,pl=P.player;pl.hp=100;pl.pos.set(X,0,Z+6);pl.yaw=0;pl.pitch=0;const e=P.agents.find(a=>a.team==='B');e.pos.set(X+2,0,Z-4);e.bot=true;e.ai={};e.yaw=Math.PI;
  __adv(70);},[X,Z]);await shot('hurt');
const hp=await p.evaluate(()=>__pc.player.hp);console.log('player hp after 70 frames facing bot',hp);
// hitmarker
await p.evaluate(([X,Z])=>{const P=__pc,pl=P.player;pl.hp=1e6;const e=P.agents.find(a=>a.team==='B');e.bot=false;e.pos.set(X,0,Z-2);e.hp=1e9;pl.pos.set(X,0,Z+6);pl.yaw=0;pl.pitch=-.03;P.INPUT.fire=true;__adv(3);P.INPUT.fire=false;},[X,Z]);await shot('hitmark');
console.log(errs.slice(0,15).join('\n'));await b.close();})();
