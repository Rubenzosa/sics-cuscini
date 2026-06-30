# Redesign SICS 78 — Pagina KIT unica + Calendario

Data: 2026-06-30
Stato: in revisione

## Obiettivo

Semplificare la navigazione dell'app rendendola più intuibile, mantenendo lo **stile visivo attuale** (neumorfismo, palette indigo `--cuscini #5c6bc0` / ambra `--taglio #f9a825`, logo `public/logo78.png`, zero emoji, icone solo minimal). Cambia la **logica/struttura**, non la grafica.

Il redesign va applicato a **entrambe le app** che oggi esistono e condividono lo stesso Firestore:
1. **App React** — repo `src/` (StatoGiorno, KitList, KitDetail, Calendario...).
2. **Dashboard del foglio** — `script/sidebar.html`, Apps Script collegato al Google Sheet, aperto da "SICS — VVF Siena → Apri Dashboard".

Le due devono avere lo **stesso layout nuovo**.

## Riferimento visivo

Mockup approvato: `mockup-preview.html` (root del repo). Riproduce fedelmente lo stile attuale con la nuova logica. Funge da riferimento per l'implementazione.

## Struttura nuova: una pagina, due viste

Spariscono le tab separate (Stato / Da fare / Kit / Mezzi / Archivio / Acquisti come navbar primaria). Restano:

- **Topbar** invariata: logo png, "SICS — VVF Siena", selettore **Cuscini / Taglio**, badge "N CRITICI", toggle tema chiaro/scuro.
- **Banda colore sistema** (gradiente indigo o ambra).
- **Toggle vista**: `KIT` | `Calendario`.

Il selettore Cuscini/Taglio agisce sulla **vista KIT**. La vista Calendario è unica con **toggle interno** (Tutti / Cuscini / Taglio).

### Vista KIT

- **4 statistiche** in alto: Operativi, In scadenza, Scaduti, Magazzino.
- **Suggerimento scorta (inventario)**: deve esistere almeno **un kit di scorta in magazzino per sistema** (cuscini e taglio). Regola: conta gli item con `stato === "magazzino"` per il sistema attivo; se `0`, mostra un **banner suggerimento acquisto** (es. "Nessun cuscino di scorta in magazzino — valuta un acquisto"). È solo un **suggerimento non bloccante**, dismissibile, non un'azione obbligata. Si aggancia alla stat "Magazzino" (quando è 0 per il sistema attivo). Sostituisce la vecchia tab Acquisti con un semplice avviso.
- **Barra ricerca** (numero, matricola Lucca, mezzo, modello) — riusa la logica di `cercaGlobale` / filtro `KitList`.
- **Lista KIT accordion**. Ogni riga (chiusa):
  - Numero kit grande (indigo), nome, mezzo (monospace), `bar · dislocazione`.
  - **Ring** giorni alla scadenza (componente esistente in `KitList.js`).
  - **Pill** stato (scaduto/critico/attenzione/buono/regolare).
  - Caret accordion (triangolo CSS).
- Riga **espansa** (inline, niente cambio pagina):
  - Campi: Mezzo, Ultima revisione, Prossima scadenza (`dataRevisione`), Stato.
  - **Seriali componenti**: per ogni componente tipo, modello, chip matricola Lucca (monospace blu), pallino stato.
  - Azioni: Storico, Sposta, Revisiona.
- I bordi-stato (sinistra) e i colori riusano `calcolaStato` / `statoLabel` / `formatData` / `giorniAllaScadenza` da `utils`.

I gruppi taglio usano `calcolaStatoGT` e `prossimaRevisioneGT`; per la vista KIT in modalità Taglio la riga mostra i campi equivalenti (sistema, marca, prossima revisione dai componenti).

### Vista Calendario

Stile Google Calendar, mese navigabile. Riusa e estende `pages/Calendario.js`.

- Griglia mensile (Lun–Dom), cella = giorno con chip eventi.
- **Colore evento per sistema**: cuscini = indigo, taglio = ambra.
- **Bordo/anello rosso** sull'evento se stato scaduto/critico.
- Legenda: Cuscini, Taglio, Scaduto/critico.
- Click su giorno → dettaglio sotto con lista eventi (etichetta sistema colorata, nome, tipo evento).
- Navigazione mese ‹ ›.

**Tipi di evento mostrati** (tutti):
1. **Scadenze revisione** — automatiche da `kits.dataRevisione` e dai componenti dei gruppi taglio.
2. **Revisioni pianificate** — collezione Firestore `revisioni_pianificate` (già esistente, vedi `getAllRevisioniPianificate`).
3. **Manutenzioni taglio** — `gt_manutenzione` (olio/candela).
4. **Note / promemoria** — eventi liberi su una data. **Nuova feature**: richiede una nuova collezione Firestore (es. `promemoria`) con CRUD minimo, e i metodi paralleli nell'Apps Script per la Dashboard.

## Rinumerazione seriali matricola Lucca (solo CUSCINI)

Spec sorgente: `numerazione.md`. Si applica **solo ai cuscini**, NON ai gruppi taglio.

Formato codice: `[CAT][BAR]SI[INDICE]` con categorie CS, CN, RP, TB, RV. Il numero in mezzo è il **bar/pressione** (8/10/12) e si **preserva** dal record. Formato stringa attuale mantenuto (con spazi, es. `"CS 8 SI 1"`); cambia **solo l'indice** dopo `SI`.

**Criterio (chiarito dall'appendice di numerazione.md):** l'indice è un contatore **GLOBALE per categoria, continuo su tutti i bar**. Si scorrono i record nell'ordine di apparizione del DB; per ogni categoria si assegna 1,2,3… senza salti, indipendentemente dal bar. Es: `CS8SI12→CS8SI13` (CS #13) poi `CS12SI1→CS12SI14` (CS #14) — il contatore CS prosegue anche se il bar cambia da 8 a 12; il bar resta.

- **Modulo unico testabile** (`src/numerazione.js`): funzioni pure:
  - `parseMatricolaLucca`, `formatMatricolaLucca`, `categoriaDaTipo`, `categoriaDaCodice`.
  - `rinumeraSeriali(codici: string[]): string[]` — input lista ordinata di vecchi codici, output nuovi codici. È la funzione testata col dataset golden.
  - `rinumeraCuscini(kits)` — appiattisce i componenti in ordine kit→array, applica `rinumeraSeriali`, rimappa, imposta `vecchio_codice`, ritorna `{kits, mappa}`.
  - `suggerisciIndice(kits, categoria)`, `suggerisciMatricola(kits, tipo, bar)`.
- **Rinumerazione (migrazione)**: scorre i record nell'ordine di `getAllKits()` (NON riordinare per numero/id — l'ordine reale del DB è ciò che valida l'appendice) e componenti in ordine d'array. Salva `vecchio_codice` (solo se assente). **Idempotente** (riassegna 1,2,3 nello stesso ordine stabile → stesso risultato).
- **Suggerimento nuovo seriale**: indice = max indice in uso nella categoria (su tutti i bar) + 1; modificabile a mano. Sostituisce `PROSSIMI_SERIALI` e `calcolaMatricolaLucca` in `KitForm.js:16-39` (che scopano per CAT_bar). Si aggancia a `KitForm`.
- **Dataset golden** = l'appendice "mappatura completa vecchio→nuovo" in `numerazione.md`. Test TDD: dai vecchi codici dell'appendice nell'ordine indicato, `rinumeraSeriali` deve produrre esattamente i nuovi codici. Più: categoria vuota → indice 1; duplicati (`SI 0` ripetuti) distinti per ordine di apparizione; idempotenza.
- **Sicurezza migrazione**: azione admin con **anteprima/dry-run** (mostra kit + componente + vecchio → nuovo) da **validare contro l'appendice** prima di applicare. L'ordine conta: se l'anteprima non coincide con l'appendice, NON applicare e rivedere l'ordine dei record.

I gruppi taglio mantengono la loro numerazione attuale invariata.

## Pulizia codice morto

Eliminare le pagine/componenti resi inutili dal redesign (le tab eliminate), **come parte dell'implementazione del redesign** (dopo che KIT+Calendario le sostituiscono, non prima — altrimenti si rompono le rotte):

- Candidati rimozione: `pages/DaFare.js`, `pages/KanbanMezzi.js`, `pages/KanbanMezziTaglio.js`, `pages/Rotazioni.js`, `pages/AcquistiPage.js`, `pages/Scadenze.js`, `pages/StatoGiorno.js`, `StoricoHub` (inline in `App.js`), + rotte e import relativi, + `PROSSIMI_SERIALI` se non più usato.
- **Tenere**: `AdminReset.js` (utility admin), `KitForm.js`, `Documenti.js`, le pagine gruppi taglio (riadattate per la vista KIT taglio), `Calendario.js` (riadattato).
- Verificare con ricerca import che ogni file rimosso non sia referenziato altrove prima di cancellarlo.

## Architettura dati (invariata)

Firestore resta sorgente verità. Collezioni: `kits`, `gruppi_taglio`, `storico_revisioni`, `storico_spostamenti`, `gt_revisioni`, `gt_manutenzione`, `documenti`, `revisioni_pianificate`, + nuova `promemoria`.

- App React legge/scrive via SDK firebase (`src/firebase/service.js`).
- Dashboard sidebar legge/scrive via Firestore REST (`script/Code.gs`), stessa API key.
- I tab del foglio ("KIT Cuscini" ecc.) restano output mirror generati da `sincronizza*` (Firestore → foglio), non toccati da questo redesign.

Il "sync col foglio" non richiede nuovo lavoro lato dati: funziona già a livello Firestore. Nessun cambiamento di direzione del sync.

## Componenti / isolamento

Lato React, estrarre componenti riusabili così che KIT e Calendario siano testabili in isolamento:

- `KitAccordion` (riga + corpo espandibile) — input: kit, stato calcolato; nessuna dipendenza dal routing.
- `Ring` — già presente, da spostare in componente condiviso.
- `CalendarMonth` — griglia mese + eventi; input: lista eventi normalizzati `{data, sistema, tipo, nome, stato, onClick}`.
- `useEventiCalendario(kits, gruppi, pianificate, manutenzioni, promemoria)` — hook che normalizza tutte le sorgenti in un'unica lista eventi.
- `StatBar` — le 4 statistiche.

Lato sidebar.html, replicare le stesse viste in vanilla JS mantenendo le funzioni `google.script.run` esistenti.

## Fasi (proposta)

1. **React — vista KIT** accordion su una pagina, con stat + ricerca + banner scorta magazzino. Rotte vecchie (mezzi, da-fare, acquisti, archivio, rotazioni) rimosse o redirette a `/`.
2. **React — vista Calendario** per sistema + tipi evento 1–3.
3. **React — Note/promemoria** (collezione nuova + CRUD).
4. **Sidebar.html — port** delle stesse viste.
5. **Apps Script** — metodi promemoria per la Dashboard.

## Decisioni (chiuse 2026-06-30)

- **Scope calendario**: vista unica con **toggle interno** Tutti / Cuscini / Taglio.
- **Tab vecchie**: Mezzi (kanban), Da fare, Acquisti, Archivio/Rotazioni → **eliminate**. Restano solo KIT + Calendario. Le rotte relative vengono rimosse o rediratte a `/`.
- **Stat KIT**: confermate le 4 metriche (Operativi / In scadenza / Scaduti / Magazzino).
- **Inventario scorta**: suggerimento acquisto non bloccante quando manca scorta in magazzino (vedi Vista KIT).
