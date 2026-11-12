const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:800,height:450},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:400000,polling:500});
console.log(JSON.stringify(await p.evaluate(()=>{const o={};for(const mk of ['m4','mp7','ak47','ss2','pistol2']){o[mk]={};for(const [n,v] of Object.entries(__pc.WM.bb[mk]||{}))o[mk][n]=[v.min.x,v.min.y,v.min.z,v.max.x,v.max.y,v.max.z].map(x=>+x.toFixed(3));}return o;}),null,0).replace(/\],"/g,'],\n"'));
await b.close();})();
