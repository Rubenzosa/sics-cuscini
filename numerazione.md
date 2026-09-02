# Task: rinumerazione seriali kit + suggerimento codice nuovo

## Formato codice
`[CATEGORIA][NUMERO_KIT]SI[INDICE]`
Esempio: `CS8SI29` → categoria `CS`, numero kit `8`, indice `29`.
Categorie esistenti: CS, CN, RP, TB, RV.
Il numero kit (8/10/12...) NON entra nel criterio di rinumerazione: si ignora ai fini dell'ordinamento.

## Criterio di rinumerazione (da applicare ai seriali ESISTENTI nel DB)
Contatore UNICO, condiviso da TUTTE le categorie insieme (non uno per categoria):
1. Estrarre tutti i record (di qualunque categoria) nell'ordine in cui compaiono nel DB/file attuale (ordine di inserimento/apparizione, NON ordinare per indice vecchio).
2. Assegnare il nuovo indice come numero progressivo crescente a partire da 1, in quell'ordine, SENZA distinguere per categoria: il 1° record incontrato in assoluto diventa indice 1, il 2° (di qualunque categoria) diventa indice 2, e così via, senza salti.
3. Il numero kit (8/10/12) e la lettera categoria restano invariati: cambia SOLO l'indice finale dopo "SI".
4. L'indice si formatta sempre su 3 cifre (001, 002, ...). Superati 999, riparte da 001.

Esempio pratico (estratto reale già verificato):
```
CS8SI1   -> CS8SI001
CN8SI1   -> CN8SI002
RP8SI1   -> RP8SI003
TB8SI1   -> TB8SI004
CS10SI4  -> CS10SI005
CS10SI5  -> CS10SI006
CS10SI6  -> CS10SI007
CN10SI13 -> CN10SI008
RP10SI3  -> RP10SI009
TB10SI2  -> TB10SI010
RV10SI7  -> RV10SI014
CS8SI29  -> CS8SI015
CN8SI7   -> CN8SI018
...
```
(la logica: scorri il DB nell'ordine in cui i record esistono, senza distinguere categoria, e numera 1,2,3,... in sequenza unica; formatta su 3 cifre)

## Cosa deve fare l'app

### 1) Migrazione/rinumerazione dei seriali esistenti
- Per ogni record esistente nel DB, calcolare il nuovo indice secondo il criterio sopra.
- Aggiungere un campo `vecchio_codice` (storicizzazione) se non già presente, mantenendo traccia della mappatura vecchio → nuovo.
- Aggiornare il campo del codice corrente con il nuovo valore.
- Operazione idempotente: se rilanciata, non deve generare doppie rinumerazioni (lavorare su uno snapshot/ordine stabile, es. ordinare per chiave primaria/data di creazione se l'ordine di apparizione non è già esplicito).

### 2) Suggerimento codice per nuovo seriale
- Quando si crea un nuovo record (qualunque categoria CS/CN/RP/TB/RV), il sistema deve proporre come indice suggerito: **massimo indice attualmente in uso GLOBALMENTE (su tutte le categorie e tutti i bar) + 1**, con wrap a 001 dopo 999.
- L'utente può accettare il suggerimento o modificarlo manualmente.
- Il numero kit (8/10/12...) viene scelto/inserito a parte e non influisce sul calcolo dell'indice suggerito.
- Lo stesso calcolo va usato anche quando si sostituisce un componente esistente (fuori uso → nuovo pezzo): non deve esistere una formula diversa per quel flusso, altrimenti si rischiano indici duplicati.

## Note implementative
- Mantenere la logica di calcolo dell'indice (rinumerazione + suggerimento) in una funzione/modulo unico e testabile, così è riusabile sia per la migrazione sia per il suggerimento in creazione.
- Aggiungere test che coprano: categoria vuota (primo indice = 1), categoria con buchi/numeri non sequenziali, categoria con indici duplicati (es. SI0 ripetuti) da rinumerare in ordine di apparizione.

## Appendice: mappatura completa vecchio -> nuovo (riferimento per validazione/test)
Usare questa lista come dataset di verifica: applicando l'algoritmo sopra ai record nell'ordine indicato, il risultato deve coincidere esattamente.

```
CS8SI1   -> CS8SI001
CN8SI1   -> CN8SI002
RP8SI1   -> RP8SI003
TB8SI1   -> TB8SI004
CS10SI4  -> CS10SI005
CS10SI5  -> CS10SI006
CS10SI6  -> CS10SI007
CN10SI13 -> CN10SI008
RP10SI3  -> RP10SI009
TB10SI2  -> TB10SI010
TB10SI11 -> TB10SI011
TB10SI4  -> TB10SI012
TB10SI5  -> TB10SI013
RV10SI7  -> RV10SI014
CS8SI29  -> CS8SI015
CS8SI30  -> CS8SI016
CS8SI31  -> CS8SI017
CN8SI7   -> CN8SI018
RP8SI8   -> RP8SI019
TB8SI24  -> TB8SI020
TB8SI25  -> TB8SI021
TB8SI26  -> TB8SI022
CS8SI7   -> CS8SI023
CS8SI8   -> CS8SI024
CS8SI9   -> CS8SI025
CN8SI3   -> CN8SI026
RP8SI4   -> RP8SI027
TB8SI12  -> TB8SI028
TB8SI13  -> TB8SI029
TB8SI14  -> TB8SI030
CS8SI10  -> CS8SI031
CS8SI11  -> CS8SI032
CS8SI12  -> CS8SI033
CN8SI4   -> CN8SI034
RP8SI5   -> RP8SI035
TB8SI15  -> TB8SI036
TB8SI16  -> TB8SI037
TB8SI17  -> TB8SI038
RV8SI6   -> RV8SI039
CS12SI1  -> CS12SI040
CS12SI2  -> CS12SI041
CS12SI3  -> CS12SI042
CN12SI1  -> CN12SI043
RP12SI1  -> RP12SI044
TB12SI1  -> TB12SI045
TB12SI2  -> TB12SI046
TB12SI3  -> TB12SI047
RV12SI4  -> RV12SI048
CS8SI0   -> CS8SI049
CS8SI0   -> CS8SI050
CN8SI0   -> CN8SI051
RP8SI0   -> RP8SI052
TB8SI0   -> TB8SI053
TB8SI0   -> TB8SI054
TB8SI0   -> TB8SI055
CS8SI24  -> CS8SI056
CS8SI25  -> CS8SI057
CN8SI8   -> CN8SI058
RP8SI9   -> RP8SI059
TB8SI27  -> TB8SI060
TB8SI28  -> TB8SI061
TB8SI29  -> TB8SI062
RV8SI1   -> RV8SI063
CS8SI26  -> CS8SI064
CS8SI27  -> CS8SI065
CS8SI28  -> CS8SI066
CS12SI4  -> CS12SI067
CN8SI9   -> CN8SI068
RP8SI10  -> RP8SI069
TB8SI30  -> TB8SI070
TB8SI31  -> TB8SI071
TB8SI32  -> TB8SI072
CS8SI13  -> CS8SI073
CS8SI14  -> CS8SI074
CS8SI15  -> CS8SI075
CN8SI5   -> CN8SI076
RP8SI6   -> RP8SI077
TB8SI18  -> TB8SI078
TB8SI19  -> TB8SI079
TB8SI20  -> TB8SI080
RV8SI5   -> RV8SI081
CS10SI1  -> CS10SI082
CS10SI2  -> CS10SI083
CS10SI3  -> CS10SI084
CN10SI1  -> CN10SI085
RP10SI1  -> RP10SI086
TB10SI1  -> TB10SI087
TB10SI2  -> TB10SI088
TB10SI3  -> TB10SI089
RV10SI2  -> RV10SI090
RV10SI3  -> RV10SI091
CS8SI2   -> CS8SI092
CS8SI3   -> CS8SI093
CN8SI2   -> CN8SI094
RP8SI2   -> RP8SI095
TB8SI6   -> TB8SI096
TB8SI7   -> TB8SI097
TB8SI8   -> TB8SI098
CS8SI18  -> CS8SI099
CS8SI19  -> CS8SI100
CS8SI20  -> CS8SI101
CN8SI6   -> CN8SI102
RP8SI7   -> RP8SI103
TB8SI21  -> TB8SI104
TB8SI22  -> TB8SI105
TB8SI23  -> TB8SI106
```
