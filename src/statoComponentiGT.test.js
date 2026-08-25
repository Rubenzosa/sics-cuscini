import {
  calcolaStatoGT,
  prossimaRevisioneGT,
  componentiNonOperativiGT,
  componenteAttivoGT,
  applicaStatoComponenteGT,
  patchComponentiRevisioneGT,
  riepilogoFermiComponente,
} from "./utils";

const oggi = new Date();
const isoTraGiorni = g => {
  const d = new Date(oggi);
  d.setDate(d.getDate() + g);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const comp = (over = {}) => ({
  tipo: "CESOIA", modello: "X", matricola: "1",
  prossimaRevisione: isoTraGiorni(800), ...over,
});

describe("componenteAttivoGT", () => {
  test("componente senza statoOperativo e' attivo (retrocompatibilita')", () => {
    expect(componenteAttivoGT(comp())).toBe(true);
  });
  test("componente in revisione non e' attivo", () => {
    expect(componenteAttivoGT(comp({ statoOperativo: "in_revisione" }))).toBe(false);
  });
  test("componente fuori servizio non e' attivo", () => {
    expect(componenteAttivoGT(comp({ statoOperativo: "fuori_servizio" }))).toBe(false);
  });
});

describe("prossimaRevisioneGT", () => {
  test("ignora la scadenza dei componenti non attivi", () => {
    const gt = { stato: "attivo", componenti: [
      comp({ statoOperativo: "in_revisione", prossimaRevisione: isoTraGiorni(-500) }),
      comp({ prossimaRevisione: isoTraGiorni(800) }),
    ]};
    expect(prossimaRevisioneGT(gt)).toBe(isoTraGiorni(800));
  });
  test("ritorna null se tutti i componenti sono non attivi", () => {
    const gt = { stato: "attivo", componenti: [
      comp({ statoOperativo: "fuori_servizio" }),
      comp({ statoOperativo: "in_revisione" }),
    ]};
    expect(prossimaRevisioneGT(gt)).toBeNull();
  });
});

describe("calcolaStatoGT", () => {
  test("un componente scaduto ma in officina non rende scaduto il kit", () => {
    const gt = { stato: "attivo", componenti: [
      comp({ statoOperativo: "in_revisione", prossimaRevisione: isoTraGiorni(-500) }),
      comp({ prossimaRevisione: isoTraGiorni(800) }),
    ]};
    expect(calcolaStatoGT(gt)).toBe("regolare");
  });
  test("kit con tutti i componenti non attivi risulta senza_data", () => {
    const gt = { stato: "attivo", componenti: [
      comp({ statoOperativo: "fuori_servizio", prossimaRevisione: isoTraGiorni(-500) }),
    ]};
    expect(calcolaStatoGT(gt)).toBe("senza_data");
  });
  test("componente attivo scaduto rende il kit scaduto", () => {
    const gt = { stato: "attivo", componenti: [comp({ prossimaRevisione: isoTraGiorni(-10) })] };
    expect(calcolaStatoGT(gt)).toBe("scaduto");
  });
});

describe("componentiNonOperativiGT", () => {
  test("conta in revisione e fuori servizio, non gli attivi", () => {
    const gt = { componenti: [
      comp(),
      comp({ statoOperativo: "in_revisione" }),
      comp({ statoOperativo: "fuori_servizio" }),
      comp({ statoOperativo: "attivo" }),
    ]};
    expect(componentiNonOperativiGT(gt)).toEqual({ inRevisione: 1, fuoriServizio: 1, totale: 2 });
  });
  test("kit senza componenti ritorna zeri", () => {
    expect(componentiNonOperativiGT({})).toEqual({ inRevisione: 0, fuoriServizio: 0, totale: 0 });
  });
});

describe("applicaStatoComponenteGT", () => {
  const base = [
    { tipo:"CESOIA", prossimaRevisione:"2030-01-01" },
    { tipo:"PISTONE", prossimaRevisione:"2030-01-01" },
  ];

  test("marca il componente indicato come in revisione con motivo e data", () => {
    const out = applicaStatoComponenteGT(base, 1, "in_revisione", {
      motivo:"Perdita olio", note:"gocciola dal raccordo", data:"2026-08-24", officina:"Lukas Service",
    });
    expect(out[1]).toMatchObject({
      tipo:"PISTONE", statoOperativo:"in_revisione",
      motivoStato:"Perdita olio", noteStato:"gocciola dal raccordo",
      dataStato:"2026-08-24", officina:"Lukas Service",
    });
  });

  test("non tocca gli altri componenti ne l'array originale", () => {
    const out = applicaStatoComponenteGT(base, 1, "fuori_servizio", { motivo:"Grippato", data:"2026-08-24" });
    expect(out[0]).toEqual(base[0]);
    expect(base[1].statoOperativo).toBeUndefined();
  });

  test("il rientro in servizio pulisce i campi di stato", () => {
    const fermi = applicaStatoComponenteGT(base, 0, "in_revisione", { motivo:"Perdita olio", data:"2026-08-24", officina:"X" });
    const out = applicaStatoComponenteGT(fermi, 0, "attivo", { data:"2026-09-30" });
    expect(out[0].statoOperativo).toBe("attivo");
    expect(out[0].motivoStato).toBe("");
    expect(out[0].noteStato).toBe("");
    expect(out[0].officina).toBe("");
    expect(out[0].dataRientro).toBe("2026-09-30");
  });

  test("indice fuori range lascia i componenti invariati", () => {
    expect(applicaStatoComponenteGT(base, 9, "in_revisione", { motivo:"X" })).toEqual(base);
  });
});

describe("patchComponentiRevisioneGT", () => {
  test("aggiorna solo i componenti attivi con revisione prevista", () => {
    const componenti = [
      { tipo:"CESOIA",  prossimaRevisione:"2027-01-01" },
      { tipo:"MORSA",   prossimaRevisione:"NO REVISIONE" },
      { tipo:"PISTONE", prossimaRevisione:"2027-01-01", statoOperativo:"in_revisione" },
      { tipo:"TUBI",    prossimaRevisione:"2027-01-01", statoOperativo:"fuori_servizio" },
    ];
    const out = patchComponentiRevisioneGT(componenti, "2026-08-24", "2029-08-24");
    expect(out[0]).toMatchObject({ ultimaRevisione:"2026-08-24", prossimaRevisione:"2029-08-24" });
    expect(out[1]).toEqual(componenti[1]);
    expect(out[2]).toEqual(componenti[2]);
    expect(out[3]).toEqual(componenti[3]);
  });
});

describe("riepilogoFermiComponente", () => {
  const stati = [
    { componenteMatricola:"1261646HH", indexComp:0, stato:"in_revisione",   data:"2024-03-01" },
    { componenteMatricola:"1261646HH", indexComp:0, stato:"attivo",          data:"2024-05-01" },
    { componenteMatricola:"1261646HH", indexComp:0, stato:"fuori_servizio",  data:"2025-07-01" },
    { componenteMatricola:"1261646HH", indexComp:0, stato:"attivo",          data:"2025-08-01" },
    { componenteMatricola:"1261646HH", indexComp:0, stato:"in_revisione",    data:"2026-08-24" },
    { componenteMatricola:"9999",      indexComp:1, stato:"in_revisione",    data:"2026-01-01" },
  ];

  test("conta solo i fermi del componente, non i rientri", () => {
    const r = riepilogoFermiComponente(stati, { matricola:"1261646HH" }, 0);
    expect(r.fermi).toBe(3);
  });

  test("calcola l'arco di anni coperto dallo storico", () => {
    const r = riepilogoFermiComponente(stati, { matricola:"1261646HH" }, 0);
    expect(r.anni).toBe(2);
  });

  test("senza matricola ripiega sull'indice del componente", () => {
    const r = riepilogoFermiComponente(stati, { matricola:"" }, 1);
    expect(r.fermi).toBe(1);
  });

  test("componente mai fermato ritorna zero", () => {
    expect(riepilogoFermiComponente(stati, { matricola:"0000" }, 7)).toEqual({ fermi:0, anni:0 });
  });

  test("storico assente non rompe", () => {
    expect(riepilogoFermiComponente(undefined, { matricola:"x" }, 0)).toEqual({ fermi:0, anni:0 });
  });
});
