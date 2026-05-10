import React from "react";
import { useNavigate } from "react-router-dom";
import {
  calcolaStato, calcolaStatoGT, formatData,
  giorniAllaScadenza, prossimaRevisioneGT
} from "../utils";

function AzioneCard({ titolo, descrizione, dettaglio, urgenza, onClick, tipo }) {
  const colors = {
    alta:   { bg:"var(--red-bg)",   border:"#f7c1c1",  dot:"#e24b4a",  label:"URGENTE" },
    media:  { bg:"var(--amber-bg)", border:"#fac775",  dot:"#ba7517",  label:"DA FARE" },
    bassa:  { bg:"var(--blue-bg)",  border:"#b5d4f4",  dot:"#378add",  label:"INFO" },
  };
  const c = colors[urgenza] || colors.bassa;
  return (
    <div onClick={onClick} style={{
      background:"var(--bg2)", border:`1px solid ${c.border}`,
      borderLeft:`4px solid ${c.dot}`,
      borderRadius:"var(--radius-sm)", padding:"12px 16px",
      cursor:"pointer", display:"flex", gap:12, alignItems:"flex-start",
      transition:"transform .15s",
    }}
    onMouseOver={e => e.currentTarget.style.transform="translateY(-1px)"}
    onMouseOut={e => e.currentTarget.style.transform="none"}
    >
      <div style={{ flexShrink:0, marginTop:2 }}>
        <div style={{ width:10, height:10, borderRadius:"50%", background:c.dot }}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <span style={{ fontWeight:700, fontSize:13, color:"var(--text)" }}>{titolo}</span>
          <span style={{ fontSize:9, fontWeight:800, padding:"1px 6px", borderRadius:8, background:c.dot, color:"#fff" }}>
            {c.label}
          </span>
          {tipo && (
            <span style={{ fontSize:9, fontWeight:800, padding:"1px 6px", borderRadius:8, background: tipo==="cuscini"?"#1a2b3c":"#7a3500", color:"#fff" }}>
              {tipo==="cuscini"?"CUSCINI":"TAGLIO"}
            </span>
          )}
        </div>
        <div style={{ fontSize:12, color:"var(--text2)", marginTop:3 }}>{descrizione}</div>
        {dettaglio && (
          <div style={{ fontSize:11, color:"var(--text3)", marginTop:2 }}>{dettaglio}</div>
        )}
      </div>
      <div style={{ fontSize:12, color:"var(--text3)", flexShrink:0 }}>›</div>
    </div>
  );
}

export default function DaFare({ kits, gruppiTaglio }) {
  const navigate = useNavigate();
  const azioni = [];

  // ── SCADUTI ─────────────────────────────
  kits.filter(k => calcolaStato(k) === "scaduto").forEach(k => {
    const g = giorniAllaScadenza(k.dataRevisione);
    azioni.push({
      urgenza: "alta",
      tipo: "cuscini",
      titolo: `Revisione scaduta — Kit ${k.numero} ${k.nome}`,
      descrizione: `${k.mezzo} · ${k.dislocazione}`,
      dettaglio: `Scaduto da ${Math.abs(g)} giorni — Ultima rev. ${formatData(k.dataRevisione)}`,
      onClick: () => navigate(`/kit/${k.id}`),
      sorter: -Math.abs(g),
    });
  });
  gruppiTaglio.filter(g => calcolaStatoGT(g) === "scaduto").forEach(g => {
    const pr = prossimaRevisioneGT(g);
    const gg = giorniAllaScadenza(pr);
    azioni.push({
      urgenza: "alta",
      tipo: "taglio",
      titolo: `Revisione scaduta — ${g.nome}`,
      descrizione: `${g.mezzo} · ${g.sistema} · ${g.dislocazione}`,
      dettaglio: `Scaduto da ${Math.abs(gg)} giorni`,
      onClick: () => navigate(`/gruppi-taglio/${g.id}`),
      sorter: -Math.abs(gg),
    });
  });

  // ── ENTRO 3 MESI ────────────────────────
  kits.filter(k => calcolaStato(k) === "critico").forEach(k => {
    const g = giorniAllaScadenza(k.dataRevisione);
    azioni.push({
      urgenza: "alta",
      tipo: "cuscini",
      titolo: `Pianifica revisione — Kit ${k.numero} ${k.nome}`,
      descrizione: `${k.mezzo} · ${k.dislocazione}`,
      dettaglio: `Scade tra ${g} giorni — ${formatData(k.dataRevisione)}`,
      onClick: () => navigate(`/kit/${k.id}`),
      sorter: g,
    });
  });
  gruppiTaglio.filter(g => calcolaStatoGT(g) === "critico").forEach(g => {
    const pr = prossimaRevisioneGT(g);
    const gg = giorniAllaScadenza(pr);
    azioni.push({
      urgenza: "alta",
      tipo: "taglio",
      titolo: `Pianifica revisione — ${g.nome}`,
      descrizione: `${g.mezzo} · ${g.sistema} · ${g.dislocazione}`,
      dettaglio: `Scade tra ${gg} giorni`,
      onClick: () => navigate(`/gruppi-taglio/${g.id}`),
      sorter: gg,
    });
  });

  // ── IN REVISIONE CON RIENTRO SCADUTO ────
  kits.filter(k => k.stato === "in_revisione" && k.dataRientroStimata).forEach(k => {
    const gg = giorniAllaScadenza(k.dataRientroStimata);
    if (gg !== null && gg < 0) {
      azioni.push({
        urgenza: "alta",
        tipo: "cuscini",
        titolo: `Rientro in ritardo — Kit ${k.numero} ${k.nome}`,
        descrizione: `${k.officina || "Officina"} · ${k.dislocazione}`,
        dettaglio: `Rientro previsto ${formatData(k.dataRientroStimata)} — ritardo di ${Math.abs(gg)} giorni`,
        onClick: () => navigate(`/rotazioni`),
        sorter: -Math.abs(gg) - 500,
      });
    }
  });

  // ── SENZA DATA REVISIONE ─────────────────
  kits.filter(k => !k.dataRevisione && k.stato === "attivo").forEach(k => {
    azioni.push({
      urgenza: "media",
      tipo: "cuscini",
      titolo: `Data revisione mancante — Kit ${k.numero} ${k.nome}`,
      descrizione: `${k.mezzo} · ${k.dislocazione}`,
      dettaglio: "Inserire la data di revisione",
      onClick: () => navigate(`/kit/${k.id}/modifica`),
      sorter: 9000,
    });
  });
  gruppiTaglio.filter(g => !prossimaRevisioneGT(g) && g.stato === "attivo").forEach(g => {
    azioni.push({
      urgenza: "media",
      tipo: "taglio",
      titolo: `Data revisione mancante — ${g.nome}`,
      descrizione: `${g.mezzo} · ${g.dislocazione}`,
      dettaglio: "Inserire la data di revisione nei componenti",
      onClick: () => navigate(`/gruppi-taglio/${g.id}/modifica`),
      sorter: 9001,
    });
  });

  // ── ANNO CORRENTE ────────────────────────
  const annoOggi = new Date().getFullYear();
  kits.filter(k => calcolaStato(k) === "attenzione").forEach(k => {
    const g = giorniAllaScadenza(k.dataRevisione);
    azioni.push({
      urgenza: "media",
      tipo: "cuscini",
      titolo: `Da revisionare nel ${annoOggi} — Kit ${k.numero} ${k.nome}`,
      descrizione: `${k.mezzo} · ${k.dislocazione}`,
      dettaglio: `Scade il ${formatData(k.dataRevisione)} (tra ${g} giorni)`,
      onClick: () => navigate(`/kit/${k.id}`),
      sorter: g + 200,
    });
  });
  gruppiTaglio.filter(g => calcolaStatoGT(g) === "attenzione").forEach(g => {
    const pr = prossimaRevisioneGT(g);
    const gg = giorniAllaScadenza(pr);
    azioni.push({
      urgenza: "media",
      tipo: "taglio",
      titolo: `Da revisionare nel ${annoOggi} — ${g.nome}`,
      descrizione: `${g.mezzo} · ${g.sistema} · ${g.dislocazione}`,
      dettaglio: `Scade il ${formatData(pr)} (tra ${gg} giorni)`,
      onClick: () => navigate(`/gruppi-taglio/${g.id}`),
      sorter: gg + 200,
    });
  });

  azioni.sort((a, b) => (a.sorter??9999) - (b.sorter??9999));

  const urgenti = azioni.filter(a => a.urgenza === "alta");
  const medie   = azioni.filter(a => a.urgenza === "media");

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Da fare</h1>
          <div style={{ fontSize:12, color:"var(--text3)", marginTop:4 }}>
            Azioni pendenti generate automaticamente
          </div>
        </div>
        {azioni.length > 0 && (
          <span style={{ fontSize:13, fontWeight:700, color:"var(--text3)" }}>
            {azioni.length} {azioni.length===1?"azione":"azioni"}
          </span>
        )}
      </div>

      {!azioni.length ? (
        <div style={{
          background:"var(--green-bg)", border:"1px solid #c0dd97",
          borderRadius:"var(--radius)", padding:"40px 24px",
          textAlign:"center",
        }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✓</div>
          <div style={{ fontSize:18, fontWeight:800, color:"var(--green-text)" }}>
            Nessuna azione richiesta
          </div>
          <div style={{ fontSize:13, color:"var(--text2)", marginTop:6 }}>
            Tutti i kit sono in regola. Buona giornata!
          </div>
        </div>
      ) : (
        <>
          {urgenti.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:800, color:"var(--red-text)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:10 }}>
                Urgenti ({urgenti.length})
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {urgenti.map((a, i) => <AzioneCard key={i} {...a}/>)}
              </div>
            </div>
          )}
          {medie.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:"var(--amber-text)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:10 }}>
                Da pianificare ({medie.length})
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {medie.map((a, i) => <AzioneCard key={i} {...a}/>)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}