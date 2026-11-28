/* =====================================================================================
   HE · inserts – formatfüllende Erklär-Grafiken wie in der Referenz:
     HE.ins.notebook(c, o)  Notizzettel, Handschrift wird geschrieben, Bleistift folgt
     HE.ins.calendar(c, o)  Wandkalender, Tage werden durchgekreuzt, ein Tag eingekreist
     HE.ins.phone(c, o)     Handy mit eingehendem Anruf („OMA – eingehender Anruf“)
     HE.ins.map(c, o)       Karte mit Punkten/Linien (z. B. Statuen an jeder Straße)
     HE.ins.news(c, o)      Zeitungsausschnitt mit Schlagzeile
   Alle zeichnen im Bildschirm-Bereich 720 × 1280 (Kamera wirkt trotzdem: sanfter Push-in).
   ===================================================================================== */
(function () {
  const HE = window.HE;
  const n = HE.n;
  const I = (HE.ins = {});

  const desk = (col = '#3a2a1e') => `<rect x="-200" y="-200" width="1120" height="1680" fill="${HE.rg([[0, HE.shade(col, 0.12)], [0.6, col], [1, HE.shade(col, -0.55)]], 0.5, 0.45, 0.75)}"/>` +
    `<rect x="-200" y="-200" width="1120" height="1680" fill="${HE.grainPattern(0.09, 3, 91)}"/>`;

  // lines: [{text, color, size, at}] ; Zeilen werden nacheinander geschrieben (cps Zeichen/s)
  I.notebook = function (c, o = {}) {
    const x = o.x || 150, y = o.y || 300, w = o.w || 430, h = o.h || 600, rot = o.rot != null ? o.rot : -1.5;
    let s = desk(o.desk);
    s += `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})">`;
    s += `<rect x="${x + 8}" y="${y + 10}" width="${w}" height="${h}" fill="#000" opacity="0.35" filter="${HE.blurF(10)}"/>`;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f3ead6"/>`;
    for (let yy = y + 70; yy < y + h - 10; yy += 34) s += `<line x1="${x}" y1="${yy}" x2="${x + w}" y2="${yy}" stroke="#9fb6cf" stroke-width="1.3"/>`;
    s += `<line x1="${x + 46}" y1="${y}" x2="${x + 46}" y2="${y + h}" stroke="#d98a8a" stroke-width="1.6"/>`;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${HE.rg([[0, '#fff6dc', 0.35], [1, '#fff6dc', 0]], 0.25, 0.15, 0.6)}"/>`;
    // Text schreiben
    const cps = o.cps || 16;
    let tcur = o.start || 0.3, pen = null;
    (o.lines || []).forEach((ln, i) => {
      const t0 = ln.at != null ? ln.at : tcur;
      const txt = ln.text, size = ln.size || 24;
      const k = HE.clamp((c.t - t0) * cps, 0, txt.length);
      tcur = t0 + txt.length / cps + 0.4;
      const ly = ln.y != null ? ln.y : y + 64 + i * 68;
      const lx = ln.x != null ? ln.x : x + 60;
      if (k > 0) {
        const part = txt.slice(0, Math.floor(k));
        s += HE.text(part, lx, ly, { size, fill: ln.color || '#1f2a48', anchor: 'start', font: HE.FONT.bold, extra: ` transform="rotate(${ln.tilt || -1} ${lx} ${ly})"` });
        if (k < txt.length) pen = [lx + HE.measure(part, size, HE.FONT.bold), ly];
      }
    });
    s += `</g>`;
    if (pen && o.pencil !== false) {
      const [px, py] = pen;
      s += `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2}) translate(${n(px)} ${n(py - 4)}) rotate(-35)">` +
        `<rect x="0" y="-6" width="120" height="12" fill="#e8b33a"/><rect x="110" y="-6" width="22" height="12" fill="#d9a0a0"/><polygon points="0,-6 -18,0 0,6" fill="#e9cfa0"/><polygon points="-12,-2 -18,0 -12,2" fill="#333"/></g>`;
    }
    if (o.stamp) {
      const a = c.after(o.stamp.at != null ? o.stamp.at : tcur, 0.25, 'outBack');
      if (a > 0) s += `<g transform="translate(${x + w * 0.62} ${y + h * 0.78}) rotate(-12) scale(${n(2 - a)})" opacity="${n(Math.min(1, a))}"><rect x="-90" y="-30" width="180" height="60" fill="none" stroke="#c0392b" stroke-width="5"/>` + HE.text(o.stamp.text || 'FALSCH', 0, 14, { font: HE.FONT.black, weight: 900, size: 38, fill: '#c0392b' }) + `</g>`;
    }
    return s;
  };

  // Wandkalender: month, days (Anzahl), crossed (bis Tag k durchgekreuzt, animiert ab crossFrom), circle (Tag)
  I.calendar = function (c, o = {}) {
    const x = 160, y = 330, w = 400, h = 470;
    let s = `<rect x="-200" y="-200" width="1120" height="1680" fill="${o.wall || '#4a4a52'}"/><rect x="-200" y="-200" width="1120" height="1680" fill="${HE.grainPattern(0.08, 3, 92)}"/>`;
    s += HE.fx.vignette(0.5);
    s += `<rect x="${x + 6}" y="${y + 10}" width="${w}" height="${h}" fill="#000" opacity="0.35" filter="${HE.blurF(8)}"/>`;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#efebe2"/>`;
    s += `<rect x="${x}" y="${y}" width="${w}" height="74" fill="#c8423a"/>`;
    s += HE.text(o.month || 'FEBRUAR', x + w / 2, y + 50, { font: HE.FONT.black, weight: 900, size: 38, fill: '#fff' });
    s += `<circle cx="${x + w / 2}" cy="${y - 12}" r="6" fill="#333"/>`;
    const days = o.days || 28, start = o.startCol || 3;
    const cw = (w - 30) / 7, rh = (h - 110) / 6;
    for (let d = 1; d <= days; d++) {
      const idx = d - 1 + start, col = idx % 7, row = Math.floor(idx / 7);
      const cx = x + 15 + col * cw + cw / 2, cy = y + 112 + row * rh;
      s += HE.text(String(d), cx, cy + 8, { size: 24, fill: '#3a3a3a' });
      const crossed = o.crossed || 0, from = o.crossFrom || 0, dur = o.crossDur || 1.6;
      if (d <= crossed) {
        const k = d <= from ? 1 : HE.clamp((c.t - (o.crossStart || 0.3) - ((d - from - 1) / Math.max(1, crossed - from)) * dur) / 0.15);
        if (k > 0) s += `<path d="M${n(cx - 15)} ${n(cy - 12)} L${n(cx - 15 + 30 * k)} ${n(cy - 12 + 26 * k)}" stroke="#c0392b" stroke-width="3.5" stroke-linecap="round"/>` +
          (k > 0.5 ? `<path d="M${n(cx + 15)} ${n(cy - 12)} L${n(cx + 15 - 30 * (k - 0.5) * 2)} ${n(cy - 12 + 26 * (k - 0.5) * 2)}" stroke="#c0392b" stroke-width="3.5" stroke-linecap="round"/>` : '');
      }
      if (o.circle === d) {
        const a = c.after(o.circleAt != null ? o.circleAt : 0.8, 0.8, 'inOut');
        const R = 26, L = 2 * Math.PI * R;
        if (a > 0) s += `<circle cx="${n(cx)}" cy="${n(cy - 1)}" r="${R}" fill="none" stroke="#c0392b" stroke-width="3.5" stroke-dasharray="${n(L)}" stroke-dashoffset="${n(L * (1 - a))}" transform="rotate(-90 ${n(cx)} ${n(cy - 1)})"/>`;
      }
    }
    return s;
  };

  // Handy mit eingehendem Anruf
  I.phone = function (c, o = {}) {
    let s = `<rect x="-200" y="-200" width="1120" height="1680" fill="${o.bg || '#15161a'}"/>` + HE.fx.vignette(0.6);
    const vib = (Math.floor(c.T * 14) % 2 ? 1 : -1) * (Math.sin(c.T * 3) > 0 ? 3 : 0);
    const x = 360 + vib, y = 600;
    for (let i = 0; i < 3; i++) { const k = ((c.t * 0.7 + i / 3) % 1); s += `<circle cx="${x}" cy="${y}" r="${n(180 + k * 220)}" fill="none" stroke="#ffffff" stroke-width="2" opacity="${n(0.18 * (1 - k))}"/>`; }
    s += `<g transform="rotate(${o.rot != null ? o.rot : -8} ${x} ${y})">`;
    s += `<rect x="${x - 120}" y="${y - 240}" width="240" height="480" rx="30" fill="#0c0c0e" stroke="#3a3a40" stroke-width="3"/>`;
    s += `<rect x="${x - 108}" y="${y - 226}" width="216" height="452" rx="22" fill="${HE.lg([[0, '#2a3040'], [1, '#141820']])}"/>`;
    s += `<circle cx="${x}" cy="${y - 110}" r="46" fill="#d9b8a0"/><circle cx="${x}" cy="${y - 128}" r="22" fill="#f2e6da"/><path d="M${x - 34} ${y - 76} Q${x} ${y - 112} ${x + 34} ${y - 76} Z" fill="#f2e6da"/>`;
    s += HE.text((o.name || 'OMA').toUpperCase(), x, y - 22, { font: HE.FONT.black, weight: 900, size: 34, fill: '#ffffff' });
    s += HE.text(o.sub || HE.T('call'), x, y + 8, { size: 16, fill: '#b8bccb' });
    s += `<circle cx="${x - 55}" cy="${y + 150}" r="26" fill="#e0453a"/><circle cx="${x + 55}" cy="${y + 150}" r="26" fill="#37b24d"/>`;
    s += `<path d="M${x - 66} ${y + 150} q11 -8 22 0" stroke="#fff" stroke-width="4" fill="none"/><path d="M${x + 44} ${y + 146} q11 8 22 0" stroke="#fff" stroke-width="4" fill="none"/>`;
    s += `</g>`;
    return s;
  };

  // Karte: points [{x,y,label,icon:'statue'|'house'|'x'}], lines [[x1,y1,x2,y2]], river
  I.map = function (c, o = {}) {
    let s = `<rect x="-200" y="-200" width="1120" height="1680" fill="#e6d8b4"/><rect x="-200" y="-200" width="1120" height="1680" fill="${HE.grainPattern(0.07, 2.4, 93, '#6a5030')}"/>`;
    s += HE.fx.vignette(0.35, '#5a4020');
    if (o.river) s += `<path d="${o.river}" stroke="#7aa0c8" stroke-width="10" fill="none" opacity="0.8"/>`;
    (o.lines || []).forEach(([x1, y1, x2, y2], i) => {
      const a = c.after((o.lineAt || 0.4) + i * 0.3, 0.6, 'inOut');
      if (a > 0) s += `<line x1="${x1}" y1="${y1}" x2="${n(HE.lerp(x1, x2, a))}" y2="${n(HE.lerp(y1, y2, a))}" stroke="#c0392b" stroke-width="3" stroke-dasharray="10 8"/>`;
    });
    (o.points || []).forEach((p, i) => {
      const a = c.after((o.pointAt || 0.2) + i * 0.25, 0.4, 'outBack');
      if (a <= 0) return;
      s += `<g transform="translate(${p.x} ${p.y}) scale(${n(a)})">`;
      if (p.icon === 'statue') s += `<circle r="30" fill="#f3ecdb" stroke="#c0392b" stroke-width="3"/>` + HE.sc.statue({ x: 0, y: 22, s: 0.42 });
      else if (p.icon === 'x') s += `<path d="M-14 -14 L14 14 M14 -14 L-14 14" stroke="#c0392b" stroke-width="5"/>`;
      else if (p.icon === 'house') s += `<path d="M-16 8 V-6 L0 -18 L16 -6 V8 Z" fill="#7a5a3a"/>`;
      else s += `<circle r="9" fill="#c0392b"/>`;
      if (p.label) s += HE.text(p.label, 0, 52, { size: 20, fill: '#3a2a1a' });
      s += `</g>`;
    });
    return s;
  };

  // Zeitungsausschnitt
  I.news = function (c, o = {}) {
    let s = desk(o.desk || '#2e2a26');
    s += `<g transform="rotate(${o.rot != null ? o.rot : 2} 360 640)"><rect x="110" y="330" width="500" height="560" fill="#e9e4d6"/>`;
    s += HE.text(o.paper || 'TAGESANZEIGER', 360, 380, { font: "'Liberation Serif', serif", size: 30, fill: '#222' });
    s += `<line x1="130" y1="396" x2="590" y2="396" stroke="#222" stroke-width="2"/>`;
    const words = (o.headline || '').toUpperCase().split(' ');
    let line = '', ly = 450; const lines = [];
    words.forEach((w) => { if (HE.measure(line + ' ' + w, 40, HE.FONT.black, 900) > 440) { lines.push(line); line = w; } else line = (line ? line + ' ' : '') + w; });
    lines.push(line);
    lines.forEach((l, i) => { s += HE.text(l.trim(), 360, ly + i * 46, { font: HE.FONT.black, weight: 900, size: 40, fill: '#1a1a1a' }); });
    for (let i = 0; i < 9; i++) s += `<rect x="130" y="${ly + lines.length * 46 + i * 26}" width="${i % 3 === 2 ? 300 : 460}" height="9" fill="#9a968c"/>`;
    s += `</g>`;
    return s;
  };
})();
