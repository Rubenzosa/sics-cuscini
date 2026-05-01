import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import KitList from "./pages/KitList";
import KitDetail from "./pages/KitDetail";
import KitForm from "./pages/KitForm";
import Scadenze from "./pages/Scadenze";
import { getAllKits } from "./firebase/service";
import { seedDatabase } from "./firebase/service";
import { kitData } from "./data/kitData";
import { calcolaStato } from "./utils";
import "./App.css";

export default function App() {
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);

  async function loadKits() {
    const data = await getAllKits();
    if (data.length === 0 && !seeded) {
      await seedDatabase(kitData);
      setSeeded(true);
      const fresh = await getAllKits();
      setKits(fresh);
    } else {
      setKits(data);
    }
    setLoading(false);
  }

  useEffect(() => { loadKits(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const critici = kits.filter(k => {
    const s = calcolaStato(k);
    return s === "scaduto" || s === "critico" || s === "attenzione";
  }).length;

  return (
    <BrowserRouter>
      <div className="app-shell">
        <div style={{
          position: "fixed", inset: 0, zIndex: 0,
          backgroundImage: "url('/logo78.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundSize: "400px",
          opacity: 0.07,
          pointerEvents: "none",
        }}/>
        <header className="topbar">
          <div className="topbar-brand">
            <img src="/logo78.png" alt="Logo 78" style={{ height: 72, width: 72, objectFit: "contain", filter: "invert(1) brightness(2)" }} />
            <span>SICS — Cuscini di Sollevamento</span>
          </div>
          <div className="topbar-right">
            {critici > 0 && (
              <span className="badge-critico">{critici} {critici === 1 ? "KIT CRITICO" : "KIT CRITICI"}</span>
            )}
          </div>
        </header>

        <nav className="navbar">
          <NavLink to="/" end className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>Dashboard</NavLink>
          <NavLink to="/kit" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>KIT</NavLink>
          <NavLink to="/scadenze" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>Scadenze</NavLink>
        </nav>

        <main className="main-content">
          {loading ? (
            <div className="loading">Caricamento dati...</div>
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard kits={kits} />} />
              <Route path="/kit" element={<KitList kits={kits} reload={loadKits} />} />
              <Route path="/kit/:id" element={<KitDetail kits={kits} reload={loadKits} />} />
              <Route path="/kit/nuovo" element={<KitForm reload={loadKits} />} />
              <Route path="/kit/:id/modifica" element={<KitForm kits={kits} reload={loadKits} />} />
              <Route path="/scadenze" element={<Scadenze kits={kits} />} />
            </Routes>
          )}import React, { useEffect, useState, useRef, useCallback } from "react";
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import KitList from "./pages/KitList";
import KitDetail from "./pages/KitDetail";
import KitForm from "./pages/KitForm";
import Scadenze from "./pages/Scadenze";
import KanbanMezzi from "./pages/KanbanMezzi";
import { getAllKits, seedDatabase, cercaGlobale } from "./firebase/service";
import { kitData } from "./data/kitData";
import { calcolaStato } from "./utils";
import "./App.css";

function GlobalSearch({ kits }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      const res = await cercaGlobale(q);
      setResults(res);
      setOpen(true);
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
    navigate(`/kit/${r.kit.id}`);
  }

  return (
    <div className="global-search-wrap" ref={ref}>
      <span className="global-search-icon">⌕</span>
      <input
        className="global-search"
        placeholder="Cerca kit, componenti, matricole..."
        value={q}
        onChange={e => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="search-results-dropdown">
          {results.map((r, i) => (
            <div key={i} className="search-result-item" onClick={() => handleSelect(r)}>
              <div><span className={`search-result-tipo ${r.tipo}`}>{r.tipo}</span></div>
              <div className="search-result-label">{r.label}</div>
              <div className="search-result-sub">{r.sub}</div>
            </div>
          ))}
        </div>
      )}
      {open && results.length === 0 && q.length >= 2 && (
        <div className="search-results-dropdown">
          <div className="search-result-item" style={{ color: "var(--text3)", fontSize: 13 }}>Nessun risultato per "{q}"</div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const loadKits = useCallback(async () => {
    const data = await getAllKits();
    if (data.length === 0 && !seeded) {
      await seedDatabase(kitData);
      setSeeded(true);
      const fresh = await getAllKits();
      setKits(fresh);
    } else {
      setKits(data);
    }
    setLoading(false);
  }, [seeded]);

  useEffect(() => { loadKits(); }, [loadKits]);

  const critici = kits.filter(k => {
    const s = calcolaStato(k);
    return s === "scaduto" || s === "critico" || s === "attenzione";
  }).length;

  return (
    <BrowserRouter>
      <div className="app-shell">
        <div style={{
          position: "fixed", inset: 0, zIndex: 0,
          backgroundImage: "url('/logo78.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundSize: "380px",
          opacity: darkMode ? 0.04 : 0.07,
          pointerEvents: "none",
          filter: darkMode ? "invert(1)" : "none",
        }}/>

        <header className="topbar">
          <div className="topbar-brand">
            <img src="/logo78.png" alt="Logo 78" style={{ height: 72, width: 72, objectFit: "contain", filter: "invert(1) brightness(2)" }} />
            <span>SICS — Cuscini di Sollevamento</span>
          </div>
          <GlobalSearch kits={kits} />
          <div className="topbar-right">
            {critici > 0 && (
              <span className="badge-critico">{critici} {critici === 1 ? "CRITICO" : "CRITICI"}</span>
            )}
            <button className="theme-toggle" onClick={() => setDarkMode(d => !d)}>
              {darkMode ? "☀ Chiaro" : "☾ Scuro"}
            </button>
          </div>
        </header>

        <nav className="navbar">
          <NavLink to="/" end className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>Dashboard</NavLink>
          <NavLink to="/kit" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>KIT</NavLink>
          <NavLink to="/mezzi" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>Mezzi</NavLink>
          <NavLink to="/scadenze" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>Scadenze</NavLink>
        </nav>

        <main className="main-content">
          {loading ? (
            <div className="loading">Caricamento dati...</div>
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard kits={kits} />} />
              <Route path="/kit" element={<KitList kits={kits} reload={loadKits} />} />
              <Route path="/kit/nuovo" element={<KitForm kits={kits} reload={loadKits} />} />
              <Route path="/kit/:id" element={<KitDetail kits={kits} reload={loadKits} />} />
              <Route path="/kit/:id/modifica" element={<KitForm kits={kits} reload={loadKits} />} />
              <Route path="/mezzi" element={<KanbanMezzi kits={kits} />} />
              <Route path="/scadenze" element={<Scadenze kits={kits} />} />
            </Routes>
          )}
        </main>
      </div>
    </BrowserRouter>
  );
}
        </main>
      </div>
    </BrowserRouter>
  );
}