/* =====================================================================
   LUZ, SOMBRAS E PÓS-PROCESSAMENTO (câmera, sol, IBL, mapa de luz, pipeline)
   - IBL: scene.environmentTexture (.env embutido) dá reflexo e luz ambiente.
   - "Look map": textura 2D do mapa inteiro (4 texels/m) calculada na carga a
     partir da grade: R = luz das luminárias (com oclusão das paredes),
     G = oclusão de ambiente (cantos, pé das paredes e das caixas), B = céu
     visível (fora = 1, entra pelas portas). Um plugin de material PBR usa isso
     para escurecer o ambiente dentro do prédio, criar poças de luz sob as
     luminárias e sombras de contato — custo: 1 leitura de textura por pixel.
   ===================================================================== */
const camera = new B.FreeCamera('cam', new B.Vector3(0, 2, 0), game);
camera.minZ = 0.05;
camera.maxZ = 300;
camera.fov = (SAVE.fov * Math.PI) / 180;
camera.inputs.clear();
game.activeCamera = camera;

/* sol quente com sombras; o ambiente (céu/rebatimento) vem do IBL */
/* (área mapa) sol de fim de tarde: ~31° de elevação, mesmo azimute de antes — entra pelas janelas leste/sul e desenha manchas longas lá dentro */
const SUN_DIR = new B.Vector3(-0.68, -0.52, -0.52).normalize();
const sun = new B.DirectionalLight('sun', SUN_DIR.clone(), game);
sun.position = new B.Vector3((W * CELL) / 2, 0, (H * CELL) / 2).subtract(SUN_DIR.scale(110));
sun.intensity = 5.5;
sun.diffuse = C3('#ffe4c0');
sun.specular = C3('#fff0dc');
envTex(game);
let shadowGen = null;
function setupShadows() {
  if (shadowGen) {
    shadowGen.dispose();
    shadowGen = null;
  }
  if (QL() <= 1) return;
  const hi = QL() === 3;
  /* (área mapa) mapa maior: as manchas de sol que entram pelas janelas precisam de borda definida (média 2048 ≈ 7 cm/texel, alta 4096) */
  shadowGen = new B.ShadowGenerator(hi ? 2048 : 1536, sun);
  shadowGen.usePercentageCloserFiltering = true;
  shadowGen.filteringQuality = hi
    ? B.ShadowGenerator.QUALITY_MEDIUM
    : B.ShadowGenerator.QUALITY_LOW;
  shadowGen.bias = 0.0006;
  shadowGen.normalBias = 0.015;
  shadowGen.darkness = 0;
  for (const m of shadowCasters) shadowGen.addShadowCaster(m, true);
  /* enquadramento do sol calculado uma vez e congelado: sombras não "nadam" quando algo se mexe */
  sun.autoUpdateExtends = true;
  game.onAfterRenderObservable.addOnce(() => {
    sun.autoUpdateExtends = false;
  });
}
const shadowCasters = [];
const caster = (m) => {
  shadowCasters.push(m);
  m.receiveShadows = true;
  return m;
};

/* ---------- look map (luz das luminárias + AO + céu) ---------- */
const LK = {
  res: 4,
  tex: null,
  lamps:
    [] /* amb/refl: fração do IBL dentro do prédio; out: fração do IBL difuso fora (o sol domina) */,
  amb: 0.4,
  refl: 0.42,
  spec: 1.2,
  out: 0.45,
  tint: C3('#ffe6c8'),
  lamp: C3('#ffe2bf'),
  lampI: 3.4,
}; /* tint = rebatimento quente; lamp/lampI = luminárias */
function lookLamps() {
  LK.lamps = [];
  for (let z = BZ0 + 2; z < BZ1; z += 3)
    for (let x = BX0 + 2; x < BX1; x += 3) if (cellAt(x, z) === 0) LK.lamps.push([cc(x), cc(z)]);
}
function lookTex(d, TW, TH) {
  LK.data = d;
  LK.tw = TW;
  LK.th = TH;
  LK.tex = new B.RawTexture(
    d,
    TW,
    TH,
    B.Constants.TEXTUREFORMAT_RGBA,
    game,
    false,
    false,
    B.Texture.BILINEAR_SAMPLINGMODE
  );
  LK.tex.wrapU = LK.tex.wrapV = B.Texture.CLAMP_ADDRESSMODE;
  LK.tex.name = 'lookMap';
}
function buildLookMap() {
  const R = LK.res,
    TW = W * CELL * R,
    TH = H * CELL * R,
    N = TW * TH;
  /* v4: o resultado (só depende do mapa e deste código) vai para o cache persistente do boot */
  const ck = PCC
    ? 'look:' +
      PCBOOT.hash(
        [buildLookMap, lookLamps].map(String).join('|') +
          JSON.stringify(grid) +
          JSON.stringify(ORI) +
          JSON.stringify(WINS.map((w) => [w.x, w.z, w.nx, w.nz])) +
          [R, WALL_H, WIN_HW, BX0, BX1, BZ0, BZ1, CELL].join()
      )
    : '';
  const hit = PCC && PCC.get(ck);
  if (hit && hit.length === N * 4) {
    lookLamps();
    lookTex(hit, TW, TH);
    return;
  }
  const occ = new Uint8Array(N);
  for (let j = 0; j < TH; j++)
    for (let i = 0; i < TW; i++) {
      const x = (i + 0.5) / R,
        z = (j + 0.5) / R,
        cx = Math.floor(x / CELL),
        cz = Math.floor(z / CELL),
        c = cellAt(cx, cz),
        lx = x - cc(cx),
        lz = z - cc(cz);
      let o = 0;
      if (c === 1) {
        o = 1;
        const wn = winAt(cx, cz);
        if (wn && Math.abs(wn.nx ? lz : lx) < WIN_HW) o = 4;
      } else if (c === 3 || c === 4) {
        const d = ORI[cz][cx] === 'x' ? Math.abs(lx) : Math.abs(lz);
        if (d < 0.22) o = c === 3 ? 1 : 3;
      } else if (c === 2 && Math.max(Math.abs(lx), Math.abs(lz)) < CELL * 0.46) o = 2;
      occ[j * TW + i] = o;
    }
  const inB = (x, z) =>
    x >= BX0 * CELL && x < (BX1 + 1) * CELL && z >= BZ0 * CELL && z < (BZ1 + 1) * CELL;
  const lamp = new Float32Array(N),
    ao = new Float32Array(N).fill(1),
    aoW = new Float32Array(N).fill(1),
    sky = new Float32Array(N);
  /* AO: 8 direções, distância até o primeiro obstáculo (paredes e caixas) */
  const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [0.707, 0.707],
      [-0.707, 0.707],
      [0.707, -0.707],
      [-0.707, -0.707],
    ],
    MAXD = 1.6,
    ST = 0.2;
  for (let j = 0; j < TH; j++)
    for (let i = 0; i < TW; i++) {
      const k = j * TW + i;
      if (occ[k] === 1 || occ[k] === 2 || occ[k] === 4) {
        ao[k] = 0.6;
        continue;
      }
      let s = 0;
      for (const [dx, dz] of dirs) {
        let d = ST,
          hit = MAXD;
        for (; d <= MAXD; d += ST) {
          const ii = Math.floor(i + dx * d * R),
            jj = Math.floor(j + dz * d * R);
          if (ii < 0 || jj < 0 || ii >= TW || jj >= TH) break;
          const o = occ[jj * TW + ii];
          if (o === 1 || o === 2 || o === 3 || o === 4) {
            hit = d;
            break;
          }
        }
        s += Math.pow(hit / MAXD, 0.7);
      }
      ao[k] = Math.pow(s / 8, 1.6);
    }
  /* AO só das paredes (canal A): usado no forro e no alto das paredes — caixas e móveis não escurecem o teto */
  for (let j = 0; j < TH; j++)
    for (let i = 0; i < TW; i++) {
      const k = j * TW + i;
      if (occ[k] === 1 || occ[k] === 4) {
        aoW[k] = 0.6;
        continue;
      }
      let s = 0;
      for (const [dx, dz] of dirs) {
        let d = ST,
          hit = MAXD;
        for (; d <= MAXD; d += ST) {
          const ii = Math.floor(i + dx * d * R),
            jj = Math.floor(j + dz * d * R);
          if (ii < 0 || jj < 0 || ii >= TW || jj >= TH) break;
          if (occ[jj * TW + ii] === 1 || occ[jj * TW + ii] === 4) {
            hit = d;
            break;
          }
        }
        s += Math.pow(hit / MAXD, 0.7);
      }
      aoW[k] = Math.pow(s / 8, 1.2);
    }
  /* luminárias: mesma grade do 11-world (a cada 3 células); luz com visada (paredes bloqueiam, barricada passa 30%) */
  lookLamps();
  const RAD = 10,
    h = WALL_H - 0.1;
  for (const [lx, lz] of LK.lamps) {
    const i0 = Math.max(0, Math.floor((lx - RAD) * R)),
      i1 = Math.min(TW - 1, Math.ceil((lx + RAD) * R)),
      j0 = Math.max(0, Math.floor((lz - RAD) * R)),
      j1 = Math.min(TH - 1, Math.ceil((lz + RAD) * R));
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        const k = j * TW + i;
        if (occ[k] === 1 || occ[k] === 4) continue;
        const x = (i + 0.5) / R,
          z = (j + 0.5) / R,
          dx = x - lx,
          dz = z - lz,
          r2 = dx * dx + dz * dz;
        if (r2 > RAD * RAD) continue;
        const d = Math.sqrt(r2),
          n = Math.ceil(d / 0.2);
        let vis = 1;
        for (let s = 1; s < n; s++) {
          const t = s / n,
            o = occ[Math.floor((lz + dz * t) * R) * TW + Math.floor((lx + dx * t) * R)];
          if (o === 1 || o === 4) {
            vis = 0;
            break;
          }
          if (o === 3) vis *= 0.82;
        }
        if (vis <= 0) continue;
        const phys = (h * h * h) / Math.pow(h * h + r2, 1.5),
          cone = Math.exp(-r2 / (2 * 1.1 * 1.1)),
          fill = Math.exp(-d / 4.5);
        lamp[k] += vis * (0.7 * cone + 0.22 * phys + 0.16 * fill);
      }
  } /* fill = rebatimento do cômodo (alcança paredes) */
  /* céu: difusão a 2 texels/m a partir de fora do prédio; paredes isolam, barricadas deixam passar um pouco */
  {
    const r = 2,
      tw = W * CELL * r,
      th = H * CELL * r,
      a = new Float32Array(tw * th),
      b = new Float32Array(tw * th),
      oc = new Uint8Array(tw * th),
      out = new Uint8Array(tw * th);
    for (let j = 0; j < th; j++)
      for (let i = 0; i < tw; i++) {
        const k = j * tw + i,
          x = (i + 0.5) / r,
          z = (j + 0.5) / r;
        oc[k] = occ[Math.floor(z * R) * TW + Math.floor(x * R)];
        out[k] = inB(x, z) ? 0 : 1;
        a[k] = out[k];
      }
    for (let it = 0; it < 140; it++) {
      for (let j = 1; j < th - 1; j++)
        for (let i = 1; i < tw - 1; i++) {
          const k = j * tw + i;
          if (out[k]) {
            b[k] = 1;
            continue;
          }
          if (oc[k] === 1) {
            b[k] = 0;
            continue;
          }
          let s = 0,
            w = 0;
          for (const kk of [k - 1, k + 1, k - tw, k + tw]) {
            const o = oc[kk];
            if (o === 1) continue;
            const f = o === 3 ? 0.35 : o === 4 ? 0.7 : 1;
            s += a[kk] * f;
            w += 1;
          }
          b[k] = w ? (s / w) * 0.985 : 0;
        }
      a.set(b);
    }
    for (let j = 0; j < TH; j++)
      for (let i = 0; i < TW; i++) {
        const x = (i + 0.5) / R,
          z = (j + 0.5) / R;
        sky[j * TW + i] = inB(x, z)
          ? Math.min(
              1,
              a[Math.min(th - 1, Math.floor(z * r)) * tw + Math.min(tw - 1, Math.floor(x * r))] *
                1.6
            )
          : 1;
      }
  }
  const d = new Uint8Array(N * 4);
  for (let k = 0; k < N; k++) {
    const x = ((k % TW) + 0.5) / R,
      z = (((k / TW) | 0) + 0.5) / R,
      ins = inB(x, z);
    d[k * 4] = Math.min(255, ins ? (lamp[k] / 2.2) * 255 : 0);
    d[k * 4 + 1] = ao[k] * 255;
    d[k * 4 + 2] = sky[k] * 255;
    d[k * 4 + 3] = aoW[k] * 255;
  }
  lookTex(d, TW, TH);
  if (PCC) PCC.put(ck, d);
}
prof('lookmap', buildLookMap);
class LookPlugin extends B.MaterialPluginBase {
  constructor(m) {
    super(m, 'Look', 210, { LOOK: false, LOOK_WUV: false });
    this.on = m.getScene() === game;
    this.wuv = null;
    this._enable(this.on);
  }
  prepareDefines(d) {
    d.LOOK = this.on && !!LK.tex;
    d.LOOK_WUV = this.on && !!this.wuv;
  }
  getClassName() {
    return 'LookPlugin';
  }
  isReadyForSubMesh() {
    return !LK.tex || LK.tex.isReady();
  }
  getSamplers(s) {
    s.push('lookMap');
  }
  getUniforms() {
    return {
      ubo: [
        { name: 'lookP', size: 4, type: 'vec4' },
        { name: 'lookA', size: 4, type: 'vec4' },
        { name: 'lookC', size: 4, type: 'vec4' },
        { name: 'lookL', size: 4, type: 'vec4' },
        { name: 'lookT', size: 4, type: 'vec4' },
      ],
      vertex: 'uniform vec4 lookT;\n',
      fragment:
        'uniform vec4 lookP;\nuniform vec4 lookA;\nuniform vec4 lookC;\nuniform vec4 lookL;\n',
    };
  }
  bindForSubMesh(ubo) {
    if (!this.on || !LK.tex) return;
    ubo.updateFloat4('lookP', 1 / (W * CELL), 1 / (H * CELL), WALL_H + 0.05, QL() <= 1 ? 1 : 0);
    ubo.updateFloat4('lookC', LK.amb, LK.refl, LK.spec, LK.out);
    ubo.updateFloat4('lookA', LK.tint.r, LK.tint.g, LK.tint.b, 0);
    ubo.updateFloat4('lookL', LK.lamp.r, LK.lamp.g, LK.lamp.b, LK.lampI);
    const t = this.wuv || [1, 1];
    ubo.updateFloat4('lookT', t[0], t[1], 0, 0);
    ubo.setTexture('lookMap', LK.tex);
  }
  getCustomCode(type, lang) {
    if (lang === 1) return null; /* só GLSL (WebGL) */
    if (type === 'vertex')
      return {
        CUSTOM_VERTEX_UPDATE_WORLDPOS: `
#ifdef LOOK_WUV
{vec3 lkn=abs(vNormalW);vec2 lkw=lkn.y>.6?worldPos.xz:(lkn.x>lkn.z?worldPos.zy:worldPos.xy);uvUpdated=lkw*lookT.xy;}
#endif
`,
      };
    return {
      CUSTOM_FRAGMENT_DEFINITIONS: `
#ifdef LOOK
uniform sampler2D lookMap;
#endif
`,
      CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION: `
#ifdef LOOK
{vec3 lkN=normalize(vNormalW);vec4 lk=texture2D(lookMap,(vPositionW.xz+lkN.xz*.4)*lookP.xy);float lky=vPositionW.y;
float lkOut=max(lk.b,step(lookP.z,lky));
float lkAo=mix(lk.g,1.,smoothstep(0.,1.2,lky))*mix(mix(lk.a,1.,smoothstep(0.,.8,lookP.z-.05-lky)),1.,lkOut);
#ifdef REFLECTION
finalIrradiance*=mix(lookC.x*lookA.rgb,vec3(lookC.w),lkOut)*lkAo;finalRadianceScaled*=mix(lookC.y,1.,lkOut)*mix(1.,lkAo,.7);
#endif
finalDiffuse*=mix(1.,lkOut,lookP.w);
finalDiffuse+=surfaceAlbedo.rgb*lookL.rgb*(lk.r*lookL.a*mix(.55,1.,clamp(lkN.y*.5+.5,0.,1.))*lkAo*(1.-lkOut));
/* reflexo das luminárias em pisos lisos: o raio refletido sobe até o forro e lê a luz das luminárias ali (1 leitura extra, só em pisos) */
vec3 lkV=normalize(vEyePosition.xyz-vPositionW);vec3 lkR=reflect(-lkV,normalW);
if(lkN.y>.6&&lkR.y>.05&&lkOut<.5){vec2 lkP=vPositionW.xz+lkR.xz*((lookP.z-.1-lky)/lkR.y);float lr=texture2D(lookMap,lkP*lookP.xy).r*2.2;
float lsm=1.-reflectivityOut.roughness;lsm*=lsm;float lf=.04+.96*pow(1.-max(dot(normalW,lkV),0.),5.);
finalDiffuse+=lookL.rgb*(lr*lr*lr*lookL.a*lsm*lf*lookC.z*(1.-lkOut));}}
#endif
`,
    };
  }
}
B.RegisterMaterialPlugin('Look', (m) => (m instanceof B.PBRMaterial ? new LookPlugin(m) : null));
/* coordenadas de textura no espaço do mundo (projeção por eixo dominante): su = 1/largura do tile, sv = 1/altura */
function lookWUV(m, su, sv) {
  const p = m.pluginManager && m.pluginManager.getPlugin('Look');
  if (p) {
    p.wuv = [su, sv == null ? su : sv];
    p.markAllDefinesAsDirty();
  }
  return m;
}

/* pós-processamento: tons ACES, curva quente, contraste, bloom, FXAA; nitidez e SSAO só na alta (média = barato) */
let pipeline = null;
function setupPipeline() {
  if (pipeline) {
    pipeline.dispose();
    pipeline = null;
  }
  if (window.__ssao) {
    window.__ssao.dispose();
    window.__ssao = null;
  }
  if (game.geometryBufferRenderer) game.disableGeometryBufferRenderer();
  const q = QL() === 3 ? 'high' : QL() === 2 ? 'medium' : 'low';
  if (QL() === 0) {
    const c = game.imageProcessingConfiguration;
    c.toneMappingEnabled = true;
    c.toneMappingType = B.ImageProcessingConfiguration.TONEMAPPING_ACES;
    c.exposure = 1.25;
    c.contrast = 1.18;
    return;
  } /* mínima: sem pós-processo, só o tonemap nos materiais */
  /* beta.8: sem SSAO. Ele desenha a cena inteira de novo (buffer de normais), borra o chão e pintou a arma com as normais em alguns aparelhos. A oclusão já vem pronta no mapa de luz (18-look). */
  pipeline = new B.DefaultRenderingPipeline('pp', true, game, [camera]);
  /* MSAA de verdade (não borra a textura como o FXAA); o FXAA só entra se o aparelho não tiver MSAA */
  {
    const mx = (engine.getCaps && engine.getCaps().maxMSAASamples) || 1,
      ms = Math.min(mx, q === 'high' ? 4 : q === 'medium' ? 2 : 1);
    pipeline.samples = ms;
    pipeline.fxaaEnabled = ms < 2 && QL() >= 2;
  }
  pipeline.imageProcessingEnabled = true;
  const ip = pipeline.imageProcessing;
  ip.toneMappingEnabled = true;
  ip.toneMappingType = B.ImageProcessingConfiguration.TONEMAPPING_ACES;
  ip.exposure = 1.25;
  ip.contrast = 1.18;
  ip.vignetteEnabled = q !== 'low';
  ip.vignetteWeight = 1.4;
  ip.vignetteColor = new B.Color4(0, 0, 0, 0);
  if (q !== 'low') {
    ip.colorCurvesEnabled = true;
    const cc = new B.ColorCurves();
    cc.globalHue = 35;
    cc.globalDensity = 12;
    cc.globalSaturation = 8;
    cc.shadowsHue = 200;
    cc.shadowsDensity = 8;
    cc.highlightsHue = 40;
    cc.highlightsDensity = 10;
    ip.colorCurves = cc;
  }
  pipeline.sharpenEnabled = q === 'high';
  if (pipeline.sharpenEnabled) {
    pipeline.sharpen.edgeAmount = 0.3;
    pipeline.sharpen.colorAmount = 1;
  }
  pipeline.bloomEnabled = q !== 'low';
  if (pipeline.bloomEnabled) {
    pipeline.bloomThreshold = 1.1;
    pipeline.bloomWeight = q === 'high' ? 0.25 : 0.22;
    pipeline.bloomKernel = q === 'high' ? 20 : 16;
    pipeline.bloomScale = q === 'high' ? 0.5 : 0.2;
  }
}
