/* =====================================================================================
   HE · UI – Karaoke-Untertitel (HTML-Overlay) und Titelkarte („Monster-Akte“)
   Maße exakt nach Referenz (Basis 720 × 1280).
   ===================================================================================== */
(function () {
  const HE = window.HE;

  // Schriften (in page.html per @font-face geladen)
  HE.FONT = { bold: "'SS3B'", black: "'SS3K'", mono: "'SCP'" };

  // Textbreite messen (Canvas), für Titel-Einpassung
  const mctx = document.createElement('canvas').getContext('2d');
  HE.measure = function (txt, size, family, weight = 700) {
    mctx.font = `${weight} ${size}px ${family}`;
    return mctx.measureText(txt).width;
  };
  HE.esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // SVG-Text-Helfer
  HE.text = function (txt, x, y, o = {}) {
    const fam = o.font || HE.FONT.bold;
    return `<text x="${HE.n(x)}" y="${HE.n(y)}" font-family="${fam}" font-size="${o.size || 30}" ` +
      `font-weight="${o.weight || 700}" fill="${o.fill || '#fff'}" text-anchor="${o.anchor || 'middle'}"` +
      (o.ls ? ` letter-spacing="${o.ls}"` : '') + (o.opacity != null ? ` opacity="${HE.n(o.opacity)}"` : '') +
      (o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 2}" paint-order="stroke"` : '') +
      (o.extra || '') + `>${HE.esc(txt)}</text>`;
  };

  // =================================================================== UNTERTITEL
  HE.captions = {
    chunks: [], words: [], el: null,
    build(timing) {
      this.words = timing.words || [];
      this.chunks = (timing.chunks || []).map((ch, k, arr) => {
        const ws = ch.words.map((i) => this.words[i]);
        const s = ws[0].s, lastE = ws[ws.length - 1].e;
        const next = arr[k + 1] ? this.words[arr[k + 1].words[0]].s : Infinity;
        // bleibt stehen bis zum nächsten Chunk, wenn die Lücke klein ist – sonst kurz nach dem letzten Wort weg
        const hideAt = next - lastE < 0.7 ? next - 0.02 : lastE + 0.38;
        return { ws, s: s - 0.04, e: hideAt };
      });
      this.el = document.getElementById('cap');
      this.accent = (HE._story.palette && HE._story.palette.accent) || '#fdd264';
      document.documentElement.style.setProperty('--accent', this.accent);
    },
    update(T, blackAlpha) {
      const el = this.el;
      if (!el) return;
      const ch = this.chunks.find((c) => T >= c.s && T < c.e);
      if (!ch || (HE._story.captions === false)) { el.style.opacity = 0; el.innerHTML = ''; return; }
      const fin = HE.clamp((T - ch.s) / 0.1), fout = HE.clamp((ch.e - T) / 0.14);
      let op = Math.min(fin, fout);
      op *= 1 - 0.85 * (blackAlpha || 0); // dimmt mit, wenn das Bild abblendet (wie im Original)
      el.style.opacity = op.toFixed(3);
      let html = '';
      ch.ws.forEach((w, i) => {
        // aktuelles Wort = zuletzt begonnenes; das letzte Wort bleibt noch 0,25 s nach seinem Ende farbig
        const end = ch.ws[i + 1] ? ch.ws[i + 1].s : w.e + 0.25;
        let cls = 'up';
        if (T >= w.s) cls = T < end ? 'cur' : 'done';
        html += (i ? ' ' : '') + `<span class="${cls}">${HE.esc(w.w)}</span>`;
      });
      if (el._last !== html) {
        el.innerHTML = html; el._last = html;
        // zu breit? → verkleinern
        el.style.fontSize = '';
        const wpx = el.scrollWidth;
        if (wpx > 660) el.style.fontSize = Math.floor(60 * 660 / wpx) + 'px';
      }
    },
  };

  // =================================================================== TITELKARTE
  // def: { name, sub, threat (1–20), level (Text, optional), lines:[..,..], badge, portrait(c)→svg,
  //        palette:{bg, accent, title, lines} }  – Palette fällt auf story.palette zurück
  HE.titleCard = function (c, def) {
    const P = Object.assign({ bg: '#0e2023', accent: '#fdd264', title: '#d2cfc6', lines: null }, HE._story.palette || {}, def.palette || {});
    const t = c.t;
    const bgDark = HE.shade(P.bg, -0.55);
    let s = '';
    // Hintergrund: Mitte heller → Ränder dunkel + Korn
    s += `<rect width="720" height="1280" fill="${HE.rg([[0, P.bg], [0.55, HE.mix(P.bg, bgDark, 0.45)], [1, bgDark]], 0.5, 0.48, 0.75)}"/>`;
    s += `<rect width="720" height="1280" fill="${HE.grainPattern(0.10, 2.2, 3, '#000')}"/>`;
    s += `<rect width="720" height="1280" fill="${HE.grainPattern(0.035, 2.0, 9, '#fff')}"/>`;

    // ---- Name (Source Sans 3 Black), max. 640 px breit, Grundlinie y≈172
    const name = (def.name || 'NAME').toUpperCase();
    let fs = 127;
    const w = HE.measure(name, fs, HE.FONT.black, 900);
    if (w > 640) fs = Math.floor(fs * 640 / w);
    const aName = HE.E('out', t / 0.3);
    const yName = 172 + (1 - aName) * 8;
    s += `<g opacity="${HE.n(aName)}">` +
      HE.text(name, 360, yName + 5, { font: HE.FONT.black, weight: 900, size: fs, fill: '#000', opacity: 0.55, extra: ` filter="${HE.blurF(3)}"` }) +
      HE.text(name, 360, yName, { font: HE.FONT.black, weight: 900, size: fs, fill: P.title }) + `</g>`;

    // ---- Untertitel + „GEFAHRENSTUFE“ + leere Leiste
    const aSub = HE.E('out', (t - 0.22) / 0.3);
    const sub = def.sub ? `[ ${def.sub.toUpperCase()} ]` : '';
    let subSize = 30; const sw = HE.measure(sub, subSize, HE.FONT.bold);
    if (sw > 660) subSize = Math.floor(subSize * 660 / sw);
    s += `<g opacity="${HE.n(aSub)}">`;
    s += HE.text(sub, 360, 232, { size: subSize, fill: P.accent });
    s += HE.text(HE.T('threat'), 360, 268, { font: HE.FONT.mono, size: 15, fill: P.accent, ls: 1.5 });
    s += `<rect x="108" y="282" width="502" height="32" fill="#0d0d0d" stroke="#e8e8e8" stroke-width="3"/>`;
    // Segmente
    const N = 20, gap = 2.6, x0 = 114, segW = (490 - gap * (N - 1)) / N;
    const level = HE.clamp(Math.round(def.threat || 16), 1, 20);
    const fillK = HE.clamp((t - 1.0) / 1.5); // füllt in 1,5 s
    const lit = Math.floor(HE.E('out', fillK) * level + 0.0001);
    for (let k = 0; k < N; k++) {
      const col = k < 10 ? '#36b647' : k < 15 ? '#eeb917' : '#fb7d6c';
      const x = x0 + k * (segW + gap);
      if (k < lit) s += `<rect x="${HE.n(x)}" y="287" width="${HE.n(segW)}" height="22" fill="${col}"/>`;
    }
    s += `</g>`;
    // Stufen-Wort
    const lv = def.level || HE.T('levels')[level <= 5 ? 0 : level <= 10 ? 1 : level <= 17 ? 2 : 3];
    const aLv = HE.E('out', (t - 2.55) / 0.25);
    if (aLv > 0) s += HE.text(lv, 360, 345, { size: 22, fill: '#f2f2f2', opacity: aLv });

    // ---- Porträt-Rahmen (512²) mit Pop-in
    const aP = HE.E('out', (t - 0.45) / 0.35);
    if (aP > 0) {
      const sc = 0.94 + 0.06 * HE.E('outBack', (t - 0.45) / 0.45);
      s += `<g opacity="${HE.n(aP)}" transform="translate(360 629) scale(${HE.n(sc * 1000) / 1000}) translate(-360 -629)">`;
      s += `<rect x="98" y="367" width="524" height="524" fill="#000" opacity="0.45" filter="${HE.blurF(8)}"/>`;
      s += `<rect x="104" y="373" width="512" height="512" fill="#0a0a0a"/>`;
      const clip = 'tcclip';
      HE.defs.add(clip, `<clipPath id="${clip}"><rect x="110" y="379" width="500" height="500"/></clipPath>`);
      // Porträt bekommt eigenen Mini-Kontext: Koordinaten 0..500 × 0..500, langsamer Zoom
      const z = 1 + 0.05 * HE.E('sine', HE.clamp(t / Math.max(1, c.d)));
      const pc = Object.assign({}, c, { portrait: true, W: 500, H: 500 });
      const art = def.portrait ? def.portrait(pc) : '';
      s += `<g clip-path="url(#${clip})"><g transform="translate(360 629) scale(${HE.n(z * 1000) / 1000}) translate(-250 -250)">${art}</g></g>`;
      s += `</g>`;
    }

    // ---- Badge „★ REMASTERED EDITION ★“
    const badge = def.badge === false ? null : (def.badge || 'REMASTERED EDITION');
    const aB = HE.E('out', (t - 0.85) / 0.3);
    if (badge && aB > 0) {
      const btxt = `★   ${badge}   ★`;
      const bw = HE.measure(btxt, 16, HE.FONT.mono) + 36;
      s += `<g opacity="${HE.n(aB)}"><rect x="${HE.n(360 - bw / 2)}" y="884" width="${HE.n(bw)}" height="29" rx="14.5" fill="${HE.mix(P.bg, '#000', 0.25)}" stroke="${P.accent}" stroke-width="2"/>` +
        HE.text(btxt, 360, 904, { font: HE.FONT.mono, size: 16, fill: P.accent }) + `</g>`;
    }
    // ---- zwei Info-Zeilen, Schreibmaschine
    const lines = (def.lines || []).map((l) => l.toUpperCase());
    const cps = def.cps || 55; // Zeichen pro Sekunde (Referenz: beide Zeilen in ≈1,5 s)
    let start = 0.95;
    lines.forEach((ln, k) => {
      const n = Math.floor(HE.clamp((t - start) * cps, 0, ln.length));
      start += ln.length / cps + 0.12;
      if (n <= 0) return;
      let size = 21; const lw = HE.measure(ln, size, HE.FONT.mono);
      if (lw > 670) size = Math.floor(size * 670 / lw);
      // Volle Zeile messen, damit der Text beim Tippen nicht springt (linksbündig ab Startpunkt)
      const full = HE.measure(ln, size, HE.FONT.mono);
      s += HE.text(ln.slice(0, n), 360 - full / 2, 939 + k * 36, { font: HE.FONT.mono, size, fill: P.lines || P.accent, anchor: 'start' });
    });
    return s;
  };
})();
