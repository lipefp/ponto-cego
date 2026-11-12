# Conversor de animação: pacote de braços (GLB) -> esqueleto do jogo (fp_rifle / fp_pistol).
# Ideia: a mão é presa à ARMA (e ao carregador, quando pega nele). Braço por IK de 2 ossos, dedos por rotação mundial.
# Uso: python3 tools/retarget.py   (lê /tmp/anims/anims_fps/*.glb e escreve em assets/fp_anim.json)
import sys, json, re, os
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from rt_lib import *

PACK = '/tmp/anims/anims_fps/'
FING = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']

def unit(v):
    n = np.linalg.norm(v)
    return v / n if n > 1e-9 else v

SMAX = 0.06   # quanto o ombro pode andar para a mão alcançar (m)

DN = [0.10, 0.35]

def softdn(v, lim=None, k=None):
    """limita a descida (y) do deslocamento: a mão e o carregador não somem para baixo da tela"""
    lim = DN[0] if lim is None else lim; k = DN[1] if k is None else k
    v = v.copy()
    if v[1] < -lim: v[1] = -lim + (v[1] + lim) * k
    return v

def cap_q(q, maxdeg):
    """limita o ângulo de uma rotação (graus), mantendo o eixo"""
    q = q / np.linalg.norm(q)
    if q[3] < 0: q = -q
    ang = 2 * np.arccos(min(1.0, q[3]))
    mx = np.radians(maxdeg)
    if ang <= mx: return q
    ax = q[:3] / max(np.linalg.norm(q[:3]), 1e-9)
    return np.array([ax[0] * np.sin(mx / 2), ax[1] * np.sin(mx / 2), ax[2] * np.sin(mx / 2), np.cos(mx / 2)])

def soft_q(q, maxdeg):
    """igual cap_q, mas suave perto do limite (tanh)"""
    q = q / np.linalg.norm(q)
    if q[3] < 0: q = -q
    ang = 2 * np.arccos(min(1.0, q[3]))
    if ang < 1e-6: return q
    mx = np.radians(maxdeg)
    na = mx * np.tanh(ang / mx)
    ax = q[:3] / max(np.linalg.norm(q[:3]), 1e-9)
    return np.array([ax[0] * np.sin(na / 2), ax[1] * np.sin(na / 2), ax[2] * np.sin(na / 2), np.cos(na / 2)])

def softcap(v, L):
    """limita o comprimento do deslocamento (m) de forma suave"""
    n = float(np.linalg.norm(v))
    a = L * 0.55
    if n <= a: return v
    m = a + (L - a) * np.tanh((n - a) / (L - a))
    return v * (m / n)

# limites da beta.7: a arma quase não gira, o punho e os dedos não passam do natural
WEAPON_ROT = 6.0     # graus
WEAPON_POS = 0.05    # m
HAND_DISP = 0.34     # m
WRIST = 32.0         # graus (punho em relação ao antebraço)
FINGER = 50.0        # graus por junta
FINGER_K = 0.8

def smooth(a, b, x):
    t = min(1, max(0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)

def frame(u, n):
    """base ortonormal (colunas): x=u, z=n ortogonal a u, y=z×x"""
    x = unit(u)
    z = n - x * np.dot(n, x)
    if np.linalg.norm(z) < 1e-6:
        z = np.cross(x, [0, 1, 0.0])
        if np.linalg.norm(z) < 1e-6: z = np.cross(x, [1, 0, 0.0])
    z = unit(z)
    y = np.cross(z, x)
    return np.stack([x, y, z], 1)

def rot_delta(R1, R0):
    return qmul(R1, qinv(R0))

def rot_apply(q, v):
    return q2m(q) @ v

def kids(rig, i):
    return [c for c in rig.nodes[i].get('children', [])]

def chain_of(rig, i):
    """segue o primeiro filho até acabar, ignora nós *_end"""
    out = []
    while True:
        out.append(i)
        ks = [c for c in kids(rig, i) if 'end' not in rig.name[c].lower() and 'mesh' not in rig.name[c].lower() and 'mesh' not in rig.nodes[c]]
        ks = [c for c in ks if 'mesh' not in rig.nodes[c]]
        if not ks: break
        i = ks[0]
    return out

def src_fingers(rig, hand, P, R):
    """5 correntes de dedos da mão fonte, ordenadas polegar, indicador, médio, anelar, mínimo"""
    chains = []
    for c in kids(rig, hand):
        nm = rig.name[c].lower()
        if 'end' in nm or 'mesh' in rig.nodes[c]: continue
        ch = chain_of(rig, c)
        chains.append(ch)
    if len(chains) != 5:
        raise RuntimeError('dedos: %d correntes em %s' % (len(chains), rig.name[hand]))
    byname = {}
    for ch in chains:
        nm = rig.name[ch[0]].lower()
        for k, f in enumerate(['thumb', 'index', 'middl', 'ring', 'pink']):
            if f in nm: byname[k] = ch
    if len(byname) == 5:
        return [byname[k] for k in range(5)]
    lens = [len(c) for c in chains]
    if lens.count(min(lens)) == 1 and min(lens) < max(lens):
        th = chains[lens.index(min(lens))]
    else:
        raise RuntimeError('polegar não achado')
    rest = [c for c in chains if c is not th]
    mean_rest = np.mean([P[c[0]] for c in rest], 0)
    d = unit(P[th[0]] - mean_rest)
    rest.sort(key=lambda c: -np.dot(P[c[0]] - mean_rest, d))
    return [th] + rest

class Game:
    def __init__(self, path):
        self.rig = Rig(path)
        g = self.rig
        self.P0, self.R0, _ = g.pose(None, 0)
        self.fing = {}
        for side in ['Left', 'Right']:
            self.fing[side] = []
            for f in FING:
                self.fing[side].append([g.byname['%sHand%s%d' % (side, f, k)] for k in (1, 2, 3)])
        self.arm = {s: [g.byname[s + 'Arm'], g.byname[s + 'ForeArm'], g.byname[s + 'Hand']] for s in ['Left', 'Right']}
        self.main = g.byname['Main_j']
        self.mag = g.byname['Mag1_j']

def pick(rig, startswith, nth=0):
    ms = [i for i, n in enumerate(rig.name) if n.startswith(startswith)]
    return ms[nth]

def spose(src, clip, t, yaw=0.0):
    P, R, S = src.pose(clip, t)
    if yaw:
        c, sn = np.cos(yaw), np.sin(yaw)
        Ry = np.array([[c, 0, sn], [0, 1, 0], [-sn, 0, c]])
        qa = np.array([0, np.sin(yaw / 2), 0, np.cos(yaw / 2)])
        P = P @ Ry.T
        R = qmul(np.tile(qa, (len(R), 1)), R)
    return P, R, S

def retarget(game, src, clip, cfg, fps=20, scale=None, log=None, kr=0.35, kp=0.4):
    """cfg: dict L/R -> (shoulder, elbow, hand) nomes; weapon, mag nomes (mag pode ser None)"""
    g = game.rig
    dur = src.dur[clip]
    n = int(round(dur * fps))
    times = [min(dur, k / fps) for k in range(n + 1)]
    if times[-1] < dur - 1e-6: times.append(dur)
    sN = lambda nm: src.byname[nm]
    # referência: quadro 0
    yaw = cfg.get('yaw', 0.0)
    P0, R0, _ = spose(src, clip, 0, yaw)
    arm = {}
    for side, S in (('Left', 'L'), ('Right', 'R')):
        a = cfg[S]
        arm[side] = [sN(a[0]), sN(a[1]), sN(a[2])]
    sw = sN(cfg['weapon'])
    smag = sN(cfg['mag']) if cfg.get('mag') else None
    # escala: alcance do braço
    if scale is None:
        sl = []
        for side in ('Left', 'Right'):
            a = arm[side]; b = game.arm[side]
            ls = np.linalg.norm(P0[a[1]] - P0[a[0]]) + np.linalg.norm(P0[a[2]] - P0[a[1]])
            lg = np.linalg.norm(game.P0[b[1]] - game.P0[b[0]]) + np.linalg.norm(game.P0[b[2]] - game.P0[b[1]])
            sl.append(lg / ls)
        scale = float(np.mean(sl))
    s = scale
    if cfg.get('fingers'):
        fingers_src = {side: [[sN(x) for x in ch] for ch in cfg['fingers'][side]] for side in ('Left', 'Right')}
    else:
        fingers_src = {side: src_fingers(src, arm[side][2], P0, R0) for side in ('Left', 'Right')}
    # dados do jogo em repouso
    mainP0 = game.P0[game.main]; mainR0 = game.R0[game.main]
    magP0 = game.P0[game.mag]; magR0 = game.R0[game.mag]
    # posições da fonte no quadro 0, relativas à arma
    def rel_w(P, R, i, Rw0):
        return P[i]
    out = {}  # nome do osso -> lista de (t, q) / (t, p)
    rec_q = {}; rec_p = {}
    def push_q(i, q): rec_q.setdefault(i, []).append(q)
    def push_p(i, p): rec_p.setdefault(i, []).append(p)
    # valores de referência
    ws0P = P0[sw]; ws0R = R0[sw]
    lh0 = {}
    for side in ('Left', 'Right'):
        h = arm[side][2]
        lh0[side] = P0[h] - ws0P  # D(0)=I
    if smag is not None:
        lmw0 = P0[smag] - ws0P
    stats = {'clamp': 0, 'maxerr': 0.0, 'wmax': 0.0}
    prev_n = {}
    shoulder_t = {}
    for t in times:
        Pt, Rt, _ = spose(src, clip, t, yaw)
        Dw = rot_delta(Rt[sw], ws0R)          # giro REAL da arma na fonte
        Dw_inv = qinv(Dw)
        De = soft_q(qslerp(np.array([0, 0, 0, 1.0]), Dw, kr), WEAPON_ROT)   # giro usado no jogo: o cano não cai
        # arma no jogo
        mainP = mainP0 + softcap(s * kp * (Pt[sw] - ws0P), WEAPON_POS)
        mainR = qmul(De, mainR0)
        # carregador
        if smag is not None:
            lmw = rot_apply(Dw_inv, Pt[smag] - Pt[sw])
            magP = mainP + rot_apply(De, (magP0 - mainP0) + softcap(softdn(s * (lmw - lmw0)), HAND_DISP))
            Dm_true = rot_delta(Rt[smag], R0[smag])
            Dm = qmul(De, qmul(Dw_inv, Dm_true))
            magR = qmul(Dm, magR0)
        else:
            magP = mainP + rot_apply(De, magP0 - mainP0); magR = qmul(De, magR0); Dm = De; Dm_true = Dw
        # matrizes mundiais do jogo por osso (só o que muda)
        W = {}  # idx -> (pos, rot)
        for side in ('Left', 'Right'):
            a = arm[side]; b = game.arm[side]
            Sg = game.P0[b[0]]; E0 = game.P0[b[1]]; H0 = game.P0[b[2]]
            L1 = np.linalg.norm(E0 - Sg); L2 = np.linalg.norm(H0 - E0)
            # alvo da mão: relativo à arma
            lhs = rot_apply(Dw_inv, Pt[a[2]] - Pt[sw])
            T_w = mainP + rot_apply(De, (H0 - mainP0) + softcap(softdn(s * (lhs - lh0[side])), HAND_DISP))
            T = T_w
            if side == 'Left' and smag is not None:
                dgm = s * np.linalg.norm(Pt[a[2]] - Pt[smag])
                dev = s * np.linalg.norm(lhs - lh0[side])
                wgt = smooth(0.03, 0.10, dev) * (1 - smooth(0.12, 0.25, dgm))
                lmh = rot_apply(qinv(Dm_true), Pt[a[2]] - Pt[smag])
                T_m = magP + rot_apply(Dm, softcap(softdn(s * lmh, DN[0] + 0.04), 0.2))
                T = T_w * (1 - wgt) + T_m * wgt
                stats['wmax'] = max(stats['wmax'], wgt)
            # IK de dois ossos
            v = T - Sg; d = np.linalg.norm(v)
            dmax = (L1 + L2) * 0.985; dmin = abs(L1 - L2) + 1e-3
            Sg0 = Sg
            if d > dmax:   # alcance curto: o ombro acompanha a mão (o osso do ombro anda junto, a câmera não)
                stats['clamp'] += 1
                Sg = Sg + unit(v) * min(d - dmax, SMAX)
                v = T - Sg; d = np.linalg.norm(v)
                stats['shoulder'] = max(stats.get('shoulder', 0), float(np.linalg.norm(Sg - Sg0)))
            dd = min(max(d, dmin), dmax)
            av = unit(v)
            T = Sg + av * dd
            shoulder_t[side] = Sg
            x = (L1 * L1 - L2 * L2 + dd * dd) / (2 * dd)
            hh = np.sqrt(max(L1 * L1 - x * x, 1e-8))
            # polo: cotovelo da fonte em relação ao ombro
            pole = (E0 - Sg0)   # cotovelo do repouso do jogo: mantém o lado natural (sem virar para a câmera)
            pp = pole - av * np.dot(pole, av)
            if np.linalg.norm(pp) > 1e-6:
                pp = unit(pp)
                # quando a mão sai do lugar, o cotovelo desce (não sobe nem vem para a câmera)
                dn = np.array([0, -1.0, 0]); dn = dn - av * np.dot(dn, av)
                wd = smooth(0.02, 0.10, float(np.linalg.norm(T - H0)))
                if np.linalg.norm(dn) > 1e-6: pp = unit(pp * (1 - wd) + unit(dn) * wd * 1.4)
            if np.linalg.norm(pp) < 1e-6:
                pp = (Pt[a[1]] - Pt[a[0]]) - av * np.dot(Pt[a[1]] - Pt[a[0]], av)
            pp = unit(pp)
            E = Sg + av * x + pp * hh
            # base de repouso do jogo
            u0 = unit(E0 - Sg); f0 = unit(H0 - E0)
            n0 = np.cross(u0, f0)
            if np.linalg.norm(n0) < 1e-4:
                n0 = np.cross(u0, (E0 - Sg) - av * 0)
            n0 = unit(n0)
            u1 = unit(E - Sg); f1 = unit(T - E)
            n1 = np.cross(u1, f1)
            if np.linalg.norm(n1) < 1e-4:
                n1 = prev_n.get(side, n0)
            n1 = unit(n1)
            # mantém o lado do cotovelo do repouso
            if np.dot(n1, n0) < 0 and np.dot(n1, prev_n.get(side, n0)) < 0:
                pass
            prev_n[side] = n1
            Fu0 = frame(u0, n0); Fu1 = frame(u1, n1)
            Ff0 = frame(f0, n0); Ff1 = frame(f1, n1)
            Ru = Fu1 @ Fu0.T @ q2m(game.R0[b[0]])
            Rf = Ff1 @ Ff0.T @ q2m(game.R0[b[1]])
            qu = m2q(Ru); qf = m2q(Rf)
            Dh = qmul(De, qmul(Dw_inv, rot_delta(Rt[a[2]], R0[a[2]])))
            qh = qmul(Dh, game.R0[b[2]])
            # punho: em relação ao antebraço não passa de WRIST graus (a mão não quebra)
            qrel = qmul(qinv(qf), qh); qrel0 = qmul(qinv(game.R0[b[1]]), game.R0[b[2]])
            dq = soft_q(qmul(qrel, qinv(qrel0)), WRIST)
            qh = qmul(qf, qmul(dq, qrel0))
            W[b[0]] = (Sg, qu); W[b[1]] = (E, qf); W[b[2]] = (T, qh)
            stats['maxerr'] = max(stats['maxerr'], float(np.linalg.norm(T - T_w)) if d > dmax else 0)
            # dedos
            for fi in range(5):
                sc = fingers_src[side][fi][-3:]
                gc = game.fing[side][fi]
                for k in range(3):
                    Dk = qmul(De, qmul(Dw_inv, rot_delta(Rt[sc[k]], R0[sc[k]])))
                    Dk = soft_q(qslerp(np.array([0, 0, 0, 1.0]), Dk, FINGER_K), FINGER)
                    W[gc[k]] = (None, qmul(Dk, game.R0[gc[k]]))
        # converte para locais
        Pg = {}; Rg = {}
        def wr(i):
            if i in Rg: return Rg[i]
            if i in W and W[i][1] is not None: Rg[i] = W[i][1]
            elif i == game.main: Rg[i] = mainR
            elif i == game.mag: Rg[i] = magR
            else: Rg[i] = game.R0[i]
            return Rg[i]
        # locais
        for side in ('Left', 'Right'):
            b = game.arm[side]
            for k in range(3):
                i = b[k]; p = g.par[i]
                qpar = wr(p) if p in W or p in (game.main, game.mag) else game.R0[p]
                push_q(i, qmul(qinv(qpar), W[i][1]))
            push_p(b[0], q2m(qinv(game.R0[g.par[b[0]]])) @ (shoulder_t[side] - game.P0[g.par[b[0]]]))
            for fi in range(5):
                gc = game.fing[side][fi]
                for k in range(3):
                    i = gc[k]; p = g.par[i]
                    qpar = W[p][1] if p in W else game.R0[p]
                    push_q(i, qmul(qinv(qpar), W[i][1]))
        # arma: pai fixo
        pm = g.par[game.main]
        Rpm = game.R0[pm]; Ppm = game.P0[pm]
        push_p(game.main, q2m(qinv(Rpm)) @ (mainP - Ppm))
        push_q(game.main, qmul(qinv(Rpm), mainR))
        pg = g.par[game.mag]
        # pai do carregador é Main_j (rifle) ou Mag1 (pistola, filho de Main_j)
        if pg == game.main:
            Rpg = mainR; Ppg = mainP
        else:
            # pai intermediário parado em relação a Main_j
            Rrel = qmul(qinv(game.R0[game.main]), game.R0[pg])
            Prel = q2m(qinv(game.R0[game.main])) @ (game.P0[pg] - game.P0[game.main])
            Rpg = qmul(mainR, Rrel); Ppg = mainP + q2m(mainR) @ Prel
        push_p(game.mag, q2m(qinv(Rpg)) @ (magP - Ppg))
        push_q(game.mag, qmul(qinv(Rpg), magR))
    # monta o clipe
    tr = []
    def cont(qs):
        qs = np.array(qs)
        for k in range(1, len(qs)):
            if np.dot(qs[k], qs[k - 1]) < 0: qs[k] = -qs[k]
        return qs
    def add(i, p, arr):
        arr = np.array(arr)
        flat = arr.reshape(len(arr), -1)
        if np.max(np.abs(flat - flat[0])) < 2e-5: v = [round(float(x), 5) for x in flat[0]]
        else: v = [round(float(x), 5) for x in flat.ravel()]
        tr.append({'n': g.name[i], 'p': p, 'v': v})
    for i, qs in rec_q.items(): add(i, 'r', cont(qs))
    for i, ps in rec_p.items(): add(i, 't', ps)
    cl = {'dur': round(float(dur), 4), 't': [round(float(x), 4) for x in times], 'tr': tr}
    return cl, stats, s

# ---- configuração dos pacotes (mesmo esqueleto dos pacotes ccransh) ----
def cc_cfg(src, weapon, mag):
    f = lambda pre: [x for x in src.name if x.startswith(pre)][0]
    return {'L': (f('UpArm_L'), f('Forearm_L'), f('Hand_L')), 'R': (f('UpArm_R'), f('Forearm_R'), f('Hand_R')),
            'weapon': weapon, 'mag': mag}

def sname(src, pre):
    return [x for x in src.name if x.startswith(pre)][0]

def rig_cfg(src, weapon, mag, yaw=0.0):
    """pacotes Matzh (Rigify): ossos DEF-*"""
    f = lambda pre: [x for x in src.name if x.startswith(pre + '_') and x[len(pre) + 1:].isdigit()][0]
    cfg = {'L': (f('DEF-upper_arm.L'), f('DEF-forearm.L'), f('DEF-hand.L')), 'R': (f('DEF-upper_arm.R'), f('DEF-forearm.R'), f('DEF-hand.R')),
           'weapon': weapon, 'mag': mag, 'yaw': yaw, 'fingers': {}}
    for side, S in (('Left', 'L'), ('Right', 'R')):
        ch = [[f('DEF-thumb.0%d.%s' % (k, S)) for k in (1, 2, 3)]]
        for fn in ('index', 'middle', 'ring', 'pinky'):
            ch.append([f('DEF-f_%s.0%d.%s' % (fn, k, S)) for k in (1, 2, 3)])
        cfg['fingers'][side] = ch
    return cfg
