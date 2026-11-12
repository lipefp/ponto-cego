/* Ponto Cego — executável (Electron). Abre o PontoCego.html local em tela cheia, sem menu, sem rede.
   F11 alterna tela cheia · Alt+F4 fecha · Esc solta o mouse (pausa do jogo). */
const { app, BrowserWindow, Menu, session } = require('electron');
const path = require('path');
app.commandLine.appendSwitch('ignore-gpu-blocklist');          /* Vega 7 / drivers antigos: não cair para renderização por software */
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('force_high_performance_gpu');    /* notebooks com 2 GPUs: usa a dedicada */
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
Menu.setApplicationMenu(null);
if (!app.requestSingleInstanceLock()) app.quit();
app.whenReady().then(() => {
  const ses = session.defaultSession;
  /* 100% offline: bloqueia qualquer acesso à rede */
  ses.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] }, (_d, cb) => cb({ cancel: true }));
  ses.setPermissionRequestHandler((_wc, perm, cb) => cb(perm === 'pointerLock' || perm === 'fullscreen'));
  const win = new BrowserWindow({
    width: 1600, height: 900, fullscreen: true, autoHideMenuBar: true, show: false, backgroundColor: '#0e1316', title: 'Ponto Cego',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, spellcheck: false },
  });
  win.setMenuBarVisibility(false);
  win.once('ready-to-show', () => { win.show(); win.focus(); });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.loadFile(path.join(__dirname, 'PontoCego.html'));
  /* teste automático (só com PC_SMOKE=1): espera o jogo carregar, pede o travamento do ponteiro e sai */
  if (process.env.PC_SMOKE) {
    const t0 = Date.now(), js = (c, g) => win.webContents.executeJavaScript(c, !!g);
    const poll = async () => {
      const st = JSON.parse(await js('JSON.stringify({b:window.__pcBoot,a:window.__pcAssets&&{r:__pcAssets().ready,f:__pcAssets().failed}})'));
      if (!(st.b && st.b.done && st.a && (st.a.r || st.a.f)) && Date.now() - t0 < 120000) return setTimeout(poll, 250);
      const lock = await js('new Promise(r=>{document.addEventListener("pointerlockchange",()=>r(document.pointerLockElement&&document.pointerLockElement.id),{once:true});document.addEventListener("pointerlockerror",()=>r("erro"),{once:true});const c=document.getElementById("view");const p=c.requestPointerLock();if(p&&p.catch)p.catch(e=>r("erro:"+e.message));setTimeout(()=>r("tempo"),3000);})', true);
      console.log('PC_SMOKE ' + JSON.stringify({ ms: Date.now() - t0, boot: st.b.t, havok: st.b.havok, errors: st.b.errors, assets: st.a, pointerLock: lock, fullscreen: win.isFullScreen(), menu: win.isMenuBarVisible(), electron: process.versions.electron, chrome: process.versions.chrome }));
      app.exit(0);
    };
    win.webContents.once('did-finish-load', poll);
  }
});
app.on('window-all-closed', () => app.quit());
