# Biblioteca de conversão de animação (GLB -> esqueleto do jogo). Usa numpy.
import json, struct, numpy as np

def load_glb(path):
    b = open(path, 'rb').read()
    l = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + l])
    off = 20 + l
    binc = None
    while off < len(b):
        cl, ct = struct.unpack('<II', b[off:off + 8])
        if ct == 0x004E4942:
            binc = b[off + 8:off + 8 + cl]
        off += 8 + cl
    return j, binc

CT = {5120: 'b', 5121: 'B', 5122: 'h', 5123: 'H', 5125: 'I', 5126: 'f'}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}

def acc(j, binc, i):
    a = j['accessors'][i]
    bv = j['bufferViews'][a['bufferView']]
    n = NC[a['type']]
    dt = np.dtype(CT[a['componentType']])
    o = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = bv.get('byteStride')
    if stride and stride != n * dt.itemsize:
        raw = np.frombuffer(binc, dtype=np.uint8, count=a['count'] * stride, offset=o).reshape(a['count'], stride)
        arr = np.frombuffer(raw[:, :n * dt.itemsize].tobytes(), dtype=dt).reshape(a['count'], n)
    else:
        arr = np.frombuffer(binc, dtype=dt, count=a['count'] * n, offset=o).reshape(a['count'], n)
    arr = arr.astype(np.float64)
    if a.get('normalized'):
        arr = arr / np.iinfo(dt).max
    return arr

def qmul(a, b):
    ax, ay, az, aw = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    bx, by, bz, bw = b[..., 0], b[..., 1], b[..., 2], b[..., 3]
    return np.stack([aw * bx + ax * bw + ay * bz - az * by,
                     aw * by - ax * bz + ay * bw + az * bx,
                     aw * bz + ax * by - ay * bx + az * bw,
                     aw * bw - ax * bx - ay * by - az * bz], -1)

def qinv(q):
    return q * np.array([-1, -1, -1, 1.0])

def qnorm(q):
    return q / np.linalg.norm(q, axis=-1, keepdims=True)

def qslerp(a, b, t):
    d = np.sum(a * b)
    if d < 0:
        b = -b
        d = -d
    if d > 0.9995:
        return qnorm(a + (b - a) * t)
    th = np.arccos(min(1, d))
    s = np.sin(th)
    return a * (np.sin((1 - t) * th) / s) + b * (np.sin(t * th) / s)

def q2m(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])

def m2q(m):
    t = m[0, 0] + m[1, 1] + m[2, 2]
    if t > 0:
        s = np.sqrt(t + 1) * 2
        q = [(m[2, 1] - m[1, 2]) / s, (m[0, 2] - m[2, 0]) / s, (m[1, 0] - m[0, 1]) / s, s / 4]
    elif m[0, 0] > m[1, 1] and m[0, 0] > m[2, 2]:
        s = np.sqrt(1 + m[0, 0] - m[1, 1] - m[2, 2]) * 2
        q = [s / 4, (m[0, 1] + m[1, 0]) / s, (m[0, 2] + m[2, 0]) / s, (m[2, 1] - m[1, 2]) / s]
    elif m[1, 1] > m[2, 2]:
        s = np.sqrt(1 + m[1, 1] - m[0, 0] - m[2, 2]) * 2
        q = [(m[0, 1] + m[1, 0]) / s, s / 4, (m[1, 2] + m[2, 1]) / s, (m[0, 2] - m[2, 0]) / s]
    else:
        s = np.sqrt(1 + m[2, 2] - m[0, 0] - m[1, 1]) * 2
        q = [(m[0, 2] + m[2, 0]) / s, (m[1, 2] + m[2, 1]) / s, s / 4, (m[1, 0] - m[0, 1]) / s]
    return qnorm(np.array(q))

class Rig:
    def __init__(self, path):
        self.j, self.bin = load_glb(path)
        j = self.j
        self.nodes = j['nodes']
        N = len(self.nodes)
        self.N = N
        self.par = [-1] * N
        for i, n in enumerate(self.nodes):
            for c in n.get('children', []):
                self.par[c] = i
        self.name = [n.get('name', '') for n in self.nodes]
        self.byname = {}
        for i, nm in enumerate(self.name):
            self.byname.setdefault(nm, i)
        self.T0 = np.zeros((N, 3)); self.Q0 = np.tile([0, 0, 0, 1.0], (N, 1)); self.S0 = np.ones((N, 3))
        for i, n in enumerate(self.nodes):
            if 'matrix' in n:
                m = np.array(n['matrix']).reshape(4, 4).T
                self.T0[i] = m[:3, 3]
                sc = np.linalg.norm(m[:3, :3], axis=0)
                self.S0[i] = sc
                self.Q0[i] = m2q(m[:3, :3] / sc)
            else:
                if 'translation' in n: self.T0[i] = n['translation']
                if 'rotation' in n: self.Q0[i] = n['rotation']
                if 'scale' in n: self.S0[i] = n['scale']
        # ordem pai antes de filho
        order = []; seen = [0] * N
        def visit(i):
            if seen[i]: return
            if self.par[i] >= 0: visit(self.par[i])
            seen[i] = 1; order.append(i)
        for i in range(N): visit(i)
        self.order = order
        self.anims = {}
        for a in j.get('animations', []):
            nm = a.get('name', '').split('|')[-1]
            tr = {}
            for ch in a['channels']:
                s = a['samplers'][ch['sampler']]
                nd = ch['target']['node']; pa = ch['target']['path']
                tr.setdefault(nd, {})[pa] = (acc(j, self.bin, s['input'])[:, 0], acc(j, self.bin, s['output']))
            self.anims[nm] = tr
        self.dur = {nm: max(max(v[0][-1] for v in d.values()) for d in tr.values()) for nm, tr in self.anims.items()}

    def local(self, clip, t):
        T = self.T0.copy(); Q = self.Q0.copy(); S = self.S0.copy()
        if clip is None: return T, Q, S
        for nd, d in self.anims[clip].items():
            for pa, (ts, vs) in d.items():
                tt = min(max(t, ts[0]), ts[-1])
                k = int(np.searchsorted(ts, tt, side='right')) - 1
                k = min(max(k, 0), len(ts) - 2) if len(ts) > 1 else 0
                if len(ts) == 1: f = 0; k2 = 0
                else:
                    k2 = k + 1; f = (tt - ts[k]) / (ts[k2] - ts[k]) if ts[k2] > ts[k] else 0
                if pa == 'rotation': Q[nd] = qslerp(vs[k], vs[k2], f)
                elif pa == 'translation': T[nd] = vs[k] * (1 - f) + vs[k2] * f
                elif pa == 'scale': S[nd] = vs[k] * (1 - f) + vs[k2] * f
        return T, Q, S

    def world(self, T, Q, S):
        """devolve posição (N,3) e rotação mundial (N,4) sem escala + escala acumulada"""
        N = self.N
        P = np.zeros((N, 3)); R = np.zeros((N, 4)); SC = np.ones((N, 3))
        for i in self.order:
            p = self.par[i]
            if p < 0:
                P[i] = T[i]; R[i] = Q[i]; SC[i] = S[i]
            else:
                P[i] = P[p] + q2m(R[p]) @ (T[i] * SC[p])
                R[i] = qmul(R[p], Q[i])
                SC[i] = SC[p] * S[i]
        return P, R, SC

    def pose(self, clip, t):
        T, Q, S = self.local(clip, t)
        return self.world(T, Q, S)
