// Folha com todas as armas (vista lateral direita): node test/wsheet.js [low] [ids json] [nome]
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:1400,height:900},offline:true})).newPage();p.setDefaultTimeout(600000);/*v4: máquina compartilhada*/
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});/*v4: boot assíncrono*/await p.waitForTimeout(3000);
const low=process.argv[2]==='low',ids=process.argv[3]?JSON.parse(process.argv[3]):null,name=process.argv[4]||(low?'wsheet_low':'wsheet');
if(process.env.ONLYMAG)await p.evaluate(()=>window.__onlyMag=1);
const r=await p.evaluate(([low,ids])=>{const B=BABYLON,P=__pc;
  const sc=new B.Scene(P.engine);sc.clearColor=new B.Color4(.42,.45,.47,1);
  const cam=new B.ArcRotateCamera('c',0,Math.PI/2,3,new B.Vector3(0,0,0),sc);cam.mode=B.Camera.ORTHOGRAPHIC_CAMERA;
  const h=new B.HemisphericLight('h',new B.Vector3(.3,1,.4),sc);h.intensity=.9;h.groundColor=new B.Color3(.3,.28,.25);const d=new B.DirectionalLight('d',new B.Vector3(-.6,-.8,-.4),sc);d.intensity=2.4;d.diffuse=new B.Color3(1,.94,.86);
  const L=ids||Object.keys(P.WEAPONS).filter(k=>!k.includes('@'));const out=[];const cols=4;
  L.forEach((id,i)=>{const t0=performance.now();const w=P.buildWeapon(sc,id,'padrao',low);const dt=performance.now()-t0;const c=i%cols,rr=(i/cols)|0;w.g.position.set(0,1.6-rr*.42,-1.6+c*1.08);
    let v=0,dc=0;for(const m of w.g.getChildMeshes()){v+=m.getTotalVertices();dc+=m.subMeshes.length;if(window.__onlyMag&&m.name!=="mag")m.setEnabled(false);}out.push(id+' v'+v+' d'+dc+' '+dt.toFixed(0)+'ms');});
  const W=P.engine.getRenderWidth(),H=P.engine.getRenderHeight(),half=L.length<3?.5:2.25;if(L.length<3)for(const m of sc.meshes)if(m.parent&&m.parent.name==="weapon"||m.name==="mag"){}cam.orthoLeft=-half;cam.orthoRight=half;cam.orthoTop=half*H/W;cam.orthoBottom=-half*H/W;cam.target.set(0,L.length<3?1.6:.95,L.length<3?-1.4:0);cam.alpha=0;cam.beta=Math.PI/2;cam.radius=5;
  window.__sc=sc;P.engine.stopRenderLoop();P.engine.runRenderLoop(()=>sc.render());return out;},[low,ids]);
await p.waitForTimeout(2500);await p.screenshot({path:`shots/w/${name}.png`});
console.log(r.join('\n'));console.log(errs.slice(0,8).join('\n')||'ok');await b.close();})();
