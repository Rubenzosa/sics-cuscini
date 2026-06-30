import { escapeCsv, buildCsv, buildHtmlReport } from "./export";

const fns = {
  statoLabelOf: it => it._lbl,
  scadOf: it => it._scad,
  scadFmt: d => d || "N/D",
};

describe("escapeCsv", () => {
  test("quota i valori con ; \" o newline", () => {
    expect(escapeCsv("ciao")).toBe("ciao");
    expect(escapeCsv("a;b")).toBe('"a;b"');
    expect(escapeCsv('vir"golette')).toBe('"vir""golette"');
    expect(escapeCsv(null)).toBe("");
  });
});

describe("buildCsv cuscini", () => {
  const kits = [
    { numero: 4, nome: "40/10", mezzo: "VF 16701", bar: 8, dislocazione: "Centrale", _lbl: "Regolare", _scad: "25/09/2026",
      componenti: [
        { tipo: "CUSCINO 60X60", modello: "MAXIFORCE", matricola: "91535", matricolaLucca: "CS 8 SI 1" },
        { tipo: "CENTRALINA", modello: "SILVANI", matricola: "890651", matricolaLucca: "CN 8 SI 1" },
      ] },
  ];
  test("intestazione include Matricola Lucca", () => {
    const csv = buildCsv(kits, "cuscini", fns);
    const [header] = csv.split("\r\n");
    expect(header).toContain("Matricola Lucca");
    expect(header.startsWith("N° Kit;Nome;Mezzo;Bar")).toBe(true);
  });
  test("una riga per componente, colonne kit ripetute", () => {
    const righe = buildCsv(kits, "cuscini", fns).split("\r\n");
    expect(righe).toHaveLength(3); // header + 2 componenti
    expect(righe[1]).toBe("4;40/10;VF 16701;8;Centrale;Regolare;25/09/2026;CUSCINO 60X60;MAXIFORCE;91535;CS 8 SI 1");
    expect(righe[2]).toContain("CN 8 SI 1");
  });
  test("kit senza componenti → una riga con campi componente vuoti", () => {
    const csv = buildCsv([{ numero: 9, nome: "Vuoto", mezzo: "", bar: 8, dislocazione: "Mag", _lbl: "Magazzino", _scad: "N/D", componenti: [] }], "cuscini", fns);
    const righe = csv.split("\r\n");
    expect(righe).toHaveLength(2);
    expect(righe[1]).toBe("9;Vuoto;;8;Mag;Magazzino;N/D;;;;");
  });
});

describe("buildCsv taglio", () => {
  test("intestazione e righe taglio (con pressione)", () => {
    const gruppi = [
      { numero: "1", nome: "APS 120", mezzo: "VF 29453", sistema: "elettrico", marca: "LUKAS", dislocazione: "Centrale", _lbl: "Regolare", _scad: "05/06/2028",
        componenti: [{ tipo: "CESOIA", modello: "LUKAS", matricola: "109542", pressione: "630 BAR" }] },
    ];
    const righe = buildCsv(gruppi, "taglio", fns).split("\r\n");
    expect(righe[0]).toContain("Pressione");
    expect(righe[1]).toBe("1;APS 120;VF 29453;elettrico;LUKAS;Centrale;Regolare;05/06/2028;CESOIA;LUKAS;109542;630 BAR");
  });
});

describe("buildHtmlReport", () => {
  test("produce HTML con titolo, kit e matricola Lucca", () => {
    const kits = [{ numero: 4, nome: "40/10", mezzo: "VF 1", bar: 8, dislocazione: "Centrale", _lbl: "Regolare", _scad: "25/09/2026",
      componenti: [{ tipo: "CUSCINO", modello: "MAXIFORCE", matricola: "91535", matricolaLucca: "CS 8 SI 1" }] }];
    const html = buildHtmlReport(kits, "cuscini", fns);
    expect(html).toContain("Cuscini di Sollevamento");
    expect(html).toContain("40/10");
    expect(html).toContain("CS 8 SI 1");
    expect(html).toContain("<table>");
  });
});
