import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from "react-router-dom";
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

  useEffect(() => { loadKits(); }, []);

  const critici = kits.filter(k => {
    const s = calcolaStato(k);
    return s === "scaduto" || s === "in_scadenza";
  }).length;

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar">
          <div className="topbar-brand">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8 6 6 10 8 14C9 16 8 18 6 19C10 21 16 20 18 16C20 12 17 8 12 2Z" fill="#378add"/>
              <path d="M12 10C11 12 12 14 13 15C13.5 14 13 12 12 10Z" fill="#85b7eb"/>
            </svg>
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