const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(2500);
const r=await p.evaluate(async(wp)=>{const P=__pc,B=BABYLON;P.engine.stopRenderLoop();const sc=P.game;await new Promise(r=>setTimeout(r,500));
 const op=P.OPS.atk[0],ch=P.buildCharacter(sc,op,'enemy',0);await new Promise(r=>setTimeout(r,1500));P.setCharWeapon(ch,wp,'padrao');
 const a={id:1,alive:true,pos:new P.V3(5,0,5),vel:new P.V3(0,0,0),yaw:0,pitch:0,crouchK:0,lean:0,ads:0,sprint:false,reloadT:0,cur:'p',w:{p:{id:wp,mag:30,res:90}},fireT:-9,hp:100,gadgetN:2,op,ai:{},onGround:true};
 const T=P.WEAPONS[wp].reload,out=[];for(let i=0;i<40;i++)P.animChar(ch,a,1/60);
 const X=ch.rig.idx;
 for(let f=0;f<=Math.round(T*60)+30;f++){a.reloadT=Math.max(0,T-f/60);P.animChar(ch,a,1/60);
   if(f%6===0){ch.root.computeWorldMatrix(true);for(const n of ch.root.getDescendants())n.computeWorldMatrix&&n.computeWorldMatrix(true);
     const w=ch.weapon;w.g.computeWorldMatrix(true);const lh=ch.rig.tn[X.LeftHand].getAbsolutePosition(),rh=ch.rig.tn[X.RightHand].getAbsolutePosition();
     const mg=w.mag?w.mag.getAbsolutePosition():null;const inv=w.g.getWorldMatrix().clone().invert();
     const L=B.Vector3.TransformCoordinates(lh,inv),M=B.Vector3.TransformCoordinates(mg,inv),R=B.Vector3.TransformCoordinates(rh,inv);
     const ve=B.Vector3.TransformCoordinates(ch.rig.tn[X.Spine2].getAbsolutePosition(),inv);
     out.push({rp:+(1-a.reloadT/T).toFixed(2),L:[L.x,L.y,L.z].map(v=>+v.toFixed(2)),mag:[M.x,M.y,M.z].map(v=>+v.toFixed(2)),dist:+B.Vector3.Distance(L,M).toFixed(2),R:[R.x,R.y,R.z].map(v=>+v.toFixed(2)),en:w.mag?w.mag.isEnabled():null,K:+ch.k.rel.toFixed(2)});}}
 return out;},process.argv[2]||'rifle');
for(const o of r)console.log(JSON.stringify(o));console.log(errs.join('\n'));await b.close();})();
