export function calcolaStato(kit) {
  if (kit.stato === "fuori_servizio") return "fuori_servizio";
  if (kit.stato === "fuori_uso")      return "fuori_uso";
  if (kit.stato === "magazzino") return "magazzino";
  if (!kit.dataRevisione) return "senza_data";
  const oggi = new Date();
  const revisione = new Date(kit.dataRevisione);
  const annoOggi = oggi.getFullYear();
  const annoRevisione = revisione.getFullYear();
  const diffGiorni = Math.floor((revisione - oggi) / (1000 * 60 * 60 * 24));
  if (diffGiorni < 0) return "scaduto";
  if (diffGiorni <= 90) return "critico";
  if (annoRevisione === annoOggi) return "attenzione";
  if (annoRevisione === annoOggi + 1) return "buono";
  return "regolare";
}

export function statoLabel(stato) {
  const map = {
    scaduto: "Scaduto", critico: "Scade entro 3 mesi",
    attenzione: "Scade quest'anno", buono: "Scade l'anno prossimo",
    regolare: "Regolare", fuori_servizio: "Fuori servizio",
    magazzino: "Magazzino", senza_data: "N/D",
    fuori_uso: "Fuori uso",
  };
  return map[stato] || stato;
}

export function statoColore(stato) {
  const map = {
    scaduto:      { bg: "#fcebeb", text: "#a32d2d", dot: "#e24b4a" },
    critico:      { bg: "#fcebeb", text: "#a32d2d", dot: "#e24b4a" },
    attenzione:   { bg: "#faeeda", text: "#854f0b", dot: "#ba7517" },
    buono:        { bg: "#eaf3de", text: "#3b6d11", dot: "#639922" },
    regolare:     { bg: "#eaf3de", text: "#3b6d11", dot: "#639922" },
    fuori_servizio:{ bg: "#f1efe8", text: "#5f5e5a", dot: "#888780" },
    fuori_uso:    { bg: "#2a1a2a", text: "#9b59b6", dot: "#6c3483" },
    magazzino:    { bg: "#e6f1fb", text: "#185fa5", dot: "#378add" },
    senza_data:   { bg: "#f1efe8", text: "#5f5e5a", dot: "#888780" },
  };
  return map[stato] || map.senza_data;
}

export function formatData(dataStr) {
  if (!dataStr) return "N/D";
  const d = new Date(dataStr);
  if (isNaN(d)) return "N/D";
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function giorniAllaScadenza(dataStr) {
  if (!dataStr) return null;
  const oggi = new Date();
  const revisione = new Date(dataStr);
  return Math.floor((revisione - oggi) / (1000 * 60 * 60 * 24));
}

export function percentualeVita(dataAcquisto, dataRevisione) {
  if (!dataAcquisto || !dataRevisione) return 0;
  const inizio = new Date(dataAcquisto);
  const fine = new Date(dataRevisione);
  const oggi = new Date();
  const totale = fine - inizio;
  const trascorso = oggi - inizio;
  if (totale <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((trascorso / totale) * 100)));
}

export function calcolaProssimaRevisione(annoAcquisto, dataUltimaRevisione) {
  if (!dataUltimaRevisione) return null;
  const base = new Date(dataUltimaRevisione);
  if (isNaN(base)) return null;
  // Età dei cuscini valutata all'anno della revisione effettuata.
  // < 10 anni → revisione ogni 2 anni; >= 10 anni → ogni anno.
  const anni = base.getFullYear() - annoAcquisto;
  const intervalloAnni = anni >= 10 ? 1 : 2;
  base.setFullYear(base.getFullYear() + intervalloAnni);
  return base.toISOString().split("T")[0];
}

// Numero di componenti messi fuori uso (difettosi, in attesa di sostituzione).
// Un kit con >0 è revisionato/funzionante ma incompleto → merita attenzione.
export function componentiFuoriUso(kit) {
  return (kit?.componenti || []).filter(c => c.fuoriUso).length;
}

// Scadenza da intervallo esplicito in anni (durata manuale cuscini / anni taglio).
// Ritorna null se intervallo non valido (<=0 o non numerico) o data mancante.
export function scadenzaConIntervallo(dataStr, anni) {
  if (!dataStr) return null;
  const base = new Date(dataStr);
  if (isNaN(base)) return null;
  const n = Number(anni);
  if (!Number.isFinite(n) || n <= 0) return null;
  base.setFullYear(base.getFullYear() + n);
  return base.toISOString().split("T")[0];
}

// Ricerca globale su tutti i kit e componenti
export function cercaGlobale(kits, query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const risultati = [];
  kits.forEach(kit => {
    const matchKit =
      String(kit.numero).includes(q) ||
      kit.nome?.toLowerCase().includes(q) ||
      kit.mezzo?.toLowerCase().includes(q) ||
      kit.tipoMezzo?.toLowerCase().includes(q) ||
      kit.dislocazione?.toLowerCase().includes(q);
    if (matchKit) {
      risultati.push({ tipo: "kit", kit, label: `Kit ${kit.numero} — ${kit.nome}`, sub: `${kit.mezzo} · ${kit.dislocazione}` });
    }
    (kit.componenti || []).forEach((c, i) => {
      const matchComp =
        c.tipo?.toLowerCase().includes(q) ||
        c.modello?.toLowerCase().includes(q) ||
        c.matricola?.toLowerCase().includes(q) ||
        c.matricolaLucca?.toLowerCase().includes(q);
      if (matchComp) {
        risultati.push({ tipo: "componente", kit, componente: c, indexComp: i, label: `${c.tipo} — ${c.modello || "—"}`, sub: `Kit ${kit.numero} · ${c.matricolaLucca || c.matricola || "—"}` });
      }
    });
  });
  return risultati.slice(0, 12);
}

// ─── ALGORITMO ROTAZIONI ─────────────────────────────────────

// Distanze relative tra sedi (km approssimativi da Siena)
const DISTANZE = {
  "Sede Centrale":   0,
  "Magazzino":       0,
  "Montalcino":      40,
  "Montepulciano":   65,
  "Piancastagnaio":  55,
  "Poggibonsi":      30,
};

// Calcola punteggio urgenza kit (più alto = più urgente da revisionare)
export function calcolaPunteggio(kit) {
  const giorni = giorniAllaScadenza(kit.dataRevisione);
  if (giorni === null) return 0;
  if (giorni < 0)   return 1000 + Math.abs(giorni); // scaduto
  if (giorni <= 90) return 500  + (90 - giorni);    // critico
  if (giorni <= 180) return 200 + (180 - giorni);   // attenzione
  return Math.max(0, 100 - giorni);                 // ok
}

// Raggruppa kit per zona geografica
function zonaKit(kit) {
  const loc = kit.dislocazione || "Sede Centrale";
  if (loc === "Sede Centrale" || loc === "Magazzino" || loc === "Poggibonsi") return "nord";
  if (loc === "Montalcino") return "sud-ovest";
  if (loc === "Montepulciano" || loc === "Piancastagnaio") return "sud-est";
  return "altro";
}

// STRATEGIA 1 — Piano revisione ottimale
// Restituisce gruppi di 2-3 kit consigliati per la prossima tornata
export function calcolaPianoRevisione(kits) {
  const SEDI = ["Sede Centrale","Montalcino","Montepulciano","Piancastagnaio","Poggibonsi"];

  // ── REGOLA COPERTURA MINIMA PER SEDE ──
  // Sede Centrale: minimo 2 kit attivi (>2 = surplus disponibile)
  // Distaccamenti:  minimo 1 kit attivo (>1 = surplus disponibile)
  function minimoPerSede(sede) {
    return sede === "Sede Centrale" ? 2 : 1;
  }
  function surplusDisponibile(sede, attivi) {
    return attivi > minimoPerSede(sede);
  }

  // Conta kit attivi per sede (esclude quelli già in revisione)
  const kittiviPerSede = {};
  SEDI.forEach(s => {
    kittiviPerSede[s] = kits.filter(k =>
      k.dislocazione === s && (k.stato === "attivo")
    ).length;
  });

  // Kit candidati: attivi, con scadenza
  const candidati = kits
    .filter(k => k.stato === "attivo" && k.dataRevisione)
    .sort((a, b) => calcolaPunteggio(b) - calcolaPunteggio(a));

  if (!candidati.length) return { gruppi: [], avvisi: [] };

  const avvisi = [];
  const gruppi = [];
  const usati  = new Set();

  // Informazioni surplus per ogni sede
  SEDI.forEach(s => {
    const attivi  = kittiviPerSede[s] || 0;
    const minimo  = minimoPerSede(s);
    const surplus = attivi - minimo;
    if (attivi > 0 && surplus > 0) {
      avvisi.push(
        `${s}: ${attivi} kit attivi, minimo ${minimo} — surplus di ${surplus} disponibile per revisione`
      );
    } else if (attivi > 0 && attivi === minimo) {
      avvisi.push(
        `⚠ ${s}: ${attivi} kit attivi = minimo operativo — nessun surplus, richiede sostituto prima di inviare`
      );
    } else if (attivi > 0 && attivi < minimo) {
      avvisi.push(
        `🔴 ${s}: ${attivi} kit attivi, sotto il minimo di ${minimo} — sede in deficit`
      );
    }
  });

  // Prova a formare gruppi ottimali senza limite massimo
  for (let tentativo = 0; tentativo < 3 && usati.size < candidati.length; tentativo++) {
    const gruppo    = [];
    const sediUsate = new Set();

    for (const kit of candidati) {
      if (usati.has(kit.id)) continue;
      // Nessun limite massimo per gruppo

      const sede   = kit.dislocazione || "Sede Centrale";
      const attivi = kittiviPerSede[sede] || 0;
      const haSurplus = surplusDisponibile(sede, attivi);

      // Non inviare se la sede non ha surplus (rimarrebbe sotto il minimo)
      if (!haSurplus) {
        // Eccezione: se il kit è scaduto (urgenza assoluta) segnala ma non blocca
        if (calcolaPunteggio(kit) >= 1000) {
          avvisi.push(
            `🔴 Kit ${kit.numero} (${sede}) — SCADUTO, invio urgente ma sede sotto minimo: verificare sostituto`
          );
          // Includi comunque per urgenza assoluta
        } else {
          continue; // Salta — sede non ha surplus
        }
      }

      // Preferenza geografica: stesso gruppo zona del primo selezionato
      if (gruppo.length > 0) {
        const zonaGruppo = zonaKit(gruppo[0]);
        const zonaKitCur = zonaKit(kit);
        // Accetta stessa zona o urgente (punteggio > 400)
        if (zonaGruppo !== zonaKitCur && calcolaPunteggio(kit) < 400) continue;
      }

      gruppo.push(kit);
      sediUsate.add(sede);
      // Simula riduzione kit per questa sede nel calcolo
      kittiviPerSede[sede] = Math.max(0, attivi - 1);
    }

    if (gruppo.length >= 2) {
      gruppo.forEach(k => usati.add(k.id));
      const km = gruppo.reduce((sum, k) => sum + (DISTANZE[k.dislocazione] || 0), 0);
      gruppi.push({ kit: gruppo, km, zona: zonaKit(gruppo[0]) });
    } else {
      break;
    }
  }

  return { gruppi, avvisi };
}

// STRATEGIA 4 — Sostituto ottimale per un kit da inviare
// Restituisce il kit sostituto migliore dal magazzino
export function calcolaSostitutoOttimale(kitDaInviare, kits) {
  const candidati = kits.filter(k =>
    (k.stato === "magazzino" || (k.stato === "attivo" && k.dislocazione === "Magazzino")) &&
    k.bar === kitDaInviare.bar  // stesso bar di esercizio
  );

  if (!candidati.length) return null;

  // Score sostituto: preferiamo quello con revisione più lontana
  // e compatibile con il mezzo di destinazione
  const scored = candidati.map(k => {
    const giorni = giorniAllaScadenza(k.dataRevisione) ?? 0;
    let score = giorni; // più giorni rimasti = meglio
    return { kit: k, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.kit || null;
}

// STRATEGIA 3 — Copertura sedi in tempo reale
// Regola: Sede Centrale minimo 2, distaccamenti minimo 1
export function calcolaCopertura(kits) {
  const SEDI = ["Sede Centrale","Montalcino","Montepulciano","Piancastagnaio","Poggibonsi"];
  return SEDI.map(sede => {
    const tutti      = kits.filter(k => k.dislocazione === sede);
    const attivi     = tutti.filter(k => k.stato === "attivo").length;
    const inRevisione= tutti.filter(k => k.stato === "in_revisione").length;
    const minimo     = sede === "Sede Centrale" ? 2 : 1;
    const surplus    = attivi - minimo;
    const scoperta   = attivi === 0;
    const sottoMinimo= attivi > 0 && attivi < minimo;
    const alMinimo   = attivi === minimo;
    return {
      sede,
      tutti: tutti.length,
      attivi,
      inRevisione,
      minimo,
      surplus,           // positivo = può inviare, negativo = deficit
      scoperta,          // 0 kit attivi
      sottoMinimo,       // sotto la soglia minima
      alMinimo,          // esattamente al minimo — nessun surplus
      hasSurplus: surplus > 0,
    };
  }).filter(s => s.tutti > 0 || s.sede === "Sede Centrale");
}

// ─── UTILS GRUPPI DA TAGLIO ──────────────────────────────────

export function calcolaStatoGT(gt) {
  if (gt.stato === "fuori_servizio") return "fuori_servizio";
  if (gt.stato === "fuori_uso")      return "fuori_uso";
  if (gt.stato === "magazzino")      return "magazzino";
  if (gt.stato === "in_revisione")   return "in_revisione";

  // Usa la prossima revisione più vicina tra tutti i componenti
  const date = (gt.componenti || [])
    .map(c => c.prossimaRevisione)
    .filter(d => d && d !== "NO REVISIONE" && d !== null)
    .map(d => new Date(d))
    .filter(d => !isNaN(d));

  if (!date.length) return "senza_data";

  const prossimaRev = new Date(Math.min(...date));
  const oggi = new Date();
  const annoOggi = oggi.getFullYear();
  const annoRev  = prossimaRev.getFullYear();
  const diff = Math.floor((prossimaRev - oggi) / 86400000);

  if (diff < 0)   return "scaduto";
  if (diff <= 90) return "critico";
  if (annoRev === annoOggi)   return "attenzione";
  if (annoRev === annoOggi+1) return "buono";
  return "regolare";
}

export function prossimaRevisioneGT(gt) {
  const date = (gt.componenti || [])
    .map(c => c.prossimaRevisione)
    .filter(d => d && d !== "NO REVISIONE" && d !== null);
  if (!date.length) return null;
  return date.sort()[0]; // prima in ordine cronologico
}

export function sistemaBadge(sistema) {
  if (sistema === "elettrico")    return { label: "Elettrico",     bg: "#e6f1fb", color: "#185fa5" };
  if (sistema === "oleodinamico") return { label: "Oleodinamico",  bg: "#eaf3de", color: "#3b6d11" };
  return                                 { label: "Misto",          bg: "#faeeda", color: "#854f0b" };
}