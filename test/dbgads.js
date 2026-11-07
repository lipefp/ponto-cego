const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const id=process.argv[2]||'rifle';const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
console.log(await p.evaluate((id)=>{const P=__pc,pl=P.player,B=BABYLON;for(let i=0;i<60*31;i++)P.simStep(P.SIM_DT);pl.hp=1e6;P.VM.noHolster=true;const slot=P.WEAPONS[id].slot;pl.w[slot]={id,mag:30,res:90};pl.cur=slot;pl.ads=1;P.INPUT.ads=true;
 for(let i=0;i<150;i++){P.updateCamera(1/60);P.updateVM(1/60);}P.camera.computeWorldMatrix(true);const I=P.VM.info,inv=P.camera.getWorldMatrix().clone().invert();
 const out=['rear enabled '+(I.rear&&I.rear.isEnabled())+' ads '+pl.ads+' sight '+I.sight.toString()+' eye '+I.eye];
 for(const m of I.g.getChildMeshes()){if(!m.isEnabled()||!m.getTotalVertices)continue;m.computeWorldMatrix(true);const bb=m.getBoundingInfo().boundingBox,c=B.Vector3.TransformCoordinates(bb.centerWorld,inv);if(c.z<.4)out.push(m.name+' cam-space '+c.x.toFixed(3)+','+c.y.toFixed(3)+','+c.z.toFixed(3)+' ext '+bb.extendSizeWorld.x.toFixed(3)+','+bb.extendSizeWorld.y.toFixed(3)+','+bb.extendSizeWorld.z.toFixed(3));}
 return out.join('\n');},id));await b.close();})();
