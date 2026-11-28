"""Sounddesign + Musikbett + Mix fuer die Aufzug-Demo (alles synthetisch, keine fremden Samples).

Aufruf: python3 sfx.py build/plan.json build/voice.wav build/mix.wav
"""
import json
import math
import sys

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
P = json.load(open(sys.argv[1]))
voice, vsr = sf.read(sys.argv[2], dtype="float32")
assert vsr == SR
DUR = P["duration"]
N = int(DUR * SR)
rng = np.random.default_rng(13)


def T(n):
    return np.arange(n) / SR


def place(buf, x, t0, gain=1.0):
    i0 = int(round(t0 * SR))
    if i0 >= len(buf):
        return
    x = x[: len(buf) - i0]
    buf[i0:i0 + len(x)] += x * gain


def env_adsr(n, a, d, s=0.0, r=0.0):
    e = np.ones(n)
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nd:
        e[na:na + nd] = np.exp(np.linspace(0, -5, nd)) * (1 - s) + s
    e[na + nd:] = s if (s or r) else 0
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), "low")
    return signal.lfilter(b, a, x)


def hp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), "high")
    return signal.lfilter(b, a, x)


def bp(x, f1, f2, order=2):
    b, a = signal.butter(order, [f1 / (SR / 2), f2 / (SR / 2)], "band")
    return signal.lfilter(b, a, x)


def noise(n):
    return rng.standard_normal(n)


def brown(n):
    x = np.cumsum(rng.standard_normal(n))
    x = hp(x, 20)
    return x / (np.max(np.abs(x)) + 1e-9)


def saw(f, n, phase=0.0):
    ph = (np.cumsum(np.full(n, f) if np.isscalar(f) else f) / SR + phase) % 1.0
    return 2 * ph - 1


def sine(f, n, phase=0.0):
    ph = np.cumsum(np.full(n, f) if np.isscalar(f) else f) / SR
    return np.sin(2 * np.pi * ph + phase)


def reverb_ir(sec=1.4, damp=3000):
    n = int(sec * SR)
    ir = noise(n) * np.exp(-np.linspace(0, 7, n))
    ir = lp(ir, damp)
    ir[0] = 1.0
    return ir / np.sqrt(np.sum(ir ** 2))


IR = reverb_ir()


def verb(x, wet=0.25):
    y = signal.fftconvolve(x, IR)[: len(x)]
    return x * (1 - wet) + y * wet


def jhash(n):
    # gleiche Pseudozufallsfunktion wie in scene.js (Lichtflackern synchron)
    s = math.sin(n * 127.1 + 311.7) * 43758.5453
    return s - math.floor(s)


music = np.zeros(N)
sfx = np.zeros(N)
t = T(N)

# ---------------- Musikbett: dunkler D-Moll-Drone, steigert sich ----------------
end_music = P["blackout"][0]
nm = int(end_music * SR)
tm = t[:nm]
intensity = np.clip(tm / 1.2, 0, 1) * (0.55 + 0.45 * np.clip((tm - P["floor13"]) / (P["doorsOpen"][0] - P["floor13"]), 0, 1))
pad = np.zeros(nm)
for f, g in [(73.42, 1.0), (110.0, 0.6), (146.83, 0.35), (174.61, 0.3)]:
    for det in (-0.12, 0.0, 0.13):
        pad += saw(f * (1 + det / 100), nm, rng.random()) * g
cut = 380 + 900 * intensity
# zeitvariabler Tiefpass (blockweise)
pad_f = np.zeros(nm)
blk = 2400
zi = None
for i in range(0, nm, blk):
    b, a = signal.butter(2, min(0.45, cut[i] / (SR / 2)), "low")
    seg = pad[i:i + blk]
    if zi is None:
        zi = signal.lfilter_zi(b, a) * seg[0]
    y, zi = signal.lfilter(b, a, seg, zi=zi)
    pad_f[i:i + blk] = y
pad_f /= np.max(np.abs(pad_f)) + 1e-9
sub = sine(36.71, nm) * 0.5
# Dissonanz ab der 13 (kleine Sekunde Eb)
diss = lp(saw(155.56, nm) + saw(155.56 * 1.0015, nm), 900) * np.clip((tm - P["floor13"]) / 0.6, 0, 1) * 0.35
# hohe Streicher-Spannung ab dem Handy, Tremolo
strings = bp(noise(nm), 1050, 1450, 2) * (0.5 + 0.5 * np.sin(2 * np.pi * 11 * tm)) * np.clip((tm - P["buzz1"]) / 3.0, 0, 1) * 0.5
music[:nm] = (pad_f * 0.55 + sub + diss + strings) * intensity
music[:nm] *= np.minimum(1, (end_music - tm) / 0.03)  # harter Stopp beim Stromausfall
# Herzschlag ab dem Handy, wird schneller
hb_t = P["buzz1"] + 0.35
period = 0.82
while hb_t < P["blackout"][0] - 0.1:
    for k, (off, gn) in enumerate([(0.0, 1.0), (0.16, 0.7)]):
        n = int(0.22 * SR)
        f = 58 * np.exp(-T(n) * 6)
        thump = sine(f, n) * np.exp(-T(n) * 22) * gn
        place(music, lp(thump, 180), hb_t + off, 0.9)
    hb_t += period
    period = max(0.48, period * 0.92)

# ---------------- Geraeusche ----------------
# Raumton / Kabinenbrummen
room = lp(brown(N), 300) * 0.25
hum = (sine(50, N) * 0.5 + sine(100, N) * 0.3 + sine(150, N) * 0.12) * 0.06
room_env = np.ones(N)
room_env[t >= P["shotD"][1]] = 0
room_env[(t >= P["blackout"][0]) & (t < P["jump"])] = 0.15
sfx += (room + hum) * room_env * 0.5

# Knopfdruck
n = int(0.06 * SR)
click = hp(noise(n), 1500) * np.exp(-T(n) * 120) * 0.6 + sine(1900, n) * np.exp(-T(n) * 60) * 0.25
place(sfx, click, P["press"], 0.5)

# Motor waehrend der Fahrt
m0, m1 = P["moveStart"], P["stop"]
nmo = int((m1 - m0 + 0.3) * SR)
tmo = T(nmo)
wob = 1 + 0.004 * np.sin(2 * np.pi * 0.7 * tmo)
motor = (sine(118 * wob, nmo) * 0.5 + sine(236 * wob, nmo) * 0.2 + bp(noise(nmo), 300, 900) * 0.25)
menv = np.clip(tmo / 0.4, 0, 1) * np.clip((m1 - m0 - tmo) / 0.15 + 1, 0, 1)
place(sfx, motor * menv, m0, 0.16)

# Glitch beim Sprung auf 13
ng = int(0.35 * SR)
tg = T(ng)
buzz = np.sign(np.sin(2 * np.pi * 120 * tg)) * 0.5 + hp(noise(ng), 2000) * (rng.random(ng) > 0.985) * 2.0
place(sfx, lp(buzz, 5000) * np.exp(-tg * 4), P["floor13"] - 0.16, 0.22)

# Stopp-Ruck
n = int(0.6 * SR)
clunk = sine(62 * np.exp(-T(n) * 3), n) * np.exp(-T(n) * 9) + bp(noise(n), 1800, 4200) * np.exp(-T(n) * 25) * 0.4
place(sfx, verb(clunk, 0.2), P["stop"], 0.55)

# Gong (Aufzug-"Ding"), leicht verstimmt
n = int(2.2 * SR)
f0 = 932.0
ding = sum(sine(f0 * r, n) * g * np.exp(-T(n) * dcy) for r, g, dcy in [(1.0, 1.0, 2.2), (2.0, 0.35, 3.0), (2.76, 0.22, 4.0), (5.4, 0.08, 6.0)])
ding *= np.minimum(1, T(n) / 0.004)
place(sfx, verb(ding, 0.35), P["ding"], 0.32)

# Handyvibration (gedaempft, in der Hand)
def vib(dur):
    n = int(dur * SR)
    tt = T(n)
    v = np.sign(np.sin(2 * np.pi * 168 * tt)) * 0.6 + sine(336, n) * 0.3
    v *= np.minimum(1, tt / 0.01) * np.minimum(1, (dur - tt) / 0.02)
    return lp(v, 1400)
place(sfx, vib(0.2), P["buzz1"], 0.32)
place(sfx, vib(0.2), P["buzz1"] + 0.3, 0.32)
place(sfx, vib(0.22), P["buzz2"], 0.32)

# Nachrichtenton (leise)
n = int(0.5 * SR)
tri = (sine(1318.5, n) * np.exp(-T(n) * 9) + sine(1760, n) * np.exp(-T(n) * 11) * 0.6)
place(sfx, tri, P["notif1"], 0.07)
place(sfx, tri, P["notif2"], 0.07)

# Tueren gleiten auf
d0, d1 = P["doorsOpen"]
nd = int((d1 - d0 + 0.4) * SR)
td = T(nd)
slide_env = np.clip(td / 0.15, 0, 1) * np.clip((d1 - d0 - td) / 0.25 + 1, 0, 1)
slide = (bp(noise(nd), 120, 700) * 0.8 + bp(noise(nd), 1500, 3500) * 0.15) * slide_env
roll = sine(46, nd) * slide_env * 0.4
end_thud = np.zeros(nd)
k = int((d1 - d0) * SR)
nt = min(nd - k, int(0.3 * SR))
end_thud[k:k + nt] = sine(70, nt) * np.exp(-T(nt) * 18)
place(sfx, verb(slide + roll + end_thud, 0.25), d0, 0.5)

# Flackernde Lampen im Flur (synchron zur Szene)
f0, f1 = P["flicker"]
nf = int((P["blackout"][0] - d0) * SR)
tf = d0 + T(nf)
onmask = np.zeros(nf)
for i in range(nf):
    tt = tf[i]
    if tt < f0:
        onmask[i] = 1.0
    else:
        h = jhash(math.floor(tt * 14) * 2.7)
        onmask[i] = 1.0 if h > 0.55 else (0.25 if h > 0.3 else 0.0)
onmask = lp(onmask, 60)
lbuzz = (np.sign(np.sin(2 * np.pi * 100 * tf)) * 0.4 + sine(200, nf) * 0.3) * onmask
crack = hp(noise(nf), 2500) * np.abs(np.diff(onmask, prepend=onmask[0])) * 40
place(sfx, lp(lbuzz, 2500) + crack, d0, 0.09)

# Stromausfall: Herunterfahren + Klick
n = int(0.5 * SR)
pd = sine(140 * np.exp(-T(n) * 4), n) * np.exp(-T(n) * 5) * 0.8
pd[:int(0.01 * SR)] += hp(noise(int(0.01 * SR)), 1000) * 0.8
place(sfx, pd, P["blackout"][0], 0.28)

# Riser vor dem Schock (rueckwaerts laufendes Rauschen)
nr = int(0.2 * SR)
riser = hp(noise(nr), 800) * np.linspace(0, 1, nr) ** 3
place(sfx, riser, P["jump"] - 0.2, 0.16)

# SCHOCK: Schlag + Streicher-Cluster
n = int(1.6 * SR)
tt = T(n)
boom = sine(58 * np.exp(-tt * 2.5), n) * np.exp(-tt * 3.2) * 1.0
hit = lp(noise(n), 3500) * np.exp(-tt * 30) * 0.8
cluster = np.zeros(n)
for f in (293.7, 311.1, 329.6, 349.2, 370.0, 587.3, 622.3):
    cluster += saw(f * (1 + rng.normal(0, 0.002)), n)
cluster = bp(cluster, 250, 3500) * (0.6 + 0.4 * np.sin(2 * np.pi * 13 * tt)) * np.exp(-tt * 1.6) * np.minimum(1, tt / 0.012) / 7
place(sfx, verb(boom + hit + cluster * 1.4, 0.3), P["jump"], 0.9)

# Knacken + Schrei beim Wegknicken des Kopfes
n = int(0.12 * SR)
crk = hp(noise(n), 1200) * np.exp(-T(n) * 70) + sine(180, n) * np.exp(-T(n) * 40) * 0.6
place(sfx, crk, P["snap"] - 0.01, 0.7)
s0, s1 = P["scream"]
ns = int((s1 - s0 + 0.05) * SR)
ts = T(ns)
f = 430 * np.exp(-ts * 0.9) * (1 + 0.03 * np.sin(2 * np.pi * 9.5 * ts))
src = saw(f, ns) + saw(f * 1.5, ns) * 0.4 + noise(ns) * 0.35
scream = np.zeros(ns)
for fc, bw, g in [(850, 300, 1.0), (1250, 400, 0.8), (2700, 700, 0.55), (3600, 900, 0.3)]:
    scream += bp(src, fc - bw / 2, fc + bw / 2) * g
scream = np.tanh(scream * 3) * np.minimum(1, ts / 0.02)
place(sfx, verb(scream, 0.3), s0, 0.42)

# ---------------- Mix ----------------
v = np.zeros(N)
v[: min(N, len(voice))] = voice[:N]
venv = lp(np.abs(v), 8)
venv /= np.max(venv) + 1e-9
duck = 1 - 0.45 * np.clip(venv * 3, 0, 1)
mix = v * 1.0 + music * 0.11 * duck + sfx * 0.9
# alles nach dem Schnitt auf Schwarz: kurzer Nachhall, dann Stille
cut_t = P["black"][0]
tail = np.clip(1 - (t - cut_t) / 0.35, 0, 1)
tail[t < cut_t] = 1
mix *= tail
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= 0.93 / (np.max(np.abs(mix)) + 1e-9)
stereo = np.stack([mix, mix], axis=1).astype(np.float32)
sf.write(sys.argv[3], stereo, SR)
print("mix", sys.argv[3], f"{len(mix) / SR:.2f}s", "peak", float(np.max(np.abs(mix))))
