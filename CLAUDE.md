# AWMS — Gaylords Arbeits-Betriebssystem

Dieser Ordner ist **beides**: Gaylords Arbeitsort (hier lebt sein Business — Skills,
Workflows, Datenbanken, Tools) und das AWMS-Tool (`app/`), das genau diese Bausteine als
Graph sichtbar macht (n8n-Optik, read-only, localhost:4100). Kein Dashboard-Theater,
kein Wissensgraph — Übersicht über echte Arbeit.

> **Frischer Ordner.** Dies ist eine gereinigte AWMS-Kopie: das Tool und seine Regeln
> stehen, aber es gibt noch **keine** eigenen Bausteine. `workflows/`, `datenbanken/`,
> `software/` und `tools/` sind leer und warten auf Gaylords erste echte Arbeit.
> Einstieg für Menschen: `ANLEITUNG.md`. Einrichtung: `SETUP.md`.

## Architektur
- Die Bausteine leben HIER: `.claude/skills/` · `workflows/` · `datenbanken/` · `tools/`.
  Dazu `software/` = vom Menschen bediente Programme (kein Baustein: Tools erweitern
  die KI, Software bedient den Menschen). Formate stehen in `SCHEMA.md`. Der Graph liest
  bei jedem Reload alles frisch.
- `app/` = das Anzeige-Tool (zero-dependency). Jederzeit extrahierbar. Fremde Ordner
  können zusätzlich beobachtet werden (`awms-connect.mjs` → `projekte.json`).
- Produkt-Skills des Tools (`/entwurf`, `/festhalten`) tragen `awms: system` im
  Frontmatter — sie erscheinen nicht als Business-Bausteine im Graph.

## Eiserne Regeln
1. **Dateien sind die Wahrheit. Der Graph rendert sie nur.** Nie umgekehrt.
2. **Keine menschlichen Pflege-Rituale bauen.** Keine Status-Felder, Formulare, Boards.
   Angezeigt wird nur, was aus Datei-Fakten berechenbar ist (mtime, Referenzen, Existenz).
3. Gebaut, geändert und ausgeführt wird **im Chat**. Der Graph ist read-only Anzeige
   (einzige Ausnahme: reine Konzepte — nur Geister — haben einen Löschknopf, der die
   Workflow-Datei löscht; der Server erzwingt, dass nichts Gebautes betroffen ist).
4. **Berechnung statt Pflege:** Reload liest frisch, der Befund wird errechnet —
   nichts kann veralten oder lügen.
5. **AWMS wächst als Nebenprodukt echter Arbeit.** Entsteht eine wiederholbare Prozedur,
   schlage in EINEM Satz vor: „Als Skill festhalten?" Nichts auf Vorrat erfinden.
6. **CLAUDE.md bleibt schlank — Verhaltensregeln wohnen bei ihren Skills.** Bevor du
   Workflows entwirfst oder Skills anlegst/änderst, lies IMMER ZUERST die zuständige
   Skill-Datei: Entwerfen → `.claude/skills/entwurf/SKILL.md` · Skill aus Arbeit
   festhalten → `.claude/skills/festhalten/SKILL.md`. Das gilt auch, wenn du den Skill
   nicht förmlich aufrufst. Neue Regeln zu diesen Tätigkeiten gehören DORT hinein,
   nicht hierher.

## Arbeiten mit Gaylord
- Deutsch, Klartext, auf Augenhöhe. Du setzt um, er entscheidet.
- Widersprich offen mit Begründung, wenn du etwas für falsch hältst.
- **Berichtspflicht nach jedem Bauen:** Sag nicht nur WAS du gemacht hast, sondern WO —
  jede geänderte Datei beim Namen nennen (Skill, Workflow, Datenbank, Code-Datei, Karte),
  damit Gaylord es in AWMS selbst nachprüfen kann. Nie „erledigt" melden, was nicht
  wirklich in Dateien steht — nicht Gebautes heißt ausdrücklich „nicht gebaut".
- Er füllt nie Formulare aus und pflegt nie Status von Hand. Die KI pflegt die Dateien.
- UI-Qualität ist Arbeitslust: n8n-Niveau an Polish (Spec: `referenz/`), kein Feature-Theater.

## Start
`node app/server.mjs` → http://localhost:4100 · Einstieg für Menschen: `ANLEITUNG.md`
