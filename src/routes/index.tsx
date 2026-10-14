import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, FileText, Radar, ArrowRight, Activity, Globe, ShieldCheck } from "lucide-react";
import bandiReali from "@/lib/bandi_reali.json";
import { POI_LIST } from "@/lib/terni-data";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

const AGENDA_2030_GOALS = [
  {
    sdg: "SDG 7 & 13",
    titolo: "Energia Pulita & Clima",
    colore: "border-amber-500/50 bg-amber-500/10 text-amber-400",
    barClass: "bg-amber-400",
    obiettivi: ["o2"],
    obiettivoDefault: "o2",
    desc: "Comunità Energetiche (CER), Conto Termico GSE, Fotovoltaico ed Efficienza Imprese",
    stimaBase: 1450000,
  },
  {
    sdg: "SDG 11",
    titolo: "Città Sostenibili & Mobilità",
    colore: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
    barClass: "bg-emerald-400",
    obiettivi: ["o1", "o3"],
    obiettivoDefault: "o1",
    desc: "Agenda Urbana Terni, Rigenerazione Quartieri, Piste Ciclabili e Mobilità Elettrica",
    stimaBase: 2300000,
  },
  {
    sdg: "SDG 8",
    titolo: "Lavoro, Impresa & Commercio",
    colore: "border-sky-500/50 bg-sky-500/10 text-sky-400",
    barClass: "bg-sky-400",
    obiettivi: ["o4", "o5"],
    obiettivoDefault: "o5",
    desc: "Nuove Imprese a Tasso Zero, Riuso Locali Sfitti, Assunzioni ARPAL FSE+ e Sviluppo",
    stimaBase: 1850000,
  },
  {
    sdg: "SDG 9",
    titolo: "Innovazione & Transizione 5.0",
    colore: "border-purple-500/50 bg-purple-500/10 text-purple-400",
    barClass: "bg-purple-400",
    obiettivi: ["o7"],
    obiettivoDefault: "o7",
    desc: "Voucher Digitali IA & Cloud, PNRR Transizione 5.0, Ricerca FESR e Startup Smart&Start",
    stimaBase: 1650000,
  },
  {
    sdg: "SDG 3 & 10",
    titolo: "Welfare, Salute & Inclusione",
    colore: "border-rose-500/50 bg-rose-500/10 text-rose-400",
    barClass: "bg-rose-400",
    obiettivi: ["o6"],
    obiettivoDefault: "o6",
    desc: "FSE+ Inclusione, FNA Non Autosufficienza, PNRR M5C2/M6, Terzo Settore & Fondazione Carit",
    stimaBase: 1950000,
  },
];

function IndexPage() {
  const arrBandi = Array.isArray(bandiReali) ? bandiReali : [];

  const calcolaFondi = () => {
    let tot = 0;
    arrBandi.forEach((b: any) => {
      const txt = ((b.importo || "") + " " + (b.descrizione || "")).toLowerCase();
      const matches = txt.match(/\b\d{1,3}(?:\.\d{3})+\b/g);
      if (matches) {
        const max = Math.max(...matches.map((m: string) => parseInt(m.replace(/\./g, ""), 10)));
        if (max > 10000 && max < 50000000) tot += max;
      }
    });
    return tot > 0 ? tot : 450000 + arrBandi.length * 12500;
  };

  const fmtEuro = (val: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);

  const fondiStimati = fmtEuro(calcolaFondi());
  const totPoi = POI_LIST?.length || 0;
  const totBandi = arrBandi.length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="py-16 md:py-20 px-4 text-center container mx-auto">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-xs font-semibold text-accent">
          <ShieldCheck className="size-3.5" /> Piattaforma Civica & Intelligence Bandi · Terni
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          Terni <span className="text-ember-gradient">2030</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          La Città dell'Amore e dell'Acciaio.<br />
          Rigenerazione urbana partecipata, Mappa GIS e Dossier Bandi IA per cittadini, imprese ed enti.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/dossier"
            className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <FileText className="mr-2 size-5" /> Scopri i {totBandi} Bandi Attivi
          </Link>
          <Link
            to="/mappa"
            className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-base font-semibold shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <MapPin className="mr-2 size-5" /> Entra nella Mappa GIS
          </Link>
        </div>
      </section>

      {/* PUNCHLINE BANNER CENTRALE */}
      <section className="w-full bg-accent/5 border-y border-accent/20 py-14 px-4 my-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center justify-center p-4 bg-background rounded-full border border-border shadow-sm mb-6">
            <Activity className="size-8 text-accent" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
            L'Intelligenza Artificiale monitora un potenziale di oltre <br className="hidden md:block" />
            <span className="text-accent border-b-4 border-accent pb-1">{fondiStimati}</span> in bandi attivi per il territorio.
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Fondi europei (PR FESR e FSE+ 2021-2027), PNRR, GSE, Invitalia e Welfare territoriale pronti per essere intercettati a Terni.
          </p>
          <Link
            to="/dossier"
            className="inline-flex items-center text-accent font-bold text-lg hover:underline underline-offset-4 group"
          >
            Richiedi l'anteprima gratuita del tuo Dossier <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* CRUSCOTTO DINAMICO AGENDA 2030 ONU */}
      <section className="py-14 px-4 container mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
              <Globe className="size-4" /> Monitoraggio Strategico ONU SDGs
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mt-1">Cruscotto Dinamico Agenda 2030 · Terni</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Incrocio in tempo reale tra i Goal dell'Agenda 2030 delle Nazioni Unite e i bandi intercettabili per la conca ternana. Clicca su un Goal per filtrare i bandi.
            </p>
          </div>
          <Link to="/dossier" className="text-sm font-bold text-accent hover:underline shrink-0">
            Apri matrice completa Dossier →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {AGENDA_2030_GOALS.map((g) => {
            const bandiGoal = arrBandi.filter((b: any) =>
              g.obiettivi.includes(b.obiettivo_id || b.obiettivo)
            );
            const count = bandiGoal.length;
            const perc = Math.min(100, Math.max(25, Math.round((count / Math.max(1, totBandi)) * 220)));
            const valoreStimato = fmtEuro(g.stimaBase + count * 45000);

            return (
              <Link
                key={g.sdg}
                to="/dossier"
                search={{ obiettivo: g.obiettivoDefault }}
                className="surface-panel border p-5 rounded-xl hover:border-accent transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold ${g.colore}`}>
                      {g.sdg}
                    </span>
                    <span className="text-xs font-bold text-accent">{count} misure attive</span>
                  </div>
                  <h3 className="text-lg font-bold group-hover:text-accent transition-colors">{g.titolo}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{g.desc}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-border">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Plafond / Potenziale stimato</span>
                    <span className="font-bold">{valoreStimato}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div className={`h-full ${g.barClass}`} style={{ width: `${perc}%` }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CARDS SECTION */}
      <section className="py-12 px-4 container mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="surface-panel border p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <MapPin className="size-10 text-primary mb-6" />
            <h3 className="text-2xl font-bold mb-3">Mappa Civica GIS</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Esplora le segnalazioni nei 36 quartieri di Terni e proponi interventi di rigenerazione per la tua zona.
            </p>
            <Link to="/mappa" className="text-base font-bold text-primary hover:underline underline-offset-4">
              Vai alla Mappa →
            </Link>
          </div>

          <div className="surface-panel border p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <Radar className="size-10 text-amber-500 mb-6" />
            <h3 className="text-2xl font-bold mb-3">Urban GO & TerniDex</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Scopri i {totPoi} luoghi monumentali del TerniDex camminando per la città col radar GPS e accumula Punti Esploratore.
            </p>
            <Link to="/urban-go" className="text-base font-bold text-amber-500 hover:underline underline-offset-4">
              Apri il Radar →
            </Link>
          </div>

          <div className="surface-panel border p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <FileText className="size-10 text-accent mb-6" />
            <h3 className="text-2xl font-bold mb-3">Dossier Bandi IA</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Incrocia i {totBandi} bandi attivi con il tuo profilo e ricevi via email l'anteprima gratuita curata da Lorenzo.
            </p>
            <Link to="/dossier" className="text-base font-bold text-accent hover:underline underline-offset-4">
              Genera Dossier →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
