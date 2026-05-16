# Acquisti Consigliati — Design Spec

## Goal

Aggiungere una pagina dedicata "Acquisti" che mostra i kit cuscini e i gruppi da taglio raccomandati per l'acquisto, con navigazione diretta alla scheda dettaglio di ciascun kit.

---

## Trigger di raccomandazione

Un kit o gruppo da taglio entra nella lista "da acquistare" se soddisfa **almeno una** delle condizioni:

1. `stato === "fuori_uso"`
2. `new Date().getFullYear() - annoAcquisto >= 10`

Il controllo è client-side, calcolato al momento del rendering. Nessuna scrittura su Firestore.

---

## Architettura

### Nuovi file

- **`src/pages/AcquistiPage.js`** — unico nuovo componente. Contiene:
  - Due `onSnapshot` listener (uno per `kits`, uno per `gruppi_taglio`)
  - Logica di filtraggio locale
  - Rendering delle due sezioni (Cuscini / Taglio)

### File modificati

- **`src/App.js`** — tre modifiche:
  1. Import `AcquistiPage`
  2. Aggiunta `<Route path="/acquisti" element={<AcquistiPage />} />` nel router
  3. Aggiunta voce "Acquisti" in `navCuscini` e `navTaglio` con badge dinamico

### Nessun nuovo CSS

Tutte le classi necessarie esistono già: `.card`, `.pill`, `.btn-secondary`, `.sec-title`. Il testo colorato per il motivo usa `style={{ color: "var(--red)" }}` o `style={{ color: "var(--taglio)" }}` inline — nessuna nuova classe richiesta.

---

## Struttura pagina `/acquisti`

```
┌─────────────────────────────────────┐
│  CUSCINI — DA ACQUISTARE (N)        │  ← header blu, nascosto se N=0
│  ┌──────────────────────────────┐   │
│  │ KIT 3 — APS 7                │   │
│  │ Sede Centrale · 8 bar        │   │  pill "Fuori uso" (rosso)
│  │ Fuori uso                    │   │
│  │ [Dettaglio]                  │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │ KIT 9 — ABP 4                │   │
│  │ Poggibonsi · 10 bar          │   │  pill "11 anni" (ambra)
│  │ 11 anni di servizio          │   │
│  │ [Dettaglio]                  │   │
│  └──────────────────────────────┘   │
│                                     │
│  TAGLIO — DA ACQUISTARE (M)         │  ← header ambra, nascosto se M=0
│  ┌──────────────────────────────┐   │
│  │ GT POLIDO — APS 120          │   │
│  │ Sede Centrale                │   │  pill "Fuori uso" (rosso)
│  │ Fuori uso                    │   │
│  │ [Dettaglio]                  │   │
│  └──────────────────────────────┘   │
│                                     │
│  [stato vuoto se entrambe N=0=M]    │
└─────────────────────────────────────┘
```

---

## Card — dettaglio campi

| Campo | Fonte | Visualizzazione |
|-------|-------|-----------------|
| Nome kit | `kit.numero + " — " + kit.mezzo` | Bold uppercase |
| Sotto-titolo Cuscini | `kit.dislocazione + " · " + kit.bar + " bar"` | Testo secondario |
| Sotto-titolo Taglio | `gt.dislocazione` + eventuale sistema | Testo secondario |
| Pill | "Fuori uso" (rosso) o `X anni` (ambra) | `.pill` esistente |
| Motivo | "Fuori uso" o `X anni di servizio` | Testo colorato (var(--red) / var(--taglio)) |
| Bottone | "Dettaglio" → `/kit/:id` o `/gruppi-taglio/:id` | `.btn-secondary` small |

Per kit con entrambe le condizioni (fuori uso E vecchio), priorità a "Fuori uso" (più urgente).

---

## Navbar integration

### Badge
Il badge numerico sulla voce "Acquisti" mostra il totale `N + M`. Visibile solo se > 0. Usa la stessa classe `.badge` già presente su "Da fare".

### Calcolo badge in App.js
Il conteggio viene calcolato nello stesso `useEffect`/`onSnapshot` che già alimenta `daFareTotali`, oppure in un `useEffect` separato dedicato. Il conteggio viene passato come `badge` nella definizione nav.

### Voce navbar
```javascript
{ to: "/acquisti", label: "Acquisti", badge: acquistiTotali }
```
Aggiunta in coda sia a `navCuscini` che a `navTaglio`.

---

## Stato vuoto

Se `N === 0 && M === 0`:
```
Nessun acquisto necessario al momento.
```
Card neumorfismo centrata, testo secondario. Niente emoji.

---

## Stile

- Nessun emoji, nessuna icona carrello
- Header sezione: testo uppercase bold, bordo inferiore colorato (pattern esistente `.sec-title`)
- Pill: classe `.pill` esistente, color solo via variabile CSS (`--red`, `--taglio`)
- Bottone "Dettaglio": `.btn-secondary` con padding ridotto, o classe ghost inline
- Motivo: `style={{ color: "var(--red)" }}` o `style={{ color: "var(--taglio)" }}` inline

---

## Dati — query Firestore

Entrambe le query usano `onSnapshot` per aggiornamento real-time (coerente con il resto dell'app).

```javascript
// kits
onSnapshot(collection(db, "kits"), snap => {
  const anno = new Date().getFullYear();
  const lista = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(k => k.stato === "fuori_uso" || (anno - k.annoAcquisto) >= 10);
  setCusciniDaAcquistare(lista);
});

// gruppi_taglio
onSnapshot(collection(db, "gruppi_taglio"), snap => {
  const anno = new Date().getFullYear();
  const lista = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(g => g.stato === "fuori_uso" || (anno - g.annoAcquisto) >= 10);
  setTaglioDaAcquistare(lista);
});
```

---

## Routing

In `App.js`, dentro il `<Routes>` esistente:

```jsx
<Route path="/acquisti" element={<AcquistiPage />} />
```

---

## Fuori scope

- Nessun bottone "Acquisito" / tracking acquisti (card design B scelto: info + link dettaglio, no stato acquisto)
- Nessuna notifica push
- Nessun export PDF
- Nessuna paginazione (liste tipicamente brevi)
