---
name: festhalten
awms: system
description: Aus echter Arbeit einen Skill machen — nimm die Prozedur, die Gaylord gerade in dieser Session durchgeführt hat, und schreibe sie als SKILL.md ins aktuelle Projekt. Nutzen, wenn Gaylord sagt „halt das als Skill fest", „mach daraus einen Skill", „extrahier das". Auf Zuruf auch: die festgehaltenen Skills zu einem Workflow verbinden.
---
# /festhalten — Skills entstehen durchs Machen

Grundsatz: ~80 % der Skills entstehen als Nebenprodukt echter Arbeit, nicht am Reißbrett.
Gaylord arbeitet, du destillierst. Erfinde nichts dazu — halte nur fest, was WIRKLICH getan wurde.

1. Schau auf das, was ihr gerade in dieser Session getan habt (die letzte abgeschlossene Teilaufgabe).
2. Verdichte es zu EINER wiederholbaren Prozedur: Zweck (1–2 Sätze), Eingabe, nummerierte
   Schritte (imperativ), Ausgabe.
3. Schreibe sie als `.claude/skills/<name>/SKILL.md` ins aktuelle Projekt (Format unten),
   Name kurz-mit-bindestrichen. Den Namen wählst DU — aus der Aufgabe abgeleitet, sofort
   verständlich für Gaylord; nie nach einem Namen fragen. **Nimm dabei IMMER den skill-creator zur Hilfe**
   (`.claude/skills/skill-creator/SKILL.md`, Anthropics Skill-Handwerkszeug): seine
   Richtlinien für Aufbau und besonders für die description, damit der Skill zuverlässig
   anspringt. Das gilt für JEDE Skill-Erstellung oder -Überarbeitung, auch außerhalb
   von /festhalten.
4. Gehört die Session zu einem Workflow, hänge den neuen Skill SOFORT als Knoten mit
   `ref` in dessen `workflows/<name>.json` ein — nicht fragen, einhängen. Lose Skills
   nur, wenn wirklich kein Workflow zur Session gehört.
5. Bestätige in EINEM Satz („Als Skill `x` festgehalten") — kein Formular, keine Rückfrage-Kette.

Format:
```
---
name: <name>
description: "<ein Satz, was der Skill tut>"
---
# <Titel>
<Zweck · Eingabe · nummerierte Schritte · Ausgabe>
```

Wenn Gaylord sagt „verbinde die Skills zum Workflow": Lege `workflows/<name>.json` an (ein
Knoten je Skill mit `ref`, `haupt`-Kanten in Reihenfolge; Trigger vorn, Gate wo Gaylord
entscheidet). Die losen Skills rücken in AWMS damit zur Kette zusammen.

Nie: Schritte erfinden, die nicht getan wurden · Status-Felder · Skills „auf Vorrat" bauen.
