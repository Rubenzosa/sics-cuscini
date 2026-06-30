import { contaStats, scortaMancante } from "./inventario";

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
