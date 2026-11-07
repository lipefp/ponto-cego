const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'../src/sim');
const code=fs.readdirSync(dir).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
const harness=`
const res={};
for(const dn of ['easy','normal','hard'])for(const dist of [5,12,25])for(const behind of [false,true])for(const mode of ['stand','strafe','crouch']){
  DIFF=DIFFS[dn];let tf=[],tk=[],hs=0,n=0;
  for(let k=0;k<40;k++){
    G.autoplay=false;newMatch();G.phase='action';G.phaseT=150;
    const pl=player;pl.bot=false;
    for(const a of agents){if(a!==pl&&a.team==='A')a.alive=false;}
    const def=agents.filter(a=>a.team==='B');def.forEach((a,i)=>{if(i>0)a.alive=false;});
    const e=def[0];e.alive=true;e.hp=100;e.ai={hold:new V3(cc(17),0,cc(8)),watch:{in:new V3(cc(17),0,cc(20))},tasks:[]};e.ai.roamer=false;e.side='def';
    pl.side='atk';pl.alive=true;pl.hp=100;pl.op=OPS.atk[0];
    e.pos.set(cc(17)+.4,0,cc(8));e.yaw=behind?0:Math.PI; // yaw PI faces +z
    pl.pos.set(cc(17)+.4,0,cc(8)+dist);pl.yaw=0;pl.vel.set(0,0,0);
    INPUT.fwd=0;INPUT.side=0;INPUT.crouch=mode==='crouch';INPUT.fire=false;
    let t=0,first=null;const h0=pl.hp;
    while(t<6&&pl.alive){if(mode==='strafe')INPUT.side=Math.floor(t/0.6)%2?1:-1;simStep(SIM_DT);t+=SIM_DT;if(first==null&&e.shots>0)first=t;}
    INPUT.side=0;INPUT.crouch=false;
    n++;if(first!=null)tf.push(first);if(!pl.alive){tk.push(t);if(pl.lastHead)hs++;}
  }
  const avg=a=>a.length?(a.reduce((s,x)=>s+x,0)/a.length).toFixed(2):'-';
  res[dn+' d'+dist+(behind?' BACK':'')+' '+mode]='firstShot '+avg(tf)+'s killed '+tk.length+'/'+n+' ttk '+avg(tk)+'s hsDeaths '+hs;
}
JSON.stringify(res,null,1);`;
console.log(vm.runInNewContext(code+'\n'+harness,{console,Math,JSON,Date,Proxy,Float32Array,Int16Array,Int32Array,Uint8Array,Object,Array,Number,String,Infinity,Map,Set}));
