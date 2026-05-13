import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { calcolaStato, statoLabel, formatData, giorniAllaScadenza } from "../utils";

function useFilterOptions(kits) {
  return useMemo(() => ({
    bar:    [...new Set(kits.map(k => k.bar).filter(Boolean))].sort((a,b)=>a-b),
    sedi:   [...new Set(kits.map(k => k.dislocazione).filter(Boolean))].sort(),
    marche: [...new Set(kits.flatMap(k=>(k.componenti||[]).map(c=>(c.modello||"").split(" ")[0])).filter(Boolean))].sort(),
  }), [kits]);
}

function Ring({ giorni, stato }) {
  const size = 52, r = 20, circ = 2 * Math.PI * r;
  let pct = 1, color = "#639922";
  if (stato==="scaduto")         { pct=0;    color="#e24b4a"; }
  else if (stato==="critico")    { pct=0.08; color="#e24b4a"; }
  else if (stato==="attenzione") { pct=0.35; color="#ba7517"; }
  else if (stato==="buono")      { pct=0.70; color="#639922"; }
  else if (stato==="regolare")   { pct=1;    color="#639922"; }
  else { pct=0.5; color="#888"; }
  const offset = circ*(1-pct);
  const abs = Math.abs(giorni??0);
  const label = giorni===null?"N/D":giorni<0?`${abs}\nfa`:giorni>999?"OK":giorni>99?`${giorni}\ngg`:`${giorni}g`;
  const lines = label.split("\n");
  const fs = abs>99?8:10;
  return (
    <div style={{position:"relative",width:size,height:size,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{position:"absolute",top:0,left:0,transform:"rotate(-90deg)"}}>
        <circle fill="none" stroke="var(--border)" strokeWidth="3.5" cx={size/2} cy={size/2} r={r}/>
        <circle fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" cx={size/2} cy={size/2} r={r} strokeDasharray={circ} strokeDashoffset={offset}/>
      </svg>
      <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",lineHeight:1.1}}>
        {lines.map((l,i)=><span key={i} style={{fontSize:fs,fontWeight:800,color}}>{l}</span>)}
      </div>
    </div>
  );
}

// Card kanban per singolo kit
function KitCard({ kit, onClick }) {
  const stato  = calcolaStato(kit);
  const giorni = giorniAllaScadenza(kit.dataRevisione);
  const borderColor = stato==="scaduto"||stato==="critico"?"var(--red)":stato==="attenzione"?"var(--amber)":stato==="buono"||stato==="regolare"?"var(--green)":"var(--border)";

  // Matricole Lucca dal primo componente di ogni tipo
  const lucca = (kit.componenti||[])
    .filter(c => c.matricolaLucca)
    .slice(0,3)
    .map(c => c.matricolaLucca);

  return (
    <div onClick={onClick} style={{
      background:"var(--bg2)", border:`1px solid var(--border)`,
      borderTop:`4px solid ${borderColor}`,
      borderRadius:"var(--radius-sm)", padding:"14px 16px",
      cursor:"pointer", transition:"transform .15s, box-shadow .15s",
      boxShadow:"var(--shadow)",
    }}
    onMouseOver={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,.12)";}}
    onMouseOut={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="var(--shadow)";}}>

      {/* Header: numero kit + ring */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{
          fontSize:28, fontWeight:900, color:"var(--accent)",
          lineHeight:1, letterSpacing:"-0.5px",
        }}>
          {kit.numero}
        </div>
        <Ring giorni={giorni} stato={stato}/>
      </div>

      {/* Nome mezzo */}
      <div style={{fontWeight:700,fontSize:14,color:"var(--text)",marginBottom:4}}>{kit.nome}</div>
      <div style={{fontSize:12,color:"var(--text3)",fontFamily:"monospace",marginBottom:6}}>{kit.mezzo}</div>

      {/* Info rapide */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
        <span style={{fontSize:11,fontWeight:700,color:"var(--text2)"}}>{kit.bar} bar</span>
        <span style={{fontSize:11,color:"var(--text3)"}}>·</span>
        <span style={{fontSize:11,color:"var(--text3)"}}>{kit.dislocazione}</span>
      </div>

      {/* Matricole Lucca — in evidenza */}
      {lucca.length > 0 && (
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {lucca.map((m,i)=>(
            <span key={i} style={{
              fontFamily:"monospace",fontWeight:800,fontSize:10,
              color:"var(--blue-text)",background:"var(--blue-bg)",
              padding:"2px 6px",borderRadius:4,
            }}>{m}</span>
          ))}
          {(kit.componenti||[]).filter(c=>c.matricolaLucca).length > 3 && (
            <span style={{fontSize:10,color:"var(--text3)"}}>+{(kit.componenti||[]).filter(c=>c.matricolaLucca).length-3}</span>
          )}
        </div>
      )}

      {/* Stato + data revisione */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span className={`pill ${stato}`}>{statoLabel(stato)}</span>
        <span style={{fontSize:10,color:"var(--text3)"}}>{formatData(kit.dataRevisione)}</span>
      </div>
    </div>
  );
}

export default function KitList({ kits, reload }) {
  const navigate = useNavigate();
  const [search, setSearch]           = useState("");
  const [filtroStato, setFiltroStato] = useState("tutti");
  const [filtroSede, setFiltroSede]   = useState([]);
  const [filtroBar, setFiltroBar]     = useState([]);
  const [filtroMarca, setFiltroMarca] = useState([]);
  const [showFiltri, setShowFiltri]   = useState(false);

  const opts = useFilterOptions(kits);

  function toggle(setter, val) {
    setter(prev => prev.includes(val) ? prev.filter(v=>v!==val) : [...prev,val]);
  }
  function resetFiltri() {
    setFiltroSede([]); setFiltroBar([]); setFiltroMarca([]); setSearch("");
  }

  const hasFiltri = filtroSede.length||filtroBar.length||filtroMarca.length;

  const filtrati = useMemo(() => kits.filter(kit => {
    const stato = calcolaStato(kit);
    const mS = filtroStato==="tutti"
      || (filtroStato==="critici"  && ["scaduto","critico","attenzione"].includes(stato))
      || (filtroStato==="regolari" && ["buono","regolare"].includes(stato))
      || (filtroStato==="fuori"    && kit.stato==="fuori_servizio")
      || (filtroStato==="fuori_uso"&& kit.stato==="fuori_uso")
      || (filtroStato==="magazzino"&& kit.stato==="magazzino");
    const mBar  = !filtroBar.length  || filtroBar.includes(kit.bar);
    const mSede = !filtroSede.length || filtroSede.includes(kit.dislocazione);
    const mMarca= !filtroMarca.length|| (kit.componenti||[]).some(c=>filtroMarca.some(m=>(c.modello||"").toUpperCase().includes(m.toUpperCase())));
    const q = search.toLowerCase().trim();
    const mQ = !q || [String(kit.numero),kit.nome,kit.mezzo,kit.dislocazione,String(kit.bar)].some(v=>v&&v.toLowerCase().includes(q))
      || (kit.componenti||[]).some(c=>[c.modello,c.matricola,c.matricolaLucca].some(v=>v&&v.toLowerCase().includes(q)));
    return mS&&mBar&&mSede&&mMarca&&mQ;
  }), [kits,search,filtroStato,filtroSede,filtroBar,filtroMarca]);

  function countStato(s) {
    return kits.filter(k=>{
      const st=calcolaStato(k);
      if(s==="critici")   return ["scaduto","critico","attenzione"].includes(st);
      if(s==="regolari")  return ["buono","regolare"].includes(st);
      if(s==="fuori")     return k.stato==="fuori_servizio";
      if(s==="fuori_uso") return k.stato==="fuori_uso";
      if(s==="magazzino") return k.stato==="magazzino";
      return true;
    }).length;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Kit cuscini ({filtrati.length})</h1>
        <Link to="/kit/nuovo" className="btn btn-primary">+ Nuovo kit</Link>
      </div>

      {/* Ricerca */}
      <div style={{position:"relative",marginBottom:10}}>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--text3)",fontSize:16,pointerEvents:"none"}}>⌕</span>
        <input className="search-input" style={{paddingLeft:40,fontSize:14}}
          placeholder="Cerca per numero, nome, matricola Lucca, modello..."
          value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {/* Chip stato */}
      <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
        {[["tutti","Tutti"],["critici","Critici"],["regolari","In regola"],["fuori","F. Servizio"],["fuori_uso","Fuori uso"],["magazzino","Magazzino"]].map(([key,label])=>(
          <button key={key} className={`filter-chip ${filtroStato===key?"active":""}`}
            onClick={()=>setFiltroStato(key)}>
            {label}{key!=="tutti"?` (${countStato(key)})`:""}
          </button>
        ))}
      </div>

      {/* Sede */}
      <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:11,fontWeight:800,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".05em"}}>Sede:</span>
        <button className={`filter-chip ${filtroSede.length===0?"active":""}`} onClick={()=>setFiltroSede([])}>Tutte</button>
        {opts.sedi.map(s=>(
          <button key={s} className={`filter-chip ${filtroSede.includes(s)?"active":""}`}
            onClick={()=>toggle(setFiltroSede,s)}>
            {s} ({kits.filter(k=>k.dislocazione===s).length})
          </button>
        ))}
        <button className={`btn btn-sm ${showFiltri?"btn-primary":"btn-secondary"}`}
          style={{marginLeft:"auto"}} onClick={()=>setShowFiltri(s=>!s)}>
          ⚙ Filtri{hasFiltri?` (${[filtroBar,filtroMarca].reduce((s,a)=>s+a.length,0)})`:""}
        </button>
      </div>

      {/* Filtri avanzati */}
      {showFiltri && (
        <div className="card" style={{marginBottom:12,padding:14}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14}}>
            <div>
              <div style={{fontSize:11,fontWeight:800,color:"var(--text3)",textTransform:"uppercase",marginBottom:6}}>Bar</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {opts.bar.map(b=>(
                  <button key={b} className={`filter-chip ${filtroBar.includes(b)?"active":""}`}
                    onClick={()=>toggle(setFiltroBar,b)}>
                    {b} bar ({kits.filter(k=>k.bar===b).length})
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:800,color:"var(--text3)",textTransform:"uppercase",marginBottom:6}}>Marca</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {opts.marche.map(m=>(
                  <button key={m} className={`filter-chip ${filtroMarca.includes(m)?"active":""}`}
                    onClick={()=>toggle(setFiltroMarca,m)}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {hasFiltri && <button className="btn btn-secondary" style={{marginTop:10,fontSize:12,color:"var(--red-text)"}} onClick={resetFiltri}>✕ Reset filtri</button>}
        </div>
      )}

      {/* Risultati */}
      <div style={{fontSize:13,color:"var(--text3)",marginBottom:12}}>
        {filtrati.length} {filtrati.length===1?"kit":"kit"} trovati
        {filtrati.length!==kits.length?` su ${kits.length} totali`:""}
      </div>

      {/* KANBAN GRID */}
      {!filtrati.length ? (
        <div style={{textAlign:"center",padding:40,color:"var(--text3)",fontSize:14}}>
          Nessun kit trovato.{" "}
          {hasFiltri&&<button className="card-action" onClick={resetFiltri}>Reset filtri</button>}
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
          {filtrati
            .sort((a,b)=>(giorniAllaScadenza(a.dataRevisione)??9999)-(giorniAllaScadenza(b.dataRevisione)??9999))
            .map(kit=>(
              <KitCard key={kit.id} kit={kit} onClick={()=>navigate(`/kit/${kit.id}`)}/>
            ))}
        </div>
      )}
    </div>
  );
}