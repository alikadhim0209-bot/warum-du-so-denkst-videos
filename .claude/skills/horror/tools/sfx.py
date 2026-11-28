"""
sfx.py – prozedurales Sounddesign (nur numpy + ffmpeg), abgestimmt auf die Referenz-Messung:
  · Musikbett: dunkle Moll-Drone, 60–85 % der Energie unter 120 Hz, langsame Akkordwechsel, Raumhall
  · Atmo: night | field | wind | snow | rain | indoor | forest | city | none
  · Effekte (make(name)): hit, riser, sting, bell, bell1, knock, knock1, thump, thumps, tap, tap1, whoosh,
    scrape, drag, heartbeat, steps, creak, door, crow, train, phone, thunder, whisper, clock, glass
"""
import json, os, re, subprocess, wave
import numpy as np

SR = 44100
rng = np.random.default_rng(1234)


# ------------------------------------------------------------------ I/O & Helfer
def load(path):
    b = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '2', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    x = np.frombuffer(b, np.int16).astype(np.float32) / 32768.0
    return x.reshape(-1, 2).astype(np.float64)


def save(path, x):
    x = np.clip(x, -1, 1)
    y = (x * 32767 + rng.uniform(-0.5, 0.5, x.shape)).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())


def stereo(m, pan=0.0):
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return np.stack([m * l * 1.414, m * r * 1.414], 1)


def active_rms(x, block=0.4):
    m = x.mean(1) if x.ndim == 2 else x
    n = int(block * SR)
    k = len(m) // n
    if k == 0:
        return np.sqrt(np.mean(m ** 2) + 1e-12)
    e = np.sqrt(np.mean(m[:k * n].reshape(k, n) ** 2, 1) + 1e-12)
    thr = e.max() / 31.6  # −30 dB
    return np.sqrt(np.mean(e[e > thr] ** 2))


def to_rms(x, dbfs):
    r = active_rms(x)
    return x * (10 ** (dbfs / 20) / max(r, 1e-9))


def smooth(env, sec):
    n = max(1, int(sec * SR))
    k = np.ones(n) / n
    return np.convolve(env, k, mode='same')


def tvec(dur, sr=SR):
    return np.arange(int(dur * sr)) / sr


def _fftfilt(x, mask_fn):
    n = len(x)
    N = 1 << (n - 1).bit_length()
    X = np.fft.rfft(x, N)
    f = np.fft.rfftfreq(N, 1 / SR)
    return np.fft.irfft(X * mask_fn(f), N)[:n]


def lp(x, fc, w=0.3):
    return _fftfilt(x, lambda f: 1 / (1 + (f / fc) ** (2 / w * 0.6)))


def hp(x, fc, w=0.3):
    return _fftfilt(x, lambda f: 1 - 1 / (1 + (f / max(fc, 1)) ** (2 / w * 0.6)))


def bp(x, f1, f2):
    return hp(lp(x, f2), f1)


def noise(dur, color='white'):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    if color == 'pink':
        x = _fftfilt(x, lambda f: 1 / np.sqrt(np.maximum(f, 20) / 20))
    elif color == 'brown':
        x = _fftfilt(x, lambda f: 1 / (np.maximum(f, 10) / 10))
    return x / (np.std(x) + 1e-9)


def impulse_response(sec=2.5, bright=0.5, seed=0):
    r = np.random.default_rng(seed)
    t = tvec(sec)
    out = []
    for ch in range(2):
        n = r.standard_normal(len(t)) * np.exp(-t / (sec / 6.5))
        n = lp(n, 1500 + 7000 * bright) * 0.7 + n * 0.3 * bright
        n[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        out.append(n)
    ir = np.stack(out, 1)
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def reverb(x, sec=2.5, mix=0.3, bright=0.5, seed=0):
    if x.ndim == 1:
        x = stereo(x)
    ir = impulse_response(sec, bright, seed)
    n = len(x) + len(ir)
    N = 1 << (n - 1).bit_length()
    wet = np.stack([np.fft.irfft(np.fft.rfft(x[:, c], N) * np.fft.rfft(ir[:, c], N), N)[:len(x) + len(ir) - 1] for c in range(2)], 1)
    dry = np.vstack([x, np.zeros((len(ir) - 1, 2))])
    return dry * (1 - mix) + wet * mix * 0.6


def env_exp(t, tau):
    return np.exp(-t / tau)


def pad_to(x, n):
    if len(x) >= n:
        return x[:n]
    z = np.zeros((n, 2)) if x.ndim == 2 else np.zeros(n)
    z[:len(x)] = x
    return z


# ------------------------------------------------------------------ Stimme
def voice_chain(v):
    m = v.copy()
    for c in range(2):
        m[:, c] = hp(m[:, c], 70)
    return reverb(m, sec=0.9, mix=0.07, bright=0.6, seed=3)[:len(v)]


# ------------------------------------------------------------------ Musikbett (Moll-Drone)
NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}


def note_hz(semi_from_root, root='A', octave=2):
    n = NOTE[root] + 12 * (octave + 1) + semi_from_root  # MIDI
    return 440.0 * 2 ** ((n - 69) / 12)


def drone(dur, key='A', seed=7, intensity=1.0):
    sr2 = 22050
    t = np.arange(int(dur * sr2)) / sr2
    r = np.random.default_rng(seed)
    out = np.zeros((len(t), 2))
    # 1) Sub-Bass (Grundton, Oktave 1) mit langsamem Atmen
    f0 = note_hz(0, key, 1)
    sub = np.sin(2 * np.pi * f0 * t) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.031 * t + 1)) + 0.25 * np.sin(2 * np.pi * f0 * 2 * t)
    out += np.stack([sub, sub], 1) * 1.0
    # 2) Moll-Flächen: i – VI – iv – i (je ~10 s, weich überblendet)
    chords = [[0, 3, 7, 12], [-4, 0, 3, 8], [-7, -4, 0, 5], [0, 3, 7, 10]]
    seg = 10.0
    pad = np.zeros((len(t), 2))
    for ci in range(int(dur / seg) + 2):
        ch = chords[ci % len(chords)]
        a = (ci * seg - 3.0)
        w = np.clip((t - a) / 3.0, 0, 1) * np.clip((a + seg + 3.0 - t) / 3.0, 0, 1)
        w = np.sin(w * np.pi / 2) ** 2
        if w.max() == 0:
            continue
        for vi, semi in enumerate(ch):
            f = note_hz(semi, key, 2 + (1 if vi >= 2 else 0))
            v = np.zeros(len(t))
            for h in range(1, 9):
                if f * h > 1400:
                    break
                for det in (-0.0018, 0.0018):
                    v += np.sin(2 * np.pi * f * h * (1 + det) * t + r.uniform(0, 6.28)) / h
            pan = (vi / 3 - 0.5) * 0.8
            pad += stereo(v * w * (0.8 if vi else 1.0), pan)
    out += pad * 0.11 * intensity
    # 3) hoher, leiser Spannungston (Oktave 5) mit Vibrato, kommt und geht
    fh = note_hz(0, key, 5)
    hi = np.sin(2 * np.pi * fh * t + 3 * np.sin(2 * np.pi * 0.2 * t)) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.023 * t - 1.2)) ** 2
    out += stereo(hi * 0.035 * intensity, 0.3)
    # auf 44,1 kHz hochrechnen
    t44 = np.arange(int(dur * SR)) / SR
    up = np.stack([np.interp(t44, t, out[:, c]) for c in range(2)], 1)
    for c in range(2):
        up[:, c] = lp(up[:, c], 1100, 0.5)
    # 4) Luft: rosa Rauschen im Mittenband, langsam schwellend
    air = bp(noise(dur, 'pink'), 350, 2400) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.05 * t44)) * 0.05 * intensity
    up += stereo(air, -0.2) * 0.6 + stereo(np.roll(air, 2000), 0.2) * 0.6
    up = reverb(up, sec=3.5, mix=0.35, bright=0.35, seed=seed)[: len(t44)]
    return up


# ------------------------------------------------------------------ Atmosphären
def crickets(dur, n=4, level=1.0):
    t = tvec(dur)
    out = np.zeros((len(t), 2))
    for k in range(n):
        f = 4200 + rng.uniform(-400, 600)
        rate = rng.uniform(0.55, 0.9)
        gate = np.zeros(len(t))
        p = rng.uniform(0, rate)
        while p < dur:
            for j in range(rng.integers(2, 5)):
                a = int((p + j * 0.045) * SR); b = a + int(0.03 * SR)
                if b < len(t):
                    gate[a:b] = np.hanning(b - a)
            p += rate * rng.uniform(0.85, 1.2)
        tone = np.sin(2 * np.pi * f * t) * gate * rng.uniform(0.4, 1.0)
        out += stereo(tone, rng.uniform(-0.8, 0.8))
    return out * 0.08 * level


def wind(dur, center=500, level=1.0, whistle=False):
    t = tvec(dur)
    x = noise(dur, 'pink')
    lfo = 0.55 + 0.45 * np.sin(2 * np.pi * 0.07 * t + rng.uniform(0, 6)) * np.sin(2 * np.pi * 0.019 * t + 1)
    y = bp(x, center * 0.4, center * 2.2) * lfo
    if whistle:
        y += np.sin(2 * np.pi * (center * 2.6 + 60 * np.sin(2 * np.pi * 0.11 * t)) * t) * lfo ** 3 * 0.12
    return np.stack([y, np.roll(y, 3000)], 1) * 0.5 * level


def ambience(name, dur):
    n = int(dur * SR)
    if not name or name == 'none':
        return np.zeros((n, 2))
    if name == 'night':
        return crickets(dur, 5) + wind(dur, 380, 0.5)
    if name == 'field':
        t = tvec(dur)
        grain = bp(noise(dur, 'pink'), 900, 4200) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.09 * t) * np.sin(2 * np.pi * 0.031 * t + 2))
        bugs = bp(noise(dur), 4500, 7500) * (0.6 + 0.4 * np.sin(2 * np.pi * 47 * t)) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.06 * t + 1)) * 0.35
        out = stereo(grain * 0.35, -0.3) + stereo(np.roll(grain, 5000) * 0.35, 0.3) + stereo(bugs, 0.1)
        for tt in np.arange(rng.uniform(2, 5), dur, rng.uniform(7, 11)):
            c = reverb(make('crow', pan=rng.uniform(-0.8, 0.8)) * 0.2, 2.0, 0.5, 0.4)
            a = int(tt * SR); b = min(n, a + len(c)); out[a:b] += c[:b - a]
        return out
    if name == 'wind':
        return wind(dur, 520, 1.0, whistle=True)
    if name == 'snow':
        return wind(dur, 650, 0.9, whistle=True) * 0.8
    if name == 'rain':
        r = hp(noise(dur), 900) * 0.25
        drops = np.zeros(n)
        idx = rng.integers(0, n, int(dur * 60))
        drops[idx] = rng.uniform(0.2, 1.0, len(idx))
        drops = hp(drops, 2500) * 0.8
        return stereo(r + drops, 0) + wind(dur, 300, 0.3)
    if name == 'indoor':
        t = tvec(dur)
        hum = (np.sin(2 * np.pi * 50 * t) + 0.5 * np.sin(2 * np.pi * 100 * t)) * 0.02
        room = lp(noise(dur, 'pink'), 300) * 0.05
        out = stereo(hum + room, 0)
        clk = make('clock')
        for tt in np.arange(0.3, dur, 1.0):
            a = int(tt * SR); b = min(n, a + len(clk)); out[a:b] += clk[:b - a] * 0.25
        return out
    if name == 'forest':
        return wind(dur, 900, 0.6) + crickets(dur, 2, 0.5)
    if name == 'city':
        return stereo(lp(noise(dur, 'brown'), 220) * 0.3, 0) + wind(dur, 300, 0.3)
    return np.zeros((n, 2))


# ------------------------------------------------------------------ Effekte
def _res(t, partials):
    y = np.zeros(len(t))
    for f, tau, a in partials:
        y += a * np.sin(2 * np.pi * f * t) * np.exp(-t / tau)
    return y


def _repeat(fn, times, n_total):
    out = np.zeros((int(n_total * SR), 2))
    for i, tt in enumerate(times):
        s = fn(i)
        a = int(tt * SR); b = min(len(out), a + len(s)); out[a:b] += s[:b - a]
    return out


def make(name, pan=0.0):
    name = name.lower()
    if name == 'hit':
        t = tvec(4.0)
        f = 38 + 72 * np.exp(-t / 0.35)
        ph = 2 * np.pi * np.cumsum(f) / SR
        boom = np.sin(ph) * np.exp(-t / 0.9)
        thud = np.sin(2 * np.pi * 170 * t) * np.exp(-t / 0.07) * 0.5
        burst = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.05) * 0.6
        y = boom + thud + burst
        return reverb(stereo(y / np.max(np.abs(y)) * 0.9, pan), 3.0, 0.4, 0.3)[: len(t)]
    if name == 'riser':
        dur = 1.8; t = tvec(dur)
        x = noise(dur)
        y = np.zeros(len(t)); win = int(0.06 * SR); hop = win // 2; hw = np.hanning(win)
        for a in range(0, len(t) - win, hop):
            k = a / len(t)
            seg = x[a:a + win] * hw
            c = 400 * (12 ** k)
            y[a:a + win] += _fftfilt(seg, lambda f: np.exp(-((np.log((f + 1) / c)) ** 2) / 0.25))
        tone = np.sin(2 * np.pi * np.cumsum(200 * (4 ** (t / dur))) / SR) * 0.25
        y = (y / (np.max(np.abs(y)) + 1e-9) + tone) * (t / dur) ** 2.2
        return reverb(stereo(y * 0.7, pan), 1.5, 0.3, 0.6)[: len(t) + int(0.5 * SR)]
    if name == 'sting':
        dur = 1.4; t = tvec(dur)
        y = np.zeros(len(t))
        for semi in (0, 1, 6, 7, 13):
            f = 220 * 2 ** (semi / 12)
            for h in range(1, 6):
                y += np.sin(2 * np.pi * f * h * t * (1 + rng.uniform(-0.004, 0.004))) / h
        y = bp(y, 200, 3000) * (t / dur) ** 2.5
        y = y / (np.max(np.abs(y)) + 1e-9) * 0.7
        out = stereo(y, pan)
        h = make('hit', pan)
        res = np.zeros((len(out) + len(h), 2)); res[:len(out)] += out; res[len(out) - int(0.02 * SR):len(out) - int(0.02 * SR) + len(h)] += h
        return res
    if name in ('bell', 'bell1'):
        # Dorfkirchen-Glocke aus der Ferne: Schlagton ≈ 294 Hz, kurze Nachklänge, gedämpft + viel Raum
        def strike(_):
            t = tvec(5.0)
            f = 294.0
            parts = [(0.5, 2.6, 0.30), (1.0, 2.2, 0.7), (1.19, 1.9, 0.45), (1.5, 1.5, 0.3), (2.0, 1.7, 0.55), (2.51, 1.0, 0.22), (2.66, 0.9, 0.2), (3.0, 0.7, 0.16), (4.07, 0.5, 0.12)]
            y = np.zeros(len(t))
            for r, tau, a in parts:
                for d in (-0.35, 0.35):
                    y += a * 0.5 * np.sin(2 * np.pi * (f * r + d) * t + rng.uniform(0, 6)) * np.exp(-t / tau)
            y += bp(rng.standard_normal(len(t)), 1200, 5000) * np.exp(-t / 0.01) * 0.6
            y = lp(y, 3200)
            return reverb(stereo(y / np.max(np.abs(y)) * 0.8, pan), 3.2, 0.55, 0.35, seed=11)[: len(t)]
        if name == 'bell1':
            return strike(0)
        return _repeat(strike, [0.0, 1.9], 7.0)
    if name in ('knock', 'knock1'):
        def k1(i):
            t = tvec(0.6)
            y = _res(t, [(165 + 8 * i, 0.08, 1.0), (380, 0.045, 0.6), (640, 0.03, 0.35)])
            y += bp(rng.standard_normal(len(t)), 800, 5000) * np.exp(-t / 0.004) * 0.6
            return reverb(stereo(y / np.max(np.abs(y)) * 0.9, pan), 0.7, 0.25, 0.5)[: len(t)]
        return k1(0) if name == 'knock1' else _repeat(k1, [0, 0.36, 0.72], 1.5)
    if name in ('thump', 'thumps'):
        def th(i):
            t = tvec(0.8)
            y = np.sin(2 * np.pi * (60 + 30 * np.exp(-t / 0.05)) * t) * np.exp(-t / 0.18) + 0.4 * lp(rng.standard_normal(len(t)), 600) * np.exp(-t / 0.03)
            return reverb(stereo(y / np.max(np.abs(y)) * 0.9, pan), 1.2, 0.25, 0.3)[: len(t)]
        return th(0) if name == 'thump' else _repeat(th, [0, 0.62, 1.24], 2.2)
    if name in ('tap', 'tap1', 'glass'):
        def tp(i):
            t = tvec(0.5)
            y = _res(t, [(2300 + 40 * i, 0.05, 1.0), (3450, 0.035, 0.6), (5100, 0.02, 0.4)]) + rng.standard_normal(len(t)) * np.exp(-t / 0.002) * 0.4
            return reverb(stereo(y / np.max(np.abs(y)) * 0.6, pan), 0.8, 0.2, 0.7)[: len(t)]
        return tp(0) if name == 'tap1' else _repeat(tp, [0, 0.32, 0.64], 1.3)
    if name == 'whoosh':
        dur = 0.7; t = tvec(dur)
        x = noise(dur); y = np.zeros(len(t)); win = int(0.05 * SR); hop = win // 2; hw = np.hanning(win)
        for a in range(0, len(t) - win, hop):
            k = a / len(t); c = 2400 * (0.15 ** k)
            y[a:a + win] += _fftfilt(x[a:a + win] * hw, lambda f: np.exp(-((np.log((f + 1) / c)) ** 2) / 0.4))
        y *= np.sin(np.pi * t / dur) ** 2
        p = np.linspace(-0.7, 0.7, len(t))
        return np.stack([y * np.cos((p + 1) * np.pi / 4), y * np.sin((p + 1) * np.pi / 4)], 1) / (np.max(np.abs(y)) + 1e-9) * 0.7
    if name in ('scrape', 'drag'):
        dur = 1.3 if name == 'scrape' else 2.0; t = tvec(dur)
        flutter = (rng.uniform(0, 1, int(dur * 22) + 2) > 0.35).astype(float)
        fl = pad_to(np.repeat(flutter, int(np.ceil(SR / 22))), len(t))
        y = bp(noise(dur), 900, 3800 if name == 'scrape' else 1800) * smooth(fl, 0.01)
        if name == 'scrape':
            y += _res(t, [(2850, 0.3, 0.15), (4100, 0.2, 0.1)]) * 0.5
        y *= np.sin(np.pi * t / dur) ** 0.5
        return reverb(stereo(y / (np.max(np.abs(y)) + 1e-9) * 0.6, pan), 1.0, 0.25, 0.5)[: len(t)]
    if name == 'heartbeat':
        def hb(i):
            t = tvec(0.5)
            y = np.sin(2 * np.pi * 52 * t) * np.exp(-t / 0.09)
            return stereo(y * 0.9, 0)
        times = []
        for k in range(4):
            times += [k * 0.86, k * 0.86 + 0.27]
        return _repeat(hb, times, 4.0)
    if name == 'steps':
        def st(i):
            t = tvec(0.25)
            y = lp(rng.standard_normal(len(t)), 1300) * np.exp(-t / 0.035) + np.sin(2 * np.pi * 90 * t) * np.exp(-t / 0.04) * 0.6
            return stereo(y / np.max(np.abs(y)) * 0.5, -0.3 if i % 2 else 0.3)
        return _repeat(st, [i * 0.48 for i in range(6)], 3.2)
    if name in ('creak', 'door'):
        dur = 1.6; t = tvec(dur)
        f = 230 + 160 * np.sin(2 * np.pi * 0.5 * t) + 40 * rng.standard_normal(len(t)).cumsum() / np.sqrt(len(t)) * 3
        ph = 2 * np.pi * np.cumsum(np.abs(f)) / SR
        y = np.sign(np.sin(ph)) * 0.4 + np.sin(ph * 2) * 0.3
        y = bp(y, 300, 3000) * np.sin(np.pi * t / dur) ** 0.7
        return reverb(stereo(y * 0.5, pan), 1.0, 0.3, 0.4)[: len(t)]
    if name == 'crow':
        def cw(i):
            t = tvec(0.4)
            f = 560 - 120 * t / 0.4
            ph = 2 * np.pi * np.cumsum(f) / SR
            y = sum(np.sin(ph * h) / h for h in range(1, 9)) + 0.4 * rng.standard_normal(len(t))
            y = bp(y, 700, 2600) * np.sin(np.pi * t / 0.4) ** 0.6
            return stereo(y / np.max(np.abs(y)) * 0.5, pan)
        return _repeat(cw, [0, 0.5], 1.0)
    if name == 'train':
        dur = 5.0; t = tvec(dur)
        swell = np.exp(-((t - 2.5) / 1.3) ** 2)
        rumble = lp(noise(dur, 'brown'), 260) * 0.8
        clack = np.zeros(len(t))
        for tt in np.arange(0, dur, 0.29):
            a = int(tt * SR); b = min(len(t), a + int(0.04 * SR)); clack[a:b] += np.exp(-np.arange(b - a) / (0.008 * SR))
        clack = bp(clack * rng.standard_normal(len(t)), 300, 2500) * 0.8
        y = (rumble + clack) * swell
        p = np.linspace(-0.8, 0.8, len(t))
        return np.stack([y * np.cos((p + 1) * np.pi / 4), y * np.sin((p + 1) * np.pi / 4)], 1) / (np.max(np.abs(y)) + 1e-9) * 0.8
    if name == 'phone':
        def bz(i):
            t = tvec(0.45)
            y = np.sign(np.sin(2 * np.pi * 150 * t)) * 0.3 * (0.6 + 0.4 * np.sin(2 * np.pi * 30 * t))
            return stereo(lp(y, 1200) * 0.6, 0)
        return _repeat(bz, [0, 0.7, 1.4], 2.0)
    if name == 'thunder':
        dur = 5.0; t = tvec(dur)
        y = lp(noise(dur, 'brown'), 180) * np.exp(-t / 1.6) + bp(noise(dur), 300, 2000) * np.exp(-t / 0.15) * 0.4
        return reverb(stereo(y / np.max(np.abs(y)) * 0.9, 0), 3.0, 0.4, 0.2)[: len(t)]
    if name == 'whisper':
        dur = 1.6; t = tvec(dur)
        syl = np.zeros(len(t))
        for tt in np.arange(0.05, dur - 0.2, 0.22):
            a = int(tt * SR); b = a + int(0.16 * SR); syl[a:b] += np.hanning(b - a)
        y = bp(noise(dur), 1500, 6000) * syl
        return reverb(stereo(y / (np.max(np.abs(y)) + 1e-9) * 0.35, pan), 1.2, 0.35, 0.6)[: len(t)]
    if name == 'clock':
        t = tvec(0.08)
        y = _res(t, [(3100, 0.01, 1.0), (5200, 0.006, 0.5)])
        return stereo(y * 0.3, 0.4)
    raise ValueError('unbekannter Effekt: ' + name)


# ------------------------------------------------------------------ Lautheit
def loudnorm(src, dst, I=-16.0, TP=-1.5, LRA=11.0):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', f'loudnorm=I={I}:TP={TP}:LRA={LRA}:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True)
    js = json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr, re.S).group(0))
    af = (f"loudnorm=I={I}:TP={TP}:LRA={LRA}:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
          f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', af, '-ar', str(SR), '-ac', '2', dst], check=True)
