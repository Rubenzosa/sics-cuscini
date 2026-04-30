import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { saveKit } from "../firebase/service";

const DISLOCAZIONI = ["Sede Centrale", "Magazzino", "Montepulciano", "Montalcino", "Poggibonsi", "Piancastagnaio"];
const TIPI_COMP = ["CUSCINO 30X30","CUSCINO 35X35","CUSCINO 37X37","CUSCINO 38X38","CUSCINO 40X40","CUSCINO 45X45","CUSCINO 47X52","CUSCINO 48X58","CUSCINO 50X50","CUSCINO 55X55","CUSCINO 60X60","CUSCINO 65X65","CUSCINO 100X32","CENTRALINA","RIDUTTORE","TUBO","TUBO 2MT","TUBO 5MT","RUB. VALVOLARE"];

function emptyComp() {
  return { tipo: "CUSCINO 45X45", modello: "", matricola: "", bar: 8, note: "" };
}

export default function KitForm({ kits, reload }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = kits?.find(k => k.id === id);

  const [form, setForm] = useState({
    numero: "",
    nome: "",
    mezzo: "",
    tipoMezzo: "",
    bar: 8,
    annoAcquisto: new Date().getFullYear(),
    dataRevisione: "",
    stato: "attivo",
    dislocazione: "Sede Centrale",
    componenti: [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) setForm({ ...existing });
  }, [existing]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function addComp() {
    setForm(f => ({ ...f, componenti: [...(f.componenti || []), emptyComp()] }));
  }

  function updateComp(i, field, value) {
    setForm(f => {
      const comps = [...f.componenti];
      comps[i] = { ...comps[i], [field]: value };
      return { ...f, componenti: comps };
    });
  }

  function removeComp(i) {
    setForm(f => ({ ...f, componenti: f.componenti.filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const kitId = existing ? existing.id : `kit-${form.numero}`;
    const data = {
      ...form,
      numero: Number(form.numero),
      bar: Number(form.bar),
      annoAcquisto: Number(form.annoAcquisto),
    };
    await saveKit({ id: kitId, ...data });
    await reload();
    navigate(`/kit/${kitId}`);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{existing ? `Modifica Kit ${existing.numero}` : "Nuovo Kit"}</h1>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Annulla</button>
      </div>

      <form onSubmit={handleSubmit}>
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
              <label>Pressione (bar)</label>
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
              <label>Data ultima revisione</label>
              <input name="dataRevisione" type="date" value={form.dataRevisione} onChange={handleChange} />
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

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">Componenti ({form.componenti?.length || 0})</span>
            <button type="button" className="btn btn-secondary" onClick={addComp}>+ Aggiungi componente</button>
          </div>
          <div className="comp-list">
            {(form.componenti || []).map((c, i) => (
              <div key={i} style={{ background: "#f8f9fb", border: "1px solid #e8eaed", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 2fr 1fr auto", gap: 8, alignItems: "end" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Tipo</label>
                    <select value={c.tipo} onChange={e => updateComp(i, "tipo", e.target.value)}>
                      {TIPI_COMP.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Modello</label>
                    <input value={c.modello} onChange={e => updateComp(i, "modello", e.target.value)} placeholder="es. MAXIFORCE KPI-32" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Matricola</label>
                    <input value={c.matricola} onChange={e => updateComp(i, "matricola", e.target.value)} placeholder="es. 12345678" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Bar</label>
                    <select value={c.bar} onChange={e => updateComp(i, "bar", Number(e.target.value))}>
                      <option value={8}>8</option>
                      <option value={10}>10</option>
                      <option value={12}>12</option>
                    </select>
                  </div>
                  <button type="button" onClick={() => removeComp(i)} style={{ background: "#fcebeb", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", color: "#a32d2d", fontSize: 16, alignSelf: "flex-end" }}>✕</button>
                </div>
                <div className="form-group" style={{ marginTop: 8, marginBottom: 0 }}>
                  <label>Note</label>
                  <input value={c.note || ""} onChange={e => updateComp(i, "note", e.target.value)} placeholder="es. Fuori servizio, danneggiato..." />
                </div>
              </div>
            ))}
            {!form.componenti?.length && (
              <p style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 20 }}>
                Nessun componente. Clicca "+ Aggiungi componente" per iniziare.
              </p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Annulla</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Salvataggio..." : existing ? "Salva modifiche" : "Crea kit"}
          </button>
        </div>
      </form>
    </div>
  );
}