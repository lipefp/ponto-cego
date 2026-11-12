// QA de empunhadura: para CADA arma (e cada empunhadura extra), mede em repouso a distância (m, mundo) entre
// a mão de apoio e o ponto de apoio da arma (w.fore) e entre a mão direita e a empunhadura (w.grip). Falha se passar do limite.
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;pl.pitch=0;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();});
const LIM=+(process.env.LIM||.09);let bad=0;
const ids=process.env.IDS?process.env.IDS.split(','):await p.evaluate(()=>__pc.WLIST);
for(const id of ids){
  const cls=await p.evaluate(id=>__pc.WEAPONS[id].cls,id);
  const grips=['none'].concat(['pistol','rev','mp'].includes(cls)?[]:['vert','ang']);
  for(const gr of grips){
    const r=await p.evaluate(async([id,gr])=>{const P=__pc,pl=P.player,B=BABYLON,slot=P.WEAPONS[id].slot;
      const vid=P.wVariant(id,{sight:'iron',barrel:'none',grip:gr,laser:0});pl.w[slot]={id:vid,mag:30,res:90};pl.cur=slot;
      const step=dt=>{if(P.G.phase!=="over"){P.G.phase="action";P.G.phaseT=100;}P.simStep(P.SIM_DT);P.updateCamera(dt);P.updateVM(dt);};
      for(let i=0;i<50;i++)step(1/60);P.game.render();
      const rig=P.FPV.cur;if(!rig||!rig.w)return {err:'sem rig'};const w=rig.w;
      w.g.computeWorldMatrix(true);const M=w.g.getWorldMatrix(),T=v=>B.Vector3.TransformCoordinates(new B.Vector3(v.x,v.y,v.z),M);
      const fn=rig.nodes[rig.LH],rn=rig.nodes[rig.RH];fn.computeWorldMatrix(true);rn&&rn.computeWorldMatrix(true);
      const d=(a,b2)=>Math.hypot(a.x-b2.x,a.y-b2.y,a.z-b2.z);
      const locked=P.WEAPONS[P.WEAPONS[vid].base||vid].noGrip;if(locked&&P.WEAPONS[vid].att.grip!=='none')return {err:'arma com empunhadura própria aceitou acessório de empunhadura'};
      return {L:d(fn.getAbsolutePosition(),T(w.fore)),R:rn?d(rn.getAbsolutePosition(),T(w.grip)):-1,hold:w.hold};},[id,gr]);
    if(r.err){console.log('FALHA',id,gr,r.err);bad++;continue;}
    const ok=r.L<=LIM;if(!ok)bad++;console.log((ok?'OK   ':'LONGE')+' '+id.padEnd(11)+' grip='+gr.padEnd(5)+' mão esq→apoio '+r.L.toFixed(3)+' m · mão dir→empunhadura '+(r.R<0?'-':r.R.toFixed(3))+' · '+r.hold);}}
console.log(errs.join('\n'));console.log(bad||errs.length?'EMPUNHADURA REPROVADA ('+bad+')':'EMPUNHADURA APROVADA');await b.close();process.exit(bad||errs.length?1:0);})();
