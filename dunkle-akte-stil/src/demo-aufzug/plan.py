"""Berechnet alle Ereignis-Zeitpunkte (Schnitte, Effekte, Sounds) aus timeline.json.

Szene (aufzug.js) und Ton (sfx.py) lesen beide plan.json -> Bild und Ton bleiben synchron.
Aufruf: python3 plan.py build/timeline.json build/plan.json
"""
import json
import sys

tl = json.load(open(sys.argv[1], encoding="utf-8"))
L = {ln["tag"]: ln for ln in tl["lines"]}


def word(tag, needle):
    for w in L[tag]["words"]:
        if needle.lower() in w["w"].lower():
            return w["t"]
    raise KeyError(needle)


DUR = 10.0
p = {"duration": DUR, "fps": 30}

# Schnitte (Szenen) – immer kurz vor dem Satz, der dazu gehoert
p["shotA"] = [0.0, L["twist"]["start"] - 0.06]                     # Aufzug innen, Knopf 12
p["shotB"] = [p["shotA"][1], L["phone"]["start"] - 0.08]           # Stockwerksanzeige
p["shotC"] = [p["shotB"][1], L["doors"]["start"] - 0.10]           # Handy in den Haenden
p["shotD"] = [p["shotC"][1], 9.64]                                 # Tueren / Flur / Gestalt
p["black"] = [9.64, DUR]

# Aufzug
p["press"] = 0.72                                                  # Finger trifft Knopf 12
p["moveStart"] = 0.95
p["floor10"] = p["shotB"][0]
p["floor11"] = p["shotB"][0] + 0.30
p["floor12"] = p["shotB"][0] + 0.60
p["floor13"] = word("twist", "dreizehn") - 0.02                    # Anzeige springt genau auf das Wort
p["stop"] = L["twist"]["end"] + 0.04
p["ding"] = L["twist"]["end"] + 0.10

# Handy
p["buzz1"] = L["phone"]["start"] - 0.06
p["notif1"] = L["phone"]["start"] - 0.02
p["buzz2"] = L["message"]["end"] - 0.20
p["notif2"] = L["message"]["end"] - 0.18

# Tueren + Schock
p["doorsOpen"] = [L["doors"]["start"] + 0.30, L["doors"]["start"] + 1.30]
p["flicker"] = [p["doorsOpen"][0] + 0.25, 8.72]
p["blackout"] = [8.72, 8.95]
p["jump"] = 8.95           # Licht an: Gestalt steht direkt vor dem Aufzug
p["snap"] = 9.28           # Kopf knickt weg, Mund reisst auf, Schrei
p["scream"] = [9.28, 9.64]

json.dump(p, open(sys.argv[2], "w"), indent=1)
for k, v in p.items():
    print(f"{k:10s} {v}")
