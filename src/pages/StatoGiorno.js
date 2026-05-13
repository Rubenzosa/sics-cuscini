import React from "react";
import { useNavigate } from "react-router-dom";
import {
  calcolaStato, calcolaStatoGT, statoLabel,
  formatData, giorniAllaScadenza, prossimaRevisioneGT
} from "../utils";

function Ring({ giorni, stato, size = 48 }) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  let pct = 1, color = "#639922";
  if (stato === "scaduto")         { pct = 0;    color = "#e24b4a"; }
  else if (stato === "critico")    { pct = 0.08; color = "#e24b4a"; }
  else if (stato === "attenzione") { pct = 0.35; color = "#ba7517"; }
  else if (stato === "buono")      { pct = 0.70; color = "#639922"; }
  else if (stato === "regolare")   { pct = 1;    color = "#639922"; }
  else { pct = 0.5; color = "#888"; }
  const offset = circ * (1 - pct);
  const label  = giorni === null ? "N/D"
    : giorni < 0 ? "SCAD"
    : giorni > 365 ? "OK"
    : `${giorni}g`;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ position:"absolute", top:0, left:0, transform:"rotate(-90deg)" }}>
        <circle fill="none" stroke="var(--border)" strokeWidth="4" cx={size/2} cy={size/2} r={r}/>
        <circle fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          cx={size/2} cy={size/2} r={r}
          strokeDasharray={circ} strokeDashoffset={offset}/>
      </svg>
      <span style={{ position:"relative", fontSize:9, fontWeight:800, color, lineHeight:1, textAlign:"center" }}>
        {label}
      </span>
    </div>
  );
}

function KitCard({ item, onClick }) {
  const { stato, giorni, nome, sub, tipo, dataRev } = item;
  const isCuscini = tipo === "cuscini";
  const borderColor = stato === "scaduto" || stato === "critico" ? "var(--red)"
    : stato === "attenzione" ? "var(--amber)"
    : "var(--green)";

  return (
    <div onClick={onClick} style={{
      background: "var(--bg2)",
      border: `1px solid var(--border)`,
      borderLeft: `5px solid ${borderColor}`,
      borderRadius: "var(--radius-sm)",
      padding: "14px 16px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 14,
      transition: "transform .15s, box-shadow .15s",
      boxShadow: "var(--shadow)",
    }}
    onMouseOver={e => e.currentTarget.style.transform = "translateY(-1px)"}
    onMouseOut={e => e.currentTarget.style.transform = "none"}
    >
      <Ring giorni={giorni} stato={stato} size={52}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <span style={{ fontWeight:800, fontSize:14, color:"var(--text)" }}>{nome}</span>
          <span style={{
            fontSize:9, fontWeight:800, padding:"2px 6px", borderRadius:8,
            background: isCuscini ? "#1a2b3c" : "#7a3500", color:"#fff",
          }}>
            {isCuscini ? "CUSCINI" : "TAGLIO"}
          </span>
        </div>
        <div style={{ fontSize:12, color:"var(--text3)", marginTop:3 }}>{sub}</div>
        <div style={{ fontSize:11, color:"var(--text3)", marginTop:2 }}>
          Revisione: {formatData(dataRev)}
        </div>
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <span className={`pill ${stato}`}>{statoLabel(stato)}</span>
        <div style={{ fontSize:11, color:"var(--text3)", marginTop:4 }}>
          {giorni === null ? "N/D"
            : giorni < 0 ? <span style={{ color:"var(--red)", fontWeight:700 }}>da {Math.abs(giorni)}gg</span>
            : <span style={{ color: borderColor, fontWeight:600 }}>{giorni}gg</span>
          }
        </div>
      </div>
    </div>
  );
}

function Zona({ titolo, sottotitolo, items, colore, bg, empty }) {
  return (
    <div style={{
      background: bg,
      border: `1px solid ${colore}`,
      borderRadius: "var(--radius)",
      overflow: "hidden",
      marginBottom: 16,
    }}>
      <div style={{ background: colore, padding:"10px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ color:"#fff", fontWeight:800, fontSize:15 }}>{titolo}</div>
          {sottotitolo && <div style={{ color:"rgba(255,255,255,0.75)", fontSize:11, marginTop:2 }}>{sottotitolo}</div>}
        </div>
        <div style={{ background:"rgba(255,255,255,0.2)", color:"#fff", fontWeight:800, fontSize:20, width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {items.length}
        </div>
      </div>
      <div style={{ padding:12, display:"flex", flexDirection:"column", gap:8 }}>
        {!items.length ? (
          <div style={{ textAlign:"center", padding:"16px 0", color:colore, fontSize:13, fontWeight:600 }}>
            {empty}
          </div>
        ) : items.map((item, i) => (
          <KitCard key={item.id + i} item={item} onClick={item.onClick}/>
        ))}
      </div>
    </div>
  );
}

export default function StatoGiorno({ kits, gruppiTaglio, sistema }) {
  const navigate = useNavigate();

  // Filtra per sistema
  const showCuscini = !sistema || sistema === "cuscini";
  const showTaglio  = !sistema || sistema === "taglio";

  // Costruisce lista unificata (escludi fuori_uso dalla lista principale)
  const tutti = [
    ...(showCuscini ? kits.filter(k => k.stato !== "fuori_servizio" && k.stato !== "fuori_uso").map(k => ({
      id: k.id, tipo:"cuscini",
      nome: `Kit ${k.numero} — ${k.nome}`,
      sub: `${k.mezzo} · ${k.bar} bar · ${k.dislocazione}`,
      dataRev: k.dataRevisione,
      stato: calcolaStato(k),
      giorni: giorniAllaScadenza(k.dataRevisione),
      onClick: () => navigate(`/kit/${k.id}`),
    })) : []),
    ...(showTaglio ? gruppiTaglio.filter(g => g.stato !== "fuori_servizio" && g.stato !== "fuori_uso").map(g => ({
      id: g.id, tipo:"taglio",
      nome: g.nome,
      sub: `${g.mezzo} · ${g.sistema} · ${g.dislocazione}`,
      dataRev: prossimaRevisioneGT(g),
      stato: calcolaStatoGT(g),
      giorni: giorniAllaScadenza(prossimaRevisioneGT(g)),
      onClick: () => navigate(`/gruppi-taglio/${g.id}`),
    })) : []),
  ].sort((a,b) => (a.giorni??9999) - (b.giorni??9999));

  const rossi   = tutti.filter(i => i.stato === "scaduto" || i.stato === "critico");
  const gialli  = tutti.filter(i => i.stato === "attenzione");
  const verdi   = tutti.filter(i => i.stato === "buono" || i.stato === "regolare");
  const altri   = tutti.filter(i => !["scaduto","critico","attenzione","buono","regolare"].includes(i.stato));

  const annoOggi = new Date().getFullYear();
  const tutto_ok = !rossi.length && !gialli.length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Stato del giorno</h1>
          <div style={{ fontSize:12, color:"var(--text3)", marginTop:4 }}>
            {new Date().toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
          </div>
        </div>
        <div style={{ fontSize:13, fontWeight:600, color:"var(--text3)" }}>
          {kits.length + gruppiTaglio.length} kit totali
        </div>
      </div>

      {tutto_ok && (
        <div style={{
          background:"var(--green-bg)", border:"1px solid #c0dd97",
          borderRadius:"var(--radius)", padding:"20px 24px",
          textAlign:"center", marginBottom:20,
        }}>
          <div style={{ fontSize:32, marginBottom:8 }}>✓</div>
          <div style={{ fontSize:16, fontWeight:800, color:"var(--green-text)" }}>
            Tutto in regola
          </div>
          <div style={{ fontSize:13, color:"var(--text2)", marginTop:4 }}>
            Nessuna revisione urgente. Buona giornata!
          </div>
        </div>
      )}

      <Zona
        titolo="Attenzione richiesta"
        sottotitolo="Scaduti e scadenze entro 3 mesi"
        items={rossi}
        colore="#e24b4a"
        bg="var(--red-bg)"
        empty="✓ Nessuna scadenza urgente"
      />

      <Zona
        titolo={`Pianificare nel ${annoOggi}`}
        sottotitolo="Scadenze nell'anno corrente"
        items={gialli}
        colore="#ba7517"
        bg="var(--amber-bg)"
        empty={`✓ Nessuna scadenza nel ${annoOggi}`}
      />

      <Zona
        titolo="In regola"
        sottotitolo="Scadenze anno prossimo e oltre"
        items={verdi}
        colore="#639922"
        bg="var(--green-bg)"
        empty="—"
      />

      {altri.length > 0 && (
        <Zona
          titolo="Altri stati"
          sottotitolo="Magazzino, in revisione, senza data"
          items={altri.map(i => ({ ...i, onClick: i.onClick }))}
          colore="#888"
          bg="var(--gray-bg)"
          empty="—"
        />
      )}

      {/* FUORI USO — sezione separata */}
      {(showCuscini ? kits.filter(k => k.stato === "fuori_uso") : []).concat(
        showTaglio ? gruppiTaglio.filter(g => g.stato === "fuori_uso") : []
      ).length > 0 && (
        <div style={{
          background:"#111", border:"1px solid #333",
          borderRadius:"var(--radius)", overflow:"hidden", marginBottom:16,
        }}>
          <div style={{ background:"#222", padding:"10px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ color:"#aaa", fontWeight:800, fontSize:14 }}>⛔ Fuori uso — dismessi definitivamente</div>
              <div style={{ color:"#666", fontSize:11, marginTop:2 }}>Richiede documento di notifica allegato</div>
            </div>
          </div>
          <div style={{ padding:12, display:"flex", flexDirection:"column", gap:8 }}>
            {(showCuscini ? kits.filter(k => k.stato === "fuori_uso") : [])
              .concat(showTaglio ? gruppiTaglio.filter(g => g.stato === "fuori_uso") : [])
              .map((item, i) => {
                const isKit = "dataRevisione" in item;
                return (
                  <div key={item.id} onClick={() => navigate(isKit ? `/kit/${item.id}` : `/gruppi-taglio/${item.id}`)}
                    style={{ background:"#1a1a1a", border:"1px solid #333", borderRadius:"var(--radius-sm)", padding:"12px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:18 }}>⛔</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13, color:"#888" }}>
                        {isKit ? `Kit ${item.numero} — ${item.nome}` : item.nome}
                      </div>
                      <div style={{ fontSize:11, color:"#555", marginTop:2 }}>{item.mezzo} · {item.dislocazione}</div>
                    </div>
                    <span className="pill fuori_uso" style={{ marginLeft:"auto" }}>Fuori uso</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}