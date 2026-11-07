// Fotos da recarga: node test/shots_reload.js id1,id2 0.2,0.4,0.6,0.8  (env VAR=sg:vert para empunhadura, W=largura)
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const W=+(process.env.W||960),H=Math.round(W*9/16);
const p=await (await b.newContext({viewport:{width:W,height:H},offline:true})).newPage();p.setDefaultTimeout(600000);p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;pl.yaw=3.6;pl.pitch=0;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();});
const ids=(process.argv[2]||'smg').split(','),fr=(process.argv[3]||'0,.25,.5,.75').split(',').map(Number),grip=process.env.GRIP||'none',empty=process.env.EMPTY==='1';
const id=process.argv[2]||'dmr';
const r=await p.evaluate(async(id)=>{const P=__pc,pl=P.player,W=P.WEAPONS[id],slot=W.slot,out=[];
 const step=dt=>{if(P.G.phase!=='over'){P.G.phase='action';P.G.phaseT=100;}P.simStep(P.SIM_DT);P.updateCamera(dt);P.updateVM(dt);};
 pl.w[slot]={id,mag:W.mag-8,res:99};pl.cur=slot;P.INPUT.ads=false;for(let i=0;i<100;i++)step(1/60);
 const rig=P.FPV.cur;const g=(i)=>[rig.GP[i*3],rig.GP[i*3+1],rig.GP[i*3+2]].map(v=>+v.toFixed(2));
 P.INPUT.reload=true;step(1/60);P.INPUT.reload=false;
 for(let k=0;k<Math.round(W.reload*60);k++){step(1/60);if(k%12==0)out.push({k,clip:rig.clipName,t:+rig.clipT.toFixed(2),LA:g(rig.LA),LF:g(rig.LF),LH:g(rig.LH),dFore:rig.dFore&&rig.dFore.map(v=>+v.toFixed(2)),magP:rig.magP&&Array.from(rig.magP).map(v=>+v.toFixed(2)),r0:rig.mg&&rig.mg[0]&&Array.from(rig.mg[0].a.ref.p).map(v=>+v.toFixed(2)),lh0:rig.lh0&&rig.lh0.map(v=>+v.toFixed(2))});}
 return out;},id);
for(const x of r)console.log(JSON.stringify(x));
await b.close();})();
