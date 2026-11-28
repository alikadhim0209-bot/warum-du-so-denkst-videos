"""Wort-Timings fuer eine FERTIGE Sprecherspur (z.B. ElevenLabs oder eigene Aufnahme) per Whisper.

Erzeugt build/voice.wav (48 kHz mono) und build/timeline.json im gleichen Format wie tts.py,
damit plan.py, render.js und sfx.py unveraendert weiterlaufen.

Aufruf: python3 align.py <story>/story.json sprecher.mp3 build/
  - story.json: Text + Untertitel-Chunks wie bei tts.py (die Reihenfolge der Zeilen = Reihenfolge im Audio)
  - sprecher.mp3/.wav: komplette Sprecherspur (alle Zeilen hintereinander)
"""
import difflib
import json
import os
import re
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

SR = 48000


def norm(w):
    return re.sub(r"[^a-z0-9äöüß]", "", w.lower())


def chunk_words(chunk):
    return [w for w in chunk.replace("„", "").replace("“", "").split() if w.strip("*.,!?:;")]


def main():
    story_path, audio_path, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]
    os.makedirs(out_dir, exist_ok=True)
    st = json.load(open(story_path, encoding="utf-8"))
    wav = os.path.join(out_dir, "voice.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", audio_path, "-ar", str(SR), "-ac", "1", wav], check=True)
    a, _ = sf.read(wav, dtype="float32")

    from faster_whisper import WhisperModel  # erst hier importieren (Modell-Download ~0,5 GB beim ersten Mal)
    model = WhisperModel(os.environ.get("WHISPER_MODEL", "small"), device="cpu", compute_type="int8")
    a16 = resample_poly(a, 1, 3).astype(np.float32)  # Array statt Datei (umgeht PyAV-Probleme)
    segs, _ = model.transcribe(a16, language="de", word_timestamps=True)
    heard = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]

    # Woerter der Geschichte in Sprech-Reihenfolge
    story_words = []  # (zeile, wort)
    for i, ln in enumerate(st["lines"]):
        for w in ln["text"].split():
            story_words.append((i, w))
    A = [norm(w) for _, w in story_words]
    Bn = [norm(w) for w, _, _ in heard]
    times = [None] * len(A)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(a=A, b=Bn, autojunk=False).get_opcodes():
        if tag in ("equal", "replace"):
            for k in range(i2 - i1):
                j = j1 + min(k, j2 - j1 - 1)
                if 0 <= j < len(heard):
                    times[i1 + k] = (heard[j][1], heard[j][2])
    # Luecken (z.B. Zahlen "13" vs. "dreizehnten") linear auffuellen
    known = [k for k, t in enumerate(times) if t]
    if not known:
        sys.exit("Keine Woerter erkannt – passt das Audio zur story.json?")
    for k in range(len(times)):
        if times[k] is None:
            prev = max([p for p in known if p < k], default=None)
            nxt = min([q for q in known if q > k], default=None)
            if prev is not None and nxt is not None:
                f = (k - prev) / (nxt - prev)
                t0 = times[prev][1] + f * (times[nxt][0] - times[prev][1])
            elif prev is not None:
                t0 = times[prev][1] + 0.05 * (k - prev)
            else:
                t0 = max(0.0, times[nxt][0] - 0.3 * (nxt - k))
            times[k] = (t0, t0 + 0.25)

    lines_out, captions, idx = [], [], 0
    for i, ln in enumerate(st["lines"]):
        n = len(ln["text"].split())
        ws = [{"w": story_words[idx + k][1], "t": round(times[idx + k][0], 3), "d": round(times[idx + k][1] - times[idx + k][0], 3)} for k in range(n)]
        idx += n
        lines_out.append({"i": i, "text": ln["text"], "start": ws[0]["t"], "end": round(ws[-1]["t"] + ws[-1]["d"], 3), "words": ws, "tag": ln.get("tag", "")})
        wi = 0
        for c in ln["chunks"]:
            m = len(chunk_words(c))
            cw = ws[wi:wi + m] if wi < len(ws) else ws[-1:]
            captions.append({"text": c, "start": round(cw[0]["t"] - 0.03, 3), "line": i, "quote": bool(ln.get("quote"))})
            wi += m
    for k, c in enumerate(captions):
        ln = lines_out[c["line"]]
        nxt = captions[k + 1] if k + 1 < len(captions) else None
        c["end"] = nxt["start"] if (nxt and nxt["line"] == c["line"]) else round(min(ln["end"] + 0.25, nxt["start"] if nxt else ln["end"] + 0.25), 3)
    json.dump({"lines": lines_out, "captions": captions, "voice_end": lines_out[-1]["end"]},
              open(os.path.join(out_dir, "timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for ln in lines_out:
        print(f"{ln['start']:7.2f}-{ln['end']:7.2f}  {ln['text']}")


if __name__ == "__main__":
    main()
