// fotos com câmera livre no cenário (para revisar modelos do mapa)
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);/*v4: máquina compartilhada*/
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.type()+' '+m.text().slice(0,160));});
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});/*v4: boot assíncrono*/await p.waitForTimeout(4000);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));for(let i=0;i<60*31;i++)__pc.simStep(__pc.SIM_DT);__pc.player.alive=false;__pc.HUD&&0;});
const shots=JSON.parse(process.argv[2]);
for(const [n,pos,tgt] of shots){await p.evaluate(([pos,tgt])=>{const P=__pc,E=P.engine,c=P.camera;E.stopRenderLoop();E.runRenderLoop(()=>{c.position.set(...pos);const d=[tgt[0]-pos[0],tgt[1]-pos[1],tgt[2]-pos[2]];c.rotation.set(Math.atan2(d[1],Math.hypot(d[0],d[2])),Math.atan2(-d[0],-d[2]),0);c.fov=1;P.game.render();});},[pos,tgt]);await p.waitForTimeout(2500);await p.screenshot({path:`shots/top_${n}.png`});}
console.log(errs.slice(0,10).join('\n'));await b.close();})();
