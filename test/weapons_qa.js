// QA autônomo de armas: para cada arma — equipa, esvazia o pente, confere travamento, mede recarga, ADS, dano, cadência, FPS e erros de console.
// Saída: /tmp/weapons_qa.json (lido por tools/qa_report.mjs, que escreve QA_REPORT_PONTO_CEGO.md)
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(900000);
let cur='(carga)';const errs=[];
p.on('pageerror',e=>errs.push({w:cur,k:'pageerror',m:e.message,s:(e.stack||'').split('\n').slice(1,3).join(' ').trim()}));
p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push({w:cur,k:'console.'+m.type(),m:m.text().slice(0,300)});});
p.on('requestfailed',r=>errs.push({w:cur,k:'requestfailed',m:r.url().slice(0,120)}));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:120000,polling:500}).catch(()=>{});
await p.evaluate(()=>{__pc.SAVE.quality='high';__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1500);
await p.evaluate(()=>{const P=__pc;P.engine.stopRenderLoop();for(let i=0;i<60*46;i++)P.simStep(P.SIM_DT);P.drone.active=false;P.drone.alive=false;P.VM.noHolster=true;});
let ids=await p.evaluate(()=>Object.keys(__pc.WEAPONS).filter(k=>!k.includes('@')&&__pc.WEAPONS[k].mag>0));if(process.env.ONLY)ids=ids.filter(i=>process.env.ONLY.split(',').includes(i));
const out=[];
for(const id of ids){cur=id;
 const r=await p.evaluate((id)=>{
  const P=__pc,pl=P.player,w=P.WEAPONS[id],DT=P.SIM_DT,R={id,name:w.name,type:w.type,cls:w.cls,slot:w.slot,dmg:w.dmg,rate:w.rate,mag:w.mag,res:w.res,reload:w.reload,auto:!!w.auto,pellets:w.pellets||1,adsT:w.adsT,checks:{},notes:[]};
  const ck=(k,ok,info)=>{R.checks[k]={ok:!!ok,info:info==null?'':String(info)};};
  let tgt=null;const keep=()=>{pl.hp=1e6;pl.alive=true;pl.pos.x=40;pl.pos.z=28;pl.vel.set(0,0,0);P.G.phase='action';P.G.phaseT=170;P.G.roundClock=0;for(const a of P.agents)if(a!==pl&&a!==tgt&&a.alive){a.hp=1e6;}};
  const eq=(mag,res)=>{pl.w[w.slot]={id,mag:mag==null?w.mag:mag,res:res==null?w.res:res};pl.cur=w.slot;pl.reloadT=0;pl.fireCD=0;pl.act=null;pl.ads=0;pl.vault=null;pl.sprint=false;pl.sprintOut=0;pl.recAcc=0;pl.recRet=0;pl.punch=0;pl.punchYaw=0;pl.pitch=0;pl.yaw=1.2;pl.triggerHeld=false;P.INPUT.fire=false;P.INPUT.ads=false;P.INPUT.reload=false;for(let i=0;i<20;i++){keep();P.simStep(DT);}pl.fireCD=0;};
  const ws=()=>pl.w[w.slot];
  try{
  /* dados */
  ck('dados',w.dmg>0&&w.rate>0&&w.mag>0&&w.reload>0&&w.res>=0,`dmg ${w.dmg} · rate ${w.rate}s · pente ${w.mag} · reserva ${w.res} · recarga ${w.reload}s`);
  /* 1. esvaziar o pente */
  eq();let shots=0,t0=-1,tl=0,t=0,maxT=60*30,res0=ws().res,negMag=false,auto0=pl.shots;
  while(ws().mag>0&&t<maxT){const before=ws().mag;
    P.INPUT.fire=w.auto?true:(t%2===0);keep();P.simStep(DT);t++;
    if(ws().mag<before){shots++;if(t0<0)t0=t;tl=t;}if(ws().mag<0)negMag=true;}
  P.INPUT.fire=false;keep();P.simStep(DT);
  ck('pente esvazia',ws().mag===0&&shots===w.mag,`tiros ${shots}/${w.mag}`);
  ck('mag nunca negativo',!negMag);
  ck('reserva intacta ao atirar',ws().res===res0,`reserva ${ws().res}`);
  const span=(tl-t0)*DT,cad=shots>1?span/(shots-1):0;R.cadMeasured=+cad.toFixed(3);
  ck('cadência',shots>1&&Math.abs(cad-w.rate)<=Math.max(w.rate*.2,DT*1.5),`medido ${cad.toFixed(3)}s · esperado ${w.rate}s`);
  /* 2. travamento com pente vazio (reserva zero para não recarregar sozinha) */
  const rs=ws().res;ws().res=0;const ft0=pl.fireT;let extra=0;for(let i=0;i<90;i++){P.INPUT.fire=(i%2===0);keep();P.simStep(DT);if(pl.fireT!==ft0)extra++;}P.INPUT.fire=false;
  ck('tiro trava com pente vazio',extra===0&&ws().mag===0,`tiros com pente vazio ${extra}`);ws().res=rs;
  pl.reloadT=0;
  /* 3. recarga: pente cheio e tempo */
  eq(0,w.res);let rt=0,fired=0;P.INPUT.reload=true;keep();P.simStep(DT);P.INPUT.reload=false;rt++;
  const started=pl.reloadT>0;const ftB=pl.fireT;let blk=0;
  while(pl.reloadT>0&&rt<60*12){P.INPUT.fire=pl.reloadT>.06;keep();P.simStep(DT);rt++;if(pl.fireT!==ftB)blk++;}P.INPUT.fire=false;
  const dur=rt*DT;
  ck('recarga inicia',started);
  ck('tiro bloqueado durante recarga',blk===0,`tiros durante a recarga ${blk}`);
  ck('tempo de recarga',Math.abs(dur-w.reload)<=.12,`medido ${dur.toFixed(2)}s · esperado ${w.reload}s`);
  const refill=ws().mag,wantMag=Math.min(w.mag,w.res);
  ck('pente cheio após recarga',refill===wantMag,`pente ${refill}/${w.mag}`);
  ck('reserva desconta o pente',ws().res===w.res-wantMag,`reserva ${ws().res} (esperado ${w.res-wantMag})`);
  /* 4. recarga parcial */
  eq(w.mag-3>0?w.mag-3:1,w.res);const m0=ws().mag;P.INPUT.reload=true;keep();P.simStep(DT);P.INPUT.reload=false;let g=0;while(pl.reloadT>0&&g<60*12){keep();P.simStep(DT);g++;}
  ck('recarga parcial só repõe o que faltou',ws().mag===w.mag&&ws().res===w.res-(w.mag-m0),`pente ${ws().mag} · reserva ${ws().res}`);
  /* 5. sem reserva: R não faz nada */
  eq(Math.max(1,w.mag-1),0);P.INPUT.reload=true;keep();P.simStep(DT);P.INPUT.reload=false;
  ck('sem reserva: R não recarrega',pl.reloadT<=0&&ws().mag===Math.max(1,w.mag-1),`reloadT ${pl.reloadT.toFixed(2)}`);
  /* 6. ADS */
  eq();for(let i=0;i<40;i++){keep();P.simStep(DT);P.updateCamera(DT);P.updateVM(DT);}const fov0=P.camera.fov;P.INPUT.ads=true;let ta=0;let adsMax=0;
  while(ta<60*3){keep();P.simStep(DT);P.updateCamera(DT);P.updateVM(DT);ta++;adsMax=Math.max(adsMax,pl.ads);if(pl.ads>=.99)break;}
  const fovAds=P.camera.fov;
  for(let i=0;i<20;i++){keep();P.simStep(DT);P.updateCamera(DT);P.updateVM(DT);}
  const fovAds2=P.camera.fov;
  ck('ADS entra',adsMax>=.99,`ads ${adsMax.toFixed(2)} em ${(ta*DT).toFixed(2)}s (adsT ${w.adsT})`);
  const zExp=(w.z1||w.zoom||1);ck('ADS muda a câmera (FOV)',fovAds2<fov0-.001,`FOV ${fov0.toFixed(3)} → ${fovAds2.toFixed(3)} · zoom da arma ${w.z1||w.zoom}`);
  P.INPUT.ads=false;for(let i=0;i<60;i++){keep();P.simStep(DT);P.updateCamera(DT);P.updateVM(DT);}
  ck('ADS sai',pl.ads<=.01&&Math.abs(P.camera.fov-fov0)<.002,`ads ${pl.ads.toFixed(2)} · FOV ${P.camera.fov.toFixed(3)}`);
  /* ADS bloqueia durante recarga */
  eq(Math.max(1,w.mag-5),w.res);P.INPUT.reload=true;keep();P.simStep(DT);P.INPUT.reload=false;P.INPUT.ads=true;for(let i=0;i<20;i++){keep();P.simStep(DT);}
  ck('mirar durante recarga não entra em ADS',pl.ads<.05,`ads ${pl.ads.toFixed(2)}`);P.INPUT.ads=false;pl.reloadT=0;
  /* 7. dano: alvo à frente */
  eq();const tg=P.agents.find(a=>a!==pl&&a.team!==pl.team);tgt=tg;const dir=P.dirFrom(pl.yaw,0);
  const place=()=>{tg.alive=true;tg.hp=1e5;tg.armor=0;tg.pos.set(pl.pos.x+dir.x*6,0,pl.pos.z+dir.z*6);tg.vel.set(0,0,0);};
  let best=0,hits=0,tries=0;
  P.INPUT.ads=true;for(let i=0;i<40;i++){keep();P.simStep(DT);}
  let head=0;for(let i=0;i<90&&hits<3;i++){pl.pitch=-.03*(i%7);pl.recAcc=0;pl.recRet=0;pl.punch=0;pl.punchYaw=0;pl.yaw=1.2;place();const h0=tg.hp;P.INPUT.fire=false;keep();P.simStep(DT);place();pl.fireCD=0;pl.triggerHeld=false;P.INPUT.fire=true;keep();P.simStep(DT);P.INPUT.fire=false;if(tg.hp<h0||!tg.alive){const d=Math.min(h0-tg.hp,9999);if(d>=500)head++;else{hits++;best=Math.max(best,d);(R.drops||(R.drops=[])).push(+d.toFixed(1));}}tries++;
    if(ws().mag<2){ws().mag=w.mag;}
    for(let k=0;k<Math.ceil(w.rate/DT)+2;k++){keep();P.simStep(DT);}}
  P.INPUT.ads=false;
  tgt=null;R.dmgSeen=best;R.headKills=head;ck('causa dano',hits+head>0,`${hits} acertos no corpo (dano ${R.drops?R.drops.join('/'):'-'}) e ${head} na cabeça (morte instantânea) em ${tries} tiros · base ${w.dmg}${w.pellets>1?' × '+w.pellets+' balins':''}`);
  /* 9. cobertura da tela pelo viewmodel (mãos + arma): compara o quadro com e sem o rig */
  const gl=P.engine._gl,cv=P.engine.getRenderingCanvas(),W=cv.width,H=cv.height,bufA=new Uint8Array(W*H*4),bufB=new Uint8Array(W*H*4);
  const grab=(buf)=>{P.updateHUD(DT);P.game.render();gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,buf);};
  const cover=()=>{const rig=P.FPV&&P.FPV.cur;grab(bufA);let hid=false;if(rig&&rig.holder){rig.holder.setEnabled(false);hid=true;}
    const vr=P.game.getTransformNodeByName&&P.game.getTransformNodeByName('vmRoot');if(vr)vr.setEnabled(false);
    grab(bufB);if(hid)rig.holder.setEnabled(true);if(vr)vr.setEnabled(true);
    let n=0;for(let i=0;i<bufA.length;i+=4){if(Math.abs(bufA[i]-bufB[i])+Math.abs(bufA[i+1]-bufB[i+1])+Math.abs(bufA[i+2]-bufB[i+2])>10)n++;}return n/(W*H);};
  eq();for(let i=0;i<40;i++){keep();P.simStep(DT);P.updateCamera(DT);P.updateVM(DT);}
  R.covHip=+cover().toFixed(3);
  P.INPUT.ads=true;for(let i=0;i<60;i++){keep();P.simStep(DT);P.updateCamera(DT);P.updateVM(DT);}R.covAds=+cover().toFixed(3);P.INPUT.ads=false;
  for(let i=0;i<40;i++){keep();P.simStep(DT);P.updateCamera(DT);P.updateVM(DT);}
  eq(0,w.res);P.INPUT.reload=true;keep();P.simStep(DT);P.INPUT.reload=false;let peak=0,k=0;const stepN=Math.max(2,Math.round(w.reload/DT/10));
  while(pl.reloadT>0&&k<14){for(let i=0;i<stepN;i++){keep();P.simStep(DT);P.updateCamera(DT);P.updateVM(DT);}peak=Math.max(peak,cover());k++;}
  R.covReload=+peak.toFixed(3);
  ck('viewmodel não cobre a tela inteira (quadril/mira)',R.covHip<.35&&R.covAds<.45,`quadril ${(R.covHip*100).toFixed(0)}% · mira ${(R.covAds*100).toFixed(0)}% da tela`);
  ck('viewmodel na recarga ocupa até 40% da tela',R.covReload<=.40,`pico ${(R.covReload*100).toFixed(0)}% da tela`);
  /* 8. render e FPS */
  eq();const ms=[];for(let i=0;i<6;i++){const a=performance.now();P.updateCamera(DT);P.updateVM(DT);P.updateHUD(DT);P.game.render();ms.push(performance.now()-a);}
  ms.sort((a,b)=>a-b);R.renderMs=+ms[3].toFixed(1);
  R.hud=P.HUD.ammo?P.HUD.ammo.text:'';ck('HUD de munição',/^\d+ \/ \d+$/.test(R.hud)&&R.hud===`${ws().mag} / ${ws().res}`,`HUD "${R.hud}"`);
  }catch(e){R.fatal=String(e&&e.stack||e).slice(0,400);}
  P.INPUT.fire=false;P.INPUT.ads=false;P.INPUT.reload=false;
  return R;},id);
 /* fotos: quadril e ADS */
 await p.evaluate((id)=>{const P=__pc,pl=P.player,w=P.WEAPONS[id];pl.w[w.slot]={id,mag:w.mag,res:w.res};pl.cur=w.slot;pl.reloadT=0;pl.ads=0;pl.yaw=1.2;pl.pitch=0;for(let i=0;i<40;i++){P.updateCamera(1/60);P.updateVM(1/60);}P.updateHUD(1/60);P.game.render();},id);
 await p.screenshot({path:'../shots/qa_'+id+'_hip.png'});
 await p.evaluate(()=>{const P=__pc;P.player.ads=1;for(let i=0;i<90;i++){P.updateCamera(1/60);P.updateVM(1/60);}P.game.render();});
 await p.screenshot({path:'../shots/qa_'+id+'_ads.png'});
 await p.evaluate(()=>{__pc.player.ads=0;});
 const fails=Object.entries(r.checks).filter(([k,v])=>!v.ok).map(([k])=>k);
 console.log((r.fatal||fails.length?'FALHOU  ':'passou  ')+id+' ('+r.name+') '+(r.fatal?'FATAL '+r.fatal.split('\n')[0]:fails.join(', ')));
 out.push(r);}
cur='(fim)';
fs.writeFileSync('/tmp/weapons_qa.json',JSON.stringify({when:new Date().toISOString(),weapons:out,errs},null,1));
console.log('erros de console/página:',errs.length);await b.close();})();
