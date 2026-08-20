---
name: skillcatch
awms: befehl
description: Aus echter Arbeit einen Skill machen — nimm die Prozedur, die Gaylord gerade in dieser Session durchgeführt hat, und schreibe sie als SKILL.md ins aktuelle Projekt. Nutzen, wenn Gaylord sagt „halt das als Skill fest", „mach daraus einen Skill", „extrahier das". Auf Zuruf auch: die festgehaltenen Skills zu einem Workflow verbinden.
---
# /skillcatch — Skills entstehen durchs Machen

Grundsatz: ~80 % der Skills entstehen als Nebenprodukt echter Arbeit, nicht am Reißbrett.
Gaylord arbeitet, du destillierst. Erfinde nichts dazu — halte nur fest, was WIRKLICH getan wurde.

**Kernwerkzeug für den ganzen Skill: der Kontext-Test.** Bei jeder Aussage, die nach einer
Regel aussieht, fragen:
> „Wenn der Sprecher / die Zielgruppe / das Thema / das Format anders wäre — würde das noch gelten?"

Hält sie nicht → es ist keine Regel, sondern eine kontextabhängige Entscheidung. Der häufigste
und schlimmste Fehler beim Skillbauen ist, aus einer EINMALIGEN Entscheidung eine ABSOLUTE Regel
zu machen — die schießt in den meisten anderen Kontexten ins Bein. Deshalb steckt dieser Test in
beiden Phasen unten.

## 1. Zuerst: Komplexität einstufen lassen (IMMER die erste Frage)
Die allererste Reaktion auf /skillcatch ist immer genau eine Frage an Gaylord: Wie komplex ist
die Prozedur? Er stuft selbst ein — das steuert, wie tief interviewt wird, und verhindert so
den Fragen-Marathon von vornherein:
- **Stufe 1 — einfach** („zwei Gehirnzeilen"): keine weiteren Fragen. Direkt zu Phase 3 (bauen).
- **Stufe 2 — moderat komplex:** ein kurzes Interview, einige gezielte Fragen.
- **Stufe 3 — sehr komplex:** ein längeres Interview — mehr nachfragen, mehr Reasoning, tiefer
  destillieren, bevor gebaut wird.

## 2. Das Interview (nur Stufe 2 & 3) — den Kontext-Test MIT Gaylord spielen
Das Interview hat zwei Zwecke:
- **Gaylord fordern — kritisches Denken laut ausleben.** Nimm seine Aussagen auseinander, statt
  sie zu übernehmen. Du kennst den konkreten Kontext der Session (z.B. „der Sprecher ist ein
  Moderator") — fordere ihn mit Alternativen: „Und wenn der Sprecher diesmal eine Katzenbesitzerin
  wäre — gilt Regel Y dann noch?" Wo eine Aussage bei geändertem Kontext kippt, habt ihr gemeinsam
  eine kontextabhängige Entscheidung entlarvt (→ wird zum Prinzip mit Bedingung, siehe Phase 3).
  Wo sie standhält, ist es ein echtes Prinzip.
- **Offene Verständnislücken klären.** Was du aus der Session nicht sicher weißt: Auslöser,
  Handgriffe, Ergebnis — und wo du als KI evtl. abgekürzt oder geraten hast.
Stufe 3 geht hier tiefer und länger als Stufe 2. Den Skill-NAMEN trotzdem nie erfragen — den
wählst du selbst (Phase 3).

## 3. Schreiben (jede Stufe)
- **Prinzipien destillieren, keine Regeln.** Wende beim Formulieren den Kontext-Test still auf
  jede Regel an, die du festschreiben willst. Hält sie nicht → formuliere sie als Prinzip MIT
  Bedingung: „Wenn X, dann Y — weil Z", nenne die Denk-Achse, nicht das eine Ergebnis. Halte die
  TECHNIK fest, nicht das ERGEBNIS diesmal (Beispiel: „Sprache gegen die VoC gegenchecken" ist
  die Technik — „‚zufällig' → ‚plötzlich'" war nur das Ergebnis).
- **Zur Prozedur verdichten:** Zweck (1–2 Sätze), Eingabe, Schritte (imperativ, als
  kontext-sensibles Vorgehen — keine starre Checkliste), Ausgabe. Faustregeln als Voreinstellung
  kennzeichnen, nicht als Automatismus.
- **Datei schreiben:** `.claude/skills/<name>/SKILL.md`, Name kurz-mit-bindestrichen, von dir
  gewählt. **Nimm IMMER den skill-crafter zur Hilfe** (`.claude/skills/skill-crafter/SKILL.md`):
  Er trägt die Schreibregeln (Zeitlosigkeit, Ausführbarkeit, description, Checkliste) und den
  Prüf-Ablauf. Gilt für JEDE Skill-Erstellung oder -Überarbeitung, auch außerhalb von /skillcatch.
- **Einhängen:** Gehört die Session zu einem Workflow, häng den Skill SOFORT als Knoten mit `ref`
  in dessen `workflows/<name>.json` ein — nicht fragen, einhängen. Lose Skills nur, wenn wirklich
  kein Workflow zur Session gehört.
- **Bestätigen** in EINEM Satz („Als Skill `x` festgehalten") plus WO (Datei + Workflow-Knoten).
  Kein Formular am Ende — das Fragen war Phase 1 & 2.

Format:
```
---
name: <name>
description: "<ein Satz, was der Skill tut — plus wann er triggert>"
---
# <Titel>
<Zweck · Eingabe · Schritte (kontext-sensibles Vorgehen) · Ausgabe>
```

Wenn Gaylord sagt „verbinde die Skills zum Workflow": Lege `workflows/<name>.json` an (ein
Knoten je Skill mit `ref`, `haupt`-Kanten in Reihenfolge; Trigger vorn, Gate wo Gaylord
entscheidet). Die losen Skills rücken in AWMS damit zur Kette zusammen.

Nie: Schritte erfinden, die nicht getan wurden · aus einer Einmal-Entscheidung eine absolute
Regel machen · die Komplexitäts-Frage überspringen · Status-Felder · Skills „auf Vorrat" bauen.
