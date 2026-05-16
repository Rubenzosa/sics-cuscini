# Design: Restyling Neumorphism SICS 78

**Data:** 2026-05-16  
**Approccio:** Restyling CSS puro — modifica `App.css` + variabili globali  
**Stile:** Neumorphism  
**Palette:** Indaco `#5c6bc0` (Cuscini) + Ambra `#f9a825` (Taglio)

---

## Obiettivo

Sostituire integralmente la grafica attuale dell'app SICS 78 applicando il linguaggio Neumorphism. L'intervento è puramente estetico: logica Firebase, routing React Router, stato e nomi dei componenti restano invariati.

---

## Sezione 1 — Fondamenta CSS

### Variabili globali (`:root` e `[data-theme="dark"]`)

| Variabile | Light | Dark |
|---|---|---|
| `--bg` | `#e8edf2` | `#1e2530` |
| `--bg2` | `#e0e5ea` | `#181f2a` |
| `--shadow-out` | `5px 5px 10px #c5cace, -5px -5px 10px #ffffff` | `5px 5px 10px #12181f, -5px -5px 10px #2a3445` |
| `--shadow-out-lg` | `7px 7px 14px #c5cace, -7px -7px 14px #ffffff` | `7px 7px 14px #12181f, -7px -7px 14px #2a3445` |
| `--shadow-in` | `inset 4px 4px 8px #c5cace, inset -4px -4px 8px #ffffff` | `inset 4px 4px 8px #12181f, inset -4px -4px 8px #2a3445` |
| `--color-cuscini` | `#5c6bc0` | `#7986cb` |
| `--color-taglio` | `#f9a825` | `#ffb300` |
| `--color-danger` | `#ef5350` | `#ef5350` |
| `--color-ok` | `#66bb6a` | `#66bb6a` |
| `--text` | `#2d3748` | `#e2e8f0` |
| `--text2` | `#718096` | `#8090a8` |
| `--text3` | `#a0aec0` | `#4a6080` |
| `--border` | `#d0d5db` | `#2a3445` |
| `--radius-card` | `18px` | — |
| `--radius-btn` | `14px` | — |
| `--radius-pill` | `50px` | — |

**Transizione globale** su tutti gli elementi:  
`transition: background 0.3s, box-shadow 0.3s, color 0.3s;`

### Tipografia
- Font: `system-ui, -apple-system, 'Inter', sans-serif`
- Label uppercase: `letter-spacing: 0.08em`, `font-weight: 800`
- Valori statistici: `font-weight: 900`, `font-variant-numeric: tabular-nums`

---

## Sezione 2 — Header + Navbar + Switcher

### Topbar (`header.topbar`)
- `background: var(--bg)`
- `box-shadow: 0 4px 10px #c5cace` (light) / `0 4px 10px #12181f` (dark)
- Logo: filtro CSS `sepia(1) saturate(3) hue-rotate(190deg)` per colorarlo in indaco
- Badge critici: `background: var(--bg); box-shadow: var(--shadow-out); color: var(--color-danger)`
- Toggle dark: pulsante circolare `border-radius: 50%; box-shadow: var(--shadow-out)`; `:active` → `var(--shadow-in)`

### Banda sistema (3px)
- `background: linear-gradient(90deg, var(--color-cuscini), #3949ab)` se Cuscini
- `background: linear-gradient(90deg, var(--color-taglio), #e65100)` se Taglio
- `transition: background 0.4s ease`

### Switcher Cuscini/Taglio
- Container: `box-shadow: var(--shadow-in); border-radius: var(--radius-pill); padding: 4px`
- Bottone attivo: `box-shadow: var(--shadow-out); color: var(--color-sistema)`
- Bottone inattivo: `color: var(--text3); background: transparent`

### Navbar inferiore
- `background: var(--bg); box-shadow: 0 -4px 12px #c5cace; border-top: 1px solid var(--border)`
- Item attivo: icona con `box-shadow: var(--shadow-out)` + dot indicatore `background: var(--color-sistema)` che scala da 0 a 1 con `transform: scale`
- Item inattivo: `color: var(--text3)`

---

## Sezione 3 — Componenti UI

### Card base (`.card`, `.kit-card`, etc.)
- `background: var(--bg); box-shadow: var(--shadow-out); border-radius: var(--radius-card)`
- Hover: `box-shadow: var(--shadow-out-lg); transform: translateY(-2px)`
- Active/click: `box-shadow: var(--shadow-in); transform: translateY(0)`

### Card statistiche (Dashboard)
- Valore numerico: `font-size: 2rem; font-weight: 900`
- Colore per stato: `var(--color-cuscini)` / `var(--color-danger)` / `var(--color-ok)`

### Card kit (Lista, Scadenze)
- Icona kit: quadrato `box-shadow: var(--shadow-out); border-radius: 13px`
- Badge stato pill: `box-shadow: var(--shadow-out); border-radius: var(--radius-pill)`
  - OK → `var(--color-ok)`
  - Attenzione → `var(--color-taglio)`
  - Scaduto → `var(--color-danger)`

### Input ricerca
- `box-shadow: var(--shadow-in); border: none; border-radius: var(--radius-pill)`
- Placeholder: `color: var(--text3)`
- Focus: nessun outline default, lieve intensificazione shadow-in

### Filtri pill
- Inattivo: `box-shadow: var(--shadow-out); color: var(--text3)`
- Attivo: `box-shadow: var(--shadow-in); color: var(--color-sistema)`

### Checklist componenti
- `box-shadow: var(--shadow-out); border-radius: 12px`
- Check OK: `color: var(--color-ok); ✓`
- Warning: `color: var(--color-taglio); ⚠`

### Bottoni
| Tipo | Stile |
|---|---|
| Ghost (secondario) | `box-shadow: var(--shadow-out)`; active → `var(--shadow-in)` |
| Solid Cuscini | `background: linear-gradient(135deg, #5c6bc0, #3949ab)` + shadow colorata |
| Solid Taglio | `background: linear-gradient(135deg, #f9a825, #e65100)` + shadow colorata |
| Danger | `background: linear-gradient(135deg, #ef5350, #c62828)` |

---

## Sezione 4 — Transizioni

| Elemento | Transizione |
|---|---|
| Cambio pagina | `opacity 0.2s ease + translateY(4px → 0)` |
| Card hover | `box-shadow 0.2s, transform 0.2s` |
| Bottone press | `box-shadow 0.12s` (out → in) |
| Switcher sistema | `background 0.4s ease` sulla banda |
| Navbar item | `color 0.15s`, dot `transform: scale 0.15s` |
| Badge critici | `animation: pulse 2s ease-in-out infinite` |
| Dark/light toggle | `background 0.3s, box-shadow 0.3s, color 0.3s` globale |

---

## File da modificare

| File | Intervento |
|---|---|
| `src/App.css` | Sostituzione completa variabili + classi Neumorphism |
| `src/App.js` | Aggiunta `transition` sulla banda sistema, classe attiva switcher |
| `src/pages/StatoGiorno.js` | Card stats + card scadenze → classi neu |
| `src/pages/KitList.js` | Card kit lista + search + filtri → classi neu |
| `src/pages/KitDetail.js` | Card dettaglio + checklist + bottoni → classi neu |
| `src/pages/KanbanMezzi.js` | Card kanban colonne → classi neu |
| `src/pages/KanbanMezziTaglio.js` | Stessa logica kanban |
| `src/pages/GruppiTaglioList.js` | Card lista taglio → classi neu |
| `src/pages/GruppiTaglioDetail.js` | Card dettaglio taglio → classi neu |
| `src/pages/Scadenze.js` | Card scadenze + badge → classi neu |
| `src/pages/DaFare.js` | Card da fare → classi neu |
| `src/pages/Calendario.js` | Card calendario → classi neu |
| Tutti i form (`KitForm`, `GruppiTaglioForm`) | Input + bottoni form → classi neu |

---

## Vincoli rispettati

- Nessuna dipendenza nuova (no Tailwind, no nuove librerie)
- Logica Firebase, routing, state management: invariati
- Nomi componenti e props: invariati
- Dati simulati e reali: invariati
- Dark mode: già gestita via `data-theme` in `App.js` — si estende con nuove variabili
