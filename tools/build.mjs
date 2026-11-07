// @ts-check
/* =====================================================================
   BUILD v4 (Node + esbuild)  —  node tools/build.mjs [--test] [--fast]
   Saídas: dist/PontoCego.html (um arquivo, offline), dist/test.html (com
   window.__pc para os testes), dist/game.js (código legado concatenado,
   para depuração) e dist/build-report.json (tamanhos e tempos).
   - src/core/*.js: módulos ES (// @ts-check) → esbuild → window.PCCORE
   - src/boot/boot.js: carregador (descompressão + progresso) → inline
   - src/{sim,render,ui,main}: concatenados num escopo único, NA MESMA
     ORDEM de antes (contratos entre áreas inalterados); cada arquivo passa
     por checagem de sintaxe do esbuild (erro aponta arquivo:linha).
   - Bibliotecas e assets viram pacotes base64; comprimidos com deflate
     (raw) quando isso economiza ≥ 8 %. O navegador abre com
     DecompressionStream (nativo).
   - Assets: assets/*.glb → ASSET_GLB[nome]; outros arquivos de assets/ →
     ASSET_FILE['nome.ext'] (contrato inalterado; ver src/boot/boot.js).
   ===================================================================== */
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = new Set(process.argv.slice(2));
const TEST = argv.has('--test'), FAST = argv.has('--fast');
const t0 = Date.now();
let LIB = path.join(ROOT, 'node_modules');
if (!fs.existsSync(path.join(LIB, 'babylonjs'))) { console.error('Faltam as dependências. Rode: npm install'); process.exit(1); }
const rd = (/** @type {string} */ p) => fs.readFileSync(p);
const rdt = (/** @type {string} */ p) => fs.readFileSync(p, 'utf8');

/* ---------- 1. código legado (escopo único) ---------- */
const ORDER = ['src/sim', 'src/render', 'src/ui', 'src/main'];
const files = ORDER.flatMap((d) => fs.readdirSync(path.join(ROOT, d)).filter((f) => f.endsWith('.js')).sort().map((f) => path.join(d, f)));
let bad = 0;
const parts = files.map((f) => {
  const code = rdt(path.join(ROOT, f));
  try { esbuild.transformSync(code, { loader: 'js', logLevel: 'silent' }); }
  catch (e) {
    bad++;
    for (const m of /** @type {any} */ (e).errors || []) console.error(`ERRO de sintaxe em ${f}:${m.location ? m.location.line + ':' + m.location.column : ''} ${m.text}`);
  }
  return code;
});
if (bad) { console.error('build abortada:', bad, 'arquivo(s) com erro'); process.exit(1); }
const game = parts.join('\n');
const TESTHOOK = `
window.__pc={fpvClips,FPV_CLS,ON,MP,onlineConnect,onlineSearch,onlineSendJSON,me:()=>player,setDiff:k=>{SAVE.diff=k;DIFF=DIFFS[k];},LA,lobbyLive,updateShowroom,updateHUD,dirFrom,addProp,projectiles,HOOK,useGadget,flashBang,PROPS,FLOW,LB,flowStart,flowBan,flowRound,nextRoleOf,toMenu,showBanner,matchOver,teams,boardRows:()=>boardRows(false),WG,buildGadget,game,WMOD,show,setArs:i=>{arsW=i;},setYaw:y=>{showYaw=y;},freezeShow:()=>{dragging=true;},uiLobby,lobby,buildWeapon,PHOTO_D,PHOTO_DONE,SURF_C,WM,WREAL,FPV,FPV_CLIPS,skinThumb,SKINS,flowStart,flowMap,flowOps,flowSpawn,flowGo,FLOW,endRound,isPaused:()=>paused,sceneIs:()=>({game:typeof game!=="undefined"&&0}),G,agents,player,teams,AI,simStep,SIM_DT,INPUT,newMatch,startMatch,HUD,game,lobby,camera,SAVE,renderMenu,engine,applyQuality,buildWeapon,buildCharacter,setCharWeapon,OPS,animChar,V3,WEAPONS,CH,ASSETS,buildGadget,VM,updateVM,wVariant,wBase,WLIST,drone,destroyDrone,camMode:()=>camMode,updateCamera,togglePause:()=>{},setMenuTab:t=>{menuTab=t;renderMenu();},
  PHYS,NET,netStep,captureCmd,applyCmd,encodeCmd,decodeCmd,snapshot,restoreSnapshot,ENGINE_INFO,WALLS,DOORS};
`;
/** @param {boolean} test */
const gameSrc = (test) => `window.__PC_GAME_SRC=function(){\n${game}\n${test ? TESTHOOK : ''}\n};`;

/* ---------- 2. núcleo (módulos ES) e carregador ---------- */
/** @param {string} entry @param {string|undefined} globalName @param {boolean} minify */
function bundle(entry, globalName, minify) {
  const r = esbuild.buildSync({ entryPoints: [path.join(ROOT, entry)], bundle: true, format: 'iife', globalName, target: 'es2020', write: false, minify, legalComments: 'none', logLevel: 'error' });
  return r.outputFiles[0].text;
}
/* eval indireto de código "use strict" não cria globais com var: publica explicitamente */
const core = bundle('src/core/index.js', 'PCCORE', false) + '\nglobalThis.PCCORE = PCCORE;\n';
const bootJs = bundle('src/boot/boot.js', undefined, true).replace(/<\/script/gi, '<\\/script');

/* ---------- 3. pacotes ---------- */
/** @typedef {{name:string, kind:'js'|'bin', data:Buffer, asset?:'glb'|'file'}} Pack */
/** @type {Pack[]} */
const packs = [
  { name: 'babylon.js', kind: 'js', data: rd(path.join(LIB, 'babylonjs/babylon.js')) },
  { name: 'babylon.gui.js', kind: 'js', data: rd(path.join(LIB, 'babylonjs-gui/babylon.gui.min.js')) },
  { name: 'babylon.glTF2FileLoader.js', kind: 'js', data: rd(path.join(LIB, 'babylonjs-loaders/babylon.glTF2FileLoader.min.js')) },
  { name: 'meshopt_decoder.js', kind: 'js', data: rd(path.join(LIB, 'meshoptimizer/meshopt_decoder.js')) },
  { name: 'HavokPhysics.js', kind: 'js', data: rd(path.join(LIB, '@babylonjs/havok/lib/umd/HavokPhysics_umd.js')) },
  { name: 'pc-core.js', kind: 'js', data: Buffer.from(core) },
  { name: 'game.js', kind: 'js', data: Buffer.from(gameSrc(false)) },
  { name: 'HavokPhysics.wasm', kind: 'bin', data: rd(path.join(LIB, '@babylonjs/havok/lib/umd/HavokPhysics.wasm')) },
];
const AD = path.join(ROOT, 'assets');
/* PC_EXTRA_ASSETS=dir (só para teste de carga): inclui também os arquivos dessa pasta; PC_OUT=nome muda o arquivo de saída */
const EXTRA = process.env.PC_EXTRA_ASSETS ? fs.readdirSync(process.env.PC_EXTRA_ASSETS).map((f) => path.join(/** @type {string} */ (process.env.PC_EXTRA_ASSETS), f)) : [];
for (const p of fs.readdirSync(AD).sort().map((f) => path.join(AD, f)).concat(EXTRA)) {
  const f = path.basename(p);
  if (!fs.statSync(p).isFile()) continue;
  packs.push({ name: f, kind: 'bin', data: rd(p), asset: f.toLowerCase().endsWith('.glb') ? 'glb' : 'file' });
}
/* compressão (cache por conteúdo: rebuilds rápidos quando só o jogo muda) */
const CACHE = path.join(ROOT, 'node_modules/.cache/pc-build');
fs.mkdirSync(CACHE, { recursive: true });
import crypto from 'node:crypto';
/** @param {Buffer} buf */
function deflate(buf) {
  const h = crypto.createHash('sha1').update(buf).update(FAST ? 'f' : 's').digest('hex');
  const cf = path.join(CACHE, h + '.z');
  if (fs.existsSync(cf)) return rd(cf);
  const z = zlib.deflateRawSync(buf, { level: FAST ? 6 : 9, memLevel: 9 });
  fs.writeFileSync(cf, z);
  return z;
}
/** @param {boolean} test */
function html(test) {
  const man = [], tags = [];
  let i = 0;
  for (const p of packs) {
    const data = p.name === 'game.js' ? Buffer.from(gameSrc(test)) : p.data;
    const z = deflate(data), use = z.length < data.length * 0.92;
    const b64 = (use ? z : data).toString('base64');
    const id = 'pc' + i++;
    man.push({ id, name: p.name, kind: p.kind, z: use, raw: data.length, b64: b64.length, ...(p.asset ? { asset: p.asset } : {}) });
    tags.push(`<script type="application/x-pc" id="${id}">${b64}</script>`);
  }
  const shell = rdt(path.join(ROOT, 'shell.html'));
  const out = shell.replace('/*FONTS*/', () => rdt(path.join(ROOT, 'assets_src/fonts.css'))).replace('/*MANIFEST*/', () => JSON.stringify(man)).replace('<!--PACKS-->', () => tags.join('\n')).replace('/*BOOT*/', () => bootJs);
  return { out, man };
}
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
const rel = html(false);
const OUT = process.env.PC_OUT;
if (OUT) fs.writeFileSync(path.join(ROOT, 'dist', OUT + '.html'), html(true).out);
else {
  fs.writeFileSync(path.join(ROOT, 'dist/PontoCego.html'), rel.out);
  fs.writeFileSync(path.join(ROOT, 'dist/game.js'), game);
  if (TEST) fs.writeFileSync(path.join(ROOT, 'dist/test.html'), html(true).out);
}
const KB = (/** @type {number} */ n) => Math.round(n / 1024);
const report = {
  version: '4.0.0', date: new Date().toISOString(), ms: Date.now() - t0, htmlKB: KB(rel.out.length),
  packs: rel.man.map((m) => ({ name: m.name, rawKB: KB(m.raw), htmlKB: KB(m.b64), z: m.z })),
};
fs.writeFileSync(path.join(ROOT, 'dist/build-report.json'), JSON.stringify(report, null, 1));
console.log('KB', report.htmlKB, '| pacotes:', report.packs.map((p) => `${p.name} ${p.rawKB}→${p.htmlKB}${p.z ? 'z' : ''}`).join(', '), '|', report.ms, 'ms');
