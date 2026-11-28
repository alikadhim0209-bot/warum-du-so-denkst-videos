"""Erzeugt die Sprecherspur + Wort-Timings + Untertitel-Chunks (Dunkle_Akte-Stil).

Aufruf:  python3 tts.py story.json build/
Ergebnis: build/voice.wav (48 kHz mono) und build/timeline.json

story.json-Format (Beispiel siehe demo-aufzug/story.json):
{
  "voice": "de-DE-ChristophNeural", "rate": "+5%", "pitch": "-5Hz",
  "lead_in": 0.2,
  "lines": [
    {"text": "Dein Haus hat zwölf Stockwerke.",
     "chunks": ["DEIN HAUS HAT", "*ZWÖLF* STOCKWERKE."],
     "gap_after": 0.25}
  ]
}
In den Chunks markiert *WORT* das rote Schlüsselwort (max. eins pro Chunk).
Dialog-/Nachrichtenzeilen bekommen "quote": true -> Untertitel in „…“.
"""
import asyncio
import json
import os
import sys

import certifi

# Der Agent-Proxy terminiert TLS neu -> eigene CA verwenden.
if os.path.exists("/root/.ccr/ca-bundle.crt"):
    certifi.where = lambda: "/root/.ccr/ca-bundle.crt"

import edge_tts  # noqa: E402
import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402
import subprocess  # noqa: E402

SR = 48000


async def synth(text, voice, rate, pitch, mp3_path):
    com = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    words = []
    with open(mp3_path, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append({"t": ch["offset"] / 1e7, "d": ch["duration"] / 1e7, "w": ch["text"]})
    return words


def load_wav(mp3_path):
    wav_path = mp3_path.replace(".mp3", ".wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp3_path, "-ar", str(SR), "-ac", "1", wav_path], check=True)
    a, _ = sf.read(wav_path, dtype="float32")
    return a


def trim(a, thr=0.012):
    """Stille vorne/hinten abschneiden, gibt (audio, offset_sekunden) zurueck."""
    env = np.convolve(np.abs(a), np.ones(240) / 240, mode="same")
    idx = np.where(env > thr)[0]
    if len(idx) == 0:
        return a, 0.0
    s = max(0, idx[0] - int(0.03 * SR))
    e = min(len(a), idx[-1] + int(0.08 * SR))
    return a[s:e], s / SR


def chunk_words(chunk):
    return [w for w in chunk.replace("„", "").replace("“", "").split() if w.strip("*.,!?:;")]


def main():
    story_path, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)
    st = json.load(open(story_path, encoding="utf-8"))
    voice, rate, pitch = st.get("voice", "de-DE-ChristophNeural"), st.get("rate", "+0%"), st.get("pitch", "+0Hz")

    t = st.get("lead_in", 0.2)
    pieces, lines_out, captions = [], [], []
    for i, ln in enumerate(st["lines"]):
        mp3 = os.path.join(out_dir, f"line{i:02d}.mp3")
        words = asyncio.run(synth(ln["text"], ln.get("voice", voice), ln.get("rate", rate), ln.get("pitch", pitch), mp3))
        a, off = trim(load_wav(mp3))
        start = ln.get("at", t)
        dur = len(a) / SR
        pieces.append((start, a))
        abs_words = [{"w": w["w"], "t": round(start + w["t"] - off, 3), "d": round(w["d"], 3)} for w in words]
        lines_out.append({"i": i, "text": ln["text"], "start": round(start, 3), "end": round(start + dur, 3), "words": abs_words, "tag": ln.get("tag", "")})

        # Untertitel-Chunks auf Woerter abbilden
        wi = 0
        for c in ln["chunks"]:
            n = len(chunk_words(c))
            cw = abs_words[wi:wi + n] if wi < len(abs_words) else abs_words[-1:]
            captions.append({"text": c, "start": cw[0]["t"] - 0.03, "line": i, "quote": bool(ln.get("quote"))})
            wi += n
        t = start + dur + ln.get("gap_after", 0.3)

    # Ende jedes Chunks = Beginn des naechsten (innerhalb einer Zeile), sonst Zeilenende + 0.25 s
    for k, c in enumerate(captions):
        ln = lines_out[c["line"]]
        nxt = captions[k + 1] if k + 1 < len(captions) else None
        if nxt and nxt["line"] == c["line"]:
            c["end"] = nxt["start"]
        else:
            c["end"] = min(ln["end"] + 0.25, nxt["start"] if nxt else ln["end"] + 0.25)
        c["start"], c["end"] = round(c["start"], 3), round(c["end"], 3)

    total = max(s + len(a) / SR for s, a in pieces) + 0.5
    mix = np.zeros(int(total * SR) + SR, dtype=np.float32)
    for s, a in pieces:
        i0 = int(s * SR)
        mix[i0:i0 + len(a)] += a
    peak = np.max(np.abs(mix)) or 1.0
    mix = mix / peak * 0.89
    sf.write(os.path.join(out_dir, "voice.wav"), mix, SR)
    json.dump({"lines": lines_out, "captions": captions, "voice_end": round(t, 3)},
              open(os.path.join(out_dir, "timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for ln in lines_out:
        print(f"{ln['start']:6.2f}-{ln['end']:6.2f}  {ln['text']}")
    for c in captions:
        print(f"   {c['start']:6.2f}-{c['end']:6.2f}  {c['text']}")


if __name__ == "__main__":
    main()
