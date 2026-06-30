import { normalizzaEventi } from "./calendarioEventi";

const fns = {
  statoKit: k => k._stato,
  statoGT: g => g._stato,
  scadGT: g => g._scad,
};

test("normalizza tutte le sorgenti in eventi unificati", () => {
  const sorgenti = {
    kits: [
      { id: "kit-4", numero: 4, nome: "40/10", dataRevisione: "2026-09-25T00:00:00", _stato: "critico" },
      { id: "kit-9", numero: 9, nome: "Senza data", dataRevisione: null, _stato: "senza_data" },
    ],
    gruppi: [
      { id: "gt-1", numero: "1", nome: "APS 120", _scad: "2026-07-15", _stato: "attenzione" },
    ],
    pianificate: [
      { id: "p1", dataPrevista: "2026-06-12", sistema: "cuscini", kitNomi: ["Kit 4 — 40/10"], stato: "pianificata" },
    ],
    manutenzioni: [
      { id: "m1", data: "2026-06-09", gtNome: "APS 120", tipo: "Cambio olio" },
    ],
    promemoria: [
      { id: "r1", data: "2026-06-20", sistema: "taglio", titolo: "Controllo cesoia" },
    ],
  };
  expect(normalizzaEventi(sorgenti, fns)).toEqual([
    { id: "kit-4", data: "2026-09-25", sistema: "cuscini", tipo: "scadenza", nome: "Kit 4 — 40/10", stato: "critico" },
    { id: "gt-1", data: "2026-07-15", sistema: "taglio", tipo: "scadenza", nome: "Kit 1 — APS 120", stato: "attenzione" },
    { id: "p1", data: "2026-06-12", sistema: "cuscini", tipo: "pianificata", nome: "Kit 4 — 40/10", stato: "pianificata" },
    { id: "m1", data: "2026-06-09", sistema: "taglio", tipo: "manutenzione", nome: "APS 120 — Cambio olio", stato: "manutenzione" },
    { id: "r1", data: "2026-06-20", sistema: "taglio", tipo: "promemoria", nome: "Controllo cesoia", stato: "promemoria" },
  ]);
});

test("sorgenti vuote o mancanti → lista vuota", () => {
  expect(normalizzaEventi({}, fns)).toEqual([]);
});
