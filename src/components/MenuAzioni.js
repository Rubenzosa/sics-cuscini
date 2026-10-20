import React, { useEffect, useRef, useState } from "react";

// Menu a tendina per azioni secondarie (Esporta, ⋯). Si chiude dopo la scelta o al clic fuori.
export default function MenuAzioni({ etichetta, voci }) {
  const [aperto, setAperto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!aperto) return;
    const fuori = e => { if (ref.current && !ref.current.contains(e.target)) setAperto(false); };
    document.addEventListener("mousedown", fuori);
    return () => document.removeEventListener("mousedown", fuori);
  }, [aperto]);

  return (
    <span className="menu-az" ref={ref}>
      <button type="button" className="btn btn-secondary" aria-haspopup="menu" aria-expanded={aperto}
        onClick={() => setAperto(a => !a)}>
        {etichetta}
      </button>
      {aperto && (
        <span className="menu-az-lista" role="menu">
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
