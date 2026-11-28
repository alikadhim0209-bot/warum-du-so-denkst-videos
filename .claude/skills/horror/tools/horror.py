#!/usr/bin/env python3
"""
horror.py – Werkzeugkette für Folklore-Horror-Shorts (Stil siehe reference/stil-bibel.md)

  python3 horror.py setup                      einmalig pro Sitzung: Whisper-venv anlegen
  python3 horror.py prep    <projekt>          script.txt → tts.txt (+ Zeichen/Credits-Schätzung)
  python3 horror.py dry     <projekt>          geschätzte timing.json ohne Stimme (Bildkontrolle vor TTS)
  python3 horror.py align   <projekt> [--lang de] [--tail 2.6]   voice.mp3 → timing.json (Wortzeiten)
  python3 horror.py render  <projekt> [--workers 4]              Bild (stumm) → video_silent.mp4
  python3 horror.py stills  <projekt> [t1,t2,…]                  Standbilder zum Prüfen
  python3 horror.py audio   <projekt>          Musikbett + Atmo + Effekte + Stimme → mix.wav (−16 LUFS)
  python3 horror.py final   <projekt>          Bild + Ton + Korn + Vignette → video.mp4 + cover.png
  python3 horror.py all     <projekt>          align → render → audio → final

Projektordner enthält: script.txt, story.js, voice.mp3 (ElevenLabs), optional audio.json
"""
import json, math, os, re, subprocess, sys, unicodedata, wave
from difflib import SequenceMatcher

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(HERE)
ENGINE = os.path.join(SKILL, 'engine')
VENV = os.environ.get('HORROR_VENV', os.path.expanduser('~/.horror-venv'))
SR = 44100


def die(msg):
    print('FEHLER:', msg, file=sys.stderr)
    sys.exit(1)


def run(cmd, **kw):
    r = subprocess.run(cmd, **kw)
    if r.returncode != 0:
        die('Befehl fehlgeschlagen: ' + ' '.join(map(str, cmd)))
    return r


# =============================================================================== Skript
MARK = re.compile(r'\[#([\w-]+)\]|\{(sfx|@|drop|amb)[:]?([\w.-]*)\}')


def parse_script(path):
    """script.txt → Liste von Wort-Tokens mit angehängten Markern."""
    raw = open(path, encoding='utf-8').read()
    lines = [l for l in raw.splitlines() if l.strip() and not l.lstrip().startswith('#')]
    tokens, pending = [], {'markers': [], 'sfx': [], 'beats': [], 'drops': [], 'amb': []}
    tts_lines = []
    for line in lines:
        clean = ''
        pos = 0
        for m in MARK.finditer(line):
            clean += line[pos:m.start()]
            pos = m.end()
        clean += line[pos:]
        tts_lines.append(re.sub(r'\s+', ' ', clean).strip())
        # Tokens mit Markern
        parts = re.split(r'(\[#[\w-]+\]|\{(?:sfx|@|drop|amb)[:]?[\w.-]*\})', line)
        for part in parts:
            if not part:
                continue
            m = re.fullmatch(r'\[#([\w-]+)\]', part)
            if m:
                pending['markers'].append(m.group(1)); continue
            m = re.fullmatch(r'\{(sfx|@|drop|amb)[:]?([\w.-]*)\}', part)
            if m:
                kind, val = m.group(1), m.group(2)
                key = {'sfx': 'sfx', '@': 'beats', 'drop': 'drops', 'amb': 'amb'}[kind]
                pending[key].append(val or '1')
                continue
            for w in part.split():
                tok = {'w': w}
                for k in pending:
                    if pending[k]:
                        tok[k] = pending[k]
                tokens.append(tok)
                pending = {'markers': [], 'sfx': [], 'beats': [], 'drops': [], 'amb': []}
    tts = '\n'.join(tts_lines)
    return tokens, tts


def norm(w):
    w = unicodedata.normalize('NFKD', w.lower())
    w = ''.join(ch for ch in w if not unicodedata.combining(ch))
    return re.sub(r'[^a-z0-9]', '', w.replace('ß', 'ss'))


def cmd_prep(project):
    tokens, tts = parse_script(os.path.join(project, 'script.txt'))
    open(os.path.join(project, 'tts.txt'), 'w', encoding='utf-8').write(tts + '\n')
    words = len(tokens)
    chars = len(tts)
    print(tts)
    print(f'\n→ {words} Wörter, {chars} Zeichen · geschätzte Dauer {words / 2.38:.0f}–{words / 2.2:.0f} s · '
          f'ElevenLabs ≈ {chars} Credits je Take (Standard 2 Takes ≈ {2 * chars})')
    shots = [m for t in tokens for m in t.get('markers', [])]
    print('Shots:', ', '.join(shots))


# =============================================================================== Whisper / Timing
def load_audio_np(path, sr=16000):
    import numpy as np
    b = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-'], capture_output=True).stdout
    return np.frombuffer(b, np.int16).astype(np.float32) / 32768.0


def cmd_setup():
    py = os.path.join(VENV, 'bin', 'python')
    if not os.path.exists(py):
        run([sys.executable, '-m', 'venv', VENV])
    run([py, '-m', 'pip', 'install', '-q', 'faster-whisper'])
    print('Whisper-Umgebung bereit:', VENV)


def whisper_words(audio_path, lang, model='small'):
    """Gibt [(wort, start, ende)] zurück – läuft notfalls in der venv."""
    try:
        import faster_whisper  # noqa
    except ImportError:
        py = os.path.join(VENV, 'bin', 'python')
        if not os.path.exists(py):
            die('faster-whisper fehlt – zuerst:  python3 horror.py setup')
        out = subprocess.run([py, '-I', os.path.abspath(__file__), '_whisper', audio_path, lang, model], capture_output=True, text=True)
        if out.returncode != 0:
            die('Whisper fehlgeschlagen:\n' + out.stderr[-2000:])
        return json.loads(out.stdout.strip().splitlines()[-1])
    from faster_whisper import WhisperModel
    m = WhisperModel(model, device='cpu', compute_type='int8', cpu_threads=os.cpu_count() or 4)
    segs, _ = m.transcribe(load_audio_np(audio_path), language=lang, word_timestamps=True, beam_size=5, vad_filter=False)
    res = []
    for s in segs:
        for w in s.words:
            res.append((w.word.strip(), float(w.start), float(w.end)))
    return res


def chunk_words(words, lang):
    """Caption-Chunks wie in der Referenz: erst Phrasen (Satzende / Sprechpause > 0,35 s), dann jede Phrase
    gleichmäßig in Chunks à max. 3 Wörter (und max. ≈20 Zeichen) teilen – größere Chunks zuerst (7 → 3+2+2)."""
    maxc = 20 if lang == 'de' else 22
    phrases, cur = [], []
    for i, w in enumerate(words):
        if cur:
            prev = words[cur[-1]]
            if w['s'] - prev['e'] > 0.35 or re.search(r'[.!?…:]["»«“”]?$', prev['w']):
                phrases.append(cur); cur = []
        cur.append(i)
    if cur:
        phrases.append(cur)
    chunks = []
    for ph in phrases:
        n = len(ph)
        k = max(1, -(-n // 3))
        while True:
            sizes = [n // k + (1 if j < n % k else 0) for j in range(k)]
            parts, pos = [], 0
            for sz in sizes:
                parts.append(ph[pos:pos + sz]); pos += sz
            too_long = any(len(' '.join(words[j]['w'] for j in p)) > maxc and len(p) > 1 for p in parts)
            if not too_long or k >= n:
                break
            k += 1
        chunks += [{'words': p} for p in parts]
    return chunks


def pace_voice(voice, tokens, times, out_path, sent_gap=0.78, comma_gap=0.42):
    """Verlängert zu kurze Pausen (Satzende / Komma) durch eingefügte Stille. Gibt neue Wortzeiten zurück."""
    import numpy as np
    sys.path.insert(0, HERE)
    import sfx as S
    v = S.load(voice)
    cuts = []  # (Schnittzeit in Original-Sekunden, einzufügende Stille)
    for i in range(len(tokens) - 1):
        w = tokens[i]['w']
        target = sent_gap if re.search(r'[.!?…]["»«“”]?$', w) else comma_gap if re.search(r'[,;:–-]$', w) else None
        if target is None:
            continue
        gap = times[i + 1][0] - times[i][1]
        if gap < target - 0.05:
            cuts.append(((times[i][1] + times[i + 1][0]) / 2, target - max(gap, 0)))
    parts, last, added = [], 0, 0.0
    new_times = [list(t) for t in times]
    for t_cut, extra in cuts:
        i = int(t_cut * S.SR)
        parts.append(v[last:i]); parts.append(np.zeros((int(extra * S.SR), 2)))
        last = i
        for k in range(len(new_times)):
            if times[k][0] >= t_cut:
                new_times[k][0] += extra; new_times[k][1] += extra
        added += extra
    parts.append(v[last:])
    S.save(out_path, np.vstack(parts))
    return new_times, added

def cmd_align(project, lang='de', tail=2.6, lead=0.5, model='small', pace=True, max_dur=178.0, sent_gap=0.78, comma_gap=0.42, _asr=None):
    tokens, _ = parse_script(os.path.join(project, 'script.txt'))
    voice = os.path.join(project, 'voice.mp3')
    if not os.path.exists(voice):
        die('voice.mp3 fehlt im Projektordner')
    asr = _asr or whisper_words(voice, lang, model)
    if not asr:
        die('Whisper hat keine Wörter erkannt')
    A = [norm(w) for w, _, _ in asr]
    S = [norm(t['w']) for t in tokens]
    sm = SequenceMatcher(a=S, b=A, autojunk=False)
    times = [None] * len(tokens)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            _, s, e = asr[blk.b + k]
            times[blk.a + k] = [s, e]
    # Lücken interpolieren (ungleiche Wörter, Zahlen …)
    for blk in sm.get_opcodes():
        tag, i1, i2, j1, j2 = blk
        if tag in ('replace', 'delete') and i2 > i1:
            if j2 > j1:
                t0, t1 = asr[j1][1], asr[j2 - 1][2]
            else:
                t0 = times[i1 - 1][1] if i1 > 0 and times[i1 - 1] else 0
                t1 = next((times[k][0] for k in range(i2, len(tokens)) if times[k]), t0 + 0.4 * (i2 - i1))
            L = sum(len(tokens[k]['w']) for k in range(i1, i2)) or 1
            acc = t0
            for k in range(i1, i2):
                d = (t1 - t0) * len(tokens[k]['w']) / L
                times[k] = [acc, acc + d * 0.92]
                acc += d
    for k in range(len(tokens)):
        if times[k] is None:
            times[k] = [times[k - 1][1] if k else 0, (times[k - 1][1] if k else 0) + 0.3]
    # --- Pausen wie im Original: nach Satzende ≈0,78 s, nach Komma ≈0,42 s (zu kurze Pausen werden verlängert)
    if pace:
        times, paced = pace_voice(voice, tokens, times, os.path.join(project, 'voice_paced.wav'), sent_gap, comma_gap)
        print(f'Pausen angepasst: +{paced:.2f} s → voice_paced.wav')
    off = lead - times[0][0]
    words = [{'w': t['w'], 's': round(tm[0] + off, 3), 'e': round(tm[1] + off, 3)} for t, tm in zip(tokens, times)]
    markers, beats, sfx, drops, amb = {}, {}, [], [], []
    for t, w in zip(tokens, words):
        for m in t.get('markers', []):
            markers[m] = w['s']
        for b in t.get('beats', []):
            beats[b] = w['s']
        for x in t.get('sfx', []):
            sfx.append({'name': x, 't': w['s']})
        for d in t.get('drops', []):
            drops.append({'t': w['s'], 'len': float(d) if d not in ('1', '') else 0.9})
        for a in t.get('amb', []):
            amb.append({'name': a, 't': w['s']})
    dur = round(words[-1]['e'] + tail, 2)
    if dur > max_dur and pace and sent_gap > 0.5:
        print(f'Achtung: {dur:.1f} s > {max_dur:.0f} s – Pausen werden gekürzt …')
        return cmd_align(project, lang, tail, lead, model, pace, max_dur, sent_gap=0.5, comma_gap=0.3, _asr=asr)
    if dur > max_dur:
        print(f'WARNUNG: Video wäre {dur:.1f} s lang (> {max_dur:.0f} s, Shorts-Limit 180 s). Skript kürzen und Stimme neu erzeugen!')
    # Stimmlänge prüfen
    vsrc = os.path.join(project, 'voice_paced.wav') if pace else voice
    vlen = len(load_audio_np(vsrc)) / 16000.0
    dur = round(max(dur, vlen + off + 0.3), 2)
    timing = {'duration': dur, 'voiceOffset': round(off, 3), 'lang': lang, 'words': words,
              'chunks': chunk_words(words, lang), 'markers': markers, 'beats': beats, 'sfx': sfx, 'drops': drops, 'amb': amb}
    json.dump(timing, open(os.path.join(project, 'timing.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    miss = sum(1 for blk in sm.get_opcodes() if blk[0] != 'equal')
    print(f'timing.json: {len(words)} Wörter, Dauer {dur:.2f} s, Stimme ab {lead:.2f} s, {len(markers)} Shots, {len(sfx)} Effekte '
          f'(Abweichungen Skript↔Erkennung: {miss} Blöcke)')
    for k, v in markers.items():
        print(f'  [#{k}] {v:6.2f} s')



def cmd_dry(project, lang='de', tail=2.6, lead=0.5):
    """Geschätzte timing.json OHNE Stimme (2,35 Wörter/s, Satzpause 0,8 s, Kommapause 0,42 s) –
    zum Prüfen aller Einstellungen per Standbild, BEVOR ElevenLabs-Credits ausgegeben werden."""
    tokens, _ = parse_script(os.path.join(project, 'script.txt'))
    t = lead
    words = []
    for tok in tokens:
        d = 0.08 + 0.05 * len(re.sub(r'[^\w]', '', tok['w']))   # kalibriert an Toni (≈0,33 s je Wort)
        words.append({'w': tok['w'], 's': round(t, 3), 'e': round(t + d, 3)})
        t += d + (0.78 if re.search(r'[.!?…]$', tok['w']) else 0.42 if re.search(r'[,;:]$', tok['w']) else 0.03)
    markers, beats, sfx, drops, amb = {}, {}, [], [], []
    for tok, w in zip(tokens, words):
        for m in tok.get('markers', []): markers[m] = w['s']
        for b in tok.get('beats', []): beats[b] = w['s']
        for x in tok.get('sfx', []): sfx.append({'name': x, 't': w['s']})
        for d in tok.get('drops', []): drops.append({'t': w['s'], 'len': 0.9})
        for a in tok.get('amb', []): amb.append({'name': a, 't': w['s']})
    dur = round(words[-1]['e'] + tail, 2)
    timing = {'duration': dur, 'voiceOffset': 0, 'lang': lang, 'estimated': True, 'words': words, 'chunks': chunk_words(words, lang),
              'markers': markers, 'beats': beats, 'sfx': sfx, 'drops': drops, 'amb': amb}
    json.dump(timing, open(os.path.join(project, 'timing.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'geschätzte timing.json: {len(words)} Wörter, ≈{dur:.0f} s, {len(markers)} Shots (nur zur Bildkontrolle – nach der Stimme: align)')

# =============================================================================== Rendern
def cmd_render(project, workers=4, extra=None):
    cmd = ['node', os.path.join(ENGINE, 'render.js'), project, '--workers', str(workers)] + (extra or [])
    run(cmd)


def cmd_stills(project, times=None):
    cmd = ['node', os.path.join(ENGINE, 'render.js'), project] + (['--stills', times] if times else ['--stills-shots'])
    run(cmd)


# =============================================================================== Ton
def cmd_audio(project):
    sys.path.insert(0, HERE)
    import sfx as S
    import numpy as np
    timing = json.load(open(os.path.join(project, 'timing.json'), encoding='utf-8'))
    cfg = {}
    if os.path.exists(os.path.join(project, 'audio.json')):
        cfg = json.load(open(os.path.join(project, 'audio.json'), encoding='utf-8'))
    dur = timing['duration']
    N = int(dur * SR)
    # --- Stimme
    vp = os.path.join(project, 'voice_paced.wav')
    v = S.load(vp if os.path.exists(vp) else os.path.join(project, 'voice.mp3'))
    voice = np.zeros((N, 2))
    o = int(timing['voiceOffset'] * SR)
    if o < 0:
        v = v[-o:]; o = 0
    L = min(len(v), N - o)
    voice[o:o + L] = v[:L]
    voice = S.voice_chain(voice)
    voice = S.to_rms(voice, -19.5)
    # Sprach-Hüllkurve (für Ducking)
    words = timing['words']
    talk = np.zeros(N)
    for w in words:
        a, b = int(max(0, w['s'] - 0.05) * SR), int(min(dur, w['e'] + 0.12) * SR)
        talk[a:b] = 1
    talk = S.smooth(talk, 0.25)
    # --- Musikbett (Moll-Drone) + Atmo
    key = cfg.get('key', 'A')
    bed = S.drone(dur, key=key, seed=cfg.get('seed', 7), intensity=cfg.get('intensity', 1.0))
    bed = S.to_rms(bed, -19.5 - cfg.get('bed_db_below_voice', 9.0))
    amb_name = cfg.get('ambience', 'night')
    amb = S.ambience(amb_name, dur) if amb_name else np.zeros((N, 2))
    if amb_name:
        amb = S.to_rms(amb, -19.5 - cfg.get('amb_db_below_voice', 17.0))
    # Ambience-Wechsel per {amb:name}
    for a in timing.get('amb', []):
        t0 = int(a['t'] * SR)
        new = S.to_rms(S.ambience(a['name'], dur), -19.5 - cfg.get('amb_db_below_voice', 17.0))
        fade = np.clip((np.arange(N) - t0) / (1.0 * SR), 0, 1)[:, None]
        amb = amb * (1 - fade) + new * fade
    # Ducking + Stille-Löcher
    duck = 1 - 0.28 * talk
    gate = np.ones(N)
    for d in timing.get('drops', []):
        a, b = int((d['t'] - 0.25) * SR), int((d['t'] + d['len']) * SR)
        gate[max(0, a):min(N, b)] = 0.04
    gate = S.smooth(gate, 0.08)
    music = (bed + amb) * (duck * gate)[:, None]
    # --- Effekte
    fxbus = np.zeros((N, 2))
    # Effekte sitzen wie im Original ungefähr auf Stimmhöhe: aktive Lautheit = Stimme − 4 dB (+ eigener Gain)
    def place(sig, t, gain_db=0.0):
        i = int(t * SR)
        if i >= N: return
        sig = S.to_rms(sig, -19.5 - 4.0 + gain_db)
        j = min(N, i + len(sig))
        fxbus[i:j] += sig[:j - i]
    if cfg.get('open_hit', True):
        place(S.make('hit'), max(0, timing['words'][0]['s'] - 0.02), 0.0)
    if 'title' in timing['markers'] and cfg.get('title_sting', True):
        t = timing['markers']['title'] - 0.25
        r = S.make('riser')
        place(r, max(0, t - len(r) / SR + 0.15), -5.0)
        place(S.make('hit'), t, -1.0)
    for e in timing.get('sfx', []):
        name = e['name']
        gain = cfg.get('sfx_gain', {}).get(name, 0.0)
        place(S.make(name), e['t'] + cfg.get('sfx_offset', {}).get(name, 0.0), gain)
    # Ende: Drone schwillt kurz an, dann Ausblenden
    fade_out = np.clip((dur - np.arange(N) / SR) / 1.2, 0, 1)
    mix = voice + music + fxbus
    mix *= fade_out[:, None]
    out = os.path.join(project, 'mix_raw.wav')
    S.save(out, mix)
    # --- Lautheit: zweistufig auf −16 LUFS / −1,5 dBTP
    final = os.path.join(project, 'mix.wav')
    S.loudnorm(out, final, I=-16.0, TP=-1.5)
    os.remove(out)
    print('mix.wav fertig (−16 LUFS)')


# =============================================================================== Final
def cmd_final(project):
    vid = os.path.join(project, 'video_silent.mp4')
    mix = os.path.join(project, 'mix.wav')
    if not os.path.exists(vid): die('video_silent.mp4 fehlt (zuerst render)')
    if not os.path.exists(mix): die('mix.wav fehlt (zuerst audio)')
    out = os.path.join(project, 'video.mp4')
    # statisches Papier-Korn wie im Original (Referenz: räumlich std≈7–10, zeitlich ≈0,2 → Muster bewegt sich NICHT)
    vf = 'vignette=angle=PI/4.6:mode=forward,noise=c0s=11:c0f=u,format=yuv420p'
    run(['ffmpeg', '-v', 'error', '-y', '-i', vid, '-i', mix, '-map', '0:v', '-map', '1:a', '-vf', vf,
         '-c:v', 'libx264', '-preset', 'medium', '-crf', '24', '-profile:v', 'high', '-r', '30',
         '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-shortest', '-movflags', '+faststart', out])
    # Cover: Titelkarte (vollständig aufgebaut), sonst Frame bei 3 s
    timing = json.load(open(os.path.join(project, 'timing.json'), encoding='utf-8'))
    t = timing['markers'].get('title')
    if t is not None:
        t = min(timing['duration'] - 0.9, t - 0.3 + 2.9)   # Titelkarte vollständig aufgebaut, vor der Abblende
    else:
        t = 3.0
    run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.2f}', '-i', out, '-frames:v', '1', os.path.join(project, 'cover.png')])
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out], capture_output=True, text=True).stdout.strip())
    print(f'fertig: {out}  ({dur:.1f} s) + cover.png')


# =============================================================================== CLI
def main():
    a = sys.argv[1:]
    if not a:
        print(__doc__); return
    cmd = a[0]
    if cmd == '_whisper':
        res = whisper_words(a[1], a[2], a[3])
        print(json.dumps(res)); return
    if cmd == 'setup':
        cmd_setup(); return
    if len(a) < 2:
        die('Projektordner fehlt')
    project = os.path.abspath(a[1])
    opt = lambda k, d=None: a[a.index('--' + k) + 1] if '--' + k in a else d
    lang = opt('lang')
    if not lang and os.path.exists(os.path.join(project, 'story.js')):
        m = re.search(r"lang:\s*'(\w+)'", open(os.path.join(project, 'story.js'), encoding='utf-8').read())
        lang = m.group(1) if m else 'de'
    lang = lang or 'de'
    if cmd == 'prep': cmd_prep(project)
    elif cmd == 'dry': cmd_dry(project, lang=lang)
    elif cmd == 'align': cmd_align(project, lang=lang, tail=float(opt('tail', 2.6)), model=opt('model', 'small'), pace='--no-pace' not in a)
    elif cmd == 'render': cmd_render(project, workers=int(opt('workers', 4)))
    elif cmd == 'stills': cmd_stills(project, a[2] if len(a) > 2 and not a[2].startswith('--') else None)
    elif cmd == 'audio': cmd_audio(project)
    elif cmd == 'final': cmd_final(project)
    elif cmd == 'all':
        cmd_align(project, lang=lang, tail=float(opt('tail', 2.6)))
        cmd_render(project, workers=int(opt('workers', 4)))
        cmd_audio(project)
        cmd_final(project)
    else:
        die('unbekannter Befehl: ' + cmd)


if __name__ == '__main__':
    main()
