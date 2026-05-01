/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef, useCallback } from "react";
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

function GlobalSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await cercaGlobale(q);
      setResults(res);
      setOpen(true);
    }, 220);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(r) {
    setQ("");
    setOpen(false);
    navigate("/kit/" + r.kit.id);
  }

  return (
    <div className="global-search-wrap" ref={ref}>
      <span className="global-search-icon">&#9906;</span>
      <input
        className="global-search"
        placeholder="Cerca kit, componenti, matricole..."
        value={q}
        onChange={function(e) { setQ(e.target.value); }}
        onFocus={function() { if (results.length) setOpen(true); }}
      />
      {open && results.length > 0 && (
        <div className="search-results-dropdown">
          {results.map(function(r, i) {
            return (
              <div key={i} className="search-result-item" onClick={function() { handleSelect(r); }}>
                <div><span className={"search-result-tipo " + r.tipo}>{r.tipo}</span></div>
                <div className="search-result-label">{r.label}</div>
                <div className="search-result-sub">{r.sub}</div>
              </div>
            );
          })}
        </div>
      )}
      {open && results.length === 0 && q.length >= 2 && (
        <div className="search-results-dropdown">
          <div className="search-result-item" style={{ color: "var(--text3)", fontSize: 13 }}>
            Nessun risultato per "{q}"
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const [darkMode, setDarkMode] = useState(
    function() { return localStorage.getItem("theme") === "dark"; }
  );

  useEffect(function() {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const loadKits = useCallback(async function() {
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

  useEffect(function() { loadKits(); }, [loadKits]);

  const critici = kits.filter(function(k) {
    const s = calcolaStato(k);
    return s === "scaduto" || s === "critico" || s === "attenzione";
  }).length;

  return (
    <BrowserRouter>
      <div className="app-shell">
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage: "url('/logo78.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundSize: "380px",
          opacity: darkMode ? 0.04 : 0.07,
          pointerEvents: "none",
          filter: darkMode ? "invert(1)" : "none",
        }} />

        <header className="topbar">
          <div className="topbar-brand">
            <img
              src="/logo78.png"
              alt="Logo 78"
              style={{ height: 72, width: 72, objectFit: "contain", filter: "invert(1) brightness(2)" }}
            />
            <span>SICS — Cuscini di Sollevamento</span>
          </div>
          <GlobalSearch />
          <div className="topbar-right">
            {critici > 0 && (
              <span className="badge-critico">
                {critici} {critici === 1 ? "CRITICO" : "CRITICI"}
              </span>
            )}
            <button className="theme-toggle" onClick={function() { setDarkMode(function(d) { return !d; }); }}>
              {darkMode ? "Chiaro" : "Scuro"}
            </button>
          </div>
        </header>

        <nav className="navbar">
          <NavLink to="/" end className={function(a) { return a.isActive ? "nav-item active" : "nav-item"; }}>
            Dashboard
          </NavLink>
          <NavLink to="/kit" className={function(a) { return a.isActive ? "nav-item active" : "nav-item"; }}>
            KIT
          </NavLink>
          <NavLink to="/mezzi" className={function(a) { return a.isActive ? "nav-item active" : "nav-item"; }}>
            Mezzi
          </NavLink>
          <NavLink to="/scadenze" className={function(a) { return a.isActive ? "nav-item active" : "nav-item"; }}>
            Scadenze
          </NavLink>
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