import React from "react";
import { useNavigate } from "react-router-dom";
import { calcolaStato, statoLabel, formatData, giorniAllaScadenza } from "../utils";

function RingIndicator({ giorni, stato }) {
  const size = 40; const r = 16; const circ = 2 * Math.PI * r;
  let pct = 1; let color = "#639922";
  if (stato === "scaduto") { pct = 0; color = "#e24b4a"; }
  else if (stato === "critico") { pct = 0.08; color = "#e24b4a"; }
  else if (stato === "attenzione") { pct = 0.35; color = "#ba7517"; }
  else if (stato === "buono") { pct = 0.70; color = "#639922"; }
  else { pct = 1; color = "#639922"; }
  const offset = circ * (1 - pct);
  const label = giorni === null ? "N/D" : giorni < 0 ? "!" : giorni > 365 ? "OK" : `${giorni}g`;
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring-bg" cx={size/2} cy={size/2} r={r}/>
        <circle className="ring-fg" cx={size/2} cy={size/2} r={r} stroke={color} strokeDasharray={circ} strokeDashoffset={offset}/>
      </svg>
      <div className="ring-label" style={{ color, fontSize: 9 }}>{label}</div>
    </div>
  );
}

export default function Dashboard({ kits }) {
  const navigate = useNavigate();
  const scaduti   = kits.filter(k => calcolaStato(k) === "scaduto").length;
  const critici   = kits.filter(k => calcolaStato(k) === "critico").length;
  const attenzione = kits.filter(k => calcolaStato(k) === "attenzione").length;
  const buoni     = kits.filter(k => ["buono","regolare"].includes(calcolaStato(k))).length;

  const urgenti = kits
    .filter(k => ["scaduto","critico","attenzione"].includes(calcolaStato(k)))
    .sort((a, b) => (giorniAllaScadenza(a.dataRevisione) ?? 9999) - (giorniAllaScadenza(b.dataRevisione) ?? 9999));

  const attivi = kits.filter(k => k.stato === "attivo");

  // Timeline: ultimi acquisti + prossime scadenze
  const timelineItems = [...kits]
    .filter(k => k.dataRevisione)
    .sort((a, b) => new Date(a.dataRevisione) - new Date(b.dataRevisione))
    .slice(0, 6);

  return (
    <div>
      {(scaduti + critici) > 0 && (
        <div className="alert-banner">
          ⚠ {scaduti + critici} {scaduti + critici === 1 ? "kit richiede" : "kit richiedono"} intervento urgente
        </div>
      )}

      <div className="stats-row">
        <div className="stat-card blue">
          <div className="stat-label">Kit totali</div>
          <div className="stat-num blue">{kits.length}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Scaduti / entro 3 mesi</div>
          <div className="stat-num red">{scaduti + critici}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Scade quest'anno</div>
          <div className="stat-num amber">{attenzione}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">In regola</div>
          <div className="stat-num green">{buoni}</div>
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: 16 }}>
        {/* SCADENZE CRITICHE */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Scadenze critiche</span>
            <button className="card-action" onClick={() => navigate("/scadenze")}>Vedi tutte →</button>
          </div>
          {urgenti.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text3)", fontSize: 13 }}>
              ✓ Nessuna scadenza critica
            </div>
          ) : (
            urgenti.map(kit => {
              const stato = calcolaStato(kit);
              const giorni = giorniAllaScadenza(kit.dataRevisione);
              return (
                <div key={kit.id} className="kit-row" onClick={() => navigate(`/kit/${kit.id}`)}>
                  <div className="kit-left">
                    <RingIndicator giorni={giorni} stato={stato} />
                    <div>
                      <div className="kit-name">Kit {kit.numero} — {kit.nome}</div>
                      <div className="kit-sub">{kit.mezzo} · {kit.bar} bar · {kit.dislocazione}</div>
                    </div>
                  </div>
                  <div className="kit-right">
                    <span className={`pill ${stato}`}>{statoLabel(stato)}</span>
                    <div className="kit-date">
                      {giorni !== null ? giorni < 0 ? `Scaduto da ${Math.abs(giorni)}gg` : `Scade in ${giorni}gg` : "N/D"}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* TIMELINE SCADENZE */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Timeline revisioni</span>
            <button className="card-action" onClick={() => navigate("/mezzi")}>Vista mezzi →</button>
          </div>
          <div className="timeline">
            {timelineItems.map(kit => {
              const stato = calcolaStato(kit);
              const dotColor = stato === "scaduto" || stato === "critico" ? "red"
                : stato === "attenzione" ? "amber"
                : stato === "buono" || stato === "regolare" ? "green" : "gray";
              const giorni = giorniAllaScadenza(kit.dataRevisione);
              return (
                <div key={kit.id} className="timeline-item" onClick={() => navigate(`/kit/${kit.id}`)} style={{ cursor: "pointer" }}>
                  <div className={`timeline-dot ${dotColor}`}/>
                  <div className="timeline-date">{formatData(kit.dataRevisione)}</div>
                  <div className="timeline-title">Kit {kit.numero} — {kit.nome}</div>
                  <div className="timeline-sub">
                    {kit.mezzo} · {kit.dislocazione}
                    {giorni !== null && (
                      <span style={{ marginLeft: 8, fontWeight: 600, color: dotColor === "red" ? "var(--red)" : dotColor === "amber" ? "var(--amber)" : "var(--green)" }}>
                        {giorni < 0 ? `scaduto da ${Math.abs(giorni)}gg` : `tra ${giorni}gg`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MEZZI ATTIVI */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Mezzi attivi ({attivi.length})</span>
          <button className="card-action" onClick={() => navigate("/mezzi")}>Vista Kanban →</button>
        </div>
        <div className="mezzi-grid">
          {attivi.map(kit => {
            const stato = calcolaStato(kit);
            const giorni = giorniAllaScadenza(kit.dataRevisione);
            return (
              <div key={kit.id} className="mezzo-card" onClick={() => navigate(`/kit/${kit.id}`)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="mezzo-name">{kit.nome}</div>
                    <div className="mezzo-targa">{kit.mezzo}</div>
                  </div>
                  <RingIndicator giorni={giorni} stato={stato} />
                </div>
                <div className="mezzo-dots" style={{ marginTop: 8 }}>
                  <span className={`dot ${stato}`}/>
                  <span style={{ fontSize: 10, color: "var(--text3)", marginLeft: 4 }}>{statoLabel(stato)}</span>
                </div>
                <div className="mezzo-loc">{kit.dislocazione}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}