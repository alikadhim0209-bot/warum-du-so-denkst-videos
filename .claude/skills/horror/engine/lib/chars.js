/* =====================================================================================
   HE · chars – Figuren im „Papierpuppen“-Stil der Referenz.
   HE.kid(o)     – die Hauptfigur (Markenzeichen: senfgelbe Bommelmütze, roter Schal, blaue Jacke)
   HE.person(o)  – alle anderen Figuren (Oma, Opa, Freund, Polizist, Imam, Mönch, Dieb …)

   Gemeinsame Optionen:
     x, y        Fußpunkt (Mitte unten)          s       Skalierung (1 = ca. 234 px hoch beim Kind)
     facing      1 = schaut nach rechts, -1 = links
     pose        'stand' | 'walk' | 'run' | 'sit' | 'cower' | 'point' | 'reach' | 'armsUp' | 'hold' | 'pray' | 'grab'
     phase       Laufzyklus-Phase (Radiant) – HE.walk() liefert sie
     expr        'neutral' | 'worried' | 'scared' | 'shock' | 'sad' | 'smile' | 'angry' | 'sleep' | 'determined'
     look        -1..1 Blickrichtung (relativ zu facing), lookY -1..1
     back        true = Rückenansicht
     mood        'night' | 'dark' | 'snow' | 'dusk' … (färbt wie die Kulisse)
     dim         0..1 zusätzlich abdunkeln (Figur im Schatten)
     mono        Farbe → komplette Silhouette (Schattenspiel / Scherenschnitt)
     holding     SVG, das vor der Brust gehalten wird (pose 'hold')
     flashlight  {angle, len} – Taschenlampe in der Hand inkl. Lichtkegel
     shadow      false = kein Bodenschatten
   ===================================================================================== */
(function () {
  const HE = window.HE;
  const n = HE.n;

  const KIND = {
    kid: { headR: 36, headY: -175, coatTop: -136, coatBot: -46, coatW: 54, coatWB: 64, legTop: -50, legW: 11, legX: 10, shoeRx: 13 },
    teen: { headR: 35, headY: -205, coatTop: -165, coatBot: -58, coatW: 56, coatWB: 64, legTop: -62, legW: 12, legX: 10, shoeRx: 14 },
    adult: { headR: 34, headY: -232, coatTop: -194, coatBot: -66, coatW: 60, coatWB: 70, legTop: -70, legW: 13, legX: 11, shoeRx: 15 },
    elder: { headR: 34, headY: -222, coatTop: -184, coatBot: -60, coatW: 62, coatWB: 74, legTop: -64, legW: 13, legX: 11, shoeRx: 15 },
  };

  HE.KID_STYLE = { skin: '#f1eee6', hair: 'beanie', beanie: '#dba227', pom: '#efe9dc', scarf: '#d13b2e', top: '#2b4f8e', bottom: '#1f2638', shoes: '#141414' };

  HE.kid = (o = {}) => HE.person(Object.assign({ kind: 'kid' }, HE.KID_STYLE, o));

  // Laufen von A nach B im Zeitfenster [t0,t1] (Sekunden relativ zum Shot) → {x,y,phase,moving,facing}
  HE.walk = function (c, from, to, t0, t1, o = {}) {
    const k = HE.clamp((c.t - t0) / Math.max(0.001, t1 - t0));
    const e = o.ease ? HE.E(o.ease, k) : k;
    const x = HE.lerp(from[0], to[0], e), y = HE.lerp(from[1], to[1], e);
    const moving = k > 0 && k < 1;
    const dist = Math.hypot(to[0] - from[0], to[1] - from[1]) * e;
    const stride = o.stride || 62;
    return { x, y, phase: moving ? (dist / stride) * Math.PI : 0, moving, facing: to[0] >= from[0] ? 1 : -1, k };
  };

  HE.person = function (o = {}) {
    const K = KIND[o.kind || 'adult'];
    const mood = o.mood, dim = o.dim || 0;
    const ink = o.mono || '#151515';
    const paint = (col) => {
      if (o.mono) return o.mono;
      let c = HE.tone(col, mood);
      if (dim) c = HE.mix(c, o.dimColor || '#05070c', dim);
      return c;
    };
    const facing = o.facing || 1, s = o.s || 1;
    const pose = o.pose || 'stand', ph = o.phase || 0;
    const run = pose === 'run';
    const walking = pose === 'walk' || run;
    const amp = run ? 0.75 : 0.42;
    const bob = walking ? Math.abs(Math.cos(ph)) * (run ? 5 : 2.5) : 0;
    const lean = run ? 9 : pose === 'cower' ? 0 : 0;
    const crouch = pose === 'cower' ? 30 : 0;
    const sitting = pose === 'sit';

    const skin = paint(o.skin || '#f1eee6');
    const top = paint(o.top || '#3a6a4a');
    const topD = paint(HE.shade(o.top || '#3a6a4a', -0.22));
    const bottom = paint(o.bottom || '#2a2a33');
    const shoes = paint(o.shoes || '#161616');
    const lw = 2.2; // Konturstärke
    let g = '';

    // ---- Bodenschatten
    if (o.shadow !== false && !o.mono) g += `<ellipse cx="0" cy="0" rx="${n(K.coatWB * 0.62)}" ry="7" fill="#000" opacity="0.28"/>`;

    // Körper-Gruppe (für Hüpfen/Neigen)
    let body = '';
    const hipY = K.legTop + crouch;
    // ---- Beine
    const leg = (side, ang) => {
      const hx = side * K.legX * 0.55;
      if (sitting) {
        return `<path d="M${n(hx)} ${hipY} L${n(hx + 34)} ${hipY} L${n(hx + 34)} ${hipY + 40}" stroke="${bottom}" stroke-width="${K.legW}" fill="none" stroke-linejoin="round"/>` +
          `<ellipse cx="${n(hx + 40)}" cy="${hipY + 44}" rx="${K.shoeRx}" ry="7" fill="${shoes}"/>`;
      }
      const L = -hipY - 6 - crouch * 0.4;
      const ex = hx + Math.sin(ang) * L, ey = hipY + Math.cos(ang) * L;
      return `<line x1="${n(hx)}" y1="${n(hipY)}" x2="${n(ex)}" y2="${n(ey)}" stroke="${bottom}" stroke-width="${K.legW}" stroke-linecap="round"/>` +
        `<ellipse cx="${n(ex + 4)}" cy="${n(ey + 1)}" rx="${K.shoeRx}" ry="7" fill="${shoes}"/>`;
    };
    const aL = walking ? Math.sin(ph) * amp : 0, aR = walking ? -Math.sin(ph) * amp : 0;
    body += leg(-1, aL) + leg(1, aR);

    // ---- Arme (Hand-Zielpunkte)
    const shY = K.coatTop + 12, shX = K.coatW / 2 - 6;
    const handDown = (side) => [side * (K.coatWB / 2 + 2), K.coatBot - 8];
    let hl = handDown(-1), hr = handDown(1);
    if (walking) { const sw = Math.sin(ph) * (run ? 14 : 7); hl = [hl[0] - sw, hl[1] - (run ? 10 : 0)]; hr = [hr[0] + sw, hr[1] - (run ? 10 : 0)]; }
    if (pose === 'point') hr = [K.coatW / 2 + 52, K.coatTop + 4];
    if (pose === 'reach') { hl = [K.coatW / 2 + 34, K.coatTop + 22]; hr = [K.coatW / 2 + 48, K.coatTop + 12]; }
    if (pose === 'grab') hr = [K.coatW / 2 + 40, K.coatTop + 30];
    if (pose === 'armsUp') { hl = [-K.coatW / 2 - 18, K.coatTop - 46]; hr = [K.coatW / 2 + 18, K.coatTop - 46]; }
    if (pose === 'hold' || pose === 'pray') { hl = [-7, K.coatTop + 40]; hr = [7, K.coatTop + 40]; }
    if (pose === 'cower') { hl = [-K.headR + 6, K.headY + crouch - 8]; hr = [K.headR - 6, K.headY + crouch - 8]; }
    if (o.arms) { if (o.arms.l) hl = o.arms.l; if (o.arms.r) hr = o.arms.r; }
    const arm = (side, h) => {
      const sx = side * shX, sy = shY + crouch;
      return `<line x1="${n(sx)}" y1="${n(sy)}" x2="${n(h[0])}" y2="${n(h[1])}" stroke="${topD}" stroke-width="13" stroke-linecap="round"/>` +
        `<circle cx="${n(h[0])}" cy="${n(h[1])}" r="7.5" fill="${o.mono ? o.mono : paint(o.hands || (o.kind === 'kid' ? '#f1eee6' : o.skin || '#f1eee6'))}"/>`;
    };
    const armFront = ['point', 'reach', 'armsUp', 'hold', 'pray', 'cower', 'grab'].includes(pose) || o.arms;
    if (!armFront) body += arm(-1, hl) + arm(1, hr);

    // ---- Mantel / Oberteil
    const ct = K.coatTop + crouch, cb = K.coatBot + crouch * 0.6;
    const tw = K.coatW / 2, bw = K.coatWB / 2;
    const style = o.topStyle || 'coat';
    if (style === 'robe' || style === 'dress' || style === 'kimono') {
      const len = o.kind === 'kid' ? 40 : 52;
      body += `<path d="M${-tw} ${ct + 8} Q${-tw} ${ct} ${-tw + 10} ${ct} L${tw - 10} ${ct} Q${tw} ${ct} ${tw} ${ct + 8} L${bw + 8} ${cb + len} L${-bw - 8} ${cb + len} Z" fill="${top}"/>`;
      if (style === 'kimono') body += `<rect x="${-tw - 2}" y="${ct + 44}" width="${tw * 2 + 4}" height="14" fill="${paint(o.belt || '#7a2a2a')}"/><path d="M-10 ${ct} L0 ${ct + 30} L10 ${ct}" stroke="${paint('#e8e2d0')}" stroke-width="5" fill="none"/>`;
    } else {
      body += `<path d="M${-tw} ${ct + 10} Q${-tw} ${ct} ${-tw + 12} ${ct} L${tw - 12} ${ct} Q${tw} ${ct} ${tw} ${ct + 10} L${bw} ${cb - 6} Q${bw} ${cb} ${bw - 8} ${cb} L${-bw + 8} ${cb} Q${-bw} ${cb} ${-bw} ${cb - 6} Z" fill="${top}"/>`;
      if (!o.mono && style === 'coat') body += `<line x1="0" y1="${ct + 6}" x2="0" y2="${cb - 2}" stroke="${paint('#e8e8ee')}" stroke-width="2" opacity="0.8"/>`;
      if (o.number && !o.mono) body += `<text x="0" y="${ct + 48}" font-family="'SS3B'" font-size="22" text-anchor="middle" fill="${paint('#e9e9e9')}">${o.number}</text>`;
      if (style === 'uniform' && !o.mono) body += `<path d="M${-tw + 4} ${ct} L0 ${ct + 26} L${tw - 4} ${ct}" fill="none" stroke="${paint('#e9e9ee')}" stroke-width="4"/><path d="M-9 ${ct + 22} L9 ${ct + 22} L0 ${ct + 44} Z" fill="${paint('#c62f2f')}"/>`;
      if (o.pattern === 'dots' && !o.mono) for (let i = 0; i < 14; i++) body += `<circle cx="${n(-tw + 8 + (i % 4) * (tw * 2 - 16) / 3)}" cy="${n(ct + 12 + Math.floor(i / 4) * 18)}" r="2" fill="${paint(HE.shade(o.top || '#3a6a4a', 0.35))}"/>`;
    }
    if (o.skirt) body += `<rect x="${-bw + 2}" y="${cb - 4}" width="${bw * 2 - 4}" height="${-cb - 10}" fill="${paint(o.skirt)}"/>`;

    if (armFront) body += arm(-1, hl) + arm(1, hr);

    // gehaltenes Objekt
    if (o.holding) body += `<g transform="translate(0 ${ct + 40})">${o.holding}</g>`;
    // Taschenlampe
    if (o.flashlight && !o.mono) {
      const fa = o.flashlight.angle != null ? o.flashlight.angle : 10;
      g += ''; // Strahl wird nach dem Körper gezeichnet (siehe unten)
      body += `<rect x="${n(hr[0] - 4)}" y="${n(hr[1] - 6)}" width="18" height="10" rx="3" fill="${paint('#3a3a3a')}" transform="rotate(${fa} ${n(hr[0])} ${n(hr[1])})"/>`;
    }

    // ---- Schal
    const sc = o.scarf;
    if (sc && !o.mono) {
      const sy = ct - 6;
      const flap = walking ? Math.sin(ph * 2) * 5 : 0;
      body += `<rect x="${-tw + 2}" y="${sy}" width="${tw * 2 - 4}" height="13" rx="6" fill="${paint(sc)}"/>`;
      body += `<path d="M${tw - 10} ${sy + 8} L${tw - 2} ${sy + 8} L${n(-tw - 10 + flap)} ${sy + 56} L${n(-tw - 22 + flap)} ${sy + 50} Z" fill="${paint(sc)}"/>`;
    } else if (sc && o.mono) body += `<rect x="${-tw + 2}" y="${ct - 6}" width="${tw * 2 - 4}" height="13" rx="6" fill="${o.mono}"/>`;

    // ---- Kopf
    const hy = K.headY + crouch, R = K.headR;
    let head = '';
    const hair = o.hair || 'short';
    const hairC = paint(o.hairColor || '#151515');
    // Hinter-Elemente (Haare lang, Kopftuch)
    if (hair === 'long') head += `<path d="M${-R - 4} ${hy} Q${-R - 6} ${hy + R * 1.6} ${-R + 6} ${hy + R * 1.7} L${R - 6} ${hy + R * 1.7} Q${R + 6} ${hy + R * 1.6} ${R + 4} ${hy} Z" fill="${hairC}"/>`;
    if (hair === 'hijab') head += `<path d="M${-R - 9} ${hy - 4} Q${-R - 12} ${hy + R * 1.5} ${-R} ${hy + R * 1.9} L${R} ${hy + R * 1.9} Q${R + 12} ${hy + R * 1.5} ${R + 9} ${hy - 4} Q${R + 6} ${hy - R - 12} 0 ${hy - R - 12} Q${-R - 6} ${hy - R - 12} ${-R - 9} ${hy - 4} Z" fill="${paint(o.hijab || '#ecebe4')}"/>`;
    if (hair === 'bun') head += `<circle cx="${n(-R * 0.55)}" cy="${n(hy - R * 0.85)}" r="${n(R * 0.42)}" fill="${hairC}"/>`;
    // Gesicht
    head += `<circle cx="0" cy="${hy}" r="${R}" fill="${skin}" stroke="${ink}" stroke-width="${o.mono ? 0 : lw}"/>`;
    if (o.back && !o.mono) head += `<path d="M${-R + 1} ${hy - 4} A${R - 1} ${R - 1} 0 0 0 ${R - 1} ${hy - 4} L${R - 4} ${hy + R * 0.55} Q0 ${hy + R * 0.9} ${-R + 4} ${hy + R * 0.55} Z" fill="${hairC}"/>`;
    // Haare / Kopfbedeckung vorne
    const clipId = 'hc' + HE.hash([R, hy].join());
    HE.defs.add(clipId, `<clipPath id="${clipId}"><circle cx="0" cy="${hy}" r="${R - 1}"/></clipPath>`);
    if (hair === 'beanie') {
      const bc = paint(o.beanie || '#dba227'), bdk = paint(HE.shade(o.beanie || '#dba227', -0.18));
      head += `<rect x="${-R}" y="${hy - 10}" width="${R * 2}" height="6" fill="${hairC}" clip-path="url(#${clipId})"/>`;
      head += `<path d="M${-R - 2} ${hy - 10} L${-R - 2} ${hy - 18} Q${-R} ${hy - R - 18} 0 ${hy - R - 18} Q${R} ${hy - R - 18} ${R + 2} ${hy - 18} L${R + 2} ${hy - 10} Z" fill="${bc}"/>`;
      head += `<rect x="${-R - 3}" y="${hy - 23}" width="${R * 2 + 6}" height="14" rx="3" fill="${bdk}"/>`;
      if (!o.mono) for (let i = -R; i <= R; i += 5) head += `<line x1="${i}" y1="${hy - 22}" x2="${i}" y2="${hy - 10}" stroke="${paint(HE.shade(o.beanie || '#dba227', -0.35))}" stroke-width="1.3" opacity="0.6"/>`;
      head += `<circle cx="0" cy="${hy - R - 20}" r="10" fill="${paint(o.pom || '#efe9dc')}"/>`;
    } else if (hair === 'short' || hair === 'cap' || hair === 'bowl') {
      head += `<path d="M${-R} ${hy + 2} Q${-R} ${hy - R - 4} 0 ${hy - R - 4} Q${R} ${hy - R - 4} ${R} ${hy + 2} L${R - 6} ${hy - 6} Q0 ${hy - 14} ${-R + 6} ${hy - 6} Z" fill="${hairC}"/>`;
    } else if (hair === 'long') {
      head += `<path d="M${-R - 3} ${hy + 6} Q${-R - 2} ${hy - R - 6} 0 ${hy - R - 6} Q${R + 2} ${hy - R - 6} ${R + 3} ${hy + 6} L${R - 4} ${hy - 8} Q${R * 0.2} ${hy - 18} ${-R * 0.5} ${hy - 12} L${-R + 4} ${hy - 4} Z" fill="${hairC}"/>`;
    } else if (hair === 'bun' || hair === 'gray') {
      head += `<path d="M${-R} ${hy - 2} Q${-R + 2} ${hy - R - 4} 0 ${hy - R - 4} Q${R - 2} ${hy - R - 4} ${R} ${hy - 2} Q${R * 0.4} ${hy - R * 0.5} ${-R} ${hy - 2} Z" fill="${hairC}"/>`;
    } else if (hair === 'bald') {
      head += `<path d="M${-R + 1} ${hy + 4} Q${-R - 3} ${hy - 4} ${-R + 4} ${hy - 12}" stroke="${paint(o.hairColor || '#bdbdbd')}" stroke-width="6" fill="none"/><path d="M${R - 1} ${hy + 4} Q${R + 3} ${hy - 4} ${R - 4} ${hy - 12}" stroke="${paint(o.hairColor || '#bdbdbd')}" stroke-width="6" fill="none"/>`;
    } else if (hair === 'hijab') {
      head += `<path d="M${-R - 1} ${hy + 2} Q${-R - 2} ${hy - R - 8} 0 ${hy - R - 8} Q${R + 2} ${hy - R - 8} ${R + 1} ${hy + 2} Q${R * 0.7} ${hy - R * 0.55} 0 ${hy - R * 0.6} Q${-R * 0.7} ${hy - R * 0.55} ${-R - 1} ${hy + 2} Z" fill="${paint(o.hijab || '#ecebe4')}"/>`;
    } else if (hair === 'peci') {
      head += `<rect x="${-R * 0.75}" y="${hy - R - 10}" width="${R * 1.5}" height="18" rx="3" fill="${paint(o.capColor || '#1b1b1b')}"/>`;
    } else if (hair === 'police') {
      head += `<path d="M${-R - 6} ${hy - 14} L${R + 10} ${hy - 14} L${R + 4} ${hy - 22} L${-R} ${hy - 22} Z" fill="${paint('#1a1a1a')}"/><path d="M${-R + 2} ${hy - 22} L${-R - 4} ${hy - R - 14} L${R + 4} ${hy - R - 14} L${R - 2} ${hy - 22} Z" fill="${paint(o.capColor || '#3a4a6a')}"/><circle cx="0" cy="${hy - R - 2}" r="5" fill="${paint('#e2c25a')}"/>`;
    } else if (hair === 'hood' || hair === 'balaclava') {
      head += `<path d="M${-R - 2} ${hy + R * 0.6} Q${-R - 6} ${hy - R - 8} 0 ${hy - R - 8} Q${R + 6} ${hy - R - 8} ${R + 2} ${hy + R * 0.6} L${R - 6} ${hy + R * 0.2} L${R - 8} ${hy - 6} L${-R + 8} ${hy - 6} L${-R + 6} ${hy + R * 0.2} Z" fill="${paint(o.hoodColor || '#1c1c22')}"/>`;
    } else if (hair === 'hat') {
      head += `<ellipse cx="0" cy="${hy - R * 0.55}" rx="${R * 1.7}" ry="${R * 0.28}" fill="${paint(o.hatColor || '#c9b48a')}"/><path d="M${-R * 0.8} ${hy - R * 0.55} Q${-R * 0.8} ${hy - R * 1.4} 0 ${hy - R * 1.4} Q${R * 0.8} ${hy - R * 1.4} ${R * 0.8} ${hy - R * 0.55} Z" fill="${paint(o.hatColor || '#c9b48a')}"/>`;
    }

    // Gesicht (nicht bei Rückenansicht / Silhouette)
    if (!o.back && !o.mono) {
      const lk = (o.look || 0) * 6, lky = (o.lookY || 0) * 4;
      const ex = 11.5, ey = hy + 4 + lky;
      const expr = o.expr || 'neutral';
      const big = expr === 'scared' || expr === 'shock';
      if (o.glasses || big) {
        const er = big ? (expr === 'shock' ? 10 : 8.5) : 8;
        [-1, 1].forEach((sd) => {
          head += `<circle cx="${n(sd * ex + lk * 0.4)}" cy="${n(ey)}" r="${er}" fill="#fbfbf6" stroke="${ink}" stroke-width="2.2"/>`;
          head += `<circle cx="${n(sd * ex + lk * 0.75)}" cy="${n(ey + lky * 0.3)}" r="${big ? 2.6 : 3}" fill="${ink}"/>`;
        });
        if (o.glasses) head += `<line x1="${n(-ex + 8 + lk * 0.4)}" y1="${n(ey)}" x2="${n(ex - 8 + lk * 0.4)}" y2="${n(ey)}" stroke="${ink}" stroke-width="2"/>`;
      } else if (expr === 'sleep') {
        [-1, 1].forEach((sd) => { head += `<path d="M${n(sd * ex - 5)} ${n(ey)} Q${n(sd * ex)} ${n(ey + 4)} ${n(sd * ex + 5)} ${n(ey)}" stroke="${ink}" stroke-width="2.2" fill="none"/>`; });
      } else {
        [-1, 1].forEach((sd) => { head += `<circle cx="${n(sd * ex + lk)}" cy="${n(ey)}" r="3.6" fill="${ink}"/>`; });
      }
      // Brauen
      // Brauen: [innen, außen] – negativ = höher. besorgt/ängstlich: innen hoch; wütend: innen tief
      const brow = { worried: [-4, 1], scared: [-6, 0], sad: [-4, 2], angry: [3, -4], determined: [2, -2] }[expr];
      const by = ey - (big ? 15 : 12);
      if (brow) [-1, 1].forEach((sd) => { head += `<line x1="${n(sd * (ex - 6))}" y1="${n(by + brow[0])}" x2="${n(sd * (ex + 6))}" y2="${n(by + brow[1])}" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`; });
      // Mund
      const my = hy + R * 0.58, mx = lk * 0.5;
      if (expr === 'scared') head += `<ellipse cx="${n(mx)}" cy="${n(my)}" rx="4" ry="5" fill="${ink}"/>`;
      else if (expr === 'shock') head += `<ellipse cx="${n(mx)}" cy="${n(my + 1)}" rx="6" ry="8" fill="${ink}"/>`;
      else if (expr === 'smile') head += `<path d="M${n(mx - 8)} ${n(my - 2)} Q${n(mx)} ${n(my + 6)} ${n(mx + 8)} ${n(my - 2)}" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      else if (expr === 'sad' || expr === 'angry') head += `<path d="M${n(mx - 7)} ${n(my + 3)} Q${n(mx)} ${n(my - 4)} ${n(mx + 7)} ${n(my + 3)}" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      else if (expr !== 'sleep') head += `<line x1="${n(mx - 5)}" y1="${n(my)}" x2="${n(mx + 5)}" y2="${n(my)}" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`;
      // Schweißtropfen
      if (o.sweat || expr === 'scared' || expr === 'shock') head += `<path d="M${R - 4} ${hy - 16} Q${R + 4} ${hy - 4} ${R - 1} ${hy} Q${R - 8} ${hy - 3} ${R - 4} ${hy - 16} Z" fill="${paint('#9ec8e8')}"/>`;
      if (o.beard) head += `<path d="M${-R + 6} ${hy + 8} Q0 ${hy + R + 14} ${R - 6} ${hy + 8} Q0 ${hy + R * 0.7} ${-R + 6} ${hy + 8} Z" fill="${paint(o.beardColor || '#d8d8d8')}"/>`;
      if (o.wrinkles) head += `<path d="M${-ex - 8} ${hy - 20} q6 -3 12 0 M${ex - 4} ${hy - 20} q6 -3 12 0" stroke="${ink}" stroke-width="1.2" fill="none" opacity="0.5"/>`;
    }
    body += head;

    const bodyT = `translate(0 ${n(-bob)})${lean ? ` rotate(${lean} 0 ${K.legTop})` : ''}`;
    g += `<g transform="${bodyT}">${body}</g>`;
    if (o.perf && o.mono) g += `<g opacity="0.55">${''}</g>`;
    let out = `<g transform="translate(${n(o.x || 0)} ${n(o.y || 0)}) scale(${n(s * facing * 1000) / 1000} ${n(s * 1000) / 1000})"${o.opacity != null ? ` opacity="${n(o.opacity)}"` : ''}>${g}</g>`;
    // Lichtkegel der Taschenlampe (in Weltkoordinaten)
    if (o.flashlight && !o.mono) {
      const fa = o.flashlight.angle != null ? o.flashlight.angle : 10;
      const hx = (o.x || 0) + hr[0] * s * facing + 12 * s * facing, hy2 = (o.y || 0) + (hr[1] - bob) * s;
      const ang = facing > 0 ? fa : 180 - fa;
      out += HE.fx.beam({ x: hx, y: hy2, angle: ang, len: (o.flashlight.len || 380) * s, spread: o.flashlight.spread || 16, intensity: o.flashlight.intensity || 0.5, src: 7 * s });
    }
    return out;
  };

  // Gruppen-Helfer: mehrere Figuren nebeneinander
  HE.crowd = function (list) { return list.map((p) => HE.person(p)).join(''); };
})();
