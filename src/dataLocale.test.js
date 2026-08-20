import { isoLocale, oggiIso } from "./utils";

// Regressione: la chiave-giorno del calendario nasce da new Date(anno, mese, giorno)
// (mezzanotte locale). Con toISOString() in Italia (UTC+1/+2) diventava il giorno
// precedente, e gli eventi comparivano nella cella del giorno dopo.
test("isoLocale non sposta il giorno di una data locale", () => {
  expect(isoLocale(new Date(2026, 8, 2))).toBe("2026-09-02");   // 2 settembre, ora legale
  expect(isoLocale(new Date(2026, 0, 15))).toBe("2026-01-15");  // 15 gennaio, ora solare
  expect(isoLocale(new Date(2026, 11, 31))).toBe("2026-12-31"); // fine anno
});

test("isoLocale accetta anche stringhe e scarta le date non valide", () => {
  expect(isoLocale("2026-09-02T00:00:00")).toBe("2026-09-02");
  expect(isoLocale("non una data")).toBe("");
  expect(isoLocale(null)).toBe("");
});

test("oggiIso coincide con i componenti locali di oggi", () => {
  const o = new Date();
  const atteso = `${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}-${String(o.getDate()).padStart(2,"0")}`;
  expect(oggiIso()).toBe(atteso);
});
