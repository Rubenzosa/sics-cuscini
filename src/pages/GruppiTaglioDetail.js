/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { deleteGruppoTaglio, aggiungiRevisioneGT, getRevisioniGT, getManutenzioniGT, aggiungiManutenzioneGT, cambiaStatoComponenteGT, getStatiComponentiGT } from "../firebase/service";
import { calcolaStatoGT, statoLabel, prossimaRevisioneGT, formatData, giorniAllaScadenza, sistemaBadge, oggiIso, componenteAttivoGT, componentiNonOperativiGT, riepilogoFermiComponente } from "../utils";
import Documenti from "../components/Documenti";

const TIPI_MANUTENZIONE = ["Cambio olio","Cambio candela","Cambio filtro","Controllo pressione","Pulizia","Altro"];

// Motivi ricorrenti per cui un componente finisce in officina o fuori servizio.
// Sono suggerimenti: il campo resta a testo libero.
const MOTIVI_STATO = [
  "Perdita olio", "Perdita di pressione", "Grippato", "Non avvia",
  "Rottura lame", "Rottura punte", "Perdita raccordo", "Tubo danneggiato",
  "Batteria esausta", "Cavo danneggiato", "Danno da urto", "Revisione periodica",
];

const ETICHETTA_STATO = {
  in_revisione: "In revisione",
  fuori_servizio: "Fuori servizio",
  attivo: "Rientro in servizio",
};

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
  const [statiComp, setStatiComp] = useState([]);
  const [modalStato, setModalStato] = useState(null); // { index, stato }
  const [formStato, setFormStato]   = useState({ motivo:"", note:"", data: oggiIso(), officina:"", revisioneEseguita:false, intervalloAnni:"" });

  const [formRev, setFormRev] = useState({ dataRevisione: oggiIso(), esito:"positivo", tecnico:"", ente:"", note:"", intervalloAnni: gt?.intervalloRevisioneAnni ?? "" });
  const [formMan, setFormMan] = useState({ data: oggiIso(), tipo:"Cambio olio", olio:"", candela:"", note:"", componenteInteressato:"" });

  useEffect(() => {
    if (!gt) return;
    getRevisioniGT(gt.id).then(setRevisioni);
    getManutenzioniGT(gt.id).then(setManutenzioni);
    getStatiComponentiGT(gt.id).then(setStatiComp);
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
  const fermi   = componentiNonOperativiGT(gt);

  async function handleDelete() {
    if (!window.confirm(`Eliminare il gruppo "${gt.nome}"?`)) return;
    await deleteGruppoTaglio(gt.id);
    await reload();
    navigate("/gruppi-taglio");
  }

  async function salvaRevisione() {
    if (!formRev.dataRevisione) { alert("Inserisci la data"); return; }
    if (!(Number(formRev.intervalloAnni) > 0)) { alert("Inserisci ogni quanti anni serve la revisione."); return; }
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

  function apriStato(index, stato) {
    const c = (gt.componenti || [])[index] || {};
    setFormStato({
      motivo: "", note: "", data: oggiIso(),
      officina: stato === "in_revisione" ? (c.officina || "") : "",
      revisioneEseguita: false,
      intervalloAnni: gt.intervalloRevisioneAnni ?? "",
    });
    setModalStato({ index, stato });
  }

  async function salvaStatoComponente() {
    const { index, stato } = modalStato;
    if (!formStato.data) { alert("Inserisci la data"); return; }
    if (stato !== "attivo" && !formStato.motivo.trim()) { alert("Indica il motivo (es. perdita olio)"); return; }
    if (stato === "attivo" && formStato.revisioneEseguita && !(Number(formStato.intervalloAnni) > 0)) {
      alert("Indica ogni quanti anni va revisionato questo componente.");
      return;
    }
    setSaving(true);
    try {
      await cambiaStatoComponenteGT(gt.id, index, stato, formStato);
      await reload();
      setModalStato(null);
      getStatiComponentiGT(gt.id).then(setStatiComp);
    } catch(e) { alert("Errore: "+e.message); }
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
          <button className="btn btn-secondary" onClick={() => navigate("/calendario")}>Calendario</button>
          <button className="btn btn-success" onClick={() => setModalRev(true)}>+ Revisione</button>
          <button className="btn btn-secondary" onClick={() => setModalMan(true)}>Manutenzione</button>
          <Link to={`/gruppi-taglio/${gt.id}/modifica`} className="btn btn-secondary">Modifica</Link>
          <button className="btn btn-danger" onClick={handleDelete}>Elimina</button>
        </div>
      </div>

      {stato==="fuori_uso" && (
        <div style={{ background:"#1a1a1a", border:"2px solid #e24b4a", borderRadius:"var(--radius-sm)", padding:"14px 18px", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <span style={{ width:4, alignSelf:"stretch", borderRadius:4, background:"#e24b4a", flexShrink:0 }}/>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:"#e24b4a" }}>FUORI USO — dismesso definitivamente</div>
              <div style={{ fontSize:12, color:"#777", marginTop:2 }}>Allegare il documento di notifica qui sotto.</div>
            </div>
          </div>
          <div style={{ background:"#111", borderRadius:"var(--radius-sm)", padding:12 }}>
            <Documenti kitId={gt.id} kitNome={gt.nome} sistema="taglio"/>
          </div>
        </div>
      )}
      {fermi.totale > 0 && (
        <div className="alert-banner" style={{ background:"var(--amber-bg)", borderColor:"#fac775", color:"var(--amber-text)", marginBottom:16 }}>
          Kit incompleto — {fermi.inRevisione > 0 ? fermi.inRevisione + " in revisione" : ""}
          {fermi.inRevisione > 0 && fermi.fuoriServizio > 0 ? " · " : ""}
          {fermi.fuoriServizio > 0 ? fermi.fuoriServizio + " fuori servizio" : ""}
          {" · vedi tab Componenti"}
        </div>
      )}
      {stato==="scaduto" && <div className="alert-banner" style={{ marginBottom:16 }}>Revisione scaduta da {Math.abs(giorni)} giorni</div>}
      {stato==="critico" && <div className="alert-banner" style={{ background:"var(--amber-bg)", borderColor:"#fac775", color:"var(--amber-text)", marginBottom:16 }}>Revisione tra {giorni} giorni — pianifica</div>}

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
                  ["Revisione ogni",    gt.intervalloRevisioneAnni?`${gt.intervalloRevisioneAnni} anni`:"—"],
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
                        OLIO · {c.olio}
                      </span>
                    )}
                    {c.candela && (
                      <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:10, background:"var(--amber-bg)", color:"var(--amber-text)" }}>
                        CANDELA · {c.candela}
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
            <span style={{ fontSize:11, color:"var(--text3)" }}>Un componente fermo non fa scadere il kit</span>
          </div>
          {GRUPPI_COMP.map(({ label, types }) => {
            const items = (gt.componenti||[]).filter(c => types.includes(c.tipo?.trim()));
            if (!items.length) return null;
            return (
              <div key={label} style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>
                  {label} ({items.length})
                </div>
                {items.map(c => {
                  const ri      = (gt.componenti||[]).indexOf(c);
                  const attivo  = componenteAttivoGT(c);
                  const inRev   = c.statoOperativo === "in_revisione";
                  const storia  = riepilogoFermiComponente(statiComp, c, ri);
                  const gg      = attivo ? giorniAllaScadenza(c.prossimaRevisione) : null;
                  const ggClass = gg === null ? "" : gg < 0 ? "bad" : gg <= 90 ? "warn" : "ok";
                  // La barra laterale segue lo stato operativo; se il componente e' attivo segue la scadenza.
                  const classe  = !attivo ? (inRev ? "gtc rev" : "gtc ko")
                    : gg === null ? "gtc" : gg < 0 ? "gtc scad" : gg <= 90 ? "gtc warn" : "gtc";
                  return (
                    <div key={ri} className={classe}>
                      <div className="gtc-top">
                        <div style={{ flex:1, minWidth:0 }}>
                          <div className={attivo ? "gtc-tipo" : "gtc-tipo spenta"}>{c.tipo}</div>
                          <div className="gtc-mod">{c.modello||"—"}</div>
                          {inRev && <span className="gtc-stato rev"><span className="gtc-dot puls"/>In revisione</span>}
                          {c.statoOperativo==="fuori_servizio" && <span className="gtc-stato ko"><span className="gtc-dot"/>Fuori servizio</span>}
                        </div>
                        <div className="gtc-targa">
                          <span className="gtc-targa-lbl">Matricola</span>
                          <span className="gtc-targa-val">{c.matricola || "n.d."}</span>
                          <span className="gtc-targa-sub">
                            {c.annoComp || "—"}{c.pressione ? " · " + c.pressione.toLowerCase() : ""}
                          </span>
                        </div>
                      </div>

                      {!attivo && (
                        <div className={inRev ? "gtc-fermo rev" : "gtc-fermo ko"}>
                          <span className="gtc-fermo-k">{inRev ? "In officina dal" : "Fermo dal"} {formatData(c.dataStato)}</span>
                          <b>{c.motivoStato || "motivo non indicato"}</b>
                          {c.officina ? " — " + c.officina : ""}
                          {c.noteStato ? " · " + c.noteStato : ""}
                        </div>
                      )}

                      <div className="gtc-specs">
                        {c.olio && <span className="gtc-spec"><span className="gtc-spec-k">Olio</span><span className="gtc-spec-v">{c.olio}</span></span>}
                        {c.candela && <span className="gtc-spec"><span className="gtc-spec-k">Candela</span><span className="gtc-spec-v">{c.candela}</span></span>}
                        {c.statoComp && c.statoComp!=="Ottimo" && (
                          <span className="gtc-spec bad"><span className="gtc-spec-k">Stato</span><span className="gtc-spec-v">{c.statoComp}</span></span>
                        )}
                        {storia.fermi > 0 && (
                          <span className="gtc-spec warn">
                            <span className="gtc-spec-k">Fermi</span>
                            <span className="gtc-spec-v">
                              {storia.fermi === 1 ? "1 fermo" : storia.fermi + " fermi"}
                              {storia.anni >= 1 ? " in " + storia.anni + (storia.anni === 1 ? " anno" : " anni") : ""}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="gtc-foot">
                        <div className="gtc-scad">
                          {!attivo ? (
                            <span className="gtc-scad-off">Escluso dalla scadenza del kit</span>
                          ) : c.prossimaRevisione === "NO REVISIONE" ? (
                            <span className="gtc-scad-off">Nessuna revisione prevista</span>
                          ) : c.prossimaRevisione ? (
                            <>
                              <span className="gtc-scad-k">Revisione</span>
                              <span className="gtc-scad-v">{formatData(c.prossimaRevisione)}</span>
                              {gg !== null && (
                                <span className={"gtc-scad-gg " + ggClass}>
                                  {gg < 0 ? "scaduta da " + Math.abs(gg) + " gg" : "fra " + gg + " gg"}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="gtc-scad-off">Scadenza non registrata</span>
                          )}
                        </div>
                        <div className="gtc-acts">
                          {attivo ? (
                            <>
                              <button className="gtc-btn rev" onClick={() => apriStato(ri, "in_revisione")}>In revisione</button>
                              <button className="gtc-btn ko" onClick={() => apriStato(ri, "fuori_servizio")}>Fuori servizio</button>
                            </>
                          ) : (
                            <button className="gtc-btn go" onClick={() => apriStato(ri, "attivo")}>Rimetti in servizio</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {statiComp.length > 0 && (
            <div style={{ marginTop:24, borderTop:"1px solid var(--border)", paddingTop:14 }}>
              <div style={{ fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>
                Storico guasti e fermi ({statiComp.length})
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Data</th><th>Componente</th><th>Stato</th><th>Motivo</th><th>Officina</th><th>Note</th></tr></thead>
                  <tbody>
                    {statiComp.map(s => (
                      <tr key={s.id}>
                        <td style={{ whiteSpace:"nowrap" }}>{formatData(s.data)}</td>
                        <td style={{ fontWeight:600 }}>{s.componenteTipo}{s.componenteMatricola ? " · "+s.componenteMatricola : ""}</td>
                        <td>{ETICHETTA_STATO[s.stato] || s.stato}</td>
                        <td>{s.motivo||"—"}</td>
                        <td>{s.officina||"—"}</td>
                        <td style={{ fontSize:12, color:"var(--text3)" }}>{s.note||"—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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

      {/* MODAL STATO SINGOLO COMPONENTE */}
      {modalStato && (() => {
        const comp   = (gt.componenti || [])[modalStato.index] || {};
        const stato  = modalStato.stato;
        const rientro = stato === "attivo";
        const titolo = rientro
          ? "Rimetti in servizio"
          : stato === "in_revisione" ? "Manda in revisione" : "Metti fuori servizio";
        return (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth:500 }}>
              <div className="modal-header">
                <span className="modal-title">{titolo} — {comp.tipo}</span>
                <button className="modal-close" onClick={() => setModalStato(null)}>✕</button>
              </div>
              <div style={{ fontSize:12, color:"var(--text3)", marginBottom:12 }}>
                {comp.modello || "—"}{comp.matricola ? " · matr. " + comp.matricola : ""}
              </div>

              {rientro && comp.motivoStato && (
                <div style={{ fontSize:12, color:"var(--amber-text)", background:"var(--amber-bg)", padding:"8px 12px", borderRadius:"var(--radius-sm)", marginBottom:12 }}>
                  Fermo dal {formatData(comp.dataStato)} — {comp.motivoStato}
                  {comp.officina ? " · " + comp.officina : ""}
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label>{rientro ? "Data rientro" : "Data"}</label>
                  <input type="date" value={formStato.data} onChange={e => setFormStato(p => ({...p, data:e.target.value}))}/>
                </div>

                {!rientro && (
                  <>
                    <div className="form-group">
                      <label>Motivo</label>
                      <input list="motivi-stato-comp" value={formStato.motivo} onChange={e => setFormStato(p => ({...p, motivo:e.target.value}))} placeholder="es. Perdita olio"/>
                      <datalist id="motivi-stato-comp">
                        {MOTIVI_STATO.map(m => <option key={m} value={m}/>)}
                      </datalist>
                    </div>
                    {stato === "in_revisione" && (
                      <div className="form-group">
                        <label>Officina / ditta</label>
                        <input value={formStato.officina} onChange={e => setFormStato(p => ({...p, officina:e.target.value}))} placeholder="es. Lukas Service"/>
                      </div>
                    )}
                  </>
                )}

                {rientro && (
                  <div className="form-group" style={{ gridColumn:"1/-1" }}>
                    <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                      <input type="checkbox" style={{ width:"auto" }} checked={formStato.revisioneEseguita} onChange={e => setFormStato(p => ({...p, revisioneEseguita:e.target.checked}))}/>
                      Revisione eseguita su questo componente
                    </label>
                  </div>
                )}
                {rientro && formStato.revisioneEseguita && (
                  <div className="form-group">
                    <label>Prossima revisione tra (anni)</label>
                    <input type="number" min="1" step="1" value={formStato.intervalloAnni} onChange={e => setFormStato(p => ({...p, intervalloAnni:e.target.value}))} placeholder="es. 3"/>
                  </div>
                )}

                <div className="form-group" style={{ gridColumn:"1/-1" }}>
                  <label>Note</label>
                  <textarea value={formStato.note} onChange={e => setFormStato(p => ({...p, note:e.target.value}))} rows={2} placeholder={rientro ? "es. sostituite guarnizioni" : "dettagli del guasto"}/>
                </div>
              </div>

              <div style={{ fontSize:11, color:"var(--text3)", marginTop:12 }}>
                {rientro
                  ? "Il componente torna a contare per la scadenza del kit."
                  : "Il componente resta nel kit ma non conta piu' per la scadenza, finche' non rientra."}
              </div>

              <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:16 }}>
                <button className="btn btn-secondary" onClick={() => setModalStato(null)}>Annulla</button>
                <button className={rientro ? "btn btn-success" : "btn btn-primary"} onClick={salvaStatoComponente} disabled={saving}>
                  {saving ? "Salvataggio..." : "Conferma"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
              <div className="form-group"><label>Revisione ogni (anni)</label><input type="number" min="1" step="1" value={formRev.intervalloAnni} onChange={e => setFormRev(p=>({...p,intervalloAnni:e.target.value}))} placeholder="es. 3"/></div>
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