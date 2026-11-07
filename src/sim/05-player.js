/* =====================================================================
   CONTROLE DO JOGADOR E DRONE
   A camada de entrada preenche INPUT; a simulação só lê INPUT.
   (No multiplayer, o servidor recebe exatamente este objeto de cada jogador.)
   ===================================================================== */
const INPUT = {
  fwd: 0,
  side: 0,
  walk: false,
  sprint: false,
  crouch: false,
  lean: 0,
  ads: false,
  fire: false,
  interact: false,
  vault: false,
  reload: false,
  gadget: false,
  melee: false,
  slot: null,
  ping: false,
  jump: false,
};
const MV = {
  ACCEL: 17,
  FRIC: 10,
  STOP: 3.0,
  GRAV: 18,
}; /* v5.4.1: arranca em ~60 ms e para em ~140 ms (antes ~105 ms / ~350 ms: sensação de atraso) */
function accelerate(v, wx, wz, wish, acc, dt) {
  const cur = v.x * wx + v.z * wz,
    add = wish - cur;
  if (add <= 0) return;
  let as = acc * dt * wish;
  if (as > add) as = add;
  v.x += as * wx;
  v.z += as * wz;
}
function friction(v, dt) {
  const sp = Math.hypot(v.x, v.z);
  if (sp < 0.05) {
    v.x = v.z = 0;
    return;
  }
  const ctrl = sp < MV.STOP ? MV.STOP : sp;
  const ns = Math.max(0, sp - ctrl * MV.FRIC * dt) / sp;
  v.x *= ns;
  v.z *= ns;
}
/* câmera do drone: continua nela mesmo com o drone destruído (sinal perdido) até a fase de ação */
const droneCam = () =>
  G.phase === 'prep' && player.side === 'atk' && drone.active && player.alive && !player.bot;
const piloting = () =>
  G.phase === 'prep' &&
  player.side === 'atk' &&
  drone.alive &&
  drone.active &&
  player.alive &&
  !player.bot;

function playerStep(dt) {
  stepAgentInput(player, INPUT, dt, false);
}
/* passo de entrada de UM agente humano (local: INPUT; servidor: comando do jogador). moveOnly = só movimento (predição do cliente) */
function stepAgentInput(a, I, dt, moveOnly) {
  if (!a.alive) return;
  if (a === player && droneCam()) {
    if (drone.alive) droneStep(dt);
    a.vel.set(0, 0, 0);
    clearEdges(I);
    return;
  }
  if (G.phase === 'prep' && a.side === 'atk') {
    a.vel.set(0, 0, 0);
    clearEdges(I);
    return;
  } /* atacante fica na base durante a preparação (como no Siege) */
  /* agachar e inclinar */
  a.crouchK = clamp(a.crouchK + (I.crouch ? 1 : -1) * dt * 8, 0, 1);
  let lt = a.vault ? 0 : I.lean;
  if (lt) {
    const e = new V3(a.pos.x, a.pos.y + EYE - (EYE - EYE_C) * a.crouchK, a.pos.z),
      side = new V3(Math.cos(a.yaw) * lt, 0, -Math.sin(a.yaw) * lt);
    const tw = traceWorld(e, side, 0.6, true);
    if (tw.t < 0.6) lt *= clamp((tw.t - 0.15) / 0.45, 0, 1);
  }
  a.lean += clamp(lt - a.lean, -dt * 9, dt * 9);
  /* mirar (botão direito) */
  /* correr (Shift): só para frente, em pé, sem mirar; ao parar há um atraso curto para atirar */
  const wantSprint =
    I.sprint &&
    I.fwd > 0 &&
    a.crouchK < 0.3 &&
    !I.ads &&
    a.reloadT <= 0 &&
    !a.act &&
    a.onGround &&
    Math.abs(a.lean) < 0.1;
  if (a.sprint && !wantSprint) a.sprintOut = 0.2;
  a.sprint = wantSprint;
  /* mirar (botão direito): tempo depende da arma */
  const canAds = I.ads && a.reloadT <= 0 && !a.act && a.meleeCD < 0.3 && !a.sprint;
  a.ads = clamp(
    a.ads + (((canAds ? 1 : -1) * dt) / (WEAPONS[curW(a).id].adsT || 0.22)) * (canAds ? 1 : 1.4),
    0,
    1
  );
  /* escalar caixa */
  if (a.vault) {
    a.vault.t += dt / 0.42;
    const k = smooth(Math.min(1, a.vault.t));
    a.pos.x = a.vault.from.x + (a.vault.to.x - a.vault.from.x) * k;
    a.pos.z = a.vault.from.z + (a.vault.to.z - a.vault.from.z) * k;
    a.pos.y =
      a.vault.from.y +
      (a.vault.to.y - a.vault.from.y) * Math.min(1, k * 1.6) +
      Math.sin(k * Math.PI) * 0.25;
    if (a.vault.t >= 1) {
      a.pos.copy(a.vault.to);
      a.vault = null;
      a.onGround = true;
      a.vy = 0;
    }
    clearEdges(I);
    return;
  }
  /* movimento com aceleração e atrito (parada rápida ao soltar/inverter) */
  let fx = 0,
    fz = 0;
  if (!a.act && G.phase !== 'over') {
    fx = I.side;
    fz = -I.fwd;
  }
  const l = Math.hypot(fx, fz);
  if (l > 0) {
    fx /= l;
    fz /= l;
  }
  const s = Math.sin(a.yaw),
    c = Math.cos(a.yaw),
    wx = fx * c + fz * s,
    wz = -fx * s + fz * c;
  let maxs = speedOf(a);
  if (a.sprint) maxs *= 1.35;
  else if (I.walk) maxs *= 0.48;
  if (a.crouchK > 0.5) maxs *= 0.45;
  if (a.ads > 0.5) maxs *= 0.62;
  if (a.slowT > 0) maxs *= 0.35;
  if (a.onGround) {
    friction(a.vel, dt);
    if (l > 0) accelerate(a.vel, wx, wz, maxs, MV.ACCEL, dt);
  } else a.vy -= MV.GRAV * dt;
  if (I.vault && a.onGround) {
    tryVault(a);
    if (a.vault) {
      clearEdges(I);
      return;
    }
  }
  a.pos.y += a.vy * dt;
  moveBy(a, a.vel.x * dt, a.vel.z * dt);
  const g = groundAt(a.pos, a.pos.y);
  if (a.onGround) {
    if (a.pos.y > g + 0.05) {
      a.onGround = false;
      a.vy = 0;
    } else a.pos.y = g;
  } else if (a.vy <= 0 && a.pos.y <= g) {
    const imp = -a.vy;
    a.pos.y = g;
    a.vy = 0;
    a.onGround = true;
    a.landT = 0.25;
    if (!MP.replay) HOOK.land(imp);
  }
  if (moveOnly) {
    clearEdges(I);
    return;
  }
  /* ações */
  tickAct(a, dt, I.interact && G.phase !== 'end');
  if (I.slot && a.w[I.slot] && a.cur !== I.slot) {
    a.cur = I.slot;
    a.reloadT = 0;
    a.fireCD = 0.4;
    a.act = null;
    a.ads = 0;
    HOOK.draw(a);
  }
  if (I.reload) startReload(a);
  if (I.gadget) useGadget(a);
  if (I.melee && melee(a)) {
  }
  const wd = WEAPONS[curW(a).id];
  if (I.fire && (G.phase === 'action' || (G.phase === 'prep' && a.side === 'def')) && !a.act) {
    if (wd.auto || !a.triggerHeld) {
      if (fire(a, 0)) recoil(a, wd);
    }
    a.triggerHeld = true;
  } else if (!I.fire) {
    if (a.triggerHeld && a.recAcc > 0) {
      a.recRet += a.recAcc * 0.3;
      a.recAcc = 0;
    }
    a.triggerHeld = false;
  }
  /* recuo: a mira sobe e anda de lado seguindo um padrão fixo; ao soltar o gatilho volta só 30% */
  if (a.recRet > 0) {
    const d = a.recRet * Math.min(1, dt * 9);
    a.pitch -= d;
    a.recRet -= d;
    if (a.recRet < 1e-4) a.recRet = 0;
  }
  a.punch -= a.punch * Math.min(1, dt * 18);
  if (a.punchYaw) {
    const d = a.punchYaw * Math.min(1, dt * 10);
    a.yaw += d;
    a.punchYaw -= d;
  }
  a.pitch = clamp(a.pitch, -1.45, 1.45);
  clearEdges(I);
}
function recoil(a, wd) {
  const R = wd.rec;
  if (!R) return;
  const i = a.shots - 1;
  const m = (a.ads > 0.5 ? 0.85 : 1) * (a.crouchK > 0.5 ? 0.85 : 1);
  const pat = REC_PAT[R.pat] || REC_H,
    v = R.v * (i < 2 ? 0.7 : i < 10 ? 1 : 0.85) * m * (i < 3 && R.first ? R.first : 1),
    h =
      R.h *
      pat[i % pat.length] *
      m; /* cada arma tem seu padrão lateral; freio de boca alivia os primeiros tiros */
  a.pitch += v;
  a.recAcc += v;
  a.punchYaw += h;
  a.punch += v * 0.5;
} /* punch: só um tranco visual da câmera */
function clearEdges(I) {
  I = I || INPUT;
  I.vault = I.reload = I.gadget = I.melee = I.ping = I.jump = false;
  I.slot = null;
}
function tryVault(a) {
  const f = dirFrom(a.yaw, 0);
  for (const d of [0.9, 1.4]) {
    const tx = a.pos.x + f.x * d,
      tz = a.pos.z + f.z * d,
      cx = Math.floor(tx / CELL),
      cz = Math.floor(tz / CELL);
    if (cellAt(cx, cz) === 2 && a.pos.y < CRATE_H - 0.1) {
      const to = new V3(a.pos.x + f.x * (d + 0.5), CRATE_H, a.pos.z + f.z * (d + 0.5));
      if (cellAt(Math.floor(to.x / CELL), Math.floor(to.z / CELL)) !== 2)
        to.set(cc(cx), CRATE_H, cc(cz));
      a.vault = { t: 0, from: a.pos.clone(), to };
      a.vel.set(0, 0, 0);
      if (!MP.replay) HOOK.sound('vault');
      return;
    }
  }
}
/* ---------- drone de reconhecimento (ataque, preparação) ---------- */
function droneStep(dt) {
  if (!drone.alive) return;
  const I = INPUT;
  let fx = I.side,
    fz = -I.fwd;
  const l = Math.hypot(fx, fz);
  if (l) {
    fx /= l;
    fz /= l;
  }
  const s = Math.sin(drone.yaw),
    c = Math.cos(drone.yaw),
    wx = fx * c + fz * s,
    wz = -fx * s + fz * c;
  friction(drone.vel, dt);
  if (l) accelerate(drone.vel, wx, wz, 5.5, 10, dt);
  if (I.jump && drone.pos.y <= 0.001) {
    drone.vy = 4.5;
    HOOK.sound('vault');
  }
  drone.vy -= MV.GRAV * dt;
  drone.pos.y = Math.max(0, drone.pos.y + drone.vy * dt);
  if (drone.pos.y <= 0) drone.vy = 0;
  const steps = Math.max(1, Math.ceil((Math.hypot(drone.vel.x, drone.vel.z) * dt) / 0.15));
  for (let i = 0; i < steps; i++) {
    drone.pos.x += (drone.vel.x * dt) / steps;
    drone.pos.z += (drone.vel.z * dt) / steps;
    resolve(drone.pos, 0.22, drone.pos.y, 'drone');
  }
  if (!G.siteKnown && inSite(SITES[G.siteKey], drone.pos)) {
    G.siteKnown = true;
    HOOK.siteFound();
  }
  if (I.ping) dronePing();
}
function dronePing() {
  if (jammed(drone.pos, player.team)) {
    HOOK.prompt('Sinal bloqueado', 1.4);
    HOOK.sound('deny');
    return;
  }
  const o = new V3(drone.pos.x, drone.pos.y + 0.22, drone.pos.z),
    dir = dirFrom(drone.yaw, drone.pitch);
  const tw = traceWorld(o, dir, 40, false, true);
  let best = null,
    bt = tw.t; /* a câmera do drone enxerga através do vidro inteiro (igual ao jogador e à IA) */
  for (const e of agents) {
    if (!e.alive || e.team === player.team) continue;
    const h = hitAgent(o, dir, e);
    if (h && h.t < bt) {
      bt = h.t;
      best = e;
    }
  }
  if (!best)
    best = agents.find((e) => {
      if (!e.alive || e.team === player.team) return false;
      const p = new V3(e.pos.x, e.pos.y + 1.2, e.pos.z);
      const v = p.clone().sub(o);
      const d = v.length();
      return d < 25 && v.normalize().dot(dir) > 0.985 && clearSight(o, p);
    });
  if (best) {
    best.spotT = Math.max(best.spotT, G.clock + 5);
    HOOK.prompt(`${best.name} marcado`, 1.5);
    HOOK.sound('ping');
  } else HOOK.sound('deny');
}

/* ---------- passo completo da simulação ---------- */
function simStep(dt) {
  if (G.phase === 'menu' || G.phase === 'over') return;
  G.clock += dt;
  stepFlow(dt);
  if (G.phase === 'menu' || G.phase === 'over') return;
  for (const a of agents) if (a.alive) tickAgent(a, dt);
  if (player.alive && !player.bot) playerStep(dt);
  if (MP.role === 'server') remoteStepAll(dt);
  for (const a of agents) {
    if (!a.alive || !a.bot) continue;
    if (G.phase === 'action' || G.phase === 'prep') AI.update(a, dt);
    else {
      a.vel.multiplyScalar(0.85);
      moveBy(a, a.vel.x * dt, a.vel.z * dt);
    }
  }
  separate();
  updateProjectiles(dt);
}
