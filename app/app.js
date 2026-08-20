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
  const datumZeit = iso => { try { return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)); } catch { return '—'; } };
  const zahl = n => new Intl.NumberFormat('de-DE').format(Math.round(n || 0));
  const kompakt = n => { // 1,2 Mrd · 3,4 Mio · 56k · 789 — lesbar statt Ziffernwurst
    n = n || 0;
    if (n >= 1e9) return (n / 1e9).toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ' Mrd';
    if (n >= 1e6) return (n / 1e6).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' Mio';
    if (n >= 1e4) return Math.round(n / 1e3).toLocaleString('de-DE') + 'k';
    return zahl(n);
  };

  // Seitenleisten-Icons einsetzen (dieselben Logos wie im Graph — eine Formsprache überall)
  document.querySelectorAll('[data-ic]').forEach(el => { el.innerHTML = LOGO[el.dataset.ic] || ''; });

  // ── Detail-Panel (überall gleich: zeigt, was in den DATEIEN steht, plus mtime) ──
  const panel = document.getElementById('panel');
  const row = (k, v, code) => v ? `<div class="k">${k}</div>${code ? `<code>${esc(v)}</code>` : esc(v).replace(/\n/g, '<br>')}` : '';
  const MD_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M6 3.5h8l4.5 4.5v11.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z"/><path d="M14 3.5V8h4.5"/><path d="M8.5 12.2h7M8.5 15.6h5"/></svg>';
  const FOLDER_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3.5 6.2A1.7 1.7 0 0 1 5.2 4.5h4.1l2 2.3h7.5a1.7 1.7 0 0 1 1.7 1.7v9.3a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7V6.2z"/></svg>';
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
    // Externe Dienste (Stecker): welche bezahlten Modelle/APIs dieser Knoten ruft.
    if (Array.isArray(n.dienste) && n.dienste.length) h += row('Externe Dienste (Stecker)', n.dienste.join(' · '));
    // Umgebung: Standard-Rechenort ist der Server — nur Ausnahme-Knoten tragen das Feld.
    if (n.umgebung === 'mac') h += row('Umgebung', 'Mac — dieser Schritt läuft lokal bei Gaylord, nicht auf dem Server');
    // KI-Agent: der Harness in Reihenfolge — Skill lesen, Kontext holen, prompten, ablegen.
    if (n.ablauf) h += row('So arbeitet er, Schritt für Schritt', n.ablauf);
    if (n.typ === 'software') {
      if (n.url) h += `<div class="k">Läuft auf</div><a class="plink" href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.url)} ↗</a>` +
        (n.laeuft === true ? ' <span class="pill kette">läuft</span>' : n.laeuft === false ? ' <span class="pill lose">aus</span>' : '');
      if (n.start) h += row('So startest du sie', n.start, true);
    }
    h += row('So nutzt du es', n.cmd || n.nutzung, true);
    // KI-Node: welche MD-Dateien er als Kontext liest — Klick = im Leser lesen,
    // Doppelklick = im Finder zeigen (Gaylords Ansage: lesen gehört ins Tool).
    // A/B-Klarheit (Gaylords Ansage 16.07.2026): Ein „überarbeiteter" Agent liest oft
    // mehrere Skills — die Karte muss AUSSPRECHEN, welcher sich ändert. Und wenn
    // keiner: auch das sagen (strukturelle Änderung), statt den Menschen raten zu lassen.
    if (n.neu && n.typ === 'agent') {
      const imTest = (n.skillDateien || []).filter(s => s.ab);
      const geaendert = imTest.filter(s => !s.ab.gleich).map(s => s.name);
      h += row('A/B — was ändert sich an diesem Schritt', geaendert.length
        ? `Skill-Inhalt geändert: ${geaendert.join(' · ')} — unten mit ✦ markiert, Klick öffnet den A⇄B-Vergleich. Alle anderen gelesenen Skills sind unverändert.`
        : imTest.length
          ? `Im Test: ${imTest.map(s => s.name).join(' · ')} — die B-Arbeitskopie ist noch IDENTISCH mit A und wartet aufs erste Feedback. Sobald sich ein Satz ändert, steht hier „geändert" und der Vergleich zeigt ihn.`
          : 'Kein Skill-Inhalt geändert — die Änderung ist strukturell (siehe „Was es tut"). Alle gelesenen Skills sind dieselben wie auf der Aktuell-Ebene.');
    }
    if (n.skillDateien && n.skillDateien.length) {
      // Überarbeitete Skills (A/B-Test) tragen ein ✦-Abzeichen; ihr Klick öffnet den
      // A⇄B-Vergleich statt des normalen Lesers — man sieht sofort, WELCHER der
      // gelesenen Skills sich in der Idee ändert und WAS genau.
      h += `<div class="k">Liest als Kontext (MD-Dateien)</div>` + n.skillDateien.map(s => s.datei
        ? `<div class="skillrow${s.ab ? ' ab' : ''}" data-p="${esc(n.projekt)}" data-datei="${esc(s.datei)}" data-name="${esc(s.name)}"${s.ab ? ` data-a="${esc(s.ab.a)}" data-b="${esc(s.ab.b)}"` : ''} title="${s.ab ? 'A⇄B-Vergleich öffnen — Doppelklick: im Finder zeigen' : 'Lesen — Doppelklick: im Finder zeigen'}">${MD_ICON}<span class="sr-txt"><b>${esc(s.name)}</b>${s.ab ? (s.ab.gleich ? '<span class="sr-ab">✦ im Test · noch identisch</span>' : '<span class="sr-ab">✦ überarbeitet</span>') : ''}<code>${esc(s.datei)}</code></span><span class="sr-go">›</span></div>`
        : `<div class="skillrow aus">${MD_ICON}<span class="sr-txt"><b>${esc(s.name)}</b><code>Datei nicht gefunden</code></span></div>`).join('');
    }
    if (n.datei) {
      h += row('Datei', n.datei, true);
      // Skills (normal UND Software-Skills mit aufgelöster Datei): Lesen im Tool ist der
      // Hauptweg; der Finder bleibt als kleines Neben-Icon.
      if ((n.typ === 'skill' || (n.typ === 'wissen' && n.skillDatei)) && n.projekt) {
        h += `<div class="p-aktionen">` +
          // Überarbeiteter Skill (A/B): der Vergleich ist der Hauptweg — alter Stand ⇄ neuer
          // Stand, Zeile für Zeile. „Lesen" zeigt weiterhin nur die B-Datei.
          (n.abVergleich ? `<button class="p-ab" data-p="${esc(n.projekt)}" data-a="${esc(n.abVergleich.a)}" data-b="${esc(n.abVergleich.b)}" data-name="${esc(n.name)}"><span class="ab-zeichen">A⇄B</span><span>Vergleichen</span></button>` : '') +
          `<button class="p-lesen" data-p="${esc(n.projekt)}" data-datei="${esc(n.datei)}" data-name="${esc(n.name)}">${MD_ICON}<span>Lesen</span></button>` +
          `<button class="p-finder nur-icon" data-p="${esc(n.projekt)}" data-datei="${esc(n.datei)}" title="Im Finder zeigen">${FOLDER_ICON}</button></div>`;
      }
      if (n.mtime) h += `<div class="meta" style="margin-top:6px">zuletzt geändert: ${esc(wann(n.mtime))}</div>`;
    }
    h += row('Merke', 'Diese Ansicht zeigt nur an — gebaut, geändert und ausgeführt wird im Chat.');
    document.getElementById('p-body').innerHTML = h;
    const imFinder = async d => {
      const r = await (await fetch('/api/ordner-oeffnen', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ p: d.p, datei: d.datei, reveal: true }),
      })).json();
      if (!r.ok) alert('Nicht geöffnet: ' + r.fehler);
    };
    document.querySelectorAll('#p-body .skillrow[data-datei]').forEach(fb => {
      fb.onclick = () => fb.dataset.a
        ? oeffneVergleich(fb.dataset.p, fb.dataset.a, fb.dataset.b, fb.dataset.name)
        : oeffneLeser(fb.dataset.p, fb.dataset.datei, fb.dataset.name);
      fb.ondblclick = () => imFinder(fb.dataset);
    });
    document.querySelectorAll('#p-body .p-lesen').forEach(b => {
      b.onclick = () => oeffneLeser(b.dataset.p, b.dataset.datei, b.dataset.name);
    });
    document.querySelectorAll('#p-body .p-ab').forEach(b => {
      b.onclick = () => oeffneVergleich(b.dataset.p, b.dataset.a, b.dataset.b, b.dataset.name);
    });
    document.querySelectorAll('#p-body .p-finder').forEach(b => { b.onclick = () => imFinder(b.dataset); });
    panel.classList.add('open');
  };
  function schliessePanel() {
    panel.classList.remove('open');
    document.querySelectorAll('.node.sel').forEach(x => x.classList.remove('sel'));
  }
  document.getElementById('p-close').onclick = schliessePanel;

  // ── Leser: MD-Dateien als schwebende Pages IM Tool lesen ──────────────────────
  // Gaylords Ansage (15.07.2026): Skills liest man in AWMS, nicht in VS Code. Mehrere
  // Pages gleichzeitig (Agent mit mehreren Skills), ziehbar am Kopf, Größe per
  // nativem Resize-Griff unten rechts. Finder bleibt als kleines Neben-Icon.
  let leserZ = 300, leserN = 0;
  function leserFokus(el) { el.style.zIndex = ++leserZ; }
  async function oeffneLeser(p, datei, name) {
    const key = p + '|' + datei;
    const offen = [...document.querySelectorAll('.leser')].find(x => x.dataset.key === key);
    if (offen) { leserFokus(offen); return; }               // schon offen → nach vorn holen
    const r = await (await fetch(`/api/lesen?p=${encodeURIComponent(p)}&datei=${encodeURIComponent(datei)}`)).json();
    const el = document.createElement('div');
    el.className = 'leser'; el.dataset.key = key;
    const off = (leserN++ % 7) * 28;                        // neue Pages kaskadieren
    el.style.left = `min(calc(50% - 310px + ${off}px), calc(100vw - 640px))`;
    el.style.top = (66 + off) + 'px';
    el.innerHTML =
      `<div class="leser-kopf" title="Ziehen zum Verschieben">${MD_ICON}` +
      `<b>${esc(name || datei.split('/').pop())}</b><code>${esc(datei)}</code>` +
      `<button class="leser-btn lb-finder" title="Im Finder zeigen">${FOLDER_ICON}</button>` +
      `<button class="leser-btn lb-zu" title="Schließen">✕</button></div>` +
      `<div class="leser-body md">${r.ok ? mdHtml(r.inhalt) : `<p class="leser-fehler">${esc(r.fehler || 'Datei nicht lesbar.')}</p>`}</div>` +
      (r.mtime ? `<div class="leser-fuss">zuletzt geändert: ${esc(wann(r.mtime))}</div>` : '');
    document.body.appendChild(el);
    leserFokus(el);
    el.addEventListener('pointerdown', () => leserFokus(el));
    el.querySelector('.lb-zu').onclick = () => el.remove();
    el.querySelector('.lb-finder').onclick = () => fetch('/api/ordner-oeffnen', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ p, datei, reveal: true }),
    });
    macheZiehbar(el);
  }
  // Kopf ziehen = Fenster verschieben (Leser UND A/B-Vergleich teilen sich das).
  function macheZiehbar(el) {
    const kopf = el.querySelector('.leser-kopf');
    kopf.addEventListener('pointerdown', ev => {
      if (ev.target.closest('button')) return;
      const r0 = el.getBoundingClientRect(), dx = ev.clientX - r0.left, dy = ev.clientY - r0.top;
      el.style.left = r0.left + 'px'; el.style.top = r0.top + 'px';  // min()-Formel einfrieren
      const move = m => {
        el.style.left = Math.min(Math.max(8 - r0.width + 60, m.clientX - dx), innerWidth - 60) + 'px';
        el.style.top = Math.min(Math.max(8, m.clientY - dy), innerHeight - 40) + 'px';
      };
      const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
      addEventListener('pointermove', move); addEventListener('pointerup', up);
      ev.preventDefault();
    });
  }

  // ── A/B-Vergleich: alter Skill ⇄ neuer Skill, Zeile für Zeile ─────────────────
  // Gaylords Ansage (16.07.2026): Wenn ein Feedback/A/B-Test einen Skill überarbeitet,
  // will der Mensch SEHEN, was sich ändert — beide Stände nebeneinander, Grün =
  // neu (unterstrichen), Rot = entfernt (durchgestrichen). Für Menschen gebaut.
  function diffZeilen(A, B) {
    // Klassisches LCS über Zeilen — Skills sind klein, die Tabelle ist billig.
    const n = A.length, m = B.length;
    const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
      L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const ops = []; let i = 0, j = 0;
    while (i < n && j < m) {
      if (A[i] === B[j]) { ops.push(['=', A[i], B[j]]); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) ops.push(['-', A[i++], null]);
      else ops.push(['+', null, B[j++]]);
    }
    while (i < n) ops.push(['-', A[i++], null]);
    while (j < m) ops.push(['+', null, B[j++]]);
    return ops;
  }
  // Wort-Feinmarkierung für geänderte Zeilenpaare: gemeinsame Wörter bleiben ruhig,
  // nur die wirklich geänderten Stücke leuchten (<mark>). Escaped Token für Token.
  function markiereWorte(a, b) {
    const ta = a.split(/(\s+)/), tb = b.split(/(\s+)/);
    const n = ta.length, m = tb.length;
    if (n * m > 40000) return { a: esc(a), b: esc(b) };   // Notbremse bei Monsterzeilen
    const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
      L[i][j] = ta[i] === tb[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    let i = 0, j = 0, ha = '', hb = '';
    while (i < n && j < m) {
      if (ta[i] === tb[j]) { ha += esc(ta[i]); hb += esc(tb[j]); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) ha += `<mark>${esc(ta[i++])}</mark>`;
      else hb += `<mark>${esc(tb[j++])}</mark>`;
    }
    while (i < n) ha += `<mark>${esc(ta[i++])}</mark>`;
    while (j < m) hb += `<mark>${esc(tb[j++])}</mark>`;
    return { a: ha, b: hb };
  }
  async function oeffneVergleich(p, dateiA, dateiB, name) {
    const key = p + '|ab|' + dateiA + '|' + dateiB;
    const offen = [...document.querySelectorAll('.leser')].find(x => x.dataset.key === key);
    if (offen) { leserFokus(offen); return; }
    const [ra, rb] = await Promise.all([
      (await fetch(`/api/lesen?p=${encodeURIComponent(p)}&datei=${encodeURIComponent(dateiA)}`)).json(),
      (await fetch(`/api/lesen?p=${encodeURIComponent(p)}&datei=${encodeURIComponent(dateiB)}`)).json(),
    ]);
    const el = document.createElement('div');
    el.className = 'leser vergleich'; el.dataset.key = key;
    const off = (leserN++ % 7) * 28;
    el.style.left = `min(calc(50% - 480px + ${off}px), calc(100vw - 990px))`;
    el.style.top = (60 + off) + 'px';
    let body = '', fuss = '', exportText = '';
    if (!ra.ok || !rb.ok) {
      body = `<p class="leser-fehler">${esc(ra.fehler || rb.fehler || 'Dateien nicht lesbar.')}</p>`;
    } else {
      // Ops → Anzeige-Zeilen: −/+-Läufe werden paarweise zu „geändert" (Wort-Marks),
      // Überhänge bleiben reine Löschung/Ergänzung. Gleiche Läufe > 9 Zeilen falten.
      // Gaylords Lese-Regeln (16.07.2026): NUR Zellfarben tragen die Bedeutung — nur grün =
      // kommt neu dazu · grün NEBEN rot = ersetzt etwas Altes · nur rot = fällt ersatzlos
      // weg. Keine Unter-/Durchstreichungen. Sterne (**) werden fürs Auge entfernt,
      // Übergangs-Notizen (>-Zeilen) rendern GELB statt grün/rot.
      const istNotiz = z => /^\s*>/.test(z);
      const anzeige = z => z.replace(/^\s*>\s?/, '').replace(/\*\*/g, '');
      const nz = z => istNotiz(z) ? ' notiz' : '';
      const ops = diffZeilen(ra.inhalt.split('\n'), rb.inhalt.split('\n'));
      const zeilen = []; let dels = [], adds = [], nNeu = 0, nWeg = 0, nMod = 0;
      // Export für Claude (Gaylords Ansage 16.07.2026): der Vergleich als Copy-Paste-Text,
      // den ein Chat ohne AWMS versteht — Marker je Zeile, RAW-Markdown bleibt erhalten.
      const exp = [];
      const NBSP = ' ';
      const spuele = () => {
        const paare = Math.min(dels.length, adds.length); nMod += paare;
        for (let k = 0; k < paare; k++) {
          const w = markiereWorte(anzeige(dels[k]), anzeige(adds[k]));
          zeilen.push(`<div class="vgl-row"><div class="vgl-cell del${nz(dels[k])}">${w.a || NBSP}</div><div class="vgl-cell add${nz(adds[k])}">${w.b || NBSP}</div></div>`);
          exp.push('[~A] ' + dels[k], '[~B] ' + adds[k]);
        }
        for (let k = paare; k < dels.length; k++) { nWeg++; zeilen.push(`<div class="vgl-row"><div class="vgl-cell del${nz(dels[k])}">${esc(anzeige(dels[k])) || NBSP}</div><div class="vgl-cell leer">${NBSP}</div></div>`); exp.push('[-] ' + dels[k]); }
        for (let k = paare; k < adds.length; k++) { nNeu++; zeilen.push(`<div class="vgl-row"><div class="vgl-cell leer">${NBSP}</div><div class="vgl-cell add${nz(adds[k])}">${esc(anzeige(adds[k])) || NBSP}</div></div>`); exp.push('[+] ' + adds[k]); }
        dels = []; adds = [];
      };
      let gleich = [];
      const spueleGleich = () => {
        if (gleich.length > 9) {
          const kopfZ = gleich.slice(0, 3), fussZ = gleich.slice(-2), mitte = gleich.slice(3, -2);
          for (const z of kopfZ) zeilen.push(z);
          zeilen.push(`<div class="vgl-falt" data-n="${mitte.length}"><span>⋯ ${mitte.length} unveränderte Zeilen</span><template>${mitte.join('')}</template></div>`);
          for (const z of fussZ) zeilen.push(z);
        } else for (const z of gleich) zeilen.push(z);
        gleich = [];
      };
      for (const [op, za, zb] of ops) {
        if (op === '=') { spuele(); gleich.push(`<div class="vgl-row"><div class="vgl-cell${nz(za)}">${esc(anzeige(za)) || NBSP}</div><div class="vgl-cell${nz(zb)}">${esc(anzeige(zb)) || NBSP}</div></div>`); exp.push('[=] ' + za); }
        else { spueleGleich(); if (op === '-') dels.push(za); else adds.push(zb); }
      }
      spuele(); spueleGleich();
      // Noch keine Änderung: der Loop-Test ist offen, aber es kam noch kein /feedback —
      // deutlich sagen statt den Menschen zwei gleiche Spalten deuten zu lassen.
      const nichtsGeaendert = (nNeu + nWeg + nMod) === 0;
      const banner = nichtsGeaendert
        ? `<div class="vgl-leer">Noch keine Änderung — A und B sind identisch. Sobald du <b>/feedback</b> gibst, landet das Prinzip in B und die Unterschiede erscheinen hier in Grün &amp; Rot.</div>`
        : '';
      body =
        `<div class="vgl-kopfzeile"><div class="vgl-seite a"><b>Aktuell (A)</b><code>${esc(dateiA)}</code></div>` +
        `<div class="vgl-seite b"><b>Idee (B)</b><code>${esc(dateiB)}</code></div></div>` +
        banner +
        `<div class="vgl-zeilen">${zeilen.join('')}</div>`;
      fuss = nichtsGeaendert
        ? `<span class="vgl-leg still">Noch identisch — wartet auf das erste Feedback</span>`
        : `<span class="vgl-leg add">＋${nNeu + nMod} neu/geändert</span><span class="vgl-leg del">−${nWeg + nMod} alt</span>` +
          `<span class="vgl-leg still">nur Grün = neu dazu · Grün neben Rot = ersetzt Altes · nur Rot = fällt weg · Gelb = Übergangs-Notiz</span>`;
      // Copy-Paste-Export: selbsterklärend für einen Claude-Chat OHNE AWMS (Legende im
      // Kopf, Marker je Zeile, roher Skill-Text). Muss zum System-Prompt in
      // PROMPT-skill-consultant.md passen — beide beschreiben DASSELBE Format.
      exportText =
        '=== AWMS A/B-VERGLEICH (Skill) ===\n' +
        `Skill: ${name || dateiB.split('/').pop()}\n` +
        `A (Aktuell — die live geltende Fassung): ${dateiA}\n` +
        `B (Idee — die Arbeitskopie im laufenden A/B-Test): ${dateiB}\n\n` +
        'LEGENDE (Marker am Zeilenanfang):\n' +
        '[=]  unverändert — steht identisch in A und B\n' +
        '[~A] alte Fassung — wird ersetzt durch die direkt folgende [~B]-Zeile\n' +
        '[~B] neue Fassung — ersetzt die direkt vorangehende [~A]-Zeile\n' +
        '[-]  nur in A — fällt in B ersatzlos weg\n' +
        '[+]  nur in B — kommt neu dazu\n' +
        'Zeilen, deren Inhalt mit "> " beginnt, sind Übergangs-Notizen für den Menschen — Meta, NICHT Teil der Skill-Regeln.\n\n' +
        '=== DIFF (der ganze Skill, Zeile für Zeile, in Original-Reihenfolge) ===\n' +
        exp.join('\n');
    }
    el.innerHTML =
      `<div class="leser-kopf" title="Ziehen zum Verschieben"><span class="ab-zeichen">A⇄B</span>` +
      `<b>${esc(name || 'Skill')}</b><code>alter Stand ⇄ neuer Stand</code>` +
      `<button class="leser-btn lb-copy" title="Für Claude kopieren — selbsterklärendes A/B-Textformat (in claude.ai einfügen)">⧉</button>` +
      `<button class="leser-btn lb-zu" title="Schließen">✕</button></div>` +
      `<div class="leser-body vgl-body">${body}</div>` +
      `<div class="leser-fuss vgl-fuss">${fuss}</div>`;
    document.body.appendChild(el);
    leserFokus(el);
    el.addEventListener('pointerdown', () => leserFokus(el));
    el.querySelector('.lb-zu').onclick = () => el.remove();
    // Kopieren fürs Mitnehmen in einen Claude-Chat (Gaylords Consultant-Use-Case).
    const copyBtn = el.querySelector('.lb-copy');
    if (!exportText) copyBtn.remove();
    else copyBtn.onclick = async () => {
      try { await navigator.clipboard.writeText(exportText); copyBtn.textContent = '✓'; copyBtn.classList.add('ok'); }
      catch { copyBtn.textContent = '✕'; }
      setTimeout(() => { copyBtn.textContent = '⧉'; copyBtn.classList.remove('ok'); }, 1400);
    };
    el.querySelectorAll('.vgl-falt').forEach(f => {
      f.onclick = () => { f.outerHTML = f.querySelector('template').innerHTML; };
    });
    macheZiehbar(el);
  }

  // Mini-Markdown → HTML, zero-dependency. Kann: Frontmatter, Überschriften, fett/kursiv,
  // Inline-Code, Code-Blöcke, Tabellen (scrollen bei Überbreite), Listen, Zitate, Links, HR.
  function mdHtml(src) {
    const E = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const inline = s => E(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/(^|[\s(>„])\*([^*\n]+)\*(?=[\s).,;:!?“]|$)/g, '$1<i>$2</i>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) =>
        /^https?:/.test(u) ? `<a href="${u}" target="_blank" rel="noopener">${t}</a>` : `<span class="mdlink">${t}</span>`);
    const bloecke = txt => {
      const z = txt.split('\n'); let h = '', abs = [], li = null, zit = [];
      const fAbs = () => { if (abs.length) { h += `<p>${inline(abs.join(' '))}</p>`; abs = []; } };
      const fLi = () => { if (li) { h += `<${li.t}>` + li.e.map(x => `<li>${inline(x)}</li>`).join('') + `</${li.t}>`; li = null; } };
      const fZit = () => { if (zit.length) { h += `<blockquote>${inline(zit.join(' '))}</blockquote>`; zit = []; } };
      for (let i = 0; i < z.length; i++) {
        const l = z[i];
        // Tabelle: |-Zeile, gefolgt von |---|-Trenner
        if (/^\s*\|/.test(l) && /^\s*\|[\s|:-]+\|?\s*$/.test(z[i + 1] || '')) {
          fAbs(); fLi(); fZit();
          const zellen = s => s.trim().replace(/^\||\|$/g, '').split('|').map(x => inline(x.trim()));
          let t = `<div class="tbl"><table><tr>${zellen(l).map(c => `<th>${c}</th>`).join('')}</tr>`;
          i += 2;
          for (; i < z.length && /^\s*\|/.test(z[i]); i++)
            t += `<tr>${zellen(z[i]).map(c => `<td>${c}</td>`).join('')}</tr>`;
          i--; h += t + '</table></div>'; continue;
        }
        let m;
        if ((m = l.match(/^(#{1,4})\s+(.*)/))) { fAbs(); fLi(); fZit(); h += `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`; }
        else if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) { fAbs(); fLi(); fZit(); h += '<hr>'; }
        else if ((m = l.match(/^>\s?(.*)/))) { fAbs(); fLi(); zit.push(m[1]); }
        else if ((m = l.match(/^\s*[-*]\s+(.*)/))) { fAbs(); fZit(); if (!li || li.t !== 'ul') { fLi(); li = { t: 'ul', e: [] }; } li.e.push(m[1]); }
        else if ((m = l.match(/^\s*\d+\.\s+(.*)/))) { fAbs(); fZit(); if (!li || li.t !== 'ol') { fLi(); li = { t: 'ol', e: [] }; } li.e.push(m[1]); }
        else if (li && /^\s{2,}\S/.test(l)) { li.e[li.e.length - 1] += ' ' + l.trim(); } // eingerückte Fortsetzung gehört zum Listenpunkt
        else if (!l.trim()) { fAbs(); fLi(); fZit(); }
        else abs.push(l.trim());
      }
      fAbs(); fLi(); fZit(); return h;
    };
    let out = '', zeilen = src.split('\n'), start = 0;
    if (zeilen[0] && zeilen[0].trim() === '---') {          // Frontmatter als dezenter Meta-Block
      const ende = zeilen.slice(1).findIndex(x => x.trim() === '---');
      if (ende >= 0) { out += `<div class="md-meta">${E(zeilen.slice(1, ende + 1).join('\n'))}</div>`; start = ende + 2; }
    }
    // Code-Fences: gerade Teile = Markdown, ungerade = Code
    zeilen.slice(start).join('\n').split(/^```.*$/m).forEach((teil, idx) => {
      out += idx % 2 ? `<pre>${E(teil.replace(/^\n|\n$/g, ''))}</pre>` : bloecke(teil);
    });
    return out;
  }

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

  // ── Agenten: die Rollen des Unternehmens — der Haupteinstieg ──────────────────
  // Jeder Agent bündelt Workflows + Bausteine zu einem Aufgabenbereich (Protein-Bild).
  function zeigAgenten(inv) {
    const rest = seiteStart('Agenten', 'Die Rollen deines Unternehmens — jeder Agent bündelt Workflows & Bausteine zu einem Aufgabenbereich · Klick öffnet den Graph');
    const ags = inv.agenten || [];
    if (!ags.length) {
      rest.innerHTML = '<div class="leer">Noch keine Agenten — im Chat sagen: „entwirf einen Agenten für …", und die Rolle taucht hier von selbst auf.</div>';
      return;
    }
    const as = ags.slice().sort((a, b) => String(b.mtime || '').localeCompare(String(a.mtime || '')));
    rest.innerHTML = as.map((a, i) => `
      <div class="zeile" data-i="${i}">
        <div class="ikon agent">${LOGO.agenten}</div>
        <div class="txt"><b>${esc(a.name)}</b><span>${esc(a.mission || a.beschreibung)}</span></div>
        <div class="meta">${a.workflows} Workflow${a.workflows === 1 ? '' : 's'} · ${
          a.geister > 0
            ? `<span class="tag entwurf">◐ ${a.bausteine - a.geister}/${a.bausteine} Bausteine</span>`
            : `${a.bausteine} Bausteine`
        } · geändert ${esc(datum(a.mtime))}<br>
          <span class="tag geld">${esc(a.projekt)}</span>
          ${(a.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <span class="pfeil">›</span>
      </div>`).join('');
    rest.querySelectorAll('.zeile').forEach(el =>
      el.onclick = () => {
        const a = as[el.dataset.i];
        location.hash = '#/a/' + encodeURIComponent(a.projekt) + '/' + encodeURIComponent(a.kurz);
      });
  }

  function zeigWorkflows(inv) {
    const rest = seiteStart('Workflows', 'Klick öffnet den Graph');
    if (!inv.workflows.length) { rest.innerHTML = leer('Workflows'); return; }
    // Reihenfolge: fertige zuerst, dann im Bau — je Gruppe neueste oben.
    const rang = w => ((w.geister || 0) > 0 ? 1 : 0);
    const ws = inv.workflows.slice().sort((a, b) =>
      rang(a) - rang(b) || String(b.mtime || '').localeCompare(String(a.mtime || '')));
    rest.innerHTML = ws.map((w, i) => `
      <div class="zeile" data-i="${i}">
        <div class="ikon">${LOGO.workflow}</div>
        <div class="txt"><b>${esc(w.name)}</b><span>${esc(w.beschreibung)}</span></div>
        <div class="meta">${(w.geister || 0) > 0
            ? `<span class="tag entwurf">◐ ${w.bausteine - w.geister}/${w.bausteine} Bausteine</span>`
            : `${w.knotenZahl} Knoten`
          } · geändert ${esc(datum(w.mtime))}<br>
          <span class="tag geld">${esc(w.projekt)}</span>
          ${w.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <button class="loesch akt" data-i="${i}" title="Aktivierungs-Prompt kopieren — in einen neuen Chat einfügen, und dieser Workflow läuft">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg></button>
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
  }

  async function oeffneOrdner(k) {
    const r = await (await fetch('/api/ordner-oeffnen', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ p: k.panel.projekt, datei: k.panel.datei }),
    })).json();
    if (!r.ok) alert('Ordner nicht geöffnet: ' + r.fehler);
  }

  // Einstellungen: AWMS-eigene Skills in zwei Gruppen — Befehle (zurufbar) + System-Skills (Hintergrund).
  function zeigEinstellungen(inv) {
    const e = inv.einstellungen || { befehle: [], systemSkills: [] };
    const gesamt = e.befehle.length + e.systemSkills.length;
    const alle = [...e.befehle, ...e.systemSkills];
    const gruppe = (titel, unter, items) => !items.length ? '' :
      `<div class="es-gruppe"><h2 class="es-h2">${esc(titel)}</h2><span class="es-unter">${esc(unter)}</span>
      <div class="grid">` + items.map(s => `
        <div class="karte k-skill" data-id="${esc(s.id)}" title="Klick = Detail">
          <div class="kkopf"><div class="ikon">${LOGO.einstellungen}</div><b>${esc(s.name)}</b></div>
          <p>${esc(ohneMarker(s.beschreibung))}</p>
          <div class="kfuss"><code>${esc(s.cmd)}</code> <span class="pill ${s.art === 'befehl' ? 'kette' : 'lose'}">${s.art === 'befehl' ? 'Befehl' : 'System-Skill'}</span>
            <span class="re">geändert ${esc(datum(s.mtime))}</span></div>
        </div>`).join('') + `</div></div>`;
    content.className = 'scroll';
    content.innerHTML = `<div class="seite"><div class="kopf"><h1>Einstellungen</h1>` +
      `<span class="hint">${gesamt} AWMS-eigene Skills · das Werkzeug HINTER AWMS, kein Business-Baustein · Klick = Detail</span></div>` +
      (gesamt ? gruppe('Befehle', 'Rufst du zu — starten eine AWMS-Prozedur (im Chat: /befehl)', e.befehle) +
                gruppe('System-Skills', 'Laufen meist im Hintergrund — Helfer, die andere Befehle nutzen', e.systemSkills)
              : leer('Einstellungen')) + `</div>`;
    content.querySelectorAll('.karte').forEach(el => {
      el.onclick = () => {
        const s = alle.find(x => x.id === el.dataset.id); if (!s) return;
        window.openPanel({ typ: 'skill', name: s.id, projekt: s.projekt, beschreibungDatei: s.beschreibung,
          einsatz: s.art === 'befehl' ? 'AWMS-Befehl — zurufbar' : 'AWMS System-Skill — Hintergrund-Helfer',
          cmd: s.cmd, datei: s.datei, mtime: s.mtime });
      };
    });
  }

  function zeigKarten(titel, hint, klasse, logo, karten) {
    const rest = seiteStart(titel, hint);
    if (!karten.length) { rest.innerHTML = leer(titel); return; }
    rest.innerHTML = `<div class="grid">` + karten.map((k, i) => `
      <div class="karte ${klasse}" data-i="${i}" title="${k.titel || 'Klick = Details · Doppelklick = Ordner im Finder'}">
        <div class="kkopf"><div class="ikon">${k.logo || logo}</div><b>${esc(k.name)}</b>${k.kopfExtra || ''}${k.infoButton ? `<button class="infobtn" data-i="${i}" title="Was ist das? — Beschreibung & Details"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9.2"/><path d="M12 11.2v4.6" stroke-linecap="round"/><circle cx="12" cy="7.9" r="1" fill="currentColor" stroke="none"/></svg></button>` : ''}</div>
        ${k.text ? `<p>${esc(k.text)}</p>` : ''}
        <div class="kfuss">${k.fussL || ''}
          <span class="re">geändert ${esc(datum(k.mtime))}</span>
          <button class="ordner" data-i="${i}" title="Ordner im Finder öffnen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>
          </button></div>
      </div>`).join('') + '</div>';
    // Ein Muster für ALLE Karten. Klick und Doppelklick werden entkoppelt (kurzer Timer),
    // sonst würde der Einfachklick (z.B. Navigation) den Doppelklick verschlucken.
    //  · Doppelklick = öffnen (Software: ihre URL im Browser · sonst: Ordner im Finder)
    //  · Einfachklick = k.einfachKlick, falls gesetzt (null = bewusst nichts);
    //    sonst eigener Graph (geheZu) · sonst Details-Panel.
    //  · ⓘ-Knopf = Details-Panel (Beschreibung).
    rest.querySelectorAll('.karte').forEach(el => {
      const k = karten[el.dataset.i];
      let tKlick = null;
      const einfach = () => {
        if ('einfachKlick' in k) { if (k.einfachKlick) k.einfachKlick(); }
        else if (k.geheZu) location.hash = k.geheZu;
        else window.openPanel(k.panel);
      };
      const doppelt = () => { if (k.oeffnen) k.oeffnen(); else oeffneOrdner(k); };
      el.onclick = e => {
        if (e.target.closest('.ordner, .infobtn')) return; // eigene Knöpfe haben eigene Handler
        if (tKlick) { clearTimeout(tKlick); tKlick = null; return; } // zweiter Klick eines Doppelklicks
        tKlick = setTimeout(() => { tKlick = null; einfach(); }, 230);
      };
      el.ondblclick = e => {
        if (e.target.closest('.ordner, .infobtn')) return;
        if (tKlick) { clearTimeout(tKlick); tKlick = null; }
        doppelt();
      };
    });
    rest.querySelectorAll('.ordner').forEach(btn =>
      btn.onclick = e => { e.stopPropagation(); oeffneOrdner(karten[btn.dataset.i]); });
    rest.querySelectorAll('.infobtn').forEach(btn =>
      btn.onclick = e => { e.stopPropagation(); window.openPanel(karten[btn.dataset.i].panel); });
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

  // ── Nutzung: Report-Seite (Heute-Kacheln · Tages-Diagramme · Aufschlüsselung) ──
  const NUTZ_FARBE = '#e8590c'; // dunkleres Brand-Orange — besteht den Kontrast-Check auf Weiß

  // Säulen-Diagramm der letzten 14 Tage als SVG. Eine Serie, eine Farbe — der
  // Karten-Titel trägt die Identität. Säulen ≤24px, oben 4px gerundet, Basislinie eckig.
  function saeulenChart(tage, wertVon, einheitFmt) {
    const W = 380, H = 130, padL = 44, padR = 8, padT = 14, padB = 20;
    const innenW = W - padL - padR, innenH = H - padT - padB;
    const jetzt = Date.now();
    const reihe = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(jetzt - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      reihe.push({ label: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`, tag: d.getDate(), wert: wertVon(tage[key]) || 0 });
    }
    const max = Math.max(...reihe.map(r => r.wert));
    // saubere Obergrenze: 1/2/5er-Stufe knapp über dem Maximum
    let ober = 10;
    if (max > 0) {
      const stufe = Math.pow(10, Math.floor(Math.log10(max)));
      for (const f of [1, 2, 5, 10]) if (f * stufe >= max) { ober = f * stufe; break; }
    }
    const y = v => padT + innenH * (1 - v / ober);
    const bandB = innenW / 14;
    const saeuleB = Math.min(24, Math.round(bandB - 6));
    const maxWert = Math.max(...reihe.map(r => r.wert));
    let s = `<svg class="nz-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">`;
    for (const v of [ober / 2, ober]) // Hairline-Grid, zurückhaltend (Basislinie kommt eigens)
      s += `<line x1="${padL}" y1="${y(v)}" x2="${W - padR}" y2="${y(v)}" stroke="#ececec" stroke-width="1"/>` +
        `<text x="${padL - 6}" y="${y(v) + 3}" class="nz-tick" text-anchor="end">${kompakt(v)}</text>`;
    s += `<line x1="${padL}" y1="${y(0)}" x2="${W - padR}" y2="${y(0)}" stroke="#d9d9d9" stroke-width="1"/>`;
    reihe.forEach((r, i) => {
      const mx = padL + bandB * i + bandB / 2;
      const x0 = mx - saeuleB / 2, hoehe = innenH * (r.wert / ober);
      if (r.wert > 0) {
        const rund = Math.min(4, hoehe); // oben gerundetes Daten-Ende, unten eckig
        s += `<path d="M${x0},${y(0)} v${-(hoehe - rund)} q0,${-rund} ${rund},${-rund} h${saeuleB - 2 * rund} q${rund},0 ${rund},${rund} v${hoehe - rund} z" fill="${NUTZ_FARBE}"/>`;
        if (r.wert === maxWert) // nur das Extrem beschriften — Tooltip + Ticks tragen den Rest
          s += `<text x="${mx}" y="${y(r.wert) - 4}" class="nz-max" text-anchor="middle">${einheitFmt(r.wert)}</text>`;
      }
      if (i % 2 === 1) s += `<text x="${mx}" y="${H - 6}" class="nz-tick" text-anchor="middle">${r.tag}.</text>`;
      // unsichtbares Hit-Ziel über die volle Band-Breite — großzügiger als die Säule selbst
      s += `<rect class="nz-hit" x="${padL + bandB * i}" y="${padT}" width="${bandB}" height="${innenH}" fill="transparent" data-tip="${r.label} — ${einheitFmt(r.wert)}"/>`;
    });
    return s + `</svg>`;
  }

  // Tooltip per Delegation — überlebt den 2s-Puls (der die SVGs neu aufbaut).
  let tipGebunden = false;
  function bindeTooltips() {
    if (tipGebunden) return;
    tipGebunden = true;
    const tip = document.createElement('div');
    tip.id = 'nz-tip';
    document.body.appendChild(tip);
    document.addEventListener('mousemove', e => {
      const hit = e.target && e.target.closest ? e.target.closest('.nz-hit') : null;
      if (!hit) { tip.style.display = 'none'; return; }
      tip.textContent = hit.dataset.tip;
      tip.style.display = 'block';
      tip.style.left = (e.clientX + 12) + 'px';
      tip.style.top = (e.clientY - 30) + 'px';
    });
    document.addEventListener('scroll', () => { tip.style.display = 'none'; }, true);
  }

  // Historie-Popup: liegt am body (überlebt den 2s-Puls), Inhalt sind Säulen-Charts.
  let nzHistorien = {}; // key → [{titel, einheit, svg}]
  function oeffneHistorie(key) {
    const charts = nzHistorien[key];
    if (!charts) return;
    schliesseHistorie();
    const deckel = document.createElement('div');
    deckel.id = 'nz-modal';
    deckel.innerHTML = `<div class="nzm-box">
      <div class="nzm-kopf"><b>${esc(charts.titel)}</b><span>letzte 14 Tage · Maus über eine Säule zeigt den Tageswert</span>
        <button class="nzm-zu" title="Schließen">×</button></div>
      <div class="nzm-charts">` +
      charts.liste.map(c => `<div class="nz-chart"><div class="nzc-kopf"><b>${esc(c.titel)}</b><span>${esc(c.einheit)}</span></div>${c.svg}</div>`).join('') +
      `</div></div>`;
    deckel.onclick = e => { if (e.target === deckel || e.target.closest('.nzm-zu')) schliesseHistorie(); };
    document.body.appendChild(deckel);
  }
  function schliesseHistorie() { const d = document.getElementById('nz-modal'); if (d) d.remove(); }

  const usd = w => (w >= 100 ? Math.round(w).toLocaleString('de-DE') : w.toLocaleString('de-DE', { maximumFractionDigits: 2 })) + ' $';

  function zeigNutzung(v) {
    const rest = seiteStart('Nutzung',
      `Nullpunkt: ${datumZeit(v.nullpunkt)} — gezählt wird nur, was seitdem dazukam · Kontostände & Schlüssel-Status live geprüft · MCP-Verbrauch ist technisch nicht abfragbar`);
    const heute = new Date().toISOString().slice(0, 10);
    const hf = v.higgsfield, cl = v.claude, ge = v.gemini, el = v.elevenlabs, kl = v.kling || { verbraucht: 0, tage: {} };
    const zu = v.zuordnung || { software: {}, workflows: {} };
    const kosten = v.kosten || { claude: { gesamt: 0, tage: {} }, gemini: { gesamt: 0 } };
    const sk = v.schluessel || [];
    nzHistorien = {};

    // ── 1) Claude: eigene Sektion ganz oben — treibt alles an, kein API-Key ──
    const clHeute = (cl.tage || {})[heute] || { output: 0, input: 0, cacheRead: 0, aufrufe: 0 };
    const clHeuteUsd = (kosten.claude.tage || {})[heute] || 0;
    nzHistorien.claude = {
      titel: 'Claude — Historie', liste: [
        { titel: 'Output-Token', einheit: 'pro Tag', svg: saeulenChart(cl.tage, w => w && w.output, w => kompakt(w)) },
        { titel: 'Gegenwert zu API-Preisen', einheit: '≈ USD pro Tag', svg: saeulenChart(kosten.claude.tage || {}, w => w, w => usd(w)) },
        { titel: 'Antworten', einheit: 'pro Tag', svg: saeulenChart(cl.tage, w => w && w.aufrufe, w => zahl(w)) },
      ]
    };
    const clSektion = `
      <div class="nz-hero" data-hist="claude" title="Klick = Historie">
        <div class="nzh-kopf"><b>Claude</b><span class="nzh-plan">Max-Plan · 200 $/Monat Flatrate</span>
          <span class="nzh-hist">Historie ↗</span></div>
        <div class="nzh-zeile">
          <div class="nzh-stat"><div class="nzk-label">Heute</div><div class="nzk-wert">${kompakt(clHeute.output)}</div><div class="nzk-sub">Output-Token · ${zahl(clHeute.aufrufe)} Antworten · ≈ ${usd(clHeuteUsd)}</div></div>
          <div class="nzh-stat"><div class="nzk-label">Seit Nullpunkt</div><div class="nzk-wert">${kompakt(cl.gesamt.output)}</div><div class="nzk-sub">Output-Token · ${kompakt(cl.gesamt.cacheRead)} Cache gelesen · ${zahl(cl.gesamt.aufrufe)} Antworten</div></div>
          <div class="nzh-stat geld"><div class="nzk-label">Gegenwert zu API-Preisen</div><div class="nzk-wert">≈ ${usd(kosten.claude.gesamt)}</div><div class="nzk-sub">was dieser Verbrauch über die API gekostet hätte — dein Plan zahlt flat</div></div>
        </div>
      </div>`;

    // ── 2) API-Schlüssel: eine Karte je Anbieter ──
    // Verbrauchs-/Balance-Wissen je Anbieter aus den bestehenden Zählern:
    const geHeute = (ge.tage || {})[heute] || { tokens: 0, aufrufe: 0 };
    const elHeute = (el.tage || {})[heute] || 0;
    const hfHeute = (hf.tage || {})[heute] || 0;
    const klHeute = (kl.tage || {})[heute] || 0;
    nzHistorien.gemini = { titel: 'Gemini — Historie', liste: [{ titel: 'Token', einheit: 'pro Tag', svg: saeulenChart(ge.tage, w => w && w.tokens, w => kompakt(w)) }] };
    nzHistorien.elevenlabs = { titel: 'ElevenLabs — Historie', liste: [{ titel: 'Zeichen', einheit: 'pro Tag', svg: saeulenChart(el.tage, w => w, w => kompakt(w)) }] };
    nzHistorien.higgsfield = { titel: 'Higgsfield — Historie', liste: [{ titel: 'Credits', einheit: 'pro Tag', svg: saeulenChart(hf.tage, w => w, w => zahl(w)) }] };
    nzHistorien.kling = { titel: 'Kling — Historie', liste: [{ titel: 'Credits', einheit: 'pro Tag', svg: saeulenChart(kl.tage, w => w, w => zahl(w)) }] };

    const NUTZUNG_JE_ANBIETER = {
      'Gemini': { heute: `${kompakt(geHeute.tokens)} Tk heute`, gesamt: `${kompakt(ge.gesamt.tokens)} Tk · ≈ ${usd(kosten.gemini.gesamt)} seit Nullpunkt`, hist: 'gemini' },
      'ElevenLabs': { heute: `${kompakt(elHeute)} Z. heute`, gesamt: `${kompakt(el.verbraucht)} Zeichen seit Nullpunkt`, hist: 'elevenlabs' },
    };
    const skStatusPunkt = s => s === 'ok' ? '<span class="skp ok" title="Key gültig — live geprüft"></span>'
      : s === 'tot' ? '<span class="skp tot" title="Key UNGÜLTIG — Anbieter lehnt ihn ab"></span>'
        : '<span class="skp frag" title="nicht automatisch prüfbar"></span>';
    const balanceHtml = g => {
      // erster Key mit Balance liefert den Kontostand (gleiche Konten teilen ihn)
      const b = (g.keys.find(k => k.balance) || {}).balance;
      if (!b) return `<div class="skb keine">Balance nicht abfragbar — nur im ${esc(g.anbieter)}-Dashboard sichtbar</div>`;
      if (b.uebrig !== undefined)
        return `<div class="skb"><b>${b.uebrig.toLocaleString('de-DE')}</b> ${esc(b.einheit)} übrig</div>`;
      const anteil = Math.min(1, b.verbraucht / b.limit);
      const fmt = b.einheit === 'USD' ? usd : x => kompakt(x);
      const voll = anteil >= 0.95;
      return `<div class="skb">
        <div class="skb-balken"><div class="skb-fuell${voll ? ' voll' : ''}" style="width:${(anteil * 100).toFixed(1)}%"></div></div>
        <div class="skb-text">${fmt(b.verbraucht)} von ${fmt(b.limit)} ${b.einheit === 'USD' ? '' : esc(b.einheit) + ' '}verbraucht${b.plan ? ` · ${esc(b.plan)}` : ''}${b.reset ? ` · Reset ${new Date(b.reset).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}` : ''}</div>
      </div>`;
    };
    const skKarte = g => {
      const nutzung = NUTZUNG_JE_ANBIETER[g.anbieter];
      const tote = g.keys.filter(k => k.status === 'tot').length;
      return `<div class="sk-karte${nutzung ? ' klickbar' : ''}"${nutzung ? ` data-hist="${nutzung.hist}" title="Klick = Historie"` : ''}>
        <div class="skk-kopf"><b>${esc(g.anbieter)}</b>
          <span class="skk-anzahl">${g.keys.length} ${g.keys.length === 1 ? 'Key' : 'Keys'}${tote ? ` · <em class="tot">${tote} tot</em>` : ''}</span>
          ${nutzung ? '<span class="nzh-hist">Historie ↗</span>' : ''}</div>
        ${g.keys.map(k => `<div class="skk-key">${skStatusPunkt(k.status)}<code>${esc(k.vorschau)}</code><span class="skk-orte">${k.orte.map(esc).join(' · ')}</span></div>`).join('')}
        ${balanceHtml(g)}
        ${nutzung ? `<div class="skk-nutzung">${nutzung.heute} · ${nutzung.gesamt}</div>` : ''}
      </div>`;
    };
    // CLI-Konten (kein Key in einer .env, aber echtes Guthaben) als gleichwertige Karten:
    const cliKarte = (name, konto, einheit, verbrauchtHeute, verbrauchtGesamt, hist, fehler) => `
      <div class="sk-karte klickbar" data-hist="${hist}" title="Klick = Historie">
        <div class="skk-kopf"><b>${name}</b><span class="skk-anzahl">CLI-Konto</span><span class="nzh-hist">Historie ↗</span></div>
        ${konto ? `<div class="skb"><b>${zahl(konto.credits)}</b> ${einheit} übrig${konto.plan ? ` · ${esc(String(konto.plan))}` : ''}</div>`
        : `<div class="skb keine">${fehler ? 'Konto gerade nicht erreichbar' : 'Kontostand wird geholt …'}</div>`}
        <div class="skk-nutzung">−${zahl(verbrauchtHeute)} heute · −${zahl(verbrauchtGesamt)} seit Nullpunkt</div>
      </div>`;
    const apiGruppen = sk.filter(g => g.art === 'api');
    const skSektion =
      `<h2 class="nz-h">API-Schlüssel<span>aus den .env-Tresoren gelesen · Gültigkeit live geprüft · 🔴 = toter Key</span></h2>
      <div class="sk-grid">` +
      apiGruppen.map(skKarte).join('') +
      cliKarte('Higgsfield', hf.konto, 'Credits', hfHeute, hf.verbraucht, 'higgsfield', hf.fehler) +
      cliKarte('Kling', kl.konto, 'Credits', klHeute, kl.verbraucht, 'kling', kl.fehler) +
      `</div>`;

    // ── 3) Wer verbraucht? — je Name eine Zeile mit Anbieter-Chips (aus unseren Kontext-Logs) ──
    const chips = z => {
      const teile = [];
      if (z.higgsfield) teile.push(`Higgsfield −${zahl(z.higgsfield)} Cr`);
      if (z.kling) teile.push(`Kling −${zahl(z.kling)} Cr`);
      if (z.gemini) teile.push(`Gemini ${kompakt(z.gemini)} Tk`);
      if (z.elevenlabs) teile.push(`ElevenLabs ${kompakt(z.elevenlabs)} Z.`);
      return teile.join(' · ') || `${zahl(z.aufrufe)} Aufrufe`;
    };
    const gewicht = z => (z.higgsfield || 0) + (z.kling || 0) + (z.gemini || 0) / 1e5 + (z.elevenlabs || 0) / 1e4 + (z.aufrufe || 0) / 1e6;
    const zuordKarte = (titel, obj, leerText) => {
      const paare = Object.entries(obj || {}).sort((a, b) => gewicht(b[1]) - gewicht(a[1]));
      const koerper = !paare.length ? `<div class="vbk-leer">${leerText}</div>` :
        `<div class="vbk-tab">` + paare.slice(0, 8).map(([k, z]) =>
          `<div class="vbk-tr"><span>${esc(k)}</span><b>${chips(z)}</b></div>`).join('') +
        (paare.length > 8 ? `<div class="vbk-tr mehr"><span>… ${paare.length - 8} weitere</span></div>` : '') + `</div>`;
      return `<div class="vb-karte"><div class="vbk-kopf"><b>${titel}</b><span>seit Nullpunkt</span></div>${koerper}</div>`;
    };

    // ── 4) Zugangs-Schlüssel: stille Gruppe — Zugänge, keine Verbrauchs-Credits ──
    const zugangGruppen = sk.filter(g => g.art === 'zugang');
    const zugangSektion = !zugangGruppen.length ? '' :
      `<h2 class="nz-h">Zugänge<span>Tokens für Dienste ohne Credit-Logik (Meta, Shopify & Co.) — nur Inventar</span></h2>
      <div class="zg-zeilen">` +
      zugangGruppen.map(g => `<div class="zg-zeile"><b>${esc(g.anbieter)}</b><span>${g.keys.length} ${g.keys.length === 1 ? 'Token' : 'Tokens'}</span><span class="zg-orte">${[...new Set(g.keys.flatMap(k => k.orte))].map(esc).join(' · ')}</span></div>`).join('') +
      `</div>`;

    rest.innerHTML = clSektion + skSektion +
      `<h2 class="nz-h">Wer verbraucht?<span>Top-Workflows und Software — aus unseren eigenen Logs</span></h2><div class="vb-grid">` +
      zuordKarte('Top-Workflows', zu.workflows, 'Noch keinem Workflow zugeordnet — füllt sich bei den nächsten Workflow-Läufen.') +
      zuordKarte('Software', zu.software, 'Noch nichts — füllt sich, sobald eine Software KI-Calls macht.') +
      `</div>` + zugangSektion;

    rest.querySelectorAll('[data-hist]').forEach(el2 =>
      el2.onclick = () => oeffneHistorie(el2.dataset.hist));
    bindeTooltips(rest);
  }
  async function api(p) {
    const r = await fetch(p);
    return r.json();
  }

  let liveTimer = null;
  let letztSig = null;
  let graphAnsicht = null; // View-Handle des aktuell gezeichneten Graphen

  async function zeichne(erste) {
    const h = location.hash.replace(/^#\/?/, '') || 'agenten';
    const [seite, ...rest] = h.split('/');

    // Alte Entwurf-Routen: Entwurf ist jetzt ein Zustand in der Workflows-Liste.
    if (seite === 'entwurf') {
      location.hash = rest.length >= 2 ? '#/w/' + rest.join('/') : '#/workflows';
      return;
    }
    // Alte Verbrauch-Route: heißt jetzt Nutzung.
    if (seite === 'verbrauch') { location.hash = '#/nutzung'; return; }
    // Übersicht ist raus (Gaylords Entscheid 17.07.2026: „sowieso Müll") — Agenten sind der Einstieg.
    if (seite === 'uebersicht') { location.hash = '#/agenten'; return; }

    let inv;
    try { inv = await api('/api/inventar'); }
    catch {
      if (!erste) return; // Server kurz weg — nächster Puls versucht es wieder
      content.className = 'scroll';
      content.innerHTML = '<div class="seite"><div class="leer">Server nicht erreichbar — läuft <code>node app/server.mjs</code>?</div></div>';
      return;
    }
    const befundRelevant = (inv.befunde || []).filter(b => b.schwere !== 'grau');
    const einst = inv.einstellungen || { befehle: [], systemSkills: [] };
    const zahlen = { agenten: (inv.agenten || []).length, workflows: inv.workflows.length, befund: befundRelevant.length, skills: inv.skills.length, tools: inv.tools.length, software: (inv.software || []).length, softwareBausteine: (inv.softwareBausteine || []).length, datenbanken: inv.datenbanken.length, einstellungen: einst.befehle.length + einst.systemSkills.length };
    document.querySelectorAll('[data-zahl]').forEach(el => { el.textContent = zahlen[el.dataset.zahl]; });
    const befundZahl = document.querySelector('[data-zahl="befund"]');
    if (befundZahl) befundZahl.classList.toggle('alarm', (inv.befunde || []).some(b => b.schwere === 'rot'));

    // Zweitdaten für Graph-Ansichten
    let graphDaten = null;
    if (seite === 'w' && rest.length >= 2) graphDaten = await api('/api/graph?p=' + rest[0] + '&wf=' + rest[1] + (rest[2] === 'idee' ? '&ebene=idee' : ''));
    else if (seite === 's' && rest.length >= 2) graphDaten = await api('/api/agentik?p=' + rest[0] + '&sw=' + rest[1] + (rest[2] ? '&awf=' + rest[2] : '') + (rest[3] === 'idee' ? '&ebene=idee' : ''));
    else if (seite === 'a' && rest.length >= 2) graphDaten = await api('/api/agent?p=' + rest[0] + '&ag=' + rest[1]);
    else if (seite === 'nutzung') graphDaten = await api('/api/usage');

    // Nichts geändert → nichts neu zeichnen (Puls läuft weiter). Der gelesen-Zeitstempel
    // ändert sich bei JEDEM Abruf — er bleibt draußen, sonst zeichnet der Puls immer neu
    // (und verworfene Zettel-/Blickwinkel-Optik würde alle 2 s zurückschnappen).
    const sig = h + '§' + JSON.stringify({ ...inv, gelesen: 0 }) +
      '§' + JSON.stringify(graphDaten ? { ...graphDaten, gelesen: 0 } : null);
    if (!erste && sig === letztSig) return;
    letztSig = sig;

    // Während der awaits (inventar/graph) kann der Hash sich geändert haben (z.B. Ebenen-
    // Umschalter oder Navigation). Dann NICHT mit veralteten Daten überzeichnen — der
    // frische Lauf für den neuen Hash übernimmt.
    if ((location.hash.replace(/^#\/?/, '') || 'uebersicht') !== h) return;

    const scrollVorher = content.scrollTop;
    const view = graphAnsicht && graphAnsicht.getView && graphAnsicht.getView();
    graphAnsicht = null;

    if (seite === 'a' && rest.length >= 2) {
      // Agent-Graph: die Rolle im Detail — Workflow-Karten mit lebendiger Miniatur;
      // Klick auf eine gebaute Karte öffnet die referenzierte Kette.
      navAktiv('agenten');
      graphAnsicht = renderGraph(content, graphDaten, {
        live: true, startView: !erste && view && view.bewegt ? view : null,
        aufWorkflow: n => { location.hash = wfHash(n); },
      });
    } else if (seite === 'w' && rest.length >= 2) {
      navAktiv('workflows');
      graphAnsicht = renderGraph(content, graphDaten, {
        live: true, startView: !erste && view && view.bewegt ? view : null,
        aktivierungsText: graphDaten && graphDaten.workflow ? aktivierungsPrompt(graphDaten.workflow, inv) : null,
        // A/B-Test: zwischen Aktuell (A) und Idee (B) umschalten (nur wenn ein Experiment läuft).
        aufEbene: e => { location.hash = '#/w/' + rest[0] + '/' + rest[1] + (e === 'idee' ? '/idee' : ''); },
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
      zeigKarten('Software', `${sw.length} Stück · vom Menschen bedient, kein Baustein · Doppelklick öffnet die App · ⓘ zeigt die Beschreibung`, 'k-software', LOGO.software,
        sw.map(s => ({
          name: s.name, mtime: s.mtime, // kein Fließtext mehr — Beschreibung steckt hinter dem ⓘ-Knopf
          titel: (s.agentik ? 'Klick = Innenleben (Graph, wo die KI entscheidet) · ' : '')
            + (s.url ? 'Doppelklick = App im Browser öffnen' : 'Doppelklick = Ordner im Finder')
            + ' · ⓘ = Beschreibung',
          kopfExtra: `<span class="led ${s.laeuft ? 'an' : 'aus'}" title="${s.laeuft ? 'läuft gerade' : 'aus — Start im Chat sagen'}"></span>`,
          infoButton: true,
          fussL: `${s.laeuft ? '<span class="pill kette">läuft</span>' : '<span class="pill lose">aus</span>'}${s.agentik ? ' <span class="pill agentik">Innenleben</span>' : ''} <code>${esc(s.url || 'keine url')}</code>`,
          // Einfachklick: agentische Software → Innenleben-Graph · sonst bewusst nichts (null).
          einfachKlick: s.agentik
            ? (() => { location.hash = '#/s/' + encodeURIComponent(s.projekt) + '/' + encodeURIComponent(s.id); })
            : null,
          // Doppelklick: die laufende App im Browser öffnen (ohne URL → Ordner im Finder).
          oeffnen: s.url ? (() => window.open(s.url, '_blank')) : null,
          panel: { typ: 'software', name: s.name, projekt: s.projekt, beschreibungDatei: s.beschreibung, datei: s.datei, mtime: s.mtime, url: s.url, laeuft: s.laeuft, start: s.start, agentik: s.agentik },
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
    } else if (seite === 'nutzung') {
      navAktiv('nutzung');
      zeigNutzung(graphDaten);
    } else if (seite === 'einstellungen') {
      navAktiv('einstellungen');
      zeigEinstellungen(inv);
    } else if (seite === 'datenbanken') {
      navAktiv('datenbanken');
      zeigKarten('Datenbanken', `${inv.datenbanken.length} Stück · Bausteine im Graph, kein Untergrund · Klick = Vertragskarte`, 'k-datenbank', LOGO.datenbank,
        inv.datenbanken.map(d => ({
          name: d.id, text: d.zweck, mtime: d.mtime,
          logo: d.art !== 'normal' && LOGO[d.art] ? LOGO[d.art] : undefined,
          fussL: `<code>${esc(d.typ.split('(')[0].trim())}</code>`,
          panel: { typ: 'datenbank', name: d.id, projekt: d.projekt, db: d, datei: d.datei, mtime: d.mtime },
        })));
    } else if (seite === 'agenten') {
      navAktiv('agenten');
      zeigAgenten(inv);
    } else {
      location.hash = '#/agenten'; // unbekannte Route → Haupteinstieg
      return;
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
