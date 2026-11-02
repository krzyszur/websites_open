import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { ROOM, OUTLETS, LAYOUTS, analyze, footprints, outletStatus, DOOR_SWING, applyDeskVariant } from './layouts.js';
import { LAYOUTS_V3 } from './data_v3.js';
import { LAYOUTS_V1 } from './data_v1.js';
import { LAYOUTS_V2 } from './data_v2.js';

const fmt = (n, d = 2) => n.toFixed(d).replace('.', ',');
const cm = (n) => Math.round(n * 100);
const $ = (s) => document.querySelector(s);

// ---------- renderer / scena ----------
const stage = $('#stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.appendChild(renderer.domElement);
const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.cssText = 'position:absolute;inset:0;pointer-events:none';
stage.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeef0f2);
const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);
const center = new THREE.Vector3(ROOM.W / 2, 0.9, ROOM.D / 2);
camera.position.set(6.4, 5.2, 6.8);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(center); controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.minDistance = 1.2; controls.maxDistance = 14; controls.maxPolarAngle = Math.PI / 2 - 0.01;
controls.update();

scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d0c4, 1.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(4, 7, 2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 20 });
sun.target.position.copy(center); scene.add(sun, sun.target);

// ---------- materiały ----------
const matCache = new Map();
const mat = (color, o = {}) => {
  const k = color + JSON.stringify(o);
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...o }));
  return matCache.get(k);
};
const edgeMat = new THREE.LineBasicMaterial({ color: 0x20242a, transparent: true, opacity: 0.22 });

// plan (x,y,z-up h) -> three (x, h, y)
function box(w, h, d, color, x, y, z, parent, opts = {}) {
  // x,y,z = środek w układzie lokalnym three (x, y-wys, z)
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), opts.material || mat(color, opts.mo));
  m.position.set(x, y, z); m.castShadow = opts.noShadow ? false : true; m.receiveShadow = true;
  if (!opts.noEdge) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), edgeMat); m.add(e); }
  parent.add(m); return m;
}
// pudełko w współrzędnych planu: x0..x1, y0..y1 (plan), z0..z1 (wysokość)
function pbox(x0, x1, y0, y1, h0, h1, color, parent, opts) {
  return box(x1 - x0, h1 - h0, y1 - y0, color, (x0 + x1) / 2, (h0 + h1) / 2, (y0 + y1) / 2, parent, opts);
}

// ---------- pokój ----------
const roomG = new THREE.Group(); scene.add(roomG);

function plankTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const g = c.getContext('2d');
  g.fillStyle = '#c99a5b'; g.fillRect(0, 0, 1024, 1024);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pw = 128;
  for (let i = 0; i < 8; i++) {
    let y = 0; while (y < 1024) {
      const len = 300 + rnd() * 500; const sh = 170 + rnd() * 24;
      g.fillStyle = `rgb(${sh + 28},${sh - 20},${sh - 82})`; g.fillRect(i * pw, y, pw - 2, Math.min(len, 1024 - y) - 2);
      g.strokeStyle = 'rgba(90,50,20,.12)'; for (let k = 0; k < 6; k++) { g.beginPath(); const yy = y + rnd() * len; g.moveTo(i * pw + rnd() * pw, yy); g.lineTo(i * pw + rnd() * pw, yy + 40); g.stroke(); }
      y += len;
    }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const floorTex = plankTexture(); floorTex.repeat.set(ROOM.D / 2.2, ROOM.W / 2.2);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.W, ROOM.D), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.6 }));
floor.rotation.x = -Math.PI / 2; floor.position.set(ROOM.W / 2, 0, ROOM.D / 2); floor.receiveShadow = true; roomG.add(floor);
// podłoga poza pokojem (korytarz) – płytka
const hall = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), mat(0xd9d9d6)); hall.rotation.x = -Math.PI / 2; hall.position.set(3.0, 0.001, ROOM.D + 0.7); hall.receiveShadow = true; roomG.add(hall);

const WT = 0.12; const wallColor = 0xfbfaf7;
const walls = { N: new THREE.Group(), S: new THREE.Group(), W: new THREE.Group(), E: new THREE.Group() };
Object.values(walls).forEach(g => roomG.add(g));
const wopt = { noEdge: false };
const H = ROOM.H, win = ROOM.window, door = ROOM.door;
// N (okno)
pbox(-WT, win.x0, -WT, 0, 0, H, wallColor, walls.N, wopt);
pbox(win.x1, ROOM.W + WT, -WT, 0, 0, H, wallColor, walls.N, wopt);
pbox(win.x0, win.x1, -WT, 0, 0, win.sill, wallColor, walls.N, wopt);
pbox(win.x0, win.x1, -WT, 0, win.top, H, wallColor, walls.N, wopt);
// S (drzwi)
pbox(-WT, door.x0, ROOM.D, ROOM.D + WT, 0, H, wallColor, walls.S, wopt);
pbox(door.x1, ROOM.W + WT, ROOM.D, ROOM.D + WT, 0, H, wallColor, walls.S, wopt);
pbox(door.x0, door.x1, ROOM.D, ROOM.D + WT, door.h, H, wallColor, walls.S, wopt);
// W, E
pbox(-WT, 0, 0, ROOM.D, 0, H, wallColor, walls.W, wopt);
pbox(ROOM.W, ROOM.W + WT, 0, ROOM.D, 0, H, wallColor, walls.E, wopt);
// słup
const P = ROOM.pillar; pbox(P.x0, P.x1, P.y0, P.y1, 0, H, 0xefeeea, roomG);
// listwy przypodłogowe (cienkie)
const skirt = (x0, x1, y0, y1) => pbox(x0, x1, y0, y1, 0, 0.08, 0xffffff, roomG, { noEdge: true });
skirt(0, ROOM.W, 0, 0.012); skirt(0, 0.012, 0, ROOM.D); skirt(ROOM.W - 0.012, ROOM.W, 0, P.y0); skirt(ROOM.W - 0.012, ROOM.W, P.y1, ROOM.D);
skirt(0, door.x0, ROOM.D - 0.012, ROOM.D);

// okno
const frameCol = 0x9a5f2c;
const wg = new THREE.Group(); roomG.add(wg);
const fT = 0.07;
pbox(win.x0, win.x1, -0.10, -0.02, win.sill, win.sill + fT, frameCol, wg);
pbox(win.x0, win.x1, -0.10, -0.02, win.top - fT, win.top, frameCol, wg);
pbox(win.x0, win.x0 + fT, -0.10, -0.02, win.sill, win.top, frameCol, wg);
pbox(win.x1 - fT, win.x1, -0.10, -0.02, win.sill, win.top, frameCol, wg);
pbox((win.x0 + win.x1) / 2 - 0.04, (win.x0 + win.x1) / 2 + 0.04, -0.10, -0.02, win.sill, win.top, frameCol, wg);
pbox(win.x0, win.x1, -0.075, -0.065, win.sill, win.top, 0x9bc4e2, wg, { noEdge: true, material: new THREE.MeshStandardMaterial({ color: 0x9bc4e2, transparent: true, opacity: 0.3, roughness: 0.1 }), noShadow: true });
pbox(win.x0 - 0.04, win.x1 + 0.04, 0, 0.07, win.sill - 0.03, win.sill, 0xcfc6b4, wg);   // parapet kamienny
// grzejnik
const R = ROOM.radiator; const rg = new THREE.Group(); roomG.add(rg);
pbox(R.x0, R.x1, R.y0, R.y1, R.h0, R.h1, 0xffffff, rg);
for (let i = 0; i < 22; i++) { const x = R.x0 + 0.03 + i * ((R.x1 - R.x0 - 0.06) / 21); pbox(x - 0.004, x + 0.004, R.y1, R.y1 + 0.004, R.h0 + 0.02, R.h1 - 0.02, 0xd8d8d8, rg, { noEdge: true }); }
// drzwi
const doorG = new THREE.Group(); roomG.add(doorG);
const dFr = 0xf2f0ea;
pbox(door.x0 - 0.04, door.x0, ROOM.D, ROOM.D + WT, 0, door.h + 0.04, dFr, doorG, { noEdge: true });
pbox(door.x1, door.x1 + 0.0, ROOM.D, ROOM.D + WT, 0, door.h + 0.04, dFr, doorG, { noEdge: true });
pbox(door.x0 - 0.04, door.x1, ROOM.D, ROOM.D + WT, door.h, door.h + 0.04, dFr, doorG, { noEdge: true });
const leafPivot = new THREE.Group(); leafPivot.position.set(door.x1, 0, ROOM.D - 0.025); roomG.add(leafPivot);
const leafW = door.x1 - door.x0;
box(leafW, 2.14, 0.04, 0xfbfaf7, -leafW / 2, 1.07, 0, leafPivot);
box(0.14, 0.02, 0.06, 0xb7bcc2, -leafW + 0.1, 1.0, 0.0, leafPivot, { noEdge: true });
let doorOpen = true; let doorAng = -Math.PI / 2 * 0.98, doorTarget = doorAng;
// łuk otwierania drzwi
const arcPts = []; for (let i = 0; i <= 24; i++) { const t = (i / 24) * Math.PI / 2; arcPts.push(new THREE.Vector3(door.x1 - leafW * Math.cos(t), 0.012, ROOM.D - leafW * Math.sin(t))); }
const arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), new THREE.LineDashedMaterial({ color: 0x8b8f96, dashSize: 0.05, gapSize: 0.04 })); arc.computeLineDistances(); roomG.add(arc);
// lampa
const L = ROOM.lamp; const lampG = new THREE.Group(); roomG.add(lampG);
const ring = new THREE.Mesh(new THREE.TorusGeometry(L.r, 0.035, 12, 48), new THREE.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0xfff2cf, emissiveIntensity: 0.9 }));
ring.rotation.x = Math.PI / 2; ring.position.set(L.x, L.z, L.y); lampG.add(ring);
for (const a of [0, 2.1, 4.2]) { const pts = [new THREE.Vector3(L.x + Math.cos(a) * L.r, L.z, L.y + Math.sin(a) * L.r), new THREE.Vector3(L.x, H, L.y)]; lampG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x777777 }))); }
// ---------- gniazdka ----------
const outletG = new THREE.Group(); roomG.add(outletG);
const outletLabels = [];
function outletWorld(o) {
  const t = 0.008;
  if (o.wall === 'N') return { p: new THREE.Vector3(o.pos, o.h, t), r: 0, n: [0, 0, 1] };
  if (o.wall === 'S') return { p: new THREE.Vector3(o.pos, o.h, ROOM.D - t), r: Math.PI, n: [0, 0, -1] };
  if (o.wall === 'W') return { p: new THREE.Vector3(t, o.h, o.pos), r: Math.PI / 2, n: [1, 0, 0] };
  return { p: new THREE.Vector3(ROOM.W - t, o.h, o.pos), r: -Math.PI / 2, n: [-1, 0, 0] };
}
for (const o of OUTLETS) {
  const w = outletWorld(o); const g = new THREE.Group(); g.position.copy(w.p); g.rotation.y = w.r;
  box(o.size || 0.085, o.size || 0.085, 0.016, o.kind === 'switch' ? 0xffb347 : 0x2f7ee6, 0, 0, 0.008, g, { noEdge: true, noShadow: true });
  outletG.add(g);
  const el = document.createElement('div'); el.className = 'olabel ' + o.kind; el.textContent = o.id;
  const lab = new CSS2DObject(el); lab.position.set(w.p.x + w.n[0] * 0.12, w.p.y + 0.13, w.p.z + w.n[2] * 0.12); outletG.add(lab); outletLabels.push(lab);
}
// ---------- wymiary ----------
const dimG = new THREE.Group(); roomG.add(dimG); dimG.visible = false; const dimLabels = [];
function dimLine(a, b, text, off = [0, 0, 0]) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  dimG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([A, B]), new THREE.LineBasicMaterial({ color: 0xd1411f })));
  for (const E of [A, B]) { const t = new THREE.Vector3(...off).normalize().multiplyScalar(0.07); dimG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([E.clone().sub(t), E.clone().add(t)]), new THREE.LineBasicMaterial({ color: 0xd1411f }))); }
  const el = document.createElement('div'); el.className = 'dlabel'; el.textContent = text;
  const lab = new CSS2DObject(el); lab.position.copy(A.clone().add(B).multiplyScalar(0.5)); lab.visible = false; dimLabels.push(lab); dimG.add(lab);
}
const zl = 0.02;
dimLine([0, zl, -0.32], [ROOM.W, zl, -0.32], `${fmt(ROOM.W)} m`, [0, 0, 1]);
dimLine([-0.32, zl, 0], [-0.32, zl, ROOM.D], `${fmt(ROOM.D)} m`, [1, 0, 0]);
dimLine([win.x0, zl, -0.17], [win.x1, zl, -0.17], `okno ${fmt(win.x1 - win.x0)} m`, [0, 0, 1]);
dimLine([door.x0, zl, ROOM.D + 0.3], [door.x1, zl, ROOM.D + 0.3], `drzwi ${fmt(door.x1 - door.x0)} m`, [0, 0, 1]);
dimLine([P.x0, zl, P.y0 - 0.12], [P.x1, zl, P.y0 - 0.12], `${fmt(P.x1 - P.x0)} m`, [0, 0, 1]);
dimLine([P.x0 - 0.12, zl, P.y0], [P.x0 - 0.12, zl, P.y1], `${fmt(P.y1 - P.y0)} m`, [1, 0, 0]);
dimLine([-0.32, 0, -0.32], [-0.32, H, -0.32], `wys. ${fmt(H)} m`, [1, 0, 0]);

// ---------- meble ----------
const furnG = new THREE.Group(); scene.add(furnG);
let bedAnim = { t: 1, target: 1 }; // 0 = dzień (złożone), 1 = noc (rozłożone) -> start: noc? ustawiane niżej
const wallBeds = []; const modeItems = []; const shifted = [];
function nearestWall(it) {
  const d = { N: it.y, S: ROOM.D - (it.y + it.d), W: it.x, E: ROOM.W - (it.x + it.w) };
  return Object.entries(d).sort((a, b) => a[1] - b[1])[0][0];
}
const wallRot = { N: 0, E: -Math.PI / 2, S: Math.PI, W: Math.PI / 2 }; // obrót: "tył" mebla do ściany; front domyślnie +z (na południe)
const pal = [0xc0504d, 0x4f81bd, 0x9bbb59, 0x8064a2, 0xf79646, 0x4bacc6, 0x7f7f7f, 0x2f5597];

function shelfUnit(it, g) {
  // tył przy ścianie; długość wzdłuż x lokalnego; głębokość wzdłuż z lokalnego (front +z)
  const wall = nearestWall(it); const alongX = (wall === 'N' || wall === 'S');
  const len = alongX ? it.w : it.d, dep = alongX ? it.d : it.w, hh = it.h;
  const inner = new THREE.Group(); const base = it.z0 || 0;
  const wc = it.color; const th = 0.02;
  box(len, hh, th, wc, 0, base + hh / 2, -dep / 2 + th / 2, inner);                  // tył
  box(th, hh, dep, wc, -len / 2 + th / 2, base + hh / 2, 0, inner);                   // boki
  box(th, hh, dep, wc, len / 2 - th / 2, base + hh / 2, 0, inner);
  const n = it.shelves || 3; const sp = hh / n;
  for (let i = 0; i <= n; i++) box(len - 0.02, th, dep, wc, 0, base + i * sp + th / 2 - (i === n ? th : 0), 0, inner);
  // segregatory
  let seed = it.id.length * 13 + 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) {
    if (it.printerShelf && i === 0) continue;
    let x = -len / 2 + 0.04; const yb = base + i * sp + th;
    while (x < len / 2 - 0.1) {
      const w = 0.07; if (rnd() < 0.12) { x += 0.05; continue; }
      const hbind = Math.min(sp - 0.05, 0.31 + rnd() * 0.0);
      box(w - 0.004, hbind, dep * 0.86, pal[Math.floor(rnd() * pal.length)], x + w / 2, yb + hbind / 2, -dep * 0.04, inner, { noEdge: true });
      x += w;
    }
  }
  // pozycja środka
  const cx = it.x + it.w / 2, cy = it.y + it.d / 2;
  inner.rotation.y = wallRot[wall] + (wall === 'N' ? 0 : 0);
  g.add(inner); g.position.set(cx, 0, cy);
  // odwrócenie: lokalny tył -z ma wypaść przy ścianie. dla N: tył = północ (-z) -> rot 0 OK. E: tył = wschód (+x): obrót o -90° przenosi -z -> +x? ustawione w wallRot
}

function deskUnit(it, g) {
  const x0 = it.x, x1 = it.x + it.w, y0 = it.y, y1 = it.y + it.d;
  pbox(x0, x1, y0, y1, 0.705, 0.74, it.color, g);
  const panelsList = it.panels || (it.monitor ? [] : (it.w >= it.d ? ['W', 'E'] : ['N', 'S']));
  for (const s of panelsList) {
    if (s === 'W') pbox(x0, x0 + 0.03, y0 + 0.02, y1 - 0.02, 0, 0.705, 0xf1efe9, g);
    if (s === 'E') pbox(x1 - 0.03, x1, y0 + 0.02, y1 - 0.02, 0, 0.705, 0xf1efe9, g);
    if (s === 'N') pbox(x0 + 0.02, x1 - 0.02, y0, y0 + 0.03, 0, 0.705, 0xf1efe9, g);
    if (s === 'S') pbox(x0 + 0.02, x1 - 0.02, y1 - 0.03, y1, 0, 0.705, 0xf1efe9, g);
  }
  if (it.monitor) {
    const mx = it.monitor.x, mz = y0 + 0.26;
    box(0.62, 0.35, 0.025, 0x1c1f24, mx, 1.04, mz, g); box(0.05, 0.17, 0.05, 0x333333, mx, 0.83, mz, g, { noEdge: true });
    box(0.42, 0.015, 0.14, 0xd9d9d9, mx, 0.748, y0 + 0.50, g, { noEdge: true });
    box(0.30, 0.012, 0.21, 0xffffff, mx + 0.62, 0.746, y0 + 0.42, g, { noEdge: true });   // szkicownik A4
    box(0.07, 0.07, 0.07, 0xc0504d, mx - 0.78, 0.775, y0 + 0.30, g, { noEdge: true });     // kubek na przybory
  }
  if (it.seam === 'W') pbox(x0, x0 + 0.004, y0, y1, 0.74, 0.7415, 0x3a3a3a, g, { noEdge: true });
  if (it.pad) box(0.60, 0.008, 0.42, 0xffffff, x0 + 0.34, 0.744, (y0 + y1) / 2 + 0.05, g, { noEdge: true }); // duży arkusz do rysowania
}

function chairUnit(it, g, face) {
  const inner = new THREE.Group();
  box(0.5, 0.06, 0.5, 0x2e3136, 0, 0.5, 0, inner); box(0.46, 0.5, 0.06, 0x2e3136, 0, 0.78, -0.22, inner);
  box(0.06, 0.45, 0.06, 0x888888, 0, 0.25, 0, inner, { noEdge: true });
  box(0.5, 0.04, 0.04, 0x888888, 0, 0.04, 0, inner, { noEdge: true }); box(0.04, 0.04, 0.5, 0x888888, 0, 0.04, 0, inner, { noEdge: true });
  const cx = it.x + it.w / 2, cy = it.y + it.d / 2;
  const ang = Math.atan2(face.x - cx, face.y - cy); // front (+z) -> w stronę biurka
  inner.rotation.y = ang; g.add(inner); g.position.set(cx, 0, cy);
}

function armchairUnit(it, g) {
  const wall = it.back || nearestWall(it); const alongX = (wall === 'N' || wall === 'S');
  const len = alongX ? it.w : it.d, dep = alongX ? it.d : it.w;
  const inner = new THREE.Group();
  box(len, 0.28, dep, it.color, 0, 0.30, 0, inner); box(len - 0.1, 0.12, dep - 0.12, 0xa7b5a8, 0, 0.5, 0.04, inner);
  box(len, 0.5, 0.18, it.color, 0, 0.62, -dep / 2 + 0.09, inner);
  box(0.12, 0.28, dep - 0.1, it.color, -len / 2 + 0.06, 0.62, 0.05, inner); box(0.12, 0.28, dep - 0.1, it.color, len / 2 - 0.06, 0.62, 0.05, inner);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.04, 0.16, 0.04, 0x4b3a2a, sx * (len / 2 - 0.06), 0.08, sz * (dep / 2 - 0.06), inner, { noEdge: true });
  // fotel nie musi „patrzeć” na ścianę: obrócony tyłem do najbliższej ściany; dla narożnika N – frontem na południe
  inner.rotation.y = wallRot[wall]; g.add(inner); g.position.set(it.x + it.w / 2, 0, it.y + it.d / 2);
}

function tableUnit(it, g) {
  const r = it.w / 2; const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.03, 24), mat(it.color)); m.position.set(it.x + r, it.h, it.y + r); m.castShadow = true; m.receiveShadow = true; g.add(m);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, it.h, 8), mat(0x555555)); leg.position.set(it.x + r, it.h / 2, it.y + r); g.add(leg);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.14, 16), new THREE.MeshStandardMaterial({ color: 0xfff1cf, emissive: 0xffe9b0, emissiveIntensity: 0.4 })); lamp.position.set(it.x + r, it.h + 0.1, it.y + r); g.add(lamp);
}

function sofaOpenUnit(it, g) {
  if (!it.back) return fixedBedUnit(it, g);
  const x0 = it.x, x1 = it.x + it.w, y0 = it.y, y1 = it.y + it.d; const back = it.back;
  const D = (back === 'N' || back === 'S') ? it.d : it.w, Wv = (back === 'N' || back === 'S') ? it.w : it.d;
  const rect = (u0, u1, v0, v1, h0, h1, col, opts) => {
    let X0, X1, Y0, Y1;
    if (back === 'S') { Y1 = y1 - u0; Y0 = y1 - u1; X0 = x0 + v0; X1 = x0 + v1; }
    else if (back === 'N') { Y0 = y0 + u0; Y1 = y0 + u1; X0 = x0 + v0; X1 = x0 + v1; }
    else if (back === 'W') { X0 = x0 + u0; X1 = x0 + u1; Y0 = y0 + v0; Y1 = y0 + v1; }
    else { X1 = x1 - u0; X0 = x1 - u1; Y0 = y0 + v0; Y1 = y0 + v1; }
    pbox(X0, X1, Y0, Y1, h0, h1, col, g, opts || {});
  };
  rect(0, D, 0, Wv, 0.05, 0.28, it.color);                                  // rama / pojemnik
  rect(0, 0.20, 0, Wv, 0.28, 0.85, it.color);                               // oparcie
  const cw = (Wv - 0.28) / 3; for (let k = 0; k < 3; k++) rect(0.20, 0.34, 0.14 + cw * k + 0.01, 0.14 + cw * (k + 1) - 0.01, 0.50, 0.80, 0x868c99);
  const al = Math.min(0.95, D); rect(0, al, 0, 0.14, 0.28, 0.62, it.color); rect(0, al, Wv - 0.14, Wv, 0.28, 0.62, it.color); // podłokietniki
  const m0 = 0.34, mL = D - m0 - 0.02;                                       // trzy sekcje pianki (jak na zdjęciu)
  for (let k = 0; k < 3; k++) rect(m0 + mL * k / 3 + 0.004, m0 + mL * (k + 1) / 3 - 0.004, 0.14, Wv - 0.14, 0.28, 0.46, 0x2c2e33);
  rect(D - 0.16, D, 0.14, Wv - 0.14, 0.28, 0.50, it.color);                  // złożony panel w nogach
  // poduszki przy wezgłowiu
  const head = it.head || back;
  if (head === back) { for (const f of [0.27, 0.73]) rect(0.36, 0.66, Wv * f - 0.27, Wv * f + 0.27, 0.46, 0.58, 0xffffff); }
  else {
    const hv = { S: [0, 1], N: [0, -1], W: [-1, 0], E: [1, 0] }[head]; const along = (head === 'N' || head === 'S');
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; const Lh = along ? it.d : it.w;
    for (const f of [0.28, 0.62]) {
      const px = along ? x0 + it.w * f : cx + hv[0] * (Lh / 2 - 0.34), py = along ? cy + hv[1] * (Lh / 2 - 0.34) : y0 + it.d * f;
      const sx = along ? 0.50 : 0.30, sy = along ? 0.30 : 0.50;
      pbox(px - sx / 2, px + sx / 2, py - sy / 2, py + sy / 2, 0.46, 0.58, 0xffffff, g, {});
    }
  }
}

function railUnit(it, g) {
  const y0 = it.y, len = it.d; const side = it.wallSide || 'W';
  const X = (a, b) => side === 'W' ? [it.x + a, it.x + b] : [it.x + it.w - b, it.x + it.w - a];
  const P = (a, b, ya, yb, h0, h1, col) => { const [x0, x1] = X(a, b); pbox(x0, x1, ya, yb, h0, h1, col, g, { noEdge: true }); };
  P(0, 0.02, y0, y0 + len, 1.80, 1.98, 0xd8d6d0);                       // listwa montażowa na ścianie
  P(0.02, 0.26, y0 + 0.03, y0 + 0.05, 1.86, 1.89, 0x9aa0a6); P(0.02, 0.26, y0 + len - 0.05, y0 + len - 0.03, 1.86, 1.89, 0x9aa0a6);   // wsporniki
  P(0.245, 0.26, y0 + 0.03, y0 + len - 0.03, 1.86, 1.89, 0x9aa0a6);      // drążek
  const cols = [0x3b5b8c, 0xb85c5c, 0x6b7f5a, 0xd8c9a8]; const n = Math.max(3, Math.round(len / 0.12));
  for (let k = 0; k < n; k++) { const yk = y0 + 0.07 + k * (len - 0.14) / (n - 1); const hh = 0.62 + (k % 3) * 0.12; P(0.05, 0.45, yk - 0.015, yk + 0.015, 1.86 - hh, 1.86, cols[k % cols.length]); }
}

function sofaUnit(it, g, open) {
  if (open) return sofaOpenUnit(it, g);
  const back = it.back || 'W'; const alongX = (back === 'N' || back === 'S');
  const len = alongX ? it.w : it.d, dep = alongX ? it.d : it.w; const inner = new THREE.Group(); const arm = 0.14;
  box(len, 0.40, dep, it.color, 0, 0.20, 0, inner);
  box(len, 0.46, 0.20, it.color, 0, 0.63, -dep / 2 + 0.10, inner);
  for (const s of [-1, 1]) box(arm, 0.30, dep - 0.2, it.color, s * (len / 2 - arm / 2), 0.55, 0.10, inner);
  const cw = (len - 2 * arm) / 3;
  for (let k = 0; k < 3; k++) {
    const x = -len / 2 + arm + cw * (k + 0.5);
    box(cw - 0.01, 0.14, dep - 0.30, 0xa3b2c4, x, 0.47, 0.06, inner, { noEdge: false });
    box(cw - 0.01, 0.30, 0.14, 0xa3b2c4, x, 0.68, -dep / 2 + 0.27, inner);
  }
  inner.rotation.y = wallRot[back]; g.add(inner); g.position.set(it.x + it.w / 2, 0, it.y + it.d / 2);
}

function lshelfUnit(it, g) {
  const [A, B] = it.arms; const n = it.shelves; const th = 0.025; const stepZ = 0.35;
  let seed = 41; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) {
    const z = it.z0 + i * stepZ;
    pbox(A.x, A.x + A.w, A.y, A.y + A.d, z, z + th, it.color, g); pbox(B.x, B.x + B.w, B.y, B.y + B.d, z, z + th, it.color, g);
    // kątowniki
    for (let bx = A.x + 0.15; bx < A.x + A.w - 0.05; bx += 0.42) { pbox(bx - 0.015, bx + 0.015, A.y, A.y + 0.012, z - 0.20, z, 0x9aa0a6, g, { noEdge: true }); pbox(bx - 0.015, bx + 0.015, A.y, A.y + A.d - 0.03, z - 0.012, z, 0x9aa0a6, g, { noEdge: true }); }
    for (let by = B.y + 0.15; by < B.y + B.d - 0.05; by += 0.42) { pbox(B.x + B.w - 0.012, B.x + B.w, by - 0.015, by + 0.015, z - 0.20, z, 0x9aa0a6, g, { noEdge: true }); pbox(B.x + 0.03, B.x + B.w, by - 0.015, by + 0.015, z - 0.012, z, 0x9aa0a6, g, { noEdge: true }); }
    // segregatory
    const skipA = it.printerShelf && i === 0;
    const hb = 0.31;
    if (!skipA) for (let x = A.x + 0.04; x < A.x + A.w - 0.10; x += 0.07) { if (rnd() < 0.1) continue; pbox(x, x + 0.066, A.y + 0.02, A.y + A.d - 0.04, z + th, z + th + hb, pal[Math.floor(rnd() * pal.length)], g, { noEdge: true }); }
    for (let y = B.y + 0.03; y < B.y + B.d - 0.06; y += 0.07) { if (rnd() < 0.1) continue; pbox(B.x + 0.02, B.x + B.w - 0.04, y, y + 0.066, z + th, z + th + hb, pal[Math.floor(rnd() * pal.length)], g, { noEdge: true }); }
  }
}

function drawersUnit(it, g) {
  pbox(it.x, it.x + it.w, it.y, it.y + it.d, it.z0, it.z0 + it.h, it.color, g);
  const e = 0.006; const mid = it.x + it.w / 2;
  pbox(mid - 0.003, mid + 0.003, it.y + it.d, it.y + it.d + e, it.z0 + 0.01, it.z0 + it.h - 0.01, 0x7a7f86, g, { noEdge: true });
  for (const cx of [it.x + it.w / 4, it.x + 3 * it.w / 4]) pbox(cx - 0.05, cx + 0.05, it.y + it.d, it.y + it.d + 0.02, it.z0 + it.h / 2 - 0.006, it.z0 + it.h / 2 + 0.006, 0x777777, g, { noEdge: true });
}

function boxUnit(it, g) {
  const g2 = new THREE.Group(); g.add(g2);
  pbox(it.x, it.x + it.w, it.y, it.y + it.d, 0, it.h, it.color, g2);
  const wall = it.back || nearestWall(it); const lc = 0x7a7f86; const e = 0.004;
  const tall = it.h > 1.2; const y0 = tall ? 0.05 : 0.03, y1 = it.h - (tall ? 0.05 : 0.03);
  const along = (wall === 'N' || wall === 'S') ? it.w : it.d; const nd = Math.max(1, Math.round(along / 0.45));
  for (let i = 1; i < nd; i++) {
    const f = i / nd;
    if (wall === 'N') pbox(it.x + f * it.w - e, it.x + f * it.w + e, it.y + it.d, it.y + it.d + e, y0, y1, lc, g2, { noEdge: true });
    if (wall === 'S') pbox(it.x + f * it.w - e, it.x + f * it.w + e, it.y - e, it.y, y0, y1, lc, g2, { noEdge: true });
    if (wall === 'W') pbox(it.x + it.w, it.x + it.w + e, it.y + f * it.d - e, it.y + f * it.d + e, y0, y1, lc, g2, { noEdge: true });
    if (wall === 'E') pbox(it.x - e, it.x, it.y + f * it.d - e, it.y + f * it.d + e, y0, y1, lc, g2, { noEdge: true });
  }
  if (it.wardrobe) { // uchwyty
    for (let i = 0; i < nd; i++) { const f = (i + 0.5) / nd; const hh = 1.0;
      if (wall === 'W') pbox(it.x + it.w, it.x + it.w + 0.02, it.y + f * it.d - 0.15, it.y + f * it.d - 0.14, hh, hh + 0.3, 0x9aa0a6, g2, { noEdge: true });
      if (wall === 'N') pbox(it.x + f * it.w - 0.15, it.x + f * it.w - 0.14, it.y + it.d, it.y + it.d + 0.02, hh, hh + 0.3, 0x9aa0a6, g2, { noEdge: true });
      if (wall === 'E') pbox(it.x - 0.02, it.x, it.y + f * it.d - 0.15, it.y + f * it.d - 0.14, hh, hh + 0.3, 0x9aa0a6, g2, { noEdge: true });
      if (wall === 'S') pbox(it.x + f * it.w - 0.15, it.x + f * it.w - 0.14, it.y - 0.02, it.y, hh, hh + 0.3, 0x9aa0a6, g2, { noEdge: true });
    }
  }
}

function fixedBedUnit(it, g) {
  const x0 = it.x, x1 = it.x + it.w, y0 = it.y, y1 = it.y + it.d;
  const sofa = it.type === 'sofabed'; const head = it.head || 'N';
  pbox(x0, x1, y0, y1, 0.05, 0.30, sofa ? it.color : 0xd9b384, g);                       // skrzynia / pojemnik
  pbox(x0 + 0.01, x1 - 0.01, y0 + 0.01, y1 - 0.01, 0.30, 0.52, 0xece7de, g);  // materac
  const hv = { S: [0, 1], N: [0, -1], W: [-1, 0], E: [1, 0] }[head]; const pv = [-hv[1], hv[0]];
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; const L = (head === 'N' || head === 'S') ? it.d : it.w, Wd = (head === 'N' || head === 'S') ? it.w : it.d;
  const along = (head === 'N' || head === 'S');
  const put = (px, py, sl, sw, h0, h1, col) => { const dx = along ? sw : sl, dy = along ? sl : sw; pbox(px - dx / 2, px + dx / 2, py - dy / 2, py + dy / 2, h0, h1, col, g, {}); };
  for (const k of [-1, 1]) put(cx + hv[0] * (L / 2 - 0.22) + pv[0] * k * Wd / 4, cy + hv[1] * (L / 2 - 0.22) + pv[1] * k * Wd / 4, 0.32, 0.55, 0.52, 0.64, 0xffffff);
  put(cx - hv[0] * L * 0.2, cy - hv[1] * L * 0.2, L * 0.58, Wd - 0.04, 0.52, 0.55, 0x9fb1c4);          // koc
  // bolce/wałki przy ścianie (leżanka)
  const wall = it.head === 'W' ? 'S' : 'W';
  if (it.id === 'bed') {
    if (it.x < 0.05 && head !== 'W') { /* leżanka przy ścianie zachodniej */ pbox(0.0, 0.18, y0 + 0.1, y1 - 0.1, 0.52, 0.76, 0xb7c3d0, g); }
    if (head === 'W') pbox(x0 + 0.5, x1 - 0.05, y1 - 0.18, y1, 0.52, 0.76, 0xb7c3d0, g);
  }
}

function wallbedUnit(it, g) {
  const c = it.cabinet, p = it.panel; const col = 0xf4f2ed; const th = 0.025;
  // korpus
  if (it.orient === 'H') {
    pbox(c.x, c.x + 0.02, c.y, c.y + c.d, 0, c.h, col, g);             // tył
    pbox(c.x, c.x + c.w, c.y, c.y + th, 0, c.h, col, g); pbox(c.x, c.x + c.w, c.y + c.d - th, c.y + c.d, 0, c.h, col, g); // boki
    pbox(c.x, c.x + c.w, c.y, c.y + c.d, c.h - th, c.h, col, g);        // góra
    pbox(c.x, c.x + c.w, c.y, c.y + c.d, 0, 0.12, 0x5a5a5a, g);         // cokół
    const pivot = new THREE.Group(); pivot.position.set(c.x + c.w - 0.01, 0.30, c.y + c.d / 2); g.add(pivot);
    const L = p.w, Wd = p.d;
    box(L, 0.04, Wd, 0xd9b384, L / 2, 0.02, 0, pivot);                            // front/ rama (drewno)
    box(L - 0.04, 0.20, Wd - 0.04, 0xece7de, L / 2, 0.14, 0, pivot);              // materac
    box(0.55, 0.12, 0.7, 0xffffff, 0.45, 0.3, -Wd / 4 - 0.05, pivot); box(0.55, 0.12, 0.7, 0xffffff, 0.45, 0.3, Wd / 4 + 0.05, pivot);
    box(L - 0.9, 0.025, Wd - 0.2, 0x9fb1c4, L / 2 + 0.3, 0.255, 0, pivot, { noEdge: true });
    wallBeds.push({ pivot, axis: 'z', closed: Math.PI / 2, open: 0, sign: 1 });
  } else {
    // V: zawias na froncie szafy (y=c.y), łóżko rozkłada się w stronę -z (na północ)
    pbox(c.x, c.x + c.w, c.y + c.d - 0.02, c.y + c.d, 0, c.h, col, g);
    pbox(c.x, c.x + th, c.y, c.y + c.d, 0, c.h, col, g); pbox(c.x + c.w - th, c.x + c.w, c.y, c.y + c.d, 0, c.h, col, g);
    pbox(c.x, c.x + c.w, c.y, c.y + c.d, c.h - th, c.h, col, g);
    pbox(c.x, c.x + c.w, c.y, c.y + c.d, 0, 0.12, 0x5a5a5a, g);
    const pivot = new THREE.Group(); pivot.position.set(p.x + p.w / 2, 0.42, c.y + 0.01); g.add(pivot);
    const Wd = p.w, L = p.d;
    box(Wd, 0.04, L, 0xd9b384, 0, 0.02, -L / 2, pivot);
    box(Wd - 0.04, 0.20, L - 0.04, 0xece7de, 0, 0.14, -L / 2, pivot);
    box(0.7, 0.12, 0.5, 0xffffff, -Wd / 4 - 0.05, 0.3, -0.45, pivot); box(0.7, 0.12, 0.5, 0xffffff, Wd / 4 + 0.05, 0.3, -0.45, pivot);
    box(Wd - 0.2, 0.025, L - 0.9, 0x9fb1c4, 0, 0.255, -L / 2 - 0.3, pivot, { noEdge: true });
    wallBeds.push({ pivot, axis: 'x', closed: Math.PI / 2, open: 0, sign: 1 });
  }
}

function buildLayout(layout) {
  furnG.clear(); wallBeds.length = 0; modeItems.length = 0; shifted.length = 0;
  const deskItem = layout.items.find(i => i.type === 'desk');
  for (const it of layout.items) {
    const g = new THREE.Group(); furnG.add(g);
    switch (it.type) {
      case 'wallbed': wallbedUnit(it, g); break;
      case 'desk': deskUnit(it, g); break;
      case 'chair': chairUnit(it, g, it.face || (deskItem ? { x: deskItem.x + deskItem.w / 2, y: deskItem.y + deskItem.d / 2 } : { x: 1, y: 1 })); if (it.nightDy) shifted.push({ g, dz: it.nightDy, base: g.position.z }); break;
      case 'printer': pbox(it.x, it.x + it.w, it.y, it.y + it.d, it.z0, it.z0 + it.h, it.color, g); pbox(it.x + 0.04, it.x + it.w - 0.04, it.y + it.d, it.y + it.d + 0.08, it.z0 + 0.02, it.z0 + 0.04, 0xffffff, g, { noEdge: true }); break;
      case 'fixedbed': fixedBedUnit(it, g); break;
      case 'lshelf': lshelfUnit(it, g); break;
      case 'rail': railUnit(it, g); break;
      case 'drawers': drawersUnit(it, g); break;
      case 'armchair': armchairUnit(it, g); break;
      case 'table': tableUnit(it, g); break;
      case 'sofa': sofaUnit(it, g, false); break;
      case 'sofabed': sofaUnit(it, g, true); break;
      case 'wallshelf': case 'tower': shelfUnit(it, g); break;
      default: boxUnit(it, g);
    }
    if (it.mode) modeItems.push({ g, mode: it.mode });
    if (it.zone) { const z = it.zone; const pts = [[z.x, z.y], [z.x + z.w, z.y], [z.x + z.w, z.y + z.d], [z.x, z.y + z.d]].map(p => new THREE.Vector3(p[0], 0.014, p[1])); const zl = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0xc0504d, dashSize: 0.06, gapSize: 0.04 })); zl.computeLineDistances(); furnG.add(zl); }
  }
  applyBed();
}
function applyBed() {
  const t = bedAnim.t; // 0 dzień .. 1 noc
  for (const b of wallBeds) {
    const ang = b.closed * (1 - THREE.MathUtils.smoothstep(t, 0, 1));
    if (b.axis === 'z') { b.pivot.rotation.set(0, 0, ang); } else { b.pivot.rotation.set(ang, 0, 0); }
  }
  for (const m of modeItems) m.g.visible = (m.mode === 'night') ? t > 0.5 : t <= 0.5;
  for (const s of shifted) s.g.position.z = s.base + s.dz * THREE.MathUtils.smoothstep(t, 0, 1);
}

// ---------- ściany: auto-ukrywanie ----------
let wallMode = 'auto';
const wallN = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const wallScale = { N: 1, S: 1, W: 1, E: 1 };
function updateWalls() {
  const cp = camera.position; const dx = cp.x - ROOM.W / 2, dz = cp.z - ROOM.D / 2; const hl = Math.hypot(dx, dz) || 1;
  const elev = Math.atan2(cp.y - 0.9, hl);
  for (const k of Object.keys(walls)) {
    let target = 1;
    if (wallMode === 'low') target = 0.06;
    else if (wallMode === 'auto') { const facing = (wallN[k][0] * dx + wallN[k][1] * dz) / hl; target = facing > 0.15 && elev < 1.25 ? 0.06 : 1; if (elev >= 1.25) target = 0.06; }
    wallScale[k] += (target - wallScale[k]) * 0.18;
    walls[k].scale.y = Math.max(0.02, wallScale[k]);
  }
  // okno i drzwi znikają razem ze ścianą
  wg.visible = wallScale.N > 0.5; doorG.visible = wallScale.S > 0.5; lampG.visible = elev < 1.1;
}

// ---------- UI ----------
const GROUPS = [
  { id: 'cur', short: 'Aktualne', name: 'Wersja 4 – po 5 układów na rodzaj łóżka', layouts: LAYOUTS, rejected: false },
  { id: 'v3', short: 'Odrzucone: wersja 3', name: 'Wersja 3 – sofy rozkładane i łóżka stałe/składane (7 układów)', layouts: LAYOUTS_V3, rejected: true,
    reason: 'Zastąpiona wersją 4: tu „sofa” była łóżkiem z materacem rozkładanym do przodu, a układów było 7. Wersja 4 modeluje sofę jako kanapę z funkcją spania (jak na zdjęciu, prostą i narożną) i daje po 5 układów dla każdego rodzaju łóżka.' },
  { id: 'v2', short: 'Odrzucone: wersja 2', name: 'Wersja 2 – łóżka składane do ściany 140×200', layouts: LAYOUTS_V2, rejected: true,
    reason: 'Odrzucone: rezygnacja z łóżek składanych do ściany. Dodatkowo szafa w narożniku NW otwiera drzwi w biurko, a pod blatem był kontener zamiast szuflad. Układy 3 i 4 (łóżko stałe) rozwinięto w kolejnych wersjach.' },
  { id: 'v1', short: 'Odrzucone: wersja 1', name: 'Wersja 1 – pierwsza tura (łóżko 160, biurko 140×60)', layouts: LAYOUTS_V1, rejected: true,
    reason: 'Odrzucone: pierwsza tura powstała przed doprecyzowaniem wymagań (biurko L pod oknem, łóżko 140, szafa i szafka nocna dla gości).' },
];
let deskVar = 'full';
let gi = 0; let bedFilter = 'all';
const curLayouts = () => gi === 0 ? LAYOUTS.filter(L => bedFilter === 'all' || L.bedType === bedFilter) : GROUPS[gi].layouts;
let cur = 0; let mode = 'night';
const layoutAt = (i) => gi === 0 ? applyDeskVariant(curLayouts()[i], deskVar) : curLayouts()[i];
function setLayout(i) {
  cur = i; const L = layoutAt(i); buildLayout(L);
  document.querySelectorAll('.tab').forEach((b, k) => b.classList.toggle('on', k === i));
  const a = analyze(L);
  const G = GROUPS[gi]; const BT = { sofa: 'sofa rozkładana', fixed: 'łóżko stałe', wall: 'łóżko składane' }; $('#lname').textContent = `${G.rejected ? 'ODRZUCONE · ' : ''}${L.id}. ${L.name}`; $('#btype').textContent = L.bedType ? 'Rodzaj łóżka: ' + BT[L.bedType] : '';
  $('#rej').innerHTML = G.rejected ? `<div class="rej">${G.reason}</div>` : ''; $('#lshort').textContent = L.short;
  $('#guest').innerHTML = (L.guest || []).map(x => `<li>${x}</li>`).join('');
  $('#pros').innerHTML = L.pros.map(x => `<li>${x}</li>`).join(''); $('#cons').innerHTML = L.cons.map(x => `<li>${x}</li>`).join('');
  const passTxt = (v) => v === null ? '–' : v >= 0.8 ? '≥ 80 cm' : cm(v) + ' cm';
  $('#metrics').innerHTML = `
    <div class="m"><b>${Math.round(a.freeDay * 100)}%</b><span>wolnej podłogi – dzień</span></div>
    <div class="m"><b>${Math.round(a.freeNight * 100)}%</b><span>wolnej podłogi – noc</span></div>
    <div class="m"><b>${passTxt(a.passNight)}</b><span>najwęższe przejście do strefy biurka w nocy (min.)</span></div>
    <div class="m"><b>ok. ${a.docs}</b><span>segregatorów A4 na półkach</span></div>`;
  const rows = [];
  const seen = new Set();
  for (const f of footprints(L, 'night').concat(footprints(L, 'day'))) {
    const key = f.label + f.x + f.y; if (seen.has(key)) continue; seen.add(key);
    rows.push(`<tr><td>${f.label}</td><td>${cm(f.w)}×${cm(f.d)}${f.wall ? '' : ''}</td><td>${f.wall ? cm(f.z0) + '–' + cm(f.z0 + f.h) : f.kind === 'bed' ? cm(f.z0 + f.h) : cm(f.h)}</td></tr>`);
  }
  $('#furn').innerHTML = rows.join('');
  $('#outlets').innerHTML = OUTLETS.map(o => { const s = outletStatus(L, o); const ok = s === 'dostępne'; return `<li class="${ok ? 'ok' : 'warn'}"><b>${o.id}</b> ${o.label.split('–')[1].trim()} → ${s}</li>`; }).join('');
  drawPlan(L);
  const w = a.errors.length ? a.errors.join('<br>') : '';
  $('#errs').innerHTML = w ? `<div class="err">${w}</div>` : '';
  try { history.replaceState(null, '', '#' + GROUPS[gi].id + '-' + L.id); } catch (e) { /* podgląd w piaskownicy – pomijamy */ }
}

function drawPlan(L) {
  const S = 92, ox = 18, oy = 22, W = ROOM.W, D = ROOM.D; const P = ROOM.pillar;
  const fp = footprints(L, mode);
  const rects = fp.map(f => {
    const cls = f.kind === 'zone' ? 'zone' : f.kind === 'bed' ? 'bed' : f.ref.type === 'wallbed' ? 'cab' : f.wall ? 'wsh' : 'fn';
    return `<rect class="${cls}" x="${ox + f.x * S}" y="${oy + f.y * S}" width="${f.w * S}" height="${f.d * S}" rx="2"/>`;
  }).join('');
  const labels = fp.filter(f => !f.wall).map(f => `<text x="${ox + (f.x + f.w / 2) * S}" y="${oy + (f.y + f.d / 2) * S + 3}" text-anchor="middle" class="tl">${shortName(f)}</text>`).join('');
  const outs = OUTLETS.map(o => { const p = o.wall === 'N' ? [o.pos, 0] : o.wall === 'S' ? [o.pos, D] : o.wall === 'W' ? [0, o.pos] : [W, o.pos]; return `<circle cx="${ox + p[0] * S}" cy="${oy + p[1] * S}" r="4" class="${o.kind}"/>`; }).join('');
  const r = ROOM.radiator;
  $('#plan').innerHTML = `<svg viewBox="0 0 ${W * S + 2 * ox} ${D * S + 2 * oy + 8}" xmlns="http://www.w3.org/2000/svg">
    <path d="M${ox},${oy} H${ox + W * S} V${oy + P.y0 * S} H${ox + P.x0 * S} V${oy + P.y1 * S} H${ox + W * S} V${oy + D * S} H${ox} Z" class="room"/>
    <rect x="${ox + ROOM.window.x0 * S}" y="${oy - 3}" width="${(ROOM.window.x1 - ROOM.window.x0) * S}" height="6" class="win"/>
    <rect x="${ox + r.x0 * S}" y="${oy}" width="${(r.x1 - r.x0) * S}" height="${(r.y1) * S}" class="rad"/>
    <rect x="${ox + ROOM.door.x0 * S}" y="${oy + D * S - 3}" width="${(ROOM.door.x1 - ROOM.door.x0) * S}" height="6" class="door"/>
    <path d="M${ox + ROOM.door.x0 * S},${oy + D * S} A${0.844 * S},${0.844 * S} 0 0 1 ${ox + ROOM.door.x1 * S},${oy + (D - 0.844) * S}" class="swing"/>
    ${rects}${labels}${outs}
    <text x="${ox}" y="${oy - 8}" class="cap">okno (N)</text><text x="${ox}" y="${oy + D * S + 16}" class="cap">drzwi (S)</text></svg>`;
}
function shortName(f) {
  if (f.kind === 'bed') return 'łóżko ' + cm(f.w) + '×' + cm(f.d); const t = f.ref.type; if (f.kind === 'zone') return ''; if (t === 'box') return f.ref.wardrobe ? 'szafa' : f.ref.bedside ? 'nocna' : f.ref.underDesk ? '' : (/^Komoda/.test(f.ref.label) ? 'komoda' : 'ława'); return { wallbed: 'szafa', desk: 'biurko', chair: '', armchair: 'fotel', sofa: 'sofa', sofabed: 'łóżko', tower: 'regał', box: 'komoda', table: '', fixedbed: 'łóżko 140×200', printer: '', drawers: '', rail: '' }[t] ?? '';
}

// zakładki
const tabs = $('#tabs');
function buildTabs() {
  tabs.innerHTML = '';
  curLayouts().forEach((L, i) => { const b = document.createElement('button'); b.className = 'tab'; b.textContent = L.id; b.title = L.name; b.onclick = () => setLayout(i); tabs.appendChild(b); });
  if (gi === 0 && curLayouts().length === 0) tabs.textContent = 'Brak układów tego rodzaju';
}
function setGroup(g, i = 0) {
  gi = g; buildTabs(); setLayout(Math.min(i, curLayouts().length - 1));
  document.querySelectorAll('#grp button').forEach((b, k) => b.classList.toggle('on', (k === 0 && g === 0) || (k === 1 && g > 0)));
  $('#oldsel').style.display = g > 0 ? '' : 'none'; $('#oldsel').value = String(g);
  $('#bedsel').style.display = g === 0 ? '' : 'none'; $('#deskvar').style.display = g === 0 ? '' : 'none';
}
document.querySelectorAll('#grp button')[0].onclick = () => setGroup(0);
document.querySelectorAll('#grp button')[1].onclick = () => setGroup(parseInt($('#oldsel').value) || 1);
$('#oldsel').onchange = (e) => setGroup(parseInt(e.target.value));
$('#deskvar').onchange = (e) => { deskVar = e.target.value; setLayout(cur); };
$('#bedsel').onchange = (e) => { bedFilter = e.target.value; buildTabs(); setLayout(0); };
document.querySelectorAll('input[name=mode]').forEach(r => r.addEventListener('change', e => { mode = e.target.value; bedAnim.target = mode === 'night' ? 1 : 0; drawPlan(layoutAt(cur)); }));
$('#cDoor').onchange = (e) => { doorTarget = e.target.checked ? -Math.PI / 2 * 0.98 : 0; };
$('#cOut').onchange = (e) => { outletG.visible = e.target.checked; outletLabels.forEach(l => l.visible = e.target.checked); };
$('#cDim').onchange = (e) => { dimG.visible = e.target.checked; dimLabels.forEach(l => l.visible = e.target.checked); };
$('#sWall').onchange = (e) => { wallMode = e.target.value; };

// kamera – presety
let camTween = null;
function goCam(pos, tgt) { camTween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: new THREE.Vector3(...pos), t1: new THREE.Vector3(...tgt), k: 0 }; }
const presets = {
  persp: [[6.4, 5.2, 6.8], [ROOM.W / 2, 0.9, ROOM.D / 2]],
  top: [[ROOM.W / 2, 10.5, ROOM.D / 2 + 0.01], [ROOM.W / 2, 0, ROOM.D / 2]],
  door: [[3.0, 2.3, 6.2], [1.7, 0.7, 1.4]],
  window: [[1.6, 2.5, -3.6], [1.7, 0.6, 2.2]],
  west: [[-4.2, 2.6, 1.8], [1.9, 0.6, 1.8]],
};
document.querySelectorAll('[data-cam]').forEach(b => b.onclick = () => goCam(...presets[b.dataset.cam]));
$('#shot').onclick = () => { renderer.render(scene, camera); const a = document.createElement('a'); a.href = renderer.domElement.toDataURL('image/png'); a.download = `pokoj-${GROUPS[gi].id}-uklad-${curLayouts()[cur].id}-${mode === 'night' ? 'noc' : 'dzien'}.png`; a.click(); };

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h); labelRenderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

function tick() {
  requestAnimationFrame(tick);
  bedAnim.t += (bedAnim.target - bedAnim.t) * 0.08; if (Math.abs(bedAnim.target - bedAnim.t) < 0.002) bedAnim.t = bedAnim.target; applyBed();
  doorAng += (doorTarget - doorAng) * 0.12; leafPivot.rotation.y = doorAng;
  if (camTween) { camTween.k = Math.min(1, camTween.k + 0.035); const e = camTween.k < 0.5 ? 2 * camTween.k * camTween.k : 1 - Math.pow(-2 * camTween.k + 2, 2) / 2; camera.position.lerpVectors(camTween.p0, camTween.p1, e); controls.target.lerpVectors(camTween.t0, camTween.t1, e); if (camTween.k >= 1) camTween = null; }
  controls.update(); updateWalls();
  renderer.render(scene, camera); labelRenderer.render(scene, camera);
}
resize();
const hashStr = (() => { try { return location.hash; } catch (e) { return ''; } })();
const hm = hashStr.match(/#(cur|v1|v2|v3)-(\d+)/);
const startG = hm ? Math.max(0, GROUPS.findIndex(g => g.id === hm[1])) : 0; const startL = hm ? Math.max(0, GROUPS[startG].layouts.findIndex(L => L.id === parseInt(hm[2]))) : 0;
setGroup(startG, startL); tick();
window.__app = { setLayout, setGroup, goCam, presets, setMode: (m) => { document.querySelector(`input[name=mode][value=${m}]`).click(); }, camera, controls, scene };
