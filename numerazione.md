# Task: rinumerazione seriali kit + suggerimento codice nuovo

## Formato codice
`[CATEGORIA][NUMERO_KIT]SI[INDICE]`
Esempio: `CS8SI29` → categoria `CS`, numero kit `8`, indice `29`.
Categorie esistenti: CS, CN, RP, TB, RV.
Il numero kit (8/10/12...) NON entra nel criterio di rinumerazione: si ignora ai fini dell'ordinamento.

## Criterio di rinumerazione (da applicare ai seriali ESISTENTI nel DB)
Per ogni categoria (CS, CN, RP, TB, RV) separatamente:
1. Estrarre tutti i record di quella categoria nell'ordine in cui compaiono nel DB/file attuale (ordine di inserimento/apparizione, NON ordinare per indice vecchio).
2. Assegnare il nuovo indice come numero progressivo crescente a partire da 1, in quell'ordine: il 1° record della categoria diventa indice 1, il 2° diventa indice 2, e così via, senza salti.
3. Il numero kit (8/10/12) e la lettera categoria restano invariati: cambia SOLO l'indice finale dopo "SI".

Esempio pratico (estratto reale già verificato):
```
CS8SI1   -> CS8SI1
CN8SI1   -> CN8SI1
RP8SI1   -> RP8SI1
TB8SI1   -> TB8SI1
CS10SI4  -> CS10SI2
CS10SI5  -> CS10SI3
CS10SI6  -> CS10SI4
CN10SI13 -> CN10SI2
RP10SI3  -> RP10SI2
TB10SI2  -> TB10SI2
RV10SI7  -> RV10SI1
CS8SI29  -> CS8SI5
CN8SI7   -> CN8SI3
...
```
(la logica: dentro ogni categoria, scorri il DB nell'ordine in cui i record esistono e numera 1,2,3,... in sequenza)

## Cosa deve fare l'app

### 1) Migrazione/rinumerazione dei seriali esistenti
- Per ogni record esistente nel DB, calcolare il nuovo indice secondo il criterio sopra.
- Aggiungere un campo `vecchio_codice` (storicizzazione) se non già presente, mantenendo traccia della mappatura vecchio → nuovo.
- Aggiornare il campo del codice corrente con il nuovo valore.
- Operazione idempotente: se rilanciata, non deve generare doppie rinumerazioni (lavorare su uno snapshot/ordine stabile, es. ordinare per chiave primaria/data di creazione se l'ordine di apparizione non è già esplicito).

### 2) Suggerimento codice per nuovo seriale
- Quando si crea un nuovo record per una categoria (CS/CN/RP/TB/RV), il sistema deve proporre come indice suggerito: **massimo indice attualmente in uso in quella categoria + 1**.
- L'utente può accettare il suggerimento o modificarlo manualmente.
- Il numero kit (8/10/12...) viene scelto/inserito a parte e non influisce sul calcolo dell'indice suggerito.

## Note implementative
- Mantenere la logica di calcolo dell'indice (rinumerazione + suggerimento) in una funzione/modulo unico e testabile, così è riusabile sia per la migrazione sia per il suggerimento in creazione.
- Aggiungere test che coprano: categoria vuota (primo indice = 1), categoria con buchi/numeri non sequenziali, categoria con indici duplicati (es. SI0 ripetuti) da rinumerare in ordine di apparizione.

## Appendice: mappatura completa vecchio -> nuovo (riferimento per validazione/test)
Usare questa lista come dataset di verifica: applicando l'algoritmo sopra ai record nell'ordine indicato, il risultato deve coincidere esattamente.

```
CS8SI1   -> CS8SI1
CN8SI1   -> CN8SI1
RP8SI1   -> RP8SI1
TB8SI1   -> TB8SI1
CS10SI4  -> CS10SI2
CS10SI5  -> CS10SI3
CS10SI6  -> CS10SI4
CN10SI13 -> CN10SI2
RP10SI3  -> RP10SI2
TB10SI2  -> TB10SI2
TB10SI11 -> TB10SI3
TB10SI4  -> TB10SI4
TB10SI5  -> TB10SI5
RV10SI7  -> RV10SI1
CS8SI29  -> CS8SI5
CS8SI30  -> CS8SI6
CS8SI31  -> CS8SI7
CN8SI7   -> CN8SI3
RP8SI8   -> RP8SI3
TB8SI24  -> TB8SI6
TB8SI25  -> TB8SI7
TB8SI26  -> TB8SI8
CS8SI7   -> CS8SI8
CS8SI8   -> CS8SI9
CS8SI9   -> CS8SI10
CN8SI3   -> CN8SI4
RP8SI4   -> RP8SI4
TB8SI12  -> TB8SI9
TB8SI13  -> TB8SI10
TB8SI14  -> TB8SI11
CS8SI10  -> CS8SI11
CS8SI11  -> CS8SI12
CS8SI12  -> CS8SI13
CN8SI4   -> CN8SI5
RP8SI5   -> RP8SI5
TB8SI15  -> TB8SI12
TB8SI16  -> TB8SI13
TB8SI17  -> TB8SI14
RV8SI6   -> RV8SI2
CS12SI1  -> CS12SI14
CS12SI2  -> CS12SI15
CS12SI3  -> CS12SI16
CN12SI1  -> CN12SI6
RP12SI1  -> RP12SI6
TB12SI1  -> TB12SI15
TB12SI2  -> TB12SI16
TB12SI3  -> TB12SI17
RV12SI4  -> RV12SI3
CS8SI0   -> CS8SI17
CS8SI0   -> CS8SI18
CN8SI0   -> CN8SI7
RP8SI0   -> RP8SI7
TB8SI0   -> TB8SI18
TB8SI0   -> TB8SI19
TB8SI0   -> TB8SI20
CS8SI24  -> CS8SI19
CS8SI25  -> CS8SI20
CN8SI8   -> CN8SI8
RP8SI9   -> RP8SI8
TB8SI27  -> TB8SI21
TB8SI28  -> TB8SI22
TB8SI29  -> TB8SI23
RV8SI1   -> RV8SI4
CS8SI26  -> CS8SI21
CS8SI27  -> CS8SI22
CS8SI28  -> CS8SI23
CS12SI4  -> CS12SI24
CN8SI9   -> CN8SI9
RP8SI10  -> RP8SI9
TB8SI30  -> TB8SI24
TB8SI31  -> TB8SI25
TB8SI32  -> TB8SI26
CS8SI13  -> CS8SI25
CS8SI14  -> CS8SI26
CS8SI15  -> CS8SI27
CN8SI5   -> CN8SI10
RP8SI6   -> RP8SI10
TB8SI18  -> TB8SI27
TB8SI19  -> TB8SI28
TB8SI20  -> TB8SI29
RV8SI5   -> RV8SI5
CS10SI1  -> CS10SI28
CS10SI2  -> CS10SI29
CS10SI3  -> CS10SI30
CN10SI1  -> CN10SI11
RP10SI1  -> RP10SI11
TB10SI1  -> TB10SI30
TB10SI2  -> TB10SI31
TB10SI3  -> TB10SI32
RV10SI2  -> RV10SI6
RV10SI3  -> RV10SI7
CS8SI2   -> CS8SI31
CS8SI3   -> CS8SI32
CN8SI2   -> CN8SI12
RP8SI2   -> RP8SI12
TB8SI6   -> TB8SI33
TB8SI7   -> TB8SI34
TB8SI8   -> TB8SI35
CS8SI18  -> CS8SI33
CS8SI19  -> CS8SI34
CS8SI20  -> CS8SI35
CN8SI6   -> CN8SI13
RP8SI7   -> RP8SI13
TB8SI21  -> TB8SI36
TB8SI22  -> TB8SI37
TB8SI23  -> TB8SI38
```
