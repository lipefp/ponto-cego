/* =====================================================================
   KIT COMPARTILHADO — cache de materiais, materiais comuns e primitivas
   (usado por armas, operadores e equipamentos). Arquivo congelado: mudanças
   aqui afetam todo mundo.
   ===================================================================== */
/* ---------- materiais por cena (lobby e jogo têm cenas separadas) ---------- */
function matCache(scene) {
  return scene._pcMats || (scene._pcMats = {});
}
function sharedMats(scene) {
  const C = matCache(scene);
  if (C.metal) return C;
  C.metal = pbr(scene, { color: '#24272a', rough: 0.35, metal: 0.85 });
  C.poly = pbr(scene, { color: '#1d1f21', rough: 0.7 });
  C.glove = pbr(scene, { color: '#232527', rough: 0.92 });
  C.lens = pbr(scene, { color: '#10222a', rough: 0.05, metal: 0.6 });
  C.visor = pbr(scene, { color: '#0e1114', rough: 0.1, metal: 0.5 });
  C.clear = pbr(scene, { color: '#aad0e0', rough: 0.05, alpha: 0.35 });
  C.glass = pbr(scene, { color: '#c8e4ff', rough: 0.02, alpha: 0.1, env: 1 });
  C.red = unlit(scene, '#ff3b30');
  C.green = unlit(scene, '#6dff8a');
  C.boot = pbr(scene, { color: '#1b1c1e', rough: 0.8 });
  C.belt = pbr(scene, { color: '#2a2622', rough: 0.8 });
  return C;
}
const colMat = (scene, hex, rough, metal) => {
  const C = matCache(scene),
    k = 'c|' + hex + '|' + (rough || 0.85) + '|' + (metal || 0);
  return C[k] || (C[k] = pbr(scene, { color: hex, rough: rough || 0.85, metal: metal || 0 }));
};

/* ---------- auxiliares de geometria ---------- */
function mkBox(scene, parent, w, h, d, x, y, z, mat, rx) {
  const b = B.MeshBuilder.CreateBox('b', { width: w, height: h, depth: d }, scene);
  b.position.set(x, y, z);
  if (rx) b.rotation.x = rx;
  b.material = mat;
  b.parent = parent;
  b.isPickable = false;
  return b;
}
function mkCyl(scene, parent, r, l, x, y, z, mat, r2) {
  const c = B.MeshBuilder.CreateCylinder(
    'c',
    { diameterTop: 2 * (r2 || r), diameterBottom: 2 * r, height: l, tessellation: 14 },
    scene
  );
  c.rotation.x = Math.PI / 2;
  c.position.set(x, y, z);
  c.material = mat;
  c.parent = parent;
  c.isPickable = false;
  return c;
}
const _qz = new B.Vector3(0, 0, 1),
  _qy = new B.Vector3(0, 1, 0);
function limb(scene, parent, a, b, th, mat, thB) {
  const d = new B.Vector3(b.x - a.x, b.y - a.y, b.z - a.z),
    len = d.length();
  const m = B.MeshBuilder.CreateBox('l', { width: th, height: thB || th, depth: len }, scene);
  m.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  m.rotationQuaternion = new B.Quaternion();
  B.Quaternion.FromUnitVectorsToRef(_qz, d.normalize(), m.rotationQuaternion);
  m.material = mat;
  m.parent = parent;
  m.isPickable = false;
  return m;
}

/* "Kit" de peças: cria várias primitivas (caixas, cilindros, cápsulas, esferas)
   e no fim funde tudo num único mesh por segmento do corpo/arma (bake).
   Resultado: modelos bem mais detalhados com poucas chamadas de desenho. */
function vcMats(scene) {
  const C = matCache(scene);
  if (!C.vc) {
    C.vc = pbr(scene, { color: '#ffffff', rough: 0.8, metal: 0.05 });
    C.vcm = pbr(scene, { color: '#ffffff', rough: 0.38, metal: 0.75 });
  }
  return C;
}
function Kit(scene, hi) {
  /* hi: malha mais redonda (arma/mãos em 1ª pessoa) */
  const T = hi ? 2 : 1.4;
  const list = [];
  const add = (m, mat) => {
    m.material = mat;
    m.isPickable = false;
    list.push(m);
    return m;
  };
  const K = {
    list,
    box: (w, h, d, x, y, z, mat, rx, ry, rz) => {
      const b = B.MeshBuilder.CreateBox('p', { width: w, height: h, depth: d }, scene);
      b.position.set(x, y, z);
      b.rotation.set(rx || 0, ry || 0, rz || 0);
      return add(b, mat);
    },
    /* cilindro ao longo de Z (axis:'y' ou 'x' muda o eixo) */
    cyl: (r, l, x, y, z, mat, o) => {
      o = o || {};
      const c = B.MeshBuilder.CreateCylinder(
        'p',
        {
          diameterTop: 2 * (o.r2 != null ? o.r2 : r),
          diameterBottom: 2 * r,
          height: l,
          tessellation: Math.round((o.t || 14) * T),
          arc: o.arc || 1,
          enclose: !!o.arc,
        },
        scene
      );
      if (o.axis === 'y') {
      } else if (o.axis === 'x') c.rotation.z = Math.PI / 2;
      else c.rotation.x = Math.PI / 2;
      if (o.ry) c.rotation.y += o.ry;
      if (o.sx) c.scaling.x = o.sx;
      if (o.sz) c.scaling.z = o.sz;
      c.position.set(x, y, z);
      return add(c, mat);
    },
    tor: (d, th, x, y, z, mat) => {
      const t = B.MeshBuilder.CreateTorus(
        'p',
        { diameter: d, thickness: th, tessellation: Math.round(24 * T) },
        scene
      );
      t.rotation.x = Math.PI / 2;
      t.position.set(x, y, z);
      return add(t, mat);
    },
    sph: (dx, dy, dz, x, y, z, mat, o) => {
      o = o || {};
      const s = B.MeshBuilder.CreateSphere(
        'p',
        {
          diameterX: dx,
          diameterY: dy,
          diameterZ: dz,
          segments: Math.round((o.seg || 10) * T),
          slice: o.slice || 1,
        },
        scene
      );
      s.position.set(x, y, z);
      if (o.rx) s.rotation.x = o.rx;
      return add(s, mat);
    },
    /* cápsula entre dois pontos */
    cap: (a, b, r, mat, r2) => {
      const d = new B.Vector3(b.x - a.x, b.y - a.y, b.z - a.z),
        len = d.length();
      const c = B.MeshBuilder.CreateCapsule(
        'p',
        {
          height: len + 2 * r,
          radius: r,
          radiusTop: r2 || r,
          tessellation: Math.round(12 * T),
          subdivisions: 1,
          capSubdivisions: Math.round(4 * T),
        },
        scene
      );
      c.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      c.rotationQuaternion = new B.Quaternion();
      B.Quaternion.FromUnitVectorsToRef(_qy, d.normalize(), c.rotationQuaternion);
      return add(c, mat);
    },
  };
  /* peças de cor lisa viram cor por vértice num material compartilhado (fosco ou metálico):
     o segmento inteiro fica com 2–3 materiais em vez de 6–8 → bem menos chamadas de desenho */
  K.bake = (parent, name) => {
    if (!list.length) return null;
    const V = vcMats(scene);
    for (const p of list) {
      const mat = p.material,
        n = p.getTotalVertices(),
        col = new Float32Array(n * 4);
      let r = 1,
        g = 1,
        bl = 1;
      const keep =
        !mat ||
        mat.getClassName() !== 'PBRMaterial' ||
        mat.albedoTexture ||
        mat.emissiveTexture ||
        mat.alpha < 1 ||
        (mat.emissiveColor && mat.emissiveColor.r + mat.emissiveColor.g + mat.emissiveColor.b > 0);
      if (!keep) {
        const c = mat.albedoColor.toLinearSpace();
        r = c.r;
        g = c.g;
        bl = c.b;
        p.material = hi && mat.metallic > 0.4 ? V.vcm : V.vc;
      }
      for (let i = 0; i < n; i++) {
        col[i * 4] = r;
        col[i * 4 + 1] = g;
        col[i * 4 + 2] = bl;
        col[i * 4 + 3] = 1;
      }
      p.setVerticesData(B.VertexBuffer.ColorKind, col, false);
    }
    const m =
      list.length === 1 ? list[0] : B.Mesh.MergeMeshes(list, true, true, undefined, false, true);
    m.name = name || 'seg';
    m.parent = parent;
    m.isPickable = false;
    list.length = 0;
    return m;
  };
  return K;
}
