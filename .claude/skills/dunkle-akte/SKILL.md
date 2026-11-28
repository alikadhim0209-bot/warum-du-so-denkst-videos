---
name: dunkle-akte
description: Baut Horror-Videos im Stil des YouTube-Kanals Dunkle_Akte („FULL STORY“-Gruselgeschichten in Du-Perspektive, Low-Poly-3D in Ich-Perspektive, 1–3-Wort-Untertitel mit rotem Schlüsselwort) – von der Geschichte über Sprecher, 3D-Szenen, Hände, Untertitel und Sounddesign bis zum fertigen 9:16-Video. Verwenden, wenn der Nutzer ein Dunkle-Akte-Video, eine Full Story, Shorts-Teile, eine Gruselgeschichte im Kanalstil oder eine kurze Stil-Demo möchte.
argument-hint: "[Idee/Thema] [6min | shorts | demo]"
---

# /dunkle-akte – Videos im Dunkle_Akte-Stil

Der Nutzer betreibt den Kanal **Dunkle_Akte** (youtube.com/@Dunkle_Akte0) und will neue Geschichten exakt in diesem Stil. Antworte auf Deutsch, kurz und ohne Fachchinesisch. Der Nutzer arbeitet oft vom Handy: Ergebnisse immer als Datei schicken (SendUserFile, `display: render`).

## 0. Zuerst lesen (Pflicht)
1. `dunkle-akte-stil/STIL.md`: verbindliche Stil-Bibel (Format, Erzählweise, Untertitel, Overlays, Bild, Ton, Titel/Thumbnail, Abnahme-Checkliste).
2. Referenz-Produktion `dunkle-akte-stil/src/demo-aufzug/`:
   - `story.json`
   - `plan.py`
   - `scene.js`
   - `sfx.py`
   - Ergebnis: `dunkle-akte-stil/demo-aufzug-10s.mp4`
3. Bausteine in `dunkle-akte-stil/src/`, alle wiederverwenden:

| Datei | Zweck |
|---|---|
| `index.html` + `render-page.js` | Overlays: „FULL STORY“-Badge, Untertitel mit rotem Wort und Pop, Vignette, Schwarzblende |
| `render.js` | Rendert jedes Bild als PNG (Headless-Chromium + Three.js). Testbilder über `TIMES=…`, Bereiche über Start/End-Frame |
| `hand.js` | menschliche POV-Hände: `makeHand` (posierbar), `makeThumb` (Daumen-Bogen um Kanten), `placeHand`, Nägel |
| `tts.py` | Edge-TTS-Sprecher mit Wort-Timings, erzeugt `timeline.json` mit Untertitel-Chunks |
| `align.py` | Wort-Timings per Whisper für eine fertige Sprachaufnahme (z.B. ElevenLabs), gleiches `timeline.json`-Format |

## 1. Auftrag klären (nur was fehlt, eine kurze Frage)
- **Idee:** aus den Argumenten des Aufrufs. Fehlt sie, schlage 3 Hooks nach dem Muster „Alltag + Widerspruch“ vor und lass wählen. Keine Wiederholung bestehender Kanal-Themen; die Liste liefert `yt-dlp --flat-playlist` auf `@Dunkle_Akte0/videos` und `/shorts`.
- **Format:**

| Format | Umfang | Overlays |
|---|---|---|
| Standard: FULL STORY | **6:00 Min. ≈ 820 Wörter** | „FULL STORY“, Ende „THE END“ |
| `shorts` | Teile à ≤ 60 s | „FULL STORY“ + roter „TEIL n“-Kasten, Ende „TEIL n+1 FOLGT / FOLG MIR, SONST VERPASST DU ES“ |
| `demo` | 10 s | wie FULL STORY |

- **Stimme:**
  - Ist der **ElevenLabs-Connector** verbunden: deutsche, ruhig-düstere Stimme über `creative_list_voices` wählen und nennen.
  - Erzeugen mit `creative_generate_speech`. Das kostet Credits: bei langen Texten vorher kurz bestätigen lassen und nie doppelt starten.
  - Danach mit `align.py` die Wort-Timings erzeugen.
  - Ohne ElevenLabs: Edge-TTS `de-DE-ChristophNeural`, `rate +5%`, `pitch -5Hz` als Platzhalter, und das dem Nutzer sagen.

## 2. Geschichte schreiben (Regeln, siehe STIL.md §2)
- **Du-Perspektive, Präsens, kurze Sätze** (3–8 Wörter). Kein Intro, kein Outro. Satz 1 ist der Hook.
- **In den ersten 10 s:** unheimliche Alltagssituation + Widerspruch.
- **Bausteine:**
  - Handy als Wendepunkt (Nachricht, Foto, Anruf)
  - eine Regel oder ein Test
  - Doppelgänger- oder Vertrauensfrage
- **Eskalation alle 30–45 s:**
  1. neue Bedrohung
  2. Versteck
  3. Verrat
  4. Flucht
  5. Hilfe von außen
  6. Setpiece
  7. scheinbarer Sieg
  8. offenes Ende
  9. „THE END“
- **Dialog** in „…“ mit eigener Stimme pro Figur. **Alles Deutsch**: Handy-Texte, Schilder, Notruf **112**, nichts Englisches.
- **Wesen:** Mensch mit falschen Proportionen (extrem langer Hals, dunkle Augen, viel zu lang aufgerissener Mund). Eigenes Design, nicht die Figuren aus fremden Videos kopieren.
- **Zuerst nur den Text vorlegen:**
  - als `story.json` mit Zeilen, Untertitel-Chunks und `*rotem Wort*`
  - kurze Zusammenfassung an den Nutzer
  - erst nach OK rendern, denn das Rendern kostet Zeit

## 3. Produktion
Arbeitsordner pro Video: `dunkle-akte-stil/src/<name>/` mit `story.json`, `plan.py`, `scene.js`, `sfx.py` (Vorlage: `demo-aufzug`). Frames und Ton in einen Build-Ordner im Scratchpad, nicht ins Repo.

```bash
cd dunkle-akte-stil/src && npm install                       # three.js + Schriften (Anton, Space Mono, Inter)
pip install edge-tts scipy soundfile faster-whisper          # falls fehlend
B=<scratchpad>/build-<name>
SSL_CERT_FILE=/root/.ccr/ca-bundle.crt python3 tts.py <name>/story.json $B   # Sprecher + timeline.json
#   oder mit fertiger Aufnahme:  python3 align.py <name>/story.json sprecher.mp3 $B
python3 <name>/plan.py $B/timeline.json $B/plan.json         # Schnitte/Effekte aus den Wort-Zeiten
TIMES=0.5,4.2,9.1 node render.js <name> $B                   # TESTBILDER an jeder neuen Einstellung prüfen
node render.js <name> $B 0 3600 & node render.js <name> $B 3600 7200 & node render.js <name> $B 7200 10800 & wait
python3 <name>/sfx.py $B/plan.json $B/voice.wav $B/mix.wav   # Musik, Geräusche, Ducking, Mix
ffmpeg -framerate 30 -i $B/frames/f_%04d.png -i $B/mix.wav -c:v libx264 -preset slow -crf 17 \
       -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart <ziel>.mp4
```

- Rendern geht mit etwa 0,35 s pro Bild. 6 Minuten sind 10.800 Bilder, also in 3 Prozessen parallel rendern (siehe oben).
- `scene.js` für lange Videos als Liste von Einstellungen aufbauen (jede mit eigener Kamera, Licht und Figuren). Zeitpunkte kommen nur aus `plan.json`. Bild und Ton bleiben so synchron.
- Sound in `sfx.py` synthetisch, keine fremden Samples:
  - dunkles Musikbett mit Ducking unter der Stimme
  - Herzschlag, Vibration, Türen, Licht-Brummen
  - vor dem Schock Stille, beim Schock Schlag + Streicher-Cluster + Schrei, danach Nachhall
- **Netz:**
  - YouTube blockt Video-Downloads aus der Cloud (Bot-Schutz). Metadaten, Untertitel und Storyboards gehen. Für Referenzvideos den Nutzer um einen Datei-Link bitten (Drive/Dropbox).
  - Edge-TTS braucht `SSL_CERT_FILE=/root/.ccr/ca-bundle.crt`, `tts.py` setzt die CA selbst.

## 4. Bildregeln aus dem Nutzer-Feedback (verbindlich)
- **Hände = echte menschliche Hände**, nie klobig oder wie Roblox:
  - schlank (`slim ≈ 0.86`), Finger mit 3 Gliedern, Daumenballen
  - Ärmel (Hoodie/Jacke) bis zum Handgelenk, keine nackten Unterarme
  - immer `hand.js` benutzen
- **Handy halten:**
  - Pro Hand liegt **nur der Daumen** auf dem Bildschirm.
  - Der Rest der Hand bleibt **hinter dem Handy** (Finger unsichtbar, nichts schaut seitlich heraus).
  - Unter dem Handy nur ein **weicher Übergang** der Handballen zum Ärmel.
  - **Nichts darf durch das Handy ragen:** Den Daumen mit `makeThumb` außen um die Kante führen. Vorlage: Handy-Block in `demo-aufzug/scene.js`.
- **Fingernägel:** klein, **ganz vorne** an der Kuppe (freier Rand kurz vor der Spitze), als gebogene Platte auf der Wölbung (`nailGeometry`, `NAIL_FRONT = 0.62`). Keine aufgesetzten Ovale.
- **Licht:**
  - Hängelampen leuchten **nach unten** (SpotLight + schwaches Streulicht), die Decke bleibt dunkel.
  - Aus Kamerasicht darf nichts wie ein **Rahmen/Viereck um eine Lampe** wirken, z.B. Schilder dahinter. Schilder seitlich aufhängen.
- **Wesen:**
  - **mittelnah** zeigen: ganzer Oberkörper, langer Hals, Gesicht lesbar
  - Extreme Nahaufnahmen wirken schnell comichaft („Eierkopf“), also lassen.
  - Schock-Ablauf:
    1. Stromausfall
    2. Licht an, Wesen steht plötzlich nah
    3. Kopf knickt weg, Mund reißt auf
    4. harter Zoom
    5. Schwarz
  - Gesicht von unten beleuchten.
- **Untertitel:**
  - 1–3 Wörter, Anton, weiß mit schwarzer Kontur, max. ein rotes Schlüsselwort
  - Dialog in „…“
  - auf ~79 % Bildhöhe
- **Badge:** „FULL STORY“ immer oben links.

## 5. Abnahme vor dem Abschicken
1. Testbilder jeder Einstellung als Kontaktbogen ansehen (montage). Prüfen: Hände, Nägel, Durchdringungen, Licht/Rahmen, Untertitel-Lesbarkeit, Badge.
2. Fertiges Video: Bild alle 0,5 s als Kontaktbogen. Ton per faster-whisper transkribieren (Array übergeben, nicht Dateipfad), der Text muss stimmen.
3. Länge und Format prüfen: `ffprobe` zeigt 1080×1920, 30 fps, AAC.

## 6. Abgabe
- Video nach `dunkle-akte-stil/<name>.mp4` (oder eigener Ordner).
- Neue Erkenntnisse und Feedback des Nutzers sofort in `STIL.md` und diesen Skill eintragen.
- Committen und auf den Arbeits-Branch pushen.
- Video mit `SendUserFile` schicken. Kurz sagen, was drin ist und was Platzhalter ist (z.B. Stimme).
