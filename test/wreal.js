// primeira pessoa com armas reais; uso: node test/wreal.js '<["id@sight.barrel.grip.laser",...]>' [ads 0/1] [skin]
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const list=JSON.parse(process.argv[2]||'["rifle"]'),ads=+(process.argv[3]||0),skin=process.argv[4]||'padrao';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:960,height:540},offline:true})).newPage();p.setDefaultTimeout(600000);const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{const t=m.text();if(/wm|error|fail/i.test(t)&&!/GL Driver/.test(t))console.log('C',t.slice(0,200));});
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForFunction(()=>__pc.WM&&__pc.WM.on,null,{timeout:900000,polling:1000}).catch(()=>{});await p.waitForTimeout(1000);
console.log('PH',await p.evaluate(()=>JSON.stringify(Object.keys(__pc.PHOTO_D))+JSON.stringify(__pc.PHOTO_DONE)));console.log('WM.on',await p.evaluate(()=>typeof __pc.WM!=='undefined'?__pc.WM.on:'no export'));
await p.evaluate(()=>{__pc.startMatch();document.dispatchEvent(new Event('pointerlockerror'));});await p.waitForTimeout(1500);
await p.evaluate(()=>{for(let i=0;i<60*31;i++)__pc.simStep(__pc.SIM_DT);const pl=__pc.player;pl.hp=1e6;pl.pos.x=40;pl.pos.z=28;pl.yaw=1.2;pl.pitch=0;__pc.VM.noHolster=true;});
let k=0;for(const spec of list){const [id,a]=spec.split('@');const at=a?a.split('.'):null;
  await p.evaluate(([id,at,skin,ads])=>{const P=__pc,pl=P.player;const slot=P.WEAPONS[id].slot;pl.cur=slot;
    pl.w[slot].id=at?P.wVariant(id,{sight:at[0],barrel:at[1],grip:at[2],laser:+at[3]}):id;P.SAVE.skins[id]=skin;P.INPUT.ads=!!ads;},[id,at,skin,ads]);
  await p.waitForTimeout(2500);await p.screenshot({path:`shots/wr_${k++}.png`});console.log(spec);}
console.log(errs.join('\n'));await b.close();})();
