import React from "react";
import { useNavigate } from "react-router-dom";
import { calcolaStato, statoLabel, formatData, giorniAllaScadenza } from "../utils";

export default function Scadenze({ kits }) {
  const navigate = useNavigate();

  const ordinati = [...kits]
    .filter(k => k.stato !== "fuori_servizio")
    .sort((a, b) => {
      const ga = giorniAllaScadenza(a.dataRevisione) ?? 99999;
      const gb = giorniAllaScadenza(b.dataRevisione) ?? 99999;
      return ga - gb;
    });

  const scaduti = ordinati.filter(k => calcolaStato(k) === "scaduto");
  const inScadenza = ordinati.filter(k => calcolaStato(k) === "in_scadenza");
  const regolari = ordinati.filter(k => calcolaStato(k) === "regolare");
  const altri = ordinati.filter(k => !["scaduto","in_scadenza","regolare"].includes(calcolaStato(k)));

  function Gruppo({ titolo, items, colore }) {
    if (!items.length) return null;
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: colore, marginBottom: 10 }}>
          {titolo} ({items.length})
        </div>
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Kit</th>
                  <th>Nome</th>
                  <th>Mezzo</th>
                  <th>Bar</th>
                  <th>Dislocazione</th>
                  <th>Data revisione</th>
                  <th>Giorni</th>
                  <th>Stato</th>
                </tr>
              </thead>
              <tbody>
                {items.map(kit => {
                  const stato = calcolaStato(kit);
                  const giorni = giorniAllaScadenza(kit.dataRevisione);
                  return (
                    <tr key={kit.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/kit/${kit.id}`)}>
                      <td><strong>{kit.numero}</strong></td>
                      <td style={{ fontWeight: 500 }}>{kit.nome}</td>
                      <td className="mono">{kit.mezzo}</td>
                      <td>{kit.bar} bar</td>
                      <td>{kit.dislocazione || "—"}</td>
                      <td>{formatData(kit.dataRevisione)}</td>
                      <td>
                        {giorni === null ? "N/D" :
                          giorni < 0
                            ? <span style={{ color: "#e24b4a", fontWeight: 700 }}>-{Math.abs(giorni)}gg</span>
                            : <span style={{ color: giorni <= 60 ? "#ba7517" : "#3b6d11", fontWeight: 600 }}>{giorni}gg</span>
                        }
                      </td>
                      <td><span className={`pill ${stato}`}>{statoLabel(stato)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Scadenze revisioni</h1>
      </div>

      <div className="stats-row" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Scaduti</div>
          <div className="stat-num red">{scaduti.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In scadenza (60gg)</div>
          <div className="stat-num amber">{inScadenza.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Regolari</div>
          <div className="stat-num green">{regolari.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Altri</div>
          <div className="stat-num blue">{altri.length}</div>
        </div>
      </div>

      <Gruppo titolo="Scaduti — revisione urgente" items={scaduti} colore="#a32d2d" />
      <Gruppo titolo="In scadenza entro 60 giorni" items={inScadenza} colore="#854f0b" />
      <Gruppo titolo="Regolari" items={regolari} colore="#3b6d11" />
      <Gruppo titolo="Magazzino / altri" items={altri} colore="#555" />
    </div>
  );
}