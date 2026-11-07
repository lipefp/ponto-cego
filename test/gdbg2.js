const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:400000,polling:500});
const r=await p.evaluate(()=>{const P=__pc,out=[];
for(const [m,zs] of [['ak47',[-.2,-.25,-.3,-.35,-.4]],['ss2',[-.1,-.15,-.2,-.25]],['mp7',[0,-.03,-.065,-.1,-.13]]]){const S=P.lobby.__wm[m];
 for(const z of zs){let mn=9,mx=-9,who='';for(const k in S){if(/^mag|^rear$|^Stock|ironsight/i.test(k))continue;const t=S[k];if(!t.getVerticesData)continue;const v=t.getVerticesData('position');if(!v)continue;for(let i=0;i<v.length;i+=3){if(Math.abs(v[i+2]-z)<.012&&Math.abs(v[i])<.03){if(v[i+1]<mn){mn=v[i+1];who=k;}if(v[i+1]>mx)mx=v[i+1];}}}
 out.push(m+' z='+z+' ymin='+mn.toFixed(3)+' ymax='+mx.toFixed(3)+' '+who);}}
return out;});console.log(r.join('\n'));await b.close();})();
