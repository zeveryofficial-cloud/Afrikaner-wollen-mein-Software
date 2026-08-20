// AWMS Graph-Engine — rendert den Workflow-Graph UND den Übersichts-Meta-Graph.
// Read-only: zeichnet, was die APIs aus den Dateien lesen, sonst nichts.
// Optik & Interaktion: 1:1 vom gewählten Referenz-Design (referenz/graph-design-beispiel.html).
'use strict';
window.AWMS = (function () {

  // ── Ein Logo pro Baustein-Typ (Gaylords Entscheidung: alles Gleiche sieht gleich aus) ──
  const LOGO = {
    // Skill: Doppel-Funke (standardisierte KI-Prozedur) — rosa
    skill: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M11 4.5C11.72 8.2 14.3 10.78 18 11.5c-3.7.72-6.28 3.3-7 7-.72-3.7-3.3-6.28-7-7 3.7-.72 6.28-3.3 7-7Z"/><path d="M18.5 14.5c.35 1.85 1.65 3.15 3.5 3.5-1.85.35-3.15 1.65-3.5 3.5-.35-1.85-1.65-3.15-3.5-3.5 1.85-.35 3.15-1.65 3.5-3.5Z" stroke-width="1.4"/></svg>',
    // Tool: Schraubenschlüssel — grau
    tool: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    // Software: Monitor — blau (vom MENSCHEN bedient, kein Baustein; Doppelklick öffnet die url)
    software: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M9 21h6M12 17.5V21"/></svg>',
    // Datenbank: Zylinder — lila
    datenbank: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5.5" rx="7" ry="2.5"/><path d="M5 5.5V18c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V5.5"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/></svg>',
    // Vektor-Datenbank: Zylinder mit Embedding-Konstellation — gleiche Lila-Familie, eigener Look
    vektor: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="7" ry="2.4"/><path d="M5 5v13.4c0 1.3 3.1 2.4 7 2.4s7-1.1 7-2.4V5"/><path d="M9.1 11.6 15 10.5M9.1 11.6l3.1 4.3M15 10.5l-2.8 5.4" stroke-width="1.1"/><circle cx="9.1" cy="11.6" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="10.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="12.2" cy="15.9" r="1.2" fill="currentColor" stroke="none"/></svg>',
    // Wiki-Datenbank: Zylinder mit Artikel-Zeilen + Backlink-Punkt — gleiche Lila-Familie, eigener Look
    wiki: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="7" ry="2.4"/><path d="M5 5v13.4c0 1.3 3.1 2.4 7 2.4s7-1.1 7-2.4V5"/><path d="M8.4 10.6h7.2M8.4 13.5h3.6M8.4 16.4h5.2" stroke-width="1.1"/><circle cx="15.2" cy="13.5" r="1.2" fill="currentColor" stroke="none"/><path d="M12 13.5h2" stroke-width="1.1"/></svg>',
    // CSV-Datenbank: Zylinder mit Tabellen-Gitter (Spalten × Zeilen) — gleiche Lila-Familie, eigener Look
    csv: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="7" ry="2.4"/><path d="M5 5v13.4c0 1.3 3.1 2.4 7 2.4s7-1.1 7-2.4V5"/><path d="M8.3 11h7.4M8.3 14.2h7.4M10.75 8.8v7.6M13.75 8.8v7.6" stroke-width="1.1"/></svg>',
    // Workflow: zwei verkettete Knoten — orange
    workflow: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3.5" width="7" height="7" rx="2"/><rect x="14" y="13.5" width="7" height="7" rx="2"/><path d="M10 7h4.5a3 3 0 0 1 3 3v3.5"/></svg>',
    // KI-Agent (Agentik-Karte): Chip mit Funke — KI, die IM Code einer Software entscheidet
    agent: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="5.6" y="5.6" width="12.8" height="12.8" rx="3"/><path d="M9.5 3v2.6M14.5 3v2.6M9.5 18.4V21M14.5 18.4V21M3 9.5h2.6M3 14.5h2.6M18.4 9.5H21M18.4 14.5H21"/><path d="M12 8.7c.38 1.83 1.47 2.92 3.3 3.3-1.83.38-2.92 1.47-3.3 3.3-.38-1.83-1.47-2.92-3.3-3.3 1.83-.38 2.92-1.47 3.3-3.3Z"/></svg>',
    // Wissens-Datei (Agentik-Karte): Dokument — Skill/Prompt, den die Software-KI liest
    wissen: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M6 3.5h8l4.5 4.5v11.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z"/><path d="M14 3.5V8h4.5"/><path d="M8.5 12.2h7M8.5 15.6h5"/></svg>',
    // Homo Sapiens: ein Auge — DU schaust alles durch und entscheidest — gold
    gate: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3.1"/></svg>',
    // Externer Dienst (Agentik): Stecker — API/CLI/MCP, gibt der Software Fähigkeiten (Tool-Äquivalent) — grau
    dienst: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M9 2v5M15 2v5M6.5 7h11v3.2a5.5 5.5 0 0 1-11 0V7ZM12 15.7V22"/></svg>',
    // Trigger: Blitz
    trigger: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>',
    // Agent (die Rolle): gefaltete Kette — Gaylords Protein-Bild (Bausteine = Aminosäuren,
    // Workflows = Ketten, Agenten = gefaltete Proteine). Drei Glieder, zum Ring gefaltet.
    agenten: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="8.6" y="2.6" width="6.8" height="6.8" rx="2.2"/><rect x="2.7" y="14" width="6.8" height="6.8" rx="2.2"/><rect x="14.5" y="14" width="6.8" height="6.8" rx="2.2"/><path d="M8.6 6.9c-2.9.7-4.4 3.1-4 7.1M15.4 6.9c2.9.7 4.4 3.1 4 7.1M9.5 17.4h5"/></svg>',
    nutzung: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4.5 20.5h15"/><path d="M7.5 20.5v-5.5M12 20.5V9M16.5 20.5V12.5"/><path d="M5.5 6.5l4 -2.5 3.5 2 5-3.5"/></svg>',
    // Entwurf (Seitenleiste): gestrichelter Rahmen + Funke — der Bauplan
    entwurf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke-dasharray="3.4 3"/><path d="M12 7.8c.55 2.3 1.85 3.6 4.2 4.2-2.35.6-3.65 1.9-4.2 4.2-.55-2.3-1.85-3.6-4.2-4.2 2.35-.6 3.65-1.9 4.2-4.2Z" stroke-linejoin="round"/></svg>',
    // Befund (Seitenleiste): Puls-Linie — der Arztbrief zum Röntgenbild
    befund: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M3 12h4l2.2-5.5 4.4 11L16 12h5"/></svg>',
    // Einstellungen (Seitenleiste + Karten): Zahnrad mit runden Zähnen — das Werkzeug hinter AWMS
    einstellungen: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  };
  const TYP_LABEL = { trigger: 'Trigger', skill: 'Skill', tool: 'Tool', software: 'Software — Mensch bedient', datenbank: 'Datenbank', gate: 'Homo Sapiens — am Kochen', workflow: 'Workflow', agent: 'KI-Node', wissen: 'Software Skill — die MD-Datei, die die Software-KI liest' };

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wann = iso => { try { return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) + ' Uhr'; } catch { return '—'; } };

  // Genau EIN fit reagiert auf Fenster-Resize (der des aktuell gerenderten Graphen).
  let aktiverFit = null;
  let aktiverDots = null; // Punkte-Canvas des aktuellen Graphen bei Resize nachziehen
  window.addEventListener('resize', () => { if (aktiverFit) aktiverFit(); if (aktiverDots) aktiverDots(); });

  // Eingeklappte Daten-Ebene je Graph — ebenfalls reine Optik, lebt nur im Browser.
  const EBENE_ZU = {};

  // ── Haupt-Renderer ────────────────────────────────────────────────────────────
  function renderGraph(content, g, opts = {}) {
    const meta = !!opts.meta;
    content.className = '';
    aktiverFit = null;

    if (g.fehler) {
      content.innerHTML = '';
      zeigFehler(content, 'Graph kann nicht gerendert werden', g.fehler);
      return;
    }

    const kopf = meta
      ? `<div class="wf-name">Übersicht <span class="tag">alle Workflows · verbunden über Datenbanken</span></div>`
      : (() => {
          const w = g.workflow;
          const aktiv = w.geister || 0;
          // Agentik-Karte ist LAUFENDE Software, kein Von-0-Entwurf: geplante Knoten
          // heißen „geplant", nicht „Entwurf" — sonst wirkt gebaute Software wie eine Skizze.
          const zustand = aktiv > 0
            ? ` <span class="tag entwurf">◐ ${w.bausteine - w.geister} von ${w.bausteine} Bausteinen gebaut${g.agentik ? ` · ${aktiv} geplant` : ''}</span>`
            : ` <span class="tag">${esc(w.datei)}</span>`;
          return `<div class="wf-name">${esc(w.name)} <span class="tag geld">${esc(w.projekt)}</span>` + zustand +
            w.tags.map(t => ` <span class="tag">${esc(t)}</span>`).join('') + '</div>';
        })();

    // Agentik-Karte: die Tab-Pille wechselt zwischen den internen Workflows der Software
    // (je eigener Trigger — „Cartoon-Ad anlegen ist ein anderer Trigger als B-Roll-Ad").
    const tabs = (meta || g.agentRolle) ? '' : g.agentik
      ? (g.agentikWfs && g.agentikWfs.length > 1
          ? `<div class="tabs">${g.agentikWfs.map(w =>
              `<div class="tab${w === g.aktivWf ? ' on' : ''}" data-awf="${esc(w)}">${esc(w)}</div>`).join('')}</div>`
          : '')
      : `<div class="tabs">
        <div class="tab on">Editor</div>
        <div class="tab dis" title="Executions kommen in v2 — dann färben sich gelaufene Ketten grün/rot und Bottlenecks werden sichtbar">Executions<sup>v2</sup></div>
      </div>`;
    // Ebenen-Umschalter (nur wenn der Workflow eine EXPERIMENTELLE IDEE trägt):
    // „Aktuell" = das Gebaute · „Idee" = der Ersatz-Vorschlag. Nie beides zugleich.
    const ebenen = g.ebenen ? `<div class="tabs ebenen" title="${esc(g.ebenen.idee)}">
        <div class="tab${g.ebenen.aktiv === 'aktuell' ? ' on' : ''}" data-ebene="aktuell">Aktuell</div>
        <div class="tab idee${g.ebenen.aktiv === 'idee' ? ' on' : ''}" data-ebene="idee">Idee</div>
      </div>` : '';
    content.innerHTML = `
      ${tabs}${ebenen}
      <div class="hdr">
        ${kopf}
        ${opts.aktivierungsText ? `<div class="hsp"></div>
        <button class="btn2" id="g-akt" title="In einen NEUEN Chat einfügen — der Workflow läuft (Skill /ausfuehren)">Aktivierungs-Prompt</button>` : ''}
      </div>
      <div id="vp"><canvas id="dots"></canvas><div id="plane">
        <svg id="wires" xmlns="http://www.w3.org/2000/svg">
          <defs><marker id="arr" viewBox="-6 -5 12 10" markerWidth="12.5" markerHeight="12.5" orient="auto" refX="0" refY="0"><polygon points="-5,-4 0,0 -5,4"></polygon></marker></defs>
          <g id="wireg"></g>
        </svg>
      </div></div>
      <div class="zctl">
        ${!meta && g.knoten.some(n => n.typ === 'datenbank' || n.typ === 'wissen')
          ? `<button class="zbtn eb" id="z-eb" title="Daten-Ebene ausblenden">${LOGO.datenbank}</button>` : ''}
        <button class="zbtn" id="z-fit" title="Einpassen">⛶</button>
        <button class="zbtn" id="z-in" title="Zoom rein">+</button>
        <button class="zbtn" id="z-out" title="Zoom raus">−</button>
      </div>`;

    const vp = content.querySelector('#vp');
    const plane = content.querySelector('#plane');
    const wireg = content.querySelector('#wireg');

    // Interner-Workflow-Wechsel (Agentik-Tabs)
    content.querySelectorAll('[data-awf]').forEach(t => {
      t.onclick = () => { if (opts.aufAgentikWf && t.dataset.awf !== g.aktivWf) opts.aufAgentikWf(t.dataset.awf); };
    });

    // Ebenen-Wechsel: Aktuell ⇄ Idee (app.js schaltet über den Hash um)
    content.querySelectorAll('[data-ebene]').forEach(t => {
      t.onclick = () => { if (opts.aufEbene && !t.classList.contains('on')) opts.aufEbene(t.dataset.ebene); };
    });

    // Aktivierungs-Prompt kopieren (nur Workflow-Graphen — app.js reicht Text + Kopierer durch)
    const aktBtn = content.querySelector('#g-akt');
    if (aktBtn) aktBtn.onclick = async () => {
      const ok = opts.kopiere ? await opts.kopiere(opts.aktivierungsText) : false;
      aktBtn.textContent = ok ? 'kopiert ✓ — in neuen Chat einfügen' : 'Kopieren fehlgeschlagen';
      setTimeout(() => { aktBtn.textContent = 'Aktivierungs-Prompt'; }, 1800);
    };

    // ── Zustand ──
    const byId = {};
    let NODES = g.knoten.slice();
    let EDGES = g.kanten.slice();
    let rueckEdges = new Set(); // Rückwärts-Kanten (Kreise) — fürs Layout ausgeklammert, als Schleife gezeichnet
    let tx = 0, ty = 0, sc = 1, bewegt = false, drag = null;

    const notizKey = meta ? 'meta' : (g.workflow ? g.workflow.projekt + '/' + g.workflow.kurz : 'wf');

    // ── Agentik: Tool-Anrufe LOKAL zeichnen (Gaylords Entscheid: „wir können zweimal
    // Gemini haben") ── Ein geteiltes Tool wird nicht als EIN Knoten mit Spinnennetz
    // gezeigt, sondern je Agent als eigener Anruf-Baustein direkt ÜBER ihm — mit
    // sichtbarem Hin (prompt) und Zurück (antwort). In der DATEI bleibt das Tool ein
    // Eintrag; nur die Zeichnung dupliziert. Datenbanken bleiben die Ausnahme: EIN Knoten.
    if (g.agentik) (function toolAnrufe() {
      const inHaupt = new Set();
      for (const k of EDGES) if (k.typ === 'haupt') { inHaupt.add(k.von); inHaupt.add(k.nach); }
      const geteilte = NODES.filter(n => n.typ === 'tool' && !inHaupt.has(n.id));
      for (const t of geteilte) {
        for (const k of EDGES.filter(e => e.typ === 'nutzt' && e.nach === t.id)) {
          const ank = NODES.find(n => n.id === k.von);
          const klon = { ...t, id: t.id + '§' + k.von, obenTool: true, anker: k.von,
            status: t.status === 'fehler' ? 'fehler' : ((ank && ank.status) || t.status) };
          NODES.push(klon);
          EDGES.push({ von: k.von, nach: klon.id, typ: 'prompt' });
          EDGES.push({ von: klon.id, nach: k.von, typ: 'antwort' });
        }
      }
      NODES = NODES.filter(n => !geteilte.includes(n));
      EDGES = EDGES.filter(k => k.typ !== 'nutzt');
    })();

    // ── Workflow-Dienste: "dienste" am Knoten → eigener Stecker-Baustein ÜBER ihm,
    // mit Hin (prompt) und Zurück (antwort) — exakt die Agentik-Optik (Gaylords Entscheid:
    // wie in der Software, keine Mini-Chips). Die Datei kennt nur das Feld "dienste";
    // die Anruf-Bausteine sind reine Zeichnung, berechnet bei jedem Reload.
    if (!g.agentik) (function dienstAnrufe() {
      for (const n of NODES.filter(x => Array.isArray(x.dienste) && x.dienste.length)) {
        n.dienste.forEach((d, i) => {
          const klon = { id: n.id + '⌁' + i, typ: 'tool', name: d, sub: 'externer Dienst',
            obenTool: true, anker: n.id, dienstKnoten: true,
            beschreibung: `Externer Dienst: „${n.name}“ ruft ${d}.` };
          NODES.push(klon);
          EDGES.push({ von: n.id, nach: klon.id, typ: 'prompt' });
          EDGES.push({ von: klon.id, nach: n.id, typ: 'antwort' });
        });
      }
    })();

    // „unten" = liegt unterhalb der Kette und wird über liest/schreibt angebunden
    // (Datenbanken — und in Agentik-Karten die Wissens-Dateien der Software-KI).
    const unten = n => n.typ === 'datenbank' || n.typ === 'wissen';
    // Workflow-Knoten: in der (alten) Meta-Ansicht eine breite Zeile — im Agent-Graph
    // eine eigene lebendige Karte (wfb) mit berechneter Miniatur der echten Kette.
    const wfKarte = n => n.typ === 'workflow' && !meta;
    const breit = n => n.typ === 'datenbank' || (n.typ === 'workflow' && meta);
    const nodeW = n => wfKarte(n) ? 252 : breit(n) ? 230 : n.typ === 'gate' ? 88 : 96;
    const nodeH = n => wfKarte(n) ? 124 : n.typ === 'gate' ? 88 : 96;
    const cx = n => n.x + nodeW(n) / 2;
    const cy = n => n.y + nodeH(n) / 2;

    for (const n of NODES) byId[n.id] = n;

    // Wer hängt an der Daten-Ebene? — für den Daten-Chip bei eingeklappter Ebene.
    const datenVon = {};
    for (const k of EDGES) {
      const a = byId[k.von], b = byId[k.nach];
      if (!a || !b) continue;
      if (unten(a) && !unten(b)) (datenVon[b.id] ||= new Set()).add(a.name);
      else if (unten(b) && !unten(a)) (datenVon[a.id] ||= new Set()).add(b.name);
    }

    // ── Auto-Layout (verzweigungsfähig: Knoten gleicher Ebene stapeln vertikal) ──
    const CHAIN_Y = meta ? 280 : 300;
    let DB_Y = meta ? 560 : 580;
    (function layout() {
      if (meta) {
        // Übersicht: Zonen-Layout — Workflows nach Bereich (erstem Tag) gruppiert,
        // Datenbanken ziehen in die Zone ihrer Partner. Kurze Wege statt Spaghetti.
        const wfsN = NODES.filter(n => n.typ === 'workflow');
        const dbsN = NODES.filter(n => n.typ === 'datenbank');
        const zonen = [...new Set(wfsN.map(n => n.zone || 'allgemein'))].sort();
        const ZB = 320, GAP = 70, X0 = 90, Y0 = 150;
        const zx = z => X0 + zonen.indexOf(z) * (ZB + GAP);
        const proZone = {};
        wfsN.forEach(n => { const z = n.zone || 'allgemein'; (proZone[z] ||= []).push(n); });
        for (const z of Object.keys(proZone)) {
          proZone[z].forEach((n, i) => { n.x = zx(z) + (ZB - 230) / 2; n.y = Y0 + i * 170; });
        }
        // DB → Mehrheits-Zone ihrer Partner; ohne Partner → eigene Ecke „unverbunden".
        const dbProZone = {};
        for (const d of dbsN) {
          const partner = EDGES.filter(k => k.von === d.id || k.nach === d.id)
            .map(k => byId[k.von === d.id ? k.nach : k.von])
            .filter(n => n && n.typ === 'workflow');
          let zone = 'unverbunden';
          if (partner.length) {
            const zaehl = {};
            for (const p of partner) { const z = p.zone || 'allgemein'; zaehl[z] = (zaehl[z] || 0) + 1; }
            zone = Object.keys(zaehl).sort((a, b) => zaehl[b] - zaehl[a])[0];
          }
          if (!zonen.includes(zone)) zonen.push(zone);
          (dbProZone[zone] ||= []).push(d);
        }
        for (const z of zonen) {
          const basis = (proZone[z] || []).length ? Math.max(...proZone[z].map(n => n.y)) + 96 + 90 : Y0;
          (dbProZone[z] || []).forEach((d, i) => { d.x = zx(z) + (ZB - 230) / 2; d.y = basis + i * 150; });
        }
        // Zonen-Rahmen (nur Optik, berechnet aus dem Inhalt)
        for (const z of zonen) {
          const inhalt = [...(proZone[z] || []), ...(dbProZone[z] || [])];
          if (!inhalt.length) continue;
          const minY = Math.min(...inhalt.map(n => n.y)), maxY = Math.max(...inhalt.map(n => n.y + 96));
          const el = document.createElement('div');
          el.className = 'zonebox' + (z === 'unverbunden' ? ' warn' : '');
          el.style.left = (zx(z) - 6) + 'px'; el.style.top = (minY - 48) + 'px';
          el.style.width = (ZB + 12) + 'px'; el.style.height = (maxY - minY + 72) + 'px';
          el.innerHTML = `<span>${esc(z)}</span>`;
          plane.appendChild(el);
        }
        return;
      }
      const haupt = EDGES.filter(k => k.typ === 'haupt');
      const main = NODES.filter(n => !unten(n) && !n.obenTool);
      if (haupt.length === 0) {
        // Kette ohne haupt-Kanten: einfach nebeneinander.
        main.forEach((n, i) => { n.x = 160 + i * (nodeW(n) + 80); n.y = CHAIN_Y; n.layer = i; });
      } else {
        // Rückwärts-Kanten (Kreise, z.B. report→concepts = Lern-Schleife) via DFS erkennen
        // und fürs Layering AUSKLAMMERN — sonst schiebt der Kreis die Ebene ins Unendliche.
        const mainIds = new Set(main.map(n => n.id));
        const adj = {};
        for (const n of main) adj[n.id] = [];
        for (const k of haupt) if (mainIds.has(k.von) && mainIds.has(k.nach)) adj[k.von].push(k.nach);
        const farbe = {};
        function dfs(u) {
          farbe[u] = 1; // grau = auf dem Stack
          for (const v of adj[u]) {
            if (farbe[v] === 1) rueckEdges.add(u + '' + v); // Ziel liegt auf dem Stack → Rückkante
            else if (!farbe[v]) dfs(v);
          }
          farbe[u] = 2; // schwarz = fertig
        }
        for (const n of main) if (!farbe[n.id]) dfs(n.id);

        // Ebene = längster Pfad vom Anfang, nur über Vorwärts-Kanten (der Rest ist ein DAG).
        const dag = haupt.filter(k => mainIds.has(k.von) && mainIds.has(k.nach) && !rueckEdges.has(k.von + '' + k.nach));
        const layer = {};
        for (const n of main) layer[n.id] = 0;
        for (let i = 0; i < main.length + 1; i++) {
          let changed = false;
          for (const k of dag) {
            if (layer[k.nach] < layer[k.von] + 1) { layer[k.nach] = layer[k.von] + 1; changed = true; }
          }
          if (!changed) break;
        }
        for (const n of main) n.layer = layer[n.id] || 0;

        // Verzweigungen: mehrere Knoten auf derselben Ebene → vertikal um die Mitte verteilen.
        // Breite Workflow-Karten (Agent-Graph) brauchen mehr Ebenen-Abstand, sonst überlappen sie.
        const LX = main.some(wfKarte) ? 340 : 220;
        const LY = main.some(wfKarte) ? 215 : 190;
        const proEbene = {};
        for (const n of main) (proEbene[n.layer] ||= []).push(n);
        for (const [eb, gruppe] of Object.entries(proEbene)) {
          gruppe.forEach((n, i) => {
            const mitte = 160 + Number(eb) * LX + 48;
            n.x = mitte - nodeW(n) / 2;
            n.y = CHAIN_Y + (i - (gruppe.length - 1) / 2) * LY + (nodeH(n) === 88 ? 4 : 0);
          });
        }
      }
      // Anruf-Bausteine (lokale Tool-Klone) schweben ÜBER ihrem Anker — mehrere am selben
      // Anker fächern DIAGONAL auf: einer je Stufe, dazu seitlich versetzt. Flach nebeneinander
      // geht NICHT (Befund Gaylord 31.07.2026): das
      // Schild unter der Kachel ist 170 px breit (.lbl in style.css), die Ketten-Ebenen liegen
      // nur 220 px auseinander — die Beschriftungen benachbarter Dienste liefen ineinander
      // („Gemini (kiSuno (kie.ai)"). Diagonal statt senkrecht gestapelt, damit die Prompt-/
      // Antwort-Linie zum oberen Dienst nicht durch die untere Kachel schneidet.
      const STUFE = 170;
      const proAnker = {};
      for (const t of NODES.filter(n => n.obenTool)) (proAnker[t.anker] ||= []).push(t);
      for (const [aid, ts] of Object.entries(proAnker)) {
        const p = byId[aid];
        if (!p) continue;
        ts.forEach((t, i) => {
          t.x = cx(p) - nodeW(t) / 2 + (i - (ts.length - 1) / 2) * 100;
          t.y = p.y - 175 - i * STUFE;
        });
      }
      // Kollisions-Wächter: ein Dienst darf keinen Ketten-Knoten verdecken. Sitzt sein Anker
      // in einer Verzweigung eine Zeile tiefer, landet der Dienst sonst GENAU auf dem Knoten
      // darüber (gemessen an zwei Bausteinen derselben Ebene, 15 px Versatz — beide auf
      // Ebene 0, weil Musik-Research keine haupt-Kante hat). Nur die Dienste weichen nach
      // oben aus; die Kette bleibt, wo sie ist. Gerechnet wird mit dem VOLLEN Platzbedarf
      // inklusive Schild — sonst gilt als frei, was sich in der Beschriftung überlappt.
      (function dienstAusweichen() {
        const innen = n => breit(n) || wfKarte(n);   // Schild sitzt IN der Kachel
        const schildH = n => innen(n) ? 0
          : 8 + Math.min(3, Math.ceil((n.name || '').length / 20)) * 20 + 19;
        const feld = n => {
          const w = innen(n) ? nodeW(n) : 170;
          return { x1: cx(n) - w / 2, x2: cx(n) + w / 2, y1: n.y, y2: n.y + nodeH(n) + schildH(n) };
        };
        const stossen = (a, b) => a.x1 < b.x2 + 12 && b.x1 < a.x2 + 12
                               && a.y1 < b.y2 + 8 && b.y1 < a.y2 + 8;
        const fest = NODES.filter(n => !n.obenTool && !unten(n));
        const gesetzt = [];
        // von unten nach oben: der tiefste Dienst weicht zuerst, die darüber weichen ihm dann aus
        for (const d of NODES.filter(n => n.obenTool).sort((a, b) => b.y - a.y || a.x - b.x)) {
          for (let v = 0; v < 20; v++) {
            const f = feld(d);
            if (!fest.some(n => stossen(f, feld(n))) && !gesetzt.some(n => stossen(f, feld(n)))) break;
            d.y -= STUFE;
          }
          gesetzt.push(d);
        }
      })();
      // Unterband: Datenbanken — je unter die Mitte ihrer Ketten-Partner, dann entzerrt.
      const maxUnten = main.length ? Math.max(...main.map(n => n.y + nodeH(n))) : CHAIN_Y;
      DB_Y = maxUnten + 180;
      const dbs = NODES.filter(n => n.typ === 'datenbank');
      for (const d of dbs) {
        const partner = EDGES
          .filter(k => k.typ !== 'haupt' && (k.von === d.id || k.nach === d.id))
          .map(k => (k.von === d.id ? k.nach : k.von))
          .map(id => byId[id]).filter(Boolean).filter(n => !unten(n));
        const mitte = partner.length ? partner.reduce((s, n) => s + cx(n), 0) / partner.length : 160 + 115;
        d.x = mitte - 115;
        d.y = DB_Y;
      }
      dbs.sort((a, b) => a.x - b.x);
      for (let i = 1; i < dbs.length; i++)
        if (dbs[i].x < dbs[i - 1].x + 260) dbs[i].x = dbs[i - 1].x + 260;
      // Wissens-Dateien (Agentik-Karten): je Partner-Knoten eine Spalte unterhalb —
      // so sieht man auf einen Blick, welcher KI-Schritt welches Wissen liest.
      const wiss = NODES.filter(n => n.typ === 'wissen');
      if (wiss.length) {
        const WY = DB_Y + (dbs.length ? 175 : 0);
        const proPartner = {};
        for (const wn of wiss) {
          const k = EDGES.find(e => e.typ !== 'haupt' && (e.von === wn.id || e.nach === wn.id));
          const pid = k ? (k.von === wn.id ? k.nach : k.von) : '?';
          (proPartner[pid] ||= []).push(wn);
        }
        let spalte = 0;
        for (const [pid, gruppe] of Object.entries(proPartner)) {
          const p = byId[pid];
          const x = p ? cx(p) - 48 : 160 + (spalte++) * 220;
          gruppe.forEach((wn, j) => { wn.x = x; wn.y = WY + j * 138; });
        }
      }
    })();

    // ── Knoten bauen ──
    // Agenten mit eigenem Anruf-Baustein darüber bekommen einen Anschluss nach oben.
    const obenAgents = new Set(NODES.filter(n => n.obenTool).map(n => n.anker));
    function bauKnoten(n) {
      const el = document.createElement('div');
      const neben = EDGES.some(k => ['liest', 'schreibt'].includes(k.typ) && (k.von === n.id || k.nach === n.id));
      // In Agentik-Karten sind Tools die Zugänge der Software (Gemini API, Higgsfield CLI …)
      // — Stecker-Icon; der Schraubenschlüssel bleibt den Business-Tools der Workflows.
      const dienst = n.typ === 'tool' && (g.agentik || n.dienstKnoten);
      el.className = 'node' +
        (n.typ === 'trigger' ? ' trigger' : '') + (n.typ === 'gate' ? ' gate' : '') +
        (n.typ === 'tool' ? ' tool' : '') + (dienst ? ' dienst' : '') + (n.typ === 'software' ? ' software' : '') +
        (n.typ === 'agent' ? ' agent' : '') + (n.typ === 'wissen' ? ' wissen' : '') +
        (n.typ === 'datenbank' ? ' db' + (n.art === 'vektor' ? ' vektor' : n.art === 'wiki' ? ' wiki' : n.art === 'csv' ? ' csv' : '') : '') +
        (n.typ === 'workflow' ? (wfKarte(n) ? ' wfb' : ' wf') : '') + (n.geist ? ' geist' : '') + (n.status ? ' st-' + n.status : '') +
        (n.neu ? ' neu na-' + (n.neuArt || 'neu') : '');
      el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; el.dataset.id = n.id;
      const icon = (n.typ === 'datenbank' && LOGO[n.art] && n.art !== 'normal') ? LOGO[n.art]
        : dienst ? LOGO.dienst : (LOGO[n.typ] || LOGO.skill);
      if (wfKarte(n)) {
        // Workflow-Karte im Agent-Graph: oben Name, unten die LEBENDIGE Miniatur der
        // echten Kette — jeder Punkt ein Knoten der referenzierten Datei, in seiner
        // Typ-Farbe, mit wanderndem Puls. Berechnet, nie gepflegt. Geister: leerer Plan.
        const MF = { trigger: '#ff6d5a', skill: '#ea4b71', tool: '#8a8a8a', gate: '#b57617', software: '#1971c2', workflow: '#ff6900', agent: '#4f46e5' };
        const mini = n.mini || [];
        const strip = mini.length
          ? mini.map((m, i) =>
              `<i class="wfb-dot${m.g ? ' g' : ''}${m.t === 'gate' ? ' auge' : ''}" style="--c:${MF[m.t] || '#999'};--d:${(i * 0.32).toFixed(2)}s" title="${esc(TYP_LABEL[m.t] || m.t)}"></i>`
            ).join('<span class="wfb-line"></span>')
          : `<span class="wfb-plan">${n.geist ? 'geplant — Kette entsteht im Chat' : 'leer'}</span>`;
        el.innerHTML =
          `<div class="wfb-kopf">${LOGO.workflow}<b>${esc(n.name)}</b></div>` +
          `<span class="wfb-sub">${esc(n.sub || '')}</span>` +
          `<div class="wfb-kette">${strip}</div>` +
          (n.typ === 'trigger' ? '' : '<span class="port in"></span>') + '<span class="port out"></span>' +
          (neben ? '<span class="port sub"></span>' : '');
      } else if (breit(n)) {
        el.innerHTML = icon +
          `<span class="dblbl"><b>${esc(n.name)}</b><span>${esc(n.sub || '')}</span></span>` +
          (unten(n) ? '<span class="port top"></span>' : (neben ? '<span class="port sub"></span>' : ''));
      } else if (n.typ === 'wissen') {
        // Wissens-Datei: kein Ketten-Glied — nur der Anschluss nach oben zum Leser.
        el.innerHTML = icon + '<span class="port top"></span>' +
          `<span class="lbl"><b>${esc(n.name)}</b><span>${esc(n.sub || '')}</span></span>`;
      } else if (n.obenTool) {
        // Anruf-Baustein: schwebt über seinem Agenten — nur der Anschluss nach unten.
        el.innerHTML = icon + '<span class="port sub"></span>' +
          `<span class="lbl"><b>${esc(n.name)}</b><span>${esc(n.sub || '')}</span></span>`;
      } else {
        // Trigger sind normalerweise Ketten-Anfang (kein Eingang) — steht aber etwas
        // VOR ihnen (z.B. die Software, in der der Mensch den Auftrag auslöst),
        // bekommen sie einen Eingangs-Anschluss, damit die Kante sauber andockt.
        const triggerMitEingang = n.typ === 'trigger' && EDGES.some(k => k.typ === 'haupt' && k.nach === n.id);
        el.innerHTML =
          (n.typ === 'trigger' ? '<svg class="zap" viewBox="0 0 24 24" fill="#ff6d5a"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>' : '') +
          icon +
          (n.typ === 'trigger' && !triggerMitEingang ? '' : '<span class="port in"></span>') + '<span class="port out"></span>' +
          (neben ? '<span class="port sub"></span>' : '') +
          (obenAgents.has(n.id) ? '<span class="port top"></span>' : '') +
          `<span class="lbl"><b>${esc(n.name)}</b><span>${esc(n.sub || '')}</span></span>`;
      }
      if (n.neu) {
        // Frisch-Abzeichen: berechnet aus der Datei-Zeit (Server), verblasst von selbst.
        const relZeit = t => {
          const min = Math.max(0, (Date.now() - Date.parse(t)) / 60000);
          return min < 60 ? `vor ${Math.max(1, Math.round(min))} Min.`
            : min < 60 * 24 ? `vor ${Math.round(min / 60)} Std.` : 'gestern';
        };
        el.insertAdjacentHTML('beforeend',
          `<span class="neu-badge" title="${esc(n.datei || '')}">${n.neuArt === 'ueberarbeitet' ? 'geändert' : 'neu'}${n.frischSeit ? ' · ' + relZeit(n.frischSeit) : ''}</span>`);
      }
      // Umgebungs-Abzeichen: Standard-Rechenort ist der Server — nur Ausnahme-Knoten
      // tragen "umgebung" in der Workflow-Datei (z.B. "mac" = läuft lokal bei Gaylord).
      if (n.umgebung === 'mac') el.insertAdjacentHTML('beforeend',
        `<span class="mac-badge" title="Dieser Schritt läuft lokal auf Gaylords Mac — nicht auf dem Server"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="12" rx="1.5"/><path d="M2 19h20"/></svg>Mac</span>`);
      // Daten-Chip: bei eingeklappter Daten-Ebene zeigt der Knoten, WOMIT er verbunden
      // wäre („⛁ 2") — Klick auf den Chip holt die Ebene zurück. Reine Anzeige.
      if (!meta && !unten(n) && datenVon[n.id]) {
        const dp = [...datenVon[n.id]];
        el.classList.add('hat-daten');
        el.insertAdjacentHTML('beforeend',
          `<span class="dbchip" title="${esc(dp.join(' · '))} — Klick blendet die Daten-Ebene wieder ein">${LOGO.datenbank}<i>${dp.length}</i></span>`);
      }
      plane.appendChild(el); n.el = el;
    }
    for (const n of NODES) bauKnoten(n);

    // ── Drähte ──
    function svgEl(tag, attrs) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      return el;
    }
    // Orthogonaler Weg mit abgerundeten Ecken: senkrecht bis zur Spur, waagerecht,
    // senkrecht zum Ziel. So laufen Datenbank-Anschlüsse als aufgeräumter „Bus"
    // statt als lange Diagonalen quer durchs Leere.
    function elbowPfad(x1, y1, x2, y2, laneY, r) {
      const dv1 = laneY >= y1 ? 1 : -1, dv2 = y2 >= laneY ? 1 : -1;
      const dh = x2 >= x1 ? 1 : -1;
      const rx = Math.min(r, Math.abs(x2 - x1) / 2);
      const r1 = Math.min(rx, Math.abs(laneY - y1));
      const r2 = Math.min(rx, Math.abs(y2 - laneY));
      return `M ${x1} ${y1}`
        + ` V ${laneY - dv1 * r1}`
        + ` Q ${x1} ${laneY} ${x1 + dh * r1} ${laneY}`
        + ` H ${x2 - dh * r2}`
        + ` Q ${x2} ${laneY} ${x2} ${laneY + dv2 * r2}`
        + ` V ${y2}`;
    }
    function drawWires() {
      wireg.textContent = '';
      // Datenbank-Spuren: jede DB bekommt eine eigene waagerechte Höhe knapp über sich
      // (nach x sortiert gestaffelt), damit sich die Busse verschiedener DBs nicht decken.
      const dbLaneY = {};
      NODES.filter(n => n.typ === 'datenbank').sort((p, q) => p.x - q.x)
        .forEach((d, i) => { dbLaneY[d.id] = d.y - 8 - (18 + (i % 4) * 13); });
      for (const k of EDGES) {
        const a = byId[k.von], b = byId[k.nach];
        if (!a || !b) continue;
        let d, lx, ly, klasse = 'wire';
        const istRueck = k.typ === 'haupt' &&
          (rueckEdges.has(k.von + '' + k.nach) || (b.layer !== undefined && a.layer !== undefined && b.layer <= a.layer));
        if (istRueck) {
          // Lern-Schleife: von der Oberseite der Quelle über die Kette zurück in die Oberseite des Ziels.
          klasse = 'wire schleife';
          const x1 = cx(a), y1 = a.y, x2 = cx(b), y2 = b.y;
          const lane = Math.min(y1, y2) - 62;
          d = `M ${x1} ${y1} C ${x1} ${lane}, ${x2} ${lane}, ${x2} ${y2}`;
          lx = (x1 + x2) / 2; ly = lane - 4;
        } else if (k.typ === 'haupt') {
          const x1 = a.x + nodeW(a) + 8, y1 = cy(a), x2 = b.x - 8, y2 = cy(b);
          const c = Math.max(40, Math.abs(x2 - x1) * 0.25);
          d = `M ${x1} ${y1} C ${x1 + c} ${y1}, ${x2 - c} ${y2}, ${x2} ${y2}`;
        } else if (k.typ === 'prompt' || k.typ === 'antwort') {
          // Der Anruf: Hin (prompt) und Zurück (antwort) zwischen Agent und SEINEM
          // Anruf-Baustein darüber — zwei kurze, parallel versetzte Bögen.
          const off = k.typ === 'prompt' ? -12 : 12;
          const y1 = a.obenTool ? a.y + nodeH(a) + 8 : a.y - 8;
          const y2 = b.obenTool ? b.y + nodeH(b) + 8 : b.y - 8;
          const x1 = cx(a) + off, x2 = cx(b) + off;
          const c = Math.max(20, Math.abs(y2 - y1) * 0.4);
          d = `M ${x1} ${y1} C ${x1} ${y1 + (a.obenTool ? c : -c)}, ${x2} ${y2 + (b.obenTool ? c : -c)}, ${x2} ${y2}`;
          klasse = 'wire neben ruf';
          lx = (x1 + x2) / 2 + (k.typ === 'prompt' ? -34 : 36); ly = (y1 + y2) / 2 + 4;
        } else {
          // liest: DB/Wissen → Knoten (Pfeil endet am Unterseiten-Port) · schreibt: Knoten → DB.
          // Gibt es zwischen demselben Paar BEIDE Richtungen (Kreis), versetzen wir sie seitlich.
          const vonUnten = unten(a);
          const untenNode = vonUnten ? a : b;
          const rueck = EDGES.some(o => o !== k && o.von === k.nach && o.nach === k.von);
          const off = rueck ? (k.typ === 'liest' ? -18 : 18) : 0;
          const x1 = cx(a) + off, y1 = vonUnten ? a.y - 8 : a.y + nodeH(a) + 8;
          const x2 = cx(b) + off, y2 = unten(b) ? b.y - 8 : b.y + nodeH(b) + 8;
          if (untenNode.typ === 'datenbank') {
            // Datenbank-Bus: senkrecht runter → waagerecht in der DB-Spur → senkrecht in die DB.
            const laneY = dbLaneY[untenNode.id];
            d = elbowPfad(x1, y1, x2, y2, laneY, 11);
            lx = (x1 + x2) / 2; ly = laneY - 5;
          } else {
            const c = Math.max(36, Math.abs(y2 - y1) * 0.45);
            d = `M ${x1} ${y1} C ${x1} ${vonUnten ? y1 - c : y1 + c}, ${x2} ${unten(b) ? y2 - c : y2 + c}, ${x2} ${y2}`;
            lx = (x1 + x2) / 2 + 10; ly = (y1 + y2) / 2 + 4;
          }
        }
        if (k.typ !== 'haupt' && !klasse.includes('neben')) klasse += ' neben';
        // Kante an einem Konzept-Baustein (geist) wird selbst blass — die geplante
        // Zone der Kette liest sich als Zukunft, nicht als laufender Fluss.
        if (a.geist || b.geist) klasse += ' geist';
        // Gruppe je Kante (Pfad + Label): kennt ihre Endpunkte — so kann der Fokus-Modus
        // gezielt dimmen und die eingeklappte Daten-Ebene gezielt ausblenden.
        const grp = svgEl('g', {
          class: 'wgrp' + ((unten(a) || unten(b)) ? ' daten' : ''),
          'data-von': k.von, 'data-nach': k.nach,
        });
        grp.appendChild(svgEl('path', { d, class: klasse, 'marker-end': 'url(#arr)' }));
        if (lx !== undefined) {
          const t = svgEl('text', { x: lx, y: ly, class: 'wlab', 'text-anchor': 'middle' });
          t.textContent = istRueck ? '↻ Schleife' : k.typ;
          grp.appendChild(t);
        }
        wireg.appendChild(grp);
      }
    }
    drawWires();

    // ── Fokus-Modus: Blick auf einen Knoten — nur er, seine Nachbarn und seine
    // Kanten bleiben hell, alles andere dimmt. Reine Optik beim Hovern, nichts
    // wird verändert oder gespeichert. Das Kanten-Spaghetti verschwindet, sobald
    // man irgendwo hinschaut. ──
    const nachbarn = {};
    for (const k of EDGES) {
      (nachbarn[k.von] ||= new Set()).add(k.nach);
      (nachbarn[k.nach] ||= new Set()).add(k.von);
    }
    const wiresSvg = content.querySelector('#wires');
    let fokusTimer = null, fokusId = null;
    function fokusAn(id) {
      fokusId = id;
      plane.classList.add('fokus'); wiresSvg.classList.add('fokus');
      const nah = nachbarn[id] || new Set();
      for (const n of NODES) n.el.classList.toggle('fon', n.id === id || nah.has(n.id));
      wireg.querySelectorAll('.wgrp').forEach(gr =>
        gr.classList.toggle('fon', gr.dataset.von === id || gr.dataset.nach === id));
    }
    function fokusAus() {
      if (fokusTimer) { clearTimeout(fokusTimer); fokusTimer = null; }
      if (fokusId === null) return;
      fokusId = null;
      plane.classList.remove('fokus'); wiresSvg.classList.remove('fokus');
      plane.querySelectorAll('.node.fon').forEach(el => el.classList.remove('fon'));
      wireg.querySelectorAll('.wgrp.fon').forEach(el => el.classList.remove('fon'));
    }
    plane.addEventListener('pointerover', e => {
      const el = e.target.closest('.node');
      if (!el || el.dataset.id === fokusId) return;
      if (fokusTimer) clearTimeout(fokusTimer);
      // kleine Verzögerung: beim Drüberstreichen flackert nichts
      fokusTimer = setTimeout(() => { fokusTimer = null; if (!drag) fokusAn(el.dataset.id); }, 140);
    });
    plane.addEventListener('pointerout', e => {
      const el = e.target.closest('.node');
      if (!el || el.contains(e.relatedTarget)) return;
      fokusAus();
    });

    // ── Daten-Ebene einklappbar (Schalter unten links): Datenbanken & Wissens-Dateien
    // samt Kanten ausblenden — die Kette zeigt stattdessen je Knoten den Daten-Chip.
    // Zustand ist reine Optik (lebt nur im Browser, wie Zoom) und überlebt Re-Renders. ──
    let dbZu = !meta && !!EBENE_ZU[notizKey];
    const ebBtn = content.querySelector('#z-eb');
    function ebeneAnwenden() {
      plane.classList.toggle('db-zu', dbZu);
      wiresSvg.classList.toggle('db-zu', dbZu);
      if (ebBtn) {
        ebBtn.classList.toggle('aus', dbZu);
        ebBtn.title = dbZu ? 'Daten-Ebene einblenden' : 'Daten-Ebene ausblenden';
      }
    }
    if (ebBtn && !NODES.some(unten)) ebBtn.remove(); // alle Daten-Knoten liegen im „Später"-Zettel
    ebeneAnwenden();

    // ── Punkte-Raster mit Maus-Gravitation (Stitch-Idee, bewusst dezenter) ──
    // Eigenes Canvas hinter der Fläche: die Punkte wandern mit Pan & Zoom (überall im
    // Sichtfeld) und werden in Maus-Nähe ganz leicht angezogen. Weit rausgezoomt: aus.
    const dotsCv = content.querySelector('#dots');
    const dctx = dotsCv.getContext('2d');
    const DOT_FARBE = (getComputedStyle(document.documentElement).getPropertyValue('--dot') || '#d4d4d4').trim();
    const GRAV_R = 150, GRAV_MAX = 6; // Anzugs-Radius & maximale Verschiebung in px — „ganz leicht"
    const maus = { x: 0, y: 0, zx: 0, zy: 0, ziel: 0, kraft: 0 }; // z* = geglättet, kraft blendet weich ein/aus
    let dotsRaf = null;
    const dotsTick = () => { if (!dotsRaf) dotsRaf = requestAnimationFrame(dotsZeichnen); };
    function dotsZeichnen() {
      dotsRaf = null;
      const w = vp.clientWidth, h = vp.clientHeight;
      if (!w || !h) return;
      const dpr = window.devicePixelRatio || 1;
      if (dotsCv.width !== Math.round(w * dpr) || dotsCv.height !== Math.round(h * dpr)) {
        dotsCv.width = Math.round(w * dpr); dotsCv.height = Math.round(h * dpr);
        dotsCv.style.width = w + 'px'; dotsCv.style.height = h + 'px';
      }
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dctx.clearRect(0, 0, w, h);
      if (sc < 0.45) return; // sonst Punkte-Brei
      maus.zx += (maus.x - maus.zx) * 0.22;
      maus.zy += (maus.y - maus.zy) * 0.22;
      maus.kraft += (maus.ziel - maus.kraft) * 0.16;
      const g = 16 * sc, r0 = 0.55 * sc;
      const x0 = ((tx % g) + g) % g, y0 = ((ty % g) + g) % g;
      const anziehung = maus.kraft > 0.005;
      dctx.fillStyle = DOT_FARBE;
      dctx.beginPath();
      for (let y = y0 - g; y < h + g; y += g) {
        for (let x = x0 - g; x < w + g; x += g) {
          let px = x, py = y, r = r0;
          if (anziehung) {
            const dx = maus.zx - x, dy = maus.zy - y;
            const d2 = dx * dx + dy * dy;
            if (d2 < GRAV_R * GRAV_R) {
              const d = Math.sqrt(d2) || 1;
              const f = (1 - d / GRAV_R) * (1 - d / GRAV_R) * maus.kraft;
              px += (dx / d) * GRAV_MAX * f;
              py += (dy / d) * GRAV_MAX * f;
              r += 0.35 * f; // nahe Punkte minimal kräftiger — wirkt wie Aufleuchten
            }
          }
          dctx.moveTo(px + r, py);
          dctx.arc(px, py, r, 0, 6.2832);
        }
      }
      dctx.fill();
      // weiterlaufen, bis die geglättete Maus & die Kraft eingeschwungen sind
      if ((anziehung && Math.abs(maus.x - maus.zx) + Math.abs(maus.y - maus.zy) > 0.2) ||
          Math.abs(maus.ziel - maus.kraft) > 0.01) dotsTick();
    }
    aktiverDots = dotsTick;
    vp.addEventListener('pointermove', e => {
      const r = vp.getBoundingClientRect();
      maus.x = e.clientX - r.left; maus.y = e.clientY - r.top;
      if (maus.kraft < 0.02) { maus.zx = maus.x; maus.zy = maus.y; } // frisch rein: nicht quer über den Schirm ziehen
      maus.ziel = 1;
      dotsTick();
    });
    vp.addEventListener('pointerleave', () => { maus.ziel = 0; dotsTick(); });

    // ── Pan & Zoom ──
    const apply = () => {
      plane.style.transform = `translate(${tx}px,${ty}px) scale(${sc})`;
      // Kanten-Labels erst zeigen, wenn man nah genug dran ist — sonst Label-Brei.
      wiresSvg.classList.toggle('labels-an', sc >= 0.7);
      dotsTick(); // Punkte folgen Pan & Zoom
    };
    function fit() {
      const vw = vp.clientWidth, vh = vp.clientHeight;
      if (!vw || !vh) { setTimeout(() => { if (aktiverFit === fitWennRuhig) fit(); }, 100); return; }
      const els = NODES.filter(n => !(dbZu && unten(n))) // eingeklappte Daten-Ebene zählt nicht mit
        .map(n => ({ x: n.x, y: n.y, w: nodeW(n), h: nodeH(n) + 44 }));
      if (!els.length) return;
      const minX = Math.min(...els.map(e => e.x)) - 60, maxX = Math.max(...els.map(e => e.x + e.w)) + 60;
      // Oben mehr Luft, damit Rückwärts-Schleifen (über der Kette) nicht abgeschnitten werden.
      const minY = Math.min(...els.map(e => e.y)) - 100, maxY = Math.max(...els.map(e => e.y + e.h)) + 60;
      sc = Math.min(1, vw / (maxX - minX), vh / (maxY - minY));
      tx = (vw - (maxX - minX) * sc) / 2 - minX * sc;
      ty = (vh - (maxY - minY) * sc) / 2 - minY * sc;
      apply();
    }
    const fitWennRuhig = () => { if (!bewegt) fit(); };
    aktiverFit = fitWennRuhig;

    content.querySelector('#z-in').onclick = () => { bewegt = true; sc = Math.min(2, sc * 1.18); apply(); };
    content.querySelector('#z-out').onclick = () => { bewegt = true; sc = Math.max(.25, sc / 1.18); apply(); };
    content.querySelector('#z-fit').onclick = () => { bewegt = false; fit(); };
    if (ebBtn && ebBtn.isConnected) ebBtn.onclick = () => {
      dbZu = !dbZu; EBENE_ZU[notizKey] = dbZu;
      ebeneAnwenden();
      if (!bewegt) fit();
    };
    vp.addEventListener('wheel', e => {
      e.preventDefault();
      bewegt = true;
      const f = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      const r = vp.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      // erst clampen, dann den EFFEKTIVEN Faktor anwenden — sonst driftet der Graph an der Zoom-Grenze
      const ns = Math.max(.25, Math.min(2, sc * f));
      const gf = ns / sc;
      tx = px - (px - tx) * gf; ty = py - (py - ty) * gf;
      sc = ns; apply();
    }, { passive: false });
    // overflow:hidden ist per JS trotzdem scrollbar (z.B. scrollIntoView bei Fokus) — nie zulassen,
    // sonst verschiebt sich der Canvas unsichtbar gegen die transform-Koordinaten.
    vp.addEventListener('scroll', () => { vp.scrollTop = 0; vp.scrollLeft = 0; });

    // ── Dragging: Pan auf Hintergrund ──
    // Blöcke sind bewusst NICHT verschiebbar (Gaylords Entscheid): das Layout ist
    // berechnet, nichts soll sich von Hand „verpflegen" lassen. Klick zählt trotzdem.
    vp.addEventListener('pointerdown', e => {
      const chipEl = e.target.closest('.dbchip');
      const nodeEl = e.target.closest('.node');
      if (chipEl) { drag = { t: 'chip', sx: e.clientX, sy: e.clientY, moved: false }; }
      else if (nodeEl) { drag = { t: 'node', n: byId[nodeEl.dataset.id], sx: e.clientX, sy: e.clientY, moved: false }; }
      else { drag = { t: 'pan', sx: e.clientX, sy: e.clientY, ox: tx, oy: ty }; vp.classList.add('panning'); }
      vp.setPointerCapture(e.pointerId);
    });
    vp.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
      if (drag.t === 'pan') { bewegt = true; tx = drag.ox + dx; ty = drag.oy + dy; apply(); }
    });
    vp.addEventListener('pointerup', () => {
      if (drag && drag.t === 'chip' && !drag.moved) {
        // Daten-Chip angeklickt → Daten-Ebene wieder einblenden
        dbZu = false; EBENE_ZU[notizKey] = false;
        ebeneAnwenden();
        if (!bewegt) fit();
      } else if (drag && drag.t === 'node' && !drag.moved) {
        const n = drag.n;
        // Workflow-Knoten (Meta wie Agent-Graph): Klick öffnet die referenzierte Kette —
        // Geister haben keine Datei, sie zeigen ihr Panel (die Skizze der Rolle).
        if (n.typ === 'workflow' && !n.geist && n.kurz && opts.aufWorkflow) opts.aufWorkflow(n);
        else window.openPanel(n);
      }
      if (drag && drag.t === 'pan') vp.classList.remove('panning');
      drag = null;
    });

    if (opts.startView) {
      // Live-Re-Render: Blickwinkel des Users erhalten statt neu einzupassen.
      tx = opts.startView.tx; ty = opts.startView.ty; sc = opts.startView.sc;
      bewegt = opts.startView.bewegt;
      apply();
    } else {
      fit();
    }

    if (g.alarm && g.alarm.length) zeigAlarm(content, g.alarm);
    if (g.warnungen && g.warnungen.length) {
      zeigFehler(content, 'Warnung beim Lesen der Dateien', g.warnungen.join(' · '), true);
    }
    return { getView: () => ({ tx, ty, sc, bewegt }) };
  }

  // ALARM: rote pochende Glocke + lila Alarmkreis + fliegendes Einhorn 🦄 — wenn etwas
  // fehlschlägt (Kling-Reject/keine Credits, ElevenLabs-401, übersprungener Schritt).
  function zeigAlarm(content, alarm) {
    content.querySelectorAll('.lkalarm').forEach(x => x.remove());
    const el = document.createElement('div');
    el.className = 'lkalarm';
    const liste = alarm.slice(0, 5).map(a =>
      `<div class="lkalarm-item">⚠️ <b>${esc(a.kind || 'Fehler')}</b>${a.node ? ` · ${esc(a.node)}` : ''}${a.message ? ` — ${esc(a.message)}` : ''}</div>`).join('');
    el.innerHTML =
      `<div class="lkalarm-uni">🦄</div>` +
      `<div class="lkalarm-glocke"><div class="lkalarm-ring"></div><span>🔔</span></div>` +
      `<div class="lkalarm-box"><b>ALARM — irgendwas stimmt nicht (${alarm.length})</b>${liste}</div>`;
    content.appendChild(el);
  }

  function zeigFehler(content, titel, text, warn) {
    const el = document.createElement('div');
    el.className = 'fehlkarte';
    if (warn) el.style.borderColor = 'var(--gold)';
    el.innerHTML = `<b style="${warn ? 'color:var(--gold)' : ''}">${esc(titel)}</b><br>${esc(text)}`;
    el.onclick = () => el.remove();
    content.appendChild(el);
  }

  return { LOGO, TYP_LABEL, esc, wann, renderGraph, zeigFehler };
})();
