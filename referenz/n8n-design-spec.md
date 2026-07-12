# n8n Canvas — Visual Spec für den 1:1-Rip (extrahiert aus dem n8n-Quellcode, Juli 2026)

> Quelle: n8n `master` (post-2025-Redesign) — Design-Tokens aus `packages/frontend/@n8n/design-system`
> (`_primitives.scss`, `_tokens.scss`) + Canvas-Komponenten (`CanvasNodeDefault.vue`, `CanvasEdge.vue`,
> `nodeViewUtils.ts`, `TabBar.vue`). Hex-Werte aus den oklch-Tokens konvertiert.
> Der Graph in `graph-design-beispiel.html` setzt diese Spec bereits um — als Basis nutzen.

## Fonts
- UI: `InterVariable, sans-serif` (Fallback: System-Stack) · Mono: `CommitMono, ui-monospace, Menlo`
- Gewichte 400/500/600 · Größen: 12 / 13 / 14 / 16 px

## Canvas
| | Light | Dark |
|---|---|---|
| Hintergrund | `#f5f5f5` | `#171717` |
| Punktraster | `#999999` | `#444444` |
- Raster: Punkte, **gap 16px** (GRID_SIZE=16), Radius **0.5px**, skaliert mit Zoom.
- Zoom-Controls: **unten links**, vertikaler Stapel randloser Icon-Buttons (~40px), Icon `#737373`, Hover `rgba(0,0,0,.05)`.

## Nodes
- Standard: **96×96px, border-radius 20px**, bg `#fff` (dark `#2b2b2b`), Border **1.5px** `rgba(0,0,0,0.10)` (dark `rgba(255,255,255,0.15)`).
- Icon: zentriert, **48px** (Legacy 40px), keine Box drumherum.
- Label: **unter** dem Node (top:100%, margin 8px), zentriert, **16px / 500**, 2 Zeilen max; Subtitle 13px grau. Text `#262626` / `#fff`.
- **Trigger-Node:** linke Seite runder — `border-radius: 36px 20px 20px 36px`; Blitz-Icon links außen in Coral.
- **Configurable Node** (breit, z.B. Agent): 256×96, Icon links bei x≈40, Label inline.
- **Selected:** `box-shadow: 0 0 0 6px hsla(220,47%,30%,0.1)` (Border bleibt).
- **Disabled:** Border `#e5e5e5`, „(Deactivated)" unterm Label.
- **Error:** Border 1.5px `#e7000b` (dark `#ff6467`) · **Success (Run):** Border **2px `#00a63e`** + grünes Check-Badge unten rechts IM Node (inset 6px) · **Pinned:** 2px lila `#7f22fe` · **Running:** rotierender Conic-Gradient-Ring in Coral `#ff6d5a` (inset −3px, 1.5s linear).

## Ports + Wires
- Ports: **16px-Kreise**, bg wie Node, Border 1px `#989898` (dark `#636363`); Output-Hover: scale 1.5.
- AI-/Nebenports: **Rauten** (Quadrat 45°, scale 0.8).
- Wires: **Bezier, curvature 0.25, 2px**, `stroke-linecap: square`. Light `#cacaca` → Hover `#6f6f6f`; dark `#4d4d4d` → `#868686`. Rückwärts-Schleifen: Smoothstep, 16px-Ecken. Nebenverbindungen gestrichelt `5,6`.
- **Pfeilspitzen: ja** (kleines gefülltes Dreieck `-5,-4 0,0 -5,4`, erbt Wire-Farbe).
- „+"-Button: am Ende kurzer Stub-Linien unverbundener Outputs; 20×20 rect rx4 `#e5e5e5`, Plus-Glyph `#444`.

## Sticky Notes
- Default **240×180** (min 150×80), radius 4px, Gelb: bg `#fef9c2`, Border `#fff085` (dark `#733e0a`/`#894b00`), Text 14px, Markdown. 6 weitere Farbvarianten aus der 100/300-Palette.

## Brand-Farben
| Token | Wert |
|---|---|
| Primary (Buttons, CTAs) | **`#ff6900`** · Hover `#f54900` |
| Coral (Running, Trigger-Blitz) | `#ff6d5a` |
| Logo-Pink (nur Icons) | `#ea4b71` |
| Secondary/Pinned | `#7f22fe` |
| Success / Danger / Warning | `#00a63e` / `#e7000b` / `#b57617` |
| Active-Toggle | aus `#bbbbbb`, an `#00c950` |
| Grau-Skala | `#fafafa #f5f5f5 #f0f0f0 #e5e5e5 #d9d9d9 #bbbbbb #999999 #737373 #444444 #323232 #262626 #171717` |

## Header / Chrome
- Topbar: weiß (dark `#262626`), 1px Border unten `#e5e5e5`, ~56–65px. Links: Workflow-Name (14px, editierbar wirkend) + Tags; rechts: „Share" (secondary), **„Save" (primary orange, radius 4)**, Active-Toggle, ••• .
- **Editor/Executions-Tabs:** schwebende Pille, mittig an der Header-UNTERKANTE (`translateY(50%)`), bg `#e5e5e5`, radius 4, aktives Segment weiß.

## Executions-Ansicht (der zweite Modus)
- Gleicher Canvas, read-only, nach Lauf eingefärbt: Erfolg = 2px grün + Check-Badge, Fehler = rot + X-Badge, übersprungen = ausgegraut; Drähte, die Daten trugen, grün + **Item-Count-Labels auf den Drähten** („5 items", 13px grau).
