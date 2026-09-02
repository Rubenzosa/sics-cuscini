jest.mock("./config", () => ({ db: {}, storage: {} }));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn((db, name) => ({ __col: name })),
  doc: jest.fn((db, name, id) => ({ __doc: name, id })),
  query: jest.fn((col, ...clauses) => ({ __query: col.__col, clauses })),
  where: jest.fn((campo, op, valore) => ({ __where: [campo, op, valore] })),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  setDoc: jest.fn(() => Promise.resolve()),
  addDoc: jest.fn(() => Promise.resolve({ id: "foto-nuova" })),
  serverTimestamp: jest.fn(() => "TS"),
}));
jest.mock("firebase/storage", () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(() => Promise.resolve("")),
  deleteObject: jest.fn(() => Promise.resolve()),
}));

import { collection, doc, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { getFotoComponenti, salvaFotoComponente, eliminaFotoComponente } from "./service";

function snap(rows) {
  return {
    docs: rows.map(r => {
      const { id, ...rest } = r;
      return { id, data: () => rest };
    }),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // CRA azzera le implementazioni dei mock tra i test: le rimettiamo qui.
  collection.mockImplementation((db, name) => ({ __col: name }));
  doc.mockImplementation((db, name, id) => ({ __doc: name, id }));
  query.mockImplementation((col, ...clauses) => ({ __query: col.__col, clauses }));
  where.mockImplementation((campo, op, valore) => ({ __where: [campo, op, valore] }));
  deleteDoc.mockResolvedValue();
  addDoc.mockResolvedValue({ id: "foto-nuova" });
});

describe("getFotoComponenti", () => {
  test("interroga la collezione foto_componenti filtrando per entita'", async () => {
    getDocs.mockResolvedValue(snap([
      { id: "f1", kitId: "kit-4", compIndex: 0, dataUri: "data:image/jpeg;base64,AAA" },
      { id: "f2", kitId: "kit-4", compIndex: 2, dataUri: "data:image/jpeg;base64,BBB" },
    ]));

    const out = await getFotoComponenti("kit-4");

    expect(where).toHaveBeenCalledWith("kitId", "==", "kit-4");
    const queryArg = getDocs.mock.calls[0][0];
    expect(queryArg.__query).toBe("foto_componenti");
    expect(out.map(f => f.id)).toEqual(["f1", "f2"]);
  });
});

describe("salvaFotoComponente", () => {
  test("scrive il data URI e i metadati nella collezione foto_componenti", async () => {
    getDocs.mockResolvedValue(snap([]));

    await salvaFotoComponente("gt-1", 3, { tipo: "CESOIA", matricola: "AB12" }, "data:image/jpeg;base64,ZZZ");

    expect(addDoc.mock.calls[0][0].__col).toBe("foto_componenti");
    const meta = addDoc.mock.calls[0][1];
    expect(meta).toMatchObject({
      kitId: "gt-1",
      compIndex: 3,
      compTipo: "CESOIA",
      compMatricola: "AB12",
      dataUri: "data:image/jpeg;base64,ZZZ",
    });
    expect(typeof meta.dataCaricamento).toBe("string");
  });

  test("rimuove la foto precedente dello stesso componente solo dopo aver scritto la nuova", async () => {
    getDocs.mockResolvedValue(snap([
      { id: "vecchia", kitId: "kit-4", compIndex: 1, dataUri: "data:image/jpeg;base64,OLD" },
      { id: "altra", kitId: "kit-4", compIndex: 5, dataUri: "data:image/jpeg;base64,X" },
    ]));
    const ordine = [];
    addDoc.mockImplementation(() => { ordine.push("addDoc"); return Promise.resolve({ id: "foto-nuova" }); });
    deleteDoc.mockImplementation(() => { ordine.push("deleteDoc"); return Promise.resolve(); });

    await salvaFotoComponente("kit-4", 1, { tipo: "CUSCINO 50X50", matricola: "999" }, "data:image/jpeg;base64,NEW");

    expect(deleteDoc).toHaveBeenCalledTimes(1);
    expect(deleteDoc).toHaveBeenCalledWith(expect.objectContaining({ __doc: "foto_componenti", id: "vecchia" }));
    expect(ordine).toEqual(["addDoc", "deleteDoc"]);
  });
});

describe("eliminaFotoComponente", () => {
  test("cancella il documento della foto per id", async () => {
    await eliminaFotoComponente("f9");
    expect(deleteDoc).toHaveBeenCalledWith(expect.objectContaining({ __doc: "foto_componenti", id: "f9" }));
  });
});
