/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { saveKit, getAllKits } from "../firebase/service";
import { PROSSIMI_SERIALI, buildMatricolaLucca } from "../data/kitData";

const DISLOCAZIONI = ["Sede Centrale","Magazzino","Montepulciano","Montalcino","Poggibonsi","Piancastagnaio"];
const TIPI_COMP = [
  "CUSCINO 30X30","CUSCINO 35X35","CUSCINO 37X37","CUSCINO 38X38",
  "CUSCINO 40X40","CUSCINO 45X45","CUSCINO 47X52","CUSCINO 48X58",
  "CUSCINO 50X50","CUSCINO 55X55","CUSCINO 60X60","CUSCINO 65X65",
  "CUSCINO 100X32","CENTRALINA","RIDUTTORE","TUBO","TUBO 2MT",
  "TUBO 5MT","RUB. VALVOLARE"
];

function calcolaMatricolaLucca(tipo, bar, tuttiKits) {
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
  tuttiKits.forEach(kit => {
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

function emptyComp(kitBar, tuttiKits) {
  const tipo = "CUSCINO 45X45";
  const bar  = kitBar || 8;
  return {
    tipo, modello: "", matricola: "",
    bar, matricolaLucca: calcolaMatricolaLucca(tipo, bar, tuttiKits),
    dataInizioServizio: new Date().toISOString().split("T")[0],
    dataRevisione: "", note: ""
  };
}

// ── MODAL AGGIUNGI / MODIFICA COMPONENTE ────────────────────
function ModalComponente({ comp, onSave, onClose, tuttiKits, kitBar, editIndex }) {
  const [c, setC] = useState(comp);

  function handleChange(field, value) {
    setC(prev => {
      const updated = { ...prev, [field]: value };
      if (field === "tipo" || field === "bar") {
        const tipo = field === "tipo" ? value : prev.tipo;
        const bar  = field === "bar"  ? Number(value) : Number(prev.bar);
        updated.matricolaLucca = calcolaMatricolaLucca(tipo, bar, tuttiKits);
      }
      return updated;
    });
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <span className="modal-title">
            {editIndex !== null ? "Modifica componente" : "Aggiungi componente"}
          </span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Info matricola Lucca */}
        <div className="section-blue" style={{ marginBottom: 16 }}>
          <div className="section-label blue">Matricola Lucca — assegnazione automatica</div>
          <div style={{ fontSize: 12, color: "var(--blue-text)" }}>
            Prossimi disponibili: CS8·{PROSSIMI_SERIALI.CS_8} CS10·{PROSSIMI_SERIALI.CS_10} CS12·{PROSSIMI_SERIALI.CS_12} CN8·{PROSSIMI_SERIALI.CN_8} RP8·{PROSSIMI_SERIALI.RP_8} TB8·{PROSSIMI_SERIALI.TB_8} RV8·{PROSSIMI_SERIALI.RV_8}
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Tipo componente</label>
            <select value={c.tipo} onChange={e => handleChange("tipo", e.target.value)}>
              {TIPI_COMP.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Pressione (bar)</label>
            <select value={c.bar} onChange={e => handleChange("bar", Number(e.target.value))}>
              <option value={8}>8 bar</option>
              <option value={10}>10 bar</option>
              <option value={12}>12 bar</option>
            </select>
          </div>
          <div className="form-group">
            <label>Modello</label>
            <input
              value={c.modello}
              onChange={e => handleChange("modello", e.target.value)}
              placeholder="es. MAXIFORCE KPI-32"
            />
          </div>
          <div className="form-group">
            <label>Matricola costruttore</label>
            <input
              value={c.matricola}
              onChange={e => handleChange("matricola", e.target.value)}
              placeholder="es. 18038876"
            />
          </div>
          <div className="form-group">
            <label style={{ color: "var(--blue-text)" }}>Matricola Lucca (auto)</label>
            <input
              value={c.matricolaLucca || ""}
              onChange={e => handleChange("matricolaLucca", e.target.value)}
              style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--blue-text)", borderColor: "#b5d4f4", background: "var(--blue-bg)" }}
              placeholder="es. CS 8 SI 32"
            />
          </div>
          <div className="form-group">
            <label>Data inizio servizio</label>
            <input
              type="date"
              value={c.dataInizioServizio || ""}
              onChange={e => handleChange("dataInizioServizio", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Data revisione componente</label>
            <input
              type="date"
              value={c.dataRevisione || ""}
              onChange={e => handleChange("dataRevisione", e.target.value)}
            />
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label>Note</label>
            <input
              value={c.note || ""}
              onChange={e => handleChange("note", e.target.value)}
              placeholder="es. Fuori servizio, danneggiato..."
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button className="btn btn-secondary" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={() => onSave(c)}>
            {editIndex !== null ? "Salva modifiche" : "Aggiungi componente"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN FORM ───────────────────────────────────────────────
export default function KitForm({ kits, reload }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = kits?.find(k => k.id === id);
  const [tuttiKits, setTuttiKits] = useState(kits || []);
  const [form, setForm] = useState({
    numero: "", nome: "", mezzo: "", tipoMezzo: "",
    bar: 8, annoAcquisto: new Date().getFullYear(),
    dataAcquisto: "", dataRevisione: "",
    stato: "attivo", dislocazione: "Sede Centrale", componenti: [],
  });
  const [saving, setSaving]         = useState(false);
  const [modalComp, setModalComp]   = useState(null);  // { comp, editIndex }

  useEffect(() => {
    getAllKits().then(k => setTuttiKits(k));
    if (existing) setForm({ ...existing });
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  // Apre modal per aggiungere
  function apriAggiungi() {
    setModalComp({ comp: emptyComp(Number(form.bar), tuttiKits), editIndex: null });
  }

  // Apre modal per modificare
  function apriModifica(i) {
    setModalComp({ comp: { ...form.componenti[i] }, editIndex: i });
  }

  // Salva dal modal
  function salvaComponente(nuovoComp) {
    if (modalComp.editIndex !== null) {
      setForm(f => {
        const comps = [...f.componenti];
        comps[modalComp.editIndex] = nuovoComp;
        return { ...f, componenti: comps };
      });
    } else {
      setForm(f => ({ ...f, componenti: [...(f.componenti || []), nuovoComp] }));
    }
    setModalComp(null);
  }

  function removeComp(i) {
    if (!window.confirm("Rimuovere questo componente?")) return;
    setForm(f => ({ ...f, componenti: f.componenti.filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const kitId = existing ? existing.id : `kit-${form.numero}`;
    await saveKit({
      id: kitId, ...form,
      numero: Number(form.numero),
      bar: Number(form.bar),
      annoAcquisto: Number(form.annoAcquisto)
    });
    await reload();
    navigate(`/kit/${kitId}`);
  }

  // Raggruppa componenti per tipo
  const gruppi = [
    { label: "Cuscini",           items: (form.componenti||[]).filter(c => c.tipo?.startsWith("CUSCINO")) },
    { label: "Centralina",        items: (form.componenti||[]).filter(c => c.tipo === "CENTRALINA") },
    { label: "Riduttore",         items: (form.componenti||[]).filter(c => c.tipo === "RIDUTTORE") },
    { label: "Tubi",              items: (form.componenti||[]).filter(c => c.tipo?.startsWith("TUBO")) },
    { label: "Rub. valvolari",    items: (form.componenti||[]).filter(c => c.tipo === "RUB. VALVOLARE") },
  ].filter(g => g.items.length > 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          {existing ? `Modifica Kit ${existing.numero}` : "Nuovo Kit"}
        </h1>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Annulla</button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── DATI PRINCIPALI ── */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">Dati principali</span></div>
          <div className="form-grid">
            <div className="form-group">
              <label>Numero kit</label>
              <input name="numero" type="number" value={form.numero} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Nome / Descrizione</label>
              <input name="nome" value={form.nome} onChange={handleChange} required placeholder="es. APS 120" />
            </div>
            <div className="form-group">
              <label>Targa mezzo</label>
              <input name="mezzo" value={form.mezzo} onChange={handleChange} placeholder="es. VF 29453" />
            </div>
            <div className="form-group">
              <label>Tipo mezzo</label>
              <input name="tipoMezzo" value={form.tipoMezzo} onChange={handleChange} placeholder="es. APS 120" />
            </div>
            <div className="form-group">
              <label>Pressione kit (bar)</label>
              <select name="bar" value={form.bar} onChange={handleChange}>
                <option value={8}>8 bar</option>
                <option value={10}>10 bar</option>
                <option value={12}>12 bar</option>
              </select>
            </div>
            <div className="form-group">
              <label>Anno acquisto</label>
              <input name="annoAcquisto" type="number" value={form.annoAcquisto} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Data acquisto</label>
              <input name="dataAcquisto" type="date" value={form.dataAcquisto || ""} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Data ultima revisione</label>
              <input name="dataRevisione" type="date" value={form.dataRevisione || ""} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Stato</label>
              <select name="stato" value={form.stato} onChange={handleChange}>
                <option value="attivo">Attivo</option>
                <option value="magazzino">Magazzino</option>
                <option value="fuori_servizio">Fuori servizio</option>
              </select>
            </div>
            <div className="form-group">
              <label>Dislocazione</label>
              <select name="dislocazione" value={form.dislocazione} onChange={handleChange}>
                {DISLOCAZIONI.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── COMPONENTI ── */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">
              Componenti ({(form.componenti || []).length})
            </span>
            <button type="button" className="btn btn-primary" style={{ fontSize: 13 }} onClick={apriAggiungi}>
              + Aggiungi componente
            </button>
          </div>

          {!(form.componenti || []).length ? (
            <div
              onClick={apriAggiungi}
              style={{
                textAlign: "center", padding: "32px 20px",
                color: "var(--text3)", fontSize: 13,
                border: "2px dashed var(--border)", borderRadius: "var(--radius-sm)",
                cursor: "pointer", transition: "border-color .15s",
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>＋</div>
              <div>Clicca per aggiungere il primo componente</div>
            </div>
          ) : (
            gruppi.map(({ label, items }) => (
              <div key={label} style={{ marginBottom: 18 }}>
                <div style={{
                  fontSize: 11, fontWeight: 800, color: "var(--text3)",
                  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8
                }}>
                  {label} ({items.length})
                </div>
                {items.map(c => {
                  const realIndex = (form.componenti || []).indexOf(c);
                  return (
                    <div key={realIndex} style={{
                      background: "var(--bg3)", border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)", padding: "12px 14px",
                      marginBottom: 8, display: "flex",
                      justifyContent: "space-between", alignItems: "center",
                      gap: 10,
                    }}>
                      {/* Info componente */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{c.tipo}</div>
                        <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{c.modello || "—"}</div>
                        {c.matricolaLucca && (
                          <div style={{
                            fontFamily: "monospace", fontWeight: 800, fontSize: 12,
                            color: "var(--blue-text)", background: "var(--blue-bg)",
                            padding: "2px 8px", borderRadius: 4, display: "inline-block", marginTop: 4
                          }}>
                            {c.matricolaLucca}
                          </div>
                        )}
                        {c.matricola && (
                          <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "monospace", marginTop: 2 }}>
                            {c.matricola}
                          </div>
                        )}
                        {c.note && (
                          <div style={{
                            fontSize: 10, background: "var(--red-bg)", color: "var(--red-text)",
                            padding: "2px 7px", borderRadius: 10, display: "inline-block", marginTop: 4, fontWeight: 700
                          }}>
                            {c.note}
                          </div>
                        )}
                      </div>

                      {/* Azioni */}
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: 12, padding: "5px 12px" }}
                          onClick={() => apriModifica(realIndex)}
                        >
                          ✏ Modifica
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ fontSize: 12, padding: "5px 10px" }}
                          onClick={() => removeComp(realIndex)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* ── SALVA ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingBottom: 32 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Annulla</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Salvataggio..." : existing ? "Salva modifiche" : "Crea kit"}
          </button>
        </div>
      </form>

      {/* ── MODAL AGGIUNGI/MODIFICA COMPONENTE ── */}
      {modalComp && (
        <ModalComponente
          comp={modalComp.comp}
          editIndex={modalComp.editIndex}
          tuttiKits={tuttiKits}
          kitBar={Number(form.bar)}
          onSave={salvaComponente}
          onClose={() => setModalComp(null)}
        />
      )}
    </div>
  );
}