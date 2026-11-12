/* =====================================================================
   VISÃO — câmera, arma em primeira pessoa (com braços), bonecos,
   objetos dinâmicos. Lê o estado da simulação a cada quadro.
   ===================================================================== */
/* a arma em 1ª pessoa fica no grupo de renderização 1, desenhado depois do
   mundo com o depth limpo: nunca atravessa parede */
game.setRenderingAutoClearDepthStencil(1, true, true, true);
const vmRoot = new B.TransformNode('vm', game);
vmRoot.parent = camera;
const vmInner = new B.TransformNode('vmi', game);
vmInner.parent = vmRoot;
const VM = {
  sprintK: 0,
  leanK: 0,
  key: '',
  info: null,
  arms: null,
  drawT: 0,
  kick: 0,
  pumpT: 0,
  throwT: 0,
  meleeT: 0,
  landDip: 0,
  bobT: 0,
  swayX: 0,
  swayY: 0,
  shake: 0,
  latK: 0 /* andar de lado: a arma inclina para o lado do movimento */,
  fwdK: 0,
  spPrev: 0,
  stopDip: 0 /* parada brusca: a arma afunda e volta */,
  rsx: 0 /* mola do recuo (posição e velocidade): sobe no tiro e volta passando um pouco do ponto */,
  rsv: 0,
};
const VM_S = 0.36;
function vmMeshes(node) {
  for (const m of node.getChildMeshes()) {
    m.renderingGroupId = 1;
    m.receiveShadows = false;
  }
}
/* ---------- câmera ---------- */
let camMode = 'fp',
  specIdx = 0;
function specTarget() {
  const al = agents.filter((a) => a.team === player.team && a.alive && a !== player);
  return al.length ? al[specIdx % al.length] : null;
}
let _lq1 = new B.Quaternion(),
  _lq2 = new B.Quaternion();
const _lax = new B.Vector3();
function updateCamera(dt) {
  const a = player;
  VM.shake = Math.max(0, VM.shake - dt * 3);
  const sh = VM.shake * VM.shake * 0.04;
  if (droneCam()) {
    camMode = 'drone';
    camera.position.set(drone.pos.x, drone.pos.y + 0.22, drone.pos.z);
    B.Quaternion.RotationYawPitchRollToRef(drone.yaw, drone.pitch, 0, _lq1);
    camera.rotationQuaternion = _lq1;
    camera.rotation.set(drone.pitch, drone.yaw, 0);
    setFov(95);
    return;
  }
  if (a.alive && !a.bot) {
    camMode = 'fp';
    const e = eyeOf(a);
    /* câmera viva: balanço do passo, mergulho no pouso, rolagem no strafe e FOV na corrida.
       Só visual — a simulação e a rede não leem nada daqui. */
    const adsK = easeAds(a.ads),
      bk =
        (SAVE.bob ? clamp(Math.hypot(a.vel.x, a.vel.z) / 5, 0, 1) : 0) *
        (1 - adsK * 0.85) *
        (a.onGround ? 1 : 0.3) *
        (1 + VM.sprintK * 0.6),
      bx = Math.sin(VM.bobT) * 0.006 * bk;
    e.y += Math.sin(VM.bobT * 2) * 0.01 * bk - VM.landDip * 0.035;
    e.x += Math.cos(a.yaw) * bx;
    e.z += -Math.sin(a.yaw) * bx;
    /* passo fixo de 60 Hz × taxa de quadros da tela: interpola a posição entre o passo anterior e o atual (sem tremida nem atraso extra) */
    if (a._pp && a._al != null && !paused) {
      const dx = a.pos.x - a._pp.x,
        dy = a.pos.y - a._pp.y,
        dz = a.pos.z - a._pp.z;
      if (dx * dx + dy * dy + dz * dz < 1.2) {
        const k = a._al - 1;
        e.x += dx * k;
        e.y += dy * k;
        e.z += dz * k;
      }
    }
    camera.position.set(e.x, e.y, e.z);
    /* inclinação estilo Siege: o giro é em torno do eixo horizontal do CORPO (não do eixo da mira),
       aplicado depois de yaw+pitch: olhar para baixo/cima nunca vira a imagem de cabeça para baixo */
    {
      const yw = a.yaw + rand(-sh, sh),
        pt =
          a.pitch +
          a.punch +
          rand(-sh, sh) +
          VM.landDip * 0.06 +
          Math.sin(VM.bobT * 2 + 0.5) * 0.004 * bk,
        rl = Math.sin(VM.bobT) * 0.0045 * bk - VM.latK * 0.012;
      B.Quaternion.RotationYawPitchRollToRef(yw, pt, rl, _lq1);
      if (Math.abs(a.lean) > 1e-3) {
        _lax.set(Math.sin(yw), 0, Math.cos(yw));
        B.Quaternion.RotationAxisToRef(_lax, -a.lean * 0.26, _lq2);
        _lq2.multiplyToRef(_lq1, _lq1);
      }
      camera.rotationQuaternion = _lq1;
      camera.rotation.y = yw;
    }
    const wd = WEAPONS[curW(a).id];
    setFov(SAVE.fov * (1 + (wd.zoom - 1) * adsK) * (1 + 0.06 * VM.sprintK));
  } else {
    camMode = 'spec';
    camera.rotationQuaternion = null;
    setFov(SAVE.fov);
    const t = specTarget(); /* só aliados (assistir inimigo entregaria a posição dele) */
    if (!t) {
      const p = player.pos;
      camera.position.set(p.x + 2.5, p.y + 3.2, p.z + 2.5);
      const d = { x: -2.5, y: -2.8, z: -2.5 };
      camera.rotation.set(Math.atan2(d.y, Math.hypot(d.x, d.z)), Math.atan2(-d.x, -d.z), 0);
    }
    if (t) {
      const f = dirFrom(t.yaw, 0);
      const o = new V3(t.pos.x, t.pos.y + 2, t.pos.z),
        want = new V3(t.pos.x - f.x * 3.2, t.pos.y + 2.3, t.pos.z - f.z * 3.2);
      const dd = want.clone().sub(o);
      const len = dd.length();
      dd.divideScalar(len);
      const tw = traceWorld(o, dd, len);
      const cp = o.clone().addScaledVector(dd, Math.max(0.3, Math.min(len, tw.t - 0.3)));
      camera.position.set(cp.x, cp.y, cp.z);
      const look = new V3(t.pos.x + f.x * 2, t.pos.y + 1.4, t.pos.z + f.z * 2);
      const d = look.clone().sub(cp);
      camera.rotation.set(Math.atan2(d.y, Math.hypot(d.x, d.z)), Math.atan2(-d.x, -d.z), 0);
    }
    B.Quaternion.RotationYawPitchRollToRef(camera.rotation.y, camera.rotation.x, 0, _lq1);
    camera.rotationQuaternion = _lq1;
  }
}
function setFov(deg) {
  const r = (deg * Math.PI) / 180;
  if (Math.abs(camera.fov - r) > 1e-4) camera.fov = r;
}

/* ---------- bonecos e objetos ---------- */
const CH = new Map();
const markMat = unlit(game, PAL.ally),
  spotMat = unlit(game, '#ff3b30');
function ensureChar(a) {
  if (a === player && !a.bot) return null;
  const rel = a.team === player.team ? 'ally' : 'enemy';
  let ch = CH.get(a);
  /* dois bots do mesmo time com o mesmo operador: o segundo ganha a 2ª versão (outro tom e outro chapéu) */
  let vari = 0;
  for (const b of agents) {
    if (b === a) break;
    if (b.team === a.team && b.op === a.op) vari++;
  }
  vari = Math.min(vari, 3) + (a.team === player.team ? 0 : 0);
  if (!ch || ch.op !== a.op || ch.rel !== rel || (ch.vari || 0) !== vari) {
    if (ch) ch.root.dispose();
    ch = buildCharacter(game, a.op, rel, vari);
    CH.set(a, ch);
    /* os marcadores (aliado, inimigo marcado) aparecem através das paredes: ficam num nó próprio, que continua
       ligado quando o boneco é escondido por estar atrás de parede */
    ch.anchor = new B.TransformNode('chAnchor', game);
    ch.root.onDisposeObservable.add(() => ch.anchor.dispose());
    if (rel === 'ally') {
      const mk = B.MeshBuilder.CreateCylinder(
        'mk',
        { diameterTop: 0, diameterBottom: 0.24, height: 0.24, tessellation: 4 },
        game
      );
      mk.rotation.x = Math.PI;
      mk.position.y = 2.2;
      mk.material = markMat;
      mk.parent = ch.anchor;
      mk.renderingGroupId = 1;
      ch.mark = mk;
    }
    const sp = B.MeshBuilder.CreatePolyhedron('sp', { type: 1, size: 0.12 }, game);
    sp.position.y = 2.25;
    sp.material = spotMat;
    sp.parent = ch.anchor;
    sp.renderingGroupId = 1;
    sp.setEnabled(false);
    ch.spot = sp;
    if (ch.proc)
      for (const m of ch.root.getChildMeshes()) {
        m.receiveShadows = true;
        if (shadowGen && m.renderingGroupId === 0 && CASTS.has(m.name))
          shadowGen.addShadowCaster(m, false);
      }
  } /* com esqueleto: a sombra é ligada quando o modelo encaixa (opmAttach) */
  return ch;
}
/* sombra de contato (mancha escura sob os pés): uma malha com instância fina por agente */
const blobS = (() => {
  const c = mkCanvas(128),
    g = c.getContext('2d'),
    gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, 'rgba(0,0,0,.55)');
  gr.addColorStop(0.6, 'rgba(0,0,0,.25)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const m = B.MeshBuilder.CreateGround('blob', { width: 1, height: 1 }, game);
  const mt = new B.StandardMaterial('blobm', game);
  mt.diffuseTexture = dyn(game, c);
  mt.diffuseTexture.hasAlpha = true;
  mt.useAlphaFromDiffuseTexture = true;
  mt.disableLighting = true;
  mt.emissiveColor = new B.Color3(0, 0, 0);
  mt.zOffset = -3;
  mt.backFaceCulling = false;
  m.material = mt;
  m.isPickable = false;
  m.alwaysSelectAsActiveMesh = true;
  const buf = new Float32Array(16 * 16);
  m.thinInstanceSetBuffer('matrix', buf, 16, false);
  return { m, buf };
})();
const _bm = new B.Matrix();
function updateBlobs() {
  let i = 0;
  for (const a of agents) {
    const ch = CH.get(a);
    if (i >= 16) break;
    if (ch && a.alive && ch.disp) {
      const k = 1 + (0.25 * Math.hypot(a.vel.x, a.vel.z)) / 5;
      B.Matrix.ComposeToRef(
        new B.Vector3(1.05 * k, 1, 1.05 * k),
        B.Quaternion.Identity(),
        new B.Vector3(ch.disp.x, ch.disp.y + 0.03, ch.disp.z),
        _bm
      );
    } else B.Matrix.ScalingToRef(0, 0, 0, _bm);
    _bm.copyToArray(blobS.buf, i * 16);
    i++;
  }
  blobS.m.thinInstanceBufferUpdated('matrix');
}
/* Boneco atrás de parede não é desenhado nem animado a cada quadro (cada um custa ~20 mil triângulos com
   esqueleto). A conferência usa a linha de visão da simulação, da câmera até 5 pontos do boneco (cabeça, peito,
   pés e os dois ombros), a cada 3 quadros. Fica visível por mais 0,6 s depois de sumir, e sempre a menos de 5 m. */
const _cs = new V3(),
  _ce = new V3();
let charFrame = 0;
function charSeen(a, ch) {
  const cam = game.activeCamera;
  if (!cam || a === player) return true;
  const now = performance.now();
  if ((charFrame + a.id) % 3 === 0 || ch.seenT === undefined) {
    const c = cam.globalPosition;
    _cs.set(c.x, c.y, c.z);
    const dx = a.pos.x - c.x,
      dz = a.pos.z - c.z,
      d = Math.hypot(dx, dz) || 1,
      px = (-dz / d) * 0.4,
      pz = (dx / d) * 0.4,
      top = a.alive ? 1.55 - 0.45 * a.crouchK : 0.3;
    let vis = d < 5;
    for (let i = 0; i < 5 && !vis; i++) {
      _ce.set(
        a.pos.x + (i === 3 ? px : i === 4 ? -px : 0),
        a.pos.y + (i === 0 ? top : i === 2 ? 0.15 : top * 0.65),
        a.pos.z + (i === 3 ? pz : i === 4 ? -pz : 0)
      );
      vis = clearSight(_cs, _ce);
    }
    if (vis) {
      ch.seenT = now;
      ch.seenF = charFrame;
    } else if (ch.seenT === undefined) {
      ch.seenT = -1e9;
      ch.seenF = -99;
    }
  }
  /* com poucos quadros por segundo o prazo conta em quadros (uma conferência a cada 3) */
  return now - ch.seenT < 600 || charFrame - ch.seenF <= 4;
}
function updateChars(dt) {
  charFrame++;
  for (const a of agents) {
    const ch = ensureChar(a);
    if (!ch) continue;
    const seen = SAVE.cullChars === false || charSeen(a, ch);
    if (ch.root && ch.root.isEnabled() !== seen) ch.root.setEnabled(seen);
    /* marcadores seguem o boneco mesmo escondido, a cada quadro */
    if (ch.mark) ch.mark.setEnabled(a.alive);
    ch.spot.setEnabled(a.alive && a.team !== player.team && a.spotT > G.clock);
    if (ch.spot.isEnabled()) ch.spot.rotation.y += dt * 3;
    if (!seen) {
      if (ch.anchor) ch.anchor.position.set(a.pos.x, a.pos.y, a.pos.z);
      /* escondido: anima só de vez em quando, para o estado (morto, agachado) estar certo quando reaparecer */
      ch.skipT = (ch.skipT || 0) + dt;
      if ((charFrame + a.id) % 8 !== 0) continue;
      dt = ch.skipT;
    }
    ch.skipT = 0;
    const w = curW(a);
    setCharWeapon(ch, w.id, a.skins[wBase(w.id)] || 'padrao');
    animChar(ch, a, Math.min(dt, 0.25));
    if (seen && ch.anchor) ch.anchor.position.copyFrom(ch.root.position);
  }
  updateBlobs();
}
const propMesh = new Map();
function propAdd(pr) {
  const m = buildGadget(game, pr.type);
  m.position.set(
    pr.pos.x,
    pr.type === 'shield' || pr.type === 'wire' || pr.type === 'jammer' ? 0 : pr.pos.y,
    pr.pos.z
  );
  if (pr.type === 'breach' || pr.type === 'thermal') {
    m.rotation.y = pr.ori === 'x' ? Math.PI / 2 : 0;
  } else m.rotation.y = pr.yaw || 0;
  for (const c of m.getChildMeshes()) {
    c.receiveShadows = true;
    if (shadowGen) shadowGen.addShadowCaster(c, false);
  }
  propMesh.set(pr, m);
}
function propRemove(pr) {
  const m = propMesh.get(pr);
  if (m) {
    m.dispose();
    propMesh.delete(pr);
  }
}
let deviceMesh = null;
function updateDynamic(dt) {
  for (const p of projectiles) {
    const m = propMesh.get(p);
    if (m) {
      m.position.set(p.pos.x, p.pos.y, p.pos.z);
      m.rotation.x = p.spin;
    }
  }
  if (deviceMesh && deviceMesh.light && G.planted)
    deviceMesh.light.setEnabled(Math.floor(G.clock * (G.planted.t < 10 ? 6 : 2)) % 2 === 0);
}
