import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { calcolaStatoGT, statoLabel, prossimaRevisioneGT, formatData, giorniAllaScadenza, sistemaBadge } from "../utils";

function Ring({ giorni, stato }) {
  const size=52, r=20, circ=2*Math.PI*r;
  let pct=1, color="#639922";
  if(stato==="scaduto")        {pct=0;   color="#e24b4a";}
  else if(stato==="critico")   {pct=.08; color="#e24b4a";}
  else if(stato==="attenzione"){pct=.35; color="#ba7517";}
  else if(stato==="buono")     {pct=.70; color="#639922";}
  else if(stato==="regolare")  {pct=1;   color="#639922";}
  else{pct=.5; color="#888";}
  const offset=circ*(1-pct);
  const abs=Math.abs(giorni??0);
  const label=giorni===null?"N/D":giorni<0?`${abs}\nfa`:giorni>999?"OK":giorni>99?`${giorni}\ngg`:`${giorni}g`;
  const lines=label.split("\n");
  const fs=abs>99?8:10;
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

function GTCard({ gt, onClick }) {
  const stato   = calcolaStatoGT(gt);
  const proxRev = prossimaRevisioneGT(gt);
  const giorni  = giorniAllaScadenza(proxRev);
  const badge   = sistemaBadge(gt.sistema);
  const borderColor = stato==="scaduto"||stato==="critico"?"var(--red)":stato==="attenzione"?"var(--amber)":stato==="buono"||stato==="regolare"?"var(--green)":"var(--border)";

  // Componenti principali
  const mainComp = (gt.componenti||[])
    .filter(c => c.tipo?.includes("CESOIA")||c.tipo?.includes("DIVARICATORE")||c.tipo?.includes("CENTRALINA"))
    .slice(0,2);

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

      {/* Header: numero + ring */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:28,fontWeight:900,color:"var(--accent)",lineHeight:1}}>
          {gt.numero}
        </div>
        <Ring giorni={giorni} stato={stato}/>
      </div>

      {/* Nome */}
      <div style={{fontWeight:700,fontSize:14,color:"var(--text)",marginBottom:4}}>{gt.nome}</div>
      <div style={{fontSize:12,color:"var(--text3)",fontFamily:"monospace",marginBottom:6}}>{gt.mezzo}</div>

      {/* Badge sistema + marca */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
        <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:10,background:badge.bg,color:badge.color}}>
          {badge.label}
        </span>
        <span style={{fontSize:11,fontWeight:600,color:"var(--text3)"}}>{gt.marca}</span>
      </div>

      {/* Componenti principali */}
      {mainComp.length > 0 && (
        <div style={{marginBottom:8}}>
          {mainComp.map((c,i)=>(
            <div key={i} style={{fontSize:10,color:"var(--text3)",display:"flex",justifyContent:"space-between"}}>
              <span>{c.tipo}</span>
              <span style={{fontFamily:"monospace"}}>{c.matricola||"—"}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sede + stato + data */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
        <div>
          <span className={`pill ${stato}`}>{statoLabel(stato)}</span>
          <div style={{fontSize:10,color:"var(--text3)",marginTop:3}}>📍 {gt.dislocazione}</div>
        </div>
        <span style={{fontSize:10,color:"var(--text3)"}}>{proxRev&&proxRev!=="NO REVISIONE"?formatData(proxRev):"No rev."}</span>
      </div>
    </div>
  );
}

export default function GruppiTaglioList({ gruppi, reload }) {
  const navigate = useNavigate();
  const [search, setSearch]           = useState("");
  const [filtroStato, setFiltroStato] = useState("tutti");
  const [filtroSede, setFiltroSede]   = useState([]);
  const [filtroSistema, setFiltroSistema] = useState([]);
  const [filtroMarca, setFiltroMarca] = useState([]);
  const [showFiltri, setShowFiltri]   = useState(false);

  const opts = useMemo(()=>({
    sedi:    [...new Set(gruppi.map(g=>g.dislocazione).filter(Boolean))].sort(),
    sistemi: [...new Set(gruppi.map(g=>g.sistema).filter(Boolean))].sort(),
    marche:  [...new Set(gruppi.map(g=>g.marca).filter(Boolean))].sort(),
  }),[gruppi]);

  function toggle(setter,val){setter(prev=>prev.includes(val)?prev.filter(v=>v!==val):[...prev,val]);}
  function resetFiltri(){setFiltroSede([]);setFiltroSistema([]);setFiltroMarca([]);setSearch("");}
  const hasFiltri=filtroSede.length||filtroSistema.length||filtroMarca.length;

  // Escludi fuori_uso dalla lista principale
  const attivi = gruppi.filter(g => g.stato !== "fuori_uso");
  const fuoriUso = gruppi.filter(g => g.stato === "fuori_uso");

  const filtrati = useMemo(()=>attivi.filter(gt=>{
    const stato=calcolaStatoGT(gt);
    const mS=filtroStato==="tutti"
      ||(filtroStato==="critici"  &&["scaduto","critico","attenzione"].includes(stato))
      ||(filtroStato==="regolari" &&["buono","regolare"].includes(stato))
      ||(filtroStato==="fuori"    &&gt.stato==="fuori_servizio")
      ||(filtroStato==="magazzino"&&gt.stato==="magazzino");
    const mSede=!filtroSede.length||filtroSede.includes(gt.dislocazione);
    const mSist=!filtroSistema.length||filtroSistema.includes(gt.sistema);
    const mMarca=!filtroMarca.length||filtroMarca.some(m=>(gt.marca||"").includes(m));
    const q=search.toLowerCase().trim();
    const mQ=!q||(gt.nome||"").toLowerCase().includes(q)||(gt.mezzo||"").toLowerCase().includes(q)||String(gt.numero).includes(q)||(gt.marca||"").toLowerCase().includes(q)||(gt.componenti||[]).some(c=>(c.modello||"").toLowerCase().includes(q)||(c.matricola||"").toLowerCase().includes(q));
    return mS&&mSede&&mSist&&mMarca&&mQ;
  }),[attivi,search,filtroStato,filtroSede,filtroSistema,filtroMarca]);

  function countStato(s){
    return attivi.filter(g=>{
      const st=calcolaStatoGT(g);
      if(s==="critici")   return["scaduto","critico","attenzione"].includes(st);
      if(s==="regolari")  return["buono","regolare"].includes(st);
      if(s==="fuori")     return g.stato==="fuori_servizio";
      if(s==="magazzino") return g.stato==="magazzino";
      return true;
    }).length;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kit gruppi taglio ({filtrati.length})</h1>
          <div style={{fontSize:12,color:"var(--text3)",marginTop:4}}>SIMDB — VVF Siena</div>
        </div>
        <Link to="/gruppi-taglio/nuovo" className="btn btn-primary">+ Nuovo kit</Link>
      </div>

      {/* Ricerca */}
      <div style={{position:"relative",marginBottom:10}}>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--text3)",fontSize:16,pointerEvents:"none"}}>⌕</span>
        <input className="search-input" style={{paddingLeft:40,fontSize:14}}
          placeholder="Cerca per numero, nome, marca, matricola..."
          value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {/* Chip stato */}
      <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
        {[["tutti","Tutti"],["critici","Critici"],["regolari","In regola"],["fuori","F. Servizio"],["magazzino","Magazzino"]].map(([key,label])=>(
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
            {s} ({attivi.filter(g=>g.dislocazione===s).length})
          </button>
        ))}
        <button className={`btn btn-sm ${showFiltri?"btn-primary":"btn-secondary"}`}
          style={{marginLeft:"auto"}} onClick={()=>setShowFiltri(s=>!s)}>
          ⚙ Filtri
        </button>
      </div>

      {/* Filtri avanzati */}
      {showFiltri && (
        <div className="card" style={{marginBottom:12,padding:14}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14}}>
            <div>
              <div style={{fontSize:11,fontWeight:800,color:"var(--text3)",textTransform:"uppercase",marginBottom:6}}>Sistema</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {opts.sistemi.map(s=>{const b=sistemaBadge(s);return(
                  <button key={s} onClick={()=>toggle(setFiltroSistema,s)}
                    style={{padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",border:`2px solid ${filtroSistema.includes(s)?b.color:"var(--border2)"}`,background:filtroSistema.includes(s)?b.bg:"var(--bg2)",color:filtroSistema.includes(s)?b.color:"var(--text3)",fontFamily:"inherit"}}>
                    {b.label}
                  </button>
                );})}
              </div>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:800,color:"var(--text3)",textTransform:"uppercase",marginBottom:6}}>Marca</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {opts.marche.map(m=>(
                  <button key={m} className={`filter-chip ${filtroMarca.includes(m)?"active":""}`}
                    onClick={()=>toggle(setFiltroMarca,m)}>
                    {m} ({attivi.filter(g=>(g.marca||"").includes(m)).length})
                  </button>
                ))}
              </div>
            </div>
          </div>
          {hasFiltri&&<button className="btn btn-secondary" style={{marginTop:10,fontSize:12,color:"var(--red-text)"}} onClick={resetFiltri}>✕ Reset</button>}
        </div>
      )}

      <div style={{fontSize:13,color:"var(--text3)",marginBottom:12}}>
        {filtrati.length} kit trovati{filtrati.length!==attivi.length?` su ${attivi.length} attivi`:""}
      </div>

      {/* KANBAN GRID */}
      {!filtrati.length ? (
        <div style={{textAlign:"center",padding:40,color:"var(--text3)",fontSize:14}}>Nessun kit trovato.</div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
          {filtrati
            .sort((a,b)=>(giorniAllaScadenza(prossimaRevisioneGT(a))??9999)-(giorniAllaScadenza(prossimaRevisioneGT(b))??9999))
            .map(gt=>(
              <GTCard key={gt.id} gt={gt} onClick={()=>navigate(`/gruppi-taglio/${gt.id}`)}/>
            ))}
        </div>
      )}

      {/* FUORI USO — sezione separata e collassabile */}
      {fuoriUso.length > 0 && (
        <details style={{marginTop:24}}>
          <summary style={{
            cursor:"pointer", padding:"10px 16px",
            background:"#1a1a1a", border:"1px solid #333",
            borderRadius:"var(--radius-sm)", color:"#888",
            fontSize:13, fontWeight:700, listStyle:"none",
            display:"flex", alignItems:"center", gap:8,
          }}>
            <span>⛔</span>
            <span>Fuori uso — dismessi definitivamente ({fuoriUso.length})</span>
            <span style={{marginLeft:"auto",fontSize:11}}>clicca per espandere ▼</span>
          </summary>
          <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:8}}>
            {fuoriUso.map(gt=>(
              <div key={gt.id} onClick={()=>navigate(`/gruppi-taglio/${gt.id}`)}
                style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",background:"#1a1a1a",border:"1px solid #333",borderRadius:"var(--radius-sm)",cursor:"pointer"}}>
                <span style={{fontSize:16}}>⛔</span>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:"#888"}}>Kit {gt.numero} — {gt.nome}</div>
                  <div style={{fontSize:11,color:"#555"}}>{gt.mezzo} · {gt.marca}</div>
                </div>
                <span className="pill fuori_uso" style={{marginLeft:"auto"}}>Fuori uso</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}