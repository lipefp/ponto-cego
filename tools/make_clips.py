# Gera as recargas por arma e grava em assets/fp_anim.json  (python3 tools/make_clips.py [nome ...])
import sys, json, os
sys.path.insert(0, os.path.dirname(__file__))
from retarget import *
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JOB = [
 # (rig, nome no jogo, pacote, clipe fonte, arma, carregador, configuração)
 # --- rig de fuzil ---
 ('rifle', 'ReloadSMG',  'SMG_FPS_Animations_ccransh.glb', 'KDW_Reload_fast', 'PBody_058', 'Pmag_061', 'cc'),
 ('rifle', 'ReloadSMGE', 'SMG_FPS_Animations_ccransh.glb', 'KDW_Reload_full', 'PBody_058', 'Pmag_061', 'cc'),
 ('rifle', 'ReloadAK',   'FPS_AK-74m_animations_ccransh.glb', 'AK_Reload', 'PBody_058', 'Pmag_062', 'cc'),
 ('rifle', 'ReloadAK2',  'FPS_AK-74m_animations_ccransh.glb', 'AK_Reload_var2', 'PBody_058', 'Pmag_062', 'cc'),
 ('rifle', 'ReloadAKE',  'FPS_AK-74m_animations_ccransh.glb', 'AK_Reload_full', 'PBody_058', 'Pmag_062', 'cc'),
 ('rifle', 'ReloadACR',  'Animated_FPS_hands_rifle_animation_pack_ccransh.glb', 'Arms_FPS_Anim_Reload_Fast', 'ACRRifle_058', 'Pmag_061', 'cc'),
 ('rifle', 'ReloadDMR',  'FPS_animations_sniper_rifle_ccransh.glb', 'SRifle_Reload', 'Body_057', 'Mag_060', 'cc'),
 ('rifle', 'ReloadDMRE', 'FPS_animations_sniper_rifle_ccransh.glb', 'SRifle_Reload_Full', 'Body_057', 'Mag_060', 'cc'),
 ('rifle', 'ReloadUZI',  'UZI_First_Person_Animations_2026_Rema_1Matzh.glb', 'Reload', 'UZI Body', 'UZI Mag', 'rigify'),
 ('rifle', 'ReloadUZIE', 'UZI_First_Person_Animations_2026_Rema_1Matzh.glb', 'Reload_Empty', 'UZI Body', 'UZI Mag', 'rigify'),
 ('rifle', 'ReloadSG',   'FPS_Benelli_M4_Animations_ccransh.glb', 'M4_ReloadOne_type1', 'Main_054', None, 'bn'),
 ('rifle', 'ReloadSG2',  'FPS_Benelli_M4_Animations_ccransh.glb', 'M4_ReloadOne_type2', 'Main_054', None, 'bn'),
 # --- rig de pistola ---
 ('pistol', 'ReloadPis',  'FPS_pistol_animations_ccransh.glb', 'FPS_Pistol_Reload_easy', 'PBody_058', 'Pmag_061', 'cc'),
 ('pistol', 'ReloadPisE', 'FPS_pistol_animations_ccransh.glb', 'FPS_Pistol_Reload_full', 'PBody_058', 'Pmag_061', 'cc'),
 ('pistol', 'ReloadMK',   'Makarov_PM_FPS_animations_ccransh.glb', 'MK_ReloadFast', 'Body_015', 'Mag_019', 'cc'),
 ('pistol', 'ReloadMKE',  'Makarov_PM_FPS_animations_ccransh.glb', 'MK_ReloadFull', 'Body_015', 'Mag_019', 'cc'),
 ('pistol', 'Reload9',    '9mm_Pistol_First_Person_Animations_1Matzh.glb', 'Reload', 'Weapon_922', 'Magazine_924', 'rigify'),
 ('pistol', 'Reload9E',   '9mm_Pistol_First_Person_Animations_1Matzh.glb', 'Reload_Empty', 'Weapon_922', 'Magazine_924', 'rigify'),
 ('pistol', 'ReloadUZIP',  'UZI_First_Person_Animations_2026_Rema_1Matzh.glb', 'Reload', 'UZI Body', 'UZI Mag', 'rigify'),
 ('pistol', 'ReloadUZIPE', 'UZI_First_Person_Animations_2026_Rema_1Matzh.glb', 'Reload_Empty', 'UZI Body', 'UZI Mag', 'rigify'),
]
REP = {'ReloadSG': 2, 'ReloadSG2': 2}
def trim(cl, margin=2, frac=0.015):
    """corta o começo e o fim parados do clipe (o pacote deixa 0,5 s de espera que só atrasa a recarga no jogo)"""
    K = len(cl['t'])
    mot = np.zeros(K)
    for tr in cl['tr']:
        w = 4 if tr['p'] == 'r' else 3
        v = np.array(tr['v']).reshape(-1, w)
        if len(v) != K: continue
        mot[1:] += np.linalg.norm(np.diff(v, axis=0), axis=1) * (1 if tr['p'] == 'r' else 4)
    c = np.cumsum(mot); tot = c[-1]
    if tot <= 0: return cl
    a = int(np.searchsorted(c, tot * frac)); b = int(np.searchsorted(c, tot * (1 - frac)))
    a = max(0, a - margin); b = min(K - 1, b + margin)
    if b - a < 8: return cl
    t0 = cl['t'][a]
    out = {'dur': round(cl['t'][b] - t0, 4), 't': [round(x - t0, 4) for x in cl['t'][a:b + 1]], 'tr': []}
    for tr in cl['tr']:
        w = 4 if tr['p'] == 'r' else 3
        v = np.array(tr['v']).reshape(-1, w)
        if len(v) == K: v = v[a:b + 1]
        out['tr'].append({'n': tr['n'], 'p': tr['p'], 'v': [round(float(x), 5) for x in v.ravel()]})
    return out

def repeat(cl, n):
    """repete o clipe n vezes (ex.: 2 cartuchos da escopeta)"""
    K = len(cl['t']); d = cl['dur']
    t = list(cl['t'])
    for r in range(1, n): t += [round(x + r * d, 4) for x in cl['t'][1:]]
    tr = []
    for x in cl['tr']:
        w = 4 if x['p'] == 'r' else 3
        v = np.array(x['v']).reshape(-1, w)
        if len(v) == K: v = np.concatenate([v] + [v[1:]] * (n - 1))
        tr.append({'n': x['n'], 'p': x['p'], 'v': [round(float(q), 5) for q in v.ravel()]})
    return {'dur': round(d * n, 4), 't': t, 'tr': tr}

def main(only):
    fa = os.path.join(HERE, 'assets/fp_anim.json')
    D = json.load(open(fa))
    games = {}; srcs = {}
    for rig, name, pack, sc, wp, mg, kind in JOB:
        if only and name not in only: continue
        if rig not in games: games[rig] = Game(os.path.join(HERE, 'assets/fp_%s.bin' % rig))
        if pack not in srcs: srcs[pack] = Rig(PACK + pack)
        src = srcs[pack]
        full = lambda pre: [x for x in src.name if x.startswith(pre)][0]
        if kind == 'rigify': cfg = rig_cfg(src, full(wp), full(mg))
        elif kind == 'bn':
            cfg = {'L': (full('upperarm_L'), full('lowerarm_L'), full('hand_L')), 'R': (full('upperarm_R'), full('lowerarm_R'), full('hand_R')), 'weapon': wp, 'mag': None}
        else: cfg = cc_cfg(src, wp, mg)
        kw = {'bn': dict(kr=0.0, kp=0.0, scale=0.019)}.get(kind, {})
        import retarget as _rt
        _rt.DN[:] = [0.03, 0.2] if name.startswith('ReloadDMR') else [0.10, 0.35]
        cl, st, s = retarget(games[rig], src, sc, cfg, **kw)
        cl = trim(cl)
        if name in REP: cl = repeat(cl, REP[name])
        D[rig][name] = cl
        print(name, 'dur', cl['dur'], 'trilhas', len(cl['tr']), 'escala %.3f' % s, 'ombro max %.3f' % st.get('shoulder', 0))
    for k in ('ReloadLMG', 'ReloadLMGE'): D['rifle'].pop(k, None)   # recargas antigas, sem uso
    json.dump(D, open(fa, 'w'), separators=(',', ':'))
main(sys.argv[1:])
