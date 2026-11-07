// catálogo visual: lado de cada arma (modelo real/procedural do jogo) em fundo neutro → shots/cat/<id>.png
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
fs.mkdirSync('shots/cat',{recursive:true});
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:400000,polling:500});
await p.evaluate(()=>{const P=__pc;P.setMenuTab('arsenal');P.freezeShow();P.uiLobby.rootContainer.isVisible=false;P.lobby.clearColor=new BABYLON.Color4(.16,.19,.23,1);
  const keep=new Set();P.show.getChildMeshes().forEach(m=>keep.add(m));P.lobby._keep=keep;});
const ids=await p.evaluate(()=>__pc.WLIST.slice());
for(const id of ids){
  await p.evaluate(id=>{const P=__pc;P.setArs(id);P.setYaw(Math.PI/2);},id);
  await p.waitForTimeout(700);
  await p.evaluate(()=>{const P=__pc;P.setYaw(Math.PI/2);const sh=new Set(P.show.getChildMeshes());for(const m of P.lobby.meshes){if(!sh.has(m)&&m.name!=='__root__')m.setEnabled(false);}});
  await p.waitForTimeout(500);
  await p.screenshot({path:`shots/cat/full_${id}.png`});
  await p.evaluate(()=>{for(const m of __pc.lobby.meshes)m.setEnabled(true);});
  console.log(id);}
await b.close();})();
