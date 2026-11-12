// 3ª pessoa: operadores segurando pistola, fuzil, escopeta e SMG (pose parada e mirando)
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);/*v4: máquina compartilhada*/const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n')[1]));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});/*v4: boot assíncrono*/await p.waitForTimeout(3000);
await p.evaluate(()=>{const B=BABYLON,P=__pc,V3=P.V3;const sc=new B.Scene(P.engine);sc.clearColor=new B.Color4(.45,.48,.5,1);
  const cam=new B.ArcRotateCamera('c',-Math.PI/2+.5,1.35,4.2,new B.Vector3(0,1.25,0),sc);cam.minZ=.05;new B.HemisphericLight('h',new B.Vector3(.3,1,.2),sc).intensity=1;const d=new B.DirectionalLight('d',new B.Vector3(-.5,-1,.6),sc);d.intensity=2;
  const ops=P.OPS.atk.concat(P.OPS.def),W=['pistol','jaguar','abelha','rifle','tupa','shotgun','smg','boitata'];
  W.forEach((wid,i)=>{const op=ops[i%ops.length],ch=P.buildCharacter(sc,op,'enemy');P.setCharWeapon(ch,wid,'padrao');const a={id:i,alive:true,pos:new V3((i-3.5)*.85,0,0),vel:new V3(0,0,0),yaw:0,pitch:0,crouchK:0,lean:0,ads:i%2,sprint:false,reloadT:0,cur:'p',w:{p:{id:wid}},fireT:-9,ai:{}};
    for(let k=0;k<60;k++)P.animChar(ch,a,1/60);});
  P.engine.stopRenderLoop();P.engine.runRenderLoop(()=>sc.render());window.__cam=cam;});
await p.waitForTimeout(2500);await p.screenshot({path:'shots/w/tp_a.png'});
await p.evaluate(()=>{__cam.alpha=-Math.PI/2-.15;__cam.beta=1.45;__cam.radius=2.2;__cam.target.set(-2.55,1.3,0);});await p.waitForTimeout(2000);await p.screenshot({path:'shots/w/tp_b.png'});
console.log(errs.join('\n')||'ok');await b.close();})();
