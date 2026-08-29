// ═══════════════════════════════════════════════════════════
// GRUPPI DA TAGLIO (SIMDB) — VVF SIENA
// Fonte: Gruppi_da_taglio_SIMDB.xlsx — verificato riga per riga
// 14 kit totali: 14/15, 18/21, 1, 6, 5, 19, 3, 10(FU), 16, 4, 20, 12, 22/17, 2
// ═══════════════════════════════════════════════════════════

export const gruppiTaglioData = [

  // ── KIT 14/15 · 40/10 · VF 16701 ──────────────────────────
  {
    id:"gt-14-15", numero:"14/15", nome:"40/10", mezzo:"VF 16701",
    tipoMezzo:"40/10", dislocazione:"Sede Centrale", annoAcquisto:2007,
    sistema:"oleodinamico", marca:"LUKAS", stato:"attivo",
    componenti:[
      {tipo:"CENTRALINA OLEODINAMICA", modello:"LUKAS GW-6R",    matricola:"85207",   pressione:"630 BAR", statoComp:"Buono",        olio:"HLP10", candela:"",        ultimaRevisione:"2017-12-01", prossimaRevisione:null,         annoComp:2007},
      {tipo:"CENTRALINA OLEODINAMICA", modello:"LUKAS GA-2L",    matricola:"85228",   pressione:"630 BAR", statoComp:"Prossimo F.U.", olio:"HLP10", candela:"",        ultimaRevisione:"2017-12-01", prossimaRevisione:null,         annoComp:2007},
      {tipo:"DIVARICATORE",            modello:"LUKAS LSP 40 EN", matricola:"84900",  pressione:"630 BAR", statoComp:"Buono",        olio:"",      candela:"",        ultimaRevisione:"2017-12-01", prossimaRevisione:null,         annoComp:2007},
      {tipo:"CESOIA",                  modello:"LUKAS LS 330 EN", matricola:"84890",  pressione:"630 BAR", statoComp:"Buono",        olio:"",      candela:"",        ultimaRevisione:"2017-12-01", prossimaRevisione:null,         annoComp:2007},
      {tipo:"PISTONE",                 modello:"LUKAS LZ 3",      matricola:"85209",  pressione:"630 BAR", statoComp:"Buono",        olio:"",      candela:"",        ultimaRevisione:"2017-12-01", prossimaRevisione:null,         annoComp:2007},
      {tipo:"TUBI",                    modello:"",                matricola:"",        pressione:"630 BAR", statoComp:"Buono",        olio:"",      candela:"",        ultimaRevisione:"2017-12-01", prossimaRevisione:null,         annoComp:2007},
    ]
  },

  // ── KIT 18/21 · APS ACTROS · VF 24491 ─────────────────────
  // id "gt-aps-actros": e' il documento storico su Firestore, quello a cui
  // puntano i record di gt_revisioni. Un seed con id diverso non lo
  // sovrascrive, lo affianca: e' cosi' che era nato il doppione "gt-18-21".
  {
    id:"gt-aps-actros", numero:"18/21", nome:"APS ACTROS", mezzo:"VF 24491",
    tipoMezzo:"APS ACTROS", dislocazione:"Sede Centrale", annoAcquisto:2006,
    sistema:"oleodinamico", marca:"LUKAS", stato:"attivo",
    componenti:[
      {tipo:"CENTRALINA OLEODINAMICA", modello:"LUKAS GW-6R",         matricola:"110375-006", pressione:"630 BAR", statoComp:"Ottimo", olio:"HLP10", candela:"NGK BR2-LM", ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2006},
      {tipo:"CENTRALINA AUSILIARIA",   modello:"INTERFRON VP700-I",   matricola:"151",        pressione:"630 BAR", statoComp:"Ottimo", olio:"HLP10", candela:"",           ultimaRevisione:null,         prossimaRevisione:"2024-12-01", annoComp:2006},
      {tipo:"CESOIA",                  modello:"LUKAS LS 200 EN",     matricola:"109542",     pressione:"630 BAR", statoComp:"Ottimo", olio:"",      candela:"",           ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2006},
      {tipo:"DIVARICATORE",            modello:"LUKAS LSP 40 EN",     matricola:"109089",     pressione:"630 BAR", statoComp:"Ottimo", olio:"",      candela:"",           ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2006},
      {tipo:"PISTONE",                 modello:"LUKAS LOR 12-700 EN", matricola:"116086",     pressione:"630 BAR", statoComp:"Ottimo", olio:"",      candela:"",           ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2006},
      {tipo:"POMPA MANUALE",           modello:"LUKAS LH2/1.8-63",    matricola:"0701-11",    pressione:"630 BAR", statoComp:"Ottimo", olio:"HLP10", candela:"",           ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2006},
    ]
  },

  // ── KIT 1 · APS 120 · VF 29453 ────────────────────────────
  {
    id:"gt-1", numero:"1", nome:"APS 120", mezzo:"VF 29453",
    tipoMezzo:"APS 120", dislocazione:"Sede Centrale", annoAcquisto:2018,
    sistema:"elettrico", marca:"LUKAS", stato:"attivo",
    componenti:[
      {tipo:"DIVARICATORE ELETTRICO", modello:"LUKAS SP 333 E2", matricola:"310657 00014", pressione:"720 BAR", statoComp:"Ottimo", olio:"ELETTRICO", candela:"", ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2018},
      {tipo:"CESOIA ELETTRICA",       modello:"LUKAS S 377 E2",  matricola:"312148 00007", pressione:"720 BAR", statoComp:"Ottimo", olio:"ELETTRICO", candela:"", ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2018},
      {tipo:"PISTONE ELETTRICO",      modello:"LUKAS R 421 E2",  matricola:"323749",        pressione:"720 BAR", statoComp:"Ottimo", olio:"ELETTRICO", candela:"", ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2019},
    ]
  },

  // ── KIT 6 · APS 120/20 · VF 31450 ─────────────────────────
  {
    id:"gt-6", numero:"6", nome:"APS 120/20", mezzo:"VF 31450",
    tipoMezzo:"APS 120/20", dislocazione:"Sede Centrale", annoAcquisto:2021,
    sistema:"elettrico", marca:"LUKAS", stato:"attivo",
    componenti:[
      {tipo:"DIVARICATORE ELETTRICO", modello:"LUKAS SP333- eWXT", matricola:"344585-00001", pressione:"720 BAR", statoComp:"Ottimo", olio:"ELETTRICO", candela:"", ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2021},
      {tipo:"CESOIA ELETTRICA",       modello:"LUKAS S378- eWXT",  matricola:"344359-00004", pressione:"720 BAR", statoComp:"Ottimo", olio:"ELETTRICO", candela:"", ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2021},
      {tipo:"PISTONE ELETTRICO",      modello:"LUKAS R 520- eWXT", matricola:"345484-00001", pressione:"720 BAR", statoComp:"Ottimo", olio:"ELETTRICO", candela:"", ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2021},
      {tipo:"MORSA DI SOSTEGNO",      modello:"LUKAS LRS-C",       matricola:"18071874",     pressione:"",        statoComp:"Ottimo", olio:"",          candela:"", ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2021},
    ]
  },

  // ── KIT 5 · APS VOLVO · VF 26504 ──────────────────────────
  {
    id:"gt-5", numero:"5", nome:"APS VOLVO", mezzo:"VF 26504",
    tipoMezzo:"APS VOLVO", dislocazione:"Sede Centrale", annoAcquisto:2021,
    sistema:"elettrico", marca:"LUKAS", stato:"attivo",
    componenti:[
      {tipo:"DIVARICATORE ELETTRICO", modello:"LUKAS SP 333 E2", matricola:"335801-00006", pressione:"720 BAR", statoComp:"Ottimo", olio:"ELETTRICO", candela:"", ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2021},
      {tipo:"CESOIA ELETTRICA",       modello:"LUKAS S 377 E2",  matricola:"334872-00007", pressione:"720 BAR", statoComp:"Ottimo", olio:"ELETTRICO", candela:"", ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2021},
      {tipo:"PISTONE ELETTRICO",      modello:"LUKAS R 410 E2",  matricola:"334870-00009", pressione:"720 BAR", statoComp:"Ottimo", olio:"ELETTRICO", candela:"", ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2021},
      {tipo:"MORSA DI SOSTEGNO",      modello:"",                matricola:"",              pressione:"",        statoComp:"Ottimo", olio:"",          candela:"", ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2021},
    ]
  },

  // ── KIT 19 · APS 100 · VF 20946 ───────────────────────────
  {
    id:"gt-19", numero:"19", nome:"APS 100", mezzo:"VF 20946",
    tipoMezzo:"APS 100", dislocazione:"Sede Centrale", annoAcquisto:2015,
    sistema:"oleodinamico", marca:"HOLMATRO", stato:"attivo",
    componenti:[
      {tipo:"CENTRALINA OLEODINAMICA", modello:"HOLMATRO SR20 PC2",  matricola:"1261646HH", pressione:"720 BAR", statoComp:"Ottimo", olio:"HV 15/22", candela:"NGK CR5HSB", ultimaRevisione:"2023-07-15", prossimaRevisione:"2025-07-15", annoComp:2015},
      {tipo:"CESOIA",                  modello:"HOLMATRO CU 5050",   matricola:"1261830HH", pressione:"720 BAR", statoComp:"Ottimo", olio:"",         candela:"",           ultimaRevisione:"2023-07-15", prossimaRevisione:"2025-07-15", annoComp:2015},
      {tipo:"DIVARICATORE",            modello:"HOLMATRO SP 5240",   matricola:"1261533HH", pressione:"720 BAR", statoComp:"Ottimo", olio:"",         candela:"",           ultimaRevisione:"2023-07-15", prossimaRevisione:"2025-07-15", annoComp:2015},
      {tipo:"PISTONE",                 modello:"HOLMATRO TR 4350 C", matricola:"1262313HH", pressione:"720 BAR", statoComp:"Ottimo", olio:"",         candela:"",           ultimaRevisione:"2023-07-15", prossimaRevisione:"2025-07-15", annoComp:2015},
      {tipo:"MORSA DI SOSTEGNO",       modello:"",                   matricola:"",           pressione:"",        statoComp:"Ottimo", olio:"",         candela:"",           ultimaRevisione:"2023-07-15", prossimaRevisione:"2025-07-15", annoComp:null},
      {tipo:"TUBI",                    modello:"HOLMATRO",           matricola:"",           pressione:"720 BAR", statoComp:"Ottimo", olio:"",         candela:"",           ultimaRevisione:"2023-07-15", prossimaRevisione:"2025-07-15", annoComp:2015},
    ]
  },

  // ── KIT 3 · APS MAN · VF 29926 ────────────────────────────
  {
    id:"gt-3", numero:"3", nome:"APS MAN", mezzo:"VF 29926",
    tipoMezzo:"APS MAN", dislocazione:"Sede Centrale", annoAcquisto:2019,
    sistema:"elettrico", marca:"WEBER", stato:"attivo",
    componenti:[
      {tipo:"DIVARICATORE ELETTRICO", modello:"WEBER SP44 AS",             matricola:"489-11/19 A", pressione:"720 BAR", statoComp:"Ottimo", olio:"ELETTRICO", candela:"", ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2019},
      {tipo:"CESOIA ELETTRICA",       modello:"WEBER RSU180 Plus",         matricola:"484-11/19 A", pressione:"720 BAR", statoComp:"Ottimo", olio:"ELETTRICO", candela:"", ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2019},
      {tipo:"PISTONE ELETTRICO",      modello:"WEBER RZ 1-910 E FORCE 2",  matricola:"1076272",     pressione:"720 BAR", statoComp:"Ottimo", olio:"ELETTRICO", candela:"", ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2019},
      {tipo:"MORSA DI SOSTEGNO",      modello:"",                          matricola:"",             pressione:"",        statoComp:"Ottimo", olio:"ELETTRICO", candela:"", ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:2019},
    ]
  },

  // ── KIT 10 · FUORI USO ─────────────────────────────────────
  {
    id:"gt-10", numero:"10", nome:"Kit 10 — Fuori uso", mezzo:"FUORI SERVIZIO",
    tipoMezzo:"", dislocazione:"Magazzino", annoAcquisto:1998,
    sistema:"oleodinamico", marca:"LUKAS", stato:"fuori_uso",
    componenti:[
      {tipo:"CENTRALINA OLEODINAMICA", modello:"LUKAS Hydr.GS-2R", matricola:"00128354 0005",  pressione:"630 BAR", statoComp:"Fuori uso", olio:"HLP10", candela:"NGK BR2-LM", ultimaRevisione:"2017-07-01", prossimaRevisione:"2020-07-01", annoComp:1998},
      {tipo:"DIVARICATORE",            modello:"LUKAS LS 200B",     matricola:"0105773211 007", pressione:"630 BAR", statoComp:"Fuori uso", olio:"",      candela:"",           ultimaRevisione:"2017-07-01", prossimaRevisione:"2020-07-01", annoComp:1998},
      {tipo:"CESOIA",                  modello:"LUKAS LSP 40B",     matricola:"57542701",       pressione:"630 BAR", statoComp:"Fuori uso", olio:"",      candela:"",           ultimaRevisione:"2017-07-01", prossimaRevisione:"2020-07-01", annoComp:1998},
      {tipo:"TUBI 10 MT",              modello:"LUKAS",             matricola:"",               pressione:"630 BAR", statoComp:"Fuori uso", olio:"HLP10", candela:"",           ultimaRevisione:"2017-07-01", prossimaRevisione:"2020-07-01", annoComp:null},
    ]
  },

  // ── KIT 16 · APS 180 Montepulciano · VF 30217 ─────────────
  {
    id:"gt-16", numero:"16", nome:"APS 180 Montepulciano", mezzo:"VF 30217",
    tipoMezzo:"APS 180", dislocazione:"Montepulciano", annoAcquisto:2018,
    sistema:"oleodinamico", marca:"HOLMATRO", stato:"attivo",
    componenti:[
      {tipo:"CENTRALINA OLEODINAMICA", modello:"HOLMATRO SR40 PC 2", matricola:"1320544HH", pressione:"720 BAR", statoComp:"Ottimo", olio:"HV 15/22", candela:"NGK-R BPR6ES", ultimaRevisione:"2025-05-29", prossimaRevisione:"2027-05-29", annoComp:2018},
      {tipo:"POMPA MANUALE",           modello:"HOLMATRO PA18 H2C",  matricola:"1262435HH", pressione:"720 BAR", statoComp:"Ottimo", olio:"HV 15/22", candela:"",             ultimaRevisione:"2025-06-11", prossimaRevisione:"2027-06-11", annoComp:2018},
      {tipo:"DIVARICATORE",            modello:"HOLMATRO SP 4240C",  matricola:"162735",    pressione:"720 BAR", statoComp:"Ottimo", olio:"",         candela:"",             ultimaRevisione:"2025-05-29", prossimaRevisione:"2027-05-29", annoComp:2018},
      {tipo:"CESOIA",                  modello:"HOLMATRO CU 4050C",  matricola:"162965",    pressione:"720 BAR", statoComp:"Ottimo", olio:"",         candela:"",             ultimaRevisione:"2025-05-29", prossimaRevisione:"2027-05-29", annoComp:2018},
      {tipo:"PISTONE",                 modello:"HOLMATRO RA 4321C",  matricola:"160445",    pressione:"720 BAR", statoComp:"Ottimo", olio:"",         candela:"",             ultimaRevisione:"2025-05-29", prossimaRevisione:"2027-05-29", annoComp:2018},
      {tipo:"TUBI 10 MT",              modello:"HOLMATRO",           matricola:"",          pressione:"720 BAR", statoComp:"Ottimo", olio:"",         candela:"",             ultimaRevisione:"2025-05-29", prossimaRevisione:"2027-05-29", annoComp:2018},
    ]
  },

  // ── KIT 4 · POLISOCCORSO · VF 29068 ───────────────────────
  {
    id:"gt-4", numero:"4", nome:"POLISOCCORSO", mezzo:"VF 29068",
    tipoMezzo:"POLISOCCORSO", dislocazione:"Sede Centrale", annoAcquisto:2021,
    sistema:"elettrico", marca:"LUKAS", stato:"attivo",
    componenti:[
      {tipo:"DIVARICATORE ELETTRICO", modello:"LUKAS SP 333 E2", matricola:"333637-00004", pressione:"720 BAR", statoComp:"Ottimo", olio:"ELETTRICO", candela:"", ultimaRevisione:"2024-03-15", prossimaRevisione:"2027-03-15", annoComp:2021},
      {tipo:"CESOIA ELETTRICA",       modello:"LUKAS S 377 E2",  matricola:"333571-00004", pressione:"720 BAR", statoComp:"Ottimo", olio:"ELETTRICO", candela:"", ultimaRevisione:"2024-03-15", prossimaRevisione:"2027-03-15", annoComp:2021},
      {tipo:"PISTONE ELETTRICO",      modello:"LUKAS R 410 E2",  matricola:"334475-00006", pressione:"720 BAR", statoComp:"Ottimo", olio:"ELETTRICO", candela:"", ultimaRevisione:"2024-03-15", prossimaRevisione:"2027-03-15", annoComp:2021},
      {tipo:"MORSA DI SOSTEGNO",      modello:"",                matricola:"",             pressione:"720 BAR", statoComp:"Ottimo", olio:"ELETTRICO", candela:"", ultimaRevisione:"2024-03-15", prossimaRevisione:"2027-03-15", annoComp:2021},
    ]
  },

  // ── KIT 20 · APS 180 Montalcino · VF 30725 ────────────────
  // NOTA: la MORSA DI SOSTEGNO (LUKAS LRS-C, matr. 6332) è nella riga APS 180 montalcino
  // ma appartiene al kit 18 (APS ACTROS) nel foglio — qui è correttamente al kit 20
  {
    id:"gt-20", numero:"20", nome:"APS 180 Montalcino", mezzo:"VF 30725",
    tipoMezzo:"APS 180", dislocazione:"Montalcino", annoAcquisto:2015,
    sistema:"oleodinamico", marca:"HOLMATRO", stato:"attivo",
    componenti:[
      {tipo:"MORSA DI SOSTEGNO",       modello:"LUKAS LRS-C",        matricola:"6332",      pressione:"",        statoComp:"Ottimo", olio:"",         candela:"",               ultimaRevisione:"2025-06-05", prossimaRevisione:"2028-06-05", annoComp:null},
      {tipo:"CENTRALINA OLEODINAMICA", modello:"HOLMATRO SR20 PC2",  matricola:"1261645HH", pressione:"720 BAR", statoComp:"Ottimo", olio:"HV 15/22", candela:"DENSO U16FSR-UB", ultimaRevisione:"2025-05-29", prossimaRevisione:"2027-05-29", annoComp:2015},
      {tipo:"CESOIA",                  modello:"HOLMATRO CU 5050",   matricola:"1261350HH", pressione:"720 BAR", statoComp:"Ottimo", olio:"",         candela:"",               ultimaRevisione:"2025-05-29", prossimaRevisione:"2027-05-29", annoComp:2015},
      {tipo:"DIVARICATORE",            modello:"HOLMATRO SP 5240",   matricola:"1261584HH", pressione:"720 BAR", statoComp:"Ottimo", olio:"",         candela:"",               ultimaRevisione:"2025-05-29", prossimaRevisione:"2027-05-29", annoComp:2015},
      {tipo:"PISTONE",                 modello:"HOLMATRO TR 4350 C", matricola:"1262429HH", pressione:"720 BAR", statoComp:"Ottimo", olio:"",         candela:"",               ultimaRevisione:"2025-05-29", prossimaRevisione:"2027-05-29", annoComp:2015},
      {tipo:"POMPA MANUALE",           modello:"HOLMATRO PA18 H2C",  matricola:"1262434HH", pressione:"720 BAR", statoComp:"Ottimo", olio:"HV 15/22", candela:"",               ultimaRevisione:"2025-05-29", prossimaRevisione:"2027-05-29", annoComp:2015},
    ]
  },

  // ── KIT 12 · MAGAZZINO · ZUMBO 350 BAR ────────────────────
  {
    id:"gt-12", numero:"12", nome:"Magazzino ZUMBO", mezzo:"MAGAZZINO",
    tipoMezzo:"", dislocazione:"Magazzino", annoAcquisto:2002,
    sistema:"oleodinamico", marca:"ZUMBO", stato:"magazzino",
    componenti:[
      {tipo:"CENTRALINA OLEODINAMICA",      modello:"ZUMBO RSQ (Motore Kawasaki)", matricola:"13271", pressione:"350 BAR", statoComp:"Ottimo", olio:"", candela:"", ultimaRevisione:"2021-04-01", prossimaRevisione:"2024-04-01", annoComp:2002},
      {tipo:"CESOIA/DIVARICATORE COMBINATI", modello:"",                           matricola:"13152", pressione:"350 BAR", statoComp:"Ottimo", olio:"", candela:"", ultimaRevisione:"2021-04-01", prossimaRevisione:"2024-04-01", annoComp:2002},
    ]
  },

  // ── KIT 22/17 · APS 140 4X4 · VF 22777 ───────────────────
  // NOTA: matricola MORSA "153.01.11" — nel foglio appare come "6 days 9:01:11"
  // per errore di parsing Excel del numero — il valore corretto è 153.01.11
  {
    id:"gt-22-17", numero:"22/17", nome:"APS 140 4X4", mezzo:"VF 22777",
    tipoMezzo:"APS 140 4X4", dislocazione:"Sede Centrale", annoAcquisto:2017,
    sistema:"oleodinamico", marca:"HOLMATRO", stato:"attivo",
    componenti:[
      {tipo:"CENTRALINA OLEODINAMICA", modello:"HOLMATRO SR20 PC2 (Motore HONDA GX100)", matricola:"1293847HH", pressione:"720 BAR", statoComp:"Ottimo", olio:"HV 15/22", candela:"NGK CR5HSB",    ultimaRevisione:"2025-06-11", prossimaRevisione:"2027-06-11", annoComp:2017},
      {tipo:"CESOIA",                  modello:"HOLMATRO CU 5050",                        matricola:"1294309HH", pressione:"720 BAR", statoComp:"Ottimo", olio:"",         candela:"",              ultimaRevisione:"2025-06-11", prossimaRevisione:"2027-06-11", annoComp:2017},
      {tipo:"DIVARICATORE",            modello:"HOLMATRO SP 5250",                        matricola:"1294649HH", pressione:"720 BAR", statoComp:"Ottimo", olio:"",         candela:"",              ultimaRevisione:"2025-06-11", prossimaRevisione:"2027-06-11", annoComp:2017},
      {tipo:"TUBI",                    modello:"HOLMATRO CO 5BU",                         matricola:"",          pressione:"720 BAR", statoComp:"Ottimo", olio:"",         candela:"",              ultimaRevisione:"2025-06-11", prossimaRevisione:"2027-06-11", annoComp:2017},
      {tipo:"CENTRALINA AUSILIARIA",   modello:"HOLMATRO PPU 15 C",                      matricola:"154577",    pressione:"720 BAR", statoComp:"Ottimo", olio:"HV 15/22", candela:"CHAMPIONS Z9Y", ultimaRevisione:"2025-06-11", prossimaRevisione:"2027-06-11", annoComp:2006},
      {tipo:"PISTONE",                 modello:"HOLMATRO TR5350LP",                       matricola:"1368615HH", pressione:"720 BAR", statoComp:"Ottimo", olio:"",         candela:"",              ultimaRevisione:"2025-06-11", prossimaRevisione:"2027-06-11", annoComp:2020},
      {tipo:"MORSA DI SOSTEGNO",       modello:"HOLMATRO HRS22",                          matricola:"153.01.11", pressione:"720 BAR", statoComp:"Ottimo", olio:"",         candela:"",              ultimaRevisione:"2025-06-11", prossimaRevisione:"2027-06-11", annoComp:2020},
    ]
  },

  // ── KIT 2 · MAGAZZINO · RESQTEC 720 BAR ───────────────────
  {
    id:"gt-2", numero:"2", nome:"Magazzino RESQTEC", mezzo:"MAGAZZINO",
    tipoMezzo:"", dislocazione:"Magazzino", annoAcquisto:2017,
    sistema:"elettrico", marca:"RESQTEC", stato:"magazzino",
    componenti:[
      {tipo:"CESOIA/DIVARICATORE COMBINATI", modello:"RESQTEC P4 Combi Set", matricola:"833575", pressione:"720 BAR", statoComp:"Ottimo", olio:"ELETTRICO", candela:"", ultimaRevisione:null, prossimaRevisione:"NO REVISIONE", annoComp:2017},
    ]
  },
];