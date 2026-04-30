import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { deleteKit } from "../firebase/service";
import { calcolaStato, statoLabel, formatData, giorniAllaScadenza } from "../utils";

export default function KitDetail({ kits, reload }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const kit = kits.find(k => k.id === id);

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

  const cuscini = kit.componenti?.filter(c => c.tipo.startsWith("CUSCINO")) || [];
  const centraline = kit.componenti?.filter(c => c.tipo === "CENTRALINA") || [];
  const riduttori = kit.componenti?.filter(c => c.tipo === "RIDUTTORE") || [];
  const tubi = kit.componenti?.filter(c => c.tipo.startsWith("TUBO")) || [];
  const valvole = kit.componenti?.filter(c => c.tipo === "RUB. VALVOLARE") || [];

  function GruppoComp({ titolo, items }) {
    if (!items.length) return null;
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{titolo} ({items.length})</div>
        <div className="comp-list">
          {items.map((c, i) => (
            <div key={i} className="comp-item">
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className="comp-tipo">{c.tipo}</span>
                  {c.note && <span style={{ fontSize: 10, background: "#fcebeb", color: "#a32d2d", padding: "2px 7px", borderRadius: 10, fontWeight: 600 }}>{c.note}</span>}
                </div>
                <div className="comp-modello" style={{ marginTop: 2 }}>{c.modello || "—"}</div>
              </div>
              <div style={{ textAlign: "right", minWidth: 180 }}>
                {/* Matricola Lucca in evidenza */}
                {c.matricolaLucca && (
                  <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#185fa5", background: "#e6f1fb", padding: "3px 10px", borderRadius: 6, display: "inline-block", marginBottom: 4 }}>
                    {c.matricolaLucca}
                  </div>
                )}
                <div className="comp-matricola">{c.matricola || "—"}</div>
                <div style={{ fontSize: 10, color: "#888" }}>{c.bar} bar</div>
              </div>
            </div>
          ))}
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
      {stato === "in_scadenza" && (
        <div className="alert-banner" style={{ background: "#faeeda", borderColor: "#fac775", color: "#854f0b", marginBottom: 16 }}>
          ⏱ Questo kit scade tra {giorni} giorni — pianifica la revisione
        </div>
      )}

      <div className="two-col">
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
    </div>
  );
}