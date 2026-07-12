// AWMS App-Shell — Seitenleiste, Routing, Listen-Seiten.
// ALLE Seiten sind live: die offene Ansicht liest alle 2 s frisch aus den Dateien
// und zeichnet nur um, wenn sich wirklich etwas geändert hat (Zoom/Scroll bleiben).
// Read-only: du redest im Chat, die KI schreibt Dateien, AWMS zeigt sie.
'use strict';
(function () {
  const { LOGO, TYP_LABEL, esc, wann, renderGraph } = window.AWMS;
  const content = document.getElementById('content');

  const ohneMarker = t => String(t || '').replace(/^\[AWMS-Beispiel\/Platzhalter\]\s*/, '');
  const datum = iso => { try { return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(iso)); } catch { return '—'; } };

  // Seitenleisten-Icons einsetzen (dieselben Logos wie im Graph — eine Formsprache überall)
  document.querySelectorAll('[data-ic]').forEach(el => { el.innerHTML = LOGO[el.dataset.ic] || ''; });

  // ── Detail-Panel (überall gleich: zeigt, was in den DATEIEN steht, plus mtime) ──
  const panel = document.getElementById('panel');
  const row = (k, v, code) => v ? `<div class="k">${k}</div>${code ? `<code>${esc(v)}</code>` : esc(v).replace(/\n/g, '<br>')}` : '';
  window.openPanel = function (n) {
    document.querySelectorAll('.node.sel').forEach(x => x.classList.remove('sel'));
    if (n.el) n.el.classList.add('sel');
    document.getElementById('p-name').textContent = n.name;
    if (n.html) { // vorgebaute Ansicht (z.B. Zukunfts-Skizze vom „Später"-Zettel)
      document.getElementById('p-body').innerHTML = n.html;
      panel.classList.add('open');
      return;
    }
    let h = row('Typ', (n.typLabel || TYP_LABEL[n.typ] || n.typ) + (n.lose ? ' — lose, in keiner Kette' : ''));
    h += row('Projekt', n.projekt);
    h += row('Im Einsatz', n.einsatz);
    if (n.typ === 'datenbank' && n.db) {
      h += row('Zweck', n.db.zweck);
      h += row('Typ der Datenbank', n.db.typ);
      h += row('Wer schreibt rein', n.db.schreibt);
      h += row('Wer liest raus', n.db.liest);
      h += row('Format', n.db.format);
      h += row('Hinweis', n.db.hinweis);
    } else {
      h += row('Was es tut', n.beschreibungDatei || n.beschreibung);
      if (n.beschreibungDatei && n.beschreibung) h += row('Rolle in dieser Kette', n.beschreibung);
    }
    // KI-Agent: der Harness in Reihenfolge — Skill lesen, Kontext holen, prompten, ablegen.
    if (n.ablauf) h += row('So arbeitet er, Schritt für Schritt', n.ablauf);
    if (n.typ === 'software') {
      if (n.url) h += `<div class="k">Läuft auf</div><a class="plink" href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.url)} ↗</a>` +
        (n.laeuft === true ? ' <span class="pill kette">läuft</span>' : n.laeuft === false ? ' <span class="pill lose">aus</span>' : '');
      if (n.start) h += row('So startest du sie', n.start, true);
    }
    h += row('So nutzt du es', n.cmd || n.nutzung, true);
    if (n.datei) {
      h += row('Datei', n.datei, true);
      if (n.mtime) h += `<div class="meta" style="margin-top:6px">zuletzt geändert: ${esc(wann(n.mtime))}</div>`;
    }
    h += row('Merke', 'Diese Ansicht zeigt nur an — gebaut, geändert und ausgeführt wird im Chat.');
    document.getElementById('p-body').innerHTML = h;
    panel.classList.add('open');
  };
  function schliessePanel() {
    panel.classList.remove('open');
    document.querySelectorAll('.node.sel').forEach(x => x.classList.remove('sel'));
  }
  document.getElementById('p-close').onclick = schliessePanel;

  // ── Bausteine der Listen-Seiten ────────────────────────────────────────────────
  function seiteStart(titel, hint) {
    content.className = 'scroll';
    content.innerHTML = `<div class="seite"><div class="kopf"><h1>${esc(titel)}</h1><span class="hint">${esc(hint || '')}</span></div><div id="seite-rest"></div></div>`;
    return content.querySelector('#seite-rest');
  }
  const leer = was => `<div class="leer">Noch leer — ${was} entstehen im Chat und tauchen hier von selbst auf.</div>`;

  const wfHash = w => '#/w/' + encodeURIComponent(w.projekt) + '/' + encodeURIComponent(w.kurz);
  const graphApi = w => '/api/graph?p=' + encodeURIComponent(w.projekt) + '&wf=' + encodeURIComponent(w.kurz);

  // ── Aktivierungs-Prompt: copy-pasten in einen NEUEN Chat → der Workflow läuft ──
  // Berechnet aus Projekt-Pfad + Workflow-Datei, nichts wird gepflegt. Nur Workflows.
  function aktivierungsPrompt(w, inv) {
    const p = ((inv && inv.projekte) || []).find(x => x.name === w.projekt);
    return `Arbeite im Ordner ${p ? p.pfad : ''}.\n` +
      `Führe den AWMS-Workflow „${w.name}" aus — nutze den Skill /ausfuehren mit der Datei ${w.datei}: ` +
      `Die Workflow-Datei ist die Arbeitsanweisung. Knoten für Knoten entlang der haupt-Kanten abarbeiten, ` +
      `an jedem Homo-Sapiens-Gate STOPPEN und auf meinen Entscheid warten, Datenbanken laut liest/schreibt-Kanten ` +
      `wirklich lesen und beschreiben, am Ende ein kurzer ehrlicher Lauf-Bericht.`;
  }
  async function kopiere(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      const t = document.createElement('textarea');
      t.value = text; document.body.appendChild(t); t.select();
      const ok = document.execCommand('copy'); t.remove(); return ok;
    }
  }

  function zeigWorkflows(inv) {
    const rest = seiteStart('Workflows', 'Klick öffnet den Graph · Konzepte (nur Geister) haben einen Löschknopf');
    if (!inv.workflows.length) { rest.innerHTML = leer('Workflows'); return; }
    // Reihenfolge: fertige zuerst, dann im Bau, dann reine Konzepte — je Gruppe neueste oben.
    // Offene Geister = Geister minus bewusst zurückgestellte („später") — die zählen nicht als Arbeit.
    const offen = w => (w.geister || 0) - (w.spaeterZahl || 0);
    const rang = w => w.nurGeister ? 2 : (offen(w) > 0 ? 1 : 0);
    const ws = inv.workflows.slice().sort((a, b) =>
      rang(a) - rang(b) || String(b.mtime || '').localeCompare(String(a.mtime || '')));
    rest.innerHTML = ws.map((w, i) => `
      <div class="zeile" data-i="${i}">
        <div class="ikon"${w.nurGeister ? ' style="background:#faf3e3;color:var(--gold)"' : ''}>${w.nurGeister ? LOGO.entwurf : LOGO.workflow}</div>
        <div class="txt"><b>${esc(w.name)}</b><span>${esc(w.beschreibung)}</span></div>
        <div class="meta">${w.nurGeister
            ? '<span class="tag entwurf">Konzept — noch nichts gebaut</span>'
            : offen(w) > 0
              ? `<span class="tag entwurf">◐ ${w.bausteine - w.geister}/${w.bausteine - (w.spaeterZahl || 0)} Bausteine${w.spaeterZahl ? ` · ${w.spaeterZahl} später` : ''}</span>`
              : w.spaeterZahl > 0
                ? `<span class="tag spaeter">✓ fertig für jetzt · ${w.spaeterZahl} später</span>`
                : `${w.knotenZahl} Knoten`
          } · geändert ${esc(datum(w.mtime))}<br>
          <span class="tag geld">${esc(w.projekt)}</span>
          ${w.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <button class="loesch akt" data-i="${i}" title="Aktivierungs-Prompt kopieren — in einen neuen Chat einfügen, und dieser Workflow läuft">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg></button>
        ${w.nurGeister ? `<button class="loesch" data-i="${i}" title="Konzept löschen — löscht nur die Workflow-Datei; gebaute Bausteine gibt es hier keine">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>` : ''}
        <span class="pfeil">›</span>
      </div>`).join('');
    rest.querySelectorAll('.zeile').forEach(el =>
      el.onclick = () => { location.hash = wfHash(ws[el.dataset.i]); });
    rest.querySelectorAll('.loesch.akt').forEach(btn =>
      btn.onclick = async e => {
        e.stopPropagation();
        const ok = await kopiere(aktivierungsPrompt(ws[btn.dataset.i], inv));
        const alt = btn.innerHTML;
        btn.innerHTML = ok ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 13 4 4 10-11"/></svg>' : alt;
        setTimeout(() => { btn.innerHTML = alt; }, 1400);
      });
    rest.querySelectorAll('.loesch:not(.akt)').forEach(btn =>
      btn.onclick = async e => {
        e.stopPropagation();
        const w = ws[btn.dataset.i];
        if (!confirm(`Konzept „${w.name}" löschen?\n\nDie Datei ${w.datei} wird gelöscht. Gebaute Bausteine sind nicht betroffen (es gibt keine).`)) return;
        const r = await (await fetch('/api/konzept-loeschen', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ p: w.projekt, wf: w.kurz }),
        })).json();
        if (!r.ok) alert('Nicht gelöscht: ' + r.fehler);
        letztSig = null; zeichne(true); // sofort neu zeichnen, nicht auf den Puls warten
      });
  }

  async function oeffneOrdner(k) {
    const r = await (await fetch('/api/ordner-oeffnen', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ p: k.panel.projekt, datei: k.panel.datei }),
    })).json();
    if (!r.ok) alert('Ordner nicht geöffnet: ' + r.fehler);
  }

  function zeigKarten(titel, hint, klasse, logo, karten) {
    const rest = seiteStart(titel, hint);
    if (!karten.length) { rest.innerHTML = leer(titel); return; }
    rest.innerHTML = `<div class="grid">` + karten.map((k, i) => `
      <div class="karte ${klasse}" data-i="${i}" title="${k.titel || 'Klick = Details · Doppelklick = Ordner im Finder'}">
        <div class="kkopf"><div class="ikon">${k.logo || logo}</div><b>${esc(k.name)}</b>${k.kopfExtra || ''}</div>
        <p>${esc(k.text)}</p>
        <div class="kfuss">${k.fussL || ''}
          <span class="re">geändert ${esc(datum(k.mtime))}</span>
          <button class="ordner" data-i="${i}" title="Ordner im Finder öffnen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>
          </button></div>
      </div>`).join('') + '</div>';
    // Ein Muster für ALLE Karten: Klick = Details-Panel · Doppelklick = öffnen
    // (Software: ihre URL im Browser · sonst: Ordner im Finder).
    // Ausnahme wie bei Workflows: hat die Karte einen eigenen Graph (geheZu), öffnet Klick den.
    rest.querySelectorAll('.karte').forEach(el => {
      el.onclick = () => { const k = karten[el.dataset.i]; if (k.geheZu) location.hash = k.geheZu; else window.openPanel(k.panel); };
      el.ondblclick = () => { const k = karten[el.dataset.i]; if (k.oeffnen) k.oeffnen(); else oeffneOrdner(k); };
    });
    rest.querySelectorAll('.ordner').forEach(btn =>
      btn.onclick = e => { e.stopPropagation(); oeffneOrdner(karten[btn.dataset.i]); });
  }

  function zeigBefund(inv) {
    const rest = seiteStart('Befund', 'bei jedem Laden frisch berechnet — nichts wird gepflegt');
    const b = inv.befunde || [];
    if (!b.length) {
      rest.innerHTML = '<div class="leer">Keine Auffälligkeiten — jede Datenbank hat Leser, keine Referenz zeigt ins Leere, keine Dubletten.</div>';
      return;
    }
    const TITEL = { rot: 'Kaputt oder ungebaut', gold: 'Auffällig', grau: 'Lose Enden' };
    let h = '';
    for (const stufe of ['rot', 'gold', 'grau']) {
      const gruppe = b.filter(x => x.schwere === stufe);
      if (!gruppe.length) continue;
      h += `<div class="kopf" style="margin-top:18px"><h1 style="font-size:15px">${TITEL[stufe]}</h1><span class="hint">${gruppe.length}</span></div>`;
      h += gruppe.map(x => `
        <div class="zeile befund-${stufe}" data-ziel="${esc(x.ziel || '')}">
          <span class="bpunkt ${stufe}"></span>
          <div class="txt"><b>${esc(x.art)}</b><span>${esc(x.text)}</span></div>
          <div class="meta">${esc(x.projekt || '')}</div>
          <span class="pfeil">›</span>
        </div>`).join('');
    }
    rest.innerHTML = h;
    rest.querySelectorAll('.zeile[data-ziel]').forEach(el => {
      el.onclick = () => { if (el.dataset.ziel) location.hash = el.dataset.ziel; };
    });
  }

  // ── Router mit Live-Puls ───────────────────────────────────────────────────────
  // EIN Mechanismus für alle Seiten: Daten holen → Signatur vergleichen → nur bei
  // Änderung neu zeichnen. Graph-Ansichten behalten den Blickwinkel, Listen den Scroll.
  function navAktiv(key) {
    document.querySelectorAll('.nv').forEach(a => a.classList.toggle('on', a.dataset.nav === key));
  }
  async function api(p) {
    const r = await fetch(p);
    return r.json();
  }

  let liveTimer = null;
  let letztSig = null;
  let graphAnsicht = null; // View-Handle des aktuell gezeichneten Graphen

  async function zeichne(erste) {
    const h = location.hash.replace(/^#\/?/, '') || 's/leichtkraut/leichtkraut-ads';
    const [seite, ...rest] = h.split('/');

    // Alte Entwurf-Routen: Entwurf ist jetzt ein Zustand in der Workflows-Liste.
    if (seite === 'entwurf') {
      location.hash = rest.length >= 2 ? '#/w/' + rest.join('/') : '#/workflows';
      return;
    }

    let inv;
    try { inv = await api('/api/inventar'); }
    catch {
      if (!erste) return; // Server kurz weg — nächster Puls versucht es wieder
      content.className = 'scroll';
      content.innerHTML = '<div class="seite"><div class="leer">Server nicht erreichbar — läuft <code>node app/server.mjs</code>?</div></div>';
      return;
    }
    const befundRelevant = (inv.befunde || []).filter(b => b.schwere !== 'grau');
    const zahlen = { workflows: inv.workflows.length, befund: befundRelevant.length, skills: inv.skills.length, tools: inv.tools.length, software: (inv.software || []).length, softwareBausteine: (inv.softwareBausteine || []).length, datenbanken: inv.datenbanken.length };
    document.querySelectorAll('[data-zahl]').forEach(el => { el.textContent = zahlen[el.dataset.zahl]; });
    const befundZahl = document.querySelector('[data-zahl="befund"]');
    if (befundZahl) befundZahl.classList.toggle('alarm', (inv.befunde || []).some(b => b.schwere === 'rot'));

    // Zweitdaten für Graph-Ansichten
    let graphDaten = null;
    if (seite === 'w' && rest.length >= 2) graphDaten = await api('/api/graph?p=' + rest[0] + '&wf=' + rest.slice(1).join('/'));
    else if (seite === 's' && rest.length >= 2) graphDaten = await api('/api/agentik?p=' + rest[0] + '&sw=' + rest[1] + (rest[2] ? '&awf=' + rest[2] : '') + (rest[3] === 'idee' ? '&ebene=idee' : ''));
    else if (!['workflows', 'befund', 'skills', 'tools', 'software', 'software-bausteine', 'datenbanken'].includes(seite)) graphDaten = await api('/api/uebersicht');

    // Nichts geändert → nichts neu zeichnen (Puls läuft weiter). Der gelesen-Zeitstempel
    // ändert sich bei JEDEM Abruf — er bleibt draußen, sonst zeichnet der Puls immer neu
    // (und verworfene Zettel-/Blickwinkel-Optik würde alle 2 s zurückschnappen).
    const sig = h + '§' + JSON.stringify({ ...inv, gelesen: 0 }) +
      '§' + JSON.stringify(graphDaten ? { ...graphDaten, gelesen: 0 } : null);
    if (!erste && sig === letztSig) return;
    letztSig = sig;

    const scrollVorher = content.scrollTop;
    const view = graphAnsicht && graphAnsicht.getView && graphAnsicht.getView();
    graphAnsicht = null;

    if (seite === 'w' && rest.length >= 2) {
      navAktiv('workflows');
      graphAnsicht = renderGraph(content, graphDaten, {
        live: true, startView: !erste && view && view.bewegt ? view : null,
        aktivierungsText: graphDaten && graphDaten.workflow ? aktivierungsPrompt(graphDaten.workflow, inv) : null,
        kopiere,
      });
    } else if (seite === 's' && rest.length >= 2) {
      // Innenleben einer Software: Agentik-Karte als Graph (wo die KI entscheidet).
      // Tabs oben wechseln zwischen den internen Workflows (je eigener Trigger).
      navAktiv('software');
      graphAnsicht = renderGraph(content, graphDaten, {
        live: true, startView: !erste && view && view.bewegt ? view : null,
        aufAgentikWf: name => { location.hash = '#/s/' + rest[0] + '/' + rest[1] + '/' + encodeURIComponent(name); },
        aufEbene: e => {
          const wf = rest[2] || encodeURIComponent((graphDaten && graphDaten.aktivWf) || '');
          location.hash = '#/s/' + rest[0] + '/' + rest[1] + '/' + wf + (e === 'idee' ? '/idee' : '');
        },
      });
    } else if (seite === 'befund') {
      navAktiv('befund');
      zeigBefund(inv);
    } else if (seite === 'workflows') {
      navAktiv('workflows');
      zeigWorkflows(inv);
    } else if (seite === 'skills') {
      navAktiv('skills');
      zeigKarten('Skills', `${inv.skills.length} Stück · im Chat triggerbar als /befehl · Klick = Detail`, 'k-skill', LOGO.skill,
        inv.skills.map(s => ({
          name: s.id, text: ohneMarker(s.beschreibung), mtime: s.mtime,
          fussL: `<code>${esc(s.cmd)}</code> <span class="pill ${s.inKetten.length ? 'kette' : 'lose'}">${s.inKetten.length ? (s.inKetten.length === 1 ? 'in 1 Kette' : `in ${s.inKetten.length} Ketten`) : 'lose'}</span>`,
          panel: {
            typ: 'skill', name: s.id, projekt: s.projekt, beschreibungDatei: s.beschreibung,
            einsatz: s.inKetten.length ? s.inKetten.join(' · ') : 'lose — in keiner Kette',
            cmd: s.cmd, datei: s.datei, mtime: s.mtime,
          },
        })));
    } else if (seite === 'tools') {
      navAktiv('tools');
      zeigKarten('Tools', `${inv.tools.length} Stück · Code, der Fähigkeiten erweitert · Klick = Detail`, 'k-tool', LOGO.tool,
        inv.tools.map(t => ({
          name: t.id, text: ohneMarker(t.kurz || t.beschreibung), mtime: t.mtime,
          fussL: `<code>tools/${esc(t.id)}</code>`,
          panel: { typ: 'tool', name: t.id, projekt: t.projekt, beschreibungDatei: t.beschreibung, datei: t.datei, mtime: t.mtime },
        })));
    } else if (seite === 'software') {
      navAktiv('software');
      const sw = inv.software || [];
      zeigKarten('Software', `${sw.length} Stück · vom Menschen bedient, kein Baustein · Klick = Details · Doppelklick = im Browser öffnen`, 'k-software', LOGO.software,
        sw.map(s => ({
          name: s.name, text: ohneMarker(s.kurz || s.beschreibung), mtime: s.mtime,
          titel: (s.agentik ? 'Klick = Innenleben (wo die KI entscheidet)' : 'Klick = Details')
            + (s.url ? ' · Doppelklick = im Browser öffnen' : ' · Doppelklick = Ordner im Finder'),
          kopfExtra: `<span class="led ${s.laeuft ? 'an' : 'aus'}" title="${s.laeuft ? 'läuft gerade' : 'aus — Start im Chat sagen'}"></span>`,
          fussL: `${s.laeuft ? '<span class="pill kette">läuft</span>' : '<span class="pill lose">aus</span>'}${s.agentik ? ' <span class="pill agentik">Innenleben</span>' : ''} <code>${esc(s.url || 'keine url')}</code>`,
          geheZu: s.agentik ? '#/s/' + encodeURIComponent(s.projekt) + '/' + encodeURIComponent(s.id) : null,
          oeffnen: s.url ? (() => window.open(s.url, '_blank')) : null,
          panel: { typ: 'software', name: s.name, projekt: s.projekt, beschreibungDatei: s.beschreibung, datei: s.datei, mtime: s.mtime, url: s.url, laeuft: s.laeuft, start: s.start },
        })));
    } else if (seite === 'software-bausteine') {
      // Das Innenleben der Software als Liste: KI-Agenten, ihr Wissen, ihre Speicher.
      navAktiv('software-bausteine');
      const sb = inv.softwareBausteine || [];
      const TYP_PILL = { agent: 'KI-Agent', wissen: 'Software Skill', datenbank: 'Speicher', tool: 'Tool' };
      zeigKarten('Software-Bausteine', `${sb.length} Stück · das Innenleben der Software: KI-Agenten, ihre Skills, Tools, Speicher · Klick = Detail`, 'k-swbaustein', LOGO.agent,
        sb.map(x => ({
          name: x.name, text: ohneMarker(x.beschreibung), mtime: x.mtime,
          logo: x.typ === 'tool' ? LOGO.dienst : (LOGO[x.typ] || LOGO.agent),
          titel: 'Klick = Details · Doppelklick = im Innenleben-Graph sehen',
          fussL: `<span class="pill agentik">${TYP_PILL[x.typ] || x.typ}</span> <code>${esc(x.software)}</code>`,
          oeffnen: () => { location.hash = '#/s/' + encodeURIComponent(x.projekt) + '/' + encodeURIComponent(x.swId); },
          panel: {
            typ: x.typ, name: x.name, projekt: x.projekt,
            einsatz: `${x.software} — Innenleben`,
            beschreibungDatei: x.beschreibung, datei: x.datei, mtime: x.mtime,
          },
        })));
    } else if (seite === 'datenbanken') {
      navAktiv('datenbanken');
      zeigKarten('Datenbanken', `${inv.datenbanken.length} Stück · Bausteine im Graph, kein Untergrund · Klick = Vertragskarte`, 'k-datenbank', LOGO.datenbank,
        inv.datenbanken.map(d => ({
          name: d.id, text: d.zweck, mtime: d.mtime,
          logo: d.art === 'vektor' ? LOGO.vektor : undefined,
          fussL: `<code>${esc(d.typ.split('(')[0].trim())}</code>`,
          panel: { typ: 'datenbank', name: d.id, projekt: d.projekt, db: d, datei: d.datei, mtime: d.mtime },
        })));
    } else {
      navAktiv('uebersicht');
      if (!graphDaten.fehler && (!graphDaten.knoten || !graphDaten.knoten.length)) {
        const rest2 = seiteStart('Übersicht', 'Meta-Graph: wie deine Workflows zusammenhängen');
        rest2.innerHTML = leer('Workflows und Datenbanken') +
          (graphDaten.warnungen && graphDaten.warnungen.length ? `<p style="margin-top:12px;font-size:12.5px;color:var(--mut)">${esc(graphDaten.warnungen.join(' · '))}</p>` : '');
      } else {
        graphAnsicht = renderGraph(content, graphDaten, {
          meta: true, live: true,
          startView: !erste && view && view.bewegt ? view : null,
          aufWorkflow: n => { location.hash = wfHash(n); },
        });
      }
    }
    if (content.className === 'scroll' && !erste) content.scrollTop = scrollVorher;
  }

  async function route() {
    schliessePanel();
    if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
    letztSig = null;
    graphAnsicht = null;
    await zeichne(true);
    liveTimer = setInterval(() => { zeichne(false).catch(() => { /* nächster Puls */ }); }, 2000);
  }

  window.addEventListener('hashchange', route);
  route();
})();
