// QA — gadgets de clarão e bloqueador + operadores A-22/A-41/D-31 (Node, só src/sim)
const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'../src/sim');
const code=fs.readdirSync(dir).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
const expose='\n;globalThis.S={G,agents,get player(){return player},PROPS,projectiles,drone,OPS,GADGETS,WEAPONS,LOADOUTS,ARMOR,useGadget,flashBang,jammed,addProp,newMatch,simStep,SIM_DT,eyeOf,dirFrom,dronePing,JAM_R,opById};';
const ctx={console,Math,performance,setTimeout,localStorage:undefined};vm.createContext(ctx);vm.runInContext(code+expose,ctx);const S=ctx.S;
const fails=[];const ok=(c,m)=>{if(!c)fails.push(m);};
/* roster */
const ops=S.OPS.atk.concat(S.OPS.def);
for(const id of['cod_a41','cod_d31','cod_a22']){const o=S.opById(id);ok(o&&o.id===id,'op '+id);
  ok(S.GADGETS[o.gadget],'gadget '+id);ok(o.armor+({1:5.2,2:4.7,3:4.2}[o.armor]>0),'x');
  for(const w of o.prims.concat(o.secs))ok(S.WEAPONS[w],id+' arma '+w);}
ok(S.opById('cod_a22').gadget==='flash'&&S.opById('cod_a41').gadget==='shield'&&S.opById('cod_d31').gadget==='jammer','gadgets dos ops');
ok(S.OPS.atk.length===6&&S.OPS.def.length===6,'6 ops por lado');
ok(new Set(ops.map(o=>o.name)).size===ops.length,'nomes únicos');
for(const side of['atk','def']){const a=S.OPS[side].map(o=>o.armor+(o.armor===1?2:o.armor===2?2:1)).length;}
/* partida */
S.G.autoplay=true;S.player.bot=true;S.newMatch();
const atk=S.agents.filter(a=>a.side==='atk'&&a.bot),def=S.agents.filter(a=>a.side==='def'&&a.bot);
S.G.phase='action';
/* clarão: de frente cega mais do que de costas; longe não cega */
const v=def[0];v.pos.set(v.pos.x,v.pos.y,v.pos.z);
const eye=S.eyeOf(v),fw=S.dirFrom(v.yaw,0);
const spot=(k)=>eye.clone().addScaledVector(fw,k);
v.blindT=0;S.flashBang(spot(3),atk[0]);const front=v.blindT;
v.blindT=0;S.flashBang(spot(-3),atk[0]);const back=v.blindT;
v.blindT=0;S.flashBang(spot(40),atk[0]);const far=v.blindT;
console.log('cegueira de frente',front.toFixed(2),'de costas',back.toFixed(2),'longe',far);
ok(front>1.5,'frente deveria cegar >1.5s');ok(front>back,'frente > costas');ok(far===0,'longe não cega');
/* bot cego não vê ninguém */
v.blindT=0;v.ai.target={};S.flashBang(spot(2),atk[0]);ok(v.ai.target===null,'alvo zerado');const b0=v.blindT;
for(let i=0;i<60;i++)S.simStep(S.SIM_DT);
ok(!v.alive||(v.blindT<b0-.8&&v.blindT>b0-1.2),'cegueira decai '+b0+' -> '+v.blindT);
/* granada de clarão pelo useGadget */
const a22=atk[0];a22.op=S.opById('cod_a22');a22.gadgetN=3;S.G.phase='action';const n0=S.projectiles.length;
ok(S.useGadget(a22)&&S.projectiles.length===n0+1&&S.projectiles[S.projectiles.length-1].type==='flash','lança flash');
for(let i=0;i<150;i++)S.simStep(S.SIM_DT);
ok(S.projectiles.every(p=>p.type!=='flash'),'flash detonou');
/* bloqueador */
const d31=def[1];d31.op=S.opById('cod_d31');d31.gadgetN=2;S.G.phase='action';d31.alive=true;
// procura uma posição aberta: usa a do próprio agente
const np=S.PROPS.length;let placed=false;for(let k=0;k<8&&!placed;k++){d31.yaw=k*Math.PI/4;placed=S.useGadget(d31);}
console.log('jammer colocado:',placed);ok(placed&&S.PROPS.some(p=>p.type==='jammer'),'jammer colocado');
const jam=S.PROPS.find(p=>p.type==='jammer');
if(jam){ok(S.jammed({x:jam.cx+2,z:jam.cz},atk[0].team),'dentro do raio bloqueia atacantes');ok(!S.jammed({x:jam.cx+2,z:jam.cz},d31.team),'não bloqueia o dono');ok(!S.jammed({x:jam.cx+30,z:jam.cz},atk[0].team),'fora do raio');
  const e=def[2];e.pos.set(jam.cx+1,0,jam.cz);e.spotT=-99;const p1=atk[1];p1.op=S.opById('olho');p1.gadgetN=2;S.useGadget(p1);ok(e.spotT<0,'pulso não revela sob bloqueador');
  const e2=def[3];e2.pos.set(jam.cx+40,0,jam.cz);e2.spotT=-99;p1.gadgetN=2;S.useGadget(p1);ok(e2.spotT>0,'pulso revela fora do bloqueador');}
if(fails.length){console.log('FALHAS:\n'+fails.join('\n'));process.exit(1);}console.log('flashjam OK');
