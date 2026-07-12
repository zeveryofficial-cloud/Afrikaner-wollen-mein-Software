#!/usr/bin/env node
// LKAP-GATE (Stufe 2) — harter Reihenfolge-Wächter als Claude-Code PreToolUse-Hook.
// Fängt Kling-GENERIERUNGEN ab und BLOCKT sie, wenn die Voraussetzung fehlt
// (Timing-Contract / Gate A). exit 2 = blockieren; alles andere = durchlassen.
// FAIL-OPEN: jede Unsicherheit/Ausnahme → durchlassen (nie legitime Befehle blocken).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let input = '';
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  try {
    let cmd = '';
    try { cmd = (JSON.parse(input).tool_input || {}).command || ''; } catch { process.exit(0); }
    // Nur echte Kling-Generierungen bewachen — alles andere sofort durch.
    if (!/kling\s+(image_to_image|image_to_video)/.test(cmd)) process.exit(0);

    const APP = path.dirname(fileURLToPath(import.meta.url));
    const AG = path.resolve(APP, '..', 'software', 'leichtkraut-ads', 'agentik.json');
    let L; try { L = JSON.parse(fs.readFileSync(AG, 'utf8')).lauf; } catch { process.exit(0); }
    if (!L || !L.basis || !L.zeiger) process.exit(0);
    const H = process.env.HOME || '';
    const ex = p => String(p).replace(/^~(?=[/\\]|$)/, H).replace(/\$HOME/g, H);
    L = { basis: ex(L.basis), zeiger: ex(L.zeiger) };
    let proj = null; try { proj = JSON.parse(fs.readFileSync(L.zeiger, 'utf8')).projekt; } catch {}
    if (!proj) process.exit(0);
    const dir = path.join(L.basis, proj);

    const hatContract = fs.existsSync(path.join(dir, '_timing_contract.json'));
    if (!hatContract) {
      // Fehler-Marker schreiben → LKAP-Alarm feuert (rote Glocke).
      try {
        const runDir = path.join(dir, '_run'); fs.mkdirSync(runDir, { recursive: true });
        fs.appendFileSync(path.join(runDir, 'errors.jsonl'),
          JSON.stringify({ node: 'frame-gen', kind: 'gesperrt', message: 'Generierung blockiert — Timing-Contract (Gate A) fehlt.', ts: new Date().toISOString() }) + '\n');
      } catch {}
      console.error('🛑 LKAP-GATE: Generierung GESPERRT — der Timing-Contract (Gate A) fehlt. Erst `verify_timing.py contract` + `lint`, dann generieren.');
      process.exit(2); // blockt den Tool-Call
    }
    process.exit(0);
  } catch { process.exit(0); }
});
