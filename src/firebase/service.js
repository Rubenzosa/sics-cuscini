import { db, storage } from "./config";
import {
  collection, doc, getDocs, getDoc,
  updateDoc, deleteDoc, setDoc, addDoc, serverTimestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { calcolaProssimaRevisione, scadenzaConIntervallo } from "../utils";

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
// Mette un componente fuori uso (difettoso in revisione) senza sostituirlo subito.
// Il componente resta nel kit ma marcato; la sostituzione avverrà dopo.
export async function mettiComponenteFuoriUso(kitId, indexComp, note) {
  const kitSnap = await getDoc(doc(db, KITS, kitId));
  if (!kitSnap.exists()) throw new Error("Kit non trovato");
  const kit = kitSnap.data();
  const componenti = [...(kit.componenti || [])];
  const c = { ...componenti[indexComp] };
  componenti[indexComp] = { ...c, fuoriUso: true, dataFuoriUso: new Date().toISOString(), noteFuoriUso: note || "" };
  await addDoc(collection(db, STORICO_SOST), {
    kitId, kitNumero: kit.numero, kitNome: kit.nome,
    dataOperazione: new Date().toISOString(),
    operazione: "messa_fuori_uso",
    componenteUscente: { ...c, destinazione: "fuori_uso", noteUscita: note || "", dataUscita: new Date().toISOString() },
    componenteEntrante: null,
    timestamp: serverTimestamp(),
  });
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
  // dataRevisione sul kit = prossima scadenza dalla data effettuata.
  // Priorità: durata manuale (anni) se inserita, altrimenti logica per età
  // (< 10 anni → +2 anni; >= 10 anni → +1 anno).
  const prossimaScadenza =
    scadenzaConIntervallo(revisione.dataRevisione, revisione.intervalloAnni) ||
    calcolaProssimaRevisione(kit.annoAcquisto, revisione.dataRevisione) ||
    revisione.dataRevisione;
  const patch = {
    dataRevisione: prossimaScadenza,
    ultimaRevisioneData: revisione.dataRevisione,
    ultimaRevisioneEsito: revisione.esito,
    ultimaRevisioneTecnico: revisione.tecnico,
  };
  // Memorizza l'intervallo manuale per precompilare la prossima registrazione.
  const nAnni = Number(revisione.intervalloAnni);
  if (Number.isFinite(nAnni) && nAnni > 0) patch.intervalloRevisioneAnni = nAnni;
  await updateDoc(doc(db, KITS, kitId), patch);
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

// ─── ROTAZIONI & REVISIONI ──────────────────────────────────

// Invia kit in revisione — cambia stato e registra
export async function inviaInRevisione(kitId, officina, dataInvio, dataRientroStimata, note) {
  const kitSnap = await getDoc(doc(db, KITS, kitId));
  if (!kitSnap.exists()) throw new Error("Kit non trovato");
  const kit = kitSnap.data();
  await addDoc(collection(db, "rotazioni"), {
    kitId, kitNumero: kit.numero, kitNome: kit.nome,
    mezzo: kit.mezzo, dislocazione: kit.dislocazione,
    officina: officina || "",
    dataInvio: dataInvio || new Date().toISOString().split("T")[0],
    dataRientroStimata: dataRientroStimata || "",
    dataRientroEffettiva: null,
    note: note || "",
    stato: "in_revisione",
    timestamp: serverTimestamp(),
  });
  await updateDoc(doc(db, KITS, kitId), {
    stato: "in_revisione",
    dataInvioRevisione: dataInvio || new Date().toISOString().split("T")[0],
    dataRientroStimata: dataRientroStimata || "",
    officina: officina || "",
  });
}

// Registra rientro dalla revisione
export async function registraRientro(kitId, rotazioneId, dataRientro, nuovaDataRevisione, esito, note) {
  await updateDoc(doc(db, "rotazioni", rotazioneId), {
    dataRientroEffettiva: dataRientro,
    stato: "rientrato",
    esitoRevisione: esito || "positivo",
    noteRientro: note || "",
  });
  await updateDoc(doc(db, KITS, kitId), {
    stato: "attivo",
    dataRevisione: nuovaDataRevisione,
    dataInvioRevisione: null,
    dataRientroStimata: null,
    officina: null,
    ultimaRevisioneEsito: esito || "positivo",
  });
}

// Recupera tutte le rotazioni attive (in_revisione)
export async function getRotazioniAttive() {
  const snap = await getDocs(collection(db, "rotazioni"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(r => r.stato === "in_revisione")
    .sort((a, b) => (a.dataInvio || "").localeCompare(b.dataInvio || ""));
}

// Recupera storico rotazioni
export async function getStoricoRotazioni() {
  const snap = await getDocs(collection(db, "rotazioni"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.dataInvio || "").localeCompare(a.dataInvio || ""));
}

// Recupera rotazioni per kit specifico
export async function getRotazioniKit(kitId) {
  const snap = await getDocs(collection(db, "rotazioni"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(r => r.kitId === kitId)
    .sort((a, b) => (b.dataInvio || "").localeCompare(a.dataInvio || ""));
}

// ─── GRUPPI DA TAGLIO ────────────────────────────────────────
const GT = "gruppi_taglio";
const GT_REV = "gt_revisioni";
const GT_MANUTENZIONE = "gt_manutenzione";

export async function getAllGruppiTaglio() {
  const snap = await getDocs(collection(db, GT));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveGruppoTaglio(gt) {
  const { id, ...data } = gt;
  await setDoc(doc(db, GT, id), data);
}

export async function updateGruppoTaglio(id, data) {
  await updateDoc(doc(db, GT, id), data);
}

export async function deleteGruppoTaglio(id) {
  await deleteDoc(doc(db, GT, id));
}

export async function seedGruppiTaglio(gruppi) {
  for (const gt of gruppi) {
    const { id, ...data } = gt;
    await setDoc(doc(db, GT, id), data);
  }
}

export async function aggiungiRevisioneGT(gtId, revisione) {
  const snap = await getDoc(doc(db, GT, gtId));
  if (!snap.exists()) throw new Error("Gruppo taglio non trovato");
  const gt = snap.data();
  await addDoc(collection(db, GT_REV), {
    gtId, gtNome: gt.nome, gtNumero: gt.numero,
    ...revisione,
    dataRegistrazione: new Date().toISOString(),
    timestamp: serverTimestamp(),
  });
  // Taglio: l'utente indica ogni quanti anni serve la revisione.
  // Aggiorna la scadenza di tutti i componenti tranne quelli "NO REVISIONE".
  const nuovaProssima = scadenzaConIntervallo(revisione.dataRevisione, revisione.intervalloAnni);
  const patch = {
    ultimaRevisioneData: revisione.dataRevisione,
    ultimaRevisioneEsito: revisione.esito,
    ultimaRevisioneTecnico: revisione.tecnico,
  };
  const nAnni = Number(revisione.intervalloAnni);
  if (nuovaProssima) {
    patch.intervalloRevisioneAnni = nAnni;
    patch.componenti = (gt.componenti || []).map(c =>
      c.prossimaRevisione === "NO REVISIONE"
        ? c
        : { ...c, ultimaRevisione: revisione.dataRevisione, prossimaRevisione: nuovaProssima }
    );
  }
  await updateDoc(doc(db, GT, gtId), patch);
}

export async function getRevisioniGT(gtId) {
  const snap = await getDocs(collection(db, GT_REV));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(r => r.gtId === gtId)
    .sort((a, b) => (b.dataRevisione || "").localeCompare(a.dataRevisione || ""));
}

export async function aggiungiManutenzioneGT(gtId, manutenzione) {
  const snap = await getDoc(doc(db, GT, gtId));
  if (!snap.exists()) throw new Error("Gruppo taglio non trovato");
  const gt = snap.data();
  await addDoc(collection(db, GT_MANUTENZIONE), {
    gtId, gtNome: gt.nome,
    ...manutenzione,
    dataRegistrazione: new Date().toISOString(),
    timestamp: serverTimestamp(),
  });
}

export async function getManutenzioniGT(gtId) {
  const snap = await getDocs(collection(db, GT_MANUTENZIONE));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(r => r.gtId === gtId)
    .sort((a, b) => (b.data || "").localeCompare(a.data || ""));
}

export async function getAllManutenzioniGT() {
  const snap = await getDocs(collection(db, GT_MANUTENZIONE));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.data || "").localeCompare(a.data || ""));
}


// ─── DOCUMENTI (metadati su Firestore, file su Google Drive) ──
const DOCS = "documenti";

export async function getDocumentiKit(kitId) {
  const snap = await getDocs(collection(db, DOCS));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(d => d.kitId === kitId)
    .sort((a, b) => (b.dataCaricamento||"").localeCompare(a.dataCaricamento||""));
}

export async function salvaMetadataDocumento(meta) {
  // meta: { kitId, kitNome, sistema, tipoDoc, anno, note, driveFileId, driveUrl, nomeFile, dimensione }
  const docRef = await addDoc(collection(db, DOCS), {
    ...meta,
    dataCaricamento: new Date().toISOString(),
    timestamp: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteDocumento(docId) {
  await deleteDoc(doc(db, DOCS, docId));
}

export async function getAllDocumenti() {
  const snap = await getDocs(collection(db, DOCS));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.dataCaricamento||"").localeCompare(a.dataCaricamento||""));
}

// ─── REVISIONI PIANIFICATE ───────────────────────────────────
const PLAN = "revisioni_pianificate";

export async function pianificaRevisione(data) {
  // data: { kitIds[], dataPrevista, officina, note, sistema }
  const ref2 = await addDoc(collection(db, PLAN), {
    ...data,
    stato: "pianificata",  // pianificata | completata | annullata
    dataCreazione: new Date().toISOString(),
    timestamp: serverTimestamp(),
  });
  return ref2.id;
}

export async function getAllRevisioniPianificate() {
  const snap = await getDocs(collection(db, PLAN));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.dataPrevista||"").localeCompare(b.dataPrevista||""));
}

export async function aggiornaRevisionePianificata(id, data) {
  await updateDoc(doc(db, PLAN, id), data);
}

export async function deleteRevisionePianificata(id) {
  await deleteDoc(doc(db, PLAN, id));
}

// ─── PROMEMORIA CALENDARIO ───────────────────────────────────
const PROMEMORIA = "promemoria";

export async function getAllPromemoria() {
  const snap = await getDocs(collection(db, PROMEMORIA));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.data || "").localeCompare(b.data || ""));
}

export async function salvaPromemoria(p) {
  // p: { data, sistema, titolo, note }
  const ref2 = await addDoc(collection(db, PROMEMORIA), {
    ...p,
    dataCreazione: new Date().toISOString(),
    timestamp: serverTimestamp(),
  });
  return ref2.id;
}

export async function deletePromemoria(id) {
  await deleteDoc(doc(db, PROMEMORIA, id));
}

// ─── ALLEGATI FUORI USO (Firebase Storage + Firestore metadata) ──────────────
const ALLEGATI = "allegati_kit";

export async function uploadAllegato(kitId, file) {
  const path = `allegati/${kitId}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  const docRef = await addDoc(collection(db, ALLEGATI), {
    kitId,
    nomeFile: file.name,
    mimeType: file.type,
    dimensione: file.size,
    url,
    path,
    dataCaricamento: new Date().toISOString(),
    timestamp: serverTimestamp(),
  });
  return { id: docRef.id, url, nomeFile: file.name };
}

export async function getAllegatiKit(kitId) {
  const snap = await getDocs(collection(db, ALLEGATI));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(d => d.kitId === kitId)
    .sort((a, b) => (b.dataCaricamento || "").localeCompare(a.dataCaricamento || ""));
}

export async function deleteAllegato(allegatoId, path) {
  if (path) {
    try { await deleteObject(ref(storage, path)); } catch (e) {}
  }
  await deleteDoc(doc(db, ALLEGATI, allegatoId));
}

// Cancella tutti i gruppi taglio da Firestore e ri-esegue il seed
export async function resetAndSeedGruppiTaglio(gruppi) {
  const snap = await getDocs(collection(db, "gruppi_taglio"));
  const deletes = snap.docs.map(d => deleteDoc(doc(db, "gruppi_taglio", d.id)));
  await Promise.all(deletes);
  for (const gt of gruppi) {
    const { id, ...data } = gt;
    await setDoc(doc(db, "gruppi_taglio", id), data);
  }
}