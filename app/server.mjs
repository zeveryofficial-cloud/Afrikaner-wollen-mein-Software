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
const BAUSTEIN_DIRS = ['.claude/skills', 'workflows', 'datenbanken', 'tools', 'software'];
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
    if (!fs.existsSync(p.pfad)) { warnungen.push(`Projekt "${p.name}": Ordner ${p.pfad} existiert nicht.`); continue; }
    add(p.name, p.pfad);
  }
  // 2) Wurzeln: jeder Unterordner mit Bausteinen wird automatisch ein Projekt (kein Registrieren noetig).
  for (const w of parsed.wurzeln || []) {
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
    if (attrs.awms === 'system') continue; // Produkt-Skills des Tools sind keine Business-Bausteine
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
// Tools erweitern die KI, Software bedient Viktor selbst. README.md mit Frontmatter:
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
  // Eine Software hat MEHRERE Workflows mit je eigenem Trigger (Viktors Entscheid:
  // „Cartoon-Ad anlegen ist ein anderer Trigger als B-Roll-Ad"). Alt-Format = einer.
  const wfs = Array.isArray(ag.workflows) && ag.workflows.length
    ? ag.workflows
    : [{ name: 'Ablauf', beschreibung: ag.beschreibung, knoten: ag.knoten || [], kanten: ag.kanten || [] }];
  const awf = wfs.find(w => w.name === wfName) || wfs[0];

  // ── Ebenen: „Aktuell" vs „Idee" (Viktors Unterscheidung) ──
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
  const knoten = alleK.map(k => {
    const out = {
      ...k, projekt: proj.name,
      sub: k.sub || SUB[k.typ] || k.typ,
      datei: ag.datei, mtime: ag.mtime,
    };
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
    return out;
  });
  const geplantN = alleK.filter(k => k.geplant).length;
  return {
    agentik: true,
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
      datei: ag.datei, bausteine: alleK.length, geister: geplantN, spaeterZahl: 0,
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
    art: /^\s*vektor/i.test(attrs.typ || '') ? 'vektor' : 'normal',
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
function bausteinFehlt(proj, k) {
  if (!BAUSTEIN_DATEI[k.typ]) return false;
  if (!k.ref) return true;
  return !fs.existsSync(path.join(proj.pfad, k.ref, BAUSTEIN_DATEI[k.typ]));
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
    const bausteinKnoten = (parsed.knoten || []).filter(k => BAUSTEIN_DATEI[k.typ]);
    out.push({
      kurz,
      projekt: proj.name,
      bausteine: bausteinKnoten.length,
      geister: bausteinKnoten.filter(k => bausteinFehlt(proj, k)).length,
      // Bewusst zurückgestellte Geister („mach ich später") — zählen nicht als offene Arbeit.
      spaeterZahl: bausteinKnoten.filter(k => k.spaeter && bausteinFehlt(proj, k)).length,
      name: parsed.name || kurz,
      beschreibung: parsed.beschreibung || '',
      tags: parsed.tags || [],
      knoten: parsed.knoten || [],
      kanten: parsed.kanten || [],
      notizen: parsed.notizen || [],
      datei: `workflows/${f}`,
      mtime: mtimeIso(p),
      refs: new Set((parsed.knoten || []).filter(k => k.ref).map(k => path.basename(k.ref))),
    });
  }
  return out;
}

// ── Workflow-Graph (eine Kette im Detail) ─────────────────────────────────────
function buildGraph(projektName, wfKurz) {
  const warnungen = [];
  const projekte = readProjekte(warnungen);
  if (projekte.length === 0) return { fehler: 'Kein Projekt registriert — sag es im Chat („registriere den Ordner X").', warnungen };
  const proj = projekte.find(p => p.name === projektName) || projekte[0];
  const wfs = readWorkflows(proj, warnungen);
  if (wfs.length === 0) return { fehler: `Projekt "${proj.name}" hat noch keine Workflow-Dateien (workflows/*.json).`, warnungen };
  const wf = wfs.find(w => w.kurz === wfKurz) || wfs[0];

  const skills = readSkills(proj);
  const knoten = wf.knoten.map(k => {
    const out = { ...k, projekt: proj.name };
    if (bausteinFehlt(proj, k)) {
      // Geist: geplanter Baustein — kein Fehler, sondern Entwurfs-Zustand.
      out.geist = true;
      out.spaeter = !!k.spaeter; // bewusst zurückgestellt — eigener Look, kein offener Geist
      out.sub = k.spaeter ? 'später' : 'geplant';
      out.datei = wf.datei; out.mtime = wf.mtime;
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
      const t = readTool(proj, k.ref);
      if (t) {
        out.datei = t.datei; out.mtime = t.mtime;
        out.beschreibungDatei = t.beschreibung;
        out.sub = 'Tool';
      } else {
        warnungen.push(`Knoten "${k.id}": ${k.ref}/README.md fehlt`);
        out.sub = 'Tool';
      }
    } else if (k.typ === 'software' && k.ref) {
      const s = readSoftwareEintrag(proj, k.ref);
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
      const d = readDatenbank(proj, k.ref);
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
    return out;
  });

  return {
    workflow: {
      name: wf.name, kurz: wf.kurz, projekt: proj.name, beschreibung: wf.beschreibung,
      tags: wf.tags, datei: wf.datei, bausteine: wf.bausteine, geister: wf.geister,
      spaeterZahl: wf.spaeterZahl,
    },
    knoten,
    kanten: wf.kanten,
    notizen: wf.notizen,
    warnungen,
    gelesen: new Date().toISOString(),
  };
}

// ── Übersicht: Meta-Graph — Workflows aller Projekte, verbunden über Datenbanken ──
function buildUebersicht() {
  const warnungen = [];
  const projekte = readProjekte(warnungen);
  const knoten = [];
  const kanten = [];
  const gesehen = new Set();

  for (const proj of projekte) {
    const wfs = readWorkflows(proj, warnungen);
    for (const w of wfs) {
      knoten.push({
        id: `wf:${proj.name}/${w.kurz}`,
        typ: 'workflow',
        name: w.name,
        kurz: w.kurz,
        projekt: proj.name,
        beschreibung: w.beschreibung,
        tags: w.tags,
        // Offene Geister = Geister minus bewusst zurückgestellte („später") — nur die zählen.
        geist: w.geister - w.spaeterZahl > 0,
        zone: (w.tags && w.tags[0]) || 'allgemein',
        sub: w.geister - w.spaeterZahl > 0
          ? `Entwurf · ${w.bausteine - w.geister}/${w.bausteine - w.spaeterZahl} Bausteine stehen`
          : `${w.knoten.length} Knoten · ${proj.name}${w.spaeterZahl ? ` · ${w.spaeterZahl} später` : ''}`,
        datei: w.datei,
        mtime: w.mtime,
      });
    }
    for (const d of readDatenbanken(proj)) {
      knoten.push({
        id: `db:${proj.name}/${d.id}`, typ: 'datenbank', name: d.name, projekt: proj.name,
        sub: d.typ.split('(')[0].trim(), art: d.art, db: d, datei: d.datei, mtime: d.mtime,
      });
    }
    // Kanten: welcher Workflow liest aus / schreibt in welche Datenbank.
    for (const w of wfs) {
      const knotenById = Object.fromEntries(w.knoten.map(k => [k.id, k]));
      for (const k of w.kanten) {
        if (k.typ !== 'liest' && k.typ !== 'schreibt') continue;
        const dbKnoten = knotenById[k.typ === 'liest' ? k.von : k.nach];
        if (!dbKnoten || !dbKnoten.ref) continue;
        const dbId = `db:${proj.name}/${path.basename(dbKnoten.ref)}`;
        const wfId = `wf:${proj.name}/${w.kurz}`;
        const kante = k.typ === 'liest'
          ? { von: dbId, nach: wfId, typ: 'liest' }
          : { von: wfId, nach: dbId, typ: 'schreibt' };
        const key = kante.von + '→' + kante.nach + ':' + kante.typ;
        if (!gesehen.has(key)) { gesehen.add(key); kanten.push(kante); }
      }
    }
  }

  return { knoten, kanten, projekte: projekte.map(p => p.name), warnungen, gelesen: new Date().toISOString() };
}

// ── Inventar: alles für Seitenleiste + Listen-Seiten + Befund ─────────────────
// Der Befund ist der „Arztbrief" zum Röntgenbild: berechnete Auffälligkeiten.
// Alles aus Datei-Fakten — nichts wird gepflegt, jeder Reload rechnet frisch.
function berechneBefund(proj, wfs, skills, dbs) {
  const befunde = [];
  // 1) Referenz zeigt ins Leere (rot): Datei fehlt — kaputt oder benannt-aber-ungebaut.
  for (const w of wfs) {
    for (const k of w.knoten) {
      if (k.ref && BAUSTEIN_DATEI[k.typ] && bausteinFehlt(proj, k) && !k.spaeter) {
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
  return befunde;
}

async function buildInventar() {
  const warnungen = [];
  const projekte = readProjekte(warnungen);
  const inv = { projekte: [], workflows: [], skills: [], tools: [], software: [], softwareBausteine: [], datenbanken: [], befunde: [], warnungen, gelesen: new Date().toISOString() };

  for (const proj of projekte) {
    const wfs = readWorkflows(proj, warnungen);
    const skills = Object.values(readSkills(proj)).sort((a, b) => a.id.localeCompare(b.id));
    for (const s of skills) s.inKetten = wfs.filter(w => w.refs.has(s.id)).map(w => w.kurz);
    const dbs = readDatenbanken(proj);
    inv.projekte.push({ name: proj.name, pfad: proj.pfad });
    inv.workflows.push(...wfs.map(w => ({
      kurz: w.kurz, projekt: proj.name, name: w.name, beschreibung: w.beschreibung, tags: w.tags,
      knotenZahl: w.knoten.length, bausteine: w.bausteine, geister: w.geister,
      spaeterZahl: w.spaeterZahl,
      // Konzept = reine Geister-Kette: kein einziger Baustein existiert als Datei.
      nurGeister: w.bausteine > 0 && w.geister === w.bausteine,
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
    }
    inv.datenbanken.push(...dbs);
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

  // Die EINZIGE Schreib-Aktion des Tools (Viktors Entscheid): reine Konzept-Entwürfe
  // (ausschließlich Geister) dürfen im UI gelöscht werden. Der Server prüft das frisch —
  // sobald auch nur EIN Baustein wirklich existiert, lehnt er ab (Löschen dann im Chat).
  if (url.pathname === '/api/konzept-loeschen' && req.method === 'POST') {
    let body = '';
    req.on('data', d => { body += d; });
    req.on('end', () => {
      try {
        const { p, wf } = JSON.parse(body || '{}');
        if (!wf || wf.includes('/') || wf.includes('..')) return json(res, { ok: false, fehler: 'Ungueltiger Name.' });
        const warn = [];
        const proj = readProjekte(warn).find(x => x.name === p);
        if (!proj) return json(res, { ok: false, fehler: 'Projekt unbekannt.' });
        const w = readWorkflows(proj, warn).find(x => x.kurz === wf);
        if (!w) return json(res, { ok: false, fehler: 'Workflow nicht gefunden.' });
        if (!(w.bausteine > 0 && w.geister === w.bausteine)) {
          return json(res, { ok: false, fehler: 'Kein reines Konzept — es existieren gebaute Bausteine. Löschen bitte im Chat.' });
        }
        fs.unlinkSync(path.join(proj.pfad, 'workflows', wf + '.json'));
        return json(res, { ok: true });
      } catch (err) {
        return json(res, { ok: false, fehler: err.message });
      }
    });
    return;
  }

  // Ordner im Finder öffnen — verändert keine Dateien, öffnet nur das Fenster in den Ordner.
  // Erlaubt sind ausschließlich Pfade INNERHALB registrierter Projekte.
  if (url.pathname === '/api/ordner-oeffnen' && req.method === 'POST') {
    let body = '';
    req.on('data', d => { body += d; });
    req.on('end', () => {
      try {
        const { p, datei } = JSON.parse(body || '{}');
        const warn = [];
        const proj = readProjekte(warn).find(x => x.name === p);
        if (!proj) return json(res, { ok: false, fehler: 'Projekt unbekannt.' });
        const wurzel = path.resolve(proj.pfad);
        const ziel = path.resolve(wurzel, path.dirname(String(datei || '.')));
        if (ziel !== wurzel && !ziel.startsWith(wurzel + path.sep)) return json(res, { ok: false, fehler: 'Pfad liegt außerhalb des Projekts.' });
        if (!fs.existsSync(ziel)) return json(res, { ok: false, fehler: 'Ordner existiert nicht.' });
        execFile('open', [ziel]); // macOS Finder
        return json(res, { ok: true });
      } catch (err) {
        return json(res, { ok: false, fehler: err.message });
      }
    });
    return;
  }

  try {
    if (url.pathname === '/api/graph')
      return json(res, buildGraph(url.searchParams.get('p') || undefined, url.searchParams.get('wf') || undefined));
    if (url.pathname === '/api/agentik')
      return json(res, buildAgentikGraph(url.searchParams.get('p') || undefined, url.searchParams.get('sw') || '', url.searchParams.get('awf') || undefined, url.searchParams.get('ebene') || undefined));
    if (url.pathname === '/api/uebersicht') return json(res, buildUebersicht());
    if (url.pathname === '/api/inventar') return json(res, await buildInventar());
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
