// /baixar entrega o jogo com o endereço do servidor gravado: aberto de arquivo (file://) conecta sozinho.
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const {spawn,execSync}=require('child_process');const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),OUT='/tmp/pc_mpd';
(async()=>{
 execSync(`rm -rf ${OUT} && mkdir -p ${OUT} && MKSERVER_NOHTML=1 node tools/mkserver.mjs ${OUT} >/dev/null`,{cwd:ROOT});
 const SD=OUT+'/PontoCego_Servidor';fs.copyFileSync(ROOT+'/dist/test.html',SD+'/game.html');
 const sv=spawn('node',['server.js'],{cwd:SD,env:Object.assign({},process.env,{PORT:'18095'})});await new Promise(r=>setTimeout(r,800));
 execSync(`curl -s -D ${OUT}/h.txt -o ${OUT}/PontoCego.html http://127.0.0.1:18095/baixar`);
 const hdr=fs.readFileSync(OUT+'/h.txt','utf8'),html=fs.readFileSync(OUT+'/PontoCego.html','utf8');
 let bad=0;const ck=(n,ok,x)=>{console.log((ok?'OK   ':'FALHA ')+n+(x?' · '+x:''));if(!ok)bad++;};
 ck('download com o endereço gravado',/window\.PC_SERVER="127\.0\.0\.1:18095"/.test(html)&&/attachment/.test(hdr));
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await (await b.newContext({viewport:{width:640,height:360}})).newPage();p.setDefaultTimeout(120000);
 await p.goto('file://'+OUT+'/PontoCego.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:300000,polling:100});
 await p.evaluate(()=>{__pc.SAVE.mpHost='';__pc.game.render=()=>{};__pc.lobby.render=()=>{};__pc.setMenuTab('online');});
 await p.waitForTimeout(4000);console.log(JSON.stringify(await p.evaluate(()=>({st:__pc.ON.st,err:__pc.ON.err,tried:__pc.ON.tried,pc:window.PC_SERVER,prot:location.protocol,mh:__pc.SAVE.mpHost,ci:__pc.ON.closeInfo}))));await p.waitForFunction(()=>__pc.ON.st==='idle',null,{timeout:15000}).then(()=>ck('arquivo aberto do disco conecta sozinho',true),()=>ck('arquivo aberto do disco conecta sozinho',false));
 await b.close();sv.kill();console.log(bad?'BAIXAR REPROVADO':'BAIXAR APROVADO');process.exit(bad?1:0);})();
