// Contato de TODAS as armas na mão: quadril, mirando e recarregando (meio da animação) — gera PNGs por arma em OUT
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const [VW,VH]=(process.env.VP||'640x360').split('x').map(Number);
const p=await (await b.newContext({viewport:{width:VW,height:VH},offline:true})).newPage();p.setDefaultTimeout(900000);const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;for(const a of __pc.agents)if(a!==pl)a.hp=1e6;pl.pos.x=40;pl.pos.z=28;__pc.VM.noHolster=true;__pc.drone.active=false;__pc.drone.alive=false;__pc.engine.stopRenderLoop();__pc.G.phase='action';});
const out=process.env.OUT||'.';const ids=process.env.IDS?process.env.IDS.split(','):await p.evaluate(()=>__pc.WLIST);
for(const id of ids){for(const st of (process.env.STS||'hip,ads,rel,fire').split(',')){
  await p.evaluate(([id,st])=>{const P=__pc,pl=P.player,w=P.WEAPONS[id],slot=w.slot;pl.w[slot]={id,mag:w.mag,res:w.res};pl.cur=slot;pl.ads=0;pl.reloadT=0;pl.yaw=1.2;pl.pitch=0;pl.fireCD=0;
    const stp=()=>{P.updateCamera(1/60);P.updateVM(1/60);};for(let i=0;i<30;i++)stp();},[id,st]);
  await p.waitForTimeout(500);   /* o modelo real da arma é montado de forma assíncrona */
  await p.evaluate(([id,st])=>{const P=__pc,pl=P.player,w=P.WEAPONS[id],slot=w.slot;
    const stp=()=>{P.updateCamera(1/60);P.updateVM(1/60);};for(let i=0;i<150;i++)stp();
    if(st==='ads'){pl.ads=1;for(let i=0;i<40;i++)stp();P.camera.minZ=.12;}
    if(st==='rel'){pl.w[slot].mag=0;P.INPUT.reload=true;const N=Math.round(w.reload*60*.45);stp();P.INPUT.reload=false;for(let i=0;i<N;i++)stp();}
    if(st==='fire'){P.INPUT.fire=true;for(let i=0;i<8;i++){P.simStep(P.SIM_DT);stp();}P.INPUT.fire=false;}
    P.updateHUD(1/60);P.HUD.prompt.isVisible=false;P.HUD.banner.alpha=0;P.HUD.hurt.alpha=0;P.HUD.dir.alpha=0;P.game.render();},[id,st]);
  await p.screenshot({path:out+'/'+id+'_'+st+'.png',clip:{x:VW*.25,y:VH*.25,width:VW*.75,height:VH*.75}});}}
console.log(errs.join('\n')||'ok');await b.close();})();
