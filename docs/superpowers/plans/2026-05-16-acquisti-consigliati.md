# Acquisti Consigliati — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere la pagina `/acquisti` con la lista dei kit cuscini e gruppi taglio da acquistare (trigger: `fuori_uso` o ≥ 10 anni), accessibile dalla navbar con badge numerico.

**Architecture:** `AcquistiPage` è un componente puro che riceve `kits` e `gruppiTaglio` come props da App.js (già in stato, nessun nuovo listener Firestore). Il badge `acquistiTotali` viene calcolato inline in App.js accanto all'esistente `daFareTotali`, e passato come `badge` alla voce "Acquisti" in entrambi i nav array.

**Tech Stack:** React 18, React Router v6, CSS custom properties neumorfismo (App.css esistente)

---

## File Map

| File | Azione | Responsabilità |
|------|--------|----------------|
| `src/pages/AcquistiPage.js` | Crea | Pagina `/acquisti`: filtra e visualizza kit da acquistare |
| `src/App.js` | Modifica | Import, badge, nav voci, route |

---

### Task 1: Crea AcquistiPage.js

**Files:**
- Create: `src/pages/AcquistiPage.js`

- [ ] **Step 1: Crea il file con il componente completo**

```jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function AcquistiPage({ kits, gruppiTaglio }) {
  const navigate = useNavigate();
  const anno = new Date().getFullYear();

  const cusciniDaAcquistare = kits.filter(
    k => k.stato === "fuori_uso" || (k.annoAcquisto && anno - k.annoAcquisto >= 10)
  );
  const taglioDaAcquistare = gruppiTaglio.filter(
    g => g.stato === "fuori_uso" || (g.annoAcquisto && anno - g.annoAcquisto >= 10)
  );

  const totale = cusciniDaAcquistare.length + taglioDaAcquistare.length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          Acquisti necessari{totale > 0 ? ` (${totale})` : ""}
        </h1>
      </div>

      {totale === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:40, color:"var(--text3)", fontSize:14 }}>
          Nessun acquisto necessario al momento.
        </div>
      ) : (
        <>
          {cusciniDaAcquistare.length > 0 && (
            <section style={{ marginBottom:24 }}>
              <div style={{
                fontSize:11, fontWeight:900, textTransform:"uppercase",
                letterSpacing:".08em", color:"var(--cuscini)",
                borderBottom:"2px solid var(--cuscini)",
                paddingBottom:6, marginBottom:12,
              }}>
                Cuscini — da acquistare ({cusciniDaAcquistare.length})
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {cusciniDaAcquistare.map(k => {
                  const isFuoriUso = k.stato === "fuori_uso";
                  const anni = k.annoAcquisto ? anno - k.annoAcquisto : null;
                  return (
                    <div key={k.id} className="card" style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:800, textTransform:"uppercase", color:"var(--text)" }}>
                            Kit {k.numero} — {k.mezzo}
                          </div>
                          <div style={{ fontSize:11, color:"var(--text2)", marginTop:2 }}>
                            {k.dislocazione}{k.bar ? ` · ${k.bar} bar` : ""}
                          </div>
                          <div style={{
                            fontSize:11, fontWeight:700, marginTop:6,
                            color: isFuoriUso ? "var(--red)" : "var(--taglio)",
                          }}>
                            {isFuoriUso ? "Fuori uso" : `${anni} anni di servizio`}
                          </div>
                        </div>
                        <span className="pill fuori_uso" style={isFuoriUso ? {} : { color:"var(--taglio)" }}>
                          {isFuoriUso ? "Fuori uso" : `${anni} anni`}
                        </span>
                      </div>
                      <div style={{ marginTop:10 }}>
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize:11, padding:"5px 12px" }}
                          onClick={() => navigate(`/kit/${k.id}`)}
                        >
                          Dettaglio
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {taglioDaAcquistare.length > 0 && (
            <section style={{ marginBottom:24 }}>
              <div style={{
                fontSize:11, fontWeight:900, textTransform:"uppercase",
                letterSpacing:".08em", color:"var(--taglio)",
                borderBottom:"2px solid var(--taglio)",
                paddingBottom:6, marginBottom:12,
              }}>
                Taglio — da acquistare ({taglioDaAcquistare.length})
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {taglioDaAcquistare.map(g => {
                  const isFuoriUso = g.stato === "fuori_uso";
                  const anni = g.annoAcquisto ? anno - g.annoAcquisto : null;
                  return (
                    <div key={g.id} className="card" style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:800, textTransform:"uppercase", color:"var(--text)" }}>
                            GT {g.numero} — {g.nome}
                          </div>
                          <div style={{ fontSize:11, color:"var(--text2)", marginTop:2 }}>
                            {g.dislocazione}{g.sistema ? ` · ${g.sistema}` : ""}
                          </div>
                          <div style={{
                            fontSize:11, fontWeight:700, marginTop:6,
                            color: isFuoriUso ? "var(--red)" : "var(--taglio)",
                          }}>
                            {isFuoriUso ? "Fuori uso" : `${anni} anni di servizio`}
                          </div>
                        </div>
                        <span className="pill fuori_uso" style={isFuoriUso ? {} : { color:"var(--taglio)" }}>
                          {isFuoriUso ? "Fuori uso" : `${anni} anni`}
                        </span>
                      </div>
                      <div style={{ marginTop:10 }}>
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize:11, padding:"5px 12px" }}
                          onClick={() => navigate(`/gruppi-taglio/${g.id}`)}
                        >
                          Dettaglio
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verifica che il file sia stato creato correttamente**

```bash
# Windows PowerShell
Test-Path src/pages/AcquistiPage.js
# Expected: True
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/AcquistiPage.js
git commit -m "feat: add AcquistiPage component"
```

---

### Task 2: Integra AcquistiPage in App.js

**Files:**
- Modify: `src/App.js`

Context: App.js gestisce stato `kits` e `gruppiTaglio`, calcola badge inline, definisce array `navCuscini`/`navTaglio`, e contiene il `<Routes>` principale. Vanno fatte 5 modifiche puntuali.

- [ ] **Step 1: Aggiungi import di AcquistiPage**

Trova la riga (circa linea 20):
```js
import AdminReset from "./pages/AdminReset";
```
Aggiungi subito dopo:
```js
import AcquistiPage from "./pages/AcquistiPage";
```

- [ ] **Step 2: Aggiungi calcolo acquistiTotali**

Trova il blocco (circa linee 194–198):
```js
  const daFareTotali = [
    ...kits.filter(k => ["scaduto","critico"].includes(calcolaStato(k))),
    ...gruppiTaglio.filter(g => ["scaduto","critico"].includes(calcolaStatoGT(g))),
    ...kits.filter(k => k.stato === "in_revisione" && k.dataRientroStimata && (giorniAllaScadenza(k.dataRientroStimata)??0) < 0),
  ].length;
```
Aggiungi subito dopo:
```js
  const annoCorrente = new Date().getFullYear();
  const acquistiTotali = [
    ...kits.filter(k => k.stato === "fuori_uso" || (k.annoAcquisto && annoCorrente - k.annoAcquisto >= 10)),
    ...gruppiTaglio.filter(g => g.stato === "fuori_uso" || (g.annoAcquisto && annoCorrente - g.annoAcquisto >= 10)),
  ].length;
```

- [ ] **Step 3: Aggiungi voce "Acquisti" a navCuscini**

Trova (circa linee 201–207):
```js
  const navCuscini = [
    { to:"/",          label:"Stato",      end:true },
    { to:"/da-fare",   label:"Da fare",    badge: daFareTotali },
    { to:"/kit",       label:"Kit" },
    { to:"/mezzi",     label:"Mezzi" },
    { to:"/archivio",  label:"Archivio" },
  ];
```
Sostituisci con:
```js
  const navCuscini = [
    { to:"/",          label:"Stato",      end:true },
    { to:"/da-fare",   label:"Da fare",    badge: daFareTotali },
    { to:"/kit",       label:"Kit" },
    { to:"/mezzi",     label:"Mezzi" },
    { to:"/archivio",  label:"Archivio" },
    { to:"/acquisti",  label:"Acquisti",   badge: acquistiTotali },
  ];
```

- [ ] **Step 4: Aggiungi voce "Acquisti" a navTaglio**

Trova (circa linee 208–214):
```js
  const navTaglio = [
    { to:"/",          label:"Stato",      end:true },
    { to:"/da-fare",   label:"Da fare",    badge: daFareTotali },
    { to:"/gruppi-taglio", label:"Kit" },
    { to:"/mezzi-taglio",  label:"Mezzi" },
    { to:"/archivio",  label:"Archivio" },
  ];
```
Sostituisci con:
```js
  const navTaglio = [
    { to:"/",          label:"Stato",      end:true },
    { to:"/da-fare",   label:"Da fare",    badge: daFareTotali },
    { to:"/gruppi-taglio", label:"Kit" },
    { to:"/mezzi-taglio",  label:"Mezzi" },
    { to:"/archivio",  label:"Archivio" },
    { to:"/acquisti",  label:"Acquisti",   badge: acquistiTotali },
  ];
```

- [ ] **Step 5: Aggiungi la Route /acquisti**

Trova (circa linea 332):
```jsx
              <Route path="/admin-reset" element={<AdminReset/>}/>
```
Aggiungi subito dopo:
```jsx
              <Route path="/acquisti" element={<AcquistiPage kits={kits} gruppiTaglio={gruppiTaglio}/>}/>
```

- [ ] **Step 6: Verifica che l'app compili senza errori**

```bash
# Windows PowerShell — nella directory del progetto
npm run build 2>&1 | Select-String -Pattern "error|warning|compiled" -CaseSensitive:$false
```
Expected: `Compiled successfully.` o solo warning minori (non errori).

Se ci sono errori di sintassi, controllare che le 5 modifiche siano state applicate correttamente (import, acquistiTotali, navCuscini, navTaglio, Route).

- [ ] **Step 7: Testa manualmente nel browser**

Avvia l'app:
```bash
npm start
```

Checklist visiva:
1. La navbar mostra la voce "Acquisti" in coda
2. Il badge numerico appare se ci sono kit fuori uso o con ≥ 10 anni
3. Navigare a `/acquisti` mostra la pagina con le due sezioni (Cuscini / Taglio)
4. Ogni card mostra: nome kit, mezzo, sede, motivo colorato, pill, bottone "Dettaglio"
5. Il bottone "Dettaglio" naviga correttamente a `/kit/:id` o `/gruppi-taglio/:id`
6. Se nessun kit soddisfa i criteri, la pagina mostra "Nessun acquisto necessario al momento."
7. Funziona sia in modalità Cuscini che Taglio (il badge è presente in entrambi i sistemi)
8. Dark mode: la pagina rispetta il tema scuro

- [ ] **Step 8: Commit**

```bash
git add src/App.js
git commit -m "feat: wire AcquistiPage into nav and router"
```
