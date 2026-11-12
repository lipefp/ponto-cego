// Medição de desempenho/visual: node test/perf.js [qualidade]  (min|low|medium|high). Sem GPU o tempo é relativo (SwiftShader).
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const W=1280,H=720;const p=await (await b.newContext({viewport:{width:W,height:H},offline:true})).newPage();p.setDefaultTimeout(900000);p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:240000,polling:500}).catch(()=>{});await p.waitForTimeout(500);
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<60*46;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;__pc.VM.noHolster=true;__pc.engine.stopRenderLoop();});
const q=process.argv[2]||'high';
const r=await p.evaluate(async(q)=>{const P=__pc,sc=P.game,en=P.engine;P.SAVE.quality=q;P.applyQuality();
 const step=dt=>{if(P.G.phase!=='over'){P.G.phase='action';P.G.phaseT=100;}P.simStep(P.SIM_DT);P.updateCamera(dt);P.updateVM(dt);};
 for(let i=0;i<30;i++){step(1/60);sc.render();}
 const T=n=>{const t0=performance.now();for(let i=0;i<n;i++){step(1/60);sc.render();}return (performance.now()-t0)/n;};
 const base=T(20);
 const info={q,ms:+base.toFixed(1),meshes:sc.meshes.length,active:sc.getActiveMeshes().length,mats:sc.materials.length,tex:sc.textures.length,lights:sc.lights.length,skel:sc.skeletons.length,verts:sc.getTotalVertices(),ind:sc.getActiveIndices?sc.getActiveIndices():0,rt:sc.customRenderTargets.length,pp:sc.postProcesses.length,scale:en.getHardwareScalingLevel(),w:en.getRenderWidth(),h:en.getRenderHeight(),dpr:devicePixelRatio};
 const off={};off.ssao=!!window.__ssao;
 const pm=sc.postProcessRenderPipelineManager,pl=()=>pm.supportedPipelines.find(x=>x.name==='pp');
 const lap=(k,fn)=>{fn();off[k]=+T(15).toFixed(1);};
 const sg=sc.lights.map(l=>l.getShadowGenerator&&l.getShadowGenerator()).filter(Boolean)[0];
 if(window.__ssao)lap('sem_ssao',()=>{window.__ssao.dispose();window.__ssao=null;if(sc.geometryBufferRenderer)sc.disableGeometryBufferRenderer();});
 if(pl()){lap('sem_sharpen',()=>{pl().sharpenEnabled=false;});lap('sem_bloom',()=>{pl().bloomEnabled=false;});lap('sem_fxaa',()=>{pl().fxaaEnabled=false;});lap('sem_pos_tudo',()=>{pl().imageProcessingEnabled=false;});}
 if(sg){const rl=sg.getShadowMap();lap('sem_sombra',()=>{rl.refreshRate=0;});}
 return {info,off};},q);
console.log(JSON.stringify(r));
await p.evaluate(()=>{const P=__pc;P.game.render();});
await p.screenshot({path:`/tmp/perf_${q}.png`});
await b.close();})();
