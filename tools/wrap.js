// envolve todos os nós da cena num nó-pai com o nome do arquivo (para achar o modelo pelo nome depois do merge)
const {NodeIO}=require('@gltf-transform/core');const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');const path=require('path');
(async()=>{const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);for(const f of process.argv.slice(2)){const d=await io.read(f);const s=d.getRoot().listScenes()[0];const name=path.basename(f,'.glb');
  const kids=s.listChildren();const root=d.createNode(name);for(const k of kids){s.removeChild(k);root.addChild(k);}s.addChild(root);await io.write(f,d);}})();
