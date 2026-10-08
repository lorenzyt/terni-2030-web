import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, CheckCircle2, Star, BadgeCheck, Lock, Radar, AlertCircle, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCivic, registraDossierGenerato, oggi, COSTI_PREMI, nuovoId } from "@/lib/civic-store";
import { OBIETTIVI, PROFILI, QUARTIERI } from "@/lib/terni-data";
import { toast } from "sonner";
import { useContact } from "@/components/ContactDialog";
import bandiRealiJson from "@/lib/bandi_reali.json";

export const Route = createFileRoute("/dossier")({ component: DossierPage });

const FASI = ["Profilo", "Quartiere", "Obiettivo", "Dossier"];

function normKey(titolo: string): string { return String(titolo || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40); }

// Salvagente nel caso il JSON dovesse mai caricarsi male
const bandiArray = Array.isArray(bandiRealiJson) ? bandiRealiJson : [];

const contaPerPortale = (nome: string) => bandiArray.filter((b: any) => (b.portale || b.ente || "").toLowerCase().includes(nome.toLowerCase())).length;

const PORTALI = [
  { nome: "Regione Umbria", n: contaPerPortale("Regione Umbria"), ambito: "FESR, FSE+, rigenerazione" },
  { nome: "Comune di Terni", n: contaPerPortale("Comune di Terni"), ambito: "Sfitti, commercio, sociale" },
  { nome: "GSE", n: contaPerPortale("GSE"), ambito: "Conto Termico, CER, fotovoltaico" },
  { nome: "PNRR", n: contaPerPortale("PNRR"), ambito: "Transizione, inclusione, cultura" },
  { nome: "Invitalia", n: contaPerPortale("Invitalia"), ambito: "Nuove imprese, impianti, startup" },
  { nome: "Camera di Commercio", n: contaPerPortale("Camera di Commercio"), ambito: "Digitale, voucher, export" }
];

function DossierPage() {
  const search = Route.useSearch() as any;
  const { state, update, puntiDisponibili } = useCivic();
  const contatta = useContact();

  const [step, setStep] = useState(0);
  const [profilo, setProfilo] = useState("");
  const [quartiere, setQuartiere] = useState("");
  const [obiettivo, setObiettivo] = useState("");
  const [cercaQuartiere, setCercaQuartiere] = useState("");
  const [custom, setCustom] = useState({ titolo: "", descrizione: "", area: "" });
  const [usaPunti, setUsaPunti] = useState(false);
  const [emailDossier, setEmailDossier] = useState("");

  const obiettiviLocali = OBIETTIVI || [];
  const profiliLocali = PROFILI || [];
  const quartieriLocali = QUARTIERI || [];

  // Protezioni ?. contro "undefined" al primo render
  const communityOb = (state?.obiettiviCommunity || []).filter((o: any) => !quartiere || o.area === quartiere);
  const obCustom = (state?.obiettiviCommunity || []).find((o: any) => o.id === obiettivo);

  const costoPunti = COSTI_PREMI?.sconto || 500;
  const saldo = puntiDisponibili ? puntiDisponibili() : 0;
  const puoScontare = saldo >= costoPunti;
  const prezzoPieno = 14.90;
  const prezzoScontato = 9.90;

  const dossierVenduti = (state?.dossierGenerati || []).filter((d: any) => d.stato === "Venduto").length;

  // Filtraggio diretto autonomo (senza dipendere da export esterni in terni-data.ts)
  const bandiGrezzi = bandiArray.filter((b: any) => {
      if (!obiettivo) return false;
      const obId = b.obiettivo_id || b.obiettivo;
      return obId === obiettivo || (b.ambiti && Array.isArray(b.ambiti) && b.ambiti.includes(profilo));
  });
  
  const bandi = bandiGrezzi
      .filter((b: any) => state?.auditBandi?.[normKey(b.nome || b.titolo)]?.stato !== "Scartato")
      .slice(0, 5);

  const profiloNome = profiliLocali.find((p: any) => p.id === profilo)?.nome ?? profilo;
  const obiettivoNome = obCustom?.titolo ?? obiettiviLocali.find((o: any) => o.id === obiettivo)?.nome ?? obiettivo;
  const quartieriFiltrati = quartieriLocali.filter((q: string) => q.toLowerCase().includes(cercaQuartiere.trim().toLowerCase()));

  useEffect(() => {
    if (search?.quartiere || search?.obiettivo) {
      if (search.quartiere) setQuartiere(search.quartiere);
      if (search.obiettivo) setObiettivo(search.obiettivo);
      setProfilo((p: any) => p || "cittadino");
      setStep((search.quartiere && search.obiettivo) ? 3 : 2);
    }
  }, [search]);

  const aggiungiCustom = () => {
    if (!custom.titolo.trim()) return toast.error("Dai un titolo al tuo obiettivo.");
    const idGenerato = typeof nuovoId === "function" ? nuovoId("oc") : `oc_${Date.now()}`;
    const nuovo = { id: idGenerato, titolo: custom.titolo.trim(), descrizione: custom.descrizione.trim(), area: custom.area || quartiere || "Centro Storico" };
    if (update) update((s: any) => ({ ...s, obiettiviCommunity: [...(s.obiettiviCommunity || []), nuovo] }));
    setObiettivo(nuovo.id);
    setCustom({ titolo: "", descrizione: "", area: "" });
    toast.success("Obiettivo personalizzato aggiunto.");
  };

  const generaDossier = async () => {
    if (!emailDossier || !emailDossier.includes("@")) return toast.error("Inserisci un'email valida.");
    toast.info("Generazione dossier in corso...");
    try {
      if (typeof registraDossierGenerato === "function") {
        await registraDossierGenerato({
          profilo: profiloNome, quartiere, obiettivo: obiettivoNome, email: emailDossier,
          azione: bandi.length > 0 ? "Richiesta PDF" : "Nessun Bando - Contatto",
          bandi: bandi.map((b: any) => ({ nome: b.nome || b.titolo, ente: b.ente || b.portale }))
        });
      }
      if (usaPunti && update) update((s: any) => ({ ...s, puntiSpesi: (s.puntiSpesi || 0) + costoPunti }));
      if (contatta) contatta({
        oggetto: "Richiesta Dossier IA",
        contesto: `Da: ${emailDossier}\nProfilo: ${profiloNome}\nQuartiere: ${quartiere}\nObiettivo: ${obiettivoNome}`
      });
      toast.success("Dossier richiesto! Ti contatteremo a breve.");
    } catch (err: any) { toast.error(`Errore: ${err.message}`); }
  };

  const card = (sel: boolean) => `rounded-lg border p-4 text-left transition-colors ${sel ? "border-primary bg-secondary" : "border-border hover:bg-secondary/60"}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-8 text-center">
        <div className="mb-3 flex justify-center gap-2">
          <Badge variant="secondary">Analisi IA · curata da Lorenzo</Badge>
          <Link to="/regia" className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-0.5 text-xs text-muted-foreground hover:border-accent hover:text-accent transition">
            <Lock className="size-3" /> Regia Operatori
          </Link>
        </div>
        <h1 className="text-3xl font-bold md:text-4xl">Bandi & <span className="text-ember-gradient">Dossier IA</span></h1>
        {dossierVenduti > 0 && <p className="mt-2 text-xs font-semibold text-accent">🔥 {dossierVenduti} Dossier consegnati!</p>}
      </div>

      <section className="surface-panel mb-6 p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Radar className="size-5 text-accent" /> Radar Portali Attivi</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PORTALI.map((p) => (
            <div key={p.nome} className="rounded-md border border-border p-3">
              <p className="flex justify-between text-sm font-semibold">{p.nome}<span className="text-accent">{p.n} bandi</span></p>
              <p className="text-xs text-muted-foreground">{p.ambito}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="surface-panel p-5 md:p-7">
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-xs uppercase text-muted-foreground">
            {FASI.map((s, i) => <span key={s} className={i <= step ? "text-accent" : ""}>{i + 1}. {s}</span>)}
          </div>
          <Progress value={((step + 1) / FASI.length) * 100} className="h-1.5" />
        </div>

        {step === 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {profiliLocali.map((p: any) => (
              <button key={p.id} onClick={() => { setProfilo(p.id); setStep(1); }} className={card(profilo === p.id)}>
                <p className="font-semibold">{p.nome}</p>
                <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Input value={cercaQuartiere} onChange={(e) => setCercaQuartiere(e.target.value)} placeholder="Cerca quartiere..." className="bg-background" />
            <div className="flex flex-wrap gap-2">
              {quartieriFiltrati.map((q: string) => (
                <button key={q} onClick={() => { setQuartiere(q); setStep(2); }} className={`rounded-full border px-3.5 py-1.5 text-xs ${quartiere === q ? "border-primary bg-primary" : "border-border"}`}>{q}</button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setStep(0)}>Indietro</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {obiettiviLocali.map((o: any) => (
                <button key={o.id} onClick={() => setObiettivo(o.id)} className={card(obiettivo === o.id)}>
                  <p className="font-semibold">{o.nome}</p>
                </button>
              ))}
            </div>
            <div className="rounded-lg border border-dashed border-accent/60 p-4">
              <p className="mb-3 font-semibold"><Plus className="size-4 inline" /> Obiettivo Personalizzato</p>
              <Input className="bg-background mb-2" value={custom.titolo} onChange={(e) => setCustom({ ...custom, titolo: e.target.value })} placeholder="Titolo" />
              <Button size="sm" onClick={aggiungiCustom}>Aggiungi</Button>
            </div>
            <div className="flex gap-3"><Button variant="outline" onClick={() => setStep(1)}>Indietro</Button><Button disabled={!obiettivo} className="flex-1" onClick={() => setStep(3)}>Analizza</Button></div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center"><h2 className="text-2xl font-bold">Dossier Pronto</h2></div>
            {bandi.length === 0 ? (
              <div className="p-6 text-center border rounded-lg border-amber-500/40 bg-amber-500/10">
                <AlertCircle className="mx-auto mb-2 size-8 text-amber-400" />
                <p className="text-amber-400 font-semibold">Nessun bando diretto rilevato. Richiedi contatto gratuito.</p>
              </div>
            ) : (
              <div className="p-6 border rounded-xl bg-background flex justify-between items-center">
                <div><h3 className="font-bold">Dossier IA</h3><p className="text-xs text-muted-foreground">In 24/48h via email</p></div>
                <div className="text-right">
                  <div className="text-2xl font-black">€ {usaPunti && puoScontare ? prezzoScontato.toFixed(2) : prezzoPieno.toFixed(2)}</div>
                  {puoScontare && <div className="flex items-center gap-2 text-sm"><Checkbox id="pts" checked={usaPunti} onCheckedChange={(c) => setUsaPunti(c as boolean)} /><Label htmlFor="pts">Usa {costoPunti} pt (Sconto €5)</Label></div>}
                </div>
              </div>
            )}
            <div className="p-5 border rounded-xl bg-secondary/50">
              <Label className="font-bold text-accent">📧 Indirizzo Email (Obbligatorio)</Label>
              <Input type="email" value={emailDossier} onChange={(e) => setEmailDossier(e.target.value)} placeholder="tua@email.it" className="bg-background mt-2" />
            </div>
            <div className="flex gap-3"><Button variant="outline" onClick={() => setStep(2)}>Modifica</Button><Button className="flex-1" onClick={generaDossier}>Richiedi</Button></div>
          </div>
        )}
      </div>
    </div>
  );
}