// vista lateral das armas reais com acessórios (monta em game, câmera lateral). uso: node test/wside.js '["id@sight.barrel.grip.laser",...]'
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs');fs.mkdirSync('shots/side',{recursive:true});
(async()=>{const list=JSON.parse(process.argv[2]);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:300000,polling:500}).catch(()=>{});
await p.evaluate(()=>{__pc.engine.stopRenderLoop();window.__side=null;__pc.uiLobby.rootContainer.alpha=0;__pc.lobby.clearColor=new BABYLON.Color4(.35,.38,.42,1);});await p.waitForTimeout(500);
let k=0;for(const spec of list){const [id,a]=spec.split('@'),at=a?a.split('.'):['iron','none','none','0'];
  await p.evaluate(([id,at])=>{const P=__pc,B=BABYLON,sc=P.lobby;if(window.__side){window.__side.g.dispose(false,false);window.__side=null;}
    const vid=P.wVariant(id,{sight:at[0],barrel:at[1],grip:at[2],laser:+at[3]});const root=new B.TransformNode('sideroot',sc);root.position.set(0,8,0);
    const info=P.buildWeapon(sc,vid,'padrao',false);info.g.parent=root;window.__side={g:root};
    for(const m of root.getChildMeshes())m.layerMask=0x0FFFFFFF;
    const cam=new B.FreeCamera('sidecam',new B.Vector3(1.1,8.02,-.15),sc);cam.setTarget(new B.Vector3(0,8.02,-.15));cam.fov=.55;cam.minZ=.05;sc.activeCamera=cam;window.__sidecam=cam;
    for(let i=0;i<3;i++)sc.render();window.__dbg=root.getChildMeshes().map(m=>m.name+' en='+m.isEnabled()+' vis='+m.isVisible+' wp='+m.getAbsolutePosition().asArray().map(x=>x.toFixed(1)).join(',')+' act='+(sc.activeCamera&&sc.activeCamera.name)).slice(0,5);},[id,at]);console.log(await p.evaluate(()=>window.__dbg));
  await p.screenshot({path:`shots/side/${k++}_${id}.png`});console.log(spec);}
console.log(errs.join('\n'));await b.close();})();
