const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(600000);
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(3000);
const side=process.env.SIDE||'atk',opi=+(process.env.OP||0);
await p.evaluate(([side,opi])=>{__pc.engine.stopRenderLoop();__pc.freezeShow();__pc.setYaw(.25);const o=__pc.OPS[side][opi];if(side==='atk')__pc.SAVE.atkOp=o.id;else __pc.SAVE.defOp=o.id;__pc.setMenuTab('ops');},[side,opi]);
const names=['idle','ads','idle2','reload','idle3','crouch','idle4','gadget','look'];
for(let j=0;j<9;j++){
  await p.evaluate(j=>{const LA=__pc.LA;__pc.updateShowroom(1/60);LA.i=j;LA.t=0;},j);
  const secs=[1,1.2,1,1.0,1,1.5,1,1.6,1.7][j];
  await p.evaluate(s=>{for(let k=0;k<Math.round(s*60);k++)__pc.updateShowroom(1/60);__pc.lobby.render();},secs);
  await p.waitForTimeout(150);await p.screenshot({path:`shots/st_${j}.png`,clip:{x:560,y:40,width:400,height:460}});}
await b.close();})();
