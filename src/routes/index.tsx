import bandiRealiJson from "@/lib/bandi_reali.json";
import { AGENDA_2030_GOALS, POI_LIST } from "@/lib/terni-data";
import { useCivic } from "@/lib/civic-store";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Map, FileText, LayoutDashboard, ArrowRight, Globe, Compass, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { state } = useCivic();
  const tuttiBandi = bandiRealiJson as any[];
  const totBandi = Math.max(tuttiBandi.length, 1);
  const totPoi = POI_LIST.length + state.poiExtra.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          Piattaforma Civica & Monitoraggio Fondi UE · Terni 2030
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Terni 2030 — <span className="text-accent">La Città dell'Amore e dell'Acciaio</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Un progetto di rigenerazione urbana partecipata. La tua voce, i dati reali, l'allineamento all'Agenda 2030 e il futuro di Terni.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/mappa" className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition">
            Entra nella Mappa GIS <ArrowRight className="ml-2 size-4" />
          </Link>
          <Link to="/dossier" className="inline-flex items-center justify-center px-8 py-4 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 transition">
            Scopri i Bandi Attivi
          </Link>
          <Link to="/urban-go" className="inline-flex items-center justify-center px-8 py-4 border border-border rounded-lg font-semibold hover:border-accent transition">
            <Compass className="mr-2 size-4 text-accent" /> Esplora con TerniDex GPS
          </Link>
        </div>
      </section>

      {/* Cruscotto Live */}
      <section className="container mx-auto px-6 py-8">
        <div className="bg-surface-2 border border-border p-8 rounded-2xl shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
            <LayoutDashboard className="size-5 text-accent" /> Cruscotto Live di Jarvis
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <p className="text-4xl font-bold text-accent">{state.segnalazioni.length}</p>
              <p className="text-sm text-muted-foreground">Proposte civiche approvate</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-accent">{tuttiBandi.length}</p>
              <p className="text-sm text-muted-foreground">Bandi ufficiali monitorati</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-accent">{state.checkin.length}/{totPoi}</p>
              <p className="text-sm text-muted-foreground">Luoghi TerniDex scoperti</p>
            </div>
            <div>
              <p className="text-sm font-mono text-muted-foreground">
                9 Canali Attivi:<br />
                <span className="text-xs text-foreground">PR FESR · FSE+ · FSC · PNRR · Regione · Comune · GSE · Invitalia · CCIAA</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PILASTRO 1: Osservatorio Agenda 2030 ONU & Percentuali di Adesione Finanziaria */}
      <section className="container mx-auto px-6 py-12">
        <div className="surface-panel p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge className="mb-2 border-0 bg-accent/20 text-accent">
                <Globe className="mr-1 size-3.5" /> Monitoraggio Sostenibilità ONU
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold">
                Temi <span className="text-ember-gradient">Agenda 2030</span> & Copertura Bandi su Terni
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Incidenza percentuale in tempo reale dei {tuttiBandi.length} bandi attivi e delle progettualità cittadine rispetto agli Obiettivi di Sviluppo Sostenibile (SDGs) dell'Agenda 2030.
              </p>
            </div>
            <Link to="/dossier" className="text-xs font-semibold text-accent hover:underline">
              Genera Dossier per Obiettivo 2030 →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {AGENDA_2030_GOALS.map((goal) => {
              const bandiAderenti = tuttiBandi.filter((b) =>
                goal.obiettiviCollegati.includes(b.obiettivo_id || b.obiettivo || "o1")
              ).length;
              const percFinanziaria = Math.min(100, Math.round((bandiAderenti / totBandi) * 100));

              const progettiAderenti =
                state.segnalazioni.filter((s) => goal.categorieMappa.includes(s.categoria)).length +
                state.dossierGenerati.filter((d) =>
                  goal.obiettiviCollegati.some((obId) => d.obiettivo.toLowerCase().includes(obId))
                ).length;

              const percAdesioneProgetto = Math.min(100, Math.max(percFinanziaria, Math.round(((bandiAderenti + progettiAderenti * 2) / totBandi) * 100)));

              return (
                <div key={goal.codice} className="rounded-xl border border-border bg-surface-2 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: goal.colore }}
                      >
                        Goal {goal.numero} · {goal.codice}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {bandiAderenti} bandi attivi
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-bold">{goal.titolo}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{goal.descrizione}</p>
                  </div>

                  <div className="mt-5 space-y-3 border-t border-border pt-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Copertura Finanziamenti Rilevati</span>
                        <b style={{ color: goal.colore }}>{percFinanziaria}%</b>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percFinanziaria}%`, backgroundColor: goal.colore }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Indice Aderenza Progettuale Terni</span>
                        <b className="text-foreground">{percAdesioneProgetto}%</b>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: `${percAdesioneProgetto}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3 Mondi */}
      <section className="container mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">
        {[
          { title: "Mappa Civica & Sondaggi", desc: "Segnala criticità nei 36 quartieri e proponi sondaggi (soggetti a revisione Regia).", icon: Map, link: "/mappa" },
          { title: "Terni Urban GO & TerniDex", desc: "Avvicinati col GPS ai monumenti, sblocca le ricompense e completa la tua collezione.", icon: Compass, link: "/urban-go" },
          { title: "Dossier Bandi IA", desc: "Incrocia ambito, quartiere e obiettivo Agenda 2030 con i 9 portali ufficiali.", icon: FileText, link: "/dossier" },
        ].map((card) => (
          <Link key={card.title} to={card.link} className="p-8 border border-border rounded-2xl hover:border-accent transition group">
            <card.icon className="size-8 text-accent mb-4" />
            <h3 className="text-xl font-bold mb-2">{card.title}</h3>
            <p className="text-muted-foreground">{card.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
