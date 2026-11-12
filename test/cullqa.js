// Bonecos escondidos atrás de parede e resolução automática. Uso: node tools/build.mjs --test && node test/cullqa.js
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(900000);const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*90&&__pc.G.phase!=='action';i++)__pc.simStep(__pc.SIM_DT);__pc.player.hp=1e6;});
await p.waitForTimeout(1500);
let bad=0;const ok=(c,m)=>{console.log((c?'OK   ':'FALHA ')+m);if(!c)bad++;};
// acha um ponto à vista (>= 8 m) e um ponto totalmente tapado (>= 6 m) e segura um inimigo em cada um
const spots=await p.evaluate(()=>{const P=__pc.player,V=__pc.V3,eye=new V(P.pos.x,P.pos.y+1.5,P.pos.z);let vis=null,hid=null;
 for(let r=8;r<=26&&!(vis&&hid);r+=2)for(let k=0;k<24;k++){const a=k*Math.PI/12,x=P.pos.x+Math.cos(a)*r,z=P.pos.z+Math.sin(a)*r;
  const pts=[[0,1.55,0],[0,1,0],[0,.15,0],[.4,1,0],[-.4,1,0],[0,1,.4],[0,1,-.4]].map(o=>__pc.clearSight(eye,new V(x+o[0],P.pos.y+o[1],z+o[2])));
  if(pts.every(v=>v)&&!vis)vis=[x,z];if(pts.every(v=>!v)&&!hid&&r>=6)hid=[x,z];}
 return {vis,hid,y:P.pos.y};});
ok(spots.vis&&spots.hid,'achou um ponto à vista e um tapado');
const hold=async(xz,ms)=>{const t0=Date.now();let st=null;while(Date.now()-t0<ms){st=await p.evaluate(([x,z])=>{const e=__pc.agents.find(a=>a.team!==__pc.player.team&&a.alive);e.pos.x=x;e.pos.z=z;e.pos.y=__pc.player.pos.y;e.vel.x=e.vel.z=0;const pl=__pc.player;pl.vel.x=pl.vel.z=0;const ch=__pc.CH.get(e);return ch&&ch.root?ch.root.isEnabled():null;},xz);await p.waitForTimeout(30);}return st;};
if(spots.vis&&spots.hid){
 ok(await hold(spots.vis,6000)===true,'boneco à vista é desenhado');
 ok(await hold(spots.hid,9000)===false,'boneco totalmente tapado deixa de ser desenhado');
 ok(await hold(spots.vis,5000)===true,'voltou à vista: reaparece');}
// resolução automática: 40 qps por 4 s baixa; 60 qps por 40 s volta ao normal
const r=await p.evaluate(()=>{const A=__pc.AUTO,base=__pc.engine.getHardwareScalingLevel();for(let i=0;i<160;i++)__pc.autoRes(1/40);const k1=A.k,s1=__pc.engine.getHardwareScalingLevel();for(let i=0;i<60*40;i++)__pc.autoRes(1/60);return {base,k1,s1,k2:A.k,s2:__pc.engine.getHardwareScalingLevel()};});
ok(r.k1>1.2&&r.s1>r.base,'40 quadros/s: resolução baixa ('+r.k1.toFixed(2)+'x)');
ok(Math.abs(r.k2-1)<0.01&&Math.abs(r.s2-r.base)<0.01,'60 quadros/s por 40 s: volta ao normal ('+r.k2.toFixed(2)+'x)');
ok(!errs.length,'sem erros de página'+(errs.length?': '+errs[0]:''));
console.log(bad?'FALHAS: '+bad:'CULLQA APROVADO');await b.close();process.exit(bad?1:0);})();
