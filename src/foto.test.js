import {
  calcolaDimensioni, fotoDelComponente,
  eccedeLimiteFirestore, MAX_BYTE_FOTO, TENTATIVI_FOTO,
} from "./foto";

describe("calcolaDimensioni", () => {
  test("riduce un'immagine landscape al lato lungo massimo", () => {
    expect(calcolaDimensioni(4000, 3000, 1600)).toEqual({ w: 1600, h: 1200 });
  });

  test("riduce un'immagine portrait al lato lungo massimo", () => {
    expect(calcolaDimensioni(3000, 4000, 1600)).toEqual({ w: 1200, h: 1600 });
  });

  test("non ingrandisce un'immagine gia' piu' piccola del massimo", () => {
    expect(calcolaDimensioni(800, 600, 1600)).toEqual({ w: 800, h: 600 });
  });

  test("gestisce l'immagine quadrata", () => {
    expect(calcolaDimensioni(2000, 2000, 1600)).toEqual({ w: 1600, h: 1600 });
  });

  test("arrotonda i lati a numeri interi", () => {
    expect(calcolaDimensioni(1000, 333, 500)).toEqual({ w: 500, h: 167 });
  });
});

describe("fotoDelComponente", () => {
  test("ritorna la foto con lo stesso indice di componente", () => {
    const lista = [
      { id: "a", compIndex: 0 },
      { id: "b", compIndex: 2 },
    ];
    expect(fotoDelComponente(lista, 2)).toEqual({ id: "b", compIndex: 2 });
  });

  test("confronta l'indice anche se arriva come stringa da Firestore", () => {
    const lista = [{ id: "a", compIndex: "3" }];
    expect(fotoDelComponente(lista, 3)).toEqual({ id: "a", compIndex: "3" });
  });

  test("ritorna null se nessuna foto corrisponde", () => {
    expect(fotoDelComponente([{ id: "a", compIndex: 0 }], 5)).toBeNull();
    expect(fotoDelComponente([], 0)).toBeNull();
    expect(fotoDelComponente(undefined, 0)).toBeNull();
  });
});

describe("eccedeLimiteFirestore", () => {
  test("un data URI ASCII lungo quanto la stringa in byte: sotto il limite passa", () => {
    const dataUri = "data:image/jpeg;base64," + "A".repeat(100);
    expect(eccedeLimiteFirestore(dataUri, 1000)).toBe(false);
  });

  test("supera il limite quando la stringa e' piu' lunga del massimo byte", () => {
    const dataUri = "data:image/jpeg;base64," + "A".repeat(2000);
    expect(eccedeLimiteFirestore(dataUri, 1000)).toBe(true);
  });

  test("il limite di default lascia margine sotto il tetto 1 MB di Firestore", () => {
    expect(MAX_BYTE_FOTO).toBeLessThan(1048576);
  });
});

describe("TENTATIVI_FOTO", () => {
  test("ogni tentativo non e' piu' grande del precedente ed e' strettamente piu' piccolo in qualcosa", () => {
    for (let i = 1; i < TENTATIVI_FOTO.length; i++) {
      const prima = TENTATIVI_FOTO[i - 1];
      const dopo = TENTATIVI_FOTO[i];
      expect(dopo.lato).toBeLessThanOrEqual(prima.lato);
      expect(dopo.qualita).toBeLessThanOrEqual(prima.qualita);
      expect(dopo.lato < prima.lato || dopo.qualita < prima.qualita).toBe(true);
    }
  });
});
