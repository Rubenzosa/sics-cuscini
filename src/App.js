/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef, useCallback } from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from "react-router-dom";

// Pages
import KitView from "./pages/KitView";
import KitDetail from "./pages/KitDetail";
import KitForm from "./pages/KitForm";
import GruppiTaglioDetail from "./pages/GruppiTaglioDetail";
import GruppiTaglioForm from "./pages/GruppiTaglioForm";
import Calendario from "./pages/Calendario";
import AdminReset from "./pages/AdminReset";
import Rinumerazione from "./pages/Rinumerazione";
import Backup from "./pages/Backup";

// Firebase
import { getAllKits, cercaGlobale, getAllGruppiTaglio } from "./firebase/service";
import { calcolaStato, calcolaStatoGT } from "./utils";
import "./App.css";

// eslint-disable-next-line no-unused-vars
// ── RICERCA GLOBALE ─────────────────────────────────────────
function GlobalSearch({ compact }) {
  const [q, setQ]         = useState("");
  const [results, setR]   = useState([]);
  const [open, setOpen]   = useState(false);
  const ref               = useRef(null);
  const navigate          = useNavigate();

  useEffect(() => {
    if (q.length < 2) { setR([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      const res = await cercaGlobale(q);
      setR(res); setOpen(true);
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div className="global-search-wrap" ref={ref}
      style={compact ? { maxWidth:200 } : {}}>
      <span className="global-search-icon">⌕</span>
      <input className="global-search"
        placeholder={compact ? "Cerca..." : "Cerca kit, matricola, mezzo..."}
        value={q}
        onChange={e => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}/>
      {open && (
        <div className="search-results-dropdown">
          {results.length > 0 ? results.map((r, i) => (
            <div key={i} className="search-result-item"
              onClick={() => { setQ(""); setOpen(false); navigate(`/kit/${r.kit.id}`); }}>
              <div><span className={"search-result-tipo " + r.tipo}>{r.tipo}</span></div>
              <div className="search-result-label">{r.label}</div>
              <div className="search-result-sub">{r.sub}</div>
            </div>
          )) : (
            <div className="search-result-item" style={{ color:"var(--text3)", fontSize:13 }}>
              Nessun risultato per "{q}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── BARRA RICERCA FISSA SOTTO NAVBAR ───────────────────────
function SearchBar() {
  const [q, setQ]       = useState("");
  const [results, setR] = useState([]);
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);
  const navigate        = useNavigate();
  const location        = useLocation();

  // Reset ricerca al cambio pagina
  useEffect(() => { setQ(""); setR([]); setOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (q.length < 2) { setR([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      const res = await cercaGlobale(q);
      setR(res); setOpen(true);
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div style={{ background:"var(--bg)", padding:"8px 24px 0", position:"sticky", top:80+40, zIndex:90 }} ref={ref}>
      <div style={{ position:"relative", maxWidth:600 }}>
        <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"var(--text3)", fontSize:14, pointerEvents:"none" }}>⌕</span>
        <input
          style={{
            width:"100%", padding:"9px 14px 9px 38px",
            border:"1px solid var(--border2)", borderRadius:20,
            fontSize:13, fontFamily:"inherit",
            background:"var(--bg2)", color:"var(--text)", outline:"none",
            boxShadow:"0 1px 6px rgba(0,0,0,.06)",
          }}
          placeholder="Cerca kit, matricola, mezzo, modello..."
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
        />
        {q && (
          <button onClick={() => { setQ(""); setR([]); setOpen(false); }}
            style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text3)", fontSize:16 }}>
            ✕
          </button>
        )}
        {open && (
          <div className="search-results-dropdown" style={{ top:"calc(100% + 6px)" }}>
            {results.length > 0 ? results.map((r, i) => (
              <div key={i} className="search-result-item"
                onClick={() => { setQ(""); setOpen(false); navigate(`/kit/${r.kit.id}`); }}>
                <div><span className={"search-result-tipo " + r.tipo}>{r.tipo}</span></div>
                <div className="search-result-label">{r.label}</div>
                <div className="search-result-sub">{r.sub}</div>
              </div>
            )) : (
              <div className="search-result-item" style={{ color:"var(--text3)", fontSize:13 }}>
                Nessun risultato per "{q}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── APP ─────────────────────────────────────────────────────
export default function App() {
  const [kits, setKits]                 = useState([]);
  const [gruppiTaglio, setGruppiTaglio] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [darkMode, setDarkMode]         = useState(() => localStorage.getItem("theme") === "dark");
  const [sistema, setSistema]           = useState(() => localStorage.getItem("sistema") || "cuscini");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-sistema", sistema);
    localStorage.setItem("sistema", sistema);
  }, [sistema]);

  // NIENTE SEED AUTOMATICO QUI.
  // Una lettura che torna 0 documenti non significa "database vuoto": con la
  // PWA installata l'avvio senza rete risolve dalla cache locale vuota e
  // restituisce 0 documenti senza errore. Il seed automatico che ne seguiva
  // riscriveva Firestore col file locale (setDoc = sovrascrittura totale),
  // cancellando revisioni e stati dei componenti reali (25/08/2026 15:40).
  // Il seed resta disponibile solo come azione manuale in /admin-reset.
  const loadAll = useCallback(async () => {
    const [data, gtData] = await Promise.all([getAllKits(), getAllGruppiTaglio()]);
    setKits(data);
    setGruppiTaglio(gtData);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Badge critici
  const criticiTotali = [
    ...kits.filter(k => ["scaduto","critico","attenzione"].includes(calcolaStato(k))),
    ...gruppiTaglio.filter(g => ["scaduto","critico","attenzione"].includes(calcolaStatoGT(g))),
  ].length;

  const daFareTotali = [
    ...kits.filter(k => ["scaduto","critico"].includes(calcolaStato(k))),
    ...gruppiTaglio.filter(g => ["scaduto","critico"].includes(calcolaStatoGT(g))),
    ...kits.filter(k => k.stato === "in_revisione" && k.dataRientroStimata && (giorniAllaScadenza(k.dataRientroStimata)??0) < 0),
  ].length;

  const annoCorrente = new Date().getFullYear();
  const acquistiTotali = [
    ...kits.filter(k => k.stato === "fuori_uso" || (k.annoAcquisto && annoCorrente - k.annoAcquisto >= 10)),
    ...gruppiTaglio.filter(g => g.stato === "fuori_uso" || (g.annoAcquisto && annoCorrente - g.annoAcquisto >= 10)),
  ].length;

  // Navbar semplificata per sistema
  const navCuscini = [
    { to:"/",          label:"Stato",      end:true },
    { to:"/da-fare",   label:"Da fare",    badge: daFareTotali },
    { to:"/kit",       label:"Kit" },
    { to:"/mezzi",     label:"Mezzi" },
    { to:"/archivio",  label:"Archivio" },
    { to:"/acquisti",  label:"Acquisti",   badge: acquistiTotali },
  ];
  const navTaglio = [
    { to:"/",          label:"Stato",      end:true },
    { to:"/da-fare",   label:"Da fare",    badge: daFareTotali },
    { to:"/gruppi-taglio", label:"Kit" },
    { to:"/mezzi-taglio",  label:"Mezzi" },
    { to:"/archivio",  label:"Archivio" },
    { to:"/acquisti",  label:"Acquisti",   badge: acquistiTotali },
  ];
  const navItems = sistema === "taglio" ? navTaglio : navCuscini;

  function giorniAllaScadenza(d) {
    if (!d) return null;
    return Math.floor((new Date(d) - new Date()) / 86400000);
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        {/* Filigrana */}
        <div style={{
          position:"fixed", inset:0, zIndex:0,
          backgroundImage:"url('/logo78.png')",
          backgroundRepeat:"no-repeat", backgroundPosition:"center center",
          backgroundSize:"340px", opacity:darkMode?0.03:0.05,
          pointerEvents:"none",
        }}/>

        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-brand">
            <img src="/logo78.png" alt="Logo 78"
              style={{ height:56, width:56, objectFit:"contain" }}/>
            <span>SICS — VVF Siena</span>
          </div>

          {/* Selettore sistema */}
          <div className="sistema-selector">
            <button
              className={`sistema-btn ${sistema==="cuscini"?"active":""}`}
              onClick={() => setSistema("cuscini")}>
              Cuscini
            </button>
            <button
              className={`sistema-btn taglio ${sistema==="taglio"?"active":""}`}
              onClick={() => setSistema("taglio")}>
              Taglio
            </button>
          </div>

          <div className="topbar-right">
            {criticiTotali > 0 && (
              <span className="badge-critico">{criticiTotali} CRITICI</span>
            )}
            <button className="theme-toggle"
              onClick={() => setDarkMode(d => !d)}>
              {darkMode ? "☀" : "☾"}
            </button>
            <AdminLink/>
          </div>
        </header>

        {/* Banda sistema */}
        <div style={{
          height:3,
          background: sistema==="taglio"
            ? "linear-gradient(90deg,var(--taglio),var(--amber-text))"
            : "linear-gradient(90deg,var(--cuscini),var(--blue-text))",
          transition:"background .4s",
        }}/>

        {/* TOGGLE VISTA */}
        <nav className="navbar" style={{ padding: "8px 24px", gap: 8 }}>
          <NavLink to="/" end className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>KIT</NavLink>
          <NavLink to="/calendario" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>Calendario</NavLink>
        </nav>

        {/* CONTENUTO */}
        <main className="main-content" style={{ paddingTop:16 }}>
          {loading ? (
            <div style={{ padding:"0 4px" }}>
              <div className="shimmer" style={{ height:22, width:"38%", marginBottom:20 }}/>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
                {[...Array(6)].map((_,i) => (
                  <div key={i} className="card" style={{ padding:"14px 16px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                      <div className="shimmer" style={{ height:34, width:34, borderRadius:6 }}/>
                      <div className="shimmer" style={{ height:52, width:52, borderRadius:"50%" }}/>
                    </div>
                    <div className="shimmer" style={{ height:14, width:"75%", marginBottom:8 }}/>
                    <div className="shimmer" style={{ height:11, width:"55%", marginBottom:14 }}/>
                    <div className="shimmer" style={{ height:22, width:70, borderRadius:20 }}/>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Routes>
              {/* HOME — vista KIT del sistema attivo */}
              <Route path="/" element={<KitView kits={kits} gruppiTaglio={gruppiTaglio} sistema={sistema} reload={loadAll}/>}/>

              {/* CALENDARIO */}
              <Route path="/calendario" element={<Calendario kits={kits} gruppiTaglio={gruppiTaglio}/>}/>

              {/* CUSCINI — dettaglio/form raggiungibili da KitView */}
              <Route path="/kit/nuovo"        element={<KitForm kits={kits} reload={loadAll}/>}/>
              <Route path="/kit/:id"          element={<KitDetail kits={kits} reload={loadAll}/>}/>
              <Route path="/kit/:id/modifica" element={<KitForm kits={kits} reload={loadAll}/>}/>

              {/* GRUPPI TAGLIO — dettaglio/form */}
              <Route path="/gruppi-taglio/nuovo"        element={<GruppiTaglioForm gruppi={gruppiTaglio} reload={loadAll}/>}/>
              <Route path="/gruppi-taglio/:id"          element={<GruppiTaglioDetail gruppi={gruppiTaglio} reload={loadAll}/>}/>
              <Route path="/gruppi-taglio/:id/modifica" element={<GruppiTaglioForm gruppi={gruppiTaglio} reload={loadAll}/>}/>

              {/* ADMIN */}
              <Route path="/admin-reset" element={<AdminReset/>}/>
              <Route path="/admin/rinumerazione" element={<Rinumerazione reload={loadAll}/>}/>
              <Route path="/admin/backup" element={<Backup reload={loadAll}/>}/>

              {/* Redirect delle vecchie tab rimosse */}
              <Route path="/kit" element={<Navigate to="/" replace/>}/>
              <Route path="/gruppi-taglio" element={<Navigate to="/" replace/>}/>
              <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
          )}
        </main>

        <PwaBanner/>
      </div>
    </BrowserRouter>
  );
}

// ── LINK AMMINISTRAZIONE ────────────────────────────────────
function AdminLink() {
  const navigate = useNavigate();
  return (
    <button className="theme-toggle" title="Amministrazione"
      onClick={() => navigate("/admin/rinumerazione")}>⚙</button>
  );
}

// ── PWA BANNER ──────────────────────────────────────────────
function PwaBanner() {
  const [prompt, setP] = useState(null);
  const [show, setS]   = useState(false);
  useEffect(() => {
    const fn = e => { e.preventDefault(); setP(e); setS(true); };
    window.addEventListener("beforeinstallprompt", fn);
    return () => window.removeEventListener("beforeinstallprompt", fn);
  }, []);
  if (!show) return null;
  async function install() {
    if (!prompt) return;
    prompt.prompt();
    const r = await prompt.userChoice;
    if (r.outcome === "accepted") { setS(false); setP(null); }
  }
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"var(--bg)", color:"var(--text)", padding:"12px 20px", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, boxShadow:"0 -4px 20px rgba(0,0,0,.25)", borderTop:"2px solid var(--accent)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <img src="/logo78.png" alt="" style={{ height:36, width:36, objectFit:"contain" }}/>
        <div>
          <div style={{ fontWeight:700, fontSize:13 }}>Installa SICS 78</div>
          <div style={{ fontSize:11, color:"var(--text2)" }}>Aggiungi alla schermata home</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={() => setS(false)} style={{ background:"var(--bg)", boxShadow:"var(--neu-out)", border:"none", color:"var(--text2)", borderRadius:8, padding:"5px 12px", fontSize:11, cursor:"pointer" }}>Non ora</button>
        <button onClick={install} style={{ background:"var(--accent)", border:"none", color:"#fff", borderRadius:8, padding:"5px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}>Installa</button>
      </div>
    </div>
  );
}