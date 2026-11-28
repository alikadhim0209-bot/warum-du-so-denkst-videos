// "Papa ist nicht Papa" – Low-Poly-3D in Ich-Perspektive (Dunkle_Akte-Stil)
// Eine Welt mit mehreren Sets. plan.shots bestimmt pro Zeitpunkt Set + Kamera.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makeHand, makeThumb, placeHand } from '/hand.js';
import { makePapa, makeKid } from '/papa/figure.js';

const W = 1080, H = 1920;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };
const wob = (t, s) => noise(t * 0.8 + s) * 0.6 + noise(t * 2.1 + s * 1.7) * 0.3 + noise(t * 5.3 + s * 2.9) * 0.1;
const inR = (t, r) => r && t >= r[0] && t < r[1];
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const flick = (t, rate, seed, thr = 0.4) => (hash(Math.floor(t * rate) * seed) > thr ? 1 : 0);

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0, flatShading: true, ...o });
const EM = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const RB = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 3, r);
const CY = (rt, rb, h, s = 14) => new THREE.CylinderGeometry(rt, rb, h, s);
function add(parent, geo, mat, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
}
function canvasTex(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { c, ctx: c.getContext('2d'), tex };
}
function textPlane(parent, w, h, pw, ph, draw, x, y, z, o = {}) {
  const t = canvasTex(w, h); draw(t.ctx, w, h); t.tex.needsUpdate = true;
  const mat = o.basic ? new THREE.MeshBasicMaterial({ map: t.tex, transparent: !!o.transparent, toneMapped: false }) : new THREE.MeshStandardMaterial({ map: t.tex, roughness: 0.8, transparent: !!o.transparent });
  return add(parent, new THREE.PlaneGeometry(pw, ph), mat, x, y, z, false);
}

const PAL = {
  night: 0x070912, wall: 0x29304a, wallD: 0x1d2236, floor: 0x2a211d, wood: 0x4a3426, woodD: 0x2e2119,
  grass: 0x1f3a26, grassD: 0x16291b, hedge: 0x163020, fence: 0x5b4a3a, path: 0x3b3a3e, facade: 0x5a5f72, roof: 0x2b2026,
  skin: 0xdcae8c, sleeve: 0x2f3a52, cuff: 0x242c40,
};

export async function build({ canvas, plan }) {
  const P = plan, EV = plan.ev;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.55;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const BG_NIGHT = new THREE.Color(0x0a0e1e), BG_MORNING = new THREE.Color(0x6f7a92);
  scene.background = BG_NIGHT.clone();
  scene.fog = new THREE.Fog(0x0a0e1e, 8, 42);
  const camera = new THREE.PerspectiveCamera(60, W / H, 0.01, 120);
  scene.add(camera);
  const groups = {};
  const G = (name, x = 0) => { const g = new THREE.Group(); g.position.x = x; scene.add(g); groups[name] = g; return g; };

  // =====================================================================
  // GARTEN + HAUS + GARAGE + STRASSE (Welt um x=0)
  // Hausrückseite bei z=0 (Garten Richtung +z), Straße bei z≈18
  // =====================================================================
  const gd = G('garden');
  add(gd, B(40, 0.1, 40), M(PAL.grass), 0, -0.05, 10, false);
  for (let i = 0; i < 260; i++) { // Grasbüschel
    const x = (hash(i * 3.1) - 0.5) * 18, z = 1 + hash(i * 7.7) * 13.5;
    const b = add(gd, new THREE.ConeGeometry(0.06, 0.16, 4), M(i % 2 ? PAL.grassD : 0x24452c), x, 0.06, z, false); b.rotation.y = i;
  }
  add(gd, B(3.2, 0.06, 2.6), M(PAL.path), -2, 0.02, 1.3, false); // Terrasse
  // Hecke (niedrig, mit Lücke) bei z=6
  const mHedge = M(PAL.hedge);
  for (let x = -8; x <= 8; x += 0.7) if (Math.abs(x + 0.2) > 0.9) {
    const h = add(gd, new THREE.SphereGeometry(0.55, 8, 6), mHedge, x, 0.55, 6); h.scale.set(1, 1.1, 0.8);
  }
  // Lattenzaun um die Terrasse (z=2.8)
  const mFence = M(PAL.fence);
  for (let x = -4.2; x <= 4.2; x += 0.22) if (Math.abs(x - 0.2) > 0.6) add(gd, B(0.08, 0.9, 0.04), mFence, x, 0.45, 2.8);
  for (const y of [0.3, 0.7]) { add(gd, B(3.6, 0.06, 0.04), mFence, -2.4, y, 2.82); add(gd, B(3.6, 0.06, 0.04), mFence, 2.8, y, 2.82); }
  // Grundstückszaun hinten (z=15) mit Gartentor bei x=2
  const mMetal = M(0x2b2f38, { metalness: 0.5, roughness: 0.5 });
  for (let x = -3.4; x <= 9; x += 0.16) if (Math.abs(x - 2) > 0.62) add(gd, CY(0.018, 0.018, 1.6, 6), mMetal, x, 0.8, 15, false);
  for (const y of [0.1, 1.55]) { add(gd, B(4.8, 0.05, 0.05), mMetal, -1.0, y, 15); add(gd, B(6.4, 0.05, 0.05), mMetal, 5.8, y, 15); }
  const gate = new THREE.Group(); gate.position.set(1.4, 0, 15); gd.add(gate);
  for (let x = 0.05; x < 1.2; x += 0.13) add(gate, CY(0.02, 0.02, 1.7, 6), mMetal, x, 0.85, 0, false);
  for (const y of [0.12, 0.85, 1.62]) add(gate, B(1.2, 0.05, 0.05), mMetal, 0.6, y, 0, false);
  const lock = add(gate, B(0.09, 0.13, 0.06), M(0xb08a43, { metalness: 0.7, roughness: 0.3 }), 1.06, 0.95, 0.06, false);
  for (const x of [1.36, 2.64]) add(gd, B(0.12, 1.9, 0.12), mMetal, x, 0.95, 15);
  // Straße + Gehweg
  add(gd, B(40, 0.08, 1.8), M(0x46474d), 0, 0.0, 16.0, false);
  add(gd, B(40, 0.06, 8), M(0x1d1e22), 0, -0.01, 21, false);
  for (let x = -18; x < 18; x += 3) add(gd, B(1.4, 0.01, 0.15), EM(0x8b8b80), x, 0.03, 21, false);
  // Straßenlaterne
  add(gd, CY(0.05, 0.07, 5, 8), mMetal, -4, 2.5, 17.2);
  add(gd, B(0.6, 0.12, 0.25), mMetal, -3.75, 5, 17.2);
  const lampBulb = add(gd, B(0.4, 0.04, 0.18), EM(0xffd6a0), -3.7, 4.93, 17.2, false);
  const streetLamp = new THREE.SpotLight(0xffc98a, 40, 18, 0.75, 0.6, 1.6); streetLamp.position.set(-3.7, 4.9, 17.2); streetLamp.target.position.set(-3.2, 0, 17.6); gd.add(streetLamp, streetLamp.target);

  // --- Haus (Rückseite mit Öffnungen) ---
  const mFac = M(PAL.facade), mFrame = M(0xd8d4cc), mGlass = M(0x0d1220, { roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.35 });
  // Fassade: Raster aus Blöcken um Terrassentür (x -2.8..-1.2, y 0..2.3), Küchenfenster (x 1.9..3.1, y 1.0..2.1),
  // Kinderzimmerfenster OG (x 0.9..2.1, y 3.6..4.9)
  const FZ = 0;
  const fac = (x0, x1, y0, y1) => add(gd, B(x1 - x0, y1 - y0, 0.3), mFac, (x0 + x1) / 2, (y0 + y1) / 2, FZ - 0.15);
  fac(-6, -2.8, 0, 3.2); fac(-1.2, 1.9, 0, 3.2); fac(3.1, 6, 0, 3.2); fac(-2.8, -1.2, 2.3, 3.2); fac(1.9, 3.1, 0, 1.0); fac(1.9, 3.1, 2.1, 3.2);
  fac(-6, 0.9, 3.2, 6.6); fac(2.1, 6, 3.2, 6.6); fac(0.9, 2.1, 3.2, 3.6); fac(0.9, 2.1, 4.9, 6.6);
  add(gd, B(12, 0.12, 0.4), M(0x3b3f4c), 0, 3.2, 0.05, false); // Gesims
  const roof = add(gd, B(12.6, 0.25, 6), M(PAL.roof), 0, 7.4, -2.2); roof.rotation.x = 0.55;
  add(gd, B(12, 6.6, 0.3), mFac, 0, 3.3, -8);
  for (const x of [-6, 6]) add(gd, B(0.3, 6.6, 8), mFac, x, 3.3, -4);
  // Fensterrahmen
  const winFrame = (x0, x1, y0, y1, g = gd) => {
    for (const x of [x0, x1]) add(g, B(0.08, y1 - y0 + 0.08, 0.12), mFrame, x, (y0 + y1) / 2, FZ + 0.02, false);
    for (const y of [y0, y1]) add(g, B(x1 - x0 + 0.08, 0.08, 0.12), mFrame, (x0 + x1) / 2, y, FZ + 0.02, false);
  };
  winFrame(-2.8, -1.2, 0.0, 2.3); winFrame(1.9, 3.1, 1.0, 2.1); winFrame(0.9, 2.1, 3.6, 4.9);
  add(gd, B(1.2, 0.06, 0.25), mFrame, 1.5, 3.57, 0.12, false); // Fensterbank OG
  // Terrassentür (Glas, aufklappbar)
  const tdoor = new THREE.Group(); tdoor.position.set(-2.76, 0, FZ - 0.02); gd.add(tdoor);
  add(tdoor, B(1.52, 2.25, 0.04), mGlass, 0.76, 1.13, 0, false);
  for (const x of [0.02, 1.5]) add(tdoor, B(0.06, 2.25, 0.06), mFrame, x, 1.13, 0, false);
  // Licht hinter Küchenfenster und Terrassentür (warm, ein-/ausschaltbar)
  const kitchenGlow = add(gd, B(1.2, 1.1, 0.02), EM(0xffd08a), 2.5, 1.55, -0.6, false);
  const terraceGlow = add(gd, B(1.6, 2.3, 0.02), EM(0x3b2a1e), -2, 1.15, -1.2, false);
  const kitchenSpill = new THREE.PointLight(0xffc27a, 0, 9, 1.6); kitchenSpill.position.set(2.5, 1.6, 0.9); gd.add(kitchenSpill);
  // Gartenlicht über Terrassentür
  const wallLamp = add(gd, B(0.16, 0.22, 0.12), EM(0xffe2b0), -2, 2.7, 0.12, false);
  const terraceLight = new THREE.SpotLight(0xffd59a, 18, 12, 0.95, 0.7, 1.6); terraceLight.position.set(-2, 2.6, 0.4); terraceLight.target.position.set(-1.5, 0, 4); gd.add(terraceLight, terraceLight.target);

  const lawnSpot = new THREE.SpotLight(0xffe0b0, 30, 22, 0.55, 0.7, 1.4); lawnSpot.position.set(4.5, 3.2, 3.2); lawnSpot.target.position.set(0, 0, 9.5); gd.add(lawnSpot, lawnSpot.target);
  // --- Kinderzimmer OG (Innenraum hinter dem Fenster) ---
  const bed = new THREE.Group(); gd.add(bed);
  add(bed, B(3.6, 0.05, 3.6), M(0x3a2c26), 1.5, 3.25, -1.9, false);       // Boden OG
  add(bed, B(3.6, 2.8, 0.05), M(0x3a4166), 1.5, 4.65, -3.7, false);       // Rückwand
  for (const x of [-0.3, 3.3]) add(bed, B(0.05, 2.8, 3.6), M(0x343b5c), x, 4.65, -1.9, false);
  add(bed, B(3.6, 0.05, 3.6), M(0x262a40), 1.5, 6.05, -1.9, false);
  // Vorhänge
  const mCurt = M(0x5c3a55, { side: THREE.DoubleSide });
  const curtL = add(bed, B(0.35, 1.6, 0.04), mCurt, 0.7, 4.3, -0.22, false);
  const curtR = add(bed, B(0.35, 1.6, 0.04), mCurt, 2.3, 4.3, -0.22, false);
  // Fensterflügel (klappt nach innen auf)
  const sash = new THREE.Group(); sash.position.set(0.92, 3.62, -0.06); gd.add(sash);
  add(sash, B(1.16, 1.26, 0.03), mGlass, 0.58, 0.63, 0, false);
  for (const x of [0.02, 1.14]) add(sash, B(0.06, 1.26, 0.06), mFrame, x, 0.63, 0, false);
  for (const y of [0.02, 1.24]) add(sash, B(1.16, 0.06, 0.06), mFrame, 0.58, y, 0, false);
  add(sash, B(0.04, 0.16, 0.05), M(0xcfcfcf, { metalness: 0.6 }), 1.08, 0.63, -0.05, false);
  const roomLamp = new THREE.PointLight(0x8a7cff, 0.6, 5, 2); roomLamp.position.set(2.8, 3.8, -2.8); gd.add(roomLamp); // Nachtlicht

  // --- Garage (links hinten, Tor zur Straße bei z=14.6) ---
  const gar = new THREE.Group(); gd.add(gar);
  const mGar = M(0x4d5263), mGarD = M(0x2c303c);
  const GX0 = -8, GX1 = -3.6, GZ0 = 9, GZ1 = 14.6, GH = 2.7;
  add(gar, B(GX1 - GX0, GH, 0.2), mGar, (GX0 + GX1) / 2, GH / 2, GZ0);
  for (const x of [GX0, GX1]) add(gar, B(0.2, GH, GZ1 - GZ0), mGar, x, GH / 2, (GZ0 + GZ1) / 2);
  add(gar, B(GX1 - GX0 + 0.4, 0.18, GZ1 - GZ0 + 0.4), M(0x2a2228), (GX0 + GX1) / 2, GH + 0.09, (GZ0 + GZ1) / 2);
  // Frontwand mit Toröffnung x -7.2..-4.4, y 0..2.2
  add(gar, B(0.8, GH, 0.2), mGar, -7.6, GH / 2, GZ1); add(gar, B(0.8, GH, 0.2), mGar, -4.0, GH / 2, GZ1);
  add(gar, B(2.8, GH - 2.2, 0.2), mGar, -5.8, 2.2 + (GH - 2.2) / 2, GZ1);
  const garDoor = new THREE.Group(); garDoor.position.set(-5.8, 0, GZ1 + 0.05); gar.add(garDoor);
  const doorPanel = add(garDoor, B(2.8, 2.14, 0.06), M(0x8c8f98), 0, 1.13, 0);
  for (const y of [0.45, 0.95, 1.45, 1.95]) add(garDoor, B(2.8, 0.03, 0.08), M(0x6c6f78), 0, y, 0, false);
  const garDoorBase = { y: 0 };
  // Seitentür zum Garten (x=GX1, z=11)
  add(gar, B(0.06, 2.0, 0.9), M(0x3b2c22), GX1 + 0.12, 1.0, 11.4);
  // Innenlicht (Schein unter dem Tor + im Spalt)
  const garInside = new THREE.PointLight(0xffb36b, 0, 8, 1.5); garInside.position.set(-5.8, 2.0, 11.8); gar.add(garInside);
  const gapGlow = add(gar, B(2.8, 0.06, 0.02), EM(0x000000), -5.8, 0.03, GZ1 + 0.09, false);
  // Grill + Radio in der Garage
  add(gar, B(0.9, 0.9, 0.6), M(0x1a1a1c, { metalness: 0.5 }), -6.2, 0.45, 11.5);
  add(gar, B(0.4, 0.22, 0.16), M(0x5a3a22), -4.5, 1.1, 10.0);
  // Gasflaschen-Käfig neben dem Tor (außen, Straßenseite)
  const cage = new THREE.Group(); cage.position.set(-3.0, 0, 15.6); gd.add(cage);
  const bottles = [];
  for (let i = 0; i < 4; i++) {
    const bx = -0.45 + i * 0.3;
    const bt = add(cage, CY(0.13, 0.13, 0.75, 14), M(0x8a2a24, { flatShading: false, roughness: 0.5 }), bx, 0.4, 0);
    add(cage, new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x8a2a24, { flatShading: false, roughness: 0.5 }), bx, 0.77, 0);
    const valve = add(cage, CY(0.03, 0.03, 0.1, 8), M(0x9a9aa0, { metalness: 0.7 }), bx, 0.95, 0);
    const knob = add(cage, CY(0.06, 0.06, 0.02, 10), M(0x2a2a2a), bx, 1.01, 0); bottles.push(knob);
    // Schlauch unters Tor
    const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(bx, 0.95, 0), V(bx - 0.2, 0.6, -0.3), V(-1.2 + i * 0.2, 0.05, -0.6), V(-2.0 + i * 0.25, 0.03, -0.9)]), 16, 0.015, 6), M(0x111111));
    cage.add(hose);
  }
  for (const x of [-0.7, 0.7]) add(cage, B(0.04, 1.3, 0.04), mMetal, x, 0.65, 0.3, false);
  add(cage, B(1.44, 0.04, 0.04), mMetal, 0, 1.3, 0.3, false);
  for (let x = -0.6; x <= 0.6; x += 0.2) add(cage, B(0.015, 1.3, 0.015), mMetal, x, 0.65, 0.3, false);
  // Feuer
  const fireG = new THREE.Group(); fireG.position.set(-5.8, 0, 12); gd.add(fireG);
  const flames = [];
  for (let i = 0; i < 16; i++) {
    const f = add(fireG, new THREE.ConeGeometry(0.5 + hash(i) * 0.5, 2.5 + hash(i * 3) * 2, 6), EM(i % 3 ? 0xff7a1a : 0xffc040, { transparent: true, opacity: 0.85 }), (hash(i * 5) - 0.5) * 4, 1.5, (hash(i * 9) - 0.5) * 4.5, false);
    flames.push(f);
  }
  const smoke = [];
  for (let i = 0; i < 10; i++) smoke.push(add(fireG, new THREE.SphereGeometry(1, 8, 6), M(0x1a1714, { transparent: true, opacity: 0.6 }), 0, 4, 0, false));
  const fireLight = new THREE.PointLight(0xff7a2a, 0, 30, 1.3); fireLight.position.set(0, 3, 3); fireG.add(fireLight);
  const fireball = add(fireG, new THREE.SphereGeometry(1, 16, 12), EM(0xffd27a, { transparent: true, opacity: 0.9 }), 0, 1.5, 2.5, false);
  fireG.visible = false;

  // --- Rasenmäher ---
  const mower = new THREE.Group(); gd.add(mower);
  add(mower, RB(0.5, 0.22, 0.6, 0.05), M(0xb3261e), 0, 0.2, 0);
  add(mower, CY(0.12, 0.14, 0.18, 10), M(0x222), 0, 0.38, -0.05);
  for (const [x, z] of [[-0.27, -0.24], [0.27, -0.24], [-0.27, 0.24], [0.27, 0.24]]) { const w = add(mower, CY(0.09, 0.09, 0.05, 12), M(0x151515), x, 0.09, z); w.rotation.z = Math.PI / 2; }
  for (const x of [-0.2, 0.2]) { const h = add(mower, CY(0.015, 0.015, 1.0, 6), M(0x333), x, 0.62, -0.62); h.rotation.x = -0.95; }
  add(mower, CY(0.015, 0.015, 0.44, 6), M(0x333), 0, 0.98, -0.98).rotation.z = Math.PI / 2;
  // --- Streifenwagen ---
  const car = new THREE.Group(); car.position.set(5, 0, 19.2); gd.add(car);
  add(car, RB(4.2, 0.7, 1.8, 0.15), M(0xe8e8ea), 0, 0.6, 0);
  add(car, RB(2.4, 0.6, 1.6, 0.15), M(0x26303f, { roughness: 0.3 }), -0.2, 1.2, 0);
  textPlane(car, 512, 96, 1.8, 0.34, (g, w, h) => { g.fillStyle = '#1b4f8c'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '700 64px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('POLIZEI', w / 2, h / 2 + 3); }, 0, 0.62, -0.905).rotation.y = Math.PI;
  add(car, B(4.22, 0.12, 1.82), M(0x1b4f8c), 0, 0.42, 0, false);
  for (const [x, z] of [[-1.4, -0.85], [1.4, -0.85], [-1.4, 0.85], [1.4, 0.85]]) { const w = add(car, CY(0.33, 0.33, 0.22, 14), M(0x111), x, 0.33, z); w.rotation.x = Math.PI / 2; }
  const blueL = add(car, B(0.35, 0.12, 0.3), EM(0x2a5cff), -0.45, 1.56, 0, false), blueR = add(car, B(0.35, 0.12, 0.3), EM(0x2a5cff), 0.05, 1.56, 0, false);
  const siren = new THREE.PointLight(0x3a64ff, 0, 22, 1.4); siren.position.set(-0.2, 2.0, -0.6); car.add(siren);
  car.visible = false;
  // --- Taxi ---
  const taxi = new THREE.Group(); taxi.position.set(-1, 0, 19.2); gd.add(taxi);
  add(taxi, RB(4.2, 0.7, 1.8, 0.15), M(0xe9dcb4), 0, 0.6, 0);
  add(taxi, RB(2.4, 0.6, 1.6, 0.15), M(0x26303f, { roughness: 0.3 }), -0.2, 1.2, 0);
  textPlane(taxi, 256, 96, 0.5, 0.18, (g, w, h) => { g.fillStyle = '#f3d23a'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.font = '700 70px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TAXI', w / 2, h / 2 + 3); }, -0.2, 1.62, -0.0, { basic: true }).rotation.y = Math.PI;
  for (const [x, z] of [[-1.4, -0.85], [1.4, -0.85], [-1.4, 0.85], [1.4, 0.85]]) { const w = add(taxi, CY(0.33, 0.33, 0.22, 14), M(0x111), x, 0.33, z); w.rotation.x = Math.PI / 2; }
  taxi.visible = false;

  // --- Figuren im Garten ---
  const papas = [makePapa(), makePapa(), makePapa()];
  papas.forEach((p) => gd.add(p.root));
  const cop = makePapa({ outfit: 'cop' }); gd.add(cop.root);
  const flashlight = new THREE.SpotLight(0xfff2d0, 0, 20, 0.28, 0.5, 1.2); gd.add(flashlight, flashlight.target);
  const ring = add(gd, new THREE.TorusGeometry(0.012, 0.004, 6, 14), M(0xd8b04a, { metalness: 0.8, roughness: 0.25 }), 0, 0, 0, false);
  const leaG = makeKid(); gd.add(leaG.root);

  // Mondlicht + Himmel
  const moon = new THREE.DirectionalLight(0x8ea4ff, 2.2); moon.position.set(-10, 18, 25); moon.target.position.set(0, 0, 6);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 }); moon.shadow.bias = -0.0008;
  gd.add(moon, moon.target);
  const hemi = new THREE.HemisphereLight(0x5068a8, 0x1a1a14, 0.55); gd.add(hemi);
  const moonDisc = add(gd, new THREE.CircleGeometry(1.2, 24), EM(0xdfe6ff, { fog: false }), -14, 24, 45, false); moonDisc.lookAt(0, 0, 0);
  const faceLightG = new THREE.PointLight(0xdfe4f5, 0, 3, 2); gd.add(faceLightG);

  // =====================================================================
  // INNENRÄUME (weit weg, eigene Lichter)
  // =====================================================================
  function room(g, w, d, h, wall = PAL.wall, floor = PAL.floor) {
    add(g, B(w, 0.06, d), M(floor), 0, -0.03, 0, false);
    add(g, B(w, 0.06, d), M(0x15182a), 0, h + 0.03, 0, false);
    add(g, B(w, h, 0.06), M(wall), 0, h / 2, -d / 2, false);
    add(g, B(w, h, 0.06), M(wall), 0, h / 2, d / 2, false);
    add(g, B(0.06, h, d), M(wall), -w / 2, h / 2, 0, false);
    add(g, B(0.06, h, d), M(wall), w / 2, h / 2, 0, false);
  }
  // --- Leas Zimmer ---
  const kr = G('kidsroom', 100);
  room(kr, 3.6, 4, 2.6, 0x3a3f66);
  add(kr, B(1.0, 0.35, 2.0), M(0x6b4b3a), -1.1, 0.2, -0.9);
  add(kr, B(0.95, 0.12, 1.95), M(0xe9e0f0), -1.1, 0.42, -0.9);
  const blanket = add(kr, B(0.98, 0.14, 1.3), M(0x7c5fb0), -1.1, 0.5, -0.55);
  add(kr, RB(0.6, 0.12, 0.35, 0.05), M(0xf2ecf6), -1.1, 0.53, -1.6);
  const leaBed = makeKid(); kr.add(leaBed.root); leaBed.root.position.set(-1.1, 0.53, -0.45); leaBed.root.rotation.x = -Math.PI / 2; leaBed.root.scale.setScalar(0.95);
  const nl = add(kr, new THREE.SphereGeometry(0.08, 12, 10), EM(0xffb36a), 0.6, 0.55, -1.8, false);
  add(kr, B(0.5, 0.5, 0.4), M(0x5a4030), 0.6, 0.25, -1.8);
  const nlL = new THREE.PointLight(0xffa860, 2.2, 5, 1.6); nlL.position.set(0.6, 0.75, -1.6); kr.add(nlL);
  textPlane(kr, 256, 320, 0.5, 0.62, (g, w, h) => { g.fillStyle = '#e7b6c8'; g.fillRect(0, 0, w, h); g.fillStyle = '#7a4a8a'; g.beginPath(); g.arc(128, 140, 70, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '700 40px Inter'; g.textAlign = 'center'; g.fillText('LEA', 128, 270); }, -1.0, 1.5, -1.96);
  kr.add(new THREE.HemisphereLight(0x5060a0, 0x101018, 0.6));

  // --- Treppe + Wohnzimmer ---
  const lv = G('living', 200);
  room(lv, 6, 7, 2.7);
  // Treppe (von oben hinten nach unten vorne), Kamera steht oben bei z=+3.4, y=2.4
  for (let i = 0; i < 9; i++) add(lv, B(1.1, 0.2, 0.3), M(PAL.wood), 2.2, 2.3 - i * 0.26, 3.3 - i * 0.3);
  // Sofa
  add(lv, B(2.4, 0.45, 0.9), M(0x4a3b5a), -0.5, 0.25, -1.8);
  add(lv, B(2.4, 0.6, 0.25), M(0x3e3150), -0.5, 0.75, -2.2);
  for (const x of [-1.7, 0.7]) add(lv, B(0.25, 0.7, 0.9), M(0x3e3150), x, 0.4, -1.8);
  // Fernseher gegenüber (an der Wand vorn rechts), leuchtet blau
  const tv = add(lv, B(1.4, 0.8, 0.05), EM(0x0a0a10), -0.5, 1.2, 0.95, false); tv.rotation.y = Math.PI;
  add(lv, B(1.5, 0.9, 0.06), M(0x0b0b0e), -0.5, 1.2, 1.0, false);
  add(lv, B(1.6, 0.5, 0.45), M(PAL.woodD), -0.5, 0.25, 1.15);
  const tvLight = new THREE.PointLight(0x7f9cff, 0, 12, 1.1); tvLight.position.set(-0.5, 1.2, 0.5); lv.add(tvLight);
  lv.add(new THREE.HemisphereLight(0x405090, 0x101014, 0.6));
  const papaSofa = makePapa(); lv.add(papaSofa.root);
  papaSofa.root.position.set(-0.55, 0.47, -1.75); papaSofa.root.rotation.set(0, Math.PI / 2, 0);
  const remote = add(lv, B(0.05, 0.03, 0.18), M(0x111), 0, 0, 0, false);
  const faceLightL = new THREE.PointLight(0x9fb0ff, 0, 2, 2); lv.add(faceLightL);

  // --- Abstellkammer ---
  const sc = G('storage', 300);
  room(sc, 1.8, 1.8, 2.4, 0x262b40);
  for (const y of [0.5, 1.0, 1.5, 2.0]) add(sc, B(0.4, 0.03, 1.6), M(PAL.woodD), -0.7, y, 0);
  for (let i = 0; i < 12; i++) add(sc, B(0.18 + hash(i) * 0.1, 0.2 + hash(i * 2) * 0.15, 0.2), M([0x6b5a40, 0x3d5a6b, 0x7a3a30, 0x5b6b3d][i % 4]), -0.7, 0.62 + Math.floor(i / 3) * 0.5, -0.6 + (i % 3) * 0.5);
  add(sc, B(0.3, 0.8, 0.3), M(0x6b6f7a), 0.65, 0.4, -0.6); // Staubsauger
  // Tür bei z=-0.9 (Kamera schaut nach -z), Lichtspalt unten
  const scDoor = new THREE.Group(); scDoor.position.set(-0.45, 0, -0.87); sc.add(scDoor);
  add(scDoor, B(0.9, 2.05, 0.05), M(0x4a3a2e), 0.45, 1.03, 0);
  for (const y of [0.55, 1.45]) add(scDoor, B(0.7, 0.6, 0.02), M(0x3d3026), 0.45, y, 0.03, false);
  const handle = new THREE.Group(); handle.position.set(0.8, 1.0, 0.06); scDoor.add(handle);
  add(handle, B(0.14, 0.025, 0.03), M(0xc9c9cc, { metalness: 0.8, roughness: 0.3 }), -0.06, 0, 0.02, false);
  add(scDoor, B(0.05, 0.12, 0.02), M(0xa9a9ac, { metalness: 0.8 }), 0.8, 0.9, 0.04, false);
  const key = add(scDoor, B(0.012, 0.05, 0.03), M(0xd8b04a, { metalness: 0.8 }), 0.8, 0.88, 0.07, false);
  const strip = add(sc, B(0.9, 0.025, 0.01), EM(0xffc884), 0, 0.012, -0.86, false);
  const feetBlock = [add(sc, B(0.14, 0.03, 0.012), EM(0x000000), -0.12, 0.013, -0.855, false), add(sc, B(0.14, 0.03, 0.012), EM(0x000000), 0.14, 0.013, -0.855, false)];
  const stripLight = new THREE.PointLight(0xffb870, 1.5, 3, 1.5); stripLight.position.set(0, 0.06, -0.75); sc.add(stripLight);
  const hallBeyond = new THREE.Group(); sc.add(hallBeyond); // Flur hinter der Tür (für Türöffnen)
  add(hallBeyond, B(1.6, 0.04, 4), M(PAL.floor), 0, -0.02, -3, false);
  add(hallBeyond, B(1.6, 2.4, 0.05), EM(0xffc27a), 0, 1.2, -5, false);
  const hallL = new THREE.PointLight(0xffc27a, 3, 6, 1.5); hallL.position.set(0, 1.5, -3.5); hallBeyond.add(hallL);
  for (const x of [-0.8, 0.8]) add(hallBeyond, B(0.05, 2.4, 4), M(PAL.wallD), x, 1.2, -3, false);
  sc.add(new THREE.HemisphereLight(0x3a4a80, 0x0a0a10, 0.5));
  const leaSc = makeKid(); sc.add(leaSc.root);
  const phoneGlowSc = new THREE.PointLight(0xa8b6ff, 0, 1.5, 2); sc.add(phoneGlowSc);

  // --- Küche ---
  const kt = G('kitchen', 400);
  room(kt, 5, 5, 2.6, 0x3a3f5a, 0x30302f);
  add(kt, B(1.4, 0.06, 0.9), M(PAL.wood), 0, 0.78, -0.8); // Tisch
  for (const [x, z] of [[-0.62, -1.17], [0.62, -1.17], [-0.62, -0.43], [0.62, -0.43]]) add(kt, B(0.06, 0.76, 0.06), M(PAL.woodD), x, 0.38, z);
  add(kt, B(0.5, 0.06, 0.5), M(PAL.woodD), 0, 0.46, -1.55); add(kt, B(0.5, 0.6, 0.05), M(PAL.woodD), 0, 0.8, -1.8);
  // Arbeitsplatte hinten mit Kaffeemaschine + Fenster
  add(kt, B(5, 0.9, 0.6), M(0x4b4f5e), 0, 0.45, -2.2);
  add(kt, B(5, 0.05, 0.62), M(0x8a8a90), 0, 0.92, -2.2);
  add(kt, B(0.3, 0.42, 0.3), M(0x18181a), 1.2, 1.15, -2.25);
  const coffeeLed = add(kt, B(0.04, 0.02, 0.01), EM(0xff3020), 1.2, 1.28, -2.09, false);
  add(kt, CY(0.08, 0.07, 0.15, 12), M(0x2a3a4a, { transparent: true, opacity: 0.7 }), 1.2, 1.0, -2.15);
  const kWin = new THREE.Group(); kWin.position.set(-1.2, 1.2, -2.47); kt.add(kWin);
  add(kWin, B(1.2, 1.0, 0.02), M(0x0c1428), 0, 0.5, 0, false);
  for (const x of [-0.6, 0.6, 0]) add(kWin, B(0.06, 1.06, 0.06), M(0xd8d4cc), x, 0.5, 0.02, false);
  for (const y of [0, 1]) add(kWin, B(1.26, 0.06, 0.06), M(0xd8d4cc), 0, y, 0.02, false);
  // Regal neben der Tür mit Bohrmaschine
  add(kt, B(0.8, 0.04, 0.3), M(PAL.woodD), 1.9, 1.3, 1.6);
  const drillShelf = new THREE.Group(); drillShelf.position.set(1.9, 1.42, 1.6); kt.add(drillShelf);
  // Hängelampe über dem Tisch
  add(kt, CY(0.006, 0.006, 0.6, 4), M(0x0c0c0c), 0, 2.3, -0.8, false);
  add(kt, new THREE.ConeGeometry(0.22, 0.18, 16, 1, true), M(0x2a2622, { side: THREE.DoubleSide }), 0, 1.95, -0.8, false);
  const kBulbMat = EM(0xffd79a);
  add(kt, new THREE.SphereGeometry(0.05, 12, 10), kBulbMat, 0, 1.9, -0.8, false).castShadow = false;
  const kSpot = new THREE.SpotLight(0xffc982, 18, 0, 1.05, 0.6, 1.8); kSpot.position.set(0, 1.88, -0.8); kSpot.target.position.set(0, 0, -0.8);
  kSpot.castShadow = true; kSpot.shadow.mapSize.set(1024, 1024); kSpot.shadow.bias = -0.0005; kt.add(kSpot, kSpot.target);
  const kSpill = new THREE.PointLight(0xffc982, 0.6, 6, 2); kSpill.position.set(0, 1.7, -0.8); kt.add(kSpill);
  const kHemi = new THREE.HemisphereLight(0x5060a0, 0x101014, 0.3); kt.add(kHemi);
  const papaK = makePapa(); kt.add(papaK.root);
  const paper = textPlane(kt, 512, 360, 0.56, 0.4, (g, w, h) => {
    g.fillStyle = '#e8e4da'; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h / 2); g.rotate(Math.PI); g.translate(-w / 2, -h / 2); // kopfüber
    g.fillStyle = '#111'; g.font = '700 54px Inter'; g.textAlign = 'center'; g.fillText('TAGESZEITUNG', w / 2, 64);
    g.fillRect(20, 80, w - 40, 4);
    g.font = '700 30px Inter'; g.fillText('MANN VERSCHWUNDEN', w / 2, 125);
    g.fillStyle = '#888'; g.fillRect(30, 150, 200, 150);
    g.fillStyle = '#444'; for (let y = 152; y < 340; y += 16) { g.fillRect(250, y, 230, 6); }
    for (let y = 312; y < 345; y += 16) g.fillRect(30, y, 200, 6);
    g.restore();
  }, 0, 0, 0);
  paper.material.side = THREE.DoubleSide;
  const faceLightK = new THREE.PointLight(0xdfe4f5, 0, 2.2, 2); kt.add(faceLightK);
  // POV-Hand mit Bohrmaschine
  const drill = new THREE.Group();
  add(drill, RB(0.07, 0.09, 0.22, 0.02), M(0xe3b81e), 0, 0, 0);
  add(drill, RB(0.055, 0.16, 0.07, 0.02), M(0x1b1b1d), 0, -0.1, -0.06);
  add(drill, RB(0.08, 0.05, 0.1, 0.015), M(0x1b1b1d), 0, -0.19, -0.06);
  const chuck = add(drill, CY(0.022, 0.03, 0.06, 10), M(0x2b2b2e, { metalness: 0.6 }), 0, 0, 0.14); chuck.rotation.x = Math.PI / 2;
  const bit = add(drill, CY(0.006, 0.006, 0.14, 6), M(0xc0c0c8, { metalness: 0.9, roughness: 0.2 }), 0, 0, 0.24); bit.rotation.x = Math.PI / 2;
  const drillOnShelf = drill.clone(); drillShelf.add(drillOnShelf); drillOnShelf.rotation.set(0, 1.2, 0);
  camera.add(drill);
  const drillLight = new THREE.PointLight(0xffd0a0, 0, 1.2, 2); drillLight.position.set(0.0, 0.05, -0.2); camera.add(drillLight);
  const drillHand = makeHand({ side: 1, skin: PAL.skin, sleeve: PAL.sleeve, cuff: PAL.cuff });
  drillHand.setPose({ index: [0.35, 0.2, 0.15], middle: [1.3, 1.4, 0.8], ring: [1.35, 1.45, 0.8], pinky: [1.4, 1.45, 0.8], thumb: [0.7, 0.6, -0.4, 0.5, 0.4] });
  camera.add(drillHand.root);

  // --- Handy (an der Kamera) + dunkler Hintergrund ---
  const ph = G('phone', 500);
  room(ph, 4, 4, 2.6, 0x1c2036, 0x15151a);
  const phAmb = new THREE.PointLight(0x5868b0, 1.2, 6, 2); phAmb.position.set(0.5, 1.6, -0.5); ph.add(phAmb);
  ph.add(new THREE.HemisphereLight(0x303a70, 0x08080c, 0.3));
  for (let i = 0; i < 6; i++) add(ph, B(0.4 + hash(i) * 0.6, 0.3 + hash(i * 5) * 1.5, 0.4), M(0x262a40), -1.5 + i * 0.6, 0.6, -1.5);
  const phoneG = new THREE.Group(); camera.add(phoneG);
  add(phoneG, RB(0.074, 0.154, 0.0095, 0.0095), M(0x18191d, { roughness: 0.4, metalness: 0.3, flatShading: false }), 0, 0, 0);
  const scr = canvasTex(620, 1340);
  add(phoneG, new THREE.PlaneGeometry(0.0685, 0.148), new THREE.MeshBasicMaterial({ map: scr.tex, transparent: true, toneMapped: false }), 0, 0, 0.0049, false);
  const scrLight = new THREE.PointLight(0xa8b6ff, 0.0, 0.6, 2); scrLight.position.set(0, 0, 0.06); phoneG.add(scrLight);
  const PHONE_HALF_W = 0.037;
  for (const s of [1, -1]) {
    const h = makeHand({ side: s, skin: PAL.skin, sleeve: PAL.sleeve, cuff: PAL.cuff });
    h.setPose({ index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] });
    h.parts.fingerGroups.forEach((g) => (g.visible = false));
    h.parts.thumbGroup.visible = false;
    h.parts.hypo.visible = false;
    phoneG.add(h.root);
    placeHand(h, h.parts.thenar, V(s * 0.045, -0.06, -0.017), V(-s * 0.4, 1, -0.14), V(s * 0.1, 0, -1));
    const R = PHONE_HALF_W + 0.0092;
    const pts = [V(s * 0.041, -0.06, -0.011), V(s * R, -0.054, -0.001), V(s * (R - 0.001), -0.046, 0.0124), V(s * 0.031, -0.035, 0.0131), V(s * 0.0195, -0.024, 0.0125)];
    makeThumb(phoneG, { skin: PAL.skin, radii: [0.0088, 0.0084, 0.0078, 0.0071] }).set(pts, V(0, 0, 1));
  }
  phoneG.visible = false;

  // ----- Handy-Bildschirm -----
  function statusBar(g, w, dark = false) {
    g.fillStyle = '#000'; g.beginPath(); g.roundRect(w / 2 - 95, 26, 190, 54, 27); g.fill();
    g.fillStyle = dark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)'; g.font = '600 28px Inter';
    g.textAlign = 'left'; g.fillText('3:07', 60, 64); g.textAlign = 'right'; g.fillText('18 %', 570, 64);
  }
  function wrap(g, text, maxW) {
    const words = text.split(' '), lines = []; let cur = '';
    for (const w of words) { const tt = cur ? cur + ' ' + w : w; if (g.measureText(tt).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tt; }
    if (cur) lines.push(cur); return lines;
  }
  function drawChat(g, w, h, t, msgs, extra) {
    g.fillStyle = '#0b0b0f'; g.fillRect(0, 0, w, h);
    statusBar(g, w);
    g.fillStyle = '#16161c'; g.fillRect(0, 90, w, 130);
    g.fillStyle = '#4a6fa5'; g.beginPath(); g.arc(w / 2, 140, 34, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.font = '600 34px Inter'; g.textAlign = 'center'; g.fillText('P', w / 2, 152);
    g.font = '600 26px Inter'; g.fillText('Papa ❤', w / 2, 205);
    g.fillStyle = '#4a8cff'; g.font = '500 44px Inter'; g.textAlign = 'left'; g.fillText('‹', 30, 160);
    // Nachrichten von unten nach oben stapeln
    const items = msgs.filter((m) => t >= m.t);
    let y = h - 140;
    if (extra === 'typing' || extra === 'voice' || extra === 'voicePlay') y -= 0;
    const blocks = [];
    g.font = '400 34px Inter';
    for (const m of items) {
      if (m.voice) { blocks.push({ ...m, lines: [], bh: 110, bw: 400 }); continue; }
      const lines = wrap(g, m.text, 390);
      const bw = Math.max(...lines.map((l) => g.measureText(l).width)) + 48;
      blocks.push({ ...m, lines, bh: lines.length * 44 + 30, bw });
    }
    if (extra && extra.typing) blocks.push({ typing: true, out: false, bh: 76, bw: 130, t: extra.t0 });
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i]; y -= b.bh + 18;
      if (y < 240) break;
      const k = easeOut((t - b.t) / 0.25);
      g.globalAlpha = clamp(k * 1.2);
      const x = b.out ? w - 30 - b.bw : 30;
      g.fillStyle = b.out ? '#2f7cf6' : '#2a2a30';
      g.beginPath(); g.roundRect(x, y + (1 - k) * 20, b.bw, b.bh, 30); g.fill();
      g.fillStyle = '#fff'; g.textAlign = 'left';
      if (b.typing) {
        for (let d = 0; d < 3; d++) { const a = 0.35 + 0.65 * (Math.floor(t * 4) % 3 === d ? 1 : 0); g.fillStyle = `rgba(200,200,210,${a})`; g.beginPath(); g.arc(x + 36 + d * 30, y + 38, 10, 0, 7); g.fill(); }
      } else if (b.voice) {
        g.beginPath(); g.moveTo(x + 40, y + 30); g.lineTo(x + 40, y + 80); g.lineTo(x + 80, y + 55); g.closePath(); g.fill();
        const prog = extra && extra.play ? clamp((t - extra.play[0]) / (extra.play[1] - extra.play[0])) : 0;
        for (let k2 = 0; k2 < 26; k2++) { const hh = 10 + 34 * Math.abs(Math.sin(k2 * 1.7) * Math.cos(k2 * 0.6)); g.fillStyle = k2 / 26 < prog ? '#fff' : 'rgba(255,255,255,0.45)'; g.fillRect(x + 100 + k2 * 10, y + 55 - hh / 2, 6, hh); }
        g.fillStyle = 'rgba(255,255,255,0.7)'; g.font = '400 24px Inter'; g.fillText('0:09', x + 100, y + 100);
      } else {
        g.font = '400 34px Inter';
        b.lines.forEach((l, j) => g.fillText(l, x + 24, y + 50 + j * 44));
      }
      g.globalAlpha = 1;
    }
    // Eingabeleiste
    g.fillStyle = '#16161c'; g.fillRect(0, h - 120, w, 120);
    g.strokeStyle = '#3a3a44'; g.lineWidth = 3; g.beginPath(); g.roundRect(40, h - 100, w - 150, 64, 32); g.stroke();
    g.fillStyle = '#6a6a74'; g.font = '400 28px Inter'; g.textAlign = 'left'; g.fillText('Nachricht', 70, h - 58);
  }
  const CHAT1 = [
    { t: EV.msgIn1, text: 'Kann nicht schlafen. Alles gut bei euch?' },
    { t: EV.msgOut1, out: true, text: 'Du mähst doch gerade den Rasen.' },
    { t: EV.msgIn2, text: 'Unser Rasenmäher ist seit Sommer kaputt.' },
    { t: EV.msgIn3, text: 'Mach NICHT die Tür auf.' },
    { t: EV.msgIn4, text: 'Frag ihn, wie unser Hund hieß.' },
  ];
  const CHAT2 = [
    ...CHAT1.map((m) => ({ ...m, t: -1 })),
    { t: EV.voiceMsg, voice: true },
    { t: EV.msgOut2, out: true, text: 'Beweis, dass du es bist.' },
    { t: EV.msgIn5, text: 'Du hast Angst vor dem Keller. Seit du vier bist.' },
  ];
  function drawLock(g, w, h, t) {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#15183a'); bg.addColorStop(0.55, '#2d2458'); bg.addColorStop(1, '#0d0d22');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    statusBar(g, w);
    g.textAlign = 'center'; g.font = '500 30px Inter'; g.fillStyle = 'rgba(255,255,255,0.82)'; g.fillText('Samstag, 28. November', w / 2, 205);
    g.font = '300 190px Inter'; g.fillStyle = 'rgba(255,255,255,0.93)'; g.fillText('3:07', w / 2, 385);
    if (t >= EV.notif1) {
      const k = easeOut((t - EV.notif1) / 0.25), yy = 470 - (1 - k) * 60;
      g.globalAlpha = k;
      g.fillStyle = 'rgba(78,76,92,0.78)'; g.beginPath(); g.roundRect(28, yy, w - 56, 150, 34); g.fill();
      g.fillStyle = '#34c759'; g.beginPath(); g.roundRect(52, yy + 26, 62, 62, 15); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(83, yy + 55, 20, 16, 0, 0, 7); g.fill();
      g.textAlign = 'left'; g.fillStyle = 'rgba(255,255,255,0.62)'; g.font = '600 21px Inter'; g.fillText('NACHRICHTEN', 134, yy + 46);
      g.textAlign = 'right'; g.fillText('jetzt', w - 56, yy + 46);
      g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = '600 31px Inter'; g.fillText('Papa ❤', 134, yy + 88);
      g.font = '400 30px Inter'; g.fillText('Kann nicht schlafen. Alles gut…', 134, yy + 126);
      g.globalAlpha = 1;
    }
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.roundRect(w / 2 - 95, 1302, 190, 9, 5); g.fill();
  }
  function drawDial(g, w, h, t) {
    g.fillStyle = '#060607'; g.fillRect(0, 0, w, h); statusBar(g, w);
    const n = EV.dial.filter((d) => t >= d - 0.05).length;
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '300 96px Inter'; g.fillText('112'.slice(0, n), w / 2, 300);
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
    keys.forEach((kk, i) => {
      const cx = 140 + (i % 3) * 170, cy = 470 + Math.floor(i / 3) * 165;
      const hit = (kk === '1' && (Math.abs(t - EV.dial[0]) < 0.15 || Math.abs(t - EV.dial[1]) < 0.15)) || (kk === '2' && Math.abs(t - EV.dial[2]) < 0.15);
      g.fillStyle = hit ? '#8a8a92' : '#2c2c30'; g.beginPath(); g.arc(cx, cy, 68, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.font = '400 60px Inter'; g.fillText(kk, cx, cy + 20);
    });
    g.fillStyle = '#34c759'; g.beginPath(); g.arc(w / 2, 1150, 70, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.font = '600 50px Inter'; g.fillText('✆', w / 2, 1168);
  }
  function drawCall(g, w, h, t) {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#2b2f3a'); bg.addColorStop(1, '#0e0f14');
    g.fillStyle = bg; g.fillRect(0, 0, w, h); statusBar(g, w);
    g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = '500 76px Inter'; g.fillText('Notruf 112', w / 2, 300);
    const s = Math.max(0, Math.floor(t - EV.callStart));
    g.font = '400 40px Inter'; g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillText(`00:${String(s).padStart(2, '0')}`, w / 2, 370);
    const labels = ['stumm', 'Tastatur', 'Lautspr.', 'Anruf +', 'FaceTime', 'Kontakte'];
    labels.forEach((l, i) => {
      const cx = 140 + (i % 3) * 170, cy = 640 + Math.floor(i / 3) * 200;
      g.fillStyle = 'rgba(255,255,255,0.16)'; g.beginPath(); g.arc(cx, cy, 64, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.font = '400 24px Inter'; g.fillText(l, cx, cy + 100);
    });
    g.fillStyle = '#ff3b30'; g.beginPath(); g.arc(w / 2, 1150, 70, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.font = '600 50px Inter'; g.fillText('✆', w / 2, 1168);
  }
  function drawScreen(mode, t) {
    const g = scr.ctx, w = 620, h = 1340;
    g.clearRect(0, 0, w, h); g.save(); g.beginPath(); g.roundRect(0, 0, w, h, 70); g.clip();
    if (mode === 'lock') drawLock(g, w, h, t);
    else if (mode === 'chat') drawChat(g, w, h, t, CHAT1, inR(t, EV.typing) ? { typing: true, t0: EV.typing[0] } : null);
    else if (mode === 'voice') drawChat(g, w, h, t, CHAT2, { play: EV.voicePlay });
    else if (mode === 'dial') drawDial(g, w, h, t);
    else drawCall(g, w, h, t);
    g.restore(); scr.tex.needsUpdate = true;
  }

  // =====================================================================
  // Kamera + Posen pro Einstellung
  // =====================================================================
  function setCam(pos, look, fov = 60, roll = 0) {
    camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look); camera.rotateZ(roll);
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  }
  const hand = (t, s, a = 1) => V(wob(t, s) * 0.012 * a, wob(t, s + 3) * 0.009 * a, wob(t, s + 7) * 0.006 * a);
  const WIN = V(1.5, 4.35, -0.9); // Augenposition am Kinderzimmerfenster
  const MOW = (t) => { const k = (t * 0.35) % 2; const x = k < 1 ? lerp(-3, 3, k) : lerp(3, -3, k - 1); return V(x, 0, 9.5 + 0.0 * k); };
  const mowDir = (t) => (((t * 0.35) % 2) < 1 ? Math.PI / 2 : -Math.PI / 2);

  function papaMowPose(p, t, still = false) {
    const pos = still ? MOW(EV.mowerOff) : MOW(t);
    const dir = still ? mowDir(EV.mowerOff) : mowDir(t);
    p.root.position.copy(pos); p.root.rotation.y = dir;
    const step = still ? 0 : Math.sin(t * 5.2) * 0.16;
    p.setPose({ hands: [V(-0.2, 0.98, 0.42), V(0.2, 0.98, 0.42)], feet: [V(-0.11, 0.06, 0.02 + step), V(0.11, 0.06, 0.02 - step)], torsoRot: [0.08, 0, 0] });
    mower.position.copy(pos).add(V(Math.sin(dir) * 1.15, 0, Math.cos(dir) * 1.15)); mower.rotation.y = dir + Math.PI;
  }
  function hidePeople() {
    papas.forEach((p) => (p.root.visible = false)); cop.root.visible = false; leaG.root.visible = false; mower.visible = false; ring.visible = false;
    flashlight.intensity = 0; faceLightG.intensity = 0;
  }

  const shotUpdate = {
    // ---------- GARTEN vom Fenster ----------
    fromWindow(t, s, tt) {
      const p = papas[0]; p.root.visible = true; mower.visible = true; papaMowPose(p, t);
      setCam(WIN.clone().add(hand(t, 1)).add(V(0, 0, -0.25 * (1 - easeOut(tt / 4)))), V(0.6, 0.6, 9), 62, wob(t, 4) * 0.01);
    },
    mowClose(t, s, tt) {
      const p = papas[0]; p.root.visible = true; mower.visible = true;
      if (t < EV.wave) papaMowPose(p, t);
      else {
        papaMowPose(p, EV.wave, true); const pos = MOW(EV.wave);
        p.root.position.copy(pos); p.root.rotation.y = Math.atan2(WIN.x - pos.x, WIN.z - pos.z);
        const wv = Math.sin((t - EV.wave) * 7) * 0.12;
        p.setPose({ hands: [V(-0.25, 0.85, 0.08), V(0.36 + wv, 1.95, 0.12)], elbowPole: [V(-0.6, -0.2, -0.8), V(1, 0, 0)], lookAt: WIN, mouth: 'smile' });
      }
      const tgt = MOW(Math.min(t, EV.wave)).add(V(0, 1.4, 0));
      setCam(WIN.clone().add(hand(t, 2, 0.6)), tgt, lerp(30, 24, easeInOut(tt / 6)), wob(t, 5) * 0.008);
    },
    fromWindowWave(t, s, tt) {
      const p = papas[0]; p.root.visible = true; mower.visible = true;
      const pos = MOW(EV.wave); papaMowPose(p, EV.wave, true);
      p.root.position.copy(pos); p.root.rotation.y = Math.atan2(WIN.x - pos.x, WIN.z - pos.z);
      const wv = Math.sin((t - EV.wave) * 7) * 0.12;
      p.setPose({ hands: [V(-0.25, 0.85, 0.08), V(0.36 + wv, 1.95, 0.12)], elbowPole: [V(-0.6, -0.2, -0.8), V(1, 0, 0)], lookAt: WIN });
      setCam(WIN.clone().add(hand(t, 3)).add(V(0, 0, 0.1 * easeOut(tt / 3))), pos.clone().add(V(0, 1.0, 0)), lerp(50, 38, easeInOut(tt / 4)), wob(t, 6) * 0.01);
    },
    mowerOff(t, s, tt) {
      const p = papas[0]; p.root.visible = true; mower.visible = true;
      const pos = MOW(EV.wave); papaMowPose(p, EV.wave, true);
      p.root.position.copy(pos); p.root.rotation.y = Math.atan2(WIN.x - pos.x, WIN.z - pos.z);
      p.setPose({ hands: [V(-0.26, 0.86, 0.05), V(0.26, 0.86, 0.05)], lookAt: WIN });
      setCam(WIN.clone().add(hand(t, 4, 0.5)), pos.clone().add(V(0, 1.2, 0)), lerp(34, 26, easeInOut(tt / 3)), wob(t, 7) * 0.008);
    },
    laugh(t, s, tt) {
      const p = papas[0]; p.root.visible = true; mower.visible = true;
      const pos = MOW(EV.wave); p.root.position.copy(pos); p.root.rotation.y = Math.atan2(WIN.x - pos.x, WIN.z - pos.z);
      const lg = inR(t, EV.laugh) ? Math.sin(t * 22) * 0.05 : 0;
      p.setPose({ hands: [V(-0.15, 1.05, 0.22), V(0.26, 0.86, 0.05)], lookAt: WIN.clone().add(V(0, lg * 4, 0)), headNod: -0.1 + lg, mouth: inR(t, EV.laugh) ? 'grin' : 'smile', torsoRot: [lg * 0.5, 0, 0] });
      setCam(WIN.clone().add(V(0, 0, 0.55)).add(hand(t, 5, 0.4)), pos.clone().add(V(0, 1.65, 0)), lerp(15, 12, easeInOut(tt / 6)), wob(t, 8) * 0.006);
    },
    neckGrow(t, s, tt) {
      const p = papas[0]; p.root.visible = true; mower.visible = true;
      const pos = MOW(EV.wave); p.root.position.copy(pos);
      const turnK = easeInOut((t - EV.turn) / 0.8);
      const face = Math.atan2(WIN.x - pos.x, WIN.z - pos.z);
      p.root.rotation.y = face + Math.PI * turnK;
      p.root.updateMatrixWorld(true);
      const g = easeInOut((t - EV.neckGrow[0]) / (EV.neckGrow[1] - EV.neckGrow[0]));
      const target = V(1.5, 4.25, 0.55);
      const loc = p.root.worldToLocal(target.clone());
      const nb = V(0, 1.6, -0.01);
      const d = loc.clone().sub(nb);
      p.setPose({ neck: Math.max(0, d.length() * g - 0.15), neckDir: d, neckBend: V(0, 1.4 * g * (1 - g * 0.4), 0), lookAt: WIN, eyes: g > 0.3 ? 'black' : 'normal', mouth: g > 0.6 ? 'grin' : 'smile', headTilt: 0.3 * g });
      const head = p.headG.position.clone();
      const look = pos.clone().add(V(0, 1.6, 0)).lerp(head, clamp(g * 1.1));
      setCam(WIN.clone().add(hand(t, 6, 1 + g)).add(V(0, 0, -0.3 * g)), look, lerp(40, 58, g), wob(t, 9) * 0.012);
      faceLightG.intensity = 1.2 * g; faceLightG.position.copy(head).add(V(0, -0.35, 0.4));
    },
    // ---------- Kinderzimmer innen ----------
    openWindow(t, s, tt) {
      const p = papas[0]; p.root.visible = true; mower.visible = true;
      const pos = MOW(EV.wave); p.root.position.copy(pos); p.root.rotation.y = Math.atan2(WIN.x - pos.x, WIN.z - pos.z);
      p.setPose({ hands: [V(-0.26, 0.86, 0.05), V(0.26, 0.86, 0.05)], lookAt: WIN });
      sash.rotation.y = -0.55 * easeInOut((tt - 0.4) / 1.4);
      setCam(V(1.5, 4.3, -1.6).add(hand(t, 7)).add(V(0, 0, 0.35 * easeInOut(tt / 2.5))), V(1.3, 3.1, 9), 64, wob(t, 10) * 0.01);
    },
    headAtWindow(t, s, tt) {
      const p = papas[0]; p.root.visible = true; mower.visible = true;
      const pos = MOW(EV.wave); p.root.position.copy(pos);
      p.root.rotation.y = Math.atan2(WIN.x - pos.x, WIN.z - pos.z) + Math.PI; p.root.updateMatrixWorld(true);
      const target = V(1.5, 4.25 + wob(t, 3) * 0.02, 0.4);
      const loc = p.root.worldToLocal(target.clone()); const d = loc.clone().sub(V(0, 1.6, -0.01));
      p.setPose({ neck: d.length() - 0.15, neckDir: d, neckBend: V(0, 0.8, 0), lookAt: V(1.5, 4.3, -1.2), eyes: 'black', mouth: 'grin', headTilt: 0.35 + wob(t, 2) * 0.05 });
      sash.rotation.y = -0.55;
      faceLightG.intensity = 1.6; faceLightG.position.set(1.5, 3.7, -0.2);
      setCam(V(1.45, 4.3, -1.3).add(hand(t, 8, 1.4)), V(1.5, 4.25, 0.4), 50, wob(t, 11) * 0.015);
    },
    // ---------- Polizei / Straße ----------
    terrace(t, s, tt) {
      // Kamera im Garten (Kinder bei der Hecke), Blick zum Haus
      tdoor.rotation.y = -1.2 * easeInOut((t - EV.terraceDoor) / 1.2);
      const k = clamp((t - EV.papasOut) / 3);
      papas.forEach((p, i) => {
        p.root.visible = t > EV.papasOut - 0.3;
        const x = -2.6 + i * 0.75;
        p.root.position.set(x, 0, lerp(-0.6, 2.0, easeOut(k - i * 0.08)));
        p.root.rotation.y = 0;
        const wv = t > EV.waveAll ? Math.sin((t - EV.waveAll) * 7) * 0.12 : 0;
        const up = t > EV.waveAll;
        p.setPose({ hands: [V(-0.26, 0.86, 0.05), up ? V(0.36 + wv, 1.95, 0.12) : V(0.26, 0.86, 0.05)], elbowPole: [V(-0.6, -0.2, -0.8), up ? V(1, 0, 0) : V(0.6, -0.2, -0.8)], lookAt: camera.position, mouth: 'grin', eyes: 'normal', feet: [V(-0.11, 0.06, Math.sin(t * 5 + i) * 0.1 * (k < 1 ? 1 : 0)), V(0.11, 0.06, -Math.sin(t * 5 + i) * 0.1 * (k < 1 ? 1 : 0))] });
      });
      setCam(V(-0.8, 1.2, 7.0).add(hand(t, 12, 1.6)), V(-1.7, 1.3, 1.5), 40, wob(t, 13) * 0.02);
    },
    gate(t, s, tt) {
      const run = easeInOut(tt / 1.6);
      papas.forEach((p, i) => { p.root.visible = true; p.root.position.set(-1.5 + i * 0.8, 0, lerp(4, 8, clamp(tt / 6))); p.root.rotation.y = 0; p.setPose({ lookAt: camera.position, mouth: 'grin', feet: [V(-0.11, 0.06, Math.sin(t * 4 + i) * 0.12), V(0.11, 0.06, -Math.sin(t * 4 + i) * 0.12)] }); });
      const pos = V(2.0, 1.25, lerp(10.5, 14.1, run)).add(hand(t, 14, 2));
      // erst zum Tor, dann Blick aufs Schloss, dann zurück über die Schulter
      let look = V(2.0, 1.0, 15);
      if (tt > 2.2) look = V(2.45, 0.95, 15);
      if (tt > 4.0) look = V(0, 1.4, 6);
      setCam(pos, look, tt > 2.2 && tt < 4 ? 40 : 58, wob(t, 15) * 0.02);
    },
    gateClimb(t, s, tt) {
      // Kamera oben auf dem Tor, Blick nach unten: Hand packt den Knöchel
      const p = papas[0]; p.root.visible = true;
      p.root.position.set(2.0, 0, 14.25); p.root.rotation.y = 0;
      const grab = t > EV.grab, rel = t > EV.release;
      const kick = EV.kicks.some((k) => t > k && t < k + 0.25);
      const handT = rel ? V(0.1, 1.2, 0.3) : grab ? V(0.0, 1.62 + (kick ? 0.06 : 0), 0.65) : V(0.25, 0.9, 0.1);
      p.setPose({ hands: [V(-0.2, 0.86, 0.05), handT], elbowPole: [V(-0.6, -0.2, -0.8), V(0.7, -0.5, 0)], lookAt: camera.position, eyes: 'black', mouth: 'grin', headNod: -0.3 });
      p.root.updateMatrixWorld(true);
      ring.visible = true; ring.position.copy(p.root.localToWorld(handT.clone().add(V(0.0, 0.06, 0.0)))); ring.lookAt(camera.position);
      let pos = V(2.0, lerp(1.4, 2.35, easeOut((tt - 0.3) / 2)), 14.95), roll = 0;
      let look = V(2.0, 0.2, 13.5);
      if (tt < 2.6) look = V(2.3, 2.6, 18);  // hochklettern, Blick zur Straße
      if (kick) pos.add(V(noise(t * 40) * 0.05, noise(t * 37) * 0.05, 0));
      if (t > EV.fall) { const f = easeOut((t - EV.fall) / 0.5); pos = V(2.0, lerp(2.35, 0.35, f), lerp(14.95, 16.0, f)); look = V(4, 0.3, 18); roll = 0.5 * f; }
      setCam(pos.add(hand(t, 16, 1.5)), look, 60, roll + wob(t, 17) * 0.02);
      leaG.root.visible = tt < 2.6; leaG.root.position.set(2.4, 1.3, 15.2); leaG.root.rotation.y = Math.PI;
    },
    police(t, s, tt) {
      car.visible = true; cop.root.visible = true;
      const k = clamp((tt - 1.0) / 2.5);
      cop.root.position.set(lerp(4.0, 3.1, k), 0, lerp(18.5, 17.5, k)); cop.root.rotation.y = Math.PI * 0.85;
      const step = k < 1 ? Math.sin(t * 5) * 0.14 : 0;
      cop.setPose({ hands: [V(-0.26, 0.86, 0.05), V(0.2, 1.25, 0.4)], feet: [V(-0.11, 0.06, step), V(0.11, 0.06, -step)], lookAt: camera.position, mouth: 'closed' });
      flashlight.intensity = 30; cop.root.updateMatrixWorld(true);
      flashlight.position.copy(cop.root.localToWorld(V(0.2, 1.3, 0.5))); flashlight.target.position.copy(camera.position).add(V(0, -0.6, 0));
      setCam(V(1.4, 0.55, 15.9).add(hand(t, 18)), cop.root.position.clone().add(V(0.6, 1.1, 0.6)), 60, 0.2 + wob(t, 19) * 0.015);
    },
    flashlight(t, s, tt) {
      car.visible = true; cop.root.visible = true;
      cop.root.position.set(2.4, 0, 16.4); cop.root.rotation.y = Math.PI;
      cop.setPose({ hands: [V(-0.26, 0.86, 0.05), V(0.15, 1.3, 0.45)], mouth: 'closed' });
      cop.root.updateMatrixWorld(true);
      const r = clamp((t - EV.retreat[0]) / (EV.retreat[1] - EV.retreat[0]));
      papas.forEach((p, i) => {
        p.root.visible = r < 0.98;
        const start = V(0.5 + i * 0.9, 0, 12.6), end = V(-3.4, 0, 11.4);
        p.root.position.copy(start.clone().lerp(end, easeInOut(r - i * 0.05)));
        p.root.rotation.y = 0;  // schauen zur Kamera, gehen rückwärts
        p.setPose({ lookAt: camera.position, mouth: 'smile', eyes: 'black', feet: [V(-0.11, 0.06, Math.sin(t * 4 + i) * 0.1 * (r > 0 && r < 1 ? 1 : 0)), V(0.11, 0.06, -Math.sin(t * 4 + i) * 0.1 * (r > 0 && r < 1 ? 1 : 0))] });
      });
      flashlight.intensity = 60;
      flashlight.position.copy(cop.root.localToWorld(V(0.15, 1.35, 0.55)));
      const tgt = papas[1].root.position.clone().add(V(0, 1.4, 0));
      flashlight.target.position.copy(tgt);
      setCam(V(3.1, 1.25, 16.6).add(hand(t, 20)), V(0.8, 1.2, 12.0).lerp(V(-2.5, 1.2, 11.5), r), 50, wob(t, 21) * 0.012);
    },
    garageCop(t, s, tt) {
      car.visible = true; cop.root.visible = t < EV.garageClose[1];
      const w = easeInOut((t - EV.copWalk[0]) / (EV.copWalk[1] - EV.copWalk[0] + 0.6));
      cop.root.position.set(lerp(1.5, -5.8, w), 0, lerp(16.0, 13.6, w)); cop.root.rotation.y = Math.atan2(-7.3, -2.4) * (w < 1 ? 1 : 0) + (w >= 1 ? Math.PI : 0);
      const step = w > 0 && w < 1 ? Math.sin(t * 5) * 0.14 : 0;
      cop.setPose({ hands: [V(-0.26, 0.86, 0.05), V(0.15, 1.3, 0.45)], feet: [V(-0.11, 0.06, step), V(0.11, 0.06, -step)], mouth: 'closed' });
      cop.root.updateMatrixWorld(true);
      const fl = inR(t, EV.copFlicker) ? flick(t, 16, 3.3, 0.45) : 1;
      flashlight.intensity = (t > EV.copScream + 0.3 ? 0 : 40) * fl;
      flashlight.position.copy(cop.root.localToWorld(V(0.15, 1.35, 0.55))); flashlight.target.position.copy(cop.root.localToWorld(V(0.1, 0.5, 4)));
      // Tor: zuerst offen (Papas drin), schließt sich
      const open = t < EV.garageClose[0] ? 1 : 1 - easeInOut((t - EV.garageClose[0]) / (EV.garageClose[1] - EV.garageClose[0]));
      garDoor.position.y = 2.1 * open; garDoor.position.z = 14.65 - 0.8 * open;
      garInside.intensity = 0.0;
      setCam(V(2.2, 1.3, 17.0).add(hand(t, 22)), V(-5.0, 1.3, 13.5), 46, wob(t, 23) * 0.01);
    },
    garageNight(t, s, tt) {
      car.visible = true;
      garInside.intensity = t > EV.garageLight ? 2.4 : 0;
      setCam(V(-2.2, 1.35, 18.0).add(hand(t, 24)).add(V(0, 0, -0.8 * easeInOut(tt / 15))), V(-5.4, 1.2, 14.5), 50, wob(t, 25) * 0.01);
    },
    gasBottles(t, s, tt) {
      car.visible = true; garInside.intensity = 2.4;
      const v = clamp((t - EV.valves[0]) / (EV.valves[1] - EV.valves[0]));
      bottles.forEach((b, i) => (b.rotation.y = easeInOut(v * 4 - i) * 4));
      setCam(V(-2.75, 1.65, 16.6).add(hand(t, 26)), V(-3.0, 0.9, 15.5), 54, wob(t, 27) * 0.012);
    },
    doorGap(t, s, tt) {
      car.visible = true; garInside.intensity = 2.4;
      papas.forEach((p, i) => { p.root.visible = true; p.root.position.set(-6.7 + i * 0.85, 0, 14.2); p.root.rotation.y = 0; p.setPose({ feet: [V(-0.11, 0.06, 0.1), V(0.11, 0.06, 0.12)] }); });
      garDoor.position.y = 0.16; garInside.intensity = 4; garInside.position.set(-5.8, 0.6, 13.2);
      setCam(V(-5.6, 0.12, 15.6).add(hand(t, 28, 0.6)), V(-5.8, 0.06, 13.5), 52, wob(t, 29) * 0.01);
    },
    throw(t, s, tt) {
      car.visible = true; garInside.intensity = 2.4;
      leaG.root.visible = true; leaG.root.position.set(-1.6, 0, 16.9); leaG.root.rotation.y = -2.4;
      setCam(V(-2.0, 1.4, 17.8).add(hand(t, 30)), V(-5.6, 0.6, 14.6), 52, wob(t, 31) * 0.012);
    },
    boom(t, s, tt) {
      car.visible = true;
      const b = t - EV.boom;
      fireG.visible = b > 0;
      if (b > 0) {
        fireball.visible = b < 1.0; fireball.scale.setScalar(1 + 6 * easeOut(b / 0.6)); fireball.material.opacity = 0.9 * (1 - clamp(b / 1.0));
        flames.forEach((f, i) => { f.scale.set(1, 0.7 + 0.4 * Math.abs(noise(t * 6 + i)) + clamp(b) * 0.6, 1); f.position.y = 1.4 + f.scale.y; });
        smoke.forEach((sm, i) => { const ph2 = (t * 0.25 + i / smoke.length) % 1; sm.position.set((hash(i) - 0.5) * 3 + ph2 * 2, 4 + ph2 * 10, (hash(i * 4) - 0.5) * 3); sm.scale.setScalar(1 + ph2 * 3); sm.material.opacity = 0.6 * (1 - ph2); });
        fireLight.intensity = 35 + 15 * noise(t * 9);
        garDoor.visible = false; doorPanel.visible = false;
      }
      garInside.intensity = b > 0 ? 0 : 2.4;
      const shake = b > 0 ? 0.12 * Math.exp(-b * 2.2) : 0;
      setCam(V(0.5, 1.4, 19.0).add(V(noise(t * 30) * shake, noise(t * 33) * shake, 0)).add(hand(t, 32)), V(-5.2, 2.4, 13.0), 58, noise(t * 21) * shake * 0.4 + wob(t, 33) * 0.01);
    },
    morning(t, s, tt) {
      taxi.visible = true; fireG.visible = true; fireball.visible = false;
      flames.forEach((f) => (f.visible = false)); fireLight.intensity = 0;
      smoke.forEach((sm, i) => { const ph2 = (t * 0.1 + i / smoke.length) % 1; sm.position.set((hash(i) - 0.5) * 2 + ph2 * 3, 2.5 + ph2 * 12, (hash(i * 4) - 0.5) * 2); sm.scale.setScalar(0.6 + ph2 * 3); sm.material.opacity = 0.45 * (1 - ph2); sm.material.color.set(0x3a3a3e); });
      const p = papas[0]; p.root.visible = t > EV.taxi + 2.0;
      const walk = clamp((t - EV.taxi - 2.0) / 4.0);
      p.root.position.set(lerp(0.6, 1.9, walk), 0, lerp(18.3, 16.9, walk)); p.root.rotation.y = Math.PI + (walk < 1 ? -0.6 : 0);
      const hug = t > EV.hug;
      const step = walk > 0 && walk < 1 ? Math.sin(t * 5) * 0.14 : 0;
      p.setPose({ hands: hug ? [V(-0.3, 1.25, 0.55), V(0.3, 1.25, 0.55)] : [V(-0.26, 0.86, 0.05), V(0.26, 0.86, 0.05)], elbowPole: hug ? [V(-1, 0, 0), V(1, 0, 0)] : undefined, feet: [V(-0.11, 0.06, step), V(0.11, 0.06, -step)], lookAt: hug ? camera.position.clone().add(V(0, 0.2, 0)) : V(-5, 1.5, 12), mouth: 'smile', apron: false, torsoRot: hug ? [0.35, 0, 0] : [0, 0, 0] });
      let pos = V(2.0, 1.25, 16.0), look = V(0, 1.2, 19);
      if (t > EV.taxi + 4.5) look = V(1.9, 1.6, 17.5);
      if (hug) { pos = V(1.9, 1.15, 15.85); look = V(1.9, 1.75, 16.9); }
      setCam(pos.add(hand(t, 34)), look, 56, wob(t, 35) * 0.01);
    },
    papaFace(t, s, tt) {
      taxi.visible = true; fireG.visible = true; flames.forEach((f) => (f.visible = false)); fireLight.intensity = 0; fireball.visible = false;
      const p = papas[0]; p.root.visible = true; p.root.position.set(1.9, 0, 17.2); p.root.rotation.y = Math.PI;
      const sm = inR(t, EV.smile) || t > EV.smile[1];
      p.setPose({ apron: false, lookAt: camera.position, mouth: sm ? 'grin' : 'smile', headTilt: sm ? 0.08 * easeOut((t - EV.smile[0]) / 2) : 0 });
      leaG.root.visible = true; leaG.root.position.set(1.3, 0, 16.6); leaG.root.rotation.y = Math.PI * 0.85;
      const z = easeInOut(tt / 10);
      setCam(V(2.1, 1.35, lerp(15.6, 16.1, z)).add(hand(t, 36, 0.6)), V(1.9, 1.62, 17.2), lerp(40, 28, z), wob(t, 37) * 0.006);
    },
  };

  // ---------- Innen-Einstellungen ----------
  const inner = {
    lea(t, s, tt) {
      if (s.set === 'kidsroom') {
        setCam(V(100.6, 1.5, 1.6).add(hand(t, 40)).add(V(-0.4 * easeInOut(tt / 3), -0.2 * easeInOut(tt / 3), -1.2 * easeInOut(tt / 3))), V(98.9, 0.5, -1.4), 58, wob(t, 41) * 0.012);
        return;
      }
      // storage: Lea dreht den Schlüssel, Tür geht auf
      leaSc.root.visible = true; leaSc.root.position.set(0.25, 0, -0.55); leaSc.root.rotation.y = Math.PI;
      leaSc.headG.rotation.y = t < EV.keyTurn - 1.5 ? Math.PI * 0.9 : 0;
      key.rotation.z = t > EV.keyTurn ? Math.PI / 2 : 0;
      scDoor.rotation.y = -1.3 * easeInOut((t - EV.doorOpen) / 1.2);
      setCam(V(300.2, 1.3, 0.6).add(hand(t, 42)), V(300.05, 0.9, -1.2), 60, wob(t, 43) * 0.012);
    },
    down(t, s, tt) {
      papaSofa.setPose({ hipY: 0.2, torsoRot: [-Math.PI / 2 + 0.25, 0, 0], feet: [V(-0.11, 0.18, 1.0), V(0.11, 0.18, 1.0)], kneePole: [V(0, 1, 0), V(0, 1, 0)], hands: [V(-0.22, 0.35, 0.2), V(0.12, 0.42, 0.42)], eyes: 'closed', mouth: 'closed' });
      tvLight.intensity = t > EV.tvOn ? 22 * (0.7 + 0.3 * noise(t * 7)) : 0;
      tv.material.color.set(t > EV.tvOn ? 0x7f9cff : 0x0a0a10);
      const k = easeInOut(tt / 3.2);
      setCam(V(201.6, 2.7 - k * 0.3, 2.8 - k * 0.4).add(hand(t, 44, 1.3)), V(199.6, 0.4, -1.8), 60, wob(t, 45) * 0.015);
    },
    sofa(t, s, tt) {
      tvLight.intensity = 22 * (0.7 + 0.3 * noise(t * 7)); tv.material.color.set(0x7f9cff);
      const sn = inR(t, EV.snore) ? Math.sin(t * 3.2) * 0.02 : 0;
      papaSofa.setPose({ hipY: 0.2, torsoRot: [-Math.PI / 2 + 0.25 + sn, 0, 0], feet: [V(-0.11, 0.18, 1.0), V(0.11, 0.18, 1.0)], kneePole: [V(0, 1, 0), V(0, 1, 0)], hands: [V(-0.22, 0.35, 0.2), V(0.12, 0.42, 0.42)], lookAt: V(199.5, 1.2, 0.9), eyes: 'closed', mouth: t > EV.snore[1] ? 'smile' : 'closed' });
      papaSofa.root.updateMatrixWorld(true);
      remote.position.copy(lv.worldToLocal(papaSofa.root.localToWorld(V(0.12, 0.46, 0.45))));
      setCam(V(201.7, 1.55, 1.6).add(hand(t, 46)).add(V(-0.3 * easeInOut(tt / 8), 0, -0.6 * easeInOut(tt / 8))), V(199.7, 0.7, -1.8), 50, wob(t, 47) * 0.01);
      faceLightL.intensity = 0;
    },
    sofaClose(t, s, tt) {
      tvLight.intensity = 22 * (0.7 + 0.3 * noise(t * 7)); tv.material.color.set(0x7f9cff);
      const open = t > EV.eyesOpen;
      papaSofa.setPose({ hipY: 0.2, torsoRot: [-Math.PI / 2 + 0.25, 0, 0], feet: [V(-0.11, 0.18, 1.0), V(0.11, 0.18, 1.0)], kneePole: [V(0, 1, 0), V(0, 1, 0)], hands: [V(-0.22, 0.35, 0.2), V(0.12, 0.42, 0.42)], lookAt: camera.position, eyes: open ? 'black' : 'closed', mouth: open ? 'grin' : 'smile' });
      papaSofa.headG.updateMatrixWorld(true);
      const head = papaSofa.headG.getWorldPosition(V(0, 0, 0));
      faceLightL.intensity = 0.9; faceLightL.position.copy(lv.worldToLocal(head.clone().add(V(0.3, -0.25, 0.5))));
      setCam(head.clone().add(V(0.25, 0.75, 0.75)).add(hand(t, 48, 0.8)), head, lerp(42, 34, easeInOut(tt / 4)), wob(t, 49) * 0.01);
    },
    door(t, s, tt) {
      // Abstellkammer: Blick auf die Tür mit Lichtspalt, Lea links neben dir
      leaSc.root.visible = true; leaSc.root.position.set(-0.45, -0.45, -0.2); leaSc.root.rotation.y = 0.5; leaSc.headG.rotation.y = 0;
      const feet = inR(t, EV.feetUnderDoor);
      feetBlock.forEach((f) => (f.visible = feet));
      const hk = inR(t, EV.handle) ? Math.sin(clamp((t - EV.handle[0]) / (EV.handle[1] - EV.handle[0])) * Math.PI) * 0.6 : 0;
      handle.rotation.z = -hk;
      scDoor.rotation.y = 0; key.rotation.z = Math.PI / 2;
      const steps = inR(t, EV.steps) ? Math.abs(Math.sin(t * 4)) : 0;
      stripLight.intensity = 1.5 * (feet ? 0.6 : 1);
      phoneGlowSc.intensity = 0;
      let look = V(300.0, 0.6, -0.9);
      if (inR(t, EV.handle)) look = V(300.3, 1.0, -0.9);
      setCam(V(300.1, 0.75 + steps * 0.004, 0.55).add(hand(t, 50, 0.8)), look, 56, wob(t, 51) * 0.01);
    },
    doorway(t, s, tt) {
      papaK.root.visible = true; papaK.root.position.set(0, 0, -1.55); papaK.root.rotation.y = 0;
      papaKSit(t, false);
      const k = easeInOut(tt / 5);
      setCam(V(401.6, 1.55, 2.1 - k * 0.6).add(hand(t, 52)), V(400.1, 1.05, -1.1), 52, wob(t, 53) * 0.01);
    },
    papa(t, s, tt) {
      papaKSit(t, t > 0);
      setCam(V(400.55, 1.35, 0.6).add(hand(t, 54, 0.7)), V(400.0, 1.25, -1.3), lerp(40, 34, easeInOut(tt / 12)), wob(t, 55) * 0.008);
    },
    shock(t, s, tt) {
      // Licht aus -> Stille -> Flackern -> er steht direkt vor dir -> Kopf knickt -> Mund reißt auf
      const out = t >= EV.lightOut;
      let L = out ? 0 : 1;
      if (inR(t, EV.flicker)) L = flick(t, 14, 2.7, 0.55) ? 1 : 0.15;
      if (t >= EV.jump) L = flick(t, 18, 1.9, 0.3) ? 1.1 : 0.3;
      kSpot.intensity = 18 * L; kSpill.intensity = 0.6 * L; kBulbMat.color.setRGB(Math.min(1, 0.1 + L), Math.min(1, 0.08 + 0.84 * L), Math.min(1, 0.05 + 0.6 * L));
      kHemi.intensity = out && L < 0.5 ? 0.04 : 0.3;
      const pos = V(400.4, 1.35, 0.6);
      if (t < EV.jump) {
        papaKSit(t, true);
        papaK.root.visible = !out || L > 0.5 ? true : false;
        if (inR(t, EV.flicker)) { papaK.root.visible = false; paper.visible = false; } // Stuhl ist leer!
        setCam(pos.clone().add(hand(t, 56, 1.2)), V(400.0, 1.2, -1.3), 44, wob(t, 57) * 0.01);
      } else {
        paper.visible = false; papaK.root.visible = true;
        const sn = easeOut((t - EV.snap) / 0.1), mo = t >= EV.mouth;
        papaK.root.position.set(0.35, 0, -0.45); papaK.root.rotation.y = Math.atan2(pos.x - 400.35, pos.z + 0.2);
        papaK.setPose({ hands: [V(-0.28, 0.8, 0.05), V(0.28, 0.8, 0.05)], neck: 0.25 + 0.1 * sn, neckBend: V(0.1 * sn, 0, 0), lookAt: pos, headTilt: (t >= EV.snap ? 1.0 : 0.15) * sn + 0.15 * (1 - sn) + wob(t * 4, 2) * 0.05 * sn, eyes: 'black', mouth: mo ? 'scream' : 'grin', headStretch: mo ? 1.15 : 1 });
        papaK.headG.updateMatrixWorld(true);
        const head = papaK.headG.getWorldPosition(V(0, 0, 0));
        faceLightK.intensity = 1.0; faceLightK.position.copy(kt.worldToLocal(head.clone().add(V(0, -0.45, 0.35))));
        const j = t - EV.jump, amp = 0.03 * Math.exp(-j * 4) + (t >= EV.snap ? 0.02 : 0) + 0.003;
        const cp = pos.clone().add(V(noise(t * 40) * amp, noise(t * 37) * amp, 0));
        const fov = lerp(60, 46, easeOut(j / 0.25)) - (mo ? 10 * easeOut((t - EV.mouth) / 0.15) : 0);
        setCam(cp, head.clone().add(V(noise(t * 33) * amp * 2, -0.25 + noise(t * 29) * amp * 2, 0)), fov, noise(t * 25) * amp * 1.5);
      }
    },
    drill(t, s, tt) {
      kSpot.intensity = 18 * (flick(t, 18, 1.9, 0.3) ? 1 : 0.3); kSpill.intensity = 0.6; kHemi.intensity = 0.3;
      paper.visible = false; papaK.root.visible = true;
      const pos = V(400.4, 1.35, 0.6);
      const on = t > EV.drill;
      const back = easeOut((t - EV.shriek) / 0.8);
      papaK.root.position.set(0.35, 0, lerp(-0.2, -0.9, back)); papaK.root.rotation.y = 0.1;
      papaK.setPose({ hands: [V(-0.3, 1.5 * back + 0.8 * (1 - back), 0.3), V(0.3, 1.5 * back + 0.8 * (1 - back), 0.3)], neck: 0.35, neckBend: V(-0.2 * back, 0, -0.2 * back), lookAt: pos, headTilt: 0.9 - 0.5 * back, eyes: 'black', mouth: 'scream', headStretch: 1.15 });
      papaK.headG.updateMatrixWorld(true);
      faceLightK.intensity = 1.3; faceLightK.position.copy(kt.worldToLocal(papaK.headG.getWorldPosition(V(0, 0, 0)).add(V(0, -0.45, 0.35))));
      drill.visible = true; drillHand.root.visible = true; drillLight.intensity = 0.6;
      const thrust = on ? 0.04 * Math.sin(t * 9) : 0;
      drill.position.set(0.1 + (on ? noise(t * 60) * 0.003 : 0), -0.16, -0.5 - thrust); drill.rotation.set(-0.08, Math.PI - 0.12, 0.0);
      drill.updateMatrix();
      const gripC = V(0, -0.1, -0.06).applyMatrix4(drill.matrix);
      chuck.rotation.y = on ? t * 90 : 0; bit.rotation.y = on ? t * 90 : 0;
      // Hand umgreift den Griff (Griff zeigt nach unten-hinten)
      const grip = drill.localToWorld ? null : null;
      placeHand(drillHand, drillHand.parts.thenar, gripC.add(V(0.03, -0.01, 0.025)), V(-0.15, -0.35, -1), V(1, 0.1, 0.1));
      const hd = papaK.headG.getWorldPosition(V(0, 0, 0));
      setCam(pos.clone().add(V(0, -0.15, 0.25)).add(hand(t, 58, 1.2)).add(V(noise(t * 30) * 0.006 * (on ? 1 : 0), 0, 0)), hd.clone().add(V(0, -0.45, 0)), 66, wob(t, 59) * 0.012);
    },
    window(t, s, tt) {
      kSpot.intensity = 18 * (flick(t, 18, 1.9, 0.3) ? 1 : 0.3); kSpill.intensity = 0.6; kHemi.intensity = 0.3;
      papaK.root.visible = false; paper.visible = false;
      const k = easeInOut(tt / 1.8);
      let pos = V(400.4, 1.4, 0.6).lerp(V(398.9, 1.45, -1.6), k);
      let look = V(398.8, 1.6, -2.5);
      if (t > EV.jump2) { const j = easeInOut((t - EV.jump2) / 0.7); pos = pos.clone().lerp(V(398.8, 1.7, -2.6), j); look = V(398.8, 0.4, -4); }
      setCam(pos.add(hand(t, 60, 2)), look, 62, wob(t, 61) * 0.02);
      kt.children.includes(kWin) && (kWin.visible = true);
    },
  };
  function papaKSit(t, show) {
    papaK.root.visible = true; paper.visible = true;
    papaK.root.position.set(0, 0, -1.55); papaK.root.rotation.y = 0;
    const turned = t > EV.pageTurn && t < EV.pageTurn + 0.4;
    papaK.setPose({ hipY: 0.52, torsoRot: [0.05, 0, 0], feet: [V(-0.13, 0.06, 0.5), V(0.13, 0.06, 0.5)], kneePole: [V(0, 1, 0.3), V(0, 1, 0.3)], hands: [V(-0.2, 1.08, 0.45), V(0.2 + (turned ? 0.06 : 0), 1.08, 0.45)], elbowPole: [V(-1, -0.5, 0), V(1, -0.5, 0)], headNod: 0.35, eyes: 'normal', mouth: 'closed' });
    papaK.root.updateMatrixWorld(true);
    paper.position.copy(kt.worldToLocal(papaK.root.localToWorld(V(0, 1.2, 0.5)))); paper.rotation.set(-0.25, Math.PI, 0); paper.rotation.y = 0; paper.rotateX(-0.15);
    // Zeitung zeigt zur Kamera (kopfüber gedruckt)
    paper.lookAt(papaK.root.localToWorld(V(0, 1.6, 3)));
  }

  // =====================================================================
  // UPDATE
  // =====================================================================
  const SET_GROUPS = { garden: 'garden', bedroom: 'garden', kidsroom: 'kidsroom', stairs: 'living', living: 'living', storage: 'storage', kitchen: 'kitchen', phone: 'phone' };
  function update(t) {
    const s = P.shots.find((x) => t >= x.t0 && t < x.t1) || P.shots[P.shots.length - 1];
    const tt = t - s.t0;
    const gname = SET_GROUPS[s.set];
    for (const [n, g] of Object.entries(groups)) g.visible = n === gname;
    // Kamera zuerst setzen (Posen schauen zur Kamera): Einstellung zweimal auswerten
    const fn = gname === 'garden' ? shotUpdate[s.cam] : gname === 'phone' ? null : inner[s.cam];
    if (fn) fn(t, s, tt);
    phoneG.visible = false; drill.visible = false; drillHand.root.visible = false; drillLight.intensity = 0;

    if (gname === 'garden') {
      hidePeople(); car.visible = false; taxi.visible = false;
      if (!['boom', 'morning', 'papaFace'].includes(s.cam)) { fireG.visible = false; garDoor.visible = true; doorPanel.visible = true; garDoor.position.set(-5.8, 0, 14.65); }
      const morning = ['morning', 'papaFace'].includes(s.cam);
      scene.background.copy(morning ? BG_MORNING : BG_NIGHT); scene.fog.color.copy(morning ? BG_MORNING : BG_NIGHT);
      scene.fog.near = morning ? 15 : 8; scene.fog.far = morning ? 70 : 42;
      moon.color.set(morning ? 0xffd2b0 : 0x8ea4ff); moon.intensity = morning ? 2.4 : 2.2;
      hemi.color.set(morning ? 0x9aa8c8 : 0x5068a8); hemi.intensity = morning ? 1.4 : 0.95;
      moonDisc.visible = !morning; streetLamp.intensity = morning ? 0 : 40; lampBulb.material.color.set(morning ? 0x777777 : 0xffd6a0);
      // Licht im Haus: Küche an ab dem Verrat (Terrassen-Einstellungen)
      const kOn = ['terrace', 'gate'].includes(s.cam);
      kitchenGlow.material.color.set(kOn ? 0xffd08a : 0x1a1410); kitchenSpill.intensity = kOn ? 6 : 0;
      terraceGlow.material.color.set(kOn ? 0xffc27a : 0x0a0806);
      terraceLight.intensity = morning ? 0 : 18; wallLamp.material.color.set(morning ? 0x666666 : 0xffe2b0);
      tdoor.rotation.y = 0; sash.rotation.y = 0; ring.visible = false;
      bottles.forEach((b) => (b.rotation.y = 0));
      // Blaulicht
      const blink = Math.floor(t * 6) % 2;
      blueL.material.color.set(blink ? 0x2a5cff : 0x0a1440); blueR.material.color.set(blink ? 0x0a1440 : 0x2a5cff);
      siren.intensity = car.visible || true ? (blink ? 14 : 4) : 0;
      gapGlow.material.color.set(0x000000);
      shotUpdate[s.cam](t, s, tt);
      siren.intensity = car.visible ? (blink ? 14 : 4) : 0;
      if (garInside.intensity > 0 && s.cam !== 'doorGap') gapGlow.material.color.set(0xffb36b);
      if (s.cam !== 'doorGap') garInside.position.set(-5.8, 2.0, 11.8);
    } else if (gname === 'phone') {
      phoneG.visible = true; scrLight.intensity = 0.03;
      const buzzT = s.cam === 'lock' ? EV.notif1 : s.cam === 'voice' ? EV.voiceMsg : -9;
      const bz = t > buzzT && t < buzzT + 0.5 && ((t - buzzT) < 0.2 || (t - buzzT) > 0.3) ? 1 : 0;
      const msgBz = [EV.msgIn2, EV.msgIn3, EV.msgIn4, EV.msgIn5].some((m) => t > m && t < m + 0.18) ? 1 : 0;
      const b = Math.max(bz, msgBz);
      const outside = s.cam === 'dial' || s.cam === 'call';
      phAmb.color.set(outside ? 0x4a5a90 : 0x5868b0);
      phoneG.position.set(Math.sin(t * 190) * 0.0018 * b + wob(t, 11) * 0.002, 0.004 + Math.cos(t * 170) * 0.0012 * b + wob(t, 12) * 0.002, lerp(-0.26, -0.235, easeInOut(tt / 3)));
      phoneG.rotation.set(-0.06, 0, 0.03 + Math.sin(t * 150) * 0.01 * b);
      setCam(V(500 + wob(t, 70) * 0.01, 1.4 + wob(t, 71) * 0.008, 0.3), V(500, 0.5, -0.7), 60, wob(t, 72) * (outside ? 0.02 : 0.008));
      drawScreen(s.cam, t);
    } else if (gname === 'kitchen') {
      kSpot.intensity = 18; kSpill.intensity = 0.6; kHemi.intensity = 0.3; kBulbMat.color.set(0xffd79a); paper.visible = true; faceLightK.intensity = 0;
      coffeeLed.material.color.set(Math.floor(t * 2) % 2 ? 0xff3020 : 0x401010);
      inner[s.cam](t, s, tt);
    } else if (gname === 'storage') {
      leaSc.root.visible = false; feetBlock.forEach((f) => (f.visible = false)); handle.rotation.z = 0;
      inner[s.cam](t, s, tt);
    } else {
      inner[s.cam](t, s, tt);
    }
    renderer.render(scene, camera);
  }
  return { update };
}
