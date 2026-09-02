# Sistema di backup e ripristino

Data: 2026-09-02
Stato: approvato, in attesa implementazione

## Obiettivo

Permettere all'amministratore di creare uno snapshot manuale di **tutti i dati Firestore dell'app** e, in caso di errore (es. una rinumerazione o una modifica sbagliata), ripristinare l'app esattamente allo stato di uno snapshot precedente. Nasce come estensione del backup JSON già presente (scaricato in automatico prima di "Applica" nella pagina rinumerazione), portato dentro l'app con lista e ripristino con un click.

## Ambito dati

Tutte le collezioni Firestore esistenti, non solo `kits`:

`kits`, `gruppi_taglio`, `storico_revisioni`, `storico_spostamenti`, `storico_sostituzioni`, `gt_revisioni`, `gt_manutenzione`, `gt_stati_componenti`, `documenti`, `revisioni_pianificate`, `promemoria`, `allegati_kit`, `rotazioni`.

Fuori ambito: i file veri caricati su Google Drive (il backup copia solo i metadati/link Firestore in `documenti`/`allegati_kit`, non il contenuto dei file).

## Modello dati

Nuova collezione Firestore `backups`:

```
backups/{backupId}
  creatoIl: timestamp
  etichetta: string            // es. "manuale", "pre-rinumerazione"
  conteggi: { [nomeCollezione]: number }   // quanti documenti per collezione, per la lista

backups/{backupId}/dati/{nomeCollezione}
  nome: string                 // nome della collezione originale
  documenti: [ { id, ...campi } ]   // tutti i documenti di quella collezione, con il loro id originale
```

Split in sottocollezione (un documento per ciascuna delle 13 collezioni) per restare sotto il limite di 1MB per documento di Firestore — un unico blob con tutto dentro rischierebbe di sforarlo quando i dati crescono.

## Modulo `src/firebase/backup.js`

- `creaBackup(etichetta)` — legge tutte le 13 collezioni con `getDocs`, scrive il documento padre in `backups` e un documento per collezione nella sottocollezione `dati`. Ritorna l'id del backup creato.
- `listaBackup()` — ritorna i documenti padre di `backups`, ordinati dal più recente.
- `ripristinaBackup(backupId)` — per ciascuna collezione presente nello snapshot: legge tutti i documenti *attualmente* in quella collezione Firestore e li elimina, poi riscrive (con `setDoc`, stesso id originale) tutti i documenti salvati nello snapshot. Rollback fedele, non un merge: documenti creati dopo lo snapshot in quella collezione vengono persi.
- `eliminaBackup(backupId)` — elimina il documento padre e i documenti della sottocollezione `dati` (pulizia manuale, mai automatica).

Le scritture Firestore non sono transazionali su questa scala (troppi documenti per una singola transazione) — si procede collezione per collezione, in sequenza; se un errore interrompe il ripristino a metà, alcune collezioni sono già ripristinate e altre no (limite noto, vedi sezione Limiti).

## UI — pagina `/admin/backup`

Stessa protezione delle altre pagine admin (password client-side "0577"), raggiungibile dall'icona ⚙ esistente accanto a "Rinumerazione".

- Bottone **"Backup ora"**: chiama `creaBackup("manuale")`, mostra conferma con conteggio documenti salvati.
- **Lista backup**, più recente in cima: data/ora, etichetta, conteggio documenti totali. Per ciascuno:
  - Bottone **"Ripristina"**: apre una conferma che richiede di digitare la parola `RIPRISTINA` (non un semplice OK/Annulla) prima di procedere, per evitare click accidentali su un'azione distruttiva. Dopo conferma, esegue `ripristinaBackup` e mostra l'esito (collezioni ripristinate, eventuali errori).
  - Bottone **"Elimina"**: rimuove quel backup (conferma semplice, non distruttiva sui dati applicativi).

## Sicurezza e limiti (dichiarati esplicitamente in UI)

- Nessun backup automatico/programmato oltre al bottone manuale e a quello già esistente prima di "Applica" rinumerazione.
- Nessuna cancellazione automatica dei backup vecchi: restano finché non li elimini tu a mano.
- La password "0577" è una protezione leggera lato client, non sicurezza reale (coerente con il resto dell'area admin).
- Il ripristino **sostituisce** il contenuto delle collezioni, non lo unisce: qualunque dato creato dopo il backup scelto va perso se ripristini. Va comunicato chiaramente nella UI.
- Ripristino non atomico: un errore a metà procedura lascia l'app in uno stato misto (alcune collezioni ripristinate, altre no). Non è previsto un rollback automatico del ripristino stesso — in quel caso va rifatto un ripristino pulito o corretto a mano.

## Test

- `src/firebase/backup.test.js` (mock di `service`/Firestore): `creaBackup` scrive il documento padre coi conteggi corretti e un documento dati per collezione; `listaBackup` ordina per data desc; `ripristinaBackup` elimina i documenti correnti di ogni collezione e riscrive quelli dello snapshot con gli id originali; `eliminaBackup` rimuove padre + sottocollezione.
