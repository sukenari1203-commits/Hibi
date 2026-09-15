import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const game=document.getElementById('game');
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.setClearColor(0xa9aaa1,1);
renderer.domElement.style.touchAction='none';
game.appendChild(renderer.domElement);

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0xb8b5a9,.0047);
scene.add(new THREE.HemisphereLight(0xdce2dc,0x403b32,1.65));
const sun=new THREE.DirectionalLight(0xffe9c8,2.35);
sun.position.set(-60,80,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-110;sun.shadow.camera.right=110;sun.shadow.camera.top=85;sun.shadow.camera.bottom=-85;scene.add(sun);

const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.1,320);
const SCREEN={station:-50,depot:38};
let view='depot',camX=SCREEN.depot,camGoal=SCREEN.depot;
function updateCamera(){camera.position.set(camX+32,40,48);camera.lookAt(camX,0,1)}
updateCamera();

const mat=(color,roughness=.9,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const M={ground:mat(0xaaa89c,1),road:mat(0x57544d,1),rail:mat(0x393d3c,.55,.35),wood:mat(0x5c4936,.95),olive:mat(0x58624d,.9),dark:mat(0x2d3331,.82),steel:mat(0x4d5554,.7,.28),red:mat(0x74463f,.9),roof:mat(0x383d3c,.8),crate:mat(0x765b3d,.95),canvas:mat(0x7a765f,.98)};
function mesh(geo,material,x=0,y=0,z=0,parent=scene){const o=new THREE.Mesh(geo,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function box(w,h,d,material,x=0,y=0,z=0,parent=scene){return mesh(new THREE.BoxGeometry(w,h,d),material,x,y,z,parent)}
function cyl(rt,rb,h,seg,material,x=0,y=0,z=0,parent=scene){return mesh(new THREE.CylinderGeometry(rt,rb,h,seg),material,x,y,z,parent)}

const ground=mesh(new THREE.PlaneGeometry(210,86).rotateX(-Math.PI/2),M.ground,0,0,0);ground.receiveShadow=true;
box(212,2.2,88,mat(0x4b4942,1),0,-1.25,0);
box(205,.12,10,M.road,0,.07,8);
for(let x=-102;x<103;x+=6){box(2.4,.08,8,mat(0x646058,1),x,.13,8)}
for(let x=-102;x<=102;x+=2.7)box(.17,.16,7.4,M.wood,x,.15,-23);
for(const z of [-24.55,-21.45])box(205,.14,.18,M.rail,0,.28,z);
box(205,.05,7.8,mat(0x6e6a61,1),0,.04,-23);

const labels=[];
function addLabel(text,x,y,z,sub=''){const el=document.createElement('div');el.className='world-label';el.innerHTML=`<strong>${text}</strong>${sub?`<span>${sub}</span>`:''}`;document.getElementById('worldLabels').appendChild(el);labels.push({el,p:new THREE.Vector3(x,y,z)});return el}
function updateLabels(){for(const l of labels){const p=l.p.clone().project(camera);const visible=p.z<1&&Math.abs(p.x)<1.25&&Math.abs(p.y)<1.3;l.el.style.display=visible?'block':'none';if(!visible)continue;l.el.style.left=`${(p.x*.5+.5)*innerWidth}px`;l.el.style.top=`${(-p.y*.5+.5)*innerHeight}px`}}

function building(x,z,w,d,h,wall=M.red,label=''){const g=new THREE.Group();box(w,h,d,wall,0,h/2,0,g);box(w+1,.45,d+1,M.roof,0,h+.12,0,g);for(let i=-1;i<=1;i++){box(1.2,1.5,.12,M.dark,i*w*.24,1.8,-d/2-.07,g)}g.position.set(x,0,z);scene.add(g);if(label)addLabel(label,x,h+1.4,z);return g}

building(-69,-11,18,11,5.7,M.red,'貨物駅');
box(34,.35,8,mat(0x77736b,1),-58,.18,-16);
for(let x=-74;x<=-43;x+=5)box(.35,3.6,.35,M.steel,x,1.8,-13.5);
box(32,.26,.4,M.steel,-58,3.55,-13.5);
addLabel('貨物列車',-59,5,-22,'箱をドラッグしてトラックへ');
addLabel('駅側トラック駐車場',-48,3.2,8,'最大3箱・積載後自動発車');

building(61,-6,17,13,5.4,M.canvas,'補給倉庫');
const assembly=new THREE.Group();
const aring=mesh(new THREE.RingGeometry(7.4,7.8,48).rotateX(-Math.PI/2),mat(0xb7a96b,.8),0,.09,0,assembly);aring.receiveShadow=true;
for(let i=0;i<6;i++){const a=i/6*Math.PI*2;box(.25,1.35,.25,M.steel,Math.cos(a)*7.6,.68,Math.sin(a)*7.6,assembly)}
assembly.position.set(18,0,10);scene.add(assembly);addLabel('集合地点',18,2.5,10,'後で分隊編成に使用');

const storageBase=box(18,.18,13,mat(0x726c58,1),58,.1,10);storageBase.userData.zone='storage';
for(let x=51.5;x<=64.5;x+=4.2)for(let z=6.5;z<=13.5;z+=3.5){const p=new THREE.Group();for(let i=-1;i<=1;i++)box(3.1,.18,.42,M.wood,0,.12,i*.95,p);p.position.set(x,.15,z);scene.add(p)}
addLabel('荷物置き場',58,3.2,10,'箱を置いてタップで開封');
addLabel('補給所トラック駐車場',36,3.2,8,'ここで荷下ろし');

for(const [x,z] of [[28,23],[43,22],[70,20]]){const g=new THREE.Group();box(8,2.8,5,M.canvas,0,1.4,0,g);const r1=box(8.6,.22,3,M.roof,0,3.05,-1.1,g);r1.rotation.x=.35;const r2=box(8.6,.22,3,M.roof,0,3.05,1.1,g);r2.rotation.x=-.35;g.position.set(x,0,z);scene.add(g)}
for(let x=-4;x<=74;x+=13){box(3,.65,.55,M.dark,x,.33,27);box(.35,1.2,.35,M.dark,x-1.3,.6,27);box(.35,1.2,.35,M.dark,x+1.3,.6,27)}

const train=new THREE.Group();
function wheel(x,z,r=.58,parent=train){const w=cyl(r,r,.38,12,M.dark,x,.58,z,parent);w.rotation.x=Math.PI/2;return w}
function makeLocomotive(){const g=new THREE.Group();box(8,.9,3.6,M.dark,0,.72,0,g);const boiler=cyl(1.25,1.25,5.8,14,M.steel,0,2.05,0,g);boiler.rotation.z=Math.PI/2;boiler.position.x=-.5;box(2.6,3.5,3.4,M.red,3.0,2.15,0,g);box(2.1,.35,3.7,M.roof,3.0,4,0,g);cyl(.42,.62,2.2,10,M.dark,-2.35,4.0,0,g);const lamp=cyl(.18,.18,.35,8,mat(0xd6c27b,.55),-3.55,2.25,0,g);lamp.rotation.z=Math.PI/2;for(const x of [-2.8,-.7,1.5,3.1]){wheel(x,-1.65,.72,g);wheel(x,1.65,.72,g)}return g}
function makeFreightCar(offset){const g=new THREE.Group();box(10,.75,4.2,M.dark,0,.72,0,g);box(9.5,.3,3.8,M.wood,0,1.25,0,g);for(const z of [-1.9,1.9]){box(9.6,.75,.18,M.steel,0,1.65,z,g);for(const x of [-4.5,0,4.5])box(.18,1.15,.18,M.steel,x,1.5,z,g)}for(const x of [-3.4,3.4]){wheel(x,-1.7,.62,g);wheel(x,1.7,.62,g)}g.position.x=offset;return g}
train.add(makeLocomotive());train.add(makeFreightCar(-10.8));train.add(makeFreightCar(-21.6));train.add(makeFreightCar(-32.4));train.position.set(-43,0,-23);scene.add(train);
let trainState='parked',trainTimer=0;

function makeTruck(){const g=new THREE.Group();box(8,.5,3.5,M.dark,0,.72,0,g);box(3,2.5,3.2,M.olive,2.25,2.0,0,g);box(2.4,1.05,3.1,M.olive,4.5,1.45,0,g);box(4.3,.24,3.25,M.wood,-1.55,1.45,0,g);for(const z of [-1.55,1.55]){for(const x of [-2.5,2.8])wheelTruck(x,z,g)}box(1.5,.55,.12,mat(0x9ba39e,.35,.12),2.45,2.35,-1.63,g);box(1.5,.55,.12,mat(0x9ba39e,.35,.12),2.45,2.35,1.63,g);return g}
function wheelTruck(x,z,parent){const w=cyl(.72,.72,.42,12,M.dark,x,.72,z,parent);w.rotation.x=Math.PI/2}
const truck={group:makeTruck(),state:'station',cargo:[],departureAt:0,returnAt:0,speed:11};truck.group.position.set(-48,0,8);scene.add(truck.group);

const TYPES={rifle:{label:'小銃箱',short:'小銃',paint:0x6e563a,mark:0xc7b46d},ammo:{label:'弾薬箱',short:'弾薬',paint:0x596044,mark:0xd1c477},grenade:{label:'グレネード箱',short:'グレネード',paint:0x4b5650,mark:0xb4c2a6}};
const crates=[];let crateId=0;
function makeCrate(type){const def=TYPES[type],g=new THREE.Group();box(1.75,1.15,1.35,mat(def.paint,.98),0,.62,0,g);for(const x of [-.7,.7])box(.13,1.2,1.42,M.dark,x,.64,0,g);for(const z of [-.55,.55])box(1.82,.13,.13,M.dark,0,1.03,z,g);const plate=box(.78,.34,.06,mat(def.mark,.82),0,.72,-.705,g);plate.castShadow=false;g.userData.crateRoot=true;return g}
function createCrate(type,x,z,state='train'){const g=makeCrate(type);g.position.set(x,0,z);scene.add(g);const item={id:++crateId,type,group:g,state,slot:-1};g.userData.item=item;crates.push(item);return item}
const trainCargoSlots=[[-58,-22],[-54.8,-22],[-51.6,-22],[-69,-22],[-65.8,-22],[-62.6,-22],[-79.8,-22],[-76.6,-22],[-73.4,-22]];
function spawnTrainCargo(){const types=['rifle','ammo','grenade','rifle','ammo','grenade','rifle','ammo','grenade'];types.forEach((t,i)=>createCrate(t,trainCargoSlots[i][0],trainCargoSlots[i][1],'train'));notify('貨物列車到着。列車の箱をトラックへ積み込め。')}
spawnTrainCargo();

const truckSlots=[[-2.1,2.25,-.95],[-2.1,2.25,.95],[-.35,2.25,0]];
const storageSlots=[];for(let z=6.3;z<=13.7;z+=2.5)for(let x=51.5;x<=64.5;x+=2.8)storageSlots.push([x,z]);
let storageCursor=0;
const opened={rifle:0,ammo:0,grenade:0};

function attachToTruck(item){const slot=truck.cargo.length;if(slot>=truckSlots.length)return false;truck.group.add(item.group);const s=truckSlots[slot];item.group.position.set(s[0],s[1],s[2]);item.group.rotation.set(0,0,0);item.state=truck.state==='depot'?'truckDepot':'truckStation';item.slot=slot;truck.cargo.push(item);truck.departureAt=performance.now()+1500;updateHUD();return true}
function relayoutTruckCargo(){truck.cargo.forEach((item,i)=>{const s=truckSlots[i];if(item.group.parent!==truck.group)truck.group.add(item.group);item.group.position.set(s[0],s[1],s[2]);item.slot=i})}
function moveToStorage(item){const slot=storageSlots[storageCursor++%storageSlots.length];scene.add(item.group);item.group.position.set(slot[0],0,slot[1]);item.group.rotation.set(0,0,0);item.state='storage';item.slot=-1;const i=truck.cargo.indexOf(item);if(i>=0)truck.cargo.splice(i,1);relayoutTruckCargo();if(truck.cargo.length===0)truck.returnAt=performance.now()+900;updateHUD();return true}
function openStorageCrate(item){if(item.state!=='storage')return;opened[item.type]++;scene.remove(item.group);item.state='opened';updateHUD();notify(`${TYPES[item.type].label}を開封 → ${TYPES[item.type].short} +1`)}

const stationTruckZone={x0:-53,x1:-42,z0:3,z1:13};
const depotStorageZone={x0:48,x1:68,z0:3,z1:17};
function inside(p,z){return p.x>=z.x0&&p.x<=z.x1&&p.z>=z.z0&&p.z<=z.z1}

const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
function setRay(e){const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(pointer,camera)}
function itemFromObject(o){while(o&&o!==scene){if(o.userData?.item)return o.userData.item;o=o.parent}return null}
function groundPoint(e){setRay(e);return ray.intersectObject(ground,false)[0]?.point||null}
let drag=null;
renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType!=='touch')return;setRay(e);const hits=ray.intersectObjects(crates.filter(c=>c.state!=='opened').map(c=>c.group),true);if(!hits.length)return;const item=itemFromObject(hits[0].object);if(!item)return;if(item.state==='storage'){drag={item,startX:e.clientX,startY:e.clientY,moved:false,tapOnly:true};renderer.domElement.setPointerCapture?.(e.pointerId);return}if(item.state==='train'&&view!=='station')return;if(item.state==='truckDepot'&&view!=='depot')return;if(!['train','truckDepot'].includes(item.state))return;const world=new THREE.Vector3();item.group.getWorldPosition(world);scene.attach(item.group);item.group.position.copy(world);drag={item,startX:e.clientX,startY:e.clientY,moved:false,originState:item.state,originWorld:world.clone()};item.state='dragging';renderer.domElement.setPointerCapture?.(e.pointerId);document.body.classList.add('dragging')});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag||drag.tapOnly)return;const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;if(Math.hypot(dx,dy)>5)drag.moved=true;const p=groundPoint(e);if(!p)return;drag.item.group.position.set(p.x,.8,p.z)});
function restoreDragged(d){const item=d.item;if(d.originState==='train'){item.state='train';item.group.position.copy(d.originWorld)}else if(d.originState==='truckDepot'){item.state='truckDepot';truck.group.add(item.group);relayoutTruckCargo()}}
renderer.domElement.addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;document.body.classList.remove('dragging');if(d.tapOnly){const moved=Math.hypot(e.clientX-d.startX,e.clientY-d.startY)>7;if(!moved)openStorageCrate(d.item);return}const p=groundPoint(e);if(!p){restoreDragged(d);return}if(d.originState==='train'&&truck.state==='station'&&inside(p,stationTruckZone)&&truck.cargo.length<truckSlots.length){attachToTruck(d.item);notify(`${TYPES[d.item.type].label}をトラックへ積載`);return}if(d.originState==='truckDepot'&&truck.state==='depot'&&inside(p,depotStorageZone)){moveToStorage(d.item);notify(`${TYPES[d.item.type].label}を荷物置き場へ`);return}restoreDragged(d)});
renderer.domElement.addEventListener('pointercancel',()=>{if(drag&&!drag.tapOnly)restoreDragged(drag);drag=null;document.body.classList.remove('dragging')});

const toast=document.getElementById('toast'),screenName=document.getElementById('screenName'),truckStateEl=document.getElementById('truckState'),truckLoadEl=document.getElementById('truckLoad');
const rifleCount=document.getElementById('rifleCount'),ammoCount=document.getElementById('ammoCount'),grenadeCount=document.getElementById('grenadeCount');
const navNext=document.getElementById('navNext'),navPrev=document.getElementById('navPrev');
function notify(t){toast.textContent=t;toast.classList.add('show');clearTimeout(notify.t);notify.t=setTimeout(()=>toast.classList.remove('show'),1800)}
function truckText(){if(truck.state==='station')return truck.cargo.length?'積載中 / 発車待ち':'駅で待機';if(truck.state==='toDepot')return '補給所へ輸送中';if(truck.state==='depot')return truck.cargo.length?'荷下ろし待ち':'荷下ろし完了';return '駅へ帰投中'}
function updateHUD(){screenName.textContent=view==='depot'?'補給所':'貨物駅';truckStateEl.textContent=truckText();truckLoadEl.textContent=`${truck.cargo.length} / 3`;rifleCount.textContent=opened.rifle;ammoCount.textContent=opened.ammo;grenadeCount.textContent=opened.grenade;navNext.classList.toggle('hidden',view==='station');navPrev.classList.toggle('hidden',view==='depot')}
function go(v){view=v;camGoal=SCREEN[v];updateHUD();notify(v==='station'?'貨物駅：列車からトラックへ積み込め':'補給所：トラックから荷物置き場へ降ろせ')}
navNext.addEventListener('click',()=>go('station'));
navPrev.addEventListener('click',()=>go('depot'));
updateHUD();

function updateTruck(dt,now){if(truck.state==='station'&&truck.cargo.length&&now>=truck.departureAt){truck.state='toDepot';truck.departureAt=0;truck.cargo.forEach(c=>c.state='truckTransit');notify('トラック発車 → 補給所へ');updateHUD()}
if(truck.state==='toDepot'){truck.group.position.x=Math.min(36,truck.group.position.x+truck.speed*dt);if(truck.group.position.x>=36){truck.state='depot';truck.cargo.forEach(c=>c.state='truckDepot');notify('トラックが補給所へ到着');updateHUD()}}
if(truck.state==='depot'&&truck.cargo.length===0&&truck.returnAt&&now>=truck.returnAt){truck.state='returning';truck.returnAt=0;notify('空トラックが貨物駅へ帰投');updateHUD()}
if(truck.state==='returning'){truck.group.position.x=Math.max(-48,truck.group.position.x-truck.speed*dt);if(truck.group.position.x<=-48){truck.state='station';notify('トラックが貨物駅へ戻った');updateHUD()}}}
function activeTrainCrates(){return crates.filter(c=>c.state==='train').length}
function updateTrain(dt){trainTimer+=dt;if(trainState==='parked'&&activeTrainCrates()===0&&truck.state!=='station'){trainState='waitingDepart';trainTimer=0}
if(trainState==='waitingDepart'&&trainTimer>2){trainState='departing';trainTimer=0;notify('貨物列車が次の積荷を取りに出発')}
if(trainState==='departing'){train.position.x-=18*dt;if(train.position.x<-125){trainState='away';trainTimer=0}}
if(trainState==='away'&&trainTimer>7){trainState='arriving';train.position.x=-125;trainTimer=0}
if(trainState==='arriving'){train.position.x+=18*dt;if(train.position.x>=-43){train.position.x=-43;trainState='parked';trainTimer=0;spawnTrainCargo()}}}

let last=performance.now();
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;camX+=(camGoal-camX)*Math.min(1,dt*5.8);updateCamera();updateTruck(dt,now);updateTrain(dt);updateLabels();renderer.render(scene,camera)}
requestAnimationFrame(loop);

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
