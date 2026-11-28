"""Schnittplan für "Papa ist nicht Papa": alle Zeitpunkte aus timeline.json.
Szene (scene.js) und Ton (sfx.py) lesen beide plan.json -> Bild und Ton synchron.
Aufruf: python3 plan.py build/timeline.json build/plan.json
"""
import json
import sys

tl = json.load(open(sys.argv[1], encoding="utf-8"))
LN = tl["lines"]


def S(i):
    return LN[i]["start"]


def E(i):
    return LN[i]["end"]


def word(i, needle, k=0):
    hits = [w["t"] for w in LN[i]["words"] if needle.lower() in w["w"].lower()]
    return hits[k] if hits else S(i)


END_VOICE = E(len(LN) - 1)
DUR = round(END_VOICE + 4.2, 2)
p = {"duration": DUR, "fps": 30}

# (Zeile, Set, Kamera)  – jeder Schnitt kurz vor dem Satz
CUTS = [
    (0, "garden", "fromWindow"),
    (3, "garden", "mowClose"),
    (6, "garden", "fromWindowWave"),
    (8, "phone", "lock"),
    (10, "phone", "chat"),
    (16, "garden", "mowerOff"),
    (18, "bedroom", "openWindow"),
    (20, "garden", "laugh"),
    (23, "garden", "neckGrow"),
    (27, "bedroom", "headAtWindow"),
    (28, "kidsroom", "lea"),
    (31, "stairs", "down"),
    (33, "living", "sofa"),
    (38, "living", "sofaClose"),
    (40, "storage", "door"),
    (53, "phone", "voice"),
    (63, "storage", "lea"),
    (66, "kitchen", "doorway"),
    (72, "kitchen", "papa"),
    (79, "kitchen", "shock"),
    (86, "kitchen", "drill"),
    (88, "kitchen", "window"),
    (90, "phone", "dial"),
    (92, "phone", "call"),
    (97, "garden", "terrace"),
    (102, "garden", "gate"),
    (105, "garden", "gateClimb"),
    (111, "garden", "police"),
    (115, "garden", "flashlight"),
    (118, "garden", "garageCop"),
    (123, "garden", "garageNight"),
    (131, "garden", "gasBottles"),
    (135, "garden", "doorGap"),
    (137, "garden", "throw"),
    (140, "garden", "boom"),
    (145, "garden", "morning"),
    (150, "garden", "papaFace"),
]
shots = []
for k, (li, st, cam) in enumerate(CUTS):
    t0 = 0.0 if k == 0 else S(li) - 0.08
    t1 = (S(CUTS[k + 1][0]) - 0.08) if k + 1 < len(CUTS) else END_VOICE + 0.6
    shots.append({"set": st, "cam": cam, "t0": round(t0, 3), "t1": round(t1, 3), "line": li})
p["shots"] = shots
p["black"] = [END_VOICE + 0.6, DUR]
p["theEnd"] = END_VOICE + 1.0

# ---- Ereignisse ----
ev = {}
ev["wave"] = S(5)
ev["notif1"] = S(8) - 0.05
ev["msgIn1"] = S(10) - 0.1
ev["msgOut1"] = word(11, "mähst") - 0.2
ev["typing"] = [S(12), E(12) + 0.6]
ev["msgIn2"] = S(13) - 0.1
ev["msgIn3"] = S(14) - 0.1
ev["msgIn4"] = S(15) - 0.1
ev["mowerOff"] = S(16) + 0.9
ev["laugh"] = [S(20), E(20)]
ev["turn"] = S(23)
ev["neckGrow"] = [S(24) + 0.4, E(26)]
ev["windowSlam"] = S(28) + 0.5
ev["tvOn"] = S(31) + 0.5
ev["snore"] = [S(34), E(35) + 0.3]
ev["eyesOpen"] = S(38) + 0.6
ev["lock"] = S(41) + 0.2
ev["steps"] = [S(42), E(42) + 0.6]
ev["feetUnderDoor"] = [S(42) + 0.5, E(51)]
ev["count"] = [S(45), E(48)]
ev["handle"] = [S(50), S(51) + 0.6]
ev["voiceMsg"] = S(53) + 0.6
ev["voicePlay"] = [S(54), E(56)]
ev["msgOut2"] = word(58, "beweis") - 0.1
ev["msgIn5"] = S(59) - 0.1
ev["keyTurn"] = word(65, "schlüssel") - 0.2
ev["doorOpen"] = S(66)
ev["pageTurn"] = S(75) + 0.2
ev["lightOut"] = word(79, "aus") - 0.05
ev["flicker"] = [S(82), S(83) - 0.15]
ev["jump"] = S(83) - 0.05
ev["snap"] = word(84, "knickt") - 0.05
ev["mouth"] = word(85, "reißt") + 0.1
ev["drill"] = S(87)
ev["shriek"] = word(87, "kreischt") - 0.05
ev["jump2"] = S(89) + 0.6
ev["dial"] = [w["t"] for w in LN[91]["words"]][:3]
ev["callStart"] = S(92) - 0.3
ev["terraceDoor"] = S(97) + 0.4
ev["papasOut"] = S(98)
ev["waveAll"] = S(100)
ev["grab"] = word(106, "packt")
ev["kicks"] = [word(108, "einmal"), word(108, "zweimal")]
ev["release"] = S(109)
ev["fall"] = S(110)
ev["flash"] = S(115)
ev["retreat"] = [S(116) + 0.8, E(117)]
ev["copWalk"] = [S(118), E(118) + 0.4]
ev["garageClose"] = [S(119), E(119)]
ev["copFlicker"] = [S(120), E(120) + 0.3]
ev["copScream"] = S(121)
ev["garageLight"] = S(125)
ev["radio"] = [S(126), E(139)]
ev["sizzle"] = [S(127), E(139)]
ev["valves"] = [S(133), E(134)]
ev["throw"] = word(139, "wirfst")
ev["boom"] = word(140, "explodiert")
ev["shrieks"] = [S(142), E(142)]
ev["taxi"] = S(145)
ev["hug"] = S(148)
ev["smile"] = [S(152), E(153)]
ev["mowerOn"] = word(155, "springt")
p["ev"] = ev

json.dump(p, open(sys.argv[2], "w"), indent=1)
for s in shots:
    print(f"{s['t0']:7.2f}-{s['t1']:7.2f}  {s['set']:9s} {s['cam']}")
print("Dauer", DUR)
