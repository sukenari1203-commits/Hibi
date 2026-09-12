import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

export const SHORELINE = -6;
export const COAST = 34;

export function heightAt(x, z) {
  const lateral = Math.sin(x * 0.12) * 0.05 + Math.cos(x * 0.045 + z * 0.05) * 0.04;
  if (z < 6) return 0.03 + Math.sin(x * 0.22 + z * 0.18) * 0.02 + lateral;
  if (z < COAST) {
    const t = (z - 6) / (COAST - 6);
    const dune = Math.sin(x * 0.085 + z * 0.07) * 0.12 + Math.cos(x * 0.16 - z * 0.05) * 0.08;
    return 0.08 + t * 0.72 + dune * (0.35 + t * 0.65) + lateral;
  }
  const inland = z - COAST;
  return 0.9 + Math.min(11.2, inland * 0.155) + Math.sin(x * 0.105) * 0.68 + Math.sin(z * 0.083 + x * 0.037) * 0.5 + Math.cos(x * 0.041 - z * 0.062) * 0.38 + Math.sin(x * 0.19 + z * 0.11) * 0.16;
}

export function createWorld(scene) {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(460, 28, 14), new THREE.MeshBasicMaterial({color:0x89a1a8,side:THREE.BackSide}));
  scene.add(sky);
  scene.fog = new THREE.FogExp2(0xaab4af, 0.0036);
  scene.add(new THREE.HemisphereLight(0xdce8e7, 0x453f31, 1.55));
  const sun = new THREE.DirectionalLight(0xffe8bd, 2.85);
  sun.position.set(-65,105,42); sun.castShadow = true; sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-120; sun.shadow.camera.right=120; sun.shadow.camera.top=120; sun.shadow.camera.bottom=-120; sun.shadow.bias=-0.0004; scene.add(sun);

  const water = new THREE.Mesh(new THREE.PlaneGeometry(132,98,40,30).rotateX(-Math.PI/2), new THREE.MeshStandardMaterial({color:0x325c69,roughness:0.24,metalness:0.08}));
  water.position.set(0,-0.18,-56); scene.add(water);

  const beachGeo = new THREE.PlaneGeometry(132,40,80,26); beachGeo.rotateX(-Math.PI/2);
  const bp = beachGeo.attributes.position;
  for(let i=0;i<bp.count;i++){const x=bp.getX(i),wz=bp.getZ(i)+14;bp.setY(i,heightAt(x,wz));}
  beachGeo.computeVertexNormals();
  const beach = new THREE.Mesh(beachGeo,new THREE.MeshStandardMaterial({color:0xc0ad82,roughness:0.98}));
  beach.position.set(0,0,14); beach.receiveShadow=true; beach.userData.ground=true; scene.add(beach);

  const wetGeo = new THREE.PlaneGeometry(132,14,80,12); wetGeo.rotateX(-Math.PI/2);
  const wp = wetGeo.attributes.position;
  for(let i=0;i<wp.count;i++){const x=wp.getX(i),wz=wp.getZ(i)+1;wp.setY(i,heightAt(x,wz)+0.018);}
  wetGeo.computeVertexNormals();
  const wetSand = new THREE.Mesh(wetGeo,new THREE.MeshStandardMaterial({color:0x9f8d67,roughness:0.88,metalness:0.04}));
  wetSand.position.set(0,0,1); wetSand.receiveShadow=true; scene.add(wetSand);

  for(let i=0;i<9;i++){const foam=new THREE.Mesh(new THREE.PlaneGeometry(126-i*3.2,0.42).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xe9ece4,transparent:true,opacity:0.18+Math.random()*0.16}));foam.position.set((Math.random()-0.5)*4,0.09,-2.5+i*1.4+Math.sin(i)*0.4);scene.add(foam);}

  const landGeo = new THREE.PlaneGeometry(132,90,90,64); landGeo.rotateX(-Math.PI/2);
  const p=landGeo.attributes.position, colors=[];
  for(let i=0;i<p.count;i++){
    const x=p.getX(i), wz=p.getZ(i)+79, y=heightAt(x,wz); p.setY(i,y);
    const dryness=Math.min(1,Math.max(0,(wz-COAST)/24)), variation=(Math.sin(x*0.65+wz*0.34)+1)*0.015;
    colors.push(0.44-dryness*0.1+variation,0.5-dryness*0.07+variation,0.31-dryness*0.12+variation);
  }
  landGeo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(colors),3)); landGeo.computeVertexNormals();
  const land=new THREE.Mesh(landGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));
  land.position.set(0,0,79); land.receiveShadow=true; land.userData.ground=true; scene.add(land);

  addBeachDetails(scene); addRoadsAndHedges(scene); addTrees(scene); addDefenses(scene); addShips(scene);
  const carrier=createCarrier(scene,0,-68); createEscort(scene,-42,-61,0.92); createEscort(scene,38,-72,1.0); createEscort(scene,54,-58,0.72);
  return {land,beach,water,carrier};
}

function addBeachDetails(scene){
  const obstacleMat=new THREE.MeshStandardMaterial({color:0x454942,roughness:0.72,metalness:0.34});
  for(let i=0;i<34;i++){
    const z=-1+(i%4)*5.4+Math.random()*2.1,x=-58+(i*4.1)%116+(Math.random()-0.5)*2.5,g=new THREE.Group();
    for(let j=0;j<3;j++){const beam=new THREE.Mesh(new THREE.BoxGeometry(0.24,3.9,0.24),obstacleMat);beam.rotation.z=j*Math.PI/3+(Math.random()-0.5)*0.04;beam.castShadow=true;g.add(beam);}
    g.position.set(x,heightAt(x,z)+0.92,z);g.rotation.y=Math.random()*Math.PI;scene.add(g);
  }
  const craterMat=new THREE.MeshStandardMaterial({color:0x564b37,roughness:1,side:THREE.DoubleSide});
  for(let i=0;i<42;i++){const x=-60+Math.random()*120,z=-2+Math.random()*37,s=0.6+Math.random()*1.55,ring=new THREE.Mesh(new THREE.RingGeometry(0.45*s,1.6*s,18).rotateX(-Math.PI/2),craterMat);ring.position.set(x,heightAt(x,z)+0.07,z);ring.rotation.z=Math.random()*Math.PI;scene.add(ring);}
  const duneMat=new THREE.MeshStandardMaterial({color:0xc9ba93,roughness:1});
  for(let i=0;i<26;i++){const mound=new THREE.Mesh(new THREE.SphereGeometry(1.1+Math.random()*1.8,8,6,0,Math.PI*2,0,Math.PI*0.6),duneMat),x=-59+Math.random()*118,z=12+Math.random()*21;mound.position.set(x,heightAt(x,z)+0.12,z);mound.scale.set(1.6+Math.random()*1.3,0.55+Math.random()*0.22,1.2+Math.random()*0.8);mound.rotation.y=Math.random()*Math.PI;mound.castShadow=true;mound.receiveShadow=true;scene.add(mound);}
  const rockMat=new THREE.MeshStandardMaterial({color:0x7c7669,roughness:1});
  for(let i=0;i<46;i++){const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(0.16+Math.random()*0.34,0),rockMat),x=-63+Math.random()*126,z=-5+Math.random()*18;rock.position.set(x,heightAt(x,z)+0.09,z);rock.scale.y*=0.55;rock.rotation.set(Math.random(),Math.random(),Math.random());rock.castShadow=true;scene.add(rock);}
}

function addRoadsAndHedges(scene){
  const hedgeMat=new THREE.MeshStandardMaterial({color:0x294228,roughness:1});
  for(const [x,z,w,d,r] of [[-31,44,42,1.8,0.05],[28,48,46,1.8,-0.04],[-33,61,38,1.8,-0.03],[31,69,44,1.8,0.06],[-15,79,22,1.8,0.03],[18,84,25,1.8,-0.02]]){const h=new THREE.Mesh(new THREE.BoxGeometry(w,2.5,d),hedgeMat);h.position.set(x,heightAt(x,z)+1.2,z);h.rotation.y=r;h.castShadow=true;h.receiveShadow=true;scene.add(h);}
  for(const x of [-46,-18,8,42]){const h=new THREE.Mesh(new THREE.BoxGeometry(1.7,2.35,50),hedgeMat);h.position.set(x,heightAt(x,57)+1.18,57);h.castShadow=true;h.receiveShadow=true;scene.add(h);}
  const roadMat=new THREE.MeshStandardMaterial({color:0x72695a,roughness:1});
  for(const [x,z,w,d,r] of [[-7,56,4.6,74,0.09],[29,64,3.8,56,-0.38]]){const road=new THREE.Mesh(new THREE.PlaneGeometry(w,d).rotateX(-Math.PI/2),roadMat);road.position.set(x,heightAt(x,z)+0.08,z);road.rotation.y=r;road.receiveShadow=true;scene.add(road);}
}

function addTrees(scene){
  const trunkMat=new THREE.MeshStandardMaterial({color:0x493725,roughness:1}),leafMat=new THREE.MeshStandardMaterial({color:0x39533a,roughness:1});
  for(let i=0;i<72;i++){const z=36+Math.random()*70,x=-61+Math.random()*122;if(Math.abs(x+7)<6&&z<92)continue;if(z<55&&Math.random()<0.28)continue;const t=new THREE.Group(),tr=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.28,2.3,6),trunkMat);tr.position.y=1.15;tr.castShadow=true;t.add(tr);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.3+Math.random()*0.65,1),leafMat);crown.position.y=3+Math.random()*0.2;crown.scale.set(1,1.25+Math.random()*0.25,1);crown.castShadow=true;t.add(crown);t.position.set(x,heightAt(x,z),z);scene.add(t);}
}

function addDefenses(scene){
  const concrete=new THREE.MeshStandardMaterial({color:0x5d6058,roughness:1});
  for(const [x,z] of [[-42,40],[-18,36],[10,38],[38,42]]){const g=new THREE.Group(),base=new THREE.Mesh(new THREE.BoxGeometry(8.8,3,5.8),concrete);base.position.y=1.5;base.castShadow=true;g.add(base);const roof=new THREE.Mesh(new THREE.BoxGeometry(10,0.7,6.8),concrete);roof.position.y=3.2;roof.castShadow=true;g.add(roof);const slit=new THREE.Mesh(new THREE.BoxGeometry(4.2,0.45,0.25),new THREE.MeshBasicMaterial({color:0x151716}));slit.position.set(0,1.78,-2.95);g.add(slit);g.position.set(x,heightAt(x,z),z);g.rotation.y=Math.PI;scene.add(g);}
}

function addShips(scene){for(let i=0;i<4;i++){const wave=new THREE.Mesh(new THREE.PlaneGeometry(18+i*2,0.3).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xb9c8cb,transparent:true,opacity:0.1}));wave.position.set((i-1.5)*20,-0.09,-42-i*7);scene.add(wave);}}

function createCarrier(scene,x,z){
  const g=new THREE.Group(),hullMat=new THREE.MeshStandardMaterial({color:0x3b474d,roughness:0.58,metalness:0.26}),deckMat=new THREE.MeshStandardMaterial({color:0x5b6569,roughness:0.9}),darkMat=new THREE.MeshStandardMaterial({color:0x253137,roughness:0.6,metalness:0.3});
  const hull=new THREE.Mesh(new THREE.BoxGeometry(52,4.2,8.2),hullMat);hull.position.y=1.45;hull.castShadow=true;g.add(hull);
  const bow=new THREE.Mesh(new THREE.CylinderGeometry(0.2,4.1,10,4,1),hullMat);bow.rotation.z=-Math.PI/2;bow.rotation.y=Math.PI/4;bow.position.set(29,1.5,0);bow.castShadow=true;g.add(bow);
  const stern=new THREE.Mesh(new THREE.BoxGeometry(4,3.2,7.4),hullMat);stern.position.set(-26.5,1.8,0);stern.castShadow=true;g.add(stern);
  const deck=new THREE.Mesh(new THREE.BoxGeometry(58,0.55,12.4),deckMat);deck.position.y=4.15;deck.castShadow=true;g.add(deck);
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(42,0.04,0.18),new THREE.MeshBasicMaterial({color:0xe7e1c6}));stripe.position.set(2,4.45,0);g.add(stripe);
  for(const xx of [-15,0,15]){const cross=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.04,3.3),new THREE.MeshBasicMaterial({color:0xe7e1c6}));cross.position.set(xx,4.45,0);g.add(cross);}
  const island=new THREE.Mesh(new THREE.BoxGeometry(6.5,8.4,4.2),hullMat);island.position.set(8,8.1,3.7);island.castShadow=true;g.add(island);
  const bridge=new THREE.Mesh(new THREE.BoxGeometry(7.4,1.3,4.8),hullMat);bridge.position.set(8.2,12.25,3.5);bridge.castShadow=true;g.add(bridge);
  const funnel=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.7,5.2,8),darkMat);funnel.position.set(4.4,12.3,3.2);funnel.castShadow=true;g.add(funnel);
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.2,9.6,6),darkMat);mast.position.set(8.7,16.5,3.55);mast.castShadow=true;g.add(mast);
  const radar1=new THREE.Mesh(new THREE.BoxGeometry(4.2,0.16,1.2),darkMat);radar1.position.set(8.7,19.4,3.55);g.add(radar1);const radar2=new THREE.Mesh(new THREE.BoxGeometry(2.2,0.16,3.2),darkMat);radar2.position.set(8.7,17.4,3.55);g.add(radar2);
  for(const zz of [-5.1,5.1])for(const xx of [-19,-8,5,18]){const base=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.42,0.35,8),darkMat);base.position.set(xx,4.2,zz);g.add(base);const gun=new THREE.Mesh(new THREE.BoxGeometry(2.8,0.28,0.28),darkMat);gun.position.set(xx+(zz>0?0.2:-0.2),4.45,zz);gun.rotation.y=zz>0?0.08:Math.PI-0.08;g.add(gun);}
  g.position.set(x,0,z);scene.add(g);return g;
}

function createEscort(scene,x,z,s){const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0x354247,roughness:0.7,metalness:0.18}),h=new THREE.Mesh(new THREE.BoxGeometry(13*s,1.8*s,3.4*s),m);h.position.y=0.7*s;g.add(h);const c=new THREE.Mesh(new THREE.BoxGeometry(3*s,2.2*s,2.2*s),m);c.position.set(1.2*s,2.4*s,0);g.add(c);g.position.set(x,0,z);scene.add(g);}
