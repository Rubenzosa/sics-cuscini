/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import KitAccordion from "../components/KitAccordion";
import { contaStats, scortaMancante } from "../inventario";
import { calcolaStato, calcolaStatoGT, giorniAllaScadenza, prossimaRevisioneGT, statoLabel, formatData } from "../utils";
import { deleteKit, deleteGruppoTaglio, updateKit, updateGruppoTaglio } from "../firebase/service";
import { buildCsv, buildHtmlReport } from "../export";

export default function KitView({ kits, gruppiTaglio, sistema, reload }) {
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

  async function ripristina(it) {
    if (!window.confirm(`Rimettere ATTIVO il Kit ${it.numero} — ${it.nome}?`)) return;
    if (isTaglio) await updateGruppoTaglio(it.id, { stato: "attivo" });
    else await updateKit(it.id, { stato: "attivo" });
    if (reload) await reload();
  }
  async function elimina(it) {
    if (!window.confirm(`Eliminare DEFINITIVAMENTE il Kit ${it.numero} — ${it.nome}?\nL'operazione non è reversibile.`)) return;
    if (isTaglio) await deleteGruppoTaglio(it.id);
    else await deleteKit(it.id);
    if (reload) await reload();
  }

  const exportFns = {
    statoLabelOf: it => statoLabel(calcStato(it)),
    scadOf: scadDi,
    scadFmt: formatData,
  };
  function esportaCsv() {
    const csv = buildCsv(items, sistema, exportFns);
    const BOM = "﻿";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SICS_${isTaglio ? "taglio" : "cuscini"}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function esportaPdf() {
    const html = buildHtmlReport(items, sistema, exportFns);
    const w = window.open("", "_blank");
    if (!w) { alert("Consenti i popup per esportare il PDF."); return; }
    w.document.write(html);
    w.document.close();
  }

  return (
    <div>
      {/* Intestazione + nuovo */}
      <div className="page-header">
        <h1 className="page-title">{isTaglio ? "Gruppi da taglio" : "Kit cuscini"}</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={esportaCsv}>Esporta CSV</button>
          <button className="btn btn-secondary" onClick={esportaPdf}>Esporta PDF</button>
          <Link to={isTaglio ? "/gruppi-taglio/nuovo" : "/kit/nuovo"} className="btn btn-primary">
            + Nuovo {isTaglio ? "gruppo" : "kit"}
          </Link>
        </div>
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
              <div key={it.id}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text2)", flexWrap: "wrap" }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: "var(--text3)", minWidth: 34 }}>{it.numero}</span>
                <span style={{ flex: 1, minWidth: 120, overflow: "hidden" }}>
                  <span style={{ display: "block", fontWeight: 700, fontSize: 13, overflowWrap: "anywhere" }}>{it.nome}</span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.mezzo}</span>
                </span>
                <Link to={isTaglio ? `/gruppi-taglio/${it.id}` : `/kit/${it.id}`} className="btn btn-secondary" style={{ fontSize: 11, padding: "5px 10px" }}>Apri</Link>
                <button className="btn btn-secondary" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => ripristina(it)}>Rimetti attivo</button>
                <button className="btn btn-danger" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => elimina(it)}>Elimina</button>
              </div>
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
