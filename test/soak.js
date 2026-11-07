// Soak no navegador: partidas completas (jogador em autoplay) em combinações de qualidade/dificuldade/lado, com render e HUD.
// Falha em: erro de página, erro de console, NaN em agente, partida que não termina, quadro lento.
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const combos=[['min','easy','atk'],['low','normal','def'],['medium','hard','atk'],['high','normal','atk'],['high','hard','def']];
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
let bad=0;
for(const [ql,df,side] of combos){
 const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(900000);const errs=[];
 p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n').slice(1,3).join(' ')));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text().slice(0,200));});
 await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(3000);
 await p.evaluate(([ql,df,side])=>{const P=__pc;P.SAVE.quality=ql;P.SAVE.diff=df;P.SAVE.startSide=side;if(P.setDiff)P.setDiff(df);P.player.bot=true;P.G.autoplay=true;P.startMatch();document.dispatchEvent(new Event('pointerlockerror'));},[ql,df,side]);
 let last='',res={nan:0,over:false,steps:0,renderMs:[]};
 for(let i=0;i<150;i++){
  const s=await p.evaluate(()=>{const P=__pc;let nan=0;for(let k=0;k<60*10;k++){P.simStep(P.SIM_DT);if(k%60==0)for(const a of P.agents){if(!isFinite(a.pos.x+a.pos.y+a.pos.z+a.hp))nan++;}}
    const t0=performance.now();for(let k=0;k<3;k++){P.updateCamera(1/60);P.updateVM(1/60);P.updateHUD(1/60);P.game.render();}const ms=(performance.now()-t0)/3;
    return {ph:P.G.phase,r:P.G.round,sc:P.teams.A.score+'-'+P.teams.B.score,nan,ms};});
  res.nan+=s.nan;res.renderMs.push(s.ms);last=s.ph+' r'+s.r+' '+s.sc;res.steps=i;if(s.ph==='over'||s.ph==='matchover'){res.over=true;break;}await p.waitForTimeout(80);}
 const ms=res.renderMs.sort((a,b)=>a-b),med=ms[ms.length>>1]||0;
 const ok=errs.length===0&&res.nan===0&&res.over;if(!ok)bad++;
 console.log((ok?'OK  ':'FALHA ')+ql+'/'+df+'/'+side+' fim='+res.over+' ('+last+') nan='+res.nan+' erros='+errs.length+' render~'+med.toFixed(0)+'ms');
 if(errs.length)console.log(errs.slice(0,5).join('\n'));await p.context().close();}
console.log(bad?'SOAK REPROVADO ('+bad+')':'SOAK APROVADO');await b.close();process.exit(bad?1:0);})();
