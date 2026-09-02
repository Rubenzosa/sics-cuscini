import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { creaBackup, listaBackup, ripristinaBackup, eliminaBackup } from "../firebase/backup";

function formatDataOra(iso) {
  if (!iso) return "N/D";
  const d = new Date(iso);
  if (isNaN(d)) return "N/D";
  return d.toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function totaleDocumenti(conteggi) {
  return Object.values(conteggi || {}).reduce((s, n) => s + (n || 0), 0);
}

export default function Backup({ reload }) {
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState("");
  const [lista, setLista] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function provaPw() {
    if (pw === "0577") setAuth(true);
    else alert("Password errata");
  }

  async function ricarica() {
    setLista(await listaBackup());
  }

  useEffect(() => { if (auth) ricarica(); }, [auth]);

  async function handleBackupOra() {
    setBusy(true); setMsg("");
    const id = await creaBackup("manuale");
    await ricarica();
    setBusy(false);
    setMsg(`Backup creato (${id}).`);
  }

  async function handleRipristina(b) {
    const testo = window.prompt(
      `Ripristinare il backup del ${formatDataOra(b.creatoIl)}? Tutti i dati creati dopo quel momento verranno persi.\n\nScrivi RIPRISTINA per confermare.`
    );
    if (testo !== "RIPRISTINA") return;
    setBusy(true); setMsg("");
    const risultato = await ripristinaBackup(b.id);
    setBusy(false);
    setMsg(`Ripristino completato: ${Object.values(risultato).reduce((s, n) => s + n, 0)} documenti riscritti.`);
    if (reload) await reload();
  }

  async function handleElimina(b) {
    if (!window.confirm(`Eliminare il backup del ${formatDataOra(b.creatoIl)}? Non elimina dati dell'app, solo questo backup.`)) return;
    setBusy(true);
    await eliminaBackup(b.id);
    await ricarica();
    setBusy(false);
  }

  if (!auth) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Area amministrazione</h1></div>
        <div className="card" style={{ maxWidth: 360 }}>
          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 10 }}>
            Inserisci la password per accedere a backup e ripristino.
          </p>
          <input type="password" value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") provaPw(); }}
            placeholder="Password" style={{ marginBottom: 10 }} />
          <button className="btn btn-primary" onClick={provaPw}>Entra</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Backup e ripristino</h1></div>
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: "var(--text2)" }}>
          Backup manuale di tutti i dati dell'app (kit cuscini, gruppi taglio, storici, documenti).
          Il ripristino sostituisce interamente il contenuto di ogni collezione con quello del backup scelto:
          i dati creati dopo quel backup vengono persi. I file caricati su Google Drive non sono inclusi.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <button className="btn btn-primary" onClick={handleBackupOra} disabled={busy}>Backup ora</button>
          <Link className="btn btn-secondary" to="/admin/rinumerazione">Rinumerazione seriali</Link>
        </div>
        {msg && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 8 }}>{msg}</div>}
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Backup salvati ({lista.length})</span></div>
        {!lista.length ? (
          <div style={{ padding: 16, color: "var(--text3)", fontSize: 13 }}>Nessun backup ancora creato.</div>
        ) : (
          <div className="bk-list">
            {lista.map(b => (
              <div key={b.id} className="bk-row">
                <div className="bk-meta">
                  <span className="bk-data">{formatDataOra(b.creatoIl)}</span>
                  <span className="bk-sub">
                    {b.etichetta && <span className="bk-tag">{b.etichetta}</span>}
                    {totaleDocumenti(b.conteggi)} documenti
                  </span>
                </div>
                <div className="bk-actions">
                  <button className="gtc-btn go" disabled={busy} onClick={() => handleRipristina(b)}>Ripristina</button>
                  <button className="gtc-btn rev" disabled={busy} onClick={() => handleElimina(b)}>Elimina</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
