// sorteio de lado + prorrogação (3–3: quem perdeu o sorteio escolhe) + home simplificada
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{let bad=0;const ok=(c,m)=>{console.log((c?'OK   ':'FALHA ')+m);if(!c)bad++;};
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await (await b.newContext({viewport:{width:640,height:360},offline:true})).newPage();p.setDefaultTimeout(600000);const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/dist/test.html');await p.waitForFunction(()=>window.__pc&&(__pc.ASSETS.ready||__pc.ASSETS.failed),null,{timeout:900000,polling:100});await p.waitForTimeout(3000);
await p.screenshot({path:'shots/sc_home2.png'});
const passBan=async()=>{await p.waitForFunction(()=>__pc.FLOW.step==='ban'||__pc.FLOW.step==='ops',null,{timeout:600000,polling:200});
  if(await p.evaluate(()=>__pc.FLOW.step==='ban'))await p.evaluate(()=>{const B=__pc.FLOW.ban;B.tiles[0].__choose();B.go.onPointerUpObservable.notifyObservers({});});
  await p.waitForFunction(()=>__pc.FLOW.step==='ops',null,{timeout:600000,polling:200});};
await p.evaluate(()=>__pc.flowStart());await p.waitForFunction(()=>__pc.FLOW.step==='coin',null,{timeout:600000});await p.waitForTimeout(600);await p.screenshot({path:'shots/sc_coin.png'});
await passBan();
const s1=await p.evaluate(()=>({side:__pc.SAVE.startSide,f:__pc.FLOW.side}));ok(s1.side===s1.f&&(s1.side==='atk'||s1.side==='def'),'lado sorteado '+s1.side);
await p.screenshot({path:'shots/sc_ops2.png'});
for(const start of ['atk','def']){
  const r=await p.evaluate(start=>{const P=__pc;P.SAVE.startSide=start;P.newMatch();P.G.otRoleA=null;P.teams.A.score=3;P.teams.B.score=3;P.G.round=6;P.G.pickBetween=true;P.flowRound(false);
    return {step:P.FLOW.step};},start);
  await p.waitForTimeout(500);await p.screenshot({path:`shots/sc_ot_${start}.png`});
  if(start==='def'){await p.evaluate(()=>{});ok(r.step==='ot','prorrogação: tela de escolha (perdeu o sorteio)');
    await p.evaluate(()=>{const P=__pc;P.G.otRoleA='atk';});}
  else{await passBan();const o=await p.evaluate(()=>__pc.G.otRoleA);ok(o==='atk'||o==='def','prorrogação: adversário escolheu, você='+o);}
  const role=await p.evaluate(()=>({a:__pc.nextRoleOf('A'),b:__pc.nextRoleOf('B'),o:__pc.G.otRoleA}));ok(role.a===role.o&&role.b!==role.a,'papéis na rodada 7: A='+role.a+' B='+role.b);
  await p.evaluate(()=>{try{__pc.flowLeave&&0;}catch(e){}});}
ok(!errs.length,'sem erros '+errs.join('|'));console.log(bad?'COIN REPROVADO':'COIN APROVADO');await b.close();process.exit(bad?1:0);})();
