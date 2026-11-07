const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const tag=process.env.TAG||'a';
const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:300000,polling:500}).catch(()=>{});await p.waitForTimeout(1000);
const info=await p.evaluate(()=>({ids:__pc.WLIST,skins:__pc.SKINS.map(s=>s.id)}));
const w=process.env.W||'rifle';const sk=(process.env.SK||'').split(',').filter(Boolean);const list=sk.length?sk:info.skins.slice(1,7);
await p.evaluate(w=>{__pc.engine.stopRenderLoop();__pc.freezeShow();__pc.setArs(w);__pc.setMenuTab('arsenal');},w);
let n=0;for(const s of list){await p.evaluate(([w,s])=>{__pc.SAVE.skins[w]=s;__pc.setMenuTab('arsenal');for(let i=0;i<5;i++)__pc.updateShowroom(1/60);__pc.lobby.render();},[w,s]);await p.waitForTimeout(400);await p.evaluate(()=>{for(let i=0;i<5;i++)__pc.updateShowroom(1/60);__pc.lobby.render();});
 await p.screenshot({path:`shots/sk_${tag}_${n++}.png`,clip:{x:400,y:150,width:560,height:260}});}
console.log(list.join(','));await b.close();})();
