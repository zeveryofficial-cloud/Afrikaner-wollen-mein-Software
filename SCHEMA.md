# AWMS-Schema — die Baustein-Konventionen

AWMS scannt registrierte Projekt-Ordner (`projekte.json`) nach diesen Bausteinen.
Was diesen Formaten folgt, erscheint im Graph. **Dateien sind die Wahrheit.**

## Skill — `.claude/skills/<name>/SKILL.md`
```
---
name: <name>                ← exakt der Ordnername
description: "<ein Satz, was der Skill tut>"
---
# <Titel>
<Prozedur: Zweck, Eingabe, nummerierte Schritte, Ausgabe>
```
Skills mit `awms: system` im Frontmatter sind Werkzeuge des Tools selbst
(z.B. `/entwurf`, `/festhalten`) und erscheinen nicht als Business-Bausteine.

## Datenbank — `datenbanken/<name>/DATENBANK.md` (Vertragskarte)
```
---
name: <name>
typ: <Art der Datenbank — z.B. Tabelle (CSV) · Vektor · Datei-Sammlung>
zweck: <wozu sie da ist>
schreibt: <wer reinschreibt>
liest: <wer rausliest>
format: <wie Einträge aussehen, z.B. eintraege/ — eine MD-Datei pro Quelle>
---
<optionaler Hinweis>
```
Die Einträge selbst liegen daneben (z.B. `eintraege/*.md`, `daten.csv`). Auch der
Abfrage-Code einer Datenbank lebt IM Baustein (z.B. `voc-search.ts` neben der DB) —
eine Abfrage-Schnittstelle ist kein eigenes Tool.
**Arten:** Der Graph erkennt die Art am `typ` und rendert sie unterschiedlich —
beginnt `typ` mit „Vektor", bekommt der Baustein das Vektor-Design (gleiche Farbe,
eigener Look). Weitere Arten folgen nach Bedarf.

## Tool — `tools/<name>/README.md`
Erste Zeile `# <name>`, danach was das Tool tut (bzw. täte, wenn Platzhalter).
Tools erweitern die Fähigkeiten der KI (Scraper, MCP & Co.) — die KI bedient sie.

## Software — `software/<name>/README.md` (kein Baustein!)
```
---
url: http://localhost:5005      ← wo sie läuft; der Öffnen-Klick im UI führt dorthin
start: <wie man sie startet>    ← optional
---
# <Titel>
<was die Software tut und wie der Mensch sie bedient>
```
Software ist das Gegenstück zu Tools: Sie wird vom MENSCHEN bedient (Web-Apps, lokale
Programme). Eigene Seitenleisten-Sektion „Mensch bedient", zählt nicht zu den Bausteinen.
Ob sie gerade läuft, wird live am Port berechnet — nie gepflegt. Im Workflow-Graph
markiert ein `software`-Knoten die Stelle der Kette, an der der Mensch arbeitet.

**Agentik-Karte (optional):** `software/<name>/agentik.json` — das Innenleben einer
KI-getriebenen Software: der Harness um die LLM-Blackbox, reiner Code bleibt draußen.
Eine Software hat MEHRERE interne Workflows mit je eigenem Trigger („Cartoon-Ad anlegen
ist ein anderer Trigger als B-Roll-Ad") — deshalb: `"workflows": [{ name, beschreibung,
knoten, kanten }, …]`; im Graph wechselt die Tab-Pille oben zwischen ihnen. Geteilte
Bausteine (gleiche id, z.B. „Gemini API") stehen in jedem Workflow, der sie nutzt.
Das Vokabular ist die Workflow-Unterteilung, auf Software übertragen:
- `agent` = KI-Agent (Chip mit Funke): Stelle im Code, an der ein LLM entscheidet;
  `sub` nennt das Modell (z.B. „Gemini Pro"). Sein Panel zeigt den Ablauf berechnet
  aus den Kanten: 1. Skill lesen · 2. Kontext holen · 3. übers Tool prompten · 4. ablegen.
- `wissen` = das Skill-Äquivalent: die Prompt-/MD-Datei, die der Agent liest
  (liest-Kante). Per Chat änderbar — Verhalten ändern ohne Code.
- `tool` = das Tool-Äquivalent (Stecker-Icon): gibt der Software Fähigkeiten, die
  reiner Code nicht hat. Der NAME nennt die Art („Gemini API", „Higgsfield CLI · Bild").
  Geteilte Tools stehen in der DATEI einmal, angebunden per `nutzt`-Kanten — der Graph
  zeichnet den Anruf aber LOKAL: je Agent ein eigener Anruf-Baustein direkt über ihm,
  mit Hin (prompt) und Zurück (antwort). Kein Spinnennetz zu einem Sammel-Knoten.
  Datenbanken sind die Ausnahme: immer EIN Knoten mit echten Fluss-Kanten.
- `datenbank` = Speicher · `gate` = Homo Sapiens (Auge — „am Kochen") ·
  `trigger` = Start. Kanten: `haupt` · `liest` · `schreibt` · `nutzt`.
Die Karte schreibt die KI, indem sie den ECHTEN Code der Software abliest (`stand`
sagt wann) — AWMS rendert sie nur. Existiert sie, öffnet der Karten-Klick den Graph.
**Konzept-Bausteine (`"geplant": true`):** Ein Knoten, dessen Verhalten im Code NOCH
NICHT gebaut ist — nur gezeichnet, als Ziel. Rendert gestrichelt/blass wie ein
Workflow-Geist (Kanten an ihm faden mit), der Header zählt sie („N geplant"). So bleibt
die Karte ehrlich, auch wenn Ist-Zustand und geplanter Umbau nebeneinander stehen: volle
Knoten = läuft schon, blasse = nur Idee. Ist der Code gebaut, streicht die KI das Flag.
Konzept gilt nur für ADDITIVES (hinten dran, Zwischenschritt) — für Ersatz siehe Ebenen.
**Ebenen — Konzept vs. experimentelle Idee (Viktors Unterscheidung):** Eine
EXPERIMENTELLE IDEE ersetzt Gebautes, statt nur zu ergänzen — Ersatz und Original dürfen
nie zusammen in einer Kette stehen (als Ablauf gelesen: Unsinn). Darum je Workflow
optional: `"experiment": { "name": "...", "ersetzt": ["<knoten-id>", …] }` plus
`"idee": true` an den Ersatz-Knoten. Der Graph zeigt dann rechts oben den
Ebenen-Umschalter „Aktuell ⇄ Idee": Aktuell blendet die idee-Knoten aus, Idee blendet
die ersetzten aus — immer nur EINE stimmige Kette. Die Datei bleibt die eine Wahrheit
(nichts dupliziert); wird die Idee gebaut, fliegen ersetzte Knoten + Flags raus.

## Workflow — `workflows/<name>.json`
```json
{
  "name": "beispiel", "beschreibung": "Was die Kette leistet.", "tags": ["beispiel"],
  "knoten": [
    { "id": "start", "typ": "trigger",   "name": "Start",   "beschreibung": "…", "nutzung": "im Chat: „los“" },
    { "id": "x",     "typ": "skill",     "name": "X",       "ref": ".claude/skills/x", "beschreibung": "Rolle in der Kette" },
    { "id": "ok",    "typ": "gate",      "name": "Abnahme", "beschreibung": "Mensch entscheidet.", "nutzung": "im Chat: „freigegeben“" },
    { "id": "db",    "typ": "datenbank", "name": "Ablage",  "ref": "datenbanken/ablage" }
  ],
  "kanten": [
    { "von": "start", "nach": "x",  "typ": "haupt" },
    { "von": "db",    "nach": "x",  "typ": "liest" },
    { "von": "x",     "nach": "db", "typ": "schreibt" }
  ]
}
```

## Regeln
- `typ` je Knoten: `trigger` · `skill` · `tool` · `software` · `datenbank` · `gate`. `ref` zeigt
  auf den Baustein-Ordner IM SELBEN Projekt; Trigger und Gates leben nur in der Workflow-Datei.
- Kanten: `haupt` (Arbeitsfluss) · `liest` (Datenbank→Knoten) · `schreibt` (Knoten→Datenbank).
  Verzweigungen sind erlaubt (mehrere haupt-Kanten von einem Knoten, Zweige dürfen wieder
  zusammenlaufen). Kreise über Datenbanken sind erwünscht.
- KEINE Positionen, KEIN Status, KEINE Icons in den Dateien — der Graph berechnet alles
  (Layout, Logos je Typ, „zuletzt geändert" aus mtime, Lose-Skills-Regal aus fehlenden Referenzen).
- Einzige Entscheidungs-Markierung: `"spaeter": true` an einem (Geister-)Knoten = bewusst
  zurückgestellt. Viktor sagt es im Chat, die KI schreibt es (Skill `/spaeter`). Der Knoten
  verschwindet aus der Kette (sie zeigt nur das Jetzt) und liegt als loser gelber Zettel
  auf der Fläche (verschiebbar, nur Optik) — Klick zeigt die Zukunfts-Skizze. Zählt nicht
  als offene Arbeit, Läufe überspringen ihn.
