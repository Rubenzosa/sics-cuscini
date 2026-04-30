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
            <img src="/logo78.png" alt="Logo 78" style={{ height: 44, width: 44, objectFit: "contain", filter: "invert(1) brightness(2)" }} />
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
          )}
        </main>
      </div>
    </BrowserRouter>
  );
}