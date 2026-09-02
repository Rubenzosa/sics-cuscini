// Foto dei singoli componenti (cuscini, tubi, riduttori, ...).
// La foto viene salvata DENTRO Firestore come data URI (niente Firebase Storage).
// calcolaDimensioni / fotoDelComponente / eccedeLimiteFirestore sono puri e testati.
// ridimensionaImmagine() usa canvas: glue sottile, verificata a mano sul browser.

// Scala (w,h) perche' il lato lungo non superi max, senza mai ingrandire.
export function calcolaDimensioni(w, h, max) {
  const lato = Math.max(w, h);
  if (lato <= max) return { w: Math.round(w), h: Math.round(h) };
  const k = max / lato;
  return { w: Math.round(w * k), h: Math.round(h * k) };
}

// Trova la foto associata a un componente per indice (Firestore puo' dare stringhe).
export function fotoDelComponente(lista, compIndex) {
  if (!Array.isArray(lista)) return null;
  return lista.find(f => Number(f.compIndex) === Number(compIndex)) || null;
}

// Margine sotto il tetto di 1 MB per documento Firestore (nomi campi + overhead).
export const MAX_BYTE_FOTO = 900000;

// I data URI base64 sono ASCII: la lunghezza in caratteri = byte occupati in Firestore.
export function eccedeLimiteFirestore(dataUri, maxByte = MAX_BYTE_FOTO) {
  return typeof dataUri !== "string" || dataUri.length > maxByte;
}

// Scaletta di compressione: ogni passo piu' piccolo/compresso del precedente.
// Si scende finche' il data URI sta sotto MAX_BYTE_FOTO.
export const TENTATIVI_FOTO = [
  { lato: 1280, qualita: 0.72 },
  { lato: 1280, qualita: 0.60 },
  { lato: 1024, qualita: 0.60 },
  { lato: 1024, qualita: 0.50 },
  { lato: 900,  qualita: 0.45 },
];

// Da un File immagine della fotocamera a un data URI JPEG che sta in un documento
// Firestore. Rispetta l'orientamento EXIF. Lancia se non riesce a rientrare nel limite.
export async function ridimensionaImmagine(file) {
  if (!file || !file.type?.startsWith("image/")) {
    throw new Error("Il file selezionato non e' un'immagine");
  }
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    for (const tentativo of TENTATIVI_FOTO) {
      const { w, h } = calcolaDimensioni(bitmap.width, bitmap.height, tentativo.lato);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
      const dataUri = canvas.toDataURL("image/jpeg", tentativo.qualita);
      if (!eccedeLimiteFirestore(dataUri)) return dataUri;
    }
    throw new Error("Foto troppo grande: riprova con una foto piu' piccola");
  } finally {
    bitmap.close?.();
  }
}
