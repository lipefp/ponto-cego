// Só a parte de animação do qa-browser (rápido, sem fotos) + medida do pitch da arma
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n').slice(1,3).join(' ')));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push('C'+m.type()[0]+' '+m.text().slice(0,160));});
const gates=[];const gate=(n,ok,v)=>gates.push([n,!!ok,v]);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForTimeout(3500);await p.evaluate(()=>__pc.engine.stopRenderLoop());
/* animação: cada operador em cada estado, 2 s a 60 Hz */
const anim=await p.evaluate(()=>{const P=__pc,V3=P.V3,sc=P.game,res=[];const ops=P.OPS.atk.concat(P.OPS.def);
  const foot=new BABYLON.Vector3(0,-.49,-.04),hd=new BABYLON.Vector3(0,0,0);
  const states={parado:{v:[0,0]},anda:{v:[0,-4.4]},re:{v:[0,3]},lado:{v:[3.5,0]},diagonal:{v:[2.6,-2.6]},corre:{v:[0,-6.2],sprint:true},agachado:{v:[0,-2],crouch:1},inclinado:{v:[0,0],lean:1},mirando:{v:[0,0],ads:1},recarga:{v:[0,-2],reload:1}};
  for(const op of ops){const ch=P.buildCharacter(sc,op,'enemy');P.setCharWeapon(ch,op.prim,'padrao');
    for(const [sn,st] of Object.entries(states)){const a={id:1,alive:true,pos:new V3(0,0,0),vel:new V3(st.v[0],0,st.v[1]),yaw:0,pitch:0,crouchK:st.crouch||0,lean:st.lean||0,ads:st.ads||0,sprint:!!st.sprint,reloadT:st.reload?1.2:0,cur:'p',w:{p:{id:op.prim}},fireT:-9,ai:{}};
      ch.disp=null;let minF=9,maxF=-9,nan=0,minHead=9,headAboveHips=true,gunAng=0,spread=0,headX=0;
      for(let i=0;i<120;i++){a.pos.x+=a.vel.x/60;a.pos.z+=a.vel.z/60;P.animChar(ch,a,1/60);ch.root.computeWorldMatrix(true);
        if(i<40)continue;
        const fp=[];for(const l of ch.legs){l.th.computeWorldMatrix(true);l.kn.computeWorldMatrix(true);const w=BABYLON.Vector3.TransformCoordinates(foot,l.kn.getWorldMatrix());fp.push(w);if(!isFinite(w.y))nan++;minF=Math.min(minF,w.y);maxF=Math.max(maxF,w.y);}
        spread=Math.max(spread,Math.hypot(fp[0].x-fp[1].x,fp[0].z-fp[1].z));
        const gw=ch.weapon.g.computeWorldMatrix(true);const gd=BABYLON.Vector3.TransformNormal(new BABYLON.Vector3(0,0,-1),gw).normalize();const bf=new BABYLON.Vector3(-Math.sin(a.yaw),0,-Math.cos(a.yaw));
        gunAng=Math.max(gunAng,Math.acos(Math.max(-1,Math.min(1,BABYLON.Vector3.Dot(new BABYLON.Vector3(gd.x,0,gd.z).normalize(),bf))))*180/Math.PI);
        ch.head.computeWorldMatrix(true);const h=ch.head.getAbsolutePosition();minHead=Math.min(minHead,h.y);headX=Math.max(headX,Math.abs(h.x-a.pos.x));if(h.y<ch.hips.getAbsolutePosition().y+.3)headAboveHips=false;}
      res.push({op:op.id,st:sn,minF,maxF,nan,minHead,headAboveHips,gunAng,spread,headX});}
    /* morte */
    const a={id:2,alive:false,pos:new V3(0,0,0),vel:new V3(0,0,0),yaw:0,pitch:0,crouchK:0,lean:0,ads:0,reloadT:0,cur:'p',w:{p:{id:op.prim}},ai:{hurtFrom:new V3(0,0,-10)},lastHead:false};
    ch.fall=null;for(let i=0;i<120;i++)P.animChar(ch,a,1/60);ch.root.computeWorldMatrix(true);
    let low=9;for(const m of ch.root.getChildMeshes()){if(!m.isEnabled())continue;const wm=m.computeWorldMatrix(true),pos=m.getVerticesData('position');if(!pos)continue;const v=new BABYLON.Vector3();for(let i=0;i<pos.length;i+=3){BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(pos[i],pos[i+1],pos[i+2],wm,v);if(v.y<low)low=v.y;}}
    let tl=9;for(const m of ch.root.getChildMeshes()){if(!m.isEnabled()||!m.skeleton)continue;const wm=m.computeWorldMatrix(true),pos=m.getPositionData(true,false);const v=new BABYLON.Vector3();for(let i=0;i<pos.length;i+=3){BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(pos[i],pos[i+1],pos[i+2],wm,v);if(v.y<tl)tl=v.y;}}
    res.push({op:op.id,st:'morte',rotX:ch.root.rotation.x,low,trueLow:tl});
    ch.root.dispose();}
  return res;});
const live=anim.filter(r=>r.st!=='morte'),dead=anim.filter(r=>r.st==='morte');
const badFloat=live.filter(r=>r.st!=='agachado'&&(r.minF>.08)),badSink=live.filter(r=>r.minF<-.06),badHigh=live.filter(r=>r.maxF>.55),badNan=live.filter(r=>r.nan),badHead=live.filter(r=>!r.headAboveHips);
gate('Pés tocam o chão em todos os estados (pé mais baixo ≤ 8 cm)',!badFloat.length,badFloat.length?badFloat.slice(0,4).map(r=>r.op+'/'+r.st+' '+r.minF.toFixed(2)).join('; '):'ok');
gate('Pés não afundam no chão (≥ −6 cm)',!badSink.length,badSink.length?badSink.slice(0,4).map(r=>r.op+'/'+r.st+' '+r.minF.toFixed(2)).join('; '):'ok');
gate('Passada sem chute exagerado (pé ≤ 55 cm)',!badHigh.length,badHigh.length?badHigh.slice(0,4).map(r=>r.op+'/'+r.st+' '+r.maxF.toFixed(2)).join('; '):'ok');
const aimSt=live.filter(r=>['parado','anda','re','mirando','agachado','inclinado','diagonal','lado'].includes(r.st)),badGun=aimSt.filter(r=>r.gunAng>12);
gate('Arma dos bonecos aponta para a frente do corpo (≤ 12°) fora de correr/recarregar',!badGun.length,badGun.length?badGun.slice(0,4).map(r=>r.op+'/'+r.st+' '+r.gunAng.toFixed(0)+'°').join('; '):'máx '+Math.max(...aimSt.map(r=>r.gunAng)).toFixed(1)+'°');
const badSpread=live.filter(r=>r.spread>(r.st==='corre'?1.15:1.0));gate('Abertura das pernas: andando ≤ 1,0 m, correndo ≤ 1,15 m (passada humana, sem espacate)',!badSpread.length,badSpread.length?badSpread.slice(0,4).map(r=>r.op+'/'+r.st+' '+r.spread.toFixed(2)).join('; '):'máx '+Math.max(...live.map(r=>r.spread)).toFixed(2)+' m');
const leanR=live.filter(r=>r.st==='inclinado');gate('Inclinar desloca a cabeça ≥ 30 cm (visível para o inimigo)',leanR.every(r=>r.headX>=.3),leanR.map(r=>r.headX.toFixed(2)).join(' '));
gate('Sem NaN na animação',!badNan.length,badNan.length+'');
gate('Cabeça sempre acima do quadril (vivo)',!badHead.length,badHead.length?badHead.slice(0,4).map(r=>r.op+'/'+r.st).join('; '):'ok');
gate('Morte: corpo deita (~90°) e não atravessa o chão (≥ −5 cm) e não flutua (≤ 15 cm)',dead.every(r=>Math.abs(Math.abs(r.rotX)-1.5)<.2&&r.low>-.05&&r.low<.15),dead.map(r=>r.rotX.toFixed(2)+'/'+r.low.toFixed(2)).join(' '));

console.log('mortes',JSON.stringify(anim.filter(r=>r.st==='morte').map(r=>[r.op,r.rotX.toFixed(2),r.low.toFixed(2),r.trueLow.toFixed(2)])));
const pit=await p.evaluate(()=>{const P=__pc,sc=P.game,out=[];const op=P.OPS.def[3];const ch=P.buildCharacter(sc,op,'enemy');P.setCharWeapon(ch,op.prim,'padrao');
  for(const pt of [-.6,0,.3,.6]){const a={id:1,alive:true,pos:new P.V3(0,0,0),vel:new P.V3(0,0,0),yaw:0,pitch:pt,crouchK:0,lean:0,ads:0,sprint:false,reloadT:0,cur:'p',w:{p:{id:op.prim}},fireT:-9,ai:{}};
    for(let i=0;i<30;i++)P.animChar(ch,a,1/60);ch.root.computeWorldMatrix(true);const gw=ch.weapon.g.computeWorldMatrix(true);const gd=BABYLON.Vector3.TransformNormal(new BABYLON.Vector3(0,0,-1),gw).normalize();out.push(pt+'→'+Math.asin(gd.y).toFixed(2));}
  ch.root.dispose();return out.join(' ');});
console.log('pitch arma',pit);
let fail=0;for(const [n,ok,v] of gates){if(!ok)fail++;console.log(`${ok?'PASSOU ':'REPROVOU'}  ${n}  →  ${v}`);}
const real=errs.filter(e=>!/WebGL|GPU stall|GL Driver|swiftshader|Automatic fallback/i.test(e));console.log('erros',real.slice(0,5).join(' || '));
fs.writeFileSync('dist/opqa.json',JSON.stringify(anim,null,1));
await b.close();})();
