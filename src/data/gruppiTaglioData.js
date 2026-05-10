// ═══════════════════════════════════════════════════════════
// GRUPPI DA TAGLIO (SIMDB) — VVF SIENA
// Dati fedeli al foglio Excel Gruppi_da_taglio_SIMDB.xlsx
// ═══════════════════════════════════════════════════════════

export const gruppiTaglioData = [

  // ─────────────────────────────────────────────────────────
  // KIT 14/15 — 40/10 | VF 16701 | Anno: 2007
  // Sistema: OLEODINAMICO | 630 BAR | LUKAS
  // ─────────────────────────────────────────────────────────
  {
    id: "gt-40-10",
    numero: "14/15",
    nome: "40/10",
    mezzo: "VF 16701",
    tipoMezzo: "40/10",
    dislocazione: "Sede Centrale",
    annoAcquisto: 2007,
    sistema: "oleodinamico",
    marca: "LUKAS",
    stato: "attivo",
    componenti: [
      { tipo: "CENTRALINA OLEODINAMICA", modello: "LUKAS GW-6R",    matricola: "85207",    pressione: "630 BAR", statoComp: "Buono",       olio: "HLP10", candela: "",         ultimaRevisione: "2017-12-01", prossimaRevisione: null,         annoComp: 2007 },
      { tipo: "CENTRALINA OLEODINAMICA", modello: "LUKAS GA-2L",    matricola: "85228",    pressione: "630 BAR", statoComp: "Prossimo F.U.",olio: "HLP10", candela: "",         ultimaRevisione: "2017-12-01", prossimaRevisione: null,         annoComp: 2007 },
      { tipo: "DIVARICATORE",            modello: "LUKAS LSP 40 EN", matricola: "84900",    pressione: "630 BAR", statoComp: "Buono",       olio: "",      candela: "",         ultimaRevisione: "2017-12-01", prossimaRevisione: null,         annoComp: 2007 },
      { tipo: "CESOIA",                  modello: "LUKAS LS 330 EN", matricola: "84890",    pressione: "630 BAR", statoComp: "Buono",       olio: "",      candela: "",         ultimaRevisione: "2017-12-01", prossimaRevisione: null,         annoComp: 2007 },
      { tipo: "PISTONE",                 modello: "LUKAS LZ 3",      matricola: "85209",    pressione: "630 BAR", statoComp: "Buono",       olio: "",      candela: "",         ultimaRevisione: "2017-12-01", prossimaRevisione: null,         annoComp: 2007 },
      { tipo: "TUBI",                    modello: "",                matricola: "",          pressione: "630 BAR", statoComp: "Buono",       olio: "",      candela: "",         ultimaRevisione: "2017-12-01", prossimaRevisione: null,         annoComp: 2007 },
    ]
  },

  // ─────────────────────────────────────────────────────────
  // KIT 18/21 — APS ACTROS | VF 24491 | Anno: 2006
  // Sistema: OLEODINAMICO | 630 BAR | LUKAS
  // ─────────────────────────────────────────────────────────
  {
    id: "gt-aps-actros",
    numero: "18/21",
    nome: "APS ACTROS",
    mezzo: "VF 24491",
    tipoMezzo: "APS ACTROS",
    dislocazione: "Sede Centrale",
    annoAcquisto: 2006,
    sistema: "oleodinamico",
    marca: "LUKAS",
    stato: "attivo",
    componenti: [
      { tipo: "CENTRALINA OLEODINAMICA", modello: "LUKAS GW-6R",         matricola: "110375-006", pressione: "630 BAR", statoComp: "Ottimo", olio: "HLP10", candela: "NGK BR2-LM", ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2006 },
      { tipo: "CENTRALINA AUSILIARIA",   modello: "INTERFRON VP700-I",   matricola: "151",         pressione: "630 BAR", statoComp: "Ottimo", olio: "HLP10", candela: "",         ultimaRevisione: null,          prossimaRevisione: "2024-12-01", annoComp: 2006 },
      { tipo: "CESOIA",                  modello: "LUKAS LS 200 EN",     matricola: "109542",      pressione: "630 BAR", statoComp: "Ottimo", olio: "",      candela: "",         ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2006 },
      { tipo: "DIVARICATORE",            modello: "LUKAS LSP 40 EN",     matricola: "109089",      pressione: "630 BAR", statoComp: "Ottimo", olio: "",      candela: "",         ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2006 },
      { tipo: "PISTONE",                 modello: "LUKAS LOR 12-700 EN", matricola: "116086",      pressione: "630 BAR", statoComp: "Ottimo", olio: "",      candela: "",         ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2006 },
      { tipo: "POMPA MANUALE",           modello: "LUKAS LH2/1.8-63",    matricola: "0701-11",     pressione: "630 BAR", statoComp: "Ottimo", olio: "HLP10", candela: "",         ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2006 },
    ]
  },

  // ─────────────────────────────────────────────────────────
  // KIT 1 — APS 120 | VF 29453 | Anno: 2018/2019
  // Sistema: ELETTRICO | 720 BAR | LUKAS
  // ─────────────────────────────────────────────────────────
  {
    id: "gt-aps-120",
    numero: "1",
    nome: "APS 120",
    mezzo: "VF 29453",
    tipoMezzo: "APS 120",
    dislocazione: "Sede Centrale",
    annoAcquisto: 2018,
    sistema: "elettrico",
    marca: "LUKAS",
    stato: "attivo",
    componenti: [
      { tipo: "DIVARICATORE ELETTRICO", modello: "LUKAS SP 333 E2", matricola: "310657 00014", pressione: "720 BAR", statoComp: "Ottimo", olio: "ELETTRICO", candela: "", ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2018 },
      { tipo: "CESOIA ELETTRICA",       modello: "LUKAS S 377 E2",  matricola: "312148 00007", pressione: "720 BAR", statoComp: "Ottimo", olio: "ELETTRICO", candela: "", ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2018 },
      { tipo: "PISTONE ELETTRICO",      modello: "LUKAS R 421 E2",  matricola: "323749",       pressione: "720 BAR", statoComp: "Ottimo", olio: "ELETTRICO", candela: "", ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2019 },
    ]
  },

  // ─────────────────────────────────────────────────────────
  // KIT 6 — APS 120/20 | VF 31450 | Anno: 2021
  // Sistema: ELETTRICO | 720 BAR | LUKAS
  // ─────────────────────────────────────────────────────────
  {
    id: "gt-aps-120-20",
    numero: "6",
    nome: "APS 120/20",
    mezzo: "VF 31450",
    tipoMezzo: "APS 120/20",
    dislocazione: "Sede Centrale",
    annoAcquisto: 2021,
    sistema: "elettrico",
    marca: "LUKAS",
    stato: "attivo",
    componenti: [
      { tipo: "DIVARICATORE ELETTRICO", modello: "LUKAS SP333- eWXT", matricola: "344585-00001", pressione: "720 BAR", statoComp: "Ottimo", olio: "ELETTRICO", candela: "", ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2021 },
      { tipo: "CESOIA ELETTRICA",       modello: "LUKAS S378- eWXT",  matricola: "344359-00004", pressione: "720 BAR", statoComp: "Ottimo", olio: "ELETTRICO", candela: "", ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2021 },
      { tipo: "PISTONE ELETTRICO",      modello: "LUKAS R 520- eWXT", matricola: "345484-00001", pressione: "720 BAR", statoComp: "Ottimo", olio: "ELETTRICO", candela: "", ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2021 },
      { tipo: "MORSA DI SOSTEGNO",      modello: "LUKAS LRS-C",       matricola: "18071874",     pressione: "",        statoComp: "Ottimo", olio: "",          candela: "", ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2021 },
    ]
  },

  // ─────────────────────────────────────────────────────────
  // KIT 5 — APS VOLVO | VF 26504 | Anno: 2021
  // Sistema: ELETTRICO | 720 BAR | LUKAS
  // ─────────────────────────────────────────────────────────
  {
    id: "gt-aps-volvo",
    numero: "5",
    nome: "APS VOLVO",
    mezzo: "VF 26504",
    tipoMezzo: "APS VOLVO",
    dislocazione: "Sede Centrale",
    annoAcquisto: 2021,
    sistema: "elettrico",
    marca: "LUKAS",
    stato: "attivo",
    componenti: [
      { tipo: "DIVARICATORE ELETTRICO", modello: "LUKAS SP 333 E2", matricola: "335801-00006",  pressione: "720 BAR", statoComp: "Ottimo", olio: "ELETTRICO", candela: "", ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2021 },
      { tipo: "CESOIA ELETTRICA",       modello: "LUKAS S 377 E2",  matricola: "334872-00007",  pressione: "720 BAR", statoComp: "Ottimo", olio: "ELETTRICO", candela: "", ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2021 },
      { tipo: "PISTONE ELETTRICO",      modello: "LUKAS R 410 E2",  matricola: "334870-00009",  pressione: "720 BAR", statoComp: "Ottimo", olio: "ELETTRICO", candela: "", ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2021 },
      { tipo: "MORSA DI SOSTEGNO",      modello: "",                matricola: "",               pressione: "",        statoComp: "Ottimo", olio: "",          candela: "", ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2021 },
    ]
  },

  // ─────────────────────────────────────────────────────────
  // KIT 19 — APS 100 | VF 20946 | Anno: 2015
  // Sistema: OLEODINAMICO | 720 BAR | HOLMATRO
  // ─────────────────────────────────────────────────────────
  {
    id: "gt-aps-100",
    numero: "19",
    nome: "APS 100",
    mezzo: "VF 20946",
    tipoMezzo: "APS 100",
    dislocazione: "Sede Centrale",
    annoAcquisto: 2015,
    sistema: "oleodinamico",
    marca: "HOLMATRO",
    stato: "attivo",
    componenti: [
      { tipo: "CENTRALINA OLEODINAMICA", modello: "HOLMATRO SR20 PC2",  matricola: "1261646HH",  pressione: "720 BAR", statoComp: "Ottimo", olio: "HV 15/22", candela: "NGK CR5HSB", ultimaRevisione: "2023-07-15", prossimaRevisione: "2025-07-15", annoComp: 2015 },
      { tipo: "CESOIA",                  modello: "HOLMATRO CU 5050",   matricola: "1261830HH",  pressione: "720 BAR", statoComp: "Ottimo", olio: "",         candela: "",          ultimaRevisione: "2023-07-15", prossimaRevisione: "2025-07-15", annoComp: 2015 },
      { tipo: "DIVARICATORE",            modello: "HOLMATRO SP 5240",   matricola: "1261533HH",  pressione: "720 BAR", statoComp: "Ottimo", olio: "",         candela: "",          ultimaRevisione: "2023-07-15", prossimaRevisione: "2025-07-15", annoComp: 2015 },
      { tipo: "PISTONE",                 modello: "HOLMATRO TR 4350 C", matricola: "1262313HH",  pressione: "720 BAR", statoComp: "Ottimo", olio: "",         candela: "",          ultimaRevisione: "2023-07-15", prossimaRevisione: "2025-07-15", annoComp: 2015 },
      { tipo: "MORSA DI SOSTEGNO",       modello: "",                   matricola: "",            pressione: "",        statoComp: "Ottimo", olio: "",         candela: "",          ultimaRevisione: "2023-07-15", prossimaRevisione: "2025-07-15", annoComp: null },
      { tipo: "TUBI",                    modello: "HOLMATRO",           matricola: "",            pressione: "720 BAR", statoComp: "Ottimo", olio: "",         candela: "",          ultimaRevisione: "2023-07-15", prossimaRevisione: "2025-07-15", annoComp: 2015 },
    ]
  },

  // ─────────────────────────────────────────────────────────
  // KIT 3 — APS MAN | VF 29926 | Anno: 2019
  // Sistema: ELETTRICO | 720 BAR | WEBER
  // ─────────────────────────────────────────────────────────
  {
    id: "gt-aps-man",
    numero: "3",
    nome: "APS MAN",
    mezzo: "VF 29926",
    tipoMezzo: "APS MAN",
    dislocazione: "Sede Centrale",
    annoAcquisto: 2019,
    sistema: "elettrico",
    marca: "WEBER",
    stato: "attivo",
    componenti: [
      { tipo: "DIVARICATORE ELETTRICO", modello: "WEBER SP44 AS",           matricola: "489-11/19 A",  pressione: "720 BAR", statoComp: "Ottimo", olio: "ELETTRICO", candela: "", ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2019 },
      { tipo: "CESOIA ELETTRICA",       modello: "WEBER RSU180 Plus",       matricola: "484-11/19 A",  pressione: "720 BAR", statoComp: "Ottimo", olio: "ELETTRICO", candela: "", ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2019 },
      { tipo: "PISTONE ELETTRICO",      modello: "WEBER RZ 1-910 E FORCE 2",matricola: "1076272",      pressione: "720 BAR", statoComp: "Ottimo", olio: "ELETTRICO", candela: "", ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2019 },
      { tipo: "MORSA DI SOSTEGNO",      modello: "",                        matricola: "",             pressione: "",        statoComp: "Ottimo", olio: "ELETTRICO", candela: "", ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: 2019 },
    ]
  },

  // ─────────────────────────────────────────────────────────
  // KIT 4 — APS 180 Montepulciano | VF 30217 | Anno: 2018
  // Sistema: OLEODINAMICO | 720 BAR | HOLMATRO
  // ─────────────────────────────────────────────────────────
  {
    id: "gt-aps-180-montepulciano",
    numero: "4",
    nome: "APS 180 Montepulciano",
    mezzo: "VF 30217",
    tipoMezzo: "APS 180",
    dislocazione: "Montepulciano",
    annoAcquisto: 2018,
    sistema: "oleodinamico",
    marca: "HOLMATRO",
    stato: "attivo",
    componenti: [
      { tipo: "CENTRALINA OLEODINAMICA", modello: "HOLMATRO SR40 PC 2", matricola: "1320544HH",  pressione: "720 BAR", statoComp: "Ottimo", olio: "HV 15/22", candela: "NGK-R BPR6ES", ultimaRevisione: "2025-05-29", prossimaRevisione: "2027-05-29", annoComp: 2018 },
      { tipo: "POMPA MANUALE",           modello: "HOLMATRO PA18 H2C",  matricola: "1262435HH",  pressione: "720 BAR", statoComp: "Ottimo", olio: "HV 15/22", candela: "",            ultimaRevisione: "2025-06-11", prossimaRevisione: "2027-06-11", annoComp: 2018 },
      { tipo: "DIVARICATORE",            modello: "HOLMATRO SP 4240C",  matricola: "162735",      pressione: "720 BAR", statoComp: "Ottimo", olio: "HV 15/22", candela: "",            ultimaRevisione: "2025-05-29", prossimaRevisione: "2027-05-29", annoComp: 2018 },
      { tipo: "CESOIA",                  modello: "HOLMATRO CU 4050C",  matricola: "162965",      pressione: "720 BAR", statoComp: "Ottimo", olio: "HV 15/22", candela: "",            ultimaRevisione: "2025-05-29", prossimaRevisione: "2027-05-29", annoComp: 2018 },
      { tipo: "PISTONE",                 modello: "HOLMATRO RA 4321C",  matricola: "160445",      pressione: "720 BAR", statoComp: "Ottimo", olio: "HV 15/22", candela: "",            ultimaRevisione: "2025-05-29", prossimaRevisione: "2027-05-29", annoComp: 2018 },
      { tipo: "TUBI 10 MT",              modello: "HOLMATRO",           matricola: "",            pressione: "720 BAR", statoComp: "Ottimo", olio: "HV 15/22", candela: "",            ultimaRevisione: "2025-05-29", prossimaRevisione: "2027-05-29", annoComp: 2018 },
    ]
  },

  // ─────────────────────────────────────────────────────────
  // KIT 4 — POLISOCCORSO | VF 29068 | Anno: 2021
  // Sistema: ELETTRICO | 720 BAR | LUKAS
  // ─────────────────────────────────────────────────────────
  {
    id: "gt-polisoccorso",
    numero: "4",
    nome: "POLISOCCORSO",
    mezzo: "VF 29068",
    tipoMezzo: "POLISOCCORSO",
    dislocazione: "Sede Centrale",
    annoAcquisto: 2021,
    sistema: "elettrico",
    marca: "LUKAS",
    stato: "attivo",
    componenti: [
      { tipo: "DIVARICATORE ELETTRICO", modello: "LUKAS SP 333 E2", matricola: "333637-00004", pressione: "720 BAR", statoComp: "Ottimo", olio: "ELETTRICO", candela: "", ultimaRevisione: "2024-03-15", prossimaRevisione: "2027-03-15", annoComp: 2021 },
      { tipo: "CESOIA ELETTRICA",       modello: "LUKAS S 377 E2",  matricola: "333571-00004", pressione: "720 BAR", statoComp: "Ottimo", olio: "ELETTRICO", candela: "", ultimaRevisione: "2024-03-15", prossimaRevisione: "2027-03-15", annoComp: 2021 },
      { tipo: "PISTONE ELETTRICO",      modello: "LUKAS R 410 E2",  matricola: "334475-00006", pressione: "720 BAR", statoComp: "Ottimo", olio: "ELETTRICO", candela: "", ultimaRevisione: "2024-03-15", prossimaRevisione: "2027-03-15", annoComp: 2021 },
      { tipo: "MORSA DI SOSTEGNO",      modello: "",                matricola: "",             pressione: "720 BAR", statoComp: "Ottimo", olio: "ELETTRICO", candela: "", ultimaRevisione: "2024-03-15", prossimaRevisione: "2027-03-15", annoComp: 2021 },
    ]
  },

  // ─────────────────────────────────────────────────────────
  // KIT 20/18 — APS 180 Montalcino | VF 30725 | Anno: 2015
  // Sistema: OLEODINAMICO | 720 BAR | HOLMATRO
  // ─────────────────────────────────────────────────────────
  {
    id: "gt-aps-180-montalcino",
    numero: "20/18",
    nome: "APS 180 Montalcino",
    mezzo: "VF 30725",
    tipoMezzo: "APS 180",
    dislocazione: "Montalcino",
    annoAcquisto: 2015,
    sistema: "oleodinamico",
    marca: "HOLMATRO",
    stato: "attivo",
    componenti: [
      { tipo: "MORSA DI SOSTEGNO",       modello: "LUKAS LRS-C",        matricola: "6332",      pressione: "",        statoComp: "Ottimo", olio: "",         candela: "",              ultimaRevisione: "2025-06-05", prossimaRevisione: "2028-06-05", annoComp: null },
      { tipo: "CENTRALINA OLEODINAMICA", modello: "HOLMATRO SR20 PC2",  matricola: "1261645HH", pressione: "720 BAR", statoComp: "Ottimo", olio: "HV 15/22", candela: "DENSO U16FSR-UB", ultimaRevisione: "2025-05-29", prossimaRevisione: "2027-05-29", annoComp: 2015 },
      { tipo: "CESOIA",                  modello: "HOLMATRO CU 5050",   matricola: "1261350HH", pressione: "720 BAR", statoComp: "Ottimo", olio: "",         candela: "",              ultimaRevisione: "2025-05-29", prossimaRevisione: "2027-05-29", annoComp: 2015 },
      { tipo: "DIVARICATORE",            modello: "HOLMATRO SP 5240",   matricola: "1261584HH", pressione: "720 BAR", statoComp: "Ottimo", olio: "",         candela: "",              ultimaRevisione: "2025-05-29", prossimaRevisione: "2027-05-29", annoComp: 2015 },
      { tipo: "PISTONE",                 modello: "HOLMATRO TR 4350 C", matricola: "1262429HH", pressione: "720 BAR", statoComp: "Ottimo", olio: "",         candela: "",              ultimaRevisione: "2025-05-29", prossimaRevisione: "2027-05-29", annoComp: 2015 },
      { tipo: "POMPA MANUALE",           modello: "HOLMATRO PA18 H2C",  matricola: "1262434HH", pressione: "720 BAR", statoComp: "Ottimo", olio: "HV 15/22", candela: "",              ultimaRevisione: "2025-05-29", prossimaRevisione: "2027-05-29", annoComp: 2015 },
    ]
  },

  // ─────────────────────────────────────────────────────────
  // KIT 22 — APS 140 4X4 | VF 22777 | Anno: 2017/2020
  // Sistema: OLEODINAMICO | 720 BAR | HOLMATRO
  // ─────────────────────────────────────────────────────────
  {
    id: "gt-aps-140-4x4",
    numero: "22/17",
    nome: "APS 140 4X4",
    mezzo: "VF 22777",
    tipoMezzo: "APS 140 4X4",
    dislocazione: "Sede Centrale",
    annoAcquisto: 2017,
    sistema: "oleodinamico",
    marca: "HOLMATRO",
    stato: "attivo",
    componenti: [
      { tipo: "CENTRALINA OLEODINAMICA", modello: "HOLMATRO SR20 PC2",  matricola: "1293847HH", pressione: "720 BAR", statoComp: "Ottimo", olio: "HV 15/22", candela: "NGK CR5HSB",    ultimaRevisione: "2025-06-11", prossimaRevisione: "2027-06-11", annoComp: 2017 },
      { tipo: "CESOIA",                  modello: "HOLMATRO CU 5050",   matricola: "1294309HH", pressione: "720 BAR", statoComp: "Ottimo", olio: "",         candela: "",              ultimaRevisione: "2025-06-11", prossimaRevisione: "2027-06-11", annoComp: 2017 },
      { tipo: "DIVARICATORE",            modello: "HOLMATRO SP 5250",   matricola: "1294649HH", pressione: "720 BAR", statoComp: "Ottimo", olio: "",         candela: "",              ultimaRevisione: "2025-06-11", prossimaRevisione: "2027-06-11", annoComp: 2017 },
      { tipo: "TUBI",                    modello: "HOLMATRO CO 5BU",    matricola: "",           pressione: "720 BAR", statoComp: "Ottimo", olio: "",         candela: "",              ultimaRevisione: "2025-06-11", prossimaRevisione: "2027-06-11", annoComp: 2017 },
      { tipo: "CENTRALINA AUSILIARIA",   modello: "HOLMATRO PPU 15 C",  matricola: "154577",     pressione: "720 BAR", statoComp: "Ottimo", olio: "HV 15/22", candela: "CHAMPIONS Z9Y", ultimaRevisione: "2025-06-11", prossimaRevisione: "2027-06-11", annoComp: 2006 },
      { tipo: "PISTONE",                 modello: "HOLMATRO TR5350LP",  matricola: "1368615HH", pressione: "720 BAR", statoComp: "Ottimo", olio: "",         candela: "",              ultimaRevisione: "2025-06-11", prossimaRevisione: "2027-06-11", annoComp: 2020 },
      { tipo: "MORSA DI SOSTEGNO",       modello: "HOLMATRO HRS22",     matricola: "532471",     pressione: "720 BAR", statoComp: "Ottimo", olio: "",         candela: "",              ultimaRevisione: "2025-06-11", prossimaRevisione: "2027-06-11", annoComp: 2020 },
    ]
  },

  // ─────────────────────────────────────────────────────────
  // KIT 10 — FUORI SERVIZIO | Anno: 1998
  // Sistema: OLEODINAMICO | 630 BAR | LUKAS
  // ─────────────────────────────────────────────────────────
  {
    id: "gt-fuori-servizio",
    numero: "10",
    nome: "Fuori Servizio",
    mezzo: "FUORI SERVIZIO",
    tipoMezzo: "",
    dislocazione: "Magazzino",
    annoAcquisto: 1998,
    sistema: "oleodinamico",
    marca: "LUKAS",
    stato: "fuori_servizio",
    componenti: [
      { tipo: "CENTRALINA OLEODINAMICA", modello: "LUKAS Hydr.GS-2R", matricola: "00128354 0005",   pressione: "630 BAR", statoComp: "Fuori uso", olio: "HLP10", candela: "NGK BR2-LM", ultimaRevisione: "2017-07-01", prossimaRevisione: "2020-07-01", annoComp: 1998 },
      { tipo: "DIVARICATORE",            modello: "LUKAS LS 200B",     matricola: "0105773211 007",  pressione: "630 BAR", statoComp: "Fuori uso", olio: "HLP10", candela: "",          ultimaRevisione: "2017-07-01", prossimaRevisione: "2020-07-01", annoComp: 1998 },
      { tipo: "CESOIA",                  modello: "LUKAS LSP 40B",     matricola: "57542701",        pressione: "630 BAR", statoComp: "Fuori uso", olio: "HLP10", candela: "",          ultimaRevisione: "2017-07-01", prossimaRevisione: "2020-07-01", annoComp: 1998 },
      { tipo: "TUBI 10 MT",              modello: "LUKAS",             matricola: "",                pressione: "630 BAR", statoComp: "Fuori uso", olio: "HLP10", candela: "",          ultimaRevisione: "2017-07-01", prossimaRevisione: "2020-07-01", annoComp: null },
    ]
  },

  // ─────────────────────────────────────────────────────────
  // KIT 12/2 — MAGAZZINO | Anno: 2002/2017
  // ─────────────────────────────────────────────────────────
  {
    id: "gt-magazzino",
    numero: "12/2",
    nome: "Magazzino",
    mezzo: "MAGAZZINO",
    tipoMezzo: "",
    dislocazione: "Magazzino",
    annoAcquisto: 2002,
    sistema: "misto",
    marca: "ZUMBO/RESQTEC",
    stato: "magazzino",
    componenti: [
      { tipo: "CENTRALINA OLEODINAMICA",       modello: "ZUMBO RSQ",           matricola: "13271",  pressione: "350 BAR", statoComp: "Ottimo", olio: "",          candela: "", ultimaRevisione: "2021-04-01", prossimaRevisione: "2024-04-01", annoComp: 2002 },
      { tipo: "CESOIA/DIVARICATORE COMBINATI",  modello: "",                    matricola: "13152",  pressione: "350 BAR", statoComp: "Ottimo", olio: "",          candela: "", ultimaRevisione: "2021-04-01", prossimaRevisione: "2024-04-01", annoComp: 2002 },
      { tipo: "CESOIA/DIVARICATORE COMBINATI",  modello: "RESQTEC P4 Combi Set",matricola: "833575", pressione: "720 BAR", statoComp: "Ottimo", olio: "ELETTRICO", candela: "", ultimaRevisione: null,          prossimaRevisione: "NO REVISIONE", annoComp: 2017 },
    ]
  },
];