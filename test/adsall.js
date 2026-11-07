// ADS em TODAS as armas × todas as miras: ponto da mira no centro (≤1,2% da largura) e cano alinhado (≤2°); imagens de ferro + 1 óptica em shots/adsall/. Falha (exit 1) se algo estourar.
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs');fs.mkdirSync('shots/adsall',{recursive:true});
(async()=>{const VW=+(process.env.VW||640),VH=+(process.env.VH||360);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:VW,height:VH},offline:true})).newPage();p.setDefaultTimeout(600000);const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;pl.pitch=0;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();});
const ids=process.env.IDS?process.env.IDS.split(','):await p.evaluate(()=>__pc.WLIST);const sights=(process.env.SIGHTS||'iron,red,holo,reflex,x15,x2,x25').split(',');let bad=0,n=0;const rows=[];
for(const id of ids){for(const sight of sights){
  const r=await p.evaluate(async([id,sight,VW])=>{const P=__pc,pl=P.player,B=BABYLON,sc=P.game,cam=P.camera,eng=P.engine,slot=P.WEAPONS[id].slot;
    const vid=P.wVariant(id,{sight,barrel:'none',grip:'none',laser:0});pl.w[slot]={id:vid,mag:30,res:90};pl.cur=slot;pl.reloadT=0;pl.act=null;pl.ads=1;P.INPUT.ads=true;pl.vel.set(0,0,0);pl.punch=0;
    P.VM.key='';for(let i=0;i<150;i++){P.updateCamera(1/60);P.updateVM(1/60);}P.VM.drawT=0;P.VM.kick=0;P.VM.swayX=P.VM.swayY=0;P.updateVM(1/60);
    cam.computeWorldMatrix(true);sc.updateTransformMatrix(true);const I=P.VM.info;if(!I||!I.g)return null;for(let nn=I.g;nn;nn=nn.parent)nn.computeWorldMatrix&&nn.computeWorldMatrix(true);
    const wm=I.g.computeWorldMatrix(true),w=eng.getRenderWidth(),h=eng.getRenderHeight();
    const sp=B.Vector3.TransformCoordinates(new B.Vector3(I.sight.x,I.sight.y,I.sight.z),wm),pr=B.Vector3.Project(sp,B.Matrix.Identity(),sc.getTransformMatrix(),cam.viewport.toGlobal(w,h));
    const bd=B.Vector3.TransformNormal(new B.Vector3(0,0,-1),wm).normalize(),cf=cam.getDirection(new B.Vector3(0,0,-1)).normalize();
    return {dx:pr.x-w/2,dy:pr.y-h/2,ang:Math.acos(Math.min(1,B.Vector3.Dot(bd,cf)))*180/Math.PI,w,real:!!(P.WM&&P.WM.on&&P.WREAL[P.wBase?P.wBase(id):id])};},[id,sight,VW]);
  if(!r){console.log('SEM INFO',id,sight);bad++;continue;}n++;const off=Math.hypot(r.dx,r.dy),ok=off<=r.w*.012&&r.ang<=2;if(!ok)bad++;
  rows.push(`${ok?'OK  ':'FORA'} ${id.padEnd(11)} ${sight.padEnd(7)} ${r.real?'real':'proc'} desvio ${off.toFixed(1)}px (${(100*off/r.w).toFixed(2)}%) ângulo ${r.ang.toFixed(2)}°`);
  if(!ok||process.env.ALLSHOTS||sight==='iron'||sight==='red'){await p.evaluate(()=>__pc.game.render());await p.screenshot({path:`shots/adsall/${id}_${sight}.png`});}}}
console.log(rows.join('\n'));console.log(errs.join('\n'));console.log(bad||errs.length?`ADS REPROVADO (${bad} de ${n+bad})`:`ADS APROVADO (${n} combinações)`);await b.close();process.exit(bad||errs.length?1:0);})();
