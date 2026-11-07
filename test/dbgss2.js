const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});
await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:180000,polling:500});
console.log(await p.evaluate(()=>{const S=(__pc.lobby||__pc.game).__wm.ss2;return Object.keys(S).map(k=>{const m=S[k].material;return k+': '+m.name+' alb='+!!m.albedoTexture+' col='+m.albedoColor.toHexString()+' met='+m.metallic+' rough='+m.roughness+' mtex='+!!m.metallicTexture+' bump='+!!m.bumpTexture;}).join('\n')+'\nalb files '+JSON.stringify(__pc.WM.alb.ss2)+' img '+Object.keys(__pc.WM.img).join(',')}));
await b.close();})();
