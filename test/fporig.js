/* referência: o glb ORIGINAL do pacote (com a arma do pacote) no mesmo enquadramento. node test/fporig.js g17|m4 '[[yaw,pitch,dist,clip,t],...]' */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{
const which=process.argv[2]||'g17',views=JSON.parse(process.argv[3]||'[[80,0,.4]]');
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
p.on('pageerror',e=>console.log('PE '+e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(3000);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1500);
await p.evaluate(()=>{for(let i=0;i<60*31;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;for(const a of __pc.G.agents||[])if(a!==pl)a.hp=1e6;__pc.VM.noHolster=true;});
const buf=fs.readFileSync('../fpwork/out/'+which+'_ref.glb');const b64=buf.toString('base64');
await p.evaluate(async b64=>{const u8=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const sc=__pc.game;
  __pc.VM.noHolster=true;document.getElementById&&0;__pc.VM.force=null;sc.getTransformNodeByName('vm').setEnabled(false);window.__vmOff=true;
  const r=await BABYLON.SceneLoader.ImportMeshAsync('','',u8,sc,null,'.glb');window.__orig=r;
  for(const m of r.meshes){m.renderingGroupId=1;m.alwaysSelectAsActiveMesh=true;}window.__ag=r.animationGroups;for(const g of r.animationGroups)g.stop();
  const top=r.meshes[0];window.__top=top;},b64);
for(const [yaw,pitch,dist,clip,t,dx,dy] of views){
  await p.evaluate(([yaw,pitch,dist,clip,t,dx,dy])=>{const sc=__pc.game,cam=__pc.camera,B=BABYLON,top=window.__top;top.parent=cam;top.rotationQuaternion=null;
    const g=window.__ag.find(g=>g.name===clip);for(const x of window.__ag)x.stop();if(g){g.start(false,1,0,g.to,false);g.goToFrame(Math.min(g.to,(t||0)*60));g.pause();}
    window.__ov={yaw,pitch,dist,dx:dx||0,dy:dy||0};
    if(!window.__ovh){window.__ovh=1;sc.onBeforeRenderObservable.add(()=>{const o=window.__ov,top=window.__top;if(!o)return;sc.getTransformNodeByName('vm').setEnabled(false);top.rotation.set(o.pitch*Math.PI/180,Math.PI+o.yaw*Math.PI/180,0);
      const M=window.__orig.transformNodes.find(n=>n.name==='Main_j');top.position.set(0,0,0);top.computeWorldMatrix(true);M.computeWorldMatrix(true);const inv=cam.getWorldMatrix().clone().invert();const cur=BABYLON.Vector3.TransformCoordinates(M.getAbsolutePosition(),inv);
      top.position.set(-cur.x+o.dx,-cur.y+o.dy,-cur.z-o.dist);});}
  },[yaw,pitch,dist,clip,t,dx,dy]);
  const f0=await p.evaluate(()=>__pc.game.getFrameId());await p.waitForFunction(f=>__pc.game.getFrameId()>=f+4,f0,{timeout:90000,polling:200});
  await p.screenshot({path:`shots/fo_${which}_${yaw}_${pitch}_${clip||'rest'}_${t||0}.png`});console.log('ok',yaw,pitch,JSON.stringify(await p.evaluate(()=>{const M=window.__orig.transformNodes.find(n=>n.name==='Main_j'),inv=__pc.camera.getWorldMatrix().clone().invert(),q=BABYLON.Vector3.TransformCoordinates(M.getAbsolutePosition(),inv);return [q.x,q.y,q.z,window.__top.getChildMeshes().length,window.__top.scaling.x,window.__orig.meshes.map(m=>m.name+':'+m.isEnabled()+':'+m.isVisible).slice(0,6)];})));}
await b.close();})();
