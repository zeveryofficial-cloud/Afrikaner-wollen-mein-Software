// AWMS Server — zero-dependency (node:http).
// AWMS lebt NICHT in den Projekt-Ordnern: projekte.json registriert fremde Ordner,
// und bei JEDEM Request wird dort frisch gelesen. Die Dateien sind die Wahrheit,
// diese App rendert sie nur. Start: node app/server.mjs → http://localhost:4100
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { leseUsage } from './usage.mjs';

const APP = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(APP, '..');
const PORT = Number(process.env.PORT) || 4100;

// ── Datei-Helfer ──────────────────────────────────────────────────────────────
function readSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}
function mtimeIso(p) {
  try { return fs.statSync(p).mtime.toISOString(); } catch { return null; }
}
// „Frisch"-Markierung: BERECHNET aus der Datei-Zeit, nichts wird gepflegt. Ein
// Baustein, dessen eigene Datei sich in den letzten 48 h geändert hat, leuchtet im
// Graph mit „geändert · vor X"-Abzeichen — so sieht Gaylord nach jedem Feedback/Umbau,
// WO sich das System bewegt hat. Bewusst KEIN „neu"-Unterschied: Editoren ersetzen
// beim Speichern die Datei (birthtime lügt dann), und ein neuer Baustein IST eine
// Änderung. 48 h: lang genug für den Blick am nächsten Morgen, verblasst von selbst.
const FRISCH_MS = 48 * 60 * 60 * 1000;
function frischMarkieren(out) {
  if (!out.datei || !out.mtime) return;
  const alter = Date.now() - Date.parse(out.mtime);
  if (!(alter >= 0 && alter < FRISCH_MS)) return;
  out.neu = true;
  out.neuArt = 'ueberarbeitet';
  out.frischSeit = out.mtime;
}
function dirs(p) {
  try { return fs.readdirSync(p, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name); }
  catch { return []; }
}
// Minimaler Frontmatter-Parser: Zeilen zwischen den ersten beiden "---".
function frontmatter(txt) {
  if (!txt || !txt.startsWith('---')) return { attrs: {}, body: txt || '' };
  const end = txt.indexOf('\n---', 3);
  if (end < 0) return { attrs: {}, body: txt };
  const attrs = {};
  for (const line of txt.slice(3, end).split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) {
      let val = line.slice(i + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      attrs[line.slice(0, i).trim()] = val;
    }
  }
  const bodyStart = txt.indexOf('\n', end + 4);
  return { attrs, body: bodyStart < 0 ? '' : txt.slice(bodyStart + 1).trim() };
}

// ── Registratur ───────────────────────────────────────────────────────────────
// Ein Ordner ist ein Projekt, wenn er mindestens einen Baustein-Ordner enthaelt.
const BAUSTEIN_DIRS = ['.claude/skills', 'workflows', 'datenbanken', 'tools', 'software', 'agenten'];
function hatBausteine(p) {
  return BAUSTEIN_DIRS.some(d => fs.existsSync(path.join(p, d)));
}
function readProjekte(warnungen) {
  const txt = readSafe(path.join(ROOT, 'projekte.json'));
  if (txt === null) { warnungen.push('projekte.json fehlt — kein Projekt registriert.'); return []; }
  let parsed;
  try { parsed = JSON.parse(txt); } catch (err) {
    warnungen.push('projekte.json ist kein gueltiges JSON: ' + err.message); return [];
  }
  const out = [];
  const gesehen = new Set();
  const add = (name, pfad) => { if (!gesehen.has(pfad)) { gesehen.add(pfad); out.push({ name, pfad }); } };

  // 1) Einzeln registrierte Projekte.
  for (const p of parsed.projekte || []) {
    if (!p.name || !p.pfad) { warnungen.push('Registratur-Eintrag ohne name/pfad uebersprungen.'); continue; }
    // Relative Pfade gelten ab AWMS-Wurzel — so funktioniert dieselbe projekte.json auf Mac und Server.
    const pfad = path.resolve(ROOT, p.pfad);
    if (!fs.existsSync(pfad)) { warnungen.push(`Projekt "${p.name}": Ordner ${pfad} existiert nicht.`); continue; }
    add(p.name, pfad);
  }
  // 2) Wurzeln: jeder Unterordner mit Bausteinen wird automatisch ein Projekt (kein Registrieren noetig).
  for (const wRoh of parsed.wurzeln || []) {
    const w = path.resolve(ROOT, wRoh);
    if (!fs.existsSync(w)) { warnungen.push(`Wurzel ${w} existiert nicht.`); continue; }
    for (const name of dirs(w)) {
      const pfad = path.join(w, name);
      if (hatBausteine(pfad)) add(name, pfad);
    }
  }
  return out;
}

// ── Bausteine eines Projekts lesen ───────────────────────────────────────────
function readSkills(proj) {
  const dir = path.join(proj.pfad, '.claude', 'skills');
  const skills = {};
  for (const name of dirs(dir)) {
    const file = path.join(dir, name, 'SKILL.md');
    const txt = readSafe(file);
    if (txt === null) continue;
    const { attrs } = frontmatter(txt);
    if (attrs.awms) continue; // AWMS-eigene Skills (Befehle/System-Skills) sind keine Business-Bausteine — sie leben unter „Einstellungen"
    skills[name] = {
      id: name,
      name: attrs.name || name,
      beschreibung: attrs.description || '',
      cmd: '/' + name,
      datei: `.claude/skills/${name}/SKILL.md`,
      mtime: mtimeIso(file),
      projekt: proj.name,
    };
  }
  return skills;
}

// AWMS-eigene Skills — das Werkzeug HINTER AWMS, kein Business-Baustein. Zwei Arten:
//   awms: befehl  → Slash-Befehle, die du zurufst und die eine AWMS-Prozedur starten
//   awms: system  → Hintergrund-Helfer, die andere Befehle im Ablauf nutzen
// Sie leben in der Seitenleiste unter „Einstellungen".
function readEinstellungen(proj) {
  const dir = path.join(proj.pfad, '.claude', 'skills');
  const befehle = [], systemSkills = [];
  for (const name of dirs(dir)) {
    const file = path.join(dir, name, 'SKILL.md');
    const txt = readSafe(file);
    if (txt === null) continue;
    const { attrs } = frontmatter(txt);
    if (!attrs.awms) continue;
    const art = attrs.awms === 'befehl' ? 'befehl' : 'system';
    (art === 'befehl' ? befehle : systemSkills).push({
      id: name, name: attrs.name || name, art,
      beschreibung: attrs.description || '',
      cmd: '/' + name,
      datei: `.claude/skills/${name}/SKILL.md`,
      mtime: mtimeIso(file), projekt: proj.name,
    });
  }
  const nachId = (a, b) => a.id.localeCompare(b.id);
  return { befehle: befehle.sort(nachId), systemSkills: systemSkills.sort(nachId) };
}

function readTool(proj, ref) {
  const file = path.join(proj.pfad, ref, 'README.md');
  const txt = readSafe(file);
  if (txt === null) return null;
  const lines = txt.split('\n');
  const title = (lines.find(l => l.startsWith('# ')) || '').replace(/^# /, '').trim();
  const body = lines.filter(l => !/^# /.test(l)).map(l => l.replace(/^#+\s*/, '')).join('\n')
    .replace(/\n{3,}/g, '\n\n').trim();
  const absaetze = body.split(/\n{2,}/).map(a => a.trim()).filter(Boolean);
  const kurz = (absaetze.find(a => !a.startsWith('[') && !a.startsWith('```')) || absaetze[0] || '').replace(/\n/g, ' ');
  return {
    id: path.basename(ref), name: title || path.basename(ref),
    beschreibung: body, kurz, datei: `${ref}/README.md`, mtime: mtimeIso(file), projekt: proj.name,
  };
}
function readTools(proj) {
  return dirs(path.join(proj.pfad, 'tools')).map(n => readTool(proj, `tools/${n}`)).filter(Boolean);
}

// Software = vom MENSCHEN bediente Programme (Web-Apps etc.) — kein Baustein:
// Tools erweitern die KI, Software bedient Gaylord selbst. README.md mit Frontmatter:
// url (wo sie läuft — der Öffnen-Klick im UI führt dorthin), optional start.
function readSoftwareEintrag(proj, ref) {
  const file = path.join(proj.pfad, ref, 'README.md');
  const txt = readSafe(file);
  if (txt === null) return null;
  const { attrs, body } = frontmatter(txt);
  const lines = body.split('\n');
  const title = (lines.find(l => l.startsWith('# ')) || '').replace(/^# /, '').trim();
  const rest = lines.filter(l => !/^# /.test(l)).map(l => l.replace(/^#+\s*/, '')).join('\n')
    .replace(/\n{3,}/g, '\n\n').trim();
  const absaetze = rest.split(/\n{2,}/).map(a => a.trim()).filter(Boolean);
  const kurz = (absaetze.find(a => !a.startsWith('[') && !a.startsWith('```')) || absaetze[0] || '').replace(/\n/g, ' ');
  return {
    id: path.basename(ref), name: title || path.basename(ref),
    url: attrs.url || '', start: attrs.start || '',
    beschreibung: rest, kurz, datei: `${ref}/README.md`, mtime: mtimeIso(file), projekt: proj.name,
    // Hat die Software eine Agentik-Karte (Innenleben-Graph)? Reine Datei-Existenz.
    agentik: readSafe(path.join(proj.pfad, ref, 'agentik.json')) !== null,
  };
}
function readSoftwares(proj) {
  return dirs(path.join(proj.pfad, 'software')).map(n => readSoftwareEintrag(proj, `software/${n}`)).filter(Boolean);
}
// Läuft die Software gerade? Live am Port berechnet — nichts wird gepflegt.
function portOffen(url, timeoutMs = 250) {
  return new Promise(resolve => {
    let u; try { u = new URL(url); } catch { return resolve(false); }
    const sock = net.connect({ host: u.hostname, port: Number(u.port) || (u.protocol === 'https:' ? 443 : 80) });
    const fertig = ok => { sock.destroy(); resolve(ok); };
    sock.once('connect', () => fertig(true));
    sock.once('error', () => fertig(false));
    sock.setTimeout(timeoutMs, () => fertig(false));
  });
}

// ── Agentik-Karte: das Innenleben einer Software — wo KI entscheidet, nicht wie Code läuft ──
// Die Karte ist eine DATEI (software/<name>/agentik.json), von der KI aus dem echten
// Code der Software abgelesen und im Chat nachgeschärft. AWMS rendert sie nur.
function readAgentik(proj, swId) {
  const rel = `software/${swId}/agentik.json`;
  const file = path.join(proj.pfad, rel);
  const txt = readSafe(file);
  if (txt === null) return null;
  try { return { ...JSON.parse(txt), datei: rel, mtime: mtimeIso(file) }; }
  catch (e) { return { fehler: `${rel}: kaputtes JSON — ${e.message}` }; }
}

// ── Lauf-Status: aus echten Artefakten (oder dem Heartbeat-Log) berechnet ─────
// AWMS-Verfassung konsequent: kein Schritt-Status wird gepflegt. „fertig" = das
// Ergebnis-Artefakt liegt auf der Platte ODER (bei Schritten OHNE Datei, z.B. reine
// Skill-/Dienst-Schritte) der Heartbeat-Log meldet 'done'. „laeuft" = Artefakt gerade
// frisch geschrieben ODER Log sagt 'start'. „wartet" = Gate, dessen Vorgänger fertig ist,
// aber die Freigabe fehlt. „rot" = ein Schritt MIT versprochenem Artefakt meldet 'done',
// aber die Datei fehlt — die Lüge wird ertappt. Alles Benutzte+Fertige (Tools/Dienste/DBs)
// erbt den grünen Haken vom Agenten, der es angerufen/gelesen/beschrieben hat.
function globNeueste(dir, muster) {
  const teile = String(muster).split('/');
  const datei = teile.pop();
  const sub = teile.length ? path.join(dir, ...teile) : dir;
  let eintraege;
  try { eintraege = fs.readdirSync(sub, { withFileTypes: true }); } catch { return null; }
  const rx = new RegExp('^' + datei.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  let neueste = 0, anzahl = 0;
  for (const e of eintraege) {
    if (!e.isFile() || !rx.test(e.name)) continue;
    anzahl++;
    try { const m = fs.statSync(path.join(sub, e.name)).mtimeMs; if (m > neueste) neueste = m; } catch {}
  }
  return anzahl ? { anzahl, neueste } : null;
}
function artInfo(dir, muster) {
  const liste = Array.isArray(muster) ? muster : [muster];
  let anzahl = 0, neueste = 0;
  for (const m of liste) { const r = globNeueste(dir, m); if (r) { anzahl += r.anzahl; if (r.neueste > neueste) neueste = r.neueste; } }
  return anzahl ? { anzahl, neueste } : null;
}
function aktiverLauf(ag) {
  const L = ag && ag.lauf;
  if (!L || !L.basis) return null;
  let projekt = null, workflow = null;
  if (L.zeiger) {
    const z = readSafe(L.zeiger);
    if (z) {
      try {
        const j = JSON.parse(z);
        // Lauf-Ende (Gaylords Ansage 17.07.2026: „wenn die Arbeit beendet ist, aufräumen —
        // nicht für immer Häkchen zeigen"): Trägt der Zeiger `beendet`, gibt es KEINEN
        // aktiven Lauf — kein Status, kein Alarm, keine Fallback-Suche. Der Ausführende
        // schreibt `beendet` in die Zeiger-Datei, sobald das letzte Werkstück geliefert ist.
        if (j.beendet) return null;
        projekt = j.projekt || null;
        // Workflow-Bindung: der Zeiger darf sagen, WELCHER Workflow läuft — dann zeigt nur
        // dessen Tab den Status (sonst behauptet der Schwester-Tab mit gleichen Artefakt-Pfaden
        // fälschlich „fertig", obwohl ER nie lief — Fakten-Regel).
        workflow = j.workflow || null;
      } catch {}
    }
  }
  if (!projekt) {
    const kinder = dirs(L.basis).filter(n => /^\d{3}\s/.test(n)).sort((a, b) => parseInt(b) - parseInt(a));
    projekt = kinder[0] || null;
  }
  if (!projekt) return null;
  const dir = path.join(L.basis, projekt);
  return fs.existsSync(dir) ? { projekt, dir, workflow } : null;
}
function berechneLaufStatus(ag, alleK, kanten, wfName) {
  const lauf = aktiverLauf(ag);
  if (!lauf) return { lauf: null, status: {}, alarm: [] };
  if (lauf.workflow && wfName && lauf.workflow !== wfName) return { lauf: null, status: {}, alarm: [] };
  const LIVE = 120000, now = Date.now();
  const art = {};
  for (const k of alleK) if (k.artefakt) art[k.id] = artInfo(lauf.dir, k.artefakt);
  const hat = id => !!(art[id] && art[id].anzahl > 0);
  const frisch = id => !!(art[id] && (now - art[id].neueste) < LIVE);
  // Rück-Kanten (Lern-Schleifen) zählen NICHT als Vorgänger/Nachfolger — sonst meldet ein
  // End-Gate mit Feedback-Schleife „fertig", sobald das Schleifen-ZIEL ein Artefakt hat.
  // Tiefe per BFS vom Trigger; eine haupt-Kante, die nicht in die Tiefe führt, ist eine Schleife.
  const tiefe = {};
  {
    let front = alleK.filter(k => k.typ === 'trigger').map(k => k.id);
    if (!front.length && alleK.length) front = [alleK[0].id];
    const seen = new Set(front);
    front.forEach(id => { tiefe[id] = 0; });
    let d = 0;
    while (front.length) {
      const next = []; d++;
      for (const id of front) for (const e of kanten)
        if (e.typ === 'haupt' && e.von === id && !seen.has(e.nach)) { seen.add(e.nach); tiefe[e.nach] = d; next.push(e.nach); }
      front = next;
    }
  }
  const istRueck = e => tiefe[e.von] !== undefined && tiefe[e.nach] !== undefined && tiefe[e.nach] <= tiefe[e.von];
  const nachf = {}, vorg = {};
  for (const e of kanten) if (e.typ === 'haupt' && !istRueck(e)) { (nachf[e.von] ||= []).push(e.nach); (vorg[e.nach] ||= []).push(e.von); }
  let log = {};
  try {
    const raw = fs.readFileSync(path.join(lauf.dir, '_run', 'log.jsonl'), 'utf8');
    for (const line of raw.split('\n')) { if (!line.trim()) continue; try { const ev = JSON.parse(line); log[ev.node] = ev.phase; } catch {} }
  } catch {}
  const status = {};
  for (const k of alleK) {
    if (k.typ === 'wissen' || k.typ === 'tool' || k.typ === 'datenbank') continue; // abgeleitet, s.u.
    const id = k.id, hatArt = !!k.artefakt;
    if (k.typ === 'gate') {
      if (hat(id) || (nachf[id] || []).some(hat) || log[id] === 'done') status[id] = 'fertig';
      else if ((vorg[id] || []).some(hat) || (vorg[id] || []).some(v => log[v] === 'done')) status[id] = 'wartet';
      else status[id] = 'offen';
    } else if (hat(id)) {
      // log sagt „done" → fertig, auch wenn die Datei noch frisch ist (sonst lügt „läuft" 2 Minuten lang)
      status[id] = (k.typ !== 'trigger' && frisch(id) && log[id] !== 'done' && !(nachf[id] || []).some(hat)) ? 'laeuft' : 'fertig';
    } else if (log[id] === 'done') {
      status[id] = hatArt ? 'rot' : 'fertig';   // Datei versprochen aber fehlt = Lüge; reiner Skill/Dienst = fertig
    } else if (log[id] === 'start') {
      status[id] = 'laeuft';
    } else {
      status[id] = 'offen';
    }
  }
  const rang = { fehler: 5, rot: 5, laeuft: 3, wartet: 2, fertig: 1, offen: 0 };
  const staerkste = z => z.filter(Boolean).sort((a, b) => (rang[b] || 0) - (rang[a] || 0))[0];
  // Skill (wissen): erbt den STÄRKSTEN Status aller Agenten, die ihn lesen — läuft ein
  // Agent gerade, pocht sein Skill mit („da lese ich die Skills durch", Gaylords Wunsch).
  for (const k of alleK) {
    if (k.typ !== 'wissen') continue;
    const s = staerkste(kanten.filter(x => x.typ === 'liest' && x.von === k.id).map(x => status[x.nach]));
    if (s) status[k.id] = s;
  }
  // Tool: erbt den stärksten Status seiner Anrufer (welche API gerade dran ist).
  // Datenbanken bekommen BEWUSST keinen Status — „wird gefühlt von allem benutzt,
  // komplett irreführend" (Gaylord, 15.07.2026).
  for (const k of alleK) {
    if (k.typ === 'tool') {
      const s = staerkste(kanten.filter(x => x.typ === 'nutzt' && x.nach === k.id).map(x => status[x.von]));
      if (s) status[k.id] = s;
    }
  }
  // Alarm: Fehler-Marker (_run/errors.jsonl) → betroffene Knoten rot + Alarmglocke.
  const alarm = [];
  try {
    const raw = fs.readFileSync(path.join(lauf.dir, '_run', 'errors.jsonl'), 'utf8');
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try { const ev = JSON.parse(line); alarm.push(ev); if (ev.node) status[ev.node] = 'fehler'; if (ev.tool) status[ev.tool] = 'fehler'; } catch {}
    }
  } catch {}
  for (const [id, s] of Object.entries(status)) if (s === 'rot') alarm.push({ node: id, kind: 'übersprungen', message: `„${id}" meldet fertig, aber kein Artefakt liegt vor.` });
  return { lauf: lauf.projekt, status, alarm };
}

function buildAgentikGraph(projektName, swId, wfName, ebene) {
  const warnungen = [];
  const projekte = readProjekte(warnungen);
  if (projekte.length === 0) return { fehler: 'Kein Projekt registriert.', warnungen };
  const proj = projekte.find(p => p.name === projektName) || projekte[0];
  const sw = readSoftwareEintrag(proj, `software/${swId}`);
  if (!sw) return { fehler: `Software "${swId}" nicht gefunden.`, warnungen };
  const ag = readAgentik(proj, swId);
  if (!ag) return { fehler: `„${sw.name}" hat noch keine Agentik-Karte (software/${swId}/agentik.json) — im Chat sagen: „lies das Innenleben aus dem Code ab".`, warnungen };
  if (ag.fehler) return { fehler: ag.fehler, warnungen };
  // Eine Software hat MEHRERE Workflows mit je eigenem Trigger (Gaylords Entscheid:
  // „Cartoon-Ad anlegen ist ein anderer Trigger als B-Roll-Ad"). Alt-Format = einer.
  const wfs = Array.isArray(ag.workflows) && ag.workflows.length
    ? ag.workflows
    : [{ name: 'Ablauf', beschreibung: ag.beschreibung, knoten: ag.knoten || [], kanten: ag.kanten || [] }];
  const awf = wfs.find(w => w.name === wfName) || wfs[0];

  // ── Ebenen: „Aktuell" vs „Idee" (Gaylords Unterscheidung) ──
  // KONZEPT = etwas kommt DAZU (hinten dran / Zwischenschritt) → geplant-Knoten,
  // blass im selben Graph. EXPERIMENTELLE IDEE = etwas ERSETZT Gebautes — Ersatz und
  // Original dürfen NIE zusammen in einer Kette stehen, sonst ergibt der Ablauf
  // keinen Sinn. Darum Ebenen: Knoten mit `idee: true` gehören zur Idee-Ebene,
  // `experiment.ersetzt` nennt die gebauten Knoten, die sie ablösen. Die Datei
  // bleibt die EINE Wahrheit; gezeigt wird immer nur eine Ebene.
  const experiment = awf.experiment || null;
  const ideeAktiv = !!(experiment && ebene === 'idee');
  const ideeIds = new Set((awf.knoten || []).filter(k => k.idee).map(k => k.id));
  const ersetztIds = new Set((experiment && experiment.ersetzt) || []);
  const origName = id => { const n = (awf.knoten || []).find(x => x.id === id); return n ? n.name : id; };
  if (experiment) {
    const alleIds = new Set((awf.knoten || []).map(k => k.id));
    for (const id of ersetztIds) if (!alleIds.has(id))
      warnungen.push(`A/B „${experiment.name || '?'}": experiment.ersetzt nennt „${id}", aber es gibt keinen solchen Knoten — Idee und Aktuell stünden zusammen.`);
    if (!ideeIds.size) warnungen.push(`A/B „${experiment.name || '?'}": experiment gesetzt, aber kein idee:true-Knoten.`);
    if (!ersetztIds.size) warnungen.push(`A/B „${experiment.name || '?'}": experiment ohne „ersetzt".`);
  }
  let alleK = awf.knoten || [];
  let kanten = awf.kanten || [];
  if (ideeAktiv) {
    alleK = alleK.filter(k => !ersetztIds.has(k.id));
    kanten = kanten.filter(k => !ersetztIds.has(k.von) && !ersetztIds.has(k.nach));
  } else {
    alleK = alleK.filter(k => !k.idee);
    kanten = kanten.filter(k => !ideeIds.has(k.von) && !ideeIds.has(k.nach));
  }

  const nameVon = id => { const n = alleK.find(x => x.id === id); return n ? n.name : id; };
  const typVon = id => (alleK.find(x => x.id === id) || {}).typ;
  const SUB = { trigger: 'Start', agent: 'KI entscheidet', wissen: 'Software Skill', datenbank: 'Speicher', gate: 'Homo Sapiens am Kochen', tool: 'Tool' };
  const { lauf: laufName, status: laufStatus, alarm: laufAlarm } = berechneLaufStatus(ag, alleK, kanten, awf.name);
  // Zwei Skill-Stände inhaltlich vergleichen — Berechnung statt Pflege: ob eine
  // B-Arbeitskopie „noch identisch" oder „überarbeitet" ist, sagt allein der Dateiinhalt.
  const inhaltGleich = (absA, absB) => {
    try { return fs.readFileSync(absA, 'utf8') === fs.readFileSync(absB, 'utf8'); } catch { return false; }
  };
  // Skill-Datei eines wissen-Knotens auflösen. Idee-Knoten (A/B-Test) suchen ZUERST in den
  // .ab-tests-Sandkästen (dort liegt die B-Version), Aktuell-Knoten zuerst im echten skills/.
  // `ideeZuerst` lässt sich übersteuern, um für DENSELBEN Knoten beide Stände zu finden
  // (A = echte Datei, B = Sandkasten) — daraus baut die UI den A⇄B-Skill-Vergleich.
  const findeSkillDatei = (k, ideeZuerst = k.idee) => {
    const nm = String(k.name || k.id).trim();
    const tok = nm.split(/[\s/·]+/)[0];
    const abKand = [];
    try {
      const abRoot = path.join(proj.pfad, `software/${swId}/.ab-tests`);
      for (const d of fs.readdirSync(abRoot)) {
        abKand.push(`software/${swId}/.ab-tests/${d}/skills/${nm}.md`);
        abKand.push(`software/${swId}/.ab-tests/${d}/skills/${tok}.md`);
      }
    } catch {}
    const echt = [
      `software/${swId}/skills/${nm}.md`,
      `software/${swId}/skills/${nm}/SKILL.md`,
      `software/${swId}/skills/${tok}.md`,
      `software/${swId}/skills/${tok}`,
    ];
    for (const rel of (ideeZuerst ? [...abKand, ...echt] : [...echt, ...abKand])) {
      const abs = path.join(proj.pfad, rel);
      if (fs.existsSync(abs)) return { rel, abs };
    }
    return null;
  };
  const knoten = alleK.map(k => {
    const out = {
      ...k, projekt: proj.name,
      sub: k.sub || SUB[k.typ] || k.typ,
      datei: ag.datei, mtime: ag.mtime,
    };
    if (laufStatus[k.id]) out.status = laufStatus[k.id];
    // A/B-Test: Idee-Knoten sind die ÄNDERUNG → leuchten. „überarbeitet" = ersetzt einen
    // Aktuell-Knoten (per experiment.ersetzt ODER gleicher Name wie ein Aktuell-Knoten —
    // dann ist es die B-Version eines bestehenden Bausteins), sonst „neu" (additiv).
    if (k.idee) {
      out.neu = true;
      const basis = String(k.id).replace(/_b$/, '');
      const gleicherName = (awf.knoten || []).some(x => !x.idee && x.name === k.name);
      out.neuArt = (ersetztIds.has(basis) || gleicherName) ? 'ueberarbeitet' : 'neu';
    }
    // Konzept-Baustein: als geplant markiert (`geplant: true`) = im Code noch NICHT
    // gebaut, nur gezeichnet. Rendert gestrichelt/blass wie ein Workflow-Geist —
    // damit die Karte ehrlich zwischen „läuft schon" und „nur Idee" trennt.
    if (k.geplant) { out.geist = true; out.sub = k.sub ? `${k.sub} · geplant` : 'geplant'; }
    if (k.typ === 'agent') {
      // Der Harness in Reihenfolge — so arbeitet dieser Chip wirklich:
      // Skill lesen → Kontext holen → übers Tool prompten → Ergebnis ablegen.
      const skills = kanten.filter(x => x.typ === 'liest' && x.nach === k.id && typVon(x.von) === 'wissen').map(x => nameVon(x.von));
      const holt = kanten.filter(x => x.typ === 'liest' && x.nach === k.id && typVon(x.von) === 'datenbank').map(x => nameVon(x.von));
      const tools = kanten.filter(x => x.typ === 'nutzt' && x.von === k.id).map(x => nameVon(x.nach));
      const legtAb = kanten.filter(x => x.typ === 'schreibt' && x.von === k.id).map(x => nameVon(x.nach));
      const schritte = [];
      if (skills.length) schritte.push(`liest seinen Skill: ${skills.join(' + ')}`);
      if (holt.length) schritte.push(`holt Kontext aus: ${holt.join(' + ')}`);
      if (tools.length) schritte.push(`prompted darüber ${tools.join(' + ')}${out.sub && out.sub !== SUB.agent ? ` (Modell: ${out.sub})` : ''}`);
      if (legtAb.length) schritte.push(`legt das Ergebnis ab in: ${legtAb.join(' + ')}`);
      if (schritte.length) out.ablauf = schritte.map((s, i) => `${i + 1}. ${s}`).join('\n');
    }
    // Software-Skill (wissen): die ECHTE Skill-Datei auflösen — damit man sie wie einen
    // normalen Skill durchlesen / im Finder öffnen kann (statt nur auf agentik.json zu zeigen).
    // Existiert KEINE Datei, ist der Knoten per Berechnung ein Geist („geplant") — ein
    // Skill, dessen Datei fehlt, ist nicht gebaut, egal was die Karte behauptet.
    if (k.typ === 'wissen') {
      const f = findeSkillDatei(k);
      if (f) { out.datei = f.rel; out.mtime = mtimeIso(f.abs); out.skillDatei = true; frischMarkieren(out); }
      else { out.geist = true; out.sub = `${out.sub} · geplant`; }
      // A/B-Test: die B-Version eines BESTEHENDEN Skills trägt beide Stände — A (echte
      // Datei) und B (Sandkasten). Die UI öffnet daraus den A⇄B-Vergleich, damit der
      // Mensch SIEHT, welcher Satz sich ändert (statt zwei Fenster nebeneinanderzulegen).
      // `gleich` wird ERRECHNET (Inhalte verglichen, nie gepflegt): ein Loop-Test darf
      // mit identischer Arbeitskopie starten — die UI sagt dann ehrlich „noch identisch".
      if (k.idee && out.neuArt === 'ueberarbeitet') {
        const fA = findeSkillDatei(k, false), fB = findeSkillDatei(k, true);
        if (fA && fB && fA.rel !== fB.rel) out.abVergleich = { a: fA.rel, b: fB.rel, gleich: inhaltGleich(fA.abs, fB.abs) };
      }
    }
    // KI-Node: die MD-Dateien, die er als Kontext liest — als anklickbare Liste im Panel.
    if (k.typ === 'agent') {
      const sd = kanten
        .filter(x => x.typ === 'liest' && x.nach === k.id)
        .map(x => alleK.find(n => n.id === x.von))
        .filter(n => n && n.typ === 'wissen')
        .map(n => {
          const f = findeSkillDatei(n);
          const eintrag = { name: n.name, datei: f ? f.rel : null };
          // Überarbeiteter Skill (A/B): in der Liste markieren + beide Stände mitgeben,
          // damit der Klick direkt den A⇄B-Vergleich öffnet statt nur die B-Datei.
          if (n.idee) {
            const fA = findeSkillDatei(n, false), fB = findeSkillDatei(n, true);
            if (fA && fB && fA.rel !== fB.rel) eintrag.ab = { a: fA.rel, b: fB.rel, gleich: inhaltGleich(fA.abs, fB.abs) };
          }
          return eintrag;
        });
      if (sd.length) out.skillDateien = sd;
    }
    return out;
  });
  const geplantN = knoten.filter(k => k.geist).length; // markierte + errechnete Geister (fehlende Skill-Dateien)
  return {
    agentik: true,
    lauf: laufName,
    alarm: laufAlarm,
    agentikWfs: wfs.map(w => w.name),
    aktivWf: awf.name,
    ebenen: experiment ? {
      aktiv: ideeAktiv ? 'idee' : 'aktuell',
      idee: experiment.name || 'Idee',
      ersetzt: [...ersetztIds].map(origName),
    } : null,
    workflow: {
      name: sw.name, kurz: swId, projekt: proj.name,
      beschreibung: awf.beschreibung || ag.beschreibung || '',
      tags: [
        `Innenleben · ${awf.name}`,
        ...(ideeAktiv ? [`Idee-Ebene — ersetzt: ${[...ersetztIds].map(origName).join(', ')}`] : []),
        ...(ag.stand ? [ag.stand] : []),
      ],
      datei: ag.datei, bausteine: alleK.length, geister: geplantN,
    },
    knoten,
    kanten,
    warnungen,
    gelesen: new Date().toISOString(),
  };
}

function readDatenbank(proj, ref) {
  const file = path.join(proj.pfad, ref, 'DATENBANK.md');
  const txt = readSafe(file);
  if (txt === null) return null;
  const { attrs, body } = frontmatter(txt);
  return {
    id: path.basename(ref),
    name: attrs.name || path.basename(ref),
    typ: attrs.typ || 'Datenbank',
    art: /^\s*wiki/i.test(attrs.typ || '') ? 'wiki' : /^\s*vektor/i.test(attrs.typ || '') ? 'vektor' : /^\s*csv/i.test(attrs.typ || '') ? 'csv' : 'normal',
    zweck: attrs.zweck || '',
    schreibt: attrs.schreibt || '',
    liest: attrs.liest || '',
    format: attrs.format || '',
    hinweis: body,
    datei: `${ref}/DATENBANK.md`,
    mtime: mtimeIso(file),
    projekt: proj.name,
  };
}
function readDatenbanken(proj) {
  return dirs(path.join(proj.pfad, 'datenbanken')).map(n => readDatenbank(proj, `datenbanken/${n}`)).filter(Boolean);
}

// Geist = geplanter Baustein: Knoten ohne ref, oder ref auf eine Datei, die (noch) nicht existiert.
const BAUSTEIN_DATEI = { skill: 'SKILL.md', tool: 'README.md', software: 'README.md', datenbank: 'DATENBANK.md' };
// Quer-Verweis auflösen: trägt der Knoten ein `projekt`-Feld, wohnt sein Baustein in
// einem anderen registrierten Projekt — ref gilt dann relativ zu DESSEN Wurzel (SCHEMA.md).
function heimProjekt(proj, k) {
  if (!k.projekt || k.projekt === proj.name) return proj;
  return readProjekte([]).find(x => x.name === k.projekt) || proj;
}
function bausteinFehlt(proj, k) {
  const heim = heimProjekt(proj, k);
  // Workflow-als-Baustein (nur in Agent-Dateien): ref zeigt direkt auf die JSON-Datei.
  if (k.typ === 'workflow') return !k.ref || !fs.existsSync(path.join(heim.pfad, k.ref));
  if (!BAUSTEIN_DATEI[k.typ]) return false;
  if (!k.ref) return true;
  return !fs.existsSync(path.join(heim.pfad, k.ref, BAUSTEIN_DATEI[k.typ]));
}

function readWorkflows(proj, warnungen) {
  const wfDir = path.join(proj.pfad, 'workflows');
  const out = [];
  let files = [];
  try { files = fs.readdirSync(wfDir).filter(f => f.endsWith('.json')).sort(); } catch { /* keine */ }
  for (const f of files) {
    const p = path.join(wfDir, f);
    const txt = readSafe(p);
    if (txt === null) { warnungen.push(`${proj.name}/workflows/${f}: nicht lesbar`); continue; }
    let parsed;
    try { parsed = JSON.parse(txt); } catch (err) {
      warnungen.push(`${proj.name}/workflows/${f}: kein gueltiges JSON (${err.message})`);
      continue;
    }
    const kurz = f.replace(/\.json$/, '');
    // idee:true-Knoten (B-Variante eines A/B-Tests) zählen NICHT zum Ist-Zustand —
    // sonst würde ein laufender Workflow mit A/B-Overlay in Übersicht/Liste als
    // „Entwurf" (offene Geister) verleumdet. Die Zähler beschreiben immer „Aktuell" (A).
    const bausteinKnoten = (parsed.knoten || []).filter(k => BAUSTEIN_DATEI[k.typ] && !k.idee);
    out.push({
      kurz,
      projekt: proj.name,
      bausteine: bausteinKnoten.length,
      geister: bausteinKnoten.filter(k => bausteinFehlt(proj, k)).length,
      name: parsed.name || kurz,
      beschreibung: parsed.beschreibung || '',
      tags: parsed.tags || [],
      knoten: parsed.knoten || [],
      kanten: parsed.kanten || [],
      notizen: parsed.notizen || [],
      experiment: parsed.experiment || null, // A/B-Test: B-Variante (Idee-Ebene)
      datei: `workflows/${f}`,
      mtime: mtimeIso(p),
      refs: new Set((parsed.knoten || []).filter(k => k.ref).map(k => path.basename(k.ref))),
    });
  }
  return out;
}

// ── Workflow-Graph (eine Kette im Detail) ─────────────────────────────────────
function buildGraph(projektName, wfKurz, ebene) {
  const warnungen = [];
  const projekte = readProjekte(warnungen);
  if (projekte.length === 0) return { fehler: 'Kein Projekt registriert — sag es im Chat („registriere den Ordner X").', warnungen };
  const proj = projekte.find(p => p.name === projektName) || projekte[0];
  const wfs = readWorkflows(proj, warnungen);
  if (wfs.length === 0) return { fehler: `Projekt "${proj.name}" hat noch keine Workflow-Dateien (workflows/*.json).`, warnungen };
  const wf = wfs.find(w => w.kurz === wfKurz) || wfs[0];

  // ── A/B-Test-Ebenen: „Aktuell" (A, das Gebaute) ⇄ „Idee" (B, die Test-Variante). ──
  // Ein aktiver A/B-Test trägt ein `experiment` im Workflow-File; B-Knoten sind `idee:true`,
  // `experiment.ersetzt` nennt die A-Knoten, die B ablöst. Nie beide Ebenen zugleich — sonst
  // ergibt der Ablauf keinen Sinn. Die Datei bleibt die EINE Wahrheit; gezeigt wird eine Ebene.
  const experiment = wf.experiment || null;
  const ideeAktiv = !!(experiment && ebene === 'idee');
  const ideeIds = new Set((wf.knoten || []).filter(k => k.idee).map(k => k.id));
  const ersetztIds = new Set((experiment && experiment.ersetzt) || []);
  const origName = id => { const n = (wf.knoten || []).find(x => x.id === id); return n ? n.name : id; };
  if (experiment) {
    // Fehlerhaftes A/B-Overlay ehrlich melden, statt eine sich widersprechende Kette zu malen.
    const alleIds = new Set((wf.knoten || []).map(k => k.id));
    for (const id of ersetztIds) if (!alleIds.has(id))
      warnungen.push(`A/B „${experiment.name || '?'}": experiment.ersetzt nennt „${id}", aber es gibt keinen solchen Knoten — auf der Idee-Ebene stünden A und B zusammen.`);
    if (!ideeIds.size) warnungen.push(`A/B „${experiment.name || '?'}": experiment gesetzt, aber kein idee:true-Knoten — die B-Variante fehlt.`);
    if (!ersetztIds.size) warnungen.push(`A/B „${experiment.name || '?'}": experiment ohne „ersetzt" — die Idee-Ebene würde das Aktuelle nicht ablösen.`);
  }
  let rohKnoten = wf.knoten || [];
  let rohKanten = wf.kanten || [];
  if (ideeAktiv) {
    rohKnoten = rohKnoten.filter(k => !ersetztIds.has(k.id));
    rohKanten = rohKanten.filter(k => !ersetztIds.has(k.von) && !ersetztIds.has(k.nach));
  } else {
    rohKnoten = rohKnoten.filter(k => !k.idee);
    rohKanten = rohKanten.filter(k => !ideeIds.has(k.von) && !ideeIds.has(k.nach));
  }

  const skills = readSkills(proj);
  const knoten = rohKnoten.map(k => {
    // Quer-Verweis: `projekt` am Knoten sagt, in welchem registrierten Projekt der
    // Baustein wohnt (z.B. eine Software im Stamm, genutzt von einem Workflow in
    // einem anderen Projekt). Ohne das Feld wohnt der Baustein im eigenen Projekt.
    let heim = proj;
    if (k.projekt && k.projekt !== proj.name) {
      const fremd = projekte.find(x => x.name === k.projekt);
      if (fremd) heim = fremd;
      else warnungen.push(`Knoten "${k.id}": Projekt "${k.projekt}" ist nicht in projekte.json registriert`);
    }
    const out = { ...k, projekt: heim.name };
    if (bausteinFehlt(heim, k)) {
      // Geist: geplanter Baustein — kein Fehler, sondern Entwurfs-Zustand.
      out.geist = true;
      out.sub = 'geplant';
      out.datei = wf.datei; out.mtime = wf.mtime; out.projekt = proj.name;
    } else if (k.typ === 'skill' && k.ref) {
      const s = skills[path.basename(k.ref)];
      if (s) {
        out.datei = s.datei; out.mtime = s.mtime; out.cmd = s.cmd;
        out.beschreibungDatei = s.beschreibung;
        out.sub = s.cmd;
      } else {
        warnungen.push(`Knoten "${k.id}": ${k.ref}/SKILL.md fehlt`);
        out.sub = 'Skill';
      }
    } else if (k.typ === 'tool' && k.ref) {
      const t = readTool(heim, k.ref);
      if (t) {
        out.datei = t.datei; out.mtime = t.mtime;
        out.beschreibungDatei = t.beschreibung;
        out.sub = 'Tool';
      } else {
        warnungen.push(`Knoten "${k.id}": ${k.ref}/README.md fehlt`);
        out.sub = 'Tool';
      }
    } else if (k.typ === 'software' && k.ref) {
      const s = readSoftwareEintrag(heim, k.ref);
      if (s) {
        out.datei = s.datei; out.mtime = s.mtime;
        out.beschreibungDatei = s.beschreibung;
        out.url = s.url; out.start = s.start;
        out.sub = 'Mensch bedient';
      } else {
        warnungen.push(`Knoten "${k.id}": ${k.ref}/README.md fehlt`);
        out.sub = 'Software';
      }
    } else if (k.typ === 'datenbank' && k.ref) {
      const d = readDatenbank(heim, k.ref);
      if (d) {
        out.datei = d.datei; out.mtime = d.mtime;
        out.db = d;
        out.sub = d.typ.split('(')[0].trim();
        out.art = d.art;
      } else {
        warnungen.push(`Knoten "${k.id}": ${k.ref}/DATENBANK.md fehlt`);
        out.sub = 'Datenbank';
      }
    } else {
      // Trigger & Gates leben in der Workflow-Datei selbst.
      out.datei = wf.datei; out.mtime = wf.mtime;
      out.sub = k.typ === 'trigger' ? 'Gaylord, im Chat' : 'Mensch entscheidet';
    }
    if (!out.geist && out.datei && out.datei !== wf.datei) frischMarkieren(out);
    return out;
  });

  // Zähler ebenen-korrekt aus den GEFILTERTEN Knoten der aktiven Ebene rechnen —
  // sonst behauptet der Kopf auf „Aktuell" fälschlich Geister aus der B-Variante.
  const bkFilt = rohKnoten.filter(k => BAUSTEIN_DATEI[k.typ]);
  const ebBausteine = bkFilt.length;
  const ebGeister = bkFilt.filter(k => bausteinFehlt(proj, k)).length;
  return {
    workflow: {
      name: wf.name, kurz: wf.kurz, projekt: proj.name, beschreibung: wf.beschreibung,
      tags: [
        ...(wf.tags || []),
        ...(ideeAktiv ? [`A/B — Idee-Ebene (B) · ersetzt: ${[...ersetztIds].map(origName).join(', ')}`] : []),
      ],
      datei: wf.datei, bausteine: ebBausteine, geister: ebGeister,
    },
    ebenen: experiment ? {
      aktiv: ideeAktiv ? 'idee' : 'aktuell',
      idee: experiment.name || 'Idee (B)',
      ersetzt: [...ersetztIds].map(origName),
    } : null,
    knoten,
    kanten: rohKanten,
    notizen: wf.notizen,
    warnungen,
    gelesen: new Date().toISOString(),
  };
}

// ── Agenten: die Rollen des Unternehmens — Ketten, deren Knoten AUCH Workflows sind ──
// Gaylords Protein-Bild (17.07.2026): Bausteine = Aminosäuren, Workflows = Ketten,
// Agenten = gefaltete Proteine. Ein Agent bündelt einen Aufgabenbereich wie ein
// eingestellter Mitarbeiter („Native Copywriter"): Workflows als Bausteine PLUS
// direkte Skills/Tools/Datenbanken dazwischen. Datei: agenten/<name>.json —
// Schema wie Workflow, zusätzlich erlaubter Knotentyp `workflow` (ref → Datei).
// Eine Ebene, keine Rekursion. Zugehörigkeit ist Referenz, kein Ordner.
function readAgenten(proj, warnungen) {
  const dir = path.join(proj.pfad, 'agenten');
  const out = [];
  let files = [];
  try { files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort(); } catch { /* keine */ }
  for (const f of files) {
    const p = path.join(dir, f);
    const txt = readSafe(p);
    if (txt === null) { warnungen.push(`${proj.name}/agenten/${f}: nicht lesbar`); continue; }
    let parsed;
    try { parsed = JSON.parse(txt); } catch (err) {
      warnungen.push(`${proj.name}/agenten/${f}: kein gueltiges JSON (${err.message})`);
      continue;
    }
    const kurz = f.replace(/\.json$/, '');
    const bausteinKnoten = (parsed.knoten || []).filter(k => BAUSTEIN_DATEI[k.typ] || k.typ === 'workflow');
    out.push({
      kurz, projekt: proj.name,
      name: parsed.name || kurz,
      beschreibung: parsed.beschreibung || '',
      mission: parsed.mission || '',
      tags: parsed.tags || [],
      knoten: parsed.knoten || [],
      kanten: parsed.kanten || [],
      workflows: (parsed.knoten || []).filter(k => k.typ === 'workflow').length,
      bausteine: bausteinKnoten.length,
      geister: bausteinKnoten.filter(k => bausteinFehlt(proj, k)).length,
      datei: `agenten/${f}`,
      mtime: mtimeIso(p),
    });
  }
  return out;
}

// Mini-Kette eines referenzierten Workflows: die echte Knoten-Folge als Typ-Liste —
// daraus malt die Workflow-Karte im Agent-Graph ihre lebendige Miniatur.
// Berechnet aus der referenzierten Datei, nie gepflegt.
function miniKette(proj, parsed) {
  const knoten = (parsed.knoten || []).filter(k => k.typ !== 'datenbank' && k.typ !== 'wissen' && !k.idee);
  const haupt = (parsed.kanten || []).filter(k => k.typ === 'haupt');
  const layer = {};
  for (const k of knoten) layer[k.id] = 0;
  for (let i = 0; i <= knoten.length; i++) { // Relaxation, durch die Schleifen-Grenze kreissicher
    let changed = false;
    for (const e of haupt)
      if (layer[e.von] !== undefined && layer[e.nach] !== undefined && layer[e.nach] < layer[e.von] + 1 && layer[e.von] < knoten.length) {
        layer[e.nach] = layer[e.von] + 1; changed = true;
      }
    if (!changed) break;
  }
  return knoten
    .map((k, i) => ({ t: k.typ, g: bausteinFehlt(proj, k) ? 1 : 0, o: (layer[k.id] || 0) * 1000 + i }))
    .sort((a, b) => a.o - b.o)
    .map(({ t, g }) => (g ? { t, g } : { t }));
}

// ── Agent-Graph: die Rolle im Detail — Workflows als lebendige Karten in der Kette ──
function buildAgentGraph(projektName, agKurz) {
  const warnungen = [];
  const projekte = readProjekte(warnungen);
  if (projekte.length === 0) return { fehler: 'Kein Projekt registriert — sag es im Chat („registriere den Ordner X").', warnungen };
  const proj = projekte.find(p => p.name === projektName) || projekte[0];
  const ags = readAgenten(proj, warnungen);
  if (ags.length === 0) return { fehler: `Projekt "${proj.name}" hat noch keine Agenten (agenten/*.json) — im Chat sagen: „entwirf einen Agenten".`, warnungen };
  const ag = ags.find(a => a.kurz === agKurz) || ags[0];
  const skills = readSkills(proj);
  const knoten = (ag.knoten || []).map(k => {
    const out = { ...k, projekt: proj.name };
    if (k.typ === 'workflow') {
      // Workflow als Baustein: die referenzierte Kette lesen und als Miniatur mitgeben.
      const abs = k.ref ? path.join(proj.pfad, k.ref) : null;
      let parsed = null;
      const txt = abs ? readSafe(abs) : null;
      if (txt !== null) { try { parsed = JSON.parse(txt); } catch { warnungen.push(`${k.ref}: kaputtes JSON`); } }
      if (parsed) {
        const bk = (parsed.knoten || []).filter(x => BAUSTEIN_DATEI[x.typ] && !x.idee);
        const gz = bk.filter(x => bausteinFehlt(proj, x)).length;
        out.kurz = path.basename(k.ref).replace(/\.json$/, '');
        out.name = k.name || parsed.name || out.kurz;
        out.beschreibungDatei = parsed.beschreibung || '';
        out.mini = miniKette(proj, parsed);
        // Ehrlich bleiben: eine Kette ohne EINEN Baustein-Knoten (frischer Entwurf, nur
        // Trigger) „steht" nicht — sie ist ein Konzept. Gleiche Sprache wie die Workflows-Liste.
        out.sub = bk.length === 0 ? 'Konzept — noch nichts gebaut'
          : gz > 0 ? `◐ ${bk.length - gz}/${bk.length} Bausteine`
          : `${(parsed.knoten || []).length} Knoten · steht`;
        out.datei = k.ref; out.mtime = mtimeIso(abs);
      } else {
        out.geist = true;
        out.sub = 'Workflow · geplant';
        out.datei = ag.datei; out.mtime = ag.mtime;
      }
    } else if (bausteinFehlt(proj, k)) {
      out.geist = true;
      out.sub = 'geplant';
      out.datei = ag.datei; out.mtime = ag.mtime;
    } else if (k.typ === 'skill' && k.ref) {
      const s = skills[path.basename(k.ref)];
      if (s) { out.datei = s.datei; out.mtime = s.mtime; out.cmd = s.cmd; out.beschreibungDatei = s.beschreibung; out.sub = s.cmd; }
      else { warnungen.push(`Knoten "${k.id}": ${k.ref}/SKILL.md fehlt`); out.sub = 'Skill'; }
    } else if (k.typ === 'tool' && k.ref) {
      const t = readTool(proj, k.ref);
      if (t) { out.datei = t.datei; out.mtime = t.mtime; out.beschreibungDatei = t.beschreibung; }
      out.sub = 'Tool';
    } else if (k.typ === 'software' && k.ref) {
      const s = readSoftwareEintrag(proj, k.ref);
      if (s) { out.datei = s.datei; out.mtime = s.mtime; out.beschreibungDatei = s.beschreibung; out.url = s.url; out.start = s.start; }
      out.sub = 'Mensch bedient';
    } else if (k.typ === 'datenbank' && k.ref) {
      const d = readDatenbank(proj, k.ref);
      if (d) { out.datei = d.datei; out.mtime = d.mtime; out.db = d; out.sub = d.typ.split('(')[0].trim(); out.art = d.art; }
      else { out.sub = 'Datenbank'; }
    } else {
      out.datei = ag.datei; out.mtime = ag.mtime;
      out.sub = k.typ === 'trigger' ? 'Gaylord, im Chat' : 'Mensch entscheidet';
    }
    return out;
  });
  return {
    agentRolle: true,
    workflow: {
      name: ag.name, kurz: ag.kurz, projekt: proj.name,
      beschreibung: ag.beschreibung || ag.mission,
      tags: ['Agent — Rolle', ...(ag.tags || [])],
      datei: ag.datei, bausteine: ag.bausteine, geister: ag.geister,
    },
    knoten,
    kanten: ag.kanten || [],
    warnungen,
    gelesen: new Date().toISOString(),
  };
}

// ── Inventar: alles für Seitenleiste + Listen-Seiten + Befund ─────────────────
// Der Befund ist der „Arztbrief" zum Röntgenbild: berechnete Auffälligkeiten.
// Alles aus Datei-Fakten — nichts wird gepflegt, jeder Reload rechnet frisch.
// ── Workflow-Drift: konkurrierende / veraltete Bausteine ──────────────────────
// Rein aus der Struktur berechnet (Eiserne Regel 2+4). Fragt NICHT „neu oder alt?"
// (steht in keiner Datei), sondern „kohärent?": zwei Strecken für EINEN Job = Drift;
// ein Pfad bleibt ein Pfad = still. Ausnahmen (Idee-Ebene, Retry-Schleife, Mehrfach-
// Trigger, Geister) verhindern Fehlalarm. Simulation 13.07.2026: 100 % Precision,
// 0 % Fehlalarm, 93 % Trefferquote auf 72 unabhängig gebauten Test-Graphen.
function berechneDrift(wf) {
  const knoten = wf.knoten || [], kanten = wf.kanten || [];
  const byId = Object.fromEntries(knoten.map(k => [k.id, k]));
  const ersetzt = new Set((wf.experiment && wf.experiment.ersetzt) || []);
  // „Inaktiv" = von der Konkurrenz-Prüfung ausgenommen: die DIE-Fehlalarm-Guards.
  const inaktiv = id => { const k = byId[id]; return !k || k.idee === true || ersetzt.has(id); };
  const live = id => byId[id] && !inaktiv(id);

  const hOut = {}, hIn = {};
  for (const k of knoten) { hOut[k.id] = []; hIn[k.id] = []; }
  for (const e of kanten) { if (e.typ !== 'haupt' || !byId[e.von] || !byId[e.nach]) continue; hOut[e.von].push(e.nach); hIn[e.nach].push(e.von); }
  const reachFrom = start => { const s = new Set(), st = [start]; while (st.length) { const n = st.pop(); for (const m of hOut[n] || []) if (!s.has(m)) { s.add(m); st.push(m); } } return s; };
  const triggers = knoten.filter(k => k.typ === 'trigger').map(k => k.id);
  const reachable = new Set(triggers);
  for (const t of triggers) for (const r of reachFrom(t)) reachable.add(r);
  const istVorfahre = (a, b) => reachFrom(a).has(b);
  const vorfahren = x => { const s = new Set(), st = [x]; while (st.length) { const c = st.pop(); for (const p of hIn[c] || []) if (!s.has(p)) { s.add(p); st.push(p); } } return s; };
  const normArt = p => String(p || '').toLowerCase().replace(/^\.\//, '').replace(/[_\s-]+/g, '-');
  // artefakt kann String ODER Liste sein; Wildcards (folder/*.mp4) meinen einen
  // ganzen Ausgabe-Ordner, keine einzelne umkämpfte Datei → für DRIFT-1 ignoriert.
  const konkreteArtefakte = k => (Array.isArray(k.artefakt) ? k.artefakt : (k.artefakt ? [k.artefakt] : []))
    .filter(a => typeof a === 'string' && a && !a.includes('*'));

  const befunde = [];
  const add = (schwere, art, text) => befunde.push({ schwere, art, text });
  try {

  // DRIFT-1 — Doppelter Produzent: zwei aktive Agenten schreiben dieselbe KONKRETE
  // Datei (Pfade normalisiert: a-b.md == a_b.md) — UND liegen nicht auf derselben
  // Kette. Sequenzielle Schritte, die eine Log-/Status-Datei fortschreiben, sind
  // legitim; nur PARALLELE Autoren desselben Erzeugnisses konkurrieren.
  const byArt = {};
  for (const k of knoten) {
    if (k.typ !== 'agent' || !live(k.id) || !reachable.has(k.id)) continue;
    for (const a of konkreteArtefakte(k)) { const key = normArt(a); if (key) (byArt[key] || (byArt[key] = [])).push(k); }
  }
  for (const [key, ksAll] of Object.entries(byArt)) {
    const ks = [...new Set(ksAll)];
    const konkurrenten = new Set();
    for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++)
      if (!istVorfahre(ks[i].id, ks[j].id) && !istVorfahre(ks[j].id, ks[i].id)) { konkurrenten.add(ks[i]); konkurrenten.add(ks[j]); }
    if (konkurrenten.size >= 2)
      add('gold', 'Doppelter Produzent', `${[...konkurrenten].map(k => `„${k.name}"`).join(' + ')} erzeugen unabhängig dieselbe Datei (${key}) — zwei Bausteine, EIN Job. Konkurrierende Strecken?`);
  }

  // DRIFT-2 — Disjunkte Herkunft: zwei Strecken ohne gemeinsamen Ursprung treffen
  // sich (zwei geklebte Pipelines). Diamant aus EINEM Ursprung bleibt still.
  // Guards: Trigger-Eltern = Mehrfach-Eingang legitim; Rückkante = Retry.
  for (const n of knoten) {
    let parents = (hIn[n.id] || []).filter(p => live(p) && reachable.has(p) && !istVorfahre(n.id, p) && byId[p].typ !== 'trigger');
    for (let i = 0; i < parents.length; i++) for (let j = i + 1; j < parents.length; j++) {
      const a = parents[i], b = parents[j];
      if (istVorfahre(a, b) || istVorfahre(b, a)) continue;
      const va = vorfahren(a), vb = vorfahren(b);
      if (![...va].some(x => vb.has(x)))
        add('gold', 'Disjunkte Herkunft', `„${byId[a].name}" und „${byId[b].name}" laufen beide auf „${n.name}" zu, aus GETRENNTEN Ursprüngen — zwei Strecken treffen sich. Altes Pipeline-Stück neben dem neuen stehen geblieben?`);
    }
  }

  // DRIFT-4 — Verwaister Baustein: gebauter Agent ohne Haupt-Anschluss (sieht live
  // aus, hängt am Fluss an nichts); Wissen/Tool, das keine Kante berührt.
  for (const k of knoten) {
    if (inaktiv(k.id)) continue;
    if (k.typ === 'agent') {
      if (!(hIn[k.id] || []).length && !(hOut[k.id] || []).length)
        add('grau', 'Verwaister Baustein', `„${k.name}" sieht live aus, hängt aber an keiner Haupt-Kante — nichts routet hinein oder hinaus. Altlast oder vergessener Anschluss?`);
    } else if (k.typ === 'wissen' || k.typ === 'tool') {
      if (!kanten.some(e => e.von === k.id || e.nach === k.id))
        add('grau', 'Verwaister Baustein', `„${k.name}" hängt an keiner Kante — von keinem Schritt genutzt. Künftiges Glied oder Altlast?`);
    }
  }

  // DRIFT-5 — Halbe Deklaration: experiment.ersetzt zeigt auf einen Knoten, den es
  // nicht gibt → die Ablösung greift nie, alt & neu laufen parallel weiter.
  if (wf.experiment && Array.isArray(wf.experiment.ersetzt))
    for (const id of wf.experiment.ersetzt) if (!byId[id])
      add('gold', 'Halbe Deklaration', `Das Experiment „${wf.experiment.name || '?'}" will „${id}" ablösen — diesen Knoten gibt es nicht. Der echte alte Baustein wird nie stillgelegt; alt & neu laufen weiter parallel.`);

  } catch (e) { /* Eine kaputte Kette darf nie das ganze Inventar sprengen. */ }
  return befunde;
}

function berechneBefund(proj, wfs, skills, dbs) {
  const befunde = [];
  // 1) Referenz zeigt ins Leere (rot): Datei fehlt — kaputt oder benannt-aber-ungebaut.
  for (const w of wfs) {
    for (const k of w.knoten) {
      if (k.ref && BAUSTEIN_DATEI[k.typ] && bausteinFehlt(proj, k)) {
        befunde.push({
          schwere: 'rot', art: 'Leere Referenz',
          text: `Workflow „${w.name}": Knoten „${k.name}" verweist auf ${k.ref} — die Datei fehlt. Kaputt oder noch nicht gebaut?`,
          ziel: `#/w/${proj.name}/${w.kurz}`, projekt: proj.name,
        });
      }
    }
  }
  // 2) Datenbanken ohne Anschluss (gold): Horten-Verdacht.
  const gelesen = new Set(), beschrieben = new Set();
  for (const w of wfs) {
    const byId = Object.fromEntries(w.knoten.map(k => [k.id, k]));
    for (const k of w.kanten) {
      if (k.typ === 'liest') { const d = byId[k.von]; if (d && d.ref) gelesen.add(path.basename(d.ref)); }
      if (k.typ === 'schreibt') { const d = byId[k.nach]; if (d && d.ref) beschrieben.add(path.basename(d.ref)); }
    }
  }
  for (const d of dbs) {
    const l = gelesen.has(d.id), s = beschrieben.has(d.id);
    if (!l && !s) befunde.push({ schwere: 'gold', art: 'Datenbank unverbunden', text: `„${d.id}" hängt an keinem Workflow — Horten-Verdacht oder Altlast.`, ziel: '#/datenbanken', projekt: proj.name });
    else if (!l) befunde.push({ schwere: 'gold', art: 'Niemand liest', text: `In „${d.id}" wird geschrieben, aber kein Workflow liest daraus — Daten ohne Zweck?`, ziel: '#/datenbanken', projekt: proj.name });
  }
  // 3) Dubletten-Verdacht (gold): zwei Skills mit gleichem erstem Namens-Wort.
  for (let i = 0; i < skills.length; i++) {
    for (let j = i + 1; j < skills.length; j++) {
      const a = skills[i].id.split('-')[0], b = skills[j].id.split('-')[0];
      if (a.length >= 4 && a === b) {
        befunde.push({ schwere: 'gold', art: 'Dubletten-Verdacht', text: `„${skills[i].id}" und „${skills[j].id}" — zweimal dasselbe Werkzeug?`, ziel: '#/skills', projekt: proj.name });
      }
    }
  }
  // 4) Lose Skills (grau): künftige Glieder oder Ausmist-Kandidaten.
  for (const s of skills) {
    if (!s.inKetten.length) befunde.push({ schwere: 'grau', art: 'Loser Skill', text: `„${s.id}" ist in keiner Kette — künftiges Glied oder Ausmist-Kandidat.`, ziel: '#/skills', projekt: proj.name });
  }
  // 5) Workflow-Drift (strukturell): konkurrierende / veraltete Bausteine je Kette.
  for (const w of wfs) {
    for (const d of berechneDrift(w))
      befunde.push({ ...d, ziel: `#/w/${proj.name}/${w.kurz}`, projekt: proj.name });
  }
  return befunde;
}

async function buildInventar() {
  const warnungen = [];
  const projekte = readProjekte(warnungen);
  const inv = { projekte: [], agenten: [], workflows: [], skills: [], tools: [], software: [], softwareBausteine: [], datenbanken: [], einstellungen: { befehle: [], systemSkills: [] }, befunde: [], warnungen, gelesen: new Date().toISOString() };

  for (const proj of projekte) {
    const wfs = readWorkflows(proj, warnungen);
    const ags = readAgenten(proj, warnungen);
    inv.agenten.push(...ags.map(a => ({
      kurz: a.kurz, projekt: proj.name, name: a.name, beschreibung: a.beschreibung,
      mission: a.mission, tags: a.tags, workflows: a.workflows,
      bausteine: a.bausteine, geister: a.geister,
      datei: a.datei, mtime: a.mtime,
    })));
    // Leere Referenzen in Agent-Ketten — gleiche Ehrlichkeit wie bei Workflows.
    for (const a of ags) for (const k of a.knoten) {
      if (k.ref && (k.typ === 'workflow' || BAUSTEIN_DATEI[k.typ]) && bausteinFehlt(proj, k)) {
        inv.befunde.push({
          schwere: 'rot', art: 'Leere Referenz',
          text: `Agent „${a.name}": Knoten „${k.name}" verweist auf ${k.ref} — die Datei fehlt. Kaputt oder noch nicht gebaut?`,
          ziel: `#/a/${proj.name}/${a.kurz}`, projekt: proj.name,
        });
      }
    }
    const skills = Object.values(readSkills(proj)).sort((a, b) => a.id.localeCompare(b.id));
    for (const s of skills) s.inKetten = wfs.filter(w => w.refs.has(s.id)).map(w => w.kurz);
    const dbs = readDatenbanken(proj);
    inv.projekte.push({ name: proj.name, pfad: proj.pfad });
    inv.workflows.push(...wfs.map(w => ({
      kurz: w.kurz, projekt: proj.name, name: w.name, beschreibung: w.beschreibung, tags: w.tags,
      knotenZahl: w.knoten.length, bausteine: w.bausteine, geister: w.geister,
      datei: w.datei, mtime: w.mtime,
    })));
    inv.skills.push(...skills);
    inv.tools.push(...readTools(proj));
    const sws = readSoftwares(proj);
    inv.software.push(...sws);
    // Software-Bausteine: das Innenleben aller Software mit Agentik-Karte —
    // KI-Agenten, Wissens-Dateien, interne Speicher. Gelesen aus agentik.json.
    for (const s of sws) {
      if (!s.agentik) continue;
      const ag = readAgentik(proj, s.id);
      if (!ag || ag.fehler) continue;
      // Über alle internen Workflows sammeln; geteilte Bausteine (gleiche id) nur einmal.
      const agWfs = Array.isArray(ag.workflows) && ag.workflows.length ? ag.workflows : [{ knoten: ag.knoten || [] }];
      const schonDa = new Set();
      for (const w of agWfs) for (const k of w.knoten || []) {
        if (!['agent', 'wissen', 'datenbank', 'tool'].includes(k.typ) || schonDa.has(k.id)) continue;
        schonDa.add(k.id);
        inv.softwareBausteine.push({
          id: k.id, typ: k.typ, name: k.name, beschreibung: k.beschreibung || '',
          sub: k.sub || '', software: s.name, swId: s.id, projekt: proj.name,
          datei: ag.datei, mtime: ag.mtime,
        });
      }
      // Workflow-Drift auch im Software-Innenleben (dort lebt der Cartoon-Fall).
      for (const w of agWfs) {
        const ziel = w.name
          ? `#/s/${encodeURIComponent(proj.name)}/${encodeURIComponent(s.id)}/${encodeURIComponent(w.name)}`
          : `#/s/${encodeURIComponent(proj.name)}/${encodeURIComponent(s.id)}`;
        for (const d of berechneDrift(w))
          inv.befunde.push({ ...d, ziel, projekt: `${proj.name} · ${s.name}` });
      }
    }
    inv.datenbanken.push(...dbs);
    const einst = readEinstellungen(proj);
    inv.einstellungen.befehle.push(...einst.befehle);
    inv.einstellungen.systemSkills.push(...einst.systemSkills);
    inv.befunde.push(...berechneBefund(proj, wfs, skills, dbs));
  }
  // Software: läuft sie gerade? Parallel am Port geprüft — reine Berechnung.
  await Promise.all(inv.software.map(async s => { s.laeuft = s.url ? await portOffen(s.url) : null; }));
  for (const s of inv.software) if (!s.url) inv.befunde.push({
    schwere: 'gold', art: 'Software ohne url',
    text: `„${s.id}": im README-Frontmatter fehlt url — der Öffnen-Klick weiß nicht wohin.`,
    ziel: '#/software', projekt: s.projekt,
  });
  const rang = { rot: 0, gold: 1, grau: 2 };
  inv.befunde.sort((a, b) => (rang[a.schwere] ?? 3) - (rang[b.schwere] ?? 3));
  return inv;
}

// ── HTTP ──────────────────────────────────────────────────────────────────────
const STATIC = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/graph.js': ['graph.js', 'text/javascript; charset=utf-8'],
};

function json(res, payload) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('Cache-Control', 'no-store'); // Reload = frisch lesen, immer.

  // Ordner im Finder öffnen — verändert keine Dateien, öffnet nur das Fenster in den Ordner.
  // Erlaubt sind ausschließlich Pfade INNERHALB registrierter Projekte.
  if (url.pathname === '/api/ordner-oeffnen' && req.method === 'POST') {
    let body = '';
    req.on('data', d => { body += d; });
    req.on('end', () => {
      try {
        const { p, datei, reveal } = JSON.parse(body || '{}');
        const warn = [];
        const proj = readProjekte(warn).find(x => x.name === p);
        if (!proj) return json(res, { ok: false, fehler: 'Projekt unbekannt.' });
        const wurzel = path.resolve(proj.pfad);
        // reveal = die Datei selbst im Finder markieren (open -R, zum Durchlesen);
        // sonst den umgebenden Ordner öffnen (bisheriges Verhalten).
        const ziel = reveal
          ? path.resolve(wurzel, String(datei || '.'))
          : path.resolve(wurzel, path.dirname(String(datei || '.')));
        if (ziel !== wurzel && !ziel.startsWith(wurzel + path.sep)) return json(res, { ok: false, fehler: 'Pfad liegt außerhalb des Projekts.' });
        if (!fs.existsSync(ziel)) return json(res, { ok: false, fehler: (reveal ? 'Datei' : 'Ordner') + ' existiert nicht.' });
        execFile('open', reveal ? ['-R', ziel] : [ziel]); // macOS Finder
        return json(res, { ok: true });
      } catch (err) {
        return json(res, { ok: false, fehler: err.message });
      }
    });
    return;
  }

  try {
    // Leser: den INHALT einer MD-Datei liefern — für die schwebenden Lese-Pages im Tool
    // (Gaylords Ansage 15.07.2026: Skills liest man in AWMS, nicht in VS Code).
    if (url.pathname === '/api/lesen') {
      const warn = [];
      const proj = readProjekte(warn).find(x => x.name === url.searchParams.get('p'));
      if (!proj) return json(res, { ok: false, fehler: 'Projekt unbekannt.' });
      const wurzel = path.resolve(proj.pfad);
      const ziel = path.resolve(wurzel, String(url.searchParams.get('datei') || ''));
      if (ziel !== wurzel && !ziel.startsWith(wurzel + path.sep)) return json(res, { ok: false, fehler: 'Pfad liegt außerhalb des Projekts.' });
      if (!fs.existsSync(ziel) || !fs.statSync(ziel).isFile()) return json(res, { ok: false, fehler: 'Datei existiert nicht.' });
      if (fs.statSync(ziel).size > 400000) return json(res, { ok: false, fehler: 'Datei zu groß für den Leser — im Finder öffnen.' });
      return json(res, { ok: true, inhalt: fs.readFileSync(ziel, 'utf8'), mtime: mtimeIso(ziel) });
    }
    if (url.pathname === '/api/graph')
      return json(res, buildGraph(url.searchParams.get('p') || undefined, url.searchParams.get('wf') || undefined, url.searchParams.get('ebene') || undefined));
    if (url.pathname === '/api/agentik')
      return json(res, buildAgentikGraph(url.searchParams.get('p') || undefined, url.searchParams.get('sw') || '', url.searchParams.get('awf') || undefined, url.searchParams.get('ebene') || undefined));
    if (url.pathname === '/api/agent')
      return json(res, buildAgentGraph(url.searchParams.get('p') || undefined, url.searchParams.get('ag') || undefined));
    if (url.pathname === '/api/inventar') return json(res, await buildInventar());
    if (url.pathname === '/api/usage') return json(res, leseUsage());
  } catch (err) {
    return json(res, { fehler: 'Konnte die Dateien nicht lesen: ' + err.message });
  }
  const hit = STATIC[url.pathname];
  if (hit) {
    const txt = readSafe(path.join(APP, hit[0]));
    if (txt !== null) {
      res.writeHead(200, { 'Content-Type': hit[1] });
      res.end(txt);
      return;
    }
  }
  if (url.pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 — kennt AWMS nicht');
});

server.listen(PORT, '127.0.0.1', () => { // nur Loopback — lokal heisst lokal
  console.log(`AWMS laeuft: http://localhost:${PORT}`);
  console.log('Registrierte Projekte stehen in projekte.json; Reload liest alles frisch.');
});
