import { db } from "./config";
import {
  collection, doc, getDocs, getDoc,
  updateDoc, deleteDoc, setDoc, addDoc, serverTimestamp
} from "firebase/firestore";

const KITS = "kits";
const STORICO_SOST = "storico_sostituzioni";
const STORICO_REV = "storico_revisioni";
const STORICO_SPOST = "storico_spostamenti";

// ─── KIT CRUD ───────────────────────────────────────────
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

// ─── SOSTITUZIONE COMPONENTE ────────────────────────────
export async function sostituisciComponente(kitId, indexComp, nuovoComp, destinazione, noteUscita) {
  const kitSnap = await getDoc(doc(db, KITS, kitId));
  if (!kitSnap.exists()) throw new Error("Kit non trovato");
  const kit = kitSnap.data();
  const componenti = [...(kit.componenti || [])];
  const vecchioComp = { ...componenti[indexComp] };
  await addDoc(collection(db, STORICO_SOST), {
    kitId, kitNumero: kit.numero, kitNome: kit.nome,
    dataOperazione: new Date().toISOString(),
    componenteUscente: { ...vecchioComp, destinazione, noteUscita: noteUscita || "", dataUscita: new Date().toISOString() },
    componenteEntrante: nuovoComp,
    timestamp: serverTimestamp(),
  });
  componenti[indexComp] = { ...nuovoComp, dataInserimento: new Date().toISOString() };
  await updateDoc(doc(db, KITS, kitId), { componenti });
}
export async function getStoricoSostituzioni(kitId) {
  const snap = await getDocs(collection(db, STORICO_SOST));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(s => s.kitId === kitId)
    .sort((a, b) => new Date(b.dataOperazione) - new Date(a.dataOperazione));
}

// ─── REGISTRO REVISIONI ─────────────────────────────────
export async function aggiungiRevisione(kitId, revisione) {
  const kitSnap = await getDoc(doc(db, KITS, kitId));
  if (!kitSnap.exists()) throw new Error("Kit non trovato");
  const kit = kitSnap.data();
  const recId = await addDoc(collection(db, STORICO_REV), {
    kitId, kitNumero: kit.numero, kitNome: kit.nome,
    ...revisione,
    dataRegistrazione: new Date().toISOString(),
    timestamp: serverTimestamp(),
  });
  // Aggiorna data revisione nel kit
  await updateDoc(doc(db, KITS, kitId), {
    dataRevisione: revisione.dataRevisione,
    ultimaRevisioneEsito: revisione.esito,
    ultimaRevisioneTecnico: revisione.tecnico,
  });
  return recId;
}
export async function getRevisioni(kitId) {
  const snap = await getDocs(collection(db, STORICO_REV));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(s => s.kitId === kitId)
    .sort((a, b) => new Date(b.dataRevisione) - new Date(a.dataRevisione));
}

// ─── SPOSTAMENTO KIT ────────────────────────────────────
export async function spostaKit(kitId, nuovoMezzo, nuovaTarga, nuovaDislocazione, motivo) {
  const kitSnap = await getDoc(doc(db, KITS, kitId));
  if (!kitSnap.exists()) throw new Error("Kit non trovato");
  const kit = kitSnap.data();
  await addDoc(collection(db, STORICO_SPOST), {
    kitId, kitNumero: kit.numero, kitNome: kit.nome,
    mezzoPrecedente: kit.mezzo,
    targaPrecedente: kit.mezzo,
    dislocazionePrecedente: kit.dislocazione,
    nuovoMezzo, nuovaTarga, nuovaDislocazione,
    motivo: motivo || "",
    data: new Date().toISOString(),
    timestamp: serverTimestamp(),
  });
  await updateDoc(doc(db, KITS, kitId), {
    mezzo: nuovaTarga,
    tipoMezzo: nuovoMezzo,
    dislocazione: nuovaDislocazione,
  });
}
export async function getStoricoSpostamenti(kitId) {
  const snap = await getDocs(collection(db, STORICO_SPOST));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(s => s.kitId === kitId)
    .sort((a, b) => new Date(b.data) - new Date(a.data));
}

// ─── RICERCA GLOBALE ────────────────────────────────────
export async function cercaGlobale(query_str) {
  const kits = await getAllKits();
  const q = query_str.toLowerCase().trim();
  if (!q) return [];
  const risultati = [];
  kits.forEach(kit => {
    const campiKit = [
      kit.nome, kit.mezzo, kit.tipoMezzo,
      String(kit.numero), kit.dislocazione
    ].filter(Boolean);
    const matchKit = campiKit.some(c => c.toLowerCase().includes(q));
    if (matchKit) {
      risultati.push({ tipo: "kit", kit, label: `Kit ${kit.numero} — ${kit.nome}`, sub: `${kit.mezzo} · ${kit.dislocazione}` });
    }
    (kit.componenti || []).forEach((c, i) => {
      const campiComp = [c.tipo, c.modello, c.matricola, c.matricolaLucca].filter(Boolean);
      if (campiComp.some(f => f.toLowerCase().includes(q))) {
        risultati.push({ tipo: "componente", kit, componente: c, index: i, label: `${c.tipo} — ${c.modello || ""}`, sub: `Kit ${kit.numero} · ${c.matricolaLucca || c.matricola || ""}` });
      }
    });
  });
  return risultati.slice(0, 20);
}