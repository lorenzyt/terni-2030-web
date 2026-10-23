import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, FileText, Radar, ArrowRight, Activity, Globe, ShieldCheck, Building2, HeartHandshake } from "lucide-react";
import bandiReali from "@/lib/bandi_reali.json";
import { POI_LIST } from "@/lib/terni-data";
import { useCivic } from "@/lib/civic-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Terni 2030 — Rigenerazione Urbana, Mappa GIS & Bandi IA" },
      {
        name: "description",
        content:
          "Piattaforma civica indipendente per la rigenerazione di Terni. Esplora la mappa GIS, scopri i finanziamenti attivi per cittadini e imprese e partecipa al cambiamento della città.",
      },
      // OpenGraph (Facebook, WhatsApp, LinkedIn)
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://terni2030.integritastudio.it/" },
      { property: "og:title", content: "Terni 2030 — La Città dell'Amore e dell'Acciaio" },
      {
        property: "og:description",
        content:
          "Mappa interattiva dei 36 quartieri, radar bandi istituzionali e gamification urbana monumentale curata da Lorenzo Covicchio.",
      },
      { property: "og:image", content: "https://terni2030.integritastudio.it/og-image.jpg" },
      // Twitter Card
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Terni 2030 — Rigenerazione Urbana & Bandi IA" },
      {
        name: "twitter:description",
        content:
          "Mappa GIS, intelligenza artificiale per i bandi e partecipazione attiva per il futuro di Terni.",
      },
    ],
  }),
  component: IndexPage,
});

function normKey(titolo: string): string {
  return String(titolo || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
}

function stimaValoreBando(b: any): number {
  if (typeof b?.valore_stimato_euro === "number" && b.valore_stimato_euro > 0) {
    return b.valore_stimato_euro;
  }
  const txt = `${b?.importo || ""} ${b?.descrizione || ""}`.toLowerCase();
  const matches = txt.match(/\b\d{1,3}(?:\.\d{3})+\b/g);
  if (matches) {
    const max = Math.max(...matches.map((m: string) => parseInt(m.replace(/\./g, ""), 10)));
    if (max > 10000 && max < 20000000) return max;
  }
  return b?.semaforo === "verde" ? 350000 : 95000;
}

const AGENDA_2030_GOALS = [
  {
    sdg: "Goal 3 & 10",
    imgs: ["/sdg/sdg-3.svg", "/sdg/sdg-10.svg"],
    titolo: "Welfare, Salute & Inclusione Sociale",
    colore: "border-rose-500/50 bg-rose-500/10 text-rose-400",
    barClass: "bg-rose-500",
    obiettivi: ["o6"],
    macroFiltro: "welfare",
    obiettivoDefault: "o6",
    desc: "PR FSE+ Inclusione, FNA Non Autosufficienza, PNRR M5C2 & M6 Case di Comunità, DesTEENazione e Co-progettazione Art. 55 CTS",
  },
  {
    sdg: "Goal 7 & 13",
    imgs: ["/sdg/sdg-7.svg", "/sdg/sdg-13.svg"],
    titolo: "Energia Pulita, CER & Lotta al Clima",
    colore: "border-amber-500/50 bg-amber-500/10 text-amber-400",
    barClass: "bg-amber-400",
    obiettivi: ["o2"],
    macroFiltro: "",
    obiettivoDefault: "o2",
    desc: "Comunità Energetiche Rinnovabili (CER), Conto Termico 3.0 GSE, Fotovoltaico ed Efficienza Energetica PR FESR",
  },
  {
    sdg: "Goal 11",
    imgs: ["/sdg/sdg-11.svg"],
    titolo: "Città Sostenibili, Rigenerazione & Mobilità",
    colore: "border-orange-500/50 bg-orange-500/10 text-orange-400",
    barClass: "bg-orange-400",
    obiettivi: ["o1", "o3"],
    macroFiltro: "",
    obiettivoDefault: "o1",
    desc: "Agenda Urbana Terni, Accordo Coesione FSC, Piani Integrati PNRR, Piste Ciclabili e Colonnine Elettriche",
  },
  {
    sdg: "Goal 8",
    imgs: ["/sdg/sdg-8.svg"],
    titolo: "Lavoro Dignitoso, Impresa & Commercio",
    colore: "border-red-500/50 bg-red-500/10 text-red-400",
    barClass: "bg-red-500",
    obiettivi: ["o4", "o5"],
    macroFiltro: "",
    obiettivoDefault: "o5",
    desc: "Contratto di Sviluppo Invitalia, Nuove Imprese a Tasso Zero, Riuso Locali Sfitti e Incentivi Assunzione ARPAL FSE+",
  },
  {
    sdg: "Goal 9",
    imgs: ["/sdg/sdg-9.svg"],
    titolo: "Imprese, Innovazione & Transizione 5.0",
    colore: "border-purple-500/50 bg-purple-500/10 text-purple-400",
    barClass: "bg-purple-500",
    obiettivi: ["o7"],
    macroFiltro: "",
    obiettivoDefault: "o7",
    desc: "PNRR Transizione 5.0, Voucher Digitali I4.0 Camera di Commercio, Ricerca e Sviluppo FESR e Startup Smart&Start",
  },
];

const ALL_SDG_ICONS = [
  { num: "3", title: "Salute e Benessere", img: "/sdg/sdg-3.svg", ob: "o6" },
  { num: "7", title: "Energia Pulita", img: "/sdg/sdg-7.svg", ob: "o2" },
  { num: "8", title: "Lavoro e Crescita", img: "/sdg/sdg-8.svg", ob: "o4" },
  { num: "9", title: "Innovazione 5.0", img: "/sdg/sdg-9.svg", ob: "o7" },
  { num: "10", title: "Inclusione e Welfare", img: "/sdg/sdg-10.svg", ob: "o6" },
  { num: "11", title: "Città Sostenibili", img: "/sdg/sdg-11.svg", ob: "o1" },
  { num: "13", title: "Azione per il Clima", img: "/sdg/sdg-13.svg", ob: "o3" },
];

function IndexPage() {
  const { state } = useCivic() || ({} as any);
  const rawBandi = Array.isArray(bandiReali) ? bandiReali : [];

  const arrBandi = rawBandi.filter(
    (b: any) => state?.auditBandi?.[normKey(b.nome || b.titolo)]?.stato !== "Scartato"
  );

  const bandiCitta = arrBandi.filter((b: any) => b.categoria_macro !== "welfare");
  const bandiWelfare = arrBandi.filter((b: any) => b.categoria_macro === "welfare");

  const valoreCitta = bandiCitta.reduce((acc: number, b: any) => acc + stimaValoreBando(b), 0);
  const valoreWelfare = bandiWelfare.reduce((acc: number, b: any) => acc + stimaValoreBando(b), 0);
  const valoreTotale = valoreCitta + valoreWelfare;

  const fmtEuro = (val: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);

  const totPoi = (POI_LIST?.length || 0) + (state?.poiExtra?.length || 0);
  const totBandi = arrBandi.length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="py-16 md:py-20 px-4 text-center container mx-auto">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-xs font-semibold text-accent">
          <ShieldCheck className="size-3.5" /> Piattaforma Civica & Intelligence Bandi (Città + Welfare) · Terni
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          Terni <span className="text-ember-gradient">2030</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          La Città dell'Amore e dell'Acciaio.<br />
          Rigenerazione urbana partecipata, Mappa GIS e Dossier Bandi IA per cittadini, imprese ed enti del Terzo Settore.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/dossier"
            className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <FileText className="mr-2 size-5" /> Esplora i {totBandi} Bandi Attivi
          </Link>
          <Link
            to="/mappa"
            className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-base font-semibold shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <MapPin className="mr-2 size-5" /> Entra nella Mappa GIS
          </Link>
        </div>
      </section>

      {/* PUNCHLINE BANNER CON CALCOLO AUTOMATICO CITTA + WELFARE */}
      <section className="w-full bg-accent/5 border-y border-accent/20 py-14 px-4 my-4">
        <div className="container mx-auto text-center max-w-5xl">
          <div className="inline-flex items-center justify-center p-3.5 bg-background rounded-full border border-border shadow-sm mb-5">
            <Activity className="size-7 text-accent" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            Potenziale Economico Rilevato in Tempo Reale per Terni:<br />
            <span className="text-accent border-b-4 border-accent pb-1">{fmtEuro(valoreTotale)}</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-2xl mx-auto">
            Valore calcolato automaticamente dal motore IA su <b>{totBandi} misure verificate</b> (aggiornamento quotidiano alle ore 09:00 con filtro anti-duplicati).
          </p>

          {/* DOPPIO CONTATORE AUTOMATICO: FINANZIAMENTI CITTA VS WELFARE */}
          <div className="grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto mb-8 text-left">
            <Link
              to="/dossier"
              search={{ obiettivo: "o1" }}
              className="surface-panel border border-sky-500/30 bg-background/80 p-5 rounded-xl hover:border-sky-400 transition flex items-center justify-between"
            >
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-sky-400">
                  <Building2 className="size-4" /> Finanziamenti Città, Imprese & Energia
                </span>
                <div className="text-2xl md:text-3xl font-black mt-1">{fmtEuro(valoreCitta)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {bandiCitta.length} bandi attivi (PR FESR, PNRR, GSE, Invitalia, CCIAA)
                </p>
              </div>
              <ArrowRight className="size-5 text-sky-400 shrink-0" />
            </Link>

            <Link
              to="/dossier"
              search={{ obiettivo: "o6" }}
              className="surface-panel border border-rose-500/30 bg-background/80 p-5 rounded-xl hover:border-rose-400 transition flex items-center justify-between"
            >
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-rose-400">
                  <HeartHandshake className="size-4" /> Fondi Welfare, Sociale & Terzo Settore
                </span>
                <div className="text-2xl md:text-3xl font-black mt-1">{fmtEuro(valoreWelfare)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {bandiWelfare.length} misure attive (PR FSE+, PNRR M5C2/M6, FNA, MLPS, Carit)
                </p>
              </div>
              <ArrowRight className="size-5 text-rose-400 shrink-0" />
            </Link>
          </div>

          <Link
            to="/dossier"
            className="inline-flex items-center text-accent font-bold text-lg hover:underline underline-offset-4 group"
          >
            Richiedi l'anteprima gratuita del tuo Dossier <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* CRUSCOTTO AGENDA 2030 ONU (CONTENUTI INFORMATIVI STATICI NON INTERAGIBILI) */}
      <section className="py-14 px-4 container mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
              <Globe className="size-4" /> Monitoraggio Strategico Nazioni Unite (SDGs)
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mt-1">Cruscotto Agenda 2030 · Obiettivi & Fondi Attivi</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Panoramica degli Obiettivi di Sviluppo Sostenibile dell'Agenda 2030 e relativa ripartizione dei fondi attivi a Terni.
            </p>
          </div>
          <Link to="/dossier" className="text-sm font-bold text-accent hover:underline shrink-0">
            Apri simulatore completo Dossier →
          </Link>
        </div>

        {/* STRISCIA VISIVA DELLE 7 MATTONELLE UFFICIALI AGENDA 2030 (STATICHE NON INTERAGIBILI) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-8">
          {ALL_SDG_ICONS.map((item) => (
            <div
              key={item.num}
              className="flex flex-col items-center rounded-xl border border-border bg-secondary/20 p-2.5 select-none cursor-default"
            >
              <img
                src={item.img}
                alt={"Goal " + item.num + " - " + item.title}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg shadow-md pointer-events-none"
              />
              <span className="mt-2 text-[11px] font-bold text-center leading-tight text-foreground">
                Goal {item.num} · {item.title}
              </span>
            </div>
          ))}
        </div>

        {/* CARDS DETTAGLIATE AGENDA 2030 (STATICHE NON INTERAGIBILI) */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {AGENDA_2030_GOALS.map((g) => {
            const bandiGoal = arrBandi.filter((b: any) => {
              const matchOb = g.obiettivi.includes(b.obiettivo_id || b.obiettivo);
              if (g.macroFiltro === "welfare") {
                return matchOb || b.categoria_macro === "welfare";
              }
              return matchOb;
            });
            const count = bandiGoal.length;
            const valoreGoal = bandiGoal.reduce((acc: number, b: any) => acc + stimaValoreBando(b), 0);
            const perc = Math.min(100, Math.max(25, Math.round((valoreGoal / Math.max(1, valoreTotale)) * 220)));

            return (
              <div
                key={g.sdg}
                className="surface-panel border border-border p-5 rounded-xl flex flex-col justify-between select-none cursor-default"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex gap-2">
                      {g.imgs.map((src) => (
                        <img
                          key={src}
                          src={src}
                          alt={g.sdg}
                          className="w-14 h-14 rounded-lg shadow-sm shrink-0 pointer-events-none"
                        />
                      ))}
                    </div>
                    <div className="text-right">
                      <span className={"inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold " + g.colore}>
                        {g.sdg}
                      </span>
                      <div className="text-xs font-bold text-accent mt-1">{count} bandi attivi</div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{g.titolo}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{g.desc}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-border">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Dotazione / Valore calcolato</span>
                    <span className="font-bold text-foreground">{fmtEuro(valoreGoal)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div className={"h-full " + g.barClass} style={{ width: perc + "%" }} />
                  </div>
                </div>
              </div>
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
            <h3 className="text-2xl font-bold mb-3">Terni Urban-Go</h3>
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
              Incrocia i {totBandi} bandi (Città e Welfare) con il tuo profilo e ricevi via email l'anteprima gratuita curata da Lorenzo.
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
