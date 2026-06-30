# Redesign React — Shell + Vista KIT + Pulizia — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire la navigazione a tab dell'app React con una pagina unica a viste (KIT | Calendario), dove la vista KIT è una lista accordion per il sistema attivo (cuscini o taglio) con statistiche e suggerimento scorta, rimuovendo le pagine di navigazione non più usate.

**Architecture:** Una util pura testata (`src/inventario.js`) calcola statistiche e scorta. Un componente `KitAccordion` rende la riga espandibile. `KitView` assembla stats + banner scorta + ricerca + accordion per il sistema attivo. `App.js` perde la navbar a tab e mostra un toggle KIT|Calendario; la vista Calendario riusa il componente `Calendario` esistente (verrà rielaborata nel Piano 3). Le pagine di dettaglio/form restano raggiungibili per link; le pagine-tab inutili vengono cancellate.

**Tech Stack:** React (react-scripts/Jest), react-router-dom v6, Firebase Firestore.

## Global Constraints

- Mantenere lo stile attuale: neumorfismo, palette `--cuscini #5c6bc0` / `--taglio #f9a825`, classi CSS esistenti (`card`, `pill`, `btn`, `page-header`, `section-blue`, `filter-chip`), logo `public/logo78.png`. **Niente emoji decorative**; icone solo minimal (⌕ ricerca, caret CSS).
- `dataRevisione` (cuscini) = data di **prossima revisione/scadenza** usata da `calcolaStato`. Non esiste un campo "ultima revisione" separato: NON inventarlo.
- Cuscini: `calcolaStato`, `giorniAllaScadenza(k.dataRevisione)`. Taglio: `calcolaStatoGT`, `prossimaRevisioneGT(gt)`.
- Stati possibili: `scaduto, critico, attenzione, buono, regolare, magazzino, fuori_servizio, fuori_uso, senza_data, in_revisione`.
- Le pagine di dettaglio (`KitDetail`, `GruppiTaglioDetail`) e form restano: l'accordion vi rimanda con `Link`.
- Test runner: `CI=true npx react-scripts test --watchAll=false <path>`.

---

### Task 1: Util inventario (statistiche + scorta) — pura, TDD

**Files:**
- Create: `src/inventario.js`
- Test: `src/inventario.test.js`

**Interfaces:**
- Produces:
  - `contaStats(items, calcStato): { operativi:number, inScadenza:number, scaduti:number, magazzino:number }`
    - `scaduti` = stato `scaduto`; `inScadenza` = stato `critico` o `attenzione`; `magazzino` = `item.stato === "magazzino"`; `operativi` = item con `item.stato === "attivo"`.
  - `scortaMancante(items): boolean` — `true` se nessun item ha `stato === "magazzino"`.

- [ ] **Step 1: Write the failing test**

```js
// src/inventario.test.js
import { contaStats, scortaMancante } from "./inventario";

const calc = it => it._stato; // calcStato finto per il test

describe("contaStats", () => {
  const items = [
    { stato: "attivo", _stato: "regolare" },
    { stato: "attivo", _stato: "critico" },
    { stato: "attivo", _stato: "attenzione" },
    { stato: "attivo", _stato: "scaduto" },
    { stato: "magazzino", _stato: "magazzino" },
    { stato: "magazzino", _stato: "magazzino" },
  ];
  test("conta operativi/inScadenza/scaduti/magazzino", () => {
    expect(contaStats(items, calc)).toEqual({ operativi: 4, inScadenza: 2, scaduti: 1, magazzino: 2 });
  });
  test("lista vuota → tutti zero", () => {
    expect(contaStats([], calc)).toEqual({ operativi: 0, inScadenza: 0, scaduti: 0, magazzino: 0 });
  });
});

describe("scortaMancante", () => {
  test("true se nessun magazzino", () => {
    expect(scortaMancante([{ stato: "attivo" }])).toBe(true);
  });
  test("false se almeno un magazzino", () => {
    expect(scortaMancante([{ stato: "attivo" }, { stato: "magazzino" }])).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx react-scripts test --watchAll=false src/inventario.test.js`
Expected: FAIL — "Cannot find module './inventario'".

- [ ] **Step 3: Write minimal implementation**

```js
// src/inventario.js
export function contaStats(items, calcStato) {
  const acc = { operativi: 0, inScadenza: 0, scaduti: 0, magazzino: 0 };
  (items || []).forEach(it => {
    if (it.stato === "attivo") acc.operativi += 1;
    if (it.stato === "magazzino") acc.magazzino += 1;
    const s = calcStato(it);
    if (s === "scaduto") acc.scaduti += 1;
    else if (s === "critico" || s === "attenzione") acc.inScadenza += 1;
  });
  return acc;
}

export function scortaMancante(items) {
  return !(items || []).some(it => it.stato === "magazzino");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx react-scripts test --watchAll=false src/inventario.test.js`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add src/inventario.js src/inventario.test.js
git commit -m "feat(redesign): util inventario statistiche + scorta"
```

---

### Task 2: Componente `Ring` condiviso

**Files:**
- Create: `src/components/Ring.js`

**Interfaces:**
- Produces: `export default function Ring({ giorni, stato })` — anello SVG identico a quello in `KitList.js:13-37`.

- [ ] **Step 1: Creare il componente (estratto da KitList)**

```jsx
// src/components/Ring.js
import React from "react";

export default function Ring({ giorni, stato }) {
  const size = 52, r = 20, circ = 2 * Math.PI * r;
  let pct = 1, color = "#639922";
  if (stato === "scaduto")         { pct = 0;    color = "#e24b4a"; }
  else if (stato === "critico")    { pct = 0.08; color = "#e24b4a"; }
  else if (stato === "attenzione") { pct = 0.35; color = "#ba7517"; }
  else if (stato === "buono")      { pct = 0.70; color = "#639922"; }
  else if (stato === "regolare")   { pct = 1;    color = "#639922"; }
  else { pct = 0.5; color = "#888"; }
  const offset = circ * (1 - pct);
  const abs = Math.abs(giorni ?? 0);
  const label = giorni === null ? "N/D" : giorni < 0 ? `${abs}\nfa` : giorni > 999 ? "OK" : giorni > 99 ? `${giorni}\ngg` : `${giorni}g`;
  const lines = label.split("\n");
  const fs = abs > 99 ? 8 : 10;
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
        <circle fill="none" stroke="var(--border)" strokeWidth="3.5" cx={size/2} cy={size/2} r={r} />
        <circle fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" cx={size/2} cy={size/2} r={r} strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
        {lines.map((l, i) => <span key={i} style={{ fontSize: fs, fontWeight: 800, color }}>{l}</span>)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verifica build**

Run: `npx eslint src/components/Ring.js`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/Ring.js
git commit -m "feat(redesign): componente Ring condiviso"
```

---

### Task 3: Componente `KitAccordion`

**Files:**
- Create: `src/components/KitAccordion.js`

**Interfaces:**
- Consumes: `Ring` (Task 2); da `../utils`: `statoLabel`, `formatData`. Da `react-router-dom`: `Link`.
- Produces: `export default function KitAccordion({ item, sistema, stato, giorni, scad, open, onToggle })`
  - `item`: kit o gruppo taglio. `sistema`: "cuscini"|"taglio". `stato`: stringa. `giorni`: number|null. `scad`: stringa data o null. `open`: bool. `onToggle`: fn.

- [ ] **Step 1: Creare il componente**

```jsx
// src/components/KitAccordion.js
import React from "react";
import { Link } from "react-router-dom";
import Ring from "./Ring";
import { statoLabel, formatData } from "../utils";

const BORDER = {
  scaduto: "var(--red)", critico: "var(--red)", attenzione: "var(--amber)",
  buono: "var(--green)", regolare: "var(--green)",
};

export default function KitAccordion({ item, sistema, stato, giorni, scad, open, onToggle }) {
  const isTaglio = sistema === "taglio";
  const borderColor = BORDER[stato] || "var(--border)";
  const detailPath = isTaglio ? `/gruppi-taglio/${item.id}` : `/kit/${item.id}`;
  const info = isTaglio
    ? `${item.sistema || ""}${item.marca ? " · " + item.marca : ""} · ${item.dislocazione || ""}`
    : `${item.bar} bar · ${item.dislocazione || ""}`;
  const comps = item.componenti || [];

  return (
    <div className="card" style={{ padding: 0, marginBottom: 12, borderLeft: `4px solid ${borderColor}`, overflow: "hidden" }}>
      <button onClick={onToggle} style={{
        display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
        width: "100%", background: "none", border: "none", font: "inherit",
        textAlign: "left", color: "inherit", cursor: "pointer",
      }}>
        <span style={{ fontSize: 28, fontWeight: 900, color: "var(--accent)", lineHeight: 1, minWidth: 44 }}>{item.numero}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>{item.nome}</span>
          <span style={{ display: "block", fontSize: 12, color: "var(--text3)", fontFamily: "monospace" }}>{item.mezzo}</span>
          <span style={{ display: "block", fontSize: 11, color: "var(--text2)" }}>{info}</span>
        </span>
        <Ring giorni={giorni} stato={stato} />
        <span className={`pill ${stato}`}>{statoLabel(stato)}</span>
        <span style={{
          width: 9, height: 9, borderRight: "2px solid var(--text3)", borderBottom: "2px solid var(--text3)",
          transform: open ? "rotate(-135deg)" : "rotate(45deg)", transition: "transform .3s", flexShrink: 0,
        }} />
      </button>

      {open && (
        <div style={{ padding: "0 18px 18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 14 }}>
            <Field label="Mezzo" value={item.mezzo || "—"} />
            <Field label="Dislocazione" value={item.dislocazione || "—"} />
            <Field label={isTaglio ? "Prossima revisione" : "Prossima revisione"} value={formatData(scad)} />
            <Field label="Stato" value={statoLabel(stato)} />
          </div>

          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text3)", marginBottom: 8 }}>
            {isTaglio ? "Componenti" : "Seriali componenti"} ({comps.length})
          </div>
          {comps.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", marginBottom: 6 }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12, fontWeight: 700 }}>{c.tipo}</span>
                <span style={{ display: "block", fontSize: 10, color: "var(--text3)" }}>{c.modello || "—"}</span>
              </span>
              {isTaglio ? (
                c.matricola ? <span style={{ fontFamily: "monospace", fontSize: 10, color: "var(--text2)" }}>{c.matricola}</span> : null
              ) : (
                c.matricolaLucca ? <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 10, color: "var(--blue-text)", background: "var(--blue-bg)", padding: "3px 7px", borderRadius: 5 }}>{c.matricolaLucca}</span> : null
              )}
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Link to={detailPath} className="btn btn-secondary" style={{ flex: 1, textAlign: "center" }}>Dettaglio completo</Link>
            <Link to={`${detailPath}/modifica`} className="btn btn-primary" style={{ flex: 1, textAlign: "center" }}>Modifica</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
      <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text3)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
```

- [ ] **Step 2: Verifica build**

Run: `npx eslint src/components/KitAccordion.js`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/KitAccordion.js
git commit -m "feat(redesign): componente KitAccordion"
```

---

### Task 4: Pagina `KitView` (stats + scorta + ricerca + accordion)

**Files:**
- Create: `src/pages/KitView.js`

**Interfaces:**
- Consumes: `KitAccordion` (Task 3); `contaStats`, `scortaMancante` (Task 1); da `../utils`: `calcolaStato`, `calcolaStatoGT`, `giorniAllaScadenza`, `prossimaRevisioneGT`.
- Produces: `export default function KitView({ kits, gruppiTaglio, sistema })`.

- [ ] **Step 1: Creare la pagina**

```jsx
// src/pages/KitView.js
import React, { useState, useMemo } from "react";
import KitAccordion from "../components/KitAccordion";
import { contaStats, scortaMancante } from "../inventario";
import { calcolaStato, calcolaStatoGT, giorniAllaScadenza, prossimaRevisioneGT } from "../utils";

export default function KitView({ kits, gruppiTaglio, sistema }) {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);

  const isTaglio = sistema === "taglio";
  const items = isTaglio ? (gruppiTaglio || []) : (kits || []);
  const calcStato = isTaglio ? calcolaStatoGT : calcolaStato;
  const scadDi = it => isTaglio ? prossimaRevisioneGT(it) : it.dataRevisione;

  const stats = useMemo(() => contaStats(items, calcStato), [items, isTaglio]);
  const mancaScorta = useMemo(() => scortaMancante(items), [items]);

  const visibili = items.filter(it => it.stato !== "fuori_uso");
  const q = search.toLowerCase().trim();
  const filtrati = visibili.filter(it => {
    if (!q) return true;
    const campi = [String(it.numero), it.nome, it.mezzo, it.dislocazione];
    const inComp = (it.componenti || []).some(c => [c.modello, c.matricola, c.matricolaLucca].some(v => v && v.toLowerCase().includes(q)));
    return campi.some(v => v && v.toLowerCase().includes(q)) || inComp;
  }).sort((a, b) => (giorniAllaScadenza(scadDi(a)) ?? 9999) - (giorniAllaScadenza(scadDi(b)) ?? 9999));

  const scortaLabel = isTaglio ? "gruppo da taglio" : "cuscino";

  return (
    <div>
      {/* Statistiche */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        <Stat n={stats.operativi} l="Operativi" />
        <Stat n={stats.inScadenza} l="In scadenza" color="var(--amber-text)" />
        <Stat n={stats.scaduti} l="Scaduti" color="var(--red-text)" />
        <Stat n={stats.magazzino} l="Magazzino" color="var(--text3)" />
      </div>

      {/* Banner scorta */}
      {mancaScorta && (
        <div className="section-blue" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, background: "var(--amber-bg)", borderColor: "var(--amber)" }}>
          <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", color: "#fff", background: "var(--amber)", padding: "3px 9px", borderRadius: 20 }}>Suggerimento</span>
          <span style={{ flex: 1, fontSize: 13, color: "var(--amber-text)", fontWeight: 600 }}>
            Nessun <b>{scortaLabel}</b> di scorta in magazzino — valuta un acquisto.
          </span>
        </div>
      )}

      {/* Ricerca */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none" }}>⌕</span>
        <input className="search-input" style={{ paddingLeft: 40 }}
          placeholder="Cerca numero, nome, matricola, mezzo..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Lista accordion */}
      {!filtrati.length ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text3)", fontSize: 14 }}>Nessun kit trovato.</div>
      ) : filtrati.map(it => {
        const st = calcStato(it);
        const scad = scadDi(it);
        return (
          <KitAccordion key={it.id} item={it} sistema={sistema}
            stato={st} giorni={giorniAllaScadenza(scad)} scad={scad}
            open={openId === it.id}
            onToggle={() => setOpenId(openId === it.id ? null : it.id)} />
        );
      })}
    </div>
  );
}

function Stat({ n, l, color }) {
  return (
    <div className="card" style={{ padding: "12px 14px" }}>
      <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1, color: color || "var(--text)" }}>{n}</div>
      <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text3)", marginTop: 6 }}>{l}</div>
    </div>
  );
}
```

- [ ] **Step 2: Verifica build**

Run: `npx eslint src/pages/KitView.js`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/pages/KitView.js
git commit -m "feat(redesign): pagina KitView con stats, scorta, ricerca e accordion"
```

---

### Task 5: Nuova shell in `App.js` (toggle KIT|Calendario, niente navbar tab)

**Files:**
- Modify: `src/App.js`

**Interfaces:**
- Consumes: `KitView` (Task 4); `Calendario` (esistente).

- [ ] **Step 1: Aggiungere import di `KitView`**

Dopo `import AcquistiPage from "./pages/AcquistiPage";` (e l'import di `Rinumerazione` aggiunto nel piano precedente), aggiungere:

```js
import KitView from "./pages/KitView";
```

- [ ] **Step 2: Sostituire la navbar a tab con un toggle KIT|Calendario**

Nel componente `App`, sostituire l'intero blocco `<nav className="navbar"> ... </nav>` (righe ~286-305) con:

```jsx
        {/* TOGGLE VISTA */}
        <nav className="navbar" style={{ padding: "8px 24px", gap: 8 }}>
          <NavLink to="/" end className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>KIT</NavLink>
          <NavLink to="/calendario" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>Calendario</NavLink>
        </nav>
```

- [ ] **Step 3: Sostituire le rotte**

Sostituire l'intero `<Routes> ... </Routes>` con il set ridotto (home = KitView; dettaglio/form/calendario/admin restano; le tab rimosse rediretto a `/`):

```jsx
            <Routes>
              {/* HOME — vista KIT del sistema attivo */}
              <Route path="/" element={<KitView kits={kits} gruppiTaglio={gruppiTaglio} sistema={sistema} />} />

              {/* CALENDARIO */}
              <Route path="/calendario" element={<Calendario kits={kits} gruppiTaglio={gruppiTaglio} />} />

              {/* CUSCINI — dettaglio/form raggiungibili da KitView */}
              <Route path="/kit/nuovo" element={<KitForm kits={kits} reload={loadAll} />} />
              <Route path="/kit/:id" element={<KitDetail kits={kits} reload={loadAll} />} />
              <Route path="/kit/:id/modifica" element={<KitForm kits={kits} reload={loadAll} />} />

              {/* GRUPPI TAGLIO — dettaglio/form */}
              <Route path="/gruppi-taglio/nuovo" element={<GruppiTaglioForm gruppi={gruppiTaglio} reload={loadAll} />} />
              <Route path="/gruppi-taglio/:id" element={<GruppiTaglioDetail gruppi={gruppiTaglio} reload={loadAll} />} />
              <Route path="/gruppi-taglio/:id/modifica" element={<GruppiTaglioForm gruppi={gruppiTaglio} reload={loadAll} />} />

              {/* ADMIN */}
              <Route path="/admin-reset" element={<AdminReset />} />
              <Route path="/admin/rinumerazione" element={<Rinumerazione reload={loadAll} />} />

              {/* Redirect delle vecchie tab rimosse */}
              <Route path="/kit" element={<Navigate to="/" replace />} />
              <Route path="/gruppi-taglio" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
```

- [ ] **Step 4: Aggiornare gli import di `App.js`**

- Aggiungere `Navigate` all'import di `react-router-dom`:

```js
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from "react-router-dom";
```

- Rimuovere gli import non più usati delle pagine eliminate (verranno cancellate in Task 6): togliere le righe
  `import StatoGiorno`, `import DaFare`, `import KitList`, `import Scadenze`, `import KanbanMezzi`, `import Rotazioni`, `import GruppiTaglioList`, `import KanbanMezziTaglio`, `import AcquistiPage`.
- Rimuovere la funzione `StoricoHub` (definita in `App.js`) e ogni suo riferimento.
- Rimuovere il calcolo `criticiTotali`/`daFareTotali`/`acquistiTotali` e gli array `navCuscini`/`navTaglio`/`navItems` non più usati (il badge "CRITICI" in topbar può restare calcolato da `criticiTotali`; se lo tieni, mantieni solo `criticiTotali`).

- [ ] **Step 5: Verifica build**

Run: `npx eslint src/App.js && CI=true npx react-scripts build`
Expected: eslint exit 0; "Compiled successfully."

- [ ] **Step 6: Verifica manuale**

Run: `npm start`. Verificare:
- Home mostra la vista KIT del sistema attivo (toggle Cuscini/Taglio in topbar cambia la lista).
- Accordion espande mostra campi + componenti + link dettaglio/modifica.
- Toggle "Calendario" apre il calendario esistente.
- Banner scorta compare quando il sistema attivo non ha kit in magazzino.

- [ ] **Step 7: Commit**

```bash
git add src/App.js
git commit -m "feat(redesign): shell a viste KIT|Calendario, rimosse le tab di navigazione"
```

---

### Task 6: Cancellare le pagine morte

**Files:**
- Delete: `src/pages/StatoGiorno.js`, `src/pages/DaFare.js`, `src/pages/KitList.js`, `src/pages/Scadenze.js`, `src/pages/KanbanMezzi.js`, `src/pages/KanbanMezziTaglio.js`, `src/pages/Rotazioni.js`, `src/pages/GruppiTaglioList.js`, `src/pages/AcquistiPage.js`

**Interfaces:** nessuna nuova.

- [ ] **Step 1: Verificare che nessun file importi le pagine da cancellare**

Run (ognuno deve restituire SOLO l'eventuale definizione/route già rimossa, idealmente nessun risultato in `src`):

```bash
grep -rn "StatoGiorno\|DaFare\|KitList\|/Scadenze\|KanbanMezzi\|KanbanMezziTaglio\|Rotazioni\|GruppiTaglioList\|AcquistiPage" src --include=*.js | grep -v "src/pages/"
```

Expected: nessuna riga (tutti i riferimenti erano in `App.js`, già rimossi in Task 5). Se compaiono riferimenti residui, rimuoverli prima di cancellare.

- [ ] **Step 2: Cancellare i file**

```bash
git rm src/pages/StatoGiorno.js src/pages/DaFare.js src/pages/KitList.js src/pages/Scadenze.js src/pages/KanbanMezzi.js src/pages/KanbanMezziTaglio.js src/pages/Rotazioni.js src/pages/GruppiTaglioList.js src/pages/AcquistiPage.js
```

- [ ] **Step 3: Verifica build dopo cancellazione**

Run: `CI=true npx react-scripts build`
Expected: "Compiled successfully." (nessun import rotto).

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(redesign): rimuove le pagine-tab non più usate"
```

---

## Self-Review

**Spec coverage (sezione redesign dello spec):**
- Pagina unica, toggle KIT|Calendario, niente tab → Task 5. ✓
- Vista KIT accordion (cuscini+taglio), stats 4, ricerca → Task 3-4. ✓
- Banner scorta non bloccante → Task 1 (logica) + Task 4 (UI). ✓
- Rimozione pagine morte (come parte del redesign, dopo le sostituzioni) → Task 6, dopo Task 5. ✓
- Stile attuale, no emoji, logo reale → vincoli globali; topbar invariata in `App.js` (non toccata). ✓
- Dettaglio/form preservati e raggiungibili → `KitAccordion` link (Task 3), rotte mantenute (Task 5). ✓
- Calendario per sistema con toggle interno + promemoria → **fuori da questo piano** (Piano 3); qui la vista Calendario riusa il componente esistente.

**Type consistency:** `contaStats(items, calcStato)`/`scortaMancante(items)` definiti in Task 1 e usati identici in Task 4. `KitAccordion` props (`item, sistema, stato, giorni, scad, open, onToggle`) coerenti tra Task 3 e Task 4. `Ring({giorni, stato})` coerente Task 2↔3. ✓

**Placeholder scan:** nessun TODO/TBD; codice completo in ogni step. ✓

**Nota:** Task 5 modifica `App.js` che si appoggia a pagine ancora presenti fino al Task 6; l'ordine (5 prima di 6) garantisce build verde a ogni commit. La topbar (logo, selettore sistema, badge critici, tema) NON viene modificata.
