// QA v31: third-person animation captures with puppeted bots + manual frame stepping
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(600000);/*v4: máquina compartilhada*/
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});/*v4: boot assíncrono*/await p.waitForTimeout(4000);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1500);
await p.evaluate(()=>{
  const P=__pc,E=P.engine,loop=E._activeRenderLoops[0];E.stopRenderLoop();E.getDeltaTime=()=>1000/60;
  for(let i=0;i<60*31;i++)P.simStep(P.SIM_DT);
  const pl=P.player;pl.alive=false; // spectator, no viewmodel
  const cam=P.camera;window.__qcam={pos:[0,2,0],tgt:[0,1,0]};
  window.__pup=[];
  window.__adv=(n)=>{const g=P.game,r=g.render;g.render=function(){};for(let i=0;i<n;i++){
      for(const q of __pup){const a=q.a;if(a.alive&&q.vel){a.vel.set(q.vel[0],0,q.vel[1]);a.pos.x+=a.vel.x/60;a.pos.z+=a.vel.z/60;}Object.assign(a,q.st||{});}
      if(i===n-1){g.render=function(){const q=__qcam;cam.position.set(...q.pos);const dx=q.tgt[0]-q.pos[0],dy=q.tgt[1]-q.pos[1],dz=q.tgt[2]-q.pos[2];cam.rotation.set(Math.atan2(dy,Math.hypot(dx,dz)),Math.atan2(-dx,-dz),0);cam.fov=.9;r.call(g);};}loop();}
    g.render=r;};
  // freeze all bots far away except puppets
  const bots=P.agents.filter(a=>a!==pl);bots.forEach((a,i)=>{a.bot=false;a.alive=true;a.hp=1e9;a.pos.set(3+i*.1,0,3);a.vel.set(0,0,0);});
});
async function scene(name,setup,camOff,frames,stepN,setupN=30){
  await p.evaluate(([setup,camOff,SET])=>{const P=__pc;__pup=[];const bots=P.agents.filter(a=>a!==P.player);bots.forEach((a,i)=>{a.alive=true;a.pos.set(3+i*.5,0,3);a.vel.set(0,0,0);a.crouchK=0;a.lean=0;a.sprint=false;a.reloadT=0;a.ads=0;a.pitch=0;});
    const S=JSON.parse(setup);S.forEach((s,i)=>{const a=bots[i];a.pos.set(s.x,0,s.z);a.yaw=s.yaw||0;Object.assign(a,s.st||{});a.alive=!s.dead;if(s.hurt)a.ai.hurtFrom=new P.V3(s.hurt[0],0,s.hurt[1]);if(s.w)a.cur=s.w;__pup.push({a,vel:s.vel,st:s.st});});
    const c=camOff;__qcam.pos=[c[0],c[1],c[2]];__qcam.tgt=[c[3],c[4],c[5]];__adv(SET);},[JSON.stringify(setup),camOff,setupN]);
  for(let f=0;f<frames;f++){await p.evaluate(n=>__adv(n),stepN);await p.waitForTimeout(300);await p.screenshot({path:`shots/q31/${name}_${f}.png`});}
}
const X=52.5,Z=33; // hallway cell (17,11)
// walk forward (moving -z, yaw 0), seen from side
// strafe right (yaw 0, moving +x) seen from front
// backpedal
// sprint
// crouch walk + crouch idle + lean L/R + reload + ads aiming up/down, line-up seen from front
//,[{x:X-1.6,z:Z,yaw:0,st:{crouchK:1}},{x:X-.8,z:Z,yaw:0,st:{lean:1}},{x:X,z:Z,yaw:0,st:{lean:-1}},{x:X+.8,z:Z,yaw:0,st:{reloadT:1.2}},{x:X+1.6,z:Z,yaw:0,st:{pitch:.8,ads:1}}],[X,1.4,Z-4.2,X,1,Z],2,10);
// lineup seen from side
//,[{x:X,z:Z-1.6,yaw:0,st:{crouchK:1}},{x:X,z:Z-.8,yaw:0,st:{lean:1}},{x:X,z:Z,yaw:0,st:{reloadT:1.2}},{x:X,z:Z+.8,yaw:0,st:{pitch:-.7}},{x:X,z:Z+1.6,yaw:0,st:{pitch:.8}}],[X+4.2,1.3,Z,X,1,Z],1,10);
// death next to the wall: shot from front, falls backward toward wall (wall at x=16 cell -> world x 49.5 plane); bot at x=50.2 facing +x (yaw=-PI/2)
await scene('death_wall',[{x:50.1,z:Z,yaw:-Math.PI/2,hurt:[60,Z],dead:true},{x:56.5,z:Z+1.5,yaw:Math.PI/2,hurt:[50,Z+1.5],dead:true}],[X+.5,1.9,Z-4.5,X,0.4,Z],5,8,2);
const info=await p.evaluate(()=>[...__pc.CH.entries()].filter(([a])=>!a.alive).map(([a,ch])=>({n:a.name,pos:[a.pos.x.toFixed(1),a.pos.z.toFixed(1)],yaw:a.yaw.toFixed(2),fall:ch.fall,rx:ch.root.rotation.x.toFixed(2),rz:ch.root.rotation.z.toFixed(2),kn:ch.legs[0].kn.rotation.x.toFixed(2),t:ch.deathT})));console.log(JSON.stringify(info));
console.log(errs.join('\n'));await b.close();})();