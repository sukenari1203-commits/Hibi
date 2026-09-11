let mod;
let primaryError;
try {
  mod = await import('https://unpkg.com/three@0.180.0/build/three.module.js');
} catch (error) {
  primaryError = error;
  try {
    mod = await import('https://esm.sh/three@0.180.0');
  } catch (fallbackError) {
    throw new Error(`Three.js CDN load failed. primary=${primaryError?.message || primaryError}; fallback=${fallbackError?.message || fallbackError}`);
  }
}

export const WebGLRenderer=mod.WebGLRenderer,SRGBColorSpace=mod.SRGBColorSpace,ACESFilmicToneMapping=mod.ACESFilmicToneMapping,Scene=mod.Scene,PerspectiveCamera=mod.PerspectiveCamera,Vector3=mod.Vector3,MathUtils=mod.MathUtils,BufferGeometry=mod.BufferGeometry,BufferAttribute=mod.BufferAttribute,LineSegments=mod.LineSegments,LineBasicMaterial=mod.LineBasicMaterial,Points=mod.Points,PointsMaterial=mod.PointsMaterial,Raycaster=mod.Raycaster,Vector2=mod.Vector2,Mesh=mod.Mesh,SphereGeometry=mod.SphereGeometry,MeshBasicMaterial=mod.MeshBasicMaterial,BackSide=mod.BackSide,FogExp2=mod.FogExp2,HemisphereLight=mod.HemisphereLight,DirectionalLight=mod.DirectionalLight,MeshStandardMaterial=mod.MeshStandardMaterial,PlaneGeometry=mod.PlaneGeometry,BoxGeometry=mod.BoxGeometry,Group=mod.Group,CylinderGeometry=mod.CylinderGeometry,IcosahedronGeometry=mod.IcosahedronGeometry,RingGeometry=mod.RingGeometry,DoubleSide=mod.DoubleSide,ConeGeometry=mod.ConeGeometry,CapsuleGeometry=mod.CapsuleGeometry,Object3D=mod.Object3D,InstancedMesh=mod.InstancedMesh,DynamicDrawUsage=mod.DynamicDrawUsage;
