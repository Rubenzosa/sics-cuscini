import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { calcolaStatoGT, statoLabel, prossimaRevisioneGT, formatData, giorniAllaScadenza, sistemaBadge } from "../utils";

// ── RING INDICATOR ──────────────────────────────────────────
function RingIndicator({ giorni, stato }) {
  const size = 58, r = 22, circ = 2 * Math.PI * r;
  let pct = 1, color = "#639922";
  if (stato === "scaduto")          { pct = 0;    color = "#e24b4a"; }
  else if (stato === "critico")     { pct = 0.08; color = "#e24b4a"; }
  else if (stato === "attenzione")  { pct = 0.35; color = "#ba7517"; }
  else if (stato === "buono")       { pct = 0.70; color = "#639922"; }
  else if (stato === "regolare")    { pct = 1;    color = "#639922"; }
  else { pct = 0.5; color = "#888"; }
  const offset = circ * (1 - pct);
  const abs = Math.abs(giorni ?? 0);
  const label = giorni === null ? "N/D"
    : giorni < 0  ? `${abs}gg\nfa`
    : giorni > 999 ? "OK"
    : giorni > 99  ? `${giorni}\ngg`
    : `${giorni}g`;
  const lines = label.split("\n");
  const fs = abs > 99 ? 8 : 10;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ position:"absolute", top:0, left:0, transform:"rotate(-90deg)" }}>
        <circle fill="none" stroke="var(--border)" strokeWidth="3.5" cx={size/2} cy={size/2} r={r}/>
        <circle fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round"
          cx={size/2} cy={size/2} r={r} strokeDasharray={circ} strokeDashoffset={offset}/>
      </svg>
      <div style={{ position:"relative", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", lineHeight:1.1, userSelect:"none" }}>
        {lines.map((l, i) => <span key={i} style={{ fontSize:fs, fontWeight:800, color }}>{l}</span>)}
      </div>
    </div>
  );
}

export default function KanbanMezziTaglio({ gruppi }) {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState("tutti");

  const attivi       = gruppi.filter(g => g.stato === "attivo");
  const magazzino    = gruppi.filter(g => g.stato === "magazzino");
  const fuoriServizio= gruppi.filter(g => g.stato === "fuori_servizio");
  const fuoriUso      = gruppi.filter(g => g.stato === "fuori_uso");

  const filtrati = filtro === "tutti"    ? attivi
    : filtro === "magazzino"             ? magazzino
    : filtro === "fuori"                 ? fuoriServizio
    : filtro === "fuori_uso"             ? fuoriUso
    : attivi.filter(g => {
        const s = calcolaStatoGT(g);
        return filtro === "critici" ? ["scaduto","critico","attenzione"].includes(s)
          : ["buono","regolare"].includes(s);
      });

  const counts = {
    tutti:   attivi.length,
    critici: attivi.filter(g => ["scaduto","critico","attenzione"].includes(calcolaStatoGT(g))).length,
    buoni:   attivi.filter(g => ["buono","regolare"].includes(calcolaStatoGT(g))).length,
  };

  function KanbanCard({ gt }) {
    const stato   = calcolaStatoGT(gt);
    const proxRev = prossimaRevisioneGT(gt);
    const giorni  = giorniAllaScadenza(proxRev);
    const badge   = sistemaBadge(gt.sistema);

    return (
      <div className="kanban-card" onClick={() => navigate(`/gruppi-taglio/${gt.id}`)}>
        <div className={`kanban-card-accent ${stato}`}/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginTop:6 }}>
          <div>
            <div className="kanban-nome">{gt.nome}</div>
            <div className="kanban-targa">{gt.mezzo}</div>
            <div style={{ marginTop:4 }}>
              <span style={{ fontSize:10, fontWeight:700, padding:"1px 7px", borderRadius:8, background:badge.bg, color:badge.color }}>
                {badge.label}
              </span>
              <span style={{ marginLeft:4, fontSize:10, color:"var(--text3)", fontWeight:600 }}>
                {gt.marca}
              </span>
            </div>
          </div>
          <RingIndicator giorni={giorni} stato={stato} />
        </div>
        <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
          <span className={`pill ${stato}`}>{statoLabel(stato)}</span>
        </div>
        <div className="kanban-footer" style={{ marginTop:8 }}>
          <div className="kanban-loc">📍 {gt.dislocazione || "—"}</div>
          <div style={{ fontSize:11, color:"var(--text3)" }}>
            {proxRev && proxRev !== "NO REVISIONE" ? `Rev. ${formatData(proxRev)}` : "No revisione"}
          </div>
        </div>
        {/* Componenti principali */}
        <div style={{ marginTop:8, fontSize:10, color:"var(--text3)", borderTop:"1px solid var(--border)", paddingTop:6 }}>
          {(gt.componenti || []).slice(0, 3).map((c, i) => (
            <span key={i} style={{ marginRight:6 }}>{c.tipo?.split(" ")[0]}</span>
          ))}
          {(gt.componenti || []).length > 3 && <span>+{(gt.componenti||[]).length - 3}</span>}
        </div>
      </div>
    );
  }

  // Riepilogo dislocazioni
  const locs = {};
  gruppi.forEach(g => { if (g.dislocazione) locs[g.dislocazione] = (locs[g.dislocazione]||0)+1; });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mezzi — Gruppi taglio</h1>
          <div style={{ fontSize:12, color:"var(--text3)", marginTop:4 }}>Dislocazione kit da taglio per mezzo</div>
        </div>
      </div>

      {/* Filtri */}
      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {[
          ["tutti",     `Tutti attivi (${counts.tutti})`],
          ["critici",   `Critici (${counts.critici})`],
          ["buoni",     `In regola (${counts.buoni})`],
          ["magazzino", `Magazzino (${magazzino.length})`],
          ["fuori",     `Fuori servizio (${fuoriServizio.length})`],
    ["fuori_uso", `Fuori uso (${gruppi.filter(g=>g.stato==="fuori_uso").length})`],
        ].map(([key, label]) => (
          <button key={key} className={`filter-chip ${filtro===key?"active":""}`}
            onClick={() => setFiltro(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* Riepilogo sedi */}
      {filtro === "tutti" && (
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          {Object.entries(locs).map(([loc, cnt]) => (
            <div key={loc} style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:8, padding:"6px 12px", fontSize:12 }}>
              <span style={{ fontWeight:700, color:"var(--text)" }}>{loc}</span>
              <span style={{ marginLeft:6, background:"var(--blue-bg)", color:"var(--blue-text)", padding:"1px 7px", borderRadius:10, fontSize:11, fontWeight:700 }}>{cnt}</span>
            </div>
          ))}
        </div>
      )}

      {/* Kanban grid */}
      <div className="kanban-grid">
        {filtrati.map(gt => <KanbanCard key={gt.id} gt={gt} />)}
        {!filtrati.length && (
          <div style={{ gridColumn:"1/-1", textAlign:"center", padding:40, color:"var(--text3)" }}>
            Nessun kit in questa categoria
          </div>
        )}
      </div>

      {/* Magazzino e fuori servizio nella vista tutti */}
      {filtro === "tutti" && (magazzino.length > 0 || fuoriServizio.length > 0) && (
        <div className="card" style={{ marginTop:16 }}>
          <div className="card-header"><span className="card-title">Magazzino / Fuori servizio</span></div>
          {[...magazzino, ...fuoriServizio, ...fuoriUso].map(gt => {
            const stato = calcolaStatoGT(gt);
            return (
              <div key={gt.id} className="kit-row" onClick={() => navigate(`/gruppi-taglio/${gt.id}`)}>
                <div className="kit-left">
                  <div className="kit-num">{gt.numero}</div>
                  <div>
                    <div className="kit-name">{gt.nome}</div>
                    <div className="kit-sub">{gt.mezzo} · {gt.marca}</div>
                  </div>
                </div>
                <span className={`pill ${stato}`}>{statoLabel(stato)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}