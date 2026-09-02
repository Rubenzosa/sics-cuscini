import React, { useState } from "react";
import { Link } from "react-router-dom";
import { previewRinumerazioneCuscini, applicaRinumerazioneCuscini } from "../firebase/migrazione";
import { getAllKits } from "../firebase/service";

export default function Rinumerazione({ reload }) {
  const [mappa, setMappa] = useState(null);
  const [busy, setBusy] = useState(false);
  const [fatto, setFatto] = useState(false);
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState("");
  const [backupFatto, setBackupFatto] = useState(false);

  function provaPw() {
    if (pw === "0577") setAuth(true);
    else alert("Password errata");
  }

  // Scarica un JSON con lo stato attuale di tutti i kit cuscini (pre-modifica).
  async function scaricaBackup() {
    const kits = await getAllKits();
    const blob = new Blob([JSON.stringify(kits, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-kits-cuscini-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupFatto(true);
    return kits;
  }

  async function anteprima() {
    setBusy(true); setFatto(false);
    setMappa(await previewRinumerazioneCuscini());
    setBusy(false);
  }
  async function applica() {
    if (!window.confirm("Applicare la rinumerazione a TUTTI i cuscini? Verifica prima che l'anteprima coincida con l'appendice di numerazione.md.")) return;
    setBusy(true);
    await scaricaBackup();
    const m = await applicaRinumerazioneCuscini();
    setMappa(m); setFatto(true); setBusy(false);
    if (reload) await reload();
  }

  if (!auth) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Area amministrazione</h1></div>
        <div className="card" style={{ maxWidth: 360 }}>
          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 10 }}>
            Inserisci la password per accedere alla rinumerazione.
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
      <div className="page-header"><h1 className="page-title">Rinumerazione seriali cuscini</h1></div>
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: "var(--text2)" }}>
          Ricalcola le matricole Lucca dei cuscini con contatore unico condiviso da tutte le categorie (001, 002, ...).
          Operazione idempotente: salva <code>vecchio_codice</code>. Solo cuscini, i gruppi taglio non sono toccati.
          "Applica" scarica in automatico un backup JSON di tutti i kit prima di scrivere.
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn btn-secondary" onClick={scaricaBackup} disabled={busy}>Scarica backup</button>
          <button className="btn btn-secondary" onClick={anteprima} disabled={busy}>Anteprima</button>
          <button className="btn btn-primary" onClick={applica} disabled={busy || !mappa}>Applica</button>
          <Link className="btn btn-secondary" to="/admin/backup">Backup e ripristino</Link>
        </div>
        {backupFatto && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 8 }}>✓ Backup scaricato nella cartella Download.</div>}
      </div>

      {fatto && <div className="section-green" style={{ marginBottom: 12 }}>✓ Rinumerazione applicata: {mappa.length} codici aggiornati.</div>}

      {mappa && (
        <div className="card">
          <div className="card-header"><span className="card-title">{fatto ? "Applicati" : "Anteprima"} — {mappa.length} cambiamenti</span></div>
          {!mappa.length ? (
            <div style={{ padding: 16, color: "var(--text3)", fontSize: 13 }}>Nessun cambiamento: i codici sono già rinumerati.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {mappa.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12, padding: "6px 10px", background: "var(--bg3)", borderRadius: 8 }}>
                  <span style={{ minWidth: 60, color: "var(--text3)" }}>Kit {m.kitNumero}</span>
                  <span style={{ flex: 1 }}>{m.tipo}</span>
                  <span style={{ fontFamily: "monospace", color: "var(--text3)" }}>{m.vecchio}</span>
                  <span>→</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 800, color: "var(--blue-text)" }}>{m.nuovo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
