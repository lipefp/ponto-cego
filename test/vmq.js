const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await (await b.newContext({viewport:{width:640,height:360}})).newPage();p.setDefaultTimeout(600000);/*v4: máquina compartilhada*/p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});/*v4: boot assíncrono*/await p.waitForTimeout(3500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));for(let k=0;k<60*31;k++)__pc.simStep(__pc.SIM_DT);});await p.waitForTimeout(1500);
const vmq=await p.evaluate(()=>{const P=__pc,pl=P.player,sc=P.game,cam=P.camera,eng=P.engine,out=[];const B=BABYLON;
  for(const id of ['pistol','smg','rifle','shotgun']){for(const mode of ['ads','hip']){pl.w.p={id,mag:30,res:90};pl.cur='p';pl.reloadT=0;pl.act=null;pl.ads=mode==='ads'?1:0;pl.vel.set(0,0,0);pl.punch=0;
    P.VM.key='';P.updateCamera(.016);P.updateVM(.016);P.VM.drawT=0;P.VM.kick=0;P.VM.swayX=P.VM.swayY=0;P.updateVM(.016);
    cam.computeWorldMatrix(true);sc.updateTransformMatrix(true);const I=P.VM.info;for(let n=I.g;n;n=n.parent)n.computeWorldMatrix&&n.computeWorldMatrix(true);
    const wm=I.g.computeWorldMatrix(true),w=eng.getRenderWidth(),h=eng.getRenderHeight();
    const sp=B.Vector3.TransformCoordinates(new B.Vector3(I.sight.x,I.sight.y,I.sight.z),wm);const pr=B.Vector3.Project(sp,B.Matrix.Identity(),sc.getTransformMatrix(),cam.viewport.toGlobal(w,h));
    const bd=B.Vector3.TransformNormal(new B.Vector3(0,0,-1),wm).normalize(),cf=cam.getDirection(new B.Vector3(0,0,-1)).normalize();
    out.push({id,mode,dx:pr.x-w/2,dy:pr.y-h/2,ang:Math.acos(Math.min(1,B.Vector3.Dot(bd,cf)))*180/Math.PI,w});}}
  return out;});
console.log(JSON.stringify(vmq.map(r=>({id:r.id,m:r.mode,dx:r.dx.toFixed(1),dy:r.dy.toFixed(1),a:r.ang.toFixed(1)}))));await b.close();})();