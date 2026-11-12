/* =====================================================================
   MAPA — texturas, materiais, malhas do prédio, paredes destrutíveis, efeitos
   ===================================================================== */
/* ---------- MAPA v2: texturas extras ---------- */
Object.assign(MAPTEX, {
  carpet: drawTex((g, s, r) => {
    g.fillStyle = '#4a4f57';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < (s * s) / 3; i++) {
      const v = (r() * 40) | 0;
      g.fillStyle = `rgba(${60 + v},${66 + v},${76 + v},.35)`;
      g.fillRect(r() * s, r() * s, 1, 1);
    }
    g.strokeStyle = 'rgba(0,0,0,.15)';
    g.strokeRect(0, 0, s, s);
  }),
  tile: drawTex((g, s, r) => {
    const n = 4;
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const v = r() * 10;
        g.fillStyle = `rgb(${(196 + v) | 0},${(192 + v) | 0},${(184 + v) | 0})`;
        g.fillRect((x * s) / n, (y * s) / n, s / n, s / n);
      }
    g.strokeStyle = 'rgba(80,75,70,.45)';
    g.lineWidth = 2;
    for (let i = 0; i <= n; i++) {
      g.beginPath();
      g.moveTo((i * s) / n, 0);
      g.lineTo((i * s) / n, s);
      g.moveTo(0, (i * s) / n);
      g.lineTo(s, (i * s) / n);
      g.stroke();
    }
    speckle(g, s, r, 0.03, true);
  }),
  raised: drawTex((g, s, r) => {
    g.fillStyle = '#9aa0a4';
    g.fillRect(0, 0, s, s);
    g.strokeStyle = '#5c6266';
    g.lineWidth = 6;
    g.strokeRect(3, 3, s - 6, s - 6);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = 'rgba(60,66,70,.5)';
      g.fillRect(20 + (i % 8) * 28, 20 + ((i / 8) | 0) * 44, 6, 6);
    }
    speckle(g, s, r, 0.04, true);
  }),
  slab: drawTex((g, s, r) => {
    g.fillStyle = '#8f8b84';
    g.fillRect(0, 0, s, s);
    speckle(g, s, r, 0.07, true);
    g.strokeStyle = 'rgba(40,40,40,.35)';
    g.lineWidth = 3;
    g.strokeRect(0, 0, s, s);
    g.beginPath();
    g.moveTo(s / 2, 0);
    g.lineTo(s / 2, s);
    g.stroke();
  }),
  fabric: drawTex((g, s, r) => {
    g.fillStyle = '#6f7680';
    g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 3) {
      g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.05})`;
      g.fillRect(0, y, s, 1);
    }
    g.fillStyle = '#3a3e44';
    g.fillRect(0, 0, s, 10);
  }),
  rack: drawTex((g, s, r) => {
    g.fillStyle = '#1d2024';
    g.fillRect(0, 0, s, s);
    for (let y = 8; y < s - 8; y += 22) {
      g.fillStyle = '#2b3036';
      g.fillRect(10, y, s - 20, 18);
      for (let x = 0; x < 14; x++) {
        g.fillStyle = r() < 0.5 ? '#3a3f45' : '#202428';
        g.fillRect(18 + x * 16, y + 5, 10, 8);
      }
    }
    g.strokeStyle = '#4a5056';
    g.lineWidth = 4;
    g.strokeRect(4, 4, s - 8, s - 8);
  }),
  rackGlow: drawTex((g, s, r) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, s, s);
    for (let y = 8; y < s - 8; y += 22) {
      for (let k = 0; k < 4; k++) {
        g.fillStyle = r() < 0.7 ? '#36ff7a' : r() < 0.5 ? '#ffb020' : '#2fb8ff';
        g.fillRect(s - 34 + k * 6, y + 7, 3, 3);
      }
    }
  }),
  drawers: drawTex((g, s, r) => {
    g.fillStyle = '#b9b3a2';
    g.fillRect(0, 0, s, s);
    for (let y = 0; y < 4; y++) {
      g.fillStyle = '#a8a291';
      g.fillRect(8, (y * s) / 4 + 6, s - 16, s / 4 - 12);
      g.fillStyle = '#5a5a5a';
      g.fillRect(s / 2 - 20, (y * s) / 4 + s / 8 - 3, 40, 6);
      g.fillStyle = '#ece6d4';
      g.fillRect(s / 2 - 14, (y * s) / 4 + 18, 28, 12);
    }
    speckle(g, s, r, 0.04, true);
  }),
  hazard: drawTex((g, s, r) => {
    g.fillStyle = '#9a958d';
    g.fillRect(0, 0, s, s);
    speckle(g, s, r, 0.08, true);
    for (let i = -4; i < 12; i++) {
      g.fillStyle = i % 2 ? '#e0b52a' : '#1d1d1d';
      g.save();
      g.translate(i * 32, s - 40);
      g.transform(1, 0, -0.8, 1, 0, 0);
      g.fillRect(0, 0, 32, 40);
      g.restore();
    }
  }),
  wrap: drawTex((g, s, r) => {
    g.fillStyle = 'rgba(225,230,235,.85)';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 30; i++) {
      g.strokeStyle = `rgba(255,255,255,${0.2 + r() * 0.4})`;
      g.lineWidth = 1 + r() * 3;
      g.beginPath();
      g.moveTo(0, r() * s);
      g.lineTo(s, r() * s);
      g.stroke();
    }
    g.fillStyle = 'rgba(140,110,70,.35)';
    g.fillRect(0, 0, s, s);
  }),
  chain: drawTex((g, s) => {
    g.clearRect(0, 0, s, s);
    g.strokeStyle = 'rgba(170,175,180,.95)';
    g.lineWidth = 3;
    for (let i = -s; i < s * 2; i += 24) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i + s, s);
      g.moveTo(i, s);
      g.lineTo(i + s, 0);
      g.stroke();
    }
  }, 128),
  glass: drawTex((g, s) => {
    const gr = g.createLinearGradient(0, 0, s, s);
    gr.addColorStop(0, '#2a3f4f');
    gr.addColorStop(0.5, '#5d7a8c');
    gr.addColorStop(0.52, '#34495a');
    gr.addColorStop(1, '#1d2c38');
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
  }),
  sky: drawTex((g, w) => {
    const h = w;
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#6f8fa8');
    gr.addColorStop(0.42, '#b9cad3');
    gr.addColorStop(0.5, '#d9d6cc');
    gr.addColorStop(1, '#d9d6cc');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.06})`;
      g.beginPath();
      g.ellipse(
        Math.random() * w,
        h * 0.15 + Math.random() * h * 0.25,
        40 + Math.random() * 90,
        6 + Math.random() * 12,
        0,
        0,
        7
      );
      g.fill();
    }
  }, 512),
  tower: drawTex((g, s, r) => {
    g.fillStyle = '#4b5560';
    g.fillRect(0, 0, s, s);
    for (let y = 6; y < s; y += 16)
      for (let x = 6; x < s; x += 14) {
        g.fillStyle = r() < 0.15 ? 'rgba(255,225,160,.75)' : 'rgba(25,32,40,.85)';
        g.fillRect(x, y, 8, 9);
      }
  }),
});
/* ---------- materiais ---------- */
const M = {};
const T = (c, u, v) => dyn(game, c, u, v);
/* superfícies PBR procedurais (albedo+normal+ORM, ver 10-engine) com UV no espaço do mundo:
   paredes = 1 tile por célula (3 m x 3,2 m do chão ao teto), então painéis, vergas e paredes inteiras continuam o desenho sem repetir */
const WALLUV = [1 / CELL, 1 / WALL_H];
M.asphalt = pbr(game, { surf: 'asphalt', wuv: [1 / 4, 1 / 4] });
M.slab = pbr(game, { surf: 'paver', wuv: [1 / 3, 1 / 3] });
/* piso de tábuas de carvalho claro (o 'woodfloor' original puxava para laranja): mesma estrutura, cor mais neutra e verniz mais gasto */
SURF_DEF.oakfloor = [
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
    const t = 0.88 + 0.18 * pid,
      gr = 0.88 + 0.2 * g1 + 0.07 * g2;
    let r = 0.55 * t * gr,
      g = 0.47 * t * gr,
      b = 0.37 * t * gr;
    const lu = r * 0.3 + g * 0.59 + b * 0.11;
    r = mixv(lu, r, 0.8);
    g = mixv(lu, g, 0.8);
    b = mixv(lu, b, 0.8);
    const wear = ss(0.55, 0.75, pnz(u, v, 2, 3.3)) * 0.15,
      dirt = ss(0.6, 0.8, pnz(u, v, 6, 8)) * 0.14;
    r = r * (1 - dirt) + wear * 0.05;
    g = g * (1 - dirt) + wear * 0.05;
    b = b * (1 - dirt * 0.9) + wear * 0.045;
    o.r = r * mixv(0.45, 1, j);
    o.g = g * mixv(0.45, 1, j);
    o.b = b * mixv(0.45, 1, j);
    o.h = j * (0.6 + 0.06 * g1);
    o.ro = 0.45 + 0.1 * pid + wear * 0.35 + dirt * 0.35 + (1 - j) * 0.3;
    o.ao = 0.6 + 0.4 * j;
  },
  4,
];
M.wood = pbr(game, { surf: 'oakfloor', wuv: [1 / 3, 1 / 3] });
M.carpet = pbr(game, { surf: 'carpet', wuv: [1 / 1.5, 1 / 1.5] });
M.tile = pbr(game, { surf: 'terrazzo', wuv: [1 / 1.2, 1 / 1.2] });
M.raised = pbr(game, { surf: 'raised', wuv: [1 / 1.2, 1 / 1.2] });
M.concreteFloor = pbr(game, { surf: 'slabfloor', wuv: [1 / 3, 1 / 3] });
M.ceiling = pbr(game, { surf: 'ceiling', wuv: [1 / 1.2, 1 / 1.2] });
M.brick = pbr(game, { surf: 'brick', wuv: WALLUV });
M.concrete = pbr(game, { surf: 'concrete', wuv: WALLUV });
M.crate = pbr(game, { surf: 'crate' });
M.drywall = pbr(game, { surf: 'drywall', wuv: WALLUV });
M.brickPanel = M.brick;
M.metal = pbr(game, { surf: 'steel', wuv: WALLUV });
for (const k of ['wood', 'carpet', 'raised', 'concreteFloor'])
  M[k].zOffset = -1; /* pisos das salas ficam 2 cm acima do granilite: sem cintilação de longe */
M.planks = pbr(game, { tex: T(MAPTEX.planks), rough: 0.85 });
M.lamp = unlit(game, '#fff4dc');
M.fabric = pbr(game, { tex: T(MAPTEX.fabric), rough: 1 });
M.desk = pbr(game, { color: '#b8a58a', rough: 0.5 });
M.deskLeg = pbr(game, { color: '#3a3d42', rough: 0.4, metal: 0.8 });
M.screen = pbr(game, { color: '#15181c', rough: 0.2, metal: 0.3, emissive: '#1b2a36' });
M.rack = pbr(game, {
  tex: T(MAPTEX.rack),
  rough: 0.4,
  metal: 0.6,
  emissiveTex: T(MAPTEX.rackGlow),
});
M.drawers = pbr(game, { tex: T(MAPTEX.drawers), rough: 0.5, metal: 0.5 });
M.hazard = pbr(game, { tex: T(MAPTEX.hazard), rough: 0.9 });
M.wrap = pbr(game, { tex: T(MAPTEX.wrap), rough: 0.25 });
M.pallet = pbr(game, { color: '#8a6a45', rough: 0.9 });
M.chair = pbr(game, { color: '#25272b', rough: 0.6 });
M.frame = pbr(game, { color: '#d8d3c6', rough: 0.6 });
M.frameDark = pbr(game, { color: '#3c3f44', rough: 0.5, metal: 0.6 });
M.glass = pbr(game, { tex: T(MAPTEX.glass), rough: 0.05, metal: 0.7 });
M.pane = pbr(game, { name: 'pane', color: '#8fa6a4', rough: 0.08, alpha: 0.14, env: 1 });
M.pane.transparencyMode = B.PBRMaterial.PBRMATERIAL_ALPHABLEND;
M.pane.backFaceCulling = false;
M.bars = pbr(game, { name: 'bars', color: '#2c2f33', rough: 0.55, metal: 0.7 });
M.coping = pbr(game, { surf: 'concrete', wuv: [1 / CELL, 1 / CELL], color: '#d8d2c8' });
M.roof = pbr(game, { surf: 'asphalt', wuv: [1 / 4, 1 / 4] });
M.line = unlit(game, '#e6e2d6');
M.lineY = unlit(game, '#d9b23a');
M.tower = pbr(game, { tex: T(MAPTEX.tower, 2, 3), rough: 0.8, emissiveTex: T(MAPTEX.tower, 2, 3) });
M.tower.emissiveIntensity = 0.25;
M.chain = new B.StandardMaterial('chain', game);
M.chain.diffuseTexture = T(MAPTEX.chain, 40, 1);
M.chain.diffuseTexture.hasAlpha = true;
M.chain.useAlphaFromDiffuseTexture = true;
M.chain.backFaceCulling = false;
/* ---------- céu de fim de tarde (shader procedural, coerente com o sol) ----------
   Gradiente zênite→horizonte em espaço linear, halo e disco do sol (HDR → o bloom pega), nuvens fbm projetadas num plano
   (cúmulos esparsos iluminados pelo lado do sol). 1 chamada de desenho, ~5 oitavas de ruído só nos pixels de céu. */
B.Effect.ShadersStore.pcSkyVertexShader = `precision highp float;attribute vec3 position;uniform mat4 worldViewProjection;varying vec3 vDir;
void main(){vDir=position;gl_Position=worldViewProjection*vec4(position,1.);gl_Position.z=gl_Position.w*.99999;}`;
B.Effect.ShadersStore.pcSkyFragmentShader = `precision highp float;varying vec3 vDir;uniform vec3 sunDir;uniform vec3 zen;uniform vec3 hor;uniform vec3 sunC;
float h2(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*vn(p);p=mat2(1.6,1.2,-1.2,1.6)*p+vec2(3.1,7.7);a*=.5;}return s;}
void main(){vec3 d=normalize(vDir);float y=d.y,mu=max(dot(d,sunDir),0.);
float t=pow(clamp(y,0.,1.),.5);vec3 col=mix(hor,zen,t);
col+=sunC*(pow(mu,6.)*.3*(1.-t*.6)+pow(mu,600.)*.3);
if(y<0.)col=mix(hor,hor*.55,clamp(-y*5.,0.,1.));
if(y>.0){vec2 uv=d.xz/(y+.12)*1.3;float c=fbm(uv*.9+vec2(11.,3.));float cov=smoothstep(.56,.8,c)*smoothstep(.0,.22,y);
  float sh=fbm(uv*.9+vec2(11.,3.)+sunDir.xz*.18);float lit=clamp(1.1-(sh-c)*3.5,.45,1.25);
  vec3 cc=mix(vec3(.62,.6,.6),vec3(1.,.82,.62),clamp(pow(mu,2.)*.8+.15,0.,1.))*lit*(1.2+pow(mu,8.)*1.5);
  col=mix(col,cc,cov*.9);}
col+=sunC*5.*smoothstep(.99985,.99993,mu);
gl_FragColor=vec4(col,1.);}`;
const SKY = {
  zen: new B.Color3(0.085, 0.2, 0.47),
  hor: new B.Color3(0.74, 0.62, 0.48),
  sun: new B.Color3(1, 0.78, 0.52),
};
function skyMaterial() {
  const m = new B.ShaderMaterial(
    'skyShader',
    game,
    { vertex: 'pcSky', fragment: 'pcSky' },
    { attributes: ['position'], uniforms: ['worldViewProjection', 'sunDir', 'zen', 'hor', 'sunC'] }
  );
  m.backFaceCulling = false;
  m.disableDepthWrite = true;
  const sd = sun.direction.scale(-1).normalize();
  m.setVector3('sunDir', sd);
  m.setColor3('zen', SKY.zen);
  m.setColor3('hor', SKY.hor);
  m.setColor3('sunC', SKY.sun);
  /* névoa e fundo com a cor do horizonte (prédios distantes somem no céu) */
  game.fogColor = SKY.hor.toGammaSpace().scale(0.95);
  game.clearColor = B.Color4.FromColor3(SKY.hor.toGammaSpace(), 1);
  return m;
}
const _m = new B.Matrix(),
  _v = new B.Vector3(),
  _s = new B.Vector3(),
  _q = B.Quaternion.Identity();
let panelInt = null,
  panelExt = null;
const WTPL = {},
  CRATES =
    []; /* moldes das coberturas e lista das células (o módulo de modelos .glb decora em cima) */
/* monta um "molde" com várias peças e funde num único mesh (1 chamada de desenho por tipo) */
function template(name, parts) {
  const ms = parts.map(([w, h, d, x, y, z, mat, ry]) => {
    const b = B.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, game);
    b.position.set(x, y, z);
    if (ry) b.rotation.y = ry;
    b.material = mat;
    return b;
  });
  const m = B.Mesh.MergeMeshes(ms, true, true, undefined, false, true);
  m.name = name;
  caster(m);
  return m;
}
const place = (mesh, x, y, z, ry) => {
  B.Matrix.ComposeToRef(
    _s.set(1, 1, 1),
    B.Quaternion.RotationYawPitchRollToRef(ry || 0, 0, 0, _q),
    _v.set(x, y, z),
    _m
  );
  mesh.thinInstanceAdd(_m.clone(), false);
};
function roomOf(x, z) {
  if (!inside(x, z)) return 'out';
  if (x <= 15 && z <= 12) return 'office';
  if (x <= 15 && z >= 14) return 'archive';
  if (x >= 20 && z <= 11) return 'servers';
  if (x >= 20 && z >= 13) return 'storage';
  return 'hall';
}
/* ---------- janelas de verdade ----------
   Molde local: face interna da parede no plano z=0, interior em +z, largura em x. Vidro (transparente, quebrável),
   caixilho + peitoril por dentro, peitoril de concreto e grade por fora (a célula é colisão cheia: a grade explica). */
const WINM = {};
function winPlace(mesh, w) {
  const n = w.nx || w.nz,
    ry = Math.atan2(w.nx, w.nz),
    gx = w.nx ? (w.x + (n > 0 ? 1 : 0)) * CELL : cc(w.x),
    gz = w.nz ? (w.z + (n > 0 ? 1 : 0)) * CELL : cc(w.z);
  place(mesh, gx, 0, gz, ry);
}
function buildWindows() {
  const S = WIN_SILL,
    Hd = WIN_HEAD,
    hw = WIN_HW,
    ym = (S + Hd) / 2,
    hh_ = Hd - S,
    F = 0.07;
  WINM.frame = template('winFrame', [
    [2 * hw + 2 * F, F, 0.07, 0, Hd + F / 2, 0.0, M.frame],
    [F, hh_, 0.07, -hw - F / 2, ym, 0, M.frame],
    [F, hh_, 0.07, hw + F / 2, ym, 0, M.frame],
    [2 * hw + 0.24, 0.045, 0.2, 0, S - 0.01, 0.06, M.frame],
    [2 * hw + 0.1, 0.09, 0.04, 0, S - 0.07, 0.005, M.frame],
    [0.05, hh_, 0.05, 0, ym, -0.06, M.frame],
    [2 * hw, 0.05, 0.05, 0, S + hh_ * 0.62, -0.06, M.frame],
  ]);
  WINM.frame.receiveShadows = true;
  shadowCasters.splice(shadowCasters.indexOf(WINM.frame), 1);
  const bars = [];
  for (let i = 0; i < 7; i++)
    bars.push([0.03, hh_, 0.03, -hw + 0.12 + (i * (2 * hw - 0.24)) / 6, ym, -CELL + 0.14, M.bars]);
  bars.push(
    [2 * hw, 0.05, 0.012, 0, S + 0.2, -CELL + 0.14, M.bars],
    [2 * hw, 0.05, 0.012, 0, Hd - 0.2, -CELL + 0.14, M.bars]
  );
  bars.push([2 * hw + 0.3, 0.1, 0.32, 0, S - 0.05, -CELL - 0.08, M.coping]);
  WINM.out = template('winOut', bars);
  WINM.out.receiveShadows = true;
  shadowCasters.splice(shadowCasters.indexOf(WINM.out), 1);
  WINM.pane = B.MeshBuilder.CreateBox(
    'winPane',
    { width: 2 * hw, height: hh_, depth: 0.012 },
    game
  );
  WINM.pane.material = M.pane;
  WINM.pane.isPickable = false;
  B.Matrix.TranslationToRef(0, ym, -0.06, _m);
  WINM.pane.bakeTransformIntoVertices(_m);
  for (const w of WINS) {
    winPlace(WINM.frame, w);
    winPlace(WINM.out, w);
    winPlace(WINM.pane, w);
  }
  for (const k in WINM) {
    WINM[k].thinInstanceBufferUpdated('matrix');
    WINM[k].thinInstanceRefreshBoundingInfo(true);
  }
  WINM.paneM = new Float32Array(WINM.pane.thinInstanceGetWorldMatrices().length * 16);
  WINM.pane.thinInstanceGetWorldMatrices().forEach((m, i) => m.copyToArray(WINM.paneM, i * 16));
}
/* contraste interno: o sol que entra pelas janelas precisa se destacar das luminárias (antes o interior era claro e chapado) */
LK.lampI = 2.15;
LK.amb = 0.27;
sun.intensity = 7.4;
sun.diffuse = C3('#ffd8a8');
/* vidro: some (escala zero) quando quebra; volta no reinício da rodada */
function setWinPane(w, on) {
  const m = on ? B.Matrix.FromArray(WINM.paneM, w.idx * 16) : B.Matrix.Scaling(0, 0, 0);
  WINM.pane.thinInstanceSetMatrixAt(w.idx, m, true);
}
function winCenter(w) {
  const n = w.nx || w.nz,
    g = winGlass(w);
  return w.nx
    ? new V3(g, (WIN_SILL + WIN_HEAD) / 2, cc(w.z))
    : new V3(cc(w.x), (WIN_SILL + WIN_HEAD) / 2, g);
}
/* efeito visual da quebra (a simulação marca w.broken em breakWindow e chama HOOK.winBroken) */
function winBreak(w) {
  if (!w) return;
  setWinPane(w, false);
  const c = winCenter(w);
  fxDebris(c, 14, '#b9cacb', 2.4);
  fxPuff(c, '#dfe8e8', 0.8, 0.3);
  if (typeof playSound === 'function') playSound('impact', c, { kind: 'metal' });
  /* marcas de bala que estavam no vidro não ficam flutuando no ar */
  const b = winBox(w),
    E = 0.2;
  for (const d of FX.decals) {
    if (!d.isVisible) continue;
    const p = d.position;
    if (
      p.x > b[0] - E &&
      p.x < b[3] + E &&
      p.y > b[1] - E &&
      p.y < b[4] + E &&
      p.z > b[2] - E &&
      p.z < b[5] + E &&
      Math.abs((w.nx ? p.x : p.z) - winGlass(w)) < 0.25
    )
      d.isVisible = false;
  }
}
/* "casca de sombra": malha invisível (fora da máscara da câmera) que só entra no mapa de sombra do sol.
   Forro/telhado sobre o interior + pele fina (30 cm) nas faces das paredes da fachada, com furo nas janelas.
   Assim o sol atravessa a janela e desenha a mancha no chão/paredes internas, sem os 3 m de parede bloquearem o raio. */
function buildShadowShell() {
  const parts = [],
    T = 0.3,
    box = (x0, y0, z0, x1, y1, z1) => {
      const b = B.MeshBuilder.CreateBox(
        'sh',
        { width: x1 - x0, height: y1 - y0, depth: z1 - z0 },
        game
      );
      b.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      parts.push(b);
    };
  box(
    (BX0 + 1) * CELL - 0.1,
    WALL_H,
    (BZ0 + 1) * CELL - 0.1,
    BX1 * CELL + 0.1,
    WALL_H + 0.3,
    BZ1 * CELL + 0.1
  );
  for (let z = BZ0; z <= BZ1; z++)
    for (let x = BX0; x <= BX1; x++) {
      const c = grid[z][x],
        X = x * CELL,
        Z = z * CELL;
      if (c !== 1) {
        if (!(x > BX0 && x < BX1 && z > BZ0 && z < BZ1))
          box(X - 0.05, WALL_H, Z - 0.05, X + CELL + 0.05, WALL_H + 0.3, Z + CELL + 0.05);
        continue;
      }
      if (x > BX0 && x < BX1 && z > BZ0 && z < BZ1) {
        box(X, 0, Z, X + CELL, WALL_H, Z + CELL);
        continue;
      } /* pilares internos */
      const wn = winAt(x, z);
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        if (cellAt(x + dx, z + dz) === 1) continue;
        const top = inside(x + dx, z + dz) ? WALL_H + 0.3 : WALL_H;
        /* placa de espessura T rente à face (dentro da célula), um pouco mais longa para fechar os cantos */
        let x0, x1, z0, z1;
        if (dx) {
          x0 = dx > 0 ? X + CELL - T : X;
          x1 = x0 + T;
          z0 = Z - T;
          z1 = Z + CELL + T;
        } else {
          z0 = dz > 0 ? Z + CELL - T : Z;
          z1 = z0 + T;
          x0 = X - T;
          x1 = X + CELL + T;
        }
        const hole = wn && ((wn.nx && dx) || (wn.nz && dz));
        if (!hole) {
          box(x0, 0, z0, x1, top, z1);
          continue;
        }
        const b = winBox(wn);
        box(x0, 0, z0, x1, WIN_SILL, z1);
        box(x0, WIN_HEAD, z0, x1, top, z1);
        if (dx) {
          box(x0, WIN_SILL, z0, x1, WIN_HEAD, b[2]);
          box(x0, WIN_SILL, b[5], x1, WIN_HEAD, z1);
        } else {
          box(x0, WIN_SILL, z0, b[0], WIN_HEAD, z1);
          box(b[3], WIN_SILL, z0, x1, WIN_HEAD, z1);
        }
      }
    }
  const m = B.Mesh.MergeMeshes(parts, true, true);
  m.name = 'shadowShell';
  m.material = M.coping;
  m.layerMask = 0x10000000;
  m.isPickable = false;
  m.receiveShadows = false;
  m.freezeWorldMatrix();
  shadowCasters.push(m);
}
/* ---------- ambientação barata: rodapés, tomadas, quadros, eletrodutos, papéis no chão, sujeira na base das paredes ----------
   Tudo numa malha estática (1 textura-atlas gerada em canvas, 1 chamada de desenho) + 1 malha de sujeira (alfa, 1 chamada).
   Só em paredes duras (as finas quebram e deixariam objetos flutuando). */
const DECOR_ATLAS = drawTex(
  (g, s, r) => {
    g.fillStyle = '#777';
    g.fillRect(0, 0, s, s);
    const P = (i, j) => [i * 128, j * 128];
    /* quadros 128x128: abstrato quente, planta de evacuação, quadro de avisos, paisagem */
    {
      const [x, y] = P(0, 0);
      g.fillStyle = '#e9e2d0';
      g.fillRect(x, y, 128, 128);
      const c = ['#b5532e', '#d9a441', '#2f4b5c', '#7d8c6a', '#3b2b25'];
      for (let i = 0; i < 9; i++) {
        g.fillStyle = c[i % 5];
        g.globalAlpha = 0.85;
        g.fillRect(x + 10 + r() * 80, y + 10 + r() * 80, 15 + r() * 40, 10 + r() * 40);
      }
      g.globalAlpha = 1;
    }
    {
      const [x, y] = P(1, 0);
      g.fillStyle = '#f1efe6';
      g.fillRect(x, y, 128, 128);
      g.strokeStyle = '#4a4a4a';
      g.lineWidth = 2;
      g.strokeRect(x + 12, y + 22, 104, 94);
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        g.moveTo(x + 12 + r() * 104, y + 22);
        g.lineTo(x + 12 + r() * 104, y + 116);
        g.stroke();
      }
      g.strokeStyle = '#2f9a4f';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x + 20, y + 100);
      g.lineTo(x + 64, y + 100);
      g.lineTo(x + 64, y + 40);
      g.lineTo(x + 108, y + 40);
      g.stroke();
      g.fillStyle = '#2f9a4f';
      g.fillRect(x + 8, y + 6, 112, 12);
      g.fillStyle = '#c33';
      g.beginPath();
      g.arc(x + 40, y + 70, 4, 0, 7);
      g.fill();
    }
    {
      const [x, y] = P(2, 0);
      g.fillStyle = '#8a6b47';
      g.fillRect(x, y, 128, 128);
      g.fillStyle = '#b48d5f';
      g.fillRect(x + 6, y + 6, 116, 116);
      for (let i = 0; i < 7; i++) {
        g.fillStyle = ['#f4f1e6', '#f7e48a', '#cfe3f2', '#f4f1e6'][i % 4];
        const w = 24 + r() * 18,
          h = 28 + r() * 16,
          px = x + 10 + r() * (100 - w),
          py = y + 10 + r() * (100 - h);
        g.fillRect(px, py, w, h);
        g.fillStyle = 'rgba(60,60,60,.5)';
        for (let k = 0; k < 4; k++) g.fillRect(px + 3, py + 6 + k * 6, w - 8, 1.5);
        g.fillStyle = '#c22';
        g.fillRect(px + w / 2 - 2, py + 1, 4, 4);
      }
    }
    {
      const [x, y] = P(3, 0);
      const gr = g.createLinearGradient(0, y, 0, y + 128);
      gr.addColorStop(0, '#9cb6c6');
      gr.addColorStop(0.55, '#e2c9a0');
      gr.addColorStop(0.56, '#5d6b4a');
      gr.addColorStop(1, '#3a4230');
      g.fillStyle = gr;
      g.fillRect(x, y, 128, 128);
      g.fillStyle = '#4b5a44';
      g.beginPath();
      g.moveTo(x, y + 75);
      for (let i = 0; i <= 8; i++) g.lineTo(x + i * 16, y + 60 + r() * 16);
      g.lineTo(x + 128, y + 128);
      g.lineTo(x, y + 128);
      g.fill();
    }
    /* papéis (2 variações) */
    for (const k of [0, 1]) {
      const [x, y] = P(k, 1);
      g.fillStyle = k ? '#ece6d6' : '#f3f2ec';
      g.fillRect(x, y, 128, 128);
      g.fillStyle = 'rgba(50,50,60,.55)';
      for (let i = 0; i < 14; i++)
        g.fillRect(x + 12, y + 14 + i * 7.5, (k && i === 0 ? 60 : 100) * (0.6 + r() * 0.4), 2);
      if (k) {
        g.fillStyle = 'rgba(30,60,140,.6)';
        g.fillRect(x + 12, y + 4, 40, 6);
      }
    }
    /* amostras de cor 32x32 a partir de (256,128): rodapé, tomada, eletroduto, preto (moldura/cabo), metal escovado */
    ['#3a3632', '#e8e4da', '#9a9c9a', '#141516', '#6d7176', '#c9c3b3'].forEach((c, i) => {
      g.fillStyle = c;
      g.fillRect(256 + i * 32, 128, 32, 32);
    });
  },
  512,
  77
);
const DSW = (i) => [
  (256 + i * 32 + 8) / 512,
  136 / 512,
  (256 + i * 32 + 24) / 512,
  152 / 512,
]; /* retângulo UV (u0,v0,u1,v1) de uma amostra */
const DPIC = (i) => [(i * 128 + 2) / 512, 2 / 512, (i * 128 + 126) / 512, 126 / 512],
  DPAP = (k) => [(k * 128 + 2) / 512, 130 / 512, (k * 128 + 126) / 512, 254 / 512];
function decorUV(m, rc) {
  const uv = m.getVerticesData(B.VertexBuffer.UVKind),
    o = new Float32Array(uv.length);
  for (let i = 0; i < uv.length; i += 2) {
    o[i] = rc[0] + uv[i] * (rc[2] - rc[0]);
    o[i + 1] = rc[3] - uv[i + 1] * (rc[3] - rc[1]);
  }
  m.setVerticesData(B.VertexBuffer.UVKind, o);
  return m;
}
function buildDecor() {
  const parts = [],
    grime = [],
    rnd = mulberry(9);
  /* peça no referencial da face: lx lateral, y altura, lz para dentro da sala */
  const put = (m, f, lx, y, lz, rx, ry2) => {
    const ry = Math.atan2(f.dx, f.dz),
      c = Math.cos(ry),
      sn = Math.sin(ry);
    if (rx) m.rotation.x = rx;
    m.rotation.y = ry + (ry2 || 0);
    m.position.set(f.px + lx * c + lz * sn, y, f.pz - lx * sn + lz * c);
    m.computeWorldMatrix(true);
    m.bakeCurrentTransformIntoVertices();
    parts.push(m);
    return m;
  };
  const box = (w, h, d, rc) =>
    decorUV(B.MeshBuilder.CreateBox('dc', { width: w, height: h, depth: d }, game), rc);
  const plane = (w, h, rc) =>
    decorUV(B.MeshBuilder.CreatePlane('dc', { width: w, height: h }, game), rc);
  /* faces internas das paredes duras (vizinho é chão/caixa dentro do prédio) */
  const faces = [];
  for (let z = BZ0; z <= BZ1; z++)
    for (let x = BX0; x <= BX1; x++) {
      if (grid[z][x] !== 1) continue;
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx,
          nz = z + dz,
          c = cellAt(nx, nz);
        if (!inside(nx, nz) || (c !== 0 && c !== 2)) continue;
        faces.push({
          x,
          z,
          dx,
          dz,
          px: cc(x) + (dx * CELL) / 2,
          pz: cc(z) + (dz * CELL) / 2,
          win: !!winAt(x, z),
          room: roomOf(nx, nz),
          k: hashStr(x + '/' + z + '/' + dx + '/' + dz),
        });
      }
    }
  let pics = 0;
  for (const f of faces) {
    put(box(CELL, 0.1, 0.025, DSW(0)), f, 0, 0.05, 0.012); /* rodapé */
    if (f.k % 3 === 0)
      put(box(0.08, 0.12, 0.02, DSW(1)), f, ((f.k % 5) - 2) * 0.4, 0.32, 0.01); /* tomada */
    if (!f.win && f.k % 4 === 1 && pics < 14) {
      const i = (f.k >> 3) % 4,
        w = i === 2 ? 1.1 : 0.75,
        h = i === 2 ? 0.8 : 0.95;
      pics++; /* quadro / mural */
      put(box(w + 0.08, h + 0.08, 0.03, DSW(3)), f, ((f.k % 3) - 1) * 0.35, 1.55, 0.015);
      put(plane(w, h, DPIC(i)), f, ((f.k % 3) - 1) * 0.35, 1.55, 0.032, 0, Math.PI);
    }
    /* sujeira na base: faixa vertical com degradê */
    const gm = B.MeshBuilder.CreatePlane('gr', { width: CELL, height: 0.45 }, game);
    const ry = Math.atan2(f.dx, f.dz);
    gm.rotation.y = ry + Math.PI;
    gm.position.set(f.px + Math.sin(ry) * 0.028, 0.225, f.pz + Math.cos(ry) * 0.028);
    gm.computeWorldMatrix(true);
    gm.bakeCurrentTransformIntoVertices();
    grime.push(gm);
  }
  /* eletrodutos no forro do corredor e caixas de passagem (lembram o teto técnico das referências) */
  for (const xo of [52.1, 52.35]) {
    const p = B.MeshBuilder.CreateCylinder(
      'dc',
      { height: (BZ1 - BZ0 - 1) * CELL, diameter: xo > 52.2 ? 0.05 : 0.08, tessellation: 8 },
      game
    );
    decorUV(p, DSW(2));
    p.rotation.x = Math.PI / 2;
    p.position.set(xo, WALL_H - 0.12, (BZ0 + 1) * CELL + ((BZ1 - BZ0 - 1) * CELL) / 2);
    p.computeWorldMatrix(true);
    p.bakeCurrentTransformIntoVertices();
    parts.push(p);
  }
  for (let z = BZ0 + 2; z < BZ1; z += 4) {
    const b = box(0.18, 0.1, 0.18, DSW(4));
    b.position.set(52.2, WALL_H - 0.11, cc(z));
    b.computeWorldMatrix(true);
    b.bakeCurrentTransformIntoVertices();
    parts.push(b);
  }
  /* eletrocalha na sala de servidores */
  {
    const b = box(0.3, 0.06, (11 - 6 + 1) * CELL, DSW(4));
    b.position.set(cc(23), WALL_H - 0.35, 6 * CELL + (6 * CELL) / 2);
    b.computeWorldMatrix(true);
    b.bakeCurrentTransformIntoVertices();
    parts.push(b);
  }
  /* papéis espalhados no chão (corredor, escritório, arquivo) */
  for (let i = 0; i < 70; i++) {
    const x = BX0 + 1 + Math.floor(rnd() * (BX1 - BX0 - 1)),
      z = BZ0 + 1 + Math.floor(rnd() * (BZ1 - BZ0 - 1));
    if (cellAt(x, z) !== 0) continue;
    const rm = roomOf(x, z);
    if (rm === 'servers' || (rm === 'storage' && rnd() < 0.6)) continue;
    const n = 1 + Math.floor(rnd() * 3),
      bx = cc(x) + (rnd() - 0.5) * 2.2,
      bz = cc(z) + (rnd() - 0.5) * 2.2;
    for (let k = 0; k < n; k++) {
      const p = decorUV(
        B.MeshBuilder.CreateGround('dc', { width: 0.21, height: 0.297 }, game),
        DPAP(rnd() < 0.5 ? 0 : 1)
      );
      p.rotation.y = rnd() * 6.28;
      p.rotation.x = (rnd() - 0.5) * 0.04;
      p.position.set(bx + (rnd() - 0.5) * 0.5, 0.06 + k * 0.002, bz + (rnd() - 0.5) * 0.5);
      p.computeWorldMatrix(true);
      p.bakeCurrentTransformIntoVertices();
      parts.push(p);
    }
  }
  const m = B.Mesh.MergeMeshes(parts, true, true);
  m.name = 'decor';
  m.material = pbr(game, { name: 'decorM', tex: dyn(game, DECOR_ATLAS), rough: 0.75 });
  m.receiveShadows = true;
  m.isPickable = false;
  m.freezeWorldMatrix();
  const gtx = drawTex((g, s) => {
    const gr = g.createLinearGradient(0, 0, 0, s);
    gr.addColorStop(0, 'rgba(20,16,12,0)');
    gr.addColorStop(0.55, 'rgba(20,16,12,.18)');
    gr.addColorStop(1, 'rgba(20,16,12,.55)');
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
  }, 64);
  const gm = B.Mesh.MergeMeshes(grime, true, true);
  gm.name = 'grime';
  const gmat = new B.StandardMaterial('grimeM', game);
  gmat.diffuseTexture = dyn(game, gtx);
  gmat.diffuseTexture.hasAlpha = true;
  gmat.useAlphaFromDiffuseTexture = true;
  gmat.disableLighting = true;
  gmat.emissiveColor = new B.Color3(0, 0, 0);
  gmat.diffuseColor = new B.Color3(0, 0, 0);
  gmat.zOffset = -2;
  gm.material = gmat;
  gm.isPickable = false;
  gm.freezeWorldMatrix();
}
(function buildWorld() {
  /* céu e horizonte */
  const sky = B.MeshBuilder.CreateSphere(
    'sky',
    { diameter: 500, segments: 24, sideOrientation: B.Mesh.BACKSIDE },
    game
  );
  sky.material = skyMaterial();
  sky.position.set((W * CELL) / 2, 0, (H * CELL) / 2);
  sky.infiniteDistance = true;
  sky.applyFog = false;
  sky.isPickable = false;
  const towers = template('towers', [[10, 1, 10, 0, 0.5, 0, M.tower]]);
  towers.receiveShadows = false;
  shadowCasters.splice(shadowCasters.indexOf(towers), 1);
  const rnd = mulberry(42);
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2,
      d = 95 + rnd() * 70,
      h = 14 + rnd() * 45,
      w = 10 + rnd() * 18;
    B.Matrix.ComposeToRef(
      _s.set(w / 10, h, w / 10),
      B.Quaternion.RotationYawPitchRollToRef(rnd() * 1.5, 0, 0, _q),
      _v.set((W * CELL) / 2 + Math.cos(a) * d, 0, (H * CELL) / 2 + Math.sin(a) * d * 0.8),
      _m
    );
    towers.thinInstanceAdd(_m.clone(), false);
  }
  towers.thinInstanceBufferUpdated('matrix');
  towers.thinInstanceRefreshBoundingInfo(true);
  const outer = B.MeshBuilder.CreateGround('outer', { width: 600, height: 600 }, game);
  outer.position.set((W * CELL) / 2, -0.02, (H * CELL) / 2);
  outer.material = pbr(game, { color: '#6a675f', rough: 1 });
  /* chão externo, calçada e vagas */
  const g = B.MeshBuilder.CreateGround('ground', { width: W * CELL, height: H * CELL }, game);
  g.position.set((W * CELL) / 2, 0, (H * CELL) / 2);
  g.material = M.asphalt;
  g.receiveShadows = true;
  const sw = template('sidewalk', [[1, 0.06, 1, 0, 0.03, 0, M.slab]]);
  for (let z = BZ0 - 1; z <= BZ1 + 1; z++)
    for (let x = BX0 - 1; x <= BX1 + 1; x++) {
      if (
        (x === BX0 - 1 || x === BX1 + 1 || z === BZ0 - 1 || z === BZ1 + 1) &&
        cellAt(x, z) === 0
      ) {
        B.Matrix.ComposeToRef(
          _s.set(CELL, 1, CELL),
          _q.set(0, 0, 0, 1),
          _v.set(cc(x), 0, cc(z)),
          _m
        );
        sw.thinInstanceAdd(_m.clone(), false);
      }
    }
  sw.thinInstanceBufferUpdated('matrix');
  const ln = template('lines', [[0.12, 0.01, 4.2, 0, 0.012, 0, M.line]]);
  for (const [x0, x1, zc] of [
    [2, 30, 3.0],
    [2, 30, 25.0],
  ])
    for (let x = x0; x <= x1; x += 1) {
      if (cellAt(x, Math.floor(zc)) === 0 && cellAt(x, Math.floor(zc) - 1) === 0)
        place(ln, x * CELL, 0, zc * CELL);
    }
  ln.thinInstanceBufferUpdated('matrix');
  /* pisos internos por sala */
  const FLOORM = {
    tile: M.tile,
    wood: M.wood,
    carpet: M.carpet,
    raised: M.raised,
    concrete: M.concreteFloor,
  };
  const iw = (BX1 - BX0 - 1) * CELL,
    ih = (BZ1 - BZ0 - 1) * CELL,
    icx = (BX0 + 1) * CELL + iw / 2,
    icz = (BZ0 + 1) * CELL + ih / 2;
  const room = (x0, x1, z0, z1, key, u, rough, metal) => {
    const w = (x1 - x0 + 1) * CELL,
      h = (z1 - z0 + 1) * CELL;
    const f = B.MeshBuilder.CreateGround('rf', { width: w, height: h }, game);
    f.position.set(x0 * CELL + w / 2, 0.012, z0 * CELL + h / 2);
    f.material = FLOORM[key];
    f.receiveShadows = true;
  };
  room(BX0 + 1, BX1 - 1, BZ0 + 1, BZ1 - 1, 'tile', 3, 0.35); /* corredor e vãos de porta */
  const room2 = (x0, x1, z0, z1, key, u, rough, metal) => {
    const w = (x1 - x0 + 1) * CELL,
      h = (z1 - z0 + 1) * CELL;
    const f = B.MeshBuilder.CreateGround('rf', { width: w, height: h }, game);
    f.position.set(x0 * CELL + w / 2, 0.035, z0 * CELL + h / 2);
    f.material = FLOORM[key];
    f.receiveShadows = true;
  };
  room2(8, 15, 6, 12, 'wood', 2.4, 0.55);
  room2(8, 15, 14, 21, 'carpet', 3, 1);
  room2(20, 27, 6, 11, 'raised', 1.5, 0.5, 0.3);
  room2(20, 27, 13, 21, 'concrete', 3, 0.9);
  const ce = B.MeshBuilder.CreateGround('ceil', { width: iw, height: ih }, game);
  ce.position.set(icx, WALL_H, icz);
  ce.rotation.x = Math.PI;
  /* CreateGround não tem DOUBLESIDE: vira o plano para baixo (antes o forro era invisível e via-se o fundo do telhado) */ ce.material =
    M.ceiling;
  caster(ce);
  const lamp = template('lamp', [[1.3, 0.05, 0.45, 0, 0, 0, M.lamp]]);
  for (let z = BZ0 + 2; z < BZ1; z += 3)
    for (let x = BX0 + 2; x < BX1; x += 3) {
      if (cellAt(x, z) !== 0) continue;
      place(lamp, cc(x), WALL_H - 0.03, cc(z));
    }
  lamp.thinInstanceBufferUpdated('matrix');
  /* telhado com platibanda (visto de fora) */
  const bw = (BX1 - BX0 + 1) * CELL,
    bh = (BZ1 - BZ0 + 1) * CELL,
    bcx = BX0 * CELL + bw / 2,
    bcz = BZ0 * CELL + bh / 2;
  const roof = B.MeshBuilder.CreateBox(
    'roof',
    { width: bw - 0.2, height: 0.3, depth: bh - 0.2 },
    game
  );
  /* 10 cm para dentro: as laterais não coincidem com a face da platibanda */ roof.position.set(
    bcx,
    WALL_H + 0.17,
    bcz
  );
  roof.material = M.roof;
  roof.receiveShadows = true;
  for (const [w, d, x, z] of [
    [bw + 0.2, 0.3, bcx, BZ0 * CELL + 0.15],
    [bw + 0.2, 0.3, bcx, (BZ1 + 1) * CELL - 0.15],
    [0.3, bh, BX0 * CELL + 0.15, bcz],
    [0.3, bh, (BX1 + 1) * CELL - 0.15, bcz],
  ]) {
    const p = B.MeshBuilder.CreateBox('par', { width: w, height: 0.7, depth: d }, game);
    p.position.set(x, WALL_H + 0.35, z);
    p.material = M.coping;
  }
  /* paredes duras: prédio (tijolo) e muro externo (concreto + alambrado) */
  const wallBox = (name, mat) => {
    const b = B.MeshBuilder.CreateBox(
      name,
      { width: CELL, height: WALL_H, depth: CELL, wrap: true },
      game
    );
    b.material = mat;
    return caster(b);
  };
  const bricks = wallBox('bricks', M.brick),
    conc = wallBox('conc', M.concrete);
  shadowCasters.splice(shadowCasters.indexOf(bricks), 1);
  const cop = template('coping', [[CELL + 0.06, 0.12, CELL + 0.06, 0, 0, 0, M.coping]]);
  /* célula com janela: a parede vira 4 blocos (abaixo do peitoril, acima da verga e os dois lados) — mesma malha, UV no espaço do mundo */
  const brickPart = (x0, y0, z0, x1, y1, z1) => {
    B.Matrix.ComposeToRef(
      _s.set((x1 - x0) / CELL, (y1 - y0) / WALL_H, (z1 - z0) / CELL),
      _q.set(0, 0, 0, 1),
      _v.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2),
      _m
    );
    bricks.thinInstanceAdd(_m.clone(), false);
  };
  for (let z = 0; z < H; z++)
    for (let x = 0; x < W; x++) {
      if (grid[z][x] !== 1) continue;
      const mt = B.Matrix.Translation(cc(x), WALL_H / 2, cc(z));
      if (x >= BX0 && x <= BX1 && z >= BZ0 && z <= BZ1) {
        const wn = winAt(x, z);
        if (!wn) {
          bricks.thinInstanceAdd(mt, false);
          continue;
        }
        const X = x * CELL,
          Z = z * CELL,
          b = winBox(wn);
        brickPart(X, 0, Z, X + CELL, WIN_SILL, Z + CELL);
        brickPart(X, WIN_HEAD, Z, X + CELL, WALL_H, Z + CELL);
        if (wn.nx) {
          brickPart(X, WIN_SILL, Z, X + CELL, WIN_HEAD, b[2]);
          brickPart(X, WIN_SILL, b[5], X + CELL, WIN_HEAD, Z + CELL);
        } else {
          brickPart(X, WIN_SILL, Z, b[0], WIN_HEAD, Z + CELL);
          brickPart(b[3], WIN_SILL, Z, X + CELL, WIN_HEAD, Z + CELL);
        }
      } else {
        conc.thinInstanceAdd(mt, false);
        place(cop, cc(x), WALL_H + 0.06, cc(z));
      }
    }
  bricks.thinInstanceBufferUpdated('matrix');
  conc.thinInstanceBufferUpdated('matrix');
  cop.thinInstanceBufferUpdated('matrix');
  const L = W * CELL,
    Hh = H * CELL;
  for (const [w, x, z, ry] of [
    [L, L / 2, CELL / 2, 0],
    [L, L / 2, Hh - CELL / 2, 0],
    [Hh, CELL / 2, Hh / 2, Math.PI / 2],
    [Hh, L - CELL / 2, Hh / 2, Math.PI / 2],
  ]) {
    const f = B.MeshBuilder.CreatePlane(
      'fence',
      { width: w, height: 1.3, sideOrientation: B.Mesh.DOUBLESIDE },
      game
    );
    f.position.set(x, WALL_H + 0.75, z);
    f.rotation.y = ry;
    f.material = M.chain.clone('ch');
    f.material.diffuseTexture = M.chain.diffuseTexture.clone();
    f.material.diffuseTexture.uScale = w / 1.2;
    f.material.diffuseTexture.vScale = 1;
  }
  buildWindows();
  buildShadowShell();
  /* objetos de cobertura: o visual muda por sala (todos têm topo a 1,2 m para escalar) */
  const C = CRATE_H,
    S2 = CELL * 0.92;
  const TPL = {
    crates: template('crates', [
      [1.36, C, 1.36, -0.69, C / 2, -0.69, M.crate],
      [1.36, C, 1.36, 0.69, C / 2, -0.69, M.crate, 0.08],
      [1.36, C, 1.36, -0.69, C / 2, 0.69, M.crate, -0.05],
      [1.36, C, 1.36, 0.69, C / 2, 0.69, M.crate],
    ]),
    pallets: template('pallets', [
      [S2, 0.14, S2, 0, 0.07, 0, M.pallet],
      [S2 - 0.1, C - 0.14, S2 - 0.1, 0, 0.14 + (C - 0.14) / 2, 0, M.wrap],
    ]),
    block: template('block', [
      [S2, C - 0.1, S2, 0, (C - 0.1) / 2, 0, M.hazard],
      [S2 - 0.2, 0.1, S2 - 0.2, 0, C - 0.05, 0, M.concrete],
    ]),
    cubicle: template('cubicle', [
      [S2, C - 0.012, 0.06, 0, (C - 0.012) / 2, 0, M.fabric],
      [0.06, C - 0.024, S2, 0, (C - 0.024) / 2, 0, M.fabric],
      [S2, C, 0.06, 0, C / 2, -S2 / 2, M.fabric],
      [S2, C, 0.06, 0, C / 2, S2 / 2, M.fabric],
      [0.06, C, S2, -S2 / 2, C / 2, 0, M.fabric],
      [0.06, C, S2, S2 / 2, C / 2, 0, M.fabric],
    ]),
    /* mesas procedurais: reserva caso os modelos .glb não carreguem */
    cubicleDesk: template('cubicleDesk', [
      [1.25, 0.04, 0.7, -0.66, 0.74, -0.38, M.desk],
      [1.25, 0.04, 0.7, 0.66, 0.74, -0.38, M.desk],
      [1.25, 0.04, 0.7, -0.66, 0.74, 0.38, M.desk],
      [1.25, 0.04, 0.7, 0.66, 0.74, 0.38, M.desk],
      [0.5, 0.32, 0.03, -0.66, 0.96, -0.6, M.screen],
      [0.5, 0.32, 0.03, 0.66, 0.96, -0.6, M.screen],
      [0.5, 0.32, 0.03, -0.66, 0.96, 0.6, M.screen],
      [0.5, 0.32, 0.03, 0.66, 0.96, 0.6, M.screen],
      [0.04, 0.72, 0.6, -1.2, 0.36, -0.38, M.deskLeg],
      [0.04, 0.72, 0.6, 1.2, 0.36, -0.38, M.deskLeg],
      [0.04, 0.72, 0.6, -1.2, 0.36, 0.38, M.deskLeg],
      [0.04, 0.72, 0.6, 1.2, 0.36, 0.38, M.deskLeg],
    ]),
    servers: template('servers', [
      [1.3, C, 1.1, -0.68, C / 2, -0.62, M.rack],
      [1.3, C, 1.1, 0.68, C / 2, -0.62, M.rack],
      [1.3, C, 1.1, -0.68, C / 2, 0.62, M.rack],
      [1.3, C, 1.1, 0.68, C / 2, 0.62, M.rack],
      [S2, 0.06, S2, 0, C - 0.018, 0, M.frameDark],
    ]),
    archive: template('archive', [
      [S2, C, 1.25, 0, C / 2, -0.7, M.drawers],
      [S2, C, 1.25, 0, C / 2, 0.7, M.drawers],
      [S2 + 0.04, 0.04, S2 + 0.04, 0, C - 0.008, 0, M.frameDark],
    ]),
    counter: template('counter', [
      [S2, C - 0.06, S2 * 0.6, 0, (C - 0.06) / 2, 0, M.desk],
      [S2 + 0.1, 0.06, S2 * 0.6 + 0.1, 0, C - 0.03, 0, M.wood],
      [S2 * 0.3, C - 0.06, S2 * 0.4, -S2 * 0.35, (C - 0.06) / 2, S2 * 0.45, M.desk],
    ]),
  };
  const choose = (x, z) => {
    const r = roomOf(x, z),
      h = hashStr(x + ',' + z) % 4;
    if (r === 'office') return 'cubicle';
    if (r === 'archive') return 'archive';
    if (r === 'servers') return 'servers';
    if (r === 'storage') return h < 2 ? 'crates' : 'pallets';
    if (r === 'hall') return 'counter';
    return ['crates', 'pallets', 'block', 'crates'][h];
  };
  for (let z = 0; z < H; z++)
    for (let x = 0; x < W; x++) {
      if (grid[z][x] !== 2) continue;
      const k = choose(x, z),
        ry = ((hashStr(z + ':' + x) % 4) * Math.PI) / 2;
      place(TPL[k], cc(x), 0, cc(z), ry);
      if (k === 'cubicle') place(TPL.cubicleDesk, cc(x), 0, cc(z), ry);
      CRATES.push({ x, z, k, ry });
    }
  Object.assign(WTPL, TPL);
  for (const k in TPL) {
    TPL[k].thinInstanceBufferUpdated('matrix');
    TPL[k].thinInstanceRefreshBoundingInfo(true);
  }
  /* paredes finas: painéis destrutíveis (thin instances) */
  panelInt = B.MeshBuilder.CreateBox('panelsInt', { size: 1, wrap: true }, game);
  panelInt.material = M.drywall;
  caster(panelInt);
  panelExt = B.MeshBuilder.CreateBox('panelsExt', { size: 1, wrap: true }, game);
  panelExt.material = M.brickPanel;
  caster(panelExt);
  let ni = 0,
    ne = 0;
  for (const w of WALLS) {
    w.mesh = w.ext ? panelExt : panelInt;
    w.base = w.ext ? ne : ni;
    for (let i = 0; i < NP; i++) w.mesh.thinInstanceAdd(B.Matrix.Identity(), false);
    if (w.ext) ne += NP;
    else ni += NP;
  }
  for (const w of WALLS) refreshWall(w, false);
  panelInt.thinInstanceBufferUpdated('matrix');
  panelExt.thinInstanceBufferUpdated('matrix');
  panelInt.thinInstanceRefreshBoundingInfo(true);
  panelExt.thinInstanceRefreshBoundingInfo(true);
  /* portas: barricada de tábuas com vão embaixo + batentes + verga */
  const dstat = [];
  for (const d of DOORS) {
    const bh = DOOR_H - BAR_GAP,
      bx =
        d.ori === 'x'
          ? { width: 0.1, height: bh, depth: CELL - 0.2 }
          : { width: CELL - 0.2, height: bh, depth: 0.1 };
    d.mesh = B.MeshBuilder.CreateBox('door', bx, game);
    d.mesh.position.set(cc(d.x), BAR_GAP + bh / 2, cc(d.z));
    d.mesh.material = M.planks;
    caster(d.mesh);
    const lx =
      d.ori === 'x'
        ? { width: 0.3, height: WALL_H - DOOR_H, depth: CELL }
        : { width: CELL, height: WALL_H - DOOR_H, depth: 0.3 };
    lx.wrap = true;
    const l = B.MeshBuilder.CreateBox('lintel', lx, game);
    l.position.set(cc(d.x), DOOR_H + (WALL_H - DOOR_H) / 2, cc(d.z));
    l.material =
      inside(d.x, d.z) && !(d.x === BX0 || d.x === BX1 || d.z === BZ0 || d.z === BZ1)
        ? M.drywall
        : M.brick;
    dstat.push(l);
    for (const s of [-1, 1]) {
      const jb = B.MeshBuilder.CreateBox(
        'jamb',
        d.ori === 'x'
          ? { width: 0.36, height: DOOR_H, depth: 0.1 }
          : { width: 0.1, height: DOOR_H, depth: 0.36 },
        game
      );
      if (d.ori === 'x') jb.position.set(cc(d.x), DOOR_H / 2, cc(d.z) + s * (CELL / 2 - 0.05));
      else jb.position.set(cc(d.x) + s * (CELL / 2 - 0.05), DOOR_H / 2, cc(d.z));
      jb.material = M.frame;
      dstat.push(jb);
    }
    const hd = B.MeshBuilder.CreateBox(
      'head',
      d.ori === 'x'
        ? { width: 0.36, height: 0.1, depth: CELL }
        : { width: CELL, height: 0.1, depth: 0.36 },
      game
    );
    hd.position.set(cc(d.x), DOOR_H - 0.05, cc(d.z));
    hd.material = M.frame;
    dstat.push(hd);
  }
  {
    const m = B.Mesh.MergeMeshes(dstat, true, true, undefined, false, true);
    m.name = 'doorFrames';
    caster(m);
  } /* batentes/vergas: 1 malha */
  /* marcação dos objetivos no chão */
  for (const k of SITE_KEYS) {
    const s = SITES[k];
    const c = mkCanvas(512),
      gg = c.getContext('2d');
    gg.strokeStyle = 'rgba(230,194,80,.6)';
    gg.lineWidth = 10;
    gg.setLineDash([30, 18]);
    gg.strokeRect(10, 10, 492, 492);
    gg.fillStyle = 'rgba(230,194,80,.45)';
    gg.font = 'bold 240px sans-serif';
    gg.textAlign = 'center';
    gg.textBaseline = 'middle';
    gg.fillText(k, 256, 230);
    gg.font = 'bold 48px sans-serif';
    gg.fillText(s.name.toUpperCase(), 256, 420);
    const t = dyn(game, c);
    t.hasAlpha = true;
    const mt = new B.StandardMaterial('site', game);
    mt.diffuseTexture = t;
    mt.useAlphaFromDiffuseTexture = true;
    mt.disableLighting = true;
    mt.emissiveColor = new B.Color3(0.9, 0.9, 0.9);
    mt.zOffset = -2;
    const p = B.MeshBuilder.CreateGround(
      'siteMark',
      { width: (s.x1 - s.x0 + 1) * CELL, height: (s.z1 - s.z0 + 1) * CELL },
      game
    );
    p.material = mt;
    const sc = siteCenter(s);
    p.position.set(sc.x, 0.05, sc.z);
  }
  buildDecor();
  for (const m of game.meshes)
    if (m.thinInstanceCount > 0) {
      m.thinInstanceBufferUpdated('matrix');
      m.thinInstanceRefreshBoundingInfo(true);
      m.freezeWorldMatrix();
    }
  for (const m of game.meshes)
    if (!m.thinInstanceCount && m.name !== 'door' && m.name !== 'sky') m.freezeWorldMatrix();
})();
/* matriz de cada painel (escala zero = quebrado) */
function panelMatrix(w, i) {
  const col = i % 4,
    row = (i / 4) | 0;
  if (w.p[i] <= 0) _s.set(0, 0, 0);
  else if (w.ori === 'x') _s.set(0.3, PH, 0.75);
  else _s.set(0.75, PH, 0.3);
  if (w.ori === 'x') _v.set(cc(w.x), (row + 0.5) * PH, w.z * CELL + col * 0.75 + 0.375);
  else _v.set(w.x * CELL + col * 0.75 + 0.375, (row + 0.5) * PH, cc(w.z));
  _q.set(0, 0, 0, 1);
  B.Matrix.ComposeToRef(_s, _q, _v, _m);
  w.mesh.thinInstanceSetMatrixAt(w.base + i, _m, false);
}
function refreshWall(w, upload = true) {
  for (let i = 0; i < NP; i++) panelMatrix(w, i);
  if (upload) w.mesh.thinInstanceBufferUpdated('matrix');
}
function setReinforcedMesh(w, on) {
  if (on && !w.rmesh) {
    w.rmesh = B.MeshBuilder.CreateBox(
      'reinf',
      w.ori === 'x'
        ? { width: 0.42, height: WALL_H, depth: CELL }
        : { width: CELL, height: WALL_H, depth: 0.42 },
      game
    );
    w.rmesh.position.set(cc(w.x), WALL_H / 2, cc(w.z));
    w.rmesh.material = M.metal;
    w.rmesh.receiveShadows = true;
    if (shadowGen) shadowGen.addShadowCaster(w.rmesh);
  }
  if (!on && w.rmesh) {
    w.rmesh.dispose();
    w.rmesh = null;
  }
}

/* ---------- efeitos (pools reutilizáveis) ---------- */
const FX = { tracers: [], decals: [], puffs: [], debris: [], booms: [], flashes: [] };
for (let i = 0; i < 0; i++) {
  const l = B.MeshBuilder.CreateLines(
    'tr',
    { points: [B.Vector3.Zero(), new B.Vector3(0, 0, -1)], updatable: true },
    game
  );
  l.color = C3('#ffe2a0');
  l.alpha = 0;
  l.isPickable = false;
  FX.tracers.push({ l, life: 0 });
}
const decMat = unlit(game, '#1d1814');
const decBase = B.MeshBuilder.CreateBox('dec', { size: 0.07 }, game);
decBase.material = decMat;
decBase.isVisible = false;
for (let i = 0; i < 90; i++) {
  const m = decBase.createInstance('d' + i);
  m.isVisible = false;
  FX.decals.push(m);
}
/* fumaça/sangue e destroços: UMA malha com instâncias finas cada (1 chamada de desenho para todos) */
const puffMesh = B.MeshBuilder.CreateSphere('puffs', { diameter: 0.24, segments: 6 }, game);
{
  const mt = new B.StandardMaterial('pm', game);
  mt.disableLighting = true;
  mt.diffuseColor = new B.Color3(1, 1, 1);
  mt.emissiveColor = new B.Color3(0, 0, 0);
  mt.alpha = 0.999;
  puffMesh.material = mt;
}
puffMesh.isPickable = false;
puffMesh.hasVertexAlpha = true;
const PUFFN = 36,
  puffCol = new Float32Array(PUFFN * 4),
  puffMat = new Float32Array(PUFFN * 16);
for (let i = 0; i < PUFFN; i++) {
  B.Matrix.ScalingToRef(0, 0, 0, _m);
  _m.copyToArray(puffMat, i * 16);
  FX.puffs.push({ pos: new V3(), col: C3('#ffffff'), life: 0, max: 0.35, size: 1 });
}
puffMesh.thinInstanceSetBuffer('matrix', puffMat, 16, false);
puffMesh.thinInstanceSetBuffer('color', puffCol, 4, false);
puffMesh.alwaysSelectAsActiveMesh = true;
const debMesh = B.MeshBuilder.CreateBox('debris', { width: 0.16, height: 0.16, depth: 0.05 }, game);
debMesh.material = pbr(game, { color: '#ffffff', rough: 0.9 });
debMesh.isPickable = false;
caster(debMesh);
const DEBN = 150,
  debMatB = new Float32Array(DEBN * 16),
  debCol = new Float32Array(DEBN * 4).fill(1);

for (let i = 0; i < DEBN; i++) {
  B.Matrix.ScalingToRef(0, 0, 0, _m);
  _m.copyToArray(debMatB, i * 16);
  FX.debris.push({ pos: new V3(), rot: new V3(), v: new V3(), spin: new V3(), life: 0 });
}
debMesh.thinInstanceSetBuffer('matrix', debMatB, 16, false);
debMesh.thinInstanceSetBuffer('color', debCol, 4, false);
debMesh.alwaysSelectAsActiveMesh = true;
const boomMat = unlit(game, '#ffb24a', 0);
for (let i = 0; i < 4; i++) {
  const m = B.MeshBuilder.CreateSphere('boom', { diameter: 2, segments: 12 }, game);
  m.material = boomMat.clone('bm');
  m.material.alpha = 0;
  m.isPickable = false;
  FX.booms.push({ m, life: 0, r: 1 });
}
const boomLight = new B.PointLight('boomL', B.Vector3.Zero(), game);
boomLight.diffuse = C3('#ffa040');
boomLight.intensity = 0;
boomLight.range = 18;
const flashLight = new B.PointLight('flashL', B.Vector3.Zero(), game);
flashLight.diffuse = C3('#ffd28a');
flashLight.intensity = 0;
flashLight.range = 9;
const flashMat = unlit(game, '#ffd27a', 0);
for (let i = 0; i < 10; i++) {
  const m = B.MeshBuilder.CreateSphere('fl', { diameter: 0.16, segments: 6 }, game);
  m.material = flashMat.clone('fm');
  m.material.alpha = 0;
  m.isPickable = false;
  FX.flashes.push({ m, life: 0 });
}
let fxi = { t: 0, d: 0, p: 0, e: 0, b: 0, f: 0 };
const bv = (v) => new B.Vector3(v.x, v.y, v.z);
function fxTracer(a, b) {
  const t = FX.tracers[fxi.t++ % FX.tracers.length];
  B.MeshBuilder.CreateLines('tr', { points: [bv(a), bv(b)], instance: t.l });
  t.life = 0.07;
}
function fxDecal(p) {
  const m = FX.decals[fxi.d++ % FX.decals.length];
  m.position.set(p.x, p.y, p.z);
  m.isVisible = true;
}
function fxPuff(p, hex, size, life) {
  const f = FX.puffs[fxi.p++ % FX.puffs.length];
  f.pos.set(p.x, p.y, p.z);
  f.col = C3(hex);
  f.life = f.max = life || 0.35;
  f.size = size || 1;
}
function fxDebris(p, n, hex, power) {
  const c = C3(hex).toLinearSpace();
  for (let i = 0; i < n; i++) {
    const k = fxi.e++ % FX.debris.length,
      d = FX.debris[k];
    d.pos.set(p.x, p.y, p.z);
    debCol[k * 4] = c.r;
    debCol[k * 4 + 1] = c.g;
    debCol[k * 4 + 2] = c.b;
    d.v.set(rand(-1, 1), rand(0.2, 1.4), rand(-1, 1)).multiplyScalar(power || 3);
    d.spin.set(rand(-8, 8), rand(-8, 8), rand(-8, 8));
    d.life = rand(1, 1.8);
  }
  debMesh.thinInstanceBufferUpdated('color');
}
function fxFlash(p) {
  const f = FX.flashes[fxi.f++ % FX.flashes.length];
  f.m.position.set(p.x, p.y, p.z);
  f.life = 0.05;
  flashLight.position.set(p.x, p.y, p.z);
  flashLight.intensity = 1.6;
}
function fxBoom(p, r) {
  const b = FX.booms[fxi.b++ % FX.booms.length];
  b.m.position.set(p.x, p.y, p.z);
  b.life = 0.45;
  b.r = r;
  boomLight.position.set(p.x, p.y + 0.5, p.z);
  boomLight.intensity = 6;
}
function clearFx() {
  for (const d of FX.decals) d.isVisible = false;
  for (const d of FX.debris) d.life = 0;
}
function updateFx(dt) {
  for (const t of FX.tracers)
    if (t.life > 0) {
      t.life -= dt;
      t.l.alpha = Math.max(0, (t.life / 0.07) * 0.8);
    }
  {
    let i = 0;
    for (const f of FX.puffs) {
      if (f.life > 0) {
        f.life -= dt;
        const sc = (1 + (f.max - f.life) * 4) * f.size;
        B.Matrix.ComposeToRef(
          _s.set(sc, sc, sc),
          _q.set(0, 0, 0, 1),
          _v.set(f.pos.x, f.pos.y, f.pos.z),
          _m
        );
        puffCol[i * 4] = f.col.r;
        puffCol[i * 4 + 1] = f.col.g;
        puffCol[i * 4 + 2] = f.col.b;
        puffCol[i * 4 + 3] = Math.max(0, (f.life / f.max) * 0.8);
      } else {
        B.Matrix.ScalingToRef(0, 0, 0, _m);
        puffCol[i * 4 + 3] = 0;
      }
      _m.copyToArray(puffMat, i * 16);
      i++;
    }
    puffMesh.thinInstanceBufferUpdated('matrix');
    puffMesh.thinInstanceBufferUpdated('color');
  }
  {
    let i = 0,
      any = false;
    for (const d of FX.debris) {
      if (d.life > 0) {
        any = true;
        d.life -= dt;
        d.v.y -= 14 * dt;
        const p = d.pos;
        p.x += d.v.x * dt;
        p.y += d.v.y * dt;
        p.z += d.v.z * dt;
        if (p.y < 0.03) {
          p.y = 0.03;
          d.v.y *= -0.3;
          d.v.x *= 0.6;
          d.v.z *= 0.6;
          d.spin.multiplyScalar(0.5);
        }
        d.rot.x += d.spin.x * dt;
        d.rot.y += d.spin.y * dt;
        B.Matrix.ComposeToRef(
          _s.set(1, 1, 1),
          B.Quaternion.RotationYawPitchRollToRef(d.rot.y, d.rot.x, 0, _q),
          _v.set(p.x, p.y, p.z),
          _m
        );
        _m.copyToArray(debMatB, i * 16);
        if (d.life <= 0) {
          B.Matrix.ScalingToRef(0, 0, 0, _m);
          _m.copyToArray(debMatB, i * 16);
        }
      }
      i++;
    }
    if (any || FX._debAny) debMesh.thinInstanceBufferUpdated('matrix');
    FX._debAny = any;
  }
  for (const b of FX.booms) {
    b.m.isVisible = b.life > 0;
    if (b.life <= 0) {
      b.m.material.alpha = 0;
      continue;
    }
    b.life -= dt;
    const k = 1 - b.life / 0.45;
    b.m.scaling.setAll(b.r * (0.3 + k * 0.9) * 0.7);
    b.m.material.alpha = Math.max(0, 0.85 * (1 - k));
  }
  for (const f of FX.flashes) {
    if (f.life > 0) f.life -= dt;
    f.m.material.alpha = f.life > 0 ? 1 : 0;
    f.m.isVisible = f.life > 0;
  }
  boomLight.intensity = Math.max(0, boomLight.intensity - dt * 14);
  flashLight.intensity = Math.max(0, flashLight.intensity - dt * 40);
}
/* cores de impacto por material */
const IMPACT = {
  glass: '#d6e2e2',
  hard: '#9a8f80',
  crate: '#8a6a45',
  drywall: '#e2dccf',
  brick: '#a66a55',
  metal: '#ffe6a0',
  wood: '#8a6a45',
  floor: '#7a7468',
  ceil: '#d8d7d1',
  none: '#999999',
};

/* vidro quebra com tiro (impacto 'glass') e explosão (simulação → HOOK.winBroken); volta no reinício das estruturas.
   Os ganchos do jogo (30-main) já existem no primeiro quadro: embrulha sem trocar o comportamento original. */
game.onBeforeRenderObservable.addOnce(() => {
  const rs = HOOK.structuresReset;
  HOOK.winBroken = (w) => {
    winBreak(w);
    if (typeof radarDirty !== 'undefined') radarDirty = true;
  }; /* quebra decidida na simulação (tiro em 'glass' ou explosão); o 30-main não põe marca de bala em 'glass' */
  HOOK.structuresReset = (...a) => {
    for (const w of WINS) setWinPane(w, true);
    return rs(...a);
  };
});
