// Fotos de 1ª pessoa por arma: node test/wfp.js '["pistol","rifle"]' [prefixo] [estados]
// estados: hip,ads,walk,reload (padrão: todos). Sai em shots/w/<prefixo>_<arma>_<estado>.png
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs');fs.mkdirSync('shots/w',{recursive:true});
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(600000);/*v4: máquina compartilhada*/
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});/*v4: boot assíncrono*/await p.waitForTimeout(4000);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1000);
await p.evaluate(()=>{const P=__pc,E=P.engine,loop=E._activeRenderLoops[0];E.stopRenderLoop();E.getDeltaTime=()=>1000/60;
  for(let i=0;i<60*31;i++)P.simStep(P.SIM_DT);
  window.__adv=(n,pre)=>{const g=P.game,r=g.render;g.render=function(){};for(let i=0;i<n;i++){if(pre)pre(i);if(i===n-1)g.render=r;loop();}g.render=r;};
  const pl=P.player;pl.hp=1e6;P.agents.filter(a=>a!==pl).forEach((a,i)=>{a.bot=false;a.alive=true;a.hp=1e9;a.pos.set(3+i*.6,0,3);a.vel.set(0,0,0);});});
const ws=JSON.parse(process.argv[2]||'["pistol"]'),pre=process.argv[3]||'a',sts=(process.argv[4]||'hip,ads,walk,reload').split(',');
const X=52.5,Z=33;
for(const w of ws){
  await p.evaluate(([w,X,Z])=>{const P=__pc,pl=P.player;const d=P.WEAPONS[w];pl.w.p={id:w,mag:d.mag,res:d.res};pl.cur='p';pl.pos.set(X,0,Z+6);pl.yaw=0;pl.pitch=0;pl.ads=0;P.INPUT.ads=false;P.INPUT.fwd=0;
    const e=P.agents.find(a=>a.team==='B');e.pos.set(X,0,Z-6);e.yaw=Math.PI;__adv(40);},[w,X,Z]);
  for(const s of sts){
    await p.evaluate(([s,X,Z])=>{const P=__pc,pl=P.player;P.INPUT.ads=s==='ads';P.INPUT.fwd=0;P.INPUT.reload=false;pl.pos.set(X,0,Z+6);pl.yaw=0;pl.pitch=0;
      if(s==='walk'){P.INPUT.fwd=1;__adv(22);P.INPUT.fwd=0;}else if(s==='reload'){P.INPUT.reload=true;__adv(2);P.INPUT.reload=false;__adv(34);}else __adv(40);},[s,X,Z]);
    await p.waitForTimeout(150);await p.screenshot({path:`shots/w/${pre}_${w}_${s}.png`});
  }
  await p.evaluate(()=>{const P=__pc;P.INPUT.ads=false;P.player.reloadT=0;__adv(10);});
}
console.log(errs.slice(0,10).join('\n')||'ok');await b.close();})();
