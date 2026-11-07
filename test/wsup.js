// verificação numérica dos canos (sup/flash/comp/brake/ext) nos modelos reais: comprimento acrescentado e raio do acessório
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await (await b.newContext({viewport:{width:320,height:180},offline:true})).newPage();p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:300000,polling:500}).catch(()=>{});
console.log(await p.evaluate(()=>{const P=__pc,B=BABYLON,sc=P.lobby,out=[];
 const ext=(info)=>{info.g.computeWorldMatrix(true);let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];const inv=info.g.getWorldMatrix().clone().invert();
  for(const m of info.g.getChildMeshes()){if(!m.getTotalVertices)continue;m.computeWorldMatrix(true);const bb=m.getBoundingInfo().boundingBox;for(const c of bb.vectorsWorld){const v=B.Vector3.TransformCoordinates(c,inv);mn=[Math.min(mn[0],v.x),Math.min(mn[1],v.y),Math.min(mn[2],v.z)];mx=[Math.max(mx[0],v.x),Math.max(mx[1],v.y),Math.max(mx[2],v.z)];}}return {mn,mx};};
 for(const id of ['rifle','tupa','smg','pistol','carcara','dmr']){const base=P.buildWeapon(sc,P.wVariant(id,{sight:'iron',barrel:'none',grip:'none',laser:0}),'padrao',false);const e0=ext(base);const t0=base.tip.z;base.g.dispose();
  for(const br of ['sup','flash','comp','brake','ext']){const inf=P.buildWeapon(sc,P.wVariant(id,{sight:'iron',barrel:br,grip:'none',laser:0}),'padrao',false);const e=ext(inf);
   out.push(id.padEnd(8)+br.padEnd(6)+' comprimento +'+(e0.mn[2]-e.mn[2]).toFixed(3)+' m · altura total '+((e.mx[1]-e.mn[1])).toFixed(3)+' (sem acessório '+((e0.mx[1]-e0.mn[1])).toFixed(3)+') · largura '+((e.mx[0]-e.mn[0])).toFixed(3)+' (sem '+((e0.mx[0]-e0.mn[0])).toFixed(3)+') · ponta z '+inf.tip.z.toFixed(3)+' (base '+t0.toFixed(3)+')');inf.g.dispose();}}
 return out.join('\n');}));await b.close();})();
