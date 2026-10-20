import React, { useEffect, useRef, useState } from "react";

// Menu a tendina per azioni secondarie (Esporta, ⋯). Si chiude dopo la scelta o al clic fuori.
export default function MenuAzioni({ etichetta, voci }) {
  const [aperto, setAperto] = useState(false);
  const [versoDestra, setVersoDestra] = useState(false);
  const ref = useRef(null);

  // Il menu si apre verso sinistra; se il pulsante sta nella metà sinistra dello schermo
  // (es. "Esporta" che va a capo su telefono) si apre verso destra, altrimenti esce dal bordo.
  function apriChiudi() {
    if (!aperto && ref.current) setVersoDestra(ref.current.getBoundingClientRect().left < window.innerWidth / 2);
    setAperto(a => !a);
  }

  useEffect(() => {
    if (!aperto) return;
    const fuori = e => { if (ref.current && !ref.current.contains(e.target)) setAperto(false); };
    document.addEventListener("mousedown", fuori);
    return () => document.removeEventListener("mousedown", fuori);
  }, [aperto]);

  return (
    <span className="menu-az" ref={ref}>
      <button type="button" className="btn btn-secondary" aria-haspopup="menu" aria-expanded={aperto}
        onClick={apriChiudi}>
        {etichetta}
      </button>
      {aperto && (
        <span className={versoDestra ? "menu-az-lista dx" : "menu-az-lista"} role="menu">
          {voci.map(v => (
            <button key={v.label} type="button" role="menuitem"
              className={v.danger ? "menu-az-voce danger" : "menu-az-voce"}
              onClick={() => { setAperto(false); v.onClick(); }}>
              {v.label}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}
