import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { calcolaStato, calcolaStatoGT, statoLabel, formatData, giorniAllaScadenza, prossimaRevisioneGT } from "../utils";

export default function Scadenze({ kits, gruppiTaglio, sistemaAttivo }) {
  const navigate = useNavigate();
  const [vista, setVista] = useState("unificata"); // unificata | cuscini | taglio
  const annoOggi = new Date().getFullYear();

  // ── Unifica tutti gli elementi
  const tuttiItems = [
    ...kits.filter(k => k.stato !== "fuori_servizio").map(k => ({
      id: k.id, tipo:"cuscini", nome:`Kit ${k.numero} — ${k.nome}`,
      mezzo: k.mezzo, sub:`${k.bar} bar`, dislocazione: k.dislocazione,
      data: k.dataRevisione, stato: calcolaStato(k),
      giorni: giorniAllaScadenza(k.dataRevisione),
      extra: `${k.bar} bar`,
    })),
    ...gruppiTaglio.filter(g => g.stato !== "fuori_servizio").map(g => ({
      id: g.id, tipo:"taglio", nome:`${g.nome}`,
      mezzo: g.mezzo, sub: g.sistema, dislocazione: g.dislocazione,
      data: prossimaRevisioneGT(g), stato: calcolaStatoGT(g),
      giorni: giorniAllaScadenza(prossimaRevisioneGT(g)),
      extra: g.marca,
    })),
  ].sort((a,b) => (a.giorni??9999) - (b.giorni??9999));

  const itemsFiltrati = vista === "cuscini" ? tuttiItems.filter(i => i.tipo==="cuscini")
    : vista === "taglio" ? tuttiItems.filter(i => i.tipo==="taglio")
    : tuttiItems;

  function gruppo(label, items, colore) {
    if (!items.length) return null;
    return (
      <div style={{ marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <div style={{ width:12, height:12, borderRadius:"50%", background:colore, flexShrink:0 }}/>
          <span style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{label}</span>
          <span style={{ fontSize:12, color:"var(--text3)" }}>— {items.length} {items.length===1?"elemento":"elementi"}</span>
        </div>
        <div className="card" style={{ borderLeft:`4px solid ${colore}`, borderRadius:`0 var(--radius) var(--radius) 0` }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sistema</th>
                  <th>Nome</th>
                  <th>Mezzo</th>
                  <th>Info</th>
                  <th>Dislocazione</th>
                  <th>Data revisione</th>
                  <th>Giorni</th>
                  <th>Stato</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id+item.tipo} style={{ cursor:"pointer" }}
                    onClick={() => navigate(item.tipo==="taglio"?`/gruppi-taglio/${item.id}`:`/kit/${item.id}`)}>
                    <td>
                      <span style={{
                        fontSize:10, fontWeight:800, padding:"2px 7px", borderRadius:8,
                        background: item.tipo==="taglio"?"#7a3500":"#1a2b3c", color:"#fff",
                      }}>
                        {item.tipo==="taglio"?"TAGLIO":"CUSCINI"}
                      </span>
                    </td>
                    <td style={{ fontWeight:600 }}>{item.nome}</td>
                    <td className="mono">{item.mezzo}</td>
                    <td style={{ fontSize:12, color:"var(--text2)" }}>{item.extra}</td>
                    <td>{item.dislocazione||"—"}</td>
                    <td>{item.data&&item.data!=="NO REVISIONE"?formatData(item.data):item.data||"N/D"}</td>
                    <td>
                      {item.giorni===null?"N/D":
                        item.giorni<0?<span style={{color:"var(--red)",fontWeight:700}}>-{Math.abs(item.giorni)}gg</span>:
                        <span style={{color:colore,fontWeight:600}}>{item.giorni}gg</span>}
                    </td>
                    <td><span className={`pill ${item.stato}`}>{statoLabel(item.stato)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const scaduti    = itemsFiltrati.filter(i => i.stato==="scaduto");
  const critici    = itemsFiltrati.filter(i => i.stato==="critico");
  const attenzione = itemsFiltrati.filter(i => i.stato==="attenzione");
  const buoni      = itemsFiltrati.filter(i => i.stato==="buono");
  const regolari   = itemsFiltrati.filter(i => i.stato==="regolare");

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Scadenze revisioni</h1>
        <div style={{ display:"flex", gap:6 }}>
          {[["unificata","Tutto"],["cuscini","Cuscini"],["taglio","Gruppi taglio"]].map(([key,label]) => (
            <button key={key} className={`filter-chip ${vista===key?"active":""}`}
              onClick={() => setVista(key)}
              style={ key==="taglio" && vista===key ? { background:"#7a3500", borderColor:"#7a3500" } : {} }>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ marginBottom:24 }}>
        <div className="stat-card" style={{ borderTop:"3px solid var(--red)" }}>
          <div className="stat-label">Scaduti</div>
          <div className="stat-num red">{scaduti.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop:"3px solid var(--red)" }}>
          <div className="stat-label">Entro 3 mesi</div>
          <div className="stat-num red">{critici.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop:"3px solid var(--amber)" }}>
          <div className="stat-label">Nel {annoOggi}</div>
          <div className="stat-num amber">{attenzione.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop:"3px solid var(--green)" }}>
          <div className="stat-label">Nel {annoOggi+1}</div>
          <div className="stat-num green">{buoni.length}</div>
        </div>
      </div>

      {gruppo("Scaduti — intervento urgente", scaduti, "#e24b4a")}
      {gruppo("Entro 3 mesi — pianifica subito", critici, "#e24b4a")}
      {gruppo(`Scade nel ${annoOggi}`, attenzione, "#ba7517")}
      {gruppo(`Scade nel ${annoOggi+1}`, buoni, "#639922")}
      {gruppo("Regolari", regolari, "#639922")}
    </div>
  );
}