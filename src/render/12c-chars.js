/* =====================================================================
   OPERADORES, EQUIPAMENTOS E BRAÇOS EM 1ª PESSOA (modelos)
   ===================================================================== */
/* ---------- equipamentos no mundo ----------
   Mesma modelagem dos operadores (caixas arredondadas, cascas, oclusão assada, atlas PBR):
   cada equipamento é UMA malha (+ o LED piscante do desativador, separado). */
const GADGET_OP = { id: '_equip', look: { pat: null, cols: ['#5f6052'] } };
function gadgetGeo(kind) {
  const k = 'gad|' + kind;
  if (CH_CANV[k]) return CH_CANV[k];
  const g = GB(),
    dark = lin('#1c1d1f'),
    od = lin('#4a4d3c'),
    steel = lin('#5b5e60'),
    poly = lin('#26282b');
  if (kind === 'breach') {
    gBox(g, [0, 0, 0], [0.5, 0.35, 0.045], 0.012, { reg: 'gear', col: od, bulge: 0.006 });
    for (const y of [-0.1, 0.1])
      gBox(g, [0, y, -0.026], [0.46, 0.045, 0.012], 0.004, { reg: 'gear', col: linMul(od, 0.7) });
    gBox(g, [0, 0, -0.038], [0.1, 0.1, 0.03], 0.008, { reg: 'hard', col: poly });
    gBox(g, [0.03, 0.03, -0.055], [0.02, 0.012, 0.012], 0.003, { reg: 'metal', col: steel });
    for (const s of [-1, 1])
      gBox(g, [s * 0.225, 0, -0.03], [0.03, 0.3, 0.02], 0.006, { reg: 'rubber', col: dark });
  } else if (kind === 'thermal') {
    gLoft(
      g,
      [
        { c: [0, 0, 0.03], rx: 0.25, rz: 0.25 },
        { c: [0, 0, -0.02], rx: 0.25, rz: 0.25 },
        { c: [0, 0, -0.04], rx: 0.235, rz: 0.235 },
      ],
      { reg: 'metal', col: steel, seg: 28, ref: [0, 1, 0], cap0: true, cap1: true }
    );
    gRing(g, [0, 0, -0.042], 0.18, 0.18, 0.012, 0.012, {
      reg: 'hard',
      col: lin('#8a2a1e'),
      n: 24,
      seg: 6,
      ref: [0, 0, 1],
    });
    gBox(g, [0, 0, -0.06], [0.11, 0.11, 0.05], 0.012, { reg: 'hard', col: poly });
    gBox(g, [0, 0.03, -0.088], [0.04, 0.016, 0.01], 0.003, {
      reg: 'glass',
      col: [0.7, 0.12, 0.08],
    });
  } else if (kind === 'shield') {
    gBox(g, [0, 0.56, 0], [1.2, 1.08, 0.08], 0.03, {
      reg: 'hard',
      col: lin('#2b3036'),
      bulge: 0.01,
    });
    gBox(g, [0, 0.9, -0.045], [0.62, 0.13, 0.03], 0.01, { reg: 'glass', col: [0.35, 0.45, 0.5] });
    gBox(g, [0, 1.1, 0], [1.22, 0.05, 0.1], 0.015, { reg: 'metal', col: steel });
    gBox(g, [0, 0.03, 0.16], [1.15, 0.05, 0.36], 0.015, { reg: 'metal', col: steel });
    for (const s of [-0.45, 0.45])
      gBox(g, [s, 0.3, 0.14], [0.06, 0.5, 0.26], 0.015, { reg: 'metal', col: steel });
    for (let i = 0; i < 3; i++)
      gBox(g, [-0.4 + i * 0.4, 0.5, -0.045], [0.25, 0.06, 0.012], 0.005, {
        reg: 'hard',
        col: lin('#a08a32'),
      });
  } else if (kind === 'wire') {
    for (let i = 0; i < 5; i++)
      gLoft(
        g,
        Array.from({ length: 19 }, (_, j) => {
          const a = (Math.PI * 2 * j) / 18;
          return {
            c: [
              -1 + i * 0.5 + Math.sin(a * 3) * 0.03,
              0.32 + Math.cos(a) * 0.31,
              Math.sin(a) * 0.31,
            ],
            rx: 0.012,
            rz: 0.012,
          };
        }),
        { reg: 'metal', col: lin('#7a7a70'), closed: true, seg: 5, noOcc: true }
      );
    gBox(g, [0, 0.03, 0], [2.4, 0.02, 0.02], 0.006, { reg: 'metal', col: steel });
    for (const x of [-1.1, 1.1])
      gBox(g, [x, 0.35, 0], [0.04, 0.7, 0.04], 0.01, { reg: 'hard', col: dark });
  } else if (kind === 'device') {
    gBox(g, [0, 0.1, 0], [0.34, 0.2, 0.26], 0.03, { reg: 'hard', col: lin('#2a2d31') });
    gBox(g, [0, 0.215, 0], [0.3, 0.03, 0.22], 0.012, { reg: 'hard', col: lin('#3d4248') });
    gBox(g, [-0.03, 0.245, 0.0], [0.16, 0.02, 0.12], 0.006, {
      reg: 'glass',
      col: [0.2, 0.35, 0.3],
    });
    gStrap(
      g,
      [
        [-0.08, 0.2, 0.1],
        [-0.06, 0.27, 0.1],
        [0.06, 0.27, 0.1],
        [0.08, 0.2, 0.1],
      ],
      0.03,
      0.015,
      { reg: 'rubber', col: dark, ref: [0, 1, 0] }
    );
    gLoft(
      g,
      [
        { c: [-0.12, 0.2, 0], rx: 0.008, rz: 0.008 },
        { c: [-0.12, 0.5, 0], rx: 0.004, rz: 0.004 },
      ],
      { reg: 'rubber', col: dark, seg: 6, cap1: true, noOcc: true }
    );
    for (const s of [-1, 1])
      gBox(g, [s * 0.17, 0.1, 0], [0.02, 0.16, 0.2], 0.006, { reg: 'rubber', col: dark });
  } else if (kind === 'drone') {
    gBox(g, [0, 0.12, 0], [0.24, 0.09, 0.26], 0.025, { reg: 'hard', col: lin('#2a2d31') });
    gBox(g, [0, 0.17, -0.02], [0.16, 0.02, 0.16], 0.008, { reg: 'hard', col: lin('#3d4248') });
    for (const s of [-1, 1]) {
      gLoft(
        g,
        [
          { c: [s * 0.14, 0.12, 0], rx: 0.12, rz: 0.12 },
          { c: [s * 0.2, 0.12, 0], rx: 0.12, rz: 0.12 },
        ],
        {
          reg: 'rubber',
          col: lin('#15171a'),
          seg: 18,
          ref: [0, 1, 0],
          cap0: true,
          cap1: true,
          disp: (t, th) => 0.006 * Math.max(0, Math.sin(th * 12)),
        }
      );
      gLoft(
        g,
        [
          { c: [s * 0.2, 0.12, 0], rx: 0.05, rz: 0.05 },
          { c: [s * 0.205, 0.12, 0], rx: 0.045, rz: 0.045 },
        ],
        { reg: 'metal', col: steel, seg: 12, ref: [0, 1, 0], cap1: true, noOcc: true }
      );
    }
    gEll(g, [0, 0.14, -0.135], [0.028, 0.028, 0.02], {
      reg: 'glass',
      col: [0.15, 0.2, 0.25],
      seg: 10,
    });
  } else if (kind === 'jammer') {
    gBox(g, [0, 0.07, 0], [0.3, 0.14, 0.22], 0.025, { reg: 'hard', col: lin('#2a2d31') });
    gBox(g, [0, 0.145, 0], [0.26, 0.02, 0.18], 0.008, { reg: 'hard', col: lin('#3d4248') });
    for (const x of [-0.1, 0.1])
      gLoft(
        g,
        [
          { c: [x, 0.14, -0.04], rx: 0.012, rz: 0.012 },
          { c: [x, 0.5, -0.04], rx: 0.007, rz: 0.007 },
        ],
        { reg: 'metal', col: steel, seg: 6, cap1: true, noOcc: true }
      );
    gBox(g, [0, 0.16, 0.07], [0.05, 0.012, 0.03], 0.003, { reg: 'glass', col: [0.8, 0.3, 0.1] });
    for (const s of [-1, 1])
      gBox(g, [s * 0.14, 0.07, 0], [0.02, 0.1, 0.2], 0.006, { reg: 'rubber', col: dark });
  } else if (kind === 'flash') {
    gLoft(
      g,
      [
        { c: [0, -0.05, 0], rx: 0.03, rz: 0.03 },
        { c: [0, 0.05, 0], rx: 0.03, rz: 0.03 },
      ],
      { reg: 'metal', col: lin('#9aa0a4'), seg: 14, ref: [0, 0, 1], cap0: true, cap1: true }
    );
  } else {
    gBox(g, [0, 0, 0], [0.1, 0.1, 0.1], 0.02, { reg: 'hard', col: poly });
  }
  chFinish(g, {});
  return (CH_CANV[k] = g);
}
function buildGadget(scene, kind) {
  const g = new B.TransformNode('gadget', scene),
    X = sharedMats(scene);
  if (typeof wgBuild !== 'undefined' && wgBuild(scene, kind, g))
    return g; /* modelo real (CC-BY) quando carregado */
  if (
    (kind === 'frag' || kind === 'impact' || kind === 'flash') &&
    typeof assetGadget !== 'undefined' &&
    assetGadget(kind, g)
  )
    return g; /* modelo do kit (CC0) quando carregado */
  if (kind === 'frag' || kind === 'impact' || kind === 'flash') {
    const s = B.MeshBuilder.CreateSphere('s', { diameter: 0.12, segments: 10 }, scene);
    s.material = colMat(
      scene,
      kind === 'frag' ? '#3f4a2e' : kind === 'flash' ? '#c9ccd0' : '#2b3a4a',
      0.6
    );
    s.parent = g;
    s.isPickable = false;
    return g;
  }
  const src = chSrc(
    scene,
    'gadsrc|' + kind,
    () => chMesh(scene, gadgetGeo(kind), 'gadget', false),
    opMat(scene, GADGET_OP)
  );
  const m = src.clone('gadget', g);
  m.setEnabled(true);
  m.isPickable = false;
  if (kind === 'device') {
    g.light = mkBox(scene, g, 0.05, 0.03, 0.05, 0.1, 0.25, -0.06, X.red);
  } else if (kind === 'breach') {
    mkBox(scene, g, 0.02, 0.02, 0.01, -0.02, 0.02, -0.056, X.red);
  }
  return g;
}

/* =====================================================================
   OPERADORES v2 — modelagem procedural "de verdade":
   · geometria própria (lofts, elipsoides/cascas, caixas arredondadas) com UV em metros,
     cor por vértice (tinta + oclusão de ambiente assada + poeira) e pesos de pele;
   · UM material por operador (atlas 1024: camuflagem + cordura + pele + plástico + borracha + metal + vidro,
     com normal map e rugosidade/metal compartilhados) → corpo inteiro = 1 chamada de desenho;
   · corpo com esqueleto ligado aos nós do contrato (hips, th, kn, up, head, rig, armG, armL):
     animChar (17-anim.js) continua mexendo só nos nós, as juntas dobram sem emendas.
   ===================================================================== */
/* ---------- vetores (arrays [x,y,z], rápido e sem alocar Babylon) ---------- */
const v3a = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  v3s = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  v3k = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const v3d = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  v3x = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const v3l = (a) => Math.hypot(a[0], a[1], a[2]),
  v3n = (a) => {
    const l = v3l(a) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  },
  v3m = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sst = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const gau = (x, y, cx, cy, sx, sy) => Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));
/* rotação Euler no padrão Babylon (Z, depois X, depois Y) */
function vrot(v, r) {
  if (!r) return v;
  let [x, y, z] = v,
    c,
    s;
  if (r[2]) {
    c = Math.cos(r[2]);
    s = Math.sin(r[2]);
    [x, y] = [x * c - y * s, x * s + y * c];
  }
  if (r[0]) {
    c = Math.cos(r[0]);
    s = Math.sin(r[0]);
    [y, z] = [y * c - z * s, y * s + z * c];
  }
  if (r[1]) {
    c = Math.cos(r[1]);
    s = Math.sin(r[1]);
    [x, z] = [x * c + z * s, -x * s + z * c];
  }
  return [x, y, z];
}
function vunrot(v, r) {
  if (!r) return v;
  let [x, y, z] = v,
    c,
    s;
  if (r[1]) {
    c = Math.cos(-r[1]);
    s = Math.sin(-r[1]);
    [x, z] = [x * c + z * s, -x * s + z * c];
  }
  if (r[0]) {
    c = Math.cos(-r[0]);
    s = Math.sin(-r[0]);
    [y, z] = [y * c - z * s, y * s + z * c];
  }
  if (r[2]) {
    c = Math.cos(-r[2]);
    s = Math.sin(-r[2]);
    [x, y] = [x * c - y * s, x * s + y * c];
  }
  return [x, y, z];
}
/* referencial: Euler (rot) ou base ortonormal (bas=[X,Y,Z]) */
function mkXf(o) {
  if (o.bas) {
    const [X, Y, Z] = o.bas;
    return {
      f: (v) => [
        X[0] * v[0] + Y[0] * v[1] + Z[0] * v[2],
        X[1] * v[0] + Y[1] * v[1] + Z[1] * v[2],
        X[2] * v[0] + Y[2] * v[1] + Z[2] * v[2],
      ],
      inv: (v) => [v3d(v, X), v3d(v, Y), v3d(v, Z)],
    };
  }
  const r = o.rot;
  return { f: (v) => vrot(v, r), inv: (v) => vunrot(v, r) };
}
function lin(hex) {
  const c = C3(hex).toLinearSpace();
  return [c.r, c.g, c.b];
}
const linMul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

/* ---------- atlas (px em 1024): região → [x, y, largura, altura, metros na largura] ---------- */
const CH_AT = 1024;
const CH_REG = {
  camo: [0, 0, 512, 640, 0.62],
  face: [0, 640, 384, 384, 1],
  skin: [384, 640, 128, 384, 0.12],
  gear: [512, 0, 512, 512, 0.5],
  rubber: [512, 512, 256, 256, 0.26],
  hard: [768, 512, 256, 256, 0.3],
  knit: [512, 768, 256, 256, 0.2],
  metal: [768, 768, 128, 256, 0.12],
  glass: [896, 768, 128, 256, 0.12],
};

/* ---------- construtor de geometria ---------- */
function GB() {
  const g = { P: [], N: [], UV: [], CO: [], J: [], W: [], I: [], PR: [], REG: [], OWN: [], nid: 0 };
  let cur = null;
  g.begin = (o) => {
    cur = { o, v0: g.P.length / 3, i0: g.I.length, raw: [], ctr: [], id: ++g.nid };
    return cur;
  };
  g.vert = (p, ru, rv, c) => {
    g.P.push(p[0], p[1], p[2]);
    cur.raw.push(ru, rv);
    cur.ctr.push(c[0], c[1], c[2]);
    return g.P.length / 3 - 1;
  };
  g.tri = (a, b, c) => g.I.push(a, b, c);
  g.quad = (a, b, c, d) => g.I.push(a, b, c, a, c, d);
  g.proxy = (pr) => {
    pr.id = cur.id;
    if (!cur.o.noOcc) g.PR.push(pr);
  };
  g.end = () => chEndPrim(g, cur);
  return g;
}
function chEndPrim(g, cur) {
  const o = cur.o,
    P = g.P,
    I = g.I,
    v0 = cur.v0,
    v1 = P.length / 3,
    i0 = cur.i0,
    i1 = I.length;
  if (v1 === v0 || cur.done) return;
  const pv = (i) => [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]],
    cv = (i) => [cur.ctr[(i - v0) * 3], cur.ctr[(i - v0) * 3 + 1], cur.ctr[(i - v0) * 3 + 2]];
  /* orientação: normal da face aponta para fora do centro local */
  if (!o.keepWinding)
    for (let t = i0; t < i1; t += 3) {
      const a = pv(I[t]),
        b = pv(I[t + 1]),
        c = pv(I[t + 2]),
        fn = v3x(v3s(b, a), v3s(c, a));
      const ce = v3k(v3a(v3a(a, b), c), 1 / 3),
        cc = v3k(v3a(v3a(cv(I[t]), cv(I[t + 1])), cv(I[t + 2])), 1 / 3);
      if (v3d(fn, v3s(ce, cc)) > 0 !== !!o.inv) {
        const x = I[t + 1];
        I[t + 1] = I[t + 2];
        I[t + 2] = x;
      }
    }
  /* normais suaves (soldadas por posição: costura do loft sem degrau de luz) */
  const n = new Float32Array((v1 - v0) * 3);
  for (let t = i0; t < i1; t += 3) {
    const a = pv(I[t]),
      b = pv(I[t + 1]),
      c = pv(I[t + 2]),
      fn = v3x(v3s(b, a), v3s(c, a));
    for (let k = 0; k < 3; k++) {
      const q = (I[t + k] - v0) * 3;
      n[q] -= fn[0];
      n[q + 1] -= fn[1];
      n[q + 2] -= fn[2];
    }
  }
  if (!o.hard) {
    const M = new Map();
    for (let i = v0; i < v1; i++) {
      const key =
        Math.round(P[i * 3] * 4e3) +
        ',' +
        Math.round(P[i * 3 + 1] * 4e3) +
        ',' +
        Math.round(P[i * 3 + 2] * 4e3);
      const e = M.get(key);
      if (e) e.push(i);
      else M.set(key, [i]);
    }
    for (const L of M.values())
      if (L.length > 1) {
        let s = [0, 0, 0];
        for (const i of L) {
          const q = (i - v0) * 3;
          s = v3a(s, [n[q], n[q + 1], n[q + 2]]);
        }
        for (const i of L) {
          const q = (i - v0) * 3;
          n[q] = s[0];
          n[q + 1] = s[1];
          n[q + 2] = s[2];
        }
      }
  }
  for (let i = 0; i < v1 - v0; i++) {
    const q = i * 3,
      l = Math.hypot(n[q], n[q + 1], n[q + 2]) || 1;
    g.N.push(n[q] / l, n[q + 1] / l, n[q + 2] / l);
  }
  /* UV: metros → pixels da região do atlas (sem repetição: cada peça ganha um pedaço próprio do tecido) */
  const R = CH_REG[o.reg || 'gear'],
    pad = 6,
    ppm = R[2] / R[4];
  if (o.uvAbs) {
    for (let i = 0; i < cur.raw.length; i += 2)
      g.UV.push((R[0] + cur.raw[i] * R[2]) / CH_AT, (R[1] + cur.raw[i + 1] * R[3]) / CH_AT);
  } else {
    let mu = 1e9,
      Mu = -1e9,
      mv = 1e9,
      Mv = -1e9;
    for (let i = 0; i < cur.raw.length; i += 2) {
      mu = Math.min(mu, cur.raw[i]);
      Mu = Math.max(Mu, cur.raw[i]);
      mv = Math.min(mv, cur.raw[i + 1]);
      Mv = Math.max(Mv, cur.raw[i + 1]);
    }
    const aw = R[2] - 2 * pad,
      ah = R[3] - 2 * pad,
      eu = (Mu - mu) * ppm,
      ev = (Mv - mv) * ppm,
      k = Math.min(1, aw / Math.max(eu, 1e-6), ah / Math.max(ev, 1e-6));
    const h = hashStr(o.reg + cur.id + (o.seed || '')),
      ou = R[0] + pad + ((h % 997) / 997) * Math.max(0, aw - eu * k),
      ov = R[1] + pad + (((h >>> 10) % 991) / 991) * Math.max(0, ah - ev * k);
    for (let i = 0; i < cur.raw.length; i += 2) {
      g.UV.push(
        (ou + (cur.raw[i] - mu) * ppm * k) / CH_AT,
        (ov + (cur.raw[i + 1] - mv) * ppm * k) / CH_AT
      );
    }
  }
  /* cor e pesos */
  const tint = o.col ? (Array.isArray(o.col) ? o.col : lin(o.col)) : [1, 1, 1];
  for (let i = v0; i < v1; i++) {
    const p = pv(i);
    let c = tint;
    if (o.paint) {
      const m = o.paint(p, cv(i));
      if (m) c = [c[0] * m[0], c[1] * m[1], c[2] * m[2]];
    }
    g.CO.push(c[0], c[1], c[2], 1);
    g.REG.push(o.reg || 'gear');
    let w = o.wf ? o.wf(p) : [[o.bone || 0, 1]];
    w = w
      .filter((e) => e[1] > 1e-3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    let s = 0;
    for (const e of w) s += e[1];
    for (let k2 = 0; k2 < 4; k2++) {
      g.J.push(w[k2] ? w[k2][0] : 0);
      g.W.push(w[k2] ? w[k2][1] / s : 0);
    }
  }
  g.OWN.push([cur.id, v1 - v0]);
  cur.done = true;
}
/* ---------- primitivas ---------- */
/* loft: seções {c,rx,rz,e?}; ref = direção "frente" da seção (θ=0 → lado, θ=90° → frente, θ=270° → trás) */
function gLoft(g, secs, o) {
  o = o || {};
  const seg = o.seg || 12,
    ref = o.ref || [0, 0, -1],
    e0 = o.e || 2,
    n = secs.length;
  g.begin(o);
  const T = [],
    F = [],
    S = [];
  for (let i = 0; i < n; i++) {
    const a = secs[Math.max(0, i - 1)].c,
      b = secs[Math.min(n - 1, i + 1)].c;
    let t = v3n(v3s(b, a));
    if (o.closed) {
      const pa = secs[(i - 1 + n) % n].c,
        pb = secs[(i + 1) % n].c;
      t = v3n(v3s(pb, pa));
    }
    const rf = secs[i].ref || ref;
    let f = v3s(rf, v3k(t, v3d(rf, t)));
    if (v3l(f) < 1e-5) f = [0, 1, 0];
    f = v3n(f);
    T.push(t);
    F.push(f);
    S.push(v3n(v3x(t, f)));
  }
  const rows = o.closed ? n + 1 : n,
    a0 = o.arc ? o.arc[0] : 0,
    a1 = o.arc ? o.arc[1] : Math.PI * 2,
    full = !o.arc;
  let along = 0;
  const base = [];
  for (let ii = 0; ii < rows; ii++) {
    const i = ii % n,
      s = secs[i];
    if (ii > 0) {
      along += v3l(v3s(s.c, secs[(ii - 1) % n].c));
    }
    const per = Math.PI * (s.rx + s.rz) * ((a1 - a0) / (Math.PI * 2)),
      e = s.e || e0,
      row = [];
    for (let j = 0; j <= seg; j++) {
      const th = a0 + ((a1 - a0) * j) / seg,
        c = Math.cos(th),
        sn = Math.sin(th);
      const qx = Math.sign(c) * Math.pow(Math.abs(c), 2 / e),
        qy = Math.sign(sn) * Math.pow(Math.abs(sn), 2 / e);
      let p = v3a(s.c, v3a(v3k(S[i], qx * s.rx), v3k(F[i], qy * s.rz)));
      if (o.disp) {
        const d = o.disp(ii / (rows - 1), th, p, s);
        if (d) {
          const rd = v3n(v3s(p, s.c));
          p = v3a(p, v3k(rd, d));
        }
      }
      row.push(g.vert(p, (per * j) / seg, along, s.c));
    }
    base.push(row);
  }
  for (let i = 0; i < rows - 1; i++)
    for (let j = 0; j < seg; j++)
      g.quad(base[i][j], base[i + 1][j], base[i + 1][j + 1], base[i][j + 1]);
  const cap = (i, row, dir) => {
    const s = secs[i],
      cc = v3a(s.c, v3k(T[i], dir * (o.capD || 0) * Math.min(s.rx, s.rz)));
    const m = g.vert(
      cc,
      0,
      along * (dir > 0 ? 1 : 0),
      v3a(s.c, v3k(T[i], -dir * 0.5 * Math.min(s.rx, s.rz)))
    );
    for (let j = 0; j < seg; j++) g.tri(row[j], row[j + 1], m);
  };
  if (o.cap0 && !o.closed) cap(0, base[0], -1);
  if (o.cap1 && !o.closed) cap(n - 1, base[rows - 1], 1);
  if (!o.noOcc && !o.thin)
    for (let i = 0; i < n - (o.closed ? 0 : 1); i++) {
      const s0 = secs[i],
        s1 = secs[(i + 1) % n];
      g.proxy({
        t: 'cap',
        a: s0.c,
        b: s1.c,
        ra: Math.min(s0.rx, s0.rz) * 0.95,
        rb: Math.min(s1.rx, s1.rz) * 0.95,
      });
    }
  g.end();
}
/* elipsoide / casca: φ de phi0(θ) a phi1(θ) (cortes de capacete), def = deformação local, thick = casca com espessura */
function gEll(g, c, r, o) {
  o = o || {};
  const seg = o.seg || 14,
    ring = o.ring || Math.max(4, Math.round(seg * 0.6)),
    X = mkXf(o);
  const f0 = o.phi0 || (() => 0),
    f1 = o.phi1 || (() => Math.PI);
  const surf = (sh, inv) => {
    g.begin(Object.assign({}, o, { inv }));
    const grid = [];
    for (let j = 0; j <= seg; j++) {
      const th = o.th0 != null ? o.th0 + ((o.th1 - o.th0) * j) / seg : (Math.PI * 2 * j) / seg,
        p0 = f0(th),
        p1 = f1(th),
        col = [];
      for (let i = 0; i <= ring; i++) {
        const ph = p0 + ((p1 - p0) * i) / ring,
          d = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)];
        let pl = [d[0] * (r[0] - sh), d[1] * (r[1] - sh), d[2] * (r[2] - sh)];
        if (o.def) {
          const df = o.def(d, pl);
          if (df) pl = v3a(pl, v3k(df, 1 - sh / Math.max(r[0], 0.01)));
        }
        col.push(g.vert(v3a(c, X.f(pl)), (th * (r[0] + r[2])) / 2, ph * r[1], c));
      }
      grid.push(col);
    }
    for (let j = 0; j < seg; j++)
      for (let i = 0; i < ring; i++) {
        if (o.skip) {
          const th = (Math.PI * 2 * (j + 0.5)) / seg,
            pp = f0(th) + ((f1(th) - f0(th)) * (i + 0.5)) / ring;
          if (o.skip([Math.sin(pp) * Math.cos(th), Math.cos(pp), Math.sin(pp) * Math.sin(th)]))
            continue;
        }
        g.quad(grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]);
      }
    return grid;
  };
  const A = surf(0, false);
  if (!o.noOcc && !o.thick) g.proxy({ t: 'ell', c, r: r.map((v) => v * 0.97), X });
  g.end();
  if (o.thick) {
    const Bq = surf(o.thick, true);
    g.end();
    g.begin(o);
    const rim = [];
    for (let j = 0; j <= seg; j++) {
      const a = A[j][ring],
        b = Bq[j][ring],
        pa = [g.P[a * 3], g.P[a * 3 + 1], g.P[a * 3 + 2]],
        pb = [g.P[b * 3], g.P[b * 3 + 1], g.P[b * 3 + 2]];
      rim.push([g.vert(pa, j * 0.01, 0, c), g.vert(pb, j * 0.01, o.thick, c)]);
    }
    for (let j = 0; j < seg; j++) g.quad(rim[j][0], rim[j + 1][0], rim[j + 1][1], rim[j][1]);
    g.end();
  }
}
/* caixa arredondada (bolsos, placas, rádio…) com "almofada" opcional nas faces ±Z */
function gBox(g, c, s, rr, o) {
  o = o || {};
  const X = mkXf(o),
    h = [s[0] / 2, s[1] / 2, s[2] / 2];
  rr = Math.min(rr, h[0] * 0.95, h[1] * 0.95, h[2] * 0.95);
  g.begin(o);
  const tiny = o.lo || Math.max(s[0], s[1], s[2]) < 0.035 || Math.min(s[0], s[1], s[2]) < 0.009;
  const grid = (ax) => {
    if (tiny && !o.bulge) return [-1, 1];
    const b = rr / h[ax],
      t = o.hi ? [-1, -1 + b * 0.35, -1 + b, 1 - b, 1 - b * 0.35, 1] : [-1, -1 + b, 1 - b, 1];
    if (o.bulge || o.def) t.splice(t.length / 2, 0, 0);
    return t.filter((v, i, a) => i === 0 || v > a[i - 1] + 1e-4);
  };
  for (let ax = 0; ax < 3; ax++)
    for (const sg of [-1, 1]) {
      const a1 = (ax + 1) % 3,
        a2 = (ax + 2) % 3,
        T1 = grid(a1),
        T2 = grid(a2),
        idx = [];
      for (let i = 0; i < T1.length; i++) {
        const row = [];
        for (let j = 0; j < T2.length; j++) {
          const q = [0, 0, 0];
          q[ax] = sg * h[ax];
          q[a1] = T1[i] * h[a1];
          q[a2] = T2[j] * h[a2];
          const inn = q.map((v, k) => Math.max(-(h[k] - rr), Math.min(h[k] - rr, v)));
          let p = v3a(inn, v3k(v3n(v3s(q, inn)), rr));
          if (o.bulge && ax === 2) p[2] += sg * o.bulge * (1 - T1[i] * T1[i]) * (1 - T2[j] * T2[j]);
          if (o.def) {
            const d = o.def(p, h);
            if (d) p = v3a(p, d);
          }
          row.push(g.vert(v3a(c, X.f(p)), q[a1] + (ax * 2 + (sg > 0)) * 0, q[a2], c));
        }
        idx.push(row);
      }
      for (let i = 0; i < T1.length - 1; i++)
        for (let j = 0; j < T2.length - 1; j++)
          g.quad(idx[i][j], idx[i + 1][j], idx[i + 1][j + 1], idx[i][j + 1]);
    }
  g.proxy({ t: 'box', c, h: h.map((v) => v - rr * 0.5), rr: rr * 0.5, X });
  g.end();
}
/* anel (cinto, alça em volta da perna): loft fechado ao longo de uma elipse */
function gRing(g, c, rx, rz, w, t, o) {
  o = Object.assign({ e: 6, seg: 5 }, o || {});
  const n = o.n || 16,
    secs = [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    secs.push({
      c: [
        c[0] + Math.cos(a) * rx,
        c[1] + (o.tilt ? Math.sin(a) * o.tilt : 0),
        c[2] + Math.sin(a) * rz,
      ],
      rx: t / 2,
      rz: w / 2,
      ref: [0, 1, 0],
    });
  }
  gLoft(g, secs, Object.assign({ closed: true, thin: true }, o));
}
/* fita/alça seguindo pontos */
function gStrap(g, pts, w, t, o) {
  gLoft(
    g,
    pts.map((p) => ({ c: p, rx: w / 2, rz: t / 2 })),
    Object.assign({ e: 8, seg: 8, thin: true, ref: (o && o.ref) || [0, 0, -1] }, o || {})
  );
}

/* ---------- oclusão de ambiente assada + poeira (por vértice) ---------- */
function chSdf(pr, p) {
  if (pr.t === 'cap') {
    const ba = v3s(pr.b, pr.a),
      pa = v3s(p, pr.a),
      h = Math.max(0, Math.min(1, v3d(pa, ba) / Math.max(1e-9, v3d(ba, ba))));
    return v3l(v3s(pa, v3k(ba, h))) - (pr.ra + (pr.rb - pr.ra) * h);
  }
  const q = pr.X.inv(v3s(p, pr.c));
  if (pr.t === 'ell') {
    const r = pr.r,
      k0 = Math.hypot(q[0] / r[0], q[1] / r[1], q[2] / r[2]),
      k1 = Math.hypot(q[0] / (r[0] * r[0]), q[1] / (r[1] * r[1]), q[2] / (r[2] * r[2]));
    return (k0 * (k0 - 1)) / Math.max(k1, 1e-9);
  }
  const d = [Math.abs(q[0]) - pr.h[0], Math.abs(q[1]) - pr.h[1], Math.abs(q[2]) - pr.h[2]];
  return (
    Math.hypot(Math.max(d[0], 0), Math.max(d[1], 0), Math.max(d[2], 0)) +
    Math.min(Math.max(d[0], d[1], d[2]), 0) -
    pr.rr
  );
}
function chFinish(g, o) {
  o = o || {};
  const P = g.P,
    N = g.N,
    nV = P.length / 3,
    PR = g.PR;
  for (const pr of PR) {
    if (pr.t === 'cap') {
      pr.cc = v3m(pr.a, pr.b, 0.5);
      pr.R = v3l(v3s(pr.a, pr.b)) / 2 + Math.max(pr.ra, pr.rb);
    } else {
      pr.cc = pr.c;
      pr.R = pr.t === 'ell' ? Math.max(...pr.r) : v3l(pr.h) + pr.rr;
    }
  }
  /* qual primitiva gerou cada vértice: guardado na ordem de criação */
  const owner = new Int32Array(nV);
  {
    let k = 0;
    for (const e of g.OWN) for (let i = 0; i < e[1]; i++) owner[k++] = e[0];
  }
  const H = [0.012, 0.028, 0.055, 0.09],
    WT = [0.4, 0.3, 0.2, 0.12],
    D = o.dust || [0.15, 0.125, 0.1],
    CS = 0.12,
    GR = new Map(),
    key = (x, y, z) => x + ',' + y + ',' + z;
  /* grade espacial: cada célula guarda as primitivas cuja esfera envolvente (+ alcance da amostra) a toca */
  for (const pr of PR) {
    const r = pr.R + 0.1,
      c = pr.cc;
    for (let x = Math.floor((c[0] - r) / CS); x <= Math.floor((c[0] + r) / CS); x++)
      for (let y = Math.floor((c[1] - r) / CS); y <= Math.floor((c[1] + r) / CS); y++)
        for (let z = Math.floor((c[2] - r) / CS); z <= Math.floor((c[2] + r) / CS); z++) {
          const k = key(x, y, z);
          let L = GR.get(k);
          if (!L) GR.set(k, (L = []));
          L.push(pr);
        }
  }
  for (let i = 0; i < nV; i++) {
    const p = [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]],
      n = [N[i * 3], N[i * 3 + 1], N[i * 3 + 2]],
      own = owner[i];
    let occ = 0;
    const L =
      GR.get(key(Math.floor(p[0] / CS), Math.floor(p[1] / CS), Math.floor(p[2] / CS))) || [];
    for (let s = 0; s < 4; s++) {
      const h = H[s],
        q = v3a(p, v3k(n, h));
      let d = 1;
      for (const pr of L) {
        if (pr.id === own) continue;
        const dc = v3l(v3s(q, pr.cc)) - pr.R;
        if (dc > d || dc > h) continue;
        const sd = chSdf(pr, q);
        if (sd < d) d = sd;
      }
      occ += Math.max(0, (h - d) / h) * WT[s];
    }
    let ao = 1 - Math.min(0.82, occ * 0.9);
    if (o.ground) ao *= 0.82 + 0.18 * sst(0.0, 0.3, p[1]);
    const reg = g.REG[i],
      c = i * 4;
    let k = 0;
    if (o.ground && (reg === 'camo' || reg === 'gear' || reg === 'rubber'))
      k = 0.32 * (1 - sst(0.04, 0.62, p[1])) + 0.1 * gau(p[1], p[2], 0.5, -0.07, 0.06, 0.04);
    if (reg === 'glass') ao = 0.5 + 0.5 * ao;
    for (let j = 0; j < 3; j++) g.CO[c + j] = (g.CO[c + j] * (1 - k) + D[j] * k) * ao;
  }
}
/* malha Babylon a partir do construtor */
function chMesh(scene, g, name, skel) {
  const m = new B.Mesh(name, scene),
    vd0 = new B.VertexData();
  vd0.positions = g.P;
  vd0.normals = g.N;
  vd0.uvs = g.UV;
  vd0.colors = g.CO;
  vd0.indices = g.I;
  if (skel) {
    vd0.matricesIndices = g.J;
    vd0.matricesWeights = g.W;
  }
  vd0.applyToMesh(m, false);
  m.isPickable = false;
  return m;
}

/* ---------- texturas do atlas (canvas, geradas uma vez por página) ---------- */
const chHash = (x, y, s) => {
  let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
function chVN(x, y, s) {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    xf = x - xi,
    yf = y - yi,
    u = xf * xf * (3 - 2 * xf),
    v = yf * yf * (3 - 2 * yf);
  const a = chHash(xi, yi, s),
    b = chHash(xi + 1, yi, s),
    c = chHash(xi, yi + 1, s),
    d = chHash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function chFbm(x, y, s, oct) {
  let t = 0,
    a = 0.5,
    f = 1,
    n = 0;
  for (let i = 0; i < oct; i++) {
    t += a * chVN(x * f, y * f, s + i * 31);
    n += a;
    a *= 0.5;
    f *= 2.03;
  }
  return t / n;
}
const CH_CANV = {};
/* altura (para o normal map) e albedo neutro das regiões que não são camuflagem */
function chBaseMaps() {
  if (CH_CANV.base) return CH_CANV.base;
  const S = CH_AT,
    alb = new Float32Array(S * S * 3),
    hgt = new Float32Array(S * S),
    rough = new Float32Array(S * S),
    metal = new Float32Array(S * S);
  const regOf = (x, y) => {
    for (const k in CH_REG) {
      const r = CH_REG[k];
      if (x >= r[0] && x < r[0] + r[2] && y >= r[1] && y < r[1] + r[3]) return k;
    }
    return 'gear';
  };
  /* arranhões do plástico/metal */
  const scr = new Float32Array(S * S);
  {
    const rnd = mulberry(77);
    for (let i = 0; i < 260; i++) {
      let x = 768 + rnd() * 256,
        y = 512 + rnd() * 256;
      const a = rnd() * 6.28,
        l = 4 + rnd() * 26;
      for (let t = 0; t < l; t++) {
        const xi = (x + Math.cos(a) * t) | 0,
          yi = (y + Math.sin(a) * t) | 0;
        if (xi >= 0 && xi < S && yi >= 0 && yi < S) scr[yi * S + xi] = 1;
      }
    }
    for (let i = 0; i < 120; i++) {
      let x = 768 + rnd() * 128,
        y = 768 + rnd() * 256;
      const a = rnd() * 6.28,
        l = 4 + rnd() * 20;
      for (let t = 0; t < l; t++) {
        const xi = (x + Math.cos(a) * t) | 0,
          yi = (y + Math.sin(a) * t) | 0;
        if (xi >= 0 && xi < S && yi >= 0 && yi < S) scr[yi * S + xi] = 1;
      }
    }
  }
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const i = y * S + x,
        reg = regOf(x, y);
      let a = 0.85,
        h = 0,
        r = 0.9,
        m = 0;
      const lo = chFbm(x * 0.012, y * 0.012, 5, 4),
        mid = chFbm(x * 0.05, y * 0.05, 9, 3),
        fine = chHash(x, y, 3);
      if (reg === 'camo') {
        /* sarja (diagonal) + vincos do tecido */ const tw =
          0.5 + 0.5 * Math.sin(((x + y) * Math.PI) / 2.2);
        h = tw * 0.05 + chFbm(x * 0.018, y * 0.009, 21, 4) * 0.9 + fine * 0.03;
        a = 1;
        r = 0.93 + fine * 0.05;
      } else if (reg === 'gear') {
        /* cordura 1000D: trama em cesto + desgaste */ const bw =
            ((x >> 1) + (y >> 1)) % 2 ? 1 : 0.0,
          wear = sst(0.6, 0.8, lo);
        a = 0.78 + 0.06 * mid + 0.05 * fine + 0.1 * wear;
        h = bw * 0.05 + mid * 0.35 + fine * 0.04;
        r = 0.86 + 0.08 * fine - 0.08 * wear;
      } else if (reg === 'skin') {
        a = 0.92 + 0.05 * (mid - 0.5) + 0.03 * (lo - 0.5);
        h = fine * 0.06 + mid * 0.08;
        r = 0.55 + 0.1 * mid;
      } else if (reg === 'face') {
        a = 0.86;
        h = 0;
        r = 0.52;
      } else if (reg === 'knit') {
        /* malha canelada (balaclava, gorro) */ const rib =
            0.5 + 0.5 * Math.sin((x * Math.PI) / 2.5),
          st = 0.5 + 0.5 * Math.sin((y * Math.PI) / 1.6 + (((x / 5) | 0) % 2) * 1.6);
        a = 0.8 + 0.06 * rib * st + 0.05 * mid;
        h = rib * 0.3 + st * 0.1;
        r = 0.95;
      } else if (reg === 'hard') {
        const s = scr[i];
        a = 0.8 + 0.05 * mid + 0.18 * s - 0.08 * sst(0.72, 0.8, lo);
        h = mid * 0.04 - s * 0.25;
        r = 0.42 + 0.12 * mid + 0.2 * s;
      } else if (reg === 'rubber') {
        a = 0.8 + 0.08 * mid + 0.04 * fine;
        h = fine * 0.25 + mid * 0.2;
        r = 0.72 + 0.1 * fine;
      } else if (reg === 'metal') {
        const s = scr[i];
        a = 0.75 + 0.06 * chHash(0, y, 5) + 0.15 * s;
        h = -s * 0.2;
        r = 0.32 + 0.1 * mid + 0.2 * s;
        m = 1;
      } else if (reg === 'glass') {
        a = 0.35;
        h = 0;
        r = 0.06;
        m = 0.4;
      }
      alb[i * 3] = alb[i * 3 + 1] = alb[i * 3 + 2] = a;
      hgt[i] = h;
      rough[i] = r;
      metal[i] = m;
    }
  /* pele: leve variação avermelhada */
  {
    const r = CH_REG.skin;
    for (let y = r[1]; y < r[1] + r[3]; y++)
      for (let x = r[0]; x < r[0] + r[2]; x++) {
        const i = y * S + x,
          v = chFbm(x * 0.03, y * 0.03, 41, 3) - 0.5;
        alb[i * 3] *= 1 + v * 0.06;
        alb[i * 3 + 1] *= 1 - v * 0.05;
        alb[i * 3 + 2] *= 1 - v * 0.08;
      }
  }
  /* normal map (espaço tangente) e rugosidade/metal (G/B) */
  const nc = mkCanvas(S),
    ng = nc.getContext('2d'),
    nd = ng.createImageData(S, S),
    oc = mkCanvas(S),
    og = oc.getContext('2d'),
    od = og.createImageData(S, S);
  const str = {
    camo: 3.2,
    gear: 2.6,
    skin: 1.2,
    face: 0,
    hard: 2,
    rubber: 2.4,
    metal: 1.6,
    glass: 0,
    knit: 2.2,
  };
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const i = y * S + x,
        reg = regOf(x, y),
        k = str[reg] || 1;
      const hx = (hgt[y * S + Math.min(S - 1, x + 1)] - hgt[y * S + Math.max(0, x - 1)]) * k,
        hy = (hgt[Math.min(S - 1, y + 1) * S + x] - hgt[Math.max(0, y - 1) * S + x]) * k,
        l = Math.hypot(hx, hy, 1);
      nd.data[i * 4] = ((-hx / l) * 0.5 + 0.5) * 255;
      nd.data[i * 4 + 1] = ((hy / l) * 0.5 + 0.5) * 255;
      nd.data[i * 4 + 2] = ((1 / l) * 0.5 + 0.5) * 255;
      nd.data[i * 4 + 3] = 255;
      od.data[i * 4] = 255;
      od.data[i * 4 + 1] = Math.min(1, rough[i]) * 255;
      od.data[i * 4 + 2] = metal[i] * 255;
      od.data[i * 4 + 3] = 255;
    }
  ng.putImageData(nd, 0, 0);
  og.putImageData(od, 0, 0);
  const base = (CH_CANV.base = { alb, nrm: nc, orm: oc });
  chFaceDraw();
  return base;
}
/* camuflagens: digital (pixels), manchas (multicam/woodland) e liso com mescla */
function chBaseRGBA() {
  if (CH_CANV.rgba) return CH_CANV.rgba;
  const b = chBaseMaps(),
    S = CH_AT,
    a = new Uint8ClampedArray(S * S * 4);
  for (let i = 0; i < S * S; i++) {
    const v = b.alb[i * 3] * 255;
    a[i * 4] = a[i * 4 + 1] = a[i * 4 + 2] = v;
    a[i * 4 + 3] = 255;
  }
  return (CH_CANV.rgba = a);
}
function chCamo(op) {
  if (CH_CANV['c' + op.id]) return CH_CANV['c' + op.id];
  const L = op.look,
    S = CH_AT,
    c = mkCanvas(S),
    g = c.getContext('2d'),
    d = g.createImageData(S, S),
    cr = CH_REG.camo;
  d.data.set(chBaseRGBA());
  const cols = (L.cols || ['#555555']).map((h) => {
      const q = C3(h);
      return [q.r, q.g, q.b];
    }),
    seed = hashStr(op.id) % 1000;
  const desat = L.pat === 'camo' ? 0.82 : 0.9,
    dk = L.pat === 'camo' ? 0.9 : 0.95; /* tons de campo, mais dessaturados que a paleta da UI */
  const C = cols.map((cc) => {
    const m = (cc[0] + cc[1] + cc[2]) / 3;
    return cc.map((v) => (m + (v - m) * desat) * dk);
  });
  /* padrão calculado em blocos de 4 px (digital) ou 2 px (manchas, com borda suave pelo filtro) */
  const B = L.pat === 'digital' ? 4 : 2,
    bw = cr[2] / B,
    bh = cr[3] / B,
    pat = new Uint8Array(bw * bh);
  for (let by = 0; by < bh; by++)
    for (let bx = 0; bx < bw; bx++) {
      let k = 0;
      if (L.pat === 'digital') {
        const w = chFbm(bx * 0.035, by * 0.035, seed + 7, 3),
          n1 = chFbm(bx * 0.06 + w * 2.2, by * 0.06, seed, 4),
          n2 = chFbm(bx * 0.11, by * 0.11 + w, seed + 3, 3);
        k = n1 < 0.42 ? 3 : n1 < 0.52 ? 1 : n2 > 0.6 ? 2 : 0;
      } else if (L.pat === 'camo') {
        const x = bx * B,
          y = by * B,
          wx = chFbm(x * 0.006, y * 0.006, seed + 11, 3) * 60,
          n1 = chFbm((x + wx) * 0.0075, (y - wx) * 0.0075, seed, 4),
          n2 = chFbm((x - wx) * 0.011, (y + wx) * 0.011, seed + 5, 4),
          n3 = chFbm(x * 0.02 + wx * 0.01, y * 0.02, seed + 9, 3);
        k = 0;
        if (n1 > 0.53) k = 1;
        if (n2 > 0.6) k = 3;
        if (n3 > 0.66 && n1 < 0.5) k = 2;
      }
      pat[by * bw + bx] = k;
    }
  for (let y = cr[1]; y < cr[1] + cr[3]; y++)
    for (let x = cr[0]; x < cr[0] + cr[2]; x++) {
      const i = y * S + x;
      let cc;
      if (L.pat) cc = C[pat[(((y - cr[1]) / B) | 0) * bw + (((x - cr[0]) / B) | 0)]] || C[0];
      else {
        const v = chHash(x >> 2, y, seed) * 0.05 + chHash(x, y, seed + 1) * 0.04 - 0.05;
        cc = C[0].map((q) => q * (1 + v));
      }
      const wv =
          0.975 + 0.025 * Math.sin(((x + y) * Math.PI) / 2.2) + (chHash(x, y, 9) - 0.5) * 0.04,
        fade = 0.92 + 0.1 * chVN(x * 0.012, y * 0.012, seed + 21);
      d.data[i * 4] = Math.min(255, cc[0] * wv * fade * 255);
      d.data[i * 4 + 1] = Math.min(255, cc[1] * wv * fade * 255);
      d.data[i * 4 + 2] = Math.min(255, cc[2] * wv * fade * 255);
    }
  g.putImageData(d, 0, 0);
  CH_CANV['c' + op.id] = c;
  chFaceDraw();
  return c;
}
/* aquece os caches (texturas e malhas) aos poucos no menu: a partida começa sem engasgos */
function chWarm() {
  const all = OPS.atk.concat(OPS.def);
  let i = 0;
  const step = () => {
    if (i >= all.length) return;
    const op = all[i];
    if (opmPack() && !OPM.ok) {
      setTimeout(step, 200);
      return;
    }
    i++;
    try {
      chCamo(op);
      if (opmPack()) {
        opBodyCanvas(op, 0);
        opHeadCanvas(op, 0, '');
      } else chGeo(op);
    } catch (e) {}
    setTimeout(step, 120);
  };
  setTimeout(step, 1500);
}
/* rosto escaneado (CC-BY Lee Perry-Smith): as imagens decodificam de forma assíncrona;
   quando chegam, entram na região 'face' dos atlas já criados e as texturas são reenviadas */
const CH_FACE = { n: 0, ok: 0, tex: [] };
(function () {
  if (typeof ASSET_FILE === 'undefined' || !ASSET_FILE['op_face.jpg']) return;
  for (const [k, f] of [
    ['col', 'op_face.jpg'],
    ['nrm', 'op_facen.jpg'],
  ]) {
    const im = new Image();
    im.onload = () => {
      CH_FACE[k] = im;
      if (++CH_FACE.ok === 2) {
        CH_FACE.done = {};
        chFaceDraw();
        for (const t of CH_FACE.tex)
          if (!t.isDisposed || !t.getInternalTexture || t.getInternalTexture()) t.update(false);
      }
    };
    im.src = 'data:image/jpeg;base64,' + ASSET_FILE[f];
  }
})();
function chFaceDraw() {
  if (CH_FACE.ok < 2 || !CH_CANV.base) return;
  const R = CH_REG.face,
    dn = CH_FACE.done;
  const put = (c, im, key) => {
    if (dn[key]) return;
    dn[key] = 1;
    c.getContext('2d').drawImage(im, R[0], R[1], R[2], R[3]);
  };
  put(CH_CANV.base.nrm, CH_FACE.nrm, 'nrm');
  for (const k in CH_CANV)
    if (k[0] === 'c' && CH_CANV[k].getContext) put(CH_CANV[k], CH_FACE.col, k);
}
/* material do operador (cache por cena) */
function chTex(scene, c, lin) {
  const t = new B.DynamicTexture('opt', c, scene, true);
  CH_FACE.tex.push(t);
  t.update(false);
  t.wrapU = t.wrapV = B.Texture.CLAMP_ADDRESSMODE;
  t.anisotropicFilteringLevel = 8;
  if (lin) t.gammaSpace = false;
  return t;
}
function opMat(scene, op) {
  const C = matCache(scene),
    k = 'op2|' + op.id;
  if (C[k]) return C[k];
  const base = chBaseMaps();
  if (!C.opN) {
    C.opN = chTex(scene, base.nrm, true);
    C.opO = chTex(scene, base.orm, true);
  }
  const m = new B.PBRMaterial('op_' + op.id, scene);
  m.albedoTexture = chTex(scene, chCamo(op));
  m.bumpTexture = C.opN;
  m.bumpTexture.level = 1;
  m.metallicTexture = C.opO;
  m.useRoughnessFromMetallicTextureGreen = true;
  m.useMetallnessFromMetallicTextureBlue = true;
  m.useRoughnessFromMetallicTextureAlpha = false;
  m.metallic = 1;
  m.roughness = 1;
  m.environmentIntensity = 0.9;
  m.directIntensity = 1.1;
  m.albedoColor = new B.Color3(1, 1, 1);
  return (C[k] = m);
}

/* ---------- ossos (mesma ordem dos nós do contrato) ---------- */
const BN = { H: 0, TL: 1, KL: 2, TR: 3, KR: 4, U: 5, HD: 6, RIG: 7, RO: 8, AG: 9, AL: 10 };
/* estilo extra de cada operador (equipamento que define a silhueta) — só aparência */
const CH_STYLE = {
  brecha: {
    boot: '#1e1d1c',
    glove: '#2b2a28',
    gaiter: '#4a4c4c',
    holster: true,
    charges: true,
    headset: true,
    vestTone: 0.95,
  },
  estilhaco: { boot: '#1a1a1a', glove: '#222324', nades: true, vestTone: 1 },
  olho: {
    boot: '#6e5a41',
    glove: '#5a4a38',
    radioPack: true,
    headset: true,
    light: true,
    hair: [0.3, 0.24, 0.2],
    vestTone: 1.05,
  },
  macarico: {
    boot: '#2a211b',
    glove: '#6b4a2e',
    gauntlet: true,
    tanks: true,
    apron: true,
    vestTone: 1,
  },
  muralha: { boot: '#151618', glove: '#1d1e20', pauldron: true, shin: true, vestTone: 1 },
  faisca: {
    boot: '#4a3624',
    glove: '#3a2c20',
    rolled: true,
    faceBandana: true,
    hair: [0.2, 0.16, 0.14],
    vestTone: 1,
  },
  arame: {
    boot: '#3b3326',
    glove: '#3c3a2c',
    wirePack: true,
    facePaint: true,
    light: true,
    vestTone: 1,
  },
  bunker: {
    boot: '#26241f',
    glove: '#3a3a33',
    gaiter: '#5b5d52',
    helmCover: true,
    headset: true,
    pauldron: false,
    vestTone: 1,
  },
};
const chStyle = (op) => CH_STYLE[op.id] || { boot: '#1e1d1c', glove: '#2b2a28', vestTone: 1 };
const shade = (hex, k) => linMul(lin(hex), k);
/* ---------- corpo: pernas, coturnos, quadril, tronco, colete, mochila ---------- */
function chBody(g, op) {
  const L = op.look,
    ST = chStyle(op),
    heavy = op.armor >= 3,
    light = op.armor === 1 || ST.light;
  const vest = shade(L.vest, ST.vestTone || 1),
    vestD = linMul(vest, 0.78),
    vestL = linMul(vest, 1.12),
    dark = lin('#1b1c1e'),
    poly = lin('#202224'),
    boot = lin(ST.boot),
    bootD = linMul(boot, 0.55);
  const molle = (p, c) => {
    const y = (p[1] * 1000) | 0;
    return y % 26 < 7 ? [0.72, 0.72, 0.72] : null;
  }; /* fileiras de MOLLE pintadas na cor por vértice */
  /* pernas: calça larga com vincos (atrás do joelho, sobre o coturno) */
  for (const s of [-1, 1]) {
    const cx = 0.1 * s,
      TH = s < 0 ? BN.TL : BN.TR,
      KN = TH + 1;
    const Y = [1.0, 0.93, 0.84, 0.74, 0.645, 0.565, 0.505, 0.455, 0.39, 0.32, 0.26, 0.205, 0.16],
      RX = [
        0.098, 0.097, 0.091, 0.084, 0.076, 0.068, 0.064, 0.062, 0.064, 0.059, 0.053, 0.05, 0.049,
      ],
      RZ = [0.1, 0.1, 0.095, 0.088, 0.08, 0.072, 0.068, 0.066, 0.068, 0.061, 0.055, 0.052, 0.051],
      CZ = [0, 0, 0, 0, -0.002, -0.006, -0.009, -0.006, 0.006, 0.006, 0.004, 0.004, 0.004];
    gLoft(
      g,
      Y.map((y, i) => ({ c: [cx + (i > 8 ? -0.004 * s : 0), y, CZ[i]], rx: RX[i], rz: RZ[i] })),
      {
        reg: 'camo',
        seg: 16,
        e: 2.15,
        disp: (t, th, p) => {
          const y = p[1],
            sn = Math.sin(th),
            bk = Math.max(0, -sn),
            fr = Math.max(0, sn),
            side = Math.cos(th) * s;
          return (
            0.0045 * Math.sin(y * 240) * bk * gau(y, 0, 0.51, 0, 0.05, 1) +
            0.006 * fr * gau(y, 0, 0.5, 0, 0.035, 1) +
            0.0045 * Math.sin(y * 210 + th * 2) * gau(y, 0, 0.22, 0, 0.045, 1) +
            0.0028 * Math.sin(th * 4 + y * 11) * sst(0.6, 0.8, y) +
            0.002 * Math.sin(y * 90 + th * 3) * Math.max(0, side)
          );
        },
        wf: (p) => {
          const a = sst(0.44, 0.56, p[1]),
            hb = sst(0.86, 1.0, p[1]) * 0.9 * a;
          return [
            [KN, 1 - a],
            [TH, a - hb],
            [BN.H, hb],
          ];
        },
      }
    );
    /* bolso cargo na lateral da coxa + aba */
    gBox(g, [cx + s * 0.088, 0.71, -0.004], [0.13, 0.155, 0.034], 0.012, {
      reg: 'camo',
      rot: [0, Math.PI / 2, 0],
      bulge: 0.007,
      bone: TH,
      seed: 'cg' + s,
    });
    gBox(g, [cx + s * 0.093, 0.795, -0.004], [0.14, 0.04, 0.026], 0.01, {
      reg: 'camo',
      rot: [0, Math.PI / 2, 0.0],
      bone: TH,
      col: [0.85, 0.85, 0.85],
    });
    if (ST.holster && s > 0) {
      gBox(g, [cx + 0.088, 0.76, 0.0], [0.05, 0.17, 0.11], 0.015, {
        reg: 'gear',
        col: vestD,
        rot: [0.1, 0, 0],
        bone: TH,
      });
      gBox(g, [cx + 0.088, 0.86, 0.01], [0.035, 0.07, 0.05], 0.012, {
        reg: 'hard',
        col: poly,
        rot: [0.25, 0, 0],
        bone: TH,
      });
      gRing(g, [cx, 0.8, 0], 0.1, 0.102, 0.03, 0.008, { reg: 'gear', col: dark, bone: TH });
      gRing(g, [cx, 0.68, 0], 0.088, 0.09, 0.03, 0.008, { reg: 'gear', col: dark, bone: TH });
    }
    /* joelheira: casca rígida + alças */
    gEll(g, [cx, 0.505, -0.012], [0.07, 0.083, 0.066], {
      reg: 'hard',
      col: ST.boot === '#6e5a41' ? lin('#5a4a38') : lin('#26272a'),
      rot: [-Math.PI / 2, 0, 0],
      phi1: () => 1.2,
      seg: 14,
      ring: 5,
      thick: 0.014,
      bone: KN,
    });
    gEll(g, [cx, 0.505, -0.02], [0.04, 0.05, 0.06], {
      reg: 'rubber',
      col: dark,
      rot: [-Math.PI / 2, 0, 0],
      phi1: () => 0.55,
      seg: 10,
      ring: 2,
      bone: KN,
      noOcc: true,
    });
    gRing(g, [cx, 0.44, -0.002], 0.066, 0.068, 0.016, 0.006, { reg: 'gear', col: dark, bone: KN });
    if (ST.shin)
      gEll(g, [cx, 0.33, -0.02], [0.066, 0.11, 0.07], {
        reg: 'hard',
        col: lin('#232529'),
        rot: [-Math.PI / 2, 0, 0],
        phi1: () => 1.15,
        seg: 12,
        ring: 4,
        thick: 0.01,
        bone: KN,
      });
    /* coturno: cano, peito do pé, sola com ressalto, cadarço */
    gLoft(
      g,
      [
        { c: [cx, 0.275, 0.004], rx: 0.058, rz: 0.061 },
        { c: [cx, 0.22, 0.004], rx: 0.057, rz: 0.06 },
        { c: [cx, 0.16, 0.006], rx: 0.056, rz: 0.06 },
        { c: [cx, 0.11, 0.01], rx: 0.057, rz: 0.064 },
        { c: [cx, 0.075, 0.016], rx: 0.058, rz: 0.07 },
      ],
      {
        reg: 'rubber',
        col: boot,
        seg: 14,
        bone: KN,
        disp: (t, th, p) => 0.002 * Math.sin(p[1] * 160) * Math.max(0, Math.sin(th)),
      }
    );
    gRing(g, [cx, 0.272, 0.004], 0.06, 0.063, 0.022, 0.012, {
      reg: 'rubber',
      col: bootD,
      bone: KN,
      seg: 6,
    });
    gLoft(
      g,
      [
        { c: [cx, 0.072, 0.078], rx: 0.049, rz: 0.064 },
        { c: [cx, 0.07, 0.05], rx: 0.054, rz: 0.068 },
        { c: [cx, 0.062, 0.0], rx: 0.056, rz: 0.06 },
        { c: [cx, 0.054, -0.05], rx: 0.055, rz: 0.05 },
        { c: [cx, 0.047, -0.1], rx: 0.052, rz: 0.042 },
        { c: [cx, 0.042, -0.142], rx: 0.047, rz: 0.035 },
        { c: [cx, 0.039, -0.177], rx: 0.04, rz: 0.028 },
        { c: [cx, 0.037, -0.196], rx: 0.026, rz: 0.02 },
      ],
      {
        reg: 'rubber',
        col: boot,
        seg: 14,
        e: 2.6,
        ref: [0, 1, 0],
        cap1: true,
        capD: 0.3,
        cap0: true,
        bone: KN,
      }
    );
    gBox(g, [cx, 0.016, -0.058], [0.116, 0.032, 0.292], 0.014, {
      reg: 'rubber',
      col: lin('#141414'),
      bone: KN,
    });
    gBox(g, [cx, 0.005, 0.04], [0.11, 0.012, 0.09], 0.005, {
      reg: 'rubber',
      col: lin('#0e0e0e'),
      bone: KN,
      noOcc: true,
    });
    for (let i = 0; i < 4; i++) {
      const z = -0.03 - i * 0.028,
        y = 0.098 - i * 0.0135;
      gBox(g, [cx, y, z], [0.05, 0.006, 0.008], 0.0025, {
        reg: 'gear',
        col: bootD,
        rot: [-0.4, 0, 0],
        bone: KN,
        noOcc: true,
      });
    }
    for (let i = 0; i < 3; i++)
      gBox(g, [cx, 0.14 + i * 0.045, -0.056], [0.05, 0.006, 0.008], 0.0025, {
        reg: 'gear',
        col: bootD,
        bone: KN,
        noOcc: true,
      });
  }
  /* quadril + cinto com fivela e bolsos */
  gLoft(
    g,
    [
      { c: [0, 0.84, 0.006], rx: 0.12, rz: 0.09 },
      { c: [0, 0.9, 0.004], rx: 0.165, rz: 0.11 },
      { c: [0, 0.99, 0], rx: 0.172, rz: 0.118 },
      { c: [0, 1.07, 0], rx: 0.166, rz: 0.114 },
    ],
    {
      reg: 'camo',
      seg: 18,
      e: 2.3,
      cap0: true,
      bone: BN.H,
      paint: (p) => {
        const k = 1 - 0.35 * (1 - sst(0.84, 0.95, p[1]));
        return [k, k, k];
      },
    }
  );
  gRing(g, [0, 1.015, 0], 0.18, 0.126, 0.05, 0.012, {
    reg: 'gear',
    col: lin('#26231f'),
    bone: BN.H,
    n: 22,
  });
  gBox(g, [0, 1.015, -0.135], [0.055, 0.04, 0.014], 0.005, {
    reg: 'metal',
    col: lin('#5a5a58'),
    bone: BN.H,
  });
  for (const s of [-1, 1]) {
    gBox(g, [s * 0.155, 0.985, 0.06], [0.05, 0.085, 0.075], 0.012, {
      reg: 'gear',
      col: vestD,
      rot: [0, s * 0.75, 0],
      bone: BN.H,
      bulge: 0.004,
    });
  }
  gBox(g, [-0.07, 0.975, 0.135], [0.11, 0.1, 0.045], 0.016, {
    reg: 'gear',
    col: vestD,
    bone: BN.H,
    bulge: 0.008,
  });
  if (heavy)
    gBox(g, [0, 0.93, -0.135], [0.17, 0.15, 0.03], 0.012, {
      reg: 'gear',
      col: vest,
      rot: [0.14, 0, 0],
      bone: BN.H,
      bulge: 0.005,
      paint: molle,
    });
  if (ST.apron)
    gLoft(
      g,
      [
        { c: [0, 1.0, -0.13], rx: 0.16, rz: 0.012 },
        { c: [0, 0.84, -0.125], rx: 0.15, rz: 0.012 },
        { c: [0, 0.7, -0.13], rx: 0.15, rz: 0.012 },
      ],
      {
        reg: 'gear',
        col: lin('#4b3a2a'),
        e: 6,
        seg: 8,
        ref: [0, 0, -1],
        cap1: true,
        wf: (p) => {
          const a = sst(0.75, 0.95, p[1]);
          return [
            [BN.H, a],
            [BN.TL, (1 - a) * 0.5],
            [BN.TR, (1 - a) * 0.5],
          ];
        },
      }
    );
  /* tronco: camisa (desliza para o quadril na cintura), ombros, pescoço */
  const TY = [0.96, 1.04, 1.12, 1.22, 1.31, 1.385, 1.43, 1.47, 1.505, 1.53],
    TRX = [0.158, 0.156, 0.164, 0.178, 0.19, 0.196, 0.19, 0.16, 0.11, 0.068],
    TRZ = [0.114, 0.11, 0.114, 0.124, 0.13, 0.126, 0.118, 0.1, 0.08, 0.058],
    TCZ = [0, 0, -0.004, -0.008, -0.01, -0.004, 0, 0.006, 0.012, 0.014];
  gLoft(
    g,
    TY.map((y, i) => ({ c: [0, y, TCZ[i]], rx: TRX[i], rz: TRZ[i] })),
    {
      reg: 'camo',
      seg: 18,
      e: 2.5,
      disp: (t, th, p) =>
        0.0025 * Math.sin(p[1] * 70 + th * 5) * sst(1.0, 1.15, p[1]) * (1 - sst(1.3, 1.42, p[1])),
      wf: (p) => {
        const a = sst(0.97, 1.12, p[1]);
        return [
          [BN.H, 1 - a],
          [BN.U, a],
        ];
      },
    }
  );
  for (const s of [-1, 1])
    gEll(g, [s * 0.19, 1.405, 0.004], [0.075, 0.07, 0.082], { reg: 'camo', seg: 14, bone: BN.U });
  gLoft(
    g,
    [
      { c: [0, 1.47, 0.016], rx: 0.058, rz: 0.058 },
      { c: [0, 1.53, 0.014], rx: 0.05, rz: 0.052 },
      { c: [0, 1.575, 0.012], rx: 0.043, rz: 0.045 },
    ],
    {
      reg: 'skin',
      col: linMul(lin(L.skin), 0.92),
      seg: 12,
      wf: (p) => {
        const a = sst(1.53, 1.6, p[1]);
        return [
          [BN.U, 1 - a],
          [BN.HD, a],
        ];
      },
    }
  );
  if (!ST.gaiter && !ST.faceBandana)
    gLoft(
      g,
      [
        { c: [0, 1.475, 0.014], rx: 0.075, rz: 0.072 },
        { c: [0, 1.505, 0.012], rx: 0.066, rz: 0.066 },
        { c: [0, 1.515, 0.012], rx: 0.058, rz: 0.06 },
      ],
      { reg: 'camo', seg: 14, bone: BN.U }
    );
  if (ST.gaiter) {
    gLoft(
      g,
      [
        { c: [0, 1.49, 0.012], rx: 0.07, rz: 0.07 },
        { c: [0, 1.535, 0.008], rx: 0.064, rz: 0.066 },
        { c: [0, 1.575, 0.004], rx: 0.058, rz: 0.06 },
      ],
      {
        reg: 'gear',
        col: lin(ST.gaiter),
        seg: 14,
        disp: (t, th, p) => 0.004 * Math.sin(th * 7 + p[1] * 40),
        wf: (p) => {
          const a = sst(1.53, 1.6, p[1]);
          return [
            [BN.U, 1 - a],
            [BN.HD, a],
          ];
        },
      }
    );
  }
  /* colete */
  const pd = heavy ? 0.064 : 0.05;
  if (light) {
    gBox(g, [0, 1.2, -0.148], [0.31, 0.17, 0.05], 0.016, {
      reg: 'gear',
      col: vest,
      rot: [-0.05, 0, 0],
      bone: BN.U,
      bulge: 0.005,
      paint: molle,
    });
    for (let i = -1; i <= 1; i++) {
      gBox(g, [i * 0.085, 1.2, -0.188], [0.072, 0.11, 0.04], 0.012, {
        reg: 'gear',
        col: vestL,
        bone: BN.U,
        bulge: 0.004,
      });
      gBox(g, [i * 0.085, 1.262, -0.186], [0.052, 0.03, 0.026], 0.006, {
        reg: 'hard',
        col: poly,
        bone: BN.U,
      });
    }
    for (const s of [-1, 1]) {
      gStrap(
        g,
        [
          [s * 0.12, 1.28, -0.16],
          [s * 0.13, 1.45, -0.1],
          [s * 0.12, 1.515, -0.0],
          [s * 0.08, 1.42, 0.13],
          [-s * 0.05, 1.25, 0.15],
          [-s * 0.13, 1.12, 0.1],
        ],
        0.045,
        0.012,
        { reg: 'gear', col: vestD, bone: BN.U, ref: [0, 0, -1] }
      );
    }
    gRing(g, [0, 1.13, 0], 0.183, 0.134, 0.04, 0.01, {
      reg: 'gear',
      col: vestD,
      bone: BN.U,
      n: 20,
    });
  } else {
    gLoft(
      g,
      [
        { c: [0, 1.05, 0], rx: 0.176, rz: 0.128 },
        { c: [0, 1.06, 0], rx: 0.191, rz: 0.142 },
        { c: [0, 1.21, -0.004], rx: 0.198, rz: 0.146 },
        { c: [0, 1.22, -0.004], rx: 0.186, rz: 0.134 },
      ],
      { reg: 'gear', col: vestD, seg: 20, e: 2.8, bone: BN.U, paint: molle }
    );
    gBox(g, [0, 1.272, -0.142 - pd / 2 + 0.02], [0.3, 0.33, pd], 0.02, {
      reg: 'gear',
      col: vest,
      rot: [-0.06, 0, 0],
      bone: BN.U,
      bulge: 0.006,
      paint: molle,
    });
    gBox(g, [0, 1.28, 0.135 + pd / 2 - 0.016], [0.31, 0.36, pd], 0.02, {
      reg: 'gear',
      col: vest,
      rot: [0.05, 0, 0],
      bone: BN.U,
      bulge: 0.006,
      paint: molle,
    });
    for (const s of [-1, 1])
      gStrap(
        g,
        [
          [s * 0.1, 1.42, -0.16],
          [s * 0.112, 1.495, -0.08],
          [s * 0.118, 1.52, 0.0],
          [s * 0.112, 1.495, 0.08],
          [s * 0.1, 1.42, 0.16],
        ],
        0.062,
        0.016,
        { reg: 'gear', col: vest, bone: BN.U, ref: [0, 1, 0] }
      );
    const fz = -0.142 - pd + 0.016;
    for (let i = -1; i <= 1; i++) {
      gBox(g, [i * 0.083, 1.195, fz - 0.022], [0.074, 0.118, 0.044], 0.012, {
        reg: 'gear',
        col: vestL,
        bone: BN.U,
        bulge: 0.004,
      });
      gBox(g, [i * 0.083, 1.266, fz - 0.02], [0.054, 0.032, 0.03], 0.006, {
        reg: 'hard',
        col: poly,
        bone: BN.U,
      });
      gBox(g, [i * 0.083, 1.235, fz - 0.046], [0.07, 0.01, 0.006], 0.003, {
        reg: 'rubber',
        col: dark,
        bone: BN.U,
        noOcc: true,
      });
    }
    gBox(g, [0, 1.36, fz - 0.016], [0.18, 0.075, 0.032], 0.012, {
      reg: 'gear',
      col: vestD,
      bone: BN.U,
      bulge: 0.004,
    });
    gBox(g, [-0.07, 1.375, fz - 0.034], [0.06, 0.025, 0.004], 0.002, {
      reg: 'gear',
      col: L.cols ? linMul(lin(L.cols[0]), 0.9) : vestL,
      bone: BN.U,
      noOcc: true,
    });
    gBox(g, [0, 1.13, 0.2 + (heavy ? 0.012 : 0)], [0.16, 0.085, 0.05], 0.014, {
      reg: 'gear',
      col: vestL,
      bone: BN.U,
      bulge: 0.006,
    });
    if (!L.pack && !ST.tanks && !ST.charges) {
      gBox(g, [0.07, 1.3, 0.2 + (heavy ? 0.012 : 0)], [0.1, 0.14, 0.045], 0.014, {
        reg: 'gear',
        col: vestL,
        bone: BN.U,
        bulge: 0.006,
      });
      gBox(g, [-0.07, 1.33, 0.19 + (heavy ? 0.012 : 0)], [0.08, 0.1, 0.035], 0.012, {
        reg: 'gear',
        col: vestD,
        bone: BN.U,
        bulge: 0.004,
      });
    }
    gStrap(
      g,
      [
        [-0.05, 1.44, 0.17],
        [-0.04, 1.475, 0.2],
        [0.04, 1.475, 0.2],
        [0.05, 1.44, 0.17],
      ],
      0.03,
      0.01,
      { reg: 'gear', col: dark, bone: BN.U, ref: [0, 0, 1] }
    );
  }
  /* rádio no lado esquerdo + antena; bolso de granada à direita */
  gBox(g, [-0.2, 1.24, -0.05], [0.045, 0.12, 0.065], 0.01, {
    reg: 'hard',
    col: lin('#25272a'),
    rot: [0, 0.2, 0],
    bone: BN.U,
  });
  gLoft(
    g,
    [
      { c: [-0.2, 1.3, -0.05], rx: 0.007, rz: 0.007 },
      { c: [-0.205, 1.42, -0.045], rx: 0.004, rz: 0.004 },
    ],
    { reg: 'rubber', col: dark, seg: 6, cap1: true, bone: BN.U, noOcc: true }
  );
  gLoft(
    g,
    [
      { c: [0.205, 1.07, -0.04], rx: 0.03, rz: 0.03 },
      { c: [0.205, 1.18, -0.04], rx: 0.031, rz: 0.031 },
    ],
    { reg: 'gear', col: vestD, seg: 10, cap0: true, cap1: true, bone: BN.U }
  );
  if (ST.nades)
    for (const s of [-1, 1])
      for (const k of [0, 1])
        gLoft(
          g,
          [
            { c: [s * (0.13 + k * 0.05), 1.04, -0.15 + k * 0.04], rx: 0.028, rz: 0.028 },
            { c: [s * (0.13 + k * 0.05), 1.13, -0.15 + k * 0.04], rx: 0.03, rz: 0.03 },
          ],
          { reg: 'gear', col: vestL, seg: 10, cap0: true, cap1: true, bone: BN.U }
        );
  if (ST.charges)
    gBox(g, [0, 1.3, 0.205 + (heavy ? 0.012 : 0)], [0.24, 0.2, 0.035], 0.008, {
      reg: 'hard',
      col: lin('#3e3d33'),
      bone: BN.U,
    });
  if (heavy) {
    gLoft(
      g,
      [
        { c: [0, 1.47, 0.0], rx: 0.12, rz: 0.105 },
        { c: [0, 1.53, 0.008], rx: 0.1, rz: 0.09 },
      ],
      {
        reg: 'gear',
        col: vestD,
        seg: 16,
        arc: [-Math.PI * 0.12, Math.PI * 1.12],
        e: 2,
        bone: BN.U,
        noOcc: true,
      }
    );
    for (const s of [-1, 1]) {
      const big = ST.pauldron;
      gEll(g, [s * 0.215, 1.44, 0.0], big ? [0.12, 0.075, 0.13] : [0.1, 0.06, 0.11], {
        reg: big ? 'hard' : 'gear',
        col: big ? lin('#20252f') : vest,
        rot: [0, 0, s * -0.45],
        phi1: () => (big ? 1.35 : 1.2),
        seg: 14,
        ring: 5,
        thick: 0.014,
        bone: BN.U,
      });
    }
  }
  /* mochilas */
  if (L.pack) {
    const pc = ST.wirePack ? lin('#3c4430') : lin('#4a4434');
    gBox(g, [0, 1.24, 0.255], [0.3, 0.4, 0.15], 0.04, {
      reg: 'gear',
      col: pc,
      bone: BN.U,
      bulge: 0.01,
      hi: true,
    });
    gBox(g, [0, 1.43, 0.255], [0.29, 0.06, 0.16], 0.025, {
      reg: 'gear',
      col: linMul(pc, 0.85),
      bone: BN.U,
    });
    for (const s of [-1, 1])
      gBox(g, [s * 0.17, 1.2, 0.255], [0.05, 0.2, 0.1], 0.018, {
        reg: 'gear',
        col: linMul(pc, 0.92),
        bone: BN.U,
        bulge: 0.006,
      });
    gBox(g, [0, 1.17, 0.34], [0.22, 0.16, 0.03], 0.014, {
      reg: 'gear',
      col: linMul(pc, 0.9),
      bone: BN.U,
      bulge: 0.005,
    });
    if (ST.radioPack) {
      gBox(g, [0.08, 1.36, 0.335], [0.1, 0.14, 0.04], 0.008, {
        reg: 'hard',
        col: lin('#2e3030'),
        bone: BN.U,
      });
      gLoft(
        g,
        [
          { c: [0.11, 1.43, 0.33], rx: 0.008, rz: 0.008 },
          { c: [0.12, 1.75, 0.36], rx: 0.004, rz: 0.004 },
          { c: [0.125, 1.95, 0.38], rx: 0.003, rz: 0.003 },
        ],
        { reg: 'rubber', col: dark, seg: 6, cap1: true, bone: BN.U, noOcc: true }
      );
    }
    if (ST.wirePack)
      for (let i = 0; i < 3; i++)
        gRing(g, [0, 1.47 + i * 0.012, 0.26], 0.13 - i * 0.004, 0.075, 0.012, 0.012, {
          reg: 'metal',
          col: lin('#6a6a64'),
          bone: BN.U,
          n: 16,
          seg: 5,
          tilt: 0.01,
          noOcc: true,
        });
  }
  if (ST.tanks)
    for (const s of [-1, 1]) {
      gLoft(
        g,
        [
          { c: [s * 0.065, 1.06, 0.22], rx: 0.055, rz: 0.055 },
          { c: [s * 0.065, 1.4, 0.22], rx: 0.055, rz: 0.055 },
        ],
        {
          reg: 'hard',
          col: s < 0 ? lin('#6b2a22') : lin('#3a4a5a'),
          seg: 14,
          cap0: true,
          cap1: true,
          capD: 0.5,
          bone: BN.U,
        }
      );
      gLoft(
        g,
        [
          { c: [s * 0.065, 1.43, 0.22], rx: 0.018, rz: 0.018 },
          { c: [s * 0.065, 1.47, 0.22], rx: 0.015, rz: 0.015 },
        ],
        { reg: 'metal', col: lin('#8a8a80'), seg: 8, cap1: true, bone: BN.U }
      );
    }
}

/* ---------- cabeça: crânio deformado (nariz, arcadas, maçãs, queixo), olhos, orelhas ---------- */
const HY = 1.64,
  HRAD = [0.077, 0.108, 0.097];
const HO = (x, y, z) => [x, HY + y, z];
function headDef(d, pl) {
  const fr = Math.max(0, -d[2]),
    f2 = fr * fr,
    f3 = f2 * fr,
    x = d[0],
    y = d[1];
  let dx = 0,
    dy = 0,
    dz = 0;
  const jaw = sst(-0.1, -0.9, y);
  dx -= pl[0] * 0.24 * jaw * (1 - 0.2 * fr);
  if (pl[2] > 0) dz -= pl[2] * 0.22 * jaw; /* mandíbula mais estreita, nuca entra no pescoço */
  dz +=
    0.012 *
    f2 *
    (1 -
      0.5 *
        gau(
          x,
          y,
          0,
          -0.75,
          0.3,
          0.25
        )); /* rosto mais plano que a nuca, queixo segue para a frente */
  dz -= 0.006 * gau(x, y, 0, 0.17, 0.55, 0.07) * fr; /* arcada supraciliar */
  for (const s of [-1, 1]) {
    dz += 0.0035 * gau(x, y, s * 0.36, 0.03, 0.12, 0.08) * fr;
    const c = 0.006 * gau(x, y, s * 0.62, -0.12, 0.16, 0.15);
    dx += x * c;
    dz -= fr * c * 0.6;
  } /* órbitas, maçãs */
  dz -= 0.004 * gau(x, y, 0, -0.5, 0.22, 0.08) * f2; /* boca para a frente (arcada dentária) */
  dz -= 0.007 * gau(x, y, 0, -0.84, 0.22, 0.1) * fr;
  dy -= 0.004 * gau(x, y, 0, -0.9, 0.3, 0.1) * fr; /* queixo */
  dz += 0.005 * gau(x, y, s0(x), -0.38, 0.12, 0.14) * 0;
  dz += 0.007 * gau(d[2], y, 0.75, 0.15, 0.3, 0.35); /* occipital */
  dx += pl[0] * 0.04 * gau(x, y, Math.sign(x) * 0.95, 0.15, 0.3, 0.3); /* têmporas/parietal */
  return [dx, dy, dz];
}
const s0 = (x) => 0;
function headPaint(L, ST, covered) {
  const hair = lin('#2a1f18');
  return (p) => {
    const q = [p[0] / HRAD[0], (p[1] - HY) / HRAD[1], p[2] / HRAD[2]],
      l = Math.hypot(q[0], q[1], q[2]) || 1,
      x = q[0] / l,
      y = q[1] / l,
      z = q[2] / l,
      fr = Math.max(0, -z);
    let m = [1, 1, 1];
    const mul = (k, c) => {
      m = [m[0] * (1 - k + k * c[0]), m[1] * (1 - k + k * c[1]), m[2] * (1 - k + k * c[2])];
    };
    for (const s of [-1, 1]) {
      mul(0.85 * gau(x, y, s * 0.34, 0.2, 0.15, 0.035) * fr, [0.25, 0.2, 0.17]);
      mul(0.25 * gau(x, y, s * 0.5, -0.25, 0.18, 0.14) * fr, [1.05, 0.86, 0.84]);
      mul(0.35 * gau(x, y, s * 0.35, 0.03, 0.12, 0.06) * fr, [0.8, 0.72, 0.7]);
    }
    if (ST.stubble)
      mul(
        0.55 * sst(-0.3, -0.6, y) * (1 - sst(0.6, 0.9, z)) * (1 - gau(x, y, 0, -0.555, 0.25, 0.06)),
        [0.55, 0.5, 0.48]
      );
    if (ST.facePaint) {
      const st = Math.sin(x * 14 + y * 6);
      mul(0.65 * sst(0.2, 0.7, st) * fr * (1 - sst(0.1, 0.2, y)), [0.42, 0.5, 0.32]);
      mul(
        0.6 * sst(0.4, 0.8, -st) * fr * sst(-0.6, -0.1, y) * (1 - sst(0.1, 0.2, y)),
        [0.2, 0.22, 0.18]
      );
    }
    if (!covered && ST.hair) {
      const yh = 0.12 + (z < 0 ? -z * 0.42 : -z * 0.5),
        h = sst(yh, yh + 0.12, y);
      mul(0.85 * h, ST.hair);
    }
    return m;
  };
}
/* malha da cabeça escaneada (assets/op_head.bin: int16 pos, int8 normal, uint16 uv, uint16 índices) */
function chScan() {
  if (chScan.d !== undefined) return chScan.d;
  chScan.d = null;
  if (typeof ASSET_FILE === 'undefined' || !ASSET_FILE['op_head.bin']) return null;
  const b = Uint8Array.from(atob(ASSET_FILE['op_head.bin']), (c) => c.charCodeAt(0)),
    dv = new DataView(b.buffer),
    nv = dv.getUint16(0, true),
    ni = dv.getUint16(2, true);
  let o = 4;
  const P = new Float32Array(nv * 3),
    N = new Float32Array(nv * 3),
    U = new Float32Array(nv * 2),
    I = new Uint16Array(ni);
  for (let i = 0; i < nv * 3; i++) {
    P[i] = (dv.getInt16(o, true) / 32767) * 0.25 * 0.93;
    o += 2;
  }
  for (let i = 1; i < nv * 3; i += 3) P[i] += 0.0007;
  for (let i = 0; i < nv * 3; i++) {
    N[i] = dv.getInt8(o) / 127;
    o += 1;
  }
  for (let i = 0; i < nv * 2; i++) {
    U[i] = dv.getUint16(o, true) / 65535;
    o += 2;
  }
  for (let i = 0; i < ni; i++) {
    I[i] = dv.getUint16(o, true);
    o += 2;
  }
  return (chScan.d = { P, N, U, I, nv, ni });
}
/* insere a cabeça escaneada; infl = inflar pela normal (balaclava), skip(p) = pula triângulos (abertura dos olhos) */
function gScan(g, o, infl, skip) {
  const S = chScan();
  if (!S) return false;
  g.begin(o);
  const base = g.P.length / 3,
    ctr = HO(0, 0, 0);
  for (let i = 0; i < S.nv; i++) {
    let p = [S.P[i * 3], S.P[i * 3 + 1], S.P[i * 3 + 2]];
    if (infl) p = v3a(p, v3k([S.N[i * 3], S.N[i * 3 + 1], S.N[i * 3 + 2]], infl));
    const w = [p[0], p[1] + HY, p[2]];
    g.vert(w, infl ? w[0] * 1.3 + w[2] * 0.6 : S.U[i * 2], infl ? w[1] : S.U[i * 2 + 1], ctr);
  }
  for (let t = 0; t < S.ni; t += 3) {
    const a = S.I[t],
      b = S.I[t + 1],
      c = S.I[t + 2];
    if (skip) {
      const m = [
        (S.P[a * 3] + S.P[b * 3] + S.P[c * 3]) / 3,
        (S.P[a * 3 + 1] + S.P[b * 3 + 1] + S.P[c * 3 + 1]) / 3,
        (S.P[a * 3 + 2] + S.P[b * 3 + 2] + S.P[c * 3 + 2]) / 3,
      ];
      if (skip(m)) continue;
    }
    g.tri(base + a, base + c, base + b);
  }
  if (!infl) g.proxy({ t: 'ell', c: HO(0, 0.005, 0), r: [0.072, 0.1, 0.094], X: mkXf({}) });
  g.end();
  return true;
}
const HWF = (p) => {
  const a = sst(1.5, 1.575, p[1]);
  return [
    [BN.U, 1 - a],
    [BN.HD, a],
  ];
};
function chHead(g, op) {
  const L = op.look,
    ST = chStyle(op),
    skin = linMul(lin(L.skin), 1.32);
  const hp = headPaint(L, ST, L.head === 'balaclava'),
    eyeN = skin.map(
      (v) => 0.45 / Math.max(v, 0.02)
    ); /* olhos: tinta neutra (cor real pintada na textura) */
  const ok = gScan(g, {
    reg: 'face',
    uvAbs: true,
    keepWinding: true,
    col: skin,
    wf: HWF,
    paint: (p) => {
      let m = hp(p) || [1, 1, 1];
      const y = p[1] - HY;
      if (p[2] < -0.06) {
        const k =
          Math.max(
            gau(p[0], y, -0.031, 0.012, 0.0095, 0.006),
            gau(p[0], y, 0.031, 0.012, 0.0095, 0.006)
          ) * 0.9;
        if (k > 0.02) m = m.map((v, i) => v * (1 - k) + eyeN[i] * k);
      }
      return m;
    },
  });
  if (!ok)
    gEll(g, HO(0, 0, 0), HRAD, {
      reg: 'skin',
      col: skin,
      seg: 24,
      ring: 16,
      def: headDef,
      wf: HWF,
    });
  headgear2(g, op, L, ST);
}
/* ---------- chapéus, capacetes e máscaras (cada operador com silhueta própria) ---------- */
function headgear2(g, op, L, ST) {
  const hc = lin(L.headCol),
    dark = lin('#1a1b1d'),
    poly = lin('#232528'),
    metal = lin('#4a4c4e'),
    HB = { bone: BN.HD };
  const o = (x) => Object.assign({}, HB, x);
  const cutHelm = (front, side, back) => (th) => {
    const sn = Math.sin(th),
      c = Math.cos(th);
    return sn < 0 ? front * -sn + side * (1 - -sn) : back * sn + side * (1 - sn);
  };
  const headset = (both) => {
    for (const s of both ? [-1, 1] : [1]) {
      gLoft(
        g,
        [
          { c: HO(s * 0.08, -0.008, 0.006), rx: 0.043, rz: 0.046 },
          { c: HO(s * 0.112, -0.008, 0.006), rx: 0.041, rz: 0.044 },
        ],
        o({ reg: 'hard', col: poly, seg: 14, ref: [0, 1, 0], cap1: true, capD: 0.25 })
      );
    }
    gLoft(
      g,
      [
        { c: HO(-0.11, -0.02, -0.02), rx: 0.005, rz: 0.005 },
        { c: HO(-0.1, -0.06, -0.07), rx: 0.004, rz: 0.004 },
        { c: HO(-0.045, -0.075, -0.1), rx: 0.004, rz: 0.004 },
      ],
      o({ reg: 'rubber', col: dark, seg: 6, cap1: true, noOcc: true })
    );
    gEll(
      g,
      HO(-0.042, -0.075, -0.102),
      [0.01, 0.008, 0.008],
      o({ reg: 'rubber', col: dark, seg: 8, noOcc: true })
    );
  };
  const glasses = () => {
    gEll(
      g,
      HO(0, 0.016, 0.002),
      [0.088, 0.026, 0.098],
      o({
        reg: 'glass',
        col: [0.25, 0.25, 0.22],
        th0: -Math.PI / 2 - 1.05,
        th1: -Math.PI / 2 + 1.05,
        phi0: () => 1.25,
        phi1: () => 1.9,
        seg: 16,
        ring: 3,
        thick: 0.003,
        noOcc: true,
      })
    );
    for (const s of [-1, 1])
      gStrap(
        g,
        [HO(s * 0.083, 0.016, -0.03), HO(s * 0.086, 0.014, 0.02), HO(s * 0.078, 0.0, 0.05)],
        0.006,
        0.004,
        o({ reg: 'hard', col: dark, ref: [s, 0, 0] })
      );
  };
  switch (L.head) {
    case 'helmet': {
      const cover = ST.helmCover;
      gEll(
        g,
        HO(0, 0.024, 0.006),
        [0.113, 0.112, 0.123],
        o({
          reg: cover ? 'camo' : 'hard',
          col: cover ? [0.95, 0.95, 0.95] : hc,
          phi1: cutHelm(1.33, 1.2, 1.78),
          seg: 20,
          ring: 7,
          thick: 0.013,
          def: cover ? (d) => v3k(d, 0.003 * Math.sin(d[0] * 25 + d[2] * 18)) : null,
        })
      );
      for (const s of [-1, 1]) {
        gBox(
          g,
          HO(s * 0.104, 0.04, 0.012),
          [0.012, 0.02, 0.13],
          0.004,
          o({ reg: 'hard', col: poly, rot: [0, 0, s * 0.32] })
        );
        gBox(
          g,
          HO(s * 0.096, -0.02, 0.06),
          [0.014, 0.04, 0.03],
          0.005,
          o({ reg: 'hard', col: poly, rot: [0, 0, s * 0.2] })
        );
      }
      gBox(
        g,
        HO(0, 0.1, -0.108),
        [0.05, 0.035, 0.02],
        0.006,
        o({ reg: 'metal', col: lin('#2c2e30'), rot: [-0.75, 0, 0] })
      );
      gBox(
        g,
        HO(0, 0.122, 0.03),
        [0.075, 0.012, 0.08],
        0.004,
        o({ reg: 'gear', col: linMul(hc, 0.8), rot: [0.25, 0, 0], noOcc: true })
      );
      if (ST.helmCover)
        gBox(
          g,
          HO(0, 0.06, 0.125),
          [0.07, 0.05, 0.025],
          0.008,
          o({ reg: 'gear', col: lin('#2f3229'), rot: [0.6, 0, 0] })
        );
      for (const s of [-1, 1])
        gStrap(
          g,
          [
            HO(s * 0.07, -0.025, 0.03),
            HO(s * 0.06, -0.08, -0.02),
            HO(s * 0.03, -0.112, -0.05),
            HO(0, -0.118, -0.058),
          ],
          0.014,
          0.004,
          o({ reg: 'gear', col: dark, ref: [s, -0.5, -0.3] })
        );
      headset(true);
      break;
    }
    case 'visorhelm': {
      gEll(
        g,
        HO(0, 0.022, 0.008),
        [0.116, 0.12, 0.127],
        o({ reg: 'hard', col: hc, phi1: cutHelm(1.3, 1.9, 1.98), seg: 26, ring: 10, thick: 0.014 })
      );
      gEll(
        g,
        HO(0, 0.005, -0.004),
        [0.123, 0.135, 0.13],
        o({
          reg: 'glass',
          col: [0.42, 0.48, 0.52],
          th0: -Math.PI / 2 - 1.2,
          th1: -Math.PI / 2 + 1.2,
          phi0: () => 1.0,
          phi1: () => 2.25,
          seg: 18,
          ring: 6,
          thick: 0.006,
          noOcc: true,
        })
      );
      gEll(
        g,
        HO(0, 0.005, -0.004),
        [0.126, 0.138, 0.133],
        o({
          reg: 'hard',
          col: linMul(hc, 0.7),
          th0: -Math.PI / 2 - 1.25,
          th1: -Math.PI / 2 + 1.25,
          phi0: () => 0.92,
          phi1: () => 1.02,
          seg: 18,
          ring: 1,
          thick: 0.01,
        })
      );
      for (const s of [-1, 1])
        gLoft(
          g,
          [
            { c: HO(s * 0.11, 0.0, -0.0), rx: 0.018, rz: 0.018 },
            { c: HO(s * 0.13, 0.0, 0.0), rx: 0.016, rz: 0.016 },
          ],
          o({ reg: 'metal', col: metal, seg: 10, ref: [0, 1, 0], cap1: true })
        );
      gLoft(
        g,
        [
          { c: HO(0, -0.08, 0.075), rx: 0.1, rz: 0.075 },
          { c: HO(0, -0.15, 0.06), rx: 0.11, rz: 0.085 },
        ],
        o({
          reg: 'gear',
          col: linMul(hc, 0.8),
          arc: [Math.PI * 0.05, Math.PI * 0.95],
          seg: 12,
          e: 2,
          noOcc: true,
          wf: (p) => {
            const a = sst(1.5, 1.56, p[1]);
            return [
              [BN.HD, a],
              [BN.U, 1 - a],
            ];
          },
        })
      );
      break;
    }
    case 'balaclava': {
      if (
        !gScan(
          g,
          o({ reg: 'knit', col: hc, wf: HWF }),
          0.0065,
          (m) => m[2] < -0.05 && Math.abs(m[0]) < 0.056 && m[1] > -0.002 && m[1] < 0.03
        )
      )
        gEll(
          g,
          HO(0, 0, 0),
          HRAD.map((v) => v + 0.006),
          o({ reg: 'knit', col: hc, seg: 28, ring: 20 })
        );
      gLoft(
        g,
        [
          { c: [0, 1.48, 0.014], rx: 0.062, rz: 0.064 },
          { c: [0, 1.56, 0.008], rx: 0.058, rz: 0.06 },
          { c: [0, 1.6, 0.004], rx: 0.06, rz: 0.062 },
        ],
        o({
          reg: 'knit',
          col: hc,
          seg: 14,
          disp: (t, th, p) => 0.003 * Math.sin(th * 6 + p[1] * 60),
          wf: (p) => {
            const a = sst(1.53, 1.6, p[1]);
            return [
              [BN.U, 1 - a],
              [BN.HD, a],
            ];
          },
        })
      );
      break;
    }
    case 'cap': {
      gEll(
        g,
        HO(0, 0.032, 0.008),
        [0.09, 0.1, 0.108],
        o({ reg: 'gear', col: hc, phi1: cutHelm(1.3, 1.42, 1.55), seg: 22, ring: 8, thick: 0.005 })
      );
      gBox(
        g,
        HO(0, 0.05, -0.135),
        [0.15, 0.007, 0.085],
        0.003,
        o({
          reg: 'gear',
          col: linMul(hc, 0.92),
          rot: [-0.2, 0, 0],
          def: (p) => [0, -p[0] * p[0] * 1.6, 0],
        })
      );
      gEll(
        g,
        HO(0, 0.128, 0.006),
        [0.012, 0.007, 0.012],
        o({ reg: 'gear', col: hc, seg: 8, noOcc: true })
      );
      headset(false);
      break;
    }
    case 'boonie': {
      gEll(
        g,
        HO(0, 0.04, 0.008),
        [0.09, 0.096, 0.108],
        o({
          reg: 'camo',
          col: [0.92, 0.92, 0.92],
          phi1: () => 1.45,
          seg: 22,
          ring: 7,
          thick: 0.005,
          def: (d) => v3k(d, 0.002 * Math.sin(d[0] * 20 + d[2] * 13)),
        })
      );
      gEll(
        g,
        HO(0, 0.064, 0.006),
        [0.165, 0.06, 0.175],
        o({
          reg: 'camo',
          col: [0.88, 0.88, 0.88],
          phi0: () => 1.4,
          phi1: (th) => 1.86 + 0.12 * Math.sin(th * 3 + 1),
          seg: 26,
          ring: 3,
          thick: 0.004,
          def: (d) => [0, -0.01 * Math.sin(d[0] * 9 + d[2] * 5), 0],
        })
      );
      gRing(
        g,
        HO(0, 0.05, 0.006),
        0.09,
        0.1,
        0.016,
        0.005,
        o({ reg: 'gear', col: lin('#2d3322'), n: 20, seg: 5 })
      );
      break;
    }
    case 'bandana': {
      gEll(
        g,
        HO(0, 0.016, 0.006),
        [0.087, 0.104, 0.109],
        o({
          reg: 'gear',
          col: hc,
          phi1: cutHelm(1.18, 1.45, 1.95),
          seg: 22,
          ring: 8,
          thick: 0.004,
          def: (d) => v3k(d, 0.0025 * Math.sin(d[0] * 22 + d[1] * 14)),
        })
      );
      gEll(g, HO(0, -0.005, 0.105), [0.026, 0.02, 0.02], o({ reg: 'gear', col: hc, seg: 10 }));
      for (const s of [-1, 1])
        gStrap(
          g,
          [HO(s * 0.008, -0.01, 0.115), HO(s * 0.02, -0.06, 0.125), HO(s * 0.03, -0.11, 0.12)],
          0.026,
          0.004,
          o({ reg: 'gear', col: linMul(hc, 0.9), ref: [0, 0, 1] })
        );
      gLoft(
        g,
        [
          { c: HO(0.1, -0.02, -0.0), rx: 0.007, rz: 0.007 },
          { c: HO(0.088, -0.01, -0.02), rx: 0.006, rz: 0.006 },
        ],
        o({ reg: 'hard', col: dark, seg: 6, cap1: true })
      );
      break;
    }
    case 'weld': {
      gEll(
        g,
        HO(0, -0.008, -0.004),
        [0.108, 0.14, 0.122],
        o({
          reg: 'hard',
          col: hc,
          th0: -Math.PI / 2 - 1.15,
          th1: -Math.PI / 2 + 1.15,
          phi0: () => 0.42,
          phi1: () => 2.35,
          seg: 18,
          ring: 10,
          thick: 0.01,
        })
      );
      gBox(
        g,
        HO(0, 0.022, -0.123),
        [0.112, 0.06, 0.016],
        0.006,
        o({ reg: 'hard', col: linMul(hc, 0.6) })
      );
      gBox(
        g,
        HO(0, 0.022, -0.131),
        [0.086, 0.036, 0.006],
        0.002,
        o({ reg: 'glass', col: [0.25, 0.4, 0.3], noOcc: true })
      );
      gRing(
        g,
        HO(0, 0.05, 0.01),
        0.086,
        0.102,
        0.024,
        0.008,
        o({ reg: 'gear', col: lin('#2a2420'), n: 20, tilt: 0.02 })
      );
      gStrap(
        g,
        [HO(-0.06, 0.06, 0.0), HO(0, 0.115, 0.01), HO(0.06, 0.06, 0.0)],
        0.024,
        0.008,
        o({ reg: 'gear', col: lin('#2a2420'), ref: [0, 1, 0] })
      );
      for (const s of [-1, 1])
        gLoft(
          g,
          [
            { c: HO(s * 0.1, 0.02, 0.0), rx: 0.02, rz: 0.02 },
            { c: HO(s * 0.118, 0.02, 0.0), rx: 0.018, rz: 0.018 },
          ],
          o({ reg: 'metal', col: metal, seg: 10, ref: [0, 1, 0], cap1: true })
        );
      gLoft(
        g,
        [
          { c: [0, 1.6, 0.01], rx: 0.085, rz: 0.092 },
          { c: [0, 1.53, 0.01], rx: 0.13, rz: 0.12 },
          { c: [0, 1.46, 0.01], rx: 0.19, rz: 0.15 },
        ],
        o({
          reg: 'gear',
          col: lin('#4b3a2a'),
          seg: 18,
          e: 2.2,
          disp: (t, th, p) => 0.005 * Math.sin(th * 7),
          wf: (p) => {
            const a = sst(1.5, 1.6, p[1]);
            return [
              [BN.U, 1 - a],
              [BN.HD, a],
            ];
          },
        })
      );
      break;
    }
  }
  if (L.goggles) {
    const yy = 0.016;
    gLoft(
      g,
      [-1.25, -0.9, -0.5, 0, 0.5, 0.9, 1.25].map((a) => ({
        c: HO(Math.sin(a) * 0.089, yy, -Math.cos(a) * 0.096 + 0.004),
        rx: 0.022,
        rz: 0.009,
        ref: [Math.sin(a), 0, -Math.cos(a)],
      })),
      o({ reg: 'rubber', col: dark, seg: 10, e: 3, cap0: true, cap1: true })
    );
    for (const s of [-1, 1])
      gEll(
        g,
        HO(s * 0.035, yy, -0.104),
        [0.031, 0.019, 0.008],
        o({ reg: 'glass', col: [0.3, 0.38, 0.32], seg: 12, noOcc: true })
      );
    gRing(g, HO(0, yy, 0.01), 0.088, 0.1, 0.016, 0.005, o({ reg: 'rubber', col: dark, n: 20 }));
  }
  if (L.glasses) glasses();
  if (ST.faceBandana)
    gLoft(
      g,
      [
        { c: [0, 1.5, 0.01], rx: 0.075, rz: 0.075 },
        { c: [0, 1.54, 0.004], rx: 0.07, rz: 0.072 },
        { c: [0, 1.575, -0.002], rx: 0.062, rz: 0.066 },
      ],
      o({
        reg: 'gear',
        col: lin('#7e2c22'),
        seg: 16,
        disp: (t, th, p) => 0.005 * Math.sin(th * 5 + p[1] * 80),
        wf: (p) => {
          const a = sst(1.53, 1.6, p[1]);
          return [
            [BN.U, 1 - a],
            [BN.HD, a],
          ];
        },
      })
    );
}

/* ---------- mão com luva fechada num cilindro (empunhadura / guarda-mão) ----------
   c = ponto no eixo do cilindro · A = indicador→mínimo · P = eixo→palma · Q = sentido em que os dedos abraçam */
function gHand(g, o) {
  const s = o.s || 1,
    r = o.r,
    A = v3n(o.A),
    hi = o.hi,
    base = { reg: o.reg || 'rubber', col: o.col, bone: o.bone, seed: o.seed };
  let P = v3n(v3s(o.P, v3k(A, v3d(o.P, A)))),
    Q0 = v3x(A, P);
  const sgn = v3d(Q0, o.Q || Q0) < 0 ? -1 : 1;
  if (o.E) {
    /* gira a mão em volta do eixo para o punho apontar para o cotovelo */ let U = v3s(o.E, o.c);
    U = v3n(v3s(U, v3k(A, v3d(U, A))));
    const sA = v3k(A, sgn),
      ang = o.wa || 1.55;
    P = v3n(v3a(v3k(U, Math.cos(ang)), v3k(v3x(sA, U), Math.sin(ang))));
  }
  const Q = v3k(v3x(A, P), sgn);
  const pt = (al, a, rad) =>
    v3a(v3a(o.c, v3k(A, a)), v3k(v3a(v3k(P, Math.cos(al)), v3k(Q, Math.sin(al))), rad));
  const rad0 = (dir) => v3a(v3k(P, Math.cos(dir)), v3k(Q, Math.sin(dir)));
  const M = Object.assign;
  /* palma + dorso (arco em volta do cilindro) */
  const pal = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6,
      al = -1.45 + t * 2.35;
    pal.push({
      c: pt(al, 0.004 * s, r + 0.016 * s),
      rx: (0.034 + 0.01 * sst(0, 0.6, t)) * s,
      rz: (0.0135 + 0.003 * Math.sin(t * Math.PI)) * s,
      ref: rad0(al),
    });
  }
  gLoft(g, pal, M({}, base, { seg: hi ? 14 : 8, e: 2.6, cap0: true, cap1: true, capD: 0.4 }));
  /* dedos: três falanges com nós salientes */
  const AF = [-0.0315, -0.0105, 0.0105, 0.0315],
    LF = [0.09, 0.097, 0.092, 0.074],
    RF = [0.0098, 0.0101, 0.0096, 0.0085];
  for (let f = 0; f < 4; f++) {
    const a = AF[f] * s,
      len = LF[f] * s,
      rf = RF[f] * s,
      trig = o.trigger && f === 0,
      curl = (o.curl || 1) * (trig ? 0.42 : 1),
      secs = [],
      n = hi ? 10 : 5;
    for (let i = 0; i <= n; i++) {
      const t = i / n,
        rr = r + rf + 0.0015 * s + (1 - t) * 0.006 * s + (trig ? t * 0.012 * s : 0),
        al = 0.8 + ((t * len) / (r + rf + 0.004 * s)) * curl;
      const k =
        rf *
        (1 + 0.13 * gau(t, 0, 0.42, 0, 0.09, 1) + 0.09 * gau(t, 0, 0.76, 0, 0.08, 1)) *
        (1 - 0.22 * t * t);
      secs.push({
        c: pt(al, a + (trig ? -0.004 * s * t : 0), rr),
        rx: k * 1.05,
        rz: k,
        ref: rad0(al),
      });
    }
    gLoft(g, secs, M({}, base, { seg: hi ? 10 : 6, cap1: true, capD: 0.8, seed: 'f' + f }));
    if (hi)
      gEll(
        g,
        pt(0.72, a, r + 0.03 * s),
        [0.011 * s, 0.011 * s, 0.011 * s],
        M({}, base, { seg: 8, noOcc: true })
      );
  }
  /* polegar: eminência tenar + duas falanges no sentido contrário */
  if (o.thumbPath) {
    /* polegar por caminho explícito (pistola: deitado ao longo da armação, apontando para a frente) */
    const tp = o.thumbPath.map((q) => v3a(o.c, q)),
      n = hi ? 8 : 4,
      secs = [];
    gEll(
      g,
      v3m(tp[0], tp[1], 0.25),
      [0.02 * s, 0.02 * s, 0.026 * s],
      M({}, base, {
        bas: [A, v3n(v3s(tp[1], tp[0])), v3x(A, v3n(v3s(tp[1], tp[0])))],
        seg: hi ? 12 : 6,
      })
    );
    for (let i = 0; i <= n; i++) {
      const t = i / n,
        u = 1 - t,
        c = v3a(v3a(v3k(tp[0], u * u), v3k(tp[1], 2 * u * t)), v3k(tp[2], t * t)),
        k = 0.0118 * s * (1 + 0.1 * gau(t, 0, 0.5, 0, 0.1, 1)) * (1 - 0.25 * t * t);
      secs.push({ c, rx: k, rz: k * 0.92 });
    }
    gLoft(
      g,
      secs,
      M({}, base, { seg: hi ? 10 : 6, cap0: true, cap1: true, capD: 0.8, seed: 'th', ref: A })
    );
  } else {
    gEll(
      g,
      pt(-0.55, -0.022 * s, r + 0.02 * s),
      [0.019 * s, 0.03 * s, 0.017 * s],
      M({}, base, { bas: [A, rad0(-0.55), v3x(A, rad0(-0.55))], seg: hi ? 12 : 6 })
    );
    {
      const secs = [],
        n = hi ? 8 : 4;
      for (let i = 0; i <= n; i++) {
        const t = i / n,
          al = -0.5 - t * ((0.075 * s) / (r + 0.013 * s)) * (o.thumbCurl || 1),
          k = 0.0118 * s * (1 + 0.1 * gau(t, 0, 0.5, 0, 0.1, 1)) * (1 - 0.25 * t * t);
        secs.push({
          c: pt(al, (-0.03 - 0.018 * t) * s, r + 0.013 * s + (1 - t) * 0.006 * s),
          rx: k,
          rz: k * 0.92,
          ref: rad0(al),
        });
      }
      gLoft(g, secs, M({}, base, { seg: hi ? 10 : 6, cap1: true, capD: 0.8, seed: 'th' }));
    }
  }
  /* luva tática: placa de nós dos dedos + tira de velcro no punho */
  const kn = pt(0.62, 0, r + 0.034 * s),
    kd = rad0(0.62);
  gBox(
    g,
    kn,
    [0.078 * s, 0.009 * s, 0.026 * s],
    0.004 * s,
    M({}, base, {
      reg: 'hard',
      col: o.armor || linMul(o.col, 0.7),
      bas: [A, kd, v3x(A, kd)],
      lo: !hi,
    })
  );
  if (hi) {
    for (let f = 0; f < 4; f++) {
      const kp = pt(0.98, AF[f] * s, r + 0.026 * s),
        kq = rad0(0.98);
      gBox(
        g,
        kp,
        [0.016 * s, 0.007 * s, 0.018 * s],
        0.003 * s,
        M({}, base, { reg: 'hard', col: o.armor || linMul(o.col, 0.7), bas: [A, kq, v3x(A, kq)] })
      );
    }
  }
  const W = pt(-1.55, 0.004 * s, r + 0.03 * s);
  /* punho aponta para o cotovelo (antes ficava preso no plano da empunhadura: o punho da luva virava uma "aleta" quando o antebraço descia ao longo do cabo, como na pistola) */
  let dw = rad0(-1.55);
  if (o.E && hi) {
    const te = v3n(v3s(o.E, W));
    dw = v3n(v3a(v3k(dw, 0.25), v3k(te, 0.75)));
  }
  return { W, dw, up: A };
}
/* braço (manga larga com cotoveleira) do ombro até o punho da luva */
function gArm(g, sh, el, H, o) {
  const s = o.s || 1,
    cu = v3a(H.W, v3k(H.dw, 0.055 * s)),
    cw = v3a(H.W, v3k(H.dw, 0.012 * s)),
    base = { bone: o.bone, seed: o.seed };
  const ru = o.ru || 0.058,
    rf = o.rf || 0.05;
  const M = Object.assign;
  const up = [],
    fo = [];
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    up.push({ c: v3m(sh, el, t), rx: ru * (1 - 0.16 * t), rz: ru * (1 - 0.14 * t) });
  }
  gLoft(
    g,
    up,
    M({}, base, {
      reg: 'camo',
      seg: o.hi ? 16 : 10,
      ref: o.ref || [0, 0, -1],
      disp: (t, th) =>
        0.003 * s * Math.sin(th * 4 + t * 9) + 0.004 * s * Math.sin(t * 30) * sst(0.6, 1, t),
    })
  );
  if (o.band)
    gLoft(
      g,
      [
        { c: v3m(sh, el, 0.36), rx: ru * 1.05, rz: ru * 1.05 },
        { c: v3m(sh, el, 0.47), rx: ru * 1.03, rz: ru * 1.03 },
      ],
      M({}, base, { reg: 'gear', col: o.band, seg: 12, noOcc: true })
    );
  const skinArm = o.rolled;
  for (let i = 0; i <= 6; i++) {
    const t = i / 6,
      c = t < 0.85 ? v3m(el, cu, t / 0.85) : v3m(cu, cw, (t - 0.85) / 0.15);
    fo.push({
      c,
      rx: (skinArm ? 0.04 : rf) * s * (1 - 0.26 * t),
      rz: (skinArm ? 0.036 : rf) * s * (1 - 0.3 * t),
    });
  }
  gLoft(
    g,
    fo,
    M({}, base, {
      reg: skinArm ? 'skin' : 'camo',
      col: skinArm ? o.skin : null,
      seg: o.hi ? 16 : 10,
      ref: o.ref || [0, 0, -1],
      disp: (t, th) => (skinArm ? 0 : 0.0035 * s * Math.sin(th * 3 + t * 14) * (1 - t)),
    })
  );
  if (skinArm)
    gLoft(
      g,
      [
        { c: v3m(el, cu, 0.0), rx: 0.06 * s, rz: 0.06 * s },
        { c: v3m(el, cu, 0.12), rx: 0.058 * s, rz: 0.056 * s },
      ],
      M({}, base, { reg: 'camo', seg: 12, disp: (t, th) => 0.004 * Math.sin(th * 6) })
    );
  /* cotoveleira */
  if (!o.noPad)
    gEll(
      g,
      v3a(el, v3k(v3n(v3s(v3n(v3s(el, sh)), v3n(v3s(cu, el)))), -ru * 0.25)),
      [ru * 0.95, ru * 1.0, ru * 0.95],
      M({}, base, {
        reg: 'hard',
        col: o.pad || lin('#25272a'),
        seg: 12,
        ring: 4,
        phi1: () => 1.05,
        thick: 0.008 * s,
        bas: (() => {
          const ax = v3n(v3s(el, sh)),
            bx = v3n(v3s(cu, el)),
            out = v3n(v3s(ax, bx)),
            z = v3n(v3x(ax, out));
          return [v3n(v3x(out, z)), out, z];
        })(),
      })
    );
  /* punho da luva (cobre a junção manga/mão) */
  gLoft(
    g,
    [
      { c: v3a(cu, v3k(H.dw, 0.012 * s)), rx: 0.043 * s, rz: 0.038 * s },
      { c: cu, rx: 0.042 * s, rz: 0.036 * s },
      { c: cw, rx: 0.034 * s, rz: 0.026 * s },
      { c: v3a(H.W, v3k(H.dw, -0.008 * s)), rx: 0.031 * s, rz: 0.022 * s },
    ],
    M({}, base, {
      reg: o.gauntlet ? 'gear' : 'rubber',
      col: o.gauntlet ? lin('#6b4a2e') : o.glove,
      seg: o.hi ? 14 : 10,
      ref: H.up,
    })
  );
  if (o.gauntlet)
    gLoft(
      g,
      [
        { c: v3a(cu, v3k(H.dw, 0.06 * s)), rx: 0.058 * s, rz: 0.055 * s },
        { c: v3a(cu, v3k(H.dw, -0.005 * s)), rx: 0.05 * s, rz: 0.045 * s },
      ],
      M({}, base, { reg: 'gear', col: lin('#5e4128'), seg: 12 })
    );
}
/* eixos da mão por tipo de apoio */
function handFrames(hold, rh, lh) {
  const gA = v3n([0, -0.95, 0.31]);
  const R = { c: rh, A: gA, P: [1, 0, 0.4], Q: [0, 0, -1], r: 0.024, trigger: true };
  let Lf;
  if (hold === 'pistol') {
    /* duas mãos: polegares paralelos do lado esquerdo da armação, apontando para o alvo; a mão de apoio envolve os dedos da mão da arma */
    R.thumbPath = [
      [-0.012, 0.036, 0.03],
      [-0.03, 0.05, 0.004],
      [-0.026, 0.052, -0.042],
    ];
    R.P = [1, 0, 0.25];
    Lf = {
      c: v3a(rh, [-0.006, -0.006, -0.004]),
      A: gA,
      P: [-1, -0.15, 0.2],
      Q: [0, 0, -1],
      r: 0.04,
      curl: 0.92,
      thumbPath: [
        [-0.044, 0.018, 0.012],
        [-0.046, 0.03, -0.012],
        [-0.036, 0.036, -0.05],
      ],
    };
  } else if (hold === 'vert')
    Lf = { c: v3a(lh, [0, 0.038, 0]), A: [0, -1, 0], P: [-1, 0, 0.25], Q: [0, 0, -1], r: 0.019 };
  else Lf = { c: v3a(lh, [0, 0.036, 0.0]), A: [0, 0, 1], P: [-0.35, -1, 0], Q: [1, 0, 0], r: 0.03 };
  return { R, L: Lf };
}
function chArms(op, wid, rel, gp, w, isVM) {
  const L = op.look,
    ST = chStyle(op),
    g = GB(),
    glove = lin(ST.glove),
    skin = lin(L.skin),
    band = linMul(lin(rel === 'enemy' ? PAL.enemy : PAL.ally), 0.75);
  const rh = [gp.x, gp.y, gp.z],
    lh = [gp.x + w.fore.x - w.grip.x, gp.y + w.fore.y - w.grip.y, gp.z + w.fore.z - w.grip.z],
    F = handFrames(w.hold || 'hand', rh, lh),
    Y = isVM ? 0 : 0.98,
    oy = (p) => [p[0], p[1] + Y, p[2]];
  const R = Object.assign({}, F.R, {
      c: oy(F.R.c),
      col: glove,
      bone: BN.AG,
      hi: isVM,
      s: isVM ? 1.12 : 1,
    }),
    Lh = Object.assign({}, F.L, {
      c: oy(F.L.c),
      col: glove,
      bone: BN.AL,
      hi: isVM,
      s: isVM ? 1.12 : 1,
    });
  const heavy = op.armor >= 3,
    ru = isVM ? 0.06 : heavy ? 0.06 : 0.056,
    rf = isVM ? 0.05 : 0.048;
  const sk0 = lin(L.skin),
    skm = (sk0[0] + sk0[1] + sk0[2]) / 3,
    opt = {
      ru,
      rf,
      skin: sk0.map((v) => (skm + (v - skm) * 0.8) * 0.95),
      glove,
      rolled: ST.rolled,
      gauntlet: ST.gauntlet,
      hi: isVM,
      s: isVM ? 1.12 : 1,
    };
  /* IK de dois ossos: cotovelo a partir do ombro e do punho (polo = para onde o cotovelo aponta) */
  const ik = (s, t, L1, L2, pole) => {
    const d = v3s(t, s),
      D = Math.min(v3l(d), L1 + L2 - 1e-3),
      u = v3n(d),
      a = (L1 * L1 - L2 * L2 + D * D) / (2 * D),
      h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    let pp = v3s(pole, v3k(u, v3d(pole, u)));
    pp = v3n(pp);
    return v3a(v3a(s, v3k(u, a)), v3k(pp, h));
  };
  let HR_, HL;
  if (isVM) {
    /* antebraço com comprimento real (~30 cm) saindo para baixo da tela; o braço segue até fora do quadro */
    R.E = w.hold === 'pistol' ? v3a(R.c, [0.11, -0.25, 0.3]) : [0.12, -0.3, 0.3];
    Lh.E = v3a(Lh.c, w.hold === 'pistol' ? [-0.15, -0.26, 0.28] : [-0.2, -0.3, 0.24]);
    for (let it = 0; it < 2; it++) {
      HR_ = gHand(GB(), R);
      HL = gHand(GB(), Lh);
      R.E = v3a(HR_.W, v3k(v3n(v3s(R.E, HR_.W)), 0.4));
      Lh.E = v3a(HL.W, v3k(v3n(v3s(Lh.E, HL.W)), 0.42));
    }
    HR_ = gHand(g, R);
    HL = gHand(g, Lh);
    gArm(
      g,
      v3a(R.E, v3k(v3n(v3s(R.E, HR_.W)), 0.45)),
      R.E,
      HR_,
      Object.assign({}, opt, { bone: BN.AG, side: 1, ref: [0, 1, 0], noPad: true })
    );
    gArm(
      g,
      v3a(Lh.E, v3k(v3n(v3s(Lh.E, HL.W)), 0.45)),
      Lh.E,
      HL,
      Object.assign({}, opt, { bone: BN.AL, side: -1, ref: [0, 1, 0], noPad: true })
    );
  } else {
    const rs = oy([0.205, 0.43, 0.0]),
      ls = oy([-0.205, 0.43, 0.0]);
    /* 3ª pessoa: mão de apoio mais perto do corpo quando a arma é longa (braço não fica esticado na horizontal) */
    if (w.cls !== 'sg' && w.hold !== 'pistol') {
      const c0 = Lh.c,
        rc = R.c;
      let k = 1;
      for (let i = 0; i < 20 && v3l(v3s(v3m(rc, c0, k), ls)) > 0.5; i++) k -= 0.04;
      const d = v3s(v3m(rc, c0, k), c0);
      Lh.c = v3a(c0, d);
    }
    R.E = ik(rs, R.c, 0.29, 0.31, [0.45, -1, 0.25]);
    Lh.E = ik(ls, Lh.c, 0.29, 0.31, [-0.3, -1, 0.15]);
    for (let it = 0; it < 2; it++) {
      HR_ = gHand(GB(), R);
      HL = gHand(GB(), Lh);
      R.E = ik(rs, HR_.W, 0.29, 0.25, [0.45, -1, 0.25]);
      Lh.E = ik(ls, HL.W, 0.29, 0.25, [-0.3, -1, 0.15]);
    }
    HR_ = gHand(g, R);
    HL = gHand(g, Lh);
    gArm(g, rs, R.E, HR_, Object.assign({}, opt, { bone: BN.AG, side: 1 }));
    gArm(g, ls, Lh.E, HL, Object.assign({}, opt, { bone: BN.AL, side: -1, band }));
  }
  chFinish(g, {});
  return g;
}

/* ---------- operador completo ---------- */
function chGeo(op) {
  const k = 'geo|' + op.id;
  if (CH_CANV[k]) return CH_CANV[k];
  const g = GB();
  chBody(g, op);
  chHead(g, op);
  chFinish(g, { ground: true });
  return (CH_CANV[k] = g);
}
function chSkel(scene, nodes) {
  const sk = new B.Skeleton('sk', 'sk' + (chSkel.n = (chSkel.n || 0) + 1), scene),
    bones = [];
  for (const n of nodes) {
    const pb = bones[nodes.indexOf(n.parent)] || null;
    const m = B.Matrix.Compose(n.scaling, B.Quaternion.FromEulerVector(n.rotation), n.position);
    const b = new B.Bone(n.name + '_b', sk, pb, m, m.clone(), m.clone());
    b.linkTransformNode(n);
    bones.push(b);
  }
  return sk;
}
function chSrc(scene, key, mk, mat) {
  const C = matCache(scene);
  let s = C[key];
  if (!s || s.isDisposed()) {
    s = mk();
    s.material = mat;
    s.setEnabled(false);
    C[key] = s;
  }
  return s;
}
function chBuildProc(scene, op, rel) {
  const root = new B.TransformNode('op', scene);
  const node = (n, par, y, x) => {
    const t = new B.TransformNode(n, scene);
    t.parent = par;
    t.position.set(x || 0, y || 0, 0);
    return t;
  };
  const hips = node('hips', root, 0.95),
    legs = [];
  for (const sx of [-1, 1]) {
    const th = node('th', hips, 0, 0.1 * sx),
      kn = node('kn', th, -0.46);
    legs.push({ th, kn });
  }
  const up = node('up', root, 0.98),
    head = node('head', up, 0.66);
  const rig = node('rig', up, 0.46),
    rigOff = node('rigOff', rig, -0.46);
  const gunSlot = node('slot', rigOff, 0.3);
  gunSlot.position.set(0.1, 0.3, -0.26);
  const armG = node('arms', rigOff, 0),
    armL = node('armL', rigOff, 0);
  const skel = chSkel(scene, [
    hips,
    legs[0].th,
    legs[0].kn,
    legs[1].th,
    legs[1].kn,
    up,
    head,
    rig,
    rigOff,
    armG,
    armL,
  ]);
  const mat = opMat(scene, op),
    src = chSrc(scene, 'chsrc|' + op.id, () => chMesh(scene, chGeo(op), 'torso', true), mat);
  const body = src.clone('torso', root);
  body.setEnabled(true);
  body.skeleton = skel;
  body.isPickable = false;
  return {
    root,
    up,
    hips,
    head,
    legs,
    rig,
    gunSlot,
    armG,
    armL,
    uni: mat,
    band: null,
    body,
    skel,
    wid: null,
    sid: null,
    walk: 0,
    deathT: 0,
    op,
    rel,
    scene,
    disp: null,
    dyaw: 0,
    legYaw: 0,
    sprintK: 0,
    reloadK: 0,
    adsK: 0,
    turnPh: 0,
    lastYaw: 0,
    fall: null,
    proc: true,
  };
}
/* compatibilidade: o material antigo do uniforme agora é o atlas do operador */
function uniformMat(scene, op) {
  return opMat(scene, op);
}
/* só o corpo projeta sombra (braços/arma pequenos não fazem diferença e custam desenho) */
const CASTS = new Set(['thigh', 'torso']);
function chSetWeaponProc(ch, wid, sid) {
  if (ch.wid === wid && ch.sid === sid) return;
  ch.wid = wid;
  ch.sid = sid;
  const scene = ch.scene;
  for (const c of ch.gunSlot.getChildren()) c.dispose();
  if (ch.armMesh) {
    ch.armMesh.dispose();
    ch.armMesh = null;
  }
  if (ch.weapon && ch.weapon.g.parent !== ch.gunSlot) ch.weapon.g.dispose();
  ch.drop = null; /* arma que tinha caído no chão */
  /* boneco procedural (sem o modelo do operador): a arma é sempre a procedural */
  const w = buildWeapon(scene, wid, sid, true);
  /* no jogo os bonecos usam o acabamento de fábrica (uma textura por arma, em vez de uma por skin) */ w.g.parent =
    ch.gunSlot;
  w.g.position.set(-w.grip.x, -w.grip.y, -w.grip.z);
  ch.weapon = w;
  /* em 3ª pessoa o carregador/telha não animam: funde tudo numa malha só, uma submalha por material (menos chamadas de desenho) */
  {
    const under = (m, n) => {
      for (let p = m.parent; p; p = p.parent) if (p === n) return true;
      return false;
    };
    const parts = w.g
      .getChildMeshes()
      .filter((m) => !(w.mag && under(m, w.mag)) && !(w.pump && under(m, w.pump)));
    if (parts.length > 1) {
      const mm = chMergeByMat(scene, parts, w.g);
      if (mm) {
        mm.parent = w.g;
        for (const p of parts) p.dispose();
      }
    }
  }
  /* braços + mãos (malha com pele ligada ao mesmo esqueleto: 1 chamada de desenho) */
  const gp = ch.gunSlot.position,
    ak = armKey(w),
    key = 'charm|' + ch.op.id + '|' + ak + '|' + ch.rel;
  const src = chSrc(
    scene,
    key,
    () => {
      const kg = 'arm|' + ch.op.id + '|' + ak + '|' + ch.rel;
      const g = CH_CANV[kg] || (CH_CANV[kg] = chArms(ch.op, wid, ch.rel, gp, w, false));
      return chMesh(scene, g, 'arms', true);
    },
    ch.uni
  );
  const am = src.clone('arms', ch.root);
  am.setEnabled(true);
  am.skeleton = ch.skel;
  am.isPickable = false;
  ch.armMesh = am;
  if (shadowGen && scene === game)
    for (const m of ch.root.getChildMeshes()) {
      m.receiveShadows = true;
    }
}
/* funde malhas (inclusive as que já têm várias submalhas) agrupando por material */
function chMergeByMat(scene, parts, ref) {
  ref.computeWorldMatrix(true);
  const inv = ref.getWorldMatrix().clone().invert(),
    G = new Map();
  for (const m of parts) {
    if (!m.getTotalVertices()) continue;
    m.computeWorldMatrix(true);
    const M = m.getWorldMatrix().multiply(inv),
      P = m.getVerticesData('position'),
      N = m.getVerticesData('normal'),
      U = m.getVerticesData('uv'),
      C = m.getVerticesData('color'),
      I = m.getIndices();
    const mats = m.material && m.material.subMaterials ? m.material.subMaterials : null;
    for (const sm of m.subMeshes) {
      const mat = mats ? mats[sm.materialIndex] : m.material;
      if (!mat) continue;
      let b = G.get(mat);
      if (!b) G.set(mat, (b = { P: [], N: [], U: [], C: [], I: [] }));
      const map = new Map();
      for (let t = sm.indexStart; t < sm.indexStart + sm.indexCount; t++) {
        const v = I[t];
        let j = map.get(v);
        if (j == null) {
          j = b.P.length / 3;
          map.set(v, j);
          const p = B.Vector3.TransformCoordinates(
              new B.Vector3(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]),
              M
            ),
            n = N
              ? B.Vector3.TransformNormal(
                  new B.Vector3(N[v * 3], N[v * 3 + 1], N[v * 3 + 2]),
                  M
                ).normalize()
              : new B.Vector3(0, 1, 0);
          b.P.push(p.x, p.y, p.z);
          b.N.push(n.x, n.y, n.z);
          b.U.push(U ? U[v * 2] : 0, U ? U[v * 2 + 1] : 0);
          if (C) b.C.push(C[v * 4], C[v * 4 + 1], C[v * 4 + 2], C[v * 4 + 3]);
          else b.C.push(1, 1, 1, 1);
        }
        b.I.push(j);
      }
    }
  }
  if (!G.size) return null;
  const P = [],
    N = [],
    U = [],
    C = [],
    I = [],
    ranges = [],
    mats = [];
  for (const [mat, b] of G) {
    const v0 = P.length / 3,
      i0 = I.length;
    P.push(...b.P);
    N.push(...b.N);
    U.push(...b.U);
    C.push(...b.C);
    for (const x of b.I) I.push(x + v0);
    ranges.push([v0, b.P.length / 3, i0, b.I.length]);
    mats.push(mat);
  }
  const m = new B.Mesh('gun3p', scene),
    vd = new B.VertexData();
  vd.positions = P;
  vd.normals = N;
  vd.uvs = U;
  vd.colors = C;
  vd.indices = I;
  vd.applyToMesh(m, false);
  const mm = new B.MultiMaterial('gm3p', scene);
  mm.subMaterials = mats;
  m.material = mm;
  m.subMeshes = [];
  ranges.forEach((r, k) => new B.SubMesh(k, r[0], r[1], r[2], r[3], m));
  m.isPickable = false;
  return m;
}
/* braços dependem só de onde as mãos pegam a arma */
function armKey(w) {
  return (
    wBase(w.id || '') +
    ':' +
    w.hold +
    ':' +
    w.fore.x.toFixed(3) +
    ',' +
    w.fore.y.toFixed(3) +
    ',' +
    w.fore.z.toFixed(3) +
    ':' +
    w.grip.y.toFixed(3) +
    ',' +
    w.grip.z.toFixed(3)
  );
}
/* ---------- arma + braços em 1ª pessoa (viewmodel) ---------- */
/* a arma foi ajustada com FOV 80: o tamanho/posição na tela fica o mesmo em qualquer FOV (como no Siege, onde a arma não muda com o slider) */
function vmFovK() {
  return Math.tan((SAVE.fov * Math.PI) / 360) / Math.tan((40 * Math.PI) / 180);
}
function vmWantKey() {
  const a = player,
    wid = curW(a).id,
    sid = SAVE.skins[wBase(wid)] || 'padrao';
  return wid + '|' + sid + '|' + a.op.id + '|' + SAVE.hand + '|' + SAVE.vmSize;
}
function buildVM() {
  const a = player,
    wid = curW(a).id,
    sid = SAVE.skins[wBase(wid)] || 'padrao',
    key = vmWantKey();
  if (key === VM.key) return;
  if (!VM.key.startsWith(wid + '|')) VM.drawT = 1;
  VM.key = key;
  fpvDetach();
  for (const c of vmInner.getChildren()) if (!c.__keep) c.dispose();
  const w = buildWeapon(game, wid, sid);
  VM.info = w;
  const fl = B.MeshBuilder.CreateSphere('vf', { diameter: 0.09, segments: 8 }, game);
  fl.material = unlit(game, '#ffd27a', 0);
  fl.parent = w.g;
  fl.position.set(w.tip.x, w.tip.y, w.tip.z);
  w.flash = fl;
  /* 1ª opção: mãos reais esqueletadas (12d-fpv.js) · reserva: braços procedurais */
  if (FPV.ready && fpvAttach(w, wid, a.op)) {
    VM.fp = true;
    VM.arms = null;
  } else {
    VM.fp = false;
    w.g.parent = vmInner;
    w.g.position.set(-w.grip.x, -w.grip.y, -w.grip.z);
    const R = new B.TransformNode('R', game),
      L = new B.TransformNode('L', game);
    R.parent = vmInner;
    L.parent = vmInner;
    /* braços de 1ª pessoa: mesma modelagem dos operadores, com mais detalhe (dedos com nós, placa da luva, punho, manga larga) */
    const kg = 'v3m|' + a.op.id + '|' + armKey(w),
      g =
        CH_CANV[kg] ||
        (CH_CANV[kg] = chArms(
          a.op,
          wid,
          a.team === player.team ? 'ally' : 'ally',
          { x: 0, y: 0, z: 0 },
          w,
          true
        ));
    const mat = opMat(game, a.op),
      all = chMesh(game, g, 'vmArms', false);
    all.material = mat;
    /* separa braço direito e esquerdo (o esquerdo anima na recarga/telha) pelo osso de cada vértice */
    const split = (bone, node, name) => {
      const P = [],
        N = [],
        UV = [],
        CO = [],
        I = [],
        map = new Map();
      for (let t = 0; t < g.I.length; t += 3) {
        const v = g.I[t];
        if (g.J[v * 4] !== bone) continue;
        for (let k = 0; k < 3; k++) {
          const i = g.I[t + k];
          let j = map.get(i);
          if (j == null) {
            j = P.length / 3;
            map.set(i, j);
            P.push(g.P[i * 3], g.P[i * 3 + 1], g.P[i * 3 + 2]);
            N.push(g.N[i * 3], g.N[i * 3 + 1], g.N[i * 3 + 2]);
            UV.push(g.UV[i * 2], g.UV[i * 2 + 1]);
            CO.push(g.CO[i * 4], g.CO[i * 4 + 1], g.CO[i * 4 + 2], 1);
          }
          I.push(j);
        }
      }
      const m = new B.Mesh(name, game),
        v = new B.VertexData();
      v.positions = P;
      v.normals = N;
      v.uvs = UV;
      v.colors = CO;
      v.indices = I;
      v.applyToMesh(m, false);
      m.material = mat;
      m.parent = node;
      m.isPickable = false;
      return m;
    };
    split(BN.AG, R, 'armR');
    split(BN.AL, L, 'armL');
    all.dispose();
    VM.arms = { R, L, lHome: L.position.clone() };
  }
  {
    const s =
      vmPose(w).s * (SAVE.vmSize || 1) * vmFovK() * ((WEAPONS[curW(player).id] || {}).vs || 1);
    vmRoot.scaling.set(SAVE.hand === 'left' ? -s : s, s, s);
  }
  vmMeshes(vmRoot);
}

/* =====================================================================
   OPERADORES COM ESQUELETO (personagem Mixamo "SWAT" + clipes Mixamo)
   assets/op_swat.bin  malha + pele (glb, sem texturas)  · assets/op_anim.bin  clipes (pacote próprio)
   assets/op_body.jpg / op_bodym.jpg / op_bodyn.jpg / op_headc.jpg / op_headn.jpg  texturas
   Um AssetContainer por cena; cada operador é uma instância (geometria compartilhada, esqueleto próprio).
   Variedade: uniforme tingido por operador (ataque = tons de terra, defesa = urbano escuro), rosto
   (pele, barba, balaclava, pintura), equipamento (capacete/boné/chapéu, mochila, ombreiras…) numa malha
   com pele ligada ao mesmo esqueleto (1 chamada de desenho).
   ===================================================================== */
const OPQ = {
  mul(o, oi, a, ai, b, bi) {
    const ax = a[ai],
      ay = a[ai + 1],
      az = a[ai + 2],
      aw = a[ai + 3],
      bx = b[bi],
      by = b[bi + 1],
      bz = b[bi + 2],
      bw = b[bi + 3];
    o[oi] = aw * bx + ax * bw + ay * bz - az * by;
    o[oi + 1] = aw * by - ax * bz + ay * bw + az * bx;
    o[oi + 2] = aw * bz + ax * by - ay * bx + az * bw;
    o[oi + 3] = aw * bw - ax * bx - ay * by - az * bz;
  },
  imul(o, oi, a, ai, b, bi) {
    const ax = -a[ai],
      ay = -a[ai + 1],
      az = -a[ai + 2],
      aw = a[ai + 3],
      bx = b[bi],
      by = b[bi + 1],
      bz = b[bi + 2],
      bw = b[bi + 3];
    o[oi] = aw * bx + ax * bw + ay * bz - az * by;
    o[oi + 1] = aw * by - ax * bz + ay * bw + az * bx;
    o[oi + 2] = aw * bz + ax * by - ay * bx + az * bw;
    o[oi + 3] = aw * bw - ax * bx - ay * by - az * bz;
  },
  rot(o, oi, q, qi, x, y, z) {
    const qx = q[qi],
      qy = q[qi + 1],
      qz = q[qi + 2],
      qw = q[qi + 3],
      tx = 2 * (qy * z - qz * y),
      ty = 2 * (qz * x - qx * z),
      tz = 2 * (qx * y - qy * x);
    o[oi] = x + qw * tx + qy * tz - qz * ty;
    o[oi + 1] = y + qw * ty + qz * tx - qx * tz;
    o[oi + 2] = z + qw * tz + qx * ty - qy * tx;
  },
  irot(o, oi, q, qi, x, y, z) {
    const qx = -q[qi],
      qy = -q[qi + 1],
      qz = -q[qi + 2],
      qw = q[qi + 3],
      tx = 2 * (qy * z - qz * y),
      ty = 2 * (qz * x - qx * z),
      tz = 2 * (qx * y - qy * x);
    o[oi] = x + qw * tx + qy * tz - qz * ty;
    o[oi + 1] = y + qw * ty + qz * tx - qx * tz;
    o[oi + 2] = z + qw * tz + qx * ty - qy * tx;
  },
  axis(o, oi, x, y, z, a) {
    const s = Math.sin(a / 2),
      l = Math.hypot(x, y, z) || 1;
    o[oi] = (x / l) * s;
    o[oi + 1] = (y / l) * s;
    o[oi + 2] = (z / l) * s;
    o[oi + 3] = Math.cos(a / 2);
  },
  fromTo(o, oi, ux, uy, uz, vx, vy, vz) {
    const lu = Math.hypot(ux, uy, uz) || 1,
      lv = Math.hypot(vx, vy, vz) || 1;
    ux /= lu;
    uy /= lu;
    uz /= lu;
    vx /= lv;
    vy /= lv;
    vz /= lv;
    const d = ux * vx + uy * vy + uz * vz;
    let x = uy * vz - uz * vy,
      y = uz * vx - ux * vz,
      z = ux * vy - uy * vx,
      w = 1 + d;
    if (w < 1e-6) {
      x = 0;
      y = 1;
      z = 0;
      w = 0;
    }
    const l = Math.hypot(x, y, z, w);
    o[oi] = x / l;
    o[oi + 1] = y / l;
    o[oi + 2] = z / l;
    o[oi + 3] = w / l;
  },
  /* escala o ângulo do giro por k */
  scale(q, qi, k) {
    if (q[qi + 3] < 0) {
      q[qi] = -q[qi];
      q[qi + 1] = -q[qi + 1];
      q[qi + 2] = -q[qi + 2];
      q[qi + 3] = -q[qi + 3];
    }
    const w = Math.min(1, q[qi + 3]),
      a = Math.acos(w) * 2,
      s = Math.sin(a / 2);
    if (s < 1e-6) return;
    const ns = Math.sin((a * k) / 2) / s;
    q[qi] *= ns;
    q[qi + 1] *= ns;
    q[qi + 2] *= ns;
    q[qi + 3] = Math.cos((a * k) / 2);
  },
  /* q[qi] ← nlerp(q[qi], b[bi], k) */
  lerp(q, qi, b, bi, k) {
    let s =
      q[qi] * b[bi] + q[qi + 1] * b[bi + 1] + q[qi + 2] * b[bi + 2] + q[qi + 3] * b[bi + 3] < 0
        ? -1
        : 1;
    for (let e = 0; e < 4; e++) q[qi + e] += (b[bi + e] * s - q[qi + e]) * k;
    const l = Math.hypot(q[qi], q[qi + 1], q[qi + 2], q[qi + 3]) || 1;
    for (let e = 0; e < 4; e++) q[qi + e] /= l;
  },
};
function opParsePack(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength),
    jl = dv.getUint32(0, true);
  const J = JSON.parse(new TextDecoder().decode(u8.subarray(4, 4 + jl))),
    o0 = 4 + jl + ((4 + jl) % 2),
    n16 = (u8.byteLength - o0) >> 1;
  const I = new Int16Array(u8.buffer.slice(u8.byteOffset + o0, u8.byteOffset + o0 + n16 * 2)),
    F = new Float32Array(I.length);
  for (let i = 0; i < I.length; i++) F[i] = I[i] / 32767;
  const clips = {};
  for (const c of J.clips) {
    c.dur = (c.n - 1) / c.fps;
    c.spd = Math.hypot(c.v[0], c.v[1]);
    c.pos = c.p == null ? null : Float32Array.from(I.subarray(c.p, c.p + c.n * 3), (v) => v / 4096);
    clips[c.k] = c;
  }
  return { bones: J.bones, clips, F };
}
function opRig(pack, find) {
  const nb = pack.bones.length,
    tn = [],
    par = new Int16Array(nb),
    T = new Float32Array(nb * 3),
    Q0 = new Float32Array(nb * 4);
  pack.bones.forEach((n) => tn.push(find(n) || null));
  pack.bones.forEach((n, j) => {
    const t = tn[j];
    par[j] = t && t.parent ? tn.indexOf(t.parent) : -1;
    const p = t ? t.position : { x: 0, y: 0, z: 0 },
      q = (t && t.rotationQuaternion) || { x: 0, y: 0, z: 0, w: 1 };
    T.set([p.x, p.y, p.z], j * 3);
    Q0.set([q.x, q.y, q.z, q.w], j * 4);
  });
  const idx = {};
  pack.bones.forEach((n, j) => (idx[n.replace('mixamorig:', '')] = j));
  /* espelho esquerda↔direita (morte vinda da esquerda = clipe da direita espelhado) */
  const mir = new Int16Array(nb);
  pack.bones.forEach((n, j) => {
    const m = n.includes('Left')
      ? n.replace('Left', 'Right')
      : n.includes('Right')
        ? n.replace('Right', 'Left')
        : n;
    mir[j] = Math.max(0, pack.bones.indexOf(m));
  });
  return { nb, tn, par, T, Q0, idx, mir, pack };
}
function opPose(rig) {
  const nb = rig.nb;
  return {
    Q: new Float32Array(nb * 4),
    P: new Float32Array(3),
    G: new Float32Array(nb * 4),
    W: new Float32Array(nb * 3),
    wsum: 0,
  };
}
function opClear(po) {
  po.Q.fill(0);
  po.P.fill(0);
  po.wsum = 0;
}
/* soma o clipe c no instante t (s) com peso w · loop: tira o avanço linear do quadril (anda no lugar) · mir: espelhado */
function opAdd(rig, po, c, t, loop, w, mir) {
  if (!c || w <= 1e-4) return;
  const F = rig.pack.F,
    Q = po.Q,
    R = rig.Q0,
    nb = rig.nb;
  let f = t * c.fps;
  const per = c.n - 1;
  if (loop) {
    f = ((f % per) + per) % per;
  } else f = Math.min(Math.max(f, 0), per - 1e-4);
  const i0 = f | 0,
    u = f - i0,
    i1 = Math.min(i0 + 1, per);
  for (let j = 0; j < nb; j++) {
    const src = mir ? rig.mir[j] : j,
      e = c.b[src],
      k = j * 4;
    let x, y, z, ww;
    if (e === -1) {
      const r = src * 4;
      x = R[r];
      y = R[r + 1];
      z = R[r + 2];
      ww = R[r + 3];
    } else if (e[1] === 1) {
      const o = e[0];
      x = F[o];
      y = F[o + 1];
      z = F[o + 2];
      ww = F[o + 3];
    } else {
      const a = e[0] + i0 * 4,
        b = e[0] + i1 * 4;
      x = F[a] + (F[b] - F[a]) * u;
      y = F[a + 1] + (F[b + 1] - F[a + 1]) * u;
      z = F[a + 2] + (F[b + 2] - F[a + 2]) * u;
      ww = F[a + 3] + (F[b + 3] - F[a + 3]) * u;
    }
    if (mir) {
      y = -y;
      z = -z;
    }
    if (x * R[k] + y * R[k + 1] + z * R[k + 2] + ww * R[k + 3] < 0) {
      x = -x;
      y = -y;
      z = -z;
      ww = -ww;
    }
    Q[k] += x * w;
    Q[k + 1] += y * w;
    Q[k + 2] += z * w;
    Q[k + 3] += ww * w;
  }
  if (c.pos) {
    const p = c.pos,
      a = i0 * 3,
      b = i1 * 3,
      tt = f / c.fps;
    let px = p[a] + (p[b] - p[a]) * u,
      py = p[a + 1] + (p[b + 1] - p[a + 1]) * u,
      pz = p[a + 2] + (p[b + 2] - p[a + 2]) * u;
    if (loop) {
      px -= c.v[0] * tt + c.p0[0];
      pz -= c.v[1] * tt + c.p0[2];
    }
    if (mir) px = -px;
    po.P[0] += px * w;
    po.P[1] += py * w;
    po.P[2] += pz * w;
    po.wsum += w;
  }
}
function opNorm(rig, po) {
  const Q = po.Q;
  for (let k = 0; k < Q.length; k += 4) {
    const l = Math.hypot(Q[k], Q[k + 1], Q[k + 2], Q[k + 3]);
    if (l < 1e-8) {
      Q.set(rig.Q0.subarray(k, k + 4), k);
      continue;
    }
    Q[k] /= l;
    Q[k + 1] /= l;
    Q[k + 2] /= l;
    Q[k + 3] /= l;
  }
  if (po.wsum > 0) {
    po.P[0] /= po.wsum;
    po.P[1] /= po.wsum;
    po.P[2] /= po.wsum;
  } else po.P.set(rig.T.subarray(0, 3));
}
/* cinemática direta no espaço do modelo (a partir do osso 'from') */
function opFK(rig, po, from) {
  const { par, T, nb } = rig,
    Q = po.Q,
    G = po.G,
    W = po.W;
  for (let j = from || 0; j < nb; j++) {
    const p = par[j],
      k = j * 4,
      v = j * 3;
    if (p < 0) {
      G[k] = Q[k];
      G[k + 1] = Q[k + 1];
      G[k + 2] = Q[k + 2];
      G[k + 3] = Q[k + 3];
      const s = j === 0 ? po.P : T.subarray(v, v + 3);
      W[v] = s[0];
      W[v + 1] = s[1];
      W[v + 2] = s[2];
      continue;
    }
    OPQ.mul(G, k, G, p * 4, Q, k);
    OPQ.rot(W, v, G, p * 4, T[v], T[v + 1], T[v + 2]);
    W[v] += W[p * 3];
    W[v + 1] += W[p * 3 + 1];
    W[v + 2] += W[p * 3 + 2];
  }
}
const _oq = new Float32Array(16),
  _ov = new Float32Array(12);
/* aplica a rotação r (espaço do modelo) ao osso j: G' = r ⊗ G (o pai já deve estar em dia em po.G) */
function opRotGlobal(rig, po, j, r, ri) {
  const k = j * 4,
    p = rig.par[j];
  OPQ.mul(_oq, 0, r, ri, po.G, k);
  if (p < 0) po.Q.set(_oq.subarray(0, 4), k);
  else OPQ.imul(po.Q, k, po.G, p * 4, _oq, 0);
  po.G.set(_oq.subarray(0, 4), k);
}
function opSetGlobal(rig, po, j, g, gi) {
  const k = j * 4,
    p = rig.par[j];
  if (p < 0) po.Q.set(g.subarray(gi, gi + 4), k);
  else OPQ.imul(po.Q, k, po.G, p * 4, g, gi);
  po.G.set(g.subarray(gi, gi + 4), k);
}
function opWrite(rig, po) {
  const Q = po.Q;
  for (let j = 0; j < rig.nb; j++) {
    const t = rig.tn[j];
    if (!t) continue;
    const k = j * 4;
    t.rotationQuaternion.set(Q[k], Q[k + 1], Q[k + 2], Q[k + 3]);
  }
  const h = rig.tn[0];
  if (h) h.position.set(po.P[0], po.P[1], po.P[2]);
}

/* ---------- carga (assíncrona) ---------- */
const OPM = { pack: undefined, cont: new Map(), img: null, ref: null, tex: [], ok: false };
window.__pcOPM = OPM; /* alça de depuração (testes) */
function opmPack() {
  if (OPM.pack !== undefined) return OPM.pack;
  OPM.pack = null;
  try {
    if (typeof ASSET_FILE !== 'undefined' && ASSET_FILE['op_anim.bin'] && ASSET_FILE['op_swat.bin'])
      OPM.pack = opParsePack(
        Uint8Array.from(atob(ASSET_FILE['op_anim.bin']), (c) => c.charCodeAt(0))
      );
  } catch (e) {
    OPM.pack = null;
  }
  return OPM.pack;
}
/* imagens: decodificam sozinhas; as texturas já criadas são repintadas quando chegam */
(function () {
  if (typeof ASSET_FILE === 'undefined' || !ASSET_FILE['op_body.jpg']) return;
  OPM.img = {};
  let n = 0;
  const L = ['op_body.jpg', 'op_bodym.jpg', 'op_bodyn.jpg', 'op_headc.jpg', 'op_headn.jpg'];
  for (const f of L) {
    const im = new Image();
    im.onload = () => {
      OPM.img[f] = im;
      if (++n === L.length) {
        OPM.ok = true;
        for (const t of OPM.tex) t.paint();
      }
    };
    im.src = 'data:image/jpeg;base64,' + ASSET_FILE[f];
  }
})();
function opmLoad(scene) {
  let e = OPM.cont.get(scene);
  if (e) return e;
  e = { ready: false, fail: false, c: null };
  OPM.cont.set(scene, e);
  if (!opmPack() || !B.SceneLoader) {
    e.fail = true;
    return e;
  }
  try {
    B.SceneLoader.LoadAssetContainerAsync(
      '',
      Uint8Array.from(atob(ASSET_FILE['op_swat.bin']), (c) => c.charCodeAt(0)),
      scene,
      null,
      '.glb'
    )
      .then((c) => {
        e.c = c;
        e.ready = true;
        for (const m of c.meshes) m.isPickable = false;
      })
      .catch(() => {
        e.fail = true;
      });
  } catch (err) {
    e.fail = true;
  }
  return e;
}
if (typeof game !== 'undefined') opmLoad(game);

/* ---------- texturas por operador ---------- */
/* paletas do uniforme: ATAQUE em tons de terra/oliva claros, DEFESA em urbano escuro (azul-marinho, grafite, preto) */
const OP_PAL = {
  brecha: { pat: 'digital', cols: ['#7b7a68', '#5d5d4e', '#9a977f', '#454538'] },
  estilhaco: { pat: 'camo', cols: ['#8a7a5a', '#6b5d40', '#a6966f', '#4c4330'] },
  olho: { pat: 'camo', cols: ['#b49a6c', '#927a50', '#cdb88e', '#6d5a3b'] },
  macarico: { pat: null, cols: ['#6d5a40'] },
  muralha: { pat: 'digital', cols: ['#2c3446', '#222838', '#3a4458', '#181c27'] },
  faisca: { pat: null, cols: ['#2e3036'] },
  arame: { pat: 'camo', cols: ['#3a4232', '#2b3125', '#4a5340', '#1e221a'] },
  bunker: { pat: 'digital', cols: ['#4a4e55', '#3a3d43', '#5d6168', '#2b2d31'] },
};
/* 2ª versão (quando dois bots do mesmo time usam o mesmo operador): outro tom e outro chapéu */
const OP_ALT = {
  brecha: 'cap',
  estilhaco: 'helmet',
  olho: 'helmet',
  macarico: 'helmet',
  muralha: 'balaclava',
  faisca: 'cap',
  arame: 'helmet',
  bunker: 'balaclava',
};
const OP_HEADS = ['helmet', 'cap', 'balaclava', 'helmet'],
  OP_SKINS = ['', '#c99a74', '#a9765a', '#e0b99a', '#6e4529', '#8d5a3b'];
function opHeadOf(op, vari) {
  if (!vari) return op.look.head;
  const a = OP_ALT[op.id] || op.look.head;
  if (vari === 1) return a;
  const h = OP_HEADS[(hashStr(op.id) + vari) % 4];
  return h === op.look.head && vari > 1 && h !== 'helmet' ? 'helmet' : h;
}
function opSkinOf(op, vari) {
  if (!vari) return op.look.skin;
  if (vari === 1) return op.look.skin === '#8d5a3b' ? '#c99a74' : '#a9765a';
  return OP_SKINS[1 + (hashStr(op.id + 's' + vari) % 5)];
}
function opScaleOf(op, vari) {
  return 1 + ((hashStr(op.id + 'k' + vari) % 13) - 6) / 100;
} /* +-6% */
function opPal(op, vari) {
  const P = OP_PAL[op.id] || { pat: op.look.pat, cols: op.look.cols };
  if (!vari) return P;
  const k = 0.82 + 0.06 * ((vari % 3) - 1) * (vari > 1 ? 1 : 0),
    rot = vari > 1 ? (vari === 2 ? [1.06, 1, 0.92] : [0.92, 1.04, 1.08]) : [1, 1, 1];
  return {
    pat:
      vari > 1
        ? P.pat
          ? vari === 2
            ? P.pat
            : P.pat === 'digital'
              ? 'camo'
              : 'digital'
          : null
        : P.pat === 'digital'
          ? 'camo'
          : P.pat
            ? 'digital'
            : null,
    cols: P.cols.map((h) => {
      const c = C3(h).scale(k);
      c.r = Math.min(1, c.r * rot[0]);
      c.g = Math.min(1, c.g * rot[1]);
      c.b = Math.min(1, c.b * rot[2]);
      return c.toHexString();
    }),
  };
}
function opTexture(scene, key, size, paint, linear) {
  const C = matCache(scene);
  if (C[key]) return C[key];
  const t = new B.DynamicTexture(key, { width: size, height: size }, scene, true);
  t.wrapU = t.wrapV = B.Texture.CLAMP_ADDRESSMODE;
  t.anisotropicFilteringLevel = 4;
  if (linear) t.gammaSpace = false;
  t.paint = () => {
    if (t.isDisposed && t.isDisposed()) return;
    const c = OPM.ok ? paint() : null;
    if (c) {
      t.getContext().drawImage(c, 0, 0, size, size);
    } else {
      const g = t.getContext();
      g.fillStyle = linear ? '#8080ff' : '#56585a';
      g.fillRect(0, 0, size, size);
    }
    t.update(false);
  };
  t.paint();
  OPM.tex.push(t);
  return (C[key] = t);
}
function opPixels(f, S) {
  const c = mkCanvas(S),
    g = c.getContext('2d');
  g.drawImage(OPM.img[f], 0, 0, S, S);
  return { c, g, d: g.getImageData(0, 0, S, S) };
}
/* uniforme: tecido (máscara) recebe a padronagem do operador, mantendo o sombreado/dobras da textura original */
function opBodyCanvas(op, vari) {
  const k = 'opb|' + op.id + '|' + vari;
  if (CH_CANV[k]) return CH_CANV[k];
  const S = 1024,
    A = opPixels('op_body.jpg', S),
    M = opPixels('op_bodym.jpg', 512).d.data,
    D = A.d.data,
    P = opPal(op, vari),
    seed = hashStr(op.id + vari) % 997;
  const cols = P.cols.map((h) => {
    const q = C3(h);
    return [q.r, q.g, q.b];
  });
  /* luminância média do tecido (para normalizar o sombreado) */
  let sl = 0,
    sn = 0;
  for (let y = 0; y < S; y += 4)
    for (let x = 0; x < S; x += 4) {
      const i = (y * S + x) * 4,
        m = M[((y >> 1) * 512 + (x >> 1)) * 4] / 255;
      if (m > 0.6) {
        sl += D[i] * 0.3 + D[i + 1] * 0.59 + D[i + 2] * 0.11;
        sn++;
      }
    }
  const mean = sl / Math.max(1, sn) || 90;
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4,
        m = M[((y >> 1) * 512 + (x >> 1)) * 4] / 255;
      if (m < 0.02) continue;
      let k2 = 0;
      if (P.pat === 'digital') {
        const bx = x >> 2,
          by = y >> 2,
          w = chFbm(bx * 0.035, by * 0.035, seed + 7, 3),
          n1 = chFbm(bx * 0.06 + w * 2.2, by * 0.06, seed, 4),
          n2 = chFbm(bx * 0.11, by * 0.11 + w, seed + 3, 3);
        k2 = n1 < 0.42 ? 3 : n1 < 0.52 ? 1 : n2 > 0.6 ? 2 : 0;
      } else if (P.pat === 'camo') {
        const wx = chFbm(x * 0.006, y * 0.006, seed + 11, 3) * 60,
          n1 = chFbm((x + wx) * 0.0075, (y - wx) * 0.0075, seed, 4),
          n2 = chFbm((x - wx) * 0.011, (y + wx) * 0.011, seed + 5, 4),
          n3 = chFbm(x * 0.02 + wx * 0.01, y * 0.02, seed + 9, 3);
        if (n1 > 0.53) k2 = 1;
        if (n2 > 0.6) k2 = 3;
        if (n3 > 0.66 && n1 < 0.5) k2 = 2;
      }
      const cc = cols[k2] || cols[0],
        l = (D[i] * 0.3 + D[i + 1] * 0.59 + D[i + 2] * 0.11) / mean,
        sh = Math.min(1.22, Math.pow(l, 0.85)) * (0.95 + 0.07 * chHash(x >> 1, y >> 1, seed));
      for (let e = 0; e < 3; e++) {
        const v = cc[e] * 255 * sh;
        D[i + e] = D[i + e] * (1 - m) + Math.min(255, v) * m;
      }
    }
  A.g.putImageData(A.d, 0, 0);
  return (CH_CANV[k] = A.c);
}
/* rosto: tom de pele, barba por fazer, pintura, balaclava ou bandana (região do UV do rosto Mixamo) */
function opHeadCanvas(op, vari, cover) {
  const k = 'oph|' + op.id + '|' + vari + '|' + cover;
  if (CH_CANV[k]) return CH_CANV[k];
  const S = 512,
    A = opPixels('op_headc.jpg', S),
    D = A.d.data,
    ST = chStyle(op),
    seed = hashStr(op.id) % 991;
  const sk = C3(opSkinOf(op, vari)),
    tgt = [sk.r * 255, sk.g * 255, sk.b * 255],
    ref = [196, 150, 128];
  const fab =
    cover === 'balaclava'
      ? C3(op.look.headCol || '#2a2d31')
      : cover === 'bandana'
        ? C3('#7e2c22')
        : null;
  const beard = !fab && (ST.stubble || vari || op.id === 'macarico' || op.id === 'muralha');
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      const eye = y < 56 && x > 95 && x < 215;
      if (eye) continue; /* globos oculares */
      for (let e = 0; e < 3; e++) D[i + e] = Math.min(255, (D[i + e] * tgt[e]) / ref[e]);
      if (beard) {
        const b = gau(x, y, 256, 262, 105, 62) * (1 - gau(x, y, 256, 238, 40, 10)) * 0.62;
        if (b > 0.01) {
          const n = 0.7 + 0.3 * chHash(x, y, seed);
          for (let e = 0; e < 3; e++) D[i + e] *= 1 - b * n * (e === 0 ? 0.62 : 0.6);
        }
      }
      if (ST.facePaint) {
        const st = Math.sin((x - 256) * 0.09 + y * 0.04),
          fr = gau(x, y, 256, 185, 120, 70);
        const k2 = 0.6 * sst(0.3, 0.7, st) * fr;
        for (let e = 0; e < 3; e++) D[i + e] = D[i + e] * (1 - k2) + [64, 74, 48][e] * k2;
      }
      if (fab) {
        /* tecido cobre tudo menos a faixa dos olhos (balaclava) ou abaixo do nariz (bandana) */
        let m = 1;
        if (cover === 'balaclava') m = 1 - gau(x, y, 256, 158, 62, 17);
        else m = sst(206, 222, y) * (y < 420 ? 1 : 0) + (y >= 420 ? 1 : 0) * 0;
        if (cover === 'bandana' && y > 330) m = 0;
        if (m > 0.01) {
          const rib = 0.86 + 0.14 * Math.sin(x * 1.3) * Math.sin(y * 0.9),
            n = 0.9 + 0.1 * chHash(x >> 1, y >> 1, seed);
          const c = [fab.r * 255, fab.g * 255, fab.b * 255];
          for (let e = 0; e < 3; e++) D[i + e] = D[i + e] * (1 - m) + c[e] * rib * n * m;
        }
      }
    }
  A.g.putImageData(A.d, 0, 0);
  return (CH_CANV[k] = A.c);
}
function opNrm(f, S) {
  const k = 'opn|' + f;
  if (CH_CANV[k]) return CH_CANV[k];
  return (CH_CANV[k] = opPixels(f, S).c);
}
function opBodyMat(scene, op, vari) {
  const C = matCache(scene),
    k = 'opBody|' + op.id + '|' + vari;
  if (C[k]) return C[k];
  const m = new B.PBRMaterial('opBody_' + op.id, scene);
  m.albedoTexture = opTexture(scene, 'opbt|' + op.id + '|' + vari, 1024, () =>
    opBodyCanvas(op, vari)
  );
  m.bumpTexture = opTexture(scene, 'opbn', 1024, () => opNrm('op_bodyn.jpg', 1024), true);
  m.bumpTexture.level = 0.9;
  m.metallic = 0;
  m.roughness = 0.86;
  m.environmentIntensity = 0.85;
  m.directIntensity = 1.1;
  m.albedoColor = new B.Color3(1, 1, 1);
  m.specularIntensity = 0.6;
  return (C[k] = m);
}
function opHeadMat(scene, op, vari, cover) {
  const C = matCache(scene),
    k = 'opHead|' + op.id + '|' + vari + '|' + cover;
  if (C[k]) return C[k];
  const m = new B.PBRMaterial('opHead_' + op.id, scene);
  m.albedoTexture = opTexture(scene, 'opht|' + op.id + '|' + vari + '|' + cover, 512, () =>
    opHeadCanvas(op, vari, cover)
  );
  m.bumpTexture = opTexture(scene, 'ophn', 256, () => opNrm('op_headn.jpg', 256), true);
  m.bumpTexture.level = 0.8;
  m.metallic = 0;
  m.roughness = cover ? 0.92 : 0.6;
  m.environmentIntensity = 0.8;
  m.directIntensity = 1.05;
  m.albedoColor = new B.Color3(1, 1, 1);
  return (C[k] = m);
}

/* ---------- referências medidas no esqueleto (uma vez) ---------- */
function opmRef(rig, e) {
  if (OPM.ref) return OPM.ref;
  const R = {},
    X = rig.idx,
    pk = rig.pack;
  const po = opPose(rig);
  po.Q.set(rig.Q0);
  po.P.set(rig.T.subarray(0, 3));
  opFK(rig, po);
  R.G0 = po.G.slice();
  R.W0 = po.W.slice();
  R.footH = po.W[X.LeftFoot * 3 + 1];
  R.toeH = po.W[X.LeftToeBase * 3 + 1];
  R.eye =
    X.RightEye != null
      ? [
          po.W[X.RightEye * 3] - po.W[X.Head * 3],
          po.W[X.RightEye * 3 + 1] - po.W[X.Head * 3 + 1],
          po.W[X.RightEye * 3 + 2] - po.W[X.Head * 3 + 2],
        ]
      : [-0.03, 0.075, 0.085];
  const avg = (W, names) => {
    const s = [0, 0, 0];
    for (const n of names) {
      const j = X[n] * 3;
      s[0] += W[j];
      s[1] += W[j + 1];
      s[2] += W[j + 2];
    }
    return s.map((v) => v / names.length);
  };
  /* encaixe da arma na mão direita e pegada da esquerda, medidos num quadro de referência de cada postura */
  const stance = (clip, tx) => {
    const p = opPose(rig);
    opClear(p);
    opAdd(rig, p, pk.clips[clip], tx, true, 1);
    opNorm(rig, p);
    opFK(rig, p);
    const W = p.W,
      G = p.G,
      S = {};
    const grip = (side) => {
      const K = avg(
          W,
          ['Index1', 'Middle1', 'Ring1', 'Pinky1'].map((n) => side + 'Hand' + n)
        ),
        T = avg(
          W,
          ['Index3', 'Middle3', 'Ring3'].map((n) => side + 'Hand' + n)
        ),
        wr = X[side + 'Hand'] * 3;
      const pd = v3n(v3s(T, K)),
        wv = [W[wr], W[wr + 1], W[wr + 2]];
      return { wrist: wv, palm: v3a(v3a(v3k(K, 0.78), v3k(wv, 0.22)), v3k(pd, 0.022)) };
    };
    const r = grip('Right'),
      l = grip('Left'),
      h = X.RightHand * 4,
      qG = new Float32Array([0, 1, 0, 0]);
    S.rot = new Float32Array(4);
    OPQ.imul(S.rot, 0, G, h, qG, 0); /* giro do encaixe no espaço da mão */
    S.pos = new Float32Array(3);
    OPQ.irot(
      S.pos,
      0,
      G,
      h,
      r.palm[0] - r.wrist[0],
      r.palm[1] - r.wrist[1],
      r.palm[2] - r.wrist[2]
    );
    const toSlot = (v) => {
      const o = new Float32Array(3);
      OPQ.irot(o, 0, qG, 0, v[0] - r.palm[0], v[1] - r.palm[1], v[2] - r.palm[2]);
      return [o[0], o[1], o[2]];
    };
    S.lw = toSlot(l.wrist);
    S.lp = toSlot(l.palm);
    S.lrot = new Float32Array(4);
    OPQ.imul(S.lrot, 0, qG, 0, G, X.LeftHand * 4);
    return S;
  };
  R.rifle = stance('aim', 0);
  R.pistol = stance('p_idle', 0);
  /* cabeça (caixa dos vértices do crânio) e corpo (frente/costas do peito) para encaixar o equipamento */
  const hm = e.c.meshes.find((m) => m.material && m.material.name === 'op_head'),
    bm = e.c.meshes.find((m) => m.material && m.material.name === 'op_body');
  if (!hm || !bm)
    throw new Error(
      'opmRef ' + e.c.meshes.map((m) => m.name + ':' + (m.material && m.material.name)).join(' ')
    );
  const ey = R.W0[X.Head * 3 + 1] + R.eye[1]; /* altura dos olhos no repouso */
  {
    const P = hm.getVerticesData('position'),
      mn = [9, 9, 9],
      mx = [-9, -9, -9];
    for (let i = 0; i < P.length; i += 3) {
      if (P[i + 1] < ey - 0.035) continue;
      for (let e2 = 0; e2 < 3; e2++) {
        mn[e2] = Math.min(mn[e2], P[i + e2]);
        mx[e2] = Math.max(mx[e2], P[i + e2]);
      }
    }
    R.head = {
      c: [(mn[0] + mx[0]) / 2, ey, (mn[2] + mx[2]) / 2],
      h: [(mx[0] - mn[0]) / 2, mx[1] - ey, (mx[2] - mn[2]) / 2],
    };
  }
  {
    const P = bm.getVerticesData('position'),
      sl = (y0) => {
        let f = -9,
          b = 9,
          w = 0;
        for (let i = 0; i < P.length; i += 3) {
          if (Math.abs(P[i + 1] - y0) > 0.03) continue;
          if (Math.abs(P[i]) < 0.1) {
            f = Math.max(f, P[i + 2]);
            b = Math.min(b, P[i + 2]);
          }
          if (Math.abs(P[i + 2]) < 0.08) w = Math.max(w, Math.abs(P[i]));
        }
        return { f, b, w };
      };
    const yc = R.W0[X.Spine2 * 3 + 1];
    R.chest = { y: yc, ...sl(yc) };
    R.belly = { y: yc - 0.2, ...sl(yc - 0.2) };
    R.top = { y: yc + 0.14, ...sl(yc + 0.14) };
  }
  return (OPM.ref = R);
}

/* ---------- equipamento: geometria no espaço do modelo (frente +Z), cada vértice preso a um osso ---------- */
function opGearGeo(op, vari, R, BI) {
  const k = 'opg|' + op.id + '|' + vari;
  if (CH_CANV[k]) return CH_CANV[k];
  const L = Object.assign({}, op.look),
    ST = chStyle(op);
  if (vari) L.head = opHeadOf(op, vari);
  const H = R.head,
    ctr = H.c;
  /* 1) chapéus/máscaras do modelo antigo (frente −Z, cabeça em y=1,64): gerados lá e levados para a cabeça do SWAT */
  const g = GB(),
    head2 = L.head === 'helmet' || L.head === 'balaclava' ? 'none' : L.head;
  headgear2(
    g,
    op,
    Object.assign({}, L, { head: head2 }),
    Object.assign({}, ST, { faceBandana: ST.faceBandana && !vari })
  );
  if ((L.head === 'helmet' || L.head === 'balaclava') && (ST.headset || L.head === 'balaclava')) {
    /* fone por cima do capacete do modelo */
    for (const s of [-1, 1])
      gLoft(
        g,
        [
          { c: HO(s * 0.098, -0.01, 0.006), rx: 0.04, rz: 0.044 },
          { c: HO(s * 0.122, -0.01, 0.006), rx: 0.038, rz: 0.042 },
        ],
        {
          bone: BN.HD,
          reg: 'hard',
          col: lin('#232528'),
          seg: 12,
          ref: [0, 1, 0],
          cap1: true,
          capD: 0.25,
        }
      );
  }
  if (g.P.length) chFinish(g, {});
  const sx = H.h[0] / 0.083,
    sy = H.h[1] / 0.096,
    sz = H.h[2] / 0.104,
    hj = BI.Head != null ? BI.Head : BI.Neck != null ? BI.Neck : BI.Spine2,
    nj = BI.Neck != null ? BI.Neck : BI.Spine2;
  for (let i = 0; i < g.P.length; i += 3) {
    const x = g.P[i],
      y = g.P[i + 1] - HY,
      z = g.P[i + 2];
    g.P[i] = ctr[0] - x * sx;
    g.P[i + 1] = ctr[1] + (y - 0.012) * sy;
    g.P[i + 2] = ctr[2] - 0.004 - z * sz;
    g.N[i] = -g.N[i];
    g.N[i + 2] = -g.N[i + 2];
  }
  for (let i = 0; i < g.J.length; i++)
    g.J[i] = g.J[i] === BN.HD ? hj : g.J[i] === BN.U ? (g.W[i] > 0 ? nj : 0) : 0;
  /* 2) peças novas sobre o corpo do SWAT */
  const b = GB(),
    C = R.chest,
    Bl = R.belly,
    W0 = R.W0,
    X = OPM.rigIdx,
    sp = BI.Spine2,
    dark = lin('#1d1e1f'),
    od = shade(op.look.vest || '#3a3d33', 1.1),
    poly = lin('#26282b');
  const at = (n) => [W0[X[n] * 3], W0[X[n] * 3 + 1], W0[X[n] * 3 + 2]];
  if (L.pack || ST.wirePack) {
    /* mochila de assalto nas costas */
    const z = C.b - 0.065;
    gBox(b, [0, C.y - 0.06, z], [0.29, 0.38, 0.13], 0.04, {
      bone: sp,
      reg: 'gear',
      col: od,
      bulge: 0.01,
    });
    gBox(b, [0, C.y - 0.1, z - 0.07], [0.22, 0.18, 0.04], 0.02, {
      bone: sp,
      reg: 'gear',
      col: linMul(od, 0.85),
    });
    for (const s of [-1, 1])
      gStrap(
        b,
        [
          [s * 0.09, C.y + 0.12, C.b + 0.01],
          [s * 0.1, C.y + 0.2, (C.b + C.f) / 2],
          [s * 0.1, C.y + 0.12, C.f + 0.01],
          [s * 0.09, C.y - 0.08, C.f + 0.015],
        ],
        0.04,
        0.01,
        { bone: sp, reg: 'gear', col: linMul(od, 0.7), ref: [0, 1, 0] }
      );
    if (ST.wirePack)
      gRing(b, [0, C.y - 0.29, z + 0.01], 0.075, 0.06, 0.035, 0.025, {
        bone: sp,
        reg: 'metal',
        col: lin('#55585a'),
        n: 16,
        ref: [0, 1, 0],
      });
  }
  if (ST.radioPack) {
    gBox(b, [0.06, C.y + 0.02, C.b - 0.05], [0.14, 0.2, 0.08], 0.02, {
      bone: sp,
      reg: 'hard',
      col: poly,
    });
    gLoft(
      b,
      [
        { c: [0.1, C.y + 0.1, C.b - 0.05], rx: 0.005, rz: 0.005 },
        { c: [0.12, C.y + 0.42, C.b - 0.07], rx: 0.003, rz: 0.003 },
      ],
      { bone: sp, reg: 'rubber', col: dark, seg: 5, cap1: true, noOcc: true }
    );
  }
  if (ST.tanks) {
    for (const s of [-1, 1])
      gLoft(
        b,
        [
          { c: [s * 0.075, C.y - 0.24, C.b - 0.06], rx: 0.058, rz: 0.058 },
          { c: [s * 0.075, C.y + 0.16, C.b - 0.06], rx: 0.058, rz: 0.058 },
        ],
        {
          bone: sp,
          reg: 'metal',
          col: lin(s < 0 ? '#6b3a22' : '#5d5f5a'),
          seg: 14,
          ref: [0, 0, -1],
          cap0: true,
          cap1: true,
          capD: 0.5,
        }
      );
    gBox(b, [0, C.y - 0.04, C.b - 0.02], [0.22, 0.06, 0.03], 0.01, {
      bone: sp,
      reg: 'gear',
      col: dark,
    });
  }
  if (ST.charges) {
    for (const s of [-1, 1])
      gBox(b, [s * 0.07, Bl.y + 0.02, Bl.f + 0.012], [0.11, 0.075, 0.03], 0.008, {
        bone: BI.Spine1,
        reg: 'gear',
        col: lin('#4a4d3c'),
        bulge: 0.004,
      });
  }
  if (ST.nades) {
    for (let i = 0; i < 3; i++) {
      const x = -0.09 + i * 0.09;
      gLoft(
        b,
        [
          { c: [x, Bl.y - 0.03, C.f + 0.03], rx: 0.024, rz: 0.024 },
          { c: [x, Bl.y + 0.05, C.f + 0.03], rx: 0.024, rz: 0.024 },
        ],
        {
          bone: sp,
          reg: 'hard',
          col: lin('#3b4232'),
          seg: 10,
          ref: [0, 0, 1],
          cap0: true,
          cap1: true,
          capD: 0.6,
        }
      );
    }
  }
  if (ST.pauldron || op.armor >= 3) {
    for (const [side, n] of [
      [1, 'LeftArm'],
      [-1, 'RightArm'],
    ]) {
      const p = at(n);
      gEll(b, [p[0] + side * 0.05, p[1] + 0.02, p[2]], [0.085, 0.06, 0.09], {
        bone: BI[n],
        reg: 'hard',
        col: linMul(lin(op.look.vest || '#333'), 0.9),
        phi1: () => 1.35,
        seg: 14,
        ring: 5,
        thick: 0.012,
      });
    }
    gLoft(
      b,
      [
        { c: [0, C.y + 0.2, (C.f + C.b) / 2], rx: 0.13, rz: 0.12 },
        { c: [0, C.y + 0.26, (C.f + C.b) / 2], rx: 0.11, rz: 0.1 },
      ],
      {
        bone: sp,
        reg: 'gear',
        col: linMul(lin(op.look.vest || '#333'), 0.8),
        arc: [Math.PI * 0.15, Math.PI * 0.85],
        seg: 10,
        noOcc: true,
      }
    );
  }
  if (ST.apron) {
    gBox(b, [0, Bl.y - 0.25, Bl.f + 0.03], [0.34, 0.42, 0.02], 0.01, {
      bone: BI.Hips,
      reg: 'gear',
      col: lin('#4b3a2a'),
    });
  }
  if (b.P.length) chFinish(b, {});
  /* junta as duas */
  const o0 = g.P.length / 3;
  for (const a of ['P', 'N', 'UV', 'CO', 'J', 'W']) g[a].push(...b[a]);
  for (const i of b.I) g.I.push(i + o0);
  return (CH_CANV[k] = g);
}

/* ---------- operador ---------- */
function buildCharacter(scene, op, rel, vari) {
  const e = opmLoad(scene);
  if (e.fail || !opmPack()) {
    const c = chBuildProc(scene, op, rel);
    c.vari = vari || 0;
    return c;
  }
  const root = new B.TransformNode('op', scene),
    pivot = new B.TransformNode('opPivot', scene);
  pivot.parent = root;
  pivot.rotation.y = Math.PI;
  const tn = (n) => {
    const t = new B.TransformNode(n, scene);
    t.parent = root;
    return t;
  };
  const ch = {
    root,
    pivot,
    op,
    rel,
    scene,
    vari: vari || 0,
    e,
    rig: null,
    wid: null,
    sid: null,
    disp: null,
    dyaw: 0,
    fyaw: 0,
    ph: 0,
    hips: tn('hips'),
    head: tn('head'),
    up: tn('up'),
    gunSlot: tn('slot'),
    legs: [
      { th: tn('th'), kn: tn('kn') },
      { th: tn('th'), kn: tn('kn') },
    ],
    armG: null,
    armL: null,
    k: { ck: 0, sp: 0, pist: 0, air: 0, ads: 0, rel: 0, spr: 0, turn: 0, lean: 0, dir: 0, mv: 0 },
    turn: null,
    fall: null,
    deathT: 0,
    skin: true,
  };
  ch.rigN = ch.up;
  ch.armG = ch.armL = ch.up;
  if (e.ready) opmAttach(ch);
  else if (scene !== game) {
    const ob = scene.onBeforeRenderObservable.add(() => {
      if (ch.e.ready && !ch.rig) {
        opmAttach(ch);
        scene.onBeforeRenderObservable.remove(ob);
      }
    });
    root.onDisposeObservable.add(() => scene.onBeforeRenderObservable.remove(ob));
  }
  return ch;
}
function opmAttach(ch) {
  const e = ch.e,
    scene = ch.scene,
    op = ch.op,
    pk = opmPack();
  const E = e.c.instantiateModelsToScene((n) => n, false, { doNotInstantiate: true }),
    top = E.rootNodes[0];
  top.parent = ch.pivot;
  if (top.getTotalVertices && !top.getTotalVertices()) {
    top.isVisible = false;
    top.isPickable = false;
  }
  const by = new Map();
  for (const n of top.getDescendants(false)) if (!by.has(n.name)) by.set(n.name, n);
  const rig = opRig(pk, (n) => by.get(n));
  OPM.rigIdx = rig.idx;
  const R = opmRef(rig, e);
  /* troca os nós provisórios do contrato pelos ossos de verdade */
  for (const k of ['hips', 'head', 'up', 'gunSlot']) ch[k].dispose();
  for (const l of ch.legs) {
    l.th.dispose();
  }
  const X = rig.idx;
  ch.hips = rig.tn[X.Hips];
  ch.head = rig.tn[X.Head];
  ch.up = rig.tn[X.Spine2];
  ch.rigN = rig.tn[X.RightHand];
  ch.armG = rig.tn[X.RightArm];
  ch.armL = rig.tn[X.LeftArm];
  ch.legs[0].th = rig.tn[X.LeftUpLeg];
  ch.legs[1].th = rig.tn[X.RightUpLeg];
  ch.gunSlot = new B.TransformNode('slot', scene);
  ch.gunSlot.parent = ch.rigN;
  ch.gunSlot.rotationQuaternion = new B.Quaternion();
  if (ch.vari) ch.pivot.scaling.setAll(opScaleOf(op, ch.vari));
  ch.rig = rig;
  ch.po = opPose(rig);
  ch.po.Q.set(rig.Q0);
  ch.po.P.set(rig.T.subarray(0, 3));
  ch.po2 = opPose(rig);
  ch.last = rig.Q0.slice();
  ch.lastP = rig.T.slice(0, 3);
  const L = op.look,
    head = opHeadOf(op, ch.vari),
    cover =
      head === 'balaclava' ? 'balaclava' : op.look.head === 'bandana' && !ch.vari ? 'bandana' : '';
  let body = null;
  for (const m of top.getChildMeshes(false)) {
    m.isPickable = false;
    m.receiveShadows = true;
    const mn = m.material && m.material.name;
    if (mn === 'op_head') {
      m.material = opHeadMat(scene, op, ch.vari, cover);
      m.name = 'headm';
    } else if (mn === 'op_helm') {
      m.material = opBodyMat(scene, op, ch.vari);
      m.name = 'helm';
      m.setEnabled(head === 'helmet' || head === 'balaclava');
    } else {
      m.material = opBodyMat(scene, op, ch.vari);
      m.name = 'torso';
      body = m;
    }
  }
  for (const s of E.skeletons) {
    s.useTextureToStoreBoneMatrices = true;
  }
  ch.root.onDisposeObservable.add(() => {
    for (const s of E.skeletons) s.dispose();
  });
  ch.body = body;
  /* equipamento: malha com pele no esqueleto do corpo */
  if (body && body.skeleton) {
    const BI = {};
    body.skeleton.bones.forEach((b, i) => (BI[b.name.replace('mixamorig:', '')] = i));
    const g = opGearGeo(op, ch.vari, R, BI);
    if (g.I.length) {
      const src = chSrc(
        scene,
        'opgear|' + op.id + '|' + ch.vari,
        () => chMesh(scene, g, 'gear', true),
        opMat(scene, GADGET_OP)
      ); /* material único de equipamento (o mesmo dos gadgets) */
      const gm = src.clone('gear', body.parent);
      gm.setEnabled(true);
      gm.skeleton = body.skeleton;
      gm.isPickable = false;
      gm.receiveShadows = true;
      gm.position.copyFrom(body.position);
      if (body.rotationQuaternion) gm.rotationQuaternion = body.rotationQuaternion.clone();
      gm.scaling.copyFrom(body.scaling);
      ch.gear = gm;
    }
  }
  ch.packD =
    L.pack || chStyle(op).wirePack || chStyle(op).tanks ? 0.13 : chStyle(op).radioPack ? 0.07 : 0;
  if (scene === game && typeof shadowGen !== 'undefined' && shadowGen)
    for (const m of ch.root.getChildMeshes()) {
      if (CASTS.has(m.name)) shadowGen.addShadowCaster(m, false);
    }
  if (ch.wid) {
    const w = ch.wid,
      s = ch.sid;
    ch.wid = null;
    setCharWeapon(ch, w, s);
  }
  /* primeiro quadro: pose de prontidão (vitrine do menu não chama animChar) */
  opClear(ch.po);
  opAdd(rig, ch.po, pk.clips.aim, 0, true, 1);
  opNorm(rig, ch.po);
  opWrite(rig, ch.po);
  if (scene !== game) {
    let t = 0;
    const ob = scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(0.05, scene.getEngine().getDeltaTime() / 1000);
      t += dt;
      if (performance.now() - (ch.animT || -1e4) > 600) opIdleShow(ch, t);
    });
    ch.root.onDisposeObservable.add(() => scene.onBeforeRenderObservable.remove(ob));
  }
}
/* vitrine do menu: respiração parada, com a arma */
function opIdleShow(ch, t) {
  const rig = ch.rig,
    po = ch.po,
    pk = opmPack();
  opClear(po);
  const pist = ch.weapon && ch.weapon.hold === 'pistol';
  opAdd(rig, po, pk.clips[pist ? 'p_idle' : 'aim'], t, true, 1);
  opNorm(rig, po);
  opFK(rig, po);
  if (typeof opAimFix === 'function') opAimFix(ch, po, 0, 0, 1, pist ? 1 : 0);
  /* mão de apoio no guarda-mão da arma (como no jogo): o modelo real tem o guarda-mão em outro ponto que o simples */
  {
    const w = ch.weapon,
      X = rig.idx;
    if (w && w.fore && w.grip && typeof opIK2 === 'function') {
      const S = OPM.ref[pist ? 'pistol' : 'rifle'],
        h = X.RightHand;
      OPQ.mul(_aq, 0, po.G, h * 4, S.rot, 0);
      OPQ.rot(_av, 0, po.G, h * 4, S.pos[0], S.pos[1], S.pos[2]);
      const sp0 = [po.W[h * 3] + _av[0], po.W[h * 3 + 1] + _av[1], po.W[h * 3 + 2] + _av[2]];
      const fs = [w.fore.x - w.grip.x, w.fore.y - w.grip.y, w.fore.z - w.grip.z],
        tgt = pist ? [S.lw[0], S.lw[1], S.lw[2]] : v3a(fs, v3s(S.lw, S.lp));
      OPQ.rot(_av, 0, _aq, 0, tgt[0], tgt[1], tgt[2]);
      OPQ.mul(_aq, 20, _aq, 0, S.lrot, 0);
      opIK2(
        rig,
        po,
        X.LeftArm,
        X.LeftForeArm,
        X.LeftHand,
        [sp0[0] + _av[0], sp0[1] + _av[1], sp0[2] + _av[2]],
        _aq.subarray(20, 24),
        1
      );
    }
  }
  opWrite(rig, po);
}
function setCharWeapon(ch, wid, sid) {
  if (ch.proc) return chSetWeaponProc(ch, wid, sid);
  /* modelo real da arma: sempre na vitrine; no jogo só na qualidade alta (e só depois de carregado; até lá vale o modelo simples) */
  const R = WREAL[wBase(wid)],
    useReal = !!(
      R &&
      typeof WM !== 'undefined' &&
      WM.ready[R.m] &&
      (typeof game === 'undefined' || ch.scene !== game)
    );
  if (ch.wid === wid && ch.sid === sid && !!ch.wReal === useReal) return;
  ch.wid = wid;
  ch.sid = sid;
  ch.wReal = useReal;
  if (!ch.rig) return;
  const scene = ch.scene;
  for (const c of ch.gunSlot.getChildren()) c.dispose();
  if (ch.weapon && ch.weapon.g.parent !== ch.gunSlot && !ch.weapon.g.isDisposed())
    ch.weapon.g.dispose();
  ch.drop = null;
  const w = buildWeapon(
    scene,
    wid,
    useReal && typeof game !== 'undefined' && scene === game ? 'padrao' : sid,
    !useReal
  );
  /* no jogo os bonecos usam o acabamento de fábrica (uma textura por arma, em vez de uma por skin) */ w.g.parent =
    ch.gunSlot;
  w.g.position.set(-w.grip.x, -w.grip.y, -w.grip.z);
  ch.weapon = w;
  {
    const under = (m, n) => {
      for (let p = m.parent; p; p = p.parent) if (p === n) return true;
      return false;
    };
    const parts = w.g
      .getChildMeshes()
      .filter((m) => !(w.mag && under(m, w.mag)) && !(w.pump && under(m, w.pump)));
    if (parts.length > 1) {
      const mm = chMergeByMat(scene, parts, w.g);
      if (mm) {
        mm.parent = w.g;
        for (const p of parts) p.dispose();
      }
    }
  }
  for (const m of w.g.getChildMeshes()) {
    m.isPickable = false;
    m.receiveShadows = !useReal;
  }
  const S = OPM.ref[w.hold === 'pistol' ? 'pistol' : 'rifle'];
  ch.gunSlot.position.set(S.pos[0], S.pos[1], S.pos[2]);
  ch.gunSlot.rotationQuaternion.set(S.rot[0], S.rot[1], S.rot[2], S.rot[3]);
}

chWarm();
