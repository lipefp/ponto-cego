const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const p=await (await b.newContext({offline:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000});await p.waitForTimeout(3000);
const r=await p.evaluate(async()=>{const A=new AudioContext();const keys=Object.keys(ASSET_FILE||{}).filter(k=>/^au_/.test(k));let ok=0,bad=[];for(const k of keys){try{const u=ASSET_BYTES(k);await A.decodeAudioData(u.buffer.slice(u.byteOffset,u.byteOffset+u.byteLength));ok++;}catch(e){bad.push(k);}}return {n:keys.length,ok,bad};}).catch(e=>String(e));
console.log(JSON.stringify(r),errs.join('|'));await b.close();})();
