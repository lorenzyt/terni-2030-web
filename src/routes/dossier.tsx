import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Radar, AlertCircle, Plus, CheckCircle2, Globe, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useCivic, registraDossierGenerato, COSTI_PREMI, nuovoId } from "@/lib/civic-store";
import { OBIETTIVI, PROFILI, QUARTIERI } from "@/lib/terni-data";
import bandiRealiJson from "@/lib/bandi_reali.json";

type DossierSearch = {
  quartiere?: string;
  obiettivo?: string;
};

export const Route = createFileRoute("/dossier")({
  validateSearch: (search: Record<string, unknown>): DossierSearch => ({
    quartiere: search.quartiere as string | undefined,
    obiettivo: search.obiettivo as string | undefined,
  }),
  component: DossierPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-red-500 font-bold bg-background h-screen flex flex-col justify-center items-center text-center">
      <AlertCircle className="size-12 mb-4" />
      <h2 className="text-2xl mb-2">Errore di Rendering</h2>
      <p className="font-mono text-sm">{error.message}</p>
    </div>
  )
});

const FASI = ["Profilo", "Quartiere", "Obiettivo & SDG", "Dossier IA"];
function normKey(titolo: string): string {
  return String(titolo || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
}

const SDG_MAP: Record<string, string> = {
  o1: "SDG 11 · Città Sostenibili & Rigenerazione",
  o2: "SDG 7 & 13 · Energia Pulita & Clima",
  o3: "SDG 11 · Mobilità Dolce & Sostenibile",
  o4: "SDG 8 & 9 · Sviluppo Industriale & Lavoro",
  o5: "SDG 8 · Commercio & Impresa Locale",
  o6: "SDG 3 & 10 · Welfare, Salute, Cultura & Inclusione",
  o7: "SDG 9 · Innovazione & Transizione Digitale 5.0",
};

const bandiArray = Array.isArray(bandiRealiJson) ? bandiRealiJson : [];
const contaPerPortale = (chiavi: string[]) =>
  bandiArray.filter((b: any) => {
    const p = (b.portale || b.ente || "").toLowerCase();
    return chiavi.some((k) => p.includes(k.toLowerCase()));
  }).length;

const PORTALI = [
  { nome: "Regione Umbria & FESR/FSE+", n: contaPerPortale(["Regione Umbria", "FESR", "FSE", "FSC"]), ambito: "PR FESR, PR FSE+, Welfare e Coesione" },
  { nome: "Comune di Terni & Carit", n: contaPerPortale(["Comune di Terni", "Carit"]), ambito: "Sfitti, commercio, cultura, sociale" },
  { nome: "GSE & Clima", n: contaPerPortale(["GSE"]), ambito: "Conto Termico 3.0, CER, fotovoltaico" },
  { nome: "PNRR & Welfare Nazionale", n: contaPerPortale(["PNRR", "MLPS", "INPS"]), ambito: "Transizione 5.0, M5C2 Inclusione, M6 Salute" },
  { nome: "Invitalia & MIMIT", n: contaPerPortale(["Invitalia"]), ambito: "Nuove imprese ON, Smart&Start, Sviluppo" },
  { nome: "Camera di Commercio", n: contaPerPortale(["Camera di Commercio"]), ambito: "Voucher digitali I4.0, doppia transizione" }
];

function DossierPage() {
  const search = Route.useSearch();

  const civic = useCivic() || ({} as any);
  const state = civic.state || {};
  const update = civic.update;
  const rawPunti = civic.puntiDisponibili;
  const user = civic.user;

  const [step, setStep] = useState(0);
  const [profilo, setProfilo] = useState("");
  const [quartiere, setQuartiere] = useState("");
  const [obiettivo, setObiettivo] = useState("");
  const [cercaQuartiere, setCercaQuartiere] = useState("");
  const [custom, setCustom] = useState({ titolo: "", descrizione: "", area: "" });
  const [usaPunti, setUsaPunti] = useState(false);
  const [emailDossier, setEmailDossier] = useState("");
  const [inviato, setInviato] = useState(false);

  const obiettiviLocali = Array.isArray(OBIETTIVI) ? OBIETTIVI : [];
  const profiliLocali = Array.isArray(PROFILI) ? PROFILI : [];
  const quartieriLocali = Array.isArray(QUARTIERI) ? QUARTIERI : [];

  const obCustom = Array.isArray(state?.obiettiviCommunity)
    ? state.obiettiviCommunity.find((o: any) => o.id === obiettivo)
    : undefined;

  const costoPunti = COSTI_PREMI?.sconto || 500;
  // Supporta sia numero diretto che eventuale funzione
  const saldo = typeof rawPunti === "number" ? rawPunti : typeof rawPunti === "function" ? rawPunti() : 0;
  const puoScontare = saldo >= costoPunti;
  const prezzoPieno = 14.90;
  const prezzoScontato = 9.90;

  const dossierTotali = Array.isArray(state?.dossierGenerati) ? state.dossierGenerati.length : 0;

  const bandiGrezzi = bandiArray.filter((b: any) => {
    if (!obiettivo) return false;
    const obId = b.obiettivo_id || b.obiettivo;
    const matchObiettivo = obId === obiettivo;
    const matchProfilo = !profilo || !Array.isArray(b.ambiti) || b.ambiti.includes(profilo);
    return matchObiettivo && matchProfilo;
  });

  const bandiFallback = bandiGrezzi.length > 0
    ? bandiGrezzi
    : bandiArray.filter((b: any) => (b.obiettivo_id || b.obiettivo) === obiettivo);

  const bandi = bandiFallback
    .filter((b: any) => state?.auditBandi?.[normKey(b.nome || b.titolo)]?.stato !== "Scartato")
    .slice(0, 6);

  const profiloNome = profiliLocali.find((p: any) => p.id === profilo)?.nome ?? (profilo || "Cittadino / Impresa");
  const obiettivoNome = obCustom?.titolo ?? obiettiviLocali.find((o: any) => o.id === obiettivo)?.nome ?? obiettivo;
  const quartieriFiltrati = quartieriLocali.filter(
    (q: any) => typeof q === "string" && q.toLowerCase().includes(cercaQuartiere.trim().toLowerCase())
  );

  useEffect(() => {
    if (user?.email && !emailDossier) {
      setEmailDossier(user.email);
    }
  }, [user, emailDossier]);

  useEffect(() => {
    if (search?.quartiere || search?.obiettivo) {
      if (search.quartiere) setQuartiere(search.quartiere);
      if (search.obiettivo) setObiettivo(search.obiettivo);
      if (!profilo) setProfilo("cittadino");
      if (!quartiere && !search.quartiere) setQuartiere("Centro Storico");
      setStep(search.quartiere && search.obiettivo ? 3 : search.obiettivo ? 3 : 2);
    }
  }, [search]);

  const aggiungiCustom = () => {
    if (!custom.titolo.trim()) return toast.error("Dai un titolo al tuo obiettivo.");
    const idGenerato = typeof nuovoId === "function" ? nuovoId("oc") : `oc_${Date.now()}`;
    const nuovo = {
      id: idGenerato,
      titolo: custom.titolo.trim(),
      descrizione: custom.descrizione.trim(),
      area: custom.area || quartiere || "Centro Storico"
    };
    if (typeof update === "function") {
      update((s: any) => ({ ...s, obiettiviCommunity: [...(s.obiettiviCommunity || []), nuovo] }));
    }
    setObiettivo(nuovo.id);
    setCustom({ titolo: "", descrizione: "", area: "" });
    toast.success("Obiettivo personalizzato aggiunto.");
  };

  const generaDossier = async () => {
    if (!emailDossier || !emailDossier.includes("@")) {
      return toast.error("Inserisci un indirizzo email valido per ricevere l'anteprima.");
    }
    toast.info("Elaborazione richiesta Dossier in corso...");
    try {
      if (typeof registraDossierGenerato === "function") {
        await registraDossierGenerato({
          profilo: profiloNome,
          quartiere: quartiere || "Centro Storico",
          obiettivo: obiettivoNome,
          email: emailDossier.trim(),
          sconto_punti: usaPunti && puoScontare,
          prezzo_applicato: usaPunti && puoScontare ? prezzoScontato : prezzoPieno,
          azione: bandi.length > 0 ? "Anteprima Concierge Richiesta" : "Ricerca Personalizzata Richiesta",
          bandi: bandi.map((b: any) => ({ nome: b.nome || b.titolo, ente: b.ente || b.portale }))
        });
      }
      if (usaPunti && puoScontare && typeof update === "function") {
        update((s: any) => ({ ...s, puntiSpesi: (s.puntiSpesi || 0) + costoPunti }));
      }
      setInviato(true);
      toast.success("Richiesta registrata! Riceverai l'anteprima gratuita all'indirizzo " + emailDossier);
    } catch (err: any) {
      toast.error(`Errore: ${err.message}`);
    }
  };

  const card = (sel: boolean) =>
    `rounded-lg border p-4 text-left transition-colors ${sel ? "border-primary bg-secondary" : "border-border hover:bg-secondary/60"}`;
  const progressVal = ((step + 1) / FASI.length) * 100;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-8 text-center">
        <div className="mb-3 flex flex-wrap justify-center gap-2">
          <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
            Analisi IA + Revisione Umana · curata da Lorenzo
          </span>
          <Link
            to="/regia"
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-0.5 text-xs text-muted-foreground hover:border-accent hover:text-accent transition"
          >
            <Lock className="size-3" /> Regia Operatori
          </Link>
        </div>
        <h1 className="text-3xl font-bold md:text-4xl">
          Bandi & <span className="text-ember-gradient">Dossier IA</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
          Incrocia i {bandiArray.length} bandi regionali, nazionali ed europei con il tuo progetto a Terni e gli obiettivi dell'Agenda 2030.
        </p>
        {dossierTotali > 0 && (
          <p className="mt-2 text-xs font-semibold text-accent">🔥 {dossierTotali} Dossier già elaborati per il territorio!</p>
        )}
      </div>

      <section className="surface-panel mb-6 p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Radar className="size-5 text-accent" /> Radar Canali di Finanziamento Attivi ({bandiArray.length} Bandi nel Pool)
        </h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PORTALI.map((p) => (
            <div key={p.nome} className="rounded-md border border-border p-3">
              <p className="flex justify-between text-sm font-semibold">
                {p.nome}
                <span className="text-accent">{p.n} bandi</span>
              </p>
              <p className="text-xs text-muted-foreground">{p.ambito}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="surface-panel p-5 md:p-7">
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-xs uppercase text-muted-foreground">
            {FASI.map((s, i) => (
              <span key={s} className={i <= step ? "text-accent font-bold" : ""}>
                {i + 1}. {s}
              </span>
            ))}
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressVal}%` }}></div>
          </div>
        </div>

        {step === 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {profiliLocali.map((p: any) => (
              <button
                key={p.id}
                onClick={() => {
                  setProfilo(p.id);
                  setStep(1);
                }}
                className={card(profilo === p.id)}
              >
                <p className="font-semibold">{p.nome}</p>
                <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <input
              type="text"
              value={cercaQuartiere}
              onChange={(e) => setCercaQuartiere(e.target.value)}
              placeholder="Cerca uno dei 36 quartieri di Terni..."
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <div className="flex flex-wrap gap-2">
              {quartieriFiltrati.map((q: string) => (
                <button
                  key={q}
                  onClick={() => {
                    setQuartiere(q);
                    setStep(2);
                  }}
                  className={`rounded-full border px-3.5 py-1.5 text-xs ${
                    quartiere === q ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
            <button
              className="h-9 px-4 rounded-md border bg-background hover:bg-accent text-sm font-medium"
              onClick={() => setStep(0)}
            >
              Indietro
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {obiettiviLocali.map((o: any) => (
                <button key={o.id} onClick={() => setObiettivo(o.id)} className={card(obiettivo === o.id)}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{o.nome}</p>
                    {SDG_MAP[o.id] && (
                      <span className="text-[10px] font-bold text-accent uppercase">{SDG_MAP[o.id].split("·")[0]}</span>
                    )}
                  </div>
                  {SDG_MAP[o.id] && <p className="text-xs text-muted-foreground mt-1">{SDG_MAP[o.id]}</p>}
                </button>
              ))}
            </div>
            <div className="rounded-lg border border-dashed border-accent/60 p-4">
              <p className="mb-3 font-semibold">
                <Plus className="size-4 inline" /> Obiettivo Personalizzato (Progetto Specifico)
              </p>
              <input
                type="text"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm mb-2"
                value={custom.titolo}
                onChange={(e) => setCustom({ ...custom, titolo: e.target.value })}
                placeholder="Descrivi il tuo obiettivo (es. Riapertura locale artigiano, Impianto fotovoltaico, Co-progettazione Welfare)"
              />
              <button
                className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium"
                onClick={aggiungiCustom}
              >
                Aggiungi Obiettivo
              </button>
            </div>
            <div className="flex gap-3">
              <button
                className="h-9 px-4 rounded-md border bg-background hover:bg-accent text-sm font-medium"
                onClick={() => setStep(1)}
              >
                Indietro
              </button>
              <button
                disabled={!obiettivo}
                className="flex-1 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                onClick={() => setStep(3)}
              >
                Analizza Compatibilità Bandi →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-accent uppercase">
                  <Globe className="size-3.5" /> {SDG_MAP[obiettivo] || "Allineamento Strategico Agenda 2030"}
                </span>
                <h2 className="text-2xl font-bold mt-0.5">
                  Risultato Preliminare · {quartiere || "Terni"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Profilo: <b>{profiloNome}</b> · Obiettivo: <b>{obiettivoNome}</b>
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                {bandi.length} Misure Rilevate
              </span>
            </div>

            {bandi.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Bandi e Linee di Finanziamento Individuate per il tuo Dossier:
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {bandi.map((b: any) => (
                    <div key={b.id || b.titolo} className="rounded-lg border border-border bg-background/60 p-3.5 text-left">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-accent font-semibold">
                        <span>{b.portale || b.ente}</span>
                        <span>{b.scadenza || "Attivo"}</span>
                      </div>
                      <p className="font-bold text-sm mt-1 line-clamp-2">{b.titolo || b.nome}</p>
                      <p className="text-xs text-muted-foreground mt-1">{b.importo || "Contributo / Agevolazione"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-6 border border-accent/40 rounded-xl bg-background flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 uppercase mb-1">
                  <Sparkles className="size-3.5" /> Servizio Concierge MVP · Zero Pagamenti Anticipati
                </span>
                <h3 className="font-bold text-lg">Dossier Operativo Personalizzato (PDF)</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                  Ricevi l'<b>anteprima gratuita</b> e la verifica di fattibilità di Lorenzo entro 24/48h via email. Deciderai se sbloccare il Dossier completo (tramite PayPal o Bonifico diretto, senza commissioni) solo dopo aver visto l'anteprima.
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="text-xs text-muted-foreground">Valore sblocco completo</div>
                <div className="text-2xl font-black text-accent">
                  € {usaPunti && puoScontare ? prezzoScontato.toFixed(2) : prezzoPieno.toFixed(2)}
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold">Oggi € 0,00 (Anteprima Gratuita)</div>
                {puoScontare ? (
                  <div className="flex items-center gap-2 text-xs mt-2 sm:justify-end">
                    <input
                      type="checkbox"
                      id="pts"
                      checked={usaPunti}
                      onChange={(e) => setUsaPunti(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="pts" className="font-semibold text-accent cursor-pointer">
                      Usa {costoPunti} pt Esploratore (-€5,00)
                    </label>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Hai {saldo} pt su {costoPunti} per lo sconto €5
                  </p>
                )}
              </div>
            </div>

            {inviato ? (
              <div className="p-6 border border-emerald-500/40 rounded-xl bg-emerald-500/10 text-center space-y-2">
                <CheckCircle2 className="mx-auto size-10 text-emerald-400" />
                <h3 className="text-lg font-bold text-emerald-400">Richiesta registrata con successo!</h3>
                <p className="text-sm text-muted-foreground">
                  Lorenzo ha ricevuto i parametri del tuo progetto e ti invierà l'anteprima gratuita all'indirizzo <b>{emailDossier}</b>.
                </p>
              </div>
            ) : (
              <div className="p-5 border rounded-xl bg-secondary/50">
                <label htmlFor="dossierEmail" className="font-bold text-accent text-sm leading-none">
                  📧 Indirizzo Email per ricevere l'Anteprima Gratuita (Obbligatorio)
                </label>
                <input
                  id="dossierEmail"
                  type="email"
                  value={emailDossier}
                  onChange={(e) => setEmailDossier(e.target.value)}
                  placeholder="tua@email.it"
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                className="h-10 px-4 rounded-md border bg-background hover:bg-accent text-sm font-medium"
                onClick={() => {
                  setInviato(false);
                  setStep(2);
                }}
              >
                Modifica Parametri
              </button>
              {!inviato && (
                <button
                  className="flex-1 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90"
                  onClick={generaDossier}
                >
                  Richiedi Anteprima Gratuita (Senza Impegno) →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
