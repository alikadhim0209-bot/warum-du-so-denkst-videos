/* =====================================================================================
   HE – Horror Engine · core
   Zeitleiste, Kamera, Übergänge, Kontext pro Frame, SVG-Defs, Hilfsfunktionen.
   Koordinatensystem: 720 × 1280 (wie die Referenz). Gerendert wird mit deviceScaleFactor 1.5
   → 1080 × 1920. Alles ist deterministisch: gleiche Zeit T ⇒ gleiches Bild.
   ===================================================================================== */
(function () {
  const HE = (window.HE = window.HE || {});
  HE.W = 720; HE.H = 1280; HE.CX = 360; HE.CY = 640;

  // ------------------------------------------------------------------ Mathe & Werkzeuge
  HE.clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  HE.lerp = (a, b, t) => a + (b - a) * t;
  HE.inv = (a, b, x) => (b === a ? (x >= b ? 1 : 0) : HE.clamp((x - a) / (b - a)));
  HE.ease = {
    linear: (t) => t,
    in: (t) => t * t,
    out: (t) => 1 - (1 - t) * (1 - t),
    inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    out3: (t) => 1 - Math.pow(1 - t, 3),
    in3: (t) => t * t * t,
    outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  };
  HE.E = (name, t) => (HE.ease[name] || HE.ease.inOut)(HE.clamp(t));
  // Zahl für SVG kürzen
  HE.n = (v) => (Math.round(v * 100) / 100).toString();
  // deterministischer Zufall
  HE.rng = function (seed) {
    let a = (typeof seed === 'string' ? HE.hash(seed) : seed) >>> 0;
    const f = function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.range = (lo, hi) => lo + (hi - lo) * f();
    f.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * f());
    f.pick = (arr) => arr[Math.floor(f() * arr.length)];
    return f;
  };
  HE.hash = function (s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  // glattes 1D-Rauschen (für Wackeln, Flackern, Atmen)
  HE.noise = function (x, seed = 0) {
    const i = Math.floor(x), f = x - i;
    const r = (k) => { const v = Math.sin((k + seed * 131.7) * 127.1) * 43758.5453; return v - Math.floor(v); };
    const u = f * f * (3 - 2 * f);
    return HE.lerp(r(i), r(i + 1), u) * 2 - 1; // -1..1
  };
  HE.flicker = (T, seed = 1, depth = 0.25) => 1 - depth * Math.max(0, HE.noise(T * 7, seed) * 0.6 + HE.noise(T * 23, seed + 5) * 0.4);

  // ------------------------------------------------------------------ Farben
  HE.hex2rgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  HE.rgb2hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(HE.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  HE.mix = (c1, c2, t) => { const a = HE.hex2rgb(c1), b = HE.hex2rgb(c2); return HE.rgb2hex(HE.lerp(a[0], b[0], t), HE.lerp(a[1], b[1], t), HE.lerp(a[2], b[2], t)); };
  HE.shade = (c, amt) => (amt >= 0 ? HE.mix(c, '#ffffff', amt) : HE.mix(c, '#000000', -amt));

  // ------------------------------------------------------------------ SVG-Defs (pro Frame)
  HE.defs = {
    map: new Map(),
    reset() { this.map.clear(); },
    add(id, svg) { if (!this.map.has(id)) this.map.set(id, svg); return id; },
    svg() { return '<defs>' + Array.from(this.map.values()).join('') + '</defs>'; },
  };
  const stopsSVG = (stops) => stops.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}" stop-opacity="${s[2] == null ? 1 : s[2]}"/>`).join('');
  // linearer Verlauf; Rückgabe: "url(#id)"
  HE.lg = function (stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1, units) {
    const id = 'lg' + HE.hash(JSON.stringify([stops, x1, y1, x2, y2, units]));
    HE.defs.add(id, `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${units ? ' gradientUnits="userSpaceOnUse"' : ''}>${stopsSVG(stops)}</linearGradient>`);
    return `url(#${id})`;
  };
  // radialer Verlauf (objectBoundingBox) oder mit userSpace-Koordinaten (cx,cy,r in px)
  HE.rg = function (stops, cx = 0.5, cy = 0.5, r = 0.5, units, fx, fy) {
    const id = 'rg' + HE.hash(JSON.stringify([stops, cx, cy, r, units, fx, fy]));
    HE.defs.add(id, `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx != null ? ` fx="${fx}" fy="${fy}"` : ''}${units ? ' gradientUnits="userSpaceOnUse"' : ''}>${stopsSVG(stops)}</radialGradient>`);
    return `url(#${id})`;
  };
  HE.blurF = function (std) {
    const id = 'bl' + Math.round(std * 10);
    HE.defs.add(id, `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${std}"/></filter>`);
    return `url(#${id})`;
  };
  // Papier-/Stoffkorn als Muster (statisch, günstig)
  HE.grainPattern = function (opacity = 0.08, size = 3, seed = 7, color = '#000') {
    const id = 'gp' + HE.hash([opacity, size, seed, color].join());
    if (!HE.defs.map.has(id)) {
      const r = HE.rng(seed); let dots = '';
      for (let i = 0; i < 90; i++) dots += `<rect x="${HE.n(r() * 60)}" y="${HE.n(r() * 60)}" width="${size * (0.4 + r() * 0.6)}" height="${size * (0.4 + r() * 0.6)}" fill="${color}" opacity="${HE.n(opacity * (0.3 + r()))}"/>`;
      HE.defs.add(id, `<pattern id="${id}" width="60" height="60" patternUnits="userSpaceOnUse">${dots}</pattern>`);
    }
    return `url(#${id})`;
  };


  // Beliebiges SVG als einfarbige Silhouette (Schattenspiel / Scherenschnitt): HE.silhouette(svg, '#141210')
  HE.silhouette = function (svg, color = '#141210', opacity = 1) {
    const id = 'mono' + color.replace('#', '');
    HE.defs.add(id, `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feFlood flood-color="${color}" flood-opacity="${opacity}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`);
    return `<g filter="url(#${id})">${svg}</g>`;
  };

  // ------------------------------------------------------------------ Story-Registrierung
  HE._story = null;
  HE.story = function (def) { HE._story = def; };
  HE.lang = () => (HE._story && HE._story.lang) || 'de';
  HE.T = function (key) { // UI-Texte je Sprache
    const L = {
      de: { legend: 'DIE LEGENDE', threat: 'GEFAHRENSTUFE', levels: ['HARMLOS', 'UNHEIMLICH', 'GEFÄHRLICH', 'TÖDLICH'], call: 'eingehender Anruf' },
      en: { legend: 'THE LEGEND', threat: 'THREAT LEVEL', levels: ['HARMLESS', 'UNSETTLING', 'DANGEROUS', 'DEADLY'], call: 'incoming call' },
    };
    return (L[HE.lang()] || L.de)[key];
  };

  // ------------------------------------------------------------------ Zeitleiste
  // timing.json (von tools/horror.py align) → Shots mit Start/Ende.
  HE.load = function (timing) {
    HE.timing = timing;
    const S = HE._story;
    if (!S) throw new Error('Keine Story registriert (HE.story({...}) fehlt).');
    const shots = [];
    const lead = S.lead != null ? S.lead : 0.3; // Schnitt liegt 0,3 s vor dem ersten Wort der Einstellung
    S.shots.forEach((sh, i) => {
      let start;
      if (i === 0) start = 0;
      else if (typeof sh.at === 'number') start = sh.at;
      else {
        const id = sh.at || sh.id;
        const m = timing.markers[id];
        if (m == null) throw new Error('Marker [#' + id + '] fehlt im Skript/timing.json');
        start = Math.max(0, m - (sh.lead != null ? sh.lead : lead));
      }
      shots.push(Object.assign({}, sh, { start, idx: i }));
    });
    shots.sort((a, b) => a.start - b.start);
    for (let i = 0; i < shots.length; i++) shots[i].end = i + 1 < shots.length ? shots[i + 1].start : timing.duration;
    HE.shots = shots;
    HE.captions.build(timing);
    return shots.map((s) => ({ id: s.id, start: +s.start.toFixed(2), end: +s.end.toFixed(2), dur: +(s.end - s.start).toFixed(2) }));
  };

  // Zeit eines Beats/Markers (Videozeit)
  HE.beatTime = function (name) {
    const tm = HE.timing;
    if (tm.beats && tm.beats[name] != null) return tm.beats[name];
    if (tm.markers && tm.markers[name] != null) return tm.markers[name];
    return null;
  };

  // ------------------------------------------------------------------ Kamera
  // cam: {x,y,z,r} | {from:{..}, to:{..}, ease} | function(c) → {x,y,z,r}
  HE.DEFAULT_CAM = { from: { x: 360, y: 640, z: 1.0 }, to: { x: 360, y: 640, z: 1.06 }, ease: 'inOut' };
  HE.resolveCam = function (cam, c) {
    cam = cam == null ? HE.DEFAULT_CAM : cam;
    let o;
    if (typeof cam === 'function') o = cam(c);
    else if (cam.from) {
      const k = HE.E(cam.ease || 'inOut', c.p);
      const a = Object.assign({ x: 360, y: 640, z: 1, r: 0 }, cam.from), b = Object.assign({}, a, cam.to);
      o = { x: HE.lerp(a.x, b.x, k), y: HE.lerp(a.y, b.y, k), z: HE.lerp(a.z, b.z, k), r: HE.lerp(a.r || 0, b.r || 0, k) };
    } else o = Object.assign({ x: 360, y: 640, z: 1, r: 0 }, cam);
    o = Object.assign({ x: 360, y: 640, z: 1, r: 0 }, o);
    // Wackler (shake): c.shakeAmt wird von Effekten gesetzt
    if (c.shakeAmt > 0) {
      o.x += HE.noise(c.T * 31, 3) * c.shakeAmt;
      o.y += HE.noise(c.T * 29, 9) * c.shakeAmt;
      o.r += HE.noise(c.T * 17, 4) * c.shakeAmt * 0.05;
    }
    // ganz leichtes „Atmen“ der Kamera (Handkamera-Gefühl, sehr subtil)
    if (c.breath !== 0) {
      const b = c.breath == null ? 1 : c.breath;
      o.x += HE.noise(c.T * 0.35, 11) * 1.6 * b;
      o.y += HE.noise(c.T * 0.3, 12) * 1.6 * b;
    }
    return o;
  };
  HE.camTransform = function (cam, depth = 1) {
    const z = 1 + (cam.z - 1) * depth;
    const cx = 360 + (cam.x - 360) * depth, cy = 640 + (cam.y - 640) * depth;
    const r = (cam.r || 0) * depth;
    return `translate(360 640)${r ? ` rotate(${HE.n(r)})` : ''} scale(${HE.n(z * 1000) / 1000}) translate(${HE.n(-cx)} ${HE.n(-cy)})`;
  };

  // ------------------------------------------------------------------ Kontext pro Frame
  HE.makeCtx = function (shot, T) {
    const c = {
      T, shot, id: shot.id,
      t: T - shot.start, d: shot.end - shot.start,
      W: 720, H: 1280, shakeAmt: 0, breath: shot.breath,
      _layers: [], _screen: [], _layered: false,
    };
    c.p = HE.clamp(c.t / Math.max(0.001, c.d));
    // Beat relativ zum Shot-Start (Sekunden). Unbekannt → null
    c.beat = (name) => { const b = HE.beatTime(name); return b == null ? null : b - shot.start; };
    // 0..1 nach einem Beat (oder nach Sekunden, wenn Zahl)
    c.after = (name, dur = 0.6, ease = 'out') => {
      const b = typeof name === 'number' ? name : c.beat(name);
      if (b == null) return 0;
      return HE.E(ease, (c.t - b) / dur);
    };
    // 0..1 über ein Zeitfenster innerhalb des Shots
    c.win = (a, b, ease = 'inOut') => HE.E(ease, (c.t - a) / Math.max(0.001, b - a));
    c.rng = (seed) => HE.rng((shot.id || 's') + ':' + seed);
    c.L = (depth, svg) => { c._layered = true; return `<g transform="${HE.camTransform(c.cam, depth)}">${svg}</g>`; };
    c.S = (svg) => { c._screen.push(svg); return ''; };
    c.shake = (amount) => { c.shakeAmt = Math.max(c.shakeAmt, amount); };
    // Wackler an einem Beat: amp px, Dauer s
    c.shakeAt = (name, amp = 14, dur = 0.5) => {
      const b = typeof name === 'number' ? name : c.beat(name);
      if (b == null) return;
      const k = (c.t - b) / dur;
      if (k >= 0 && k <= 1) c.shake(amp * (1 - k));
    };
    return c;
  };

  // ------------------------------------------------------------------ Shot zeichnen
  HE.drawShot = function (shot, T) {
    const c = HE.makeCtx(shot, T);
    // Effekte, die die Kamera beeinflussen, vorab (shake-Liste im Shot)
    // shakes: [{at:'beat'|Sekunden, atFrac:0..1 (Anteil der Shot-Dauer), amp:px, dur:s}]
    if (shot.shakes) shot.shakes.forEach((s) => c.shakeAt(s.atFrac != null ? c.d * s.atFrac : s.at, s.amp, s.dur));
    c.cam = HE.resolveCam(shot.cam, c);
    let body = '';
    if (shot.type === 'title') body = HE.titleCard(c, Object.assign({}, HE._story.title, shot.title || {}));
    else if (typeof shot.draw === 'function') body = shot.draw(c) || '';
    if (!c._layered && shot.type !== 'title') body = `<g transform="${HE.camTransform(c.cam, 1)}">${body}</g>`;
    if (shot.legend) body = HE.legend.frame(c, shot.legend, body);
    return body + c._screen.join('');
  };

  // Schwarz-Deckkraft für Übergänge an Shot-Grenzen
  HE.fadeAlpha = function (i, T) {
    const s = HE.shots[i];
    const inT = s.trans === 'cut' ? 0 : s.trans === 'slow' ? 0.9 : 0.24;
    const nxt = HE.shots[i + 1];
    const outT = nxt ? (nxt.trans === 'cut' ? 0 : nxt.trans === 'slow' ? 0.9 : 0.22) : (HE._story.endFade != null ? HE._story.endFade : 1.1);
    let a = 0;
    if (inT > 0 && T - s.start < inT) a = Math.max(a, 1 - HE.E('out', (T - s.start) / inT));
    if (outT > 0 && s.end - T < outT) a = Math.max(a, 1 - HE.E('in', (s.end - T) / outT));
    if (i === 0 && T < 0.35) a = Math.max(a, 1 - HE.E('out', T / 0.35)); // Aufblende am Anfang
    return HE.clamp(a);
  };

  // ------------------------------------------------------------------ Frame rendern
  HE.render = function (T) {
    HE.defs.reset();
    let i = HE.shots.findIndex((s) => T >= s.start && T < s.end);
    if (i < 0) i = HE.shots.length - 1;
    const shot = HE.shots[i];
    let body = HE.drawShot(shot, T);
    // Weiß-Blitz (trans:'flash')
    let flash = 0;
    if (shot.trans === 'flash' && T - shot.start < 0.35) flash = 1 - (T - shot.start) / 0.35;
    const a = HE.fadeAlpha(i, T);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 1280" width="720" height="1280" style="display:block">` +
      HE.defs.svg() +
      `<rect width="720" height="1280" fill="#000"/>` + body +
      (flash > 0 ? `<rect width="720" height="1280" fill="#fff" opacity="${HE.n(flash)}"/>` : '') +
      (a > 0.001 ? `<rect width="720" height="1280" fill="#030405" opacity="${HE.n(a)}"/>` : '') +
      `</svg>`;
    HE.stage.innerHTML = svg;
    HE.captions.update(T, a);
    return { shot: shot.id, i };
  };

  HE.init = function () {
    HE.stage = document.getElementById('stage');
  };
})();
