// Trajetória da mão esquerda (quadro da arma) durante a recarga. node test/trace_lh.js id [empty]
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;pl.pitch=0;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();});
for(const id of process.argv[2].split(',')){
const r=await p.evaluate(async([id,emp])=>{const P=__pc,pl=P.player,B=BABYLON,W=P.WEAPONS[id],slot=W.slot;
 const step=dt=>{if(P.G.phase!=='over'){P.G.phase='action';P.G.phaseT=100;}P.simStep(P.SIM_DT);P.updateCamera(dt);P.updateVM(dt);};
 pl.w[slot]={id,mag:emp?0:Math.max(1,W.mag-8),res:99};pl.cur=slot;P.INPUT.ads=false;for(let i=0;i<80;i++)step(1/60);
 const rig=P.FPV.cur,w=rig.w;const loc=(n)=>{w.g.computeWorldMatrix(true);n.computeWorldMatrix(true);const inv=w.g.getWorldMatrix().clone().invert();const q=B.Vector3.TransformCoordinates(n.getAbsolutePosition(),inv);return [q.x,q.y,q.z].map(v=>+v.toFixed(3));};
 const out={anch:{grip:[w.grip.x,w.grip.y,w.grip.z],fore:[w.fore.x,w.fore.y,w.fore.z]},idleL:loc(rig.nodes[rig.LH]),idleR:loc(rig.nodes[rig.RH]),tr:[]};
 P.INPUT.reload=true;step(1/60);P.INPUT.reload=false;const N=Math.round(W.reload*60);
 for(let i=0;i<N;i+=Math.round(N/20)){for(let k=0;k<Math.round(N/20);k++)step(1/60);out.tr.push([+(i/N).toFixed(2),JSON.stringify(rig.dbgPull),loc(rig.nodes[rig.LH]),loc(rig.nodes[rig.RH])]);}
 return out;},[id,process.argv[3]==='1']);
console.log(id,'anchors',JSON.stringify(r.anch),'idleL',r.idleL,'idleR',r.idleR);for(const t of r.tr)console.log(' ',t[0],t[1],'L',t[2].join(','));}
await b.close();})();
