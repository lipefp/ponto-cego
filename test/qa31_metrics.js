const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'../src/sim');
const code=fs.readdirSync(dir).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
const N=+process.argv[2]||10, diff=process.argv[3]||'normal';
const harness=`
G.autoplay=true;player.bot=true;DIFF=DIFFS['${diff}'];
const M={kills:[],shots:0,hits:0,heads:0,wallKills:0,stuck:[],oob:0,insideSolid:0,firstContact:[],noLosKills:0,ttk:[],carrierDeaths:0,rounds:0,
  idleLong:0,shotsByW:{},hitsByW:{},meleeKills:0,fragKills:0,teamkill:0,emptyGunT:0,plantStarts:0,plantInterrupted:0,crowd:0,deadlockRounds:0};
const firstDmg=new Map();
const _dmg=damage;const _sr=startRound;startRound=function(){firstDmg.clear();_sr();};
damage=function(v,att,dm,head,pt,wname,pel){if(v.alive&&att&&att!==v&&!/Granada|Carga|Explos|Coronhada/.test(wname)){M.hits++;if(head)M.heads++;}const wasCarrier=AI.atk&&AI.atk.carrier===v;if(v.alive&&att){if(!firstDmg.has(v))firstDmg.set(v,G.clock);if(att.team===v.team&&att!==v)M.teamkill++;}
  const was=v.alive;_dmg(v,att,dm,head,pt,wname,pel);
  if(was&&!v.alive&&att){const e=eyeOf(att),c=new V3(v.pos.x,v.pos.y+1.1,v.pos.z),h=headPos(v);
    const los=clearLine(e,c)||clearLine(e,h);
    M.kills.push({d:att.pos.distanceTo(v.pos),w:wname,head,los,ttk:G.clock-(firstDmg.get(v)||G.clock),rc:G.roundClock});
    if(!los&&!/Granada|Carga|Explos/.test(wname))M.noLosKills++;
    if(wasCarrier)M.carrierDeaths++;
  }};
const _fire=fire;
fire=function(a,e){const ws=curW(a);const r=_fire(a,e);if(r){M.shots++;M.shotsByW[ws.id]=(M.shotsByW[ws.id]||0)+1;}return r;};
const hm=HOOK.blood;
let lastRoundClock=0;
for(let m=0;m<${N};m++){
  newMatch();let steps=0;const last=new Map();
  while(G.phase!=='over'&&steps<60*60*40){simStep(SIM_DT);steps++;
    if(steps%30===0&&G.phase==='action'){
      for(const a of agents){if(!a.alive)continue;
        const cx=Math.floor(a.pos.x/CELL),cz=Math.floor(a.pos.z/CELL);const c=cellAt(cx,cz);
        if(c===1)M.insideSolid++;if(c===2&&a.pos.y<1)M.insideSolid++;
        if(a.pos.x<0||a.pos.z<0||a.pos.x>W*CELL||a.pos.z>H*CELL)M.oob++;
        const L=last.get(a);if(L&&L.p.distXZ(a.pos)<.05){L.t+=.5;}else last.set(a,{p:a.pos.clone(),t:0});
        const ws=curW(a);if(ws.mag===0&&ws.res===0)M.emptyGunT+=.5;
        // stuck: zero movement for >20s while not in a hold/guard
        const LL=last.get(a);if(LL.t===20){M.stuck.push({n:a.name,side:a.side,cell:[cx,cz],plan:a.side==='atk'?(a.ai.group&&a.ai.group.stage):'def',carrier:AI.atk&&AI.atk.carrier===a,rc:G.roundClock|0});}
      }
    }
  }
}
M.rounds=G.stats.rounds.length;
JSON.stringify(M);`;
const M=JSON.parse(vm.runInNewContext(code+'\n'+harness,{console,Math,JSON,Date,Proxy,Float32Array,Int16Array,Int32Array,Uint8Array,Object,Array,Number,String,Infinity,Map,Set}));
const K=M.kills;const n=K.length;
const pct=x=>(x*100).toFixed(0)+'%';
const byW={};K.forEach(k=>{byW[k.w]=byW[k.w]||{n:0,hs:0,d:0,ttk:0};byW[k.w].n++;if(k.head)byW[k.w].hs++;byW[k.w].d+=k.d;byW[k.w].ttk+=k.ttk;});
console.log('kills',n,'hs',pct(K.filter(k=>k.head).length/n),'noLOS kills(bullet)',M.noLosKills,'teamdmg',M.teamkill);
for(const w in byW){const b=byW[w];console.log(' ',w,b.n,'hs',pct(b.hs/b.n),'avgDist',(b.d/b.n).toFixed(1),'avgTTKfromFirstHit',(b.ttk/b.n).toFixed(2));}
const ds=K.map(k=>k.d).sort((a,b)=>a-b);console.log('dist p10/50/90',ds[n*.1|0].toFixed(1),ds[n*.5|0].toFixed(1),ds[n*.9|0].toFixed(1));
const t0=K.filter(k=>k.ttk===0).length;console.log('instant kills (one-shot):',pct(t0/n));
const sg=K.filter(k=>k.w==='Trovão').map(k=>k.d).sort((a,b)=>a-b);console.log('shotgun kill dist p25/50/75/90',[.25,.5,.75,.9].map(q=>sg[sg.length*q|0].toFixed(1)).join('/'), 'shotgun hs kills >15m',K.filter(k=>k.w==='Trovão'&&k.d>15&&k.head).length);console.log('bot accuracy hits/shots',(M.hits/M.shots*100).toFixed(1)+'%','head share of hits',(M.heads/M.hits*100).toFixed(1)+'%');
console.log('shots by weapon',M.shotsByW);
console.log('insideSolid samples',M.insideSolid,'oob',M.oob,'emptyGun bot-seconds',M.emptyGunT,'carrierDeaths',M.carrierDeaths);
console.log('stuck>20s events',M.stuck.length);const sc={};M.stuck.forEach(s=>{const k=s.side+':'+s.plan+':'+s.cell+(s.carrier?':CARRIER':'');sc[k]=(sc[k]||0)+1;});console.log(Object.entries(sc).sort((a,b)=>b[1]-a[1]).slice(0,15));
const rcs=K.map(k=>k.rc).sort((a,b)=>a-b);console.log('kill round-clock p10/50',rcs[n*.1|0].toFixed(0),rcs[n*.5|0].toFixed(0));
