# Calendario per sistema + Promemoria — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere la vista Calendario unica con filtro interno Tutti/Cuscini/Taglio, eventi colorati per sistema (cuscini indigo, taglio ambra, anello rosso se scaduto/critico), aggregando scadenze, revisioni pianificate, manutenzioni taglio e note/promemoria (nuova feature).

**Architecture:** Una util pura testata (`src/calendarioEventi.js`) normalizza tutte le sorgenti in un'unica lista di eventi `{data, sistema, tipo, nome, stato}`. Nuovo CRUD `promemoria` + `getAllManutenzioniGT` in `service.js`. `Calendario.js` carica le sorgenti, usa la util, colora per sistema, aggiunge il filtro interno e la creazione di promemoria su un giorno.

**Tech Stack:** React (react-scripts/Jest), Firebase Firestore.

## Global Constraints

- Colore evento per **sistema**: cuscini `var(--cuscini)` (#5c6bc0), taglio `var(--taglio)` (#f9a825). Anello/bordo rosso `var(--red)` se stato `scaduto`/`critico`.
- Filtro interno: `Tutti | Cuscini | Taglio` (chip stile `filter-chip`).
- Collezione nuova Firestore: `promemoria` con campi `{ data (yyyy-mm-dd), sistema, titolo, note }`.
- Niente emoji decorative.
- Test runner: `CI=true npx react-scripts test --watchAll=false <path>`.

---

### Task 1: Util normalizzazione eventi — pura, TDD

**Files:**
- Create: `src/calendarioEventi.js`
- Test: `src/calendarioEventi.test.js`

**Interfaces:**
- Produces: `normalizzaEventi(sorgenti, fns): Evento[]`
  - `sorgenti = { kits, gruppi, pianificate, manutenzioni, promemoria }` (array, ognuno opzionale).
  - `fns = { statoKit(kit), statoGT(g), scadGT(g) }` — iniettate per testabilità (niente date di sistema dentro la util).
  - `Evento = { data: "yyyy-mm-dd", sistema: "cuscini"|"taglio", tipo: "scadenza"|"pianificata"|"manutenzione"|"promemoria", nome: string, stato: string }`.
  - Regole: scadenze cuscini da `kit.dataRevisione`; scadenze taglio da `scadGT(g)`; ignora item senza data; `data` troncata a 10 char.

- [ ] **Step 1: Write the failing test**

```js
// src/calendarioEventi.test.js
import { normalizzaEventi } from "./calendarioEventi";

const fns = {
  statoKit: k => k._stato,
  statoGT: g => g._stato,
  scadGT: g => g._scad,
};

test("normalizza tutte le sorgenti in eventi unificati", () => {
  const sorgenti = {
    kits: [
      { id: "kit-4", numero: 4, nome: "40/10", dataRevisione: "2026-09-25T00:00:00", _stato: "critico" },
      { id: "kit-9", numero: 9, nome: "Senza data", dataRevisione: null, _stato: "senza_data" },
    ],
    gruppi: [
      { id: "gt-1", numero: "1", nome: "APS 120", _scad: "2026-07-15", _stato: "attenzione" },
    ],
    pianificate: [
      { id: "p1", dataPrevista: "2026-06-12", sistema: "cuscini", kitNomi: ["Kit 4 — 40/10"], stato: "pianificata" },
    ],
    manutenzioni: [
      { id: "m1", data: "2026-06-09", gtNome: "APS 120", tipo: "Cambio olio" },
    ],
    promemoria: [
      { id: "r1", data: "2026-06-20", sistema: "taglio", titolo: "Controllo cesoia" },
    ],
  };
  expect(normalizzaEventi(sorgenti, fns)).toEqual([
    { data: "2026-09-25", sistema: "cuscini", tipo: "scadenza", nome: "Kit 4 — 40/10", stato: "critico" },
    { data: "2026-07-15", sistema: "taglio", tipo: "scadenza", nome: "Kit 1 — APS 120", stato: "attenzione" },
    { data: "2026-06-12", sistema: "cuscini", tipo: "pianificata", nome: "Kit 4 — 40/10", stato: "pianificata" },
    { data: "2026-06-09", sistema: "taglio", tipo: "manutenzione", nome: "APS 120 — Cambio olio", stato: "manutenzione" },
    { data: "2026-06-20", sistema: "taglio", tipo: "promemoria", nome: "Controllo cesoia", stato: "promemoria" },
  ]);
});

test("sorgenti vuote o mancanti → lista vuota", () => {
  expect(normalizzaEventi({}, fns)).toEqual([]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx react-scripts test --watchAll=false src/calendarioEventi.test.js`
Expected: FAIL — "Cannot find module './calendarioEventi'".

- [ ] **Step 3: Write minimal implementation**

```js
// src/calendarioEventi.js
const iso = d => (d ? String(d).slice(0, 10) : null);

export function normalizzaEventi(sorgenti, fns) {
  const { kits = [], gruppi = [], pianificate = [], manutenzioni = [], promemoria = [] } = sorgenti || {};
  const { statoKit, statoGT, scadGT } = fns;
  const out = [];

  kits.forEach(k => {
    if (!k.dataRevisione) return;
    out.push({ data: iso(k.dataRevisione), sistema: "cuscini", tipo: "scadenza", nome: `Kit ${k.numero} — ${k.nome}`, stato: statoKit(k) });
  });
  gruppi.forEach(g => {
    const scad = scadGT(g);
    if (!scad || scad === "NO REVISIONE") return;
    out.push({ data: iso(scad), sistema: "taglio", tipo: "scadenza", nome: `Kit ${g.numero} — ${g.nome}`, stato: statoGT(g) });
  });
  pianificate.forEach(p => {
    if (!p.dataPrevista) return;
    out.push({ data: iso(p.dataPrevista), sistema: p.sistema === "taglio" ? "taglio" : "cuscini", tipo: "pianificata", nome: (p.kitNomi || []).join(", ") || p.officina || "Revisione pianificata", stato: p.stato || "pianificata" });
  });
  manutenzioni.forEach(m => {
    if (!m.data) return;
    out.push({ data: iso(m.data), sistema: "taglio", tipo: "manutenzione", nome: `${m.gtNome || "Gruppo"}${m.tipo ? " — " + m.tipo : ""}`, stato: "manutenzione" });
  });
  promemoria.forEach(r => {
    if (!r.data) return;
    out.push({ data: iso(r.data), sistema: r.sistema === "taglio" ? "taglio" : "cuscini", tipo: "promemoria", nome: r.titolo || "Promemoria", stato: "promemoria" });
  });
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx react-scripts test --watchAll=false src/calendarioEventi.test.js`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add src/calendarioEventi.js src/calendarioEventi.test.js
git commit -m "feat(calendario): util normalizzazione eventi multi-sorgente"
```

---

### Task 2: Service CRUD promemoria + getAllManutenzioniGT

**Files:**
- Modify: `src/firebase/service.js` (aggiungere in fondo alla sezione manutenzioni e dopo le revisioni pianificate)

**Interfaces:**
- Produces:
  - `getAllManutenzioniGT(): Promise<Array>` — tutte le manutenzioni taglio.
  - `getAllPromemoria(): Promise<Array>`
  - `salvaPromemoria(p): Promise<string>` — `p = { data, sistema, titolo, note }`.
  - `deletePromemoria(id): Promise<void>`

- [ ] **Step 1: Aggiungere `getAllManutenzioniGT` dopo `getManutenzioniGT`**

Dopo la funzione `getManutenzioniGT` (che termina alla riga ~280), aggiungere:

```js
export async function getAllManutenzioniGT() {
  const snap = await getDocs(collection(db, GT_MANUTENZIONE));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.data || "").localeCompare(a.data || ""));
}
```

- [ ] **Step 2: Aggiungere il CRUD promemoria dopo `deleteRevisionePianificata`**

Dopo `deleteRevisionePianificata` (riga ~339), aggiungere:

```js
// ─── PROMEMORIA CALENDARIO ───────────────────────────────────
const PROMEMORIA = "promemoria";

export async function getAllPromemoria() {
  const snap = await getDocs(collection(db, PROMEMORIA));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.data || "").localeCompare(b.data || ""));
}

export async function salvaPromemoria(p) {
  // p: { data, sistema, titolo, note }
  const ref2 = await addDoc(collection(db, PROMEMORIA), {
    ...p,
    dataCreazione: new Date().toISOString(),
    timestamp: serverTimestamp(),
  });
  return ref2.id;
}

export async function deletePromemoria(id) {
  await deleteDoc(doc(db, PROMEMORIA, id));
}
```

- [ ] **Step 3: Verifica build/lint**

Run: `npx eslint src/firebase/service.js`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/firebase/service.js
git commit -m "feat(calendario): CRUD promemoria + getAllManutenzioniGT"
```

---

### Task 3: Rework `Calendario.js` (colori per sistema, filtro interno, promemoria)

**Files:**
- Modify: `src/pages/Calendario.js`

**Interfaces:**
- Consumes: `normalizzaEventi` (Task 1); `getAllPromemoria`, `salvaPromemoria`, `deletePromemoria`, `getAllManutenzioniGT`, `getAllRevisioniPianificate` (Task 2 + esistenti); `calcolaStato`, `calcolaStatoGT`, `prossimaRevisioneGT` da `../utils`.

**Approccio:** la pagina mantiene la griglia mensile e il modal "Pianifica revisione" esistenti. Si aggiunge: (a) stato `filtroSistema` con chip Tutti/Cuscini/Taglio; (b) caricamento di promemoria + manutenzioni; (c) costruzione eventi unificati via `normalizzaEventi`; (d) colori dot per sistema; (e) creazione promemoria su un giorno.

- [ ] **Step 1: Aggiornare import e stato**

In testa al file, estendere gli import dei service:

```js
import {
  getAllRevisioniPianificate, pianificaRevisione,
  aggiornaRevisionePianificata, deleteRevisionePianificata,
  getAllPromemoria, salvaPromemoria, deletePromemoria, getAllManutenzioniGT,
} from "../firebase/service";
import { normalizzaEventi } from "../calendarioEventi";
```

Dentro `Calendario`, aggiungere gli stati (vicino agli altri `useState`):

```js
  const [promemoria, setPromemoria] = useState([]);
  const [manutenzioni, setManutenzioni] = useState([]);
  const [filtroSistema, setFiltroSistema] = useState("tutti"); // tutti | cuscini | taglio
```

- [ ] **Step 2: Caricare le nuove sorgenti in `carica()`**

Sostituire la funzione `carica` con:

```js
  async function carica() {
    setLoading(true);
    const [piani, prom, manut] = await Promise.all([
      getAllRevisioniPianificate(), getAllPromemoria(), getAllManutenzioniGT(),
    ]);
    setEventi(piani);
    setPromemoria(prom);
    setManutenzioni(manut);
    setLoading(false);
  }
```

- [ ] **Step 3: Costruire gli eventi unificati e filtrarli per sistema**

Subito dopo il calcolo di `scadenzeDelMese` esistente (o in sostituzione della logica dot), aggiungere il calcolo unificato del mese:

```js
  const COLORE_SISTEMA = { cuscini: "#5c6bc0", taglio: "#f9a825" };

  const eventiUnificati = normalizzaEventi(
    { kits, gruppi: gruppiTaglio, pianificate: eventi, manutenzioni, promemoria },
    { statoKit: calcolaStato, statoGT: calcolaStatoGT, scadGT: prossimaRevisioneGT }
  ).filter(ev => filtroSistema === "tutti" || ev.sistema === filtroSistema);

  function eventiDelGiorno(d) {
    const k = dateToIso(d);
    return eventiUnificati.filter(ev => ev.data === k);
  }
```

(Assicurarsi che `calcolaStato` e `calcolaStatoGT` siano importati da `../utils`; aggiungerli all'import esistente se mancano.)

- [ ] **Step 4: Sostituire la legenda con quella per sistema**

Sostituire il blocco legenda esistente (l'array di colori per stato) con:

```jsx
      {/* Filtro sistema + legenda */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        {[["tutti", "Tutti"], ["cuscini", "Cuscini"], ["taglio", "Taglio"]].map(([k, l]) => (
          <button key={k} className={`filter-chip ${filtroSistema === k ? "active" : ""}`} onClick={() => setFiltroSistema(k)}>{l}</button>
        ))}
        <div style={{ display: "flex", gap: 14, marginLeft: "auto", fontSize: 11 }}>
          <Legenda color="#5c6bc0" label="Cuscini" />
          <Legenda color="#f9a825" label="Taglio" />
          <Legenda color="var(--red)" label="Scaduto/critico" ring />
        </div>
      </div>
```

E aggiungere il componente helper in fondo al file:

```jsx
function Legenda({ color, label, ring }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text3)" }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: ring ? "transparent" : color, border: ring ? `2px solid ${color}` : "none" }} />
      {label}
    </span>
  );
}
```

- [ ] **Step 5: Colorare i dot della griglia per sistema**

Nella griglia giorni, sostituire il blocco che disegna i dot eventi (`evs`/`scs`) con i dot unificati colorati per sistema (anello rosso se scaduto/critico):

```jsx
                    {/* Dot eventi per sistema */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                      {eventiDelGiorno(d).slice(0, 4).map((ev, j) => (
                        <span key={j} title={ev.nome} style={{
                          width: 9, height: 9, borderRadius: "50%",
                          background: COLORE_SISTEMA[ev.sistema],
                          boxShadow: (ev.stato === "scaduto" || ev.stato === "critico") ? "0 0 0 2px var(--red)" : "none",
                        }} />
                      ))}
                      {eventiDelGiorno(d).length > 4 && (
                        <span style={{ fontSize: 9, color: "var(--text3)" }}>+{eventiDelGiorno(d).length - 4}</span>
                      )}
                    </div>
```

- [ ] **Step 6: Popup giorno — elencare eventi unificati + aggiungi promemoria**

Sostituire il corpo del popup giorno selezionato con la lista unificata e un pulsante "Aggiungi promemoria":

```jsx
      {giornoPop && (
        <div className="card" style={{ marginBottom: 16, borderTop: "3px solid var(--accent)" }}>
          <div className="card-header">
            <span className="card-title">{giornoPop.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</span>
            <button className="card-action" onClick={async () => {
              const titolo = window.prompt("Testo del promemoria:");
              if (!titolo) return;
              const sistema = window.confirm("OK = Cuscini, Annulla = Taglio") ? "cuscini" : "taglio";
              await salvaPromemoria({ data: dateToIso(giornoPop), sistema, titolo, note: "" });
              await carica();
            }}>+ Promemoria</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {eventiDelGiorno(giornoPop).length === 0 && (
              <div style={{ color: "var(--text3)", fontSize: 13 }}>Nessun evento.</div>
            )}
            {eventiDelGiorno(giornoPop).map((ev, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                background: "var(--bg3)", border: "1px solid var(--border)",
                borderLeft: `4px solid ${COLORE_SISTEMA[ev.sistema]}`, borderRadius: "var(--radius-sm)",
              }}>
                <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", padding: "2px 8px", borderRadius: 10, color: "#fff", background: COLORE_SISTEMA[ev.sistema] }}>
                  {ev.sistema === "taglio" ? "Taglio" : "Cuscini"}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>{ev.nome}</span>
                  <span style={{ display: "block", fontSize: 10, color: "var(--text3)", textTransform: "uppercase" }}>{ev.tipo}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
```

- [ ] **Step 7: Rimuovere il codice ora inutilizzato**

Rimuovere le funzioni/variabili rese inutili dalla nuova logica: `scadenzeDelMese`, `getEventiGiorno`, `getScadenzeGiorno`, `evGiorno`, `scGiorno`, `tuttiGiorno` e i loro usi residui. Verificare con eslint che non restino riferimenti rotti (il file ha già `/* eslint-disable */` in testa: confermare che la build non rompa).

- [ ] **Step 8: Verifica build**

Run: `npx eslint src/pages/Calendario.js && CI=true npx react-scripts build`
Expected: eslint exit 0; "Compiled successfully."

- [ ] **Step 9: Verifica manuale**

Run: `npm start`, aprire toggle "Calendario". Verificare:
- Chip Tutti/Cuscini/Taglio filtrano gli eventi.
- Dot colorati indigo (cuscini) / ambra (taglio); anello rosso sugli scaduti/critici.
- Click su un giorno → lista eventi con etichetta sistema colorata.
- "+ Promemoria" crea una nota che compare sul giorno.

- [ ] **Step 10: Commit**

```bash
git add src/pages/Calendario.js
git commit -m "feat(calendario): colori per sistema, filtro interno e promemoria"
```

---

## Self-Review

**Spec coverage:**
- Calendario unico con toggle interno Tutti/Cuscini/Taglio → Task 3 Step 4. ✓
- Eventi colorati per sistema, anello rosso scaduto/critico → Task 3 Step 5-6. ✓
- Sorgenti: scadenze + pianificate + manutenzioni + promemoria → Task 1 (normalizza) + Task 2 (service). ✓
- Promemoria = nuova collezione Firestore con CRUD → Task 2. ✓

**Type consistency:** `normalizzaEventi(sorgenti, fns)` con `Evento {data, sistema, tipo, nome, stato}` definito in Task 1 e consumato in Task 3. Service `getAllPromemoria/salvaPromemoria/deletePromemoria/getAllManutenzioniGT` definiti in Task 2 e importati in Task 3. ✓

**Placeholder scan:** nessun TODO/TBD; codice completo. ✓

**Nota:** lo `0 0 0 2px var(--red)` come anello rosso e i colori `#5c6bc0`/`#f9a825` sono valori espliciti coerenti con la palette. La creazione promemoria usa `window.prompt`/`confirm` per minimalità; può evolvere in un modal dedicato in seguito.
