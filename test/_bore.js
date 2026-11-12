const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();});
const ids=(await p.evaluate(()=>Object.keys(__pc.WEAPONS))).filter(x=>!process.env.ONLY||process.env.ONLY.split(',').includes(x));
for(const id of ids){
 const r=await p.evaluate(async([id,BAR])=>{const P=__pc,pl=P.player,W=P.WEAPONS[id],slot=W.slot;
  const vid=BAR==='none'?id:P.wVariant(id,{sight:'iron',barrel:BAR,grip:'none',laser:0});
  pl.w[slot]={id:vid,mag:W.mag,res:99};pl.cur=slot;for(let i=0;i<100;i++){if(P.G.phase!=='over'){P.G.phase='action';P.G.phaseT=100;}P.simStep(P.SIM_DT);P.updateCamera(1/60);P.updateVM(1/60);}
  for(let k=0;k<200;k++){P.game.render();const w=P.FPV&&P.FPV.cur&&P.FPV.cur.w;if(w&&w.g.getChildMeshes().every(m=>m.isReady(true)))break;await new Promise(r=>setTimeout(r,30));}
  const w=P.FPV.cur.w,g=w.g;g.computeWorldMatrix(true);const inv=g.getWorldMatrix().clone().invert();
  const pts=[];for(const m of g.getChildMeshes()){if(!m.isVisible||!m.isEnabled())continue;const d=m.getVerticesData('position');if(!d)continue;m.computeWorldMatrix(true);const M=m.getWorldMatrix().multiply(inv).m;for(let i=0;i<d.length;i+=3){const x=d[i],y=d[i+1],z=d[i+2];pts.push([x*M[0]+y*M[4]+z*M[8]+M[12],x*M[1]+y*M[5]+z*M[9]+M[13],x*M[2]+y*M[6]+z*M[10]+M[14]]);}}
  if(!pts.length)return null;let zmin=1e9;for(const q of pts)zmin=Math.min(zmin,q[2]);
  const sl=pts.filter(q=>q[2]<zmin+.012);const ys=sl.map(q=>q[1]).sort((a,b)=>a-b),xs=sl.map(q=>q[0]).sort((a,b)=>a-b);
  return {zmin:+zmin.toFixed(3),n:sl.length,ymed:+ys[ys.length>>1].toFixed(3),ymin:+ys[0].toFixed(3),ymax:+ys[ys.length-1].toFixed(3),xmed:+xs[xs.length>>1].toFixed(3),tip:[P.FPV.cur.w.tip.x,P.FPV.cur.w.tip.y,P.FPV.cur.w.tip.z].map(v=>+v.toFixed(3))};},[id,process.env.BAR||'none']);
 console.log(id,JSON.stringify(r));}
await b.close();})();
