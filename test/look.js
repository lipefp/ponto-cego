// fotos de iluminação/materiais: node test/look.js <qualidade> <prefixo> '[["nome",celX,celZ,yaw,pitch,y?]]'  (sai em shots/look/)
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs');fs.mkdirSync('shots/look',{recursive:true});
(async()=>{
const [,,q,pre,js]=process.argv;
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);/*v4: máquina compartilhada*/
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push('C '+m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});/*v4: boot assíncrono*/await p.waitForTimeout(4000);
await p.evaluate(q=>{__pc.SAVE.quality=q;__pc.applyQuality();},q);
if(pre.startsWith('lobby')){await p.waitForTimeout(3000);await p.screenshot({path:`shots/look/${pre}.png`});}
else{
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(2000);
await p.evaluate(()=>{for(let i=0;i<60*31;i++)__pc.simStep(__pc.SIM_DT);__pc.player.hp=1e6;for(const a of __pc.G.agents||[])if(a!==__pc.player)a.hp=1e6;});
for(const [n,x,z,yaw,pitch,y] of JSON.parse(js)){await p.evaluate(([x,z,yaw,pitch,y])=>{const pl=__pc.player;pl.pos.x=x*3;pl.pos.z=z*3;if(y!=null){pl.pos.y=y;}pl.yaw=yaw;pl.pitch=pitch;},[x,z,yaw,pitch,y]);await p.waitForTimeout(2200);await p.screenshot({path:`shots/look/${pre}_${n}.png`});}
}
console.log(errs.filter(e=>!/GPU stall|GL Driver|swiftshader|Automatic fallback/.test(e)).slice(0,10).join('\n'));await b.close();})();
