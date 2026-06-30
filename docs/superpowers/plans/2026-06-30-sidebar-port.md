# Port Dashboard del foglio (sidebar.html) al nuovo layout — Plan

> Esecuzione inline. La Dashboard vive dentro il Google Sheet (Apps Script bound); verifica manuale dopo deploy del contenuto di `script/` sul foglio.

**Goal:** Allineare la Dashboard (`script/sidebar.html`) al redesign React: navbar a due viste **KIT | Calendario**, vista KIT accordion per il sistema attivo (stats + scorta + ricerca), vista Calendario con eventi colorati per sistema e promemoria. Tab Dashboard/Mezzi/Scadenze rimosse dalla navbar. Detail kit/gt (revisione, spostamenti, manutenzioni, documenti) mantenuti e raggiungibili dall'accordion.

**Constraints:**
- Stile esistente del sidebar (variabili CSS proprie, navy/orange). No emoji decorative nuove.
- Colori calendario per sistema: cuscini `#5c6bc0`, taglio `#f9a825`; anello rosso se scaduto/critico.
- Dati via `google.script.run` → Apps Script (`Code.gs`) → Firestore REST. Stessa collezione `promemoria` del lato React.

## Task 1 — Code.gs: manutenzioni globali + CRUD promemoria
- `getAllManutenzioniGT()` → `firestoreGet("gt_manutenzione")`.
- `getAllPromemoria()` → `firestoreGet("promemoria")`.
- `salvaPromemoria(p)` → `firestorePost("promemoria", p)`.
- `deletePromemoria(id)` → DELETE REST su `promemoria/{id}`.

## Task 2 — sidebar.html
- Stato: aggiungere `openId`, `calAnno`, `calMese`, `calGiorno`, `promemoria`, `manutAll`.
- `carica()`: caricare anche promemoria + tutte le manutenzioni.
- `renderNavbar()` → toggle **KIT | Calendario**.
- `render()` dispatch → `kit`/`gt` usano `renderKitView()`; nuova `calendario` → `renderCalendario()`.
- `renderKitView()`: stats(4) + banner scorta + ricerca + accordion (numero, nome, mezzo, ring, pill; espanso: campi + componenti + bottoni Dettaglio/Revisiona). Cuscini o taglio secondo `S.sistema`.
- `renderCalendario()`: griglia mese, dot per sistema (anello rosso scaduto/critico), navigazione mese, popup giorno con eventi + aggiungi/elimina promemoria.
- Default `S.view="kit"`.

**Verifica:** deploy su foglio → aprire Dashboard → toggle KIT/Calendario, accordion, promemoria.
