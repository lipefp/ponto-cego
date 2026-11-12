/* 1ª pessoa com mãos reais: fotos de qualquer arma/estado numa só sessão.
   node test/fp.js '[{"n":"ar_hip","w":"rifle"},{"n":"ar_rel","w":"rifle","force":{"st":"reload","t":1.2}},{"n":"p_ads","w":"pistol","slot":"s","ads":1}]'
   campos: n (nome) w (arma) slot ('p'/'s') ads (0/1) sight (mira) force {st:idle|draw|reload|rempty|holster,t} yaw pitch js (código extra) sprint */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|swiftshader/i.test(m.text()))errs.push(m.type()+' '+m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(4000);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1500);
await p.evaluate(()=>{for(let i=0;i<60*31;i++)__pc.simStep(__pc.SIM_DT);__pc.player.hp=1e6;for(const a of __pc.G.agents||[])if(a!==__pc.player)a.hp=1e6;const pl=__pc.player;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;pl.pitch=0;});
process.on('unhandledRejection',e=>{console.log('ERR',String(e).slice(0,300));console.log(errs.slice(0,12).join('\n'));process.exit(1);});
const list=JSON.parse(process.argv[2]);const fr=()=>p.evaluate(()=>__pc.game.getFrameId());
for(const o of list){
  await p.evaluate(o=>{const pl=__pc.player;const id=o.sight&&__pc.wVariant?__pc.wVariant(o.w,{sight:o.sight}):o.w;const sl=o.slot||(__pc.WEAPONS[o.w]&&__pc.WEAPONS[o.w].slot)||'p';pl.cur=sl;pl.w[sl].id=id;
    pl.pitch=o.pitch||0;pl.yaw=o.yaw==null?1.2:o.yaw;__pc.INPUT.ads=!!o.ads;pl.sprint=!!o.sprint;pl.reloadT=0;
    const V=__pc.VM;V.force=o.force||null;V.noHolster=true;V.drawT=0;if(o.js)eval(o.js);
    const sc=__pc.game,cam=__pc.camera,Bj=BABYLON;
    if(!window.__piv){window.__piv=new Bj.TransformNode('vpiv',sc);window.__piv.parent=cam;sc.onBeforeRenderObservable.add(()=>{const o=window.__orb,vr=__pc.VM&&sc.getTransformNodeByName('vm');if(!vr)return;
      if(!o){if(vr.parent!==cam)vr.parent=cam;return;}
      if(vr.parent!==window.__piv)vr.parent=window.__piv;const pv=window.__piv;pv.rotation.set(o[1]*Math.PI/180,o[0]*Math.PI/180,0);
      const p=vr.position.clone();const m=new Bj.Matrix();Bj.Matrix.RotationYawPitchRollToRef(pv.rotation.y,pv.rotation.x,0,m);const rp=Bj.Vector3.TransformCoordinates(p,m);
      pv.position.set(-rp.x,-rp.y,-rp.z-o[2]);pv.computeWorldMatrix(true);vr.computeWorldMatrix(true);const inv=cam.getWorldMatrix().clone().invert(),cur=Bj.Vector3.TransformCoordinates(vr.getAbsolutePosition(),inv);pv.position.addInPlace(new Bj.Vector3(-cur.x+(o[3]||0),-cur.y+(o[4]||0),-o[2]-cur.z));});}
    window.__orb=o.orbit||null;
    if(o.joints&&!window.__jt){window.__jt=1;const f=V.fpv.cur;sc.setRenderingAutoClearDepthStencil(2,true,true,true);const cols={RightHand:[1,0,0],LeftHand:[0,0,1],RightHandIndex4:[1,1,0],LeftHandIndex4:[0,1,1],RightArm:[1,0,1],LeftArm:[0,1,0],RightForeArm:[1,.5,0],LeftForeArm:[0,.5,1],Main_j:[1,1,1]};
      for(const nm in cols){const sp=Bj.MeshBuilder.CreateSphere('dbg_'+nm,{diameter:.025},sc);const m=new Bj.StandardMaterial('dm'+nm,sc);m.emissiveColor=new Bj.Color3(...cols[nm]);m.disableLighting=true;sp.material=m;sp.parent=f.nodes[f.idx[nm]];sp.renderingGroupId=2;}}},o);
  const f0=await fr();await p.waitForFunction(f=>__pc.game.getFrameId()>=f+(window.__fpw||4),f0,{timeout:90000,polling:200});
  await p.waitForTimeout(300);await p.screenshot({path:`shots/fp_${o.n}.png`});console.log(o.n);}
console.log(errs.slice(0,12).join('\n'));await b.close();})();
