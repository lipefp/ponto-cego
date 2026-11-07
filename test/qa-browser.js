// =====================================================================
// QA RÍGIDO — navegador (Chromium sem GPU). Fluxo completo, custo de
// renderização, animação dos bonecos (pés no chão, NaN, queda) e fotos
// para revisão visual. Qualquer critério reprovado → código de saída 1.
// =====================================================================
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:1280,height:720},offline:true})).newPage();p.setDefaultTimeout(600000);/*v4: máquina compartilhada*/
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n').slice(1,3).join(' ')));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push('C'+m.type()[0]+' '+m.text().slice(0,160));});
process.on('unhandledRejection',e=>{console.log('UNH',String(e).slice(0,200),'\nERRS',errs.join('\n'));process.exit(1);});
fs.mkdirSync('shots/qa',{recursive:true});
const gates=[];const gate=(n,ok,v)=>gates.push([n,!!ok,v]);
await p.addInitScript(()=>{const o=Element.prototype.requestPointerLock;Element.prototype.requestPointerLock=function(){return o.call(this);};});/*headless: o pedido com unadjustedMovement fica pendente e engole o mouse; só no teste*/
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});/*v4: boot assíncrono*/await p.waitForTimeout(3500);
{const A=await p.evaluate(()=>{const T=__pc.ASSETS.tpl;return {ready:__pc.ASSETS.ready,failed:__pc.ASSETS.failed,n:Object.keys(T).length,used:Object.values(T).filter(t=>t.used).length,inst:Object.values(T).reduce((s,t)=>s+(t.mesh.thinInstanceCount||0),0)};});
 gate('Modelos .glb (CC0) embutidos carregam offline e decoram o mapa (≥ 8 moldes usados, ≥ 50 cópias)',A.ready&&!A.failed&&A.used>=8&&A.inst>=50,JSON.stringify(A));}
for(const t of['ops','arsenal','xh','opts','play']){await p.evaluate(t=>__pc.setMenuTab(t),t);await p.waitForTimeout(600);}
await p.screenshot({path:'shots/qa/01-lobby.png'});
/* partida: preparação com drone, ação, mira+tiro, correr, agachar, recarregar */
/* fluxo real: JOGAR → procurando partida → sorteio de mapa → CONFIRMAR operador → escolher ponto/objetivo → COMEÇAR */
await p.mouse.click(1100,660);await p.waitForFunction(()=>__pc.FLOW.step==='ban'||__pc.FLOW.step==='ops',null,{timeout:600000,polling:200});const sawBan=await p.evaluate(()=>__pc.FLOW.step==='ban');   /* banimento (v5.4.0) */
await p.waitForFunction(()=>__pc.FLOW.step==='ops',null,{timeout:600000,polling:200});
await p.mouse.click(170,672);await p.waitForFunction(()=>__pc.FLOW.step==='spawn',null,{timeout:900000,polling:100});await p.evaluate(()=>{__pc.FLOW.pickZone=0;__pc.FLOW.pickSite='A';__pc.FLOW.refresh();});await p.waitForTimeout(300);
await p.evaluate(()=>{const g=1;});await p.mouse.click(1100,660);await p.waitForTimeout(800);await p.evaluate(()=>document.dispatchEvent(new Event('pointerlockerror')));
await p.screenshot({path:'shots/qa/02-drone.png'});
await p.evaluate(()=>{for(let k=0;k<60*46;k++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;});
await p.keyboard.down('ShiftLeft');await p.keyboard.down('KeyW');await p.waitForTimeout(1500);
const sprint=await p.evaluate(()=>{for(let k=0;k<90;k++)__pc.simStep(__pc.SIM_DT);return {s:__pc.player.sprint,v:Math.hypot(__pc.player.vel.x,__pc.player.vel.z)};});   /* 1,5 s de simulação com Shift+W segurados */
await p.screenshot({path:'shots/qa/03-sprint-vm.png'});
await p.mouse.down();await p.waitForTimeout(300);await p.mouse.up();
const firedSprinting=await p.evaluate(()=>__pc.player.sinceShot<1);
await p.keyboard.up('ShiftLeft');await p.keyboard.up('KeyW');await p.waitForTimeout(600);
await p.keyboard.press('KeyC');await p.waitForTimeout(800);const crouch=await p.evaluate(()=>__pc.player.crouchK);
await p.keyboard.press('KeyC');await p.waitForTimeout(500);
const m0=await p.evaluate(()=>__pc.player.w.p.mag);await p.mouse.down({button:'right'});await p.waitForFunction(()=>__pc.INPUT.ads,null,{timeout:120000,polling:100});await p.evaluate(()=>{for(let k=0;k<40;k++)__pc.simStep(__pc.SIM_DT);});await p.mouse.down();await p.waitForFunction(()=>__pc.INPUT.fire,null,{timeout:120000,polling:100});await p.evaluate(()=>{for(let k=0;k<20;k++)__pc.simStep(__pc.SIM_DT);});await p.mouse.up();
const m1=await p.evaluate(()=>__pc.player.w.p.mag);await p.screenshot({path:'shots/qa/04-ads.png'});await p.mouse.up({button:'right'});
await p.keyboard.press('KeyR');await p.waitForTimeout(400);await p.evaluate(()=>{for(let k=0;k<6;k++)__pc.simStep(__pc.SIM_DT);});const rel=await p.evaluate(()=>__pc.player.reloadT>0);await p.screenshot({path:'shots/qa/05-reload-vm.png'});
gate('Contra bots não há tela de banimento',!sawBan,sawBan?'apareceu':'ok');
gate('Correr (Shift+W): sprint ativo e ≥ 5,4 m/s pela entrada real (lado sorteado: defensor pesado corre menos)',sprint.s&&sprint.v>=5.4,sprint.v.toFixed(2)+' m/s');
gate('Não atira enquanto corre',!firedSprinting,firedSprinting?'atirou':'ok');
gate('C alterna agachar',crouch>.9,crouch.toFixed(2));
gate('Atirar mirando gasta munição',m1<m0,m0+'→'+m1);
gate('R inicia recarga',rel,String(rel));
/* primeira pessoa: na mira (ADS) o ponto da mira tem que cair no centro da tela; no quadril o cano aponta para a frente */
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:400000,polling:500});
const vmq=await p.evaluate(()=>{const P=__pc,pl=P.player,sc=P.game,cam=P.camera,eng=P.engine,out=[];const B=BABYLON;
  for(const id of ['pistol','smg','rifle','shotgun']){for(const mode of ['ads','hip']){pl.w.p={id,mag:30,res:90};pl.cur='p';pl.reloadT=0;pl.act=null;pl.ads=mode==='ads'?1:0;pl.vel.set(0,0,0);pl.punch=0;
    P.VM.key='';P.updateCamera(.016);P.updateVM(.016);P.VM.drawT=0;P.VM.kick=0;P.VM.swayX=P.VM.swayY=0;P.updateVM(.016);
    cam.computeWorldMatrix(true);sc.updateTransformMatrix(true);const I=P.VM.info;for(let n=I.g;n;n=n.parent)n.computeWorldMatrix&&n.computeWorldMatrix(true);
    const wm=I.g.computeWorldMatrix(true),w=eng.getRenderWidth(),h=eng.getRenderHeight();
    const sp=B.Vector3.TransformCoordinates(new B.Vector3(I.sight.x,I.sight.y,I.sight.z),wm);const pr=B.Vector3.Project(sp,B.Matrix.Identity(),sc.getTransformMatrix(),cam.viewport.toGlobal(w,h));
    const bd=B.Vector3.TransformNormal(new B.Vector3(0,0,-1),wm).normalize(),cf=cam.getDirection(new B.Vector3(0,0,-1)).normalize();
    out.push({id,mode,dx:pr.x-w/2,dy:pr.y-h/2,ang:Math.acos(Math.min(1,B.Vector3.Dot(bd,cf)))*180/Math.PI,w});}}
  return out;});
const adsBad=vmq.filter(r=>r.mode==='ads'&&Math.hypot(r.dx,r.dy)>r.w*.012);
gate('Mira (ADS): ponto da mira no centro da tela (≤ 1,2% da largura) em todas as armas',!adsBad.length,vmq.filter(r=>r.mode==='ads').map(r=>r.id+' '+Math.hypot(r.dx,r.dy).toFixed(0)+'px').join(' · '));
const hipBad=vmq.filter(r=>r.ang>(r.mode==='ads'?2:9));
gate('Cano alinhado: ≤ 2° mirando, ≤ 9° no quadril',!hipBad.length,vmq.map(r=>r.id[0]+r.mode[0]+' '+r.ang.toFixed(1)+'°').join(' '));
/* custo de renderização numa visão ampla do prédio */
const perf=await p.evaluate(()=>{const pl=__pc.player;pl.pos.set(17.9*3,0,9.5*3);pl.yaw=-Math.PI/2;pl.pitch=-.05;
  const sc=__pc.game;const ins=new BABYLON.SceneInstrumentation(sc);ins.captureFrameTime=true;return new Promise(r=>setTimeout(()=>sc.onAfterRenderObservable.addOnce(()=>{const A=sc.getActiveMeshes(),cnt={};for(let i=0;i<A.length;i++){const m=A.data[i];if(!m||!m.subMeshes){cnt["!sem-submalha:"+(m&&m.name)]=1;continue;}const k=m.name;cnt[k]=(cnt[k]||0)+m.subMeshes.length;}r({names:cnt,draw:ins.drawCallsCounter.current,active:sc.getActiveMeshes().length,verts:sc.getActiveMeshes().data.slice(0,sc.getActiveMeshes().length).reduce((s,m)=>s+m.getTotalVertices()*(m.thinInstanceCount||1),0),meshes:sc.meshes.length,mats:sc.materials.length,tex:sc.textures.length});}),1500));});
const worst=await p.evaluate(()=>{const pl=__pc.player;pl.pos.set(18*3,0,7*3);pl.yaw=Math.PI;pl.pitch=-.05;let i=0;for(const a of __pc.agents){if(a===pl)continue;a.alive=true;a.hp=1e9;a.pos.set(17.2*3+(i%3)*1.2,0,9.5*3+Math.floor(i/3)*1.5);a.vel.set(0,0,0);i++;}
  const sc=__pc.game;const ins=new BABYLON.SceneInstrumentation(sc);return new Promise(r=>setTimeout(()=>sc.onAfterRenderObservable.addOnce(()=>{const A=sc.getActiveMeshes(),cnt={};for(let k=0;k<A.length;k++){const m=A.data[k];if(!m||!m.subMeshes)continue;cnt[m.name]=(cnt[m.name]||0)+m.subMeshes.length;}r({draw:ins.drawCallsCounter.current,cnt});}),1500));});
perf.worst=worst;
gate('Pior caso: 9 operadores na tela ≤ 450 chamadas de desenho (alta, com sombras + SSAO)',worst.draw<=450,worst.draw+'');
gate('Visão ampla do prédio ≤ 350 chamadas de desenho',perf.draw<=350,perf.draw+' (malhas ativas '+perf.active+')');
gate('Vértices ativos ≤ 1,2 milhão',perf.verts<=1.2e6,(perf.verts/1e3).toFixed(0)+' mil');
gate('Materiais ≤ 260',perf.mats<=260,perf.mats+'');
gate('Texturas ≤ 250 (armas reais + skins)',perf.tex<=250,perf.tex+'');
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
    ch.fall=null;ch.noRag=true;/* este gate mede a morte por clipe (reserva sem física); o ragdoll é validado em test/rag.js */for(let i=0;i<120;i++)P.animChar(ch,a,1/60);ch.root.computeWorldMatrix(true);
    let low=9;for(const m of ch.root.getChildMeshes()){if(!m.isEnabled())continue;const wm=m.computeWorldMatrix(true),pos=m.getVerticesData('position');if(!pos)continue;const v=new BABYLON.Vector3();for(let i=0;i<pos.length;i+=3){BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(pos[i],pos[i+1],pos[i+2],wm,v);if(v.y<low)low=v.y;}}
    res.push({op:op.id,st:'morte',rotX:ch.root.rotation.x,low});
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
/* fotos dos bonecos em movimento para a revisão visual */
await p.evaluate(()=>{const P=__pc,V3=P.V3,sc=P.game;const ops=P.OPS.atk.concat(P.OPS.def);window.__demo=[];
  const sts=[[0,-4.4,0,0],[0,-6.2,1,0],[3.5,0,0,0],[0,-2,0,1],[0,0,0,0]];
  ops.slice(0,5).forEach((op,i)=>{const ch=P.buildCharacter(sc,op,'enemy');P.setCharWeapon(ch,op.prim,'padrao');const st=sts[i];
    const a={id:i,alive:true,pos:new V3(18*3+i*1.6-3,0,9.3*3),vel:new V3(st[0],0,st[1]),yaw:Math.PI/2,pitch:0,crouchK:st[3],lean:0,ads:0,sprint:!!st[2],reloadT:0,cur:'p',w:{p:{id:op.prim}},fireT:-9,ai:{}};
    window.__demo.push({ch,a});});
  const pl=P.player;pl.pos.set(18*3,0,12.2*3);pl.yaw=0;pl.pitch=-.12;
  window.__demoStep=()=>{for(const d of window.__demo){d.a.pos.x+=0;P.animChar(d.ch,d.a,1/30);}};});
for(let f=0;f<4;f++){await p.evaluate(()=>{for(let i=0;i<5;i++)__demoStep();});await p.waitForTimeout(700);await p.screenshot({path:`shots/qa/06-anim-${f}.png`});}
/* morte e fim de partida */
await p.evaluate(()=>{__pc.player.hp=1;});
await p.evaluate(()=>{for(const a of __pc.agents)if(a.team!==__pc.player.team&&a.alive){a.pos.copy(__pc.player.pos);}});
await p.waitForTimeout(1500);
const real=errs.filter(e=>!/WebGL|GPU stall|GL Driver|swiftshader|Automatic fallback/i.test(e));
gate('Nenhum erro/aviso de JavaScript no fluxo completo',!real.length,real.length?real.slice(0,3).join(' || '):'0');
let fail=0;console.log('\nQA — navegador\n');for(const [n,ok,v] of gates){if(!ok)fail++;console.log(`${ok?'PASSOU ':'REPROVOU'}  ${n}  →  ${v}`);}
console.log(`\n${fail?'BUILD REPROVADA: '+fail+' critério(s)':'BUILD APROVADA'}`);
fs.writeFileSync('dist/qa-browser.json',JSON.stringify({gates:gates.map(([n,ok,v])=>({n,ok,v})),perf,anim},null,1));
await b.close();process.exit(fail?1:0);})();
