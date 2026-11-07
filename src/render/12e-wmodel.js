/* =====================================================================
   ARMAS REAIS MODULARES (primeira pessoa e arsenal; terceira pessoa continua procedural, leve)
   Cada modelo vem de assets/wm_<nome>.bin (GLB só com geometria + normal/ORM, no espaço do jogo: cano para −Z,
   eixo do cano em y=.045) e assets/wa_<nome>_*.webp (albedo separado, para a skin ser composta por cima).
   WREAL[arma] diz quais peças montar; os acessórios do jogo (mira, cano, empunhadura, laser) escolhem as peças:
   peça real quando existe, procedural (wSight/wLaser em 12b) quando não.
   ===================================================================== */
const WM = { on: false, ready: {}, started: false, bb: {}, alb: {}, img: {}, tex: {} };
/* peças do M4 (nomes dos nós do GLB) */
const M4_HG = {
  kmode: 'Handguard Kmode Unreal',
  classic: 'Handguard Classic Unreal',
  mk18: 'MK 18 Circle Base Unreal',
  dmr: 'Handguard DMR Unreal',
};
const M4_ST = {
  classic: 'Stock Classic Unreal',
  tube: 'Stockless Tube Unreal',
  light: 'Stock Light V Unreal',
  dmr: 'Stock DMR Unreal',
};
const M4_MAG = {
  light: 'Magazine Light.003',
  large: 'Magazine Large Unreal',
  def: 'Magazine Default Unreal',
};
const M4_DEV = {
  none: 'Flash Hider Unreal',
  flash: 'Flash Hider Unreal',
  comp: 'Muzzle Break Unreal',
  brake: 'Muzzle Break Unreal',
  ext: 'Flash Hider Unreal',
  sup: 'Suppressor Unreal',
};
/* LAYOUT de cada modelo: devolve as peças (main/rear/mag/dev/extra) e as âncoras (grip, fore, tip, sight, eye, top, laser) no espaço do jogo.
   dev = peça de boca-de-cano {n:nome,dz:deslocamento em z,sc:escala radial}; extra = peças soltas (empunhadura dianteira) */
const WMOD = {
  m4: {
    bin: 'wm_m4.bin',
    alb: 'wa_m4.json',
    layout(R, att, bb) {
      const hg = bb[M4_HG[R.hg]],
        hgMid = (hg.min.z + hg.max.z) / 2,
        L = {
          main: ['M4 Body', 'Trigger Classic Unreal', M4_HG[R.hg], R.grip],
          rear: [M4_ST[R.stock]],
          mag: M4_MAG[R.mag],
          magHome: [0, 0, -0.05],
          extra: [],
          grip: [0, -0.058, 0.087],
          fore: [0, hg.min.y - 0.004, hgMid + 0.02],
          hold: 'hand',
          sight: [0, 0.108, 0.03],
          eye: 0.2,
          top: 0.1,
          rail: 0.077,
          sightZ: -0.015,
          laserZ: hg.min.z + 0.07,
          laserX: -0.032,
          tipZ: hg.min.z - 0.07,
        };
      const dn = M4_DEV[att.barrel] || M4_DEV.none;
      L.dev = { n: dn, dz: hg.min.z + 0.405, sc: att.barrel === 'sup' ? 0.72 : 1 };
      L.extraOff =
        {}; /* as peças da empunhadura vieram de outro guarda-mão: sobem até encostar no de baixo desta arma */
      if (att.grip === 'vert') {
        const g = bb['Front grip vert Unreal'],
          dy = hg.min.y - g.max.y + 0.004;
        L.extra.push('Front grip vert Unreal');
        L.extraOff['Front grip vert Unreal'] = [0, dy, 0];
        L.fore = [0, g.min.y + dy + 0.035, (g.min.z + g.max.z) / 2 - 0.05];
        L.hold = 'vert';
      } /* beta.8: o punho cai sobre a empunhadura (antes ficava atrás dela) */
      else if (att.grip === 'ang') {
        const g = bb['Front grip angled Unreal'],
          dy = hg.min.y - g.max.y + 0.004,
          gz = (g.min.z + g.max.z) / 2,
          dz = Math.min(0, Math.max(hg.min.z + 0.04, hgMid - 0.03) - gz);
        L.extra.push('Front grip angled Unreal');
        L.extraOff['Front grip angled Unreal'] = [0, dy, dz];
        L.fore = [0, (g.min.y + g.max.y) / 2 + dy, gz + dz];
        L.hold = 'hand';
      }
      return L;
    },
  },
  /* AK-47: peça única + carregador; sem trilho, sem peças de boca → mira/boca/empunhadura procedurais */
  ak47: {
    bin: 'wm_ak47.bin',
    alb: 'wa_ak47.json',
    layout(R, att, bb) {
      const L = {
        main: ['AK'],
        rear: [],
        mag: 'mag',
        magHome: [0, -0.02, -0.12],
        extra: [],
        grip: [0, -0.06, 0.07],
        fore: [0, 0.0, -0.29],
        hold: 'hand',
        sight: [0, 0.092, -0.2],
        eye: 0.2,
        top: 0.084,
        rail: 0.083,
        sightZ: -0.07,
        laserZ: -0.3,
        laserX: -0.03,
        tipZ: -0.575,
        pm: { z: -0.575, r: 0.0085 },
        fg: { z: -0.31, y: 0.022, hy: 0.0 },
      };
      return L;
    },
  },
  /* MP7: corpo + coronha (some ao mirar) + carregador; trilho no topo, mira de ferro articulada no próprio modelo */
  /* SS2 V5: fuzil de precisão (Carcará); coronha some ao mirar; carregador mag + mag_1 */
  ss2: {
    bin: 'wm_ss2.bin',
    alb: 'wa_ss2.json',
    layout(R, att, bb) {
      return {
        main: Object.keys(bb || {}).filter((k) => !/^mag|^rear$/.test(k)),
        rear: ['rear'],
        mag: 'mag',
        magx: ['mag_1'],
        magHome: [0, -0.116, -0.017],
        extra: [],
        grip: [0, -0.105, 0.098],
        fore: [0, -0.03, -0.16],
        hold: 'hand',
        sight: [0, 0.068, -0.166],
        eye: 0.3,
        top: 0.04,
        rail: 0.023,
        sightZ: 0.02,
        laserZ: -0.15,
        laserX: -0.03,
        tipZ: -0.329,
        pm: { z: -0.329, r: 0.008 },
        fg: { z: -0.2, y: -0.002, hy: 0.0 },
        skinAll: true,
      };
    },
  },
  /* P-9 (Pistol 2): armação+ferrolho reais; carregador em 3 peças (mag, mag_1, mag_2) */
  pistol2: {
    bin: 'wm_pistol2.bin',
    alb: 'wa_pistol2.json',
    layout(R, att, bb) {
      return {
        main: Object.keys(bb || {}).filter((k) => !/^mag/.test(k)),
        rear: [],
        mag: 'mag',
        magx: ['mag_1', 'mag_2'],
        magHome: [0, -0.03, 0.04],
        extra: [],
        grip: [0, -0.03, 0.05],
        fore: [0, -0.03, 0.05],
        hold: 'pistol',
        sight: [0, 0.066, 0.044],
        eye: 0.2,
        top: 0.064,
        rail: 0.059,
        sightZ: 0,
        laserZ: -0.09,
        laserX: 0,
        tipZ: -0.131,
        pm: { z: -0.131, r: 0.0065 },
        skinAll: true,
        nolaser: true,
      };
    },
  },
  /* USP (Onça .45): armação+ferrolho reais, carregador separado */
  usp: {
    bin: 'wm_usp.bin',
    alb: 'wa_usp.json',
    layout(R, att, bb) {
      return {
        main: Object.keys(bb || {}).filter((k) => !/^mag/.test(k)),
        rear: [],
        mag: 'mag',
        magHome: [0, -0.03, 0.03],
        extra: [],
        grip: [0, -0.03, 0.045],
        fore: [0, -0.03, 0.045],
        hold: 'pistol',
        sight: [0, 0.069, 0.05],
        eye: 0.2,
        top: 0.069,
        rail: 0.064,
        sightZ: 0,
        laserZ: -0.09,
        laserX: 0,
        tipZ: -0.12,
        pm: { z: -0.12, r: 0.0075 },
        skinAll: true,
        nolaser: true,
      };
    },
  },
  /* MP5 (Marimbondo): corpo + coronha retrátil (some ao mirar) + carregador curvo; trilho no topo */
  mp5: {
    bin: 'wm_mp5.bin',
    alb: 'wa_mp5.json',
    layout(R, att, bb) {
      return {
        main: Object.keys(bb || {}).filter((k) => !/^mag|^rear$/.test(k)),
        rear: ['rear'],
        mag: 'mag',
        magHome: [0, -0.07, -0.16],
        extra: [],
        grip: [0, -0.095, 0.035],
        fore: [0, 0.012, -0.2],
        hold: 'hand',
        sight: [0, 0.115, 0.01],
        eye: 0.2,
        top: 0.1,
        rail: 0.095,
        sightZ: -0.08,
        laserZ: -0.2,
        laserX: -0.032,
        tipZ: -0.4,
        pm: { z: -0.4, r: 0.0075 },
        fg: { z: -0.2, y: 0.03, hy: 0.0 },
        skinAll: true,
      };
    },
  },
  /* Glock 19 (Pardal 5.7): armação, ferrolho, cano e gatilho reais; carregador em 2 peças */
  g19: {
    bin: 'wm_g19.bin',
    alb: 'wa_g19.json',
    layout(R, att, bb) {
      return {
        main: Object.keys(bb || {}).filter((k) => !/^mag/.test(k)),
        rear: [],
        mag: 'mag',
        magx: ['mag_1'],
        magHome: [0, -0.03, 0.04],
        extra: [],
        grip: [0, -0.02, 0.04],
        fore: [0, -0.02, 0.04],
        hold: 'pistol',
        sight: [0, 0.074, 0.06],
        eye: 0.2,
        top: 0.072,
        rail: 0.068,
        sightZ: 0,
        laserZ: -0.09,
        laserX: 0,
        tipZ: -0.11,
        pm: { z: -0.11, r: 0.0065 },
        skinAll: true,
        nolaser: true,
      };
    },
  },
  /* M249 (Boitatá): corpo+cano reais (bipé e ótica originais removidos), coronha separada (some ao mirar); sem carregador visível */
  m249: {
    bin: 'wm_m249.bin',
    alb: 'wa_m249.json',
    layout(R, att, bb) {
      return {
        main: Object.keys(bb || {}).filter((k) => k !== 'rear'),
        rear: ['rear'],
        magHome: [0, -0.09, -0.03],
        magDraw: (W) => {
          W.box(0.09, 0.1, 0.15, 0, -0.092, -0.03, { m: 'M', c: '#454c3c' });
          W.box(0.094, 0.012, 0.154, 0, -0.04, -0.03, { m: 'M', c: '#2c3027' });
          W.box(0.05, 0.02, 0.1, 0, -0.146, -0.03, { m: 'M', c: '#363c2f' });
          W.box(0.022, 0.03, 0.07, 0.02, -0.034, -0.03, { m: 'M', c: '#b9a45a' });
        },
        extra: [],
        grip: [0, -0.1, 0.105],
        fore: [0, -0.03, -0.28],
        hold: 'hand',
        sight: [0, 0.126, 0.0],
        eye: 0.3,
        top: 0.124,
        rail: 0.116,
        sightZ: 0,
        laserZ: -0.3,
        laserX: -0.03,
        tipZ: -0.62,
        pm: { z: -0.62, r: 0.009 },
        fg: { z: -0.25, y: -0.03, hy: 0.0 },
        skinAll: true,
      };
    },
  },
  /* SCAR-L (Jararaca): corpo+guarda-mão+cano reais, coronha separada (some ao mirar), carregador separado */
  scarl: {
    bin: 'wm_scarl.bin',
    alb: 'wa_scarl.json',
    layout(R, att, bb) {
      const K = Object.keys(bb || {});
      return {
        main: K.filter((k) => !/^mag|^rear/.test(k)),
        rear: K.filter((k) => /^rear/.test(k)),
        mag: 'mag',
        magHome: [0, -0.08, -0.03],
        extra: [],
        grip: [0, -0.06, 0.12],
        fore: [0, 0.0, -0.16],
        hold: 'hand',
        sight: [0, 0.125, 0.14],
        eye: 0.2,
        top: 0.1,
        rail: 0.096,
        sightZ: 0,
        laserZ: -0.2,
        laserX: -0.032,
        tipZ: -0.52,
        pm: { z: -0.52, r: 0.008 },
        fg: { z: -0.2, y: -0.005, hy: 0.0 },
        skinAll: true,
      };
    },
  },
  /* SVD (Falcão): fuzil de precisão completo (coronha vazada separada, some ao mirar); sem carregador separado */
  svd: {
    bin: 'wm_svd.bin',
    alb: 'wa_svd.json',
    layout(R, att, bb) {
      const K = Object.keys(bb || {});
      return {
        main: K.filter((k) => !/^rear/.test(k)),
        rear: K.filter((k) => /^rear/.test(k)),
        mag: 'mag',
        magHome: [0, -0.03, -0.02],
        extra: [],
        grip: [0, -0.03, 0.1],
        fore: [0, 0.005, -0.22],
        hold: 'hand',
        sight: [0, 0.082, -0.1],
        eye: 0.3,
        top: 0.068,
        rail: 0.066,
        sightZ: -0.19,
        laserZ: -0.2,
        laserX: -0.03,
        tipZ: -0.65,
        pm: { z: -0.65, r: 0.007 },
        fg: { z: -0.2, y: 0.0, hy: 0.0 },
        skinAll: true,
      };
    },
  },
  skor: {
    bin: 'wm_skor.bin',
    alb: 'wa_skor.json',
    layout(R, att, bb) {
      return {
        main: Object.keys(bb || {}).filter((k) => !/^mag/.test(k)),
        rear: [],
        mag: 'mag',
        magHome: [0, -0.01, -0.012],
        extra: [],
        grip: [0, -0.034, 0.107],
        fore: [0, -0.034, 0.107],
        hold: 'pistol',
        sight: [0, 0.07, 0.04],
        eye: 0.2,
        top: 0.07,
        rail: 0.066,
        sightZ: 0.04,
        laserZ: -0.09,
        laserX: 0,
        tipZ: -0.138,
        pm: { z: -0.138, r: 0.009 },
        skinAll: true,
        nolaser: true,
      };
    },
  },
  rev: {
    bin: 'wm_rev.bin',
    alb: 'wa_rev.json',
    layout(R, att, bb) {
      return {
        main: ['Object_15'],
        rear: [],
        nomag: true,
        extra: [],
        grip: [0, -0.02, 0.075],
        fore: [0, -0.02, 0.075],
        hold: 'pistol',
        sight: [0, 0.067, 0.03],
        eye: 0.2,
        top: 0.067,
        rail: 0.064,
        sightZ: 0.03,
        laserZ: -0.1,
        laserX: 0,
        tipZ: -0.156,
        pm: { z: -0.156, r: 0.0095 },
        skinAll: true,
        nolaser: true,
      };
    },
  },
  pump: {
    bin: 'wm_pump.bin',
    alb: 'wa_pump.json',
    layout(R, att, bb) {
      return {
        main: ['Object_4'],
        rear: [],
        nomag: true,
        pump: 'pump',
        pumpHome: [0, 0.03, -0.225],
        extra: [],
        grip: [0, -0.055, 0.175],
        fore: [0, -0.012, -0.225],
        hold: 'hand',
        sight: [0, 0.079, 0.03],
        eye: 0.27,
        top: 0.079,
        rail: 0.077,
        sightZ: 0.03,
        laserZ: -0.35,
        laserX: -0.032,
        tipZ: -0.496,
        pm: { z: -0.496, r: 0.0105 },
        skinAll: true,
      };
    },
  },
  semi: {
    bin: 'wm_semi.bin',
    alb: 'wa_semi.json',
    layout(R, att, bb) {
      return {
        main: Object.keys(bb || {}),
        rear: [],
        nomag: true,
        extra: [],
        grip: [0, -0.06, 0.18],
        fore: [0, 0.002, -0.2],
        hold: 'hand',
        sight: [0, 0.092, 0.02],
        eye: 0.2,
        top: 0.092,
        rail: 0.088,
        sightZ: 0.02,
        laserZ: -0.35,
        laserX: -0.032,
        tipZ: -0.494,
        pm: { z: -0.494, r: 0.0105 },
        fg: { z: -0.2, y: 0.006, hy: 0.006 },
        skinAll: true,
      };
    },
  },
  ump: {
    bin: 'wm_ump.bin',
    alb: 'wa_ump.json',
    layout(R, att, bb) {
      return {
        main: ['Object_2', 'Object_3'],
        rear: [],
        mag: 'mag',
        magHome: [0, -0.03, -0.143],
        extra: [],
        grip: [0, -0.06, 0.05],
        fore: [0, -0.03, -0.24],
        hold: 'hand',
        sight: [0, 0.09, -0.12],
        eye: 0.2,
        top: 0.09,
        rail: 0.088,
        sightZ: -0.12,
        laserZ: -0.3,
        laserX: -0.032,
        tipZ: -0.347,
        pm: { z: -0.347, r: 0.011 },
        fg: { z: -0.285, y: 0.028, hy: 0.0 },
        skinAll: true,
      };
    },
  },
  mp7: {
    bin: 'wm_mp7.bin',
    alb: 'wa_mp7.json',
    layout(R, att, bb) {
      return {
        main: ['SK_SMG_MP7_Base'],
        rear: ['rear'],
        mag: 'mag',
        magHome: [0, -0.02, 0.083],
        extra: [],
        grip: [0, -0.055, 0.113],
        fore: [0, 0.012, -0.07],
        hold: 'hand',
        sight: [0, 0.099, 0.17],
        eye: 0.32,
        top: 0.094,
        rail: 0.099,
        sightZ: 0.03,
        laserZ: -0.09,
        laserX: -0.032,
        tipZ: -0.161,
        pm: { z: -0.161, r: 0.007 },
        fg: { z: -0.065, y: 0.03, hy: 0.0 },
        builtinGrip: true,
        fgHold: -0.02,
      };
    },
  } /* MP7: empunhadura dianteira reta dobrável (a mão de apoio segura nela, não no corpo) */,
};
/* configuração por arma */
const WREAL = {
  rifle: { m: 'm4', hg: 'kmode', stock: 'classic', mag: 'def', grip: 'Grip Default Unreal' },
  jararaca: { m: 'scarl' },
  dmr: { m: 'svd' },
  carcara: { m: 'ss2' },
  boitata: { m: 'm249' },
  tupa: { m: 'ak47' },
  smg: { m: 'mp7' },
  pistol: { m: 'pistol2' },
  onca: { m: 'usp' },
  pardal: { m: 'g19' },
  marimbondo: { m: 'mp5' },
  cascavel: { m: 'ump' },
  abelha: { m: 'skor' },
  jaguar: { m: 'rev' },
  shotgun: { m: 'pump' },
  ressaca: { m: 'semi' },
};
const WM_FILES = {};
for (const k in WMOD) WM_FILES[k] = { bin: WMOD[k].bin, alb: WMOD[k].alb };
const WM_SKINNED = /Body|Handguard|MK 18|Stock|Receiver|Slide|Frame|^AK|Rifle|gun|SK_|rear/;
function wmImg(file) {
  return new Promise((res) => {
    const u = assetURL(file, 'image/webp');
    if (!u) {
      res(null);
      return;
    }
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = u;
  });
}
async function wmLoadScene(sc, mk) {
  const S = sc.__wm || (sc.__wm = {});
  const bytes = ASSET_BYTES(WM_FILES[mk].bin);
  if (!bytes) return;
  const c = await B.SceneLoader.LoadAssetContainerAsync('', bytes.slice(), sc, null, '.glb');
  c.addAllToScene();
  const tpl = {};
  for (const m of c.meshes.slice()) {
    if (m.name === '__root__' || !m.getTotalVertices || m.getTotalVertices() === 0) continue;
    m.setParent(null);
    m.computeWorldMatrix(true);
    m.bakeCurrentTransformIntoVertices();
    m.refreshBoundingInfo();
    m.setEnabled(false);
    m.isPickable = false;
    m.receiveShadows = false;
    m.alwaysSelectAsActiveMesh = true;
    tpl[m.name] = m;
    const b = m.getBoundingInfo().boundingBox;
    (WM.bb[mk] || (WM.bb[mk] = {}))[m.name] = { min: b.minimum.clone(), max: b.maximum.clone() };
  }
  for (const n of c.transformNodes.slice()) if (n.name === '__root__') n.dispose();
  S[mk] = tpl;
}
/* carrega UM modelo (imagens + as duas cenas); chamado em fila, na ordem de necessidade, cedendo o thread entre modelos */
async function wmLoadModel(mk) {
  const jb = ASSET_BYTES(WM_FILES[mk].alb);
  if (!jb) return false;
  const map = JSON.parse(new TextDecoder().decode(jb));
  WM.alb[mk] = map;
  await Promise.all(
    Object.values(map).map(async (f) => {
      if (!WM.img[f]) WM.img[f] = await wmImg(f);
    })
  );
  await wmLoadScene(game, mk);
  await new Promise((r) => setTimeout(r, 20));
  await wmLoadScene(lobby, mk);
  WM.ready[mk] = true;
  WGEO_CACHE.clear();
  try {
    if (typeof VM !== 'undefined') VM.key = '';
    if (typeof G !== 'undefined' && G.phase === 'menu' && typeof showKey !== 'undefined') {
      showKey = '';
      if (typeof renderMenu === 'function') renderMenu();
    }
  } catch (e) {}
  return true;
}
/* ordem: modelos das armas do equipamento salvo primeiro, depois o resto */
function wmOrder() {
  const first = [],
    seen = new Set();
  const take = (id) => {
    const r = typeof id === 'string' && WEAPONS[id] && WREAL[wBase(id)];
    if (r && !seen.has(r.m)) {
      seen.add(r.m);
      first.push(r.m);
    }
  };
  const walk = (o) => {
    if (!o) return;
    if (typeof o === 'string') take(o);
    else if (typeof o === 'object') for (const k in o) walk(o[k]);
  };
  walk(SAVE.load);
  for (const id of ['rifle', 'pistol']) take(id);
  for (const mk in WM_FILES)
    if (!seen.has(mk)) {
      seen.add(mk);
      first.push(mk);
    }
  return first;
}
async function wmInit() {
  if (WM.started) return;
  WM.started = true;
  try {
    if (
      typeof ASSET_BYTES !== 'function' ||
      !B.SceneLoader ||
      !B.SceneLoader.LoadAssetContainerAsync
    )
      return;
    const T0 = performance.now(),
      pr = ((window.__pcProf || (window.__pcProf = {})).wm = {});
    for (const mk of wmOrder()) {
      const t = performance.now();
      await wmLoadModel(mk);
      pr[mk] = Math.round(performance.now() - t);
      await new Promise((r) => setTimeout(r, 30));
    }
    pr.total = Math.round(performance.now() - T0);
    WM.on = true;
    HOOK.wmReady && HOOK.wmReady();
  } catch (e) {
    console.warn('wm', e);
    WM.on = false;
  }
}
/* materiais: albedo original (padrão) ou composto com a skin */
function wmMat(scene, mk, tm, sid, skinned) {
  const C = matCache(scene),
    sk = skinned && sid && sid !== 'padrao' ? sid : 'padrao',
    key = 'wm|' + tm.name + '|' + sk;
  if (C[key]) return C[key];
  const file = WM.alb[mk] && WM.alb[mk][tm.name],
    img = file && WM.img[file];
  const m = tm.clone('wmm_' + tm.name + '_' + sk);
  m.albedoColor = new B.Color3(1, 1, 1);
  m.backFaceCulling = true;
  m.alpha = 1;
  const env = wEnv(scene);
  if (env) {
    m.reflectionTexture = env;
    m.environmentIntensity = 0.9;
  }
  if (img) {
    if (sk === 'padrao') {
      const tk = scene.uid + '|' + file;
      let t = WM.tex[tk];
      if (!t) {
        t = WM.tex[tk] = new B.Texture(assetURL(file, 'image/webp'), scene, false, false);
      }
      m.albedoTexture = t;
    } else {
      const S = SKIN[sk] || SKIN.padrao,
        st = skinTex(S.id, 512),
        w = Math.min(img.width, 1024),
        h = Math.min(img.height, 1024),
        c = mkCanvas(w, h),
        g = c.getContext('2d');
      /* a skin é a cor; o albedo original só dá o relevo (desgaste, arestas). Antes multiplicava tudo e a arma ficava quase preta */
      g.drawImage(st.canvas, 0, 0, w, h);
      g.globalCompositeOperation = 'multiply';
      g.globalAlpha = 0.4;
      g.drawImage(img, 0, 0, w, h);
      g.globalCompositeOperation = 'screen';
      g.globalAlpha = 0.22;
      g.drawImage(st.canvas, 0, 0, w, h);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      const t = new B.DynamicTexture(
        'wmt_' + sk,
        { width: w, height: h },
        scene,
        true,
        B.Texture.TRILINEAR_SAMPLINGMODE,
        undefined,
        false
      );
      t.getContext().drawImage(c, 0, 0);
      t.update(false);
      m.albedoTexture = t;
      if (st.glow) {
        m.emissiveTexture = dyn(scene, st.glow);
        m.emissiveColor = new B.Color3(1, 1, 1);
        m.emissiveIntensity = 1.2;
      }
      if (S.metal != null) m.metallic = Math.min(0.5, 0.1 + S.metal * 0.4);
      if (S.rough != null)
        m.roughness = Math.min(
          1,
          0.45 + S.rough * 0.5
        ); /* metal alto + ambiente escuro = arma preta */
    }
  }
  return (C[key] = m);
}
/* o corpo procedural some; sobram só os acessórios sem peça real (mira ótica, laser) e as âncoras das mãos */
function wRealBody(W, info, D, att, R) {
  const L = WMOD[R.m].layout(R, att, WM.bb[R.m]);
  if (L.pumpHome) {
    W.tgt('pump', L.pumpHome);
    W.tgt('gun');
    info.pump = true;
    info.pumpHome = new V3(...L.pumpHome);
  }
  if (L.nomag) {
    info.mag = null;
    W.tgt('gun');
  } else {
    info.mag = true;
    info.magHome = new V3(...L.magHome);
    W.tgt('mag', L.magHome);
    if (L.magDraw) L.magDraw(W);
    W.tgt('gun');
  }
  info.grip.set(...L.grip);
  info.fore.set(...L.fore);
  info.hold = L.hold;
  info.sight.set(...L.sight);
  info.eye = L.eye;
  info.tip.set(0, 0.045, L.tipZ);
  if (att.sight !== 'iron') {
    wSight(W, att.sight, L.sightZ, L.top, info, {});
    if (L.rail != null && L.top - L.rail > 0.002) {
      const base = L.rail - 0.004,
        h = L.top - base;
      W.box(0.026, h, 0.05, 0, base + h / 2, L.sightZ, { m: 'M', c: '#26292b' });
      W.box(0.034, 0.004, 0.058, 0, L.rail - 0.0005, L.sightZ, { m: 'M', c: '#1e2022' });
    }
  } /* base da mira apoiada no trilho (sem flutuar) */
  if (L.pm && att.barrel !== 'none') wMuzzle(W, att.barrel, L.pm.z, 0.045, L.pm.r, info, 'none');
  if (L.fg) {
    if (att.grip === 'vert' || (L.builtinGrip && att.grip === 'none')) {
      wFore(W, 'vert', L.fg.z, L.fg.y, info);
      if (L.fgHold != null) info.fore.y = L.fgHold;
    } else if (att.grip === 'ang') wFore(W, 'ang', L.fg.z, L.fg.y, info, L.fg.hy);
  }
  if (att.laser && !L.nolaser) wLaser(W, L.laserZ, 0.043, L.laserX);
}
/* põe as peças reais na arma (chamado por buildWeapon quando !low) */
function wmAttach(scene, bid, sid, att, info, g, nodes) {
  const R = WREAL[bid],
    S = scene.__wm && scene.__wm[R.m];
  if (!S) return false;
  const L = WMOD[R.m].layout(R, att, WM.bb[R.m]);
  const put = (name, parent) => {
    const t = S[name];
    if (!t) return null;
    const m = t.clone('wm_' + name, parent || g);
    m.setEnabled(true);
    m.isPickable = false;
    m.receiveShadows = false;
    m.alwaysSelectAsActiveMesh = true;
    m.material = wmMat(scene, R.m, t.material, sid, WM_SKINNED.test(name) || L.skinAll);
    return m;
  };
  const rear = new B.TransformNode('gunRear', scene);
  rear.parent = g;
  info.rear = rear; /* coronha some ao mirar (como nas armas procedurais) */
  for (const n of L.main) put(n);
  for (const n of L.rear) put(n, rear);
  for (const n of L.extra) {
    const m = put(n);
    const o = L.extraOff && L.extraOff[n];
    if (m && o) {
      m.position.x += o[0];
      m.position.y += o[1];
      m.position.z += o[2];
    }
  }
  if (L.pump) {
    const pm = put(L.pump, nodes.pump || g);
    if (pm && nodes.pump) {
      pm.position.set(0, 0, 0);
      pm.position.subtractInPlace(nodes.pump.position);
    }
  }
  if (L.mag) {
    const mg = put(L.mag, nodes.mag || g);
    if (mg && nodes.mag) {
      mg.position.set(0, 0, 0);
      mg.position.subtractInPlace(nodes.mag.position);
    }
    for (const x of L.magx || []) {
      const mx = put(x, nodes.mag || g);
      if (mx && nodes.mag) {
        mx.position.set(0, 0, 0);
        mx.position.subtractInPlace(nodes.mag.position);
      }
    }
  }
  if (L.dev) {
    const dm = put(L.dev.n);
    if (dm) {
      dm.position.z += L.dev.dz;
      if (L.dev.sc && L.dev.sc !== 1) {
        dm.scaling.set(L.dev.sc, L.dev.sc, 1);
        dm.position.y += 0.045 * (1 - L.dev.sc);
      }
      const b = S[L.dev.n].getBoundingInfo().boundingBox;
      info.tip.set(0, 0.045, b.minimum.z + L.dev.dz);
    }
  }
  return true;
}

Promise.resolve().then(() => wmInit());

/* ---------- gadgets reais (CC-BY, ver CREDITS) — modelos GLB com textura; se algo falhar, vale o procedural ---------- */
const WG = { tpl: {}, on: false };
async function wgInit() {
  try {
    if (
      typeof ASSET_BYTES !== 'function' ||
      !B.SceneLoader ||
      !B.SceneLoader.LoadAssetContainerAsync
    )
      return;
    for (const kind of ['frag', 'impact', 'breach', 'shield', 'wire', 'device', 'drone']) {
      const bytes = ASSET_BYTES('wg_' + kind + '.bin');
      if (!bytes) continue;
      const c = await B.SceneLoader.LoadAssetContainerAsync('', bytes.slice(), game, null, '.glb');
      for (const m of c.materials) {
        if (m.reflectionTexture === undefined) continue;
        m.environmentIntensity = 0.8;
      }
      WG.tpl[kind] = c;
      await new Promise((r) => setTimeout(r, 20));
    }
    WG.on = true;
  } catch (e) {
    console.warn('wg', e);
  }
}
function wgBuild(scene, kind, parent) {
  const c = scene === game && WG.tpl[kind];
  if (!c) return false;
  const inst = c.instantiateModelsToScene((n) => n, false, { doNotInstantiate: true });
  for (const n of inst.rootNodes) n.parent = parent;
  for (const m of parent.getChildMeshes()) {
    m.isPickable = false;
    m.receiveShadows = true;
  }
  return true;
}
Promise.resolve().then(() => wgInit());
