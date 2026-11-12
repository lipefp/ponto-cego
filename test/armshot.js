const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const ids=(process.env.IDS||'pistol').split(',');
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:900,height:500},offline:true})).newPage();p.setDefaultTimeout(600000);p.on('console',m=>{if(/sleeve|fpv/i.test(m.text()))console.log('CON',m.text());});
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;pl.pitch=0;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();});
for(const id of ids){await p.evaluate(async([id,sk])=>{const P=__pc,pl=P.player,slot=P.WEAPONS[id].slot;if(sk){P.SAVE.skins[id]=sk;}const vid=P.wVariant(id,{sight:'iron',barrel:'none',grip:'none',laser:0});pl.w[slot]={id:vid,mag:30,res:90};pl.cur=slot;pl.reloadT=0;pl.act=null;pl.ads=0;P.INPUT.ads=false;pl.vel.set(0,0,0);P.VM.key='';for(let i=0;i<150;i++){P.updateCamera(1/60);P.updateVM(1/60);}P.game.render();},[id,process.env.SKIN]);
await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.evaluate(()=>{const r=__pc.FPV.cur,m=r.sleeves[0],s=r.mesh;if(!m)return 'nosleeve';return [m.getTotalVertices(),m.getTotalIndices(),m.skeleton===s.skeleton,m.numBoneInfluencers,s.numBoneInfluencers,m.isEnabled(),m.isVisible,m.parent&&m.parent.name,s.parent&&s.parent.name,m.scaling.x,s.scaling.x,m.useBones,s.useBones];})));
if(process.env.RED)await p.evaluate(()=>{const m=__pc.FPV.cur.sleeves[0];m.material.albedoColor.set(1,0,0);});
await p.evaluate(()=>{for(let i=0;i<30;i++){__pc.updateCamera(1/60);__pc.updateVM(1/60);}__pc.game.render();});
await p.screenshot({path:`shots/arm_${id}.png`});}
await b.close();})();
