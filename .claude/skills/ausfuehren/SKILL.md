---
name: ausfuehren
awms: system
description: Einen AWMS-Workflow ausführen — workflows/<name>.json als Arbeitsanweisung Knoten für Knoten abarbeiten, an Gates stoppen, Datenbanken laut Kanten lesen/schreiben. Nutzen, wenn Gaylord sagt „führe Workflow X aus", „starte den X-Workflow", den Trigger eines Workflows auslöst (z.B. eine Datei reinwirft, die zu einem Trigger passt) oder fragt, wie er einen Workflow laufen lässt.
---
# /ausfuehren — ein Workflow-Lauf

Die Workflow-Datei ist die Arbeitsanweisung. Du bist der Operator, Gaylord ist das Gate.

1. **Workflow laden:** Lies `workflows/<name>.json`. Ist unklar, welcher gemeint ist:
   EINE Frage mit der Namensliste. Passt eine reingeworfene Datei zum Trigger eines
   Workflows, nimm den und leg los.
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
     einem Satz vor, ihn per /festhalten zu bauen.
   - **„später"-Knoten** (`"spaeter": true`): bewusst zurückgestellt — überspringen,
     im Lauf-Bericht kurz erwähnen.
3. **Verzweigungen:** beide Zweige abarbeiten; der Merge-Knoten bekommt beide Ergebnisse.
   **Mehrere Läufe** (z.B. zwei Ads): nacheinander, je Lauf ein sauberer Durchgang.
4. **Lauf-Bericht am Ende, kurz:** was produziert wurde, was in welche Datenbank
   geschrieben wurde, an welchen Stellen gestoppt/offen. Keine Schönfärberei.

Nie: Gates überspringen · Geister verschweigen · Ergebnisse nur im Chat lassen, wenn
eine schreibt-Kante eine Datenbank nennt · den Workflow „verbessern", ohne dass Gaylord
es entschieden hat (Änderungswünsche → Datei ändern, das ist ein eigener Schritt).
