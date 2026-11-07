const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const id=process.env.ID||'rifle',N=+(process.env.N||8);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:420},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(([id])=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;pl.pitch=0;const slot=__pc.WEAPONS[id].slot;pl.w[slot]={id,mag:30,res:90};pl.cur=slot;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();},[id]);
await p.waitForTimeout(300);
const dur=await p.evaluate(()=>{const P=__pc;for(let i=0;i<40;i++){P.updateCamera(1/60);P.updateVM(1/60);}return P.FPV.cur.clips[P.FPV_CLIPS[P.FPV.cur.k].throw].dur;});
const KIND=process.env.KIND;
if(KIND){await p.evaluate(K=>{const P=__pc,pl=P.player;pl.op=Object.assign({},pl.op,{gadget:K});pl.gadgetN=3;for(let i=0;i<3;i++){P.updateCamera(1/60);P.updateVM(1/60);}pl.gadgetN=2;},KIND);}
for(let k=0;k<N;k++){const t=dur*k/(N-1)*.999;await p.evaluate(([t,real,dur,N])=>{const P=__pc;if(!real)P.VM.force={st:'throw',t};else{for(let i=0;i<Math.round(.6*dur/(N-1)*60/1.5);i++){P.updateCamera(1/60);P.updateVM(1/60);}}if(!real)for(let i=0;i<6;i++){P.updateCamera(1/60);P.updateVM(1/60);}P.game.render();},[t,!!KIND,dur,N]);await p.screenshot({path:`shots/thr_${KIND||id}_${k}.png`});}
await b.close();})();
