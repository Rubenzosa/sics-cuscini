import React from "react";
import { Link } from "react-router-dom";
import { statoLabel, statoLabelBreve, formatData, componentiFuoriUso, componentiNonOperativiGT, componenteAttivoGT } from "../utils";

export default function KitAccordion({ item, sistema, stato, giorni, scad, open, onToggle }) {
  const isTaglio = sistema === "taglio";
  const detailPath = isTaglio ? `/gruppi-taglio/${item.id}` : `/kit/${item.id}`;
  const comps = item.componenti || [];
  // Cuscini: componenti marcati fuoriUso. Taglio: componenti in revisione o fuori servizio.
  const nFU = isTaglio ? componentiNonOperativiGT(item).totale : componentiFuoriUso(item);
  const titoloFU = isTaglio
    ? nFU + " componente/i fermo/i (in revisione o fuori servizio)"
    : nFU + " componente/i fuori uso da sostituire";

  // Tono cromatico condiviso da barra, giorni e pastiglia.
  const TONO = { scaduto:"b", critico:"b", attenzione:"w", buono:"ok", regolare:"ok" };
  const tono = TONO[stato] || "n";
  const marca = isTaglio ? item.marca : (item.bar ? item.bar + " bar" : "");

  return (
    <div className="reg-item">
      <button onClick={onToggle} className={open ? "reg-row reg-cols open" : "reg-row reg-cols"}>
        <span className={`reg-bar ${tono}`}/>
        <span className="reg-num">{item.numero}</span>
        <span className="reg-mid">
          <span className="reg-nome">
            {item.nome}
            {nFU > 0 && <span className="reg-warn" title={titoloFU}>−{nFU} comp.</span>}
          </span>
          <span className="reg-sub">
            {item.mezzo || "—"}
            {marca && <span className="reg-marca"> · {marca}</span>}
          </span>
        </span>
        <span className="reg-loc">{item.dislocazione || "—"}</span>
        <span className="reg-scad">
          <span className="reg-data">{scad && scad !== "NO REVISIONE" ? formatData(scad) : "—"}</span>
          <span className={`reg-gg ${tono}`}>
            {giorni === null || giorni === undefined
              ? (scad === "NO REVISIONE" ? "no revisione" : "senza data")
              : giorni < 0 ? `${Math.abs(giorni)} gg fa` : `fra ${giorni} gg`}
          </span>
        </span>
        <span className="reg-stato">
          <span className={`reg-chip ${tono}`}><span className="reg-dot"/>{statoLabelBreve(stato)}</span>
        </span>
        <span className="reg-chev"/>
      </button>

      {open && (
        <div className="reg-panel">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 14 }}>
            <Field label="Mezzo" value={item.mezzo || "—"} />
            <Field label="Dislocazione" value={item.dislocazione || "—"} />
            <Field label="Prossima revisione" value={formatData(scad)} />
            <Field label="Stato" value={statoLabel(stato)} />
          </div>

          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text3)", marginBottom: 8 }}>
            {isTaglio ? "Componenti" : "Seriali componenti"} ({comps.length})
          </div>
          {comps.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", marginBottom: 6 }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12, fontWeight: 700, textDecoration: isTaglio && !componenteAttivoGT(c) ? "line-through" : "none", color: isTaglio && !componenteAttivoGT(c) ? "var(--text3)" : "inherit" }}>
                  {c.tipo}
                  {isTaglio && c.statoOperativo === "in_revisione" && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 8, background: "var(--amber-bg)", color: "var(--amber-text)" }}>IN REVISIONE</span>}
                  {isTaglio && c.statoOperativo === "fuori_servizio" && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 8, background: "var(--red-bg)", color: "var(--red-text)" }}>FUORI SERVIZIO</span>}
                </span>
                <span style={{ display: "block", fontSize: 10, color: "var(--text3)" }}>{c.modello || "—"}</span>
              </span>
              {isTaglio ? (
                c.matricola ? <span style={{ fontFamily: "monospace", fontSize: 10, color: "var(--text2)" }}>{c.matricola}</span> : null
              ) : (
                c.matricolaLucca ? (
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 10, color: "var(--blue-text)", background: "var(--blue-bg)", padding: "3px 7px", borderRadius: 5 }}>{c.matricolaLucca}</span>
                    {c.vecchio_codice && c.vecchio_codice !== c.matricolaLucca && (
                      <span style={{ fontFamily: "monospace", fontSize: 9, color: "var(--text3)", textDecoration: "line-through" }}>{c.vecchio_codice}</span>
                    )}
                  </span>
                ) : null
              )}
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Link to={detailPath} className="btn btn-secondary" style={{ flex: 1, textAlign: "center" }}>Dettaglio completo</Link>
            <Link to={`${detailPath}/modifica`} className="btn btn-primary" style={{ flex: 1, textAlign: "center" }}>Modifica</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
      <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text3)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
