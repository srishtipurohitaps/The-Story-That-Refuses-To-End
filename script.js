import * as THREE from "three";

const canvas = document.getElementById("scene");
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

