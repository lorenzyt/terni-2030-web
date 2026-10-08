import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, FileText, CheckCircle2, Star, BadgeCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCivic, registraDossierGenerato, oggi, COSTI_PREMI } from "@/lib/civic-store";
import { toast } from "sonner";
import { useContact } from "@/components/ContactDialog";

export const Route = createFileRoute("/dossier")({
  component: DossierPage,
});

const FASI = ["Profilazione", "Quartiere & Obiettivi", "Analisi & Matching", "Emissione"];

const MODELLI_DOSSIER = [
  "Inquadramento del progetto",
  "Bandi europei diretti",
  "Fondi regionali attivi (Umbria)",
  "Bandi comunali aperti su Terni",
  "Finanza agevolata e credito d'imposta",
  "Bonus per privati e condomini",
  "Rischi e punti di attenzione",
  "Professionisti e partner accreditati su Terni",
  "Prossimi passi e contatti",
];

function Stelle({ n, onSet }: { n: number; onSet?: (v: number) => void }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" disabled={!onSet} onClick={() => onSet?.(i)}>
          <Star className={`size-4 ${i <= n ? "fill-accent text-accent" : "text-muted-foreground"}`} />
        </button>
      ))}
    </span>
  );
}

function DossierPage() {
  const search = Route.useSearch();
  const { state, update, puntiDisponibili } = useCivic();
  const contatta = useContact();
  const [step, setStep] = useState(0);
  const [profilo, setProfilo] = useState("");
  const [quartiere, setQuartiere] = useState("");
  const [obiettivo, setObiettivo] = useState("");
  const [cercaQuartiere, setCercaQuartiere] = useState("");
  const [custom, setCustom] = useState({ titolo: "", descrizione: "", area: "" });
  const [usaPunti, setUsaPunti] = useState(false);
  const [rec, setRec] = useState({ autore: "", ruolo: "", stelle: 5, testo: "" });

  useEffect(() => {
    if (search.quartiere || search.obiettivo) {
      if (search.quartiere) setQuartiere(search.quartiere);
      if (search.obiettivo) setObiettivo(search.obiettivo);
      setProfilo((p) => p || "cittadino");
      setStep(search.quartiere && search.obiettivo ? 3 : 2);
      toast.info("Matching preliminare avviato con i dati della segnalazione.");
    }
  }, [search.quartiere, search.obiettivo]);

  const communityOb = state.obiettiviCommunity.filter((o) => !quartiere || o.area === quartiere);
  const obCustom = state.obiettiviCommunity.find((o) => o.id === obiettivo);

  const costoPunti = COSTI_PREMI.sconto;
  const saldo = puntiDisponibili();
  const puoScontare = saldo >= costoPunti;
  const prezzoPieno = 14.90;
  const prezzoScontato = 9.90;

  const generaDossier = async () => {
    const emailInput = document.getElementById("dossierEmail") as HTMLInputElement;
    if (!emailInput || !emailInput.value || !emailInput.value.includes("@")) {
      toast.error("Inserisci un indirizzo email valido.");
      return;
    }

    toast.info("Generazione dossier in corso...");
    try {
      await registraDossierGenerato({
        profilo, quartiere, obiettivo, custom, usaPunti,
        email: emailInput.value
      });
      if (usaPunti) update({ puntiSpesi: state.puntiSpesi + costoPunti });
      contatta("Generazione Dossier IA Completata", `Dossier richiesto da: ${emailInput.value}\nProfilo: ${profilo}\nObiettivo: ${obiettivo}\nQuartiere: ${quartiere}`);
      toast.success("Dossier generato con successo! Controlla la tua email.");
    } catch (err: any) {
      toast.error(`Errore durante la generazione: ${err.message}`);
    }
  };

  const inviaRecensione = () => {
    if (!rec.autore || !rec.testo) return toast.error("Nome e testo obbligatori");
    update({
      recensioni: [
        { id: `rec_${Date.now()}`, ...rec, data: oggi(), verificata: false },
        ...state.recensioni,
      ],
    });
    setRec({ autore: "", ruolo: "", stelle: 5, testo: "" });
    toast.success("Recensione inviata in approvazione!");
  };

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8">
        <Button variant="ghost" className="mb-4 text-muted-foreground hover:text-white" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 size-4" /> Torna indietro
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-accent lg:text-4xl">
          <FileText className="mr-3 inline-block size-8 align-text-bottom" />
          Bandi & Dossier IA
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Genera un fascicolo strategico personalizzato che incrocia i tuoi progetti con tutti i bandi (europei, regionali e comunali) e le agevolazioni attive a Terni.
        </p>
      </div>

      <div className="mb-8 flex items-center justify-between gap-2 overflow-x-auto pb-4">
        {FASI.map((f, i) => (
          <div key={i} className={`flex min-w-max items-center gap-2 ${i === step ? "text-accent" : i < step ? "text-white" : "text-muted-foreground"}`}>
            <div className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${i === step ? "bg-accent text-background" : i < step ? "bg-white text-background" : "bg-panel"}`}>
              {i < step ? <CheckCircle2 className="size-4" /> : i + 1}
            </div>
            <span className="text-sm font-semibold">{f}</span>
            {i < FASI.length - 1 && <div className={`h-0.5 w-8 sm:w-12 ${i < step ? "bg-white" : "bg-panel"}`} />}
          </div>
        ))}
      </div>

      <Card className="surface-panel p-6 sm:p-8">
        {step === 0 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <h2 className="text-xl font-bold">1. Chi sta richiedendo il dossier?</h2>
            <RadioGroup value={profilo} onValueChange={setProfilo} className="grid gap-4 sm:grid-cols-3">
              {[
                { id: "impresa", label: "🏢 Imprese & P.IVA", desc: "Commercio, artigianato, startup" },
                { id: "terzo-settore", label: "🤝 Terzo Settore", desc: "Associazioni, comitati, onlus" },
                { id: "cittadino", label: "👤 Privati Cittadini", desc: "Condomini, immobili, idee" },
              ].map((p) => (
                <div key={p.id} className={`relative flex cursor-pointer flex-col rounded-xl border p-4 transition-colors ${profilo === p.id ? "border-accent bg-accent/10" : "border-border bg-background hover:border-muted-foreground"}`} onClick={() => setProfilo(p.id)}>
                  <RadioGroupItem value={p.id} id={p.id} className="sr-only" />
                  <Label htmlFor={p.id} className="cursor-pointer font-bold">{p.label}</Label>
                  <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
                </div>
              ))}
            </RadioGroup>
            <Button disabled={!profilo} className="w-full font-bold" onClick={() => setStep(1)}>Continua</Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <h2 className="text-xl font-bold">2. Localizzazione e Ambito</h2>
            <div className="space-y-4">
              <div>
                <Label>In quale quartiere o area si sviluppa il progetto? (Opzionale)</Label>
                <Select value={quartiere} onValueChange={setQuartiere}>
                  <SelectTrigger className="mt-1 bg-background"><SelectValue placeholder="Seleziona un'area di riferimento" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="centro">Centro Storico</SelectItem>
                    <SelectItem value="periferia-nord">Periferia Nord (Cesi, Borgo Rivo...)</SelectItem>
                    <SelectItem value="periferia-est">Periferia Est (Valnerina, Papigno...)</SelectItem>
                    <SelectItem value="periferia-sud">Periferia Sud (Collescipoli, San Valentino...)</SelectItem>
                    <SelectItem value="periferia-ovest">Periferia Ovest (Gabelletta, Cratere...)</SelectItem>
                    <SelectItem value="tutta-citta">Riguarda tutta la città</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Qual è il tuo obiettivo primario?</Label>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {[
                    { id: "o1", label: "Riqualificazione Urbana", p: ["cittadino", "terzo-settore"] },
                    { id: "o2", label: "Sostenibilità Energetica", p: ["impresa", "cittadino"] },
                    { id: "o3", label: "Mobilità Dolce", p: ["cittadino", "terzo-settore"] },
                    { id: "o4", label: "Nuovo Impianto/Azienda", p: ["impresa"] },
                    { id: "o5", label: "Commercio e Locali Sfitti", p: ["impresa"] },
                    { id: "o6", label: "Cultura e Turismo", p: ["terzo-settore", "impresa"] },
                    { id: "o7", label: "Digitalizzazione", p: ["impresa"] },
                  ]
                    .filter((o) => !profilo || o.p.includes(profilo))
                    .map((o) => (
                      <Button key={o.id} variant={obiettivo === o.id ? "default" : "outline"} className={`justify-start ${obiettivo === o.id ? "border-accent bg-accent/20 text-accent hover:bg-accent/30" : "bg-background"}`} onClick={() => setObiettivo(o.id)}>
                        {o.label}
                      </Button>
                    ))}
                  <Button variant={obiettivo === "custom" ? "default" : "outline"} className={`justify-start ${obiettivo === "custom" ? "border-accent bg-accent/20 text-accent" : "bg-background"}`} onClick={() => setObiettivo("custom")}>
                    Altro (Idea libera)
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)}>Indietro</Button>
              <Button disabled={!obiettivo} className="flex-1 font-bold" onClick={() => setStep(2)}>Cerca Bandi Attivi</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <h2 className="text-xl font-bold">3. Analisi e Parametri IA</h2>
            {obiettivo === "custom" ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Descrivi brevemente il tuo progetto. Il nostro sistema analizzerà le parole chiave per scovare le migliori linee di finanziamento attive o in arrivo.</p>
                <div><Label>Titolo del progetto</Label><Input className="mt-1 bg-background" value={custom.titolo} onChange={(e) => setCustom({ ...custom, titolo: e.target.value })} placeholder="Es. Recupero casale per agriturismo" /></div>
                <div><Label>Descrizione dettagliata</Label><Textarea className="mt-1 bg-background" value={custom.descrizione} onChange={(e) => setCustom({ ...custom, descrizione: e.target.value })} placeholder="Cosa vuoi realizzare? Quali sono le spese previste? Chi sono i beneficiari?" rows={4} /></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-accent/30 bg-accent/10 p-5 text-center">
                  <h3 className="text-lg font-bold text-accent">Motore di Ricerca Bandi Attivato</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Stiamo interrogando i database di Regione Umbria, Comune di Terni, fondi ministeriali e PNRR focalizzati su <b>{obCustom?.titolo || obiettivo}</b> per il profilo <b>{profilo}</b>.</p>
                </div>
                <div className="space-y-2">
                  <Label>Vuoi collegarlo a un'idea già proposta dalla community? (Opzionale)</Label>
                  <Input placeholder="Filtra idee per zona o titolo..." className="bg-background" value={cercaQuartiere} onChange={(e) => setCercaQuartiere(e.target.value)} />
                  {communityOb.length > 0 ? (
                    <div className="grid max-h-48 gap-2 overflow-y-auto pr-2">
                      {communityOb.filter((o) => o.titolo.toLowerCase().includes(cercaQuartiere.toLowerCase()) || o.area.toLowerCase().includes(cercaQuartiere.toLowerCase())).map((o) => (
                        <div key={o.id} className={`cursor-pointer rounded-lg border p-3 text-sm transition-colors ${obiettivo === o.id ? "border-accent bg-accent/20" : "border-border bg-background hover:border-muted-foreground"}`} onClick={() => setObiettivo(o.id)}>
                          <b className="block">{o.titolo}</b>
                          <span className="text-xs text-muted-foreground">📍 {o.area}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nessuna proposta attiva in quest'area.</p>
                  )}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Indietro</Button>
              <Button className="flex-1 font-bold" onClick={() => setStep(3)}>Analizza Match (IA)</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">Il tuo Dossier è pronto per essere generato</h2>
              <p className="mt-2 text-muted-foreground">Ecco cosa conterrà il documento di ~15/20 pagine generato su misura per te:</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {MODELLI_DOSSIER.map((m, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-sm font-medium">
                  <CheckCircle2 className="size-4 text-emerald-500" /> {m}
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-background p-6">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div>
                  <h3 className="text-lg font-bold">Generazione Dossier IA</h3>
                  <p className="text-sm text-muted-foreground">Tempo di elaborazione stimato: 24/48 ore. Riceverai il PDF sulla tua email.</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-white">€ {usaPunti && puoScontare ? prezzoScontato.toFixed(2) : prezzoPieno.toFixed(2)}</div>
                  {puoScontare && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <Checkbox id="usaPunti" checked={usaPunti} onCheckedChange={(c) => setUsaPunti(c as boolean)} />
                      <Label htmlFor="usaPunti" className="cursor-pointer font-bold text-accent">Usa {costoPunti} pt esplorazione (Sconto € 5)</Label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-panel border border-accent/30 rounded-xl my-4 space-y-2">
              <label className="text-sm font-bold text-accent">📧 Indirizzo Email (Obbligatorio per ricevere il Dossier)</label>
              <input type="email" id="dossierEmail" placeholder="tua@email.it" className="w-full p-2.5 rounded-lg bg-background border border-border text-white outline-none focus:border-accent transition-colors" required />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="lg" onClick={() => setStep(2)}>Modifica Parametri</Button>
              <Button className="flex-1 font-bold" size="lg" onClick={generaDossier}>
                Richiedi Dossier Ora
              </Button>
            </div>
          </div>
        )}
      </Card>

      <section className="mt-16">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold">Cosa dicono i nostri utenti</h2>
          <p className="mt-2 text-muted-foreground">Le esperienze di chi ha già richiesto un Dossier IA</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {state.recensioni.map((r) => (
            <div key={r.id} className="surface-panel p-4">
              <div className="flex items-center justify-between gap-2">
                <Stelle n={r.stelle} />
                <span className="text-xs text-muted-foreground">{r.data}</span>
              </div>
              <p className="mt-2 text-sm">{r.testo}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <b className="text-foreground">{r.autore}</b> · {r.ruolo}
                {r.verificata && <span className="ml-1 inline-flex items-center gap-0.5 text-accent"><BadgeCheck className="size-3" /> verificata</span>}
              </p>
            </div>
          ))}
        </div>
        <div className="surface-panel mt-5 p-5">
          <h3 className="mb-3 font-semibold">Lascia la tua recensione</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Nome</Label><Input value={rec.autore} onChange={(e) => setRec({ ...rec, autore: e.target.value })} /></div>
            <div><Label>Ruolo (ente pubblico, impresa, cittadino…)</Label><Input value={rec.ruolo} onChange={(e) => setRec({ ...rec, ruolo: e.target.value })} /></div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">Valutazione: <Stelle n={rec.stelle} onSet={(v) => setRec({ ...rec, stelle: v })} /></div>
          <Textarea className="mt-3" value={rec.testo} onChange={(e) => setRec({ ...rec, testo: e.target.value })} placeholder="Com'è andata con il Dossier?" />
          <Button className="mt-3" onClick={inviaRecensione}>Pubblica recensione</Button>
        </div>
      </section>
    </div>
  );
}
