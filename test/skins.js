const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' '+(e.stack||'').split('\n')[1]));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(3000);
await p.evaluate(()=>{const d=document.createElement('div');d.style.cssText='position:fixed;inset:0;background:#111;z-index:9999;display:flex;flex-wrap:wrap;gap:6px;padding:6px;font:11px sans-serif;color:#fff';
 for(const s of __pc.SKINS){const c=document.createElement('div');c.style.width='150px';c.innerHTML=`<img src="${__pc.skinThumb(s.id)}" width=150 height=80 style="object-fit:fill"><br>${s.name}`;d.appendChild(c);}document.body.appendChild(d);});
await p.waitForTimeout(800);await p.screenshot({path:'shots/skins_sheet.png'});
console.log(errs.join('\n'));await b.close();})();
