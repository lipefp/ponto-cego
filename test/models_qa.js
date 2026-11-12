// QA autônomo de modelos 3D, encaixe na mão, recarga e gadgets. Não pergunta nada: registra e segue.
// Saída: /tmp/models_qa.json (lido por tools/qa_models_report.mjs)
const fs=require('fs');
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning'){const t=m.text();if(!/GPU stall|ReadPixels/.test(t))errs.push(m.type()+' '+t.slice(0,200));}});
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;pl.pitch=0;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();});
const out={weapons:{},gadgets:{},errors:[],assets:await p.evaluate(()=>({ready:!!__pc.ASSETS.ready,failed:!!__pc.ASSETS.failed,wm:!!__pc.WM.on}))};
const ids=process.env.ONLY?process.env.ONLY.split(','):await p.evaluate(()=>__pc.WLIST);
for(const id of ids){
  let r;
  try{r=await p.evaluate(async(id)=>{const P=__pc,pl=P.player,B=BABYLON,W=P.WEAPONS[id],slot=W.slot;
    const R={id,name:W.name,cls:W.cls,fails:[],notes:[]};const F=(m)=>R.fails.push(m);
    const step=dt=>{if(P.G.phase!=='over'){P.G.phase='action';P.G.phaseT=100;}P.simStep(P.SIM_DT);P.updateCamera(dt);P.updateVM(dt);};
    const set=(mag)=>{pl.w[slot]={id,mag,res:99};pl.cur=slot;};
    set(30);P.INPUT.ads=false;for(let i=0;i<60;i++)step(1/60);P.game.render();
    let rig=P.FPV.cur;
    if(!rig||!rig.w){F('sem rig de primeira pessoa');return R;}
    const w=rig.w,V=(v)=>new B.Vector3(v.x,v.y,v.z);
    /* A. modelo */
    const ms=w.g.getChildMeshes().filter(m=>m.getTotalVertices&&m.getTotalVertices()>0);
    let verts=0,noMat=0,nan=0;const mn=new B.Vector3(1e9,1e9,1e9),mx=new B.Vector3(-1e9,-1e9,-1e9);
    for(const m of ms){verts+=m.getTotalVertices();if(!m.material)noMat++;m.computeWorldMatrix(true);const bi=m.getBoundingInfo().boundingBox;
      if(!isFinite(bi.minimumWorld.x)||!isFinite(bi.maximumWorld.x))nan++;mn.minimizeInPlace(bi.minimumWorld);mx.maximizeInPlace(bi.maximumWorld);}
    const size=mx.subtract(mn);R.meshes=ms.length;R.verts=verts;R.size=[+size.x.toFixed(3),+size.y.toFixed(3),+size.z.toFixed(3)];R.hold=w.hold;R.real=!!(P.WM&&P.WM.on);
    if(!ms.length)F('modelo sem malhas');if(verts<300)F('modelo muito simples ('+verts+' vértices): provável peça procedural');if(noMat)F(noMat+' malhas sem material');if(nan)F('caixa de colisão inválida');
    const len=Math.max(size.x,size.y,size.z);const lim=(W.cls==='pistol'||W.cls==='mp'||W.cls==='rev')?[.12,.5]:[.3,1.3];if(len<lim[0]||len>lim[1])F('tamanho fora do esperado: '+len.toFixed(2)+' m');
    /* B. encaixe da mão em repouso */
    w.g.computeWorldMatrix(true);const M=w.g.getWorldMatrix(),T=v=>B.Vector3.TransformCoordinates(V(v),M);
    const LH=rig.nodes[rig.LH],RH=rig.nodes[rig.RH];LH&&LH.computeWorldMatrix(true);RH&&RH.computeWorldMatrix(true);
    const dd=(a,c)=>Math.hypot(a.x-c.x,a.y-c.y,a.z-c.z);
    R.dL=LH?+dd(LH.getAbsolutePosition(),T(w.fore)).toFixed(3):-1;R.dR=RH?+dd(RH.getAbsolutePosition(),T(w.grip)).toFixed(3):-1;
    const lim2=.09;if(R.dL<0||R.dL>lim2)F('mão esquerda longe do apoio: '+R.dL+' m');if(R.dR<0||R.dR>lim2)F('mão direita longe da empunhadura: '+R.dR+' m');
    /* mãos dentro da tela e braços sem cobrir a tela */
    const wd=P.engine.getRenderWidth(),ht=P.engine.getRenderHeight(),proj=n=>B.Vector3.Project(n.getAbsolutePosition(),B.Matrix.Identity(),P.game.getTransformMatrix(),P.camera.viewport.toGlobal(wd,ht));
    const onScr=n=>{if(!n)return false;n.computeWorldMatrix(true);const q=proj(n),mx=.12;return q.x>=-wd*mx&&q.x<=wd*(1+mx)&&q.y>=-ht*mx&&q.y<=ht*(1+mx)&&q.z>0;};
    R.handsOn=[onScr(LH),onScr(RH)];if(!R.handsOn[0])F('mão esquerda fora da tela em repouso');if(!R.handsOn[1])R.notes.push('osso da mão direita abaixo da borda da tela em repouso (pulso); só aviso');
    /* C. mira (ADS) */
    P.INPUT.ads=true;for(let i=0;i<70;i++)step(1/60);P.game.render();
    const sp=B.Vector3.Project(T(w.sight||[0,.07,0]),B.Matrix.Identity(),P.game.getTransformMatrix(),P.camera.viewport.toGlobal(wd,ht));
    R.adsOff=[+((sp.x/wd)-.5).toFixed(3),+((sp.y/ht)-.5).toFixed(3)];
    if(Math.abs(R.adsOff[0])>.12)F('alça de mira fora do centro na horizontal: '+R.adsOff[0]);
    if(Math.abs(R.adsOff[1])>.2)F('alça de mira fora do centro na vertical: '+R.adsOff[1]);
    P.INPUT.ads=false;for(let i=0;i<40;i++)step(1/60);
    /* D. recarga: tática e vazia */
    R.reload={};
    for(const kind of ['tat','vazia']){
      set(kind==='tat'?Math.max(1,Math.min(10,W.mag-1)):0);const m0=pl.w[slot].mag;for(let i=0;i<30;i++)step(1/60);
      pl.w[slot].res=99;const full=P.wVariant?W.mag:W.mag;
      P.INPUT.reload=true;step(1/60);P.INPUT.reload=false;
      const rl=W.reload,dtS=1/60,N=Math.ceil((rl+.8)/dtS);let offs=0,tot=0,flo=0,magMax=0,minCam=9,started=false,doneAt=-1,gunOff=0,lhMin=9;
      const cam=P.camera.position;
      for(let t=0;t<N;t++){P.INPUT.fire=false;step(dtS);rig=P.FPV.cur;if(!rig)break;
        const sl=pl.w[slot];if(pl.reloadT>0)started=true;
        const nd=rig.nodes[rig.LH];if(nd){tot++;if(!onScr(nd))offs++;if(kind==='tat'&&t%12===0){const q=proj(nd);(R.trace=R.trace||[]).push([t,Math.round(q.x),Math.round(q.y),+q.z.toFixed(3)]);}}
        let anyEn=false;for(const m of (rig.mg||[])){if(m.node&&m.node.isEnabled()){anyEn=true;magMax=Math.max(magMax,m.dist||0);
          if(nd&&m.dist>=.08&&dd(m.node.getAbsolutePosition(),nd.getAbsolutePosition())>.35)flo++;}}
        if(rig.w&&rig.w.g&&!rig.w.g.isEnabled())gunOff++;
        if(rig.w&&rig.w.g){const c=rig.w.g.getAbsolutePosition();minCam=Math.min(minCam,dd(c,P.camera.globalPosition||cam));}
        if(doneAt<0&&started&&!(pl.reloadT>0))doneAt=t*dtS;}
      /* cobertura da tela pelas mangas/mãos: diferença de pixel com e sem o rig no meio da recarga */
      R.reload[kind]={offFrac:tot?+(offs/tot).toFixed(2):1,floatingMag:flo,magTravel:+magMax.toFixed(3),minCamDist:+minCam.toFixed(2),doneAt:+doneAt.toFixed(2),cfg:rl,ammo:pl.w[slot].mag,gunHiddenSteps:gunOff,started};
      const x=R.reload[kind];
      if(!x.started)F('recarga '+kind+': não iniciou');
      if(x.offFrac>(P.WEAPONS[id].cls==='pistol'||P.WEAPONS[id].cls==='rev'?.45:(P.WEAPONS[id].cls==='dmr'?.75:.35)))F('recarga '+kind+': mão esquerda fora da tela em '+Math.round(x.offFrac*100)+'% do tempo');
      if(x.floatingMag>=3)F('recarga '+kind+': carregador flutuando longe da mão ('+x.floatingMag+' quadros)');
      if(x.doneAt<0)F('recarga '+kind+': não terminou');
      else if(Math.abs(x.doneAt-rl)>Math.max(.35,rl*.25))F('recarga '+kind+': duração '+x.doneAt+' s, configurada '+rl+' s');
      if(x.ammo<=m0)F('recarga '+kind+': munição não voltou ('+x.ammo+')');
      if(x.gunHiddenSteps>Math.ceil(N*.5))F('recarga '+kind+': arma sumiu por '+x.gunHiddenSteps+' quadros');
      for(let i=0;i<30;i++)step(1/60);
    }
    /* recarga: cobertura de tela por pixels, no ponto mais pesado do clipe */
    try{set(1);pl.w[slot].res=99;P.INPUT.reload=true;step(1/60);P.INPUT.reload=false;const gl=P.engine._gl;let worst=0;
      const grab=()=>{P.game.render();const a=new Uint8Array(wd*ht*4);gl.readPixels(0,0,wd,ht,gl.RGBA,gl.UNSIGNED_BYTE,a);return a;};
      for(let t=0;t<Math.ceil(W.reload/(1/6))+1;t++){for(let k=0;k<10;k++)step(1/60);const h=P.FPV.cur.holder;if(!h)break;const A=grab();h.setEnabled(false);const C=grab();h.setEnabled(true);
        let d=0;for(let i=0;i<A.length;i+=4){if(Math.abs(A[i]-C[i])+Math.abs(A[i+1]-C[i+1])+Math.abs(A[i+2]-C[i+2])>10)d++;}worst=Math.max(worst,d/(wd*ht));}
      R.reload.coverage=+worst.toFixed(2);if(worst>.30)F('recarga: arma e braços ocupam '+Math.round(worst*100)+'% da tela (limite 30%)');}catch(e){R.notes.push('cobertura não medida: '+e.message);}
    return R;},id);}catch(e){r={id,fails:['erro no teste: '+String(e.message).slice(0,200)]};}
  out.weapons[id]=r;console.log((r.fails.length?'FALHA ':'OK    ')+id.padEnd(12)+(r.fails.join(' | ')||''));
  await p.screenshot({path:'shots/mq_'+id+'.png'}).catch(()=>{});
}
/* E. gadgets */
const kinds=await p.evaluate(()=>[...new Set(__pc.OPS.atk.concat(__pc.OPS.def).map(o=>o.gadget))]);
for(const K of kinds){
  let r;
  try{r=await p.evaluate(async(K)=>{const P=__pc,pl=P.player,B=BABYLON;const R={kind:K,fails:[],perWeapon:{}};
    for(const wid of ['rifle','pistol','smg']){if(!P.WEAPONS[wid])continue;const slot=P.WEAPONS[wid].slot;pl.w[slot]={id:wid,mag:30,res:90};pl.cur=slot;pl.op=Object.assign({},pl.op,{gadget:K});
      const stp=()=>{P.updateCamera(1/60);P.updateVM(1/60);};pl.gadgetN=3;for(let i=0;i<50;i++)stp();pl.gadgetN=2;
      let saw=false,throwN=0,held=null,fit=9,size=0,on=false,vis=true;const wd=P.engine.getRenderWidth(),ht=P.engine.getRenderHeight();
      let n=0;for(;n<140;n++){stp();const h=P.FPV.held;if(h&&h.isEnabled()){saw=true;h.computeWorldMatrix(true);const rig=P.FPV.cur,rh=rig.nodes[rig.RH];
        if(rh){rh.computeWorldMatrix(true);const bi=h.getHierarchyBoundingVectors(true);const c=bi.min.add(bi.max).scale(.5);fit=Math.min(fit,Math.hypot(c.x-rh.getAbsolutePosition().x,c.y-rh.getAbsolutePosition().y,c.z-rh.getAbsolutePosition().z));
          size=Math.max(size,Math.hypot(bi.max.x-bi.min.x,bi.max.y-bi.min.y,bi.max.z-bi.min.z));
          const q=B.Vector3.Project(c,B.Matrix.Identity(),P.game.getTransformMatrix(),P.camera.viewport.toGlobal(wd,ht));if(q.x>=0&&q.x<=wd&&q.y>=0&&q.y<=ht)on=true;}}
        if(P.VM.th)throwN++;if(!P.VM.th&&n>3)break;}
      for(let i=0;i<10;i++)stp();P.game.render();const rig=P.FPV.cur;
      const o={sawHeld:saw,throwSteps:throwN,fitDist:+fit.toFixed(3),size:+size.toFixed(3),onScreen:on,gunBack:!!(rig&&rig.w.g.isEnabled()),heldGone:!P.FPV.held,steps:n};
      R.perWeapon[wid]=o;
      if(!saw)R.fails.push(wid+': gadget não apareceu na mão');if(!throwN)R.fails.push(wid+': sem clipe de arremesso');
      if(saw&&fit>(K==='shield'?.22:.14))R.fails.push(wid+': gadget longe da mão ('+o.fitDist+' m)');if(saw&&!on)R.fails.push(wid+': gadget fora da tela');
      if(saw&&(size<.03||(size>.7&&K!=='shield'&&K!=='wire')))R.fails.push(wid+': tamanho do gadget fora do esperado ('+o.size+' m)');
      if(!o.gunBack)R.fails.push(wid+': arma não voltou');if(!o.heldGone)R.fails.push(wid+': gadget ficou na mão');if(n>=130)R.fails.push(wid+': arremesso não terminou');}
    return R;},K);}catch(e){r={kind:K,fails:['erro no teste: '+String(e.message).slice(0,200)]};}
  out.gadgets[K]=r;console.log((r.fails.length?'FALHA ':'OK    ')+('gadget '+K).padEnd(16)+(r.fails.join(' | ')||''));
}
out.errors=errs.slice(0,40);fs.writeFileSync('/tmp/models_qa.json',JSON.stringify(out,null,1));
const bw=Object.values(out.weapons).filter(x=>x.fails.length).length,bg=Object.values(out.gadgets).filter(x=>x.fails.length).length;
console.log(`ARMAS com falha: ${bw}/${ids.length} · GADGETS com falha: ${bg}/${kinds.length} · erros de console: ${errs.length}`);await b.close();})();
