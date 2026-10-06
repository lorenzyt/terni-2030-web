import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Award, BadgeCheck, CheckCircle2, Compass, ExternalLink, Gift, Heart, Megaphone, Plus, Sparkles, Undo2, Users } from "lucide-react";
import { TerniMap } from "@/components/TerniMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BACHECA, PARTNERS, POI_LIST, TERNI_CENTER, type POI } from "@/lib/terni-data";
import { COSTI_PREMI, nuovoId, oggi, useCivic } from "@/lib/civic-store";

export const Route = createFileRoute("/urban-go")({
  head: () => ({
    meta: [
      { title: "Terni Urban GO — Cultura, Architettura & Attivismo" },
      { name: "description", content: "Esplora Terni: check-in, Punti Esploratore, articoli d'autore e voci dell'attivismo ternano." },
      { property: "og:title", content: "Terni Urban GO — Esplora la città" },
      { property: "og:description", content: "Check-in, premi civici e articoli d'autore sui luoghi di Terni." },
    ],
  }),
  component: UrbanGo,
});

const COLORI_POI: Record<POI["categoria"], string> = {
  "Architettura d'autore": "#e8b23a",
  "Arte pubblica": "#e2603a",
  "Archeologia industriale": "#8f9aa8",
  "Storia e fede": "#d84a6d",
};

function UrbanGo() {
  const { state, update, puntiGuadagnati, puntiDisponibili } = useCivic();
  const esplorati = state.checkin;
  const [attivo, setAttivo] = useState<POI | undefined>(POI_LIST[0]);
  const [premiOpen, setPremiOpen] = useState(false);
  const [segnalaOpen, setSegnalaOpen] = useState(false);
  const [post, setPost] = useState({ pagina: "", testo: "", link: "" });
  const puntiTotali = POI_LIST.reduce((a, p) => a + p.punti, 0);

  const toggleCheckin = (poi: POI) => {
    const fatto = esplorati.includes(poi.id);
    if (fatto && puntiDisponibili - poi.punti < 0) {
      toast.error("Non puoi annullare: i punti di questo check-in sono già stati spesi.");
      return;
    }
    update((s) => ({ ...s, checkin: fatto ? s.checkin.filter((x) => x !== poi.id) : [...s.checkin, poi.id] }));
    toast[fatto ? "info" : "success"](fatto ? `Check-in annullato — ${poi.nome}` : `Esplorato! +${poi.punti} punti — ${poi.nome}`);
  };

  const spendi = (costo: number, patch: (s: typeof state) => typeof state, msg: string) => {
    if (puntiDisponibili < costo) return void toast.error(`Servono ${costo} punti: ne hai ${puntiDisponibili}.`);
    update((s) => ({ ...patch(s), puntiSpesi: s.puntiSpesi + costo }));
    toast.success(msg);
  };

  const inviaPost = () => {
    if (!post.pagina.trim() || !post.testo.trim()) return void toast.error("Indica pagina e contenuto.");
    update((s) => ({
      ...s,
      postSocial: [
        { id: nuovoId("ps"), pagina: post.pagina.trim(), tipo: "Post", testo: post.testo.trim(), temi: ["Segnalato dalla community"], data: oggi(), reazioni: 0, link: post.link.trim() || "#", segnalatoDaUtente: true },
        ...s.postSocial,
      ],
    }));
    setPost({ pagina: "", testo: "", link: "" });
    setSegnalaOpen(false);
    toast.success("Grazie! Post/pagina aggiunto al feed.");
  };

  const pins = POI_LIST.map((p) => ({
    id: p.id,
    lat: p.lat,
    lng: p.lng,
    color: COLORI_POI[p.categoria],
    label: p.nome,
    glow: !esplorati.includes(p.id),
    popup: (
      <div className="space-y-2">
        <p className="font-semibold">{p.nome}</p>
        <p className="text-xs opacity-80">{p.autore} · {p.anno}</p>
        <button onClick={() => toggleCheckin(p)} className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
          {esplorati.includes(p.id) ? "Esplorato · annulla" : `Check-in +${p.punti}`}
        </button>
        <Link to="/articoli/$id" params={{ id: p.id }} className="block text-xs font-semibold text-accent">Leggi l'articolo d'autore →</Link>
      </div>
    ),
  }));

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">Terni <span className="text-ember-gradient">Urban GO</span></h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Caccia al tesoro urbana fra architettura d'autore, arte pubblica e archeologia industriale.
          </p>
        </div>
        <button onClick={() => setPremiOpen(true)} className="surface-panel flex items-center gap-4 px-4 py-3 text-left transition-colors hover:border-accent">
          <Award className="size-6 text-accent" />
          <div>
            <p className="text-sm font-semibold">{puntiDisponibili} punti disponibili</p>
            <p className="text-[11px] text-muted-foreground">{puntiGuadagnati}/{puntiTotali} guadagnati · Premi & Livelli →</p>
            <Progress value={puntiTotali > 0 ? (puntiGuadagnati / puntiTotali) * 100 : 0} className="mt-1 h-1.5 w-40" />
          </div>
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
        <div className="space-y-5">
          <div className="h-[480px] overflow-hidden rounded-xl border border-border metal-edge">
            <TerniMap center={TERNI_CENTER} zoom={13} pins={pins} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {POI_LIST.map((p) => {
              const fatto = esplorati.includes(p.id);
              return (
                <article key={p.id} onClick={() => setAttivo(p)} className={`surface-panel cursor-pointer p-4 ${attivo?.id === p.id ? "border-primary/70" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge className="border-0" style={{ backgroundColor: `${COLORI_POI[p.categoria]}22`, color: COLORI_POI[p.categoria] }}>{p.categoria}</Badge>
                      <h3 className="mt-2 font-semibold leading-tight">{p.nome}</h3>
                      <p className="text-xs text-muted-foreground">{p.autore} · {p.anno}</p>
                    </div>
                    {fatto && <CheckCircle2 className="size-5 shrink-0 text-accent" />}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{p.descrizione}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant={fatto ? "secondary" : "default"} onClick={(e) => { e.stopPropagation(); toggleCheckin(p); }}>
                      {fatto ? <><Undo2 className="size-4" /> Annulla check-in</> : <><Compass className="size-4" /> Check-in · +{p.punti} pt</>}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-accent" asChild onClick={(e) => e.stopPropagation()}>
                      <Link to="/articoli/$id" params={{ id: p.id }}>Scopri di più — Leggi l'articolo d'autore →</Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          <section className="surface-panel p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Megaphone className="size-5 text-accent" /> Voci & Pagine Social dell'Attivismo Ternano</h2>
              <Button size="sm" variant="outline" onClick={() => setSegnalaOpen(true)}><Plus className="size-4" /> Segnala post o pagina locale</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {state.postSocial.map((p) => (
                <div key={p.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{p.pagina}</p>
                    <Badge variant="secondary">{p.tipo}</Badge>
                  </div>
                  <p className="mt-2 text-sm">{p.testo}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.temi.map((t) => <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">#{t}</span>)}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-primary" onClick={() => update((s) => ({ ...s, postSocial: s.postSocial.map((x) => (x.id === p.id ? { ...x, reazioni: x.reazioni + 1 } : x)) }))}>
                      <Heart className="size-3" /> {p.reazioni}
                    </button>
                    <span>{p.data}</span>
                    {p.link !== "#" && (
                      <a href={p.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-accent">Apri pagina <ExternalLink className="size-3" /></a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="surface-panel p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground"><Sparkles className="size-4" /> Scheda di approfondimento</h2>
            {attivo ? (
              <>
                <h3 className="mt-3 text-lg font-semibold">{attivo.nome}</h3>
                <p className="text-xs text-muted-foreground">{attivo.autore} · {attivo.anno}</p>
                <p className="mt-3 text-sm">{attivo.descrizione}</p>
                <p className="mt-3 rounded-md border border-border bg-surface-2 p-3 text-sm text-muted-foreground">
                  <span className="font-semibold text-accent">Lo sapevi? </span>{attivo.curiosita}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Nessuna scheda luogo inserita al momento.</p>
            )}
          </div>

          <div className="surface-panel p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground"><Users className="size-4" /> Bacheca del territorio</h2>
            <div className="mt-3 space-y-3">
              {state.postSocial.slice(0, 2).map((p) => (
                <div key={p.id} className="rounded-md border border-accent/40 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-accent">Dal feed attivismo · {p.pagina}</p>
                  <p className="mt-1 text-xs">{p.testo}</p>
                </div>
              ))}
              {BACHECA.map((b) => (
                <div key={b.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{b.nome}</h3>
                    <Badge variant="secondary">{b.tipo}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{b.descrizione}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-accent">{b.ambito} · {b.contatto}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={premiOpen} onOpenChange={setPremiOpen}>
        <DialogContent className="z-[2000] max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Gift className="size-5 text-accent" /> Premi & Livelli Civici</DialogTitle>
            <DialogDescription>
              Ogni check-in fa guadagnare Punti Esploratore. Hai <b>{puntiDisponibili}</b> punti disponibili ({state.puntiSpesi} già spesi). Puoi annullare un check-in fatto per errore dalla card del luogo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Premio titolo="Sconto 5 € sul Dossier Bandi IA" desc="Il PDF scende da 14,90 € a 9,90 €." costo={COSTI_PREMI.sconto} fatto={state.scontoDossier}
              onClick={() => spendi(COSTI_PREMI.sconto, (s) => ({ ...s, scontoDossier: true }), "Sconto attivato: il Dossier costa ora 9,90 €.")} />
            <Premio titolo="Badge «Esploratore Certificato»" desc="Appare accanto al tuo nome in tutti i commenti." costo={COSTI_PREMI.badge} fatto={state.badgeEsploratore}
              onClick={() => spendi(COSTI_PREMI.badge, (s) => ({ ...s, badgeEsploratore: true }), "Badge Esploratore Certificato ottenuto!")} />
            <div className="rounded-lg border border-border p-3">
              <p className="font-semibold">Vantaggi presso Partner & Sponsor</p>
              <p className="text-xs text-muted-foreground">{COSTI_PREMI.partner} punti ciascuno · ricevi un codice da mostrare in sede.</p>
              <div className="mt-2 space-y-1">
                {PARTNERS.filter((p) => p.certificato).map((p) => {
                  const preso = state.premiPartner.includes(p.id);
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                      <span>{p.nome}</span>
                      {preso ? (
                        <span className="font-mono text-xs text-accent">T2030-{p.id.toUpperCase()}</span>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => spendi(COSTI_PREMI.partner, (s) => ({ ...s, premiPartner: [...s.premiPartner, p.id] }), `Codice vantaggio ${p.nome}: T2030-${p.id.toUpperCase()}`)}>
                          Riscatta
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={segnalaOpen} onOpenChange={setSegnalaOpen}>
        <DialogContent className="z-[2000]">
          <DialogHeader>
            <DialogTitle>Segnala un post o una pagina locale</DialogTitle>
            <DialogDescription>Aggiungi voci dell'attivismo ternano al feed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Pagina / gruppo</Label><Input value={post.pagina} onChange={(e) => setPost({ ...post, pagina: e.target.value })} /></div>
            <div><Label>Contenuto</Label><Textarea value={post.testo} onChange={(e) => setPost({ ...post, testo: e.target.value })} /></div>
            <div><Label>Link (facoltativo)</Label><Input value={post.link} onChange={(e) => setPost({ ...post, link: e.target.value })} placeholder="https://" /></div>
            <Button className="w-full" onClick={inviaPost}>Aggiungi al feed</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Premio({ titolo, desc, costo, fatto, onClick }: { titolo: string; desc: string; costo: number; fatto: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div>
        <p className="font-semibold">{titolo}</p>
        <p className="text-xs text-muted-foreground">{desc} · {costo} punti</p>
      </div>
      {fatto ? (
        <span className="flex items-center gap-1 text-xs text-accent"><BadgeCheck className="size-4" /> Attivo</span>
      ) : (
        <Button size="sm" onClick={onClick}>Usa punti</Button>
      )}
    </div>
  );
}
