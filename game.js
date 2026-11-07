import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const host = document.getElementById("gameCanvas");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ab8d5);
scene.fog = new THREE.Fog(0x8ab8d5, 75, 170);

const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 300);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
host.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe8f5ff, 0x34552d, 2.0));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-25, 45, 20); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); scene.add(sun);

const field = new THREE.Mesh(new THREE.PlaneGeometry(53.3, 120), new THREE.MeshStandardMaterial({color:0x287d42, roughness:1}));
field.rotation.x = -Math.PI/2; field.receiveShadow = true; scene.add(field);

function stripe(x,z,w,d,color=0xffffff, y=.025) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,.025,d),new THREE.MeshBasicMaterial({color}));
  m.position.set(x,y,z); scene.add(m); return m;
}
// Yard lines, sidelines, end lines and hash marks.
for(let z=-50;z<=50;z+=5){
  stripe(0,z,53.3,.13,0xe8f2e9);
  for(let x of [-7.6,7.6]) stripe(x,z,0.18,.65,0xe8f2e9,.04);
}
stripe(-26.5,0,.25,100,0xffffff,.04); stripe(26.5,0,.25,100,0xffffff,.04);
stripe(0,-50,53.3,.25,0xffffff,.04); stripe(0,50,53.3,.25,0xffffff,.04);
const endA = new THREE.Mesh(new THREE.PlaneGeometry(53.3,10),new THREE.MeshBasicMaterial({color:0x173c78}));
endA.rotation.x=-Math.PI/2;endA.position.set(0,.018,-45);scene.add(endA);
const endB=endA.clone();endB.position.z=45;scene.add(endB);

// Simple field lettering.
function makeText(text,x,z,rotation=0){
  const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=256;
  const ctx=canvas.getContext("2d");ctx.clearRect(0,0,1024,256);
  ctx.font="bold 150px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#ffffff";ctx.fillText(text,512,128);
  const tex=new THREE.CanvasTexture(canvas);
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(25,6),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide}));
  mesh.rotation.x=-Math.PI/2;mesh.rotation.z=rotation;mesh.position.set(x,.04,z);scene.add(mesh);
}
makeText("DYNASTY",0,-45);makeText("DYNASTY",0,45,Math.PI);

const player = new THREE.Group(); scene.add(player);
const navy = new THREE.MeshStandardMaterial({color:0x163b70,roughness:.75});
const white = new THREE.MeshStandardMaterial({color:0xe9edf2,roughness:.7});
const skin = new THREE.MeshStandardMaterial({color:0x9a6849,roughness:.8});
function capsule(radius,length,mat,x,y,z){
  const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(radius,length,5,8),mat);
  mesh.position.set(x,y,z);mesh.castShadow=true;player.add(mesh);return mesh;
}
const torso=capsule(.34,.68,navy,0,1.35,0);
const head=new THREE.Mesh(new THREE.SphereGeometry(.23,16,12),skin);head.position.set(0,2.08,0);head.castShadow=true;player.add(head);
const helmet=new THREE.Mesh(new THREE.SphereGeometry(.27,16,10,0,Math.PI*2,0,Math.PI/2),white);helmet.position.set(0,2.12,0);helmet.castShadow=true;player.add(helmet);
const legL=capsule(.13,.55,white,-.19,.55,0),legR=capsule(.13,.55,white,.19,.55,0);
const armL=capsule(.11,.48,navy,-.42,1.42,0),armR=capsule(.11,.48,navy,.42,1.42,0);
const ball=new THREE.Mesh(new THREE.SphereGeometry(.16,16,12),new THREE.MeshStandardMaterial({color:0x8a4c25}));
ball.scale.set(1,.65,1.45);ball.position.set(.37,1.48,.03);player.add(ball);

const keys=new Set();let yaw=0, pitch=.22, distance=7, diving=0;
const velocity=new THREE.Vector3();
const clock=new THREE.Clock();
window.addEventListener("keydown",e=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(e.code==="Space"&&!diving)diving=0.65;});
window.addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
let dragging=false,lastX=0,lastY=0;
renderer.domElement.addEventListener("pointerdown",e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener("pointerup",()=>dragging=false);
renderer.domElement.addEventListener("pointermove",e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw-=dx*.006;pitch=THREE.MathUtils.clamp(pitch+dy*.003,-.05,.75);});
renderer.domElement.addEventListener("wheel",e=>{distance=THREE.MathUtils.clamp(distance+e.deltaY*.008,4,13);},{passive:true});

function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(host);resize();
document.getElementById("resetBtn").onclick=()=>{player.position.set(0,0,0);velocity.set(0,0,0);yaw=0;};
document.getElementById("fullscreenBtn").onclick=()=>{if(!document.fullscreenElement)host.requestFullscreen?.();else document.exitFullscreen?.();};

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);
  const forward=(keys.has("w")||keys.has("arrowup")?1:0)-(keys.has("s")||keys.has("arrowdown")?1:0);
  const side=(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0);
  const input=new THREE.Vector3(side,0,-forward);
  if(input.lengthSq()>0)input.normalize();
  const sprint=keys.has("shift"), speed=sprint?10:6;
  const desired=input.clone().applyAxisAngle(new THREE.Vector3(0,1,0),yaw).multiplyScalar(speed);
  velocity.x=THREE.MathUtils.damp(velocity.x,desired.x,10,dt);
  velocity.z=THREE.MathUtils.damp(velocity.z,desired.z,10,dt);
  player.position.addScaledVector(velocity,dt);
  player.position.x=THREE.MathUtils.clamp(player.position.x,-24,24);
  player.position.z=THREE.MathUtils.clamp(player.position.z,-49,49);
  if(input.lengthSq()>.01)player.rotation.y=Math.atan2(-velocity.x,-velocity.z);
  if(diving>0){diving=Math.max(0,diving-dt);player.position.y=Math.sin((.65-diving)/.65*Math.PI)*.45;torso.rotation.x=-.9;}
  else {player.position.y=0;torso.rotation.x=0;}
  const target=new THREE.Vector3(player.position.x,1.5+pitch*2,player.position.z);
  const offset=new THREE.Vector3(Math.sin(yaw)*distance,3.1+pitch*3,Math.cos(yaw)*distance);
  camera.position.lerp(target.clone().add(offset),1-Math.exp(-7*dt));
  camera.lookAt(target);
  document.getElementById("speed").textContent=(Math.hypot(velocity.x,velocity.z)).toFixed(1);
  document.getElementById("yardLine").textContent=String(Math.max(1,Math.min(99,Math.round(50-player.position.z))));
  renderer.render(scene,camera);
}
animate();

const connection=document.getElementById("connection");
const socketScript=document.createElement("script");socketScript.src="/socket.io/socket.io.js";
socketScript.onload=()=>{const socket=window.io();socket.on("connect",()=>connection.textContent="ONLINE");socket.on("disconnect",()=>connection.textContent="OFFLINE");};
socketScript.onerror=()=>connection.textContent="LOCAL MODE";
document.body.appendChild(socketScript);