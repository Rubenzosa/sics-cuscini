import { statoLabelBreve, statoLabel } from "./utils";

describe("statoLabelBreve", () => {
  test("accorcia le etichette che andrebbero a capo nella lista", () => {
    expect(statoLabelBreve("critico")).toBe("Entro 3 mesi");
    expect(statoLabelBreve("attenzione")).toBe("Quest'anno");
    expect(statoLabelBreve("buono")).toBe("Anno prossimo");
  });

  test("lascia intatte quelle gia' corte", () => {
    expect(statoLabelBreve("scaduto")).toBe("Scaduto");
    expect(statoLabelBreve("regolare")).toBe("Regolare");
    expect(statoLabelBreve("fuori_uso")).toBe("Fuori uso");
  });

  test("nessuna etichetta breve supera i 14 caratteri (larghezza della colonna)", () => {
    ["scaduto","critico","attenzione","buono","regolare","fuori_servizio","magazzino","senza_data","fuori_uso"]
      .forEach(s => expect(statoLabelBreve(s).length).toBeLessThanOrEqual(14));
  });

  test("stato sconosciuto ripiega sull'etichetta lunga", () => {
    expect(statoLabelBreve("in_revisione")).toBe(statoLabel("in_revisione"));
  });
});
