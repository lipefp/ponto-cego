/* =====================================================================
   RENDERIZAÇÃO — motor Babylon, cenas, paleta, texturas e materiais
   Sistema destro (useRightHandedSystem): Y para cima, câmera olha para -Z,
   igual à simulação. camera.rotation = (pitch, yaw, roll).
   ===================================================================== */
const B = BABYLON;
const canvas = document.getElementById('view');
/* v4: o motor nasce na fábrica do núcleo (src/core/engine.js) — ponto único para trocar de renderizador no futuro */
const { engine, info: ENGINE_INFO } =
  typeof PCCORE !== 'undefined'
    ? PCCORE.createEngine(B, canvas)
    : {
        engine: new B.Engine(
          canvas,
          true,
          { stencil: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' },
          true
        ),
        info: { renderer: 'webgl', gpu: '' },
      };
engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 1.5));

/* paleta do jogo (concreto quente, aço azulado, laranja de ataque, azul de defesa) */
const PAL = {
  sky: '#b7c6cc',
  fog: '#aebdc3',
  ink: '#0a0b0d',
  text: '#f1f2f3',
  muted: '#9ba1a7',
  line: '#2a2e33',
  ally: '#2aa8e8',
  enemy: '#e2772f',
  atk: '#e8812f',
  def: '#2f8fe0',
  acc: '#e8812f',
  warn: '#e6c250',
  danger: '#e24b3b',
  panel: 'rgba(18,20,22,0.92)',
};
const FONT =
  "'Barlow Condensed',Bahnschrift, 'DIN Alternate', 'Roboto Condensed', 'Arial Narrow', 'Segoe UI', Ubuntu, sans-serif";
const DISPLAY = "'Big Shoulders Stencil Display','Barlow Condensed',Impact,sans-serif";
const MONO = "'Barlow',Consolas, 'DejaVu Sans Mono', 'Courier New', monospace";
const C3 = (h) => B.Color3.FromHexString(h);

/* ---------- cenas ---------- */
function makeScene() {
  const s = new B.Scene(engine);
  s.useRightHandedSystem = true;
  s.skipPointerMovePicking = true;
  s.autoClear = true;
  return s;
}
const game = makeScene(),
  lobby = makeScene();
game.clearColor = B.Color4.FromColor3(C3(PAL.sky), 1);
game.fogMode = B.Scene.FOGMODE_LINEAR;
game.fogColor = C3(PAL.fog);
game.fogStart = 70;
game.fogEnd = 260;
game.ambientColor = new B.Color3(0.25, 0.25, 0.25);
lobby.clearColor = new B.Color4(0.067, 0.09, 0.1, 1);

/* ---------- texturas procedurais ---------- */
function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h || w;
  return c;
}
function speckle(g, s, r, a, mono) {
  for (let i = 0; i < (s * s) / 10; i++) {
    const v = r() < 0.5 ? 0 : 255;
    g.fillStyle = mono
      ? `rgba(${v},${v},${v},${r() * a})`
      : `rgba(${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() * a})`;
    g.fillRect(r() * s, r() * s, 1 + r() * 2, 1 + r() * 2);
  }
}
function drawTex(draw, s, seed) {
  const c = mkCanvas(s || 256),
    g = c.getContext('2d');
  draw(g, c.width, mulberry(seed || 7));
  return c;
}
function dyn(scene, c, u, v, name) {
  const t = new B.DynamicTexture(name || 't', c, scene, true);
  t.update(false);
  t.wrapU = t.wrapV = B.Texture.WRAP_ADDRESSMODE;
  t.uScale = u || 1;
  t.vScale = v || 1;
  t.anisotropicFilteringLevel = 8;
  return t;
}
/* material PBR padrão: rough = rugosidade, metal = metalicidade */
function pbr(scene, o) {
  const m = new B.PBRMaterial(o.name || 'm', scene);
  m.metallic = o.metal || 0;
  m.roughness = o.rough == null ? 0.85 : o.rough;
  if (o.tex) m.albedoTexture = o.tex;
  m.albedoColor = o.color ? C3(o.color) : new B.Color3(1, 1, 1);
  if (o.emissive) {
    m.emissiveColor = C3(o.emissive);
    m.emissiveIntensity = o.ei || 1;
  }
  if (o.emissiveTex) {
    m.emissiveTexture = o.emissiveTex;
    m.emissiveColor = new B.Color3(1, 1, 1);
  }
  if (o.alpha != null) {
    m.alpha = o.alpha;
  }
  m.environmentIntensity = o.env == null ? 1 : o.env;
  m.directIntensity = 1.1;
  if (o.surf) applySurf(m, o.surf, o);
  if (o.wuv) lookWUV(m, o.wuv[0], o.wuv[1]);
  return m;
}
function unlit(scene, hex, alpha) {
  const m = new B.StandardMaterial('u', scene);
  m.disableLighting = true;
  m.emissiveColor = C3(hex);
  if (alpha != null) {
    m.alpha = alpha;
  }
  m.fogEnabled = false;
  return m;
}

/* texturas em canvas que ainda não viraram superfície PBR (as demais estão em SURF_DEF abaixo) */
const MAPTEX = {
  planks: drawTex((g, s, r) => {
    g.fillStyle = '#120d09';
    g.fillRect(
      0,
      0,
      s,
      s
    ); /* barricada estilo Siege: tábuas largas sobrepostas + 2 travessas em diagonal */
    const board = (y, h, a, shade) => {
      g.save();
      g.translate(s / 2, y);
      g.rotate(a);
      const v = r() * 26 + shade;
      const gr = g.createLinearGradient(0, -h / 2, 0, h / 2);
      gr.addColorStop(0, `rgb(${(178 + v) | 0},${(140 + v * 0.7) | 0},${(96 + v * 0.5) | 0})`);
      gr.addColorStop(1, `rgb(${(140 + v) | 0},${(104 + v * 0.7) | 0},${(66 + v * 0.5) | 0})`);
      g.fillStyle = gr;
      g.fillRect(-s * 0.7, -h / 2, s * 1.4, h);
      for (let k = 0; k < 7; k++) {
        g.strokeStyle = `rgba(90,60,30,${0.15 + r() * 0.2})`;
        g.lineWidth = 1;
        g.beginPath();
        const yy = -h / 2 + r() * h;
        g.moveTo(-s * 0.7, yy);
        g.bezierCurveTo(-s * 0.2, yy + (r() - 0.5) * 8, s * 0.2, yy + (r() - 0.5) * 8, s * 0.7, yy);
        g.stroke();
      }
      g.fillStyle = 'rgba(0,0,0,.35)';
      g.fillRect(-s * 0.7, h / 2 - 3, s * 1.4, 3);
      g.fillStyle = '#3a3836';
      for (const nx of [-0.42, -0.38, 0.38, 0.42]) g.fillRect(nx * s - 2, -3, 4, 4);
      g.restore();
    };
    for (let i = 0; i < 6; i++) board((i * s) / 6 + s / 12, s / 6.6, (r() - 0.5) * 0.06, 0);
    board(s * 0.5, s / 7, 0.62, 18);
    board(s * 0.5, s / 7, -0.62, 12);
    speckle(g, s, r, 0.05, true);
  }, 512),
};

/* =====================================================================
   SUPERFÍCIES PBR PROCEDURAIS (albedo + normal + ORM) — geradas por pixel
   u,v ∈ [0,1) com v=0 embaixo (linha 0 do canvas; a textura sobe sem inverter Y) (paredes: chão→teto; pisos: eixo z). Tudo
   periódico em u e v (repete sem emenda). ORM: R=oclusão, G=rugosidade, B=metal.
   ===================================================================== */
/* ruído de valor periódico: uma grade aleatória por período p (cache), interpolação suave, 3 oitavas (fBm).
   pnz(u,v,f,o): f inteiro = células da oitava base por tile (repete sem emenda em u e v); o = semente (desloca a amostra).
   Oitavas acima de SURF_MAXF (metade da resolução da textura) são cortadas para não gerar serrilhado. */
const NZL = {};
let SURF_MAXF = 256;
function nzLat(p) {
  let t = NZL[p];
  if (!t) {
    t = new Float32Array(p * p);
    const r = mulberry(p * 7919 + 13);
    for (let i = 0; i < p * p; i++) t[i] = r();
    NZL[p] = t;
  }
  return t;
}
function vnz(x, y, p) {
  x %= p;
  if (x < 0) x += p;
  y %= p;
  if (y < 0) y += p;
  const x0 = x | 0,
    y0 = y | 0,
    tx = x - x0,
    ty = y - y0,
    sx = tx * tx * (3 - 2 * tx),
    sy = ty * ty * (3 - 2 * ty),
    x1 = x0 + 1 === p ? 0 : x0 + 1,
    y1 = y0 + 1 === p ? 0 : y0 + 1,
    T = nzLat(p);
  const a = T[y0 * p + x0] + (T[y0 * p + x1] - T[y0 * p + x0]) * sx,
    b = T[y1 * p + x0] + (T[y1 * p + x1] - T[y1 * p + x0]) * sx;
  return a + (b - a) * sy;
}
function pnz(u, v, f, o) {
  o = o || 0;
  const ox = o * 37.7,
    oy = o * 21.3;
  let s = 0,
    a = 1,
    w = 0,
    p = Math.max(1, Math.round(f));
  for (let k = 0; k < 3 && (k === 0 || p <= SURF_MAXF); k++) {
    s += a * vnz(u * p + ox, v * p + oy, p);
    w += a;
    a *= 0.5;
    p *= 2;
  }
  const n = 0.46 + (s / w - 0.5) * 1.5;
  return n < 0 ? 0 : n > 1 ? 1 : n;
}
const hh = (i, j, s) => {
  let h = Math.imul((i | 0) * 374761393 + (j | 0) * 668265263 + (s | 0) * 1442695041, 1274126177);
  h ^= h >>> 13;
  h = Math.imul(h, 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const c01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x),
  ss = (a, b, x) => {
    const t = c01((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  },
  mixv = (a, b, t) => a + (b - a) * t;
/* gera os 3 canvases de uma superfície; fn(u,v,o) preenche o.{r,g,b (sRGB 0..1), h (altura), ro, me, ao} */
function surfMaps(size, fn, nStr) {
  SURF_MAXF = size / 2;
  const n = size * size,
    Hh = new Float32Array(n),
    A = new Uint8ClampedArray(n * 4),
    O = new Uint8ClampedArray(n * 4),
    N = new Uint8ClampedArray(n * 4),
    o = {};
  for (let y = 0; y < size; y++) {
    const v = (y + 0.5) / size;
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size,
        i = y * size + x,
        k = i * 4;
      o.r = o.g = o.b = 0.5;
      o.h = 0.5;
      o.ro = 0.8;
      o.me = 0;
      o.ao = 1;
      fn(u, v, o);
      A[k] = o.r * 255;
      A[k + 1] = o.g * 255;
      A[k + 2] = o.b * 255;
      A[k + 3] = 255;
      Hh[i] = o.h;
      O[k] = o.ao * 255;
      O[k + 1] = o.ro * 255;
      O[k + 2] = o.me * 255;
      O[k + 3] = 255;
    }
  }
  const s = ((nStr || 4) * size) / 256;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = y * size + x,
        k = i * 4,
        xl = y * size + ((x + size - 1) % size),
        xr = y * size + ((x + 1) % size),
        yu = ((y + size - 1) % size) * size + x,
        yd = ((y + 1) % size) * size + x;
      const dx = (Hh[xr] - Hh[xl]) * s,
        dy = (Hh[yu] - Hh[yd]) * s,
        l = Math.sqrt(dx * dx + dy * dy + 1);
      N[k] = ((-dx / l) * 0.5 + 0.5) * 255;
      N[k + 1] = ((dy / l) * 0.5 + 0.5) * 255;
      N[k + 2] = ((1 / l) * 0.5 + 0.5) * 255;
      N[k + 3] = 255;
    }
  const put = (d) => {
    const c = mkCanvas(size);
    c.getContext('2d').putImageData(new ImageData(d, size, size), 0, 0);
    return c;
  };
  return { a: put(A), n: put(N), o: put(O), raw: [A, N, O] };
}
const SURF_DEF = {};
const SURF_C = {};
const PROF =
  window.__pcProf ||
  (window.__pcProf = {}); /* v4: tempos de carga (ms) por etapa — lidos pelos testes */
const prof = (k, f) => {
  const t = performance.now();
  try {
    return f();
  } finally {
    PROF[k] = (PROF[k] || 0) + performance.now() - t;
  }
};
/* v4: resultado de surfMaps vai para o cache persistente (IndexedDB, via boot); chave = hash do código gerador */
const PCC = typeof PCBOOT !== 'undefined' && PCBOOT.cache ? PCBOOT.cache : null;
const SURF_SRC = PCC
  ? PCBOOT.hash(
      [surfMaps, pnz, vnz, nzLat, hh, c01, ss, mixv, mulberry].map((f) => String(f)).join('|')
    )
  : '';
function surfCanvases(key) {
  if (!SURF_C[key]) {
    const d = SURF_DEF[key];
    SURF_C[key] = prof('surf', () => {
      if (!PCC) return surfMaps(d[0], d[1], d[2]);
      const ck =
          'surf:' +
          key +
          ':' +
          d[0] +
          ':' +
          (d[2] || 4) +
          ':' +
          SURF_SRC +
          ':' +
          PCBOOT.hash(String(d[1])),
        n = d[0] * d[0] * 4,
        hit = PCC.get(ck);
      const put = (u, o) => {
        const c = mkCanvas(d[0]);
        c.getContext('2d').putImageData(
          new ImageData(new Uint8ClampedArray(u.buffer, u.byteOffset + o, n), d[0], d[0]),
          0,
          0
        );
        return c;
      };
      if (hit && hit.length === n * 3)
        return { a: put(hit, 0), n: put(hit, n), o: put(hit, n * 2) };
      const r = surfMaps(d[0], d[1], d[2]),
        u = new Uint8Array(n * 3);
      u.set(r.raw[0], 0);
      u.set(r.raw[1], n);
      u.set(r.raw[2], n * 2);
      PCC.put(ck, u);
      return r;
    });
  }
  return SURF_C[key];
}
/* v4.5 — FOTOS REAIS: mapas de detalhe passa-alta (ph_*.webp) multiplicam o albedo e perturbam a normal das superfícies procedurais.
   [força do albedo, força do relevo]. Carrega assíncrono (surfPhotos, chamado após os modelos); superfícies já criadas são atualizadas no lugar. */
const PHOTO_STR = {
  brick: [0.75, 0.9],
  concrete: [0.6, 0.8],
  drywall: [0.4, 0.5],
  woodfloor: [0.6, 0.7],
  oakfloor: [0.6, 0.7],
  slabfloor: [0.55, 0.7],
  terrazzo: [0.45, 0.5],
  asphalt: [0.7, 0.9],
  steel: [0.4, 0.3],
  crate: [0.6, 0.7],
  ceiling: [0.35, 0.5],
};
const PHOTO_D = {},
  PHOTO_DONE = {};
function photoApply(key, S) {
  if (PHOTO_DONE[key] || !PHOTO_D[key] || !S) return false;
  PHOTO_DONE[key] = 1;
  const D = PHOTO_D[key],
    [sa, sn] = PHOTO_STR[key],
    ca = S.a,
    cn = S.n,
    sz = ca.width,
    g = ca.getContext('2d'),
    h = cn.getContext('2d');
  const dc = mkCanvas(sz);
  dc.getContext('2d').drawImage(D, 0, 0, sz, sz);
  const dd = dc.getContext('2d').getImageData(0, 0, sz, sz).data;
  const A = g.getImageData(0, 0, sz, sz),
    Nn = h.getImageData(0, 0, sz, sz),
    a = A.data,
    nn = Nn.data,
    L = new Float32Array(sz * sz);
  for (let i = 0; i < sz * sz; i++) {
    const k = i * 4;
    L[i] = (0.299 * dd[k] + 0.587 * dd[k + 1] + 0.114 * dd[k + 2]) / 128 - 1;
    for (let c = 0; c < 3; c++) {
      const v = a[k + c] * (1 + sa * (dd[k + c] / 128 - 1));
      a[k + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  const st = ((sn * sz) / 512) * 3;
  for (let y = 0; y < sz; y++)
    for (let x = 0; x < sz; x++) {
      const i = y * sz + x,
        k = i * 4,
        xl = y * sz + ((x + sz - 1) % sz),
        xr = y * sz + ((x + 1) % sz),
        yu = ((y + sz - 1) % sz) * sz + x,
        yd = ((y + 1) % sz) * sz + x;
      const dx = (L[xr] - L[xl]) * st,
        dy = (L[yu] - L[yd]) * st;
      let nx = nn[k] / 127.5 - 1 - dx,
        ny = nn[k + 1] / 127.5 - 1 + dy,
        nz = nn[k + 2] / 127.5 - 1;
      const l = Math.hypot(nx, ny, nz) || 1;
      nn[k] = ((nx / l) * 0.5 + 0.5) * 255;
      nn[k + 1] = ((ny / l) * 0.5 + 0.5) * 255;
      nn[k + 2] = ((nz / l) * 0.5 + 0.5) * 255;
    }
  g.putImageData(A, 0, 0);
  h.putImageData(Nn, 0, 0);
  return true;
}
function photoRefresh(key) {
  const S = SURF_C[key];
  if (!S || !photoApply(key, S)) return;
  for (const sc of [typeof game !== 'undefined' && game, typeof lobby !== 'undefined' && lobby])
    if (sc && sc._surfC)
      for (const id in sc._surfC)
        if (id.split('|')[0] === key) {
          const T = sc._surfC[id];
          T.a.update(false);
          T.n.update(false);
        }
}
async function surfPhotos() {
  if (typeof ASSET_BYTES !== 'function' || typeof createImageBitmap !== 'function') return;
  await Promise.all(
    Object.keys(PHOTO_STR).map(async (key) => {
      try {
        const b = ASSET_BYTES('ph_' + key + '.webp');
        if (!b) return;
        PHOTO_D[key] = await createImageBitmap(new Blob([b], { type: 'image/webp' }));
      } catch (e) {
        console.warn('foto', key, e);
      }
    })
  );
  for (const key in PHOTO_D) photoRefresh(key);
}
/* texturas de uma superfície numa cena (cache por cena+escala) */
function surfTex(scene, key, u, v) {
  const C = scene._surfC || (scene._surfC = {}),
    id = key + '|' + (u || 1) + '|' + (v || 1);
  if (C[id]) return C[id];
  const S = surfCanvases(key);
  photoApply(key, S);
  const mk = (c, lin) => {
    const t = dyn(scene, c, u, v, 's_' + key);
    if (lin) t.gammaSpace = false;
    return t;
  };
  return (C[id] = { a: mk(S.a), n: mk(S.n, true), o: mk(S.o, true) });
}
/* aplica uma superfície a um material PBR (rugosidade/metal vêm do mapa ORM; rough/metal viram multiplicadores) */
function applySurf(m, key, o) {
  o = o || {};
  const S = surfTex(m.getScene(), key, o.u, o.v);
  m.albedoTexture = S.a;
  m.bumpTexture = S.n;
  m.bumpTexture.level = o.bump || 1;
  m.metallicTexture = S.o;
  m.useRoughnessFromMetallicTextureGreen = true;
  m.useMetallnessFromMetallicTextureBlue = true;
  m.useRoughnessFromMetallicTextureAlpha = false;
  m.useAmbientOcclusionFromMetallicTextureRed = true;
  m.metallic = o.metal == null ? 1 : o.metal;
  m.roughness = o.rough == null ? 1 : o.rough;
  return m;
}
/* -------- definições: [tamanho, fn, força do relevo] -------- */
Object.assign(SURF_DEF, {
  /* tijolo aparente (parede de 3 m x 3,2 m): fiadas desencontradas, argamassa recuada, sujeira na base e escorridos */
  brick: [
    512,
    (u, v, o) => {
      const rows = 23,
        cols = 8,
        ry = v * rows,
        row = Math.floor(ry),
        fy = ry - row,
        rx = u * cols + (row % 2) * 0.5,
        col = Math.floor(rx),
        fx = rx - col,
        cid = ((col % cols) + cols) % cols;
      const n = pnz(u, v, 4, 0.3),
        n2 = pnz(u, v, 32, 1.7),
        n3 = pnz(u, v, 96, 0.9),
        ex = Math.min(fx, 1 - fx) * 0.375,
        ey = Math.min(fy, 1 - fy) * 0.139;
      const chip = pnz(u, v, 24, hh(cid, row, 3) * 9);
      const ed = 0.009 + (chip > 0.62 ? (chip - 0.62) * 0.05 : 0);
      const inB = ss(ed * 0.6, ed * 1.25, ex) * ss(ed * 0.6, ed * 1.25, ey);
      const h1 = hh(cid, row, 1),
        h2 = hh(cid, row, 2),
        burnt = h2 < 0.14;
      let r = 0.47 + h1 * 0.12,
        g = 0.3 + h1 * 0.07,
        b = 0.21 + h1 * 0.05;
      if (burnt) {
        r *= 0.66;
        g *= 0.66;
        b *= 0.7;
      }
      if (h2 > 0.88) {
        r = 0.56;
        g = 0.44;
        b = 0.36;
      } else if (h2 > 0.8) {
        r = 0.4;
        g = 0.31;
        b = 0.27;
      }
      const k = 0.84 + 0.22 * n2 + 0.08 * n3;
      r *= k;
      g *= k;
      b *= k;
      const sat = 0.74;
      const lu = r * 0.3 + g * 0.59 + b * 0.11;
      r = mixv(lu, r, sat);
      g = mixv(lu, g, sat);
      b = mixv(lu, b, sat);
      const mo = (0.56 + 0.12 * n3) * (0.9 + 0.15 * n);
      let R = mixv(mo, r, inB),
        G = mixv(mo * 0.96, g, inB),
        Bb = mixv(mo * 0.9, b, inB);
      const st = pnz(u, v * 0.08, 8, 4.2),
        streak = ss(0.55, 0.8, st) * ss(0.35, 1, v) * 0.2,
        gr = ss(0.22, 0, v) * (0.45 + 0.4 * n),
        eff = ss(0.66, 0.8, pnz(u, v, 3, 2.2)) * 0.06;
      const d = 1 - streak - gr * 0.38;
      R = R * d + eff;
      G = G * d + eff;
      Bb = Bb * d + eff * 0.95;
      o.r = R;
      o.g = G;
      o.b = Bb;
      o.h = inB * (0.7 + 0.12 * n2 + 0.08 * n3) + (1 - inB) * (0.18 + 0.1 * n3);
      o.ro = mixv(0.97, 0.74 + 0.1 * n3 + 0.12 * h2, inB) + gr * 0.03;
      o.ao = 0.55 + 0.45 * inB;
    },
    5,
  ],
  /* concreto moldado (muro externo): juntas, furos de tirante, manchas e escorridos */
  concrete: [
    512,
    (u, v, o) => {
      const n = pnz(u, v, 3, 0.2),
        n2 = pnz(u, v, 20, 0.7),
        n3 = pnz(u, v, 72, 0.1),
        jx = Math.min(u, 1 - u) * 3,
        jy = Math.abs(v - 0.5) * 3.2;
      const joint = 1 - ss(0.004, 0.012, Math.min(jx, jy)),
        hu = ((u * 4) % 1) - 0.5,
        hv = ((v * 3) % 1) - 0.5,
        hole = 1 - ss(0.03, 0.042, Math.hypot(hu, hv * 1.07));
      const base = 0.56 + 0.13 * n + 0.07 * n2 + 0.05 * n3;
      const st = pnz(u, v * 0.07, 10, 4),
        streak = ss(0.5, 0.8, st) * ss(0.2, 1, v) * 0.25,
        gr = ss(0.3, 0, v) * (0.3 + 0.3 * n);
      const d = (1 - streak - gr * 0.35) * (1 - joint * 0.3) * (1 - hole * 0.4);
      o.r = base * d;
      o.g = base * 0.97 * d;
      o.b = base * 0.91 * d;
      o.h = 0.6 + 0.1 * n2 + 0.06 * n3 - joint * 0.3 - hole * 0.45;
      o.ro = 0.9 + 0.06 * n3;
      o.ao = 1 - hole * 0.5 - joint * 0.35;
    },
    4,
  ],
  /* parede pintada de escritório: rodapé, pintura de baixo mais escura, régua (meia parede) e marcas de uso */
  drywall: [
    512,
    (u, v, o) => {
      const y = v * 3.2,
        n = pnz(u, v, 4, 0.5),
        n2 = pnz(u, v, 16, 1.1),
        n3 = pnz(u, v, 96, 0.3),
        sc = pnz(u, v, 12, 7.7);
      let r,
        g,
        b,
        ro = 0.72 + 0.1 * n2,
        h = 0.5 + 0.015 * n3 + 0.02 * n2;
      if (y < 0.1) {
        r = g = b = 0.16 + 0.03 * n2;
        g *= 0.97;
        ro = 0.5;
        h = 0.75;
      } else if (y < 1.02) {
        r = 0.5;
        g = 0.52;
        b = 0.46;
        const k = 0.92 + 0.1 * n2;
        r *= k;
        g *= k;
        b *= k;
      } else if (y < 1.08) {
        r = 0.46;
        g = 0.37;
        b = 0.27;
        r *= 0.9 + 0.15 * n3;
        ro = 0.45;
        h = 0.8 + (y < 1.05 ? 0.05 : 0);
      } else {
        r = 0.8;
        g = 0.76;
        b = 0.66;
        const k = 0.96 + 0.06 * n2;
        r *= k;
        g *= k;
        b *= k;
      }
      if (y >= 0.1 && y < 0.9) {
        const s = ss(0.6, 0.8, sc) * 0.12;
        r *= 1 - s;
        g *= 1 - s;
        b *= 1 - s;
      }
      const dirt =
        ss(0.6, 0.1, y) * 0.12 + ss(2.6, 3.2, y) * 0.08 + (n > 0.68 ? (n - 0.68) * 0.35 : 0);
      r *= 1 - dirt;
      g *= 1 - dirt;
      b *= 1 - dirt * 1.1;
      const seam = 1 - ss(0.0015, 0.004, Math.min(Math.abs(u - 0.5), u, 1 - u));
      h -= seam * 0.06;
      o.r = r;
      o.g = g;
      o.b = b;
      o.h = h;
      o.ro = ro;
      o.ao = y < 0.12 ? 0.75 : 1;
    },
    4,
  ],
  /* piso de tábuas (3 m): 20 réguas de 15 cm, emendas desencontradas, veio, verniz gasto */
  woodfloor: [
    512,
    (u, v, o) => {
      const rows = 20,
        ry = v * rows,
        row = Math.floor(ry),
        fy = ry - row,
        off = hh(row, 0, 5),
        px = u * 3 + off * 3,
        pl = Math.floor(px),
        fx = px - pl,
        pid = hh(((pl % 3) + 3) % 3, row, 6);
      const g1 = pnz(u, v * 30, 2, row * 0.173 + pid),
        g2 = pnz(u, v * 8, 6, pid * 3.1),
        ex = Math.min(fx, 1 - fx) * 1,
        ey = Math.min(fy, 1 - fy) * 0.15;
      const j = ss(0.002, 0.005, ex) * ss(0.002, 0.006, ey);
      const t = 0.86 + 0.2 * pid,
        gr = 0.86 + 0.22 * g1 + 0.08 * g2;
      let r = 0.58 * t * gr,
        g = 0.43 * t * gr,
        b = 0.28 * t * gr;
      const wear = ss(0.55, 0.75, pnz(u, v, 2, 3.3)) * 0.15,
        dirt = ss(0.6, 0.8, pnz(u, v, 6, 8)) * 0.12;
      r = r * (1 - dirt) + wear * 0.05;
      g = g * (1 - dirt) + wear * 0.04;
      b = b * (1 - dirt) + wear * 0.03;
      o.r = r * mixv(0.45, 1, j);
      o.g = g * mixv(0.45, 1, j);
      o.b = b * mixv(0.45, 1, j);
      o.h = j * (0.6 + 0.06 * g1);
      o.ro = 0.4 + 0.1 * pid + wear * 0.4 + dirt * 0.4 + (1 - j) * 0.3;
      o.ao = 0.6 + 0.4 * j;
    },
    4,
  ],
  /* carpete em placas (1,5 m: 3x3 placas de 50 cm) com fibra alternada */
  carpet: [
    256,
    (u, v, o) => {
      const tx = Math.floor(u * 3),
        tz = Math.floor(v * 3),
        alt = (tx + tz) % 2,
        t = hh(tx, tz, 8);
      const f = alt ? pnz(u * 1, v * 20, 6, t * 7) : pnz(u * 20, v, 6, t * 7);
      const n = pnz(u, v, 48, 0.4),
        st = ss(0.66, 0.76, pnz(u, v, 2, 5.5)) * 0.18;
      const k = (0.86 + 0.1 * t + 0.2 * f + 0.12 * n) * (1 - st);
      o.r = 0.24 * k;
      o.g = 0.26 * k;
      o.b = 0.3 * k;
      const ex = Math.min((u * 3) % 1, 1 - ((u * 3) % 1), (v * 3) % 1, 1 - ((v * 3) % 1));
      o.h = 0.5 + 0.25 * n + 0.15 * f - (ex < 0.006 ? 0.2 : 0);
      o.ro = 1;
      o.ao = ex < 0.006 ? 0.8 : 1;
    },
    3,
  ],
  /* piso elevado de sala de servidores (1,2 m: 2x2 placas de 60 cm), algumas perfuradas */
  raised: [
    512,
    (u, v, o) => {
      const tx = Math.floor(u * 2),
        tz = Math.floor(v * 2),
        fx = (u * 2) % 1,
        fz = (v * 2) % 1,
        ex = Math.min(fx, 1 - fx, fz, 1 - fz) * 0.6,
        t = hh(tx, tz, 9);
      const gap = 1 - ss(0.003, 0.007, ex),
        n = pnz(u, v, 40, t),
        n3 = pnz(u, v, 128, 0.2);
      let k = 0.6 + 0.06 * t + 0.08 * n + 0.06 * n3;
      let hole = 0;
      if (t > 0.55) {
        const hx = ((fx * 14) % 1) - 0.5,
          hz = ((fz * 14) % 1) - 0.5;
        if (ex > 0.04) hole = 1 - ss(0.18, 0.26, Math.hypot(hx, hz));
      }
      const dirt = ss(0.03, 0, ex) * 0.25 + ss(0.6, 0.8, pnz(u, v, 3, 1.9)) * 0.1;
      k *= 1 - dirt;
      o.r = k * (1 - hole * 0.8);
      o.g = k * 1.01 * (1 - hole * 0.8);
      o.b = k * 1.02 * (1 - hole * 0.8);
      o.h = 0.6 + 0.03 * n3 - gap * 0.5 - hole * 0.4;
      o.ro = 0.42 + 0.15 * n + gap * 0.4 + dirt;
      o.me = hole * 0.0;
      o.ao = 1 - gap * 0.5 - hole * 0.5;
    },
    4,
  ],
  /* granilite (corredor): placas de 60 cm, rejunte, lascas coloridas, sujeira de passagem */
  terrazzo: [
    512,
    (u, v, o) => {
      const tx = Math.floor(u * 2),
        tz = Math.floor(v * 2),
        fx = (u * 2) % 1,
        fz = (v * 2) % 1,
        ex = Math.min(fx, 1 - fx, fz, 1 - fz) * 0.6,
        t = hh(tx, tz, 10);
      const gro = 1 - ss(0.002, 0.005, ex),
        c1 = pnz(u, v, 64, t * 3),
        c2 = pnz(u, v, 40, t * 5 + 2),
        n = pnz(u, v, 3, 0.8);
      let r = 0.7,
        g = 0.68,
        b = 0.63;
      const k = 0.95 + 0.06 * t;
      const c3 = pnz(u, v, 128, t * 2 + 1);
      if (c3 > 0.7) {
        r = 0.46;
        g = 0.44;
        b = 0.42;
      } else if (c3 < 0.26) {
        r = 0.82;
        g = 0.77;
        b = 0.68;
      } else if (c1 > 0.72) {
        r = 0.6;
        g = 0.57;
        b = 0.52;
      }
      const traffic = ss(0.35, 0.85, n) * 0.1 + ss(0.6, 0.9, pnz(u, v, 8, 4.4)) * 0.05;
      r = r * k * (1 - traffic);
      g = g * k * (1 - traffic);
      b = b * k * (1 - traffic * 1.1);
      const G = 0.35;
      o.r = mixv(r, G, gro);
      o.g = mixv(g, G * 0.97, gro);
      o.b = mixv(b, G * 0.92, gro);
      o.h = 0.6 - gro * 0.4;
      o.ro = 0.34 + 0.12 * n + gro * 0.4;
      o.ao = 1 - gro * 0.4;
    },
    4,
  ],
  /* concreto polido de depósito: juntas de corte, nuvens, manchas de óleo */
  slabfloor: [
    512,
    (u, v, o) => {
      const n = pnz(u, v, 2, 0.6),
        n2 = pnz(u, v, 12, 2.2),
        n3 = pnz(u, v, 80, 1.4),
        ex = Math.min(u, 1 - u, v, 1 - v, Math.abs(u - 0.5), Math.abs(v - 0.5)) * 3,
        joint = 1 - ss(0.004, 0.01, ex);
      const oil = ss(0.7, 0.9, pnz(u, v, 3, 9.1)) * 0.14,
        k = (0.52 + 0.12 * n + 0.06 * n2 + 0.04 * n3) * (1 - oil) * (1 - joint * 0.45);
      o.r = k;
      o.g = k * 0.98;
      o.b = k * 0.94;
      o.h = 0.6 + 0.04 * n3 - joint * 0.4;
      o.ro = 0.55 + 0.15 * n - oil * 0.15 + joint * 0.4;
      o.ao = 1 - joint * 0.4;
    },
    4,
  ],
  /* calçada: placas de 1,5 m */
  paver: [
    256,
    (u, v, o) => {
      const fx = (u * 2) % 1,
        fz = (v * 2) % 1,
        ex = Math.min(fx, 1 - fx, fz, 1 - fz) * 1.5,
        t = hh(Math.floor(u * 2), Math.floor(v * 2), 11),
        j = 1 - ss(0.006, 0.016, ex),
        n = pnz(u, v, 10, t),
        n3 = pnz(u, v, 60, 0.5);
      const k =
        (0.58 + 0.08 * t + 0.08 * n + 0.05 * n3) *
        (1 - j * 0.45) *
        (1 - ss(0.68, 0.76, pnz(u, v, 3, 4)) * 0.2);
      o.r = k;
      o.g = k * 0.98;
      o.b = k * 0.94;
      o.h = 0.6 + 0.06 * n3 - j * 0.4;
      o.ro = 0.9;
      o.ao = 1 - j * 0.4;
    },
    4,
  ],
  /* asfalto (4 m): agregado, remendos, trincas, óleo */
  asphalt: [
    512,
    (u, v, o) => {
      const n = pnz(u, v, 3, 0.1),
        n2 = pnz(u, v, 24, 0.6),
        a = pnz(u, v, 128, 0.33),
        a2 = pnz(u, v, 96, 2.1);
      let k = 0.27 + 0.05 * n + 0.04 * n2;
      if (a > 0.68) k += ((0.12 * (a - 0.68)) / 0.32) * 3;
      if (a2 < 0.22) k *= 0.85;
      const patch = ss(0.6, 0.7, pnz(u, v, 2, 6.6));
      k *= 1 - patch * 0.1;
      const cr = 1 - ss(0.002, 0.007, Math.abs(pnz(u, v, 5, 3.3) - 0.5)),
        crack = cr * ss(0.5, 0.65, pnz(u, v, 6, 1.2));
      k *= 1 - crack * 0.35;
      const oil = ss(0.74, 0.84, pnz(u, v, 6, 7.7)) * 0.18;
      k *= 1 - oil;
      o.r = k;
      o.g = k * 0.99;
      o.b = k * 0.96;
      o.h = 0.5 + 0.25 * a + 0.1 * n2 - crack * 0.5;
      o.ro = 0.93 - oil * 0.4 - patch * 0.05;
      o.ao = 1 - crack * 0.5;
    },
    4,
  ],
  /* forro de placas acústicas (1,2 m: 2x2 placas de 60 cm) com perfil T e manchas */
  ceiling: [
    256,
    (u, v, o) => {
      const fx = (u * 2) % 1,
        fz = (v * 2) % 1,
        ex = Math.min(fx, 1 - fx, fz, 1 - fz) * 0.6,
        t = hh(Math.floor(u * 2), Math.floor(v * 2), 12),
        bar = 1 - ss(0.009, 0.012, ex);
      const p = pnz(u, v, 64, t),
        p2 = pnz(u, v, 4, t * 3),
        stain = t > 0.86 ? ss(0.75, 0.35, Math.hypot(fx - 0.5, fz - 0.5) * 2) * 0.25 : 0;
      const k =
        (0.78 + 0.04 * t - ss(0.55, 0.85, p) * 0.06 - ss(0.5, 0.8, p2) * 0.05) * (1 - stain);
      o.r = mixv(k, 0.76, bar);
      o.g = mixv(k * 0.985, 0.75, bar);
      o.b = mixv(k * 0.94 - stain * 0.2, 0.72, bar);
      o.h = bar ? 0.62 : 0.5 + 0.03 * p;
      o.ro = bar ? 0.5 : 0.95;
      o.me = bar * 0.3;
      o.ao = bar ? 1 : ss(0, 0.03, ex) * 0.15 + 0.85;
    },
    3,
  ],
  /* chapa de reforço (3 x 3,2 m): nervuras, tinta cinza, riscos de metal, ferrugem e faixa de alerta */
  steel: [
    512,
    (u, v, o) => {
      const y = v * 3.2,
        f = (u * 8) % 1,
        rib = Math.pow(Math.sin(f * Math.PI), 0.5),
        n = pnz(u, v, 6, 2),
        n3 = pnz(u, v, 64, 0.7),
        scr = pnz(u * 40, v, 2, 1.1);
      let r = 0.4,
        g = 0.42,
        b = 0.41,
        me = 0,
        ro = 0.55 + 0.15 * n;
      const k = 0.9 + 0.15 * n;
      r *= k;
      g *= k;
      b *= k;
      if (y < 0.3) {
        const st = (u * 12 + y * 1.6) % 1 < 0.5;
        if (st) {
          r = 0.75;
          g = 0.6;
          b = 0.12;
        } else {
          r = g = b = 0.08;
        }
      }
      const sc = ss(0.78, 0.82, scr) * ss(0.6, 0.7, n3);
      if (sc > 0) {
        r = mixv(r, 0.62, sc);
        g = mixv(g, 0.63, sc);
        b = mixv(b, 0.64, sc);
        me = sc;
        ro = mixv(ro, 0.3, sc);
      }
      const rust = ss(0.62, 0.8, pnz(u, v, 5, 5.5)) * ss(1.2, 0, y) * 0.8;
      r = mixv(r, 0.36, rust);
      g = mixv(g, 0.2, rust);
      b = mixv(b, 0.1, rust);
      ro += rust * 0.3;
      me *= 1 - rust;
      o.r = r;
      o.g = g;
      o.b = b;
      o.me = me;
      o.ro = ro;
      o.h = 0.3 + 0.5 * rib + 0.03 * n3;
      o.ao = 0.7 + 0.3 * rib;
    },
    5,
  ],
  /* caixa de madeira (UV da face): tábuas, moldura, travessa diagonal e pregos */
  crate: [
    512,
    (u, v, o) => {
      const fr = Math.min(u, 1 - u, v, 1 - v),
        inF = fr < 0.09,
        du = Math.abs(u - v),
        onX = du < 0.065 && !inF;
      const pl = Math.floor(v * 6),
        fv = (v * 6) % 1,
        pid = hh(pl, 0, 13);
      const along = inF
          ? Math.min(u, 1 - u) < Math.min(v, 1 - v)
            ? v
            : u
          : onX
            ? (u + v) * 0.5
            : u,
        g1 = pnz(along, (inF || onX ? fr * 3 : v) * 8, 4, pid * 7 + (inF ? 3 : onX ? 5 : 0));
      const t = inF || onX ? 0.86 : 0.78 + 0.3 * pid,
        k = t * (0.82 + 0.3 * g1);
      let r = 0.55 * k,
        g = 0.39 * k,
        b = 0.24 * k;
      const seam = !inF && !onX && Math.min(fv, 1 - fv) < 0.025;
      if (seam) {
        r *= 0.4;
        g *= 0.4;
        b *= 0.4;
      }
      const dirt = ss(0.25, 0, v) * 0.25 + ss(0.6, 0.8, pnz(u, v, 4, 3)) * 0.15;
      r *= 1 - dirt;
      g *= 1 - dirt;
      b *= 1 - dirt;
      const nail =
        inF && Math.hypot(((u * 4) % 1) - 0.5, ((v * 4) % 1) - 0.5) < 0.05 && fr > 0.03 ? 1 : 0;
      if (nail) {
        r = g = b = 0.25;
      }
      o.r = r;
      o.g = g;
      o.b = b;
      o.h =
        (inF ? 0.85 : onX ? 0.95 : 0.55) - (seam ? 0.3 : 0) + 0.04 * g1 - (fr < 0.012 ? 0.3 : 0);
      o.ro = 0.8 + 0.1 * g1;
      o.me = nail * 0.8;
      o.ao = seam ? 0.6 : inF || onX ? 1 : 0.85 + 0.15 * ss(0.09, 0.15, fr);
    },
    5,
  ],
});
/* mapa de ambiente (IBL): HDRI "warehouse" (Poly Haven, CC0) pré-filtrado em .env 256 px */
function envTex(scene) {
  if (scene._env !== undefined) return scene._env;
  scene._env = null;
  try {
    if (typeof ASSET_FILE !== 'undefined' && ASSET_FILE['lt_env.env']) {
      const bin = atob(ASSET_FILE['lt_env.env']),
        u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      scene._env = new B.CubeTexture('lt_env', scene, {
        buffer: u,
        forcedExtension: '.env',
        prefiltered: true,
        createPolynomials: true,
      });
      scene.environmentTexture = scene._env;
    }
  } catch (e) {
    console.warn('env', e);
    scene._env = null;
  }
  return scene._env;
}
