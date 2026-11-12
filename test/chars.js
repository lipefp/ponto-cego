// Fotos dos operadores com roteiro de eventos no tempo (recarga, tiro, granada, levar tiro...) numa cena leve (sem o mapa).
// uso: node test/chars.js nome '[{"op":"brecha","vari":0,"t":1.2,"ev":[{"t":0,"set":{"reloadT":2}}, ...]}, ...]' [alpha beta raio alvoY] [w h]
// item: op, vari, wp (arma), st (campos iniciais do agente), t (s simulados antes da foto), dx (espaçamento),
//   ev: [{t, set:{campo:valor}, fire:true, hit:dano, toss:true, reload:segundos}] — aplicados no instante t (s) a 60 Hz;
//   a recarga conta regressivamente a partir de `reload` (como o sim). Cada item é simulado do zero até o seu `t` (mesma história), então
//   uma fileira com o mesmo roteiro e t diferentes vira uma "tira de quadros" do clipe.
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{const [name,list,al,be,ra,ty,W,H]=process.argv.slice(2);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:+W||1400,height:+H||700},offline:true})).newPage();p.setDefaultTimeout(600000);
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' | '+(e.stack||'').split('\n').slice(1,3).join(' ')));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push('C '+m.text().slice(0,200));});
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(2000);
const info=await p.evaluate(async([list,al,be,ra,ty])=>{const P=__pc,B=BABYLON;P.engine.stopRenderLoop();
  const sc=new B.Scene(P.engine);sc.useRightHandedSystem=true;sc.clearColor=new B.Color4(.42,.45,.47,1);
  const L=JSON.parse(list),n=L.length;
  const cam=new B.ArcRotateCamera('c',al?+al:Math.PI/2,be?+be:1.42,ra?+ra:1.6+n*.62,new B.Vector3(0,ty?+ty:.9,0),sc);cam.minZ=.05;
  const h=new B.HemisphericLight('h',new B.Vector3(.3,1,.4),sc);h.intensity=.75;h.groundColor=new B.Color3(.25,.22,.2);const d=new B.DirectionalLight('d',new B.Vector3(-.5,-1,-.6),sc);d.intensity=2.2;d.position.set(5,10,5);
  if(P.game.environmentTexture)sc.environmentTexture=P.game.environmentTexture;
  const sg=new B.ShadowGenerator(2048,d);sg.usePercentageCloserFiltering=true;
  const gr=B.MeshBuilder.CreateGround('g',{width:30,height:30},sc);const gm=new B.PBRMaterial('gm',sc);gm.albedoColor=new B.Color3(.35,.33,.3);gm.roughness=.9;gm.metallic=0;gr.material=gm;gr.receiveShadows=true;
  const ops=P.OPS.atk.concat(P.OPS.def);await new Promise(r=>setTimeout(r,200));
  const items=L.map((it,i)=>{const op=ops.find(o=>o.id===it.op)||ops[i%ops.length];const ch=P.buildCharacter(sc,op,it.rel||'enemy',it.vari||0,it.seed);const st=it.st||{};
    const a={id:i,alive:true,pos:new P.V3((i-(n-1)/2)*(it.dx===undefined?1.05:it.dx),0,(i-(n-1)/2)*(it.dz||0)),vel:new P.V3(...(st.vel?[st.vel[0],0,st.vel[1]]:[0,0,0])),yaw:st.yaw||0,pitch:st.pitch||0,crouchK:st.crouchK||0,lean:st.lean||0,ads:st.ads||0,sprint:!!st.sprint,
      reloadT:0,cur:'p',w:{p:{id:it.wp||op.prim,mag:30,res:90},s:{id:'pistol'}},fireT:-9,hp:100,gadgetN:2,op,ai:{hurtFrom:null},lastHead:false,onGround:true};
    return {ch,a,it};});
  await new Promise(r=>setTimeout(r,1500));
  for(const q of items){P.setCharWeapon(q.ch,q.it.wp||q.ch.op.prim,'padrao');}
  const out=[];
  for(const q of items){const a=q.a,it=q.it,frames=Math.round((it.t||1)*60),x0=a.pos.x,ev=(it.ev||[]).map(e=>Object.assign({f:Math.round(e.t*60)},e));let rl=0;
    for(let f=0;f<=frames;f++){P.G.clock=f/60;
      for(const e of ev)if(e.f===f){if(e.set)Object.assign(a,e.set);if(e.fire)a.fireT=P.G.clock;if(e.hit)a.hp-=e.hit;if(e.toss)a.gadgetN--;if(e.reload){rl=e.reload;}}
      if(rl>0){a.reloadT=rl;rl-=1/60;if(rl<=0){rl=0;a.reloadT=0;}}
      a.pos.x+=a.vel.x/60;a.pos.z+=a.vel.z/60;P.animChar(q.ch,a,1/60);}
    const dx=a.pos.x-x0;q.ch.root.position.x-=dx;q.ch.disp=null;
    q.ch.animT=1e15;for(const m of q.ch.root.getChildMeshes()){m.receiveShadows=true;sg.addShadowCaster(m,false);}
    out.push({op:q.ch.op.id,rig:!!q.ch.rig,ly:q.ch.ev?JSON.stringify(q.ch.k.rel.toFixed(2)):0});}
  window.__sc=sc;P.engine.runRenderLoop(()=>sc.render());
  return out;},[list,al,be,ra,ty]);
await p.waitForTimeout(4500);fs.mkdirSync('shots/chars',{recursive:true});await p.screenshot({path:`shots/chars/${name}.png`});
console.log(JSON.stringify(info));console.log(errs.slice(0,10).join('\n'));await b.close();})();
