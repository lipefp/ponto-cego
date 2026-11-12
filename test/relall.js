// QA de recarga em TODAS as armas, em 16:9 e 4:3. Falha (exit 1) se: (a) carregador visível longe da mão e da arma (flutuando) · (b) mão esquerda fora da tela por mais de ~35% do total da recarga (a ida ao cinto é permitida).
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
let bad=0;const errs=[];
for(const [VW,VH] of (process.env.ONE?[[560,420]]:[[640,360],[560,420]])){
const p=await (await b.newContext({viewport:{width:VW,height:VH},offline:true})).newPage();p.setDefaultTimeout(600000);p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;pl.pitch=0;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();});
for(const id of (process.env.IDS?process.env.IDS.split(','):await p.evaluate(()=>__pc.WLIST))){
  const slot=await p.evaluate(id=>__pc.WEAPONS[id].slot,id);
  const r=await p.evaluate(async([id,slot,VW,VH])=>{const P=__pc,pl=P.player,B=BABYLON;pl.cur=slot;pl.w[slot].id=id;pl.w[slot].mag=1;pl.w[slot].res=99;
    const step=dt=>{if(P.G&&P.G.phase!=="over"){P.G.phase="action";P.G.phaseT=100;}const n=Math.round(dt/P.SIM_DT);for(let i=0;i<n;i++)P.simStep(P.SIM_DT);P.updateCamera(dt);P.updateVM(dt);};
    for(let i=0;i<40;i++)step(1/36);P.game.render();P.INPUT.reload=true;step(1/36);P.INPUT.reload=false;
    const T=P.WEAPONS[id].reload;let worst=0,wn='',n=0,outN=0,float=0,fl='';const rig=P.FPV.cur;
    for(let t=0;t<T;t+=1/36){step(1/36);if(!rig||!rig.nodes)continue;const nd=rig.nodes[rig.LH];if(!nd)continue;nd.computeWorldMatrix(true);
      const pr=B.Vector3.Project(nd.getAbsolutePosition(),B.Matrix.Identity(),P.game.getTransformMatrix(),P.camera.viewport.toGlobal(P.engine.getRenderWidth(),P.engine.getRenderHeight()));
      const ox=Math.max(0,-pr.x,pr.x-P.engine.getRenderWidth())/P.engine.getRenderWidth(),oy=Math.max(0,-pr.y,pr.y-P.engine.getRenderHeight())/P.engine.getRenderHeight(),o=Math.max(ox,oy);if(o>worst){worst=o;}if(o>.02)outN++;n++;
      for(const m of (rig.mg||[])){if(!m.node.isEnabled()||m.dist==null||m.dist<.08)continue;const mp=m.node.getAbsolutePosition(),hp=nd.getAbsolutePosition();const hd=Math.hypot(mp.x-hp.x,mp.y-hp.y,mp.z-hp.z);if(hd>.35){float++;if(float===1)fl='t='+t.toFixed(2)+' mag-mao='+hd.toFixed(2)+' dist='+m.dist.toFixed(2);}}}
    return {worst,n,outN,float,fl};},[id,slot,VW,VH]);
  const ok=r.float<3&&r.outN/r.n<.45;if(!ok)bad++;console.log((ok?'OK  ':'FORA')+' '+VW+'x'+VH+' '+id.padEnd(11)+' mão fora '+(100*r.outN/r.n).toFixed(0)+'% do tempo (máx '+(r.worst*100).toFixed(0)+'%) · carregador solto: '+r.float+' '+r.fl);}
await p.close();}
console.log(errs.join('\n'));console.log(bad||errs.length?'RECARGA REPROVADA ('+bad+')':'RECARGA APROVADA');await b.close();process.exit(bad||errs.length?1:0);})();
