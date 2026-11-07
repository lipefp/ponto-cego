/* =====================================================================
   DADOS DO JOGO — armas, operadores, equipamentos, skins, dificuldade
   Ajuste de balanceamento: mexa aqui.
   ===================================================================== */

/* ---------- configurações salvas no navegador ---------- */
const DEFAULT_XH = {
  style: 'classic',
  color: '#7df3e1',
  size: 6,
  thick: 2,
  gap: 4,
  outline: true,
  dot: false,
  dynamic: true,
};
const SAVE = {
  sens: 1.1,
  fov: 70,
  vol: 0.6,
  diff: 'normal',
  name: 'Você',
  startSide: 'atk',
  hand: 'right',
  bob: true,
  fps: false,
  quality: 'high',
  vmSize: 1,
  atkOp: 'brecha',
  defOp: 'muralha',
  skins: {},
  att: {},
  load: {},
  xh: Object.assign({}, DEFAULT_XH),
  stats: { games: 0, wins: 0, kills: 0, deaths: 0, hs: 0, plants: 0, defuses: 0 },
};
const QUAL = { min: 0, low: 1, medium: 2, high: 3 };
const QL = () =>
  QUAL[SAVE.quality] != null
    ? QUAL[SAVE.quality]
    : 3; /* qualidade gráfica: 0 mínima · 1 baixa · 2 média · 3 alta */
function deepAssign(t, s) {
  for (const k in s) {
    if (!(k in t)) continue;
    if (
      s[k] &&
      typeof s[k] === 'object' &&
      !Array.isArray(s[k]) &&
      t[k] &&
      typeof t[k] === 'object'
    )
      deepAssign(t[k], s[k]);
    else t[k] = s[k];
  }
}
function persist() {
  try {
    localStorage.setItem('pc_v3', JSON.stringify(SAVE));
  } catch (e) {}
}
/* (o SAVE salvo é lido no fim deste arquivo, depois de armas e operadores: assim skins/acessórios/loadouts de todas as armas existem) */

/* ---------- regras da partida ---------- */
const CELL = 3,
  WALL_H = 3.2,
  CRATE_H = 1.2,
  EYE = 1.62,
  EYE_C = 1.12,
  R = 0.34,
  DOOR_H = 2.4,
  BAR_GAP = 0.32;
const PROWS = 4,
  NP = 16,
  PH = WALL_H / PROWS; // painéis por parede fina: 4 colunas x 4 linhas de 0,8 m
const PREP_T = 45,
  ACTION_T = 180,
  PLANT_T = 45,
  END_T = 6,
  PLANT_HOLD = 7,
  DEFUSE_HOLD = 7,
  WIN_ROUNDS = 4,
  SWAP_AFTER = 3;
const SIM_DT = 1 / 60; // passo fixo da simulação
const RECON_T = 24; // s de reconhecimento do ataque na entrada antes de romper (IA)
const GLASS_SEE = 20; // m: alcance em que a IA percebe alguém através de vidro inteiro
const POST_LOS = 0.25; // fração do ataque (IA) que, no pós-planta, fica com visão do desativador
const RETREAT_HP = 40; // vida abaixo da qual o bot recua da troca de tiro
const ROAMERS = 2; // patrulheiros da defesa (IA) fora do objetivo
const RETAKE_T = 28; // s restantes no desativador em que a defesa (IA) para de esperar e vai desativar
const ATK_LATE = 45; // s restantes na ação em que o ataque (IA) para de esperar e executa de qualquer jeito
const ARMOR = {
  1: { speed: 5.2, red: 0, name: 'Leve' },
  2: { speed: 4.7, red: 0.1, name: 'Média' },
  3: { speed: 4.2, red: 0.2, name: 'Pesada' },
};

/* ---------- armas ----------
   dmg: dano por bala (cabeça sempre mata) · rate: s entre tiros · spread: dispersão em rad
   move: dispersão extra correndo · kick: abertura da rajada (bots) · wall: dano em painel · zoom: FOV ao mirar (com a mira padrão)
   adsT: tempo para mirar (s) · rec: recuo por tiro (v vertical, h lateral, em rad; pat = padrão lateral próprio) · fall: queda de dano [início m, fim m, mínimo]
   cls: família do modelo 3D · slot: p (principal) / s (secundária) · mob: mobilidade (multiplica a velocidade) · z1: zoom com mira 1x
   att: acessórios de fábrica (os números acima já valem com eles; trocar acessório muda os números relativamente a eles) */
const REC_H = [
  0, 0.4, 0.8, 0.5, -0.2, -0.7, -1, -0.6, 0.1, 0.7, 1, 0.6, -0.1, -0.6, -0.9, -0.4, 0.3, 0.8,
];
const REC_PAT = {
  right: [
    0, 0.5, 0.9, 1, 0.8, 0.9, 1, 0.7, 0.9, 1.1, 0.8, 0.6, 0.9, 1, 0.7, 0.5, 0.8, 1,
  ] /* puxa sempre para a direita */,
  left: [
    0, -0.3, -0.7, -0.9, -0.6, -0.8, -1, -0.5, -0.9, -1.1, -0.6, -0.4, -0.8, -1, -0.6, -0.3, -0.7,
    -0.9,
  ],
  zig: [
    0, 0.8, -0.6, 0.9, -0.8, 1, -0.9, 0.7, -1, 0.9, -0.7, 0.8, -0.9, 1, -0.8, 0.6, -0.9, 0.8,
  ] /* zigue-zague curto (metralhadora leve) */,
  snake: [
    0, 0.2, 0.5, 0.8, 1, 0.7, 0.3, -0.2, -0.6, -0.9, -1, -0.6, -0.1, 0.4, 0.8, 1, 0.6, 0.1,
  ] /* serpenteia devagar */,
};
const WEAPONS = {
  /* ---- secundárias ---- */
  pistol: {
    name: 'KR-9',
    type: 'Pistola',
    cls: 'pistol',
    slot: 's',
    dmg: 40,
    rate: 0.15,
    mag: 15,
    res: 60,
    reload: 2.0,
    spread: 0.009,
    move: 0.03,
    auto: false,
    kick: 0.016,
    wall: 1,
    zoom: 0.8,
    z1: 0.8,
    snd: 'pistol',
    adsT: 0.16,
    rec: { v: 0.02, h: 0.004 },
    fall: [12, 28, 0.65],
    look: { slide: '#2a2d30', frame: '#1e2022' },
    att: { sight: 'iron', barrel: 'none', grip: 'none', laser: 0 },
  },
  onca: {
    name: 'HC-45',
    type: 'Pistola',
    cls: 'pistol',
    slot: 's',
    dmg: 52,
    rate: 0.2,
    mag: 10,
    res: 50,
    reload: 2.1,
    spread: 0.0095,
    move: 0.032,
    auto: false,
    kick: 0.02,
    wall: 1.1,
    zoom: 0.8,
    z1: 0.8,
    snd: 'pistol45',
    adsT: 0.17,
    rec: { v: 0.03, h: 0.006 },
    fall: [10, 24, 0.6],
    look: { slide: '#9a9ea2', frame: '#2a2b2c', hammer: 1, long: 1.06 },
    att: { sight: 'iron', barrel: 'none', grip: 'none', laser: 0 },
  },
  pardal: {
    name: 'SP-57',
    type: 'Pistola',
    cls: 'pistol',
    slot: 's',
    dmg: 34,
    rate: 0.12,
    mag: 20,
    res: 80,
    reload: 2.0,
    spread: 0.008,
    move: 0.028,
    auto: false,
    kick: 0.013,
    wall: 1.15,
    zoom: 0.8,
    z1: 0.8,
    snd: 'pistol',
    adsT: 0.15,
    rec: { v: 0.016, h: 0.004 },
    fall: [14, 30, 0.7],
    look: { slide: '#3b3f33', frame: '#7a6a4e', long: 1.1, tall: 0.9 },
    att: { sight: 'red', barrel: 'none', grip: 'none', laser: 0 },
  },
  abelha: {
    name: 'MP-22X',
    type: 'Pistola-metralhadora',
    cls: 'mp',
    slot: 's',
    dmg: 24,
    rate: 0.058,
    mag: 22,
    res: 110,
    reload: 2.2,
    spread: 0.016,
    move: 0.022,
    auto: true,
    kick: 0.009,
    wall: 1,
    zoom: 0.8,
    z1: 0.8,
    snd: 'mp',
    adsT: 0.18,
    rec: { v: 0.0048, h: 0.0034, pat: 'snake' },
    fall: [8, 20, 0.55],
    look: { slide: '#26292b', frame: '#1d1f20' },
    att: { sight: 'iron', barrel: 'none', grip: 'none', laser: 0 },
  },
  jaguar: {
    name: 'Rev-44',
    type: 'Revólver',
    cls: 'rev',
    slot: 's',
    dmg: 78,
    rate: 0.42,
    mag: 6,
    res: 30,
    reload: 2.9,
    spread: 0.008,
    move: 0.035,
    auto: false,
    kick: 0.04,
    wall: 1.4,
    zoom: 0.8,
    z1: 0.8,
    snd: 'rev',
    adsT: 0.19,
    rec: { v: 0.06, h: 0.01 },
    fall: [10, 28, 0.6],
    look: { slide: '#8d9196', frame: '#7a7e83' },
    att: { sight: 'iron', barrel: 'none', grip: 'none', laser: 0 },
  },
  /* ---- submetralhadoras ---- */
  smg: {
    name: 'S-30',
    noGrip: true,
    type: 'Submetralhadora',
    cls: 'smg',
    slot: 'p',
    dmg: 30,
    rate: 0.068,
    mag: 30,
    res: 180,
    reload: 2.3,
    spread: 0.014,
    move: 0.025,
    auto: true,
    kick: 0.008,
    wall: 1,
    zoom: 0.78,
    z1: 0.78,
    snd: 'smg',
    adsT: 0.2,
    rec: { v: 0.0042, h: 0.0026 },
    fall: [13, 27, 0.6],
    look: { v: 'A' },
    att: { sight: 'reflex', barrel: 'none', grip: 'none', laser: 0 },
  },
  marimbondo: {
    name: 'SMG-11',
    type: 'Submetralhadora',
    cls: 'smg',
    slot: 'p',
    dmg: 26,
    rate: 0.056,
    mag: 32,
    res: 192,
    reload: 2.2,
    spread: 0.015,
    move: 0.022,
    auto: true,
    kick: 0.009,
    wall: 1,
    zoom: 0.78,
    z1: 0.78,
    snd: 'mp',
    adsT: 0.19,
    rec: { v: 0.0046, h: 0.003, pat: 'right' },
    fall: [12, 25, 0.58],
    look: { v: 'B' },
    att: { sight: 'red', barrel: 'none', grip: 'ang', laser: 0 },
  },
  cascavel: {
    name: 'VX-45',
    type: 'Submetralhadora',
    cls: 'smg',
    slot: 'p',
    dmg: 38,
    rate: 0.088,
    mag: 25,
    res: 150,
    reload: 2.4,
    spread: 0.013,
    move: 0.026,
    auto: true,
    kick: 0.01,
    wall: 1.1,
    zoom: 0.78,
    z1: 0.78,
    snd: 'smg45',
    adsT: 0.21,
    rec: { v: 0.0062, h: 0.0024, pat: 'left' },
    fall: [13, 26, 0.62],
    look: { v: 'C' },
    att: { sight: 'holo', barrel: 'none', grip: 'vert', laser: 0 },
  },
  /* ---- fuzis de assalto ---- */
  rifle: {
    name: 'ARX-07',
    type: 'Fuzil de assalto',
    cls: 'ar',
    slot: 'p',
    dmg: 38,
    rate: 0.09,
    mag: 30,
    res: 150,
    reload: 2.5,
    spread: 0.005,
    move: 0.06,
    auto: true,
    kick: 0.011,
    wall: 1.3,
    zoom: 0.72,
    z1: 0.72,
    snd: 'rifle',
    adsT: 0.26,
    rec: { v: 0.0058, h: 0.0022 },
    fall: [22, 40, 0.75],
    look: { v: 'A' },
    att: { sight: 'holo', barrel: 'none', grip: 'vert', laser: 0 },
  },
  jararaca: {
    name: 'J-56K',
    type: 'Fuzil de assalto',
    cls: 'ar',
    slot: 'p',
    dmg: 32,
    rate: 0.075,
    mag: 30,
    res: 180,
    reload: 2.4,
    spread: 0.006,
    move: 0.055,
    auto: true,
    kick: 0.01,
    wall: 1.2,
    zoom: 0.72,
    z1: 0.72,
    snd: 'rifle556',
    adsT: 0.24,
    rec: { v: 0.0052, h: 0.0028, pat: 'snake' },
    fall: [20, 38, 0.72],
    look: { v: 'B' },
    att: { sight: 'red', barrel: 'comp', grip: 'ang', laser: 0 },
  },
  tupa: {
    name: 'AK-TY2',
    type: 'Fuzil de assalto',
    cls: 'ar',
    slot: 'p',
    dmg: 46,
    rate: 0.12,
    mag: 20,
    res: 120,
    reload: 2.7,
    spread: 0.005,
    move: 0.07,
    auto: true,
    kick: 0.014,
    wall: 1.5,
    zoom: 0.62,
    z1: 0.72,
    snd: 'battle',
    adsT: 0.3,
    rec: { v: 0.0082, h: 0.0034, pat: 'right' },
    fall: [25, 45, 0.8],
    mob: 0.97,
    look: { v: 'C' },
    att: { sight: 'x15', barrel: 'brake', grip: 'vert', laser: 0 },
  },
  /* ---- escopetas ---- */
  shotgun: {
    name: 'PS-12',
    type: 'Escopeta (pump)',
    cls: 'sg',
    slot: 'p',
    dmg: 21,
    pellets: 8,
    rate: 0.85,
    mag: 7,
    res: 35,
    reload: 3.2,
    spread: 0.06,
    move: 0.02,
    auto: false,
    kick: 0.05,
    wall: 2.6,
    range: 12,
    zoom: 0.85,
    z1: 0.85,
    snd: 'shotgun',
    adsT: 0.24,
    rec: { v: 0.055, h: 0.01 },
    look: { v: 'A' },
    att: { sight: 'iron', barrel: 'none', grip: 'none', laser: 0 },
  },
  ressaca: {
    name: 'RG-16',
    type: 'Escopeta semiautomática',
    cls: 'sgs',
    slot: 'p',
    dmg: 15,
    pellets: 8,
    rate: 0.28,
    mag: 8,
    res: 40,
    reload: 3.4,
    spread: 0.066,
    move: 0.02,
    auto: false,
    kick: 0.05,
    wall: 2.2,
    range: 10,
    zoom: 0.85,
    z1: 0.85,
    snd: 'shotgun',
    adsT: 0.25,
    rec: { v: 0.042, h: 0.012 },
    look: { v: 'B' },
    att: { sight: 'reflex', barrel: 'none', grip: 'none', laser: 0 },
  },
  /* ---- fuzis de precisão ---- */
  dmr: {
    name: 'DM-65',
    type: 'Fuzil de precisão',
    cls: 'dmr',
    slot: 'p',
    dmg: 64,
    rate: 0.23,
    mag: 10,
    res: 50,
    reload: 2.8,
    spread: 0.004,
    move: 0.1,
    auto: false,
    kick: 0.03,
    wall: 1.5,
    zoom: 0.45,
    z1: 0.7,
    snd: 'dmr',
    adsT: 0.34,
    rec: { v: 0.026, h: 0.005 },
    mob: 0.96,
    look: { v: 'A' },
    att: { sight: 'x25', barrel: 'none', grip: 'none', laser: 0 },
  },
  carcara: {
    name: 'CK-55',
    type: 'Fuzil de precisão',
    cls: 'dmr',
    slot: 'p',
    dmg: 52,
    rate: 0.17,
    mag: 15,
    res: 75,
    reload: 2.6,
    spread: 0.0045,
    move: 0.085,
    auto: false,
    kick: 0.025,
    wall: 1.4,
    zoom: 0.5,
    z1: 0.7,
    snd: 'dmr',
    adsT: 0.3,
    rec: { v: 0.02, h: 0.005 },
    look: { v: 'B' },
    att: { sight: 'x2', barrel: 'flash', grip: 'none', laser: 0 },
  },
  /* ---- metralhadora leve ---- */
  boitata: {
    name: 'BT-80',
    vs: 0.72,
    type: 'Metralhadora leve',
    cls: 'lmg',
    slot: 'p',
    dmg: 38,
    rate: 0.095,
    mag: 80,
    res: 160,
    reload: 4.6,
    spread: 0.007,
    move: 0.085,
    auto: true,
    kick: 0.011,
    wall: 1.5,
    zoom: 0.72,
    z1: 0.72,
    snd: 'lmg',
    adsT: 0.4,
    rec: { v: 0.0058, h: 0.0034, pat: 'zig' },
    fall: [22, 42, 0.75],
    mob: 0.92,
    look: { v: 'A' },
    att: { sight: 'holo', barrel: 'none', grip: 'vert', laser: 0 },
  },
};
const WLIST =
  Object.keys(
    WEAPONS
  ); /* só as armas-base (variantes com acessório são criadas depois, com '@' no id) */
const WCAT = [
  ['Fuzis de assalto', 'ar'],
  ['Submetralhadoras', 'smg'],
  ['Escopetas', 'sg'],
  ['Precisão', 'dmr'],
  ['Metralhadora leve', 'lmg'],
  ['Pistolas', 'pistol'],
  ['Pistola-metralhadora', 'mp'],
  ['Revólver', 'rev'],
];
/* ---------- acessórios (como no Siege) ----------
   mira: zoom (FOV mirando) e tempo de mira · cano: dano, recuo, clarão/som · empunhadura: recuo vertical ou mira rápida · laser: dispersão do quadril */
const ATT = {
  sight: {
    iron: { name: 'De ferro' },
    red: { name: 'Ponto vermelho' },
    holo: { name: 'Holográfica' },
    reflex: { name: 'Reflex' },
    x15: { name: 'Luneta 1,5x', zoom: 0.62, ads: 1.08 },
    x2: { name: 'Luneta 2x', zoom: 0.52, ads: 1.12 },
    x25: { name: 'Luneta 2,5x', zoom: 0.44, ads: 1.18 },
  },
  barrel: {
    none: { name: 'Nenhum' },
    sup: { name: 'Supressor', dmg: 0.88, sup: true, desc: 'sem clarão · som baixo · −12% dano' },
    flash: { name: 'Quebra-chama', rv: 0.9, desc: '−10% recuo vertical' },
    comp: { name: 'Compensador', rh: 0.6, desc: '−40% recuo lateral' },
    brake: { name: 'Freio de boca', first: 0.6, kick: 0.85, desc: '1º tiros com −40% recuo' },
    ext: { name: 'Cano longo', dmg: 1.06, fall: 1.25, desc: '+6% dano · alcance maior' },
  },
  grip: {
    none: { name: 'Nenhuma' },
    vert: { name: 'Vertical', rv: 0.8, desc: '−20% recuo vertical' },
    ang: { name: 'Angular', ads: 0.8, desc: 'mira 20% mais rápida' },
  },
  laser: {
    0: { name: 'Sem laser' },
    1: { name: 'Laser', hip: 0.78, mv: 0.9, desc: '−22% dispersão do quadril' },
  },
};
/* acessórios permitidos por família */
const ATT_OK = {
  pistol: {
    sight: ['iron', 'red', 'reflex'],
    barrel: ['none', 'sup', 'comp', 'brake', 'ext'],
    grip: ['none'],
    laser: [0, 1],
  },
  mp: {
    sight: ['iron', 'red', 'reflex'],
    barrel: ['none', 'sup', 'comp', 'flash'],
    grip: ['none'],
    laser: [0, 1],
  },
  rev: { sight: ['iron', 'red', 'reflex'], barrel: ['none'], grip: ['none'], laser: [0, 1] },
  smg: {
    sight: ['iron', 'red', 'holo', 'reflex', 'x15'],
    barrel: ['none', 'sup', 'flash', 'comp', 'brake', 'ext'],
    grip: ['none', 'vert', 'ang'],
    laser: [0, 1],
  },
  ar: {
    sight: ['iron', 'red', 'holo', 'reflex', 'x15', 'x2', 'x25'],
    barrel: ['none', 'sup', 'flash', 'comp', 'brake', 'ext'],
    grip: ['none', 'vert', 'ang'],
    laser: [0, 1],
  },
  lmg: {
    sight: ['iron', 'red', 'holo', 'reflex', 'x15', 'x2'],
    barrel: ['none', 'flash', 'comp', 'brake'],
    grip: ['none', 'vert', 'ang'],
    laser: [0, 1],
  },
  dmr: {
    sight: ['iron', 'red', 'holo', 'x15', 'x2', 'x25'],
    barrel: ['none', 'sup', 'flash', 'comp', 'brake', 'ext'],
    grip: ['none', 'vert', 'ang'],
    laser: [0, 1],
  },
  sg: {
    sight: ['iron', 'red', 'holo', 'reflex'],
    barrel: ['none', 'sup'],
    grip: ['none'],
    laser: [0, 1],
  },
  sgs: {
    sight: ['iron', 'red', 'holo', 'reflex'],
    barrel: ['none', 'sup'],
    grip: ['none', 'vert', 'ang'],
    laser: [0, 1],
  },
};
const wBase = (id) => {
  const d = WEAPONS[id];
  return (d && d.base) || id;
};
const attSig = (a) => [a.sight, a.barrel, a.grip, a.laser ? 1 : 0].join('.');
function attValid(id, a) {
  const d = WEAPONS[wBase(id)],
    ok = ATT_OK[d.cls],
    o = Object.assign({}, d.att);
  if (a)
    for (const k of ['sight', 'barrel', 'grip', 'laser']) {
      const v = k === 'laser' ? (+a[k] ? 1 : 0) : a[k];
      if (ok[k].includes(v) && !(k === 'grip' && d.noGrip)) o[k] = v;
    }
  return o;
}
/* variante com acessórios: um id próprio ('rifle@holo.sup.vert.1') com os números já ajustados; o resto do jogo só lê WEAPONS[id] */
function wVariant(id, a) {
  const bid = wBase(id),
    d = WEAPONS[bid];
  a = attValid(bid, a);
  if (attSig(a) === attSig(d.att)) return bid;
  const key = bid + '@' + attSig(a);
  if (WEAPONS[key]) return key;
  const S = ATT.sight,
    Bz = ATT.barrel,
    Gr = ATT.grip,
    L = ATT.laser,
    df = d.att,
    v = Object.assign({}, d, { base: bid, att: a, rec: Object.assign({}, d.rec) });
  const r = (tab, k, f) => ((tab[a[k]] || {})[f] || 1) / ((tab[df[k]] || {})[f] || 1);
  const zs = (s) => S[s].zoom || d.z1;
  v.zoom = +((d.zoom * zs(a.sight)) / zs(df.sight)).toFixed(3);
  v.adsT = d.adsT * r(S, 'sight', 'ads') * r(Gr, 'grip', 'ads');
  v.dmg = Math.round(d.dmg * r(Bz, 'barrel', 'dmg') * 10) / 10;
  if (d.fall)
    v.fall = [d.fall[0] * r(Bz, 'barrel', 'fall'), d.fall[1] * r(Bz, 'barrel', 'fall'), d.fall[2]];
  if (d.range) v.range = d.range * r(Bz, 'barrel', 'fall');
  v.rec.v = d.rec.v * r(Gr, 'grip', 'rv') * r(Bz, 'barrel', 'rv');
  v.rec.h = d.rec.h * r(Bz, 'barrel', 'rh');
  v.rec.first = r(Bz, 'barrel', 'first');
  v.kick =
    d.kick * Math.sqrt(r(Gr, 'grip', 'rv') * r(Bz, 'barrel', 'rv')) * r(Bz, 'barrel', 'kick');
  v.hipMul = r(L, 'laser', 'hip');
  v.move = d.move * r(L, 'laser', 'mv');
  v.sup = !!Bz[a.barrel].sup;
  WEAPONS[key] = v;
  return key;
}
Object.defineProperty(WEAPONS, 'variant', {
  value: wVariant,
  enumerable: false,
}); /* para testes/ferramentas: WEAPONS.variant(id,acessórios) */
for (const id of WLIST) {
  const d = WEAPONS[id];
  d.hipMul = 1;
  d.sup = !!ATT.barrel[d.att.barrel].sup;
}
/* bots: acessórios variados mas sensatos (60% de fábrica) */
function botAtt(id) {
  const d = WEAPONS[wBase(id)],
    ok = ATT_OK[d.cls];
  if (Math.random() < 0.6) return d.att;
  const p = (l) => l[(Math.random() * l.length) | 0];
  const bar = ok.barrel.filter((b) => b !== 'sup');
  return {
    sight: p(ok.sight),
    barrel: Math.random() < 0.5 ? d.att.barrel : p(bar),
    grip: p(ok.grip),
    laser: Math.random() < 0.3 ? 1 : 0,
  };
} /* bots não usam supressor (não muda o equilíbrio da audição) */

const GADGETS = {
  breach: { name: 'Carga de brecha' },
  frag: { name: 'Granada' },
  pulse: { name: 'Pulso de radar' },
  thermal: { name: 'Carga térmica' },
  shield: { name: 'Escudo móvel' },
  impact: { name: 'Granada de impacto' },
  wire: { name: 'Arame farpado' },
  flash: { name: 'Granada de clarão' },
  jammer: { name: 'Bloqueador de sinal' },
};
/* look: aparência procedural do operador (cabeça, cores, padrão do uniforme) */
const OPS = {
  atk: [
    {
      id: 'brecha',
      name: 'Cupim',
      code: 'A-12',
      role: 'Rompedor leve',
      armor: 2,
      prim: 'rifle',
      gadget: 'breach',
      gn: 3,
      desc: 'Abre paredes finas e barricadas com cargas explosivas.',
      look: {
        head: 'helmet',
        headCol: '#3a4147',
        skin: '#c99a74',
        vest: '#2e3438',
        pat: 'digital',
        cols: ['#6a7075', '#50565b', '#878d91', '#3c4145'],
      },
    },
    {
      id: 'estilhaco',
      name: 'Ouriço',
      code: 'A-21',
      role: 'Entrada',
      armor: 2,
      prim: 'rifle',
      gadget: 'frag',
      gn: 2,
      desc: 'Duas granadas de fragmentação para limpar salas.',
      look: {
        head: 'balaclava',
        headCol: '#2a2d31',
        skin: '#b98560',
        vest: '#2b2e33',
        goggles: true,
        pat: null,
        cols: ['#3d4248'],
      },
    },
    {
      id: 'olho',
      name: 'Coruja',
      code: 'A-31',
      role: 'Intel',
      armor: 1,
      prim: 'smg',
      gadget: 'pulse',
      gn: 2,
      desc: 'Pulso de radar que mostra os defensores através das paredes.',
      look: {
        head: 'cap',
        headCol: '#8a7350',
        skin: '#d2a67f',
        vest: '#7a6445',
        glasses: true,
        pack: true,
        pat: 'camo',
        cols: ['#c2a877', '#a38a5c', '#d8c49a', '#7d6844'],
      },
    },
    {
      id: 'macarico',
      name: 'Fornalha',
      code: 'A-11',
      role: 'Rompedor pesado',
      armor: 3,
      prim: 'shotgun',
      gadget: 'thermal',
      gn: 1,
      desc: 'Carga térmica que derrete até parede reforçada.',
      look: {
        head: 'weld',
        headCol: '#6b4a33',
        skin: '#c99a74',
        vest: '#3b2a1e',
        pat: null,
        cols: ['#5a4332'],
      },
    },
    {
      id: 'cod_a22',
      name: 'Relâmpago',
      code: 'A-22',
      role: 'Entrada',
      armor: 1,
      prim: 'smg',
      gadget: 'flash',
      gn: 3,
      desc: 'Entra primeiro, leve e rápido, e cega os defensores com três granadas de clarão.',
      look: {
        head: 'balaclava',
        headCol: '#3b4a3a',
        skin: '#a97652',
        vest: '#2f3a2d',
        goggles: true,
        pat: 'camo',
        cols: ['#4a5a40', '#2f3a2a', '#66764f', '#232c1f'],
      },
    },
    {
      id: 'cod_a41',
      name: 'Tatu',
      code: 'A-41',
      role: 'Suporte',
      armor: 3,
      prim: 'boitata',
      gadget: 'shield',
      gn: 1,
      desc: 'Avança atrás de um escudo móvel com metralhadora leve e abre caminho para o time.',
      look: {
        head: 'visorhelm',
        headCol: '#4a3a2a',
        skin: '#8d5a3b',
        vest: '#3a2f24',
        pat: 'digital',
        cols: ['#5e4a36', '#46372a', '#77614a', '#33281e'],
      },
    },
  ],
  def: [
    {
      id: 'muralha',
      name: 'Granito',
      code: 'D-11',
      role: 'Âncora',
      armor: 3,
      prim: 'smg',
      gadget: 'shield',
      gn: 2,
      desc: 'Dois escudos móveis à prova de bala.',
      look: {
        head: 'visorhelm',
        headCol: '#2a3448',
        skin: '#c99a74',
        vest: '#1d2433',
        pat: 'digital',
        cols: ['#3b4660', '#2c3549', '#4d5a78', '#222939'],
      },
    },
    {
      id: 'faisca',
      name: 'Estopim',
      code: 'D-41',
      role: 'Rondador',
      armor: 2,
      prim: 'shotgun',
      gadget: 'impact',
      gn: 3,
      desc: 'Granadas de impacto que abrem buracos para emboscadas.',
      look: {
        head: 'bandana',
        headCol: '#8e2f24',
        skin: '#b07a55',
        vest: '#3b2a1e',
        pat: null,
        cols: ['#6b4a33'],
      },
    },
    {
      id: 'arame',
      name: 'Espinho',
      code: 'D-21',
      role: 'Armadilheiro',
      armor: 1,
      prim: 'smg',
      gadget: 'wire',
      gn: 2,
      desc: 'Arame farpado que atrasa e denuncia o atacante.',
      look: {
        head: 'boonie',
        headCol: '#5a6b40',
        skin: '#8d5a3b',
        vest: '#3d4a2c',
        pack: true,
        pat: 'camo',
        cols: ['#56683d', '#3a4828', '#74804f', '#262e1b'],
      },
    },
    {
      id: 'bunker',
      name: 'Sentinela',
      code: 'D-12',
      role: 'Âncora',
      armor: 3,
      prim: 'dmr',
      gadget: 'shield',
      gn: 1,
      desc: 'Fuzil de precisão e um escudo para segurar o ângulo.',
      look: {
        head: 'helmet',
        headCol: '#3f4630',
        skin: '#d9ae8a',
        vest: '#44463f',
        glasses: true,
        pat: 'digital',
        cols: ['#6e7066', '#56584f', '#8a8c80', '#3f413a'],
      },
    },
    {
      id: 'cod_d42',
      name: 'Raposa',
      code: 'D-42',
      role: 'Rondador',
      armor: 1,
      prim: 'marimbondo',
      gadget: 'frag',
      gn: 2,
      desc: 'Sai do objetivo cedo e ataca os atacantes pelo flanco.',
      look: {
        head: 'cap',
        headCol: '#2f3f55',
        skin: '#c08a63',
        vest: '#26303d',
        pack: true,
        pat: 'digital',
        cols: ['#34455c', '#26354a', '#4a5d78', '#1c2736'],
      },
    },
    {
      id: 'cod_d31',
      name: 'Chiado',
      code: 'D-31',
      role: 'Negação de informação',
      armor: 2,
      prim: 'carcara',
      gadget: 'jammer',
      gn: 2,
      desc: 'Dois bloqueadores de sinal: drones e pulsos de radar deixam de funcionar na área.',
      look: {
        head: 'bandana',
        headCol: '#2e4a52',
        skin: '#d2a67f',
        vest: '#1f2e33',
        glasses: true,
        pat: 'camo',
        cols: ['#3a5560', '#27404a', '#4f6d78', '#1b2e35'],
      },
    },
  ],
};
/* opções de arma de cada operador (a 1ª é a de fábrica = op.prim): âncoras/defesa mais SMG e escopeta, ataque mais fuzil */
const LOADOUTS = {
  brecha: { p: ['rifle', 'tupa', 'ressaca'], s: ['pistol', 'onca'] },
  estilhaco: { p: ['rifle', 'jararaca', 'boitata'], s: ['pistol', 'jaguar'] },
  olho: { p: ['smg', 'marimbondo', 'carcara'], s: ['pardal', 'abelha'] },
  macarico: { p: ['shotgun', 'ressaca', 'boitata'], s: ['onca', 'jaguar'] },
  muralha: { p: ['smg', 'ressaca', 'cascavel'], s: ['pistol', 'abelha'] },
  faisca: { p: ['shotgun', 'marimbondo', 'cascavel'], s: ['pardal', 'jaguar'] },
  arame: { p: ['smg', 'marimbondo', 'shotgun'], s: ['pistol', 'abelha'] },
  bunker: { p: ['dmr', 'cascavel', 'shotgun'], s: ['onca', 'pardal'] },
  cod_a22: { p: ['smg', 'marimbondo', 'jararaca'], s: ['pardal', 'abelha'] },
  cod_a41: { p: ['boitata', 'jararaca', 'shotgun'], s: ['pistol', 'jaguar'] },
  cod_d31: { p: ['carcara', 'smg', 'marimbondo'], s: ['pardal', 'onca'] },
  cod_d42: { p: ['marimbondo', 'carcara', 'shotgun'], s: ['pardal', 'jaguar'] },
};
for (const o of OPS.atk.concat(OPS.def)) {
  const L = LOADOUTS[o.id] || { p: [o.prim], s: ['pistol'] };
  o.prims = L.p;
  o.secs = L.s;
}
const opById = (id) => OPS.atk.concat(OPS.def).find((o) => o.id === id) || OPS.atk[0];

const SKINS = [
  { id: 'padrao', name: 'Fábrica', rar: 0, pat: 'factory' },
  {
    id: 'deserto',
    name: 'Tempestade de Areia',
    rar: 0,
    pat: 'camo',
    cols: ['#c8b38a', '#a88b5e', '#7d6644', '#e0cfa6'],
  },
  {
    id: 'floresta',
    name: 'Mata Fechada',
    rar: 0,
    pat: 'camo',
    cols: ['#4d5b35', '#2f3a22', '#6f7a49', '#1f2418'],
  },
  {
    id: 'urbano',
    name: 'Concreto Digital',
    rar: 1,
    pat: 'digital',
    cols: ['#7b8084', '#5a5f63', '#a3a7aa', '#3d4044'],
  },
  {
    id: 'artico',
    name: 'Ártico',
    rar: 1,
    pat: 'digital',
    cols: ['#e8ecef', '#c3cacf', '#9aa3aa', '#ffffff'],
  },
  { id: 'carbono', name: 'Fibra de Carbono', rar: 1, pat: 'carbon' },
  { id: 'tigre', name: 'Listra de Tigre', rar: 2, pat: 'tiger', cols: ['#e2772f', '#1a1410'] },
  {
    id: 'oceano',
    name: 'Maré Profunda',
    rar: 2,
    pat: 'waves',
    cols: ['#0b3d5c', '#1f7fa6', '#7fd3e8'],
  },
  {
    id: 'rubi',
    name: 'Rubi Lapidado',
    rar: 2,
    pat: 'facets',
    cols: ['#6e0f1a', '#b3202f', '#e0485a', '#3a070d'],
  },
  { id: 'neon', name: 'Circuito Neon', rar: 3, pat: 'neon' },
  { id: 'magma', name: 'Rio de Magma', rar: 3, pat: 'magma' },
  { id: 'ouro', name: 'Ouro Gravado', rar: 3, pat: 'gold' },
  {
    id: 'savana',
    name: 'Savana',
    rar: 0,
    pat: 'camo',
    cols: ['#b9a06a', '#8c7a3f', '#6b5a2c', '#d8c68e'],
  },
  {
    id: 'marinha',
    name: 'Maré Alta',
    rar: 0,
    pat: 'digital',
    cols: ['#16263d', '#0e1a2b', '#2c4a73', '#445f87'],
  },
  { id: 'madeira', name: 'Nogueira Envernizada', rar: 1, pat: 'wood', rough: 0.38, metal: 0.05 },
  { id: 'brasil', name: 'Verde e Amarelo', rar: 1, pat: 'brasil' },
  { id: 'onca', name: 'Onça-Pintada', rar: 1, pat: 'leopard' },
  {
    id: 'gelo',
    name: 'Geleira',
    rar: 2,
    pat: 'facets',
    cols: ['#cfeaf7', '#7fc4e8', '#ffffff', '#3f86b8'],
    rough: 0.2,
  },
  {
    id: 'ametista',
    name: 'Ametista',
    rar: 2,
    pat: 'facets',
    cols: ['#4a1d7a', '#8a45d0', '#c996ff', '#240a40'],
    rough: 0.22,
  },
  {
    id: 'dragao',
    name: 'Escamas de Dragão',
    rar: 2,
    pat: 'scales',
    cols: ['#1e7a3a', '#2fb05a', '#b8ffd0', '#0a2e16'],
    rough: 0.3,
    metal: 0.45,
  },
  {
    id: 'colmeia',
    name: 'Colmeia',
    rar: 2,
    pat: 'hex',
    cols: ['#f7b21a', '#d97f0a', '#ffe27a', '#1a1208'],
    rough: 0.35,
  },
  { id: 'sakura', name: 'Sakura', rar: 2, pat: 'sakura' },
  { id: 'tatica', name: 'Camuflagem Tática', rar: 2, pat: 'tech', rough: 0.42, metal: 0.25 },
  { id: 'toxico', name: 'Zona Tóxica', rar: 3, pat: 'toxic' },
  { id: 'calavera', name: 'Dia dos Mortos', rar: 3, pat: 'skull' },
  { id: 'chama', name: 'Fogo Cruzado', rar: 3, pat: 'flame' },
  { id: 'galaxia', name: 'Galáxia', rar: 3, pat: 'galaxy' },
  { id: 'cromo', name: 'Cromo Espelhado', rar: 3, pat: 'chrome', rough: 0.06, metal: 1 },
  { id: 'holo', name: 'Holográfico', rar: 3, pat: 'holo', rough: 0.1, metal: 0.85 },
];
const SKIN = Object.fromEntries(SKINS.map((s) => [s.id, s]));
const RAR = [
  { n: 'Comum', c: '#9aa3a3' },
  { n: 'Rara', c: '#4b8fe2' },
  { n: 'Épica', c: '#a45be0' },
  { n: 'Lendária', c: '#e6c250' },
];

/* ---------- configurações salvas: padrões de todas as armas/operadores e leitura do navegador ---------- */
for (const w of WLIST) {
  SAVE.skins[w] = 'padrao';
  SAVE.att[w] = Object.assign({}, WEAPONS[w].att);
}
for (const o of OPS.atk.concat(OPS.def)) SAVE.load[o.id] = { p: o.prims[0], s: o.secs[0] };
try {
  const s = JSON.parse(localStorage.getItem('pc_v3') || 'null');
  if (s) deepAssign(SAVE, s);
} catch (e) {}
SAVE.fov = Math.max(60, Math.min(90, Math.round(SAVE.fov) || 70)); /* Siege: FOV vertical 60–90 */
for (const o of OPS.atk.concat(OPS.def)) {
  const L = SAVE.load[o.id];
  if (!o.prims.includes(L.p)) L.p = o.prims[0];
  if (!o.secs.includes(L.s)) L.s = o.secs[0];
}
for (const w of WLIST) {
  SAVE.att[w] = attValid(w, SAVE.att[w]);
  if (!SKIN[SAVE.skins[w]]) SAVE.skins[w] = 'padrao';
}
/* arma (com acessórios) que um agente leva: jogador = escolhas salvas; bot = sorteio entre as opções do operador */
function loadoutOf(op, isPlayer) {
  if (isPlayer) {
    const L = SAVE.load[op.id] || { p: op.prims[0], s: op.secs[0] };
    return { p: wVariant(L.p, SAVE.att[L.p]), s: wVariant(L.s, SAVE.att[L.s]) };
  }
  const rp = (l) =>
    Math.random() < 0.5
      ? l[0]
      : l[
          1 + ((Math.random() * (l.length - 1)) | 0)
        ]; /* metade das vezes a arma de fábrica do operador */
  const p = rp(op.prims),
    s = rp(op.secs);
  return { p: wVariant(p, botAtt(p)), s: wVariant(s, botAtt(s)) };
}

/* ---------- dificuldade dos bots ----------
   react: tempo de reação (s) · err: erro base de mira (rad) · conv: tempo para a mira assentar (s)
   turn: velocidade de giro (rad/s) · head: chance de mirar na cabeça depois que a mira assenta */
const DIFFS = {
  easy: { react: 0.6, err: 0.036, conv: 1.3, turn: 4, head: 0.04, lag: 0.2, label: 'Recruta' },
  normal: { react: 0.42, err: 0.021, conv: 0.9, turn: 6, head: 0.1, lag: 0.13, label: 'Operador' },
  hard: { react: 0.3, err: 0.015, conv: 0.65, turn: 8.5, head: 0.2, lag: 0.09, label: 'Elite' },
};
let DIFF = DIFFS[SAVE.diff] || DIFFS.normal;
