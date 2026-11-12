// Partida inteira (servidor acelerado): fim de partida, tela final, volta à sala e segunda partida.
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const {spawn,execSync}=require('child_process');const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),OUT='/tmp/pc_mpe';
(async()=>{
 execSync(`rm -rf ${OUT} && mkdir -p ${OUT} && MKSERVER_NOHTML=1 node tools/mkserver.mjs ${OUT} >/dev/null`,{cwd:ROOT});
 const SD=OUT+'/PontoCego_Servidor';fs.copyFileSync(ROOT+'/dist/test.html',SD+'/game.html');
 const sv=spawn('node',['server.js'],{cwd:SD,env:Object.assign({},process.env,{PORT:'18098',QUEUE_WAIT_S:'1',BACK_TO_LOBBY_S:'3',SIM_SPEED:'6'})});let slog='';sv.stdout.on('data',d=>slog+=d);sv.stderr.on('data',d=>slog+=d);
 await new Promise(r=>setTimeout(r,800));
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const errs=[];let bad=0;const ck=(n,ok,x)=>{console.log((ok?'OK   ':'FALHA ')+n+(x?' · '+x:''));if(!ok)bad++;};
 const mk=async(name)=>{const p=await (await b.newContext({viewport:{width:640,height:360}})).newPage();p.setDefaultTimeout(120000);
  p.on('pageerror',e=>errs.push(name+' PE '+e.message+' | '+(e.stack||'').split('\n').slice(1,3).join(' ')));p.on('console',m=>{if(m.type()==='error')errs.push(name+' CE '+m.text().slice(0,200));});
  await p.goto('http://localhost:18098/');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:300000,polling:100});await p.waitForTimeout(1500);
  await p.evaluate(n=>{__pc.SAVE.name=n;__pc.setMenuTab('online');__pc.SAVE.quality='min';__pc.game.render=()=>{};__pc.lobby.render=()=>{};},name);return p;};
 const [p1,p2]=await Promise.all([mk('Ana'),mk('Beto')]);
 await Promise.all([p1,p2].map(p=>p.waitForFunction(()=>__pc.ON.st==='idle',null,{timeout:15000})));
 for(let round=1;round<=2;round++){
  await Promise.all([p1,p2].map(p=>p.evaluate(()=>__pc.onlineSearch())));
  await Promise.all([p1,p2].map(p=>p.waitForFunction(()=>__pc.ON.st==='found'&&__pc.ON.found.tot===2,null,{timeout:20000})));
  await Promise.all([p1,p2].map(p=>p.evaluate(()=>__pc.onlineSendJSON({t:'accept'}))));
  await Promise.all([p1,p2].map(p=>p.waitForFunction(()=>__pc.MP.role==='guest'&&__pc.G.round>=1,null,{timeout:30000})));
  ck('partida '+round+' iniciou',true);
  await Promise.all([p1,p2].map(p=>p.waitForFunction(()=>__pc.G.phase==='over',null,{timeout:420000,polling:500})));
  const o=await p1.evaluate(()=>({sc:__pc.teams.A.score+'-'+__pc.teams.B.score,over:__pc.HUD?undefined:undefined}));
  ck('partida '+round+' terminou nos dois',true,o.sc);
  await Promise.all([p1,p2].map(p=>p.waitForFunction(()=>__pc.MP.role===null&&__pc.G.phase==='menu',null,{timeout:30000})));
  const r=await p1.evaluate(()=>({st:__pc.ON.st,ws:__pc.ON.ws&&__pc.ON.ws.readyState}));
  ck('voltou ao menu Online, conectado',r.st==='idle'&&r.ws===1,JSON.stringify(r));
 }
 ck('sem erros de página/console',errs.length===0,errs.slice(0,6).join(' || '));
 console.log(slog.split('\n').slice(-8).join('\n'));
 await b.close();sv.kill();console.log(bad?'MP-END REPROVADO':'MP-END APROVADO');process.exit(bad?1:0);})();
