/* =====================================================================================
   HE · fx – Licht & Atmosphäre: Sterne, Mond, Glow, Taschenlampe, Nebel, Regen, Schnee,
   Glühwürmchen, Staub, Bokeh, Blitz, Abdunkeln. Alles zeitabhängig über c.T (deterministisch).
   ===================================================================================== */
(function () {
  const HE = window.HE;
  const n = HE.n;
  const fx = (HE.fx = {});

  // Sterne mit leichtem Funkeln
  fx.stars = function (c, o = {}) {
    const r = HE.rng(o.seed || 'stars');
    const [x0, y0, w, h] = o.area || [0, 0, 720, 600];
    let s = '';
    for (let i = 0; i < (o.n || 70); i++) {
      const x = x0 + r() * w, y = y0 + r() * r() * h; // mehr Sterne oben
      const big = r() < 0.12;
      const tw = 0.55 + 0.45 * Math.sin(c.T * (1 + r() * 2.5) + r() * 6.28);
      s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(big ? 1.6 + r() : 0.7 + r() * 0.7)}" fill="${o.color || '#e8ecff'}" opacity="${n((o.opacity || 0.85) * tw * (big ? 1 : 0.7))}"/>`;
    }
    return s;
  };

  // Mond (voll) mit weichem Halo und Kratern
  fx.moon = function (o = {}) {
    const { x = 560, y = 160, r = 36, color = '#f1f0e4' } = o;
    let s = `<circle cx="${x}" cy="${y}" r="${r * 4}" fill="${HE.rg([[0, color, 0.28], [0.35, color, 0.08], [1, color, 0]])}"/>`;
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
    if (o.craters !== false) {
      s += `<circle cx="${n(x - r * 0.3)}" cy="${n(y - r * 0.2)}" r="${n(r * 0.2)}" fill="#000" opacity="0.06"/>`;
      s += `<circle cx="${n(x + r * 0.25)}" cy="${n(y + r * 0.25)}" r="${n(r * 0.28)}" fill="#000" opacity="0.05"/>`;
      s += `<circle cx="${n(x + r * 0.35)}" cy="${n(y - r * 0.35)}" r="${n(r * 0.12)}" fill="#000" opacity="0.06"/>`;
    }
    return s;
  };

  // grelle Sonne (Mittag) mit großem Blendschein
  fx.sun = function (o = {}) {
    const { x = 520, y = 170, r = 46, color = '#fffbe8', glare = '#fff1b8' } = o;
    return `<circle cx="${x}" cy="${y}" r="${r * 9}" fill="${HE.rg([[0, glare, 0.55], [0.25, glare, 0.18], [1, glare, 0]])}"/>` +
      `<circle cx="${x}" cy="${y}" r="${r * 2.2}" fill="${HE.rg([[0, '#ffffff', 0.9], [1, '#ffffff', 0]])}"/>` +
      `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
  };

  // Lichtschein (radial)
  fx.glow = function (x, y, r, color = '#ffd27a', intensity = 0.6) {
    return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${HE.rg([[0, color, intensity], [0.25, color, intensity * 0.45], [0.6, color, intensity * 0.12], [1, color, 0]])}"/>`;
  };

  // Lichtkegel (Taschenlampe/Laterne): Quelle (x,y), Richtung angle (Grad, 0 = rechts), Länge, Öffnung
  fx.beam = function (o = {}) {
    const { x = 0, y = 0, angle = 0, len = 420, spread = 22, color = '#fff6d8', intensity = 0.55, src = 10 } = o;
    const a = (angle * Math.PI) / 180, sp = (spread * Math.PI) / 180;
    const p1 = [x + Math.cos(a - sp) * len, y + Math.sin(a - sp) * len];
    const p2 = [x + Math.cos(a + sp) * len, y + Math.sin(a + sp) * len];
    const g = HE.lg([[0, color, intensity], [0.6, color, intensity * 0.25], [1, color, 0]], x, y, x + Math.cos(a) * len, y + Math.sin(a) * len, true);
    let s = `<path d="M${n(x)} ${n(y)} L${n(p1[0])} ${n(p1[1])} L${n(p2[0])} ${n(p2[1])} Z" fill="${g}" filter="${HE.blurF(5)}"/>`;
    s += fx.glow(x, y, src * 4, color, 0.9);
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="${src * 0.7}" fill="#fffef4"/>`;
    return s;
  };

  // Nebelbänke: große, weiche, driftende Ellipsen
  fx.fog = function (c, o = {}) {
    const r = HE.rng(o.seed || 'fog');
    const { y = 900, h = 260, color = '#9fb0c8', opacity = 0.35, speed = 8, n: cnt = 7 } = o;
    let s = '';
    for (let i = 0; i < cnt; i++) {
      const w = 300 + r() * 380;
      let x = ((r() * 1100 + c.T * speed * (0.5 + r())) % 1300) - 300;
      const yy = y + (r() - 0.5) * h;
      s += `<ellipse cx="${n(x)}" cy="${n(yy)}" rx="${n(w / 2)}" ry="${n(30 + r() * 60)}" fill="${color}" opacity="${n(opacity * (0.4 + r() * 0.6))}" filter="${HE.blurF(28)}"/>`;
    }
    return s;
  };

  // Regen (schräge Striche)
  fx.rain = function (c, o = {}) {
    const r = HE.rng(o.seed || 'rain');
    const { cnt = 120, angle = 12, speed = 1300, color = '#b8c6dc', opacity = 0.35, len = 38 } = o;
    const dx = Math.tan((angle * Math.PI) / 180);
    let s = '';
    for (let i = 0; i < cnt; i++) {
      const x0 = r() * 900 - 90, ph = r();
      const y = (((c.T * speed * (0.8 + r() * 0.4)) / 1400 + ph) % 1) * 1500 - 100;
      const x = x0 + y * dx;
      s += `<line x1="${n(x)}" y1="${n(y)}" x2="${n(x - dx * len)}" y2="${n(y - len)}" stroke="${color}" stroke-width="1.6" opacity="${n(opacity * (0.5 + r() * 0.5))}"/>`;
    }
    return s;
  };

  // Schnee (sanft fallend, seitlich driftend)
  fx.snow = function (c, o = {}) {
    const r = HE.rng(o.seed || 'snow');
    const { cnt = 90, speed = 60, color = '#ffffff', opacity = 0.85, size = 2.2, area = [0, 0, 720, 1280] } = o;
    let s = '';
    for (let i = 0; i < cnt; i++) {
      const z = 0.4 + r() * 0.9; // Tiefe
      const ph = r();
      const y = area[1] + ((((c.T * speed * z) / area[3]) + ph) % 1) * area[3];
      const x = area[0] + ((r() * area[2] + Math.sin(c.T * (0.6 + r()) + i) * 14 * z) % area[2]);
      s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(size * z)}" fill="${color}" opacity="${n(opacity * Math.min(1, z))}"/>`;
    }
    return s;
  };

  // Glühwürmchen
  fx.fireflies = function (c, o = {}) {
    const r = HE.rng(o.seed || 'ff');
    const [x0, y0, w, h] = o.area || [0, 700, 720, 400];
    let s = '';
    for (let i = 0; i < (o.cnt || 10); i++) {
      const bx = x0 + r() * w, by = y0 + r() * h, sp = 0.3 + r() * 0.5, ph = r() * 10;
      const x = bx + Math.sin(c.T * sp + ph) * 26, y = by + Math.cos(c.T * sp * 1.3 + ph) * 16;
      const blink = Math.max(0, Math.sin(c.T * (1 + r()) + ph));
      s += fx.glow(x, y, 14, o.color || '#d9f27a', 0.5 * blink) + `<circle cx="${n(x)}" cy="${n(y)}" r="2" fill="#efffb0" opacity="${n(blink)}"/>`;
    }
    return s;
  };

  // Staub / kleine funkelnde Partikel (Nahaufnahmen von Monstern)
  fx.dust = function (c, o = {}) {
    const r = HE.rng(o.seed || 'dust');
    const [x0, y0, w, h] = o.area || [0, 0, 720, 1280];
    let s = '';
    for (let i = 0; i < (o.cnt || 26); i++) {
      const x = x0 + ((r() * w + c.T * (4 + r() * 8)) % w), y = y0 + ((r() * h - c.T * (3 + r() * 6) + h * 10) % h);
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(c.T * (0.8 + r() * 2) + i));
      if (r() < 0.25) s += `<path d="M${n(x)} ${n(y - 4)} L${n(x + 1)} ${n(y)} L${n(x)} ${n(y + 4)} L${n(x - 1)} ${n(y)} Z M${n(x - 4)} ${n(y)} L${n(x)} ${n(y + 1)} L${n(x + 4)} ${n(y)} L${n(x)} ${n(y - 1)} Z" fill="#fff" opacity="${n(0.8 * tw)}"/>`;
      else s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.8 + r() * 1.2)}" fill="${o.color || '#ffffff'}" opacity="${n(0.55 * tw)}"/>`;
    }
    return s;
  };

  // Bokeh-Kreise im Vordergrund (unscharf)
  fx.bokeh = function (c, o = {}) {
    const r = HE.rng(o.seed || 'bokeh');
    let s = '';
    const cols = o.colors || ['#ffffff', '#ffd9a0', '#cfe0ff'];
    for (let i = 0; i < (o.cnt || 8); i++) {
      const x = r() * 720 + Math.sin(c.T * 0.2 + i) * 10, y = (o.y || 0) + r() * (o.h || 1280);
      s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(10 + r() * 26)}" fill="${cols[i % cols.length]}" opacity="${n((o.opacity || 0.12) * (0.5 + r()))}" filter="${HE.blurF(4)}"/>`;
    }
    return s;
  };

  // Blitz: weiße Fläche, die an einem Beat aufflackert (Bildschirm-Ebene: c.S(fx.lightning(...)))
  fx.lightning = function (c, at, o = {}) {
    const b = typeof at === 'number' ? at : c.beat(at);
    if (b == null) return '';
    const k = c.t - b;
    if (k < 0 || k > 0.6) return '';
    const v = k < 0.08 ? 1 : k < 0.16 ? 0.2 : k < 0.24 ? 0.8 : Math.max(0, 0.8 - (k - 0.24) * 2.2);
    return `<rect width="720" height="1280" fill="${o.color || '#e8f0ff'}" opacity="${n(v * (o.strength || 0.75))}"/>`;
  };

  // Abdunkeln / Tönen der ganzen Szene
  fx.tint = (color = '#000', opacity = 0.3) => `<rect x="-400" y="-400" width="1520" height="2080" fill="${color}" opacity="${n(opacity)}"/>`;

  // zusätzliche Vignette (Bildschirm-Ebene)
  fx.vignette = (strength = 0.55, color = '#000') =>
    `<rect width="720" height="1280" fill="${HE.rg([[0, color, 0], [0.55, color, 0], [1, color, strength]], 0.5, 0.5, 0.75)}"/>`;

  // Rauch (Schornstein, Vulkan)
  fx.smoke = function (c, o = {}) {
    const { x = 0, y = 0, color = '#d8d8d8', opacity = 0.5, scale = 1 } = o;
    let s = '';
    for (let i = 0; i < 6; i++) {
      const k = ((c.T * 0.12 + i / 6) % 1);
      const yy = y - k * 160 * scale, xx = x + Math.sin(k * 4 + i) * 12 * scale + k * 40 * scale;
      s += `<circle cx="${n(xx)}" cy="${n(yy)}" r="${n((10 + k * 34) * scale)}" fill="${color}" opacity="${n(opacity * (1 - k))}" filter="${HE.blurF(6)}"/>`;
    }
    return s;
  };
})();
