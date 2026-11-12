// Cache persistente (IndexedDB) do boot v4: 1ª carga gera texturas/look map e grava; 2ª lê do cache.
// Uso: node test/cache.js  → tempos de geração (surf, lookmap, game) nas duas cargas e acertos do cache.
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs'),os=require('os'),path=require('path');
(async()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pc-cache-'));const out=[];
for(let r=0;r<2;r++){const ctx=await chromium.launchPersistentContext(dir,{args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files'],viewport:{width:640,height:360}});
  const p=ctx.pages()[0]||await ctx.newPage();p.setDefaultTimeout(600000);const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&__pc.ASSETS.ready,null,{polling:100});
  await p.waitForTimeout(4500);   /* o boot grava o cache 3 s depois da carga */
  const o=await p.evaluate(()=>({prof:Object.fromEntries(Object.entries(window.__pcProf||{}).map(([k,v])=>[k,Math.round(v)])),game:__pcBoot.t.game-__pcBoot.t.havok,cache:__pcBoot.cache}));o.errs=errs;out.push(o);await ctx.close();}
fs.rmSync(dir,{recursive:true,force:true});
for(const o of out)console.log(JSON.stringify(o));
const ok=out[1].cache&&out[1].cache.hits>=10&&out[1].cache.miss===0&&!out.some(o=>o.errs.length);
console.log(ok?'CACHE OK':'CACHE REPROVADO');process.exit(ok?0:1);})();
