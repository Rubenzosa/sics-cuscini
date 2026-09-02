// ─────────────────────────────────────────────────────────────
// Backup e ripristino di tutte le collezioni Firestore dell'app.
// Un backup = 1 doc padre (backups/{id}: creatoIl, etichetta, conteggi)
// + 1 doc per collezione in backups/{id}/dati/{nomeCollezione}
// (split per restare sotto il limite 1MB/documento di Firestore).
// Il ripristino sostituisce interamente ogni collezione (mai un merge).
// Spec: docs/superpowers/specs/2026-09-02-backup-ripristino-design.md
// ─────────────────────────────────────────────────────────────
import { getAllDocs, getDocAt, setDocAt, deleteDocAt } from "./service";

export const COLLEZIONI_BACKUP = [
  "kits", "gruppi_taglio", "storico_revisioni", "storico_spostamenti",
  "storico_sostituzioni", "gt_revisioni", "gt_manutenzione", "gt_stati_componenti",
  "documenti", "revisioni_pianificate", "promemoria", "allegati_kit", "rotazioni",
];

function nuovoId() {
  return `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function creaBackup(etichetta) {
  const backupId = nuovoId();
  const conteggi = {};
  for (const nome of COLLEZIONI_BACKUP) {
    const documenti = await getAllDocs([nome]);
    conteggi[nome] = documenti.length;
    await setDocAt(["backups", backupId, "dati", nome], { nome, documenti });
  }
  await setDocAt(["backups", backupId], {
    creatoIl: new Date().toISOString(),
    etichetta,
    conteggi,
  });
  return backupId;
}

export async function listaBackup() {
  const padri = await getAllDocs(["backups"]);
  return padri.sort((a, b) => (b.creatoIl || "").localeCompare(a.creatoIl || ""));
}

export async function ripristinaBackup(backupId) {
  const risultato = {};
  for (const nome of COLLEZIONI_BACKUP) {
    const snapshot = await getDocAt(["backups", backupId, "dati", nome]);
    if (!snapshot) continue;
    const attuali = await getAllDocs([nome]);
    for (const d of attuali) await deleteDocAt([nome, d.id]);
    for (const { id, ...campi } of snapshot.documenti) await setDocAt([nome, id], campi);
    risultato[nome] = snapshot.documenti.length;
  }
  return risultato;
}

export async function eliminaBackup(backupId) {
  for (const nome of COLLEZIONI_BACKUP) {
    await deleteDocAt(["backups", backupId, "dati", nome]);
  }
  await deleteDocAt(["backups", backupId]);
}
