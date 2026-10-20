# App più intuitiva e snella — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Home con interruttore Cuscini|Taglio, sezione "Da fare", cartellino targa e viste "Mostra per"; pagine kit cuscini e gruppo taglio con testata fissa e 4 pannelli.

**Architecture:** Due funzioni pure nuove e testate (`daFare` in `inventario.js`, `unisciStorico` in `storico.js`) alimentano la UI. Due componenti piccoli condivisi (`Cartellino`, `MenuAzioni`). Poi si ristrutturano `App.js` (topbar), `KitView`/`KitAccordion` (home), `KitDetail` e `GruppiTaglioDetail` riusando tutta la logica e i modali esistenti.

**Tech Stack:** React (CRA, react-scripts), react-router-dom, Jest + @testing-library/react, CSS in `src/App.css`.

**Spec:** `docs/superpowers/specs/2026-10-20-home-intuitiva-design.md` — leggerla insieme a questo piano. Bozze di riferimento visivo: `.superpowers/brainstorm/1283-1792503420/content/home-mostra-per.html`, `kit-dettaglio.html`, `taglio-dettaglio.html`.

## Global Constraints

- Nessuna nuova dipendenza.
- Nessuna modifica a dati Firestore, a `firebase/service.js`, alla logica stati/scadenze (`calcolaStato`, `calcolaStatoGT`, ecc.), all'export (`export.js`).
- Stile neumorfico esistente (`--bg`, `--neu-out`, `--neu-in`, toni `reg-chip`); niente emoji; testi UI in italiano.
- Righe lista: mai testo a capo — `white-space:nowrap; overflow:hidden; text-overflow:ellipsis`.
- Date: mai `toISOString` su date locali; usare `isoLocale`/`oggiIso` da `utils.js`.
- Ogni stile nuovo ha la variante `[data-theme="dark"]`.
- Mobile (≥360px): niente scroll orizzontale della pagina.
- Nessuna funzione esistente persa (foto componente, fuori uso, sostituisci, vecchio codice, sposta, documenti, elimina, ripristina/elimina dismessi, export CSV/PDF, modali revisione/manutenzione/stato componente).
- Test: `CI=true npx react-scripts test --watchAll=false <pattern>` da root progetto.

## Review Focus

1. Kit senza data revisione (`senza_data`, `dataRevisione: null`) → nessuna riga revisione in "Da fare", nessun crash; il cartellino e la riga in elenco mostrano "—". Test in Task 1.
2. Gruppo taglio con tutti i componenti fermi (→ `prossimaRevisioneGT` = null) → solo riga "componenti fermi", nessuna riga revisione. Test in Task 1.
3. Targa vuota o non-targa (`"MAGAZZINO"`, `"FUORI SERVIZIO"`) → cartellino in variante spenta, mai vuoto. Test in Task 3.
4. Tema scuro: cartellino, interruttore, pannelli leggibili. Verifica manuale in Task 8.
5. Telefono 360px: interruttore, barra azioni dettaglio e 4 pannelli stanno in larghezza; tipo mezzo lungo ("POLISOCCORSO", "APS ACTROS") troncato. Verifica manuale in Task 8.

---

### Task 1: `daFare` — elenco problemi per sistema

**Files:**
- Modify: `src/inventario.js`
- Test: `src/inventario.test.js`

**Interfaces:**
- Consumes (da `utils.js`): `calcolaStato`, `calcolaStatoGT`, `prossimaRevisioneGT`, `giorniAllaScadenza`, `componenteAttivoGT`, `formatData`.
- Produces: `daFare(items: object[], isTaglio: boolean) -> Array<{ item, tipo: "scaduta"|"fermi"|"in_scadenza", titolo: string, dettaglio: string, giorni: number|null }>`

Regole (dalla spec):
- Salta `item.stato === "fuori_uso"`.
- Stato: `isTaglio ? calcolaStatoGT(it) : calcolaStato(it)`; scadenza: `isTaglio ? prossimaRevisioneGT(it) : it.dataRevisione`; `giorni = giorniAllaScadenza(scad)`.
- `"scaduto"` → `{ tipo:"scaduta", titolo:"Revisione scaduta", dettaglio:"scaduta il " + formatData(scad) }`.
- `"critico"` o `"attenzione"` → `{ tipo:"in_scadenza", titolo:"Revisione in scadenza", dettaglio:"scade il " + formatData(scad) }`.
- Componenti fermi: cuscini `c.fuoriUso`; taglio `!componenteAttivoGT(c)`. Se n > 0 → `tipo:"fermi"`, titolo cuscini `"1 componente fuori uso"` / `"N componenti fuori uso"`, taglio `"1 componente fermo"` / `"N componenti fermi"`. Dettaglio con n === 1: `` `${c.tipo} ${codice} — ${stato}` `` dove codice = cuscini `c.matricolaLucca || c.matricola`, taglio `c.matricola`; stato = cuscini `"da sostituire"`, taglio `"in revisione"` se `statoOperativo === "in_revisione"` altrimenti `"fuori servizio"`. Con n > 1: `"vedi componenti"`.
- Un item può produrre due righe (revisione + fermi).
- Ordine: tipo `scaduta` < `fermi` < `in_scadenza`; a parità, `giorni` crescente, `null` in fondo.

- [ ] **Step 1: Write the failing tests** in `src/inventario.test.js` (helper: `const tra = n => isoLocale(new Date(Date.now() + n * 86400000));`, import `isoLocale` da `./utils`):

```js
describe("daFare", () => {
  test("cuscini: scaduta, fermi, in scadenza in quest'ordine", () => {
    const items = [
      { id:"a", stato:"attivo", dataRevisione: tra(30), componenti:[] },
      { id:"b", stato:"attivo", dataRevisione: tra(400), componenti:[{ tipo:"RIDUTTORE", matricolaLucca:"RP 10 SI 3", fuoriUso:true }] },
      { id:"c", stato:"attivo", dataRevisione: tra(-12), componenti:[] },
    ];
    const r = daFare(items, false);
    expect(r.map(x => [x.item.id, x.tipo])).toEqual([["c","scaduta"],["b","fermi"],["a","in_scadenza"]]);
    expect(r[1].titolo).toBe("1 componente fuori uso");
    expect(r[1].dettaglio).toBe("RIDUTTORE RP 10 SI 3 — da sostituire");
  });
  test("kit con revisione scaduta e fuori uso → due righe", () => {
    const r = daFare([{ id:"x", stato:"attivo", dataRevisione: tra(-1), componenti:[{ tipo:"TUBO", fuoriUso:true },{ tipo:"TUBO", fuoriUso:true }] }], false);
    expect(r.map(x => x.tipo)).toEqual(["scaduta","fermi"]);
    expect(r[1].titolo).toBe("2 componenti fuori uso");
    expect(r[1].dettaglio).toBe("vedi componenti");
  });
  test("esclude fuori_uso e kit senza data revisione", () => {
    expect(daFare([
      { stato:"fuori_uso", dataRevisione: tra(-5), componenti:[] },
      { stato:"attivo", dataRevisione: null, componenti:[] },
    ], false)).toEqual([]);
  });
  test("taglio: componente in revisione", () => {
    const gt = { id:"g", stato:"attivo", componenti:[
      { tipo:"CENTRALINA", matricola:"85207", prossimaRevisione: tra(400) },
      { tipo:"CENTRALINA", matricola:"85228", prossimaRevisione: tra(400), statoOperativo:"in_revisione" },
    ]};
    const r = daFare([gt], true);
    expect(r).toHaveLength(1);
    expect(r[0].titolo).toBe("1 componente fermo");
    expect(r[0].dettaglio).toBe("CENTRALINA 85228 — in revisione");
  });
  test("taglio: tutti i componenti fermi → solo riga fermi", () => {
    const gt = { stato:"attivo", componenti:[{ tipo:"CESOIA", matricola:"1", prossimaRevisione: tra(-3), statoOperativo:"fuori_servizio" }] };
    expect(daFare([gt], true).map(x => x.tipo)).toEqual(["fermi"]);
  });
});
```

- [ ] **Step 2: Run** `CI=true npx react-scripts test --watchAll=false inventario` → FAIL (`daFare is not a function`).
- [ ] **Step 3: Implement** `export function daFare(items, isTaglio)` in `src/inventario.js` per le regole sopra.
- [ ] **Step 4: Run** stesso comando → PASS (anche i test esistenti di `contaStats`/`scortaMancante`).
- [ ] **Step 5: Commit** `feat(home): daFare — elenco problemi ordinato per urgenza`.

---

### Task 2: `unisciStorico` — linea del tempo unica

**Files:**
- Create: `src/storico.js`
- Test: `src/storico.test.js`

**Interfaces:**
- Produces: `unisciStorico(fonti: Array<{ tipo: string, voci: object[], data: (voce) => string|undefined }>) -> Array<{ tipo: string, data: string, voce: object }>` ordinato per `data` decrescente (confronto stringa ISO; voci senza data in fondo).

Campi data reali (per i task 6–7): revisioni `dataRevisione`, sostituzioni `dataOperazione`, spostamenti `data` (timestamp ISO completo), manutenzioni GT `data`, stati componenti GT `data`.

- [ ] **Step 1: Write the failing test** `src/storico.test.js`:

```js
import { unisciStorico } from "./storico";
test("unisce e ordina dal più recente, senza data in fondo", () => {
  const r = unisciStorico([
    { tipo:"revisione", voci:[{ id:1, dataRevisione:"2025-09-25" }], data: v => v.dataRevisione },
    { tipo:"spostamento", voci:[{ id:2, data:"2026-01-10T09:00:00.000Z" }, { id:3 }], data: v => v.data },
  ]);
  expect(r.map(x => [x.tipo, x.voce.id])).toEqual([["spostamento",2],["revisione",1],["spostamento",3]]);
});
test("fonti vuote → []", () => { expect(unisciStorico([{ tipo:"x", voci:[], data: v => v.d }])).toEqual([]); });
```

- [ ] **Step 2: Run** `CI=true npx react-scripts test --watchAll=false storico` → FAIL.
- [ ] **Step 3: Implement** `unisciStorico` in `src/storico.js` (flatMap + sort).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(storico): unisciStorico per la linea del tempo unificata`.

---

### Task 3: Componenti condivisi `Cartellino` e `MenuAzioni` + CSS

**Files:**
- Create: `src/components/Cartellino.js`, `src/components/MenuAzioni.js`
- Modify: `src/App.css` (in fondo, sezione `/* ── Cartellino targa / MenuAzioni ── */`)
- Test: `src/components/componenti.test.js`

**Interfaces:**
- Produces: `<Cartellino numero={string|number} targa={string} grande={bool} />` → `<span className="cart [cart-lg] [cart-off]"><b>KIT {numero}</b><span>{targaMostrata}</span></span>`. `cart-off` quando la targa è vuota o non inizia con `"VF"` (es. `"MAGAZZINO"`, `"FUORI SERVIZIO"`); targa vuota mostra `"—"`.
- Produces: `<MenuAzioni etichetta={string} voci={[{ label, onClick, danger? }]} />` → bottone `btn btn-secondary` che apre un elenco; si chiude al clic su una voce (dopo averla eseguita) e al `mousedown` fuori. `aria-haspopup="menu"`, `aria-expanded`.

CSS: cartellino = bordo 2px scuro (`--text`), fondo bianco, fascia superiore scura con testo bianco, targa monospace 800; `.cart-lg` più grande (bozza `kit-dettaglio.html`); `.cart-off` grigio (`--text3`); `flex-shrink:0`. Variante dark: fondo `--bg3`, bordo/fascia chiari leggibili. Dropdown: `position:absolute`, ombra `--neu-out`, z-index sopra le card.

- [ ] **Step 1: Write the failing tests** `src/components/componenti.test.js`:

```js
import { render, screen, fireEvent } from "@testing-library/react";
import Cartellino from "./Cartellino";
import MenuAzioni from "./MenuAzioni";

test("cartellino mostra numero e targa", () => {
  const { container } = render(<Cartellino numero={4} targa="VF 16701"/>);
  expect(screen.getByText("KIT 4")).toBeInTheDocument();
  expect(screen.getByText("VF 16701")).toBeInTheDocument();
  expect(container.firstChild).not.toHaveClass("cart-off");
});
test("cartellino spento per MAGAZZINO e targa vuota", () => {
  const { container, rerender } = render(<Cartellino numero={12} targa="MAGAZZINO"/>);
  expect(container.firstChild).toHaveClass("cart-off");
  rerender(<Cartellino numero={12} targa=""/>);
  expect(screen.getByText("—")).toBeInTheDocument();
});
test("menu: apre, esegue la voce e si chiude", () => {
  const fn = jest.fn();
  render(<MenuAzioni etichetta="Esporta" voci={[{ label:"CSV", onClick: fn }]}/>);
  expect(screen.queryByText("CSV")).toBeNull();
  fireEvent.click(screen.getByText("Esporta"));
  fireEvent.click(screen.getByText("CSV"));
  expect(fn).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("CSV")).toBeNull();
});
```

- [ ] **Step 2: Run** `CI=true npx react-scripts test --watchAll=false componenti` → FAIL.
- [ ] **Step 3: Implement** i due componenti e il CSS.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(ui): Cartellino targa e MenuAzioni condivisi`.

---

### Task 4: Topbar e interruttore Cuscini | Taglio (`App.js`)

**Files:**
- Modify: `src/App.js` (topbar ~righe 235–281, conteggi ~181–215), `src/App.css`

**Interfaces:**
- Consumes: `daFare` (Task 1).

Cambi:
- Topbar: logo + "SICS — VVF Siena" diventano un `NavLink to="/"`. A destra: pulsanti con testo **Calendario** (`NavLink /calendario`), **Tema** (toggle `darkMode` esistente), **Admin** (`AdminLink` esistente, ora con testo). Rimuovere `badge-critico`.
- Rimuovere la `<nav className="navbar">` KIT/Calendario.
- Sotto la banda colorata, nuovo blocco `.sistema-switch`: due bottoni larghi a tutta riga "Cuscini" / "Taglio" che chiamano `setSistema`; l'attivo ha fondo `--cuscini` / `--taglio`. Ogni bottone ha un contatore `.switch-cnt` = `daFare(kits,false).length` / `daFare(gruppiTaglio,true).length`, nascosto se 0. Cliccare un sistema mentre si è su un'altra rotta naviga a `/`.
- Eliminare codice morto: `criticiTotali`, `daFareTotali`, `acquistiTotali`, `navCuscini`, `navTaglio`, `navItems` e la vecchia `.sistema-selector` se non più usata (grep prima di cancellare CSS).

- [ ] **Step 1: Implement** i cambi sopra.
- [ ] **Step 2: Run** `CI=true npx react-scripts test --watchAll=false` → tutti PASS; `npm run build` → "Compiled successfully" senza warning nuovi di variabili inutilizzate.
- [ ] **Step 3: Verifica manuale** (`npm start`): l'interruttore cambia sistema e i contatori corrispondono alle righe "Da fare" (dopo il Task 5); Calendario/Tema/Admin funzionano; logo → home.
- [ ] **Step 4: Commit** `feat(home): topbar con etichette e interruttore Cuscini|Taglio con contatori`.

---

### Task 5: Home — statistiche, Da fare, Mostra per (`KitView`, `KitAccordion`)

**Files:**
- Modify: `src/pages/KitView.js`, `src/components/KitAccordion.js`, `src/App.css`

**Interfaces:**
- Consumes: `daFare` (Task 1), `Cartellino`, `MenuAzioni` (Task 3).

Cambi in `KitView` (ordine dall'alto, vedi spec "Home"):
1. Header: titolo attuale + `MenuAzioni etichetta="Esporta"` con voci "CSV" (`esportaCsv`) e "PDF" (`esportaPdf`) + Link "+ Nuovo kit/gruppo" esistente.
2. I 4 `Stat` diventano una riga `.stats-riga`: "**N** operativi · **N** in scadenza · **N** scaduti · **N** in magazzino" (stessi valori di `contaStats`). Rimuovere il componente `Stat` se inutilizzato.
3. Banner scorta: invariato.
4. Sezione **Da fare (N)** da `daFare(items, isTaglio)`: riga = `Cartellino` + titolo + sottotitolo `` `${item.nome} · ${dettaglio}` `` + chip (`scaduta` → tono `b` "Scaduta"; `fermi` → tono `w` "Attenzione"; `in_scadenza` → tono `w` "fra N gg"). Riga = `Link` al dettaglio (`/kit/:id` o `/gruppi-taglio/:id`). Vuota → testo "Niente da fare — tutto in regola".
5. **Tutti i kit (N)** + selettore `Mostra per` (`useState("scadenza")`, valori `"scadenza"|"targa"|"matricola"`), poi la ricerca esistente (placeholder "Cerca kit, targa, matricola…"), poi:
   - `scadenza`: lista attuale (`filtrati` già ordinati) con `KitAccordion`.
   - `targa`: `filtrati` raggruppati per `dislocazione` (gruppi ordinati alfabeticamente, "—" per vuoto), dentro ordinati per `mezzo`; `KitAccordion` con prop `vista="targa"` che nella colonna scadenza mostra "N componenti · {bar} bar" (cuscini) / "N componenti · {marca}" (taglio).
   - `matricola`: riga non espandibile, `Link` al dettaglio: `Cartellino` + `nome` + "N componenti" + chip matricole: cuscini `matricolaLucca` + `tipo` + `matricola`, taglio `matricola` + `tipo`; componenti fermi (cuscini `fuoriUso`, taglio `!componenteAttivoGT`) con classe rossa; dopo 5 chip, chip "+N".
6. Sezione "Fuori uso — dismessi": invariata.

Cambi in `KitAccordion`: sostituire `reg-num` con `<Cartellino numero={item.numero} targa={item.mezzo}/>`; `reg-sub` mostra solo `marca` (la targa è nel cartellino); aggiungere prop opzionale `vista`. Adeguare la griglia `.reg-cols` alla larghezza del cartellino; header colonne "Kit" invariato.

- [ ] **Step 1: Implement** i cambi.
- [ ] **Step 2: Run** `CI=true npx react-scripts test --watchAll=false` → PASS; `npm run build` → ok.
- [ ] **Step 3: Verifica manuale** su entrambi i sistemi: Da fare coerente con i contatori dell'interruttore; le 3 viste mostrano tutti i kit filtrati; la ricerca per matricola funziona in tutte e 3; export CSV/PDF dal menu; nessuna riga va a capo.
- [ ] **Step 4: Commit** `feat(home): Da fare, statistiche compatte e viste Mostra per`.

---

### Task 6: Pagina kit cuscini (`KitDetail`)

**Files:**
- Modify: `src/pages/KitDetail.js` (header ~230–246, tab ~248–483), `src/App.css`

**Interfaces:**
- Consumes: `Cartellino`, `MenuAzioni` (Task 3), `unisciStorico` (Task 2). Tutti gli handler/modali esistenti restano.

Cambi (spec "Pagina kit cuscini"):
1. Barra azioni: "‹ Kit cuscini" (naviga a `/`, non `/kit`) · `+ Revisione` (btn-success) · `⇄ Sposta` · `Modifica` · `MenuAzioni etichetta="⋯"` con voce `{ label:"Elimina kit", onClick: handleDelete, danger:true }`.
2. Testata `.kit-hero`: `<Cartellino grande numero={kit.numero} targa={kit.mezzo}/>` + `kit.nome` + "dislocazione · bar bar · N componenti" + pill stato + chip "Kit incompleto" se `componentiFuoriUso(kit) > 0`.
3. Tre riquadri `.kit-kpi`: Prossima revisione (`formatData(kit.dataRevisione)` + "fra N giorni"/"scaduta da N giorni"), Ultima revisione (data `revisioni[0]?.dataRevisione` + esito, fallback `kit.ultimaRevisioneEsito`), Componenti (`operativi / totale` + "N fuori uso").
4. Banner esistenti (scaduto/critico/incompleto) sotto i riquadri; incompleto con un solo componente nomina `tipo` e `matricolaLucca`.
5. Tab: `useState("componenti")`; 4 bottoni a tutta riga: **Componenti (N)**, **Dati kit**, **Storico (N)**, **Documenti** / "Allegati" se `kit.stato === "fuori_uso"`.
   - Componenti: blocco attuale invariato nel contenuto.
   - Dati kit: stessi campi della tabella attuale in griglia 2 colonne `.dati-grid` + timeline revisioni attuale sotto (se ancora utile, ultime 5).
   - Storico: `unisciStorico([{tipo:"revisione", voci:revisioni, data:v=>v.dataRevisione}, {tipo:"sostituzione", voci:storicoSost, data:v=>v.dataOperazione}, {tipo:"spostamento", voci:storicoSpost, data:v=>v.data}])`; filtri `Tutto|Revisioni|Sostituzioni|Spostamenti`; voce = chip tipo + data + riga con lo stesso contenuto mostrato oggi (revisione: esito/tecnico/ente/note; sostituzione: uscente `matricolaLucca` → entrante `matricolaLucca`, destinazione, note; spostamento: dislocazione e targa prima → dopo, motivo). Pulsante "+ Aggiungi revisione" in cima al pannello.
   - Documenti: invariato.
6. Rimuovere i tab `revisioni`, `sostituzioni`, `spostamenti`, `info`.

- [ ] **Step 1: Implement** i cambi.
- [ ] **Step 2: Run** `CI=true npx react-scripts test --watchAll=false` → PASS; `npm run build` → ok.
- [ ] **Step 3: Verifica manuale** su un kit con fuori uso (es. Kit 13) e uno senza revisioni: tutti i modali (revisione, sostituzione, fuori uso, sposta) si aprono e salvano e lo Storico si aggiorna; Elimina chiede conferma; foto e vecchio codice funzionano.
- [ ] **Step 4: Commit** `feat(kit): testata con cartellino e 4 pannelli con storico unificato`.

---

### Task 7: Pagina gruppo taglio (`GruppiTaglioDetail`)

**Files:**
- Modify: `src/pages/GruppiTaglioDetail.js` (header ~130–170, tab ~171–458), `src/App.css`

**Interfaces:**
- Consumes: `Cartellino`, `MenuAzioni`, `unisciStorico`; classi `.kit-hero`, `.kit-kpi`, `.dati-grid` e tab del Task 6.

Cambi (spec "Pagina gruppo taglio"):
1. Barra azioni: "‹ Gruppi da taglio" (naviga a `/`) · `+ Revisione` · `+ Manutenzione` · `Modifica` · `⋯` (Elimina). Rimuovere il pulsante Calendario.
2. Testata: cartellino grande + `gt.nome` + "dislocazione · marca · sistema · N componenti" + pill stato + badge sistema esistente + chip "N componenti fermi" se `componentiNonOperativiGT(gt).totale > 0`.
3. Riquadri: Prossima revisione (`prossimaRevisioneGT(gt)` + giorni), Ultima manutenzione (`manutenzioni[0]` data + tipo, "—" se nessuna), Componenti (attivi/totale + "N in revisione"/"N fuori servizio").
4. Banner esistenti (fuori uso definitivo con `Documenti`, incompleto — testo "vedi pannello Componenti", scaduto, critico) mantenuti.
5. Tab `useState("componenti")`: **Componenti (N)**, **Dati gruppo**, **Storico (N)**, **Documenti**.
   - Componenti: blocco attuale invariato (incluso "Storico guasti e fermi").
   - Dati gruppo: campi della card "Dati gruppo" in `.dati-grid` + card "Manutenzione corrente" attuale.
   - Storico: `unisciStorico([{tipo:"revisione", voci:revisioni, data:v=>v.dataRevisione}, {tipo:"manutenzione", voci:manutenzioni, data:v=>v.data}, {tipo:"stato", voci:statiComp, data:v=>v.data}])`; filtri `Tutto|Revisioni|Manutenzioni|Stato componenti`; manutenzione = tipo, componente, olio, candela, note; stato = tipo/matricola componente, `statoPrecedente` → nuovo stato, motivo. Pulsanti "+ Aggiungi revisione" e "+ Aggiungi manutenzione".
   - Documenti: invariato.

- [ ] **Step 1: Implement** i cambi.
- [ ] **Step 2: Run** `CI=true npx react-scripts test --watchAll=false` → PASS; `npm run build` → ok.
- [ ] **Step 3: Verifica manuale** su un gruppo con componente in revisione: modali revisione/manutenzione/stato componente funzionano e lo Storico si aggiorna; gruppo `fuori_uso` mostra ancora il banner con documenti.
- [ ] **Step 4: Commit** `feat(taglio): testata con cartellino e 4 pannelli con storico unificato`.

---

### Task 8: Rifinitura e verifica finale

**Files:**
- Modify: `public/sw.js` (`CACHE_NAME` `"sics-v3"` → `"sics-v4"`), `.gitignore` (aggiungere `.superpowers/`)

- [ ] **Step 1:** Bump `CACHE_NAME` e aggiungi `.superpowers/` a `.gitignore`.
- [ ] **Step 2: Run** `CI=true npx react-scripts test --watchAll=false` → tutti PASS; `npm run build` → "Compiled successfully".
- [ ] **Step 3: Verifica manuale Review Focus 4–5** (`npm start`): tema scuro su home, kit cuscini, gruppo taglio; DevTools larghezza 360px sulle stesse tre pagine → nessuno scroll orizzontale, nomi lunghi troncati, interruttore e 4 pannelli in riga.
- [ ] **Step 4: Commit** `chore: bump cache PWA e ignora .superpowers`.
