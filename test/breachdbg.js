const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'../src/sim');
const code=fs.readdirSync(dir).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
const h=`G.autoplay=true;player.bot=true;newMatch();G.phase='action';G.phaseT=100;
for(const a of agents)a.alive=false;const b=agents.find(a=>a.team==='B');b.alive=true;b.side='atk';b.op=opById('macarico');b.gadgetN=1;b.charges=[];
b.pos.set(9.93*CELL,0,13.31*CELL);b.yaw=-4.38;b.ai={};const w=wallAt(9,13);w.p.fill(PANEL_HP);w.reinforced=false;
const goal=new V3(8.5*CELL,0,20.5*CELL);G.siteKey='A';AI.roundStart();b.ai.chase=new V3(16.6*CELL,0,18.6*CELL);b.ai.investigate=new V3(14.7*CELL,0,21.3*CELL);const log=[];
for(let i=0;i<60*6;i++){tickAgent(b,SIM_DT);AI.update(b,SIM_DT);const m={};
 if(i%30===0)log.push(i+' m='+JSON.stringify(m)+' p='+Array.from(w.p).map(v=>v>0?1:0).join('')+' yaw='+b.yaw.toFixed(2)+' pitch='+b.pitch.toFixed(2)+' melee='+b.meleeCD.toFixed(2)+' pos='+(b.pos.x/CELL).toFixed(2)+','+(b.pos.z/CELL).toFixed(2));}
log.join('\\n');`;
console.log(vm.runInNewContext(code+'\n'+h,{console,Math,JSON,Date,Proxy,Float32Array,Int16Array,Int32Array,Uint8Array,Object,Array,Number,String,Infinity,isFinite,Map}));
