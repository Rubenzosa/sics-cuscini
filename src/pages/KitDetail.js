import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { deleteKit, sostituisciComponente, getStoricoKit } from "../firebase/service";
import { calcolaStato, statoLabel, formatData, giorniAllaScadenza } from "../utils";
import { PROSSIMI_SERIALI, buildMatricolaLucca } from "../data/kitData";

const TIPI_COMP = [
  "CUSCINO 30X30","CUSCINO 35X35","CUSCINO 37X37","CUSCINO 38X38",
  "CUSCINO 40X40","CUSCINO 45X45","CUSCINO 47X52","CUSCINO 48X58",
  "CUSCINO 50X50","CUSCINO 55X55","CUSCINO 60X60","CUSCINO 65X65",
  "CUSCINO 100X32","CENTRALINA","RIDUTTORE","TUBO","TUBO 2MT",
  "TUBO 5MT","RUB. VALVOLARE"
];

const DEST_LABEL = {
  fuori_uso: "Fuori uso",
  magazzino: "Magazzino",
  revisione: "In revisione",
};

const DEST_COLOR = {
  fuori_uso: { bg: "#fcebeb", color: "#a32d2d" },
  magazzino: { bg: "#e6f1fb", color: "#185fa5" },
  revisione: { bg: "#faeeda", color: "#854f0b" },
};

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

  const [modalIndex, setModalIndex] = useState(null);
  const [storico, setStorico] = useState([]);
  const [showStorico, setShowStorico] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nuovoComp, setNuovoComp] = useState({
    tipo: "", modello: "", matricola: "", bar: 8,
    matricolaLucca: "", dataInizioServizio: new Date().toISOString().split("T")[0],
    dataRevisione: "", note: "",
  });
  const [destinazione, setDestinazione] = useState("fuori_uso");
  const [noteUscita, setNoteUscita] = useState("");

  useEffect(() => {
    if (kit) {
      getStoricoKit(kit.id).then(setStorico);
    }
  }, [kit]);

  if (!kit) return (
    <div style={{ textAlign: "center", padding: 60, color: "#888" }}>
      Kit non trovato. <button className="card-action" onClick={() => navigate("/kit")}>Torna alla lista</button>
    </div>
  );

  const stato = calcolaStato(kit);
  const giorni = giorniAllaScadenza(kit.dataRevisione);

  async function handleDelete() {
    if (window.confirm(`Eliminare definitivamente il Kit ${kit.numero} — ${kit.nome}?`)) {
      await deleteKit(kit.id);
      await reload();
      navigate("/kit");
    }
  }

  function apriModal(i) {
    const comp = kit.componenti[i];
    setNuovoComp({
      tipo: comp.tipo,
      modello: "",
      matricola: "",
      bar: comp.bar || kit.bar,
      matricolaLucca: calcolaMatricolaAuto(comp.tipo, comp.bar || kit.bar, kits),
      dataInizioServizio: new Date().toISOString().split("T")[0],
      dataRevisione: "",
      note: "",
    });
    setDestinazione("fuori_uso");
    setNoteUscita("");
    setModalIndex(i);
  }

  function handleNuovoChange(field, value) {
    setNuovoComp(p => {
      const updated = { ...p, [field]: value };
      if (field === "tipo" || field === "bar") {
        const tipo = field === "tipo" ? value : p.tipo;
        const bar = field === "bar" ? Number(value) : Number(p.bar);
        updated.matricolaLucca = calcolaMatricolaAuto(tipo, bar, kits);
      }
      return updated;
    });
  }

  async function handleSostituisci() {
    if (!nuovoComp.matricola && !nuovoComp.matricolaLucca) {
      alert("Inserisci almeno la matricola costruttore o la matricola Lucca.");
      return;
    }
    setSaving(true);
    try {
      await sostituisciComponente(kit.id, modalIndex, nuovoComp, destinazione, noteUscita);
      await reload();
      setModalIndex(null);
      getStoricoKit(kit.id).then(setStorico);
    } catch (e) {
      alert("Errore durante la sostituzione: " + e.message);
    }
    setSaving(false);
  }

  const cuscini  = kit.componenti?.filter(c => c.tipo.startsWith("CUSCINO")) || [];
  const centraline = kit.componenti?.filter(c => c.tipo === "CENTRALINA") || [];
  const riduttori = kit.componenti?.filter(c => c.tipo === "RIDUTTORE") || [];
  const tubi    = kit.componenti?.filter(c => c.tipo.startsWith("TUBO")) || [];
  const valvole  = kit.componenti?.filter(c => c.tipo === "RUB. VALVOLARE") || [];

  function GruppoComp({ titolo, items }) {
    if (!items.length) return null;
    const allComps = kit.componenti || [];
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
          {titolo} ({items.length})
        </div>
        <div className="comp-list">
          {items.map((c) => {
            const realIndex = allComps.indexOf(c);
            return (
              <div key={realIndex} className="comp-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span className="comp-tipo">{c.tipo}</span>
                      {c.note && (
                        <span style={{ fontSize: 10, background: "#fcebeb", color: "#a32d2d", padding: "2px 7px", borderRadius: 10, fontWeight: 600 }}>
                          {c.note}
                        </span>
                      )}
                    </div>
                    <div className="comp-modello" style={{ marginTop: 2 }}>{c.modello || "—"}</div>
                    {c.dataInizioServizio && (
                      <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                        In servizio dal: {formatData(c.dataInizioServizio)}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", minWidth: 160 }}>
                    {c.matricolaLucca && (
                      <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#185fa5", background: "#e6f1fb", padding: "3px 10px", borderRadius: 6, display: "inline-block", marginBottom: 4 }}>
                        {c.matricolaLucca}
                      </div>
                    )}
                    <div className="comp-matricola">{c.matricola || "—"}</div>
                    <div style={{ fontSize: 10, color: "#888" }}>{c.bar} bar</div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: 11, padding: "4px 12px", color: "#854f0b", borderColor: "#fac775", background: "#faeeda" }}
                    onClick={() => apriModal(realIndex)}
                  >
                    ⇄ Sostituisci componente
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={() => navigate("/kit")}>← Indietro</button>
          <h1 className="page-title">Kit {kit.numero} — {kit.nome}</h1>
          <span className={`pill ${stato}`}>{statoLabel(stato)}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to={`/kit/${kit.id}/modifica`} className="btn btn-secondary">Modifica</Link>
          <button className="btn btn-danger" onClick={handleDelete}>Elimina</button>
        </div>
      </div>

      {stato === "scaduto" && (
        <div className="alert-banner" style={{ marginBottom: 16 }}>
          ⚠ Questo kit è scaduto da {Math.abs(giorni)} giorni — revisione richiesta urgentemente
        </div>
      )}
      {stato === "critico" && (
        <div className="alert-banner" style={{ background: "#faeeda", borderColor: "#fac775", color: "#854f0b", marginBottom: 16 }}>
          ⏱ Questo kit scade tra {giorni} giorni — pianifica la revisione
        </div>
      )}

      <div className="two-col" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Informazioni kit</span></div>
          <table style={{ width: "100%" }}>
            <tbody>
              {[
                ["Numero kit", kit.numero],
                ["Nome / Mezzo", kit.nome],
                ["Targa", kit.mezzo],
                ["Tipo mezzo", kit.tipoMezzo || "—"],
                ["Pressione", `${kit.bar} bar`],
                ["Anno acquisto", kit.annoAcquisto],
                ["Data acquisto", formatData(kit.dataAcquisto)],
                ["Dislocazione", kit.dislocazione || "—"],
                ["Ultima revisione", formatData(kit.dataRevisione)],
                ["Scade tra", giorni !== null ? (giorni < 0 ? `SCADUTO (${Math.abs(giorni)}gg fa)` : `${giorni} giorni`) : "N/D"],
                ["Totale componenti", kit.componenti?.length || 0],
              ].map(([label, val]) => (
                <tr key={label}>
                  <td style={{ color: "#888", fontSize: 12, width: "42%", padding: "7px 0", borderBottom: "1px solid #f0f2f5" }}>{label}</td>
                  <td style={{ fontWeight: 500, fontSize: 13, padding: "7px 0", borderBottom: "1px solid #f0f2f5" }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Componenti ({kit.componenti?.length || 0})</span>
            <span style={{ fontSize: 11, color: "#888" }}>Matricola Lucca in blu</span>
          </div>
          <GruppoComp titolo="Cuscini" items={cuscini} />
          <GruppoComp titolo="Centralina" items={centraline} />
          <GruppoComp titolo="Riduttore" items={riduttori} />
          <GruppoComp titolo="Tubi" items={tubi} />
          <GruppoComp titolo="Rubinetti valvolari" items={valvole} />
        </div>
      </div>

      {/* STORICO SOSTITUZIONI */}
      {storico.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">Storico sostituzioni ({storico.length})</span>
            <button className="card-action" onClick={() => setShowStorico(s => !s)}>
              {showStorico ? "Nascondi" : "Mostra"}
            </button>
          </div>
          {showStorico && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Componente sostituito</th>
                    <th>Matr. Lucca uscente</th>
                    <th>Destinazione</th>
                    <th>Nuovo componente</th>
                    <th>Matr. Lucca entrante</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {storico.map(s => (
                    <tr key={s.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{formatData(s.dataOperazione)}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{s.componenteUscente?.tipo}</div>
                        <div style={{ fontSize: 11, color: "#888" }}>{s.componenteUscente?.modello}</div>
                        <div className="mono">{s.componenteUscente?.matricola}</div>
                      </td>
                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#888", background: "#f1efe8", padding: "2px 8px", borderRadius: 4 }}>
                          {s.componenteUscente?.matricolaLucca || "—"}
                        </span>
                      </td>
                      <td>
                        {s.componenteUscente?.destinazione && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 10, ...DEST_COLOR[s.componenteUscente.destinazione] }}>
                            {DEST_LABEL[s.componenteUscente.destinazione]}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{s.componenteEntrante?.tipo}</div>
                        <div style={{ fontSize: 11, color: "#888" }}>{s.componenteEntrante?.modello}</div>
                        <div className="mono">{s.componenteEntrante?.matricola}</div>
                      </td>
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: "#185fa5", background: "#e6f1fb", padding: "2px 8px", borderRadius: 4 }}>
                          {s.componenteEntrante?.matricolaLucca || "—"}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: "#888" }}>{s.componenteUscente?.noteUscita || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL SOSTITUZIONE */}
      {modalIndex !== null && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 16,
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 28,
            width: "100%", maxWidth: 620, maxHeight: "90vh",
            overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1a2b3c" }}>
                Sostituisci componente
              </h2>
              <button onClick={() => setModalIndex(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>✕</button>
            </div>

            {/* COMPONENTE USCENTE */}
            <div style={{ background: "#faeeda", border: "1px solid #fac775", borderRadius: 10, padding: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#854f0b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Componente uscente
              </div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{kit.componenti[modalIndex]?.tipo}</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{kit.componenti[modalIndex]?.modello || "—"}</div>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#854f0b", marginTop: 4 }}>
                Matr. Lucca: {kit.componenti[modalIndex]?.matricolaLucca || "—"}
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#888", marginTop: 2 }}>
                Matr. costruttore: {kit.componenti[modalIndex]?.matricola || "—"}
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#854f0b", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Destinazione componente uscente
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Object.entries(DEST_LABEL).map(([val, label]) => (
                    <button key={val} type="button"
                      onClick={() => setDestinazione(val)}
                      style={{
                        padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", border: "2px solid",
                        borderColor: destinazione === val ? DEST_COLOR[val].color : "#ddd",
                        background: destinazione === val ? DEST_COLOR[val].bg : "#fff",
                        color: destinazione === val ? DEST_COLOR[val].color : "#888",
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#854f0b", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Note uscita</label>
                <input value={noteUscita} onChange={e => setNoteUscita(e.target.value)}
                  placeholder="es. Guasto, lacerazione, pressione insufficiente..."
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #fac775", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} />
              </div>
            </div>

            {/* NUOVO COMPONENTE */}
            <div style={{ background: "#eaf3de", border: "1px solid #c0dd97", borderRadius: 10, padding: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#3b6d11", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                Nuovo componente entrante
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="form-group">
                  <label>Tipo</label>
                  <select value={nuovoComp.tipo} onChange={e => handleNuovoChange("tipo", e.target.value)}>
                    {TIPI_COMP.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Bar</label>
                  <select value={nuovoComp.bar} onChange={e => handleNuovoChange("bar", Number(e.target.value))}>
                    <option value={8}>8 bar</option>
                    <option value={10}>10 bar</option>
                    <option value={12}>12 bar</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Modello</label>
                  <input value={nuovoComp.modello} onChange={e => handleNuovoChange("modello", e.target.value)} placeholder="es. VETTER ARAMIDE V20" />
                </div>
                <div className="form-group">
                  <label>Matricola costruttore</label>
                  <input value={nuovoComp.matricola} onChange={e => handleNuovoChange("matricola", e.target.value)} placeholder="es. 11210197" />
                </div>
                <div className="form-group">
                  <label style={{ color: "#185fa5" }}>Matricola Lucca (auto)</label>
                  <input value={nuovoComp.matricolaLucca} onChange={e => handleNuovoChange("matricolaLucca", e.target.value)}
                    style={{ fontFamily: "monospace", fontWeight: 700, color: "#185fa5", borderColor: "#b5d4f4", background: "#f0f7ff" }} />
                </div>
                <div className="form-group">
                  <label>Data inizio servizio</label>
                  <input type="date" value={nuovoComp.dataInizioServizio} onChange={e => handleNuovoChange("dataInizioServizio", e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Data revisione componente</label>
                  <input type="date" value={nuovoComp.dataRevisione} onChange={e => handleNuovoChange("dataRevisione", e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Note</label>
                  <input value={nuovoComp.note} onChange={e => handleNuovoChange("note", e.target.value)} placeholder="Note aggiuntive..." />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setModalIndex(null)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleSostituisci} disabled={saving}>
                {saving ? "Salvataggio..." : "Conferma sostituzione"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}