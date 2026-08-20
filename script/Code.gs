// ═══════════════════════════════════════════════════════════
// SICS — VVF Siena | Google Apps Script Backend
// Cuscini di Sollevamento + Gruppi da Taglio
// Firebase Firestore REST API
// ═══════════════════════════════════════════════════════════

var FIREBASE_PROJECT_ID = "sics-cuscini";
var FIREBASE_API_KEY    = "AIzaSyBzef1HAZxzAbATMrUG1y7D1FPcCFZq_2Q";
var FIRESTORE_BASE      = "https://firestore.googleapis.com/v1/projects/" + FIREBASE_PROJECT_ID + "/databases/(default)/documents";

// ── MENU ────────────────────────────────────────────────────
function onOpen() {
  var ui   = SpreadsheetApp.getUi();
  var menu = ui.createMenu("SICS — VVF Siena");
  menu.addItem("Apri Dashboard", "apriSidebar");
  menu.addSeparator();
  menu.addSubMenu(
    ui.createMenu("Sincronizza fogli")
      .addItem("Sincronizza Cuscini",      "sincronizzaCuscini")
      .addItem("Sincronizza Gruppi taglio","sincronizzaTaglio")
      .addItem("Sincronizza tutto",        "sincronizzaTutto")
  );
  menu.addSeparator();
  menu.addItem("Aggiorna scadenze unificate", "aggiornaScadenzeUnificate");
  menu.addToUi();
}

function apriSidebar() {
  var html = HtmlService.createTemplateFromFile("sidebar")
    .evaluate()
    .setWidth(780)
    .setHeight(640);
  SpreadsheetApp.getUi().showModalDialog(html, "SICS — VVF Siena");
}

// ── FIRESTORE HELPERS ────────────────────────────────────────
function firestoreGet(col) {
  var url  = FIRESTORE_BASE + "/" + col + "?key=" + FIREBASE_API_KEY + "&pageSize=100";
  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var json = JSON.parse(resp.getContentText());
  if (!json.documents) return [];
  return json.documents.map(function(d) { return parseDoc(d); });
}

function firestoreGetDoc(col, id) {
  var url  = FIRESTORE_BASE + "/" + col + "/" + id + "?key=" + FIREBASE_API_KEY;
  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var json = JSON.parse(resp.getContentText());
  if (json.error) return null;
  return parseDoc(json);
}

function firestorePatch(col, id, data) {
  var url  = FIRESTORE_BASE + "/" + col + "/" + id + "?key=" + FIREBASE_API_KEY;
  var resp = UrlFetchApp.fetch(url, {
    method: "PATCH",
    contentType: "application/json",
    payload: JSON.stringify({ fields: toFields(data) }),
    muteHttpExceptions: true,
  });
  return JSON.parse(resp.getContentText());
}

function firestorePost(col, data) {
  var url  = FIRESTORE_BASE + "/" + col + "?key=" + FIREBASE_API_KEY;
  var resp = UrlFetchApp.fetch(url, {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify({ fields: toFields(data) }),
    muteHttpExceptions: true,
  });
  return JSON.parse(resp.getContentText());
}

// ── PARSER ──────────────────────────────────────────────────
function parseDoc(doc) {
  var obj = {};
  if (doc.name) {
    var parts = doc.name.split("/");
    obj.id = parts[parts.length - 1];
  }
  if (!doc.fields) return obj;
  Object.keys(doc.fields).forEach(function(k) {
    obj[k] = parseVal(doc.fields[k]);
  });
  return obj;
}

function parseVal(v) {
  if (v.stringValue  !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return parseInt(v.integerValue);
  if (v.doubleValue  !== undefined) return parseFloat(v.doubleValue);
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue    !== undefined) return null;
  if (v.arrayValue) {
    if (!v.arrayValue.values) return [];
    return v.arrayValue.values.map(parseVal);
  }
  if (v.mapValue) {
    var obj = {};
    if (v.mapValue.fields) {
      Object.keys(v.mapValue.fields).forEach(function(k) {
        obj[k] = parseVal(v.mapValue.fields[k]);
      });
    }
    return obj;
  }
  return null;
}

function toFields(data) {
  var fields = {};
  Object.keys(data).forEach(function(k) {
    if (k !== "id") fields[k] = toVal(data[k]);
  });
  return fields;
}

function toVal(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean")  return { booleanValue: v };
  if (typeof v === "number") {
    if (Number.isInteger(v))   return { integerValue: String(v) };
    return { doubleValue: v };
  }
  if (typeof v === "string")   return { stringValue: v };
  if (Array.isArray(v))        return { arrayValue: { values: v.map(toVal) } };
  if (typeof v === "object") {
    var f = {};
    Object.keys(v).forEach(function(k) { f[k] = toVal(v[k]); });
    return { mapValue: { fields: f } };
  }
  return { stringValue: String(v) };
}

// ── UTILS ────────────────────────────────────────────────────
function fmtData(d) {
  if (!d) return "N/D";
  try { return new Date(d).toLocaleDateString("it-IT", { day:"2-digit", month:"2-digit", year:"numeric" }); }
  catch(e) { return d; }
}

function giorniA(d) {
  if (!d || d === "NO REVISIONE") return null;
  return Math.floor((new Date(d) - new Date()) / 86400000);
}

function statoCalcola(kit, oggi) {
  if (!oggi) oggi = new Date();
  if (kit.stato === "fuori_servizio") return "fuori_servizio";
  if (kit.stato === "magazzino")      return "magazzino";
  if (kit.stato === "in_revisione")   return "in_revisione";
  if (!kit.dataRevisione)             return "senza_data";
  var rev  = new Date(kit.dataRevisione);
  var diff = Math.floor((rev - oggi) / 86400000);
  var aO   = oggi.getFullYear(), aR = rev.getFullYear();
  if (diff < 0)    return "scaduto";
  if (diff <= 90)  return "critico";
  if (aR === aO)   return "attenzione";
  if (aR === aO+1) return "buono";
  return "regolare";
}

function statoGT(gt, oggi) {
  if (!oggi) oggi = new Date();
  if (gt.stato === "fuori_servizio") return "fuori_servizio";
  if (gt.stato === "magazzino")      return "magazzino";
  if (gt.stato === "in_revisione")   return "in_revisione";
  var date = (gt.componenti || [])
    .map(function(c) { return c.prossimaRevisione; })
    .filter(function(d) { return d && d !== "NO REVISIONE"; })
    .map(function(d) { return new Date(d); })
    .filter(function(d) { return !isNaN(d); });
  if (!date.length) return "senza_data";
  var prox = new Date(Math.min.apply(null, date));
  var diff = Math.floor((prox - oggi) / 86400000);
  var aO = oggi.getFullYear(), aR = prox.getFullYear();
  if (diff < 0)    return "scaduto";
  if (diff <= 90)  return "critico";
  if (aR === aO)   return "attenzione";
  if (aR === aO+1) return "buono";
  return "regolare";
}

function prossimaRevGT(gt) {
  var date = (gt.componenti || [])
    .map(function(c) { return c.prossimaRevisione; })
    .filter(function(d) { return d && d !== "NO REVISIONE"; });
  if (!date.length) return null;
  return date.sort()[0];
}

function coloreStato(stato) {
  if (stato === "scaduto" || stato === "critico")   return "#fcebeb";
  if (stato === "attenzione")                        return "#faeeda";
  if (stato === "buono" || stato === "regolare")     return "#eaf3de";
  if (stato === "in_revisione")                      return "#e6f1fb";
  return "#ffffff";
}

// ── UTILITY FORMATTAZIONE FOGLI ──────────────────────────────

// Svuota contenuti E formati (clearContents lasciava colori/merge vecchi)
function resetFoglio(sh) {
  var mr = sh.getMaxRows(), mc = sh.getMaxColumns();
  var rng = sh.getRange(1, 1, mr, mc);
  rng.breakApart();
  rng.clear();
  sh.getBandings().forEach(function(b) { b.remove(); });
}

// Larghezza colonne = contenuto + padding, con min/max; testo a capo e riga alta quanto serve
// righeTitolo: numeri di riga delle intestazioni di gruppo (celle unite).
// Vanno escluse dal calcolo larghezza, altrimenti autoResize le misura come
// se il testo stesse tutto nella prima colonna e le colonne restano strette.
function formattaFoglio(sh, nCols, righeTitolo, maxW) {
  maxW = maxW || 320;
  var last = Math.max(sh.getLastRow(), 1);
  sh.showColumns(1, nCols);   // annulla eventuali colonne nascoste da versioni precedenti
  sh.getRange(1, 1, last, nCols)
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
    .setVerticalAlignment("middle");
  sh.getRange(1, 1, 1, nCols).setHorizontalAlignment("center");
  sh.autoResizeColumns(1, nCols);

  var salta = {};
  (righeTitolo || []).forEach(function(r) { salta[r] = true; });
  var valori = sh.getRange(1, 1, last, nCols).getDisplayValues();

  for (var c = 0; c < nCols; c++) {
    var caratteri = 0;
    for (var r = 0; r < valori.length; r++) {
      if (salta[r + 1]) continue;
      var t = String(valori[r][c] == null ? "" : valori[r][c]);
      if (t.length > caratteri) caratteri = t.length;
    }
    var stimata = caratteri * 7.4 + 26;                       // ~7.4px per carattere a 10pt
    var w = Math.max(sh.getColumnWidth(c + 1) + 28, stimata);
    sh.setColumnWidth(c + 1, Math.max(90, Math.min(maxW, Math.round(w))));
  }
  sh.autoResizeRows(1, last);
  sh.setFrozenRows(1);
}

// Ordina kit/gruppi per numero (numerico quando possibile)
function ordinaPerNumero(arr) {
  return (arr || []).slice().sort(function(a, b) {
    var na = parseInt(a.numero, 10), nb = parseInt(b.numero, 10);
    if (isNaN(na) && isNaN(nb)) return String(a.numero||"").localeCompare(String(b.numero||""));
    if (isNaN(na)) return 1;
    if (isNaN(nb)) return -1;
    return na - nb;
  });
}

// Stato tecnico -> etichetta leggibile nel foglio
var ETICHETTE_STATO = {
  scaduto: "Scaduto", critico: "Critico", attenzione: "Attenzione",
  buono: "Buono", regolare: "Regolare", in_revisione: "In revisione",
  magazzino: "In magazzino", senza_data: "Senza data", fuori_servizio: "Fuori servizio"
};
function etichettaStato(st) {
  if (!st) return "";
  return ETICHETTE_STATO[st] || String(st).charAt(0).toUpperCase() + String(st).slice(1).replace(/_/g, " ");
}

// Conteggio componenti con evidenza di quelli fuori uso: "8 \u00b7 1 fuori uso"
function contaComponenti(componenti, fuoriUsoFn) {
  var lista = componenti || [];
  if (!lista.length) return 0;
  var ko = lista.filter(fuoriUsoFn).length;
  return ko ? lista.length + " \u00b7 " + ko + " fuori uso" : lista.length;
}
function compCuscinoFuoriUso(c) { return !!c.fuoriUso; }
function compTaglioFuoriUso(c) { return String(c.statoComp || "").toLowerCase().indexOf("fuori uso") >= 0; }

// Formato numerico dei giorni a scadenza: unità sempre, negativi in rosso
var FORMATO_GIORNI = '0" gg";[Red]-0" gg";0" gg";@';

// Converte una data testuale in oggetto Date (per la formattazione dd/mm/yyyy);
// lascia il testo originale se non è una data valida ("NO REVISIONE", vuoto, ...)
function cellaData(v) {
  if (!v) return "N/D";
  if (v === "NO REVISIONE") return v;
  var d = new Date(v);
  return isNaN(d) ? v : d;
}

// Ordine delle dislocazioni: Sede Centrale in testa, sedi distaccate in mezzo,
// magazzino e voci senza sede in coda
function ordinaDislocazioni(nomi) {
  function peso(d) {
    var n = String(d || "").toLowerCase();
    if (!n) return 3;
    if (n.indexOf("sede centrale") >= 0) return 0;
    if (n.indexOf("magazzino") >= 0)     return 2;
    return 1;
  }
  return nomi.slice().sort(function(a, b) {
    var pa = peso(a), pb = peso(b);
    if (pa !== pb) return pa - pb;
    return String(a).localeCompare(String(b));
  });
}

// Raggruppa elementi per dislocazione, già ordinati per numero dentro ogni sede
function raggruppaPerDislocazione(items) {
  var mappa = {};
  items.forEach(function(it) {
    var d = it.dislocazione || "Senza dislocazione";
    if (!mappa[d]) mappa[d] = [];
    mappa[d].push(it);
  });
  return ordinaDislocazioni(Object.keys(mappa)).map(function(d) {
    return { dislocazione: d, items: ordinaPerNumero(mappa[d]) };
  });
}

// Da mappa { indice riga dati: 1 } ai numeri di riga del foglio (header incluso)
function righeTitoloDa(mappa) {
  return Object.keys(mappa || {}).map(function(k) { return Number(k) + 2; });
}

// Riga-titolo di gruppo: unisce le colonne e la colora
function stileRigaGruppo(sh, riga, nCols, bg) {
  sh.getRange(riga, 1, 1, nCols)
    .merge()
    .setBackground(bg)
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("left")
    .setVerticalAlignment("middle");
}

// ── API CHIAMATE DALLA SIDEBAR ───────────────────────────────

// CUSCINI
function getAllKits() {
  return firestoreGet("kits");
}
function salvaKit(kit) {
  return firestorePatch("kits", kit.id, kit);
}
function aggiungiRevisioneKit(kitId, rev) {
  var kit = firestoreGetDoc("kits", kitId);
  if (!kit) return { error: "Kit non trovato" };
  kit.dataRevisione            = rev.dataRevisione;
  kit.ultimaRevisioneEsito     = rev.esito || "";
  kit.ultimaRevisioneTecnico   = rev.tecnico || "";
  firestorePatch("kits", kitId, kit);
  firestorePost("storico_revisioni", {
    kitId: kitId, kitNome: kit.nome, kitNumero: kit.numero || 0,
    dataRevisione: rev.dataRevisione || "",
    esito: rev.esito || "positivo",
    tecnico: rev.tecnico || "",
    ente: rev.ente || "",
    note: rev.note || "",
    dataRegistrazione: new Date().toISOString(),
  });
  return { success: true };
}
function spostaKit(kitId, nuovoMezzo, nuovaTarga, nuovaDislocazione, motivo) {
  var kit = firestoreGetDoc("kits", kitId);
  if (!kit) return { error: "Kit non trovato" };
  firestorePost("storico_spostamenti", {
    kitId: kitId, kitNome: kit.nome,
    mezzoPrecedente: kit.mezzo || "",
    dislocazionePrecedente: kit.dislocazione || "",
    nuovoMezzo: nuovoMezzo || "",
    nuovaTarga: nuovaTarga || "",
    nuovaDislocazione: nuovaDislocazione || "",
    motivo: motivo || "",
    data: new Date().toISOString(),
  });
  kit.mezzo        = nuovaTarga;
  kit.tipoMezzo    = nuovoMezzo;
  kit.dislocazione = nuovaDislocazione;
  firestorePatch("kits", kitId, kit);
  return { success: true };
}
function getRevisioniKit(kitId) {
  return firestoreGet("storico_revisioni")
    .filter(function(r) { return r.kitId === kitId; })
    .sort(function(a,b) { return (b.dataRevisione||"").localeCompare(a.dataRevisione||""); });
}
function getSpostamentiKit(kitId) {
  return firestoreGet("storico_spostamenti")
    .filter(function(r) { return r.kitId === kitId; })
    .sort(function(a,b) { return (b.data||"").localeCompare(a.data||""); });
}

// GRUPPI TAGLIO
function getAllGruppiTaglio() {
  return firestoreGet("gruppi_taglio");
}
function salvaGruppoTaglio(gt) {
  return firestorePatch("gruppi_taglio", gt.id, gt);
}
function aggiungiRevisioneGT(gtId, rev) {
  var gt = firestoreGetDoc("gruppi_taglio", gtId);
  if (!gt) return { error: "Gruppo non trovato" };
  firestorePost("gt_revisioni", {
    gtId: gtId, gtNome: gt.nome,
    dataRevisione: rev.dataRevisione || "",
    esito: rev.esito || "positivo",
    tecnico: rev.tecnico || "",
    ente: rev.ente || "",
    note: rev.note || "",
    dataRegistrazione: new Date().toISOString(),
  });
  gt.ultimaRevisioneData    = rev.dataRevisione;
  gt.ultimaRevisioneEsito   = rev.esito || "";
  gt.ultimaRevisioneTecnico = rev.tecnico || "";
  firestorePatch("gruppi_taglio", gtId, gt);
  return { success: true };
}
function aggiungiManutenzioneGT(gtId, man) {
  var gt = firestoreGetDoc("gruppi_taglio", gtId);
  if (!gt) return { error: "Gruppo non trovato" };
  firestorePost("gt_manutenzione", {
    gtId: gtId, gtNome: gt.nome,
    data: man.data || "",
    tipo: man.tipo || "",
    componenteInteressato: man.componenteInteressato || "",
    olio: man.olio || "",
    candela: man.candela || "",
    note: man.note || "",
    dataRegistrazione: new Date().toISOString(),
  });
  return { success: true };
}
function getRevisioniGT(gtId) {
  return firestoreGet("gt_revisioni")
    .filter(function(r) { return r.gtId === gtId; })
    .sort(function(a,b) { return (b.dataRevisione||"").localeCompare(a.dataRevisione||""); });
}
function getManutenzioniGT(gtId) {
  return firestoreGet("gt_manutenzione")
    .filter(function(r) { return r.gtId === gtId; })
    .sort(function(a,b) { return (b.data||"").localeCompare(a.data||""); });
}
function getAllManutenzioniGT() {
  return firestoreGet("gt_manutenzione")
    .sort(function(a,b) { return (b.data||"").localeCompare(a.data||""); });
}

// ── PROMEMORIA CALENDARIO ────────────────────────────────────
function getAllPromemoria() {
  return firestoreGet("promemoria")
    .sort(function(a,b) { return (a.data||"").localeCompare(b.data||""); });
}
function salvaPromemoria(p) {
  // p: { data, sistema, titolo, note }
  p.dataCreazione = new Date().toISOString();
  return firestorePost("promemoria", p);
}
function deletePromemoria(id) {
  var url = FIRESTORE_BASE + "/promemoria/" + id + "?key=" + FIREBASE_API_KEY;
  UrlFetchApp.fetch(url, { method: "DELETE", muteHttpExceptions: true });
  return { success: true };
}

// ── SINCRONIZZAZIONE FOGLI GOOGLE ───────────────────────────
function sincronizzaTutto() {
  sincronizzaCuscini();
  sincronizzaTaglio();
  aggiornaScadenzeUnificate();
  SpreadsheetApp.getUi().alert("✓ Sincronizzazione completa.");
}

function sincronizzaCuscini() {
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var kits = getAllKits();
  var oggi = new Date();

  // Foglio KIT CUSCINI
  var shKit = ss.getSheetByName("KIT Cuscini") || ss.insertSheet("KIT Cuscini");
  resetFoglio(shKit);
  kits = ordinaPerNumero(kits);
  var hKit = ["N°","Nome","Mezzo","Targa","Bar","Anno","Data Revisione","Stato","Giorni","Dislocazione","Tecnico","Esito","Componenti","ID"];
  shKit.getRange(1,1,1,hKit.length).setValues([hKit])
    .setBackground("#1a2b3c").setFontColor("#ffffff").setFontWeight("bold");
  // Righe raggruppate per dislocazione
  var rKit = [], titoliKit = [], statiKit = [];
  raggruppaPerDislocazione(kits).forEach(function(gr) {
    titoliKit.push(rKit.length);
    rKit.push([gr.dislocazione.toUpperCase() + "   ·   " + gr.items.length + " kit",
               "","","","","","","","","","","","",""]);
    gr.items.forEach(function(k) {
      var st = statoCalcola(k, oggi);
      var g  = giorniA(k.dataRevisione);
      rKit.push([k.numero||"", k.nome||"", k.tipoMezzo||"", k.mezzo||"",
                 k.bar||"", k.annoAcquisto||"", cellaData(k.dataRevisione),
                 etichettaStato(st), g!==null?g:"N/D", k.dislocazione||"",
                 k.ultimaRevisioneTecnico||"", k.ultimaRevisioneEsito||"",
                 contaComponenti(k.componenti, compCuscinoFuoriUso), k.id||""]);
      statiKit.push(st);
    });
  });
  if (rKit.length) {
    shKit.getRange(2,1,rKit.length,hKit.length).setValues(rKit);
    var nDati = 0;
    for (var i = 0; i < rKit.length; i++) {
      if (titoliKit.indexOf(i) >= 0) continue;
      shKit.getRange(i+2,1,1,hKit.length).setBackground(coloreStato(statiKit[nDati]));
      nDati++;
    }
    titoliKit.forEach(function(idx) { stileRigaGruppo(shKit, idx+2, hKit.length, "#1a2b3c"); });
    shKit.getRange(2,7,rKit.length,1).setNumberFormat("dd/mm/yyyy").setHorizontalAlignment("center");
    shKit.getRange(2,9,rKit.length,1).setNumberFormat(FORMATO_GIORNI).setHorizontalAlignment("center");
  }
  formattaFoglio(shKit, hKit.length, titoliKit.map(function(i) { return i + 2; }));

  // Foglio COMPONENTI CUSCINI
  var shComp = ss.getSheetByName("Componenti Cuscini") || ss.insertSheet("Componenti Cuscini");
  resetFoglio(shComp);
  var hComp = ["Kit N°","Kit Nome","Tipo","Modello","Matricola","Matr. Lucca","Bar","Note","In Servizio"];
  shComp.getRange(1,1,1,hComp.length).setValues([hComp])
    .setBackground("#243447").setFontColor("#ffffff").setFontWeight("bold");

  // Righe raggruppate per KIT: una riga-titolo "KIT n · nome" prima di ogni blocco
  var rComp = [], righeGruppo = {};
  kits.forEach(function(k) {
    righeGruppo[rComp.length] = 1;
    rComp.push(["KIT " + (k.numero||"?") + (k.nome ? " · " + k.nome : ""), "","","","","","","",""]);
    var comps = k.componenti || [];
    if (!comps.length) {
      rComp.push(["","","(nessun componente)","","","","","",""]);
    } else {
      comps.forEach(function(c) {
        rComp.push([k.numero||"", k.nome||"", c.tipo||"", c.modello||"",
                    c.matricola||"", c.matricolaLucca||"", c.bar||"",
                    c.note||"", c.dataInizioServizio||""]);
      });
    }
  });

  if (rComp.length) {
    shComp.getRange(2,1,rComp.length,hComp.length).setValues(rComp);
    // Matr. Lucca evidenziata
    shComp.getRange(2,6,rComp.length,1)
      .setBackground("#e6f1fb").setFontColor("#185fa5").setFontWeight("bold");
    // Righe-titolo di gruppo (unite, sovrascrivono lo stile sopra)
    for (var i=0; i<rComp.length; i++) {
      if (righeGruppo[i]) stileRigaGruppo(shComp, i+2, hComp.length, "#1a2b3c");
    }
  }
  formattaFoglio(shComp, hComp.length, righeTitoloDa(righeGruppo));
}

function sincronizzaTaglio() {
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var gruppi  = getAllGruppiTaglio();
  var oggi    = new Date();

  // Foglio KIT TAGLIO
  var shKit = ss.getSheetByName("KIT Taglio") || ss.insertSheet("KIT Taglio");
  resetFoglio(shKit);
  gruppi = ordinaPerNumero(gruppi);
  var hKit = ["N°","Nome","Mezzo","Targa","Sistema","Marca","Anno","Prox. Revisione","Stato","Giorni","Dislocazione","Ult. Esito","Componenti","ID"];
  shKit.getRange(1,1,1,hKit.length).setValues([hKit])
    .setBackground("#7a3500").setFontColor("#ffffff").setFontWeight("bold");
  // Righe raggruppate per dislocazione
  var rKit = [], titoliKit = [], statiKit = [];
  raggruppaPerDislocazione(gruppi).forEach(function(gr) {
    titoliKit.push(rKit.length);
    rKit.push([gr.dislocazione.toUpperCase() + "   ·   " + gr.items.length +
               (gr.items.length === 1 ? " gruppo" : " gruppi"), "","","","","","","","","","","","",""]);
    gr.items.forEach(function(g) {
      var st   = statoGT(g, oggi);
      var prox = prossimaRevGT(g);
      var gg   = giorniA(prox);
      rKit.push([g.numero||"", g.nome||"", g.tipoMezzo||"", g.mezzo||"",
                 g.sistema||"", g.marca||"", g.annoAcquisto||"",
                 cellaData(prox),
                 etichettaStato(st), gg!==null?gg:"N/D", g.dislocazione||"",
                 g.ultimaRevisioneEsito||"",
                 contaComponenti(g.componenti, compTaglioFuoriUso), g.id||""]);
      statiKit.push(st);
    });
  });
  if (rKit.length) {
    shKit.getRange(2,1,rKit.length,hKit.length).setValues(rKit);
    var nDati = 0;
    for (var i = 0; i < rKit.length; i++) {
      if (titoliKit.indexOf(i) >= 0) continue;
      shKit.getRange(i+2,1,1,hKit.length).setBackground(coloreStato(statiKit[nDati]));
      nDati++;
    }
    titoliKit.forEach(function(idx) { stileRigaGruppo(shKit, idx+2, hKit.length, "#7a3500"); });
    shKit.getRange(2,8,rKit.length,1).setNumberFormat("dd/mm/yyyy").setHorizontalAlignment("center");
    shKit.getRange(2,10,rKit.length,1).setNumberFormat(FORMATO_GIORNI).setHorizontalAlignment("center");
  }
  formattaFoglio(shKit, hKit.length, titoliKit.map(function(i) { return i + 2; }));

  // Foglio COMPONENTI TAGLIO (con olio e candela)
  var shComp = ss.getSheetByName("Componenti Taglio") || ss.insertSheet("Componenti Taglio");
  resetFoglio(shComp);
  var hComp = ["Kit N°","Kit Nome","Tipo","Modello","Matricola","Pressione","Stato Comp.","Olio","Candela","Anno Comp.","Ultima Rev.","Prox. Rev."];
  shComp.getRange(1,1,1,hComp.length).setValues([hComp])
    .setBackground("#7a3500").setFontColor("#ffffff").setFontWeight("bold");
  // Righe raggruppate per KIT: una riga-titolo "KIT n · nome" prima di ogni blocco
  var rComp = [], righeGruppo = {};
  gruppi.forEach(function(g) {
    righeGruppo[rComp.length] = 1;
    rComp.push(["KIT " + (g.numero||"?") + (g.nome ? " · " + g.nome : ""), "","","","","","","","","","",""]);
    var comps = g.componenti || [];
    if (!comps.length) {
      rComp.push(["","","(nessun componente)","","","","","","","","",""]);
    } else {
      comps.forEach(function(c) {
        rComp.push([g.numero||"", g.nome||"", c.tipo||"", c.modello||"",
                    c.matricola||"", c.pressione||"", c.statoComp||"",
                    c.olio||"", c.candela||"",
                    c.annoComp||"", c.ultimaRevisione||"",
                    c.prossimaRevisione&&c.prossimaRevisione!=="NO REVISIONE"?c.prossimaRevisione:c.prossimaRevisione||""]);
      });
    }
  });
  if (rComp.length) {
    shComp.getRange(2,1,rComp.length,hComp.length).setValues(rComp);
    // Olio in verde, candela in arancio
    for (var i=0; i<rComp.length; i++) {
      if (righeGruppo[i]) continue;
      if (rComp[i][7]) shComp.getRange(i+2,8).setBackground("#eaf3de").setFontColor("#3b6d11").setFontWeight("bold");
      if (rComp[i][8]) shComp.getRange(i+2,9).setBackground("#faeeda").setFontColor("#854f0b").setFontWeight("bold");
    }
    for (var j=0; j<rComp.length; j++) {
      if (righeGruppo[j]) stileRigaGruppo(shComp, j+2, hComp.length, "#7a3500");
    }
  }
  formattaFoglio(shComp, hComp.length, righeTitoloDa(righeGruppo));
}

// Fasce di urgenza del foglio Scadenze (ordine = priorità di intervento)
var FASCE_SCADENZE = [
  { tit: "SCADUTE",           nota: "revisione già superata",             bgTit: "#8b1a1a", bgRiga: "#fcebeb" },
  { tit: "ENTRO 30 GIORNI",   nota: "da programmare subito",               bgTit: "#b23c17", bgRiga: "#fde7dc" },
  { tit: "ENTRO 90 GIORNI",   nota: "da mettere in calendario",            bgTit: "#8a6116", bgRiga: "#faeeda" },
  { tit: "ENTRO 12 MESI",     nota: "sotto controllo",                     bgTit: "#4a6b1f", bgRiga: "#f2f7e8" },
  { tit: "OLTRE 12 MESI",     nota: "nessuna azione richiesta",            bgTit: "#2f5d34", bgRiga: "#eaf3de" },
  { tit: "NON PROGRAMMATE",   nota: "senza data, in magazzino o in revisione", bgTit: "#4a5560", bgRiga: "#f1f3f5" }
];

// Da giorni-a-scadenza + stato alla fascia di appartenenza
function fasciaScadenza(giorni, stato) {
  if (stato === "magazzino" || stato === "in_revisione" || stato === "senza_data") return 5;
  if (giorni === null || giorni === undefined) return 5;
  if (giorni < 0)    return 0;
  if (giorni <= 30)  return 1;
  if (giorni <= 90)  return 2;
  if (giorni <= 365) return 3;
  return 4;
}

function aggiornaScadenzeUnificate() {
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var kits   = getAllKits();
  var gruppi = getAllGruppiTaglio();
  var oggi   = new Date();

  var sh = ss.getSheetByName("Scadenze") || ss.insertSheet("Scadenze");
  resetFoglio(sh);
  var h = ["Sistema","N°","Nome","Mezzo","Info","Dislocazione","Scadenza","Giorni","Stato"];
  sh.getRange(1,1,1,h.length).setValues([h])
    .setBackground("#1a2b3c").setFontColor("#ffffff").setFontWeight("bold");

  // Raccolta voci dai due sistemi
  var voci = [];
  kits.filter(function(k) { return k.stato !== "fuori_servizio"; }).forEach(function(k) {
    var st = statoCalcola(k, oggi), gg = giorniA(k.dataRevisione);
    voci.push({ sistema:"CUSCINI", numero:k.numero||"", nome:k.nome||"", mezzo:k.mezzo||"",
                info:(k.bar||"")+" bar", disloc:k.dislocazione||"", data:k.dataRevisione||"",
                giorni:gg, stato:st, fascia:fasciaScadenza(gg, st) });
  });
  gruppi.filter(function(g) { return g.stato !== "fuori_servizio"; }).forEach(function(g) {
    var st = statoGT(g, oggi), prox = prossimaRevGT(g), gg = giorniA(prox);
    voci.push({ sistema:"TAGLIO", numero:g.numero||"", nome:g.nome||"", mezzo:g.mezzo||"",
                info:(g.sistema||"")+" · "+(g.marca||""), disloc:g.dislocazione||"", data:prox||"",
                giorni:gg, stato:st, fascia:fasciaScadenza(gg, st) });
  });

  // Ordine: prima la fascia, poi i giorni crescenti
  voci.sort(function(a, b) {
    if (a.fascia !== b.fascia) return a.fascia - b.fascia;
    var ga = a.giorni === null ? 99999 : a.giorni;
    var gb = b.giorni === null ? 99999 : b.giorni;
    return ga - gb;
  });

  // Righe dati precedute dall'intestazione di fascia
  var rows = [], intestazioni = [], bgRighe = [];
  for (var f = 0; f < FASCE_SCADENZE.length; f++) {
    var blocco = voci.filter(function(v) { return v.fascia === f; });
    if (!blocco.length) continue;
    var F = FASCE_SCADENZE[f];
    intestazioni.push({ idx: rows.length, bg: F.bgTit });
    rows.push([F.tit + "   ·   " + blocco.length + (blocco.length === 1 ? " voce" : " voci") + "   ·   " + F.nota,
               "","","","","","","",""]);
    bgRighe.push(null);
    blocco.forEach(function(v) {
      var cella = "N/D";
      if (v.data) { var d = new Date(v.data); cella = isNaN(d) ? v.data : d; }
      rows.push([v.sistema, v.numero, v.nome, v.mezzo, v.info, v.disloc,
                 cella, v.giorni === null ? "N/D" : v.giorni, etichettaStato(v.stato)]);
      bgRighe.push(F.bgRiga);
    });
  }

  if (rows.length) {
    sh.getRange(2,1,rows.length,h.length).setValues(rows);

    // Sfondo per fascia + badge sistema
    for (var i = 0; i < rows.length; i++) {
      if (!bgRighe[i]) continue;
      sh.getRange(i+2,1,1,h.length).setBackground(bgRighe[i]);
      if (rows[i][0] === "CUSCINI") sh.getRange(i+2,1).setBackground("#e6f1fb").setFontColor("#1a2b3c").setFontWeight("bold");
      else                          sh.getRange(i+2,1).setBackground("#faeeda").setFontColor("#7a3500").setFontWeight("bold");
    }
    // Intestazioni di fascia
    intestazioni.forEach(function(t) { stileRigaGruppo(sh, t.idx+2, h.length, t.bg); });

    // Formati: data italiana, giorni con unità e negativi in rosso
    sh.getRange(2,7,rows.length,1).setNumberFormat("dd/mm/yyyy").setHorizontalAlignment("center");
    sh.getRange(2,8,rows.length,1).setNumberFormat(FORMATO_GIORNI).setHorizontalAlignment("center");
    sh.getRange(2,9,rows.length,1).setHorizontalAlignment("center");
    sh.getRange(2,1,rows.length,1).setHorizontalAlignment("center");
  }

  formattaFoglio(sh, h.length, intestazioni.map(function(t) { return t.idx + 2; }));
  // niente setFrozenColumns: le intestazioni di fascia sono celle unite e Sheets rifiuta il blocco
}

// ─── GESTIONE DOCUMENTI DRIVE ────────────────────────────────
var DRIVE_ROOT_ID = "1-HobTrpU-5ZkG9y1zeMeTSiZS8Yc22xw";

// Ottieni o crea cartella con nome specifico dentro un parent
function getOrCreateFolder(parentId, name) {
  var parent = DriveApp.getFolderById(parentId);
  var existing = parent.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(name);
}

// Struttura: SICS root / DOCUMENTI {anno} / Cuscini o Gruppi Taglio
function getCartellaAnno(anno, sistema) {
  var cartellaAnno    = getOrCreateFolder(DRIVE_ROOT_ID, "DOCUMENTI " + anno);
  var cartellaSistema = getOrCreateFolder(cartellaAnno.getId(), sistema === "taglio" ? "Gruppi Taglio" : "Cuscini");
  return cartellaSistema;
}

// Copia un file da Firebase Storage a Drive usando l'URL pubblico
function copiaFileSuDrive(url, nomeFile, anno, sistema) {
  try {
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var blob     = response.getBlob().setName(nomeFile);
    var cartella = getCartellaAnno(anno, sistema);
    var file     = cartella.createFile(blob);
    return file.getUrl();
  } catch(e) {
    Logger.log("Errore copia Drive: " + e.message);
    return null;
  }
}

// Sincronizza tutti i documenti Firebase su Drive
function sincronizzaDocumentiSuDrive() {
  var docs = firestoreGet("documenti");
  var copiati = 0;
  docs.forEach(function(d) {
    if (!d.url || d.driveUrl) return; // già copiato
    var driveUrl = copiaFileSuDrive(d.url, d.nomeFile, d.anno || new Date().getFullYear(), d.sistema || "cuscini");
    if (driveUrl) {
      firestorePatch("documenti", d.id, { driveUrl: driveUrl });
      copiati++;
    }
  });
  SpreadsheetApp.getUi().alert("✓ " + copiati + " documenti copiati su Drive.");
}

// Recupera documenti per kit (chiamata dalla sidebar)
function getDocumentiKit(kitId) {
  return firestoreGet("documenti")
    .filter(function(d) { return d.kitId === kitId; })
    .sort(function(a,b) { return (b.dataCaricamento||"").localeCompare(a.dataCaricamento||""); });
}


// ─── UPLOAD FILE SU DRIVE + METADATA SU FIRESTORE ────────────
function uploadFileSuDrive(base64Data, nomeFileOriginale, mimeType, kitId, kitNome, sistema, tipoDoc, anno, note) {
  try {
    // Crea nome file strutturato
    var sistemaStr  = sistema === "taglio" ? "Gruppi_Taglio" : "Cuscini";
    var dataOggi    = new Date().toISOString().split("T")[0];
    var nomeFile    = sistemaStr + "_" + kitNome.replace(/\s+/g,"_") + "_" + (tipoDoc||"doc").replace(/\s+/g,"_") + "_" + dataOggi + "_" + nomeFileOriginale;

    // Ottieni o crea cartella Drive
    var cartella = getCartellaAnno(anno || new Date().getFullYear(), sistema);

    // Crea file su Drive da base64
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, nomeFile);
    var file = cartella.createFile(blob);
    var driveUrl    = file.getUrl();
    var driveFileId = file.getId();

    // Calcola dimensione approssimativa
    var dimensione = Math.round(base64Data.length * 0.75);

    // Salva metadati su Firestore
    firestorePost("documenti", {
      kitId:           kitId || "",
      kitNome:         kitNome || "",
      sistema:         sistema || "cuscini",
      tipoDoc:         tipoDoc || "Documento",
      anno:            anno || new Date().getFullYear(),
      note:            note || "",
      nomeFile:        nomeFile,
      nomeFileOriginale: nomeFileOriginale,
      mimeType:        mimeType || "",
      dimensione:      dimensione,
      driveFileId:     driveFileId,
      driveUrl:        driveUrl,
      driveFolder:     cartella.getName(),
      dataCaricamento: new Date().toISOString(),
    });

    return { success: true, driveUrl: driveUrl, nomeFile: nomeFile };
  } catch(e) {
    Logger.log("Errore uploadFileSuDrive: " + e.message);
    throw new Error("Upload fallito: " + e.message);
  }
}

// Elimina documento (solo metadati Firestore — il file Drive rimane per sicurezza)
function eliminaDocumento(docId) {
  var doc = firestoreGetDoc("documenti", docId);
  if (!doc) return { success: false };
  // Opzionale: elimina anche il file Drive
  // try { DriveApp.getFileById(doc.driveFileId).setTrashed(true); } catch(e) {}
  // Elimina da Firestore
  var url = FIRESTORE_BASE + "/documenti/" + docId + "?key=" + FIREBASE_API_KEY;
  UrlFetchApp.fetch(url, { method: "DELETE", muteHttpExceptions: true });
  return { success: true };
}

function diagnosi() {
    var url = FIRESTORE_BASE + "/kits?key=" + FIREBASE_API_KEY + "&pageSize=1";
    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    Logger.log("HTTP " + resp.getResponseCode());
    Logger.log(resp.getContentText().substring(0, 400));
  }
