/* =====================================================================================
   HE · scenes – Kulissen & Requisiten im flachen 2D-Stil der Referenz.
   Jede Funktion gibt einen SVG-String zurück. Koordinaten: 720 × 1280, Boden-y frei wählbar.
   Gemeinsame Option  mood: 'day' | 'dusk' | 'night' | 'dark' | 'snow'  → färbt alle Farben passend.
   Konvention: x = Mitte, y = Unterkante (Boden), wenn nicht anders angegeben.
   ===================================================================================== */
(function () {
  const HE = window.HE;
  const n = HE.n;
  const sc = (HE.sc = {});

  // ------------------------------------------------------------------ Stimmungs-Tönung
  const MOOD = {
    day: null,
    dusk: ['#4a2f4a', 0.22],
    night: ['#0b1626', 0.58],
    dark: ['#08090d', 0.55],
    snow: ['#1b2a48', 0.5],     // verschneite Nacht (blau)
    dawn: ['#7a5a6a', 0.18],
  };
  HE.tone = function (color, mood, extra = 0) {
    if (!color || color === 'none' || color.startsWith('url')) return color;
    const m = MOOD[mood];
    let c = color;
    if (m) c = HE.mix(c, m[0], Math.min(0.95, m[1] + extra));
    else if (extra) c = HE.mix(c, '#000', extra);
    return c;
  };
  const T = HE.tone;
  const P = (pts) => pts.map((p) => n(p[0]) + ',' + n(p[1])).join(' ');

  // ------------------------------------------------------------------ Himmel
  // o.top/o.bottom – Verlauf; Presets: sc.SKY.day/dusk/night/snow/dawn/storm
  sc.SKY = {
    day: ['#8fbcd8', '#d3e6ea'], dusk: ['#3d3a63', '#e0937a'], night: ['#0b1424', '#1d3242'],
    snow: ['#0c1530', '#2b3e66'], dawn: ['#6f6a96', '#f0b58e'], storm: ['#1a1f28', '#3a4250'],
    teal: ['#0a1a22', '#1f3a40'], jpday: ['#7fb0d6', '#f2e2c4'],
  };
  sc.sky = function (c, o = {}) {
    const pre = sc.SKY[o.preset || 'night'];
    const top = o.top || pre[0], bot = o.bottom || pre[1];
    let s = `<rect x="-500" y="-500" width="1720" height="${o.h || 2400}" fill="${HE.lg([[0, top], [1, bot]], 0, 0, 0, 1)}"/>`;
    if (o.stars) s += HE.fx.stars(c, typeof o.stars === 'object' ? o.stars : { n: 80 });
    if (o.moon) s += HE.fx.moon(o.moon === true ? {} : o.moon);
    if (o.clouds) s += sc.clouds(c, o.clouds === true ? {} : o.clouds);
    return s;
  };

  // stilisierte Wolken (flache Unterkante, Puffs) – wie in den Tag-Szenen der Referenz
  sc.clouds = function (c, o = {}) {
    const r = HE.rng(o.seed || 'cl');
    const col = T(o.color || '#f3efe6', o.mood);
    let s = '';
    for (let i = 0; i < (o.cnt || 3); i++) {
      const w = 120 + r() * 160, x = ((r() * 900 + c.T * (o.speed || 4)) % 1000) - 140, y = (o.y || 90) + r() * (o.h || 160);
      s += `<g opacity="${o.opacity || 0.92}">`;
      const k = 3 + Math.floor(r() * 3);
      for (let j = 0; j < k; j++) {
        const cx = x - w / 2 + (j + 0.5) * (w / k), rr = w / k * (0.6 + r() * 0.5);
        s += `<circle cx="${n(cx)}" cy="${n(y - rr * 0.35)}" r="${n(rr)}" fill="${col}"/>`;
      }
      s += `</g>`;
    }
    return s;
  };

  // ------------------------------------------------------------------ Berge / Hügel / Vulkan
  sc.mountains = function (o = {}) {
    const r = HE.rng(o.seed || 'mt');
    const { y = 700, h = 260, x0 = -200, x1 = 920, peaks = 5 } = o;
    const col = T(o.color || '#5a6c88', o.mood);
    const pts = [[x0, y + 40]];
    const step = (x1 - x0) / peaks;
    for (let i = 0; i <= peaks; i++) {
      const px = x0 + i * step + (r() - 0.5) * step * 0.4, ph = h * (0.45 + r() * 0.55);
      if (i > 0) pts.push([px - step * 0.5, y - ph * (0.25 + r() * 0.25)]);
      pts.push([px - 6, y - ph], [px + 8, y - ph + 4]);
    }
    pts.push([x1, y + 40]);
    let s = `<polygon points="${P(pts)}" fill="${col}"/>`;
    if (o.rim) s += `<polyline points="${P(pts.slice(1, -1))}" fill="none" stroke="${T(o.rim, o.mood)}" stroke-width="${o.rimW || 3}" stroke-dasharray="${o.rimDash || 'none'}" opacity="0.8"/>`;
    if (o.snow) {
      pts.slice(1, -1).forEach((p, i) => {
        if (i % 3 === 1 || i % 3 === 2) return;
      });
    }
    if (o.texture !== false) s += `<polygon points="${P(pts)}" fill="${HE.grainPattern(0.05, 3, 21)}"/>`;
    return s;
  };

  sc.hills = function (o = {}) {
    const r = HE.rng(o.seed || 'hl');
    const { y = 800, h = 90, x0 = -250, x1 = 970 } = o;
    let d = `M${x0} ${y + 400} L${x0} ${y}`;
    const k = o.cnt || 4, step = (x1 - x0) / k;
    for (let i = 0; i < k; i++) {
      const xa = x0 + i * step, hh = h * (0.5 + r() * 0.5);
      d += ` Q${n(xa + step / 2)} ${n(y - hh * 2)} ${n(xa + step)} ${n(y + (r() - 0.5) * 10)}`;
    }
    d += ` L${x1} ${y + 400} Z`;
    let s = `<path d="${d}" fill="${T(o.color || '#4f7a4a', o.mood)}"/>`;
    if (o.rim) s += `<path d="${d}" fill="none" stroke="${T(o.rim, o.mood)}" stroke-width="3" stroke-dasharray="${o.rimDash || '10 7'}" opacity="0.7"/>`;
    return s;
  };

  sc.volcano = function (c, o = {}) {
    const { x = 520, y = 640, w = 620, h = 330 } = o;
    const col = T(o.color || '#55617e', o.mood);
    let s = `<polygon points="${P([[x - w / 2, y], [x - 46, y - h], [x + 46, y - h], [x + w / 2, y]])}" fill="${col}"/>`;
    // radiale Rinnen
    for (let i = -8; i <= 8; i++) {
      const bx = x + (i / 8) * (w / 2) * 0.92, tx = x + i * 4.5;
      s += `<line x1="${n(tx)}" y1="${n(y - h + 6)}" x2="${n(bx)}" y2="${n(y)}" stroke="${HE.shade(col, -0.25)}" stroke-width="1.6" opacity="0.6"/>`;
    }
    s += `<polygon points="${P([[x - 46, y - h], [x + 46, y - h], [x + 30, y - h + 18], [x - 34, y - h + 14]])}" fill="${HE.shade(col, -0.2)}"/>`;
    if (o.smoke !== false) s += HE.fx.smoke(c, { x, y: y - h - 6, color: T('#e9e6e1', o.mood), opacity: 0.55, scale: 1.4 });
    return s;
  };

  // Reisterrassen / Felder: horizontale Bänder
  sc.fields = function (o = {}) {
    const { y = 640, h = 120, rows = 6, x0 = -200, x1 = 920 } = o;
    const a = T(o.color || '#6fae4f', o.mood), b = T(o.color2 || '#86c262', o.mood);
    let s = '';
    for (let i = 0; i < rows; i++) {
      const yy = y + (i * h) / rows;
      s += `<rect x="${x0}" y="${n(yy)}" width="${x1 - x0}" height="${n(h / rows + 1)}" fill="${i % 2 ? a : b}"/>`;
      s += `<line x1="${x0}" y1="${n(yy)}" x2="${x1}" y2="${n(yy)}" stroke="${T('#d8ecc0', o.mood)}" stroke-width="1.2" opacity="0.7"/>`;
    }
    return s;
  };

  // Boden mit Textur
  sc.ground = function (c, o = {}) {
    const { y = 900, x0 = -300, x1 = 1020 } = o;
    const col = T(o.color || '#a38c6c', o.mood), col2 = T(o.color2 || HE.shade(o.color || '#a38c6c', -0.15), o.mood);
    let s = `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="1800" fill="${HE.lg([[0, col], [1, col2]], 0, 0, 0, 1)}"/>`;
    const r = HE.rng(o.seed || 'gr');
    if (o.specks !== false) for (let i = 0; i < (o.specks || 40); i++) {
      s += `<ellipse cx="${n(x0 + r() * (x1 - x0))}" cy="${n(y + 10 + r() * 380)}" rx="${n(2 + r() * 7)}" ry="${n(1 + r() * 2)}" fill="${HE.shade(col, -0.18)}" opacity="0.5"/>`;
    }
    if (o.tufts) s += sc.tufts({ y: y + 4, x0: 0, x1: 720, cnt: o.tufts, color: o.tuftColor || '#5d7d3f', mood: o.mood, seed: (o.seed || 'gr') + 't', spread: o.spread || 360 });
    if (o.edge) s += `<rect x="${x0}" y="${y - 2}" width="${x1 - x0}" height="5" fill="${T(o.edge, o.mood)}"/>`;
    return s;
  };

  // Grasbüschel
  sc.tufts = function (o = {}) {
    const r = HE.rng(o.seed || 'tu');
    const col = T(o.color || '#5d7d3f', o.mood);
    let s = '';
    for (let i = 0; i < (o.cnt || 14); i++) {
      const x = (o.x0 || 0) + r() * ((o.x1 || 720) - (o.x0 || 0)), y = (o.y || 900) + r() * (o.spread || 300), h = 8 + r() * 12;
      s += `<path d="M${n(x - 7)} ${n(y)} L${n(x - 3)} ${n(y - h)} L${n(x - 1)} ${n(y)} L${n(x + 1)} ${n(y - h * 1.2)} L${n(x + 3)} ${n(y)} L${n(x + 7)} ${n(y - h * 0.8)} L${n(x + 6)} ${n(y)} Z" fill="${col}"/>`;
    }
    return s;
  };

  // Weg in die Tiefe (Perspektive): von Fluchtpunkt (vx,vy) zu Unterkante
  sc.path = function (o = {}) {
    const { vx = 360, vy = 640, wTop = 40, wBot = 560, yBot = 1300 } = o;
    return `<polygon points="${P([[vx - wTop / 2, vy], [vx + wTop / 2, vy], [vx + wBot / 2, yBot], [vx - wBot / 2, yBot]])}" fill="${T(o.color || '#3a3a3e', o.mood)}"/>` +
      (o.stones ? (() => { const r = HE.rng('pathst'); let s = ''; for (let i = 0; i < 40; i++) { const k = r(); const yy = vy + (yBot - vy) * k * k; const ww = HE.lerp(wTop, wBot, (yy - vy) / (yBot - vy)); s += `<ellipse cx="${n(vx + (r() - 0.5) * ww)}" cy="${n(yy)}" rx="${n(2 + 7 * k)}" ry="${n(1 + 3 * k)}" fill="${T(o.stoneColor || '#5a5a60', o.mood)}" opacity="0.6"/>`; } return s; })() : '');
  };

  // ------------------------------------------------------------------ Bäume & Pflanzen
  sc.palm = function (c, o = {}) {
    const { x = 100, y = 900, h = 300, lean = 0.15 } = o;
    const trunk = T(o.trunk || '#6b5d4c', o.mood), leaf = T(o.leaf || '#3f7b3c', o.mood), leaf2 = T(o.leaf2 || '#2f6230', o.mood);
    const tx = x + lean * h, ty = y - h;
    const sway = Math.sin((c ? c.T : 0) * 0.8 + x) * 3;
    let s = `<path d="M${x - 7} ${y} Q${n(x + lean * h * 0.3)} ${n(y - h * 0.6)} ${n(tx - 3)} ${n(ty)} L${n(tx + 3)} ${n(ty)} Q${n(x + lean * h * 0.3 + 9)} ${n(y - h * 0.6)} ${x + 7} ${y} Z" fill="${trunk}"/>`;
    for (let i = 0; i < 6; i++) s += `<line x1="${n(x + lean * h * (i / 7) - 6)}" y1="${n(y - h * (i / 7))}" x2="${n(x + lean * h * (i / 7) + 6)}" y2="${n(y - h * (i / 7) - 3)}" stroke="${HE.shade(trunk, -0.25)}" stroke-width="1.5"/>`;
    const fr = [-160, -125, -85, -50, -15, 20, 200];
    fr.forEach((deg, i) => {
      const a = ((deg + sway) * Math.PI) / 180, L = h * (0.42 + (i % 2) * 0.08);
      const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.55 + L * 0.25;
      const mx = tx + Math.cos(a) * L * 0.5, my = ty + Math.sin(a) * L * 0.4 - 18;
      s += `<path d="M${n(tx)} ${n(ty)} Q${n(mx)} ${n(my - 10)} ${n(ex)} ${n(ey)} Q${n(mx)} ${n(my + 12)} ${n(tx)} ${n(ty + 4)} Z" fill="${i % 2 ? leaf : leaf2}"/>`;
      // Fiederung
      for (let k = 1; k < 6; k++) { const q = k / 6; const px = HE.lerp(tx, ex, q), py = HE.lerp(ty, ey, q) - Math.sin(q * Math.PI) * 14; s += `<line x1="${n(px)}" y1="${n(py)}" x2="${n(px + Math.cos(a + 1.2) * 14)}" y2="${n(py + 14)}" stroke="${leaf2}" stroke-width="2"/>`; }
    });
    return s;
  };

  sc.pine = function (o = {}) {
    const { x = 100, y = 900, h = 220 } = o;
    const col = T(o.color || '#2c4a3c', o.mood), col2 = HE.shade(col, -0.18);
    let s = `<rect x="${x - 6}" y="${y - h * 0.18}" width="12" height="${h * 0.18}" fill="${T('#4a3a2c', o.mood)}"/>`;
    for (let i = 0; i < 4; i++) {
      const yy = y - h * 0.15 - i * h * 0.2, w = h * (0.5 - i * 0.09);
      s += `<polygon points="${P([[x - w / 2, yy], [x, yy - h * 0.38], [x + w / 2, yy]])}" fill="${i % 2 ? col : col2}"/>`;
      if (o.snow) s += `<polygon points="${P([[x - w * 0.22, yy - h * 0.2], [x, yy - h * 0.38], [x + w * 0.22, yy - h * 0.2], [x + w * 0.1, yy - h * 0.17], [x - w * 0.12, yy - h * 0.19]])}" fill="${T('#eef3f8', o.mood)}"/>`;
    }
    return s;
  };

  // kahler, knorriger Baum (rekursiv)
  sc.bareTree = function (o = {}) {
    const r = HE.rng(o.seed || 'bt');
    const col = T(o.color || '#3b3a40', o.mood);
    let s = '';
    const br = (x, y, len, ang, w, d) => {
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      s += `<line x1="${n(x)}" y1="${n(y)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${col}" stroke-width="${n(w)}" stroke-linecap="round"/>`;
      if (d <= 0) return [[x2, y2]];
      let tips = [];
      const k = 2 + (r() < 0.3 ? 1 : 0);
      for (let i = 0; i < k; i++) tips = tips.concat(br(x2, y2, len * (0.62 + r() * 0.15), ang + (r() - 0.5) * 1.1 + (i - (k - 1) / 2) * 0.55, w * 0.62, d - 1));
      return tips;
    };
    const tips = br(o.x || 360, o.y || 900, o.h ? o.h * 0.32 : 110, -Math.PI / 2 + (r() - 0.5) * 0.2, o.w || 16, o.depth || 4);
    sc._lastTips = tips;
    return s;
  };

  // Frangipani (Friedhofsbaum der Referenz): knorriger grauer Stamm, Blattbüschel mit weißen Blüten
  sc.frangipani = function (o = {}) {
    let s = sc.bareTree(Object.assign({ color: o.trunk || '#7c7f86', depth: 3, w: 15 }, o));
    const tips = sc._lastTips || [];
    const r = HE.rng((o.seed || 'fr') + 'l');
    const leaf = T(o.leaf || '#2f4a3a', o.mood), fl = T(o.flower || '#f4f1e6', o.mood);
    tips.forEach(([x, y]) => {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + r();
        s += `<ellipse cx="${n(x + Math.cos(a) * 9)}" cy="${n(y + Math.sin(a) * 6 - 4)}" rx="12" ry="5" transform="rotate(${n((a * 180) / Math.PI)} ${n(x + Math.cos(a) * 9)} ${n(y + Math.sin(a) * 6 - 4)})" fill="${leaf}"/>`;
      }
      for (let i = 0; i < 3; i++) {
        const fx = x + (r() - 0.5) * 16, fy = y - 8 + (r() - 0.5) * 8;
        for (let p = 0; p < 5; p++) { const a = (p / 5) * Math.PI * 2; s += `<circle cx="${n(fx + Math.cos(a) * 3)}" cy="${n(fy + Math.sin(a) * 3)}" r="2.6" fill="${fl}"/>`; }
        s += `<circle cx="${n(fx)}" cy="${n(fy)}" r="1.4" fill="${T('#f2d27a', o.mood)}"/>`;
      }
    });
    return s;
  };

  sc.roundTree = function (o = {}) {
    const { x = 100, y = 900, h = 200 } = o;
    const col = T(o.color || '#3f6b3f', o.mood);
    let s = `<rect x="${x - 7}" y="${y - h * 0.45}" width="14" height="${h * 0.45}" fill="${T('#5a4632', o.mood)}"/>`;
    const r = HE.rng(o.seed || 'rt');
    for (let i = 0; i < 6; i++) s += `<circle cx="${n(x + (r() - 0.5) * h * 0.5)}" cy="${n(y - h * 0.6 + (r() - 0.5) * h * 0.3)}" r="${n(h * (0.18 + r() * 0.1))}" fill="${i % 2 ? col : HE.shade(col, -0.12)}"/>`;
    return s;
  };

  // Hecke mit Blattmuster (Japan-Szenen der Referenz)
  sc.hedge = function (o = {}) {
    const { x = 0, y = 900, w = 400, h = 260 } = o;
    const col = T(o.color || '#2e6e36', o.mood), lf = T(o.leaf || '#3f8a46', o.mood);
    let s = `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" rx="14" fill="${col}"/>`;
    const r = HE.rng(o.seed || 'hg');
    const cnt = Math.round((w * h) / 1500);
    for (let i = 0; i < cnt; i++) {
      const ex = x + 10 + r() * (w - 20), ey = y - h + 10 + r() * (h - 20);
      s += `<ellipse cx="${n(ex)}" cy="${n(ey)}" rx="${n(9 + r() * 7)}" ry="${n(5 + r() * 3)}" transform="rotate(${n(-30 + r() * 60)} ${n(ex)} ${n(ey)})" fill="${lf}" opacity="${n(0.5 + r() * 0.5)}"/>`;
    }
    return s;
  };

  sc.bush = function (o = {}) {
    const { x = 100, y = 900, w = 90 } = o;
    const col = T(o.color || '#3b6a3c', o.mood);
    return `<ellipse cx="${x - w * 0.25}" cy="${y - w * 0.22}" rx="${w * 0.35}" ry="${w * 0.28}" fill="${HE.shade(col, -0.1)}"/>` +
      `<ellipse cx="${x + w * 0.2}" cy="${y - w * 0.25}" rx="${w * 0.38}" ry="${w * 0.32}" fill="${col}"/>` +
      `<ellipse cx="${x}" cy="${y - w * 0.4}" rx="${w * 0.3}" ry="${w * 0.28}" fill="${HE.shade(col, 0.06)}"/>`;
  };

  sc.sunflower = function (c, o = {}) {
    const { x = 100, y = 900, h = 120 } = o;
    const sway = Math.sin((c ? c.T : 0) * 1.2 + x) * 2;
    let s = `<line x1="${x}" y1="${y}" x2="${n(x + sway)}" y2="${y - h}" stroke="${T('#4d7a32', o.mood)}" stroke-width="5"/>`;
    s += `<ellipse cx="${x - 10}" cy="${y - h * 0.45}" rx="12" ry="5" fill="${T('#4d7a32', o.mood)}" transform="rotate(-30 ${x - 10} ${y - h * 0.45})"/>`;
    for (let p = 0; p < 12; p++) { const a = (p / 12) * Math.PI * 2; s += `<ellipse cx="${n(x + sway + Math.cos(a) * 15)}" cy="${n(y - h + Math.sin(a) * 15)}" rx="9" ry="4.5" transform="rotate(${n((a * 180) / Math.PI)} ${n(x + sway + Math.cos(a) * 15)} ${n(y - h + Math.sin(a) * 15)})" fill="${T('#f2b51c', o.mood)}"/>`; }
    s += `<circle cx="${n(x + sway)}" cy="${y - h}" r="10" fill="${T('#5a3a1c', o.mood)}"/>`;
    return s;
  };


  // ------------------------------------------------------------------ Felder, Kirche, Vögel (Tag/Land)
  // Kornfeld mit wogenden Ähren. y = Oberkante des Feldes. far:true → feine Ferne-Textur
  sc.wheat = function (c, o = {}) {
    const { y = 900, x0 = -400, x1 = 1120, h = 1800, scale = 1 } = o;
    const col = T(o.color || '#d9b45c', o.mood), col2 = T(o.color2 || '#a9792f', o.mood), ear = T(o.ear || '#e9c873', o.mood);
    const r = HE.rng(o.seed || 'wh' + y);
    let s = `<rect x="${x0}" y="${n(y)}" width="${x1 - x0}" height="${h}" fill="${HE.lg([[0, HE.shade(col, 0.08)], [1, col2]], 0, 0, 0, 1)}"/>`;
    const T0 = c ? c.T : 0;
    const cnt = Math.round(((x1 - x0) / (o.far ? 9 : 14)) * (o.density || 1));
    for (let i = 0; i < cnt; i++) {
      const x = x0 + r() * (x1 - x0), yy = y + r() * (o.far ? 30 : 60) * scale;
      const L = (o.far ? 18 : 46 + r() * 30) * scale;
      const wind = Math.sin(T0 * 1.3 + x * 0.018) * 0.12 + Math.sin(T0 * 0.6 + x * 0.004) * 0.08;
      const tx = x + Math.sin(wind) * L, ty = yy - Math.cos(wind) * L;
      s += `<line x1="${n(x)}" y1="${n(yy + L * 0.6)}" x2="${n(tx)}" y2="${n(ty)}" stroke="${r() < 0.5 ? col2 : HE.shade(col, -0.05)}" stroke-width="${n(1.4 * scale)}"/>`;
      s += `<ellipse cx="${n(tx)}" cy="${n(ty)}" rx="${n(2.6 * scale)}" ry="${n(7 * scale)}" transform="rotate(${n((wind * 180) / Math.PI)} ${n(tx)} ${n(ty)})" fill="${r() < 0.6 ? ear : col}"/>`;
    }
    return s;
  };

  // Dorfkirche mit Turm und Uhr (x = Turmmitte, y = Boden, s = Skalierung)
  sc.church = function (o = {}) {
    const { x = 200, y = 700, s: k = 1 } = o;
    const wall = T(o.wall || '#e9e3d4', o.mood), roof = T(o.roof || '#8a4a3a', o.mood), dk = HE.shade(wall, -0.22);
    let g = `<rect x="20" y="-90" width="150" height="90" fill="${wall}"/><polygon points="12,-88 95,-140 178,-88" fill="${roof}"/>`;
    g += `<rect x="60" y="-70" width="14" height="30" rx="7" fill="${dk}"/><rect x="110" y="-70" width="14" height="30" rx="7" fill="${dk}"/>`;
    g += `<rect x="-26" y="-230" width="52" height="230" fill="${wall}"/><rect x="-26" y="-230" width="8" height="230" fill="${dk}" opacity="0.5"/>`;
    g += `<polygon points="-30,-228 0,-330 30,-228" fill="${roof}"/><line x1="0" y1="-330" x2="0" y2="-352" stroke="${T('#3a3a3a', o.mood)}" stroke-width="3"/><line x1="-8" y1="-344" x2="8" y2="-344" stroke="${T('#3a3a3a', o.mood)}" stroke-width="3"/>`;
    g += `<rect x="-12" y="-214" width="24" height="26" rx="12" fill="${T('#2a2420', o.mood)}"/>`;
    g += `<circle cx="0" cy="-160" r="15" fill="${T('#f4efe2', o.mood)}" stroke="${T('#3a3a3a', o.mood)}" stroke-width="2.5"/><line x1="0" y1="-160" x2="0" y2="-171" stroke="#222" stroke-width="2.5"/><line x1="0" y1="-160" x2="0" y2="-173" stroke="#222" stroke-width="1.5"/>`;
    g += `<rect x="-10" y="-40" width="20" height="40" rx="10" fill="${T('#5a3a28', o.mood)}"/>`;
    return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(k)})">${g}</g>`;
  };

  // fliegende Krähen
  sc.crows = function (c, o = {}) {
    const r = HE.rng(o.seed || 'crow');
    let s = '';
    for (let i = 0; i < (o.cnt || 3); i++) {
      const sp = 30 + r() * 30, x = ((r() * 900 + c.T * sp * (o.dir || 1)) % 1000) - 140, y = (o.y || 200) + r() * (o.h || 120) + Math.sin(c.T * 1.5 + i) * 6;
      const f = Math.sin(c.T * (7 + r() * 3) + i * 2), sz = (o.size || 14) * (0.7 + r() * 0.6);
      s += `<path d="M${n(x - sz)} ${n(y - f * sz * 0.6)} Q${n(x - sz * 0.4)} ${n(y - sz * 0.15)} ${n(x)} ${n(y)} Q${n(x + sz * 0.4)} ${n(y - sz * 0.15)} ${n(x + sz)} ${n(y - f * sz * 0.6)} Q${n(x + sz * 0.4)} ${n(y + sz * 0.1)} ${n(x)} ${n(y + sz * 0.28)} Q${n(x - sz * 0.4)} ${n(y + sz * 0.1)} ${n(x - sz)} ${n(y - f * sz * 0.6)} Z" fill="${T(o.color || '#1b1b1f', o.mood)}"/>`;
    }
    return s;
  };

  // ------------------------------------------------------------------ Gebäude
  // Haus (Seitenansicht). style: 'tile' (Ziegeldach, Java), 'gable' (Satteldach, Europa), 'jp' (dunkles Ziegeldach),
  // 'cabin' (Holzhütte), 'snow' (Satteldach + Schnee). lit: Fenster leuchten warm.
  sc.house = function (o = {}) {
    const { x = 360, y = 900, w = 300, h = 150, style = 'gable', mood } = o;
    const wall = T(o.wall || (style === 'cabin' ? '#7a5a40' : '#e6e1d4'), mood);
    const roof = T(o.roof || (style === 'tile' ? '#c0623e' : style === 'jp' ? '#3c4452' : '#8a3c34'), mood);
    const trim = T(o.trim || '#5c6b5a', mood);
    const rh = o.roofH || (style === 'jp' ? h * 0.55 : h * 0.75);
    const L = x - w / 2, R = x + w / 2, top = y - h;
    let s = '';
    if (o.shadow !== false) s += `<ellipse cx="${x}" cy="${y + 4}" rx="${w * 0.55}" ry="10" fill="#000" opacity="0.18"/>`;
    s += `<rect x="${n(L)}" y="${n(top)}" width="${w}" height="${h}" fill="${wall}"/>`;
    if (style === 'cabin') for (let i = 1; i < 6; i++) s += `<line x1="${n(L)}" y1="${n(top + (i * h) / 6)}" x2="${n(R)}" y2="${n(top + (i * h) / 6)}" stroke="${HE.shade(wall, -0.25)}" stroke-width="2"/>`;
    s += `<rect x="${n(L)}" y="${n(y - 14)}" width="${w}" height="14" fill="${HE.shade(wall, -0.18)}"/>`;
    // Dach
    const ov = o.overhang || 26;
    if (style === 'tile' || style === 'jp') {
      s += `<polygon points="${P([[L - ov, top + 6], [L + w * 0.18, top - rh], [R - w * 0.18, top - rh], [R + ov, top + 6]])}" fill="${roof}"/>`;
      for (let i = 1; i < 7; i++) { const yy = top - rh + (i * (rh + 6)) / 7; const k = (yy - (top - rh)) / (rh + 6); s += `<line x1="${n(L + w * 0.18 - k * (w * 0.18 + ov))}" y1="${n(yy)}" x2="${n(R - w * 0.18 + k * (w * 0.18 + ov))}" y2="${n(yy)}" stroke="${HE.shade(roof, -0.2)}" stroke-width="1.6"/>`; }
      for (let i = 0; i < 18; i++) { const xx = L - ov + (i + 0.5) * ((w + 2 * ov) / 18); s += `<line x1="${n(xx)}" y1="${n(top + 6)}" x2="${n(HE.lerp(xx, x, 0.3))}" y2="${n(top - rh)}" stroke="${HE.shade(roof, -0.12)}" stroke-width="1" opacity="0.6"/>`; }
      if (style === 'jp') s += `<path d="M${n(L - ov - 8)} ${n(top + 2)} Q${n(L - ov + 10)} ${n(top + 8)} ${n(L - ov + 26)} ${n(top + 4)}" stroke="${roof}" stroke-width="6" fill="none"/>`;
    } else {
      s += `<polygon points="${P([[L - ov, top + 4], [x, top - rh], [R + ov, top + 4]])}" fill="${roof}"/>`;
      s += `<polygon points="${P([[L - ov, top + 4], [x, top - rh], [x, top - rh + 10], [L - ov + 14, top + 4]])}" fill="${HE.shade(roof, -0.15)}"/>`;
      if (style === 'snow' || o.snow) s += `<path d="M${n(L - ov - 4)} ${n(top + 6)} L${n(x)} ${n(top - rh - 4)} L${n(R + ov + 4)} ${n(top + 6)} L${n(R + ov - 6)} ${n(top + 12)} Q${n(x + w * 0.2)} ${n(top - rh * 0.4)} ${n(x)} ${n(top - rh + 14)} Q${n(x - w * 0.25)} ${n(top - rh * 0.35)} ${n(L - ov + 4)} ${n(top + 12)} Z" fill="${T('#eef3f8', mood)}"/>`;
    }
    // Tür
    const dw = o.doorW || Math.min(60, w * 0.18), dh = Math.min(h * 0.72, 110);
    const dx = o.doorX != null ? o.doorX : x - dw / 2 + (o.doorOffset || 0);
    if (o.door !== false) {
      const dc = T(o.doorColor || '#6a4030', mood);
      s += `<rect x="${n(dx)}" y="${n(y - 14 - dh)}" width="${n(dw)}" height="${n(dh)}" fill="${dc}"/>`;
      s += `<rect x="${n(dx + 5)}" y="${n(y - 14 - dh + 6)}" width="${n(dw / 2 - 7)}" height="${n(dh - 12)}" fill="none" stroke="${HE.shade(dc, -0.25)}" stroke-width="2"/>`;
      s += `<rect x="${n(dx + dw / 2 + 2)}" y="${n(y - 14 - dh + 6)}" width="${n(dw / 2 - 7)}" height="${n(dh - 12)}" fill="none" stroke="${HE.shade(dc, -0.25)}" stroke-width="2"/>`;
      if (o.doorOpen) s += `<rect x="${n(dx)}" y="${n(y - 14 - dh)}" width="${n(dw * o.doorOpen)}" height="${n(dh)}" fill="${T('#140e0a', mood)}"/>`;
    }
    // Fenster
    const nwin = o.windows != null ? o.windows : 2;
    for (let i = 0; i < nwin; i++) {
      const side = i % 2 === 0 ? -1 : 1, slot = Math.floor(i / 2);
      const ww = Math.min(54, w * 0.15), wh = Math.min(h * 0.42, 62);
      const wx = x + side * (dw / 2 + 26 + slot * (ww + 30)) - (side < 0 ? ww : 0), wy = top + h * 0.22;
      if (wx < L + 6 || wx + ww > R - 6) continue;
      s += sc.window({ x: wx, y: wy, w: ww, h: wh, lit: o.lit, mood, shutters: o.shutters !== false && style === 'tile', frame: o.winFrame, glow: o.lit });
    }
    if (o.chimney) s += `<rect x="${n(x + w * 0.22)}" y="${n(top - rh * 0.7)}" width="18" height="${n(rh * 0.5)}" fill="${T('#6a5a52', mood)}"/>`;
    return s;
  };

  // Fenster (außen oder innen). lit → warmes Licht. night/outside → Nachtblick
  sc.window = function (o = {}) {
    const { x = 0, y = 0, w = 60, h = 70, mood } = o;
    const frame = T(o.frame || '#f2efe6', mood);
    const glass = o.lit ? T('#ffd27a', mood === 'night' || mood === 'snow' ? null : mood) : T(o.glass || '#2d3a4a', mood);
    let s = '';
    if (o.lit && o.glow !== false) s += HE.fx.glow(x + w / 2, y + h / 2, Math.max(w, h) * 1.5, '#ffcc66', 0.35);
    s += `<rect x="${n(x - 4)}" y="${n(y - 4)}" width="${n(w + 8)}" height="${n(h + 8)}" fill="${frame}"/>`;
    s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${glass}"/>`;
    if (o.inside) s += o.inside;
    if (!o.lit) s += `<polygon points="${P([[x + w * 0.15, y + h], [x + w * 0.6, y], [x + w * 0.85, y], [x + w * 0.4, y + h]])}" fill="#fff" opacity="0.06"/>`;
    s += `<line x1="${n(x + w / 2)}" y1="${n(y)}" x2="${n(x + w / 2)}" y2="${n(y + h)}" stroke="${frame}" stroke-width="3"/>`;
    s += `<line x1="${n(x)}" y1="${n(y + h / 2)}" x2="${n(x + w)}" y2="${n(y + h / 2)}" stroke="${frame}" stroke-width="3"/>`;
    if (o.shutters) {
      const sh = T(o.shutterColor || '#5a7a5c', mood);
      s += `<rect x="${n(x - 4 - w * 0.42)}" y="${n(y - 4)}" width="${n(w * 0.42)}" height="${n(h + 8)}" fill="${sh}"/>`;
      s += `<rect x="${n(x + w + 4)}" y="${n(y - 4)}" width="${n(w * 0.42)}" height="${n(h + 8)}" fill="${sh}"/>`;
      for (let i = 1; i < 6; i++) { s += `<line x1="${n(x - 4 - w * 0.42)}" y1="${n(y - 4 + (i * (h + 8)) / 6)}" x2="${n(x - 4)}" y2="${n(y - 4 + (i * (h + 8)) / 6)}" stroke="${HE.shade(sh, -0.25)}" stroke-width="1.5"/>`; s += `<line x1="${n(x + w + 4)}" y1="${n(y - 4 + (i * (h + 8)) / 6)}" x2="${n(x + w + 4 + w * 0.42)}" y2="${n(y - 4 + (i * (h + 8)) / 6)}" stroke="${HE.shade(sh, -0.25)}" stroke-width="1.5"/>`; }
    }
    return s;
  };

  // Mauer / Friedhofsmauer
  sc.wall = function (o = {}) {
    const { x0 = -100, x1 = 820, y = 900, h = 90 } = o;
    const col = T(o.color || '#c9c6bd', o.mood);
    let s = `<rect x="${x0}" y="${y - h}" width="${x1 - x0}" height="${h}" fill="${col}"/>`;
    s += `<rect x="${x0}" y="${y - h - 8}" width="${x1 - x0}" height="10" fill="${HE.shade(col, -0.25)}"/>`;
    s += `<rect x="${x0}" y="${y - 10}" width="${x1 - x0}" height="10" fill="${HE.shade(col, -0.15)}"/>`;
    if (o.posts) for (let px = x0 + 40; px < x1; px += o.posts) s += `<rect x="${px}" y="${y - h - 16}" width="22" height="${h + 16}" fill="${HE.shade(col, 0.05)}"/><rect x="${px}" y="${y - h - 20}" width="22" height="6" fill="${HE.shade(col, -0.3)}"/>`;
    return s;
  };

  // Tor mit zwei spitzen Pfeilern (Friedhofseingang)
  sc.gate = function (o = {}) {
    const { x = 360, y = 900, w = 120, h = 150 } = o;
    const col = T(o.color || '#d7d4cc', o.mood), dk = HE.shade(col, -0.3);
    const pil = (px) => `<rect x="${n(px - 16)}" y="${n(y - h)}" width="32" height="${h}" fill="${col}"/><polygon points="${P([[px - 18, y - h], [px, y - h - 34], [px + 18, y - h]])}" fill="${col}"/><rect x="${n(px - 16)}" y="${n(y - h)}" width="6" height="${h}" fill="${dk}" opacity="0.4"/>`;
    return (o.dark ? `<rect x="${n(x - w / 2 + 16)}" y="${n(y - h + 10)}" width="${n(w - 32)}" height="${h - 10}" fill="${T(o.dark, o.mood)}"/>` : '') + pil(x - w / 2) + pil(x + w / 2);
  };

  // Strommast mit Leitungen bis nextX
  sc.pole = function (o = {}) {
    const { x = 600, y = 900, h = 320, nextX } = o;
    const col = T(o.color || '#4a4038', o.mood);
    let s = `<rect x="${x - 5}" y="${y - h}" width="10" height="${h}" fill="${col}"/><rect x="${x - 34}" y="${y - h + 22}" width="68" height="6" fill="${col}"/><rect x="${x - 24}" y="${y - h + 44}" width="48" height="5" fill="${col}"/>`;
    if (nextX != null) for (const k of [-30, -10, 10, 30]) s += `<path d="M${x + k} ${y - h + 22} Q${n((x + nextX) / 2)} ${y - h + 62} ${nextX + k} ${y - h + 22}" stroke="${T('#2a2a2a', o.mood)}" stroke-width="1.4" fill="none"/>`;
    return s;
  };

  // Straßenlaterne mit Lichtkegel und Lichtpfütze
  sc.lamp = function (c, o = {}) {
    const { x = 200, y = 900, h = 260, on = true } = o;
    const col = T(o.color || '#2e3440', o.mood), light = o.light || '#f6e7b8';
    const fl = o.flicker ? HE.flicker(c.T, x, 0.5) : 1;
    let s = '';
    if (on) {
      s += `<polygon points="${P([[x + 22, y - h + 14], [x + 22 + 150, y + 6], [x + 22 - 150, y + 6]])}" fill="${HE.lg([[0, light, 0.32 * fl], [1, light, 0]], 0, 0, 0, 1)}"/>`;
      s += `<ellipse cx="${x + 22}" cy="${y + 4}" rx="150" ry="22" fill="${light}" opacity="${n(0.18 * fl)}"/>`;
    }
    s += `<rect x="${x - 4}" y="${y - h}" width="8" height="${h}" fill="${col}"/>`;
    s += `<path d="M${x} ${y - h} Q${x} ${y - h - 16} ${x + 22} ${y - h - 10}" stroke="${col}" stroke-width="6" fill="none"/>`;
    s += `<rect x="${x + 10}" y="${y - h - 12}" width="26" height="10" rx="3" fill="${col}"/>`;
    if (on) s += HE.fx.glow(x + 23, y - h, 60, light, 0.8 * fl) + `<rect x="${x + 13}" y="${y - h - 3}" width="20" height="5" fill="#fffbe8" opacity="${n(fl)}"/>`;
    return s;
  };

  // Gleise (Seitenansicht)
  sc.rails = function (o = {}) {
    const { y = 950, x0 = -200, x1 = 920 } = o;
    const col = T(o.color || '#3a3a3e', o.mood);
    let s = `<rect x="${x0}" y="${y - 6}" width="${x1 - x0}" height="16" fill="${T('#5a5550', o.mood)}"/>`;
    for (let xx = x0; xx < x1; xx += 26) s += `<rect x="${xx}" y="${y - 4}" width="14" height="12" fill="${T('#4a3a2e', o.mood)}"/>`;
    s += `<rect x="${x0}" y="${y - 10}" width="${x1 - x0}" height="5" fill="${col}"/><rect x="${x0}" y="${y - 10}" width="${x1 - x0}" height="1.5" fill="${T('#9aa0a8', o.mood)}"/>`;
    return s;
  };

  // Bahnübergang mit blinkenden Lichtern
  sc.crossing = function (c, o = {}) {
    const { x = 500, y = 900, on = true } = o;
    const col = T('#2b2b2e', o.mood);
    const blink = on ? (Math.floor(c.T * 2.2) % 2) : -1;
    let s = `<rect x="${x - 4}" y="${y - 230}" width="8" height="230" fill="${col}"/>`;
    s += `<g transform="translate(${x} ${y - 200}) rotate(45)"><rect x="-40" y="-6" width="80" height="12" fill="${T('#f2f2f2', o.mood)}"/><rect x="-40" y="-6" width="80" height="12" fill="none" stroke="${T('#d23a2a', o.mood)}" stroke-width="2"/></g>`;
    s += `<g transform="translate(${x} ${y - 200}) rotate(-45)"><rect x="-40" y="-6" width="80" height="12" fill="${T('#f2f2f2', o.mood)}"/><rect x="-40" y="-6" width="80" height="12" fill="none" stroke="${T('#d23a2a', o.mood)}" stroke-width="2"/></g>`;
    s += `<rect x="${x - 34}" y="${y - 160}" width="68" height="26" rx="13" fill="${col}"/>`;
    [-1, 1].forEach((sd, i) => {
      const lit = blink === i;
      s += `<circle cx="${x + sd * 20}" cy="${y - 147}" r="10" fill="${lit ? '#ff3b2f' : T('#4a1a18', o.mood)}"/>`;
      if (lit) s += HE.fx.glow(x + sd * 20, y - 147, 70, '#ff3b2f', 0.55);
    });
    return s;
  };

  // Zug (Seitenansicht), fährt mit o.x
  sc.train = function (o = {}) {
    const { x = 0, y = 940, cars = 3, carW = 360, h = 130 } = o;
    const body = T(o.color || '#d9dee3', o.mood), stripe = T(o.stripe || '#2f8a4a', o.mood);
    let s = '';
    for (let k = 0; k < cars; k++) {
      const L = x + k * (carW + 10);
      s += `<rect x="${n(L)}" y="${y - h - 14}" width="${carW}" height="${h}" rx="10" fill="${body}"/>`;
      s += `<rect x="${n(L)}" y="${y - 50}" width="${carW}" height="10" fill="${stripe}"/>`;
      for (let i = 0; i < 6; i++) s += `<rect x="${n(L + 20 + i * ((carW - 40) / 6))}" y="${y - h + 6}" width="${n((carW - 40) / 6 - 12)}" height="40" rx="4" fill="${o.lit ? '#ffe9a8' : T('#2a3644', o.mood)}"/>`;
      s += `<circle cx="${n(L + 50)}" cy="${y - 10}" r="13" fill="${T('#2a2a2a', o.mood)}"/><circle cx="${n(L + carW - 50)}" cy="${y - 10}" r="13" fill="${T('#2a2a2a', o.mood)}"/>`;
    }
    return s;
  };

  // Kleinbus / Auto (Seitenansicht)
  sc.van = function (o = {}) {
    const { x = 360, y = 940, w = 300, facing = 1 } = o;
    const col = T(o.color || '#e9e9e4', o.mood), win = T(o.glass || '#5f7f9a', o.mood);
    let s = `<g transform="translate(${x} ${y}) scale(${facing} 1)">`;
    s += `<ellipse cx="0" cy="4" rx="${w * 0.55}" ry="10" fill="#000" opacity="0.25"/>`;
    s += `<path d="M${-w / 2} -26 L${-w / 2} -${w * 0.42} Q${-w / 2} -${w * 0.47} ${-w / 2 + 14} -${w * 0.47} L${w * 0.28} -${w * 0.47} L${w / 2} -${w * 0.25} L${w / 2} -26 Z" fill="${col}"/>`;
    for (let i = 0; i < 3; i++) s += `<rect x="${n(-w / 2 + 16 + i * w * 0.24)}" y="-${n(w * 0.42)}" width="${n(w * 0.2)}" height="${n(w * 0.13)}" rx="4" fill="${win}"/>`;
    s += `<polygon points="${P([[w * 0.26, -w * 0.42], [w * 0.44, -w * 0.27], [w * 0.26, -w * 0.27]])}" fill="${win}"/>`;
    s += `<rect x="${-w / 2}" y="-34" width="${w}" height="8" fill="${HE.shade(col, -0.2)}"/>`;
    [-w * 0.3, w * 0.3].forEach((wx) => { s += `<circle cx="${n(wx)}" cy="-14" r="${n(w * 0.075)}" fill="${T('#232323', o.mood)}"/><circle cx="${n(wx)}" cy="-14" r="${n(w * 0.035)}" fill="${T('#9a9a9a', o.mood)}"/>`; });
    if (o.lights) s += HE.fx.glow(w / 2, -40, 60, '#fff2c0', 0.7);
    s += `</g>`;
    return s;
  };

  // Grabsteine
  sc.tomb = function (o = {}) {
    const { x = 300, y = 900, w = 34, h = 60, style = 'round' } = o;
    const col = T(o.color || '#a9a7a0', o.mood), dk = HE.shade(col, -0.25);
    let s = `<ellipse cx="${x}" cy="${y + 2}" rx="${w * 0.8}" ry="5" fill="#000" opacity="0.2"/>`;
    if (style === 'round') s += `<path d="M${x - w / 2} ${y} L${x - w / 2} ${y - h + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w / 2} ${y - h + w / 2} L${x + w / 2} ${y} Z" fill="${col}"/>`;
    else if (style === 'cross') s += `<rect x="${x - 5}" y="${y - h}" width="10" height="${h}" fill="${col}"/><rect x="${x - 18}" y="${y - h + 14}" width="36" height="9" fill="${col}"/>`;
    else if (style === 'post') s += `<polygon points="${P([[x - w / 4, y], [x - w / 4, y - h], [x, y - h - 10], [x + w / 4, y - h], [x + w / 4, y]])}" fill="${col}"/>`;
    else s += `<rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" fill="${col}"/>`;
    s += `<rect x="${x - w / 2}" y="${y - h * 0.15}" width="${w}" height="${h * 0.15}" fill="${dk}" opacity="0.5"/>`;
    return s;
  };
  // Grabhügel mit Blüten
  sc.grave = function (o = {}) {
    const { x = 360, y = 900, w = 160 } = o;
    const r = HE.rng(o.seed || 'gv');
    let s = `<ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${w * 0.12}" fill="${T(o.color || '#4a3a30', o.mood)}"/>`;
    for (let i = 0; i < (o.petals || 26); i++) s += `<ellipse cx="${n(x + (r() - 0.5) * w * 0.8)}" cy="${n(y + (r() - 0.5) * w * 0.15)}" rx="4" ry="2.4" fill="${T(r() < 0.6 ? '#e8707a' : '#f2efe6', o.mood)}"/>`;
    return s;
  };
  // gelber Begräbnis-Schirm
  sc.umbrella = function (o = {}) {
    const { x = 300, y = 900, h = 150, w = 120 } = o;
    const col = T(o.color || '#d9b44a', o.mood);
    return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - h}" stroke="${T('#5a4a3a', o.mood)}" stroke-width="3"/>` +
      `<path d="M${x - w / 2} ${y - h + 20} Q${x} ${y - h - 22} ${x + w / 2} ${y - h + 20} Z" fill="${col}"/>` +
      `<path d="M${x - w / 2} ${y - h + 20} L${x + w / 2} ${y - h + 20}" stroke="${HE.shade(col, -0.25)}" stroke-width="2"/>`;
  };
  // Steinstatue (Jizo) mit rotem Lätzchen
  sc.statue = function (o = {}) {
    const { x = 300, y = 900, s: k = 1 } = o;
    const col = T(o.color || '#8e8d88', o.mood);
    return `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-26" y="-14" width="52" height="14" fill="${HE.shade(col, -0.2)}"/>` +
      `<path d="M-20 -14 L-20 -60 Q-20 -76 0 -76 Q20 -76 20 -60 L20 -14 Z" fill="${col}"/><circle cx="0" cy="-88" r="16" fill="${col}"/>` +
      `<path d="M-14 -66 L14 -66 L8 -44 L-8 -44 Z" fill="${T('#c0392b', o.mood)}"/><path d="M-6 -90 L-2 -90 M2 -90 L6 -90" stroke="${HE.shade(col, -0.4)}" stroke-width="1.5"/></g>`;
  };

  // ------------------------------------------------------------------ Innenräume
  // Raum: Wand + Vertäfelung + Boden. floorY = Oberkante Boden
  sc.room = function (o = {}) {
    const { floorY = 900, mood } = o;
    const wall = T(o.wall || '#4f6a66', mood), wain = T(o.wainscot || '#6b4a36', mood), floor = T(o.floor || '#4a3a2e', mood);
    const wh = o.wainscotH != null ? o.wainscotH : 150;
    let s = `<rect x="-300" y="-300" width="1320" height="${floorY + 300}" fill="${wall}"/>`;
    if (o.pattern) s += `<rect x="-300" y="-300" width="1320" height="${floorY + 300}" fill="${HE.grainPattern(0.06, 3, 33)}"/>`;
    if (wh > 0) {
      s += `<rect x="-300" y="${floorY - wh}" width="1320" height="${wh}" fill="${wain}"/>`;
      s += `<rect x="-300" y="${floorY - wh - 6}" width="1320" height="8" fill="${HE.shade(wain, -0.2)}"/>`;
      for (let xx = -300; xx < 1020; xx += 46) s += `<line x1="${xx}" y1="${floorY - wh}" x2="${xx}" y2="${floorY}" stroke="${HE.shade(wain, -0.18)}" stroke-width="2"/>`;
    }
    s += `<rect x="-300" y="${floorY}" width="1320" height="900" fill="${floor}"/>`;
    for (let i = 1; i < 8; i++) s += `<line x1="-300" y1="${floorY + i * i * 7}" x2="1020" y2="${floorY + i * i * 7}" stroke="${HE.shade(floor, -0.15)}" stroke-width="1.5"/>`;
    return s;
  };
  // Japanischer Raum: Shoji-Wand + Tatami
  sc.shoji = function (o = {}) {
    const { x = 0, y = 300, w = 300, h = 400, lit } = o;
    const fr = T(o.frame || '#5a3e2a', o.mood), pap = lit ? T('#f7e2b0', o.mood === 'night' ? 'dusk' : o.mood) : T(o.paper || '#e9dfc8', o.mood);
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${pap}"/>`;
    for (let i = 1; i < 4; i++) s += `<line x1="${x + (i * w) / 4}" y1="${y}" x2="${x + (i * w) / 4}" y2="${y + h}" stroke="${fr}" stroke-width="2"/>`;
    for (let i = 1; i < 6; i++) s += `<line x1="${x}" y1="${y + (i * h) / 6}" x2="${x + w}" y2="${y + (i * h) / 6}" stroke="${fr}" stroke-width="2"/>`;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${fr}" stroke-width="6"/>`;
    return s;
  };
  sc.door = function (o = {}) {
    const { x = 500, y = 900, w = 110, h = 230, open = 0 } = o;
    const col = T(o.color || '#6a4632', o.mood);
    let s = `<rect x="${x - 6}" y="${y - h - 6}" width="${w + 12}" height="${h + 6}" fill="${HE.shade(col, -0.3)}"/>`;
    s += `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${T(o.behind || '#0b0a0a', o.mood)}"/>`;
    const dw = w * (1 - open * 0.85);
    s += `<rect x="${x}" y="${y - h}" width="${n(dw)}" height="${h}" fill="${col}"/>`;
    if (dw > 30) {
      s += `<rect x="${x + 12}" y="${y - h + 16}" width="${n(dw - 24)}" height="${n(h * 0.36)}" fill="none" stroke="${HE.shade(col, -0.25)}" stroke-width="3"/>`;
      s += `<rect x="${x + 12}" y="${y - h * 0.52}" width="${n(dw - 24)}" height="${n(h * 0.42)}" fill="none" stroke="${HE.shade(col, -0.25)}" stroke-width="3"/>`;
      s += `<circle cx="${n(x + dw - 16)}" cy="${y - h * 0.48}" r="5" fill="${T('#d8b86a', o.mood)}"/>`;
    }
    return s;
  };
  sc.clock = function (o = {}) {
    const { x = 600, y = 300, r = 26, time = 1.0 } = o; // time in Stunden (z. B. 1.25 = 1:15)
    const hA = ((time % 12) / 12) * Math.PI * 2 - Math.PI / 2, mA = (time % 1) * Math.PI * 2 - Math.PI / 2;
    return `<circle cx="${x}" cy="${y}" r="${r + 4}" fill="${T('#2a2a2a', o.mood)}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${T('#efece4', o.mood)}"/>` +
      `<line x1="${x}" y1="${y}" x2="${n(x + Math.cos(hA) * r * 0.5)}" y2="${n(y + Math.sin(hA) * r * 0.5)}" stroke="#222" stroke-width="3" stroke-linecap="round"/>` +
      `<line x1="${x}" y1="${y}" x2="${n(x + Math.cos(mA) * r * 0.8)}" y2="${n(y + Math.sin(mA) * r * 0.8)}" stroke="#222" stroke-width="2" stroke-linecap="round"/>`;
  };
  sc.calendar = function (o = {}) {
    const { x = 520, y = 260, w = 44, h = 56 } = o;
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${T('#efece4', o.mood)}"/><rect x="${x}" y="${y}" width="${w}" height="${h * 0.22}" fill="${T('#c8423a', o.mood)}"/>`;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) s += `<rect x="${n(x + 5 + j * (w - 10) / 5)}" y="${n(y + h * 0.3 + i * h * 0.16)}" width="4" height="4" fill="${T('#a03a34', o.mood)}" opacity="0.7"/>`;
    return s;
  };
  sc.picture = function (o = {}) {
    const { x = 120, y = 260, w = 50, h = 62 } = o;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${T('#5a3a26', o.mood)}"/><rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" fill="${T('#c9c2b2', o.mood)}"/>` +
      `<circle cx="${x + w / 2}" cy="${y + h * 0.42}" r="${w * 0.14}" fill="${T('#5a5048', o.mood)}"/><rect x="${x + w * 0.3}" y="${y + h * 0.56}" width="${w * 0.4}" height="${h * 0.3}" fill="${T('#5a5048', o.mood)}"/>`;
  };
  // hängende Glühbirne mit (flackerndem) Lichtschein
  sc.bulb = function (c, o = {}) {
    const { x = 360, y = 200, len = 200, color = '#c8f0a0', on = true } = o;
    const fl = o.flicker ? HE.flicker(c.T, 4, o.flicker) : 1;
    let s = `<line x1="${x}" y1="${y - len}" x2="${x}" y2="${y}" stroke="#151515" stroke-width="2"/>`;
    if (on) s += HE.fx.glow(x, y + 6, o.r || 240, color, 0.55 * fl);
    s += `<rect x="${x - 4}" y="${y - 2}" width="8" height="7" fill="#333"/><circle cx="${x}" cy="${y + 10}" r="7" fill="${on ? '#fbffe8' : '#777'}" opacity="${on ? n(0.6 + 0.4 * fl) : 1}"/>`;
    return s;
  };
  sc.bed = function (o = {}) {
    const { x = 360, y = 980, w = 300, blanket = '#2f4a8a' } = o;
    const fr = T(o.frame || '#5a3a2a', o.mood);
    let s = `<rect x="${x - w / 2}" y="${y - 70}" width="12" height="70" fill="${fr}"/><rect x="${x + w / 2 - 12}" y="${y - 50}" width="12" height="50" fill="${fr}"/>`;
    s += `<rect x="${x - w / 2}" y="${y - 44}" width="${w}" height="26" fill="${fr}"/>`;
    s += `<rect x="${x - w / 2 + 10}" y="${y - 58}" width="${w * 0.25}" height="18" rx="8" fill="${T('#efece4', o.mood)}"/>`;
    if (o.covered !== false) s += `<path d="M${x - w / 2 + w * 0.22} ${y - 44} Q${x} ${y - 76} ${x + w / 2 - 6} ${y - 48} L${x + w / 2 - 6} ${y - 24} L${x - w / 2 + w * 0.22} ${y - 24} Z" fill="${T(blanket, o.mood)}"/>`;
    return s;
  };
  sc.futon = function (o = {}) {
    const { x = 360, y = 980, w = 320 } = o;
    return `<rect x="${x - w / 2}" y="${y - 18}" width="${w}" height="18" rx="6" fill="${T('#e9e2d0', o.mood)}"/>` +
      `<rect x="${x - w / 2 + 8}" y="${y - 30}" width="${w * 0.22}" height="14" rx="6" fill="${T('#f4f0e6', o.mood)}"/>` +
      (o.covered !== false ? `<path d="M${x - w / 2 + w * 0.2} ${y - 18} Q${x} ${y - 52} ${x + w / 2} ${y - 22} L${x + w / 2} ${y - 6} L${x - w / 2 + w * 0.2} ${y - 6} Z" fill="${T(o.blanket || '#3d5a9a', o.mood)}"/>` : '');
  };
  sc.table = function (o = {}) {
    const { x = 360, y = 900, w = 160, h = 70 } = o;
    const col = T(o.color || '#6a4a34', o.mood);
    return `<rect x="${x - w / 2}" y="${y - h}" width="${w}" height="10" fill="${col}"/><rect x="${x - w / 2 + 8}" y="${y - h}" width="8" height="${h}" fill="${HE.shade(col, -0.2)}"/><rect x="${x + w / 2 - 16}" y="${y - h}" width="8" height="${h}" fill="${HE.shade(col, -0.2)}"/>`;
  };
  // Papierlaterne (Boden)
  sc.lantern = function (c, o = {}) {
    const { x = 500, y = 900, h = 60 } = o;
    const fl = HE.flicker(c.T, x, 0.15);
    return HE.fx.glow(x, y - h / 2, 120, '#ffc870', 0.45 * fl) +
      `<rect x="${x - 16}" y="${y - h}" width="32" height="${h}" fill="${T('#fbe7b4', 'day')}" opacity="${n(0.85 + 0.15 * fl)}"/>` +
      `<rect x="${x - 18}" y="${y - h - 4}" width="36" height="6" fill="#3a2a20"/><rect x="${x - 18}" y="${y - 3}" width="36" height="6" fill="#3a2a20"/>` +
      `<line x1="${x}" y1="${y - h}" x2="${x}" y2="${y}" stroke="#7a5a3a" stroke-width="1.5"/>`;
  };
})();
