// =====================================================================
// QA RÍGIDO — simulação (Node). Cada critério tem limite; qualquer falha
// reprova a build (código de saída 1). Uso: node test/qa.js [partidas]
// =====================================================================
const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'../src/sim');
const code=fs.readdirSync(dir).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
const N=+process.argv[2]||40;
const harness=`
G.autoplay=true;player.bot=true;
const M={rounds:[],stuck:0,stuckRounds:0,collide:0,collideEx:[],nan:0,stepMs:[],matches:0,timeouts:0,dmgSamples:{}};
/* célula sólida para um agente na altura y? */
function solidAt(x,z,y){const cx=Math.floor(x/CELL),cz=Math.floor(z/CELL),v=cellAt(cx,cz);
  if(v===1)return 'parede';if(v===2&&y<CRATE_H-.05)return 'caixa';
  const ox=x-cx*CELL,oz=z-cz*CELL;
  if(v===4){const d=DOORS[DIDX[cz*W+cx]];const off=d.ori==='x'?Math.abs(ox-1.5):Math.abs(oz-1.5);if(d.hp>0&&off<.1)return 'barricada';}
  if(v===3){const w=WALLS[WIDX[cz*W+cx]];const off=w.ori==='x'?Math.abs(ox-1.5):Math.abs(oz-1.5),along=w.ori==='x'?oz:ox,col=Math.min(3,Math.floor(along/.75));if(off<.16&&!openCol(w,col))return 'parede fina';}
  return null;}
/* instrumentos de combate (só dificuldade normal) */
const C={on:false,carriers:0,atkDeaths:0,atkLives:0,shots:0,hits:0,ttk:[],carrierDeaths:0,emptyT:0,firstDmg:new Map(),longHeadPellet:0};
const _damage=damage;damage=function(v,att,dm,head,pt,wname,pel){
  if(pel&&v._pelT!==G.clock){v._pelT=G.clock;v._pelHp=v.hp;}
  if(C.on&&v.alive&&att&&att!==v&&!/Granada|Carga|Explos|Coronhada/.test(wname||'')){C.hits++;if(!C.firstDmg.has(v))C.firstDmg.set(v,G.clock);}
  const was=v.alive,car=AI.atk&&AI.atk.carrier===v;_damage(v,att,dm,head,pt,wname,pel);
  if(C.on&&was&&!v.alive&&att&&att!==v){if(!/Granada|Carga|Explos|Coronhada/.test(wname||''))C.ttk.push(G.clock-(C.firstDmg.get(v)||G.clock));if(car)C.carrierDeaths++;
    if(pel&&att.pos.distanceTo(v.pos)>15&&v._pelHp>=70)C.longHeadPellet++;if(pel)C.sgKills=(C.sgKills||0)+1;}};
const _fire=fire;fire=function(a,e){const r=_fire(a,e);if(r&&C.on&&a.bot)C.shots+=WEAPONS[curW(a).id].pellets?0:1;return r;};
const _sr=startRound;startRound=function(){C.firstDmg.clear();_sr();};
const _od=AI.onDeath;AI.onDeath=function(v){const before=AI.atk&&AI.atk.carrier;_od(v);if(C.on&&AI.atk&&AI.atk.carrier&&AI.atk.carrier!==before)C.carriers++;if(C.on&&v.side==='atk')C.atkDeaths++;};
const _rs=AI.roundStart;AI.roundStart=function(){_rs();if(C.on&&AI.atk&&AI.atk.carrier)C.carriers++;if(C.on)C.atkLives+=agents.filter(a=>a.side==='atk').length;};
function runDiff(diff,n){DIFF=DIFFS[diff];C.on=diff==='normal';
for(let m=0;m<n;m++){
  newMatch();M.matches++;let steps=0;const track=new Map();let stuckThisRound=false,lastRound=G.round;
  while(G.phase!=='over'&&steps<60*60*40){
    const t0=performance.now();simStep(SIM_DT);const dt=performance.now()-t0;if(steps%7===0)M.stepMs.push(dt);steps++;
    if(G.round!==lastRound){if(stuckThisRound)M.stuckRounds++;stuckThisRound=false;lastRound=G.round;track.clear();}
    if(steps%30===0){for(const a of agents){if(!a.alive)continue;if(C.on&&G.phase==='action'&&a.bot){const ws=curW(a);if(ws.mag+ws.res===0)C.emptyT+=.5;}
      if(!isFinite(a.pos.x)||!isFinite(a.pos.y)||!isFinite(a.pos.z))M.nan++;
      if(!a.vault){const s=solidAt(a.pos.x,a.pos.z,a.pos.y);if(s){M.collide++;if(M.collideEx.length<5)M.collideEx.push(a.name+' em '+s+' ('+Math.floor(a.pos.x/CELL)+','+Math.floor(a.pos.z/CELL)+')');}}}}
    if(G.phase==='action'&&G.phaseT<SIM_DT*1.5&&!G.planted){const P=AI.atk,c=P&&P.carrier;const S=SITES[G.siteKey];
      const d='atk vivos '+aliveOf('atk').length+' def '+aliveOf('def').length+' | portador '+(c?(c.alive?(inSite(S,c.pos)?'no site':'a '+c.pos.distXZ(siteCenter(S)).toFixed(0)+'m'):'morto'):'nenhum')+' | grupos '+(P?P.groups.map(g=>g.stage+':'+g.entry.name).join(','):'');
      M.to=M.to||[];if(M.to.length<12)M.to.push(d);}
    /* travamento: atacante parado >20 s na fase de ação, sem alvo, sem ação (plantar) */
    if(G.phase==='action'&&steps%60===0){for(const a of agents){if(!a.alive||a.side!=='atk')continue;
      const t=track.get(a)||{p:a.pos.clone(),t:0};const holding=G.planted||inRoom(SITES[G.siteKey].room,a.pos);   /* segurar posição no objetivo/pós-planta é intencional */
      if(a.pos.distanceTo(t.p)<.4&&!a.act&&!(a.ai&&a.ai.target)&&!holding){t.t++;if(t.t===20){M.stuck++;stuckThisRound=true;if(AI.atk&&AI.atk.carrier===a&&(M.dmp=(M.dmp||0)+1)<=6){const g2=a.ai.group,s2=g2&&g2.entry.s;console.log('STUCK',JSON.stringify({cell:[Math.floor(a.pos.x/CELL),Math.floor(a.pos.z/CELL)],stage:g2&&g2.stage,entry:g2&&g2.entry.name,sBlocked:s2&&structBlocked(s2),s:s2&&{hp:s2.hp,p:!!s2.p,re:!!s2.reinforced},here:(function(){const h=structAt(Math.floor(a.pos.x/CELL),Math.floor(a.pos.z/CELL));return h&&{hp:h.hp,p:!!h.p,re:!!h.reinforced,blk:structBlocked(h)}})(),props:(typeof props!=='undefined'?props.filter(p=>p.pos&&p.pos.distXZ(a.pos)<3.5).map(p=>p.type+':'+(p.owner&&p.owner.name)):null),mates:agents.filter(x=>x.alive&&x!==a&&x.pos.distXZ(a.pos)<2).map(x=>x.side+':'+x.name),phaseT:G.phaseT,avoid:a.ai.avoid?a.ai.avoid.size:0,dist:a.pos.distXZ(plantSpot(a,SITES[G.siteKey]))}));}const P=AI.atk,gr=a.ai.group;const why=(P&&P.carrier===a?'portador ':'')+(gr?gr.stage:'semgrupo')+(G.phaseT<55?' tarde':'')+(a.ai.chase?' chase':'')+(a.ai.investigate?' invest':'')+' cel'+Math.floor(a.pos.x/CELL)+','+Math.floor(a.pos.z/CELL)+(gr?' entrada '+gr.entry.name:'');M.why=M.why||{};M.why[why]=(M.why[why]||0)+1;}}else{t.p=a.pos.clone();t.t=0;}track.set(a,t);}}
  }
  if(steps>=60*60*40)M.timeouts++;
  for(const r of G.stats.rounds)M.rounds.push(Object.assign({diff},r));
}}
runDiff('normal',${N});runDiff('easy',${Math.ceil(N/4)});runDiff('hard',${Math.ceil(N/4)});

/* ---------- testes de tiro (determinísticos onde possível) ---------- */
const T={};
function setupDuel(wid,dist){newMatch();G.phase='action';G.phaseT=999;for(const a of agents){a.alive=false;}
  const s=agents[0],t=agents[agents.length-1];s.alive=t.alive=true;s.op=opById('brecha');t.op=opById('muralha');s.slowT=0;   /* operador fixo: comparações justas entre testes */s.hp=t.hp=1e9;
  s.pos.set(1.5*CELL,0,13.5*CELL);t.pos.set(1.5*CELL,0,13.5*CELL+dist);s.yaw=Math.PI;s.pitch=0;s.vel.set(0,0,0);t.vel.set(0,0,0);
  s.w.p={id:wid,mag:999,res:999};s.cur='p';s.reloadT=0;s.ads=1;s.crouchK=0;s.lean=0;s.onGround=true;s.shots=0;s.punch=0;s.punchYaw=0;s.fireCD=0;s.act=null;t.crouchK=0;t.lean=0;t.yaw=0;
  const hp0=t.hp;return {s,t,hp0};}
/* 1ª bala mirando parado a 20 m acerta o peito (em 40 tentativas) */
for(const wid of ['pistol','smg','rifle','dmr']){let hits=0;for(let i=0;i<40;i++){const {s,t}=setupDuel(wid,20);const e=eyeOf(s);const c=new V3(t.pos.x,t.pos.y+1.2,t.pos.z);s.pitch=Math.atan2(c.y-e.y,Math.hypot(c.x-e.x,c.z-e.z));const h0=t.hp;fire(s,0);if(t.hp<h0)hits++;}T['primeira bala '+wid]=hits/40;}
/* rajada de 30 sem compensar: o recuo tem que subir (padrão) e ser repetível */
function spray(wid,comp){const {s}=setupDuel(wid,20);const y0=s.pitch;const pts=[];for(let i=0;i<60*4;i++){INPUT.fire=true;
  tickAgent(s,SIM_DT);playerStep(SIM_DT);if(s.sinceShot===0)pts.push({p:s.pitch+(s.punch||0)-y0,y:s.yaw-Math.PI});if(comp&&s.recoilPull){s.pitch-=s.recoilPull;s.recoilPull=0;}}
  INPUT.fire=false;return pts;}
const prevPlayer=player;player.bot=false;player.alive=true;INPUT.ads=true;
const sp1=spray('rifle'),sp2=spray('rifle');
T.climb=sp1.length>10?sp1[Math.min(sp1.length-1,14)].p:0;
T.repeat=sp1.length&&sp2.length?Math.max(...sp1.slice(0,15).map((q,i)=>Math.abs(q.p-(sp2[i]?sp2[i].p:0)))):1;
T.shots=sp1.length;INPUT.ads=false;
player.bot=true;
/* queda de dano com a distância (SMG: perto > longe) */
function dmgAt(wid,dist){const {s,t}=setupDuel(wid,dist);const e=eyeOf(s);const c=new V3(t.pos.x,t.pos.y+1.0,t.pos.z);s.pitch=Math.atan2(c.y-e.y,Math.hypot(c.x-e.x,c.z-e.z));s.ads=1;let tot=0,n=0;for(let i=0;i<30;i++){s.fireCD=0;s.shots=0;const h0=t.hp;fire(s,0);if(t.hp<h0){tot+=h0-t.hp;n++;}}return n?tot/n:0;}
T.smgNear=dmgAt('smg',5);T.smgFar=dmgAt('smg',28);
/* correr: velocidade máxima ≥ 1,3× a normal */
function topSpeed(spr){const {s}=setupDuel('rifle',20);INPUT.fwd=1;INPUT.sprint=spr;INPUT.ads=false;player.bot=false;let v=0;for(let i=0;i<120;i++){tickAgent(s,SIM_DT);playerStep(SIM_DT);v=Math.max(v,Math.hypot(s.vel.x,s.vel.z));}INPUT.fwd=0;INPUT.sprint=false;player.bot=true;return v;}
T.run=topSpeed(false);T.sprint=topSpeed(true);
/* escopeta: bago na cabeça não pode matar de longe; de perto no peito mata blindagem pesada */
function sgTest(dist,yOff){let kills=0;for(let i=0;i<30;i++){const {s,t}=setupDuel('shotgun',dist);t.hp=100;t.op=opById('muralha');s.sprint=false;s.sprintOut=0;s.vault=null;s.reloadT=0;s.fireCD=0;const e=eyeOf(s);const c=new V3(t.pos.x,t.pos.y+yOff,t.pos.z);s.pitch=Math.atan2(c.y-e.y,Math.hypot(c.x-e.x,c.z-e.z));fire(s,0);if(!t.alive||t.hp<=0)kills++;}return kills/30;}
T.sgHeadFar=sgTest(18,1.6);T.sgChestNear=sgTest(4,1.15);
/* coronhada não atravessa parede fina intacta */
{const w=WALLS.find(x=>!x.ext&&x.ori==='x');const {s,t}=setupDuel('rifle',5);t.hp=100;for(let i=0;i<NP;i++)w.p[i]=PANEL_HP;w.reinforced=false;
 s.pos.set(cc(w.x)-.55,0,w.z*CELL+1.5);t.pos.set(cc(w.x)+.55,0,w.z*CELL+1.5);s.yaw=-Math.PI/2;s.pitch=-.15;s.meleeCD=0;s.act=null;melee(s);T.meleeWall=100-t.hp;}
/* preparação: atacante não sai da base (drone destruído) */
{newMatch();G.phase='prep';G.phaseT=20;player.bot=false;player.alive=true;player.side='atk';drone.alive=false;const p0=player.pos.clone();INPUT.fwd=1;for(let i=0;i<120;i++)playerStep(SIM_DT);INPUT.fwd=0;T.prepMove=player.pos.distXZ(p0);player.bot=true;}
/* bot x alvo: parado vs andando de lado a 3 m/s, 8 m (a mira não pode "grudar") */
function botDuel(strafe){let hit=0,shots=0,first=-1;DIFF=DIFFS.normal;
  for(let k=0;k<40;k++){const {s,t}=setupDuel('rifle',8);s.bot=true;s.isPlayer=false;s.ads=0;Object.assign(s.ai,{target:null,aimP:null,seeT:0,reactT:0,burst:0,burstPause:0,alertT:0,hurtFrom:null,investigate:null,chase:null,path:[]});
   s.yaw=Math.atan2(-(t.pos.x-s.pos.x),-(t.pos.z-s.pos.z));t.hp=1e9;let h0=t.hp,dir=1;
   for(let i=0;i<60*3;i++){if(strafe){if(i%45===0)dir=-dir;t.pos.x+=dir*3*SIM_DT;t.vel.set(dir*3,0,0);}else t.vel.set(0,0,0);
     G.clock+=SIM_DT;tickAgent(s,SIM_DT);const sh=s.shots;AI.update(s,SIM_DT);if(s.sinceShot===0){shots++;if(first<0&&k===0)first=i*SIM_DT;}if(t.hp<h0){hit++;h0=t.hp;}}}
  return {rate:shots?hit/shots:0,first};}
/* preparação: defensor não consegue matar atacante; atirar não revela o atirador */
{const {s,t}=setupDuel('rifle',8);G.phase='prep';G.phaseT=20;t.side='atk';s.side='def';t.hp=100;const e=eyeOf(s);const c=new V3(t.pos.x,t.pos.y+1.2,t.pos.z);s.pitch=Math.atan2(c.y-e.y,Math.hypot(c.x-e.x,c.z-e.z));for(let i=0;i<5;i++){s.fireCD=0;fire(s,0);}T.prepDmg=100-t.hp;
 G.phase='action';s.spotT=-99;s.fireCD=0;fire(s,0);T.fireSpot=s.spotT>G.clock;}
const dS=botDuel(false),dM=botDuel(true);T.duelStill=dS.rate;T.duelStrafe=dM.rate;T.react=dS.first;
JSON.stringify({M,T,C:{shots:C.shots,hits:C.hits,ttk:C.ttk.sort((a,b)=>a-b),carrierDeaths:C.carrierDeaths,carriers:C.carriers,atkDeaths:C.atkDeaths,atkLives:C.atkLives,emptyT:C.emptyT,longHeadPellet:C.longHeadPellet,sgKills:C.sgKills||0}});`;
const t0=Date.now();
const ctx={console,Math,JSON,Date,Proxy,Float32Array,Int16Array,Int32Array,Uint8Array,Object,Array,Number,String,Infinity,isFinite,Map,performance:require('perf_hooks').performance};
const {M,T,C}=JSON.parse(vm.runInNewContext(code+'\n'+harness,ctx));
const R=M.rounds,RN=R.filter(r=>r.diff==='normal');
const pct=(a,b)=>b?a/b*100:0;
const atk=pct(RN.filter(r=>r.winner==='atk').length,RN.length),plant=pct(RN.filter(r=>r.planted).length,RN.length);
const avg=RN.reduce((s,r)=>s+(r.dur||0),0)/RN.length,PREP=45;
const elim=pct(RN.filter(r=>/eliminados/.test(r.reason)).length,RN.length);
const byD=d=>{const x=R.filter(r=>r.diff===d);return pct(x.filter(r=>r.winner==='atk').length,x.length);};
const ms=M.stepMs.sort((a,b)=>a-b),avgMs=ms.reduce((s,v)=>s+v,0)/ms.length,p99=ms[Math.floor(ms.length*.99)];
const reasons={};RN.forEach(r=>reasons[r.reason]=(reasons[r.reason]||0)+1);
const gates=[
 ['Vitórias do ataque (normal) entre 45% e 55%',atk>=45&&atk<=55,atk.toFixed(0)+'%'],
 ['Rodadas com bomba plantada ≥ 25% (modo bomba, não mata-mata)',plant>=25,plant.toFixed(0)+'%'],
 ['Duração média da rodada entre 75 s e 145 s (inclui 45 s de preparação)',avg>=75&&avg<=145,avg.toFixed(0)+' s'],
 ['Eliminação decide ≤ 85% das rodadas (objetivo importa)',elim<=85,elim.toFixed(0)+'%'],
 ['Fase de ação dura em média ≥ 40 s (sem correria)',avg-PREP>=40,(avg-PREP).toFixed(0)+' s'],
 ['Ataque ganha mais no fácil que no difícil? (dificuldade afeta só o lado do jogador: só informativo)',true,`fácil ${byD('easy').toFixed(0)}% · difícil ${byD('hard').toFixed(0)}%`],
 ['Nenhuma partida estourou o tempo limite',M.timeouts===0,M.timeouts+''],
 ['Rodadas com atacante travado (>20 s parado sem alvo, fora do objetivo, antes de plantar) ≤ 1%',pct(M.stuckRounds,R.length)<=1,pct(M.stuckRounds,R.length).toFixed(1)+'% ('+M.stuck+' eventos)'],
 ['Nenhum agente dentro de parede/caixa/barricada',M.collide===0,M.collide+(M.collideEx.length?' — '+M.collideEx.join('; '):'')],
 ['Nenhuma posição NaN',M.nan===0,M.nan+''],
 ['Passo de simulação: média < 0,30 ms',avgMs<.3,avgMs.toFixed(3)+' ms'],
 ['Passo de simulação: p99 < 2,5 ms',p99<2.5,p99.toFixed(2)+' ms'],
 ['1ª bala mirando parado a 20 m acerta ≥ 95% (pistola)',T['primeira bala pistol']>=.95,(T['primeira bala pistol']*100).toFixed(0)+'%'],
 ['1ª bala mirando parado a 20 m acerta ≥ 95% (submetralhadora)',T['primeira bala smg']>=.95,(T['primeira bala smg']*100).toFixed(0)+'%'],
 ['1ª bala mirando parado a 20 m acerta ≥ 95% (fuzil)',T['primeira bala rifle']>=.95,(T['primeira bala rifle']*100).toFixed(0)+'%'],
 ['1ª bala mirando parado a 20 m acerta ≥ 95% (DMR)',T['primeira bala dmr']>=.95,(T['primeira bala dmr']*100).toFixed(0)+'%'],
 ['Fuzil: rajada sobe com padrão (≥ 0,06 rad na 15ª bala)',T.climb>=.06,T.climb.toFixed(3)+' rad · '+T.shots+' tiros'],
 ['Fuzil: padrão de recuo repetível (desvio vertical ≤ 0,01 rad)',T.repeat<=.01,T.repeat.toFixed(4)+' rad'],
 ['Correr (Shift) é ≥ 30% mais rápido que andar normal',T.sprint>=T.run*1.3,T.run.toFixed(2)+' → '+T.sprint.toFixed(2)+' m/s'],
 ['Bots: precisão entre 15% e 45% (nem cego, nem aimbot)',C.hits/C.shots>=.15&&C.hits/C.shots<=.45,(C.hits/C.shots*100).toFixed(1)+'%'],
 ['Tempo do 1º dano até a morte (mediana) ≤ 2,5 s',C.ttk[C.ttk.length>>1]<=2.5,C.ttk[C.ttk.length>>1].toFixed(2)+' s'],
 ['Portador morre não mais que um atacante comum +8 pts (variância estatística)',C.carrierDeaths/C.carriers<=C.atkDeaths/C.atkLives+.08,(C.carrierDeaths/C.carriers*100).toFixed(0)+'% dos portadores morrem · atacantes em geral '+(C.atkDeaths/C.atkLives*100).toFixed(0)+'%'],
 ['Bot sem munição troca de arma (≤ 2 bot-s vazios por partida)',C.emptyT/Math.max(1,M.matches)<=2,(C.emptyT/Math.max(1,M.matches)).toFixed(1)+' s'],
 ['Escopeta: mata alvo com ≥ 70 de vida num tiro a > 15 m ≤ 3% das mortes dela',C.longHeadPellet<=C.sgKills*.03,C.longHeadPellet+' de '+C.sgKills],
 ['Escopeta: mirando na cabeça a 18 m não mata num tiro (≤ 5%)',T.sgHeadFar<=.05,(T.sgHeadFar*100).toFixed(0)+'%'],
 ['Escopeta: no peito a 4 m mata blindagem pesada (≥ 80%)',T.sgChestNear>=.8,(T.sgChestNear*100).toFixed(0)+'%'],
 ['Coronhada não atravessa parede fina',T.meleeWall===0,T.meleeWall+' de dano'],
 ['Atacante não sai da base na preparação',T.prepMove<.1,T.prepMove.toFixed(2)+' m'],
 ['Bot reage em ≥ 0,25 s (não instantâneo)',T.react>=.25,T.react.toFixed(2)+' s'],
 ['Bot: andar de lado reduz o acerto dele em ≥ 25%',T.duelStrafe<=T.duelStill*.75,(T.duelStill*100).toFixed(0)+'% parado → '+(T.duelStrafe*100).toFixed(0)+'% de lado'],
 ['Preparação: atacante não toma dano (sem spawn-kill)',T.prepDmg===0,T.prepDmg+' de dano'],
 ['Atirar não marca o atirador no radar/losango',!T.fireSpot,T.fireSpot?'marca':'não marca'],
 ['Submetralhadora: dano cai com a distância (5 m > 28 m)',T.smgNear>T.smgFar*1.15,T.smgNear.toFixed(0)+' → '+T.smgFar.toFixed(0)],
];
let fail=0;console.log(`\nQA — simulação · ${M.matches} partidas · ${R.length} rodadas · ${((Date.now()-t0)/1000).toFixed(0)} s\n`);
for(const [n,ok,v] of gates){if(!ok)fail++;console.log(`${ok?'PASSOU ':'REPROVOU'}  ${n}  →  ${v}`);}
console.log('\nmotivos (normal):',JSON.stringify(reasons));if(M.to)console.log('tempo esgotado:\n  '+M.to.join('\n  '));if(M.why)console.log('travamentos:',JSON.stringify(Object.entries(M.why).sort((a,b)=>b[1]-a[1]).slice(0,15)));
console.log(`\n${fail?'BUILD REPROVADA: '+fail+' critério(s)':'BUILD APROVADA'}`);
fs.writeFileSync(path.join(__dirname,'../dist/qa-sim.json'),JSON.stringify({gates:gates.map(([n,ok,v])=>({n,ok,v})),reasons},null,1));
process.exit(fail?1:0);
