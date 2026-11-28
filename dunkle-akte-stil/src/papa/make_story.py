"""Erzeugt story.json aus dem Klartext unten.
Zeilenformat:  [tag] [@stimme] [>] Text mit *rotem* Wort
  >  = Dialog/Handy (Untertitel in „…“)
  @papa / @monster / @lea / @notruf = andere Stimme
Leere Zeile = längere Pause.
"""
import json, re, sys, os

VOICES = {
    "papa":    {"voice": "de-AT-JonasNeural",   "rate": "+0%",  "pitch": "-4Hz"},
    "monster": {"voice": "de-AT-JonasNeural",   "rate": "-14%", "pitch": "-20Hz"},
    "lea":     {"voice": "de-DE-TanjaNeural",   "rate": "+4%",  "pitch": "+38Hz"},
    "notruf":  {"voice": "de-AT-IngridNeural",  "rate": "+4%",  "pitch": "+0Hz"},
    "polizei": {"voice": "de-CH-JanNeural",     "rate": "+0%",  "pitch": "-4Hz"},
}

TEXT = r"""
hook Es ist *drei* Uhr nachts.
hook Draußen mäht jemand den *Rasen.*
hook Du schaust aus dem Fenster.
hook Es ist *Papa.*
hook Er trägt seine Grillschürze. Und Socken in Sandalen.
hook Er winkt dir zu.
hook Aber Papa ist auf *Montage.*
hook In *Hamburg.* Seit Montag.

phone1 Dein Handy *vibriert.*
phone1 Eine Nachricht. Von Papa.
msg1 @papa > Kann nicht *schlafen.* Alles gut bei euch?
phone1 Du tippst: „Du mähst doch gerade den Rasen.“
phone1 Drei Punkte. Sie *verschwinden.* Sie kommen wieder.
msg2 @papa > Unser Rasenmäher ist seit Sommer *kaputt.*
msg2 @papa > Mach *nicht* die Tür auf.
msg2 @papa > Frag ihn, wie unser *Hund* hieß.

test Der Rasenmäher geht *aus.*
test Stille.
test Du öffnest das Fenster einen *Spalt.*
test „Papa? Wie hieß unser Hund?“
test Er lacht. Genau wie Papa. Erst *über* sich selbst.
test1 @monster > *Keks,* Kumpel. Er hieß Keks.
test Das *stimmt.*
test Dann dreht er sich um.
test Und sein Hals *wächst.*
test Über die Hecke. Über den Zaun.
test Bis sein Kopf vor dem Fenster im ersten *Stock* hängt.
test1 @monster > Machst du Papa *auf,* Kumpel?

flight Du knallst das Fenster *zu.*
flight Du rennst zu Lea. Deine kleine *Schwester.*
flight Sie schläft. Du hältst ihr den *Mund* zu.
flight Unten geht der *Fernseher* an.
flight Ihr schleicht zur Treppe.
flight Auf dem Sofa liegt jemand. Fernbedienung in der Hand.
flight Er *schnarcht.*
flight Es ist Papa. *Wieder.*
flight Das Schnarchen hört *auf.*
sofa @monster > Ich schlafe nicht. Ich ruhe nur die *Augen* aus.
flight Seine Augen gehen auf. Sie sind *schwarz.*
flight Ganz schwarz.
flight Ihr rennt in die *Abstellkammer.*
flight Du schließt ab. Ihr atmet *nicht.*
flight Schritte im Flur. Langsam.
flight Dann nichts mehr.
flight Dann eine Stimme. Direkt vor der Tür.
count @monster > Ich zähle bis *drei.*
count @monster > Eins.
count @monster > Zwei.
count @monster > Zweieinhalb.
flight Genau wie Papa. Er kommt nie bis *drei.*
flight Die Klinke bewegt sich. Ganz *langsam.*
flight Dann lässt sie los.
flight Lea zittert. Du hältst sie fest.

voice Dein Handy leuchtet. Eine *Sprachnachricht.*
voicemsg @papa > Hör mir zu. Ich sitze im *Auto.* Ich komme.
voice Aber im Hintergrund hörst du etwas.
voice Einen *Rasenmäher.*
voice Wer schreibt dir da wirklich?
voice Du schreibst zurück: „Beweis, dass du es bist.“
msg3 @papa > Du hast Angst vor dem *Keller.* Seit du vier bist.
voice Das weiß *niemand.*
voice Außer Papa.
voice Oder etwas, das ihn sehr lange *beobachtet* hat.

betray Lea zieht an deinem Ärmel.
betrayl @lea > Papa hat gesagt, ich soll *aufmachen.*
betray Bevor du sie halten kannst, dreht sie den *Schlüssel.*
betray Die Tür geht auf.
betray In der Küche brennt Licht.
betray Am Tisch sitzt der *dritte* Papa.
betray Er liest Zeitung. *Kopfüber.*
betray Neben ihm blubbert die Kaffeemaschine.
betray Er schaut nicht auf.
kitchen @monster > Wer hat im Flur das Licht *angelassen?*
kitchen @monster > Strom kostet *Geld,* Kumpel.
betray Deine Stimme zittert. „Wo ist *Mama?*“
betray Er blättert um.
kitchen @monster > Frag deine *Mutter.*
betray Das sagt Papa immer.
betray Aber Mama ist bei Oma. Seit *drei* Tagen.
betray Das Licht geht *aus.*

shock Stromausfall.
shock Stille.
shock Dann flackert die Lampe.
shock Er steht direkt vor dir.
shock Sein Kopf *knickt* zur Seite.
shock Sein Mund reißt *auf.* Viel zu weit.
shock Du packst Papas *Bohrmaschine* vom Regal.
shock Sie heult auf. Er *kreischt.*
shock Du ziehst Lea zum Küchenfenster.
shock Ihr springt in den *Garten.*

help Nasses Gras. Barfuß. Du *wählst.*
help Eins. Eins. *Zwei.*
call @notruf > Notruf. Wo ist der *Notfall?*
help „Bei uns im Garten. Mein Papa. Er ist *dreimal* da.“
call @notruf > Bleib am Telefon. Ein Streifenwagen ist *unterwegs.*
call @notruf > Ist jemand verletzt?
help „Noch *nicht.*“
help Hinter euch geht die Terrassentür auf.
help Drei Papas kommen heraus.
help Gleiche Schürze. Gleiche Sandalen. Gleiches *Lächeln.*
help Sie winken. Alle *gleichzeitig.*
call2 @monster > Kommt rein, Kinder. Es gibt *Würstchen.*
help Ihr rennt zum Gartentor.
help Es ist *abgeschlossen.*
help Papa schließt es jeden Abend ab. Wegen der *Einbrecher.*
help Du kletterst hoch. Du ziehst Lea nach.
help Etwas packt deinen *Knöchel.*
help Eine Hand. Mit Papas *Ehering.*
help Du trittst zu. Einmal. Zweimal.
help Die Hand lässt los.
help Ihr fallt auf den Gehweg.
help Blaulicht an der Straße.
help Ein Polizist steigt aus. Taschenlampe in der Hand.
cop @polizei > Seid ihr die Kinder, die angerufen haben? Wo sind eure *Eltern?*
help Du zeigst nur in den Garten.
help Der Lichtkegel trifft die drei *Papas.*
help Sie bleiben stehen. Dann gehen sie *rückwärts.*
help Zurück ins Dunkel. Zurück in die *Garage.*
help Der Polizist geht hinterher.
help Das Garagentor schließt sich.
help Seine Taschenlampe *flackert.*
help Dann ein Schrei.
help Dann *nichts.*

final Das Funkgerät im Streifenwagen rauscht.
final Du schaust zur Garage.
final Drinnen geht das Licht an.
final Du hörst Papas Lieblingslied. Aus dem alten *Radio.*
final Und ein Zischen. Wie Würstchen auf dem Rost.
final Sie *grillen.* Mitten in der Nacht.
final Jemand ruft: „Essen ist *fertig!*“
final Und du weißt, was da drin steht.
final Papas *Grill.* Und vier Gasflaschen.
final Papa hat immer gesagt: „Fass die Gasflaschen *nie* an.“
final Du drehst alle Ventile auf.
final Es *zischt.*
final Durch den Spalt unter dem Tor siehst du Füße. Socken in Sandalen.
final Ganz viele.
final Du nimmst den Grillanzünder.
final Lea hält sich die *Ohren* zu.
final Du wirfst ihn unters Tor.
boom Die Garage *explodiert.*
final Flammen schießen in den Himmel.
final Drinnen kreischt etwas. Mit vielen *Stimmen.*
final Dann wird es still.
final Nur das Feuer *knistert.*

end Am Morgen hält ein Taxi vor dem Haus.
end Papa steigt aus. Der *echte.*
end Er sieht die Garage. Er sieht euch.
end Er hält euch ganz fest.
endp @papa > Es ist *vorbei,* Kumpel.
end Lea schaut ihn lange an.
endl @lea > Papa? Wie hieß unser *Hund?*
end Papa lächelt.
end Ein bisschen zu *lange.*
endp @papa > *Keks.*
end Und hinter dem Haus springt ein Rasenmäher *an.*
"""

def chunkify(text):
    # Satzweise teilen, jeder Satz in möglichst gleich große Blöcke à 1–3 Wörter,
    # max. ein rotes Wort pro Block
    sents, cur = [], []
    for w in text.split():
        cur.append(w)
        if re.search(r"[.!?:]\W*$", w):
            sents.append(cur); cur = []
    if cur: sents.append(cur)
    out = []
    for se in sents:
        n = len(se); g = -(-n // 3); base, extra = divmod(n, g)
        sizes = [base + (1 if i < extra else 0) for i in range(g)]
        i = 0
        for sz in sizes:
            blk = se[i:i + sz]; i += sz
            reds = [k for k, x in enumerate(blk) if "*" in x]
            if len(reds) > 1:
                out.append(blk[:reds[1]]); out.append(blk[reds[1]:])
            else:
                out.append(blk)
    return [" ".join(c).upper() for c in out]

lines = []
for raw in TEXT.strip("\n").split("\n"):
    if not raw.strip():
        if lines: lines[-1]["gap_after"] = 0.7
        continue
    tag, rest = raw.split(" ", 1)
    v = None
    if rest.startswith("@"):
        v, rest = rest[1:].split(" ", 1)
    quote = rest.startswith("> ")
    if quote: rest = rest[2:]
    plain = rest.replace("*", "")
    chunks = chunkify(rest)
    if quote:
        chunks[0] = "„" + chunks[0]; chunks[-1] = chunks[-1] + "“"
    ln = {"text": plain, "chunks": chunks, "gap_after": 0.32, "tag": tag}
    if quote: ln["quote"] = True
    if v: ln.update(VOICES[v]); ln["speaker"] = v
    lines.append(ln)

story = {"title": "Papa ist nicht Papa", "voice": "de-DE-ChristophNeural", "rate": "+5%", "pitch": "-5Hz",
         "lead_in": 0.25, "lines": lines}
here = os.path.dirname(os.path.abspath(__file__))
json.dump(story, open(os.path.join(here, "story.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
n = sum(len(l["text"].split()) for l in lines)
print("Zeilen:", len(lines), "Wörter:", n, "≈ Minuten:", round(n / 137, 2))
