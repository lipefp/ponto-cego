/* =====================================================================
   ANIMAÇÃO — bonecos em 3ª pessoa (animChar) e arma/braços em 1ª pessoa (updateVM)
   ===================================================================== */
/* ---------- animação procedural dos operadores ----------
   · posição/giro suavizados (a simulação roda a 60 Hz; a tela pode ter outro ritmo)
   · marcha pela direção do movimento: frente, ré e lateral (o quadril gira, o tronco segue a mira)
   · correr com a arma baixa, agachado andando, inclinar, mirar, recuo, recarga, respiração
   · morte: joelhos cedem e o corpo cai para longe de quem atirou */
const _ang = (a, b, k) => a + angDiff(b, a) * k;
/* interpola quadros-chave [t,[x,y,z]] */
function kf(t, K) {
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) {
    if (t <= K[i][0]) {
      const a = K[i - 1],
        b = K[i],
        k = smooth((t - a[0]) / (b[0] - a[0]));
      return a[1].map((v, j) => v + (b[1][j] - v) * k);
    }
  }
  return K[K.length - 1][1];
}
const RELOAD_L = [
  [0, [0, 0, 0]],
  [0.12, [0, -0.08, 0.1]],
  [0.22, [0, -0.12, 0.1]],
  [0.36, [-0.06, -0.3, 0.2]],
  [0.5, [0, -0.12, 0.1]],
  [0.62, [0, -0.08, 0.1]],
  [0.74, [0.06, 0.03, 0.24]],
  [0.86, [0.06, 0.03, 0.3]],
  [1, [0, 0, 0]],
];
const RELOAD_MAG = [
  [0, [0]],
  [0.14, [0]],
  [0.34, [0.3]],
  [0.36, [0.3]],
  [0.46, [0.3]],
  [0.58, [0]],
  [1, [0]],
];
function animCharProc(ch, a, dt) {
  const r = ch.root,
    k20 = 1 - Math.exp(-dt * 20);
  if (!ch.disp) {
    ch.disp = new V3(a.pos.x, a.pos.y, a.pos.z);
    ch.dyaw = a.yaw;
  }
  if (ch.disp.distanceTo(a.pos) > 2.5) ch.disp.copy(a.pos);
  else {
    ch.disp.x += (a.pos.x - ch.disp.x) * k20;
    ch.disp.y += (a.pos.y - ch.disp.y) * k20;
    ch.disp.z += (a.pos.z - ch.disp.z) * k20;
  }
  /* ---- morte ----
     Cai para o lado oposto ao tiro, mas antes testa o espaço: se a parede estiver
     atrás, cai para a frente; sem espaço nenhum, desaba sentado. A arma solta e cai no chão. */
  if (!a.alive) {
    if (!ch.fall) {
      const hf = a.killFrom || (a.ai && a.ai.hurtFrom);
      let back = 1,
        side = (Math.random() - 0.5) * 0.6;
      if (hf) {
        const dx = hf.x - a.pos.x,
          dz = hf.z - a.pos.z,
          fw = -(dx * Math.sin(ch.dyaw) + dz * Math.cos(ch.dyaw)),
          rt = dx * Math.cos(ch.dyaw) - dz * Math.sin(ch.dyaw);
        back = fw >= 0 ? 1 : -1;
        side = clamp(-rt / Math.max(1, Math.hypot(fw, rt)), -1, 1) * 0.5;
      }
      const S = Math.sin(ch.dyaw),
        C = Math.cos(ch.dyaw),
        o = new V3(a.pos.x, a.pos.y + 0.9, a.pos.z);
      const free = (dx, dz) =>
        traceWorld(o, new V3(dx, 0, dz), 1.75).t >= 1.7; /* cabe um corpo deitado nessa direção? */
      const fb = (b) => free(S * b, C * b),
        fs = (sg) => free(-C * sg, S * sg);
      let mode = 'fall';
      if (!fb(back)) {
        if (fb(-back)) back = -back;
        else {
          const sg = side >= 0 ? 1 : -1;
          if (fs(sg)) ((mode = 'side'), (side = sg));
          else if (fs(-sg)) ((mode = 'side'), (side = -sg));
          else mode = 'slump';
        }
      }
      ch.fall = { back, side, mode, fast: !!a.lastHead };
      ch.deathT = 0;
      /* solta a arma: passa a ser um objeto do mundo que cai até o chão */
      ch.needDrop = true;
    }
    const F = ch.fall;
    ch.deathT = Math.min(1.4, ch.deathT + dt * (F.fast ? 2.6 : 1.9));
    const t = ch.deathT;
    const buckle = smooth(Math.min(1, t / 0.35)),
      drop = smooth(clamp((t - 0.2) / 0.8, 0, 1));
    r.rotation.y = ch.dyaw;
    if (F.mode === 'fall') {
      r.rotation.x = ((F.back * Math.PI) / 2) * 0.96 * drop;
      r.rotation.z = F.side * 0.4 * drop;
    } else if (F.mode === 'side') {
      r.rotation.x = 0.15 * drop;
      r.rotation.z = ((F.side * Math.PI) / 2) * 0.94 * drop;
    } else {
      r.rotation.x = 0;
      r.rotation.z = 0;
    }
    /* gira em torno do quadril (não dos pés): o quadril desce até o chão e recua um pouco */
    {
      const M = B.Matrix.RotationYawPitchRoll(r.rotation.y, r.rotation.x, r.rotation.z),
        hp = B.Vector3.TransformCoordinates(new B.Vector3(0, 0.95, 0), M),
        off =
          F.mode === 'slump'
            ? new B.Vector3(0, 0, 0)
            : B.Vector3.TransformCoordinates(
                F.mode === 'side'
                  ? new B.Vector3(F.side * -0.3 * drop, 0, 0)
                  : new B.Vector3(0, 0, F.back * 0.35 * drop),
                B.Matrix.RotationY(r.rotation.y)
              );
      const ty = F.mode === 'slump' ? 0.95 : 0.95 + (0.34 - 0.95) * drop;
      r.position.set(ch.disp.x + off.x - hp.x, a.pos.y + ty - hp.y, ch.disp.z + off.z - hp.z);
    }
    const keep =
      F.mode === 'slump' ? 1 : 1 - drop; /* desabando sentado: fica com os joelhos dobrados */
    const sink = F.mode === 'slump' ? 0.55 * buckle : 0.3 * buckle * keep;
    ch.hips.position.y = 0.95 - sink;
    ch.up.position.y = 0.98 - sink;
    ch.legs.forEach((l, i) => {
      l.th.rotation.set(
        0.9 * buckle * keep + (F.mode === 'slump' ? 0.5 : 0) + (i ? 0.12 : -0.06) * drop,
        0,
        (i ? 0.14 : -0.1) * drop
      );
      l.kn.rotation.x = -1.6 * buckle * keep - (i ? 0.25 : 0.1) * drop;
    });
    if (F.mode === 'slump') ch.up.rotation.set(0.55 * buckle, 0, 0.25 * buckle);
    else
      ch.up.rotation.set(
        -0.4 * buckle * keep + (F.back > 0 ? 0.2 : -0.3) * drop,
        0,
        F.side * 0.3 * drop
      );
    ch.head.rotation.set(
      (F.mode === 'slump' ? 0.7 : F.back > 0 ? 0.5 : -0.3) * drop,
      0,
      0.4 * (F.side > 0 ? 1 : -1) * drop
    );
    ch.rig.rotation.set(-1.4 * drop, 0.4 * drop, 0.8 * drop);
    ch.armL.position.set(0, 0, 0);
    ch.hips.rotation.set(0, 0, 0);
    if (ch.needDrop) {
      ch.needDrop = false;
      const w = ch.weapon;
      if (w && w.g.parent) {
        /* matriz do mundo atualizada antes de soltar (senão a arma "nasce" na pose antiga) */
        for (const n of [ch.root, ch.up, ch.rig, ch.rig.getChildren()[0], ch.gunSlot, w.g])
          n.computeWorldMatrix(true);
        w.g.setParent(null);
        const g = w.g;
        ch.drop = {
          vy: 0,
          y0: a.pos.y + 0.045,
          t: 0,
          q0: (g.rotationQuaternion || B.Quaternion.Identity()).clone(),
          q1: B.Quaternion.RotationYawPitchRoll(
            ch.dyaw + rand(-0.7, 0.7),
            0,
            ((Math.random() < 0.5 ? -1 : 1) * Math.PI) / 2
          ),
        };
      }
    }
    if (ch.drop) {
      const D = ch.drop,
        g = ch.weapon.g;
      D.t += dt;
      if (g.position.y > D.y0) {
        D.vy -= 9.8 * dt;
        g.position.y = Math.max(D.y0, g.position.y + D.vy * dt);
      }
      if (g.rotationQuaternion)
        B.Quaternion.SlerpToRef(D.q0, D.q1, smooth(Math.min(1, D.t / 0.45)), g.rotationQuaternion);
    } /* gira até deitar de lado no chão */
    return;
  }
  if (ch.drop || (ch.weapon && !ch.weapon.g.parent)) {
    const g = ch.weapon.g;
    g.setParent(ch.gunSlot);
    g.rotationQuaternion = null;
    g.rotation.set(0, 0, 0);
    const w = ch.weapon;
    g.position.set(-w.grip.x, -w.grip.y, -w.grip.z);
    ch.drop = null;
  } /* renasceu: arma volta para a mão */
  ch.fall = null;
  ch.deathT = 0;
  r.rotation.x = r.rotation.z = 0;
  ch.dyaw = _ang(ch.dyaw, a.yaw, 1 - Math.exp(-dt * 18));
  r.position.set(ch.disp.x, ch.disp.y, ch.disp.z);
  r.rotation.y = ch.dyaw;
  /* ---- velocidade no referencial do corpo ---- */
  const s = Math.sin(ch.dyaw),
    c = Math.cos(ch.dyaw),
    vx = a.vel.x,
    vz = a.vel.z;
  const fwd = -(vx * s + vz * c),
    rgt = vx * c - vz * s,
    sp = Math.hypot(vx, vz),
    amt = clamp(sp / 3.2, 0, 1.25),
    ck = a.crouchK;
  const run = a.sprint ? 1 : 0;
  ch.sprintK += (run - ch.sprintK) * (1 - Math.exp(-dt * 8));
  /* direção das pernas: frente/diagonal gira o quadril; ré inverte a passada */
  let back = fwd < -0.3 * sp && sp > 0.4,
    want = 0;
  if (sp > 0.4) {
    want = back ? Math.atan2(-rgt, -fwd) : Math.atan2(rgt, fwd);
    want = clamp(want, -1.05, 1.05);
  }
  const side = sp > 0.4 ? Math.abs(Math.sin(want)) : 0; /* 0 = frente/ré · 1 = puro lateral */
  ch.legYaw = _ang(ch.legYaw, -want * 0.55, 1 - Math.exp(-dt * 10));
  ch.sideK =
    (ch.sideK || 0) +
    ((sp > 0.4 ? Math.sign(rgt) * side : 0) - (ch.sideK || 0)) * (1 - Math.exp(-dt * 10));
  /* giro parado: pés "arrastam" acompanhando o corpo */
  const dYaw = Math.abs(angDiff(a.yaw, ch.lastYaw));
  ch.lastYaw = a.yaw;
  if (sp < 0.4) ch.turnPh += dYaw * 2.2;
  const stride = a.sprint ? 2.9 : ck > 0.5 ? 2.2 : 2.5;
  ch.walk += ((dt * sp * stride) / 1.25) * (back ? -1 : 1);
  const ph = ch.walk,
    sk = Math.abs(ch.sideK || 0),
    A = (0.52 + 0.04 * ch.sprintK) * (1 - 0.45 * ck) * Math.min(1, amt) * (1 - 0.6 * sk),
    T = Math.sin(ch.turnPh) * 0.18 * Math.min(1, dYaw * 30);
  ch.legs.forEach((l, i) => {
    const sg = i ? 1 : -1,
      p = ph + (i ? Math.PI : 0);
    const swing = Math.sin(p) * A,
      lift = Math.max(0, Math.cos(p)) * (0.55 + 0.35 * ch.sprintK) * Math.min(1, amt);
    l.th.rotation.x = swing + ck * 1.15 + lift * 0.12 + T * sg;
    /* passo lateral: as pernas abrem e fecham para o lado do movimento, sem cruzar */
    l.th.rotation.z =
      sg * 0.03 +
      ck * 0.12 * sg -
      (ch.sideK || 0) *
        Math.max(0, Math.sin(p) * (sg * (ch.sideK || 0) > 0 ? 1 : 0.35)) *
        0.38 *
        Math.min(1, amt);
    l.kn.rotation.x = -(lift + 0.06 * Math.min(1, amt)) - ck * 1.95;
  });
  ch.hips.rotation.y = ch.legYaw;
  ch.hips.rotation.z = Math.sin(ph) * 0.05 * Math.min(1, amt);
  const bob = Math.abs(Math.cos(ph)) * 0.04 * Math.min(1, amt) * (1 + ch.sprintK * 0.6),
    baseY = 0.95 - 0.44 * ck;
  ch.hips.position.y = baseY - 0.025 * Math.min(1, amt) + bob;
  /* ---- tronco: mira, inclinação, respiração, corrida ---- */
  const tNow = performance.now() / 1000,
    breath = Math.sin(tNow * 1.7 + a.id) * 0.012;
  const pitch = clamp(a.pitch, -0.9, 0.9);
  ch.up.position.set((a.lean || 0) * 0.12, 0.98 - 0.44 * ck + bob * 0.8, 0);
  ch.up.rotation.x = pitch * 0.6 + breath - ch.sprintK * 0.22 - ck * 0.08;
  ch.up.rotation.y =
    -ch.legYaw * 0.15 + Math.sin(ph) * 0.04 * Math.min(1, amt) * (1 - ch.sprintK * 0.5);
  ch.up.rotation.z = -(a.lean || 0) * 0.42;
  ch.hips.position.x = (a.lean || 0) * 0.05;
  ch.head.rotation.set(pitch * 0.35 + ch.sprintK * 0.15, 0, (a.lean || 0) * 0.1);
  /* ---- arma: correr (baixa), recarga (inclina), mira, recuo ---- */
  ch.reloadK += ((a.reloadT > 0 ? 1 : 0) - ch.reloadK) * (1 - Math.exp(-dt * 9));
  ch.adsK += ((a.ads || 0) - ch.adsK) * (1 - Math.exp(-dt * 10));
  const rp = a.reloadT > 0 ? 1 - a.reloadT / WEAPONS[curW(a).id].reload : 0,
    rw = Math.sin(rp * Math.PI * 3) * 0.06 * ch.reloadK;
  const since = typeof G !== 'undefined' ? G.clock - (a.fireT || -9) : 9,
    kick = since < 0.25 ? Math.exp(-since * 16) : 0;
  ch.rig.rotation.x =
    pitch * 0.4 * (1 - ch.sprintK) -
    ch.sprintK * 0.75 -
    ch.reloadK * 0.35 +
    kick * 0.14 +
    rw +
    ch.adsK * 0.03; /* + 40% da inclinação: com o tronco (60%) a arma aponta para onde a bala vai */
  ch.rig.rotation.y = ch.sprintK * 0.55 + ch.reloadK * 0.2 - ch.adsK * 0.06;
  ch.rig.rotation.z = ch.sprintK * 0.25 + ch.reloadK * 0.55;
  ch.rig.position.set(0, 0.46 + ch.adsK * 0.04, kick * 0.05);
  /* recarga em etapas (quadros-chave): mão no carregador → tira → vai ao colete → encaixa o novo → puxa o ferrolho */
  const w = ch.weapon;
  if (rp > 0) {
    const L = kf(rp, RELOAD_L);
    ch.armL.position.set(L[0], L[1], L[2]);
  } else ch.armL.position.set(0, 0, 0);
  if (w && w.mag) {
    const md = rp > 0 ? kf(rp, RELOAD_MAG)[0] : 0;
    w.mag.position.copyFrom(w.magHome);
    w.mag.position.y -= md;
    w.mag.setEnabled(!(rp > 0.36 && rp < 0.46));
  }
  if (w && w.pump) {
    const pk =
      since < 0.6 && WEAPONS[curW(a).id].cls === 'sg'
        ? Math.sin(Math.PI * clamp((since - 0.12) / 0.4, 0, 1))
        : 0;
    w.pump.position.copyFrom(w.pumpHome);
    w.pump.position.z += pk * 0.1;
    ch.armL.position.z += pk * 0.1;
  }
}

/* =====================================================================
   3ª PESSOA COM ESQUELETO (clipes Mixamo) — animChar
   · locomoção em 8 direções: mistura andar/correr/disparada pela velocidade e direção relativas ao corpo;
     o relógio da passada anda na velocidade real (distância do ciclo de cada clipe) → pé não escorrega
   · agachado (parado/andando), pulo/queda, giro no lugar (clipes de 90°), pistola (tronco do pacote de pistola)
   · camadas: mira vertical e torção distribuídas pela coluna, inclinar Q/E rolando a coluna,
     correção final da arma (aponta exatamente para onde o boneco mira), cabeça olhando para a mira,
     mão esquerda no guarda-mão (IK de 2 ossos), recuo e recarga procedurais
   · morte: clipe escolhido pela direção do tiro (e pelo espaço livre), deslocamento do quadril passado para a raiz
   ===================================================================== */
const OP_DIRS = ['f', 'fl', 'l', 'bl', 'b', 'br', 'r', 'fr'];
const OP_QG = new Float32Array([0, 1, 0, 0]);
let OP_READY = 0.6;
const _aq = new Float32Array(32),
  _av = new Float32Array(24);
function opClipDist(pk, k) {
  const c = pk.clips[k];
  return c ? Math.max(0.4, c.spd * c.dur) : 1.8;
}
/* mira: gira Spine2 até a arma (frente do encaixe) apontar para (pitch, yaw) no espaço do modelo */
function opAimFix(ch, po, pitch, yaw, w, pist) {
  const rig = ch.rig,
    X = rig.idx,
    S = OPM.ref[pist > 0.5 ? 'pistol' : 'rifle'],
    h = X.RightHand * 4;
  if (w <= 0) return;
  OPQ.mul(_aq, 0, po.G, h, S.rot, 0);
  OPQ.rot(_av, 0, _aq, 0, 0, 0, -1);
  const cp = Math.cos(pitch);
  OPQ.fromTo(
    _aq,
    4,
    _av[0],
    _av[1],
    _av[2],
    Math.sin(yaw) * cp,
    Math.sin(pitch),
    Math.cos(yaw) * cp
  );
  if (w < 1) OPQ.scale(_aq, 4, w);
  opRotGlobal(rig, po, X.Spine2, _aq, 4);
  opFK(rig, po, X.Spine2 + 1);
}
/* IK de 2 ossos (braço, antebraço, mão) até o pulso T (espaço do modelo) com giro de mão qT */
function opIK2(rig, po, a, b, c, T, qT, w) {
  if (w <= 0) return;
  const W = po.W;
  const S = [W[a * 3], W[a * 3 + 1], W[a * 3 + 2]],
    E = [W[b * 3], W[b * 3 + 1], W[b * 3 + 2]],
    H = [W[c * 3], W[c * 3 + 1], W[c * 3 + 2]];
  const la = v3l(v3s(E, S)),
    lb = v3l(v3s(H, E)),
    tv = v3s(T, S),
    d = Math.min(Math.max(v3l(tv), Math.abs(la - lb) + 0.01), (la + lb) * 0.999);
  const u = v3s(S, E),
    v = v3s(H, E),
    cur = Math.acos(Math.max(-1, Math.min(1, v3d(u, v) / (v3l(u) * v3l(v) || 1)))),
    des = Math.acos(Math.max(-1, Math.min(1, (la * la + lb * lb - d * d) / (2 * la * lb))));
  let n = v3x(u, v);
  if (v3l(n) < 1e-5) n = v3x(u, [0, 1, 0]);
  n = v3n(n);
  OPQ.axis(_aq, 8, n[0], n[1], n[2], (des - cur) * w);
  opRotGlobal(rig, po, b, _aq, 8);
  const v2 = new Float32Array(3);
  OPQ.rot(v2, 0, _aq, 8, v[0], v[1], v[2]);
  const H2 = [E[0] + v2[0] - S[0], E[1] + v2[1] - S[1], E[2] + v2[2] - S[2]];
  OPQ.fromTo(_aq, 12, H2[0], H2[1], H2[2], tv[0], tv[1], tv[2]);
  if (w < 1) OPQ.scale(_aq, 12, w);
  /* gira o braço inteiro: Q do antebraço é local, segue junto */
  opRotGlobal(rig, po, a, _aq, 12);
  opFK(rig, po, a + 1);
  if (qT) {
    _aq.set(po.G.subarray(c * 4, c * 4 + 4), 16);
    OPQ.lerp(_aq, 16, qT, 0, w);
    opSetGlobal(rig, po, c, _aq, 16);
    opFK(rig, po, c + 1);
  }
}
/* chave da recarga (fração do tempo → posição da mão esquerda: 0 guarda-mão, 1 carregador, 2 bolso do colete) */
const OP_RELOAD = [
  [0, 0],
  [0.12, 1],
  [0.3, 2],
  [0.44, 2],
  [0.6, 1],
  [0.74, 1],
  [0.88, 0],
  [1, 0],
];
function opReloadPt(rp) {
  for (let i = 1; i < OP_RELOAD.length; i++) {
    const a = OP_RELOAD[i - 1],
      b = OP_RELOAD[i];
    if (rp <= b[0]) {
      const k = smooth((rp - a[0]) / (b[0] - a[0] || 1));
      return [a[1], b[1], k];
    }
  }
  return [0, 0, 0];
}
function opSoles(ch) {
  const po = ch.po,
    X = ch.rig.idx,
    R = OPM.ref,
    W = po.W;
  [
    ['LeftFoot', 'LeftToeBase'],
    ['RightFoot', 'RightToeBase'],
  ].forEach((n, i) => {
    const f = X[n[0]] * 3,
      t = X[n[1]] * 3,
      sa = W[f + 1] - R.footH,
      sb = W[t + 1] - R.toeH;
    const p = sa <= sb ? [W[f], sa, W[f + 2]] : [W[t], sb, W[t + 2]];
    ch.legs[i].kn.position.set(-p[0], p[1] + 0.49, -p[2] + 0.04);
  });
}
/* ---------- camadas de tronco (Basic Shooter Pack): recarga, granada, levar tiro, recuo do disparo ----------
   Os clipes são do esqueleto inteiro; só os ossos do tronco para cima (Spine e filhos) entram, por cima da locomoção:
   as pernas continuam andando/correndo pelo ciclo da passada (pé não escorrega). A pose do tronco do clipe é recolocada
   em relação ao quadril da locomoção (mesma correção da pistola). */
function opUpMask(rig) {
  if (!rig.up) {
    const X = rig.idx;
    rig.up = new Uint8Array(rig.nb);
    for (let j = 0; j < rig.nb; j++) {
      let q = j;
      while (q >= 0 && q !== X.Spine) q = rig.par[q];
      rig.up[j] = q === X.Spine ? 1 : 0;
    }
  }
  return rig.up;
}
function opLayer(ch, po, c, t, w, loop) {
  if (!c || w <= 0.003) return;
  const rig = ch.rig,
    X = rig.idx,
    p2 = ch.po2,
    up = opUpMask(rig);
  opClear(p2);
  opAdd(rig, p2, c, t, loop, 1);
  opNorm(rig, p2);
  const sj = X.Spine * 4,
    hj = X.Hips * 4;
  OPQ.mul(_aq, 0, p2.Q, hj, p2.Q, sj);
  OPQ.imul(_aq, 4, po.Q, hj, _aq, 0);
  p2.Q.set(_aq.subarray(4, 8), sj);
  for (let j = 0; j < rig.nb; j++) if (up[j]) OPQ.lerp(po.Q, j * 4, p2.Q, j * 4, w);
}
/* quatérnio do osso j do clipe no instante t (s), sem laço */
function opSampleQ(rig, c, j, t, o, oi) {
  const F = rig.pack.F,
    e = c.b[j];
  if (e === -1 || e[1] === 1) {
    const q = e === -1 ? rig.Q0.subarray(j * 4, j * 4 + 4) : F.subarray(e[0], e[0] + 4);
    o[oi] = q[0];
    o[oi + 1] = q[1];
    o[oi + 2] = q[2];
    o[oi + 3] = q[3];
    return;
  }
  const f = Math.min(Math.max(t * c.fps, 0), c.n - 1 - 1e-4),
    i0 = f | 0,
    u = f - i0,
    a = e[0] + i0 * 4,
    b = a + 4;
  for (let k = 0; k < 4; k++) o[oi + k] = F[a + k] + (F[b + k] - F[a + k]) * u;
  const l = Math.hypot(o[oi], o[oi + 1], o[oi + 2], o[oi + 3]) || 1;
  for (let k = 0; k < 4; k++) o[oi + k] /= l;
}
const _fq = new Float32Array(16);
/* recuo do disparo: quanto o clipe de tiro se afasta da pose do 1º quadro vira um aditivo (amplificado) no tronco/cabeça/ombros */
const OP_FIRE_BONES = [
  ['Spine1', 3.6],
  ['Spine2', 5],
  ['Neck', 5],
  ['Head', 5],
  ['RightShoulder', 6.5],
  ['LeftShoulder', 4],
];
function opFireAdd(ch, po, since, k) {
  const rig = ch.rig,
    X = rig.idx,
    c = opmPack().clips.fire;
  if (!c || since >= c.dur || k <= 0.01) return;
  const t = since;
  for (const [n, amp] of OP_FIRE_BONES) {
    const j = X[n];
    if (j == null) continue;
    opSampleQ(rig, c, j, 0, _fq, 0);
    opSampleQ(rig, c, j, t, _fq, 4);
    _fq[0] = -_fq[0];
    _fq[1] = -_fq[1];
    _fq[2] = -_fq[2];
    OPQ.mul(_fq, 8, _fq, 0, _fq, 4); /* q0⁻¹ ⊗ qt */
    OPQ.scale(_fq, 8, amp * k);
    OPQ.mul(_fq, 12, po.Q, j * 4, _fq, 8);
    po.Q.set(_fq.subarray(12, 16), j * 4);
  }
  opFK(rig, po, X.Spine);
}
/* eventos: levar tiro (hp cai) e jogar granada (gadgetN cai com granada) disparam os clipes; devolve os pesos das camadas */
const OP_PUT = {
  t0: 2.4,
  t1: 8.4,
  rate: 2.4,
  hold: 6.0,
}; /* Putting_Down: abaixa (2,4 s) → solta (~6 s) → levanta (8,4 s) */
const OP_TOSS = {
  t0: 1.4,
  t1: 2.7,
  rate: 1.55,
}; /* trecho útil do clipe (arma o braço → lança → recolhe); a soltada fica ~0,3 s após o evento */
function opEvents(ch, a, dt) {
  const E =
      ch.ev ||
      (ch.ev = {
        hp: a.hp,
        gn: a.gadgetN,
        hit: null,
        toss: null,
        put: null,
        btn: null,
        hw: 0,
        hk: '',
        ht: 0,
      }),
    g = a.op && a.op.gadget;
  if (a.hp < E.hp - 0.5 && a.alive) E.hit = { t: 0 };
  E.hp = a.hp;
  if (a.gadgetN < E.gn && (g === 'frag' || g === 'impact' || g === 'flash')) E.toss = { t: 0 };
  if (a.gadgetN < E.gn && g && g !== 'frag' && g !== 'impact' && g !== 'flash') {
    if (g !== 'pulse') E.put = { t: 0 };
  }
  E.gn = a.gadgetN;
  const o = { hit: 0, toss: 0, tt: 0, ht: 0, put: 0, pt: 0, btn: 0, bt: 0, hw: 0, hk: '', hct: 0 };
  if (E.hit) {
    E.hit.t += dt;
    const d = 0.5,
      t = E.hit.t;
    o.hit = Math.min(1, t / 0.05) * (1 - sst(0.22, d, t));
    o.ht = t * 0.85;
    if (t >= d) E.hit = null;
  }
  if (E.toss) {
    E.toss.t += dt;
    const T = (OP_TOSS.t1 - OP_TOSS.t0) / OP_TOSS.rate,
      t = E.toss.t;
    o.toss = sst(0, 0.14, t) * (1 - sst(T - 0.2, T, t));
    o.tt = OP_TOSS.t0 + t * OP_TOSS.rate;
    if (t >= T) E.toss = null;
  }
  if (E.put) {
    E.put.t += dt;
    const T = (OP_PUT.t1 - OP_PUT.t0) / OP_PUT.rate,
      t = E.put.t;
    o.put = sst(0, 0.3, t) * (1 - sst(T - 0.4, T, t));
    o.pt = OP_PUT.t0 + t * OP_PUT.rate;
    if (t >= T) E.put = null;
  }
  /* ação contínua (plantar / reforçar / desarmar = abaixar e mexer no chão) */
  const ac = a.alive && a.act,
    hk = ac ? 'put' : E.hk;
  E.hw += ((ac ? 1 : 0) - E.hw) * (1 - Math.exp(-dt * (ac ? 7 : 5)));
  if (!ac && E.hw < 0.01) E.hk = '';
  if (ac) {
    E.hk = hk;
    const u = Math.min(1, ac.t / (ac.hold || 1));
    E.ht = OP_PUT.t0 + u * (OP_PUT.hold - OP_PUT.t0);
  }
  o.hw = E.hw;
  o.hk = E.hk;
  o.hct = E.ht;
  return o;
}
function animChar(ch, a, dt) {
  if (ch.proc) return animCharProc(ch, a, dt);
  const r = ch.root,
    k20 = 1 - Math.exp(-dt * 20);
  ch.animT = performance.now();
  if (!ch.disp) {
    ch.disp = new V3(a.pos.x, a.pos.y, a.pos.z);
    ch.dyaw = a.yaw;
    ch.fyaw = a.yaw;
  }
  if (ch.disp.distanceTo(a.pos) > 2.5) ch.disp.copy(a.pos);
  else {
    ch.disp.x += (a.pos.x - ch.disp.x) * k20;
    ch.disp.y += (a.pos.y - ch.disp.y) * k20;
    ch.disp.z += (a.pos.z - ch.disp.z) * k20;
  }
  if (!ch.rig) {
    if (ch.e && ch.e.ready) opmAttach(ch);
    if (!ch.rig) {
      r.position.set(ch.disp.x, ch.disp.y, ch.disp.z);
      r.rotation.y = a.yaw;
      return;
    }
  }
  /* longe da câmera: pose a meia taxa (a raiz continua suave todo quadro) */
  if (typeof camera !== 'undefined' && ch.scene === game && a.alive) {
    const cp = camera.position,
      dd = (cp.x - ch.disp.x) ** 2 + (cp.z - ch.disp.z) ** 2;
    if (dd > 22 * 22) {
      ch.acc = (ch.acc || 0) + dt;
      if (ch.acc < 1 / 28) {
        r.position.set(ch.disp.x, ch.disp.y, ch.disp.z);
        return;
      }
      dt = ch.acc;
    }
    ch.acc = 0;
  }
  dt = Math.min(dt, 0.1);
  if (!a.alive) return opDeath(ch, a, dt);
  const pk = opmPack(),
    rig = ch.rig,
    X = rig.idx,
    po = ch.po,
    K = ch.k,
    w = ch.weapon;
  if (ch.rg) opRagRevive(ch);
  /* renasceu: arma de volta na mão, raiz em pé */
  if (ch.fall || (w && w.g.parent !== ch.gunSlot)) {
    ch.fall = null;
    r.rotationQuaternion = null;
    r.rotation.set(0, a.yaw, 0);
    ch.fyaw = ch.dyaw = a.yaw;
    if (w) {
      const g = w.g;
      g.setParent(ch.gunSlot);
      g.rotationQuaternion = null;
      g.rotation.set(0, 0, 0);
      g.position.set(-w.grip.x, -w.grip.y, -w.grip.z);
      ch.drop = null;
    }
  }
  ch.dyaw = _ang(ch.dyaw, a.yaw, 1 - Math.exp(-dt * 18));
  const vx = a.vel.x,
    vz = a.vel.z,
    spRaw = Math.hypot(vx, vz),
    air = (!a.onGround && a.onGround !== undefined) || !!a.vault;
  K.sp += (spRaw - K.sp) * (1 - Math.exp(-dt * 12));
  const sp = K.sp;
  /* pés: em movimento seguem o corpo; parado, só giram quando a torção passa de ~45° (clipe de giro de 90°) */
  if (spRaw > 0.35 || air) {
    ch.turn = null;
    ch.fyaw = _ang(ch.fyaw, ch.dyaw, 1 - Math.exp(-dt * (spRaw > 1.5 ? 14 : 7)));
  } else if (!ch.turn) {
    const df = angDiff(ch.dyaw, ch.fyaw);
    if (Math.abs(df) > 0.8) {
      const s = df > 0 ? 1 : -1;
      ch.turn = {
        s,
        t: 0,
        f0: ch.fyaw,
        c: pk.clips[(a.crouchK > 0.5 ? 'cturn' : 'turn') + (s > 0 ? 'L' : 'R')],
      };
    }
  }
  let tw = 0,
    fyEff = ch.fyaw;
  if (ch.turn) {
    const T = ch.turn;
    T.t += dt * 1.7;
    const pr = T.t / T.c.dur;
    if (pr >= 1) {
      ch.fyaw = T.f0 + (T.s * Math.PI) / 2;
      ch.turn = null;
      fyEff = ch.fyaw;
    } else {
      tw = Math.min(1, T.t / 0.12);
      fyEff = T.f0 + ((T.s * Math.PI) / 2) * smooth(pr) * tw;
    }
  }
  r.position.set(ch.disp.x, ch.disp.y, ch.disp.z);
  r.rotationQuaternion = null;
  r.rotation.set(0, ch.fyaw, 0);
  /* velocidade no referencial dos pés (frente, esquerda) */
  const s = Math.sin(ch.fyaw),
    c = Math.cos(ch.fyaw),
    fwd = -(vx * s + vz * c),
    lft = -(vx * c - vz * s);
  if (spRaw > 0.2) {
    const th = Math.atan2(lft, fwd);
    K.dir = _ang(K.dir, th, 1 - Math.exp(-dt * 10));
  }
  const ck = clamp(a.crouchK || 0, 0, 1);
  K.mv += ((spRaw > 0.2 ? 1 : 0) - K.mv) * (1 - Math.exp(-dt * 9));
  K.spr += ((a.sprint ? 1 : 0) - K.spr) * (1 - Math.exp(-dt * 7));
  K.air += ((air ? 1 : 0) - K.air) * (1 - Math.exp(-dt * 10));
  const pist = w && w.hold === 'pistol' ? 1 : 0;
  K.pist += (pist - K.pist) * (1 - Math.exp(-dt * 12));
  /* direções vizinhas */
  let da = K.dir / (Math.PI / 4);
  da = ((da % 8) + 8) % 8;
  const d0 = Math.floor(da) % 8,
    d1 = (d0 + 1) % 8,
    du = da - Math.floor(da);
  const back = (d) => d === 3 || d === 4 || d === 5;
  /* andar → correr → disparada */
  const VW = 1.84,
    VR = 4.6,
    VS = 6.9;
  let gw = { w: 0, r: 0, s: 0 };
  if (sp <= VW) gw.w = 1;
  else if (sp <= VR) {
    const u = (sp - VW) / (VR - VW);
    gw.w = 1 - u;
    gw.r = u;
  } else {
    const u = clamp((sp - VR) / (VS - VR), 0, 1) * K.spr;
    gw.r = 1 - u;
    gw.s = u;
  }
  const dist = (g) =>
    0.5 * opClipDist(pk, g + '_' + OP_DIRS[d0]) + 0.5 * opClipDist(pk, g + '_' + OP_DIRS[d1]);
  const Dst = (gw.w * dist('w') + gw.r * dist('r') + gw.s * dist('s')) * (1 - ck) + dist('c') * ck;
  ch.ph = (ch.ph + (dt * Math.max(sp, 0.0)) / Math.max(0.5, Dst)) % 1;
  const tNow = performance.now() / 1000 + (a.id || 0) * 1.37;
  /* ---- pose base ---- */
  opClear(po);
  const m0 = (1 - K.air) * (1 - tw),
    mv = K.mv;
  const loc = (pre, wt) => {
    if (wt <= 1e-3) return;
    for (const [d, dw] of [
      [d0, 1 - du],
      [d1, du],
    ]) {
      if (dw < 1e-3) continue;
      let k = pre + '_' + OP_DIRS[d];
      if (pre === 's' && back(d)) k = 'r_' + OP_DIRS[d];
      const cl = pk.clips[k];
      opAdd(rig, po, cl, ch.ph * cl.dur, true, wt * dw);
    }
  };
  opAdd(rig, po, pk.clips.aim, tNow, true, (1 - ck) * (1 - mv) * m0);
  opAdd(rig, po, pk.clips.caim, tNow, true, ck * (1 - mv) * m0);
  loc('w', (1 - ck) * mv * m0 * gw.w);
  loc('r', (1 - ck) * mv * m0 * gw.r);
  loc('s', (1 - ck) * mv * m0 * gw.s);
  loc('c', ck * mv * m0);
  if (ch.turn) opAdd(rig, po, ch.turn.c, ch.turn.t, false, tw * (1 - K.air));
  opAdd(rig, po, pk.clips.jloop, tNow, true, K.air);
  opNorm(rig, po);
  /* ---- pistola: tronco do clipe de pistola, orientado no espaço do modelo (independe do quadril do fuzil) ---- */
  if (K.pist > 0.01) {
    const p2 = ch.po2;
    opClear(p2);
    opAdd(rig, p2, pk.clips.p_idle, tNow, true, 1);
    opNorm(rig, p2);
    if (!rig.up) {
      rig.up = new Uint8Array(rig.nb);
      for (let j = 0; j < rig.nb; j++) {
        let q = j;
        while (q >= 0 && q !== X.Spine) q = rig.par[q];
        rig.up[j] = q === X.Spine ? 1 : 0;
      }
    }
    const sj = X.Spine * 4,
      hj = X.Hips * 4;
    OPQ.mul(_aq, 0, p2.Q, hj, p2.Q, sj);
    OPQ.imul(_aq, 4, po.Q, hj, _aq, 0);
    p2.Q.set(_aq.subarray(4, 8), sj);
    for (let j = 0; j < rig.nb; j++) if (rig.up[j]) OPQ.lerp(po.Q, j * 4, p2.Q, j * 4, K.pist);
  }
  /* ---- camadas de tronco: recarga (clipe esticado no tempo da recarga do sim), granada, levar tiro ---- */
  K.rel += ((a.reloadT > 0 ? 1 : 0) - K.rel) * (1 - Math.exp(-dt * 9));
  const wd = WEAPONS[curW(a).id] || {},
    rp = a.reloadT > 0 ? clamp(1 - a.reloadT / (wd.reload || 2), 0, 1) : 0;
  if (a.reloadT > 0) ch.rpHold = rp;
  else if (K.rel < 0.03) ch.rpHold = 0;
  const EV = opEvents(ch, a, dt),
    relL = K.pist > 0.5 || !pk.clips.reload ? 0 : K.rel * (1 - K.pist),
    tossL = pk.clips.toss ? EV.toss : 0,
    hitL = pk.clips.hit ? EV.hit : 0;
  if (relL > 0.003)
    opLayer(
      ch,
      po,
      pk.clips.reload,
      (a.reloadT > 0 ? rp : ch.rpHold || 1) * pk.clips.reload.dur,
      relL,
      false
    );
  if (tossL > 0.003) opLayer(ch, po, pk.clips.toss, EV.tt, tossL, false);
  if (hitL > 0.003) opLayer(ch, po, pk.clips.hit, EV.ht, hitL * 1.6, false);
  const putL = pk.clips.put ? EV.put : 0,
    hL = pk.clips[EV.hk] ? EV.hw : 0;
  if (putL > 0.003) opLayer(ch, po, pk.clips.put, EV.pt, putL, false);
  if (hL > 0.003) opLayer(ch, po, pk.clips[EV.hk], EV.hct, hL, false);
  const lay = Math.max(relL, tossL, putL, hL);
  /* ---- inclinar (quadril para o lado) ---- */
  K.lean += ((a.lean || 0) - K.lean) * (1 - Math.exp(-dt * 10));
  const ln = K.lean;
  {
    const tw0 = clamp(angDiff(ch.dyaw, fyEff), -1.6, 1.6);
    po.P[0] -= ln * 0.07 * Math.cos(tw0);
    po.P[2] += ln * 0.07 * Math.sin(tw0);
  }
  po.P[1] -=
    Math.abs(ln) *
    0.02; /* o quadril vai para o lado da MIRA (não dos pés): senão, ao girar com a inclinação, o boneco entorta */
  opFK(rig, po);
  /* ---- coluna: torção (pés × mira), mira vertical, inclinação ---- */
  const since = typeof G !== 'undefined' ? G.clock - (a.fireT || -9) : 9,
    kick = since < 0.25 ? Math.exp(-since * 16) : 0;
  const twist = clamp(angDiff(ch.dyaw, fyEff), -1.6, 1.6),
    pitch = clamp(a.pitch || 0, -1.2, 1.2) + kick * 0.09,
    leanA = ln * 0.6;
  const cy = Math.cos(twist),
    sy = Math.sin(twist);
  const chain = [
    [X.Spine, 0.3, 0.18, 0.3],
    [X.Spine1, 0.3, 0.24, 0.35],
    [X.Spine2, 0.3, 0.24, 0.35],
    [X.Neck, 0.05, 0.12, 0],
    [X.Head, 0.05, 0.2, 0],
  ];
  let acc = 0;
  for (const [j, fy, fp, fl] of chain) {
    const p = rig.par[j];
    OPQ.mul(po.G, j * 4, po.G, p * 4, po.Q, j * 4);
    OPQ.axis(_aq, 0, 0, 1, 0, fy * twist);
    OPQ.axis(_aq, 4, cy, 0, -sy, -fp * pitch);
    OPQ.axis(_aq, 8, sy, 0, cy, fl * leanA);
    OPQ.mul(_aq, 12, _aq, 4, _aq, 8);
    OPQ.mul(_aq, 16, _aq, 0, _aq, 12);
    opRotGlobal(rig, po, j, _aq, 16);
  }
  opFK(rig, po);
  /* ---- arma: aponta para a mira (menos na disparada), recarga inclina a arma ---- */
  K.ads += ((a.ads || 0) - K.ads) * (1 - Math.exp(-dt * 10));
  const aimW = (1 - K.spr * 0.85) * (1 - K.air * 0.5) * (1 - lay * 0.92);
  opAimFix(ch, po, pitch - K.rel * 0.35 * (1 - lay), twist, aimW, K.pist);
  if (K.rel > 0.01 && !lay) {
    /* recarga: gira o pulso (arma de lado, cano para cima) */ const h = X.RightHand;
    OPQ.mul(_aq, 0, po.G, h * 4, OPM.ref.rifle.rot, 0);
    OPQ.rot(_av, 0, _aq, 0, 0, 0, -1);
    OPQ.axis(_aq, 4, _av[0], _av[1], _av[2], -0.55 * K.rel);
    opRotGlobal(rig, po, h, _aq, 4);
    opFK(rig, po, h + 1);
  }
  /* cabeça acompanha a mira */
  {
    const hj = X.Head;
    OPQ.mul(
      _aq,
      4,
      po.G,
      hj * 4,
      (() => {
        _aq[8] = -OPM.ref.G0[hj * 4];
        _aq[9] = -OPM.ref.G0[hj * 4 + 1];
        _aq[10] = -OPM.ref.G0[hj * 4 + 2];
        _aq[11] = OPM.ref.G0[hj * 4 + 3];
        return _aq;
      })(),
      8
    );
    OPQ.rot(_av, 0, _aq, 4, 0, 0, 1);
    const cp = Math.cos(pitch);
    OPQ.fromTo(
      _aq,
      12,
      _av[0],
      _av[1],
      _av[2],
      Math.sin(twist) * cp,
      Math.sin(pitch),
      Math.cos(twist) * cp
    );
    OPQ.scale(_aq, 12, 0.75 * (1 - K.spr * 0.5) * (1 - lay * 0.85));
    opRotGlobal(rig, po, hj, _aq, 12);
    opFK(rig, po, hj + 1);
  }
  /* ---- arma no ombro: mirando (e em prontidão alta), a mira vai para a frente do olho direito (IK do braço direito) ---- */
  /* recuo do disparo (clipe de tiro como aditivo) — depois da mira, para a mira do cano não cancelar o tranco do corpo */
  opFireAdd(ch, po, since, (1 - lay) * (1 - K.spr));
  const raise = w ? clamp(Math.max(K.ads, OP_READY * (1 - K.mv * 0.4)), 0, 1) : 0,
    ikW = w ? (1 - K.rel) * (1 - K.spr) * (1 - K.air) * (1 - tossL) * (1 - 0.6 * hitL) : 0;
  if (ikW > 0.01) {
    const S = OPM.ref[w.hold === 'pistol' ? 'pistol' : 'rifle'],
      hd = X.Head,
      R = OPM.ref;
    OPQ.axis(_aq, 0, 0, 1, 0, twist);
    OPQ.axis(_aq, 4, 1, 0, 0, -pitch);
    OPQ.mul(_aq, 8, _aq, 0, _aq, 4);
    OPQ.mul(_aq, 12, _aq, 8, OP_QG, 0); /* giro desejado do encaixe */
    /* olho direito agora: cabeça + (olho − cabeça no repouso) girado como a cabeça */
    _aq[16] = -R.G0[hd * 4];
    _aq[17] = -R.G0[hd * 4 + 1];
    _aq[18] = -R.G0[hd * 4 + 2];
    _aq[19] = R.G0[hd * 4 + 3];
    OPQ.mul(_aq, 20, po.G, hd * 4, _aq, 16);
    const eb = R.eye;
    OPQ.rot(_av, 0, _aq, 20, eb[0], eb[1], eb[2]);
    const cp = Math.cos(pitch),
      D = [Math.sin(twist) * cp, Math.sin(pitch), Math.cos(twist) * cp];
    const ed = w.hold === 'pistol' ? 0.42 : 0.17,
      eye = [
        po.W[hd * 3] + _av[0] + D[0] * ed,
        po.W[hd * 3 + 1] + _av[1] + D[1] * ed - 0.012,
        po.W[hd * 3 + 2] + _av[2] + D[2] * ed,
      ];
    const sS = [w.sight.x - w.grip.x, w.sight.y - w.grip.y, w.sight.z - w.grip.z];
    OPQ.rot(_av, 3, _aq, 12, sS[0], sS[1], sS[2]);
    /* posição do encaixe: entre a do clipe (prontidão baixa) e a do ombro (mira), conforme 'raise'; o giro sempre segue a mira */
    OPQ.rot(_av, 9, po.G, X.RightHand * 4, S.pos[0], S.pos[1], S.pos[2]);
    const rh = X.RightHand * 3,
      cur = [po.W[rh] + _av[9], po.W[rh + 1] + _av[10], po.W[rh + 2] + _av[11]];
    const P = v3m(cur, [eye[0] - _av[3], eye[1] - _av[4], eye[2] - _av[5]], raise);
    _aq[24] = -S.rot[0];
    _aq[25] = -S.rot[1];
    _aq[26] = -S.rot[2];
    _aq[27] = S.rot[3];
    OPQ.mul(_aq, 28, _aq, 12, _aq, 24); /* giro da mão */
    OPQ.rot(_av, 6, _aq, 28, S.pos[0], S.pos[1], S.pos[2]);
    const T = [P[0] - _av[6], P[1] - _av[7], P[2] - _av[8]];
    opIK2(rig, po, X.RightArm, X.RightForeArm, X.RightHand, T, _aq.slice(28, 32), ikW);
  }
  /* ---- mão esquerda no guarda-mão (ou no carregador / colete durante a recarga) ---- */
  if (w) {
    const S = OPM.ref[w.hold === 'pistol' ? 'pistol' : 'rifle'],
      h = X.RightHand;
    OPQ.mul(_aq, 0, po.G, h * 4, S.rot, 0);
    OPQ.rot(_av, 0, po.G, h * 4, S.pos[0], S.pos[1], S.pos[2]);
    const sp0 = [po.W[h * 3] + _av[0], po.W[h * 3 + 1] + _av[1], po.W[h * 3 + 2] + _av[2]];
    const fs = [w.fore.x - w.grip.x, w.fore.y - w.grip.y, w.fore.z - w.grip.z];
    let tgt = w.hold === 'pistol' ? [S.lw[0], S.lw[1], S.lw[2]] : v3a(fs, v3s(S.lw, S.lp));
    if (w.pump && WEAPONS[curW(a).id] && /sg/.test(WEAPONS[curW(a).id].cls || '')) {
      const pkk = since < 0.6 ? Math.sin(Math.PI * clamp((since - 0.12) / 0.4, 0, 1)) : 0;
      tgt[2] += pkk * 0.1;
      w.pump.position.copyFrom(w.pumpHome);
      w.pump.position.z += pkk * 0.1;
    }
    if (rp > 0 && w.hold !== 'pistol') {
      const [i0, i1, kk] = opReloadPt(rp),
        pts = [
          tgt,
          w.magHome
            ? v3a(
                [w.magHome.x - w.grip.x, w.magHome.y - w.grip.y - 0.06, w.magHome.z - w.grip.z],
                v3s(S.lw, S.lp)
              )
            : tgt,
          null,
        ];
      /* bolso do colete (espaço do modelo → espaço do encaixe) */
      const R = OPM.ref,
        pw = [0.11, R.belly.y, R.belly.f + 0.05];
      OPQ.irot(_av, 3, _aq, 0, pw[0] - sp0[0], pw[1] - sp0[1], pw[2] - sp0[2]);
      pts[2] = [_av[3], _av[4], _av[5]];
      tgt = v3m(pts[i0], pts[i1], kk);
    }
    if (w.mag) {
      const hide = rp > 0.2 && rp < 0.52;
      w.mag.position.copyFrom(w.magHome);
      if (rp > 0)
        w.mag.position.y -=
          rp < 0.2
            ? smooth(rp / 0.2) * 0.12
            : rp > 0.52 && rp < 0.66
              ? (1 - smooth((rp - 0.52) / 0.14)) * 0.12
              : 0;
      w.mag.setEnabled(!hide);
    }
    OPQ.rot(_av, 0, _aq, 0, tgt[0], tgt[1], tgt[2]);
    const T = [sp0[0] + _av[0], sp0[1] + _av[1], sp0[2] + _av[2]];
    OPQ.mul(_aq, 20, _aq, 0, S.lrot, 0);
    opIK2(
      rig,
      po,
      X.LeftArm,
      X.LeftForeArm,
      X.LeftHand,
      T,
      _aq.subarray(20, 24),
      (1 - relL) * (1 - tossL) * (1 - 0.5 * hitL)
    );
    /* arma some da mão enquanto a granada é jogada */
    {
      const hide = tossL > 0.4;
      if (w.g.isEnabled() === hide) w.g.setEnabled(!hide);
    }
  }
  opWrite(rig, po);
  opSoles(ch);
  ch.last.set(po.Q);
  ch.lastP.set(po.P);
}
/* ---- morte ---- */
function opTrueLow(ch) {
  try {
    ch.root.computeWorldMatrix(true);
    ch.pivot.computeWorldMatrix(true);
    for (const n of ch.pivot.getDescendants(false))
      n.computeWorldMatrix && n.computeWorldMatrix(true);
    let low = 1e9;
    const v = new B.Vector3(),
      sk = new Set();
    for (const m of ch.root.getChildMeshes(false))
      if (m.skeleton && m.isEnabled()) sk.add(m.skeleton);
    for (const k of sk) k.prepare(true);
    for (const m of ch.root.getChildMeshes(false)) {
      if (!m.isEnabled() || !m.skeleton || !m.getTotalVertices()) continue;
      const P = m.getPositionData(true, false),
        wm = m.getWorldMatrix();
      for (let i = 0; i < P.length; i += 6) {
        B.Vector3.TransformCoordinatesFromFloatsToRef(P[i], P[i + 1], P[i + 2], wm, v);
        if (v.y < low) low = v.y;
      }
    }
    return low < 1e8 ? low : null;
  } catch (e) {
    return null;
  }
}
const OP_DEATH = {
  d_fronth: [0, -1],
  d_backh: [0, 1],
  d_back: [0.6, 0.8],
  d_right: [0.7, -0.5],
  d_crouch: [0, 1],
};
function opDeath(ch, a, dt) {
  const r = ch.root,
    rig = ch.rig,
    po = ch.po,
    pk = opmPack(),
    X = rig.idx;
  if (ch.rg) {
    opRagStep(ch, a, dt);
    return;
  }
  if (!ch.fall && opRagOk(ch) && opRagStart(ch, a)) {
    opRagStep(ch, a, dt);
    return;
  }
  if (!ch.fall) {
    const hf = a.killFrom || (a.ai && a.ai.hurtFrom);
    const S = Math.sin(ch.fyaw),
      C = Math.cos(ch.fyaw);
    let fw = 1,
      rt = 0;
    if (hf) {
      const dx = hf.x - a.pos.x,
        dz = hf.z - a.pos.z,
        l = Math.hypot(dx, dz) || 1;
      fw = -(dx * S + dz * C) / l;
      rt = (dx * C - dz * S) / l;
    }
    /* candidatos pela direção do tiro; confere se cabe o corpo deitado */
    const o = new V3(a.pos.x, a.pos.y + 0.9, a.pos.z);
    const room = (k, mir) => {
      const d = OP_DEATH[k],
        mx = mir ? -d[0] : d[0],
        mz = d[1],
        wx = -mx * C - mz * S,
        wz = mx * S - mz * C;
      return typeof traceWorld === 'function' ? traceWorld(o, new V3(wx, 0, wz), 1.75).t : 9;
    };
    let cand = [];
    if (Math.abs(rt) > Math.abs(fw) * 1.2)
      cand = [
        ['d_right', rt < 0],
        ['d_fronth', false],
        ['d_backh', false],
      ];
    else if (fw >= 0)
      cand = [
        ['d_fronth', false],
        [a.crouchK > 0.5 ? 'd_crouch' : 'd_backh', false],
        ['d_right', rt < 0],
        ['d_right', rt >= 0],
      ];
    else
      cand = [
        [a.lastHead ? 'd_backh' : 'd_back', false],
        ['d_fronth', false],
        ['d_right', rt < 0],
      ];
    let best = cand[0],
      bt = -1;
    for (const cd of cand) {
      const t = room(cd[0], cd[1]);
      if (t >= 1.7) {
        best = cd;
        bt = t;
        break;
      }
      if (t > bt) {
        bt = t;
        best = cd;
      }
    }
    const c = pk.clips[best[0]];
    ch.fall = {
      c,
      mir: best[1],
      t: 0,
      rate: Math.max(1, c.dur / 1.8),
      q0: new Float32Array(4),
      p0: new Float32Array(3),
      f0: ch.fyaw,
    };
    opClear(ch.po2);
    opAdd(rig, ch.po2, c, 0, false, 1, best[1]);
    opNorm(rig, ch.po2);
    opFK(rig, ch.po2);
    ch.fall.q0.set(ch.po2.Q.subarray(0, 4));
    ch.fall.p0.set(ch.po2.P);
    /* gira o clipe (no espaço do modelo) para o corpo cair exatamente para longe do tiro */
    {
      opClear(ch.po2);
      opAdd(rig, ch.po2, c, c.dur, false, 1, best[1]);
      opNorm(rig, ch.po2);
      opFK(rig, ch.po2);
      const W = ch.po2.W,
        nk = X.Neck * 3,
        ux = W[nk] - W[0],
        uz = W[nk + 2] - W[2];
      const want = best[0] === 'd_fronth' ? Math.PI : best[0] === 'd_right' ? null : 0;
      ch.fall.rho = want == null ? 0 : angDiff(want, Math.atan2(ux, uz));
      ch.fall.lift = 0;
      ch.fall.chk = 0;
    }
    ch.deathT = 0;
    ch.needDrop = true;
  }
  const F = ch.fall;
  F.t = Math.min(F.c.dur, F.t + dt * F.rate);
  ch.deathT = F.t / F.c.dur;
  opClear(po);
  opAdd(rig, po, F.c, F.t, false, 1, F.mir);
  opNorm(rig, po);
  if (F.rho) {
    const rr = F.rho * smooth(Math.min(1, F.t / F.rate / 0.5));
    OPQ.axis(_aq, 0, 0, 1, 0, rr);
    OPQ.mul(_aq, 4, _aq, 0, po.Q, 0);
    po.Q.set(_aq.subarray(4, 8), 0);
    const cr = Math.cos(rr),
      sr = Math.sin(rr),
      x = po.P[0],
      z = po.P[2];
    po.P[0] = x * cr + z * sr;
    po.P[2] = -x * sr + z * cr;
  }
  /* deslocamento/giro do quadril → raiz: a raiz deita junto com o eixo do corpo (quadril→pescoço), sem rolar;
     o resto do giro fica no quadril. A pose desenhada é exatamente a do clipe. */
  opFK(rig, po);
  const hp = po.P.slice(0, 3),
    nk = X.Neck * 3,
    u = [po.W[nk] - hp[0], po.W[nk + 1] - hp[1], po.W[nk + 2] - hp[2]];
  {
    const l = Math.hypot(u[0], u[1], u[2]) || 1,
      e = Math.abs(u[1]) / l,
      f = 1 - sst(0.3, 0.62, e);
    u[1] *= 1 - f;
  } /* quase deitado → eixo no plano do chão */
  OPQ.fromTo(
    _aq,
    8,
    0,
    1,
    0,
    u[0],
    u[1],
    u[2]
  ); /* Δ: a raiz carrega só o "deitar" (sem rolar); o quadril guarda o resto */
  OPQ.imul(_aq, 0, _aq, 8, po.Q, 0);
  po.Q.set(_aq.subarray(0, 4), 0);
  po.P.set(F.p0);
  const hq = po.Q.slice(0, 4);
  OPQ.mul(hq, 0, _aq, 8, po.Q, 0);
  const bl = Math.min(1, F.t / F.rate / 0.18);
  if (bl < 1)
    for (let j = 0; j < rig.nb; j++) {
      _aq.set(ch.last.subarray(j * 4, j * 4 + 4), 12);
      OPQ.lerp(_aq, 12, po.Q, j * 4, bl);
      po.Q.set(_aq.subarray(12, 16), j * 4);
    }
  /* raiz: yaw(f0) ⊗ π ⊗ Δ ⊗ π⁻¹ ; posição: pos + rot(yaw⊗π, hp − Δ·p0) */
  OPQ.axis(_aq, 16, 0, 1, 0, F.f0 + Math.PI);
  OPQ.mul(_aq, 20, _aq, 16, _aq, 8);
  OPQ.axis(_aq, 24, 0, 1, 0, -Math.PI);
  OPQ.mul(_aq, 28, _aq, 20, _aq, 24);
  OPQ.rot(_av, 0, _aq, 8, F.p0[0], F.p0[1], F.p0[2]);
  OPQ.rot(_av, 3, _aq, 16, hp[0] - _av[0], hp[1] - _av[1], hp[2] - _av[2]);
  r.position.set(a.pos.x + _av[3], a.pos.y + _av[4] + F.lift, a.pos.z + _av[5]);
  const e = new B.Quaternion(_aq[28], _aq[29], _aq[30], _aq[31]).toEulerAngles();
  r.rotationQuaternion = null;
  r.rotation.set(e.x, e.y, e.z);
  opWrite(rig, po);
  /* encosta no chão: mede o vértice mais baixo da malha com pele (3 vezes durante a queda) e corrige a altura */
  if (F.chk < 3 && F.t >= F.c.dur * [0.5, 0.72, 0.96][F.chk]) {
    F.chk++;
    const low = opTrueLow(ch);
    if (low != null) F.liftT = clamp(F.lift + (a.pos.y - low), -0.12, 0.4);
  }
  if (F.liftT != null) F.lift += (F.liftT - F.lift) * (1 - Math.exp(-dt * 10));
  opWeaponDrop(ch, a, dt);
}

/* arma solta: vira objeto do mundo que cai até o chão e deita (usado pela morte por clipe e pelo ragdoll) */
function opWeaponDrop(ch, a, dt) {
  if (ch.needDrop) {
    ch.needDrop = false;
    const w = ch.weapon;
    if (w && w.g.parent) {
      const chain = [];
      for (let n = w.g; n; n = n.parent) chain.unshift(n);
      for (const n of chain) n.computeWorldMatrix(true);
      w.g.setParent(null);
      const g = w.g;
      ch.drop = {
        vy: 0,
        y0: a.pos.y + 0.045,
        t: 0,
        q0: (g.rotationQuaternion || B.Quaternion.Identity()).clone(),
        q1: B.Quaternion.RotationYawPitchRoll(
          ch.fyaw + rand(-0.7, 0.7),
          0,
          ((Math.random() < 0.5 ? -1 : 1) * Math.PI) / 2
        ),
      };
    }
  }
  if (ch.drop) {
    const D = ch.drop,
      g = ch.weapon.g;
    D.t += dt;
    if (g.position.y > D.y0) {
      D.vy -= 9.8 * dt;
      g.position.y = Math.max(D.y0, g.position.y + D.vy * dt);
    }
    if (g.rotationQuaternion)
      B.Quaternion.SlerpToRef(D.q0, D.q1, smooth(Math.min(1, D.t / 0.45)), g.rotationQuaternion);
  }
}
/* ---------- ragdoll (Havok, v4): o corpo cai fisicamente, empurrado na direção do tiro ----------
   Só na cena do jogo e com PHYS ativo; sem Havok (PHYS null) ou se algo falhar, vale o clipe de morte.
   Custo controlado: no máximo OP_RAG.max ragdolls vivos (o mais antigo congela na hora) e cada um congela depois de
   OP_RAG.life s ou ao parar (os corpos físicos são descartados; a pose final fica no esqueleto, sem custo). */
const OP_RAGS = [],
  OP_RAG = { max: 4, life: 4.2, calm: 0.5 };
function opRagOk(ch) {
  return (
    typeof PHYS !== 'undefined' &&
    !!PHYS &&
    !!B.Ragdoll &&
    ch.scene === game &&
    !ch.noRag &&
    !!ch.body &&
    !!ch.body.skeleton
  );
}
function opRagFreeze(ch) {
  const G_ = ch.rg;
  if (!G_ || G_.frozen) return;
  G_.frozen = true;
  try {
    G_.rd.dispose();
  } catch (e) {}
  const i = OP_RAGS.indexOf(ch);
  if (i >= 0) OP_RAGS.splice(i, 1);
  for (const m of ch.root.getChildMeshes(false)) m.alwaysSelectAsActiveMesh = false;
}
function opRagStart(ch, a) {
  const r = ch.root,
    sk = ch.body.skeleton;
  try {
    r.rotationQuaternion = null;
    r.rotation.set(0, ch.fyaw, 0);
    r.position.set(ch.disp.x, ch.disp.y, ch.disp.z);
    const links = sk.bones.map((b) => b.getTransformNode());
    if (OP_RAGS.length >= OP_RAG.max)
      return false; /* salva de mortes: o excedente cai pelo clipe (sem custo de física) */
    const rd = PHYS.ragdoll(sk, ch.body);
    if (!rd) throw new Error('sem Ragdoll');
    rd.ragdoll();
    const ag = rd._aggregates,
      hf = a.killFrom || (a.ai && a.ai.hurtFrom);
    let dx = 0,
      dz = 0;
    if (hf) {
      dx = a.pos.x - hf.x;
      dz = a.pos.z - hf.z;
      const l = Math.hypot(dx, dz) || 1;
      dx /= l;
      dz /= l;
    } else {
      dx = Math.sin(ch.fyaw);
      dz = Math.cos(ch.fyaw);
    }
    const hd = !!a.lastHead,
      vx = a.vel ? a.vel.x * 0.8 : 0,
      vz = a.vel ? a.vel.z * 0.8 : 0,
      names = sk.bones.length && rd._boneNames;
    ag.forEach((g, i) => {
      const nm = ((names && names[i]) || '').replace(/^.*:/, ''),
        k = /Spine/.test(nm)
          ? 1.25
          : /Head/.test(nm)
            ? hd
              ? 1.5
              : 1.25
            : /Hips/.test(nm)
              ? 1
              : 0.8;
      g.body.setLinearVelocity(
        new B.Vector3(
          vx + dx * 2.6 * k,
          0.7 + (/Spine|Head/.test(nm) ? 0.25 : 0),
          vz + dz * 2.6 * k
        )
      );
      g.body.setAngularVelocity(
        new B.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        )
      );
    });
    for (const m of r.getChildMeshes(false))
      m.alwaysSelectAsActiveMesh = true; /* a caixa de colisão da malha fica na pose em pé: não deixe a seleção cortar o corpo caído */
    ch.rg = { rd, t: 0, calm: 0, links, frozen: false, sk };
    OP_RAGS.push(ch);
    ch.needDrop = true;
    r.onDisposeObservable.add(() => opRagFreeze(ch));
    return true;
  } catch (e) {
    console.warn('ragdoll indisponível', e);
    ch.noRag = true;
    ch.rg = null;
    return false;
  }
}
/* crânio/capacete usam um esqueleto de 7 ossos preso aos MESMOS nós dos clipes: o ragdoll só move o esqueleto do corpo,
   então o quadril e o peito (ossos do ragdoll) são copiados de volta para os nós — a cabeça segue o pescoço por eles. */
const _rs = new B.Vector3(),
  _rq = new B.Quaternion(),
  _rp = new B.Vector3();
function opRagSkull(ch) {
  const G_ = ch.rg,
    X = ch.rig.idx;
  if (!G_.hb) {
    const f = (n) => G_.sk.bones.find((b) => b.name.endsWith(':' + n));
    G_.hb = [
      ['Hips', f('Hips'), ch.rig.tn[X.Hips], true],
      ['Spine2', f('Spine2'), ch.rig.tn[X.Spine2], false],
    ];
  }
  for (const [n, bo, tn, pos] of G_.hb) {
    if (!bo || !tn) continue;
    bo.getLocalMatrix().decompose(_rs, _rq, _rp);
    tn.rotationQuaternion.copyFrom(_rq);
    if (pos) tn.position.copyFrom(_rp);
  }
}
function opRagStep(ch, a, dt) {
  const G_ = ch.rg;
  G_.t += dt;
  if (!G_.frozen) {
    const v = G_.rd._aggregates[0].body.getLinearVelocity();
    const sp = Math.hypot(v.x, v.y, v.z);
    if (G_.t > 1.2 && sp < 0.22) G_.calm += dt;
    else G_.calm = 0;
    if (G_.t > OP_RAG.life || G_.calm > OP_RAG.calm) opRagFreeze(ch);
  }
  opRagSkull(ch);
  const w = ch.weapon;
  if (w && !w.g.isEnabled()) w.g.setEnabled(true);
  opWeaponDrop(ch, a, dt);
}
/* renasceu depois de ragdoll: religa os ossos aos nós que o animChar escreve */
function opRagRevive(ch) {
  const G_ = ch.rg;
  if (!G_) return;
  opRagFreeze(ch);
  G_.sk.bones.forEach((b, i) => b.linkTransformNode(G_.links[i]));
  ch.rg = null;
  ch.rgUsed = false;
  ch.root.rotationQuaternion = null;
  ch.root.rotation.set(0, ch.fyaw, 0);
  G_.sk.prepare(true);
}
/* ---------- 1ª pessoa ----------
   pose por tipo de empunhadura: escala da arma, posição no quadril (câmera, metros) e giro de repouso.
   Pistola: duas mãos, braços estendidos, cano reto para a frente (antes ficava torta e longe). */
const VM_POSE = {
  pistol: { s: 0.62, hip: [0.075, -0.108, -0.28], rot: [0, 0, 0] },
  long: { s: 0.7, hip: [0.115, -0.132, -0.2], rot: [0, 0, 0] },
  sg: { s: 0.68, hip: [0.115, -0.13, -0.19], rot: [0, 0, 0] },
};
VM.pose = VM_POSE;
function vmPose(I) {
  return VM_POSE[
    I.hold === 'pistol' ? 'pistol' : I.cls === 'sg' || I.cls === 'sgs' ? 'sg' : 'long'
  ];
}
function updateVM(dt) {
  const a = player,
    show = a.alive && camMode === 'fp' && !(a.ads > 0.85 && WEAPONS[curW(a).id].ovl);
  if (VM.info && VM.info.sightM) {
    const op = SAVE.sightOp == null ? 1 : SAVE.sightOp;
    VM.info.sightM.visibility = 1 - (1 - op) * clamp(a.ads || 0, 0, 1);
  }
  if (VM.info && VM.info.dotM) {
    const dop = SAVE.dotOp == null ? 0.65 : SAVE.dotOp;
    VM.info.dotM.visibility = 1 - (1 - dop) * clamp(a.ads || 0, 0, 1);
  } /* lunetas são modeladas (como no Siege): só esconde com mira de tela cheia */
  vmRoot.setEnabled(show && !FPV.pending);
  if (!show || FPV.pending) {
    camera.minZ = 0.05;
    return;
  }
  /* trocar de arma: guarda a antiga (clipe Holster) e só então monta a nova (Draw) */
  if (
    VM.fp &&
    VM.key &&
    !VM.holstering &&
    vmWantKey().split('|')[0] !== VM.key.split('|')[0] &&
    !VM.noHolster
  ) {
    VM.holstering = true;
    VM.holsterT = 0;
  }
  if (VM.holstering) {
    VM.holsterT += dt * 1.7;
    const hc = FPV.cur && FPV.cur.clips[FPV_CLIPS[FPV.cur.k].holster];
    if (!hc || VM.holsterT >= hc.dur * 0.8) {
      VM.holstering = false;
      VM.holsterT = 0;
      buildVM();
      VM.drawT = 1;
    }
  } else buildVM();
  const wd = WEAPONS[curW(a).id],
    hand = SAVE.hand === 'left' ? -1 : 1,
    fp = VM.fp;
  const shot = VM.kick >= 0.999;
  VM.drawT = Math.max(0, VM.drawT - dt * (fp ? 1.9 : 2.6));
  VM.kick = Math.max(0, VM.kick - dt * 12);
  VM.throwT = Math.max(0, VM.throwT - dt);
  VM.meleeT = Math.max(0, VM.meleeT - dt * 2.2);
  VM.landDip = Math.max(0, VM.landDip - dt * 4);
  VM.clk = (VM.clk || 0) + dt;
  if (shot) VM.fireT = 0;
  else if (VM.fireT >= 0) VM.fireT += dt * 3;
  const sp = Math.hypot(a.vel.x, a.vel.z);
  /* arma viva: inclina ao andar de lado, recua um pouco ao avançar, afunda numa parada brusca, e o recuo volta com mola */
  {
    const cy = Math.cos(a.yaw),
      sy = Math.sin(a.yaw),
      lat = a.vel.x * cy - a.vel.z * sy,
      fwd = -a.vel.x * sy - a.vel.z * cy,
      e = 1 - Math.exp(-dt * 8);
    VM.latK += (clamp(lat / 4, -1, 1) - VM.latK) * e;
    VM.fwdK += (clamp(fwd / 4, -1, 1) - VM.fwdK) * e;
    const brake = dt > 0 ? (VM.spPrev - sp) / dt : 0;
    if (brake > 12) VM.stopDip = Math.max(VM.stopDip, clamp(brake / 40, 0, 1));
    VM.stopDip = Math.max(0, VM.stopDip - dt * 5);
    VM.spPrev = sp;
    if (shot) VM.rsv += 0.34;
    const n = Math.max(1, Math.ceil(dt / 0.008)),
      h = dt / n;
    for (let i = 0; i < n; i++) {
      VM.rsv += (-230 * VM.rsx - 15 * VM.rsv) * h;
      VM.rsx += VM.rsv * h;
    }
    VM.rsx = clamp(VM.rsx, -0.05, 0.05);
  }
  if (a.onGround) VM.bobT += dt * sp * 1.55;
  const bob = SAVE.bob ? clamp(sp / 5, 0, 1) * (1 - a.ads * 0.85) : 0;
  {
    /* inércia do mouse: a arma volta ao centro com mola levemente solta (passa um pouco e assenta).
       Inclinado: mola bem mais dura (arma quase travada no eixo da câmera). */
    const lk = Math.abs(a.lean || 0) > 0.04 ? 1 : 0,
      kK = 90 + lk * 600,
      cK = 11 + lk * 45,
      n = Math.max(1, Math.ceil(dt / 0.008)),
      h = dt / n;
    VM.swvX = VM.swvX || 0;
    VM.swvY = VM.swvY || 0;
    for (let i = 0; i < n; i++) {
      VM.swvX += (-kK * VM.swayX - cK * VM.swvX) * h;
      VM.swvY += (-kK * VM.swayY - cK * VM.swvY) * h;
      VM.swayX += VM.swvX * h;
      VM.swayY += VM.swvY * h;
    }
    VM.swayX = clamp(VM.swayX, -0.07, 0.07);
    VM.swayY = clamp(VM.swayY, -0.06, 0.06);
  }
  const PO = vmPose(VM.info),
    ads = easeAds(clamp(a.ads, 0, 1)),
    sg = VM.info.sight,
    gp = VM.info.grip,
    fk = vmFovK(),
    s = PO.s * (SAVE.vmSize || 1) * fk * (wd.vs || 1);
  /* mirando: o ponto da mira fica no eixo da câmera, à distância de olho da mira (luneta mais perto, ferro mais longe) */
  const hip = new V3(PO.hip[0] * hand * fk, PO.hip[1] * fk, PO.hip[2] * fk),
    eyeD = Math.max((VM.info.eye || 0.2) * (VM.eyeK || 1), VM.eyeMin || 0.08),
    aim = new V3(-(sg.x - gp.x) * s * hand, -(sg.y - gp.y) * s, -eyeD - (sg.z - gp.z) * s);
  camera.minZ =
    0.02 +
    clamp(
      (eyeD - 0.1) * ads,
      0,
      0.1
    ); /* ADS: corta a ponta traseira da arma que fica colada na câmera; sem corte: a coronha (I.rear) some no ADS e o resto da arma é visto inteiro */
  const p = hip.lerp(aim, ads);
  const dr = fp ? 0 : VM.drawT; /* com mãos reais, o saque vem do clipe Draw */
  p.x += Math.sin(VM.bobT) * 0.012 * bob + VM.swayX * 0.25;
  p.y +=
    Math.sin(VM.bobT * 2) * 0.007 * bob -
    VM.landDip * 0.04 -
    dr * 0.3 -
    a.crouchK * 0.01 * (1 - ads);
  p.z += VM.kick * (0.035 - 0.015 * ads);
  {
    const lv = 1 - ads * 0.8;
    p.x -= VM.latK * 0.007 * lv;
    p.z += VM.fwdK * 0.006 * lv;
    p.y -= VM.stopDip * 0.012 * lv;
  }
  /* respiração (parado) */
  const br = (1 - bob) * (1 - ads * 0.6);
  p.y += Math.sin(VM.clk * 1.6) * 0.0016 * br;
  p.x += Math.sin(VM.clk * 0.9) * 0.0008 * br;
  /* correr: arma baixa e de lado, balanço maior · inclinar: arma acompanha */
  VM.sprintK += ((a.sprint ? 1 : 0) - VM.sprintK) * (1 - Math.exp(-dt * 10));
  const sk = VM.sprintK;
  p.x -= 0.06 * sk * hand;
  p.y -= 0.05 * sk + Math.abs(Math.sin(VM.bobT)) * 0.02 * sk;
  p.z += 0.03 * sk;
  const r0 = 1 - ads;
  let rx =
      PO.rot[0] * r0 +
      VM.kick * (0.07 - 0.04 * ads) -
      dr * 0.9 +
      VM.swayY -
      0.55 * sk +
      Math.sin(VM.bobT * 2) * 0.03 * sk +
      Math.sin(VM.clk * 1.6 + 1) * 0.0025 * br,
    ry = PO.rot[1] * r0 * hand + VM.swayX + 0.75 * sk * hand,
    rz = PO.rot[2] * r0 * hand + 0.35 * sk * hand;
  rx += VM.rsx * (1 - 0.55 * ads) + VM.stopDip * 0.03 * (1 - ads);
  rz -= VM.latK * 0.055 * (1 - ads * 0.75);
  const rp = a.reloadT > 0 ? 1 - a.reloadT / wd.reload : 0;
  if (!fp) {
    const rs = Math.sin(Math.PI * rp);
    rz += rs * 0.45 * hand;
    rx += rs * 0.18;
  } else if (rp > 0) {
    const k = Math.sin(Math.PI * clamp((rp - 0.12) / 0.76, 0, 1));
    p.y += k * 0.06;
    p.x += k * 0.03 * hand;
    p.z -= k * 0.02;
  } /* recarga: sobe a arma para a mão de apoio e o carregador não saírem da tela (janelas mais quadradas) */
  const I = VM.info;
  if (!fp && I.mag) {
    const drop =
      rp > 0 ? (rp < 0.35 ? smooth(rp / 0.35) : rp < 0.7 ? 1 - smooth((rp - 0.35) / 0.35) : 0) : 0;
    I.mag.position.copyFrom(I.magHome);
    I.mag.position.y -= drop * 0.35;
    I.mag.setEnabled(!(rp > 0.3 && rp < 0.42));
  }
  if (!fp && VM.arms) {
    VM.arms.R.position.set(
      0,
      -ads * 0.05,
      ads * 0.04
    ); /* mirando, a mão de trás desce um pouco (não cobre a tela) */
    VM.arms.L.position.copyFrom(VM.arms.lHome);
    VM.arms.L.position.y -= ads * 0.02;
    if (rp > 0) {
      const k = Math.sin(Math.PI * clamp(rp * 1.3, 0, 1));
      VM.arms.L.position.y -= k * 0.12;
      VM.arms.L.position.z += k * 0.12;
    }
  }
  let pk = 0;
  if (I.pump) {
    VM.pumpT = Math.max(0, VM.pumpT - dt);
    const k = VM.pumpT > 0 ? Math.sin(Math.PI * (1 - VM.pumpT / 0.55)) : 0;
    I.pump.position.copyFrom(I.pumpHome);
    I.pump.position.z += k * 0.12;
    pk = k * 0.12;
    if (!fp && VM.arms) VM.arms.L.position.z += k * 0.12;
  }
  if (VM.throwT > 0 && !fp) {
    const k = Math.sin(Math.PI * (1 - VM.throwT / 0.4));
    p.y -= k * 0.25;
    rx -= k * 0.6;
  }
  if (VM.meleeT > 0) {
    const k = Math.sin(Math.PI * (1 - VM.meleeT));
    p.x -= k * 0.12 * hand;
    p.z -= k * 0.18;
    ry += k * 0.6 * hand;
    rz += k * 0.4 * hand;
  }
  vmRoot.position.set(p.x, p.y, p.z);
  vmRoot.rotation.set(rx, ry, rz);
  vmRoot.scaling.set(SAVE.hand === 'left' ? -s : s, s, s);
  /* mãos reais: escolhe o clipe (recarga amarrada ao tempo da simulação; saque/guardar/tiro por tempo) */
  if (fp) {
    const rig = FPV.cur,
      cl = rig ? fpvClips(rig) : null;
    if (rig) {
      let st = 'idle',
        t = 0;
      if (VM.holstering) {
        st = 'holster';
        t = VM.holsterT;
      } else if (a.reloadT > 0) {
        const emp = curW(a).mag === 0;
        st = emp ? 'rempty' : 'reload';
        const c = rig.clips[emp ? cl.rempty : cl.reload];
        t = rp * c.dur;
      } else if (VM.drawT > 0) {
        st = 'draw';
        const c = rig.clips[cl.draw];
        t = (1 - VM.drawT) * c.dur;
      }
      /* gadget/granada: ao gastar uma unidade, as duas mãos soltam a arma e fazem o clipe de arremesso */
      if (VM.gn != null && a.alive && a.gadgetN < VM.gn && !VM.th && a.op) {
        VM.th = { t: 0, kind: a.op.gadget, rel: false };
        fpvHeld(a.op.gadget);
      }
      VM.gn = a.gadgetN;
      if (VM.th) {
        const tc = rig.clips[cl.throw];
        if (!tc) {
          VM.th = null;
        } else {
          VM.th.t += dt * 1.5;
          if (VM.th.t >= tc.dur) {
            VM.th = null;
            fpvHeld(null);
          } else {
            st = 'throw';
            t = VM.th.t;
            if (!VM.th.rel && t > tc.dur * 0.55) {
              VM.th.rel = true;
              if (FPV.held) FPV.held.setEnabled(false);
            }
          }
        }
      }
      if (VM.force) {
        st = VM.force.st;
        t = VM.force.t;
      }
      fpvStep(dt, {
        st,
        t,
        fireT: VM.fireT == null ? -1 : VM.fireT,
        fireW: st === 'idle' || st === 'draw' ? 1 : 0.3,
        pump: pk,
        blend: 0.14,
      });
    }
  }
  I.flash.material.alpha = Math.max(0, I.flash.material.alpha - dt * 25);
  if (I.rear) I.rear.setEnabled(a.ads < 0.55);
}
