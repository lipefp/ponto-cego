// Teste automático: N partidas só com bots, mede métricas de balanceamento.
const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'../src/sim');
const code=fs.readdirSync(dir).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
const N=+process.argv[2]||20, diff=process.argv[3]||'normal';
const harness=`
G.autoplay=true;player.bot=true;DIFF=DIFFS['${diff}'];
const out=[];let errors=0;
for(let m=0;m<${N};m++){
  newMatch();let steps=0;
  while(G.phase!=='over'&&steps<60*60*40){simStep(SIM_DT);steps++;}
  out.push({rounds:G.stats.rounds.slice(),score:[teams.A.score,teams.B.score],steps});
}
JSON.stringify(out);`;
const t0=Date.now();
const res=JSON.parse(vm.runInNewContext(code+'\n'+harness,{console,Math,JSON,Date,Proxy,Float32Array,Int16Array,Int32Array,Uint8Array,Object,Array,Number,String,Infinity}));
const R=res.flatMap(m=>m.rounds);
const atk=R.filter(r=>r.winner==='atk').length;
const planted=R.filter(r=>r.planted).length;const atkWinsPlant=R.filter(r=>r.planted&&r.winner==='atk').length;
const reasons={};R.forEach(r=>reasons[r.reason]=(reasons[r.reason]||0)+1);
const avg=R.reduce((s,r)=>s+(r.dur||0),0)/R.length;
const stuck=res.filter(m=>m.steps>=60*60*40).length;
console.log(`dificuldade=${diff} partidas=${N} rodadas=${R.length} (${((Date.now()-t0)/1000).toFixed(1)}s)`);
console.log(`vitórias ataque: ${(atk/R.length*100).toFixed(0)}% · plantou: ${(planted/R.length*100).toFixed(0)}% · duração média: ${avg.toFixed(0)}s · brechas/rodada: ${(R.reduce((s,r)=>s+r.breaches,0)/R.length).toFixed(1)}`);
console.log('motivos:',reasons,'| vitórias com planta:',atkWinsPlant);
if(stuck)console.log('PARTIDAS TRAVADAS:',stuck);
