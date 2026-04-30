import { db } from "./config";
import {
  collection, doc, getDocs, getDoc,
  updateDoc, deleteDoc, setDoc, addDoc, serverTimestamp
} from "firebase/firestore";

const KITS = "kits";
const STORICO = "storico_sostituzioni";

export async function getAllKits() {
  const snap = await getDocs(collection(db, KITS));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getKit(id) {
  const snap = await getDoc(doc(db, KITS, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveKit(kit) {
  const { id, ...data } = kit;
  await setDoc(doc(db, KITS, id), data);
}

export async function updateKit(id, data) {
  await updateDoc(doc(db, KITS, id), data);
}

export async function deleteKit(id) {
  await deleteDoc(doc(db, KITS, id));
}

export async function seedDatabase(kits) {
  for (const kit of kits) {
    const { id, ...data } = kit;
    await setDoc(doc(db, KITS, id), data);
  }
}

// Sostituisce un componente in un kit
// - kitId: id del kit
// - indexComp: indice del componente da sostituire
// - nuovoComp: oggetto con i dati del nuovo componente
// - destinazione: "fuori_uso" | "magazzino" | "revisione"
// - noteUscita: note opzionali sul componente uscente
export async function sostituisciComponente(kitId, indexComp, nuovoComp, destinazione, noteUscita) {
  const kitSnap = await getDoc(doc(db, KITS, kitId));
  if (!kitSnap.exists()) throw new Error("Kit non trovato");

  const kit = kitSnap.data();
  const componenti = [...(kit.componenti || [])];
  const vecchioComp = { ...componenti[indexComp] };

  // Registra storico sostituzione
  await addDoc(collection(db, STORICO), {
    kitId,
    kitNumero: kit.numero,
    kitNome: kit.nome,
    dataOperazione: new Date().toISOString(),
    componenteUscente: {
      ...vecchioComp,
      destinazione,
      noteUscita: noteUscita || "",
      dataUscita: new Date().toISOString(),
    },
    componenteEntrante: nuovoComp,
    timestamp: serverTimestamp(),
  });

  // Sostituisce il componente nel kit
  componenti[indexComp] = {
    ...nuovoComp,
    dataInserimento: new Date().toISOString(),
  };

  await updateDoc(doc(db, KITS, kitId), { componenti });
}

// Recupera lo storico sostituzioni di un kit
export async function getStoricoKit(kitId) {
  const snap = await getDocs(collection(db, STORICO));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(s => s.kitId === kitId)
    .sort((a, b) => new Date(b.dataOperazione) - new Date(a.dataOperazione));
}