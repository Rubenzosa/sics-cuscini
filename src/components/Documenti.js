/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { getDocumentiKit, deleteDocumento } from "../firebase/service";

const MIME_ICONE = {
  "application/pdf": "📄",
  "image/jpeg":      "🖼",
  "image/png":       "🖼",
  "image/webp":      "🖼",
  default:           "📎",
};

function fmtSize(b) {
  if (!b) return "";
  if (b < 1024)    return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}

function fmtData(d) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("it-IT",{day:"2-digit",month:"2-digit",year:"numeric"}); }
  catch(e) { return d; }
}

export default function Documenti({ kitId, kitNome, sistema }) {
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { carica(); }, [kitId]);

  async function carica() {
    setLoading(true);
    const d = await getDocumentiKit(kitId);
    setDocs(d);
    setLoading(false);
  }

  async function handleDelete(d) {
    if (!window.confirm(`Eliminare "${d.tipoDoc || d.nomeFile}"?`)) return;
    await deleteDocumento(d.id);
    await carica();
  }

  // Raggruppa per anno
  const perAnno = {};
  docs.forEach(d => {
    const a = d.anno || "N/D";
    if (!perAnno[a]) perAnno[a] = [];
    perAnno[a].push(d);
  });
  const anni = Object.keys(perAnno).sort((a,b) => b - a);

  return (
    <div>
      {/* Info caricamento */}
      <div style={{
        background:"var(--blue-bg)", border:"1px solid #b5d4f4",
        borderRadius:"var(--radius-sm)", padding:"12px 16px",
        marginBottom:16, fontSize:13,
      }}>
        <div style={{ fontWeight:700, color:"var(--blue-text)", marginBottom:4 }}>
          📁 I documenti vengono caricati tramite Google Sheets
        </div>
        <div style={{ color:"var(--text2)", fontSize:12 }}>
          Apri il foglio Google → SICS — VVF Siena → Apri Dashboard → scheda kit → tab Documenti → carica il file.
          Verrà salvato automaticamente in <strong>Google Drive / DOCUMENTI {new Date().getFullYear()} / {sistema === "taglio" ? "Gruppi Taglio" : "Cuscini"}</strong>.
        </div>
      </div>

      {loading ? (
        <div style={{ color:"var(--text3)", fontSize:13, textAlign:"center", padding:20 }}>
          Caricamento...
        </div>
      ) : !docs.length ? (
        <div style={{ color:"var(--text3)", fontSize:13, textAlign:"center", padding:24 }}>
          Nessun documento allegato
        </div>
      ) : (
        anni.map(anno => (
          <div key={anno} style={{ marginBottom:14 }}>
            <div style={{
              fontSize:11, fontWeight:800, color:"var(--text3)",
              textTransform:"uppercase", letterSpacing:".06em", marginBottom:8
            }}>
              📁 DOCUMENTI {anno} ({perAnno[anno].length})
            </div>
            {perAnno[anno].map(d => {
              const ico = MIME_ICONE[d.mimeType] || MIME_ICONE.default;
              return (
                <div key={d.id} style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"10px 14px", background:"var(--bg3)",
                  border:"1px solid var(--border)",
                  borderRadius:"var(--radius-sm)", marginBottom:6,
                }}>
                  <div style={{ fontSize:20, flexShrink:0 }}>{ico}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:"var(--text)" }}>
                      {d.tipoDoc || "Documento"}
                    </div>
                    <div style={{ fontSize:11, color:"var(--text3)", marginTop:2 }}>
                      {fmtData(d.dataCaricamento)}
                      {d.dimensione ? ` · ${fmtSize(d.dimensione)}` : ""}
                      {d.note ? ` · ${d.note}` : ""}
                    </div>
                    {d.nomeFile && (
                      <div style={{ fontSize:10, color:"var(--text3)", fontFamily:"monospace", marginTop:2,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {d.nomeFile}
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    {d.driveUrl && (
                      <a href={d.driveUrl} target="_blank" rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ fontSize:11, padding:"4px 10px" }}>
                        Drive
                      </a>
                    )}
                    <button className="btn btn-danger"
                      style={{ fontSize:11, padding:"4px 10px" }}
                      onClick={() => handleDelete(d)}>
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
  );
}