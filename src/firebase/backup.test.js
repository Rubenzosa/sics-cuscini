jest.mock("./service", () => ({
  getAllDocs: jest.fn(),
  getDocAt: jest.fn(),
  setDocAt: jest.fn(() => Promise.resolve()),
  deleteDocAt: jest.fn(() => Promise.resolve()),
}));
import { getAllDocs, getDocAt, setDocAt, deleteDocAt } from "./service";
import { creaBackup, listaBackup, ripristinaBackup, eliminaBackup, COLLEZIONI_BACKUP } from "./backup";

beforeEach(() => { jest.clearAllMocks(); });

test("COLLEZIONI_BACKUP contiene le 13 collezioni dell'app", () => {
  expect(COLLEZIONI_BACKUP).toEqual([
    "kits", "gruppi_taglio", "storico_revisioni", "storico_spostamenti",
    "storico_sostituzioni", "gt_revisioni", "gt_manutenzione", "gt_stati_componenti",
    "documenti", "revisioni_pianificate", "promemoria", "allegati_kit", "rotazioni",
  ]);
});

test("creaBackup legge tutte le collezioni e scrive un documento dati per ciascuna piu' il padre", async () => {
  getAllDocs.mockImplementation((percorso) => {
    if (percorso.length === 1 && percorso[0] === "kits") {
      return Promise.resolve([{ id: "kit-4", numero: 4 }]);
    }
    return Promise.resolve([]);
  });

  const id = await creaBackup("manuale");

  expect(typeof id).toBe("string");
  expect(setDocAt).toHaveBeenCalledTimes(COLLEZIONI_BACKUP.length + 1);
  expect(setDocAt).toHaveBeenCalledWith(
    ["backups", id, "dati", "kits"],
    { nome: "kits", documenti: [{ id: "kit-4", numero: 4 }] }
  );
  const chiamataPadre = setDocAt.mock.calls.find(c => c[0].length === 2 && c[0][0] === "backups");
  expect(chiamataPadre[1].etichetta).toBe("manuale");
  expect(chiamataPadre[1].conteggi.kits).toBe(1);
  expect(chiamataPadre[1].conteggi.gruppi_taglio).toBe(0);
  expect(typeof chiamataPadre[1].creatoIl).toBe("string");
});

test("listaBackup legge la collezione backups e ordina dal piu' recente", async () => {
  getAllDocs.mockResolvedValue([
    { id: "b1", creatoIl: "2026-09-01T10:00:00.000Z" },
    { id: "b2", creatoIl: "2026-09-02T10:00:00.000Z" },
  ]);

  const out = await listaBackup();

  expect(getAllDocs).toHaveBeenCalledWith(["backups"]);
  expect(out.map(b => b.id)).toEqual(["b2", "b1"]);
});

test("ripristinaBackup elimina i documenti attuali e riscrive quelli dello snapshot, per ogni collezione", async () => {
  getDocAt.mockImplementation((percorso) => {
    if (percorso[3] === "kits") {
      return Promise.resolve({ nome: "kits", documenti: [{ id: "kit-4", numero: 4 }] });
    }
    return Promise.resolve(null);
  });
  getAllDocs.mockImplementation((percorso) => {
    if (percorso.length === 1 && percorso[0] === "kits") {
      return Promise.resolve([{ id: "kit-vecchio" }]);
    }
    return Promise.resolve([]);
  });

  const risultato = await ripristinaBackup("bk1");

  expect(getDocAt).toHaveBeenCalledWith(["backups", "bk1", "dati", "kits"]);
  expect(deleteDocAt).toHaveBeenCalledWith(["kits", "kit-vecchio"]);
  expect(setDocAt).toHaveBeenCalledWith(["kits", "kit-4"], { numero: 4 });
  expect(risultato.kits).toBe(1);
  expect(risultato.gruppi_taglio).toBeUndefined();
});

test("eliminaBackup elimina tutti i documenti dati e il padre", async () => {
  await eliminaBackup("bk1");

  expect(deleteDocAt).toHaveBeenCalledTimes(COLLEZIONI_BACKUP.length + 1);
  expect(deleteDocAt).toHaveBeenCalledWith(["backups", "bk1"]);
  expect(deleteDocAt).toHaveBeenCalledWith(["backups", "bk1", "dati", "kits"]);
  expect(deleteDocAt).toHaveBeenCalledWith(["backups", "bk1", "dati", "rotazioni"]);
});
