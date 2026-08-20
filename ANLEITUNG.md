# AWMS — so arbeitest du hier

Ein Ordner. Alles drin. **Dieser Ordner (`AWMS/`) ist dein Arbeitsort und dein
Kontrollturm zugleich.** Hier läuft dein Business; das Anzeige-Tool wohnt in `app/`.

## Einmal am Morgen
**Doppelklick auf `AWMS-starten.command`** — Server startet, Browser öffnet sich von
selbst. Das Terminal-Fenster offen lassen (es ist der Server; schließen beendet AWMS).
Läuft AWMS schon, öffnet der Doppelklick nur den Browser.
*(Alternative für Terminal-Fans: `node app/server.mjs` → http://localhost:4100)*

## Arbeiten (in Claude Cowork oder Claude Code)
1. Öffne **diesen Ordner** im Chat.
2. Arbeite ganz normal — recherchieren, schreiben, bauen.
3. War etwas dabei, das wieder vorkommen wird? Sag: **„Halt das als Skill fest."**
4. Sind genug Teile da? Sag: **„Verbinde die Skills zum Workflow."**
5. In den Browser schauen — **die offene Seite aktualisiert sich von selbst** (alle 2 s).

Das ist der ganze Ablauf. Kein Hochladen, kein Verbinden, kein Einrichten.

## Ein Extra — nur wenn du es brauchst
- **Befund** = der Arztbrief, einmal pro Woche anschauen. 🔴 kaputt · 🟡 auffällig
  (Datenbank ohne Leser, doppelte Skills) · ⚪ lose Enden. Fixen lässt du im Chat.

## Die eine Regel
Im Browser gibt es keinen Knopf zum Arbeiten. **Du redest im Chat, die KI schreibt
Dateien, AWMS zeigt sie.** Fehlt etwas oder stimmt etwas nicht → sag es im Chat.

---
*Für später: Fremde Ordner lassen sich zusätzlich anschließen (`awms-connect.mjs`
reinlegen, einmal ausführen). Und das Tool selbst ist jederzeit extrahierbar —
es ist nur `app/` + `SCHEMA.md`.*
