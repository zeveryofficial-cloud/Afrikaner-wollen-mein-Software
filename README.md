# AWMS — Agentic Workflow Management System

Dein Arbeits-Betriebssystem: In diesem Ordner lebt dein Business (Skills, Workflows,
Datenbanken, Tools als Dateien), und das Tool in `app/` macht es als Graph sichtbar —
n8n-Optik, read-only, alles bei jedem Reload frisch aus den Dateien berechnet.
**Du redest im Chat, die KI schreibt Dateien, AWMS zeigt sie.**

> Frische Kopie — noch ohne eigene Bausteine. Erst `SETUP.md` lesen, dann loslegen.

## Starten

**Doppelklick auf `AWMS-starten.command`** — startet den Server und öffnet den Browser.
Oder im Terminal: `node app/server.mjs` → **http://localhost:4100**.

## Weiterlesen

| Datei | Wozu |
|---|---|
| `SETUP.md` | Einmalige Einrichtung auf deinem Rechner |
| `ANLEITUNG.md` | Der Fünf-Minuten-Einstieg: so arbeitest du hier |
| `SCHEMA.md` | Die Baustein-Formate (SKILL.md, DATENBANK.md, workflows/*.json) |
| `CLAUDE.md` | Verfassung für die KI (wird jeder Session automatisch geladen) |
