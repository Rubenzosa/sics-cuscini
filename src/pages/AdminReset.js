/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import { gruppiTaglioData } from "../data/gruppiTaglioData";

export default function AdminReset() {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);

  function addLog(msg) {
    setLog(prev => [...prev, msg]);
  }

  async function resetGT() {
    setRunning(true);
    setLog([]);
    try {
      addLog("1. Lettura documenti attuali...");
      const snap = await getDocs(collection(db, "gruppi_taglio"));
      addLog(`   Trovati ${snap.docs.length} documenti da eliminare`);

      addLog("2. Eliminazione...");
      for (const d of snap.docs) {
        await deleteDoc(doc(db, "gruppi_taglio", d.id));
        addLog(`   Eliminato: ${d.id}`);
      }

      addLog("3. Scrittura 14 kit corretti...");
      for (const gt of gruppiTaglioData) {
        const { id, ...data } = gt;
        await setDoc(doc(db, "gruppi_taglio", id), data);
        addLog(`   Scritto: ${id} (Kit ${data.numero} — ${data.nome})`);
      }

      addLog(`✓ DONE — ${gruppiTaglioData.length} kit scritti. Ricarica la pagina principale.`);
    } catch(e) {
      addLog(`ERRORE: ${e.message}`);
    }
    setRunning(false);
  }

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: "var(--red-text)" }}>
        ⚠ Admin — Reset Gruppi Taglio
      </h1>
      <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>
        Cancella tutti i kit gruppi taglio da Firebase e riscrive i 14 kit corretti dal file locale.
        Kit 12 (ZUMBO) e Kit 2 (RESQTEC) saranno record separati.
      </p>

      <div style={{ marginBottom: 16 }}>
        <strong style={{ fontSize: 13 }}>Kit che verranno scritti ({gruppiTaglioData.length}):</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {gruppiTaglioData.map(gt => (
            <span key={gt.id} style={{
              fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12,
              background: gt.stato === "fuori_uso" ? "#1a1a1a" : gt.stato === "magazzino" ? "var(--blue-bg)" : "var(--green-bg)",
              color: gt.stato === "fuori_uso" ? "#aaa" : gt.stato === "magazzino" ? "var(--blue-text)" : "var(--green-text)",
            }}>
              Kit {gt.numero} — {gt.nome}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={resetGT}
        disabled={running}
        style={{
          background: running ? "#999" : "#e24b4a",
          color: "#fff", border: "none", borderRadius: 8,
          padding: "10px 24px", fontSize: 14, fontWeight: 700,
          cursor: running ? "not-allowed" : "pointer",
          marginBottom: 20,
        }}>
        {running ? "Attendere..." : "🔄 Esegui reset e riscrivi"}
      </button>

      {log.length > 0 && (
        <div style={{
          background: "#111", color: "#0f0", fontFamily: "monospace",
          fontSize: 12, padding: 16, borderRadius: 8,
          maxHeight: 400, overflowY: "auto",
        }}>
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  );
}
