const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:800,height:450},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:400000,polling:500});
const out=await p.evaluate(()=>{const P=__pc,res={};
 const sc=P.game.__wm?P.game:P.lobby;
 for(const id of Object.keys(P.WREAL)){const R=P.WREAL[id];const S=sc.__wm&&sc.__wm[R.m];if(!S){res[id]='sem cena';continue;}
  const L=P.WMOD[R.m].layout(R,{sight:'iron',barrel:'none',grip:'none',laser:0},P.WM.bb[R.m]);
  const nodes=[...L.main,...L.rear];const sz=L.sightZ;const win=(z0,dz)=>{let top=-9,bot=9;for(const n of nodes){const t=S[n];if(!t)continue;const pos=t.getVerticesData('position');if(!pos)continue;t.computeWorldMatrix(true);const wm=t.getWorldMatrix();
     for(let i=0;i<pos.length;i+=3){const v=BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(pos[i],pos[i+1],pos[i+2]),wm);if(Math.abs(v.x)<.014&&Math.abs(v.z-z0)<dz){if(v.y>top)top=v.y;if(v.y<bot)bot=v.y;}}}return [+top.toFixed(3),+bot.toFixed(3)];};
  res[id]={sightZ:sz,top:L.top,railAtSightZ:win(sz,.02),handguardUnder:L.fore,foreZ:L.fore&&L.fore[2],underAtFore:win(L.fore[2],.03)};}
 return res;});
console.log(JSON.stringify(out,null,1));await b.close();})();
