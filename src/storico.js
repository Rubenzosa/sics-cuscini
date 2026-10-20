// Linea del tempo unica per il pannello Storico: unisce fonti diverse
// (revisioni, sostituzioni, spostamenti, manutenzioni...) dal più recente.
// Le date sono stringhe ISO, quindi il confronto testuale basta; voci senza data in fondo.
export function unisciStorico(fonti) {
  return fonti
    .flatMap(f => (f.voci || []).map(voce => ({ tipo: f.tipo, data: f.data(voce) || "", voce })))
    .sort((a, b) => b.data.localeCompare(a.data));
}
