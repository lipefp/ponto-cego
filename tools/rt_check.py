# confere cada recarga gerada: alcance, altura da mão, distância à câmera
import sys, json
from retarget import *
def run(rigkind):
    game = Game('../assets/fp_%s.bin' % rigkind); g = game.rig
    D = json.load(open('../assets/fp_anim.json'))[rigkind]
    cam = game.P0[g.byname['FPS_Camera_j']]
    for name, cl in D.items():
        if not name.startswith('Reload') or name in ('Reload', 'ReloadEmpty', 'Reload_Empty'): continue
        K = len(cl['t']); mh = -9; mcam = 9; hy = {}
        for k in range(K):
            T, Q, S = g.T0.copy(), g.Q0.copy(), g.S0.copy()
            for tr in cl['tr']:
                i = g.byname[tr['n']]; w = 4 if tr['p'] == 'r' else 3
                v = np.array(tr['v']).reshape(-1, w); vv = v[0] if len(v) == 1 else v[k]
                if tr['p'] == 'r': Q[i] = vv
                else: T[i] = vv
            P, R, _ = g.world(T, Q, S)
            for side in ('Left', 'Right'):
                b = game.arm[side]
                for j, i in enumerate(b[1:]):
                    d = np.linalg.norm(P[i] - cam)
                    if d < mcam: mcam = d; wh = (side, ['elbow', 'hand'][j], round(cl['t'][k], 2))
                hy[side] = max(hy.get(side, -9), P[b[2]][1] - cam[1])
        print(rigkind, name.ljust(11), 'dur', cl['dur'], 'min dist camera %.2f' % mcam, wh, 'altura mão vs câmera E %.2f D %.2f' % (hy['Left'], hy['Right']))
run('rifle'); run('pistol')
