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
        pt = a.pitch + a.punch + rand(-sh, sh);
      B.Quaternion.RotationYawPitchRollToRef(yw, pt, 0, _lq1);
      if (Math.abs(a.lean) > 1e-3) {
        _lax.set(Math.sin(yw), 0, Math.cos(yw));
        B.Quaternion.RotationAxisToRef(_lax, -a.lean * 0.26, _lq2);
        _lq2.multiplyToRef(_lq1, _lq1);
      }
      camera.rotationQuaternion = _lq1;
      camera.rotation.y = yw;
    }
    const wd = WEAPONS[curW(a).id];
    setFov(SAVE.fov * (1 + (wd.zoom - 1) * smooth(a.ads)));
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
    if (rel === 'ally') {
      const mk = B.MeshBuilder.CreateCylinder(
        'mk',
        { diameterTop: 0, diameterBottom: 0.24, height: 0.24, tessellation: 4 },
        game
      );
      mk.rotation.x = Math.PI;
      mk.position.y = 2.2;
      mk.material = markMat;
      mk.parent = ch.root;
      mk.renderingGroupId = 1;
      ch.mark = mk;
    }
    const sp = B.MeshBuilder.CreatePolyhedron('sp', { type: 1, size: 0.12 }, game);
    sp.position.y = 2.25;
    sp.material = spotMat;
    sp.parent = ch.root;
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
function updateChars(dt) {
  for (const a of agents) {
    const ch = ensureChar(a);
    if (!ch) continue;
    const w = curW(a);
    setCharWeapon(ch, w.id, a.skins[wBase(w.id)] || 'padrao');
    animChar(ch, a, dt);
    if (ch.mark) ch.mark.setEnabled(a.alive);
    ch.spot.setEnabled(a.alive && a.team !== player.team && a.spotT > G.clock);
    if (ch.spot.isEnabled()) ch.spot.rotation.y += dt * 3;
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
