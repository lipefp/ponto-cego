// =====================================================================
// TESTE DE ÁUDIO sem ouvir: renderiza cada som com OfflineAudioContext (a MESMA função playSound do jogo,
// extraída de src/render/14-audio.js e rodada no Chromium com o mundo simulado por stubs), mede
// duração, pico (com e sem o limitador), RMS, centroide e bandas, e gera espectrogramas PNG por categoria.
// Saídas: shots/audio/<categoria>.png, shots/audio/report.json. Código de saída 1 se algum critério falhar.
//   node test/audio.js [--quick]
// =====================================================================
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),OUT=path.join(ROOT,'shots','audio');fs.mkdirSync(OUT,{recursive:true});
const src=fs.readFileSync(path.join(ROOT,'src/render/14-audio.js'),'utf8');
/* tabela de armas real (src/sim/01-data.js): id → {cls,snd,reload,pellets,mag} */
const data=fs.readFileSync(path.join(ROOT,'src/sim/01-data.js'),'utf8'),W={};
for(const m of data.matchAll(/^\s*(\w+):\{name:'[^']*',type:'[^']*',cls:'(\w+)'[^\n]*$/gm)){const ln=m[0],g=r=>{const x=ln.match(r);return x?x[1]:null;};
  const snd=g(/snd:'(\w+)'/);if(!snd)continue;W[m[1]]={cls:m[2],snd,reload:+g(/reload:([\d.]+)/),mag:+g(/mag:(\d+)/),pellets:g(/pellets:(\d+)/)?+g(/pellets:(\d+)/):undefined};}
const stubs=`
const SAVE={vol:1,mute:false},clamp=(v,a,b)=>v<a?a:v>b?b:v,CELL=3,inside=(x,z)=>x>7&&x<28&&z>5&&z<22,roomOf=()=>'hall',angDiff=(a,b)=>a-b,clearLine=()=>true;
class V3{constructor(x,y,z){this.x=x;this.y=y;this.z=z;}}
const WEAPONS=${JSON.stringify(W)},VM={shake:0},player={pos:{x:45,y:0,z:30}},camera={position:{x:45,y:1.6,z:30},rotation:{y:0}},HOOK={},G={phase:'action'},agents=[],ASSET_FILE={},ASSET_BYTES=()=>null;`;

(async()=>{
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const p=await (await b.newContext({viewport:{width:1400,height:900}})).newPage();p.setDefaultTimeout(600000);
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.setContent('<html><body></body></html>');
await p.addScriptTag({content:'(function(){'+stubs+src+'\n})();'});
const out=await p.evaluate(async(W)=>{
const AU=window.__pcAudio,SR=44100,P=(k,pos,o)=>AU.play(k,pos,o);
const mkS=(d,env,blocked)=>({v:1/(1+d/10)*(blocked?.55:1),pan:d?.35:0,fc:Math.max(500,Math.min(16000,16000/(1+d/9)*(blocked?.22:1))),muf:1,env,lenv:env,d,delay:Math.min(d/343,.6),blocked:!!blocked});
const ME={room:mkS(0,'room'),hall:mkS(0,'hall'),out:mkS(0,'out')};
const SNDS=['pistol','mp','smg','smg45','pistol45','rifle556','rifle','lmg','battle','dmr','rev','shotgun'];
const WID={};for(const id in W)if(!WID[W[id].snd])WID[W[id].snd]=id;
let _s=1;const seed=n=>{_s=n>>>0;};Math.random=()=>{_s=(_s+0x6D2B79F5)>>>0;let t=_s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};   // PRNG com semente: resultados reproduzíveis
const jobs=[];const J=(cat,name,dur,f,o)=>jobs.push(Object.assign({cat,name,dur,f},o||{}));
const S2=o=>Object.assign({},o);   // cópia (voice não muda, mas SP sim)
/* --- tiros --- */
for(const s of SNDS)J('shots_room',s,1.6,()=>P('gun',null,{w:WID[s],me:true,nocase:1,S:S2(ME.room)}));
for(const s of ['pistol','smg','rifle','dmr','lmg','shotgun'])J('shots_sup',s+'_sup',1.2,()=>P('gun',null,{w:WID[s],me:true,sup:true,nocase:1,S:S2(ME.room)}));
for(const s of ['pistol','rifle','shotgun'])for(const e of ['room','hall','out'])J('shots_env',s+'_'+e,2.2,()=>P('gun',null,{w:WID[s],me:true,nocase:1,S:S2(ME[e])}));
for(const s of ['pistol','rifle','shotgun']){J('shots_dist',s+'_bot15hall',1.8,()=>P('gun',{x:0,y:1,z:0},{w:WID[s],nocase:1,S:mkS(15,'hall')}));
  J('shots_dist',s+'_far45out',2.4,()=>P('gun',{x:0,y:1,z:0},{w:WID[s],nocase:1,S:mkS(45,'out')}));J('shots_dist',s+'_far45wall',2.4,()=>P('gun',{x:0,y:1,z:0},{w:WID[s],nocase:1,S:mkS(45,'out',true)}));}
J('shots_dist','rifle_sup_bot15',1.6,()=>P('gun',{x:0,y:1,z:0},{w:WID.rifle,sup:true,S:mkS(15,'hall')}));
/* rajadas (estresse do limitador): jogador + 3 bots */
J('shots_burst','rifle_burst_me',2.2,()=>{for(let i=0;i<12;i++)AU.later(i*.09,()=>P('gun',null,{w:WID.rifle,me:true,S:S2(ME.hall)}));},{burst:1});
J('shots_burst','lmg+3bots',2.2,()=>{for(let i=0;i<14;i++){AU.later(i*.095,()=>P('gun',null,{w:WID.lmg,me:true,S:S2(ME.hall)}));if(i%2==0)AU.later(i*.095+.03,()=>P('gun',{x:0,y:1,z:0},{w:WID.rifle,S:mkS(8+i,'hall')}));}},{burst:1});
J('shots_burst','shotgun_x3',3,()=>{for(let i=0;i<3;i++)AU.later(i*.85,()=>P('gun',null,{w:WID.shotgun,me:true,S:S2(ME.room)}));},{burst:1});
/* --- mecânica --- */
for(const [n,id] of [['pistol','pistol'],['mp','abelha'],['smg','smg'],['ar','rifle'],['dmr','dmr'],['lmg','boitata'],['sg','shotgun'],['rev','jaguar']])J('mech','reload_'+n,(W[id]?W[id].reload:2.5)+.6,()=>P('reload',null,{w:id,S:S2(ME.room)}));
J('mech','draw_rifle',.6,()=>P('draw',null,{w:'rifle',S:S2(ME.room)}));J('mech','draw_pistol',.6,()=>P('draw',null,{w:'pistol',S:S2(ME.room)}));
J('mech','pump',.7,()=>P('pump',null,{S:S2(ME.room)}));J('mech','pin',.8,()=>P('pin',null,{S:S2(ME.room)}));J('mech','empty',.3,()=>P('empty'));J('mech','swing',.5,()=>P('swing',null,{S:S2(ME.room)}));J('mech','vault',.5,()=>P('vault'));
J('mech','bot_reload25',3,()=>P('reload',{x:0,y:1,z:0},{w:'rifle',far:true,S:mkS(25,'hall')}));
/* --- passos --- */
for(const sf of ['wood','carpet','metal','concrete','tile','gravel']){
  J('steps',sf+'_walk',1.1,()=>{P('step',null,{me:true,surf:sf,S:S2(ME.room)});AU.later(.42,()=>P('step',null,{me:true,surf:sf,S:S2(ME.room)}));});
  J('steps',sf+'_run',1.1,()=>{P('step',null,{me:true,loud:true,surf:sf,S:S2(ME.room)});AU.later(.36,()=>P('step',null,{me:true,loud:true,surf:sf,S:S2(ME.room)}));});
  J('steps',sf+'_crouch',1.1,()=>{P('step',null,{me:true,soft:true,surf:sf,S:S2(ME.room)});AU.later(.42,()=>P('step',null,{me:true,soft:true,surf:sf,S:S2(ME.room)}));});}
for(const sf of ['wood','metal','concrete'])J('steps','land_'+sf,.8,()=>P('land',null,{imp:9,surf:sf,S:S2(ME.room)}));
J('steps','bot_wood_6m',.6,()=>P('step',{x:0,y:0,z:0},{surf:'wood',S:mkS(6,'room')}));J('steps','bot_wood_6m_wall',.6,()=>P('step',{x:0,y:0,z:0},{surf:'wood',S:mkS(6,'room',true)}));
J('steps','bot_metal_12m',.6,()=>P('step',{x:0,y:0,z:0},{surf:'metal',loud:true,S:mkS(12,'room')}));J('steps','bot_gravel_18m',.6,()=>P('step',{x:0,y:0,z:0},{surf:'gravel',S:mkS(18,'out')}));
/* --- mundo --- */
J('world','glass_break',2,()=>P('glass',{x:0,y:1,z:0},{S:mkS(6,'room')}));J('world','wall_small',1,()=>P('wall',{x:0,y:1,z:0},{big:0,S:mkS(6,'room')}));J('world','wall_big',1.8,()=>P('wall',{x:0,y:1,z:0},{big:1,S:mkS(6,'room')}));
J('world','boom_3m',3.5,()=>P('boom',{x:0,y:1,z:0},{S:mkS(3,'room')}));J('world','boom_20m',3.5,()=>P('boom',{x:0,y:1,z:0},{S:mkS(20,'hall')}));J('world','boom_60m_out',3.5,()=>P('boom',{x:0,y:1,z:0},{S:mkS(60,'out')}));
J('world','door',1.2,()=>P('door',{x:0,y:1,z:0},{S:mkS(5,'room')}));J('world','smash',.8,()=>P('smash',{x:0,y:1,z:0},{S:mkS(4,'room')}));
for(const k of ['hard','brick','drywall','wood','metal','glass','flesh'])J('world','impact_'+k,.8,()=>P('impact',{x:0,y:1,z:0},{kind:k,S:mkS(3,'room')}));
J('world','whiz',.5,()=>P('whiz',null,{near:.9,S:mkS(5,'room')}));
J('world','device_early',.4,()=>{AU.setPlanted(40);P('device',null,{S:S2(ME.room)});});J('world','device_late',.4,()=>{AU.setPlanted(4);P('device',null,{S:S2(ME.room)});});
for(const k of ['ping','pulse','radio','plant','dronelost','dronego','reinforce','place','bounce','thermal']){const o=k==='thermal'?4:k==='dronelost'?2.8:1;J('world',k,o,()=>P(k,k==='reinforce'||k==='place'||k==='bounce'||k==='thermal'?{x:0,y:1,z:0}:null,{S:mkS(4,'room')}));}
J('world','hit_body',.4,()=>P('hit',null,{head:false}));J('world','hit_head_kill',.6,()=>P('hit',null,{head:true,kill:true}));J('world','hurt',.7,()=>P('hurt'));
J('world','ui',.3,()=>P('ui'));J('world','win',1.2,()=>P('win'));J('world','lose',1.2,()=>P('lose'));

/* --- FFT / espectro --- */
function fft(re,im){const n=re.length;for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){let t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t;}}
  for(let len=2;len<=n;len<<=1){const ang=-2*Math.PI/len,wr=Math.cos(ang),wi=Math.sin(ang);for(let i=0;i<n;i+=len){let cr=1,ci=0;for(let k=0;k<len/2;k++){const a=i+k,c=i+k+len/2,tr=re[c]*cr-im[c]*ci,ti=re[c]*ci+im[c]*cr;re[c]=re[a]-tr;im[c]=im[a]-ti;re[a]+=tr;im[a]+=ti;const nr=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=nr;}}}}
const N=1024,HOP=256,hann=new Float32Array(N).map((_,i)=>.5-.5*Math.cos(2*Math.PI*i/N));
function spec(x){const fr=[];for(let s=0;s+N<=x.length;s+=HOP){const re=new Float32Array(N),im=new Float32Array(N);for(let i=0;i<N;i++)re[i]=x[s+i]*hann[i];fft(re,im);const m=new Float32Array(N/2);for(let i=0;i<N/2;i++)m[i]=(re[i]*re[i]+im[i]*im[i])/(N*N*.375/4);fr.push(m);}return fr;}
const dB=v=>20*Math.log10(Math.max(v,1e-9));
function metrics(L,R,Lr,Rr,dur,tSched,burst){const n=L.length;let pk=0,nan=0,pkr=0;const mono=new Float32Array(n);
  for(let i=0;i<n;i++){const a=L[i],c=R[i];if(!isFinite(a)||!isFinite(c)){nan++;continue;}pk=Math.max(pk,Math.abs(a),Math.abs(c));mono[i]=(a+c)/2;pkr=Math.max(pkr,Math.abs(Lr[i]||0),Math.abs(Rr[i]||0));}
  let last=0,first=-1;for(let i=0;i<n;i++)if(Math.abs(mono[i])>1e-3){if(first<0)first=i;last=i;}
  let last40=0;for(let i=0;i<n;i++)if(Math.abs(mono[i])>1e-2)last40=i;
  let e=0,cnt=0;for(let i=Math.max(first,0);i<=last;i++){e+=mono[i]*mono[i];cnt++;}
  let endAbs=0;for(let i=Math.max(0,n-Math.floor(.01*SR));i<n;i++)endAbs=Math.max(endAbs,Math.abs(mono[i]));
  // espectro médio sobre os primeiros 300 ms do som (ou até o fim ativo)
  const a0=Math.max(first,0),a1=Math.min(last,a0+Math.floor(.15*SR)),seg=mono.subarray(a0,Math.max(a1,a0+N+1)),fr=spec(seg),tot=new Float64Array(N/2);for(const m of fr)for(let i=0;i<N/2;i++)tot[i]+=m[i];
  let es=0,cs=0,bands=[0,0,0,0];const edges=[250,2000,6000];for(let i=1;i<N/2;i++){const f=i*SR/N;es+=tot[i];cs+=tot[i]*f;bands[f<edges[0]?0:f<edges[1]?1:f<edges[2]?2:3]+=tot[i];}
  return {durMs:Math.round((last-Math.max(first,0))/SR*1000),dur40Ms:Math.round(last40/SR*1000),peakDb:+dB(pk).toFixed(2),peakRawDb:+dB(pkr).toFixed(2),rmsDb:+dB(Math.sqrt(e/Math.max(cnt,1))).toFixed(1),
    centroid:Math.round(cs/Math.max(es,1e-12)),bands:bands.map(v=>+(100*v/Math.max(es,1e-12)).toFixed(1)),nan,endAbs:+endAbs.toExponential(2),silent:first<0,schedMs:+tSched.toFixed(3)};}
/* --- renderização --- */
const results=[];const pending=[];
for(const j of jobs){
  const run=async(raw)=>{seed(j.name.split('').reduce((a,c)=>a*31+c.charCodeAt(0),7));const r=await AU.render(()=>{j.f();},j.dur,SR,raw);return r;};
  const a=await run(false),r=await run(true);
  // schedMs: media de 5 repetições do agendamento (sem renderizar)
  let ts=0;const reps=j.burst?1:6;for(let k=0;k<reps;k++){const t0=performance.now();await AU.render(()=>{j.f();},.02,SR,false).catch(()=>{});ts+=0;}
  const m=metrics(a.b.getChannelData(0),a.b.getChannelData(1),r.b.getChannelData(0),r.b.getChannelData(1),j.dur,a.ts,j.burst);
  m.cat=j.cat;m.name=j.name;
  // guarda sinal para o espectrograma (mono, primeiros 1.6 s)
  const mono=new Float32Array(Math.min(a.b.length,Math.floor(1.6*SR)));const L=a.b.getChannelData(0),R=a.b.getChannelData(1);for(let i=0;i<mono.length;i++)mono[i]=(L[i]+R[i])/2;
  m._fr=spec(mono);results.push(m);}
/* --- tempo de agendamento por som (média de 20 repetições; nós criados no contexto offline) --- */
const cpu={};
async function timeIt(name,f){const a=[],R=30;for(let i=0;i<R;i++){const r=await AU.render(f,.05,SR,false);a.push(r.ts);}a.sort((x,y)=>x-y);cpu[name]={meanMs:+(a[R>>1]).toFixed(3),maxMs:+a[R-1].toFixed(3)};}
await timeIt('gun_rifle_me',()=>P('gun',null,{w:WID.rifle,me:true,S:ME.room}));await timeIt('gun_shotgun_me',()=>P('gun',null,{w:WID.shotgun,me:true,S:ME.room}));
await timeIt('gun_pistol_bot',()=>P('gun',{x:0,y:1,z:0},{w:WID.pistol,S:mkS(15,'hall')}));await timeIt('gun_rifle_sup',()=>P('gun',null,{w:WID.rifle,me:true,sup:true,S:ME.room}));
await timeIt('step',()=>P('step',null,{me:true,surf:'wood',S:ME.room}));await timeIt('step_gravel',()=>P('step',null,{me:true,surf:'gravel',S:ME.room}));
await timeIt('reload_rifle',()=>P('reload',null,{w:'rifle',S:ME.room}));await timeIt('glass',()=>P('glass',{x:0,y:1,z:0},{S:mkS(6,'room')}));await timeIt('boom',()=>P('boom',{x:0,y:1,z:0},{S:mkS(10,'room')}));
await timeIt('impact',()=>P('impact',{x:0,y:1,z:0},{kind:'hard',S:mkS(5,'room')}));
/* --- espectrogramas por categoria --- */
const CW=300,CH=150,PPS=CW/1.5,COLS=4,imgs={};
const cmap=v=>{const stops=[[0,0,0,0],[.2,30,10,80],[.45,150,30,110],[.7,235,100,30],[.9,255,210,80],[1,255,255,230]];for(let i=1;i<stops.length;i++){if(v<=stops[i][0]){const a=stops[i-1],b=stops[i],t=(v-a[0])/(b[0]-a[0]);return [a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,a[3]+(b[3]-a[3])*t];}}return [255,255,230];};
const cats=[...new Set(results.map(r=>r.cat))];
for(const c of cats){const items=results.filter(r=>r.cat===c),rows=Math.ceil(items.length/COLS),cv=document.createElement('canvas');cv.width=COLS*CW;cv.height=rows*(CH+16);const g=cv.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,cv.width,cv.height);
  items.forEach((m,idx)=>{const ox=(idx%COLS)*CW,oy=Math.floor(idx/COLS)*(CH+16)+14,fr=m._fr,img=g.createImageData(CW,CH);
    for(let x=0;x<CW;x++){const fi=Math.min(fr.length-1,Math.floor(x/PPS*SR/HOP));if(fi<0)continue;for(let y=0;y<CH;y++){
      const f=40*Math.pow(20000/40,1-(y/CH)),bin=f/(SR/N),b0=Math.floor(bin),v=fr[fi][Math.min(b0,N/2-1)]||0,d=10*Math.log10(Math.max(v,1e-12)),k=Math.max(0,Math.min(1,(d+100)/80)),col=cmap(k),o=(y*CW+x)*4;img.data[o]=col[0];img.data[o+1]=col[1];img.data[o+2]=col[2];img.data[o+3]=255;}}
    g.putImageData(img,ox,oy);g.fillStyle='#fff';g.font='11px sans-serif';g.fillText(m.name+'  '+m.peakDb+' dB  '+m.centroid+' Hz',ox+3,oy-3);
    g.strokeStyle='#345';g.strokeRect(ox+.5,oy+.5,CW-1,CH-1);for(const hz of [100,1000,10000]){const y=CH*(1-Math.log(hz/40)/Math.log(20000/40));g.strokeStyle='rgba(120,160,255,.35)';g.beginPath();g.moveTo(ox,oy+y);g.lineTo(ox+CW,oy+y);g.stroke();g.fillStyle='#8af';g.fillText(hz>=1000?(hz/1000)+'k':hz,ox+CW-26,oy+y-2);}});
  imgs[c]=cv.toDataURL('image/png').split(',')[1];}
for(const m of results)delete m._fr;
/* teste do banco de amostras: um seno de 1 kHz de 200 ms como "gun_rifle" deve substituir a síntese */
const sc=new OfflineAudioContext(2,SR,SR);AU.useCtx(sc);
const wav=(()=>{const n=Math.floor(.2*SR),buf=new ArrayBuffer(44+n*2),dv=new DataView(buf);const ws=(o,s)=>{for(let i=0;i<s.length;i++)dv.setUint8(o+i,s.charCodeAt(i));};ws(0,'RIFF');dv.setUint32(4,36+n*2,true);ws(8,'WAVEfmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);dv.setUint32(24,SR,true);dv.setUint32(28,SR*2,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);ws(36,'data');dv.setUint32(40,n*2,true);for(let i=0;i<n;i++)dv.setInt16(44+i*2,Math.sin(2*Math.PI*1000*i/SR)*20000*Math.exp(-i/SR*8),true);return new Uint8Array(buf);})();
AU.bankAdd('au_gun_rifle_1.wav',wav);await new Promise(r=>setTimeout(r,500));
const bankOk=!!(AU.bank.gun_rifle&&AU.bank.gun_rifle.length);
const rs=await AU.render(()=>P('gun',null,{w:WID.rifle,me:true,S:ME.room}),1,SR,true);const sm=metrics(rs.b.getChannelData(0),rs.b.getChannelData(1),rs.b.getChannelData(0),rs.b.getChannelData(1),1,0);
AU.bank.gun_rifle.length=0;
return {results,cpu,imgs,bank:{decoded:bankOk,centroidWithSample:sm.centroid,peak:sm.peakDb}};
},W);
await b.close();
for(const c in out.imgs)fs.writeFileSync(path.join(OUT,c+'.png'),Buffer.from(out.imgs[c],'base64'));
delete out.imgs;fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(out,null,1));
/* ---------- tabela e critérios ---------- */
const R=out.results,by=(c,n)=>R.find(r=>r.cat===c&&r.name===n);
const pad=(s,n)=>String(s).padEnd(n);
for(const cat of [...new Set(R.map(r=>r.cat))]){console.log('\n== '+cat);console.log(pad('nome',22),pad('dur60',7),pad('dur40',7),pad('pico',7),pad('picoRaw',8),pad('rms',7),pad('centr',6),'bandas(<250|250-2k|2-6k|>6k)');
  for(const r of R.filter(x=>x.cat===cat))console.log(pad(r.name,22),pad(r.durMs,7),pad(r.dur40Ms,7),pad(r.peakDb,7),pad(r.peakRawDb,8),pad(r.rmsDb,7),pad(r.centroid,6),r.bands.join(' | '));}
console.log('\nCPU (ms por som, agendamento de nós):',JSON.stringify(out.cpu));
const gates=[];const gate=(n,ok,v)=>gates.push([n,!!ok,v]);
gate('nenhum NaN/Inf',R.every(r=>r.nan===0),R.filter(r=>r.nan).map(r=>r.name).join());
gate('nenhum som mudo',R.every(r=>!r.silent),R.filter(r=>r.silent).map(r=>r.name).join());
gate('pico processado ≤ −1 dBFS (todos)',R.every(r=>r.peakDb<=-1),R.filter(r=>r.peakDb>-1).map(r=>r.name+':'+r.peakDb).join());
gate('pico SEM limitador ≤ 0 dBFS nos sons isolados',R.filter(r=>r.cat!=='shots_burst').every(r=>r.peakRawDb<=0),R.filter(r=>r.cat!=='shots_burst'&&r.peakRawDb>0).map(r=>r.name+':'+r.peakRawDb).join());
gate('caudas terminam em silêncio (últimos 10 ms < −60 dB)',R.every(r=>+r.endAbs<1e-3),R.filter(r=>+r.endAbs>=1e-3).map(r=>r.name+':'+r.endAbs).join());
const cen=n=>by('shots_room',n).centroid,low=n=>by('shots_room',n).bands[0],du=n=>by('shots_room',n).durMs,rms=n=>by('shots_room',n).rmsDb;
gate('pistola mais aguda que fuzil e fuzil mais que escopeta (centroide)',cen('pistol')>cen('rifle')&&cen('rifle')>cen('shotgun'),[cen('pistol'),cen('rifle'),cen('shotgun')].join('>'));
gate('escopeta com mais grave que fuzil e fuzil mais que pistola (banda <250 Hz)',low('shotgun')>low('rifle')&&low('rifle')>low('pistol'),[low('shotgun'),low('rifle'),low('pistol')].join('>'));
gate('escopeta com cauda mais longa que a pistola (×1.4)',du('shotgun')>=du('pistol')*1.4,du('shotgun')+' vs '+du('pistol'));
gate('fuzil mais cheio (RMS) que a pistola',rms('rifle')>rms('pistol'),rms('rifle')+' vs '+rms('pistol'));
gate('DMR/.308 mais grave que fuzil 5.56',low('dmr')>low('rifle556'),low('dmr')+' vs '+low('rifle556'));
const hf=r=>r.rmsDb+10*Math.log10(Math.max(r.bands[2]+r.bands[3],.01)/100);
for(const s of ['pistol','smg','rifle','dmr','lmg','shotgun']){const n=by('shots_room',s),q=by('shots_sup',s+'_sup');gate('suprimida '+s+' abafada: ≥ 8 dB mais baixa e ≥ 10 dB menos energia >2 kHz',q.rmsDb<=n.rmsDb-8&&hf(q)<=hf(n)-10,'rms '+q.rmsDb+' vs '+n.rmsDb+' / HF(>2k) '+hf(q).toFixed(1)+' vs '+hf(n).toFixed(1)+' dB');}
for(const s of ['pistol','rifle','shotgun']){const n=by('shots_room',s),f=by('shots_dist',s+'_far45out'),w=by('shots_dist',s+'_far45wall');gate('distante '+s+' mais baixo (≥ 8 dB), ≥ 8 dB menos agudos; atrás da parede mais baixo ainda',f.rmsDb<n.rmsDb-8&&hf(f)<=hf(n)-8&&w.rmsDb<f.rmsDb-1,'rms '+f.rmsDb+'/'+w.rmsDb+' vs '+n.rmsDb+' HF '+hf(f).toFixed(1)+' vs '+hf(n).toFixed(1));}
gate('cauda ao ar livre/corredor mais longa que sala (fuzil)',by('shots_env','rifle_out').durMs>by('shots_env','rifle_room').durMs&&by('shots_env','rifle_hall').durMs>by('shots_env','rifle_room').durMs,['room','hall','out'].map(e=>by('shots_env','rifle_'+e).durMs).join('/'));
const st=n=>by('steps',n);
gate('passo de carpete mais baixo que madeira; metal mais agudo que carpete',st('carpet_walk').rmsDb<st('wood_walk').rmsDb&&st('metal_walk').centroid>st('carpet_walk').centroid,st('carpet_walk').rmsDb+'<'+st('wood_walk').rmsDb+' ; '+st('metal_walk').centroid+'>'+st('carpet_walk').centroid);
gate('cascalho mais agudo que concreto',st('gravel_walk').centroid>st('concrete_walk').centroid,st('gravel_walk').centroid+'>'+st('concrete_walk').centroid);
gate('correr mais alto que andar e agachado mais baixo',['wood','concrete','metal'].every(s=>st(s+'_run').rmsDb>st(s+'_walk').rmsDb&&st(s+'_crouch').rmsDb<st(s+'_walk').rmsDb),'');
gate('passo de bot atrás da parede ≥ 3 dB mais baixo',st('bot_wood_6m_wall').rmsDb<st('bot_wood_6m').rmsDb-3,st('bot_wood_6m_wall').rmsDb+' vs '+st('bot_wood_6m').rmsDb);
gate('explosão: perto > longe (RMS) e longe mais grave',by('world','boom_3m').rmsDb>by('world','boom_60m_out').rmsDb&&by('world','boom_60m_out').centroid<by('world','boom_3m').centroid,'');
gate('banco de amostras: au_gun_rifle_1.wav decodifica e substitui a síntese',out.bank.decoded&&out.bank.centroidWithSample>900&&out.bank.centroidWithSample<1700,JSON.stringify(out.bank));
const tcpu=Object.entries(out.cpu).filter(([k,v])=>v.meanMs>=3);
gate('agendamento < 3 ms por som (média)',tcpu.length===0,tcpu.map(([k,v])=>k+':'+v.meanMs).join());
gate('sem erros de JS na página',errs.length===0,errs.join(' | '));
console.log('\n== critérios');let bad=0;for(const [n,ok,v] of gates){console.log((ok?'OK   ':'FALHA')+' '+n+(ok?'':'  → '+v));if(!ok)bad++;}
fs.writeFileSync(path.join(OUT,'gates.json'),JSON.stringify(gates,null,1));
console.log(bad?'\nÁUDIO REPROVADO ('+bad+')':'\nÁUDIO APROVADO');process.exit(bad?1:0);
})();
