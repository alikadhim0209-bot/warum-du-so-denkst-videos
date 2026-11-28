/* =====================================================================================
   DIE MITTAGSFRAU – vollständige Beispiel-Story (32 Einstellungen) = Vorlage für neue Videos.
   Jede Einstellung hat eine id = Marker [#id] in script.txt. Zeiten kommen aus timing.json.
   Aufbau: Helfer (Monster, Kulissen) oben → HE.story({...}) mit Titelkarte und shots.
   ===================================================================================== */

// ---------------------------------------------------------------- 1) Das Monster (einmal definieren)
const MF = {
  skin: ['#f4f0e4', '#dcd4c0', '#b6ac94', '#8e846e', '#6e6552'],   // sonnengebleicht
  eyes: 'wide', iris: '#c99a34', bloodshot: 1, bags: 1, wrinkles: 0.55,
  mouth: 'grin', open: 0.5,
  hair: { style: 'part', color: '#e4d6a4', len: 250 },
  outfit: 'dress', dressColor: '#efebe0',
};
const mf = (c, o) => HE.mon.figure(c, Object.assign({}, MF, o));          // ganze Figur
const mfBust = (c, o) => HE.mon.bust(c, Object.assign({}, MF, o));        // Büste / Nahaufnahme

// Figuren (Hauptfigur = HE.kid; Nebenfiguren mit HE.person)
const JONAS = { kind: 'kid', skin: '#f1e3d3', hair: 'short', hairColor: '#7a4a2a', top: '#3f7a4a', bottom: '#2a3040' };
const OMA = { kind: 'elder', hair: 'bun', hairColor: '#cfcfcf', top: '#7a5a6a', skirt: '#4a3a3a', skin: '#f0dccb', wrinkles: true };
const OPA = { kind: 'elder', hair: 'bald', hairColor: '#cfcfcf', glasses: true, top: '#5a6a4a', skin: '#f0dccb' };

// ---------------------------------------------------------------- 2) Kulissen-Bausteine
const SKY_NOON = { top: '#9fbccb', bottom: '#f2e7c6' };
const noonSky = (c, sun = [545, 150]) => HE.sc.sky(c, SKY_NOON) + HE.fx.sun({ x: sun[0], y: sun[1], r: 40 }) + HE.sc.clouds(c, { cnt: 2, y: 110, h: 120, color: '#f7f1e2', seed: 'cl' });
// weites Feld: Horizont y, Kirche links in der Ferne
const fieldWide = (c, o = {}) =>
  c.L(0, noonSky(c, o.sun)) +
  c.L(0.3, HE.sc.hills({ y: o.y || 640, h: 26, color: '#7d9566', cnt: 5, seed: 'h' }) + HE.sc.roundTree({ x: 590, y: (o.y || 640) + 10, h: 90, color: '#5f7a4c' }) +
    (o.church === false ? '' : HE.sc.church({ x: 120, y: (o.y || 640) + 20, s: 0.6 })) + HE.sc.crows(c, { y: 220, h: 90, cnt: 3, size: 11 })) +
  c.L(0.55, HE.sc.wheat(c, { y: (o.y || 640) + 10, far: true, seed: 'w1' }));
const wheatFront = (c, y = 980, depth = 1.15, scale = 1.2) => c.L(depth, HE.sc.wheat(c, { y, seed: 'wf' + y, scale }));
// Bauernhof (Tag)
const farmyard = (c, mood = 'day') =>
  c.L(0, HE.sc.sky(c, { preset: mood === 'dusk' ? 'dusk' : 'day', clouds: { cnt: 3 } })) +
  c.L(0.3, HE.sc.hills({ y: 700, h: 30, color: HE.tone('#7d9566', mood), cnt: 4 }) + HE.sc.wheat(c, { y: 705, far: true, mood })) +
  c.L(1, HE.sc.ground(c, { y: 900, color: '#9c8a64', tufts: 14, mood }) +
    HE.sc.house({ x: 470, y: 900, w: 330, h: 170, style: 'gable', roof: '#9a3f30', wall: '#e8dfc8', mood, chimney: true }) +
    HE.sc.roundTree({ x: 140, y: 905, h: 300, color: '#4f7a44', mood }) + HE.sc.bush({ x: 690, y: 905, w: 110, mood }));
// Küche am Abend (warmes Licht)
const kitchen = (c) =>
  c.L(1, HE.sc.room({ floorY: 960, wall: '#6a5a44', wainscot: '#5a3e2a', floor: '#4a3828', mood: 'dusk' }) +
    HE.sc.window({ x: 470, y: 380, w: 150, h: 170, mood: 'night' }) + HE.sc.clock({ x: 150, y: 330, time: 7.5, mood: 'dusk' }) +
    HE.sc.picture({ x: 290, y: 330, mood: 'dusk' }) + HE.sc.calendar({ x: 640, y: 340, mood: 'dusk' }) +
    HE.sc.bulb(c, { x: 360, y: 250, len: 250, color: '#ffd08a', r: 320 }) + HE.sc.table({ x: 360, y: 1010, w: 380, h: 90, mood: 'dusk' }));
// Kirchturm mit schwingender Glocke (Nahaufnahme)
const bellTower = (c, swing) => {
  const a = Math.sin(c.T * 4.2) * 18 * swing;
  return c.L(0, HE.sc.sky(c, SKY_NOON) + HE.fx.sun({ x: 600, y: 160, r: 36 })) +
    c.L(1, `<rect x="180" y="260" width="360" height="1100" fill="#e9e3d4"/><rect x="180" y="260" width="40" height="1100" fill="#cfc7b4"/>` +
      `<polygon points="160,262 360,40 560,262" fill="#8a4a3a"/><rect x="250" y="330" width="220" height="300" rx="110" fill="#2a2420"/>` +
      `<g transform="rotate(${HE.n(a)} 360 360)"><rect x="352" y="340" width="16" height="30" fill="#4a3a2a"/>` +
      `<path d="M300 520 Q300 380 360 372 Q420 380 420 520 L440 560 L280 560 Z" fill="${HE.lg([[0, '#c9a24a'], [1, '#7a5a20']], 0, 0, 1, 0)}"/>` +
      `<circle cx="360" cy="572" r="14" fill="#5a4214"/></g>` + HE.sc.clock({ x: 360, y: 760, r: 64, time: 12.0 }));
};

// ---------------------------------------------------------------- 3) Story
HE.story({
  lang: 'de',
  palette: { bg: '#2b2312', accent: '#f2c94c', title: '#d9d2c2' },
  title: {
    name: 'Mittagsfrau',
    sub: 'Lausitz · Deutschland',
    threat: 18,
    lines: ['Erscheint, wenn die Mittagsglocke schlägt', 'Wer ihre Frage nicht beantwortet, stirbt'],
    portrait: (c) =>
      `<rect width="500" height="500" fill="${HE.lg([[0, '#b7ccd2'], [0.6, '#efe3bd'], [1, '#e9d494']])}"/>` +
      HE.fx.sun({ x: 250, y: 150, r: 34 }) + HE.sc.wheat(c, { y: 330, far: true, seed: 'p1', color: '#cfa84e', color2: '#b08436' }) +
      HE.mon.sickle({ x: 360, y: 420, angle: -34, s: 1.55 }) +
      mfBust(c, { cx: 250, cy: 245, size: 175, glow: '#fff4c8', sparkleCnt: 12 }) +
      HE.mon.hand({ x: 372, y: 430, angle: -40, s: 0.85, spread: 0.45, curl: 0.6, mirror: true, color: MF.skin[0], shade: MF.skin[2], line: MF.skin[3] }) +
      HE.sc.wheat(c, { y: 455, seed: 'p2', scale: 0.8, color: '#d9b45c', color2: '#9a6e2a' }),
  },
  shots: [
    // ======================= 1 HOOK
    { id: 'hook', cam: { from: { z: 1.0 }, to: { x: 420, y: 620, z: 1.08 } },
      draw: (c) => { const k = HE.walk(c, [170, 965], [300, 965], 0, c.d, { stride: 40 });
        return fieldWide(c) + c.L(0.7, mf(c, { x: 585, y: 860, h: 300, look: [-0.4, 0] })) + c.L(0.75, HE.sc.wheat(c, { y: 770, seed: 'w2', scale: 0.7 })) +
          c.L(1, HE.kid({ x: k.x, y: k.y, s: 0.62, pose: 'walk', phase: k.phase, look: 0.4 })) + wheatFront(c, 905); } },
    { id: 'hook2', cam: { from: { z: 1.0 }, to: { y: 600, z: 1.05 } }, draw: (c) => bellTower(c, c.after('hook2', 0.1) * (1 - c.p * 0.3)) },
    { id: 'hook3', cam: (c) => ({ x: 380, y: 520, z: 1.05 + 0.25 * c.after('turn', 1.0, 'inOut') }),
      draw: (c) => fieldWide(c, { church: false }) + c.L(1, mf(c, { x: 380, y: 1260, h: 1060, hold: 'sickle', headTilt: -10 * c.after('turn', 0.8), look: [0, 0.3] })) + wheatFront(c, 1010, 1.2, 1.4) + c.S(HE.fx.vignette(0.35, '#2a1a08')) },
    // ======================= 2 TITELKARTE
    { id: 'title', type: 'title' },
    // ======================= 3 SETUP
    { id: 'farm', draw: (c) => { const k = HE.walk(c, [-60, 1000], [250, 1000], 0, c.d * 0.7);
      return farmyard(c) + c.L(1, HE.person(Object.assign({}, OMA, { x: 560, y: 990, expr: 'smile', facing: -1 })) + HE.kid({ x: k.x, y: k.y, pose: k.moving ? 'walk' : 'stand', phase: k.phase, look: 0.5 })); } },
    { id: 'farm2', cam: { from: { x: 300, z: 1.0 }, to: { x: 420, z: 1.0 } }, draw: (c) => fieldWide(c, { y: 700 }) + c.L(1, HE.sc.ground(c, { y: 1150, color: '#9c8a64' })) },
    { id: 'jonas', draw: (c) => farmyard(c) + c.L(1, HE.kid({ x: 260, y: 1010, look: 1, expr: 'smile' }) + HE.person(Object.assign({}, JONAS, { x: 400, y: 1010, facing: -1, expr: 'smile', pose: 'point' }))) },
    // ======================= 4 DIE LEGENDE (Oma erzählt → Scherenschnitt-Segment)
    { id: 'kitchen', draw: (c) => kitchen(c) + c.L(1, HE.person(Object.assign({}, OMA, { x: 230, y: 1060, expr: 'worried', mood: 'dusk' })) +
      HE.kid({ x: 420, y: 1080, mood: 'dusk', look: -1 }) + HE.person(Object.assign({}, JONAS, { x: 540, y: 1080, mood: 'dusk', facing: -1 })) + HE.sc.table({ x: 360, y: 1130, w: 520, h: 60, mood: 'dusk' })) },
    { id: 'leg1', legend: { type: 'papercut', title: 'DIE MITTAGSFRAU' }, cam: { from: { z: 1.0 }, to: { z: 1.08 } },
      draw: (c) => HE.legend.sil(HE.sc.wheat(c, { y: 900, far: true }) + mf(c, { x: 400, y: 920, h: 660, hold: 'sickle' }), 'papercut') + HE.legend.marker(1, 560, 330, { opacity: c.after(0.8, 0.4) }) },
    { id: 'leg2', legend: { type: 'papercut', title: 'DIE MITTAGSFRAU' },
      draw: (c) => `<circle cx="360" cy="${HE.n(560 - 120 * HE.E('out', c.p))}" r="90" fill="#141210"/>` + HE.legend.sil(HE.sc.wheat(c, { y: 860, far: true }), 'papercut') +
        HE.text('12 – 13 UHR', 360, 1000, { font: HE.FONT.black, weight: 900, size: 54, fill: '#141210', opacity: c.after(0.5, 0.5) }) },
    { id: 'leg3', legend: { type: 'papercut', title: 'DIE MITTAGSFRAU' },
      draw: (c) => HE.legend.sil(HE.sc.wheat(c, { y: 900, far: true }) + HE.person({ kind: 'adult', x: 230, y: 920, s: 1.3, pose: 'stand', hair: 'hat' }) + mf(c, { x: 470, y: 920, h: 620, pose: 'bend' }), 'papercut') +
        HE.text('?', 330, 470, { font: HE.FONT.black, weight: 900, size: 90, fill: '#141210', opacity: c.after(1.0, 0.3) }) },
    { id: 'leg4', legend: { type: 'papercut', title: 'FLACHS' },
      draw: (c) => [['SÄEN', 200], ['ERNTEN', 360], ['SPINNEN', 520]].map(([t, x], i) => { const a = c.after(i * (c.d / 3.2), 0.4);
        return `<g opacity="${HE.n(a)}">` + HE.legend.marker(i + 1, x, 460) + HE.legend.sil(HE.person({ kind: 'adult', x, y: 760, s: 0.9, pose: i === 2 ? 'hold' : 'reach' }), 'papercut') + HE.text(t, x, 820, { font: HE.FONT.black, weight: 900, size: 30, fill: '#141210' }) + `</g>`; }).join('') },
    { id: 'leg5', legend: { type: 'papercut', title: 'EINE STUNDE' },
      draw: (c) => { const ang = -90 + 360 * c.p; return `<circle cx="360" cy="580" r="190" fill="none" stroke="#141210" stroke-width="14"/>` +
        `<line x1="360" y1="580" x2="${HE.n(360 + Math.cos(ang * Math.PI / 180) * 160)}" y2="${HE.n(580 + Math.sin(ang * Math.PI / 180) * 160)}" stroke="#141210" stroke-width="10" stroke-linecap="round"/>` +
        HE.legend.sil(HE.person({ kind: 'kid', x: 360, y: 980, s: 0.9, pose: 'point' }), 'papercut'); } },
    { id: 'leg6', legend: { type: 'papercut', title: 'DIE MITTAGSFRAU' }, shakes: [{ atFrac: 0.62, amp: 10, dur: 0.4 }],
      draw: (c) => { const sw = c.after(c.d * 0.55, 0.25, 'in');
        return HE.legend.sil(HE.sc.wheat(c, { y: 900, far: true }) + HE.person({ kind: 'adult', x: 230, y: 920, s: 1.3, expr: 'scared' }) +
          `<g transform="rotate(${HE.n(-60 + 140 * sw)} 470 520)">` + HE.mon.sickle({ x: 470, y: 520, angle: 0, s: 2.0 }) + `</g>` + mf(c, { x: 470, y: 920, h: 620 }), 'papercut'); } },
    // ======================= 5 REGELBRUCH
    { id: 'laugh', draw: (c) => kitchen(c) + c.L(1, HE.kid({ x: 300, y: 1080, mood: 'dusk', expr: 'smile' }) + HE.person(Object.assign({}, JONAS, { x: 450, y: 1080, mood: 'dusk', facing: -1, expr: 'smile' }))) },
    { id: 'harvest', cam: { from: { z: 1.0 }, to: { z: 1.06 } }, draw: (c) => fieldWide(c, { y: 680 }) +
      c.L(1, HE.person(Object.assign({}, OPA, { x: 200, y: 1020, pose: 'reach' })) + HE.kid({ x: 380, y: 1040, pose: 'hold', expr: 'worried', sweat: true }) +
        HE.person(Object.assign({}, JONAS, { x: 520, y: 1040, facing: -1 }))) + wheatFront(c, 1000) },
    { id: 'lunch', draw: (c) => { const j = HE.walk(c, [420, 1040], [760, 1000], c.d * 0.45, c.d, { stride: 50 });
      return farmyard(c) + c.L(1, HE.person(Object.assign({}, OPA, { x: 560, y: 1000, pose: 'point', facing: -1, expr: 'smile' })) +
        HE.kid({ x: 300, y: 1040, look: 1 }) + HE.person(Object.assign({}, JONAS, { x: j.x, y: j.y, pose: j.moving ? 'run' : 'stand', phase: j.phase, facing: 1 }))); } },
    { id: 'bell', draw: (c) => bellTower(c, c.after('bell', 0.05)) },
    // ======================= 6 BEGEGNUNG
    { id: 'woman', cam: { from: { z: 1.0 }, to: { x: 520, y: 620, z: 1.12 } }, draw: (c) => fieldWide(c, { church: false }) +
      c.L(0.7, mf(c, { x: 600, y: 860, h: 320 })) + c.L(1, HE.kid({ x: 160, y: 1080, back: true, s: 1.1 })) + wheatFront(c, 1010) },
    { id: 'woman2', cam: { from: { z: 1.0 }, to: { y: 560, z: 1.1 } }, draw: (c) => fieldWide(c, { church: false }) + c.L(1, mf(c, { x: 360, y: 1300, h: 1100, look: [0, 0.2] })) + wheatFront(c, 1050, 1.2, 1.4) },
    { id: 'close', trans: 'cut', shakes: [{ atFrac: 0.45, amp: 16, dur: 0.5 }],
      draw: (c) => { const pop = c.t > c.d * 0.45 ? 1 : 0;
        return fieldWide(c, { church: false }) + c.L(1, HE.person(Object.assign({}, JONAS, { x: 250, y: 1060, expr: pop ? 'shock' : 'neutral', look: 1 })) +
          (pop ? mf(c, { x: 470, y: 1200, h: 900, look: [-0.6, 0.3] }) : '')) + wheatFront(c, 1030); } },
    { id: 'face', cam: { from: { z: 1.0 }, to: { z: 1.12 } }, draw: (c) => c.L(0, `<rect x="-300" y="-300" width="1320" height="1880" fill="${HE.rg([[0, '#f3e4b8'], [1, '#9a7a3a']], 0.5, 0.35, 0.8)}"/>`) +
      c.L(1, mfBust(c, { cx: 360, cy: 560, size: 300, glow: '#fff1c0', look: [0, 0.1], blink: true })) },
    { id: 'ask', draw: (c) => fieldWide(c, { church: false }) + c.L(1, HE.person(Object.assign({}, JONAS, { x: 230, y: 1080, expr: 'scared' })) +
      mf(c, { x: 470, y: 1220, h: 1000, pose: 'bend', look: [-0.6, 0.5], open: 0.2 + 0.4 * c.after('ask', 0.4) })) + wheatFront(c, 1040) },
    // ======================= 7 ÜBERLEBEN
    { id: 'silent', draw: (c) => fieldWide(c, { church: false }) + c.L(1, HE.person(Object.assign({}, JONAS, { x: 230 + Math.sin(c.T * 40) * 1.5, y: 1080, expr: 'scared', sweat: true })) +
      mf(c, { x: 480, y: 1220, h: 1000, look: [-0.6, 0.4], hold: 'sickle' })) + wheatFront(c, 1040) },
    { id: 'talk', draw: (c) => fieldWide(c, { church: false }) + c.L(1, HE.kid({ x: 200, y: 1080, pose: 'point', expr: 'determined' }) + HE.person(Object.assign({}, JONAS, { x: 330, y: 1080, expr: 'scared' })) +
      mf(c, { x: 540, y: 1220, h: 980, look: [-0.8, 0.3] })) + wheatFront(c, 1040) },
    { id: 'talk2', draw: (c) => HE.ins.notebook(c, { lines: [{ text: '1. SÄEN' }, { text: '2. RÖSTEN' }, { text: '3. SPINNEN' }, { text: '… UND VON VORN', color: '#b03a3a' }], start: 0.2, cps: 14 }) },
    { id: 'listen', draw: (c) => bellTower(c, 0) },
    { id: 'one', draw: (c) => fieldWide(c, { church: false }) + c.L(1, HE.kid({ x: 230, y: 1080, expr: 'shock' }) + HE.person(Object.assign({}, JONAS, { x: 340, y: 1080, expr: 'scared' })) +
      mf(c, { x: 540, y: 1220, h: 980, opacity: 1 - c.after('gone', 0.5) })) + wheatFront(c, 1040) },
    // ======================= 8 TWIST
    { id: 'after', draw: (c) => c.L(1, HE.sc.room({ floorY: 960, wall: '#9aa6a8', wainscot: '#7a8a8c', floor: '#6a6a66' }) + HE.sc.window({ x: 430, y: 360, w: 180, h: 200 }) +
      HE.sc.bed({ x: 330, y: 1040, w: 380, blanket: '#cfd8dc' }) + HE.person(Object.assign({}, JONAS, { x: 260, y: 1010, pose: 'sit', expr: 'neutral' })) +
      HE.person({ kind: 'adult', x: 560, y: 1060, top: '#eef2f4', hair: 'short', glasses: true, facing: -1, expr: 'worried' })) },
    { id: 'phone', draw: (c) => HE.ins.phone(c, { name: 'Oma' }) },
    { id: 'window', cam: { from: { z: 1.0 }, to: { x: 430, y: 520, z: 1.15 } }, draw: (c) => c.L(1, HE.sc.room({ floorY: 1000, wall: '#5a5a62', wainscotH: 0, floor: '#3a3a40', mood: 'dusk' }) +
      HE.sc.window({ x: 300, y: 330, w: 300, h: 330, glass: '#cfc39a', mood: 'day' }) + HE.person(Object.assign({}, JONAS, { x: 300, y: 1060, s: 1.3, back: true, mood: 'dusk' }))) },
    { id: 'end', cam: { from: { z: 1.0 }, to: { z: 1.18 } }, draw: (c) => fieldWide(c, { church: false, y: 700 }) + c.L(0.75, mf(c, { x: 360, y: 900, h: 380, look: [0, 0.2] })) +
      c.L(1.1, `<path d="M-200 -200 H920 V1480 H-200 Z M70 170 H650 V1090 H70 Z" fill="#202024" fill-rule="evenodd"/><rect x="352" y="170" width="16" height="920" fill="#202024"/><rect x="70" y="620" width="580" height="16" fill="#202024"/>`) + c.S(HE.fx.vignette(0.55)) },
  ],
});
