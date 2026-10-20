import React from "react";

// Numero kit + targa del mezzo, come una targa: si riconosce il kit dal mezzo.
// Targa vuota o non "VF ..." (MAGAZZINO, FUORI SERVIZIO) → variante spenta.
export default function Cartellino({ numero, targa, grande }) {
  const t = (targa || "").trim();
  const spento = !/^VF/i.test(t);
  const cls = "cart" + (grande ? " cart-lg" : "") + (spento ? " cart-off" : "");
  return (
    <span className={cls}>
      <b>KIT {numero}</b>
      <span>{t || "—"}</span>
    </span>
  );
}
