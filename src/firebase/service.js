import { db } from "./config";
import {
  collection, doc, getDocs, getDoc,
  updateDoc, deleteDoc, setDoc
} from "firebase/firestore";

const KITS = "kits";

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