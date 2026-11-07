// @ts-check
/* =====================================================================
   PONTO CEGO v4 — CARREGADOR (boot)
   O HTML traz "pacotes" em <script type="application/x-pc"> (base64, já
   comprimidos com deflate quando compensa). Este carregador:
     1. decodifica base64 de forma nativa (Uint8Array.fromBase64 / atob);
     2. descomprime com DecompressionStream('deflate-raw') (nativo, rápido);
     3. avalia as bibliotecas na ordem (Babylon, GUI, glTF, meshopt, Havok…);
     4. inicializa o Havok (WASM embutido) e expõe os assets;
     5. avalia o jogo e esconde a tela de carregamento quando os modelos
        estiverem prontos. Progresso real (bytes processados) e tempos em
        window.__pcBoot.
   Contrato dos assets (inalterado): ASSET_GLB[nome] e ASSET_FILE['nome.ext']
   são strings base64. Novo (mais rápido, sem cópia): ASSET_BYTES('nome.ext')
   → Uint8Array, assetURL('nome.ext', mime) → blob: URL.
   ===================================================================== */

/** @typedef {{id:string,name:string,kind:'js'|'bin',z:boolean,raw:number,b64:number,asset?:'glb'|'file'}} PackInfo */

/** @type {any} */
const W = window;
const t0 = performance.now();
/** @type {Record<string, number>} */
const T = {};
const mark = (/** @type {string} */ k) => {
  T[k] = Math.round(performance.now() - t0);
};
const boot = (W.__pcBoot = {
  t: T,
  bytes: 0,
  raw: 0,
  packs: 0,
  errors: /** @type {string[]} */ ([]),
  done: false,
  havok: false,
  cache: /** @type {any} */ (null),
});

/* ---------- tela de carregamento ---------- */
const ui = {
  root: /** @type {HTMLElement|null} */ (document.getElementById('pc-load')),
  bar: /** @type {HTMLElement|null} */ (document.getElementById('pc-load-bar')),
  stage: /** @type {HTMLElement|null} */ (document.getElementById('pc-load-stage')),
  pct: /** @type {HTMLElement|null} */ (document.getElementById('pc-load-pct')),
};
let shown = 0;
/** @param {string} stage @param {number} frac 0..1 */
function progress(stage, frac) {
  shown = Math.max(shown, Math.min(1, frac));
  if (ui.bar) ui.bar.style.transform = `scaleX(${shown.toFixed(4)})`;
  if (ui.stage) ui.stage.textContent = stage;
  if (ui.pct) ui.pct.textContent = Math.round(shown * 100) + '%';
}
/** @param {string} msg */
function fail(msg) {
  boot.errors.push(msg);
  if (ui.stage) {
    ui.stage.textContent = msg;
    ui.stage.style.color = '#e24b3b';
  }
  console.error('[boot]', msg);
}
const frame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

/* ---------- base64 e descompressão ---------- */
/** @param {string} s @returns {Uint8Array} */
function fromB64(s) {
  const U = /** @type {any} */ (Uint8Array);
  if (typeof U.fromBase64 === 'function') return U.fromBase64(s);
  const bin = atob(s),
    n = bin.length,
    u = new Uint8Array(n);
  for (let i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
  return u;
}
/** @param {Uint8Array} u @returns {string} */
function toB64(u) {
  const a = /** @type {any} */ (u);
  if (typeof a.toBase64 === 'function') return a.toBase64();
  let s = '';
  for (let i = 0; i < u.length; i += 0x8000)
    s += String.fromCharCode.apply(null, /** @type {any} */ (u.subarray(i, i + 0x8000)));
  return btoa(s);
}
/** @param {Uint8Array} u @returns {Promise<Uint8Array>} */
async function inflate(u) {
  const ds = new DecompressionStream('deflate-raw');
  const buf = await new Response(
    new Blob([/** @type {BlobPart} */ (u)]).stream().pipeThrough(ds)
  ).arrayBuffer();
  return new Uint8Array(buf);
}

/* ---------- registro de assets (contrato ASSET_GLB / ASSET_FILE) ---------- */
/** @type {Map<string,{b64?:string,bytes?:Uint8Array}>} */
const STORE = new Map();
const ASSET_GLB = {},
  ASSET_FILE = {};
/** @param {string} file @returns {Uint8Array|null} */
function ASSET_BYTES(file) {
  const e = STORE.get(file);
  if (!e) return null;
  if (!e.bytes && e.b64 != null) e.bytes = fromB64(e.b64);
  return e.bytes || null;
}
/** @param {string} file @returns {string|undefined} */
function assetB64(file) {
  const e = STORE.get(file);
  if (!e) return undefined;
  if (e.b64 == null && e.bytes) e.b64 = toB64(e.bytes);
  return e.b64;
}
/** @type {Record<string,string>} */
const URLS = {};
/** @param {string} file @param {string=} mime */
function assetURL(file, mime) {
  if (URLS[file]) return URLS[file];
  const b = ASSET_BYTES(file);
  if (!b) return null;
  return (URLS[file] = URL.createObjectURL(
    new Blob([/** @type {BlobPart} */ (b)], { type: mime || 'application/octet-stream' })
  ));
}
/** @param {string} file @param {{b64?:string,bytes?:Uint8Array}} entry @param {'glb'|'file'} kind */
function registerAsset(file, entry, kind) {
  STORE.set(file, entry);
  if (kind === 'glb') {
    const key = file.replace(/\.glb$/i, '');
    Object.defineProperty(ASSET_GLB, key, {
      enumerable: true,
      configurable: true,
      get: () => assetB64(file),
    });
  } else {
    Object.defineProperty(ASSET_FILE, file, {
      enumerable: true,
      configurable: true,
      get: () => assetB64(file),
    });
  }
}
Object.assign(W, {
  ASSET_GLB,
  ASSET_FILE,
  ASSET_BYTES,
  assetURL,
  PCBOOT: { progress, fromB64, toB64, inflate, mark, boot },
});

/* ---------- cache persistente (IndexedDB) de dados gerados na carga ----------
   O jogo gera texturas PBR procedurais e o "look map" da luz em JS (segundos em PC lento). O resultado vai para o
   IndexedDB com chave = hash do código gerador; na próxima abertura o boot pré-carrega tudo (assíncrono) e o jogo
   lê sincronamente com PCBOOT.cache.get(chave). Código mudou → chave muda → regenera. Entradas não usadas na sessão
   são apagadas. Sem IndexedDB (modo privado etc.) o jogo só gera de novo. */
/** @type {Array<[string,Uint8Array]>} */
const PENDING = [];
const CACHE = {
  map: /** @type {Map<string,Uint8Array>} */ (new Map()),
  used: /** @type {Set<string>} */ (new Set()),
  ok: false,
  hits: 0,
  miss: 0,
  bytes: 0,
  db: /** @type {IDBDatabase|null} */ (null),
  pending: PENDING,
  /** @param {string} k */
  get(k) {
    this.used.add(k);
    const v = this.map.get(k);
    if (v) this.hits++;
    else this.miss++;
    return v;
  },
  /** @param {string} k @param {Uint8Array} v */
  put(k, v) {
    this.used.add(k);
    this.map.set(k, v);
    this.pending.push([k, v]);
  },
  /** grava o que foi gerado e remove o que não foi usado (chamado depois da carga) */
  flush() {
    const db = this.db;
    if (!db) return;
    try {
      const tx = db.transaction('kv', 'readwrite'),
        st = tx.objectStore('kv');
      for (const [k, v] of this.pending) st.put(v, k);
      this.pending.length = 0;
      for (const k of this.map.keys())
        if (!this.used.has(k)) {
          st.delete(k);
          this.map.delete(k);
        }
    } catch (e) {
      boot.errors.push('cache ' + e);
    }
  },
};
/** @param {string} s FNV-1a 32 bits em hexadecimal */
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16);
}
/** @returns {Promise<void>} */
function cacheOpen() {
  return new Promise((res) => {
    let done = false;
    const fin = () => {
      if (!done) {
        done = true;
        res();
      }
    };
    setTimeout(fin, 1500); /* IndexedDB travado/lento: segue sem cache */
    try {
      const rq = indexedDB.open('pontocego-cache', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
      rq.onerror = fin;
      rq.onsuccess = () => {
        const db = rq.result;
        CACHE.db = db;
        try {
          const st = db.transaction('kv', 'readonly').objectStore('kv'),
            ks = st.getAllKeys(),
            vs = st.getAll();
          vs.onsuccess = () => {
            const K = ks.result,
              V = vs.result;
            for (let i = 0; i < K.length; i++)
              if (V[i] instanceof Uint8Array) {
                CACHE.map.set(String(K[i]), V[i]);
                CACHE.bytes += V[i].length;
              }
            CACHE.ok = true;
            fin();
          };
          vs.onerror = fin;
        } catch (e) {
          fin();
        }
      };
    } catch (e) {
      fin();
    }
  });
}
W.PCBOOT.cache = CACHE;
W.PCBOOT.hash = hash;

/** @param {string} code @param {string} name */
function evalScript(code, name) {
  // eval indireto = escopo global (igual a <script> clássico); sourceURL dá nome/linhas nos erros
  (0, eval)(code + '\n//# sourceURL=pc://' + name);
}

/* ---------- sequência ---------- */
/**
 * Confere o que o jogo precisa antes de descompactar 20 MB. Devolve o motivo em português
 * (ou null se está tudo certo), para o jogador saber o que ligar em vez de ver uma tela parada.
 * @returns {string|null}
 */
function checkBrowser() {
  if (typeof DecompressionStream === 'undefined' || typeof WebAssembly === 'undefined')
    return 'Navegador antigo demais. O jogo precisa de Firefox 113 ou mais novo, Chrome ou Edge 100 ou mais novo.';
  try {
    (0, eval)('0');
  } catch (e) {
    return 'Uma extensão (NoScript, por exemplo) ou uma regra de segurança bloqueou o código do jogo. Libere esta página e recarregue.';
  }
  let gl = null;
  try {
    gl = document.createElement('canvas').getContext('webgl2');
  } catch (e) {}
  if (!gl)
    return 'O WebGL2 está desligado ou bloqueado. Ative a aceleração por hardware, desligue a proteção contra rastreamento de impressão digital (resistFingerprinting) ou use Chrome ou Edge. Teste em get.webgl.org.';
  return null;
}

async function main() {
  const why = checkBrowser();
  if (why) {
    fail(why);
    return;
  }
  const man = /** @type {PackInfo[]} */ (
    JSON.parse(
      (document.getElementById('pc-manifest') || { textContent: '[]' }).textContent || '[]'
    )
  );
  const total = man.reduce((s, p) => s + p.b64, 0) || 1;
  let doneB = 0;
  progress('Descompactando…', 0);
  await frame();
  /* decodifica tudo em paralelo (DecompressionStream roda fora da thread principal), avalia JS na ordem */
  /** @type {Promise<Uint8Array|string>[]} */
  const jobs = man.map(async (p) => {
    const el = document.getElementById(p.id);
    if (!el) throw new Error('pacote ausente: ' + p.name);
    const txt = el.textContent || '';
    el.remove();
    let out;
    if (!p.z && p.kind === 'bin')
      out = txt; /* base64 já é o formato do contrato: decodifica só se pedirem bytes */
    else {
      const u = fromB64(txt);
      out = p.z ? await inflate(u) : u;
    }
    doneB += p.b64;
    boot.bytes += p.b64;
    boot.raw += p.raw;
    boot.packs++;
    progress('Descompactando ' + p.name + '…', (0.55 * doneB) / total);
    return out;
  });
  const cacheJob = cacheOpen();
  const results = await Promise.all(jobs);
  await cacheJob;
  mark('decode');
  const dec = new TextDecoder();
  let havokWasm = /** @type {Uint8Array|null} */ (null);
  for (let i = 0; i < man.length; i++) {
    const p = man[i],
      r = results[i];
    if (p.kind === 'js') {
      progress('Iniciando ' + p.name + '…', 0.55 + 0.2 * (i / man.length));
      await frame();
      evalScript(typeof r === 'string' ? r : dec.decode(r), p.name);
    } else if (p.name === 'HavokPhysics.wasm') havokWasm = /** @type {Uint8Array} */ (r);
    else if (p.asset)
      registerAsset(p.name, typeof r === 'string' ? { b64: r } : { bytes: r }, p.asset);
  }
  mark('libs');
  /* meshopt (EXT_meshopt_compression): o decodificador já está embutido; o Babylon normalmente baixaria o script e
     criaria workers — aqui decodifica direto na thread principal (síncrono, ~1 GB/s; workers em blob eram lentos para subir) */
  try {
    const B = W.BABYLON,
      MD = W.MeshoptDecoder;
    if (MD && B && B.MeshoptCompression) {
      B.MeshoptCompression.Configuration.decoder.url = URL.createObjectURL(
        new Blob(['/* meshopt embutido */'], { type: 'text/javascript' })
      );
      B.MeshoptCompression._Default = {
        /** @param {Uint8Array} source @param {number} count @param {number} stride @param {string} mode @param {string} filter */
        async decodeGltfBufferAsync(source, count, stride, mode, filter) {
          await MD.ready;
          const out = new Uint8Array(count * stride);
          MD.decodeGltfBuffer(out, count, stride, source, mode, filter);
          return out;
        },
        dispose() {
          /* nada */
        },
      };
    }
  } catch (e) {
    boot.errors.push('meshopt ' + e);
  }
  /* Havok (WASM embutido) */
  if (havokWasm && typeof W.HavokPhysics === 'function') {
    progress('Iniciando física (Havok)…', 0.78);
    await frame();
    try {
      W.PC_HAVOK = await W.HavokPhysics({ wasmBinary: havokWasm });
      boot.havok = true;
    } catch (e) {
      boot.errors.push('havok ' + e);
      W.PC_HAVOK = null;
    }
  }
  mark('havok');
  progress('Gerando mapa, texturas e luz…', 0.82);
  await frame();
  try {
    await Promise.race([
      Promise.all(
        [
          '700 20px "Barlow Condensed"',
          '600 20px "Barlow Condensed"',
          '500 20px "Barlow Condensed"',
          '400 14px Barlow',
          '600 14px Barlow',
          '700 20px "Big Shoulders Stencil Display"',
        ].map((f) => document.fonts.load(f))
      ),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  } catch (e) {
    /* segue com a fonte reserva */
  }
  const game = W.__PC_GAME_SRC;
  delete W.__PC_GAME_SRC;
  if (typeof game === 'function') game();
  mark('game');
  boot.cache = { hits: CACHE.hits, miss: CACHE.miss, MB: +(CACHE.bytes / 1048576).toFixed(1) };
  setTimeout(() => CACHE.flush(), 3000);
  boot.done = true;
  progress('Carregando modelos…', 0.92);
  /* esconde quando os modelos .glb terminarem (ou falharem) — no máx. 30 s */
  const until = performance.now() + 30000;
  const tick = () => {
    const A = W.__pcAssets && W.__pcAssets();
    if ((A && (A.ready || A.failed)) || performance.now() > until) {
      mark('assets');
      progress('Pronto', 1);
      if (ui.root) {
        ui.root.style.opacity = '0';
        setTimeout(() => ui.root && ui.root.remove(), 450);
      }
      return;
    }
    setTimeout(tick, 50);
  };
  tick();
}
main().catch((e) => fail('Erro ao carregar: ' + (e && e.message ? e.message : e)));
