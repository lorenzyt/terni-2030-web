import bandiRealiJson from "@/lib/bandi_reali.json";
import { AGENDA_2030_GOALS, POI_LIST } from "@/lib/terni-data";
import { useCivic } from "@/lib/civic-store";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Map, FileText, LayoutDashboard, ArrowRight, Globe, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

// Mattonella Ufficiale Schema ONU Agenda 2030 (Colore + Numero + Pittogramma Ufficiale)
function IconaUfficialeSDG({ numero, colore }: { numero: number; colore: string }) {
  return (
    <div
      className="flex size-14 shrink-0 flex-col justify-between rounded-lg p-1.5 text-white shadow-md select-none"
      style={{ backgroundColor: colore }}
      title={`Obiettivo Agenda 2030 ONU n. ${numero}`}
    >
      <div className="flex items-center justify-between leading-none">
        <span className="font-display text-xs font-black tracking-tighter">{numero}</span>
        <span className="text-[7px] font-bold uppercase opacity-90">ONU</span>
      </div>

      <div className="flex items-center justify-center">
        {numero === 7 && (
          <svg viewBox="0 0 64 64" className="size-8 fill-none stroke-white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="32" cy="32" r="12" />
            <path d="M32 23v9" />
            <path d="M27 26.5a7.5 7.5 0 1 0 10 0" />
            <path d="M32 8v5M32 51v5M8 32h5M51 32h5M15 15l3.5 3.5M45.5 45.5L49 49M49 15l-3.5 3.5M18.5 45.5L15 49" />
          </svg>
        )}

        {numero === 8 && (
          <svg viewBox="0 0 64 64" className="size-8 fill-none stroke-white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 46l13-12 10 7 16-17" />
            <path d="M41 24h10v10" />
            <rect x="13" y="48" width="7" height="8" fill="white" stroke="none" />
            <rect x="24" y="42" width="7" height="14" fill="white" stroke="none" />
            <rect x="35" y="45" width="7" height="11" fill="white" stroke="none" />
            <rect x="46" y="34" width="7" height="22" fill="white" stroke="none" />
          </svg>
        )}

        {numero === 9 && (
          <svg viewBox="0 0 64 64" className="size-8 fill-none stroke-white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="32,10 44,17 32,24 20,17" />
            <polyline points="20,17 20,29 32,36 44,29 44,17" />
            <line x1="32" y1="24" x2="32" y2="36" />
            <polygon points="20,29 32,36 20,43 8,36" />
            <polyline points="8,36 8,48 20,55 32,48 32,36" />
            <line x1="20" y1="43" x2="20" y2="55" />
            <polygon points="44,29 56,36 44,43 32,36" />
            <polyline points="32,36 32,48 44,55 56,48 56,36" />
            <line x1="44" y1="43" x2="44" y2="55" />
          </svg>
        )}

        {numero === 11 && (
          <svg viewBox="0 0 64 64" className="size-8 fill-none stroke-white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="10" y="16" width="16" height="38" fill="white" fillOpacity="0.2" />
            <line x1="15" y1="22" x2="15" y2="22.1" strokeWidth="4" />
            <line x1="21" y1="22" x2="21" y2="22.1" strokeWidth="4" />
            <line x1="15" y1="30" x2="15" y2="30.1" strokeWidth="4" />
            <line x1="21" y1="30" x2="21" y2="30.1" strokeWidth="4" />
            <line x1="15" y1="38" x2="15" y2="38.1" strokeWidth="4" />
            <line x1="21" y1="38" x2="21" y2="38.1" strokeWidth="4" />
            <polygon points="30,34 40,24 50,34" />
            <rect x="33" y="34" width="14" height="20" />
            <rect x="38" y="43" width="4" height="11" fill="white" />
            <line x1="6" y1="54" x2="58" y2="54" strokeWidth="3.5" />
          </svg>
        )}

        {numero === 13 && (
          <svg viewBox="0 0 64 64" className="size-8 fill-none stroke-white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 32C14 18 23 14 32 14s18 4 26 18c-8 14-17 18-26 18S14 46 6 32z" />
            <circle cx="32" cy="32" r="11" />
            <path d="M21 32h22M32 21c3.5 3.5 3.5 18.5 0 22M32 21c-3.5 3.5-3.5 18.5 0 22" />
          </svg>
        )}

        {numero === 15 && (
          <svg viewBox="0 0 64 64" className="size-8 fill-none stroke-white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="24" cy="24" r="10" fill="white" fillOpacity="0.25" />
            <line x1="24" y1="34" x2="24" y2="50" strokeWidth="4" />
            <path d="M40 18c2.5-2.5 5.5-2.5 7 0 1.5-2.5 4.5-2.5 7 0" />
            <path d="M44 28c2-2 4.5-2 5.5 0 1-2 3.5-2 5.5 0" />
            <line x1="10" y1="50" x2="54" y2="50" />
            <line x1="14" y1="56" x2="50" y2="56" />
          </svg>
        )}
      </div>
    </div>
  );
}

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
              <p className="text-4xl font-bold text-accent">{totPoi}</p>
              <p className="text-sm text-muted-foreground">Luoghi TerniDex da scoprire</p>
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

      {/* PILASTRO 1 OTTIMIZZATO: Zero ripetizioni + Icona Ufficiale ONU */}
      <section className="container mx-auto px-6 py-12">
        <div className="surface-panel p-6 md:p-8">
          <div className="mb-6">
            <Badge className="mb-2 border-0 bg-accent/20 text-accent">
              <Globe className="mr-1 size-3.5" /> Bussola Fondi & Bisogni Reali · Agenda 2030 ONU
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold">
              Dove sono i <span className="text-ember-gradient">Finanziamenti</span> vs Cosa chiedono i <span className="text-ember-gradient">Cittadini</span>
            </h2>
            <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
              Confronto in tempo reale tra i bandi attivi per ciascun Obiettivo ONU (divisi per beneficiario) e le progettualità richieste dai quartieri di Terni. Poiché molte misure agevolative sono trasversali — rispondendo contemporaneamente a più Obiettivi dell'Agenda 2030 e rivolgendosi a più destinatari (Enti, Imprese e Cittadini) — uno stesso bando può concorrere a più Goal e le percentuali indicano la copertura specifica di ciascun tema sul totale dei bandi monitorati.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {AGENDA_2030_GOALS.map((goal) => {
              const listaBandiGoal = tuttiBandi.filter((b) =>
                goal.obiettiviCollegati.includes(b.obiettivo_id || b.obiettivo || "o1")
              );
              const nBandi = listaBandiGoal.length;
              const percOffertaBandi = Math.min(100, Math.round((nBandi / totBandi) * 100));

              const nPubblico = listaBandiGoal.filter((b) => (b.ambiti || []).includes("pubblico")).length;
              const nImpresa = listaBandiGoal.filter((b) => (b.ambiti || []).includes("impresa")).length;
              const nCittadino = listaBandiGoal.filter((b) => (b.ambiti || []).includes("cittadino")).length;

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
                    {/* Intestazione pulita: Icona Ufficiale ONU + Titolo (senza badge percentuale duplicato) */}
                    <div className="flex items-center gap-3.5">
                      <IconaUfficialeSDG numero={goal.numero} colore={goal.colore} />
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: goal.colore }}>
                          Obiettivo ONU {goal.numero}
                        </span>
                        <h3 className="text-base font-bold leading-snug">{goal.titolo}</h3>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground">{goal.descrizione}</p>

                    {/* Destinatari */}
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

                  {/* Barre comparative (unica sede dove compaiono numeri e percentuali) */}
                  <div className="mt-5 space-y-3 border-t border-border pt-3.5">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">💰 Offerta Bandi Attivi</span>
                        <b style={{ color: goal.colore }}>{nBandi} su {tuttiBandi.length} ({percOffertaBandi}%)</b>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percOffertaBandi}%`, backgroundColor: goal.colore }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">🙋‍♂️ Domanda da Terni (Mappa & Dossier)</span>
                        <b className="text-foreground">
                          {totDomandaTema === 0 ? "0 proposte" : `${totDomandaTema} proposte (${percDomandaCittadina}%)`}
                        </b>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: `${Math.max(percDomandaCittadina, totDomandaTema > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                    </div>

                    <Link
                      to="/dossier"
                      search={{ obiettivo: obiettivoPrimario }}
                      className="mt-2 inline-flex w-full items-center justify-center rounded-md border border-border bg-background py-2 text-xs font-semibold text-accent hover:border-accent transition"
                    >
                      Filtra i bandi nel Dossier IA <ArrowRight className="ml-1 size-3.5" />
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
