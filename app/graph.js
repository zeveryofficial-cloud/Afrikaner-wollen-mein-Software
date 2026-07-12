// AWMS Graph-Engine — rendert den Workflow-Graph UND den Übersichts-Meta-Graph.
// Read-only: zeichnet, was die APIs aus den Dateien lesen, sonst nichts.
// Optik & Interaktion: 1:1 vom gewählten Referenz-Design (referenz/graph-design-beispiel.html).
'use strict';
window.AWMS = (function () {

  // ── Ein Logo pro Baustein-Typ (Viktors Entscheidung: alles Gleiche sieht gleich aus) ──
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
    // Übersicht (nur Seitenleiste): Netz aus drei Knoten
    uebersicht: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="19" r="2.2"/><circle cx="19" cy="19" r="2.2"/><path d="M10.9 6.9 6.2 16.9M13.1 6.9l4.7 10M7.2 19h9.6"/></svg>',
    // Entwurf (Seitenleiste): gestrichelter Rahmen + Funke — der Bauplan
    entwurf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke-dasharray="3.4 3"/><path d="M12 7.8c.55 2.3 1.85 3.6 4.2 4.2-2.35.6-3.65 1.9-4.2 4.2-.55-2.3-1.85-3.6-4.2-4.2 2.35-.6 3.65-1.9 4.2-4.2Z" stroke-linejoin="round"/></svg>',
    // Befund (Seitenleiste): Puls-Linie — der Arztbrief zum Röntgenbild
    befund: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M3 12h4l2.2-5.5 4.4 11L16 12h5"/></svg>',
  };
  const TYP_LABEL = { trigger: 'Trigger', skill: 'Skill', tool: 'Tool', software: 'Software — Mensch bedient', datenbank: 'Datenbank', gate: 'Homo Sapiens — am Kochen', workflow: 'Workflow', agent: 'KI-Agent — entscheidet in der Software', wissen: 'Software Skill — die MD-Datei, die die Software-KI liest' };

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wann = iso => { try { return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) + ' Uhr'; } catch { return '—'; } };

  // Genau EIN fit reagiert auf Fenster-Resize (der des aktuell gerenderten Graphen).
  let aktiverFit = null;
  let aktiverDots = null; // Punkte-Canvas des aktuellen Graphen bei Resize nachziehen
  window.addEventListener('resize', () => { if (aktiverFit) aktiverFit(); if (aktiverDots) aktiverDots(); });

  // Wohin Viktor einen „Später"-Zettel geschoben hat — reine Optik, lebt nur im Browser
  // (wie Zoom & Blickwinkel), nie in den Dateien. Überlebt die Live-Neuzeichnung.
  const NOTIZ_POS = {};

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
          const spaeter = w.spaeterZahl || 0;
          const aktiv = (w.geister || 0) - spaeter; // offene Geister ohne die bewusst zurückgestellten
          // Agentik-Karte ist LAUFENDE Software, kein Von-0-Entwurf: geplante Knoten
          // heißen „geplant", nicht „Entwurf" — sonst wirkt gebaute Software wie eine Skizze.
          const zustand = g.agentik
            ? (aktiv > 0
                ? ` <span class="tag entwurf">◐ ${w.bausteine - w.geister} von ${w.bausteine} Bausteinen gebaut · ${aktiv} geplant</span>`
                : ` <span class="tag">${esc(w.datei)}</span>`)
            : aktiv > 0
              ? ` <span class="tag entwurf">◐ Entwurf · ${w.bausteine - w.geister} von ${w.bausteine - spaeter} Bausteinen stehen${spaeter ? ` · ${spaeter} später` : ''}</span>`
              : spaeter > 0
                ? ` <span class="tag spaeter">✓ fertig für jetzt · ${spaeter} später</span>`
                : ` <span class="tag">${esc(w.datei)}</span>`;
          return `<div class="wf-name">${esc(w.name)} <span class="tag geld">${esc(w.projekt)}</span>` + zustand +
            w.tags.map(t => ` <span class="tag">${esc(t)}</span>`).join('') + '</div>';
        })();

    // Agentik-Karte: die Tab-Pille wechselt zwischen den internen Workflows der Software
    // (je eigener Trigger — „Cartoon-Ad anlegen ist ein anderer Trigger als B-Roll-Ad").
    const tabs = meta ? '' : g.agentik
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

    // ── „Später"-Knoten stehen NICHT in der Kette ──
    // Die Kette zeigt nur, was JETZT gilt. Bewusst zurückgestellte Zukunft (spaeter: true)
    // wird herausgelöst und liegt als LOSER gelber Zettel auf der Fläche — verschiebbar,
    // Klick = Zukunfts-Skizze. (Viktors Entscheid: nicht an einen Baustein kleben.)
    const spGruppen = [];
    const notizKey = meta ? 'meta' : (g.workflow ? g.workflow.projekt + '/' + g.workflow.kurz : 'wf');
    if (!meta) (function spaeterHerausloesen() {
      const origById = {}; for (const n of NODES) origById[n.id] = n;
      const spIds = new Set(NODES.filter(n => n.spaeter).map(n => n.id));
      if (!spIds.size) return;
      // Datenbanken, die NUR Später-Knoten bedienen, gehören mit in die Skizze.
      for (const d of NODES) {
        if (d.typ !== 'datenbank') continue;
        const partner = EDGES.filter(k => k.typ !== 'haupt' && (k.von === d.id || k.nach === d.id))
          .map(k => (k.von === d.id ? k.nach : k.von));
        if (partner.length && partner.every(id => spIds.has(id))) spIds.add(d.id);
      }
      const origHaupt = EDGES.filter(k => k.typ === 'haupt');
      // Anker = letzter Nicht-Später-Knoten VOR der Später-Strecke (sonst der danach).
      const davor = (id, t = 0) => {
        const rein = origHaupt.find(k => k.nach === id);
        if (!rein || t > NODES.length) return null;
        return spIds.has(rein.von) ? davor(rein.von, t + 1) : rein.von;
      };
      const danach = (id, t = 0) => {
        const raus = origHaupt.find(k => k.von === id);
        if (!raus || t > NODES.length) return null;
        return spIds.has(raus.nach) ? danach(raus.nach, t + 1) : raus.nach;
      };
      // Gruppen je Anker-Knoten — dort klebt der Zettel, die Skizze kennt ihre Nachbarn.
      const gruppen = {}, gruppeVon = {};
      for (const n of NODES) {
        if (!spIds.has(n.id) || n.typ === 'datenbank') continue;
        const vorId = davor(n.id), nachId = danach(n.id);
        const anker = vorId || nachId || (NODES.find(x => !spIds.has(x.id)) || {}).id;
        if (!anker) continue;
        const gr = (gruppen[anker] ||= {
          knoten: [], kanten: [], vorId, nachId,
          vorName: vorId && origById[vorId] ? origById[vorId].name : null,
          nachName: nachId && origById[nachId] ? origById[nachId].name : null,
        });
        gr.knoten.push(n); gruppeVon[n.id] = gr;
      }
      for (const d of NODES) {
        if (!spIds.has(d.id) || d.typ !== 'datenbank') continue;
        const p = EDGES.find(k => (k.von === d.id && gruppeVon[k.nach]) || (k.nach === d.id && gruppeVon[k.von]));
        const gr = p ? gruppeVon[p.von === d.id ? p.nach : p.von] : Object.values(gruppen)[0];
        if (gr) { gr.knoten.push(d); gruppeVon[d.id] = gr; }
      }
      for (const k of EDGES) {
        if (k.typ === 'haupt' || !(spIds.has(k.von) || spIds.has(k.nach))) continue;
        const gr = gruppeVon[k.von] || gruppeVon[k.nach];
        if (gr) gr.kanten.push(k);
      }
      // Haupt-Kanten überbrücken: A → später → B wird zu A → B (auch über Später-Strecken).
      let haupt = origHaupt.slice();
      for (const sid of spIds) {
        const rein = haupt.filter(k => k.nach === sid);
        const raus = haupt.filter(k => k.von === sid);
        haupt = haupt.filter(k => k.von !== sid && k.nach !== sid);
        for (const i of rein) for (const o of raus)
          if (i.von !== o.nach && !haupt.some(k => k.von === i.von && k.nach === o.nach))
            haupt.push({ von: i.von, nach: o.nach, typ: 'haupt' });
      }
      NODES = NODES.filter(n => !spIds.has(n.id));
      EDGES = EDGES.filter(k => k.typ !== 'haupt' && !spIds.has(k.von) && !spIds.has(k.nach)).concat(haupt);
      for (const [ankerId, gr] of Object.entries(gruppen))
        spGruppen.push({ key: notizKey + ':' + ankerId, gr });
    })();

    // ── Agentik: Tool-Anrufe LOKAL zeichnen (Viktors Entscheid: „wir können zweimal
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

    // Zukunfts-Skizze im Detail-Panel: was später käme, womit es verbunden wäre, wo es hinge.
    function zeigeSkizze(gr) {
      const nameVon = id => { const k = gr.knoten.find(x => x.id === id); return k ? k.name : id; };
      const zeilen = gr.knoten.map(k => {
        const verb = gr.kanten.map(x =>
          x.typ === 'liest' && x.nach === k.id ? `liest aus „${nameVon(x.von)}"` :
          x.typ === 'schreibt' && x.von === k.id ? `schreibt in „${nameVon(x.nach)}"` : null
        ).filter(Boolean);
        const icon = (k.typ === 'datenbank' && k.art === 'vektor') ? LOGO.vektor : (LOGO[k.typ] || LOGO.skill);
        return `<div class="spk">${icon}<div><b>${esc(k.name)}</b><span>${esc(TYP_LABEL[k.typ] || k.typ)}${verb.length ? ' · ' + esc(verb.join(' · ')) : ''}</span>${k.beschreibung ? `<p>${esc(k.beschreibung)}</p>` : ''}</div></div>`;
      }).join('');
      const wo = gr.vorName && gr.nachName ? `zwischen „${gr.vorName}" und „${gr.nachName}"`
        : gr.vorName ? `nach „${gr.vorName}"` : gr.nachName ? `vor „${gr.nachName}"` : '';
      window.openPanel({
        name: 'Für später geplant',
        html: `<div class="k">Zukunfts-Skizze — bewusst zurückgestellt, kein Teil der heutigen Kette</div>${zeilen}` +
          (wo ? `<div class="k">Käme in die Kette</div>${esc(wo)}` : '') +
          `<div class="k">Zurückholen</div>Im Chat sagen: <code>„${esc(gr.knoten[0].name)} doch jetzt bauen"</code>`,
      });
    }

    // „unten" = liegt unterhalb der Kette und wird über liest/schreibt angebunden
    // (Datenbanken — und in Agentik-Karten die Wissens-Dateien der Software-KI).
    const unten = n => n.typ === 'datenbank' || n.typ === 'wissen';
    const breit = n => n.typ === 'datenbank' || n.typ === 'workflow';
    const nodeW = n => breit(n) ? 230 : n.typ === 'gate' ? 88 : 96;
    const nodeH = n => n.typ === 'gate' ? 88 : 96;
    const cx = n => n.x + nodeW(n) / 2;
    const cy = n => n.y + nodeH(n) / 2;

    for (const n of NODES) byId[n.id] = n;

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
        const proEbene = {};
        for (const n of main) (proEbene[n.layer] ||= []).push(n);
        for (const [eb, gruppe] of Object.entries(proEbene)) {
          gruppe.forEach((n, i) => {
            const mitte = 160 + Number(eb) * 220 + 48;
            n.x = mitte - nodeW(n) / 2;
            n.y = CHAIN_Y + (i - (gruppe.length - 1) / 2) * 190 + (nodeH(n) === 88 ? 4 : 0);
          });
        }
      }
      // Anruf-Bausteine (lokale Tool-Klone) schweben direkt ÜBER ihrem Agenten.
      for (const t of NODES.filter(n => n.obenTool)) {
        const p = byId[t.anker];
        if (p) { t.x = cx(p) - nodeW(t) / 2; t.y = p.y - 175; }
      }
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
      const dienst = n.typ === 'tool' && g.agentik;
      el.className = 'node' +
        (n.typ === 'trigger' ? ' trigger' : '') + (n.typ === 'gate' ? ' gate' : '') +
        (n.typ === 'tool' ? ' tool' : '') + (dienst ? ' dienst' : '') + (n.typ === 'software' ? ' software' : '') +
        (n.typ === 'agent' ? ' agent' : '') + (n.typ === 'wissen' ? ' wissen' : '') +
        (n.typ === 'datenbank' ? ' db' + (n.art === 'vektor' ? ' vektor' : '') : '') +
        (n.typ === 'workflow' ? ' wf' : '') + (n.geist ? ' geist' : '') + (n.status ? ' st-' + n.status : '');
      el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; el.dataset.id = n.id;
      const icon = (n.typ === 'datenbank' && n.art === 'vektor') ? LOGO.vektor
        : dienst ? LOGO.dienst : (LOGO[n.typ] || LOGO.skill);
      if (breit(n)) {
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
        el.innerHTML =
          (n.typ === 'trigger' ? '<svg class="zap" viewBox="0 0 24 24" fill="#ff6d5a"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>' : '') +
          icon +
          (n.typ === 'trigger' ? '' : '<span class="port in"></span>') + '<span class="port out"></span>' +
          (neben ? '<span class="port sub"></span>' : '') +
          (obenAgents.has(n.id) ? '<span class="port top"></span>' : '') +
          `<span class="lbl"><b>${esc(n.name)}</b><span>${esc(n.sub || '')}</span></span>`;
      }
      plane.appendChild(el); n.el = el;
    }
    for (const n of NODES) bauKnoten(n);

    // ── Lose „Später"-Zettel ──
    // Der einzige Zettel im Graph — und die bewusste Ausnahme zur Sticky-Note-Verbannung:
    // er ist BERECHNET (aus spaeter-Flags), nie von Hand gepflegt. Er liegt frei auf der
    // Fläche (Start: über der Lücke, wo die Zukunft hinge) und lässt sich verschieben.
    spGruppen.forEach((z, i) => {
      const merk = NOTIZ_POS[z.key];
      const va = byId[z.gr.vorId], na = byId[z.gr.nachId];
      z.x = merk ? merk.x
        : va && na ? (cx(va) + cx(na)) / 2 - 85 + i * 26
        : va ? va.x + nodeW(va) + 70 : na ? na.x - 250 : 160;
      z.y = merk ? merk.y
        : (va || na ? Math.min(va ? va.y : Infinity, na ? na.y : Infinity) : CHAIN_Y) - 180 + i * 26;
      const namen = z.gr.knoten.filter(k => k.typ !== 'datenbank').map(k => k.name);
      const dbs = z.gr.knoten.length - namen.length;
      const el = document.createElement('div');
      el.className = 'spnote';
      el.dataset.z = i;
      el.title = 'Klick = Zukunfts-Skizze · ziehen = verschieben (nur Optik)';
      el.innerHTML =
        `<b><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4.5 5.5A1.5 1.5 0 0 1 6 4h12a1.5 1.5 0 0 1 1.5 1.5v8.7L14.2 19.5H6a1.5 1.5 0 0 1-1.5-1.5V5.5z"/><path d="M14.2 19.5V14h5.3"/></svg>Für später</b>` +
        namen.map(nm => `<span>${esc(nm)}</span>`).join('') +
        (dbs ? `<i>+ ${dbs} Datenbank${dbs > 1 ? 'en' : ''}</i>` : '');
      el.style.left = z.x + 'px'; el.style.top = z.y + 'px';
      plane.appendChild(el); z.el = el;
    });

    // ── Drähte ──
    function svgEl(tag, attrs) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      return el;
    }
    function drawWires() {
      wireg.textContent = '';
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
          const rueck = EDGES.some(o => o !== k && o.von === k.nach && o.nach === k.von);
          const off = rueck ? (k.typ === 'liest' ? -18 : 18) : 0;
          const x1 = cx(a) + off, y1 = vonUnten ? a.y - 8 : a.y + nodeH(a) + 8;
          const x2 = cx(b) + off, y2 = unten(b) ? b.y - 8 : b.y + nodeH(b) + 8;
          const c = Math.max(36, Math.abs(y2 - y1) * 0.45);
          d = `M ${x1} ${y1} C ${x1} ${vonUnten ? y1 - c : y1 + c}, ${x2} ${unten(b) ? y2 - c : y2 + c}, ${x2} ${y2}`;
          lx = (x1 + x2) / 2 + 10; ly = (y1 + y2) / 2 + 4;
        }
        if (k.typ !== 'haupt' && !klasse.includes('neben')) klasse += ' neben';
        // Kante an einem Konzept-Baustein (geist) wird selbst blass — die geplante
        // Zone der Kette liest sich als Zukunft, nicht als laufender Fluss.
        if (a.geist || b.geist) klasse += ' geist';
        wireg.appendChild(svgEl('path', { d, class: klasse, 'marker-end': 'url(#arr)' }));
        if (lx !== undefined) {
          const t = svgEl('text', { x: lx, y: ly, class: 'wlab', 'text-anchor': 'middle' });
          t.textContent = istRueck ? '↻ Schleife' : k.typ;
          wireg.appendChild(t);
        }
      }
    }
    drawWires();

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
    const wiresSvg = content.querySelector('#wires');
    const apply = () => {
      plane.style.transform = `translate(${tx}px,${ty}px) scale(${sc})`;
      // Kanten-Labels erst zeigen, wenn man nah genug dran ist — sonst Label-Brei.
      wiresSvg.classList.toggle('labels-an', sc >= 0.7);
      dotsTick(); // Punkte folgen Pan & Zoom
    };
    function fit() {
      const vw = vp.clientWidth, vh = vp.clientHeight;
      if (!vw || !vh) { setTimeout(() => { if (aktiverFit === fitWennRuhig) fit(); }, 100); return; }
      const els = NODES.map(n => ({ x: n.x, y: n.y, w: nodeW(n), h: nodeH(n) + 44 }))
        .concat(spGruppen.map(z => ({ x: z.x, y: z.y, w: 190, h: 110 })));
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
    vp.addEventListener('wheel', e => {
      e.preventDefault();
      bewegt = true;
      const r = vp.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      // MacBook-Trackpad: Pinch kommt als wheel+ctrlKey → stufenlos zoomen, zeigerzentriert.
      // Zwei-Finger-Wisch (ohne ctrl) → pannen. (Maus: Cmd/Ctrl+Wheel zoomt; +/−-Knöpfe bleiben.)
      if (e.ctrlKey || e.metaKey) {
        const f = Math.exp(-e.deltaY * 0.0022); // stufenlos statt fester Sprünge → butterweich
        const ns = Math.max(.25, Math.min(2, sc * f));
        const gf = ns / sc;
        tx = px - (px - tx) * gf; ty = py - (py - ty) * gf;
        sc = ns;
      } else {
        tx -= e.deltaX; ty -= e.deltaY;
      }
      apply();
    }, { passive: false });
    // overflow:hidden ist per JS trotzdem scrollbar (z.B. scrollIntoView bei Fokus) — nie zulassen,
    // sonst verschiebt sich der Canvas unsichtbar gegen die transform-Koordinaten.
    vp.addEventListener('scroll', () => { vp.scrollTop = 0; vp.scrollLeft = 0; });

    // ── Dragging: Pan auf Hintergrund, Zettel verschieben (nur Optik) ──
    // Blöcke sind bewusst NICHT verschiebbar (Viktors Entscheid): das Layout ist
    // berechnet, nichts soll sich von Hand „verpflegen" lassen. Klick zählt trotzdem.
    vp.addEventListener('pointerdown', e => {
      const noteEl = e.target.closest('.spnote');
      const nodeEl = e.target.closest('.node');
      if (noteEl) { const z = spGruppen[noteEl.dataset.z]; drag = { t: 'note', z, sx: e.clientX, sy: e.clientY, ox: z.x, oy: z.y, moved: false }; }
      else if (nodeEl) { drag = { t: 'node', n: byId[nodeEl.dataset.id], sx: e.clientX, sy: e.clientY, moved: false }; }
      else { drag = { t: 'pan', sx: e.clientX, sy: e.clientY, ox: tx, oy: ty }; vp.classList.add('panning'); }
      vp.setPointerCapture(e.pointerId);
    });
    vp.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
      if (drag.t === 'pan') { bewegt = true; tx = drag.ox + dx; ty = drag.oy + dy; apply(); }
      else if (drag.t === 'note') { const z = drag.z; z.x = drag.ox + dx / sc; z.y = drag.oy + dy / sc; z.el.style.left = z.x + 'px'; z.el.style.top = z.y + 'px'; }
    });
    vp.addEventListener('pointerup', () => {
      if (drag && drag.t === 'note') {
        if (drag.moved) NOTIZ_POS[drag.z.key] = { x: drag.z.x, y: drag.z.y };
        else zeigeSkizze(drag.z.gr);
      } else if (drag && drag.t === 'node' && !drag.moved) {
        const n = drag.n;
        if (meta && n.typ === 'workflow' && opts.aufWorkflow) opts.aufWorkflow(n);
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
