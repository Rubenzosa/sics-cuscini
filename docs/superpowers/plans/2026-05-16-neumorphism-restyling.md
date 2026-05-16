# Neumorphism Restyling SICS 78 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire integralmente la grafica di SICS 78 con stile Neumorphism (indaco #5c6bc0 per Cuscini, ambra #f9a825 per Taglio) modificando solo App.css e 3 righe inline di App.js.

**Architecture:** App.css è una riscrittura completa delle variabili CSS e delle classi visive. App.js riceve solo 3 modifiche a stili inline (brand text color, navbar background, banda sistema). Logica Firebase, routing, state management e nomi componenti restano invariati.

**Tech Stack:** React (CRA), CSS Variables, CSS3 box-shadow (Neumorphism)

---

## File da modificare

| File | Intervento |
|---|---|
| `src/App.css` | Riscrittura completa variabili + classi visive |
| `src/App.js` | 3 stili inline: topbar brand color, navbar bg, banda gradiente sistema |

---

### Task 1: Variabili CSS Foundation

**Files:**
- Modify: `src/App.css` — sostituire blocco `:root`, `[data-tema="dark"]`, `[data-sistema="taglio"]`

- [ ] **Step 1: Sostituire il blocco `:root` in App.css**

Sostituire dall'inizio del file fino alla riga `[data-theme="dark"] {` (riga ~86) con:

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ══════════════════════════════════════════
   CSS VARIABLES — NEUMORPHISM LIGHT
   ══════════════════════════════════════════ */
:root {
  /* Base */
  --bg:  #e8edf2;
  --bg2: #e0e5ea;
  --bg3: #f0f4f7;

  /* Neumorphism shadows */
  --neu-out:    5px 5px 10px #c5cace, -5px -5px 10px #ffffff;
  --neu-out-lg: 7px 7px 14px #c5cace, -7px -7px 14px #ffffff;
  --neu-in:     inset 4px 4px 8px #c5cace, inset -4px -4px 8px #ffffff;
  --shadow:     var(--neu-out);

  /* Borders */
  --border:  #d4d9de;
  --border2: #c8cdd2;

  /* Text */
  --text:  #2d3748;
  --text2: #718096;
  --text3: #a0aec0;

  /* Tema colori */
  --cuscini: #5c6bc0;
  --taglio:  #f9a825;
  --navy:    #e8edf2;
  --navy2:   #e8edf2;
  --accent:  #5c6bc0;

  /* Status */
  --red:        #ef5350;
  --red-bg:     #fde8e8;
  --red-text:   #c62828;
  --amber:      #f9a825;
  --amber-bg:   #fef3cd;
  --amber-text: #e65100;
  --green:      #66bb6a;
  --green-bg:   #e8f5e9;
  --green-text: #2e7d32;
  --blue-bg:    #eaecf7;
  --blue-text:  #3949ab;
  --gray-bg:    #e8edf2;
  --gray-text:  #718096;

  /* Radius */
  --radius:    18px;
  --radius-sm: 12px;
}
```

- [ ] **Step 2: Sostituire il blocco `[data-sistema="taglio"]`**

Trovare e sostituire l'intero blocco `[data-sistema="taglio"] { ... }` e `[data-sistema="taglio"][data-theme="dark"] { ... }` con:

```css
/* ══ TEMA TAGLIO — solo accenti, sfondo invariato ══ */
[data-sistema="taglio"] {
  --accent: #f9a825;
  --navy:   #e8edf2;
  --navy2:  #e8edf2;
}
[data-sistema="taglio"][data-theme="dark"] {
  --accent: #ffb300;
}
```

- [ ] **Step 3: Sostituire il blocco `[data-theme="dark"]`**

Trovare e sostituire l'intero blocco `[data-theme="dark"] { ... }` con:

```css
/* ══════════════════════════════════════════
   CSS VARIABLES — NEUMORPHISM DARK
   ══════════════════════════════════════════ */
[data-theme="dark"] {
  --bg:  #1e2530;
  --bg2: #181f2a;
  --bg3: #232d3a;

  --neu-out:    5px 5px 10px #12181f, -5px -5px 10px #2a3445;
  --neu-out-lg: 7px 7px 14px #12181f, -7px -7px 14px #2a3445;
  --neu-in:     inset 4px 4px 8px #12181f, inset -4px -4px 8px #2a3445;
  --shadow:     var(--neu-out);

  --border:  #2a3445;
  --border2: #334055;

  --text:  #e2e8f0;
  --text2: #8090a8;
  --text3: #4a6080;

  --cuscini: #7986cb;
  --taglio:  #ffb300;
  --navy:    #1e2530;
  --navy2:   #1e2530;
  --accent:  #7986cb;

  --red-bg:     #3d1515;
  --red-text:   #f09595;
  --amber-bg:   #3d2a08;
  --amber-text: #fac775;
  --green-bg:   #1a2d0a;
  --green-text: #97c459;
  --blue-bg:    #1a2040;
  --blue-text:  #9fa8da;
  --gray-bg:    #232d3a;
  --gray-text:  #8090a0;
}
```

- [ ] **Step 4: Verificare visivamente**

Avviare il dev server: `npm start`
Aprire http://localhost:3000 — lo sfondo deve essere grigio chiaro `#e8edf2`. La topbar è ancora scura (verrà corretta nel Task 2).

- [ ] **Step 5: Commit**

```bash
git add src/App.css
git commit -m "style: neumorphism CSS variables foundation"
```

---

### Task 2: Topbar + Sistema Badge + Theme Toggle

**Files:**
- Modify: `src/App.css` — classi `.topbar`, `.topbar-brand`, `.badge-critico`, `.theme-toggle`, `.sistema-cuscini`, `.sistema-taglio`
- Modify: `src/App.js` — aggiornare stile inline topbar brand color

- [ ] **Step 1: Sostituire la sezione `/* ══ TOPBAR ══ */` in App.css**

Trovare e sostituire dalla riga `.topbar {` fino a `.theme-toggle:hover { ... }` con:

```css
/* ══ TOPBAR ══ */
.topbar {
  background: var(--bg);
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 200;
  min-height: 68px;
  box-shadow: 0 4px 12px #c5cace;
  transition: background 0.3s, box-shadow 0.3s;
}
[data-theme="dark"] .topbar {
  box-shadow: 0 4px 12px #12181f;
}
.topbar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
  transition: color 0.3s;
}
.topbar-right { display: flex; align-items: center; gap: 10px; }

.badge-critico {
  background: var(--bg);
  box-shadow: var(--neu-out);
  color: var(--red);
  font-size: 11px;
  font-weight: 800;
  padding: 5px 12px;
  border-radius: 20px;
  letter-spacing: 0.04em;
  animation: pulse 2s infinite;
  transition: background 0.3s, box-shadow 0.3s;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}

.theme-toggle {
  background: var(--bg);
  box-shadow: var(--neu-out);
  border: none;
  border-radius: 50%;
  color: var(--text2);
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  cursor: pointer;
  transition: box-shadow 0.15s, background 0.3s, color 0.3s;
}
.theme-toggle:active { box-shadow: var(--neu-in); }

/* Sistema badge (usato in pills) */
.sistema-cuscini { background: var(--cuscini); color: #fff; }
.sistema-taglio  { background: var(--taglio);  color: #fff; }
```

- [ ] **Step 2: Aggiornare gli stili inline in App.js — topbar brand**

In `src/App.js`, trovare la riga con `topbar-brand` che contiene l'img logo (riga ~237):

```jsx
<div className="topbar-brand">
  <img src="/logo78.png" alt="Logo 78"
    style={{ height:64, width:64, objectFit:"contain", filter:"invert(1) brightness(2)" }}/>
  <span>SICS — VVF Siena</span>
</div>
```

Sostituire con (rimuovere filter che invertiva per sfondo scuro, ora sfondo chiaro):

```jsx
<div className="topbar-brand">
  <img src="/logo78.png" alt="Logo 78"
    style={{ height:56, width:56, objectFit:"contain" }}/>
  <span>SICS — VVF Siena</span>
</div>
```

- [ ] **Step 3: Verificare visivamente**

`npm start` — La topbar deve essere grigio chiaro con testo scuro, logo senza filtro inversione, badge critici in rilievo neu, toggle dark circolare.

- [ ] **Step 4: Commit**

```bash
git add src/App.css src/App.js
git commit -m "style: neumorphism topbar + badge + theme toggle"
```

---

### Task 3: Navbar + Sistema Switcher + Banda

**Files:**
- Modify: `src/App.css` — `.navbar`, `.nav-item`, `.sistema-selector`, `.sistema-btn`
- Modify: `src/App.js` — inline styles banda sistema e navbar background

- [ ] **Step 1: Sostituire la sezione `/* ══ NAVBAR ══ */` in App.css**

Trovare e sostituire dal commento `/* ══ NAVBAR ══ */` fino alla fine del blocco `.nav-item.active { ... }` con:

```css
/* ══ NAVBAR ══ */
.navbar {
  background: var(--bg);
  display: flex;
  padding: 0 16px;
  gap: 2px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-bottom: 1px solid var(--border);
  box-shadow: 0 3px 8px rgba(0,0,0,0.06);
  transition: background 0.3s;
}
.navbar::-webkit-scrollbar { display: none; }
.nav-item {
  color: var(--text3);
  font-size: 13px;
  font-weight: 700;
  padding: 12px 16px;
  text-decoration: none;
  border-bottom: 3px solid transparent;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
  cursor: pointer;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  font-size: 11px;
}
.nav-item:hover { color: var(--text2); }
.nav-item.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  font-weight: 800;
}

/* ══ SELETTORE SISTEMA ══ */
.sistema-selector {
  display: flex;
  gap: 4px;
  background: var(--bg);
  box-shadow: var(--neu-in);
  border-radius: 50px;
  padding: 4px;
  transition: background 0.3s, box-shadow 0.3s;
}
.sistema-btn {
  padding: 6px 16px;
  border-radius: 40px;
  border: none;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  transition: all 0.25s;
  background: transparent;
  color: var(--text3);
}
.sistema-btn.active {
  background: var(--bg);
  box-shadow: var(--neu-out);
  color: var(--cuscini);
}
.sistema-btn.active.taglio {
  color: var(--taglio);
}
```

- [ ] **Step 2: Aggiornare stile inline navbar in App.js**

In `src/App.js`, trovare il blocco `<nav className="navbar" style={{...}}>` (riga ~279):

```jsx
<nav className="navbar" style={{
  background: sistema==="taglio"?"#7a3500":"var(--navy2)",
  transition:"background .4s",
}}>
```

Sostituire con:

```jsx
<nav className="navbar">
```

(Rimuovere completamente lo style inline — il background ora viene da CSS.)

- [ ] **Step 3: Aggiornare stile inline banda sistema in App.js**

Trovare la `<div>` con la banda 3px (riga ~269):

```jsx
<div style={{
  height:3,
  background: sistema==="taglio"
    ? "linear-gradient(90deg,#e07020,#7a3500)"
    : "linear-gradient(90deg,#378add,#1a2b3c)",
  transition:"background .4s",
}}/>
```

Sostituire con:

```jsx
<div style={{
  height:3,
  background: sistema==="taglio"
    ? "linear-gradient(90deg,#f9a825,#e65100)"
    : "linear-gradient(90deg,#5c6bc0,#3949ab)",
  transition:"background .4s",
}}/>
```

- [ ] **Step 4: Rimuovere inline color dai bottoni sistema in App.js**

In `src/App.js`, trovare i due pulsanti `.sistema-btn` (righe ~244-255):

```jsx
<button
  className={`sistema-btn ${sistema==="cuscini"?"active":""}`}
  onClick={() => setSistema("cuscini")}
  style={{ color:sistema==="cuscini"?"#1a2b3c":undefined }}>
  Cuscini
</button>
<button
  className={`sistema-btn taglio ${sistema==="taglio"?"active":""}`}
  onClick={() => setSistema("taglio")}
  style={{ color:sistema==="taglio"?"#7a3500":undefined }}>
  Taglio
</button>
```

Sostituire con (rimuovere entrambi gli style inline — il CSS ora gestisce il colore):

```jsx
<button
  className={`sistema-btn ${sistema==="cuscini"?"active":""}`}
  onClick={() => setSistema("cuscini")}>
  Cuscini
</button>
<button
  className={`sistema-btn taglio ${sistema==="taglio"?"active":""}`}
  onClick={() => setSistema("taglio")}>
  Taglio
</button>
```

- [ ] **Step 5: Verificare visivamente**

`npm start` — Navbar deve essere grigio chiaro, voci uppercase con underline colorato quando attive. Switcher Cuscini/Taglio con rilievo neu. Banda 3px indaco o ambra.

- [ ] **Step 6: Commit**

```bash
git add src/App.css src/App.js
git commit -m "style: neumorphism navbar + sistema switcher + banda gradiente"
```

---

### Task 4: Cards + Stat Cards + Kanban + Mezzo

**Files:**
- Modify: `src/App.css` — `.card`, `.stat-card`, `.kanban-card`, `.mezzo-card`

- [ ] **Step 1: Sostituire sezione `/* ══ CARDS ══ */` in App.css**

```css
/* ══ CARDS ══ */
.card {
  background: var(--bg);
  box-shadow: var(--neu-out);
  border-radius: var(--radius);
  padding: 20px;
  transition: background 0.3s, box-shadow 0.3s;
}
.card:hover { box-shadow: var(--neu-out-lg); }
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.card-title {
  font-size: 13px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: color 0.3s;
}
.card-action {
  font-size: 12px;
  color: var(--accent);
  cursor: pointer;
  text-decoration: none;
  background: none;
  border: none;
  font-family: inherit;
  font-weight: 700;
}
.card-action:hover { text-decoration: underline; }
```

- [ ] **Step 2: Sostituire sezione `/* ══ STAT CARDS ══ */` in App.css**

```css
/* ══ STAT CARDS ══ */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 22px; }
.stat-card {
  background: var(--bg);
  box-shadow: var(--neu-out);
  border-radius: var(--radius-sm);
  padding: 18px 20px;
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.15s, background 0.3s;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: var(--neu-out-lg); }
.stat-card::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 3px;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
}
.stat-card.red::after   { background: var(--red); }
.stat-card.amber::after { background: var(--amber); }
.stat-card.green::after { background: var(--green); }
.stat-card.blue::after  { background: var(--accent); }
.stat-label {
  font-size: 10px;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  margin-bottom: 8px;
  transition: color 0.3s;
}
.stat-num { font-size: 32px; font-weight: 900; line-height: 1; font-variant-numeric: tabular-nums; }
.stat-num.red   { color: var(--red); }
.stat-num.amber { color: var(--amber); }
.stat-num.green { color: var(--green); }
.stat-num.blue  { color: var(--accent); }
```

- [ ] **Step 3: Sostituire sezione `/* ══ KANBAN ══ */` in App.css**

```css
/* ══ KANBAN ══ */
.kanban-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.kanban-card {
  background: var(--bg);
  box-shadow: var(--neu-out);
  border-radius: var(--radius);
  padding: 16px;
  transition: box-shadow 0.2s, transform 0.15s, background 0.3s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.kanban-card:hover { transform: translateY(-3px); box-shadow: var(--neu-out-lg); }
.kanban-card:active { box-shadow: var(--neu-in); transform: translateY(0); }
.kanban-card-accent {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
}
.kanban-card-accent.scaduto,
.kanban-card-accent.critico    { background: var(--red); }
.kanban-card-accent.attenzione { background: var(--amber); }
.kanban-card-accent.buono,
.kanban-card-accent.regolare   { background: var(--green); }
.kanban-card-accent.fuori_servizio { background: #888; }
.kanban-card-accent.magazzino  { background: var(--accent); }
.kanban-mezzo  { font-size: 14px; font-weight: 800; color: var(--text); margin-top: 6px; transition: color 0.3s; }
.kanban-targa  { font-size: 11px; color: var(--text3); font-family: monospace; margin-top: 2px; transition: color 0.3s; }
.kanban-kit    { font-size: 12px; color: var(--text2); margin-top: 8px; transition: color 0.3s; }
.kanban-loc    { font-size: 10px; color: var(--text3); margin-top: 4px; transition: color 0.3s; }
.kanban-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
```

- [ ] **Step 4: Sostituire sezione `/* ══ MEZZI GRID ══ */` in App.css**

```css
/* ══ MEZZI GRID ══ */
.mezzi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.mezzo-card {
  background: var(--bg);
  box-shadow: var(--neu-out);
  border-radius: var(--radius-sm);
  padding: 14px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s, background 0.3s;
}
.mezzo-card:hover { transform: translateY(-2px); box-shadow: var(--neu-out-lg); }
.mezzo-card:active { box-shadow: var(--neu-in); transform: translateY(0); }
.mezzo-name  { font-size: 12px; font-weight: 800; color: var(--text); transition: color 0.3s; }
.mezzo-targa { font-size: 11px; color: var(--text3); margin-top: 2px; font-family: monospace; transition: color 0.3s; }
.mezzo-dots  { display: flex; gap: 5px; margin-top: 8px; align-items: center; }
.mezzo-loc   { font-size: 10px; color: var(--text3); margin-top: 4px; transition: color 0.3s; }
```

- [ ] **Step 5: Verificare visivamente**

`npm start` — Card, stat card, kanban card e mezzo card devono avere ombra neumorphic in rilievo. Hover: ombra più grande + translateY. Click: incassato.

- [ ] **Step 6: Commit**

```bash
git add src/App.css
git commit -m "style: neumorphism cards — stat, kanban, mezzo"
```

---

### Task 5: Bottoni + Input + Ricerca + Filtri

**Files:**
- Modify: `src/App.css` — `.btn`, `.search-input`, `.filter-chip`, `.form-group inputs`, `.global-search`

- [ ] **Step 1: Sostituire sezione `/* ══ BUTTONS ══ */` in App.css**

```css
/* ══ BUTTONS ══ */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  border: none;
  font-family: inherit;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: box-shadow 0.15s, transform 0.12s, background 0.3s;
  text-decoration: none;
}
.btn:hover { transform: translateY(-1px); }
.btn:active { transform: translateY(0); box-shadow: var(--neu-in) !important; }

.btn-primary {
  background: var(--bg);
  box-shadow: var(--neu-out);
  color: var(--accent);
}
.btn-secondary {
  background: var(--bg);
  box-shadow: var(--neu-out);
  color: var(--text2);
}
.btn-danger {
  background: linear-gradient(135deg, #ef5350, #c62828);
  box-shadow: 4px 4px 10px rgba(239,83,80,0.35), -2px -2px 6px rgba(255,255,255,0.15);
  color: #fff;
}
.btn-success {
  background: linear-gradient(135deg, #66bb6a, #2e7d32);
  box-shadow: 4px 4px 10px rgba(102,187,106,0.35), -2px -2px 6px rgba(255,255,255,0.15);
  color: #fff;
}
/* Bottone solid accento (usato in form) */
.btn-accent {
  background: linear-gradient(135deg, var(--cuscini), #3949ab);
  box-shadow: 4px 4px 10px rgba(92,107,192,0.35), -2px -2px 6px rgba(255,255,255,0.15);
  color: #fff;
}
[data-sistema="taglio"] .btn-accent {
  background: linear-gradient(135deg, #f9a825, #e65100);
  box-shadow: 4px 4px 10px rgba(249,168,37,0.35), -2px -2px 6px rgba(255,255,255,0.15);
}
```

- [ ] **Step 2: Sostituire sezione `/* ══ SEARCH BAR (pagina kit) ══ */` in App.css**

```css
/* ══ SEARCH BAR (pagina kit) ══ */
.search-bar { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.search-input {
  flex: 1;
  min-width: 200px;
  padding: 11px 18px;
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  font-family: inherit;
  background: var(--bg);
  box-shadow: var(--neu-in);
  color: var(--text);
  outline: none;
  transition: box-shadow 0.2s, background 0.3s, color 0.3s;
}
.search-input::placeholder { color: var(--text3); }
.search-input:focus { box-shadow: inset 5px 5px 10px #c5cace, inset -5px -5px 10px #ffffff; }
[data-theme="dark"] .search-input:focus {
  box-shadow: inset 5px 5px 10px #12181f, inset -5px -5px 10px #2a3445;
}

.filter-chip {
  padding: 8px 16px;
  border: none;
  border-radius: 50px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  background: var(--bg);
  box-shadow: var(--neu-out);
  color: var(--text3);
  font-family: inherit;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  transition: box-shadow 0.15s, color 0.15s, background 0.3s;
}
.filter-chip.active {
  box-shadow: var(--neu-in);
  color: var(--accent);
}
.filter-chip:hover:not(.active) { color: var(--text2); }
```

- [ ] **Step 3: Sostituire sezione `/* ══ SEARCH GLOBALE ══ */` in App.css**

```css
/* ══ SEARCH GLOBALE ══ */
.global-search-wrap {
  position: relative;
  flex: 1;
  max-width: 380px;
}
.global-search {
  width: 100%;
  padding: 9px 16px 9px 38px;
  border: none;
  border-radius: 50px;
  background: var(--bg);
  box-shadow: var(--neu-in);
  color: var(--text);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: box-shadow 0.2s, background 0.3s, color 0.3s;
}
.global-search::placeholder { color: var(--text3); }
.global-search:focus { box-shadow: inset 5px 5px 10px #c5cace, inset -5px -5px 10px #fff; }
[data-theme="dark"] .global-search:focus {
  box-shadow: inset 5px 5px 10px #12181f, inset -5px -5px 10px #2a3445;
}
.global-search-icon {
  position: absolute;
  left: 14px; top: 50%;
  transform: translateY(-50%);
  color: var(--text3);
  font-size: 14px;
  pointer-events: none;
  transition: color 0.3s;
}
.search-results-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0; right: 0;
  background: var(--bg);
  box-shadow: var(--neu-out-lg);
  border-radius: var(--radius-sm);
  z-index: 500;
  max-height: 360px;
  overflow-y: auto;
}
.search-result-item {
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: background 0.12s;
}
.search-result-item:last-child { border-bottom: none; }
.search-result-item:hover { background: var(--bg3); }
.search-result-label { font-size: 14px; font-weight: 600; color: var(--text); transition: color 0.3s; }
.search-result-sub   { font-size: 11px; color: var(--text3); margin-top: 2px; transition: color 0.3s; }
.search-result-tipo {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 10px;
  margin-bottom: 3px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.search-result-tipo.kit        { background: var(--blue-bg);  color: var(--blue-text); }
.search-result-tipo.componente { background: var(--green-bg); color: var(--green-text); }
```

- [ ] **Step 4: Sostituire sezione `/* ══ FORMS ══ */` in App.css**

```css
/* ══ FORMS ══ */
.form-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label {
  font-size: 10px;
  font-weight: 800;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  transition: color 0.3s;
}
.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 14px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: inherit;
  color: var(--text);
  background: var(--bg);
  box-shadow: var(--neu-in);
  outline: none;
  transition: box-shadow 0.15s, background 0.3s, color 0.3s;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  box-shadow: inset 5px 5px 10px #c5cace, inset -5px -5px 10px #fff,
              0 0 0 2px rgba(92,107,192,0.2);
}
[data-theme="dark"] .form-group input:focus,
[data-theme="dark"] .form-group select:focus,
[data-theme="dark"] .form-group textarea:focus {
  box-shadow: inset 5px 5px 10px #12181f, inset -5px -5px 10px #2a3445,
              0 0 0 2px rgba(121,134,203,0.25);
}
```

- [ ] **Step 5: Verificare visivamente**

`npm start` — Bottoni con rilievo neu, input/ricerca incassati, filtri pill con effetto premuto quando attivi, focus con ring sottile.

- [ ] **Step 6: Commit**

```bash
git add src/App.css
git commit -m "style: neumorphism buttons + inputs + search + filter chips"
```

---

### Task 6: Status Pills + Kit Rows + Componenti + Azioni

**Files:**
- Modify: `src/App.css` — `.pill`, `.kit-row`, `.kit-num`, `.comp-item`, `.azione-card`, `.alert-banner`, `.section-*`

- [ ] **Step 1: Sostituire sezione `/* ══ PILLS / STATUS ══ */` in App.css**

```css
/* ══ PILLS / STATUS ══ */
.pill {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  padding: 4px 11px;
  border-radius: 50px;
  white-space: nowrap;
  letter-spacing: 0.04em;
  background: var(--bg);
  box-shadow: var(--neu-out);
  transition: background 0.3s, box-shadow 0.3s;
}
.pill.scaduto,
.pill.critico    { color: var(--red); }
.pill.attenzione { color: var(--amber); }
.pill.buono,
.pill.regolare   { color: var(--green); }
.pill.fuori_servizio { color: var(--gray-text); }
.pill.fuori_uso      { color: var(--text3); }
.pill.magazzino,
.pill.in_revisione   { color: var(--accent); }
.pill.senza_data     { color: var(--text3); }
```

- [ ] **Step 2: Sostituire sezione `/* ══ KIT ROWS ══ */` in App.css**

```css
/* ══ KIT ROWS ══ */
.kit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.12s;
  margin-bottom: 6px;
}
.kit-row:hover {
  box-shadow: var(--neu-out);
  transform: translateY(-1px);
}
.kit-row:active { box-shadow: var(--neu-in); transform: translateY(0); }
.kit-left  { display: flex; align-items: center; gap: 12px; }
.kit-num {
  width: 40px; height: 40px;
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800;
  background: var(--bg);
  box-shadow: var(--neu-out);
  color: var(--accent);
  flex-shrink: 0;
  transition: background 0.3s, box-shadow 0.3s, color 0.3s;
}
.kit-name { font-size: 14px; font-weight: 700; color: var(--text); transition: color 0.3s; }
.kit-sub  { font-size: 11px; color: var(--text3); margin-top: 2px; transition: color 0.3s; }
.kit-right { text-align: right; }
.kit-date  { font-size: 11px; color: var(--text3); margin-top: 4px; transition: color 0.3s; }
```

- [ ] **Step 3: Sostituire sezione `/* ══ COMPONENTI ══ */` in App.css**

```css
/* ══ COMPONENTI ══ */
.comp-list { display: flex; flex-direction: column; gap: 8px; }
.comp-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 14px;
  background: var(--bg);
  box-shadow: var(--neu-out);
  border-radius: var(--radius-sm);
  transition: box-shadow 0.15s, background 0.3s;
}
.comp-item:hover { box-shadow: var(--neu-out-lg); }
.comp-tipo      { font-size: 12px; font-weight: 700; color: var(--text); transition: color 0.3s; }
.comp-modello   { font-size: 11px; color: var(--text2); margin-top: 2px; transition: color 0.3s; }
.comp-matricola { font-size: 11px; color: var(--text3); font-family: monospace; transition: color 0.3s; }
```

- [ ] **Step 4: Sostituire sezione `/* ══ DA FARE AZIONE CARD ══ */` in App.css**

```css
/* ══ DA FARE AZIONE CARD ══ */
.azione-card {
  background: var(--bg);
  box-shadow: var(--neu-out);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  cursor: pointer;
  display: flex; gap: 12px; align-items: flex-start;
  transition: box-shadow 0.2s, transform 0.15s, background 0.3s;
  margin-bottom: 6px;
}
.azione-card:hover { transform: translateY(-1px); box-shadow: var(--neu-out-lg); }
.azione-card:active { box-shadow: var(--neu-in); transform: translateY(0); }
.azione-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
```

- [ ] **Step 5: Sostituire sezione `/* ══ ALERT BANNER ══ */` e `/* ══ SEZIONE COLORATA ══ */` in App.css**

```css
/* ══ ALERT BANNER ══ */
.alert-banner {
  background: var(--bg);
  box-shadow: var(--neu-out);
  border-left: 4px solid var(--red);
  border-radius: var(--radius-sm);
  padding: 13px 18px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--red-text);
  font-weight: 600;
  transition: background 0.3s, box-shadow 0.3s;
}

/* ══ SEZIONE COLORATA ══ */
.section-red   { background: var(--bg); box-shadow: var(--neu-out); border-left: 4px solid var(--red);   border-radius: var(--radius-sm); padding: 14px; margin-bottom: 16px; }
.section-green { background: var(--bg); box-shadow: var(--neu-out); border-left: 4px solid var(--green); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 16px; }
.section-amber { background: var(--bg); box-shadow: var(--neu-out); border-left: 4px solid var(--amber); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 16px; }
.section-blue  { background: var(--bg); box-shadow: var(--neu-out); border-left: 4px solid var(--accent);border-radius: var(--radius-sm); padding: 14px; margin-bottom: 16px; }
.section-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
.section-label.red   { color: var(--red-text); }
.section-label.green { color: var(--green-text); }
.section-label.amber { color: var(--amber-text); }
.section-label.blue  { color: var(--blue-text); }
```

- [ ] **Step 6: Verificare visivamente**

`npm start` — Pills con ombra neu e colore testo per stato, kit rows con hover rilievo, comp-item rilievo, azione-card con press effect, alert banner con bordatura sinistra colorata.

- [ ] **Step 7: Commit**

```bash
git add src/App.css
git commit -m "style: neumorphism pills + kit rows + components + action cards"
```

---

### Task 7: Modal + Timeline + Indicatore Ring + Misc

**Files:**
- Modify: `src/App.css` — `.modal`, `.timeline`, `.ring-wrap`, `.storico-card`, `.zona-*`

- [ ] **Step 1: Sostituire sezione `/* ══ MODAL ══ */` in App.css**

```css
/* ══ MODAL ══ */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 16px;
  backdrop-filter: blur(4px);
}
.modal {
  background: var(--bg);
  box-shadow: var(--neu-out-lg);
  border-radius: var(--radius);
  padding: 28px;
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  transition: background 0.3s, box-shadow 0.3s;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
}
.modal-title { font-size: 17px; font-weight: 800; color: var(--text); letter-spacing: 0.02em; transition: color 0.3s; }
.modal-close {
  background: var(--bg);
  box-shadow: var(--neu-out);
  border: none;
  width: 32px; height: 32px;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  color: var(--text3);
  display: flex; align-items: center; justify-content: center;
  transition: box-shadow 0.15s, color 0.3s, background 0.3s;
}
.modal-close:active { box-shadow: var(--neu-in); }
```

- [ ] **Step 2: Sostituire sezione `/* ══ TIMELINE REVISIONI ══ */` in App.css**

```css
/* ══ TIMELINE REVISIONI ══ */
.timeline { position: relative; padding-left: 28px; }
.timeline::before {
  content: '';
  position: absolute;
  left: 8px; top: 0; bottom: 0;
  width: 2px;
  background: var(--border);
}
.timeline-item { position: relative; margin-bottom: 20px; }
.timeline-dot {
  position: absolute;
  left: -24px; top: 4px;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: var(--bg);
  box-shadow: var(--neu-out);
}
.timeline-dot.green { background: var(--green); box-shadow: 0 0 0 3px rgba(102,187,106,0.25); }
.timeline-dot.red   { background: var(--red);   box-shadow: 0 0 0 3px rgba(239,83,80,0.25); }
.timeline-dot.amber { background: var(--amber); box-shadow: 0 0 0 3px rgba(249,168,37,0.25); }
.timeline-dot.gray  { background: var(--text3); box-shadow: 0 0 0 3px rgba(160,174,192,0.25); }
.timeline-date  { font-size: 11px; color: var(--text3); margin-bottom: 4px; transition: color 0.3s; }
.timeline-title { font-size: 14px; font-weight: 700; color: var(--text); transition: color 0.3s; }
.timeline-sub   { font-size: 12px; color: var(--text2); margin-top: 2px; transition: color 0.3s; }
```

- [ ] **Step 3: Sostituire sezione `/* ══ STORICO HUB CARD ══ */` in App.css**

```css
/* ══ STORICO HUB CARD ══ */
.storico-card {
  background: var(--bg);
  box-shadow: var(--neu-out);
  border-radius: var(--radius);
  padding: 16px 20px;
  display: flex; align-items: center; gap: 16px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s, background 0.3s;
  margin-bottom: 8px;
}
.storico-card:hover { transform: translateY(-2px); box-shadow: var(--neu-out-lg); }
.storico-card:active { box-shadow: var(--neu-in); transform: translateY(0); }
```

- [ ] **Step 4: Aggiornare `.ring-bg` e `.ring-fg` per dark mode**

Trovare e sostituire la sezione `/* ══ INDICATORE CIRCOLARE SCADENZA ══ */`:

```css
/* ══ INDICATORE CIRCOLARE SCADENZA ══ */
.ring-wrap  { position: relative; width: 44px; height: 44px; flex-shrink: 0; }
.ring-wrap svg { transform: rotate(-90deg); }
.ring-bg    { fill: none; stroke: var(--border); stroke-width: 3.5; }
.ring-fg    { fill: none; stroke-width: 3.5; stroke-linecap: round; transition: stroke-dashoffset 0.6s ease; }
.ring-label {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800; color: var(--text);
  transition: color 0.3s;
}
```

- [ ] **Step 5: Verificare visivamente**

`npm start` — Modal con ombra neu e close button circolare, timeline con dots colorati, storico hub card con hover effect.

- [ ] **Step 6: Commit**

```bash
git add src/App.css
git commit -m "style: neumorphism modal + timeline + ring + storico"
```

---

### Task 8: Dark Mode — Filigrana + Transizione Globale

**Files:**
- Modify: `src/App.css` — aggiungere transizioni globali
- Modify: `src/App.js` — aggiornare filigrana per dark mode neu

- [ ] **Step 1: Aggiungere transizione globale al `body` in App.css**

Trovare il blocco `body { ... }` e sostituire con:

```css
body {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  background-color: var(--bg);
  color: var(--text);
  font-size: 14px;
  line-height: 1.5;
  transition: background-color 0.3s, color 0.3s;
}
```

- [ ] **Step 2: Aggiungere transizione globale ai componenti**

Dopo il blocco `body`, aggiungere:

```css
/* Transizione globale smooth per dark/light switch */
.card, .stat-card, .kanban-card, .mezzo-card,
.kit-row, .comp-item, .azione-card, .storico-card,
.modal, .pill, .btn, .search-input, .filter-chip,
.topbar, .navbar, .sistema-selector, .badge-critico,
.theme-toggle, .alert-banner,
.section-red, .section-green, .section-amber, .section-blue {
  transition: background 0.3s, box-shadow 0.3s, color 0.3s;
}
```

- [ ] **Step 3: Aggiornare filigrana in App.js**

Trovare il div filigrana (riga ~226):

```jsx
<div style={{
  position:"fixed", inset:0, zIndex:0,
  backgroundImage:"url('/logo78.png')",
  backgroundRepeat:"no-repeat", backgroundPosition:"center center",
  backgroundSize:"340px", opacity:darkMode?0.04:0.06,
  pointerEvents:"none", filter:darkMode?"invert(1)":"none",
}}/>
```

Sostituire con (rimuovere l'invert in dark mode — ora lo sfondo dark è scuro, il logo non va invertito):

```jsx
<div style={{
  position:"fixed", inset:0, zIndex:0,
  backgroundImage:"url('/logo78.png')",
  backgroundRepeat:"no-repeat", backgroundPosition:"center center",
  backgroundSize:"340px", opacity:darkMode?0.03:0.05,
  pointerEvents:"none",
}}/>
```

- [ ] **Step 4: Verificare dark mode**

`npm start` — Cliccare toggle ☾: sfondo passa a `#1e2530`, ombre diventano scure/chiare, tutti i componenti transitano smoothly. Cliccare ☀: ritorno a light mode.

- [ ] **Step 5: Commit**

```bash
git add src/App.css src/App.js
git commit -m "style: neumorphism global transitions + dark mode polish"
```

---

### Task 9: Verifica Finale Cross-Page

**Files:** nessun file da modificare — solo verifica visiva

- [ ] **Step 1: Avviare app**

```bash
npm start
```

- [ ] **Step 2: Checklist pagine Cuscini (light mode)**

Navigare su ogni route e verificare:
- `/` (StatoGiorno): stat cards in rilievo, kit rows con hover, banda indaco in topbar
- `/da-fare` (DaFare): azione cards con press effect
- `/kit` (KitList): search incassata, filtri pill, lista kit con hover
- `/kit/:id` (KitDetail): modal/card dettaglio, checklist componenti, bottoni neu
- `/mezzi` (KanbanMezzi): kanban cards con accent bar colorata
- `/archivio` (StoricoHub): storico cards con hover

- [ ] **Step 3: Checklist sistema Taglio**

- Cliccare switcher "Taglio": banda diventa ambra, `.nav-item.active` diventa ambra, `.sistema-btn.active` diventa ambra
- Navigare `/gruppi-taglio`, `/mezzi-taglio`

- [ ] **Step 4: Checklist dark mode**

- Toggle ☾: verificare ogni pagina in dark mode
- Toggle ☀: verificare ritorno a light mode senza artefatti

- [ ] **Step 5: Checklist mobile**

- DevTools → viewport 390px (iPhone)
- Verificare touch targets ≥ 44px su bottoni e nav
- Verificare nessun overflow orizzontale

- [ ] **Step 6: Commit finale**

```bash
git add -A
git commit -m "style: neumorphism restyling SICS 78 — verifica finale"
```
