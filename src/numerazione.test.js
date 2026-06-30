import {
  parseMatricolaLucca, formatMatricolaLucca, categoriaDaTipo, categoriaDaCodice,
  rinumeraSeriali, rinumeraCuscini, suggerisciIndice, suggerisciMatricola,
  ordinaCanonicoCuscini,
} from "./numerazione";
import { kitData } from "./data/kitData";

describe("parse/format/categoria", () => {
  test("parse accetta formato con e senza spazi", () => {
    expect(parseMatricolaLucca("CS 8 SI 1")).toEqual({ cat: "CS", bar: 8, index: 1 });
    expect(parseMatricolaLucca("CS8SI29")).toEqual({ cat: "CS", bar: 8, index: 29 });
    expect(parseMatricolaLucca("CS 10 SI 4")).toEqual({ cat: "CS", bar: 10, index: 4 });
  });
  test("parse ritorna null su input non valido", () => {
    expect(parseMatricolaLucca("")).toBeNull();
    expect(parseMatricolaLucca(null)).toBeNull();
    expect(parseMatricolaLucca("XX 8 SI 1")).toBeNull();
    expect(parseMatricolaLucca("91535")).toBeNull();
  });
  test("format usa il formato con spazi", () => {
    expect(formatMatricolaLucca("CS", 8, 1)).toBe("CS 8 SI 1");
    expect(formatMatricolaLucca("RV", 12, 3)).toBe("RV 12 SI 3");
  });
  test("categoriaDaTipo mappa i tipi componente", () => {
    expect(categoriaDaTipo("CUSCINO 60X60")).toBe("CS");
    expect(categoriaDaTipo("TUBO 5MT")).toBe("TB");
    expect(categoriaDaTipo("CENTRALINA")).toBe("CN");
    expect(categoriaDaTipo("RIDUTTORE")).toBe("RP");
    expect(categoriaDaTipo("RUB. VALVOLARE")).toBe("RV");
    expect(categoriaDaTipo("SCONOSCIUTO")).toBeNull();
  });
  test("categoriaDaCodice estrae la categoria dal codice", () => {
    expect(categoriaDaCodice("CN 8 SI 8")).toBe("CN");
    expect(categoriaDaCodice("boh")).toBeNull();
  });
});

// Dataset golden: appendice di numerazione.md (ordine = appearance reale del DB)
const GOLDEN = `
CS8SI1->CS8SI1
CN8SI1->CN8SI1
RP8SI1->RP8SI1
TB8SI1->TB8SI1
CS10SI4->CS10SI2
CS10SI5->CS10SI3
CS10SI6->CS10SI4
CN10SI13->CN10SI2
RP10SI3->RP10SI2
TB10SI2->TB10SI2
TB10SI11->TB10SI3
TB10SI4->TB10SI4
TB10SI5->TB10SI5
RV10SI7->RV10SI1
CS8SI29->CS8SI5
CS8SI30->CS8SI6
CS8SI31->CS8SI7
CN8SI7->CN8SI3
RP8SI8->RP8SI3
TB8SI24->TB8SI6
TB8SI25->TB8SI7
TB8SI26->TB8SI8
CS8SI7->CS8SI8
CS8SI8->CS8SI9
CS8SI9->CS8SI10
CN8SI3->CN8SI4
RP8SI4->RP8SI4
TB8SI12->TB8SI9
TB8SI13->TB8SI10
TB8SI14->TB8SI11
CS8SI10->CS8SI11
CS8SI11->CS8SI12
CS8SI12->CS8SI13
CN8SI4->CN8SI5
RP8SI5->RP8SI5
TB8SI15->TB8SI12
TB8SI16->TB8SI13
TB8SI17->TB8SI14
RV8SI6->RV8SI2
CS12SI1->CS12SI14
CS12SI2->CS12SI15
CS12SI3->CS12SI16
CN12SI1->CN12SI6
RP12SI1->RP12SI6
TB12SI1->TB12SI15
TB12SI2->TB12SI16
TB12SI3->TB12SI17
RV12SI4->RV12SI3
CS8SI0->CS8SI17
CS8SI0->CS8SI18
CN8SI0->CN8SI7
RP8SI0->RP8SI7
TB8SI0->TB8SI18
TB8SI0->TB8SI19
TB8SI0->TB8SI20
CS8SI24->CS8SI19
CS8SI25->CS8SI20
CN8SI8->CN8SI8
RP8SI9->RP8SI8
TB8SI27->TB8SI21
TB8SI28->TB8SI22
TB8SI29->TB8SI23
RV8SI1->RV8SI4
CS8SI26->CS8SI21
CS8SI27->CS8SI22
CS8SI28->CS8SI23
CS12SI4->CS12SI24
CN8SI9->CN8SI9
RP8SI10->RP8SI9
TB8SI30->TB8SI24
TB8SI31->TB8SI25
TB8SI32->TB8SI26
CS8SI13->CS8SI25
CS8SI14->CS8SI26
CS8SI15->CS8SI27
CN8SI5->CN8SI10
RP8SI6->RP8SI10
TB8SI18->TB8SI27
TB8SI19->TB8SI28
TB8SI20->TB8SI29
RV8SI5->RV8SI5
CS10SI1->CS10SI28
CS10SI2->CS10SI29
CS10SI3->CS10SI30
CN10SI1->CN10SI11
RP10SI1->RP10SI11
TB10SI1->TB10SI30
TB10SI2->TB10SI31
TB10SI3->TB10SI32
RV10SI2->RV10SI6
RV10SI3->RV10SI7
CS8SI2->CS8SI31
CS8SI3->CS8SI32
CN8SI2->CN8SI12
RP8SI2->RP8SI12
TB8SI6->TB8SI33
TB8SI7->TB8SI34
TB8SI8->TB8SI35
CS8SI18->CS8SI33
CS8SI19->CS8SI34
CS8SI20->CS8SI35
CN8SI6->CN8SI13
RP8SI7->RP8SI13
TB8SI21->TB8SI36
TB8SI22->TB8SI37
TB8SI23->TB8SI38
`.trim().split("\n").map(l => l.split("->"));

const strip = s => s.replace(/\s+/g, "");

describe("rinumeraSeriali", () => {
  test("riproduce esattamente il dataset golden dell'appendice", () => {
    const input = GOLDEN.map(p => p[0]);
    const atteso = GOLDEN.map(p => p[1]);
    const out = rinumeraSeriali(input).map(strip);
    expect(out).toEqual(atteso);
  });
  test("categoria singola parte da 1", () => {
    expect(rinumeraSeriali(["CS 8 SI 99"]).map(strip)).toEqual(["CS8SI1"]);
  });
  test("duplicati distinti per ordine di apparizione, bar preservato", () => {
    expect(rinumeraSeriali(["CS 8 SI 0", "CS 8 SI 0", "CS 10 SI 0"]).map(strip))
      .toEqual(["CS8SI1", "CS8SI2", "CS10SI3"]);
  });
  test("idempotente: una seconda passata non cambia nulla", () => {
    const input = GOLDEN.map(p => p[0]);
    const uno = rinumeraSeriali(input);
    const due = rinumeraSeriali(uno);
    expect(due.map(strip)).toEqual(uno.map(strip));
  });
  test("codici non parsabili restano invariati e non avanzano il contatore", () => {
    expect(rinumeraSeriali(["CS 8 SI 5", "boh", "CS 8 SI 9"]).map(strip))
      .toEqual(["CS8SI1", "BOH", "CS8SI2"]);
  });
});

describe("rinumeraCuscini", () => {
  const kits = [
    { id: "kit-4", numero: 4, componenti: [
      { tipo: "CUSCINO 60X60", matricolaLucca: "CS 8 SI 1" },
      { tipo: "CENTRALINA",    matricolaLucca: "CN 8 SI 1" },
    ]},
    { id: "kit-13", numero: 13, componenti: [
      { tipo: "CUSCINO 50X50", matricolaLucca: "CS 10 SI 4" },
      { tipo: "CUSCINO 50X50", matricolaLucca: "CS 10 SI 5" },
    ]},
  ];

  test("rinumera mantenendo la struttura e il bar", () => {
    const { kits: out } = rinumeraCuscini(kits);
    expect(out[0].componenti[0].matricolaLucca).toBe("CS 8 SI 1");
    expect(out[1].componenti[0].matricolaLucca).toBe("CS 10 SI 2");
    expect(out[1].componenti[1].matricolaLucca).toBe("CS 10 SI 3");
  });
  test("salva vecchio_codice sui componenti modificati", () => {
    const { kits: out } = rinumeraCuscini(kits);
    expect(out[1].componenti[0].vecchio_codice).toBe("CS 10 SI 4");
  });
  test("mappa elenca solo i cambiamenti con kit e indice", () => {
    const { mappa } = rinumeraCuscini(kits);
    expect(mappa).toEqual([
      { kitId: "kit-13", kitNumero: 13, compIndex: 0, tipo: "CUSCINO 50X50", vecchio: "CS 10 SI 4", nuovo: "CS 10 SI 2" },
      { kitId: "kit-13", kitNumero: 13, compIndex: 1, tipo: "CUSCINO 50X50", vecchio: "CS 10 SI 5", nuovo: "CS 10 SI 3" },
    ]);
  });
  test("idempotente: seconda passata produce mappa vuota e non sovrascrive vecchio_codice", () => {
    const uno = rinumeraCuscini(kits).kits;
    const { kits: due, mappa } = rinumeraCuscini(uno);
    expect(mappa).toEqual([]);
    expect(due[1].componenti[0].vecchio_codice).toBe("CS 10 SI 4");
  });
});

describe("migrazione end-to-end sui dati reali", () => {
  test("kitData ordinato canonicamente riproduce ESATTAMENTE l'appendice", () => {
    const ordinati = ordinaCanonicoCuscini(kitData);
    const { kits } = rinumeraCuscini(ordinati);
    const coppie = [];
    ordinati.forEach((k, ki) => (k.componenti || []).forEach((c, ci) => {
      coppie.push([strip(c.matricolaLucca), strip(kits[ki].componenti[ci].matricolaLucca)]);
    }));
    expect(coppie).toEqual(GOLDEN.map(p => [strip(p[0]), strip(p[1])]));
  });
});

describe("suggerimento", () => {
  const kits = [
    { componenti: [
      { tipo: "CUSCINO 60X60", matricolaLucca: "CS 8 SI 3" },
      { tipo: "CUSCINO 50X50", matricolaLucca: "CS 10 SI 7" },
      { tipo: "CENTRALINA",    matricolaLucca: "CN 8 SI 2" },
    ]},
  ];
  test("indice = max categoria (su tutti i bar) + 1", () => {
    expect(suggerisciIndice(kits, "CS")).toBe(8);
    expect(suggerisciIndice(kits, "CN")).toBe(3);
  });
  test("categoria assente parte da 1", () => {
    expect(suggerisciIndice(kits, "RV")).toBe(1);
    expect(suggerisciIndice([], "CS")).toBe(1);
  });
  test("suggerisciMatricola usa il bar passato e l'indice suggerito", () => {
    expect(suggerisciMatricola(kits, "CUSCINO 45X45", 8)).toBe("CS 8 SI 8");
    expect(suggerisciMatricola(kits, "CUSCINO 45X45", 12)).toBe("CS 12 SI 8");
  });
  test("tipo non mappabile → stringa vuota", () => {
    expect(suggerisciMatricola(kits, "SCONOSCIUTO", 8)).toBe("");
  });
});
