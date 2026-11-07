const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'../src/sim');
const code=fs.readdirSync(dir).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
const harness=`
G.autoplay=true;player.bot=true;const log=[];
newMatch();let s=0;let inSiteT=0,actT=0,maxAct=0;
while(G.round<4&&s<60*60*30){simStep(SIM_DT);s++;const c=AI.atk&&AI.atk.carrier;
 if(c&&c.alive&&G.phase==='action'&&inSite(SITES[G.siteKey],c.pos)){inSiteT++;if(c.act){actT++;maxAct=Math.max(maxAct,c.act.t);} else if(s%30==0)log.push('insite noact op='+JSON.stringify(interactOption(c))+' vel='+Math.hypot(c.vel.x,c.vel.z).toFixed(2)+' tgt='+(c.ai.target?c.ai.target.name:'-')+' onG='+c.onGround);}}
'inSite frames '+inSiteT+' act frames '+actT+' maxAct '+maxAct.toFixed(2)+'\\n'+log.slice(0,15).join('\\n');`;
console.log(vm.runInNewContext(code+'\n'+harness,{console,Math,JSON,Date,Proxy,Float32Array,Int16Array,Int32Array,Uint8Array,Object,Array,Number,String,Infinity}));
