import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

export const SHORE_Z = -8;
export const WET_END_Z = 0;
export const LAND_START_Z = 28;
export const COAST = LAND_START_Z;

export function heightAt(x,z){
  if(z<LAND_START_Z)return 0;
  const i=z-LAND_START_Z;
  const ramp=THREE.MathUtils.smoothstep(Math.min(i,8),0,8);
  const relief=.7+Math.min(9,i*.13)+Math.sin(x*.105)*.65+Math.sin(z*.083+x*.037)*.48+Math.cos(x*.041-z*.062)*.36;
  return Math.max(0,ramp*relief);
}

function planeBand(width,z0,z1,material,y=.02){
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,z1-z0).rotateX(-Math.PI/2),material);
  mesh.position.set(0,y,(z0+z1)/2);
  mesh.receiveShadow=true;
  mesh.userData.ground=true;
  return mesh;
}

function addSurf(scene){
  const foamMat=new THREE.MeshBasicMaterial({color:0xf4f1e7,transparent:true,opacity:.72,depthWrite:false});
  const foamSoft=new THREE.MeshBasicMaterial({color:0xe8efeb,transparent:true,opacity:.34,depthWrite:false});
  for(const [offset,width,mat] of [[-.35,.34,foamSoft],[.08,.22,foamMat],[.52,.15,foamSoft]]){
    const strip=new THREE.Mesh(new THREE.PlaneGeometry(128,width).rotateX(-Math.PI/2),mat);
    strip.position.set(0,.075,SHORE_Z+offset);
    scene.add(strip);
  }
}

export function createWorld(scene){
  const sky=new THREE.Mesh(new THREE.SphereGeometry(420,24,12),new THREE.MeshBasicMaterial({color:0x8aa0a5,side:THREE.BackSide}));
  scene.add(sky);
  scene.fog=new THREE.FogExp2(0xaab4af,.0038);
  scene.add(new THREE.HemisphereLight(0xdce8e7,0x453f31,1.55));
  const sun=new THREE.DirectionalLight(0xffe8bd,2.7);
  sun.position.set(-65,105,42);
  sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-110;
  sun.shadow.camera.right=110;
  sun.shadow.camera.top=110;
  sun.shadow.camera.bottom=-110;
  scene.add(sun);

  const waterMat=new THREE.MeshStandardMaterial({color:0x315e6c,roughness:.28,metalness:.05});
  const water=planeBand(128,-82,SHORE_Z,waterMat,-.18);
  water.userData.ground=false;
  scene.add(water);

  const wetMat=new THREE.MeshStandardMaterial({color:0x8f856d,roughness:.82,metalness:.02});
  const wetBeach=planeBand(128,SHORE_Z,WET_END_Z,wetMat,.035);
  scene.add(wetBeach);

  const sandMat=new THREE.MeshStandardMaterial({color:0xc5b17f,roughness:1});
  const beach=planeBand(128,SHORE_Z,LAND_START_Z,sandMat,.025);
  scene.add(beach);

  addSurf(scene);

  const landDepth=72;
  const landCenter=LAND_START_Z+landDepth/2;
  const g=new THREE.PlaneGeometry(128,landDepth,72,42);
  g.rotateX(-Math.PI/2);
  const p=g.attributes.position;
  for(let n=0;n<p.count;n++){
    const x=p.getX(n),z=p.getZ(n)+landCenter;
    p.setY(n,heightAt(x,z));
  }
  g.computeVertexNormals();
  const land=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x65764f,roughness:1}));
  land.position.z=landCenter;
  land.receiveShadow=true;
  land.userData.ground=true;
  scene.add(land);

  const hedgeMat=new THREE.MeshStandardMaterial({color:0x294228,roughness:1});
  for(const z of [40,55,70,85])for(const x of [-30,30]){
    const h=new THREE.Mesh(new THREE.BoxGeometry(40,2.3,1.5),hedgeMat);
    h.position.set(x,heightAt(x,z)+1.1,z);
    h.castShadow=true;
    scene.add(h);
  }

  const roadMat=new THREE.MeshStandardMaterial({color:0x746b5d,roughness:1});
  for(const [x,z,r] of [[-6,50,.08],[30,61,-.4]]){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(4,66).rotateX(-Math.PI/2),roadMat);
    m.position.set(x,heightAt(x,z)+.08,z);
    m.rotation.y=r;
    scene.add(m);
  }

  for(let i=0;i<55;i++){
    const z=34+Math.random()*60,x=-58+Math.random()*116;
    if(Math.abs(x+6)<6)continue;
    const t=new THREE.Group();
    const tr=new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,2.2,6),new THREE.MeshStandardMaterial({color:0x493725}));
    tr.position.y=1.1;t.add(tr);
    const cr=new THREE.Mesh(new THREE.IcosahedronGeometry(1.4,1),new THREE.MeshStandardMaterial({color:0x39533a}));
    cr.position.y=3;t.add(cr);
    t.position.set(x,heightAt(x,z),z);
    scene.add(t);
  }

  for(let i=0;i<28;i++){
    const x=-55+Math.random()*110,z=SHORE_Z+2+Math.random()*(LAND_START_Z-SHORE_Z-4);
    const c=new THREE.Mesh(new THREE.RingGeometry(.4,1.5,16).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:0x453d31,side:THREE.DoubleSide}));
    c.position.set(x,.06,z);
    scene.add(c);
  }

  for(let i=0;i<22;i++){
    const o=new THREE.Group();
    const mat=new THREE.MeshStandardMaterial({color:0x414641,metalness:.3});
    for(let j=0;j<3;j++){
      const b=new THREE.Mesh(new THREE.BoxGeometry(.22,3.4,.22),mat);
      b.rotation.z=j*Math.PI/3;
      o.add(b);
    }
    o.position.set(-57+i*5.3,.8,SHORE_Z+5+(i%3)*4);
    scene.add(o);
  }

  for(const [x,z] of [[-40,31],[-14,30],[17,30],[44,31]]){
    const b=new THREE.Group();
    const mat=new THREE.MeshStandardMaterial({color:0x5d6058,roughness:1});
    const q=new THREE.Mesh(new THREE.BoxGeometry(8,2.8,5),mat);
    q.position.y=1.4;b.add(q);
    const roof=new THREE.Mesh(new THREE.BoxGeometry(9,.65,6),mat);
    roof.position.y=2.95;b.add(roof);
    b.position.set(x,heightAt(x,z),z);
    b.rotation.y=Math.PI;
    scene.add(b);
  }

  const carrier=createCarrier(scene,0,-55);
  createEscort(scene,-39,-48,.82);
  createEscort(scene,36,-58,.9);
  createEscort(scene,50,-44,.68);
  return{land,beach,wetBeach,water,carrier};
}

function createCarrier(scene,x,z){
  const g=new THREE.Group(),
    steel=new THREE.MeshStandardMaterial({color:0x3b474d,roughness:.58,metalness:.26}),
    deckM=new THREE.MeshStandardMaterial({color:0x596368,roughness:.9}),
    dark=new THREE.MeshStandardMaterial({color:0x253137,roughness:.6,metalness:.3});
  const hull=new THREE.Mesh(new THREE.BoxGeometry(40,3.5,6.4),steel);
  hull.position.y=1.25;hull.castShadow=true;g.add(hull);
  const bow=new THREE.Mesh(new THREE.ConeGeometry(3.2,7,4),steel);
  bow.rotation.z=-Math.PI/2;bow.rotation.y=Math.PI/4;bow.position.set(22,1.3,0);g.add(bow);
  const deck=new THREE.Mesh(new THREE.BoxGeometry(45,.55,10.5),deckM);
  deck.position.y=3.45;g.add(deck);
  const island=new THREE.Mesh(new THREE.BoxGeometry(5.4,7,3.4),steel);
  island.position.set(5.5,6.9,3.1);g.add(island);
  const bridge=new THREE.Mesh(new THREE.BoxGeometry(6.2,1.2,4),steel);
  bridge.position.set(5.2,10.1,2.9);g.add(bridge);
  const funnel=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.4,4.6,8),dark);
  funnel.position.set(2.8,11.2,2.6);g.add(funnel);
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,7.5,6),dark);
  mast.position.set(6,14,2.8);g.add(mast);
  const radar=new THREE.Mesh(new THREE.BoxGeometry(3.8,.14,1.1),dark);
  radar.position.set(6,17,2.8);g.add(radar);
  for(const zz of [-4.1,4.1])for(const xx of [-14,-4,12]){
    const gun=new THREE.Mesh(new THREE.BoxGeometry(2.6,.25,.25),dark);
    gun.position.set(xx,4,zz);gun.rotation.y=zz>0?0:Math.PI;g.add(gun);
  }
  for(const xx of [-14,-2,10]){
    const line=new THREE.Mesh(new THREE.BoxGeometry(9,.03,.13),new THREE.MeshBasicMaterial({color:0xe8e3c7}));
    line.position.set(xx,3.76,0);g.add(line);
  }
  g.position.set(x,0,z);scene.add(g);return g;
}

function createEscort(scene,x,z,s){
  const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0x354247,roughness:.7,metalness:.18});
  const h=new THREE.Mesh(new THREE.BoxGeometry(13*s,1.8*s,3.4*s),m);
  h.position.y=.7*s;g.add(h);
  const c=new THREE.Mesh(new THREE.BoxGeometry(3*s,2.2*s,2.2*s),m);
  c.position.set(1.2*s,2.4*s,0);g.add(c);
  g.position.set(x,0,z);scene.add(g);
}
