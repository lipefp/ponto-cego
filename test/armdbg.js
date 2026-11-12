const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:900,height:500},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.evaluate(()=>{const B=BABYLON,r=__pc.FPV.rigs.pistol,m=r.mesh,sk=m.skeleton;const pos=m.getVerticesData('position'),mi=m.getVerticesData('matricesIndices'),mw=m.getVerticesData('matricesWeights');
const out={mats:r.c.materials.map(x=>x.name),meshes:r.c.meshes.map(x=>x.name+':'+(x.material&&x.material.name)),bones:sk.bones.map(b=>b.name).join(',').slice(0,300)};
const bi=sk.bones.findIndex(b=>b.name==='LeftForeArm');const inv=sk.bones[bi].getAbsoluteInverseBindMatrix?sk.bones[bi].getAbsoluteInverseBindMatrix():sk.bones[bi].getInvertedAbsoluteTransform();
let ys=[],rs=[],cx=[];for(let v=0;v<pos.length/3;v++){let w=0;for(let k=0;k<4;k++)if(mi[v*4+k]===bi)w+=mw[v*4+k];if(w<.7)continue;const q=B.Vector3.TransformCoordinates(new B.Vector3(pos[v*3],pos[v*3+1],pos[v*3+2]),inv);ys.push(q.y);cx.push([q.x,q.z,q.y]);rs.push(Math.hypot(q.x,q.z));}
const st=a=>a.length?[Math.min(...a),Math.max(...a)].map(x=>+x.toFixed(3)):null;out.n=ys.length;const mean=i=>+(cx.reduce((a,c)=>a+c[i],0)/cx.length).toFixed(3);out.c=[mean(0),mean(1),mean(2)];out.top=cx.filter(c=>c[2]>.15).slice(0,3);out.y=st(ys);out.r=st(rs);
const bins={};ys.forEach((y,i)=>{const k=Math.round(y*10)/10;(bins[k]=bins[k]||[]).push(rs[i]);});out.prof=Object.keys(bins).sort((a,b)=>a-b).map(k=>k+':'+(bins[k].reduce((a,b)=>a+b)/bins[k].length).toFixed(3));return out;})));
await b.close();})();
