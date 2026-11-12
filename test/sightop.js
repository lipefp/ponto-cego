// Opacidade das miras: em ADS, toda mira óptica (x2/x15/x25/holo/reflex/red) de toda arma deve ter malha 'sight' com visibility≈SAVE.sightOp; sem ADS = 1.
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();__pc.SAVE.sightOp=.5;});
const rows=await p.evaluate(async()=>{const P=__pc,pl=P.player,out=[];for(const id of P.WLIST){for(const sight of ['red','holo','reflex','x15','x2','x25']){
  const slot=P.WEAPONS[id].slot;const vid=P.wVariant(id,{sight,barrel:'none',grip:'none',laser:0});if(P.WEAPONS[vid].att.sight!==sight)continue;pl.w[slot]={id:vid,mag:30,res:90};pl.cur=slot;pl.reloadT=0;pl.act=null;P.VM.key='';
  pl.ads=0;P.INPUT.ads=false;for(let i=0;i<60;i++){P.updateCamera(1/60);P.updateVM(1/60);}const v0=P.VM.info&&P.VM.info.sightM?P.VM.info.sightM.visibility:null;
  pl.ads=1;P.INPUT.ads=true;for(let i=0;i<120;i++){P.updateCamera(1/60);P.updateVM(1/60);}const v1=P.VM.info&&P.VM.info.sightM?P.VM.info.sightM.visibility:null;
  out.push({id,sight,v0,v1,has:!!(P.VM.info&&P.VM.info.sightM)});}}return out;});
let bad=0;for(const r of rows){const ok=r.has&&Math.abs(r.v0-1)<.02&&Math.abs(r.v1-.5)<.06;if(!ok){bad++;console.log('FALHA',JSON.stringify(r));}}
console.log(rows.length+' combinações; '+(bad?'OPACIDADE REPROVADA ('+bad+')':'OPACIDADE APROVADA'));console.log(errs.join('\n'));await b.close();process.exit(bad||errs.length?1:0);})();
