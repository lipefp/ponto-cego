// Compensação de atraso e reconexão. Uso: node test/lagcomp.js
const { spawn, execSync } = require('child_process'), path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..'), OUT = path.join(require('os').tmpdir(), 'pc-lcout');
execSync('MKSERVER_NOHTML=1 node tools/mkserver.mjs ' + OUT, { cwd: ROOT, stdio: 'pipe' });
const SD = path.join(OUT, 'PontoCego_Servidor'), WS = require(path.join(SD, 'node_modules/ws'));
let bad = 0;
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA ') + m); if (!c) bad++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---- 1. unidade: o tiro confere a posição do passo que o atirador via ---- */
{
  const src = fs.readFileSync(path.join(SD, 'sim.js'), 'utf8');
  const i = src.lastIndexOf('return {');
  const S = new Function(src.slice(0, i) + 'return {MP,NET,V3,hitAgent,mpHistRecord,agents,mpServerInit,' + src.slice(i + 8))();
  S.mpServerInit();
  const e = S.agents[5];
  e.alive = true; e.crouchK = 0; e.lean = 0;
  for (let t = 100; t <= 110; t++) { S.NET.tick = t; e.pos.set(10 + (t - 100) * 0.4, 0, 10); S.mpHistRecord(); }
  const o = new S.V3(10, 1.2, 5), d = new S.V3(0, 0, 1);
  S.MP.inRem = 0;
  S.MP.lcTick = 0;
  ok(!S.hitAgent(o, d, e), 'sem compensação: alvo já andou 4 m, o tiro erra');
  S.MP.lcTick = 100;
  const h = S.hitAgent(o, d, e);
  ok(h && Math.abs(h.t - 4.7) < 0.05, 'com compensação: acerta onde o alvo estava no passo 100 (t=' + (h && h.t.toFixed(2)) + ')');
  S.MP.lcTick = 100.5;
  ok(!!S.hitAgent(new S.V3(10.2, 1.2, 5), d, e), 'passo fracionado: posição interpolada (x=10,2)');
  S.MP.lcTick = 105;
  ok(!S.hitAgent(o, d, e), 'no passo 105 o alvo estava a 2 m: erra');
  S.MP.inRem = 5; S.MP.lcTick = 100;
  ok(!S.hitAgent(o, d, e), 'o próprio atirador nunca é voltado no tempo');
  S.MP.inRem = -1; S.MP.lcTick = 0;
}

/* ---- 2. servidor: quem cai vira bot vivo, a vaga fica guardada e o token devolve o boneco ---- */
function client(port, name, resume) {
  return new Promise((res, rej) => {
    const ws = new WS('ws://127.0.0.1:' + port + '/ws');
    const c = { ws, snaps: 0, ext: '' };
    ws.on('open', () => { ws.send(JSON.stringify({ t: 'hello', proto: 3, info: { name }, resume })); res(c); });
    ws.on('message', (data) => {
      const m = JSON.parse(data.toString());
      if (m.t === 'welcome') c.token = m.token;
      if (m.t === 'found' && !m.me) ws.send(JSON.stringify({ t: 'accept' }));
      if (m.t === 'start') c.start = m;
      if (m.t === 'pk' && m.p.s) { c.snaps++; if (m.p.s.walls) c.full = true; const a = m.p.s.agents[c.start ? c.start.gi : 0]; if (a && a.alive !== undefined) c.alive = a.alive; }
    });
    ws.on('upgrade', (r) => { c.ext = r.headers['sec-websocket-extensions'] || ''; });
    ws.on('error', rej);
  });
}
(async () => {
  const PORT = 18097;
  const p = spawn('node', ['server.js'], { cwd: SD, env: Object.assign({}, process.env, { PORT: String(PORT), QUEUE_WAIT_S: '1', MAX_PER_IP: '99', RECONNECT_S: '6' }) });
  let out = ''; p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (out += d));
  await sleep(1500);
  const a = await client(PORT, 'Ana'), b = await client(PORT, 'Beto');
  await sleep(300);
  ok(/permessage-deflate/.test(a.ext), 'compressão negociada (' + a.ext.slice(0, 40) + ')');
  ok(a.token && a.token.length === 24 && a.token !== b.token, 'cada jogador recebe um token');
  a.ws.send(JSON.stringify({ t: 'queue' })); b.ws.send(JSON.stringify({ t: 'queue' }));
  await sleep(4000);
  ok(a.start && b.start, 'partida começou');
  const gi = a.start.gi;
  a.ws.terminate();
  await sleep(1500);
  ok(/caiu da partida.*guardada/.test(out), 'queda: vaga guardada (log)');
  const a2 = await client(PORT, 'Ana', a.token);
  await sleep(1200);
  ok(a2.start && a2.start.resume && a2.start.gi === gi, 'voltou com o token: mesmo boneco (' + gi + ')');
  ok(a2.full && a2.snaps > 3, 'recebeu snapshot completo e segue recebendo (' + a2.snaps + ')');
  ok(a2.alive !== false, 'o boneco continuou vivo com o bot');
  const x = await client(PORT, 'Xis', 'f'.repeat(24));
  await sleep(500);
  ok(!x.start, 'token inventado não entra em partida');
  a2.ws.terminate(); b.ws.terminate();
  await sleep(2500);
  ok(!/encerrada \(todos/.test(out), 'partida segue enquanto há vaga guardada');
  await sleep(5500);
  ok(/encerrada \(todos sa/.test(out), 'vagas venceram (6 s): partida encerrada');
  ok(!/erro msg|TypeError|ReferenceError/.test(out), 'servidor sem erros');
  if (bad) console.log(out.slice(-1500));
  p.kill();
  console.log(bad ? 'FALHAS: ' + bad : 'TUDO OK');
  process.exit(bad ? 1 : 0);
})();
