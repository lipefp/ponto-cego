// @ts-check
/* =====================================================================
   FÁBRICA DO MOTOR — ponto único de criação do motor de renderização.
   Hoje: WebGL2 (WebGL1 como último recurso, automático no Babylon).
   WebGPU foi avaliado e ficou para depois (ver NOTAS_RETOMADA.md, seção v4): o plugin de
   material "Look" (10b-light) e o céu usam GLSL próprio sem versão WGSL, e
   o modo offline exigiria embutir glslang+twgsl (~3 MB de WASM) só para
   converter esses shaders. Quando houver WGSL, basta acrescentar o ramo
   'webgpu' aqui (WebGPUEngine + initAsync, com volta automática ao WebGL2).
   ===================================================================== */

/** @type {readonly string[]} */
export const RENDERERS = Object.freeze(['webgl2']);

/**
 * @param {any} B BABYLON
 * @param {HTMLCanvasElement} canvas
 * @param {{antialias?:boolean}} [opts]
 * @returns {{engine:any, info:{renderer:string, webgl:number, gpu:string}}}
 */
export function createEngine(B, canvas, opts) {
  const engine = new B.Engine(
    canvas,
    opts && opts.antialias === false ? false : true,
    { stencil: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' },
    true
  );
  let gpu = '';
  try {
    const gl = engine._gl;
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    gpu = ext
      ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
      : String(engine.getGlInfo().renderer || '');
  } catch (e) {
    /* sem info */
  }
  return {
    engine,
    info: { renderer: 'webgl' + (engine.webGLVersion || 2), webgl: engine.webGLVersion || 2, gpu },
  };
}
