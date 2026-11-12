// Diagnóstico/fotos do ragdoll na cena do jogo (física Havok real, passos manuais).
// uso: node test/rag.js [nome] — imprime posições por tempo e salva fotos em shots/rag/
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{const name=process.argv[2]||'rag';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(600000);
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n').slice(1,3).join(' ')));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push('C '+m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(3000);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1500);
await p.evaluate(()=>{const P=__pc,E=P.engine;window.__loop=E._activeRenderLoops[0];E.stopRenderLoop();E.getDeltaTime=()=>1000/60;
  for(let i=0;i<60*31;i++)P.simStep(P.SIM_DT);P.player.alive=false;
  const g=P.game;window.__realRender=g.render;window.__qcam={pos:[0,2,0],tgt:[0,1,0]};
  const bots=P.agents.filter(a=>a!==P.player);bots.forEach((a,i)=>{a.bot=false;a.alive=true;a.hp=1e9;a.pos.set(3+i*.1,0,3);a.vel.set(0,0,0);});
  window.__adv=(n,shot)=>{const cam=P.camera,r=window.__realRender;for(let i=0;i<n;i++){g.render=function(){if(g._physicsEngine){g._advancePhysicsEngineStep(1000/60);g.onBeforeRenderObservable.notifyObservers(g);}};
      if(shot&&i===n-1){g.render=function(){const q=__qcam;cam.position.set(...q.pos);const dx=q.tgt[0]-q.pos[0],dy=q.tgt[1]-q.pos[1],dz=q.tgt[2]-q.pos[2];cam.rotation.set(Math.atan2(dy,Math.hypot(dx,dz)),Math.atan2(-dx,-dz),0);cam.fov=.9;if(g._physicsEngine){g._advancePhysicsEngineStep(1000/60);g.onBeforeRenderObservable.notifyObservers(g);}r.call(g);};}
      __loop();}g.render=r;};
});
fs.mkdirSync('shots/rag',{recursive:true});
const X=52.5,Z=33;
const setup=await p.evaluate(([X,Z])=>{const P=__pc,bots=P.agents.filter(a=>a!==P.player);const a=bots[0];a.pos.set(X,0,Z);a.yaw=0;a.alive=true;
  for(let i=1;i<bots.length;i++){bots[i].pos.set(3+i*.5,0,3);}
  window.__a=a;window.__qcam.pos=[X+4,1.3,Z];window.__qcam.tgt=[X,.5,Z];__adv(20);
  return {n:bots.length,phys:!!P.PHYS,ragdoll:!!BABYLON.Ragdoll};},[X,Z]);
console.log(JSON.stringify(setup));
async function probe(tag){const r=await p.evaluate(()=>{const P=__pc,a=__a,ch=P.CH.get(a),B=BABYLON;const sk=ch&&ch.body&&ch.body.skeleton;if(!ch||!sk)return {noch:true};
  const m=ch.body;m.computeWorldMatrix(true);const out={rg:!!ch.rg,frozen:ch.rg&&ch.rg.frozen,t:ch.rg&&+ch.rg.t.toFixed(2)};
  const names=['Hips','Spine2','Head','LeftFoot','RightHand'];out.bones={};
  for(const n of names){const bi=sk.bones.findIndex(b=>b.name.endsWith(':'+n)||b.name===n);const bo=sk.bones[bi];if(!bo){out.bones[n]='nobone '+sk.bones.length+' '+sk.bones.slice(0,4).map(b=>b.name).join('|');continue;}const p0=bo.getAbsolutePosition(m);const w=B.Vector3.TransformCoordinates(p0,m.getWorldMatrix());out.bones[n]=[w.x,w.y,w.z].map(v=>+v.toFixed(2));}
  if(ch.rg&&!ch.rg.frozen){out.agg=ch.rg.rd._aggregates.map(g=>{const q=g.transformNode.position;return [q.x,q.y,q.z].map(v=>+v.toFixed(2)).join(',');}).slice(0,4);}
  out.root=[ch.root.position.x,ch.root.position.y,ch.root.position.z].map(v=>+v.toFixed(2));out.rootRot=[ch.root.rotation.x,ch.root.rotation.y,ch.root.rotation.z].map(v=>+v.toFixed(2));
  return out;});console.log(tag,JSON.stringify(r));}
await p.evaluate(()=>{window.__hp=(a)=>{const B=BABYLON,c=__pc.CH.get(a);const cen=name=>{const m=c.root.getChildMeshes(false).find(x=>x.name===name);m.skeleton.prepare(true);m.computeWorldMatrix(true);const M=m.skeleton.getTransformMatrices(m),P=m.getVerticesData('position'),I=m.getVerticesData('matricesIndices'),W=m.getVerticesData('matricesWeights'),wm=m.getWorldMatrix();let s=new B.Vector3(),n=0;
  for(let v=0;v<P.length/3;v+=8){const o=new B.Vector3(0,0,0),p0=new B.Vector3(P[v*3],P[v*3+1],P[v*3+2]);for(let k=0;k<4;k++){const w=W[v*4+k];if(w<=0)continue;const mm=B.Matrix.FromArray(M,I[v*4+k]*16);o.addInPlace(B.Vector3.TransformCoordinates(p0,mm).scale(w));}s.addInPlace(B.Vector3.TransformCoordinates(o,wm));n++;}return s.scale(1/n);};
  const h=cen('headm'),t=cen('torso');return {head:[h.x,h.y,h.z].map(v=>+v.toFixed(2)),torso:[t.x,t.y,t.z].map(v=>+v.toFixed(2))};};});
await p.evaluate(([X,Z])=>{window.__qcam.pos=[X+3.2,2.6,Z+3.2];window.__qcam.tgt=[X+1,.2,Z];},[X,Z]);
await probe('alive');console.log('HP alive',JSON.stringify(await p.evaluate(()=>__hp(__a))));
await p.evaluate(()=>{const P=__pc,a=__a;a.alive=false;a.hp=0;a.killFrom=new P.V3(a.pos.x-8,0,a.pos.z);a.lastHead=false;__adv(2);});
for(let k=0;k<6;k++){await probe('t'+(k*.5).toFixed(1));await p.evaluate(()=>__adv(30,true));await p.waitForTimeout(300);await p.screenshot({path:`shots/rag/${name}_${k}.png`});}
console.log('HP dead',JSON.stringify(await p.evaluate(()=>__hp(__a))));await probe('t3.0');await p.evaluate(()=>__adv(120));await probe('t5.0');await p.evaluate(()=>__adv(2,true));await p.waitForTimeout(400);await p.screenshot({path:`shots/rag/${name}_end.png`});
/* B) seis mortes juntas: no máximo 4 ragdolls vivos; depois tudo congela e os corpos físicos somem */
const B1=await p.evaluate(([X,Z])=>{const P=__pc,all=P.agents.filter(a=>a!==P.player),bots=all.filter(a=>a.team===P.player.team).slice(0,3).concat(all.filter(a=>a.team!==P.player.team).slice(0,3));window.__six=bots;window.__qcam.pos=[X+2.4,3.0,Z+6.5];window.__qcam.tgt=[X+.6,.2,Z-.5];
  const base=P.PHYS.stats().bodies;
  bots.forEach((a,i)=>{a.alive=true;a.pos.set(X+(i%2)*1.4,0,Z-3+i*1.1);a.vel.set(0,0,0);});__adv(8);
  bots.forEach((a,i)=>{a.alive=false;a.hp=0;a.killFrom=new P.V3(a.pos.x+(i%2?-3:3),0,a.pos.z+(i%3-1)*5);a.lastHead=i===2;});__adv(3);
  const act=()=>bots.filter(a=>{const c=P.CH.get(a);return c&&c.rg&&!c.rg.frozen;}).length;
  const o={base,active3:act(),bodies3:P.PHYS.stats().bodies};__adv(40);o.active40=act();o.bodies40=P.PHYS.stats().bodies;return o;},[X,Z]);
console.log('B',JSON.stringify(B1));await p.evaluate(()=>__adv(2,true));
console.log('HB',JSON.stringify(await p.evaluate(()=>{const B=BABYLON;return __six.map(a=>{const c=__pc.CH.get(a);const cen=name=>{const m=c.root.getChildMeshes(false).find(x=>x.name===name);m.skeleton.prepare(true);m.computeWorldMatrix(true);const M=m.skeleton.getTransformMatrices(m),P=m.getVerticesData('position'),I=m.getVerticesData('matricesIndices'),W=m.getVerticesData('matricesWeights'),wm=m.getWorldMatrix();let s=new B.Vector3(),n=0;
  for(let v=0;v<P.length/3;v+=8){const o=new B.Vector3(0,0,0),p0=new B.Vector3(P[v*3],P[v*3+1],P[v*3+2]);for(let k=0;k<4;k++){const w=W[v*4+k];if(w<=0)continue;const mm=B.Matrix.FromArray(M,I[v*4+k]*16);o.addInPlace(B.Vector3.TransformCoordinates(p0,mm).scale(w));}s.addInPlace(B.Vector3.TransformCoordinates(o,wm));n++;}return s.scale(1/n);};
  const h=cen('headm'),t=cen('torso');const bp=n=>{const q=c.body.skeleton.bones.find(b=>b.name.endsWith(':'+n)).getAbsolutePosition(c.body);return [q.x,q.y,q.z].map(v=>+v.toFixed(2)).join(',');};return {bn:['Hips','Spine2','Neck','LeftArm'].map(bp).join(' | '),head:[h.x,h.y,h.z].map(v=>+v.toFixed(2)),torso:[t.x,t.y,t.z].map(v=>+v.toFixed(2)),d:+B.Vector3.Distance(h,t).toFixed(2),frozen:c.rg&&c.rg.frozen};});})));
console.log('SK',JSON.stringify(await p.evaluate(()=>__six.map(a=>{const c=__pc.CH.get(a);return c.root.getChildMeshes(false).filter(m=>m.skeleton).map(m=>m.name+':'+m.skeleton.uniqueId+':'+m.skeleton.bones.length).join(' ')+' | frozen '+(c.rg&&c.rg.frozen)+' vari '+c.vari;}))));
await p.evaluate(()=>__adv(2,true));await p.waitForTimeout(400);await p.screenshot({path:`shots/rag/${name}_six_a.png`});
await p.evaluate(()=>__adv(60,true));await p.waitForTimeout(300);await p.screenshot({path:`shots/rag/${name}_six_b.png`});
const B2=await p.evaluate(()=>{const P=__pc;__adv(300);const bots=__six;return {active:bots.filter(a=>{const c=P.CH.get(a);return c&&c.rg&&!c.rg.frozen;}).length,frozen:bots.filter(a=>{const c=P.CH.get(a);return c&&c.rg&&c.rg.frozen;}).length,bodies:P.PHYS.stats().bodies};});
console.log('B2 (7 s depois)',JSON.stringify(B2));
await p.evaluate(()=>__adv(2,true));await p.waitForTimeout(300);await p.screenshot({path:`shots/rag/${name}_six_c.png`});
/* C) renasce: pose em pé de novo */
const C=await p.evaluate(([X,Z])=>{const P=__pc,bots=__six;bots.forEach((a,i)=>{a.alive=true;a.hp=1e9;a.pos.set(a.pos.x,0,a.pos.z);});window.__qcam.pos=[X+2.4,2.2,Z+7];window.__qcam.tgt=[X+.6,1,Z-.5];__adv(10,true);
  return bots.map(a=>{const c=P.CH.get(a);c.root.computeWorldMatrix(true);return {rg:!!c.rg,rot:[c.root.rotation.x,c.root.rotation.z].map(v=>+v.toFixed(2)).join(',')};});},[X,Z]);
console.log('C',JSON.stringify(C));await p.waitForTimeout(400);await p.screenshot({path:`shots/rag/${name}_revive.png`});
console.log(errs.slice(0,8).join('\n'));await b.close();})();
