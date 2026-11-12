// Mapa arma → clipes de recarga (inclusive com acessórios) e confere com a tabela esperada.
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();});
const r=await p.evaluate(async()=>{const P=__pc,pl=P.player,out=[];
 const step=dt=>{if(P.G.phase!=='over'){P.G.phase='action';P.G.phaseT=100;}P.simStep(P.SIM_DT);P.updateCamera(dt);P.updateVM(dt);};
 for(const id of P.WLIST){const W=P.WEAPONS[id],slot=W.slot;
  const vars=[['none',id],['red',P.wVariant(id,{sight:'red',barrel:'none',grip:'none',laser:0})],['sup+grip',P.wVariant(id,{sight:'iron',barrel:'sup',grip:'vert',laser:0})]];
  for(const [tag,vid] of vars){pl.w[slot]={id:vid,mag:5,res:99};pl.cur=slot;for(let i=0;i<30;i++)step(1/60);
   const rig=P.FPV.cur;const cl=P.fpvClips(rig);const c=rig.clips[cl.reload],e=rig.clips[cl.rempty];
   out.push({id,tag,vid,wid:rig.w.id,rig:rig.k,reload:cl.reload,rempty:cl.rempty,dur:+c.dur.toFixed(2),durE:+e.dur.toFixed(2),code:W.reload,speed:+(c.dur/W.reload).toFixed(2),speedE:+(e.dur/W.reload).toFixed(2)});}}
 return out;});
require('fs').writeFileSync('/tmp/clipmap.json',JSON.stringify(r,null,1));
for(const x of r)console.log(x.id.padEnd(11),x.tag.padEnd(9),x.rig.padEnd(6),(x.reload+'/'+x.rempty).padEnd(20),'clip',x.dur,'s código',x.code,'s  x'+x.speed,' wid='+x.wid);
await b.close();})();
