# App più intuitiva e snella — design

Data: 2026-10-20 · Bozze approvate: `.superpowers/brainstorm/1283-1792503420/content/`
(`home-mostra-per.html`, `kit-dettaglio.html`, `taglio-dettaglio.html`, stile da `stile-grafico.html` opzione 3)

## Perché

Chi apre l'app la prima volta fatica a orientarsi, e anche l'autore "tende a perdersi" cercando
info su un attrezzo. Problemi rilevati nel codice:

- il selettore Cuscini/Taglio è un paio di pulsantini nella topbar, poco evidente;
- la home impila titolo, 3 pulsanti, 4 riquadri statistiche, banner scorta, ricerca, lista: la cosa
  importante (cosa richiede attenzione) non spicca;
- il numero kit non si associa a colpo d'occhio al mezzo (targa piccola in sottotitolo);
- la pagina kit ha 6 tab (cuscini) / 5 (taglio), tre delle quali sono storici separati;
- icone ⚙ e ☾ senza etichetta.

## Obiettivi

1. Distinzione **Cuscini / Taglio chiara** dall'apertura.
2. In home, **prima cosa visibile: cosa sta per scadere / è fermo**, poi l'elenco kit.
3. **Numero kit sempre accoppiato alla targa** (cartellino "targa").
4. Pagina kit più snella: **stato e scadenza in cima, poi componenti con matricole**.
5. Nessuna informazione esistente persa: cambia solo dove sta.

## Non-obiettivi

- Manutenzioni taglio in "Da fare": rinviate (servono cadenze; vedi memoria
  `manutenzioni-taglio-scadenze`). Restano solo registro.
- Pannelli personalizzabili dall'utente: scartati (niente login → preferenze per dispositivo,
  e un utente nuovo non sa cosa scegliere). Sostituiti da viste fisse "Mostra per".
- Ricerca globale cross-sistema: non richiesta (le matricole raramente si cercano a memoria).
- Calendario, form inserimento/modifica, pagine admin: fuori scope (solo eventuale ereditarietà
  dello stile tramite CSS condiviso).
- Nessuna modifica ai dati Firestore, alla logica di calcolo stati/scadenze, all'export.

## Anti-obiettivi

- Perdere funzioni oggi raggiungibili (foto componente, fuori uso, sostituisci, vecchio codice,
  sposta kit, documenti, elimina, ripristina/elimina fuori uso, export CSV/PDF).
- Testo che va a capo nelle righe delle liste (regola esistente: troncare).
- Emoji o look da template; abbandonare lo stile neumorfico.
- Rompere tema scuro o vista da telefono.

## Stile

Neumorfico attuale (variabili `--bg`, `--neu-out`, `--neu-in` in `App.css`), opzione 3 "targa in
evidenza":

- **Cartellino targa**: riquadro bianco con bordo scuro; fascia superiore scura con "KIT n",
  sotto la targa (`kit.mezzo`) in monospace. Kit in magazzino: bordo/fascia grigi.
  Usato in home ("Da fare" ed elenco) e in testa alla pagina kit (versione grande).
- Righe come card con ombra `--neu-out`; chip di stato colorati (rosso scaduto, ambra
  attenzione, verde OK) già esistenti (`reg-chip`/toni).
- Colore sistema: cuscini `--cuscini` (blu), taglio `--taglio` (giallo) sull'elemento attivo.
- Deve funzionare in `[data-theme="dark"]`: il cartellino resta leggibile (definire le sue
  varianti dark).

## Home (`KitView` + topbar in `App.js`)

Dall'alto:

1. **Topbar**: logo + "SICS — VVF Siena"; a destra pulsanti con etichetta testuale
   **Calendario**, **Tema**, **Admin** (oggi "Calendario" è nella navbar sotto, ☾ e ⚙ senza testo).
   La navbar KIT/Calendario separata sparisce (Calendario sale in topbar; "home" = clic sul logo
   o sul sistema). Il badge "N CRITICI" in topbar viene sostituito dai contatori sull'interruttore.
2. **Interruttore Cuscini | Taglio**: due pulsanti larghi a tutta riga; l'attivo pieno nel colore
   del sistema. Ognuno ha un pallino rosso col numero di voci "Da fare" di quel sistema (nascosto
   se 0). Sostituisce `.sistema-selector` in topbar.
3. **Riga statistiche sottile**: "N operativi · N in scadenza · N scaduti · N in magazzino"
   (stessi valori di `contaStats`), a destra menu **Esporta ▾** (CSV, PDF) e **+ Nuovo kit/gruppo**.
4. Banner scorta mancante: invariato nel contenuto, sotto le statistiche.
5. **Da fare (N)**: una riga per problema, ordinate per urgenza:
   revisione scaduta → componenti fermi → revisione in scadenza (stati "critico"/"attenzione"
   di `calcolaStato`/`calcolaStatoGT`).
   - Cuscini: revisione scaduta/in scadenza; componenti `fuoriUso` (`componentiFuoriUso`).
   - Taglio: revisione scaduta/in scadenza; componenti in revisione/fuori servizio
     (`componentiNonOperativiGT`).
   - Riga: cartellino + titolo ("Revisione scaduta", "1 componente fuori uso", "1 componente in
     revisione") + sottotitolo (tipo mezzo · dettaglio, es. matricola del componente) + chip.
   - Un kit con più problemi = più righe. Clic → pagina dettaglio del kit.
   - Se vuoto: "Niente da fare — tutto in regola".
   - Esclusi i kit `stato === "fuori_uso"` (dismessi).
6. **Tutti i kit (N)** con selettore **Mostra per: Scadenza | Targa | Matricola**
   (default **Scadenza**), poi ricerca (stessi campi di oggi), poi elenco:
   - *Scadenza*: ordinamento attuale per giorni alla scadenza; riga = cartellino, tipo mezzo,
     dislocazione, data + "fra N gg"/"N gg fa" con tono colore.
   - *Targa*: raggruppato per dislocazione, ordinato per targa; riga = cartellino, tipo mezzo,
     n. componenti · bar/marca, chip stato.
   - *Matricola*: riga = cartellino, tipo mezzo, n. componenti e chip delle matricole (cuscini:
     `matricolaLucca` + tipo + matricola fabbricante; taglio: `matricola` + tipo). Componenti
     fermi in rosso. Tubi/rubinetti oltre i primi 4–5 chip compressi in "+N".
   - Clic sulla riga: si mantiene l'anteprima espandibile attuale (`KitAccordion`) con
     "Dettaglio completo" e "Modifica", nelle viste Scadenza e Targa. In vista Matricola le
     matricole sono già visibili: clic apre direttamente il dettaglio.
   - La vista scelta non serve persisterla (opzionale: `localStorage` come comodità, con
     try/catch).
7. **Fuori uso — dismessi**: sezione comprimibile in fondo, invariata.

## Pagina kit cuscini (`KitDetail`)

1. Barra azioni: "‹ Kit cuscini" · **+ Revisione** (primaria) · Sposta · Modifica · menu **⋯**
   (Elimina, con la conferma attuale).
2. **Testata**: cartellino grande + tipo mezzo (`nome`) + "dislocazione · bar · n componenti" +
   chip stato e "Kit incompleto" se ci sono fuori uso.
3. **Tre riquadri**: Prossima revisione (data + giorni), Ultima revisione (data + esito),
   Componenti (operativi/totale, "N fuori uso" in rosso).
4. Banner di allerta attuali (scaduto / critico / incompleto) mantenuti, sotto i riquadri; il
   banner incompleto nomina il componente se è uno solo.
5. **4 pannelli** (pulsanti a tutta riga, attivo nel colore sistema):
   - **Componenti** (aperto di default): gruppi attuali (Cuscini, Centralina, Riduttore, Tubi,
     Rubinetti); matricola Lucca in evidenza a destra, sotto modello + matricola fabbricante;
     tutto il contenuto attuale delle card `gtc` (foto, specs, vecchio codice, fuori uso con
     motivo, "Metti fuori uso", "Sostituisci"). Il layout esatto delle card resta quello `.gtc-*`
     ripulito; non serve compattare i tubi in una riga se complica, purché niente vada a capo.
   - **Dati kit**: tutti i campi della tabella "Dati kit" attuale, a riquadri in griglia 2 colonne.
   - **Storico (N)**: unione cronologica (più recente in alto) di revisioni, sostituzioni,
     spostamenti; chip di tipo; filtri Tutto / Revisioni / Sostituzioni / Spostamenti. Pulsante
     "+ Aggiungi revisione" resta disponibile (anche in testata). Contenuto di ogni voce = quello
     mostrato oggi nelle rispettive tab.
   - **Documenti / Allegati**: componente `Documenti` attuale.

## Pagina gruppo taglio (`GruppiTaglioDetail`)

Stesso schema, colore taglio:

1. Barra azioni: "‹ Gruppi da taglio" · **+ Revisione** · **+ Manutenzione** · Modifica · **⋯**
   (Elimina). Il pulsante Calendario attuale in testata si toglie (è in topbar).
2. Testata: cartellino + tipo mezzo + "dislocazione · marca · sistema · n componenti" + chip
   stato e componenti fermi.
3. Riquadri: Prossima revisione, **Ultima manutenzione** (data + tipo), Componenti operativi/totale.
4. Banner attuali mantenuti (fuori uso definitivo con documenti, incompleto, scaduto, critico).
5. Pannelli:
   - **Componenti** (default): gruppi `GRUPPI_COMP` attuali, contenuto card attuale (matricola,
     olio/candela, pressione, revisione per componente, stato + motivo, azione cambio stato).
   - **Dati gruppo**: campi della card "Dati gruppo" + "Manutenzione corrente" (olio/candela)
     + ultime manutenzioni.
   - **Storico (N)**: revisioni + manutenzioni (`getManutenzioniGT`) + cambi stato componente
     (`getStatiComponentiGT`, collezione `gt_stati_componenti`). Filtri Tutto / Revisioni /
     Manutenzioni / Stato componenti.
   - **Documenti**.

## Vincoli

- React esistente (CRA), react-router, nessuna nuova dipendenza.
- Riusare utility esistenti: `calcolaStato`, `calcolaStatoGT`, `giorniAllaScadenza`,
  `prossimaRevisioneGT`, `componentiFuoriUso`, `componentiNonOperativiGT`, `contaStats`,
  `scortaMancante`, `statoLabelBreve`, `formatData`.
- La logica "Da fare" (lista ordinata di problemi per sistema) va in una funzione pura testata
  (es. in `inventario.js`), usata sia dalla sezione sia dai contatori dell'interruttore.
- Date: mai `toISOString` su date locali (usare `isoLocale`/`oggiIso`).
- Righe lista: niente a capo, troncare con ellissi.
- Mobile: interruttore e pannelli a tutta larghezza, cartellino non si restringe, niente scroll
  orizzontale della pagina.
- Bump `CACHE_NAME` in `public/sw.js` al rilascio.

## Lasciato al builder

- Nomi delle classi CSS nuove e loro organizzazione in `App.css`.
- Se estrarre il cartellino in un piccolo componente condiviso (consigliato: usato in 3 punti).
- Dettagli di spaziatura/tipografia entro lo stile neumorfico.
- Come rappresentare il menu "⋯" e "Esporta ▾" (dropdown semplice, chiusura al clic fuori).
