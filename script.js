import * as THREE from "three";

const canvas = document.getElementById("scene");
if (!canvas) {
  throw new Error('Canvas element with id="scene" not found. Load the script after the canvas or wrap initialization in DOMContentLoaded.');
}
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060d, 0.018);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(0, 0, 14);

scene.add(new THREE.AmbientLight(0x6b74a8, 0.4));

const fireLight = new THREE.PointLight(0xff5a2e, 9, 40, 2);
fireLight.position.set(3, 2, 6);
scene.add(fireLight);

const leafLight = new THREE.PointLight(0x2fd48a, 10, 70, 1.6);
leafLight.position.set(-38, 6, -4);
scene.add(leafLight);

const wireLight = new THREE.PointLight(0x8b5cf6, 9, 45, 2);
wireLight.position.set(40, -2, -8);
scene.add(wireLight);

const skyLight = new THREE.PointLight(0x2dd4bf, 9, 55, 1.6);
skyLight.position.set(4, -1, 16);
scene.add(skyLight);

const fillLight = new THREE.PointLight(0x5566ff, 1.6, 60, 2);
fillLight.position.set(-8, -4, -6);
scene.add(fillLight);

function makeGlowTexture() {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,244,214,0.9)");
  g.addColorStop(1, "rgba(255,244,214,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

function makeParchmentTexture() {
  const w = 512, h = 512;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");

  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#eee0ae");
  g.addColorStop(0.55, "#d1b57a");
  g.addColorStop(1, "#8a9a6a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = `rgba(90,65,30,${Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, Math.random() * 3);
  }

  ctx.strokeStyle = "rgba(60,40,20,0.35)";
  ctx.lineWidth = 1.4;
  const rows = 22;
  for (let r = 0; r < rows; r++) {
    const y = 26 + r * ((h - 60) / rows);
    ctx.beginPath();
    let x = 24;
    ctx.moveTo(x, y);
    while (x < w - 24) {
      const seg = 6 + Math.random() * 14;
      const dy = (Math.random() - 0.5) * 6;
      x += seg;
      ctx.lineTo(x, y + dy);
      if (Math.random() < 0.15) x += 6; // word gap
    }
    ctx.stroke();
  }

  const vg = ctx.createRadialGradient(w/2, h/2, w*0.2, w/2, h/2, w*0.72);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(40,25,10,0.45)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeCrystalTexture() {
  const w = 256, h = 256;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#ffb238");
  g.addColorStop(0.45, "#ff5a2e");
  g.addColorStop(0.75, "#e0245e");
  g.addColorStop(1, "#7a2050");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 50; i++) {
    ctx.strokeStyle = `rgba(255,244,214,${0.08 + Math.random() * 0.18})`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.lineTo(Math.random() * w, Math.random() * h);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

const glowTex = makeGlowTexture();
const parchmentTex = makeParchmentTexture();
const crystalTex = makeCrystalTexture();

function constellationPoint(t) {
  const angle = t * Math.PI * 2;
  const r = 6 + Math.sin(angle * 3) * 1.4 + Math.sin(angle * 7) * 0.4;
  return new THREE.Vector3(
    Math.cos(angle) * r,
    Math.sin(angle * 2) * 2.4 + Math.sin(angle) * 1.6,
    Math.sin(angle) * r * 0.6
  );
}

const STAR_COUNT = 200;
const scatterPositions = [];
const constellationPositions = [];
const starPositions = [];

for (let i = 0; i < STAR_COUNT; i++) {
  scatterPositions.push(
    (Math.random() - 0.5) * 46,
    (Math.random() - 0.5) * 30,
    (Math.random() - 0.5) * 46
  );
  const p = constellationPoint(i / STAR_COUNT);
  constellationPositions.push(p.x, p.y, p.z);
  starPositions.push(0, 0, 0); // filled every frame
}

const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPositions.slice(), 3));

const starColors = [];
const warm = new THREE.Color(0xffe3b0);
const cool = new THREE.Color(0xaad4ff);
for (let i = 0; i < STAR_COUNT; i++) {
  const c = Math.random() < 0.18 ? cool : warm;
  starColors.push(c.r, c.g, c.b);
}
starGeo.setAttribute("color", new THREE.Float32BufferAttribute(starColors, 3));

const starMat = new THREE.PointsMaterial({
  size: 0.5,
  map: glowTex,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexColors: true,
});
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

const lineGeo = new THREE.BufferGeometry();
const linePositions = new Float32Array(STAR_COUNT * 3);
lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
const lineMat = new THREE.LineBasicMaterial({
  color: 0x2dd4bf,
  transparent: true,
  opacity: 0,
});
const constellationLine = new THREE.LineLoop(lineGeo, lineMat);
scene.add(constellationLine);

const crystalGeo = new THREE.IcosahedronGeometry(2.2, 2);
const crystalMat = new THREE.MeshPhysicalMaterial({
  map: crystalTex,
  metalness: 0.15,
  roughness: 0.18,
  emissive: 0xff5a2e,
  emissiveIntensity: 0.55,
  clearcoat: 0.8,
  clearcoatRoughness: 0.2,
  flatShading: true,
});
const crystal = new THREE.Mesh(crystalGeo, crystalMat);
scene.add(crystal);

const orbitGeo = new THREE.TorusKnotGeometry(3.6, 0.09, 220, 16, 2, 3);
const orbitMat = new THREE.MeshStandardMaterial({
  color: 0x22d3ee,
  emissive: 0x0e7490,
  emissiveIntensity: 0.6,
  metalness: 0.4,
  roughness: 0.25,
  transparent: true,
  opacity: 0.85,
});
const orbit = new THREE.Mesh(orbitGeo, orbitMat);
scene.add(orbit);

const scrollGeo = new THREE.CylinderGeometry(1.6, 1.6, 4.2, 48, 1, true);
const scrollMat = new THREE.MeshStandardMaterial({
  map: parchmentTex,
  roughness: 0.8,
  metalness: 0,
  emissive: 0x2a2410,
  emissiveIntensity: 0.35,
  side: THREE.DoubleSide,
});
const scroll = new THREE.Mesh(scrollGeo, scrollMat);
scroll.position.set(-40, 6, -10);
scene.add(scroll);

const capMat = new THREE.MeshStandardMaterial({
  color: 0x1fcf8a,
  emissive: 0x149e69,
  emissiveIntensity: 0.65,
  metalness: 0.3,
  roughness: 0.35,
});
const capTop = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.14, 12, 32), capMat);
capTop.position.copy(scroll.position).setY(scroll.position.y + 2.1);
capTop.rotation.x = Math.PI / 2;
scene.add(capTop);
const capBottom = capTop.clone();
capBottom.position.copy(scroll.position).setY(scroll.position.y - 2.1);
scene.add(capBottom);

const signalGeo = new THREE.IcosahedronGeometry(3.2, 2);
const signalMat = new THREE.MeshStandardMaterial({
  color: 0xa78bfa,
  emissive: 0x7c3aed,
  emissiveIntensity: 0.8,
  wireframe: true,
  transparent: true,
  opacity: 0.6,
});
const signal = new THREE.Mesh(signalGeo, signalMat);
signal.position.set(40, -4, -14); 
scene.add(signal);

const pulseRings = [];
for (let i = 0; i < 3; i++) {
  const ringGeo = new THREE.RingGeometry(3.4, 3.5, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xc4b5fd,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.copy(signal.position);
  ring.userData.phase = i / 3;
  scene.add(ring);
  pulseRings.push(ring);
}

const tridentGroup = new THREE.Group();
const seaMetal = new THREE.MeshStandardMaterial({
  color: 0x2dd4c4,
  emissive: 0x14b8a6,
  emissiveIntensity: 0.55,
  metalness: 0.75,
  roughness: 0.2,
});

const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 16), seaMetal);
tridentGroup.add(shaft);

const centerProng = new THREE.Mesh(new THREE.ConeGeometry(0.11, 1, 16), seaMetal);
centerProng.position.y = 2.1;
tridentGroup.add(centerProng);

[-1, 1].forEach((side) => {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.55, 0),
    new THREE.Vector3(side * 0.35, 1.9, 0),
    new THREE.Vector3(side * 0.32, 2.3, 0),
  ]);
  const prongGeo = new THREE.TubeGeometry(curve, 20, 0.045, 8, false);
  tridentGroup.add(new THREE.Mesh(prongGeo, seaMetal));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 12), seaMetal);
  tip.position.set(side * 0.32, 2.5, 0);
  tridentGroup.add(tip);
});

tridentGroup.rotation.z = 0.3;
tridentGroup.position.set(5.5, -1.5, 15); // parked near the closing camera stop
scene.add(tridentGroup);

const sectionEls = Array.from(document.querySelectorAll(".panel"));
const dotLinks = Array.from(document.querySelectorAll("#dotnav a"));

const camPath = [
  { pos: new THREE.Vector3(0, 0.4, 13), look: new THREE.Vector3(0, 0, 0) },   // hero: crystal centered
  { pos: new THREE.Vector3(2.6, 1.2, 9), look: new THREE.Vector3(0, 0, 0) },  // oral: circle closer, angled
  { pos: new THREE.Vector3(-30, 6, 8), look: new THREE.Vector3(-40, 6, -10) },// written: scroll comes into view
  { pos: new THREE.Vector3(30, -2, 10), look: new THREE.Vector3(40, -4, -14) }, // signal: broadcast sphere
  { pos: new THREE.Vector3(0, 2.2, 18), look: new THREE.Vector3(0, 0, 0) },   // closing: pull back, constellation resolved
];
 
let scrollT = 0;
let smoothT = 0;
let activeIndex = 0;

function computeScrollT() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}
 
function updateActiveSection() {
  let closest = 0;
  let closestDist = Infinity;
  const mid = window.scrollY + window.innerHeight / 2;
  sectionEls.forEach((el, i) => {
    const d = Math.abs((el.offsetTop + el.offsetHeight / 2) - mid);
    if (d < closestDist) { closestDist = d; closest = i; }
  });
  if (closest !== activeIndex) {
    activeIndex = closest;
    dotLinks.forEach((a, i) => a.classList.toggle("active", i === activeIndex));
  }
}

window.addEventListener("scroll", () => {
  scrollT = computeScrollT();
  updateActiveSection();
}, { passive: true });

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) e.target.classList.add("in-view");
  });
}, { threshold: 0.3 });
document.querySelectorAll(".panel-inner").forEach((el) => io.observe(el));

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const pointer = { x: 0, y: 0 };
if (!reduceMotion) {
  window.addEventListener("pointermove", (e) => {
    pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });
}
 
const clock = new THREE.Clock();
const tmpVec = new THREE.Vector3();
const posAttr = starGeo.getAttribute("position");
const lineAttr = lineGeo.getAttribute("position");

function segmentEase(t, from, to) {
  return Math.min(1, Math.max(0, (t - from) / (to - from)));
}

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  smoothT += (scrollT - smoothT) * (reduceMotion ? 1 : 0.08);

  const segs = camPath.length - 1;
  const scaled = smoothT * segs;
  const i0 = Math.min(Math.floor(scaled), segs - 1);
  const localT = scaled - i0;
  const a = camPath[i0], b = camPath[i0 + 1];
  camera.position.lerpVectors(a.pos, b.pos, localT);
  tmpVec.lerpVectors(a.look, b.look, localT);
 
  camera.position.x += pointer.x * 0.6;
  camera.position.y += -pointer.y * 0.35;

  camera.lookAt(tmpVec);

  crystal.rotation.y += dt * 0.25;
  crystal.rotation.x += dt * 0.08;
  const crystalFade = 1 - segmentEase(smoothT, 0.35, 0.55);
  crystal.material.opacity = 1;
  crystal.visible = crystalFade > 0.02;
  crystal.scale.setScalar(0.9 + crystalFade * 0.25);

  orbit.rotation.z += dt * 0.15;
  orbit.rotation.y -= dt * 0.1;
  orbit.material.opacity = 0.55 * crystalFade + 0.05;

  const scrollIn = segmentEase(smoothT, 0.32, 0.55);
  const scrollOut = 1 - segmentEase(smoothT, 0.62, 0.8);
  const scrollVis = Math.min(scrollIn, scrollOut);
  scroll.rotation.y += dt * 0.12;
  scroll.material.opacity = scrollVis;
  scroll.material.transparent = true;
  capTop.material.opacity = capBottom.material.opacity = scrollVis;
  capTop.material.transparent = capBottom.material.transparent = true;

  const sigIn = segmentEase(smoothT, 0.62, 0.82);
  const sigOut = 1 - segmentEase(smoothT, 0.9, 1.0);
  const sigVis = Math.min(sigIn, sigOut);
  signal.rotation.y += dt * 0.2;
  signal.material.opacity = 0.6 * sigVis;
  const hue = (elapsed * 0.04) % 1;
  signal.material.color.setHSL(0.7 + Math.sin(hue * Math.PI * 2) * 0.08, 0.7, 0.68);
  pulseRings.forEach((ring) => {
    const p = (elapsed * 0.25 + ring.userData.phase) % 1;
    const s = 1 + p * 3;
    ring.scale.setScalar(s);
    ring.material.opacity = sigVis * (1 - p) * 0.6;
  });

  const resolve = smoothT; // 0 at top, 1 at bottom
  for (let i = 0; i < STAR_COUNT; i++) {
    const ix = i * 3;
    const sx = scatterPositions[ix], sy = scatterPositions[ix+1], sz = scatterPositions[ix+2];
    const cx = constellationPositions[ix], cy = constellationPositions[ix+1], cz = constellationPositions[ix+2];
    const twinkle = Math.sin(elapsed * 2 + i) * 0.06;
    posAttr.array[ix]   = THREE.MathUtils.lerp(sx, cx, resolve) + twinkle;
    posAttr.array[ix+1] = THREE.MathUtils.lerp(sy, cy, resolve);
    posAttr.array[ix+2] = THREE.MathUtils.lerp(sz, cz, resolve) + twinkle;
    if (resolve > 0.75) {
      lineAttr.array[ix]   = posAttr.array[ix];
      lineAttr.array[ix+1] = posAttr.array[ix+1];
      lineAttr.array[ix+2] = posAttr.array[ix+2];
    }
  }
  posAttr.needsUpdate = true;
  lineAttr.needsUpdate = true;
  lineMat.opacity = Math.max(0, (resolve - 0.75) / 0.25) * 0.35;
  stars.rotation.y += dt * 0.01;
  constellationLine.rotation.y = stars.rotation.y;

  const tridentVis = segmentEase(smoothT, 0.86, 1.0);
  tridentGroup.rotation.y += dt * 0.4;
  tridentGroup.position.y = -1.5 + Math.sin(elapsed * 0.6) * 0.3;
  tridentGroup.children.forEach((child) => {
    child.material.transparent = true;
    child.material.opacity = tridentVis;
  });

  fireLight.intensity = 4 + crystalFade * 7;
  fireLight.position.x = 3 + Math.sin(elapsed * 0.3) * 2;

  leafLight.intensity = 3 + scrollVis * 13;
  leafLight.position.y = 6 + Math.sin(elapsed * 0.25) * 1.5;

  wireLight.intensity = 2 + sigVis * 10;
  wireLight.position.z = -8 + Math.cos(elapsed * 0.2) * 3;

  const skyVis = segmentEase(smoothT, 0.82, 1.0);
  skyLight.intensity = 3 + skyVis * 9;

  fillLight.position.z = -6 + Math.cos(elapsed * 0.2) * 3;

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

scrollT = computeScrollT();
smoothT = scrollT;
updateActiveSection();
tick();