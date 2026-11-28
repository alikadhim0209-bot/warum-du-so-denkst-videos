// Menschliche POV-Hand (rechts/links), posierbar: Finger mit 3 Gliedern, Daumen, Naegel,
// Handballen, schmales Handgelenk, Unterarm + Aermel. Masse in Metern (Erwachsener).
//
// Lokales Koordinatensystem der Hand (Ursprung = Handgelenk):
//   +z = Richtung Finger, +y = Handruecken, -y = Handflaeche, +x = Daumenseite (rechte Hand).
// Linke Hand = gespiegelte rechte Hand (scale.x = -1).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const FINGERS = {
  index: { base: [0.0255, 0.0012, 0.088], len: [0.040, 0.024, 0.019], rad: [0.0079, 0.0071, 0.0063], splay: 0.07 },
  middle: { base: [0.0075, 0.0022, 0.093], len: [0.045, 0.028, 0.020], rad: [0.0081, 0.0073, 0.0064], splay: 0.0 },
  ring: { base: [-0.0105, 0.0012, 0.090], len: [0.042, 0.026, 0.019], rad: [0.0076, 0.0069, 0.0061], splay: -0.07 },
  pinky: { base: [-0.0265, -0.0010, 0.082], len: [0.032, 0.019, 0.017], rad: [0.0065, 0.0059, 0.0054], splay: -0.16 },
};
const THUMB = { base: [0.024, -0.0085, 0.024], len: [0.039, 0.032, 0.026], rad: [0.0098, 0.0088, 0.0079] };

export const POSES = {
  relaxed: {
    index: [0.25, 0.35, 0.2], middle: [0.3, 0.4, 0.22], ring: [0.35, 0.45, 0.24], pinky: [0.4, 0.5, 0.26],
    thumb: [0.55, 0.35, -0.6, 0.15, 0.2],
  },
  point: {
    index: [0.06, 0.05, 0.03, -0.02], middle: [1.45, 1.55, 0.85], ring: [1.5, 1.6, 0.85, 0.02], pinky: [1.55, 1.55, 0.85, 0.06],
    thumb: [0.2, 0.95, -0.9, 0.45, 0.35],
  },
};

// Fingernagel: duenne, gebogene Platte, die exakt auf der (elliptischen) Fingeroberflaeche liegt.
// Form per Alpha-Textur (abgerundet), freier Rand vorne. z0 = Beginn (Nagelhaut), L = Laenge entlang des Fingers.
let NAIL_TEX = null;
function nailTexture() {
  if (NAIL_TEX) return NAIL_TEX;
  const c = document.createElement('canvas'); c.width = 128; c.height = 160;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 160);
  // Nagelbett (hinten flacher Bogen, vorne rund)
  g.beginPath();
  g.moveTo(10, 150); g.quadraticCurveTo(64, 126, 118, 150);
  g.lineTo(118, 60); g.quadraticCurveTo(118, 8, 64, 6); g.quadraticCurveTo(10, 8, 10, 60); g.closePath();
  const gr = g.createLinearGradient(0, 0, 0, 160);
  gr.addColorStop(0, '#f6e1d6'); gr.addColorStop(0.18, '#efcfc2'); gr.addColorStop(0.75, '#e6b9a9'); gr.addColorStop(1, '#ecc8ba');
  g.fillStyle = gr; g.fill();
  NAIL_TEX = new THREE.CanvasTexture(c); NAIL_TEX.colorSpace = THREE.SRGBColorSpace;
  return NAIL_TEX;
}
export function nailGeometry(rx, ry, w, L, z0, lift = 0.0003) {
  const geo = new THREE.PlaneGeometry(w, L, 12, 8);
  const p = geo.attributes.position;
  const rm = Math.max(rx, ry);
  for (let i = 0; i < p.count; i++) {
    const sx = p.getX(i), sy = p.getY(i);
    const a = sx / rm;
    p.setXYZ(i, (rx + lift) * Math.sin(a), (ry + lift) * Math.cos(a), z0 + L / 2 + sy);
  }
  geo.computeVertexNormals();
  return geo;
}
function nailMaterial() {
  return new THREE.MeshStandardMaterial({ map: nailTexture(), alphaTest: 0.5, roughness: 0.32, metalness: 0, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -1 });
}

function taperPalm(geo) {
  // Handflaeche zum Handgelenk hin schmaler, an den Kanten etwas duenner
  const p = geo.attributes.position;
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i), x = p.getX(i), y = p.getY(i);
    const k = (z - min.z) / (max.z - min.z);              // 0 = Handgelenk, 1 = Knoechel
    p.setX(i, x * (0.8 + 0.2 * k));
    const edge = Math.abs(x) / (max.x || 1);
    p.setY(i, y * (1 - 0.25 * edge * edge));
  }
  geo.computeVertexNormals();
  return geo;
}

export function makeHand({ side = 1, skin = 0xe3b896, nail = 0xf1d3c7, sleeve = 0x2d4034, cuff = 0x223027, forearmLen = 0.26, sleeveLen = 0.55, slim = 0.86 } = {}) {
  const k = slim; // < 1 = schlankere Hand (Finger, Handflaeche, Handgelenk)
  const mSkin = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.68, metalness: 0 });
  const mNail = nailMaterial();
  const mSleeve = new THREE.MeshStandardMaterial({ color: sleeve, roughness: 0.92, metalness: 0, flatShading: true });
  const mCuff = new THREE.MeshStandardMaterial({ color: cuff, roughness: 0.92, metalness: 0, flatShading: true });
  const mesh = (g, m, parent) => { const me = new THREE.Mesh(g, m); me.castShadow = true; me.receiveShadow = true; parent.add(me); return me; };

  const root = new THREE.Group();            // Handgelenk
  const hand = new THREE.Group(); root.add(hand);
  if (side < 0) root.scale.x = -1;

  // Mittelhand
  const palm = mesh(taperPalm(new RoundedBoxGeometry(0.072, 0.021 * k, 0.094, 5, 0.0098 * k)), mSkin, hand);
  palm.position.set(0.0, 0.0, 0.047);
  // Daumenballen + Kleinfingerballen
  const thenar = mesh(new THREE.SphereGeometry(1, 20, 14), mSkin, hand);
  thenar.position.set(0.018, -0.005, 0.032); thenar.scale.set(0.016 * k, 0.011 * k, 0.029); thenar.rotation.y = 0.35;
  const hypo = mesh(new THREE.SphereGeometry(1, 16, 12), mSkin, hand);
  hypo.position.set(-0.022, -0.005, 0.04); hypo.scale.set(0.01 * k, 0.008 * k, 0.027);
  // Handgelenk (weicher Uebergang)
  const wrist = mesh(new THREE.SphereGeometry(1, 20, 14), mSkin, hand);
  wrist.position.set(0, -0.001, 0.004); wrist.scale.set(0.027 * k, 0.0155 * k, 0.022);

  // Finger
  const fingers = {};
  for (const [name, f] of Object.entries(FINGERS)) {
    let parent = hand; const chain = [];
    for (let i = 0; i < 3; i++) {
      const j = new THREE.Group();
      if (i === 0) j.position.set(f.base[0] * 0.95, f.base[1], f.base[2]); else j.position.set(0, 0, f.len[i - 1]);
      parent.add(j);
      const r = f.rad[i] * k;
      const seg = mesh(new THREE.CapsuleGeometry(r, f.len[i], 8, 16), mSkin, j);
      seg.rotation.x = Math.PI / 2; seg.position.z = f.len[i] / 2;
      seg.scale.set(1.08, 1, 0.9); // Finger leicht oval
      if (i === 2) {
        // Nagel: klein, weit vorne (endet kurz vor der Kuppe), liegt auf der Fingeroberflaeche
        const L = r * 1.3;
        const n = new THREE.Mesh(nailGeometry(r * 1.08, r * 0.9, r * 1.25, L, f.len[2] - L + r * 0.15), mNail); j.add(n);
      }
      chain.push(j); parent = j;
    }
    const tip = new THREE.Object3D(); tip.position.set(0, 0, f.len[2] + f.rad[2] * k * 0.9); chain[2].add(tip);
    fingers[name] = { chain, tip, splay: f.splay };
  }
  // Daumen (Sattelgelenk mit Gier/Nick/Roll, dann 2 Beugegelenke)
  const cmc = new THREE.Group(); cmc.position.set(THUMB.base[0], THUMB.base[1], THUMB.base[2]); cmc.rotation.order = 'YXZ'; hand.add(cmc);
  const tChain = [cmc];
  {
    let parent = cmc;
    for (let i = 0; i < 3; i++) {
      const j = i === 0 ? cmc : new THREE.Group();
      if (i > 0) { j.position.set(0, 0, THUMB.len[i - 1]); parent.add(j); }
      const r = THUMB.rad[i] * k;
      const seg = mesh(new THREE.CapsuleGeometry(r, THUMB.len[i], 8, 16), mSkin, j);
      seg.rotation.x = Math.PI / 2; seg.position.z = THUMB.len[i] / 2; seg.scale.set(1.1, 1, 0.92);
      if (i === 2) {
        const L = r * 1.3;
        const n = new THREE.Mesh(nailGeometry(r * 1.1, r * 0.92, r * 1.3, L, THUMB.len[2] - L + r * 0.15), mNail); j.add(n);
      }
      if (i > 0) tChain.push(j);
      parent = j;
    }
  }
  const thumbTip = new THREE.Object3D(); thumbTip.position.set(0, 0, THUMB.len[2] + THUMB.rad[2] * k * 0.9); tChain[2].add(thumbTip);

  // Unterarm (fast ganz im Aermel) + Aermel bis zum Handgelenk (Hoodie/Jacke wie im Original)
  const fa = mesh(new THREE.CylinderGeometry(0.025 * k, 0.032 * k, forearmLen, 20), mSkin, root);
  fa.rotation.x = Math.PI / 2; fa.position.z = -forearmLen / 2 + 0.004; fa.scale.set(1.18, 1, 0.82);
  const cf = mesh(new THREE.CylinderGeometry(0.036, 0.039, 0.03, 20), mCuff, root);
  cf.rotation.x = Math.PI / 2; cf.position.z = -0.03; cf.scale.set(1.12, 1, 0.92);
  const sl = mesh(new THREE.CylinderGeometry(0.04, 0.056, sleeveLen, 20), mSleeve, root);
  sl.rotation.x = Math.PI / 2; sl.position.z = -0.044 - sleeveLen / 2; sl.scale.set(1.1, 1, 0.95);

  function setPose(p) {
    for (const [name, F] of Object.entries(fingers)) {
      const a = p[name] || [0, 0, 0, 0];
      F.chain[0].rotation.set(a[0], (a[3] || 0) + F.splay, 0);
      F.chain[1].rotation.set(a[1], 0, 0);
      F.chain[2].rotation.set(a[2], 0, 0);
    }
    const t = p.thumb || [0.5, 0.3, -0.6, 0.1, 0.1];
    cmc.rotation.set(t[1], t[0], t[2]);       // Nick (zur Handflaeche), Gier (nach aussen), Roll
    tChain[1].rotation.set(t[3], 0, 0);
    tChain[2].rotation.set(t[4], 0, 0);
    hand.rotation.set(p.wristFlex || 0, p.wristDev || 0, 0);
  }
  setPose(POSES.relaxed);
  const parts = { fingerGroups: Object.values(fingers).map((f) => f.chain[0]), thumbGroup: cmc, thenar, hypo, palm, materials: { mSkin, mNail } };
  return { root, setPose, fingers, thumbTip, parts };
}

// Freier Daumen als Bogen durch N Punkte [Ansatz, ..., Spitze] im Raum von "parent" (radii: je Segment).
// Fuer Griffe, bei denen der Daumen exakt um eine Kante herum gefuehrt werden muss (z.B. Handy),
// damit nichts durch Objekte hindurch ragt. "up" = Richtung, in die der Nagel zeigt.
export function makeThumb(parent, { skin = 0xe3b896, nail = 0xe9c3b4, radii = [0.0092, 0.0088, 0.008, 0.0072] } = {}) {
  const mSkin = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.68, metalness: 0 });
  const mNail = nailMaterial();
  const add = (g, m) => { const me = new THREE.Mesh(g, m); me.castShadow = true; me.receiveShadow = true; parent.add(me); return me; };
  const n = radii.length;
  const segs = radii.map((r, i) => add(new THREE.CylinderGeometry(i < n - 1 ? radii[i + 1] : r * 0.96, r, 1, 24), mSkin));
  const ballR = [radii[0], ...radii.map((r, i) => (i < n - 1 ? radii[i + 1] : r * 0.96))];
  const balls = ballR.map((r) => add(new THREE.SphereGeometry(r, 24, 18), mSkin));
  // Nagel als gebogene Platte im Spitzen-Koordinatensystem (z = Fingerrichtung, Ursprung = Kuppenmittelpunkt)
  const rTip = radii[n - 1] * 0.96, nailL = rTip * 1.35;
  const nailM = new THREE.Mesh(nailGeometry(rTip, rTip, rTip * 1.3, nailL, -nailL + rTip * 0.12), mNail); parent.add(nailM);
  const Y = new THREE.Vector3(0, 1, 0);
  function set(pts, up) {
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[i + 1];
      const d = new THREE.Vector3().subVectors(b, a); const len = d.length();
      segs[i].position.copy(a).addScaledVector(d, 0.5); segs[i].scale.set(1, len, 1);
      segs[i].quaternion.setFromUnitVectors(Y, d.normalize());
    }
    pts.forEach((p, i) => balls[i].position.copy(p));
    // Nagel auf dem letzten Glied
    const dir = new THREE.Vector3().subVectors(pts[n], pts[n - 1]).normalize();
    const y = up.clone().addScaledVector(dir, -up.dot(dir)).normalize();
    const x = new THREE.Vector3().crossVectors(y, dir).normalize();
    nailM.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, dir));
    nailM.position.copy(pts[n]);
  }
  return { set, meshes: [...segs, ...balls, nailM] };
}

// Hand so platzieren, dass ein bestimmter Punkt (z.B. Zeigefingerspitze) auf "target" liegt.
// forward = Richtung der Finger, up = Richtung des Handrueckens (beides im Elternraum).
export function placeHand(h, tipObj, target, forward, up) {
  const z = forward.clone().normalize();
  const x = new THREE.Vector3().crossVectors(up, z).normalize();
  const y = new THREE.Vector3().crossVectors(z, x).normalize();
  const m = new THREE.Matrix4().makeBasis(x, y, z);
  h.root.quaternion.setFromRotationMatrix(m);
  h.root.position.set(0, 0, 0);
  h.root.updateMatrixWorld(true);
  const parent = h.root.parent;
  const tipW = tipObj.getWorldPosition(new THREE.Vector3());
  const rootW = h.root.getWorldPosition(new THREE.Vector3());
  const tipLocal = parent ? parent.worldToLocal(tipW.clone()) : tipW;
  const rootLocal = parent ? parent.worldToLocal(rootW.clone()) : rootW;
  h.root.position.copy(target).sub(tipLocal.sub(rootLocal));
}
