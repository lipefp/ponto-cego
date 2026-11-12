// Custo de um quadro: node test/_cost.js  -> chamadas de desenho, triângulos, sombras, memória de textura
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:1280,height:720},offline:true})).newPage();p.setDefaultTimeout(900000);p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*90&&__pc.G.phase!=='action';i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;__pc.VM.noHolster=true;});
await p.waitForTimeout(3000);
const r=await p.evaluate(()=>{const s=__pc.game||__pc.scene,e=__pc.engine,B=window.BABYLON||__pc.B;
 const out={};const am=s.getActiveMeshes();const rows=[];let tri=0;
 for(let i=0;i<am.length;i++){const m=am.data[i];const n=m.thinInstanceCount||1;const t=(m.getTotalIndices()/3)*n;tri+=t;rows.push([m.name,Math.round(t),n,m.skeleton?1:0,m.receiveShadows?1:0]);}
 rows.sort((a,b)=>b[1]-a[1]);out.ativos=am.length;out.tri=Math.round(tri);out.top=rows.slice(0,14);
 const c0=e._drawCalls.count;s.render();out.draw=e._drawCalls.count-c0;let on=0,tot=0;for(const [a,ch] of __pc.CH){tot++;if(ch.root&&ch.root.isEnabled())on++;}out.bonecos=on+'/'+tot;
 let sc=0,sct=0;const sgs=[];for(const l of s.lights){const g=l.getShadowGenerator&&l.getShadowGenerator();if(g){const rl=g.getShadowMap().renderList||[];let t=0;for(const m of rl)if(m.isEnabled())t+=(m.getTotalIndices()/3)*(m.thinInstanceCount||1);sgs.push([l.name,rl.length,Math.round(t),g.getShadowMap().getSize().width,g.getShadowMap().refreshRate]);}}
 out.sombras=sgs;
 let mem=0;const big=[];for(const t of s.textures){const z=t.getSize?t.getSize():null;if(!z||!z.width)continue;const by=z.width*z.height*4*(t.noMipmap?1:1.33)*(t.isCube?6:1);mem+=by;big.push([t.name&&t.name.slice(0,30),z.width,z.height,Math.round(by/1048576)]);}
 big.sort((a,b)=>b[3]-a[3]);out.texMB=Math.round(mem/1048576);out.texN=s.textures.length;out.texTop=big.slice(0,10);
 out.mats=s.materials.length;out.meshes=s.meshes.length;out.aniso=[...new Set(s.textures.map(t=>t.anisotropicFilteringLevel))];
 return out;});
console.log(JSON.stringify(r));await b.close();})();
