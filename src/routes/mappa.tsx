import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowBigUp, MapPin, Plus, Crosshair, BarChart3, MessageCircle, FileSearch, Users } from "lucide-react";
import { TerniMap } from "@/components/TerniMap";
import { Osservatorio } from "@/components/Osservatorio";
import { Discussione } from "@/components/Discussione";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CATEGORIA_TO_OBIETTIVO,
  CATEGORIE,
  COLORI_CATEGORIA,
  QUARTIERI,
  TERNI_CENTER,
  type CategoriaSegnalazione,
  type Segnalazione,
} from "@/lib/terni-data";
import { inviaPropostaModerazione, inviaSegnalazione, nuovoId, oggi, useCivic } from "@/lib/civic-store";

export const Route = createFileRoute("/mappa")({
  component: MappaCivica,
});

function CommunityBadge({ community }: { community?: boolean | undefined }) {
  return community ? (
    <Badge className="border-0 bg-accent/20 text-[10px] text-accent">Proposto dai Cittadini (Community)</Badge>
  ) : (
    <Badge variant="outline" className="text-[10px] text-muted-foreground">Obiettivo di Default</Badge>
  );
}

function MappaCivica() {
  const { state, update } = useCivic();
  const navigate = useNavigate();
  const [filtri, setFiltri] = useState<CategoriaSegnalazione[]>([...CATEGORIE]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [coord, setCoord] = useState<[number, number]>(TERNI_CENTER);
  const [modalitaPin, setModalitaPin] = useState(false);
  const [discussione, setDiscussione] = useState<Segnalazione | null>(null);
  const [aperti, setAperti] = useState<string[]>([]);
  const [nuovoSondOpen, setNuovoSondOpen] = useState(false);
  const [sondForm, setSondForm] = useState({ domanda: "", contesto: "Centro Storico", opzioni: "" });
  const [opzioneNuova, setOpzioneNuova] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    titolo: "",
    descrizione: "",
    categoria: "Spazi Verdi" as CategoriaSegnalazione,
    quartiere: "Centro Storico",
  });

  const { segnalazioni, votiSegnalazioni, commenti, sondaggi, votiSondaggi } = state;
  const visibili = useMemo(() => segnalazioni.filter((s) => filtri.includes(s.categoria)), [segnalazioni, filtri]);

  const toggleVoto = (id: string) => {
    const gia = votiSegnalazioni.includes(id);
    update((s) => ({
      ...s,
      votiSegnalazioni: gia ? s.votiSegnalazioni.filter((x) => x !== id) : [...s.votiSegnalazioni, id],
      segnalazioni: s.segnalazioni.map((x) => (x.id === id ? { ...x, voti: x.voti + (gia ? -1 : 1) } : x)),
    }));
    toast[gia ? "info" : "success"](gia ? "Voto annullato." : "Voto registrato. Grazie!");
  };

  const verificaBandi = (s: Segnalazione) =>
    navigate({ to: "/dossier", search: { quartiere: s.quartiere, obiettivo: CATEGORIA_TO_OBIETTIVO[s.categoria], caso: s.titolo } });

  const pins = visibili.map((s) => {
    const votato = votiSegnalazioni.includes(s.id);
    return {
      id: s.id,
      lat: s.lat,
      lng: s.lng,
      color: COLORI_CATEGORIA[s.categoria],
      label: s.titolo,
      popup: (
        <div className="space-y-2">
          <p className="font-semibold">{s.titolo}</p>
          <p className="text-xs opacity-80">{s.descrizione}</p>
          <p className="text-xs opacity-70">{s.categoria} · {s.quartiere} · {s.stato}</p>
          <div className="flex gap-2">
            <button
              onClick={() => toggleVoto(s.id)}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${votato ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}
            >
              <ArrowBigUp className="size-3" /> {s.voti} {votato ? "· annulla" : "voti"}
            </button>
            <button onClick={() => setDiscussione(s)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs">
              <MessageCircle className="size-3" /> {(commenti[s.id] ?? []).length}
            </button>
          </div>
          <button onClick={() => verificaBandi(s)} className="w-full rounded-md bg-secondary px-2 py-1.5 text-left text-xs font-semibold text-accent">
            Verifica Bandi & Fattibilità IA per questo caso →
          </button>
        </div>
      ),
    };
  });

  const onMapClick = (lat: number, lng: number) => {
    if (!modalitaPin) return;
    setCoord([lat, lng]);
    setModalitaPin(false);
    setDialogOpen(true);
  };

  const invia = () => {
    if (!form.titolo.trim()) {
      toast.error("Inserisci un titolo per la segnalazione.");
      return;
    }
    const nuova: Segnalazione = {
      id: nuovoId("s"),
      titolo: form.titolo,
      descrizione: form.descrizione || "Nessuna descrizione fornita.",
      categoria: form.categoria,
      quartiere: form.quartiere,
      lat: coord[0],
      lng: coord[1],
      voti: 1,
      stato: "Aperta",
      data: oggi(),
    };
    void inviaSegnalazione({
      titolo: nuova.titolo,
      descrizione: nuova.descrizione,
      categoria: nuova.categoria,
      quartiere: nuova.quartiere,
      lat: nuova.lat,
      lng: nuova.lng,
      voti: 1,
      stato: "In revisione",
    });
    setForm({ titolo: "", descrizione: "", categoria: "Spazi Verdi", quartiere: "Centro Storico" });
    setDialogOpen(false);
    toast.success("Segnalazione inviata alla Regia Admin per l'approvazione sulla mappa!");
  };

  const votaSondaggio = (sid: string, oid: string) => {
    const attuale = votiSondaggi[sid];
    update((s) => {
      const v = { ...s.votiSondaggi };
      if (attuale === oid) delete v[sid];
      else v[sid] = oid;
      return { ...s, votiSondaggi: v };
    });
    toast[attuale === oid ? "info" : "success"](attuale === oid ? "Risposta annullata." : "Risposta registrata.");
  };

  const aggiungiOpzione = (sid: string) => {
    const t = (opzioneNuova[sid] ?? "").trim();
    if (!t) return void toast.error("Scrivi il testo dell'opzione proposta.");
    const sondTarget = sondaggi.find((s) => s.id === sid);
    void inviaPropostaModerazione({
      tipo: "sondaggio",
      titolo: `Nuova opzione per sondaggio: ${sondTarget?.domanda?.slice(0, 30)}...`,
      autore: "Cittadino (Mappa Civica)",
      contatto: "Opzione aggiuntiva",
      dati: {
        domanda: `L'utente suggerisce di aggiungere questa opzione al sondaggio:`,
        contesto: t,
        opzioni: [],
      }
    });
    setOpzioneNuova((p) => ({ ...p, [sid]: "" }));
    toast.success("Opzione inviata alla Regia Admin per approvazione.");
  };

  const creaSondaggio = () => {
    const opz = sondForm.opzioni.split("\n").map((o) => o.trim()).filter(Boolean);
    if (!sondForm.domanda.trim() || opz.length < 2) return void toast.error("Inserisci una domanda e almeno 2 opzioni (una per riga).");
    void inviaPropostaModerazione({
      tipo: "sondaggio",
      titolo: sondForm.domanda.trim(),
      autore: "Cittadino da Mappa Civica",
      contatto: sondForm.contesto,
      dati: {
        domanda: sondForm.domanda.trim(),
        contesto: `Sondaggio civico · ${sondForm.contesto}`,
        opzioni: opz.map((t, idx) => ({ id: `op${idx + 1}`, testo: t, voti: 0, community: true })),
      },
    });
    setSondForm({ domanda: "", contesto: "Centro Storico", opzioni: "" });
    setNuovoSondOpen(false);
    toast.success("Proposta di sondaggio inviata alla Regia Admin per l'approvazione!");
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-accent">
            Autore e Curatore: Lorenzo Covicchio · Esecutore Operativo e Analitico: IA
          </p>
          <h1 className="text-3xl font-bold md:text-4xl">
            Mappa GIS & <span className="text-ember-gradient">Segnalazioni Civiche</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Il cruscotto della rigenerazione di Terni: segnala, discuti, vota le priorità e verifica subito i bandi attivabili.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={modalitaPin ? "secondary" : "outline"}
            onClick={() => {
              setModalitaPin((v) => !v);
              if (!modalitaPin) toast.info("Clicca sulla mappa per posizionare il pin.");
            }}
          >
            <Crosshair className="size-4" /> {modalitaPin ? "Clicca sulla mappa…" : "Posiziona pin"}
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" /> Nuova Segnalazione
          </Button>
        </div>
      </div>

      <Osservatorio />

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-5">
          <div className="surface-panel p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Filtri per categoria</h2>
            <div className="space-y-2">
              {CATEGORIE.map((c) => {
                const attivo = filtri.includes(c);
                const count = segnalazioni.filter((s) => s.categoria === c).length;
                return (
                  <button
                    key={c}
                    onClick={() => setFiltri((f) => (f.includes(c) ? f.filter((x) => x !== c) : [...f, c]))}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                      attivo ? "border-primary/60 bg-secondary text-foreground" : "border-border text-muted-foreground hover:bg-secondary/60"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="size-3 rounded-full" style={{ backgroundColor: COLORI_CATEGORIA[c] }} />
                      {c}
                    </span>
                    <span className="text-xs opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="surface-panel p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <BarChart3 className="size-4" /> Mini-Sondaggi Territoriali
            </h2>
            <Button size="sm" variant="outline" className="mb-4 w-full" onClick={() => setNuovoSondOpen(true)}>
              <Plus className="size-4" /> Crea Nuovo Sondaggio Civico
            </Button>
            <div className="space-y-6">
              {sondaggi.map((s) => {
                const scelta = votiSondaggi[s.id];
                const totale = s.opzioni.reduce((a, o) => a + o.voti, 0) + (scelta ? 1 : 0);
                return (
                  <div key={s.id}>
                    <div className="mb-1"><CommunityBadge community={s.community} /></div>
                    <p className="text-sm font-medium">{s.domanda}</p>
                    <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">{s.contesto}</p>
                    <div className="space-y-2">
                      {s.opzioni.map((o) => {
                        const v = o.voti + (scelta === o.id ? 1 : 0);
                        const perc = totale ? Math.round((v / totale) * 100) : 0;
                        return (
                          <button
                            key={o.id}
                            onClick={() => votaSondaggio(s.id, o.id)}
                            className={`w-full rounded-md border px-3 py-2 text-left text-xs transition-colors hover:bg-secondary ${scelta === o.id ? "border-accent" : "border-border"}`}
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span className={scelta === o.id ? "font-semibold text-accent" : ""}>{o.testo}</span>
                              {scelta && <span className="opacity-70">{perc}%</span>}
                            </span>
                            <span className="mt-1 flex items-center gap-2">
                              {!s.community && <CommunityBadge community={o.community} />}
                              {scelta === o.id && <span className="text-[10px] text-muted-foreground">clicca per annullare</span>}
                            </span>
                            {scelta && <Progress value={perc} className="mt-2 h-1.5" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Input
                        className="h-8 text-xs"
                        placeholder="+ Aggiungi obiettivo personalizzato"
                        value={opzioneNuova[s.id] ?? ""}
                        onChange={(e) => setOpzioneNuova((p) => ({ ...p, [s.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && aggiungiOpzione(s.id)}
                      />
                      <Button size="sm" variant="secondary" className="h-8" onClick={() => aggiungiOpzione(s.id)}>
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <div className="h-[520px] overflow-hidden rounded-xl border border-border metal-edge">
            <TerniMap center={TERNI_CENTER} zoom={13} pins={pins} onMapClick={onMapClick} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {visibili
              .slice()
              .sort((a, b) => b.voti - a.voti)
              .map((s) => {
                const votato = votiSegnalazioni.includes(s.id);
                const nCom = (commenti[s.id] ?? []).length;
                const aperto = aperti.includes(s.id);
                return (
                  <article key={s.id} className="surface-panel p-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => toggleVoto(s.id)}
                        title={votato ? "Annulla voto" : "Vota"}
                        className={`flex h-fit flex-col items-center rounded-md border px-2 py-1 transition-colors ${
                          votato ? "border-accent bg-accent text-accent-foreground" : "border-border hover:border-primary hover:text-primary"
                        }`}
                      >
                        <ArrowBigUp className="size-5" />
                        <span className="text-xs font-semibold">{s.voti}</span>
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge style={{ backgroundColor: `${COLORI_CATEGORIA[s.categoria]}22`, color: COLORI_CATEGORIA[s.categoria] }} className="border-0">
                            {s.categoria}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{s.stato}</span>
                        </div>
                        <h3 className="mt-1 font-semibold">{s.titolo}</h3>
                        <p className="text-sm text-muted-foreground">{s.descrizione}</p>
                        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" /> {s.quartiere} · {s.data}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setAperti((a) => (aperto ? a.filter((x) => x !== s.id) : [...a, s.id]))}>
                        <MessageCircle className="size-4" /> {nCom} commenti
                      </Button>
                      <Button size="sm" variant="secondary" className="text-accent" onClick={() => verificaBandi(s)}>
                        <FileSearch className="size-4" /> Verifica Bandi & Fattibilità IA per questo caso →
                      </Button>
                    </div>
                    {aperto && (
                      <div className="mt-3 border-t border-border pt-3">
                        <Discussione chiave={s.id} />
                      </div>
                    )}
                  </article>
                );
              })}
          </div>
        </div>
      </div>

      <Dialog open={!!discussione} onOpenChange={(o) => !o && setDiscussione(null)}>
        <DialogContent className="z-[2000]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Users className="size-5 text-accent" /> {discussione?.titolo}</DialogTitle>
            <DialogDescription>{discussione?.quartiere} · {discussione?.categoria}</DialogDescription>
          </DialogHeader>
          {discussione && <Discussione chiave={discussione.id} />}
        </DialogContent>
      </Dialog>

      <Dialog open={nuovoSondOpen} onOpenChange={setNuovoSondOpen}>
        <DialogContent className="z-[2000]">
          <DialogHeader>
            <DialogTitle>Crea Nuovo Sondaggio Civico</DialogTitle>
            <DialogDescription>Sarà contrassegnato come "Proposto dai Cittadini (Community)".</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Domanda</Label>
              <Input value={sondForm.domanda} onChange={(e) => setSondForm({ ...sondForm, domanda: e.target.value })} placeholder="Es. Come usare l'ex mercato coperto?" />
            </div>
            <div>
              <Label>Quartiere</Label>
              <Select value={sondForm.contesto} onValueChange={(v) => setSondForm({ ...sondForm, contesto: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[2100]">
                  {QUARTIERI.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Opzioni (una per riga)</Label>
              <Textarea value={sondForm.opzioni} onChange={(e) => setSondForm({ ...sondForm, opzioni: e.target.value })} placeholder={"Mercato a km zero\nSpazio eventi\nCoworking"} />
            </div>
            <Button className="w-full" onClick={creaSondaggio}>Pubblica sondaggio</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="z-[2000]">
          <DialogHeader>
            <DialogTitle>Nuova segnalazione</DialogTitle>
            <DialogDescription>Coordinate: {coord[0].toFixed(5)}, {coord[1].toFixed(5)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="titolo">Titolo</Label>
              <Input id="titolo" value={form.titolo} onChange={(e) => setForm({ ...form, titolo: e.target.value })} placeholder="Es. Panchine rotte ai Giardini La Passeggiata" />
            </div>
            <div>
              <Label htmlFor="desc">Descrizione</Label>
              <Textarea id="desc" value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} placeholder="Descrivi il problema o la proposta..." />
            </div>
            <div>
              <Label htmlFor="cat">Categoria</Label>
              <Select value={form.categoria} onValueChange={(v: CategoriaSegnalazione) => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[2100]">
                  {CATEGORIE.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quart">Quartiere</Label>
              <Select value={form.quartiere} onValueChange={(v) => setForm({ ...form, quartiere: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[2100]">
                  {QUARTIERI.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={invia}>Pubblica Segnalazione</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
