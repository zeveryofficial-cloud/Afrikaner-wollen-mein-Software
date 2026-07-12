# SETUP — AWMS auf deinem Rechner einrichten

Willkommen, Gaylord. Das hier ist eine **frische, gereinigte Kopie** von AWMS: das Tool
und alle Regeln stehen, aber es sind noch **keine** fremden Skills, Workflows, Datenbanken
oder Programme drin. Du startest bei null. Drei Minuten Einrichtung:

## 1. Ordner ablegen
Leg diesen Ordner irgendwohin auf deinen Rechner (z. B. `~/AWMS`). Der Name ist egal —
das Tool arbeitet relativ zu sich selbst.

## 2. Voraussetzung: Node
Das Anzeige-Tool braucht **Node.js** (zero-dependency, sonst nichts). Test im Terminal:
```
node --version
```
Kommt eine Versionsnummer, bist du startklar. Sonst Node von nodejs.org installieren.

## 3. Den einen Pfad eintragen
Öffne `projekte.json` und trage bei `"pfad"` den **absoluten Pfad zu genau diesem Ordner**
auf deinem Rechner ein. Herausfinden: Terminal in diesem Ordner öffnen und `pwd` tippen.

```json
{
  "projekte": [
    { "name": "business", "pfad": "/DEIN/PFAD/zu/diesem/Ordner" }
  ]
}
```
(Aktuell steht dort noch der Pfad vom ursprünglichen Rechner — den ersetzt du.)

## 4. Starten
**Doppelklick auf `AWMS-starten.command`** — Server startet, Browser öffnet sich auf
`http://localhost:4100`. Terminal-Fenster offen lassen (es *ist* der Server).
Alternative: `node app/server.mjs`.

Der Graph ist am Anfang leer — das ist richtig so. Er füllt sich, sobald du im Chat
deine erste echte Arbeit machst und sie als Baustein festhältst.

## 5. Loslegen
Ab hier gilt `ANLEITUNG.md`. In Kurzform:
- Öffne diesen Ordner in **Claude Code** (oder Cowork).
- Arbeite normal. War etwas wiederholbar? Sag: **„Halt das als Skill fest."**
- Genug Teile da? Sag: **„Verbinde die Skills zum Workflow."**
- Planen, bevor etwas existiert? Sag: **„/entwurf ich will X automatisieren."**

Du redest im Chat, die KI schreibt die Dateien, AWMS zeigt sie. Kein Formular, kein
Status-Pflegen von Hand.

## Was mitgeliefert ist
- `app/` — das komplette Anzeige-Tool (Server, Graph, UI)
- `.claude/skills/` — nur die **System-Skills** von AWMS: `entwurf`, `festhalten`,
  `ausfuehren`, `spaeter`, `skill-creator`. (Deine eigenen Skills kommen später dazu.)
- `referenz/` — die n8n-Design-Spec, an der sich die UI-Qualität misst
- `CLAUDE.md` · `ANLEITUNG.md` · `SCHEMA.md` — Verfassung, Einstieg, Baustein-Formate
- `workflows/` · `datenbanken/` · `software/` · `tools/` — **leer**, warten auf dich

Viel Spaß. — Viktor
