---
name: skill-crafter
awms: system
description: Skills richtig schreiben — nach Anthropics offiziellen Authoring-Richtlinien plus AWMS-Hausregeln. Harte Regel — IMMER nutzen bei JEDEM Eingriff in eine Skill-Datei (anlegen oder ändern), egal über welchen Befehl (/skillcatch, /feedback), auf Zuruf („mach daraus einen Skill", „schreib einen Skill für …") oder nebenbei während anderer Arbeit. Auch nutzen zum Prüfen bestehender Skills („ist dieser Skill gut geschrieben?").
---

# /skill-crafter — Skills schreiben, die eine fremde KI versteht

Ein Skill wird von einer KI gelesen, die das Gespräch, in dem er entstand, nie
erlebt hat. Alles hier dient diesem einen Leser. Der häufigste Fehler beim
Skill-Schreiben aus einer Session heraus: Sitzungswissen (Daten, Entscheide,
„wie wir es gerade besprochen haben") sickert in den Skill und wird dort zu
Rauschen mit Ablaufdatum.

**Geltungsbereich (harte Regel):** Jeder Eingriff in eine Skill-Datei läuft hier
durch — Anlegen und Ändern, egal welcher Befehl den Eingriff auslöst. Kommt der
Eingriff aus einem anderen Befehl (skillcatch, feedback), bleibt dessen Ablauf
der Rahmen — dieser Skill liefert die Schreibregeln und die Prüfung darin: vor
dem Schreiben die Regeln, nach dem Schreiben Checkliste und Trockenlauf. Bei
kleinen Änderungen an bestehenden Skills gelten Checkliste und Trockenlauf für
die geänderten Stellen, nicht für die ganze Datei. Ein Hook erinnert bei jedem
Schreibzugriff auf Skill-Dateien automatisch an diese Regel.

**Lies vor dem Schreiben [references/regeln.md](references/regeln.md)** — die
destillierten Anthropic-Richtlinien samt Begründungen und die AWMS-Hausregeln.
Nicht aus dem Gedächtnis arbeiten: Genau die Abweichungen, die sich richtig
anfühlen (ein Datum als Beleg, ein „ab sofort"), sind die dokumentierten Fehler.

Für harte Gates und Verbote, die unter Druck brechen könnten, sowie für die
vollständige Test-Methodik (Druck-Szenarien, Wort-Mikrotests) liegt zusätzlich
das englische Original bereit, aus dem diese Ideen stammen:
[references/writing-skills-original.md](references/writing-skills-original.md)
(Jesse Vincent, obra/superpowers, MIT, wortwörtlich übernommen) — lesen, wenn ein
Skill eine Disziplin-Regel erzwingen muss oder eine Regel trotz Skill gebrochen
wird. Seine Verweise auf „superpowers:…"-Skills zeigen in SEIN Ökosystem, nicht
in unseres.

## Ablauf

**1. Substanz sammeln — ohne Substanz kein Skill.**
Ein Skill ist destillierte echte Expertise, nie erfundenes Allgemeinwissen.
Quellen, in dieser Reihenfolge:
- Die erlebte Arbeit dieser Session: Welche Schritte führten zum Erfolg? Wo wurde
  korrigiert („nimm X statt Y")? Welche Formate gingen rein und raus?
- Echte Projekt-Artefakte: Doku, Schemas, Configs, frühere Fehler und ihre Fixes.
- Fehlt beides, fehlt die Grundlage: Erst die Aufgabe einmal wirklich durcharbeiten
  oder nachfragen — einen generischen Skill („mach es ordentlich") gar nicht erst schreiben.

Dabei drei Dinge festhalten: den wiederholbaren WEG (Prozedur, nicht
Einzelfall-Lösung), die GOTCHAS (Fakten, die vernünftigen Annahmen widersprechen)
und das AUSGABEFORMAT (als Template oder Beispiel).

**2. Zuschnitt entscheiden.**
Ein Skill = eine zusammenhängende Arbeitseinheit — wie eine gute Funktion. Zu
schmal zwingt mehrere Skills gleichzeitig in den Kontext, zu breit löst unpräzise
aus. Dann je Abschnitt die Freiheitsgrade wählen: offenes Feld (Richtung +
Heuristiken) oder schmale Brücke (exakte Kommandos) — steht in regeln.md.

**3. Schreiben.**
- Frontmatter zuerst: `name` nach den Namensregeln, `description` mit WAS + WANN
  und den Wörtern, die der Nutzer wirklich sagt. AWMS-eigene Skills bekommen
  `awms: befehl` oder `awms: system`.
- Körper: knapp, Deutsch, begründete Anweisungen statt Befehlston, EIN Begriff
  pro Ding, Defaults statt Menüs. Detailwissen in `references/` (mit Lade-Anlass:
  „bei X → lies Y"), Skripte in `scripts/` (sagen, ob ausführen oder lesen).
- Herkunft und Beweise („kam aus Test Z", „Gaylord hat entschieden") gehören in
  die `DECISIONS.md` des Projekts — im Skill steht nur, was gilt.

**4. Selbst prüfen — Punkt für Punkt gegen [references/checkliste.md](references/checkliste.md).**
Nicht überfliegen: jeden Punkt beantworten, bei „nein" zurück zu Schritt 3.
Und misstrauisch bleiben: Ein Selbst-Check, der im ersten Durchgang null Befunde
findet, hat fast immer welche übersehen — unabhängige Prüfer finden in „alles
grün"-Skills regelmäßig ein Dutzend. Darum den Durchgang mit der Arbeitsannahme
machen, dass mindestens drei Stellen schwach sind, und sie aktiv suchen; erst
wer echte Befunde gefunden und behoben hat, darf grün melden.

**5. Trockenlauf mit fremden Augen.**
Der Selbst-Check übersieht, was man selbst geschrieben hat — und bloßes
Neu-Lesen übersieht Ausführbarkeits-Lücken, weil der Kopf die Löcher aus dem
Sitzungswissen stopft. Darum wird die Ausführung durchgespielt, nicht gelesen:
- Steht ein Subagent zur Verfügung: einen starten, der NUR den Skill-Ordner
  bekommt, mit dem Auftrag „Spiele eine realistische Aufgabe nach diesem Skill
  Schritt für Schritt durch (trocken, ohne echte Seiteneffekte) und nenne jede
  Stelle, an der du raten musstest — fehlende Pfade, unklare Kanäle, fehlende
  Zweige, endloses Warten, undefinierte Platzhalter."
- Sonst selbst: einen konkreten Beispielfall erfinden und den Skill daran
  Anweisung für Anweisung trocken ausführen, mit den sechs
  Ausführbarkeits-Prüfungen aus regeln.md an jeder Anweisung.

Jede Rate-Stelle ist ein Befund. Befunde beheben, dann zurück zu Schritt 4.

**6. Abliefern mit Bericht.**
Sagen: welche Datei(en) entstanden sind (mit Pfad), was die description auslöst,
und was bewusst NICHT in den Skill kam (z.B. Beweise → DECISIONS.md). Nichts als
„fertig" melden, was nicht in Dateien steht.

## Bestehenden Skill prüfen

Schritte 4-5 direkt auf die vorhandene Datei anwenden; Befunde als Liste
(Zeile → Regel → Fix-Vorschlag) berichten. Nur bei ausdrücklichem Auftrag auch
gleich umschreiben — sonst entscheidet der Mensch am Befund.
