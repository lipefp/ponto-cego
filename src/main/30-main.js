/* =====================================================================
   PRINCIPAL — liga simulação ↔ renderização/áudio/UI, entrada e laço
   ===================================================================== */
const _mz = new V3();
function muzzleOf(a, o) {
  if (a === player && !a.bot && camMode === 'fp' && VM.info && VM.info.flash) {
    const p = VM.info.flash.getAbsolutePosition();
    return _mz.set(p.x, p.y, p.z);
  }
  const e = eyeOf(a),
    f = dirFrom(a.yaw, a.pitch);
  return _mz.set(
    e.x + f.x * 0.7 + Math.cos(a.yaw) * 0.18,
    e.y + f.y * 0.7 - 0.3,
    e.z + f.z * 0.7 - Math.sin(a.yaw) * 0.18
  );
}
/* ---------- física visual (Havok, v4): estilhaços e cartuchos ---------- */
const PHYS = (() => {
  if (typeof PCCORE === 'undefined' || !window.PC_HAVOK) return null;
  try {
    const ph = PCCORE.createPhysics({
      B,
      scene: game,
      havok: window.PC_HAVOK,
      map: {
        W,
        H,
        CELL,
        WALL_H,
        CRATE_H,
        DOOR_H,
        BX0,
        BX1,
        BZ0,
        BZ1,
        cellAt,
        walls: WALLS,
        doors: DOORS,
      },
      debrisMaterial: pbr(game, { color: '#ffffff', rough: 0.9 }),
      addShadowCaster: (m) => caster(m),
    });
    return ph;
  } catch (e) {
    console.warn('física indisponível', e);
    return null;
  }
})();
/* estilhaços: com Havok, fxDebris (usado também pelo vidro em 11-world) passa a gerar corpos físicos; sem Havok fica o efeito antigo */
if (PHYS) {
  debMesh.setEnabled(false);
  fxDebris = (p, n, hex, power) => PHYS.debris3(p, n, C3(hex).toLinearSpace(), power);
}
const debris = (p, n, hex, power) => fxDebris(p, n, hex, power);
const _cr = new V3(),
  _cu = new V3(),
  _cp = new V3();
/* cartucho ejetado (lado direito da arma; espelha com a mão esquerda) */
function ejectCasing(a) {
  if (!PHYS) return;
  const fp = a === player && !a.bot && camMode === 'fp';
  if (!fp && a.pos.distanceTo(new V3(camera.position.x, camera.position.y, camera.position.z)) > 18)
    return;
  const f = dirFrom(a.yaw, a.pitch),
    hs = fp && SAVE.hand === 'left' ? -1 : 1;
  _cr.set(Math.cos(a.yaw) * hs, 0, -Math.sin(a.yaw) * hs);
  _cu.crossVectors(_cr, f).multiplyScalar(-hs);
  if (fp) {
    const e = eyeOf(a);
    _cp.set(
      e.x + f.x * 0.32 + _cr.x * 0.07 - _cu.x * 0.09,
      e.y + f.y * 0.32 + _cr.y * 0.07 - _cu.y * 0.09,
      e.z + f.z * 0.32 + _cr.z * 0.07 - _cu.z * 0.09
    );
  } else {
    const m = muzzleOf(a);
    _cp.set(m.x - f.x * 0.45, m.y - f.y * 0.45 + 0.03, m.z - f.z * 0.45);
  }
  PHYS.casing(_cp, _cr, _cu, a.vel);
}
/* ---------- ganchos da simulação ---------- */
Object.assign(HOOK, {
  roundStart() {
    onRoundStartUI();
    clearFx();
    VM.th = null;
    VM.gn = null;
    if (typeof fpvHeld === 'function') fpvHeld(null);
    if (PHYS) PHYS.clear();
    VM.shake = 0;
  },
  structuresReset() {
    for (const w of WALLS) {
      setReinforcedMesh(w, false);
      refreshWall(w, false);
    }
    panelInt.thinInstanceBufferUpdated('matrix');
    panelExt.thinInstanceBufferUpdated('matrix');
    for (const d of DOORS) d.mesh.setEnabled(true);
    if (PHYS) PHYS.refreshAll();
    radarDirty = true;
  },
  /* online: redesenha paredes, portas e janelas pelo estado atual (depois de voltar de uma queda de conexão) */
  resync() {
    for (const w of WALLS) {
      setReinforcedMesh(w, !!w.reinforced);
      refreshWall(w, false);
    }
    panelInt.thinInstanceBufferUpdated('matrix');
    panelExt.thinInstanceBufferUpdated('matrix');
    for (const d of DOORS) d.mesh.setEnabled(d.hp > 0);
    if (typeof setWinPane === 'function') for (const w of WINS) setWinPane(w, !w.broken);
    if (PHYS) PHYS.refreshAll();
    radarDirty = true;
  },
  panelBroken(w, i, pt) {
    panelMatrix(w, i);
    w.mesh.thinInstanceBufferUpdated('matrix');
    if (PHYS) PHYS.refreshStruct(w);
    debris(pt, 4, w.ext ? '#a66a55' : '#e2dccf', 2.5);
    radarDirty = true;
  },
  wallChanged(w, big, pt) {
    refreshWall(w);
    if (PHYS) PHYS.refreshStruct(w);
    const c = pt || wallCenter(w);
    debris(c, big ? 16 : 6, w.ext ? '#a66a55' : '#e2dccf', big ? 5 : 3);
    radarDirty = true;
  },
  reinforce(w, on) {
    setReinforcedMesh(w, on);
    if (PHYS) PHYS.refreshStruct(w);
    radarDirty = true;
  },
  doorBroken(d) {
    d.mesh.setEnabled(false);
    if (PHYS) PHYS.refreshStruct(d);
    const c = new V3(cc(d.x), 1.2, cc(d.z));
    debris(c, 12, '#8a6a45', 3.5);
    playSound('door', c);
    radarDirty = true;
  },
  propAdd,
  propRemove,
  projAdd(p) {
    const m = buildGadget(game, p.type);
    propMesh.set(p, m);
  },
  projRemove: propRemove,
  deviceAdd(P) {
    if (deviceMesh) deviceMesh.dispose();
    deviceMesh = buildGadget(game, 'device');
    deviceMesh.position.set(P.pos.x, P.pos.y, P.pos.z);
  },
  deviceRemove() {
    if (deviceMesh) {
      deviceMesh.dispose();
      deviceMesh = null;
    }
  },
  tracer() {} /* sem rastros de bala (como no Siege) */,
  shot(a, d) {
    const mz = muzzleOf(a);
    ejectCasing(a);
    const me = a === player && !a.bot;
    playSound('gun', a.pos, { w: curW(a).id, me, sup: d.sup });
    if (me) {
      VM.kick = 1;
      /* trauma: tremor curto da câmera por tiro, maior nas armas pesadas (decai sozinho no updateCamera) */
      VM.shake = Math.min(
        0.4,
        VM.shake + (d.cls === 'sg' || d.cls === 'sgs' || d.cls === 'dmr' || d.cls === 'lmg' ? 0.09 : 0.045)
      );
      if (VM.info && !d.sup) VM.info.flash.material.alpha = 1;
      if (d.cls === 'sg') VM.pumpT = 0.55;
      if (!d.sup) {
        flashLight.position.set(mz.x, mz.y, mz.z);
        flashLight.intensity = 1.2;
      }
    } else if (!d.sup) fxFlash(mz);
  } /* supressor: sem clarão */,
  impact(pt, kind) {
    if (kind !== 'metal' && kind !== 'drywall' && kind !== 'brick' && kind !== 'glass') fxDecal(pt);
    /* vidro quebra no mesmo tiro: marca ficaria flutuando */ fxPuff(
      pt,
      IMPACT[kind] || '#999',
      0.45
    );
    playSound('impact', pt, { kind });
  },
  blood(pt, head) {
    fxPuff(pt, '#b3261e', head ? 1.3 : 1);
    playSound('impact', pt, { kind: 'flesh' });
  },
  hurt(att) {
    hurtFrom(att);
    playSound('hurt');
    VM.shake = Math.max(VM.shake, 0.45);
  },
  hitmark(head, kill) {
    hitmark(head, kill);
    playSound('hit', null, { head, kill });
  },
  agentKilled(v, att, wname, head) {
    feedLine(att, v, wname, head);
    if (v === player) {
      specIdx = 0;
    }
  },
  flash(p) {
    fxBoom(p, 2.2);
    playSound('flash', p);
  },
  blind(t) {
    playSound('ring', null, { t });
  },
  boom(p, r) {
    fxBoom(p, r);
    playSound('boom', p);
    debris(p, 6, '#4a4a4a', 5);
  },
  sparks(p) {
    if (Math.random() < 0.4)
      fxPuff(
        new V3(p.x + rand(-0.2, 0.2), p.y + rand(-0.2, 0.2), p.z + rand(-0.2, 0.2)),
        '#ffc070',
        0.3,
        0.25
      );
  },
  sound(k, p) {
    const map = {
      smash: 'smash',
      device: 'device',
      empty: 'empty',
      thermal: 'thermal',
      place: 'place',
      bounce: 'bounce',
      vault: 'vault',
      ping: 'ping',
      deny: 'deny',
      pulse: 'pulse',
      reinforce: 'reinforce',
    };
    if (map[k]) playSound(map[k], p);
  },
  land(imp) {
    VM.landDip = Math.min(1, imp / 7);
    VM.shake = Math.max(VM.shake, Math.min(0.5, imp / 14));
    playSound('land', null, { imp });
  },
  reload(a) {
    if (a === player && !a.bot) playSound('reload', null, { w: curW(a).id });
    else playSound('reload', a.pos, { w: curW(a).id, far: true });
  },
  melee(a) {
    if (a === player && !a.bot) {
      VM.meleeT = 1;
      playSound('swing');
    } else playSound('swing', a.pos);
  },
  throw(a) {
    if (a === player && !a.bot) VM.throwT = 0.4;
  },
  banner: showBanner,
  prompt: showNote,
  actionStart() {
    const s = SITES[G.siteKey];
    showBanner(
      'Ação',
      player.side === 'atk'
        ? G.siteKnown
          ? `Objetivo ${s.key}: ${s.name}`
          : 'Objetivo desconhecido · explore o prédio'
        : 'Segure o objetivo',
      '',
      1.5
    );
  },
  planted(a) {
    const mine = a.team === player.team;
    showBanner(
      'Desativador plantado',
      mine ? `Protejam o dispositivo por ${PLANT_T} segundos` : 'Desativem antes que termine',
      mine ? 'win' : 'loss',
      2.5
    );
  },
  siteFound() {
    radarDirty = true;
    const s = SITES[G.siteKey];
    showBanner('Objetivo encontrado', `${s.key} · ${s.name}`, 'win', 2.2);
    playSound('ping');
  },
  droneDestroyed(n) {
    showNote(
      n > 0
        ? 'Drone destruído · trocando para o drone reserva'
        : 'Drone destruído · sem drones até a fase de ação',
      2.5
    );
  },
  droneDeployed() {
    showNote('Drone reserva ativo', 1.5);
  },
  roundEnd(w, reason, over) {
    const win = w === player.team;
    showBanner(
      over
        ? win
          ? 'Partida vencida'
          : 'Partida perdida'
        : win
          ? 'Rodada vencida'
          : 'Rodada perdida',
      reason,
      over ? 'final' : win ? 'win' : 'loss',
      END_T - 0.4
    );
    playSound(win ? 'win' : 'lose');
  },
  matchOver() {
    matchOver();
  },
});

/* ---------- qualidade ---------- */
/* qualidade: 0 mínima · 1 baixa · 2 média · 3 alta. A escala da interface é fixa (px do navegador): trocar de qualidade não mexe nos menus */
const QUAL_SCALE = [2, 1.5, 1.25, 1];
function uiScaleSync() {
  const w = Math.max(1, innerWidth),
    h = Math.max(1, innerHeight);
  for (const t of [uiLobby, uiGame]) {
    t.idealWidth = w;
    t.idealHeight = h;
    t.renderAtIdealSize = false;
    t.useSmallestIdeal = true;
  }
}
function baseScale() {
  const q = QL();
  return q === 3 ? 1 / Math.min(window.devicePixelRatio || 1, 1.25) : QUAL_SCALE[q];
}
/* ---------- resolução automática ----------
   Mede os quadros por segundo a cada segundo de partida. Abaixo de 50, desenha em resolução menor (até 55% da
   escolhida); sobrando folga por 6 s, volta a subir. Se subir derrubar os quadros de novo, guarda esse limite por
   1 minuto para não ficar oscilando. */
const AUTO = { k: 1, acc: 0, n: 0, good: 0, floor: 1, floorT: 0, upT: 0 };
function autoApply() {
  engine.setHardwareScalingLevel(baseScale() * AUTO.k);
  uiScaleSync();
}
function autoRes(dt) {
  if (SAVE.autoRes === false) {
    if (AUTO.k !== 1) {
      AUTO.k = 1;
      autoApply();
    }
    return;
  }
  if (dt > 0.5) return; /* aba voltou do fundo: não conta */
  AUTO.acc += dt;
  AUTO.n++;
  if (AUTO.acc < 1) return;
  const fps = AUTO.n / AUTO.acc,
    now = performance.now();
  AUTO.acc = 0;
  AUTO.n = 0;
  if (now > AUTO.floorT) AUTO.floor = 1;
  if (fps < 50) {
    if (now - AUTO.upT < 4000) {
      AUTO.floor = Math.min(1.8, AUTO.k * 1.1);
      AUTO.floorT = now + 60000;
    }
    AUTO.good = 0;
    if (AUTO.k < 1.8) {
      AUTO.k = Math.min(1.8, Math.max(AUTO.floor, AUTO.k * (fps < 35 ? 1.25 : 1.12)));
      autoApply();
    }
  } else if (fps > 57) {
    if (++AUTO.good >= 6 && AUTO.k > AUTO.floor) {
      AUTO.k = Math.max(AUTO.floor, AUTO.k / 1.1);
      AUTO.good = 0;
      AUTO.upT = now;
      autoApply();
    }
  } else AUTO.good = 0;
}
function applyQuality() {
  AUTO.k = 1;
  AUTO.floor = 1;
  engine.setHardwareScalingLevel(baseScale());
  uiScaleSync();
  setupShadows();
  setupPipeline();
  persist();
}

/* ---------- ciclo de vida ---------- */
let paused = true,
  fallbackMouse = false;
function useScene(s) {
  if (s === game) {
    lobby.detachControl();
    game.attachControl();
  } else {
    game.detachControl();
    lobby.attachControl();
  }
}
function startMatch() {
  crouchToggle = false;
  leanToggle = 0;
  initAudio();
  if (AC && AC.state === 'suspended') AC.resume();
  if (master) master.gain.value = SAVE.vol;
  G.autoplay = false;
  player.bot = false;
  HUD.over.isVisible = false;
  HUD.pause.isVisible = false;
  VM.key = '';
  useScene(game);
  G.phase = 'prep';
  newMatch();
  paused = false;
  lock();
}
/* escolha entre rodadas: volta à tela de operador (fluxo R6) e retoma a partida ao confirmar */
HOOK.pickRound = function (swap) {
  paused = true;
  INPUT.fire = INPUT.ads = INPUT.interact = false;
  if (document.pointerLockElement) document.exitPointerLock();
  HUD.pause.isVisible = false;
  HUD.board.isVisible = false;
  useScene(lobby);
  flowRound(swap);
};
function resumeRound(swap) {
  useScene(game);
  G.phase = 'prep';
  VM.key = '';
  startRound();
  if (swap)
    showBanner(
      'Troca de lado',
      'Você agora está na ' + (player.side === 'atk' ? 'ataque' : 'defesa'),
      'swap',
      3.2
    );
  paused = false;
  lock();
}
function toMenu(keep) {
  if (MP.role === 'guest') {
    if (keep !== true) onlineSendJSON({ t: 'leavematch' });
    mpClientLeave();
    if (ON.ws && ON.st !== 'retry') ON.st = 'idle';
    if (keep !== true) onlineToken('');
    menuTab = 'online';
  }
  G.phase = 'menu';
  paused = true;
  HUD.pause.isVisible = HUD.over.isVisible = HUD.board.isVisible = false;
  if (document.pointerLockElement) document.exitPointerLock();
  useScene(lobby);
  renderMenu();
}
function matchOver() {
  paused = true;
  const win = teams[player.team].score > teams[player.team === 'A' ? 'B' : 'A'].score;
  const st = SAVE.stats;
  st.games++;
  if (win) st.wins++;
  st.kills += player.kills;
  st.deaths += player.deaths;
  st.hs += player.hs;
  persist();
  const S = HUD.overS;
  S.clearControls();
  const sa = teams[player.team].score,
    sb = teams[player.team === 'A' ? 'B' : 'A'].score;
  {
    const bn = rect({
      w: '100%',
      h: 84,
      bg: win ? '#d6d9dc' : '#0a0b0d',
      border: 1,
      borderColor: win ? '#d6d9dc' : PAL.danger,
    });
    bn.addControl(
      disp((win ? 'VITÓRIA' : 'DERROTA') + ' · ' + sa + '–' + sb, {
        size: 46,
        color: win ? '#0a0b0d' : PAL.danger,
        spacing: '10px',
        align: 'center',
        width: '100%',
        h: 60,
      })
    );
    S.addControl(bn);
    S.addControl(gap(8));
    S.addControl(
      eyebrow('Fim da partida · ' + (win ? 'sua equipe venceu' : 'a equipe adversária venceu'))
    );
    S.addControl(gap(8));
  }
  boardRows(true);
  for (const c of HUD.boardS.children.slice()) {
    HUD.boardS.removeControl(c);
    S.addControl(c);
  }
  const r = stack(false, { h: 56, spacing: 10 });
  if (MP.role === 'guest') {
    r.addControl(
      bigButton('SAIR DA PARTIDA', null, () => toMenu(), {
        w: 260,
        h: 52,
        fs: 18,
        bg: '#121416',
        fg: PAL.text,
      })
    );
    S.addControl(r);
    S.addControl(gap(6));
    S.addControl(
      text('Você volta para o menu em instantes.', { size: 12, color: PAL.muted, h: 20 })
    );
  } else {
    r.addControl(bigButton('JOGAR DE NOVO', null, () => startMatch(), { w: 240, h: 52, fs: 20 }));
    r.addControl(
      bigButton('MENU', null, () => toMenu(), {
        w: 150,
        h: 52,
        fs: 20,
        bg: '#121416',
        fg: PAL.text,
      })
    );
    S.addControl(r);
  }
  HUD.over.isVisible = true;
  if (document.pointerLockElement) document.exitPointerLock();
}

/* ---------- entrada ---------- */
const keys = {};
let crouchToggle = false,
  leanToggle = 0; /* Q/E alternam a inclinação (como no Siege): aperta uma vez inclina, de novo volta */
function syncInput() {
  const k = keys;
  INPUT.fwd = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0);
  INPUT.side = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
  INPUT.sprint = !!(k.ShiftLeft || k.ShiftRight);
  INPUT.walk = !!(k.AltLeft || k.AltRight);
  if (INPUT.sprint && INPUT.fwd > 0) {
    crouchToggle = false;
    leanToggle = 0;
  }
  INPUT.crouch = crouchToggle;
  /* sem Ctrl: Ctrl+W fecharia a aba do navegador */ INPUT.lean = leanToggle;
}
function lock() {
  lockGuard();
  try {
    let r;
    try {
      r = canvas.requestPointerLock && canvas.requestPointerLock({ unadjustedMovement: true });
    } catch (e) {
      r = canvas.requestPointerLock && canvas.requestPointerLock();
    } /* mouse cru: sem aceleração do sistema */
    if (r && r.catch)
      r.catch(() => {
        try {
          const r2 = canvas.requestPointerLock();
          if (r2 && r2.catch) r2.catch(() => goFallback());
        } catch (e) {
          goFallback();
        }
      });
  } catch (e) {
    goFallback();
  }
}
function lockGuard() {
  setTimeout(() => {
    try {
      if (inGame() && document.pointerLockElement !== canvas && !fallbackMouse) {
        const r = canvas.requestPointerLock();
        if (r && r.catch) r.catch(() => goFallback());
      }
    } catch (e) {
      goFallback();
    }
  }, 1500);
} /* se o pedido de mouse cru ficar pendente (alguns navegadores), repete sem a opção */
function goFallback() {
  fallbackMouse = true;
  paused = false;
  HUD.pause.isVisible = false;
}
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === canvas) {
    paused = false;
    HUD.pause.isVisible = false;
    fallbackMouse = false;
  } else if (inGame() && !fallbackMouse) {
    paused = true;
    INPUT.fire = INPUT.ads = INPUT.interact = false;
    HUD.pause.isVisible = true;
  }
});
document.addEventListener('pointerlockerror', goFallback);
const inMenu = () => G.phase === 'menu' || G.phase === 'pick';
const inGame = () => G.phase !== 'menu' && G.phase !== 'over' && G.phase !== 'pick';
document.addEventListener('mousemove', (e) => {
  if (inMenu()) {
    if (dragging) {
      showYaw += (e.clientX - dragX) * 0.01;
      dragX = e.clientX;
    }
    return;
  }
  if (paused || !inGame() || (document.pointerLockElement !== canvas && !fallbackMouse)) return;
  const mx = e.movementX || 0,
    my = e.movementY || 0;
  if (piloting()) {
    const k = 0.0022 * SAVE.sens;
    drone.yaw -= mx * k;
    drone.pitch = clamp(drone.pitch - my * k, -1.2, 1.2);
    return;
  }
  if (!player.alive) return;
  const wd = WEAPONS[curW(player).id];
  const k = 0.0022 * SAVE.sens * (1 + (wd.zoom - 1) * player.ads);
  player.yaw -= mx * k;
  player.pitch = clamp(player.pitch - my * k, -1.45, 1.45);
  VM.swayX = clamp(VM.swayX - mx * 0.00035, -0.06, 0.06);
  VM.swayY = clamp(VM.swayY - my * 0.00035, -0.05, 0.05);
});
canvas.addEventListener('mousedown', (e) => {
  if (inMenu()) {
    if (
      e.clientX > (innerWidth < 860 ? innerWidth : 510) &&
      e.clientY > 70 &&
      !(e.clientX > innerWidth - 330 && e.clientY > innerHeight - 110)
    ) {
      dragging = true;
      dragX = e.clientX;
    }
    return;
  }
  if (!inGame() || HUD.pause.isVisible) return;
  if (document.pointerLockElement !== canvas && !fallbackMouse) {
    lock();
    return;
  }
  if (piloting()) {
    if (e.button === 0) INPUT.ping = true;
    return;
  }
  if (!player.alive) {
    if (e.button === 0) specIdx++;
    return;
  }
  if (e.button === 0) INPUT.fire = true;
  if (e.button === 2) INPUT.ads = true;
});
addEventListener('mouseup', (e) => {
  dragging = false;
  if (e.button === 0) INPUT.fire = false;
  if (e.button === 2) INPUT.ads = false;
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('keydown', (e) => {
  if (!inGame()) return;
  if (['Tab', 'Space', 'AltLeft', 'AltRight'].includes(e.code) || e.ctrlKey) e.preventDefault();
  if (e.code === 'Tab') {
    boardRows(false);
    HUD.board.isVisible = true;
    return;
  }
  if (e.repeat) return;
  if (e.code === 'KeyC') crouchToggle = !crouchToggle;
  if (e.code === 'KeyQ') leanToggle = leanToggle === -1 ? 0 : -1;
  if (e.code === 'KeyE') leanToggle = leanToggle === 1 ? 0 : 1;
  keys[e.code] = true;
  syncInput();
  if (paused) return;
  if (e.code === 'KeyF') INPUT.interact = true;
  if (e.code === 'Space') {
    INPUT.vault = true;
    INPUT.jump = true;
  }
  if (e.code === 'KeyR') INPUT.reload = true;
  if (e.code === 'KeyG') INPUT.gadget = true;
  if (e.code === 'KeyV') INPUT.melee = true;
  if (e.code === 'Digit1') INPUT.slot = 'p';
  if (e.code === 'Digit2') INPUT.slot = 's';
});
addEventListener('keyup', (e) => {
  keys[e.code] = false;
  syncInput();
  if (e.code === 'Tab') HUD.board.isVisible = false;
  if (e.code === 'KeyF') INPUT.interact = false;
});
let wheelT = 0;
addEventListener(
  'wheel',
  (e) => {
    if (!inGame() || paused || !player.alive || camMode !== 'fp' || Math.abs(e.deltaY) < 1) return;
    const now = performance.now();
    if (now - wheelT < 300) return;
    wheelT = now;
    INPUT.slot = e.deltaY < 0 ? 'p' : 's';
  },
  { passive: true }
); /* roda: cima = principal, baixo = pistola (com intervalo, contra trackpad) */
addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  syncInput();
  INPUT.fire = INPUT.ads = INPUT.interact = false;
});

/* ---------- laço principal (simulação em passo fixo de 60 Hz) ---------- */
let acc = 0,
  stepT = 0;
engine.runRenderLoop(() => {
  const dt = Math.min(0.1, engine.getDeltaTime() / 1000);
  if (inMenu()) {
    updateShowroom(dt);
    lobby.render();
    return;
  }
  if (!paused && typeof PC_TEST === 'undefined') autoRes(engine.getDeltaTime() / 1000);
  if (HUD.pauseT) {
    const t = MP.role === 'guest' ? 'Menu · a partida continua' : 'Partida pausada';
    if (HUD.pauseT.text !== t) HUD.pauseT.text = t;
  }
  if (MP.role === 'guest') {
    acc += dt;
    let n = 0;
    while (acc >= SIM_DT && n < 6) {
      (player._pp || (player._pp = new V3())).copy(player.pos);
      mpClientStep(SIM_DT, onlineSend, !paused && ON.st === 'match');
      acc -= SIM_DT;
      n++;
    }
    if (n === 6) acc = 0;
    player._al = acc / SIM_DT;
  } else if (!paused) {
    acc += dt;
    let n = 0;
    while (acc >= SIM_DT && n < 6) {
      (player._pp || (player._pp = new V3())).copy(player.pos);
      netStep(SIM_DT);
      acc -= SIM_DT;
      n++;
    }
    if (n === 6) acc = 0;
    player._al = acc / SIM_DT;
  } /* v4: passo com comando serializável (06-net) */
  game.physicsEnabled = !paused;
  /* passos do jogador */
  audioTick();
  const sp = Math.hypot(player.vel.x, player.vel.z);
  if (
    player.alive &&
    player.onGround &&
    sp > 2.8 &&
    !INPUT.walk &&
    player.crouchK < 0.5 &&
    camMode === 'fp'
  ) {
    stepT -= (dt * sp) / 4.6;
    if (stepT <= 0) {
      stepT = player.sprint ? 0.36 : 0.42;
      playSound('step', player.pos, { me: true, loud: player.sprint });
    }
  }
  for (const a of agents) {
    if (!a.alive || a === player) continue;
    const s2 = Math.hypot(a.vel.x, a.vel.z);
    if (s2 < 0.8) continue;
    a._st = (a._st || 0) - (dt * s2) / 4.6;
    if (a._st <= 0) {
      a._st = a.sprint ? 0.36 : 0.42;
      if (a.pos.distanceTo(new V3(camera.position.x, camera.position.y, camera.position.z)) < 22)
        playSound('step', a.pos, {
          loud: a.sprint,
          soft: s2 < 2.6 || a.crouchK > 0.5,
        }); /* passo lento/agachado: baixo mas audível */
    }
  }
  updateChars(dt);
  updateDynamic(dt);
  updateFx(dt);
  updateCamera(dt);
  updateVM(dt);
  updateHUD(dt);
  game.render();
});
addEventListener('resize', () => {
  engine.resize();
  uiScaleSync();
  layoutLobby();
  layoutHUD();
});
applyQuality();
layoutLobby();
layoutHUD();
useScene(lobby);
renderMenu();
initAssets(); /* modelos .glb embutidos: carregam em segundo plano (o menu já aparece) */
window.__pcAssets = () => ASSETS; /* tela de carregamento do boot espera os modelos */
