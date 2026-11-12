/* =====================================================================
   ARMAS E SKINS — padrões das skins (canvas), materiais PBR procedurais,
   geometria detalhada das armas (perfis extrudados com chanfro, tornos)
   e acessórios (miras, canos, empunhaduras, laser)
   ===================================================================== */
/* ---------- padrões das skins (canvas) ---------- */
function blob(g, x, y, rad, r) {
  g.beginPath();
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2,
      rr = rad * (0.6 + r() * 0.5),
      px = x + Math.cos(t) * rr * 1.4,
      py = y + Math.sin(t) * rr * 0.8;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
  g.fill();
}
/* texturas de skin vindas de arquivo (CC0, ver LICENCAS): carregam em segundo plano; até chegar, a skin usa um verde escuro liso */
const SKIMG = {};
function skimgInit() {
  try {
    if (typeof assetURL !== 'function') return;
    const u = assetURL('sk_tech.webp', 'image/webp');
    if (!u) return;
    const im = new Image();
    im.onload = () => {
      SKIMG.tech = im;
      for (const k of Object.keys(skinCanvas)) if (/^tatica/.test(k)) delete skinCanvas[k];
      try {
        WGEO_CACHE.clear();
        if (typeof VM !== 'undefined') VM.key = '';
        if (typeof renderMenu === 'function' && typeof G !== 'undefined' && G.phase === 'menu')
          renderMenu();
      } catch (e) {}
    };
    im.src = u;
  } catch (e) {}
}
const PAT = {
  tech: (g, s) => {
    const im = SKIMG.tech;
    if (im) {
      try {
        g.filter = 'brightness(1.9) contrast(1.2) saturate(1.25)';
      } catch (e) {}
      g.drawImage(im, 0, 0, s, s);
      try {
        g.filter = 'none';
      } catch (e) {}
    } else {
      g.fillStyle = '#1d2a1c';
      g.fillRect(0, 0, s, s);
    }
  },
  factory: (g, s, r) => {
    g.fillStyle = '#9a9a9a';
    g.fillRect(0, 0, s, s);
    speckle(g, s, r, 0.06, true);
    g.fillStyle = 'rgba(0,0,0,.07)';
    for (let y = 0; y < s; y += 8) g.fillRect(0, y, s, 1);
  },
  camo: (g, s, r, c) => {
    g.fillStyle = c[0];
    g.fillRect(0, 0, s, s);
    for (let k = 1; k < c.length; k++) {
      g.fillStyle = c[k];
      for (let i = 0; i < 13; i++) blob(g, r() * s, r() * s, 10 + r() * 32, r);
    }
    speckle(g, s, r, 0.04, true);
  },
  digital: (g, s, r, c) => {
    const b = s / 32;
    for (let y = 0; y < s; y += b)
      for (let x = 0; x < s; x += b) {
        g.fillStyle = c[(r() * c.length) | 0];
        g.fillRect(x, y, b, b);
      }
    for (let i = 0; i < 260; i++) {
      g.fillStyle = c[(r() * c.length) | 0];
      g.fillRect(
        ((r() * 32) | 0) * b,
        ((r() * 32) | 0) * b,
        b * (1 + ((r() * 4) | 0)),
        b * (1 + ((r() * 3) | 0))
      );
    }
  },
  tiger: (g, s, r, c) => {
    g.fillStyle = c[0];
    g.fillRect(0, 0, s, s);
    g.fillStyle = c[1];
    for (let i = 0; i < 12; i++) {
      const y0 = r() * s,
        th = 4 + r() * 9,
        amp = 6 + r() * 14,
        fr = 0.02 + r() * 0.03,
        ph = r() * 6;
      g.beginPath();
      for (let x = -10; x <= s + 10; x += 6)
        g.lineTo(x, y0 + Math.sin(x * fr + ph) * amp - th * (0.5 + 0.5 * Math.sin(x * 0.05 + ph)));
      for (let x = s + 10; x >= -10; x -= 6)
        g.lineTo(x, y0 + Math.sin(x * fr + ph) * amp + th * (0.5 + 0.5 * Math.sin(x * 0.05 + ph)));
      g.fill();
    }
    speckle(g, s, r, 0.05, true);
  },
  carbon: (g, s) => {
    g.fillStyle = '#141619';
    g.fillRect(0, 0, s, s);
    const b = 8;
    for (let y = 0; y < s; y += b)
      for (let x = 0; x < s; x += b) {
        const gr = g.createLinearGradient(x, y, x + b, y + b);
        const o = ((x + y) / b) % 2;
        gr.addColorStop(0, o ? '#2a2e33' : '#1a1c20');
        gr.addColorStop(1, o ? '#181a1d' : '#2b2f34');
        g.fillStyle = gr;
        g.fillRect(x + 0.5, y + 0.5, b - 1, b - 1);
      }
  },
  waves: (g, s, r, c) => {
    const gr = g.createLinearGradient(0, 0, 0, s);
    gr.addColorStop(0, c[0]);
    gr.addColorStop(1, c[1]);
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
    g.strokeStyle = c[2];
    for (let i = 0; i < 22; i++) {
      g.globalAlpha = 0.25 + r() * 0.4;
      g.lineWidth = 1 + r() * 3;
      g.beginPath();
      const y0 = r() * s,
        a = 4 + r() * 10,
        f = 0.02 + r() * 0.04,
        p = r() * 6;
      for (let x = 0; x <= s; x += 4) g.lineTo(x, y0 + Math.sin(x * f + p) * a);
      g.stroke();
    }
    g.globalAlpha = 1;
  },
  facets: (g, s, r, c) => {
    g.fillStyle = c[0];
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 120; i++) {
      g.fillStyle = c[(r() * c.length) | 0];
      g.globalAlpha = 0.6 + r() * 0.4;
      g.beginPath();
      const x = r() * s,
        y = r() * s;
      g.moveTo(x, y);
      g.lineTo(x + (r() - 0.5) * 70, y + (r() - 0.5) * 70);
      g.lineTo(x + (r() - 0.5) * 70, y + (r() - 0.5) * 70);
      g.fill();
    }
    g.globalAlpha = 1;
  },
  neon: (g, s, r) => {
    g.fillStyle = '#0c0e14';
    g.fillRect(0, 0, s, s);
    const gc = mkCanvas(s),
      gg = gc.getContext('2d');
    gg.fillStyle = '#000';
    gg.fillRect(0, 0, s, s);
    const cols = ['#28e0ff', '#ff3fb4'];
    for (let i = 0; i < 28; i++) {
      const col = cols[i % 2];
      let x = Math.round(r() * 16) * 16,
        y = Math.round(r() * 16) * 16;
      const pts = [[x, y]];
      for (let k = 0; k < 4; k++) {
        if (r() < 0.5) x += (r() < 0.5 ? -1 : 1) * 16 * (1 + ((r() * 3) | 0));
        else y += (r() < 0.5 ? -1 : 1) * 16 * (1 + ((r() * 3) | 0));
        pts.push([x, y]);
      }
      for (const ctx of [g, gg]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        pts.forEach((p, j) => (j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.fillRect(x - 3, y - 3, 6, 6);
      }
    }
    return gc;
  },
  magma: (g, s, r) => {
    g.fillStyle = '#16100d';
    g.fillRect(0, 0, s, s);
    speckle(g, s, r, 0.08, true);
    const gc = mkCanvas(s),
      gg = gc.getContext('2d');
    gg.fillStyle = '#000';
    gg.fillRect(0, 0, s, s);
    for (let i = 0; i < 18; i++) {
      let x = r() * s,
        y = r() * s;
      const pts = [[x, y]];
      for (let k = 0; k < 10; k++) {
        x += (r() - 0.5) * 40;
        y += (r() - 0.5) * 40;
        pts.push([x, y]);
      }
      for (const ctx of [g, gg]) {
        ctx.strokeStyle = r() < 0.5 ? '#ff7a1a' : '#ffc240';
        ctx.lineWidth = 1 + r() * 3;
        ctx.beginPath();
        pts.forEach((p, j) => (j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
        ctx.stroke();
      }
    }
    return gc;
  },
  gold: (g, s, r) => {
    const gr = g.createLinearGradient(0, 0, s, s);
    gr.addColorStop(0, '#8a6a1f');
    gr.addColorStop(0.45, '#f2d47a');
    gr.addColorStop(1, '#b88a2a');
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(90,60,10,.55)';
    g.lineWidth = 1.5;
    for (let i = 0; i < 40; i++) {
      g.beginPath();
      g.arc(r() * s, r() * s, 4 + r() * 14, r() * 6, r() * 6 + 2.5);
      g.stroke();
    }
  },
  scales: (g, s, r, c) => {
    const gr = g.createLinearGradient(0, 0, s, s);
    gr.addColorStop(0, c[3]);
    gr.addColorStop(1, c[0]);
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
    const R = 11;
    for (let y = -R, row = 0; y < s + R; y += R * 0.75, row++)
      for (let x = -R + (row % 2 ? R : 0); x < s + R; x += R * 2) {
        const k = 0.35 + 0.65 * ((x + y) / (2 * s));
        g.fillStyle = `rgb(${(parseInt(c[1].slice(1, 3), 16) * k) | 0},${(parseInt(c[1].slice(3, 5), 16) * k) | 0},${(parseInt(c[1].slice(5, 7), 16) * k) | 0})`;
        g.beginPath();
        g.arc(x, y, R, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = c[3];
        g.lineWidth = 1.4;
        g.stroke();
        g.strokeStyle = c[2];
        g.globalAlpha = 0.55;
        g.lineWidth = 1.6;
        g.beginPath();
        g.arc(x, y, R - 2.5, Math.PI * 1.05, Math.PI * 1.75);
        g.stroke();
        g.globalAlpha = 1;
      }
  },
  hex: (g, s, r, c) => {
    g.fillStyle = c[3];
    g.fillRect(0, 0, s, s);
    const R = 14,
      w = Math.sqrt(3) * R;
    for (let row = -1, y = 0; y < s + R * 2; row++, y = row * R * 1.5)
      for (let x = -w + (row % 2 ? w / 2 : 0); x < s + w; x += w) {
        const t = (x + y) / (2 * s),
          k = Math.min(1, Math.max(0, t + (r() - 0.5) * 0.25));
        g.fillStyle = k < 0.33 ? c[0] : k < 0.66 ? c[1] : c[2];
        g.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i + Math.PI / 6;
          g.lineTo(x + Math.cos(a) * (R - 1.5), y + Math.sin(a) * (R - 1.5));
        }
        g.closePath();
        g.fill();
      }
  },
  galaxy: (g, s, r) => {
    g.fillStyle = '#07041a';
    g.fillRect(0, 0, s, s);
    const cs = ['rgba(120,40,200,.35)', 'rgba(30,90,230,.3)', 'rgba(220,60,160,.25)'];
    for (let i = 0; i < 26; i++) {
      const x = r() * s,
        y = r() * s,
        rad = 24 + r() * 60,
        gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, cs[i % 3]);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    const gc = mkCanvas(s),
      gg = gc.getContext('2d');
    gg.fillStyle = '#000';
    gg.fillRect(0, 0, s, s);
    for (let i = 0; i < 150; i++) {
      const x = r() * s,
        y = r() * s,
        z = r() < 0.12 ? 2.2 : 1.1;
      for (const ctx of [g, gg]) {
        ctx.fillStyle = r() < 0.2 ? '#aee6ff' : '#ffffff';
        ctx.fillRect(x, y, z, z);
      }
    }
    return gc;
  },
  chrome: (g, s, r) => {
    const gr = g.createLinearGradient(0, 0, s, s * 0.35);
    let p = 0;
    for (let i = 0; i <= 14; i++) {
      const v = i % 2 ? 30 + r() * 50 : 170 + r() * 85;
      gr.addColorStop(i / 14, `rgb(${v | 0},${(v * 1.02) | 0},${(v * 1.08) | 0})`);
    }
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
    g.globalAlpha = 0.25;
    g.fillStyle = '#fff';
    for (let i = 0; i < 8; i++) g.fillRect(r() * s, 0, 1 + r() * 2, s);
    g.globalAlpha = 1;
  },
  leopard: (g, s, r) => {
    g.fillStyle = '#c9a064';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 46; i++) {
      const x = r() * s,
        y = r() * s,
        rad = 7 + r() * 7;
      g.fillStyle = '#b07e3f';
      g.beginPath();
      g.ellipse(x, y, rad, rad * 0.8, r() * 3, 0, 7);
      g.fill();
      g.strokeStyle = '#2e1b0b';
      g.lineWidth = 2.5 + r() * 2;
      for (let k = 0; k < 4; k++) {
        const a0 = r() * 6.3;
        g.beginPath();
        g.ellipse(x, y, rad, rad * 0.8, 0, a0, a0 + 1.1 + r() * 0.9);
        g.stroke();
      }
    }
    speckle(g, s, r, 0.04, true);
  },
  flame: (g, s, r) => {
    g.fillStyle = '#120a08';
    g.fillRect(0, 0, s, s);
    const gc = mkCanvas(s),
      gg = gc.getContext('2d');
    gg.fillStyle = '#000';
    gg.fillRect(0, 0, s, s);
    for (const [col, sc] of [
      ['#c1200c', 1],
      ['#ff6a14', 0.72],
      ['#ffc43a', 0.45],
    ])
      for (let i = 0; i < 22; i++) {
        const x = r() * s,
          h = (60 + r() * 120) * sc,
          w = 10 + r() * 16;
        for (const ctx of [g, gg]) {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.moveTo(x - w, s);
          ctx.bezierCurveTo(
            x - w,
            s - h * 0.5,
            x + w * 0.3,
            s - h * 0.6,
            x + (r() - 0.5) * 10,
            s - h
          );
          ctx.bezierCurveTo(x + w * 0.8, s - h * 0.55, x + w, s - h * 0.3, x + w, s);
          ctx.fill();
        }
      }
    return gc;
  },
  sakura: (g, s, r) => {
    const gr = g.createLinearGradient(0, 0, s, s);
    gr.addColorStop(0, '#f6cfdc');
    gr.addColorStop(1, '#e59ab4');
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
    g.strokeStyle = '#5a3a2e';
    g.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      let x = -5,
        y = r() * s;
      g.moveTo(x, y);
      for (let k = 0; k < 8; k++) {
        x += 36;
        y += (r() - 0.5) * 50;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    for (let i = 0; i < 34; i++) {
      const x = r() * s,
        y = r() * s,
        sz = 6 + r() * 7,
        rot = r() * 6;
      g.fillStyle = r() < 0.5 ? '#fff5f8' : '#ffd9e4';
      for (let p = 0; p < 5; p++) {
        g.beginPath();
        g.ellipse(
          x + Math.cos(rot + p * 1.2566) * sz * 0.7,
          y + Math.sin(rot + p * 1.2566) * sz * 0.7,
          sz * 0.6,
          sz * 0.4,
          rot + p * 1.2566,
          0,
          7
        );
        g.fill();
      }
      g.fillStyle = '#b23a62';
      g.beginPath();
      g.arc(x, y, sz * 0.22, 0, 7);
      g.fill();
    }
  },
  brasil: (g, s) => {
    g.fillStyle = '#0a7a35';
    g.fillRect(0, 0, s, s);
    const t = s / 2;
    for (let ty = 0; ty < 2; ty++)
      for (let tx = 0; tx < 2; tx++) {
        const ox = tx * t,
          oy = ty * t;
        g.fillStyle = '#f4d21a';
        g.beginPath();
        g.moveTo(ox + t / 2, oy + 8);
        g.lineTo(ox + t - 8, oy + t / 2);
        g.lineTo(ox + t / 2, oy + t - 8);
        g.lineTo(ox + 8, oy + t / 2);
        g.closePath();
        g.fill();
        g.fillStyle = '#1c3f94';
        g.beginPath();
        g.arc(ox + t / 2, oy + t / 2, t * 0.24, 0, 7);
        g.fill();
        g.strokeStyle = '#fff';
        g.lineWidth = 3;
        g.beginPath();
        g.arc(ox + t / 2, oy + t * 0.62, t * 0.3, Math.PI * 1.18, Math.PI * 1.82);
        g.stroke();
      }
  },
  wood: (g, s, r) => {
    g.fillStyle = '#6b4423';
    g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 2) {
      const p = r() * 6,
        a = 2 + r() * 6,
        f = 0.01 + r() * 0.02;
      g.strokeStyle = `rgba(${(30 + r() * 40) | 0},${(15 + r() * 20) | 0},5,${0.2 + r() * 0.35})`;
      g.lineWidth = 1 + r() * 1.5;
      g.beginPath();
      for (let x = 0; x <= s; x += 6) g.lineTo(x, y + Math.sin(x * f + p) * a);
      g.stroke();
    }
    for (let i = 0; i < 3; i++) {
      const x = r() * s,
        y = r() * s;
      for (let k = 1; k < 6; k++) {
        g.strokeStyle = 'rgba(30,15,5,.4)';
        g.lineWidth = 1.5;
        g.beginPath();
        g.ellipse(x, y, k * 4, k * 2.2, 0, 0, 7);
        g.stroke();
      }
    }
    g.fillStyle = 'rgba(255,230,170,.08)';
    for (let i = 0; i < 10; i++) g.fillRect(0, r() * s, s, 4);
  },
  holo: (g, s, r) => {
    const gr = g.createLinearGradient(0, 0, s, s);
    for (let i = 0; i <= 10; i++) gr.addColorStop(i / 10, `hsl(${(i * 52) % 360},85%,62%)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
    g.globalAlpha = 0.25;
    for (let i = 0; i < 50; i++) {
      g.fillStyle = r() < 0.5 ? '#fff' : '#000';
      g.fillRect(r() * s, r() * s, r() * 70, 1);
    }
    g.globalAlpha = 1;
  },
  skull: (g, s, r) => {
    g.fillStyle = '#0e0e10';
    g.fillRect(0, 0, s, s);
    const cols = ['#ff4fa0', '#2fe0c0', '#ffc23a'];
    const z = 32;
    for (let y = 0, row = 0; y < s + z; y += z, row++)
      for (let x = row % 2 ? z / 2 : 0; x < s + z; x += z) {
        g.fillStyle = '#f2efe6';
        g.beginPath();
        g.arc(x, y, 9, 0, 7);
        g.fill();
        g.fillRect(x - 5, y + 4, 10, 8);
        g.fillStyle = '#0e0e10';
        g.beginPath();
        g.arc(x - 3.5, y - 1, 2.4, 0, 7);
        g.arc(x + 3.5, y - 1, 2.4, 0, 7);
        g.fill();
        g.fillRect(x - 0.8, y + 3, 1.6, 2);
        g.fillRect(x - 3, y + 9, 1, 3);
        g.fillRect(x + 2, y + 9, 1, 3);
        g.fillStyle = cols[((x / z + row) % 3) | 0];
        g.beginPath();
        g.arc(x + z / 4, y + z / 2, 2.5, 0, 7);
        g.fill();
      }
  },
  toxic: (g, s, r) => {
    g.fillStyle = '#14180c';
    g.fillRect(0, 0, s, s);
    const gc = mkCanvas(s),
      gg = gc.getContext('2d');
    gg.fillStyle = '#000';
    gg.fillRect(0, 0, s, s);
    for (let k = -s; k < s * 2; k += 36)
      for (const [ctx, col] of [
        [g, '#b6e01a'],
        [gg, '#5f9a10'],
      ]) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(k, 0);
        ctx.lineTo(k + 16, 0);
        ctx.lineTo(k + 16 - s * 0.6, s);
        ctx.lineTo(k - s * 0.6, s);
        ctx.fill();
      }
    speckle(g, s, r, 0.06, true);
    return gc;
  },
};
const skinCanvas = {};
Promise.resolve().then(skimgInit);
function skinTex(id, N) {
  N = N || 256;
  const key = N === 256 ? id : id + '@' + N;
  if (skinCanvas[key]) return skinCanvas[key];
  const sk = SKIN[id] || SKIN.padrao,
    c = mkCanvas(N),
    g = c.getContext('2d');
  const glow = PAT[sk.pat](g, N, mulberry(hashStr(id)), sk.cols);
  return (skinCanvas[key] = { canvas: c, glow: glow || null, url: null });
}
function skinThumb(id) {
  const t = skinTex(id);
  if (!t.url) {
    try {
      t.url = t.canvas.toDataURL('image/png');
    } catch (e) {
      t.url = '';
    }
  }
  return t.url;
}
/* cor de fábrica da peça pintada de cada arma (skin "Fábrica") */
const FACTORY = {
  pistol: '#3a3f45',
  onca: '#9a9fa4',
  pardal: '#5d604f',
  abelha: '#34383b',
  jaguar: '#8e9398',
  smg: '#4a5145',
  marimbondo: '#33373a',
  cascavel: '#55594d',
  rifle: '#7a5634',
  jararaca: '#9c8660',
  tupa: '#3f4538',
  shotgun: '#5a4331',
  ressaca: '#3a3d40',
  dmr: '#3d4a55',
  carcara: '#6a5238',
  boitata: '#4a4f42',
};

/* ---------- texturas PBR procedurais compartilhadas (metal anodizado gasto, polímero granulado) ----------
   albedo claro (a cor vem por vértice), normal e ORM (G = rugosidade, B = metal) gerados uma vez em canvas */
const WTEX = {};
function wNoise(S, r, cells) {
  const g = new Float32Array((cells + 1) * (cells + 1));
  for (let i = 0; i < g.length; i++) g[i] = r();
  return (x, y) => {
    const fx = (x / S) * cells,
      fy = (y / S) * cells,
      ix = Math.floor(fx) % cells,
      iy = Math.floor(fy) % cells,
      tx = fx - Math.floor(fx),
      ty = fy - Math.floor(fy),
      sx = tx * tx * (3 - 2 * tx),
      sy = ty * ty * (3 - 2 * ty);
    const a = g[iy * (cells + 1) + ix],
      b = g[iy * (cells + 1) + ((ix + 1) % cells)],
      c = g[((iy + 1) % cells) * (cells + 1) + ix],
      d = g[((iy + 1) % cells) * (cells + 1) + ((ix + 1) % cells)];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}
function wTexSet() {
  if (WTEX.mA) return WTEX;
  const S = 256;
  const mk = (seed, fn) => {
    const r = mulberry(seed),
      sc = mkCanvas(S),
      g = sc.getContext('2d');
    g.fillStyle = '#000';
    g.fillRect(0, 0, S, S);
    fn.marks(g, r, S);
    const md = g.getImageData(0, 0, S, S).data;
    const n1 = wNoise(S, r, 8),
      n2 = wNoise(S, r, 32),
      n3 = wNoise(S, r, 128),
      H = new Float32Array(S * S),
      A = mkCanvas(S),
      N = mkCanvas(S),
      O = mkCanvas(S);
    const ia = A.getContext('2d').createImageData(S, S),
      inn = N.getContext('2d').createImageData(S, S),
      io = O.getContext('2d').createImageData(S, S);
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        const i = y * S + x,
          mark = md[i * 4] / 255,
          blue = md[i * 4 + 2] / 255,
          a = n1(x, y),
          b = n2(x, y),
          c = n3(x, y);
        const v = fn.px(a, b, c, mark, blue);
        H[i] = v.h;
        ia.data[i * 4] = v.al[0] * 255;
        ia.data[i * 4 + 1] = v.al[1] * 255;
        ia.data[i * 4 + 2] = v.al[2] * 255;
        ia.data[i * 4 + 3] = 255;
        io.data[i * 4] = 255;
        io.data[i * 4 + 1] = clamp(v.ro, 0, 1) * 255;
        io.data[i * 4 + 2] = clamp(v.me, 0, 1) * 255;
        io.data[i * 4 + 3] = 255;
      }
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        const i = y * S + x,
          hx = H[y * S + ((x + 1) % S)] - H[y * S + ((x + S - 1) % S)],
          hy = H[((y + 1) % S) * S + x] - H[((y + S - 1) % S) * S + x],
          k = fn.str;
        let nx = -hx * k,
          ny = -hy * k,
          nz = 1;
        const l = Math.hypot(nx, ny, nz);
        inn.data[i * 4] = ((nx / l) * 0.5 + 0.5) * 255;
        inn.data[i * 4 + 1] = ((ny / l) * 0.5 + 0.5) * 255;
        inn.data[i * 4 + 2] = ((nz / l) * 0.5 + 0.5) * 255;
        inn.data[i * 4 + 3] = 255;
      }
    A.getContext('2d').putImageData(ia, 0, 0);
    N.getContext('2d').putImageData(inn, 0, 0);
    O.getContext('2d').putImageData(io, 0, 0);
    return [A, N, O];
  };
  /* metal: usinagem fina numa direção, riscos claros, pites e manchas de oleosidade */
  [WTEX.mA, WTEX.mN, WTEX.mO] = mk(911, {
    str: 2.2,
    marks: (g, r, S) => {
      g.lineCap = 'round';
      for (let i = 0; i < 190; i++) {
        const x = r() * S,
          y = r() * S,
          l = 4 + r() * (r() < 0.15 ? 70 : 18),
          a = (r() < 0.75 ? 0 : r() * Math.PI) + (r() - 0.5) * 0.25;
        g.strokeStyle = `rgba(255,0,0,${0.25 + r() * 0.6})`;
        g.lineWidth = 0.5 + r() * 1.1;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
        g.stroke();
      }
      for (let i = 0; i < 70; i++) {
        g.fillStyle = `rgba(255,0,0,${0.3 + r() * 0.5})`;
        g.beginPath();
        g.arc(r() * S, r() * S, 0.5 + r() * 1.2, 0, 7);
        g.fill();
      }
      for (let i = 0; i < 14; i++) {
        g.fillStyle = `rgba(0,0,255,${0.15 + r() * 0.25})`;
        g.beginPath();
        g.arc(r() * S, r() * S, 6 + r() * 22, 0, 7);
        g.fill();
      }
    },
    px: (a, b, c, mk, bl) => {
      const v = clamp(0.72 + 0.12 * (a - 0.5) + 0.06 * (c - 0.5) - 0.16 * bl + 0.32 * mk, 0, 1);
      return {
        al: [v * 0.97, v * 0.98, v],
        h: (c - 0.5) * 0.06 + (b - 0.5) * 0.05 - mk * 0.5,
        ro: 0.46 + 0.12 * (a - 0.5) + 0.08 * bl - 0.22 * mk,
        me: 0.55 + 0.35 * mk,
      };
    },
  });
  /* polímero: granulado (pontilhado) e leve variação de brilho pelo uso */
  [WTEX.pA, WTEX.pN, WTEX.pO] = mk(377, {
    str: 3.2,
    marks: (g, r, S) => {
      for (let i = 0; i < 5200; i++) {
        g.fillStyle = `rgba(255,0,0,${0.3 + r() * 0.7})`;
        g.beginPath();
        g.arc(r() * S, r() * S, 0.6 + r() * 0.9, 0, 7);
        g.fill();
      }
      for (let i = 0; i < 40; i++) {
        g.strokeStyle = `rgba(0,0,255,${0.2 + r() * 0.4})`;
        g.lineWidth = 0.6;
        g.beginPath();
        const x = r() * S,
          y = r() * S;
        g.moveTo(x, y);
        g.lineTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 30);
        g.stroke();
      }
    },
    px: (a, b, c, mk, bl) => {
      const v = clamp(0.8 + 0.08 * (a - 0.5) + 0.04 * mk + 0.12 * bl, 0, 1);
      return {
        al: [v, v, v * 0.99],
        h: mk * 0.35 + (c - 0.5) * 0.05,
        ro: 0.78 - 0.1 * (a - 0.5) - 0.12 * bl,
        me: 0,
      };
    },
  });
  return WTEX;
}
function wTx(scene, c, lin) {
  const t = new B.DynamicTexture('wt', c, scene, true);
  t.update(false);
  t.wrapU = t.wrapV = B.Texture.WRAP_ADDRESSMODE;
  t.anisotropicFilteringLevel = 8;
  if (lin) t.gammaSpace = false;
  return t;
}
/* reflexo para os metais das armas: panorama simples (teto claro, faixa de janelas, chão escuro) gerado em canvas.
   Sem ele o metal PBR fica preto chapado (a cena não tem mapa de ambiente). */
let WENV_URL = null;
function wEnv(scene) {
  const C = matCache(scene);
  if (C.wEnv !== undefined) return C.wEnv;
  C.wEnv = envTex(scene);
  if (C.wEnv) return C.wEnv; /* IBL da cena (10-engine); o panorama em canvas abaixo é só reserva */
  try {
    if (!WENV_URL)
      WENV_URL = canvasUrl(256, 128, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, '#8d8a84');
        gr.addColorStop(0.42, '#d8d2c6');
        gr.addColorStop(0.5, '#fff6e6');
        gr.addColorStop(0.56, '#9a9288');
        gr.addColorStop(1, '#1d1b19');
        g.fillStyle = gr;
        g.fillRect(0, 0, w, h);
        const r = mulberry(5);
        for (let i = 0; i < 9; i++) {
          g.fillStyle = `rgba(255,250,235,${0.5 + r() * 0.5})`;
          g.fillRect(r() * w, h * 0.34 + r() * h * 0.1, 8 + r() * 26, 4 + r() * 10);
        }
        g.fillStyle = 'rgba(255,255,255,.9)';
        g.fillRect(0, h * 0.06, w, 3);
      });
    const t = new B.EquiRectangularCubeTexture(WENV_URL, scene, 128, false, true);
    C.wEnv = t;
  } catch (e) {
    C.wEnv = null;
  }
  return C.wEnv;
}
function wMats(scene) {
  const C = matCache(scene);
  if (C.wM) return C;
  const T = wTexSet(),
    env = wEnv(scene);
  C.wMN = wTx(scene, T.mN, true);
  C.wPN = wTx(scene, T.pN, true);
  const mk = (name, alb, nrm, orm) => {
    const m = new B.PBRMaterial(name, scene);
    m.albedoTexture = wTx(scene, alb);
    m.bumpTexture = nrm;
    m.bumpTexture.level = 0.8;
    m.metallicTexture = wTx(scene, orm, true);
    m.useRoughnessFromMetallicTextureGreen = true;
    m.useMetallnessFromMetallicTextureBlue = true;
    m.useRoughnessFromMetallicTextureAlpha = false;
    m.metallic = 1;
    m.roughness = 1;
    m.environmentIntensity = 1;
    m.directIntensity = 1.15;
    if (env) m.reflectionTexture = env;
    return m;
  };
  C.wM = mk('wMetal', T.mA, C.wMN, T.mO);
  C.wP = mk('wPoly', T.pA, C.wPN, T.pO);
  C.wG = pbr(scene, { color: '#a9c9d6', rough: 0.04, alpha: 0.035, env: 0.08 });
  C.wG.backFaceCulling = false;
  C.wR = unlit(scene, '#ff3324');
  C.wV = pbr(scene, { color: '#ffffff', rough: 0.55, metal: 0.3 });
  if (env) {
    C.wV.reflectionTexture = env;
    C.wG.reflectionTexture = env;
    C.wG.environmentIntensity = 0.3;
  }
  return C;
}
function weaponMat(scene, wid, sid) {
  wid = wBase(wid);
  const C = matCache(scene),
    k = 'w|' + wid + '|' + sid;
  if (C[k]) return C[k];
  const sk = SKIN[sid] || SKIN.padrao,
    t = skinTex(sk.id),
    W = wMats(scene);
  const m = pbr(scene, {
    tex: dyn(scene, t.canvas),
    rough:
      sk.rough != null ? sk.rough : sk.pat === 'gold' ? 0.25 : sk.pat === 'carbon' ? 0.35 : 0.48,
    metal: sk.metal != null ? sk.metal : sk.pat === 'gold' ? 0.9 : 0.3,
    color: sk.id === 'padrao' ? FACTORY[wid] || '#4a4d50' : null,
  });
  m.bumpTexture =
    W.wSN ||
    (W.wSN = (() => {
      const t = wTx(scene, wTexSet().mN, true);
      t.level = 0.45;
      return t;
    })()); /* mesmos riscos/usinagem do metal, mais suaves, por baixo da pintura */
  {
    const env = wEnv(scene);
    if (env) {
      m.reflectionTexture = env;
      m.environmentIntensity = 0.55; /* reflexo mais baixo: arma escura tática, sem "prateado" no sol */
    }
  }
  if (t.glow) {
    m.emissiveTexture = dyn(scene, t.glow);
    m.emissiveColor = new B.Color3(1, 1, 1);
    m.emissiveIntensity = 1.2;
  }
  return (C[k] = m);
}

/* ---------- construtor de geometria (sem malhas intermediárias) ----------
   Cada peça vai para um "balde" (grupo animável × material). Perfis 2D são extrudados com
   chanfro nas quinas (a faixa do chanfro recebe cor mais clara = desgaste da pintura). */
const _wl = {};
function wLin(hex) {
  if (_wl[hex]) return _wl[hex];
  const c = C3(hex).toLinearSpace();
  return (_wl[hex] = [c.r, c.g, c.b]);
}
const WEAR = { M: [1.9, 0.03], S: [1.3, 0.02], P: [1.25, 0.012], G: [1, 0], R: [1, 0] };
const WDEF = { M: '#2c2f32', P: '#1e2022', S: '#ffffff', G: '#ffffff', R: '#ffffff' };
function WGeo(low) {
  const G = {},
    UK = 1 / 0.15;
  let T = 'gun',
    O = [0, 0, 0];
  const bk = (m) => {
    const k = T + '|' + m;
    return G[k] || (G[k] = { t: T, m, P: [], N: [], U: [], C: [], I: [] });
  };
  const xf = (o) => {
    const rx = o.rx || 0,
      ry = o.ry || 0,
      rz = o.rz || 0,
      px = (o.x || 0) - O[0],
      py = (o.y || 0) - O[1],
      pz = (o.z || 0) - O[2],
      cx = Math.cos(rx),
      sx = Math.sin(rx),
      cy = Math.cos(ry),
      sy = Math.sin(ry),
      cz = Math.cos(rz),
      sz = Math.sin(rz);
    const rot = (v) => {
      const x1 = v[0] * cz - v[1] * sz,
        y1 = v[0] * sz + v[1] * cz,
        z1 = v[2],
        y2 = y1 * cx - z1 * sx,
        z2 = y1 * sx + z1 * cx;
      return [x1 * cy + z2 * sy, y2, -x1 * sy + z2 * cy];
    };
    return {
      p: (v) => {
        const r = rot(v);
        return [r[0] + px, r[1] + py, r[2] + pz];
      },
      n: rot,
    };
  };
  /* polígono plano (tri/quad) com normal plana; corrige o sentido para a face da frente do Babylon */
  const face = (b, pts, n, uv, col) => {
    const i0 = b.P.length / 3;
    for (let k = 0; k < pts.length; k++) {
      b.P.push(pts[k][0], pts[k][1], pts[k][2]);
      b.N.push(n[0], n[1], n[2]);
      b.U.push(uv[k][0], uv[k][1]);
      b.C.push(col[0], col[1], col[2], 1);
    }
    const a = pts[0],
      p1 = pts[1],
      p2 = pts[2],
      e1 = [p1[0] - a[0], p1[1] - a[1], p1[2] - a[2]],
      e2 = [p2[0] - a[0], p2[1] - a[1], p2[2] - a[2]],
      cr = [
        e1[1] * e2[2] - e1[2] * e2[1],
        e1[2] * e2[0] - e1[0] * e2[2],
        e1[0] * e2[1] - e1[1] * e2[0],
      ],
      fl = cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] > 0;
    for (let k = 1; k < pts.length - 1; k++)
      fl ? b.I.push(i0, i0 + k + 1, i0 + k) : b.I.push(i0, i0 + k, i0 + k + 1);
  };
  const nrm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const area = (P) => {
    let s = 0;
    for (let i = 0; i < P.length; i++) {
      const a = P[i],
        b = P[(i + 1) % P.length];
      s += a[0] * b[1] - b[0] * a[1];
    }
    return s / 2;
  };
  /* triangulação por orelhas (aceita polígono côncavo, ex.: guarda-mato em U) */
  const earcut2 = (P) => {
    const idx = P.map((_, i) => i),
      tris = [];
    const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const inside = (p, a, b, c) =>
      cross(a, b, p) >= -1e-12 && cross(b, c, p) >= -1e-12 && cross(c, a, p) >= -1e-12;
    let guard = 0;
    while (idx.length > 3 && guard++ < 500) {
      let cut = false;
      for (let i = 0; i < idx.length; i++) {
        const ia = idx[(i + idx.length - 1) % idx.length],
          ib = idx[i],
          ic = idx[(i + 1) % idx.length],
          a = P[ia],
          b = P[ib],
          c = P[ic];
        if (cross(a, b, c) <= 1e-12) continue;
        let ok = true;
        for (const j of idx) {
          if (j === ia || j === ib || j === ic) continue;
          if (inside(P[j], a, b, c)) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
        tris.push([ia, ib, ic]);
        idx.splice(i, 1);
        cut = true;
        break;
      }
      if (!cut) break;
    }
    if (idx.length === 3) tris.push([idx[0], idx[1], idx[2]]);
    return tris;
  };
  const W = {
    tgt(name, origin) {
      T = name;
      O = origin || [0, 0, 0];
    },
    getT() {
      return T;
    },
    /* prisma: perfil [[u,v]] extrudado em w. ax:'x' perfil lateral (z,y) · 'z' perfil frontal (x,y) · 'y' perfil de cima (x,z) */
    prism(prof, depth, o) {
      o = o || {};
      const m = o.m || 'M',
        c0 = wLin(o.c || WDEF[m]),
        wr = WEAR[m] || WEAR.P,
        cw = [c0[0] * wr[0] + wr[1], c0[1] * wr[0] + wr[1], c0[2] * wr[0] + wr[1]];
      let P = prof.map((p) => [p[0], p[1]]);
      if (area(P) < 0) P.reverse();
      const n = P.length,
        hw = depth / 2,
        b = low || o.b === 0 ? 0 : Math.min(o.b != null ? o.b : 0.0014, hw * 0.45),
        ax = o.ax || 'x',
        X = xf(o),
        bkt = bk(m);
      const map =
        ax === 'x'
          ? (u, v, w) => [w, v, u]
          : ax === 'z'
            ? (u, v, w) => [u, v, w]
            : (u, v, w) => [u, w, v];
      const en = [];
      for (let i = 0; i < n; i++) {
        const a = P[i],
          c = P[(i + 1) % n],
          du = c[0] - a[0],
          dv = c[1] - a[1],
          l = Math.hypot(du, dv) || 1;
        en.push([dv / l, -du / l]);
      }
      const Pi = b
        ? P.map((p, i) => {
            const n1 = en[(i + n - 1) % n],
              n2 = en[i];
            let mx = n1[0] + n2[0],
              my = n1[1] + n2[1];
            const dd = 1 + n1[0] * n2[0] + n1[1] * n2[1];
            let k = dd > 0.15 ? 1 / dd : 6.6;
            mx *= k;
            my *= k;
            const ml = Math.hypot(mx, my);
            if (ml > 2.5) {
              mx *= 2.5 / ml;
              my *= 2.5 / ml;
            }
            return [p[0] - b * mx, p[1] - b * my];
          })
        : P;
      const W3 = (p, w) => X.p(map(p[0], p[1], w)),
        N3 = (nu, nv, nw) => nrm(X.n(map(nu, nv, nw)));
      let s = 0;
      for (let i = 0; i < n; i++) {
        const a = P[i],
          c = P[(i + 1) % n],
          l = Math.hypot(c[0] - a[0], c[1] - a[1]),
          e = en[i],
          s1 = s + l;
        face(
          bkt,
          [W3(a, -hw + b), W3(c, -hw + b), W3(c, hw - b), W3(a, hw - b)],
          N3(e[0], e[1], 0),
          [
            [s * UK, (-hw + b) * UK],
            [s1 * UK, (-hw + b) * UK],
            [s1 * UK, (hw - b) * UK],
            [s * UK, (hw - b) * UK],
          ],
          c0
        );
        if (b) {
          const ai = Pi[i],
            ci = Pi[(i + 1) % n];
          for (const sg of [1, -1])
            face(
              bkt,
              [W3(a, sg * (hw - b)), W3(c, sg * (hw - b)), W3(ci, sg * hw), W3(ai, sg * hw)],
              N3(e[0] * 0.7, e[1] * 0.7, sg * 0.7),
              [
                [s * UK, sg * (hw - b) * UK],
                [s1 * UK, sg * (hw - b) * UK],
                [s1 * UK, sg * hw * UK],
                [s * UK, sg * hw * UK],
              ],
              cw
            );
        }
        s = s1;
      }
      const tr = earcut2(Pi);
      for (const sg of [1, -1]) {
        const nn = N3(0, 0, sg);
        for (const t of tr) {
          const q = t.map((j) => Pi[j]);
          face(
            bkt,
            q.map((p) => W3(p, sg * hw)),
            nn,
            q.map((p) => [p[0] * UK, p[1] * UK]),
            c0
          );
        }
      }
    },
    box(w, h, d, x, y, z, o) {
      o = Object.assign({}, o || {}, { x, y, z });
      W.prism(
        [
          [-d / 2, -h / 2],
          [d / 2, -h / 2],
          [d / 2, h / 2],
          [-d / 2, h / 2],
        ],
        w,
        o
      );
    },
    /* torno: perfil [[r,a]] em volta do eixo (z padrão; 'x' ou 'y'); faixas com normal própria (quinas usinadas) */
    lathe(prof, o) {
      o = o || {};
      {
        const f = prof[0],
          L = prof[prof.length - 1];
        if (!(f[0] === L[0] && f[1] === L[1]) && L[1] < f[1]) {
          prof = prof.slice().reverse();
          if (o.wear) o = Object.assign({}, o, { wear: o.wear.map((j) => prof.length - 2 - j) });
        }
      } /* perfil sempre no sentido +eixo pelo lado de fora */
      const m = o.m || 'M',
        c0 = wLin(o.c || WDEF[m]),
        wr = WEAR[m] || WEAR.P,
        cw = [c0[0] * wr[0] + wr[1], c0[1] * wr[0] + wr[1], c0[2] * wr[0] + wr[1]],
        bkt = bk(m),
        X = xf(o);
      const n = Math.max(o.n && o.n < 9 ? o.n : 5, Math.round((o.n || 16) * (low ? 0.5 : 1))),
        ph = o.ph || 0,
        ax = o.ax || 'z',
        a0 = o.a0 || 0,
        a1 = o.a1 || Math.PI * 2,
        full = a1 - a0 > 6.28;
      const pt = (r, a, t) => {
        const cx = Math.cos(t) * r,
          sy = Math.sin(t) * r;
        return X.p(ax === 'z' ? [cx, sy, a] : ax === 'x' ? [a, sy, cx] : [cx, a, sy]);
      };
      const dir = (nr, na, t) => {
        const cx = Math.cos(t) * nr,
          sy = Math.sin(t) * nr;
        return nrm(X.n(ax === 'z' ? [cx, sy, na] : ax === 'x' ? [na, sy, cx] : [cx, na, sy]));
      };
      for (let j = 0; j < prof.length - 1; j++) {
        const p = prof[j],
          q = prof[j + 1],
          dr = q[0] - p[0],
          da = q[1] - p[1],
          l = Math.hypot(dr, da);
        if (l < 1e-6) continue;
        const nr = da / l,
          na = -dr / l,
          col = o.wear && o.wear.includes(j) ? cw : c0;
        for (let i = 0; i < n; i++) {
          const t0 = a0 + ph + ((a1 - a0) * i) / n,
            t1 = a0 + ph + ((a1 - a0) * (i + 1)) / n,
            tm = (t0 + t1) / 2;
          face(
            bkt,
            [pt(p[0], p[1], t0), pt(p[0], p[1], t1), pt(q[0], q[1], t1), pt(q[0], q[1], t0)],
            dir(nr, na, o.flat ? tm : tm),
            [
              [t0 * p[0] * UK, p[1] * UK],
              [t1 * p[0] * UK, p[1] * UK],
              [t1 * q[0] * UK, q[1] * UK],
              [t0 * q[0] * UK, q[1] * UK],
            ],
            col
          );
        }
      }
      const capd = (p, sg) => {
        if (p[0] <= 1e-5 || !full) return;
        const ctr = X.p(ax === 'z' ? [0, 0, p[1]] : ax === 'x' ? [p[1], 0, 0] : [0, p[1], 0]),
          nn = dir(0, sg, 0);
        for (let i = 0; i < n; i++) {
          const t0 = ph + (Math.PI * 2 * i) / n,
            t1 = ph + (Math.PI * 2 * (i + 1)) / n;
          face(
            bkt,
            [ctr, pt(p[0], p[1], t0), pt(p[0], p[1], t1)],
            nn,
            [
              [0, 0],
              [Math.cos(t0) * p[0] * UK, Math.sin(t0) * p[0] * UK],
              [Math.cos(t1) * p[0] * UK, Math.sin(t1) * p[0] * UK],
            ],
            c0
          );
        }
      };
      const f = prof[0],
        L = prof[prof.length - 1];
      if (!(f[0] === L[0] && f[1] === L[1]) && o.cap !== false) {
        capd(f, -1);
        capd(L, 1);
      }
    },
    cyl(r, len, x, y, z, o) {
      o = o || {};
      const ch = low ? 0 : Math.min(o.ch != null ? o.ch : 0.0009, len / 4, r / 3),
        r2 = o.r2 != null ? o.r2 : r;
      W.lathe(
        [
          [r - ch, -len / 2],
          [r, -len / 2 + ch],
          [r2, len / 2 - ch],
          [r2 - ch, len / 2],
        ],
        Object.assign({}, o, { x, y, z, wear: [0, 2] })
      );
    },
    tube(ro, ri, len, x, y, z, o) {
      W.lathe(
        [
          [ri, -len / 2],
          [ro, -len / 2],
          [ro, len / 2],
          [ri, len / 2],
          [ri, -len / 2],
        ],
        Object.assign({}, o || {}, { x, y, z, wear: [0, 2] })
      );
    },
    ring(R, rr, x, y, z, o) {
      const pr = [];
      const k = low ? 6 : 10;
      for (let i = 0; i <= k; i++) {
        const t = -Math.PI / 2 + (Math.PI * 2 * i) / k;
        pr.push([R + rr * Math.cos(t), rr * Math.sin(t)]);
      }
      W.lathe(pr, Object.assign({}, o || {}, { x, y, z, cap: false }));
    },
    low,
    G,
  };
  return W;
}

/* ---------- peças reutilizáveis ---------- */
/* trilho Picatinny: base em rabo de andorinha + dentes com ranhuras */
function wRail(W, z0, z1, y, o) {
  o = o || {};
  const len = Math.abs(z1 - z0),
    zc = (z0 + z1) / 2,
    wd = o.w || 0.021,
    m = o.m || 'M',
    c = o.c;
  W.prism(
    [
      [-wd / 2, 0],
      [wd / 2, 0],
      [wd / 2 + 0.002, 0.003],
      [wd / 2 - 0.001, 0.0045],
      [-wd / 2 + 0.001, 0.0045],
      [-wd / 2 - 0.002, 0.003],
    ],
    len,
    Object.assign({ ax: 'z', m, c, x: o.x || 0, y, z: zc, rz: o.rz || 0 }, { b: 0.0006 })
  );
  if (!W.low) {
    const n = Math.floor(len / 0.0101),
      rz = o.rz || 0,
      ox = -0.006 * Math.sin(rz),
      oy = 0.006 * Math.cos(rz);
    for (let i = 0; i < n; i++)
      W.box(
        wd + 0.004,
        0.003,
        0.0052,
        (o.x || 0) + ox,
        y + oy,
        Math.min(z0, z1) + 0.005 + i * 0.0101 + 0.0026,
        { m, c, b: 0.0007, rz }
      );
  }
}
/* carregador curvo (perfil gerado por curva) com nervuras e base */
function wMag(W, o) {
  const L = o.len,
    cur = o.curve || 0,
    zf = o.zf,
    zr = o.zr,
    w = o.w || 0.026,
    m = o.m || 'M',
    c = o.c || '#36393c',
    pts = [],
    N = 10;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    pts.push([zr - cur * t * t * 0.9, -L * t]);
  }
  for (let i = N; i >= 0; i--) {
    const t = i / N;
    pts.push([zf - cur * t * t - (o.taper || 0) * t, -L * t]);
  }
  W.prism(pts, w, { m, c, b: 0.0012 });
  if (!W.low && o.ribs !== false) {
    for (const s of [-1, 1]) {
      const rp = [];
      for (let i = 2; i <= 8; i++) {
        const t = i / N;
        rp.push([(zr + zf) / 2 - cur * t * t * 0.95 + 0.012, -L * t]);
      }
      for (let i = 8; i >= 2; i--) {
        const t = i / N;
        rp.push([(zr + zf) / 2 - cur * t * t * 0.95 - 0.012, -L * t]);
      }
      W.prism(rp, 0.003, { m, c, x: s * (w / 2 + 0.0005), b: 0.0005 });
    }
  }
  const tb = 1,
    zb0 = zr - cur * 0.9 - 0.004,
    zb1 = zf - cur - (o.taper || 0) - 0.004;
  W.prism(
    [
      [zb0 + 0.006, -L + 0.002],
      [zb1 - 0.004, -L + 0.002],
      [zb1 - 0.004, -L - 0.012],
      [zb0 + 0.004, -L - 0.014],
    ],
    w + 0.006,
    { m: o.bm || 'P', c: o.bc || '#1c1d1f', b: 0.002 }
  );
}
/* pistola de mão (empunhadura em ângulo com ranhuras para os dedos) */
function wPGrip(W, z, y, o) {
  o = o || {};
  const a = o.ang == null ? 0.3 : o.ang,
    h = o.h || 0.11,
    s = Math.tan(a),
    c = o.c || '#1d1f21';
  const P = [
    [-0.022, 0],
    [0.026, 0],
    [0.03 + h * s * 0.25, -0.02],
    [0.028 + h * s, -h],
    [0.022 + h * s, -h - 0.008],
    [-0.012 + h * s, -h - 0.008],
    [-0.02 + h * s, -h + 0.006],
  ];
  for (let i = 3; i >= 1; i--) {
    const t = i / 4;
    P.push([-0.022 + h * s * t - 0.003, -h * t + 0.012], [-0.019 + h * s * t, -h * t + 0.002]);
  }
  W.prism(
    P.map((p) => [p[0] + z, p[1] + y]),
    o.w || 0.033,
    { m: 'P', c, b: 0.0035 }
  );
}
/* guarda-mato em U + gatilho */
function wGuard(W, z, y, o) {
  o = o || {};
  const l = o.l || 0.07,
    d = o.d || 0.034,
    t = 0.0055,
    m = o.m || 'M',
    c = o.c;
  W.prism(
    [
      [z + l / 2, y],
      [z + l / 2, y - d + 0.006],
      [z + l / 2 - 0.008, y - d],
      [z - l / 2 + 0.005, y - d],
      [z - l / 2 - 0.004, y - d + 0.012],
      [z - l / 2 - 0.006, y],
      [z - l / 2 - 0.006 + t, y],
      [z - l / 2 - 0.004 + t, y - d + t + 0.01],
      [z - l / 2 + 0.006, y - d + t],
      [z + l / 2 - t - 0.006, y - d + t],
      [z + l / 2 - t, y - d + t + 0.004],
      [z + l / 2 - t, y],
    ],
    0.011,
    { m, c, b: 0.0012 }
  );
  W.prism(
    [
      [z + 0.006, y + 0.002],
      [z + 0.004, y - 0.014],
      [z - 0.002, y - 0.024],
      [z - 0.006, y - 0.026],
      [z - 0.003, y - 0.02],
      [z + 0.0015, y - 0.012],
      [z + 0.011, y + 0.002],
    ],
    0.006,
    { m: 'M', c: '#3b3e41', b: 0.0008 }
  );
}
/* parafusos/pinos vistos dos dois lados */
function wPins(W, list, wd) {
  if (W.low) return;
  for (const [z, y, r] of list)
    W.cyl(r || 0.0032, wd + 0.002, 0, y, z, { ax: 'x', m: 'M', c: '#4a4d50', n: 10 });
}

/* ---------- miras ----------
   cada uma devolve o ponto do eixo óptico (info.sight) e a distância do olho no ADS */
function wSight(W, kind, z0, y, info, o) {
  o = o || {};
  const pt = W.getT ? W.getT() : 'gun';
  if (kind !== 'iron' && pt === 'gun') W.tgt('sight');
  try {
    return wSight0(W, kind, z0, y, info, o);
  } finally {
    if (kind !== 'iron' && pt === 'gun') W.tgt('gun');
  }
}
function wSight0(W, kind, z0, y, info, o) {
  const low = W.low,
    M = 'M';
  const mount = (z, h, l) => {
    W.box(0.026, h, l || 0.03, 0, y + h / 2, z, { m: M, c: '#26292b' });
    if (!low) {
      W.box(0.006, 0.008, 0.012, 0.016, y + 0.006, z, { m: M, c: '#3a3d40' });
      W.cyl(0.0035, 0.006, 0.02, y + 0.006, z, { ax: 'x', m: M, c: '#55585b', n: 8 });
    }
  };
  let ax = y,
    eye = 0.2,
    zs = z0;
  if (kind === 'red') {
    ax = y + 0.036;
    mount(z0, 0.016, 0.035);
    W.tube(0.019, 0.0165, 0.07, 0, ax, z0, { m: M, c: '#202224', n: 22 });
    W.tube(0.0205, 0.019, 0.016, 0, ax, z0 - 0.032, { m: M, c: '#2b2d30', n: 22 });
    W.cyl(0.0165, 0.0012, 0, ax, z0 - 0.03, { m: 'G' });
    if (!low) {
      W.cyl(0.007, 0.012, 0.0, ax + 0.022, z0, { ax: 'y', m: M, c: '#2a2c2e', n: 12 });
      W.cyl(0.007, 0.012, 0.022, ax, z0, { ax: 'x', m: M, c: '#2a2c2e', n: 12 });
    }
    W.cyl(0.0016, 0.0008, 0, ax, z0 - 0.029, { m: 'R', n: 8 });
    zs = z0 + 0.035;
    eye = 0.13;
  } else if (kind === 'holo') {
    ax = y + 0.031;
    W.prism(
      [
        [z0 + 0.04, y],
        [z0 - 0.04, y],
        [z0 - 0.04, y + 0.013],
        [z0 + 0.04, y + 0.013],
      ],
      0.036,
      { m: M, c: '#232527', b: 0.002 }
    );
    for (const s of [-1, 1])
      W.prism(
        [
          [z0 + 0.026, y + 0.012],
          [z0 - 0.03, y + 0.012],
          [z0 - 0.034, y + 0.056],
          [z0 + 0.02, y + 0.056],
        ],
        0.005,
        { m: M, c: '#26282a', x: s * 0.026, b: 0.0012 }
      );
    W.prism(
      [
        [z0 + 0.022, y + 0.052],
        [z0 - 0.036, y + 0.052],
        [z0 - 0.036, y + 0.06],
        [z0 + 0.018, y + 0.06],
      ],
      0.057,
      { m: M, c: '#26282a', b: 0.0018 }
    );
    W.box(0.048, 0.04, 0.0012, 0, ax + 0.003, z0 - 0.022, { m: 'G' });
    W.ring(0.0105, 0.0006, 0, ax, z0 - 0.0215, { m: 'R' });
    W.box(0.0018, 0.0018, 0.0008, 0, ax, z0 - 0.0218, { m: 'R' });
    if (!low) {
      W.box(0.014, 0.012, 0.02, 0.03, y + 0.008, z0 + 0.022, { m: M, c: '#1c1e20' });
      for (let i = 0; i < 3; i++)
        W.box(0.004, 0.003, 0.006, 0.0, y + 0.0145, z0 + 0.03 - i * 0.009, { m: 'P', c: '#111' });
      W.cyl(0.005, 0.01, -0.022, y + 0.008, z0 + 0.02, { ax: 'x', m: M, c: '#3a3c3e', n: 10 });
    }
    zs = z0 + 0.03;
    eye = 0.14;
  } else if (kind === 'reflex') {
    ax = y + 0.021;
    W.prism(
      [
        [z0 + 0.022, y],
        [z0 - 0.022, y],
        [z0 - 0.018, y + 0.01],
        [z0 + 0.02, y + 0.01],
      ],
      0.03,
      { m: M, c: '#232527', b: 0.0016 }
    );
    for (const sx of [-1, 1])
      W.prism(
        [
          [z0 - 0.004, y + 0.008],
          [z0 - 0.018, y + 0.008],
          [z0 - 0.021, y + 0.036],
          [z0 - 0.01, y + 0.036],
        ],
        0.005,
        { m: M, c: '#25272a', x: sx * 0.0145, b: 0.001 }
      ); /* moldura vazada: dá para ver através */
    W.prism(
      [
        [z0 - 0.008, y + 0.033],
        [z0 - 0.022, y + 0.033],
        [z0 - 0.022, y + 0.039],
        [z0 - 0.01, y + 0.039],
      ],
      0.034,
      { m: M, c: '#25272a', b: 0.001 }
    );
    W.box(0.024, 0.022, 0.0012, 0, ax + 0.002, z0 - 0.0125, { m: 'G', rx: -0.12 });
    W.box(0.0022, 0.0022, 0.0008, 0, ax, z0 - 0.0128, { m: 'R' });
    zs = z0 + 0.02;
    eye = 0.13;
  } else if (kind === 'x15' || kind === 'x2' || kind === 'x25') {
    const L = kind === 'x15' ? 0.15 : kind === 'x2' ? 0.105 : 0.13,
      ro = kind === 'x15' ? 0.022 : kind === 'x2' ? 0.02 : 0.024,
      rb = kind === 'x15' ? 0.0155 : 0.017;
    ax = y + (kind === 'x15' ? 0.034 : 0.036);
    const zf = z0 - L / 2,
      zr = z0 + L / 2;
    if (kind === 'x2') {
      const z1 = zr - 0.01,
        z2 =
          zf + 0.02; /* corpo vazado: laterais + teto + base, o meio fica aberto para ver o alvo */
      for (const sx of [-1, 1])
        W.prism(
          [
            [z1, ax - 0.019],
            [z2, ax - 0.019],
            [z2, ax + 0.016],
            [z1, ax + 0.016],
          ],
          0.005,
          { m: M, c: '#2a2c2f', x: sx * 0.0195, b: 0.002 }
        );
      W.prism(
        [
          [z1, ax + 0.016],
          [z2, ax + 0.016],
          [z2, ax + 0.009],
          [z1, ax + 0.009],
        ],
        0.042,
        { m: M, c: '#2a2c2f', b: 0.002 }
      );
      W.prism(
        [
          [z1, ax - 0.019],
          [z2, ax - 0.019],
          [z2, ax - 0.012],
          [z1, ax - 0.012],
        ],
        0.042,
        { m: M, c: '#2a2c2f', b: 0.002 }
      );
    } else
      W.lathe(
        [
          [ro - 0.002, zf],
          [ro, zf + 0.002],
          [ro, zf + 0.03],
          [rb, zf + 0.05],
          [rb, zr - 0.04],
          [rb + 0.002, zr - 0.034],
          [0.019, zr - 0.012],
          [0.0185, zr],
        ],
        { x: 0, y: ax, z: 0, m: M, c: '#25272a', n: 24, wear: [2, 6], cap: false }
      );
    W.tube(ro, ro - 0.0035, 0.012, 0, ax, zf + 0.006, { m: M, c: '#1f2123', n: 24 });
    if (kind === 'x2')
      W.tube(0.0185, 0.016, 0.02, 0, ax, zr - 0.01, { m: 'P', c: '#141516', n: 20 });
    else W.tube(0.0185, 0.0158, 0.024, 0, ax, zr - 0.004, { m: 'P', c: '#141516', n: 20 });
    for (const z of [zf + 0.035, zr - 0.045]) mount(z, ax - y - 0.012, 0.016);
    if (!low) {
      W.cyl(0.0075, 0.016, 0, ax + rb + 0.006, z0, { ax: 'y', m: M, c: '#2e3033', n: 14 });
      W.cyl(0.0075, 0.016, rb + 0.006, ax, z0, { ax: 'x', m: M, c: '#2e3033', n: 14 });
      if (kind === 'x25') {
        W.cyl(0.0035, 0.08, 0, ax + rb + 0.004, z0 + 0.015, { m: 'P', c: '#4a3a12', n: 8 });
        W.cyl(0.0037, 0.004, 0, ax + rb + 0.004, z0 - 0.026, { m: 'P', c: '#2a2c2e', n: 8 });
      }
    }
    /* retícula na lente de trás: ponto/chevron vermelho + cruz fina */
    const zr0 = zr - 0.009;
    if (kind === 'x25') {
      W.prism(
        [
          [0, 0],
          [0.0035, -0.004],
          [0.0024, -0.0046],
          [0, -0.0018],
          [-0.0024, -0.0046],
          [-0.0035, -0.004],
        ],
        0.0006,
        { ax: 'z', m: 'R', x: 0, y: ax + 0.0016, z: zr0, b: 0 }
      );
    } else W.cyl(0.0013, 0.0006, 0, ax, zr0, { m: 'R', n: 8 });
    if (!low) {
      W.box(0.026, 0.0006, 0.0004, 0, ax, zr0 - 0.0004, { m: 'P', c: '#050505', b: 0 });
      W.box(0.0006, 0.026, 0.0004, 0, ax, zr0 - 0.0004, { m: 'P', c: '#050505', b: 0 });
    }
    zs = zr0;
    eye = 0.15;
  } /* olho mais longe: o anel da luneta não toma a tela; a lente é transparente (sem vidro leitoso) */
  else {
    /* de ferro: alça de mira com furo (atrás) + massa de mira (frente) */
    ax = y + 0.028;
    const zr = o.ironRear != null ? o.ironRear : z0 + 0.02,
      zf = o.ironFront != null ? o.ironFront : z0 - 0.3;
    W.prism(
      [
        [zr + 0.012, y],
        [zr - 0.012, y],
        [zr - 0.01, y + 0.016],
        [zr + 0.01, y + 0.016],
      ],
      0.024,
      { m: M, c: '#232527' }
    );
    W.prism(
      [
        [zr + 0.003, y + 0.014],
        [zr - 0.003, y + 0.014],
        [zr - 0.003, ax - 0.0062],
        [zr + 0.003, ax - 0.0062],
      ],
      0.012,
      { m: M, c: '#232527' }
    );
    for (const sx of [-1, 1])
      W.prism(
        [
          [zr + 0.004, y + 0.012],
          [zr - 0.004, y + 0.012],
          [zr - 0.003, ax + 0.009],
          [zr + 0.003, ax + 0.009],
        ],
        0.004,
        { m: M, c: '#232527', x: sx * 0.0105 }
      );
    W.tube(0.0062, 0.0028, 0.004, 0, ax, zr - 0.002, {
      m: M,
      c: '#1d1f21',
      n: 14,
    }); /* alça vazada (furo de mira) */
    if (o.frontPost !== false) {
      const fy = o.frontY != null ? o.frontY : y;
      W.prism(
        [
          [zf + 0.012, fy],
          [zf - 0.012, fy],
          [zf - 0.008, ax - 0.004],
          [zf + 0.006, ax - 0.004],
        ],
        0.022,
        { m: M, c: '#232527' }
      );
      for (const s of [-1, 1])
        W.box(0.003, 0.016, 0.008, s * 0.008, ax + 0.002, zf, { m: M, c: '#232527' });
      W.box(0.0022, 0.012, 0.0022, 0, ax - 0.006, zf, { m: M, c: '#3a3c3e', b: 0 });
    }
    zs = zr - 0.002;
    eye = 0.085;
  }
  info.sight.set(0, ax, zs);
  info.eye = eye;
  return ax;
}
/* cano: supressor, quebra-chama, compensador, freio de boca, cano longo (ou o bico de fábrica) */
function wMuzzle(W, kind, z, y, r, info, def) {
  const low = W.low;
  let tip = z;
  if (kind === 'sup') {
    const L = 0.16,
      R = Math.max(0.017, r * 1.9);
    W.lathe(
      [
        [r + 0.002, z],
        [R - 0.003, z - 0.004],
        [R, z - 0.008],
        [R, z - L + 0.006],
        [R - 0.004, z - L],
        [0.005, z - L],
      ],
      { x: 0, y, z: 0, m: 'M', c: '#26282a', n: 22, wear: [1, 3] }
    );
    if (!low)
      for (let i = 0; i < 3; i++)
        W.ring(R + 0.0004, 0.0012, 0, y, z - 0.03 - i * 0.05, { m: 'M', c: '#1b1c1e' });
    tip = z - L;
  } else if (kind === 'comp') {
    W.lathe(
      [
        [r + 0.001, z],
        [r * 1.55, z - 0.004],
        [r * 1.55, z - 0.05],
        [r * 1.2, z - 0.054],
        [0.004, z - 0.054],
      ],
      { x: 0, y, z: 0, m: 'M', c: '#2e3134', n: 16, wear: [1, 3] }
    );
    if (!low)
      for (let i = 0; i < 3; i++)
        W.box(0.004, 0.006, 0.008, 0, y + r * 1.5, z - 0.014 - i * 0.013, {
          m: 'P',
          c: '#0a0a0a',
          b: 0,
        });
    tip = z - 0.054;
  } else if (kind === 'brake') {
    W.lathe(
      [
        [r + 0.001, z],
        [r * 1.7, z - 0.004],
        [r * 1.7, z - 0.06],
        [r * 1.3, z - 0.064],
        [0.004, z - 0.064],
      ],
      { x: 0, y, z: 0, m: 'M', c: '#34373a', n: 16, wear: [1, 3] }
    );
    if (!low)
      for (const s of [-1, 1])
        for (let i = 0; i < 3; i++)
          W.box(0.003, r * 1.6, 0.009, s * r * 1.62, y, z - 0.014 - i * 0.016, {
            m: 'P',
            c: '#0a0a0a',
            b: 0,
          });
    tip = z - 0.064;
  } else if (kind === 'flash' || (kind === 'none' && def === 'bird')) {
    W.lathe(
      [
        [r + 0.001, z],
        [r * 1.35, z - 0.003],
        [r * 1.35, z - 0.045],
        [r * 1.2, z - 0.048],
        [0.004, z - 0.048],
      ],
      { x: 0, y, z: 0, m: 'M', c: '#26282a', n: 14, wear: [1, 3] }
    );
    if (!low)
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        W.box(
          0.0024,
          0.0024,
          0.026,
          Math.cos(a) * r * 1.36,
          y + Math.sin(a) * r * 1.36,
          z - 0.028,
          { m: 'P', c: '#080808', b: 0, rz: a }
        );
      }
    tip = z - 0.048;
  } else if (kind === 'ext') {
    W.cyl(r * 0.95, 0.07, 0, y, z - 0.035, { m: 'M', c: '#2b2e31', n: 14 });
    W.lathe(
      [
        [r * 0.95, z - 0.07],
        [r * 1.3, z - 0.072],
        [r * 1.3, z - 0.1],
        [0.004, z - 0.1],
      ],
      { x: 0, y, z: 0, m: 'M', c: '#2b2e31', n: 14, wear: [1] }
    );
    tip = z - 0.1;
  } else {
    W.lathe(
      [
        [r + 0.001, z],
        [r * 1.15, z - 0.003],
        [r * 1.15, z - 0.012],
        [0.003, z - 0.014],
      ],
      { x: 0, y, z: 0, m: 'M', c: '#2a2d30', n: 12 }
    );
    tip = z - 0.014;
  }
  info.tip.set(0, y, tip);
  return tip;
}
/* empunhadura dianteira: vertical ou angular (a mão de apoio segura nela) */
function wFore(W, kind, z, y, info, hy) {
  if (kind === 'vert') {
    W.box(0.02, 0.01, 0.03, 0, y - 0.005, z, { m: 'M', c: '#222426' });
    W.lathe(
      [
        [0.0135, 0],
        [0.0155, -0.012],
        [0.0155, -0.068],
        [0.017, -0.078],
        [0.016, -0.086],
        [0, -0.088],
      ],
      { x: 0, y: y - 0.008, z, ax: 'y', m: 'P', c: '#1b1c1e', n: 16, wear: [3] }
    );
    if (!W.low)
      for (let i = 0; i < 4; i++)
        W.ring(0.0157, 0.0012, 0, y - 0.026 - i * 0.012, z, { ax: 'y', m: 'P', c: '#141516' });
    /* a mão segura a parte de cima da empunhadura, encostada no guarda-mão (antes ficava na ponta de baixo) */
    info.fore.set(0, y - 0.055, z);
    info.hold = 'vert';
  } else if (kind === 'ang') {
    W.prism(
      [
        [z + 0.045, y],
        [z - 0.02, y],
        [z - 0.026, y - 0.006],
        [z - 0.02, y - 0.028],
        [z + 0.005, y - 0.022],
        [z + 0.04, y - 0.008],
      ],
      0.03,
      { m: 'P', c: '#1b1c1e', b: 0.003 }
    );
    info.fore.set(0, hy, z - 0.055);
    info.hold = 'hand';
  }
}
/* laser na lateral do guarda-mão */
function wLaser(W, z, y, x) {
  W.box(0.018, 0.02, 0.04, x, y, z, { m: 'P', c: '#1a1b1c', b: 0.002 });
  W.cyl(0.0055, 0.006, x, y + 0.003, z - 0.022, { m: 'M', c: '#2a2c2e', n: 10 });
  W.cyl(0.003, 0.002, x, y + 0.003, z - 0.0255, { m: 'R', n: 8 });
  if (!W.low)
    W.box(0.006, 0.006, 0.008, x + (x > 0 ? 0.009 : -0.009), y - 0.004, z + 0.008, {
      m: 'M',
      c: '#3a3c3e',
    });
}

/* ---------- modelos por família ---------- */
const WMODEL = {};
/* fuzis (ar), DMR e metralhadora leve compartilham o esqueleto: receptor superior + inferior, guarda-mão, cano, coronha */
function wLong(W, info, d, att, v) {
  const S = 'S',
    low = W.low,
    cls = d.cls;
  const P = Object.assign(
    {
      bore: 0.045,
      uz0: 0.115,
      uz1: -0.165,
      top: 0.071,
      hz1: -0.47,
      bz1: -0.6,
      br: 0.0085,
      stock: 'tele',
      hg: 'oct',
      mag: 'stanag',
      muzzle: 'bird',
      lw: 0.05,
      uw: 0.052,
    },
    v
  );
  const by = P.bore,
    top = P.top;
  /* receptor superior com janela de ejeção, retém do ferrolho e alavanca de manejo */
  W.prism(
    [
      [P.uz0, by - 0.027],
      [P.uz0, top - 0.011],
      [P.uz0 - 0.015, top],
      [P.uz1, top],
      [P.uz1, by - 0.027],
    ],
    P.uw,
    { m: S, b: 0.0022 }
  );
  W.box(0.003, 0.017, 0.058, P.uw / 2 + 0.0005, by + 0.002, -0.01, {
    m: 'M',
    c: '#121314',
    b: 0.0008,
  });
  if (!low) {
    W.box(0.002, 0.009, 0.034, P.uw / 2 + 0.0012, by + 0.003, -0.008, {
      m: 'M',
      c: '#7d8186',
      b: 0.0006,
    });
    W.box(0.0016, 0.004, 0.03, P.uw / 2 + 0.0014, by + 0.002, -0.008, {
      m: 'P',
      c: '#0a0a0a',
      b: 0,
    }); /* ferrolho aparecendo na janela */
    W.box(P.uw + 0.0016, 0.0014, P.uz0 - P.uz1 - 0.02, 0, by - 0.0265, (P.uz0 + P.uz1) / 2, {
      m: 'P',
      c: '#0a0a0b',
      b: 0,
    }); /* junta entre receptor superior e inferior */
    for (const sx of [-1, 1])
      W.prism(
        [
          [P.uz0 - 0.03, by - 0.022],
          [P.uz1 + 0.01, by - 0.022],
          [P.uz1 + 0.01, by - 0.016],
          [P.uz0 - 0.036, by - 0.016],
        ],
        0.002,
        { m: S, x: sx * (P.uw / 2 + 0.0006), b: 0.0005 }
      ); /* friso lateral */
    W.prism(
      [
        [0.065, by + 0.026],
        [0.052, by + 0.026],
        [0.05, by + 0.034],
        [0.066, by + 0.032],
      ],
      0.006,
      { m: S, x: P.uw / 2 + 0.002, b: 0.0008 }
    );
  }
  if (!low) {
    W.box(0.0018, 0.019, 0.062, P.uw / 2 + 0.0016, by + 0.012, -0.012, {
      m: 'M',
      c: '#3a3d40',
      b: 0.0006,
    });
    W.prism(
      [
        [0.06, by + 0.004],
        [0.03, by + 0.004],
        [0.034, by + 0.016],
        [0.06, by + 0.018],
      ],
      0.008,
      { m: S, x: P.uw / 2 + 0.003 }
    );
  }
  if (P.fa !== false) {
    W.cyl(0.0072, 0.03, P.uw / 2 + 0.006, by + 0.006, 0.075, { m: 'M', c: '#2f3235', n: 12 });
    W.cyl(0.0085, 0.006, P.uw / 2 + 0.006, by + 0.006, 0.093, { m: 'M', c: '#3a3d40', n: 12 });
  }
  if (P.ch === 'side') {
    W.box(0.024, 0.012, 0.016, -P.uw / 2 - 0.012, by + 0.012, -0.12, { m: 'M', c: '#2c2e31' });
    W.cyl(0.006, 0.02, -P.uw / 2 - 0.026, by + 0.012, -0.12, {
      ax: 'x',
      m: 'P',
      c: '#1c1d1f',
      n: 10,
    });
  } else {
    W.prism(
      [
        [P.uz0 + 0.012, top - 0.012],
        [P.uz0 - 0.012, top - 0.012],
        [P.uz0 - 0.012, top - 0.004],
        [P.uz0 + 0.012, top - 0.004],
      ],
      0.03,
      { m: 'M', c: '#2a2d30' }
    );
    W.box(0.012, 0.008, 0.014, -0.019, top - 0.008, P.uz0 + 0.004, { m: 'M', c: '#2a2d30' });
  }
  if (P.rail !== false) wRail(W, P.uz0 - 0.004, P.uz1, top, {});
  /* receptor inferior com poço do carregador alargado */
  const lz0 = P.uz0 - 0.015,
    lzm = -0.03;
  W.prism(
    [
      [lz0, by - 0.026],
      [lz0, by - 0.046],
      [lz0 - 0.016, by - 0.062],
      [0.03, by - 0.066],
      [lzm - 0.012, by - 0.066],
      [lzm - 0.024, by - 0.088],
      [-0.15, by - 0.088],
      [-0.156, by - 0.066],
      [-0.165, by - 0.048],
      [-0.165, by - 0.026],
    ],
    P.lw,
    { m: S, b: 0.0022 }
  );
  W.prism(
    [
      [lzm - 0.022, by - 0.084],
      [-0.152, by - 0.084],
      [-0.152, by - 0.097],
      [lzm - 0.018, by - 0.097],
    ],
    P.lw + 0.006,
    { m: S, b: 0.002 }
  );
  if (!low) {
    W.prism(
      [
        [lzm - 0.03, by - 0.03],
        [-0.145, by - 0.03],
        [-0.145, by - 0.08],
        [lzm - 0.034, by - 0.08],
      ],
      0.002,
      { m: S, x: P.lw / 2 + 0.0005, b: 0.0006 }
    );
    W.prism(
      [
        [lzm - 0.03, by - 0.03],
        [-0.145, by - 0.03],
        [-0.145, by - 0.08],
        [lzm - 0.034, by - 0.08],
      ],
      0.002,
      { m: S, x: -P.lw / 2 - 0.0005, b: 0.0006 }
    );
  }
  wGuard(W, 0, by - 0.066, { l: 0.074, d: 0.03, m: S });
  wPGrip(W, 0.064, by - 0.062, { ang: 0.32, h: 0.105, c: v.gripC });
  if (!low) {
    W.cyl(0.0075, 0.006, -P.lw / 2 - 0.002, by - 0.048, 0.07, {
      ax: 'x',
      m: 'M',
      c: '#2c2f32',
      n: 12,
    });
    W.box(0.004, 0.006, 0.02, -P.lw / 2 - 0.004, by - 0.048, 0.078, {
      m: 'M',
      c: '#3a3d40',
      rx: 0.5,
    });
    W.cyl(0.005, 0.004, P.lw / 2 + 0.0015, by - 0.055, -0.04, {
      ax: 'x',
      m: 'M',
      c: '#3a3d40',
      n: 10,
    });
    W.box(0.003, 0.018, 0.01, -P.lw / 2 - 0.0015, by - 0.04, -0.06, { m: 'M', c: '#2c2f32' });
  }
  wPins(
    W,
    [
      [0.09, by - 0.04],
      [-0.15, by - 0.04],
      [0.105, by - 0.012],
    ],
    P.lw
  );
  /* carregador (nó separado para a recarga) */
  const mh = [0, by - 0.085, -0.1];
  W.tgt('mag', mh);
  if (P.mag === 'stanag')
    wMag(W, {
      len: 0.19,
      curve: 0.045,
      zf: -0.128,
      zr: -0.074,
      w: 0.025,
      m: 'M',
      c: v.magC || '#36393c',
    });
  else if (P.mag === 'poly')
    wMag(W, {
      len: 0.185,
      curve: 0.04,
      zf: -0.13,
      zr: -0.074,
      w: 0.027,
      m: 'P',
      c: v.magC || '#2a2b2c',
    });
  else if (P.mag === 'steel20')
    wMag(W, {
      len: 0.14,
      curve: 0.02,
      zf: -0.135,
      zr: -0.072,
      w: 0.03,
      m: 'M',
      c: v.magC || '#2f3133',
    });
  else if (P.mag === 'dmr')
    wMag(W, {
      len: 0.11,
      curve: 0.008,
      zf: -0.14,
      zr: -0.072,
      w: 0.03,
      m: 'M',
      c: v.magC || '#2d2f31',
    });
  else if (P.mag === 'box') {
    W.prism(
      [
        [-0.04, 0.0],
        [-0.16, 0.0],
        [-0.17, -0.12],
        [-0.03, -0.12],
      ],
      0.075,
      { m: 'P', c: '#3c4034', b: 0.004 }
    );
    W.prism(
      [
        [-0.06, -0.03],
        [-0.14, -0.03],
        [-0.145, -0.09],
        [-0.055, -0.09],
      ],
      0.0035,
      { m: 'P', c: '#2a2c26', x: 0.039, b: 0.001 }
    );
    W.box(0.08, 0.008, 0.15, 0, -0.124, -0.1, { m: 'P', c: '#26281f' });
  }
  W.tgt('gun');
  info.mag = true;
  info.magHome = new V3(mh[0], mh[1], mh[2]);
  /* guarda-mão */
  const hz0 = P.uz1,
    hl = hz0 - P.hz1,
    hc = (hz0 + P.hz1) / 2;
  if (P.hg === 'oct') {
    const a = top - by,
      r = a / Math.cos(Math.PI / 8),
      pts = [];
    for (let i = 0; i < 8; i++) {
      const t = Math.PI / 8 + (i * Math.PI) / 4;
      pts.push([Math.cos(t) * r, Math.sin(t) * r + by]);
    }
    W.prism(pts, hl, { ax: 'z', m: S, z: hc, b: 0.002 });
    wRail(W, hz0, P.hz1 + 0.004, top, {});
    if (!low)
      for (const s of [-1, 1])
        for (let i = 0; i < 5; i++)
          W.box(0.0014, 0.008, 0.034, s * (a + 0.0002), by, hz0 - 0.04 - i * 0.054, {
            m: 'P',
            c: '#0b0c0d',
            b: 0,
          });
    if (!low)
      for (let i = 0; i < 5; i++)
        W.box(0.008, 0.0014, 0.034, 0, by - a - 0.0002, hz0 - 0.04 - i * 0.054, {
          m: 'P',
          c: '#0b0c0d',
          b: 0,
        });
  } else if (P.hg === 'quad') {
    W.box(0.05, 0.05, hl, 0, by, hc, { m: S, b: 0.003 });
    wRail(W, hz0, P.hz1 + 0.004, top, {});
    for (const s of [-1, 1])
      wRail(W, hz0 - 0.01, P.hz1 + 0.02, 0, { x: s * 0.026, rz: (-s * Math.PI) / 2, w: 0.018 });
    if (!low)
      for (let i = 0; i < 4; i++)
        W.box(0.052, 0.006, 0.03, 0, by - 0.026, hz0 - 0.05 - i * 0.06, { m: 'P', c: '#141516' });
  } else if (P.hg === 'round') {
    W.lathe(
      [
        [0.026, hz0],
        [0.03, hz0 - 0.01],
        [0.03, P.hz1 + 0.02],
        [0.024, P.hz1],
      ],
      { x: 0, y: by, z: 0, m: 'P', c: v.hgC || '#2a2b2d', n: 18, wear: [0, 2] }
    );
    if (!low)
      for (let i = 0; i < 6; i++)
        for (const s of [-1, 1])
          W.box(0.004, 0.012, 0.022, s * 0.029, by + 0.006, hz0 - 0.04 - i * 0.04, {
            m: 'P',
            c: '#0a0a0a',
            b: 0,
          });
    if (P.rail !== false && P.hgRail) wRail(W, hz0, P.hz1 + 0.06, by + 0.03, {});
  } else if (P.hg === 'poly') {
    W.prism(
      [
        [hz0, by + 0.026],
        [P.hz1 + 0.01, by + 0.026],
        [P.hz1, by + 0.02],
        [P.hz1, by - 0.02],
        [P.hz1 + 0.012, by - 0.03],
        [hz0, by - 0.03],
      ],
      0.054,
      { m: S, b: 0.004 }
    );
    wRail(W, hz0, P.hz1 + 0.006, top, {});
    if (!low)
      for (let i = 0; i < 4; i++)
        W.box(0.056, 0.012, 0.03, 0, by, hz0 - 0.05 - i * 0.06, { m: 'P', c: '#0c0c0d', b: 0 });
  } else if (P.hg === 'lmg') {
    W.lathe(
      [
        [0.027, hz0],
        [0.03, hz0 - 0.006],
        [0.03, P.hz1],
        [0.012, P.hz1],
      ],
      { x: 0, y: by, z: 0, m: 'M', c: '#2a2c2e', n: 18, wear: [0, 2] }
    );
    if (!low)
      for (let i = 0; i < 7; i++)
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
          W.cyl(
            0.006,
            0.003,
            Math.cos(a) * 0.0305,
            by + Math.sin(a) * 0.0305,
            hz0 - 0.04 - i * 0.04,
            { m: 'P', c: '#060606', n: 8, ax: Math.abs(Math.cos(a)) > 0.7 ? 'x' : 'y' }
          );
        }
  }
  if (!low && P.hg !== 'lmg') {
    W.cyl(0.007, 0.008, -(top - by) - 0.002, by - 0.012, P.hz1 + 0.03, {
      ax: 'x',
      m: 'M',
      c: '#2c2f32',
      n: 10,
    });
    W.ring(0.006, 0.0015, -(top - by) - 0.006, by - 0.012, P.hz1 + 0.03, {
      ax: 'x',
      m: 'M',
      c: '#3a3d40',
    });
  }
  /* cano, bloco de gases, alça de transporte (metralhadora) */
  const bz0 = P.hz1;
  W.cyl(P.br, Math.abs(P.bz1 - bz0), 0, by, (bz0 + P.bz1) / 2, { m: 'M', c: '#26282a', n: 14 });
  if (P.gas !== false) {
    W.box(0.022, 0.02, 0.022, 0, by - 0.002, bz0 - 0.03, { m: 'M', c: '#2c2e31' });
    wPins(W, [[bz0 - 0.03, by - 0.008, 0.0022]], 0.022);
  }
  if (!low && P.flute)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      W.box(0.0022, 0.0022, 0.12, Math.cos(a) * P.br, by + Math.sin(a) * P.br, bz0 - 0.1, {
        m: 'P',
        c: '#0e0f10',
        b: 0,
        rz: a,
      });
    }
  /* coronha (malha de trás: some ao mirar) */
  W.tgt('rear');
  if (P.stock === 'tele') {
    W.cyl(0.0155, 0.2, 0, by, P.uz0 + 0.1, { m: 'M', c: '#26282a', n: 16 });
    W.lathe(
      [
        [0.019, 0],
        [0.019, 0.006],
      ],
      { x: 0, y: by, z: P.uz0 + 0.002, m: 'M', c: '#2c2f32', n: 8, flat: true }
    );
    const z0 = P.uz0 + 0.08;
    W.prism(
      [
        [z0, by + 0.026],
        [z0 + 0.15, by + 0.032],
        [z0 + 0.168, by + 0.026],
        [z0 + 0.172, by - 0.1],
        [z0 + 0.16, by - 0.112],
        [z0 + 0.135, by - 0.112],
        [z0 + 0.05, by - 0.052],
        [z0, by - 0.04],
      ],
      0.048,
      { m: 'P', c: v.stockC || '#1f2022', b: 0.004 }
    );
    W.prism(
      [
        [z0 + 0.168, by + 0.03],
        [z0 + 0.18, by + 0.028],
        [z0 + 0.18, by - 0.108],
        [z0 + 0.168, by - 0.11],
      ],
      0.052,
      { m: 'P', c: '#121314', b: 0.003 }
    );
    if (!low) {
      W.box(0.012, 0.01, 0.04, 0, by - 0.042, z0 + 0.02, { m: 'M', c: '#2b2d2f' });
      W.ring(0.008, 0.0018, 0.026, by - 0.02, z0 + 0.11, { ax: 'x', m: 'M', c: '#3a3c3f' });
      for (let i = 0; i < 5; i++)
        W.box(0.05, 0.004, 0.006, 0, by + 0.03, z0 + 0.06 + i * 0.018, { m: 'P', c: '#141516' });
    }
  } else if (P.stock === 'fold') {
    W.prism(
      [
        [P.uz0, by + 0.02],
        [P.uz0 + 0.03, by + 0.022],
        [P.uz0 + 0.03, by - 0.03],
        [P.uz0, by - 0.03],
      ],
      0.04,
      { m: 'M', c: '#26282a' }
    );
    const z0 = P.uz0 + 0.03;
    W.prism(
      [
        [z0, by + 0.02],
        [z0 + 0.2, by + 0.03],
        [z0 + 0.24, by + 0.025],
        [z0 + 0.25, by - 0.1],
        [z0 + 0.2, by - 0.1],
        [z0 + 0.17, by - 0.07],
        [z0 + 0.1, by - 0.035],
        [z0, by - 0.025],
      ],
      0.042,
      { m: S, b: 0.004 }
    );
    W.prism(
      [
        [z0 + 0.05, by + 0.004],
        [z0 + 0.17, by + 0.012],
        [z0 + 0.2, by - 0.06],
        [z0 + 0.12, by - 0.025],
      ],
      0.044,
      { m: 'P', c: '#0c0c0d', b: 0.001 }
    );
    W.prism(
      [
        [z0 + 0.06, by + 0.03],
        [z0 + 0.2, by + 0.038],
        [z0 + 0.2, by + 0.044],
        [z0 + 0.06, by + 0.036],
      ],
      0.03,
      { m: 'P', c: '#1a1b1c' }
    );
    W.prism(
      [
        [z0 + 0.24, by + 0.028],
        [z0 + 0.256, by + 0.026],
        [z0 + 0.256, by - 0.098],
        [z0 + 0.25, by - 0.1],
      ],
      0.046,
      { m: 'P', c: '#121314' }
    );
  } else if (P.stock === 'fixed') {
    const z0 = P.uz0;
    W.prism(
      [
        [z0, by + 0.022],
        [z0 + 0.24, by + 0.02],
        [z0 + 0.27, by + 0.016],
        [z0 + 0.275, by - 0.11],
        [z0 + 0.24, by - 0.112],
        [z0 + 0.12, by - 0.06],
        [z0, by - 0.035],
      ],
      0.05,
      { m: S, c: v.stockC, b: 0.005 }
    );
    W.prism(
      [
        [z0 + 0.272, by + 0.018],
        [z0 + 0.284, by + 0.017],
        [z0 + 0.284, by - 0.11],
        [z0 + 0.272, by - 0.112],
      ],
      0.054,
      { m: 'P', c: '#121314', b: 0.003 }
    );
    if (v.cheek)
      W.prism(
        [
          [z0 + 0.08, by + 0.02],
          [z0 + 0.22, by + 0.019],
          [z0 + 0.22, by + 0.042],
          [z0 + 0.1, by + 0.044],
        ],
        0.04,
        { m: 'P', c: '#1c1d1f', b: 0.004 }
      );
    if (!low) W.ring(0.008, 0.0018, 0.026, by - 0.05, z0 + 0.2, { ax: 'x', m: 'M', c: '#3a3c3f' });
  } else if (P.stock === 'skel') {
    const z0 = P.uz0;
    W.prism(
      [
        [z0, by + 0.02],
        [z0 + 0.26, by + 0.024],
        [z0 + 0.27, by + 0.016],
        [z0 + 0.27, by - 0.11],
        [z0 + 0.25, by - 0.115],
        [z0 + 0.24, by - 0.03],
        [z0 + 0.04, by - 0.012],
        [z0, by - 0.02],
      ],
      0.044,
      { m: S, c: v.stockC, b: 0.004 }
    );
    W.prism(
      [
        [z0 + 0.06, by - 0.012],
        [z0 + 0.24, by - 0.03],
        [z0 + 0.25, by - 0.11],
        [z0 + 0.2, by - 0.1],
      ],
      0.044,
      { m: S, c: v.stockC, b: 0.004 }
    );
    W.prism(
      [
        [z0 + 0.268, by + 0.02],
        [z0 + 0.28, by + 0.018],
        [z0 + 0.28, by - 0.112],
        [z0 + 0.268, by - 0.115],
      ],
      0.05,
      { m: 'P', c: '#121314' }
    );
    W.prism(
      [
        [z0 + 0.06, by + 0.02],
        [z0 + 0.2, by + 0.023],
        [z0 + 0.2, by + 0.045],
        [z0 + 0.08, by + 0.046],
      ],
      0.036,
      { m: 'P', c: '#1a1b1d', b: 0.004 }
    );
  }
  W.tgt('gun');
  /* bipé dobrado (DMR/metralhadora) */
  if (P.bipod) {
    for (const s of [-1, 1]) {
      W.cyl(0.005, 0.2, s * 0.01, by - 0.034, P.hz1 + 0.16, { m: 'M', c: '#26282a', n: 8 });
      W.cyl(0.0065, 0.012, s * 0.01, by - 0.034, P.hz1 + 0.06, { m: 'P', c: '#141516', n: 8 });
    }
    W.box(0.034, 0.016, 0.03, 0, by - 0.026, P.hz1 + 0.27, { m: 'M', c: '#2a2c2e' });
  }
  if (P.carry) {
    W.prism(
      [
        [-0.02, top],
        [-0.05, top + 0.04],
        [-0.14, top + 0.04],
        [-0.17, top],
      ],
      0.014,
      { m: 'M', c: '#2a2c2e', b: 0.002 }
    );
  }
  if (P.cover) {
    W.prism(
      [
        [0.08, top],
        [0.08, top + 0.014],
        [0.06, top + 0.022],
        [-0.12, top + 0.022],
        [-0.13, top],
      ],
      P.uw + 0.004,
      { m: 'M', c: '#34373a', b: 0.0025 }
    );
    wRail(W, 0.07, -0.12, top + 0.022, {});
  }
  /* mira, cano, empunhadura, laser */
  const ry = (P.cover ? top + 0.022 : top) + 0.0045;
  wSight(W, att.sight, att.sight === 'iron' ? 0.08 : P.sightZ || -0.02, ry, info, {
    ironRear: 0.08,
    ironFront: P.hz1 + 0.02,
    frontY: P.hg === 'round' ? by + 0.03 : ry,
  });
  wMuzzle(W, att.barrel, P.bz1, by, P.br, info, P.muzzle);
  info.fore.set(0, by - 0.036, P.foreZ || P.hz1 + 0.12);
  info.hold = 'hand';
  if (att.grip === 'vert') wFore(W, 'vert', P.foreZ || P.hz1 + 0.12, by - (top - by), info);
  else if (att.grip === 'ang')
    wFore(W, 'ang', (P.foreZ || P.hz1 + 0.12) + 0.06, by - (top - by), info, by - 0.036);
  if (att.laser) wLaser(W, P.hz1 + 0.06, by, -(top - by) - 0.012);
  info.grip.set(0, by - 0.102, 0.078);
}
WMODEL.ar = (W, info, d, att) => {
  const v = d.look.v;
  if (v === 'B')
    wLong(W, info, d, att, {
      hg: 'poly',
      stock: 'fold',
      mag: 'poly',
      fa: false,
      ch: 'side',
      uz1: -0.18,
      hz1: -0.44,
      bz1: -0.58,
      magC: '#8a7a5c',
      gripC: '#2a2620',
      top: 0.074,
    });
  else if (v === 'C')
    wLong(W, info, d, att, {
      hg: 'round',
      stock: 'fixed',
      mag: 'steel20',
      fa: false,
      hz1: -0.46,
      bz1: -0.66,
      br: 0.0095,
      hgC: '#2d2f27',
      stockC: '#2d3028',
      muzzle: 'bird',
      top: 0.072,
      hgRail: true,
    });
  else wLong(W, info, d, att, { hg: 'oct', stock: 'tele' });
};
WMODEL.dmr = (W, info, d, att) => {
  const v = d.look.v;
  if (v === 'B')
    wLong(W, info, d, att, {
      hg: 'round',
      stock: 'skel',
      mag: 'dmr',
      fa: false,
      hz1: -0.52,
      bz1: -0.8,
      br: 0.009,
      hgC: '#5a4632',
      stockC: null,
      bipod: false,
      top: 0.072,
      muzzle: 'bird',
      sightZ: -0.03,
      hgRail: true,
    });
  else
    wLong(W, info, d, att, {
      hg: 'quad',
      stock: 'fixed',
      mag: 'dmr',
      hz1: -0.55,
      bz1: -0.82,
      br: 0.011,
      flute: true,
      bipod: true,
      cheek: true,
      stockC: null,
      sightZ: -0.03,
    });
};
WMODEL.lmg = (W, info, d, att) =>
  wLong(W, info, d, att, {
    hg: 'lmg',
    stock: 'fixed',
    mag: 'box',
    fa: false,
    hz1: -0.5,
    bz1: -0.7,
    br: 0.012,
    bipod: true,
    carry: true,
    cover: true,
    stockC: null,
    top: 0.074,
    uw: 0.07,
    lw: 0.06,
    foreZ: -0.36,
  });
/* submetralhadoras */
WMODEL.smg = (W, info, d, att) => {
  const v = d.look.v,
    low = W.low,
    S = 'S',
    by = 0.035;
  if (v === 'B') {
    /* Marimbondo: receptor alto e inclinado, carregador bem à frente do gatilho */
    W.prism(
      [
        [0.12, by - 0.03],
        [0.12, by + 0.03],
        [0.1, by + 0.042],
        [-0.2, by + 0.042],
        [-0.23, by + 0.02],
        [-0.23, by - 0.03],
        [-0.16, by - 0.07],
        [-0.06, by - 0.07],
        [-0.03, by - 0.045],
        [0.04, by - 0.045],
      ],
      0.05,
      { m: S, b: 0.003 }
    );
    W.prism(
      [
        [-0.09, by - 0.065],
        [-0.17, by - 0.065],
        [-0.185, by - 0.12],
        [-0.1, by - 0.115],
      ],
      0.044,
      { m: 'P', c: '#1d1f21', b: 0.004 }
    );
    wRail(W, 0.1, -0.2, by + 0.042, {});
    if (!low)
      for (let i = 0; i < 5; i++)
        W.box(0.052, 0.008, 0.012, 0, by - 0.005, -0.08 - i * 0.026, {
          m: 'P',
          c: '#0c0c0d',
          b: 0,
        });
    wGuard(W, 0.02, by - 0.045, { l: 0.07, d: 0.03 });
    wPGrip(W, 0.075, by - 0.045, { ang: 0.25, h: 0.1 });
    W.cyl(0.009, 0.05, 0, by, -0.255, { m: 'M', c: '#26282a' });
    const mh = [0, by - 0.05, -0.058];
    W.tgt('mag', mh);
    wMag(W, {
      len: 0.17,
      curve: 0,
      zf: -0.076,
      zr: -0.042,
      w: 0.022,
      m: 'P',
      c: '#232426',
      taper: -0.004,
    });
    W.tgt('gun');
    info.magHome = new V3(...mh);
    W.tgt('rear');
    W.prism(
      [
        [0.12, by + 0.01],
        [0.14, by + 0.012],
        [0.14, by - 0.02],
        [0.12, by - 0.02],
      ],
      0.03,
      { m: 'M', c: '#26282a' }
    );
    W.prism(
      [
        [0.14, by + 0.016],
        [0.33, by + 0.024],
        [0.34, by - 0.075],
        [0.31, by - 0.075],
        [0.3, by - 0.01],
        [0.14, by - 0.012],
      ],
      0.036,
      { m: 'P', c: '#1b1c1e', b: 0.003 }
    );
    W.tgt('gun');
    wSight(W, att.sight, att.sight === 'iron' ? 0.09 : -0.03, by + 0.0465, info, {
      ironRear: 0.09,
      ironFront: -0.19,
    });
    wMuzzle(W, att.barrel, -0.28, by, 0.009, info, 'none');
    info.fore.set(0, by - 0.09, -0.135);
    info.hold = 'vert';
    if (att.laser) wLaser(W, -0.17, by + 0.012, 0.03);
    info.grip.set(0, by - 0.085, 0.086);
  } else if (v === 'C') {
    /* Cascavel: caixa de polímero com trilhos laterais */
    W.prism(
      [
        [0.1, by - 0.035],
        [0.1, by + 0.03],
        [0.085, by + 0.04],
        [-0.26, by + 0.04],
        [-0.27, by + 0.028],
        [-0.27, by - 0.035],
        [-0.12, by - 0.035],
        [-0.11, by - 0.055],
        [-0.03, by - 0.055],
        [-0.02, by - 0.035],
      ],
      0.056,
      { m: S, b: 0.004 }
    );
    wRail(W, 0.09, -0.26, by + 0.04, {});
    for (const s of [-1, 1])
      wRail(W, -0.17, -0.26, by, { x: s * 0.028, rz: (-s * Math.PI) / 2, w: 0.016 });
    if (!low) {
      W.box(0.004, 0.016, 0.05, 0.0285, by + 0.012, -0.02, { m: 'M', c: '#121314' });
      for (let i = 0; i < 6; i++)
        W.box(0.058, 0.006, 0.012, 0, by - 0.032, -0.13 - i * 0.022, {
          m: 'P',
          c: '#0f1011',
          b: 0,
        });
      W.cyl(0.007, 0.03, -0.032, by + 0.02, -0.2, { ax: 'x', m: 'P', c: '#1a1b1c', n: 10 });
    }
    wGuard(W, 0.03, by - 0.035, { l: 0.07, d: 0.03, m: S });
    wPGrip(W, 0.082, by - 0.035, { ang: 0.3, h: 0.1 });
    W.cyl(0.01, 0.06, 0, by, -0.3, { m: 'M', c: '#26282a' });
    const mh = [0, by - 0.06, -0.075];
    W.tgt('mag', mh);
    wMag(W, { len: 0.18, curve: 0.012, zf: -0.098, zr: -0.056, w: 0.028, m: 'P', c: '#262729' });
    W.tgt('gun');
    info.magHome = new V3(...mh);
    W.tgt('rear');
    W.prism(
      [
        [0.1, by + 0.025],
        [0.32, by + 0.025],
        [0.33, by - 0.07],
        [0.3, by - 0.07],
        [0.3, by + 0.0],
        [0.1, by - 0.01],
      ],
      0.04,
      { m: 'P', c: '#1d1e20', b: 0.004 }
    );
    W.tgt('gun');
    wSight(W, att.sight, att.sight === 'iron' ? 0.08 : -0.04, by + 0.0445, info, {
      ironRear: 0.08,
      ironFront: -0.25,
    });
    wMuzzle(W, att.barrel, -0.33, by, 0.01, info, 'none');
    info.fore.set(0, by - 0.036, -0.2);
    info.hold = 'hand';
    if (att.grip === 'vert') wFore(W, 'vert', -0.2, by - 0.035, info);
    else if (att.grip === 'ang') wFore(W, 'ang', -0.15, by - 0.035, info, by - 0.036);
    if (att.laser) wLaser(W, -0.22, by - 0.0, -0.04);
    info.grip.set(0, by - 0.075, 0.094);
  } else {
    /* Vespa: receptor cilíndrico com tubo de manejo, guarda-mão fino e coronha retrátil */
    W.lathe(
      [
        [0.0, 0.1],
        [0.027, 0.1],
        [0.03, 0.095],
        [0.03, -0.17],
        [0.027, -0.175],
        [0, -0.175],
      ],
      { x: 0, y: by, z: 0, m: S, n: 20, wear: [0, 2, 3], cap: false }
    );
    W.prism(
      [
        [0.1, by - 0.02],
        [0.1, by - 0.036],
        [-0.12, by - 0.036],
        [-0.13, by - 0.02],
      ],
      0.052,
      { m: S }
    );
    W.lathe(
      [
        [0.0, -0.02],
        [0.014, -0.02],
        [0.014, -0.36],
        [0, -0.36],
      ],
      { x: 0, y: by + 0.03, z: 0, m: 'M', c: '#26282a', n: 12, cap: false }
    );
    W.box(0.006, 0.012, 0.02, 0.012, by + 0.036, -0.24, { m: 'M', c: '#3a3d40' });
    wRail(W, 0.08, -0.14, by + 0.044, {});
    W.box(0.026, 0.012, 0.2, 0, by + 0.036, -0.04, { m: 'M', c: '#26282a' });
    W.prism(
      [
        [-0.17, by - 0.025],
        [-0.17, by + 0.022],
        [-0.18, by + 0.03],
        [-0.33, by + 0.03],
        [-0.34, by + 0.02],
        [-0.34, by - 0.03],
        [-0.33, by - 0.036],
        [-0.18, by - 0.036],
      ],
      0.054,
      { m: 'P', c: '#1e2022', b: 0.005 }
    );
    if (!low) {
      for (let i = 0; i < 5; i++)
        W.box(0.056, 0.03, 0.008, 0, by - 0.004, -0.2 - i * 0.025, {
          m: 'P',
          c: '#121314',
          b: 0.001,
        });
      W.box(0.003, 0.016, 0.05, 0.031, by + 0.008, -0.02, { m: 'M', c: '#121314' });
    }
    wGuard(W, 0.02, by - 0.036, { l: 0.07, d: 0.03 });
    wPGrip(W, 0.07, by - 0.036, { ang: 0.28, h: 0.1 });
    wPins(
      W,
      [
        [0.09, by - 0.03],
        [-0.1, by - 0.03],
      ],
      0.052
    );
    W.cyl(0.0095, 0.06, 0, by, -0.37, { m: 'M', c: '#26282a' });
    const mh = [0, by - 0.04, -0.1];
    W.tgt('mag', mh);
    wMag(W, { len: 0.17, curve: 0.06, zf: -0.122, zr: -0.084, w: 0.024, m: 'M', c: '#34373a' });
    W.tgt('gun');
    info.magHome = new V3(...mh);
    W.tgt('rear');
    for (const s of [-1, 1])
      W.cyl(0.005, 0.22, s * 0.019, by + 0.008, 0.21, { m: 'M', c: '#2a2c2e', n: 8 });
    W.prism(
      [
        [0.31, by + 0.03],
        [0.33, by + 0.03],
        [0.33, by - 0.09],
        [0.31, by - 0.09],
      ],
      0.05,
      { m: 'P', c: '#1a1b1d', b: 0.004 }
    );
    W.box(0.04, 0.012, 0.03, 0, by + 0.008, 0.3, { m: 'M', c: '#2a2c2e' });
    W.tgt('gun');
    wSight(W, att.sight, att.sight === 'iron' ? 0.08 : -0.03, by + 0.0485, info, {
      ironRear: 0.08,
      ironFront: -0.33,
      frontY: by + 0.03,
    });
    wMuzzle(W, att.barrel, -0.4, by, 0.0095, info, 'none');
    info.fore.set(0, by - 0.036, -0.26);
    info.hold = 'hand';
    if (att.grip === 'vert') wFore(W, 'vert', -0.26, by - 0.036, info);
    else if (att.grip === 'ang') wFore(W, 'ang', -0.21, by - 0.036, info, by - 0.036);
    if (att.laser) wLaser(W, -0.27, by, -0.04);
    info.grip.set(0, by - 0.076, 0.081);
  }
  info.mag = true;
};
/* escopetas: pump (telha separada) e semiautomática */
WMODEL.sg = (W, info, d, att, semi) => {
  const low = W.low,
    S = 'S',
    by = 0.03,
    tz = -0.72;
  W.prism(
    [
      [0.1, by - 0.04],
      [0.1, by + 0.025],
      [0.085, by + 0.034],
      [-0.14, by + 0.034],
      [-0.15, by + 0.024],
      [-0.15, by - 0.03],
      [-0.12, by - 0.045],
      [0.02, by - 0.045],
    ],
    0.056,
    { m: S, b: 0.003 }
  );
  W.box(0.003, 0.022, 0.06, 0.0285, by + 0.004, -0.04, { m: 'M', c: '#121314' });
  if (!low) {
    W.cyl(0.0055, 0.006, -0.03, by - 0.02, 0.06, { ax: 'x', m: 'M', c: '#3a3c3e', n: 10 });
    W.box(0.012, 0.008, 0.026, 0, by - 0.046, -0.08, { m: 'M', c: '#2b2d2f' });
  }
  wRail(W, 0.07, -0.14, by + 0.034, {});
  wGuard(W, 0.04, by - 0.045, { l: 0.07, d: 0.03 });
  wPGrip(W, 0.09, by - 0.045, { ang: 0.33, h: 0.1 });
  wPins(
    W,
    [
      [0.07, by - 0.02],
      [-0.11, by - 0.02],
    ],
    0.056
  );
  W.cyl(0.0115, Math.abs(tz + 0.15), 0, by + 0.008, (tz - 0.15) / 2, { m: 'M', c: '#26282a' });
  W.cyl(0.0125, Math.abs(tz + 0.13) - 0.02, 0, by - 0.022, (tz - 0.13) / 2 + 0.03, {
    m: 'M',
    c: '#2a2c2e',
  });
  W.box(0.012, 0.022, 0.02, 0, by - 0.006, tz + 0.06, { m: 'M', c: '#2a2c2e' });
  W.cyl(0.013, 0.016, 0, by - 0.022, tz + 0.06, { m: 'M', c: '#34373a' });
  if (!low)
    for (let i = 0; i < 4; i++) {
      W.cyl(0.0092, 0.05, 0.034, by - 0.035 + i * 0.0001, 0.03 - i * 0.022, {
        ax: 'y',
        m: 'P',
        c: '#7a1e18',
        n: 10,
      });
      W.cyl(0.0094, 0.013, 0.034, by - 0.004, 0.03 - i * 0.022, {
        ax: 'y',
        m: 'M',
        c: '#b58a3c',
        n: 10,
      });
    } /* cartuchos no porta-cartuchos */
  if (!low)
    W.prism(
      [
        [0.05, by - 0.01],
        [-0.04, by - 0.01],
        [-0.04, by - 0.04],
        [0.05, by - 0.04],
      ],
      0.004,
      { m: 'P', c: '#1a1b1c', x: 0.0305 }
    );
  if (!semi) {
    const ph = [0, by - 0.022, -0.4];
    W.tgt('pump', ph);
    W.lathe(
      [
        [0.016, 0.1],
        [0.024, 0.096],
        [0.026, 0.085],
        [0.026, -0.085],
        [0.024, -0.096],
        [0.016, -0.1],
      ],
      { x: 0, y: ph[1], z: ph[2], m: 'P', c: '#232426', n: 18, wear: [1, 3] }
    );
    if (!low)
      for (let i = 0; i < 9; i++)
        W.ring(0.0262, 0.0016, 0, ph[1], ph[2] - 0.072 + i * 0.018, { m: 'P', c: '#151617' });
    W.tgt('gun');
    info.pump = true;
    info.pumpHome = new V3(...ph);
    info.fore.set(0, by - 0.022 - 0.036, -0.4);
  } else {
    W.prism(
      [
        [-0.15, by + 0.022],
        [-0.42, by + 0.022],
        [-0.43, by + 0.012],
        [-0.43, by - 0.045],
        [-0.41, by - 0.05],
        [-0.15, by - 0.05],
      ],
      0.058,
      { m: 'P', c: '#232426', b: 0.005 }
    );
    wRail(W, -0.15, -0.42, by + 0.022, {});
    if (!low)
      for (let i = 0; i < 5; i++)
        for (const s of [-1, 1])
          W.box(0.004, 0.022, 0.03, s * 0.0295, by - 0.014, -0.19 - i * 0.048, {
            m: 'P',
            c: '#0a0a0a',
            b: 0,
          });
    info.fore.set(0, by - 0.014 - 0.036, -0.33);
  }
  info.mag = null;
  info.hold = 'hand';
  W.tgt('rear');
  if (semi) {
    W.cyl(0.016, 0.18, 0, by, 0.19, { m: 'M', c: '#26282a' });
    W.prism(
      [
        [0.18, by + 0.024],
        [0.33, by + 0.03],
        [0.345, by + 0.024],
        [0.35, by - 0.1],
        [0.335, by - 0.11],
        [0.31, by - 0.11],
        [0.23, by - 0.05],
        [0.18, by - 0.04],
      ],
      0.05,
      { m: 'P', c: '#1f2022', b: 0.004 }
    );
    W.prism(
      [
        [0.347, by + 0.028],
        [0.36, by + 0.026],
        [0.36, by - 0.106],
        [0.347, by - 0.11],
      ],
      0.054,
      { m: 'P', c: '#121314' }
    );
  } else {
    W.prism(
      [
        [0.1, by + 0.02],
        [0.32, by + 0.016],
        [0.35, by + 0.01],
        [0.355, by - 0.13],
        [0.32, by - 0.135],
        [0.2, by - 0.075],
        [0.1, by - 0.05],
      ],
      0.052,
      { m: S, b: 0.005 }
    );
    W.prism(
      [
        [0.352, by + 0.012],
        [0.366, by + 0.011],
        [0.366, by - 0.13],
        [0.352, by - 0.136],
      ],
      0.056,
      { m: 'P', c: '#121314' }
    );
  }
  W.tgt('gun');
  wSight(W, att.sight, att.sight === 'iron' ? 0.06 : -0.04, by + 0.0385, info, {
    ironRear: 0.06,
    ironFront: tz + 0.02,
    frontY: by + 0.02,
  });
  if (att.barrel === 'sup') wMuzzle(W, 'sup', tz, by + 0.008, 0.0115, info, 'none');
  else {
    W.cyl(0.0135, 0.02, 0, by + 0.008, tz - 0.01, { m: 'M', c: '#1f2123' });
    info.tip.set(0, by + 0.008, tz - 0.02);
  }
  if (att.grip === 'vert' && semi) wFore(W, 'vert', -0.33, by - 0.05, info);
  else if (att.grip === 'ang' && semi) wFore(W, 'ang', -0.28, by - 0.05, info, by - 0.05);
  if (att.laser) wLaser(W, semi ? -0.38 : -0.6, by - 0.02, -0.03);
  info.grip.set(0, by - 0.085, 0.103);
};
WMODEL.sgs = (W, info, d, att) => WMODEL.sg(W, info, d, att, true);
/* pistolas: ferrolho com serrilhado, armação com trilho, guarda-mato, miras de 3 pontos */
WMODEL.pistol = (W, info, d, att) => {
  const low = W.low,
    S = 'S',
    L = d.look || {},
    k = L.long || 1,
    t = L.tall || 1,
    sy = 0.034,
    sl = 0.2 * k,
    sh = 0.034 * t,
    fz = 0.035,
    frontZ = fz - sl;
  W.prism(
    [
      [fz, sy - sh / 2],
      [fz, sy + sh / 2 - 0.006],
      [fz - 0.01, sy + sh / 2],
      [frontZ + 0.008, sy + sh / 2],
      [frontZ, sy + sh / 2 - 0.008],
      [frontZ, sy - sh / 2],
    ],
    0.03,
    { m: S, b: 0.0022 }
  );
  if (!low) {
    for (let i = 0; i < 7; i++)
      for (const s of [-1, 1])
        W.box(0.0012, sh * 0.75, 0.0022, s * 0.0151, sy + 0.001, fz - 0.006 - i * 0.0055, {
          m: 'P',
          c: '#0b0c0d',
          b: 0,
        });
    W.box(0.0012, 0.011, 0.034, 0.0151, sy + 0.004, fz - 0.07, { m: 'M', c: '#101112', b: 0 });
    W.cyl(0.0055, 0.006, 0, sy, frontZ - 0.002, { m: 'M', c: '#121314', n: 12 });
  }
  W.prism(
    [
      [fz - 0.01, sy - sh / 2],
      [frontZ + 0.02, sy - sh / 2],
      [frontZ + 0.016, sy - sh / 2 - 0.016],
      [-0.03, sy - sh / 2 - 0.018],
      [fz - 0.01, sy - sh / 2 - 0.014],
    ],
    0.028,
    { m: 'P', c: L.frame || '#1e2022', b: 0.002 }
  );
  if (!low) {
    wRail(W, -0.04, frontZ + 0.02, sy - sh / 2 - 0.021, {
      w: 0.016,
      m: 'P',
      c: L.frame || '#1e2022',
    });
    W.box(0.0015, 0.006, 0.012, 0.015, sy - sh / 2 - 0.004, -0.01, { m: 'M', c: '#3a3c3e' });
    W.cyl(0.0035, 0.03, 0, sy - sh / 2 - 0.006, fz - 0.05, { ax: 'x', m: 'M', c: '#3a3c3e', n: 8 });
  }
  wGuard(W, -0.005, sy - sh / 2 - 0.014, { l: 0.06, d: 0.028, m: 'P', c: L.frame || '#1e2022' });
  const yT = sy - sh / 2;
  W.prism(
    [
      [0.06, yT + 0.004],
      [0.05, yT],
      [0.012, yT],
      [0.009, yT - 0.024],
      [0.016, yT - 0.04],
      [0.02, yT - 0.058],
      [0.027, yT - 0.074],
      [0.034, yT - 0.092],
      [0.037, yT - 0.104],
      [0.075, yT - 0.104],
      [0.08, yT - 0.096],
      [0.07, yT - 0.04],
      [0.064, yT - 0.008],
    ],
    0.032,
    { m: 'P', c: L.frame || '#1e2022', b: 0.003 }
  );
  if (!low)
    for (const s of [-1, 1])
      W.prism(
        [
          [0.058, yT - 0.022],
          [0.024, yT - 0.026],
          [0.036, yT - 0.088],
          [0.07, yT - 0.086],
        ],
        0.002,
        { m: 'P', c: '#141516', x: s * 0.0165, b: 0.0004 }
      );
  if (L.hammer) {
    W.prism(
      [
        [0.034, sy],
        [0.04, sy + 0.006],
        [0.05, sy + 0.012],
        [0.052, sy + 0.008],
        [0.044, sy - 0.006],
      ],
      0.008,
      { m: 'M', c: '#2e3033' }
    );
  }
  const mh = [0, yT - 0.05, 0.045];
  W.tgt('mag', mh);
  W.prism(
    [
      [0.018, yT - 0.002],
      [0.046, yT - 0.002],
      [0.072, yT - 0.102],
      [0.042, yT - 0.102],
    ],
    0.024,
    { m: 'M', c: '#2a2c2e', b: 0.001 }
  );
  W.prism(
    [
      [0.038, yT - 0.1],
      [0.078, yT - 0.1],
      [0.08, yT - 0.112],
      [0.036, yT - 0.112],
    ],
    0.03,
    { m: 'P', c: '#1a1b1c', b: 0.002 }
  );
  W.tgt('gun');
  info.mag = true;
  info.magHome = new V3(...mh);
  /* miras: 3 pontos (ferro) ou mira óptica no ferrolho */
  const top = sy + sh / 2;
  if (att.sight === 'iron') {
    W.box(0.022, 0.008, 0.009, 0, top + 0.004, fz - 0.008, { m: 'M', c: '#1b1c1e' });
    W.box(0.006, 0.008, 0.004, 0, top + 0.006, fz - 0.004, { m: 'P', c: '#0a0a0a', b: 0 });
    W.box(0.005, 0.009, 0.007, 0, top + 0.0045, frontZ + 0.008, { m: 'M', c: '#1b1c1e' });
    if (!low) {
      W.cyl(0.0012, 0.001, 0, top + 0.006, frontZ + 0.0042, { m: 'R', n: 6 });
      for (const s of [-1, 1])
        W.cyl(0.0012, 0.001, s * 0.006, top + 0.006, fz - 0.0127, { m: 'R', n: 6 });
    }
    info.sight.set(0, top + 0.0075, fz - 0.008);
    info.eye = 0.2;
  } else {
    W.box(0.022, 0.004, 0.04, 0, top + 0.002, fz - 0.03, { m: 'M', c: '#1b1c1e' });
    wSight(W, att.sight === 'holo' ? 'reflex' : att.sight, fz - 0.03, top + 0.003, info);
    info.eye = 0.18;
  }
  wMuzzle(W, att.barrel, frontZ - 0.002, sy, 0.0055, info, 'none');
  if (att.laser) wLaser(W, frontZ + 0.03, sy - sh / 2 - 0.028, 0);
  info.grip.set(0, yT - 0.05, 0.046);
  info.fore.set(0, yT - 0.05, 0.046);
  info.hold = 'pistol';
};
/* pistola-metralhadora: pistola grande com carregador longo, trava frontal e coronha curta dobrada */
WMODEL.mp = (W, info, d, att) => {
  WMODEL.pistol(
    W,
    info,
    Object.assign({}, d, { look: Object.assign({}, d.look, { long: 1.15, tall: 1.05 }) }),
    att
  );
  const low = W.low,
    sy = 0.034;
  {
    const yT = sy - (0.034 * 1.05) / 2;
    W.tgt('mag', [info.magHome.x, info.magHome.y, info.magHome.z]);
    W.prism(
      [
        [0.042, yT - 0.1],
        [0.072, yT - 0.1],
        [0.088, yT - 0.17],
        [0.058, yT - 0.17],
      ],
      0.024,
      { m: 'M', c: '#2a2c2e', b: 0.001 }
    );
    W.prism(
      [
        [0.054, yT - 0.168],
        [0.092, yT - 0.168],
        [0.094, yT - 0.18],
        [0.052, yT - 0.18],
      ],
      0.03,
      { m: 'P', c: '#1a1b1c' }
    );
    W.tgt('gun');
  }
  W.prism(
    [
      [-0.1, sy - 0.032],
      [-0.12, sy - 0.032],
      [-0.125, sy - 0.075],
      [-0.11, sy - 0.08],
    ],
    0.022,
    { m: 'P', c: '#1e2022', b: 0.003 }
  );
  W.box(0.012, 0.012, 0.014, 0.017, sy + 0.006, 0.02, { m: 'M', c: '#3a3c3e' });
  W.tgt('rear');
  for (const s of [-1, 1])
    W.box(0.006, 0.008, 0.12, s * 0.018, sy - 0.035, 0.1, { m: 'M', c: '#26282a' });
  W.box(0.04, 0.04, 0.008, 0, sy - 0.05, 0.16, { m: 'P', c: '#1a1b1c' });
  W.tgt('gun');
};
/* revólver: armação, tambor com caneluras, cano com trilho ventilado e soleira, cão */
WMODEL.rev = (W, info, d, att) => {
  const low = W.low,
    S = 'S',
    by = 0.03,
    cz = -0.01;
  W.prism(
    [
      [0.05, by - 0.025],
      [0.05, by + 0.018],
      [0.03, by + 0.026],
      [-0.045, by + 0.026],
      [-0.045, by - 0.025],
      [-0.02, by - 0.032],
      [0.03, by - 0.032],
    ],
    0.03,
    { m: S, b: 0.0022 }
  );
  W.lathe(
    [
      [0, cz + 0.026],
      [0.016, cz + 0.026],
      [0.019, cz + 0.022],
      [0.019, cz - 0.022],
      [0.016, cz - 0.026],
      [0, cz - 0.026],
    ],
    { x: 0, y: by, z: 0, m: S, n: 24, cap: false, wear: [1, 3] }
  );
  if (!low) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      W.box(0.004, 0.006, 0.03, Math.cos(a) * 0.0185, by + Math.sin(a) * 0.0185, cz, {
        m: 'P',
        c: '#0a0a0b',
        b: 0,
        rz: a,
      });
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      W.cyl(0.0045, 0.002, Math.cos(a) * 0.01, by + Math.sin(a) * 0.01, cz - 0.026, {
        m: 'P',
        c: '#060606',
        n: 8,
      });
    }
  }
  const bl = 0.15;
  W.prism(
    [
      [-0.045, by + 0.012],
      [-0.045 - bl, by + 0.012],
      [-0.045 - bl, by - 0.014],
      [-0.06 - bl * 0.2, by - 0.02],
      [-0.045, by - 0.022],
    ],
    0.02,
    { m: S, b: 0.002 }
  );
  W.cyl(0.0072, bl, 0, by + 0.002, -0.045 - bl / 2, { m: 'M', c: '#1d1f21' });
  W.box(0.008, 0.008, bl, 0, by + 0.018, -0.045 - bl / 2, { m: S });
  if (!low)
    for (let i = 0; i < 7; i++)
      W.box(0.0084, 0.004, 0.006, 0, by + 0.017, -0.06 - i * 0.02, { m: 'P', c: '#0b0b0c', b: 0 });
  W.prism(
    [
      [0.05, by + 0.016],
      [0.058, by + 0.03],
      [0.066, by + 0.036],
      [0.068, by + 0.03],
      [0.056, by + 0.008],
    ],
    0.008,
    { m: 'M', c: '#2a2c2e' }
  );
  wGuard(W, 0.008, by - 0.03, { l: 0.05, d: 0.028, m: S });
  W.prism(
    [
      [0.06, by - 0.024],
      [0.025, by - 0.03],
      [0.03, by - 0.07],
      [0.048, by - 0.125],
      [0.085, by - 0.125],
      [0.088, by - 0.11],
      [0.078, by - 0.06],
      [0.074, by - 0.024],
    ],
    0.034,
    { m: 'P', c: '#3a2a1c', b: 0.004 }
  );
  if (!low)
    wPins(
      W,
      [
        [0.0, by + 0.012],
        [0.035, by - 0.0],
      ],
      0.03
    );
  info.mag = null;
  const top = by + 0.022;
  if (att.sight === 'iron') {
    W.box(0.004, 0.012, 0.012, 0, top + 0.006, -0.045 - bl + 0.012, { m: 'M', c: '#1d1f21' });
    W.box(0.016, 0.006, 0.008, 0, top + 0.009, 0.04, { m: 'M', c: '#1d1f21' });
    W.box(0.004, 0.006, 0.009, 0, top + 0.0105, 0.04, { m: 'P', c: '#0a0a0a', b: 0 });
    if (!low) W.cyl(0.0012, 0.001, 0, top + 0.0105, -0.045 - bl + 0.0055, { m: 'R', n: 6 });
    info.sight.set(0, top + 0.0115, 0.04);
    info.eye = 0.2;
  } else {
    W.box(0.02, 0.006, 0.06, 0, top + 0.003, -0.07, { m: 'M', c: '#1b1c1e' });
    wSight(W, att.sight, -0.07, top + 0.006, info);
    info.eye = 0.2;
  }
  info.tip.set(0, by + 0.002, -0.045 - bl - 0.002);
  if (att.laser) wLaser(W, -0.13, by - 0.03, 0);
  info.grip.set(0, by - 0.07, 0.058);
  info.fore.set(0, by - 0.07, 0.058);
  info.hold = 'pistol';
};

/* ---------- montagem: baldes de geometria → malhas (uma por grupo, uma submalha por material) ---------- */
const WGEO_CACHE = new Map();
function wGeoOf(id, low) {
  const real =
      !low &&
      typeof WM !== 'undefined' &&
      WREAL[wBase(id)] &&
      WM.ready[WREAL[wBase(id)].m] &&
      WREAL[wBase(id)],
    k = id + '|' + (low ? 1 : 0) + (real ? 'r' : '');
  let e = WGEO_CACHE.get(k);
  if (e) return e;
  const d = WEAPONS[id] || WEAPONS.rifle,
    D = WEAPONS[wBase(id)] || d,
    att = d.att || D.att,
    W = WGeo(!!low);
  const info = {
    grip: new V3(0, -0.09, 0),
    fore: new V3(),
    tip: new V3(),
    sight: new V3(0, 0.06, 0),
    mag: null,
    magHome: null,
    pump: null,
    pumpHome: null,
    hold: 'hand',
    eye: 0.2,
  };
  if (real) wRealBody(W, info, D, att, real);
  else (WMODEL[D.cls] || WMODEL.ar)(W, info, D, att);
  e = { G: W.G, info, real: real || null };
  WGEO_CACHE.set(k, e);
  return e;
}
function buildWeapon(scene, id, sid, low) {
  if (!WEAPONS[id]) id = 'rifle';
  const bid = wBase(id),
    D = WEAPONS[bid],
    X = wMats(scene),
    S = weaponMat(scene, bid, sid || 'padrao'),
    E = wGeoOf(id, low),
    I = E.info;
  const g = new B.TransformNode('weapon', scene);
  const info = {
    g,
    grip: I.grip.clone(),
    fore: I.fore.clone(),
    tip: I.tip.clone(),
    sight: I.sight.clone(),
    mag: null,
    magHome: null,
    pump: null,
    pumpHome: null,
    hold: I.hold,
    eye: I.eye,
    cls: D.cls,
    id,
  };
  const nodes = { gun: g };
  /* (posições de repouso como Vector3 do Babylon: a animação usa position.copyFrom) */
  if (I.magHome) {
    const n = new B.TransformNode('mag', scene);
    n.parent = g;
    n.position.set(I.magHome.x, I.magHome.y, I.magHome.z);
    nodes.mag = n;
    info.mag = n;
    info.magHome = n.position.clone();
  }
  if (I.pumpHome) {
    const n = new B.TransformNode('pump', scene);
    n.parent = g;
    n.position.set(I.pumpHome.x, I.pumpHome.y, I.pumpHome.z);
    nodes.pump = n;
    info.pump = n;
    info.pumpHome = n.position.clone();
  }
  const matOf = (m) =>
    low
      ? m === 'S'
        ? S
        : m === 'R'
          ? X.wR
          : X.wV
      : m === 'S'
        ? S
        : m === 'M'
          ? X.wM
          : m === 'P'
            ? X.wP
            : m === 'G'
              ? X.wG
              : X.wR;
  const groups = {};
  for (const k in E.G) {
    const b = E.G[k];
    if (low && b.m === 'G') continue;
    let t = low && b.t === 'rear' ? 'gun' : b.t;
    if (t === 'sight' && (low || b.m === 'R' || b.m === 'G')) t = low ? 'gun' : 'sightDot';
    (groups[t] || (groups[t] = [])).push(b);
  }
  for (const t in groups) {
    const list = groups[t],
      byMat = new Map();
    for (const b of list) {
      const mt = matOf(b.m);
      let a = byMat.get(mt);
      if (!a) byMat.set(mt, (a = []));
      a.push(b);
    }
    const P = [],
      N = [],
      U = [],
      C = [],
      Ix = [],
      ranges = [],
      mats = [];
    for (const [mt, bs] of byMat) {
      const v0 = P.length / 3,
        i0 = Ix.length;
      for (const b of bs) {
        const base = P.length / 3;
        for (let i = 0; i < b.P.length; i++) P.push(b.P[i]);
        for (let i = 0; i < b.N.length; i++) N.push(b.N[i]);
        for (let i = 0; i < b.U.length; i++) U.push(b.U[i]);
        if (low && b.m === 'R') for (let i = 0; i < b.C.length; i++) C.push(1);
        else for (let i = 0; i < b.C.length; i++) C.push(b.C[i]);
        for (let i = 0; i < b.I.length; i++) Ix.push(b.I[i] + base);
      }
      ranges.push([v0, P.length / 3 - v0, i0, Ix.length - i0]);
      mats.push(mt);
    }
    if (!Ix.length) continue;
    const m = new B.Mesh(t === 'gun' ? 'gun' : t === 'rear' ? 'gunRear' : t, scene),
      vd = new B.VertexData();
    vd.positions = P;
    vd.normals = N;
    vd.uvs = U;
    vd.colors = C;
    vd.indices = Ix;
    vd.applyToMesh(m, false);
    if (mats.length === 1) m.material = mats[0];
    else {
      const mm = new B.MultiMaterial('wmm', scene);
      mm.subMaterials = mats;
      m.material = mm;
      m.subMeshes = [];
      ranges.forEach((r, k) => new B.SubMesh(k, r[0], r[1], r[2], r[3], m));
    }
    m.isPickable = false;
    m.parent = t === 'rear' ? g : nodes[t] || g;
    if (t === 'rear') info.rear = m;
    if (t === 'sight') info.sightM = m;
    if (t === 'sightDot') info.dotM = m;
  }
  if (E.real && !low)
    wmAttach(scene, bid, sid || 'padrao', (WEAPONS[id] || D).att || D.att, info, g, nodes);
  return info;
}
