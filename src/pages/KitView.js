/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import KitAccordion from "../components/KitAccordion";
import Cartellino from "../components/Cartellino";
import MenuAzioni from "../components/MenuAzioni";
import { contaStats, scortaMancante, daFare } from "../inventario";
import { calcolaStato, calcolaStatoGT, giorniAllaScadenza, prossimaRevisioneGT, statoLabel, formatData, oggiIso, componenteAttivoGT } from "../utils";
import { deleteKit, deleteGruppoTaglio, updateKit, updateGruppoTaglio } from "../firebase/service";
import { buildCsv, buildHtmlReport } from "../export";

const VISTE = [["scadenza", "Scadenza"], ["targa", "Targa"], ["matricola", "Matricola"]];
const MAX_CHIP_MATRICOLE = 5;

export default function KitView({ kits, gruppiTaglio, sistema, reload }) {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [vista, setVista] = useState("scadenza");

  const isTaglio = sistema === "taglio";
  const items = isTaglio ? (gruppiTaglio || []) : (kits || []);
  const calcStato = isTaglio ? calcolaStatoGT : calcolaStato;
  const scadDi = it => isTaglio ? prossimaRevisioneGT(it) : it.dataRevisione;

  const stats = useMemo(() => contaStats(items, calcStato), [items, isTaglio]);
  const mancaScorta = useMemo(() => scortaMancante(items), [items]);
  const problemi = useMemo(() => daFare(items, isTaglio), [items, isTaglio]);
  const detailPath = it => isTaglio ? `/gruppi-taglio/${it.id}` : `/kit/${it.id}`;

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
    a.download = `SICS_${isTaglio ? "taglio" : "cuscini"}_${oggiIso()}.csv`;
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
          <MenuAzioni etichetta="Esporta ▾" voci={[
            { label: "Esporta CSV", onClick: esportaCsv },
            { label: "Esporta PDF", onClick: esportaPdf },
          ]}/>
          <Link to={isTaglio ? "/gruppi-taglio/nuovo" : "/kit/nuovo"} className="btn btn-primary">
            + Nuovo {isTaglio ? "gruppo" : "kit"}
          </Link>
        </div>
      </div>

      {/* Statistiche compatte */}
      <div className="stats-riga">
        <span><b>{stats.operativi}</b> operativi</span>
        <span><b style={{ color: "var(--amber-text)" }}>{stats.inScadenza}</b> in scadenza</span>
        <span><b style={{ color: "var(--red-text)" }}>{stats.scaduti}</b> scaduti</span>
        <span><b>{stats.magazzino}</b> in magazzino</span>
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

      {/* Da fare */}
      <div className="sez-titolo">Da fare ({problemi.length})</div>
      {!problemi.length ? (
        <div className="dafare-vuoto">Niente da fare — tutto in regola</div>
      ) : (
        <div className="dafare">
          {problemi.map((p, i) => (
            <Link key={p.item.id + p.tipo + i} to={detailPath(p.item)} className="dafare-row">
              <Cartellino numero={p.item.numero} targa={p.item.mezzo}/>
              <span className="dafare-mid">
                <span className="dafare-titolo">{p.titolo}</span>
                <span className="dafare-sub">{p.item.nome} · {p.dettaglio}</span>
              </span>
              <span className={`reg-chip ${p.tipo === "scaduta" ? "b" : "w"}`}>
                <span className="reg-dot"/>
                {p.tipo === "scaduta" ? "Scaduta" : p.tipo === "fermi" ? "Attenzione" : `fra ${p.giorni} gg`}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Tutti i kit */}
      <div className="sez-titolo sez-titolo-row">
        <span>Tutti i {isTaglio ? "gruppi" : "kit"} ({filtrati.length})</span>
        <span className="vista-sel" role="group" aria-label="Mostra per">
          <span className="vista-lbl">Mostra per</span>
          {VISTE.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={vista === k}
              className={vista === k ? "vista-btn on" : "vista-btn"} onClick={() => setVista(k)}>{l}</button>
          ))}
        </span>
      </div>

      {/* Ricerca */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none" }}>⌕</span>
        <input className="search-input" style={{ paddingLeft: 40, width: "100%", boxSizing: "border-box" }}
          placeholder="Cerca kit, targa, matricola…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Lista */}
      {!filtrati.length ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text3)", fontSize: 14 }}>Nessun kit trovato.</div>
      ) : vista === "matricola" ? (
        <div className="reg">
          {filtrati.map(it => {
            const comps = it.componenti || [];
            const extra = comps.length - MAX_CHIP_MATRICOLE;
            return (
              <Link key={it.id} to={detailPath(it)} className="mat-row">
                <Cartellino numero={it.numero} targa={it.mezzo}/>
                <span className="mat-mid">
                  <span className="reg-nome">{it.nome} <span className="mat-n">· {comps.length} componenti</span></span>
                  <span className="mat-chips">
                    {comps.slice(0, MAX_CHIP_MATRICOLE).map((c, i) => {
                      const fermo = isTaglio ? !componenteAttivoGT(c) : c.fuoriUso;
                      const codice = isTaglio ? c.matricola : c.matricolaLucca;
                      const sec = isTaglio ? "" : c.matricola;
                      return (
                        <span key={i} className={fermo ? "mat-chip fermo" : "mat-chip"}>
                          {codice || "n.d."} <i>{c.tipo}{sec ? ` · ${sec}` : ""}</i>
                        </span>
                      );
                    })}
                    {extra > 0 && <span className="mat-chip">+{extra}</span>}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="reg">
          <div className="reg-head reg-cols">
            <span className="reg-h">Kit</span>
            <span className="reg-h">Mezzo</span>
            <span className="reg-h">Dislocazione</span>
            <span className="reg-h r">{vista === "targa" ? "Composizione" : "Revisione"}</span>
            <span className="reg-h r">Stato</span>
            <span/>
          </div>
          {raggruppa(filtrati, vista).map(([gruppo, lista]) => (
            <React.Fragment key={gruppo || "_"}>
              {gruppo !== null && <div className="reg-gruppo">{gruppo}</div>}
              {lista.map(it => {
                const st = calcStato(it);
                const scad = scadDi(it);
                return (
                  <KitAccordion key={it.id} item={it} sistema={sistema} vista={vista}
                    stato={st} giorni={giorniAllaScadenza(scad)} scad={scad}
                    open={openId === it.id}
                    onToggle={() => setOpenId(openId === it.id ? null : it.id)} />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      )}

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

// Vista "targa": gruppi per dislocazione, dentro ordinati per targa. Altre viste: un solo gruppo senza titolo.
function raggruppa(lista, vista) {
  if (vista !== "targa") return [[null, lista]];
  const gruppi = {};
  lista.forEach(it => { const g = it.dislocazione || "—"; (gruppi[g] = gruppi[g] || []).push(it); });
  return Object.keys(gruppi).sort((a, b) => a.localeCompare(b))
    .map(g => [g, gruppi[g].sort((a, b) => (a.mezzo || "").localeCompare(b.mezzo || ""))]);
}
