// Demo "Der 13. Stock" – Low-Poly-3D in Ich-Perspektive (Dunkle_Akte-Stil)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makeHand, makeThumb, placeHand, POSES } from '/hand.js';

const W = 1080, H = 1920;

// ---------------- Mathe ----------------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };
const wob = (t, s) => noise(t * 0.8 + s) * 0.6 + noise(t * 2.1 + s * 1.7) * 0.3 + noise(t * 5.3 + s * 2.9) * 0.1;
const inR = (t, r) => t >= r[0] && t < r[1];
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------- Bau-Helfer ----------------
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0, flatShading: true, ...o });
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const RB = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 3, r);
const CY = (rt, rb, h, s = 14) => new THREE.CylinderGeometry(rt, rb, h, s);
const CAP = (r, l) => new THREE.CapsuleGeometry(r, l, 4, 12);
function add(parent, geo, mat, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
}
function canvasTex(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { c, ctx: c.getContext('2d'), tex };
}
const _Y = V(0, 1, 0);
// Zylinder (Hoehe 1) zwischen zwei Punkten ausrichten
function between(mesh, a, b) {
  const d = new THREE.Vector3().subVectors(b, a); const len = d.length();
  mesh.position.copy(a).addScaledVector(d, 0.5); mesh.scale.set(1, len, 1);
  mesh.quaternion.setFromUnitVectors(_Y, d.normalize());
}

const PAL = {
  steel: 0x4c5262, steelL: 0x5f6676, steelD: 0x2a2e37, seam: 0x1a1c22, cabFloor: 0x231f1e, ceiling: 0x262931, rail: 0x8c93a1,
  skin: 0xdcae8c, sleeve: 0x2d4034, cuff: 0x223027,
  wall: 0x29304a, wains: 0x1b2030, carpet: 0x4a1b20, carpetEdge: 0x2b1013, door: 0x382822, frame: 0x221915, brass: 0xb08a43,
  hallCeil: 0x1a1d26, mSkin: 0x948d82, jacket: 0x4a0f12, gold: 0x8f7336, trousers: 0x121216,
};

export async function build({ canvas, plan }) {
  const P = plan;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x040509);
  scene.fog = new THREE.Fog(0x05060b, 3.2, 13.0);
  const camera = new THREE.PerspectiveCamera(66, W / H, 0.01, 60);
  scene.add(camera);

  // ================= AUFZUGKABINE =================
  const cab = new THREE.Group(); scene.add(cab);
  const mSteel = M(PAL.steel, { roughness: 0.55, metalness: 0.2 });
  const mSteelL = M(PAL.steelL, { roughness: 0.5, metalness: 0.25 });
  const mSteelD = M(PAL.steelD, { roughness: 0.6, metalness: 0.15 });
  const mSeam = M(PAL.seam);
  add(cab, B(1.6, 0.05, 1.5), M(PAL.cabFloor), 0, -0.025, 0);
  add(cab, B(1.66, 0.05, 1.56), M(PAL.ceiling), 0, 2.325, 0, false);
  const lightPanelMat = new THREE.MeshBasicMaterial({ color: 0xfff0d2 });
  add(cab, B(0.86, 0.012, 0.56), lightPanelMat, 0, 2.296, 0.06, false);
  add(cab, B(0.92, 0.02, 0.62), mSteelD, 0, 2.30, 0.06, false);
  // Rueckwand + Seitenwaende (Paneele mit Fugen, unten Trittblech)
  add(cab, B(1.6, 2.3, 0.03), mSteel, 0, 1.15, 0.765);
  for (const x of [-0.27, 0.27]) add(cab, B(0.01, 2.2, 0.01), mSeam, x, 1.15, 0.748, false);
  add(cab, B(1.6, 0.14, 0.035), mSteelD, 0, 0.07, 0.745);
  for (const s of [-1, 1]) {
    add(cab, B(0.03, 2.3, 1.5), mSteel, s * 0.815, 1.15, 0);
    for (const z of [-0.22, 0.28]) add(cab, B(0.01, 2.2, 0.01), mSeam, s * 0.798, 1.15, z, false);
    add(cab, B(0.035, 0.14, 1.5), mSteelD, s * 0.795, 0.07, 0);
  }
  // Handlauf
  const mRail = M(PAL.rail, { roughness: 0.3, metalness: 0.6, flatShading: false });
  const rail = add(cab, CY(0.017, 0.017, 1.36), mRail, 0, 0.95, 0.70); rail.rotation.z = Math.PI / 2;
  for (const x of [-0.64, 0.64]) add(cab, B(0.02, 0.02, 0.06), mRail, x, 0.95, 0.73);
  const railL = add(cab, CY(0.017, 0.017, 1.1), mRail, -0.75, 0.95, 0.05); railL.rotation.x = Math.PI / 2;
  // Frontwand mit Tueroeffnung (Oeffnung x -0.45..0.45, Hoehe 2.05)
  add(cab, B(0.35, 2.05, 0.04), mSteel, -0.625, 1.025, -0.70);
  add(cab, B(0.35, 2.05, 0.04), mSteel, 0.625, 1.025, -0.70);
  add(cab, B(1.6, 0.27, 0.04), mSteel, 0, 2.185, -0.70);
  for (const x of [-0.452, 0.452]) add(cab, B(0.022, 2.06, 0.06), mSteelD, x, 1.03, -0.70);
  add(cab, B(0.926, 0.022, 0.06), mSteelD, 0, 2.06, -0.70);
  add(cab, B(0.9, 0.012, 0.1), mSteelL, 0, 0.006, -0.74);
  // Schiebetueren
  const doorL = add(cab, B(0.455, 2.05, 0.02), mSteelL, -0.23, 1.025, -0.735);
  const doorR = add(cab, B(0.455, 2.05, 0.02), mSteelL, 0.23, 1.025, -0.735);

  // --- Bedienfeld (rechte Wand) ---
  const panel = canvasTex(300, 930);
  const panelEm = canvasTex(300, 930);
  const BTN = { cols: [95, 205], rows: [150, 255, 360, 465, 570, 675] };
  const LAYOUT = [[11, 12], [9, 10], [7, 8], [5, 6], [3, 4], [1, 2]];
  function drawPanel(lit) {
    const g = panel.ctx, e = panelEm.ctx;
    g.clearRect(0, 0, 300, 930); e.fillStyle = '#000'; e.fillRect(0, 0, 300, 930);
    const grd = g.createLinearGradient(0, 0, 300, 0); grd.addColorStop(0, '#8a919e'); grd.addColorStop(1, '#9ca3b0');
    g.fillStyle = grd; g.beginPath(); g.roundRect(4, 4, 292, 922, 18); g.fill();
    g.strokeStyle = '#555b67'; g.lineWidth = 6; g.stroke();
    for (const [sx, sy] of [[24, 24], [276, 24], [24, 906], [276, 906]]) { g.fillStyle = '#5d6370'; g.beginPath(); g.arc(sx, sy, 7, 0, 7); g.fill(); }
    LAYOUT.forEach((row, ri) => row.forEach((n, ci) => {
      const x = BTN.cols[ci], y = BTN.rows[ri], on = lit.includes(n);
      g.fillStyle = '#3a3e47'; g.beginPath(); g.arc(x, y, 40, 0, 7); g.fill();
      const bg = g.createRadialGradient(x - 10, y - 10, 4, x, y, 34); bg.addColorStop(0, '#e3e6eb'); bg.addColorStop(1, '#aeb3bc');
      g.fillStyle = bg; g.beginPath(); g.arc(x, y, 33, 0, 7); g.fill();
      g.fillStyle = on ? '#ff9a2e' : '#33363d'; g.font = '700 34px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(n), x, y + 1);
      if (on) {
        g.strokeStyle = '#ffae42'; g.lineWidth = 6; g.beginPath(); g.arc(x, y, 37, 0, 7); g.stroke();
        e.shadowColor = '#ffae42'; e.shadowBlur = 24; e.strokeStyle = '#ffae42'; e.lineWidth = 7; e.beginPath(); e.arc(x, y, 37, 0, 7); e.stroke();
        e.fillStyle = '#ff9a2e'; e.font = '700 34px Inter'; e.textAlign = 'center'; e.textBaseline = 'middle'; e.fillText(String(n), x, y + 1);
        e.shadowBlur = 0;
      }
    }));
    // Alarmknopf
    g.fillStyle = '#3a3e47'; g.beginPath(); g.arc(95, 800, 40, 0, 7); g.fill();
    g.fillStyle = '#e2b62b'; g.beginPath(); g.arc(95, 800, 33, 0, 7); g.fill();
    g.fillStyle = '#3b3420'; g.font = '700 30px Inter'; g.textAlign = 'center'; g.fillText('🔔︎', 95, 802);
    g.fillStyle = '#3a3e47'; g.beginPath(); g.arc(205, 800, 40, 0, 7); g.fill();
    g.fillStyle = '#c9cdd4'; g.beginPath(); g.arc(205, 800, 33, 0, 7); g.fill();
    g.fillStyle = '#33363d'; g.font = '700 28px Inter'; g.fillText('◀▶', 205, 802);
    panel.tex.needsUpdate = true; panelEm.tex.needsUpdate = true;
  }
  drawPanel([]);
  const panelMat = new THREE.MeshStandardMaterial({ map: panel.tex, emissiveMap: panelEm.tex, emissive: 0xffffff, emissiveIntensity: 1.4, roughness: 0.45, metalness: 0.25 });
  const PANEL_C = V(0.797, 1.22, -0.40), PANEL_W = 0.2, PANEL_H = 0.62;
  const panelMesh = add(cab, new THREE.PlaneGeometry(PANEL_W, PANEL_H), panelMat, PANEL_C.x, PANEL_C.y, PANEL_C.z, false);
  panelMesh.rotation.y = -Math.PI / 2;
  const btnWorld = (n) => {
    let ri = 0, ci = 0; LAYOUT.forEach((r, i) => r.forEach((m, j) => { if (m === n) { ri = i; ci = j; } }));
    const u = BTN.cols[ci] / 300, v = BTN.rows[ri] / 930;
    return V(PANEL_C.x - 0.004, PANEL_C.y + (0.5 - v) * PANEL_H, PANEL_C.z + (u - 0.5) * PANEL_W);
  };
  const BTN12 = btnWorld(12);

  // --- Stockwerksanzeige ueber der Tuer (7-Segment, rot) ---
  const disp = canvasTex(600, 220);
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
  function seg7(ctx, x, y, s, segs) {
    const w = 70 * s, h = 130 * s, t = 15 * s;
    const R = {
      a: [x + t, y, w - 2 * t, t], d: [x + t, y + h - t, w - 2 * t, t], g: [x + t, y + h / 2 - t / 2, w - 2 * t, t],
      f: [x, y + t, t, h / 2 - 1.5 * t], b: [x + w - t, y + t, t, h / 2 - 1.5 * t],
      e: [x, y + h / 2 + t / 2, t, h / 2 - 1.5 * t], c: [x + w - t, y + h / 2 + t / 2, t, h / 2 - 1.5 * t],
    };
    for (const k of segs) { const r = R[k]; if (r) ctx.fillRect(r[0], r[1], r[2], r[3]); }
  }
  function drawDisplay(num, t, glitch) {
    const g = disp.ctx;
    g.fillStyle = '#050505'; g.fillRect(0, 0, 600, 220);
    g.fillStyle = '#140404'; g.beginPath(); g.roundRect(10, 10, 580, 200, 22); g.fill();
    const col = '#ff3b2c';
    g.shadowColor = col; g.shadowBlur = 26; g.fillStyle = col;
    // Pfeil nach oben (blinkt waehrend der Fahrt)
    if (num < 13 && Math.floor(t * 3) % 2 === 0) { g.beginPath(); g.moveTo(110, 55); g.lineTo(160, 125); g.lineTo(60, 125); g.closePath(); g.fill(); g.fillRect(95, 125, 30, 40); }
    const s = String(num).padStart(2, ' ');
    const digits = glitch ? [hash(t * 91) > 0.5 ? 'abcdefg' : 'gfb', hash(t * 37) > 0.5 ? 'abgcd' : 'adg'] : [SEG[s[0]] || '', SEG[s[1]] || ''];
    seg7(g, 270, 45, 1, digits[0]); seg7(g, 370, 45, 1, digits[1]);
    g.shadowBlur = 0; disp.tex.needsUpdate = true;
  }
  drawDisplay(10, 0, false);
  const dispMesh = add(cab, new THREE.PlaneGeometry(0.30, 0.11), new THREE.MeshBasicMaterial({ map: disp.tex, toneMapped: false }), 0, 2.19, -0.672, false);
  dispMesh.castShadow = false;
  add(cab, B(0.33, 0.135, 0.008), mSteelD, 0, 2.19, -0.678, false);

  // --- Licht in der Kabine ---
  const CAB_SPOT = 8.5, CAB_FILL = 0.7;
  const cabSpot = new THREE.SpotLight(0xffe2b8, CAB_SPOT, 0, 1.25, 0.9, 2);
  cabSpot.position.set(0, 2.26, 0.06); cabSpot.target.position.set(0, 0, 0.0);
  cabSpot.castShadow = true; cabSpot.shadow.mapSize.set(1024, 1024); cabSpot.shadow.bias = -0.0004; cabSpot.shadow.camera.near = 0.05; cabSpot.shadow.camera.far = 8;
  scene.add(cabSpot, cabSpot.target);
  const cabFill = new THREE.PointLight(0xffdcae, CAB_FILL, 0, 2); cabFill.position.set(0, 1.95, 0.35); scene.add(cabFill);
  const HEMI = 0.42;
  const hemi = new THREE.HemisphereLight(0x5a6894, 0x1c1614, HEMI); scene.add(hemi);

  // ================= FLUR (13. Stock) =================
  const hall = new THREE.Group(); scene.add(hall);
  const Z0 = -0.80, Z1 = -11.0, HW = 1.1, HH = 2.6, MID = (Z0 + Z1) / 2, LEN = Z0 - Z1;
  add(hall, B(2 * HW, 0.04, LEN), M(0x261c1a), 0, -0.02, MID, false);
  add(hall, B(1.2, 0.012, LEN), M(PAL.carpet), 0, 0.006, MID, false);
  for (const x of [-0.6, 0.6]) add(hall, B(0.05, 0.014, LEN), M(PAL.carpetEdge), x, 0.008, MID, false);
  add(hall, B(2 * HW, 0.04, LEN), M(PAL.hallCeil), 0, HH + 0.02, MID, false);
  const mWall = M(PAL.wall), mWains = M(PAL.wains);
  for (const s of [-1, 1]) {
    add(hall, B(0.04, HH, LEN), mWall, s * (HW + 0.02), HH / 2, MID, false);
    add(hall, B(0.03, 0.95, LEN), mWains, s * (HW - 0.005), 0.475, MID, false);
    add(hall, B(0.05, 0.04, LEN), M(0x12151c), s * (HW - 0.02), 0.96, MID, false);
    add(hall, B(0.05, 0.12, LEN), M(0x0f1116), s * (HW - 0.02), 0.06, MID, false);
  }
  // Aussenseite der Aufzugwand (Flurseite)
  add(hall, B(2 * HW, HH, 0.05), mWall, 0, HH / 2, -0.79, false).visible = false;
  for (const x of [-0.78, 0.78]) add(hall, B(0.66, HH, 0.05), mWall, x, HH / 2, -0.80, false);
  add(hall, B(0.9, HH - 2.05, 0.05), mWall, 0, 2.05 + (HH - 2.05) / 2, -0.80, false);
  // Rueckwand mit Fenster (Mondlicht)
  add(hall, B(2 * HW, HH, 0.05), mWall, 0, HH / 2, Z1 - 0.02, false);
  add(hall, B(0.8, 1.25, 0.02), new THREE.MeshBasicMaterial({ color: 0x6d84c8, fog: false }), 0, 1.45, Z1 + 0.01, false);
  const mWin = M(0x0b0d13);
  add(hall, B(0.05, 1.3, 0.05), mWin, 0, 1.45, Z1 + 0.03, false);
  add(hall, B(0.8, 0.05, 0.05), mWin, 0, 1.45, Z1 + 0.03, false);
  for (const y of [0.8, 2.1]) add(hall, B(0.9, 0.06, 0.06), mWin, 0, y, Z1 + 0.03, false);
  for (const x of [-0.42, 0.42]) add(hall, B(0.06, 1.36, 0.06), mWin, x, 1.45, Z1 + 0.03, false);
  // Zimmertueren mit Nummernschild
  const plaques = [];
  function hallDoor(side, z, num) {
    const g = new THREE.Group(); g.position.set(side * (HW - 0.01), 0, z); g.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; hall.add(g);
    add(g, B(1.04, 2.2, 0.05), M(PAL.frame), 0, 1.1, 0.0, false);
    add(g, B(0.88, 2.04, 0.05), M(PAL.door), 0, 1.02, 0.02, false);
    for (const y of [0.55, 1.45]) add(g, B(0.66, 0.6, 0.02), M(0x2f211c), 0, y, 0.05, false);
    const knob = add(g, new THREE.SphereGeometry(0.03, 10, 8), M(PAL.brass, { metalness: 0.7, roughness: 0.35 }), 0.33, 1.0, 0.07, false);
    knob.castShadow = false;
    const pl = canvasTex(256, 96); const c = pl.ctx;
    c.fillStyle = '#9c7a3a'; c.beginPath(); c.roundRect(0, 0, 256, 96, 14); c.fill();
    c.fillStyle = '#2a1d0c'; c.font = '700 64px Inter'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(num, 128, 52);
    pl.tex.needsUpdate = true;
    plaques.push(add(g, new THREE.PlaneGeometry(0.2, 0.075), new THREE.MeshStandardMaterial({ map: pl.tex, roughness: 0.4, metalness: 0.5 }), 0, 1.62, 0.071, false));
  }
  hallDoor(1, -2.5, '1301'); hallDoor(-1, -3.4, '1302'); hallDoor(1, -5.6, '1303'); hallDoor(-1, -6.9, '1304'); hallDoor(1, -8.8, '1305');
  // Haengeschild "13" mitten im Flur
  const sign = canvasTex(320, 200); {
    const c = sign.ctx; c.fillStyle = '#15171d'; c.beginPath(); c.roundRect(0, 0, 320, 200, 16); c.fill();
    c.strokeStyle = '#a8864a'; c.lineWidth = 8; c.stroke();
    c.fillStyle = '#d8c08a'; c.font = '700 132px Inter'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('13', 160, 108);
    sign.tex.needsUpdate = true;
  }
  // seitlich aufgehaengt, damit es von der Aufzugtuer aus nicht hinter einer Lampe sitzt
  const SIGN_X = -0.62, SIGN_Z = -3.9;
  const signMesh = add(hall, new THREE.PlaneGeometry(0.42, 0.26), new THREE.MeshStandardMaterial({ map: sign.tex, roughness: 0.6 }), SIGN_X, 2.22, SIGN_Z, false);
  signMesh.rotation.y = 0.2;
  for (const dx of [-0.15, 0.15]) add(hall, CY(0.004, 0.004, 0.3, 4), M(0x111111), SIGN_X + dx * Math.cos(0.2), 2.48, SIGN_Z - dx * Math.sin(0.2), false);
  // Haengelampen
  const bulbs = [];
  for (const z of [-2.9, -6.3]) {
    add(hall, CY(0.006, 0.006, 0.42, 4), M(0x0c0c0c), 0, HH - 0.21, z, false);
    const shade = add(hall, new THREE.ConeGeometry(0.17, 0.14, 14, 1, true), M(0x2a2622, { side: THREE.DoubleSide }), 0, HH - 0.46, z, false);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd79a });
    add(hall, new THREE.SphereGeometry(0.045, 12, 10), bulbMat, 0, HH - 0.52, z, false).castShadow = false;
    // Lichtkegel nach unten (Schirm), Decke bleibt dunkel; dazu ein schwaches Streulicht
    const L = new THREE.SpotLight(0xffc982, 14, 0, 1.0, 0.65, 2);
    L.position.set(0, HH - 0.5, z); L.target.position.set(0, 0, z); scene.add(L, L.target);
    const spill = new THREE.PointLight(0xffc982, 0.3, 0, 2); spill.position.set(0, HH - 0.62, z); scene.add(spill);
    bulbs.push({ L, spill, bulbMat, base: 14, spillBase: 0.3, shade });
  }
  // Mondlicht durchs Fenster (wirft lange Schatten Richtung Kamera)
  const moon = new THREE.SpotLight(0x8aa0ff, 22, 0, 0.62, 0.9, 1.4);
  moon.position.set(0, 1.7, Z1 + 0.25); moon.target.position.set(0, 0.0, -3.0);
  moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); moon.shadow.bias = -0.0005; moon.shadow.camera.near = 0.2; moon.shadow.camera.far = 14;
  scene.add(moon, moon.target);

  // ================= DIE GESTALT ("Liftboy") =================
  const mSkinC = M(PAL.mSkin, { flatShading: false, roughness: 0.9 });
  const mJacket = M(PAL.jacket), mGold = M(PAL.gold, { metalness: 0.6, roughness: 0.35 }), mTrous = M(PAL.trousers);
  const body = new THREE.Group(); scene.add(body);
  for (const x of [-0.09, 0.09]) {
    add(body, CY(0.05, 0.058, 1.12, 10), mTrous, x, 0.6, 0);
    add(body, B(0.095, 0.05, 0.22), M(0x0b0b0d), x, 0.025, 0.045);
  }
  add(body, B(0.3, 0.16, 0.19), mTrous, 0, 1.2, 0);
  const torso = add(body, CY(0.2, 0.155, 0.64, 12), mJacket, 0, 1.56, 0); torso.scale.z = 0.72;
  const flare = add(body, CY(0.16, 0.185, 0.14, 12), mJacket, 0, 1.23, 0); flare.scale.z = 0.75;
  for (const x of [-0.055, 0.055]) for (const y of [1.36, 1.5, 1.64]) add(body, new THREE.SphereGeometry(0.014, 8, 6), mGold, x, y, 0.138, false);
  add(body, CY(0.075, 0.095, 0.06, 12), mGold, 0, 1.895, 0);
  for (const x of [-0.2, 0.2]) add(body, new THREE.SphereGeometry(0.062, 12, 10), mJacket, x, 1.84, 0);
  // Arme, Finger, Hals, Kopf (werden pro Pose zwischen Weltpunkten aufgespannt)
  const unitCyl = (r1, r2, m) => { const me = new THREE.Mesh(CY(r1, r2, 1, 10), m); me.castShadow = true; me.receiveShadow = true; scene.add(me); return me; };
  const arms = [-1, 1].map(() => ({
    upper: unitCyl(0.045, 0.04, mJacket), fore: unitCyl(0.036, 0.03, mJacket), cuff: unitCyl(0.038, 0.038, mGold), wrist: unitCyl(0.022, 0.026, mSkinC),
    palm: (() => { const me = new THREE.Mesh(RB(0.06, 0.1, 0.028, 0.012), mSkinC); me.castShadow = true; scene.add(me); return me; })(),
    fingers: [0, 1, 2, 3].map(() => [unitCyl(0.009, 0.008, mSkinC), unitCyl(0.008, 0.006, mSkinC)]),
  }));
  const neck = new THREE.Mesh(new THREE.BufferGeometry(), M(0x9a9286, { flatShading: false, roughness: 0.9 })); neck.castShadow = true; scene.add(neck);
  // Aufzuglicht, das auf die Gestalt vor der Tuer faellt (nur nach dem Sprung)
  const NEAR_Z = -2.4; // Standort der Gestalt nach dem Stromausfall
  const faceLight = new THREE.PointLight(0xdfe4f5, 0, 0, 2); faceLight.position.set(0, 1.35, NEAR_Z + 0.6); scene.add(faceLight); // Licht von unten
  const headG = new THREE.Group(); scene.add(headG);
  const HEAD_S = V(0.72, 1.28, 0.84);
  const headMesh = add(headG, new THREE.SphereGeometry(0.12, 28, 20), mSkinC, 0, 0, 0); headMesh.scale.copy(HEAD_S);
  // dezente Nase
  const nose = add(headG, new THREE.SphereGeometry(0.012, 12, 10), mSkinC, 0, -0.022, 0.1, false); nose.scale.set(0.8, 1.7, 0.9); nose.rotation.x = -0.25;
  // Gesicht als Decal-Kugelsegment: kleine tote Augen, eingefallene Wangen, langes Gesicht
  const face = canvasTex(1024, 1024);
  function drawFace(mode) {
    const g = face.ctx; g.clearRect(0, 0, 1024, 1024);
    const scream = mode === 'scream';
    for (const cx of [300, 724]) {
      const cg = g.createRadialGradient(cx, 650, 10, cx, 650, 180); cg.addColorStop(0, 'rgba(55,40,40,0.4)'); cg.addColorStop(1, 'rgba(55,40,40,0)');
      g.fillStyle = cg; g.beginPath(); g.arc(cx, 650, 180, 0, 7); g.fill();
    }
    // Schlaefen/Stirn dunkler
    for (const [cx, cy, r, a] of [[250, 330, 200, 0.35], [774, 330, 200, 0.35], [512, 200, 260, 0.18]]) {
      const cg = g.createRadialGradient(cx, cy, 10, cx, cy, r); cg.addColorStop(0, `rgba(50,38,38,${a})`); cg.addColorStop(1, 'rgba(50,38,38,0)');
      g.fillStyle = cg; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    }
    for (const ex of [390, 634]) {
      const dir = ex < 512 ? -1 : 1;
      // tiefe, dunkle Augenhoehlen
      const sg = g.createRadialGradient(ex, 430, 8, ex, 435, 120);
      sg.addColorStop(0, 'rgba(12,6,8,1)'); sg.addColorStop(0.55, 'rgba(30,16,18,0.8)'); sg.addColorStop(1, 'rgba(45,28,30,0)');
      g.fillStyle = sg; g.beginPath(); g.ellipse(ex, 435, 120, 104, 0, 0, 7); g.fill();
      // starre schwarze Augen mit winzigem Glanzpunkt (aus der Distanz gut lesbar)
      g.fillStyle = '#030202'; g.beginPath(); g.ellipse(ex, 432, scream ? 60 : 52, scream ? 58 : 44, dir * 0.15, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(ex + 14, 418, 9, 0, 7); g.fill();
    }
    g.fillStyle = 'rgba(30,18,18,0.75)';
    for (const nx of [494, 530]) { g.beginPath(); g.ellipse(nx, 612, 10, 6, 0, 0, 7); g.fill(); }
    if (!scream) {
      g.strokeStyle = 'rgba(35,16,18,0.9)'; g.lineWidth = 8; g.lineCap = 'round';
      g.beginPath(); g.moveTo(410, 722); g.quadraticCurveTo(512, 748, 614, 722); g.stroke();
    } else {
      // Mund haengt offen – viel zu lang, unregelmaessig
      g.beginPath();
      g.moveTo(412, 660); g.bezierCurveTo(460, 630, 566, 630, 614, 662);
      g.bezierCurveTo(668, 800, 626, 1000, 552, 1024); g.lineTo(472, 1024);
      g.bezierCurveTo(398, 1000, 358, 800, 412, 660); g.closePath();
      const mg = g.createLinearGradient(0, 650, 0, 1024);
      mg.addColorStop(0, '#3a070b'); mg.addColorStop(0.18, '#0a0103'); mg.addColorStop(1, '#020001');
      g.fillStyle = mg; g.fill();
      g.strokeStyle = 'rgba(80,22,26,0.9)'; g.lineWidth = 9; g.stroke();
      g.fillStyle = '#cfc6b0';
      for (const [x, w, h] of [[446, 18, 30], [474, 15, 22], [552, 16, 24], [580, 18, 32]]) { g.beginPath(); g.moveTo(x - w / 2, 652); g.lineTo(x + w / 2, 650); g.lineTo(x + 1, 650 + h); g.fill(); }
    }
    face.tex.needsUpdate = true;
  }
  drawFace('grin');
  const faceGeo = new THREE.SphereGeometry(0.1222, 40, 30, Math.PI / 2 - Math.PI * 0.32, Math.PI * 0.64, Math.PI * 0.16, Math.PI * 0.76);
  const faceMesh = add(headG, faceGeo, new THREE.MeshStandardMaterial({ map: face.tex, transparent: true, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 }), 0, 0, 0, false);
  faceMesh.scale.copy(HEAD_S);
  // Pagenmuetze
  const hat = new THREE.Group(); hat.position.set(0.0, 0.142, -0.012); hat.rotation.z = 0.2; hat.rotation.x = -0.14; headG.add(hat);
  add(hat, CY(0.07, 0.076, 0.068, 16), mJacket, 0, 0, 0);
  add(hat, CY(0.078, 0.078, 0.016, 16), mGold, 0, -0.024, 0);
  // ein paar duenne Haarstraehnen an den Schlaefen
  const mHair = M(0x0f0d0e, { side: THREE.DoubleSide });
  for (const [x, len, rz] of [[-0.085, 0.17, 0.08], [-0.078, 0.13, 0.02], [0.084, 0.16, -0.07], [0.077, 0.12, -0.02]]) {
    const st = add(headG, B(0.007, len, 0.002), mHair, x, 0.11 - len / 2, 0.035, false); st.rotation.z = rz;
  }

  function placeCreature(pose, t) {
    // pose: { root, lean, neckPts, headPos, headTilt, armPts:[[sh,el,wr,dir,grip]] }
    body.position.copy(pose.root); body.rotation.set(pose.lean, 0, 0); body.updateMatrixWorld(true);
    headG.position.copy(pose.head);
    headG.lookAt(camera.position);
    headG.rotateZ(pose.tilt);
    headG.rotateX(pose.nod || 0);
    headG.scale.set(1, pose.stretch || 1, 1);
    headG.updateMatrixWorld(true);
    // Hals endet hinten am Kopf (nicht sichtbar oben herausragend)
    const pts = pose.neck.map((p) => p.clone());
    pts.push(headG.localToWorld(V(0, 0.03, -0.075)));
    neck.geometry.dispose();
    neck.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, 0.022, 10, false);
    faceLight.intensity = pose.faceLight || 0;
    arms.forEach((a, i) => {
      const [sh, el, wr, fingerDirs] = pose.arms[i];
      between(a.upper, sh, el); between(a.fore, el, wr);
      const cuffEnd = wr.clone().lerp(el, 0.12); between(a.cuff, cuffEnd, cuffEnd.clone().lerp(el, 0.08));
      const pc = wr.clone().addScaledVector(fingerDirs.palm, 0.05);
      between(a.wrist, wr.clone().lerp(el, 0.02), pc);
      a.palm.position.copy(pc); a.palm.quaternion.setFromUnitVectors(_Y, fingerDirs.palm.clone().normalize());
      a.fingers.forEach((f, k) => {
        const base = pc.clone().addScaledVector(fingerDirs.palm, 0.045).addScaledVector(fingerDirs.side, (k - 1.5) * 0.017);
        const mid = base.clone().addScaledVector(fingerDirs.f1, 0.075 + (k === 1 || k === 2 ? 0.012 : 0));
        const tip = mid.clone().addScaledVector(fingerDirs.f2, 0.065 + (k === 1 || k === 2 ? 0.01 : 0));
        between(f[0], base, mid); between(f[1], mid, tip);
      });
    });
  }
  const farRoot = V(0.2, 0, -7.7);
  function farPose(t) {
    const sway = wob(t, 3) * 0.02;
    const nb = V(farRoot.x, 1.9, farRoot.z);
    const hd = V(farRoot.x + 0.06 + sway, 2.40, farRoot.z + 0.05);
    const hang = { palm: V(0, -1, 0.05), side: V(1, 0, 0), f1: V(0, -1, 0.08), f2: V(0, -1, 0.15) };
    return {
      root: farRoot, lean: 0.02,
      neck: [nb, V(nb.x + 0.01, 2.06, nb.z + 0.03), V(nb.x + 0.04, 2.2, nb.z + 0.04), V(hd.x, hd.y - 0.12, hd.z)],
      head: hd, tilt: 0.25 + clamp((t - P.flicker[0]) / 1.2) * 0.35, stretch: 1,
      arms: [-1, 1].map((s) => [V(farRoot.x + s * 0.205, 1.83, farRoot.z), V(farRoot.x + s * 0.25, 1.40, farRoot.z + 0.04), V(farRoot.x + s * 0.27, 0.98, farRoot.z + 0.06), hang]),
    };
  }
  function nearPose(t) {
    // Nach dem Stromausfall steht die Gestalt plotzlich direkt vor dem Aufzug (aufrecht, extrem langer Hals)
    // und starrt. Dann knickt der Kopf ruckartig zur Seite und der Mund reisst viel zu lang auf.
    const s = easeOut(clamp((t - P.snap) / 0.09));
    const rz = NEAR_Z;
    const hd = V(0.05 + wob(t * 3, 7) * 0.01, 2.3 + 0.04 * s + wob(t * 3, 9) * 0.008, rz + 0.08 + 0.1 * s);
    const hang = { palm: V(0, -1, 0.05), side: V(1, 0, 0), f1: V(0, -1, 0.1), f2: V(0, -1, 0.2) };
    return {
      root: V(0.0, 0, rz), lean: 0,
      neck: [V(0, 1.92, rz), V(0.02, 2.14 + 0.04 * s, rz + 0.04)],
      head: hd, tilt: lerp(0.4, 0.75, s) + wob(t * 6, 2) * 0.06 * s, nod: lerp(0.1, -0.12, s), stretch: lerp(1.0, 1.15, s),
      scream: t >= P.snap,
      arms: [-1, 1].map((k) => [V(k * 0.205, 1.83, rz), V(k * 0.25, 1.40, rz + 0.04), V(k * 0.27, 0.98, rz + 0.06), hang]),
      faceLight: t >= P.snap ? 2.2 : 1.6,
    };
  }

  // ================= POV-HAENDE =================
  const mSkin = M(PAL.skin, { flatShading: false, roughness: 0.8 });
  const mSleeve = M(PAL.sleeve), mCuff = M(PAL.cuff);
  // (1) Zeigehand fuer den Knopf (menschliche Hand aus hand.js)
  const point = makeHand({ side: 1, skin: PAL.skin, sleeve: PAL.sleeve, cuff: PAL.cuff });
  point.setPose(POSES.point); scene.add(point.root);

  // (2) Handy mit beiden Haenden (haengt an der Kamera)
  const phoneG = new THREE.Group(); camera.add(phoneG);
  add(phoneG, RB(0.074, 0.154, 0.0095, 0.0095), M(0x18191d, { roughness: 0.4, metalness: 0.3, flatShading: false }), 0, 0, 0);
  const scr = canvasTex(620, 1340);
  const screenMesh = add(phoneG, new THREE.PlaneGeometry(0.0685, 0.148), new THREE.MeshBasicMaterial({ map: scr.tex, transparent: true, toneMapped: false }), 0, 0, 0.0049, false);
  screenMesh.castShadow = false;
  const scrLight = new THREE.PointLight(0xa8b6ff, 0.0, 0.6, 2); scrLight.position.set(0, 0, 0.06); phoneG.add(scrLight);
  // Handy-Griff: pro Hand liegt nur der Daumen auf dem Bildschirm. Der Rest der Hand bleibt hinter dem
  // Handy und geht unten nur weich ins Handgelenk ueber. Nichts ragt durch das Gehaeuse:
  // Handy = x ±0.037, y ±0.077, z ±0.00475 (Bildschirm bei z = +0.0049).
  const PHONE_HALF_W = 0.037;
  for (const s of [1, -1]) {
    const h = makeHand({ side: s, skin: PAL.skin, sleeve: PAL.sleeve, cuff: PAL.cuff });
    h.setPose({ index: [0, 0, 0], middle: [0, 0, 0], ring: [0, 0, 0], pinky: [0, 0, 0] });
    h.parts.fingerGroups.forEach((g) => (g.visible = false)); // Finger liegen verdeckt hinter dem Handy
    h.parts.thumbGroup.visible = false;                         // Daumen wird als Bogen um die Kante gebaut
    h.parts.hypo.visible = false;                               // Kleinfingerballen wuerde unter dem Handy hervorschauen
    phoneG.add(h.root);
    // Daumenballen sitzt hinter der unteren Handyecke; Finger zeigen schraeg nach oben hinter das Handy,
    // der Unterarm kommt von unten/vorne (Richtung Kamera).
    placeHand(h, h.parts.thenar, V(s * 0.045, -0.06, -0.017), V(-s * 0.4, 1, -0.14), V(s * 0.1, 0, -1));
    const R = PHONE_HALF_W + 0.0092;                 // Abstand zur Kante (Gehaeuse + Daumenradius)
    const pts = [
      V(s * 0.041, -0.06, -0.011),                   // Ansatz am Daumenballen (hinter dem Handy)
      V(s * R, -0.054, -0.001),                      // neben der Seitenkante, Gehaeusehoehe
      V(s * (R - 0.001), -0.046, 0.0124),            // neben der Kante, vor dem Bildschirm
      V(s * 0.031, -0.035, 0.0131),                  // ueber die Kante auf den Bildschirm
      V(s * 0.0195, -0.024, 0.0125),                 // Daumenkuppe
    ];
    makeThumb(phoneG, { skin: PAL.skin, radii: [0.0088, 0.0084, 0.0078, 0.0071] }).set(pts, V(0, 0, 1));
  }
  phoneG.visible = false;

  function drawScreen(t) {
    const g = scr.ctx, w = 620, h = 1340;
    g.clearRect(0, 0, w, h);
    g.save(); g.beginPath(); g.roundRect(0, 0, w, h, 70); g.clip();
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#15183a'); bg.addColorStop(0.55, '#2d2458'); bg.addColorStop(1, '#0d0d22');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3a2c62'; g.beginPath(); g.moveTo(0, 1000); g.quadraticCurveTo(160, 900, 320, 980); g.quadraticCurveTo(470, 1050, 620, 940); g.lineTo(620, 1340); g.lineTo(0, 1340); g.fill();
    g.fillStyle = '#231b44'; g.beginPath(); g.moveTo(0, 1100); g.quadraticCurveTo(250, 1010, 400, 1090); g.quadraticCurveTo(520, 1150, 620, 1080); g.lineTo(620, 1340); g.lineTo(0, 1340); g.fill();
    g.fillStyle = '#000'; g.beginPath(); g.roundRect(w / 2 - 95, 26, 190, 54, 27); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.92)'; g.font = '600 26px Inter'; g.textAlign = 'right'; g.fillText('23 %', 575, 62);
    g.textAlign = 'center';
    g.font = '500 30px Inter'; g.fillStyle = 'rgba(255,255,255,0.82)'; g.fillText('Samstag, 28. November', w / 2, 205);
    g.font = '300 190px Inter'; g.fillStyle = 'rgba(255,255,255,0.93)'; g.fillText('3:13', w / 2, 385);
    // Benachrichtigungen
    const cards = [];
    if (t >= P.notif1) cards.push({ t0: P.notif1, from: 'Unbekannt', msg: 'Steig nicht aus.' });
    if (t >= P.notif2) cards.push({ t0: P.notif2, from: 'Unbekannt', msg: 'Es gibt keinen 13. Stock.' });
    cards.reverse(); // neueste oben
    let y = 470;
    cards.forEach((c, i) => {
      const k = easeOut((t - c.t0) / 0.25);
      const yy = y - (1 - k) * 60;
      g.globalAlpha = k;
      g.fillStyle = 'rgba(78,76,92,0.78)'; g.beginPath(); g.roundRect(28, yy, w - 56, 150, 34); g.fill();
      g.fillStyle = '#34c759'; g.beginPath(); g.roundRect(52, yy + 26, 62, 62, 15); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(83, yy + 55, 20, 16, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(70, yy + 66); g.lineTo(64, yy + 76); g.lineTo(78, yy + 68); g.fill();
      g.textAlign = 'left'; g.fillStyle = 'rgba(255,255,255,0.62)'; g.font = '600 21px Inter'; g.fillText('NACHRICHTEN', 134, yy + 46);
      g.textAlign = 'right'; g.fillText('jetzt', w - 56, yy + 46);
      g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = '600 31px Inter'; g.fillText(c.from, 134, yy + 88);
      g.font = '400 30px Inter'; g.fillText(c.msg, 134, yy + 126);
      g.globalAlpha = 1;
      y += 166;
    });
    // Taschenlampe/Kamera + Home-Balken
    for (const x of [96, w - 96]) { g.fillStyle = 'rgba(40,40,50,0.7)'; g.beginPath(); g.arc(x, 1215, 46, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.roundRect(w / 2 - 95, 1302, 190, 9, 5); g.fill();
    g.restore();
    scr.tex.needsUpdate = true;
  }

  // ================= UPDATE PRO BILD =================
  const tmp = V(0, 0, 0);
  let lastLit = null;
  function setCam(pos, look, roll = 0) {
    camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look); camera.rotateZ(roll);
  }

  function update(t) {
    // ---- Licht-Logik ----
    let cabI = 1.0;
    if (Math.abs(t - P.floor13) < 0.18) cabI = 0.35 + 0.65 * (hash(Math.floor(t * 30) * 7.3) > 0.45 ? 1 : 0);
    if (inR(t, P.flicker)) cabI = 0.75 + 0.25 * (hash(Math.floor(t * 20) * 3.1) > 0.25 ? 1 : 0);
    if (inR(t, P.blackout)) cabI = 0.0;
    if (t >= P.jump) cabI = 0.8 * (hash(Math.floor(t * 24) * 5.7) > (t >= P.snap ? 0.45 : 0.15) ? 1 : 0.25);
    cabSpot.intensity = CAB_SPOT * cabI; cabFill.intensity = CAB_FILL * cabI;
    lightPanelMat.color.setRGB(0.92 * cabI, 0.84 * cabI, 0.68 * cabI);
    hemi.intensity = inR(t, P.blackout) ? 0.03 : HEMI;

    const doorsK = easeInOut((t - P.doorsOpen[0]) / (P.doorsOpen[1] - P.doorsOpen[0]));
    doorL.position.x = -0.23 - doorsK * 0.47; doorR.position.x = 0.23 + doorsK * 0.47;
    const hallOn = doorsK > 0.001;
    hall.visible = hallOn;
    bulbs.forEach((b, i) => {
      let k = 0;
      if (hallOn) {
        k = 1;
        if (inR(t, P.flicker)) { const h = hash(Math.floor(t * (14 + i * 5)) * (2.7 + i)); k = h > 0.55 ? 1 : h > 0.3 ? 0.25 : 0.0; if (i === 1) k *= 0.8; }
        if (inR(t, P.blackout)) k = 0;
        if (t >= P.jump) k = i === 0 ? (hash(Math.floor(t * 18) * 1.9) > 0.35 ? 1.2 : 0.2) : 0.0;
      }
      b.L.intensity = b.base * k; b.spill.intensity = b.spillBase * k;
      b.bulbMat.color.setRGB(Math.min(1, 0.15 + k), Math.min(1, 0.12 + 0.84 * k), Math.min(1, 0.08 + 0.6 * k));
    });
    moon.intensity = hallOn && !inR(t, P.blackout) ? 22 : 0;
    moon.visible = hallOn; bulbs.forEach((b) => { b.L.visible = hallOn; b.spill.visible = hallOn; });

    // ---- Gestalt ----
    const showFar = hallOn && t < P.blackout[0];
    const showNear = t >= P.jump;
    const vis = showFar || showNear;
    body.visible = vis; neck.visible = vis; headG.visible = vis; arms.forEach((a) => { a.upper.visible = a.fore.visible = a.cuff.visible = a.wrist.visible = a.palm.visible = vis; a.fingers.forEach((f) => f.forEach((m) => (m.visible = vis))); });

    // ---- Knopf / Anzeige ----
    const lit = t >= P.press + 0.04 ? [12] : [];
    const litKey = lit.join(',');
    if (litKey !== lastLit) { drawPanel(lit); lastLit = litKey; }
    let floor = 10;
    if (t >= P.floor11) floor = 11; if (t >= P.floor12) floor = 12; if (t >= P.floor13) floor = 13;
    const glitch = t > P.floor13 - 0.16 && t < P.floor13 + 0.02;
    drawDisplay(floor, t, glitch);

    // ---- Kamera + Haende je nach Szene ----
    point.root.visible = false; phoneG.visible = false; scrLight.intensity = 0;
    let fov = 66;
    const moving = t > P.moveStart && t < P.stop;
    const vib = moving ? Math.sin(t * 61) * 0.0012 + Math.sin(t * 37) * 0.0008 : 0;
    const jolt = t > P.stop && t < P.stop + 0.45 ? Math.sin((t - P.stop) * 28) * 0.012 * Math.exp(-(t - P.stop) * 8) : 0;

    if (t < P.shotA[1]) {
      // Szene A: Blick aufs Bedienfeld, Hand drueckt 12
      const tt = t - P.shotA[0];
      setCam(V(0.12 + wob(t, 1) * 0.008, 1.6 + wob(t, 2) * 0.006 + vib, 0.08 - tt * 0.02), V(0.78, 1.28, -0.52), wob(t, 5) * 0.01);
      point.root.visible = t < 1.75;
      const start = V(0.62, 0.92, 0.02);
      const target = BTN12.clone().add(V(-0.004, 0, 0));
      let pos;
      if (t < P.press) pos = start.clone().lerp(target, easeInOut((t - 0.12) / (P.press - 0.12)));
      else if (t < P.press + 0.3) pos = target.clone().add(V(t < P.press + 0.1 ? 0.004 : 0, 0, 0));
      else pos = target.clone().lerp(start, easeInOut((t - P.press - 0.3) / 0.6));
      const shoulder = camera.position.clone().add(V(0.12, -0.42, 0.22));
      tmp.subVectors(pos, shoulder).normalize();
      placeHand(point, point.fingers.index.tip, pos, tmp, V(-0.5, 1, 0.2));
    } else if (t < P.shotB[1]) {
      // Szene B: Stockwerksanzeige
      const tt = (t - P.shotB[0]) / (P.shotB[1] - P.shotB[0]);
      setCam(V(0.0 + wob(t, 3) * 0.006, 1.64 + vib + jolt, lerp(0.14, -0.06, easeInOut(tt))), V(0.0, 2.08 + jolt * 0.5, -0.68), wob(t, 6) * 0.012);
    } else if (t < P.shotC[1]) {
      // Szene C: Handy in beiden Haenden
      const tt = t - P.shotC[0];
      setCam(V(0.0, 1.55 + wob(t, 4) * 0.005, 0.2), V(0.0, 0.62, -0.72), wob(t, 8) * 0.008);
      phoneG.visible = true; scrLight.intensity = 0.02;
      let bz = 0;
      if (t > P.buzz1 && t < P.buzz1 + 0.5 && ((t - P.buzz1) < 0.2 || (t - P.buzz1) > 0.3)) bz = 1;
      if (t > P.buzz2 && t < P.buzz2 + 0.22) bz = 1;
      phoneG.position.set(Math.sin(t * 190) * 0.0018 * bz + wob(t, 11) * 0.002, 0.006 + Math.cos(t * 170) * 0.0012 * bz + wob(t, 12) * 0.002, lerp(-0.25, -0.225, easeInOut(tt / 2.4)));
      phoneG.rotation.set(-0.06, 0, 0.035 + Math.sin(t * 150) * 0.01 * bz);
      drawScreen(t);
    } else {
      // Szene D: Tueren, Flur, Gestalt
      const tt = t - P.shotD[0];
      let pos = V(wob(t, 13) * 0.01, 1.56 + wob(t, 14) * 0.006, lerp(0.48, 0.40, easeInOut(tt / 2.2)));
      let look = V(0.02, 1.5, -6.0);
      let roll = wob(t, 15) * 0.01;
      if (t >= P.jump) {
        const j = t - P.jump, sj = Math.max(0, t - P.snap);
        const amp = 0.03 * Math.exp(-j * 5) + (sj > 0 ? 0.022 : 0) + 0.003;
        pos = pos.add(V(noise(t * 40) * amp * 0.5, noise(t * 37 + 3) * amp * 0.5, 0.05 * easeOut(j / 0.2)));
        look = V(0.05 + noise(t * 33) * amp * 2, lerp(1.9, 2.08, easeOut(j / 0.3)) + noise(t * 29 + 9) * amp * 2, NEAR_Z + 0.1);
        roll = noise(t * 25) * amp * 1.2;
        fov = lerp(66, 50, easeOut(j / 0.25)) - (sj > 0 ? 10 * easeOut(sj / 0.12) : 0); // Schock-Zoom
      }
      setCam(pos, look, roll);
    }

    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    const pose = vis ? (showNear ? nearPose(t) : farPose(t)) : null;
    if (pose) placeCreature(pose, t);
    else faceLight.intensity = 0;
    drawFaceOnce(pose && pose.scream ? 'scream' : 'grin');
    renderer.render(scene, camera);
  }
  let faceMode = 'grin';
  function drawFaceOnce(m) { if (m !== faceMode) { drawFace(m); faceMode = m; } }

  return { update };
}
