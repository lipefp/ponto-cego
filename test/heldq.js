const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:420},offline:true})).newPage();p.setDefaultTimeout(600000);p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
console.log(JSON.stringify(await p.evaluate(()=>{const P=__pc,pl=P.player;for(let i=0;i<60*46;i++)P.simStep(P.SIM_DT);pl.hp=1e6;P.VM.noHolster=true;P.engine.stopRenderLoop();
 for(let i=0;i<40;i++){P.updateCamera(1/60);P.updateVM(1/60);}
 pl.op=Object.assign({},pl.op,{gadget:'frag'});pl.gadgetN=3;P.updateVM(1/60);pl.gadgetN=2;const out=[];
 for(let i=0;i<14;i++){P.updateVM(1/60);const h=P.FPV.held;out.push([P.VM.th&&+P.VM.th.t.toFixed(2),!!h,h&&h.isEnabled(),h&&h.getChildMeshes().length,h&&h.getChildMeshes().map(m=>m.isEnabled()+':'+m.getTotalVertices()).join(','),h&&h.parent&&h.parent.name,h&&h.getAbsolutePosition().asArray().map(x=>+x.toFixed(2)).join(',')]);}
 return out;})));
await b.close();})();
