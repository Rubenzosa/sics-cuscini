/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import KitAccordion from "../components/KitAccordion";
import { contaStats, scortaMancante } from "../inventario";
import { calcolaStato, calcolaStatoGT, giorniAllaScadenza, prossimaRevisioneGT } from "../utils";

export default function KitView({ kits, gruppiTaglio, sistema }) {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);

  const isTaglio = sistema === "taglio";
  const items = isTaglio ? (gruppiTaglio || []) : (kits || []);
  const calcStato = isTaglio ? calcolaStatoGT : calcolaStato;
  const scadDi = it => isTaglio ? prossimaRevisioneGT(it) : it.dataRevisione;

  const stats = useMemo(() => contaStats(items, calcStato), [items, isTaglio]);
  const mancaScorta = useMemo(() => scortaMancante(items), [items]);

  const visibili = items.filter(it => it.stato !== "fuori_uso");
  const q = search.toLowerCase().trim();
  const filtrati = visibili.filter(it => {
    if (!q) return true;
    const campi = [String(it.numero), it.nome, it.mezzo, it.dislocazione];
    const inComp = (it.componenti || []).some(c => [c.modello, c.matricola, c.matricolaLucca].some(v => v && v.toLowerCase().includes(q)));
    return campi.some(v => v && v.toLowerCase().includes(q)) || inComp;
  }).sort((a, b) => (giorniAllaScadenza(scadDi(a)) ?? 9999) - (giorniAllaScadenza(scadDi(b)) ?? 9999));

  const fuoriUso = items.filter(it => it.stato === "fuori_uso");
  const scortaLabel = isTaglio ? "gruppo da taglio" : "cuscino";

  return (
    <div>
      {/* Intestazione + nuovo */}
      <div className="page-header">
        <h1 className="page-title">{isTaglio ? "Gruppi da taglio" : "Kit cuscini"}</h1>
        <Link to={isTaglio ? "/gruppi-taglio/nuovo" : "/kit/nuovo"} className="btn btn-primary">
          + Nuovo {isTaglio ? "gruppo" : "kit"}
        </Link>
      </div>

      {/* Statistiche */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        <Stat n={stats.operativi} l="Operativi" />
        <Stat n={stats.inScadenza} l="In scadenza" color="var(--amber-text)" />
        <Stat n={stats.scaduti} l="Scaduti" color="var(--red-text)" />
        <Stat n={stats.magazzino} l="Magazzino" color="var(--text3)" />
      </div>

      {/* Banner scorta */}
      {mancaScorta && (
        <div className="section-blue" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, background: "var(--amber-bg)", borderColor: "var(--amber)" }}>
          <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", color: "#fff", background: "var(--amber)", padding: "3px 9px", borderRadius: 20 }}>Suggerimento</span>
          <span style={{ flex: 1, fontSize: 13, color: "var(--amber-text)", fontWeight: 600 }}>
            Nessun <b>{scortaLabel}</b> di scorta in magazzino — valuta un acquisto.
          </span>
        </div>
      )}

      {/* Ricerca */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none" }}>⌕</span>
        <input className="search-input" style={{ paddingLeft: 40 }}
          placeholder="Cerca numero, nome, matricola, mezzo..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Lista accordion */}
      {!filtrati.length ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text3)", fontSize: 14 }}>Nessun kit trovato.</div>
      ) : filtrati.map(it => {
        const st = calcStato(it);
        const scad = scadDi(it);
        return (
          <KitAccordion key={it.id} item={it} sistema={sistema}
            stato={st} giorni={giorniAllaScadenza(scad)} scad={scad}
            open={openId === it.id}
            onToggle={() => setOpenId(openId === it.id ? null : it.id)} />
        );
      })}

      {/* Fuori uso — sezione a parte, comprimibile */}
      {fuoriUso.length > 0 && (
        <details style={{ marginTop: 24 }}>
          <summary style={{ cursor: "pointer", listStyle: "none", padding: "10px 14px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text2)", fontSize: 13, fontWeight: 700 }}>
            Fuori uso — dismessi ({fuoriUso.length}) ▾
          </summary>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {fuoriUso.map(it => (
              <Link key={it.id} to={isTaglio ? `/gruppi-taglio/${it.id}` : `/kit/${it.id}`}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", textDecoration: "none", color: "var(--text2)" }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: "var(--text3)", minWidth: 34 }}>{it.numero}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                  <span style={{ display: "block", fontWeight: 700, fontSize: 13, overflowWrap: "anywhere" }}>{it.nome}</span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.mezzo}</span>
                </span>
                <span className="pill fuori_uso">Fuori uso</span>
              </Link>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 8, paddingLeft: 4 }}>
            Apri un kit per eliminarlo definitivamente.
          </div>
        </details>
      )}
    </div>
  );
}

function Stat({ n, l, color }) {
  return (
    <div className="card" style={{ padding: "12px 14px" }}>
      <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1, color: color || "var(--text)" }}>{n}</div>
      <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text3)", marginTop: 6 }}>{l}</div>
    </div>
  );
}
