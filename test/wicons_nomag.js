/* gera silhuetas (PNG branco com alpha) das 16 armas a partir dos modelos reais do jogo → src/ui/24-wicons.js */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:300000,polling:200});await p.waitForTimeout(3000);
await p.evaluate(()=>{window.__nomag=true;});const ids=['rifle','jararaca','tupa','boitata','smg','marimbondo','cascavel','abelha','shotgun','ressaca','dmr','carcara','pistol','onca','pardal','jaguar'];
const out={};
for(const id of ids){
  const url=await p.evaluate(async(id)=>{
    const B=BABYLON,eng=__pc.engine;const sc=__pc.game;const off=sc.meshes.filter(m=>m.isEnabled());off.forEach(m=>m.setEnabled(false));const adts=(__pc.engine.scenes||[]).flatMap(x=>x.textures).concat(sc.textures).filter(t=>t&&t.getClassName&&t.getClassName()==='AdvancedDynamicTexture');const adv=adts.map(t=>[t,t.rootContainer.isVisible]);adv.forEach(([t])=>t.rootContainer.isVisible=false);const lay=sc.layers?sc.layers.map(l=>[l,l.isEnabled]):[];lay.forEach(([l])=>l.isEnabled=false);const oc=sc.clearColor.clone();sc.clearColor=new B.Color4(0,0,0,1);
    const w=__pc.buildWeapon(sc,id,'padrao');
    if(window.__nomag&&w.mag)w.mag.setEnabled(false);
    const white=new B.StandardMaterial('w',sc);white.emissiveColor=new B.Color3(1,1,1);white.disableLighting=true;white.diffuseColor=new B.Color3(0,0,0);white.specularColor=new B.Color3(0,0,0);white.fogEnabled=false;
    w.g.getChildMeshes().forEach(m=>{m.material=white;m.setEnabled(true);m.isVisible=true;});
    w.g.computeWorldMatrix(true);
    const ms=w.g.getChildMeshes();let mn=new B.Vector3(1e9,1e9,1e9),mx=new B.Vector3(-1e9,-1e9,-1e9);
    for(const m of ms){m.computeWorldMatrix(true);const bb=m.getBoundingInfo().boundingBox;mn=B.Vector3.Minimize(mn,bb.minimumWorld);mx=B.Vector3.Maximize(mx,bb.maximumWorld);}
    const cx=(mn.x+mx.x)/2,cy=(mn.y+mx.y)/2,cz=(mn.z+mx.z)/2,hz=(mx.z-mn.z)/2,hy=(mx.y-mn.y)/2;
    const cam=new B.FreeCamera('c',new B.Vector3(cx+3,cy,cz),sc);cam.layerMask=0x0FFFFFFF;cam.setTarget(new B.Vector3(cx,cy,cz));cam.mode=B.Camera.ORTHOGRAPHIC_CAMERA;
    const cv=eng.getRenderingCanvas();const asp=cv.width/cv.height;const hh=Math.max(hy*1.1,hz*1.1/asp);cam.orthoTop=hh;cam.orthoBottom=-hh;cam.orthoLeft=-hh*asp;cam.orthoRight=hh*asp;
    cam.minZ=.01;cam.maxZ=20;const oa=sc.activeCamera;sc.activeCamera=cam;
    sc.render();const out=cv.toDataURL('image/png');
    sc.activeCamera=oa;cam.dispose();w.g.dispose(false,false);white.dispose();off.forEach(m=>m.setEnabled(true));sc.clearColor=oc;adv.forEach(([t,v])=>t.rootContainer.isVisible=v);lay.forEach(([l,v])=>l.isEnabled=v);return out;
  },id);
  out[id]=url;fs.writeFileSync('shots/wn_'+id+'.png',Buffer.from(url.split(',')[1],'base64'));console.log(id);
}
fs.writeFileSync('shots/wicons_nomag.json',JSON.stringify(out));console.log(errs.join('\n'));await b.close();})();
