// Teste do carregador v4 + física + snapshot no navegador.
// Uso: node test/boot.js [arquivo.html] [vezes]   (padrão dist/test.html, 3 cargas)
// Mede: tempo até o jogo pronto (__pc), até os modelos (ASSETS.ready), etapas do boot; erros de JS;
// e, numa partida, estilhaços/cartuchos físicos, snapshot e comandos.
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const path=require('path');
const file=path.resolve(process.argv[2]||'dist/test.html'),N=+process.argv[3]||3;
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const res=[];let fail=0;
for(let r=0;r<N;r++){
  const ctx=await b.newContext({viewport:{width:640,height:360},offline:true});const p=await ctx.newPage();p.setDefaultTimeout(600000);
  const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n').slice(1,3).join(' ')));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push('C'+m.type()[0]+' '+m.text().slice(0,200));});
  const t0=Date.now();await p.goto('file://'+file);
  await p.waitForFunction(()=>window.__pc,null,{timeout:90000,polling:20});const tGame=Date.now()-t0;
  await p.waitForFunction(()=>window.__pc.ASSETS.ready||window.__pc.ASSETS.failed,null,{timeout:90000,polling:20});const tAssets=Date.now()-t0;
  const boot=await p.evaluate(()=>window.__pcBoot||null);
  const o={tGame,tAssets,boot:boot&&boot.t,havok:boot&&boot.havok,errs:errs.slice(0,8)};
  if(r===N-1){   /* partida: física e rede */
    o.match=await p.evaluate(async()=>{const P=window.__pc,wait=ms=>new Promise(r=>setTimeout(r,ms));
      P.startMatch();document.dispatchEvent(new Event('pointerlockerror'));for(let k=0;k<60*31;k++)P.simStep(P.SIM_DT);P.player.hp=1e6;
      const out={phase:P.G.phase,phys:!!P.PHYS};
      if(!P.PHYS)return out;
      /* quebra uma parede fina inteira e uma porta: estilhaços com colisão */
      const w=P.WALLS.find(w=>!w.reinforced);for(let i=0;i<16;i++)w.p[i]=0;window.__pcHook=1;
      P.PHYS.refreshStruct(w);
      const c={x:w.x*3+1.5,y:1.6,z:w.z*3+1.5};
      for(let i=0;i<3;i++)P.PHYS.debris3(c,16,{r:.8,g:.78,b:.7},5);
      /* cartuchos: jogador atira 10 vezes */
      for(let i=0;i<10;i++)P.PHYS.casing({x:P.player.pos.x,y:1.5,z:P.player.pos.z},{x:1,y:0,z:0},{x:0,y:1,z:0},P.player.vel);
      const s0=P.PHYS.stats();
      await wait(2500);
      const deb=P.PHYS.debris.slots.filter(s=>s.on).map(s=>s.node.position);
      const minY=Math.min(...deb.map(p=>p.y)),below=deb.filter(p=>p.y<-.05).length,maxY=Math.max(...deb.map(p=>p.y));
      const cas=P.PHYS.casings.slots.filter(s=>s.on).map(s=>s.node.position);
      out.stats=s0;out.debrisAfter=deb.length;out.debrisMinY=+minY.toFixed(3);out.debrisMaxY=+maxY.toFixed(3);out.debrisBelowFloor=below;
      out.casingsY=cas.length?+Math.max(...cas.map(p=>p.y)).toFixed(3):null;
      /* snapshot e comandos */
      const t1=performance.now();const sn=P.snapshot();const js=JSON.stringify(sn);const tSnap=performance.now()-t1;
      P.restoreSnapshot(JSON.parse(js));const js2=JSON.stringify(P.snapshot());
      const cmd=P.captureCmd(123);const rt=P.decodeCmd(P.encodeCmd(cmd));
      out.snapKB=+(js.length/1024).toFixed(1);out.snapMs=+tSnap.toFixed(2);out.snapRoundTrip=js===js2;out.cmdBytes=P.encodeCmd(cmd).length;out.cmdOk=rt.t===123&&rt.b===cmd.b&&Math.abs(rt.yaw-cmd.yaw)<1e-6;
      out.engine=P.ENGINE_INFO;
      out.drawCalls=P.game.getEngine()._drawCalls?P.game.getEngine()._drawCalls.current:null;
      return out;});
  }
  res.push(o);await ctx.close();
}
await b.close();
for(const o of res)console.log(JSON.stringify(o));
const med=k=>{const v=res.map(o=>o[k]).sort((a,b)=>a-b);return v[v.length>>1];};
console.log('MEDIANA: jogo pronto',med('tGame'),'ms · modelos prontos',med('tAssets'),'ms');
const last=res[res.length-1];if(last.errs.some(e=>e.startsWith('PE')))fail=1;
if(last.match&&last.match.phys&&!(last.match.debrisBelowFloor===0&&last.match.snapRoundTrip&&last.match.cmdOk))fail=1;
console.log(fail?'BOOT REPROVADO':'BOOT OK');process.exit(fail);
})();
