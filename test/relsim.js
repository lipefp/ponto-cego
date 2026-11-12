// recarga guiada pela simulação (como no jogo), com tempo fixo; uso: node test/relsim.js <arma> <slot> '<passos s>' [VW VH] [move]
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const wid=process.argv[2]||'pistol',slot=process.argv[3]||'s',times=JSON.parse(process.argv[4]||'[0.3,0.6,0.9,1.2,1.5]'),VW=+(process.argv[5]||840),VH=+(process.argv[6]||635),mv=process.argv[7]||'';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:VW,height:VH},offline:true})).newPage();p.setDefaultTimeout(600000);const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(3000);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1500);
await p.evaluate(([w,s])=>{for(let i=0;i<60*31;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;pl.pitch=0;__pc.VM.noHolster=true;pl.cur=s;pl.w[s].id=w;pl.w[s].mag=2;__pc.engine.stopRenderLoop();},[wid,slot]);
const step=async(dt)=>p.evaluate(dt=>{const P=__pc;let n=Math.round(dt/P.SIM_DT);for(let i=0;i<n;i++)P.simStep(P.SIM_DT);P.updateCamera(dt);P.updateVM(dt);P.game.render();},dt);
for(let i=0;i<30;i++)await step(1/36);
if(mv==='move')await p.evaluate(()=>{__pc.INPUT.fwd=1;});
await p.evaluate(()=>{__pc.INPUT.reload=true;});await step(1/36);await p.evaluate(()=>{__pc.INPUT.reload=false;});
let t=1/36;for(const T of times){while(t<T){await step(1/36);t+=1/36;}await p.screenshot({path:`shots/rs_${wid}_${T}.png`});console.log(T);}
console.log(errs.join('\n'));await b.close();})();
