/* =====================================================================
   MULTIPLAYER — servidor autoritativo + clientes (só roda se MP.role != null)
   - O SERVIDOR (Node, pasta server/) roda esta mesma simulação sem tela. Cada humano
     controla um agente (A0–A4 time A, B0–B4 time B); as vagas sem humano ficam com bots.
   - O CLIENTE envia um comando (32 bytes, 06-net.js) a cada passo de 60 Hz e recebe
     snapshots (20 Hz) + eventos (tiros, sons, explosões…). Ele prevê só o próprio movimento
     (stepAgentInput com moveOnly) e corrige com o que o servidor confirmou (ack + repetição
     dos comandos que o servidor ainda não viu). Os outros jogadores aparecem ~100 ms no
     passado, interpolados entre dois snapshots (movimento liso mesmo com a rede oscilando).
   - COMPENSAÇÃO DE ATRASO: cada comando diz qual passo do servidor o jogador estava vendo (vt).
     O servidor guarda ~1 s de posições e confere o tiro contra a posição daquele passo
     (no máximo 0,35 s para trás). Quem acerta na própria tela, acerta no servidor.
   - RECONEXÃO: quem cai vira bot (vivo) e a vaga fica guardada; ao voltar, reassume o boneco.
   - Eventos: o servidor não tem tela; os ganchos HOOK viram eventos enviados aos clientes.
     Cada evento pode ter destino (to = id do agente) — ferimento, marcador de acerto, cegueira.
   Nada aqui é usado no modo solo (MP.role === null).
   ===================================================================== */
const MP = {
  role: null,
  rems: new Map(),
  inRem: -1,
  replay: false,
  evq: [],
  R: null,
  gi: -1,
  pend: [],
  ctick: 0,
  snapN: 0,
  snapEvery: 3,
  forceSnap: false,
  lastAck: 0,
  dummy: null,
  dev: false,
  sig: '',
  lastA: null,
  lastG: null,
  hist: null /* servidor: anel de posições por agente (compensação de atraso) */,
  histMin: 0,
  lcTick: 0 /* > 0 enquanto um tiro de humano é conferido no passado */,
  rewSum: 0,
  rewN: 0,
  st: null /* cliente: passo do servidor estimado agora */,
  jit: 0,
  rt: 0 /* cliente: passo em que os outros bonecos estão sendo mostrados */,
  resync: false,
};
const MP_HN = 64 /* passos guardados (1,07 s) */,
  MP_HF = 7,
  MP_REW_MAX = 21 /* volta no máximo 0,35 s */,
  MP_INTERP = 6; /* atraso de exibição dos outros: 2 snapshots (100 ms) */
const MP_EDGE =
  NET_BTN.vault | NET_BTN.reload | NET_BTN.gadget | NET_BTN.melee | NET_BTN.ping | NET_BTN.jump;
const MP_FORCE = new Set(['roundStart', 'agentSpawn', 'structuresReset', 'matchOver', 'roundEnd']);
function mpRefs() {
  if (!MP.R) {
    const m = new Map();
    WALLS.forEach((w, i) => m.set(w, { $w: i }));
    DOORS.forEach((d, i) => m.set(d, { $d: i }));
    WINS.forEach((w, i) => m.set(w, { $n: i }));
    agents.forEach((a) => m.set(a, { $a: a.id }));
    MP.R = m;
  }
  return MP.R;
}
/* ---------- dados do jogador remoto (validados: o cliente não manda nada que o jogo não aceite) ---------- */
function mpCleanInfo(info) {
  info = info || {};
  const out = {
    name:
      String(info.name || 'Jogador')
        .replace(/[^\p{L}\p{N} _.\-]/gu, '')
        .slice(0, 14) || 'Jogador',
    atkOp: null,
    defOp: null,
    load: {},
    att: {},
    skins: {},
  };
  const okOp = (id, side) => (OPS[side].some((o) => o.id === id) ? id : OPS[side][0].id);
  out.atkOp = okOp(info.atkOp, 'atk');
  out.defOp = okOp(info.defOp, 'def');
  for (const side of ['atk', 'def'])
    for (const o of OPS[side]) {
      const L = info.load && info.load[o.id];
      if (L && o.prims.includes(L.p) && o.secs.includes(L.s)) out.load[o.id] = { p: L.p, s: L.s };
    }
  if (info.att)
    for (const id in info.att) {
      if (WEAPONS[id] && !id.includes('@') && typeof info.att[id] === 'object')
        out.att[id] = attValid(id, info.att[id]);
    }
  if (info.skins)
    for (const id in info.skins) {
      if (WEAPONS[id] && !id.includes('@') && SKINS.some((s) => s.id === info.skins[id]))
        out.skins[id] = info.skins[id];
    }
  return out;
}
function mpOpFor(a, role) {
  const r = MP.rems.get(a.id);
  const id = r && (role === 'atk' ? r.info.atkOp : r.info.defOp);
  return opById(id);
}
function mpLoadoutOf(a) {
  const r = MP.rems.get(a.id),
    op = a.op,
    L = (r && r.info.load[op.id]) || { p: op.prims[0], s: op.secs[0] };
  return { p: wVariant(L.p, r && r.info.att[L.p]), s: wVariant(L.s, r && r.info.att[L.s]) };
}
/* evento para os clientes (to: id do agente que deve reagir, ou undefined = todos) */
function mpEv(to, name, ...args) {
  if (MP.role !== 'server') return;
  if (MP.evq.length > 800) return;
  MP.evq.push({ n: name, to, a: args.map((x) => netSer(x, mpRefs(), 1)) });
  if (MP_FORCE.has(name)) MP.forceSnap = true;
  if (name === 'roundStart')
    MP.histMin = NET.tick + 1; /* rodada nova: ninguém é conferido na posição da rodada anterior */
}
/* ---------- compensação de atraso (servidor) ---------- */
function mpHistRecord() {
  if (!MP.hist) MP.hist = agents.map(() => new Float32Array(MP_HN * MP_HF));
  const k = (NET.tick % MP_HN) * MP_HF;
  for (const a of agents) {
    const h = MP.hist[a.id];
    h[k] = a.pos.x;
    h[k + 1] = a.pos.y;
    h[k + 2] = a.pos.z;
    h[k + 3] = a.yaw;
    h[k + 4] = a.lean || 0;
    h[k + 5] = a.crouchK;
    h[k + 6] = a.alive ? 1 : 0;
  }
}
const _lc = { x: 0, y: 0, z: 0, yaw: 0, lean: 0, ck: 0 };
/* posição do agente e no passo MP.lcTick (null = usa a atual) */
function mpLcState(e) {
  if (e.id === MP.inRem || !MP.hist) return null;
  const t = MP.lcTick,
    t0 = Math.floor(t),
    f = t - t0,
    h = MP.hist[e.id],
    i0 = (t0 % MP_HN) * MP_HF,
    i1 = ((t0 + 1) % MP_HN) * MP_HF;
  if (h[i0 + 6] < 0.5 || (f > 0 && h[i1 + 6] < 0.5)) return null;
  _lc.x = h[i0] + (h[i1] - h[i0]) * f;
  _lc.y = h[i0 + 1] + (h[i1 + 1] - h[i0 + 1]) * f;
  _lc.z = h[i0 + 2] + (h[i1 + 2] - h[i0 + 2]) * f;
  _lc.yaw = h[i0 + 3];
  _lc.lean = h[i0 + 4] + (h[i1 + 4] - h[i0 + 4]) * f;
  _lc.ck = h[i0 + 5] + (h[i1 + 5] - h[i0 + 5]) * f;
  return _lc;
}
/* ---------- servidor ---------- */
const MP_BCAST = [
  'roundStart',
  'structuresReset',
  'panelBroken',
  'wallChanged',
  'reinforce',
  'doorBroken',
  'winBroken',
  'impact',
  'blood',
  'boom',
  'sparks',
  'flash',
  'shot',
  'melee',
  'reload',
  'throw',
  'agentKilled',
  'actionStart',
  'planted',
  'siteFound',
  'roundEnd',
  'matchOver',
  'agentSpawn',
];
function mpServerInit() {
  MP.role = 'server';
  NET.dec = 1000;
  MP.R = null;
  MP.lastA = null;
  MP.lastG = null;
  MP.rems.clear();
  MP.evq.length = 0;
  MP.forceSnap = false;
  MP.snapN = 0;
  MP.hist = null;
  MP.histMin = 0;
  MP.lcTick = 0;
  for (const a of agents) {
    a.isPlayer = false;
    a.bot = true;
    a.rem = false;
  }
  /* "player" não é ninguém no servidor: um agente fantasma (fora da lista) que nunca vive */
  MP.dummy = {
    id: -1,
    name: '-',
    team: 'A',
    side: 'def',
    isPlayer: false,
    bot: true,
    alive: false,
    pos: new V3(),
    vel: new V3(),
    yaw: 0,
    pitch: 0,
    crouchK: 0,
    lean: 0,
    ads: 0,
    w: { p: mkW('pistol'), s: mkW('pistol') },
    cur: 'p',
    ai: {},
  };
  player = MP.dummy;
  G.autoplay = false;
  G.phase = 'menu';
  for (const k of MP_BCAST) HOOK[k] = (...args) => mpEv(undefined, k, ...args);
  HOOK.hurt = (att, dmg, v) => {
    if (v) mpEv(v.id, 'hurt', att);
  };
  HOOK.hitmark = (head, kill, att) => {
    if (att) mpEv(att.id, 'hitmark', head, kill);
  };
  HOOK.blind = (t, e) => {
    if (e) mpEv(e.id, 'blind', t);
  };
  HOOK.draw = (a) => {
    if (a && a.rem) mpEv(a.id, 'draw', a);
  };
  HOOK.prompt = (txt, t) => {
    if (MP.inRem >= 0) mpEv(MP.inRem, 'prompt', txt, t);
    else mpEv(undefined, 'prompt', txt, t);
  };
  HOOK.sound = (k, p) => {
    if (k === 'vault') return;
    if (p) mpEv(undefined, 'sound', k, p);
    else if (MP.inRem >= 0) mpEv(MP.inRem, 'sound', k);
  };
  HOOK.land = () => {};
  HOOK.banner = () => {};
}
/* um humano assume o agente idx (só entre partidas: a vaga é um bot até a partida começar) */
function mpAddHuman(idx, info) {
  const a = agents[idx];
  if (!a || MP.rems.has(idx)) return null;
  const r = {
    a,
    q: [],
    last: null,
    lastT: -1,
    ack: 0,
    rp: 0,
    ry: 0,
    starve: 0,
    info: mpCleanInfo(info),
  };
  MP.rems.set(idx, r);
  a.rem = true;
  a.isPlayer = true;
  a.bot = false;
  a.name = r.info.name;
  a.skins = r.info.skins;
  return r;
}
function mpUpdateInfo(idx, info) {
  const r = MP.rems.get(idx);
  if (!r) return;
  r.info = mpCleanInfo(info);
  r.a.name = r.info.name;
  r.a.skins = r.info.skins;
}
/* a conexão caiu ou o jogador saiu: um bot assume o boneco na hora, vivo (o time não fica com um a menos).
   Se o jogador voltar, mpAddHuman devolve o controle. */
function mpDetachHuman(idx) {
  const a = agents[idx];
  MP.rems.delete(idx);
  if (!a) return;
  a.rem = false;
  a.isPlayer = false;
  a.bot = true;
  a.act = null;
  AI.adopt(a);
}
/* média de passos voltados na compensação de atraso desde a última leitura (para o log do servidor) */
function mpNetStats() {
  const o = { rew: MP.rewN ? MP.rewSum / MP.rewN : 0, n: MP.rewN };
  MP.rewSum = MP.rewN = 0;
  return o;
}
/* próximo snapshot vai completo (alguém acabou de voltar para a partida) */
function mpForceFull() {
  MP.forceSnap = true;
  MP.lastA = null;
  MP.sig = '';
}
/* fim da partida: o agente morre na hora e volta a ser bot */
function mpRemoveHuman(idx) {
  const a = agents[idx];
  MP.rems.delete(idx);
  if (!a) return;
  a.rem = false;
  a.isPlayer = false;
  a.bot = true;
  if (a.alive && G.phase !== 'menu' && G.phase !== 'over') {
    a.alive = false;
    a.hp = 0;
    a.act = null;
    for (const c of a.charges) removeProp(c);
    a.charges = [];
    HOOK.agentKilled(a, null, '', false);
  }
}
function mpRecvCmd(idx, u8) {
  const r = MP.rems.get(idx);
  if (!r || !u8 || u8.length < NET_CMD_BYTES) return;
  const c = decodeCmd(u8);
  if (!isFinite(c.yaw + c.pitch) || c.t <= r.lastT) return;
  if (!isFinite(c.vt)) c.vt = 0;
  c.fwd = clamp(c.fwd, -1, 1);
  c.side = clamp(c.side, -1, 1);
  c.lean = clamp(c.lean, -1, 1);
  c.pitch = clamp(c.pitch, -1.45, 1.45);
  r.lastT = c.t;
  r.q.push(c);
  if (r.q.length > 240) r.q.splice(0, r.q.length - 60);
}
function mpNextCmd(r) {
  let c;
  if (r.q.length > 8)
    r.q.splice(
      0,
      r.q.length - 3
    ); /* fila encheu (rede segurou e soltou): descarta o excesso, mantendo os botões de um toque */
  if (r.q.length > 2) {
    const c1 = r.q.shift();
    c = r.q.shift();
    c.b |= c1.b & MP_EDGE;
    if (!c.slot) c.slot = c1.slot;
    r.starve = 0;
  } else if (r.q.length) {
    c = r.q.shift();
    r.starve = 0;
  } else {
    r.starve++;
    c = Object.assign(
      {},
      r.last || {
        t: r.ack,
        fwd: 0,
        side: 0,
        lean: 0,
        slot: null,
        b: 0,
        yaw: r.a.yaw,
        pitch: r.a.pitch,
        dyaw: 0,
        dpitch: 0,
      }
    );
    c.b &= ~MP_EDGE;
    c.slot = null;
    if (r.starve > 20) {
      c.fwd = c.side = 0;
      c.b = 0;
    }
  }
  r.last = c;
  return c;
}
function mpCmdToI(c) {
  const I = { fwd: c.fwd, side: c.side, lean: c.lean, slot: c.slot };
  for (const k in NET_BTN) I[k] = !!(c.b & NET_BTN[k]);
  return I;
}
function remoteStep(r, dt) {
  const a = r.a,
    c = mpNextCmd(r);
  r.ack = Math.max(r.ack, c.t);
  a.yaw = c.yaw;
  a.pitch = c.pitch;
  if (!a.alive) return;
  const y0 = a.yaw,
    p0 = a.pitch;
  MP.inRem = a.id;
  /* tiros deste passo são conferidos contra o que o jogador via (vt), limitado a MP_REW_MAX passos */
  const n1 = NET.tick - 1;
  MP.lcTick = 0;
  if (c.vt > 0 && MP.hist && !r.starve) {
    const lo = Math.max(n1 - MP_REW_MAX, MP.histMin, n1 - MP_HN + 2, 1);
    const t = clamp(c.vt, lo, n1);
    if (lo <= n1 && t < n1 - 0.01) {
      MP.lcTick = t;
      MP.rewSum += n1 - t;
      MP.rewN++;
    }
  }
  try {
    stepAgentInput(a, mpCmdToI(c), dt, false);
  } finally {
    MP.inRem = -1;
    MP.lcTick = 0;
  }
  r.rp += a.pitch - p0;
  r.ry += a.yaw - y0;
}
function remoteStepAll(dt) {
  for (const r of MP.rems.values()) remoteStep(r, dt);
}
/* um passo do servidor: simulação + pacote (devolve null ou {t,e,s?} com o que mandar aos clientes neste passo) */
function mpServerStep(dt) {
  NET.tick++;
  simStep(dt);
  mpHistRecord();
  MP.snapN++;
  const due = MP.snapN >= MP.snapEvery || MP.forceSnap;
  if (!due && !MP.evq.length) return null;
  const out = { t: NET.tick, e: MP.evq };
  MP.evq = [];
  if (due) {
    const full = MP.forceSnap || NET.tick % 300 === 0 || !MP.lastA;
    MP.snapN = 0;
    MP.forceSnap = false;
    const sn = snapshot();
    /* paredes/portas/janelas raramente mudam: só vão quando mudaram */
    const sig = JSON.stringify([sn.walls, sn.doors, sn.wins]);
    if (sig === MP.sig && !full) {
      delete sn.walls;
      delete sn.doors;
      delete sn.wins;
    } else MP.sig = sig;
    /* delta: de cada agente (e do G) só vão os campos que mudaram desde o último snapshot (o cliente mantém o resto); a cada ~5 s e a cada evento forte vai completo */
    if (full || !MP.lastA) {
      MP.lastA = sn.agents.map(() => ({}));
      MP.lastG = {};
    }
    const dl = (o, last) => {
      for (const k in o) {
        if (k === 'id') continue;
        const j = JSON.stringify(o[k]);
        if (last[k] === j) delete o[k];
        else last[k] = j;
      }
    };
    sn.agents.forEach((o, i) => dl(o, MP.lastA[i]));
    dl(sn.G, MP.lastG);
    out.s = sn;
  }
  return out;
}
/* cabeçalho por jogador: o que o servidor já viu dele + ajuste de mira (recuo) a somar na mira do cliente */
function mpClientHdr(idx) {
  const r = MP.rems.get(idx);
  if (!r) return null;
  const h = { ack: r.ack, rp: +r.rp.toFixed(5), ry: +r.ry.toFixed(5) };
  r.rp = r.ry = 0;
  return h;
}
/* começa uma partida com os humanos atuais (os outros agentes são bots) */
function mpStartMatch() {
  SAVE.startSide = Math.random() < 0.5 ? 'atk' : 'def';
  for (const a of agents) {
    a.bot = !a.rem;
    a.isPlayer = !!a.rem;
  }
  G.autoplay = false;
  G.phase = 'prep';
  newMatch();
  return SAVE.startSide;
}
function mpEndMatch() {
  G.phase = 'menu';
  for (const a of agents) {
    a.alive = false;
  }
  clearProps();
}

/* ---------- cliente ---------- */
function mpPredict(a, c, dt) {
  if (!a.alive) return;
  stepAgentInput(a, mpCmdToI(c), dt, true);
}
function mpFixRoles() {
  for (const a of agents) {
    a.isPlayer = a.id === MP.gi;
    a.bot = a.id !== MP.gi;
    a.rem = false;
  }
  player = agents[MP.gi];
}
function mpClientInit(gi) {
  MP.role = 'guest';
  MP.gi = gi;
  MP.pend.length = 0;
  MP.ctick = 0;
  MP.lastAck = 0;
  mpFixRoles();
  G.autoplay = false;
  MP.st = null;
  MP.jit = 0;
  MP.rt = 0;
  for (const a of agents) {
    a._hb = null;
    a._B = null;
  }
}
/* ---------- cliente: relógio do servidor e interpolação dos outros bonecos ---------- */
/* chegou um snapshot do passo t: ajusta devagar a estimativa do passo atual do servidor (absorve a oscilação da rede) */
function mpClock(t) {
  if (MP.st == null) {
    MP.st = t;
    MP.jit = 0;
    return;
  }
  const err = t - MP.st;
  if (Math.abs(err) > 30) MP.st = t;
  else {
    MP.st += err * 0.1;
    MP.jit += (Math.abs(err) - MP.jit) * 0.1;
  }
}
/* atraso de exibição: 100 ms + folga proporcional à oscilação medida (até 250 ms) */
function mpDelay() {
  return MP_INTERP + Math.min(9, MP.jit * 2);
}
function mpPushSample(o, t) {
  const b = o._hb || (o._hb = []),
    last = b[b.length - 1];
  if (last && t <= last.t) return;
  if (last) {
    const dx = o.pos.x - last.x,
      dy = o.pos.y - last.y,
      dz = o.pos.z - last.z;
    if (dx * dx + dy * dy + dz * dz > 9 || last.alive !== o.alive)
      b.length = 0; /* nasceu de novo ou foi levado para longe: não desliza até lá */
  }
  b.push({
    t,
    x: o.pos.x,
    y: o.pos.y,
    z: o.pos.z,
    yaw: o.yaw,
    pitch: o.pitch,
    ck: o.crouchK,
    lean: o.lean || 0,
    alive: o.alive,
    vx: o.vel.x,
    vz: o.vel.z,
  });
  if (b.length > 24) b.shift();
}
/* põe cada boneco remoto na posição do passo MP.rt (entre duas amostras; sem amostra nova, segue a velocidade por até 0,2 s) */
function mpInterp() {
  const rt = MP.rt;
  for (const o of agents) {
    const b = o._hb;
    if (o === player || !b || !b.length) continue;
    let i = b.length - 1;
    while (i > 0 && b[i].t > rt) i--;
    const s0 = b[i],
      s1 = b[i + 1];
    if (s1 && rt >= s0.t) {
      const f = (rt - s0.t) / (s1.t - s0.t);
      o.pos.set(s0.x + (s1.x - s0.x) * f, s0.y + (s1.y - s0.y) * f, s0.z + (s1.z - s0.z) * f);
      o.yaw = s0.yaw + angDiff(s1.yaw, s0.yaw) * f;
      o.pitch = s0.pitch + (s1.pitch - s0.pitch) * f;
      o.crouchK = s0.ck + (s1.ck - s0.ck) * f;
      o.lean = s0.lean + (s1.lean - s0.lean) * f;
    } else {
      let e = 0;
      if (!s1 && rt > s0.t && i > 0) {
        const p = b[i - 1];
        if (Math.abs(p.x - s0.x) + Math.abs(p.z - s0.z) > 1e-3)
          e =
            Math.min(rt - s0.t, 12) *
            SIM_DT; /* parado contra a parede tem velocidade mas não anda: não extrapola */
      }
      o.pos.set(s0.x + s0.vx * e, s0.y, s0.z + s0.vz * e);
      o.yaw = s0.yaw;
      o.pitch = s0.pitch;
      o.crouchK = s0.ck;
      o.lean = s0.lean;
    }
  }
}
function mpClientLeave() {
  MP.role = null;
  MP.gi = -1;
  MP.pend.length = 0;
  for (const a of agents) {
    a.rem = false;
    a.bot = true;
    a.isPlayer = false;
    a._hb = null;
    a._B = null;
  }
  MP.st = null;
  agents[0].isPlayer = true;
  agents[0].bot = false;
  player = agents[0];
  agents.forEach((a, i) => {
    a.name = i === 0 ? SAVE.name || 'Você' : i < 5 ? BOTNAMES.A[i - 1] : BOTNAMES.B[i - 5];
  });
}
function mpRoundBanner() {
  const S = SITES[G.siteKey];
  HOOK.banner(
    `Rodada ${G.round} · Preparação`,
    player.side === 'atk'
      ? `Você está no ataque · objetivo ${S.key}: ${S.name}`
      : `Você está na defesa · objetivo ${S.key}: ${S.name} · segure F para reforçar paredes`,
    '',
    4
  );
}
/* chega um pacote do servidor: hdr = {ack,rp,ry} (só para o dono), pk = {t,s?,e} */
function mpClientRecv(pk, hdr) {
  const me = player,
    yaw = me.yaw,
    pitch = me.pitch;
  if (pk.s) {
    /* o delta só traz o que mudou: antes de aplicar, cada boneco volta ao último estado que o servidor mandou
       (o que está na tela é a posição interpolada, não a do servidor) */
    for (const o of agents)
      if (o !== me && o._B) {
        o.pos.copy(o._B);
        o.yaw = o._Byaw;
        o.pitch = o._Bpitch;
        o.crouchK = o._Bck;
        o.lean = o._Blean;
      }
    restoreSnapshot(pk.s);
    mpFixRoles();
    if (MP.resync && pk.s.walls) {
      MP.resync = false;
      HOOK.resync(); /* voltou de uma queda de conexão: paredes, portas e janelas são redesenhadas pelo estado */
    }
    if (G.planted && !MP.dev) {
      MP.dev = true;
      HOOK.deviceAdd(G.planted);
    } else if (!G.planted && MP.dev) {
      MP.dev = false;
      HOOK.deviceRemove();
    }
    mpClock(pk.t);
    for (const o of agents) {
      if (o === me) continue;
      if (!o._B) o._B = new V3();
      o._B.copy(o.pos);
      o._Byaw = o.yaw;
      o._Bpitch = o.pitch;
      o._Bck = o.crouchK;
      o._Blean = o.lean || 0;
      mpPushSample(o, pk.t);
    }
    MP.rt = MP.st - mpDelay();
    mpInterp();
    player.yaw = yaw;
    player.pitch = pitch;
    if (hdr) {
      player.pitch = clamp(player.pitch + (hdr.rp || 0), -1.45, 1.45);
      player.yaw += hdr.ry || 0;
      MP.lastAck = hdr.ack;
      MP.pend = MP.pend.filter((c) => c.t > hdr.ack);
      MP.replay = true;
      try {
        for (const c of MP.pend) mpPredict(player, c, SIM_DT);
      } finally {
        MP.replay = false;
      }
    }
  } else if (hdr) {
    player.pitch = clamp(player.pitch + (hdr.rp || 0), -1.45, 1.45);
    player.yaw += hdr.ry || 0;
  }
  if (pk.e)
    for (const e of pk.e) {
      if (e.to !== undefined && e.to !== MP.gi) continue;
      let args;
      try {
        args = e.a.map((x) => netDes(x));
      } catch (err) {
        continue;
      }
      try {
        HOOK[e.n](...args);
        if (e.n === 'roundStart') mpRoundBanner();
      } catch (err) {
        console.warn('evento', e.n, err);
      }
    }
}
/* um passo local do cliente (60 Hz): envia o comando, prevê o próprio movimento e interpola os outros */
function mpClientStep(dt, send, live) {
  const a = player;
  if (live) {
    const c = captureCmd(MP.ctick++, a);
    MP.pend.push(c);
    if (MP.pend.length > 180) MP.pend.shift();
    send(encodeCmd(c));
    MP.replay = false;
    mpPredict(a, c, dt);
    clearEdges();
  } else {
    const c = captureCmd(MP.ctick++, a);
    c.b = 0;
    c.fwd = c.side = c.lean = 0;
    c.slot = null;
    MP.pend.push(c);
    if (MP.pend.length > 180) MP.pend.shift();
    send(encodeCmd(c));
  } /* menu aberto/pausado: segue mandando comandos neutros (o servidor não deixa o boneco "andando sozinho") */
  if (MP.st != null) {
    MP.st += dt / SIM_DT;
    MP.rt = MP.st - mpDelay();
    mpInterp();
  }
  for (const p of projectiles) {
    if (p.vel && p.pos) p.pos.addScaledVector(p.vel, dt);
  }
}
