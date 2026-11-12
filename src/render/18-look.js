/* =====================================================================
   LOOK FINAL — ajustes de materiais/ambiente depois que o mapa existe
   (área "luz"). Só visual: não mexe em colisão nem em jogabilidade.
   - luminárias: difusor em HDR (passa do limiar do bloom) + calha metálica
   - materiais simples do mapa: rugosidade/cor menos "plástico"
   ===================================================================== */
(function lookFinal() {
  /* difusor das luminárias: emissivo acima de 1 (HDR) para o bloom pegar só nelas */
  /* (StandardMaterial corta o emissivo em 1; o PBR não) */
  const LM = pbr(game, {
    name: 'lampHDR',
    color: '#000000',
    rough: 1,
    env: 0,
    emissive: '#fff0d6',
    ei: 3.2,
  });
  LM.fogEnabled = false;
  for (const m of game.meshes) if (m.material === M.lamp) m.material = LM;
  M.lamp = LM;
  /* calha da luminária (moldura + travessa central): 1 malha com thin instances */
  const H = WALL_H,
    F = pbr(game, { name: 'lampFrame', color: '#cfcac0', rough: 0.45, metal: 0.2 });
  const fr = template('lampFrame', [
    [1.44, 0.07, 0.05, 0, 0, -0.25, F],
    [1.44, 0.07, 0.05, 0, 0, 0.25, F],
    [0.05, 0.07, 0.45, -0.695, 0, 0, F],
    [0.05, 0.07, 0.45, 0.695, 0, 0, F],
    [1.3, 0.02, 0.025, 0, -0.025, 0, F],
  ]);
  fr.receiveShadows = false;
  shadowCasters.splice(shadowCasters.indexOf(fr), 1);
  for (const [x, z] of LK.lamps) place(fr, x, H - 0.035, z, 0);
  fr.thinInstanceBufferUpdated('matrix');
  fr.thinInstanceRefreshBoundingInfo(true);
  fr.freezeWorldMatrix();
  /* materiais lisos do mapa: menos brilho de plástico, mais uso */
  M.desk.roughness = 0.62;
  M.frame.roughness = 0.7;
  M.pallet.roughness = 0.95;
  M.chair.roughness = 0.7;
  M.wrap.roughness = 0.35;
  M.wrap.environmentIntensity = 0.8;
})();
