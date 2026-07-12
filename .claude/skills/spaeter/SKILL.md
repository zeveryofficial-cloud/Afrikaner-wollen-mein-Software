---
name: spaeter
awms: system
description: Einen geplanten (Geister-)Baustein bewusst auf „später" stellen oder zurückholen. Nutzen, wenn Gaylord über einen ungebauten Knoten sagt „das mache ich jetzt nicht", „später", „irgendwann", „Zukunftsprojekt", „erstmal nicht" — oder ihn zurückholt („doch jetzt", „nimm es von später runter").
---
# /spaeter — bewusst zurückgestellt

„Später" ist eine Entscheidung, kein Status-Feld: Gaylord sagt es im Chat, du schreibst
es in die Datei, der Graph rechnet den Rest selbst.

1. Identifiziere Workflow + Knoten aus Gaylords Satz (er schaut meist gerade auf den
   Graph — höchstens EINE Rückfrage, wenn es wirklich mehrdeutig ist).
2. Setze in `workflows/<name>.json` am Knoten `"spaeter": true`
   (beim Zurückholen: Feld entfernen). Nichts anderes anfassen.
3. Was dann von selbst passiert (nicht du — der Graph berechnet es):
   - Der Knoten verschwindet aus der Kette (sie zeigt nur das Jetzt) und liegt als
     loser gelber Zettel auf der Fläche — verschiebbar; Klick zeigt die Zukunfts-Skizze
     (mitsamt Datenbanken, die nur er nutzen würde).
   - Er zählt nicht mehr als offener Geist: Steht sonst alles, gilt der Workflow als
     „✓ fertig für jetzt · N später".
   - Der Befund meldet ihn nicht als leere Referenz (bewusst zurückgestellt ≠ kaputt).
   - `/ausfuehren` überspringt ihn mit kurzem Hinweis im Lauf-Bericht.
4. Bestätige in EINEM Satz („<Knoten> auf später gestellt").

Nie: den Knoten löschen · andere Felder ändern · nachfragen, wann „später" ist.
