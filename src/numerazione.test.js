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
  test("format usa il formato con spazi e indice su 3 cifre", () => {
    expect(formatMatricolaLucca("CS", 8, 1)).toBe("CS 8 SI 001");
    expect(formatMatricolaLucca("RV", 12, 3)).toBe("RV 12 SI 003");
    expect(formatMatricolaLucca("CS", 8, 106)).toBe("CS 8 SI 106");
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

// Dataset golden: appendice di numerazione.md (ordine = appearance reale del
// DB), contatore UNICO condiviso da tutte le categorie, indice su 3 cifre.
const GOLDEN = `
CS8SI1->CS8SI001
CN8SI1->CN8SI002
RP8SI1->RP8SI003
TB8SI1->TB8SI004
CS10SI4->CS10SI005
CS10SI5->CS10SI006
CS10SI6->CS10SI007
CN10SI13->CN10SI008
RP10SI3->RP10SI009
TB10SI2->TB10SI010
TB10SI11->TB10SI011
TB10SI4->TB10SI012
TB10SI5->TB10SI013
RV10SI7->RV10SI014
CS8SI29->CS8SI015
CS8SI30->CS8SI016
CS8SI31->CS8SI017
CN8SI7->CN8SI018
RP8SI8->RP8SI019
TB8SI24->TB8SI020
TB8SI25->TB8SI021
TB8SI26->TB8SI022
CS8SI7->CS8SI023
CS8SI8->CS8SI024
CS8SI9->CS8SI025
CN8SI3->CN8SI026
RP8SI4->RP8SI027
TB8SI12->TB8SI028
TB8SI13->TB8SI029
TB8SI14->TB8SI030
CS8SI10->CS8SI031
CS8SI11->CS8SI032
CS8SI12->CS8SI033
CN8SI4->CN8SI034
RP8SI5->RP8SI035
TB8SI15->TB8SI036
TB8SI16->TB8SI037
TB8SI17->TB8SI038
RV8SI6->RV8SI039
CS12SI1->CS12SI040
CS12SI2->CS12SI041
CS12SI3->CS12SI042
CN12SI1->CN12SI043
RP12SI1->RP12SI044
TB12SI1->TB12SI045
TB12SI2->TB12SI046
TB12SI3->TB12SI047
RV12SI4->RV12SI048
CS8SI0->CS8SI049
CS8SI0->CS8SI050
CN8SI0->CN8SI051
RP8SI0->RP8SI052
TB8SI0->TB8SI053
TB8SI0->TB8SI054
TB8SI0->TB8SI055
CS8SI24->CS8SI056
CS8SI25->CS8SI057
CN8SI8->CN8SI058
RP8SI9->RP8SI059
TB8SI27->TB8SI060
TB8SI28->TB8SI061
TB8SI29->TB8SI062
RV8SI1->RV8SI063
CS8SI26->CS8SI064
CS8SI27->CS8SI065
CS8SI28->CS8SI066
CS12SI4->CS12SI067
CN8SI9->CN8SI068
RP8SI10->RP8SI069
TB8SI30->TB8SI070
TB8SI31->TB8SI071
TB8SI32->TB8SI072
CS8SI13->CS8SI073
CS8SI14->CS8SI074
CS8SI15->CS8SI075
CN8SI5->CN8SI076
RP8SI6->RP8SI077
TB8SI18->TB8SI078
TB8SI19->TB8SI079
TB8SI20->TB8SI080
RV8SI5->RV8SI081
CS10SI1->CS10SI082
CS10SI2->CS10SI083
CS10SI3->CS10SI084
CN10SI1->CN10SI085
RP10SI1->RP10SI086
TB10SI1->TB10SI087
TB10SI2->TB10SI088
TB10SI3->TB10SI089
RV10SI2->RV10SI090
RV10SI3->RV10SI091
CS8SI2->CS8SI092
CS8SI3->CS8SI093
CN8SI2->CN8SI094
RP8SI2->RP8SI095
TB8SI6->TB8SI096
TB8SI7->TB8SI097
TB8SI8->TB8SI098
CS8SI18->CS8SI099
CS8SI19->CS8SI100
CS8SI20->CS8SI101
CN8SI6->CN8SI102
RP8SI7->RP8SI103
TB8SI21->TB8SI104
TB8SI22->TB8SI105
TB8SI23->TB8SI106
`.trim().split("\n").map(l => l.split("->"));

const strip = s => s.replace(/\s+/g, "");

describe("rinumeraSeriali", () => {
  test("riproduce esattamente il dataset golden dell'appendice", () => {
    const input = GOLDEN.map(p => p[0]);
    const atteso = GOLDEN.map(p => p[1]);
    const out = rinumeraSeriali(input).map(strip);
    expect(out).toEqual(atteso);
  });
  test("primo elemento parte da 001", () => {
    expect(rinumeraSeriali(["CS 8 SI 99"]).map(strip)).toEqual(["CS8SI001"]);
  });
  test("duplicati distinti per ordine di apparizione, bar preservato", () => {
    expect(rinumeraSeriali(["CS 8 SI 0", "CS 8 SI 0", "CS 10 SI 0"]).map(strip))
      .toEqual(["CS8SI001", "CS8SI002", "CS10SI003"]);
  });
  test("contatore unico condiviso tra categorie diverse", () => {
    expect(rinumeraSeriali(["CS 8 SI 9", "CN 8 SI 9", "RV 10 SI 1"]).map(strip))
      .toEqual(["CS8SI001", "CN8SI002", "RV10SI003"]);
  });
  test("wrap: dopo 999 riparte da 001", () => {
    const codici = Array.from({ length: 1000 }, () => "CS 8 SI 1");
    const out = rinumeraSeriali(codici).map(strip);
    expect(out[998]).toBe("CS8SI999");
    expect(out[999]).toBe("CS8SI001");
  });
  test("idempotente: una seconda passata non cambia nulla", () => {
    const input = GOLDEN.map(p => p[0]);
    const uno = rinumeraSeriali(input);
    const due = rinumeraSeriali(uno);
    expect(due.map(strip)).toEqual(uno.map(strip));
  });
  test("codici non parsabili restano invariati e non avanzano il contatore", () => {
    expect(rinumeraSeriali(["CS 8 SI 5", "boh", "CS 8 SI 9"]).map(strip))
      .toEqual(["CS8SI001", "BOH", "CS8SI002"]);
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

  test("rinumera mantenendo la struttura e il bar, contatore unico", () => {
    const { kits: out } = rinumeraCuscini(kits);
    expect(out[0].componenti[0].matricolaLucca).toBe("CS 8 SI 001");
    expect(out[0].componenti[1].matricolaLucca).toBe("CN 8 SI 002");
    expect(out[1].componenti[0].matricolaLucca).toBe("CS 10 SI 003");
    expect(out[1].componenti[1].matricolaLucca).toBe("CS 10 SI 004");
  });
  test("salva vecchio_codice sui componenti modificati", () => {
    const { kits: out } = rinumeraCuscini(kits);
    expect(out[1].componenti[0].vecchio_codice).toBe("CS 10 SI 4");
  });
  test("mappa elenca tutti i cambiamenti con kit e indice", () => {
    const { mappa } = rinumeraCuscini(kits);
    expect(mappa).toEqual([
      { kitId: "kit-4", kitNumero: 4, compIndex: 0, tipo: "CUSCINO 60X60", vecchio: "CS 8 SI 1", nuovo: "CS 8 SI 001" },
      { kitId: "kit-4", kitNumero: 4, compIndex: 1, tipo: "CENTRALINA", vecchio: "CN 8 SI 1", nuovo: "CN 8 SI 002" },
      { kitId: "kit-13", kitNumero: 13, compIndex: 0, tipo: "CUSCINO 50X50", vecchio: "CS 10 SI 4", nuovo: "CS 10 SI 003" },
      { kitId: "kit-13", kitNumero: 13, compIndex: 1, tipo: "CUSCINO 50X50", vecchio: "CS 10 SI 5", nuovo: "CS 10 SI 004" },
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
  test("indice = max GLOBALE (su tutte le categorie e i bar) + 1", () => {
    expect(suggerisciIndice(kits)).toBe(8);
  });
  test("nessun kit: parte da 1", () => {
    expect(suggerisciIndice([])).toBe(1);
  });
  test("suggerisciMatricola usa il bar passato e l'indice globale suggerito", () => {
    expect(suggerisciMatricola(kits, "CUSCINO 45X45", 8)).toBe("CS 8 SI 008");
    expect(suggerisciMatricola(kits, "CUSCINO 45X45", 12)).toBe("CS 12 SI 008");
  });
  test("tipo non mappabile → stringa vuota", () => {
    expect(suggerisciMatricola(kits, "SCONOSCIUTO", 8)).toBe("");
  });
});
