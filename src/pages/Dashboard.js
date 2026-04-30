import React from "react";
import { useNavigate } from "react-router-dom";
import { calcolaStato, statoLabel, formatData, giorniAllaScadenza } from "../utils";

export default function Dashboard({ kits }) {
  const navigate = useNavigate();

  const totali = kits.length;
  const scaduti = kits.filter(k => calcolaStato(k) === "scaduto").length;
  const inScadenza = kits.filter(k => calcolaStato(k) === "in_scadenza").length;
  const regolari = kits.filter(k => calcolaStato(k) === "regolare").length;

  const critici = kits
    .filter(k => ["scaduto", "in_scadenza"].includes(calcolaStato(k)))
    .sort((a, b) => {
      const ga = giorniAllaScadenza(a.dataRevisione) ?? 9999;
      const gb = giorniAllaScadenza(b.dataRevisione) ?? 9999;
      return ga - gb;
    });

  const attivi = kits.filter(k => k.stato === "attivo");

  return (
    <div>
      {scaduti > 0 && (
        <div className="alert-banner">
          ⚠ {scaduti} {scaduti === 1 ? "kit è scaduto" : "kit sono scaduti"} — richiedono revisione immediata
        </div>
      )}

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Kit totali</div>
          <div className="stat-num blue">{totali}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Scaduti</div>
          <div className="stat-num red">{scaduti}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In scadenza (60gg)</div>
          <div className="stat-num amber">{inScadenza}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Regolari</div>
          <div className="stat-num green">{regolari}</div>
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Scadenze critiche</span>
            <button className="card-action" onClick={() => navigate("/scadenze")}>Vedi tutte →</button>
          </div>
          {critici.length === 0 ? (
            <p style={{ color: "#888", fontSize: 13 }}>Nessuna scadenza critica. Ottimo!</p>
          ) : (
            critici.map(kit => {
              const stato = calcolaStato(kit);
              const giorni = giorniAllaScadenza(kit.dataRevisione);
              return (
                <div key={kit.id} className="kit-row" onClick={() => navigate(`/kit/${kit.id}`)}>
                  <div className="kit-left">
                    <div className="kit-num">{kit.numero}</div>
                    <div>
                      <div className="kit-name">Kit {kit.numero} — {kit.nome}</div>
                      <div className="kit-sub">{kit.mezzo} · {kit.bar} bar</div>
                    </div>
                  </div>
                  <div className="kit-right">
                    <span className={`pill ${stato}`}>{statoLabel(stato)}</span>
                    <div className="kit-date">
                      {giorni !== null
                        ? giorni < 0
                          ? `Scaduto da ${Math.abs(giorni)} giorni`
                          : `Scade in ${giorni} giorni`
                        : "Data N/D"}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Mezzi attivi</span>
            <button className="card-action" onClick={() => navigate("/kit")}>Tutti i kit →</button>
          </div>
          <div className="mezzi-grid">
            {attivi.map(kit => {
              const stato = calcolaStato(kit);
              return (
                <div
                  key={kit.id}
                  className="mezzo-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/kit/${kit.id}`)}
                >
                  <div className="mezzo-name">{kit.nome}</div>
                  <div className="mezzo-targa">{kit.mezzo}</div>
                  <div className="mezzo-dots">
                    <span className={`dot ${stato}`}></span>
                    <span style={{ fontSize: 10, color: "#888", marginLeft: 4 }}>{statoLabel(stato)}</span>
                  </div>
                  <div className="mezzo-loc">{kit.dislocazione}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}