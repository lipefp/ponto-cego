/* =====================================================================
   MODELOS .GLB EMBUTIDOS (CC0) — carregados de forma assíncrona
   Os arquivos de assets/*.glb são embutidos pelo build.py em ASSET_GLB
   (base64). Se algo falhar, o jogo continua com os modelos procedurais.
   Pacotes usados (todos CC0 / domínio público):
     office.glb  — Kenney "Furniture Kit" (mesas, cadeiras, monitores, caixas…)
     street.glb  — KayKit "City Builder Bits" (carros, postes, caçamba…)
     gadgets.glb — Kenney "Weapon Pack" (granadas)
   ===================================================================== */
const ASSETS = { ready: false, tpl: {}, failed: false };
/* cores sóbrias (o kit original é colorido demais para um FPS tático) */
const ASSET_RECOLOR = {
  wood: ['#8a6c4c', 0.55],
  woodDark: ['#5b4632', 0.6],
  metal: ['#9aa0a6', 0.4, 0.6],
  metalMedium: ['#6c7278', 0.4, 0.6],
  metalDark: ['#33373c', 0.45, 0.6],
  _defaultMat: ['#1d2024', 0.3],
  carpet: ['#30343b', 0.95],
  carpetDarker: ['#24272c', 0.95],
  carpetWhite: ['#bdb9b0', 0.9],
  plant: ['#4c6638', 0.8],
};
let _assetMat = null;
function assetMat() {
  if (!_assetMat) {
    _assetMat = pbr(game, { color: '#ffffff', rough: 0.75 });
    _assetMat.name = 'glbMat';
  }
  return _assetMat;
}
/* ajustes por modelo: tela do monitor/notebook escura, papelão com cor de papelão */
const ASSET_RECOLOR_BY = {
  computerScreen: { metal: '#14171b' },
  laptop: { metal: '#14171b' },
  cardboardBoxClosed: { wood: '#a8875c', woodDark: '#7f6443' },
  cardboardBoxOpen: { wood: '#a8875c', woodDark: '#7f6443' },
  books: { carpetWhite: '#d9d2c0', plant: '#3d5a7a' },
};
function b64bytes(s) {
  const bin = atob(s),
    u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}
/* carrega um pacote e transforma cada nó de topo em um molde (malha única, desativada, usada por instâncias) */
async function loadPack(name) {
  const r = await B.SceneLoader.ImportMeshAsync(
    '',
    '',
    b64bytes(ASSET_GLB[name]),
    game,
    null,
    '.glb'
  );
  const root = r.meshes.find((m) => m.name === '__root__') || r.meshes[0];
  for (const n of root.getChildren()) {
    let parts = n
      .getChildMeshes(false)
      .filter((m) => m.getTotalVertices && m.getTotalVertices() > 0);
    if (!parts.length) continue;
    /* peças instanciadas no .glb viram malhas reais (MergeMeshes não junta instâncias) */
    parts = parts.map((m) => {
      if (!(m instanceof B.InstancedMesh)) return m;
      m.computeWorldMatrix(true);
      const c = m.sourceMesh.clone('inst', null, true, false);
      c.makeGeometryUnique();
      c.parent = null;
      c.position.setAll(0);
      c.rotationQuaternion = null;
      c.rotation.setAll(0);
      c.scaling.setAll(1);
      c.bakeTransformIntoVertices(m.getWorldMatrix());
      c.setEnabled(true);
      return c;
    });
    /* cor de cada material vira cor de vértice: o molde inteiro usa 1 material só (menos chamadas de desenho) */
    const mats = [],
      key0 = n.name.replace('(Clone)', ''),
      by = ASSET_RECOLOR_BY[key0] || {};
    for (const m of parts) {
      const mt = m.material,
        rc = mt && (by[mt.name] ? [by[mt.name]] : ASSET_RECOLOR[mt.name]);
      mats.push(mt && mt.name + ':' + (mt.albedoColor ? mt.albedoColor.toHexString() : '-'));
      const col = rc ? C3(rc[0]) : (mt && mt.albedoColor) || new B.Color3(0.7, 0.7, 0.7);
      if (m.geometry && m.geometry.meshes && m.geometry.meshes.length > 1) m.makeGeometryUnique();
      const n = m.getTotalVertices(),
        old = m.getVerticesData(B.VertexBuffer.ColorKind),
        cs = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        const o = old ? old.length / n : 0;
        cs[i * 4] = col.r * (o ? old[i * o] : 1);
        cs[i * 4 + 1] = col.g * (o ? old[i * o + 1] : 1);
        cs[i * 4 + 2] = col.b * (o ? old[i * o + 2] : 1);
        cs[i * 4 + 3] = 1;
      }
      m.setVerticesData(B.VertexBuffer.ColorKind, cs, false, 4);
    }
    const mm =
      parts.length === 1
        ? parts[0]
        : B.Mesh.MergeMeshes(parts, false, true, undefined, false, false);
    if (mm) {
      mm.material = assetMat();
      mm.useVertexColors = true;
      mm.hasVertexAlpha = false;
    }
    if (!mm) continue;
    mm.setParent(null);
    const key = n.name.replace('(Clone)', '');
    mm.name = 'glb_' + key;
    mm.isPickable = false;
    mm.setEnabled(false);
    /* origem no centro da base (o kit da Kenney usa o canto como origem) */
    mm.computeWorldMatrix(true);
    mm.bakeCurrentTransformIntoVertices();
    mm.refreshBoundingInfo();
    {
      const b0 = mm.getBoundingInfo().boundingBox,
        cx = (b0.minimum.x + b0.maximum.x) / 2,
        cz = (b0.minimum.z + b0.maximum.z) / 2;
      mm.bakeTransformIntoVertices(B.Matrix.Translation(-cx, -b0.minimum.y, -cz));
      mm.refreshBoundingInfo();
    }
    const bb = mm.getBoundingInfo().boundingBox;
    ASSETS.tpl[key] = {
      mats,
      mesh: mm,
      min: bb.minimum.clone(),
      max: bb.maximum.clone(),
      used: false,
    };
  }
  root.dispose();
}
/* põe uma cópia (thin instance) do molde: escala s, giro ry, posição (x,y,z) */
function assetPut(key, x, y, z, ry, s) {
  const T = ASSETS.tpl[key];
  if (!T) return false;
  B.Matrix.ComposeToRef(
    _s.set(s, s, s),
    B.Quaternion.RotationYawPitchRollToRef(ry || 0, 0, 0, _q),
    _v.set(x, y, z),
    _m
  );
  T.mesh.thinInstanceAdd(_m.clone(), false);
  T.used = true;
  return true;
}
function assetFlush() {
  for (const k in ASSETS.tpl) {
    const T = ASSETS.tpl[k];
    if (!T.used) continue;
    const m = T.mesh;
    m.setEnabled(true);
    m.thinInstanceBufferUpdated('matrix');
    m.thinInstanceRefreshBoundingInfo(true);
    m.receiveShadows = true;
    m.freezeWorldMatrix();
    if (!T.cast) {
      T.cast = true;
      shadowCasters.push(m);
      if (shadowGen) shadowGen.addShadowCaster(m, false);
    }
  }
}
/* gira um ponto local (lx,lz) de uma célula pelo ângulo ry */
const rotXZ = (lx, lz, ry) => {
  const c = Math.cos(ry),
    s = Math.sin(ry);
  return [lx * c + lz * s, -lx * s + lz * c];
};
const K_FURN = 1.85,
  K_CITY = 5; /* escala: kit de móveis da Kenney e kit da KayKit para metros do jogo */
/* decora o mapa com os modelos (só visual: a colisão continua a da grade) */
function dressMap() {
  let desks = 0;
  for (const c of CRATES) {
    const cx = cc(c.x),
      cz = cc(c.z),
      ry = c.ry;
    if (c.k === 'cubicle' && ASSETS.tpl.desk && ASSETS.tpl.chairDesk) {
      /* 4 estações por baia: mesa encostada na divisória central, monitor, teclado e cadeira */
      for (const qx of [-1, 1])
        for (const qz of [-1, 1]) {
          const face = qz > 0 ? 0 : Math.PI; /* frente da mesa virada para fora da divisória */
          const put = (key, lx, ly, lz, rot, s) => {
            const [ox, oz] = rotXZ(lx, lz, ry);
            assetPut(key, cx + ox, ly, cz + oz, ry + rot, s);
          };
          put('desk', qx * 0.69, 0, qz * 0.4, face, K_FURN);
          put('computerScreen', qx * 0.69 + qx * 0.12, 0.7, qz * 0.24, face, K_FURN * 0.8);
          put('computerKeyboard', qx * 0.69, 0.7, qz * 0.5, face, K_FURN * 0.8);
          put(
            'chairDesk',
            qx * 0.69,
            0,
            qz * 1.02,
            face + Math.PI + ((hashStr(c.x + '|' + c.z + '|' + qx + qz) % 5) - 2) * 0.18,
            K_FURN * 0.95
          );
          desks++;
        }
    } else if (c.k === 'archive') {
      const [ox, oz] = rotXZ(0.3, -0.4, ry);
      assetPut('books', cx + ox, CRATE_H, cz + oz, ry + 0.4, K_FURN * 1.3);
      if (hashStr(c.x + ':' + c.z) % 2) {
        const [px, pz] = rotXZ(-0.6, 0.5, ry);
        assetPut('cardboardBoxOpen', cx + px, CRATE_H, cz + pz, ry + 0.2, K_FURN * 0.9);
      }
    } else if (c.k === 'counter') {
      const [ox, oz] = rotXZ(-0.4, 0, ry);
      assetPut('laptop', cx + ox, CRATE_H, cz + oz, ry + Math.PI * 0.1, K_FURN);
      const [px, pz] = rotXZ(0.9, 0.1, ry);
      assetPut('pottedPlant', cx + px, CRATE_H, cz + pz, ry, K_FURN * 0.6);
    }
  }
  /* caixas de papelão em cima de parte das caixas de madeira do depósito */
  for (const c of CRATES) {
    if (c.k !== 'crates' || roomOf(c.x, c.z) !== 'storage' || hashStr(c.x + '#' + c.z) % 3 === 0)
      continue;
    const cx = cc(c.x),
      cz = cc(c.z);
    const [ox, oz] = rotXZ(0.5, -0.4, c.ry);
    assetPut('cardboardBoxClosed', cx + ox, CRATE_H, cz + oz, c.ry + 0.15, K_FURN * 0.9);
    if (hashStr(c.z + '#' + c.x) % 2) {
      const [px, pz] = rotXZ(-0.55, 0.45, c.ry);
      assetPut('cardboardBoxOpen', cx + px, CRATE_H, cz + pz, c.ry - 0.3, K_FURN * 0.9);
    }
  }
  /* lixeiras nos cantos dos escritórios (encostadas na parede, fora do caminho) */
  for (const [x, z, r] of [
    [8, 6, 0],
    [15, 12, Math.PI],
    [20, 13, 0],
    [27, 21, Math.PI],
    [17, 6, 0],
  ])
    if (cellAt(x, z) === 0)
      assetPut(
        'trashcan',
        cc(x) + (x < 17 ? -1.1 : 1.1),
        0,
        cc(z) + (z < 14 ? -1.1 : 1.1),
        r,
        K_FURN
      );
  /* rua do lado de fora do muro (pacote opcional street.glb: hoje fora do build — o muro de 3,2 m esconde a rua, não compensa 200 KB) */
  if (ASSETS.tpl.car_sedan) {
    const cars = [
      'car_sedan',
      'car_police',
      'car_hatchback',
      'car_taxi',
      'car_police',
      'car_sedan',
    ];
    for (let i = 0; i < 9; i++) {
      const x = 10 + i * 11 + (i % 2) * 2;
      assetPut(
        cars[i % cars.length],
        x,
        0,
        -4.2,
        Math.PI / 2 + (i % 3 === 0 ? Math.PI : 0),
        K_CITY
      );
      if (i % 2 === 0) assetPut('streetlight', x + 5, 0, -1.1, 0, K_CITY);
    }
    for (let i = 0; i < 6; i++) {
      const z = 12 + i * 12;
      assetPut(cars[(i + 2) % cars.length], W * CELL + 4.4, 0, z, i % 2 ? 0 : Math.PI, K_CITY);
      if (i % 2) assetPut('streetlight', W * CELL + 1.2, 0, z + 6, Math.PI / 2, K_CITY);
    }
    /* asfalto da rua */
    const road = B.MeshBuilder.CreateGround('road', { width: W * CELL + 40, height: 9 }, game);
    road.position.set((W * CELL) / 2, 0.005, -5);
    road.material = M.asphalt;
    road.receiveShadows = true;
    const road2 = B.MeshBuilder.CreateGround('road2', { width: 9, height: H * CELL + 20 }, game);
    road2.position.set(W * CELL + 5, 0.005, (H * CELL) / 2);
    road2.material = M.asphalt;
    road2.receiveShadows = true;
    assetPut('dumpster', -3.2, 0, 30, Math.PI / 2, K_CITY);
    assetPut('firehydrant', 30, 0, -1.4, 0, K_CITY);
    assetPut('bench', 60, 0, -1.6, Math.PI, K_CITY);
  }
  if (desks && WTPL.cubicleDesk)
    WTPL.cubicleDesk.setEnabled(false); /* troca as mesas procedurais pelas do kit */
  assetFlush();
}
/* granada: usa o modelo do kit (escala para ~11 cm) */
function assetGadget(kind, parent) {
  const key =
    kind === 'frag' ? 'grenade' : kind === 'impact' || kind === 'flash' ? 'grenadeFlash' : null;
  const T = key && ASSETS.tpl[key];
  if (!T || parent.getScene() !== game) return false;
  const inst = T.mesh.clone('g_' + key, parent, true, false);
  inst.setEnabled(true);
  const h = T.max.y - T.min.y;
  const s = 0.11 / h;
  inst.scaling.setAll(s);
  inst.position.set(0, -(T.min.y + h / 2) * s, 0);
  inst.isPickable = false;
  return true;
}
async function initAssets() {
  if (typeof ASSET_GLB === 'undefined' || !B.SceneLoader) {
    ASSETS.failed = true;
    return;
  }
  try {
    for (const k of Object.keys(ASSET_GLB)) await loadPack(k);
    dressMap();
    try {
      await surfPhotos();
    } catch (e) {
      console.warn('fotos', e);
    }
    ASSETS.ready = true;
  } catch (e) {
    ASSETS.failed = true;
    console.warn('modelos .glb não carregaram; usando procedurais', e);
  }
}
