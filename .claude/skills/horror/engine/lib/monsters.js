/* =====================================================================================
   HE · monsters (v2) – detaillierte Monster im Stil der Referenz.
   Merkmale (aus den Originalen vermessen):
   · Gesicht: weiche Verläufe (Geister: lavendel-grau-blau, Leiche: grau-grün), lila Augenringe,
     angedeutete Nase (2 Nasenlöcher), Lachfalten, dunkle Lippen oder breites Zahngrinsen.
   · Augen: groß & rund, weiße Lederhaut mit roten Adern, roter Lidrand, graublaue Iris mit
     Strahlen, kleine Pupille, Glanzpunkt, dicker dunkler Oberlid-Strich mit Wimpern-Zacken.
     Variante 'hollow' (schwarze Höhlen, weißer Lichtpunkt), 'closed' (Lid-Bogen), 'glow'.
   · Haare: Pony mit Zacken, Vorhang links/rechts, lange Einzelsträhnen hängen ÜBER das Gesicht.
   · Hände: knochig, lange Finger mit Gelenken und dunklen Nägeln. Arme extrem dünn und lang.
   · Glitzer-Staub (kleine 4-Zack-Sterne) über Nahaufnahmen.

   Hauptfunktionen
     HE.mon.face(c, o)    Gesicht (ohne Haare)            HE.mon.eye(o)   einzelnes Auge
     HE.mon.hairBack(o)   Haarmasse hinter dem Kopf       HE.mon.hairFront(c,o)  Pony + Strähnen
     HE.mon.hand(o)       Knochenhand                      HE.mon.arm(o)   dünner Arm mit Ellbogen
     HE.mon.bust(c, o)    Büste: für Titelkarten-Porträt & Nahaufnahme (Gesicht formatfüllend)
     HE.mon.figure(c, o)  ganze Figur (stehend / gebückt / kriechend), optional Hut, Sichel …
     HE.mon.shroud(c, o)  Leichentuch-Wesen (ganzer Körper, hüpfend)   HE.mon.shroudBust(c, o)
     HE.mon.shadow(c, o)  Schattengestalt   HE.mon.thin(c, o) dürre Kreatur (Geweih optional)
     HE.mon.sparkles(c,o) Glitzer-Staub
   Einheiten: Gesicht intern 100 Einheiten breit; o.size = Gesichtsbreite in px.
   ===================================================================================== */
(function () {
  const HE = window.HE;
  const n = HE.n;
  const M = (HE.mon = {});

  // Hautpaletten: [Licht, Mitte, Schatten, Tiefe, Linien]
  M.SKINS = {
    ghost: ['#dcdef0', '#b5b7d6', '#8f91b6', '#6d6f97', '#585a84'],   // Teke-Teke-Typ (lavendel-blau)
    pale: ['#eeeeee', '#d2d2d6', '#a9a9b2', '#84848f', '#6a6a74'],    // Hachishakusama-Typ (weiß-grau)
    corpse: ['#9aa493', '#7f8a78', '#626d5c', '#4b5546', '#3c4438'],  // Leiche (grau-grün)
    sickly: ['#efe7cf', '#d6cba9', '#b0a47e', '#8a7f5c', '#6e6446'],  // fahl-gelblich (Sonne/Hitze)
    ash: ['#cfd2d6', '#a9adb3', '#83878e', '#5f636a', '#4a4d53'],     // aschgrau
  };
  M.HAIR = '#0d0d13';
  const skinOf = (o) => (Array.isArray(o.skin) ? o.skin : M.SKINS[o.skin || 'ghost']);

  // ------------------------------------------------------------------ Glitzer-Staub
  M.sparkles = function (c, o = {}) {
    const r = HE.rng(o.seed || 'spk');
    const [x0, y0, w, h] = o.area || [0, 0, 720, 1280];
    let s = '';
    for (let i = 0; i < (o.cnt || 22); i++) {
      const x = x0 + r() * w + Math.sin(c.T * 0.4 + i) * 6, y = y0 + r() * h - ((c.T * (3 + r() * 5)) % 40);
      const tw = 0.25 + 0.75 * Math.abs(Math.sin(c.T * (0.7 + r() * 1.6) + i * 1.7));
      const sz = (o.size || 4) * (0.6 + r() * 0.8);
      if (r() < 0.6) s += `<path d="M${n(x)} ${n(y - sz)} Q${n(x + sz * 0.12)} ${n(y - sz * 0.12)} ${n(x + sz)} ${n(y)} Q${n(x + sz * 0.12)} ${n(y + sz * 0.12)} ${n(x)} ${n(y + sz)} Q${n(x - sz * 0.12)} ${n(y + sz * 0.12)} ${n(x - sz)} ${n(y)} Q${n(x - sz * 0.12)} ${n(y - sz * 0.12)} ${n(x)} ${n(y - sz)} Z" fill="#ffffff" opacity="${n(0.9 * tw)}"/>`;
      else s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(sz * 0.3)}" fill="#ffffff" opacity="${n(0.7 * tw)}"/>`;
    }
    return s;
  };

  // ------------------------------------------------------------------ Auge
  // x,y Mitte (Gesichts-Einheiten oder px), r Radius, type: 'wide' | 'hollow' | 'closed' | 'glow' | 'slit'
  // look [dx,dy] -1..1, lid 0..1 (Lid schließt), iris Farbe, bloodshot 0..1
  M.eye = function (o = {}) {
    const { x = 0, y = 0, r = 14, type = 'wide', look = [0, 0], lid = 0, iris = '#8d9caa', bloodshot = 1, lash = true, side = 1 } = o;
    const id = 'ec' + HE.hash([x, y, r, lid, type].join());
    const ry = r * 0.86 * (1 - lid * 0.95);
    let s = '';
    // Augenhöhle
    s += `<ellipse cx="${n(x)}" cy="${n(y + r * 0.15)}" rx="${n(r * 1.55)}" ry="${n(r * 1.25)}" fill="#33304e" opacity="${type === 'hollow' ? 0.55 : 0.32}" filter="${HE.blurF(r * 0.32)}"/>`;
    if (type === 'hollow') {
      // schwarze, ausgefranste Höhle mit weißem Lichtpunkt (Hachishakusama-Typ)
      const rr = HE.rng('hol' + x);
      let d = '';
      for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI * 2, k = 0.85 + rr() * 0.3; d += (i ? 'L' : 'M') + n(x + Math.cos(a) * r * 1.25 * k) + ' ' + n(y + Math.sin(a) * r * 0.95 * k); }
      s += `<path d="${d}Z" fill="#0c0c10" opacity="0.92" filter="${HE.blurF(r * 0.08)}"/>`;
      s += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r * 1.45)}" ry="${n(r * 1.15)}" fill="#2a2830" opacity="0.35" filter="${HE.blurF(r * 0.25)}"/>`;
      const px = x + look[0] * r * 0.3, py = y + look[1] * r * 0.2;
      s += `<circle cx="${n(px)}" cy="${n(py)}" r="${n(r * 0.34)}" fill="#f2f2f2"/><circle cx="${n(px)}" cy="${n(py)}" r="${n(r * 0.17)}" fill="#0c0c10"/>`;
      return s;
    }
    if (type === 'closed') {
      s += `<path d="M${n(x - r * 1.1)} ${n(y + r * 0.2)} Q${n(x)} ${n(y - r * 0.95)} ${n(x + r * 1.1)} ${n(y + r * 0.2)} Q${n(x)} ${n(y - r * 0.2)} ${n(x - r * 1.1)} ${n(y + r * 0.2)} Z" fill="#191720"/>`;
      s += `<path d="M${n(x - r)} ${n(y + r * 0.25)} Q${n(x)} ${n(y + r * 0.55)} ${n(x + r)} ${n(y + r * 0.25)}" stroke="#2a2830" stroke-width="${n(r * 0.08)}" fill="none" opacity="0.6"/>`;
      return s;
    }
    HE.defs.add(id, `<clipPath id="${id}"><ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r)}" ry="${n(Math.max(0.5, ry))}"/></clipPath>`);
    // roter Lidrand (unten + Rand)
    s += `<ellipse cx="${n(x)}" cy="${n(y + r * 0.06)}" rx="${n(r * 1.1)}" ry="${n(Math.max(1, ry + r * 0.16))}" fill="${bloodshot > 0 ? '#c4505a' : '#8a7078'}"/>`;
    s += `<g clip-path="url(#${id})">`;
    s += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r)}" ry="${n(r * 0.86)}" fill="${HE.rg([[0, '#fcf8f3'], [0.68, '#ece2dc'], [1, '#cf9da0']])}"/>`;
    if (bloodshot > 0) {
      const rr = HE.rng('vein' + x + y);
      for (let i = 0; i < 9; i++) {
        const a = rr() * Math.PI * 2, L = 0.35 + rr() * 0.35;
        const x1 = x + Math.cos(a) * r, y1 = y + Math.sin(a) * r * 0.86;
        const x2 = x + Math.cos(a + 0.25) * r * (1 - L), y2 = y + Math.sin(a + 0.25) * r * 0.86 * (1 - L);
        s += `<path d="M${n(x1)} ${n(y1)} Q${n((x1 + x2) / 2 + (rr() - 0.5) * r * 0.25)} ${n((y1 + y2) / 2 + (rr() - 0.5) * r * 0.25)} ${n(x2)} ${n(y2)}" stroke="#c8464e" stroke-width="${n(r * 0.035)}" fill="none" opacity="${n(0.8 * bloodshot)}"/>`;
      }
    }
    const ir = r * 0.56;
    const ix = x + look[0] * r * 0.3, iy = y + look[1] * r * 0.22;
    if (type === 'glow') s += `<circle cx="${n(ix)}" cy="${n(iy)}" r="${n(ir * 1.3)}" fill="${HE.rg([[0, iris, 0.9], [1, iris, 0]])}"/>`;
    s += `<circle cx="${n(ix)}" cy="${n(iy)}" r="${n(ir)}" fill="${HE.rg([[0, HE.shade(iris, 0.45)], [0.55, iris], [1, HE.shade(iris, -0.35)]])}"/>`;
    // Iris-Strahlen
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      s += `<line x1="${n(ix + Math.cos(a) * ir * 0.34)}" y1="${n(iy + Math.sin(a) * ir * 0.34)}" x2="${n(ix + Math.cos(a) * ir * 0.92)}" y2="${n(iy + Math.sin(a) * ir * 0.92)}" stroke="${i % 2 ? HE.shade(iris, 0.35) : HE.shade(iris, -0.3)}" stroke-width="${n(r * 0.035)}" opacity="0.7"/>`;
    }
    s += `<circle cx="${n(ix)}" cy="${n(iy)}" r="${n(ir)}" fill="none" stroke="#2f3943" stroke-width="${n(r * 0.07)}"/>`;
    s += `<circle cx="${n(ix)}" cy="${n(iy)}" r="${n(type === 'slit' ? ir * 0.12 : ir * 0.3)}" fill="#0a0a0e"/>`;
    if (type === 'slit') s += `<ellipse cx="${n(ix)}" cy="${n(iy)}" rx="${n(ir * 0.13)}" ry="${n(ir * 0.85)}" fill="#0a0a0e"/>`;
    s += `<circle cx="${n(ix - ir * 0.32)}" cy="${n(iy - ir * 0.34)}" r="${n(ir * 0.13)}" fill="#ffffff" opacity="0.95"/>`;
    s += `<circle cx="${n(ix + ir * 0.3)}" cy="${n(iy + ir * 0.3)}" r="${n(ir * 0.06)}" fill="#ffffff" opacity="0.7"/>`;
    // Schatten des Oberlids auf dem Auge
    s += `<ellipse cx="${n(x)}" cy="${n(y - r * 0.95)}" rx="${n(r * 1.1)}" ry="${n(r * 0.45)}" fill="#3a2a35" opacity="0.28" filter="${HE.blurF(r * 0.12)}"/>`;
    s += `</g>`;
    // Oberlid: dicker dunkler Bogen + Wimpernzacken
    const top = y - ry;
    s += `<path d="M${n(x - r * 1.08)} ${n(y + r * 0.05)} Q${n(x - r * 0.75)} ${n(top - r * 0.05)} ${n(x)} ${n(top - r * 0.08)} Q${n(x + r * 0.75)} ${n(top - r * 0.05)} ${n(x + r * 1.08)} ${n(y + r * 0.05)}" stroke="#15131c" stroke-width="${n(r * 0.17)}" fill="none" stroke-linecap="round"/>`;
    if (lash && lid < 0.6) {
      for (let i = 0; i < 7; i++) {
        const k = -0.95 + (i / 6) * 1.9; // -0.95..0.95 entlang des Lids
        const lx = x + k * r * 1.0, ly = y - ry * Math.sqrt(Math.max(0, 1 - k * k)) - r * 0.05;
        const ang = Math.atan2(ly - y, lx - x);
        const L = r * (0.22 + 0.1 * (1 - Math.abs(k)));
        const tx = lx + Math.cos(ang) * L + side * k * r * 0.04, ty = ly + Math.sin(ang) * L;
        s += `<path d="M${n(lx - r * 0.06)} ${n(ly)} L${n(tx)} ${n(ty)} L${n(lx + r * 0.06)} ${n(ly)} Z" fill="#15131c"/>`;
      }
    }
    // Unterlid-Linie
    s += `<path d="M${n(x - r * 0.92)} ${n(y + ry * 0.55)} Q${n(x)} ${n(y + ry + r * 0.18)} ${n(x + r * 0.92)} ${n(y + ry * 0.55)}" stroke="#a5404a" stroke-width="${n(r * 0.06)}" fill="none" opacity="0.8"/>`;
    return s;
  };

  // ------------------------------------------------------------------ Mund
  // type: 'lips' | 'lipsOpen' | 'grin' | 'smile' | 'teeth' | 'scream' | 'stitched' | 'none' ; Gesichts-Einheiten
  M.mouth = function (o = {}) {
    const { x = 0, y = 36, w = 26, type = 'lips', open = 0.3, lipColor = '#262434' } = o;
    const hw = w / 2;
    if (type === 'none') return '';
    if (type === 'smile') {
      return `<path d="M${n(x - hw * 1.25)} ${n(y - 3)} Q${n(x)} ${n(y + 7)} ${n(x + hw * 1.25)} ${n(y - 3)}" stroke="#8a3e34" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
        `<path d="M${n(x - hw * 1.25)} ${n(y - 3)} l-2 -2 M${n(x + hw * 1.25)} ${n(y - 3)} l2 -2" stroke="#3a2a2a" stroke-width="1.6"/>` +
        `<path d="M${n(x - hw * 0.8)} ${n(y + 5)} Q${n(x)} ${n(y + 10)} ${n(x + hw * 0.8)} ${n(y + 5)}" stroke="#6a6a74" stroke-width="1" fill="none" opacity="0.6"/>`;
    }
    if (type === 'grin') {
      // breites Grinsen (≈60 % der Gesichtsbreite), zwei Reihen gelblicher Zähne mit dunklen Fugen
      const W = hw * 2.15, H = 10 + open * 9;
      const mouthD = `M${n(x - W)} ${n(y - 7)} Q${n(x)} ${n(y + H * 1.75)} ${n(x + W)} ${n(y - 7)} Q${n(x)} ${n(y + H * 0.15)} ${n(x - W)} ${n(y - 7)} Z`;
      let s = `<path d="${mouthD}" fill="#140a0e"/>`;
      const id = 'gr' + HE.hash([x, y, W, H].join());
      HE.defs.add(id, `<clipPath id="${id}"><path d="${mouthD}"/></clipPath>`);
      const tooth = HE.lg([[0, '#efe6bf'], [1, '#b9aa72']], 0, 0, 0, 1);
      s += `<g clip-path="url(#${id})">`;
      const N = 12;
      for (let i = 0; i < N; i++) {
        const q = (i + 0.5) / N, tx = x - W + q * W * 2, tw = (W * 2) / N - 0.9;
        const curve = 1 - Math.pow(Math.abs(q - 0.5) * 2, 2);
        const upY = y - 8 + curve * H * 0.32, upH = H * 0.62 + (i % 3 === 1 ? 1.2 : 0);
        s += `<path d="M${n(tx - tw / 2)} ${n(upY)} L${n(tx + tw / 2)} ${n(upY)} L${n(tx + tw / 2)} ${n(upY + upH - 1.4)} Q${n(tx)} ${n(upY + upH + 0.6)} ${n(tx - tw / 2)} ${n(upY + upH - 1.4)} Z" fill="${tooth}" stroke="#3a2a18" stroke-width="0.6"/>`;
        const loY = y + curve * H * 1.3 - H * 0.55, loH = H * 0.6;
        s += `<path d="M${n(tx - tw / 2)} ${n(loY + loH)} L${n(tx + tw / 2)} ${n(loY + loH)} L${n(tx + tw / 2)} ${n(loY + 1.4)} Q${n(tx)} ${n(loY - 0.6)} ${n(tx - tw / 2)} ${n(loY + 1.4)} Z" fill="${tooth}" stroke="#3a2a18" stroke-width="0.6"/>`;
      }
      s += `<path d="M${n(x - W)} ${n(y - 7)} Q${n(x)} ${n(y + H * 0.15)} ${n(x + W)} ${n(y - 7)} L${n(x + W)} ${n(y - 9)} Q${n(x)} ${n(y - 1)} ${n(x - W)} ${n(y - 9)} Z" fill="#7a4a50" opacity="0.6"/>`;
      s += `</g>`;
      s += `<path d="M${n(x - W)} ${n(y - 7)} Q${n(x)} ${n(y + H * 1.75)} ${n(x + W)} ${n(y - 7)}" stroke="${lipColor}" stroke-width="2.4" fill="none"/>`;
      s += `<path d="M${n(x - W)} ${n(y - 7)} Q${n(x)} ${n(y + H * 0.15)} ${n(x + W)} ${n(y - 7)}" stroke="${lipColor}" stroke-width="1.8" fill="none"/>`;
      s += `<path d="M${n(x - W - 4)} ${n(y - 12)} Q${n(x - W + 2)} ${n(y - 5)} ${n(x - W + 1)} ${n(y + 3)} M${n(x + W + 4)} ${n(y - 12)} Q${n(x + W - 2)} ${n(y - 5)} ${n(x + W - 1)} ${n(y + 3)}" stroke="${lipColor}" stroke-width="1.2" fill="none" opacity="0.7"/>`;
      return s;
    }
    if (type === 'teeth' || type === 'scream') {
      const H = type === 'scream' ? 10 + open * 16 : 5 + open * 5;
      let s = `<ellipse cx="${n(x)}" cy="${n(y + H * 0.3)}" rx="${n(hw * 1.05)}" ry="${n(H)}" fill="#160c10"/>`;
      for (let i = -4; i <= 4; i++) {
        const tx = x + i * hw * 0.22;
        s += `<rect x="${n(tx - hw * 0.09)}" y="${n(y + H * 0.3 - H + 0.5)}" width="${n(hw * 0.18)}" height="${n(Math.min(H * 0.55, 5))}" rx="0.8" fill="#d8cfa8"/>`;
        if (type === 'teeth') s += `<rect x="${n(tx - hw * 0.09)}" y="${n(y + H * 0.3 + H - Math.min(H * 0.55, 5) - 0.5)}" width="${n(hw * 0.18)}" height="${n(Math.min(H * 0.55, 5))}" rx="0.8" fill="#c9bf96"/>`;
      }
      s += `<ellipse cx="${n(x)}" cy="${n(y + H * 0.3)}" rx="${n(hw * 1.05)}" ry="${n(H)}" fill="none" stroke="${lipColor}" stroke-width="1.6"/>`;
      return s;
    }
    if (type === 'stitched') {
      let s = `<path d="M${n(x - hw * 1.2)} ${n(y)} Q${n(x)} ${n(y + 3)} ${n(x + hw * 1.2)} ${n(y)}" stroke="#2a1a20" stroke-width="2" fill="none"/>`;
      for (let i = -3; i <= 3; i++) s += `<line x1="${n(x + i * hw * 0.32)}" y1="${n(y - 3.5)}" x2="${n(x + i * hw * 0.32 + 1)}" y2="${n(y + 4.5)}" stroke="#2a1a20" stroke-width="1.3"/>`;
      return s;
    }
    // Lippen (geschlossen oder leicht offen mit Zähnchen)
    const gap = type === 'lipsOpen' ? 2.2 + open * 4 : 0.6;
    let s = '';
    s += `<path d="M${n(x - hw)} ${n(y)} Q${n(x - hw * 0.5)} ${n(y - 4.2)} ${n(x - hw * 0.1)} ${n(y - 3)} Q${n(x)} ${n(y - 2.2)} ${n(x + hw * 0.1)} ${n(y - 3)} Q${n(x + hw * 0.5)} ${n(y - 4.2)} ${n(x + hw)} ${n(y)} Q${n(x)} ${n(y - 0.6)} ${n(x - hw)} ${n(y)} Z" fill="${lipColor}"/>`;
    if (type === 'lipsOpen') {
      s += `<path d="M${n(x - hw * 0.9)} ${n(y + 0.2)} Q${n(x)} ${n(y + gap * 1.2)} ${n(x + hw * 0.9)} ${n(y + 0.2)} Q${n(x)} ${n(y - 0.4)} ${n(x - hw * 0.9)} ${n(y + 0.2)} Z" fill="#0f0a0e"/>`;
      for (let i = -3; i <= 3; i++) s += `<rect x="${n(x + i * hw * 0.24 - hw * 0.1)}" y="${n(y - 0.2)}" width="${n(hw * 0.2)}" height="${n(gap * 0.55)}" rx="0.5" fill="#9b968a" opacity="0.9"/>`;
    }
    s += `<path d="M${n(x - hw)} ${n(y + 0.2)} Q${n(x)} ${n(y + gap + 5.5)} ${n(x + hw)} ${n(y + 0.2)} Q${n(x)} ${n(y + gap)} ${n(x - hw)} ${n(y + 0.2)} Z" fill="${lipColor}"/>`;
    s += `<path d="M${n(x - hw * 0.35)} ${n(y + gap + 2.6)} Q${n(x)} ${n(y + gap + 3.6)} ${n(x + hw * 0.35)} ${n(y + gap + 2.6)}" stroke="#ffffff" stroke-width="0.8" opacity="0.18" fill="none"/>`;
    return s;
  };

  // ------------------------------------------------------------------ Gesicht (ohne Haare)
  // o: cx, cy (px), size (Gesichtsbreite px), skin ('ghost'|'pale'|'corpse'|'sickly'|'ash'|[5 Farben])
  //    eyes ('wide'|'hollow'|'closed'|'glow'|'slit'), eyeSize (Radius in Einheiten, Std 14), look, lid, iris, bloodshot
  //    mouth (siehe M.mouth), open, wrinkles (0..1), bags (0..1), nose (true), lighting ('top'|'side')
  M.face = function (c, o = {}) {
    const { cx = 0, cy = 0, size = 200 } = o;
    const S = skinOf(o);
    const k = size / 100;
    let s = `<g transform="translate(${n(cx)} ${n(cy)}) scale(${n(k * 1000) / 1000})">`;
    const shape = 'M-48 -42 C-53 -6 -50 24 -33 44 C-21 56 -8 61 0 61 C8 61 21 56 33 44 C50 24 53 -6 48 -42 C40 -68 -40 -68 -48 -42 Z';
    s += `<path d="${shape}" fill="${HE.rg([[0, S[0]], [0.5, S[1]], [0.82, S[2]], [1, S[3]]], 0.5, 0.36, 0.72)}"/>`;
    // Lichtkante / Glanz
    s += `<ellipse cx="0" cy="-22" rx="22" ry="28" fill="#ffffff" opacity="0.13" filter="${HE.blurF(7)}"/>`;
    s += `<ellipse cx="0" cy="8" rx="7" ry="16" fill="#ffffff" opacity="0.08" filter="${HE.blurF(3)}"/>`;
    // Wangen-Schatten
    s += `<ellipse cx="-36" cy="20" rx="11" ry="20" fill="${S[3]}" opacity="0.35" filter="${HE.blurF(5)}"/><ellipse cx="36" cy="20" rx="11" ry="20" fill="${S[3]}" opacity="0.35" filter="${HE.blurF(5)}"/>`;
    // Augenringe
    const bags = o.bags == null ? 1 : o.bags;
    const ey = o.eyeY != null ? o.eyeY : -6, ex = o.eyeX != null ? o.eyeX : 24, er = o.eyeSize || 14;
    if (bags > 0) [-1, 1].forEach((sd) => {
      s += `<ellipse cx="${sd * (ex + 2)}" cy="${ey + er * 0.75}" rx="${n(er * 1.45)}" ry="${n(er * 0.8)}" fill="${S[4]}" opacity="${n(0.5 * bags)}" filter="${HE.blurF(3.5)}"/>`;
      s += `<path d="M${n(sd * (ex - er * 1.1))} ${n(ey + er * 1.15)} Q${n(sd * ex)} ${n(ey + er * 1.75)} ${n(sd * (ex + er * 1.25))} ${n(ey + er * 0.95)}" stroke="${S[4]}" stroke-width="1.1" fill="none" opacity="${n(0.6 * bags)}"/>`;
    });
    // Falten
    const wr = o.wrinkles || 0;
    if (wr > 0) {
      s += `<path d="M-14 -36 q7 -3 14 0 q7 3 14 0 M-18 -29 q9 -3 18 0 q9 3 18 0" stroke="${S[4]}" stroke-width="1" fill="none" opacity="${n(0.55 * wr)}"/>`;
      s += `<path d="M-40 -4 q-3 8 0 16 M40 -4 q3 8 0 16 M-30 46 q6 6 14 8 M30 46 q-6 6 -14 8" stroke="${S[4]}" stroke-width="1" fill="none" opacity="${n(0.5 * wr)}"/>`;
    }
    // Nase (dezent)
    if (o.nose !== false) {
      s += `<path d="M-1 4 Q-3 14 -5 20" stroke="${S[4]}" stroke-width="1" fill="none" opacity="0.45"/>`;
      s += `<path d="M-7.5 22.5 q2.5 -2.2 5 0 M2.5 22.5 q2.5 -2.2 5 0" stroke="${S[4]}" stroke-width="1.3" fill="none" opacity="0.8" stroke-linecap="round"/>`;
      s += `<ellipse cx="0" cy="23" rx="8" ry="3" fill="${S[3]}" opacity="0.18" filter="${HE.blurF(1.5)}"/>`;
    }
    // Lachfalten
    if (o.smileLines !== false) s += `<path d="M-15 21 Q-21 30 -19 39 M15 21 Q21 30 19 39" stroke="${S[4]}" stroke-width="0.9" fill="none" opacity="0.4"/>`;
    // Augen
    if (o.eyes !== false) {
      const et = o.eyes || 'wide';
      const look = o.look || [0, 0];
      // Blinzeln optional über c.T (o.blink: true)
      let lid = o.lid || 0;
      if (o.blink && c) { const ph = (c.T * 0.33 + (o.blinkSeed || 0)) % 1; if (ph < 0.04) lid = Math.sin((ph / 0.04) * Math.PI); }
      s += M.eye({ x: -ex, y: ey, r: er, type: et, look, lid, iris: o.iris, bloodshot: o.bloodshot == null ? 1 : o.bloodshot, side: -1 });
      s += M.eye({ x: ex, y: ey, r: er, type: et, look, lid, iris: o.iris, bloodshot: o.bloodshot == null ? 1 : o.bloodshot, side: 1 });
      if (o.brows) [-1, 1].forEach((sd) => { s += `<path d="M${sd * (ex - 12)} ${ey - er - 6} Q${sd * ex} ${ey - er - 12 - (o.brows === 'up' ? 3 : 0)} ${sd * (ex + 14)} ${ey - er - 4}" stroke="#1a1a20" stroke-width="2.4" fill="none" stroke-linecap="round"/>`; });
    }
    // Mund
    s += M.mouth({ x: 0, y: o.mouthY || 37, w: o.mouthW || (o.mouth === 'grin' ? 30 : 24), type: o.mouth || 'lips', open: o.open || 0.3, lipColor: o.lipColor });
    // Flecken (Leiche)
    if (o.spots) { const r = HE.rng('spots'); for (let i = 0; i < o.spots; i++) s += `<circle cx="${n((r() - 0.5) * 70)}" cy="${n(-40 + r() * 90)}" r="${n(1 + r() * 2.4)}" fill="${S[4]}" opacity="${n(0.25 + r() * 0.3)}"/>`; }
    s += `</g>`;
    return s;
  };

  // ------------------------------------------------------------------ Haare
  // Stile: 'hime' (Pony mit Zacken + Strähnen übers Gesicht, Teke-Typ), 'part' (Mittelscheitel, Gesicht frei,
  // Hachishakusama-Typ), 'wild' (zerzaust, viele Strähnen), 'none'.
  // Haarmasse HINTER Kopf/Körper (zuerst zeichnen). len = Länge unter dem Kinn (Gesichts-Einheiten)
  M.hairBack = function (o = {}) {
    const { cx = 0, cy = 0, size = 200, len = 140, color = M.HAIR, width = 1 } = o;
    const k = size / 100, W = 64 * width;
    const r = HE.rng('hb' + len + width);
    let tips = '';
    const N = 16;
    for (let i = 0; i <= N; i++) { const x = W + 2 - (i / N) * (2 * W + 4); tips += ` L${n(x)} ${n(61 + len - r() * 26 - (i % 2) * 10)}`; }
    let s = `<g transform="translate(${n(cx)} ${n(cy)}) scale(${n(k * 1000) / 1000})">`;
    s += `<path d="M${-W} 0 C${-W - 3} -62 ${-W * 0.6} -101 0 -102 C${W * 0.6} -101 ${W + 3} -62 ${W} 0 C${W + 1} 30 ${W + 3} ${61 + len * 0.5} ${W + 2} ${61 + len * 0.7}${tips} L${-W - 2} ${61 + len * 0.7} C${-W - 3} ${61 + len * 0.5} ${-W - 1} 30 ${-W} 0 Z" fill="${color}"/>`;
    // Glanz-Linien
    for (let i = 0; i < 10; i++) { const x = -W + 10 + r() * (W * 2 - 20); s += `<path d="M${n(x * 0.6)} -92 Q${n(x)} -40 ${n(x + (r() - 0.5) * 8)} ${n(30 + len * (0.4 + r() * 0.6))}" stroke="${HE.shade(color, color === M.HAIR ? 0.14 : -0.12)}" stroke-width="0.7" fill="none" opacity="0.55"/>`; }
    s += `</g>`;
    return s;
  };

  // Haare VOR dem Gesicht (nach M.face zeichnen)
  M.hairFront = function (c, o = {}) {
    const { cx = 0, cy = 0, size = 200, color = M.HAIR, len = 120, sway = 1 } = o;
    const style = o.style || (o.part ? 'part' : 'hime');
    if (style === 'none') return '';
    const k = size / 100;
    const T = c ? c.T : 0;
    const r = HE.rng(o.seed || 'hf' + style);
    const bottom = 61 + len * 0.72;
    let s = `<g transform="translate(${n(cx)} ${n(cy)}) scale(${n(k * 1000) / 1000})">`;
    if (style === 'part') {
      // Mittelscheitel: zwei Vorhänge, Stirn frei
      s += `<path d="M0 -102 C-32 -100 -58 -82 -62 -40 C-64 0 -65 40 -64 ${bottom} L-47 ${bottom} C-46 40 -47 0 -45 -26 C-42 -52 -26 -70 -2 -76 Z" fill="${color}"/>`;
      s += `<path d="M0 -102 C32 -100 58 -82 62 -40 C64 0 65 40 64 ${bottom} L47 ${bottom} C46 40 47 0 45 -26 C42 -52 26 -70 2 -76 Z" fill="${color}"/>`;
      const extra = o.strands == null ? 2 : Math.min(o.strands, 4);
      for (let i = 0; i < extra; i++) { const sx = (i % 2 ? 1 : -1) * (36 + r() * 8); s += `<path d="M${n(sx)} -50 Q${n(sx * 0.98 + Math.sin(T + i) * 1.5)} 10 ${n(sx * 1.02)} ${n(bottom - 10)}" stroke="${color}" stroke-width="${n(1 + r())}" fill="none"/>`; }
      s += `</g>`;
      return s;
    }
    // Seitenvorhänge (verdecken nur den äußeren Wangenrand)
    s += `<path d="M-64 -36 C-66 0 -66 40 -64 ${bottom} L-48 ${bottom + 4} C-49 40 -50 4 -49 -24 Z" fill="${color}"/>`;
    s += `<path d="M64 -36 C66 0 66 40 64 ${bottom} L48 ${bottom + 4} C49 40 50 4 49 -24 Z" fill="${color}"/>`;
    // Pony: Kuppel + unregelmäßige Zacken bis knapp über die Augen
    let d = 'M-64 -30 C-64 -84 -34 -102 0 -102 C34 -102 64 -84 64 -30';
    const N = 17;
    for (let i = 0; i <= N; i++) {
      const x = 62 - (i / N) * 124;
      const valley = -36 - r() * 5;
      let tip = -27 + r() * 9 + (i % 4 === 1 ? 7 + r() * 6 : 0);
      if (Math.abs(x) > 50) tip -= 6;
      d += ` L${n(x + 2.5)} ${n(valley)} L${n(x)} ${n(tip)}`;
    }
    d += ' Z';
    s += `<path d="${d}" fill="${color}"/>`;
    // einzelne Strähnen über dem Gesicht (dünn, unterschiedlich, mit Abstand – Gesicht bleibt sichtbar)
    const cnt = o.strands == null ? (style === 'wild' ? 14 : 8) : o.strands;
    for (let i = 0; i < cnt; i++) {
      const sx = -42 + ((i + 0.5) / cnt) * 84 + (r() - 0.5) * 7;
      const y0 = -33 + r() * 5, L = 55 + len * (0.4 + r() * 0.6) + (style === 'wild' ? 20 : 0);
      const w0 = 0.7 + r() * (style === 'wild' ? 2.4 : 2.0);
      const sw = Math.sin(T * 0.8 + i * 1.3) * 1.4 * sway;
      const b1 = (r() - 0.5) * 9, b2 = (r() - 0.5) * 9;
      const x1 = sx + b1 + sw * 0.3, y1 = y0 + L * 0.35, x2 = sx + b2 + sw * 0.7, y2 = y0 + L * 0.7, x3 = sx + (b1 + b2) * 0.4 + sw, y3 = y0 + L;
      s += `<path d="M${n(sx - w0)} ${n(y0)} C${n(x1 - w0 * 0.8)} ${n(y1)} ${n(x2 - w0 * 0.5)} ${n(y2)} ${n(x3)} ${n(y3)} C${n(x2 + w0 * 0.5)} ${n(y2)} ${n(x1 + w0 * 0.8)} ${n(y1)} ${n(sx + w0)} ${n(y0)} Z" fill="${color}"/>`;
      if (r() < 0.35) s += `<path d="M${n(sx + w0 * 0.5)} ${n(y0 + L * 0.2)} Q${n(x2 + 4)} ${n(y2)} ${n(x3 + 5)} ${n(y3 - 6)}" stroke="${color}" stroke-width="0.6" fill="none"/>`;
    }
    // feine Haarlinien
    for (let i = 0; i < 7; i++) { const sx = -40 + r() * 80; s += `<path d="M${n(sx)} -34 Q${n(sx + (r() - 0.5) * 10)} 20 ${n(sx + (r() - 0.5) * 14)} ${n(50 + r() * len)}" stroke="${color}" stroke-width="0.5" fill="none" opacity="0.65"/>`; }
    s += `</g>`;
    return s;
  };

  // ------------------------------------------------------------------ Knochenhand
  // x,y Handgelenk (px), angle Grad (0 = Finger nach oben), s Skalierung (1 ≈ 110 px lang), spread, curl 0..1, mirror
  M.hand = function (o = {}) {
    const { x = 0, y = 0, angle = 0, s = 1, spread = 1, curl = 0, color = '#e3e5ec', shade = '#9a9cb0', line = '#7c7e94', nails = '#6a6c80', mirror = false } = o;
    let g = '';
    // Handfläche
    g += `<path d="M-15 0 C-19 -16 -21 -30 -18 -44 L18 -46 C21 -30 19 -14 14 0 Z" fill="${color}" stroke="${line}" stroke-width="1.3"/>`;
    g += `<path d="M-8 -6 L-9 -38 M0 -4 L0 -42 M8 -6 L9 -40" stroke="${shade}" stroke-width="1" opacity="0.55"/>`;
    // Finger: [Basis-x, Basis-y, Winkel, Länge]
    const F = [[-14, -42, -0.22, 54], [-5, -46, -0.07, 64], [5, -46, 0.06, 62], [14, -42, 0.2, 52]];
    F.forEach(([fx, fy, a, L], i) => {
      const aa = a * spread;
      const seg = [0.42, 0.33, 0.25].map((q) => q * L);
      let px = fx, py = fy, ang = aa;
      let path = `M${n(px)} ${n(py)}`;
      const joints = [];
      seg.forEach((sl, j) => {
        ang += curl * 0.45 * (j + 1);
        px += Math.sin(ang) * sl; py -= Math.cos(ang) * sl;
        path += ` L${n(px)} ${n(py)}`;
        joints.push([px, py]);
      });
      g += `<path d="${path}" stroke="${line}" stroke-width="7.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      g += `<path d="${path}" stroke="${color}" stroke-width="5.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      joints.slice(0, 2).forEach(([jx, jy]) => { g += `<ellipse cx="${n(jx)}" cy="${n(jy)}" rx="3.1" ry="1.6" fill="${shade}" transform="rotate(${n((ang * 180) / Math.PI)} ${n(jx)} ${n(jy)})"/>`; });
      g += `<ellipse cx="${n(px)}" cy="${n(py + 1)}" rx="2.4" ry="3.6" fill="${nails}" transform="rotate(${n((ang * 180) / Math.PI)} ${n(px)} ${n(py)})"/>`;
    });
    // Daumen
    const ta = 1.05 * spread;
    const t1 = [16 + Math.sin(ta) * 20, -16 - Math.cos(ta) * 20], t2 = [t1[0] + Math.sin(ta - 0.4) * 18, t1[1] - Math.cos(ta - 0.4) * 18];
    g += `<path d="M14 -10 L${n(t1[0])} ${n(t1[1])} L${n(t2[0])} ${n(t2[1])}" stroke="${line}" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    g += `<path d="M14 -10 L${n(t1[0])} ${n(t1[1])} L${n(t2[0])} ${n(t2[1])}" stroke="${color}" stroke-width="5.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    g += `<circle cx="${n(t2[0])}" cy="${n(t2[1])}" r="2.3" fill="${nails}"/>`;
    return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)}) scale(${n(s * (mirror ? -1 : 1) * 1000) / 1000} ${n(s * 1000) / 1000})">${g}</g>`;
  };

  // dünner Arm: Schulter (x1,y1) → Ellbogen (auto) → Handgelenk (x2,y2); bend: Ellbogen-Ausbuchtung (px, ±)
  M.arm = function (o = {}) {
    const { x1, y1, x2, y2, w = 12, bend = 18, color = '#d5d7e2', line = '#8a8ca2' } = o;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    const ex = mx + (-dy / L) * bend, ey = my + (dx / L) * bend;
    const p = `M${n(x1)} ${n(y1)} L${n(ex)} ${n(ey)} L${n(x2)} ${n(y2)}`;
    return `<path d="${p}" stroke="${line}" stroke-width="${n(w + 2.6)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${p}" stroke="${color}" stroke-width="${n(w)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<circle cx="${n(ex)}" cy="${n(ey)}" r="${n(w * 0.3)}" fill="${line}" opacity="0.5"/>`;
  };

  // ------------------------------------------------------------------ Kleidung (Oberkörper)
  // Torso ab Schulterlinie y0, Breite sw, Höhe h; outfit: 'uniform' | 'dress' | 'kimono' | 'shroud' | 'rags' | 'robe'
  M.torso = function (o = {}) {
    const { cx = 0, y0 = 0, sw = 200, h = 300, outfit = 'dress', color } = o;
    const L = cx - sw / 2, R = cx + sw / 2;
    let s = '';
    const base = color || { uniform: '#eef0f4', dress: '#eeeef0', kimono: '#ecebe6', shroud: '#e4e6ea', rags: '#8a8270', robe: '#2a2630' }[outfit];
    s += `<path d="M${n(L)} ${n(y0 + sw * 0.18)} Q${n(L + 4)} ${n(y0)} ${n(cx - sw * 0.18)} ${n(y0 - 4)} L${n(cx + sw * 0.18)} ${n(y0 - 4)} Q${n(R - 4)} ${n(y0)} ${n(R)} ${n(y0 + sw * 0.18)} L${n(R + sw * 0.06)} ${n(y0 + h)} L${n(L - sw * 0.06)} ${n(y0 + h)} Z" fill="${HE.lg([[0, base], [1, HE.shade(base, -0.25)]], 0, 0, 0, 1)}"/>`;
    if (outfit === 'uniform') {
      const navy = '#1c2747';
      s += `<path d="M${n(L + 2)} ${n(y0 + sw * 0.16)} Q${n(L + 6)} ${n(y0 - 2)} ${n(cx - sw * 0.2)} ${n(y0 - 6)} L${n(cx)} ${n(y0 + sw * 0.55)} L${n(cx + sw * 0.2)} ${n(y0 - 6)} Q${n(R - 6)} ${n(y0 - 2)} ${n(R - 2)} ${n(y0 + sw * 0.16)} L${n(R - sw * 0.06)} ${n(y0 + sw * 0.42)} L${n(cx)} ${n(y0 + sw * 0.78)} L${n(L + sw * 0.06)} ${n(y0 + sw * 0.42)} Z" fill="${navy}"/>`;
      [0.03, 0.055].forEach((q) => { s += `<path d="M${n(L + sw * (0.06 + q))} ${n(y0 + sw * (0.4 - q))} L${n(cx)} ${n(y0 + sw * (0.76 - q * 2))} L${n(R - sw * (0.06 + q))} ${n(y0 + sw * (0.4 - q))}" stroke="#e8eaf0" stroke-width="${n(sw * 0.008 + 0.8)}" fill="none"/>`; });
      s += `<path d="M${n(cx - sw * 0.12)} ${n(y0 + sw * 0.6)} L${n(cx + sw * 0.12)} ${n(y0 + sw * 0.6)} L${n(cx + sw * 0.05)} ${n(y0 + sw * 0.74)} L${n(cx + sw * 0.1)} ${n(y0 + sw * 0.98)} L${n(cx)} ${n(y0 + sw * 0.9)} L${n(cx - sw * 0.1)} ${n(y0 + sw * 0.98)} L${n(cx - sw * 0.05)} ${n(y0 + sw * 0.74)} Z" fill="#c22f33"/>`;
      // Schmutzflecken
      const r = HE.rng('dirt'); for (let i = 0; i < 6; i++) s += `<ellipse cx="${n(cx + (r() - 0.5) * sw * 0.8)}" cy="${n(y0 + sw * 0.7 + r() * h * 0.5)}" rx="${n(sw * 0.04 + r() * sw * 0.05)}" ry="${n(sw * 0.03 + r() * sw * 0.04)}" fill="#7a7488" opacity="0.35" filter="${HE.blurF(sw * 0.015 + 1)}"/>`;
    } else if (outfit === 'dress') {
      s += `<path d="M${n(cx - sw * 0.22)} ${n(y0 - 4)} Q${n(cx)} ${n(y0 + sw * 0.28)} ${n(cx + sw * 0.22)} ${n(y0 - 4)}" stroke="#a9adbb" stroke-width="${n(sw * 0.02 + 1)}" fill="none"/>`;
      for (let i = 0; i < 3; i++) s += `<circle cx="${n(cx)}" cy="${n(y0 + sw * (0.3 + i * 0.12))}" r="${n(sw * 0.012 + 1)}" fill="#a9adbb"/>`;
      for (let i = -4; i <= 4; i++) s += `<line x1="${n(cx + i * sw * 0.09)}" y1="${n(y0 + sw * 0.62)}" x2="${n(cx + i * sw * 0.11)}" y2="${n(y0 + h)}" stroke="#c4c7d2" stroke-width="${n(sw * 0.008 + 0.6)}"/>`;
      s += `<rect x="${n(L + sw * 0.02)}" y="${n(y0 + sw * 0.58)}" width="${n(sw * 0.96)}" height="${n(sw * 0.035)}" fill="#c9ccd8"/>`;
    } else if (outfit === 'kimono') {
      s += `<path d="M${n(cx - sw * 0.2)} ${n(y0 - 4)} L${n(cx + sw * 0.12)} ${n(y0 + sw * 0.6)} M${n(cx + sw * 0.2)} ${n(y0 - 4)} L${n(cx - sw * 0.02)} ${n(y0 + sw * 0.4)}" stroke="#c9c7c0" stroke-width="${n(sw * 0.03)}" fill="none"/>`;
      s += `<rect x="${n(L - 2)}" y="${n(y0 + sw * 0.7)}" width="${n(sw + 4)}" height="${n(sw * 0.14)}" fill="#d8d4ca"/>`;
    } else if (outfit === 'rags') {
      const r = HE.rng('rags'); for (let i = 0; i < 8; i++) s += `<path d="M${n(L + r() * sw)} ${n(y0 + r() * h)} l${n(r() * 20)} ${n(10 + r() * 20)}" stroke="#4a4436" stroke-width="2" opacity="0.6"/>`;
    }
    return s;
  };

  // ------------------------------------------------------------------ Büste (Porträt / Nahaufnahme)
  // o: cx, cy (Gesichtsmitte), size (Gesichtsbreite px), outfit ('uniform'|'dress'|'kimono'|'rags'|'robe'|false),
  //    hair ({style:'hime'|'part'|'wild'|'none', color, len, strands} | false), hat ('sun'|false),
  //    hands ('raised'|false), glow (Lichthof hinter dem Kopf, Farbe oder false), sparkles, + alle M.face-Optionen
  M.bust = function (c, o = {}) {
    const { cx = 360, cy = 560, size = 260 } = o;
    const k = size / 100;
    const hair = o.hair === false ? null : Object.assign({ color: M.HAIR, len: 150, style: 'hime' }, o.hair || {});
    const S = skinOf(o);
    let s = '';
    if (o.glow !== false) s += `<circle cx="${n(cx)}" cy="${n(cy - size * 0.15)}" r="${n(size * 1.9)}" fill="${HE.rg([[0, o.glow || '#9fb0ec', 0.38], [0.45, o.glow || '#9fb0ec', 0.12], [1, o.glow || '#9fb0ec', 0]])}"/>`;
    if (hair && hair.style !== 'none') s += M.hairBack({ cx, cy, size, len: hair.len + 90, color: hair.color, width: hair.width || 1 });
    const outfit = o.outfit === undefined ? 'dress' : o.outfit;
    if (outfit) {
      const swf = outfit === 'uniform' ? 2.3 : outfit === 'dress' ? 1.7 : 2.0;
      s += M.torso({ cx, y0: cy + 90 * k, sw: swf * size, h: 3.2 * size, outfit, color: o.outfitColor });
    }
    // Hals (dünn, mit Sehnen)
    s += `<path d="M${n(cx - 14 * k)} ${n(cy + 46 * k)} L${n(cx - 16 * k)} ${n(cy + 96 * k)} Q${n(cx)} ${n(cy + 108 * k)} ${n(cx + 16 * k)} ${n(cy + 96 * k)} L${n(cx + 14 * k)} ${n(cy + 46 * k)} Z" fill="${HE.lg([[0, S[3]], [0.35, S[2]], [1, S[1]]], 0, 0, 0, 1)}"/>`;
    s += `<path d="M${n(cx - 7 * k)} ${n(cy + 62 * k)} L${n(cx - 9 * k)} ${n(cy + 96 * k)} M${n(cx + 7 * k)} ${n(cy + 62 * k)} L${n(cx + 9 * k)} ${n(cy + 96 * k)} M${n(cx - 5 * k)} ${n(cy + 74 * k)} q${n(5 * k)} ${n(2 * k)} ${n(10 * k)} 0" stroke="${S[4]}" stroke-width="${n(k * 0.9)}" fill="none" opacity="0.5"/>`;
    s += M.face(c, Object.assign({}, o, { cx, cy, size }));
    if (hair) s += M.hairFront(c, { cx, cy, size, color: hair.color, strands: hair.strands, len: hair.len, style: hair.style, seed: o.seed });
    if (o.hat === 'sun') s += M.sunHat({ cx, cy: cy - size * 0.6, size: size * 2.55 });
    if (o.hands === 'raised') {
      [-1, 1].forEach((sd) => {
        const wx = cx + sd * size * 0.98, wy = cy + size * 0.62;
        s += M.arm({ x1: cx + sd * size * 0.9, y1: cy + size * 2.4, x2: wx, y2: wy, w: size * 0.12, bend: sd * size * 0.06, color: S[0], line: S[3] });
        s += M.hand({ x: wx, y: wy, angle: sd * 8, s: size / 175, spread: 1.3, curl: 0.05, mirror: sd < 0, color: S[0], shade: S[2], line: S[3] });
      });
    }
    if (o.sparkles !== false) s += M.sparkles(c, { area: [cx - size * 0.9, cy - size * 0.9, size * 1.8, size * 1.7], cnt: o.sparkleCnt || 18, size: 3.4 * Math.sqrt(k), seed: 'bs' + Math.round(cx) });
    return s;
  };

  // weißer Sonnenhut mit schwarzem Band (cx,cy = Mitte der Krempe, size = Krempenbreite px)
  M.sunHat = function (o = {}) {
    const { cx = 0, cy = 0, size = 200 } = o;
    const k = size / 100;
    let s = `<g transform="translate(${n(cx)} ${n(cy)}) scale(${n(k * 1000) / 1000})">`;
    s += `<ellipse cx="0" cy="2.5" rx="51" ry="11" fill="#9a9eac" opacity="0.6"/>`;
    s += `<ellipse cx="0" cy="0" rx="50" ry="10.5" fill="#eff0f3" stroke="#9fa3b2" stroke-width="0.8"/>`;
    s += `<path d="M-45 -1 Q0 7 45 -1 M-38 2.5 Q0 9 38 2.5" stroke="#cfd2da" stroke-width="0.6" fill="none"/>`;
    s += `<path d="M-22 -1 C-23 -22 -15 -31 0 -31 C15 -31 23 -22 22 -1 Z" fill="#f5f5f7" stroke="#9fa3b2" stroke-width="0.8"/>`;
    s += `<path d="M-21 -17 Q0 -20 21 -17 M-19 -24 Q0 -27 19 -24" stroke="#cfd2da" stroke-width="0.6" fill="none"/>`;
    s += `<path d="M-22.4 -10.5 Q0 -12.5 22.4 -10.5 L22.2 -3.5 Q0 -5.5 -22.2 -3.5 Z" fill="#18181b"/>`;
    s += `<path d="M17 -7 l8 -4 l-0.5 7 Z M17 -7 l7 5.5 l-8 0.5 Z" fill="#18181b"/>`;
    s += `</g>`;
    return s;
  };

  // ------------------------------------------------------------------ ganze Figur (Geisterfrau-Typ)
  // o: x,y Fußpunkt, h Gesamthöhe px (Std 640), outfit ('dress'|'uniform'|'kimono'|'robe'), dressColor,
  //    hat ('sun'), pose ('stand'|'bend'|'reach'|'crawl'), hold ('sickle'|false), headSize (Einheiten, Std 62),
  //    hair ({style, color, len}), + Gesichts-Optionen (skin, eyes, mouth, look …)
  M.figure = function (c, o = {}) {
    const { x = 360, y = 1000, h = 640 } = o;
    const pose = o.pose || 'stand';
    if (pose === 'crawl') return M.crawler(c, o);
    const T = c ? c.T : 0;
    const k = h / 640;
    const S = skinOf(o);
    const hairO = o.hair === false ? null : Object.assign({ color: M.HAIR, len: 230, style: 'part' }, o.hair || {});
    const dress = o.dressColor || (o.outfit === 'uniform' ? '#1c2747' : o.outfit === 'robe' ? '#2a2630' : '#eef0f3');
    const shY = -462, waist = -330;
    const headSize = o.headSize || 62;
    const hcy = shY - 30 - headSize * 0.62;
    const bendA = pose === 'bend' ? 16 : pose === 'lean' ? 6 : 0;
    const rot = `rotate(${bendA} 0 ${waist})`;
    const wave = Math.sin(T * 1.4) * 5;
    const sway = Math.sin(T * 1.1) * 1.5;
    let g = `<ellipse cx="0" cy="2" rx="82" ry="10" fill="#000" opacity="0.3"/>`;
    // 1) Haare hinter allem
    if (hairO && hairO.style !== 'none') g += `<g transform="${rot}">${M.hairBack({ cx: 0, cy: hcy, size: headSize, len: hairO.len, color: hairO.color, width: 0.95 })}</g>`;
    // 2) Rock (bleibt stehen)
    let skirt = `<path d="M-42 ${waist} Q-68 -170 ${n(-86 + wave)} -4 L${n(86 + wave)} -4 Q68 -170 42 ${waist} Z" fill="${HE.lg([[0, HE.shade(dress, -0.04)], [1, HE.shade(dress, -0.2)]], 0, 0, 0, 1)}"/>`;
    if (o.outfit !== 'uniform' && o.outfit !== 'robe') for (let i = -7; i <= 7; i++) skirt += `<line x1="${n(i * 5.6)}" y1="${waist + 6}" x2="${n(i * 11.6 + wave * 0.7)}" y2="-6" stroke="${HE.shade(dress, -0.17)}" stroke-width="1.5"/>`;
    if (o.outfit === 'uniform') skirt += `<path d="M-42 ${waist} L42 ${waist} L60 -200 L-60 -200 Z" fill="#141c35"/>` + `<path d="M-60 -200 L60 -200" stroke="#0e1428" stroke-width="2"/>`;
    g += skirt;
    // 3) Oberkörper, Arme, Kopf (neigen sich beim Bücken)
    let up = '';
    up += `<path d="M-38 ${shY + 8} Q-40 ${shY - 4} -26 ${shY - 8} L26 ${shY - 8} Q40 ${shY - 4} 38 ${shY + 8} L42 ${waist + 2} L-42 ${waist + 2} Z" fill="${HE.lg([[0, dress], [1, HE.shade(dress, -0.08)]], 0, 0, 0, 1)}"/>`;
    if (o.outfit === 'uniform') {
      up += `<path d="M-38 ${shY + 4} L0 ${shY + 56} L38 ${shY + 4} L34 ${shY + 34} L0 ${shY + 78} L-34 ${shY + 34} Z" fill="#141c35"/><path d="M-30 ${shY + 30} L0 ${shY + 70} L30 ${shY + 30}" stroke="#e8eaf0" stroke-width="1.6" fill="none"/>`;
      up += `<path d="M-9 ${shY + 58} L9 ${shY + 58} L0 ${shY + 90} Z" fill="#c22f33"/>`;
    } else if (o.outfit !== 'robe') {
      up += `<path d="M-20 ${shY - 8} Q0 ${shY + 18} 20 ${shY - 8}" stroke="${HE.shade(dress, -0.3)}" stroke-width="2.2" fill="none"/>`;
      for (let i = 0; i < 3; i++) up += `<circle cx="0" cy="${shY + 24 + i * 20}" r="2.2" fill="${HE.shade(dress, -0.3)}"/>`;
      up += `<rect x="-42" y="${waist - 3}" width="84" height="7" fill="${HE.shade(dress, -0.16)}"/>`;
    }
    // Arme bis zu den Knien
    let hl = [-60 + sway, -196], hr = [60 + sway, -196];
    if (pose === 'reach') { hl = [-30, -300]; hr = [150, -350]; }
    if (o.hold) hr = [74, -262];
    up += M.arm({ x1: -32, y1: shY + 6, x2: hl[0], y2: hl[1], w: 9.5, bend: -9, color: S[0], line: S[3] });
    up += M.arm({ x1: 32, y1: shY + 6, x2: hr[0], y2: hr[1], w: 9.5, bend: o.hold ? -26 : 9, color: S[0], line: S[3] });
    if (o.hold === 'sickle') {
      up += `<g transform="translate(${n(hr[0])} ${n(hr[1])}) rotate(${n(-14 + Math.sin(T * 0.9) * 3)})">` +
        `<rect x="-5" y="-8" width="10" height="74" rx="4" fill="#5a3e28"/><rect x="-5" y="-8" width="10" height="74" rx="4" fill="none" stroke="#3a2818" stroke-width="1"/>` +
        `<path d="M1 -6 C-6 -64 34 -104 84 -110 C108 -112 124 -100 128 -88 C112 -98 92 -100 70 -94 C34 -84 12 -52 9 -4 Z" fill="${HE.lg([[0, '#a3a8b0'], [0.5, '#6c7078'], [1, '#7a4a30']], 0, 0, 1, 1)}"/>` +
        `<path d="M8 -10 C10 -54 40 -88 80 -100" stroke="#d7dce3" stroke-width="2" fill="none" opacity="0.8"/>` +
        `<path d="M58 -98 q9 4 7 11 M34 -84 q7 5 2 12 M96 -104 q6 6 2 11" stroke="#7a3a22" stroke-width="3.5" fill="none" opacity="0.75"/></g>`;
      up += M.hand({ x: hr[0], y: hr[1], angle: 165, s: 0.6, spread: 0.4, curl: 0.6, mirror: true, color: S[0], shade: S[2], line: S[3] });
    } else up += M.hand({ x: hr[0], y: hr[1], angle: pose === 'reach' ? 100 : 180, s: 0.62, spread: 0.75, curl: 0.12, mirror: true, color: S[0], shade: S[2], line: S[3] });
    up += M.hand({ x: hl[0], y: hl[1], angle: pose === 'reach' ? 160 : 180, s: 0.62, spread: 0.75, curl: 0.12, color: S[0], shade: S[2], line: S[3] });
    // Hals
    up += `<path d="M-7 ${shY - 6} L-8 ${hcy + headSize * 0.4} L8 ${hcy + headSize * 0.4} L7 ${shY - 6} Z" fill="${HE.lg([[0, S[3]], [1, S[1]]], 0, 0, 0, 1)}"/>`;
    up += `<path d="M-3 ${shY - 30} L-4 ${shY - 8} M3 ${shY - 30} L4 ${shY - 8}" stroke="${S[4]}" stroke-width="0.9" opacity="0.5"/>`;
    // Kopf
    let head = M.face(c, Object.assign({}, o, { cx: 0, cy: hcy, size: headSize }));
    if (hairO) head += M.hairFront(c, { cx: 0, cy: hcy, size: headSize, color: hairO.color, len: hairO.len * 0.55, style: hairO.style, strands: hairO.strands, seed: o.seed || 'fig' });
    if (o.hat === 'sun') head += M.sunHat({ cx: 0, cy: hcy - headSize * 0.6, size: headSize * 2.55 });
    up += `<g transform="rotate(${n(bendA * 0.5 + (o.headTilt || 0))} 0 ${shY - 20})">${head}</g>`;
    g += `<g transform="${rot}">${up}</g>`;
    return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(k * (o.facing || 1) * 1000) / 1000} ${n(k * 1000) / 1000})"${o.opacity != null ? ` opacity="${n(o.opacity)}"` : ''}>${g}</g>`;
  };

  // kriechender Oberkörper (auf den Ellbogen), Kopf erhoben, schaut zur Kamera. Blickrichtung: rechts (facing:-1 → links)
  M.crawler = function (c, o = {}) {
    const { x = 360, y = 1000, h = 640 } = o;
    const T = c ? c.T : 0;
    const k = h / 640;
    const S = skinOf(o);
    const pull = Math.sin(T * 5) * 7;
    const hairO = Object.assign({ color: M.HAIR, len: 110, style: 'hime' }, o.hair || {});
    const dress = o.dressColor || '#eceef3';
    let g = `<ellipse cx="-20" cy="3" rx="190" ry="12" fill="#000" opacity="0.35"/>`;
    // Blutspur
    g += `<path d="M-200 -4 Q-260 0 -330 -2" stroke="#5a0f12" stroke-width="10" fill="none" opacity="0.7"/>`;
    // Haare hinten (hängen bis zum Boden)
    const hs = o.headSize || 118, hx = 70, hy = -168 + Math.sin(T * 5) * 2;
    g += M.hairBack({ cx: hx, cy: hy, size: hs, len: hairO.len, color: hairO.color, width: 1.05 });
    // Rumpf (liegend)
    g += `<path d="M-205 -6 Q-210 -84 -120 -104 L20 -116 Q58 -96 52 -10 Z" fill="${HE.lg([[0, dress], [1, HE.shade(dress, -0.25)]], 0, 0, 0, 1)}"/>`;
    g += `<path d="M-205 -6 Q-214 -40 -206 -74" stroke="#7a1418" stroke-width="7" fill="none"/>`;
    if (o.outfit === 'uniform') {
      g += `<path d="M-60 -110 L20 -118 L40 -96 L-20 -70 Z" fill="#141c35"/><path d="M-50 -100 L22 -108 M-40 -90 L26 -98" stroke="#e8eaf0" stroke-width="1.6"/>`;
      g += `<path d="M26 -60 L48 -62 L38 -34 Z" fill="#c22f33"/>`;
    }
    // Arme: Schulter → Ellbogen am Boden → Hand vorn
    g += M.arm({ x1: 18, y1: -96, x2: 160 + pull, y2: -12, w: 13, bend: -40, color: S[0], line: S[3] });
    g += M.hand({ x: 160 + pull, y: -12, angle: 96, s: 0.72, spread: 1.0, curl: 0.35, color: S[0], shade: S[2], line: S[3] });
    // Kopf
    g += M.face(c, Object.assign({ look: [0, 0.15] }, o, { cx: hx, cy: hy, size: hs }));
    g += M.hairFront(c, { cx: hx, cy: hy, size: hs, color: hairO.color, len: hairO.len * 0.7, style: hairO.style, strands: hairO.strands, seed: 'crawl' });
    // zweiter Arm vorn
    g += M.arm({ x1: -10, y1: -86, x2: 118 - pull, y2: -8, w: 13, bend: -36, color: S[0], line: S[3] });
    g += M.hand({ x: 118 - pull, y: -8, angle: 100, s: 0.72, spread: 1.0, curl: 0.35, color: S[0], shade: S[2], line: S[3] });
    if (o.hold === 'scythe') g += `<g transform="translate(-120 -8) rotate(-3)"><rect x="-210" y="-4" width="210" height="8" rx="3" fill="#5a3e28"/><path d="M-210 -2 C-240 -70 -300 -86 -350 -50 C-300 -66 -256 -46 -220 6 Z" fill="${HE.lg([[0, '#8a8e96'], [1, '#6a3a22']], 0, 0, 1, 0)}"/></g>`;
    return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(k * (o.facing || 1) * 1000) / 1000} ${n(k * 1000) / 1000})"${o.opacity != null ? ` opacity="${n(o.opacity)}"` : ''}>${g}</g>`;
  };


  // ------------------------------------------------------------------ Requisit: Sichel
  // x,y = Griff-Hand, angle Grad, s Skalierung (1 ≈ 130 px), rust 0..1
  M.sickle = function (o = {}) {
    const { x = 0, y = 0, angle = -14, s = 1, rust = 1 } = o;
    return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)}) scale(${n(s)})">` +
      `<rect x="-5" y="-8" width="10" height="74" rx="4" fill="#5a3e28" stroke="#3a2818" stroke-width="1"/>` +
      `<path d="M1 -6 C-6 -64 34 -104 84 -110 C108 -112 124 -100 128 -88 C112 -98 92 -100 70 -94 C34 -84 12 -52 9 -4 Z" fill="${HE.lg([[0, '#a3a8b0'], [0.5, '#6c7078'], [1, rust ? '#7a4a30' : '#6c7078']], 0, 0, 1, 1)}"/>` +
      `<path d="M8 -10 C10 -54 40 -88 80 -100" stroke="#e2e6ec" stroke-width="2" fill="none" opacity="0.85"/>` +
      (rust ? `<path d="M58 -98 q9 4 7 11 M34 -84 q7 5 2 12 M96 -104 q6 6 2 11" stroke="#7a3a22" stroke-width="3.5" fill="none" opacity="0.75"/>` : '') + `</g>`;
  };

  // ------------------------------------------------------------------ Leichentuch-Wesen (ganzer Körper)
  M.shroud = function (c, o = {}) {
    const { x = 360, y = 1000, h = 520 } = o;
    const T = c ? c.T : 0;
    const k = h / 520;
    const hop = o.hop ? Math.abs(Math.sin(T * Math.PI * (o.hopRate || 1.2))) * 34 : 0;
    const cloth = o.cloth || '#dfe1e6', sh = '#a6aab6', rim = o.rim || '#f2e2b8';
    let g = `<ellipse cx="0" cy="3" rx="${n(56 - hop * 0.5)}" ry="9" fill="#000" opacity="0.32"/>`;
    g += `<g transform="translate(0 ${n(-hop)})">`;
    const body = 'M-30 -30 C-62 -140 -66 -300 -56 -380 C-50 -440 -30 -462 0 -464 C30 -462 50 -440 56 -380 C66 -300 62 -140 30 -30 C18 -6 -18 -6 -30 -30 Z';
    g += `<path d="${body}" fill="${HE.lg([[0, '#f0f1f4'], [0.5, cloth], [1, HE.shade(cloth, -0.18)]], 0, 0, 1, 0)}"/>`;
    g += `<path d="M40 -420 C62 -320 60 -140 30 -32" stroke="${rim}" stroke-width="5" fill="none" opacity="0.7"/>`;
    // Wickel-Bänder / Falten
    [-360, -300, -230, -160, -90].forEach((yy, i) => { g += `<path d="M${-54 + i} ${yy} Q0 ${yy + 22} ${52 - i} ${yy - 14}" stroke="${sh}" stroke-width="2.6" fill="none" opacity="0.75"/>`; });
    g += `<path d="M-20 -260 L-30 -60 M10 -250 L18 -70 M-4 -200 L-8 -40" stroke="${sh}" stroke-width="1.6" opacity="0.5"/>`;
    // Knoten unten (Füße zusammengebunden)
    g += `<path d="M-22 -18 L-40 8 Q0 -2 40 8 L22 -18 Z" fill="${cloth}"/><circle cx="0" cy="-22" r="8" fill="none" stroke="${sh}" stroke-width="3.2"/>`;
    // Hals-Knoten
    g += `<path d="M-40 -330 Q0 -316 40 -330" stroke="${sh}" stroke-width="3" fill="none"/><circle cx="0" cy="-324" r="7" fill="none" stroke="${sh}" stroke-width="3"/>`;
    // Kopf-Knoten (Bonbon-Fächer)
    g += `<path d="M-14 -462 L-34 -520 L-18 -508 L-10 -530 L0 -512 L10 -530 L18 -508 L34 -520 L14 -462 Z" fill="${cloth}" stroke="${sh}" stroke-width="1.5"/>`;
    g += `<path d="M-8 -470 L-22 -512 M0 -470 L-2 -520 M8 -470 L20 -512" stroke="${sh}" stroke-width="1.4"/>`;
    g += `<circle cx="0" cy="-462" r="8" fill="none" stroke="${sh}" stroke-width="3"/>`;
    // Gesichtsöffnung + Gesicht
    g += `<ellipse cx="0" cy="-392" rx="36" ry="44" fill="#b9bcc4"/>`;
    g += M.face(c, Object.assign({ skin: 'corpse', eyes: o.eyes || 'wide', mouth: o.mouth || 'teeth', wrinkles: 1, spots: 18, bags: 0.6, eyeSize: 13, bloodshot: 1 }, o.face || {}, { cx: 0, cy: -388, size: 60 }));
    g += `<ellipse cx="0" cy="-392" rx="36" ry="44" fill="none" stroke="${sh}" stroke-width="3"/>`;
    g += `</g>`;
    return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(k * 1000) / 1000})"${o.opacity != null ? ` opacity="${n(o.opacity)}"` : ''}>${g}</g>`;
  };

  // Leichentuch-Büste (Porträt/Nahaufnahme)
  M.shroudBust = function (c, o = {}) {
    const { cx = 360, cy = 560, size = 260 } = o;
    const k = size / 100;
    const cloth = o.cloth || '#dfe1e6', sh = '#a6aab6';
    let s = `<g transform="translate(${n(cx)} ${n(cy)}) scale(${n(k * 1000) / 1000})">`;
    s += `<path d="M-125 260 C-130 150 -105 95 -60 80 C-80 40 -82 -40 -70 -80 C-58 -118 -30 -132 0 -133 C30 -132 58 -118 70 -80 C82 -40 80 40 60 80 C105 95 130 150 125 260 Z" fill="${HE.lg([[0, '#f2f3f6'], [0.6, cloth], [1, HE.shade(cloth, -0.2)]], 0, 0, 1, 0)}"/>`;
    s += `<path d="M66 -92 C84 -40 80 40 62 82" stroke="${o.rim || '#f2e2b8'}" stroke-width="3" fill="none" opacity="0.75"/>`;
    s += `<path d="M-16 -132 L-40 -186 L-20 -172 L-10 -196 L0 -176 L10 -196 L20 -172 L40 -186 L16 -132 Z" fill="${cloth}" stroke="${sh}" stroke-width="1.2"/>`;
    s += `<path d="M-8 -136 L-24 -178 M0 -136 L-1 -186 M8 -136 L22 -178" stroke="${sh}" stroke-width="1.2"/><circle cx="0" cy="-132" r="7" fill="none" stroke="${sh}" stroke-width="2.4"/>`;
    [[-60, -60, -20, -98], [-66, -10, -40, -40], [60, -70, 28, -100], [66, -20, 42, -46]].forEach(([a, b, cc, d]) => { s += `<line x1="${a}" y1="${b}" x2="${cc}" y2="${d}" stroke="${sh}" stroke-width="2" opacity="0.6"/>`; });
    s += `<path d="M-60 82 Q0 96 60 82" stroke="${sh}" stroke-width="2.4" fill="none"/><circle cx="0" cy="90" r="7" fill="none" stroke="${sh}" stroke-width="2.4"/>`;
    [[-70, 120, 70, 160], [-90, 170, 80, 220], [-40, 110, -60, 250], [30, 110, 50, 250]].forEach(([a, b, cc, d]) => { s += `<line x1="${a}" y1="${b}" x2="${cc}" y2="${d}" stroke="${sh}" stroke-width="2" opacity="0.5"/>`; });
    s += `<ellipse cx="0" cy="-6" rx="50" ry="62" fill="#b4b8c0"/>`;
    s += `</g>`;
    s += M.face(c, Object.assign({ skin: 'corpse', eyes: 'wide', mouth: 'teeth', wrinkles: 1, spots: 22, bags: 0.6, eyeSize: 12.5 }, o, { cx, cy: cy - 2 * k, size: 84 * k }));
    s += `<ellipse cx="${n(cx)}" cy="${n(cy - 6 * k)}" rx="${n(50 * k)}" ry="${n(62 * k)}" fill="none" stroke="${sh}" stroke-width="${n(2.6 * k)}"/>`;
    if (o.sparkles !== false) s += M.sparkles(c, { area: [cx - size, cy - size, size * 2, size * 2], cnt: 10, size: 3 * Math.sqrt(k), seed: 'sb' });
    return s;
  };

  // ------------------------------------------------------------------ Schattengestalt
  M.shadow = function (c, o = {}) {
    const { x = 360, y = 1000, h = 560 } = o;
    const T = c ? c.T : 0;
    const col = o.color || '#07080b';
    let g = `<ellipse cx="0" cy="2" rx="64" ry="9" fill="#000" opacity="0.5"/>`;
    g += `<path d="M-52 0 Q-74 ${-h * 0.4} -50 ${-h * 0.72} Q-40 ${-h * 0.96} 0 ${-h} Q40 ${-h * 0.96} 50 ${-h * 0.72} Q74 ${-h * 0.4} 52 0 Z" fill="${col}"/>`;
    g += M.arm({ x1: -42, y1: -h * 0.7, x2: -72 + Math.sin(T) * 4, y2: -h * 0.16, w: 13, bend: -16, color: col, line: col });
    g += M.arm({ x1: 42, y1: -h * 0.7, x2: 72 + Math.sin(T + 1) * 4, y2: -h * 0.16, w: 13, bend: 16, color: col, line: col });
    g += M.hand({ x: -72 + Math.sin(T) * 4, y: -h * 0.16, angle: 182, s: 0.7, color: col, shade: '#15161c', line: col, nails: '#000' });
    g += M.hand({ x: 72 + Math.sin(T + 1) * 4, y: -h * 0.16, angle: 178, s: 0.7, mirror: true, color: col, shade: '#15161c', line: col, nails: '#000' });
    const ey = -h * 0.86;
    g += HE.fx.glow(-15, ey, 34, o.eyeColor || '#ffffff', 0.4) + HE.fx.glow(15, ey, 34, o.eyeColor || '#ffffff', 0.4);
    g += `<ellipse cx="-15" cy="${ey}" rx="8" ry="4.5" fill="${o.eyeColor || '#f4f4f4'}"/><ellipse cx="15" cy="${ey}" rx="8" ry="4.5" fill="${o.eyeColor || '#f4f4f4'}"/>`;
    if (o.grin) g += `<path d="M-24 ${ey + 28} Q0 ${ey + 48} 24 ${ey + 28}" stroke="#e8e8e8" stroke-width="3" fill="none"/>`;
    return `<g transform="translate(${n(x)} ${n(y)})"${o.opacity != null ? ` opacity="${n(o.opacity)}"` : ''}>${g}</g>`;
  };

  // ------------------------------------------------------------------ dürre Kreatur (optional Geweih)
  M.thin = function (c, o = {}) {
    const { x = 360, y = 1000, h = 600 } = o;
    const T = c ? c.T : 0;
    const S = skinOf(Object.assign({ skin: 'ash' }, o));
    let g = `<ellipse cx="0" cy="3" rx="60" ry="8" fill="#000" opacity="0.3"/>`;
    g += M.arm({ x1: -12, y1: -h * 0.46, x2: -16, y2: 0, w: 12, bend: 16, color: S[1], line: S[3] });
    g += M.arm({ x1: 12, y1: -h * 0.46, x2: 16, y2: 0, w: 12, bend: -16, color: S[1], line: S[3] });
    g += `<path d="M-28 ${-h * 0.45} Q-36 ${-h * 0.62} -24 ${-h * 0.77} L24 ${-h * 0.77} Q36 ${-h * 0.62} 28 ${-h * 0.45} Z" fill="${HE.lg([[0, S[1]], [1, S[2]]], 0, 0, 0, 1)}"/>`;
    for (let i = 0; i < 5; i++) g += `<path d="M-20 ${-h * (0.72 - i * 0.045)} Q0 ${-h * (0.7 - i * 0.045)} 20 ${-h * (0.72 - i * 0.045)}" stroke="${S[3]}" stroke-width="2" fill="none" opacity="0.8"/>`;
    const arm = (sx, ph) => { const hx = sx * (52 + Math.sin(T + ph) * 4), hy = -h * 0.18; return M.arm({ x1: sx * 22, y1: -h * 0.75, x2: hx, y2: hy, w: 9, bend: sx * 24, color: S[1], line: S[3] }) + M.hand({ x: hx, y: hy, angle: 180, s: 0.55, spread: 0.7, curl: 0.2, mirror: sx < 0, color: S[0], shade: S[2], line: S[3] }); };
    g += arm(-1, 0) + arm(1, 2);
    g += M.face(c, Object.assign({ skin: S, eyes: 'hollow', mouth: 'scream', open: 0.5, bags: 0.3, wrinkles: 1 }, o.face || {}, { cx: 0, cy: -h * 0.86, size: 62 }));
    if (o.antlers) {
      const ant = (sx) => `<path d="M${sx * 16} ${-h * 0.9} L${sx * 44} ${-h * 1.02} L${sx * 58} ${-h * 1.13} M${sx * 44} ${-h * 1.02} L${sx * 74} ${-h * 1.04} M${sx * 30} ${-h * 0.96} L${sx * 32} ${-h * 1.09}" stroke="#d9d2c0" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      g += ant(-1) + ant(1);
    }
    return `<g transform="translate(${n(x)} ${n(y)}) scale(${n((o.facing || 1) * 1000) / 1000} 1)"${o.opacity != null ? ` opacity="${n(o.opacity)}"` : ''}>${g}</g>`;
  };
})();
