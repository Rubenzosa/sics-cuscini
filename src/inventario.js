// Statistiche e scorta magazzino per la vista KIT. Funzioni pure.

export function contaStats(items, calcStato) {
  const acc = { operativi: 0, inScadenza: 0, scaduti: 0, magazzino: 0 };
  (items || []).forEach(it => {
    if (it.stato === "attivo") acc.operativi += 1;
    if (it.stato === "magazzino") acc.magazzino += 1;
    const s = calcStato(it);
    if (s === "scaduto") acc.scaduti += 1;
    else if (s === "critico" || s === "attenzione") acc.inScadenza += 1;
  });
  return acc;
}

export function scortaMancante(items) {
  return !(items || []).some(it => it.stato === "magazzino");
}
