---
name: feedback
awms: befehl
description: "Der zentrale AWMS-Befehl — die Schranke: Gaylords Feedback zu einem Lauf oder Zwischenprodukt wird in BAUSTEINE gegossen, nie ins Werkstück oder den laufenden Chat. Nutzen, wenn Gaylord sagt „/feedback", „Feedback:", „mir ist aufgefallen …", „das soll er nächstes Mal anders machen", „das Ergebnis passt nicht, weil …" — und bei jedem Änderungswunsch an einem Arbeitsergebnis, auch ohne das Wort Feedback."
---
# /feedback — aus einem Befund eine Baustein-Änderung machen

Rolle: Gaylord hat etwas gesehen, das nicht passt — am Endprodukt eines Laufs oder an
einem Zwischenprodukt (ein Startframe, ein Konzept-Sheet, ein Clip). Du machst daraus
eine **Änderung an einem Baustein**, nie einen Einmal-Fix.

## Das Grundgesetz: die Schranke

Feedback wird **NIE direkt in das Werkstück oder Projekt gepatcht** („generier das
nochmal, diesmal lila"). Der Weg geht immer durch die Schranke: Feedback → Diagnose →
ein Baustein ändert sich (Skill, Workflow-Datei, Datenbank) → der Workflow läuft
**neu, durch den geänderten Baustein**.

Warum: Ein Chat-Fix gilt einmal und verdunstet. Ein Baustein-Fix ist **deterministisch
und wiederholbar** — jeder künftige Lauf hat die Lektion drin. Wissen ≠ Anwenden;
nur was im Baustein steht, wird angewendet. Der Mensch schreibt dabei nie selbst an
einem Skill — die KI schreibt, der Mensch gibt Feedback und entscheidet.

## 1. Diagnose — erst die Ursache, dann die Änderung

Wortlaut des Feedbacks festhalten. Woran hängt er — Endprodukt oder Zwischenprodukt?
Welcher Lauf, welches Artefakt? Dann **nachdenken, wo die Ursache wirklich liegt** —
der verantwortliche Baustein ist nicht automatisch der nächstliegende Skill:

- **Skill:** eine Anweisung fehlt, ist missverständlich oder widerspricht einer anderen.
- **Workflow-Struktur:** ein Arbeitsschritt fehlt ganz, ist überflüssig, steht an der
  falschen Stelle (gehört nach vorn oder hinten geschoben), oder zwei Schritte gehören
  zusammengelegt/getrennt. Dann ändert sich die `workflows/<name>.json`, nicht ein Skill.
- **Datenbank:** falsches oder fehlendes Wissen; oder eine fehlende Kante (der Schritt
  liest die Datenbank gar nicht, die es besser wüsste).
- **Übergabe:** das Format zwischen zwei Skills passt nicht — der zweite bekommt nicht,
  was der erste liefert.

Ergebnis der Diagnose ist eine **Hypothese in zwei Teilen**: die Ursache, und warum
genau sie dieses Fehlverhalten erzeugt hat. Erst wenn die Hypothese steht, wird
geändert — eine Änderung ohne Diagnose kuriert Symptome.

## 2. Modus: automatisch ist der Standard

Standard: **automatisch fixen, ohne Rückfrage** — Diagnose, Änderung, Bericht.
Nur bei einem von zwei beobachtbaren Merkmalen wird stattdessen erst geredet:

- **Gaylords Feedback enthält ein Brainstorm-Signal** — „lass uns brainstormen",
  „lass uns nachdenken", „was denkst du", „wie würdest du das lösen" oder sinngemäß.
  Dann wird gemeinsam geklärt (wo liegt das Problem, welcher Baustein, welches
  Prinzip), und geschrieben wird erst nach Gaylords „bau es".
- **Derselbe Befund steht schon im Feedback-Log des Projekts** (Schritt 6) und wurde
  dort bereits automatisch gefixt — das Feedback kommt also wieder. Dann greift der
  Auto-Fix offenbar nicht: nicht ein drittes Mal raten, sondern Brainstorm vorschlagen.

## 3. Destillieren: Prinzip vor Regel

Frag dich bei jedem Feedback: **Steckt hinter dem konkreten Wunsch ein allgemeines
Prinzip?** Wenn ja, wandert das PRINZIP in den Baustein, nicht die Einzelregel.

Beispiel: Feedback „der Katzenzahn soll lila leuchten, nicht rot."
- ✗ Platte Regel: „Katzenzahn leuchtet bei Schmerz immer lila."
- ✓ Prinzip: „Farbe ist eine **Schmerz-Skala** — sie skaliert die Intensität. Rot =
  schlimm, Lila = noch schlimmer. Bei Steigerungen über mehrere Beats (Tag 1 → Tag 2)
  steigt die Farbe mit."

Die platte Regel löst genau einen Fall. Das Prinzip entscheidet auch die nächsten zehn.
Dazu immer die **Gegenprobe auf Überkorrektur**: Verbessert die Änderung nur DIESEN
Fall, oder verschlechtert sie alle anderen? „Dieser Clip ist zu lang" heißt nicht
„mach künftig alle Clips kürzer" — sondern z.B. „prüfe die Länge gegen die Ziel-Dauer
des Blocks". Trägt ein Feedback wirklich kein Prinzip in sich (reiner Fakt: „das Logo
ist falsch"), ist die konkrete Regel völlig okay — nicht künstlich philosophieren.

## 4. Direkt in den Baustein schreiben

Die Änderung wird **direkt in die echte Datei geschrieben** — Sicherheitsnetz ist Git:
jeder Stand ist committet und per Rollback zurückholbar. Das darf auch Struktur sein:
neue Skills anlegen, Knoten in der Workflow-JSON verschieben/ergänzen/streichen,
Datenbanken oder Kanten hinzufügen — was immer die Diagnose verlangt.

Jede Skill-Änderung läuft dabei nach den Regeln des **skill-crafter**
(`.claude/skills/skill-crafter/SKILL.md` — Checkliste und Trockenlauf für die
geänderten Stellen).

**Sichtbarkeit ist eingebaut, nichts zu pflegen:** AWMS errechnet aus der
Datei-Änderungszeit, welche Bausteine frisch sind — geänderte und neue Knoten leuchten
im Graph ~48 Stunden mit einem Abzeichen. Gaylord sieht nach jedem Feedback im Graph,
WO sich das System verändert hat.

## 5. Chat-Bericht — Pflicht-Gerüst

Gaylord liest den Chat. Nach jedem eingebauten Feedback antwortest du mit genau diesem
Gerüst, kurz und in Stichpunkten:

> **Diagnose:** <Ursache — welcher Baustein oder welche Struktur> · <warum genau das
> dieses Fehlverhalten erzeugt hat>
> **Lösung:** <was geändert wurde> · <Hypothese, warum das das Problem löst>
> **Geändert:** <jede Datei mit Pfad — je Zeile: neu / geändert / verschoben / gelöscht>

Im Brainstorm-Modus kommen Diagnose + Lösungs-Vorschlag ZUERST als Vorschlag mit
diesem Gerüst (ohne „Geändert"-Zeile) — geschrieben wird nach „bau es".

## 6. Protokollieren

Jeden Durchgang ins Feedback-Log des betroffenen Projekts:
für Software `software/<name>/skills/feedback_log.md`, sonst `feedback_log.md` in
der Projektwurzel (neben der CLAUDE.md); existiert es nicht, anlegen. Eine Zeile
Format: Datum · Feedback-Wortlaut · Diagnose · destilliertes Prinzip · geänderte Datei(en).
Das Log ist der Trichter und die Wiederkommer-Prüfung aus Schritt 2; das Learning
selbst wohnt im Baustein.

## 7. Neu laufen lassen, Gaylord entscheidet

Gaylord startet den Neu-Lauf, wenn er so weit ist — durch den geänderten Baustein.
Er vergleicht das neue Ergebnis mit dem alten: **passt** → fertig, der Commit bleibt ·
**schlechter** → per Git zurückrollen und das Feedback neu destillieren.
Die Entscheidung fällt nie automatisch.

## Abhaken — bei jedem Feedback kopieren und ausfüllen

```
[ ] 1 Diagnose: Ursache + Warum als Hypothese notiert
[ ] 2 Modus geprüft (Brainstorm-Signal? Wiederkommer im Feedback-Log?)
[ ] 3 Prinzip destilliert + Gegenprobe auf Überkorrektur
[ ] 4 Baustein(e) geschrieben (Skill-Änderungen über skill-crafter)
[ ] 5 Chat-Bericht im Pflicht-Gerüst
[ ] 6 Feedback-Log ergänzt
[ ] 7 Neu-Lauf liegt bei Gaylord — nicht selbst gestartet
```

## Nie

Das Werkstück oder Projekt direkt anfassen, ohne dass ein Baustein sich ändert (das
verletzt die Schranke — auch „nur schnell diesen einen Clip fixen") · ändern, bevor
die Diagnose-Hypothese steht · mehrere unabhängige Feedbacks stillschweigend in EINE
Änderung mischen (je Feedback ein sauberer Schnitt; mehrere nur nach Ansage) · selbst
entscheiden, ob die Änderung gewonnen hat.
