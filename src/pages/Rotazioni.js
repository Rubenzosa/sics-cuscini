/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  inviaInRevisione, registraRientro,
  getRotazioniAttive, getStoricoRotazioni,
} from "../firebase/service";
import {
  calcolaStato, statoLabel, formatData, giorniAllaScadenza,
  calcolaPianoRevisione, calcolaSostitutoOttimale, calcolaCopertura,
} from "../utils";

const OFFICINE = ["VVF Siena","VVF Firenze","Centro Revisione Esterno","Altro"];
const DISLOCAZIONI = ["Sede Centrale","Magazzino","Montepulciano","Montalcino","Piancastagnaio","Poggibonsi"];

// ── BARRA AVANZAMENTO REVISIONE ─────────────────────────────
function BarraRevisione({ dataInvio, dataRientroStimata }) {
  if (!dataInvio || !dataRientroStimata) return null;
  const inizio = new Date(dataInvio).getTime();
  const fine   = new Date(dataRientroStimata).getTime();
  const ora    = Date.now();
  const pct    = Math.min(100, Math.max(0, ((ora - inizio) / (fine - inizio)) * 100));
  const rimanenti = Math.ceil((fine - ora) / 86400000);
  const colore = rimanenti < 0 ? "#e24b4a" : rimanenti < 7 ? "#ba7517" : "#378add";
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text3)", marginBottom: 4 }}>
        <span>Partenza: {formatData(dataInvio)}</span>
        <span style={{ color: colore, fontWeight: 700 }}>
          {rimanenti < 0 ? `Ritardo ${Math.abs(rimanenti)}gg` : `Rientro tra ${rimanenti}gg`}
        </span>
        <span>Previsto: {formatData(dataRientroStimata)}</span>
      </div>
      <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: colore, borderRadius: 3, transition: "width 0.5s ease" }}/>
      </div>
    </div>
  );
}

// ── CARD COPERTURA SEDE ─────────────────────────────────────
function CardCopertura({ sede, attivi, inRevisione, minimo, surplus, scoperta, sottoMinimo, alMinimo, hasSurplus }) {
  const borderColor = scoperta || sottoMinimo ? "var(--red)"
    : alMinimo    ? "var(--amber)"
    : "var(--green)";
  const bg = scoperta || sottoMinimo ? "var(--red-bg)"
    : alMinimo ? "var(--amber-bg)"
    : "var(--bg2)";
  const border = scoperta || sottoMinimo ? "#f7c1c1"
    : alMinimo ? "#fac775"
    : "var(--border)";

  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: "var(--radius-sm)",
      padding: "12px 14px",
      borderLeft: `4px solid ${borderColor}`,
    }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: "var(--text)" }}>{sede}</div>
      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
        Minimo operativo: {minimo} kit
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap", fontSize: 12 }}>
        <span style={{ fontWeight: 700, color: attivi === 0 ? "var(--red-text)" : "var(--text)" }}>
          {attivi} attivi
        </span>
        {inRevisione > 0 && (
          <span style={{ color: "var(--blue-text)", fontWeight: 600 }}>
            {inRevisione} in revisione
          </span>
        )}
      </div>
      <div style={{ marginTop: 8 }}>
        {scoperta && (
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--red-text)" }}>
            🔴 SEDE SCOPERTA
          </span>
        )}
        {sottoMinimo && !scoperta && (
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--red-text)" }}>
            🔴 SOTTO MINIMO — deficit {Math.abs(surplus)} kit
          </span>
        )}
        {alMinimo && (
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--amber-text)" }}>
            ⚠ AL MINIMO — nessun surplus disponibile
          </span>
        )}
        {hasSurplus && (
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green-text)" }}>
            ✓ Surplus {surplus} kit — può inviare in revisione
          </span>
        )}
      </div>
    </div>
  );
}

// ── CARD KIT IN REVISIONE ───────────────────────────────────
function CardInRevisione({ rot, onRientro }) {
  return (
    <div style={{
      background: "var(--bg2)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: 16,
      borderTop: "3px solid var(--accent)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>
            Kit {rot.kitNumero} — {rot.kitNome}
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
            {rot.mezzo} · {rot.dislocazione}
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
            Officina: <strong>{rot.officina || "—"}</strong>
          </div>
        </div>
        <span style={{
          background: "var(--blue-bg)", color: "var(--blue-text)",
          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
        }}>
          IN REVISIONE
        </span>
      </div>
      <BarraRevisione dataInvio={rot.dataInvio} dataRientroStimata={rot.dataRientroStimata} />
      {rot.note && (
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text3)", fontStyle: "italic" }}>
          {rot.note}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <button
          className="btn btn-success"
          style={{ fontSize: 12, padding: "6px 14px" }}
          onClick={() => onRientro(rot)}
        >
          ✓ Registra rientro
        </button>
      </div>
    </div>
  );
}

// ── CARD PIANO REVISIONE (Strategia 1) ─────────────────────
function CardPiano({ piano, kits, onInvia }) {
  if (!piano.gruppi.length) {
    return (
      <div style={{ textAlign: "center", padding: 24, color: "var(--text3)", fontSize: 13 }}>
        ✓ Nessuna revisione urgente da pianificare
      </div>
    );
  }
  return (
    <div>
      {piano.avvisi.map((a, i) => (
        <div key={i} className="alert-banner" style={{ marginBottom: 10, fontSize: 12 }}>{a}</div>
      ))}
      {piano.gruppi.map((gruppo, gi) => (
        <div key={gi} style={{
          background: gi === 0 ? "var(--bg2)" : "var(--bg3)",
          border: `1px solid ${gi === 0 ? "var(--accent)" : "var(--border)"}`,
          borderRadius: "var(--radius)", padding: 16, marginBottom: 12,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 13, color: "var(--text)" }}>
                {gi === 0 ? "Prossimo gruppo consigliato" : `Gruppo ${gi + 1}`}
              </span>
              <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 10 }}>
                {gruppo.kit.length} kit · ~{gruppo.km} km totali
              </span>
            </div>
            {gi === 0 && (
              <button
                className="btn btn-primary"
                style={{ fontSize: 12, padding: "6px 14px" }}
                onClick={() => onInvia(gruppo.kit)}
              >
                Invia questo gruppo
              </button>
            )}
          </div>

          {gruppo.kit.map(kit => {
            const sostituto = calcolaSostitutoOttimale(kit, kits);
            const giorni    = giorniAllaScadenza(kit.dataRevisione);
            const stato     = calcolaStato(kit);
            return (
              <div key={kit.id} style={{
                background: "var(--bg3)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)", padding: "10px 12px", marginBottom: 8,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      Kit {kit.numero} — {kit.nome}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                      📍 {kit.dislocazione} · {kit.mezzo} · {kit.bar} bar
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                      Revisione: {formatData(kit.dataRevisione)}
                      {giorni !== null && (
                        <span style={{
                          marginLeft: 8, fontWeight: 700,
                          color: giorni < 0 ? "var(--red)" : giorni < 90 ? "var(--amber)" : "var(--green)"
                        }}>
                          ({giorni < 0 ? `scaduto da ${Math.abs(giorni)}gg` : `tra ${giorni}gg`})
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`pill ${stato}`}>{statoLabel(stato)}</span>
                </div>

                {/* Sostituto consigliato (Strategia 4) */}
                {sostituto ? (
                  <div style={{
                    marginTop: 10, padding: "8px 12px",
                    background: "var(--green-bg)", borderRadius: 6,
                    border: "1px solid #c0dd97",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--green-text)", marginBottom: 4 }}>
                      ✓ Sostituto consigliato
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
                      Kit {sostituto.numero} — {sostituto.nome}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                      {sostituto.bar} bar · Rev. {formatData(sostituto.dataRevisione)}
                      {sostituto.dataRevisione && (
                        <span style={{ marginLeft: 6, color: "var(--green-text)", fontWeight: 600 }}>
                          ({giorniAllaScadenza(sostituto.dataRevisione)}gg rimasti)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                      Azione: Kit {sostituto.numero} dal Magazzino → {kit.dislocazione} per {kit.mezzo}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    marginTop: 10, padding: "8px 12px",
                    background: "var(--amber-bg)", borderRadius: 6,
                    border: "1px solid #fac775",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amber-text)" }}>
                      ⚠ Nessun sostituto disponibile in magazzino con {kit.bar} bar
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── MODAL INVIA IN REVISIONE ────────────────────────────────
function ModalInvio({ kitsSelezionati, kits, onConferma, onClose }) {
  const oggi = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    officina: "VVF Siena",
    dataInvio: oggi,
    dataRientroStimata: "",
    note: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <span className="modal-title">Invia in revisione — {kitsSelezionati.length} kit</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Kit selezionati */}
        <div style={{ marginBottom: 16 }}>
          {kitsSelezionati.map(kit => {
            const sostituto = calcolaSostitutoOttimale(kit, kits);
            return (
              <div key={kit.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 12px", background: "var(--bg3)",
                borderRadius: "var(--radius-sm)", marginBottom: 6,
                border: "1px solid var(--border)",
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Kit {kit.numero} — {kit.nome}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>
                    📍 {kit.dislocazione} · {kit.bar} bar
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 11 }}>
                  {sostituto ? (
                    <span style={{ color: "var(--green-text)", fontWeight: 700 }}>
                      → Kit {sostituto.numero} (sost.)
                    </span>
                  ) : (
                    <span style={{ color: "var(--amber-text)", fontWeight: 700 }}>
                      ⚠ No sostituto
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Officina / Destinazione</label>
            <select name="officina" value={form.officina} onChange={handleChange}>
              {OFFICINE.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Data invio</label>
            <input type="date" name="dataInvio" value={form.dataInvio} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Rientro stimato</label>
            <input type="date" name="dataRientroStimata" value={form.dataRientroStimata} onChange={handleChange} />
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label>Note</label>
            <input
              name="note" value={form.note} onChange={handleChange}
              placeholder="es. Trasporto con furgone VF, accompagnamento..."
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button className="btn btn-secondary" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={() => onConferma(form)}>
            Conferma invio
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MODAL RIENTRO ───────────────────────────────────────────
function ModalRientro({ rotazione, onConferma, onClose }) {
  const oggi = new Date().toISOString().split("T")[0];
  // Calcola nuova data revisione (+2 anni se kit < 10 anni, +1 anno se ≥ 10)
  const annoKit    = rotazione.annoAcquisto || 2015;
  const eta        = new Date().getFullYear() - annoKit;
  const intervalloAnni = eta >= 10 ? 1 : 2;
  const nuovaRev   = new Date();
  nuovaRev.setFullYear(nuovaRev.getFullYear() + intervalloAnni);
  const nuovaRevStr = nuovaRev.toISOString().split("T")[0];

  const [form, setForm] = useState({
    dataRientro: oggi,
    nuovaDataRevisione: nuovaRevStr,
    esito: "positivo",
    note: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <span className="modal-title">Registra rientro — Kit {rotazione.kitNumero}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{
          background: "var(--green-bg)", border: "1px solid #c0dd97",
          borderRadius: 8, padding: 12, marginBottom: 16,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green-text)" }}>
            {rotazione.kitNome} · {rotazione.dislocazione}
          </div>
          <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
            Officina: {rotazione.officina} · Partito il {formatData(rotazione.dataInvio)}
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Data rientro effettiva</label>
            <input type="date" name="dataRientro" value={form.dataRientro} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Nuova data revisione</label>
            <input type="date" name="nuovaDataRevisione" value={form.nuovaDataRevisione} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Esito revisione</label>
            <select name="esito" value={form.esito} onChange={handleChange}>
              <option value="positivo">✓ Positivo</option>
              <option value="condizionato">~ Condizionato</option>
              <option value="negativo">✗ Negativo</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label>Note</label>
            <input
              name="note" value={form.note} onChange={handleChange}
              placeholder="Annotazioni sul rientro..."
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button className="btn btn-secondary" onClick={onClose}>Annulla</button>
          <button className="btn btn-success" onClick={() => onConferma(form)}>
            ✓ Conferma rientro
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// PAGINA PRINCIPALE
// ═══════════════════════════════════════════════════
export default function Rotazioni({ kits, reload }) {
  const navigate   = useNavigate();
  const [tab, setTab]                   = useState("piano");
  const [rotAttive, setRotAttive]       = useState([]);
  const [storicoRot, setStoricoRot]     = useState([]);
  const [loading, setLoading]           = useState(false);
  const [modalInvio, setModalInvio]     = useState(null); // array kit
  const [modalRientro, setModalRientro] = useState(null); // rotazione
  // saving handled via loading state

  useEffect(() => {
    caricaRotazioni();
  }, []);

  async function caricaRotazioni() {
    setLoading(true);
    const [attive, storico] = await Promise.all([
      getRotazioniAttive(),
      getStoricoRotazioni(),
    ]);
    setRotAttive(attive);
    setStoricoRot(storico);
    setLoading(false);
  }

  async function handleConfermaInvio(form) {
    setLoading(true);
    try {
      for (const kit of modalInvio) {
        await inviaInRevisione(kit.id, form.officina, form.dataInvio, form.dataRientroStimata, form.note);
      }
      await reload();
      await caricaRotazioni();
      setModalInvio(null);
    } catch (e) {
      alert("Errore: " + e.message);
    }
    setLoading(false);
  }

  async function handleConfermaRientro(form) {
    setLoading(true);
    try {
      await registraRientro(
        modalRientro.kitId, modalRientro.id,
        form.dataRientro, form.nuovaDataRevisione, form.esito, form.note
      );
      await reload();
      await caricaRotazioni();
      setModalRientro(null);
    } catch (e) {
      alert("Errore: " + e.message);
    }
    setLoading(false);
  }

  const piano      = calcolaPianoRevisione(kits);
  const copertura  = calcolaCopertura(kits);
  const sediScoperte = copertura.filter(s => s.scoperta).length;
  const inRevisione  = kits.filter(k => k.stato === "in_revisione").length;

  const TABS = [
    ["piano",     `Piano revisioni`],
    ["attive",    `In corso (${rotAttive.length})`],
    ["copertura", `Copertura sedi`],
    ["storico",   `Storico`],
  ];

  return (
    <div>
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Revisioni & Rotazioni</h1>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
            Pianificazione, copertura sedi e algoritmo sostituzione
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {inRevisione > 0 && (
            <span style={{
              background: "var(--blue-bg)", color: "var(--blue-text)",
              fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 20,
            }}>
              {inRevisione} kit in revisione
            </span>
          )}
          {sediScoperte > 0 && (
            <span className="badge-critico">
              ⚠ {sediScoperte} sede{sediScoperte > 1 ? "i" : ""} scoperta{sediScoperte > 1 ? "e" : ""}
            </span>
          )}
        </div>
      </div>

      {/* STAT ROW */}
      <div className="stats-row" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-label">Kit attivi</div>
          <div className="stat-num blue">
            {kits.filter(k => k.stato === "attivo").length}
          </div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">In revisione</div>
          <div className="stat-num amber">{inRevisione}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">In magazzino</div>
          <div className="stat-num green">
            {kits.filter(k => k.stato === "magazzino").length}
          </div>
        </div>
        <div className={`stat-card ${sediScoperte > 0 ? "red" : "green"}`}>
          <div className="stat-label">Sedi scoperte</div>
          <div className={`stat-num ${sediScoperte > 0 ? "red" : "green"}`}>{sediScoperte}</div>
        </div>
      </div>

      {/* TABS */}
      <div style={{
        display: "flex", gap: 2, marginBottom: 16,
        borderBottom: "2px solid var(--border)",
        overflowX: "auto", WebkitOverflowScrolling: "touch",
      }}>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            background: "none", border: "none",
            borderBottom: tab === key ? "2px solid var(--accent)" : "2px solid transparent",
            color: tab === key ? "var(--text)" : "var(--text3)",
            fontSize: 13, fontWeight: tab === key ? 700 : 500,
            padding: "10px 16px", cursor: "pointer",
            fontFamily: "inherit", marginBottom: -2,
            whiteSpace: "nowrap", flexShrink: 0,
          }}>
            {label}
          </button>
        ))}
      </div>

      {loading && <div className="loading">Caricamento...</div>}

      {/* TAB: PIANO REVISIONI */}
      {tab === "piano" && !loading && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <span className="card-title">Piano revisioni ottimale</span>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>
                Algoritmo: urgenza + zona + copertura + sostituto
              </span>
            </div>
            <CardPiano
              piano={piano}
              kits={kits}
              onInvia={(kitList) => setModalInvio(kitList)}
            />
          </div>

          {/* Selezione manuale */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Selezione manuale</span>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>
                Seleziona kit da inviare manualmente
              </span>
            </div>
            <ManualSelector kits={kits} onInvia={(list) => setModalInvio(list)} />
          </div>
        </div>
      )}

      {/* TAB: IN CORSO */}
      {tab === "attive" && !loading && (
        <div>
          {!rotAttive.length ? (
            <div className="card">
              <div style={{ textAlign: "center", padding: 32, color: "var(--text3)", fontSize: 13 }}>
                ✓ Nessun kit attualmente in revisione
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {rotAttive.map(rot => (
                <CardInRevisione
                  key={rot.id}
                  rot={rot}
                  onRientro={(r) => setModalRientro(r)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: COPERTURA SEDI */}
      {tab === "copertura" && !loading && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <span className="card-title">Copertura in tempo reale</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 10 }}>
              {copertura.map(s => (
                <CardCopertura key={s.sede} {...s} />
              ))}
            </div>
          </div>

          {/* Dettaglio per sede */}
          <div className="card">
            <div className="card-header"><span className="card-title">Kit per sede</span></div>
            {DISLOCAZIONI.filter(d => d !== "Magazzino").map(sede => {
              const kitSede = kits.filter(k => k.dislocazione === sede);
              if (!kitSede.length) return null;
              return (
                <div key={sede} style={{ marginBottom: 16 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 800, color: "var(--text3)",
                    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8,
                  }}>
                    {sede} ({kitSede.length})
                  </div>
                  {kitSede.map(kit => {
                    const stato = kit.stato === "in_revisione" ? "in_revisione" : calcolaStato(kit);
                    return (
                      <div key={kit.id}
                        onClick={() => navigate(`/kit/${kit.id}`)}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "8px 12px", background: "var(--bg3)",
                          borderRadius: "var(--radius-sm)", marginBottom: 6,
                          border: "1px solid var(--border)", cursor: "pointer",
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>Kit {kit.numero} — {kit.nome}</span>
                          <div style={{ fontSize: 11, color: "var(--text3)" }}>{kit.mezzo} · {kit.bar} bar</div>
                        </div>
                        <span className={`pill ${stato === "in_revisione" ? "magazzino" : stato}`}>
                          {stato === "in_revisione" ? "In revisione" : statoLabel(stato)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: STORICO */}
      {tab === "storico" && !loading && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Storico revisioni ({storicoRot.length})</span>
          </div>
          {!storicoRot.length ? (
            <div style={{ textAlign: "center", padding: 24, color: "var(--text3)", fontSize: 13 }}>
              Nessuna revisione registrata
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Kit</th>
                    <th>Officina</th>
                    <th>Partenza</th>
                    <th>Rientro stimato</th>
                    <th>Rientro effettivo</th>
                    <th>Esito</th>
                    <th>Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {storicoRot.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{r.kitNome}</div>
                        <div style={{ fontSize: 11, color: "var(--text3)" }}>{r.dislocazione}</div>
                      </td>
                      <td>{r.officina || "—"}</td>
                      <td>{formatData(r.dataInvio)}</td>
                      <td>{formatData(r.dataRientroStimata)}</td>
                      <td>{r.dataRientroEffettiva ? formatData(r.dataRientroEffettiva) : "—"}</td>
                      <td>
                        {r.esitoRevisione && (
                          <span className={`pill ${r.esitoRevisione === "positivo" ? "regolare" : r.esitoRevisione === "negativo" ? "scaduto" : "attenzione"}`}>
                            {r.esitoRevisione}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`pill ${r.stato === "in_revisione" ? "magazzino" : "regolare"}`}>
                          {r.stato === "in_revisione" ? "In corso" : "Rientrato"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL INVIO */}
      {modalInvio && (
        <ModalInvio
          kitsSelezionati={modalInvio}
          kits={kits}
          onConferma={handleConfermaInvio}
          onClose={() => setModalInvio(null)}
        />
      )}

      {/* MODAL RIENTRO */}
      {modalRientro && (
        <ModalRientro
          rotazione={modalRientro}
          onConferma={handleConfermaRientro}
          onClose={() => setModalRientro(null)}
        />
      )}
    </div>
  );
}

// ── SELEZIONE MANUALE ───────────────────────────────────────
function ManualSelector({ kits, onInvia }) {
  const [selezionati, setSelezionati] = useState([]);

  const candidati = kits
    .filter(k => k.stato === "attivo" && k.dataRevisione)
    .sort((a, b) => (giorniAllaScadenza(a.dataRevisione) ?? 9999) - (giorniAllaScadenza(b.dataRevisione) ?? 9999));

  function toggle(kit) {
    setSelezionati(prev => {
      const exists = prev.find(k => k.id === kit.id);
      if (exists) return prev.filter(k => k.id !== kit.id);
      // Nessun limite massimo
      return [...prev, kit];
    });
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12 }}>
        Seleziona 2-3 kit da inviare in revisione insieme
      </div>
      {candidati.map(kit => {
        const stato      = calcolaStato(kit);
        const giorni     = giorniAllaScadenza(kit.dataRevisione);
        const selezionato = !!selezionati.find(k => k.id === kit.id);
        const sostituto  = calcolaSostitutoOttimale(kit, kits);
        return (
          <div
            key={kit.id}
            onClick={() => toggle(kit)}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px", marginBottom: 6, cursor: "pointer",
              borderRadius: "var(--radius-sm)",
              border: selezionato ? "2px solid var(--accent)" : "1px solid var(--border)",
              background: selezionato ? "var(--blue-bg)" : "var(--bg3)",
              transition: "all .15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 4,
                border: `2px solid ${selezionato ? "var(--accent)" : "var(--border2)"}`,
                background: selezionato ? "var(--accent)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 14, flexShrink: 0,
              }}>
                {selezionato && "✓"}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Kit {kit.numero} — {kit.nome}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>
                  📍 {kit.dislocazione} · {kit.mezzo} · {kit.bar} bar
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className={`pill ${stato}`}>{statoLabel(stato)}</span>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                {giorni !== null ? (giorni < 0 ? `scaduto da ${Math.abs(giorni)}gg` : `${giorni}gg`) : "N/D"}
              </div>
              {sostituto && (
                <div style={{ fontSize: 10, color: "var(--green-text)", marginTop: 2, fontWeight: 600 }}>
                  → Kit {sostituto.numero} disponibile
                </div>
              )}
            </div>
          </div>
        );
      })}
      {selezionati.length >= 1 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <button className="btn btn-primary" onClick={() => onInvia(selezionati)}>
            Invia {selezionati.length} {selezionati.length===1?"kit":"kit"} selezionati →
          </button>
        </div>
      )}
    </div>
  );
}