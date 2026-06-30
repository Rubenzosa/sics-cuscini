import React from "react";
import { Link } from "react-router-dom";
import Ring from "./Ring";
import { statoLabel, formatData } from "../utils";

const BORDER = {
  scaduto: "var(--red)", critico: "var(--red)", attenzione: "var(--amber)",
  buono: "var(--green)", regolare: "var(--green)",
};

export default function KitAccordion({ item, sistema, stato, giorni, scad, open, onToggle }) {
  const isTaglio = sistema === "taglio";
  const borderColor = BORDER[stato] || "var(--border)";
  const detailPath = isTaglio ? `/gruppi-taglio/${item.id}` : `/kit/${item.id}`;
  const info = isTaglio
    ? `${item.sistema || ""}${item.marca ? " · " + item.marca : ""} · ${item.dislocazione || ""}`
    : `${item.bar} bar · ${item.dislocazione || ""}`;
  const comps = item.componenti || [];

  return (
    <div className="card" style={{ padding: 0, marginBottom: 12, borderLeft: `4px solid ${borderColor}`, overflow: "hidden" }}>
      <button onClick={onToggle} style={{
        display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
        width: "100%", background: "none", border: "none", font: "inherit",
        textAlign: "left", color: "inherit", cursor: "pointer",
      }}>
        <span style={{ fontSize: 28, fontWeight: 900, color: "var(--accent)", lineHeight: 1, minWidth: 44 }}>{item.numero}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>{item.nome}</span>
          <span style={{ display: "block", fontSize: 12, color: "var(--text3)", fontFamily: "monospace" }}>{item.mezzo}</span>
          <span style={{ display: "block", fontSize: 11, color: "var(--text2)" }}>{info}</span>
        </span>
        <Ring giorni={giorni} stato={stato} />
        <span className={`pill ${stato}`}>{statoLabel(stato)}</span>
        <span style={{
          width: 9, height: 9, borderRight: "2px solid var(--text3)", borderBottom: "2px solid var(--text3)",
          transform: open ? "rotate(-135deg)" : "rotate(45deg)", transition: "transform .3s", flexShrink: 0,
        }} />
      </button>

      {open && (
        <div style={{ padding: "0 18px 18px" }}>
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
                <span style={{ display: "block", fontSize: 12, fontWeight: 700 }}>{c.tipo}</span>
                <span style={{ display: "block", fontSize: 10, color: "var(--text3)" }}>{c.modello || "—"}</span>
              </span>
              {isTaglio ? (
                c.matricola ? <span style={{ fontFamily: "monospace", fontSize: 10, color: "var(--text2)" }}>{c.matricola}</span> : null
              ) : (
                c.matricolaLucca ? <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 10, color: "var(--blue-text)", background: "var(--blue-bg)", padding: "3px 7px", borderRadius: 5 }}>{c.matricolaLucca}</span> : null
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
