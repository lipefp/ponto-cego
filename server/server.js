/* =====================================================================
   PONTO CEGO — SERVIDOR DEDICADO (Node) com FILA DE PARTIDAS
   - Serve o jogo (game.html) e o WebSocket (/ws) na mesma porta.
   - O jogador aperta "Buscar partida". O servidor junta quem está na fila,
     mostra "Partida encontrada" (todos aceitam) e começa. Vagas sem humano ficam com bots.
   - Cada partida tem a sua própria simulação (sim.js), 60 passos por segundo, snapshots a 20 Hz.
   Variáveis de ambiente:
     PORT (8080) · SERVER_NAME · MAX_PLAYERS (10 por partida) · MAX_MATCHES (4 partidas ao mesmo tempo)
     QUEUE_WAIT_S (20: espera máxima para juntar gente; com 10 na fila começa na hora)
     ACCEPT_S (15: tempo para aceitar) · BACK_TO_LOBBY_S (15: tela final)
     RECONNECT_S (60: tempo que a vaga de quem caiu fica guardada; um bot joga no lugar até ele voltar)
     MAX_PER_IP (12: conexões por endereço) · ALLOWED_ORIGINS (lista separada por vírgula; vazio = qualquer origem)
     COMPRESS (1: comprime os pacotes; 0 desliga)
   ===================================================================== */
'use strict';
const http = require('http'),
  fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = +process.env.PORT || 8080;
const SERVER_NAME = (process.env.SERVER_NAME || process.env.ROOM_NAME || 'Ponto Cego').slice(0, 32);
const MAX_PLAYERS = Math.min(10, Math.max(1, +process.env.MAX_PLAYERS || 10));
const MAX_MATCHES = Math.max(1, +process.env.MAX_MATCHES || 4);
const QUEUE_WAIT =
  (+process.env.QUEUE_WAIT_S >= 0 && process.env.QUEUE_WAIT_S !== undefined
    ? +process.env.QUEUE_WAIT_S
    : 20) * 1000;
const ACCEPT_MS = (+process.env.ACCEPT_S || 15) * 1000;
const BACK_S = +process.env.BACK_TO_LOBBY_S || 15;
const RECONNECT_MS =
  (process.env.RECONNECT_S !== undefined && +process.env.RECONNECT_S >= 0
    ? +process.env.RECONNECT_S
    : 60) * 1000;
const MAX_PER_IP = Math.max(1, +process.env.MAX_PER_IP || 12);
const ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase().replace(/\/+$/, ''))
  .filter(Boolean);
const COMPRESS = process.env.COMPRESS !== '0';
const PROTO = 3;
const SPEED = Math.max(
  1,
  +process.env.SIM_SPEED || 1
); /* só para testes automáticos (acelera a simulação) */
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

/* ---------- simulação (uma instância por partida) ---------- */
const SIM_SRC = fs.readFileSync(path.join(__dirname, 'sim.js'), 'utf8');
function newSim() {
  const s = new Function(SIM_SRC)();
  s.mpServerInit();
  return s;
}
const SIM0 = newSim();
const DT = SIM0.SIM_DT,
  CMD_BYTES = SIM0.NET_CMD_BYTES;
const BUILD = (() => {
  try {
    return new Function(SIM_SRC)().BUILD || 'dev';
  } catch (e) {
    return 'dev';
  }
})();

/* ---------- jogo (HTML) ---------- */
const HTML_PATH = path.join(__dirname, 'game.html');
let HTML = null,
  HTML_ETAG = '';
try {
  HTML = fs.readFileSync(HTML_PATH);
  HTML_ETAG = '"' + crypto.createHash('sha1').update(HTML).digest('hex').slice(0, 16) + '"';
} catch (e) {
  log('AVISO: game.html não encontrado — só o WebSocket vai funcionar');
}
const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  if (url === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }
  if (url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(status()));
    return;
  }
  if (url === '/baixar' && HTML) {
    /* o mesmo jogo, com o endereço deste servidor já gravado: o jogador abre o arquivo e só toca em Buscar partida */
    const host = req.headers.host || 'localhost:' + PORT,
      proto = (req.headers['x-forwarded-proto'] || '').split(',')[0] === 'https' ? 'https://' : '';
    const tag = '<script>window.PC_SERVER=' + JSON.stringify(proto + host) + ';</script>';
    const txt = HTML.toString('utf8'),
      i = txt.indexOf('<head>');
    const out = Buffer.from(
      i >= 0 ? txt.slice(0, i + 6) + tag + txt.slice(i + 6) : tag + txt,
      'utf8'
    );
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': out.length,
      'Content-Disposition': 'attachment; filename="PontoCego.html"',
      'Cache-Control': 'no-store',
    });
    res.end(out);
    return;
  }
  if ((url === '/' || url === '/index.html' || url === '/game.html') && HTML) {
    if (req.headers['if-none-match'] === HTML_ETAG) {
      res.writeHead(304);
      res.end();
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': HTML.length,
      ETag: HTML_ETAG,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(HTML);
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('não encontrado');
});
/* compressão: os snapshots são JSON e encolhem ~4x. Nível 1, sem guardar contexto entre mensagens e janela
   pequena: gasta pouco processador e pouca memória por conexão (a máquina do servidor pode ser pequena). */
const wss = new WebSocketServer({
  server,
  path: '/ws',
  maxPayload: 64 * 1024,
  perMessageDeflate: COMPRESS
    ? {
        zlibDeflateOptions: { level: 1, memLevel: 7 },
        serverNoContextTakeover: true,
        clientNoContextTakeover: true,
        serverMaxWindowBits: 12,
        threshold: 256,
        concurrencyLimit: 8,
      }
    : false,
  verifyClient: (info, done) => {
    if (ORIGINS.length) {
      const o = String(info.origin || '')
        .toLowerCase()
        .replace(/\/+$/, '');
      if (!ORIGINS.includes(o)) return done(false, 403, 'origem não permitida');
    }
    const ip = ipOf(info.req);
    if ((ipCount.get(ip) || 0) >= MAX_PER_IP) return done(false, 429, 'conexões demais');
    done(true);
  },
});
/* endereço de quem conecta (atrás do Caddy/nginx vem em X-Forwarded-For) */
const ipCount = new Map();
function ipOf(req) {
  const xf = String((req.headers && req.headers['x-forwarded-for']) || '')
    .split(',')[0]
    .trim();
  return xf || (req.socket && req.socket.remoteAddress) || '?';
}

/* ---------- jogadores, fila e partidas ---------- */
const clients = new Set(); /* todos os conectados */
const queue = []; /* clientes procurando partida (ordem de chegada) */
const matches = new Set(); /* partidas (aceite ou em andamento) */
const ghosts =
  new Map(); /* token -> {m, slot, info, until}: vaga guardada de quem caiu no meio da partida */
let nextId = 1,
  nextMatch = 1;
function inMatchCount() {
  let n = 0;
  for (const m of matches) if (m.phase === 'match') n += m.players.length;
  return n;
}
function status() {
  return {
    name: SERVER_NAME,
    online: clients.size,
    queue: queue.length,
    matches: [...matches].filter((m) => m.phase === 'match').length,
    playing: inMatchCount(),
    max: MAX_PLAYERS,
    build: BUILD,
    proto: PROTO,
  };
}
function sendJSON(c, o) {
  if (c.ws.readyState === 1) c.ws.send(JSON.stringify(o));
}
function statMsg() {
  const s = status();
  return {
    t: 'stat',
    online: s.online,
    queue: s.queue,
    matches: s.matches,
    playing: s.playing,
    name: SERVER_NAME,
  };
}

function addClient(ws, ip) {
  ipCount.set(ip, (ipCount.get(ip) || 0) + 1);
  const c = {
    id: nextId++,
    ws,
    ip,
    token: crypto.randomBytes(12).toString('hex'),
    binN: 0,
    binT: Date.now(),
    state: 'new',
    info: null,
    match: null,
    slot: -1,
    qAt: 0,
    acc: false,
    msgN: 0,
    msgT: Date.now(),
    alive: true,
  };
  clients.add(c);
  ws.on('message', (data, isBin) => {
    try {
      onMessage(c, data, isBin);
    } catch (e) {
      log('erro msg', e.stack || e.message);
    }
  });
  ws.on('close', () => dropClient(c));
  ws.on('error', () => {});
  ws.on('pong', () => {
    c.alive = true;
  });
  return c;
}
function unqueue(c) {
  const i = queue.indexOf(c);
  if (i >= 0) queue.splice(i, 1);
}
function dropClient(c) {
  if (!clients.has(c)) return;
  clients.delete(c);
  const n = (ipCount.get(c.ip) || 1) - 1;
  if (n > 0) ipCount.set(c.ip, n);
  else ipCount.delete(c.ip);
  unqueue(c);
  if (c.match) leaveMatch(c, true);
  if (c.info) log(`saiu: ${c.info.name} · ${clients.size} conectado(s)`);
}
/* tira o jogador da partida (aceite ou em andamento) */
function leaveMatch(c, closed) {
  const m = c.match;
  if (!m) return;
  const i = m.players.indexOf(c);
  if (i >= 0) m.players.splice(i, 1);
  c.match = null;
  c.acc = false;
  if (m.phase === 'accept') {
    /* alguém saiu antes da partida: cancela, quem aceitou volta para a fila */
    cancelAccept(m, 'um jogador saiu');
  } else {
    if (c.slot >= 0) {
      /* um bot assume o boneco (vivo). Se a conexão caiu, a vaga fica guardada para o jogador voltar */
      m.sim.mpDetachHuman(c.slot);
      const keep = closed && RECONNECT_MS > 0 && m.sim.G.phase !== 'over';
      if (keep) {
        ghosts.set(c.token, { m, slot: c.slot, info: c.info, until: Date.now() + RECONNECT_MS });
        m.slots[c.slot] = { ghost: c.token };
      } else m.slots[c.slot] = null;
      log(
        `${keep ? 'caiu da' : 'saiu da'} partida ${m.id}: ${c.info && c.info.name} (vaga ${c.slot}${keep ? ', guardada' : ''})`
      );
    }
    c.slot = -1;
    if (m.players.length === 0 && !hasGhosts(m)) destroyMatch(m, 'todos saíram');
  }
  if (!closed) {
    c.state = 'idle';
    sendJSON(c, { t: 'idle' });
  }
}
function hasGhosts(m) {
  for (const g of ghosts.values()) if (g.m === m) return true;
  return false;
}
/* quem caiu voltou dentro do prazo: reassume o mesmo boneco */
function resume(c, token) {
  if (typeof token !== 'string' || token.length !== 24) return false;
  /* a conexão antiga pode ainda não ter sido dada como morta: quem tem o token assume o lugar dela */
  if (!ghosts.has(token))
    for (const o of clients)
      if (o !== c && o.token === token && o.match && o.match.phase === 'match' && o.slot >= 0) {
        dropClient(o);
        try {
          o.ws.terminate();
        } catch (e) {}
        break;
      }
  const g = ghosts.get(token);
  if (!g) return false;
  ghosts.delete(token);
  const m = g.m;
  if (!matches.has(m) || m.phase !== 'match' || m.sim.G.phase === 'over') return false;
  if (!m.slots[g.slot] || m.slots[g.slot].ghost !== token) return false;
  if (!m.sim.mpAddHuman(g.slot, c.info || g.info)) return false;
  c.token = token;
  c.match = m;
  c.slot = g.slot;
  c.state = 'match';
  m.slots[g.slot] = c;
  m.players.push(c);
  m.sim.mpForceFull();
  log(`voltou para a partida ${m.id}: ${c.info && c.info.name} (vaga ${c.slot})`);
  return true;
}
function onMessage(c, data, isBin) {
  if (isBin) {
    /* comando de jogo: tamanho fixo, no máximo 150 por segundo (o jogo manda 60) */
    const m = c.match;
    if (!m || m.phase !== 'match' || c.slot < 0) return;
    const nowB = Date.now();
    if (nowB - c.binT > 1000) {
      c.binT = nowB;
      c.binN = 0;
    }
    if (++c.binN > 150) return;
    const u = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    if (u.length !== CMD_BYTES) return;
    m.sim.mpRecvCmd(c.slot, new Uint8Array(u));
    return;
  }
  /* limite de mensagens de texto (anti-spam): 40 por segundo */
  const now = Date.now();
  if (now - c.msgT > 1000) {
    c.msgT = now;
    c.msgN = 0;
  }
  if (++c.msgN > 40) return;
  let m;
  try {
    m = JSON.parse(data.toString());
  } catch (e) {
    return;
  }
  if (!m || typeof m.t !== 'string') return;
  if (m.t === 'ping') {
    sendJSON(c, { t: 'pong', n: m.n | 0 });
    return;
  }
  if (m.t === 'hello') {
    if (c.state !== 'new') return;
    if (m.proto !== PROTO || (m.build && BUILD !== 'dev' && m.build !== BUILD)) {
      sendJSON(c, {
        t: 'error',
        msg: 'Versão do jogo diferente da do servidor. Recarregue a página.',
        fatal: true,
      });
      c.ws.close();
      return;
    }
    c.info = cleanInfo(m.info);
    c.state = 'idle';
    const back = resume(c, m.resume);
    sendJSON(c, { t: 'welcome', proto: PROTO, build: BUILD, name: SERVER_NAME, token: c.token });
    log(`entrou: ${c.info.name} · ${clients.size} conectado(s)`);
    if (back) {
      sendJSON(c, { t: 'start', gi: c.slot, side0: c.match.side0, resume: true });
      return;
    }
    sendJSON(c, statMsg());
    return;
  }
  if (c.state === 'new') return;
  if (m.t === 'info') {
    c.info = cleanInfo(m.info);
    if (c.match && c.match.phase === 'match' && c.slot >= 0)
      c.match.sim.mpUpdateInfo(c.slot, m.info);
    return;
  }
  if (m.t === 'queue' && c.state === 'idle') {
    if (m.info) c.info = cleanInfo(m.info);
    c.state = 'queued';
    c.qAt = Date.now();
    queue.push(c);
    sendJSON(c, { t: 'queued', n: queue.length });
    log(`fila: ${c.info.name} · ${queue.length} na fila`);
    return;
  }
  if (m.t === 'cancel' && c.state === 'queued') {
    unqueue(c);
    c.state = 'idle';
    sendJSON(c, { t: 'idle' });
    return;
  }
  if (m.t === 'accept' && c.state === 'found' && c.match && c.match.phase === 'accept') {
    c.acc = true;
    acceptProgress(c.match);
    return;
  }
  if (m.t === 'decline' && c.state === 'found' && c.match && c.match.phase === 'accept') {
    leaveMatch(c, false);
    return;
  }
  if (m.t === 'leavematch' && c.match && c.match.phase === 'match') {
    leaveMatch(c, false);
    return;
  }
  if (m.t === 'leave') {
    c.ws.close();
    return;
  }
}
const cleanInfo = (info) => SIM_CLEAN(info);
const SIM_CLEAN = (() => {
  const s = newSim();
  return (i) => s.mpCleanInfo(i);
})();

/* ---------- formação de partidas ---------- */
function formMatches() {
  while (queue.length && matches.size < MAX_MATCHES) {
    const waited = Date.now() - queue[0].qAt;
    if (queue.length < MAX_PLAYERS && waited < QUEUE_WAIT) break;
    const take = queue.splice(0, Math.min(MAX_PLAYERS, queue.length));
    createMatch(take);
  }
}
function createMatch(list) {
  const m = {
    id: nextMatch++,
    sim: null,
    slots: new Array(10).fill(null),
    phase: 'accept',
    players: list.slice(),
    deadline: Date.now() + ACCEPT_MS,
    overAt: 0,
  };
  matches.add(m);
  for (const c of list) {
    c.match = m;
    c.state = 'found';
    c.acc = false;
  }
  log(`partida ${m.id} encontrada · ${list.length} jogador(es) · aguardando aceite`);
  acceptProgress(m, true);
}
function acceptProgress(m, first) {
  const n = m.players.filter((c) => c.acc).length,
    tot = m.players.length;
  for (const c of m.players)
    sendJSON(c, {
      t: 'found',
      acc: n,
      tot,
      left: Math.max(0, Math.round((m.deadline - Date.now()) / 1000)),
      me: c.acc,
    });
  if (!first && n === tot && tot > 0) startMatch(m);
}
function cancelAccept(m, why) {
  log(`partida ${m.id} cancelada (${why})`);
  matches.delete(m);
  const back = [];
  for (const c of m.players) {
    c.match = null;
    if (c.acc) {
      c.state = 'queued';
      c.acc = false;
      back.push(c);
      sendJSON(c, { t: 'queued', n: queue.length + back.length, again: true });
    } else {
      c.state = 'idle';
      sendJSON(c, { t: 'idle', declined: true });
    }
  }
  m.players = [];
  /* quem aceitou volta ao começo da fila, com o tempo de espera que já tinha */
  back.sort((a, b) => b.qAt - a.qAt);
  for (const c of back) queue.unshift(c);
}
function startMatch(m) {
  m.sim = newSim();
  m.phase = 'match';
  m.overAt = 0;
  /* times alternados; ordem aleatória */
  const list = m.players.slice().sort(() => Math.random() - 0.5);
  let a = 0,
    b = 5;
  list.forEach((c, i) => {
    const slot = i % 2 === 0 ? (a < 5 ? a++ : b++) : b < 10 ? b++ : a++;
    c.slot = slot;
    m.slots[slot] = c;
    m.sim.mpAddHuman(slot, c.info);
  });
  const side0 = m.sim.mpStartMatch();
  m.side0 = side0;
  log(
    `partida ${m.id} iniciada · ${m.players.length} humano(s) · time A começa no ${side0 === 'atk' ? 'ataque' : 'defesa'}`
  );
  for (const c of m.players) {
    c.state = 'match';
    sendJSON(c, { t: 'start', gi: c.slot, side0 });
  }
}
function destroyMatch(m, why) {
  log(`partida ${m.id} encerrada (${why})`);
  matches.delete(m);
  for (const [k, g] of ghosts) if (g.m === m) ghosts.delete(k);
  if (m.sim && m.phase === 'match') {
    for (let i = 0; i < 10; i++) m.sim.mpRemoveHuman(i);
    m.sim.mpEndMatch();
  }
  for (const c of m.players) {
    c.match = null;
    c.slot = -1;
    c.state = 'idle';
    sendJSON(c, { t: 'back' });
  }
  m.players = [];
}

/* ---------- laço de 60 Hz ---------- */
let bytesOut = 0,
  pkN = 0,
  tickMs = 0,
  tickN = 0;
function stepMatch(m) {
  const sim = m.sim,
    t0 = process.hrtime.bigint();
  const out = sim.mpServerStep(DT);
  if (out) {
    const body = JSON.stringify(out);
    pkN++;
    for (const c of m.players) {
      if (c.slot < 0 || c.ws.readyState !== 1) continue;
      if (c.ws.bufferedAmount > 2e6) continue; /* cliente travado: não acumula */
      const h = sim.mpClientHdr(c.slot);
      const msg = '{"t":"pk","h":' + JSON.stringify(h) + ',"p":' + body + '}';
      bytesOut += msg.length;
      c.ws.send(msg);
    }
  }
  tickMs += Number(process.hrtime.bigint() - t0) / 1e6;
  tickN++;
  if (sim.G.phase === 'over') {
    if (!m.overAt) m.overAt = Date.now();
    else if (Date.now() - m.overAt > BACK_S * 1000) destroyMatch(m, 'fim');
  }
}
let last = process.hrtime.bigint(),
  acc = 0;
setInterval(() => {
  const now = process.hrtime.bigint();
  acc += Math.min(0.25, Number(now - last) / 1e9) * SPEED;
  last = now;
  let n = 0;
  while (acc >= DT && n < 8 * SPEED) {
    for (const m of [...matches]) if (m.phase === 'match') stepMatch(m);
    acc -= DT;
    n++;
  }
  if (n >= 8 * SPEED) acc = 0;
}, 4);
/* fila e aceite: a cada 0,5 s */
setInterval(() => {
  const now = Date.now();
  for (const m of [...matches])
    if (m.phase === 'accept' && now > m.deadline) cancelAccept(m, 'tempo de aceite acabou');
  formMatches();
  /* vagas guardadas que venceram: o bot fica de vez; partida sem ninguém e sem vaga guardada acaba */
  for (const [k, g] of ghosts)
    if (now > g.until) {
      ghosts.delete(k);
      if (g.m.slots[g.slot] && g.m.slots[g.slot].ghost === k) g.m.slots[g.slot] = null;
    }
  for (const m of [...matches])
    if (m.phase === 'match' && m.players.length === 0 && !hasGhosts(m))
      destroyMatch(m, 'todos saíram');
  for (const m of matches)
    if (m.phase === 'accept' && now % 1000 < 500)
      acceptProgress(m, true); /* atualiza a contagem regressiva */
}, 500);
/* situação do servidor para quem está no menu: a cada 2 s */
setInterval(() => {
  const s = JSON.stringify(statMsg());
  for (const c of clients)
    if ((c.state === 'idle' || c.state === 'queued') && c.ws.readyState === 1) c.ws.send(s);
}, 2000);
/* estatística a cada 30 s (só durante partidas) */
setInterval(() => {
  if (tickN) {
    let rs = 0,
      rn = 0;
    for (const m of matches)
      if (m.phase === 'match') {
        const st = m.sim.mpNetStats();
        rs += st.rew * st.n;
        rn += st.n;
      }
    log(
      `${[...matches].filter((m) => m.phase === 'match').length} partida(s) · passo médio ${(tickMs / tickN).toFixed(2)} ms · ${(bytesOut / 30 / 1024).toFixed(0)} KB/s saída (antes de comprimir) · ${pkN} pacotes · compensação média ${rn ? ((rs / rn / 60) * 1000).toFixed(0) : 0} ms`
    );
  }
  bytesOut = 0;
  pkN = 0;
  tickMs = 0;
  tickN = 0;
}, 30000);
/* conexões mortas */
setInterval(() => {
  for (const c of clients) {
    if (!c.alive) {
      c.ws.terminate();
      continue;
    }
    c.alive = false;
    try {
      c.ws.ping();
    } catch (e) {}
  }
}, 15000);

wss.on('connection', (ws, req) => {
  if (clients.size >= 200) {
    ws.close();
    return;
  }
  addClient(ws, ipOf(req));
});
server.listen(PORT, '0.0.0.0', () =>
  log(
    `Ponto Cego servidor · porta ${PORT} · "${SERVER_NAME}" · até ${MAX_MATCHES} partidas de ${MAX_PLAYERS} jogadores · build ${BUILD}`
  )
);
for (const sig of ['SIGINT', 'SIGTERM'])
  process.on(sig, () => {
    log('encerrando');
    server.close();
    process.exit(0);
  });
