import { contaStats, scortaMancante, daFare } from "./inventario";
import { isoLocale } from "./utils";

const tra = n => isoLocale(new Date(Date.now() + n * 86400000));

const calc = it => it._stato; // calcStato finto per il test

describe("contaStats", () => {
  const items = [
    { stato: "attivo", _stato: "regolare" },
    { stato: "attivo", _stato: "critico" },
    { stato: "attivo", _stato: "attenzione" },
    { stato: "attivo", _stato: "scaduto" },
    { stato: "magazzino", _stato: "magazzino" },
    { stato: "magazzino", _stato: "magazzino" },
  ];
  test("conta operativi/inScadenza/scaduti/magazzino", () => {
    expect(contaStats(items, calc)).toEqual({ operativi: 4, inScadenza: 2, scaduti: 1, magazzino: 2 });
  });
  test("lista vuota → tutti zero", () => {
    expect(contaStats([], calc)).toEqual({ operativi: 0, inScadenza: 0, scaduti: 0, magazzino: 0 });
  });
});

describe("scortaMancante", () => {
  test("true se nessun magazzino", () => {
    expect(scortaMancante([{ stato: "attivo" }])).toBe(true);
  });
  test("false se almeno un magazzino", () => {
    expect(scortaMancante([{ stato: "attivo" }, { stato: "magazzino" }])).toBe(false);
  });
});

describe("daFare", () => {
  test("cuscini: scaduta, fermi, in scadenza in quest'ordine", () => {
    const items = [
      { id:"a", stato:"attivo", dataRevisione: tra(30), componenti:[] },
      { id:"b", stato:"attivo", dataRevisione: tra(400), componenti:[{ tipo:"RIDUTTORE", matricolaLucca:"RP 10 SI 3", fuoriUso:true }] },
      { id:"c", stato:"attivo", dataRevisione: tra(-12), componenti:[] },
    ];
    const r = daFare(items, false);
    expect(r.map(x => [x.item.id, x.tipo])).toEqual([["c","scaduta"],["b","fermi"],["a","in_scadenza"]]);
    expect(r[1].titolo).toBe("1 componente fuori uso");
    expect(r[1].dettaglio).toBe("RIDUTTORE RP 10 SI 3 — da sostituire");
  });
  test("kit con revisione scaduta e fuori uso → due righe", () => {
    const r = daFare([{ id:"x", stato:"attivo", dataRevisione: tra(-1), componenti:[{ tipo:"TUBO", fuoriUso:true },{ tipo:"TUBO", fuoriUso:true }] }], false);
    expect(r.map(x => x.tipo)).toEqual(["scaduta","fermi"]);
    expect(r[1].titolo).toBe("2 componenti fuori uso");
    expect(r[1].dettaglio).toBe("vedi componenti");
  });
  test("esclude fuori_uso e kit senza data revisione", () => {
    expect(daFare([
      { stato:"fuori_uso", dataRevisione: tra(-5), componenti:[] },
      { stato:"attivo", dataRevisione: null, componenti:[] },
    ], false)).toEqual([]);
  });
  test("taglio: componente in revisione", () => {
    const gt = { id:"g", stato:"attivo", componenti:[
      { tipo:"CENTRALINA", matricola:"85207", prossimaRevisione: tra(400) },
      { tipo:"CENTRALINA", matricola:"85228", prossimaRevisione: tra(400), statoOperativo:"in_revisione" },
    ]};
    const r = daFare([gt], true);
    expect(r).toHaveLength(1);
    expect(r[0].titolo).toBe("1 componente fermo");
    expect(r[0].dettaglio).toBe("CENTRALINA 85228 — in revisione");
  });
  test("frase corta per la riga compatta", () => {
    const r = daFare([
      { id:"s", stato:"attivo", dataRevisione: tra(-3), componenti:[{ tipo:"RIDUTTORE", fuoriUso:true }] },
      { id:"p", stato:"attivo", dataRevisione: tra(20), componenti:[{ tipo:"TUBO", fuoriUso:true },{ tipo:"TUBO", fuoriUso:true }] },
    ], false);
    expect(r.slice(0, 3).map(x => x.breve)).toEqual(["Revisione scaduta", "Riduttore fuori uso", "2 componenti fuori uso"]);
    expect(r[3].breve).toMatch(/^Revisione fra (19|20) gg$/); // giorniAllaScadenza arrotonda per difetto
    const gt = daFare([{ stato:"attivo", componenti:[{ tipo:"PISTONE ELETTRICO", matricola:"1", prossimaRevisione: tra(400), statoOperativo:"fuori_servizio" }] }], true);
    expect(gt[0].breve).toBe("Pistone elettrico fermo");
  });
  test("taglio: tutti i componenti fermi → solo riga fermi", () => {
    const gt = { stato:"attivo", componenti:[{ tipo:"CESOIA", matricola:"1", prossimaRevisione: tra(-3), statoOperativo:"fuori_servizio" }] };
    expect(daFare([gt], true).map(x => x.tipo)).toEqual(["fermi"]);
  });
});
