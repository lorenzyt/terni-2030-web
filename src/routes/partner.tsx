import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Building2, Handshake, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PARTNERS } from "@/lib/terni-data";
import { EMAIL_CONTATTO, useContact } from "@/components/ContactDialog";

export const Route = createFileRoute("/partner")({
  head: () => ({
    meta: [
      { title: "Partner & Sponsor della Riqualificazione — Terni 2030" },
      { name: "description", content: "Le imprese, gli studi tecnici e gli sponsor che sostengono la rigenerazione urbana di Terni." },
      { property: "og:title", content: "Partner & Sponsor — Terni 2030" },
      { property: "og:description", content: "Diventa Partner Certificato della rigenerazione della Città dell'Amore e dell'Acciaio." },
    ],
  }),
  component: PartnerPage,
});

function PartnerPage() {
  const contatta = useContact();
  return (
    <div className="mx-auto max-w-[1300px] px-4 py-8 md:px-6">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold md:text-4xl">
          Partner & <span className="text-ember-gradient">Sponsor</span> della Riqualificazione
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aziende locali, studi tecnici, cooperative e sponsor al servizio della rigenerazione di Terni.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PARTNERS.map((p) => (
          <article key={p.id} className="surface-panel flex flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="flex size-10 items-center justify-center rounded-md bg-secondary"><Building2 className="size-5 text-accent" /></span>
              <Badge variant="secondary">{p.livello}</Badge>
            </div>
            <h2 className="mt-3 text-lg font-semibold">{p.nome}</h2>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.settore}</p>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.descrizione}</p>
            <p className="mt-3 text-xs text-muted-foreground">{p.citta}</p>
            {p.certificato && (
              <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent"><BadgeCheck className="size-4" /> Partner Certificato</p>
            )}
          </article>
        ))}
      </div>

      <section className="surface-panel metal-edge mt-10 flex flex-wrap items-center justify-between gap-6 p-7">
        <div className="max-w-xl">
          <h2 className="text-2xl font-bold">Diventa Sponsor di Terni 2030</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Visibilità sulla mappa civica, badge Partner Certificato, accesso ai dossier di quartiere. Scrivi a{" "}
            <a href={`mailto:${EMAIL_CONTATTO}`} className="text-accent underline">{EMAIL_CONTATTO}</a>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => contatta({ oggetto: "Diventa Sponsor", contesto: "Pagina Partner & Sponsor — richiesta di sponsorizzazione" })}>
            <Handshake className="size-4" /> Diventa Sponsor
          </Button>
          <Button variant="outline" onClick={() => contatta({ oggetto: "Richiedi il kit partner", contesto: "Pagina Partner & Sponsor — invio kit partner" })}>
            <Mail className="size-4" /> Richiedi il kit partner
          </Button>
        </div>
      </section>
    </div>
  );
}
