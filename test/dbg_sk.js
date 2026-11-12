const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();
p.on('console',m=>{if(/Merge|opMerge/.test(m.text()))console.log('C',m.text().slice(0,300))});await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{const P=__pc;P.engine.stopRenderLoop();const op=P.OPS.atk[0],ch=P.buildCharacter(P.game,op,'enemy',0);await new Promise(r=>setTimeout(r,1500));
 const c=ch.e.c;const dd=c.meshes.map(m=>[m.name,m.skeleton&&m.skeleton.bones.length,m.skeleton&&m.skeleton.bones.map(b=>b.name).join('|').slice(0,200),!!m.getVerticesData('matricesIndices')]);return {dd,meshes:ch.root.getChildMeshes(false).map(m=>[m.name,m.skeleton&&m.skeleton.bones.length,m.skeleton&&m.skeleton.uniqueId,m.isEnabled(),m.getTotalVertices()]),sk:ch.e.c.skeletons.length,skn:ch.e.c.skeletons.map(s=>s.bones.length+':'+s.bones[0].name+':'+s.getChildren().length)};});
console.log(JSON.stringify(r,null,0));await b.close();})();
