import React from "react";
import { useNavigate } from "react-router-dom";

export default function AcquistiPage({ kits, gruppiTaglio }) {
  const navigate = useNavigate();
  const anno = new Date().getFullYear();

  const cusciniDaAcquistare = kits.filter(
    k => k.stato === "fuori_uso" || (k.annoAcquisto && anno - k.annoAcquisto >= 10)
  );
  const taglioDaAcquistare = gruppiTaglio.filter(
    g => g.stato === "fuori_uso" || (g.annoAcquisto && anno - g.annoAcquisto >= 10)
  );

  const totale = cusciniDaAcquistare.length + taglioDaAcquistare.length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          Acquisti necessari{totale > 0 ? ` (${totale})` : ""}
        </h1>
      </div>

      {totale === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:40, color:"var(--text3)", fontSize:14 }}>
          Nessun acquisto necessario al momento.
        </div>
      ) : (
        <>
          {cusciniDaAcquistare.length > 0 && (
            <section style={{ marginBottom:24 }}>
              <div style={{
                fontSize:11, fontWeight:900, textTransform:"uppercase",
                letterSpacing:".08em", color:"var(--cuscini)",
                borderBottom:"2px solid var(--cuscini)",
                paddingBottom:6, marginBottom:12,
              }}>
                Cuscini — da acquistare ({cusciniDaAcquistare.length})
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {cusciniDaAcquistare.map(k => {
                  const isFuoriUso = k.stato === "fuori_uso";
                  const anni = k.annoAcquisto ? anno - k.annoAcquisto : null;
                  return (
                    <div key={k.id} className="card" style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:800, textTransform:"uppercase", color:"var(--text)" }}>
                            Kit {k.numero} — {k.mezzo}
                          </div>
                          <div style={{ fontSize:11, color:"var(--text2)", marginTop:2 }}>
                            {k.dislocazione}{k.bar ? ` · ${k.bar} bar` : ""}
                          </div>
                          <div style={{
                            fontSize:11, fontWeight:700, marginTop:6,
                            color: isFuoriUso ? "var(--red)" : "var(--taglio)",
                          }}>
                            {isFuoriUso ? "Fuori uso" : `${anni} anni di servizio`}
                          </div>
                        </div>
                        <span className="pill fuori_uso" style={isFuoriUso ? {} : { color:"var(--taglio)" }}>
                          {isFuoriUso ? "Fuori uso" : `${anni} anni`}
                        </span>
                      </div>
                      <div style={{ marginTop:10 }}>
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize:11, padding:"5px 12px" }}
                          onClick={() => navigate(`/kit/${k.id}`)}
                        >
                          Dettaglio
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {taglioDaAcquistare.length > 0 && (
            <section style={{ marginBottom:24 }}>
              <div style={{
                fontSize:11, fontWeight:900, textTransform:"uppercase",
                letterSpacing:".08em", color:"var(--taglio)",
                borderBottom:"2px solid var(--taglio)",
                paddingBottom:6, marginBottom:12,
              }}>
                Taglio — da acquistare ({taglioDaAcquistare.length})
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {taglioDaAcquistare.map(g => {
                  const isFuoriUso = g.stato === "fuori_uso";
                  const anni = g.annoAcquisto ? anno - g.annoAcquisto : null;
                  return (
                    <div key={g.id} className="card" style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:800, textTransform:"uppercase", color:"var(--text)" }}>
                            GT {g.numero} — {g.nome}
                          </div>
                          <div style={{ fontSize:11, color:"var(--text2)", marginTop:2 }}>
                            {g.dislocazione}{g.sistema ? ` · ${g.sistema}` : ""}
                          </div>
                          <div style={{
                            fontSize:11, fontWeight:700, marginTop:6,
                            color: isFuoriUso ? "var(--red)" : "var(--taglio)",
                          }}>
                            {isFuoriUso ? "Fuori uso" : `${anni} anni di servizio`}
                          </div>
                        </div>
                        <span className="pill fuori_uso" style={isFuoriUso ? {} : { color:"var(--taglio)" }}>
                          {isFuoriUso ? "Fuori uso" : `${anni} anni`}
                        </span>
                      </div>
                      <div style={{ marginTop:10 }}>
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize:11, padding:"5px 12px" }}
                          onClick={() => navigate(`/gruppi-taglio/${g.id}`)}
                        >
                          Dettaglio
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
