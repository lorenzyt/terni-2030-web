import bandiRealiJson from "@/lib/bandi_reali.json";
import { AGENDA_2030_GOALS, POI_LIST } from "@/lib/terni-data";
import { useCivic } from "@/lib/civic-store";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Map, FileText, LayoutDashboard, ArrowRight, Globe, Compass, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { state } = useCivic();
  const tuttiBandi = (bandiRealiJson as any[]).filter((b) => {
    const k = String(b.titolo || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
    return state.auditBandi?.[k]?.stato !== "Scartato";
  });
  const totBandi = Math.max(tuttiBandi.length, 1);
  const totPoi = POI_LIST.length + state.poiExtra.length;
  const totAttivitaUtenti = state.segnalazioni.length + state.dossierGenerati.length;

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
              <p className="text-sm text-muted-foreground">Proposte civiche in mappa</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-accent">{tuttiBandi.length}</p>
              <p className="text-sm text-muted-foreground">Bandi ufficiali attivi</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-accent">{state.checkin.length}/{totPoi}</p>
              <p className="text-sm text-muted-foreground">Luoghi TerniDex scoperti</p>
            </div>
            <div>
              <p className="text-sm font-mono text-muted-foreground">
                9 Canali Monitorati:<br />
                <span className="text-xs text-foreground">PR FESR · FSE+ · FSC · PNRR · Regione · Comune · GSE · Invitalia · CCIAA</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PILASTRO 1 RIPROGETTATO: Confronto Chiaro "Offerta Bandi" vs "Domanda Cittadina" */}
      <section className="container mx-auto px-6 py-12">
        <div className="surface-panel p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge className="mb-2 border-0 bg-accent/20 text-accent">
                <Globe className="mr-1 size-3.5" /> Bussola Fondi & Bisogni Reali · Agenda 2030 ONU
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold">
                Dove sono i <span className="text-ember-gradient">Finanziamenti</span> vs Cosa chiedono i <span className="text-ember-gradient">Cittadini</span>
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Ogni scheda confronta l'<b>Offerta di Bandi</b> (quanti dei {tuttiBandi.length} bandi attivi finanziano quel tema e per chi) con la <b>Domanda Cittadina</b> (quante proposte sulla mappa e quanti Dossier vengono cercati su Terni). Clicca su un Goal per vedere i bandi corrispondenti.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {AGENDA_2030_GOALS.map((goal) => {
              const listaBandiGoal = tuttiBandi.filter((b) =>
                goal.obiettiviCollegati.includes(b.obiettivo_id || b.obiettivo || "o1")
              );
              const nBandi = listaBandiGoal.length;
              const percOffertaBandi = Math.min(100, Math.round((nBandi / totBandi) * 100));

              // Spaccato beneficiari per rendere subito chiaro a chi servono questi bandi
              const nPubblico = listaBandiGoal.filter((b) => (b.ambiti || []).includes("pubblico")).length;
              const nImpresa = listaBandiGoal.filter((b) => (b.ambiti || []).includes("impresa")).length;
              const nCittadino = listaBandiGoal.filter((b) => (b.ambiti || []).includes("cittadino")).length;

              // Domanda reale da Terni (Segnalazioni in mappa + Dossier cercati dagli utenti)
              const nSegnalazioniTema = state.segnalazioni.filter((s) =>
                goal.categorieMappa.includes(s.categoria)
              ).length;
              const nDossierTema = state.dossierGenerati.filter((d) =>
                goal.obiettiviCollegati.some((obId) => d.obiettivo.toLowerCase().includes(obId))
              ).length;
              const totDomandaTema = nSegnalazioniTema + nDossierTema;
              const percDomandaCittadina =
                totAttivitaUtenti > 0
                  ? Math.min(100, Math.round((totDomandaTema / totAttivitaUtenti) * 100))
                  : 0;

              const obiettivoPrimario = goal.obiettiviCollegati[0] || "o1";

              return (
                <div
                  key={goal.codice}
                  className="rounded-xl border border-border bg-surface-2 p-5 flex flex-col justify-between transition hover:border-accent/60"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: goal.colore }}
                      >
                        Obiettivo ONU {goal.numero}
                      </span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {nBandi} su {tuttiBandi.length} bandi ({percOffertaBandi}%)
                      </Badge>
                    </div>

                    <h3 className="mt-3 text-base font-bold">{goal.titolo}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{goal.descrizione}</p>

                    {/* Chi può usare questi bandi */}
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                      <span className="rounded bg-secondary px-2 py-0.5 text-muted-foreground">
                        🏛️ Enti: <b className="text-foreground">{nPubblico}</b>
                      </span>
                      <span className="rounded bg-secondary px-2 py-0.5 text-muted-foreground">
                        🏢 Imprese: <b className="text-foreground">{nImpresa}</b>
                      </span>
                      <span className="rounded bg-secondary px-2 py-0.5 text-muted-foreground">
                        👤 Cittadini: <b className="text-foreground">{nCittadino}</b>
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 border-t border-border pt-3">
                    {/* Barra 1: Offerta Finanziaria */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">💰 Offerta Bandi Attivi</span>
                        <b style={{ color: goal.colore }}>{nBandi} bandi ({percOffertaBandi}%)</b>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percOffertaBandi}%`, backgroundColor: goal.colore }}
                        />
                      </div>
                    </div>

                    {/* Barra 2: Domanda Reale Cittadina */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">🙋‍♂️ Domanda da Terni (Mappa & Dossier)</span>
                        <b className="text-foreground">
                          {totDomandaTema === 0
                            ? "0 richieste (In attesa)"
                            : `${totDomandaTema} progetti (${percDomandaCittadina}%)`}
                        </b>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: `${Math.max(percDomandaCittadina, totDomandaTema > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                    </div>

                    {/* Verdetto / Sintesi di Opportunità */}
                    <div className="rounded-md bg-secondary/50 p-2.5 text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <Sparkles className="size-3.5 text-accent shrink-0 mt-0.5" />
                      <span>
                        {totDomandaTema === 0 ? (
                          <>
                            <b>Fondi pronti da intercettare:</b> ci sono <b>{nBandi} bandi attivi</b> su questo tema, ma nessuna proposta ancora inviata dai quartieri.
                          </>
                        ) : (
                          <>
                            <b>Tema attivo:</b> {totDomandaTema} iniziative cittadine incrociate con <b>{nBandi} bandi disponibili</b>.
                          </>
                        )}
                      </span>
                    </div>

                    <Link
                      to="/dossier"
                      search={{ obiettivo: obiettivoPrimario }}
                      className="mt-1 inline-flex w-full items-center justify-center rounded-md border border-border bg-background py-2 text-xs font-semibold text-accent hover:border-accent transition"
                    >
                      Scopri i {nBandi} bandi di questo Goal <ArrowRight className="ml-1 size-3.5" />
                    </Link>
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
