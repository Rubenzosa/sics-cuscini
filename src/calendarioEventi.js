// Normalizza le sorgenti del calendario in un'unica lista di eventi.
// Le funzioni di stato/scadenza sono iniettate per testabilità (niente date di sistema qui).

const iso = d => (d ? String(d).slice(0, 10) : null);

export function normalizzaEventi(sorgenti, fns) {
  const { kits = [], gruppi = [], pianificate = [], manutenzioni = [], promemoria = [] } = sorgenti || {};
  const { statoKit, statoGT, scadGT } = fns;
  const out = [];

  kits.forEach(k => {
    if (!k.dataRevisione) return;
    out.push({ id: k.id, data: iso(k.dataRevisione), sistema: "cuscini", tipo: "scadenza", nome: `Kit ${k.numero} — ${k.nome}`, stato: statoKit(k) });
  });
  gruppi.forEach(g => {
    const scad = scadGT(g);
    if (!scad || scad === "NO REVISIONE") return;
    out.push({ id: g.id, data: iso(scad), sistema: "taglio", tipo: "scadenza", nome: `Kit ${g.numero} — ${g.nome}`, stato: statoGT(g) });
  });
  pianificate.forEach(p => {
    if (!p.dataPrevista) return;
    out.push({ id: p.id, data: iso(p.dataPrevista), sistema: p.sistema === "taglio" ? "taglio" : "cuscini", tipo: "pianificata", nome: (p.kitNomi || []).join(", ") || p.officina || "Revisione pianificata", stato: p.stato || "pianificata" });
  });
  manutenzioni.forEach(m => {
    if (!m.data) return;
    out.push({ id: m.id, data: iso(m.data), sistema: "taglio", tipo: "manutenzione", nome: `${m.gtNome || "Gruppo"}${m.tipo ? " — " + m.tipo : ""}`, stato: "manutenzione" });
  });
  promemoria.forEach(r => {
    if (!r.data) return;
    out.push({ id: r.id, data: iso(r.data), sistema: r.sistema === "taglio" ? "taglio" : "cuscini", tipo: "promemoria", nome: r.titolo || "Promemoria", stato: "promemoria" });
  });
  return out;
}
