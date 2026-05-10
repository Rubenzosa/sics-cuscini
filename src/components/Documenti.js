import React, { useState, useEffect, useRef } from "react";
import { uploadDocumento, getDocumentiKit, deleteDocumento } from "../firebase/service";

const TIPI_DOC = [
  "Fattura revisione","Verbale collaudo","Certificato revisione",
  "Rapporto tecnico","Foto componente","Documento trasporto","Altro",
];

const MIME_ICONE = {
  "application/pdf":  { icon:"📄", color:"#e24b4a" },
  "image/jpeg":       { icon:"🖼",  color:"#378add" },
  "image/png":        { icon:"🖼",  color:"#378add" },
  "image/webp":       { icon:"🖼",  color:"#378add" },
  default:            { icon:"📎",  color:"#888" },
};

function fmtSize(b) {
  if (!b) return "";
  if (b < 1024)      return `${b} B`;
  if (b < 1048576)   return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}

function fmtData(d) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("it-IT",{day:"2-digit",month:"2-digit",year:"numeric"}); }
  catch(e) { return d; }
}

export default function Documenti({ kitId, kitNome, sistema }) {
  const [docs, setDocs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ tipoDoc:"Fattura revisione", anno:new Date().getFullYear(), note:"" });
  const [file, setFile]           = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const inputRef                  = useRef(null);

  useEffect(() => { carica(); }, [kitId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function carica() {
    setLoading(true);
    const d = await getDocumentiKit(kitId);
    setDocs(d);
    setLoading(false);
  }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setShowForm(true); }
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (f) { setFile(f); setShowForm(true); }
  }

  async function handleUpload() {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("File troppo grande. Max 10MB."); return; }
    setUploading(true); setProgress(0);
    try {
      await uploadDocumento(file, { kitId, kitNome, sistema,
        tipoDoc:form.tipoDoc, anno:form.anno, note:form.note,
        onProgress: p => setProgress(p) });
      await carica();
      setShowForm(false); setFile(null);
      setForm({ tipoDoc:"Fattura revisione", anno:new Date().getFullYear(), note:"" });
    } catch(e) { alert("Errore upload: " + e.message); }
    setUploading(false);
  }

  async function handleDelete(d) {
    if (!window.confirm(`Eliminare "${d.tipoDoc}"?`)) return;
    await deleteDocumento(d.id, d.path);
    await carica();
  }

  const perAnno = {};
  docs.forEach(d => {
    const a = d.anno || "N/D";
    if (!perAnno[a]) perAnno[a] = [];
    perAnno[a].push(d);
  });
  const anni = Object.keys(perAnno).sort((a,b) => b-a);

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !showForm && inputRef.current?.click()}
        style={{
          border:`2px dashed ${dragOver?"var(--accent)":"var(--border2)"}`,
          borderRadius:"var(--radius-sm)", padding:"22px 20px",
          textAlign:"center", cursor:"pointer",
          background:dragOver?"var(--blue-bg)":"var(--bg3)",
          marginBottom:14, transition:"all .2s",
        }}>
        <div style={{ fontSize:26, marginBottom:6 }}>📎</div>
        <div style={{ fontSize:13, fontWeight:600, color:"var(--text2)" }}>
          Trascina un file oppure clicca per selezionare
        </div>
        <div style={{ fontSize:11, color:"var(--text3)", marginTop:3 }}>
          PDF · JPG · PNG · DOCX — max 10MB
        </div>
        <input ref={inputRef} type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
          style={{ display:"none" }} onChange={handleFileChange}/>
      </div>

      {/* Form metadati */}
      {showForm && file && (
        <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:14, marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>
            <span style={{ color:"var(--accent)" }}>{file.name}</span>
            <span style={{ color:"var(--text3)", marginLeft:8 }}>({fmtSize(file.size)})</span>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Tipo documento</label>
              <select value={form.tipoDoc} onChange={e => setForm(p=>({...p,tipoDoc:e.target.value}))}>
                {TIPI_DOC.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Anno documento</label>
              <select value={form.anno} onChange={e => setForm(p=>({...p,anno:Number(e.target.value)}))}>
                {[2024,2025,2026,2027,2028].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn:"1/-1" }}>
              <label>Note</label>
              <input value={form.note} onChange={e => setForm(p=>({...p,note:e.target.value}))}
                placeholder="es. Fattura n. 1234, revisione annuale..."/>
            </div>
          </div>

          {uploading && (
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:"var(--text3)", marginBottom:4 }}>Caricamento... {progress}%</div>
              <div style={{ height:6, background:"var(--border)", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${progress}%`, background:"var(--accent)", borderRadius:3, transition:"width .3s" }}/>
              </div>
            </div>
          )}

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
            <div style={{ fontSize:11, color:"var(--text3)" }}>
              📁 <strong>DOCUMENTI {form.anno}</strong> / {sistema==="taglio"?"Gruppi Taglio":"Cuscini"}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn btn-secondary" onClick={() => { setShowForm(false); setFile(null); }} disabled={uploading}>Annulla</button>
              <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
                {uploading ? "Caricamento..." : "Carica"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ color:"var(--text3)", fontSize:13, textAlign:"center", padding:20 }}>Caricamento...</div>
      ) : !docs.length ? (
        <div style={{ color:"var(--text3)", fontSize:13, textAlign:"center", padding:16 }}>Nessun documento allegato</div>
      ) : (
        anni.map(anno => (
          <div key={anno} style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>
              📁 DOCUMENTI {anno} ({perAnno[anno].length})
            </div>
            {perAnno[anno].map(d => {
              const ico = MIME_ICONE[d.mimeType] || MIME_ICONE.default;
              return (
                <div key={d.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", marginBottom:6 }}>
                  <div style={{ fontSize:20, flexShrink:0 }}>{ico.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:"var(--text)" }}>{d.tipoDoc}</div>
                    <div style={{ fontSize:11, color:"var(--text3)", marginTop:2 }}>
                      {fmtData(d.dataCaricamento)}{d.dimensione?` · ${fmtSize(d.dimensione)}`:""}{d.note?` · ${d.note}`:""}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <a href={d.url} target="_blank" rel="noreferrer"
                      className="btn btn-secondary" style={{ fontSize:11, padding:"4px 10px" }}>
                      Apri
                    </a>
                    <button className="btn btn-danger"
                      style={{ fontSize:11, padding:"4px 10px" }}
                      onClick={() => handleDelete(d)}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}