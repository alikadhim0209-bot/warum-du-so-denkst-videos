# Tonspur fuer das Duell-Video: Wind, sparsame Western-Zupfer, Schuesse, Aufprall
import sys, wave
import numpy as np
SR = 48000; DAUER = 35.0
rng = np.random.default_rng(4)
buf = np.zeros(int(DAUER * SR) + SR)
T = lambda d: np.arange(int(d * SR)) / SR

def tiefpass(x, fc):                      # per FFT, schnell genug fuer lange Signale
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / (1 + (f / fc) ** 4), len(x))
def add(t, sig, g=1.0):
    k = int(max(t, 0) * SR); e = min(len(buf), k + len(sig)); buf[k:e] += sig[:e - k] * g

def zupfer(freq, d=1.6, g=1.0):
    t = T(d); s = sum(np.sin(2 * np.pi * freq * n * t) / n ** 1.6 for n in range(1, 7))
    return s * np.exp(-t / .45) * np.minimum(1, t / .003) * g
def schuss():
    t = T(1.4); n = rng.standard_normal(len(t))
    knall = tiefpass(n, 3200) * np.exp(-t / .045) * 3
    bauch = np.sin(2 * np.pi * np.cumsum(60 + 140 * np.exp(-t / .03)) / SR) * np.exp(-t / .12) * 1.6
    hall = tiefpass(n, 900) * np.exp(-t / .38) * .5
    return knall + bauch + hall
def aufprall():
    t = T(.6); n = rng.standard_normal(len(t))
    return np.sin(2 * np.pi * np.cumsum(46 + 70 * np.exp(-t / .05)) / SR) * np.exp(-t / .16) + tiefpass(n, 1100) * np.exp(-t / .06) * 1.2
def wusch(d=.4):
    t = T(d); return tiefpass(rng.standard_normal(len(t)), 1800) * np.sin(np.pi * t / d) ** 2 * 1.4
def klick(f=880):
    t = T(.12); return np.sin(2 * np.pi * f * t) * np.exp(-t / .03)

# Wind
t = T(DAUER); wind = tiefpass(rng.standard_normal(len(t)), 420)
add(0, wind * (.6 + .4 * np.sin(2 * np.pi * .13 * t + 1)) , .5)

# Musik: a-Moll, langsam, mit Pausen vor den Schuessen
A2, C3, D3, E3, G3, A3, C4, E4 = 110, 130.81, 146.83, 164.81, 196, 220, 261.63, 329.63
def phrase(t0, noten, schritt=.62, g=.5):
    for i, f in enumerate(noten):
        if f: add(t0 + i * schritt, zupfer(f), g)
phrase(.5, [A2, E3, A3, C4, A3, E3, A2, None])
phrase(5.3, [A2, None, E3, None, G3, None])
phrase(9.6, [A2, None, A2], .5, .6)                      # Spannung, dann Stille bis zum Schuss
phrase(12.4, [E3, D3, C3, A2], .55, .45)
phrase(15.4, [A2, C3, E3, A3, G3, E3, C3, E3, A2, C3, E3, A3, G3, E3, C3, E3, D3, A3, D3, A3], .62, .34)
phrase(28.7, [A2, None, A2], .5, .6)
phrase(31.0, [A3, E3, C3, A2, None, A2], .6, .5)
add(33.6, zupfer(A2, 2.0) + zupfer(E3, 2.0) + zupfer(A3, 2.0), .35)

# Effekte
for ts in (5.0, 7.3, 9.5, 12.1, 15.0, 28.5, 31.0): add(ts - .15, wusch(), .5)
for ts in (10.6, 11.15, 29.5, 30.0): add(ts, wusch(.22), .45)       # Ziehen
for ts in (11.55, 30.2): add(ts, schuss(), 1.0); add(ts + .82, aufprall(), .9)
for n in range(4):                                                   # Balken der Messtafel
    z = 15.4 + n * 3.3
    if z + 1.3 < 28.4: add(z + 1.25, klick(), .35)
    if z > 21.6: add(z + 1.81, klick(660), .35)
    else: add(z + 1.11, klick(1100), .35)

x = buf[:int(DAUER * SR)]
ein = np.minimum(1, np.arange(len(x)) / (.4 * SR)); aus = np.minimum(1, (len(x) - np.arange(len(x))) / (.6 * SR))
x = np.tanh(x * .9) * ein * aus; x = x / np.max(np.abs(x)) * .89
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.stack([x, x], 1) * 32767).astype(np.int16).tobytes())
