// QA de animação: para CADA arma (e variantes com acessórios) dispara a recarga (tática e vazia) e confere que o clipe certo
// foi acionado, que ele corre até o fim (tempo do clipe = tempo da recarga no código) e que a arma volta à pose de repouso.
// Saída: /tmp/anim_qa.json e linhas "[SUCCESS] MP7 -> ReloadX ativado"
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const EXP={pistol:'RN_pistol',onca:'RN_onca',pardal:'RN_pardal',abelha:'RN_abelha',jaguar:'RN_jaguar',smg:'RN_smg',marimbondo:'RN_marimbondo',cascavel:'RN_cascavel',jararaca:'RN_jararaca',tupa:'RN_tupa',shotgun:'RN_shotgun',ressaca:'RN_ressaca',dmr:'RN_dmr',carcara:'RN_carcara',boitata:'RN_boitata',rifle:'Reload'};
const EXPE={pistol:'RE_pistol',onca:'RE_onca',pardal:'RE_pardal',abelha:'RE_abelha',jaguar:'RE_jaguar',smg:'RE_smg',marimbondo:'RE_marimbondo',cascavel:'RE_cascavel',jararaca:'RE_jararaca',tupa:'RE_tupa',shotgun:'RE_shotgun',ressaca:'RE_ressaca',dmr:'RE_dmr',carcara:'RE_carcara',boitata:'RE_boitata',rifle:'Reload_Empty'};
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();});
const res=await p.evaluate(async()=>{const P=__pc,pl=P.player,out=[];
 const step=dt=>{if(P.G.phase!=='over'){P.G.phase='action';P.G.phaseT=100;}P.simStep(P.SIM_DT);P.updateCamera(dt);P.updateVM(dt);};
 for(const id of P.WLIST){const W=P.WEAPONS[id],slot=W.slot;
  const vars=[id,P.wVariant(id,{sight:'red',barrel:'none',grip:'none',laser:0}),P.wVariant(id,{sight:'iron',barrel:'sup',grip:'vert',laser:0})];
  for(const vid of vars)for(const emp of [false,true]){
   pl.w[slot]={id:vid,mag:emp?0:Math.max(1,W.mag-6),res:99};pl.cur=slot;P.INPUT.ads=false;for(let i=0;i<70;i++)step(1/60);
   const rig=P.FPV.cur,r={id,vid,emp,name:W.name,code:W.reload,seen:{},maxT:0,idleBefore:rig.clipName,ammo0:pl.w[slot].mag};
   P.INPUT.reload=true;step(1/60);P.INPUT.reload=false;
   const N=Math.round((W.reload+.6)*60);for(let i=0;i<N;i++){step(1/60);if(rig.clipName){r.seen[rig.clipName]=(r.seen[rig.clipName]||0)+1;if(/^(Reload|R[NE]_)/.test(rig.clipName))r.maxT=Math.max(r.maxT,rig.clipT);}}
   for(let i=0;i<20;i++)step(1/60);
   r.after=rig.clipName;r.ammo1=pl.w[slot].mag;r.gunOn=!!(rig.w&&rig.w.g.isEnabled());const cn=Object.keys(r.seen).find(k=>/^(Reload|R[NE]_)/.test(k));r.clip=cn||null;r.clipDur=cn?rig.clips[cn].dur:0;out.push(r);}}
 return out;});
let bad=0;const log=[];
for(const r of res){const base=r.vid.split('@')[0],want=r.emp?EXPE[base]:EXP[base];
  const f=[];if(r.clip!==want)f.push('clipe '+r.clip+' (esperado '+want+')');
  if(!r.clip)f.push('nenhum clipe de recarga acionado');
  else if(r.maxT<r.clipDur*.9)f.push('clipe parou em '+r.maxT.toFixed(2)+' de '+r.clipDur.toFixed(2)+' s');
  if(r.after!==null)f.push('não voltou ao repouso ('+r.after+')');if(!r.gunOn)f.push('arma escondida no fim');if(r.ammo1<=r.ammo0)f.push('munição não voltou');
  r.fails=f;if(f.length)bad++;
  const tag=r.vid===base?'':' ['+r.vid.slice(base.length+1)+']';
  log.push((f.length?'[FALHA]   ':'[SUCCESS] ')+r.name+tag+(r.emp?' (vazia)':'')+' -> '+(r.clip||'-')+(f.length?'  '+f.join('; '):' ativado, '+r.maxT.toFixed(2)+'/'+r.clipDur.toFixed(2)+' s do clipe em '+r.code+' s de jogo'));}
console.log(log.join('\n'));require('fs').writeFileSync('/tmp/anim_qa.json',JSON.stringify(res,null,1));
console.log(errs.join('\n'));console.log(bad||errs.length?'ANIMAÇÃO REPROVADA ('+bad+' casos)':'ANIMAÇÃO APROVADA ('+res.length+' casos)');await b.close();process.exit(bad||errs.length?1:0);})();
