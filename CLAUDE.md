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
- Die Bausteine leben HIER: `agenten/` (Rollen, bündeln Workflows) · `.claude/skills/` ·
  `workflows/` · `datenbanken/` · `tools/`.
  Dazu `software/` = vom Menschen bediente Programme (kein Baustein: Tools erweitern
  die KI, Software bedient den Menschen). Formate stehen in `SCHEMA.md`. Der Graph liest
  bei jedem Reload alles frisch.
- `app/` = das Anzeige-Tool (zero-dependency). Jederzeit extrahierbar. Fremde Ordner
  können zusätzlich beobachtet werden (`awms-connect.mjs` → `projekte.json`).
- AWMS-eigene Skills tragen `awms: befehl` (zurufbare Befehle: `/feedback`,
  `/skillcatch`) bzw. `awms: system` (Hintergrund-Helfer, die bei passenden Triggern
  von selbst anlaufen: `execute`, `skill-crafter`) im Frontmatter — sie sind keine
  Business-Bausteine, sondern leben in der Seitenleiste unter „Einstellungen"
  (Sektion System). **Mehr gibt es bewusst nicht:** Rahmen festhalten (`/skillcatch`),
  benutzen (`execute`), brechen & verbessern (`/feedback`) — das ist die ganze Methode.

## Eiserne Regeln
1. **Dateien sind die Wahrheit. Der Graph rendert sie nur.** Nie umgekehrt.
2. **Keine menschlichen Pflege-Rituale bauen.** Keine Status-Felder, Formulare, Boards.
   Angezeigt wird nur, was aus Datei-Fakten berechenbar ist (mtime, Referenzen, Existenz).
3. Gebaut, geändert und ausgeführt wird **im Chat**. Der Graph ist read-only Anzeige —
   ohne Ausnahme.
4. **Berechnung statt Pflege:** Reload liest frisch, der Befund wird errechnet —
   nichts kann veralten oder lügen.
5. **AWMS wächst als Nebenprodukt echter Arbeit.** Entsteht eine wiederholbare Prozedur,
   schlage in EINEM Satz vor: „Als Skill festhalten?" Nichts auf Vorrat erfinden.
6. **CLAUDE.md bleibt schlank — Verhaltensregeln wohnen bei ihren Skills.** Bevor du
   Workflows baust oder Skills anlegst/änderst, lies IMMER ZUERST die zuständige
   Skill-Datei: Skill aus Arbeit festhalten → `.claude/skills/skillcatch/SKILL.md` ·
   **einen Baustein wegen eines Befunds ändern → `.claude/skills/feedback/SKILL.md`** ·
   einen Workflow laufen lassen → `.claude/skills/execute/SKILL.md`. Das gilt auch,
   wenn du den Skill nicht förmlich aufrufst — **maßgeblich ist die TÄTIGKEIT, nicht
   das Stichwort.** Neue Regeln zu diesen Tätigkeiten gehören DORT hinein, nicht
   hierher. Geplant wird nicht auf Vorrat: Ein Workflow entsteht aus echter Arbeit
   (erst manuell vormachen, dann festhalten), nie als Geister-Konzept.
7. **Jeder Eingriff in eine Skill-Datei läuft über den skill-crafter**
   (`.claude/skills/skill-crafter/SKILL.md`) — harte Regel ohne Ausnahme: beim Anlegen
   UND beim Ändern, egal über welchen Befehl (skillcatch, feedback) oder nebenbei.

## Arbeiten mit Gaylord
- Deutsch, Klartext, auf Augenhöhe. Diktiert er per Sprachnachricht, Transkripte
  wohlwollend lesen und den Sinn rekonstruieren („Cloud Code" = Claude Code).
- Er ist nicht-technisch, denkt aber scharf in Systemen: du setzt um, er entscheidet.
- Widersprich offen mit Begründung, wenn du etwas für falsch hältst.
- **Berichtspflicht nach jedem Bauen:** Sag nicht nur WAS du gemacht hast, sondern WO —
  jede geänderte Datei beim Namen nennen (Skill, Workflow, Datenbank, Code-Datei, Karte),
  damit er es in AWMS selbst nachprüfen kann. Nie „erledigt" melden, was nicht
  wirklich in Dateien steht — nicht Gebautes heißt ausdrücklich „nicht gebaut".
- Er füllt nie Formulare aus und pflegt nie Status von Hand. Die KI pflegt die Dateien.
- UI-Qualität ist Arbeitslust: n8n-Niveau an Polish (Spec: `referenz/`), kein Feature-Theater.

## Eigene Schlüssel und eigene Sicherung
- **Schlüssel (API-Keys) gehören NIE ins Repo.** Sie leben in einer `.env`, die die
  Sperrliste (`.gitignore`) draußen hält. Wer einmal einen Schlüssel committet, hat ihn
  für immer in der Historie — dann müssen alle Keys getauscht werden.
- **Medien gehören NIE ins Repo.** Videos, Renders, Rohmaterial bleiben lokal;
  GitHub trägt den Bauplan, nicht das Lager. Dateien über 100 MB nimmt GitHub ohnehin
  nicht an.

## Start
`node app/server.mjs` → http://localhost:4100 · Einstieg für Menschen: `ANLEITUNG.md`
Einrichtung: `SETUP.md`
