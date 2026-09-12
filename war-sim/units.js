import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

export function createLandingCraft(scene,x,z){const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:0x656c63,roughness:0.9}),hull=new THREE.Mesh(new THREE.BoxGeometry(4.2,1.1,7.2),mat);hull.position.y=0.45;hull.castShadow=true;g.add(hull);const bay=new THREE.Mesh(new THREE.BoxGeometry(3.1,0.25,4.8),new THREE.MeshStandardMaterial({color:0x343a35}));bay.position.set(0,1,0.1);g.add(bay);for(let i=0;i<10;i++){const p=new THREE.Mesh(new THREE.CapsuleGeometry(0.12,0.34,3,5),new THREE.MeshStandardMaterial({color:0x536249}));p.position.set(((i%2)*2-1)*0.58,1.12,(Math.floor(i/2)-2)*0.78);p.castShadow=true;g.add(p);}g.position.set(x,0,z);scene.add(g);return g;}

const geo={torso:new THREE.BoxGeometry(0.38,0.65,0.24),head:new THREE.SphereGeometry(0.17,7,6),helmet:new THREE.SphereGeometry(0.205,8,6,0,Math.PI*2,0,Math.PI*0.63),arm:new THREE.CylinderGeometry(0.055,0.07,0.55,5),leg:new THREE.CylinderGeometry(0.065,0.08,0.66,5),gun:new THREE.BoxGeometry(0.11,0.11,0.72),barrel:new THREE.CylinderGeometry(0.027,0.027,0.72,5)};
const mat={uniform:new THREE.MeshStandardMaterial({color:0x59684d,roughness:0.94}),skin:new THREE.MeshStandardMaterial({color:0xb98e68}),helmet:new THREE.MeshStandardMaterial({color:0x4b5943}),boot:new THREE.MeshStandardMaterial({color:0x343126}),gun:new THREE.MeshStandardMaterial({color:0x3a3026}),metal:new THREE.MeshStandardMaterial({color:0x242729,metalness:0.5})};
const dummy=new THREE.Object3D();
function inst(mesh,i,x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1){dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}

export function createCompany(scene,id,x,z,heightAt){
  const root=new THREE.Group();root.userData.type='company';root.userData.id=id;
  const N=193,meshes={torso:new THREE.InstancedMesh(geo.torso,mat.uniform,N),head:new THREE.InstancedMesh(geo.head,mat.skin,N),helmet:new THREE.InstancedMesh(geo.helmet,mat.helmet,N),la:new THREE.InstancedMesh(geo.arm,mat.uniform,N),ra:new THREE.InstancedMesh(geo.arm,mat.uniform,N),ll:new THREE.InstancedMesh(geo.leg,mat.boot,N),rl:new THREE.InstancedMesh(geo.leg,mat.boot,N),gun:new THREE.InstancedMesh(geo.gun,mat.gun,N),barrel:new THREE.InstancedMesh(geo.barrel,mat.metal,N)};
  Object.values(meshes).forEach(m=>{m.castShadow=true;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(m);});
  const soldiers=[];
  for(let i=0;i<N;i++){
    const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*(10+Math.random()*7.5),sx=Math.cos(a)*r+(Math.random()-0.5)*1.8,sz=Math.sin(a)*r*0.76+(Math.random()-0.5)*1.8;
    let weapon='M1 Garand';if(i%22===0)weapon='BAR';else if(i%31===0||i<6)weapon='Thompson';
    const q=Math.random(),behavior=q<0.2?'crawl':q<0.48?'cover':q<0.7?'prone':'run',angle=-0.55+Math.random()*1.1,distance=behavior==='run'?15+Math.random()*18:behavior==='cover'?11+Math.random()*13:5+Math.random()*10;
    soldiers.push({x:sx,z:sz,tx:sx+Math.sin(angle)*distance,tz:sz+Math.cos(angle)*distance+12+Math.random()*12,phase:Math.random()*Math.PI*2,weapon,behavior,posture:'run',speed:1+Math.random()*1.9,settled:false,thinkAt:0,nextShot:0,lastShot:-999,lift:0.05+Math.random()*0.02});
  }
  const ring=new THREE.Mesh(new THREE.RingGeometry(18,18.45,64).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xf2dc94,transparent:true,opacity:0.82,side:THREE.DoubleSide}));ring.position.y=0.09;ring.visible=false;root.add(ring);
  root.position.set(x,heightAt(x,z),z);
  Object.assign(root.userData,{ring,meshes,soldiers,heightAt,target:new THREE.Vector3(x,heightAt(x,z),z),state:'landingScatter',landedAt:performance.now(),speed:4.4,attackPoint:null,fireUntil:0});
  scene.add(root);updateCompanyVisual(root,0,0);return root;
}

export function updateCompanyVisual(root,now,motion){
  const {meshes,soldiers,state,heightAt}=root.userData,firing=state==='fire'&&now<root.userData.fireUntil,yaw=root.rotation.y,cos=Math.cos(yaw),sin=Math.sin(yaw),centerY=root.position.y;
  for(let i=0;i<soldiers.length;i++){
    const s=soldiers[i];
    if(state==='landingScatter'&&!s.settled){const dx=s.tx-s.x,dz=s.tz-s.z,d=Math.hypot(dx,dz);if(d>0.16){const p=(s.behavior==='crawl'?0.42:s.speed)*0.018;s.x+=dx/d*p;s.z+=dz/d*p;}else{s.settled=true;s.posture=s.behavior==='run'?(Math.random()<0.55?'cover':'prone'):s.behavior;s.thinkAt=now+1800+Math.random()*5200;}}
    else if(state==='landingScatter'&&s.settled&&now>s.thinkAt&&Math.random()<0.018){s.thinkAt=now+2500+Math.random()*5500;if(s.posture==='cover'&&Math.random()<0.45)s.posture='prone';else if(s.posture==='prone'&&Math.random()<0.35)s.posture='crawl';}

    const moving=motion||(state==='landingScatter'&&!s.settled),crawl=s.posture==='crawl'||(moving&&s.behavior==='crawl'),prone=s.posture==='prone',cover=s.posture==='cover',walk=moving?Math.sin(now*0.008+s.phase):0,bob=moving&&!crawl?Math.abs(Math.sin(now*0.008+s.phase))*0.045:0,recoil=Math.max(0,1-(now-s.lastShot)/95);
    const worldX=root.position.x+s.x*cos+s.z*sin,worldZ=root.position.z-s.x*sin+s.z*cos,groundDelta=heightAt(worldX,worldZ)-centerY,support=groundDelta+s.lift;

    if(prone||crawl){
      const y=support+0.16+bob;
      inst(meshes.torso,i,s.x,y+0.22,s.z,Math.PI/2-0.05);inst(meshes.head,i,s.x,y+0.22,s.z-0.38,Math.PI/2);inst(meshes.helmet,i,s.x,y+0.24,s.z-0.42,Math.PI/2,0,0,1.08,0.82,1.08);
      const sw=crawl?Math.sin(now*0.006+s.phase)*0.35:0;inst(meshes.ll,i,s.x-0.13,y+0.08,s.z+0.35,Math.PI/2+sw);inst(meshes.rl,i,s.x+0.13,y+0.08,s.z+0.35,Math.PI/2-sw);inst(meshes.la,i,s.x-0.24,y+0.18,s.z-0.24,Math.PI/2+0.2);inst(meshes.ra,i,s.x+0.24,y+0.18,s.z-0.24,Math.PI/2+0.12);
      const gl=s.weapon==='BAR'?1.25:s.weapon==='Thompson'?0.7:1;inst(meshes.gun,i,s.x+0.05,y+0.25,s.z-0.7+recoil*0.05,Math.PI/2,0,0,1,1,gl);inst(meshes.barrel,i,s.x+0.05,y+0.25,s.z-1.08*gl,Math.PI/2,0,0,1,gl,1);
    }else{
      const crouch=cover?0.42:0,y=support+bob-crouch;
      inst(meshes.torso,i,s.x,0.98+y,s.z,recoil*0.03,0,0,1,cover?0.78:1,1);inst(meshes.head,i,s.x,1.48+y,s.z);inst(meshes.helmet,i,s.x,1.61+y,s.z,0,0,0,1.08,0.82,1.08);inst(meshes.ll,i,s.x-0.11,0.41+y,s.z,walk*0.48);inst(meshes.rl,i,s.x+0.11,0.41+y,s.z,-walk*0.48);
      let al=-walk*0.42,ar=walk*0.42;if(firing){al=1.08;ar=1.16;}inst(meshes.la,i,s.x-0.27,1.03+y,s.z-0.05,al);inst(meshes.ra,i,s.x+0.27,1.03+y,s.z-0.05,ar);
      const gl=s.weapon==='BAR'?1.25:s.weapon==='Thompson'?0.7:1;inst(meshes.gun,i,s.x+0.05,1.15+y,s.z-0.43+recoil*0.06,0,0,0,1,1,gl);inst(meshes.barrel,i,s.x+0.05,1.15+y,s.z-0.88*gl,Math.PI/2,0,0,1,gl,1);
    }
  }
  Object.values(meshes).forEach(m=>m.instanceMatrix.needsUpdate=true);
}
