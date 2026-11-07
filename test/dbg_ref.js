const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{const P=__pc;P.engine.stopRenderLoop();const ch=P.buildCharacter(P.game,P.OPS.atk[0],'enemy',0);await new Promise(r=>setTimeout(r,1500));P.animChar(ch,{id:1,alive:true,pos:new P.V3(0,0,0),vel:new P.V3(0,0,0),yaw:0,pitch:0,crouchK:0,lean:0,ads:0,reloadT:0,cur:'p',w:{p:{id:'rifle'}},fireT:-9,hp:100,op:ch.op,ai:{},onGround:true},1/60);
 const R=__pcOPM.ref,X=ch.rig.idx,W=R.W0;const f=n=>[W[X[n]*3],W[X[n]*3+1],W[X[n]*3+2]].map(v=>+v.toFixed(3));
 const out={head:R.head,chest:R.chest,belly:R.belly,top:R.top,footH:R.footH};
 for(const n of ['Hips','Spine','Spine1','Spine2','Neck','LeftShoulder','LeftArm','LeftForeArm','LeftHand','LeftUpLeg','LeftLeg','LeftFoot','RightArm'])out[n]=f(n);
 return out;});console.log(JSON.stringify(r));await b.close();})();
