# Numerazione Seriali Cuscini — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rinumerare i seriali "matricola Lucca" dei cuscini con un contatore globale per categoria e suggerire il prossimo codice in fase di creazione.

**Architecture:** Modulo puro `src/numerazione.js` con tutta la logica (parse/format/rinumera/suggerisci), testato col dataset golden dell'appendice di `numerazione.md`. Un wrapper di migrazione in `src/firebase/migrazione.js` applica la trasformazione a Firestore con anteprima/dry-run. `KitForm` usa il modulo per il suggerimento. Una pagina admin offre anteprima + applicazione.

**Tech Stack:** React (react-scripts/Jest), Firebase Firestore (modular SDK).

## Global Constraints

- Si applica **SOLO ai cuscini** (collezione Firestore `kits`). I gruppi taglio (`gruppi_taglio`) NON vanno toccati.
- Formato codice mantenuto **con spazi**: `"CS 8 SI 1"` (categoria, bar, indice).
- Categorie valide: `CS, CN, RP, TB, RV`. Mapping tipo→categoria: `CUSCINO*`→CS, `TUBO*`→TB, `CENTRALINA`→CN, `RIDUTTORE`→RP, `RUB. VALVOLARE`→RV.
- Indice = contatore **globale per categoria, continuo su tutti i bar**. Il bar (numero in mezzo) si preserva dal record.
- Migrazione **idempotente**; salva `vecchio_codice` solo se non già presente; NON riordina i record (usa l'ordine naturale di `getAllKits()`).
- Test runner: `npx react-scripts test --watchAll=false <path>` (CI mode).

---

### Task 1: Helper parse / format / categoria

**Files:**
- Create: `src/numerazione.js`
- Test: `src/numerazione.test.js`

**Interfaces:**
- Produces:
  - `parseMatricolaLucca(str): {cat:string, bar:number, index:number} | null`
  - `formatMatricolaLucca(cat:string, bar:number, index:number): string` → `"CS 8 SI 1"`
  - `categoriaDaTipo(tipo:string): string | null`
  - `categoriaDaCodice(str:string): string | null`
  - `CATEGORIE: string[]`

- [ ] **Step 1: Write the failing test**

```js
// src/numerazione.test.js
import {
  parseMatricolaLucca, formatMatricolaLucca, categoriaDaTipo, categoriaDaCodice,
} from "./numerazione";

describe("parse/format/categoria", () => {
  test("parse accetta formato con e senza spazi", () => {
    expect(parseMatricolaLucca("CS 8 SI 1")).toEqual({ cat: "CS", bar: 8, index: 1 });
    expect(parseMatricolaLucca("CS8SI29")).toEqual({ cat: "CS", bar: 8, index: 29 });
    expect(parseMatricolaLucca("CS 10 SI 4")).toEqual({ cat: "CS", bar: 10, index: 4 });
  });
  test("parse ritorna null su input non valido", () => {
    expect(parseMatricolaLucca("")).toBeNull();
    expect(parseMatricolaLucca(null)).toBeNull();
    expect(parseMatricolaLucca("XX 8 SI 1")).toBeNull();
    expect(parseMatricolaLucca("91535")).toBeNull();
  });
  test("format usa il formato con spazi", () => {
    expect(formatMatricolaLucca("CS", 8, 1)).toBe("CS 8 SI 1");
    expect(formatMatricolaLucca("RV", 12, 3)).toBe("RV 12 SI 3");
  });
  test("categoriaDaTipo mappa i tipi componente", () => {
    expect(categoriaDaTipo("CUSCINO 60X60")).toBe("CS");
    expect(categoriaDaTipo("TUBO 5MT")).toBe("TB");
    expect(categoriaDaTipo("CENTRALINA")).toBe("CN");
    expect(categoriaDaTipo("RIDUTTORE")).toBe("RP");
    expect(categoriaDaTipo("RUB. VALVOLARE")).toBe("RV");
    expect(categoriaDaTipo("SCONOSCIUTO")).toBeNull();
  });
  test("categoriaDaCodice estrae la categoria dal codice", () => {
    expect(categoriaDaCodice("CN 8 SI 8")).toBe("CN");
    expect(categoriaDaCodice("boh")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx react-scripts test --watchAll=false src/numerazione.test.js`
Expected: FAIL — "Cannot find module './numerazione'".

- [ ] **Step 3: Write minimal implementation**

```js
// src/numerazione.js
export const CATEGORIE = ["CS", "CN", "RP", "TB", "RV"];

export function categoriaDaTipo(tipo) {
  if (!tipo) return null;
  if (tipo.startsWith("CUSCINO")) return "CS";
  if (tipo.startsWith("TUBO")) return "TB";
  if (tipo === "CENTRALINA") return "CN";
  if (tipo === "RIDUTTORE") return "RP";
  if (tipo === "RUB. VALVOLARE") return "RV";
  return null;
}

export function parseMatricolaLucca(str) {
  if (!str) return null;
  const m = String(str).toUpperCase().match(/^(CS|CN|RP|TB|RV)\s*(\d+)\s*SI\s*(\d+)$/);
  if (!m) return null;
  return { cat: m[1], bar: parseInt(m[2], 10), index: parseInt(m[3], 10) };
}

export function categoriaDaCodice(str) {
  const p = parseMatricolaLucca(str);
  return p ? p.cat : null;
}

export function formatMatricolaLucca(cat, bar, index) {
  return `${cat} ${bar} SI ${index}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx react-scripts test --watchAll=false src/numerazione.test.js`
Expected: PASS (5 test del describe "parse/format/categoria").

- [ ] **Step 5: Commit**

```bash
git add src/numerazione.js src/numerazione.test.js
git commit -m "feat(numerazione): parse/format/categoria helpers"
```

---

### Task 2: `rinumeraSeriali` + dataset golden appendice

**Files:**
- Modify: `src/numerazione.js`
- Test: `src/numerazione.test.js`

**Interfaces:**
- Consumes: `parseMatricolaLucca`, `formatMatricolaLucca` (Task 1).
- Produces: `rinumeraSeriali(codici: string[]): string[]` — input lista ordinata di vecchi codici, output nuovi codici (contatore globale per categoria, bar preservato; codici non parsabili restano invariati).

- [ ] **Step 1: Write the failing test**

```js
// append in src/numerazione.test.js
import { rinumeraSeriali } from "./numerazione";

// Dataset golden: appendice di numerazione.md (ordine = appearance reale del DB)
const GOLDEN = `
CS8SI1->CS8SI1
CN8SI1->CN8SI1
RP8SI1->RP8SI1
TB8SI1->TB8SI1
CS10SI4->CS10SI2
CS10SI5->CS10SI3
CS10SI6->CS10SI4
CN10SI13->CN10SI2
RP10SI3->RP10SI2
TB10SI2->TB10SI2
TB10SI11->TB10SI3
TB10SI4->TB10SI4
TB10SI5->TB10SI5
RV10SI7->RV10SI1
CS8SI29->CS8SI5
CS8SI30->CS8SI6
CS8SI31->CS8SI7
CN8SI7->CN8SI3
RP8SI8->RP8SI3
TB8SI24->TB8SI6
TB8SI25->TB8SI7
TB8SI26->TB8SI8
CS8SI7->CS8SI8
CS8SI8->CS8SI9
CS8SI9->CS8SI10
CN8SI3->CN8SI4
RP8SI4->RP8SI4
TB8SI12->TB8SI9
TB8SI13->TB8SI10
TB8SI14->TB8SI11
CS8SI10->CS8SI11
CS8SI11->CS8SI12
CS8SI12->CS8SI13
CN8SI4->CN8SI5
RP8SI5->RP8SI5
TB8SI15->TB8SI12
TB8SI16->TB8SI13
TB8SI17->TB8SI14
RV8SI6->RV8SI2
CS12SI1->CS12SI14
CS12SI2->CS12SI15
CS12SI3->CS12SI16
CN12SI1->CN12SI6
RP12SI1->RP12SI6
TB12SI1->TB12SI15
TB12SI2->TB12SI16
TB12SI3->TB12SI17
RV12SI4->RV12SI3
CS8SI0->CS8SI17
CS8SI0->CS8SI18
CN8SI0->CN8SI7
RP8SI0->RP8SI7
TB8SI0->TB8SI18
TB8SI0->TB8SI19
TB8SI0->TB8SI20
CS8SI24->CS8SI19
CS8SI25->CS8SI20
CN8SI8->CN8SI8
RP8SI9->RP8SI8
TB8SI27->TB8SI21
TB8SI28->TB8SI22
TB8SI29->TB8SI23
RV8SI1->RV8SI4
CS8SI26->CS8SI21
CS8SI27->CS8SI22
CS8SI28->CS8SI23
CS12SI4->CS12SI24
CN8SI9->CN8SI9
RP8SI10->RP8SI9
TB8SI30->TB8SI24
TB8SI31->TB8SI25
TB8SI32->TB8SI26
CS8SI13->CS8SI25
CS8SI14->CS8SI26
CS8SI15->CS8SI27
CN8SI5->CN8SI10
RP8SI6->RP8SI10
TB8SI18->TB8SI27
TB8SI19->TB8SI28
TB8SI20->TB8SI29
RV8SI5->RV8SI5
CS10SI1->CS10SI28
CS10SI2->CS10SI29
CS10SI3->CS10SI30
CN10SI1->CN10SI11
RP10SI1->RP10SI11
TB10SI1->TB10SI30
TB10SI2->TB10SI31
TB10SI3->TB10SI32
RV10SI2->RV10SI6
RV10SI3->RV10SI7
CS8SI2->CS8SI31
CS8SI3->CS8SI32
CN8SI2->CN8SI12
RP8SI2->RP8SI12
TB8SI6->TB8SI33
TB8SI7->TB8SI34
TB8SI8->TB8SI35
CS8SI18->CS8SI33
CS8SI19->CS8SI34
CS8SI20->CS8SI35
CN8SI6->CN8SI13
RP8SI7->RP8SI13
TB8SI21->TB8SI36
TB8SI22->TB8SI37
TB8SI23->TB8SI38
`.trim().split("\n").map(l => l.split("->"));

const strip = s => s.replace(/\s+/g, "");

describe("rinumeraSeriali", () => {
  test("riproduce esattamente il dataset golden dell'appendice", () => {
    const input = GOLDEN.map(p => p[0]);
    const atteso = GOLDEN.map(p => p[1]);
    const out = rinumeraSeriali(input).map(strip);
    expect(out).toEqual(atteso);
  });
  test("categoria singola parte da 1", () => {
    expect(rinumeraSeriali(["CS 8 SI 99"]).map(strip)).toEqual(["CS8SI1"]);
  });
  test("duplicati distinti per ordine di apparizione, bar preservato", () => {
    expect(rinumeraSeriali(["CS 8 SI 0", "CS 8 SI 0", "CS 10 SI 0"]).map(strip))
      .toEqual(["CS8SI1", "CS8SI2", "CS10SI3"]);
  });
  test("idempotente: una seconda passata non cambia nulla", () => {
    const input = GOLDEN.map(p => p[0]);
    const uno = rinumeraSeriali(input);
    const due = rinumeraSeriali(uno);
    expect(due.map(strip)).toEqual(uno.map(strip));
  });
  test("codici non parsabili restano invariati e non avanzano il contatore", () => {
    expect(rinumeraSeriali(["CS 8 SI 5", "boh", "CS 8 SI 9"]).map(strip))
      .toEqual(["CS8SI1", "BOH", "CS8SI2"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx react-scripts test --watchAll=false src/numerazione.test.js`
Expected: FAIL — `rinumeraSeriali is not a function`.

- [ ] **Step 3: Write minimal implementation**

```js
// append in src/numerazione.js
export function rinumeraSeriali(codici) {
  const contatori = {};
  return (codici || []).map(code => {
    const p = parseMatricolaLucca(code);
    if (!p) return typeof code === "string" ? code.toUpperCase() : code;
    contatori[p.cat] = (contatori[p.cat] || 0) + 1;
    return formatMatricolaLucca(p.cat, p.bar, contatori[p.cat]);
  });
}
```

Nota: il test "non parsabili" si aspetta `"BOH"` (maiuscolo) perché i codici non validi vengono restituiti in uppercase per coerenza con `parseMatricolaLucca`. Se preferisci preservare l'originale, cambia il ramo `if (!p)` in `return code;` e aggiorna il test di conseguenza.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx react-scripts test --watchAll=false src/numerazione.test.js`
Expected: PASS (incluso il golden a 106 righe).

- [ ] **Step 5: Commit**

```bash
git add src/numerazione.js src/numerazione.test.js
git commit -m "feat(numerazione): rinumeraSeriali con dataset golden"
```

---

### Task 3: `rinumeraCuscini` (preserva struttura kit + `vecchio_codice`)

**Files:**
- Modify: `src/numerazione.js`
- Test: `src/numerazione.test.js`

**Interfaces:**
- Consumes: `rinumeraSeriali`, `parseMatricolaLucca` (Task 1-2).
- Produces: `rinumeraCuscini(kits): { kits: Kit[], mappa: Mappatura[] }` dove `Mappatura = {kitId, kitNumero, compIndex, tipo, vecchio, nuovo}`. Imposta `componente.vecchio_codice` (solo se assente) e `componente.matricolaLucca` al nuovo valore. NON riordina i kit.

- [ ] **Step 1: Write the failing test**

```js
// append in src/numerazione.test.js
import { rinumeraCuscini } from "./numerazione";

describe("rinumeraCuscini", () => {
  const kits = [
    { id: "kit-4", numero: 4, componenti: [
      { tipo: "CUSCINO 60X60", matricolaLucca: "CS 8 SI 1" },
      { tipo: "CENTRALINA",    matricolaLucca: "CN 8 SI 1" },
    ]},
    { id: "kit-13", numero: 13, componenti: [
      { tipo: "CUSCINO 50X50", matricolaLucca: "CS 10 SI 4" },
      { tipo: "CUSCINO 50X50", matricolaLucca: "CS 10 SI 5" },
    ]},
  ];

  test("rinumera mantenendo la struttura e il bar", () => {
    const { kits: out } = rinumeraCuscini(kits);
    expect(out[0].componenti[0].matricolaLucca).toBe("CS 8 SI 1");
    expect(out[1].componenti[0].matricolaLucca).toBe("CS 10 SI 2");
    expect(out[1].componenti[1].matricolaLucca).toBe("CS 10 SI 3");
  });
  test("salva vecchio_codice sui componenti modificati", () => {
    const { kits: out } = rinumeraCuscini(kits);
    expect(out[1].componenti[0].vecchio_codice).toBe("CS 10 SI 4");
  });
  test("mappa elenca solo i cambiamenti con kit e indice", () => {
    const { mappa } = rinumeraCuscini(kits);
    expect(mappa).toEqual([
      { kitId: "kit-13", kitNumero: 13, compIndex: 0, tipo: "CUSCINO 50X50", vecchio: "CS 10 SI 4", nuovo: "CS 10 SI 2" },
      { kitId: "kit-13", kitNumero: 13, compIndex: 1, tipo: "CUSCINO 50X50", vecchio: "CS 10 SI 5", nuovo: "CS 10 SI 3" },
    ]);
  });
  test("idempotente: seconda passata produce mappa vuota e non sovrascrive vecchio_codice", () => {
    const uno = rinumeraCuscini(kits).kits;
    const { kits: due, mappa } = rinumeraCuscini(uno);
    expect(mappa).toEqual([]);
    expect(due[1].componenti[0].vecchio_codice).toBe("CS 10 SI 4");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx react-scripts test --watchAll=false src/numerazione.test.js`
Expected: FAIL — `rinumeraCuscini is not a function`.

- [ ] **Step 3: Write minimal implementation**

```js
// append in src/numerazione.js
export function rinumeraCuscini(kits) {
  const lista = kits || [];
  const codici = [];
  lista.forEach(kit => (kit.componenti || []).forEach(c => codici.push(c.matricolaLucca)));
  const nuovi = rinumeraSeriali(codici);

  const mappa = [];
  let ptr = 0;
  const nuoviKit = lista.map(kit => {
    const componenti = (kit.componenti || []).map((c, i) => {
      const nuovo = nuovi[ptr++];
      if (nuovo && nuovo !== c.matricolaLucca) {
        mappa.push({
          kitId: kit.id, kitNumero: kit.numero, compIndex: i,
          tipo: c.tipo, vecchio: c.matricolaLucca || "", nuovo,
        });
        return { ...c, vecchio_codice: c.vecchio_codice || c.matricolaLucca || "", matricolaLucca: nuovo };
      }
      return c;
    });
    return { ...kit, componenti };
  });
  return { kits: nuoviKit, mappa };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx react-scripts test --watchAll=false src/numerazione.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/numerazione.js src/numerazione.test.js
git commit -m "feat(numerazione): rinumeraCuscini preserva struttura e storicizza vecchio_codice"
```

---

### Task 4: Suggerimento prossimo seriale

**Files:**
- Modify: `src/numerazione.js`
- Test: `src/numerazione.test.js`

**Interfaces:**
- Consumes: `parseMatricolaLucca`, `formatMatricolaLucca`, `categoriaDaTipo` (Task 1).
- Produces:
  - `suggerisciIndice(kits, categoria): number` — max indice in uso nella categoria (tutti i bar) + 1; categoria vuota → 1.
  - `suggerisciMatricola(kits, tipo, bar): string` — codice suggerito completo; `""` se tipo non mappabile.

- [ ] **Step 1: Write the failing test**

```js
// append in src/numerazione.test.js
import { suggerisciIndice, suggerisciMatricola } from "./numerazione";

describe("suggerimento", () => {
  const kits = [
    { componenti: [
      { tipo: "CUSCINO 60X60", matricolaLucca: "CS 8 SI 3" },
      { tipo: "CUSCINO 50X50", matricolaLucca: "CS 10 SI 7" },
      { tipo: "CENTRALINA",    matricolaLucca: "CN 8 SI 2" },
    ]},
  ];
  test("indice = max categoria (su tutti i bar) + 1", () => {
    expect(suggerisciIndice(kits, "CS")).toBe(8);
    expect(suggerisciIndice(kits, "CN")).toBe(3);
  });
  test("categoria assente parte da 1", () => {
    expect(suggerisciIndice(kits, "RV")).toBe(1);
    expect(suggerisciIndice([], "CS")).toBe(1);
  });
  test("suggerisciMatricola usa il bar passato e l'indice suggerito", () => {
    expect(suggerisciMatricola(kits, "CUSCINO 45X45", 8)).toBe("CS 8 SI 8");
    expect(suggerisciMatricola(kits, "CUSCINO 45X45", 12)).toBe("CS 12 SI 8");
  });
  test("tipo non mappabile → stringa vuota", () => {
    expect(suggerisciMatricola(kits, "SCONOSCIUTO", 8)).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx react-scripts test --watchAll=false src/numerazione.test.js`
Expected: FAIL — `suggerisciIndice is not a function`.

- [ ] **Step 3: Write minimal implementation**

```js
// append in src/numerazione.js
export function suggerisciIndice(kits, categoria) {
  let max = 0;
  (kits || []).forEach(k => (k.componenti || []).forEach(c => {
    const p = parseMatricolaLucca(c.matricolaLucca);
    if (p && p.cat === categoria && p.index > max) max = p.index;
  }));
  return max + 1;
}

export function suggerisciMatricola(kits, tipo, bar) {
  const cat = categoriaDaTipo(tipo);
  if (!cat) return "";
  return formatMatricolaLucca(cat, Number(bar) || 0, suggerisciIndice(kits, cat));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx react-scripts test --watchAll=false src/numerazione.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/numerazione.js src/numerazione.test.js
git commit -m "feat(numerazione): suggerimento prossimo seriale per categoria"
```

---

### Task 5: Servizio di migrazione (preview + apply)

**Files:**
- Create: `src/firebase/migrazione.js`
- Test: `src/firebase/migrazione.test.js`

**Interfaces:**
- Consumes: `getAllKits`, `updateKit` da `./service`; `rinumeraCuscini` da `../numerazione`.
- Produces:
  - `previewRinumerazioneCuscini(): Promise<Mappatura[]>` — non scrive.
  - `applicaRinumerazioneCuscini(): Promise<Mappatura[]>` — scrive solo i kit con componenti cambiati via `updateKit(id, { componenti })`; ritorna la mappa applicata.

- [ ] **Step 1: Write the failing test**

```js
// src/firebase/migrazione.test.js
jest.mock("./service", () => ({
  getAllKits: jest.fn(),
  updateKit: jest.fn(() => Promise.resolve()),
}));
import { getAllKits, updateKit } from "./service";
import { previewRinumerazioneCuscini, applicaRinumerazioneCuscini } from "./migrazione";

const kits = () => [
  { id: "kit-4", numero: 4, componenti: [{ tipo: "CUSCINO 60X60", matricolaLucca: "CS 8 SI 1" }] },
  { id: "kit-13", numero: 13, componenti: [{ tipo: "CUSCINO 50X50", matricolaLucca: "CS 10 SI 4" }] },
];

beforeEach(() => { jest.clearAllMocks(); });

test("preview ritorna la mappa senza scrivere", async () => {
  getAllKits.mockResolvedValue(kits());
  const mappa = await previewRinumerazioneCuscini();
  expect(mappa).toEqual([
    { kitId: "kit-13", kitNumero: 13, compIndex: 0, tipo: "CUSCINO 50X50", vecchio: "CS 10 SI 4", nuovo: "CS 10 SI 2" },
  ]);
  expect(updateKit).not.toHaveBeenCalled();
});

test("apply scrive solo i kit cambiati", async () => {
  getAllKits.mockResolvedValue(kits());
  await applicaRinumerazioneCuscini();
  expect(updateKit).toHaveBeenCalledTimes(1);
  expect(updateKit).toHaveBeenCalledWith("kit-13", {
    componenti: [{ tipo: "CUSCINO 50X50", matricolaLucca: "CS 10 SI 2", vecchio_codice: "CS 10 SI 4" }],
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx react-scripts test --watchAll=false src/firebase/migrazione.test.js`
Expected: FAIL — "Cannot find module './migrazione'".

- [ ] **Step 3: Write minimal implementation**

```js
// src/firebase/migrazione.js
import { getAllKits, updateKit } from "./service";
import { rinumeraCuscini } from "../numerazione";

export async function previewRinumerazioneCuscini() {
  const kits = await getAllKits();
  return rinumeraCuscini(kits).mappa;
}

export async function applicaRinumerazioneCuscini() {
  const kits = await getAllKits();
  const { kits: nuovi, mappa } = rinumeraCuscini(kits);
  const cambiati = new Set(mappa.map(m => m.kitId));
  for (const kit of nuovi) {
    if (cambiati.has(kit.id)) {
      await updateKit(kit.id, { componenti: kit.componenti });
    }
  }
  return mappa;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx react-scripts test --watchAll=false src/firebase/migrazione.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/firebase/migrazione.js src/firebase/migrazione.test.js
git commit -m "feat(numerazione): servizio migrazione preview/apply Firestore"
```

---

### Task 6: Suggerimento integrato in `KitForm`

**Files:**
- Modify: `src/pages/KitForm.js:5` (import), `src/pages/KitForm.js:16-39` (sostituzione funzione), `src/pages/KitForm.js:79-84` (riquadro info)

**Interfaces:**
- Consumes: `suggerisciMatricola` da `../numerazione`.

- [ ] **Step 1: Sostituire l'import**

Cambiare la riga 5:

```js
// PRIMA
import { PROSSIMI_SERIALI, buildMatricolaLucca } from "../data/kitData";
// DOPO
import { suggerisciMatricola } from "../numerazione";
```

- [ ] **Step 2: Sostituire `calcolaMatricolaLucca` (righe 16-39) con un delega al modulo**

```js
function calcolaMatricolaLucca(tipo, bar, tuttiKits) {
  return suggerisciMatricola(tuttiKits, tipo, Number(bar));
}
```

- [ ] **Step 3: Aggiornare il riquadro info (righe 79-84) che referenziava `PROSSIMI_SERIALI`**

Sostituire il blocco `<div className="section-blue" ...>` con:

```jsx
        {/* Info matricola Lucca */}
        <div className="section-blue" style={{ marginBottom: 16 }}>
          <div className="section-label blue">Matricola Lucca — assegnazione automatica</div>
          <div style={{ fontSize: 12, color: "var(--blue-text)" }}>
            Indice suggerito = ultimo in uso nella categoria + 1. Modificabile a mano.
          </div>
        </div>
```

- [ ] **Step 4: Verifica build/lint**

Run: `npx react-scripts test --watchAll=false src/numerazione.test.js && npx eslint src/pages/KitForm.js`
Expected: test PASS; eslint senza errori su import non usati (`PROSSIMI_SERIALI`/`buildMatricolaLucca` rimossi).

- [ ] **Step 5: Verifica manuale**

Avviare l'app (`npm start`), aprire un kit → Modifica → Aggiungi componente: il campo "Matricola Lucca (auto)" deve proporre `CS <bar> SI <max+1>` e cambiare al cambio tipo/bar.

- [ ] **Step 6: Commit**

```bash
git add src/pages/KitForm.js
git commit -m "feat(numerazione): KitForm usa il suggerimento del modulo numerazione"
```

---

### Task 7: Pagina admin Rinumerazione (anteprima + applica)

**Files:**
- Create: `src/pages/Rinumerazione.js`
- Modify: `src/App.js` (import + rotta `/admin/rinumerazione`)

**Interfaces:**
- Consumes: `previewRinumerazioneCuscini`, `applicaRinumerazioneCuscini` da `../firebase/migrazione`.

- [ ] **Step 1: Creare la pagina**

```jsx
// src/pages/Rinumerazione.js
import React, { useState } from "react";
import { previewRinumerazioneCuscini, applicaRinumerazioneCuscini } from "../firebase/migrazione";

export default function Rinumerazione({ reload }) {
  const [mappa, setMappa] = useState(null);
  const [busy, setBusy] = useState(false);
  const [fatto, setFatto] = useState(false);

  async function anteprima() {
    setBusy(true); setFatto(false);
    setMappa(await previewRinumerazioneCuscini());
    setBusy(false);
  }
  async function applica() {
    if (!window.confirm("Applicare la rinumerazione a TUTTI i cuscini? Verifica prima che l'anteprima coincida con l'appendice di numerazione.md.")) return;
    setBusy(true);
    const m = await applicaRinumerazioneCuscini();
    setMappa(m); setFatto(true); setBusy(false);
    if (reload) await reload();
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Rinumerazione seriali cuscini</h1></div>
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: "var(--text2)" }}>
          Ricalcola le matricole Lucca dei cuscini con contatore globale per categoria.
          Operazione idempotente: salva <code>vecchio_codice</code>. Solo cuscini, i gruppi taglio non sono toccati.
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn btn-secondary" onClick={anteprima} disabled={busy}>Anteprima</button>
          <button className="btn btn-primary" onClick={applica} disabled={busy || !mappa}>Applica</button>
        </div>
      </div>

      {fatto && <div className="section-green" style={{ marginBottom: 12 }}>✓ Rinumerazione applicata: {mappa.length} codici aggiornati.</div>}

      {mappa && (
        <div className="card">
          <div className="card-header"><span className="card-title">{fatto ? "Applicati" : "Anteprima"} — {mappa.length} cambiamenti</span></div>
          {!mappa.length ? (
            <div style={{ padding: 16, color: "var(--text3)", fontSize: 13 }}>Nessun cambiamento: i codici sono già rinumerati.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {mappa.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12, padding: "6px 10px", background: "var(--bg3)", borderRadius: 8 }}>
                  <span style={{ minWidth: 60, color: "var(--text3)" }}>Kit {m.kitNumero}</span>
                  <span style={{ flex: 1 }}>{m.tipo}</span>
                  <span style={{ fontFamily: "monospace", color: "var(--text3)" }}>{m.vecchio}</span>
                  <span>→</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 800, color: "var(--blue-text)" }}>{m.nuovo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Registrare import e rotta in `App.js`**

Aggiungere accanto agli altri import di pagine (dopo la riga `import AdminReset from "./pages/AdminReset";`):

```js
import Rinumerazione from "./pages/Rinumerazione";
```

Aggiungere la rotta dentro `<Routes>` accanto a `/admin-reset`:

```jsx
              <Route path="/admin/rinumerazione" element={<Rinumerazione reload={loadAll}/>}/>
```

- [ ] **Step 3: Verifica manuale**

Run: `npm start`, aprire `http://localhost:3000/admin/rinumerazione`.
- Cliccare "Anteprima" → compare la tabella vecchio→nuovo.
- **Confrontare l'anteprima con l'appendice di `numerazione.md`**: i nuovi codici devono coincidere. Se non coincidono, NON applicare e segnalare (problema di ordine record).
- Cliccare "Applica" → conferma → la mappa si aggiorna come "Applicati".
- Rilanciare "Anteprima": deve dare 0 cambiamenti (idempotenza).

- [ ] **Step 4: Commit**

```bash
git add src/pages/Rinumerazione.js src/App.js
git commit -m "feat(numerazione): pagina admin anteprima/applica rinumerazione"
```

---

## Self-Review

**Spec coverage:**
- Modulo unico testabile → Task 1-4 (`src/numerazione.js`). ✓
- Migrazione idempotente con `vecchio_codice` → Task 3 (logica) + Task 5 (Firestore). ✓
- Suggerimento max+1 per categoria → Task 4 + Task 6 (KitForm). ✓
- Dataset golden appendice → Task 2. ✓
- Anteprima/dry-run da validare contro appendice → Task 7. ✓
- Solo cuscini, taglio intatto → collezione `kits` (Task 5); nessun riferimento a `gruppi_taglio`. ✓
- Formato con spazi, bar preservato, indice globale per categoria → `formatMatricolaLucca`/`rinumeraSeriali` (Task 1-2). ✓

**Type consistency:** `Mappatura {kitId,kitNumero,compIndex,tipo,vecchio,nuovo}` definita in Task 3 e usata identica in Task 5 e Task 7. `rinumeraCuscini`/`rinumeraSeriali`/`suggerisciIndice`/`suggerisciMatricola`/`previewRinumerazioneCuscini`/`applicaRinumerazioneCuscini` coerenti tra i task. ✓

**Placeholder scan:** nessun TODO/TBD; codice completo in ogni step. ✓

**Nota rischio:** Task 7 dipende dall'ordine reale dei record di `getAllKits()` per coincidere con l'appendice. Mitigazione: anteprima obbligatoria prima di applicare. Se l'ordine Firestore differisce dall'appendice, va definito un ordine esplicito prima dell'apply (fuori scope di questo piano, da affrontare in base all'esito dell'anteprima).
