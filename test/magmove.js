// mede quanto o carregador sai da arma durante a recarga (todas as armas ou IDS=a,b): node test/magmove.js
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:560,height:420},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:300000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;pl.pitch=0;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();});
const ids=process.env.IDS?process.env.IDS.split(','):await p.evaluate(()=>__pc.WLIST);let bad=0;
for(const id of ids){const slot=await p.evaluate(id=>__pc.WEAPONS[id].slot,id);
 const r=await p.evaluate(async([id,slot])=>{const P=__pc,pl=P.player;pl.cur=slot;pl.w[slot].id=id;pl.w[slot].mag=3;pl.w[slot].res=99;
  const step=dt=>{if(P.G&&P.G.phase!=="over"){P.G.phase="action";P.G.phaseT=100;}const n=Math.round(dt/P.SIM_DT);for(let i=0;i<n;i++)P.simStep(P.SIM_DT);P.updateCamera(dt);P.updateVM(dt);};
  for(let i=0;i<40;i++)step(1/36);P.game.render();
  const rig=P.FPV.cur,I=P.VM.info,mgs=()=>(rig&&rig.mg&&rig.mg.length?rig.mg.map(m=>m.node):(I.mag?[I.mag]:[]));
  const nodes0=mgs();if(!nodes0.length)return {none:true};
  const rel=()=>{const g=P.VM.info.g;g.computeWorldMatrix(true);const inv=g.getWorldMatrix().clone().invert();return mgs().map(n=>{n.computeWorldMatrix(true);return {p:BABYLON.Vector3.TransformCoordinates(n.getAbsolutePosition(),inv),en:n.isEnabled()};});};
  const base=rel();P.INPUT.reload=true;step(1/36);P.INPUT.reload=false;const T=P.WEAPONS[id].reload;let maxd=0,hidden=0,n=0;
  for(let t=0;t<T;t+=1/36){step(1/36);const c=rel();n++;c.forEach((q,i)=>{if(!q.en){hidden++;return;}const d=BABYLON.Vector3.Distance(q.p,base[i].p);if(d>maxd)maxd=d;});}
  return {maxd,hidden,n,count:base.length};},[id,slot]);
 const ok=r.none||r.maxd>.06||r.hidden>2;if(!ok)bad++;console.log((ok?'OK  ':'PARADO')+' '+id.padEnd(11)+(r.none?' sem carregador':' desloca máx '+(r.maxd*100).toFixed(1)+' cm · oculto '+r.hidden+'/'+r.n));}
console.log(bad?'CARREGADOR NÃO SAI ('+bad+')':'CARREGADORES OK');await b.close();process.exit(bad?1:0);})();
