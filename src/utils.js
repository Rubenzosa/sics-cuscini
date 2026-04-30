export function calcolaStato(kit) {
  if (kit.stato === "fuori_servizio") return "fuori_servizio";
  if (kit.stato === "magazzino") return "magazzino";
  if (!kit.dataRevisione) return "senza_data";

  const oggi = new Date();
  const revisione = new Date(kit.dataRevisione);
  const diffGiorni = Math.floor((revisione - oggi) / (1000 * 60 * 60 * 24));

  if (diffGiorni < 0) return "scaduto";
  if (diffGiorni <= 60) return "in_scadenza";
  return "regolare";
}

export function statoLabel(stato) {
  const map = {
    scaduto: "Scaduto",
    in_scadenza: "In scadenza",
    regolare: "Regolare",
    fuori_servizio: "Fuori servizio",
    magazzino: "Magazzino",
    senza_data: "N/D",
  };
  return map[stato] || stato;
}

export function statoColore(stato) {
  const map = {
    scaduto: { bg: "#fcebeb", text: "#a32d2d", dot: "#e24b4a" },
    in_scadenza: { bg: "#faeeda", text: "#854f0b", dot: "#ba7517" },
    regolare: { bg: "#eaf3de", text: "#3b6d11", dot: "#639922" },
    fuori_servizio: { bg: "#f1efe8", text: "#5f5e5a", dot: "#888780" },
    magazzino: { bg: "#e6f1fb", text: "#185fa5", dot: "#378add" },
    senza_data: { bg: "#f1efe8", text: "#5f5e5a", dot: "#888780" },
  };
  return map[stato] || map.senza_data;
}

export function formatData(dataStr) {
  if (!dataStr) return "N/D";
  const d = new Date(dataStr);
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function giorniAllaScadenza(dataStr) {
  if (!dataStr) return null;
  const oggi = new Date();
  const revisione = new Date(dataStr);
  return Math.floor((revisione - oggi) / (1000 * 60 * 60 * 24));
}

export function calcolaProssimaRevisione(annoAcquisto, dataUltimaRevisione) {
  const anni = new Date().getFullYear() - annoAcquisto;
  const intervalloAnni = anni >= 10 ? 1 : 2;
  if (dataUltimaRevisione) {
    const base = new Date(dataUltimaRevisione);
    base.setFullYear(base.getFullYear() + intervalloAnni);
    return base.toISOString().split("T")[0];
  }
  return null;
}