/* =====================================================================
   1ª PESSOA — mãos/luvas esqueletadas e animações reais (BarcodeGames, Fab.com; ver assets/LICENCAS/primeira-pessoa.txt)
   assets/fp_rifle.bin (rig do fuzil) · fp_pistol.bin (rig da pistola) · fp_anim.json (Reload, Reload_Empty, Fire, Draw, Holster)
   As ARMAS continuam procedurais (acessórios editáveis): a arma é filha do nó "Main_j" do rig, o carregador procedural segue
   a trajetória do carregador do rig e a mão de apoio recebe um IK de 2 ossos até o guarda-mão/carregador da arma atual.
   ===================================================================== */
const FPV = {
  rigs: {},
  ready: false,
  pending: false,
  fail: false,
  tmp: [],
  cur: null,
  clips: null,
};
/* grip/fore: onde, no quadro do osso Main_j do rig (m), ficam a empunhadura e o guarda-mão da arma ORIGINAL do pacote */
const FPV_RIGS = {
  rifle: {
    file: 'fp_rifle.bin',
    key: 'rifle',
    grip: [0, -0.05, -0.055],
    fore: [0.005, -0.03, 0.2],
    hs: 1,
    mags: ['Mag1_a', 'Mag2_a'],
  },
  pistol: {
    file: 'fp_pistol.bin',
    key: 'pistol',
    grip: [0, -0.045, -0.075],
    fore: null,
    hs: 1,
    mags: ['Mag1_a', 'Mag2_a'],
  },
};
const FPV_CLIPS = {
  rifle: {
    idle: null,
    draw: 'Draw',
    holster: 'Holster',
    fire: 'Fire',
    throw: 'Throw',
    reload: 'Reload',
    rempty: 'Reload_Empty',
  },
  pistol: {
    idle: null,
    draw: 'Draw',
    holster: 'Holster',
    fire: 'Fire',
    throw: 'Throw',
    reload: 'Reload',
    rempty: 'ReloadEmpty',
  },
};
/* recarga por arma (id BASE): cada arma tem o seu par normal/vazia, refeito a partir dos pacotes de animação (CC BY, ver LICENCAS):
   ccransh (SMG, AK-74m, fuzil, sniper, Benelli M4, pistola XD, Makarov) e 1Matzh (UZI, pistola 9mm). Sem entrada = recarga do rig (M4/Glock). */
const FPV_REL = {
  smg: ['RN_smg', 'RE_smg'],
  marimbondo: ['RN_marimbondo', 'RE_marimbondo'],
  cascavel: ['RN_cascavel', 'RE_cascavel'],
  abelha: ['RN_abelha', 'RE_abelha'],
  jararaca: ['RN_jararaca', 'RE_jararaca'],
  tupa: ['RN_tupa', 'RE_tupa'],
  boitata: ['RN_boitata', 'RE_boitata'],
  dmr: ['RN_dmr', 'RE_dmr'],
  carcara: ['RN_carcara', 'RE_carcara'],
  shotgun: ['RN_shotgun', 'RE_shotgun'],
  ressaca: ['RN_ressaca', 'RE_ressaca'],
  onca: ['RN_onca', 'RE_onca'],
  pardal: ['RN_pardal', 'RE_pardal'],
  jaguar: ['RN_jaguar', 'RE_jaguar'],
  pistol: ['RN_pistol', 'RE_pistol'],
};
function fpvClips(rig) {
  const cl = FPV_CLIPS[rig.k],
    K = rig.clips;
  if (!K) return cl;
  /* rig.w.id é o id da VARIANTE (com acessórios, ex.: 'smg@red.none.none.0'): a escolha do clipe usa o id BASE */
  const bid = rig.w
    ? (typeof wBase === 'function' && wBase(rig.w.id)) || String(rig.w.id).split('@')[0]
    : '';
  const r = FPV_REL[bid];
  if (r && K[r[0]] && K[r[1]]) return Object.assign({}, cl, { reload: r[0], rempty: r[1] });
  return cl;
}
function fpvLoad(scene) {
  if (FPV.pending || FPV.ready || FPV.fail) return;
  try {
    if (
      typeof ASSET_BYTES !== 'function' ||
      !B.SceneLoader ||
      !ASSET_BYTES('fp_anim.json') ||
      !ASSET_BYTES('fp_rifle.bin')
    ) {
      FPV.fail = true;
      return;
    }
    FPV.clips = JSON.parse(new TextDecoder().decode(ASSET_BYTES('fp_anim.json')));
    FPV.pending = true;
    let n = 0;
    const names = Object.keys(FPV_RIGS);
    for (const k of names) {
      const bytes = ASSET_BYTES(FPV_RIGS[k].file).slice(); /* o loader pode consumir o buffer */
      B.SceneLoader.LoadAssetContainerAsync('', bytes, scene, null, '.glb')
        .then((c) => {
          try {
            fpvSetup(k, c, scene);
          } catch (e) {
            console.warn('fpv', k, e);
            FPV.fail = true;
          }
          if (++n === names.length) {
            FPV.pending = false;
            FPV.ready = !FPV.fail;
          }
        })
        .catch((e) => {
          console.warn('fpv load', k, e);
          FPV.fail = true;
          if (++n === names.length) {
            FPV.pending = false;
            FPV.ready = false;
          }
        });
    }
  } catch (e) {
    console.warn('fpv', e);
    FPV.fail = true;
    FPV.pending = false;
  }
}
function fpvSetup(k, c, scene) {
  const cfg = FPV_RIGS[k];
  c.addAllToScene();
  const nodes = [...c.transformNodes, ...c.meshes].filter((n) => n.name !== '__root__');
  const top = c.rootNodes[0];
  const holder = new B.TransformNode('fph_' + k, scene);
  holder.parent = vmInner;
  holder.__keep = true;
  holder.rotationQuaternion = B.Quaternion.FromEulerAngles(
    0,
    Math.PI,
    0
  ); /* o rig olha +Z, o jogo olha −Z */
  top.parent = holder;
  holder.setEnabled(false);
  const idx = {},
    N = nodes.length;
  nodes.forEach((n, i) => {
    idx[n.name] = i;
    if (!n.rotationQuaternion)
      n.rotationQuaternion = B.Quaternion.FromEulerAngles(n.rotation.x, n.rotation.y, n.rotation.z);
  });
  const par = new Int16Array(N),
    restQ = new Float32Array(N * 4),
    restP = new Float32Array(N * 3);
  nodes.forEach((n, i) => {
    par[i] = n.parent ? nodes.indexOf(n.parent) : -1;
    const q = n.rotationQuaternion,
      p = n.position;
    restQ.set([q.x, q.y, q.z, q.w], i * 4);
    restP.set([p.x, p.y, p.z], i * 3);
  });
  const order = [],
    seen = new Uint8Array(N);
  const visit = (i) => {
    if (seen[i]) return;
    if (par[i] >= 0) visit(par[i]);
    seen[i] = 1;
    order.push(i);
  };
  for (let i = 0; i < N; i++) visit(i);
  /* clipes */
  const clips = {};
  const src = FPV.clips[k];
  for (const cn in src) {
    const cl = src[cn],
      tr = [];
    for (const t of cl.tr) {
      const i = idx[t.n];
      if (i == null) continue;
      const ts = t.t || cl.t,
        w = t.p === 'r' ? 4 : 3,
        K = ts.length,
        cst = t.v.length === w;
      tr.push({
        i,
        rot: t.p === 'r',
        cst,
        t: Float32Array.from(ts),
        v: Float32Array.from(t.v),
        K,
        w,
      });
    }
    clips[cn] = { dur: cl.dur, tr };
  }
  const mesh = c.meshes.find((m) => m.skeleton) || c.meshes[0];
  for (const m of c.meshes) {
    m.isPickable = false;
    m.receiveShadows = false;
    if (m.getTotalVertices() > 0) {
      m.alwaysSelectAsActiveMesh = true;
      m.doNotSyncBoundingInfo = true;
    }
  }
  for (const m of c.materials) {
    if ('metallic' in m) {
      m.metallic = 0;
      m.roughness = 0.9;
    }
    if ('transparencyMode' in m) m.transparencyMode = 0;
    m.backFaceCulling = true;
    m.alpha = 1;
    if (m.albedoTexture && m.albedoTexture.hasAlpha) m.albedoTexture.hasAlpha = false;
  }
  const rig = {
    k,
    cfg,
    c,
    holder,
    top,
    nodes,
    idx,
    par,
    order,
    restQ,
    restP,
    N,
    clips,
    mesh,
    Q: new Float32Array(N * 4),
    P: new Float32Array(N * 3),
    baseQ: new Float32Array(N * 4),
    baseP: new Float32Array(N * 3),
    snapQ: null,
    snapP: null,
    xf: 1,
    GQ: new Float32Array(N * 4),
    GP: new Float32Array(N * 3),
    tq: new Float32Array(N * 4),
    tp: new Float32Array(N * 3),
    animIdx: [],
    st: 'idle',
    stT: 0,
    ik: { lw: 0 },
  };
  const am = new Set();
  for (const cn in clips) for (const t of clips[cn].tr) am.add(t.i);
  for (const nm of ['LeftArm', 'LeftForeArm', 'LeftHand']) if (idx[nm] != null) am.add(idx[nm]);
  rig.animIdx = [...am];
  rig.mainI = idx.Main_j;
  rig.RH = idx.RightHand;
  rig.LA = idx.LeftArm;
  rig.LF = idx.LeftForeArm;
  rig.LH = idx.LeftHand;
  /* âncoras do carregador: pose "inserida" (início do Reload, e fim dele p/ o carregador novo) */
  const rl = clips.Reload;
  rig.mag = [];
  for (const mn of cfg.mags) {
    const mi = idx[mn];
    if (mi == null) continue;
    const A0 = fpvAnchor(rig, mi, rl, 0),
      A1 = fpvAnchor(rig, mi, rl, rl.dur);
    let mov = 0;
    for (let k = 1; k <= 16; k++)
      mov = Math.max(
        mov,
        fpvAnchor(rig, mi, rl, (rl.dur * k) / 16).dist(A0)
      ); /* quanto o osso anda no Reload: parado = carregador de bolso fixo (não é um 2º carregador na arma) */
    const ji =
      idx[
        mn.replace(/_a$/, '_j')
      ]; /* osso do carregador (a âncora _a é só o pivô da malha, fica ~.3 abaixo): a mão se mede por ele */
    rig.mag.push({
      i: mi,
      name: mn,
      ref: null,
      A0,
      A1,
      mov,
      j: ji,
      jp: ji != null ? Array.from(fpvAnchor(rig, ji, rl, 0).p) : null,
    });
  }
  /* referência "inserido": o carregador 1 no início; o 2 no fim do Reload (pose do carregador 1 no repouso) */
  rig.mag.forEach((m, j) => {
    m.ref = j === 0 ? m.A0 : m.A1.dist(rig.mag[0].A0) < m.A0.dist(rig.mag[0].A0) ? m.A1 : m.A0;
  });
  fpvEval(rig, null, 0);
  fpvFK(rig);
  rig.M0 = [rig.GP[rig.mainI * 3], rig.GP[rig.mainI * 3 + 1], rig.GP[rig.mainI * 3 + 2]];
  if (rig.LH != null && rig.mainI != null) {
    const q = new Float32Array(16);
    OPQ.irot(
      q,
      0,
      rig.GQ,
      rig.mainI * 4,
      rig.GP[rig.LH * 3] - rig.GP[rig.mainI * 3],
      rig.GP[rig.LH * 3 + 1] - rig.GP[rig.mainI * 3 + 1],
      rig.GP[rig.LH * 3 + 2] - rig.GP[rig.mainI * 3 + 2]
    );
    rig.lh0 = [q[0], q[1], q[2]];
  }
  /* mangas: o antebraço do pacote é pele nua até o cotovelo; um tubo cônico de tecido (filho do osso) cobre ~80% do antebraço */
  rig.sleeves = [];
  const sm = pbr(scene, { name: 'fpsleeve', color: '#3a3d33', rough: 0.92, metal: 0 });
  rig.sleeveMat = sm;
  /* manga = cópia da própria malha de pele (mesmo esqueleto), só dos triângulos do antebraço, empurrada .005 para fora e em tecido */
  try {
    const src = c.meshes.find((m) => m.name === 'Hand_Mesh_primitive0' && m.skeleton),
      sk = src && src.skeleton;
    if (sk) {
      const vd = B.VertexData.ExtractFromMesh(src),
        pos = vd.positions,
        nor = vd.normals,
        mi = vd.matricesIndices,
        mw = vd.matricesWeights;
      const bones = [
          'LeftForeArm',
          'RightForeArm',
          'LeftArm',
          'RightArm',
          'LeftShoulder',
          'RightShoulder',
        ].map((n) => sk.bones.findIndex((b) => b.name === n)),
        keep = new Uint8Array(pos.length / 3);
      bones.forEach((bi, bk) => {
        if (bi < 0) return;
        const inv = sk.bones[bi].getInvertedAbsoluteTransform();
        for (let v = 0; v < keep.length; v++) {
          let w = 0;
          for (let q = 0; q < 4; q++) if (mi[v * 4 + q] === bi) w += mw[v * 4 + q];
          if (w < 0.3) continue;
          const y = B.Vector3.TransformCoordinates(
            new B.Vector3(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]),
            inv
          ).y;
          if (y < 0.25 || bk >= 2) keep[v] = 1;
        }
      });
      /* braços mais finos: afina o antebraço e o braço (perpendicular ao osso), igual no cotovelo e sem mexer no pulso */
      try {
        const ch = {
            LeftForeArm: 'LeftHand',
            RightForeArm: 'RightHand',
            LeftArm: 'LeftForeArm',
            RightArm: 'RightForeArm',
          },
          F0 = 0.8,
          thin = Float32Array.from(pos);
        bones.forEach((bi, k) => {
          if (bi < 0 || k > 3) return;
          const nm = ['LeftForeArm', 'RightForeArm', 'LeftArm', 'RightArm'][k],
            cb = sk.bones.find((b) => b.name === ch[nm]);
          if (!cb) return;
          const inv = sk.bones[bi].getInvertedAbsoluteTransform(),
            ab = inv.clone().invert();
          const cl = B.Vector3.TransformCoordinates(
              cb.getInvertedAbsoluteTransform().clone().invert().getTranslation(),
              inv
            ),
            L = cl.length();
          if (L < 1e-5) return;
          const ax = cl.scale(1 / L);
          for (let v = 0; v < keep.length; v++) {
            let w = 0;
            for (let q = 0; q < 4; q++) if (mi[v * 4 + q] === bi) w += mw[v * 4 + q];
            if (w < 0.02) continue;
            const lp = B.Vector3.TransformCoordinates(
                new B.Vector3(thin[v * 3], thin[v * 3 + 1], thin[v * 3 + 2]),
                inv
              ),
              al = B.Vector3.Dot(lp, ax),
              t = Math.min(1, Math.max(0, al / L)),
              f = 1 - (1 - F0 * 1) * (1 - t * t) * w;
            const np2 = ax.scale(al).add(lp.subtract(ax.scale(al)).scale(f)),
              wp = B.Vector3.TransformCoordinates(np2, ab);
            thin[v * 3] = wp.x;
            thin[v * 3 + 1] = wp.y;
            thin[v * 3 + 2] = wp.z;
          }
        });
        pos.set(thin);
        src.updateVerticesData(B.VertexBuffer.PositionKind, thin);
      } catch (e) {
        console.warn('thin', e);
      }
      const idxs = [];
      for (let t = 0; t < vd.indices.length; t += 3) {
        const a = vd.indices[t],
          b2 = vd.indices[t + 1],
          c2 = vd.indices[t + 2];
        if (keep[a] + keep[b2] + keep[c2] >= 1) idxs.push(a, b2, c2);
      }
      if (idxs.length) {
        const np = Float32Array.from(pos);
        for (let v = 0; v < keep.length; v++) {
          np[v * 3] += nor[v * 3] * 0.012;
          np[v * 3 + 1] += nor[v * 3 + 1] * 0.012;
          np[v * 3 + 2] += nor[v * 3 + 2] * 0.012;
        }
        /* a malha do braço acaba aberta no ombro: quando a mão vai à frente, a ponta oca aparecia na tela.
           A borda do ombro é esticada 0,7 m para trás (na direção cotovelo -> ombro), com os mesmos pesos,
           e a manga passa a sair da tela como um braço inteiro. */
        let xp = Array.from(np),
          xn = Array.from(nor),
          xu = vd.uvs ? Array.from(vd.uvs) : null,
          xi = Array.from(mi),
          xw = Array.from(mw);
        try {
          const bpos = (n) => {
            const b = sk.bones.find((x) => x.name === n);
            return b ? b.getInvertedAbsoluteTransform().clone().invert().getTranslation() : null;
          };
          const ec = new Map();
          for (let t = 0; t < idxs.length; t += 3)
            for (let e = 0; e < 3; e++) {
              const u = idxs[t + e],
                v = idxs[t + ((e + 1) % 3)],
                k = u < v ? u + '_' + v : v + '_' + u;
              ec.set(k, (ec.get(k) || 0) + 1);
            }
          const edges = [];
          for (const [k, n] of ec) if (n === 1) edges.push(k.split('_').map(Number));
          const P = (v) => new B.Vector3(np[v * 3], np[v * 3 + 1], np[v * 3 + 2]);
          const sides = ['Left', 'Right']
            .map((sd) => ({ elbow: bpos(sd + 'ForeArm'), hand: bpos(sd + 'Hand') }))
            .filter((x) => x.elbow && x.hand);
          for (const sd of sides) {
            const back = sd.elbow.subtract(sd.hand).normalize();
            /* borda do lado do ombro: fica para trás do cotovelo e mais perto deste cotovelo que do outro */
            const ok = (v) => {
              const p = P(v);
              if (B.Vector3.Dot(p.subtract(sd.elbow), back) < 0.02) return false;
              for (const o of sides)
                if (o !== sd && B.Vector3.Distance(p, o.elbow) < B.Vector3.Distance(p, sd.elbow))
                  return false;
              return true;
            };
            const es = edges.filter((e) => ok(e[0]) && ok(e[1]));
            if (es.length < 3) continue;
            const c0 = new B.Vector3();
            const vs = new Set();
            for (const e of es) for (const v of e) vs.add(v);
            for (const v of vs) c0.addInPlace(P(v));
            const dir = c0
              .scale(1 / vs.size)
              .subtract(sd.elbow)
              .normalize()
              .scale(0.7);
            const map = new Map();
            for (const v of vs) {
              map.set(v, xp.length / 3);
              xp.push(np[v * 3] + dir.x, np[v * 3 + 1] + dir.y, np[v * 3 + 2] + dir.z);
              xn.push(nor[v * 3], nor[v * 3 + 1], nor[v * 3 + 2]);
              if (xu) xu.push(vd.uvs[v * 2], vd.uvs[v * 2 + 1]);
              for (let q = 0; q < 4; q++) {
                xi.push(mi[v * 4 + q]);
                xw.push(mw[v * 4 + q]);
              }
            }
            for (const [u, v] of es) idxs.push(u, v, map.get(v), u, map.get(v), map.get(u));
            rig.sleeveExt = (rig.sleeveExt || 0) + es.length;
          }
        } catch (e) {
          console.warn('sleeve ext', e);
          xp = Array.from(np);
        }
        const nv = new B.VertexData();
        nv.positions = xp;
        nv.normals = xn;
        nv.uvs = xu;
        nv.indices = idxs;
        nv.matricesIndices = xi;
        nv.matricesWeights = xw;
        const sl = new B.Mesh('fpsleeve_mesh', scene);
        nv.applyToMesh(sl, false);
        sl.skeleton = sk;
        sl.numBoneInfluencers = src.numBoneInfluencers || 4;
        sl.parent = src.parent;
        sl.position.copyFrom(src.position);
        if (src.rotationQuaternion) sl.rotationQuaternion = src.rotationQuaternion.clone();
        sl.scaling.copyFrom(src.scaling);
        sm.backFaceCulling = false;
        sm.environmentIntensity = 0.25;
        sl.material = sm;
        sl.isPickable = false;
        sl.receiveShadows = false;
        sl.alwaysSelectAsActiveMesh = true;
        sl.doNotSyncBoundingInfo = true;
        sl.renderingGroupId = src.renderingGroupId;
        rig.sleeves.push(sl);
      }
    }
  } catch (e) {
    console.warn('sleeve', e);
  }
  FPV.rigs[k] = rig;
}
/* pose (quatérnio+posição) do nó i no quadro de Main_j, no instante t do clipe (sem escala) */
function fpvAnchor(rig, i, clip, t) {
  fpvEval(rig, clip, t);
  fpvFK(rig);
  const M = rig.mainI,
    r = { q: new Float32Array(4), p: new Float32Array(3) };
  OPQ.imul(r.q, 0, rig.GQ, M * 4, rig.GQ, i * 4);
  const d = [
    rig.GP[i * 3] - rig.GP[M * 3],
    rig.GP[i * 3 + 1] - rig.GP[M * 3 + 1],
    rig.GP[i * 3 + 2] - rig.GP[M * 3 + 2],
  ];
  OPQ.irot(r.p, 0, rig.GQ, M * 4, d[0], d[1], d[2]);
  r.dist = (o) => Math.hypot(r.p[0] - o.p[0], r.p[1] - o.p[1], r.p[2] - o.p[2]);
  return r;
}
/* amostra o clipe c no instante t sobre rig.Q/P (parte do repouso) */
function fpvEval(rig, c, t) {
  rig.Q.set(rig.restQ);
  rig.P.set(rig.restP);
  if (c) fpvSample(rig, c, t, rig.Q, rig.P);
}
function fpvSample(rig, c, t, Q, P) {
  t = Math.min(Math.max(t, 0), c.dur);
  for (const tk of c.tr) {
    const w = tk.w,
      o = tk.i * w;
    if (tk.cst) {
      for (let e = 0; e < w; e++) (tk.rot ? Q : P)[o + e] = tk.v[e];
      continue;
    }
    const ts = tk.t,
      K = tk.K;
    let a = 0,
      b = K - 1;
    if (t >= ts[K - 1]) a = b = K - 1;
    else if (t <= ts[0]) a = b = 0;
    else {
      let lo = 0,
        hi = K - 1;
      while (hi - lo > 1) {
        const m = (lo + hi) >> 1;
        if (ts[m] <= t) lo = m;
        else hi = m;
      }
      a = lo;
      b = hi;
    }
    const u = a === b ? 0 : (t - ts[a]) / (ts[b] - ts[a]),
      A = a * w,
      Bb = b * w,
      V = tk.v;
    if (tk.rot) {
      let s =
        V[A] * V[Bb] + V[A + 1] * V[Bb + 1] + V[A + 2] * V[Bb + 2] + V[A + 3] * V[Bb + 3] < 0
          ? -1
          : 1;
      let x = V[A] + (V[Bb] * s - V[A]) * u,
        y = V[A + 1] + (V[Bb + 1] * s - V[A + 1]) * u,
        z = V[A + 2] + (V[Bb + 2] * s - V[A + 2]) * u,
        ww = V[A + 3] + (V[Bb + 3] * s - V[A + 3]) * u;
      const l = Math.hypot(x, y, z, ww) || 1;
      Q[o] = x / l;
      Q[o + 1] = y / l;
      Q[o + 2] = z / l;
      Q[o + 3] = ww / l;
    } else {
      P[o] = V[A] + (V[Bb] - V[A]) * u;
      P[o + 1] = V[A + 1] + (V[Bb + 1] - V[A + 1]) * u;
      P[o + 2] = V[A + 2] + (V[Bb + 2] - V[A + 2]) * u;
    }
  }
}
/* cinemática direta (quadro do arquivo) a partir de rig.Q/P → rig.GQ/GP */
function fpvFK(rig) {
  const { order, par, Q, P, GQ, GP } = rig;
  for (const i of order) {
    const p = par[i],
      k = i * 4,
      v = i * 3;
    if (p < 0) {
      GQ[k] = Q[k];
      GQ[k + 1] = Q[k + 1];
      GQ[k + 2] = Q[k + 2];
      GQ[k + 3] = Q[k + 3];
      GP[v] = P[v];
      GP[v + 1] = P[v + 1];
      GP[v + 2] = P[v + 2];
      continue;
    }
    OPQ.mul(GQ, k, GQ, p * 4, Q, k);
    OPQ.rot(GP, v, GQ, p * 4, P[v], P[v + 1], P[v + 2]);
    GP[v] += GP[p * 3];
    GP[v + 1] += GP[p * 3 + 1];
    GP[v + 2] += GP[p * 3 + 2];
  }
}
function fpvWrite(rig) {
  const { nodes, Q, P } = rig;
  for (const i of rig.animIdx) {
    const n = nodes[i],
      k = i * 4,
      v = i * 3;
    n.rotationQuaternion.set(Q[k], Q[k + 1], Q[k + 2], Q[k + 3]);
    n.position.set(P[v], P[v + 1], P[v + 2]);
  }
}

/* ---------- liga a arma procedural ao rig ---------- */
function fpvDetach() {
  FPV.held = null;
  for (const n of FPV.tmp) if (!n.isDisposed()) n.dispose(false, false);
  FPV.tmp = [];
  if (FPV.cur) {
    FPV.cur.holder.setEnabled(false);
    FPV.cur = null;
  }
}
/* classes de mão: por enquanto só por rig; offsets por classe em FPV_CLS (m, no quadro da arma: dx,dy,dz da arma; fx,fy,fz da mão de apoio) */
const FPV_CLS = {
  smg: { fz: 0.04 },
  lmg: { fz: 0.05 },
}; /* beta.8: a mão de apoio cai sobre a empunhadura vertical (antes ficava 2-3 cm atrás dela) */
/* gadget/granada na mão direita durante o arremesso/uso (modelo do soldado, escala 1/hs dentro do holder) */
function fpvHeld(kind) {
  if (FPV.held) {
    if (!FPV.held.isDisposed()) FPV.held.dispose(false, true);
    FPV.held = null;
  }
  const rig = FPV.cur;
  if (!kind || !rig || rig.RH == null) return;
  const hs = rig.cfg.hs || 1,
    node = rig.nodes[rig.RH];
  if (!node) return;
  const g = buildGadget(game, kind);
  g.parent = node;
  g.scaling.setAll(0.5 / hs);
  const sm =
    kind === 'frag' ||
    kind === 'impact' ||
    kind === 'flash'; /* granadas cabem na palma; os outros gadgets ficam apoiados */
  g.position.set(0, sm ? 0.075 : 0.09, sm ? 0.02 : 0.03);
  g.rotationQuaternion = B.Quaternion.FromEulerAngles(sm ? 0 : -Math.PI / 2, 0, 0);
  for (const m of g.getChildMeshes()) {
    m.renderingGroupId = 1;
    m.alwaysSelectAsActiveMesh = true;
    m.receiveShadows = false;
    m.isPickable = false;
  }
  FPV.held = g;
  FPV.tmp.push(g);
}
function fpvAttach(w, wid, op) {
  fpvDetach();
  const rk = w.hold === 'pistol' ? 'pistol' : 'rifle',
    rig = FPV.rigs[rk];
  if (!rig) return false;
  const cfg = rig.cfg,
    cc = FPV_CLS[w.cls] || {},
    g = cfg.grip,
    ox = cc.dx || 0,
    oy = cc.dy || 0,
    oz = cc.dz || 0;
  const hs = cfg.hs || 1; /* escala das mãos relativa à arma (a arma fica em 1/hs) */
  FPV.cur = rig;
  rig.holder.setEnabled(true);
  fpvTint(rig, op && op.look && op.look.skin);
  if (rig.sleeveMat) {
    const cl = (op && op.look && op.look.cols && op.look.cols[0]) || '#3a3d33';
    rig.sleeveMat.albedoColor = B.Color3.FromHexString(cl).toLinearSpace().scale(0.3);
  }
  /* o ponto da empunhadura (quadro Main_j) cai na origem do vmInner: a arma procedural tinha a empunhadura na origem */
  const gp = { x: g[0] + ox, y: g[1] + oy, z: g[2] + oz };
  rig.holder.scaling.setAll(hs);
  const M0 = rig.M0;
  rig.holder.position.set(hs * (M0[0] + gp.x), -hs * (M0[1] + gp.y), hs * (M0[2] + gp.z));
  /* nó da arma: filho de Main_j, com o giro de 180° (frente −Z da arma → +Z do rig) */
  const main = rig.nodes[rig.mainI];
  const gun = new B.TransformNode('fpgun', game);
  gun.parent = main;
  gun.position.set(g[0] + ox, g[1] + oy, g[2] + oz);
  gun.rotationQuaternion = B.Quaternion.FromEulerAngles(0, Math.PI, 0);
  gun.scaling.setAll(1 / hs);
  FPV.tmp.push(gun);
  w.g.parent = gun;
  w.g.position.set(-w.grip.x, -w.grip.y, -w.grip.z);
  /* carregador(es): seguem a âncora do carregador do rig (delta em relação à pose "inserida") */
  rig.mg = [];
  if (w.mag) {
    const mags = [w.mag];
    if (rig.mag.length > 1) {
      const c2 = w.mag.clone('mag2', w.mag.parent);
      mags.push(c2);
    }
    mags.forEach((mg, j) => {
      const a = rig.mag[j];
      if (!a) return;
      const d = new B.TransformNode('mgd' + j, game);
      d.parent = main;
      d.rotationQuaternion = new B.Quaternion();
      FPV.tmp.push(d);
      const f = new B.TransformNode('mgf' + j, game);
      f.parent = d;
      f.position.copyFrom(gun.position);
      f.rotationQuaternion = gun.rotationQuaternion.clone();
      f.scaling.copyFrom(gun.scaling);
      const f2 = new B.TransformNode('mgw' + j, game);
      f2.parent = f;
      f2.position.set(-w.grip.x, -w.grip.y, -w.grip.z);
      mg.parent = f2;
      mg.position.copyFrom(w.magHome);
      rig.mg.push({ d, a, node: mg });
    });
  }
  rig.w = w;
  rig.gp = gp;
  rig.hs = hs;
  rig.st = null;
  rig.xf = 1;
  rig.snapQ = null;
  /* alvo da mão de apoio no quadro Main_j (a arma procedural: giro 180°, empunhadura em gp) */
  const R = (v) => ({ x: -v.x, y: v.y, z: -v.z }),
    sb = (u, v) => ({ x: u.x - v.x, y: u.y - v.y, z: u.z - v.z });
  rig.foreP = null;
  if (cfg.fore) {
    const fr = R(sb(w.fore, w.grip));
    rig.foreP = { x: gp.x + fr.x, y: gp.y + fr.y, z: gp.z + fr.z };
  }
  if (cc.fx || cc.fy || cc.fz) {
    if (rig.foreP) {
      rig.foreP.x += cc.fx || 0;
      rig.foreP.y += cc.fy || 0;
      rig.foreP.z += cc.fz || 0;
    }
  }
  rig.dFore = rig.foreP
    ? [rig.foreP.x - cfg.fore[0], rig.foreP.y - cfg.fore[1], rig.foreP.z - cfg.fore[2]]
    : [0, 0, 0];
  if (w.magHome) {
    const mr = R(sb(w.magHome, w.grip));
    rig.magP = [gp.x + mr.x, gp.y + mr.y, gp.z + mr.z];
  } else rig.magP = null;
  return true;
}

/* ---------- quadro a quadro ---------- */
const _fpq = new Float32Array(16),
  _fpa = new Float32Array(32);
const fpvSm = (a, b, x) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};
function fpvStep(dt, S) {
  const rig = FPV.cur;
  if (!rig || !rig.w) return;
  const cl = fpvClips(rig),
    { Q, P, restQ, restP, GQ, GP } = rig;
  if (rig.w.g)
    rig.w.g.setEnabled(S.st !== 'throw'); /* arremesso/gadget: as duas mãos ficam livres */
  const cname =
    S.st === 'throw'
      ? cl.throw
      : S.st === 'draw'
        ? cl.draw
        : S.st === 'holster'
          ? cl.holster
          : S.st === 'reload'
            ? cl.reload
            : S.st === 'rempty'
              ? cl.rempty
              : null;
  if (S.st !== rig.st) {
    if (rig.st !== null && S.st !== 'idle') {
      rig.snapQ = rig.baseQ.slice();
      rig.snapP = rig.baseP.slice();
      rig.xf = 0;
    } else rig.xf = 1;
    rig.st = S.st;
  } /* voltar ao repouso é instantâneo (os clipes terminam na pose de repouso) */
  Q.set(restQ);
  P.set(restP);
  rig.clipName = cname;
  rig.clipT = S.t; /* (teste) clipe em reprodução e tempo dele */
  const c = cname ? rig.clips[cname] : null;
  if (c) fpvSample(rig, c, S.t, Q, P);
  rig.xf = Math.min(1, rig.xf + dt / (S.blend || 0.14));
  if (rig.xf < 1 && rig.snapQ) {
    const k = fpvSm(0, 1, rig.xf),
      sq = rig.snapQ,
      sp = rig.snapP;
    for (const i of rig.animIdx) {
      const o = i * 4,
        v = i * 3;
      _fpq[0] = sq[o];
      _fpq[1] = sq[o + 1];
      _fpq[2] = sq[o + 2];
      _fpq[3] = sq[o + 3];
      OPQ.lerp(_fpq, 0, Q, o, k);
      Q[o] = _fpq[0];
      Q[o + 1] = _fpq[1];
      Q[o + 2] = _fpq[2];
      Q[o + 3] = _fpq[3];
      P[v] = sp[v] + (P[v] - sp[v]) * k;
      P[v + 1] = sp[v + 1] + (P[v + 1] - sp[v + 1]) * k;
      P[v + 2] = sp[v + 2] + (P[v + 2] - sp[v + 2]) * k;
    }
  }
  rig.baseQ.set(Q);
  rig.baseP.set(P);
  /* tiro: camada aditiva (o clipe Fire é sutil; o coice grande vem do updateVM) */
  if (S.fireT >= 0 && S.fireW > 0) {
    const fc = rig.clips[cl.fire];
    if (fc) {
      rig.tq.set(restQ);
      rig.tp.set(restP);
      fpvSample(rig, fc, S.fireT, rig.tq, rig.tp);
      const w = S.fireW;
      for (const t of fc.tr) {
        const i = t.i;
        if (t.rot) {
          const o = i * 4;
          OPQ.imul(_fpq, 0, restQ, o, rig.tq, o);
          OPQ.scale(_fpq, 0, w);
          OPQ.mul(Q, o, Q, o, _fpq, 0);
        } else {
          const v = i * 3;
          P[v] += (rig.tp[v] - restP[v]) * w;
          P[v + 1] += (rig.tp[v + 1] - restP[v + 1]) * w;
          P[v + 2] += (rig.tp[v + 2] - restP[v + 2]) * w;
        }
      }
    }
  }
  fpvFK(rig);
  const M = rig.mainI,
    mg = rig.mg || [];
  /* carregadores: delta da âncora em relação à pose inserida */
  let wm = 0;
  for (const m of mg) {
    const a = m.a,
      i = a.i,
      q = _fpa,
      ref = a.ref;
    OPQ.imul(q, 0, GQ, M * 4, GQ, i * 4); /* qa = Qmain⁻¹·Qanc */
    OPQ.irot(
      q,
      4,
      GQ,
      M * 4,
      GP[i * 3] - GP[M * 3],
      GP[i * 3 + 1] - GP[M * 3 + 1],
      GP[i * 3 + 2] - GP[M * 3 + 2]
    ); /* pa no quadro de Main */
    q[8] = -ref.q[0];
    q[9] = -ref.q[1];
    q[10] = -ref.q[2];
    q[11] = ref.q[3];
    OPQ.mul(q, 12, q, 0, q, 8); /* delta = qa·ref⁻¹ */
    OPQ.rot(q, 16, q, 12, ref.p[0], ref.p[1], ref.p[2]);
    m.d.rotationQuaternion.set(q[12], q[13], q[14], q[15]);
    m.d.position.set(q[4] - q[16], q[5] - q[17], q[6] - q[18]);
    const dist = Math.hypot(q[4] - ref.p[0], q[5] - ref.p[1], q[6] - ref.p[2]);
    m.dist = dist;
    if (rig.LH != null) {
      const lh = rig.LH,
        ai = m.a.i;
      m.dh = Math.hypot(
        GP[lh * 3] - GP[ai * 3],
        GP[lh * 3 + 1] - GP[ai * 3 + 1],
        GP[lh * 3 + 2] - GP[ai * 3 + 2]
      );
    }
    /* carregador 1: some quando está longe da arma E longe da mão (o que saía da pistola ficava voando) */
    const vis =
      m === mg[0]
        ? dist < 0.5 && (dist < 0.08 || m.dh == null || m.dh < 0.3)
        : (S.st === 'reload' || S.st === 'rempty') && dist < 0.32 && m.a.mov > 0.05;
    m.node.setEnabled(vis && !S.noMag && S.st !== 'throw');
  }
  /* mão esquerda: IK até o guarda-mão (ou o carregador, enquanto o pega) */
  if (rig.LA != null && rig.foreP) {
    const lh = rig.LH,
      hx = GP[lh * 3],
      hy = GP[lh * 3 + 1],
      hz = GP[lh * 3 + 2];
    let d = rig.dFore;
    /* na recarga a mão sai do guarda-mão (vai ao carregador, ao bolso…): a correção do guarda-mão só vale enquanto ela está perto dele, senão a mão é empurrada para longe do carregador */
    if ((S.st === 'reload' || S.st === 'rempty') && rig.lh0) {
      OPQ.irot(_fpq, 8, GQ, M * 4, hx - GP[M * 3], hy - GP[M * 3 + 1], hz - GP[M * 3 + 2]);
      const dv = Math.hypot(_fpq[8] - rig.lh0[0], _fpq[9] - rig.lh0[1], _fpq[10] - rig.lh0[2]),
        wf = 1 - fpvSm(0.03, 0.1, dv);
      d = [d[0] * wf, d[1] * wf, d[2] * wf];
    }
    if (rig.magP && mg.length && (S.st === 'reload' || S.st === 'rempty')) {
      /* quão perto a mão está de um carregador do rig → segue a diferença do carregador procedural */
      let best = 0;
      for (const m of mg) {
        if (!m.node.isEnabled()) continue;
        const ai = m.a.j != null ? m.a.j : m.a.i;
        const dd = Math.hypot(hx - GP[ai * 3], hy - GP[ai * 3 + 1], hz - GP[ai * 3 + 2]);
        m.dh = dd;
        best = Math.max(best, m.a.j != null ? fpvSm(0.2, 0.12, dd) : fpvSm(0.33, 0.27, dd));
      } /* mão perto do osso do carregador (ou, sem osso, da âncora) */
      wm = best;
      const mp = rig.magP,
        r0 = mg[0].a.jp || mg[0].a.ref.p;
      d = [
        d[0] + (mp[0] - r0[0] - d[0]) * wm,
        d[1] + (mp[1] - r0[1] - d[1]) * wm,
        d[2] + (mp[2] - r0[2] - d[2]) * wm,
      ];
    }
    if (S.pump) d = [d[0], d[1], d[2] - S.pump * (rig.hs || 1)];
    OPQ.rot(_fpq, 0, GQ, M * 4, d[0], d[1], d[2]);
    fpvIK(rig, hx + _fpq[0], hy + _fpq[1], hz + _fpq[2]);
  }
  fpvWrite(rig);
}

/* IK de 2 ossos (braço → antebraço → mão) até o ponto t (quadro do arquivo); a mão mantém a orientação do clipe */
function fpvIK(rig, tx, ty, tz) {
  const { GQ, GP, Q } = rig,
    U = rig.LA,
    Mi = rig.LF,
    E = rig.LH,
    a = [GP[U * 3], GP[U * 3 + 1], GP[U * 3 + 2]],
    b = [GP[Mi * 3], GP[Mi * 3 + 1], GP[Mi * 3 + 2]],
    c = [GP[E * 3], GP[E * 3 + 1], GP[E * 3 + 2]];
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]],
    len = (v) => Math.hypot(v[0], v[1], v[2]),
    dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
  const l1 = len(sub(b, a)),
    l2 = len(sub(c, b));
  let t = sub([tx, ty, tz], a);
  /* alvo longe demais (armas compridas): leva o ombro (fora da tela) para frente em vez de esticar o braço */
  {
    const d = len(t),
      mx = (l1 + l2) * 0.97;
    if (d > mx) {
      const sh = d - mx,
        k = sh / d,
        pu = rig.par[U],
        v = U * 3;
      a[0] += t[0] * k;
      a[1] += t[1] * k;
      a[2] += t[2] * k;
      b[0] += t[0] * k;
      b[1] += t[1] * k;
      b[2] += t[2] * k;
      c[0] += t[0] * k;
      c[1] += t[1] * k;
      c[2] += t[2] * k;
      t = sub([tx, ty, tz], a);
      if (pu >= 0) {
        OPQ.irot(
          _fpa,
          28,
          GQ,
          pu * 4,
          a[0] - GP[pu * 3],
          a[1] - GP[pu * 3 + 1],
          a[2] - GP[pu * 3 + 2]
        );
        rig.P[v] = _fpa[28];
        rig.P[v + 1] = _fpa[29];
        rig.P[v + 2] = _fpa[30];
      }
    }
  }
  const d0 = len(t) || 1e-6;
  const dd = Math.min(Math.max(d0, 0.08), l1 + l2 - 0.003),
    dir = [t[0] / d0, t[1] / d0, t[2] / d0];
  const pm = sub(b, a),
    pd = dot(pm, dir);
  let pv = [pm[0] - dir[0] * pd, pm[1] - dir[1] * pd, pm[2] - dir[2] * pd];
  const pl = len(pv);
  if (pl < 1e-4) pv = [0, -1, 0];
  else pv = [pv[0] / pl, pv[1] / pl, pv[2] / pl];
  const ca = Math.min(1, Math.max(-1, (l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd))),
    sa = Math.sqrt(1 - ca * ca);
  const b2 = [
      a[0] + dir[0] * l1 * ca + pv[0] * l1 * sa,
      a[1] + dir[1] * l1 * ca + pv[1] * l1 * sa,
      a[2] + dir[2] * l1 * ca + pv[2] * l1 * sa,
    ],
    c2 = [a[0] + dir[0] * dd, a[1] + dir[1] * dd, a[2] + dir[2] * dd];
  const A = _fpa;
  let v = sub(b2, a),
    u = sub(b, a);
  OPQ.fromTo(A, 0, u[0], u[1], u[2], v[0], v[1], v[2]); /* R1 */
  OPQ.mul(A, 4, A, 0, GQ, U * 4); /* QU' */
  const cc = [0, 0, 0];
  OPQ.rot(A, 12, A, 0, c[0] - a[0], c[1] - a[1], c[2] - a[2]);
  cc[0] = a[0] + A[12];
  cc[1] = a[1] + A[13];
  cc[2] = a[2] + A[14];
  v = sub(c2, b2);
  u = sub(cc, b2);
  OPQ.fromTo(A, 16, u[0], u[1], u[2], v[0], v[1], v[2]); /* R2 */
  OPQ.mul(A, 20, A, 0, GQ, Mi * 4);
  OPQ.mul(A, 20, A, 16, A, 20); /* QM' = R2·R1·QM */
  const pu = rig.par[U];
  if (pu >= 0) OPQ.imul(Q, U * 4, GQ, pu * 4, A, 4);
  else {
    Q[U * 4] = A[4];
    Q[U * 4 + 1] = A[5];
    Q[U * 4 + 2] = A[6];
    Q[U * 4 + 3] = A[7];
  }
  OPQ.imul(Q, Mi * 4, A, 4, A, 20);
  OPQ.imul(Q, E * 4, A, 20, GQ, E * 4);
}

/* tom de pele do operador (a textura do pacote é clara: multiplica por skin/base em linear) */
function fpvTint(rig, hex) {
  const m = rig.c.materials.find((x) => /Hand/i.test(x.name));
  if (!m || !('albedoColor' in m)) return;
  const lin = (h) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.pow(v / 255, 2.2));
  };
  if (!hex) {
    m.albedoColor.set(1, 1, 1);
    return;
  }
  const a = lin(hex),
    b = lin('#e0a58a');
  m.albedoColor.set(...a.map((v, i) => Math.min(1.15, Math.max(0.2, v / b[i]))));
}
Promise.resolve().then(() => {
  VM.fpv = FPV;
  fpvLoad(game);
});
