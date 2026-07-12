#!/usr/bin/env node
// LKAP Lauf-Marker (M3) — der „Herzschlag"-Schreiber.
// Kein Statusfeld: dies schreibt nur den aktiven-Lauf-ZEIGER + ein Schritt-LOG.
// Die Fertig-WAHRHEIT bleibt immer aus den Artefakten berechnet (server.mjs) — das Log
// liefert nur Lebendigkeit („läuft") und ertappt Lügen („done" ohne Artefakt = rot).
//
// Nutzung:
//   node app/lkap-run.mjs start "026 CC"                  → neuer Lauf (Zeiger + _run/started.json)
//   node app/lkap-run.mjs mark frame-gen start            → Schritt-Herzschlag (coral pulsiert sofort)
//   node app/lkap-run.mjs mark frame-gen done             → Schritt beendet
//   node app/lkap-run.mjs gate voiceovers/_voice_picked.json   → eine Gate-Freigabe schreiben
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.dirname(fileURLToPath(import.meta.url));
const AG = path.resolve(APP, '..', 'software', 'leichtkraut-ads', 'agentik.json');
function lauf() {
  const a = JSON.parse(fs.readFileSync(AG, 'utf8'));
  if (!a.lauf || !a.lauf.basis || !a.lauf.zeiger) { console.error('agentik.json: lauf.basis/zeiger fehlt.'); process.exit(1); }
  const H = process.env.HOME || '';
  const ex = p => String(p).replace(/^~(?=[/\\]|$)/, H).replace(/\$HOME/g, H);
  return { basis: ex(a.lauf.basis), zeiger: ex(a.lauf.zeiger) };
}
function aktivesProjekt(L) { try { return JSON.parse(fs.readFileSync(L.zeiger, 'utf8')).projekt; } catch { return null; } }
const jetzt = () => new Date().toISOString();

const [cmd, a1, a2] = process.argv.slice(2);
const L = lauf();

if (cmd === 'start') {
  if (!a1) { console.error('Projekt fehlt, z.B.: start "026 CC"'); process.exit(1); }
  fs.writeFileSync(L.zeiger, JSON.stringify({ projekt: a1, gestartet: jetzt() }, null, 2));
  const runDir = path.join(L.basis, a1, '_run');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'started.json'), JSON.stringify({ projekt: a1, gestartet: jetzt() }, null, 2));
  console.log('LKAP-Lauf gestartet:', a1);
} else if (cmd === 'mark') {
  const p = aktivesProjekt(L); if (!p) { console.error('Kein aktiver Lauf — erst „start".'); process.exit(1); }
  const runDir = path.join(L.basis, p, '_run'); fs.mkdirSync(runDir, { recursive: true });
  fs.appendFileSync(path.join(runDir, 'log.jsonl'), JSON.stringify({ node: a1, phase: a2 || 'start', ts: jetzt() }) + '\n');
  console.log('mark:', a1, a2 || 'start');
} else if (cmd === 'gate') {
  const p = aktivesProjekt(L); if (!p) { console.error('Kein aktiver Lauf — erst „start".'); process.exit(1); }
  if (!a1) { console.error('Marker-Pfad fehlt, z.B.: gate voiceovers/_voice_picked.json'); process.exit(1); }
  const f = path.join(L.basis, p, a1);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify({ freigegeben: jetzt() }, null, 2));
  console.log('Gate-Freigabe:', a1);
} else if (cmd === 'error') {
  const p = aktivesProjekt(L); if (!p) { console.error('Kein aktiver Lauf.'); process.exit(1); }
  const runDir = path.join(L.basis, p, '_run'); fs.mkdirSync(runDir, { recursive: true });
  const kind = process.argv[5] || 'fehler';
  const message = process.argv[6] || '';
  fs.appendFileSync(path.join(runDir, 'errors.jsonl'), JSON.stringify({ node: a1 || null, tool: a2 || null, kind, message, ts: jetzt() }) + '\n');
  console.log('🔴 Fehler-Marker gesetzt (Alarm an):', a1 || '', a2 || '', kind);
} else if (cmd === 'clear-errors') {
  const p = aktivesProjekt(L); if (!p) { console.error('Kein aktiver Lauf.'); process.exit(1); }
  try { fs.unlinkSync(path.join(L.basis, p, '_run', 'errors.jsonl')); } catch {}
  console.log('Fehler gelöscht — Alarm aus.');
} else if (cmd === 'reset-to') {
  const p = aktivesProjekt(L); if (!p) { console.error('Kein aktiver Lauf.'); process.exit(1); }
  if (!a1) { console.error('Knoten fehlt, z.B.: reset-to gate-voice'); process.exit(1); }
  const runDir = path.join(L.basis, p, '_run'); fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'reset_to.json'), JSON.stringify({ node: a1, ts: jetzt() }, null, 2));
  console.log('⏪ LKAP zurückgesetzt auf Schritt:', a1, '— dieser + alles danach = offen.');
} else if (cmd === 'clear-reset') {
  const p = aktivesProjekt(L); if (!p) { console.error('Kein aktiver Lauf.'); process.exit(1); }
  try { fs.unlinkSync(path.join(L.basis, p, '_run', 'reset_to.json')); } catch {}
  console.log('Rewind aufgehoben — Status wieder rein aus Artefakten.');
} else {
  console.log('Nutzung: start <projekt> | mark <node> <start|done> | gate <marker> | error <node> <tool> <kind> <msg> | clear-errors | reset-to <node> | clear-reset');
}
