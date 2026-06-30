import { getAllKits, updateKit } from "./service";
import { rinumeraCuscini } from "../numerazione";

// Anteprima (dry-run): ritorna la mappa dei cambiamenti senza scrivere.
export async function previewRinumerazioneCuscini() {
  const kits = await getAllKits();
  return rinumeraCuscini(kits).mappa;
}

// Applica: scrive su Firestore solo i kit con componenti cambiati.
export async function applicaRinumerazioneCuscini() {
  const kits = await getAllKits();
  const { kits: nuovi, mappa } = rinumeraCuscini(kits);
  const cambiati = new Set(mappa.map(m => m.kitId));
  for (const kit of nuovi) {
    if (cambiati.has(kit.id)) {
      await updateKit(kit.id, { componenti: kit.componenti });
    }
  }
  return mappa;
}
