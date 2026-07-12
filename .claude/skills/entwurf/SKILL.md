---
name: entwurf
awms: system
description: Ein neues Agenten-System von 0 auf 1 entwerfen — Gaylord interviewen, den Entwurf als Geister-Workflow in ein Projekt schreiben und ihn WÄHREND des Gesprächs weiterzeichnen. Nutzen, wenn Gaylord sagt „lass uns einen Workflow entwerfen", „ich will X automatisieren" oder ein Problem beschreibt, für das noch nichts existiert.
---
# /entwurf — von 0 auf 1

Rolle: Du bist der Parasit im Gespräch — Gaylord denkt laut, du zeichnest leise mit.
Er hat http://localhost:4100 offen: Das Konzept erscheint unter „Workflows" (Geister-
Kette mit Löschknopf), sein Graph aktualisiert sich live alle 2 Sekunden.
**Die Datei IST das Gespräch** — du aktualisierst sie nach jedem Austausch, nicht am Ende.

1. **Projekt klären** (höchstens EINE Frage): In welchen Ordner gehört das System?
   Existiert keiner, lege einen an und registriere ihn in `projekte.json` (AWMS-Ordner).
2. **Interview — frag nach der Geschichte, nicht nach Bausteinen:**
   „Erzähl mir den letzten Durchlauf, als du das von Hand gemacht hast — Schritt für Schritt."
   Übersetze beim Zuhören: Tätigkeiten → **Skills** · „dann entscheide/prüfe ich" → **Gates** ·
   „dann schaue ich in / speichere ich" → **Datenbanken** · der Anlass → **Trigger** ·
   „je nachdem" → **Verzweigung**.
3. **Sofort anlegen — aber leer starten:** `workflows/<slug>.json` (Schema: `SCHEMA.md`)
   enthält am Anfang GENAU EINEN Knoten: einen manuellen **Chat-Trigger**. Sonst nichts —
   keine geratenen Knoten, auch nicht aus alten Workflows abgeleitet. (Der Trigger kann
   später zu Schedule o.ä. werden, startet aber immer als Chat-Trigger.)
   Knoten OHNE `ref` sind ausdrücklich erlaubt — sie erscheinen als Geister („geplant").
   Jeder weitere Knoten kommt erst dazu, wenn Gaylord ihn erzählt hat.
4. **Nach JEDER weiteren Antwort:** Datei fortschreiben — Knoten umbenennen, teilen,
   Kanten ändern; offene Denk-Punkte gehören in die `beschreibung` der Knoten (Panel zeigt sie).
   Nicht ankündigen, einfach tun. Max. 1–2 Rückfragen pro Runde.
5. **Wenn Gaylord „passt" sagt:** Geister einzeln bauen — pro Skill eine SKILL.md, pro
   Datenbank eine DATENBANK.md, `ref` im Workflow eintragen. Jede SKILL.md entsteht
   mit Hilfe des skill-creators (`.claude/skills/skill-creator/SKILL.md`). Mit jeder
   Datei wird ein Geist fest; sind alle gebaut, wandert der Entwurf automatisch zu
   „Workflows".
   **Jeder Skill, der während der Session entsteht, wird im selben Zug in die
   Workflow-Datei eingehängt (`ref`) — nicht fragen, einhängen.**

Nie: Status-Felder oder Formulare erfinden · Fragen-Marathons · den Entwurf „erst am
Ende" schreiben · Knoten vorab raten, bevor Gaylord sie erzählt hat · im Graph etwas
bedienen wollen (er zeigt nur an).
