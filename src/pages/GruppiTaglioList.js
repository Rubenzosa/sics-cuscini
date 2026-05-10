import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { calcolaStatoGT, statoLabel, prossimaRevisioneGT, formatData, giorniAllaScadenza, sistemaBadge } from "../utils";

function FiltroChip({ label, count, active, onClick }) {
  return (
    <button className={`filter-chip ${active ? "active" : ""}`} onClick={onClick}
      style={{ display:"flex", alignItems:"center", gap:5 }}>
      {label}
      {count !== undefined && (
        <span style={{ fontSize:10, fontWeight:800, background: active?"rgba(255,255,255,0.25)":"var(--border)", color:active?"#fff":"var(--text3)", padding:"1px 5px", borderRadius:10, minWidth:18, textAlign:"center" }}>
          {count}
        </span>
      )}
    </button>
  );
}

export default function GruppiTaglioList({ gruppi, reload }) {
  const navigate = useNavigate();
  const [search, setSearch]           = useState("");
  const [filtroStato, setFiltroStato] = useState("tutti");
  const [filtroSede, setFiltroSede]   = useState([]);
  const [filtroSistema, setFiltroSistema] = useState([]);
  const [filtroMarca, setFiltroMarca] = useState([]);
  const [filtroPressione, setFiltroPressione] = useState([]);
  const [showFiltri, setShowFiltri]   = useState(false);

  // Opzioni filtri dinamiche
  const opts = useMemo(() => ({
    sedi:       [...new Set(gruppi.map(g=>g.dislocazione).filter(Boolean))].sort(),
    sistemi:    [...new Set(gruppi.map(g=>g.sistema).filter(Boolean))].sort(),
    marche:     [...new Set(gruppi.map(g=>g.marca).filter(Boolean))].sort(),
    pressioni:  [...new Set(gruppi.flatMap(g=>(g.componenti||[]).map(c=>c.pressione).filter(Boolean)))].sort(),
  }), [gruppi]);

  function toggle(setter, val) {
    setter(prev => prev.includes(val) ? prev.filter(v=>v!==val) : [...prev, val]);
  }

  function resetFiltri() {
    setFiltroSede([]); setFiltroSistema([]);
    setFiltroMarca([]); setFiltroPressione([]); setSearch("");
  }

  const hasFiltri = filtroSede.length || filtroSistema.length || filtroMarca.length || filtroPressione.length;

  const filtrati = useMemo(() => {
    return gruppi.filter(gt => {
      const stato = calcolaStatoGT(gt);
      const matchStato =
        filtroStato === "tutti" ||
        (filtroStato === "critici"  && (stato==="scaduto"||stato==="critico"||stato==="attenzione")) ||
        (filtroStato === "regolari" && (stato==="buono"||stato==="regolare")) ||
        (filtroStato === "revisione"&& gt.stato==="in_revisione") ||
        (filtroStato === "fuori"    && (gt.stato==="fuori_servizio"||gt.stato==="magazzino"));
      const matchSede     = !filtroSede.length      || filtroSede.includes(gt.dislocazione);
      const matchSistema  = !filtroSistema.length   || filtroSistema.includes(gt.sistema);
      const matchMarca    = !filtroMarca.length     || filtroMarca.some(m => (gt.marca||"").includes(m));
      const matchPressione= !filtroPressione.length || (gt.componenti||[]).some(c => filtroPressione.includes(c.pressione));
      const q = search.toLowerCase().trim();
      const matchSearch   = !q ||
        (gt.nome||"").toLowerCase().includes(q) ||
        (gt.mezzo||"").toLowerCase().includes(q) ||
        (gt.marca||"").toLowerCase().includes(q) ||
        (gt.dislocazione||"").toLowerCase().includes(q) ||
        String(gt.numero).includes(q) ||
        (gt.componenti||[]).some(c =>
          (c.modello||"").toLowerCase().includes(q) ||
          (c.matricola||"").toLowerCase().includes(q) ||
          (c.tipo||"").toLowerCase().includes(q)
        );
      return matchStato && matchSede && matchSistema && matchMarca && matchPressione && matchSearch;
    });
  }, [gruppi, search, filtroStato, filtroSede, filtroSistema, filtroMarca, filtroPressione]);

  function countStato(s) {
    return gruppi.filter(g => {
      const st = calcolaStatoGT(g);
      if (s==="critici")  return st==="scaduto"||st==="critico"||st==="attenzione";
      if (s==="regolari") return st==="buono"||st==="regolare";
      if (s==="revisione")return g.stato==="in_revisione";
      if (s==="fuori")    return g.stato==="fuori_servizio"||g.stato==="magazzino";
      return true;
    }).length;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gruppi da taglio</h1>
          <div style={{ fontSize:12, color:"var(--text3)", marginTop:4 }}>SIMDB — VVF Siena</div>
        </div>
        <Link to="/gruppi-taglio/nuovo" className="btn btn-primary">+ Nuovo gruppo</Link>
      </div>

      {/* Ricerca */}
      <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text3)", fontSize:14, pointerEvents:"none" }}>⌕</span>
          <input className="search-input" style={{ paddingLeft:34 }}
            placeholder="Cerca per nome, targa, modello, matricola..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className={`btn ${showFiltri?"btn-primary":"btn-secondary"}`}
          onClick={() => setShowFiltri(s=>!s)} style={{ position:"relative" }}>
          ⚙ Filtri
          {hasFiltri && (
            <span style={{ position:"absolute", top:-6, right:-6, background:"var(--red)", color:"#fff", fontSize:10, fontWeight:800, width:18, height:18, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {[filtroSede,filtroSistema,filtroMarca,filtroPressione].reduce((s,a)=>s+a.length,0)}
            </span>
          )}
        </button>
        {hasFiltri && (
          <button className="btn btn-secondary" onClick={resetFiltri} style={{ color:"var(--red-text)", borderColor:"#f7c1c1" }}>
            ✕ Reset
          </button>
        )}
      </div>

      {/* Chip stato */}
      <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
        {[["tutti","Tutti"],["critici","Critici"],["regolari","In regola"],["revisione","In revisione"],["fuori","Fuori servizio"]].map(([key,label]) => (
          <FiltroChip key={key} label={label} count={key!=="tutti"?countStato(key):undefined}
            active={filtroStato===key} onClick={() => setFiltroStato(key)} />
        ))}
      </div>

      {/* Chip sede */}
      <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".05em", marginRight:4 }}>Sede:</span>
        <FiltroChip label="Tutte" active={filtroSede.length===0} onClick={() => setFiltroSede([])} />
        {opts.sedi.map(s => (
          <FiltroChip key={s} label={s} count={gruppi.filter(g=>g.dislocazione===s).length}
            active={filtroSede.includes(s)} onClick={() => toggle(setFiltroSede, s)} />
        ))}
      </div>

      {/* Filtri avanzati */}
      {showFiltri && (
        <div className="card" style={{ marginBottom:14, padding:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:16 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 }}>Sistema</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {opts.sistemi.map(s => {
                  const badge = sistemaBadge(s);
                  return (
                    <button key={s} onClick={() => toggle(setFiltroSistema, s)}
                      style={{ padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:700, cursor:"pointer",
                        border:`2px solid ${filtroSistema.includes(s)?badge.color:"var(--border2)"}`,
                        background: filtroSistema.includes(s)?badge.bg:"var(--bg2)",
                        color: filtroSistema.includes(s)?badge.color:"var(--text3)", fontFamily:"inherit" }}>
                      {badge.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 }}>Marca</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {opts.marche.map(m => (
                  <FiltroChip key={m} label={m} count={gruppi.filter(g=>(g.marca||"").includes(m)).length}
                    active={filtroMarca.includes(m)} onClick={() => toggle(setFiltroMarca, m)} />
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 }}>Pressione</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {opts.pressioni.filter(p=>p).map(p => (
                  <FiltroChip key={p} label={p}
                    count={gruppi.filter(g=>(g.componenti||[]).some(c=>c.pressione===p)).length}
                    active={filtroPressione.includes(p)} onClick={() => toggle(setFiltroPressione, p)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ fontSize:12, color:"var(--text3)", marginBottom:10 }}>
        {filtrati.length} {filtrati.length===1?"gruppo trovato":"gruppi trovati"}{filtrati.length!==gruppi.length?` su ${gruppi.length} totali`:""}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Nome / Mezzo</th>
                <th>Targa</th>
                <th>Sistema</th>
                <th>Marca</th>
                <th>Dislocazione</th>
                <th>Prox. revisione</th>
                <th>Giorni</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {filtrati.map(gt => {
                const stato   = calcolaStatoGT(gt);
                const proxRev = prossimaRevisioneGT(gt);
                const giorni  = giorniAllaScadenza(proxRev);
                const badge   = sistemaBadge(gt.sistema);
                return (
                  <tr key={gt.id} style={{ cursor:"pointer" }} onClick={() => navigate(`/gruppi-taglio/${gt.id}`)}>
                    <td><strong>{gt.numero}</strong></td>
                    <td>
                      <div style={{ fontWeight:600 }}>{gt.nome}</div>
                      <div style={{ fontSize:11, color:"var(--text3)" }}>{gt.tipoMezzo}</div>
                    </td>
                    <td className="mono">{gt.mezzo}</td>
                    <td>
                      <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:10, background:badge.bg, color:badge.color }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ fontWeight:600, fontSize:12 }}>{gt.marca}</td>
                    <td>{gt.dislocazione||"—"}</td>
                    <td>{proxRev && proxRev!=="NO REVISIONE" ? formatData(proxRev) : proxRev==="NO REVISIONE"?"N/R":"N/D"}</td>
                    <td style={{ fontSize:12 }}>
                      {giorni===null?"N/D":
                        giorni<0   ?<span style={{color:"var(--red)",fontWeight:600}}>{Math.abs(giorni)}gg fa</span>:
                        giorni<=90 ?<span style={{color:"var(--amber)",fontWeight:600}}>{giorni}gg</span>:
                        <span style={{color:"var(--green)"}}>{giorni}gg</span>}
                    </td>
                    <td><span className={`pill ${stato}`}>{statoLabel(stato)}</span></td>
                  </tr>
                );
              })}
              {!filtrati.length && (
                <tr><td colSpan={9} style={{ textAlign:"center", color:"var(--text3)", padding:36 }}>
                  Nessun gruppo trovato
                  {hasFiltri && <> — <button className="card-action" onClick={resetFiltri}>Reset filtri</button></>}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}