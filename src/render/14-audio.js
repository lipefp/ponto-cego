/* =====================================================================
   ÁUDIO v3 — síntese procedural em camadas (WebAudio) + banco de amostras opcional
   · Tiro: transiente (estalo) + corpo (ruído varrido) + soco grave (queda de tom) + sub + cauda,
     variação aleatória por tiro; suprimido (abafado, sem estalo); à distância (passa-baixa,
     atraso de propagação, eco do prédio). Mecânica: recarga/ferrolho/pump/troca/pino.
   · Passos por piso; mundo: vidro, parede, explosão, impactos por material, zunido, drone, bomba.
   · Espacialização: StereoPanner + atenuação + oclusão (passa-baixa), reverb por convolução
     (sala / corredor / ar livre) por send; master: ducking → compressor → soft-clip (nunca estoura).
   · Amostras: se existirem assets/au_*.wav|ogg|mp3 (ou au_bank.bin) elas substituem a síntese
     correspondente (ver README.md, seção Áudio). Sem amostras = tudo sintetizado.
   ===================================================================== */
let AC = null,
  master = null,
  amb = null,
  AX = null;
const BANK = {}; /* nome (sem número/extensão) → [AudioBuffer] */
const aRr = (a, b) => a + Math.random() * (b - a);
const AUCACHE = {}; /* ruído e respostas de impulso por taxa de amostragem (gerados uma vez) */
/* resposta de impulso: ruído com decaimento, amortecimento crescente (agudos somem primeiro) e reflexões iniciais */
function makeIRData(sr, sec, decay, damp, early, flutter) {
  const n = Math.floor(sr * sec),
    L = [new Float32Array(n), new Float32Array(n)];
  for (let c = 0; c < 2; c++) {
    const d = L[c];
    let lp = 0;
    const pre = Math.floor(sr * 0.004);
    for (let i = pre; i < n; i++) {
      const t = i / n,
        k = 0.85 - (0.85 - damp) * Math.pow(t, 0.5);
      lp += (Math.random() * 2 - 1 - lp) * k;
      d[i] = lp * Math.pow(1 - t, decay) * (i - pre < sr * 0.012 ? (i - pre) / (sr * 0.012) : 1);
    }
    for (const [at, g] of early) {
      const i = Math.floor(at * sr * (c ? 1.07 : 1));
      if (i < n) d[i] += g * (Math.random() < 0.5 ? -1 : 1);
    }
    if (flutter) {
      for (let k = 1; k < 9; k++) {
        const i = Math.floor(flutter * k * sr * (c ? 1.05 : 1));
        if (i < n) d[i] += 0.5 * Math.pow(0.72, k) * (c ? -1 : 1);
      }
    }
  }
  return L;
}
function buildGraph(ctx, full, raw) {
  const sr = ctx.sampleRate,
    X = { ctx, sr };
  if (!AUCACHE[sr]) {
    const nb = new Float32Array(sr * 4);
    for (let i = 0; i < nb.length; i++) nb[i] = Math.random() * 2 - 1;
    AUCACHE[sr] = {
      noise: nb,
      room: makeIRData(sr, 0.5, 3.4, 0.18, [
        [0.006, 0.55],
        [0.011, 0.45],
        [0.017, 0.35],
        [0.024, 0.28],
        [0.033, 0.2],
      ]),
      hall: makeIRData(
        sr,
        1.1,
        3,
        0.14,
        [
          [0.012, 0.45],
          [0.021, 0.4],
          [0.034, 0.3],
        ],
        0.0185
      ),
      out: makeIRData(sr, 2.4, 4.6, 0.08, [
        [0.09, 0.3],
        [0.21, 0.2],
        [0.38, 0.12],
        [0.6, 0.07],
      ]),
    };
  }
  const C = AUCACHE[sr],
    nb = ctx.createBuffer(1, C.noise.length, sr);
  nb.copyToChannel(C.noise, 0);
  X.noise = nb;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 12;
  comp.ratio.value = 4;
  comp.attack.value = 0.003;
  comp.release.value = 0.22;
  /* soft-clip: linear até 0,6, depois comprime suavemente para no máximo ~0,85 (−1,4 dBFS) */
  const sat = ctx.createWaveShaper(),
    cv = new Float32Array(2049);
  for (let i = 0; i < cv.length; i++) {
    const x = i / 1024 - 1,
      a = Math.abs(x);
    cv[i] = Math.sign(x) * (a < 0.6 ? a : 0.6 + 0.26 * Math.tanh((a - 0.6) / 0.26));
  }
  sat.curve = cv;
  const duck = ctx.createGain();
  X.duck = duck;
  X.master = ctx.createGain();
  X.master.gain.value = typeof SAVE !== 'undefined' ? SAVE.vol : 0.6;
  X.master.connect(duck);
  if (raw) {
    duck.connect(ctx.destination);
  } else {
    duck.connect(comp);
    comp.connect(sat);
    sat.connect(ctx.destination);
  }
  X.rev = {};
  for (const [k, vol, lp] of [
    ['room', 0.4, 5200],
    ['hall', 0.42, 4200],
    ['out', 0.36, 2600],
  ]) {
    const cvl = ctx.createConvolver(),
      b = ctx.createBuffer(2, C[k][0].length, sr);
    b.copyToChannel(C[k][0], 0);
    b.copyToChannel(C[k][1], 1);
    cvl.buffer = b;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lp;
    const g = ctx.createGain();
    g.gain.value = vol;
    cvl.connect(f);
    f.connect(g);
    g.connect(X.master);
    X.rev[k] = { input: cvl };
  }
  /* "ring": parciais inarmônicos de 1 kHz com queda (tocado com playbackRate = f/1000): cliques, cápsulas, vidro, chapa */
  const rb = ctx.createBuffer(1, Math.floor(sr * 0.4), sr),
    rd = rb.getChannelData(0);
  for (let i = 0; i < rd.length; i++) {
    const t = i / sr;
    rd[i] =
      (Math.sin(6.2832 * 1000 * t) * Math.exp(-t * 14) +
        0.5 * Math.sin(6.2832 * 2410 * t) * Math.exp(-t * 22) +
        0.3 * Math.sin(6.2832 * 4170 * t) * Math.exp(-t * 34)) *
      Math.min(1, i / (sr * 0.0004));
  }
  X.ringBuf = rb;
  X.act = [];
  return X;
}
function initAudio() {
  if (AC) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    AX = buildGraph(AC, true);
    master = AX.master;
    startAmbience();
    loadBank();
  } catch (e) {
    AC = null;
    AX = null;
    master = null;
  }
}
/* ---------------- banco de amostras opcional ---------------- */
function bankAdd(name, u8) {
  if (!AC || !AC.decodeAudioData) return;
  const key = name
    .replace(/^au_/, '')
    .replace(/\.(wav|ogg|mp3|flac|m4a)$/i, '')
    .replace(/_\d+$/, '');
  const ab = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  const ok = (b) => {
      (BANK[key] = BANK[key] || []).push(b);
      if (key === 'amb_wind') windBed(b);
    },
    bad = () => {};
  try {
    const p = AC.decodeAudioData(ab, ok, bad);
    if (p && p.catch) p.catch(bad);
  } catch (e) {}
}
/* v4.5: vento ambiente (Ambient Wind Loop) como cama contínua baixa sob a síntese */
function windBed(b) {
  try {
    if (!AC || !master || (amb && amb.bed)) return;
    const s = AC.createBufferSource();
    s.buffer = b;
    s.loop = true;
    const f = AC.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;
    const g = AC.createGain();
    g.gain.value = 0.22;
    s.connect(f);
    f.connect(g);
    g.connect(master);
    s.start();
    if (amb) amb.bed = g;
  } catch (e) {}
}
function loadBank() {
  try {
    if (typeof ASSET_BYTES !== 'function' || typeof ASSET_FILE === 'undefined') return;
    const bank = ASSET_BYTES('au_bank.bin');
    if (bank && bank.length > 8) {
      const dv = new DataView(bank.buffer, bank.byteOffset, bank.byteLength),
        n = dv.getUint32(0, true),
        idx = JSON.parse(new TextDecoder().decode(bank.subarray(4, 4 + n))),
        base = 4 + n;
      for (const k in idx.files) {
        const [o, l] = idx.files[k];
        bankAdd(k, bank.subarray(base + o, base + o + l));
      }
    }
    for (const f of Object.keys(ASSET_FILE)) {
      if (/^au_.+\.(wav|ogg|mp3|flac|m4a)$/i.test(f)) {
        const u = ASSET_BYTES(f);
        if (u) bankAdd(f, u);
      }
    }
  } catch (e) {}
}
function samp(dst, t, key, vol, fx, pv) {
  const a = BANK[key];
  if (!a || !a.length) return false;
  const s = AC.createBufferSource();
  s.buffer = a[(Math.random() * a.length) | 0];
  s.playbackRate.value = Math.pow(2, aRr(-1, 1) * (pv == null ? 0.04 : pv));
  const g = AC.createGain();
  g.gain.value = vol * aRr(0.9, 1.1);
  s.connect(g);
  g.connect(dst);
  if (fx) g.connect(fx);
  s.start(t);
  return true;
}
/* ---------------- ambiente (laço contínuo) ---------------- */
function startAmbience() {
  const loop = (type, freq, q) => {
    const s = AC.createBufferSource();
    s.buffer = AX.noise;
    s.loop = true;
    const f = AC.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (q) f.Q.value = q;
    const g = AC.createGain();
    g.gain.value = 0;
    s.connect(f);
    f.connect(g);
    g.connect(master);
    s.start();
    return { g, f };
  };
  const hum = AC.createOscillator();
  hum.type = 'sawtooth';
  hum.frequency.value = 60;
  const hf = AC.createBiquadFilter();
  hf.type = 'lowpass';
  hf.frequency.value = 180;
  const hg = AC.createGain();
  hg.gain.value = 0;
  hum.connect(hf);
  hf.connect(hg);
  hg.connect(master);
  hum.start();
  /* drone: motor (dois serras desafinados) + zumbido de hélice; estática quando o sinal cai */
  const d1 = AC.createOscillator(),
    d2 = AC.createOscillator();
  d1.type = 'sawtooth';
  d2.type = 'square';
  d1.frequency.value = 95;
  d2.frequency.value = 191;
  const df = AC.createBiquadFilter();
  df.type = 'lowpass';
  df.frequency.value = 900;
  df.Q.value = 2;
  const dg = AC.createGain();
  dg.gain.value = 0;
  const d2g = AC.createGain();
  d2g.gain.value = 0.35;
  d1.connect(df);
  d2.connect(d2g);
  d2g.connect(df);
  df.connect(dg);
  dg.connect(master);
  d1.start();
  d2.start();
  amb = {
    wind: loop('bandpass', 420, 0.6).g,
    room: loop('lowpass', 260).g,
    hum: hg,
    fan: loop('bandpass', 1800, 2).g,
    stat: loop('highpass', 2500).g,
    prop: loop('bandpass', 2600, 3).g,
    droneG: dg,
    d1,
    d2,
    df,
    lastW: 0,
    beep: 0,
    actT: 0,
    droneSt: 0,
  };
}
const HK = {};
const auNow = () =>
  AC.currentTime +
  (AX.off || 0); /* off: só o teste offline usa (agenda sons em instantes diferentes) */
/* envolve um HOOK existente (ou cria) sem editar os arquivos dos outros donos */
function hookWrap(k, fn, need) {
  if (HK[k] || typeof HOOK === 'undefined') return;
  if (need && !(k in HOOK)) return;
  HK[k] = 1;
  const old = k in HOOK ? HOOK[k] : null;
  HOOK[k] = function () {
    try {
      fn.apply(null, arguments);
    } catch (e) {}
    return old ? old.apply(this, arguments) : undefined;
  };
}
function installHooks() {
  hookWrap(
    'winBroken',
    (w) => {
      if (AX) AX.glassT = AC.currentTime;
      let c = null;
      try {
        c = typeof winCenter === 'function' ? winCenter(w) : null;
      } catch (e) {}
      playSound('glass', c);
    },
    true
  );
  hookWrap('panelBroken', (w, i, pt) => playSound('wall', pt, { big: 0 }));
  hookWrap('wallChanged', (w, big, pt) => {
    if (big)
      playSound('wall', pt || (typeof wallCenter === 'function' ? wallCenter(w) : null), {
        big: 1,
      });
  });
  hookWrap('draw', (a) => {
    const me = a === player && !a.bot;
    playSound('draw', me ? null : a.pos, { w: ((typeof curW === 'function' && curW(a)) || {}).id });
  });
  hookWrap('throw', (a) => {
    const me = a === player && !a.bot;
    playSound('pin', me ? null : a.pos);
  });
  hookWrap('planted', (a) => playSound('plant', null));
  hookWrap('droneDestroyed', () => playSound('dronelost'));
  hookWrap('droneDeployed', () => playSound('dronego'));
  hookWrap('agentKilled', (v, att) => {
    if (v && v !== player && player && v.team === player.team) playSound('radio');
  });
}
/* ajuste contínuo (chamado a cada quadro): ambiente, drone, ações segurando F, mudo */
function audioTick() {
  if (!AC || !amb) return;
  const t = AC.currentTime,
    p = camera.position,
    ins = insideP(p),
    inGame = typeof G !== 'undefined' && G.phase && G.phase !== 'menu';
  installHooks();
  const mute = !!SAVE.mute,
    tv = mute ? 0 : SAVE.vol;
  if (amb.lastW !== tv) {
    amb.lastW = tv;
    master.gain.setTargetAtTime(tv, t, 0.03);
  }
  const room = ins ? roomOf(Math.floor(p.x / CELL), Math.floor(p.z / CELL)) : 'out',
    k = inGame ? 1 : 0;
  amb.wind.gain.setTargetAtTime((ins ? 0.006 : 0.035) * k, t, 0.4);
  amb.room.gain.setTargetAtTime((ins ? 0.02 : 0.006) * k, t, 0.4);
  amb.hum.gain.setTargetAtTime((room === 'servers' ? 0.012 : ins ? 0.002 : 0) * k, t, 0.4);
  amb.fan.gain.setTargetAtTime((room === 'servers' ? 0.012 : 0) * k, t, 0.4);
  /* drone */
  let dOn = 0,
    dLost = 0;
  if (
    typeof drone !== 'undefined' &&
    inGame &&
    G.phase === 'prep' &&
    player &&
    player.side === 'atk'
  ) {
    dOn = drone.active && drone.alive ? 1 : 0;
    dLost = drone.active && !drone.alive ? 1 : 0;
  }
  const sp = dOn ? Math.hypot(drone.vel.x, drone.vel.z) + Math.abs(drone.vy || 0) : 0;
  amb.droneG.gain.setTargetAtTime(dOn * (0.018 + Math.min(sp, 5) * 0.003), t, 0.15);
  amb.d1.frequency.setTargetAtTime(88 + sp * 9, t, 0.1);
  amb.d2.frequency.setTargetAtTime(176 + sp * 17, t, 0.1);
  amb.df.frequency.setTargetAtTime(700 + sp * 220, t, 0.1);
  amb.prop.gain.setTargetAtTime(dOn * (0.008 + Math.min(sp, 5) * 0.003), t, 0.15);
  amb.stat.gain.setTargetAtTime(dLost * 0.03, t, 0.1);
  if (dOn && t > amb.beep) {
    amb.beep = t + 2.2;
    tone(master, t, 0.05, 0.03, 'sine', 2100);
  }
  /* ações segurando F: reforçar (martelo/furadeira), plantar e desativar (cliques) */
  const a = player && player.act;
  if (a && t > amb.actT) {
    amb.actT = t + (a.kind === 'reinforce' ? 0.22 : 0.16);
    if (a.kind === 'reinforce') {
      nz(master, t, 0.05, 0.06, 'bandpass', 900 + aRr(-100, 100), 2);
      tone(master, t, 0.04, 0.04, 'triangle', 180, 120);
    } else {
      click(master, t, 0.05, 2400 + aRr(-200, 200));
      if (a.kind === 'defuse')
        tone(master, t + 0.02, 0.05, 0.025, 'square', 1500 + (a.t / a.hold) * 1200);
    }
  }
}
/* ---------------- primitivas ---------------- */
function nz(dst, t, dur, vol, type, freq, q, attack, fx, f1) {
  const s = AC.createBufferSource();
  s.buffer = AX.noise;
  const f = AC.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(Math.max(20, freq), t);
  if (f1) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  if (q) f.Q.value = q;
  const g = AC.createGain(),
    a = Math.min(attack || 0.002, dur * 0.5);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f);
  f.connect(g);
  g.connect(dst);
  if (fx) g.connect(fx);
  s.start(t, Math.random() * Math.max(0, AX.noise.duration - dur - 0.1));
  s.stop(t + dur + 0.03);
}
function tone(dst, t, dur, vol, type, f0, f1, fx) {
  const o = AC.createOscillator();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = AC.createGain(),
    a = Math.min(0.003, dur * 0.4);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(dst);
  if (fx) g.connect(fx);
  o.start(t);
  o.stop(t + dur + 0.02);
}
/* ressonância metálica (parciais inarmônicos com queda rápida): cliques, cápsulas, ping em chapa */
function auRing(dst, t, vol, f, dec, fx) {
  const s = AC.createBufferSource();
  s.buffer = AX.ringBuf;
  s.playbackRate.value = Math.max(0.05, f / 1000);
  const g = AC.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
  s.connect(g);
  g.connect(dst);
  if (fx) g.connect(fx);
  s.start(t);
  s.stop(t + dec + 0.02);
}
/* clique mecânico: ruído estreito + ressonância curta */
function click(dst, t, vol, f, fx) {
  f = f || 3500;
  nz(dst, t, 0.02, vol, 'bandpass', f, 5, 0.0008, fx);
  auRing(dst, t, vol * 0.4, f * 0.55, 0.05, fx);
}
/* ---------------- tabelas ---------------- */
/* c/cd/cv: estalo · m/md/mv: "estouro" médio · bf0→bf1/bd/bv: corpo · tf0→tf1/td/tv: soco · sub · tl/tl2/tf: cauda · rv: envio de reverb · mech: ferrolho · lv: nível */
const GUN = {
  pistol: {
    c: 4800,
    cd: 0.012,
    cv: 0.9,
    m: 2300,
    md: 0.035,
    mv: 0.7,
    bf0: 2200,
    bf1: 700,
    bd: 0.05,
    bv: 0.35,
    tf0: 230,
    tf1: 120,
    td: 0.045,
    tv: 0.2,
    sub: 0,
    tl: 0.2,
    tl2: 0.05,
    tf: 1500,
    rv: 0.22,
    mech: 4200,
    lv: 0.8,
  },
  mp: {
    c: 4400,
    cd: 0.012,
    cv: 0.85,
    m: 2100,
    md: 0.035,
    mv: 0.7,
    bf0: 2100,
    bf1: 650,
    bd: 0.05,
    bv: 0.35,
    tf0: 200,
    tf1: 105,
    td: 0.05,
    tv: 0.22,
    sub: 0,
    tl: 0.2,
    tl2: 0.05,
    tf: 1500,
    rv: 0.22,
    mech: 4300,
    lv: 0.75,
  },
  smg: {
    c: 3800,
    cd: 0.014,
    cv: 0.85,
    m: 1900,
    md: 0.045,
    mv: 0.75,
    bf0: 1800,
    bf1: 550,
    bd: 0.07,
    bv: 0.4,
    tf0: 170,
    tf1: 90,
    td: 0.065,
    tv: 0.3,
    sub: 0,
    tl: 0.24,
    tl2: 0.06,
    tf: 1400,
    rv: 0.26,
    mech: 3800,
    lv: 0.8,
  },
  smg45: {
    c: 3400,
    cd: 0.015,
    cv: 0.85,
    m: 1500,
    md: 0.05,
    mv: 0.8,
    bf0: 1600,
    bf1: 480,
    bd: 0.08,
    bv: 0.45,
    tf0: 150,
    tf1: 78,
    td: 0.075,
    tv: 0.3,
    sub: 0.05,
    tl: 0.28,
    tl2: 0.07,
    tf: 1300,
    rv: 0.28,
    mech: 3500,
    lv: 0.85,
  },
  pistol45: {
    c: 3600,
    cd: 0.015,
    cv: 0.9,
    m: 1300,
    md: 0.05,
    mv: 0.8,
    bf0: 1600,
    bf1: 450,
    bd: 0.08,
    bv: 0.45,
    tf0: 140,
    tf1: 70,
    td: 0.08,
    tv: 0.32,
    sub: 0.05,
    tl: 0.3,
    tl2: 0.07,
    tf: 1300,
    rv: 0.28,
    mech: 3900,
    lv: 0.9,
  },
  rifle556: {
    c: 3200,
    cd: 0.018,
    cv: 0.9,
    m: 1400,
    md: 0.06,
    mv: 1,
    bf0: 1500,
    bf1: 400,
    bd: 0.11,
    bv: 0.45,
    tf0: 120,
    tf1: 58,
    td: 0.1,
    tv: 0.34,
    sub: 0.1,
    tl: 0.42,
    tl2: 0.08,
    tf: 1200,
    rv: 0.34,
    mech: 3400,
    lv: 0.85,
  },
  rifle: {
    c: 3000,
    cd: 0.02,
    cv: 0.9,
    m: 1250,
    md: 0.07,
    mv: 1,
    bf0: 1400,
    bf1: 360,
    bd: 0.12,
    bv: 0.48,
    tf0: 110,
    tf1: 50,
    td: 0.11,
    tv: 0.36,
    sub: 0.12,
    tl: 0.46,
    tl2: 0.09,
    tf: 1100,
    rv: 0.36,
    mech: 3200,
    lv: 0.88,
  },
  lmg: {
    c: 3000,
    cd: 0.02,
    cv: 0.9,
    m: 1200,
    md: 0.07,
    mv: 1,
    bf0: 1400,
    bf1: 340,
    bd: 0.12,
    bv: 0.48,
    tf0: 105,
    tf1: 48,
    td: 0.12,
    tv: 0.36,
    sub: 0.14,
    tl: 0.48,
    tl2: 0.09,
    tf: 1050,
    rv: 0.36,
    mech: 2800,
    lv: 0.88,
  },
  battle: {
    c: 2700,
    cd: 0.022,
    cv: 0.95,
    m: 1000,
    md: 0.08,
    mv: 1.05,
    bf0: 1300,
    bf1: 300,
    bd: 0.14,
    bv: 0.52,
    tf0: 98,
    tf1: 44,
    td: 0.13,
    tv: 0.45,
    sub: 0.16,
    tl: 0.52,
    tl2: 0.1,
    tf: 1000,
    rv: 0.4,
    mech: 2900,
    lv: 0.8,
  },
  dmr: {
    c: 2600,
    cd: 0.024,
    cv: 1,
    m: 900,
    md: 0.09,
    mv: 1.05,
    bf0: 1200,
    bf1: 260,
    bd: 0.16,
    bv: 0.55,
    tf0: 88,
    tf1: 38,
    td: 0.15,
    tv: 0.5,
    sub: 0.18,
    tl: 0.6,
    tl2: 0.1,
    tf: 950,
    rv: 0.42,
    mech: 3000,
    lv: 0.82,
  },
  rev: {
    c: 3000,
    cd: 0.02,
    cv: 1,
    m: 1000,
    md: 0.08,
    mv: 1.05,
    bf0: 1300,
    bf1: 300,
    bd: 0.15,
    bv: 0.55,
    tf0: 125,
    tf1: 50,
    td: 0.15,
    tv: 0.5,
    sub: 0.18,
    tl: 0.55,
    tl2: 0.1,
    tf: 1000,
    rv: 0.4,
    mech: 2600,
    lv: 0.8,
  },
  shotgun: {
    c: 2000,
    cd: 0.03,
    cv: 0.9,
    m: 700,
    md: 0.12,
    mv: 1.1,
    bf0: 900,
    bf1: 200,
    bd: 0.22,
    bv: 0.6,
    tf0: 80,
    tf1: 32,
    td: 0.22,
    tv: 0.62,
    sub: 0.3,
    tl: 0.8,
    tl2: 0.12,
    tf: 850,
    rv: 0.5,
    mech: 2400,
    lv: 0.62,
  },
};
/* superfície do chão: sala (pelo mapa) ou, fora do prédio, cascalho/asfalto. y alto (>2 m) = piso de cima: concreto */
function surfaceAt(p) {
  const x = Math.floor(p.x / CELL),
    z = Math.floor(p.z / CELL);
  if (!inside(x, z)) return 'gravel';
  const r = roomOf(x, z);
  return r === 'office'
    ? 'wood'
    : r === 'archive'
      ? 'carpet'
      : r === 'servers'
        ? 'metal'
        : r === 'storage'
          ? 'concrete'
          : 'tile';
}
/* f/q: faixa do corpo do passo · hl: freq do calcanhar · tap: ponta do pé · ring: parciais (chapa) · v: volume */
const STEP = {
  wood: { f: 380, q: 1.3, v: 1, hl: 150, tap: 1100 },
  carpet: { f: 230, q: 0.6, v: 0.5, hl: 105, tap: 0 },
  metal: { f: 820, q: 2.5, v: 0.95, hl: 125, tap: 2600, ring: [470, 1210] },
  concrete: { f: 560, q: 0.9, v: 0.9, hl: 115, tap: 1700 },
  tile: { f: 720, q: 1.1, v: 0.95, hl: 125, tap: 2300 },
  gravel: { f: 2600, q: 0.7, v: 0.9, hl: 100, grains: 6 },
};
/* ---------------- espacialização ---------------- */
const insideP = (p) => inside(Math.floor(p.x / CELL), Math.floor(p.z / CELL));
function envOf(p) {
  if (!insideP(p)) return 'out';
  return roomOf(Math.floor(p.x / CELL), Math.floor(p.z / CELL)) === 'hall' ? 'hall' : 'room';
}
/* v: ganho · pan · fc: corte passa-baixa (distância/parede/atrás) · delay: propagação (s) · env: reverb da FONTE */
function spatial(pos) {
  const lp = camera.position,
    lenv = envOf(lp);
  if (!pos)
    return { v: 1, pan: 0, fc: 18000, muf: 1, env: lenv, lenv, d: 0, delay: 0, blocked: false };
  const dx = pos.x - lp.x,
    dz = pos.z - lp.z,
    d = Math.hypot(dx, dz, pos.y - lp.y);
  const rel = angDiff(Math.atan2(-dx, -dz), camera.rotation.y);
  const blocked = d > 2 && !clearLine(new V3(lp.x, lp.y, lp.z), new V3(pos.x, pos.y + 0.8, pos.z));
  const behind = Math.abs(rel) > Math.PI / 2;
  let fc = 16000 / (1 + d / 9);
  if (blocked) fc *= 0.22;
  if (behind) fc *= 0.75;
  fc = clamp(fc, 500, 16000);
  return {
    v: (1 / (1 + d / 10)) * (blocked ? 0.55 : 1),
    pan: -Math.sin(rel) * clamp(d / 3, 0, 1),
    fc,
    muf: fc / 16000,
    env: envOf(pos),
    lenv,
    d,
    delay: Math.min(d / 343, 0.6),
    blocked,
  };
}
/* bus de uma voz: passa-baixa → ganho → pan → master; fx = envio para o reverb do ambiente da fonte */
function voice(S, gain, rv) {
  const lp = AC.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = clamp(S.fc, 300, 19000);
  lp.Q.value = 0.4;
  const g = AC.createGain();
  g.gain.value = gain * S.v;
  lp.connect(g);
  let end = g;
  if (AC.createStereoPanner && Math.abs(S.pan) > 0.01) {
    const p = AC.createStereoPanner();
    p.pan.value = clamp(S.pan, -1, 1);
    g.connect(p);
    end = p;
  }
  end.connect(AX.master);
  const fx = AC.createGain();
  fx.gain.value = rv || 0;
  g.connect(fx);
  fx.connect((AX.rev[S.env] || AX.rev.room).input);
  return { d: lp, fx };
}
/* limite de vozes de tiro: descarta as mais distantes se houver muitas simultâneas */
function SP(o, pos, floor) {
  const S = o.S || spatial(pos);
  S.v = Math.max(S.v, floor);
  return S;
}
function budget(t, end, me) {
  const a = AX.act;
  for (let i = a.length - 1; i >= 0; i--) if (a[i] < t) a.splice(i, 1);
  if (!me && a.length >= 16) return false;
  a.push(end);
  return true;
}
const pitchVar = () => 1 + aRr(-0.05, 0.05);
/* ---------------- tiro ---------------- */
function auShot(S, wd, me, sup, pos, nocase) {
  const g = GUN[wd.snd] || GUN.rifle,
    pel = !!wd.pellets,
    env = S.env;
  const wl = g.lv * (sup ? (me ? 0.45 : 0.4) : 1);
  if (!me && wl * S.v < 0.012) return;
  const t = auNow() + 0.004 + S.delay;
  if (!budget(t, t + g.tl + 0.6, me)) return;
  const pf = pitchVar(),
    gv = aRr(0.88, 1.08),
    em = env === 'hall' ? 1.25 : env === 'out' ? 0.8 : 1;
  const vc = voice(
      S,
      gv,
      g.rv * (env === 'out' ? 0.7 : env === 'hall' ? 1.15 : 1) * (me ? 1 : 1 + (1 - S.v) * 0.6)
    ),
    fx = vc.fx,
    key = 'gun_' + wd.snd + (sup ? '_sup' : '');
  const D = AC.createGain();
  D.gain.value = wl;
  D.connect(vc.d); /* nível da arma (a distância já está no bus da voz) */
  const used =
    samp(D, t, key, 1, fx, 0.035) || (!sup && samp(D, t, 'gun_' + wd.snd, 0.45, fx, 0.035));
  if (used && !sup) {
    /* amostra + corpo/grave sintéticos por baixo: dá o peso que o tiro gravado não tem */
    nz(D, t, g.bd * aRr(0.9, 1.1), g.bv * 0.55, 'bandpass', g.bf0 * pf, 0.45, 0.0015, fx, g.bf1);
    tone(D, t, g.td, g.tv * 0.7, 'sine', g.tf0 * pf, g.tf1 * pf, fx);
    if (g.sub && me) tone(D, t, 0.22, g.sub * 0.8, 'sine', 52 * pf, 30);
  }
  if (!used) {
    if (!sup) {
      nz(D, t, g.cd, g.cv, 'highpass', g.c * pf, 0.7, 0.0005, fx); /* estalo supersônico */
      if (pel)
        for (let i = 0; i < 6; i++)
          nz(
            D,
            t + i * 0.0009 + aRr(0, 0.0012),
            0.016,
            g.cv * 0.2,
            'highpass',
            g.c * aRr(0.7, 1.3),
            0.7,
            0.0005
          ); /* grãos da escopeta */
      nz(D, t, g.md, g.mv, 'bandpass', g.m * pf, 0.7, 0.0008, fx); /* estouro (mid): dá o "bang" */
      nz(
        D,
        t,
        g.bd * aRr(0.9, 1.1),
        g.bv,
        'bandpass',
        g.bf0 * pf,
        0.45,
        0.0015,
        fx,
        g.bf1
      ); /* corpo: ruído varrido para o grave */
      tone(D, t, g.td, g.tv, 'sine', g.tf0 * pf, g.tf1 * pf, fx); /* soco */
      if (g.sub && me) tone(D, t, 0.22, g.sub, 'sine', 52 * pf, 30); /* sub-grave que se sente */
    } else {
      nz(
        D,
        t,
        g.bd * 0.8,
        g.bv * 0.6,
        'bandpass',
        g.bf0 * 0.35 * pf,
        0.5,
        0.002,
        fx,
        g.bf1 * 0.7
      ); /* corpo abafado */
      tone(D, t, g.td * 0.8, g.tv * 0.35, 'sine', g.tf0 * 0.8 * pf, g.tf1 * 0.8 * pf, fx);
      nz(D, t, 0.07, 0.25, 'bandpass', 1000 * pf, 0.8, 0.004, fx); /* escape de gás */
      nz(D, t, 0.01, g.cv * 0.06, 'highpass', 2200, 0.7, 0.0005); /* resto do estalo */
    }
  }
  nz(
    D,
    t + 0.012,
    g.tl * em * (sup ? 0.35 : 1),
    g.tl2 * (sup ? 0.6 : 1),
    'bandpass',
    g.tf * (env === 'out' ? 0.65 : 1),
    0.8,
    0.03,
    fx
  ); /* cauda direta */
  if (!sup) {
    if (env === 'out' && (!me || g.tl > 0.4))
      nz(D, t + aRr(0.1, 0.2), 0.35, g.tl2 * 0.5, 'bandpass', 700, 0.5, 0.06); /* eco da fachada */
    if (env === 'hall') {
      nz(D, t + 0.045, 0.18, g.tl2 * 0.6, 'bandpass', 1200, 0.6, 0.01);
      nz(D, t + 0.095, 0.2, g.tl2 * 0.4, 'bandpass', 1000, 0.6, 0.01);
    } /* flutter do corredor */
  }
  if (me) {
    if (sup) click(D, t + 0.02, 0.07, 2200 * pf);
    if (!nocase) {
      if (!pel && wd.cls !== 'rev' && Math.random() < 0.75)
        casing(D, t + 0.3 + Math.random() * 0.25, STEP[surfaceAt(player.pos)]); /* cápsula caindo */
      if (wd.cls === 'sg') pump(D, t + 0.4);
    }
  } else if (wd.cls === 'sg' && !nocase) pump(D, t + 0.45, 0.5);
}
/* cápsula no chão: tinido de latão (varia com o piso) */
function casing(D, t, sf) {
  const hard = sf.tap > 0,
    f = aRr(4800, 7200);
  auRing(D, t, hard ? 0.05 : 0.02, f, hard ? 0.1 : 0.04);
  if (hard) {
    auRing(D, t + 0.1, 0.03, f * aRr(0.9, 1.1), 0.08);
  } else nz(D, t, 0.03, 0.02, 'lowpass', 500);
}
/* pump da escopeta: puxa e empurra */
function pump(D, t, m) {
  m = m || 1;
  nz(D, t, 0.07, 0.14 * m, 'bandpass', 900, 1.4, 0.01);
  click(D, t + 0.02, 0.16 * m, 2300);
  nz(D, t + 0.14, 0.05, 0.14 * m, 'bandpass', 1100, 1.4, 0.004);
  click(D, t + 0.16, 0.2 * m, 2000);
  tone(D, t + 0.16, 0.07, 0.12 * m, 'sine', 230, 140);
}
/* whiz: bala passando perto */
function whiz(S, near) {
  const t = auNow() + 0.004,
    vc = voice(S, 0.55 * near, 0),
    D = vc.d;
  nz(D, t, 0.16, 0.8, 'bandpass', 5200, 3, 0.01, null, 1700);
  nz(D, t, 0.012, 0.4, 'highpass', 3000, 0.7, 0.0005);
}
/* ---------------- recarga ---------------- */
function reloadSeq(D, t, RW, R, m, fx) {
  const sw = RW.pellets,
    rev = RW.cls === 'rev',
    pl = RW.cls === 'pistol' || RW.cls === 'mp',
    lmg = RW.cls === 'lmg',
    v = m;
  if (
    samp(
      D,
      t,
      'reload_' + (rev ? 'rev' : sw ? 'sg' : pl ? 'pistol' : lmg ? 'lmg' : 'ar'),
      v,
      fx,
      0.02
    )
  )
    return;
  if (rev) {
    for (let i = 0; i < 4; i++)
      click(D, t + 0.1 + i * 0.03, 0.12 * v, 2800 + i * 160); /* cilindro abre */
    for (let i = 0; i < 6; i++) {
      auRing(D, t + 0.4 + i * 0.025 + aRr(0, 0.02), 0.07 * v, aRr(5200, 7600), 0.08);
    }
    for (let i = 0; i < 6; i++) click(D, t + R * 0.62 + i * 0.07, 0.1 * v, aRr(2200, 2800));
    nz(D, t + R * 0.9, 0.07, 0.2 * v, 'lowpass', 500);
    click(D, t + R * 0.9, 0.22 * v, 2000);
    click(D, t + R * 0.93, 0.12 * v, 3400);
    return;
  }
  if (sw) {
    const n = Math.max(3, Math.min(8, Math.round(RW.mag * 0.5)));
    for (let i = 0; i < n; i++) {
      const c = t + 0.35 + i * ((R * 0.58) / n) + aRr(0, 0.03);
      nz(D, c, 0.05, 0.14 * v, 'bandpass', 1200, 1.5, 0.004);
      auRing(D, c, 0.07 * v, aRr(650, 820), 0.05);
      click(D, c + 0.045, 0.1 * v, aRr(2400, 3000));
    }
    pump(D, t + R * 0.88, v);
    return;
  }
  if (pl) {
    click(D, t + 0.1, 0.16 * v, 3600);
    nz(D, t + 0.14, 0.14, 0.09 * v, 'bandpass', 900, 1.2, 0.02);
    nz(D, t + 0.28, 0.06, 0.08 * v, 'lowpass', 500); /* solta e cai o carregador */
    nz(D, t + R * 0.45, 0.07, 0.2 * v, 'lowpass', 650);
    click(D, t + R * 0.45, 0.2 * v, 2400); /* encaixa */
    nz(D, t + R * 0.7, 0.09, 0.14 * v, 'bandpass', 1300, 1.5);
    click(D, t + R * 0.72, 0.18 * v, 2700);
    click(D, t + R * 0.78, 0.22 * v, 2100);
    tone(D, t + R * 0.78, 0.05, 0.1 * v, 'sine', 200, 130);
    return;
  } /* culatra */
  if (lmg) {
    click(D, t + 0.15, 0.2 * v, 1500);
    auRing(D, t + 0.15, 0.1 * v, 900, 0.12); /* tampa */
    for (let i = 0; i < 7; i++)
      click(D, t + R * 0.3 + i * 0.06, 0.07 * v, aRr(2600, 3300)); /* correia */
    nz(D, t + R * 0.58, 0.1, 0.22 * v, 'lowpass', 500);
    click(D, t + R * 0.58, 0.2 * v, 1900);
  } /* tampa fecha */
  else {
    click(D, t + 0.1, 0.18 * v, 3200);
    nz(D, t + 0.14, 0.18, 0.09 * v, 'bandpass', 900, 1.3, 0.02);
    nz(D, t + 0.32, 0.06, 0.07 * v, 'lowpass', 500); /* solta o carregador */
    nz(D, t + R * 0.46, 0.09, 0.22 * v, 'lowpass', 620);
    click(D, t + R * 0.46, 0.22 * v, 2200);
    nz(D, t + R * 0.46, 0.06, 0.12 * v, 'bandpass', 1000, 1.5);
  } /* encaixa */
  nz(D, t + R * 0.74, 0.1, 0.15 * v, 'bandpass', 1500, 1.6, 0.01);
  click(D, t + R * 0.76, 0.18 * v, 3000);
  auRing(D, t + R * 0.76, 0.08 * v, 1300, 0.1); /* puxa o ferrolho */
  click(D, t + R * 0.84, 0.22 * v, 2300);
  tone(D, t + R * 0.84, 0.06, 0.12 * v, 'sine', 210, 130);
}
/* ---------------- passos ---------------- */
function footstep(D, t, sf, V, run, soft, fx) {
  const S = sf,
    pf = aRr(0.88, 1.12);
  if (samp(D, t, 'step_' + (S.name || ''), V * 2, fx, 0.05)) return;
  const hl = S.hl * pf * (run ? 0.9 : 1);
  tone(D, t, 0.07, V * (run ? 0.55 : 0.42), 'sine', hl * 1.4, hl * 0.6); /* calcanhar */
  nz(
    D,
    t,
    run ? 0.075 : 0.06,
    V * (S.name === 'carpet' ? 0.9 : 1),
    'bandpass',
    S.f * pf,
    S.q,
    0.005,
    fx
  );
  if (S.grains) {
    for (let i = 0; i < S.grains + (run ? 3 : 0); i++)
      nz(D, t + aRr(0, 0.09), 0.025, V * aRr(0.25, 0.5), 'bandpass', aRr(1800, 4200), 1.2, 0.003);
  } /* cascalho: grãos */
  if (S.tap && !soft) {
    nz(D, t + 0.05 + aRr(0, 0.01), 0.03, V * (run ? 0.7 : 0.5), 'bandpass', S.tap * pf, 2, 0.003);
  } /* ponta do pé */
  if (S.ring && !soft) {
    for (const f of S.ring) tone(D, t, 0.12, V * 0.08, 'sine', f * pf);
  } /* chapa ressoa */
  if (S.name === 'wood' && Math.random() < 0.12)
    tone(D, t + 0.02, 0.12, V * 0.06, 'sawtooth', aRr(300, 420), aRr(180, 260));
} /* tábua range */
for (const k in STEP) STEP[k].name = k;
/* ---------------- impactos ---------------- */
function impactSnd(D, t, k, V, fx) {
  if (samp(D, t, 'impact_' + k, V * 2, fx, 0.06)) return;
  if (k === 'metal') {
    auRing(D, t, V * 0.7, aRr(1700, 2500), 0.22, fx);
    nz(D, t, 0.012, V * 0.8, 'highpass', 4000, 0.7, 0.0005);
    nz(D, t, 0.04, V * 0.4, 'bandpass', 2800, 2);
    if (Math.random() < 0.45)
      tone(D, t + 0.01, 0.28, V * 0.18, 'sine', aRr(2600, 3600), aRr(900, 1500));
  } /* ricochete: zunido caindo */
  else if (k === 'wood' || k === 'crate') {
    nz(D, t, 0.07, V * 0.9, 'bandpass', aRr(550, 760), 1.6, 0.001, fx);
    tone(D, t, 0.09, V * 0.6, 'sine', aRr(210, 260), 150);
    nz(D, t, 0.02, V * 0.5, 'highpass', 3000, 0.7, 0.0005); /* batida + lasca */
    for (let i = 0; i < 3; i++)
      nz(D, t + 0.03 + aRr(0, 0.1), 0.03, V * 0.15, 'bandpass', aRr(1200, 2400), 2, 0.002);
  } else if (k === 'flesh') {
    nz(D, t, 0.07, V, 'lowpass', 520, 0.7, 0.003);
    tone(D, t, 0.09, V * 0.8, 'sine', 135, 65);
  } else if (k === 'glass') {
    nz(D, t, 0.012, V * 0.7, 'highpass', 5000, 0.7, 0.0005);
    auRing(D, t + 0.003, V * 0.25, aRr(3600, 5400), 0.1);
  } else if (k === 'drywall') {
    nz(D, t, 0.09, V * 0.8, 'lowpass', 420, 0.7, 0.003, fx);
    nz(D, t, 0.03, V * 0.5, 'bandpass', 1700, 1.2, 0.001);
    for (let i = 0; i < 3; i++)
      nz(D, t + 0.03 + aRr(0, 0.15), 0.04, V * 0.12, 'bandpass', aRr(900, 2000), 2, 0.003);
  } else {
    nz(D, t, 0.012, V * 0.8, 'highpass', 4000, 0.7, 0.0005, fx);
    nz(D, t, 0.05, V * 0.7, 'bandpass', aRr(1500, 2300), 1.2, 0.002, fx);
    tone(D, t, 0.06, V * 0.35, 'sine', 180, 100); /* concreto/tijolo: estalo + chip */
    for (let i = 0; i < 3; i++)
      nz(D, t + 0.02 + aRr(0, 0.12), 0.03, V * 0.14, 'highpass', aRr(3000, 5000), 1, 0.002);
    if (Math.random() < 0.2)
      tone(D, t + 0.01, 0.25, V * 0.12, 'sine', aRr(2400, 3200), aRr(900, 1400));
  }
}
/* ---------------- playSound ---------------- */
function playSound(kind, pos, o) {
  if (!AC || (typeof SAVE !== 'undefined' && SAVE.mute)) return;
  o = o || {};
  try {
    AUD(kind, pos, o);
  } catch (e) {
    if (AX && AX.debug) throw e;
  }
}
function AUD(kind, pos, o) {
  const t = auNow() + 0.003;
  switch (kind) {
    case 'gun': {
      const wd = WEAPONS[o.w] || WEAPONS.rifle,
        me = !!o.me,
        S = o.S || spatial(me ? null : pos);
      auShot(S, wd, me, !!o.sup, pos, o.nocase);
      /* bala de bot passando perto: zunido */
      if (!me && !o.S && typeof agents !== 'undefined') {
        const ag = agents.find((x) => x.pos === pos);
        if (ag && ag !== player) {
          try {
            const e = eyeOf(ag),
              dr = dirFrom(ag.yaw, ag.pitch),
              L = camera.position,
              rx = L.x - e.x,
              ry = L.y - e.y,
              rz = L.z - e.z,
              al = rx * dr.x + ry * dr.y + rz * dr.z;
            if (al > 2) {
              const px = rx - dr.x * al,
                py = ry - dr.y * al,
                pz = rz - dr.z * al,
                pd = Math.hypot(px, py, pz);
              if (pd < 2.4) {
                const cp = { x: e.x + dr.x * al, y: e.y + dr.y * al, z: e.z + dr.z * al },
                  S2 = spatial(cp);
                S2.delay = al / 700;
                S2.fc = 16000;
                S2.v = 1;
                S2.pan = clamp(S2.pan * 1.2 + (S2.pan >= 0 ? 0.25 : -0.25), -1, 1);
                whiz(S2, 1 - pd / 2.4);
              }
            }
          } catch (err) {}
        }
      }
      break;
    }
    case 'pump': {
      const S = o.S || spatial(pos),
        vc = voice(S, 1, 0.1);
      pump(vc.d, t, 1);
      break;
    }
    case 'whiz': {
      whiz(o.S || spatial(pos), o.near || 1);
      break;
    }
    case 'impact': {
      const k = o.kind;
      if (k === 'metal' && AX.glassT > auNow() - 0.06) return;
      const S = o.S || spatial(pos);
      if (0.4 * S.v < 0.012) return;
      const vc = voice(S, 1, 0.25 * (S.env === 'out' ? 0.7 : 1));
      impactSnd(vc.d, t + S.delay * 0.5, k, 0.4 * (k === 'flesh' ? 1 : 0.9), vc.fx);
      if (
        !o.S &&
        S.d < 5 &&
        (k === 'metal' || k === 'hard' || k === 'brick' || k === 'floor') &&
        Math.random() < 0.15
      ) {
        const vv = voice(S, 0.5, 0);
        nz(vv.d, t, 0.14, 0.5, 'bandpass', 4600, 3, 0.01, null, 1500);
      } /* ricochete perto */
      break;
    }
    case 'step': {
      const sf = STEP[o.surf || surfaceAt(pos || player.pos)] || STEP.concrete,
        S = o.S || spatial(o.me ? null : pos);
      if (!o.me) S.v = Math.pow(S.v, 1.5);
      let V = (o.me ? 0.22 : 0.5) * sf.v * (o.soft ? 0.38 : 1) * (o.loud ? 1.4 : 1);
      if (V * S.v < 0.004) break;
      const vc = voice(S, 1, o.me ? 0.16 : 0.12);
      let D = vc.d;
      if (o.soft) {
        const lp = AC.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 900;
        lp.connect(vc.d);
        D = lp;
      }
      footstep(D, t + S.delay * 0.3, sf, V, !!o.loud, !!o.soft, vc.fx);
      break;
    }
    case 'land': {
      const sf = STEP[o.surf || surfaceAt(player.pos)],
        im = clamp((o.imp || 6) / 10, 0.15, 1),
        S = o.S || spatial(null),
        vc = voice(S, 1, 0.2),
        D = vc.d;
      if (samp(D, t, 'land_' + sf.name, im * 2, vc.fx)) break;
      tone(D, t, 0.14, 0.55 * im, 'sine', 130, 50);
      nz(D, t, 0.12, 0.35 * im, 'lowpass', 260, 0.7, 0.004, vc.fx);
      nz(D, t, 0.07, 0.3 * im * sf.v, 'bandpass', sf.f, sf.q, 0.003);
      footstep(D, t + 0.05, sf, 0.2 * im, true, false, vc.fx);
      break;
    }
    case 'boom': {
      const S = SP(o, pos, 0.1),
        d = S.d,
        near = clamp(1 - d / 24, 0, 1),
        vc = voice(S, 1, 0.9),
        D = vc.d,
        t2 = t + S.delay,
        V = 1;
      if (!o.S && AX.duck) {
        const dk = AX.duck.gain;
        dk.cancelScheduledValues(t);
        dk.setValueAtTime(dk.value, t);
        dk.linearRampToValueAtTime(1 - 0.55 * near, t + S.delay + 0.03);
        dk.setTargetAtTime(1, t + S.delay + 0.35, 0.35);
      } /* ducking */
      budget(t, t + 2.5, true);
      if (!samp(D, t2, 'boom', 1.4 * V, vc.fx, 0.03)) {
        nz(D, t2, 0.03, 0.8 * V, 'highpass', 1800, 0.7, 0.0006); /* estalo */
        nz(D, t2, 0.35, 1.0 * V, 'bandpass', 620, 0.6, 0.002, vc.fx, 200); /* onda média */
        tone(D, t2, 1, 1.0 * V, 'sine', 78, 22, vc.fx); /* onda grave */
        nz(D, t2, 1.7, 0.7 * V, 'lowpass', 210, 0.7, 0.008, vc.fx, 60); /* ribombo */
        for (let i = 0; i < 5; i++)
          nz(
            D,
            t2 + 0.12 + aRr(0, 1.1) * (0.4 + i / 5),
            0.06,
            aRr(0.1, 0.22) * V,
            'bandpass',
            aRr(700, 3200),
            2.5,
            0.002
          ); /* detritos */
        if (near > 0.2) tone(master, t2 + 0.05, 2.2, 0.05 * near, 'sine', 5400, 5200);
      } /* zumbido no ouvido */
      if (typeof VM !== 'undefined') VM.shake = Math.max(VM.shake, clamp(1.2 - d / 25, 0, 1));
      break;
    }
    case 'glass': {
      const S = SP(o, pos, 0.12),
        vc = voice(S, 1, 0.35),
        D = vc.d,
        V = 1;
      if (samp(D, t, 'glass', 1.2 * V, vc.fx)) break;
      nz(D, t, 0.015, 0.9 * V, 'highpass', 4500, 0.7, 0.0005);
      nz(D, t, 0.3, 0.55 * V, 'highpass', 3200, 0.6, 0.003, vc.fx, 6500);
      nz(D, t, 0.12, 0.3 * V, 'bandpass', 1400, 1, 0.002);
      tone(D, t, 0.12, 0.3 * V, 'sine', 320, 110);
      for (let i = 0; i < 22; i++) {
        const at = t + 0.02 + Math.pow(Math.random(), 1.7) * 0.9;
        auRing(D, at, aRr(0.03, 0.1) * V, aRr(2800, 9000), aRr(0.05, 0.16));
      } /* cacos tinindo */
      for (let i = 0; i < 5; i++)
        nz(D, t + 0.25 + aRr(0, 0.5), 0.03, 0.08 * V, 'highpass', aRr(5000, 8000), 1, 0.002);
      break;
    }
    case 'wall': {
      const S = SP(o, pos, 0.12),
        big = o.big,
        vc = voice(S, 1, 0.45),
        D = vc.d,
        V = 1 * (big ? 1.2 : 0.8);
      samp(
        D,
        t,
        'wall',
        (big ? 1.3 : 0.8) * V,
        vc.fx,
        0.06
      ); /* v4.5: camada de amostra (Rock Impact/Debris) sobre a síntese */
      nz(D, t, big ? 0.5 : 0.25, 0.7 * V, 'lowpass', big ? 420 : 500, 0.7, 0.004, vc.fx, 120);
      nz(D, t, 0.04, 0.5 * V, 'bandpass', 1200, 1, 0.001);
      tone(D, t, big ? 0.3 : 0.15, 0.5 * V, 'sine', 100, 45);
      for (let i = 0; i < (big ? 14 : 6); i++)
        nz(
          D,
          t + 0.04 + aRr(0, big ? 0.9 : 0.4),
          0.05,
          aRr(0.06, 0.16) * V,
          'bandpass',
          aRr(500, 2200),
          2,
          0.002
        );
      break;
    }
    case 'door': {
      const S = SP(o, pos, 0.15),
        vc = voice(S, 1, 0.5),
        D = vc.d,
        V = 1;
      if (samp(D, t, 'door', V, vc.fx)) break;
      nz(D, t, 0.35, 0.8 * V, 'bandpass', 450, 1.2, 0.002, vc.fx);
      tone(D, t, 0.2, 0.7 * V, 'sine', 150, 60);
      nz(D, t, 0.025, 0.6 * V, 'highpass', 3000, 0.7, 0.0005);
      for (let i = 0; i < 8; i++)
        nz(
          D,
          t + 0.05 + aRr(0, 0.5),
          0.06,
          aRr(0.08, 0.2) * V,
          'bandpass',
          aRr(600, 1500),
          2.5,
          0.002
        );
      break;
    }
    case 'smash': {
      const S = SP(o, pos, 0.15),
        vc = voice(S, 1, 0.4),
        D = vc.d,
        V = 1;
      nz(D, t, 0.18, 0.7 * V, 'lowpass', 500, 0.7, 0.002, vc.fx);
      tone(D, t, 0.12, 0.6 * V, 'sine', 140, 60);
      nz(D, t + 0.03, 0.22, 0.3 * V, 'bandpass', 900, 1, 0.002, vc.fx);
      for (let i = 0; i < 5; i++)
        nz(
          D,
          t + 0.05 + aRr(0, 0.35),
          0.06,
          aRr(0.08, 0.14) * V,
          'bandpass',
          aRr(1200, 2400),
          3,
          0.002
        );
      break;
    }
    case 'device': {
      /* bipe do desativador: sobe de tom e acelera com o tempo */
      const P = typeof G !== 'undefined' && G.planted,
        u = P ? clamp(1 - P.t / (typeof PLANT_T !== 'undefined' ? PLANT_T : 45), 0, 1) : 0,
        S = SP(o, pos, 0.2),
        vc = voice(S, 1, 0.18),
        D = vc.d,
        V = 1,
        f = 1900 + u * 1700;
      tone(D, t, 0.07 - 0.025 * u, 0.3 * V, 'square', f, null, vc.fx);
      tone(D, t, 0.07, 0.12 * V, 'sine', f * 0.5);
      if (P && P.t < 10) tone(D, t + 0.1, 0.05, 0.22 * V, 'square', f * 1.25);
      break;
    }
    case 'plant': {
      tone(master, t, 0.1, 0.1, 'triangle', 700);
      tone(master, t + 0.1, 0.16, 0.12, 'triangle', 1050);
      click(master, t, 0.1, 2600);
      break;
    }
    case 'reinforce': {
      const S = SP(o, pos, 0.2),
        vc = voice(S, 1, 0.4),
        D = vc.d,
        V = 1;
      for (let i = 0; i < 3; i++) {
        nz(D, t + i * 0.09, 0.07, 0.4 * V, 'bandpass', 800, 2, 0.002, vc.fx);
        auRing(D, t + i * 0.09, 0.12 * V, 650 + i * 140, 0.12);
      }
      tone(D, t, 0.15, 0.4 * V, 'sine', 120, 70);
      nz(D, t + 0.3, 0.3, 0.3 * V, 'lowpass', 400, 0.7, 0.01, vc.fx);
      break;
    }
    case 'thermal': {
      const S = SP(o, pos, 0.2),
        vc = voice(S, 1, 0.3),
        V = 1;
      nz(vc.d, t, 3, 0.5 * V, 'highpass', 2500, 0.7, 0.3);
      nz(vc.d, t, 3, 0.3 * V, 'bandpass', 900, 3, 0.3);
      for (let i = 0; i < 20; i++)
        nz(vc.d, t + aRr(0, 3), 0.02, 0.15 * V, 'highpass', 4000, 0.7, 0.001);
      break;
    }
    case 'place': {
      const S = SP(o, pos, 0.2),
        vc = voice(S, 1, 0.1),
        V = 1;
      tone(vc.d, t, 0.08, 0.3 * V, 'triangle', 500, 300);
      nz(vc.d, t, 0.05, 0.25 * V, 'bandpass', 1200, 1, 0.002);
      click(vc.d, t + 0.03, 0.1 * V, 2000);
      break;
    }
    case 'bounce': {
      const S = SP(o, pos, 0.2),
        vc = voice(S, 1, 0.15),
        V = 1;
      auRing(vc.d, t, 0.3 * V, aRr(1600, 2200), 0.12);
      nz(vc.d, t, 0.04, 0.2 * V, 'lowpass', 500);
      break;
    }
    case 'pin': {
      const S = SP(o, pos, 0.3),
        vc = voice(S, 1, 0.2),
        D = vc.d,
        V = 1; /* alavanca/pino da granada */
      click(D, t, 0.3 * V, 2600);
      auRing(D, t + 0.02, 0.35 * V, 3300, 0.3);
      auRing(D, t + 0.15, 0.12 * V, 3800, 0.15);
      nz(D, t, 0.2, 0.2 * V, 'bandpass', 1400, 1, 0.04);
      break;
    }
    case 'vault': {
      nz(master, t, 0.15, 0.35, 'lowpass', 420, 0.7, 0.01);
      nz(master, t + 0.1, 0.08, 0.15, 'bandpass', 900, 1.5, 0.004);
      nz(master, t + 0.2, 0.08, 0.25, 'lowpass', 300);
      break;
    }
    case 'reload': {
      const RW = WEAPONS[o.w] || WEAPONS.rifle,
        R = RW.reload,
        S = o.far ? spatial(pos) : o.S || spatial(null),
        m = 1;
      if (o.far && S.v < 0.03) break;
      const vc = voice(S, 1, 0.12);
      reloadSeq(vc.d, t + S.delay * 0.3, RW, R, m * 0.55, vc.fx);
      break;
    }
    case 'draw': {
      const RW = WEAPONS[o.w] || WEAPONS.rifle,
        S = SP(o, pos, 0.2),
        vc = voice(S, 1, 0.08),
        D = vc.d,
        V = 1 * (pos ? 1 : 0.7);
      if (samp(D, t, 'draw', 0.55 * V, vc.fx, 0.04)) break;
      nz(D, t, 0.18, 0.25 * V, 'bandpass', 1100, 0.8, 0.04);
      click(D, t + 0.1, 0.2 * V, 2800);
      click(D, t + 0.2, 0.13 * V, 2200);
      if (RW.pellets || RW.cls === 'lmg' || RW.cls === 'ar')
        nz(D, t + 0.14, 0.06, 0.2 * V, 'lowpass', 500);
      break;
    }
    case 'empty': {
      click(master, t, 0.2, 1700);
      tone(master, t, 0.02, 0.05, 'square', 900);
      break;
    }
    case 'deny':
      tone(master, t, 0.1, 0.1, 'square', 220);
      tone(master, t + 0.11, 0.1, 0.1, 'square', 180);
      break;
    case 'ping':
      tone(master, t, 0.14, 0.18, 'triangle', 1400, 1800);
      tone(master, t + 0.1, 0.14, 0.14, 'triangle', 1800, 2000);
      break;
    case 'radio': {
      nz(master, t, 0.07, 0.05, 'bandpass', 2200, 3, 0.003);
      tone(master, t + 0.05, 0.07, 0.05, 'sine', 1700);
      nz(master, t + 0.13, 0.05, 0.03, 'highpass', 3000, 0.7, 0.002);
      break;
    }
    case 'flash': {
      const S = SP(o, pos, 0.1),
        vc = voice(S, 1, 0.9),
        D = vc.d,
        t2 = t + S.delay,
        im = clamp(1 - S.d / 30, 0.1, 1);
      nz(D, t2, 0.2, 0.8 * im, 'highpass', 1200, 0.7, 0.001, vc.fx);
      tone(D, t2, 0.35, 0.3 * im, 'sine', 2600, 900, vc.fx);
      break;
    }
    case 'ring': {
      tone(master, t, Math.min(3, o.t || 2), 0.07, 'sine', 3500, 3300);
      break;
    }
    case 'pulse': {
      tone(master, t, 0.5, 0.16, 'sine', 500, 1500);
      tone(master, t + 0.1, 0.4, 0.06, 'sine', 1000, 3000);
      nz(master, t, 0.4, 0.04, 'highpass', 3000, 0.7, 0.1);
      break;
    }
    case 'dronelost': {
      nz(master, t, 0.9, 0.14, 'highpass', 2000, 0.7, 0.002, null, 5000);
      tone(master, t, 0.5, 0.07, 'sawtooth', 420, 70);
      tone(master, t + 0.5, 1.2, 0.04, 'sine', 1000);
      nz(master, t, 0.04, 0.2, 'bandpass', 900, 2);
      break;
    }
    case 'dronego': {
      tone(master, t, 0.1, 0.1, 'sine', 1200);
      tone(master, t + 0.12, 0.12, 0.1, 'sine', 1800);
      break;
    }
    case 'hit': {
      if (samp(master, t, 'hit', 0.5)) break;
      nz(master, t, 0.015, 0.4, 'highpass', 3000, 0.7, 0.0005);
      tone(master, t, 0.07, o.head ? 0.2 : 0.12, 'sine', o.head ? 3000 : 2000);
      if (o.head) tone(master, t, 0.18, 0.1, 'sine', 4200);
      if (o.kill) {
        tone(master, t + 0.04, 0.16, 0.18, 'triangle', o.head ? 1500 : 900, o.head ? 900 : 500);
        tone(master, t, 0.1, 0.2, 'sine', 130, 70);
      }
      break;
    }
    case 'hurt': {
      tone(master, t, 0.18, 0.28, 'sine', 130, 60);
      nz(master, t, 0.14, 0.3, 'lowpass', 380, 0.7, 0.002);
      tone(master, t + 0.02, 0.12, 0.12, 'sawtooth', 160, 90);
      nz(master, t, 0.4, 0.05, 'bandpass', 300, 0.7, 0.1);
      break;
    }
    case 'swing': {
      const S = SP(o, pos, 0.25),
        vc = voice(S, 1, 0.1),
        V = 1 * (pos ? 1.2 : 1);
      if (samp(vc.d, t, 'swing', 0.7 * V, vc.fx, 0.05)) break;
      nz(vc.d, t, 0.16, 0.3 * V, 'bandpass', 700, 0.8, 0.05, vc.fx, 1600);
      nz(vc.d, t + 0.12, 0.06, 0.2 * V, 'lowpass', 300);
      break;
    }
    case 'win':
      tone(master, t, 0.18, 0.2, 'triangle', 523);
      tone(master, t + 0.16, 0.18, 0.2, 'triangle', 659);
      tone(master, t + 0.32, 0.45, 0.2, 'triangle', 784);
      break;
    case 'lose':
      tone(master, t, 0.3, 0.2, 'triangle', 392);
      tone(master, t + 0.25, 0.55, 0.2, 'triangle', 262);
      break;
    case 'ui':
      if (!samp(master, t, 'ui', 0.4)) {
        tone(master, t, 0.045, 0.08, 'triangle', 1200);
        nz(master, t, 0.01, 0.03, 'highpass', 4000, 0.7, 0.0005);
      }
      break;
  }
}
/* ---------------- API de teste (render offline) ---------------- */
function audioRender(fn, dur, sr, raw) {
  sr = sr || 44100;
  const oc = new OfflineAudioContext(2, Math.ceil(dur * sr), sr),
    keep = [AC, AX, master];
  AC = oc;
  AX = buildGraph(oc, false, raw);
  AX.debug = true;
  master = AX.master;
  let err = null,
    ts = 0;
  const t0 = performance.now();
  try {
    fn();
  } catch (e) {
    err = e;
  }
  ts = performance.now() - t0;
  AC = keep[0];
  AX = keep[1];
  master = keep[2];
  if (err) throw err;
  return oc.startRendering().then((b) => ({ b, ts }));
}
try {
  window.__pcAudio = {
    state: () => ({
      ac: !!AC,
      st: AC && AC.state,
      sr: AC && AC.sampleRate,
      bank: Object.keys(BANK).length,
      hooks: Object.keys(HK).join(),
    }),
    tick: () => audioTick(),
    render: audioRender,
    play: playSound,
    later: (dt, fn) => {
      AX.off = dt;
      try {
        fn();
      } finally {
        AX.off = 0;
      }
    },
    setPlanted: (t) => {
      G.planted = { t, pos: { x: 0, y: 0, z: 0 } };
    },
    GUN,
    STEP,
    bank: BANK,
    bankAdd: (n, u) => bankAdd(n, u),
    useCtx: (c) => {
      AC = c;
      AX = buildGraph(c, false);
      master = AX.master;
    },
  };
} catch (e) {}
