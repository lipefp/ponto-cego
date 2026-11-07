const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:400000,polling:500});
const r=await p.evaluate(()=>{const P=__pc;P.setMenuTab('arsenal');P.freezeShow();P.SAVE.att.rifle={sight:'iron',barrel:'none',grip:'vert',laser:0};P.setArs('rifle');
const S=P.lobby.__wm.m4,q=P.show.getChildMeshes().find(m=>/Front grip/.test(m.name));
return ['POS '+q.position.toString(),'SCL '+q.scaling.toString(),'ROT '+q.rotationQuaternion,'VIS '+q.visibility,'MAT '+(q.material&&q.material.name),'GEOM '+(q.geometry&&q.geometry.id),'VERTS '+q.getTotalVertices(),'SRCPOS '+S['Front grip vert Unreal'].position.toString(),'PARENT '+(q.parent&&q.parent.name)];});
console.log(r.join('\n'));await b.close();})();
