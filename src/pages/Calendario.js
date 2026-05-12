/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllRevisioniPianificate,
  pianificaRevisione,
  aggiornaRevisionePianificata,
  deleteRevisionePianificata,
} from "../firebase/service";
import { calcolaStato, calcolaStatoGT, prossimaRevisioneGT, giorniAllaScadenza } from "../utils";

const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
              "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const GIORNI = ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];
const OFFICINE = ["VVF Siena","VVF Firenze","VVF Arezzo","Centro revisione esterno","Altro"];

// ── UTIL DATE ───────────────────────────────────────────────
function isoToDate(s) { return s ? new Date(s) : null; }
function dateToIso(d) { return d ? d.toISOString().split("T")[0] : ""; }
function sameDay(a, b) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

// ── MODAL PIANIFICA ─────────────────────────────────────────
function ModalPianifica({ kits, gruppiTaglio, dataIniziale, onSave, onClose, editing }) {
  const oggi = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState(editing || {
    dataPrevista: dataIniziale || oggi,
    officina: "VVF Siena",
    note: "",
    sistema: "cuscini",
    kitIds: [],
    kitNomi: [],
  });
  const [search, setSearch] = useState("");

  function set(k, v) { setForm(p => ({...p, [k]:v})); }

  const lista = form.sistema === "cuscini"
    ? kits.filter(k => k.stato === "attivo" || k.stato === "magazzino")
    : gruppiTaglio.filter(g => g.stato === "attivo" || g.stato === "magazzino");

  const filtrati = lista.filter(item => {
    const nome = form.sistema === "cuscini"
      ? `Kit ${item.numero} ${item.nome} ${item.mezzo}`
      : `${item.nome} ${item.mezzo}`;
    return !search || nome.toLowerCase().includes(search.toLowerCase());
  });

  function toggleKit(item) {
    const id   = item.id;
    const nome = form.sistema === "cuscini"
      ? `Kit ${item.numero} — ${item.nome}`
      : item.nome;
    if (form.kitIds.includes(id)) {
      set("kitIds",  form.kitIds.filter(x => x !== id));
      set("kitNomi", form.kitNomi.filter(x => x !== nome));
    } else {
      set("kitIds",  [...form.kitIds, id]);
      set("kitNomi", [...form.kitNomi, nome]);
    }
  }

  function handleSave() {
    if (!form.dataPrevista) { alert("Inserisci la data prevista"); return; }
    if (!form.kitIds.length) { alert("Seleziona almeno un kit"); return; }
    onSave(form);
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth:560 }}>
        <div className="modal-header">
          <span className="modal-title">{editing ? "Modifica revisione" : "Pianifica revisione"}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Data prevista</label>
            <input type="date" value={form.dataPrevista}
              onChange={e => set("dataPrevista", e.target.value)}/>
          </div>
          <div className="form-group">
            <label>Officina / Destinazione</label>
            <select value={form.officina} onChange={e => set("officina", e.target.value)}>
              {OFFICINE.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Sistema</label>
            <select value={form.sistema} onChange={e => { set("sistema", e.target.value); set("kitIds",[]); set("kitNomi",[]); }}>
              <option value="cuscini">Cuscini</option>
              <option value="taglio">Gruppi taglio</option>
            </select>
          </div>
          <div className="form-group">
            <label>Note</label>
            <input value={form.note} onChange={e => set("note", e.target.value)}
              placeholder="es. Trasporto con furgone, accompagnamento..."/>
          </div>
        </div>

        {/* Selezione kit */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 }}>
            Kit da inviare ({form.kitIds.length} selezionati)
          </div>
          {form.kitNomi.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:8 }}>
              {form.kitNomi.map((n,i) => (
                <span key={i} style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:12,
                  background:"var(--blue-bg)", color:"var(--blue-text)" }}>
                  {n}
                </span>
              ))}
            </div>
          )}
          <input
            style={{ width:"100%", padding:"7px 10px", border:"1px solid var(--border2)", borderRadius:"var(--radius-sm)", fontSize:12, fontFamily:"inherit", color:"var(--text)", background:"var(--bg2)", outline:"none", marginBottom:8 }}
            placeholder="Cerca kit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ maxHeight:200, overflowY:"auto", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)" }}>
            {filtrati.map(item => {
              const sel = form.kitIds.includes(item.id);
              const stato = form.sistema === "cuscini" ? calcolaStato(item) : calcolaStatoGT(item);
              return (
                <div key={item.id} onClick={() => toggleKit(item)}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                    background: sel ? "var(--blue-bg)" : "var(--bg2)",
                    borderBottom:"1px solid var(--border)", cursor:"pointer" }}>
                  <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${sel?"var(--accent)":"var(--border2)"}`,
                    background:sel?"var(--accent)":"transparent", display:"flex", alignItems:"center", justifyContent:"center",
                    color:"#fff", fontSize:12, flexShrink:0 }}>
                    {sel && "✓"}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:12 }}>
                      {form.sistema === "cuscini" ? `Kit ${item.numero} — ${item.nome}` : item.nome}
                    </div>
                    <div style={{ fontSize:10, color:"var(--text3)" }}>
                      {item.mezzo} · {item.dislocazione}
                    </div>
                  </div>
                  <span className={`pill ${stato}`} style={{ fontSize:9 }}>{stato}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:16 }}>
          <button className="btn btn-secondary" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {editing ? "Salva modifiche" : "Pianifica"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CALENDARIO PRINCIPALE ───────────────────────────────────
export default function Calendario({ kits, gruppiTaglio }) {
  const navigate  = useNavigate();
  const oggi      = new Date();
  const [anno, setAnno]     = useState(oggi.getFullYear());
  const [mese, setMese]     = useState(oggi.getMonth());
  const [eventi, setEventi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [giornoPop, setGiornoPop] = useState(null); // data selezionata per popup
  const [modal, setModal]   = useState(null);       // null | "nuovo" | evento (editing)
  const [dataClick, setDataClick] = useState(null);

  useEffect(() => { carica(); }, []);

  async function carica() {
    setLoading(true);
    const data = await getAllRevisioniPianificate();
    setEventi(data);
    setLoading(false);
  }

  async function handleSave(form) {
    if (modal && modal.id) {
      await aggiornaRevisionePianificata(modal.id, form);
    } else {
      await pianificaRevisione(form);
    }
    await carica();
    setModal(null);
  }

  async function handleDelete(id) {
    if (!window.confirm("Eliminare questa revisione pianificata?")) return;
    await deleteRevisionePianificata(id);
    await carica();
    setGiornoPop(null);
  }

  async function handleCompleta(ev) {
    await aggiornaRevisionePianificata(ev.id, { stato:"completata" });
    await carica();
    setGiornoPop(null);
  }

  // Costruisce griglia del mese
  const primoGiorno = new Date(anno, mese, 1);
  const ultimoGiorno = new Date(anno, mese+1, 0);
  // Giorno settimana del primo (0=dom → trasforma in 0=lun)
  let startDay = primoGiorno.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const totaleCelle = Math.ceil((startDay + ultimoGiorno.getDate()) / 7) * 7;

  // Raggruppa eventi per data
  const eventiPerGiorno = {};
  eventi.forEach(ev => {
    if (!ev.dataPrevista) return;
    const k = ev.dataPrevista;
    if (!eventiPerGiorno[k]) eventiPerGiorno[k] = [];
    eventiPerGiorno[k].push(ev);
  });

  // Scadenze automatiche nel mese corrente (da kits e gruppi)
  const scadenzeDelMese = [];
  [...kits, ...gruppiTaglio].forEach(item => {
    const isKit = "dataRevisione" in item;
    const data  = isKit ? item.dataRevisione : prossimaRevisioneGT(item);
    if (!data || data === "NO REVISIONE") return;
    const d = new Date(data);
    if (d.getFullYear() === anno && d.getMonth() === mese) {
      scadenzeDelMese.push({
        id:     item.id,
        tipo:   "scadenza",
        sistema: isKit ? "cuscini" : "taglio",
        nome:   isKit ? `Kit ${item.numero} — ${item.nome}` : item.nome,
        data,
        stato:  isKit ? calcolaStato(item) : calcolaStatoGT(item),
        onClick: () => navigate(isKit ? `/kit/${item.id}` : `/gruppi-taglio/${item.id}`),
      });
    }
  });

  function getEventiGiorno(d) {
    const iso = dateToIso(d);
    return (eventiPerGiorno[iso] || []).map(ev => ({ ...ev, tipo:"pianificata" }));
  }
  function getScadenzeGiorno(d) {
    return scadenzeDelMese.filter(s => sameDay(new Date(s.data), d));
  }

  function navigaMese(delta) {
    let m = mese + delta;
    let a = anno;
    if (m > 11) { m=0; a++; }
    if (m < 0)  { m=11; a--; }
    setMese(m); setAnno(a);
    setGiornoPop(null);
  }

  // Popup eventi del giorno selezionato
  const evGiorno    = giornoPop ? getEventiGiorno(giornoPop) : [];
  const scGiorno    = giornoPop ? getScadenzeGiorno(giornoPop) : [];
  const tuttiGiorno = [...evGiorno, ...scGiorno];

  // Prossimi eventi (lista sotto calendario)
  const prossimi = eventi
    .filter(e => e.stato === "pianificata" && e.dataPrevista >= dateToIso(oggi))
    .slice(0, 8);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendario revisioni</h1>
          <div style={{ fontSize:12, color:"var(--text3)", marginTop:4 }}>
            Revisioni pianificate e scadenze
          </div>
        </div>
        <button className="btn btn-primary"
          onClick={() => { setDataClick(dateToIso(oggi)); setModal("nuovo"); }}>
          + Pianifica revisione
        </button>
      </div>

      {/* Legenda */}
      <div style={{ display:"flex", gap:16, marginBottom:14, flexWrap:"wrap", fontSize:11 }}>
        {[
          { color:"#378add", label:"Revisione pianificata" },
          { color:"#e24b4a", label:"Scadenza — scaduta/critica" },
          { color:"#ba7517", label:"Scadenza — quest'anno" },
          { color:"#639922", label:"Scadenza — in regola" },
          { color:"#888",    label:"Completata" },
        ].map(l => (
          <div key={l.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:l.color, flexShrink:0 }}/>
            <span style={{ color:"var(--text3)" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Navigazione mese */}
      <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:"var(--radius)", overflow:"hidden", marginBottom:16, boxShadow:"var(--shadow)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", borderBottom:"1px solid var(--border)", background:"var(--navy)" }}>
          <button onClick={() => navigaMese(-1)}
            style={{ background:"rgba(255,255,255,.15)", border:"none", color:"#fff", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:16 }}>
            ‹
          </button>
          <span style={{ color:"#fff", fontWeight:800, fontSize:16 }}>
            {MESI[mese]} {anno}
          </span>
          <button onClick={() => navigaMese(1)}
            style={{ background:"rgba(255,255,255,.15)", border:"none", color:"#fff", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:16 }}>
            ›
          </button>
        </div>

        {/* Intestazioni giorni */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"1px solid var(--border)" }}>
          {GIORNI.map(g => (
            <div key={g} style={{ textAlign:"center", padding:"8px 4px", fontSize:11, fontWeight:700, color:"var(--text3)", background:"var(--bg3)" }}>
              {g}
            </div>
          ))}
        </div>

        {/* Griglia giorni */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
          {Array.from({ length:totaleCelle }, (_, i) => {
            const dayNum = i - startDay + 1;
            const valid  = dayNum >= 1 && dayNum <= ultimoGiorno.getDate();
            const d      = valid ? new Date(anno, mese, dayNum) : null;
            const isOggi = d && sameDay(d, oggi);
            const isSel  = d && giornoPop && sameDay(d, giornoPop);
            const evs    = d ? getEventiGiorno(d) : [];
            const scs    = d ? getScadenzeGiorno(d) : [];

            return (
              <div key={i}
                onClick={() => { if (d) setGiornoPop(isSel ? null : d); }}
                style={{
                  minHeight:72, padding:"6px 8px",
                  border:"1px solid var(--border)",
                  borderRadius:0,
                  background: isSel ? "var(--blue-bg)" : isOggi ? "var(--bg3)" : "var(--bg2)",
                  cursor: d ? "pointer" : "default",
                  opacity: valid ? 1 : 0,
                  position:"relative",
                  transition:"background .15s",
                }}>
                {valid && (
                  <>
                    <div style={{
                      fontSize:12, fontWeight: isOggi ? 800 : 500,
                      color: isOggi ? "var(--accent)" : "var(--text)",
                      marginBottom:4,
                    }}>
                      {dayNum}
                      {isOggi && <span style={{ marginLeft:4, fontSize:9, background:"var(--accent)", color:"#fff", padding:"1px 5px", borderRadius:8 }}>oggi</span>}
                    </div>

                    {/* Dot eventi */}
                    <div style={{ display:"flex", flexWrap:"wrap", gap:2 }}>
                      {evs.slice(0,3).map((ev,j) => (
                        <div key={j} style={{ width:8, height:8, borderRadius:"50%",
                          background: ev.stato==="completata" ? "#888" : "#378add" }}/>
                      ))}
                      {scs.slice(0,3).map((sc,j) => (
                        <div key={j} style={{ width:8, height:8, borderRadius:"50%",
                          background: sc.stato==="scaduto"||sc.stato==="critico" ? "#e24b4a"
                            : sc.stato==="attenzione" ? "#ba7517" : "#639922" }}/>
                      ))}
                      {(evs.length + scs.length) > 3 && (
                        <div style={{ fontSize:9, color:"var(--text3)" }}>+{evs.length+scs.length-3}</div>
                      )}
                    </div>

                    {/* Label evento (solo se pochi) */}
                    {evs.length === 1 && scs.length === 0 && (
                      <div style={{ fontSize:9, color:"#378add", fontWeight:700, marginTop:2,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {evs[0].kitNomi?.[0] || "Revisione"}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Popup giorno selezionato */}
      {giornoPop && tuttiGiorno.length > 0 && (
        <div className="card" style={{ marginBottom:16, borderTop:"3px solid var(--accent)" }}>
          <div className="card-header">
            <span className="card-title">
              {giornoPop.toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"})}
            </span>
            <button className="card-action" onClick={() => { setDataClick(dateToIso(giornoPop)); setModal("nuovo"); }}>
              + Aggiungi
            </button>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {/* Revisioni pianificate */}
            {evGiorno.map(ev => (
              <div key={ev.id} style={{
                background:"var(--blue-bg)", border:"1px solid #b5d4f4",
                borderRadius:"var(--radius-sm)", padding:"12px 14px",
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                      <span style={{ fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:10,
                        background: ev.stato==="completata" ? "#888" : "#378add", color:"#fff" }}>
                        {ev.stato==="completata" ? "COMPLETATA" : "PIANIFICATA"}
                      </span>
                      <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10,
                        background: ev.sistema==="taglio" ? "#7a3500" : "#1a2b3c", color:"#fff" }}>
                        {ev.sistema==="taglio" ? "TAGLIO" : "CUSCINI"}
                      </span>
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>
                      {(ev.kitNomi||[]).join(", ")}
                    </div>
                    <div style={{ fontSize:12, color:"var(--text3)", marginTop:2 }}>
                      {ev.officina}{ev.note ? ` — ${ev.note}` : ""}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    {ev.stato !== "completata" && (
                      <button className="btn btn-success" style={{ fontSize:11, padding:"4px 10px" }}
                        onClick={() => handleCompleta(ev)}>✓</button>
                    )}
                    <button className="btn btn-secondary" style={{ fontSize:11, padding:"4px 10px" }}
                      onClick={() => setModal(ev)}>✏</button>
                    <button className="btn btn-danger" style={{ fontSize:11, padding:"4px 10px" }}
                      onClick={() => handleDelete(ev.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))}

            {/* Scadenze automatiche */}
            {scGiorno.map((sc, i) => (
              <div key={i} onClick={sc.onClick}
                style={{
                  background:"var(--bg3)", border:`1px solid var(--border)`,
                  borderLeft:`4px solid ${sc.stato==="scaduto"||sc.stato==="critico"?"#e24b4a":sc.stato==="attenzione"?"#ba7517":"#639922"}`,
                  borderRadius:"var(--radius-sm)", padding:"10px 14px",
                  cursor:"pointer",
                }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:10, fontWeight:800, marginBottom:2, color:"var(--text3)", textTransform:"uppercase" }}>
                      Scadenza revisione
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{sc.nome}</div>
                  </div>
                  <span className={`pill ${sc.stato}`} style={{ fontSize:10 }}>{sc.stato}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista prossime revisioni pianificate */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Prossime revisioni pianificate</span>
        </div>
        {loading ? (
          <div className="loading">Caricamento...</div>
        ) : !prossimi.length ? (
          <div style={{ textAlign:"center", padding:24, color:"var(--text3)", fontSize:13 }}>
            Nessuna revisione pianificata.<br/>
            <button className="card-action" style={{ marginTop:8 }}
              onClick={() => { setDataClick(dateToIso(oggi)); setModal("nuovo"); }}>
              Pianifica la prima →
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {prossimi.map(ev => {
              const g = giorniAllaScadenza(ev.dataPrevista);
              return (
                <div key={ev.id}
                  onClick={() => { setMese(new Date(ev.dataPrevista).getMonth()); setAnno(new Date(ev.dataPrevista).getFullYear()); setGiornoPop(isoToDate(ev.dataPrevista)); }}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px",
                    background:"var(--bg3)", border:"1px solid var(--border)",
                    borderRadius:"var(--radius-sm)", cursor:"pointer" }}>
                  {/* Data */}
                  <div style={{ textAlign:"center", minWidth:44, flexShrink:0 }}>
                    <div style={{ fontSize:20, fontWeight:800, color:"var(--accent)", lineHeight:1 }}>
                      {new Date(ev.dataPrevista).getDate()}
                    </div>
                    <div style={{ fontSize:10, color:"var(--text3)", fontWeight:600 }}>
                      {MESI[new Date(ev.dataPrevista).getMonth()].slice(0,3).toUpperCase()}
                    </div>
                  </div>
                  {/* Divisore */}
                  <div style={{ width:1, height:36, background:"var(--border)", flexShrink:0 }}/>
                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:"var(--text)",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {(ev.kitNomi||[]).join(", ")}
                    </div>
                    <div style={{ fontSize:11, color:"var(--text3)", marginTop:2 }}>
                      {ev.officina}{ev.note ? ` — ${ev.note}` : ""}
                    </div>
                  </div>
                  {/* Badge */}
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10,
                      background: ev.sistema==="taglio"?"#7a3500":"#1a2b3c", color:"#fff" }}>
                      {ev.sistema==="taglio"?"TAGLIO":"CUSCINI"}
                    </span>
                    <div style={{ fontSize:11, color:"var(--text3)", marginTop:3 }}>
                      tra {g}gg
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL */}
      {modal && (
        <ModalPianifica
          kits={kits}
          gruppiTaglio={gruppiTaglio}
          dataIniziale={dataClick || dateToIso(oggi)}
          editing={modal !== "nuovo" ? modal : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}