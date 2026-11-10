/* =====================================================================
   HUD (Babylon GUI) — placar, relógio, radar, vida, munição, equipamento,
   mira, marcadores, mensagens, placar (Tab), pausa e fim de partida
   ===================================================================== */
const RS = 5;
function drawRadar(g) {
  g.fillStyle = '#1a2226';
  g.fillRect(0, 0, W * RS, H * RS);
  for (let z = 0; z < H; z++)
    for (let x = 0; x < W; x++) {
      const v = grid[z][x];
      let c = null;
      if (v === 0) c = inside(x, z) ? '#2c3634' : null;
      else if (v === 1) c = '#5c6664';
      else if (v === 2) c = '#6d5236';
      else if (v === 3) {
        const w = wallAt(x, z);
        c = w.reinforced
          ? '#c9d2d8'
          : wallPassable(w)
            ? '#34403d'
            : w.p.every((p) => p > 0)
              ? '#8f9a95'
              : '#6e7873';
      } else if (v === 4) c = doorAt(x, z).hp > 0 ? '#8a6a45' : '#2c3634';
      if (c) {
        g.fillStyle = c;
        g.fillRect(x * RS, z * RS, RS, RS);
      }
    }
  /* janelas: traço azul-claro no meio da parede (inteira) ou vão escuro tracejado (quebrada) */
  if (typeof WINS !== 'undefined')
    for (const w of WINS) {
      const X = w.x * RS,
        Z = w.z * RS,
        L = RS * 0.15;
      if (w.broken) {
        g.fillStyle = '#2c3634';
        if (w.nx) g.fillRect(X + 1, Z + L, RS - 2, RS - 2 * L);
        else g.fillRect(X + L, Z + 1, RS - 2 * L, RS - 2);
        g.fillStyle = 'rgba(150,205,220,.45)';
        if (w.nx) {
          g.fillRect(X + RS / 2 - 0.5, Z + L, 1, 1.2);
          g.fillRect(X + RS / 2 - 0.5, Z + RS - L - 1.2, 1, 1.2);
        } else {
          g.fillRect(X + L, Z + RS / 2 - 0.5, 1.2, 1);
          g.fillRect(X + RS - L - 1.2, Z + RS / 2 - 0.5, 1.2, 1);
        }
      } else {
        g.fillStyle = '#9fd3e2';
        if (w.nx) g.fillRect(X + RS / 2 - 1, Z + L, 2, RS - 2 * L);
        else g.fillRect(X + L, Z + RS / 2 - 1, RS - 2 * L, 2);
      }
    }
  /* objetivos: a defesa sabe onde está; o ataque vê os quatro possíveis (apagados, com "?") até o drone achar o verdadeiro */
  const known = G.phase === 'menu' || player.side === 'def' || G.siteKnown;
  for (const k of SITE_KEYS) {
    const S = SITES[k],
      real = k === G.siteKey,
      show = known ? real : true,
      lit = known && real;
    if (!show) continue;
    g.strokeStyle = lit ? 'rgba(230,194,80,.95)' : 'rgba(230,194,80,.35)';
    g.lineWidth = lit ? 2 : 1;
    g.setLineDash(lit ? [] : [3, 3]);
    g.strokeRect(
      S.x0 * RS + 0.5,
      S.z0 * RS + 0.5,
      (S.x1 - S.x0 + 1) * RS - 1,
      (S.z1 - S.z0 + 1) * RS - 1
    );
    g.setLineDash([]);
    g.fillStyle = lit ? 'rgba(230,194,80,1)' : 'rgba(230,194,80,.45)';
    g.font = `bold ${RS * 2}px sans-serif`;
    g.fillText(lit ? k : k + '?', S.x0 * RS + 2, S.z0 * RS + RS * 2);
  }
}
function radarUrl() {
  return canvasUrl(W * RS, H * RS, drawRadar);
}
const HUD = {};
let radarDirty = true,
  radarT = 0;
/* ícone (silhueta) da arma por família, desenhado em canvas */
const WICON = {};
function wIcon(cls) {
  if (WICON[cls]) return WICON[cls];
  const S = {
    pistol: [
      [4, 8, 30, 7],
      [22, 15, 7, 12],
    ],
    rev: [
      [2, 8, 30, 6],
      [18, 7, 9, 9],
      [24, 15, 7, 12],
    ],
    mp: [
      [4, 8, 32, 7],
      [22, 15, 7, 16],
      [10, 15, 5, 6],
    ],
    smg: [
      [4, 8, 54, 9],
      [30, 17, 6, 10],
      [44, 17, 7, 10],
      [58, 9, 22, 4],
      [76, 9, 4, 12],
    ],
    ar: [
      [2, 9, 30, 3],
      [30, 7, 52, 9],
      [44, 16, 7, 13],
      [60, 16, 7, 11],
      [82, 8, 24, 10],
      [52, 3, 10, 4],
    ],
    lmg: [
      [2, 9, 30, 4],
      [30, 5, 56, 12],
      [40, 17, 20, 11],
      [62, 17, 7, 11],
      [86, 7, 22, 11],
      [50, 1, 18, 4],
    ],
    dmr: [
      [0, 9, 36, 3],
      [36, 7, 48, 9],
      [50, 16, 6, 8],
      [64, 16, 7, 11],
      [84, 7, 24, 11],
      [50, 1, 16, 6],
    ],
    sg: [
      [0, 8, 44, 4],
      [0, 12, 40, 3],
      [14, 11, 16, 6],
      [44, 7, 30, 10],
      [64, 17, 7, 10],
      [74, 8, 32, 11],
    ],
    sgs: [
      [0, 8, 44, 4],
      [0, 12, 40, 3],
      [44, 7, 30, 10],
      [64, 17, 7, 10],
      [74, 8, 32, 11],
    ],
  }[cls] || [[2, 8, 100, 8]];
  WICON[cls] = canvasUrl(110, 30, (g) => {
    g.fillStyle = 'rgba(155,161,167,.9)';
    for (const r of S) g.fillRect(r[0], r[1], r[2], r[3]);
  });
  return WICON[cls];
}
/* cores por LADO (guia v2.0): ataque = laranja, defesa = azul — vale para os dois times, troca junto com o lado */
function teamCol(t) {
  const a = agents.find((x) => x.team === t);
  return a && a.side === 'def' ? PAL.def : PAL.atk;
}
function teamBg(t) {
  const a = agents.find((x) => x.team === t);
  return a && a.side === 'def' ? 'rgba(47,143,224,.25)' : 'rgba(232,129,47,.25)';
}
(function buildHUD() {
  const u = uiGame;
  const root = new GUI.Container('hud');
  root.width = '100%';
  root.height = '100%';
  root.isHitTestVisible = false;
  u.addControl(root);
  HUD.root = root;
  /* topo: placar + relógio + ícones dos operadores */
  const top = stack(false, { h: 58, spacing: 2 });
  top.horizontalAlignment = HC;
  top.verticalAlignment = VT;
  top.top = '10px';
  root.addControl(top);
  const side = (team) => {
    const r = rect({ w: 230, h: 58, bg: 'transparent' });
    const s = stack(false, { h: 58, spacing: 6 });
    s.horizontalAlignment = HC;
    const tag = chamfer({ w: 46, h: 36, bg: teamCol(team), flip: team === 'B' });
    const sc = text('0', {
      size: 26,
      weight: '700',
      color: '#0a0b0d',
      width: '46px',
      align: 'center',
    });
    tag.addControl(sc);
    const icons = stack(false, { h: 58, spacing: 3 });
    if (team === 'A') {
      s.addControl(icons);
      s.addControl(tag);
    } else {
      s.addControl(tag);
      s.addControl(icons);
    }
    r.addControl(s);
    return { r, sc, icons, tag };
  };
  HUD.A = side('A');
  HUD.B = side('B');
  const clock = rect({ w: 110, h: 58, bg: 'transparent' });
  const cs = stack(true, { w: '100%' });
  cs.verticalAlignment = VC;
  HUD.time = text('0:00', { size: 26, weight: '600', mono: true, align: 'center', width: '100%' });
  HUD.phase = text('', {
    size: 10,
    color: PAL.muted,
    spacing: '2px',
    align: 'center',
    width: '100%',
    h: 14,
  });
  cs.addControl(HUD.time);
  cs.addControl(HUD.phase);
  clock.addControl(cs);
  top.addControl(HUD.A.r);
  top.addControl(clock);
  top.addControl(HUD.B.r);
  HUD.sideTag = rect({ w: 90, h: 18, bg: PAL.atk, va: VT });
  HUD.sideTag.top = '70px';
  HUD.sideTagT = text('ATAQUE', {
    size: 10,
    weight: '700',
    color: '#1b0f06',
    spacing: '2px',
    align: 'center',
    width: '100%',
  });
  HUD.sideTag.addControl(HUD.sideTagT);
  root.addControl(HUD.sideTag);
  /* radar */
  const rad = rect({ w: W * RS + 12, h: H * RS + 12, bg: PAL.panel, border: 1, ha: HA, va: VT });
  rad.left = '12px';
  rad.top = '10px';
  root.addControl(rad);
  HUD.radImg = new GUI.Image('radar', radarUrl());
  HUD.radImg.width = W * RS + 'px';
  HUD.radImg.height = H * RS + 'px';
  rad.addControl(HUD.radImg);
  HUD.dots = [];
  for (let i = 0; i < 12; i++) {
    const d = new GUI.Ellipse();
    d.width = d.height = '6px';
    d.thickness = 0;
    d.horizontalAlignment = HA;
    d.verticalAlignment = VT;
    d.isVisible = false;
    rad.addControl(d);
    HUD.dots.push(d);
  }
  HUD.radDir = new GUI.Line();
  HUD.radDir.color = PAL.text;
  HUD.radDir.lineWidth = 1.5;
  rad.addControl(HUD.radDir);
  HUD.radBox = rad;
  /* feed de abates */
  HUD.feed = stack(true, { w: '420px' });
  HUD.feed.horizontalAlignment = HR;
  HUD.feed.verticalAlignment = VT;
  HUD.feed.top = '10px';
  HUD.feed.left = '-12px';
  root.addControl(HUD.feed);
  /* vida */
  const vit = (HUD.vit = rect({ w: 240, h: 92, bg: 'transparent', ha: HA, va: VB }));
  vit.left = '18px';
  vit.top = '-6px';
  root.addControl(vit);
  const vs = stack(true, { w: '100%' });
  vs.paddingLeft = '14px';
  vs.paddingRight = '14px';
  vs.verticalAlignment = VC;
  vit.addControl(vs);
  const hr = stack(false, { h: 38, spacing: 8 });
  HUD.hp = text('100', { size: 34, weight: '700', mono: true });
  hr.addControl(HUD.hp);
  hr.addControl(text('VIDA', { size: 11, color: PAL.muted, spacing: '2px' }));
  vs.addControl(hr);
  const hb = rect({ w: '100%', h: 5, bg: 'rgba(255,255,255,.1)' });
  HUD.hpBar = rect({ w: '100%', h: 5, bg: PAL.text, ha: HA });
  hb.addControl(HUD.hpBar);
  vs.addControl(hb);
  vs.addControl(gap(4));
  HUD.opname = text('', { size: 13, h: 18 });
  vs.addControl(HUD.opname);
  HUD.armor = text('', { size: 11, color: PAL.muted, h: 16 });
  vs.addControl(HUD.armor);
  /* arma */
  const wp = rect({ w: 240, h: 112, bg: 'transparent', ha: HR, va: VB });
  wp.left = '-18px';
  wp.top = '-6px';
  /* sem caixa opaca (estilo Siege): texto direto sobre a cena, com sombra */ root.addControl(wp);
  HUD.wp = wp;
  HUD._shadowed = [wp, vit];
  const ws = stack(true, { w: '100%' });
  ws.paddingRight = '14px';
  ws.paddingLeft = '14px';
  ws.verticalAlignment = VC;
  wp.addControl(ws);
  HUD.rl = text('', {
    size: 12,
    color: PAL.warn,
    align: 'right',
    width: '100%',
    h: 16,
    spacing: '2px',
  });
  ws.addControl(HUD.rl);
  {
    const wr = new GUI.Grid();
    wr.height = '30px';
    wr.width = '100%';
    wr.addColumnDefinition(90, true);
    wr.addColumnDefinition(1);
    HUD.wicon = new GUI.Image('wi', wSil('rifle', false));
    HUD.wicon.width = '86px';
    HUD.wicon.height = '28px';
    HUD.wicon.stretch = GUI.Image.STRETCH_UNIFORM;
    wr.addControl(HUD.wicon, 0, 0);
    HUD.wname = text('', {
      size: 12,
      color: PAL.muted,
      align: 'right',
      width: '100%',
      h: 16,
      spacing: '2px',
    });
    wr.addControl(HUD.wname, 0, 1);
    ws.addControl(wr);
  }
  HUD.ammo = text('30 / 150', {
    size: 30,
    weight: '700',
    mono: true,
    align: 'right',
    width: '100%',
    h: 40,
  });
  ws.addControl(HUD.ammo);
  HUD.alt = text('', {
    size: 11,
    color: PAL.muted,
    mono: true,
    align: 'right',
    width: '100%',
    h: 16,
  });
  ws.addControl(HUD.alt); /* a outra arma (como no Siege: 1 principal · 2 secundária) */
  const gr = new GUI.Grid();
  gr.height = '22px';
  gr.width = '100%';
  gr.addColumnDefinition(1);
  gr.addColumnDefinition(60, true);
  HUD.gname = text('', { size: 12, color: PAL.muted });
  HUD.gcount = text('', { size: 12, color: PAL.warn, mono: true, align: 'right', width: '60px' });
  gr.addControl(HUD.gname, 0, 0);
  gr.addControl(HUD.gcount, 0, 1);
  ws.addControl(gr);
  for (const P of HUD._shadowed)
    for (const c of P.getDescendants(false))
      if (c instanceof GUI.TextBlock) {
        c.shadowColor = 'rgba(0,0,0,.85)';
        c.shadowBlur = 6;
        c.shadowOffsetX = 0;
        c.shadowOffsetY = 1;
      }
  /* mira, acerto, dano */
  HUD.xh = makeCrosshair(root);
  HUD.hit = new GUI.Container('hit');
  HUD.hit.width = HUD.hit.height = '40px';
  HUD.hit.alpha = 0;
  root.addControl(HUD.hit);
  HUD.hitBars = [];
  for (let i = 0; i < 4; i++) {
    const b = rect({ w: 2, h: 9, bg: '#fff' });
    b.rotation = Math.PI / 4 + (i * Math.PI) / 2;
    b.left = Math.cos(Math.PI / 4 + (i * Math.PI) / 2 - Math.PI / 2) * 11 + 'px';
    b.top = Math.sin(Math.PI / 4 + (i * Math.PI) / 2 - Math.PI / 2) * 11 + 'px';
    HUD.hit.addControl(b);
    HUD.hitBars.push(b);
  }
  HUD.hurt = new GUI.Image('hurt', IMG.vignette);
  HUD.hurt.stretch = GUI.Image.STRETCH_FILL;
  HUD.hurt.alpha = 0;
  HUD.hurt.isHitTestVisible = false;
  root.addControl(HUD.hurt);
  HUD.flash = rect({ w: '100%', h: '100%', bg: '#ffffff' });
  HUD.flash.alpha = 0;
  HUD.flash.isHitTestVisible = false;
  root.addControl(HUD.flash);
  HUD.dir = new GUI.Container('dir');
  HUD.dir.width = '320px';
  HUD.dir.height = '320px';
  HUD.dir.alpha = 0;
  const ac = document.createElement('canvas');
  ac.width = 256;
  ac.height = 64;
  {
    const g = ac.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 256, 0);
    gr.addColorStop(0, 'rgba(255,59,48,0)');
    gr.addColorStop(0.5, 'rgba(255,59,48,.95)');
    gr.addColorStop(1, 'rgba(255,59,48,0)');
    g.strokeStyle = gr;
    g.lineWidth = 14;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(128, 300, 270, -Math.PI / 2 - 0.42, -Math.PI / 2 + 0.42);
    g.stroke();
  }
  const arc = new GUI.Image('hurtArc', ac.toDataURL());
  arc.width = '170px';
  arc.height = '42px';
  arc.verticalAlignment = VT;
  arc.isHitTestVisible = false;
  HUD.dir.addControl(arc);
  /* arco vermelho em volta da mira, apontando para quem atirou */ root.addControl(HUD.dir);
  HUD.scope = new GUI.Image('scope', IMG.scope);
  HUD.scope.stretch = GUI.Image.STRETCH_UNIFORM;
  HUD.scope.isVisible = false;
  root.addControl(HUD.scope);
  HUD.scopeL = rect({ w: '100%', h: '50%', bg: '#000', va: VT });
  HUD.scopeR = rect({ w: '100%', h: '50%', bg: '#000', va: VB });
  /* drone */
  HUD.drone = new GUI.Container('drone');
  HUD.drone.width = '100%';
  HUD.drone.height = '100%';
  HUD.drone.isVisible = false;
  root.addControl(HUD.drone);
  const scan = new GUI.Image('scan', IMG.scan);
  scan.stretch = GUI.Image.STRETCH_NONE;
  scan.alpha = 0.6;
  HUD.drone.addControl(
    rect({ w: '100%', h: '100%', border: 2, borderColor: 'rgba(230,194,80,.5)' })
  );
  const ring = new GUI.Ellipse();
  ring.width = ring.height = '28px';
  ring.thickness = 2;
  ring.color = 'rgba(230,194,80,.85)';
  HUD.drone.addControl(ring);
  const dt = rect({ w: 520, h: 30, bg: PAL.panel, va: VB });
  dt.top = '-130px';
  dt.addControl(
    text('DRONE · CLIQUE MARCA INIMIGOS · ESPAÇO PULA · ACHE O OBJETIVO', {
      size: 12,
      color: PAL.warn,
      spacing: '1.5px',
      align: 'center',
      width: '100%',
    })
  );
  HUD.drone.addControl(dt);
  HUD.lost = rect({ w: '100%', h: '100%', bg: 'rgba(8,10,12,.82)' });
  HUD.lost.isVisible = false;
  HUD.drone.addControl(HUD.lost);
  HUD.lostT = disp('', {
    size: 40,
    color: PAL.danger,
    spacing: '9px',
    align: 'center',
    width: '100%',
  });
  HUD.lostT.height = '130px';
  HUD.lostT.textWrapping = true;
  HUD.lost.addControl(HUD.lostT);
  /* mensagens */
  HUD.banner = rect({
    w: 600,
    h: 92,
    bg: 'rgba(10,11,13,.9)',
    va: VT,
    border: 1,
    borderColor: '#454b52',
  });
  HUD.banner.top = '13%';
  HUD.banner.alpha = 0;
  const bs = stack(true, { w: '100%' });
  bs.verticalAlignment = VC;
  HUD.bt = disp('', { size: 34, align: 'center', width: '100%', h: 48, spacing: '9px' });
  HUD.bs = text('', { size: 12, align: 'center', width: '100%', h: 20, spacing: '2px' });
  bs.addControl(HUD.bt);
  bs.addControl(HUD.bs);
  HUD.banner.addControl(bs);
  root.addControl(HUD.banner);
  HUD.note = rect({ w: 460, h: 34, bg: PAL.panel, va: VT });
  HUD.note.top = '33%';
  HUD.note.alpha = 0;
  HUD.noteT = text('', { size: 15, align: 'center', width: '100%', spacing: '1px' });
  HUD.note.addControl(HUD.noteT);
  root.addControl(HUD.note);
  HUD.prompt = rect({ w: 380, h: 44, bg: PAL.panel, va: VT });
  HUD.prompt.top = '62%';
  HUD.prompt.isVisible = false;
  const ps = stack(true, { w: '100%' });
  ps.verticalAlignment = VC;
  HUD.ptext = text('', { size: 13, align: 'center', width: '100%', h: 20 });
  ps.addControl(HUD.ptext);
  const pb = rect({ w: '90%', h: 4, bg: 'rgba(255,255,255,.12)' });
  HUD.pbar = rect({ w: '0%', h: 4, bg: PAL.warn, ha: HA });
  pb.addControl(HUD.pbar);
  ps.addControl(gap(4));
  ps.addControl(pb);
  HUD.prompt.addControl(ps);
  root.addControl(HUD.prompt);
  HUD.spec = rect({ w: 560, h: 32, bg: PAL.panel, va: VB });
  HUD.spec.top = '-130px';
  HUD.spec.isVisible = false;
  HUD.specT = text('', { size: 13, align: 'center', width: '100%' });
  HUD.spec.addControl(HUD.specT);
  root.addControl(HUD.spec);
  HUD.fps = text('', { size: 11, mono: true, color: PAL.muted });
  HUD.fps.horizontalAlignment = HR;
  HUD.fps.verticalAlignment = VT;
  HUD.fps.top = '170px';
  HUD.fps.left = '-14px';
  root.addControl(HUD.fps);
  /* marcador do objetivo (preso a um ponto 3D) */
  HUD.objNode = new B.TransformNode('obj', game);
  HUD.obj = new GUI.Container('objm');
  HUD.obj.width = '220px';
  HUD.obj.height = '60px';
  u.addControl(HUD.obj);
  HUD.objDia = rect({
    w: 20,
    h: 20,
    border: 2,
    borderColor: PAL.warn,
    bg: 'rgba(230,194,80,.2)',
    va: VT,
  });
  HUD.objDia.rotation = Math.PI / 4;
  HUD.obj.addControl(HUD.objDia);
  HUD.objT = text('', { size: 11, align: 'center', width: '100%', outline: 3, spacing: '1px' });
  HUD.objT.verticalAlignment = VB;
  HUD.obj.addControl(HUD.objT);
  HUD.obj.linkWithMesh(HUD.objNode);
  HUD.obj.isVisible = false;
  /* placar (Tab) */
  HUD.board = rect({ w: 760, h: 460, bg: 'rgba(15,17,19,.95)', border: 1, borderColor: '#2a2e33' });
  HUD.board.isVisible = false;
  u.addControl(HUD.board);
  HUD.boardS = stack(true, { w: '100%' });
  HUD.boardS.paddingLeft = HUD.boardS.paddingRight = '22px';
  HUD.boardS.paddingTop = '18px';
  HUD.boardS.verticalAlignment = VT;
  HUD.board.addControl(HUD.boardS);
  /* pausa */
  HUD.pause = rect({ w: '100%', h: '100%', bg: 'rgba(8,11,13,.62)', block: true });
  HUD.pause.isVisible = false;
  u.addControl(HUD.pause);
  const pc = rect({
    w: 460,
    h: 340,
    bg: '#0f1113',
    border: 1,
    borderColor: '#2a2e33',
    block: true,
  });
  HUD.pause.addControl(pc);
  HUD.pc = pc;
  const pst = stack(true, { w: '100%' });
  pst.paddingLeft = pst.paddingRight = '26px';
  pst.verticalAlignment = VC;
  pc.addControl(pst);
  pst.addControl(eyebrow('Pausado'));
  HUD.pauseT = text('Partida pausada', { size: 26, weight: '700', h: 40 });
  pst.addControl(HUD.pauseT);
  pst.addControl(
    sliderRow(
      'Sensibilidade',
      0.3,
      3,
      0.05,
      SAVE.sens,
      (v) => v.toFixed(2),
      (v) => {
        SAVE.sens = v;
        persist();
      }
    )
  );
  pst.addControl(gap(8));
  pst.addControl(text('Qualidade gráfica', { size: 15, color: PAL.muted, h: 24 }));
  const qh = stack(false, { h: 44 });
  const qbuild = () => {
    for (const c of qh.children.slice()) qh.removeControl(c);
    qh.addControl(
      chipRow(
        [
          ['min', 'Mínima'],
          ['low', 'Baixa'],
          ['medium', 'Média'],
          ['high', 'Alta'],
        ],
        SAVE.quality,
        (v) => {
          SAVE.quality = v;
          applyQuality();
          qbuild();
        }
      )
    );
  };
  qbuild();
  HUD.pauseQ = qbuild;
  pst.addControl(qh);
  pst.addControl(gap(14));
  const pbtn = stack(false, { h: 56, spacing: 10 });
  pbtn.addControl(bigButton('CONTINUAR', null, () => lock(), { w: 190, h: 52, fs: 17 }));
  pbtn.addControl(
    bigButton('SAIR PARA O MENU', null, () => toMenu(), {
      w: 200,
      h: 52,
      fs: 15,
      bg: 'rgba(255,255,255,.06)',
      fg: PAL.text,
    })
  );
  pst.addControl(pbtn);
  /* fim de partida */
  HUD.over = rect({ w: '100%', h: '100%', bg: 'rgba(8,11,13,.7)', block: true });
  HUD.over.isVisible = false;
  u.addControl(HUD.over);
  const oc = rect({
    w: 780,
    h: 670,
    bg: '#0f1113',
    border: 1,
    borderColor: '#2a2e33',
    block: true,
  });
  HUD.over.addControl(oc);
  HUD.oc = oc;
  HUD.overS = stack(true, { w: '100%' });
  HUD.overS.paddingLeft = HUD.overS.paddingRight = '26px';
  HUD.overS.paddingTop = '22px';
  HUD.overS.verticalAlignment = VT;
  oc.addControl(HUD.overS);
})();

/* ---------- mensagens ---------- */
let bannerT = 0,
  noteT = 0;
function showBanner(t, s, cls, dur) {
  /* estilos do guia v2.0: rodada = linhas claras · troca de lado = amarelo · fim de partida = faixa clara */
  const B_ = HUD.banner;
  let bg = 'rgba(10,11,13,.9)',
    bc = '#9ba1a7',
    tc = PAL.text,
    sc = PAL.muted;
  if (cls === 'win') {
    bc = teamCol(player.team);
  } else if (cls === 'loss') {
    bc = '#454b52';
  } else if (cls === 'swap') {
    bc = PAL.warn;
    tc = PAL.warn;
  } else if (cls === 'final') {
    bg = '#d6d9dc';
    bc = '#d6d9dc';
    tc = '#0a0b0d';
    sc = '#454b52';
  }
  B_.background = bg;
  B_.color = bc;
  HUD.bt.color = tc;
  HUD.bs.color = sc;
  HUD.bt.text = String(t).toUpperCase();
  HUD.bs.text = (s || '').toUpperCase();
  bannerT = dur || 4;
}
function showNote(t, d) {
  HUD.noteT.text = t;
  noteT = d || 1.5;
}
function feedLine(att, v, wname, head) {
  const r = rect({
    h: 28,
    bg: PAL.panel,
    border: (att && att.isPlayer) || v.isPlayer ? 1 : 0,
    borderColor: PAL.danger,
    ha: HR,
  });
  r.adaptWidthToChildren = true;
  const s = stack(false, { h: 28, spacing: 8 });
  s.paddingLeft = s.paddingRight = '10px';
  const col = (a) => teamCol(a.team);
  if (att) s.addControl(text(att.name, { size: 13, color: col(att) }));
  s.addControl(text(wname || '', { size: 11, mono: true, color: PAL.muted }));
  if (head) s.addControl(text('⌖', { size: 14, color: PAL.warn }));
  s.addControl(text(v.name, { size: 13, color: col(v) }));
  r.addControl(s);
  HUD.feed.addControl(r);
  HUD.feed.addControl(gap(4));
  r._t = 7;
  while (HUD.feed.children.length > 10) HUD.feed.removeControl(HUD.feed.children[0]);
}
let hitT = 0,
  hurtT = 0;
function hitmark(head) {
  hitT = 0.18;
  for (const b of HUD.hitBars) b.background = head ? PAL.danger : '#fff';
}
function hurtFrom(att) {
  hurtT = 0.55;
  if (att) {
    const dx = att.pos.x - player.pos.x,
      dz = att.pos.z - player.pos.z;
    const ang = angDiff(Math.atan2(-dx, -dz), player.yaw);
    HUD.dir.rotation = -ang;
  }
}
function fmt(t) {
  t = Math.max(0, Math.ceil(t));
  return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
}
function initials(n) {
  return n
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
function onRoundStartUI() {
  if (typeof markMat !== 'undefined') markMat.emissiveColor = C3(teamCol(player.team));
  HUD.A.tag.background = teamCol('A');
  HUD.B.tag.background = teamCol('B');
  for (const t of ['A', 'B']) {
    const box = HUD[t].icons;
    box.clearControls();
    agents
      .filter((a) => a.team === t)
      .forEach((a) => {
        const i = rect({ w: 24, h: 24, border: 1, borderColor: teamCol(t), bg: teamBg(t) });
        const tt = text(initials(a.op.name), {
          size: 10,
          mono: true,
          align: 'center',
          width: '100%',
        });
        i.addControl(tt);
        i._tt = tt;
        box.addControl(i);
        a.icon = i;
      });
  }
  const atk = player.side === 'atk';
  HUD.sideTag.background = atk ? PAL.atk : PAL.def;
  HUD.sideTagT.text = atk ? 'ATAQUE' : 'DEFESA';
  radarDirty = true;
  for (const c of HUD.feed.children.slice()) HUD.feed.removeControl(c);
}
function boardRows(final) {
  const S = HUD.boardS;
  S.clearControls();
  const tb = (t, label) => {
    const hb = rect({ w: '100%', h: 24, bg: teamCol(t) });
    hb.addControl(
      text(`${label} · ${teams[t].score}`, {
        size: 13,
        weight: '700',
        color: '#0a0b0d',
        spacing: '3px',
        upper: true,
        h: 22,
        width: '100%',
      })
    );
    hb.children[0].paddingLeft = '8px';
    S.addControl(hb);
    const g = new GUI.Grid();
    g.width = '100%';
    const list = agents.filter((a) => a.team === t).sort((x, y) => y.kills - x.kills);
    g.height = list.length * 30 + 26 + 'px';
    [0.34, 0.26, 0.13, 0.13, 0.14].forEach((w) => g.addColumnDefinition(w));
    g.addRowDefinition(26, true);
    list.forEach(() => g.addRowDefinition(30, true));
    ['Nome', 'Operador', 'Abates', 'Mortes', 'Cabeça'].forEach((h, i) =>
      g.addControl(
        text(h.toUpperCase(), {
          size: 10,
          color: PAL.muted,
          spacing: '1.5px',
          align: i > 1 ? 'right' : 'left',
          width: '100%',
        }),
        0,
        i
      )
    );
    list.forEach((a, r) => {
      const bg = rect({
        w: '100%',
        h: '100%',
        bg: a.isPlayer ? 'rgba(241,242,243,.08)' : 'transparent',
      });
      g.addControl(bg, r + 1, 0);
      const al = a.alive || final ? 1 : 0.45;
      [a.name, a.op ? a.op.name : '', String(a.kills), String(a.deaths), String(a.hs)].forEach(
        (v, i) => {
          const t2 = text(v, {
            size: 14,
            mono: i > 1,
            align: i > 1 ? 'right' : 'left',
            width: '100%',
            color: i === 0 ? teamCol(t) : PAL.text,
          });
          t2.alpha = al;
          g.addControl(t2, r + 1, i);
        }
      );
    });
    S.addControl(g);
    S.addControl(gap(14));
  };
  tb(player.team, `Seu time · ${roleOf(player.team) === 'atk' ? 'ataque' : 'defesa'}`);
  tb(
    player.team === 'A' ? 'B' : 'A',
    `Inimigos · ${roleOf(player.team === 'A' ? 'B' : 'A') === 'atk' ? 'ataque' : 'defesa'}`
  );
}

/* ---------- atualização por quadro ---------- */
let fpsAcc = 0,
  fpsN = 0;
const _pv = new B.Vector3();
function updateHUD(dt) {
  const p = player,
    pilot = camMode === 'drone';
  HUD.A.sc.text = String(teams[player.team].score);
  HUD.B.sc.text = String(teams[player.team === 'A' ? 'B' : 'A'].score);
  HUD.time.text = fmt(G.phaseT);
  HUD.phase.text = (
    G.phase === 'prep'
      ? 'Preparação'
      : G.phase === 'action'
        ? G.planted
          ? 'Desativador'
          : 'Ação'
        : G.phase === 'end'
          ? 'Fim da rodada'
          : ''
  ).toUpperCase();
  HUD.time.color = G.phase === 'action' && (G.planted || G.phaseT < 20) ? PAL.danger : PAL.text;
  for (const a of agents)
    if (a.icon) {
      a.icon.alpha = a.alive ? 1 : 0.3;
      a.icon.background = a.isPlayer && a.alive ? teamCol(a.team) : teamBg(a.team);
    }
  HUD.hp.text = String(Math.max(0, p.hp));
  HUD.hpBar.width = clamp(p.hp, 0, 100) + '%';
  const low = p.hp <= 30;
  HUD.hp.color = low ? PAL.danger : PAL.text;
  HUD.hpBar.background = low ? PAL.danger : PAL.text;
  HUD.opname.text = `${p.op.name} · ${p.op.role}`;
  HUD.armor.text = `Blindagem ${ARMOR[p.op.armor].name}`;
  HUD.wp.isVisible = !droneCam() && p.alive;
  HUD.vit.isVisible =
    p.alive; /* morto/assistindo: some o painel de vida e arma */ /* no drone o painel da arma some */
  const ws = curW(p),
    d = WEAPONS[ws.id],
    oth = p.cur === 'p' ? p.w.s : p.w.p;
  HUD.wname.text =
    (p.cur === 'p' ? '1 · ' : '2 · ') + d.name.toUpperCase() + (d.sup ? ' · SUP' : '');
  if (HUD.wcls !== ws.id) {
    HUD.wcls = ws.id;
    HUD.wicon.source = wSil(ws.id, false);
  }
  HUD.alt.text = oth
    ? `${p.cur === 'p' ? 2 : 1} · ${WEAPONS[oth.id].name}  ${oth.mag}/${oth.res}`
    : '';
  HUD.ammo.text = `${ws.mag} / ${ws.res}`;
  HUD.ammo.color = ws.mag <= d.mag * 0.25 ? PAL.danger : PAL.text;
  HUD.rl.text = p.reloadT > 0 ? 'RECARREGANDO' : '';
  HUD.gname.text = 'G · ' + GADGETS[p.op.gadget].name;
  HUD.gcount.text = p.op.gadget === 'breach' && p.charges.length ? 'G detona' : '×' + p.gadgetN;
  /* interação */
  const op = p.alive && !pilot ? interactOption(p) : null;
  if (p.act) {
    HUD.prompt.isVisible = true;
    HUD.ptext.text =
      {
        plant: 'Plantando o desativador…',
        defuse: 'Desativando…',
        reinforce: 'Reforçando a parede…',
      }[p.act.kind] || '…';
    HUD.pbar.width = (p.act.t / p.act.hold) * 100 + '%';
  } else if (op && op.label) {
    HUD.prompt.isVisible = true;
    HUD.ptext.text = op.label;
    HUD.pbar.width = '0%';
  } else HUD.prompt.isVisible = false;
  bannerT -= dt;
  HUD.banner.alpha = clamp(bannerT * 3, 0, 1);
  noteT -= dt;
  HUD.note.alpha = clamp(noteT * 4, 0, 1);
  /* mira */
  const showX = p.alive && !pilot && p.ads < 0.5 && !p.bot;
  HUD.xh.box.isVisible = showX;
  if (showX)
    HUD.xh.update(
      SAVE.xh,
      SAVE.xh.dynamic
        ? Math.min(
            40,
            spreadOf(p, d) * engine.getRenderHeight() * 0.8 * engine.getHardwareScalingLevel()
          )
        : 0
    );
  HUD.drone.isVisible = pilot;
  HUD.lost.isVisible = pilot && !drone.alive;
  if (HUD.lost.isVisible) {
    HUD.lost.alpha = 0.9 + Math.random() * 0.1;
    HUD.lostT.text =
      drone.left > 0
        ? 'SINAL PERDIDO\nconectando ao drone reserva…'
        : `SINAL PERDIDO · SEM DRONES\naguarde a fase de ação (${fmt(G.phaseT)})`;
  }
  HUD.scope.isVisible = p.alive && !pilot && !!d.ovl && p.ads > 0.85;
  HUD.flash.alpha = p.blindT > 0 ? Math.min(1, p.blindT / Math.max(0.8, p.blindMax * 0.5)) : 0;
  hitT -= dt;
  HUD.hit.alpha = hitT > 0 ? 1 : 0;
  hurtT -= dt;
  HUD.hurt.alpha = Math.max(0, hurtT * 1.5);
  HUD.dir.alpha = Math.max(0, hurtT * 2);
  if (!p.alive && G.phase !== 'over') {
    const t = specTarget();
    HUD.spec.isVisible = !!t;
    if (t) HUD.specT.text = `Você caiu · assistindo ${t.name} (${t.op.name}) · clique para trocar`;
  } else HUD.spec.isVisible = false;
  /* objetivo */
  let tgt = null,
    label = '';
  if (G.planted) {
    tgt = G.planted.pos.clone().setY(0.8);
    label = `DESATIVADOR · ${Math.ceil(G.planted.t)}s`;
  } else if (G.siteKnown) {
    const S = SITES[G.siteKey];
    tgt = siteCenter(S).setY(1.2);
    label = `${S.key} · ${S.name.toUpperCase()}`;
  }
  if (tgt) {
    HUD.objNode.position.set(tgt.x, tgt.y, tgt.z);
    _pv.set(tgt.x, tgt.y, tgt.z);
    const dist = Math.round(_pv.subtract(camera.position).length());
    const fw = camera.getDirection(B.Axis.Z).scale(-1);
    const front = B.Vector3.Dot(fw, HUD.objNode.position.subtract(camera.position)) > 0;
    HUD.obj.isVisible = front;
    HUD.objT.text = `${label} · ${dist}m`;
    HUD.objDia.color = G.planted ? PAL.danger : PAL.warn;
  } else HUD.obj.isVisible = false;
  /* radar */
  radarT -= dt;
  if (radarDirty && radarT <= 0) {
    const im = new Image();
    im.onload = () => {
      HUD.radImg.domImage = im;
    };
    im.src = radarUrl();
    radarDirty = false;
    radarT = 0.5;
  } /* troca só depois de carregar: sem piscar */
  let di = 0;
  const dot = (x, z, col, sz) => {
    const d0 = HUD.dots[di++];
    if (!d0) return;
    d0.isVisible = true;
    d0.background = col;
    d0.width = d0.height = sz + 'px';
    d0.left = 6 + (x / CELL) * RS - sz / 2 + 'px';
    d0.top = 6 + (z / CELL) * RS - sz / 2 + 'px';
  };
  for (const a of agents) {
    if (!a.alive) continue;
    if (a.team === player.team)
      dot(a.pos.x, a.pos.z, a.isPlayer ? PAL.text : teamCol(a.team), a.isPlayer ? 7 : 6);
    else if (a.spotT > G.clock) dot(a.pos.x, a.pos.z, '#ff3b30', 6);
  }
  if (G.planted)
    dot(G.planted.pos.x, G.planted.pos.z, Math.floor(G.clock * 4) % 2 ? '#ff3b30' : PAL.warn, 8);
  if (drone.alive && drone.active) dot(drone.pos.x, drone.pos.z, PAL.warn, 5);
  for (; di < HUD.dots.length; di++) HUD.dots[di].isVisible = false;
  const px = 6 + (p.pos.x / CELL) * RS,
    pz = 6 + (p.pos.z / CELL) * RS;
  HUD.radDir.isVisible = p.alive;
  HUD.radDir.x1 = px;
  HUD.radDir.y1 = pz;
  HUD.radDir.x2 = px - Math.sin(p.yaw) * 10;
  HUD.radDir.y2 = pz - Math.cos(p.yaw) * 10;
  HUD.radDir.horizontalAlignment = HA;
  HUD.radDir.verticalAlignment = VT;
  for (const c of HUD.feed.children) {
    if (c._t != null) {
      c._t -= dt;
      if (c._t <= 0) c.isVisible = false;
    }
  }
  if (HUD.board.isVisible && Math.random() < dt * 4) boardRows(false);
  if (SAVE.fps) {
    fpsAcc += dt;
    fpsN++;
    if (fpsAcc > 0.5) {
      HUD.fps.text = Math.round(fpsN / fpsAcc) + ' FPS';
      fpsAcc = 0;
      fpsN = 0;
    }
  } else HUD.fps.text = '';
  /* online: atraso da conexão sempre visível (acima de 150 ms a compensação já não cobre tudo) */
  if (MP.role === 'guest') {
    const t = ON.st === 'retry' ? 'reconectando…' : ON.rtt + ' ms';
    const b = HUD.fps.text.split(' · ')[0];
    HUD.fps.text = SAVE.fps && b.endsWith('FPS') ? b + ' · ' + t : t;
  }
}
function layoutHUD() {
  const w = innerWidth;
  HUD.radBox.isVisible = w > 620;
  HUD.feed.isVisible = w > 620;
  HUD.A.icons.isVisible = HUD.B.icons.isVisible = w > 760;
  HUD.A.r.width = HUD.B.r.width = (w > 760 ? 200 : 64) + 'px';
  HUD.board.width = Math.min(760, w - 32) + 'px';
  HUD.banner.width = Math.min(640, w - 32) + 'px';
  /* painéis de tamanho fixo encolhem em janelas pequenas (nada fica cortado) */
  const fit = (c, W, H) => {
    if (!c) return;
    const k = Math.min(1, (innerWidth - 16) / W, (innerHeight - 16) / H);
    c.scaleX = c.scaleY = k;
  };
  fit(HUD.pc, 460, 340);
  fit(HUD.oc, 780, 670);
}
