// Export dati kit in CSV e PDF (stampa HTML), raggruppati per kit.
// Le funzioni di stato/scadenza sono iniettate (fns) per testabilità.
// fns = { statoLabelOf(it): string, scadOf(it): dateStr|null, scadFmt(dateStr): string }

function escHtml(v) {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function escapeCsv(v) {
  if (v === null || v === undefined) v = "";
  v = String(v);
  if (/[";\n\r]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
  return v;
}

// ── CSV ──────────────────────────────────────────────────────
export function buildCsv(items, sistema, fns) {
  const isT = sistema === "taglio";
  const header = isT
    ? ["N° Kit", "Nome", "Mezzo", "Sistema", "Marca", "Dislocazione", "Stato", "Prossima Revisione", "Componente", "Modello", "Matricola", "Pressione"]
    : ["N° Kit", "Nome", "Mezzo", "Bar", "Dislocazione", "Stato", "Prossima Revisione", "Componente", "Modello", "Matricola Costruttore", "Matricola Lucca"];
  const rows = [header];

  (items || []).forEach(it => {
    const stato = fns.statoLabelOf(it);
    const scad = fns.scadFmt(fns.scadOf(it));
    const base = isT
      ? [it.numero, it.nome, it.mezzo, it.sistema, it.marca, it.dislocazione, stato, scad]
      : [it.numero, it.nome, it.mezzo, it.bar, it.dislocazione, stato, scad];
    const comps = it.componenti || [];
    if (!comps.length) {
      rows.push([...base, "", "", "", ""]);
      return;
    }
    comps.forEach(c => {
      rows.push(isT
        ? [...base, c.tipo, c.modello, c.matricola, c.pressione]
        : [...base, c.tipo, c.modello, c.matricola, c.matricolaLucca]);
    });
  });

  return rows.map(r => r.map(escapeCsv).join(";")).join("\r\n");
}

// ── PDF (HTML stampabile) ────────────────────────────────────
export function buildHtmlReport(items, sistema, fns) {
  const isT = sistema === "taglio";
  const titolo = isT ? "Gruppi da Taglio" : "Cuscini di Sollevamento";
  const oggi = new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });

  const thead = isT
    ? "<tr><th>Componente</th><th>Modello</th><th>Matricola</th><th>Pressione</th></tr>"
    : "<tr><th>Componente</th><th>Modello</th><th>Matricola costr.</th><th>Matricola Lucca</th></tr>";

  const sezioni = (items || []).map(it => {
    const stato = fns.statoLabelOf(it);
    const scad = fns.scadFmt(fns.scadOf(it));
    const meta = isT
      ? `${escHtml(it.mezzo) || "—"} · ${escHtml(it.sistema)} ${escHtml(it.marca)} · ${escHtml(it.dislocazione) || "—"}`
      : `${escHtml(it.mezzo) || "—"} · ${escHtml(it.bar)} bar · ${escHtml(it.dislocazione) || "—"}`;
    const righe = (it.componenti || []).map(c => isT
      ? `<tr><td>${escHtml(c.tipo)}</td><td>${escHtml(c.modello) || "—"}</td><td>${escHtml(c.matricola) || "—"}</td><td>${escHtml(c.pressione) || "—"}</td></tr>`
      : `<tr><td>${escHtml(c.tipo)}</td><td>${escHtml(c.modello) || "—"}</td><td>${escHtml(c.matricola) || "—"}</td><td class="lucca">${escHtml(c.matricolaLucca) || "—"}</td></tr>`
    ).join("");
    return `<section class="kit">
      <div class="kit-h"><span class="kit-n">${escHtml(it.numero)}</span><span class="kit-name">${escHtml(it.nome)}</span><span class="kit-stato">${escHtml(stato)}</span></div>
      <div class="kit-meta">${meta} · Prossima revisione: <b>${escHtml(scad)}</b></div>
      <table>${thead}${righe || '<tr><td colspan="4" class="vuoto">Nessun componente</td></tr>'}</table>
    </section>`;
  }).join("");

  return `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><title>SICS — ${titolo}</title>
<style>
  *{box-sizing:border-box;}
  body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1a2b3c;margin:24px;font-size:12px;}
  header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1a2b3c;padding-bottom:8px;margin-bottom:16px;}
  header h1{font-size:18px;margin:0;}
  header .sub{font-size:12px;color:#555;}
  .kit{break-inside:avoid;page-break-inside:avoid;border:1px solid #d0d5dd;border-radius:8px;padding:10px 12px;margin-bottom:12px;}
  .kit-h{display:flex;align-items:center;gap:10px;margin-bottom:4px;}
  .kit-n{font-size:20px;font-weight:800;color:#${isT ? "b35a00" : "3949ab"};min-width:34px;}
  .kit-name{font-size:14px;font-weight:700;flex:1;}
  .kit-stato{font-size:10px;font-weight:700;text-transform:uppercase;color:#555;}
  .kit-meta{font-size:11px;color:#555;margin-bottom:8px;}
  table{width:100%;border-collapse:collapse;}
  th,td{text-align:left;padding:4px 8px;border-bottom:1px solid #e8eaed;font-size:11px;}
  th{background:#f0f2f5;font-size:9px;text-transform:uppercase;letter-spacing:.04em;color:#555;}
  td.lucca{font-family:monospace;font-weight:700;color:#3949ab;}
  td.vuoto{color:#999;font-style:italic;}
  @media print{ body{margin:10mm;} }
</style></head>
<body>
  <header><h1>SICS 78 — VVF Siena</h1><div class="sub">${titolo}<br>Esportato il ${oggi} · ${(items || []).length} kit</div></header>
  ${sezioni || '<p>Nessun dato.</p>'}
  <script>window.onload=function(){setTimeout(function(){window.print();},200);};</script>
</body></html>`;
}
