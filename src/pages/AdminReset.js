/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import { gruppiTaglioData } from "../data/gruppiTaglioData";

// Sceglie il documento da CONSERVARE tra i doppioni dello stesso numero:
// 1) quello con revisione più recente (dati reali), 2) id "seed" (senza timestamp), 3) id minore.
function scegliKeeper(arr) {
  return [...arr].sort((a, b) => {
    const ra = a.ultimaRevisioneData || "";
    const rb = b.ultimaRevisioneData || "";
    if (ra !== rb) return rb.localeCompare(ra);
    const ta = /-\d{13}$/.test(a.id) ? 1 : 0;
    const tb = /-\d{13}$/.test(b.id) ? 1 : 0;
    if (ta !== tb) return ta - tb;
    return String(a.id).localeCompare(String(b.id));
  })[0];
}

export default function AdminReset() {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [piano, setPiano] = useState(null); // { gruppi:[{numero, keep, elimina:[...]}], totElimina }
  const [dedupRun, setDedupRun] = useState(false);

  function addLog(msg) {
    setLog(prev => [...prev, msg]);
  }

  // Passo 1: analizza i doppioni (non elimina nulla)
  async function analizzaDoppioni() {
    setDedupRun(true);
    setPiano(null);
    try {
      const snap = await getDocs(collection(db, "gruppi_taglio"));
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const byNum = {};
      docs.forEach(g => {
        const key = String(g.numero ?? "").trim();
        if (!key) return; // salta numeri vuoti: verifica manuale
        (byNum[key] = byNum[key] || []).push(g);
      });
      const gruppi = Object.entries(byNum)
        .filter(([, arr]) => arr.length > 1)
        .map(([numero, arr]) => {
          const keep = scegliKeeper(arr);
          return { numero, nome: keep.nome, keep, elimina: arr.filter(g => g.id !== keep.id) };
        });
      const totElimina = gruppi.reduce((s, g) => s + g.elimina.length, 0);
      setPiano({ gruppi, totElimina });
    } catch (e) {
      setPiano({ errore: e.message, gruppi: [], totElimina: 0 });
    }
    setDedupRun(false);
  }

  // Passo 2: elimina i doppioni secondo il piano analizzato
  async function eliminaDoppioni() {
    if (!piano || !piano.totElimina) return;
    setDedupRun(true);
    setLog([]);
    try {
      addLog(`Eliminazione ${piano.totElimina} doppioni...`);
      for (const g of piano.gruppi) {
        for (const d of g.elimina) {
          await deleteDoc(doc(db, "gruppi_taglio", d.id));
          addLog(`   Eliminato doppione ${d.id} (Kit ${g.numero}) — conservato ${g.keep.id}`);
        }
      }
      addLog(`✓ DONE — ${piano.totElimina} doppioni eliminati. Ricarica la pagina principale.`);
      setPiano(null);
    } catch (e) {
      addLog(`ERRORE: ${e.message}`);
    }
    setDedupRun(false);
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

      <div style={{ borderTop: "1px solid var(--border, #ddd)", marginTop: 24, paddingTop: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Dedup Gruppi Taglio (non distruttivo)</h2>
        <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
          Trova gruppi con lo stesso numero e ne conserva uno solo (revisione più recente / id originale),
          eliminando i doppioni. Non tocca i dati reali dei gruppi conservati.
        </p>
        <button
          onClick={analizzaDoppioni}
          disabled={dedupRun}
          style={{
            background: dedupRun ? "#999" : "#185fa5", color: "#fff", border: "none",
            borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 700,
            cursor: dedupRun ? "not-allowed" : "pointer", marginRight: 12,
          }}>
          {dedupRun ? "Attendere..." : "🔍 Analizza doppioni"}
        </button>

        {piano && (
          <div style={{ marginTop: 16 }}>
            {piano.errore && <div style={{ color: "#e24b4a" }}>Errore: {piano.errore}</div>}
            {!piano.errore && piano.totElimina === 0 && (
              <div style={{ fontSize: 14, color: "var(--green-text)" }}>✓ Nessun doppione trovato.</div>
            )}
            {piano.totElimina > 0 && (
              <>
                <div style={{ fontSize: 13, marginBottom: 10 }}>
                  Trovati <strong>{piano.totElimina}</strong> doppioni in <strong>{piano.gruppi.length}</strong> gruppi.
                  Verrà conservato 1 documento per numero:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {piano.gruppi.map(g => (
                    <div key={g.numero} style={{ fontSize: 12, background: "var(--bg2, #f5f5f5)", borderRadius: 8, padding: 10 }}>
                      <div style={{ fontWeight: 700 }}>Kit {g.numero} — {g.nome}</div>
                      <div style={{ color: "var(--green-text)" }}>CONSERVA: {g.keep.id}{g.keep.ultimaRevisioneData ? ` (rev. ${g.keep.ultimaRevisioneData})` : ""}</div>
                      {g.elimina.map(d => (
                        <div key={d.id} style={{ color: "#a32d2d" }}>ELIMINA: {d.id}{d.ultimaRevisioneData ? ` (rev. ${d.ultimaRevisioneData})` : ""}</div>
                      ))}
                    </div>
                  ))}
                </div>
                <button
                  onClick={eliminaDoppioni}
                  disabled={dedupRun}
                  style={{
                    background: dedupRun ? "#999" : "#e24b4a", color: "#fff", border: "none",
                    borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 700,
                    cursor: dedupRun ? "not-allowed" : "pointer",
                  }}>
                  {dedupRun ? "Attendere..." : `🗑 Conferma eliminazione (${piano.totElimina})`}
                </button>
              </>
            )}
          </div>
        )}
      </div>

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
