// QA do gadget em 1ª pessoa: para cada gadget (e com rifle/pistola na mão) o clipe de arremesso roda, o gadget aparece na mão,
// e ao fim a arma volta (visível), o gadget some e não há erros.
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();});
let bad=0;
const kinds=await p.evaluate(()=>[...new Set(__pc.OPS.atk.concat(__pc.OPS.def).map(o=>o.gadget))]);
for(const wid of ['rifle','pistol'])for(const K of kinds){
  const r=await p.evaluate(([K,wid])=>{const P=__pc,pl=P.player,slot=P.WEAPONS[wid].slot;pl.w[slot]={id:wid,mag:30,res:90};pl.cur=slot;
    pl.op=Object.assign({},pl.op,{gadget:K});const stp=()=>{P.updateCamera(1/60);P.updateVM(1/60);};
    pl.gadgetN=3;for(let i=0;i<50;i++)stp();pl.gadgetN=2;let sawHeld=false,sawThrow=false,n=0;
    for(;n<120;n++){stp();if(P.FPV.held&&P.FPV.held.isEnabled())sawHeld=true;if(P.VM.th)sawThrow=true;if(!P.VM.th&&n>3)break;}
    for(let i=0;i<10;i++)stp();P.game.render();const rig=P.FPV.cur;
    return {sawThrow,sawHeld,gunOn:!!(rig&&rig.w.g.isEnabled()),heldGone:!P.FPV.held,n};},[K,wid]);
  const ok=r.sawThrow&&r.sawHeld&&r.gunOn&&r.heldGone&&r.n<110;if(!ok)bad++;console.log((ok?'OK   ':'FALHA')+' '+wid.padEnd(7)+K.padEnd(9)+JSON.stringify(r));}
console.log(errs.join('\n'));console.log(bad||errs.length?'GADGET 1ª PESSOA REPROVADO':'GADGET 1ª PESSOA APROVADO');await b.close();process.exit(bad||errs.length?1:0);})();
