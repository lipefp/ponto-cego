const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'../src/sim');
const code=fs.readdirSync(dir).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
const h=`G.autoplay=true;player.bot=true;const S={rounds:0,reachedSite:0,started:0,planted:0,carrierDiedBefore:0,carrierDiedInSite:0,elimDefBeforeSite:0,firstKillAtk:0,actT:[]};
for(let m=0;m<12;m++){newMatch();let steps=0,lastRound=-1,f={};
 while(G.phase!=='over'&&steps<60*60*40){simStep(SIM_DT);steps++;
  if(G.round!==lastRound){if(lastRound>0){S.rounds++;if(f.reach)S.reachedSite++;if(f.start)S.started++;if(f.pl)S.planted++;if(f.cdie&&!f.reach)S.carrierDiedBefore++;if(f.cdie&&f.reach&&!f.pl)S.carrierDiedInSite++;if(f.reach&&!f.start){const r=G.stats.rounds[G.stats.rounds.length-1];const k=r.reason+' defvivos@site='+f.defAt;S.why=S.why||{};S.why[k]=(S.why[k]||0)+1;}}f={};lastRound=G.round;}
  if(G.phase==='action'&&AI.atk){const c=AI.atk.carrier;if(c){if(c.alive&&inSite(SITES[G.siteKey],c.pos)&&!f.reach){f.reach=true;f.defAt=aliveOf('def').length;}if(c.act&&c.act.kind==='plant'){f.start=true;f.maxT=Math.max(f.maxT||0,c.act.t);f.was=c;f.lastT=c.act.t;}else if(f.was===c&&!G.planted){const t=c.ai.target;const k=(t?'alvo '+t.pos.distXZ(c.pos).toFixed(0)+'m':'sem alvo')+' t='+(f.lastT||0).toFixed(1)+' v='+Math.hypot(c.vel.x,c.vel.z).toFixed(1)+' site='+inSite(SITES[G.siteKey],c.pos);S.actT.push(k);f.was=null;}if(!c.alive)f.cdie=true;}if(G.planted)f.pl=true;}
 }}
JSON.stringify(S);`;
console.log(vm.runInNewContext(code+'\n'+h,{console,Math,JSON,Date,Proxy,Float32Array,Int16Array,Int32Array,Uint8Array,Object,Array,Number,String,Infinity,isFinite,Map}));
