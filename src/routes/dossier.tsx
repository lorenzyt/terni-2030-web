import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Radar, AlertCircle, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// Gestore errori nativo: se qualcosa esplode, stampa l'errore a schermo invece della pagina nera
export const Route = createFileRoute("/dossier")({
  component: DossierPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-red-500 font-bold bg-background h-screen flex flex-col justify-center items-center">
      <AlertCircle className="size-12 mb-4" />
      <h2 className="text-2xl mb-2">Errore di Rendering</h2>
      <p className="font-mono text-sm">{error.message}</p>
    </div>
  )
});

// DATI HARDCODED: Nessun import esterno fragile.
const FASI = ["Profilo", "Quartiere", "Obiettivo", "Dossier"];
const PROFILI = [
  { id: "cittadino", nome: "Cittadino / Famiglia", desc: "Bonus, energia, mobilità, welfare" },
  { id: "impresa", nome: "Impresa / Partita IVA", desc: "Fondi perduti, digitalizzazione, assunzioni" },
  { id: "pubblico", nome: "Ente / Terzo Settore", desc: "Rigenerazione, sociale, cultura" }
];
const QUARTIERI = ["Centro Storico", "Dalmazia", "Borgo Bovio", "Borgo Rivo", "Campitello", "Gabelletta", "Cesure", "Valenza", "Cospea", "Marmore", "Piediluco"];
const OBIETTIVI = [
  { id: "o1", nome: "Riqualificazione Urbana" },
  { id: "o2", nome: "Sostenibilità Energetica" },
  { id: "o3", nome: "Mobilità Sostenibile" },
  { id: "o7", nome: "Digitalizzazione & Innovazione" }
];

const PORTALI = [
  { nome: "Regione Umbria", n: 12, ambito: "FESR, FSE+, rigenerazione" },
  { nome: "Comune di Terni", n: 5, ambito: "Sfitti, commercio, sociale" },
  { nome: "GSE", n: 8, ambito: "Conto Termico, CER, fotovoltaico" },
  { nome: "PNRR", n: 4, ambito: "Transizione, inclusione, cultura" },
  { nome: "Invitalia", n: 6, ambito: "Nuove imprese, impianti, startup" },
  { nome: "Camera di Commercio", n: 3, ambito: "Digitale, voucher, export" }
];

function DossierPage() {
  // Parsing sicuro della ricerca
  const searchMatch = Route.useSearch() || {};
  const search = searchMatch as any;

  const [step, setStep] = useState(0);
  const [profilo, setProfilo] = useState("");
  const [quartiere, setQuartiere] = useState("");
  const [obiettivo, setObiettivo] = useState("");
  const [cercaQuartiere, setCercaQuartiere] = useState("");
  const [emailDossier, setEmailDossier] = useState("");
  const [usaPunti, setUsaPunti] = useState(false);
  const [customTitle, setCustomTitle] = useState("");

  useEffect(() => {
    if (search?.quartiere || search?.obiettivo) {
      if (search.quartiere) setQuartiere(search.quartiere);
      if (search.obiettivo) setObiettivo(search.obiettivo);
      setProfilo("cittadino");
      setStep((search.quartiere && search.obiettivo) ? 3 : 2);
    }
  }, [search]);

  const aggiungiCustom = () => {
    if (!customTitle.trim()) return toast.error("Dai un titolo al tuo obiettivo.");
    setObiettivo(customTitle);
    setCustomTitle("");
    toast.success("Obiettivo personalizzato aggiunto.");
  };

  const generaDossier = () => {
    if (!emailDossier || !emailDossier.includes("@")) return toast.error("Inserisci un'email valida.");
    toast.success(`Dossier richiesto! Ti contatteremo a breve all'indirizzo ${emailDossier}`);
  };

  const card = (sel: boolean) => `rounded-lg border p-4 text-left transition-colors ${sel ? "border-primary bg-secondary" : "border-border hover:bg-secondary/60"}`;
  const progressVal = ((step + 1) / FASI.length) * 100;
  const quartieriFiltrati = QUARTIERI.filter(q => q.toLowerCase().includes(cercaQuartiere.trim().toLowerCase()));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-8 text-center">
        <div className="mb-3 flex justify-center gap-2">
          <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
            Analisi IA · curata da Lorenzo
          </span>
          <Link to="/regia" className="inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs text-muted-foreground hover:border-accent hover:text-accent">
            <Lock className="size-3" /> Regia Operatori
          </Link>
        </div>
        <h1 className="text-3xl font-bold md:text-4xl">Bandi & <span className="text-ember-gradient">Dossier IA</span></h1>
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
            {FASI.map((s, i) => <span key={s} className={i <= step ? "text-accent font-bold" : ""}>{i + 1}. {s}</span>)}
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
             <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressVal}%` }}></div>
          </div>
        </div>

        {step === 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {PROFILI.map((p) => (
              <button key={p.id} onClick={() => { setProfilo(p.id); setStep(1); }} className={card(profilo === p.id)}>
                <p className="font-semibold">{p.nome}</p>
                <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <input type="text" value={cercaQuartiere} onChange={(e) => setCercaQuartiere(e.target.value)} placeholder="Cerca quartiere..." className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            <div className="flex flex-wrap gap-2">
              {quartieriFiltrati.map((q) => (
                <button key={q} onClick={() => { setQuartiere(q); setStep(2); }} className={`rounded-full border px-3.5 py-1.5 text-xs ${quartiere === q ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}>{q}</button>
              ))}
            </div>
            <button className="h-9 px-4 rounded-md border bg-background hover:bg-accent text-sm font-medium" onClick={() => setStep(0)}>Indietro</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {OBIETTIVI.map((o) => (
                <button key={o.id} onClick={() => setObiettivo(o.id)} className={card(obiettivo === o.id)}>
                  <p className="font-semibold">{o.nome}</p>
                </button>
              ))}
            </div>
            <div className="rounded-lg border border-dashed border-accent/60 p-4">
              <p className="mb-3 font-semibold"><Plus className="size-4 inline" /> Obiettivo Personalizzato</p>
              <input type="text" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm mb-2" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Titolo" />
              <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium" onClick={aggiungiCustom}>Aggiungi</button>
            </div>
            <div className="flex gap-3">
              <button className="h-9 px-4 rounded-md border bg-background hover:bg-accent text-sm font-medium" onClick={() => setStep(1)}>Indietro</button>
              <button disabled={!obiettivo} className="flex-1 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50" onClick={() => setStep(3)}>Analizza</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center"><h2 className="text-2xl font-bold">Dossier Pronto</h2></div>
            <div className="p-6 border rounded-xl bg-background flex justify-between items-center">
              <div><h3 className="font-bold">Dossier IA</h3><p className="text-xs text-muted-foreground">Consegna in 24/48h via email</p></div>
              <div className="text-right">
                <div className="text-2xl font-black">€ {usaPunti ? "9.90" : "14.90"}</div>
                <div className="flex items-center gap-2 text-sm mt-1 justify-end">
                  <input type="checkbox" id="pts" checked={usaPunti} onChange={(e) => setUsaPunti(e.target.checked)} className="h-4 w-4" />
                  <label htmlFor="pts">Usa 500 pt (Sconto €5)</label>
                </div>
              </div>
            </div>
            <div className="p-5 border rounded-xl bg-secondary/50">
              <label className="font-bold text-accent text-sm leading-none">📧 Indirizzo Email (Obbligatorio)</label>
              <input type="email" value={emailDossier} onChange={(e) => setEmailDossier(e.target.value)} placeholder="tua@email.it" className="mt-2 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
            </div>
            <div className="flex gap-3">
              <button className="h-9 px-4 rounded-md border bg-background hover:bg-accent text-sm font-medium" onClick={() => setStep(2)}>Modifica</button>
              <button className="flex-1 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium" onClick={generaDossier}>Richiedi</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
