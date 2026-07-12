// AWMS-Connector — der „Verbindungs-Zettel".
//
// So benutzt du ihn: Leg diese Datei in IRGENDEINEN Arbeitsordner, in dem du arbeitest
// (dein Ordner, wo auch immer er liegt), und führe sie EINMAL aus:
//     node awms-connect.mjs
// Danach schaut AWMS auf genau diesen Ordner. Deine Arbeit bleibt hier; AWMS liest nur.
//
// Es wird NICHTS hochgeladen, NICHTS verschoben, NICHTS kopiert. Der Zettel trägt bloß
// die Adresse dieses Ordners in die Liste ein, auf die AWMS schaut (projekte.json).
// Danach kannst du die Datei löschen — die Verbindung bleibt. Zum Trennen: siehe unten.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const REGISTRATUR = path.join(os.homedir(), 'AWMS', 'projekte.json');
const HIER = path.dirname(fileURLToPath(import.meta.url)); // der Ordner, in dem dieser Zettel liegt
const NAME = path.basename(HIER);
const TRENNEN = process.argv.includes('--trennen');

let reg = { projekte: [] };
try { reg = JSON.parse(fs.readFileSync(REGISTRATUR, 'utf8')); } catch {
  console.error('AWMS nicht gefunden unter ' + REGISTRATUR + ' — liegt der AWMS-Ordner in deinem Benutzerordner?');
  process.exit(1);
}
reg.projekte ||= [];

if (TRENNEN) {
  const vorher = reg.projekte.length;
  reg.projekte = reg.projekte.filter(p => p.pfad !== HIER);
  fs.writeFileSync(REGISTRATUR, JSON.stringify(reg, null, 2) + '\n');
  console.log(vorher === reg.projekte.length
    ? `War nicht verbunden: ${HIER}`
    : `✓ Getrennt: „${NAME}" — AWMS schaut nicht mehr auf diesen Ordner.`);
} else {
  const schon = reg.projekte.find(p => p.pfad === HIER);
  if (schon) {
    console.log(`Schon verbunden: „${schon.name}" → ${HIER}`);
  } else {
    reg.projekte.push({ name: NAME, pfad: HIER });
    fs.writeFileSync(REGISTRATUR, JSON.stringify(reg, null, 2) + '\n');
    console.log(`✓ Verbunden: „${NAME}" — AWMS schaut ab jetzt auf diesen Ordner (read-only).`);
  }
  console.log('Öffne/aktualisiere http://localhost:4100 — dein Ordner erscheint dort.');
}
