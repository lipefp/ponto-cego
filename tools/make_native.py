# Gera as recargas por arma a partir das recargas NATIVAS do rig (as que já funcionam: mão no carregador, dedos inteiros).
# Cada arma recebe a mesma lógica com ritmo e amplitude próprios.  python3 tools/make_native.py
import sys, json, os
sys.path.insert(0, os.path.dirname(__file__))
from retarget import *
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# (rig, id da arma, amplitude, pesos das 4 fases [recarga normal], pesos [vazia])
V = [
 ('rifle', 'smg',        0.94, (0.80, 1.10, 1.10, 1.00), (0.80, 1.05, 1.15, 1.00)),
 ('rifle', 'marimbondo', 0.90, (1.00, 0.85, 1.20, 0.95), (0.95, 0.85, 1.25, 0.95)),
 ('rifle', 'cascavel',   0.92, (0.85, 1.20, 0.95, 1.00), (0.90, 1.15, 1.00, 0.95)),
 ('rifle', 'jararaca',   0.97, (1.10, 0.95, 1.00, 1.05), (1.05, 1.00, 1.00, 1.05)),
 ('rifle', 'tupa',       1.00, (1.20, 0.90, 0.95, 1.05), (1.15, 0.95, 0.95, 1.10)),
 ('rifle', 'boitata',    1.00, (1.25, 1.00, 1.00, 0.90), (1.30, 1.00, 1.05, 0.90)),
 ('rifle', 'dmr',        0.96, (1.00, 1.15, 1.00, 0.90), (0.95, 1.20, 1.05, 0.90)),
 ('rifle', 'carcara',    0.92, (0.90, 1.00, 1.15, 1.00), (0.85, 1.05, 1.20, 1.00)),
 ('rifle', 'shotgun',    0.90, (1.30, 1.00, 0.90, 0.80), (1.30, 1.00, 0.90, 0.80)),
 ('rifle', 'ressaca',    0.92, (1.10, 0.95, 1.10, 0.85), (1.10, 0.95, 1.10, 0.85)),
 ('pistol', 'pistol',    0.92, (0.85, 1.10, 1.05, 1.00), (0.85, 1.10, 1.05, 1.00)),
 ('pistol', 'onca',      1.00, (1.10, 1.00, 0.95, 1.00), (1.10, 1.00, 0.95, 1.00)),
 ('pistol', 'pardal',    0.95, (0.95, 0.90, 1.20, 1.00), (0.95, 0.90, 1.20, 1.00)),
 ('pistol', 'abelha',    0.90, (0.80, 1.00, 1.15, 1.05), (0.80, 1.00, 1.15, 1.05)),
 ('pistol', 'jaguar',    1.00, (1.20, 1.05, 0.90, 1.00), (1.20, 1.05, 0.90, 1.00)),
]
NAT = {'rifle': ('Reload', 'Reload_Empty'), 'pistol': ('Reload', 'ReloadEmpty')}

def warp(cl, w, amp, rest):
    K = len(cl['t']); d = cl['dur']
    b = np.array([0, .25, .5, .75, 1.0]); c = np.concatenate([[0], np.cumsum(w) / np.sum(w)])
    t = np.array(cl['t']); tn = np.interp(t / d, b, c) * d
    out = {'dur': cl['dur'], 't': [round(float(x), 4) for x in tn], 'tr': []}
    for tr in cl['tr']:
        pw = 4 if tr['p'] == 'r' else 3
        v = np.array(tr['v']).reshape(-1, pw)
        r = rest.get(tr['n'])
        if r is not None and amp != 1.0:
            rq = r[0] if tr['p'] == 'r' else r[1]
            if tr['p'] == 'r':
                v = np.array([qslerp(rq, q, amp) for q in v])
            else:
                v = rq + (v - rq) * amp
        out['tr'].append({'n': tr['n'], 'p': tr['p'], 'v': [round(float(x), 5) for x in v.ravel()]})
    return out

fa = os.path.join(HERE, 'assets/fp_anim.json')
D = json.load(open(fa))
games = {k: Game(os.path.join(HERE, 'assets/fp_%s.bin' % k)) for k in ('rifle', 'pistol')}
for rig, wid, amp, wn, we in V:
    g = games[rig].rig
    rest = {g.name[i]: (g.Q0[i], g.T0[i]) for i in range(g.N)}
    n, e = NAT[rig]
    D[rig]['RN_' + wid] = warp(D[rig][n], wn, amp, rest)
    D[rig]['RE_' + wid] = warp(D[rig][e], we, amp, rest)
    print(wid, rig, 'amp', amp, D[rig]['RN_' + wid]['dur'], D[rig]['RE_' + wid]['dur'])
json.dump(D, open(fa, 'w'), separators=(',', ':'))
