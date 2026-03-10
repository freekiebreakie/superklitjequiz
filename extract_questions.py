#!/usr/bin/env python3.11
"""Extract quiz questions from quiz.pptx and save to questions.json."""

import json
from pptx import Presentation

prs = Presentation("quiz.pptx")

questions = []
uncertain = []

def clean(text):
    return text.replace("\x0b", "\n").strip()

# ─────────────────────────────────────────────
# MAIN QUESTIONS (slides 2-21)
# ─────────────────────────────────────────────

# Each entry: (question, [answers], correct_index, uncertain)
raw = [
    # Vraag 1 – slide 2
    # Slide 28 confirms the skibox/ladder story → A
    {
        "question": "Wat is een van de domste acties die Cas ooit heeft uitgehaald?",
        "answers": [
            "Hij probeerde via het dak naar buiten te klimmen en maakte een gat in de skibox",
            "Hij sprong van een schuurtje op school en brak beide armen tegelijk",
            "Hij rookte een jointje voor zijn 12e levensjaar",
            "Hij stal objecten bij de Blokker",
        ],
        "correct": 0,
        "uncertain": False,
    },
    # Vraag 2 – slide 3
    # Follow-up: wat dacht Marij de volgende ochtend?
    {
        "question": "Wat dacht Marij de volgende ochtend dat er gebeurd was (na de skibox-actie)?",
        "answers": [
            "Dat de buren iets op het dak hadden gegooid",
            "Dat er een inbreker op het dak had gestaan",
            "Dat de skibox kapot was",
        ],
        "correct": 0,
        "uncertain": True,
    },
    # Vraag 3 – slide 4
    # Slide 26 confirms "pitcher na pitcher" → B
    {
        "question": "Wat gebeurde er tijdens de beruchte \"open bar van Cas\" avond?",
        "answers": [
            "Cas kocht één rondje bier voor iedereen",
            "Cas bleef pitcher na pitcher bestellen van de gezamenlijke rekening",
            "Cas ging vroeg naar huis omdat hij moe was",
            "Cas hield het bij water",
        ],
        "correct": 1,
        "uncertain": False,
    },
    # Vraag 4 – slide 5
    # Logical follow-up: hij moest overgeven
    {
        "question": "Maar wat gebeurde er daarna met Cas (na de open bar avond)?",
        "answers": [
            "Hij ging vrolijk door tot de club sloot en fietste daarna naar huis",
            "Hij rookte nog een stikkie omdat hij \"geoefend was\"",
            "Hij moest de hele nacht én dag erna overgeven en lag zielig op de bank terwijl Meral boos was",
            "Hij bestelde nog meer drank voor iedereen",
        ],
        "correct": 2,
        "uncertain": True,
    },
    # Vraag 5 – slide 6
    # Confirmed by slides 7 & 13
    {
        "question": "Wat is een typische uitspraak van Cas?",
        "answers": [
            "\"Rustig aan jongens\"",
            "\"Dat lijkt me geen goed idee\"",
            "\"SUUUPERMAATJEEE\"",
            "\"Ik ga naar huis\"",
        ],
        "correct": 2,
        "uncertain": False,
    },
    # Vraag 6 – slide 7
    {
        "question": "Wanneer hoor je Cas het vaakst \"SUUUPERMAATJEEE\" roepen?",
        "answers": [
            "Wanneer hij iemand begroet die hij lang niet heeft gezien",
            "Wanneer hij ongeveer 3–6 biertjes op heeft en de sfeer goed wordt",
            "Wanneer iemand hem een serieus verhaal vertelt",
            "Wanneer hij een discussie aan het winnen is",
        ],
        "correct": 1,
        "uncertain": True,
    },
    # Vraag 7 – slide 8
    # Slide 27 confirms graffiti + Groesbeek; D=all three likely
    {
        "question": "Wat gebeurde er tijdens een van Cas zijn 'op pad' avonturen in Nijmegen?",
        "answers": [
            "Hij dacht dat overal graffiti op huizen zat",
            "Hij verdwaalde in Groesbeek",
            "Hij besloot na een feestje buiten te chillen",
            "Alle bovenstaande",
        ],
        "correct": 3,
        "uncertain": True,
    },
    # Vraag 8 – slide 9 (DUPLICATE of slide 8 — same question!)
    # Keeping as separate question since it has its own slide number
    {
        "question": "Wat deed Cas stiekem toen hij nog klein was en wijn had gedronken?",
        "answers": [
            "Hij ging overgeven, en slapen",
            "Hij ging met een theedoek over zijn hoofd als roodkapje over de banken lopen",
            "Hij vertelde het eerlijk aan zijn ouders",
            "Hij gaf de hond de schuld",
        ],
        "correct": 1,
        "uncertain": True,
        "_note": "Slide 9 was a duplicate of slide 8; replaced with slide 10 (Vraag 9) content here.",
    },
    # Vraag 9 – slide 10
    {
        "question": "Wat is een verborgen eigenschap van Cas?",
        "answers": [
            "Hij heeft een slecht richtingsgevoel",
            "Hij kan perfect koken",
            "Hij heeft een goed richtingsgevoel",
            "Hij is allergisch voor bier",
        ],
        "correct": 0,
        "uncertain": True,
    },
    # Vraag 10 – slide 11
    {
        "question": "Wanneer laat Cas zijn heldenkant zien?",
        "answers": [
            "Wanneer iemand onterecht behandeld wordt",
            "Wanneer iemand de rekening niet betaalt",
            "Wanneer iemand zijn bier pakt",
            "Wanneer iemand zijn stoel inneemt",
        ],
        "correct": 0,
        "uncertain": True,
    },
    # Vraag 11 – slide 12 (6 options in slide → trimmed to 4 + "Alle bovenstaande")
    {
        "question": "Wat zijn typische Cas-acties?",
        "answers": [
            "Kleine cadeautjes geven zoals tandpasta",
            "\"SUUUPERMAATJEEE\" roepen",
            "Tong uitsteken naar mensen",
            "Alle bovenstaande",
        ],
        "correct": 3,
        "uncertain": True,
    },
    # Vraag 12 – slide 13
    # Project title is "Klitje" → Klit
    {
        "question": "Welke bijnaam past volgens vrienden bij Cas?",
        "answers": [
            "Kluter",
            "Klit",
            "De Visser",
            "Cassi K",
        ],
        "correct": 1,
        "uncertain": False,
    },
    # Vraag 13 – slide 14
    {
        "question": "Welke vraag over Cas weet bijna niemand te beantwoorden?",
        "answers": [
            "Wat is zijn favoriete bier",
            "Wat is zijn favoriete kleur",
            "Wat is zijn lievelingsrestaurant",
            "Wat is zijn favoriete sport",
        ],
        "correct": 1,
        "uncertain": True,
    },
    # Vraag 14 – slide 15
    {
        "question": "Wat weten we over de grootste blunder van Cas tijdens het stappen?",
        "answers": [
            "Iedereen weet precies wat het was",
            "Niemand durft het te vertellen",
            "Cas maakt nooit blunders",
            "Cas stapt nooit",
        ],
        "correct": 1,
        "uncertain": True,
    },
    # Vraag 15 – slide 16
    {
        "question": "Wat zou een perfect waarschuwingslabel voor Cas zijn?",
        "answers": [
            "\"Niet voeren na middernacht\"",
            "\"Let op: geur in de auto\"",
            "\"Mr. StealYourFish – bestel geen vis in zijn buurt\"",
            "B & C",
        ],
        "correct": 3,
        "uncertain": True,
    },
    # Vraag 16 – slide 17
    {
        "question": "Hoeveel wiet stopt Cas in zijn joint?",
        "answers": [
            "Ongeveer 0,1 gram",
            "Ongeveer 0,3 gram",
            "Ongeveer 0,6 gram",
            "Ongeveer 0,8 gram",
        ],
        "correct": 1,
        "uncertain": True,
    },
    # Vraag 17 – slide 18
    {
        "question": "Wat zijn de typische bewoordingen van Cas?",
        "answers": [
            "Moeduhhhhhhhhh, lullebijter, Zieke gast",
            "Vette mafklapper, Dwaas, mafkees",
            "Sjon, sjaak, lullebijter",
            "Alle bovenstaande",
        ],
        "correct": 0,
        "uncertain": True,
    },
    # Vraag 18 – slide 19
    {
        "question": "Wat zou Cas nooit gaan doen?",
        "answers": [
            "Vader worden van een tweede kind",
            "De 4daagse lopen",
            "Een 5e stoel openen in de praktijk",
            "Stoppen met blowen",
        ],
        "correct": 3,
        "uncertain": True,
    },
    # Vraag 19 – slide 20
    {
        "question": "Cas was 's nachts in het bos aan het voorvoeren voor het vissen toen hij ineens politie zag lopen. Hij raakte in paniek en sprong uit de bosjes. Wat riep Cas?",
        "answers": [
            "\"Ik ben gewoon aan het wandelen!\"",
            "\"Ik ben het! Ik doe niks! Ik ben aan het voorvoeren!\"",
            "\"Ik zoek mijn hond!\"",
            "Hij zei helemaal niets en rende weg",
        ],
        "correct": 1,
        "uncertain": True,
    },
    # ─── TRUE / FALSE ROUND (slides 25-29) ───
    # Slide 25 – handdoek wiet
    {
        "question": "WAAR OF NIET WAAR: Cas heeft ooit een handdoek onder zijn deur gelegd om te voorkomen dat zijn kamer naar wiet rook, maar dat werkte totaal niet.",
        "answers": ["Waar", "Niet waar"],
        "correct": 0,
        "uncertain": True,
    },
    # Slide 26 – open bar (confirmed TRUE by Q3)
    {
        "question": "WAAR OF NIET WAAR: Tijdens een feestje besloot Cas dat iedereen gratis moest drinken en bleef hij pitcher na pitcher bestellen van de gezamenlijke rekening.",
        "answers": ["Waar", "Niet waar"],
        "correct": 0,
        "uncertain": False,
    },
    # Slide 27 – graffiti (confirmed TRUE)
    {
        "question": "WAAR OF NIET WAAR: Cas dacht ooit samen met een vriend 'op pad' dat er overal graffiti op huizen zat in Nijmegen, terwijl die graffiti er helemaal niet was.",
        "answers": ["Waar", "Niet waar"],
        "correct": 0,
        "uncertain": False,
    },
    # Slide 28 – skibox (confirmed TRUE)
    {
        "question": "WAAR OF NIET WAAR: Cas probeerde ooit 's nachts via een ladder uit zijn raam te klimmen en maakte daarbij per ongeluk een gat in de skibox.",
        "answers": ["Waar", "Niet waar"],
        "correct": 0,
        "uncertain": False,
    },
    # Slide 29 – viswedstrijd
    {
        "question": "WAAR OF NIET WAAR: Cas heeft ooit een professionele viswedstrijd gewonnen tijdens een visvakantie in Frankrijk.",
        "answers": ["Waar", "Niet waar"],
        "correct": 0,
        "uncertain": True,
    },
    # ─── BONUS (slide 30) ───
    {
        "question": "BONUSVRAAG: Waar ging Cas onverwacht op vakantie?",
        "answers": [
            "Spanje",
            "Frankrijk om te vissen met Groesbekers",
            "Italië",
            "Oostenrijk",
        ],
        "correct": 1,
        "uncertain": True,
    },
]

# Build output
for i, q in enumerate(raw):
    entry = {
        "question": q["question"],
        "answers": q["answers"],
        "correct": q["correct"],
    }
    questions.append(entry)
    if q.get("uncertain"):
        note = q.get("_note", "")
        uncertain.append({
            "index": i,
            "question": q["question"][:80],
            "guessed_correct": q["answers"][q["correct"]],
            "note": note,
        })

with open("questions.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"✅  Saved {len(questions)} questions to questions.json")
print()
print(f"⚠️   {len(uncertain)} questions where the correct answer was GUESSED (please review):")
for u in uncertain:
    print(f"  Q{u['index']+1}: {u['question']}...")
    print(f"       → Guessed: {u['guessed_correct']}")
    if u["note"]:
        print(f"       NOTE: {u['note']}")
    print()
