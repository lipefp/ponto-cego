// @ts-check
/* =====================================================================
   FÍSICA VISUAL (Havok, WASM embutido) — só objetos cosméticos
   - Mundo estático gerado da grade do mapa (paredes duras, caixas, chão,
     forro, paredes finas por painel, barricadas) — atualizado quando a
     simulação muda uma estrutura.
   - Estilhaços (paredes/portas/explosões) e cartuchos ejetados: pools de
     corpos dinâmicos desenhados por UMA malha com thin instances cada
     (1 chamada de desenho por pool).
   - A simulação do jogador/IA (src/sim) continua sendo a autoridade de
     jogo (determinística, testada por test/qa.js): nada aqui muda regras.
   - Preparação para ragdoll: ragdoll(skeleton, raiz, config) usa
     BABYLON.Ragdoll (Physics V2) quando houver personagem com esqueleto.
   ===================================================================== */

/**
 * @typedef {{x:number,y:number,z:number}} XYZ
 * @typedef {{
 *   W:number,H:number,CELL:number,WALL_H:number,CRATE_H:number,DOOR_H:number,
 *   BX0:number,BX1:number,BZ0:number,BZ1:number,
 *   cellAt:(x:number,z:number)=>number,
 *   walls:Array<{x:number,z:number,ori:string,p:Float32Array,reinforced:boolean}>,
 *   doors:Array<{x:number,z:number,ori:string,hp:number}>,
 * }} MapInfo
 * @typedef {{
 *   B:any, scene:any, havok:any, map:MapInfo,
 *   debrisMaterial?:any, casingMaterial?:any,
 *   addShadowCaster?:(m:any)=>void,
 *   debrisN?:number, casingN?:number,
 * }} PhysicsOptions
 * @typedef {{node:any, body:any, life:number, max:number, on:boolean, s:number, k:number}} Slot
 */

const PARK_Y = -400;

/** prefixo dos ossos Mixamo no esqueleto ('mixamorig:' no FBX→glTF padrão, 'mixamorig' no Soldier.glb do three.js)
 * @param {any} skeleton */
export function mixamoPrefix(skeleton) {
  const b = skeleton.bones.find((/** @type {any} */ x) => /Hips$/.test(x.name));
  return b ? b.name.replace(/Hips$/, '') : 'mixamorig:';
}
/** configuração de ragdoll (caixas por osso, juntas com limites) para esqueleto Mixamo — medidas em metros
 * @param {any} B @param {string} P prefixo dos ossos */
export function mixamoRagdollConfig(B, P) {
  return [
    { bones: [P + 'Hips'], size: 0.25, boxOffset: 0.01 },
    {
      bones: [P + 'Spine2'],
      size: 0.4,
      height: 0.6,
      boxOffset: 0.05,
      boneOffsetAxis: B.Axis.Z,
      min: -1,
      max: 1,
      rotationAxis: B.Axis.Z,
    },
    {
      bones: [P + 'LeftArm', P + 'RightArm'],
      depth: 0.1,
      size: 0.1,
      width: 0.5,
      rotationAxis: B.Axis.Y,
      boxOffset: 0.1,
      boneOffsetAxis: B.Axis.Y,
    },
    {
      bones: [P + 'LeftForeArm', P + 'RightForeArm'],
      depth: 0.1,
      size: 0.1,
      width: 0.5,
      rotationAxis: B.Axis.Y,
      min: -1,
      max: 1,
      boxOffset: 0.12,
      boneOffsetAxis: B.Axis.Y,
    },
    {
      bones: [P + 'LeftUpLeg', P + 'RightUpLeg'],
      depth: 0.1,
      size: 0.2,
      width: 0.08,
      height: 0.7,
      rotationAxis: B.Axis.Y,
      min: -1,
      max: 1,
      boxOffset: 0.2,
      boneOffsetAxis: B.Axis.Y,
    },
    {
      bones: [P + 'LeftLeg', P + 'RightLeg'],
      depth: 0.08,
      size: 0.3,
      width: 0.1,
      height: 0.4,
      rotationAxis: B.Axis.Y,
      min: -1,
      max: 1,
      boxOffset: 0.2,
      boneOffsetAxis: B.Axis.Y,
    },
    {
      bones: [P + 'Head'],
      size: 0.4,
      boxOffset: 0,
      boneOffsetAxis: B.Axis.Y,
      min: -1,
      max: 1,
      rotationAxis: B.Axis.Z,
    },
  ];
}

/**
 * Cria o mundo físico visual. Retorna `null` se o Havok não estiver disponível
 * (o chamador deve manter o efeito antigo como alternativa).
 * @param {PhysicsOptions} o
 */
export function createPhysics(o) {
  const { B, scene, havok, map } = o;
  if (!havok || !B || !B.HavokPlugin) return null;
  const plugin = new B.HavokPlugin(true, havok);
  scene.enablePhysics(new B.Vector3(0, -9.81, 0), plugin);
  const eng = scene.getPhysicsEngine();
  eng.setSubTimeStep(1000 / 60); /* passo fixo de 60 Hz (independe do FPS) */
  const MT = B.PhysicsMotionType,
    CELL = map.CELL;

  /* filtros: 1 = mundo, 2 = estilhaço, 4 = cartucho, 8 = ragdoll (estilhaço não colide com estilhaço: mais barato e sem pilhas instáveis) */
  const F_WORLD = 1,
    F_DEB = 2,
    F_CAS = 4,
    F_RAG = 8;

  /* ---------- mundo estático (grade) ---------- */
  const staticRoot = new B.TransformNode('physStatic', scene);
  /** @param {number} x0 @param {number} y0 @param {number} z0 @param {number} x1 @param {number} y1 @param {number} z1 */
  const boxShape = (x0, y0, z0, x1, y1, z1) =>
    new B.PhysicsShapeBox(
      new B.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2),
      B.Quaternion.Identity(),
      new B.Vector3(Math.max(0.02, x1 - x0), Math.max(0.02, y1 - y0), Math.max(0.02, z1 - z0)),
      scene
    );
  /** @param {any} node @param {Array<number[]>} boxes */
  function staticBody(node, boxes) {
    const cont = new B.PhysicsShapeContainer(scene);
    for (const b of boxes) cont.addChild(boxShape(b[0], b[1], b[2], b[3], b[4], b[5]));
    cont.material = { friction: 0.8, restitution: 0.15 };
    cont.filterMembershipMask = F_WORLD;
    cont.filterCollideMask = 0xffff; /* o mundo colide com tudo (ragdoll, futuros objetos) */
    const body = new B.PhysicsBody(node, MT.STATIC, false, scene);
    body.shape = cont;
    return body;
  }
  {
    const { W, H, WALL_H, CRATE_H } = map,
      boxes = [];
    /* chão (grande) e forro do prédio */
    boxes.push([-20, -1, -20, W * CELL + 20, 0, H * CELL + 20]);
    boxes.push([
      map.BX0 * CELL,
      WALL_H,
      map.BZ0 * CELL,
      (map.BX1 + 1) * CELL,
      WALL_H + 0.5,
      (map.BZ1 + 1) * CELL,
    ]);
    /* paredes duras: junta células vizinhas na mesma linha (menos formas) */
    for (let z = 0; z < H; z++) {
      let run = -1;
      for (let x = 0; x <= W; x++) {
        const hard = x < W && map.cellAt(x, z) === 1;
        if (hard && run < 0) run = x;
        if (!hard && run >= 0) {
          boxes.push([run * CELL, 0, z * CELL, x * CELL, WALL_H, (z + 1) * CELL]);
          run = -1;
        }
      }
    }
    for (let z = 0; z < H; z++)
      for (let x = 0; x < W; x++)
        if (map.cellAt(x, z) === 2)
          boxes.push([
            x * CELL + 0.05,
            0,
            z * CELL + 0.05,
            (x + 1) * CELL - 0.05,
            CRATE_H,
            (z + 1) * CELL - 0.05,
          ]);
    staticBody(staticRoot, boxes);
  }
  /* paredes finas (16 painéis: 4 colunas x 4 fileiras) e barricadas: um corpo por estrutura, refeito quando muda */
  /** @type {Map<any,any>} */
  const structBodies = new Map();
  /** @param {any} s */
  function structBoxes(s) {
    const X = s.x * CELL,
      Z = s.z * CELL,
      T = s.p ? 0.16 : 0.1,
      out = [];
    /** @param {number} a @param {number} b @param {number} y0 @param {number} y1 */
    const put = (a, b, y0, y1) =>
      out.push(
        s.ori === 'x'
          ? [X + 1.5 - T, y0, Z + a, X + 1.5 + T, y1, Z + b]
          : [X + a, y0, Z + 1.5 - T, X + b, y1, Z + 1.5 + T]
      );
    if (s.p) {
      const rh = map.WALL_H / 4;
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < 4; col++)
          if (s.reinforced || s.p[row * 4 + col] > 0)
            put(col * 0.75, col * 0.75 + 0.75, row * rh, row * rh + rh);
    } else {
      put(0, CELL, map.DOOR_H, map.WALL_H); /* verga acima da porta */
      if (s.hp > 0) put(0, CELL, 0, map.DOOR_H);
    }
    return out;
  }
  /** @param {any} s */
  function refreshStruct(s) {
    const key = structBoxes(s)
      .map((b) => b.join(','))
      .join(';');
    const cur = structBodies.get(s);
    if (cur && cur.key === key) return;
    if (cur) {
      cur.body.dispose();
      cur.node.dispose();
    }
    const boxes = structBoxes(s);
    if (!boxes.length) {
      structBodies.delete(s);
      return;
    }
    const node = new B.TransformNode('physStruct', scene);
    structBodies.set(s, { key, node, body: staticBody(node, boxes) });
  }
  for (const w of map.walls) refreshStruct(w);
  for (const d of map.doors) refreshStruct(d);

  /* ---------- pools dinâmicos ---------- */
  const tmpM = new B.Matrix(),
    tmpS = new B.Vector3(1, 1, 1),
    zeroM = B.Matrix.Scaling(0, 0, 0);
  /**
   * @param {string} name @param {any} mesh @param {any} shape @param {number} n @param {number} mass @param {number} member @param {number} life
   */
  function makePool(name, mesh, shape, n, mass, member, life) {
    mesh.isPickable = false;
    mesh.alwaysSelectAsActiveMesh = true;
    const mats = new Float32Array(n * 16),
      cols = new Float32Array(n * 4).fill(1);
    for (let i = 0; i < n; i++) zeroM.copyToArray(mats, i * 16);
    mesh.thinInstanceSetBuffer('matrix', mats, 16, false);
    mesh.thinInstanceSetBuffer('color', cols, 4, false);
    shape.filterMembershipMask = member;
    shape.filterCollideMask = F_WORLD | (member === F_CAS ? F_DEB | F_CAS : F_CAS);
    /** @type {Slot[]} */
    const slots = [];
    for (let i = 0; i < n; i++) {
      const node = new B.TransformNode(name + i, scene);
      node.position.set(i * 2, PARK_Y, 0);
      node.rotationQuaternion = B.Quaternion.Identity();
      const body = new B.PhysicsBody(node, MT.DYNAMIC, false, scene);
      body.shape = shape;
      body.setMassProperties({ mass });
      body.setLinearDamping(0.05);
      body.setAngularDamping(0.3);
      body.setGravityFactor(0);
      body.disablePreStep = true;
      slots.push({ node, body, life: 0, max: life, on: false, s: 1, k: i });
    }
    let next = 0,
      dirty = false,
      anyOn = false;
    /** @type {Slot[]} */
    const teleport = [];
    const pool = {
      mesh,
      slots,
      mats,
      cols,
      /** @param {XYZ} p @param {XYZ} v @param {XYZ} w @param {number[]=} rgb @param {number=} s @param {number=} lifeK */
      spawn(p, v, w, rgb, s, lifeK) {
        const sl = slots[next];
        next = (next + 1) % n;
        sl.node.position.set(p.x, p.y, p.z);
        B.Quaternion.RotationYawPitchRollToRef(
          Math.random() * 6.3,
          Math.random() * 6.3,
          Math.random() * 6.3,
          sl.node.rotationQuaternion
        );
        sl.body.disablePreStep = false;
        teleport.push(sl);
        sl.body.setGravityFactor(1);
        sl.body.setLinearVelocity(new B.Vector3(v.x, v.y, v.z));
        sl.body.setAngularVelocity(new B.Vector3(w.x, w.y, w.z));
        sl.life = sl.max * (lifeK || 1);
        sl.on = true;
        sl.s = s || 1;
        if (rgb) {
          cols[sl.k * 4] = rgb[0];
          cols[sl.k * 4 + 1] = rgb[1];
          cols[sl.k * 4 + 2] = rgb[2];
          mesh.thinInstanceBufferUpdated('color');
        }
        anyOn = true;
        return sl;
      },
      /** @param {Slot} sl */
      park(sl) {
        sl.on = false;
        sl.life = 0;
        sl.node.position.set(sl.k * 2, PARK_Y, 0);
        sl.body.setGravityFactor(0);
        sl.body.setLinearVelocity(B.Vector3.Zero());
        sl.body.setAngularVelocity(B.Vector3.Zero());
        sl.body.disablePreStep = false;
        teleport.push(sl);
        zeroM.copyToArray(mats, sl.k * 16);
        dirty = true;
      },
      clear() {
        for (const sl of slots) if (sl.on) pool.park(sl);
      },
      /** depois do passo físico: copia as transformações para as thin instances */
      sync(/** @type {number} */ dt) {
        for (const sl of teleport) sl.body.disablePreStep = true;
        teleport.length = 0;
        if (!anyOn && !dirty) return;
        let on = false;
        for (const sl of slots) {
          if (!sl.on) continue;
          sl.life -= dt;
          if (sl.life <= 0) {
            pool.park(sl);
            continue;
          }
          on = true;
          const sc = sl.s * Math.min(1, sl.life / 0.35); /* encolhe no fim (sem sumir de repente) */
          tmpS.set(sc, sc, sc);
          B.Matrix.ComposeToRef(tmpS, sl.node.rotationQuaternion, sl.node.position, tmpM);
          tmpM.copyToArray(mats, sl.k * 16);
        }
        mesh.thinInstanceBufferUpdated('matrix');
        dirty = false;
        anyOn = on;
      },
      active() {
        let c = 0;
        for (const sl of slots) if (sl.on) c++;
        return c;
      },
    };
    return pool;
  }

  /* estilhaços: placas de drywall/tijolo/madeira */
  const debMesh = B.MeshBuilder.CreateBox(
    'physDebris',
    { width: 0.16, height: 0.16, depth: 0.05 },
    scene
  );
  debMesh.material = o.debrisMaterial || new B.PBRMaterial('physDebM', scene);
  if (!o.debrisMaterial) {
    debMesh.material.roughness = 0.9;
    debMesh.material.metallic = 0;
  }
  debMesh.receiveShadows = true;
  if (o.addShadowCaster) o.addShadowCaster(debMesh);
  const debShape = new B.PhysicsShapeBox(
    B.Vector3.Zero(),
    B.Quaternion.Identity(),
    new B.Vector3(0.16, 0.16, 0.05),
    scene
  );
  debShape.material = { friction: 0.7, restitution: 0.25 };
  const debris = makePool('deb', debMesh, debShape, o.debrisN || 96, 0.25, F_DEB, 7);

  /* cartuchos de latão */
  const casMesh = B.MeshBuilder.CreateCylinder(
    'physCasing',
    { diameter: 0.012, height: 0.045, tessellation: 8 },
    scene
  );
  casMesh.rotation.x = Math.PI / 2;
  casMesh.bakeCurrentTransformIntoVertices();
  if (o.casingMaterial) casMesh.material = o.casingMaterial;
  else {
    const m = new B.PBRMaterial('physCasM', scene);
    m.albedoColor = new B.Color3(0.78, 0.56, 0.26);
    m.metallic = 1;
    m.roughness = 0.32;
    casMesh.material = m;
  }
  const casShape = new B.PhysicsShapeBox(
    B.Vector3.Zero(),
    B.Quaternion.Identity(),
    new B.Vector3(0.02, 0.02, 0.05),
    scene
  ); /* um pouco maior que o visual: não afunda no chão */
  casShape.material = { friction: 0.5, restitution: 0.45 };
  const casings = makePool('cas', casMesh, casShape, o.casingN || 48, 0.012, F_CAS, 9);

  scene.onAfterPhysicsObservable.add(() => {
    debris.sync(1 / 60);
    casings.sync(1 / 60);
  });

  const R = (/** @type {number} */ a, /** @type {number} */ b) => a + Math.random() * (b - a);
  return {
    plugin,
    debris,
    casings,
    /**
     * Estilhaços físicos. `n`, cor e força iguais ao fxDebris antigo.
     * @param {XYZ} p @param {number} n @param {{r:number,g:number,b:number}} lin cor linear @param {number=} power
     */
    debris3(p, n, lin, power) {
      const pw = power || 3;
      for (let i = 0; i < n; i++) {
        const s = R(0.6, 1.4);
        debris.spawn(
          {
            x: p.x + R(-0.15, 0.15),
            y: Math.max(0.1, p.y + R(-0.15, 0.15)),
            z: p.z + R(-0.15, 0.15),
          },
          { x: R(-1, 1) * pw, y: R(0.2, 1.4) * pw, z: R(-1, 1) * pw },
          { x: R(-12, 12), y: R(-12, 12), z: R(-12, 12) },
          [lin.r * R(0.85, 1.1), lin.g * R(0.85, 1.1), lin.b * R(0.85, 1.1)],
          s,
          R(0.7, 1.2)
        );
      }
    },
    /**
     * Cartucho ejetado. pos = janela de ejeção, right/up = eixos da arma (mundo), base = velocidade de quem atirou.
     * @param {XYZ} pos @param {XYZ} right @param {XYZ} up @param {XYZ=} base
     */
    casing(pos, right, up, base) {
      const b = base || { x: 0, y: 0, z: 0 },
        sp = R(1.8, 2.6),
        u = R(1.2, 2);
      return casings.spawn(
        pos,
        {
          x: right.x * sp + up.x * u + b.x,
          y: right.y * sp + up.y * u + b.y,
          z: right.z * sp + up.z * u + b.z,
        },
        { x: R(-25, 25), y: R(-25, 25), z: R(-25, 25) },
        undefined,
        1,
        1
      );
    },
    /** estrutura destrutível mudou (painel quebrado, reforço, porta) */
    refreshStruct,
    refreshAll() {
      for (const w of map.walls) refreshStruct(w);
      for (const d of map.doors) refreshStruct(d);
    },
    clear() {
      debris.clear();
      casings.clear();
    },
    /** @param {boolean} on */
    setRunning(on) {
      scene.physicsEnabled = on;
    },
    stats() {
      return {
        debris: debris.active(),
        casings: casings.active(),
        structs: structBodies.size,
        bodies: plugin._bodies ? plugin._bodies.size : -1,
      };
    },
    /**
     * Ragdoll (para personagens com esqueleto). root = raiz do glTF ou a malha com pele; config opcional
     * (padrão: mixamoRagdollConfig). Retorna o B.Ragdoll; chame .ragdoll() na morte (antes disso os corpos
     * seguem a animação). Pare os AnimationGroups do personagem ao ligar. null se o Babylon não tiver Ragdoll.
     * @param {any} skeleton @param {any} root @param {any[]} config
     */
    ragdoll(skeleton, root, config) {
      if (!B.Ragdoll) return null;
      /* o Ragdoll do Babylon mede os ossos no espaço da malha com pele (no glTF ela fica sob o nó "Armature", escala 0,01) */
      if (root.skeleton !== skeleton && root.getChildMeshes)
        root =
          root.getChildMeshes(false).find((/** @type {any} */ m) => m.skeleton === skeleton) ||
          root;
      const chain = [];
      for (let n = root; n; n = n.parent) chain.unshift(n);
      for (const n of chain) n.computeWorldMatrix(true);
      skeleton.computeAbsoluteMatrices(true);
      const rd = new B.Ragdoll(
        skeleton,
        root,
        config || mixamoRagdollConfig(B, mixamoPrefix(skeleton))
      );
      for (const ag of rd._aggregates || [])
        if (ag && ag.shape) {
          ag.shape.filterMembershipMask = F_RAG;
          ag.shape.filterCollideMask = F_WORLD | F_RAG;
        }
      return rd;
    },
  };
}
