"""Sounddesign + Musikbett + Mix für "Papa ist nicht Papa" (alles synthetisch, keine fremden Samples).
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
EV = P["ev"]
voice, vsr = sf.read(sys.argv[2], dtype="float32")
assert vsr == SR
DUR = P["duration"]
N = int(DUR * SR)
rng = np.random.default_rng(7)
t = np.arange(N) / SR


def T(n):
    return np.arange(n) / SR


def place(buf, x, t0, gain=1.0):
    i0 = int(round(t0 * SR))
    if i0 >= len(buf) or i0 + len(x) <= 0:
        return
    if i0 < 0:
        x = x[-i0:]
        i0 = 0
    x = x[: len(buf) - i0]
    buf[i0:i0 + len(x)] += x * gain


def filt(x, f, kind, order=2):
    b, a = signal.butter(order, np.array(f) / (SR / 2), kind)
    return signal.lfilter(b, a, x)


lp = lambda x, f, o=2: filt(x, f, "low", o)
hp = lambda x, f, o=2: filt(x, f, "high", o)
bp = lambda x, f1, f2, o=2: filt(x, [f1, f2], "band", o)
noise = lambda n: rng.standard_normal(n)


def sine(f, n, phase=0.0):
    ph = np.cumsum(np.full(n, f) if np.isscalar(f) else f) / SR
    return np.sin(2 * np.pi * ph + phase)


def saw(f, n, phase=0.0):
    ph = (np.cumsum(np.full(n, f) if np.isscalar(f) else f) / SR + phase) % 1.0
    return 2 * ph - 1


def fade(x, a=0.01, r=0.05):
    n = len(x)
    e = np.ones(n)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return x * e


def ir(sec=1.6, damp=3000):
    n = int(sec * SR)
    h = noise(n) * np.exp(-np.linspace(0, 7, n))
    h = lp(h, damp)
    h[0] = 1.0
    return h / np.sqrt(np.sum(h ** 2))


IR = ir()


def verb(x, wet=0.25):
    return x * (1 - wet) + signal.fftconvolve(x, IR)[: len(x)] * wet


def jhash(n):
    s = math.sin(n * 127.1 + 311.7) * 43758.5453
    return s - math.floor(s)


def shot_ranges(cams):
    return [(s["t0"], s["t1"]) for s in P["shots"] if s["cam"] in cams]


def mask(ranges, ramp=0.05):
    m = np.zeros(N)
    for a, b in ranges:
        m[int(a * SR):int(b * SR)] = 1
    return lp(m, 1 / ramp) if ramp else m


S = lambda cam: [s for s in P["shots"] if s["cam"] == cam][0]

music = np.zeros(N)
sfx = np.zeros(N)

# ================= Musikbett (dunkler Drone, Intensität nach Kapitel) =================
blocks = 4800
pad = np.zeros(N)
for f, g in [(65.41, 1.0), (98.0, 0.55), (130.81, 0.35), (155.56, 0.3)]:  # C-Moll
    for det in (-0.14, 0.0, 0.12):
        pad += saw(f * (1 + det / 100), N, rng.random()) * g
pad = lp(pad, 700)
pad /= np.max(np.abs(pad)) + 1e-9
sub = sine(32.7, N) * 0.6
diss = lp(saw(138.6, N) + saw(138.6 * 1.002, N), 800) * 0.3
strings = bp(noise(N), 900, 1500) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t)) * 0.4
# Intensitätskurve (0..1) über Stützpunkte
pts = [(0, 0.35), (16, 0.45), (37, 0.6), (54, 0.85), (64, 0.5), (93, 0.65), (110, 0.8), (145, 0.6), (163, 0.75),
       (EV["lightOut"], 0.0), (EV["jump"], 1.0), (199, 0.7), (220, 0.85), (257, 0.8), (285, 0.5), (311, 0.8), (EV["boom"], 1.0),
       (334, 0.25), (EV["smile"][0], 0.45), (P["black"][0], 0.6), (DUR, 0.0)]
xs, ys = zip(*pts)
inten = np.interp(t, xs, ys)
diss_k = np.clip((inten - 0.6) / 0.4, 0, 1)
str_k = np.clip((inten - 0.5) / 0.5, 0, 1)
music = (pad * 0.6 + sub) * inten + diss * diss_k + strings * str_k
# Stille-Momente: "Stille.", Stromausfall
silence = [(P["shots"][5]["t0"] + 1.4, P["shots"][5]["t0"] + 2.6), (EV["lightOut"], EV["jump"] - 0.2)]
for a, b in silence:
    m = np.ones(N)
    m[int(a * SR):int(b * SR)] = 0
    music *= lp(m, 8)
# Herzschlag: Abstellkammer + Garten-Flucht
def heartbeat(a, b, p0=0.85, p1=0.5):
    tt, period = a, p0
    while tt < b:
        for off, gn in [(0.0, 1.0), (0.16, 0.7)]:
            n = int(0.22 * SR)
            f = 58 * np.exp(-T(n) * 6)
            place(music, lp(sine(f, n) * np.exp(-T(n) * 22) * gn, 180), tt + off, 1.3)
        tt += period
        period = max(p1, period * 0.97)
heartbeat(S("door")["t0"], S("door")["t1"])
heartbeat(EV["lightOut"] + 0.3, EV["jump"] - 0.1, 0.7, 0.45)
heartbeat(S("gate")["t0"], S("gateClimb")["t1"], 0.6, 0.42)

# ================= Geräusche =================
def mower_sound(n, muffle=1.0):
    tt = T(n)
    f = 31 * (1 + 0.02 * np.sin(2 * np.pi * 0.6 * tt))
    eng = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.6 + saw(f * 2, n) * 0.3 + bp(noise(n), 200, 1800) * 0.4
    return lp(eng, 1600 * muffle)

# Rasenmäher vom Start bis "geht aus" (durchs Fenster gedämpft)
m_end = EV["mowerOff"]
n = int(m_end * SR)
mw = mower_sound(n, 0.6)
mw[-int(0.8 * SR):] *= np.linspace(1, 0, int(0.8 * SR)) ** 2
gate_mow = 0.6 + 0.4 * mask(shot_ranges(["mowClose"]))[:n]
place(sfx, fade(mw, 1.0, 0.1) * gate_mow, 0, 0.16)
# Rasenmäher am Ende: Seilzug + Anspringen
st = EV["mowerOn"]
for k in range(3):
    nn = int(0.35 * SR)
    pull = bp(noise(nn), 300, 2500) * np.exp(-T(nn) * 6) * np.linspace(0.5, 1, nn)
    place(sfx, pull, st - 1.2 + k * 0.4, 0.25)
n = int((DUR - st) * SR)
place(sfx, fade(mower_sound(n, 0.7), 0.3, 0.2), st, 0.2)

# Wind / Raumton draußen
wind = lp(noise(N), 400) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t))
outside = mask([(s["t0"], s["t1"]) for s in P["shots"] if s["set"] in ("garden",)])
sfx += wind * outside * 0.05
room = lp(noise(N), 200) * (1 - outside) * 0.03
sfx += room

# Handy
def vib(dur):
    n = int(dur * SR)
    tt = T(n)
    v = np.sign(np.sin(2 * np.pi * 168 * tt)) * 0.6 + sine(336, n) * 0.3
    return lp(fade(v, 0.01, 0.02), 1400)
def ding(t0, g=0.08):
    n = int(0.5 * SR)
    tri = sine(1318.5, n) * np.exp(-T(n) * 9) + sine(1760, n) * np.exp(-T(n) * 11) * 0.6
    place(sfx, tri, t0, g)
for tv in [EV["notif1"], EV["voiceMsg"]]:
    place(sfx, vib(0.2), tv, 0.32)
    place(sfx, vib(0.2), tv + 0.3, 0.32)
    ding(tv + 0.05)
for tv in [EV["msgIn2"], EV["msgIn3"], EV["msgIn4"], EV["msgIn5"]]:
    place(sfx, vib(0.18), tv, 0.28)
    ding(tv, 0.05)
# Tippen
for t0, cnt in [(EV["msgOut1"] - 1.6, 12), (EV["msgOut2"] - 1.3, 10)]:
    for k in range(cnt):
        nn = int(0.03 * SR)
        place(sfx, hp(noise(nn), 2500) * np.exp(-T(nn) * 160), t0 + k * 0.13 + rng.random() * 0.04, 0.12)
    place(sfx, sine(880, int(0.12 * SR)) * np.exp(-T(int(0.12 * SR)) * 30), t0 + cnt * 0.13 + 0.1, 0.06)

# Fenster öffnen (Knarzen) + zuknallen
ow = S("openWindow")["t0"] + 0.4
nn = int(1.3 * SR)
creak = bp(saw(180 + 60 * np.sin(2 * np.pi * 1.3 * T(nn)), nn), 300, 2500) * (0.5 + 0.5 * (rng.random(nn) > 0.6))
place(sfx, fade(lp(creak, 3000), 0.1, 0.3), ow, 0.05)
nn = int(0.8 * SR)
slam = sine(70 * np.exp(-T(nn) * 3), nn) * np.exp(-T(nn) * 9) + bp(noise(nn), 800, 5000) * np.exp(-T(nn) * 25) * 0.8
place(sfx, verb(slam, 0.3), EV["windowSlam"], 0.7)
# Lachen des Wesens (tiefes, rhythmisches "ha")
a, b = EV["laugh"]
k = a
while k < min(b, a + 2.0):
    nn = int(0.16 * SR)
    src = saw(95 + rng.random() * 10, nn) + noise(nn) * 0.3
    hah = (bp(src, 300, 900) + bp(src, 1000, 1600) * 0.5) * np.sin(np.pi * T(nn) / 0.16)
    place(sfx, hah, k, 0.12)
    k += 0.22
# Hals wächst: Knirschen/Dehnen
a, b = EV["neckGrow"]
nn = int((b - a) * SR)
stretch = bp(noise(nn), 150, 900) * (0.3 + 0.7 * (rng.random(nn) > 0.97)) + lp(saw(40 + 30 * T(nn) / (b - a), nn), 300) * 0.5
place(sfx, fade(verb(stretch, 0.2), 0.3, 0.2), a, 0.18)

# Fernseher an (Rauschen-Burst + Gemurmel)
place(sfx, fade(hp(noise(int(0.4 * SR)), 1500), 0.005, 0.2), EV["tvOn"], 0.12)
tvm = mask(shot_ranges(["down", "sofa", "sofaClose"]))
murmur = bp(noise(N), 250, 1100) * (0.4 + 0.6 * (lp(rng.random(N), 6) > 0.5))
sfx += lp(murmur, 1500) * tvm * np.clip((t - EV["tvOn"]) * 5, 0, 1) * 0.03
# Schnarchen
a, b = EV["snore"]
k = a
while k < b - 0.6:
    nn = int(1.0 * SR)
    tt = T(nn)
    env = np.sin(np.pi * np.clip(tt / 1.0, 0, 1)) ** 2
    sn = (lp(noise(nn), 400) * 0.7 + sine(70 + 15 * np.sin(2 * np.pi * 28 * tt), nn) * 0.3) * env
    place(sfx, sn, k, 0.35)
    k += 1.7

# Abstellkammer: Schloss, Schritte, Klinke
nn = int(0.09 * SR)
place(sfx, hp(noise(nn), 1800) * np.exp(-T(nn) * 80) + sine(2200, nn) * np.exp(-T(nn) * 50) * 0.3, EV["lock"], 0.35)
a, b = EV["steps"]
k = a
while k < b + 3.0:
    nn = int(0.25 * SR)
    stp = lp(noise(nn), 500) * np.exp(-T(nn) * 25) + sine(60, nn) * np.exp(-T(nn) * 30)
    place(sfx, verb(stp, 0.25), k, 0.35)
    k += 0.95
a, b = EV["handle"]
nn = int((b - a) * SR)
rattle = bp(noise(nn), 1500, 5000) * (rng.random(nn) > 0.993) * 4 + lp(saw(120, nn), 600) * 0.1
place(sfx, fade(rattle, 0.05, 0.1), a, 0.3)
nn = int(0.15 * SR)
place(sfx, hp(noise(nn), 1500) * np.exp(-T(nn) * 50), EV["keyTurn"], 0.4)
nn = int(1.6 * SR)
dcreak = bp(saw(110 + 40 * np.sin(2 * np.pi * 0.8 * T(nn)), nn), 200, 2000) * (0.4 + 0.6 * (rng.random(nn) > 0.5))
place(sfx, fade(lp(dcreak, 2500), 0.1, 0.4), EV["doorOpen"], 0.08)
# Sprachnachricht: gedämpftes Rasenmäher-Brummen im Hintergrund der Nachricht
a, b = EV["voicePlay"]
nn = int((b - a) * SR)
place(sfx, fade(lp(mower_sound(nn), 700), 0.4, 0.4), a, 0.07)

# Küche: Kaffeemaschine blubbert, Brummen der Lampe, Zeitung
kit = mask([(S("doorway")["t0"], EV["lightOut"])])
blub = lp(noise(N), 600) * (lp(rng.random(N), 12) > 0.55) * 0.6
lamp_hum = (sine(100, N) * 0.5 + sine(200, N) * 0.2)
sfx += (blub * 0.06 + lamp_hum * 0.012) * kit
nn = int(0.5 * SR)
place(sfx, fade(bp(noise(nn), 1500, 6000) * np.exp(-T(nn) * 6), 0.02, 0.1), EV["pageTurn"], 0.12)
# Licht aus: Klick + Herunterfahren
nn = int(0.5 * SR)
pd = sine(140 * np.exp(-T(nn) * 4), nn) * np.exp(-T(nn) * 5) * 0.8
pd[: int(0.01 * SR)] += hp(noise(int(0.01 * SR)), 1000) * 0.8
place(sfx, pd, EV["lightOut"], 0.4)
# Flackern
a, b = EV["flicker"][0], EV["jump"] + 2.5
nn = int((b - a) * SR)
tf = a + T(nn)
onm = np.array([1.0 if jhash(math.floor(x * 14) * 2.7) > 0.55 else 0.15 for x in tf[::480]]).repeat(480)[:nn]
onm = lp(onm, 60)
lb = (np.sign(np.sin(2 * np.pi * 100 * tf)) * 0.4 + sine(200, nn) * 0.3) * onm
cr = hp(noise(nn), 2500) * np.abs(np.diff(onm, prepend=onm[0])) * 40
place(sfx, lp(lb, 2500) + cr, a, 0.08)


def shock(t0, g=0.9):
    nn = int(1.8 * SR)
    tt = T(nn)
    boom = sine(58 * np.exp(-tt * 2.5), nn) * np.exp(-tt * 3.2)
    hit = lp(noise(nn), 3500) * np.exp(-tt * 30) * 0.8
    cl = np.zeros(nn)
    for f in (293.7, 311.1, 329.6, 349.2, 370.0, 587.3, 622.3):
        cl += saw(f * (1 + rng.normal(0, 0.002)), nn)
    cl = bp(cl, 250, 3500) * (0.6 + 0.4 * np.sin(2 * np.pi * 13 * tt)) * np.exp(-tt * 1.4) * np.minimum(1, tt / 0.012) / 7
    place(sfx, verb(boom + hit + cl * 1.4, 0.3), t0, g)


def scream(t0, dur, f0=430, g=0.4):
    nn = int(dur * SR)
    tt = T(nn)
    f = f0 * np.exp(-tt * 0.5) * (1 + 0.03 * np.sin(2 * np.pi * 9.5 * tt))
    src = saw(f, nn) + saw(f * 1.5, nn) * 0.4 + noise(nn) * 0.35
    sc = np.zeros(nn)
    for fc, bw, gg in [(850, 300, 1.0), (1250, 400, 0.8), (2700, 700, 0.55), (3600, 900, 0.3)]:
        sc += bp(src, fc - bw / 2, fc + bw / 2) * gg
    sc = np.tanh(sc * 3) * np.minimum(1, tt / 0.02) * np.minimum(1, (dur - tt) / 0.15)
    place(sfx, verb(sc, 0.3), t0, g)


nn = int(0.2 * SR)
place(sfx, hp(noise(nn), 800) * np.linspace(0, 1, nn) ** 3, EV["jump"] - 0.2, 0.16)
shock(EV["jump"])
nn = int(0.12 * SR)
place(sfx, hp(noise(nn), 1200) * np.exp(-T(nn) * 70) + sine(180, nn) * np.exp(-T(nn) * 40) * 0.6, EV["snap"], 0.7)
shock(EV["mouth"], 0.6)
scream(EV["mouth"], 1.0, 430, 0.35)
# Bohrmaschine + Kreischen
a = EV["drill"]
nn = int(2.6 * SR)
tt = T(nn)
f = 180 + 260 * np.minimum(1, tt / 0.3)
drl = saw(f, nn) * 0.4 + np.sign(np.sin(2 * np.pi * np.cumsum(f * 2) / SR)) * 0.2 + bp(noise(nn), 2000, 6000) * 0.2
place(sfx, fade(lp(drl, 5000), 0.02, 0.3), a, 0.12)
scream(EV["shriek"], 1.4, 520, 0.4)
# Sprung durchs Fenster, Landung im Gras
nn = int(0.5 * SR)
place(sfx, lp(noise(nn), 900) * np.exp(-T(nn) * 12) + sine(55, nn) * np.exp(-T(nn) * 10), EV["jump2"] + 0.6, 0.5)

# Wählen 112 (DTMF) + Freizeichen + Verbinden
dtmf = {"1": (697, 1209), "2": (697, 1336)}
for d, tv in zip("112", EV["dial"]):
    nn = int(0.14 * SR)
    place(sfx, fade((sine(dtmf[d][0], nn) + sine(dtmf[d][1], nn)) * 0.5, 0.005, 0.02), tv, 0.08)
c0 = EV["dial"][-1] + 0.5
k = c0
while k < EV["callStart"] - 0.2:
    nn = int(1.0 * SR)
    place(sfx, fade(sine(425, nn), 0.01, 0.02), k, 0.05)
    k += 2.0
# Notruf-Stimme klingt nach Telefon -> wird im Mix gefiltert (siehe unten)

# Terrassentür, Gartentor rütteln, Tritte, Fall
nn = int(1.2 * SR)
place(sfx, fade(bp(noise(nn), 200, 1200) * 0.5, 0.05, 0.3), EV["terraceDoor"], 0.1)
gs = S("gate")
nn = int(1.2 * SR)
rat = bp(noise(nn), 1500, 5000) * (rng.random(nn) > 0.99) * 4 + sine(310, nn) * (rng.random(nn) > 0.995) * 3
place(sfx, rat, gs["t0"] + 2.2, 0.35)
for kk in EV["kicks"]:
    nn = int(0.3 * SR)
    place(sfx, lp(noise(nn), 700) * np.exp(-T(nn) * 18) + sine(70, nn) * np.exp(-T(nn) * 15), kk + 0.05, 0.6)
nn = int(0.6 * SR)
place(sfx, lp(noise(nn), 800) * np.exp(-T(nn) * 9) + sine(50, nn) * np.exp(-T(nn) * 8), EV["fall"] + 0.45, 0.7)

# Polizei: kurzes Martinshorn, Autotür, Funkrauschen
pol = S("police")["t0"]
nn = int(1.6 * SR)
tt = T(nn)
horn = np.where((tt % 0.8) < 0.4, sine(466, nn), sine(622, nn)) * np.exp(-tt * 0.6)
place(sfx, fade(lp(horn, 2500), 0.02, 0.2), pol - 0.3, 0.07)
nn = int(0.4 * SR)
place(sfx, lp(noise(nn), 600) * np.exp(-T(nn) * 14) + sine(90, nn) * np.exp(-T(nn) * 18), pol + 1.0, 0.4)
rad = S("garageNight")["t0"]
nn = int(2.2 * SR)
place(sfx, fade(bp(noise(nn), 800, 3200) * (0.5 + 0.5 * (lp(rng.random(nn), 20) > 0.5)), 0.05, 0.3), rad + 0.1, 0.1)
# Garagentor schließt (Rollen), Taschenlampe, Schrei des Polizisten
a, b = EV["garageClose"]
nn = int((b - a + 0.3) * SR)
roll = bp(noise(nn), 80, 600) * 0.8 + sine(45, nn) * 0.3
place(sfx, fade(roll, 0.1, 0.1), a, 0.3)
nn = int(0.6 * SR)
place(sfx, sine(60, nn) * np.exp(-T(nn) * 10) + lp(noise(nn), 1500) * np.exp(-T(nn) * 18), b, 0.6)
scream(EV["copScream"], 1.1, 330, 0.3)

# Garage: altes Radio (verzerrte Melodie) + Brutzeln, Gas zischt
a, b = EV["radio"]
nn = int((b - a) * SR)
tt = T(nn)
mel = [392, 440, 494, 523, 494, 440, 392, 330]
notes = np.array(mel)[(tt * 2.2).astype(int) % len(mel)]
tune = np.sign(np.sin(2 * np.pi * np.cumsum(notes) / SR)) * 0.3 + sine(notes / 2, nn) * 0.3
tune = bp(tune, 400, 2400) + bp(noise(nn), 1000, 4000) * 0.15
place(sfx, fade(tune, 0.5, 0.2), a, 0.035)
a, b = EV["sizzle"]
nn = int((b - a) * SR)
siz = hp(noise(nn), 3000) * (0.4 + 0.6 * (rng.random(nn) > 0.7))
place(sfx, fade(siz, 0.5, 0.2), a, 0.02)
a = EV["valves"][0]
b = EV["boom"]
nn = int((b - a) * SR)
hiss = hp(noise(nn), 2500) * np.minimum(1, T(nn) / 1.5)
place(sfx, fade(hiss, 0.1, 0.02), a, 0.06)
# Grillanzünder: Klick + Zischen der Flamme
nn = int(0.06 * SR)
place(sfx, hp(noise(nn), 2000) * np.exp(-T(nn) * 100), EV["throw"] - 0.6, 0.3)
# EXPLOSION
nn = int(5.0 * SR)
tt = T(nn)
exp_ = sine(40 * np.exp(-tt * 0.8), nn) * np.exp(-tt * 1.2) * 1.2 + lp(noise(nn), 2500) * np.exp(-tt * 2.5) + lp(noise(nn), 250) * np.exp(-tt * 0.7) * 0.8
place(sfx, verb(np.tanh(exp_ * 1.5), 0.35), EV["boom"], 1.0)
fire_m = mask([(EV["boom"] + 0.4, S("boom")["t1"])], 0.4)
crackle = hp(noise(N), 1500) * (rng.random(N) > 0.996) * 3 + lp(noise(N), 300) * 0.4
sfx += crackle * fire_m * 0.12
a, b = EV["shrieks"]
for k in range(5):
    scream(a + k * 0.35, max(0.8, b - a - k * 0.3), 380 + k * 70, 0.12)

# Morgen: Vögel, Taxi
mor = S("morning")["t0"]
for k in range(16):
    t0 = mor + 0.5 + k * 1.3 + rng.random() * 0.8
    nn = int(0.18 * SR)
    f0 = 3200 + rng.random() * 1500
    chirp = sine(f0 + 900 * np.sin(2 * np.pi * 12 * T(nn)), nn) * np.sin(np.pi * T(nn) / 0.18)
    place(sfx, chirp, t0, 0.025)
nn = int(3.0 * SR)
taxi = lp(saw(38 + 8 * np.exp(-T(nn)), nn) + noise(nn) * 0.2, 400) * np.linspace(1, 0, nn)
place(sfx, taxi, EV["taxi"], 0.1)
nn = int(0.4 * SR)
place(sfx, lp(noise(nn), 600) * np.exp(-T(nn) * 14) + sine(90, nn) * np.exp(-T(nn) * 18), EV["taxi"] + 1.6, 0.35)

# ================= Mix =================
v = np.zeros(N)
v[: min(N, len(voice))] = voice[:N]
# Telefonklang für Notruf-Zeilen + Sprachnachricht
tl = json.load(open(sys.argv[1].replace("plan.json", "timeline.json"), encoding="utf-8"))
for ln in tl["lines"]:
    if ln["tag"] in ("call", "voicemsg"):
        a, b = int(ln["start"] * SR), int((ln["end"] + 0.05) * SR)
        v[a:b] = bp(v[a:b], 350, 3400) * 1.6
venv = lp(np.abs(v), 8)
venv /= np.max(venv) + 1e-9
duck = 1 - 0.5 * np.clip(venv * 3, 0, 1)
mix = v * 1.0 + music * 0.075 * duck + sfx * 0.9 * (1 - 0.25 * np.clip(venv * 3, 0, 1))
# Schwarzbild am Ende: Ton läuft 1,5 s aus
cut_t = P["black"][0]
tail = np.clip(1 - (t - cut_t) / 2.5, 0, 1)
tail[t < cut_t] = 1
mix *= tail
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= 0.93 / (np.max(np.abs(mix)) + 1e-9)
sf.write(sys.argv[3], np.stack([mix, mix], axis=1).astype(np.float32), SR)
print("mix", sys.argv[3], f"{len(mix) / SR:.2f}s", "peak", float(np.max(np.abs(mix))))
