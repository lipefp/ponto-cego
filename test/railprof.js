const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:800,height:450},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:400000,polling:500});
const out=await p.evaluate(()=>{const P=__pc,res={};const sc=P.game.__wm?P.game:P.lobby;
 for(const id of ['rifle','carcara','tupa','smg','pistol','jararaca','dmr']){const R=P.WREAL[id];const S=sc.__wm[R.m];
  const L=P.WMOD[R.m].layout(R,{sight:'iron',barrel:'none',grip:'none',laser:0},P.WM.bb[R.m]);const nodes=[...L.main,...L.rear];
  const prof=[],under=[];const V=BABYLON.Vector3;
  const pts=[];for(const n of nodes){const t=S[n];if(!t)continue;const pos=t.getVerticesData('position');t.computeWorldMatrix(true);const wm=t.getWorldMatrix();for(let i=0;i<pos.length;i+=3)pts.push(V.TransformCoordinates(new V(pos[i],pos[i+1],pos[i+2]),wm));}
  for(let z=-.5;z<=.3;z+=.025){let top=null,bot=null;for(const v of pts){if(Math.abs(v.x)<.014&&Math.abs(v.z-z)<.0125){if(top===null||v.y>top)top=v.y;if(bot===null||v.y<bot)bot=v.y;}}prof.push(top===null?null:[+z.toFixed(3),+top.toFixed(3),+bot.toFixed(3)]);}
  res[id]=prof.filter(Boolean).map(a=>a.join(':')).join(' ');}
 return res;});
for(const k in out)console.log(k,'\n',out[k]);await b.close();})();
