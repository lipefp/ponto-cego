/* =====================================================================
   PREPARAÇÃO PARA MULTIPLAYER (v4) — comandos de entrada e snapshots
   Nada aqui muda regras: só formaliza as fronteiras que já existiam.
   - ENTRADA → COMANDO: a cada passo de 60 Hz o jogo captura INPUT + mira
     (yaw/pitch do jogador e do drone) num comando serializável (28 bytes).
     A simulação recebe o comando por applyCmd() → INPUT, como antes.
     netStep(dt) = captura → registra (NET.log, anel de 10 s) → aplica → simStep.
     No multiplayer: o cliente envia encodeCmd(cmd); o servidor faz
     applyCmd(cmd, agente) + simStep e devolve snapshots.
   - ESTADO → SNAPSHOT: snapshot() devolve o estado replicável (agentes,
     placar, fase, estruturas, projéteis, objetos, drone) em JSON puro;
     restoreSnapshot(s) aplica de volta (mantém identidade dos objetos
     V3 e das estruturas). Referências viram índices ({$a}, {$w}, {$d}…).
     O cérebro das IAs (a.ai) e as métricas de QA (G.stats) ficam fora.
   Limitação conhecida: a simulação usa Math.random (não há semente
   compartilhada) — reprodução exata de partidas exige trocar por um RNG
   com semente; o servidor autoritativo não precisa disso.
   ===================================================================== */
const NET = {
  VERSION: 1,
  tick: 0,
  log: [],
  logMax: 600,
  local: true,
  dec: 0,
}; /* dec: casas decimais dos snapshots (0 = exato; o servidor usa 1000) */
const NET_BTN = {
  walk: 1,
  sprint: 2,
  crouch: 4,
  ads: 8,
  fire: 16,
  interact: 32,
  vault: 64,
  reload: 128,
  gadget: 256,
  melee: 512,
  ping: 1024,
  jump: 2048,
};
const NET_SLOT = { p: 1, s: 2 };
/* comando = tudo que a simulação lê do jogador local num passo */
function captureCmd(tick, a) {
  a = a || player;
  const I = INPUT;
  let b = 0;
  for (const k in NET_BTN) if (I[k]) b |= NET_BTN[k];
  return {
    t: tick | 0,
    fwd: I.fwd,
    side: I.side,
    lean: I.lean,
    slot: I.slot,
    b,
    yaw: a.yaw,
    pitch: a.pitch,
    dyaw: drone.yaw,
    dpitch: drone.pitch,
  };
}
function applyCmd(c, a) {
  a = a || player;
  const I = INPUT;
  I.fwd = c.fwd;
  I.side = c.side;
  I.lean = c.lean;
  I.slot = c.slot || null;
  for (const k in NET_BTN) I[k] = !!(c.b & NET_BTN[k]);
  a.yaw = c.yaw;
  a.pitch = c.pitch;
  if (a === player) {
    drone.yaw = c.dyaw;
    drone.pitch = c.dpitch;
  }
}
/* binário compacto (28 bytes): tick u32 · fwd/side/lean i8 · slot u8 · botões u16 · yaw/pitch/droneYaw/dronePitch f32 */
function encodeCmd(c, out) {
  const u = out || new Uint8Array(28),
    d = new DataView(u.buffer, u.byteOffset, 28);
  d.setUint32(0, c.t >>> 0, true);
  d.setInt8(4, c.fwd);
  d.setInt8(5, c.side);
  d.setInt8(6, c.lean);
  d.setUint8(7, NET_SLOT[c.slot] || 0);
  d.setUint16(8, c.b, true);
  d.setFloat32(12, c.yaw, true);
  d.setFloat32(16, c.pitch, true);
  d.setFloat32(20, c.dyaw, true);
  d.setFloat32(24, c.dpitch, true);
  return u;
}
function decodeCmd(u) {
  const d = new DataView(u.buffer, u.byteOffset, 28),
    s = d.getUint8(7);
  return {
    t: d.getUint32(0, true),
    fwd: d.getInt8(4),
    side: d.getInt8(5),
    lean: d.getInt8(6),
    slot: s === 1 ? 'p' : s === 2 ? 's' : null,
    b: d.getUint16(8, true),
    yaw: d.getFloat32(12, true),
    pitch: d.getFloat32(16, true),
    dyaw: d.getFloat32(20, true),
    dpitch: d.getFloat32(24, true),
  };
}
/* passo local com comando (o laço principal usa este no lugar de simStep) */
function netStep(dt) {
  const c = captureCmd(NET.tick++);
  NET.log.push(c);
  if (NET.log.length > NET.logMax) NET.log.splice(0, NET.log.length - NET.logMax);
  applyCmd(c);
  simStep(dt);
  return c;
}

/* ---------- snapshot ---------- */
const NET_SKIP_AGENT = { ai: 1, _st: 1, _pelT: 1, _pelHp: 1, _pp: 1, _al: 1 };
function netRefs() {
  const m = new Map();
  WALLS.forEach((w, i) => m.set(w, { $w: i }));
  DOORS.forEach((d, i) => m.set(d, { $d: i }));
  WINS.forEach((w, i) => m.set(w, { $n: i }));
  agents.forEach((a) => m.set(a, { $a: a.id }));
  if (G.planted) m.set(G.planted, { $pl: 1 });
  return m;
}
function netOpById(id) {
  for (const s of ['atk', 'def']) for (const o of OPS[s]) if (o.id === id) return o;
  return null;
}
function netSer(v, R, depth, top) {
  if (v === null || v === undefined || typeof v !== 'object')
    return typeof v === 'function'
      ? undefined
      : typeof v === 'number'
        ? !isFinite(v)
          ? { $x: String(v) }
          : NET.dec && v % 1 !== 0
            ? Math.round(v * NET.dec) / NET.dec
            : v
        : v;
  if (!top && R.has(v)) return R.get(v);
  if (v instanceof V3) return { $v: [v.x, v.y, v.z] };
  if (ArrayBuffer.isView(v)) return { $f: Array.from(v) };
  if ((depth | 0) > 6) return undefined;
  if (Array.isArray(v)) return v.map((x) => netSer(x, R, depth + 1));
  const pr = Object.getPrototypeOf(v);
  if (pr !== null && Object.getPrototypeOf(pr) !== null)
    return undefined; /* só objetos simples: malhas/nós de renderização presos aos agentes não são estado */
  if (v.prims && v.secs && v.id && v.gadget !== undefined)
    return { $o: v.id }; /* operador (dados estáticos) */
  const o = {};
  for (const k in v) {
    if (depth === 0 && NET_SKIP_AGENT[k]) continue;
    const s = netSer(v[k], R, depth + 1);
    if (s !== undefined) o[k] = s;
  }
  return o;
}
function netDes(v, prev) {
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map((x) => netDes(x));
  if (v.$x !== undefined) return Number(v.$x);
  if (v.$v) {
    if (prev instanceof V3) return prev.set(v.$v[0], v.$v[1], v.$v[2]);
    return new V3(v.$v[0], v.$v[1], v.$v[2]);
  }
  if (v.$f) {
    if (prev && ArrayBuffer.isView(prev) && prev.length === v.$f.length) {
      prev.set(v.$f);
      return prev;
    }
    return Float32Array.from(v.$f);
  }
  if (v.$w !== undefined) return WALLS[v.$w];
  if (v.$d !== undefined) return DOORS[v.$d];
  if (v.$n !== undefined) return WINS[v.$n];
  if (v.$a !== undefined) return agents[v.$a];
  if (v.$o !== undefined) return netOpById(v.$o);
  if (v.$pl !== undefined) return G.planted;
  const o =
    prev && typeof prev === 'object' && !Array.isArray(prev) && !(prev instanceof V3) ? prev : {};
  for (const k in o) if (!(k in v)) delete o[k];
  for (const k in v) o[k] = netDes(v[k], o[k]);
  return o;
}
function snapshot() {
  const R = netRefs();
  const g = {};
  for (const k in G) {
    if (k === 'stats') continue;
    const s = netSer(
      G[k],
      k === 'planted' ? new Map([...R].filter((e) => e[0] !== G.planted)) : R,
      1
    );
    if (s !== undefined) g[k] = s;
  }
  const propIdx = new Map();
  PROPS.forEach((p, i) => propIdx.set(p, { $p: i }));
  const R2 = new Map([...R, ...propIdx]);
  return {
    v: NET.VERSION,
    tick: NET.tick,
    G: g,
    teams: { A: teams.A.score, B: teams.B.score },
    agents: agents.map((a) => {
      const o = netSer(a, R2, 0, true);
      delete o.charges;
      o.charges = a.charges.map((c) => (propIdx.has(c) ? propIdx.get(c) : null));
      return o;
    }),
    walls: WALLS.map((w) => [Array.from(w.p), w.reinforced ? 1 : 0]),
    doors: DOORS.map((d) => d.hp),
    wins: WINS.map((w) => (w.broken ? 1 : 0)),
    props: PROPS.map((p) => netSer(p, R, 1)),
    proj: projectiles.map((p) => netSer(p, R, 1)),
    drone: netSer(drone, R, 1),
  };
}
function restoreSnapshot(s) {
  if (!s || s.v !== NET.VERSION) throw new Error('snapshot incompatível');
  NET.tick = s.tick;
  for (const k in s.G) G[k] = netDes(s.G[k], G[k]);
  teams.A.score = s.teams.A;
  teams.B.score = s.teams.B;
  if (s.walls)
    s.walls.forEach((w, i) => {
      WALLS[i].p.set(w[0]);
      WALLS[i].reinforced = !!w[1];
    });
  if (s.doors)
    s.doors.forEach((h, i) => {
      DOORS[i].hp = h;
    });
  if (s.wins)
    s.wins.forEach((b, i) => {
      WINS[i].broken = !!b;
    });
  /* objetos soltos: se a lista tem o mesmo formato (mesmos tipos na mesma ordem) só atualiza no lugar — sem recriar malhas a cada snapshot */
  const sameList = (L, S) => L.length === S.length && L.every((x, i) => x.type === S[i].type);
  if (sameList(PROPS, s.props)) s.props.forEach((p, i) => netDes(p, PROPS[i]));
  else {
    for (const p of PROPS) HOOK.propRemove(p);
    PROPS.length = 0;
    for (const p of s.props) PROPS.push(netDes(p));
    for (const p of PROPS) HOOK.propAdd(p);
  }
  if (sameList(projectiles, s.proj)) s.proj.forEach((p, i) => netDes(p, projectiles[i]));
  else {
    for (const p of projectiles) HOOK.projRemove(p);
    projectiles.length = 0;
    for (const p of s.proj) projectiles.push(netDes(p));
    for (const p of projectiles) HOOK.projAdd(p);
  }
  s.agents.forEach((sa, i) => {
    const a = agents[i];
    if (!a) return;
    for (const k in sa) {
      if (k === 'charges') continue;
      a[k] = netDes(sa[k], a[k]);
    }
    if ('charges' in sa)
      a.charges = (sa.charges || [])
        .map((c) => (c && c.$p !== undefined ? PROPS[c.$p] : null))
        .filter(Boolean);
  });
  netDes(s.drone, drone);
}
