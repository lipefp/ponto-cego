// =====================================================================
// QA — camada de rede (v4): comandos de entrada e snapshots (Node, só src/sim)
// 1) comando: captura → binário (28 B) → decodifica, sem perda relevante
// 2) netStep ≡ simStep: o jogador local por comandos não muda nada
// 3) snapshot → JSON → restaura numa OUTRA simulação → snapshot idêntico,
//    em vários momentos de partidas com bots (preparação, ação, plantio…)
// Uso: node test/net.js [partidas]
// =====================================================================
const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'../src/sim');
const code=fs.readdirSync(dir).sort().map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
const expose='\n;globalThis.S={G,agents,get player(){return player},teams,simStep,netStep,SIM_DT,INPUT,newMatch,startMatch:typeof startMatch==="undefined"?null:startMatch,snapshot,restoreSnapshot,captureCmd,applyCmd,encodeCmd,decodeCmd,NET,WALLS,DOORS,PROPS,projectiles,drone};';
const mk=()=>{const ctx={console,Math,performance,setTimeout,localStorage:undefined};vm.createContext(ctx);vm.runInContext(code+expose,ctx);return ctx.S;};
const N=+process.argv[2]||3;let fails=[];const ok=(c,m)=>{if(!c)fails.push(m);};
/* 1) comandos */
{const A=mk();let maxErr=0;for(let i=0;i<2000;i++){const c={t:i*7,fwd:[-1,0,1][i%3],side:[-1,0,1][(i>>1)%3],lean:[-1,0,1][(i>>2)%3],slot:[null,'p','s'][i%3],b:(i*2654435761)&0xfff,yaw:Math.random()*20-10,pitch:Math.random()*3-1.5,dyaw:Math.random()*6,dpitch:Math.random()-.5};
  const d=A.decodeCmd(A.encodeCmd(c));for(const k of['t','fwd','side','lean','slot','b'])ok(d[k]===c[k],'cmd '+k);maxErr=Math.max(maxErr,Math.abs(d.yaw-c.yaw),Math.abs(d.pitch-c.pitch));}
  ok(maxErr<1e-5,'cmd float '+maxErr);console.log('comandos: 2000 ida-e-volta, 28 bytes, erro máx. de ângulo',maxErr.toExponential(1),'rad');}
/* 2) netStep ≡ simStep (mesma sequência de Math.random: semente fixa nos dois) */
{const seed=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  const run=useNet=>{const S=mk(),r=seed(42);Math.random=r;S.G.autoplay=false;S.newMatch();S.G.phase='prep';
    for(let i=0;i<60*40;i++){S.INPUT.fwd=(i>>6)%3-1;S.INPUT.side=(i>>7)%3-1;S.INPUT.fire=(i%90)<20;S.INPUT.reload=i%400===0;S.player.yaw+=.01;if(useNet)S.netStep(S.SIM_DT);else S.simStep(S.SIM_DT);}
    const snap=JSON.stringify(S.snapshot());return {snap,log:S.NET.log.length};};
  const orig=Math.random;const a=run(false),b=run(true);Math.random=orig;
  ok(a.snap.replace(/"tick":\d+,/,'')===b.snap.replace(/"tick":\d+,/,''),'netStep diverge de simStep');console.log('netStep ≡ simStep em 2400 passos:',a.snap.replace(/"tick":\d+,/,'')===b.snap.replace(/"tick":\d+,/,''),'· comandos no anel',b.log);}
/* 3) snapshots entre simulações */
{let n=0,maxKB=0,tot=0,ms=0;const phases={};
  for(let m=0;m<N;m++){const A=mk(),Bs=mk();A.G.autoplay=true;A.player.bot=true;A.newMatch();A.G.phase='prep';Bs.newMatch();
    for(let i=0;i<60*60*6&&A.G.phase!=='over';i++){A.simStep(A.SIM_DT);
      if(i%611===0){const t=process.hrtime.bigint();const s=A.snapshot(),js=JSON.stringify(s);ms+=Number(process.hrtime.bigint()-t)/1e6;
        Bs.restoreSnapshot(JSON.parse(js));const js2=JSON.stringify(Bs.snapshot());n++;tot+=js.length;maxKB=Math.max(maxKB,js.length/1024);phases[A.G.phase]=(phases[A.G.phase]||0)+1;
        if(js!==js2){let k=0;while(k<js.length&&js[k]===js2[k])k++;fails.push('snapshot diverge: …'+js.slice(Math.max(0,k-80),k+60)+' ≠ '+js2.slice(Math.max(0,k-80),k+60));break;}}}}
  console.log(`snapshots: ${n} restaurados em outra simulação · fases ${JSON.stringify(phases)} · médio ${(tot/n/1024).toFixed(1)} KB, máx. ${maxKB.toFixed(1)} KB (JSON) · ${(ms/n).toFixed(2)} ms cada`);}
if(fails.length){console.log('REDE REPROVADA\n'+fails.slice(0,5).join('\n'));process.exit(1);}console.log('REDE APROVADA');
