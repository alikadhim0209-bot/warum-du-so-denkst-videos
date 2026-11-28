/* =====================================================================================
   HE · legend – das „DIE LEGENDE“-Segment im traditionellen Kunststil der jeweiligen Kultur.
   Verwendung im Shot:   legend: 'shadow'   oder   legend: { type: 'ink', seal: '鬼', vtext: '雪の夜' }
   Stile:
     shadow     javanisches/asiatisches Schattenspiel (warm hinterleuchtetes Tuch, Holzbalken, Silhouetten)
     woodblock  japanischer Holzschnitt (Druck im Doppelrahmen auf Papier, Kartusche, roter Stempel)
     ink        Tusche-Minimalismus (helles Papier, goldene Wolkenbänder, roter Stempel, vertikaler Text)
     papercut   Scherenschnitt (Pergament, ornamentaler schwarzer Rahmen) – für deutsche/europäische Sagen
     chronicle  alte Chronik/Holzschnitt-Buchseite (vergilbtes Papier, Doppellinien, Initiale)
   Inhalt (shot.draw) zeichnet die Motive: bei shadow/papercut als Silhouetten (HE.person({mono:HE.legend.INK.shadow}))
   Bild-Bereiche:  woodblock: x 75–645, y 216–990   ink/papercut/chronicle: ganzes Bild, Motive zwischen y 230 und 960
   ===================================================================================== */
(function () {
  const HE = window.HE;
  const n = HE.n;
  const L = (HE.legend = {});
  L.INK = { shadow: '#1c130c', papercut: '#141210', chronicle: '#3a2a1a', ink: '#24201c', woodblock: '#2e2a26' };

  // Etikett „DIE LEGENDE“ oben links (Bildschirm-Ebene, nicht von der Kamera bewegt)
  L.tag = function (txt) {
    txt = txt || HE.T('legend');
    const w = HE.measure(txt, 15, HE.FONT.mono) + 28;
    return `<rect x="46" y="151" width="${n(w)}" height="32" rx="5" fill="#26221d" opacity="0.92"/>` +
      HE.text(txt, 60, 172, { font: HE.FONT.mono, size: 15, fill: '#e9e0cc', anchor: 'start' });
  };

  // nummerierter Marker ①
  L.marker = function (num, x, y, o = {}) {
    const a = o.opacity == null ? 1 : o.opacity;
    return `<g opacity="${n(a)}"><circle cx="${n(x)}" cy="${n(y)}" r="13" fill="${o.fill || '#2a2018'}" stroke="${o.stroke || '#c9a052'}" stroke-width="2"/>` +
      HE.text(String(num), x, y + 5, { font: HE.FONT.mono, size: 14, fill: o.color || '#f0d47e' }) + `</g>`;
  };

  // Perforations-Muster für Schattenpuppen (Punkte im Silhouetten-Innern, wie Wayang)
  L.perf = function () {
    const id = 'perf';
    HE.defs.add(id, `<pattern id="${id}" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="1.1" fill="#f6d9a0" opacity="0.55"/></pattern>`);
    return `url(#${id})`;
  };

  L.frame = function (c, style, body) {
    const o = typeof style === 'string' ? { type: style } : style;
    const type = o.type || 'shadow';
    let bg = '', fg = '';
    if (type === 'shadow') {
      const flick = 0.96 + 0.04 * HE.noise(c.T * 2.5, 7);
      bg += `<rect width="720" height="1280" fill="#2a1a10"/>`;
      bg += `<rect x="0" y="70" width="720" height="930" fill="${HE.rg([[0, '#fff3d6'], [0.35, '#f6d9a2'], [0.7, '#d9a25c'], [1, '#8a5626']], 0.5, 0.42, 0.72)}" opacity="${n(flick)}"/>`;
      bg += `<rect x="0" y="70" width="720" height="930" fill="${HE.grainPattern(0.07, 2.5, 41, '#7a4a20')}"/>`;
      fg += `<rect x="0" y="0" width="720" height="74" fill="#2c1c12"/><rect x="0" y="66" width="720" height="8" fill="#1d120b"/>`;
      for (let x = 16; x < 720; x += 24) fg += `<circle cx="${x}" cy="54" r="2" fill="#7a5a3a"/>`;
      fg += `<rect x="0" y="996" width="720" height="40" fill="#6b8a46"/><rect x="0" y="996" width="720" height="5" fill="#86a65a"/>`;
      for (let x = 0; x < 720; x += 14) fg += `<line x1="${x}" y1="1003" x2="${x + 7}" y2="1034" stroke="#57733a" stroke-width="2"/>`;
      fg += `<rect x="0" y="1036" width="720" height="250" fill="#24160d"/>`;
      fg += HE.fx.vignette(0.45, '#1a0d05');
    } else if (type === 'woodblock') {
      bg += `<rect width="720" height="1280" fill="#ebe3cf"/><rect width="720" height="1280" fill="${HE.grainPattern(0.06, 2.4, 51, '#6a5a40')}"/>`;
      bg += HE.fx.vignette(0.28, '#5a4a30');
      const id = 'wbclip';
      HE.defs.add(id, `<clipPath id="${id}"><rect x="75" y="216" width="570" height="774"/></clipPath>`);
      bg += `<rect x="75" y="216" width="570" height="774" fill="${o.paper || '#efe6cf'}"/>`;
      body = `<g clip-path="url(#${id})">${body}<rect x="75" y="216" width="570" height="774" fill="${HE.grainPattern(0.05, 2, 52, '#5a4a30')}"/></g>`;
      fg += `<rect x="75" y="216" width="570" height="774" fill="none" stroke="#3a3028" stroke-width="3"/>`;
      fg += `<rect x="67" y="208" width="586" height="790" fill="none" stroke="#3a3028" stroke-width="1.5"/>`;
      // Kartusche
      fg += `<rect x="584" y="236" width="40" height="104" fill="#f3ecdb" stroke="#3a3028" stroke-width="2"/><rect x="589" y="241" width="30" height="94" fill="none" stroke="#3a3028" stroke-width="1"/>`;
      if (o.vtext) [...o.vtext].forEach((ch, i) => { fg += HE.text(ch, 604, 266 + i * 24, { font: "'IPAGothic','WenQuanYi Zen Hei'", size: 19, fill: '#2a241e' }); });
      // Stempel
      fg += `<rect x="598" y="934" width="36" height="36" fill="#c0392b"/><path d="M604 940 h24 v24 h-24 Z M616 940 v24 M604 952 h24" stroke="#f3e4d2" stroke-width="2.4" fill="none"/>`;
    } else if (type === 'ink') {
      bg += `<rect width="720" height="1280" fill="${HE.rg([[0, '#ece8e0'], [0.7, '#e2ddd2'], [1, '#cbc4b6']], 0.5, 0.45, 0.8)}"/>`;
      bg += `<rect width="720" height="1280" fill="${HE.grainPattern(0.05, 2.2, 61, '#6a6050')}"/>`;
      const band = (y, seed) => {
        const r = HE.rng(seed); let s = '';
        for (let i = 0; i < 6; i++) {
          const x = ((r() * 820 + c.T * 6 * (r() < 0.5 ? 1 : -1)) % 900) - 90, w = 160 + r() * 140, yy = y + (r() - 0.5) * 30;
          s += `<ellipse cx="${n(x)}" cy="${n(yy)}" rx="${n(w / 2)}" ry="17" fill="#d8b44c" stroke="#b48d2a" stroke-width="2"/>`;
          s += `<path d="M${n(x - w * 0.3)} ${n(yy)} Q${n(x)} ${n(yy - 8)} ${n(x + w * 0.3)} ${n(yy)}" stroke="#c9a23a" stroke-width="2" fill="none"/>`;
        }
        return s;
      };
      fg += band(o.bandTop || 172, 'b1') + band(o.bandBottom || 1000, 'b2');
      fg += `<rect x="628" y="140" width="48" height="48" rx="3" fill="#c0392b"/>` + HE.text(o.seal || '怪', 652, 175, { font: "'IPAGothic','WenQuanYi Zen Hei'", size: 30, fill: '#f6ece0' });
      if (o.vtext) [...o.vtext].forEach((ch, i) => { fg += HE.text(ch, 652, 236 + i * 28, { font: "'IPAGothic','WenQuanYi Zen Hei'", size: 22, fill: '#2a2420' }); });
    } else if (type === 'papercut') {
      bg += `<rect width="720" height="1280" fill="${HE.rg([[0, '#f6ead0'], [0.6, '#e9d3a6'], [1, '#b8915a']], 0.5, 0.45, 0.8)}"/>`;
      bg += `<rect width="720" height="1280" fill="${HE.grainPattern(0.06, 2.4, 71, '#7a5a30')}"/>`;
      // ornamentaler Rahmen (Bögen)
      const ink = L.INK.papercut;
      fg += `<path d="M0 0 H720 V1280 H0 Z M40 120 V1060 H680 V120 Z" fill="${ink}" fill-rule="evenodd"/>`;
      for (let x = 40; x < 680; x += 32) { fg += `<path d="M${x} 120 a16 16 0 0 0 32 0 Z" fill="${ink}"/><path d="M${x} 1060 a16 16 0 0 1 32 0 Z" fill="${ink}"/>`; }
      for (let y = 120; y < 1060; y += 32) { fg += `<path d="M40 ${y} a16 16 0 0 1 0 32 Z" fill="${ink}"/><path d="M680 ${y} a16 16 0 0 0 0 32 Z" fill="${ink}"/>`; }
      [[40, 120], [680, 120], [40, 1060], [680, 1060]].forEach(([x, y]) => { fg += `<circle cx="${x}" cy="${y}" r="26" fill="${ink}"/><circle cx="${x}" cy="${y}" r="9" fill="#e9d3a6"/>`; });
      if (o.title) fg += HE.text(o.title, 360, 92, { font: HE.FONT.black, weight: 900, size: 34, fill: '#e9d3a6', ls: 2 });
    } else if (type === 'chronicle') {
      bg += `<rect width="720" height="1280" fill="${HE.rg([[0, '#efe2c0'], [0.7, '#e0cc9c'], [1, '#b89a5e']], 0.5, 0.45, 0.8)}"/>`;
      const r = HE.rng('stains');
      for (let i = 0; i < 7; i++) bg += `<ellipse cx="${n(r() * 720)}" cy="${n(r() * 1280)}" rx="${n(40 + r() * 90)}" ry="${n(30 + r() * 70)}" fill="#a07a3a" opacity="0.12" filter="${HE.blurF(14)}"/>`;
      bg += `<rect width="720" height="1280" fill="${HE.grainPattern(0.07, 2.2, 81, '#5a4020')}"/>`;
      fg += `<rect x="52" y="200" width="616" height="840" fill="none" stroke="${L.INK.chronicle}" stroke-width="4"/><rect x="62" y="210" width="596" height="820" fill="none" stroke="${L.INK.chronicle}" stroke-width="1.5"/>`;
      if (o.title) fg += HE.text(o.title, 360, 1090, { font: "'Liberation Serif', serif", size: 30, fill: L.INK.chronicle, extra: ' font-style="italic"' });
    }
    return bg + body + fg + L.tag(o.tag);
  };

  // Silhouette einer Figur fürs Schattenspiel (mit Perforation)
  L.puppet = function (personOpts) {
    const mono = L.INK.shadow;
    return HE.person(Object.assign({}, personOpts, { mono, shadow: false }));
  };
  // beliebiges Motiv (auch Monster) als Silhouette im Stil des Segments: HE.legend.sil(svg, 'papercut')
  L.sil = (svg, type = 'shadow') => HE.silhouette(svg, L.INK[type] || L.INK.shadow);
})();
