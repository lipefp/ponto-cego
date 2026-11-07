/* =====================================================================
   FLUXO DE PARTIDA (estilo Rainbow Six): JOGAR → procurando partida → sorteio de mapa →
   seleção de operador/armas (aba Operadores) → escolha do ponto de entrada (ataque) ou
   do local da bomba (defesa) → começa. Tudo em Babylon GUI sobre o menu 3D.
   ===================================================================== */
function flowRadar() {
  const sk = G.siteKey;
  G.siteKey = '';
  const u = radarUrl();
  G.siteKey = sk;
  return u;
}
const FLOW = {
  step: null,
  timers: [],
  box: null,
  pickZone: null,
  pickSite: null,
  mode: null,
  side: null,
  swap: false,
  t: 0,
};
const flowAtk = () => (FLOW.side || SAVE.startSide) === 'atk';
const PICK_T = 30; /* segundos para escolher entre rodadas */
const MAP_POOL = [
  { id: 'office', name: 'Prédio de Escritórios', sub: 'Bomba · 2 pavimentos', ok: true },
  { id: 'hangar', name: 'Hangar Industrial', sub: 'Em breve', ok: false },
  { id: 'embassy', name: 'Consulado', sub: 'Em breve', ok: false },
];
function flowClear() {
  for (const t of FLOW.timers) clearTimeout(t);
  FLOW.timers = [];
  if (FLOW.box) {
    uiLobby.removeControl(FLOW.box);
    FLOW.box.dispose();
    FLOW.box = null;
  }
}
function flowLater(fn, ms) {
  const t = setTimeout(() => {
    FLOW.timers = FLOW.timers.filter((x) => x !== t);
    fn();
  }, ms);
  FLOW.timers.push(t);
  return t;
}
/* cabeçalho da seleção de operador: ATQ n · tempo · n DEF (guia v2.0) */
function flowHeader(show) {
  if (!LB.hdr) {
    const r = rect({ w: 560, h: 48, va: VT, bg: 'transparent' });
    r.top = '76px';
    r.isHitTestVisible = false;
    const st = stack(false, { h: 48, spacing: 8 });
    st.horizontalAlignment = HC;
    r.addControl(st);
    LB.hdrS = st;
    uiLobby.addControl(r);
    LB.hdr = r;
  }
  LB.hdr.isVisible = !!show;
  if (!show) return;
  const st = LB.hdrS;
  st.clearControls();
  const atkSide = (FLOW.side || SAVE.startSide) === 'atk';
  const sa = atkSide ? teams.A.score : teams.B.score,
    sd = atkSide ? teams.B.score : teams.A.score;
  const pips = (n) => {
    const r = stack(false, { h: 48, spacing: 3 });
    for (let i = 0; i < 5; i++) {
      const q = rect({
        w: 14,
        h: 14,
        bg: i < n ? PAL.text : 'transparent',
        border: 1,
        borderColor: '#9ba1a7',
      });
      r.addControl(q);
    }
    return r;
  };
  st.addControl(pips(sa));
  const ta = chamfer({ w: 64, h: 30, bg: PAL.atk, flip: true });
  ta.addControl(
    text('ATQ ' + sa, {
      size: 16,
      weight: '700',
      color: '#0a0b0d',
      align: 'center',
      width: '100%',
      h: 24,
    })
  );
  st.addControl(ta);
  const mid = stack(true, { w: '84px' });
  const t = FLOW.mode === 'round' ? Math.max(0, Math.ceil(FLOW.t)) : 0;
  mid.addControl(
    text(FLOW.mode === 'round' ? Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0') : '—', {
      size: 24,
      weight: '600',
      align: 'center',
      width: '100%',
      h: 28,
    })
  );
  mid.addControl(
    text('RODADA ' + (G.round + (FLOW.mode === 'round' ? 1 : 1)), {
      size: 9,
      color: PAL.muted,
      spacing: '2px',
      align: 'center',
      width: '100%',
      h: 12,
    })
  );
  st.addControl(mid);
  const td = chamfer({ w: 64, h: 30, bg: PAL.def });
  td.addControl(
    text(sd + ' DEF', {
      size: 16,
      weight: '700',
      color: '#0a0b0d',
      align: 'center',
      width: '100%',
      h: 24,
    })
  );
  st.addControl(td);
  st.addControl(pips(sd));
}
function flowRestorePlay() {
  flowHeader(false);
  LB.play.isVisible = true;
  layoutLobby();
  LB.play.lbl.text = 'JOGAR';
  if (LB.play.sub) LB.play.sub.text = 'Bomba · Prédio de Escritórios';
  LB.play.onPointerUpObservable.clear();
  LB.play.onPointerUpObservable.add(() => {
    playSound('ui');
    flowStart();
  });
}
function flowLeave() {
  clearInterval(FLOW.rt);
  flowClear();
  FLOW.step = null;
  FLOW.mode = null;
  flowRestorePlay();
  toMenu();
}
function flowCancel() {
  flowClear();
  FLOW.step = null;
  flowRestorePlay();
  renderMenu();
}
function flowShell(title, sub) {
  flowClear();
  flowHeader(false);
  const box = rect({ w: '100%', h: '100%', bg: '#0a0b0d', block: true });
  uiLobby.addControl(box);
  FLOW.box = box;
  LB.play.isVisible = false;
  const col = stack(true, { w: '100%', h: '100%' });
  col.paddingTop = '70px';
  col.paddingLeft = '5%';
  col.paddingRight = '5%';
  box.addControl(col);
  {
    const ey = eyebrow(sub || '');
    ey.color = PAL.acc;
    col.addControl(ey);
  }
  col.addControl(disp(title, { size: 44, h: 62, upper: true, spacing: '6px' }));
  col.addControl(gap(14));
  const cancel = chip(
    FLOW.mode === 'round' ? 'Sair da partida' : 'Cancelar',
    false,
    () => (FLOW.mode === 'round' ? flowLeave() : flowCancel()),
    { w: FLOW.mode === 'round' ? 170 : 120, h: 34, fs: 12 }
  );
  cancel.horizontalAlignment = HR;
  cancel.verticalAlignment = VT;
  cancel.top = '24px';
  cancel.left = '-24px';
  box.addControl(cancel);
  return col;
}
/* 1 · procurando partida */
function flowStart() {
  initAudio();
  if (AC && AC.state === 'suspended') AC.resume();
  FLOW.pickZone = null;
  FLOW.pickSite = null;
  G.pick.zone = null;
  G.pick.site = null;
  const col = flowShell(
    'Procurando partida',
    'Bomba · 5 contra 5 · bots ' + (DIFFS[SAVE.diff] ? DIFFS[SAVE.diff].label : '')
  );
  FLOW.step = 'search';
  const st = text('Conectando…', { size: 18, color: PAL.muted, h: 30 });
  col.addControl(st);
  const tm = text('00:00', { size: 46, weight: '700', mono: true, h: 64 });
  col.addControl(tm);
  const t0 = performance.now();
  let n = 0;
  const tick = () => {
    if (FLOW.step !== 'search') return;
    n++;
    const s = Math.floor((performance.now() - t0) / 1000);
    tm.text = '00:' + String(s).padStart(2, '0');
    st.text = 'Procurando jogadores' + '.'.repeat(1 + (n % 3));
    flowLater(tick, 350);
  };
  tick();
  flowLater(
    () => {
      if (FLOW.step !== 'search') return;
      st.text = 'Partida encontrada';
      st.color = PAL.ally;
      playSound('ping');
    },
    2300 + Math.random() * 900
  );
  flowLater(
    () => {
      if (FLOW.step === 'search') flowMap();
    },
    3600 + Math.random() * 600
  );
}
/* 2 · sorteio de mapa */
function flowMap() {
  const col = flowShell('Sorteio de mapa', 'Partida encontrada');
  FLOW.step = 'map';
  const row = stack(false, { h: 210, spacing: 16 });
  col.addControl(row);
  const cards = [];
  for (const m of MAP_POOL) {
    const c = rect({
      w: 300,
      h: 200,
      bg: 'rgba(255,255,255,.03)',
      border: 2,
      borderColor: 'rgba(155,161,167,.2)',
    });
    if (m.ok) {
      const im = new GUI.Image('mp', flowRadar());
      im.width = '96%';
      im.height = '64%';
      im.verticalAlignment = VT;
      im.top = '8px';
      im.stretch = GUI.Image.STRETCH_UNIFORM;
      c.addControl(im);
    } else
      c.addControl(
        text('?', {
          size: 70,
          weight: '700',
          color: 'rgba(155,161,167,.18)',
          align: 'center',
          width: '100%',
          h: 110,
        })
      );
    const tx = stack(true, { w: '100%' });
    tx.verticalAlignment = VB;
    tx.paddingLeft = '12px';
    tx.paddingBottom = '10px';
    tx.addControl(text(m.name, { size: 16, weight: '700', h: 22 }));
    tx.addControl(text(m.sub, { size: 11, color: PAL.muted, h: 16 }));
    c.addControl(tx);
    row.addControl(c);
    cards.push(c);
  }
  const msg = text('Sorteando…', { size: 18, color: PAL.muted, h: 40 });
  col.addControl(gap(16));
  col.addControl(msg);
  const win = MAP_POOL.findIndex((m) => m.ok);
  let i = 0,
    delay = 70,
    steps = 0;
  const total = 12 + ((win - (12 % 3) + 3) % 3); /* termina em cima do mapa disponível */
  const spin = () => {
    if (FLOW.step !== 'map') return;
    cards.forEach((c, k) => {
      c.color = k === i % 3 ? PAL.text : '#2a2e33';
      c.background = k === i % 3 ? 'rgba(155,161,167,.08)' : 'rgba(255,255,255,.03)';
    });
    playSound('ui');
    if (steps >= total && i % 3 === win) {
      cards[win].color = PAL.acc;
      msg.text = 'Mapa: ' + MAP_POOL[win].name;
      msg.color = PAL.text;
      playSound('ping');
      flowLater(() => {
        if (FLOW.step === 'map') flowCoin();
      }, 1500);
      return;
    }
    i++;
    steps++;
    delay += steps > 10 ? 22 : 4;
    flowLater(spin, delay);
  };
  spin();
}
/* 2b · sorteio de lado (como no Siege: o sistema decide; quem perde o sorteio escolhe o lado na prorrogação) */
function flowCoin() {
  const col = flowShell('Sorteio de lados', 'Mapa definido');
  FLOW.step = 'coin';
  const row = stack(false, { h: 150, spacing: 16 });
  col.addControl(row);
  const cards = [];
  for (const [side, l, cl] of [
    ['atk', 'ATAQUE', PAL.atk],
    ['def', 'DEFESA', PAL.def],
  ]) {
    const c = rect({
      w: 300,
      h: 140,
      bg: 'rgba(255,255,255,.03)',
      border: 2,
      borderColor: '#2a2e33',
    });
    c.addControl(
      disp(l, { size: 40, align: 'center', width: '100%', h: 54, color: cl, spacing: '6px' })
    );
    row.addControl(c);
    cards.push(c);
  }
  const msg = text('Sorteando…', { size: 20, color: PAL.muted, h: 40 });
  col.addControl(gap(16));
  col.addControl(msg);
  const win = Math.random() < 0.5 ? 'atk' : 'def',
    wi = win === 'atk' ? 0 : 1;
  let i = 0,
    steps = 0;
  const total = 10 + ((wi - (10 % 2) + 2) % 2);
  const spin = () => {
    if (FLOW.step !== 'coin') return;
    cards.forEach((c, k) => {
      c.color = k === i % 2 ? PAL.text : '#2a2e33';
      c.background = k === i % 2 ? 'rgba(155,161,167,.08)' : 'rgba(255,255,255,.03)';
    });
    playSound('ui');
    if (steps >= total && i % 2 === wi) {
      SAVE.startSide = win;
      FLOW.side = win;
      persist();
      cards[wi].color = win === 'atk' ? PAL.atk : PAL.def;
      msg.text = 'Você começa no ' + (win === 'atk' ? 'ATAQUE' : 'DEFESA');
      msg.color = PAL.text;
      playSound('ping');
      flowLater(() => {
        if (FLOW.step === 'coin') flowBan(flowOps);
      }, 1600);
      return;
    }
    i++;
    steps++;
    flowLater(spin, steps > 8 ? 240 : 110);
  };
  spin();
}
/* 2c · banimento (R6): cada equipe bane um operador do lado oposto; tela isolada, sem acesso ao menu */
const BAN_ON = () =>
  window.__pcBan === true; /* banimento só no multiplayer/ranked (contra bots fica desligado) */
function flowBan(next) {
  if (!BAN_ON()) {
    G.bans = { atk: null, def: null };
    next();
    return;
  }
  const S = FLOW.side || SAVE.startSide,
    O = S === 'atk' ? 'def' : 'atk';
  G.bans = { atk: null, def: null };
  const col = flowShell(
    'Banimento de operador',
    'Bani um ' +
      (O === 'atk' ? 'atacante' : 'defensor') +
      ' do adversário · ele não poderá ser usado nesta metade'
  );
  FLOW.step = 'ban';
  let sel = null;
  const row = stack(false, { h: 112, spacing: 10 });
  col.addControl(row);
  const tiles = [];
  const msg = text('Escolha quem banir.', { size: 18, color: PAL.muted, h: 40 });
  const go = bigButton(
    'BANIR',
    null,
    () => {
      if (!sel || FLOW.step !== 'ban') return;
      playSound('ui');
      G.bans[O] = sel;
      const mine = OPS[S].filter((o) => o.id !== (S === 'atk' ? SAVE.atkOp : SAVE.defOp)),
        bot = mine[(Math.random() * mine.length) | 0];
      G.bans[S] = bot.id;
      if ((S === 'atk' ? SAVE.atkOp : SAVE.defOp) === bot.id) {
      } /* o bot só bane quem você não escolheu; o jogador ainda pode mudar na seleção */
      tiles.forEach((t) => (t.isEnabled = false));
      go.isVisible = false;
      msg.text = 'Você baniu ' + opById(sel).name + ' · o adversário baniu ' + bot.name;
      msg.color = PAL.text;
      playSound('ping');
      flowLater(() => {
        if (FLOW.step === 'ban') next();
      }, 2200);
    },
    { w: 260, h: 64 }
  );
  go.isEnabled = false;
  go.alpha = 0.4;
  go.horizontalAlignment = HA;
  for (const o of OPS[O]) {
    const t = rect({ w: 104, h: 104, bg: '#121416', border: 2, borderColor: '#2a2e33' });
    t.isPointerBlocker = true;
    t.hoverCursor = 'pointer';
    const im = new GUI.Image('bi', gIcon(o.gadget, '#f1f2f3'));
    im.width = '46px';
    im.height = '46px';
    im.verticalAlignment = VT;
    im.top = '12px';
    t.addControl(im);
    const nm = text(o.name, { size: 14, weight: '700', align: 'center', width: '100%', h: 20 });
    nm.verticalAlignment = VB;
    nm.top = '-10px';
    t.addControl(nm);
    const choose = () => {
      if (FLOW.step !== 'ban' || !t.isEnabled) return;
      sel = o.id;
      playSound('ui');
      tiles.forEach((q) => {
        q.borderColor = q === t ? PAL.acc : '#2a2e33';
        q.background = q === t ? '#2a1d12' : '#121416';
      });
      go.isEnabled = true;
      go.alpha = 1;
      msg.text = o.name + ' · ' + o.role;
      msg.color = PAL.text;
    };
    t.onPointerUpObservable.add(choose);
    t.__choose = choose;
    row.addControl(t);
    tiles.push(t);
  }
  col.addControl(gap(14));
  col.addControl(msg);
  col.addControl(gap(10));
  col.addControl(go);
  FLOW.ban = { tiles, go, n: tiles.length }; /* alça para os testes */
}
/* prorrogação: o time que começou na defesa (perdeu o sorteio) escolhe o lado da rodada decisiva */
function flowOT(cb) {
  if (SAVE.startSide === 'def') {
    const col = flowShell('Prorrogação', 'Rodada decisiva · 3 a 3');
    FLOW.step = 'ot';
    col.addControl(
      text('Seu time perdeu o sorteio inicial: escolha o lado.', {
        size: 18,
        color: PAL.muted,
        h: 34,
      })
    );
    col.addControl(gap(10));
    const row = stack(false, { h: 84, spacing: 16 });
    for (const [side, l, bg] of [
      ['atk', 'ATAQUE', PAL.atk],
      ['def', 'DEFESA', PAL.def],
    ])
      row.addControl(
        bigButton(
          l,
          null,
          () => {
            G.otRoleA = side;
            playSound('ui');
            cb();
          },
          { w: 260, h: 76, bg, fg: '#0a0b0d' }
        )
      );
    col.addControl(row);
  } else {
    const col = flowShell('Prorrogação', 'Rodada decisiva · 3 a 3');
    FLOW.step = 'ot';
    const pick = Math.random() < 0.5 ? 'atk' : 'def';
    G.otRoleA = pick === 'atk' ? 'def' : 'atk';
    col.addControl(
      text(
        'O adversário perdeu o sorteio e escolheu ' +
          (pick === 'atk' ? 'ATAQUE' : 'DEFESA') +
          '. Você será ' +
          (G.otRoleA === 'atk' ? 'ATAQUE' : 'DEFESA') +
          '.',
        { size: 18, color: PAL.text, h: 34 }
      )
    );
    flowLater(() => {
      if (FLOW.step === 'ot') cb();
    }, 2800);
  }
}
/* 3 · seleção de operador e armas (aba Operadores, com botão de confirmar) */
function flowOps() {
  flowClear();
  FLOW.step = 'ops';
  menuTab = 'ops';
  opsSide = FLOW.side || SAVE.startSide;
  {
    const bn = G.bans[opsSide],
      cur = opsSide === 'atk' ? SAVE.atkOp : SAVE.defOp;
    if (bn && cur === bn) {
      const o = OPS[opsSide].find((x) => x.id !== bn);
      if (opsSide === 'atk') SAVE.atkOp = o.id;
      else SAVE.defOp = o.id;
    }
  }
  showKey = '';
  renderMenu();
  LB.play.isVisible = true;
  LB.play.lbl.text = 'CONFIRMAR ›';
  if (LB.play.sub) LB.play.sub.text = 'Escolha seu operador e armas';
  LB.play.onPointerUpObservable.clear();
  LB.play.onPointerUpObservable.add(() => {
    playSound('ui');
    flowSpawn();
  });
  layoutLobby();
  flowHeader(true);
}
/* 4 · ponto de entrada (ataque) ou local da bomba (defesa) */
function flowSpawn() {
  const atk = flowAtk();
  const col = flowShell(
    atk ? 'Ataque · onde vocês entram' : 'Defesa · onde fica a bomba',
    atk
      ? 'Clique em um dos pontos de entrada do mapa'
      : 'Clique no objetivo que a sua equipe vai defender'
  );
  FLOW.step = 'spawn';
  FLOW.clock = null;
  if (FLOW.mode === 'round') {
    FLOW.t = 20;
    FLOW.clock = disp('0:20', { size: 56, h: 70, align: 'right', width: '200px', spacing: '0px' });
    FLOW.clock.horizontalAlignment = HR;
    FLOW.clock.verticalAlignment = VT;
    FLOW.clock.top = '56px';
    FLOW.clock.left = '-24px';
    FLOW.box.addControl(FLOW.clock);
  }
  const sc = 3,
    pw = W * RS * sc,
    ph = H * RS * sc;
  const wrap = rect({ w: pw, h: ph, border: 1, borderColor: '#454b52', bg: '#0f1113' });
  wrap.horizontalAlignment = HA;
  col.addControl(wrap);
  const im = new GUI.Image('rm', flowRadar());
  im.width = pw + 'px';
  im.height = ph + 'px';
  im.stretch = GUI.Image.STRETCH_FILL;
  wrap.addControl(im);
  const go = bigButton(
    'COMEÇAR',
    atk ? 'Selecione um ponto' : 'Selecione um objetivo',
    () => flowGo(),
    { w: 300, h: 76 }
  );
  go.horizontalAlignment = HR;
  go.verticalAlignment = VB;
  go.left = '-24px';
  go.top = '-24px';
  go.isEnabled = false;
  go.alpha = 0.4;
  FLOW.box.addControl(go);
  const refresh = () => {
    const ok = atk ? FLOW.pickZone != null : FLOW.pickSite != null;
    go.isEnabled = ok;
    go.alpha = ok ? 1 : 0.4;
    go.sub.text = ok
      ? atk
        ? ATK_NAMES[FLOW.pickZone]
        : 'Objetivo ' + FLOW.pickSite + ' · ' + SITES[FLOW.pickSite].name
      : atk
        ? 'Selecione um ponto'
        : 'Selecione um objetivo';
  };
  FLOW.refresh = refresh;
  const pins = [],
    opts = [];
  const side = stack(true, { w: 360, spacing: 8 });
  side.horizontalAlignment = HA;
  side.verticalAlignment = VT;
  side.left = pw + 110 + 'px';
  side.top = '150px';
  FLOW.box.addControl(side);
  const upd = () => {
    pins.forEach((p) => p());
    refresh();
  };
  const add = (x, z, w, h, letter, name, sub, on, sel) => {
    const b = rect({
      w: Math.max(w, 34),
      h: Math.max(h, 26),
      bg: 'rgba(241,242,243,.06)',
      border: 1,
      borderColor: '#9ba1a7',
    });
    b.horizontalAlignment = HA;
    b.verticalAlignment = VT;
    b.left = Math.round(x - Math.max(w, 34) / 2) + 'px';
    b.top = Math.round(z - Math.max(h, 26) / 2) + 'px';
    b.isPointerBlocker = true;
    b.hoverCursor = 'pointer';
    {
      const lb = rect({ w: 26, h: 26, bg: '#0a0b0d', border: 2, borderColor: PAL.text });
      lb.addControl(
        text(letter, { size: 16, weight: '700', align: 'center', width: '100%', h: 22 })
      );
      lb.horizontalAlignment = HA;
      lb.verticalAlignment = VT;
      lb.left = '6px';
      lb.top = '6px';
      b.addControl(lb);
    }
    const card = rect({ w: '100%', h: 64, bg: '#121416', border: 1, borderColor: '#2a2e33' });
    card.isPointerBlocker = true;
    card.hoverCursor = 'pointer';
    const cs = stack(true, { w: '100%' });
    cs.paddingLeft = '14px';
    cs.verticalAlignment = VC;
    cs.addControl(text(letter + ' · ' + name, { size: 16, weight: '700', h: 24 }));
    cs.addControl(text(sub, { size: 11, color: PAL.muted, h: 16 }));
    card.addControl(cs);
    side.addControl(card);
    const pick = () => {
      playSound('ui');
      on();
      upd();
    };
    b.onPointerUpObservable.add(pick);
    card.onPointerUpObservable.add(pick);
    pins.push(() => {
      const on = sel();
      b.background = on ? 'rgba(232,129,47,.55)' : 'rgba(241,242,243,.06)';
      b.borderColor = on ? PAL.acc : '#9ba1a7';
      b.thickness = on ? 2 : 1;
      card.background = on ? '#171a1e' : '#121416';
      card.borderColor = on ? PAL.acc : '#2a2e33';
    });
    wrap.addControl(b);
  };
  const subs = [
    'Entrada pelo canto norte, perto do corredor da frente',
    'Entrada pelo canto sul, com visão dos fundos',
    'Entrada pelo lado oeste, perto do escritório A',
  ];
  if (atk)
    ATK_SPAWNS.forEach((r, i) => {
      add(
        (r.x0 + (r.x1 - r.x0 + 1) / 2) * RS * sc,
        (r.z0 + (r.z1 - r.z0 + 1) / 2) * RS * sc,
        (r.x1 - r.x0 + 1) * RS * sc,
        (r.z1 - r.z0 + 1) * RS * sc,
        String.fromCharCode(65 + i),
        ATK_NAMES[i].replace('Entrada ', 'Entrada '),
        subs[i],
        () => {
          FLOW.pickZone = i;
        },
        () => FLOW.pickZone === i
      );
    });
  else
    for (const k of SITE_KEYS) {
      const S = SITES[k];
      add(
        (S.x0 + (S.x1 - S.x0 + 1) / 2) * RS * sc,
        (S.z0 + (S.z1 - S.z0 + 1) / 2) * RS * sc,
        (S.x1 - S.x0 + 1) * RS * sc,
        (S.z1 - S.z0 + 1) * RS * sc,
        k,
        S.name,
        'Objetivo ' + k + ' · a defesa reforça e segura aqui',
        () => {
          FLOW.pickSite = k;
        },
        () => FLOW.pickSite === k
      );
    }
  upd();
  const rnd = chip(
    atk ? 'Aleatório' : 'Deixar a equipe decidir',
    false,
    () => {
      if (atk) FLOW.pickZone = null;
      else FLOW.pickSite = null;
      FLOW.box && flowGo(true);
    },
    { w: 220, h: 34, fs: 12 }
  );
  rnd.horizontalAlignment = HA;
  rnd.verticalAlignment = VB;
  rnd.left = '5%';
  rnd.top = '-24px';
  FLOW.box.addControl(rnd);
}
function flowGo() {
  G.pick.zone = FLOW.pickZone;
  G.pick.site = FLOW.pickSite;
  flowClear();
  FLOW.step = null;
  clearInterval(FLOW.rt);
  flowRestorePlay();
  if (FLOW.mode === 'round') {
    FLOW.mode = null;
    resumeRound(FLOW.swap);
    return;
  }
  G.pickBetween = true; /* a partir daqui, operador/ponto são escolhidos a cada rodada */
  startMatch();
}
/* entre rodadas: mesma tela de operador e ponto, agora com contagem regressiva; esgotou = confirma o que está marcado */
function flowRound(swap) {
  if (swap && !FLOW.banned) {
    FLOW.mode = 'round';
    FLOW.side = nextRoleOf(player.team);
    FLOW.banned = true;
    flowBan(() => flowRound(swap));
    return;
  }
  FLOW.banned = false;
  if (
    G.round + 1 === 2 * SWAP_AFTER + 1 &&
    !G.otRoleA &&
    teams.A.score === SWAP_AFTER &&
    teams.B.score === SWAP_AFTER
  ) {
    FLOW.mode = 'round';
    flowOT(() => flowRound(swap));
    return;
  }
  FLOW.mode = 'round';
  FLOW.swap = !!swap;
  FLOW.side = nextRoleOf(player.team);
  FLOW.pickZone = null;
  FLOW.pickSite = null;
  G.pick.zone = null;
  G.pick.site = null;
  flowOps();
  FLOW.t = PICK_T;
  const title = `Rodada ${G.round + 1} · ${FLOW.side === 'atk' ? 'Ataque' : 'Defesa'}${swap ? ' · troca de lado' : ''}`;
  clearInterval(
    FLOW.rt
  ); /* o relógio não pode ser um flowLater: flowClear apaga esses ao trocar de tela */
  FLOW.rt = setInterval(() => {
    if (FLOW.mode !== 'round') {
      clearInterval(FLOW.rt);
      return;
    }
    FLOW.t--;
    if (FLOW.t <= 0) {
      if (FLOW.step === 'ops') {
        flowSpawn();
        FLOW.t = 20;
      } else if (FLOW.step === 'spawn') {
        flowGo();
        return;
      }
    }
    if (FLOW.step === 'ops') {
      LB.play.lbl.text = 'CONFIRMAR ›';
      flowHeader(true);
    }
    if (FLOW.step === 'spawn' && FLOW.clock)
      FLOW.clock.text = '0:' + String(Math.max(0, Math.ceil(FLOW.t))).padStart(2, '0');
  }, 1000);
  if (LB.play.sub) LB.play.sub.text = title + ' · ' + FLOW.t + ' s';
}
(function hookPlay() {
  LB.play.onPointerUpObservable.clear();
  LB.play.onPointerUpObservable.add(() => {
    playSound('ui');
    flowStart();
  });
})();
