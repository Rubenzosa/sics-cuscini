import React from "react";
import { useNavigate } from "react-router-dom";
import { calcolaStato, statoLabel, formatData, giorniAllaScadenza } from "../utils";

export default function Scadenze({ kits }) {
  const navigate = useNavigate();

  const ordinati = [...kits]
    .filter(k => k.stato !== "fuori_servizio")
    .sort((a, b) => {
      const ga = giorniAllaScadenza(a.dataRevisione) ?? 99999;
      const gb = giorniAllaScadenza(b.dataRevisione) ?? 99999;
      return ga - gb;
    });

  const scaduti    = ordinati.filter(k => calcolaStato(k) === "scaduto");
  const critici    = ordinati.filter(k => calcolaStato(k) === "critico");
  const attenzione = ordinati.filter(k => calcolaStato(k) === "attenzione");
  const buoni      = ordinati.filter(k => calcolaStato(k) === "buono");
  const regolari   = ordinati.filter(k => calcolaStato(k) === "regolare");
  const altri      = ordinati.filter(k => calcolaStato(k) === "magazzino");

  function Gruppo({ titolo, sottotitolo, items, colore, borderColor }) {
    if (!items.length) return null;
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: colore, flexShrink: 0, marginTop: 2 }}/>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2b3c" }}>{titolo}</span>
            {sottotitolo && <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>{sottotitolo}</span>}
            <span style={{ fontSize: 12, color: "#888", marginLeft: 6 }}>— {items.length} {items.length === 1 ? "kit" : "kit"}</span>
          </div>
        </div>
        <div className="card" style={{ borderLeft: `4px solid ${colore}`, borderRadius: "0 12px 12px 0" }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Kit</th>
                  <th>Nome</th>
                  <th>Mezzo</th>
                  <th>Bar</th>
                  <th>Dislocazione</th>
                  <th>Data revisione</th>
                  <th>Giorni</th>
                  <th>Stato</th>
                </tr>
              </thead>
              <tbody>
                {items.map(kit => {
                  const stato = calcolaStato(kit);
                  const giorni = giorniAllaScadenza(kit.dataRevisione);
                  return (
                    <tr key={kit.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/kit/${kit.id}`)}>
                      <td><strong>{kit.numero}</strong></td>
                      <td style={{ fontWeight: 500 }}>{kit.nome}</td>
                      <td className="mono">{kit.mezzo}</td>
                      <td>{kit.bar} bar</td>
                      <td>{kit.dislocazione || "—"}</td>
                      <td>{formatData(kit.dataRevisione)}</td>
                      <td>
                        {giorni === null ? "N/D" :
                          giorni < 0
                            ? <span style={{ color: "#e24b4a", fontWeight: 700 }}>-{Math.abs(giorni)}gg</span>
                            : <span style={{ color: colore, fontWeight: 600 }}>{giorni}gg</span>
                        }
                      </td>
                      <td><span className={`pill ${stato}`}>{statoLabel(stato)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const totaleProblemi = scaduti.length + critici.length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Scadenze revisioni</h1>
      </div>

      <div className="stats-row" style={{ marginBottom: 28 }}>
        <div className="stat-card" style={{ borderTop: "3px solid #e24b4a" }}>
          <div className="stat-label">Scaduti</div>
          <div className="stat-num red">{scaduti.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop: "3px solid #e24b4a" }}>
          <div className="stat-label">Entro 3 mesi</div>
          <div className="stat-num red">{critici.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop: "3px solid #ba7517" }}>
          <div className="stat-label">Scade nel {new Date().getFullYear()}</div>
          <div className="stat-num amber">{attenzione.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop: "3px solid #639922" }}>
          <div className="stat-label">Scade nel {new Date().getFullYear() + 1}</div>
          <div className="stat-num green">{buoni.length}</div>
        </div>
      </div>

      {totaleProblemi > 0 && (
        <div className="alert-banner" style={{ marginBottom: 24 }}>
          ⚠ {totaleProblemi} {totaleProblemi === 1 ? "kit richiede" : "kit richiedono"} intervento urgente
        </div>
      )}

      <Gruppo
        titolo="Scaduti — revisione obbligatoria"
        items={scaduti}
        colore="#e24b4a"
      />
      <Gruppo
        titolo="Entro 3 mesi — pianifica subito"
        sottotitolo="rosso"
        items={critici}
        colore="#e24b4a"
      />
      <Gruppo
        titolo={`Scade nel ${new Date().getFullYear()} — da pianificare`}
        sottotitolo="giallo"
        items={attenzione}
        colore="#ba7517"
      />
      <Gruppo
        titolo={`Scade nel ${new Date().getFullYear() + 1} — in regola`}
        sottotitolo="verde"
        items={buoni}
        colore="#639922"
      />
      <Gruppo
        titolo="Regolari — oltre l'anno prossimo"
        items={regolari}
        colore="#639922"
      />
      <Gruppo
        titolo="Magazzino"
        items={altri}
        colore="#378add"
      />
    </div>
  );
}