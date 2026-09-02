// ─────────────────────────────────────────────────────────────
// Numerazione seriali "matricola Lucca" — SOLO CUSCINI
// Codice: [CATEGORIA][BAR]SI[INDICE], es. "CS 8 SI 001".
// L'indice è un contatore UNICO globale, condiviso da tutte le
// categorie e tutti i bar (non uno per categoria): il componente
// n-esimo incontrato riceve l'indice n. Formattato su 3 cifre
// (001, 002, ...); al superamento di 999 riparte da 001.
// Categoria e bar si preservano dal record, non entrano nel conteggio.
// Spec: numerazione.md
// ─────────────────────────────────────────────────────────────

export const CATEGORIE = ["CS", "CN", "RP", "TB", "RV"];
const MAX_INDICE = 999;

// Riporta un indice nel range 1..999 (dopo 999 si riparte da 1).
function wrapIndice(n) {
  return n > MAX_INDICE ? ((n - 1) % MAX_INDICE) + 1 : n;
}

export function categoriaDaTipo(tipo) {
  if (!tipo) return null;
  if (tipo.startsWith("CUSCINO")) return "CS";
  if (tipo.startsWith("TUBO")) return "TB";
  if (tipo === "CENTRALINA") return "CN";
  if (tipo === "RIDUTTORE") return "RP";
  if (tipo === "RUB. VALVOLARE") return "RV";
  return null;
}

export function parseMatricolaLucca(str) {
  if (!str) return null;
  const m = String(str).toUpperCase().match(/^(CS|CN|RP|TB|RV)\s*(\d+)\s*SI\s*(\d+)$/);
  if (!m) return null;
  return { cat: m[1], bar: parseInt(m[2], 10), index: parseInt(m[3], 10) };
}

export function categoriaDaCodice(str) {
  const p = parseMatricolaLucca(str);
  return p ? p.cat : null;
}

export function formatMatricolaLucca(cat, bar, index) {
  return `${cat} ${bar} SI ${String(index).padStart(3, "0")}`;
}

// Ordine canonico dei kit cuscini che riproduce ESATTAMENTE l'appendice di
// numerazione.md (ordine reale del DB verificato). I kit non in lista (nuovi)
// vanno in coda, ordinati per numero, così ricevono indici successivi.
export const ORDINE_CANONICO_CUSCINI = [
  "kit-4", "kit-13", "kit-21", "kit-15", "kit-17", "kit-19",
  "kit-12", "kit-11", "kit-20", "kit-18", "kit-16", "kit-14", "kit-22",
];
export function ordinaCanonicoCuscini(kits) {
  function rank(k) {
    const i = ORDINE_CANONICO_CUSCINI.indexOf(k.id);
    return i === -1 ? 1e9 + (Number(k.numero) || 0) : i;
  }
  return [...(kits || [])].sort((a, b) => rank(a) - rank(b));
}

// Rinumera una lista ordinata di codici: contatore UNICO condiviso da tutte
// le categorie, bar preservato. I codici non parsabili restano invariati
// (uppercase) e non avanzano il contatore.
export function rinumeraSeriali(codici) {
  let contatore = 0;
  return (codici || []).map(code => {
    const p = parseMatricolaLucca(code);
    if (!p) return typeof code === "string" ? code.toUpperCase() : code;
    contatore++;
    return formatMatricolaLucca(p.cat, p.bar, wrapIndice(contatore));
  });
}

// Rinumera i componenti dei kit cuscini preservando la struttura.
// Imposta vecchio_codice (solo se assente) e ritorna la mappa dei cambiamenti.
// NON riordina i kit: usa l'ordine fornito.
export function rinumeraCuscini(kits) {
  const lista = kits || [];
  const codici = [];
  lista.forEach(kit => (kit.componenti || []).forEach(c => codici.push(c.matricolaLucca)));
  const nuovi = rinumeraSeriali(codici);

  const mappa = [];
  let ptr = 0;
  const nuoviKit = lista.map(kit => {
    const componenti = (kit.componenti || []).map((c, i) => {
      const nuovo = nuovi[ptr++];
      if (nuovo && nuovo !== c.matricolaLucca) {
        mappa.push({
          kitId: kit.id, kitNumero: kit.numero, compIndex: i,
          tipo: c.tipo, vecchio: c.matricolaLucca || "", nuovo,
        });
        return { ...c, vecchio_codice: c.vecchio_codice || c.matricolaLucca || "", matricolaLucca: nuovo };
      }
      return c;
    });
    return { ...kit, componenti };
  });
  return { kits: nuoviKit, mappa };
}

// Prossimo indice suggerito = max indice in uso GLOBALMENTE (su tutte le
// categorie e tutti i bar) + 1, con wrap dopo 999.
export function suggerisciIndice(kits) {
  let max = 0;
  (kits || []).forEach(k => (k.componenti || []).forEach(c => {
    const p = parseMatricolaLucca(c.matricolaLucca);
    if (p && p.index > max) max = p.index;
  }));
  return wrapIndice(max + 1);
}

// Codice completo suggerito per un nuovo componente, dato tipo e bar.
export function suggerisciMatricola(kits, tipo, bar) {
  const cat = categoriaDaTipo(tipo);
  if (!cat) return "";
  return formatMatricolaLucca(cat, Number(bar) || 0, suggerisciIndice(kits));
}
