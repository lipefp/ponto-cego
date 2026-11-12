const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(5000);
console.log(JSON.stringify(await p.evaluate(()=>{const r=__pc.VM.fpv.rigs.rifle;const o={};for(const n of ['LeftArm','LeftForeArm','LeftHand','RightArm','RightForeArm','RightHand']){const i=r.idx[n];o[n]=i==null?null:[Array.from(r.restP.slice(i*3,i*3+3)),r.nodes[i].getChildren().map(c=>c.name)];}
o.meshes=r.c.meshes.map(m=>[m.name,m.getTotalVertices(),m.getBoundingInfo().boundingBox.extendSize.asArray()]);o.mats=r.c.materials.map(m=>m.name);return o;})));
await b.close();})();
