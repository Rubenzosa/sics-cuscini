# Sistema di backup e ripristino — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere una pagina admin `/admin/backup` che permette di creare uno snapshot manuale di tutte le collezioni Firestore dell'app e di ripristinarne una in caso di errore, con lista dei backup fatti e cancellazione manuale.

**Architecture:** Nuova collezione Firestore `backups/{id}` (metadati: data, etichetta, conteggi) con sottocollezione `backups/{id}/dati/{nomeCollezione}` (un documento per ciascuna delle 13 collezioni esistenti, contenente l'array di tutti i loro documenti). Un modulo di logica pura `src/firebase/backup.js` orchestra 4 helper Firestore generici aggiunti a `src/firebase/service.js` (stesso pattern già usato da `src/firebase/migrazione.js`, testato mockando `./service`). Una pagina React `src/pages/Backup.js` espone Backup ora / Lista / Ripristina / Elimina, con lo stesso gate password client-side "0577" già usato in `Rinumerazione.js`.

**Tech Stack:** React, Firebase/Firestore v9 modular SDK, Jest (react-scripts test).

**Spec:** `docs/superpowers/specs/2026-09-02-backup-ripristino-design.md`

## Global Constraints

- Collezioni incluse nel backup (costante `COLLEZIONI_BACKUP`, ordine esatto): `kits`, `gruppi_taglio`, `storico_revisioni`, `storico_spostamenti`, `storico_sostituzioni`, `gt_revisioni`, `gt_manutenzione`, `gt_stati_componenti`, `documenti`, `revisioni_pianificate`, `promemoria`, `allegati_kit`, `rotazioni`.
- Split per collezione in sottocollezione `dati` (mai un unico documento con tutto dentro) — limite 1MB/documento Firestore.
- Password gate identica alle altre pagine admin: `"0577"` (confronto stringa esatta).
- Conferma ripristino: l'utente deve digitare esattamente `"RIPRISTINA"` in un prompt, non un semplice OK/Annulla.
- Ripristino = sostituzione completa per collezione (elimina tutto il presente, riscrive tutto lo snapshot), mai un merge.
- Nessun backup automatico oltre al bottone manuale e a quello già esistente prima di "Applica" nella pagina rinumerazione (invariato, non toccare `applica()` in `Rinumerazione.js` oltre al link di navigazione aggiunto in Task 3).
- Non tocca i file su Google Drive, solo i metadati Firestore (`documenti`, `allegati_kit`).

---

### Task 1: Helper Firestore generici a percorso in `service.js`

**Files:**
- Modify: `src/firebase/service.js` (append in fondo al file, dopo `resetAndSeedGruppiTaglio`, riga 514)

**Interfaces:**
- Produces: `getAllDocs(percorso: string[]) => Promise<Array<{id, ...campi}>>`, `getDocAt(percorso: string[]) => Promise<{id, ...campi} | null>`, `setDocAt(percorso: string[], data: object) => Promise<void>`, `deleteDocAt(percorso: string[]) => Promise<void>`. `percorso` è la sequenza di segmenti passata a `collection()`/`doc()` di Firestore (es. `["kits"]` per la collezione, `["backups", id, "dati", "kits"]` per un documento).

Questi 4 helper sono wrapper sottili sull'SDK Firestore (stesso genere di `getAllKits`/`updateKit` già presenti nel file), quindi **non hanno un test dedicato** — stesso trattamento del resto di `service.js` (nessun `service.test.js` esiste). La logica non banale che li usa viene testata al Task 2 mockando questi 4 nomi.

- [ ] **Step 1: Aggiungi i 4 helper in fondo a `src/firebase/service.js`**

```js
// ─── HELPER GENERICI A PERCORSO (usati da backup.js) ────
export async function getAllDocs(percorso) {
  const snap = await getDocs(collection(db, ...percorso));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function getDocAt(percorso) {
  const snap = await getDoc(doc(db, ...percorso));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
export async function setDocAt(percorso, data) {
  await setDoc(doc(db, ...percorso), data);
}
export async function deleteDocAt(percorso) {
  await deleteDoc(doc(db, ...percorso));
}
```

- [ ] **Step 2: Verifica che il file compili ed esporti correttamente**

Run: `cd "C:\Users\Rube SAPR\Desktop\APP\sics-cuscini" && CI=true npx react-scripts test --watchAll=false`
Expected: tutti i test esistenti passano ancora (nessuna regressione: questo file non ha test propri, ma è importato da `migrazione.js`/pagine già testate indirettamente tramite il resto della suite).

- [ ] **Step 3: Commit**

```bash
git add src/firebase/service.js
git commit -m "feat(backup): helper Firestore generici a percorso per il sistema di backup"
```

---

### Task 2: Modulo `src/firebase/backup.js` (TDD)

**Files:**
- Create: `src/firebase/backup.js`
- Test: `src/firebase/backup.test.js`

**Interfaces:**
- Consumes: `getAllDocs`, `getDocAt`, `setDocAt`, `deleteDocAt` da `./service` (Task 1).
- Produces: `COLLEZIONI_BACKUP: string[]`, `creaBackup(etichetta: string) => Promise<string>` (ritorna l'id del backup creato), `listaBackup() => Promise<Array<{id, creatoIl, etichetta, conteggi}>>` (ordinata dal più recente), `ripristinaBackup(backupId: string) => Promise<{[nomeCollezione]: number}>` (conteggio documenti riscritti per collezione), `eliminaBackup(backupId: string) => Promise<void>`.

- [ ] **Step 1: Scrivi `src/firebase/backup.test.js` (fallirà: `./backup` non esiste ancora)**

```js
jest.mock("./service", () => ({
  getAllDocs: jest.fn(),
  getDocAt: jest.fn(),
  setDocAt: jest.fn(() => Promise.resolve()),
  deleteDocAt: jest.fn(() => Promise.resolve()),
}));
import { getAllDocs, getDocAt, setDocAt, deleteDocAt } from "./service";
import { creaBackup, listaBackup, ripristinaBackup, eliminaBackup, COLLEZIONI_BACKUP } from "./backup";

beforeEach(() => { jest.clearAllMocks(); });

test("COLLEZIONI_BACKUP contiene le 13 collezioni dell'app", () => {
  expect(COLLEZIONI_BACKUP).toEqual([
    "kits", "gruppi_taglio", "storico_revisioni", "storico_spostamenti",
    "storico_sostituzioni", "gt_revisioni", "gt_manutenzione", "gt_stati_componenti",
    "documenti", "revisioni_pianificate", "promemoria", "allegati_kit", "rotazioni",
  ]);
});

test("creaBackup legge tutte le collezioni e scrive un documento dati per ciascuna piu' il padre", async () => {
  getAllDocs.mockImplementation((percorso) => {
    if (percorso.length === 1 && percorso[0] === "kits") {
      return Promise.resolve([{ id: "kit-4", numero: 4 }]);
    }
    return Promise.resolve([]);
  });

  const id = await creaBackup("manuale");

  expect(typeof id).toBe("string");
  expect(setDocAt).toHaveBeenCalledTimes(COLLEZIONI_BACKUP.length + 1);
  expect(setDocAt).toHaveBeenCalledWith(
    ["backups", id, "dati", "kits"],
    { nome: "kits", documenti: [{ id: "kit-4", numero: 4 }] }
  );
  const chiamataPadre = setDocAt.mock.calls.find(c => c[0].length === 2 && c[0][0] === "backups");
  expect(chiamataPadre[1].etichetta).toBe("manuale");
  expect(chiamataPadre[1].conteggi.kits).toBe(1);
  expect(chiamataPadre[1].conteggi.gruppi_taglio).toBe(0);
  expect(typeof chiamataPadre[1].creatoIl).toBe("string");
});

test("listaBackup legge la collezione backups e ordina dal piu' recente", async () => {
  getAllDocs.mockResolvedValue([
    { id: "b1", creatoIl: "2026-09-01T10:00:00.000Z" },
    { id: "b2", creatoIl: "2026-09-02T10:00:00.000Z" },
  ]);

  const out = await listaBackup();

  expect(getAllDocs).toHaveBeenCalledWith(["backups"]);
  expect(out.map(b => b.id)).toEqual(["b2", "b1"]);
});

test("ripristinaBackup elimina i documenti attuali e riscrive quelli dello snapshot, per ogni collezione", async () => {
  getDocAt.mockImplementation((percorso) => {
    if (percorso[3] === "kits") {
      return Promise.resolve({ nome: "kits", documenti: [{ id: "kit-4", numero: 4 }] });
    }
    return Promise.resolve(null);
  });
  getAllDocs.mockImplementation((percorso) => {
    if (percorso.length === 1 && percorso[0] === "kits") {
      return Promise.resolve([{ id: "kit-vecchio" }]);
    }
    return Promise.resolve([]);
  });

  const risultato = await ripristinaBackup("bk1");

  expect(getDocAt).toHaveBeenCalledWith(["backups", "bk1", "dati", "kits"]);
  expect(deleteDocAt).toHaveBeenCalledWith(["kits", "kit-vecchio"]);
  expect(setDocAt).toHaveBeenCalledWith(["kits", "kit-4"], { numero: 4 });
  expect(risultato.kits).toBe(1);
  expect(risultato.gruppi_taglio).toBeUndefined();
});

test("eliminaBackup elimina tutti i documenti dati e il padre", async () => {
  await eliminaBackup("bk1");

  expect(deleteDocAt).toHaveBeenCalledTimes(COLLEZIONI_BACKUP.length + 1);
  expect(deleteDocAt).toHaveBeenCalledWith(["backups", "bk1"]);
  expect(deleteDocAt).toHaveBeenCalledWith(["backups", "bk1", "dati", "kits"]);
  expect(deleteDocAt).toHaveBeenCalledWith(["backups", "bk1", "dati", "rotazioni"]);
});
```

- [ ] **Step 2: Esegui i test e verifica che falliscano**

Run: `cd "C:\Users\Rube SAPR\Desktop\APP\sics-cuscini" && CI=true npx react-scripts test src/firebase/backup.test.js --watchAll=false`
Expected: FAIL — `Cannot find module './backup'` (o simile), nessun test passa.

- [ ] **Step 3: Scrivi `src/firebase/backup.js`**

```js
// ─────────────────────────────────────────────────────────────
// Backup e ripristino di tutte le collezioni Firestore dell'app.
// Un backup = 1 doc padre (backups/{id}: creatoIl, etichetta, conteggi)
// + 1 doc per collezione in backups/{id}/dati/{nomeCollezione}
// (split per restare sotto il limite 1MB/documento di Firestore).
// Il ripristino sostituisce interamente ogni collezione (mai un merge).
// Spec: docs/superpowers/specs/2026-09-02-backup-ripristino-design.md
// ─────────────────────────────────────────────────────────────
import { getAllDocs, getDocAt, setDocAt, deleteDocAt } from "./service";

export const COLLEZIONI_BACKUP = [
  "kits", "gruppi_taglio", "storico_revisioni", "storico_spostamenti",
  "storico_sostituzioni", "gt_revisioni", "gt_manutenzione", "gt_stati_componenti",
  "documenti", "revisioni_pianificate", "promemoria", "allegati_kit", "rotazioni",
];

function nuovoId() {
  return `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function creaBackup(etichetta) {
  const backupId = nuovoId();
  const conteggi = {};
  for (const nome of COLLEZIONI_BACKUP) {
    const documenti = await getAllDocs([nome]);
    conteggi[nome] = documenti.length;
    await setDocAt(["backups", backupId, "dati", nome], { nome, documenti });
  }
  await setDocAt(["backups", backupId], {
    creatoIl: new Date().toISOString(),
    etichetta,
    conteggi,
  });
  return backupId;
}

export async function listaBackup() {
  const padri = await getAllDocs(["backups"]);
  return padri.sort((a, b) => (b.creatoIl || "").localeCompare(a.creatoIl || ""));
}

export async function ripristinaBackup(backupId) {
  const risultato = {};
  for (const nome of COLLEZIONI_BACKUP) {
    const snapshot = await getDocAt(["backups", backupId, "dati", nome]);
    if (!snapshot) continue;
    const attuali = await getAllDocs([nome]);
    for (const d of attuali) await deleteDocAt([nome, d.id]);
    for (const { id, ...campi } of snapshot.documenti) await setDocAt([nome, id], campi);
    risultato[nome] = snapshot.documenti.length;
  }
  return risultato;
}

export async function eliminaBackup(backupId) {
  for (const nome of COLLEZIONI_BACKUP) {
    await deleteDocAt(["backups", backupId, "dati", nome]);
  }
  await deleteDocAt(["backups", backupId]);
}
```

- [ ] **Step 4: Esegui i test e verifica che passino**

Run: `cd "C:\Users\Rube SAPR\Desktop\APP\sics-cuscini" && CI=true npx react-scripts test src/firebase/backup.test.js --watchAll=false`
Expected: PASS — 5 test verdi.

- [ ] **Step 5: Esegui l'intera suite per escludere regressioni**

Run: `cd "C:\Users\Rube SAPR\Desktop\APP\sics-cuscini" && CI=true npx react-scripts test --watchAll=false`
Expected: tutti i test passano (quelli esistenti + i 5 nuovi).

- [ ] **Step 6: Commit**

```bash
git add src/firebase/backup.js src/firebase/backup.test.js
git commit -m "feat(backup): modulo creaBackup/listaBackup/ripristinaBackup/eliminaBackup"
```

---

### Task 3: Pagina admin `Backup.js` + collegamento rotta

**Files:**
- Create: `src/pages/Backup.js`
- Modify: `src/App.js` (import + route, non toccare `AdminLink`)
- Modify: `src/pages/Rinumerazione.js` (link di navigazione verso `/admin/backup`)

**Interfaces:**
- Consumes: `creaBackup`, `listaBackup`, `ripristinaBackup`, `eliminaBackup` da `../firebase/backup` (Task 2). Prop `reload` (funzione async, stessa già passata a `Rinumerazione`) per ricaricare lo stato globale dell'app dopo un ripristino.

Nessun test automatico per questa pagina: nessuna pagina React di questo repo ha un test dedicato (nessun `*.test.js` per componenti in `src/pages`); la verifica è manuale via dev server, come per le altre pagine admin.

- [ ] **Step 1: Crea `src/pages/Backup.js`**

```jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { creaBackup, listaBackup, ripristinaBackup, eliminaBackup } from "../firebase/backup";

function formatDataOra(iso) {
  if (!iso) return "N/D";
  const d = new Date(iso);
  if (isNaN(d)) return "N/D";
  return d.toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function totaleDocumenti(conteggi) {
  return Object.values(conteggi || {}).reduce((s, n) => s + (n || 0), 0);
}

export default function Backup({ reload }) {
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState("");
  const [lista, setLista] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function provaPw() {
    if (pw === "0577") setAuth(true);
    else alert("Password errata");
  }

  async function ricarica() {
    setLista(await listaBackup());
  }

  useEffect(() => { if (auth) ricarica(); }, [auth]);

  async function handleBackupOra() {
    setBusy(true); setMsg("");
    const id = await creaBackup("manuale");
    await ricarica();
    setBusy(false);
    setMsg(`Backup creato (${id}).`);
  }

  async function handleRipristina(b) {
    const testo = window.prompt(
      `Ripristinare il backup del ${formatDataOra(b.creatoIl)}? Tutti i dati creati dopo quel momento verranno persi.\n\nScrivi RIPRISTINA per confermare.`
    );
    if (testo !== "RIPRISTINA") return;
    setBusy(true); setMsg("");
    const risultato = await ripristinaBackup(b.id);
    setBusy(false);
    setMsg(`Ripristino completato: ${Object.values(risultato).reduce((s, n) => s + n, 0)} documenti riscritti.`);
    if (reload) await reload();
  }

  async function handleElimina(b) {
    if (!window.confirm(`Eliminare il backup del ${formatDataOra(b.creatoIl)}? Non elimina dati dell'app, solo questo backup.`)) return;
    setBusy(true);
    await eliminaBackup(b.id);
    await ricarica();
    setBusy(false);
  }

  if (!auth) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Area amministrazione</h1></div>
        <div className="card" style={{ maxWidth: 360 }}>
          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 10 }}>
            Inserisci la password per accedere a backup e ripristino.
          </p>
          <input type="password" value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") provaPw(); }}
            placeholder="Password" style={{ marginBottom: 10 }} />
          <button className="btn btn-primary" onClick={provaPw}>Entra</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Backup e ripristino</h1></div>
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: "var(--text2)" }}>
          Backup manuale di tutti i dati dell'app (kit cuscini, gruppi taglio, storici, documenti).
          Il ripristino sostituisce interamente il contenuto di ogni collezione con quello del backup scelto:
          i dati creati dopo quel backup vengono persi. I file caricati su Google Drive non sono inclusi.
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn btn-primary" onClick={handleBackupOra} disabled={busy}>Backup ora</button>
          <Link className="btn btn-secondary" to="/admin/rinumerazione">Rinumerazione seriali</Link>
        </div>
        {msg && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 8 }}>{msg}</div>}
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Backup salvati ({lista.length})</span></div>
        {!lista.length ? (
          <div style={{ padding: 16, color: "var(--text3)", fontSize: 13 }}>Nessun backup ancora creato.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {lista.map(b => (
              <div key={b.id} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12, padding: "8px 10px", background: "var(--bg3)", borderRadius: 8 }}>
                <span style={{ minWidth: 140 }}>{formatDataOra(b.creatoIl)}</span>
                <span style={{ color: "var(--text3)" }}>{b.etichetta}</span>
                <span style={{ flex: 1, color: "var(--text3)" }}>{totaleDocumenti(b.conteggi)} documenti</span>
                <button className="gtc-btn go" disabled={busy} onClick={() => handleRipristina(b)}>Ripristina</button>
                <button className="gtc-btn rev" disabled={busy} onClick={() => handleElimina(b)}>Elimina</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Aggiungi import e rotta in `src/App.js`**

Nella lista import in cima al file (vicino a `import Rinumerazione from "./pages/Rinumerazione";`, riga 14):

```js
import Backup from "./pages/Backup";
```

Nel blocco `{/* ADMIN */}` (riga 319-321), subito dopo la rotta di rinumerazione:

```jsx
<Route path="/admin/rinumerazione" element={<Rinumerazione reload={loadAll}/>}/>
<Route path="/admin/backup" element={<Backup reload={loadAll}/>}/>
```

Non modificare `AdminLink` (riga 338-344): resta invariato, l'icona ⚙ continua a portare a `/admin/rinumerazione`; da lì si raggiunge `/admin/backup` col nuovo link "Backup e ripristino" appena aggiunto in `Rinumerazione.js` (Step 3).

- [ ] **Step 3: Aggiungi link di navigazione in `src/pages/Rinumerazione.js`**

Aggiungi l'import in cima al file:

```js
import { Link } from "react-router-dom";
```

Nel blocco dei bottoni (dopo `<button className="btn btn-primary" onClick={applica} ...>Applica</button>`), aggiungi:

```jsx
<Link className="btn btn-secondary" to="/admin/backup">Backup e ripristino</Link>
```

- [ ] **Step 4: Verifica build**

Run: `cd "C:\Users\Rube SAPR\Desktop\APP\sics-cuscini" && CI=true npx react-scripts build`
Expected: `Compiled successfully.`, nessun warning ESLint su import non usati o simili.

- [ ] **Step 5: Verifica manuale in dev server**

Run: `cd "C:\Users\Rube SAPR\Desktop\APP\sics-cuscini" && npm start` (in background, poi apri `http://localhost:3000`)

Controlli da fare a mano nel browser:
1. Clicca l'icona ⚙ in alto → arrivi su `/admin/rinumerazione`, inserisci "0577".
2. Clicca "Backup e ripristino" → arrivi su `/admin/backup`, inserisci di nuovo "0577".
3. Clicca "Backup ora" → appare un messaggio "Backup creato (bk_...)" e la lista sotto mostra una riga con data/ora, "manuale" e il conteggio documenti totale (dovrebbe corrispondere al numero di kit + eventuali gruppi taglio/storici presenti).
4. Clicca "Ripristina" su quella riga, annulla il prompt (lascia vuoto o premi Annulla) → nessun cambiamento, nessun errore in console.
5. Clicca "Elimina" su quella riga, conferma → la riga sparisce dalla lista.
6. Torna su `/admin/rinumerazione` col link "Rinumerazione seriali" → pagina ancora funzionante come prima (nessuna regressione).

Ferma il dev server al termine.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Backup.js src/App.js src/pages/Rinumerazione.js
git commit -m "feat(backup): pagina admin backup e ripristino, collegata alla rinumerazione"
```

---

## Self-Review

- **Copertura spec:** Ambito dati (13 collezioni) → Task 1/2 costante `COLLEZIONI_BACKUP`. Modello dati padre+sottocollezione → `creaBackup`/`ripristinaBackup`. Modulo `backup.js` con le 4 funzioni → Task 2. UI `/admin/backup` con password, lista, backup ora, ripristina con conferma testuale, elimina → Task 3. Limiti dichiarati in UI (sostituzione non merge, niente Drive) → testo descrittivo in `Backup.js`. Nessun gap rilevato.
- **Placeholder:** nessun TBD/TODO; ogni step ha codice concreto.
- **Coerenza tipi:** `percorso: string[]` usato in modo identico in Task 1 e Task 2; `COLLEZIONI_BACKUP` stessa costante letterale in test e implementazione; `conteggi`/`creatoIl`/`etichetta` stessi nomi campo tra `backup.js` e `Backup.js`.
