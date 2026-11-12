const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'../src/sim');
const code=fs.readdirSync(dir).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
const harness=`
G.autoplay=true;player.bot=true;const rows=[];let cur=null;
HOOK.roundStart=()=>{cur={inSite:false,act:false,maxAct:0,carrierDeaths:0,firstEnter:null,aliveDefAtEnter:null};rows.push(cur);};
HOOK.agentKilled=(v)=>{if(AI.atk&&AI.atk.carrier===v)cur.carrierDeaths++;};
for(let m=0;m<6;m++){newMatch();let s=0;while(G.phase!=='over'&&s<60*60*40){simStep(SIM_DT);s++;
 if(G.phase==='action'&&cur){const c=AI.atk.carrier;if(c&&c.alive&&inSite(SITES[G.siteKey],c.pos)){if(!cur.inSite){cur.inSite=true;cur.firstEnter=Math.round(ACTION_T-G.phaseT);cur.aliveDefAtEnter=aliveOf('def').length;}if(c.act){cur.act=true;cur.maxAct=Math.max(cur.maxAct,c.act.t);}}
 if(!cur.groupEnter&&AI.atk.groups.some(g=>g.stage==='enter'))cur.groupEnter=Math.round(ACTION_T-G.phaseT);}}}
const n=rows.length;
'rodadas '+n+' | portador chegou no objetivo: '+rows.filter(r=>r.inSite).length+' | começou a plantar: '+rows.filter(r=>r.act).length+' | portador morreu (média): '+(rows.reduce((s,r)=>s+r.carrierDeaths,0)/n).toFixed(2)+'\\nentrada do grupo (s): '+rows.map(r=>r.groupEnter).join(',')+'\\nportador no objetivo (s,defs vivos): '+rows.filter(r=>r.inSite).map(r=>r.firstEnter+'/'+r.aliveDefAtEnter+'/act'+r.maxAct.toFixed(1)).join(' ');`;
console.log(vm.runInNewContext(code+'\n'+harness,{console,Math,JSON,Date,Proxy,Float32Array,Int16Array,Int32Array,Uint8Array,Object,Array,Number,String,Infinity}));
