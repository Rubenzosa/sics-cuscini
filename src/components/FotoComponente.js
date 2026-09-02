import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { salvaFotoComponente, eliminaFotoComponente } from "../firebase/service";
import { ridimensionaImmagine } from "../foto";

// Miniatura foto di un singolo componente (cuscino, tubo, riduttore, ...).
// Nessuna foto -> pulsante "＋ Foto". Foto presente -> miniatura, tap = lightbox.
// entitaId = id kit oppure id gruppo taglio. Una sola foto per componente.
export default function FotoComponente({ entitaId, compIndex, comp, foto, onChange }) {
  const [busy, setBusy] = useState(false);
  const [aperto, setAperto] = useState(false);
  const inputRef = useRef(null);

  const chiudi = useCallback(() => setAperto(false), []);

  useEffect(() => {
    if (!aperto) return;
    const onKey = e => { if (e.key === "Escape") chiudi(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aperto, chiudi]);

  async function scegliFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const dataUri = await ridimensionaImmagine(file);
      await salvaFotoComponente(
        entitaId, compIndex,
        { tipo: comp && comp.tipo, matricola: comp && comp.matricola },
        dataUri,
      );
      if (onChange) await onChange();
    } catch (err) {
      alert("Errore nel caricamento della foto: " + (err && err.message ? err.message : err));
    }
    setBusy(false);
  }

  async function rimuovi() {
    if (!foto) return;
    if (!window.confirm("Rimuovere la foto di questo componente?")) return;
    setBusy(true);
    try {
      await eliminaFotoComponente(foto.id);
      if (onChange) await onChange();
      setAperto(false);
    } catch (err) {
      alert("Errore nella rimozione: " + (err && err.message ? err.message : err));
    }
    setBusy(false);
  }

  const didascalia = [comp && comp.tipo, comp && comp.matricola].filter(Boolean).join(" · ");

  return (
    <div className="fcomp">
      <input ref={inputRef} type="file" accept="image/*"
        style={{ display: "none" }} onChange={scegliFile} />

      {foto ? (
        <button type="button" className="fcomp-thumb" disabled={busy}
          onClick={() => setAperto(true)} aria-label="Apri la foto del componente">
          <img src={foto.dataUri} alt={(comp && comp.tipo) || "Foto componente"} loading="lazy" />
        </button>
      ) : (
        <button type="button" className="fcomp-add" disabled={busy}
          onClick={() => inputRef.current && inputRef.current.click()}>
          <span className="fcomp-add-ico" aria-hidden="true">+</span>
          {busy ? "Carico…" : "Foto"}
        </button>
      )}

      {aperto && foto && createPortal(
        // Portal su <body>: la card ha transform sull'hover, che intrappolerebbe
        // il position:fixed limitandolo al riquadro della card invece del viewport.
        <div className="fcomp-lb" role="dialog" aria-modal="true" onClick={chiudi}>
          <div className="fcomp-lb-box" onClick={e => e.stopPropagation()}>
            <img className="fcomp-lb-img" src={foto.dataUri}
              alt={(comp && comp.tipo) || "Foto componente"} />
            {didascalia && <div className="fcomp-lb-cap">{didascalia}</div>}
            <div className="fcomp-lb-acts">
              <button type="button" className="btn btn-secondary" disabled={busy}
                onClick={() => inputRef.current && inputRef.current.click()}>
                {busy ? "Carico…" : "Sostituisci"}
              </button>
              <button type="button" className="btn btn-danger" disabled={busy} onClick={rimuovi}>
                Rimuovi
              </button>
              <button type="button" className="btn btn-primary" onClick={chiudi}>Chiudi</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
