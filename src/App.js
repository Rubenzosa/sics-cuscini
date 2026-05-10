/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef, useCallback } from "react";
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import KitList from "./pages/KitList";
import KitDetail from "./pages/KitDetail";
import KitForm from "./pages/KitForm";
import Scadenze from "./pages/Scadenze";
import KanbanMezzi from "./pages/KanbanMezzi";
import Rotazioni from "./pages/Rotazioni";
import GruppiTaglioList from "./pages/GruppiTaglioList";
import GruppiTaglioDetail from "./pages/GruppiTaglioDetail";
import GruppiTaglioForm from "./pages/GruppiTaglioForm";
import { getAllKits, seedDatabase, cercaGlobale, getAllGruppiTaglio, seedGruppiTaglio } from "./firebase/service";
import { kitData } from "./data/kitData";
import { gruppiTaglioData } from "./data/gruppiTaglioData";
import { calcolaStato, calcolaStatoGT } from "./utils";
import "./App.css";

// ── RICERCA GLOBALE ─────────────────────────────────────────
function GlobalSearch() {
  const [q, setQ]           = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen]     = useState(false);
  const ref                 = useRef(null);
  const navigate            = useNavigate();

  useEffect(() => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      const res = await cercaGlobale(q);
      setResults(res); setOpen(true);
    }, 220);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(r) {
    setQ(""); setOpen(false);
    navigate("/kit/" + r.kit.id);
  }

  return (
    <div className="global-search-wrap" ref={ref}>
      <span className="global-search-icon">⌕</span>
      <input className="global-search" placeholder="Cerca..."
        value={q} onChange={e => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)} />
      {open && results.length > 0 && (
        <div className="search-results-dropdown">
          {results.map((r, i) => (
            <div key={i} className="search-result-item" onClick={() => handleSelect(r)}>
              <div><span className={"search-result-tipo " + r.tipo}>{r.tipo}</span></div>
              <div className="search-result-label">{r.label}</div>
              <div className="search-result-sub">{r.sub}</div>
            </div>
          ))}
        </div>
      )}
      {open && !results.length && q.length >= 2 && (
        <div className="search-results-dropdown">
          <div className="search-result-item" style={{ color:"var(--text3)", fontSize:13 }}>Nessun risultato per "{q}"</div>
        </div>
      )}
    </div>
  );
}

// ── APP PRINCIPALE ──────────────────────────────────────────
export default function App() {
  const [kits, setKits]               = useState([]);
  const [gruppiTaglio, setGruppiTaglio] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [seeded, setSeeded]           = useState(false);
  const [darkMode, setDarkMode]       = useState(() => localStorage.getItem("theme") === "dark");
  const [sistema, setSistema]         = useState(() => localStorage.getItem("sistema") || "cuscini");

  // Applica tema e sistema
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-sistema", sistema);
    localStorage.setItem("sistema", sistema);
  }, [sistema]);

  const loadAll = useCallback(async () => {
    const [data, gtData] = await Promise.all([getAllKits(), getAllGruppiTaglio()]);

    // Seed cuscini se vuoto
    if (data.length === 0 && !seeded) {
      await seedDatabase(kitData);
      setSeeded(true);
      const fresh = await getAllKits();
      setKits(fresh);
    } else {
      setKits(data);
    }

    // Seed gruppi taglio se vuoto
    if (gtData.length === 0) {
      await seedGruppiTaglio(gruppiTaglioData);
      const freshGT = await getAllGruppiTaglio();
      setGruppiTaglio(freshGT);
    } else {
      setGruppiTaglio(gtData);
    }

    setLoading(false);
  }, [seeded]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Badge critici per sistema
  const criticiCuscini = kits.filter(k => {
    const s = calcolaStato(k);
    return s === "scaduto" || s === "critico" || s === "attenzione";
  }).length;

  const criticiTaglio = gruppiTaglio.filter(g => {
    const s = calcolaStatoGT(g);
    return s === "scaduto" || s === "critico" || s === "attenzione";
  }).length;

  const criticiTotali = criticiCuscini + criticiTaglio;

  // Navbar per sistema
  const navCuscini = [
    { to: "/",         label: "Dashboard", end: true },
    { to: "/kit",      label: "Kit" },
    { to: "/mezzi",    label: "Mezzi" },
    { to: "/scadenze", label: "Scadenze" },
    { to: "/rotazioni",label: "Rotazioni" },
  ];

  const navTaglio = [
    { to: "/",                label: "Dashboard", end: true },
    { to: "/gruppi-taglio",   label: "Gruppi taglio" },
    { to: "/scadenze",        label: "Scadenze" },
  ];

  const navItems = sistema === "taglio" ? navTaglio : navCuscini;

  return (
    <BrowserRouter>
      <div className="app-shell">
        {/* Filigrana */}
        <div style={{
          position:"fixed", inset:0, zIndex:0,
          backgroundImage:"url('/logo78.png')",
          backgroundRepeat:"no-repeat", backgroundPosition:"center center",
          backgroundSize:"380px",
          opacity: darkMode ? 0.04 : 0.07,
          pointerEvents:"none",
          filter: darkMode ? "invert(1)" : "none",
        }}/>

        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-brand">
            <img src="/logo78.png" alt="Logo 78"
              style={{ height:72, width:72, objectFit:"contain", filter:"invert(1) brightness(2)" }}/>
            <span>SICS — VVF Siena</span>
          </div>

          {/* SELETTORE SISTEMA */}
          <div className="sistema-selector">
            <button
              className={`sistema-btn ${sistema === "cuscini" ? "active" : ""}`}
              onClick={() => setSistema("cuscini")}
              style={{ color: sistema === "cuscini" ? "#1a2b3c" : undefined }}
            >
              Cuscini
            </button>
            <button
              className={`sistema-btn taglio ${sistema === "taglio" ? "active" : ""}`}
              onClick={() => setSistema("taglio")}
              style={{ color: sistema === "taglio" ? "#7a3500" : undefined }}
            >
              Gruppi taglio
            </button>
          </div>

          <div className="topbar-right">
            {/* Badge critici totali */}
            {criticiTotali > 0 && (
              <span className="badge-critico">
                {criticiTotali} CRITICI
              </span>
            )}
            {/* Badge per sistema */}
            {sistema === "cuscini" && criticiCuscini > 0 && (
              <span style={{ fontSize:10, background:"rgba(255,255,255,0.15)", color:"#fff", padding:"3px 8px", borderRadius:10 }}>
                C: {criticiCuscini}
              </span>
            )}
            {sistema === "taglio" && criticiTaglio > 0 && (
              <span style={{ fontSize:10, background:"rgba(255,255,255,0.15)", color:"#fff", padding:"3px 8px", borderRadius:10 }}>
                T: {criticiTaglio}
              </span>
            )}
            <GlobalSearch />
            <button className="theme-toggle" onClick={() => setDarkMode(d => !d)}>
              {darkMode ? "☀" : "☾"}
            </button>
          </div>
        </header>

        {/* BANDA SISTEMA */}
        <div style={{
          height: 3,
          background: sistema === "taglio"
            ? "linear-gradient(90deg, #e07020, #7a3500)"
            : "linear-gradient(90deg, #378add, #1a2b3c)",
          transition: "background 0.4s",
        }}/>

        {/* NAVBAR */}
        <nav className="navbar" style={{
          background: sistema === "taglio" ? "#7a3500" : "var(--navy2)",
          transition: "background 0.4s",
        }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({isActive}) => isActive ? "nav-item active" : "nav-item"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* CONTENUTO */}
        <main className="main-content">
          {loading ? (
            <div className="loading">Caricamento dati...</div>
          ) : (
            <Routes>
              {/* Dashboard unificata */}
              <Route path="/" element={
                <Dashboard
                  kits={kits}
                  gruppiTaglio={gruppiTaglio}
                  sistemaAttivo={sistema}
                  setSistema={setSistema}
                />
              }/>
              {/* CUSCINI */}
              <Route path="/kit"                element={<KitList kits={kits} reload={loadAll} />} />
              <Route path="/kit/nuovo"          element={<KitForm kits={kits} reload={loadAll} />} />
              <Route path="/kit/:id"            element={<KitDetail kits={kits} reload={loadAll} />} />
              <Route path="/kit/:id/modifica"   element={<KitForm kits={kits} reload={loadAll} />} />
              <Route path="/mezzi"              element={<KanbanMezzi kits={kits} />} />
              <Route path="/rotazioni"          element={<Rotazioni kits={kits} reload={loadAll} />} />
              {/* GRUPPI TAGLIO */}
              <Route path="/gruppi-taglio"              element={<GruppiTaglioList gruppi={gruppiTaglio} reload={loadAll} />} />
              <Route path="/gruppi-taglio/nuovo"        element={<GruppiTaglioForm gruppi={gruppiTaglio} reload={loadAll} />} />
              <Route path="/gruppi-taglio/:id"          element={<GruppiTaglioDetail gruppi={gruppiTaglio} reload={loadAll} />} />
              <Route path="/gruppi-taglio/:id/modifica" element={<GruppiTaglioForm gruppi={gruppiTaglio} reload={loadAll} />} />
              {/* SCADENZE UNIFICATE */}
              <Route path="/scadenze" element={
                <Scadenze kits={kits} gruppiTaglio={gruppiTaglio} sistemaAttivo={sistema} />
              }/>
            </Routes>
          )}
        </main>

        {/* Banner installa PWA */}
        <PwaBanner />
      </div>
    </BrowserRouter>
  );
}

function PwaBanner() {
  const [prompt, setPrompt]   = useState(null);
  const [show, setShow]       = useState(false);
  useEffect(() => {
    function handler(e) { e.preventDefault(); setPrompt(e); setShow(true); }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  if (!show) return null;
  async function install() {
    if (!prompt) return;
    prompt.prompt();
    const r = await prompt.userChoice;
    if (r.outcome === "accepted") { setShow(false); setPrompt(null); }
  }
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#1a2b3c", color:"#fff", padding:"14px 20px", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, boxShadow:"0 -4px 20px rgba(0,0,0,0.3)", borderTop:"2px solid #378add" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <img src="/logo78.png" alt="SICS" style={{ height:40, width:40, objectFit:"contain", filter:"invert(1) brightness(2)" }}/>
        <div>
          <div style={{ fontWeight:700, fontSize:14 }}>Installa SICS 78</div>
          <div style={{ fontSize:12, color:"#8da4bc" }}>Aggiungi alla schermata home</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={() => setShow(false)} style={{ background:"none", border:"1px solid rgba(255,255,255,0.25)", color:"#fff", borderRadius:8, padding:"6px 12px", fontSize:12, cursor:"pointer" }}>Non ora</button>
        <button onClick={install} style={{ background:"#378add", border:"none", color:"#fff", borderRadius:8, padding:"6px 16px", fontSize:12, fontWeight:700, cursor:"pointer" }}>Installa</button>
      </div>
    </div>
  );
}