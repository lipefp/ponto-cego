/* =====================================================================
   IA TÁTICA v3
   TeamBrain (por lado) monta um plano na rodada:
     ataque: grupo principal + flanco, cada um com uma entrada; papéis
             rompedor, portador do desativador, apoio; fases
             aproximar → romper → entrar → plantar → pós-planta
     defesa: âncoras em cantos do objetivo vigiando entradas, um patrulheiro,
             reforços nas paredes de entrada, escudos e arames nas portas
   BotBrain (por bot) faz percepção, combate e executa sua parte do plano.
   ===================================================================== */
const AI = { atk: null, def: null, intel: { atk: null, def: null } };

/* ---------- utilidades de navegação ---------- */
function moveBy(a, dx, dz, who) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.2));
  for (let i = 0; i < steps; i++) {
    a.pos.x += dx / steps;
    a.pos.z += dz / steps;
    resolve(a.pos, R, a.pos.y, who || 'agent');
  }
}
function separate() {
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];
    if (!a.alive) continue;
    for (let j = i + 1; j < agents.length; j++) {
      const b = agents[j];
      if (!b.alive || Math.abs(a.pos.y - b.pos.y) > 1) continue;
      const dx = b.pos.x - a.pos.x,
        dz = b.pos.z - a.pos.z,
        d = Math.hypot(dx, dz);
      if (d < 0.68 && d > 1e-4) {
        const p = (0.68 - d) / 2;
        a.pos.x -= (dx / d) * p;
        a.pos.z -= (dz / d) * p;
        b.pos.x += (dx / d) * p;
        b.pos.z += (dz / d) * p;
        resolve(a.pos, R, a.pos.y, 'agent');
        resolve(b.pos, R, b.pos.y, 'agent');
      }
    }
  }
}
function structBlocked(s) {
  return s.p ? s.reinforced || !wallPassable(s) : s.hp > 0;
}
/* ponto de passagem por uma estrutura: centro da coluna aberta mais próxima (parede) ou da porta */
function passPoint(s, b) {
  if (!s.p) return cellCenter(s);
  let best = null,
    bd = 1e9;
  for (let c = 0; c < 4; c++) {
    if (!openCol(s, c)) continue;
    const p =
      s.ori === 'x'
        ? new V3(cc(s.x), 0, s.z * CELL + c * 0.75 + 0.375)
        : new V3(s.x * CELL + c * 0.75 + 0.375, 0, cc(s.z));
    const d = p.distXZ(b.pos);
    if (d < bd) {
      bd = d;
      best = p;
    }
  }
  return best || cellCenter(s);
}
/* lado do plano de uma parede/porta em que um ponto está (-1/+1) e a célula livre desse lado */
const structSide = (s, p) => ((s.ori === 'x' ? p.x - cc(s.x) : p.z - cc(s.z)) >= 0 ? 1 : -1);
const sideCell = (s, sg) => (s.ori === 'x' ? { x: s.x + sg, z: s.z } : { x: s.x, z: s.z + sg });
function navTo(b, goal, dt, baseCost) {
  const ai = b.ai;
  ai.repathT = (ai.repathT || 0) - dt;
  /* células onde o bot travou (escudo, colega, quina) ficam caras por alguns segundos */
  const cost =
    ai.avoid && G.clock < ai.avoidUntil
      ? (x, z) => (ai.avoid.has(z * W + x) ? 40 : baseCost(x, z))
      : baseCost;
  const here = { x: Math.floor(b.pos.x / CELL), z: Math.floor(b.pos.z / CELL) },
    gc = { x: Math.floor(goal.x / CELL), z: Math.floor(goal.z / CELL) };
  const hs = structAt(here.x, here.z);
  /* dentro da célula de uma parede/porta: só rompe se o destino estiver do outro lado do plano */
  let start = here,
    lead = null;
  if (hs) {
    const my = structSide(hs, b.pos);
    let across = !(gc.x === here.x && gc.z === here.z) && structSide(hs, goal) !== my;
    if (across && structBlocked(hs)) {
      /* não dá para romper (defensor em parede, ou parede reforçada sem térmica): contorna por outro caminho */
      if (
        (hs.p && b.side !== 'atk') ||
        (hs.p && hs.reinforced && !(b.op.gadget === 'thermal' && b.gadgetN > 0))
      )
        across = false;
      else {
        const m = breachStep(b, hs, dt);
        return m || { x: 0, z: 0, busy: true };
      }
    }
    if (across) {
      start = sideCell(hs, -my);
      lead = [{ x: here.x, z: here.z }, start];
    } /* atravessa pela abertura */
    else {
      start = sideCell(hs, my);
      lead = [start];
    } /* volta para o seu lado */
  }
  if (
    !ai.path ||
    !ai.path.length ||
    ai.repathT <= 0 ||
    !ai.pathGoal ||
    ai.pathGoal.distXZ(goal) > 2 ||
    ai.pathFrom !== hs
  ) {
    ai.path = astar(start.x, start.z, gc.x, gc.z, cost);
    ai.pathGoal = goal.clone();
    ai.repathT = rand(1.5, 2.8);
    ai.pathFrom = hs;
    if (lead) {
      ai.path = lead
        .filter((c) => cellAt(c.x, c.z) !== 1)
        .concat(
          ai.path.filter(
            (c) => !(c.x === here.x && c.z === here.z) && !(c.x === start.x && c.z === start.z)
          )
        );
    } else if (ai.path.length && ai.path[0].x === here.x && ai.path[0].z === here.z)
      ai.path.shift();
  }
  const nxt = ai.path[0];
  let tp = null;
  if (nxt) {
    const s = structAt(nxt.x, nxt.z);
    if (s && structBlocked(s)) {
      const cp = cellCenter(nxt);
      const pd = s.ori === 'x' ? Math.abs(b.pos.x - cp.x) : Math.abs(b.pos.z - cp.z),
        lat = s.ori === 'x' ? Math.abs(b.pos.z - cp.z) : Math.abs(b.pos.x - cp.x);
      if (pd < 1.15 && lat < 1.3) {
        const m = breachStep(b, s, dt);
        return m || { x: 0, z: 0, busy: true };
      }
    }
    tp = s ? passPoint(s, b) : cellCenter(nxt);
    const dl = tp.distXZ(b.pos);
    if (dl < 0.45 || (!s && dl < 0.6)) ai.path.shift();
  } else if (hs) {
    tp = passPoint(hs, b);
    /* atravessando a estrutura: sai pelo outro lado em direção ao objetivo */
    if (tp.distXZ(b.pos) < 0.4) {
      const dx = goal.x - b.pos.x,
        dz = goal.z - b.pos.z,
        dl = Math.hypot(dx, dz);
      return dl > 0.3 ? { x: dx / dl, z: dz / dl } : { x: 0, z: 0 };
    }
  } else {
    const dl = goal.distXZ(b.pos);
    if (dl < 0.3) return { x: 0, z: 0 };
    if (Math.floor(goal.x / CELL) !== here.x || Math.floor(goal.z / CELL) !== here.z) {
      ai.navFail = (ai.navFail || 0) + dt;
      if (ai.navFail > 1) return { x: 0, z: 0, fail: true };
    }
    tp = goal;
  }
  ai.navFail = 0;
  const dx = tp.x - b.pos.x,
    dz = tp.z - b.pos.z,
    dl = Math.hypot(dx, dz);
  if (dl > 0.01) return { x: dx / dl, z: dz / dl };
  return { x: 0, z: 0 };
}
const _ft = new V3();
function faceTo(b, p, y, dt, rate) {
  const e = eyeOf(b, _ft);
  const dx = p.x - e.x,
    dz = p.z - e.z,
    dy = (y != null ? y : p.y) - e.y;
  const wy = Math.atan2(-dx, -dz),
    wp = Math.atan2(dy, Math.hypot(dx, dz));
  b.yaw += clamp(angDiff(wy, b.yaw), -rate * dt, rate * dt);
  b.pitch += clamp(wp - b.pitch, -rate * dt, rate * dt);
  return Math.abs(angDiff(wy, b.yaw)) < 0.08;
}
/* rompe a estrutura à frente: carga de brecha, térmica ou coronhadas */
function breachStep(b, s, dt) {
  const ai = b.ai,
    g = b.op.gadget;
  if (b.charges.length) {
    ai.breachWait = (ai.breachWait || 0) + dt;
    if (ai.breachWait > 1.2) {
      useGadget(b);
      ai.breachWait = 0;
      ai.path = [];
    }
    return;
  }
  if (ai.pendingThermal > 0) {
    ai.pendingThermal -= dt;
    if (ai.pendingThermal <= 0) ai.path = [];
    return;
  }
  /* mira no painel intacto mais baixo das colunas do meio (é o que impede a passagem) */
  const col = s.p ? [1, 2].find((c) => !openCol(s, c)) || 1 : 1,
    ty = s.p ? ((s.p[col] > 0 ? 0 : 1) + 0.5) * PH : 1.1;
  const tp = s.p
    ? s.ori === 'x'
      ? new V3(cc(s.x), ty, s.z * CELL + col * 0.75 + 0.375)
      : new V3(s.x * CELL + col * 0.75 + 0.375, ty, cc(s.z))
    : new V3(cc(s.x), 1.1, cc(s.z));
  /* longe demais para a coronhada/carga: chega perto do painel alvo primeiro */
  const hd = Math.hypot(tp.x - b.pos.x, tp.z - b.pos.z);
  if (hd > 0.85 && !(s.p && s.reinforced)) {
    faceTo(b, tp, tp.y, dt, 7);
    return { x: (tp.x - b.pos.x) / hd, z: (tp.z - b.pos.z) / hd };
  }
  if (!faceTo(b, tp, tp.y, dt, 7)) return;
  if (s.p && s.reinforced) {
    if (g === 'thermal' && b.gadgetN > 0) {
      if (useGadget(b)) ai.pendingThermal = 3.6;
    } else ai.path = [];
    return;
  }
  if (g === 'breach' && b.gadgetN > 0 && s.p) {
    useGadget(b);
    ai.breachWait = 0;
    return;
  }
  if (b.meleeCD <= 0) melee(b);
}
function moveBot(b, mv, speed, dt) {
  b.vel.x += (mv.x * speed - b.vel.x) * Math.min(1, dt * 10);
  b.vel.z += (mv.z * speed - b.vel.z) * Math.min(1, dt * 10);
  moveBy(b, b.vel.x * dt, b.vel.z * dt);
}
const roomCells = (r) => spawnCellsOf(r);
function siteWalls(key) {
  const r = SITES[key].room;
  return WALLS.filter(
    (w) => w.x >= r.x0 - 1 && w.x <= r.x1 + 1 && w.z >= r.z0 - 1 && w.z <= r.z1 + 1
  );
}
function standCellFor(s, key) {
  const r = SITES[key].room;
  const opts =
    s.ori === 'x'
      ? [
          { x: s.x - 1, z: s.z },
          { x: s.x + 1, z: s.z },
        ]
      : [
          { x: s.x, z: s.z - 1 },
          { x: s.x, z: s.z + 1 },
        ];
  return (
    opts.find(
      (c) => c.x >= r.x0 && c.x <= r.x1 && c.z >= r.z0 && c.z <= r.z1 && cellAt(c.x, c.z) === 0
    ) ||
    opts.find((c) => cellAt(c.x, c.z) === 0) ||
    null
  );
}
function entryObj(e) {
  return {
    name: e.name,
    s: structAt(e.s[0], e.s[1]),
    stack: cellCenter({ x: e.stack[0], z: e.stack[1] }),
    in: cellCenter({ x: e.in[0], z: e.in[1] }),
  };
}

/* cantos de defesa longe das janelas: quem fica de frente para o vidro é visto de fora (a IA enxerga através do vidro) */
function winExposed(c) {
  const e = new V3(c.x, 1.3, c.z);
  for (const w of WINS) {
    const m = winMid(w);
    if (m.distXZ(c) > 24) continue;
    const o = new V3(m.x - (w.nx || 0) * 2.5, 1.4, m.z - (w.nz || 0) * 2.5);
    if (clearSight(e, o)) return true;
  }
  return false;
}
const _safeH = {};
function safeHolds(key) {
  if (_safeH[key]) return _safeH[key];
  const T = TACT[key],
    r = SITES[key].room;
  const used = new Set(
    T.holds.filter(([x, z]) => !winExposed(cellCenter({ x, z }))).map(([x, z]) => z * W + x)
  );
  const out = T.holds.map(([x, z]) => {
    const c = cellCenter({ x, z });
    if (!winExposed(c)) return [x, z];
    let best = null,
      bd = 1e9;
    for (let zz = r.z0; zz <= r.z1; zz++)
      for (let xx = r.x0; xx <= r.x1; xx++) {
        if (cellAt(xx, zz) !== 0 || used.has(zz * W + xx)) continue;
        const q = cellCenter({ x: xx, z: zz });
        if (winExposed(q)) continue;
        const d = q.distXZ(c);
        if (d < bd) {
          bd = d;
          best = [xx, zz];
        }
      }
    if (best) {
      used.add(best[1] * W + best[0]);
      return best;
    }
    return [x, z];
  });
  return (_safeH[key] = out);
}
/* ---------- planos de time ---------- */
AI.roundStart = function () {
  AI.intel = { atk: null, def: null };
  const T = TACT[G.siteKey];
  /* ataque */
  const atk = shuffle(agents.filter((a) => a.side === 'atk' && a.bot));
  const entries = shuffle(T.entries.map(entryObj));
  const groups = [{ entry: entries[0], stage: 'approach', t: 0, members: [] }];
  if (atk.length >= 3) groups.push({ entry: entries[1], stage: 'approach', t: 0, members: [] });
  const breachers = atk.filter((a) => a.op.gadget === 'breach' || a.op.gadget === 'thermal');
  atk.forEach((a, i) => {
    const gi = groups.length > 1 && i === atk.length - 1 ? 1 : 0;
    groups[gi].members.push(a);
    a.ai.group = groups[gi];
  });
  for (const gr of groups) {
    const br = gr.members.find((m) => breachers.includes(m));
    gr.breacher = br || gr.members[0];
  }
  const carrier =
    atk.find((a) => groups[0].members.includes(a) && a !== groups[0].breacher) || atk[0] || null;
  AI.atk = { groups, carrier, rush: false };
  /* defesa */
  const def = shuffle(agents.filter((a) => a.side === 'def' && a.bot));
  const holds = shuffle(safeHolds(G.siteKey).slice());
  const walls = shuffle(siteWalls(G.siteKey).filter((w) => standCellFor(w, G.siteKey)));
  const entryWalls = T.entries.map((e) => wallAt(e.s[0], e.s[1])).filter(Boolean);
  walls.sort((a, b) => (entryWalls.includes(b) ? 1 : 0) - (entryWalls.includes(a) ? 1 : 0));
  let wi = 0;
  const ents = T.entries.map(entryObj);
  def.forEach((a, i) => {
    const ai = a.ai;
    ai.roamer = def.length >= 4 && i < ROAMERS;
    ai.hold = cellCenter({ x: holds[i % holds.length][0], z: holds[i % holds.length][1] });
    ai.watch = ents[i % ents.length];
    ai.tasks = [];
    for (let k = 0; k < 2 && wi < walls.length; k++) {
      const w = walls[wi++];
      ai.tasks.push({ kind: 'reinforce', w, stand: standCellFor(w, G.siteKey) });
    }
    const g = a.op.gadget;
    if (g === 'shield') ai.tasks.push({ kind: 'shield' });
    if (g === 'wire') {
      const e = ents.find((x) => x.s && !x.s.p) || ents[0];
      ai.tasks.push({
        kind: 'wire',
        stand: { x: Math.floor(e.in.x / CELL), z: Math.floor(e.in.z / CELL) },
        face: e.stack,
      });
    }
    if (g === 'jammer') {
      for (let k = 0; k < 2; k++) {
        const h = holds[(i + k) % holds.length];
        ai.tasks.push({
          kind: 'wire',
          stand: { x: h[0], z: h[1] },
          face: ents[(i + k) % ents.length].in,
        });
      }
    }
    if (g === 'impact') {
      const w = pick(siteWalls(G.siteKey).filter((x) => !entryWalls.includes(x)));
      if (w) {
        const st = standCellFor(w, G.siteKey);
        if (st) ai.tasks.push({ kind: 'impact', stand: st, face: new V3(cc(w.x), 1.3, cc(w.z)) });
      }
    }
  });
};
/* um bot assume um boneco no meio da rodada (o jogador caiu ou saiu): entra no plano do time que já existe */
AI.adopt = function (a) {
  a.ai = {};
  if (G.phase !== 'prep' && G.phase !== 'action') return;
  const T = TACT[G.siteKey];
  if (!T) return;
  if (a.side === 'atk') {
    if (!AI.atk) return;
    const gr = AI.atk.groups[0];
    gr.members.push(a);
    a.ai.group = gr;
    if (!gr.breacher || !gr.breacher.alive) gr.breacher = a;
    if (!AI.atk.carrier) AI.atk.carrier = a;
  } else {
    const holds = safeHolds(G.siteKey),
      h = pick(holds),
      ents = T.entries.map(entryObj);
    a.ai.roamer = false;
    a.ai.hold = cellCenter({ x: h[0], z: h[1] });
    a.ai.watch = pick(ents);
    a.ai.tasks = [];
  }
};
AI.onBreach = function (s) {
  if (!AI.def) return;
  const T = TACT[G.siteKey];
  const e = T.entries.find((x) => x.s[0] === s.x && x.s[1] === s.z);
  if (!e) return;
  const eo = entryObj(e);
  const def = agents.filter((a) => a.alive && a.bot && a.side === 'def' && !a.ai.roamer);
  if (def.length > 1) {
    const near = def.sort((x, y) => x.pos.distanceTo(eo.in) - y.pos.distanceTo(eo.in));
    for (const d of near.slice(0, def.length >= 3 ? 2 : 1)) {
      d.ai.watch = eo;
      d.ai.alertT = Math.max(d.ai.alertT || 0, 4);
    }
  }
}; /* barulho da brecha: os dois âncoras mais perto viram para ela */
AI.onDeath = function (v) {
  if (AI.atk && AI.atk.carrier === v) {
    const s = siteCenter(SITES[G.siteKey]);
    const c = agents
      .filter((a) => a.alive && a.bot && a.side === 'atk')
      .sort((x, y) => x.pos.distanceTo(s) - y.pos.distanceTo(s))[0];
    AI.atk.carrier = c || null;
  }
};
AI.onPlant = function () {
  for (const a of agents)
    if (a.bot) {
      a.ai.path = [];
      a.ai.guard = null;
    }
};
AI.def = true;

/* ---------- cérebro do bot ---------- */
const _eye = new V3(),
  _tp = new V3();
AI.update = function (b, dt) {
  const D = DIFF,
    ai = b.ai,
    eye = eyeOf(b, _eye),
    ws = curW(b),
    wd = WEAPONS[ws.id];
  b.sprint = false;
  const wantLean = ai.leanWant || 0;
  ai.leanWant = 0;
  let mv = { x: 0, z: 0 },
    speed = speedOf(b) * (b.slowT > 0 ? 0.35 : 1) * (b.blindT > 0 ? 0.5 : 1) * 0.92,
    wantCrouch = false;
  if (G.phase === 'prep') {
    if (b.side === 'def') {
      if (
        drone.alive &&
        drone.active &&
        drone.pos.distanceTo(b.pos) < 22 &&
        clearSight(eye, _tp.set(drone.pos.x, drone.pos.y + 0.15, drone.pos.z))
      ) {
        faceTo(b, drone.pos, drone.pos.y + 0.15, dt, D.turn);
        ai.reactT = (ai.reactT == null ? D.react : ai.reactT) - dt;
        if (ai.reactT <= 0 && b.fireCD <= 0) fire(b, D.err * 0.6);
      } else {
        ai.reactT = D.react;
        mv = prepTask(b, dt);
      }
    }
    b.crouchK = clamp(b.crouchK + (mv.crouch ? 1 : -1) * dt * 4, 0, 1);
    moveBot(b, mv, speed * 0.85, dt);
    return;
  }
  /* percepção (o portador dentro do objetivo ignora inimigos distantes para plantar) */
  const planting =
    b.side === 'atk' &&
    AI.atk &&
    AI.atk.carrier === b &&
    !G.planted &&
    inRoom(SITES[G.siteKey].room, b.pos);
  const isCarrier = b.side === 'atk' && AI.atk && AI.atk.carrier === b && !G.planted;
  const coverMates =
    planting &&
    agents.some(
      (m) => m.alive && m !== b && m.side === 'atk' && inRoom(SITES[G.siteKey].room, m.pos)
    );
  let best = null,
    bd = 1e9;
  for (const e of agents) {
    if (!e.alive || e.team === b.team || b.blindT > 0)
      continue; /* cego (clarão): não enxerga ninguém */
    if (ai.ignoreE === e && G.clock < ai.ignoreT)
      continue; /* alvo que não dá para acertar (geometria no caminho): desiste um tempo em vez de gastar o pente */
    const dx = e.pos.x - b.pos.x,
      dz = e.pos.z - b.pos.z,
      dist = Math.hypot(dx, dz);
    if (dist > 70) continue;
    const ang = Math.abs(angDiff(Math.atan2(-dx, -dz), b.yaw));
    if (ang > ((ai.alertT || 0) > 0 ? 1.9 : 1.1) && dist > 1.3 && e.spotT < G.clock)
      continue; /* sem "radar" de 360°: só quem está colado é percebido por trás */
    let part = 'chest';
    _tp.set(e.pos.x, e.pos.y + 1.1 - 0.4 * e.crouchK, e.pos.z);
    let vis = clearLine(eye, _tp),
      glass = false;
    if (!vis) {
      headPos(e, _tp);
      vis = clearLine(eye, _tp);
      part = 'head';
    }
    if (!vis && dist < GLASS_SEE) {
      _tp.set(e.pos.x, e.pos.y + 1.1 - 0.4 * e.crouchK, e.pos.z);
      part = 'chest';
      vis = clearSight(eye, _tp);
      if (!vis) {
        headPos(e, _tp);
        vis = clearSight(eye, _tp);
        part = 'head';
      }
      glass = vis;
    } /* através de vidro inteiro: enxerga (reflexo atrapalha: mais perto e reação mais lenta) */
    if (!vis) continue;
    e._glass = glass;
    e._vis = part;
    if (planting && (dist > (coverMates ? 9 : 6) || (b.act && dist > 3.5))) continue;
    /* portador no objetivo: prioridade é plantar (os colegas cobrem) */ if (
      isCarrier &&
      !planting &&
      inRoom(SITES[G.siteKey].room, b.pos) &&
      dist > 8 &&
      !ai.hurtFrom
    )
      continue;
    if (dist < bd) {
      bd = dist;
      best = e;
    }
  }
  if (best && b.act) b.act = null;
  if (best) {
    if (ai.target !== best) {
      ai.target = best;
      ai.reactT =
        D.react *
        rand(0.8, 1.3) *
        (best._glass ? 1.6 : 1) *
        (1 + bd / 45) *
        ((ai.alertT || 0) > 0 ? 0.75 : 1) *
        (best.spotT > G.clock ? 0.8 : 1) *
        (b.side === 'def' && !ai.roamer && Math.hypot(b.vel.x, b.vel.z) < 0.5 ? 0.35 : 1) *
        (b.side === 'atk' && Math.hypot(b.vel.x, b.vel.z) > 2 ? 1.4 : 1);
      ai.seeT = 0;
      ai.aimHead = false;
      /* defensor segurando o ângulo: se o atacante aparece onde ele já mira, a mira já está assentada */
      if (
        b.side === 'def' &&
        !ai.roamer &&
        Math.hypot(b.vel.x, b.vel.z) < 0.5 &&
        Math.abs(angDiff(Math.atan2(-(best.pos.x - b.pos.x), -(best.pos.z - b.pos.z)), b.yaw)) < 0.3
      )
        ai.seeT = D.conv * 0.9;
    }
    ai.seeT += dt;
    ai.lostT = 0;
    ai.lastSeen = best.pos.clone();
    ai.investigate = null;
    /* sem marcar para o time: cada bot só vê o que vê */ ai.hurtFrom = null;
    /* aviso ao time: chega com ~1,2 s de atraso e erro de alguns metros (como um callout) */
    const I = AI.intel[b.side];
    if (!I || G.clock - I.t > 1.5)
      AI.intel[b.side] = {
        pos: new V3(best.pos.x + rand(-2.5, 2.5), 0, best.pos.z + rand(-2.5, 2.5)),
        t: G.clock,
        avail: G.clock + 1.2,
      };
  } else if (ai.target) {
    ai.lostT = (ai.lostT || 0) + dt;
    if (ai.lostT > 0.6) {
      ai.target = null;
      ai.path = [];
      if (ai.roamer || (b.side === 'atk' && (atkCommitted(b) || ai.lastSeen.distXZ(b.pos) < 6)))
        ai.chase = ai.lastSeen;
    }
  } /* ataque antes da execução não persegue fundo: segura e espera a próxima espiada */
  b.ads = clamp(
    b.ads + (best && Math.hypot(b.vel.x, b.vel.z) < 3 ? dt * 4 : -dt * 5),
    0,
    1
  ); /* mira pela luneta/mira quando há alvo */
  if (best) {
    /* combate: mira converge com o tempo, cabeça só depois de assentar */
    if (ai.seeT > D.conv && !ai.headRolled) {
      ai.headRolled = true;
      ai.aimHead = Math.random() < D.head;
    }
    if (ai.aimHead || best._vis === 'head') headPos(best, _tp);
    else _tp.set(best.pos.x, best.pos.y + 1.1 - 0.4 * best.crouchK, best.pos.z);
    /* a mira segue uma posição "lembrada" com atraso (tempo de reação humano): alvo andando de lado fica para trás da mira */
    if (!ai.aimP || ai.aimFor !== best) {
      ai.aimP = _tp.clone();
      ai.aimFor = best;
    } else {
      const hold = b.side === 'def' && !ai.roamer && Math.hypot(b.vel.x, b.vel.z) < 0.5,
        k = Math.min(1, dt / ((D.lag || 0.2) * (hold ? 0.45 : 1)));
      /* quem segura ângulo parado acompanha melhor */ ai.aimP.x += (_tp.x - ai.aimP.x) * k;
      ai.aimP.y += (_tp.y - ai.aimP.y) * k;
      ai.aimP.z += (_tp.z - ai.aimP.z) * k;
    }
    const lagD = Math.hypot(_tp.x - ai.aimP.x, _tp.z - ai.aimP.z);
    _tp.copy(ai.aimP);
    const dx = _tp.x - eye.x,
      dy = _tp.y - eye.y,
      dz = _tp.z - eye.z,
      hd = Math.hypot(dx, dz);
    const wy = Math.atan2(-dx, -dz),
      wp = Math.atan2(dy, hd),
      tr = D.turn * dt * (1 + Math.min(ai.seeT, 1));
    b.yaw += clamp(angDiff(wy, b.yaw), -tr, tr);
    b.pitch += clamp(wp - b.pitch, -tr, tr);
    const off = Math.abs(angDiff(wy, b.yaw));
    ai.reactT -= dt;
    const anchor = b.side === 'def' && !ai.roamer;
    ai.strafeT = (ai.strafeT || 0) - dt;
    if (ai.strafeT <= 0) {
      ai.strafe = Math.random() < 0.5 ? -1 : 1;
      ai.strafeT = rand(0.4, 1.2);
      ai.crouchPref = anchor ? Math.random() < 0.6 : Math.random() < 0.25;
    }
    wantCrouch = ai.crouchPref;
    /* ferido: recua para trás da cobertura em vez de trocar tiro até morrer (como um jogador de verdade) */
    const hurtBack =
      b.hp < RETREAT_HP &&
      hd > 4 &&
      !isCarrier &&
      !(b.side === 'atk' && atkCommitted(b)) &&
      !b.act &&
      !(G.planted && b.side === 'def' && b.pos.distanceTo(G.planted.pos) < 3) &&
      agents.some((m) => m.alive && m !== b && m.side === b.side);
    if (hurtBack) ai.recoverUntil = G.clock + rand(5, 9);
    if (hurtBack && !isCarrier) {
      const ux = (b.pos.x - best.pos.x) / Math.max(0.1, hd),
        uz = (b.pos.z - best.pos.z) / Math.max(0.1, hd);
      mv = {
        x: ux * 0.85 + Math.cos(b.yaw) * ai.strafe * 0.35,
        z: uz * 0.85 - Math.sin(b.yaw) * ai.strafe * 0.35,
      };
      speed *= 0.75;
      wantCrouch = false;
    } else if (
      isCarrier &&
      !planting &&
      agents.some((m) => m.alive && m !== b && m.side === 'atk') &&
      !b.act
    ) {
      /* portador recua para trás da cobertura e deixa os colegas trocarem tiro */
      const ux = (b.pos.x - best.pos.x) / Math.max(0.1, hd),
        uz = (b.pos.z - best.pos.z) / Math.max(0.1, hd);
      mv = {
        x: ux * 0.8 + Math.cos(b.yaw) * ai.strafe * 0.3,
        z: uz * 0.8 - Math.sin(b.yaw) * ai.strafe * 0.3,
      };
      speed *= 0.7;
      wantCrouch = true;
    } else if (!(ai.burst > 0) && !anchor && !b.act) {
      if (b.side === 'atk' && ai.seeT > 2.5 && hd > 5 && !isCarrier && atkCommitted(b)) {
        const m = navTo(b, best.pos, dt, makeCost('atk'));
        if (!m.busy) {
          mv = {
            x: m.x * 0.8 + Math.cos(b.yaw) * ai.strafe * 0.4,
            z: m.z * 0.8 - Math.sin(b.yaw) * ai.strafe * 0.4,
          };
        }
        speed *= 0.6;
      } else {
        mv = { x: Math.cos(b.yaw) * ai.strafe, z: -Math.sin(b.yaw) * ai.strafe };
        speed *= 0.45;
      }
    }
    if (ws.mag === 0 && b.reloadT <= 0) {
      if (ws.res <= 0 && b.cur === 'p' && b.w.s.mag + b.w.s.res > 0) {
        b.cur = 's';
        b.fireCD = 0.4;
        b.ads = 0;
        HOOK.draw(b);
      } else startReload(b);
    } /* sem munição: troca para a pistola */
    /* atacante parado em troca de tiro inclina para espiar (só se o lado estiver livre) */
    if (ai.leanSide == null) {
      ai.leanSide = Math.random() < 0.5 ? -1 : 1;
      ai.leanOK = b.side === 'atk' ? !isCarrier : Math.random() < 0.4;
    } /* defensores também espiam às vezes */
    if (ai.leanOK && Math.hypot(b.vel.x, b.vel.z) < 0.6) {
      const e0 = new V3(b.pos.x, b.pos.y + EYE - (EYE - EYE_C) * b.crouchK, b.pos.z),
        side = new V3(Math.cos(b.yaw) * ai.leanSide, 0, -Math.sin(b.yaw) * ai.leanSide);
      if (traceWorld(e0, side, 0.6, true).t >= 0.6) ai.leanWant = ai.leanSide * 0.85;
    }
    if (
      b.op.gadget === 'frag' &&
      b.gadgetN > 0 &&
      hd > 6 &&
      hd < 18 &&
      ai.seeT > 1.2 &&
      Math.random() < dt * 0.4
    )
      useGadget(b);
    if (
      b.op.gadget === 'flash' &&
      b.gadgetN > 0 &&
      hd > 4 &&
      hd < 14 &&
      ai.seeT > 0.8 &&
      Math.random() < dt * 0.5
    )
      useGadget(b);
    if (
      b.side === 'atk' &&
      b.op.gadget === 'shield' &&
      b.gadgetN > 0 &&
      hd > 4 &&
      hd < 16 &&
      ai.seeT > 1 &&
      Math.random() < dt * 0.5
    )
      useGadget(b);
    if (ai.reactT <= 0 && off < 0.1 && b.reloadT <= 0) {
      if (ai.burstPause > 0) ai.burstPause -= dt;
      else {
        if (!(ai.burst > 0)) ai.burst = wd.auto ? (hd < 10 ? 6 : 3 + ((Math.random() * 3) | 0)) : 1;
        const moving = Math.hypot(b.vel.x, b.vel.z) > 1;
        let err =
          D.err * (1 + hd / 40) * (1 + 1.5 * Math.max(0, 1 - ai.seeT / D.conv)) +
          (moving ? 0.02 : 0) +
          Math.min(0.04, lagD * 0.02);
        if (wd.pellets) err *= 0.5;
        if (ai.wasteFor !== best) {
          ai.wasteFor = best;
          ai.wasteN = 0;
          ai.wasteHp = best.hp;
        }
        if (fire(b, err)) {
          ai.burst--;
          if (best.hp < ai.wasteHp) {
            ai.wasteN = 0;
            ai.wasteHp = best.hp;
          } else if (++ai.wasteN >= 45) {
            ai.ignoreE = best;
            ai.ignoreT = G.clock + 5;
            ai.wasteN = 0;
          }
          if (ai.burst <= 0) {
            ai.burstPause = wd.auto ? rand(0.18, 0.45) : wd.rate + rand(0.1, 0.35);
          }
        }
      }
    }
  } else {
    ai.burst = 0;
    ai.headRolled = false;
    ai.alertT = (ai.alertT || 0) - dt;
    b.pitch *= 0.92;
    if (ws.mag + ws.res <= 0 && b.cur === 'p' && b.w.s.mag + b.w.s.res > 0 && b.reloadT <= 0) {
      b.cur = 's';
      b.fireCD = 0.4;
      b.ads = 0;
      HOOK.draw(b);
    } /* principal sem munição nenhuma: saca a pistola também fora do combate */
    else if (ws.mag < wd.mag * 0.45 && b.reloadT <= 0) startReload(b);
    if (ai.hurtFrom) {
      faceTo(b, ai.hurtFrom, null, dt, D.turn);
      if (
        Math.abs(
          angDiff(Math.atan2(-(ai.hurtFrom.x - b.pos.x), -(ai.hurtFrom.z - b.pos.z)), b.yaw)
        ) < 0.1
      )
        ai.hurtFrom = null;
    }
    if (G.clock < (ai.recoverUntil || 0)) {
      ai.chase = null;
      ai.investigate = null;
    } /* recém-recuado: segura a posição um tempo antes de voltar ao plano */
    mv =
      G.clock < (ai.recoverUntil || 0) && !(G.planted && b.side === 'def')
        ? { x: 0, z: 0, look: ai.lastSeen || null, crouch: true }
        : b.side === 'atk'
          ? attackPlan(b, dt)
          : defendPlan(b, dt);
    wantCrouch = !!mv.crouch;
    if (mv.busy) {
      moveBot(b, { x: 0, z: 0 }, 0, dt);
      b.crouchK = clamp(b.crouchK + (wantCrouch ? 1 : -1) * dt * 4, 0, 1);
      return;
    }
    if (!ai.hurtFrom && (mv.x || mv.z)) {
      const wy = Math.atan2(-mv.x, -mv.z);
      b.yaw += clamp(angDiff(wy, b.yaw), -5 * dt, 5 * dt);
      /* corre em deslocamentos longos sem ameaça por perto */
      if (
        !wantCrouch &&
        !((ai.alertT || 0) > 0) &&
        b.reloadT <= 0 &&
        Math.abs(angDiff(wy, b.yaw)) < 0.4 &&
        ai.path &&
        ai.path.length > 3
      ) {
        b.sprint = true;
        speed *= 1.3;
      }
    } else if (mv.look && !ai.hurtFrom) faceTo(b, mv.look, 1.3, dt, 3);
    ai.stuckT = (ai.stuckT || 0) + dt;
    if (ai.stuckT > 2) {
      if ((mv.x || mv.z) && ai.lastPos && ai.lastPos.distXZ(b.pos) < 0.4) {
        /* travou: evita a próxima célula do caminho por 8 s e recalcula */
        const nx = ai.path && ai.path[0];
        if (nx) {
          if (!ai.avoid || G.clock > ai.avoidUntil) ai.avoid = new Set();
          ai.avoid.add(nx.z * W + nx.x);
          ai.avoidUntil = G.clock + 8;
        }
        ai.path = [];
        ai.repathT = 0;
        ai.chase = null;
        ai.investigate = null;
      }
      ai.lastPos = b.pos.clone();
      ai.stuckT = 0;
    }
  }
  b.crouchK = clamp(b.crouchK + (wantCrouch ? 1 : -1) * dt * 4, 0, 1);
  b.lean += clamp(wantLean - b.lean, -dt * 5, dt * 5);
  if (!best) ai.leanSide = null;
  moveBot(b, mv, speed * (b.crouchK > 0.5 ? 0.5 : 1), dt);
};

/* ---------- preparação da defesa ---------- */
function prepTask(b, dt) {
  const ai = b.ai;
  if (!ai.task && ai.tasks && ai.tasks.length) ai.task = ai.tasks.shift();
  const t = ai.task;
  const cost = makeCost('def');
  if (!t) {
    if (ai.hold.distXZ(b.pos) > 1) return navTo(b, ai.hold, dt, cost);
    return { x: 0, z: 0, look: ai.watch.in, crouch: false };
  }
  if (t.kind === 'shield') {
    if (ai.hold.distXZ(b.pos) > 1) return navTo(b, ai.hold, dt, cost);
    if (faceTo(b, ai.watch.in, 1, dt, 6)) {
      useGadget(b);
      ai.task = null;
    }
    return { x: 0, z: 0 };
  }
  const sp = cellCenter(t.stand);
  if (sp.distXZ(b.pos) > 0.7) return navTo(b, sp, dt, cost);
  if (t.kind === 'reinforce') {
    if (faceTo(b, wallCenter(t.w), 1.5, dt, 6)) {
      ai.taskT = (ai.taskT || 0) + dt;
      if (ai.taskT > 2) {
        ai.taskT = 0;
        if (t.w.p.every((v) => v >= PANEL_HP)) reinforceWall(t.w, b);
        ai.task = null;
      }
    }
    return { x: 0, z: 0 };
  }
  if (t.kind === 'wire' || t.kind === 'impact') {
    if (faceTo(b, t.face, t.face.y || 0, dt, 6)) {
      ai.taskT = (ai.taskT || 0) + dt;
      if (ai.taskT > 0.5) {
        ai.taskT = 0;
        if (t.kind === 'impact') b.pitch = 0.05;
        useGadget(b);
        ai.task = null;
      }
    }
    return { x: 0, z: 0 };
  }
  ai.task = null;
  return { x: 0, z: 0 };
}

/* ---------- execução do plano de ataque ---------- */
/* ponto de planta: a célula livre do objetivo mais próxima do portador (planta na borda, como no Siege) */
function plantSpot(b, S) {
  let best = null,
    bd = 1e9;
  for (let z = S.z0; z <= S.z1; z++)
    for (let x = S.x0; x <= S.x1; x++) {
      if (cellAt(x, z) !== 0) continue;
      const c = cellCenter({ x, z }),
        d = c.distXZ(b.pos);
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
  return best || siteCenter(S);
}
/* atacante já está executando (entrar/plantar) ou o tempo apertou: pode perseguir e empurrar */
/* hora de executar de qualquer jeito: em desvantagem numérica o ataque espera mais (pode perder no tempo, como no Siege) */
function atkLate() {
  const d = aliveOf('def').length - aliveOf('atk').length;
  return G.phaseT < (d >= 2 ? ATK_LATE * 0.25 : d >= 1 ? ATK_LATE * 0.5 : ATK_LATE);
}
function atkCommitted(b) {
  const g = b.ai.group;
  return G.planted || atkLate() || !g || g.stage === 'enter';
}
/* esperando na entrada: não fica plantado num ponto só; troca de canto a cada poucos segundos checando ângulos (como quem pilota drone e reposiciona) */
function stackHold(b, gr, dt, cost) {
  const ai = b.ai,
    st = gr.entry.stack;
  if (!ai.stackSpot || ai.stackFor !== gr.entry || G.clock > ai.stackUntil) {
    ai.stackFor = gr.entry;
    ai.stackUntil = G.clock + rand(5, 9);
    const sx = Math.floor(st.x / CELL),
      sz = Math.floor(st.z / CELL),
      opts = [];
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++) {
        const x = sx + dx,
          z = sz + dz;
        if (cellAt(x, z) === 0 && !inRoom(SITES[G.siteKey].room, cellCenter({ x, z })))
          opts.push({ x, z });
      }
    /* antes de executar, fica onde os cantos da defesa não enxergam (o primeiro contato acontece na entrada, não de longe) */
    const hs = safeHolds(G.siteKey).map(([x, z]) => new V3(cc(x), 1.4, cc(z))),
      hid = opts.filter((c) => {
        const e = new V3(cc(c.x), 1.4, cc(c.z));
        return !hs.some((h) => clearSight(e, h));
      });
    /* troca de canto de verdade (≥ 1,2 m): quem espera muito na entrada não fica estátua */
    const far = (l) => l.filter((c) => cellCenter(c).distXZ(b.pos) > 1.2),
      pool = far(hid).length ? far(hid) : far(opts).length ? far(opts) : hid.length ? hid : opts;
    const car = AI.atk && AI.atk.carrier === b,
      ein = gr.entry.in; /* portador espera no canto mais recuado (longe da entrada) */
    const c = pool.length
      ? car
        ? pool.slice().sort((p, q) => cellCenter(q).distXZ(ein) - cellCenter(p).distXZ(ein))[0]
        : pick(pool)
      : { x: sx, z: sz };
    ai.stackSpot = cellCenter(c).add(new V3(rand(-0.6, 0.6), 0, rand(-0.6, 0.6)));
    ai.stackLook = Math.random() < 0.6 ? gr.entry.in : null;
    ai.stackCrouch = Math.random() < 0.7;
  }
  if (b.pos.distXZ(ai.stackSpot) > 0.9) {
    const m = navTo(b, ai.stackSpot, dt, cost);
    if (m.fail) {
      ai.stackSpot = null;
      return { x: 0, z: 0, look: gr.entry.in, crouch: true };
    }
    return m;
  }
  if (!ai.stackLook || Math.random() < dt * 0.2)
    ai.stackLook =
      Math.random() < 0.6 ? gr.entry.in : new V3(b.pos.x + rand(-8, 8), 0, b.pos.z + rand(-8, 8));
  return { x: 0, z: 0, look: ai.stackLook, crouch: ai.stackCrouch };
}
function attackPlan(b, dt) {
  const ai = b.ai,
    P = AI.atk,
    S = SITES[G.siteKey];
  const cost = makeCost(
    'atk',
    b.op.gadget === 'thermal' && b.gadgetN > 0,
    P && P.carrier === b && b.op.gadget !== 'breach' && b.op.gadget !== 'thermal'
  );
  if (!P || !ai.group) {
    /* bot sem grupo (não deve ocorrer) vai direto ao objetivo */ return navTo(
      b,
      siteCenter(S),
      dt,
      cost
    );
  }
  if (P.carrier === b)
    ai.chase = null; /* portador não persegue ninguém: o trabalho dele é plantar */
  if (ai.chase) {
    if (ai.chase.distXZ(b.pos) < 1.6 || G.planted) ai.chase = null;
    else {
      const m = navTo(b, ai.chase, dt, cost);
      if (m.fail) ai.chase = null;
      else return m;
    }
  }
  if (ai.investigate && !atkCommitted(b) && ai.investigate.distXZ(b.pos) > 10)
    ai.investigate = null; /* barulho longe antes da execução: anota e segura a posição */
  if (ai.investigate && !G.planted && P.carrier !== b) {
    if (ai.investigate.distXZ(b.pos) < 1.8) ai.investigate = null;
    else {
      const m = navTo(b, ai.investigate, dt, cost);
      if (m.fail) ai.investigate = null;
      else return m;
    }
  }
  if (P.carrier === b) ai.investigate = null;
  /* pós-planta: segurar em volta do desativador vigiando as entradas */
  if (G.planted) {
    /* pós-planta (como no Siege): fica a 5–10 m do desativador, com visão dele, mirando em quem vier desativar */
    const dp = G.planted.pos,
      see = (c) => {
        const p = cellCenter(c);
        return clearLine(new V3(p.x, 1.2, p.z), new V3(dp.x, 0.4, dp.z));
      };
    if (!ai.guard) {
      const vis =
        Math.random() <
        POST_LOS; /* parte do time vigia o desativador; o resto se esconde cobrindo as entradas (joga com o tempo) */
      let cells = roomCells(S.room)
        .concat(
          roomCells({ x0: S.room.x0 - 2, x1: S.room.x1 + 2, z0: S.room.z0 - 2, z1: S.room.z1 + 2 })
        )
        .filter((c) => {
          const d = cellCenter(c).distXZ(dp);
          return d > 4 && d < 12 && see(c) === vis;
        });
      ai.guard = cellCenter(pick(cells.length ? cells : roomCells(S.room)));
      ai.guardVis = vis;
    }
    if (ai.guard.distXZ(b.pos) > 1) return navTo(b, ai.guard, dt, cost);
    if (!ai.lookE || Math.random() < dt * 0.15) {
      const e = pick(TACT[G.siteKey].entries);
      ai.lookE =
        ai.guardVis && Math.random() < 0.65
          ? new V3(dp.x, 0, dp.z)
          : cellCenter({ x: e.in[0], z: e.in[1] });
    }
    return { x: 0, z: 0, look: ai.lookE, crouch: true };
  }
  /* portador: se já está no objetivo, planta */
  if (P.carrier === b && inSite(S, b.pos)) {
    b.vel.multiplyScalar(0.5);
    tickAct(b, dt, true);
    if (b.act) return { x: 0, z: 0, busy: true, crouch: true };
    return navTo(b, plantSpot(b, S), dt, cost);
  }
  const gr = ai.group;
  gr.t += dt / Math.max(1, gr.members.filter((m) => m.alive).length);
  const late = atkLate(); /* ataque executa com calma (reconhecimento) e só apressa no fim */
  /* portador entra por último: só avança quando um colega já está na sala ou o objetivo parece limpo */
  if (P.carrier === b && P.groups.some((g) => g.stage === 'enter')) {
    const mates = agents.filter(
      (a) => a.alive && a.side === 'atk' && a !== b && inRoom(S.room, a.pos)
    ).length;
    const quiet = (!AI.intel.atk || G.clock - AI.intel.atk.t > 5) && aliveOf('def').length <= 2;
    const eg0 = P.groups.find((g) => g.stage === 'enter');
    if (eg0 && eg0.enterAt == null) eg0.enterAt = G.clock;
    const waited = eg0 && G.clock - eg0.enterAt > 0.4,
      alone = !agents.some((a) => a.alive && a.side === 'atk' && a !== b);
    if (
      mates ||
      quiet ||
      late ||
      waited ||
      alone ||
      aliveOf('def').length <= 2 ||
      aliveOf('atk').length >= aliveOf('def').length + 2
    )
      /* vantagem numérica: vai plantar */ return navTo(b, plantSpot(b, S), dt, cost);
    const eg = P.groups.find((g) => g.stage === 'enter');
    const back = eg.entry.stack
      .clone()
      .addScaledVector(
        eg.entry.stack.clone().sub(eg.entry.in).setY(0).normalize(),
        2.2
      ); /* portador fica mais atrás */
    const bp = eg.entry.stack;
    void back;
    if (b.pos.distXZ(bp) > 1.6) return navTo(b, bp, dt, cost);
    return { x: 0, z: 0, look: eg.entry.in, crouch: true };
  }
  if (gr.stage === 'approach') {
    const alive = gr.members.filter((m) => m.alive);
    const ready = alive.filter((m) => m.pos.distXZ(gr.entry.stack) < 3.5).length;
    if (gr.recon == null) gr.recon = RECON_T * rand(0.8, 1.25);
    const el =
      ACTION_T -
      G.phaseT; /* relógio da rodada (não para durante as trocas de tiro): executa no horário combinado */
    const adv =
      aliveOf('def').length <= 2 ||
      aliveOf('atk').length >=
        aliveOf('def').length + 2; /* vantagem numérica clara: executa já e vai plantar */
    const down =
      aliveOf('def').length >=
      aliveOf('atk').length +
        2; /* em desvantagem: não força a execução no horário; espera o fim (e às vezes perde no tempo, como no Siege) */
    if (
      (ready >= Math.ceil(alive.length * 0.6) && (el > gr.recon || adv) && !down) ||
      (el > gr.recon + 12 && !down) ||
      late
    )
      /* tempo de reconhecimento (drone/checagem) antes de romper */ gr.stage = structBlocked(
        gr.entry.s
      )
        ? 'breach'
        : 'enter';
    return stackHold(b, gr, dt, cost);
  }
  if (gr.stage === 'breach') {
    if (!structBlocked(gr.entry.s)) {
      gr.stage = 'enter';
      return { x: 0, z: 0 };
    }
    let br = gr.breacher;
    if (!br || !br.alive) {
      br = gr.members.find((m) => m.alive);
      gr.breacher = br;
    }
    if (br === b) {
      if (gr.entry.s.p && gr.entry.s.reinforced && !(b.op.gadget === 'thermal' && b.gadgetN > 0)) {
        /* parede reforçada: troca de entrada */
        const alt = TACT[G.siteKey].entries
          .map(entryObj)
          .find((e) => e.name !== gr.entry.name && !(e.s.p && e.s.reinforced));
        if (alt) {
          gr.entry = alt;
          gr.stage = 'approach';
          gr.t = 8;
        }
        return { x: 0, z: 0 };
      }
      return navTo(b, gr.entry.in, dt, cost); // navTo rompe a estrutura no caminho
    }
    if (gr.breachAt == null) gr.breachAt = G.clock;
    if (G.clock - gr.breachAt > 20 && !late)
      gr.stage = 'enter'; /* rompimento travado (rompedor morto/sem carga): entra pelo que tiver */
    return stackHold(b, gr, dt, cost);
  }
  /* entrar: portador vai ao centro do objetivo, os outros se espalham na sala e cobrem */
  if (P.carrier === b) return navTo(b, plantSpot(b, S), dt, cost);
  if (!ai.spot || Math.random() < dt * 0.05) {
    const cells = roomCells(S.room);
    ai.spot = cellCenter(pick(cells));
  }
  if (ai.spot.distXZ(b.pos) > 1.2) return navTo(b, ai.spot, dt, cost);
  /* portador plantando: os outros cobrem as entradas */
  if (P.carrier && P.carrier.act && P.carrier.act.kind === 'plant') {
    const e = TACT[G.siteKey].entries
      .map(entryObj)
      .sort((x, y) => x.in.distXZ(b.pos) - y.in.distXZ(b.pos));
    return { x: 0, z: 0, look: (e[1] || e[0]).in, crouch: true };
  }
  const it = AI.intel.atk;
  return {
    x: 0,
    z: 0,
    look: it && G.clock >= it.avail && G.clock - it.t < 6 ? it.pos : siteCenter(S),
    crouch: Math.random() < 0.5,
  };
}

/* ---------- execução do plano de defesa ---------- */
function defendPlan(b, dt) {
  const ai = b.ai,
    cost = makeCost('def'),
    S = SITES[G.siteKey];
  if (G.planted) {
    const P = G.planted;
    const defs = agents
      .filter((a) => a.alive && a.bot && a.side === 'def')
      .sort((x, y) => x.pos.distanceTo(P.pos) - y.pos.distanceTo(P.pos));
    /* retomada com calma (como no Siege): o time se junta escondido perto do objetivo e só vai desativar quando o tempo aperta,
       quando ninguém viu atacante há alguns segundos ou com vantagem numérica */
    const it = AI.intel.def,
      quiet = !it || G.clock - it.t > 5,
      outn = aliveOf('atk').length - defs.length;
    /* em desvantagem a defesa não entra de peito aberto: espera escondida e tenta a desativação no fim (às vezes não dá tempo) */
    const need =
      (b.pos.distXZ(P.pos) * 1.35) / speedOf(b) +
      DEFUSE_HOLD +
      2.5; /* tempo para chegar (caminho ~35% maior que a reta) e desativar */
    const goT =
      outn >= 2 ? need : outn >= 1 ? Math.max(need, RETAKE_T * 0.75) : Math.max(need, RETAKE_T);
    const go =
      P.t < goT ||
      (quiet && outn < 1) ||
      defs.length >= aliveOf('atk').length + 2 ||
      b.pos.distanceTo(P.pos) < 2.5;
    if (!go && outn >= 2) {
      ai.stage = null;
      return { x: 0, z: 0, look: P.pos, crouch: true };
    } /* sem chance no peito: fica escondido e tenta a desativação na última hora */
    if (!go) {
      if (!ai.stage || ai.stageFor !== P) {
        ai.stageFor = P;
        const cand = [];
        for (let z = BZ0 + 1; z < BZ1; z++)
          for (let x = BX0 + 1; x < BX1; x++) {
            if (cellAt(x, z) !== 0) continue;
            const c = cellCenter({ x, z }),
              d = c.distXZ(P.pos);
            if (d < 7 || d > 15 || inRoom(S.room, c)) continue;
            if (clearLine(new V3(c.x, 1.3, c.z), new V3(P.pos.x, 0.5, P.pos.z))) continue;
            cand.push(c);
          }
        cand.sort((p, q) => p.distXZ(b.pos) - q.distXZ(b.pos));
        ai.stage = cand.length ? cand[Math.min(cand.length - 1, (Math.random() * 3) | 0)] : null;
      }
      if (ai.stage) {
        if (ai.stage.distXZ(b.pos) > 1.1) return navTo(b, ai.stage, dt, cost);
        return { x: 0, z: 0, look: P.pos, crouch: true };
      }
    }
    if (defs[0] === b) {
      if (b.pos.distanceTo(P.pos) < 1.5) {
        tickAct(b, dt, true);
        return { x: 0, z: 0, busy: !!b.act, crouch: true };
      }
      return navTo(b, P.pos, dt, cost);
    }
    if (!ai.guard || ai.guard.distXZ(P.pos) > 8) {
      const cells = roomCells(S.room);
      ai.guard = cellCenter(pick(cells));
    }
    if (ai.guard.distXZ(b.pos) > 1.2) return navTo(b, ai.guard, dt, cost);
    return { x: 0, z: 0, look: P.pos, crouch: true };
  }
  if (ai.roamer) {
    const it = AI.intel.def;
    const late = G.phaseT < 35; /* patrulheiro continua fora até o fim (como no Siege) */
    if (!late) {
      if (ai.chase) {
        if (ai.chase.distXZ(b.pos) < 1.6 || ai.chase.distXZ(b.pos) > 9) ai.chase = null;
        else return navTo(b, ai.chase, dt, cost);
      } /* patrulheiro só persegue de perto: o trabalho dele é atrasar, não caçar */
      if (it && G.clock >= it.avail && G.clock - it.t < 5 && it.pos.distXZ(b.pos) < 12) {
        if (it.pos.distXZ(b.pos) > 2) return navTo(b, it.pos, dt, cost);
      }
      if (ai.roam && ai.roam.distXZ(b.pos) < 1.5) {
        if (ai.roamHold == null) ai.roamHold = G.clock + rand(14, 28);
        if (G.clock < ai.roamHold) {
          if (!ai.roamLook || Math.random() < dt * 0.25)
            ai.roamLook = new V3(b.pos.x + rand(-9, 9), 0, b.pos.z + rand(-9, 9));
          return { x: 0, z: 0, look: ai.roamLook, crouch: false };
        }
      } /* patrulheiro para num canto e segura um tempo */
      if (!ai.roam || ai.roam.distXZ(b.pos) < 1.5 || Math.random() < dt * 0.03) {
        ai.roamHold = null;
        const cells = [];
        for (let z = BZ0 + 1; z < BZ1; z++)
          for (let x = BX0 + 1; x < BX1; x++)
            if (cellAt(x, z) === 0 && !inRoom(S.room, cellCenter({ x, z }))) cells.push({ x, z });
        ai.roam = cellCenter(pick(cells));
      }
      return navTo(b, ai.roam, dt, cost);
    }
  } else if (ai.investigate && ai.investigate.distXZ(b.pos) < 4) {
    if (ai.investigate.distXZ(b.pos) < 1.5) ai.investigate = null;
    else return navTo(b, ai.investigate, dt, cost);
  }
  if (ai.hold.distXZ(b.pos) > 1) return navTo(b, ai.hold, dt, cost);
  /* âncora: segura o ângulo da entrada dele; com aviso fresco do time perto do objetivo, vira para lá */
  const it = AI.intel.def;
  if (
    it &&
    G.clock >= it.avail &&
    G.clock - it.t < 4 &&
    it.pos.distXZ(b.pos) < 16 &&
    clearSight(new V3(b.pos.x, 1.3, b.pos.z), new V3(it.pos.x, 1.3, it.pos.z))
  )
    return { x: 0, z: 0, look: it.pos, crouch: true };
  return { x: 0, z: 0, look: ai.watch.in, crouch: true };
}
