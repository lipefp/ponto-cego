// Depuração rápida da pose em 1ª pessoa: node test/vmdbg.js '<pose json>' '["pistol","rifle"]' estados prefixo
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs');fs.mkdirSync('shots/w',{recursive:true});
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:800,height:450},offline:true})).newPage();p.setDefaultTimeout(600000);/*v4: máquina compartilhada*/
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});/*v4: boot assíncrono*/await p.waitForTimeout(3500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(800);
await p.evaluate(()=>{const P=__pc,E=P.engine,loop=E._activeRenderLoops[0];E.stopRenderLoop();E.getDeltaTime=()=>1000/60;
  for(let i=0;i<60*31;i++)P.simStep(P.SIM_DT);window.__adv=(n)=>{const g=P.game,r=g.render;g.render=function(){};for(let i=0;i<n;i++){if(i===n-1)g.render=r;loop();}g.render=r;};
  const pl=P.player;pl.hp=1e6;P.agents.filter(a=>a!==pl).forEach((a,i)=>{a.bot=false;a.alive=true;a.hp=1e9;a.pos.set(3+i*.6,0,3);});__adv(200);});
const pose=JSON.parse(process.argv[2]||'{}'),ws=JSON.parse(process.argv[3]||'["pistol"]'),sts=(process.argv[4]||'hip,ads').split(','),pre=process.argv[5]||'d';
await p.evaluate(pose=>{for(const k in pose)Object.assign(__pc.VM.pose[k],pose[k]);},pose);
const X=52.5,Z=33;
for(const w of ws){for(const s of sts){
  await p.evaluate(([w,s,X,Z])=>{const P=__pc,pl=P.player;if(w.includes('@')){const [b,a]=w.split('@'),q=a.split('.');w=P.WEAPONS.variant(b,{sight:q[0],barrel:q[1],grip:q[2],laser:+q[3]});}const d=P.WEAPONS[w];if(pl.w.p.id!==w)pl.w.p={id:w,mag:d.mag,res:d.res};pl.cur='p';pl.pos.set(X,0,Z+6);pl.yaw=0;pl.pitch=0;P.INPUT.ads=s==='ads';P.INPUT.fwd=0;P.VM.key='';
    if(s==='walk'){P.INPUT.fwd=1;__adv(22);P.INPUT.fwd=0;}else if(s==='reload'){pl.w.p.mag=1;P.INPUT.reload=true;__adv(2);P.INPUT.reload=false;__adv(Math.round(d.reload*60*.4));}else if(s==='sprint'){P.INPUT.fwd=1;P.INPUT.sprint=true;__adv(40);P.INPUT.fwd=0;P.INPUT.sprint=false;}else __adv(45);},[w,s,X,Z]);
  await p.screenshot({path:`shots/w/${pre}_${w.replace(/[@.]/g,'_')}_${s}.png`});}
  await p.evaluate(()=>{__pc.INPUT.ads=false;__pc.player.reloadT=0;__adv(10);});}
console.log(errs.slice(0,8).join('\n')||'ok');await b.close();})();
