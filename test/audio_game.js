// Fumaça do áudio dentro do jogo real (dist/test.html): contexto criado, ganchos instalados,
// sons do jogo chamados com agentes/mapa de verdade (spatial + oclusão), custo por chamada, zero erros.
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const p=await (await b.newContext({viewport:{width:640,height:360}})).newPage();p.setDefaultTimeout(600000);const errs=[];p.on('pageerror',e=>errs.push(e.message+' | '+(e.stack||'').split('\n').slice(1,4).join(' ')));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(2000);
await p.evaluate(()=>{__pc.SAVE.side='atk';__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1500);
const r=await p.evaluate(async()=>{const P=__pc,A=window.__pcAudio,out={};
  for(let i=0;i<2400;i++)P.simStep(P.SIM_DT);A.tick();A.tick();out.state=A.state();
  const bots=P.agents.filter(a=>a.alive&&a!==P.player);bots.forEach((b,i)=>{b.pos.x=P.player.pos.x+4+i*1.5;b.pos.z=P.player.pos.z+3;}),ids=Object.keys(P.WEAPONS);
  const T=(n,f,R=60)=>{const a=[];for(let i=0;i<R;i++){const t0=performance.now();f(i);a.push(performance.now()-t0);}a.sort((x,y)=>x-y);out[n]={med:+a[R>>1].toFixed(3),p95:+a[Math.floor(R*.95)].toFixed(3),max:+a[R-1].toFixed(3)};};
  T('gun_me',i=>A.play('gun',P.player.pos,{w:ids[i%ids.length],me:true}));
  T('gun_bot',i=>{const b=bots[i%bots.length];A.play('gun',b.pos,{w:ids[i%ids.length]});});
  T('step_me',()=>A.play('step',P.player.pos,{me:true}));T('step_bot',i=>{const b=bots[i%bots.length];A.play('step',b.pos,{});});
  T('impact',i=>A.play('impact',bots[i%bots.length].pos,{kind:['hard','wood','metal','flesh','drywall','glass'][i%6]}));
  T('reload_bot',i=>A.play('reload',bots[i%bots.length].pos,{w:'rifle',far:true}));T('boom',i=>A.play('boom',bots[i%bots.length].pos,{}),20);T('glass',i=>A.play('glass',bots[i%bots.length].pos,{}),20);
  // ganchos reais do jogo
  const H=P.HOOK||null;out.hooksInstalled=A.state().hooks;
  await new Promise(r=>setTimeout(r,500));return out;});
console.log(JSON.stringify(r,null,1));console.log('erros JS:',errs.length?errs.join('\n'):'nenhum');
const ok=r.state.ac&&errs.length===0&&Object.values(r).filter(v=>v&&v.med!==undefined).every(v=>v.med<2.5);console.log(ok?'ÁUDIO NO JOGO OK':'ÁUDIO NO JOGO COM PROBLEMA');await b.close();process.exit(ok?0:1);})();
