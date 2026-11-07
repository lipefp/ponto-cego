const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({viewport:{width:640,height:360},offline:true});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});/*v4: boot assíncrono*/await p.waitForTimeout(3000);
await p.evaluate(()=>{
  const sc=new BABYLON.Scene(__pc.engine);sc.useRightHandedSystem=true;sc.clearColor=new BABYLON.Color4(.55,.6,.62,1);
  const cam=new BABYLON.ArcRotateCamera('c',-Math.PI/2,1.3,3,new BABYLON.Vector3(0,1,0),sc);window.__cam=cam;
  const h=new BABYLON.HemisphericLight('h',new BABYLON.Vector3(.3,1,.2),sc);h.intensity=1.2;const d=new BABYLON.DirectionalLight('d',new BABYLON.Vector3(-.5,-1,-.8),sc);d.intensity=2;
  const ids=['pistol','smg','rifle','shotgun','dmr'];ids.forEach((id,i)=>{const w=__pc.buildWeapon(sc,id,'padrao');w.g.position.set(-1.6+i*.0,2.2-i*.32,0);w.g.rotation.y=Math.PI/2;w.g.position.x=-1.2;});
  const all=__pc.OPS.atk.concat(__pc.OPS.def);all.forEach((op,i)=>{const ch=__pc.buildCharacter(sc,op,i<4?'ally':'enemy');__pc.setCharWeapon(ch,op.prim,'padrao');ch.root.position.set(-.3+(i%4)*.75,0,(i<4?0:1.6));ch.root.rotation.y=Math.PI+ (i%2?.5:-.3);});
  window.__sc=sc;__pc.engine.stopRenderLoop();__pc.engine.runRenderLoop(()=>sc.render());
});
const shots=[['all',-Math.PI/2,1.35,6.5,[0.2,1.1,0.6]],['guns',-Math.PI/2,1.5,2.0,[-1.2,1.6,0]],['ops',-Math.PI/2+.3,1.3,2.6,[0.5,1.2,0]],['heads',Math.PI/2,1.4,1.6,[0.5,1.55,0]]];
for(const [n,a,bb,r,t] of shots){await p.evaluate(([a,bb,r,t])=>{__cam.alpha=a;__cam.beta=bb;__cam.radius=r;__cam.target.set(...t);},[a,bb,r,t]);await p.waitForTimeout(1500);await p.screenshot({path:`shots/mod_${n}.png`});}
console.log(errs.slice(0,12).join('\n'));await b.close();})();
