/* =====================================================================
   ONLINE — busca de partida (fila → partida encontrada → aceitar → jogo)
   O servidor roda a simulação; aqui só mandamos comandos (28 bytes por passo) e recebemos snapshots.
   Protocolo: JSON de controle + binário (comandos). Estados (ON.st):
   off · connecting · idle · queued · found · match
   ===================================================================== */
const ON = {
  ws: null,
  st: 'off',
  err: '',
  rtt: 0,
  pingT: 0,
  infoKey: '',
  tm: 0,
  ui: 0,
  stat: null,
  found: null,
  qAt: 0,
  manual: false,
  tried: false,
  closeInfo: '',
};
const ON_PROTO = 2;

function onlineHostDefault() {
  if (SAVE.mpHost) return SAVE.mpHost;
  if (/^https?:$/.test(location.protocol)) return location.host;
  return (typeof window !== 'undefined' && window.PC_SERVER) || '';
}
function onlineWsUrl(h) {
  h = String(h || '').trim();
  if (!h) return '';
  let sec = location.protocol === 'https:';
  if (/^wss?:\/\//i.test(h)) return h.replace(/\/+$/, '') + '/ws';
  if (/^https?:\/\//i.test(h)) {
    sec = /^https/i.test(h);
    h = h.replace(/^https?:\/\//i, '');
  }
  h = h.replace(/\/.*$/, '');
  if (!/:\d+$/.test(h) && !/^https?:$/.test(location.protocol))
    h += ':8080'; /* aberto do arquivo: porta padrão do servidor */
  return (sec ? 'wss://' : 'ws://') + h + '/ws';
}
function onlineInfo() {
  return {
    name: SAVE.name || 'Jogador',
    atkOp: SAVE.atkOp,
    defOp: SAVE.defOp,
    load: SAVE.load || {},
    att: SAVE.att || {},
    skins: SAVE.skins || {},
  };
}
function onlineSendJSON(o) {
  const ws = ON.ws;
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(o));
}
function onlineSend(u8) {
  const ws = ON.ws;
  if (ws && ws.readyState === 1 && ws.bufferedAmount < 1e6) ws.send(u8);
}
function onlineRefresh() {
  if (menuTab === 'online' && inMenu()) renderMenu();
}

function onlineClose() {
  const ws = ON.ws;
  ON.ws = null;
  ON.st = 'off';
  ON.found = null;
  ON.infoKey = '';
  clearInterval(ON.tm);
  clearInterval(ON.ui);
  if (ws) {
    try {
      ws.close();
    } catch (e) {}
  }
}
/* conexão perdida: sai da partida (se houver) e mostra o motivo na aba Online */
function onlineDropped(msg) {
  clearInterval(ON.tm);
  clearInterval(ON.ui);
  ON.st = 'off';
  ON.found = null;
  ON.err = msg || '';
  if (MP.role === 'guest') toMenu(true);
  menuTab = 'online';
  onlineRefresh();
}
function onlineConnect() {
  onlineClose();
  ON.tried = true;
  const host = onlineHostDefault();
  const url = onlineWsUrl(host);
  if (!url) {
    onlineRefresh();
    return;
  }
  ON.st = 'connecting';
  ON.err = '';
  onlineRefresh();
  let ws;
  try {
    ws = new WebSocket(url);
  } catch (e) {
    ON.st = 'off';
    ON.err = 'Endereço inválido.';
    onlineRefresh();
    return;
  }
  ON.ws = ws;
  ws.binaryType = 'arraybuffer';
  const to = setTimeout(() => {
    if (ON.ws === ws && ON.st === 'connecting') {
      ON.err = 'O servidor não respondeu.';
      onlineClose();
      onlineRefresh();
    }
  }, 8000);
  ws.onopen = () => {
    clearTimeout(to);
    if (ON.ws !== ws) return;
    ws.send(
      JSON.stringify({
        t: 'hello',
        proto: ON_PROTO,
        build: (typeof PCCORE !== 'undefined' && PCCORE.VERSION) || '',
        info: onlineInfo(),
      })
    );
    ON.infoKey = JSON.stringify(onlineInfo());
    clearInterval(ON.tm);
    ON.tm = setInterval(() => {
      ON.pingT = performance.now();
      onlineSendJSON({ t: 'ping', n: 1 });
    }, 3000);
    clearInterval(ON.ui);
    ON.ui = setInterval(() => {
      if (ON.st === 'queued' || ON.st === 'found') onlineRefresh();
    }, 1000);
  };
  ws.onmessage = (ev) => {
    if (ON.ws !== ws || typeof ev.data !== 'string') return;
    let m;
    try {
      m = JSON.parse(ev.data);
    } catch (e) {
      return;
    }
    if (m && m.t) onlineMsg(m);
  };
  ws.onerror = () => {
    if (ON.st === 'connecting' && !ON.err) ON.err = 'Não consegui conectar ao servidor.';
  };
  ws.onclose = (ev) => {
    clearTimeout(to);
    ON.closeInfo = (ev && ev.code) + ' ' + (ev && ev.reason);
    if (ON.ws !== ws) return;
    ON.ws = null;
    onlineDropped(
      ON.err ||
        (ON.st === 'connecting'
          ? 'Não consegui conectar ao servidor.'
          : 'Conexão com o servidor perdida.')
    );
  };
}
function onlineMsg(m) {
  switch (m.t) {
    case 'welcome':
      ON.st = 'idle';
      ON.err = '';
      onlineRefresh();
      break;
    case 'stat':
      ON.stat = m;
      if (ON.st === 'idle' || ON.st === 'queued') onlineRefresh();
      break;
    case 'queued':
      ON.st = 'queued';
      ON.qAt = ON.qAt && m.again ? ON.qAt : performance.now();
      ON.found = null;
      onlineRefresh();
      break;
    case 'idle':
      ON.st = 'idle';
      ON.found = null;
      if (m.declined) ON.err = 'A partida foi cancelada: alguém não aceitou.';
      onlineRefresh();
      break;
    case 'found': {
      const first = ON.st !== 'found';
      ON.st = 'found';
      ON.found = { acc: m.acc, tot: m.tot, me: !!m.me, t0: performance.now(), left: m.left };
      if (first) playSound('ui');
      onlineRefresh();
      break;
    }
    case 'error':
      ON.err = m.msg || 'Erro do servidor.';
      break;
    case 'pong':
      ON.rtt = Math.round(performance.now() - ON.pingT);
      break;
    case 'pk':
      if (MP.role === 'guest') mpClientRecv(m.p, m.h);
      break;
    case 'start':
      onlineStart(m);
      break;
    case 'back':
      if (MP.role === 'guest') toMenu(true);
      else {
        ON.st = 'idle';
        onlineRefresh();
      }
      break;
  }
}
function onlineSearch() {
  if (ON.st !== 'idle') return;
  ON.err = '';
  onlineSendJSON({ t: 'queue', info: onlineInfo() });
}
/* a partida começou no servidor: monta o mundo local e entra (a simulação passa a vir dos snapshots) */
function onlineStart(m) {
  ON.st = 'match';
  ON.found = null;
  const old = SAVE.startSide;
  SAVE.startSide = m.side0 === 'def' ? 'def' : 'atk';
  crouchToggle = false;
  leanToggle = 0;
  initAudio();
  if (AC && AC.state === 'suspended') AC.resume();
  if (master) master.gain.value = SAVE.vol;
  mpClientInit(m.gi | 0);
  HUD.over.isVisible = false;
  HUD.pause.isVisible = false;
  HUD.board.isVisible = false;
  VM.key = '';
  useScene(game);
  G.phase = 'prep';
  newMatch();
  paused = false;
  SAVE.startSide = old;
  /* o travamento do mouse precisa de um clique do jogador: se o navegador recusar, mostra a pausa (CONTINUAR trava o mouse) */
  const fail = () => {
    if (MP.role === 'guest' && document.pointerLockElement !== canvas) {
      paused = true;
      INPUT.fire = INPUT.ads = INPUT.interact = false;
      HUD.pause.isVisible = true;
    }
  };
  try {
    let r;
    try {
      r = canvas.requestPointerLock({ unadjustedMovement: true });
    } catch (e) {
      r = canvas.requestPointerLock();
    }
    if (r && r.catch) r.catch(fail);
  } catch (e) {
    fail();
  }
  setTimeout(() => {
    if (MP.role === 'guest' && document.pointerLockElement !== canvas && !HUD.pause.isVisible)
      fail();
  }, 700);
}

/* ---------- aba "Online" ---------- */
const mmss = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
function onlineTab(add) {
  add(disp('ONLINE', { size: 44, h: 58, spacing: '5px' }));
  add(gap(10));
  const nameBox = () => {
    add(sectionLabel('Seu nome'));
    const inp = new GUI.InputText('name2', SAVE.name);
    inp.width = '100%';
    inp.height = '40px';
    inp.color = PAL.text;
    inp.background = 'rgba(255,255,255,.04)';
    inp.focusedBackground = 'rgba(255,255,255,.08)';
    inp.fontFamily = FONT;
    inp.fontSize = 15;
    inp.thickness = 1;
    inp.maxWidth = '100%';
    inp.onTextChangedObservable.add(() => {
      SAVE.name = (inp.text || '').slice(0, 14).trim() || 'Você';
      persist();
    });
    add(inp);
  };
  /* sem servidor: conecta sozinho quando há endereço (o jogo aberto pelo link do servidor já sabe o endereço) */
  if (ON.st === 'off' && !ON.manual && !ON.tried && onlineHostDefault()) {
    setTimeout(() => {
      if (ON.st === 'off' && menuTab === 'online') onlineConnect();
    }, 0);
  }
  if (ON.st === 'off' || ON.st === 'connecting') {
    if (ON.st === 'connecting' || (!ON.manual && onlineHostDefault() && !ON.err)) {
      add(text('Conectando ao servidor…', { size: 14, color: PAL.muted, h: 24 }));
      return;
    }
    add(
      text(
        'Não achei o servidor. Abra o jogo pelo link que o dono do servidor passou, ou digite o endereço abaixo.',
        { size: 12, color: PAL.muted, h: 48, wrap: true }
      )
    );
    add(sectionLabel('Endereço do servidor'));
    {
      const inp = new GUI.InputText(
        'host',
        SAVE.mpHost != null ? SAVE.mpHost : onlineHostDefault()
      );
      inp.width = '100%';
      inp.height = '40px';
      inp.color = PAL.text;
      inp.background = 'rgba(255,255,255,.04)';
      inp.focusedBackground = 'rgba(255,255,255,.08)';
      inp.fontFamily = FONT;
      inp.fontSize = 15;
      inp.thickness = 1;
      inp.maxWidth = '100%';
      inp.placeholderText = 'exemplo: 203.0.113.5:8080';
      inp.placeholderColor = '#5b626a';
      inp.onTextChangedObservable.add(() => {
        SAVE.mpHost = (inp.text || '').trim().slice(0, 120);
        persist();
      });
      inp.onKeyboardEventProcessedObservable.add((e) => {
        if (e.key === 'Enter') {
          ON.manual = false;
          onlineConnect();
        }
      });
      add(inp);
    }
    add(gap(10));
    if (ON.err) {
      add(text(ON.err, { size: 13, color: PAL.danger, h: 40, wrap: true }));
      add(gap(6));
    }
    add(
      chip(
        'Conectar',
        false,
        () => {
          playSound('ui');
          ON.manual = false;
          onlineConnect();
        },
        { w: 170, h: 40, fs: 14 }
      )
    );
    return;
  }
  const S = ON.stat;
  if (ON.st === 'idle') {
    add(
      text(S ? `${S.name} · ${S.online} online · ${S.playing} jogando` : 'Conectado ao servidor', {
        size: 12,
        color: PAL.muted,
        h: 20,
      })
    );
    nameBox();
    add(gap(8));
    add(
      text('Operador, arma e acessórios vêm das abas Operadores e Arsenal.', {
        size: 12,
        color: PAL.muted,
        h: 34,
        wrap: true,
      })
    );
    add(gap(10));
    {
      const card = chamfer({ w: '100%', h: 78, block: true });
      card.hoverCursor = 'pointer';
      const cs = stack(true, { w: '100%' });
      cs.paddingLeft = '16px';
      cs.verticalAlignment = VC;
      cs.addControl(
        text('PARTIDA ONLINE', { size: 11, color: '#454b52', weight: '600', spacing: '3px', h: 16 })
      );
      cs.addControl(
        text('BUSCAR PARTIDA ›', {
          size: 24,
          weight: '700',
          color: '#0a0b0d',
          spacing: '1px',
          h: 34,
        })
      );
      card.addControl(cs);
      card.onPointerUpObservable.add(() => {
        playSound('ui');
        onlineSearch();
      });
      add(card);
    }
    add(gap(8));
    add(text('5 contra 5 · bots completam as vagas', { size: 12, color: PAL.muted, h: 20 }));
    if (ON.err) {
      add(gap(6));
      add(text(ON.err, { size: 13, color: PAL.danger, h: 40, wrap: true }));
    }
    add(gap(10));
    add(
      chip(
        'Trocar servidor',
        false,
        () => {
          playSound('ui');
          onlineClose();
          ON.manual = true;
          ON.err = '';
          renderMenu();
        },
        { w: 170, h: 30, fs: 11 }
      )
    );
    return;
  }
  if (ON.st === 'queued') {
    const w = (performance.now() - ON.qAt) / 1000;
    add(text('Procurando partida…', { size: 22, weight: '700', h: 34 }));
    add(text(mmss(w), { size: 40, mono: true, h: 54 }));
    add(
      text(S ? `${S.queue} na fila · ${S.playing} jogando agora` : '', {
        size: 12,
        color: PAL.muted,
        h: 20,
      })
    );
    add(gap(6));
    add(
      text(
        'A partida começa quando a fila enche ou depois de alguns segundos, com bots nas vagas vazias.',
        { size: 12, color: PAL.muted, h: 48, wrap: true }
      )
    );
    add(gap(14));
    add(
      chip(
        'Cancelar busca',
        false,
        () => {
          playSound('ui');
          onlineSendJSON({ t: 'cancel' });
        },
        { w: 180, h: 40, fs: 14 }
      )
    );
    return;
  }
  if (ON.st === 'found') {
    const F = ON.found || { acc: 0, tot: 1, me: false, left: 15 },
      left = Math.max(0, F.left - Math.floor((performance.now() - F.t0) / 1000));
    add(text('PARTIDA ENCONTRADA', { size: 26, weight: '700', h: 40, spacing: '2px' }));
    add(text(`${F.acc} de ${F.tot} aceitaram · ${left} s`, { size: 15, color: PAL.muted, h: 26 }));
    add(gap(14));
    if (!F.me) {
      add(
        bigButton(
          'ACEITAR',
          null,
          () => {
            playSound('ui');
            onlineSendJSON({ t: 'accept' });
            ON.found.me = true;
            renderMenu();
          },
          { w: 300, h: 68, fs: 24 }
        )
      );
      add(gap(8));
      add(
        chip(
          'Recusar',
          false,
          () => {
            playSound('ui');
            onlineSendJSON({ t: 'decline' });
          },
          { w: 130, h: 34, fs: 12 }
        )
      );
    } else
      add(text('Aceito. Aguardando os outros jogadores…', { size: 14, color: PAL.ally, h: 26 }));
    return;
  }
  add(text('Em partida…', { size: 14, color: PAL.muted, h: 24 }));
}
