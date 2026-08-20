---
name: execute
awms: system
description: Einen AWMS-Workflow ausführen — workflows/<name>.json als Arbeitsanweisung Knoten für Knoten abarbeiten, an Gates stoppen, Datenbanken laut Kanten lesen/schreiben. Läuft automatisch im Hintergrund an, sobald Gaylord einen Workflow meint — „mach X", „starte X", „führe X aus" — oder den Trigger eines Workflows auslöst (z.B. eine Datei reinwirft, die zu einem Trigger passt) oder fragt, wie er einen Workflow laufen lässt. Kein Befehl, den Gaylord rufen muss.
---
# execute — ein Workflow-Lauf (System-Skill)

Die Workflow-Datei ist die Arbeitsanweisung. Du bist der Operator, Gaylord ist das Gate.

1. **Workflow laden:** Lies `workflows/<name>.json`. Ist unklar, welcher gemeint ist:
   EINE Frage mit der Namensliste. Passt eine reingeworfene Datei zum Trigger eines
   Workflows, nimm den und leg los.
1b. **Rechenort wählen — vor dem ersten Knoten.** Frag Gaylord, WO dieser Lauf
   rechnet, und leg ihm dafür die ECHTE Lage vor (nie aus dem Gedächtnis — Rechner
   kommen und gehen): welche Maschinen gerade verfügbar sind, je mit Name · Ort ·
   Adresse · Status, dazu immer die Option „lokal". Gaylords Wahl gilt für den
   GANZEN Lauf: Heavy-Arbeit (ffmpeg, Whisper, Demucs, Renders, große Downloads)
   läuft auf dem gewählten Rechner; APIs und Schlüssel bleiben lokal. Die Wahl in
   das Lauf-Artefakt schreiben, das der Workflow ohnehin anlegt (z.B. die
   Projekt-Karte) — so kennt ein Wiedereinstieg sie; legt der Workflow keins an,
   gilt die Wahl für diese Session und wird beim Wiedereinstieg neu gefragt. Nennt
   ein Skill der Kette selbst einen Rechenort, gewinnt Gaylords Wahl aus dieser
   Frage. Gibt es keine Fernrechner, die Frage trotzdem stellen — dann mit den
   Optionen „lokal" und „Adresse von dir".

2. **Kette abarbeiten**, vom Trigger aus, Knoten für Knoten entlang der `haupt`-Kanten:
   - **skill:** Lies dessen SKILL.md und führe die Prozedur aus. Eingabe = Ergebnis des
     Vorgängers. Ausgabe sauber an den Nächsten weiterreichen.
   - **datenbank-Kanten:** `liest` → hole dir die Daten von dort (Vertragskarte beachten).
     `schreibt` → lege das Ergebnis DORT ab, nicht nur in den Chat.
   - **gate:** STOPP. Zwischenergebnis zeigen, auf Gaylords Entscheid warten („passt" /
     „ändere …"). Niemals durchrutschen — das Gate ist der Sinn des Workflows.
   - **tool:** Laut README aufrufen. Existiert (noch) kein Code, ehrlich sagen und Gaylord
     das Nötige für den Hand-Schritt übergeben (z.B. fertiges Skript für seine App).
   - **Geist (Datei fehlt):** Nicht stillschweigend improvisieren. Sag „Knoten X ist noch
     ungebaut", mach den Schritt einmalig MIT Gaylord von Hand — und schlag danach in
     einem Satz vor, ihn per /skillcatch zu bauen.
3. **Verzweigungen:** beide Zweige abarbeiten; der Merge-Knoten bekommt beide Ergebnisse.
   **Mehrere Läufe** (z.B. zwei Ads): nacheinander, je Lauf ein sauberer Durchgang.
3b. **Verbrauch dem Workflow zuschreiben** (für die AWMS-Seite „Nutzung → Top-Workflows"):
   - Rufst du im Lauf instrumentierte Software (B-Roll-Sourcer, Musik-Finder,
     Voice-Trimmer), setze vorher die Umgebungsvariable `AWMS_WORKFLOW=<workflow-name>` —
     deren Clients stempeln sie dann selbst in die Logs.
   - Feuerst du bezahlte Generierungen DIREKT aus dem Chat (Higgsfield-/Kling-CLI),
     hänge je Aufruf eine Zeile an `AWMS/.usage/direkt.jsonl`:
     `{"ts":"<ISO-Zeit>","workflow":"<workflow-name>","anbieter":"higgsfield"|"kling","menge":<Credits>}`.
   Kein Pflege-Ritual für Gaylord — das erledigt die KI beim Lauf.
4. **Lauf-Bericht am Ende, kurz:** was produziert wurde, was in welche Datenbank
   geschrieben wurde, an welchen Stellen gestoppt/offen. Keine Schönfärberei.

Nie: Gates überspringen · fehlende Bausteine verschweigen · Ergebnisse nur im Chat lassen, wenn
eine schreibt-Kante eine Datenbank nennt · den Workflow „verbessern", ohne dass Gaylord
es entschieden hat (Änderungswünsche → Datei ändern, das ist ein eigener Schritt).

## VOLLSTÄNDIGKEIT — jeder Knoten läuft, ausnahmslos

Ein Lauf ist die Kette, nicht eine Auswahl daraus. **Jeder Knoten auf den
`haupt`-Kanten wird ausgeführt: jeder Skill, jedes Tool, jeder Prüfer-Loop, jeder
Test, jedes Maschinen-Gate — auch die langen, auch die, deren Ergebnis absehbar
scheint.** Es gibt keine erlaubte Ausnahme.

**Zeit ist nie ein Grund, etwas wegzulassen.** Nicht die Uhrzeit, nicht eine
ablaufende Maschine, nicht ein langer Lauf, nicht „das dauert Stunden". Ein
Workflow hat keine Deadline — er hat eine Kette. Läuft eine äußere Frist gegen
die Vollständigkeit (Server wird gelöscht, Kontingent endet), ist das ein
**Entscheidungspunkt für Gaylord, kein Spielraum für dich**: Frist, Restaufwand
und Optionen nennen und ihn wählen lassen. Er entscheidet, was ein Ergebnis wert
ist — nie die KI im Alleingang.

Schlupflöcher, die alle geschlossen sind: nicht „verkürzt", nicht „nur die
Stichprobe statt der Volldeckung", nicht „die anderen Gates waren grün, also
reicht das", nicht „hole ich später nach", nicht „ich melde es ja im Bericht".
**Ein Schritt im Bericht als weggelassen zu deklarieren macht ihn nicht
zulässig — es dokumentiert nur den Regelbruch.**

| Ausrede | Warum sie nicht zählt |
|---|---|
| „Aus Zeitgründen übersprungen." | Der Workflow kennt keine Zeitgründe. Kollidiert eine Frist mit der Kette, fragst du Gaylord — das ist seine Entscheidung, nicht deine. |
| „Die anderen Prüfungen waren grün, dieser Loop bringt nichts Neues." | Jede Prüfung existiert, weil genau ihre Fehlerklasse durch alle anderen rutscht. Wüsstest du das Ergebnis, bräuchte es die Prüfung nicht. |
| „Der Schritt ist optional / eine Feinpolitur." | Steht er auf einer `haupt`-Kante, ist er Pflicht. Was nicht Pflicht sein soll, gehört nicht in die Kette. |
| „Ich schreibe es ehrlich in den Bericht." | Ehrlichkeit ersetzt keine Ausführung. Beides ist Pflicht, nicht das eine statt des anderen. |
| „Die Maschine wird gleich gelöscht, ich rette lieber das Ergebnis." | Ergebnis sichern UND fragen. Ein unvollständiger Lauf, der gesichert wurde, bleibt unvollständig. |
| „Das Ergebnis ist schon gut genug." | Gut genug beurteilt der Mensch am Gate, nicht die KI beim Abkürzen. |

Rote Flaggen — jeder dieser Gedanken heißt STOPP und Rückfrage an Gaylord:
„aus Zeitgründen …" · „das reicht auch so" · „ich lasse nur diesen einen weg" ·
„das hole ich nach" · „hier ist es anders, weil …".

Merksatz: **Den Buchstaben der Kette zu verletzen IST den Geist der Kette zu
verletzen.** Ein Lauf, dem ein Knoten fehlt, ist kein schnellerer Lauf — er ist
ein unfertiger.
