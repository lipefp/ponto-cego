/* =====================================================================
   INTERFACE (Babylon GUI) — peças reutilizáveis: textos, botões, chips,
   sliders, caixas de seleção, cartões e a mira (usada no HUD e na prévia)
   ===================================================================== */
const GUI = B.GUI;
const uiLobby = GUI.AdvancedDynamicTexture.CreateFullscreenUI('uiLobby', true, lobby);
const uiGame = GUI.AdvancedDynamicTexture.CreateFullscreenUI('uiGame', true, game);
for (const u of [uiLobby, uiGame]) {
  u.useInvalidateRectOptimization = false;
  if (u.layer) u.layer.applyPostProcess = false;
}
const HA = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT,
  HC = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER,
  HR = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
const VT = GUI.Control.VERTICAL_ALIGNMENT_TOP,
  VC = GUI.Control.VERTICAL_ALIGNMENT_CENTER,
  VB = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;

function text(str, o) {
  o = o || {};
  const t = new GUI.TextBlock();
  t.text = str;
  t.color = o.color || PAL.text;
  t.fontFamily = o.mono ? MONO : FONT;
  t.fontSize = o.size || 14;
  if (o.weight) t.fontWeight = o.weight;
  t.textHorizontalAlignment = o.align === 'center' ? HC : o.align === 'right' ? HR : HA;
  t.horizontalAlignment = t.textHorizontalAlignment;
  t.textVerticalAlignment = VC;
  if (o.wrap) {
    t.textWrapping = true;
    t.resizeToFit = true;
    t.width = o.width || '100%';
  } else {
    t.resizeToFit = !o.width;
    if (o.width) t.width = o.width;
    t.height = (o.h || Math.round((o.size || 14) * 1.45)) + 'px';
  }
  if (o.spacing) t.letterSpacing = o.spacing;
  if (o.upper) t.text = str.toUpperCase();
  if (o.outline) {
    t.outlineWidth = o.outline;
    t.outlineColor = '#000';
  }
  return t;
}
function rect(o) {
  o = o || {};
  const r = new GUI.Rectangle();
  r.thickness = o.border || 0;
  r.color = o.borderColor || PAL.line;
  r.background = o.bg || 'transparent';
  if (o.w != null) r.width = typeof o.w === 'number' ? o.w + 'px' : o.w;
  if (o.h != null) r.height = typeof o.h === 'number' ? o.h + 'px' : o.h;
  r.cornerRadius = o.radius || 0;
  r.isPointerBlocker = !!o.block;
  if (o.ha != null) r.horizontalAlignment = o.ha;
  if (o.va != null) r.verticalAlignment = o.va;
  return r;
}
function stack(vertical, o) {
  o = o || {};
  const s = new GUI.StackPanel();
  s.isVertical = vertical;
  if (o.spacing != null) s.spacing = o.spacing;
  if (o.w != null) s.width = typeof o.w === 'number' ? o.w + 'px' : o.w;
  if (o.h != null) s.height = typeof o.h === 'number' ? o.h + 'px' : o.h;
  if (!vertical && o.h == null) s.height = '40px';
  s.horizontalAlignment = o.ha != null ? o.ha : HA;
  return s;
}
function gap(h) {
  const r = rect({ h: h || 8, w: '100%' });
  return r;
}
/* botão "chip": selecionado = fundo claro */
function chip(label, on, cb, o) {
  o = o || {};
  const b = GUI.Button.CreateSimpleButton('chip', label.toUpperCase());
  b.width = (o.w || Math.max(64, label.length * 9.6 + 34)) + 'px';
  b.height = (o.h || 36) + 'px';
  b.thickness = 1;
  b.color = on ? PAL.text : 'rgba(155,161,167,.28)';
  b.background = on ? PAL.text : 'rgba(255,255,255,.03)';
  b.textBlock.color = on ? '#0a0b0d' : PAL.text;
  b.textBlock.fontFamily = FONT;
  b.textBlock.fontSize = o.fs || 14;
  b.textBlock.fontWeight = '700';
  b.textBlock.letterSpacing = '1.5px';
  b.onPointerEnterObservable.add(() => {
    if (!on) b.color = PAL.text;
  });
  b.onPointerOutObservable.add(() => {
    if (!on) b.color = 'rgba(155,161,167,.28)';
  });
  b.onPointerUpObservable.add(() => {
    playSound('ui');
    cb && cb();
  });
  return b;
}
function chipRow(items, cur, cb, o) {
  const r = stack(false, { h: (o && o.h) || 40, spacing: 6 });
  for (const [v, l] of items) {
    const c = chip(l, v === cur, () => cb(v), o);
    r.addControl(c);
  }
  return r;
}
/* retângulo com chanfro de 14 px (canto inferior direito; flip = inferior esquerdo) */
class ChamferRect extends GUI.Rectangle {
  constructor(n, flip) {
    super(n);
    this._flip = !!flip;
  }
  _localDraw(ctx) {
    const m = this._currentMeasure,
      c = Math.min(14, m.height * 0.4),
      x = m.left,
      y = m.top,
      w = m.width,
      h = m.height;
    ctx.save();
    ctx.beginPath();
    if (this._flip) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + c, y + h);
      ctx.lineTo(x, y + h - c);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h - c);
      ctx.lineTo(x + w - c, y + h);
      ctx.lineTo(x, y + h);
    }
    ctx.closePath();
    if (this._background) {
      ctx.fillStyle = this._background;
      ctx.fill();
    }
    ctx.restore();
  }
}
function chamfer(o) {
  o = o || {};
  const r = new ChamferRect('ch', o.flip);
  r.thickness = 0;
  r.background = o.bg || '#d6d9dc';
  if (o.w != null) r.width = typeof o.w === 'number' ? o.w + 'px' : o.w;
  if (o.h != null) r.height = typeof o.h === 'number' ? o.h + 'px' : o.h;
  if (o.ha != null) r.horizontalAlignment = o.ha;
  if (o.va != null) r.verticalAlignment = o.va;
  r.isPointerBlocker = !!o.block;
  return r;
}
/* texto de display (Big Shoulders Stencil) */
function disp(str, o) {
  o = o || {};
  const t = text(str, Object.assign({ weight: '700', spacing: '4px' }, o));
  t.fontFamily = DISPLAY;
  return t;
}
/* botão com chanfro de 14 px no canto inferior direito (guia v2.0) */
class ChamferButton extends GUI.Button {
  _localDraw(ctx) {
    const m = this._currentMeasure,
      c = Math.min(14, m.height * 0.4),
      x = m.left,
      y = m.top,
      w = m.width,
      h = m.height;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - c);
    ctx.lineTo(x + w - c, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    if (this._background) {
      ctx.fillStyle = this._background;
      ctx.fill();
    }
    ctx.restore();
  }
}
function bigButton(label, sub, cb, o) {
  o = o || {};
  const b = new ChamferButton('big');
  b.width = (o.w || 280) + 'px';
  b.height = (o.h || 72) + 'px';
  b.background = o.bg || '#d6d9dc';
  b.thickness = 0;
  b.color = 'transparent';
  const s = stack(true, { w: '100%' });
  s.verticalAlignment = VC;
  s.paddingLeft = '22px';
  const t = text(label, {
    size: o.fs || 28,
    weight: '700',
    color: o.fg || '#0a0b0d',
    spacing: '5px',
    h: 34,
  });
  b.lbl = t;
  if (sub && o.subTop) {
    b.sub = text(sub, { size: 11, weight: '600', color: o.fg || '#454b52', spacing: '3px', h: 16 });
    s.addControl(b.sub);
  }
  s.addControl(t);
  if (sub && !o.subTop) {
    b.sub = text(sub, { size: 11, weight: '600', color: o.fg || '#0a0b0d', spacing: '2px', h: 16 });
    s.addControl(b.sub);
  }
  b.addControl(s);
  const _bg = b.background;
  b.onPointerEnterObservable.add(() => {
    if (!o.bg) b.background = '#ffffff';
    else b.alpha = 0.9;
  });
  b.onPointerOutObservable.add(() => {
    b.background = _bg;
    b.alpha = 1;
  });
  b.onPointerUpObservable.add(() => {
    playSound('ui');
    cb();
  });
  b.labels = s;
  return b;
}
function sliderRow(label, min, max, step, val, fmt, cb) {
  const g = new GUI.Grid();
  g.height = '34px';
  g.width = '100%';
  g.addColumnDefinition(130, true);
  g.addColumnDefinition(1);
  g.addColumnDefinition(56, true);
  const l = text(label, { size: 13, color: PAL.muted });
  g.addControl(l, 0, 0);
  const s = new GUI.Slider();
  s.minimum = min;
  s.maximum = max;
  s.step = step;
  s.value = val;
  s.height = '20px';
  s.color = PAL.ally;
  s.background = 'rgba(255,255,255,.12)';
  s.thumbColor = PAL.text;
  s.isThumbCircle = true;
  s.borderColor = 'transparent';
  s.barOffset = '6px';
  g.addControl(s, 0, 1);
  const v = text(fmt(val), { size: 13, mono: true, align: 'right', width: '56px' });
  g.addControl(v, 0, 2);
  s.onValueChangedObservable.add((x) => {
    v.text = fmt(x);
    cb(x);
  });
  return g;
}
function checkRow(label, on, cb) {
  const r = stack(false, { h: 30, spacing: 8 });
  const c = new GUI.Checkbox();
  c.width = '20px';
  c.height = '20px';
  c.isChecked = on;
  c.color = PAL.ally;
  c.background = 'rgba(255,255,255,.08)';
  c.onIsCheckedChangedObservable.add((v) => cb(v));
  r.addControl(c);
  r.addControl(text(label, { size: 13, color: PAL.muted }));
  return r;
}
function eyebrow(str) {
  return text(str, { size: 11, color: PAL.muted, mono: true, spacing: '3px', upper: true, h: 18 });
}
function sectionLabel(str) {
  const s = stack(true, { w: '100%' });
  s.addControl(gap(12));
  s.addControl(text(str, { size: 11, color: PAL.muted, spacing: '2.5px', upper: true, h: 18 }));
  s.addControl(gap(4));
  return s;
}

/* ---------- mira desenhada com retângulos (HUD e prévia) ---------- */
function makeCrosshair(parent) {
  const box = rect({ w: 160, h: 160 });
  box.isHitTestVisible = false;
  parent.addControl(box);
  const mk = () => {
    const o = rect({});
    o.isHitTestVisible = false;
    box.addControl(o);
    return o;
  };
  const parts = { outline: [mk(), mk(), mk(), mk(), mk()], bars: [mk(), mk(), mk(), mk(), mk()] };
  const ring = new GUI.Ellipse();
  ring.isHitTestVisible = false;
  box.addControl(ring);
  const ringO = new GUI.Ellipse();
  ringO.isHitTestVisible = false;
  box.addControl(ringO);
  let key = '';
  return {
    box,
    update(xh, extra) {
      const k = JSON.stringify(xh) + Math.round(extra || 0);
      if (k === key) return;
      key = k;
      const L = +xh.size,
        T = +xh.thick,
        G = Math.round(+xh.gap + (extra || 0));
      const defs = [];
      if (xh.style === 'classic' || xh.style === 't') {
        defs.push(
          xh.style === 'classic' ? [0, -(G + L / 2 + T / 2), T, L] : null,
          [0, G + L / 2 + T / 2, T, L],
          [-(G + L / 2 + T / 2), 0, L, T],
          [G + L / 2 + T / 2, 0, L, T]
        );
      } else defs.push(null, null, null, null);
      if (xh.dot || xh.style === 'dot') {
        const s = xh.style === 'dot' ? Math.max(T, Math.round(L / 2)) : T;
        defs.push([0, 0, s, s]);
      } else defs.push(null);
      defs.forEach((d, i) => {
        const b = parts.bars[i],
          o = parts.outline[i];
        if (!d) {
          b.isVisible = o.isVisible = false;
          return;
        }
        b.isVisible = true;
        b.left = d[0] + 'px';
        b.top = d[1] + 'px';
        b.width = d[2] + 'px';
        b.height = d[3] + 'px';
        b.background = xh.color;
        o.isVisible = !!xh.outline;
        o.left = d[0] + 'px';
        o.top = d[1] + 'px';
        o.width = d[2] + 2 + 'px';
        o.height = d[3] + 2 + 'px';
        o.background = 'rgba(0,0,0,.85)';
      });
      const circ = xh.style === 'circle',
        r = (G + L / 2 + 2) * 2;
      ring.isVisible = circ;
      ringO.isVisible = circ && xh.outline;
      if (circ) {
        ring.width = ring.height = r + 'px';
        ring.thickness = T;
        ring.color = xh.color;
        ringO.width = ringO.height = r + 'px';
        ringO.thickness = T + 2;
        ringO.color = 'rgba(0,0,0,.85)';
      }
    },
  };
}
/* imagens geradas em canvas para a interface */
function canvasUrl(w, h, draw) {
  const c = mkCanvas(w, h);
  draw(c.getContext('2d'), w, h);
  try {
    return c.toDataURL();
  } catch (e) {
    return '';
  }
}
const IMG = {
  vignette: canvasUrl(256, 256, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.72);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(1, 'rgba(200,30,20,.75)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  }),
  scope: canvasUrl(512, 512, (g, w, h) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'destination-out';
    g.beginPath();
    g.arc(w / 2, h / 2, w * 0.36, 0, 7);
    g.fill();
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = 'rgba(0,0,0,.9)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(w * 0.14, h / 2);
    g.lineTo(w * 0.86, h / 2);
    g.moveTo(w / 2, h * 0.14);
    g.lineTo(w / 2, h * 0.86);
    g.stroke();
    g.fillStyle = '#ff3b30';
    g.fillRect(w / 2 - 1.5, h / 2 - 1.5, 3, 3);
  }),
  scan: canvasUrl(4, 4, (g) => {
    g.fillStyle = 'rgba(0,0,0,.18)';
    g.fillRect(0, 0, 4, 2);
  }),
  xhbg: canvasUrl(420, 200, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#b4c4cb');
    gr.addColorStop(0.55, '#c9bba0');
    gr.addColorStop(0.56, '#8a8177');
    gr.addColorStop(1, '#5e5c57');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#e2dccf';
    g.fillRect(w * 0.62, 20, w * 0.3, h * 0.5);
    g.fillStyle = '#86603a';
    g.fillRect(w * 0.08, h * 0.45, w * 0.22, h * 0.3);
  }),
};

/* símbolo do Ponto Cego (guia v2.0): colchetes de mira + quadrado laranja fora do centro + quadrado vazado (o ponto cego) */
function symbolUrl(sz) {
  const c = document.createElement('canvas');
  c.width = c.height = sz;
  const g = c.getContext('2d'),
    k = sz / 64;
  g.strokeStyle = '#f1f2f3';
  g.lineWidth = 4 * k;
  g.lineCap = 'square';
  const L = (a, b, c2, d, e, f) => {
    g.beginPath();
    g.moveTo(a * k, b * k);
    g.lineTo(c2 * k, d * k);
    g.lineTo(e * k, f * k);
    g.stroke();
  };
  L(6, 22, 6, 6, 22, 6);
  L(42, 6, 58, 6, 58, 22);
  L(58, 42, 58, 58, 42, 58);
  L(22, 58, 6, 58, 6, 42);
  g.fillStyle = '#e8812f';
  g.fillRect(38 * k, 38 * k, 9 * k, 9 * k);
  g.strokeStyle = '#9ba1a7';
  g.lineWidth = 2 * k;
  g.strokeRect(17 * k, 17 * k, 9 * k, 9 * k);
  return c.toDataURL();
}

/* ícones de gadget em traço de 2 px (guia v2.0) */
const GICON = {};
/* logos dos gadgets (originais; viewBox 64×64; traço + preenchimento) */
const GLOGO = {
  breach: {
    s: 'M10 10H54V54H10Z M32 10L26 24L38 32L28 42L34 54',
    f: 'M32 31m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0Z',
    w: 4,
  },
  frag: {
    s: 'M43.1 36.6L56.0 41.9M36.6 43.1L41.9 56.0M27.4 43.1L22.1 56.0M20.9 36.6L8.0 41.9M20.9 27.4L8.0 22.1M27.4 20.9L22.1 8.0M36.6 20.9L41.9 8.0M43.1 27.4L56.0 22.1',
    f: 'M26 32a6 6 0 1 0 12 0a6 6 0 1 0 -12 0Z',
    w: 4,
  },
  pulse: {
    s: 'M10 32A22 22 0 0 1 32 54 M10 14A40 40 0 0 1 50 54',
    f: 'M10 54m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0Z',
    w: 4,
  },
  thermal: {
    s: 'M32 6L54 19V45L32 58L10 45V19Z M58 6L52 12 M62 14L56 18',
    f: 'M32 32m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0Z',
    w: 4,
  },
  shield: {
    s: 'M18 6H46A6 6 0 0 1 52 12V52A6 6 0 0 1 46 58H18A6 6 0 0 1 12 52V12A6 6 0 0 1 18 6Z M22 18H42',
    f: 'M26 34H38V46H26Z',
    w: 4,
  },
  impact: { s: 'M32 6V36 M20 26L32 38L44 26 M8 48H56 M18 57H46', f: '', w: 4 },
  wire: {
    s: 'M4 32H60M10 22L22 42M22 22L10 42M26 22L38 42M38 22L26 42M42 22L54 42M54 22L42 42',
    f: '',
    w: 4,
  },
};
function gIcon(kind, col) {
  const key = kind + col;
  if (GICON[key]) return GICON[key];
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const g = c.getContext('2d');
  if (GLOGO[kind] && typeof Path2D !== 'undefined') {
    const L = GLOGO[kind];
    g.scale(1.5, 1.5);
    g.strokeStyle = g.fillStyle = col || '#f1f2f3';
    g.lineWidth = L.w;
    g.lineCap = g.lineJoin = 'round';
    if (L.s) g.stroke(new Path2D(L.s));
    if (L.f) g.fill(new Path2D(L.f));
    return (GICON[key] = c.toDataURL());
  }
  g.scale(2, 2);
  g.strokeStyle = col || '#f1f2f3';
  g.lineWidth = 2;
  g.lineCap = 'square';
  g.lineJoin = 'miter';
  const P = (pts, close) => {
    g.beginPath();
    pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])));
    if (close) g.closePath();
    g.stroke();
  };
  if (kind === 'breach') {
    g.strokeRect(8, 17, 32, 14);
    P([
      [24, 17],
      [24, 10],
    ]);
    P([
      [16, 31],
      [16, 37],
    ]);
    P([
      [32, 31],
      [32, 37],
    ]);
    P([
      [14, 24],
      [34, 24],
    ]);
  } else if (kind === 'frag' || kind === 'impact') {
    g.beginPath();
    g.arc(24, 29, 12, 0, 7);
    g.stroke();
    P([
      [20, 17],
      [20, 10],
      [30, 10],
      [30, 13],
    ]);
    if (kind === 'impact') {
      P([
        [24, 22],
        [24, 36],
      ]);
      P([
        [17, 29],
        [31, 29],
      ]);
    }
  } else if (kind === 'pulse') {
    g.beginPath();
    g.arc(24, 24, 4, 0, 7);
    g.stroke();
    g.beginPath();
    g.arc(24, 24, 11, -0.9, 0.9);
    g.stroke();
    g.beginPath();
    g.arc(24, 24, 11, Math.PI - 0.9, Math.PI + 0.9);
    g.stroke();
    g.beginPath();
    g.arc(24, 24, 18, -0.9, 0.9);
    g.stroke();
    g.beginPath();
    g.arc(24, 24, 18, Math.PI - 0.9, Math.PI + 0.9);
    g.stroke();
  } else if (kind === 'thermal') {
    P([
      [12, 38],
      [32, 16],
    ]);
    P(
      [
        [26, 10],
        [40, 20],
        [34, 26],
      ],
      false
    );
    P([
      [8, 34],
      [16, 42],
    ]);
  } else if (kind === 'shield') {
    P(
      [
        [10, 8],
        [38, 8],
        [38, 26],
        [24, 42],
        [10, 26],
      ],
      true
    );
    P([
      [24, 14],
      [24, 34],
    ]);
  } else if (kind === 'flash') {
    g.beginPath();
    g.arc(24, 24, 7, 0, 7);
    g.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      P([
        [24 + Math.cos(a) * 11, 24 + Math.sin(a) * 11],
        [24 + Math.cos(a) * 19, 24 + Math.sin(a) * 19],
      ]);
    }
  } else if (kind === 'jammer') {
    P([
      [24, 40],
      [24, 22],
    ]);
    g.beginPath();
    g.arc(24, 18, 3, 0, 7);
    g.stroke();
    g.beginPath();
    g.arc(24, 18, 10, Math.PI * 1.15, Math.PI * 1.85);
    g.stroke();
    g.beginPath();
    g.arc(24, 18, 17, Math.PI * 1.15, Math.PI * 1.85);
    g.stroke();
    P([
      [10, 42],
      [38, 42],
    ]);
    P([
      [10, 10],
      [38, 38],
    ]);
  } else if (kind === 'wire') {
    P([
      [6, 34],
      [15, 14],
      [24, 34],
      [33, 14],
      [42, 34],
    ]);
  } else {
    g.strokeRect(10, 10, 28, 28);
  }
  return (GICON[key] = c.toDataURL());
}
