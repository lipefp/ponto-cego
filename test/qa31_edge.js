const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'../src/sim');
const code=fs.readdirSync(dir).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
const harness=`
const out={};
function setup(){G.autoplay=false;newMatch();G.phase='action';G.phaseT=150;for(const a of agents){a.alive=false;}player.alive=true;player.hp=100;player.bot=false;}
// (a) melee through wall: wall cell 16 (x plane cc(16)=49.5), attacker at x=48.9, enemy at x=50.1
setup();const e=agents.find(a=>a.team==='B');e.alive=true;e.hp=100;e.pos.set(50.1,0,cc(14));player.pos.set(48.9,0,cc(14));player.yaw=-Math.PI/2;player.pitch=-.2;
out.wallIntact=WALLS.find(w=>w.x===16&&w.z===14).p.every(v=>v>0);
melee(player);out.meleeThroughWall_enemyHp=e.hp;
// (b) shotgun at distances: average damage to chest-aimed and head-aimed target
for(const d of [5,10,20,30]){let hk=0,bk=0;for(let k=0;k<200;k++){setup();const t=agents.find(a=>a.team==='B');t.alive=true;t.hp=100;t.op=OPS.def[0];t.pos.set(cc(17)+.5,0,cc(8));player.pos.set(cc(17)+.5,0,cc(8)+d);player.yaw=0;player.op=OPS.def[1];player.w.p=mkW('shotgun');player.cur='p';player.ads=1;player.fireCD=0;
  const eye=eyeOf(player);const tgt=new V3(t.pos.x,t.pos.y+1.1,t.pos.z);player.pitch=Math.atan2(tgt.y-eye.y,d);fire(player,0);if(!t.alive)bk++;}
  out['shotgun one-shot kill rate chest-aim @'+d+'m']=(bk/200*100).toFixed(0)+'%';}
// (c) bots out of ammo: count weapon types bots run dry with
// (d) time-out while plant in progress
setup();G.siteKey='A';const at=player;at.side='atk';const S=SITES.A;at.pos.set(cc(11),0,cc(17));const d=agents.find(a=>a.team==='B');d.alive=true;d.side='def';d.pos.set(3,0,3);d.bot=false;
G.phaseT=2;INPUT.interact=true;let t=0;while(G.phase==='action'&&t<6){simStep(SIM_DT);t+=SIM_DT;}INPUT.interact=false;
out.plantDuringTimeout={phase:G.phase,planted:!!G.planted,reason:G.rs.reason,heldFor:t.toFixed(2)};
// (e) attacker in prep without drone can walk to site
G.autoplay=false;newMatch();player.bot=false;drone.alive=false;const p0=player.pos.clone();INPUT.fwd=1;for(let i=0;i<60*10;i++)simStep(SIM_DT);INPUT.fwd=0;out.prepWalk={phase:G.phase,moved:+p0.distXZ(player.pos).toFixed(1)};
JSON.stringify(out,null,1);`;
console.log(vm.runInNewContext(code+'\n'+harness,{console,Math,JSON,Date,Proxy,Float32Array,Int16Array,Int32Array,Uint8Array,Object,Array,Number,String,Infinity,Map,Set}));
