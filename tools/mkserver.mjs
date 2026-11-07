// @ts-check
/* =====================================================================
   Empacota o SERVIDOR DEDICADO (Docker) —  node tools/mkserver.mjs [saida]
   Gera <saida>/PontoCego_Servidor/ (Dockerfile, docker-compose.yml, README, server.js,
   sim.js, game.html, node_modules/ws) e o zip ao lado.
   Pré-requisito: dist/PontoCego.html já gerado (node tools/build.mjs).
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'dist'));
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const DEST = path.join(OUT, 'PontoCego_Servidor');
fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

/* sim.js = toda a simulação (src/sim/*.js, mesma ordem do jogo) + a API do servidor */
const simDir = path.join(ROOT, 'src/sim');
const sim = fs.readdirSync(simDir).filter((f) => f.endsWith('.js')).sort().map((f) => fs.readFileSync(path.join(simDir, f), 'utf8')).join('\n');
const tail = `\nreturn {SIM_DT,BUILD:${JSON.stringify(pkg.version)},G,agents,teams,mpServerInit,mpAddHuman,mpUpdateInfo,mpRemoveHuman,mpRecvCmd,mpServerStep,mpClientHdr,mpStartMatch,mpEndMatch,mpCleanInfo};\n`;
fs.writeFileSync(path.join(DEST, 'sim.js'), sim + tail);

for (const f of ['server.js']) fs.copyFileSync(path.join(ROOT, 'server', f), path.join(DEST, f));
const html = path.join(ROOT, 'dist/PontoCego.html');
if (fs.existsSync(html)) fs.copyFileSync(html, path.join(DEST, 'game.html'));
else if (process.env.MKSERVER_NOHTML) fs.writeFileSync(path.join(DEST, 'game.html'), '<!doctype html><title>teste</title>');
else { console.error('dist/PontoCego.html não existe: rode node tools/build.mjs antes'); process.exit(1); }
fs.cpSync(path.join(ROOT, 'server/deps/ws'), path.join(DEST, 'node_modules/ws'), { recursive: true });
for (const f of ['Dockerfile', 'docker-compose.yml', '.dockerignore', 'README.md']) fs.copyFileSync(path.join(ROOT, 'server', f), path.join(DEST, f));
fs.writeFileSync(path.join(DEST, 'package.json'), JSON.stringify({ name: 'ponto-cego-servidor', version: pkg.version, private: true, main: 'server.js', scripts: { start: 'node server.js' }, engines: { node: '>=18' } }, null, 2) + '\n');

const zip = path.join(OUT, 'PontoCego_Servidor.zip');
fs.rmSync(zip, { force: true });
execSync(`zip -q -r ${JSON.stringify(zip)} PontoCego_Servidor`, { cwd: OUT });
console.log('servidor:', DEST, '\nzip:', zip, (fs.statSync(zip).size / 1048576).toFixed(1) + ' MB');
