import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { calcolaStato, statoLabel, formatData, giorniAllaScadenza } from "../utils";

export default function KitList({ kits, reload }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("tutti");

  const filtrati = kits.filter(kit => {
    const stato = calcolaStato(kit);
    const matchFiltro =
      filtro === "tutti" ||
      (filtro === "critici" && (stato === "scaduto" || stato === "in_scadenza")) ||
      (filtro === "regolari" && stato === "regolare") ||
      (filtro === "fuori" && (stato === "fuori_servizio" || kit.stato === "magazzino"));

    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      kit.nome.toLowerCase().includes(q) ||
      kit.mezzo.toLowerCase().includes(q) ||
      String(kit.numero).includes(q) ||
      kit.dislocazione?.toLowerCase().includes(q) ||
      kit.componenti?.some(c =>
        c.modello?.toLowerCase().includes(q) ||
        c.matricola?.toLowerCase().includes(q)
      );

    return matchFiltro && matchSearch;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Kit cuscini</h1>
        <Link to="/kit/nuovo" className="btn btn-primary">+ Nuovo kit</Link>
      </div>

      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Cerca per nome, mezzo, matricola..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {["tutti", "critici", "regolari", "fuori"].map(f => (
          <button
            key={f}
            className={`filter-chip ${filtro === f ? "active" : ""}`}
            onClick={() => setFiltro(f)}
          >
            {f === "tutti" ? "Tutti" : f === "critici" ? "Critici" : f === "regolari" ? "Regolari" : "Fuori servizio"}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Nome / Mezzo</th>
                <th>Targa</th>
                <th>Bar</th>
                <th>Dislocazione</th>
                <th>Ultima revisione</th>
                <th>Scade tra</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {filtrati.map(kit => {
                const stato = calcolaStato(kit);
                const giorni = giorniAllaScadenza(kit.dataRevisione);
                return (
                  <tr key={kit.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/kit/${kit.id}`)}>
                    <td><strong>{kit.numero}</strong></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{kit.nome}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>{kit.tipoMezzo}</div>
                    </td>
                    <td className="mono">{kit.mezzo}</td>
                    <td>{kit.bar} bar</td>
                    <td>{kit.dislocazione || "—"}</td>
                    <td>{formatData(kit.dataRevisione)}</td>
                    <td style={{ fontSize: 12 }}>
                      {giorni === null ? "N/D" :
                        giorni < 0 ? <span style={{ color: "#e24b4a", fontWeight: 600 }}>{Math.abs(giorni)}gg fa</span> :
                        giorni <= 60 ? <span style={{ color: "#ba7517", fontWeight: 600 }}>{giorni}gg</span> :
                        <span style={{ color: "#3b6d11" }}>{giorni}gg</span>
                      }
                    </td>
                    <td><span className={`pill ${stato}`}>{statoLabel(stato)}</span></td>
                  </tr>
                );
              })}
              {filtrati.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", color: "#888", padding: 30 }}>Nessun kit trovato</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}