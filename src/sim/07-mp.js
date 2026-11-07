/* =====================================================================
   MULTIPLAYER — servidor autoritativo + clientes (só roda se MP.role != null)
   - O SERVIDOR (Node, pasta server/) roda esta mesma simulação sem tela. Cada humano
     controla um agente (A0–A4 time A, B0–B4 time B); as vagas sem humano ficam com bots.
   - O CLIENTE envia um comando (28 bytes, 06-net.js) a cada passo de 60 Hz e recebe
     snapshots (20 Hz) + eventos (tiros, sons, explosões…). Ele prevê só o próprio movimento
     (stepAgentInput com moveOnly) e corrige com o que o servidor confirmou (ack + repetição
     dos comandos que o servidor ainda não viu). Os outros jogadores são extrapolados e
     suavizados.
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
};
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
/* sai da partida: o agente morre na hora (não deixa o time com um boneco parado) e volta a ser bot na próxima rodada */
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
  if (!r || !u8 || u8.length < 28) return;
  const c = decodeCmd(u8);
  if (!isFinite(c.yaw + c.pitch) || c.t <= r.lastT) return;
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
  try {
    stepAgentInput(a, mpCmdToI(c), dt, false);
  } finally {
    MP.inRem = -1;
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
  for (const a of agents) {
    a._S = null;
    a._ofs = null;
    a._B = null;
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
    a._S = null;
    a._ofs = null;
  }
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
    for (const o of agents)
      if (o !== me && o._S) {
        o._vx = o.pos.x;
        o._vy = o.pos.y;
        o._vz = o.pos.z;
        o._vyaw = o.yaw;
        o._vpitch = o.pitch;
        o._had = true;
        if (o._B) {
          o.pos.copy(o._B);
          o.yaw = o._Byaw;
          o.pitch = o._Bpitch;
        }
      } else
        o._had = false; /* o delta só traz quem mudou: parte da posição do servidor, não da posição extrapolada */
    restoreSnapshot(pk.s);
    mpFixRoles();
    if (G.planted && !MP.dev) {
      MP.dev = true;
      HOOK.deviceAdd(G.planted);
    } else if (!G.planted && MP.dev) {
      MP.dev = false;
      HOOK.deviceRemove();
    }
    for (const o of agents) {
      if (o === me) continue;
      if (!o._S) o._S = new V3();
      if (!o._B) o._B = new V3();
      o._still = o._had && Math.abs(o._B.x - o.pos.x) + Math.abs(o._B.z - o.pos.z) < 1e-3;
      o._B.copy(o.pos);
      o._Byaw = o.yaw;
      o._Bpitch = o.pitch;
      o._S.copy(o.pos);
      o._Syaw = o.yaw;
      o._Spitch = o.pitch;
      if (o._had && o.alive) {
        const dx = o._vx - o.pos.x,
          dy = o._vy - o.pos.y,
          dz = o._vz - o.pos.z;
        if (dx * dx + dy * dy + dz * dz < 9) {
          if (!o._ofs) o._ofs = new V3();
          o._ofs.set(dx, dy, dz);
          o._oyaw = angDiff(o._vyaw, o.yaw);
          o._opitch = o._vpitch - o.pitch;
        } else o._ofs = null;
      } else o._ofs = null;
    }
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
/* um passo local do cliente (60 Hz): envia o comando, prevê o próprio movimento e extrapola/suaviza os outros */
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
  const k = Math.exp(-dt * 11);
  for (const o of agents) {
    if (o === a) continue;
    if (o._S && o.alive) {
      if (!o._still) {
        o._S.x += o.vel.x * dt;
        o._S.z += o.vel.z * dt;
      }
      if (o._ofs) {
        o._ofs.multiplyScalar(k);
        o._oyaw *= k;
        o._opitch *= k;
        o.pos.set(o._S.x + o._ofs.x, o._S.y + o._ofs.y, o._S.z + o._ofs.z);
        o.yaw = o._Syaw + o._oyaw;
        o.pitch = o._Spitch + o._opitch;
      } else {
        o.pos.copy(o._S);
      }
    }
  }
  for (const p of projectiles) {
    if (p.vel && p.pos) p.pos.addScaledVector(p.vel, dt);
  }
}
