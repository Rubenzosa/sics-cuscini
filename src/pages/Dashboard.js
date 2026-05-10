/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { useNavigate } from "react-router-dom";
import { calcolaStato, calcolaStatoGT, statoLabel, formatData, giorniAllaScadenza, prossimaRevisioneGT } from "../utils";

// ── RING INDICATOR ──────────────────────────────────────────
function Ring({ giorni, stato, size = 44 }) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  let pct = 1, color = "#639922";
  if (stato === "scaduto")    { pct = 0;    color = "#e24b4a"; }
  else if (stato === "critico")    { pct = 0.08; color = "#e24b4a"; }
  else if (stato === "attenzione") { pct = 0.35; color = "#ba7517"; }
  else if (stato === "buono")      { pct = 0.70; color = "#639922"; }
  else if (stato === "regolare")   { pct = 1;    color = "#639922"; }
  else { pct = 0.5; color = "#888"; }
  const offset = circ * (1 - pct);
  const label  = giorni === null ? "N/D" : giorni < 0 ? "!" : giorni > 365 ? "OK" : `${giorni}g`;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ position:"absolute", top:0, left:0, transform:"rotate(-90deg)" }}>
        <circle fill="none" stroke="var(--border)" strokeWidth="3.5" cx={size/2} cy={size/2} r={r}/>
        <circle fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round"
          cx={size/2} cy={size/2} r={r} strokeDasharray={circ} strokeDashoffset={offset}/>
      </svg>
      <span style={{ position:"relative", fontSize:9, fontWeight:800, color, lineHeight:1, textAlign:"center" }}>{label}</span>
    </div>
  );
}

// ── SEZIONE SISTEMA ─────────────────────────────────────────
function SezioneSistema({ titolo, colore, coloreTesto, items, onClickItem, onClickTutti, urgenti }) {
  return (
    <div style={{
      background:"var(--bg2)", border:`1px solid var(--border)`,
      borderRadius:"var(--radius)", overflow:"hidden",
      boxShadow:"var(--shadow)", marginBottom:16,
    }}>
      {/* Header colorato */}
      <div style={{ background:colore, padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ color:"#fff", fontWeight:800, fontSize:15, letterSpacing:".02em" }}>{titolo}</div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {urgenti > 0 && (
            <span style={{ background:"rgba(255,255,255,0.25)", color:"#fff", fontSize:11, fontWeight:800, padding:"3px 10px", borderRadius:20 }}>
              {urgenti} CRITICI
            </span>
          )}
          <button
            onClick={onClickTutti}
            style={{ background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", color:"#fff", borderRadius:8, padding:"5px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            Vedi tutti →
          </button>
        </div>
      </div>

      {/* Contenuto */}
      <div style={{ padding:16 }}>
        {!items.length ? (
          <div style={{ textAlign:"center", padding:"20px 0", color:"var(--text3)", fontSize:13 }}>
            ✓ Nessuna scadenza critica
          </div>
        ) : (
          items.map((item, i) => {
            const { stato, giorni, nome, mezzo, sub, id } = item;
            return (
              <div key={id || i}
                onClick={() => onClickItem(id)}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom: i < items.length-1 ? "1px solid var(--border)" : "none", cursor:"pointer" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <Ring giorni={giorni} stato={stato} size={40}/>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:"var(--text)" }}>{nome}</div>
                    <div style={{ fontSize:11, color:"var(--text3)", marginTop:1 }}>{sub}</div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <span className={`pill ${stato}`}>{statoLabel(stato)}</span>
                  <div style={{ fontSize:10, color:"var(--text3)", marginTop:3 }}>
                    {giorni === null ? "N/D" : giorni < 0 ? `Scaduto da ${Math.abs(giorni)}gg` : `Tra ${giorni}gg`}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── DASHBOARD PRINCIPALE ────────────────────────────────────
export default function Dashboard({ kits, gruppiTaglio, sistemaAttivo, setSistema }) {
  const navigate = useNavigate();

  // ── Stats Cuscini
  const scadC  = kits.filter(k => calcolaStato(k) === "scaduto").length;
  const critC  = kits.filter(k => calcolaStato(k) === "critico").length;
  const attC   = kits.filter(k => calcolaStato(k) === "attenzione").length;
  const buoniC = kits.filter(k => ["buono","regolare"].includes(calcolaStato(k))).length;
  const urgentiC = scadC + critC;

  // ── Stats Gruppi Taglio
  const scadT  = gruppiTaglio.filter(g => calcolaStatoGT(g) === "scaduto").length;
  const critT  = gruppiTaglio.filter(g => calcolaStatoGT(g) === "critico").length;
  const attT   = gruppiTaglio.filter(g => calcolaStatoGT(g) === "attenzione").length;
  const buoniT = gruppiTaglio.filter(g => ["buono","regolare"].includes(calcolaStatoGT(g))).length;
  const urgentiT = scadT + critT;

  const urgentiTotali = urgentiC + urgentiT;

  // ── Items critici cuscini
  const criticiCuscini = kits
    .filter(k => ["scaduto","critico","attenzione"].includes(calcolaStato(k)))
    .sort((a,b) => (giorniAllaScadenza(a.dataRevisione)??9999) - (giorniAllaScadenza(b.dataRevisione)??9999))
    .slice(0, 5)
    .map(k => ({
      id: k.id,
      stato: calcolaStato(k),
      giorni: giorniAllaScadenza(k.dataRevisione),
      nome: `Kit ${k.numero} — ${k.nome}`,
      sub: `${k.mezzo} · ${k.bar} bar · ${k.dislocazione}`,
    }));

  // ── Items critici gruppi taglio
  const criticiTaglio = gruppiTaglio
    .filter(g => ["scaduto","critico","attenzione"].includes(calcolaStatoGT(g)))
    .sort((a,b) => (giorniAllaScadenza(prossimaRevisioneGT(a))??9999) - (giorniAllaScadenza(prossimaRevisioneGT(b))??9999))
    .slice(0, 5)
    .map(g => ({
      id: g.id,
      stato: calcolaStatoGT(g),
      giorni: giorniAllaScadenza(prossimaRevisioneGT(g)),
      nome: `Kit ${g.numero} — ${g.nome}`,
      sub: `${g.mezzo} · ${g.sistema} · ${g.dislocazione}`,
    }));

  // ── Prossime scadenze unificate (timeline)
  const tutteScadenze = [
    ...kits.filter(k => k.dataRevisione && k.stato !== "fuori_servizio").map(k => ({
      id: k.id, tipo:"cuscini", nome: `Kit ${k.numero} — ${k.nome}`,
      sub: k.mezzo, data: k.dataRevisione, stato: calcolaStato(k),
      giorni: giorniAllaScadenza(k.dataRevisione),
    })),
    ...gruppiTaglio.filter(g => prossimaRevisioneGT(g) && g.stato !== "fuori_servizio").map(g => ({
      id: g.id, tipo:"taglio", nome: `${g.nome}`,
      sub: `${g.mezzo} · ${g.sistema}`, data: prossimaRevisioneGT(g),
      stato: calcolaStatoGT(g), giorni: giorniAllaScadenza(prossimaRevisioneGT(g)),
    })),
  ].sort((a,b) => (a.giorni??9999) - (b.giorni??9999)).slice(0, 8);

  return (
    <div>
      {/* Alert globale */}
      {urgentiTotali > 0 && (
        <div className="alert-banner" style={{ marginBottom:16 }}>
          ⚠ {urgentiTotali} {urgentiTotali===1?"sistema richiede":"sistemi richiedono"} intervento urgente —
          {urgentiC > 0 && ` ${urgentiC} cuscini`}
          {urgentiC > 0 && urgentiT > 0 && " ·"}
          {urgentiT > 0 && ` ${urgentiT} gruppi taglio`}
        </div>
      )}

      {/* ── STATS GLOBALI ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {/* Cuscini */}
        <div className="stat-card blue" style={{ gridColumn:"span 2", borderTop:"3px solid #1a2b3c", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:8, right:10, fontSize:10, fontWeight:800, color:"#1a2b3c", opacity:.4, textTransform:"uppercase", letterSpacing:".08em" }}>Cuscini</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginTop:12 }}>
            <div><div className="stat-label">Totali</div><div className="stat-num blue" style={{ fontSize:22 }}>{kits.length}</div></div>
            <div><div className="stat-label">Scaduti</div><div className="stat-num red" style={{ fontSize:22 }}>{scadC+critC}</div></div>
            <div><div className="stat-label">Anno corr.</div><div className="stat-num amber" style={{ fontSize:22 }}>{attC}</div></div>
            <div><div className="stat-label">In regola</div><div className="stat-num green" style={{ fontSize:22 }}>{buoniC}</div></div>
          </div>
        </div>
        {/* Gruppi taglio */}
        <div className="stat-card" style={{ gridColumn:"span 2", borderTop:"3px solid #e07020", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:8, right:10, fontSize:10, fontWeight:800, color:"#7a3500", opacity:.5, textTransform:"uppercase", letterSpacing:".08em" }}>Gruppi taglio</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginTop:12 }}>
            <div><div className="stat-label">Totali</div><div style={{ fontSize:22, fontWeight:700, color:"#e07020" }}>{gruppiTaglio.length}</div></div>
            <div><div className="stat-label">Scaduti</div><div className="stat-num red" style={{ fontSize:22 }}>{scadT+critT}</div></div>
            <div><div className="stat-label">Anno corr.</div><div className="stat-num amber" style={{ fontSize:22 }}>{attT}</div></div>
            <div><div className="stat-label">In regola</div><div className="stat-num green" style={{ fontSize:22 }}>{buoniT}</div></div>
          </div>
        </div>
      </div>

      {/* ── DUE SEZIONI DISTINTE ── */}
      <div className="two-col" style={{ marginBottom:16 }}>
        {/* Cuscini */}
        <SezioneSistema
          titolo="Cuscini di Sollevamento"
          colore="#1a2b3c"
          items={criticiCuscini}
          urgenti={urgentiC}
          onClickTutti={() => { setSistema("cuscini"); navigate("/kit"); }}
          onClickItem={id => navigate(`/kit/${id}`)}
        />
        {/* Gruppi taglio */}
        <SezioneSistema
          titolo="Gruppi da Taglio"
          colore="#7a3500"
          items={criticiTaglio}
          urgenti={urgentiT}
          onClickTutti={() => { setSistema("taglio"); navigate("/gruppi-taglio"); }}
          onClickItem={id => navigate(`/gruppi-taglio/${id}`)}
        />
      </div>

      {/* ── TIMELINE UNIFICATA ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Prossime scadenze — tutti i sistemi</span>
          <button className="card-action" onClick={() => navigate("/scadenze")}>Scadenze complete →</button>
        </div>
        <div className="timeline">
          {tutteScadenze.map((item, i) => {
            const dotC = item.stato==="scaduto"||item.stato==="critico"?"red":item.stato==="attenzione"?"amber":item.stato==="buono"||item.stato==="regolare"?"green":"gray";
            const isTaglio = item.tipo === "taglio";
            return (
              <div key={item.id+i} className="timeline-item"
                onClick={() => navigate(isTaglio?`/gruppi-taglio/${item.id}`:`/kit/${item.id}`)}
                style={{ cursor:"pointer" }}>
                <div className={`timeline-dot ${dotC}`}/>
                <div className="timeline-date" style={{ display:"flex", alignItems:"center", gap:6 }}>
                  {formatData(item.data)}
                  <span style={{
                    fontSize:9, fontWeight:800, padding:"1px 6px", borderRadius:8,
                    background: isTaglio?"#7a3500":"#1a2b3c", color:"#fff",
                  }}>
                    {isTaglio?"TAGLIO":"CUSCINI"}
                  </span>
                </div>
                <div className="timeline-title">{item.nome}</div>
                <div className="timeline-sub">
                  {item.sub}
                  {item.giorni !== null && (
                    <span style={{ marginLeft:8, fontWeight:700,
                      color: dotC==="red"?"var(--red)":dotC==="amber"?"var(--amber)":"var(--green)" }}>
                      ({item.giorni < 0 ? `scaduto da ${Math.abs(item.giorni)}gg` : `tra ${item.giorni}gg`})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}