# Prüf-Checkliste vor der Abgabe eines Skills

Jeden Punkt einzeln gegen den fertigen Skill prüfen — nicht überfliegen, sondern
beantworten. Ein „nein" heißt: zurück in den Entwurf. (Die Begründungen zu jedem
Punkt stehen in `regeln.md`.)

## Zeitlosigkeit — der wichtigste Block
- [ ] Kein Datum, kein „ab sofort/neu/aktuell/übergangsweise", kein „Entscheid von …"
- [ ] Kein Verweis auf ein Gespräch, Meeting oder eine Session als Begründung
- [ ] Beweise/Herkunft in der Ablage des Projekts (Feedback-Log, sonst `DECISIONS.md`) —
      im Skill steht nur, was gilt

## Ausführbarkeit — Trockenlauf, Anweisung für Anweisung
- [ ] Jeder Dateiname mit vollständigem Pfad
- [ ] Jede Handlung ist einer KI-Session MÖGLICH (Werkzeug benannt; kein Echtzeit-Warten,
      keine Hintergrund-Uhr; Fallback = Nachricht formulieren und dem Menschen übergeben)
- [ ] Jede Interaktion mit Menschen hat ihren benannten Kanal (wie melden, wie antworten)
- [ ] Jedes „wenn A" hat seinen Gegenzweig — einschließlich Werkzeug-Fehlerfall
- [ ] Jedes Warten hat Frist und Danach; Warten über die Session hinaus = Stopp mit
      Übergabe und Wiedereinstiegspunkt
- [ ] Jeder Seiteneffekt-Schritt nennt sein Erfolgs-Kriterium, bevor der nächste ihn nutzt
- [ ] Jeder Platzhalter (`<datum>` …) hat Format und Quelle
- [ ] Jede Prüf-Anweisung ist aus der genannten Quelle wirklich beantwortbar

## Daten & Zustände
- [ ] Jede Bedingung hat eine benannte, prüfbare Stelle; Extern-Wissen hat einen Ablageort
- [ ] Session-übergreifende Zustände stehen in Dateien (von der KI gestempelt)
- [ ] Artefakt-Namen über Jahre eindeutig (Jahr im Namen)
- [ ] Von Maschinen gelesene Formate haben eine Beispielzeile; zentrale
      Eingabe-Dateien zeigen ihr Schema (Feldnamen)
- [ ] Zustands-Prüfungen scannen den Ablageort (alle offenen Vorgänge), nicht nur den Stichtags-Fall
- [ ] Bei zwei Quellen fürs Selbe steht, wer bei Widerspruch gewinnt
- [ ] Zähl-/Längen-Grenzen werden werkzeuggestützt geprüft (nicht per Augenschein)
- [ ] Antwort-Formen des Menschen (Ja-aber / zu spät / nach Freigabe / ganz anders) haben Wege
- [ ] Stil-Skills: mindestens ein VOLLSTÄNDIGES Input→Output-Beispielpaar
- [ ] Mengen-/Prozent-Regeln nennen die Bemessungsgrundlage
- [ ] Jede Regel an genau EINEM Ort (Referenz verweist, statt zu wiederholen)
- [ ] Listen erklären sich als abschließend — oder nennen die Regel für Ungelistetes
- [ ] Jedes verlangte Artefakt hat seinen Platz in Vorlage/Gerüst

## Frontmatter
- [ ] `name`: klein, Bindestriche, = Ordnername, nicht vage
- [ ] `description`: dritte Person, kurzes WAS + ausführliches WANN mit echten Trigger-Wörtern
- [ ] `description` fasst NIRGENDS den Ablauf zusammen (sonst führt die KI die
      Kurzfassung aus, statt den Skill zu lesen)
- [ ] AWMS-eigener Skill → `awms: befehl` oder `awms: system` gesetzt; Business-Skill → keins

## Inhalt
- [ ] Enthält echtes, projektspezifisches Wissen (kein generisches „mach es gut")
- [ ] Nichts erklärt, was eine KI ohnehin weiß
- [ ] Nichts aus der description im Körper wiederholt
- [ ] EIN Begriff pro Ding, konsequent — Feldnamen wörtlich, keine Alltags-Synonyme
- [ ] Defaults statt Options-Menüs; Ausweich-Routen benannt für benannte Fälle
- [ ] Anweisungen begründet (Warum) statt ALL-CAPS-Befehle; harte Verbote nur an
      zerbrechlichen Stellen
- [ ] Jede Regel hat die zum Fehlertyp passende Form (Druck-Bruch → Verbot+Ausreden+Flaggen ·
      falsche Gestalt → Rezept · vergessenes Element → Pflicht-Feld · bedingt → Merkmal-Bedingung)
- [ ] Keine Nuancen-Klauseln („außer wenn…") — echte Ausnahmen als eigene Bedingung
- [ ] Harte Gates: Schlupflöcher benannt, Ausreden-Tabelle und rote Flaggen da, wo Läufe
      Rationalisierungen gezeigt haben
- [ ] Regeln aus Befunden: das beobachtete Fehlverhalten stand Pate (wörtlich in DECISIONS.md),
      nicht ein hypothetisches
- [ ] Prozeduren (der Weg für eine Aufgaben-Klasse), nicht Einzelfall-Antworten
- [ ] Mehrschritt mit Gates/Rücksprüngen/>4 Schritten: kopierbare Abhak-Checkliste im Skill
- [ ] Jeder in der description versprochene Anwendungsfall hat im Körper seinen Weg
- [ ] Qualitätskritische Schritte haben eine Validierungs-Schleife
- [ ] Ausgabeformate als konkretes Template oder Input→Output-Beispiel

## Struktur
- [ ] SKILL.md unter 500 Zeilen; Detailwissen in `references/`, Skripte in `scripts/`
- [ ] Jeder Datei-Verweis sagt, WANN die Datei zu lesen ist
- [ ] Verweise nur eine Ebene tief; Referenz-Dateien >100 Zeilen mit Inhaltsverzeichnis
- [ ] Pfade mit `/`, Dateinamen sagen den Inhalt

## Skripte (falls vorhanden)
- [ ] Ausführen vs. Lesen ist pro Skript eindeutig gesagt
- [ ] Skripte behandeln Fehler selbst, Meldungen sind sprechend
- [ ] Keine unbegründeten Zahlenwerte; Abhängigkeiten genannt
- [ ] Wiederkehrende deterministische Rechnungen liegen als Skript bei (nicht je Lauf neu herleiten)
- [ ] Sortierungen/Schwellen haben Gleichstands-Regel und Mindest-Basis

## AWMS
- [ ] Deutsch, Klartext
- [ ] Ergebnisse haben einen Datei-/Datenbank-Ort (nichts lebt nur im Chat)
- [ ] Kein menschliches Pflege-Ritual erfunden
- [ ] Keine bestehenden Namen verändert
