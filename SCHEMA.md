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
Skills mit `awms: befehl` oder `awms: system` im Frontmatter sind Werkzeuge des
Tools selbst (z.B. `/feedback`, `execute`) und erscheinen nicht als Business-Bausteine.

## Datenbank — `datenbanken/<name>/DATENBANK.md` (Vertragskarte)
```
---
name: <name>
typ: <Art der Datenbank — z.B. CSV (Tabelle) · Vektor · Wiki (Karpathy-Methode) · Datei-Sammlung>
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
beginnt `typ` mit „Vektor", bekommt der Baustein das Vektor-Design; beginnt er mit
„Wiki", das Wiki-Design; beginnt er mit „CSV", das Tabellen-Design (gleiche Farbe,
je eigener Look). Weitere Arten nach Bedarf.
**Wiki-Datenbank** (Karpathys LLM-Wiki-Methode): zweischichtig — `raw/` (Quellen,
append-only, wird NIE editiert) + `wiki/` (von der KI kompilierte, verlinkte Seiten
mit `index.md` als Katalog) + `log.md` (append-only Chronik jeder Berührung).
Das Betriebssystem der Wiki-DB ist ihre DATENBANK.md: Sie enthält die Betriebsregeln
(Einatmen, Lesen über den Index, Rückfluss, Lint-Rhythmus), und **jede KI-Session,
die eine Wiki-DB liest oder schreibt, liest ZUERST deren DATENBANK.md und folgt ihr** —
so ist die Pflege in die Nutzung eingebaut statt ein eigenes Ritual (analog zum
Embedding-Code, der IM Vektor-Baustein lebt).
**CSV-Datenbank** (Tabelle): eine Zeile pro Ding, feste Spalten — für viele
gleichartige Einträge, die eine KI später vergleichen und auf Muster auswerten soll.
Die Datenbank SPEICHERT nur; ausgewertet wird von außen, von wem auch immer sie liest.
Aufbau: `daten.csv` (Kopfzeile = Spaltennamen) + Spalten-Schema in der DATENBANK.md
(je Spalte Art und bei Kategorien die Werteliste) + `eintraege/<id>/` (Langtexte/
Assets, die Zelle hält den Pfad) + `log.md` (Chronik). Ihr Betriebssystem ist
Schema-Disziplin: Zeilen folgen dem Spalten-Vertrag, Kategorie-Werte exakt aus der
Werteliste, leere Zellen bleiben leer (nie erfinden), Zeilen dürfen später ergänzt
werden (z.B. Ergebnisse) — Prüfung per `datenbanken/csv-check.py <pfad-zur-db>`.

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
**Ebenen — Konzept vs. experimentelle Idee (Gaylords Unterscheidung):** Eine
EXPERIMENTELLE IDEE ersetzt Gebautes, statt nur zu ergänzen — Ersatz und Original dürfen
nie zusammen in einer Kette stehen (als Ablauf gelesen: Unsinn). Darum je Workflow
optional: `"experiment": { "name": "...", "ersetzt": ["<knoten-id>", …] }` plus
`"idee": true` an den Ersatz-Knoten. Der Graph zeigt dann rechts oben den
Ebenen-Umschalter „Aktuell ⇄ Idee": Aktuell blendet die idee-Knoten aus, Idee blendet
die ersetzten aus — immer nur EINE stimmige Kette. Die Datei bleibt die eine Wahrheit
(nichts dupliziert); wird die Idee gebaut, fliegen ersetzte Knoten + Flags raus.

**Lauf-Zeiger — `"lauf": { basis, zeiger }` in der Agentik-Karte:** `basis` ist der
Projekte-Ordner, `zeiger` eine JSON-Datei (`_lauf.json`), die sagt, welches Projekt in
welchem Workflow GERADE läuft: `{ "projekt", "workflow", "gestartet" }`. Nur dann
berechnet der Graph Lauf-Status (Häkchen/läuft/Alarm) aus Artefakten + `_run/log.jsonl`.
**Ein Lauf ENDET, indem der Ausführende `"beendet": "<datum>"` (+ optional `"ergebnis"`)
in die Zeiger-Datei schreibt — Pflicht, sobald das letzte Werkstück geliefert ist**
(Gaylords Ansage 17.07.2026: nach getaner Arbeit aufräumen, keine ewigen Häkchen). Mit
`beendet` zeigt der Graph KEINEN Status und KEINEN Alarm mehr; der nächste Lauf
überschreibt die Datei frisch (ohne `beendet`). Die Historie liegt in `_run/log.jsonl`
des Projekts, nicht im Graph.

## Agent — `agenten/<name>.json`
Die Rollen des Unternehmens (Gaylords Protein-Bild: Bausteine = Aminosäuren, Workflows =
Ketten, Agenten = gefaltete Proteine). Ein Agent bündelt einen Aufgabenbereich wie ein
eingestellter Mitarbeiter („Native Copywriter"): Er kettet **Workflows als Bausteine**
UND direkt Skills/Tools/Datenbanken — zwischen zwei Workflows dürfen einzelne Bausteine
stehen. Schema = exakt das Workflow-Schema, mit EINEM zusätzlichen Knotentyp:
```json
{ "id": "avatar", "typ": "workflow", "name": "Avatar-Research", "ref": "workflows/avatar-research.json" }
```
- `ref` zeigt auf die Workflow-DATEI (nicht auf einen Ordner). Fehlt sie oder fehlt
  `ref`, ist der Knoten ein Geist („geplant") — wie überall.
- **Eine Ebene, keine Rekursion:** `workflow`-Knoten gibt es NUR in Agent-Dateien,
  nie in Workflow-Dateien. Keine Agenten in Agenten.
- Ein Workflow darf von beliebig vielen Agenten referenziert werden (Zugehörigkeit
  ist Referenz, kein Ordner) — inhale-knowledge kann in drei Rollen arbeiten.
- Optionales Feld `mission`: ein Satz, was die Rolle liefert (Anzeige in der Liste).
- Der Graph malt je Workflow-Knoten eine **berechnete Miniatur** seiner echten Kette
  (Knotentypen in Reihenfolge, aus der referenzierten Datei gelesen) — nie gepflegt.

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
- **`"projekt": "<Name aus projekte.json>"`** (optional, je Knoten): der Baustein wohnt in
  einem ANDEREN registrierten Projekt — `ref` gilt dann relativ zu dessen Wurzel.
  Für Ketten über Projektgrenzen (z.B. der Longform-Workflow beginnt in der Software
  eine Software des Stamm-Projekts). Sparsam nutzen: der Normalfall bleibt das eigene Projekt.
- **`"umgebung": "mac"`** (optional, je Knoten): dieser Schritt läuft lokal auf Gaylords
  Mac statt auf dem Server. Der Server ist der Standard-Rechenort und bleibt unmarkiert —
  nur die Ausnahmen tragen das Feld. Der Graph zeigt ein Mac-Abzeichen am Knoten,
  das Panel eine Umgebungs-Zeile. Ein Fakt der Kette, kein Pflege-Feld.
- **`"dienste": ["Gemini API", "Suno (kie.ai)"]`** (optional, je Knoten): externe
  Modelle/APIs, die der Knoten ruft — der Graph zeichnet je Dienst einen eigenen
  Stecker-Baustein DIREKT ÜBER dem Knoten mit Hin (prompt) und Zurück (antwort),
  exakt wie die Tool-Anrufe der Software-Agentik; das Panel listet sie zusätzlich.
  Namen nennen die Art wie dort („Gemini API", „Suno (kie.ai)"). Lokal Laufendes
  (ffmpeg, Whisper im venv) ist kein Dienst und bekommt keinen Stecker.
- Kanten: `haupt` (Arbeitsfluss) · `liest` (Datenbank→Knoten) · `schreibt` (Knoten→Datenbank).
  Verzweigungen sind erlaubt (mehrere haupt-Kanten von einem Knoten, Zweige dürfen wieder
  zusammenlaufen). Kreise über Datenbanken sind erwünscht.
- KEINE Positionen, KEIN Status, KEINE Icons in den Dateien — der Graph berechnet alles
  (Layout, Logos je Typ, „zuletzt geändert" aus mtime, Lose-Skills-Regal aus fehlenden Referenzen).

