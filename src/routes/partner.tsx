import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Award, BadgeCheck, Building2, Check, FileText, Handshake, Mail, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PARTNERS } from "@/lib/terni-data";
import { useContact } from "@/components/ContactDialog";

export const Route = createFileRoute("/partner")({
  head: () => ({
    meta: [
      { title: "Partner & Sponsor — Terni 2030" },
      { name: "description", content: "Aziende locali, studi tecnici, cooperative e sponsor al servizio della rigenerazione di Terni." },
    ],
  }),
  component: PartnerPage,
});

const PACCHETTI_KIT = [
  {
    livello: "Sostenitore",
    prezzo: "14,90 €",
    sottotitolo: "Vetrina Locale sul Portale",
    idealePer: "Negozi di vicinato, artigiani, liberi professionisti e associazioni",
    vantaggi: [
      "Card dedicata nella pagina Partner & Sponsor di Terni 2030",
      "Indicazione settore, descrizione attività e recapito diretto",
      "Supporto diretto al mantenimento dell'infrastruttura civica indipendente",
    ],
  },
  {
    livello: "Gold · Partner Certificato",
    prezzo: "49,00 €",
    evidenza: true,
    sottotitolo: "Partnership Dedicata & Bandi di Quartiere",
    idealePer: "Studi tecnici (ingegneri, architetti, geometri), commercialisti e attività commerciali",
    vantaggi: [
      "Tutti i vantaggi del livello Sostenitore + Badge «Partner Certificato»",
      "Possibilità di collaborazione e partnership promozionale della tua attività concordata privatamente in modo dedicato",
      "Citazione nella sezione «Professionisti e partner accreditati su Terni» dei Dossier PDF Bandi IA",
    ],
  },
  {
    livello: "Platinum · Main Sponsor",
    prezzo: "99,00 €",
    sottotitolo: "Visibilità Strategica & Dossier Territoriali",
    idealePer: "Imprese edili, installatori energetici/fotovoltaici, aziende industriali e consorzi",
    vantaggi: [
      "Tutti i vantaggi del livello Gold in posizione prioritaria",
      "Abbinamento diretto ai Dossier Bandi IA per i propri ambiti (es. Energia, Riqualificazione, Impianti)",
      "Report periodico aggregato sulle priorità votate dai cittadini nei 36 quartieri di Terni",
    ],
  },
];

function PartnerPage() {
  const contatta = useContact();
  const [kitOpen, setKitOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">
          Partner & <span className="text-ember-gradient">Sponsor</span> della Riqualificazione
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Aziende locali, studi tecnici, cooperative e sponsor al servizio della rigenerazione di Terni.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PARTNERS.map((p) => (
          <div key={p.id} className="surface-panel flex flex-col justify-between p-5">
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
                  <Badge variant="secondary">{p.livello}</Badge>
                </div>
              </div>
              <h3 className="mt-4 text-lg font-bold">{p.nome}</h3>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{p.settore}</p>
              <p className="mt-2 text-sm text-muted-foreground">{p.descrizione}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="size-3 text-accent" /> {p.citta}</span>
              <button
                onClick={() => contatta({ oggetto: `Prenotazione Spazio Sponsor (${p.nome})`, contesto: "Richiesta attivazione vetrina dalla card Partner & Sponsor" })}
                className="font-semibold text-accent hover:underline"
              >
                Prenota ora →
              </button>
            </div>
          </div>
        ))}
      </div>

      <section className="surface-panel mt-10 flex flex-wrap items-center justify-between gap-6 p-6 md:p-8">
        <div className="max-w-xl">
          <h2 className="text-xl font-bold">Diventa Sponsor di Terni 2030</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Visibilità sulla mappa civica, badge Partner Certificato, inserimento nei Dossier Bandi IA di quartiere e partnership promozionali dedicate.
            Scrivi a <a href="mailto:Terni.2030@outlook.it" className="text-accent underline">Terni.2030@outlook.it</a>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() =>
              contatta({
                oggetto: "Attivazione Sponsorizzazione — Terni 2030",
                contesto: "Richiesta diretta di attivazione spazio Partner/Sponsor (indica il livello desiderato: Sostenitore 14,90€, Gold o Platinum).",
              })
            }
          >
            <Handshake className="mr-1.5 size-4" /> Diventa Sponsor
          </Button>
          <Button variant="outline" onClick={() => setKitOpen(true)}>
            <FileText className="mr-1.5 size-4" /> Consulta & Richiedi il Kit Partner
          </Button>
        </div>
      </section>

      {/* Modal interattivo Kit Partner */}
      <Dialog open={kitOpen} onOpenChange={setKitOpen}>
        <DialogContent className="z-[2000] max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="size-5 text-accent" /> Kit Partner & Livelli di Visibilità — Terni 2030
            </DialogTitle>
            <DialogDescription>
              Scegli la formula più adatta alla tua attività o al tuo studio tecnico per intercettare i progetti di riqualificazione e i bandi attivi su Terni.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {PACCHETTI_KIT.map((pkg) => (
              <div
                key={pkg.livello}
                className={`flex flex-col justify-between rounded-xl border p-4 ${
                  pkg.evidenza ? "border-accent bg-secondary/40" : "border-border bg-surface-2"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={pkg.evidenza ? "default" : "secondary"}>{pkg.livello}</Badge>
                    {pkg.evidenza && <span className="text-[10px] font-semibold uppercase text-accent">Più scelto</span>}
                  </div>
                  <p className="mt-3 font-display text-2xl font-bold">{pkg.prezzo}</p>
                  <p className="text-xs font-semibold text-accent">{pkg.sottotitolo}</p>
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
                    setKitOpen(false);
                    contatta({
                      oggetto: `Richiesta Attivazione Kit Partner — Livello ${pkg.livello} (${pkg.prezzo})`,
                      contesto: `Pacchetto selezionato dal Kit Partner: ${pkg.livello} (${pkg.prezzo}) — ${pkg.sottotitolo}`,
                    });
                  }}
                >
                  <Mail className="mr-1.5 size-3.5" /> Richiedi {pkg.livello}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Award className="size-5 text-accent" />
              <span>Vuoi ricevere il Media Kit completo in PDF via email o proporre una convenzione su misura?</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setKitOpen(false);
                contatta({
                  oggetto: "Richiesta invio Kit Partner PDF / Convenzione su misura",
                  contesto: "Richiesta invio presentazione PDF Kit Partner Terni 2030 via email",
                });
              }}
            >
              Ricevi il Kit via Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
