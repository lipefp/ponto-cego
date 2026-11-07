const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({viewport:{width:640,height:360},offline:true});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text().slice(0,200));});
const t0=Date.now();await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});/*v4: boot assíncrono*/await p.waitForTimeout(4000);console.log('load',Date.now()-t0,'ms');
await p.screenshot({path:'shots/lobby.png'});
for(const t of (process.argv[2]||'ops,arsenal,xh,opts').split(',')){if(!t)continue;await p.evaluate(t=>__pc.setMenuTab(t),t);await p.waitForTimeout(1500);await p.screenshot({path:`shots/tab_${t}.png`});}
await p.evaluate(()=>__pc.setMenuTab('play'));
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(3000);
await p.screenshot({path:'shots/drone.png'});
await p.evaluate(()=>{for(let i=0;i<60*31;i++)__pc.simStep(__pc.SIM_DT);__pc.player.hp=1e6;});await p.waitForTimeout(2500);
await p.screenshot({path:'shots/action.png'});
await p.evaluate(()=>{const pl=__pc.player;pl.pos.x=17.9*3;pl.pos.z=9.5*3;pl.yaw=-Math.PI/2;pl.pitch=-.05;});await p.waitForTimeout(1500);
await p.screenshot({path:'shots/inside.png'});
console.log(JSON.stringify(await p.evaluate(()=>({phase:__pc.G.phase,round:__pc.G.round,fps:__pc.game.getEngine().getFps().toFixed(1)}))));
console.log(errs.slice(0,12).join('\n'));await b.close();})();
