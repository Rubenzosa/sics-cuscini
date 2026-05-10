/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { deleteGruppoTaglio, aggiungiRevisioneGT, getRevisioniGT, getManutenzioniGT, aggiungiManutenzioneGT } from "../firebase/service";
import { calcolaStatoGT, statoLabel, prossimaRevisioneGT, formatData, giorniAllaScadenza, sistemaBadge } from "../utils";
import Documenti from "../components/Documenti";

const TIPI_MANUTENZIONE = ["Cambio olio","Cambio candela","Cambio filtro","Controllo pressione","Pulizia","Altro"];

export default function GruppiTaglioDetail({ gruppi, reload }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const gt = gruppi.find(g => g.id === id);

  const [tab, setTab]             = useState("info");
  const [revisioni, setRevisioni] = useState([]);
  const [manutenzioni, setManutenzioni] = useState([]);
  const [modalRev, setModalRev]   = useState(false);
  const [modalMan, setModalMan]   = useState(false);
  const [saving, setSaving]       = useState(false);

  const [formRev, setFormRev] = useState({ dataRevisione: new Date().toISOString().split("T")[0], esito:"positivo", tecnico:"", ente:"", note:"" });
  const [formMan, setFormMan] = useState({ data: new Date().toISOString().split("T")[0], tipo:"Cambio olio", olio:"", candela:"", note:"", componenteInteressato:"" });

  useEffect(() => {
    if (!gt) return;
    getRevisioniGT(gt.id).then(setRevisioni);
    getManutenzioniGT(gt.id).then(setManutenzioni);
  }, [gt]);

  if (!gt) return (
    <div style={{ textAlign:"center", padding:60, color:"var(--text3)" }}>
      Gruppo non trovato. <button className="card-action" onClick={() => navigate("/gruppi-taglio")}>Torna alla lista</button>
    </div>
  );

  const stato   = calcolaStatoGT(gt);
  const proxRev = prossimaRevisioneGT(gt);
  const giorni  = giorniAllaScadenza(proxRev);
  const badge   = sistemaBadge(gt.sistema);

  async function handleDelete() {
    if (!window.confirm(`Eliminare il gruppo "${gt.nome}"?`)) return;
    await deleteGruppoTaglio(gt.id);
    await reload();
    navigate("/gruppi-taglio");
  }

  async function salvaRevisione() {
    if (!formRev.dataRevisione) { alert("Inserisci la data"); return; }
    setSaving(true);
    try { await aggiungiRevisioneGT(gt.id, formRev); await reload(); setModalRev(false); getRevisioniGT(gt.id).then(setRevisioni); }
    catch(e) { alert("Errore: "+e.message); }
    setSaving(false);
  }

  async function salvaManutenzione() {
    setSaving(true);
    try { await aggiungiManutenzioneGT(gt.id, formMan); setModalMan(false); getManutenzioniGT(gt.id).then(setManutenzioni); }
    catch(e) { alert("Errore: "+e.message); }
    setSaving(false);
  }

  // Raggruppa componenti
  const GRUPPI_COMP = [
    { label:"Centraline",      types:["CENTRALINA OLEODINAMICA","CENTRALINA AUSILIARIA"] },
    { label:"Cesoie",          types:["CESOIA","CESOIA ELETTRICA","CESOIA/DIVARICATORE COMBINATI"] },
    { label:"Divaricatori",    types:["DIVARICATORE","DIVARICATORE ELETTRICO"] },
    { label:"Pistoni",         types:["PISTONE","PISTONE ELETTRICO"] },
    { label:"Pompe e accessori",types:["POMPA MANUALE","MORSA DI SOSTEGNO","TUBI","TUBI 10 MT","BATTERIA"] },
  ];

  return (
    <div>
      <div className="page-header">
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <button className="btn btn-secondary" onClick={() => navigate("/gruppi-taglio")}>← Indietro</button>
          <h1 className="page-title">Kit {gt.numero} — {gt.nome}</h1>
          <span className={`pill ${stato}`}>{statoLabel(stato)}</span>
          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:10, background:badge.bg, color:badge.color }}>{badge.label}</span>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button className="btn btn-success" onClick={() => setModalRev(true)}>+ Revisione</button>
          <button className="btn btn-secondary" onClick={() => setModalMan(true)}>🔧 Manutenzione</button>
          <Link to={`/gruppi-taglio/${gt.id}/modifica`} className="btn btn-secondary">Modifica</Link>
          <button className="btn btn-danger" onClick={handleDelete}>Elimina</button>
        </div>
      </div>

      {stato==="scaduto" && <div className="alert-banner" style={{ marginBottom:16 }}>⚠ Revisione scaduta da {Math.abs(giorni)} giorni</div>}
      {stato==="critico" && <div className="alert-banner" style={{ background:"var(--amber-bg)", borderColor:"#fac775", color:"var(--amber-text)", marginBottom:16 }}>⏱ Revisione tra {giorni} giorni — pianifica</div>}

      {/* TABS */}
      <div style={{ display:"flex", gap:2, marginBottom:16, borderBottom:"2px solid var(--border)", overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
        {[["info","Dati"],["componenti",`Componenti (${(gt.componenti||[]).length})`],["revisioni",`Revisioni (${revisioni.length})`],["manutenzione",`Manutenzione (${manutenzioni.length})`]].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ background:"none", border:"none", borderBottom:tab===key?"2px solid var(--accent)":"2px solid transparent", color:tab===key?"var(--text)":"var(--text3)", fontSize:13, fontWeight:tab===key?700:500, padding:"10px 14px", cursor:"pointer", fontFamily:"inherit", marginBottom:-2, whiteSpace:"nowrap", flexShrink:0 }}>
            {label}
          </button>
        ))}
      </div>

      {/* TAB INFO */}
      {tab==="info" && (
        <div className="two-col">
          <div className="card">
            <div className="card-header"><span className="card-title">Dati gruppo</span></div>
            <table style={{ width:"100%" }}>
              <tbody>
                {[
                  ["Numero kit",        gt.numero],
                  ["Nome / Mezzo",      gt.nome],
                  ["Targa",             gt.mezzo],
                  ["Tipo mezzo",        gt.tipoMezzo||"—"],
                  ["Sistema",           badge.label],
                  ["Marca principale",  gt.marca||"—"],
                  ["Anno acquisto",     gt.annoAcquisto||"—"],
                  ["Dislocazione",      gt.dislocazione||"—"],
                  ["Prox. revisione",   proxRev&&proxRev!=="NO REVISIONE"?formatData(proxRev):proxRev||"N/D"],
                  ["Scade tra",         giorni!==null?(giorni<0?`SCADUTO (${Math.abs(giorni)}gg fa)`:`${giorni} giorni`):"N/D"],
                  ["Ult. rev. esito",   gt.ultimaRevisioneEsito||"—"],
                  ["Ult. rev. tecnico", gt.ultimaRevisioneTecnico||"—"],
                  ["Componenti totali", (gt.componenti||[]).length],
                ].map(([label,val]) => (
                  <tr key={label}>
                    <td style={{ color:"var(--text3)", fontSize:12, width:"45%", padding:"7px 0", borderBottom:"1px solid var(--border)" }}>{label}</td>
                    <td style={{ fontWeight:500, fontSize:13, padding:"7px 0", borderBottom:"1px solid var(--border)" }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Centraline con olio e candela in evidenza */}
          <div className="card">
            <div className="card-header"><span className="card-title">Manutenzione corrente</span></div>
            {(gt.componenti||[]).filter(c => c.olio || c.candela).length === 0 ? (
              <div style={{ color:"var(--text3)", fontSize:13, textAlign:"center", padding:20 }}>
                Sistema elettrico — nessuna candela/olio previsti
              </div>
            ) : (
              (gt.componenti||[]).filter(c => c.olio || c.candela).map((c,i) => (
                <div key={i} style={{ padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>{c.tipo}</div>
                  <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>{c.modello}</div>
                  <div style={{ display:"flex", gap:10, marginTop:6, flexWrap:"wrap" }}>
                    {c.olio && (
                      <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:10, background:"var(--green-bg)", color:"var(--green-text)" }}>
                        🛢 {c.olio}
                      </span>
                    )}
                    {c.candela && (
                      <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:10, background:"var(--amber-bg)", color:"var(--amber-text)" }}>
                        ⚡ {c.candela}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
            {/* Ultime manutenzioni */}
            {manutenzioni.slice(0,3).map(m => (
              <div key={m.id} style={{ padding:"8px 0", borderBottom:"1px solid var(--border)", fontSize:12 }}>
                <div style={{ fontWeight:600 }}>{m.tipo}</div>
                <div style={{ color:"var(--text3)", marginTop:2 }}>{formatData(m.data)}{m.note?` — ${m.note}`:""}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB COMPONENTI */}
      {tab==="componenti" && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Componenti ({(gt.componenti||[]).length})</span>
          </div>
          {GRUPPI_COMP.map(({ label, types }) => {
            const items = (gt.componenti||[]).filter(c => types.includes(c.tipo?.trim()));
            if (!items.length) return null;
            return (
              <div key={label} style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>
                  {label} ({items.length})
                </div>
                {items.map((c,i) => (
                  <div key={i} style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:"12px 14px", marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:13 }}>{c.tipo}</div>
                        <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>{c.modello||"—"}</div>
                        <div style={{ display:"flex", gap:8, marginTop:6, flexWrap:"wrap" }}>
                          {c.olio && <span style={{ fontSize:10, fontWeight:700, padding:"1px 8px", borderRadius:8, background:"var(--green-bg)", color:"var(--green-text)" }}>🛢 {c.olio}</span>}
                          {c.candela && <span style={{ fontSize:10, fontWeight:700, padding:"1px 8px", borderRadius:8, background:"var(--amber-bg)", color:"var(--amber-text)" }}>⚡ {c.candela}</span>}
                          {c.statoComp && c.statoComp!=="Ottimo" && (
                            <span style={{ fontSize:10, fontWeight:700, padding:"1px 8px", borderRadius:8, background:"var(--red-bg)", color:"var(--red-text)" }}>{c.statoComp}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign:"right", minWidth:140 }}>
                        {c.pressione && <div style={{ fontSize:11, fontWeight:700, color:"var(--text2)" }}>{c.pressione}</div>}
                        {c.matricola && <div className="mono" style={{ marginTop:2 }}>{c.matricola}</div>}
                        <div style={{ fontSize:10, color:"var(--text3)", marginTop:4 }}>
                          Anno: {c.annoComp||"—"}
                        </div>
                        {c.prossimaRevisione && c.prossimaRevisione!=="NO REVISIONE" && (
                          <div style={{ fontSize:10, color:"var(--text3)", marginTop:2 }}>
                            Rev: {formatData(c.prossimaRevisione)}
                          </div>
                        )}
                        {c.prossimaRevisione==="NO REVISIONE" && (
                          <div style={{ fontSize:10, color:"var(--green-text)", fontWeight:700, marginTop:2 }}>No revisione</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB REVISIONI */}
      {tab==="revisioni" && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Storico revisioni ({revisioni.length})</span>
            <button className="btn btn-success" style={{ fontSize:12, padding:"5px 14px" }} onClick={() => setModalRev(true)}>+ Aggiungi</button>
          </div>
          {!revisioni.length ? (
            <div style={{ color:"var(--text3)", fontSize:13, textAlign:"center", padding:30 }}>Nessuna revisione registrata</div>
          ) : (
            <div className="timeline" style={{ marginTop:8 }}>
              {revisioni.map(r => {
                const dotC = r.esito==="positivo"?"green":r.esito==="negativo"?"red":"amber";
                return (
                  <div key={r.id} className="timeline-item">
                    <div className={`timeline-dot ${dotC}`}/>
                    <div className="timeline-date">{formatData(r.dataRevisione)}</div>
                    <div className="timeline-title">{(r.esito||"—").charAt(0).toUpperCase()+(r.esito||"").slice(1)}</div>
                    <div className="timeline-sub">{r.tecnico||""}{r.ente?` · ${r.ente}`:""}{r.note?` — ${r.note}`:""}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB MANUTENZIONE */}
      {tab==="manutenzione" && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Storico manutenzione ({manutenzioni.length})</span>
            <button className="btn btn-secondary" style={{ fontSize:12, padding:"5px 14px" }} onClick={() => setModalMan(true)}>+ Aggiungi</button>
          </div>
          {!manutenzioni.length ? (
            <div style={{ color:"var(--text3)", fontSize:13, textAlign:"center", padding:30 }}>Nessuna manutenzione registrata</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Data</th><th>Tipo</th><th>Componente</th><th>Olio</th><th>Candela</th><th>Note</th></tr></thead>
                <tbody>
                  {manutenzioni.map(m => (
                    <tr key={m.id}>
                      <td style={{ whiteSpace:"nowrap" }}>{formatData(m.data)}</td>
                      <td style={{ fontWeight:600 }}>{m.tipo}</td>
                      <td>{m.componenteInteressato||"—"}</td>
                      <td>{m.olio||"—"}</td>
                      <td>{m.candela||"—"}</td>
                      <td style={{ fontSize:12, color:"var(--text3)" }}>{m.note||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB DOCUMENTI */}
      {tab==="documenti" && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Documenti allegati</span>
            <span style={{ fontSize:11, color:"var(--text3)" }}>Fatture, verbali, certificati</span>
          </div>
          <Documenti kitId={gt.id} kitNome={gt.nome} sistema="taglio"/>
        </div>
      )}

      {/* MODAL REVISIONE */}
      {modalRev && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:480 }}>
            <div className="modal-header">
              <span className="modal-title">Registra revisione — {gt.nome}</span>
              <button className="modal-close" onClick={() => setModalRev(false)}>✕</button>
            </div>
            <div className="form-grid">
              <div className="form-group"><label>Data revisione</label><input type="date" value={formRev.dataRevisione} onChange={e => setFormRev(p=>({...p,dataRevisione:e.target.value}))}/></div>
              <div className="form-group"><label>Esito</label>
                <select value={formRev.esito} onChange={e => setFormRev(p=>({...p,esito:e.target.value}))}>
                  <option value="positivo">✓ Positivo</option>
                  <option value="condizionato">~ Condizionato</option>
                  <option value="negativo">✗ Negativo</option>
                </select>
              </div>
              <div className="form-group"><label>Tecnico</label><input value={formRev.tecnico} onChange={e => setFormRev(p=>({...p,tecnico:e.target.value}))} placeholder="Nome cognome"/></div>
              <div className="form-group"><label>Ente</label><input value={formRev.ente} onChange={e => setFormRev(p=>({...p,ente:e.target.value}))} placeholder="es. VVF Siena"/></div>
              <div className="form-group" style={{ gridColumn:"1/-1" }}><label>Note</label><textarea value={formRev.note} onChange={e => setFormRev(p=>({...p,note:e.target.value}))} rows={3}/></div>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
              <button className="btn btn-secondary" onClick={() => setModalRev(false)}>Annulla</button>
              <button className="btn btn-success" onClick={salvaRevisione} disabled={saving}>{saving?"Salvataggio...":"Registra"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MANUTENZIONE */}
      {modalMan && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:500 }}>
            <div className="modal-header">
              <span className="modal-title">Registra manutenzione — {gt.nome}</span>
              <button className="modal-close" onClick={() => setModalMan(false)}>✕</button>
            </div>
            <div className="form-grid">
              <div className="form-group"><label>Data</label><input type="date" value={formMan.data} onChange={e => setFormMan(p=>({...p,data:e.target.value}))}/></div>
              <div className="form-group"><label>Tipo intervento</label>
                <select value={formMan.tipo} onChange={e => setFormMan(p=>({...p,tipo:e.target.value}))}>
                  {TIPI_MANUTENZIONE.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Componente interessato</label><input value={formMan.componenteInteressato} onChange={e => setFormMan(p=>({...p,componenteInteressato:e.target.value}))} placeholder="es. Centralina, Cesoia..."/></div>
              <div className="form-group"><label>Olio utilizzato</label><input value={formMan.olio} onChange={e => setFormMan(p=>({...p,olio:e.target.value}))} placeholder="es. HLP10, HV 15/22..."/></div>
              <div className="form-group"><label>Candela sostituita</label><input value={formMan.candela} onChange={e => setFormMan(p=>({...p,candela:e.target.value}))} placeholder="es. NGK BR2-LM..."/></div>
              <div className="form-group" style={{ gridColumn:"1/-1" }}><label>Note</label><textarea value={formMan.note} onChange={e => setFormMan(p=>({...p,note:e.target.value}))} rows={2}/></div>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
              <button className="btn btn-secondary" onClick={() => setModalMan(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={salvaManutenzione} disabled={saving}>{saving?"Salvataggio...":"Salva"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}