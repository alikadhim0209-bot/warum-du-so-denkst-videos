// "Papa" – Low-Poly-Figur: Grillschürze, Karohemd, kurze Hose, Socken in Sandalen, Brille, Schnurrbart.
// Als Wesen: Hals dehnbar, Kopf kippt, schwarze Augen, viel zu lang aufgerissener Mund.
// Alle Posen in lokalen Koordinaten (Füße bei y=0, Blick +z).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const _Y = V(0, 1, 0);
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true, ...o });

export const PCOL = {
  skin: 0xd9a888, skinDead: 0xa49a8c, shirt: 0x5d7fa8, shirtD: 0x3e5a7d, shorts: 0x8a7a55, sock: 0xe8e6df,
  sandal: 0x5a3a22, apron: 0x7a1c1c, apronStrap: 0x5a1414, hair: 0x3b2c22, stache: 0x3a2a1f, glasses: 0x16161a,
};

function cyl(parent, r1, r2, mat, seg = 10) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, 1, seg), mat);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function between(mesh, a, b) {
  const d = new THREE.Vector3().subVectors(b, a); const len = Math.max(1e-4, d.length());
  mesh.position.copy(a).addScaledVector(d, 0.5); mesh.scale.set(1, len, 1);
  mesh.quaternion.setFromUnitVectors(_Y, d.normalize());
}
function ball(parent, r, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function box(parent, w, h, d, mat, x = 0, y = 0, z = 0, r = 0) {
  const g = r ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
// 2-Knochen-IK: Gelenk zwischen a und Ziel t, Längen l1/l2, Beugerichtung pole
function ik(a, t, l1, l2, pole) {
  const d = new THREE.Vector3().subVectors(t, a);
  let L = d.length(); L = Math.min(L, l1 + l2 - 1e-3);
  const dir = d.clone().normalize();
  const x = (l1 * l1 - l2 * l2 + L * L) / (2 * L);
  const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const p = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
  const end = a.clone().addScaledVector(dir, L);
  return { mid: a.clone().addScaledVector(dir, x).addScaledVector(p, h), end };
}

export function makePapa({ dead = false, outfit = 'papa' } = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const skinC = dead ? PCOL.skinDead : PCOL.skin;
  const mSkin = M(skinC, { flatShading: false, roughness: 0.9 });
  const mShirt = M(PCOL.shirt), mShirtD = M(PCOL.shirtD), mShorts = M(PCOL.shorts), mSock = M(PCOL.sock);
  const mSandal = M(PCOL.sandal), mApron = M(PCOL.apron), mStrap = M(PCOL.apronStrap), mHair = M(PCOL.hair);

  // --- Rumpf (wird bei Sitzen/Liegen mitgedreht) ---
  const torso = new THREE.Group(); torso.position.set(0, 0.98, 0); body.add(torso); // Hüfte
  const belly = ball(torso, 0.2, mShirt, 0, 0.2, 0.03); belly.scale.set(1.0, 1.05, 0.95);
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.19, 0.42, 12), mShirt); chest.position.set(0, 0.4, 0); chest.scale.z = 0.72; chest.castShadow = true; torso.add(chest);
  box(torso, 0.42, 0.06, 0.26, mShirtD, 0, 0.6, 0, 0.03);                // Schulterlinie
  ball(torso, 0.075, mShirt, -0.2, 0.585, 0); ball(torso, 0.075, mShirt, 0.2, 0.585, 0);
  // Karomuster: ein paar dunkle Streifen
  for (const y of [0.28, 0.42, 0.54]) { const s = box(torso, 0.385, 0.012, 0.29, mShirtD, 0, y, 0); s.castShadow = false; }
  const hips = box(torso, 0.37, 0.16, 0.25, mShorts, 0, 0.0, 0, 0.05);
  // Grillschürze vorn (über Brust und Bauch), Halsband
  const apronParts = [];
  const apron = box(torso, 0.31, 0.74, 0.02, mApron, 0, 0.2, 0.19, 0.008); apron.castShadow = false;
  const apronTop = box(torso, 0.2, 0.18, 0.02, mApron, 0, 0.5, 0.16, 0.006); apronTop.rotation.x = -0.08;
  const pocket = box(torso, 0.16, 0.08, 0.008, mStrap, 0, 0.05, 0.204); pocket.castShadow = false;
  apronParts.push(apron, apronTop, pocket);
  for (const s of [-1, 1]) { const st = box(torso, 0.025, 0.16, 0.02, mStrap, s * 0.07, 0.63, 0.1); st.rotation.x = -0.5; st.rotation.z = s * 0.25; apronParts.push(st); }
  // Kragen
  const collar = cyl(torso, 0.07, 0.085, mShirtD, 12); collar.position.set(0, 0.64, 0); collar.scale.set(1, 0.05, 1);

  // --- Beine ---
  const legs = [-1, 1].map(() => ({
    thigh: cyl(body, 0.085, 0.07, mShorts), shin: cyl(body, 0.05, 0.042, mSkin), sock: cyl(body, 0.046, 0.044, mSock),
    knee: ball(body, 0.055, mSkin), foot: box(body, 0.1, 0.035, 0.26, mSandal, 0, 0, 0, 0.012), toes: box(body, 0.085, 0.03, 0.05, mSock, 0, 0, 0, 0.01),
    strap: box(body, 0.105, 0.02, 0.03, mSandal),
  }));
  // --- Arme ---
  const arms = [-1, 1].map(() => ({
    sleeve: cyl(body, 0.062, 0.052, mShirt), upper: cyl(body, 0.045, 0.04, mSkin), fore: cyl(body, 0.04, 0.032, mSkin),
    elbow: ball(body, 0.04, mSkin), hand: box(body, 0.075, 0.1, 0.035, mSkin, 0, 0, 0, 0.016), thumb: cyl(body, 0.014, 0.012, mSkin),
  }));

  // --- Hals + Kopf ---
  const neck = new THREE.Mesh(new THREE.BufferGeometry(), M(skinC, { flatShading: false, roughness: 0.9 })); neck.castShadow = true; root.add(neck);
  const headG = new THREE.Group(); root.add(headG);
  const HEAD_S = V(0.86, 1.08, 0.92);
  const head = ball(headG, 0.115, mSkin); head.scale.copy(HEAD_S);
  head.geometry = new THREE.SphereGeometry(0.115, 30, 22);
  // Haare: Kranz hinten/seitlich + etwas oben (Geheimratsecken)
  const hairG = new THREE.SphereGeometry(0.119, 26, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const hair = new THREE.Mesh(hairG, mHair); hair.scale.copy(HEAD_S); hair.position.set(0, 0.012, -0.012); hair.rotation.x = -0.35; headG.add(hair);
  for (const s of [-1, 1]) { const e = ball(headG, 0.028, mSkin, s * 0.1, -0.005, -0.005); e.scale.set(0.45, 1, 0.8); }
  const nose = ball(headG, 0.019, mSkin, 0, -0.012, 0.11); nose.scale.set(0.85, 1.25, 1.1);
  const stache = box(headG, 0.075, 0.018, 0.02, M(PCOL.stache), 0, -0.042, 0.1, 0.008); stache.rotation.x = -0.25;
  // Brille: zwei Rahmen + Steg
  const mGl = M(PCOL.glasses, { flatShading: false });
  const glasses = new THREE.Group(); glasses.position.set(0, 0.018, 0.105); headG.add(glasses);
  for (const s of [-1, 1]) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0035, 6, 20), mGl); r.position.set(s * 0.037, 0, 0); r.scale.set(1.15, 0.85, 1); glasses.add(r);
    const arm = box(glasses, 0.004, 0.004, 0.1, mGl, s * 0.066, 0.002, -0.05); arm.castShadow = false;
  }
  box(glasses, 0.024, 0.004, 0.004, mGl, 0, 0.004, 0.0);

  // Gesicht als Textur auf einem Kugelsegment
  const fc = document.createElement('canvas'); fc.width = 1024; fc.height = 1024;
  const fctx = fc.getContext('2d');
  const ftex = new THREE.CanvasTexture(fc); ftex.colorSpace = THREE.SRGBColorSpace; ftex.anisotropy = 8;
  let faceKey = '';
  function drawFace(eyes, mouth) {
    const key = eyes + '|' + mouth; if (key === faceKey) return; faceKey = key;
    const g = fctx; g.clearRect(0, 0, 1024, 1024);
    // leichte Schattierung (Wangen, Augenhöhlen)
    for (const cx of [330, 694]) {
      const cg = g.createRadialGradient(cx, 470, 10, cx, 470, 120); cg.addColorStop(0, dead || eyes === 'black' ? 'rgba(40,28,30,0.55)' : 'rgba(120,70,55,0.25)'); cg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = cg; g.beginPath(); g.arc(cx, 470, 120, 0, 7); g.fill();
    }
    for (const ex of [370, 654]) {
      if (eyes === 'black') {
        g.fillStyle = '#020102'; g.beginPath(); g.ellipse(ex, 462, 56, 48, 0, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(ex + 16, 446, 9, 0, 7); g.fill();
      } else if (eyes === 'closed') {
        g.strokeStyle = '#2a1a14'; g.lineWidth = 10; g.lineCap = 'round';
        g.beginPath(); g.moveTo(ex - 40, 466); g.quadraticCurveTo(ex, 486, ex + 40, 466); g.stroke();
      } else {
        g.fillStyle = '#f3efe8'; g.beginPath(); g.ellipse(ex, 462, 42, 27, 0, 0, 7); g.fill();
        g.fillStyle = '#4a3322'; g.beginPath(); g.arc(ex + 2, 463, 20, 0, 7); g.fill();
        g.fillStyle = '#0b0705'; g.beginPath(); g.arc(ex + 2, 463, 10, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(ex + 9, 455, 5, 0, 7); g.fill();
      }
      // Augenbrauen
      g.fillStyle = '#3a2a1f'; g.save(); g.translate(ex, 398); g.rotate(ex < 512 ? 0.08 : -0.08); g.beginPath(); g.roundRect(-52, -10, 104, 20, 10); g.fill(); g.restore();
    }
    if (mouth === 'scream') {
      g.beginPath(); g.moveTo(420, 690); g.bezierCurveTo(470, 662, 554, 662, 604, 690);
      g.bezierCurveTo(650, 820, 618, 1000, 556, 1024); g.lineTo(468, 1024); g.bezierCurveTo(406, 1000, 374, 820, 420, 690); g.closePath();
      const mg = g.createLinearGradient(0, 670, 0, 1024); mg.addColorStop(0, '#3a070b'); mg.addColorStop(0.2, '#0a0103'); mg.addColorStop(1, '#020001');
      g.fillStyle = mg; g.fill(); g.strokeStyle = 'rgba(80,22,26,0.9)'; g.lineWidth = 9; g.stroke();
      g.fillStyle = '#d6cdb6';
      for (const [x, w, h] of [[452, 18, 30], [480, 15, 22], [546, 16, 24], [574, 18, 32]]) { g.beginPath(); g.moveTo(x - w / 2, 682); g.lineTo(x + w / 2, 680); g.lineTo(x + 1, 680 + h); g.fill(); }
    } else if (mouth === 'grin') {
      // viel zu breites Lächeln mit Zähnen
      g.beginPath(); g.moveTo(330, 650); g.quadraticCurveTo(512, 800, 694, 650); g.quadraticCurveTo(512, 735, 330, 650); g.closePath();
      g.fillStyle = '#e4dccb'; g.fill(); g.strokeStyle = '#2b1210'; g.lineWidth = 8; g.stroke();
      g.strokeStyle = 'rgba(60,40,30,0.6)'; g.lineWidth = 3;
      for (let x = 370; x <= 654; x += 26) { g.beginPath(); g.moveTo(x, 665); g.lineTo(x, 735); g.stroke(); }
    } else {
      g.strokeStyle = '#4a2018'; g.lineWidth = 9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(440, 680); g.quadraticCurveTo(512, 712, 584, 680); g.stroke();
    }
    ftex.needsUpdate = true;
  }
  drawFace('normal', 'smile');
  const faceGeo = new THREE.SphereGeometry(0.1162, 40, 30, Math.PI / 2 - Math.PI * 0.3, Math.PI * 0.6, Math.PI * 0.2, Math.PI * 0.72);
  const faceMesh = new THREE.Mesh(faceGeo, new THREE.MeshStandardMaterial({ map: ftex, transparent: true, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 }));
  faceMesh.scale.copy(HEAD_S); headG.add(faceMesh);

  // Polizist: dunkelblaue Uniform, lange Hose, Schuhe, Mütze, keine Schürze/Brille/Bart
  let cap = null;
  if (outfit === 'cop') {
    apronParts.forEach((m) => (m.visible = false));
    mShirt.color.set(0x24324f); mShirtD.color.set(0x1a2438); mShorts.color.set(0x1b2233); mSock.color.set(0x111216); mSandal.color.set(0x0c0c0e);
    legs.forEach((L) => { L.shin.material = mShorts; L.knee.material = mShorts; L.toes.material = mSandal; });
    stache.visible = false; hair.material = M(0x1d1a18);
    cap = new THREE.Group(); cap.position.set(0, 0.1, -0.005); headG.add(cap);
    const mc = M(0x1a2438); const c1 = cyl(cap, 0.118, 0.11, mc, 18); c1.scale.set(1, 0.07, 1); c1.position.y = 0.01;
    const brim = box(cap, 0.15, 0.012, 0.08, M(0x0b0c10), 0, -0.022, 0.1); brim.rotation.x = 0.15;
    const band = cyl(cap, 0.112, 0.112, M(0xd8d0b0), 18); band.scale.set(1, 0.012, 1); band.position.y = -0.02;
  }
  const SH = [V(-0.215, 1.56, 0), V(0.215, 1.56, 0)];
  const HIP = [V(-0.1, 0.98, 0), V(0.1, 0.98, 0)];
  const tmp = new THREE.Vector3();

  // pose: { torsoRot:[x,y,z], hipY, hands:[Vec,Vec] (lokal), elbowPole:[Vec,Vec], feet:[Vec,Vec], kneePole:[..],
  //         neck: Verlängerung in m, neckDir: Vec (Richtung der Dehnung), headTilt, headNod, headTurn, lookAt (Welt), eyes, mouth, jaw }
  function setPose(p = {}) {
    root.updateMatrixWorld(true);
    const hipY = p.hipY ?? 0.98;
    torso.position.set(0, hipY, p.hipZ ?? 0);
    torso.rotation.set(...(p.torsoRot || [0, 0, 0]));
    torso.updateMatrixWorld(true);
    body.updateMatrixWorld(true);
    // Schultern/Hüften aus dem Rumpf ableiten (lokal zur Figur)
    const toBody = (v) => body.worldToLocal(torso.localToWorld(v.clone()));
    root.updateMatrixWorld(true);
    const sh = [toBody(V(-0.215, 0.58, 0)), toBody(V(0.215, 0.58, 0))];
    const hp = [toBody(V(-0.1, 0.0, 0)), toBody(V(0.1, 0.0, 0))];
    const feet = p.feet || [V(-0.11, 0.06, 0.02), V(0.11, 0.06, 0.02)];
    const hands = p.hands || [V(-0.27, 0.86, 0.05), V(0.27, 0.86, 0.05)];
    legs.forEach((L, i) => {
      const s = i ? 1 : -1;
      const { mid: knee, end: ankle } = ik(hp[i], feet[i], 0.47, 0.45, (p.kneePole && p.kneePole[i]) || V(s * 0.1, 0, 1));
      between(L.thigh, hp[i], knee.clone().lerp(hp[i], 0.25));
      between(L.shin, knee, ankle);
      between(L.sock, ankle.clone().lerp(knee, 0.22), ankle);
      L.knee.position.copy(knee);
      const fr = p.footRot ? p.footRot[i] : 0;
      L.foot.position.copy(ankle).add(V(0, -0.045, 0.06)); L.foot.rotation.set(fr, 0, 0);
      L.toes.position.copy(ankle).add(V(0, -0.022, 0.15)); L.toes.rotation.set(fr, 0, 0);
      L.strap.position.copy(ankle).add(V(0, -0.02, 0.1)); L.strap.rotation.set(fr, 0, 0);
    });
    arms.forEach((A, i) => {
      const s = i ? 1 : -1;
      const { mid: el, end: wr } = ik(sh[i], hands[i], 0.3, 0.27, (p.elbowPole && p.elbowPole[i]) || V(s * 0.6, -0.2, -0.8));
      between(A.sleeve, sh[i], sh[i].clone().lerp(el, 0.55));
      between(A.upper, sh[i].clone().lerp(el, 0.5), el);
      between(A.fore, el, wr);
      A.elbow.position.copy(el);
      const fd = tmp.subVectors(wr, el).normalize().clone();
      A.hand.position.copy(wr).addScaledVector(fd, 0.055);
      A.hand.quaternion.setFromUnitVectors(_Y, fd);
      if (p.handRoll) A.hand.rotateY(p.handRoll[i]);
      const tb = wr.clone().addScaledVector(fd, 0.03).add(V(-s * 0.02, 0, 0.03));
      between(A.thumb, tb, tb.clone().addScaledVector(fd, 0.04).add(V(-s * 0.01, 0, 0.015)));
    });
    // Hals: von der Schulter-Mitte nach oben, Dehnung entlang neckDir, mit leichter S-Kurve
    const nb = toBody(V(0, 0.62, -0.01));
    const ext = p.neck || 0;
    const ndir = (p.neckDir || V(0, 1, 0)).clone().normalize();
    const top = nb.clone().addScaledVector(V(0, 1, 0), 0.1).addScaledVector(ndir, ext);
    const bend = p.neckBend || V(0, 0, 0);
    const pts = [nb, nb.clone().lerp(top, 0.33).addScaledVector(bend, 0.6), nb.clone().lerp(top, 0.7).addScaledVector(bend, 0.8), top];
    const wpts = pts.map((q) => q.clone()); // body liegt ohne Transform in root -> body-lokal == root-lokal
    headG.position.copy(top.clone().add(V(0, 0.1, 0.0)));
    headG.updateMatrixWorld(true);
    if (p.lookAt) headG.lookAt(p.lookAt);
    else { headG.quaternion.copy(root.getWorldQuaternion(new THREE.Quaternion())); }
    headG.rotateY(p.headTurn || 0); headG.rotateZ(p.headTilt || 0); headG.rotateX(p.headNod || 0);
    headG.scale.set(1, p.headStretch || 1, 1);
    headG.updateMatrixWorld(true);
    wpts.push(root.worldToLocal(headG.localToWorld(V(0, -0.06, -0.03))));
    const r = ext > 0.2 ? 0.04 : 0.055;
    neck.geometry.dispose();
    neck.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wpts), Math.max(8, Math.round(10 + ext * 14)), r, 10, false);
    drawFace(p.eyes || 'normal', p.mouth || 'smile');
    if (outfit !== 'cop') apronParts.forEach((m) => (m.visible = p.apron !== false));
    glasses.visible = p.glasses !== false && outfit !== 'cop' && p.eyes !== 'black';
  }
  setPose({});
  return { root, setPose, headG, arms };
}

// Lea: kleine Schwester im Schlafanzug (einfach, steht/hockt/liegt über root-Rotation)
export function makeKid() {
  const root = new THREE.Group();
  const mPj = M(0xc9849a), mPjD = M(0xa86a80), mSkin = M(PCOL.skin, { flatShading: false, roughness: 0.9 }), mHair = M(0x5a3a22);
  for (const s of [-1, 1]) {
    const leg = cyl(root, 0.05, 0.045, mPj); between(leg, V(s * 0.06, 0.55, 0), V(s * 0.065, 0.06, 0.01));
    ball(root, 0.045, mSkin, s * 0.065, 0.04, 0.04).scale.set(0.9, 0.6, 1.4);
  }
  const t = cyl(root, 0.13, 0.15, mPj, 12); between(t, V(0, 0.52, 0), V(0, 0.98, 0)); t.scale.z = 0.75;
  for (const y of [0.62, 0.76, 0.9]) { const st = box(root, 0.27, 0.014, 0.21, mPjD, 0, y, 0); st.castShadow = false; }
  const arms = [];
  for (const s of [-1, 1]) {
    const a = cyl(root, 0.04, 0.034, mPj); between(a, V(s * 0.15, 0.95, 0), V(s * 0.19, 0.62, 0.06));
    arms.push(a);
    ball(root, 0.035, mSkin, s * 0.19, 0.6, 0.07);
  }
  const headG = new THREE.Group(); headG.position.set(0, 1.12, 0); root.add(headG);
  const head = ball(headG, 0.115, mSkin); head.geometry = new THREE.SphereGeometry(0.115, 28, 20);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.122, 26, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), mHair); hair.position.set(0, 0.01, -0.015); hair.rotation.x = -0.3; headG.add(hair);
  const back = ball(headG, 0.11, mHair, 0, -0.03, -0.04); back.scale.set(1.05, 1.05, 0.9);
  for (const s of [-1, 1]) { const pt = ball(headG, 0.045, mHair, s * 0.12, -0.02, -0.04); pt.scale.set(0.8, 1.5, 0.8); }
  const fc = document.createElement('canvas'); fc.width = 512; fc.height = 512; const g = fc.getContext('2d');
  for (const ex of [190, 322]) {
    g.fillStyle = '#f3efe8'; g.beginPath(); g.ellipse(ex, 250, 30, 24, 0, 0, 7); g.fill();
    g.fillStyle = '#3b2a1c'; g.beginPath(); g.arc(ex, 252, 17, 0, 7); g.fill();
    g.fillStyle = '#000'; g.beginPath(); g.arc(ex, 252, 8, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + 6, 245, 5, 0, 7); g.fill();
    g.fillStyle = '#5a3a22'; g.beginPath(); g.roundRect(ex - 30, 200, 60, 10, 5); g.fill();
  }
  g.fillStyle = '#3a0c0c'; g.beginPath(); g.ellipse(256, 350, 22, 16, 0, 0, 7); g.fill();
  const tex = new THREE.CanvasTexture(fc); tex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.1162, 32, 24, Math.PI / 2 - Math.PI * 0.3, Math.PI * 0.6, Math.PI * 0.2, Math.PI * 0.62),
    new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 }));
  headG.add(face);
  return { root, headG };
}
