const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(4000);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1500);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);__pc.player.hp=1e6;for(const a of __pc.G.agents||[])if(a!==__pc.player)a.hp=1e6;const pl=__pc.player;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;pl.pitch=0;__pc.VM.noHolster=true;});
for(const [pt,lean] of [[1.45,1],[1.45,-1],[-1.45,1],[-1.2,-1],[0,1]]){
  await p.evaluate(([pt,lean])=>{const pl=__pc.player;pl.pitch=pt;pl.yaw=1.2;__pc.INPUT.lean=lean;},[pt,lean]);
  await p.waitForTimeout(2500);
  const r=await p.evaluate(()=>{const c=__pc.camera;c.computeWorldMatrix(true);const m=c.getWorldMatrix();const u=B_up(m);return u;function B_up(m){const a=m.m;return [a[4],a[5],a[6]].map(x=>+x.toFixed(3));}});
  console.log('pitch',pt,'lean',lean,'up',r,r[1]>0?'OK':'FLIP');if(r[1]<=0)process.exitCode=1;}
if(errs.length||process.exitCode)console.log("ERR",errs.join("\n"));
await b.close();})();
