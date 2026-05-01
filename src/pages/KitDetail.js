import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  deleteKit, sostituisciComponente, getStoricoSostituzioni,
  aggiungiRevisione, getRevisioni, spostaKit, getStoricoSpostamenti
} from "../firebase/service";
import { calcolaStato, statoLabel, formatData, giorniAllaScadenza } from "../utils";
import { PROSSIMI_SERIALI, buildMatricolaLucca } from "../data/kitData";

const TIPI_COMP = ["CUSCINO 30X30","CUSCINO 35X35","CUSCINO 37X37","CUSCINO 38X38","CUSCINO 40X40","CUSCINO 45X45","CUSCINO 47X52","CUSCINO 48X58","CUSCINO 50X50","CUSCINO 55X55","CUSCINO 60X60","CUSCINO 65X65","CUSCINO 100X32","CENTRALINA","RIDUTTORE","TUBO","TUBO 2MT","TUBO 5MT","RUB. VALVOLARE"];
const DISLOCAZIONI = ["Sede Centrale","Magazzino","Montepulciano","Montalcino","Poggibonsi","Piancastagnaio"];
const DEST_LABEL = { fuori_uso:"Fuori uso", magazzino:"Magazzino", revisione:"In revisione" };
const DEST_COLOR = {
  fuori_uso: { bg:"var(--red-bg)", color:"var(--red-text)" },
  magazzino: { bg:"var(--blue-bg)", color:"var(--blue-text)" },
  revisione: { bg:"var(--amber-bg)", color:"var(--amber-text)" },
};
const ESITO_COLOR = { positivo:"green", condizionato:"amber", negativo:"red" };

function calcolaMatricolaAuto(tipo, bar, kits) {
  let codice;
  if (tipo.startsWith("CUSCINO")) codice = "CS";
  else if (tipo.startsWith("TUBO")) codice = "TB";
  else if (tipo === "CENTRALINA") codice = "CN";
  else if (tipo === "RIDUTTORE") codice = "RP";
  else if (tipo === "RUB. VALVOLARE") codice = "RV";
  else return "";
  const key = `${codice}_${bar}`;
  const base = PROSSIMI_SERIALI[key] || 1;
  let maxUsato = base - 1;
  (kits || []).forEach(kit => {
    (kit.componenti || []).forEach(c => {
      if (c.matricolaLucca) {
        const parts = c.matricolaLucca.split(" ");
        if (parts[0] === codice && parseInt(parts[1]) === bar) {
          const ser = parseInt(parts[3]);
          if (!isNaN(ser) && ser > maxUsato) maxUsato = ser;
        }
      }
    });
  });
  return buildMatricolaLucca(tipo, bar, maxUsato + 1);
}

export default function KitDetail({ kits, reload }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const kit = kits.find(k => k.id === id);

  const [tab, setTab] = useState("info");
  const [modalSost, setModalSost] = useState(null);
  const [modalRev, setModalRev] = useState(false);
  const [modalSpost, setModalSpost] = useState(false);
  const [saving, setSaving] = useState(false);

  const [storicoSost, setStoricoSost] = useState([]);
  const [revisioni, setRevisioni] = useState([]);
  const [storicoSpost, setStoricoSpost] = useState([]);

  const [nuovoComp, setNuovoComp] = useState({ tipo:"", modello:"", matricola:"", bar:8, matricolaLucca:"", dataInizioServizio: new Date().toISOString().split("T")[0], dataRevisione:"", note:"" });
  const [destComp, setDestComp] = useState("fuori_uso");
  const [noteUscita, setNoteUscita] = useState("");

  const [formRev, setFormRev] = useState({ dataRevisione: new Date().toISOString().split("T")[0], tecnico:"", ente:"", esito:"positivo", note:"" });
  const [formSpost, setFormSpost] = useState({ nuovoMezzo:"", nuovaTarga:"", nuovaDislocazione:"Sede Centrale", motivo:"" });

  useEffect(() => {
    if (!kit) return;
    getStoricoSostituzioni(kit.id).then(setStoricoSost);
    getRevisioni(kit.id).then(setRevisioni);
    getStoricoSpostamenti(kit.id).then(setStoricoSpost);
  }, [kit]);

  if (!kit) return (
    <div style={{ textAlign:"center", padding:60, color:"var(--text3)" }}>
      Kit non trovato. <button className="card-action" onClick={() => navigate("/kit")}>Torna alla lista</button>
    </div>
  );

  const stato = calcolaStato(kit);
  const giorni = giorniAllaScadenza(kit.dataRevisione);

  async function handleDelete() {
    if (window.confirm(`Eliminare definitivamente il Kit ${kit.numero} — ${kit.nome}?`)) {
      await deleteKit(kit.id); await reload(); navigate("/kit");
    }
  }

  function apriSostituisci(i) {
    const c = kit.componenti[i];
    setNuovoComp({ tipo:c.tipo, modello:"", matricola:"", bar:c.bar||kit.bar, matricolaLucca:calcolaMatricolaAuto(c.tipo, c.bar||kit.bar, kits), dataInizioServizio:new Date().toISOString().split("T")[0], dataRevisione:"", note:"" });
    setDestComp("fuori_uso"); setNoteUscita(""); setModalSost(i);
  }

  function handleNuovoCompChange(field, value) {
    setNuovoComp(p => {
      const u = { ...p, [field]: value };
      if (field === "tipo" || field === "bar") {
        u.matricolaLucca = calcolaMatricolaAuto(field === "tipo" ? value : p.tipo, field === "bar" ? Number(value) : Number(p.bar), kits);
      }
      return u;
    });
  }

  async function handleSostituisci() {
    if (!nuovoComp.matricola && !nuovoComp.matricolaLucca) { alert("Inserisci almeno la matricola."); return; }
    setSaving(true);
    try { await sostituisciComponente(kit.id, modalSost, nuovoComp, destComp, noteUscita); await reload(); setModalSost(null); getStoricoSostituzioni(kit.id).then(setStoricoSost); }
    catch (e) { alert("Errore: " + e.message); }
    setSaving(false);
  }

  async function handleRevisione() {
    if (!formRev.dataRevisione) { alert("Inserisci la data di revisione."); return; }
    setSaving(true);
    try { await aggiungiRevisione(kit.id, formRev); await reload(); setModalRev(false); getRevisioni(kit.id).then(setRevisioni); }
    catch (e) { alert("Errore: " + e.message); }
    setSaving(false);
  }

  async function handleSpostamento() {
    if (!formSpost.nuovaTarga) { alert("Inserisci la targa del nuovo mezzo."); return; }
    setSaving(true);
    try { await spostaKit(kit.id, formSpost.nuovoMezzo, formSpost.nuovaTarga, formSpost.nuovaDislocazione, formSpost.motivo); await reload(); setModalSpost(false); getStoricoSpostamenti(kit.id).then(setStoricoSpost); }
    catch (e) { alert("Errore: " + e.message); }
    setSaving(false);
  }

  const gruppi = [
    { titolo:"Cuscini", items: kit.componenti?.filter(c => c.tipo.startsWith("CUSCINO")) || [] },
    { titolo:"Centralina", items: kit.componenti?.filter(c => c.tipo === "CENTRALINA") || [] },
    { titolo:"Riduttore", items: kit.componenti?.filter(c => c.tipo === "RIDUTTORE") || [] },
    { titolo:"Tubi", items: kit.componenti?.filter(c => c.tipo.startsWith("TUBO")) || [] },
    { titolo:"Rubinetti valvolari", items: kit.componenti?.filter(c => c.tipo === "RUB. VALVOLARE") || [] },
  ];

  return (
    <div>
      <div className="page-header">
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <button className="btn btn-secondary" onClick={() => navigate("/kit")}>← Indietro</button>
          <h1 className="page-title">Kit {kit.numero} — {kit.nome}</h1>
          <span className={`pill ${stato}`}>{statoLabel(stato)}</span>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button className="btn btn-success" onClick={() => setModalRev(true)}>+ Revisione</button>
          <button className="btn btn-secondary" onClick={() => setModalSpost(true)}>⇄ Sposta kit</button>
          <Link to={`/kit/${kit.id}/modifica`} className="btn btn-secondary">Modifica</Link>
          <button className="btn btn-danger" onClick={handleDelete}>Elimina</button>
        </div>
      </div>

      {stato === "scaduto" && <div className="alert-banner" style={{ marginBottom:16 }}>⚠ Scaduto da {Math.abs(giorni)} giorni — revisione urgente</div>}
      {stato === "critico" && <div className="alert-banner" style={{ background:"var(--amber-bg)", borderColor:"#fac775", color:"var(--amber-text)", marginBottom:16 }}>⏱ Scade tra {giorni} giorni — pianifica revisione</div>}

      {/* TAB NAV */}
      <div style={{ display:"flex", gap:2, marginBottom:16, borderBottom:"2px solid var(--border)" }}>
        {[["info","Informazioni"],["componenti",`Componenti (${kit.componenti?.length||0})`],["revisioni",`Revisioni (${revisioni.length})`],["sostituzioni",`Sostituzioni (${storicoSost.length})`],["spostamenti",`Spostamenti (${storicoSpost.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ background:"none", border:"none", padding:"10px 16px", fontSize:13, fontWeight:tab===key?700:500, color:tab===key?"var(--text)":"var(--text3)", borderBottom:tab===key?"2px solid var(--accent)":"2px solid transparent", cursor:"pointer", fontFamily:"inherit", marginBottom:-2 }}>
            {label}
          </button>
        ))}
      </div>

      {/* TAB: INFO */}
      {tab === "info" && (
        <div className="two-col">
          <div className="card">
            <div className="card-header"><span className="card-title">Dati kit</span></div>
            <table style={{ width:"100%" }}>
              <tbody>
                {[["Numero kit",kit.numero],["Nome / Mezzo",kit.nome],["Targa",kit.mezzo],["Tipo mezzo",kit.tipoMezzo||"—"],["Pressione",`${kit.bar} bar`],["Anno acquisto",kit.annoAcquisto],["Data acquisto",formatData(kit.dataAcquisto)],["Dislocazione",kit.dislocazione||"—"],["Ultima revisione",formatData(kit.dataRevisione)],["Scade tra",giorni!==null?(giorni<0?`SCADUTO (${Math.abs(giorni)}gg fa)`:`${giorni} giorni`):"N/D"],["Tecnico ultimo collaudo",kit.ultimaRevisioneTecnico||"—"],["Esito ultimo collaudo",kit.ultimaRevisioneEsito||"—"],["Totale componenti",kit.componenti?.length||0]].map(([label,val]) => (
                  <tr key={label}>
                    <td style={{ color:"var(--text3)", fontSize:12, width:"42%", padding:"7px 0", borderBottom:"1px solid var(--border)" }}>{label}</td>
                    <td style={{ fontWeight:500, fontSize:13, padding:"7px 0", borderBottom:"1px solid var(--border)" }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TIMELINE revisioni nel tab info */}
          <div className="card">
            <div className="card-header"><span className="card-title">Timeline revisioni</span></div>
            {revisioni.length === 0 ? (
              <div style={{ color:"var(--text3)", fontSize:13, textAlign:"center", padding:20 }}>Nessuna revisione registrata</div>
            ) : (
              <div className="timeline">
                {revisioni.slice(0,5).map(r => (
                  <div key={r.id} className="timeline-item">
                    <div className={`timeline-dot ${ESITO_COLOR[r.esito]||"gray"}`}/>
                    <div className="timeline-date">{formatData(r.dataRevisione)}</div>
                    <div className="timeline-title">{r.esito ? r.esito.charAt(0).toUpperCase()+r.esito.slice(1) : "—"}</div>
                    <div className="timeline-sub">{r.tecnico||""}{r.ente?` · ${r.ente}`:""}{r.note?` — ${r.note}`:""}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: COMPONENTI */}
      {tab === "componenti" && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Componenti ({kit.componenti?.length||0})</span>
            <span style={{ fontSize:11, color:"var(--text3)" }}>Matricola Lucca in blu · ⇄ per sostituire</span>
          </div>
          {gruppi.map(({ titolo, items }) => {
            if (!items.length) return null;
            return (
              <div key={titolo} style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>{titolo} ({items.length})</div>
                <div className="comp-list">
                  {items.map(c => {
                    const ri = (kit.componenti||[]).indexOf(c);
                    return (
                      <div key={ri} className="comp-item" style={{ flexDirection:"column", alignItems:"stretch", gap:8 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                              <span className="comp-tipo">{c.tipo}</span>
                              {c.note && <span style={{ fontSize:10, background:"var(--red-bg)", color:"var(--red-text)", padding:"2px 7px", borderRadius:10, fontWeight:700 }}>{c.note}</span>}
                            </div>
                            <div className="comp-modello">{c.modello||"—"}</div>
                            {c.dataInizioServizio && <div style={{ fontSize:10, color:"var(--text3)", marginTop:2 }}>In servizio: {formatData(c.dataInizioServizio)}</div>}
                          </div>
                          <div style={{ textAlign:"right", minWidth:150 }}>
                            {c.matricolaLucca && <div style={{ fontFamily:"monospace", fontWeight:800, fontSize:12, color:"var(--blue-text)", background:"var(--blue-bg)", padding:"3px 10px", borderRadius:6, display:"inline-block", marginBottom:4 }}>{c.matricolaLucca}</div>}
                            <div className="mono">{c.matricola||"—"}</div>
                            <div style={{ fontSize:10, color:"var(--text3)" }}>{c.bar} bar</div>
                          </div>
                        </div>
                        <div style={{ display:"flex", justifyContent:"flex-end" }}>
                          <button className="btn" style={{ fontSize:11, padding:"4px 12px", color:"var(--amber-text)", borderColor:"#fac775", background:"var(--amber-bg)" }} onClick={() => apriSostituisci(ri)}>
                            ⇄ Sostituisci
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB: REVISIONI */}
      {tab === "revisioni" && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Storico revisioni ({revisioni.length})</span>
            <button className="btn btn-success" style={{ fontSize:12, padding:"5px 14px" }} onClick={() => setModalRev(true)}>+ Aggiungi revisione</button>
          </div>
          {revisioni.length === 0 ? (
            <div style={{ color:"var(--text3)", fontSize:13, textAlign:"center", padding:30 }}>Nessuna revisione registrata</div>
          ) : (
            <div className="timeline" style={{ marginTop:8 }}>
              {revisioni.map(r => (
                <div key={r.id} className="timeline-item">
                  <div className={`timeline-dot ${ESITO_COLOR[r.esito]||"gray"}`}/>
                  <div className="timeline-date">{formatData(r.dataRevisione)}</div>
                  <div className="timeline-title">{r.esito?.charAt(0).toUpperCase()+r.esito?.slice(1)||"—"}</div>
                  <div className="timeline-sub">
                    {r.tecnico && <span>{r.tecnico}</span>}
                    {r.ente && <span> · {r.ente}</span>}
                    {r.note && <span> — {r.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: SOSTITUZIONI */}
      {tab === "sostituzioni" && (
        <div className="card">
          <div className="card-header"><span className="card-title">Storico sostituzioni componenti ({storicoSost.length})</span></div>
          {storicoSost.length === 0 ? (
            <div style={{ color:"var(--text3)", fontSize:13, textAlign:"center", padding:30 }}>Nessuna sostituzione registrata</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Data</th><th>Componente uscente</th><th>Matr. Lucca</th><th>Destinazione</th><th>Componente entrante</th><th>Matr. Lucca</th><th>Note</th></tr></thead>
                <tbody>
                  {storicoSost.map(s => (
                    <tr key={s.id}>
                      <td style={{ whiteSpace:"nowrap" }}>{formatData(s.dataOperazione)}</td>
                      <td><div style={{ fontWeight:600, fontSize:12 }}>{s.componenteUscente?.tipo}</div><div style={{ fontSize:11, color:"var(--text3)" }}>{s.componenteUscente?.modello}</div><div className="mono">{s.componenteUscente?.matricola}</div></td>
                      <td><span style={{ fontFamily:"monospace", fontSize:12, background:"var(--gray-bg)", color:"var(--gray-text)", padding:"2px 8px", borderRadius:4 }}>{s.componenteUscente?.matricolaLucca||"—"}</span></td>
                      <td>{s.componenteUscente?.destinazione && <span style={{ fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:10, ...DEST_COLOR[s.componenteUscente.destinazione] }}>{DEST_LABEL[s.componenteUscente.destinazione]}</span>}</td>
                      <td><div style={{ fontWeight:600, fontSize:12 }}>{s.componenteEntrante?.tipo}</div><div style={{ fontSize:11, color:"var(--text3)" }}>{s.componenteEntrante?.modello}</div><div className="mono">{s.componenteEntrante?.matricola}</div></td>
                      <td><span style={{ fontFamily:"monospace", fontWeight:800, fontSize:12, color:"var(--blue-text)", background:"var(--blue-bg)", padding:"2px 8px", borderRadius:4 }}>{s.componenteEntrante?.matricolaLucca||"—"}</span></td>
                      <td style={{ fontSize:11, color:"var(--text3)" }}>{s.componenteUscente?.noteUscita||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: SPOSTAMENTI */}
      {tab === "spostamenti" && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Storico spostamenti ({storicoSpost.length})</span>
            <button className="btn btn-secondary" style={{ fontSize:12, padding:"5px 14px" }} onClick={() => setModalSpost(true)}>⇄ Sposta kit</button>
          </div>
          {storicoSpost.length === 0 ? (
            <div style={{ color:"var(--text3)", fontSize:13, textAlign:"center", padding:30 }}>Nessuno spostamento registrato</div>
          ) : (
            <div className="timeline" style={{ marginTop:8 }}>
              {storicoSpost.map(s => (
                <div key={s.id} className="timeline-item">
                  <div className="timeline-dot gray"/>
                  <div className="timeline-date">{formatData(s.data)}</div>
                  <div className="timeline-title">{s.dislocazionePrecedente} → {s.nuovaDislocazione}</div>
                  <div className="timeline-sub">{s.mezzoPrecedente} → {s.nuovaTarga}{s.motivo?` — ${s.motivo}`:""}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: SOSTITUZIONE COMPONENTE */}
      {modalSost !== null && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Sostituisci componente</span>
              <button className="modal-close" onClick={() => setModalSost(null)}>✕</button>
            </div>
            <div className="section-amber">
              <div className="section-label amber">Componente uscente</div>
              <div style={{ fontWeight:700 }}>{kit.componenti[modalSost]?.tipo}</div>
              <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>{kit.componenti[modalSost]?.modello||"—"}</div>
              <div style={{ fontFamily:"monospace", fontSize:12, color:"var(--amber-text)", marginTop:4 }}>Matr. Lucca: {kit.componenti[modalSost]?.matricolaLucca||"—"}</div>
              <div className="mono" style={{ marginTop:2 }}>Matr. costruttore: {kit.componenti[modalSost]?.matricola||"—"}</div>
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--amber-text)", marginBottom:8 }}>DESTINAZIONE</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {Object.entries(DEST_LABEL).map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setDestComp(val)} style={{ padding:"7px 16px", borderRadius:20, fontSize:12, fontWeight:700, cursor:"pointer", border:"2px solid", borderColor:destComp===val?DEST_COLOR[val].color:"var(--border2)", background:destComp===val?DEST_COLOR[val].bg:"var(--bg2)", color:destComp===val?DEST_COLOR[val].color:"var(--text3)" }}>{label}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--amber-text)", marginBottom:4 }}>NOTE USCITA</div>
                <input value={noteUscita} onChange={e => setNoteUscita(e.target.value)} placeholder="es. Lacerazione, pressione insufficiente..." style={{ width:"100%", padding:"8px 12px", border:"1px solid #fac775", borderRadius:8, fontSize:13, fontFamily:"inherit", background:"var(--bg2)", color:"var(--text)" }}/>
              </div>
            </div>
            <div className="section-green">
              <div className="section-label green">Nuovo componente entrante</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div className="form-group"><label>Tipo</label><select value={nuovoComp.tipo} onChange={e => handleNuovoCompChange("tipo", e.target.value)}>{TIPI_COMP.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div className="form-group"><label>Bar</label><select value={nuovoComp.bar} onChange={e => handleNuovoCompChange("bar", Number(e.target.value))}><option value={8}>8 bar</option><option value={10}>10 bar</option><option value={12}>12 bar</option></select></div>
                <div className="form-group"><label>Modello</label><input value={nuovoComp.modello} onChange={e => handleNuovoCompChange("modello", e.target.value)} placeholder="es. VETTER ARAMIDE V20"/></div>
                <div className="form-group"><label>Matricola costruttore</label><input value={nuovoComp.matricola} onChange={e => handleNuovoCompChange("matricola", e.target.value)} placeholder="es. 11210197"/></div>
                <div className="form-group"><label style={{ color:"var(--blue-text)" }}>Matricola Lucca (auto)</label><input value={nuovoComp.matricolaLucca} onChange={e => handleNuovoCompChange("matricolaLucca", e.target.value)} style={{ fontFamily:"monospace", fontWeight:800, color:"var(--blue-text)", borderColor:"#b5d4f4", background:"var(--blue-bg)" }}/></div>
                <div className="form-group"><label>Data inizio servizio</label><input type="date" value={nuovoComp.dataInizioServizio} onChange={e => handleNuovoCompChange("dataInizioServizio", e.target.value)}/></div>
                <div className="form-group"><label>Data revisione componente</label><input type="date" value={nuovoComp.dataRevisione} onChange={e => handleNuovoCompChange("dataRevisione", e.target.value)}/></div>
                <div className="form-group" style={{ gridColumn:"1/-1" }}><label>Note</label><input value={nuovoComp.note} onChange={e => handleNuovoCompChange("note", e.target.value)} placeholder="Note aggiuntive..."/></div>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
              <button className="btn btn-secondary" onClick={() => setModalSost(null)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleSostituisci} disabled={saving}>{saving?"Salvataggio...":"Conferma sostituzione"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REVISIONE */}
      {modalRev && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Registra revisione — Kit {kit.numero}</span>
              <button className="modal-close" onClick={() => setModalRev(false)}>✕</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div className="form-group"><label>Data revisione</label><input type="date" value={formRev.dataRevisione} onChange={e => setFormRev(p => ({...p, dataRevisione:e.target.value}))}/></div>
              <div className="form-group">
                <label>Esito</label>
                <select value={formRev.esito} onChange={e => setFormRev(p => ({...p, esito:e.target.value}))}>
                  <option value="positivo">✓ Positivo</option>
                  <option value="condizionato">~ Condizionato</option>
                  <option value="negativo">✗ Negativo</option>
                </select>
              </div>
              <div className="form-group"><label>Tecnico responsabile</label><input value={formRev.tecnico} onChange={e => setFormRev(p => ({...p, tecnico:e.target.value}))} placeholder="Nome cognome"/></div>
              <div className="form-group"><label>Ente certificatore</label><input value={formRev.ente} onChange={e => setFormRev(p => ({...p, ente:e.target.value}))} placeholder="es. VVF, ente esterno..."/></div>
              <div className="form-group" style={{ gridColumn:"1/-1" }}><label>Note / osservazioni</label><textarea value={formRev.note} onChange={e => setFormRev(p => ({...p, note:e.target.value}))} placeholder="Annotazioni, prescrizioni, condizioni..." rows={3} style={{ resize:"vertical" }}/></div>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
              <button className="btn btn-secondary" onClick={() => setModalRev(false)}>Annulla</button>
              <button className="btn btn-success" onClick={handleRevisione} disabled={saving}>{saving?"Salvataggio...":"Registra revisione"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SPOSTAMENTO KIT */}
      {modalSpost && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Sposta Kit {kit.numero} — {kit.nome}</span>
              <button className="modal-close" onClick={() => setModalSpost(false)}>✕</button>
            </div>
            <div className="section-blue" style={{ marginBottom:16 }}>
              <div className="section-label blue">Posizione attuale</div>
              <div style={{ fontWeight:700 }}>{kit.mezzo}</div>
              <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>Dislocazione: {kit.dislocazione||"—"}</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div className="form-group"><label>Nuovo mezzo (tipo)</label><input value={formSpost.nuovoMezzo} onChange={e => setFormSpost(p => ({...p, nuovoMezzo:e.target.value}))} placeholder="es. APS 120"/></div>
              <div className="form-group"><label>Nuova targa</label><input value={formSpost.nuovaTarga} onChange={e => setFormSpost(p => ({...p, nuovaTarga:e.target.value}))} placeholder="es. VF 29453"/></div>
              <div className="form-group"><label>Nuova dislocazione</label><select value={formSpost.nuovaDislocazione} onChange={e => setFormSpost(p => ({...p, nuovaDislocazione:e.target.value}))}>{DISLOCAZIONI.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              <div className="form-group"><label>Motivo spostamento</label><input value={formSpost.motivo} onChange={e => setFormSpost(p => ({...p, motivo:e.target.value}))} placeholder="es. Mezzo in manutenzione"/></div>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
              <button className="btn btn-secondary" onClick={() => setModalSpost(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleSpostamento} disabled={saving}>{saving?"Salvataggio...":"Conferma spostamento"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}