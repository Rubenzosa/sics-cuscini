import { tabDopoSwipe } from "./swipe";

const TABS = ["componenti", "dati", "storico", "documenti"];

test("swipe verso sinistra → scheda successiva", () => {
  expect(tabDopoSwipe(TABS, "componenti", -90, 10)).toBe("dati");
});
test("swipe verso destra → scheda precedente", () => {
  expect(tabDopoSwipe(TABS, "storico", 90, 5)).toBe("dati");
});
test("ai bordi non gira in tondo", () => {
  expect(tabDopoSwipe(TABS, "componenti", 90, 0)).toBe("componenti");
  expect(tabDopoSwipe(TABS, "documenti", -90, 0)).toBe("documenti");
});
test("movimento corto o soprattutto verticale = scorrimento, non cambia scheda", () => {
  expect(tabDopoSwipe(TABS, "dati", -30, 0)).toBe("dati");
  expect(tabDopoSwipe(TABS, "dati", -90, 120)).toBe("dati");
});
