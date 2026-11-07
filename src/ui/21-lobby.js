/* =====================================================================
   LOBBY — vitrine 3D do operador/arma + menu em abas (Babylon GUI)
   ===================================================================== */
const lobbyCam = new B.FreeCamera('lcam', new B.Vector3(0, 1.3, 4.8), lobby);
lobbyCam.inputs.clear();
lobbyCam.fov = 0.6;
lobbyCam.minZ = 0.1;
(function buildLobbyScene() {
  lobby.clearColor = new B.Color4(0.075, 0.085, 0.1, 1);
  const h = new B.HemisphericLight('lh', new B.Vector3(0, 1, 0), lobby);
  h.intensity = 0.7;
  envTex(lobby);
  lobby.environmentIntensity = 0.6;
  h.diffuse = C3('#b4c8da');
  h.groundColor = C3('#2a2f35');
  const k = new B.DirectionalLight('lk', new B.Vector3(-0.9, -0.45, -0.35), lobby);
  k.intensity = 4.2;
  k.diffuse = C3('#b9d2ec'); /* luz lateral fria */
  const fill = new B.DirectionalLight('lf', new B.Vector3(0.3, -0.35, -1), lobby);
  fill.intensity = 1.6;
  fill.diffuse = C3('#dfe8f2');
  const rim = new B.DirectionalLight('lr', new B.Vector3(0.7, -0.25, 0.9), lobby);
  rim.intensity = 1.8;
  rim.diffuse = C3(PAL.atk);
  lobby._rim = rim;
  const plat = B.MeshBuilder.CreateCylinder(
    'plat',
    { diameterTop: 2.5, diameterBottom: 2.7, height: 0.14, tessellation: 48 },
    lobby
  );
  plat.position.y = -0.07;
  plat.material = pbr(lobby, { color: '#15181b', rough: 0.55, metal: 0.2 });
  const ring = B.MeshBuilder.CreateTorus(
    'ring',
    { diameter: 2.6, thickness: 0.02, tessellation: 64 },
    lobby
  );
  ring.position.y = 0.01;
  ring.material = unlit(lobby, PAL.acc);
  lobby._ring = ring;

  lobby.fogMode = B.Scene.FOGMODE_LINEAR;
  lobby.fogColor = new B.Color3(0.075, 0.085, 0.1);
  lobby.fogStart = 6;
  lobby.fogEnd = 15;
  const pp = new B.DefaultRenderingPipeline('lpp', true, lobby, [lobbyCam]);
  pp.fxaaEnabled = true;
  pp.imageProcessing.toneMappingEnabled = true;
  pp.imageProcessing.toneMappingType = B.ImageProcessingConfiguration.TONEMAPPING_ACES;
  pp.imageProcessing.exposure = 1.4;
})();
const show = new B.TransformNode('show', lobby);
let showKey = '',
  showYaw = 0.35,
  dragging = false,
  dragX = 0,
  menuTab = 'play',
  opsSide = 'atk',
  arsW = 'rifle';
const camPos = new V3(0, 1.3, 4.8),
  camLook = new V3(0, 1, 0);
function refreshShow() {
  const opId =
    menuTab === 'ops'
      ? opsSide === 'atk'
        ? SAVE.atkOp
        : SAVE.defOp
      : SAVE.startSide === 'atk'
        ? SAVE.atkOp
        : SAVE.defOp;
  const wmode = menuTab === 'arsenal';
  const op = opById(opId);
  const L = SAVE.load[op.id] || { p: op.prim },
    wv = wVariant(arsW, SAVE.att[arsW]),
    pv = wVariant(L.p, SAVE.att[L.p]);
  const key = wmode
    ? 'w|' + wv + '|' + SAVE.skins[arsW]
    : 'c|' + opId + '|' + pv + '|' + SAVE.skins[L.p];
  if (key === showKey) return;
  showKey = key;
  for (const c of show.getChildren()) c.dispose();
  if (wmode) {
    /* armeiro: a arma com os acessórios escolhidos, girando (pistolas maiores para dar para ver) */
    const w = buildWeapon(lobby, wv, SAVE.skins[arsW]),
      cls = WEAPONS[arsW].cls,
      small = cls === 'pistol' || cls === 'rev' || cls === 'mp';
    const holder = new B.TransformNode('h', lobby);
    holder.parent = show;
    w.g.parent = holder;
    w.g.position.set(0, small ? 0.02 : -0.01, small ? 0.03 : 0.2);
    holder.scaling.setAll(small ? 2.3 : 1.15);
    holder.position.y = 1.15;
    holder.rotation.z = 0.06;
  } else {
    const ch = buildCharacter(lobby, op, 'ally');
    setCharWeapon(ch, pv, SAVE.skins[L.p]);
    LA.pv = pv;
    LA.psid = SAVE.skins[L.p];
    ch.root.parent = show;
    ch.up.rotation.x = -0.05;
    /* vitrine viva: o soldado respira, olha em volta, mira, recarrega, agacha e usa o gadget em ciclo (mesmo sistema de animação do jogo) */
    try {
      const ag = {
        id: -1,
        name: 'vitrine',
        team: 'A',
        isPlayer: false,
        bot: true,
        op,
        side: opsSide,
        pos: new V3(),
        vel: new V3(),
        vy: 0,
        onGround: true,
        landT: 0,
        yaw: Math.PI,
        pitch: 0,
        crouchK: 0,
        lean: 0,
        ads: 0,
        vault: null,
        hp: 100,
        alive: true,
        w: { p: mkW(pv), s: mkW(L.s) },
        cur: 'p',
        reloadT: 0,
        fireCD: 0,
        shots: 0,
        sinceShot: 9,
        gadgetN: op.gn,
        charges: [],
        spotT: -99,
        act: null,
        skins: {},
        meleeCD: 0,
        slowT: 0,
        punch: 0,
        punchYaw: 0,
        sprint: false,
        sprintOut: 0,
        recAcc: 0,
        recRet: 0,
        fireT: -9,
        ai: {},
      };
      LA.ch = ch;
      LA.ag = ag;
      LA.t = 0;
      LA.i = -1;
      LA.off = false;
    } catch (e) {
      LA.off = true;
    }
  }
  const side = menuTab === 'ops' ? opsSide : SAVE.startSide;
  lobby._ring.material.emissiveColor = C3(side === 'def' ? PAL.def : PAL.atk);
}
const LA = { ch: null, ag: null, t: 0, i: -1, off: false };
const LA_SEQ = [
  ['idle', 4],
  ['crouch', 3],
  ['idle', 4],
]; /* só poses que ficam boas na vitrine (a torção do tronco, a recarga e a mira parada pareciam quebradas) */
function lobbyLive(dt) {
  const ag = LA.ag,
    ch = LA.ch;
  if (!ag || !ch || LA.off || menuTab === 'arsenal' || ch.root.isDisposed()) return;
  if (LA.pv && !ch.wReal)
    setCharWeapon(ch, LA.pv, LA.psid); /* o modelo real termina de carregar depois do menu abrir */
  LA.t += dt;
  let st = LA_SEQ[Math.max(0, LA.i)];
  if (LA.i < 0 || LA.t >= (st[1] == null ? ag._rd || 2.4 : st[1])) {
    LA.i = (LA.i + 1) % LA_SEQ.length;
    LA.t = 0;
    st = LA_SEQ[LA.i];
    if (st[0] === 'reload') {
      const d = WEAPONS[curW(ag).id];
      ag.w.p.mag = 0;
      ag.reloadT = d.reload;
      ag._rd = d.reload + 0.5;
    }
    if (st[0] === 'gadget' && ag.gadgetN > 0) ag.gadgetN--;
    if (ag.gadgetN < 1 && st[0] !== 'gadget') ag.gadgetN = ag.op.gn;
  }
  const m = st[0],
    k = 1 - Math.exp(-dt * 6);
  ag.ads += ((m === 'ads' ? 1 : 0) - ag.ads) * k;
  ag.crouchK += ((m === 'crouch' ? 1 : 0) - ag.crouchK) * k;
  if (ag.reloadT > 0) {
    ag.reloadT = Math.max(0, ag.reloadT - dt);
    if (ag.reloadT === 0) {
      const D = WEAPONS[curW(ag).id];
      ag.w.p.mag = D.mag;
    }
  }
  ag.yaw = Math.PI;
  try {
    animChar(ch, ag, dt);
  } catch (e) {
    LA.off = true;
  }
}
function updateShowroom(dt) {
  refreshShow();
  lobbyLive(dt);
  if (!dragging) {
    if (LA.ag && !LA.off && menuTab !== 'arsenal') {
      const tg = 0.3 + Math.sin(performance.now() / 5200) * 0.35,
        df = Math.atan2(Math.sin(tg - showYaw), Math.cos(tg - showYaw));
      showYaw += df * Math.min(1, dt * 1.2);
    } else showYaw += dt * 0.25;
  }
  show.rotation.y = showYaw;
  const wide = innerWidth > 860;
  const wmode = menuTab === 'arsenal';
  const tx = wide ? (wmode ? -0.5 : -1.15) : 0;
  const wp = wmode ? new V3(tx, 1.24, 2.9) : new V3(tx, 1.3, 4.8),
    wl = wmode ? new V3(tx, 1.13, 0) : new V3(tx, 0.98, 0); /* armeiro: câmera perto da arma */
  camPos.lerp(wp, Math.min(1, dt * 4));
  camLook.lerp(wl, Math.min(1, dt * 4));
  lobbyCam.position.set(camPos.x, camPos.y, camPos.z);
  const d = camLook.clone().sub(camPos);
  lobbyCam.rotation.set(Math.atan2(d.y, Math.hypot(d.x, d.z)), Math.atan2(-d.x, -d.z), 0);
}

/* ---------- estrutura fixa do menu ---------- */
const LB = {};
(function buildLobbyUI() {
  const top = rect({ h: 64, w: '100%', va: VT, bg: 'rgba(10,11,13,.94)', block: true });
  uiLobby.addControl(top);
  top.addControl(rect({ w: '100%', h: 1, va: VB, bg: '#2a2e33' }));
  const bar = stack(false, { h: 64, spacing: 14 });
  bar.paddingLeft = '20px';
  top.addControl(bar);
  const logo = stack(false, { h: 64, spacing: 10 });
  logo.width = '56px';
  const sy = new GUI.Image('sym', symbolUrl(96));
  sy.width = '34px';
  sy.height = '34px';
  sy.verticalAlignment = VC;
  logo.addControl(sy);
  bar.addControl(logo);
  LB.tabs = stack(false, { h: 64, spacing: 2 });
  bar.addControl(LB.tabs);
  const who = text('BETA 6.0 · Offline e Online', { size: 12, color: PAL.muted, align: 'right' });
  who.horizontalAlignment = HR;
  who.paddingRight = '20px';
  top.addControl(who);
  LB.who = who;
  {
    const gd = document.createElement('canvas');
    gd.width = 512;
    gd.height = 8;
    const gg = gd.getContext('2d'),
      gr = gg.createLinearGradient(0, 0, 512, 0);
    gr.addColorStop(0, 'rgba(10,11,13,.96)');
    gr.addColorStop(0.42, 'rgba(10,11,13,.82)');
    gr.addColorStop(0.75, 'rgba(10,11,13,0)');
    gg.fillStyle = gr;
    gg.fillRect(0, 0, 512, 8);
    const im = new GUI.Image('gdl', gd.toDataURL());
    im.stretch = GUI.Image.STRETCH_FILL;
    im.isHitTestVisible = false;
    im.verticalAlignment = VB;
    im.height = '91%';
    uiLobby.addControl(im);
  }
  LB.panel = rect({ w: 470, ha: HA, va: VT, bg: 'transparent', border: 0, block: true });
  LB.panel.left = '20px';
  LB.panel.top = '80px';
  uiLobby.addControl(LB.panel);
  LB.scroll = new GUI.ScrollViewer();
  LB.scroll.thickness = 0;
  LB.scroll.barSize = 7;
  LB.scroll.barColor = '#6b737b';
  LB.scroll.barBackground = 'transparent';
  LB.panel.addControl(LB.scroll);
  LB.content = stack(true, { w: '100%' });
  LB.content.paddingLeft = '20px';
  LB.content.paddingRight = '20px';
  LB.content.paddingTop = '18px';
  LB.content.paddingBottom = '20px';
  LB.scroll.addControl(LB.content);
  LB.play = bigButton('JOGAR', 'Bomba · Prédio de Escritórios', () => startMatch(), {
    w: 300,
    h: 76,
    subTop: true,
  });
  LB.play.addControl(rect({ w: '100%', h: 3, bg: PAL.acc, va: VB }));
  LB.play.horizontalAlignment = HR;
  LB.play.verticalAlignment = VB;
  LB.play.left = '-20px';
  LB.play.top = '-18px';
  uiLobby.addControl(LB.play);
  const hint = text('Arraste para girar', {
    size: 11,
    color: PAL.muted,
    spacing: '2px',
    upper: true,
  });
  hint.horizontalAlignment = HA;
  hint.verticalAlignment = VB;
  hint.left = '20px';
  hint.top = '-20px';
  uiLobby.addControl(hint);
  LB.hint = hint;
})();
function layoutLobby() {
  const w = innerWidth,
    h = innerHeight,
    narrow = w < 860,
    ops = FLOW.step === 'ops';
  LB.panel.width = (narrow ? w - 32 : 470) + 'px';
  LB.panel.left = (narrow ? 16 : 20) + 'px';
  LB.panel.height = Math.max(200, h - 80 - (narrow ? 110 : ops ? 100 : 30)) + 'px';
  if (ops && !narrow) {
    LB.play.horizontalAlignment = HA;
    LB.play.width = '270px';
    LB.play.height = '60px';
    LB.play.left = '40px';
  } else {
    LB.play.horizontalAlignment = HR;
    LB.play.height = '76px';
    LB.play.width = (narrow ? w - 32 : 300) + 'px';
    LB.play.left = narrow ? '-16px' : '-20px';
  }
  LB.hint.isVisible = !narrow;
  LB.who.isVisible = w > 1000;
}
/* ---------- painel do operador (nome grande, arma, barras) ---------- */
function updateOpInfo(o, LO, sc) {
  if (!LB.info) {
    const r = rect({ w: 340, h: 420, ha: HA, va: VT, bg: 'transparent' });
    r.left = '520px';
    r.top = '150px';
    const st = stack(true, { w: '100%' });
    LB.infoS = st;
    r.addControl(st);
    uiLobby.addControl(r);
    LB.info = r;
  }
  const st = LB.infoS;
  st.clearControls();
  LB.info.isVisible = innerWidth > 1000;
  {
    const lg = o.name.length > 7;
    st.addControl(
      disp(o.name.toUpperCase(), { size: lg ? 54 : 76, h: lg ? 70 : 92, spacing: '3px' })
    );
  }
  st.addControl(
    text((o.role + ' · ' + (opsSide === 'atk' ? 'ataque' : 'defesa')).toUpperCase(), {
      size: 13,
      weight: '600',
      color: sc,
      spacing: '4px',
      h: 24,
    })
  );
  st.addControl(gap(14));
  st.addControl(
    text('ARMA PRIMÁRIA', { size: 11, color: PAL.muted, weight: '600', spacing: '3px', h: 18 })
  );
  st.addControl(
    text(WEAPONS[LO.p].name.toUpperCase(), { size: 28, weight: '700', h: 36, spacing: '1px' })
  );
  const ic = new GUI.Image('oi', wSil(LO.p, false));
  ic.width = '230px';
  ic.height = '72px';
  ic.stretch = GUI.Image.STRETCH_UNIFORM;
  ic.horizontalAlignment = HA;
  st.addControl(ic);
  st.addControl(gap(10));
  const bars = (label, n, max) => {
    const g = new GUI.Grid();
    g.height = '26px';
    g.width = '100%';
    g.addColumnDefinition(110, true);
    g.addColumnDefinition(1);
    g.addControl(text(label, { size: 11, color: PAL.muted, weight: '600', spacing: '3px' }), 0, 0);
    const rr = stack(false, { h: 26, spacing: 4 });
    for (let i = 0; i < max; i++)
      rr.addControl(rect({ w: 26, h: 5, bg: i < n ? PAL.text : '#2a2e33' }));
    g.addControl(rr, 0, 1);
    return g;
  };
  st.addControl(bars('BLINDAGEM', o.armor, 3));
  st.addControl(bars('VELOCIDADE', 4 - o.armor, 3));
}
/* ---------- painel do armeiro: nome, descrição, acessórios e anéis de estatística ---------- */
function ringUrl(f) {
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const g = c.getContext('2d');
  g.lineWidth = 5;
  g.strokeStyle = '#2a2e33';
  g.beginPath();
  g.arc(48, 48, 38, 0, 7);
  g.stroke();
  g.strokeStyle = '#f1f2f3';
  g.beginPath();
  g.arc(48, 48, 38, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(f, 0.03, 1));
  g.stroke();
  return c.toDataURL();
}
function updateArsInfo(D, V, att) {
  if (!LB.ars) {
    const r = rect({ w: 420, h: 500, ha: HA, va: VT, bg: 'transparent' });
    r.left = '520px';
    r.top = '140px';
    r.isHitTestVisible = false;
    const st = stack(true, { w: '100%' });
    LB.arsS = st;
    r.addControl(st);
    uiLobby.addControl(r);
    LB.ars = r;
  }
  const st = LB.arsS;
  st.clearControls();
  LB.ars.isVisible = innerWidth > 1000;
  st.addControl(text(D.name.toUpperCase(), { size: 44, weight: '600', h: 54, spacing: '2px' }));
  st.addControl(text(D.type.toUpperCase(), { size: 12, color: PAL.muted, spacing: '3px', h: 22 }));
  const ch = [];
  const A = ATT;
  for (const [k, l] of [
    ['sight', 'MIRA'],
    ['barrel', 'CANO'],
    ['grip', 'EMPUNHADURA'],
    ['laser', 'LASER'],
  ]) {
    const o = A[k] && A[k][att[k]];
    if (o && o.name && !/nenhum|de ferro|padrão|desligado/i.test(o.name))
      ch.push(l + ' · ' + o.name.toUpperCase());
  }
  if (ch.length) {
    st.addControl(gap(236));
    const row = stack(false, { h: 30, spacing: 6 });
    for (const c of ch.slice(0, 2)) {
      const q = rect({
        w: c.length * 7.4 + 18,
        h: 24,
        bg: 'transparent',
        border: 1,
        borderColor: '#454b52',
      });
      q.addControl(
        text(c, {
          size: 10,
          color: PAL.muted,
          spacing: '1px',
          align: 'center',
          width: '100%',
          h: 16,
        })
      );
      row.addControl(q);
    }
    st.addControl(row);
  } else st.addControl(gap(268));
  const rg = stack(false, { h: 90, spacing: 26 });
  const rr = (lbl, f) => {
    const s2 = stack(true, { w: '72px' });
    const im = new GUI.Image('rg', ringUrl(f));
    im.width = '54px';
    im.height = '54px';
    s2.addControl(im);
    s2.addControl(
      text(lbl, {
        size: 9,
        color: PAL.muted,
        weight: '600',
        spacing: '2px',
        align: 'center',
        width: '100%',
        h: 14,
      })
    );
    return s2;
  };
  rg.addControl(rr('DANO', (V.dmg * (V.pellets || 1)) / 180));
  rg.addControl(rr('CADÊNCIA', 60 / V.rate / 1100));
  rg.addControl(rr('MOBILIDADE', V.mob || 1));
  rg.addControl(rr('CAPACIDADE', V.mag / 80));
  st.addControl(rg);
}
/* ---------- conteúdo de cada aba ---------- */
function renderMenu() {
  LB.tabs.clearControls();
  if (LB.info) LB.info.isVisible = false;
  if (LB.ars) LB.ars.isVisible = false;
  const isoOps = FLOW.step === 'ops';
  if (isoOps) {
    const tt = text('SELEÇÃO DE OPERADOR', { size: 14, weight: '700', spacing: '4px', h: 64 });
    tt.verticalAlignment = VC;
    LB.tabs.addControl(tt);
  }
  for (const [k, l] of isoOps
    ? []
    : [
        ['play', 'Jogar'],
        ['online', 'Online'],
        ['ops', 'Operadores'],
        ['xh', 'Mira'],
        ['opts', 'Opções'],
      ]) {
    const b = GUI.Button.CreateSimpleButton('tab', l.toUpperCase());
    b.width = l.length * 12 + 36 + 'px';
    b.height = '64px';
    b.thickness = 0;
    b.textBlock.fontFamily = FONT;
    b.textBlock.fontSize = 14;
    b.textBlock.fontWeight = menuTab === k ? '700' : '600';
    b.textBlock.letterSpacing = '3px';
    b.textBlock.color = menuTab === k ? PAL.text : PAL.muted;
    if (menuTab === k) {
      const u = rect({ h: 2, w: '60%', va: VB, bg: PAL.acc });
      b.addControl(u);
    }
    b.onPointerUpObservable.add(() => {
      if (FLOW.step === 'ops' && k === 'play') {
        if (FLOW.mode === 'round') return;
        playSound('ui');
        flowCancel();
        menuTab = 'play';
        renderMenu();
        return;
      }
      menuTab = k;
      playSound('ui');
      renderMenu();
    });
    LB.tabs.addControl(b);
  }
  LB.play.isVisible = menuTab !== 'online';
  const C = LB.content;
  C.clearControls();
  const add = (c) => {
    C.addControl(c);
    return c;
  };
  const rerender = () => {
    persist();
    renderMenu();
  };
  if (menuTab === 'online') {
    onlineTab(add);
  } else if (menuTab === 'play') {
    add(disp('JOGAR', { size: 44, h: 58, spacing: '5px' }));
    add(gap(14));
    {
      const card = chamfer({ w: '100%', h: 78, block: true });
      card.hoverCursor = 'pointer';
      const cs = stack(true, { w: '100%' });
      cs.paddingLeft = '16px';
      cs.verticalAlignment = VC;
      cs.addControl(
        text('PARTIDA RÁPIDA', { size: 11, color: '#454b52', weight: '600', spacing: '3px', h: 16 })
      );
      cs.addControl(
        text('BOMBA · PRÉDIO DE ESCRITÓRIOS ›', {
          size: 22,
          weight: '700',
          color: '#0a0b0d',
          spacing: '1px',
          h: 32,
        })
      );
      card.addControl(cs);
      card.onPointerUpObservable.add(() => {
        playSound('ui');
        flowStart();
      });
      add(card);
    }
    add(gap(10));
    add(
      text(`5 contra 5 · uma vida por rodada · lado sorteado · primeiro a ${WIN_ROUNDS}`, {
        size: 12,
        color: PAL.muted,
        h: 20,
      })
    );
  } else if (menuTab === 'ops') {
    if (FLOW.mode !== 'round' && FLOW.step !== 'ops') {
      add(
        chipRow(
          [
            ['atk', 'Ataque'],
            ['def', 'Defesa'],
          ],
          opsSide,
          (v) => {
            opsSide = v;
            renderMenu();
          }
        )
      );
      add(gap(10));
    }
    add(disp('SELEÇÃO DE OPERADOR', { size: 34, h: 48, spacing: '4px' }));
    const cur = opsSide === 'atk' ? SAVE.atkOp : SAVE.defOp,
      sc = opsSide === 'atk' ? PAL.atk : PAL.def;
    const ey = text(opsSide === 'atk' ? 'ESCOLHA SEU ATACANTE' : 'ESCOLHA SEU DEFENSOR', {
      size: 11,
      color: sc,
      weight: '600',
      spacing: '3px',
      h: 22,
    });
    add(ey);
    {
      /* fichas em linhas de 3 (a lista inteira cabe no painel, sem rolar para o lado), com o nome do operador */
      const avail = (innerWidth <= 860 ? innerWidth - 32 : 470) - 40 - 10,
        tw = Math.max(92, Math.floor((avail - 12) / 3));
      let row = null;
      OPS[opsSide].forEach((o, i) => {
        if (i % 3 === 0) {
          row = stack(false, { h: 64, spacing: 6 });
          add(row);
        }
        const on = o.id === cur,
          bnd = G.bans[opsSide] === o.id;
        const t = rect({
          w: tw,
          h: 58,
          bg: on ? '#d6d9dc' : '#121416',
          border: 1,
          borderColor: on ? '#d6d9dc' : '#2a2e33',
        });
        t.isPointerBlocker = true;
        t.hoverCursor = 'pointer';
        const im = new GUI.Image('gi', gIcon(o.gadget, on ? '#0a0b0d' : '#f1f2f3'));
        im.width = '28px';
        im.height = '28px';
        im.horizontalAlignment = HA;
        im.left = '10px';
        t.addControl(im);
        const tx = stack(true, { w: tw - 46 + 'px' });
        tx.horizontalAlignment = HR;
        tx.verticalAlignment = VC;
        tx.addControl(
          text(o.name, { size: 15, weight: '700', h: 20, color: on ? '#0a0b0d' : PAL.text })
        );
        tx.addControl(text(o.role || '', { size: 10, h: 14, color: on ? '#454b52' : PAL.muted }));
        t.addControl(tx);
        t.onPointerEnterObservable.add(() => {
          if (!on) t.borderColor = PAL.text;
        });
        t.onPointerOutObservable.add(() => {
          if (!on) t.borderColor = '#2a2e33';
        });
        if (bnd) {
          t.alpha = 0.3;
          t.addControl(
            text('✕', {
              size: 44,
              weight: '700',
              color: PAL.warn,
              align: 'center',
              width: '100%',
              h: 56,
            })
          );
        }
        t.onPointerUpObservable.add(() => {
          if (bnd) return;
          if (opsSide === 'atk') SAVE.atkOp = o.id;
          else SAVE.defOp = o.id;
          playSound('ui');
          rerender();
        });
        row.addControl(t);
      });
    }
    if (FLOW.mode !== 'round' && FLOW.step !== 'ops') {
      const oth = opsSide === 'atk' ? 'def' : 'atk';
      add(gap(10));
      add(
        text(oth === 'atk' ? 'ATAQUE (OUTRO LADO)' : 'DEFESA (PRÓXIMO LADO)', {
          size: 11,
          color: PAL.muted,
          weight: '600',
          spacing: '3px',
          h: 22,
        })
      );
      const t2 = stack(false, { h: 70, spacing: 6 });
      for (const o of OPS[oth]) {
        const t = rect({ w: 64, h: 64, bg: '#0f1113', border: 1, borderColor: '#2a2e33' });
        t.isPointerBlocker = true;
        t.hoverCursor = 'pointer';
        const im = new GUI.Image('gi', gIcon(o.gadget, '#6c737a'));
        im.width = '34px';
        im.height = '34px';
        t.addControl(im);
        t.onPointerUpObservable.add(() => {
          opsSide = oth;
          if (oth === 'atk') SAVE.atkOp = o.id;
          else SAVE.defOp = o.id;
          playSound('ui');
          rerender();
        });
        t2.addControl(t);
      }
      add(t2);
    }
    const o = OPS[opsSide].find((x) => x.id === cur) || OPS[opsSide][0],
      LO = SAVE.load[o.id];
    add(gap(14));
    add(text(o.desc, { size: 13, color: PAL.muted, wrap: true }));
    add(gap(6));
    {
      /* loadout do operador escolhido */
      const box = stack(true, { w: '100%' });
      const row = (label, list, curW, set) => {
        box.addControl(sectionLabel(label));
        let r = null;
        list.forEach((w, i) => {
          if (i % 3 === 0) {
            r = stack(false, { h: 92, spacing: 5 });
            box.addControl(r);
          }
          const D = WEAPONS[w],
            on = w === curW;
          const c = rect({
            w: 136,
            h: 86,
            bg: on ? '#d6d9dc' : '#121416',
            border: 1,
            borderColor: on ? '#d6d9dc' : '#2a2e33',
          });
          c.isPointerBlocker = true;
          c.hoverCursor = 'pointer';
          const ic = new GUI.Image('wi', wSil(w, on));
          ic.width = '104px';
          ic.height = '36px';
          ic.verticalAlignment = VT;
          ic.top = '8px';
          ic.stretch = GUI.Image.STRETCH_UNIFORM;
          c.addControl(ic);
          const tx = stack(true, { w: '100%' });
          tx.verticalAlignment = VB;
          tx.paddingLeft = '8px';
          tx.paddingBottom = '6px';
          tx.addControl(
            text(D.name, { size: 15, weight: '700', h: 18, color: on ? '#0a0b0d' : PAL.text })
          );
          tx.addControl(
            text(`${Math.round(D.dmg * (D.pellets || 1))} dano · ${Math.round(60 / D.rate)} rpm`, {
              size: 10,
              color: on ? '#454b52' : PAL.muted,
              h: 14,
            })
          );
          c.addControl(tx);
          c.onPointerEnterObservable.add(() => {
            if (!on) c.borderColor = PAL.text;
          });
          c.onPointerOutObservable.add(() => {
            if (!on) c.borderColor = '#2a2e33';
          });
          c.onPointerUpObservable.add(() => {
            playSound('ui');
            set(w);
            arsW = w;
            rerender();
          });
          r.addControl(c);
        });
      };
      row('ARMA PRIMÁRIA', o.prims, LO.p, (w) => (LO.p = w));
      row('ARMA SECUNDÁRIA', o.secs, LO.s, (w) => (LO.s = w));
      add(box);
      add(gap(10));
      {
        const ab = chamfer({ w: '100%', h: 46, block: true });
        ab.hoverCursor = 'pointer';
        ab.addControl(
          text('ACESSÓRIOS E SKINS DAS ARMAS ›', {
            size: 14,
            weight: '700',
            color: '#0a0b0d',
            spacing: '2px',
            h: 24,
            width: '100%',
          })
        );
        ab.children[0].paddingLeft = '14px';
        ab.onPointerUpObservable.add(() => {
          arsW = LO.p;
          menuTab = 'arsenal';
          showKey = '';
          playSound('ui');
          renderMenu();
        });
        add(ab);
      }
    }
    updateOpInfo(o, LO, sc);
  } else if (menuTab === 'arsenal') {
    /* LOADOUT (guia v2.0): voltar · título · confirmar · slots do operador · armeiro com todas as armas */
    const lop = opById(opsSide === 'atk' ? SAVE.atkOp : SAVE.defOp),
      LOd = SAVE.load[lop.id] || (SAVE.load[lop.id] = { p: lop.prim, s: lop.secs[0] });
    {
      const bk = chip(
        '‹ Escolher operador',
        false,
        () => {
          menuTab = 'ops';
          playSound('ui');
          renderMenu();
        },
        { w: 190, h: 28, fs: 11 }
      );
      add(bk);
    }
    add(gap(8));
    add(disp('TROQUE SEU LOADOUT', { size: 34, h: 48, spacing: '4px' }));
    add(gap(6));
    {
      const cf = chamfer({ w: '100%', h: 40, block: true });
      cf.hoverCursor = 'pointer';
      cf.addControl(
        text('CONFIRMAR LOADOUT ›', {
          size: 15,
          weight: '700',
          color: '#0a0b0d',
          spacing: '3px',
          h: 24,
          width: '100%',
        })
      );
      cf.children[0].paddingLeft = '14px';
      cf.onPointerUpObservable.add(() => {
        menuTab = 'ops';
        playSound('ui');
        renderMenu();
      });
      add(cf);
    }
    const slot = (label, id, nm) => {
      add(text(label, { size: 10, color: PAL.muted, weight: '600', spacing: '3px', h: 22 }));
      const on = id && id === arsW;
      const c = rect({
        w: '100%',
        h: id ? 74 : 36,
        bg: on ? '#d6d9dc' : '#0a0b0d',
        border: 1,
        borderColor: on ? '#d6d9dc' : '#2a2e33',
      });
      c.isPointerBlocker = !!id;
      if (id) c.hoverCursor = 'pointer';
      if (id) {
        const sv = stack(true, { w: '100%' });
        sv.verticalAlignment = VC;
        sv.addControl(
          text(nm, {
            size: 15,
            weight: '700',
            color: on ? '#0a0b0d' : PAL.text,
            align: 'center',
            width: '100%',
            h: 20,
          })
        );
        const im = new GUI.Image('ls', wSil(id, on));
        im.height = '40px';
        im.stretch = GUI.Image.STRETCH_UNIFORM;
        sv.addControl(im);
        c.addControl(sv);
        c.onPointerUpObservable.add(() => {
          arsW = id;
          playSound('ui');
          rerender();
        });
      } else
        c.addControl(
          text(nm.toUpperCase(), {
            size: 14,
            weight: '700',
            align: 'center',
            width: '100%',
            h: 20,
            spacing: '2px',
          })
        );
      add(c);
    };
    slot('ARMA PRIMÁRIA', LOd.p, WEAPONS[LOd.p].name);
    slot('ARMA SECUNDÁRIA', LOd.s, WEAPONS[LOd.s].name);
    slot('GADGET PRIMÁRIO', null, GADGETS[lop.gadget].name + ' ×' + lop.gn);
    add(gap(14));
    add(
      text('ARMEIRO · TODAS AS ARMAS', {
        size: 10,
        color: PAL.muted,
        weight: '600',
        spacing: '3px',
        h: 22,
      })
    );
    const rows = [
      ['rifle', 'jararaca', 'tupa', 'boitata'],
      ['smg', 'marimbondo', 'cascavel', 'abelha'],
      ['shotgun', 'ressaca', 'dmr', 'carcara'],
      ['pistol', 'onca', 'pardal', 'jaguar'],
    ];
    for (const r of rows) {
      const rr = stack(false, { h: 34, spacing: 4 });
      for (const w of r)
        rr.addControl(
          chip(
            WEAPONS[w].name,
            w === arsW,
            () => {
              arsW = w;
              renderMenu();
            },
            { w: 100, fs: 12, h: 30 }
          )
        );
      add(rr);
    }
    const D = WEAPONS[arsW],
      att = SAVE.att[arsW],
      V = WEAPONS[wVariant(arsW, att)],
      sk = SKIN[SAVE.skins[arsW]] || SKIN.padrao,
      users = OPS.atk
        .concat(OPS.def)
        .filter((o) => o.prims.includes(arsW) || o.secs.includes(arsW))
        .map((o) => o.name);
    add(gap(8));
    const eq = stack(true, { w: '100%' });
    eq.addControl(
      text(D.type.toUpperCase() + (users.length ? ' · ' + users.join(', ') : ''), {
        size: 11,
        color: PAL.muted,
        spacing: '1.5px',
        h: 16,
      })
    );
    eq.addControl(text(`${D.name} | ${sk.name}`, { size: 19, weight: '700', h: 28 }));
    add(eq);
    /* números (já com os acessórios) */
    const bar = (label, val, max, txt, base) => {
      const g = new GUI.Grid();
      g.height = '20px';
      g.width = '100%';
      g.addColumnDefinition(96, true);
      g.addColumnDefinition(1);
      g.addColumnDefinition(64, true);
      g.addControl(text(label, { size: 11, color: PAL.muted }), 0, 0);
      const bg = rect({ h: 6, w: '100%', bg: 'rgba(255,255,255,.08)' });
      const f = rect({
        h: 6,
        w: clamp(val / max, 0.03, 1) * 100 + '%',
        bg: val > base * 1.01 ? PAL.ally : val < base * 0.99 ? PAL.warn : PAL.text,
        ha: HA,
      });
      bg.addControl(f);
      g.addControl(bg, 0, 1);
      g.addControl(text(txt, { size: 11, mono: true, align: 'right', width: '64px' }), 0, 2);
      return g;
    };
    const ctl = (d) => 1 / (d.rec.v * (1 + (d.rec.first || 1) * 0.0) + d.rec.h * 0.6 + 0.0005),
      rng = (d) => (d.fall ? d.fall[1] : (d.range || 18) * 1.6);
    add(
      bar(
        'Dano',
        V.dmg * (V.pellets || 1),
        180,
        V.pellets ? `${Math.round(V.dmg)}×${V.pellets}` : String(Math.round(V.dmg)),
        D.dmg * (D.pellets || 1)
      )
    );
    add(bar('Cadência', 60 / V.rate, 1100, Math.round(60 / V.rate) + ' rpm', 60 / D.rate));
    add(bar('Pente', V.mag, 80, V.mag + ' / ' + V.res, D.mag));
    add(
      bar(
        'Controle',
        ctl(V),
        ctl(WEAPONS.smg) * 1.3,
        Math.round((ctl(V) / ctl(WEAPONS.rifle)) * 100) + '',
        ctl(D)
      )
    );
    add(bar('Mira rápida', 1 / V.adsT, 1 / 0.14, V.adsT.toFixed(2) + ' s', 1 / D.adsT));
    add(bar('Alcance', rng(V), 60, Math.round(rng(V)) + ' m', rng(D)));
    add(
      bar(
        'Mobilidade',
        (V.mob || 1) * 100,
        100,
        Math.round((V.mob || 1) * 100) + '%',
        (D.mob || 1) * 100
      )
    );
    /* acessórios permitidos para esta família */
    const ok = D.noGrip ? Object.assign({}, ATT_OK[D.cls], { grip: ['none'] }) : ATT_OK[D.cls],
      setA = (k, v) => {
        att[k] = v;
        playSound('ui');
        showKey = '';
        rerender();
      };
    for (const [k, lbl] of [
      ['sight', 'Mira'],
      ['barrel', 'Cano'],
      ['grip', 'Empunhadura'],
      ['laser', 'Laser'],
    ]) {
      if (ok[k].length < 2) continue;
      add(sectionLabel(lbl));
      let n = 0,
        cur = stack(false, { h: 34, spacing: 4 });
      for (const v of ok[k]) {
        if (n && n % 4 === 0) {
          add(cur);
          cur = stack(false, { h: 34, spacing: 4 });
        }
        const A = ATT[k][v];
        cur.addControl(
          chip(A.name, String(att[k]) === String(v), () => setA(k, v), { w: 100, fs: 11, h: 30 })
        );
        n++;
      }
      add(cur);
      const A = ATT[k][att[k]];
      if (A && A.desc) add(text(A.desc, { size: 11, color: PAL.muted, h: 16 }));
    }
    add(sectionLabel('Skin'));
    const grid = new GUI.Grid();
    const gr = Math.ceil(SKINS.length / 3);
    grid.width = '100%';
    grid.height = gr * 118 + 'px';
    for (let i = 0; i < 3; i++) grid.addColumnDefinition(1 / 3);
    for (let i = 0; i < gr; i++) grid.addRowDefinition(118, true);
    SKINS.forEach((s, i) => {
      const sel = s.id === sk.id;
      const cell = rect({
        w: '96%',
        h: '92%',
        bg: 'rgba(255,255,255,.02)',
        border: sel ? 2 : 1,
        borderColor: sel ? PAL.text : 'rgba(155,161,167,.16)',
      });
      cell.isPointerBlocker = true;
      cell.hoverCursor = 'pointer';
      const im = new GUI.Image('sk', skinThumb(s.id));
      im.height = '56px';
      im.width = '100%';
      im.verticalAlignment = VT;
      im.stretch = GUI.Image.STRETCH_FILL;
      cell.addControl(im);
      if (s.id === 'padrao') {
        const tint = rect({ h: 56, w: '100%', va: VT, bg: FACTORY[arsW] });
        tint.alpha = 0.7;
        cell.addControl(tint);
      }
      const tx = stack(true, { w: '100%' });
      tx.verticalAlignment = VB;
      tx.paddingLeft = '8px';
      tx.paddingBottom = '8px';
      tx.addControl(text(s.name, { size: 12, weight: '700', wrap: true }));
      tx.addControl(
        text(RAR[s.rar].n.toUpperCase(), { size: 10, color: RAR[s.rar].c, spacing: '1.5px', h: 14 })
      );
      cell.addControl(tx);
      cell.addControl(rect({ h: 3, w: '100%', va: VB, bg: RAR[s.rar].c }));
      cell.onPointerUpObservable.add(() => {
        SAVE.skins[arsW] = s.id;
        playSound('ui');
        rerender();
      });
      grid.addControl(cell, (i / 3) | 0, i % 3);
    });
    add(grid);
    updateArsInfo(D, V, att);
  } else if (menuTab === 'xh') {
    const x = SAVE.xh;
    const prev = rect({ w: '100%', h: 200, border: 1 });
    const bg = new GUI.Image('xbg', IMG.xhbg);
    bg.stretch = GUI.Image.STRETCH_FILL;
    prev.addControl(bg);
    const xc = makeCrosshair(prev);
    xc.update(x, 0);
    add(prev);
    const upd = () => {
      persist();
      xc.update(SAVE.xh, 0);
    };
    add(sectionLabel('Estilo'));
    add(
      chipRow(
        [
          ['classic', 'Clássica'],
          ['t', 'T'],
          ['dot', 'Ponto'],
          ['circle', 'Círculo'],
        ],
        x.style,
        (v) => {
          x.style = v;
          rerender();
        }
      )
    );
    add(sectionLabel('Cor'));
    const cr = stack(false, { h: 34, spacing: 8 });
    for (const c of [
      '#7df3e1',
      '#6dff8a',
      '#ffe45c',
      '#ffffff',
      '#ff4fd8',
      '#ff4b3b',
      '#4fa8ff',
      '#ff9a2e',
    ]) {
      const sw = rect({
        w: 30,
        h: 30,
        bg: c,
        border: x.color === c ? 3 : 1,
        borderColor: x.color === c ? PAL.text : 'rgba(0,0,0,.4)',
      });
      sw.isPointerBlocker = true;
      sw.hoverCursor = 'pointer';
      sw.onPointerUpObservable.add(() => {
        x.color = c;
        rerender();
      });
      cr.addControl(sw);
    }
    add(cr);
    add(gap(8));
    add(
      sliderRow(
        'Tamanho',
        1,
        16,
        1,
        x.size,
        (v) => String(v),
        (v) => {
          x.size = v;
          upd();
        }
      )
    );
    add(
      sliderRow(
        'Espessura',
        1,
        4,
        1,
        x.thick,
        (v) => String(v),
        (v) => {
          x.thick = v;
          upd();
        }
      )
    );
    add(
      sliderRow(
        'Espaço',
        0,
        14,
        1,
        x.gap,
        (v) => String(v),
        (v) => {
          x.gap = v;
          upd();
        }
      )
    );
    add(gap(6));
    add(
      checkRow('Contorno', x.outline, (v) => {
        x.outline = v;
        upd();
      })
    );
    add(
      checkRow('Ponto central', x.dot, (v) => {
        x.dot = v;
        upd();
      })
    );
    add(
      checkRow('Abre ao andar e atirar', x.dynamic, (v) => {
        x.dynamic = v;
        upd();
      })
    );
    add(gap(8));
    add(
      chip(
        'Restaurar padrão',
        false,
        () => {
          SAVE.xh = Object.assign({}, DEFAULT_XH);
          rerender();
        },
        { w: 170 }
      )
    );
  } else if (menuTab === 'opts') {
    add(sectionLabel('Dificuldade dos bots'));
    add(
      chipRow(
        Object.entries(DIFFS).map(([k, d]) => [k, d.label]),
        SAVE.diff,
        (v) => {
          SAVE.diff = v;
          DIFF = DIFFS[v];
          rerender();
        }
      )
    );
    add(sectionLabel('Seu nome'));
    {
      const inp = new GUI.InputText('name', SAVE.name);
      inp.width = '100%';
      inp.height = '40px';
      inp.color = PAL.text;
      inp.background = 'rgba(255,255,255,.04)';
      inp.focusedBackground = 'rgba(255,255,255,.08)';
      inp.fontFamily = FONT;
      inp.fontSize = 15;
      inp.thickness = 1;
      inp.maxWidth = '100%';
      inp.onTextChangedObservable.add(() => {
        SAVE.name = (inp.text || '').slice(0, 14).trim() || 'Você';
        persist();
      });
      add(inp);
    }
    add(gap(8));
    add(
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
    add(
      sliderRow(
        'Campo de visão (vertical)',
        60,
        90,
        1,
        SAVE.fov,
        (v) => String(Math.round(v)),
        (v) => {
          SAVE.fov = Math.round(v);
          persist();
        }
      )
    );
    add(
      sliderRow(
        'Volume',
        0,
        1,
        0.05,
        SAVE.vol,
        (v) => String(Math.round(v * 100)),
        (v) => {
          SAVE.vol = v;
          if (master) master.gain.value = v;
          persist();
        }
      )
    );
    add(
      sliderRow(
        'Opacidade do corpo da mira ao mirar',
        0.3,
        1,
        0.05,
        SAVE.sightOp == null ? 1 : SAVE.sightOp,
        (v) => Math.round(v * 100) + '%',
        (v) => {
          SAVE.sightOp = v;
          persist();
        }
      )
    );
    add(
      sliderRow(
        'Opacidade do ponto/retícula ao mirar',
        0.3,
        1,
        0.05,
        SAVE.dotOp == null ? 0.65 : SAVE.dotOp,
        (v) => Math.round(v * 100) + '%',
        (v) => {
          SAVE.dotOp = v;
          persist();
        }
      )
    );
    add(
      sliderRow(
        'Tamanho da arma',
        0.8,
        1.2,
        0.05,
        SAVE.vmSize,
        (v) => Math.round(v * 100) + '%',
        (v) => {
          SAVE.vmSize = v;
          persist();
        }
      )
    );
    add(sectionLabel('Qualidade gráfica'));
    add(
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
          rerender();
        }
      )
    );
    add(sectionLabel('Mão da arma'));
    add(
      chipRow(
        [
          ['right', 'Direita'],
          ['left', 'Esquerda'],
        ],
        SAVE.hand,
        (v) => {
          SAVE.hand = v;
          rerender();
        }
      )
    );
    add(gap(8));
    add(
      checkRow('Balanço da arma ao andar', SAVE.bob, (v) => {
        SAVE.bob = v;
        persist();
      })
    );
    add(
      checkRow('Mostrar FPS', SAVE.fps, (v) => {
        SAVE.fps = v;
        persist();
      })
    );
    add(sectionLabel('Controles'));
    for (const [k, d] of [
      ['WASD', 'mover'],
      ['Shift', 'correr'],
      ['Alt', 'andar devagar'],
      ['C', 'agachar (alterna)'],
      ['Q / E', 'inclinar (alterna)'],
      ['Espaço', 'escalar caixa'],
      ['Botão direito', 'mirar'],
      ['R', 'recarregar'],
      ['1 / 2 / roda', 'trocar arma'],
      ['G', 'equipamento'],
      ['V', 'coronhada'],
      ['F (segurar)', 'reforçar, plantar, desativar'],
      ['Tab', 'placar'],
      ['Esc', 'pausa'],
    ]) {
      const r = stack(false, { h: 24, spacing: 10 });
      r.addControl(text(k, { size: 12, mono: true, width: '130px' }));
      r.addControl(text(d, { size: 13, color: PAL.muted }));
      add(r);
    }
  }
  refreshShow();
}
