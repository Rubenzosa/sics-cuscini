/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllRevisioniPianificate, pianificaRevisione,
  aggiornaRevisionePianificata,
  getAllPromemoria, salvaPromemoria, deletePromemoria, getAllManutenzioniGT,
} from "../firebase/service";
import { calcolaStato, calcolaStatoGT, prossimaRevisioneGT, giorniAllaScadenza, isoLocale, oggiIso } from "../utils";
import { normalizzaEventi } from "../calendarioEventi";

const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
              "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const GIORNI = ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];
const OFFICINE = ["VVF Siena","VVF Firenze","VVF Arezzo","Centro revisione esterno","Altro"];
const COLORE_SISTEMA = { cuscini: "#5c6bc0", taglio: "#f9a825" };

function isoToDate(s) {
  if (!s) return null;
  const m = /^(d{4})-(d{2})-(d{2})/.exec(String(s));
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(s);
}
// Chiave giorno sempre in fuso locale: toISOString() sposterebbe gli eventi di un giorno.
function dateToIso(d) { return isoLocale(d); }
function sameDay(a, b) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

// ── MODAL PIANIFICA ─────────────────────────────────────────
function ModalPianifica({ kits, gruppiTaglio, dataIniziale, onSave, onClose, editing }) {
  const oggi = oggiIso();
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
  const [eventi, setEventi] = useState([]);          // revisioni pianificate
  const [promemoria, setPromemoria]     = useState([]);
  const [manutenzioni, setManutenzioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [giornoPop, setGiornoPop] = useState(null);
  const [modal, setModal]   = useState(null);
  const [dataClick, setDataClick] = useState(null);
  const [filtroSistema, setFiltroSistema] = useState("tutti"); // tutti | cuscini | taglio

  useEffect(() => { carica(); }, []);

  async function carica() {
    setLoading(true);
    const [piani, prom, manut] = await Promise.all([
      getAllRevisioniPianificate(), getAllPromemoria(), getAllManutenzioniGT(),
    ]);
    setEventi(piani);
    setPromemoria(prom);
    setManutenzioni(manut);
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

  async function handleDeletePromemoria(id) {
    if (!window.confirm("Eliminare questo promemoria?")) return;
    await deletePromemoria(id);
    await carica();
  }

  async function handleNuovoPromemoria(d) {
    const titolo = window.prompt("Testo del promemoria:");
    if (!titolo) return;
    const sistema = window.confirm("OK = Cuscini, Annulla = Taglio") ? "cuscini" : "taglio";
    await salvaPromemoria({ data: dateToIso(d), sistema, titolo, note: "" });
    await carica();
  }

  // Eventi unificati del calendario, filtrati per sistema
  const eventiUnificati = normalizzaEventi(
    { kits, gruppi: gruppiTaglio, pianificate: eventi, manutenzioni, promemoria },
    { statoKit: calcolaStato, statoGT: calcolaStatoGT, scadGT: prossimaRevisioneGT }
  ).filter(ev => filtroSistema === "tutti" || ev.sistema === filtroSistema);

  function eventiDelGiorno(d) {
    if (!d) return [];
    const k = dateToIso(d);
    return eventiUnificati.filter(ev => ev.data === k);
  }

  // Griglia del mese
  const primoGiorno = new Date(anno, mese, 1);
  const ultimoGiorno = new Date(anno, mese+1, 0);
  let startDay = primoGiorno.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const totaleCelle = Math.ceil((startDay + ultimoGiorno.getDate()) / 7) * 7;

  function navigaMese(delta) {
    let m = mese + delta;
    let a = anno;
    if (m > 11) { m=0; a++; }
    if (m < 0)  { m=11; a--; }
    setMese(m); setAnno(a);
    setGiornoPop(null);
  }

  // Prossimi eventi pianificati (lista sotto)
  const prossimi = eventi
    .filter(e => e.stato === "pianificata" && e.dataPrevista >= dateToIso(oggi))
    .slice(0, 8);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendario</h1>
          <div style={{ fontSize:12, color:"var(--text3)", marginTop:4 }}>
            Scadenze, revisioni pianificate, manutenzioni e promemoria
          </div>
        </div>
        <button className="btn btn-primary"
          onClick={() => { setDataClick(dateToIso(oggi)); setModal("nuovo"); }}>
          + Pianifica revisione
        </button>
      </div>

      {/* Filtro sistema + legenda */}
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
        {[["tutti","Tutti"],["cuscini","Cuscini"],["taglio","Taglio"]].map(([k,l]) => (
          <button key={k} className={`filter-chip ${filtroSistema===k?"active":""}`} onClick={() => setFiltroSistema(k)}>{l}</button>
        ))}
        <div style={{ display:"flex", gap:14, marginLeft:"auto", fontSize:11 }}>
          <Legenda color="#5c6bc0" label="Cuscini" />
          <Legenda color="#f9a825" label="Taglio" />
          <Legenda color="var(--red)" label="Scaduto/critico" ring />
        </div>
      </div>

      {/* Navigazione mese */}
      <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:"var(--radius)", overflow:"hidden", marginBottom:16, boxShadow:"var(--shadow)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", borderBottom:"1px solid var(--border)" }}>
          <button onClick={() => navigaMese(-1)}
            style={{ background:"var(--bg)", boxShadow:"var(--neu-out)", border:"none", color:"var(--text2)", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:16 }}>
            ‹
          </button>
          <span style={{ fontWeight:800, fontSize:16 }}>
            {MESI[mese]} {anno}
          </span>
          <button onClick={() => navigaMese(1)}
            style={{ background:"var(--bg)", boxShadow:"var(--neu-out)", border:"none", color:"var(--text2)", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:16 }}>
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
            const evs    = d ? eventiDelGiorno(d) : [];

            return (
              <div key={i}
                onClick={() => { if (d) setGiornoPop(isSel ? null : d); }}
                style={{
                  minHeight:72, padding:"6px 8px",
                  border:"1px solid var(--border)",
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

                    {/* Dot eventi per sistema */}
                    <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                      {evs.slice(0,4).map((ev,j) => (
                        <span key={j} title={ev.nome} style={{
                          width:9, height:9, borderRadius:"50%",
                          background: COLORE_SISTEMA[ev.sistema],
                          boxShadow: (ev.stato==="scaduto"||ev.stato==="critico") ? "0 0 0 2px var(--red)" : "none",
                        }}/>
                      ))}
                      {evs.length > 4 && (
                        <span style={{ fontSize:9, color:"var(--text3)" }}>+{evs.length-4}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Popup giorno selezionato */}
      {giornoPop && (
        <div className="card" style={{ marginBottom:16, borderTop:"3px solid var(--accent)" }}>
          <div className="card-header">
            <span className="card-title">
              {giornoPop.toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"})}
            </span>
            <button className="card-action" onClick={() => handleNuovoPromemoria(giornoPop)}>+ Promemoria</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {eventiDelGiorno(giornoPop).length === 0 && (
              <div style={{ color:"var(--text3)", fontSize:13 }}>Nessun evento.</div>
            )}
            {eventiDelGiorno(giornoPop).map((ev,i) => (
              <div key={i} style={{
                display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
                background:"var(--bg3)", border:"1px solid var(--border)",
                borderLeft:`4px solid ${COLORE_SISTEMA[ev.sistema]}`, borderRadius:"var(--radius-sm)",
              }}>
                <span style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:".04em", padding:"2px 8px", borderRadius:10, color:"#fff", background:COLORE_SISTEMA[ev.sistema] }}>
                  {ev.sistema === "taglio" ? "Taglio" : "Cuscini"}
                </span>
                <span style={{ flex:1, minWidth:0, cursor: ev.tipo==="scadenza" ? "pointer" : "default" }}
                  onClick={() => { if (ev.tipo==="scadenza") navigate(ev.sistema==="taglio" ? `/gruppi-taglio/${ev.id}` : `/kit/${ev.id}`); }}>
                  <span style={{ display:"block", fontSize:13, fontWeight:700 }}>{ev.nome}</span>
                  <span style={{ display:"block", fontSize:10, color:"var(--text3)", textTransform:"uppercase" }}>{ev.tipo}</span>
                </span>
                {ev.tipo === "promemoria" && (
                  <button className="btn btn-danger" style={{ fontSize:11, padding:"4px 10px" }}
                    onClick={() => handleDeletePromemoria(ev.id)}>✕</button>
                )}
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
                  <div style={{ textAlign:"center", minWidth:44, flexShrink:0 }}>
                    <div style={{ fontSize:20, fontWeight:800, color:"var(--accent)", lineHeight:1 }}>
                      {new Date(ev.dataPrevista).getDate()}
                    </div>
                    <div style={{ fontSize:10, color:"var(--text3)", fontWeight:600 }}>
                      {MESI[new Date(ev.dataPrevista).getMonth()].slice(0,3).toUpperCase()}
                    </div>
                  </div>
                  <div style={{ width:1, height:36, background:"var(--border)", flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:"var(--text)",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {(ev.kitNomi||[]).join(", ")}
                    </div>
                    <div style={{ fontSize:11, color:"var(--text3)", marginTop:2 }}>
                      {ev.officina}{ev.note ? ` — ${ev.note}` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10,
                      background: COLORE_SISTEMA[ev.sistema==="taglio"?"taglio":"cuscini"], color:"#fff" }}>
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

function Legenda({ color, label, ring }) {
  return (
    <span style={{ display:"flex", alignItems:"center", gap:5, color:"var(--text3)" }}>
      <span style={{ width:10, height:10, borderRadius:"50%", background: ring ? "transparent" : color, border: ring ? `2px solid ${color}` : "none" }}/>
      {label}
    </span>
  );
}
