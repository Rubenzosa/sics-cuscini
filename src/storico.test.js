import { unisciStorico } from "./storico";

test("unisce e ordina dal più recente, senza data in fondo", () => {
  const r = unisciStorico([
    { tipo:"revisione", voci:[{ id:1, dataRevisione:"2025-09-25" }], data: v => v.dataRevisione },
    { tipo:"spostamento", voci:[{ id:2, data:"2026-01-10T09:00:00.000Z" }, { id:3 }], data: v => v.data },
  ]);
  expect(r.map(x => [x.tipo, x.voce.id])).toEqual([["spostamento",2],["revisione",1],["spostamento",3]]);
});

test("fonti vuote → []", () => {
  expect(unisciStorico([{ tipo:"x", voci:[], data: v => v.d }])).toEqual([]);
});
