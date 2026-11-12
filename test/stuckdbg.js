const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'../src/sim');
const code=fs.readdirSync(dir).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
const h=`G.autoplay=true;player.bot=true;const out=[];
for(let m=0;m<8&&out.length<14;m++){newMatch();let steps=0;const tr=new Map();
 while(G.phase!=='over'&&steps<60*60*40){simStep(SIM_DT);steps++;
  if(G.phase==='action'&&steps%60===0)for(const a of agents){if(!a.alive||a.side!=='atk')continue;const t=tr.get(a)||{p:a.pos.clone(),t:0};
   if(a.pos.distanceTo(t.p)<.4&&!a.act&&!a.ai.target){t.t++;if(t.t===20&&out.length<14){const ai=a.ai;const cx=Math.floor(a.pos.x/CELL),cz=Math.floor(a.pos.z/CELL);const hs=structAt(cx,cz);const nx=ai.path&&ai.path[0];const ns=nx&&structAt(nx.x,nx.z);
     out.push({n:a.name,op:a.op.id,g:a.gadgetN,ch:a.charges.length,cell:[cx,cz],pos:[+(a.pos.x/CELL).toFixed(2),+(a.pos.z/CELL).toFixed(2)],here:hs?(hs.p?'wall':'door')+(hs.p?(hs.reinforced?' R':' p='+Array.from(hs.p).map(v=>v>0?1:0).join('')):' hp'+hs.hp):null,
      next:nx?[nx.x,nx.z,ns?(ns.p?'wall':'door')+(ns.p?(ns.reinforced?' R':' p='+Array.from(ns.p).map(v=>v>0?1:0).join('')):' hp'+ns.hp):cellAt(nx.x,nx.z)]:null,plen:ai.path?ai.path.length:-1,
      chase:ai.chase?[+(ai.chase.x/CELL).toFixed(1),+(ai.chase.z/CELL).toFixed(1)]:null,inv:ai.investigate?[+(ai.investigate.x/CELL).toFixed(1),+(ai.investigate.z/CELL).toFixed(1)]:null,yaw:a.yaw.toFixed(2),vel:Math.hypot(a.vel.x,a.vel.z).toFixed(2),stage:ai.group&&ai.group.stage,plan:JSON.stringify(attackPlan(a,0)),carrier:AI.atk.carrier===a,spot:ai.spot?[+(ai.spot.x/CELL).toFixed(1),+(ai.spot.z/CELL).toFixed(1)]:null,site:G.siteKey,alert:ai.alertT,hurt:!!ai.hurtFrom});}}else{t.p=a.pos.clone();t.t=0;}tr.set(a,t);}}}
JSON.stringify(out);`;
const r=JSON.parse(vm.runInNewContext(code+'\n'+h,{console,Math,JSON,Date,Proxy,Float32Array,Int16Array,Int32Array,Uint8Array,Object,Array,Number,String,Infinity,isFinite,Map}));
for(const x of r)console.log(JSON.stringify(x));
