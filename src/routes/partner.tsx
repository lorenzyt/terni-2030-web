import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Award,
  BadgeCheck,
  Building2,
  Check,
  Compass,
  FileText,
  Flame,
  Handshake,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PARTNERS } from "@/lib/terni-data";
import { useContact } from "@/components/ContactDialog";

export const Route = createFileRoute("/partner")({
  head: () => ({
    meta: [
      { title: "Chi Siamo, Partner & Offerte Annuali — Terni 2030" },
      {
        name: "description",
        content:
          "La visione di Terni 2030, la nostra missione di rigenerazione urbana e le licenze annuali per aziende partner del territorio.",
      },
    ],
  }),
  component: PartnerPage,
});

const OFFERTE_PARTNER = [
  {
    livello: "Sostenitore",
    prezzo: "14,90 €",
    durata: "/ anno (Licenza Annuale)",
    sottotitolo: "Licenza Annuale · Vetrina Locale sul Portale",
    idealePer: "Negozi di vicinato, artigiani, liberi professionisti e associazioni",
    vantaggi: [
      "Licenza annuale (validità 12 mesi) con Card dedicata nella pagina Partner & Sponsor",
      "Indicazione settore, descrizione attività e recapito diretto per un anno intero",
      "Supporto diretto al mantenimento dell'infrastruttura civica indipendente",
    ],
  },
  {
    livello: "Gold · Partner Certificato",
    prezzo: "49,00 €",
    durata: "/ anno (Licenza Annuale)",
    evidenza: true,
    sottotitolo: "Licenza Annuale · Partnership Dedicata & Bandi",
    idealePer: "Studi tecnici (ingegneri, architetti, geometri), commercialisti e attività commerciali",
    vantaggi: [
      "Tutti i vantaggi del livello Sostenitore per 12 mesi + Badge «Partner Certificato»",
      "Possibilità di collaborazione e partnership promozionale della tua attività concordata privatamente in modo dedicato",
      "Citazione annuale nella sezione «Professionisti e partner accreditati su Terni» dei Dossier Bandi IA",
    ],
  },
  {
    livello: "Platinum · Main Sponsor",
    prezzo: "99,00 €",
    durata: "/ anno (Licenza Annuale)",
    sottotitolo: "Licenza Annuale · Visibilità Strategica & Dossier",
    idealePer: "Imprese edili, installatori energetici/fotovoltaici, aziende industriali e consorzi",
    vantaggi: [
      "Tutti i vantaggi del livello Gold in posizione prioritaria per 12 mesi",
      "Abbinamento diretto ai Dossier Bandi IA per i propri ambiti (es. Energia, Riqualificazione, Impianti)",
      "Report periodico aggregato sulle priorità votate dai cittadini nei 36 quartieri di Terni",
    ],
  },
];

function PartnerPage() {
  const contatta = useContact();
  const [offerteOpen, setOfferteOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 space-y-14">
      {/* PARTE 1 (INIZIO): VETRINA PARTNER & SPONSOR */}
      <section>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent">
              Rete Territoriale & Imprese del Futuro
            </span>
            <h1 className="text-3xl font-bold md:text-4xl mt-1">
              Partner & <span className="text-ember-gradient">Sponsor</span> della Riqualificazione
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Aziende locali, studi tecnici, cooperative e sponsor con licenza annuale al servizio della rigenerazione di Terni.
            </p>
          </div>
          <Button variant="outline" onClick={() => setOfferteOpen(true)}>
            <FileText className="mr-1.5 size-4" /> Offerte Partner (Licenze Annuali)
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PARTNERS.map((p) => (
            <div key={p.id} className="surface-panel flex flex-col justify-between p-5 border rounded-xl">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-accent">
                    <Building2 className="size-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {p.certificato && (
                      <Badge className="border-0 bg-accent/20 text-accent">
                        <BadgeCheck className="mr-1 size-3" /> Certificato
                      </Badge>
                    )}
                    <Badge variant="secondary">{p.livello} · Annuale</Badge>
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-bold">{p.nome}</h3>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{p.settore}</p>
                <p className="mt-2 text-sm text-muted-foreground">{p.descrizione}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3 text-accent" /> {p.citta}
                </span>
                <button
                  onClick={() => setOfferteOpen(true)}
                  className="font-semibold text-accent hover:underline"
                >
                  Vedi Offerte Annuali →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PARTE 2 (CENTRO): CHI SIAMO & STORYTELLING */}
      <section className="surface-panel border border-accent/30 rounded-2xl p-6 md:p-10 space-y-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
            <Flame className="size-3.5" /> Chi Siamo · Il Manifesto di Terni 2030
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
            Dalla Città dell'Acciaio al Laboratorio Civico dell'Innovazione
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Ideato e curato da <b className="text-foreground">Lorenzo Covicchio</b>, <b>Terni 2030</b> nasce da una domanda semplice quanto urgente: <i>quante risorse, bandi europei e idee dei cittadini andavano perse ogni anno a Terni solo perché mancava un ponte tra chi vive i quartieri e gli strumenti di finanziamento?</i>
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-background/60 p-6 space-y-3">
            <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Compass className="size-5" />
            </div>
            <h3 className="text-lg font-bold">1. Il Punto di Partenza</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Terni custodisce un patrimonio unico: il razionalismo poetico di Mario Ridolfi, l'architettura partecipata di Giancarlo De Carlo al Villaggio Matteotti, la grande tradizione industriale e la forza simbolica di San Valentino. Eppure, tra locali sfitti, sfide energetiche e bisogni sociali, serviva uno strumento nuovo capace di leggere il territorio in tempo reale.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background/60 p-6 space-y-3">
            <div className="inline-flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Target className="size-5" />
            </div>
            <h3 className="text-lg font-bold">2. La Nostra Missione</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Unire la curatela progettuale umana e l'Intelligenza Artificiale operativa per democratizzare l'accesso ai bandi pubblici (Città, Imprese, Energia e Welfare) e restituire voce ai 36 quartieri di Terni. Non un semplice sito vetrina, ma un'infrastruttura civica dove ogni segnalazione sulla mappa può trasformarsi in un progetto finanziabile.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background/60 p-6 space-y-3">
            <div className="inline-flex size-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <Sparkles className="size-5" />
            </div>
            <h3 className="text-lg font-bold">3. Gli Obiettivi verso il 2030</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Accompagnare cittadini, imprese, professionisti ed enti del Terzo Settore nell'intercettare i fondi PR FESR, FSE+, PNRR e nazionali allineati all'Agenda 2030 ONU, valorizzando al contempo l'identità culturale e monumentale della conca ternana attraverso l'esplorazione sul campo di <i>Terni Urban-Go</i>.
            </p>
          </div>
        </div>
      </section>

      {/* PARTE 3 (FINE): CALL TO ACTION OFFERTE PARTNER & SIGILLO PEC UNICO */}
      <section className="surface-panel border rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">
              Licenze Annuali B2B, Studi Tecnici & Imprese
            </span>
            <h2 className="text-2xl font-bold mt-1">Diventa Partner di Terni 2030</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Attiva una licenza annuale per posizionare la tua attività sulla piattaforma: visibilità sulla mappa civica, badge Partner Certificato, inserimento nei Dossier Bandi IA di quartiere e partnership promozionali dedicate.
              Scrivi a{" "}
              <a href="mailto:Terni.2030@outlook.it" className="text-accent underline">
                Terni.2030@outlook.it
              </a>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() =>
                contatta({
                  oggetto: "Attivazione Licenza Annuale Sponsor — Terni 2030",
                  contesto:
                    "Richiesta diretta di attivazione Licenza Annuale Partner/Sponsor (indica il piano desiderato: Sostenitore 14,90€/anno, Gold 49,00€/anno o Platinum 99,00€/anno).",
                })
              }
            >
              <Handshake className="mr-1.5 size-4" /> Diventa Sponsor
            </Button>
            <Button variant="outline" onClick={() => setOfferteOpen(true)}>
              <FileText className="mr-1.5 size-4" /> Consulta le Offerte Partner (Licenze Annuali)
            </Button>
          </div>
        </div>

        {/* Riferimento PEC Unico a fine sezione */}
        <div className="border-t border-border pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-accent shrink-0" />
            <span>
              <b>Direzione e Curatela Progettuale:</b> Lorenzo Covicchio · Domicilio Digitale e Comunicazioni Ufficiali PEC:{" "}
              <a
                href="mailto:lorenzo.covicchio@pec.it"
                className="font-mono font-semibold text-foreground underline underline-offset-4 hover:text-accent"
              >
                lorenzo.covicchio@pec.it
              </a>
            </span>
          </div>
          <span className="text-[11px] opacity-75">Terni 2030 · Infrastruttura Civica Indipendente</span>
        </div>
      </section>

      <Dialog open={offerteOpen} onOpenChange={setOfferteOpen}>
        <DialogContent className="z-[2000] max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="size-5 text-accent" /> Offerte Partner & Licenze Annuali — Terni 2030
            </DialogTitle>
            <DialogDescription>
              Scegli la licenza annuale (validità 12 mesi) più adatta alla tua attività o al tuo studio tecnico per intercettare i progetti di riqualificazione e i bandi attivi su Terni.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {OFFERTE_PARTNER.map((pkg) => (
              <div
                key={pkg.livello}
                className={
                  "flex flex-col justify-between rounded-xl border p-4 " +
                  (pkg.evidenza ? "border-accent bg-secondary/40" : "border-border bg-surface-2")
                }
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={pkg.evidenza ? "default" : "secondary"}>{pkg.livello}</Badge>
                    {pkg.evidenza && <span className="text-[10px] font-semibold uppercase text-accent">Più scelto</span>}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="font-display text-2xl font-bold">{pkg.prezzo}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{pkg.durata}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-accent">{pkg.sottotitolo}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    <b>Ideale per:</b> {pkg.idealePer}
                  </p>
                  <ul className="mt-4 space-y-2 text-xs">
                    {pkg.vantaggi.map((v) => (
                      <li key={v} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-accent" />
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  size="sm"
                  variant={pkg.evidenza ? "default" : "secondary"}
                  className="mt-5 w-full"
                  onClick={() => {
                    setOfferteOpen(false);
                    contatta({
                      oggetto: "Richiesta Offerta Partner (Licenza Annuale) — " + pkg.livello + " (" + pkg.prezzo + "/anno)",
                      contesto: "Licenza annuale selezionata dalle Offerte Partner: " + pkg.livello + " (" + pkg.prezzo + " / anno) — " + pkg.sottotitolo,
                    });
                  }}
                >
                  <Mail className="mr-1.5 size-3.5" /> Attiva Licenza {pkg.livello}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Award className="size-5 text-accent" />
              <span>Vuoi ricevere il prospetto completo delle Offerte Partner Annuali via email o concordare una convenzione dedicata?</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setOfferteOpen(false);
                contatta({
                  oggetto: "Richiesta Prospetto Offerte Partner Annuali / Convenzione su misura",
                  contesto: "Richiesta dettagli sulle Licenze Annuali Partner Terni 2030 via email",
                });
              }}
            >
              Richiedi Informazioni via Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
