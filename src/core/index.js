// @ts-check
/* =====================================================================
   NÚCLEO v4 (módulos ES, empacotados pelo esbuild em window.PCCORE)
   O código legado (src/sim, src/render, src/ui, src/main) continua sendo
   concatenado num escopo único (contratos entre áreas inalterados) e usa
   o núcleo por PCCORE.*. Código novo deve nascer aqui, com // @ts-check.
   ===================================================================== */
export { createPhysics, mixamoRagdollConfig, mixamoPrefix } from './physics.js';
export { createEngine, RENDERERS } from './engine.js';
export const VERSION = '6.0.0-beta.9';
