const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'../src/sim');
const code=fs.readdirSync(dir).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
const harness=`
G.autoplay=true;player.bot=true;
const log=[];
HOOK.roundEnd=(w,reason)=>{const P=AI.atk;log.push(reason+' site'+G.siteKey+' plantT='+G.rs.plantT+' | '+P.groups.map(g=>g.entry.name+':'+g.stage+'['+g.members.map(m=>m.name+(m.alive?'':'✝')+'('+(m.pos.x/3).toFixed(0)+','+(m.pos.z/3).toFixed(0)+')'+(m===P.carrier?'*':'')).join(' ')+']').join(' / '));};
for(let m=0;m<3;m++){newMatch();let s=0;while(G.phase!=='over'&&s<60*60*40){simStep(SIM_DT);s++;}}
log.join('\\n');`;
console.log(vm.runInNewContext(code+'\n'+harness,{console,Math,JSON,Date,Proxy,Float32Array,Int16Array,Int32Array,Uint8Array,Object,Array,Number,String,Infinity}));
