import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { calcolaStato, statoLabel, formatData, giorniAllaScadenza } from "../utils";

function RingIndicator({ giorni, stato }) {
  const size = 58;
  const r = 22;
  const circ = 2 * Math.PI * r;
  let pct = 1;
  let color = "#639922";
  if (stato === "scaduto")         { pct = 0;    color = "#e24b4a"; }
  else if (stato === "critico")    { pct = 0.08; color = "#e24b4a"; }
  else if (stato === "attenzione") { pct = 0.35; color = "#ba7517"; }
  else if (stato === "buono")      { pct = 0.70; color = "#639922"; }
  else if (stato === "regolare")   { pct = 1;    color = "#639922"; }
  else { pct = 0.5; color = "#888"; }
  const offset = circ * (1 - pct);
  // Abbrevia testo lungo: 135g → 135g su due righe o testo ridotto
  const abs = Math.abs(giorni ?? 0);
  const label = giorni === null ? "N/D"
    : giorni < 0  ? `${abs}gg
fa`
    : giorni > 999 ? "OK"
    : giorni > 99  ? `${giorni}
gg`
    : `${giorni}g`;
  const lines = label.split("\n");
  const fs = abs > 99 ? 8 : 10;
  return (
    <div style={{
      position: "relative",
      width: size,
      height: size,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
      >
        <circle fill="none" stroke="var(--border)" strokeWidth="3.5" cx={size/2} cy={size/2} r={r}/>
        <circle fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round"
          cx={size/2} cy={size/2} r={r}
          strokeDasharray={circ} strokeDashoffset={offset}/>
      </svg>
      <div style={{
        position: "relative", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", lineHeight:1.1,
        userSelect: "none",
      }}>
        {lines.map((l, i) => (
          <span key={i} style={{ fontSize: fs, fontWeight: 800, color }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

export default function KanbanMezzi({ kits }) {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState("tutti");

  const attivi = kits.filter(k => k.stato === "attivo");
  const magazzino = kits.filter(k => k.stato === "magazzino");
  const fuoriServizio = kits.filter(k => k.stato === "fuori_servizio");

  const filtrati = filtro === "tutti" ? attivi
    : filtro === "magazzino" ? magazzino
    : filtro === "fuori" ? fuoriServizio
    : attivi.filter(k => calcolaStato(k) === filtro || (filtro === "critici" && ["scaduto","critico","attenzione"].includes(calcolaStato(k))));

  function KanbanCard({ kit }) {
    const stato = calcolaStato(kit);
    const giorni = giorniAllaScadenza(kit.dataRevisione);
    const nComp = kit.componenti?.length || 0;
    return (
      <div className="kanban-card" onClick={() => navigate(`/kit/${kit.id}`)}>
        <div className={`kanban-card-accent ${stato}`}/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 6 }}>
          <div>
            <div className="kanban-mezzo">{kit.nome}</div>
            <div className="kanban-targa">{kit.mezzo}</div>
          </div>
          <RingIndicator giorni={giorni} stato={stato} />
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span className={`pill ${stato}`}>{statoLabel(stato)}</span>
          <span style={{ fontSize: 11, background: "var(--bg3)", color: "var(--text3)", padding: "3px 8px", borderRadius: 10, border: "1px solid var(--border)" }}>
            {kit.bar} bar
          </span>
        </div>
        <div className="kanban-kit" style={{ marginTop: 8 }}>
          Kit {kit.numero} · {nComp} componenti
        </div>
        <div className="kanban-footer">
          <div className="kanban-loc">📍 {kit.dislocazione || "—"}</div>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>
            Rev. {formatData(kit.dataRevisione)}
          </div>
        </div>
      </div>
    );
  }

  const counts = {
    tutti: attivi.length,
    critici: attivi.filter(k => ["scaduto","critico","attenzione"].includes(calcolaStato(k))).length,
    buoni: attivi.filter(k => ["buono","regolare"].includes(calcolaStato(k))).length,
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Mezzi e dislocazione</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { key: "tutti", label: `Tutti attivi (${counts.tutti})` },
            { key: "critici", label: `Critici (${counts.critici})` },
            { key: "buoni", label: `In regola (${counts.buoni})` },
            { key: "magazzino", label: `Magazzino (${magazzino.length})` },
            { key: "fuori", label: `Fuori servizio (${fuoriServizio.length})` },
          ].map(f => (
            <button key={f.key} className={`filter-chip ${filtro === f.key ? "active" : ""}`} onClick={() => setFiltro(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mappa testuale dislocazioni */}
      {filtro === "tutti" && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {["Sede Centrale","Montepulciano","Montalcino","Poggibonsi","Piancastagnaio","Magazzino"].map(loc => {
            const count = kits.filter(k => k.dislocazione === loc).length;
            if (!count) return null;
            return (
              <div key={loc} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: "var(--text)" }}>{loc}</span>
                <span style={{ marginLeft: 6, background: "var(--blue-bg)", color: "var(--blue-text)", padding: "1px 7px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{count}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="kanban-grid">
        {filtrati.map(kit => <KanbanCard key={kit.id} kit={kit} />)}
        {filtrati.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--text3)" }}>
            Nessun kit in questa categoria
          </div>
        )}
      </div>
    </div>
  );
}