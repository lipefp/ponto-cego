import sys, json
from retarget import *
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
def plot(game, D, src, clip, cfg, times, out, s):
    g = game.rig
    fig, ax = plt.subplots(2, len(times), figsize=(3.2 * len(times), 6.4))
    ts = D['t']
    def sampleg(k):
        T, Q, S = g.T0.copy(), g.Q0.copy(), g.S0.copy()
        for tr in D['tr']:
            i = g.byname[tr['n']]; w = 4 if tr['p'] == 'r' else 3
            v = np.array(tr['v']).reshape(-1, w); vv = v[0] if len(v) == 1 else v[k]
            if tr['p'] == 'r': Q[i] = vv
            else: T[i] = vv
        return g.world(T, Q, S)
    for c, t in enumerate(times):
        k = int(np.argmin(np.abs(np.array(ts) - t)))
        P, R, _ = sampleg(k)
        Ps, Rs, _ = src.pose(clip, ts[k])
        for r, (vx, vy) in enumerate([(2, 1), (0, 2)]):  # lateral: z,y ; topo: x,z
            a = ax[r][c]
            for side, col in (('Left', 'r'), ('Right', 'b')):
                b = game.arm[side]
                a.plot([P[i][vx] for i in b], [P[i][vy] for i in b], col + '-o', ms=3)
                S = 'L' if side == 'Left' else 'R'
                ids = [src.byname[x] for x in cfg[S]]
                o = game.P0[b[0]]; os_ = None
                # fonte desenhada com escala s e ancorada no ombro do jogo
                pts = [(Ps[i] - Ps[ids[0]]) * s + game.P0[b[0]] for i in ids]
                a.plot([p[vx] for p in pts], [p[vy] for p in pts], col + '--', alpha=.5)
            m = game.main
            fw = q2m(R[m]) @ np.array([0, 0, 1.0])
            a.plot([P[m][vx], P[m][vx] + fw[vx] * .3], [P[m][vy], P[m][vy] + fw[vy] * .3], 'g-', lw=3)
            a.plot(P[game.mag][vx], P[game.mag][vy], 'ks')
            a.set_aspect('equal'); a.set_title('%.2fs' % t, fontsize=8)
    fig.tight_layout(); fig.savefig(out, dpi=60)
