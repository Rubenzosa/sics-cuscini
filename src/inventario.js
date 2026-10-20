// Statistiche e scorta magazzino per la vista KIT. Funzioni pure.
import { calcolaStato, calcolaStatoGT, prossimaRevisioneGT, giorniAllaScadenza, componenteAttivoGT, formatData } from "./utils";

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

// Problemi da mostrare in "Da fare", ordinati per urgenza:
// revisione scaduta → componenti fermi → revisione in scadenza.
// Un kit con più problemi produce più righe. Esclusi i dismessi.
const ORDINE_DA_FARE = { scaduta: 0, fermi: 1, in_scadenza: 2 };

export function daFare(items, isTaglio) {
  const righe = [];
  (items || []).forEach(item => {
    if (item.stato === "fuori_uso") return;
    const stato = isTaglio ? calcolaStatoGT(item) : calcolaStato(item);
    const scad = isTaglio ? prossimaRevisioneGT(item) : item.dataRevisione;
    const giorni = giorniAllaScadenza(scad);
    if (stato === "scaduto") {
      righe.push({ item, tipo: "scaduta", titolo: "Revisione scaduta", dettaglio: "scaduta il " + formatData(scad), giorni });
    } else if (stato === "critico" || stato === "attenzione") {
      righe.push({ item, tipo: "in_scadenza", titolo: "Revisione in scadenza", dettaglio: "scade il " + formatData(scad), giorni });
    }
    const fermi = (item.componenti || []).filter(c => isTaglio ? !componenteAttivoGT(c) : c.fuoriUso);
    if (fermi.length) {
      const n = fermi.length;
      const titolo = isTaglio
        ? (n === 1 ? "1 componente fermo" : `${n} componenti fermi`)
        : (n === 1 ? "1 componente fuori uso" : `${n} componenti fuori uso`);
      let dettaglio = "vedi componenti";
      if (n === 1) {
        const c = fermi[0];
        const codice = isTaglio ? c.matricola : (c.matricolaLucca || c.matricola);
        const cosa = isTaglio ? (c.statoOperativo === "in_revisione" ? "in revisione" : "fuori servizio") : "da sostituire";
        dettaglio = `${c.tipo} ${codice || ""} — ${cosa}`.replace("  ", " ");
      }
      righe.push({ item, tipo: "fermi", titolo, dettaglio, giorni });
    }
  });
  return righe.sort((a, b) =>
    ORDINE_DA_FARE[a.tipo] - ORDINE_DA_FARE[b.tipo] || (a.giorni ?? Infinity) - (b.giorni ?? Infinity));
}
