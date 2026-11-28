---
name: horror
description: Erstellt einen kompletten Folklore-Horror-Short (9:16, ca. 175 s, Deutsch oder Englisch) exakt im vermessenen Stil der drei Referenzvideos (Pocong / Hachishakusama / Teke Teke) – Skript nach 8-Beat-Formel, Erzählstimme „Vincent Crowe“ über ElevenLabs, flache 2D-Animation mit Papierpuppen-Figuren und detaillierten Monstern, Monster-Akte-Titelkarte mit Gefahrenleiste, „Die Legende“-Segment, Karaoke-Untertitel, Moll-Drone und Effekte. Verwenden bei /horror sowie bei „Horrorgeschichte / Gruselgeschichte / Horror-Short im Stil machen“.
---

# /horror – Folklore-Horror-Short im Referenz-Stil

**Eingabe:** `/horror <Idee, Legende oder eigene Geschichte> [en] [kurz]`  → `$ARGUMENTS`
- ohne Sprachangabe: **Deutsch** (Stimme Vincent Crowe). `en` → Englisch (Stimme Atlas).
- `kurz` → nur ein ~10-s-Teaser (Hook + Monster + Titelkarte), wie `horror-mittagsfrau-10s/`.
- Stil ist fest, **Thema frei**: Nur der Stil der Referenzen wird kopiert, nie deren Monster/Geschichten.

Alles Messbare steht in `reference/stil-bibel.md` (Längen, Satzbau, Layout-Pixel, Farben, Schriften, Ton-Pegel).
Die Engine-Referenz steht in `reference/engine-api.md`, ein Bildkatalog aller Bausteine in `reference/katalog.jpg`.
Komplettes Beispiel (32 Einstellungen, geprüft): `beispiel/mittagsfrau/` (script.txt, story.js, audio.json).

Pfade: `SKILL=.claude/skills/horror` (im Repo `warum-du-so-denkst-videos`), Werkzeug `python3 $SKILL/tools/horror.py`.

---------------------------------------------------------------------------------------------------

## Ablauf (immer in dieser Reihenfolge)

### 0 · Einrichten (einmal pro Sitzung, ~1 min)
```bash
python3 $SKILL/tools/horror.py setup          # Whisper-venv (~/.horror-venv) für Wort-Zeitstempel
node -e "require('playwright')"               # Chromium/Playwright ist vorinstalliert
```
ElevenLabs-Connector muss verbunden sein (Werkzeuge `mcp__ElevenLabs__creative_*`).

### 1 · Legende & Monster festlegen
- Thema des Nutzers nehmen. Bei realer Folklore kurz recherchieren (WebSearch): echte Ortsnamen, Begriffe, **Regeln**,
  wie man überlebt. Eigene Geschichten: trotzdem eine Regel + Schutzritual erfinden.
- Projektordner im Repo: `horror-<slug>/` (Kleinbuchstaben, Bindestriche).
- Festlegen: Monstername, Region/Land (Untertitel der Titelkarte), Gefahrenstufe 1–20, zwei Info-Zeilen,
  Palette (dunkle Hintergrundfarbe + Akzentfarbe → zugleich Untertitel-Farbe), Legenden-Kunststil
  (`shadow` Südostasien · `woodblock`/`ink` Japan/China · `papercut`/`chronicle` Deutschland/Europa).
- Monster-Design aus Archetyp + eigenen Merkmalen (siehe „Monster“ unten). Monster sind das Wichtigste:
  Gesicht und Körper detailliert und unheimlich, Figuren drumherum bleiben simple Papierpuppen.

### 2 · Skript schreiben → `horror-<slug>/script.txt`
Exakt nach `stil-bibel.md` §2: **8 Beats** (Hook-Regel → Name/Titelkarte → Ich-Erzähler-Setup → Legende mit Regeln →
Regelbruch → Begegnung → Überleben durch die Regel → Twist mit Schockwort am Ende).
- DE 370–400 Wörter (EN 400–415), 40–50 Sätze, Ø 8–10 Wörter, 20–30 % Kurzsätze (≤ 4 Wörter), Lautmalerei als Dreier.
- Marker: `[#id]` = neue Einstellung (alle 1–2 Sätze, 30–45 Stück; die Titelkarte bekommt **`[#title]`** vor dem
  Namens-Satz). `{sfx:name}` Effekt auf dem nächsten Wort (bell, knock, thumps, tap, scrape, drag, whoosh, sting,
  heartbeat, steps, creak, crow, train, phone, thunder, whisper, glass). `{@name}` Zeitmarke für Animationen.
  `{drop}` Stille-Loch vor Schockzeilen. `{amb:name}` Atmo-Wechsel. Zeilen mit `#` = Kommentar.
- Danach: `python3 $SKILL/tools/horror.py prep horror-<slug>` → prüft Wortzahl, Dauer-Schätzung, Credits.
  Werte außerhalb der Formel → Skript anpassen, bevor Credits ausgegeben werden.

### 3 · Szenen bauen → `story.js` (+ `audio.json`) und **ohne Stimme prüfen**
- `beispiel/mittagsfrau/story.js` kopieren und anpassen: je Marker ein Shot `{ id, draw(c), cam?, legend?, trans?, shakes? }`,
  Titelkarte `{ id: 'title', type: 'title' }`. API: `reference/engine-api.md`.
- Bildsprache (Stil-Bibel §3): Totale → Halbnah → Nahaufnahme Monster bei Schreckmomenten; langsamer Push-in;
  Legenden-Segment für Beat 4; Inserts (Notizzettel, Kalender, Handy, Karte, Zeitung); Ende: Monster nähert sich → Abblende.
- `audio.json`: `{ "key": "A", "ambience": "night" }` (Atmo: night | field | wind | snow | rain | indoor | forest | city).
- Bildkontrolle **vor** der Stimme:
  ```bash
  python3 $SKILL/tools/horror.py dry    horror-<slug>     # geschätzte timing.json
  python3 $SKILL/tools/horror.py stills horror-<slug>     # 1 Standbild je Einstellung → stills/
  ```
  Standbilder ansehen (Read; mehrere mit ffmpeg `tile` zu einem Bild zusammenfassen) und Fehler beheben:
  abgeschnittene Figuren, leere Ränder bei Kamerafahrten, unlesbare Untertitel, Monster nicht gruselig genug.

### 4 · Stimme (ElevenLabs) → `voice.mp3`
- Text = Inhalt von `horror-<slug>/tts.txt` (aus `prep`). Kosten ≈ Zeichen × 2 Takes (voller Short ≈ 4.400–5.000 Credits;
  Creator-Plan 131.000/Monat). Vorher `estimate_only: true`; **nie** wiederholt aufrufen.
- `mcp__ElevenLabs__creative_create_flow` → `creative_generate_speech` mit `model_id: eleven_v4`,
  `voice_id`: **DE `18X2yBovneA0q06wd8E9` (Vincent Crowe – Dark & Haunting Tales)**, EN `3YzGaTGef0x5PLEK9yGq` (Atlas).
  Alternative DE: `PrI7Ao5YWhQJ6bOfhWu1` (Toni) – nur wenn der Nutzer sie ausdrücklich will.
  Danach `creative_get_flow_run_status` pollen bis `all_completed`.
- Take wählen: den tieferen/ruhigeren (bei Unsicherheit Take 1) – `content_url` mit `curl -o horror-<slug>/voice.mp3` laden.
  Dem Nutzer sagen, welcher Take genommen wurde.

### 5 · Zeiten, Bild, Ton, Fertig
```bash
python3 $SKILL/tools/horror.py align  horror-<slug>   # Whisper-Wortzeiten, Pausen wie im Original (0,78 s / 0,42 s)
python3 $SKILL/tools/horror.py stills horror-<slug>   # Kontrolle mit echten Zeiten (Titelkarte!)
python3 $SKILL/tools/horror.py render horror-<slug>   # ~40 Bilder/s → 3 min Video ≈ 2–3 min Renderzeit
python3 $SKILL/tools/horror.py audio  horror-<slug>   # Drone + Atmo + Effekte + Stimme → −16 LUFS
python3 $SKILL/tools/horror.py final  horror-<slug>   # statisches Papierkorn + Vignette → video.mp4 + cover.png
```
- `align` warnt, wenn das Video > 178 s würde (kürzt erst Pausen, sonst Skript kürzen + neue Stimme).
- Endkontrolle: ein paar Frames aus `video.mp4` ansehen; Lautheit ≈ −16 LUFS.

### 6 · Abliefern
- `SendUserFile` mit `video.mp4` (+ `cover.png`), kurz sagen: Monster, Länge, verwendeter Take, Credits.
- Ins Repo: `script.txt story.js audio.json timing.json voice.mp3 video.mp4 cover.png` (die `.gitignore` im Projekt
  hält Zwischendateien raus). Committen und auf den Arbeits-Branch pushen.

---------------------------------------------------------------------------------------------------

## Monster (das Wichtigste – nie lieblos)
`HE.mon` liefert die Bausteine im Referenz-Stil (siehe engine-api.md):
- **Büste/Nahaufnahme** `HE.mon.bust(c, {...})` – für Titelkarten-Porträt und Schreck-Nahaufnahmen (Gesicht formatfüllend,
  Lichthof dahinter, Glitzer-Staub). **Ganzkörper** `HE.mon.figure(c, {...})` (stehend, `pose:'bend'`, `pose:'crawl'`,
  `hold:'sickle'`, `hat:'sun'`). Weitere Archetypen: `shroud`/`shroudBust` (Leichentuch), `shadow`, `thin` (Geweih).
- Gesicht: `skin` ('ghost' | 'pale' | 'corpse' | 'sickly' | 'ash' | eigene 5 Farben), `eyes` ('wide' | 'hollow' | 'closed' |
  'glow' | 'slit'), `iris`, `bloodshot`, `bags`, `wrinkles`, `mouth` ('lips' | 'lipsOpen' | 'grin' | 'smile' | 'teeth' |
  'scream' | 'stitched'), `hair` ({ style: 'hime' | 'part' | 'wild' | 'none', color, len }), `outfit`.
- Monster-Optionen einmal als Objekt definieren (`const MF = {...}`) und überall verwenden → wirkt in jeder Einstellung gleich.
- Neue Monster-Formen: in `story.js` mit SVG + den Bausteinen (`HE.mon.face`, `eye`, `hand`, `arm`, `hairBack/Front`,
  `torso`, `sickle`) zusammensetzen; wiederverwendbare Teile in `engine/lib/monsters.js` ergänzen.

## Feste Stil-Regeln (nicht ändern)
- 1080×1920, 30 fps, 172–178 s, erstes Wort bei 0,5 s, Abblende am Ende.
- Hauptfigur immer `HE.kid()` (Senfmütze mit Bommel, roter Schal, blaue Jacke).
- Titelkarte erscheint mit dem Satz, der den Namen nennt; Badge „★ REMASTERED EDITION ★“ (änderbar über `title.badge`).
- Untertitel: Source Sans 3 Bold, max. 3 Wörter, aktuelles Wort in Akzentfarbe – passiert automatisch.
- Schriften: Source Sans 3 (Bold/Black) + Source Code Pro Bold – liegen in `engine/fonts/`.
- Übergänge „Dip“ durch Schwarz (Standard), `trans:'cut'` für Schreck-Schnitte.
