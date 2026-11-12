const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(600000);const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(3000);
await p.evaluate(()=>{__pc.setMenuTab('ops')});await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const out=[];const LA=__pc.LA;let err=null;
 for(let i=0;i<60*60*30;i++){try{__pc.lobbyLive(1/60);}catch(e){err=String(e.stack).slice(0,300);break;} if(LA.off){err='OFF at '+i+' i='+LA.i;break;} if(i%(60*120)===0)out.push([i,LA.i,LA.off,LA.ag.w.p.mag,LA.ag.gadgetN,LA.ag.reloadT,LA.ag.ads.toFixed(2)]);}
 return {out,err,off:LA.off};});
console.log(JSON.stringify(r));console.log(errs.slice(0,5).join('\n'));await b.close();})();
