import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { calcolaStato, statoLabel, formatData, giorniAllaScadenza } from "../utils";

// Estrae valori unici da tutti i kit per i filtri avanzati
function useFilterOptions(kits) {
  return useMemo(() => {
    const bar       = [...new Set(kits.map(k => k.bar).filter(Boolean))].sort((a,b) => a-b);
    const sedi      = [...new Set(kits.map(k => k.dislocazione).filter(Boolean))].sort();
    const marche    = [...new Set(
      kits.flatMap(k => (k.componenti||[]).map(c => {
        // Estrai solo il nome marca principale (prima parola)
        const m = c.modello || "";
        return m.split(" ")[0];
      })).filter(Boolean)
    )].sort();
    const tipiComp  = [...new Set(
      kits.flatMap(k => (k.componenti||[]).map(c => c.tipo).filter(Boolean))
    )].sort();
    const anni      = [...new Set(kits.map(k => k.annoAcquisto).filter(Boolean))].sort();
    return { bar, sedi, marche, tipiComp, anni };
  }, [kits]);
}

// Chip filtro con conteggio
function FiltroChip({ label, count, active, onClick }) {
  return (
    <button
      className={`filter-chip ${active ? "active" : ""}`}
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 5 }}
    >
      {label}
      {count !== undefined && (
        <span style={{
          fontSize: 10, fontWeight: 800,
          background: active ? "rgba(255,255,255,0.25)" : "var(--border)",
          color: active ? "#fff" : "var(--text3)",
          padding: "1px 5px", borderRadius: 10,
          minWidth: 18, textAlign: "center",
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

export default function KitList({ kits, reload }) {
  const navigate = useNavigate();
  const [search,      setSearch]      = useState("");
  const [filtroStato, setFiltroStato] = useState("tutti");
  const [filtroBar,   setFiltroBar]   = useState([]);
  const [filtroSede,  setFiltroSede]  = useState([]);
  const [filtroMarca, setFiltroMarca] = useState([]);
  const [filtroTipo,  setFiltroTipo]  = useState([]);
  const [filtroAnno,  setFiltroAnno]  = useState([]);
  const [showFiltri,  setShowFiltri]  = useState(false);

  const opts = useFilterOptions(kits);

  // Toggle valore in array filtro
  function toggle(setter, val) {
    setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  }

  // Reset tutti i filtri avanzati
  function resetFiltri() {
    setFiltroBar([]); setFiltroSede([]);
    setFiltroMarca([]); setFiltroTipo([]); setFiltroAnno([]);
    setSearch("");
  }

  const hasFiltriAvanzati = filtroBar.length || filtroSede.length ||
    filtroMarca.length || filtroTipo.length || filtroAnno.length;

  const filtrati = useMemo(() => {
    return kits.filter(kit => {
      const stato = calcolaStato(kit);

      // ── Filtro stato ──
      const matchStato =
        filtroStato === "tutti" ||
        (filtroStato === "critici"  && (stato === "scaduto" || stato === "critico" || stato === "attenzione")) ||
        (filtroStato === "regolari" && (stato === "buono" || stato === "regolare")) ||
        (filtroStato === "revisione"&& kit.stato === "in_revisione") ||
        (filtroStato === "fuori"    && (kit.stato === "fuori_servizio" || kit.stato === "magazzino"));

      // ── Filtro bar ──
      const matchBar = !filtroBar.length || filtroBar.includes(kit.bar);

      // ── Filtro sede ──
      const matchSede = !filtroSede.length || filtroSede.includes(kit.dislocazione);

      // ── Filtro marca (sui componenti) ──
      const matchMarca = !filtroMarca.length || (kit.componenti || []).some(c =>
        filtroMarca.some(m => (c.modello || "").toUpperCase().includes(m.toUpperCase()))
      );

      // ── Filtro tipo componente ──
      const matchTipo = !filtroTipo.length || (kit.componenti || []).some(c =>
        filtroTipo.includes(c.tipo)
      );

      // ── Filtro anno acquisto ──
      const matchAnno = !filtroAnno.length || filtroAnno.includes(kit.annoAcquisto);

      // ── Ricerca testo libero ──
      const q = search.toLowerCase().trim();
      const matchSearch = !q ||
        String(kit.numero).includes(q) ||
        (kit.nome || "").toLowerCase().includes(q) ||
        (kit.mezzo || "").toLowerCase().includes(q) ||
        (kit.tipoMezzo || "").toLowerCase().includes(q) ||
        (kit.dislocazione || "").toLowerCase().includes(q) ||
        String(kit.bar).includes(q) ||
        (kit.componenti || []).some(c =>
          (c.modello     || "").toLowerCase().includes(q) ||
          (c.matricola   || "").toLowerCase().includes(q) ||
          (c.matricolaLucca || "").toLowerCase().includes(q) ||
          (c.tipo        || "").toLowerCase().includes(q)
        );

      return matchStato && matchBar && matchSede &&
             matchMarca && matchTipo && matchAnno && matchSearch;
    });
  }, [kits, search, filtroStato, filtroBar, filtroSede, filtroMarca, filtroTipo, filtroAnno]);

  // Conteggi per chip stato
  function countStato(s) {
    return kits.filter(k => {
      const st = calcolaStato(k);
      if (s === "critici")  return st === "scaduto" || st === "critico" || st === "attenzione";
      if (s === "regolari") return st === "buono" || st === "regolare";
      if (s === "revisione")return k.stato === "in_revisione";
      if (s === "fuori")    return k.stato === "fuori_servizio" || k.stato === "magazzino";
      return true;
    }).length;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Kit cuscini</h1>
        <Link to="/kit/nuovo" className="btn btn-primary">+ Nuovo kit</Link>
      </div>

      {/* ── BARRA RICERCA ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{
            position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: "var(--text3)", fontSize: 14,
            pointerEvents: "none",
          }}>⌕</span>
          <input
            className="search-input"
            style={{ paddingLeft: 34 }}
            placeholder="Cerca kit, targa, matricola, modello..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`btn ${showFiltri ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setShowFiltri(s => !s)}
          style={{ position: "relative" }}
        >
          ⚙ Filtri avanzati
          {hasFiltriAvanzati ? (
            <span style={{
              position: "absolute", top: -6, right: -6,
              background: "var(--red)", color: "#fff",
              fontSize: 10, fontWeight: 800,
              width: 18, height: 18, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {[filtroBar, filtroSede, filtroMarca, filtroTipo, filtroAnno]
                .reduce((s, a) => s + a.length, 0)}
            </span>
          ) : null}
        </button>
        {hasFiltriAvanzati && (
          <button className="btn btn-secondary" onClick={resetFiltri}
            style={{ color: "var(--red-text)", borderColor: "#f7c1c1" }}>
            ✕ Reset filtri
          </button>
        )}
      </div>

      {/* ── CHIP STATO ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {[
          ["tutti",    "Tutti"],
          ["critici",  "Critici"],
          ["regolari", "In regola"],
          ["revisione","In revisione"],
          ["fuori",    "Fuori servizio"],
        ].map(([key, label]) => (
          <FiltroChip
            key={key}
            label={label}
            count={key !== "tutti" ? countStato(key) : undefined}
            active={filtroStato === key}
            onClick={() => setFiltroStato(key)}
          />
        ))}
      </div>

      {/* ── CHIP DISLOCAZIONE RAPIDA ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".05em", marginRight: 4 }}>
          Sede:
        </span>
        <FiltroChip
          label="Tutte"
          active={filtroSede.length === 0}
          onClick={() => setFiltroSede([])}
        />
        {opts.sedi.map(s => {
          const cnt = kits.filter(k => k.dislocazione === s).length;
          return (
            <FiltroChip
              key={s}
              label={s}
              count={cnt}
              active={filtroSede.includes(s)}
              onClick={() => toggle(setFiltroSede, s)}
            />
          );
        })}
      </div>

      {/* ── PANNELLO FILTRI AVANZATI ── */}
      {showFiltri && (
        <div className="card" style={{ marginBottom: 14, padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>

            {/* Bar */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
                Pressione (bar)
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {opts.bar.map(b => {
                  const cnt = kits.filter(k => k.bar === b).length;
                  return (
                    <FiltroChip
                      key={b}
                      label={`${b} bar`}
                      count={cnt}
                      active={filtroBar.includes(b)}
                      onClick={() => toggle(setFiltroBar, b)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Sede */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
                Dislocazione
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {opts.sedi.map(s => {
                  const cnt = kits.filter(k => k.dislocazione === s).length;
                  return (
                    <FiltroChip
                      key={s}
                      label={s}
                      count={cnt}
                      active={filtroSede.includes(s)}
                      onClick={() => toggle(setFiltroSede, s)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Marca */}
            <div style={{ gridColumn: "span 2" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
                Marca componenti
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {opts.marche.map(m => {
                  const cnt = kits.filter(k =>
                    (k.componenti||[]).some(c => (c.modello||"").toUpperCase().includes(m.toUpperCase()))
                  ).length;
                  return (
                    <FiltroChip
                      key={m}
                      label={m}
                      count={cnt}
                      active={filtroMarca.includes(m)}
                      onClick={() => toggle(setFiltroMarca, m)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Tipo componente */}
            <div style={{ gridColumn: "span 2" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
                Tipo componente
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {opts.tipiComp.map(t => {
                  const cnt = kits.filter(k =>
                    (k.componenti||[]).some(c => c.tipo === t)
                  ).length;
                  return (
                    <FiltroChip
                      key={t}
                      label={t}
                      count={cnt}
                      active={filtroTipo.includes(t)}
                      onClick={() => toggle(setFiltroTipo, t)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Anno acquisto */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
                Anno acquisto
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {opts.anni.map(a => {
                  const cnt = kits.filter(k => k.annoAcquisto === a).length;
                  return (
                    <FiltroChip
                      key={a}
                      label={String(a)}
                      count={cnt}
                      active={filtroAnno.includes(a)}
                      onClick={() => toggle(setFiltroAnno, a)}
                    />
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── RIEPILOGO FILTRI ATTIVI ── */}
      {hasFiltriAvanzati && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
          fontSize: 12, color: "var(--text2)", flexWrap: "wrap",
        }}>
          <span style={{ fontWeight: 700 }}>Filtri attivi:</span>
          {filtroBar.map(b    => <span key={b}    style={tagStyle}>{b} bar</span>)}
          {filtroSede.map(s   => <span key={s}    style={tagStyle}>{s}</span>)}
          {filtroMarca.map(m  => <span key={m}    style={tagStyle}>{m}</span>)}
          {filtroTipo.map(t   => <span key={t}    style={tagStyle}>{t}</span>)}
          {filtroAnno.map(a   => <span key={a}    style={tagStyle}>{a}</span>)}
        </div>
      )}

      {/* ── RISULTATI ── */}
      <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10 }}>
        {filtrati.length} {filtrati.length === 1 ? "kit trovato" : "kit trovati"}
        {filtrati.length !== kits.length && ` su ${kits.length} totali`}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Nome / Mezzo</th>
                <th>Targa</th>
                <th>Bar</th>
                <th>Dislocazione</th>
                <th>Ultima revisione</th>
                <th>Scade tra</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {filtrati.map(kit => {
                const stato  = calcolaStato(kit);
                const giorni = giorniAllaScadenza(kit.dataRevisione);
                // Marca principale del kit (dalla prima centralina o cuscino)
                const marca  = (kit.componenti||[])
                  .map(c => (c.modello||"").split(" ")[0])
                  .filter(Boolean)[0] || "";
                return (
                  <tr key={kit.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/kit/${kit.id}`)}>
                    <td><strong>{kit.numero}</strong></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{kit.nome}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>
                        {kit.tipoMezzo}
                        {marca && <span style={{ marginLeft: 6, color: "var(--accent)" }}>{marca}</span>}
                      </div>
                    </td>
                    <td className="mono">{kit.mezzo}</td>
                    <td>
                      <span style={{
                        fontWeight: 700, fontSize: 12,
                        color: kit.bar === 12 ? "var(--red-text)" : kit.bar === 10 ? "var(--amber-text)" : "var(--text)",
                      }}>
                        {kit.bar} bar
                      </span>
                    </td>
                    <td>{kit.dislocazione || "—"}</td>
                    <td>{formatData(kit.dataRevisione)}</td>
                    <td style={{ fontSize: 12 }}>
                      {giorni === null ? "N/D" :
                        giorni < 0
                          ? <span style={{ color: "var(--red)", fontWeight: 600 }}>{Math.abs(giorni)}gg fa</span>
                          : giorni <= 90
                          ? <span style={{ color: "var(--amber)", fontWeight: 600 }}>{giorni}gg</span>
                          : <span style={{ color: "var(--green)" }}>{giorni}gg</span>
                      }
                    </td>
                    <td><span className={`pill ${stato}`}>{statoLabel(stato)}</span></td>
                  </tr>
                );
              })}
              {filtrati.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "var(--text3)", padding: 36 }}>
                    <div style={{ fontSize: 20, marginBottom: 8 }}>🔍</div>
                    Nessun kit trovato con i filtri selezionati.
                    <br/>
                    <button
                      className="card-action"
                      style={{ marginTop: 8 }}
                      onClick={resetFiltri}
                    >
                      Rimuovi tutti i filtri
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const tagStyle = {
  background: "var(--blue-bg)", color: "var(--blue-text)",
  padding: "2px 8px", borderRadius: 10, fontWeight: 600, fontSize: 11,
};