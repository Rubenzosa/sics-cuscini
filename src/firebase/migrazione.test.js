jest.mock("./service", () => ({
  getAllKits: jest.fn(),
  updateKit: jest.fn(() => Promise.resolve()),
}));
import { getAllKits, updateKit } from "./service";
import { previewRinumerazioneCuscini, applicaRinumerazioneCuscini } from "./migrazione";

const kits = () => [
  { id: "kit-4", numero: 4, componenti: [{ tipo: "CUSCINO 60X60", matricolaLucca: "CS 8 SI 1" }] },
  { id: "kit-13", numero: 13, componenti: [{ tipo: "CUSCINO 50X50", matricolaLucca: "CS 10 SI 4" }] },
];

beforeEach(() => { jest.clearAllMocks(); });

test("preview ritorna la mappa senza scrivere", async () => {
  getAllKits.mockResolvedValue(kits());
  const mappa = await previewRinumerazioneCuscini();
  expect(mappa).toEqual([
    { kitId: "kit-4", kitNumero: 4, compIndex: 0, tipo: "CUSCINO 60X60", vecchio: "CS 8 SI 1", nuovo: "CS 8 SI 001" },
    { kitId: "kit-13", kitNumero: 13, compIndex: 0, tipo: "CUSCINO 50X50", vecchio: "CS 10 SI 4", nuovo: "CS 10 SI 002" },
  ]);
  expect(updateKit).not.toHaveBeenCalled();
});

test("apply scrive i kit cambiati", async () => {
  getAllKits.mockResolvedValue(kits());
  await applicaRinumerazioneCuscini();
  expect(updateKit).toHaveBeenCalledTimes(2);
  expect(updateKit).toHaveBeenCalledWith("kit-4", {
    componenti: [{ tipo: "CUSCINO 60X60", matricolaLucca: "CS 8 SI 001", vecchio_codice: "CS 8 SI 1" }],
  });
  expect(updateKit).toHaveBeenCalledWith("kit-13", {
    componenti: [{ tipo: "CUSCINO 50X50", matricolaLucca: "CS 10 SI 002", vecchio_codice: "CS 10 SI 4" }],
  });
});
