const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'../src/sim');
const code=fs.readdirSync(dir).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
const harness=`
G.autoplay=true;player.bot=true;const log=[];
newMatch();let s=0;
while(G.round<3&&s<60*60*30){simStep(SIM_DT);s++;
 if(s%(60*4)==0&&G.phase==='action'){const P=AI.atk;log.push('R'+G.round+' t'+G.phaseT.toFixed(0)+' site'+G.siteKey+' '+P.groups.map(g=>g.entry.name+':'+g.stage+' gt'+g.t.toFixed(1)+' ['+g.members.map(m=>m.name+(m.alive?'':'✝')+'('+(m.pos.x/3).toFixed(1)+','+(m.pos.z/3).toFixed(1)+')'+(m===P.carrier?'*':'')+(m.ai.target?'T':'')+(m.ai.chase?'C':'')+(m.ai.investigate?'I':'')+' p'+(m.ai.path?m.ai.path.length:0)).join(' ')+']').join(' / '));}}
log.join('\\n');`;
console.log(vm.runInNewContext(code+'\n'+harness,{console,Math,JSON,Date,Proxy,Float32Array,Int16Array,Int32Array,Uint8Array,Object,Array,Number,String,Infinity}));
