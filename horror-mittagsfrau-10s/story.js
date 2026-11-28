/* Mittagsfrau – 10-Sekunden-Demo. Shot-IDs entsprechen den [#…]-Markern in script.txt. */

// ---- das Monster (einmal definieren, überall gleich verwenden)
const MF = {
  skin: ['#f4f0e4', '#dcd4c0', '#b6ac94', '#8e846e', '#6e6552'],   // sonnengebleicht
  eyes: 'wide', iris: '#c99a34', bloodshot: 1, bags: 1, wrinkles: 0.55,
  mouth: 'grin', open: 0.5,
  hair: { style: 'part', color: '#e4d6a4', len: 250 },
  outfit: 'dress', dressColor: '#efebe0',
};

// ---- Kulissen-Bausteine
const noonSky = (c) =>
  HE.sc.sky(c, { top: '#9fbccb', bottom: '#f2e7c6' }) +
  HE.fx.sun({ x: 545, y: 150, r: 40 }) +
  HE.sc.clouds(c, { cnt: 2, y: 120, h: 120, color: '#f7f1e2', seed: 'mfcl' });

HE.story({
  lang: 'de',
  endFade: 0.5,            // kurzer Clip: nur kurze Abblende am Ende
  palette: { bg: '#2b2312', accent: '#f2c94c', title: '#d9d2c2' },
  title: {
    name: 'Mittagsfrau',
    sub: 'Lausitz · Deutschland',
    threat: 18,
    lines: ['Erscheint, wenn die Mittagsglocke schlägt', 'Wer ihre Frage nicht beantwortet, stirbt'],
    portrait: (c) => {
      let s = `<rect width="500" height="500" fill="${HE.lg([[0, '#b7ccd2'], [0.6, '#efe3bd'], [1, '#e9d494']])}"/>`;
      s += HE.fx.sun({ x: 250, y: 150, r: 34 });
      s += HE.sc.wheat(c, { y: 330, h: 200, far: true, seed: 'p1', color: '#cfa84e', color2: '#b08436' });
      s += HE.mon.sickle({ x: 360, y: 420, angle: -34, s: 1.55 });
      s += HE.mon.bust(c, Object.assign({}, MF, { cx: 250, cy: 245, size: 175, glow: '#fff4c8', sparkleCnt: 12 }));
      s += HE.mon.hand({ x: 372, y: 430, angle: -40, s: 0.85, spread: 0.45, curl: 0.6, mirror: true, color: MF.skin[0], shade: MF.skin[2], line: MF.skin[3] });
      s += HE.sc.wheat(c, { y: 455, h: 60, seed: 'p2', scale: 0.8, color: '#d9b45c', color2: '#9a6e2a' });
      return s;
    },
  },
  shots: [
    // 1) Totale: Kornfeld zur Mittagszeit, Kirche, das Kind – weit hinten steht etwas Weißes im Korn
    {
      id: 'hook',
      cam: { from: { x: 360, y: 640, z: 1.0 }, to: { x: 420, y: 620, z: 1.08 } },
      draw: (c) => {
        const kid = HE.walk(c, [170, 965], [300, 965], 0, c.d, { stride: 40 });
        return c.L(0, noonSky(c)) +
          c.L(0.3, HE.sc.hills({ y: 640, h: 26, color: '#7d9566', cnt: 5, seed: 'mfh' }) + HE.sc.roundTree({ x: 560, y: 650, h: 90, color: '#5f7a4c' }) + HE.sc.roundTree({ x: 610, y: 652, h: 70, color: '#58734a' }) +
            HE.sc.church({ x: 130, y: 660, s: 0.62 }) + HE.sc.crows(c, { y: 230, h: 90, cnt: 3, size: 11 })) +
          c.L(0.55, HE.sc.wheat(c, { y: 650, far: true, seed: 'w1' })) +
          c.L(0.7, HE.mon.figure(c, Object.assign({}, MF, { x: 585, y: 860, h: 300, look: [-0.4, 0] }))) +
          c.L(0.75, HE.sc.wheat(c, { y: 770, seed: 'w2', scale: 0.7 })) +
          c.L(1, HE.kid({ x: kid.x, y: kid.y, s: 0.62, pose: 'walk', phase: kid.phase, facing: 1, look: 0.4 })) +
          c.L(1.15, HE.sc.wheat(c, { y: 905, seed: 'w3', scale: 1.15 }));
      },
    },
    // 2) Die Mittagsfrau, ganzer Körper im Korn – auf „Feld“ neigt sie den Kopf und schaut uns an
    {
      id: 'body',
      cam: (c) => {
        const k = HE.E('inOut', c.p), push = c.after('look', 1.2, 'inOut');
        return { x: 370 + 10 * push, y: HE.lerp(660, 560, k) - 90 * push, z: HE.lerp(1.0, 1.06, k) + 0.24 * push };
      },
      draw: (c) => {
        const tilt = -11 * c.after('look', 0.8, 'out');
        const look = [0, 0.1 + 0.2 * c.after('look', 0.5)];
        return c.L(0, noonSky(c)) +
          c.L(0.35, HE.sc.hills({ y: 760, h: 30, color: '#7d9566', cnt: 4, seed: 'mfh2' }) + HE.sc.crows(c, { y: 260, h: 80, cnt: 2, size: 14, seed: 'cr2' })) +
          c.L(0.5, HE.sc.wheat(c, { y: 770, far: true, seed: 'w4' })) +
          c.L(1, HE.mon.figure(c, Object.assign({}, MF, { x: 380, y: 1260, h: 1060, hold: 'sickle', headSize: 66, headTilt: tilt, look }))) +
          c.L(1.2, HE.sc.wheat(c, { y: 1010, seed: 'w5', scale: 1.4 })) +
          c.S(HE.fx.vignette(0.35, '#2a1a08'));
      },
    },
    // 3) Titelkarte („Monster-Akte“) – erscheint mit dem Satz, der den Namen nennt
    { id: 'title', type: 'title' },
  ],
});
