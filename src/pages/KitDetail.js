import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  deleteKit, sostituisciComponente, getStoricoSostituzioni,
  aggiungiRevisione, getRevisioni, spostaKit, getStoricoSpostamenti,
  uploadAllegato, getAllegatiKit, deleteAllegato, mettiComponenteFuoriUso,
  eliminaVecchioCodice,
} from "../firebase/service";
import { calcolaStato, statoLabel, formatData, giorniAllaScadenza, componentiFuoriUso, oggiIso } from "../utils";
import Documenti from "../components/Documenti";
import { suggerisciMatricola } from "../numerazione";

const TIPI_COMP = ["CUSCINO 30X30","CUSCINO 35X35","CUSCINO 37X37","CUSCINO 38X38","CUSCINO 40X40","CUSCINO 45X45","CUSCINO 47X52","CUSCINO 48X58","CUSCINO 50X50","CUSCINO 55X55","CUSCINO 60X60","CUSCINO 65X65","CUSCINO 100X32","CENTRALINA","RIDUTTORE","TUBO","TUBO 2MT","TUBO 5MT","RUB. VALVOLARE"];
const DISLOCAZIONI = ["Sede Centrale","Magazzino","Montepulciano","Montalcino","Poggibonsi","Piancastagnaio"];
const DEST_LABEL = { fuori_uso:"Fuori uso", magazzino:"Magazzino", revisione:"In revisione" };
const DEST_COLOR = {
  fuori_uso: { bg:"var(--red-bg)", color:"var(--red-text)" },
  magazzino: { bg:"var(--blue-bg)", color:"var(--blue-text)" },
  revisione: { bg:"var(--amber-bg)", color:"var(--amber-text)" },
};
const ESITO_COLOR = { positivo:"green", condizionato:"amber", negativo:"red" };

function fmtSize(b) {
  if (!b) return "";
  if (b < 1024)    return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}

function AllegatiUpload({ kitId }) {
  const [allegati, setAllegati] = useState([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    getAllegatiKit(kitId).then(setAllegati);
  }, [kitId]);

  async function carica() {
    const docs = await getAllegatiKit(kitId);
    setAllegati(docs);
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadAllegato(kitId, file);
      await carica();
    } catch (err) {
      alert("Errore upload: " + err.message);
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleDelete(a) {
    if (!window.confirm(`Eliminare "${a.nomeFile}"?`)) return;
    await deleteAllegato(a.id, a.path);
    await carica();
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: "none" }} onChange={handleUpload} />
        <button className="btn btn-primary" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? "Caricamento..." : "+ Carica allegato"}
        </button>
        <span style={{ fontSize: 11, color: "var(--text3)" }}>Accetta JPG, PNG, PDF</span>
      </div>

      {allegati.length === 0 ? (
        <div style={{ color: "var(--text3)", fontSize: 13, textAlign: "center", padding: 24 }}>
          Nessun allegato caricato
        </div>
      ) : (
        allegati.map(a => (
          <div key={a.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", background: "var(--bg3)",
            border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", marginBottom: 6,
          }}>
            <div style={{ fontSize: 20, flexShrink: 0 }}>
              {a.mimeType?.includes("pdf") ? "📄" : "🖼"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {a.nomeFile}
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                {a.dataCaricamento ? new Date(a.dataCaricamento).toLocaleDateString("it-IT") : ""}
                {a.dimensione ? ` · ${fmtSize(a.dimensione)}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {a.url && (
                <a href={a.url} target="_blank" rel="noreferrer"
                  className="btn btn-secondary" style={{ fontSize: 11, padding: "4px 10px" }}>
                  Apri
                </a>
              )}
              <button className="btn btn-danger" style={{ fontSize: 11, padding: "4px 10px" }}
                onClick={() => handleDelete(a)}>✕</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function KitDetail({ kits, reload }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const kit = kits.find(k => k.id === id);

  const [tab, setTab] = useState("info");
  const [modalSost, setModalSost] = useState(null);
  const [modalRev, setModalRev] = useState(false);
  const [modalSpost, setModalSpost] = useState(false);
  const [modalFuoriUso, setModalFuoriUso] = useState(null); // index componente o null
  const [noteFU, setNoteFU] = useState("");
  const [saving, setSaving] = useState(false);

  const [storicoSost, setStoricoSost] = useState([]);
  const [revisioni, setRevisioni] = useState([]);
  const [storicoSpost, setStoricoSpost] = useState([]);

  const [nuovoComp, setNuovoComp] = useState({ tipo:"", modello:"", matricola:"", bar:8, matricolaLucca:"", dataInizioServizio: oggiIso(), dataRevisione:"", note:"" });
  const [destComp, setDestComp] = useState("fuori_uso");
  const [noteUscita, setNoteUscita] = useState("");

  const [formRev, setFormRev] = useState({ dataRevisione: oggiIso(), tecnico:"", ente:"", esito:"positivo", note:"", intervalloAnni: kit?.intervalloRevisioneAnni ?? "" });
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
    setNuovoComp({ tipo:c.tipo, modello:"", matricola:"", bar:c.bar||kit.bar, matricolaLucca:suggerisciMatricola(kits, c.tipo, c.bar||kit.bar), dataInizioServizio:oggiIso(), dataRevisione:"", note:"" });
    setDestComp("fuori_uso"); setNoteUscita(""); setModalSost(i);
  }

  function handleNuovoCompChange(field, value) {
    setNuovoComp(p => {
      const u = { ...p, [field]: value };
      if (field === "tipo" || field === "bar") {
        u.matricolaLucca = suggerisciMatricola(kits, field === "tipo" ? value : p.tipo, field === "bar" ? Number(value) : Number(p.bar));
      }
      return u;
    });
  }

  async function handleEliminaVecchioCodice(indexComp) {
    if (!window.confirm("Eliminare definitivamente il vecchio codice? Non sarà più recuperabile.")) return;
    try { await eliminaVecchioCodice(kit.id, indexComp); await reload(); }
    catch (e) { alert("Errore: " + e.message); }
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

  async function handleFuoriUso() {
    setSaving(true);
    try { await mettiComponenteFuoriUso(kit.id, modalFuoriUso, noteFU); await reload(); setModalFuoriUso(null); setNoteFU(""); }
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
      {componentiFuoriUso(kit) > 0 && <div className="alert-banner" style={{ background:"var(--amber-bg)", borderColor:"#fac775", color:"var(--amber-text)", marginBottom:16 }}>Kit non completo — {componentiFuoriUso(kit)} componente/i fuori uso da sostituire. Revisione valida sul resto del kit.</div>}

      {/* TAB NAV */}
      <div style={{ display:"flex", gap:2, marginBottom:16, borderBottom:"2px solid var(--border)", overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
        {[["info","Informazioni"],["componenti",`Componenti (${kit.componenti?.length||0})`],["revisioni",`Revisioni (${revisioni.length})`],["sostituzioni",`Sostituzioni (${storicoSost.length})`],["spostamenti",`Spostamenti (${storicoSpost.length})`],["documenti", kit.stato==="fuori_uso"?"Allegati":"Documenti"]].map(([key, label]) => (
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
            <span style={{ fontSize:11, color:"var(--text3)" }}>La matricola Lucca è quella incisa sul cuscino</span>
          </div>
          {gruppi.map(({ titolo, items }) => {
            if (!items.length) return null;
            return (
              <div key={titolo} style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>{titolo} ({items.length})</div>
                {items.map(c => {
                  const ri = (kit.componenti||[]).indexOf(c);
                  return (
                    <div key={ri} className={c.fuoriUso ? "gtc rev" : "gtc"}>
                      <div className="gtc-top">
                        <div style={{ flex:1, minWidth:0 }}>
                          <div className={c.fuoriUso ? "gtc-tipo spenta" : "gtc-tipo"}>{c.tipo}</div>
                          <div className="gtc-mod">{c.modello||"—"}</div>
                          {c.fuoriUso && <span className="gtc-stato rev"><span className="gtc-dot puls"/>Fuori uso</span>}
                        </div>
                        <div className="gtc-targa">
                          <span className="gtc-targa-lbl">Matricola Lucca</span>
                          <span className="gtc-targa-val">{c.matricolaLucca || "n.d."}</span>
                          <span className="gtc-targa-sub">
                            {c.matricola || "senza matricola"}
                          </span>
                        </div>
                      </div>

                      {c.fuoriUso && (
                        <div className="gtc-fermo rev">
                          <span className="gtc-fermo-k">Fuori uso dal {formatData(c.dataFuoriUso)}</span>
                          <b>{c.noteFuoriUso || "motivo non indicato"}</b>
                          {" — in attesa di sostituzione"}
                        </div>
                      )}

                      <div className="gtc-specs">
                        {c.bar && <span className="gtc-spec"><span className="gtc-spec-k">Pressione</span><span className="gtc-spec-v">{c.bar} bar</span></span>}
                        {c.dataInizioServizio && (
                          <span className="gtc-spec"><span className="gtc-spec-k">In servizio</span><span className="gtc-spec-v">{formatData(c.dataInizioServizio)}</span></span>
                        )}
                        {c.vecchio_codice && c.vecchio_codice !== c.matricolaLucca && (
                          <span className="gtc-spec">
                            <span className="gtc-spec-k">Vecchio codice</span>
                            <span className="gtc-spec-v" style={{ textDecoration:"line-through", color:"var(--text3)" }}>{c.vecchio_codice}</span>
                            <button type="button" onClick={() => handleEliminaVecchioCodice(ri)}
                              style={{ marginLeft:6, fontSize:10, padding:"1px 6px", border:"1px solid var(--border)", borderRadius:6, background:"transparent", color:"var(--text3)", cursor:"pointer" }}>
                              Elimina storico
                            </button>
                          </span>
                        )}
                        {c.note && <span className="gtc-spec bad"><span className="gtc-spec-k">Nota</span><span className="gtc-spec-v">{c.note}</span></span>}
                      </div>

                      <div className="gtc-foot">
                        <div className="gtc-scad">
                          {c.fuoriUso
                            ? <span className="gtc-scad-off">Il kit resta revisionato ma incompleto</span>
                            : <span className="gtc-scad-off">In servizio</span>}
                        </div>
                        <div className="gtc-acts">
                          {!c.fuoriUso && (
                            <button className="gtc-btn rev" onClick={() => { setModalFuoriUso(ri); setNoteFU(""); }}>
                              Metti fuori uso
                            </button>
                          )}
                          <button className={c.fuoriUso ? "gtc-btn go" : "gtc-btn"} onClick={() => apriSostituisci(ri)}>
                            Sostituisci{c.fuoriUso ? " ora" : ""}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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

      {/* TAB: DOCUMENTI */}
      {tab === "documenti" && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              {kit.stato === "fuori_uso" ? "Allegati" : "Documenti allegati"}
            </span>
            <span style={{ fontSize:11, color:"var(--text3)" }}>
              {kit.stato === "fuori_uso" ? "JPG, PNG, PDF" : "Fatture, verbali, certificati"}
            </span>
          </div>
          {kit.stato === "fuori_uso" ? (
            <AllegatiUpload kitId={kit.id} />
          ) : (
            <Documenti kitId={kit.id} kitNome={kit.nome} sistema="cuscini"/>
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
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:10 }}>
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
              <div className="form-group" style={{ gridColumn:"1/-1" }}>
                <label>Durata scadenza (anni) — opzionale</label>
                <input type="number" min="1" step="1" value={formRev.intervalloAnni} onChange={e => setFormRev(p => ({...p, intervalloAnni:e.target.value}))} placeholder="Vuoto = automatico da età cuscini (<10 anni → 2, ≥10 → 1)"/>
              </div>
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
      {modalFuoriUso !== null && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:460 }}>
            <div className="modal-header">
              <span className="modal-title">Metti fuori uso — {kit.componenti?.[modalFuoriUso]?.tipo}</span>
              <button className="modal-close" onClick={() => setModalFuoriUso(null)}>✕</button>
            </div>
            <p style={{ fontSize:13, color:"var(--text2)", marginBottom:14 }}>
              Il componente resta nel kit marcato <strong>fuori uso</strong>, in attesa di sostituzione.
              Il resto del kit resta revisionato e funzionante.
            </p>
            <div className="form-group">
              <label>Motivo / note (opzionale)</label>
              <textarea value={noteFU} onChange={e => setNoteFU(e.target.value)} placeholder="es. Lacerazione, perdita di pressione..." rows={3} style={{ resize:"vertical" }}/>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
              <button className="btn btn-secondary" onClick={() => setModalFuoriUso(null)}>Annulla</button>
              <button className="btn btn-danger" onClick={handleFuoriUso} disabled={saving}>{saving?"Salvataggio...":"Conferma fuori uso"}</button>
            </div>
          </div>
        </div>
      )}

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