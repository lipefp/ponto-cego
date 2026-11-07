const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({viewport:{width:640,height:360},offline:true});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});/*v4: boot assíncrono*/await p.waitForTimeout(4000);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(2000);
await p.evaluate(()=>{for(let i=0;i<60*31;i++)__pc.simStep(__pc.SIM_DT);__pc.player.hp=1e6;for(const a of __pc.G.agents||[])if(a!==__pc.player)a.hp=1e6;});
await p.evaluate(()=>{__pc.SAVE.vmSize=1;__pc.VM.noHolster=true;});const views=JSON.parse(process.argv[2]);
for(const [n,x,z,yaw,pitch,y] of views){await p.evaluate(([x,z,yaw,pitch,y])=>{const pl=__pc.player;pl.pos.x=x*3;pl.pos.z=z*3;if(y!=null)pl.pos.y=y;pl.yaw=yaw;pl.pitch=pitch;},[x,z,yaw,pitch,y]);await p.waitForTimeout(1800);await p.screenshot({path:`shots/m_${n}.png`});}
console.log(errs.slice(0,12).join('\n'));await b.close();})();
