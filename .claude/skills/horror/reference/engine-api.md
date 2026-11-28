# Engine-Referenz (HE) – so schreibt man `story.js`

Die Engine zeichnet jedes Bild als SVG (720 × 1280 Koordinaten, Ausgabe 1080 × 1920) in Chromium.
Alles ist deterministisch: gleiche Zeit → gleiches Bild. Vollständiges Beispiel: `beispiel/mittagsfrau/story.js`.
Optionale Zusatz-Skripte eines Projekts (z. B. eigenes Monster) in `horror-<slug>/lib/*.js` werden vor `story.js` geladen.

## 1. Grundgerüst

```js
const MONSTER = { skin: 'ghost', eyes: 'wide', mouth: 'lipsOpen', hair: { style: 'hime' }, outfit: 'uniform' };

HE.story({
  lang: 'de',                                   // 'de' | 'en'  (UI-Texte: GEFAHRENSTUFE / DIE LEGENDE …)
  palette: { bg: '#121d32', accent: '#fa7e82', title: '#d0d2d7' },  // Titelkarte + Untertitel-Akzent
  endFade: 1.1,                                 // Abblende am Ende (s)
  title: {                                      // Titelkarte („Monster-Akte“)
    name: 'Teke Teke', sub: 'Hokkaido · Japan', threat: 20,          // 1–20 → Stufenwort automatisch
    lines: ['Zeile 1 (Großbuchstaben)', 'Zeile 2'], badge: 'REMASTERED EDITION',   // badge:false = aus
    portrait: (c) => '…SVG im Bereich 0..500 × 0..500…',
  },
  shots: [
    { id: 'hook', draw: (c) => '…', cam: {...} },   // id = Marker [#hook] im Skript
    { id: 'title', type: 'title' },
    …
  ],
});
```

### Shot-Felder
| Feld | Bedeutung |
|---|---|
| `id` | Marker-Name aus `script.txt` (`[#id]`). Start = Zeit des ersten Wortes nach dem Marker − 0,3 s |
| `at` | optional: anderer Marker/Beat oder feste Sekunde als Startpunkt |
| `draw(c)` | gibt SVG zurück. Mit `c.L(tiefe, svg)` in Parallax-Ebenen aufteilen, sonst wirkt die Kamera auf alles |
| `cam` | Kamera: `{x,y,z,r}` fest · `{from:{…}, to:{…}, ease}` über die Shot-Dauer · `(c) => ({x,y,z,r})`. x,y = Bildmitte in Szenen-Koordinaten, z = Zoom. Standard: langsamer Push-in 1,00 → 1,06 |
| `breath` | Handkamera-Atmen (Std 1, 0 = aus) |
| `trans` | Übergang am Shot-Anfang: Standard „Dip“ durch Schwarz · `'cut'` · `'slow'` (0,9 s) · `'flash'` (weiß) |
| `shakes` | `[{ at: 'beat' \| Sekunden, atFrac: 0..1, amp: px, dur: s }]` – Wackler |
| `legend` | `'shadow' \| 'woodblock' \| 'ink' \| 'papercut' \| 'chronicle'` oder `{ type, title, seal, vtext, tag }` |
| `type: 'title'` | Titelkarte |

### Kontext `c` in `draw(c)`
| | |
|---|---|
| `c.t`, `c.d`, `c.p` | Sekunden seit Shot-Start, Shot-Dauer, Fortschritt 0..1 |
| `c.T` | globale Videozeit (für Wind, Flackern, Laufzyklen) |
| `c.beat('name')` | Zeit eines `{@name}`-Beats / Markers relativ zum Shot-Start (oder `null`) |
| `c.after('name' \| sek, dauer=0.6, ease='out')` | 0..1-Rampe ab Beat/Sekunde – für „passiert genau auf diesem Wort“ |
| `c.win(a, b, ease)` | 0..1 zwischen zwei Shot-Sekunden |
| `c.L(tiefe, svg)` | Parallax-Ebene: 0 = Himmel (steht), 0.3–0.6 Hintergrund, 1 = Hauptebene, >1 Vordergrund |
| `c.S(svg)` | Bildschirm-Ebene (nicht von Kamera bewegt): Vignette, Blitz, Tönung |
| `c.shake(px)` / `c.shakeAt(beat, px, s)` | Wackler (im `shakes`-Feld zuverlässiger, da vor der Kamera berechnet) |
| `c.rng(seed)` | deterministischer Zufall |

### Werkzeuge
`HE.lerp, HE.clamp, HE.inv, HE.E(ease, t)` (ease: linear, in, out, inOut, sine, out3, in3, outBack, outExpo),
`HE.noise(x, seed)`, `HE.flicker(T, seed, depth)`, `HE.mix(c1, c2, t)`, `HE.shade(c, ±amt)`, `HE.tone(c, mood)`,
`HE.lg(stops, x1,y1,x2,y2)` / `HE.rg(stops, cx,cy,r)` → Verlaufs-`url(#…)` (stops: `[[0,'#fff',deckkraft?],…]`),
`HE.blurF(std)`, `HE.grainPattern(op, size, seed, color)`, `HE.text(txt, x, y, {size, font, fill, anchor, weight, ls, opacity})`
(Schriften: `HE.FONT.bold` / `.black` / `.mono`), `HE.silhouette(svg, farbe)` (alles einfarbig), `HE.walk(c, [x0,y0], [x1,y1], t0, t1)` → `{x, y, phase, moving}`.

## 2. Figuren – `HE.kid(o)` (Hauptfigur) und `HE.person(o)`
Fußpunkt `x, y`, `s` Skalierung (Kind ≈ 234 px hoch), `facing` 1/−1, `kind` 'kid' | 'teen' | 'adult' | 'elder',
`pose` stand | walk | run | sit | cower | point | reach | armsUp | hold | pray | grab (+ `phase` aus `HE.walk`),
`expr` neutral | worried | scared | shock | sad | smile | angry | sleep | determined, `look` −1..1, `lookY`, `back` (Rückenansicht),
`hair` beanie | short | long | bun | gray | bald | hijab | peci | police | hood | balaclava | hat, `hairColor`, `hijab`,
`skin`, `top`, `topStyle` coat | robe | dress | kimono | uniform, `bottom`, `skirt`, `scarf`, `number`, `pattern:'dots'`,
`glasses`, `beard`, `wrinkles`, `sweat`, `holding` (SVG vor der Brust), `flashlight: {angle, len}`, `mood`, `dim`, `mono`, `opacity`.
Silhouette fürs Schattenspiel: `HE.legend.puppet(o)`.

## 3. Monster – `HE.mon`
| Funktion | Zweck / wichtigste Optionen |
|---|---|
| `bust(c, o)` | Büste/Nahaufnahme: `cx, cy` (Gesichtsmitte), `size` (Gesichtsbreite px), `outfit` uniform/dress/kimono/rags/robe/false, `hair {style, color, len, strands}`, `hat:'sun'`, `hands:'raised'`, `glow` (Lichthof-Farbe/false), `sparkles`, + Gesichtsoptionen |
| `figure(c, o)` | ganze Figur: `x, y` Fuß, `h` Höhe px, `pose` stand/bend/reach/crawl, `hold:'sickle'`, `hat:'sun'`, `headSize` (Std 62), `headTilt`, `outfit`, `dressColor`, `opacity` |
| `crawler(c, o)` | kriechender Oberkörper (auch `figure` mit `pose:'crawl'`), `hold:'scythe'` |
| `shroud(c, o)` / `shroudBust(c, o)` | Leichentuch-Wesen (`hop:true` hüpft), `face:{…}` |
| `shadow(c, o)` | schwarze Gestalt mit Leuchtaugen (`grin`, `eyeColor`) |
| `thin(c, o)` | dürre Kreatur (`antlers:true`) |
| `face(c, o)` | Gesicht allein: `cx, cy, size`, `skin`, `eyes`, `eyeSize` (14), `iris`, `look [x,y]`, `lid`, `blink:true`, `bloodshot`, `bags`, `wrinkles`, `spots`, `mouth`, `open`, `lipColor`, `brows` |
| `eye(o)`, `mouth(o)`, `hand(o)`, `arm(o)`, `hairBack(o)`, `hairFront(c,o)`, `torso(o)`, `sunHat(o)`, `sickle(o)`, `sparkles(c,o)` | Einzelteile für eigene Monster |
Hautpaletten: `HE.mon.SKINS` (ghost, pale, corpse, sickly, ash) oder eigenes Array `[Licht, Mitte, Schatten, Tiefe, Linien]`.

## 4. Kulissen – `HE.sc` (alle mit `mood`: day | dusk | night | dark | snow | dawn)
Himmel & Land: `sky(c,{preset: day|dusk|night|snow|dawn|storm|teal|jpday, top, bottom, stars, moon, clouds})`, `clouds(c,o)`,
`mountains({y,h,color,rim,rimDash,seed})`, `hills({y,h,color,cnt})`, `volcano(c,{x,y,w,h})`, `fields({y,h,rows})`,
`ground(c,{y,color,color2,tufts,specks,edge})`, `tufts(o)`, `path({vx,vy,wTop,wBot,stones})`, `wheat(c,{y,far,scale,color,color2,ear})`.
Pflanzen: `palm(c,o)`, `pine({snow})`, `bareTree(o)`, `frangipani(o)`, `roundTree(o)`, `hedge(o)`, `bush(o)`, `sunflower(c,o)`.
Bauten: `house({x,y,w,h,style: gable|tile|jp|cabin|snow, wall, roof, lit, windows, door, doorOpen, chimney, snow})`, `church({x,y,s})`,
`window({x,y,w,h,lit,glass,inside,shutters,frame})`, `wall({x0,x1,y,h,posts})`, `gate({x,y,w,h,dark})`, `pole({x,y,h,nextX})`,
`lamp(c,{x,y,h,on,flicker})`, `rails({y})`, `crossing(c,{x,y,on})`, `train({x,y,cars,lit})`, `van({x,y,w,facing,lights})`,
`tomb({x,y,style: round|cross|post|block})`, `grave({x,y,w})`, `umbrella(o)`, `statue({x,y,s})`, `crows(c,{y,h,cnt,size})`.
Innen: `room({floorY,wall,wainscot,wainscotH,floor})`, `shoji({x,y,w,h,lit})`, `door({x,y,w,h,open})`, `clock({x,y,r,time})`,
`calendar(o)`, `picture(o)`, `bulb(c,{x,y,len,color,flicker,r})`, `bed({x,y,w,blanket})`, `futon(o)`, `table(o)`, `lantern(c,o)`.

## 5. Licht & Atmosphäre – `HE.fx`
`stars(c,o)`, `moon({x,y,r})`, `sun({x,y,r})`, `glow(x,y,r,color,intensity)`, `beam({x,y,angle,len,spread})` (Taschenlampe),
`fog(c,{y,h,color,opacity})`, `rain(c,o)`, `snow(c,o)`, `fireflies(c,o)`, `dust(c,o)`, `bokeh(c,o)`, `smoke(c,{x,y})`,
`lightning(c, beat)` (in `c.S`), `tint(color, op)`, `vignette(strength, color)` (in `c.S`).

## 6. Legende – `HE.legend` / Inserts – `HE.ins`
`HE.legend.marker(n, x, y, {opacity})` ①②③, `HE.legend.sil(svg, typ)` (Silhouette im Segment-Stil), `HE.legend.puppet(personOpts)`.
Bildbereich: woodblock x 75–645 / y 216–990; sonst Motive zwischen y 230 und 960.
Inserts (formatfüllend): `HE.ins.notebook(c,{lines:[{text,color}], start, cps, stamp:{text,at}})`,
`HE.ins.calendar(c,{month, crossed, crossFrom, circle, circleAt})`, `HE.ins.phone(c,{name, sub})`,
`HE.ins.map(c,{points:[{x,y,icon: statue|house|x,label}], lines:[[x1,y1,x2,y2]], river})`, `HE.ins.news(c,{headline, paper})`.

## 7. Häufige Fehler
- Ebene zu kurz → bei Kamerafahrt schwarzer/leerer Rand: Böden/Felder nicht mit kleinem `h` aufrufen (Standard reicht).
- Figur außerhalb des Bildes nach `cam`-Zoom: Standbild prüfen.
- Wackler im `draw` wirkt erst im nächsten Frame → `shakes`-Feld benutzen.
- Text mit `&` / `<` immer über `HE.text` (escaped automatisch).
