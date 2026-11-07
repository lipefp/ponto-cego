// Teste do servidor dedicado com clientes falsos (WebSocket). Uso: node test/mp_server.js
// A: 4 humanos, tempo real, 45 s — sala, início, comandos, snapshots, saída no meio da partida.
// B: 1 humano com a simulação acelerada — a partida termina e a sala volta ao lobby.
const {spawn,execSync}=require('child_process'),path=require('path'),http=require('http');
const ROOT=path.join(__dirname,'..'),OUT=require('path').join(require('os').tmpdir(),'pc-mpout');
execSync('MKSERVER_NOHTML=1 node tools/mkserver.mjs '+OUT,{cwd:ROOT,stdio:'pipe'});
const SD=path.join(OUT,'PontoCego_Servidor');const WS=require(path.join(SD,'node_modules/ws'));
let bad=0;const ok=(c,m)=>{console.log((c?'OK   ':'FALHA ')+m);if(!c)bad++;};
const enc=(t,fwd,side,lean,slot,b,yaw,pitch)=>{const u=new Uint8Array(28),d=new DataView(u.buffer);d.setUint32(0,t,true);d.setInt8(4,fwd);d.setInt8(5,side);d.setInt8(6,lean);d.setUint8(7,slot);d.setUint16(8,b,true);d.setFloat32(12,yaw,true);d.setFloat32(16,pitch,true);return u;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const getJSON=(port,p)=>new Promise((res,rej)=>http.get({host:'127.0.0.1',port,path:p},r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>res(JSON.parse(b)));}).on('error',rej));
function startServer(port,env){const p=spawn('node',['server.js'],{cwd:SD,env:Object.assign({},process.env,{PORT:String(port)},env)});let out='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>out+=d);p.log=()=>out;return p;}
function client(port,name){return new Promise((res,rej)=>{
  const ws=new WS('ws://127.0.0.1:'+port+'/ws');const c={ws,name,msgs:[],pk:0,snaps:0,bytes:0,lastAck:0,acks:[],me:-1,started:false,back:false,room:null,lastSnap:null,evs:{}};
  ws.on('open',()=>{ws.send(JSON.stringify({t:'hello',proto:2,info:{name,atkOp:'xx',defOp:'yy'}}));res(c);});
  ws.on('message',(data,isBin)=>{const s=data.toString();c.bytes+=s.length;const m=JSON.parse(s);
    if(m.t==='welcome')c.welcome=true;if(m.t==='found'){c.found=m;if(!c.noAccept&&!m.me)ws.send(JSON.stringify({t:'accept'}));}if(m.t==='queued'){c.queued=true;c.queuedN=(c.queuedN||0)+1;}if(m.t==='start'){c.started=true;c.gi=m.gi;c.me=m.gi;}if(m.t==='back')c.back=true;if(m.t==='error')c.err=m.msg;
    if(m.t==='pk'){c.pk++;if(m.h){c.lastAck=m.h.ack;}if(m.p.s){c.snaps++;const S=c.lastSnap||(c.lastSnap={agents:Array.from({length:10},()=>({})),G:{}});Object.assign(S.G,m.p.s.G);m.p.s.agents.forEach((a,i)=>Object.assign(S.agents[i],a));}for(const e of m.p.e||[])c.evs[e.n]=(c.evs[e.n]||0)+1;}});
  ws.on('error',rej);});}
(async()=>{
  /* ---------- A ---------- */
  const PA=18081,srv=startServer(PA,{QUEUE_WAIT_S:'2',ACCEPT_S:'30'});await sleep(1500);
  const st0=await getJSON(PA,'/status');ok(st0.online===0&&st0.matches===0,'status inicial: 0 online, 0 partidas');
  const cs=[];for(const n of['Ana','Beto','Caio','Duda'])cs.push(await client(PA,n));await sleep(400);
  ok(cs.every(c=>c.welcome),'todos recebem welcome');
  cs.forEach(c=>c.ws.send(JSON.stringify({t:'queue'})));await sleep(600);
  ok(cs.every(c=>c.queued),'todos entram na fila');ok(!cs.some(c=>c.found),'fila espera antes de juntar (QUEUE_WAIT_S=2)');
  await sleep(2500);
  ok(cs.every(c=>c.found&&c.found.tot===4),'partida encontrada para os 4 ('+cs.map(c=>c.found&&c.found.tot).join(',')+')');
  await sleep(1000);
  ok(cs.every(c=>c.started),'todos aceitaram e receberam start');
  const teams=cs.map(c=>c.me<5?'A':'B');ok(teams.filter(t=>t==='A').length===2,'times balanceados 2 x 2 ('+teams.join('')+')');
  /* segundo grupo ao mesmo tempo: outra partida, com outra simulação */
  const late=await client(PA,'Atrasado');await sleep(200);late.ws.send(JSON.stringify({t:'queue'}));await sleep(4500);
  ok(late.started,'quem entra depois cai em OUTRA partida ('+(late.err||'ok')+')');
  const stm=await getJSON(PA,'/status');ok(stm.matches===2&&stm.playing===5,'duas partidas ao mesmo tempo, 5 jogando ('+JSON.stringify(stm)+')');
  late.ws.send(JSON.stringify({t:'leavematch'}));await sleep(500);const stl=await getJSON(PA,'/status');ok(stl.matches===1&&stl.online===5,'leavematch encerra a partida vazia, conexão segue ('+JSON.stringify(stl)+')');
  /* recusa: dois jogadores, um não aceita; quem aceitou volta para a fila */
  const r1=await client(PA,'Aceita'),r2=await client(PA,'Recusa');r2.noAccept=true;await sleep(200);
  r1.ws.send(JSON.stringify({t:'queue'}));r2.ws.send(JSON.stringify({t:'queue'}));await sleep(3500);
  ok(r1.found&&r2.found&&!r1.started,'partida encontrada para os dois, ainda sem início');
  r2.ws.send(JSON.stringify({t:'decline'}));await sleep(600);
  ok(r1.queuedN>=2,'quem aceitou volta à fila quando o outro recusa');
  r1.noAccept=true;await sleep(1500);r1.ws.close();r2.ws.close();late.ws.close();await sleep(300);
  /* cada cliente manda comandos a 60 Hz: anda para frente, gira devagar, atira de vez em quando */
  const t0=Date.now();const timers=cs.map((c,i)=>{let t=0,yaw=0;return setInterval(()=>{t++;yaw+=.004*(i%2?1:-1);const b=(t%120<30?16:0);if(c.ws.readyState===1)c.ws.send(enc(t,1,0,0,0,b,yaw,0));},1000/60);});
  await sleep(48000);
  timers.forEach(clearInterval);
  const secs=(Date.now()-t0)/1000;
  for(const c of cs){ok(c.snaps>secs*15,c.name+': snapshots ~20 Hz ('+c.snaps+' em '+secs.toFixed(0)+' s)');}
  ok(cs.every(c=>c.lastAck>secs*40),'ack dos comandos avança ('+cs.map(c=>c.lastAck).join(',')+')');
  const kb=cs.map(c=>c.bytes/secs/1024);console.log('tráfego por cliente (KB/s): '+kb.map(x=>x.toFixed(0)).join(' '));ok(Math.max(...kb)<400,'tráfego < 400 KB/s por cliente');
  const S=cs[0].lastSnap;ok(S&&S.agents.length===10,'snapshot com 10 agentes');
  const A=S.agents;const mine=cs.map(c=>A[c.gi]);
  ok(mine.every(a=>a.isPlayer===true&&a.bot===false),'agentes dos humanos: isPlayer/bot corretos');
  ok(S.G.phase==='prep'||S.G.phase==='action','fase da partida: '+S.G.phase);
  ok(cs[0].evs.roundStart>=1,'evento roundStart recebido');
  const moved=mine.map((a,i)=>Math.hypot(a.pos.$v[0]-0,a.pos.$v[2]-0));console.log('posições: '+mine.map(a=>a.pos.$v.map(v=>v.toFixed(1)).join(',')).join(' | '));
  /* sai um no meio da partida */
  cs[3].ws.close();await sleep(600);
  const st1=await getJSON(PA,'/status');ok(st1.playing===3&&st1.matches===1,'saída no meio: 3 jogadores, partida segue');
  const A2=cs[0].lastSnap.agents;ok(A2[cs[3].gi].alive===false,'agente de quem saiu morre');
  cs.slice(0,3).forEach(c=>c.ws.close());await sleep(800);
  const st2=await getJSON(PA,'/status');ok(st2.matches===0&&st2.online===0,'todos saíram: nenhuma partida');
  console.log(srv.log().split('\n').slice(-12).join('\n'));srv.kill();await sleep(300);
  /* ---------- B ---------- */
  const PB=18082,srv2=startServer(PB,{SIM_SPEED:'30',BACK_TO_LOBBY_S:'1',QUEUE_WAIT_S:'0'});await sleep(1500);
  const h=await client(PB,'Solo');await sleep(300);h.ws.send(JSON.stringify({t:'queue'}));
  const tm=setInterval(()=>{if(h.ws.readyState===1)h.ws.send(enc(Math.floor(Date.now()/16)&0xffffff,1,0,0,0,0,0,0));},16);
  const t1=Date.now();while(!h.back&&Date.now()-t1<170000)await sleep(500);clearInterval(tm);
  ok(h.back,'partida acelerada termina e o jogador volta ao menu ('+((Date.now()-t1)/1000).toFixed(0)+' s)');
  ok((h.evs.roundEnd||0)>=4,'rodadas encerradas: '+(h.evs.roundEnd||0)+' · matchOver '+(h.evs.matchOver||0));
  const st3=await getJSON(PB,'/status');ok(st3.matches===0&&st3.online===1,'status: nenhuma partida após o fim');
  console.log(srv2.log().split('\n').slice(-6).join('\n'));srv2.kill();
  console.log(bad?'MP SERVIDOR REPROVADO ('+bad+')':'MP SERVIDOR APROVADO');process.exit(bad?1:0);
})().catch(e=>{console.error('ERRO',e);process.exit(1);});
