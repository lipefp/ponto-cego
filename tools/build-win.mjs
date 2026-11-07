// @ts-check
/* Gera dist/PontoCego-win.zip (Windows x64, Electron) a partir de dist/PontoCego.html.
   Roda no Linux sem wine (o @electron/packager 18 edita os metadados do .exe com resedit, em JS).
   O binário do Electron vem do GitHub releases (cache em ~/.cache/electron). */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { packager } from '@electron/packager';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = path.join(ROOT, 'dist/PontoCego.html');
if (!fs.existsSync(html)) { console.error('rode antes: python3 build.py'); process.exit(1); }
const EV = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules/electron/package.json'), 'utf8')).version;
const stage = path.join(ROOT, 'dist/.win-stage'), out = path.join(ROOT, 'dist/.win-out');
fs.rmSync(stage, { recursive: true, force: true }); fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'electron/main.js'), path.join(stage, 'main.js'));
fs.copyFileSync(html, path.join(stage, 'PontoCego.html'));
fs.writeFileSync(path.join(stage, 'package.json'), JSON.stringify({ name: 'ponto-cego', productName: 'Ponto Cego', version: '4.0.0', main: 'main.js', description: 'Ponto Cego — FPS tático 5v5 offline' }, null, 1));
const t0 = Date.now();
const [dir] = await packager({
  dir: stage, out, name: 'PontoCego', platform: 'win32', arch: 'x64', electronVersion: EV, overwrite: true, asar: true, prune: false,
  appCopyright: 'Ponto Cego', win32metadata: { ProductName: 'Ponto Cego', FileDescription: 'Ponto Cego', CompanyName: 'Ponto Cego' },
});
/* remove idiomas que não usamos (−40 MB) */
const loc = path.join(dir, 'locales');
if (fs.existsSync(loc)) for (const f of fs.readdirSync(loc)) if (!/^(pt-BR|pt-PT|en-US)\.pak$/.test(f)) fs.rmSync(path.join(loc, f));
fs.writeFileSync(path.join(dir, 'LEIA-ME.txt'), 'Ponto Cego v4\r\nAbra PontoCego.exe. F11 = tela cheia/janela, Esc = pausa (solta o mouse), Alt+F4 = sair.\r\nTudo roda offline. Electron (MIT) + Chromium (BSD) — licenças em LICENSE e LICENSES.chromium.html.\r\n');
const zip = path.join(ROOT, 'dist/PontoCego-win.zip');
fs.rmSync(zip, { force: true });
execFileSync('python3', ['-c', `import zipfile,os,sys
src,dst=sys.argv[1],sys.argv[2]
with zipfile.ZipFile(dst,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for r,ds,fs in os.walk(src):
    for f in fs:
      p=os.path.join(r,f);z.write(p,os.path.join('PontoCego',os.path.relpath(p,src)))`, dir, zip]);
console.log('zip', zip, Math.round(fs.statSync(zip).size / 1048576) + ' MB', '| electron', EV, '|', Date.now() - t0, 'ms');
fs.rmSync(stage, { recursive: true, force: true });
