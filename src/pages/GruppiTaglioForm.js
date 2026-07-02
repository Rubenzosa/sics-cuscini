/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { saveGruppoTaglio } from "../firebase/service";

const DISLOCAZIONI = ["Sede Centrale","Magazzino","Montepulciano","Montalcino","Piancastagnaio","Poggibonsi"];
const SISTEMI      = ["oleodinamico","elettrico","misto"];
const MARCHE       = ["HOLMATRO","LUKAS","WEBER","INTERFRON","RESQTEC","ZUMBO","Altro"];
const PRESSIONI    = ["350 BAR","630 BAR","720 BAR"];
const TIPI_COMP    = ["CENTRALINA OLEODINAMICA","CENTRALINA AUSILIARIA","CESOIA","CESOIA ELETTRICA","CESOIA/DIVARICATORE COMBINATI","DIVARICATORE","DIVARICATORE ELETTRICO","PISTONE","PISTONE ELETTRICO","POMPA MANUALE","MORSA DI SOSTEGNO","TUBI","TUBI 10 MT","BATTERIA"];
const OLII         = ["HLP10","HV 15/22","ELETTRICO","OLEODIN 32","ZS32","SKYDROL","HLP 10/32"];
const CANDELE      = ["NGK BR2-LM","NGK CR5HSB","NGK BPM7A","NGK-R BPR6ES","NGK-R BR2-LM","DENSO U16FSR-UB","CHAMPIONS Z9Y",""];

function emptyComp() {
  return { tipo:"CESOIA", modello:"", matricola:"", pressione:"720 BAR", statoComp:"Ottimo", olio:"", candela:"", annoComp:new Date().getFullYear(), ultimaRevisione:"", prossimaRevisione:"", note:"" };
}

function ModalComp({ comp, onSave, onClose, editIndex }) {
  const [c, setC] = useState(comp);
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth:560 }}>
        <div className="modal-header">
          <span className="modal-title">{editIndex!==null?"Modifica componente":"Aggiungi componente"}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-grid">
          <div className="form-group"><label>Tipo</label>
            <select value={c.tipo} onChange={e => setC(p=>({...p,tipo:e.target.value}))}>
              {TIPI_COMP.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Pressione</label>
            <select value={c.pressione} onChange={e => setC(p=>({...p,pressione:e.target.value}))}>
              <option value="">—</option>
              {PRESSIONI.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Modello</label><input value={c.modello} onChange={e=>setC(p=>({...p,modello:e.target.value}))} placeholder="es. HOLMATRO CU 5050"/></div>
          <div className="form-group"><label>Matricola</label><input value={c.matricola} onChange={e=>setC(p=>({...p,matricola:e.target.value}))}/></div>
          <div className="form-group"><label>Anno componente</label><input type="number" value={c.annoComp||""} onChange={e=>setC(p=>({...p,annoComp:Number(e.target.value)}))}/></div>
          <div className="form-group"><label>Stato</label>
            <select value={c.statoComp} onChange={e=>setC(p=>({...p,statoComp:e.target.value}))}>
              {["Ottimo","Buono","Prossimo F.U.","Fuori uso"].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Ultima revisione</label><input type="date" value={c.ultimaRevisione||""} onChange={e=>setC(p=>({...p,ultimaRevisione:e.target.value}))}/></div>
          <div className="form-group"><label>Prossima revisione</label><input type="date" value={c.prossimaRevisione||""} onChange={e=>setC(p=>({...p,prossimaRevisione:e.target.value}))}/></div>
          <div className="form-group"><label>Olio (se centralina)</label>
            <select value={c.olio} onChange={e=>setC(p=>({...p,olio:e.target.value}))}>
              <option value="">—</option>
              {OLII.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Candela (se centralina)</label>
            <select value={c.candela} onChange={e=>setC(p=>({...p,candela:e.target.value}))}>
              {CANDELE.map(ca=><option key={ca} value={ca}>{ca||"—"}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn:"1/-1" }}><label>Note</label><input value={c.note||""} onChange={e=>setC(p=>({...p,note:e.target.value}))}/></div>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
          <button className="btn btn-secondary" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={() => onSave(c)}>{editIndex!==null?"Salva modifiche":"Aggiungi"}</button>
        </div>
      </div>
    </div>
  );
}

export default function GruppiTaglioForm({ gruppi, reload }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = gruppi?.find(g => g.id === id);

  const [form, setForm] = useState({
    numero:"", nome:"", mezzo:"", tipoMezzo:"", dislocazione:"Sede Centrale",
    annoAcquisto: new Date().getFullYear(), sistema:"oleodinamico",
    marca:"LUKAS", stato:"attivo", intervalloRevisioneAnni:"", componenti:[],
  });
  const [saving, setSaving]       = useState(false);
  const [modalComp, setModalComp] = useState(null);

  useEffect(() => { if (existing) setForm({...existing}); }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({...f, [name]: value}));
  }

  function salvaComp(c) {
    if (modalComp.editIndex !== null) {
      setForm(f => { const comps=[...f.componenti]; comps[modalComp.editIndex]=c; return {...f, componenti:comps}; });
    } else {
      setForm(f => ({...f, componenti:[...(f.componenti||[]),c]}));
    }
    setModalComp(null);
  }

  function removeComp(i) {
    if (!window.confirm("Rimuovere questo componente?")) return;
    setForm(f => ({...f, componenti:f.componenti.filter((_,idx)=>idx!==i)}));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const gtId = existing ? existing.id : `gt-${String(form.nome).toLowerCase().replace(/\s+/g,"-")}-${Date.now()}`;
    const intervallo = form.intervalloRevisioneAnni === "" || form.intervalloRevisioneAnni == null ? "" : Number(form.intervalloRevisioneAnni);
    await saveGruppoTaglio({ id:gtId, ...form, annoAcquisto:Number(form.annoAcquisto), intervalloRevisioneAnni:intervallo });
    await reload();
    navigate(`/gruppi-taglio/${gtId}`);
  }

  const GRUPPI_COMP_LABEL = ["CENTRALINA OLEODINAMICA","CENTRALINA AUSILIARIA","CESOIA","CESOIA ELETTRICA","CESOIA/DIVARICATORE COMBINATI","DIVARICATORE","DIVARICATORE ELETTRICO","PISTONE","PISTONE ELETTRICO","POMPA MANUALE","MORSA DI SOSTEGNO","TUBI","TUBI 10 MT"];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{existing?`Modifica — ${existing.nome}`:"Nuovo gruppo da taglio"}</h1>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Annulla</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span className="card-title">Dati principali</span></div>
          <div className="form-grid">
            <div className="form-group"><label>Numero kit</label><input name="numero" value={form.numero} onChange={handleChange} placeholder="es. 18" required/></div>
            <div className="form-group"><label>Nome / Mezzo</label><input name="nome" value={form.nome} onChange={handleChange} placeholder="es. APS ACTROS" required/></div>
            <div className="form-group"><label>Targa</label><input name="mezzo" value={form.mezzo} onChange={handleChange} placeholder="es. VF 24491"/></div>
            <div className="form-group"><label>Tipo mezzo</label><input name="tipoMezzo" value={form.tipoMezzo} onChange={handleChange}/></div>
            <div className="form-group"><label>Sistema</label>
              <select name="sistema" value={form.sistema} onChange={handleChange}>
                {SISTEMI.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Marca principale</label>
              <select name="marca" value={form.marca} onChange={handleChange}>
                {MARCHE.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Anno acquisto</label><input name="annoAcquisto" type="number" value={form.annoAcquisto} onChange={handleChange}/></div>
            <div className="form-group"><label>Revisione ogni (anni)</label><input name="intervalloRevisioneAnni" type="number" min="1" step="1" value={form.intervalloRevisioneAnni} onChange={handleChange} placeholder="es. 3"/></div>
            <div className="form-group"><label>Dislocazione</label>
              <select name="dislocazione" value={form.dislocazione} onChange={handleChange}>
                {DISLOCAZIONI.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Stato</label>
              <select name="stato" value={form.stato} onChange={handleChange}>
                <option value="attivo">Attivo</option>
                <option value="magazzino">Magazzino</option>
                <option value="fuori_servizio">Fuori servizio (provvisorio)</option>
                <option value="fuori_uso">Fuori uso (definitivo)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header">
            <span className="card-title">Componenti ({(form.componenti||[]).length})</span>
            <button type="button" className="btn btn-primary" style={{ fontSize:13 }} onClick={() => setModalComp({comp:emptyComp(),editIndex:null})}>+ Aggiungi</button>
          </div>
          {!(form.componenti||[]).length ? (
            <div onClick={() => setModalComp({comp:emptyComp(),editIndex:null})}
              style={{ textAlign:"center", padding:"28px 20px", color:"var(--text3)", fontSize:13, border:"2px dashed var(--border)", borderRadius:"var(--radius-sm)", cursor:"pointer" }}>
              <div style={{ fontSize:24, marginBottom:6 }}>＋</div>Clicca per aggiungere il primo componente
            </div>
          ) : (
            GRUPPI_COMP_LABEL.map(tipo => {
              const items = (form.componenti||[]).filter(c => c.tipo===tipo);
              if (!items.length) return null;
              return (
                <div key={tipo} style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".05em", marginBottom:6 }}>{tipo} ({items.length})</div>
                  {items.map(c => {
                    const ri = (form.componenti||[]).indexOf(c);
                    return (
                      <div key={ri} style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:"10px 14px", marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13 }}>{c.modello||"—"}</div>
                          <div style={{ fontSize:11, color:"var(--text3)", marginTop:2 }}>{c.pressione}{c.matricola?` · ${c.matricola}`:""}</div>
                          <div style={{ display:"flex", gap:6, marginTop:4 }}>
                            {c.olio&&<span style={{ fontSize:10, padding:"1px 7px", borderRadius:8, background:"var(--green-bg)", color:"var(--green-text)", fontWeight:700 }}>🛢 {c.olio}</span>}
                            {c.candela&&<span style={{ fontSize:10, padding:"1px 7px", borderRadius:8, background:"var(--amber-bg)", color:"var(--amber-text)", fontWeight:700 }}>⚡ {c.candela}</span>}
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:6 }}>
                          <button type="button" className="btn btn-secondary" style={{ fontSize:12, padding:"5px 12px" }} onClick={() => setModalComp({comp:{...c},editIndex:ri})}>✏</button>
                          <button type="button" className="btn btn-danger"    style={{ fontSize:12, padding:"5px 10px" }} onClick={() => removeComp(ri)}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", gap:8, paddingBottom:32 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Annulla</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving?"Salvataggio...":existing?"Salva modifiche":"Crea gruppo"}</button>
        </div>
      </form>

      {modalComp && (
        <ModalComp comp={modalComp.comp} editIndex={modalComp.editIndex}
          onSave={salvaComp} onClose={() => setModalComp(null)} />
      )}
    </div>
  );
}