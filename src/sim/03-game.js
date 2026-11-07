/* =====================================================================
   PARTIDA — agentes, rodadas, tiros, dano, equipamentos, bomba
   ===================================================================== */
const agents = [];
let player = null;
const teams = { A: { score: 0 }, B: { score: 0 } }; // A = time do jogador
const BOTNAMES = {
  A: ['Tuca', 'Brisa', 'Nando', 'Kiko'],
  B: ['Rato', 'Coruja', 'Grilo', 'Pardal', 'Zumbi'],
};
const G = {
  bans: { atk: null, def: null },
  pick: { zone: null, site: null },
  phase: 'menu',
  phaseT: 0,
  round: 0,
  clock: 0,
  siteKey: 'A',
  planted: null,
  siteKnown: false,
  reinf: 10,
  lastWin: null,
  autoplay: false,
  stats: { rounds: [] },
}; // stats: métricas para o QA
const projectiles = [];
const drone = {
  active: false,
  alive: false,
  pos: new V3(),
  vel: new V3(),
  vy: 0,
  yaw: 0,
  pitch: 0,
};

function mkW(id) {
  const d = WEAPONS[id];
  return { id, mag: d.mag, res: d.res };
}
function curW(a) {
  return a.w[a.cur] || a.w.s;
}
function makeAgent(name, team, isPlayer) {
  const a = {
    id: agents.length,
    name,
    team,
    isPlayer,
    bot: !isPlayer,
    op: null,
    side: 'atk',
    pos: new V3(),
    vel: new V3(),
    vy: 0,
    onGround: true,
    landT: 0,
    yaw: 0,
    pitch: 0,
    crouchK: 0,
    lean: 0,
    ads: 0,
    vault: null,
    hp: 100,
    alive: false,
    kills: 0,
    deaths: 0,
    hs: 0,
    w: { p: null, s: mkW('pistol') },
    cur: 'p',
    reloadT: 0,
    fireCD: 0,
    shots: 0,
    sinceShot: 9,
    gadgetN: 0,
    charges: [],
    spotT: -99,
    act: null,
    skins: {},
    meleeCD: 0,
    slowT: 0,
    blindT: 0,
    blindMax: 1,
    punch: 0,
    punchYaw: 0,
    sprint: false,
    sprintOut: 0,
    recAcc: 0,
    recRet: 0,
    fireT: -9,
    ai: {},
  };
  agents.push(a);
  return a;
}
player = makeAgent(SAVE.name || 'Você', 'A', true);
BOTNAMES.A.forEach((n) => makeAgent(n, 'A', false));
BOTNAMES.B.forEach((n) => makeAgent(n, 'B', false));

const roleAt = (t, r) => {
  let aAtk = (SAVE.startSide === 'atk') !== r > SWAP_AFTER;
  if (r === 2 * SWAP_AFTER + 1 && G.otRoleA) aAtk = G.otRoleA === 'atk';
  return t === 'A' ? (aAtk ? 'atk' : 'def') : aAtk ? 'def' : 'atk';
}; /* prorrogação (rodada 7, 3–3): o time que perdeu o sorteio escolhe o lado */
const roleOf = (t) => roleAt(t, G.round);
/* lado do time t na PRÓXIMA rodada (a escolha de operador acontece antes dela) */
const nextRoleOf = (t) => roleAt(t, G.round + 1);
const teamOfRole = (r) => (roleOf('A') === r ? 'A' : 'B');
const aliveOf = (role) => agents.filter((a) => a.alive && a.side === role);
function clearProps() {
  for (const p of PROPS) HOOK.propRemove(p);
  PROPS.length = 0;
  for (const pr of projectiles) HOOK.projRemove(pr);
  projectiles.length = 0;
  if (G.planted) HOOK.deviceRemove(G.planted);
}

/* ---------- ciclo da partida ---------- */
function newMatch() {
  teams.A.score = teams.B.score = 0;
  G.round = 0;
  G.otRoleA = null;
  G.stats.rounds = [];
  player.name = SAVE.name || 'Você';
  for (const a of agents) {
    a.kills = 0;
    a.deaths = 0;
    a.hs = 0;
    if (!a.isPlayer) {
      for (const w of WLIST) a.skins[w] = Math.random() < 0.45 ? 'padrao' : pick(SKINS).id;
    } else if (!a.rem) a.skins = SAVE.skins;
  }
  startRound();
}
function startRound() {
  G.round++;
  G.siteKey = !G.autoplay && roleOf('A') === 'def' && G.pick.site ? G.pick.site : pick(SITE_KEYS);
  /* defesa escolhe onde fica a bomba (tela de pré-partida) */ clearProps();
  G.planted = null;
  resetStructures();
  G.reinf = 10;
  G.phase = 'prep';
  G.phaseT = PREP_T;
  G.roundClock = 0;
  G.rs = {
    site: G.siteKey,
    planted: false,
    plantT: null,
    winner: null,
    reason: '',
    atkTeam: null,
    breaches: 0,
  };
  for (const t of ['A', 'B']) {
    const role = roleOf(t),
      list = agents.filter((a) => a.team === t);
    const pool = shuffle(OPS[role].filter((o) => G.autoplay || o.id !== G.bans[role]));
    let pi = 0;
    const zone = pick(ATK_SPAWNS);
    const defCells = shuffle(spawnCellsOf(SITES[G.siteKey].room));
    list.forEach((a, i) => {
      a.side = role;
      const mine = role === 'atk' ? SAVE.atkOp : SAVE.defOp;
      if (a.rem) a.op = mpOpFor(a, role);
      else if (a.isPlayer && !G.autoplay) a.op = opById(mine);
      else {
        let o = pool[pi++ % pool.length];
        if (t === 'A' && !G.autoplay && o.id === mine) o = pool[pi++ % pool.length];
        a.op = o;
      }
      Object.assign(a, {
        alive: true,
        hp: 100,
        cur: 'p',
        reloadT: 0,
        fireCD: 0,
        shots: 0,
        gadgetN: a.op.gn,
        act: null,
        lean: 0,
        ads: 0,
        slowT: 0,
        blindT: 0,
        spotT: -99,
        vault: null,
        punch: 0,
        punchYaw: 0,
        vy: 0,
        onGround: true,
        crouchK: 0,
        pitch: 0,
        charges: [],
        sprint: false,
        sprintOut: 0,
      });
      {
        const L = a.rem ? mpLoadoutOf(a) : loadoutOf(a.op, a.isPlayer && !G.autoplay);
        a.w = { p: mkW(L.p), s: mkW(L.s) };
      }
      let c;
      if (role === 'def') c = defCells[i % defCells.length];
      else {
        const zc = spawnCellsOf(
          a.isPlayer
            ? G.pick.zone != null && !G.autoplay
              ? ATK_SPAWNS[G.pick.zone]
              : zone
            : G.pick.zone != null && !G.autoplay && a.team === player.team && Math.random() < 0.6
              ? ATK_SPAWNS[G.pick.zone]
              : pick(ATK_SPAWNS)
        );
        c = zc[(Math.random() * zc.length) | 0];
      }
      a.pos.set(cc(c.x) + rand(-0.5, 0.5), 0, cc(c.z) + rand(-0.5, 0.5));
      a.vel.set(0, 0, 0);
      const s = SITES[G.siteKey],
        tgt = role === 'def' ? new V3((W * CELL) / 2, 0, (H * CELL) / 2) : siteCenter(s);
      a.yaw = Math.atan2(-(tgt.x - a.pos.x), -(tgt.z - a.pos.z));
      a.ai = {};
      HOOK.agentSpawn(a);
    });
  }
  G.rs.atkTeam = teamOfRole('atk');
  G.siteKnown = MP.role === 'server' || (player.side === 'def' && !G.autoplay);
  drone.active = !MP.role && player.side === 'atk' && !G.autoplay;
  drone.alive = drone.active;
  drone.left = 2;
  drone.redeployT = 0; /* 2 drones por rodada, como no Siege */
  if (drone.active) {
    drone.pos.copy(player.pos);
    drone.pos.y = 0;
    drone.vel.set(0, 0, 0);
    drone.vy = 0;
    drone.yaw = player.yaw;
    drone.pitch = 0;
  }
  AI.roundStart();
  HOOK.roundStart();
  const s = SITES[G.siteKey];
  HOOK.banner(
    `Rodada ${G.round} · Preparação`,
    player.side === 'atk'
      ? 'Você está no ataque · pilote o drone e encontre o objetivo'
      : `Você está na defesa · objetivo ${s.key}: ${s.name} · segure F para reforçar paredes`,
    '',
    4
  );
}
function endRound(w, reason) {
  if (G.phase === 'end' || G.phase === 'over') return;
  G.phase = 'end';
  G.phaseT = END_T;
  G.lastWin = w;
  teams[w].score++;
  for (const a of agents) {
    a.act = null;
    a.sprint = false;
    a.sprintOut = 0;
  } /* ninguém fica "correndo" congelado no fim da rodada */
  G.rs.winner = roleOf(w);
  G.rs.reason = reason;
  G.rs.dur = G.roundClock;
  G.stats.rounds.push(G.rs);
  const over = teams[w].score >= WIN_ROUNDS;
  HOOK.roundEnd(w, reason, over);
}
function stepFlow(dt) {
  G.roundClock = (G.roundClock || 0) + dt;
  if (G.phase === 'prep') {
    if (drone.active && !drone.alive && drone.redeployT > 0) {
      drone.redeployT -= dt;
      if (drone.redeployT <= 0) redeployDrone();
    }
    G.phaseT -= dt;
    if (G.phaseT <= 0) {
      G.phase = 'action';
      G.phaseT = ACTION_T;
      drone.active = false;
      HOOK.actionStart();
    }
  } else if (G.phase === 'action') {
    const P = G.planted;
    if (P) {
      P.t -= dt;
      G.phaseT = P.t;
      P.beep -= dt;
      if (P.beep <= 0) {
        P.beep = P.t < 10 ? 0.35 : 0.9;
        HOOK.sound('device', P.pos);
      }
    } else G.phaseT -= dt;
    if (!G.siteKnown && ACTION_T - G.phaseT > 30 && !P) {
      G.siteKnown = true;
      HOOK.prompt(`Objetivo revelado: ${SITES[G.siteKey].key} · ${SITES[G.siteKey].name}`, 3);
    }
    const A = teamOfRole('atk'),
      D = teamOfRole('def');
    if (aliveOf('def').length === 0) endRound(A, 'Defensores eliminados');
    else if (aliveOf('atk').length === 0 && !P) endRound(D, 'Atacantes eliminados');
    else if (P && P.t <= 0) {
      explode(P.pos, 4, 0, null, { structR: 2.5 });
      endRound(A, 'O desativador concluiu o trabalho');
    } else if (!P && G.phaseT <= 0) endRound(D, 'Tempo esgotado');
  } else if (G.phase === 'end') {
    G.phaseT -= dt;
    if (G.phaseT <= 0) {
      if (teams.A.score >= WIN_ROUNDS || teams.B.score >= WIN_ROUNDS) {
        G.phase = 'over';
        HOOK.matchOver();
      } else {
        const swap = G.round === SWAP_AFTER;
        if (G.pickBetween && !G.autoplay && HOOK.pickRound) {
          G.phase = 'pick';
          HOOK.pickRound(swap);
        } /* R6: escolha de operador/ponto a cada rodada */
        else {
          startRound();
          if (swap) HOOK.prompt('Troca de lado', 3);
        }
      }
    }
  }
}

/* ---------- mira, dispersão e disparo ---------- */
function speedOf(a) {
  const w = a.w && curW(a),
    d = w && WEAPONS[w.id];
  return ARMOR[a.op ? a.op.armor : 2].speed * ((d && d.mob) || 1);
} /* metralhadora/fuzil pesado deixam um pouco mais lento */
function spreadOf(a, d) {
  /* mirando é quase perfeito (o recuo é que tira a mira do lugar); do quadril abre bem mais */
  const ad = a.ads > 0.9;
  let s = d.spread * (ad ? 0.15 : 1.4 * (d.hipMul || 1)); /* laser: quadril mais preciso */
  const sp = Math.hypot(a.vel.x, a.vel.z),
    mx = speedOf(a);
  s += clamp((sp - mx * 0.3) / (mx * 0.55), 0, 1) * d.move * (ad ? 0.35 : 1);
  if (!a.onGround) s += 0.1;
  if (a.landT > 0) s += 0.04;
  if (a.crouchK > 0.5) s *= 0.75;
  if (d.auto) s += Math.min(a.shots, 12) * d.kick * 0.26 * (ad ? 0.15 : 1);
  if (a.bot && d.auto && !a.isPlayer)
    s +=
      Math.min(a.shots, 12) *
      d.kick *
      0.12; /* bots não puxam o recuo: abertura extra equivalente */
  return s;
}
function eyeOf(a, out) {
  out = out || new V3();
  const lp = a.lean || 0;
  out.set(a.pos.x, a.pos.y + EYE - (EYE - EYE_C) * a.crouchK, a.pos.z);
  if (lp) {
    out.x += Math.cos(a.yaw) * lp * 0.42;
    out.z -= Math.sin(a.yaw) * lp * 0.42;
    out.y -= Math.abs(lp) * 0.05;
  }
  return out;
}
function dirFrom(yaw, pitch, out) {
  out = out || new V3();
  const cp = Math.cos(pitch);
  return out.set(-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp);
}
function raySphere(o, d, cx, cy, cz, r) {
  const ox = o.x - cx,
    oy = o.y - cy,
    oz = o.z - cz;
  const b = ox * d.x + oy * d.y + oz * d.z;
  const c = ox * ox + oy * oy + oz * oz - r * r;
  const disc = b * b - c;
  if (disc < 0) return -1;
  const t = -b - Math.sqrt(disc);
  return t > 0 ? t : -1;
}
function rayCyl(o, d, cx, cz, r, y0, y1) {
  const ox = o.x - cx,
    oz = o.z - cz;
  const a = d.x * d.x + d.z * d.z;
  if (a < 1e-9) return -1;
  const b = 2 * (ox * d.x + oz * d.z),
    c = ox * ox + oz * oz - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return -1;
  const s = Math.sqrt(disc);
  for (const t of [(-b - s) / (2 * a), (-b + s) / (2 * a)]) {
    if (t > 0) {
      const y = o.y + d.y * t;
      if (y >= y0 && y <= y1) return t;
    }
  }
  return -1;
}
function headPos(e, out) {
  out = out || new V3();
  const lp = e.lean || 0;
  return out.set(
    e.pos.x + Math.cos(e.yaw) * lp * 0.42,
    e.pos.y + 1.6 - 0.48 * e.crouchK,
    e.pos.z - Math.sin(e.yaw) * lp * 0.42
  );
}
const _hp = new V3();
function hitAgent(o, d, e) {
  headPos(e, _hp);
  const th = raySphere(o, d, _hp.x, _hp.y, _hp.z, 0.14);
  const tb = rayCyl(o, d, e.pos.x, e.pos.z, 0.3, e.pos.y + 0.05, e.pos.y + 1.46 - 0.47 * e.crouchK);
  if (th > 0 && (tb < 0 || th < tb + 0.05)) return { t: th, head: true };
  if (tb > 0) return { t: tb, head: false };
  return null;
}
const _up = new V3(0, 1, 0);
function coneDir(dir, s) {
  if (s <= 0) return dir;
  const up = Math.abs(dir.y) < 0.99 ? _up : new V3(1, 0, 0);
  const r = new V3().crossVectors(dir, up).normalize(),
    u = new V3().crossVectors(r, dir);
  const ang = Math.random() * Math.PI * 2,
    rad = Math.sqrt(Math.random()) * s;
  return dir
    .addScaledVector(r, Math.cos(ang) * rad)
    .addScaledVector(u, Math.sin(ang) * rad)
    .normalize();
}
function startReload(a) {
  const ws = curW(a),
    d = WEAPONS[ws.id];
  if (a.reloadT > 0 || ws.mag >= d.mag || ws.res <= 0 || a.act) return;
  a.reloadT = d.reload;
  a.ads = 0;
  HOOK.reload(a);
}
function fire(a, extraErr) {
  const ws = curW(a),
    d = WEAPONS[ws.id];
  if (a.fireCD > 0 || a.reloadT > 0 || a.act || a.vault || a.sprint || a.sprintOut > 0)
    return false;
  if (ws.mag <= 0) {
    startReload(a);
    if (a.isPlayer) HOOK.sound('empty');
    return false;
  }
  ws.mag--;
  a.fireCD = d.rate;
  a.shots++;
  a.sinceShot = 0;
  a.fireT = G.clock;
  const o = eyeOf(a);
  const s = spreadOf(a, d) + (extraErr || 0) + (a.blindT > 0 ? 0.22 : 0);
  const n = d.pellets || 1;
  const extra = Math.max(
    0,
    s - d.spread * (a.ads > 0.9 ? 0.15 : 1.4)
  ); /* dispersão extra (correndo, no ar) vale também para os bagos */
  for (let i = 0; i < n; i++) {
    const dir = coneDir(
      dirFrom(a.yaw, a.pitch + (a.punch || 0)),
      n > 1 ? d.spread * (a.ads > 0.5 ? 0.8 : 1) + extra : s
    );
    const end = bullet(a, o, dir, d);
    if (i < 3) HOOK.tracer(a, o, end);
  }
  HOOK.shot(a, d);
  /* som do tiro: perto ou com linha livre dá posição boa; atrás de paredes só uma noção vaga */
  for (const e of agents) {
    if ((e.isPlayer && !e.bot) || !e.alive || e.team === a.team || e.ai.target) continue;
    const dd = e.pos.distanceTo(a.pos);
    if (dd > (d.sup ? 13 : 30)) continue; /* supressor: só ouve quem está perto */
    const clear = dd < 10 || clearLine(eyeOf(e), o);
    const j = clear ? 1 : 4.5;
    e.ai.alertT = clear ? 3 : 1.5;
    let ip = new V3(a.pos.x + rand(-j, j), 0, a.pos.z + rand(-j, j));
    for (let k = 0; k < 6 && cellAt(Math.floor(ip.x / CELL), Math.floor(ip.z / CELL)) !== 0; k++)
      ip = new V3(a.pos.x + rand(-j, j), 0, a.pos.z + rand(-j, j));
    if (cellAt(Math.floor(ip.x / CELL), Math.floor(ip.z / CELL)) !== 0)
      ip = cellCenter({ x: Math.floor(a.pos.x / CELL), z: Math.floor(a.pos.z / CELL) });
    e.ai.investigate = ip;
  } /* ponto aproximado, mas sempre em chão livre */
  /* atirar não marca mais o atirador no mapa/radar: só quem ouve reage (logo acima) */
  return true;
}
function bullet(a, o, dir, d) {
  let org = o.clone(),
    mul = 1,
    pen = d.wall > 1.4 ? 2 : 1,
    travelled = 0,
    end = null;
  for (let k = 0; k < 4; k++) {
    const tw = traceWorld(org, dir, 160);
    let best = null,
      bt = tw.t,
      hs = false;
    for (const e of agents) {
      if (!e.alive || e.team === a.team) continue;
      const h = hitAgent(org, dir, e);
      if (h && h.t < bt) {
        bt = h.t;
        best = e;
        hs = h.head;
      }
    }
    let droneT = -1;
    if (drone.alive && drone.active && a.side === 'def') {
      droneT = raySphere(org, dir, drone.pos.x, drone.pos.y + 0.13, drone.pos.z, 0.22);
      if (droneT > 0 && droneT < bt) {
        bt = droneT;
        best = null;
      } else droneT = -1;
    }
    end = org.clone().addScaledVector(dir, bt);
    travelled += bt;
    if (droneT > 0) {
      destroyDrone();
      return end;
    }
    if (best) {
      let dm = d.dmg * mul;
      if (d.pellets) dm *= clamp(1 - (travelled - 6) / (d.range || 18), 0.25, 1);
      else if (d.fall) {
        const f = d.fall,
          k = clamp((travelled - f[0]) / (f[1] - f[0]), 0, 1);
        dm *= 1 - (1 - f[2]) * k;
      }
      damage(best, a, dm, hs, end, d.name, !!d.pellets);
      return end;
    }
    if (tw.kind === 'soft') {
      hitPanel(tw.w, tw.row * 4 + tw.col, d.dmg * d.wall, end);
      if (pen > 0 && !tw.w.reinforced) {
        pen--;
        mul *= 0.55;
        org = end.clone().addScaledVector(dir, 0.36);
        continue;
      }
      return end;
    }
    if (tw.kind === 'door') {
      hitDoor(tw.door, 6 * d.wall, end);
      if (pen > 0) {
        pen--;
        mul *= 0.75;
        org = end.clone().addScaledVector(dir, 0.2);
        continue;
      }
      return end;
    }
    if (tw.kind === 'prop') {
      HOOK.impact(end, 'metal', dir);
      return end;
    }
    if (tw.kind === 'glass') {
      breakWindow(tw.win, a);
      HOOK.impact(end, 'glass', dir);
      return end;
    } /* vidro: o tiro para nele e o quebra (o próximo passa) */
    if (tw.hit) HOOK.impact(end, tw.kind, dir);
    return end;
  }
  return end;
}
function hitPanel(w, i, dmg, pt) {
  if (w.reinforced) {
    HOOK.impact(pt, 'metal');
    return;
  }
  const was = w.p[i];
  w.p[i] -= dmg;
  HOOK.impact(pt, w.ext ? 'brick' : 'drywall');
  if (was > 0 && w.p[i] <= 0) HOOK.panelBroken(w, i, pt);
}
function hitDoor(dr, dmg, pt) {
  if (dr.hp <= 0) return;
  dr.hp -= dmg;
  HOOK.impact(pt, 'wood');
  if (dr.hp <= 0) breakDoor(dr);
}
function breakDoor(dr) {
  dr.hp = 0;
  HOOK.doorBroken(dr);
  G.rs.breaches++;
  AI.onBreach(dr);
}
function destroyWall(w, thermal) {
  if (w.reinforced) {
    if (!thermal) return;
    w.reinforced = false;
    HOOK.reinforce(w, false);
  }
  for (let i = 0; i < NP; i++) w.p[i] = 0;
  HOOK.wallChanged(w, true);
  G.rs.breaches++;
  AI.onBreach(w);
}
function damage(v, att, dm, head, pt, wname, pellet) {
  if (!v.alive) return;
  if (G.phase === 'prep' && v.side === 'atk')
    return; /* atacantes ainda não entraram no mapa: sem spawn-kill na preparação */
  /* bala na cabeça mata (como no Siege); bago de escopeta na cabeça só vale 1,5x */
  let dmg = head && !pellet ? 999 : dm * (head ? 1.5 : 1) * (1 - ARMOR[v.op.armor].red);
  v.lastHead = head;
  dmg = Math.max(1, Math.round(dmg));
  v.hp -= dmg;
  HOOK.blood(pt || eyeOf(v), head);
  if (v.isPlayer && !v.bot) HOOK.hurt(att, dmg, v);
  v.ai.alertT = 3;
  if (att) {
    const see = clearSight(eyeOf(v), eyeOf(att)),
      j = see ? 0 : 3;
    const hp = new V3(
      att.pos.x + rand(-j, j),
      0,
      att.pos.z + rand(-j, j)
    ); /* tiro atravessando parede: só a direção aproximada */
    v.ai.hurtFrom = hp;
    if (!v.ai.target)
      v.ai.investigate =
        cellAt(Math.floor(hp.x / CELL), Math.floor(hp.z / CELL)) === 0 ? hp : att.pos.clone();
  }
  if (v.act && v.act.kind !== 'plant' && v.act.kind !== 'defuse')
    v.act = null; /* como no Siege: plantar/desativar continua sob fogo */
  const killed = v.hp <= 0;
  if (att && att.isPlayer && !att.bot && att !== v) HOOK.hitmark(head, killed, att);
  if (killed) kill(v, att, wname, head);
}
function kill(v, att, wname, head) {
  v.alive = false;
  v.hp = 0;
  v.deaths++;
  v.killFrom = att && att !== v ? att.pos.clone() : null;
  /* direção da queda na animação */ v.act = null;
  v.ads = 0;
  v.sprint = false;
  for (const c of v.charges) removeProp(c);
  v.charges = []; /* cargas de brecha de quem morreu não ficam bloqueando a parede */
  if (att && att !== v) {
    att.kills++;
    if (head) att.hs++;
  }
  HOOK.agentKilled(v, att, wname, head);
  AI.onDeath(v);
}
function tickAgent(a, dt) {
  a.fireCD -= dt;
  a.meleeCD -= dt;
  a.sinceShot += dt;
  a.slowT -= dt;
  a.blindT -= dt;
  a.landT -= dt;
  a.sprintOut -= dt;
  if (a.sinceShot > WEAPONS[curW(a).id].rate * 2.2) a.shots = 0;
  if (a.reloadT > 0) {
    a.reloadT -= dt;
    if (a.reloadT <= 0) {
      const ws = curW(a),
        d = WEAPONS[ws.id],
        take = Math.min(d.mag - ws.mag, ws.res);
      ws.mag += take;
      ws.res -= take;
      a.shots = 0;
    }
  }
  for (const p of PROPS)
    if (p.type === 'wire' && a.side === 'atk' && Math.hypot(a.pos.x - p.cx, a.pos.z - p.cz) < 1.3) {
      a.slowT = 0.3;
      a.spotT = G.clock + 1.2;
    }
}

/* ---------- coronhada ---------- */
function melee(a) {
  if (a.meleeCD > 0 || a.act) return false;
  a.meleeCD = 0.75;
  a.fireCD = Math.max(a.fireCD, 0.45);
  const o = eyeOf(a),
    dir = dirFrom(a.yaw, a.pitch);
  HOOK.melee(a);
  const tw0 = traceWorld(o, dir, 1.8, false); /* coronhada não atravessa parede nem escudo */
  for (const e of agents) {
    if (!e.alive || e.team === a.team) continue;
    const h = hitAgent(o, dir, e);
    if (h && h.t < 1.6 && h.t < tw0.t) {
      damage(e, a, 55, false, o.clone().addScaledVector(dir, h.t), 'Coronhada');
      return true;
    }
  }
  const tw = traceWorld(o, dir, 1.8, true);
  const pt = o.clone().addScaledVector(dir, tw.t); /* coronhada passa por cargas presas na parede */
  if (tw.kind === 'soft' && tw.t < 1.8) {
    const w = tw.w;
    if (!w.reinforced) {
      const c = tw.col;
      for (const i of [c, c + 4, tw.row * 4 + c]) w.p[i] = 0;
      HOOK.wallChanged(w, false, pt);
      HOOK.sound('smash', pt);
    } else HOOK.impact(pt, 'metal');
  } else if (tw.kind === 'door' && tw.t < 1.8) {
    hitDoor(tw.door, 55, pt);
    HOOK.sound('smash', pt);
  }
  for (const p of PROPS)
    if (
      (p.type === 'wire' || p.type === 'jammer') &&
      Math.hypot(a.pos.x + dir.x * 1.2 - p.cx, a.pos.z + dir.z * 1.2 - p.cz) < 1.2
    ) {
      removeProp(p);
      if (p.type === 'jammer') HOOK.sound('smash', p.pos);
      break;
    }
  return true;
}

/* ---------- explosões e equipamentos ---------- */
function explode(p, r, dmg, src, opts) {
  opts = opts || {};
  HOOK.boom(p, r);
  const sr = opts.structR != null ? opts.structR : r * 0.6;
  for (const w of WALLS) {
    const c = wallCenter(w);
    if (Math.abs(c.x - p.x) > sr + 2 || Math.abs(c.z - p.z) > sr + 2) continue;
    if (w.reinforced && !opts.thermal) continue;
    let ch = false;
    for (let i = 0; i < NP; i++) {
      if (w.p[i] <= 0) continue;
      const col = i % 4,
        row = (i / 4) | 0;
      const px = w.ori === 'x' ? cc(w.x) : w.x * CELL + col * 0.75 + 0.375,
        pz = w.ori === 'x' ? w.z * CELL + col * 0.75 + 0.375 : cc(w.z);
      if (Math.hypot(px - p.x, (row + 0.5) * PH - p.y, pz - p.z) < sr) {
        w.p[i] = 0;
        ch = true;
      }
    }
    if (ch) {
      HOOK.wallChanged(w, true);
      if (wallPassable(w)) AI.onBreach(w);
    }
  }
  for (const d of DOORS)
    if (d.hp > 0 && Math.hypot(cc(d.x) - p.x, cc(d.z) - p.z) < sr + 0.8) breakDoor(d);
  for (const w of WINS) if (!w.broken && winMid(w).distXZ(p) < r + 1) breakWindow(w);
  for (const pr of PROPS.slice())
    if (
      (pr.type === 'shield' || pr.type === 'wire' || pr.type === 'jammer') &&
      Math.hypot(pr.cx - p.x, pr.cz - p.z) < r * 0.8
    )
      removeProp(pr);
  for (const e of agents) {
    if (!e.alive) continue;
    if (src && e.team === src.team && e !== src) continue;
    const c = new V3(e.pos.x, e.pos.y + 1, e.pos.z);
    const d = c.distanceTo(p);
    if (d >= r) continue;
    const los = opts.ignoreLos || clearLine(p, c);
    let dm = dmg * (1 - d / r) * (los ? 1 : 0.12);
    if (e === src) dm *= 0.5;
    if (dm > 1) damage(e, src, dm, false, c, opts.name || 'Explosão');
  }
  if (drone.alive && drone.pos.distanceTo(p) < r) destroyDrone();
  for (const e of agents)
    if (e.alive && !e.ai.target && e.pos.distanceTo(p) < 25) {
      e.ai.alertT = 3;
      if (e.side === 'def') e.ai.investigate = null;
    }
}
function addProp(pr) {
  PROPS.push(pr);
  HOOK.propAdd(pr);
  return pr;
}
function removeProp(pr) {
  const i = PROPS.indexOf(pr);
  if (i >= 0) PROPS.splice(i, 1);
  HOOK.propRemove(pr);
}
function aimSurface(a, max) {
  const o = eyeOf(a),
    dir = dirFrom(a.yaw, a.pitch);
  const tw = traceWorld(o, dir, max || 2.4, true);
  if (!tw.hit || tw.t > (max || 2.4)) return null;
  tw.pt = o.clone().addScaledVector(dir, tw.t);
  tw.dir = dir;
  return tw;
}
const JAM_R = 9;
/* ponto sob um bloqueador inimigo (de quem olha 'team')? */
function jammed(pos, team) {
  for (const p of PROPS)
    if (
      p.type === 'jammer' &&
      p.owner.team !== team &&
      Math.hypot(p.cx - pos.x, p.cz - pos.z) < p.r
    )
      return true;
  return false;
}
/* clarão: cega quem está com linha de visão; mais perto e olhando para a granada = mais tempo */
function flashBang(p, src) {
  HOOK.flash(p);
  for (const e of agents) {
    if (!e.alive) continue;
    const o = eyeOf(e),
      d = o.distanceTo(p);
    if (d > 13) continue;
    if (d > 0.6 && !clearSight(p, o)) continue;
    const dir = dirFrom(e.yaw, e.pitch),
      to = p.clone().sub(o).normalize();
    const face = d < 0.6 ? 1 : (dir.x * to.x + dir.y * to.y + dir.z * to.z + 1) / 2;
    const t = (1 - d / 13) * (0.25 + 0.75 * face) * 5.5;
    if (t < 0.5) continue;
    e.blindT = Math.max(e.blindT, t);
    e.blindMax = Math.max(e.blindT, 1);
    if (e.ai) {
      e.ai.target = null;
      e.ai.seeT = 0;
    }
    if (e.isPlayer && !e.bot) HOOK.blind(t, e);
  }
  if (drone.alive && drone.pos.distanceTo(p) < 5) destroyDrone();
}
function useGadget(a) {
  if (!a.alive || a.act || G.phase === 'end' || G.phase === 'over') return false;
  const g = a.op.gadget;
  if (g === 'breach' && a.charges.length) {
    const c = a.charges.shift();
    removeProp(c);
    if (c.w) destroyWall(c.w, false);
    if (c.door) breakDoor(c.door);
    explode(c.pos, 3, 70, a, { structR: 0, name: 'Carga de brecha', ignoreLos: true });
    return true;
  }
  if (a.gadgetN <= 0) {
    if (a.isPlayer) HOOK.sound('deny');
    return false;
  }
  if (G.phase === 'prep' && a.side === 'atk') return false;
  if (g === 'breach' || g === 'thermal') {
    const tw = aimSurface(a, 2.4);
    if (
      !tw ||
      (tw.kind !== 'soft' && tw.kind !== 'door') ||
      (g === 'breach' && tw.kind === 'soft' && tw.w.reinforced)
    ) {
      if (a.isPlayer) HOOK.prompt('Mire numa parede fina ou barricada', 1.2);
      return false;
    }
    const pos = tw.pt.clone().addScaledVector(tw.dir, -0.12);
    const pr = addProp({
      type: g,
      pos,
      yaw: a.yaw,
      w: tw.w || null,
      door: tw.door || null,
      owner: a,
      cx: pos.x,
      cz: pos.z,
      t: 3,
      ori: (tw.w || tw.door).ori,
    });
    a.gadgetN--;
    if (g === 'breach') a.charges.push(pr);
    else {
      pr.burn = true;
      HOOK.sound('thermal', pos);
    }
    return true;
  }
  if (g === 'frag' || g === 'impact' || g === 'flash') {
    const o = eyeOf(a),
      dir = dirFrom(a.yaw, a.pitch + 0.08);
    const pos = o.clone().addScaledVector(dir, 0.5);
    const p = {
      type: g,
      pos,
      vel: dir.multiplyScalar(g === 'frag' ? 13 : g === 'flash' ? 14 : 16),
      fuse: g === 'frag' ? 2.6 : g === 'flash' ? 1.7 : 6,
      owner: a,
      spin: 0,
    };
    projectiles.push(p);
    HOOK.projAdd(p);
    a.gadgetN--;
    HOOK.throw(a);
    return true;
  }
  if (g === 'pulse') {
    a.gadgetN--;
    for (const e of agents)
      if (e.alive && e.team !== a.team && !jammed(e.pos, a.team))
        e.spotT = Math.max(e.spotT, G.clock + 4);
    if (a.team === player.team)
      HOOK.banner('Pulso de radar', 'Defensores revelados por 4 segundos', '', 1.6);
    HOOK.sound('pulse');
    return true;
  }
  if (g === 'shield' || g === 'wire' || g === 'jammer') {
    const f = dirFrom(a.yaw, 0);
    const dist = g === 'shield' ? 1.3 : g === 'jammer' ? 0.9 : 1.8;
    const px = a.pos.x + f.x * dist,
      pz = a.pos.z + f.z * dist;
    const cx = Math.floor(px / CELL),
      cz = Math.floor(pz / CELL);
    if (cellAt(cx, cz) !== 0) {
      if (a.isPlayer) HOOK.prompt('Sem espaço aqui', 1);
      return false;
    }
    const snap = Math.round(a.yaw / (Math.PI / 2)) * (Math.PI / 2);
    const alongX = Math.abs(Math.sin(snap)) < 0.5;
    const pr = { type: g, cx: px, cz: pz, yaw: snap, owner: a, pos: new V3(px, 0, pz) };
    if (g === 'shield') {
      const hw = 0.6,
        ht = 0.12;
      pr.box = alongX
        ? [px - hw, 0, pz - ht, px + hw, 1.1, pz + ht]
        : [px - ht, 0, pz - hw, px + ht, 1.1, pz + hw];
      pr.solid = true;
      pr.block = true;
    }
    if (g === 'jammer') {
      pr.r = JAM_R;
      pr.hp = 2;
      if (
        PROPS.some(
          (q) =>
            q.type === 'jammer' && q.owner.team === a.team && Math.hypot(q.cx - px, q.cz - pz) < 3
        )
      ) {
        if (a.isPlayer) HOOK.prompt('Já há um bloqueador aqui', 1.2);
        return false;
      }
    }
    addProp(pr);
    a.gadgetN--;
    HOOK.sound('place', pr.pos);
    return true;
  }
  return false;
}
function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.fuse -= dt;
    p.spin += dt * 6;
    const steps = 3;
    for (let s = 0; s < steps && p.fuse > 0; s++) {
      const h = dt / steps;
      p.vel.y -= 14 * h;
      const len = p.vel.length() * h;
      if (len < 1e-5) break;
      const dir = p.vel.clone().normalize();
      const tw = traceWorld(p.pos, dir, len + 0.08);
      if (tw.hit && tw.t <= len + 0.08) {
        if (p.type === 'impact') {
          p.pos.addScaledVector(dir, Math.max(0, tw.t - 0.1));
          p.fuse = 0;
          break;
        }
        const hp = p.pos.clone().addScaledVector(dir, tw.t);
        if (tw.kind === 'floor' || (tw.kind === 'crate' && hp.y >= CRATE_H - 0.05)) {
          p.vel.y = -p.vel.y * 0.35;
          p.vel.x *= 0.6;
          p.vel.z *= 0.6;
          if (Math.abs(p.vel.y) < 0.8) p.vel.y = 0;
          p.pos.y = Math.max(p.pos.y, (tw.kind === 'crate' ? CRATE_H : 0) + 0.07);
        } else if (tw.kind === 'ceil') {
          p.vel.y = -Math.abs(p.vel.y) * 0.3;
        } else {
          const ori = tw.w ? tw.w.ori : tw.door ? tw.door.ori : null;
          let ax;
          if (ori) ax = ori === 'x' ? 'x' : 'z';
          else {
            const cx0 = Math.floor(p.pos.x / CELL),
              cx1 = Math.floor(hp.x / CELL + dir.x * 0.02);
            ax = cx0 !== cx1 ? 'x' : 'z';
          }
          if (ax === 'x') p.vel.x = -p.vel.x * 0.4;
          else p.vel.z = -p.vel.z * 0.4;
          p.vel.y *= 0.7;
        }
        HOOK.sound('bounce', p.pos);
      } else p.pos.addScaledVector(dir, len);
      if (p.pos.y < 0.07) {
        p.pos.y = 0.07;
        if (p.vel.y < 0) p.vel.y = -p.vel.y * 0.3;
        p.vel.x *= 0.9;
        p.vel.z *= 0.9;
      }
    }
    if (p.fuse <= 0) {
      projectiles.splice(i, 1);
      HOOK.projRemove(p);
      if (p.type === 'flash') flashBang(p.pos.clone(), p.owner);
      else if (p.type === 'frag')
        explode(p.pos.clone(), 5, 160, p.owner, { structR: 1.6, name: 'Granada' });
      else explode(p.pos.clone(), 2.4, 45, p.owner, { structR: 1.9, name: 'Granada de impacto' });
    }
  }
  for (const pr of PROPS.slice()) {
    if (pr.type === 'thermal' && pr.burn) {
      pr.t -= dt;
      HOOK.sparks(pr.pos);
      if (pr.t <= 0) {
        removeProp(pr);
        if (pr.w) destroyWall(pr.w, true);
        if (pr.door) breakDoor(pr.door);
        explode(pr.pos, 2.2, 40, pr.owner, { structR: 0, name: 'Carga térmica', ignoreLos: true });
      }
    }
  }
}

/* ---------- interação: reforçar, plantar, desativar ---------- */
function interactOption(a) {
  if (!a.alive) return null;
  const P = G.planted;
  if (a.side === 'def' && P && a.pos.distanceTo(P.pos) < 1.8 && G.phase === 'action')
    return { kind: 'defuse', hold: DEFUSE_HOLD, label: 'Segure F para desativar' };
  if (
    a.side === 'atk' &&
    G.phase === 'action' &&
    !P &&
    inSite(SITES[G.siteKey], a.pos) &&
    a.onGround
  )
    return { kind: 'plant', hold: PLANT_HOLD, label: 'Segure F para plantar o desativador' };
  if (a.side === 'def' && (G.phase === 'prep' || G.phase === 'action')) {
    const tw = aimSurface(a, 2.2);
    if (tw && tw.kind === 'soft' && !tw.w.reinforced) {
      const intact = tw.w.p.every((v) => v >= PANEL_HP);
      if (!intact) return { kind: 'none', label: 'Parede danificada não pode ser reforçada' };
      if (G.reinf <= 0) return { kind: 'none', label: 'Sem reforços restantes' };
      return {
        kind: 'reinforce',
        hold: 2,
        label: `Segure F para reforçar · ${G.reinf} restantes`,
        w: tw.w,
      };
    }
  }
  return null;
}
function tickAct(a, dt, holding) {
  if (!holding) {
    a.act = null;
    return;
  }
  if (!a.act) {
    const op = interactOption(a);
    if (!op || !op.hold) return;
    a.act = { kind: op.kind, t: 0, hold: op.hold, w: op.w };
    a.ads = 0;
  }
  const op = interactOption(a);
  if (!op || op.kind !== a.act.kind || (a.act.w && op.w !== a.act.w)) {
    a.act = null;
    return;
  }
  if (a.act.kind === 'plant' && Math.hypot(a.vel.x, a.vel.z) > 0.6) a.act.t = 0;
  a.act.t += dt;
  if (a.act.t >= a.act.hold) {
    const k = a.act.kind;
    a.act = null;
    if (k === 'reinforce') reinforceWall(op.w, a);
    if (k === 'plant') {
      G.planted = { pos: new V3(a.pos.x, a.pos.y, a.pos.z), t: PLANT_T, beep: 0, by: a };
      G.phaseT = PLANT_T;
      G.rs.planted = true;
      G.rs.plantT = G.roundClock;
      if (a.isPlayer && !a.bot) SAVE.stats.plants++;
      HOOK.deviceAdd(G.planted);
      HOOK.planted(a);
      AI.onPlant();
    }
    if (k === 'defuse') {
      if (a.isPlayer && !a.bot) SAVE.stats.defuses++;
      HOOK.deviceRemove(G.planted);
      endRound(a.team, 'Desativador neutralizado');
    }
  }
}
function reinforceWall(w, a) {
  if (G.reinf <= 0 || w.reinforced) return;
  w.reinforced = true;
  G.reinf--;
  HOOK.reinforce(w, true);
  HOOK.sound('reinforce', wallCenter(w));
}
function destroyDrone() {
  if (!drone.alive) return;
  drone.alive = false;
  drone.left = (drone.left || 1) - 1;
  drone.redeployT = drone.left > 0 ? 1.5 : 0;
  HOOK.droneDestroyed(drone.left);
}
function redeployDrone() {
  drone.pos.copy(player.pos);
  drone.pos.y = 0;
  drone.vel.set(0, 0, 0);
  drone.vy = 0;
  drone.yaw = player.yaw;
  drone.pitch = 0;
  drone.alive = true;
  HOOK.droneDeployed && HOOK.droneDeployed();
}
