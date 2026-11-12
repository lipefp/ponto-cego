const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await (await b.newContext({viewport:{width:1600,height:600}})).newPage();p.setDefaultTimeout(600000);/*v4: máquina compartilhada*/const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});/*v4: boot assíncrono*/await p.waitForTimeout(3000);
await p.evaluate(()=>{const P=__pc,V3=P.V3;const sc=new BABYLON.Scene(P.engine);sc.useRightHandedSystem=true;sc.clearColor=new BABYLON.Color4(.62,.66,.68,1);
  const cam=new BABYLON.ArcRotateCamera('c',-Math.PI/2,1.42,8.2,new BABYLON.Vector3(4.5,.9,0),sc);cam.fov=.7;window.__cam=cam;
  new BABYLON.HemisphericLight('h',new BABYLON.Vector3(.3,1,.2),sc).intensity=1.1;const d=new BABYLON.DirectionalLight('d',new BABYLON.Vector3(-.5,-1,-.6),sc);d.intensity=2.2;
  const g=BABYLON.MeshBuilder.CreateGround('g',{width:30,height:10},sc);const gm=new BABYLON.StandardMaterial('gm',sc);gm.diffuseColor=new BABYLON.Color3(.22,.23,.24);g.material=gm;
  const op=P.OPS.atk[0];const S=[['parado',[0,0]],['anda',[0,-4.4]],['ré',[0,3]],['lado',[3.5,0]],['corre',[0,-6.2],{sprint:true}],['agach.',[0,-2],{crouch:1}],['inclina',[0,0],{lean:1}],['recarga',[0,0],{reload:1}],['morte',[0,0],{dead:1}]];
  window.__chars=S.map(([n,v,o],i)=>{o=o||{};const ch=P.buildCharacter(sc,op,'enemy');P.setCharWeapon(ch,op.prim,'padrao');
    const a={id:i,alive:!o.dead,pos:new V3(i*1.15,0,0),vel:new V3(v[0],0,v[1]),yaw:0,pitch:0,crouchK:o.crouch||0,lean:o.lean||0,ads:0,sprint:!!o.sprint,reloadT:o.reload?1.4:0,cur:'p',w:{p:{id:op.prim}},fireT:-9,ai:{hurtFrom:new V3(i*1.15,0,-10)},lastHead:false};return {ch,a,base:i*1.15};});
  window.__step=(n)=>{for(let k=0;k<n;k++)for(const c of __chars){P.animChar(c.ch,c.a,1/60);c.a.pos.x=c.base;c.a.pos.z=0;c.ch.disp.x=c.base;c.ch.disp.z=0;if(c.a.reloadT>0){c.a.reloadT-=1/60;if(c.a.reloadT<=0)c.a.reloadT=1.4;}}};
  P.engine.stopRenderLoop();P.engine.runRenderLoop(()=>sc.render());});
for(let f=0;f<4;f++){await p.evaluate(()=>__step(9));await p.waitForTimeout(900);await p.screenshot({path:`shots/qa/07-sheet-${f}.png`});}
await p.evaluate(()=>{for(const c of __chars){const y=Math.PI/2,vx=c.a.vel.x,vz=c.a.vel.z;c.a.yaw=y;c.ch.dyaw=y;c.a.vel.set(vx*Math.cos(y)+vz*Math.sin(y),0,-vx*Math.sin(y)+vz*Math.cos(y));}});
for(let f=0;f<4;f++){await p.evaluate(()=>__step(9));await p.waitForTimeout(900);await p.screenshot({path:`shots/qa/08-side-${f}.png`});}
console.log(errs.join('\n'));await b.close();})();
