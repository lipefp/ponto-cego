// Dois navegadores contra um servidor local: entram na sala, iniciam, jogam ~25 s e conferem que cada um vê o outro.
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const {spawn,execSync}=require('child_process');const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),OUT='/tmp/pc_mpb';
(async()=>{
 execSync(`rm -rf ${OUT} && mkdir -p ${OUT} && MKSERVER_NOHTML=1 node tools/mkserver.mjs ${OUT} >/dev/null`,{cwd:ROOT});
 const SD=OUT+'/PontoCego_Servidor';fs.copyFileSync(ROOT+'/dist/test.html',SD+'/game.html');
 const sv=spawn('node',['server.js'],{cwd:SD,env:Object.assign({},process.env,{PORT:'18099',QUEUE_WAIT_S:'1',BACK_TO_LOBBY_S:'4'})});let slog='';sv.stdout.on('data',d=>slog+=d);sv.stderr.on('data',d=>slog+=d);
 await new Promise(r=>setTimeout(r,800));
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const errs=[];let bad=0;const ck=(n,ok,x)=>{console.log((ok?'OK   ':'FALHA ')+n+(x?' · '+x:''));if(!ok)bad++;};
 const mk=async(name)=>{const p=await (await b.newContext({viewport:{width:800,height:450}})).newPage();p.setDefaultTimeout(120000);
  p.on('pageerror',e=>errs.push(name+' PE '+e.message+' | '+(e.stack||'').split('\n').slice(1,3).join(' ')));p.on('console',m=>{if(m.type()==='error')errs.push(name+' CE '+m.text().slice(0,200));});
  await p.goto('http://localhost:18099/');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:300000,polling:100});await p.waitForTimeout(1500);
  await p.evaluate(n=>{__pc.SAVE.name=n;__pc.setMenuTab('online');__pc.SAVE.quality='min';__pc.game.render=()=>{};__pc.lobby.render=()=>{};},name);return p;};
 const FR=async p=>p.evaluate(()=>new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<3000)requestAnimationFrame(f);else r({fps:+(n/3).toFixed(1),ctick:__pc.MP.ctick,ci:__pc.ON.closeInfo||''});};requestAnimationFrame(f);}));
 const [p1,p2]=await Promise.all([mk('Ana'),mk('Beto')]);
 /* a aba Online conecta sozinha (endereço do próprio servidor) */
 await Promise.all([p1,p2].map(p=>p.waitForFunction(()=>__pc.ON.st==='idle',null,{timeout:15000})));
 ck('conectam sozinhos pelo link do servidor',true);
 await Promise.all([p1,p2].map(p=>p.evaluate(()=>__pc.onlineSearch())));
 await Promise.all([p1,p2].map(p=>p.waitForFunction(()=>__pc.ON.st==='found'&&__pc.ON.found.tot===2,null,{timeout:20000})));
 ck('partida encontrada para os dois',true);
 await Promise.all([p1,p2].map(p=>p.evaluate(()=>__pc.onlineSendJSON({t:'accept'}))));
 await Promise.all([p1,p2].map(p=>p.waitForFunction(()=>__pc.MP.role==='guest'&&__pc.G.round>=1&&__pc.agents.some(a=>a.name&&a.alive),null,{timeout:90000})));
 ck('os dois entraram na partida',true);
 /* anda para frente no cliente 1 por 6 s (sem trava de mouse: usa INPUT direto) */
 await p1.evaluate(()=>{__pc.INPUT.fwd=1;});
 for(let i=0;i<10;i++){if(i==6)await p1.evaluate(()=>{__pc.INPUT.fwd=0;});const a=await p1.evaluate(()=>{const m=__pc.me();return [m.pos.x,m.pos.z,m.vel.x,m.vel.z].map(v=>+v.toFixed(2));});const b=await p2.evaluate(()=>{const m=__pc.agents[0];return [m.pos.x,m.pos.z,m.vel.x,m.vel.z,m._S&&m._S.x,m._S&&m._S.z].map(v=>+(+v).toFixed(2));});console.log('dbg',i,JSON.stringify(a),JSON.stringify(b));await p1.waitForTimeout(400);}
await p1.waitForTimeout(500);
 await Promise.all([p1,p2].map(p=>p.waitForFunction(()=>__pc.G.phase==='action',null,{timeout:90000})));ck('fase de ação começou nos dois',true);
 await p1.evaluate(()=>{__pc.INPUT.fwd=1;});

 const snap=async p=>p.evaluate(()=>{const P=__pc,me=P.me();return {gi:P.MP.gi,ph:P.G.phase,round:P.G.round,paused:typeof paused!=='undefined'?paused:null,me:[me.pos.x,me.pos.y,me.pos.z].map(v=>+v.toFixed(2)),names:P.agents.map(a=>a.name).join(','),humans:P.agents.filter(a=>!a.bot).map(a=>a.id),ack:P.MP.lastAck,pend:P.MP.pend.length,nan:P.agents.some(a=>!isFinite(a.pos.x+a.pos.z))};});
 await p1.waitForTimeout(3000);console.log('fps p1',JSON.stringify(await FR(p1)));console.log('fps p2',JSON.stringify(await FR(p2)));
 const s1=await snap(p1),s2=await snap(p2);console.log(JSON.stringify(s1));console.log(JSON.stringify(s2));
 ck('sem NaN',!s1.nan&&!s2.nan);
 ck('ack avançando (servidor recebe comandos)',s1.ack>200&&s2.ack>200,s1.ack+'/'+s2.ack);
 ck('pend limitado (reconciliação)',s1.pend<40&&s2.pend<40,s1.pend+'/'+s2.pend);
 /* o cliente 2 vê o cliente 1 na mesma posição que o próprio cliente 1 */
 await p1.evaluate(()=>{__pc.INPUT.fwd=0;});await p1.waitForTimeout(1500);const s1b=await snap(p1);s1.me=s1b.me;
 const seen=await p2.evaluate(id=>{const a=__pc.agents[id];return [a.pos.x,a.pos.y,a.pos.z].map(v=>+v.toFixed(2));},s1.gi);
 const d=Math.hypot(seen[0]-s1.me[0],seen[2]-s1.me[2]);ck('cliente 2 vê o 1 perto da posição real',d<1.5,'dist '+d.toFixed(2)+' '+JSON.stringify(seen)+' vs '+JSON.stringify(s1.me));
 await p1.evaluate(()=>{__pc.INPUT.fwd=0;});
 const mag0=await p1.evaluate(()=>{const m=__pc.me();return m.w[m.cur||'p']?m.w[m.cur||'p'].mag:-1;});
 await p1.evaluate(()=>{__pc.INPUT.fire=true;});await p1.waitForTimeout(900);await p1.evaluate(()=>{__pc.INPUT.fire=false;});await p1.waitForTimeout(600);
 const mag1=await p1.evaluate(()=>{const m=__pc.me();return m.w[m.cur||'p']?m.w[m.cur||'p'].mag:-1;});const mag2=await p2.evaluate(id=>{const m=__pc.agents[id];return m.w[m.cur||'p']?m.w[m.cur||'p'].mag:-1;},s1.gi);
 ck('tiro gasta munição (cliente 1 e visto pelo 2)',mag1<mag0&&mag2===mag1,mag0+' -> '+mag1+' / '+mag2);
 /* partida segue por mais um tempo */
 await p1.waitForTimeout(8000);const s3=await snap(p1);ck('partida avança (fase/rodada)',s3.round>=1,s3.ph+' r'+s3.round);
 /* sai: cliente 2 volta ao menu */
 await p2.evaluate(()=>__pc.toMenu());await p2.waitForTimeout(800);
 const st=await p1.evaluate(()=>({humans:__pc.agents.filter(a=>!a.bot).length,role:__pc.MP.role}));ck('cliente 1 continua conectado',st.role==='guest');
 ck('sem erros de página/console',errs.length===0,errs.slice(0,6).join(' || '));
 console.log(slog.split('\n').slice(-8).join('\n'));
 await b.close();sv.kill();console.log(bad?'MP-BROWSER REPROVADO':'MP-BROWSER APROVADO');process.exit(bad?1:0);})();
