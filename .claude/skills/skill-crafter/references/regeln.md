# Die Regeln fürs Skill-Schreiben

Destillat der offiziellen Anthropic-Richtlinien (Agent-Skills-Doku, Authoring Best
Practices, agentskills.io-Standard) und des writing-skills-Skills von Jesse Vincent
(obra/superpowers, MIT — Original wortwörtlich in
`writing-skills-original.md` in diesem Ordner), plus AWMS-Hausregeln. Jede Regel
steht hier mit ihrem Warum — wer das Warum versteht, wendet die Regel auch in
Fällen an, die hier nicht stehen.

## Inhalt
- Der eine Leitsatz: der Leser hat kein Gedächtnis
- Frontmatter: name und description
- Knappheit
- Freiheitsgrade dosieren
- Warum statt Befehlston
- Die Form folgt dem Fehler
- Gates absichern — wenn eine Regel Druck aushalten muss
- Erst der Fehler, dann die Regel (Baseline-Prinzip)
- Ausführbarkeit — der Frische-Test konkret
- Daten & Zustände — der Skill trägt sein eigenes Datenmodell
- Struktur: Progressive Disclosure
- Muster, die sich bewährt haben
- Skripte in Skills
- AWMS-Hausregeln
- Häufige Fehler (Anti-Patterns)

---

## Der eine Leitsatz: der Leser hat kein Gedächtnis

Ein Skill wird von einer KI gelesen, die das Gespräch, in dem er entstand, NIE
erlebt hat — nächste Woche, in einem anderen Chat, ohne jeden Kontext. Daraus
folgt alles Weitere:

- **Keine Datumsangaben, keine Sitzungs-Referenzen.** „validiert 12.07.", „Chef-Entscheid
  von gestern", „siehe Meeting" — für den späteren Leser ist das Rauschen mit
  eingebautem Ablaufdatum: es lädt zum Zweifeln ein („gilt das noch?") und
  beantwortet nichts. Der Skill sagt, was GILT. Punkt.
- **Beweise ziehen um, sie sterben nicht.** Dass eine Regel aus einem Test oder
  einem Entscheid stammt, ist wertvoll — aber es gehört in die Entscheidungs-Ablage
  des Projekts, nicht in den Skill. Im Skill steht die Regel; wer die Herkunft sucht,
  findet sie dort. **Welche Ablage:** Hat das Projekt ein Feedback-Log (z.B.
  `software/brolls-sourcer/skills/feedback_log.md`), ist DAS der Ort — dorthin
  schreibt `/feedback` ohnehin. Sonst die `DECISIONS.md` des Projekts. Nie beides
  nebeneinander: zwei Ablagen für dieselbe Herkunft laufen auseinander.
- **Keine Übergangs-Hinweise.** „Ab jetzt machen wir X statt Y" setzt voraus, dass
  der Leser Y kannte. Schreib nur X. Ist das alte Verhalten als Kontrast wirklich
  nötig (selten), gehört es in eine klar abgetrennte „Alte Muster"-Sektion am Ende.
- **Der Test:** Jede Zeile mit den Augen einer KI lesen, die dieses Gespräch nicht
  kennt. Wirft eine Zeile die Frage „wovon ist hier die Rede?" auf, ist sie kaputt.

## Frontmatter: name und description

- **name**: max. 64 Zeichen, nur Kleinbuchstaben/Ziffern/Bindestriche, kein
  Bindestrich am Anfang/Ende, keine Doppel-Bindestriche, muss dem Ordnernamen
  entsprechen. Verben-Form oder klare Nomen-Phrase („rechnung-pruefen",
  „hof-einkauf") — nie Vages wie „helper", „utils", „tools".
- **description**: max. 1024 Zeichen, dritte Person (nie „Ich kann…"). Inhalt:
  das WAS in einem kurzen Satzteil, dann ausführlich das **WANN** — mit den
  konkreten Wörtern, die ein Nutzer wirklich sagen würde (Trigger-Phrasen,
  Symptome, Dateitypen, Situationen). Die description ist der EINZIGE Text, den
  die KI beim Auswählen sieht; eine vage description = der Skill wird nie
  gefunden. Skills werden eher zu selten als zu oft gezogen — die description
  darf ruhig offensiv sein („auch wenn der Nutzer das Wort X nicht benutzt").
- **Die description fasst NIE den Ablauf zusammen.** Steht der Workflow verkürzt
  in der description („macht erst A, dann B"), führt die KI diese Kurzfassung aus,
  statt den Skill zu lesen — der Körper wird zur Doku, die keiner öffnet. In
  Wort-Tests führte genau das dazu, dass von zwei Pflicht-Reviews nur eins lief.
  Trigger ja, Prozess nein.
- Alles „Wann nutzen" gehört in die description, nicht in den Körper — und
  umgekehrt: Was in der description steht, im Körper nicht wiederholen (die KI
  hat beim Lesen des Körpers die description bereits gesehen).

## Knappheit

Das Kontextfenster ist ein öffentliches Gut: Der Skill konkurriert mit dem
Gespräch, anderen Skills und der eigentlichen Aufgabe. Und: **Die lesende KI ist
bereits sehr schlau.** Erkläre nichts, was sie weiß (was ein PDF ist, wie eine
API funktioniert, was ein Workflow ist).

Für jeden Absatz drei Fragen: Braucht die KI diese Erklärung wirklich? Kann ich
das als bekannt voraussetzen? Rechtfertigt der Absatz seine Token-Kosten?
Im Zweifel: streichen und testen. Ziel-Korridor: SKILL.md unter 500 Zeilen,
Kern-Skills eher unter 150.

## Freiheitsgrade dosieren

Wie präzise eine Anweisung sein muss, hängt an der Zerbrechlichkeit der Aufgabe:

- **Offenes Feld** (viele Wege führen zum Ziel): Richtung + Heuristiken geben,
  der KI den Weg überlassen. Beispiel: Review-Prozesse, Analyse, Texten.
- **Schmale Brücke** (ein falscher Schritt = Absturz): exaktes Kommando, exakte
  Reihenfolge, „nichts hinzufügen, nichts weglassen". Beispiel: Migrationen,
  fragile CLI-Sequenzen.
- Die meisten Skills mischen beides — jeden Abschnitt einzeln kalibrieren.
- **Defaults statt Menüs:** Nie drei gleichwertige Optionen anbieten. EINEN Weg
  vorgeben, Alternativen nur als klar markierte Ausweich-Route für einen
  benannten Fall („bei gescannten PDFs stattdessen …").

## Warum statt Befehlston

Erkläre das Warum hinter Anweisungen statt GROSSBUCHSTABEN-MUSTs zu stapeln.
Eine KI, die den Zweck versteht, entscheidet auch in Fällen richtig, die die
Regel nicht abdeckt. Ertappst du dich bei „IMMER"/„NIE" in Großbuchstaben oder
starren Korsetts: gelbe Flagge — umformulieren, Grund nennen. (Ein einzelnes
hartes Verbot an einer zerbrechlichen Stelle ist okay — als Ausnahme, nicht als Stil.)

## Die Form folgt dem Fehler

Bevor du eine Regel formulierst, benenne den Fehler, den sie verhindern soll —
die Form, die einen Fehlertyp wasserdicht macht, macht einen anderen messbar
schlimmer:

| Beobachteter Fehler | Richtige Form | Falsche Form |
|---|---|---|
| Regel wird unter Druck gebrochen (weiß es, tut's trotzdem) | Verbot + Ausreden-Tabelle + rote Flaggen (siehe „Gates absichern") | Weiche Führung („bevorzuge …", „erwäge …") |
| Ausgabe hat die falsche Gestalt (aufgebläht, Kern vergraben) | Positives Rezept: sagen, was die Ausgabe IST — ihre Teile, in Reihenfolge | Verbotsliste („nicht nacherzählen", „nie ausschweifen") |
| Pflicht-Element wird vergessen | Struktur: PFLICHT-Feld im Template, das ohnehin ausgefüllt wird | Prosa-Erinnerung neben dem Template |
| Verhalten hängt von einer Bedingung ab | Bedingung an beobachtbares Merkmal koppeln („existiert Datei X → …") | Pauschalregel + Ausnahme-Klauseln |

Verbote verlieren bei Gestalt-Problemen: Unter Gegendruck verhandelt die KI mit
„vermeide X" — ein Rezept lässt nichts zu verhandeln, die Ausgabe passt zur
Form oder nicht. Und: **keine Nuancen-Klauseln.** „Nicht X, außer es ist
wichtig" öffnet die Verhandlung wieder — eine echte Ausnahme wird ihre eigene
Bedingung an einem beobachtbaren Merkmal, kein Anhängsel.

## Gates absichern — wenn eine Regel Druck aushalten muss

Für die wenigen harten Verbote eines Skills (das Freigabe-Gate, die Foto-Pflicht,
das „nie trotz Warnung exportieren"): Eine KI unter Druck (Zeitnot, fast fertig,
„nur diesmal") findet Schlupflöcher. Drei Werkzeuge dagegen:

- **Schlupflöcher explizit schließen.** Nicht nur „vor der Freigabe nichts
  buchen", sondern auch die Umgehungen benennen: „auch nicht vorläufig, auch
  nicht als Entwurf ins echte System, auch nicht ‚zur Sicherheit schon mal'."
- **Ausreden-Tabelle.** Jede Rationalisierung, die bei Läufen beobachtet wurde,
  mit ihrer Entkräftung festhalten („‚Der Fall ist eindeutig' → Eindeutig für
  dich ≠ geprüft. Das Gate kostet eine Minute.").
- **Rote Flaggen.** Eine kurze Selbst-Check-Liste von Gedanken, die anzeigen,
  dass gerade rationalisiert wird („‚Das ist hier anders, weil …'", „‚Ich hole
  das danach nach'") — mit der Ansage: alle bedeuten STOPP.

Dazu der Grundsatz gegen Geist-gegen-Buchstabe-Debatten: **Den Buchstaben der
Regel zu verletzen IST den Geist der Regel zu verletzen.**

## Erst der Fehler, dann die Regel (Baseline-Prinzip)

Eine Regel, deren Fehler nie beobachtet wurde, regelt oft am Problem vorbei.
Darum: Wo es geht, erst das Verhalten OHNE die Regel ansehen (der Befund aus
/feedback, der misslungene Lauf, der Test ohne Skill) und das Fehlverhalten
WÖRTLICH festhalten — dann die minimale Regel schreiben, die genau diese
beobachteten Fehler adressiert, statt hypothetische. Zeigt ein späterer Lauf
eine neue Umgehung: Gegenmittel ergänzen, wieder prüfen. (Beweise und
Beobachtungen wandern wie immer in `DECISIONS.md`, nicht in den Skill.)

## Daten & Zustände — der Skill trägt sein eigenes Datenmodell

Ein Skill, der mit Dateien und über mehrere Sessions arbeitet, muss die Welt, die
er voraussetzt, selbst definieren — sonst rät die KI an den Rändern:

- **Jede Bedingung nennt ihre prüfbare Stelle.** „Liegt eine aktuelle Preisliste
  vor?" ist nur prüfbar, wenn dasteht, WO sie läge. Wissen, das von außen kommt
  (Anhänge aus Mails, Zurufe vom Menschen), bekommt einen Ablageort im
  Arbeitsbereich — was keinen Ort hat, existiert für die KI nicht.
- **Zustände leben in Dateien.** „Freigegeben", „bestellt", „erledigt" muss aus
  einer Datei ablesbar sein (Statuszeile, Marker, Ordnerwechsel), die die KI im
  Lauf selbst setzt — ein Prozess über Session-Grenzen hat kein Gedächtnis, nur
  Dateien. (Das ist KEIN menschliches Pflege-Ritual: Die KI stempelt, nie der Mensch.)
- **Artefakt-Namen bleiben über Jahre eindeutig.** `einkauf-30.csv` kollidiert
  nach zwölf Monaten mit sich selbst; Jahr hinein (`einkauf-2026-30.csv`).
- **Ein- UND Ausgabe-Formate bekommen eine Beispielzeile.** Liest ein Programm
  die Ausgabe-Datei, sind Schreibweise, Einheit und Format Rate-Stellen. Dasselbe
  gilt rückwärts: Die zentrale Eingabe-Datei des Skills braucht ihr Schema oder
  einen Beispiel-Ausschnitt (Feldnamen!), sonst rät die KI auf Feld-Ebene.
- **Zustands-Prüfungen scannen den Zustands-Ort, nicht den Stichtag.** Wer offene
  Vorgänge sucht, listet den Ablageort selbst („alle `entwurf-*`-Dateien"), statt
  nur den aus heutigen Eingaben errechneten Fall zu prüfen — sonst wird ein
  liegengebliebener Vorgang unsichtbar, sobald die Eingabe weiterrollt.
- **Bei zwei Quellen fürs Selbe den Vorrang nennen.** Sagt der Skill „übernimm
  den Aufbau der Bestandsdateien" UND definiert selbst feste Regeln, muss
  dastehen, wer bei Widerspruch gewinnt.
- **Mengen-Regeln nennen ihre Bemessungsgrundlage.** „Höchstens 20%" — wovon?
  Je Produkt, je Kiste, nach Stück, Gewicht oder Wert? Ohne Grundlage ist die
  Regel nicht anwendbar. Dazu gehören Gleichstands-Regeln bei Sortierungen und
  Bestenlisten („bei Gleichstand alphabetisch") und Mindest-Basen bei
  Prozent-Schwellen (60% von 2 Meldungen sind kein Muster) — sonst erzeugen zwei
  Läufe zwei verschiedene Berichte.
- **Jede Regel wohnt an genau einem Ort.** Gotchas gehören ins SKILL.md; die
  Referenz-Datei wiederholt sie nicht, sie verweist. Doppelte Wahrheitsorte
  laufen bei Pflege auseinander.
- **Listen sagen, ob sie abschließend sind.** „Sortiment: Karotten, Kartoffeln …"
  — und was ist mit allem anderen? Entweder „vollständige Liste" oder die Regel
  für Ungelistetes nennen.
- **Jedes verlangte Artefakt hat seinen Platz in der Vorlage.** Verlangt der
  Skill irgendwo einen „Anfrage-Entwurf", muss das Ausgabe-Gerüst eine Stelle
  dafür haben.

## Struktur: Progressive Disclosure

Skills laden dreistufig: (1) name+description immer · (2) SKILL.md-Körper beim
Auslösen · (3) beigelegte Dateien nur bei Bedarf. Darum:

- SKILL.md ist die Übersicht + der Kernprozess. Detailwissen in eigene Dateien
  (`references/`), Skripte nach `scripts/`, Vorlagen nach `assets/`.
- **Beim Verweis sagen, WANN die Datei zu lesen ist** („Bei Formular-Feldern →
  lies FORMS.md"), nicht nur dass es sie gibt.
- Verweise nur EINE Ebene tief (SKILL.md → Datei). Ketten (Datei → Datei → Datei)
  führen dazu, dass die KI nur Anfänge liest und Halbwissen hat.
- Referenz-Dateien über ~100 Zeilen bekommen oben ein Inhaltsverzeichnis.
- Dateinamen sagen den Inhalt („feld-regeln.md", nicht „doc2.md"). Pfade immer
  mit Schrägstrich (`scripts/x.py`), nie Backslash.
- Querverweise zeigen auf benannte Abschnitte („siehe Abschnitt Bedarf rechnen"),
  nie auf Nummern — Nummern verschieben sich beim nächsten Umbau lautlos.

## Ausführbarkeit — der Frische-Test konkret

Der häufigste Schwachpunkt sonst sauberer Skills: Anweisungen, die nur mit dem
Wissen der Entstehungs-Session ausführbar sind. Bloßes Neu-Lesen findet das
nicht — die Ausführung muss trocken durchgespielt werden. Sechs Prüfungen, je
Anweisung:

- **Pfade vollständig:** Jede Datei mit ganzem Pfad (`daten/gutschriften.csv`,
  nicht „die CSV"). Ein einziger ortloser Dateiname und die KI schreibt im
  Zweifel eine neue Datei an die falsche Stelle.
- **Kanäle definiert UND der KI möglich:** „Frau X melden", „beim Kunden
  nachfragen" — WIE, und mit welchem Werkzeug? Der Ausführende ist eine KI in
  einer Chat-Session: Sie kann Dateien schreiben, Kommandos ausführen, benannte
  Tools nutzen und den Menschen im Gespräch ansprechen — sonst nichts. Ein Kanal
  ohne benanntes Werkzeug („in Slack schicken" ohne Slack-Tool) ist eine
  Rate-Stelle; der ehrliche Fallback ist immer: Nachricht fertig formulieren und
  dem Menschen im Gespräch übergeben.
- **Beide Zweige — auch der Fehler-Zweig:** Jedes „wenn A → tue B" wirft die
  Frage auf: und wenn nicht A? Dazu gehört der Fehlerfall des Werkzeugs selbst
  (Kommando bricht ab, Datei fehlt) — nicht nur die fachliche Verzweigung.
  Gegenzweig ausschreiben oder bewusst sagen, dass er nicht vorkommt.
- **Jedes Warten hat einen Ausgang — und Sessions warten nicht:** Eine
  KI-Session kann nicht stundenlang lauschen und hat keine Uhr im Hintergrund.
  Warten auf Menschen heißt: sauber stoppen, den Stand + die offene Frage dem
  Menschen im Gespräch übergeben, und sagen, womit der nächste Lauf wieder
  einsteigt. Zusätzlich braucht jedes fachliche Warten Frist und Danach
  („keine Antwort bis <Frist> → <Handlung>").
- **Erfolgskontrolle zwischen Seiteneffekt-Schritten:** Nach jedem Schritt, der
  etwas erzeugt oder verändert, sagt der Skill, WORAN der Erfolg zu erkennen
  ist, bevor der nächste Schritt das Ergebnis benutzt („Export gelungen =
  Dateien in export/gpx/ mit Zeitstempel von heute" — bloße Existenz reicht
  nicht, sonst wird das Ergebnis der Vorwoche weiterverarbeitet).
- **Platzhalter definiert:** `<datum>`, `<id>` — Format und Quelle nennen
  (`tour-2026-07-17`, Datum = Liefertag aus der Bestellung).
- **Prüfungen beantwortbar:** Sagt der Skill „prüfe X in Quelle Y", muss Y das
  X wirklich enthalten. (Klassischer Fehler: „zähle Reklamationen über die
  Gutschriften-Datei" — abgelehnte Reklamationen stehen da nie drin.)

## Muster, die sich bewährt haben

- **Gotchas-Sektion:** Die wertvollsten Zeilen vieler Skills — konkrete Fakten,
  die jeder vernünftigen Annahme widersprechen („die users-Tabelle löscht soft;
  ohne `deleted_at IS NULL` sind Karteileichen im Ergebnis"). Macht die KI einen
  Fehler, der korrigiert wird: als Gotcha festhalten.
- **Prozeduren statt Einzelantworten:** Der Skill lehrt den WEG für eine Klasse
  von Aufgaben, nicht die Lösung eines Einzelfalls. Statt „joine orders auf
  customers und filtere EMEA" → „1. Schema lesen 2. über _id-Konvention joinen
  3. Nutzer-Filter als WHERE …".
- **Beispiele (Input → Output):** Bei Skills, deren Qualität am Stil hängt,
  wirken 2-3 konkrete Beispielpaare stärker als jede Beschreibung — und zwar
  VOLLSTÄNDIGE Paare: der ganze Input (z.B. der Kisteninhalt) und das ganze
  Produkt (die komplette Karte), nicht nur herausgegriffene Fragmente.
  EIN exzellentes Beispiel schlägt viele mittelmäßige — vollständig, aus echter
  Arbeit, mit Warum-Kommentaren; keine Lücken-Vorlagen, keine konstruierten Fälle.
- **Vorlagen fürs Ausgabeformat:** Ein konkretes Template schlägt Prosa. Strenge
  je nach Bedarf: „NUTZE EXAKT dieses Gerüst" vs. „sinnvoller Standard, passe an".
- **Checkliste bei Mehrschritt-Abläufen:** Sobald ein Ablauf Gates, Rücksprünge
  oder mehr als ~4 Schritte hat, eine kopierbare Abhak-Liste vorgeben — die KI
  hakt beim Arbeiten ab und überspringt nichts. Prosa-Schrittfolgen reichen nur
  für kurze, lineare Abläufe.
- **description und Körper decken sich:** Jeder Anwendungsfall, den die
  description verspricht, hat im Körper seinen ausgeschriebenen Weg. Eine
  Ausweich-Route in einem Nebensatz trägt keinen ganzen Anwendungsfall.
- **Validierungs-Schleife:** Arbeiten → prüfen (Skript, Checkliste oder
  Referenz-Abgleich) → Fehler beheben → erst bei Grün weiter. Zähl- und
  Längen-Grenzen (max. 40 Zeichen, max. 6 Schritte) werkzeuggestützt prüfen
  lassen (`wc -c`, ein Einzeiler) — Sprachmodelle zählen unzuverlässig.
- **Menschen antworten gemischt:** Auf ein „zur Freigabe vorlegen" kommt selten
  ein reines Ja. „Ja, aber ändere X", „ganz anderes Gericht", Antwort nach der
  Frist, Antwort NACH bereits erteilter Freigabe — die häufigen Antwort-Formen
  brauchen ihren Weg, nicht nur Ja und Nein.
- **Konsistente Begriffe:** EIN Wort pro Ding, überall. Wer „Feld", „Box" und
  „Element" mischt, zwingt die KI zu raten, ob das dasselbe ist. Das gilt bis
  auf Feldname-Ebene: Wo Daten Feldnamen haben (`mitglied_id`), den Feldnamen
  wörtlich verwenden statt ein Alltagswort („Mitgliedsnummer") einzuführen.

## Skripte in Skills

- Klar sagen, ob ein Skript **ausgeführt** („führe aus: …") oder **als Referenz
  gelesen** wird — Ausführen ist der Normalfall (zuverlässiger, kostet fast keine Tokens).
- Skripte behandeln ihre Fehlerfälle selbst, mit sprechenden Fehlermeldungen —
  nicht scheitern und die KI raten lassen.
- Keine Voodoo-Konstanten: jeder Zahlenwert kurz begründet („Timeout 30 s: normale
  Antwort <10 s, langsame Verbindungen brauchen Luft").
- Abhängigkeiten nennen, nie stillschweigend voraussetzen.
- Schreiben in Testläufen mehrere Durchgänge unabhängig dasselbe Hilfsskript:
  einmal sauber bauen, nach `scripts/` legen, im Skill darauf zeigen.
- Wiederkehrende deterministische Rechnungen (Zählen, Aggregieren,
  Schwellen-Vergleiche) von Anfang an als Skript beilegen — eine KI, die dieselbe
  Arithmetik jede Woche neu herleitet, rechnet irgendwann anders, und der Fehler
  pflanzt sich durch die Berichtskette fort.

## AWMS-Hausregeln

- **Sprache: Deutsch**, Klartext, auf Augenhöhe — wie alles in diesem System.
  (Trigger-Wörter in der description dürfen englisch sein, wenn Nutzer sie so sagen.)
- **AWMS-eigene Skills** tragen `awms: befehl` (zurufbar) oder `awms: system`
  (Hintergrund-Helfer) im Frontmatter; Business-Skills tragen das NICHT.
- **Dateien sind die Wahrheit:** Ein Skill, der Ergebnisse produziert, sagt, in
  WELCHE Datei/Datenbank sie gehören — nichts existiert nur im Chat.
- **Keine menschlichen Pflege-Rituale:** Nie Status-Felder, Formulare oder
  Hand-Listen erfinden, die ein Mensch aktuell halten müsste. Berechnung statt Pflege.
- **Namens-Konventionen sind heilig:** Bestehende Namen (Skills, Knoten, Dateien)
  nie umbenennen, außer es ist ausdrücklich verlangt.
- **Beweise & Entscheidungen → `DECISIONS.md`** des Projekts, nicht in den Skill.

## Häufige Fehler (Anti-Patterns)

- Datum/Sitzungs-Referenz im Skill (siehe Leitsatz) — der häufigste Fehler.
- Vage description („Hilft bei Dokumenten") → Skill wird nie ausgelöst.
- Generisches Geschwafel statt echter Expertise („behandle Fehler angemessen",
  „folge Best Practices") — ein Skill ohne projektspezifisches Wissen ist wertlos.
  Quelle echter Expertise: die erlebte Session (Schritte, Korrekturen, Formate)
  oder echte Projekt-Artefakte — nie aus Allgemeinwissen erfinden.
- Erklärungen für Selbstverständliches (die KI weiß, was ein PDF ist).
- Optionen-Buffet statt Default mit Ausweich-Route.
- ALL-CAPS-Befehlston statt begründeter Regeln.
- Verweisketten über mehrere Ebenen; Dateien ohne Lade-Anlass.
- Übertriebene Vollständigkeit: Wer jeden Rand-Fall regelt, verstopft den Kontext
  und triggert Anweisungen, die gar nicht zutreffen. Mittlere Detailtiefe + gutes
  Beispiel schlägt erschöpfende Doku.
- Zeitbomben-Formulierungen: „neu", „ab sofort", „aktuell", „übergangsweise" —
  alles, was ein Ablaufdatum impliziert.
