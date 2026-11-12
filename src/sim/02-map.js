/* =====================================================================
   MAPA — Prédio de Escritórios
   Grade de 36x28 células de 3 m. Tipos: 0 chão · 1 parede dura · 2 caixa
   3 parede fina destrutível (16 painéis) · 4 porta com barricada
   ===================================================================== */
const W = 36,
  H = 28;
const grid = [];
for (let z = 0; z < H; z++) grid.push(new Array(W).fill(0));
const setC = (x, z, v) => {
  if (x >= 0 && z >= 0 && x < W && z < H) grid[z][x] = v;
};
const BX0 = 7,
  BX1 = 28,
  BZ0 = 5,
  BZ1 = 22; // limites do prédio
(function buildMap() {
  for (let x = 0; x < W; x++) {
    setC(x, 0, 1);
    setC(x, H - 1, 1);
  }
  for (let z = 0; z < H; z++) {
    setC(0, z, 1);
    setC(W - 1, z, 1);
  }
  for (let x = BX0; x <= BX1; x++) {
    setC(x, BZ0, 1);
    setC(x, BZ1, 1);
  }
  for (let z = BZ0; z <= BZ1; z++) {
    setC(BX0, z, 1);
    setC(BX1, z, 1);
  }
  for (let z = BZ0 + 1; z < BZ1; z++) {
    setC(16, z, 3);
    setC(19, z, 3);
  } // paredes do corredor
  for (let x = 8; x <= 15; x++) setC(x, 13, 3); // escritório | arquivo
  for (let x = 20; x <= 27; x++) setC(x, 12, 3); // servidores | depósito
  setC(16, 13, 1);
  setC(19, 12, 1);
  [
    [7, 17],
    [7, 18],
    [28, 8],
    [28, 9],
    [12, 22],
    [24, 5],
  ].forEach(([x, z]) => setC(x, z, 3)); // paredes externas finas
  [
    [17, 5],
    [18, 5],
    [18, 22],
    [7, 9],
    [28, 17],
    [16, 9],
    [16, 18],
    [19, 8],
    [19, 17],
    [11, 13],
    [24, 12],
  ].forEach(([x, z]) => setC(x, z, 4)); // portas
  const crates = [
    [10, 16],
    [13, 17],
    [13, 20],
    [22, 7],
    [25, 10],
    [26, 7],
    [9, 7],
    [14, 11],
    [12, 8],
    [21, 20],
    [26, 15],
    [23, 18],
    [17, 15],
    [4, 6],
    [5, 11],
    [3, 19],
    [5, 24],
    [11, 3],
    [12, 3],
    [15, 2],
    [22, 3],
    [30, 4],
    [32, 10],
    [31, 15],
    [33, 21],
    [26, 25],
    [20, 25],
    [14, 25],
    [9, 25],
    [3, 8],
    [31, 24],
    [24, 2],
  ];
  crates.forEach(([x, z]) => setC(x, z, 2));
})();
const cellAt = (x, z) => (x < 0 || z < 0 || x >= W || z >= H ? 1 : grid[z][x]);
const cc = (v) => v * CELL + CELL / 2;
const inside = (x, z) => x > BX0 && x < BX1 && z > BZ0 && z < BZ1;
const SITES = {
  A: {
    key: 'A',
    name: 'Arquivo',
    x0: 9,
    x1: 14,
    z0: 15,
    z1: 20,
    room: { x0: 8, x1: 15, z0: 14, z1: 21 },
  },
  B: {
    key: 'B',
    name: 'Servidores',
    x0: 21,
    x1: 26,
    z0: 7,
    z1: 10,
    room: { x0: 20, x1: 27, z0: 6, z1: 11 },
  },
  C: {
    key: 'C',
    name: 'Escritório',
    x0: 9,
    x1: 14,
    z0: 7,
    z1: 11,
    room: { x0: 8, x1: 15, z0: 6, z1: 12 },
  },
  D: {
    key: 'D',
    name: 'Depósito',
    x0: 21,
    x1: 26,
    z0: 14,
    z1: 20,
    room: { x0: 20, x1: 27, z0: 13, z1: 21 },
  },
};
const SITE_KEYS = [
  'A',
  'B',
  'C',
  'D',
]; /* 4 locais de bomba (2 por andar no Siege; aqui, 4 salas) */
const siteCenter = (s) =>
  new V3((s.x0 + (s.x1 - s.x0 + 1) / 2) * CELL, 0, (s.z0 + (s.z1 - s.z0 + 1) / 2) * CELL);
const inSite = (s, p) => {
  const x = p.x / CELL,
    z = p.z / CELL;
  return x >= s.x0 && x < s.x1 + 1 && z >= s.z0 && z < s.z1 + 1;
};
const inRoom = (r, p) => {
  const x = p.x / CELL,
    z = p.z / CELL;
  return x >= r.x0 && x < r.x1 + 1 && z >= r.z0 && z < r.z1 + 1;
};
const ATK_SPAWNS = [
  { x0: 1, x1: 4, z0: 1, z1: 2 },
  { x0: 31, x1: 34, z0: 25, z1: 26 },
  { x0: 1, x1: 2, z0: 13, z1: 16 },
];
const ATK_NAMES = ['Entrada Noroeste', 'Entrada Sudeste', 'Entrada Oeste'];
const spawnCellsOf = (r) => {
  const o = [];
  for (let z = r.z0; z <= r.z1; z++)
    for (let x = r.x0; x <= r.x1; x++) if (cellAt(x, z) === 0) o.push({ x, z });
  return o;
};
const cellCenter = (c) => new V3(cc(c.x), 0, cc(c.z));

/* ---------- metadados táticos para a IA ----------
   entries: por onde o ataque entra em cada objetivo.
   s = estrutura (parede/porta) · stack = onde o time se junta antes · in = primeira célula dentro
   holds: cantos de onde a defesa segura os ângulos. */
const TACT = {
  A: {
    entries: [
      { name: 'parede oeste', s: [7, 17], stack: [5, 17], in: [9, 17] },
      { name: 'parede sul', s: [12, 22], stack: [12, 24], in: [11, 20] },
      { name: 'porta do corredor', s: [16, 18], stack: [17, 19], in: [14, 18] },
      { name: 'porta do escritório', s: [11, 13], stack: [11, 11], in: [11, 15] },
    ],
    holds: [
      [9, 15],
      [14, 15],
      [9, 21],
      [14, 21],
      [12, 18],
    ],
  },
  B: {
    entries: [
      { name: 'parede leste', s: [28, 8], stack: [30, 8], in: [26, 9] },
      { name: 'parede norte', s: [24, 5], stack: [24, 3], in: [24, 7] },
      { name: 'porta do corredor', s: [19, 8], stack: [18, 9], in: [21, 8] },
      { name: 'porta do depósito', s: [24, 12], stack: [24, 14], in: [24, 10] },
    ],
    holds: [
      [20, 6],
      [27, 6],
      [20, 11],
      [27, 11],
      [23, 9],
    ],
  },
  C: {
    entries: [
      { name: 'porta oeste', s: [7, 9], stack: [5, 9], in: [9, 9] },
      { name: 'porta do corredor', s: [16, 9], stack: [17, 9], in: [14, 9] },
      { name: 'porta do arquivo', s: [11, 13], stack: [11, 15], in: [11, 11] },
    ],
    holds: [
      [9, 6],
      [15, 6],
      [9, 12],
      [15, 12],
      [12, 9],
    ],
  },
  D: {
    entries: [
      { name: 'porta do corredor', s: [19, 17], stack: [18, 17], in: [21, 17] },
      { name: 'porta leste', s: [28, 17], stack: [30, 17], in: [26, 17] },
      { name: 'porta dos servidores', s: [24, 12], stack: [24, 10], in: [24, 14] },
    ],
    holds: [
      [20, 13],
      [27, 13],
      [20, 21],
      [27, 21],
      [23, 17],
    ],
  },
};

/* ---------- estruturas destrutíveis (barricadas têm vão de 32 cm embaixo, como no Siege) ---------- */
const PANEL_HP = 160; /* painel de drywall aguenta ~3–4 balas de fuzil (furo de bala não abre linha de visão na hora, como no Siege) */
const ORI = [];
for (let z = 0; z < H; z++) {
  ORI.push([]);
  for (let x = 0; x < W; x++) {
    const s = (v) => v === 1 || v === 3 || v === 4;
    ORI[z].push(s(cellAt(x, z - 1)) && s(cellAt(x, z + 1)) ? 'x' : 'z');
  }
}
const WALLS = [],
  DOORS = [];
const WIDX = new Int16Array(W * H).fill(-1),
  DIDX = new Int16Array(W * H).fill(-1);
for (let z = 0; z < H; z++)
  for (let x = 0; x < W; x++) {
    if (grid[z][x] === 3) {
      WIDX[z * W + x] = WALLS.length;
      WALLS.push({
        x,
        z,
        ori: ORI[z][x],
        p: new Float32Array(NP).fill(PANEL_HP),
        reinforced: false,
        ext: x === BX0 || x === BX1 || z === BZ0 || z === BZ1,
        idx: WALLS.length,
      });
    }
    if (grid[z][x] === 4) {
      DIDX[z * W + x] = DOORS.length;
      DOORS.push({ x, z, ori: ORI[z][x], hp: 100, idx: DOORS.length });
    }
  }
const wallAt = (x, z) => {
  const i = x < 0 || z < 0 || x >= W || z >= H ? -1 : WIDX[z * W + x];
  return i >= 0 ? WALLS[i] : null;
};
const doorAt = (x, z) => {
  const i = x < 0 || z < 0 || x >= W || z >= H ? -1 : DIDX[z * W + x];
  return i >= 0 ? DOORS[i] : null;
};
const structAt = (x, z) => wallAt(x, z) || doorAt(x, z);
const openCol = (w, c) => !w.reinforced && w.p[c] <= 0 && w.p[4 + c] <= 0;
const wallPassable = (w) => openCol(w, 1) && openCol(w, 2);
const structOpen = (s) => (s.p ? !s.reinforced && wallPassable(s) : s.hp <= 0);
function wallCenter(w) {
  return new V3(cc(w.x), WALL_H / 2, cc(w.z));
}
function resetStructures() {
  for (const w of WALLS) {
    w.p.fill(PANEL_HP);
    w.reinforced = false;
  }
  for (const d of DOORS) d.hp = 100;
  for (const w of WINS) w.broken = false;
  HOOK.structuresReset();
}

/* ---------- janelas (só nas paredes duras da fachada) ----------
   A célula continua sendo parede dura (tipo 1): colisão, A*, radar e IA não mudam.
   Visual: furo retangular atravessando a parede, vidro na face interna e grade na externa.
   Raio: passa pelo furo; vidro inteiro bloqueia o tiro (kind 'glass' = tiro para nele e o quebra) mas não a visão
   (traceWorld com seeGlass: a IA enxerga através do vidro, como o jogador).
   Quebrado (tiro ou explosão, na simulação: breakWindow → HOOK.winBroken), vira abertura: dá para atirar através. */
const WIN_SILL = 0.85,
  WIN_HEAD = 2.55,
  WIN_HW = 0.9;
const WINS = [],
  WINIDX = new Int16Array(W * H).fill(-1);
(function buildWindows() {
  for (let z = BZ0; z <= BZ1; z++)
    for (let x = BX0; x <= BX1; x++) {
      if (grid[z][x] !== 1 || (x + z) % 2) continue;
      if ((x === BX0 || x === BX1) && (z === BZ0 || z === BZ1)) continue;
      const nx = x === BX0 ? 1 : x === BX1 ? -1 : 0,
        nz = nx ? 0 : z === BZ0 ? 1 : z === BZ1 ? -1 : 0;
      if (!nx && !nz) continue; /* n = direção para dentro do prédio */
      if (cellAt(x + nx, z + nz) !== 0 || cellAt(x - nx, z - nz) !== 0) continue;
      const lx = nz ? 1 : 0,
        lz = nx ? 1 : 0;
      if (cellAt(x + lx, z + lz) !== 1 || cellAt(x - lx, z - lz) !== 1) continue;
      WINIDX[z * W + x] = WINS.length;
      WINS.push({ x, z, nx, nz, broken: false, idx: WINS.length });
    }
})();
const winAt = (x, z) => {
  const i = x < 0 || z < 0 || x >= W || z >= H ? -1 : WINIDX[z * W + x];
  return i >= 0 ? WINS[i] || null : null;
};
/* caixa do furo [x0,y0,z0,x1,y1,z1] e plano do vidro (coordenada no eixo da normal) */
function winBox(w) {
  const X = w.x * CELL,
    Z = w.z * CELL;
  return w.nx
    ? [X, WIN_SILL, cc(w.z) - WIN_HW, X + CELL, WIN_HEAD, cc(w.z) + WIN_HW]
    : [cc(w.x) - WIN_HW, WIN_SILL, Z, cc(w.x) + WIN_HW, WIN_HEAD, Z + CELL];
}
function winGlass(w) {
  const n = w.nx || w.nz,
    c = w.nx ? w.x : w.z;
  return (c + (n > 0 ? 1 : 0)) * CELL - n * 0.06;
}
/* raio entrando na célula da janela no instante t: null = atravessa; senão o acerto */
function winTrace(w, o, d, t, tExit, limit, seeGlass) {
  const b = winBox(w),
    O = [o.x, o.y, o.z],
    D = [d.x, d.y, d.z],
    E = 1e-4;
  for (let i = 0; i < 3; i++) {
    const p = O[i] + D[i] * t;
    if (p < b[i] - E || p > b[i + 3] + E) return { t, hit: true, kind: 'hard' };
  }
  let tOut = 1e9;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(D[i]) < 1e-9) continue;
    const t2 = Math.max((b[i] - O[i]) / D[i], (b[i + 3] - O[i]) / D[i]);
    if (t2 < tOut) tOut = t2;
  }
  const tEnd = Math.min(tOut, tExit);
  if (!w.broken && !seeGlass) {
    const ax = w.nx ? 0 : 2;
    if (Math.abs(D[ax]) > 1e-9) {
      const tg = (winGlass(w) - O[ax]) / D[ax];
      if (tg >= t - 1e-6 && tg <= tEnd + 1e-6 && tg < limit)
        return { t: Math.max(t, tg), hit: true, kind: 'glass', win: w };
    }
  }
  if (tOut < tExit - E && tOut < limit) return { t: tOut, hit: true, kind: 'hard' };
  return null;
}
/* centro do vidro (mundo) */
function winMid(w) {
  const g = winGlass(w),
    y = (WIN_SILL + WIN_HEAD) / 2;
  return w.nx ? new V3(g, y, cc(w.z)) : new V3(cc(w.x), y, g);
}
function breakWindow(w, by) {
  if (!w || w.broken) return;
  w.broken = true;
  HOOK.winBroken(w);
  /* barulho de vidro estourando: quem está perto vira para lá */
  if (by) {
    const m = winMid(w);
    for (const e of agents) {
      if (!e.alive || e.team === by.team || !e.bot || e.ai.target) continue;
      if (e.pos.distXZ(m) < 14) {
        e.ai.alertT = 3;
        e.ai.hurtFrom = new V3(m.x, 0, m.z);
      }
    }
  }
}

/* objetos dinâmicos: escudos, arames, cargas, desativador */
const PROPS = [];

/* ---------- colisão (círculo vs retângulos da grade) ---------- */
const _rects = [];
function cellRects(x, z, feet, who) {
  const c = cellAt(x, z),
    X = x * CELL,
    Z = z * CELL;
  if (c === 1) {
    _rects.push([X, Z, X + CELL, Z + CELL]);
    return;
  }
  if (c === 2) {
    if (feet < CRATE_H - 0.02) _rects.push([X, Z, X + CELL, Z + CELL]);
    return;
  }
  if (c === 3) {
    const w = WALLS[WIDX[z * W + x]],
      T = 0.16;
    for (let col = 0; col < 4; col++) {
      if (openCol(w, col)) continue;
      const a = col * 0.75,
        b = a + 0.75;
      if (w.ori === 'x') _rects.push([X + 1.5 - T, Z + a, X + 1.5 + T, Z + b]);
      else _rects.push([X + a, Z + 1.5 - T, X + b, Z + 1.5 + T]);
    }
    return;
  }
  if (c === 4) {
    const d = DOORS[DIDX[z * W + x]];
    if (d.hp > 0 && who !== 'drone') {
      const T = 0.1;
      if (d.ori === 'x') _rects.push([X + 1.5 - T, Z, X + 1.5 + T, Z + CELL]);
      else _rects.push([X, Z + 1.5 - T, X + CELL, Z + 1.5 + T]);
    }
  }
}
function resolve(p, r, feet, who) {
  for (let it = 0; it < 2; it++) {
    _rects.length = 0;
    const x0 = Math.floor((p.x - r) / CELL),
      x1 = Math.floor((p.x + r) / CELL),
      z0 = Math.floor((p.z - r) / CELL),
      z1 = Math.floor((p.z + r) / CELL);
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) cellRects(x, z, feet, who);
    for (const pr of PROPS)
      if (
        pr.solid &&
        who !== 'drone' &&
        feet < pr.box[4] - 0.05 &&
        Math.abs(pr.cx - p.x) < 3 &&
        Math.abs(pr.cz - p.z) < 3
      )
        _rects.push([pr.box[0], pr.box[2], pr.box[3], pr.box[5]]);
    for (const q of _rects) {
      const nx = clamp(p.x, q[0], q[2]),
        nz = clamp(p.z, q[1], q[3]);
      const dx = p.x - nx,
        dz = p.z - nz,
        d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 > 1e-10) {
          const d = Math.sqrt(d2);
          p.x += (dx / d) * (r - d);
          p.z += (dz / d) * (r - d);
        } else {
          const a = p.x - q[0],
            b = q[2] - p.x,
            c = p.z - q[1],
            e = q[3] - p.z,
            m = Math.min(a, b, c, e);
          if (m === a) p.x = q[0] - r;
          else if (m === b) p.x = q[2] + r;
          else if (m === c) p.z = q[1] - r;
          else p.z = q[3] + r;
        }
      }
    }
  }
}
function groundAt(p, feet) {
  const r = R * 0.7;
  const x0 = Math.floor((p.x - r) / CELL),
    x1 = Math.floor((p.x + r) / CELL),
    z0 = Math.floor((p.z - r) / CELL),
    z1 = Math.floor((p.z + r) / CELL);
  for (let z = z0; z <= z1; z++)
    for (let x = x0; x <= x1; x++) if (cellAt(x, z) === 2 && feet >= CRATE_H - 0.08) return CRATE_H;
  return 0;
}

/* ---------- raycast no mundo (DDA na grade + painéis + objetos) ---------- */
function rayBox(o, d, b) {
  let tmin = 0,
    tmax = 1e9;
  const O = [o.x, o.y, o.z],
    D = [d.x, d.y, d.z];
  for (let i = 0; i < 3; i++) {
    const lo = b[i],
      hi = b[i + 3];
    if (Math.abs(D[i]) < 1e-9) {
      if (O[i] < lo || O[i] > hi) return -1;
    } else {
      let t1 = (lo - O[i]) / D[i],
        t2 = (hi - O[i]) / D[i];
      if (t1 > t2) {
        const t = t1;
        t1 = t2;
        t2 = t;
      }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return -1;
    }
  }
  return tmin;
}
function traceWorld(o, d, maxT, skipProps, seeGlass) {
  let cx = Math.floor(o.x / CELL),
    cz = Math.floor(o.z / CELL);
  const ax = Math.abs(d.x) > 1e-9,
    az = Math.abs(d.z) > 1e-9,
    sx = d.x > 0 ? 1 : -1,
    sz = d.z > 0 ? 1 : -1;
  const tdx = ax ? CELL / Math.abs(d.x) : Infinity,
    tdz = az ? CELL / Math.abs(d.z) : Infinity;
  let tmx = ax ? ((cx + (d.x > 0 ? 1 : 0)) * CELL - o.x) / d.x : Infinity,
    tmz = az ? ((cz + (d.z > 0 ? 1 : 0)) * CELL - o.z) / d.z : Infinity;
  const tFloor = d.y < -1e-6 ? -o.y / d.y : Infinity,
    tCeil = d.y > 1e-6 ? (WALL_H - o.y) / d.y : Infinity;
  let limit = Math.min(maxT, tFloor),
    res = null;
  if (!skipProps)
    for (const pr of PROPS) {
      if (!pr.block) continue;
      const t = rayBox(o, d, pr.box);
      if (t >= 0 && t < limit) {
        limit = t;
        res = { t, hit: true, kind: 'prop', prop: pr };
      }
    }
  let t = 0;
  for (let i = 0; i < 400; i++) {
    const c = cellAt(cx, cz),
      tExit = Math.min(tmx, tmz),
      y0 = o.y + d.y * t;
    if (inside(cx, cz) && tCeil < limit && tCeil >= t && tCeil <= tExit)
      return { t: tCeil, hit: true, kind: 'ceil' };
    if (c === 1 && i > 0 && y0 <= WALL_H) {
      const wi = WINIDX[cz * W + cx];
      if (!(wi >= 0) || !WINS[wi]) return { t, hit: true, kind: 'hard' };
      const wr = winTrace(WINS[wi], o, d, t, tExit, limit, seeGlass);
      if (wr) return wr;
    }
    if (c === 2) {
      if (y0 <= CRATE_H && i > 0) return { t, hit: true, kind: 'crate' };
      if (d.y < 0) {
        const tc = (CRATE_H - o.y) / d.y;
        if (tc >= t && tc <= tExit && tc < limit) return { t: tc, hit: true, kind: 'crate' };
      }
    }
    if (c === 3 || c === 4) {
      const ori = ORI[cz][cx],
        pc = ori === 'x' ? cc(cx) : cc(cz),
        dv = ori === 'x' ? d.x : d.z,
        ov = ori === 'x' ? o.x : o.z;
      if (Math.abs(dv) > 1e-9) {
        const tp = (pc - ov) / dv;
        if (tp >= t - 1e-6 && tp <= tExit + 1e-6 && tp < limit && tp >= 0) {
          const y = o.y + d.y * tp,
            u = ori === 'x' ? o.z + d.z * tp - cz * CELL : o.x + d.x * tp - cx * CELL;
          if (c === 3) {
            const w = WALLS[WIDX[cz * W + cx]];
            if (y >= 0 && y < WALL_H) {
              const col = clamp(Math.floor(u / 0.75), 0, 3),
                row = clamp(Math.floor(y / PH), 0, PROWS - 1);
              if (w.reinforced || w.p[row * 4 + col] > 0)
                return { t: tp, hit: true, kind: 'soft', w, col, row };
            }
          } else {
            const dr = DOORS[DIDX[cz * W + cx]];
            if (y >= DOOR_H && y < WALL_H) return { t: tp, hit: true, kind: 'hard' };
            if (dr.hp > 0 && y < DOOR_H && y >= BAR_GAP)
              return { t: tp, hit: true, kind: 'door', door: dr };
          }
        }
      }
    }
    if (tExit >= limit)
      return res || { t: limit, hit: limit === tFloor, kind: limit === tFloor ? 'floor' : 'none' };
    if (tmx < tmz) {
      t = tmx;
      tmx += tdx;
      cx += sx;
    } else {
      t = tmz;
      tmz += tdz;
      cz += sz;
    }
  }
  return res || { t: limit, hit: false, kind: 'none' };
}
const _sd = new V3();
function clearLine(a, b) {
  _sd.set(b.x - a.x, b.y - a.y, b.z - a.z);
  const dist = _sd.length();
  if (dist < 1e-4) return true;
  _sd.divideScalar(dist);
  return traceWorld(a, _sd, dist).t >= dist - 0.06;
}
/* linha de visão (IA): vidro inteiro é transparente para os olhos, mesmo bloqueando o tiro */
function clearSight(a, b) {
  _sd.set(b.x - a.x, b.y - a.y, b.z - a.z);
  const dist = _sd.length();
  if (dist < 1e-4) return true;
  _sd.divideScalar(dist);
  return traceWorld(a, _sd, dist, false, true).t >= dist - 0.06;
}

/* ---------- A* na grade com custo por lado ---------- */
const NG = W * H,
  gS = new Float32Array(NG),
  fS = new Float32Array(NG),
  came = new Int32Array(NG),
  st = new Uint8Array(NG);
function makeCost(side, canThermal, carrier) {
  return (x, z) => {
    const c = cellAt(x, z);
    if (c === 0) return 1;
    if (c === 1 || c === 2) return Infinity;
    if (c === 4)
      return DOORS[DIDX[z * W + x]].hp > 0 ? (side === 'atk' ? (carrier ? 9 : 3) : 5) : 1;
    const w = WALLS[WIDX[z * W + x]];
    if (!w.reinforced && wallPassable(w)) return 1.1;
    if (side !== 'atk') return Infinity;
    if (w.reinforced) return canThermal ? 10 : Infinity;
    return carrier ? 30 : 7;
  };
} /* portador não é rompedor: só atravessa parede fina se não houver outro caminho */
function nearestFloor(x, z) {
  if (cellAt(x, z) === 0) return { x, z };
  for (let r = 1; r < 6; r++)
    for (let dz = -r; dz <= r; dz++)
      for (let dx = -r; dx <= r; dx++)
        if (cellAt(x + dx, z + dz) === 0) return { x: x + dx, z: z + dz };
  return { x, z };
}
function astar(sx, sz, gx, gz, cost) {
  if (cellAt(sx, sz) !== 0 && cost(sx, sz) === Infinity) {
    const n = nearestFloor(sx, sz);
    sx = n.x;
    sz = n.z;
  }
  if (cost(gx, gz) === Infinity) {
    const n = nearestFloor(gx, gz);
    gx = n.x;
    gz = n.z;
  }
  gS.fill(Infinity);
  st.fill(0);
  came.fill(-1);
  const s = sz * W + sx,
    goal = gz * W + gx;
  const h = (i) => {
    const x = i % W,
      z = (i / W) | 0,
      dx = Math.abs(x - gx),
      dz = Math.abs(z - gz);
    return Math.max(dx, dz) + 0.414 * Math.min(dx, dz);
  };
  gS[s] = 0;
  fS[s] = h(s);
  const open = [s];
  st[s] = 1;
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (fS[open[i]] < fS[open[bi]]) bi = i;
    const cur = open[bi];
    open[bi] = open[open.length - 1];
    open.pop();
    if (cur === goal) break;
    st[cur] = 2;
    const x = cur % W,
      z = (cur / W) | 0;
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        const nx = x + dx,
          nz = z + dz;
        const cst = cost(nx, nz);
        if (cst === Infinity) continue;
        if (dx && dz) {
          if (
            cellAt(x, z) !== 0 ||
            cellAt(nx, nz) !== 0 ||
            cellAt(x + dx, z) !== 0 ||
            cellAt(x, z + dz) !== 0
          )
            continue;
        }
        const ni = nz * W + nx;
        if (st[ni] === 2) continue;
        const ng = gS[cur] + cst * (dx && dz ? 1.414 : 1);
        if (ng < gS[ni]) {
          gS[ni] = ng;
          fS[ni] = ng + h(ni);
          came[ni] = cur;
          if (st[ni] !== 1) {
            st[ni] = 1;
            open.push(ni);
          }
        }
      }
  }
  if (came[goal] < 0 && goal !== s) return [];
  const path = [];
  let c = goal;
  while (c !== s && c >= 0) {
    path.push({ x: c % W, z: (c / W) | 0 });
    c = came[c];
  }
  return path.reverse();
}
