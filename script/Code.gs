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
  shKit.clearContents();
  var hKit = ["ID","N°","Nome","Mezzo","Targa","Bar","Anno","Data Revisione","Stato","Giorni","Dislocazione","Tecnico","Esito","Componenti"];
  shKit.getRange(1,1,1,hKit.length).setValues([hKit])
    .setBackground("#1a2b3c").setFontColor("#ffffff").setFontWeight("bold");
  var rKit = kits.map(function(k) {
    var s = statoCalcola(k, oggi);
    var g = giorniA(k.dataRevisione);
    return [k.id||"", k.numero||"", k.nome||"", k.tipoMezzo||"", k.mezzo||"",
            k.bar||"", k.annoAcquisto||"", k.dataRevisione||"",
            s, g!==null?g:"N/D", k.dislocazione||"",
            k.ultimaRevisioneTecnico||"", k.ultimaRevisioneEsito||"",
            (k.componenti||[]).length];
  });
  if (rKit.length) {
    shKit.getRange(2,1,rKit.length,hKit.length).setValues(rKit);
    rKit.forEach(function(r,i) {
      shKit.getRange(i+2,1,1,hKit.length).setBackground(coloreStato(r[8]));
    });
  }
  shKit.setFrozenRows(1); shKit.autoResizeColumns(1,hKit.length);

  // Foglio COMPONENTI CUSCINI
  var shComp = ss.getSheetByName("Componenti Cuscini") || ss.insertSheet("Componenti Cuscini");
  shComp.clearContents();
  var hComp = ["Kit N°","Kit Nome","Tipo","Modello","Matricola","Matr. Lucca","Bar","Note","In Servizio"];
  shComp.getRange(1,1,1,hComp.length).setValues([hComp])
    .setBackground("#243447").setFontColor("#ffffff").setFontWeight("bold");
  var rComp = [];
  kits.forEach(function(k) {
    (k.componenti||[]).forEach(function(c) {
      rComp.push([k.numero||"", k.nome||"", c.tipo||"", c.modello||"",
                  c.matricola||"", c.matricolaLucca||"", c.bar||"",
                  c.note||"", c.dataInizioServizio||""]);
    });
  });
  if (rComp.length) {
    shComp.getRange(2,1,rComp.length,hComp.length).setValues(rComp);
    for (var i=0; i<rComp.length; i++) {
      shComp.getRange(i+2,6).setBackground("#e6f1fb").setFontColor("#185fa5").setFontWeight("bold");
    }
  }
  shComp.setFrozenRows(1); shComp.autoResizeColumns(1,hComp.length);
}

function sincronizzaTaglio() {
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var gruppi  = getAllGruppiTaglio();
  var oggi    = new Date();

  // Foglio KIT TAGLIO
  var shKit = ss.getSheetByName("KIT Taglio") || ss.insertSheet("KIT Taglio");
  shKit.clearContents();
  var hKit = ["ID","N°","Nome","Mezzo","Targa","Sistema","Marca","Anno","Prox. Revisione","Stato","Giorni","Dislocazione","Ult. Esito","Componenti"];
  shKit.getRange(1,1,1,hKit.length).setValues([hKit])
    .setBackground("#7a3500").setFontColor("#ffffff").setFontWeight("bold");
  var rKit = gruppi.map(function(g) {
    var s    = statoGT(g, oggi);
    var prox = prossimaRevGT(g);
    var gg   = giorniA(prox);
    return [g.id||"", g.numero||"", g.nome||"", g.tipoMezzo||"", g.mezzo||"",
            g.sistema||"", g.marca||"", g.annoAcquisto||"",
            prox&&prox!=="NO REVISIONE"?prox:prox||"N/D",
            s, gg!==null?gg:"N/D", g.dislocazione||"",
            g.ultimaRevisioneEsito||"", (g.componenti||[]).length];
  });
  if (rKit.length) {
    shKit.getRange(2,1,rKit.length,hKit.length).setValues(rKit);
    rKit.forEach(function(r,i) {
      shKit.getRange(i+2,1,1,hKit.length).setBackground(coloreStato(r[9]));
    });
  }
  shKit.setFrozenRows(1); shKit.autoResizeColumns(1,hKit.length);

  // Foglio COMPONENTI TAGLIO (con olio e candela)
  var shComp = ss.getSheetByName("Componenti Taglio") || ss.insertSheet("Componenti Taglio");
  shComp.clearContents();
  var hComp = ["Kit N°","Kit Nome","Tipo","Modello","Matricola","Pressione","Stato Comp.","Olio","Candela","Anno Comp.","Ultima Rev.","Prox. Rev."];
  shComp.getRange(1,1,1,hComp.length).setValues([hComp])
    .setBackground("#7a3500").setFontColor("#ffffff").setFontWeight("bold");
  var rComp = [];
  gruppi.forEach(function(g) {
    (g.componenti||[]).forEach(function(c) {
      rComp.push([g.numero||"", g.nome||"", c.tipo||"", c.modello||"",
                  c.matricola||"", c.pressione||"", c.statoComp||"",
                  c.olio||"", c.candela||"",
                  c.annoComp||"", c.ultimaRevisione||"",
                  c.prossimaRevisione&&c.prossimaRevisione!=="NO REVISIONE"?c.prossimaRevisione:c.prossimaRevisione||""]);
    });
  });
  if (rComp.length) {
    shComp.getRange(2,1,rComp.length,hComp.length).setValues(rComp);
    // Olio in verde, candela in arancio
    for (var i=0; i<rComp.length; i++) {
      if (rComp[i][7]) shComp.getRange(i+2,8).setBackground("#eaf3de").setFontColor("#3b6d11").setFontWeight("bold");
      if (rComp[i][8]) shComp.getRange(i+2,9).setBackground("#faeeda").setFontColor("#854f0b").setFontWeight("bold");
    }
  }
  shComp.setFrozenRows(1); shComp.autoResizeColumns(1,hComp.length);
}

function aggiornaScadenzeUnificate() {
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var kits   = getAllKits();
  var gruppi = getAllGruppiTaglio();
  var oggi   = new Date();

  var sh = ss.getSheetByName("Scadenze") || ss.insertSheet("Scadenze");
  sh.clearContents();
  var h = ["Sistema","N°","Nome","Mezzo","Info","Dislocazione","Prox. Revisione","Giorni","Stato","Priorità"];
  sh.getRange(1,1,1,h.length).setValues([h])
    .setBackground("#1a2b3c").setFontColor("#ffffff").setFontWeight("bold");

  var rows = [];
  kits.filter(function(k) { return k.stato !== "fuori_servizio"; }).forEach(function(k) {
    var s = statoCalcola(k, oggi);
    var g = giorniA(k.dataRevisione);
    var p = s==="scaduto"?1:s==="critico"?2:s==="attenzione"?3:s==="buono"?4:5;
    rows.push(["CUSCINI", k.numero||"", k.nome||"", k.mezzo||"",
               (k.bar||"")+" bar", k.dislocazione||"",
               k.dataRevisione||"", g!==null?g:"N/D", s, p]);
  });
  gruppi.filter(function(g) { return g.stato !== "fuori_servizio"; }).forEach(function(g) {
    var s    = statoGT(g, oggi);
    var prox = prossimaRevGT(g);
    var gg   = giorniA(prox);
    var p    = s==="scaduto"?1:s==="critico"?2:s==="attenzione"?3:s==="buono"?4:5;
    rows.push(["TAGLIO", g.numero||"", g.nome||"", g.mezzo||"",
               (g.sistema||"")+" · "+(g.marca||""), g.dislocazione||"",
               prox||"N/D", gg!==null?gg:"N/D", s, p]);
  });

  rows.sort(function(a,b) { return a[9]-b[9] || (a[7]||9999)-(b[7]||9999); });

  if (rows.length) {
    sh.getRange(2,1,rows.length,h.length).setValues(rows);
    rows.forEach(function(r,i) {
      var bg = coloreStato(r[8]);
      sh.getRange(i+2,1,1,h.length).setBackground(bg);
      // Sistema badge colore
      if (r[0]==="CUSCINI") sh.getRange(i+2,1).setBackground("#e6f1fb").setFontColor("#1a2b3c").setFontWeight("bold");
      else sh.getRange(i+2,1).setBackground("#faeeda").setFontColor("#7a3500").setFontWeight("bold");
    });
  }

  sh.setFrozenRows(1);
  sh.hideColumns(10); // nascondi colonna priorità
  sh.autoResizeColumns(1,9);
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