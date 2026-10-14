import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Plus,
  CheckCircle2,
  Globe,
  Sparkles,
  Building2,
  HeartHandshake,
  FileText,
  ShieldCheck,
  Lock,
  ListChecks
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useCivic, registraDossierGenerato, COSTI_PREMI, nuovoId } from "@/lib/civic-store";
import { OBIETTIVI, PROFILI, QUARTIERI } from "@/lib/terni-data";
import bandiRealiJson from "@/lib/bandi_reali.json";

type DossierSearch = {
  quartiere?: string;
  obiettivo?: string;
  settore?: string;
};

export const Route = createFileRoute("/dossier")({
  validateSearch: (search: Record<string, unknown>): DossierSearch => ({
    quartiere: search.quartiere as string | undefined,
    obiettivo: search.obiettivo as string | undefined,
    settore: search.settore as string | undefined,
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

const FASI = ["1. Profilo Richiedente", "2. Quartiere di Terni", "3. Obiettivo / Ambito", "4. Anteprima Contenuti & Richiesta"];

function normKey(titolo: string): string {
  return String(titolo || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
}

const SDG_META: Record<string, { label: string; img: string }> = {
  o1: { label: "SDG 11 · Città Sostenibili & Rigenerazione", img: "/sdg/sdg-11.svg" },
  o2: { label: "SDG 7 & 13 · Energia Pulita & Clima", img: "/sdg/sdg-7.svg" },
  o3: { label: "SDG 11 & 13 · Mobilità Dolce & Sostenibile", img: "/sdg/sdg-13.svg" },
  o4: { label: "SDG 8 & 9 · Sviluppo Industriale & Lavoro", img: "/sdg/sdg-8.svg" },
  o5: { label: "SDG 8 · Commercio & Impresa Locale", img: "/sdg/sdg-8.svg" },
  o6: { label: "SDG 3 & 10 · Welfare, Salute, Cultura & Inclusione", img: "/sdg/sdg-3.svg" },
  o7: { label: "SDG 9 · Innovazione & Transizione Digitale 5.0", img: "/sdg/sdg-9.svg" },
};

const ASSI_WELFARE = [
  "Non Autosufficienza, Anziani & Caregiver",
  "Disabilità & Vita Indipendente",
  "Famiglia, Minori & Povertà Educativa",
  "Contrasto Povertà, Adulti Fragili & Housing",
  "Integrazione Socio-Sanitaria (DM 77/2022)",
  "Co-Progettazione Terzo Settore (Art. 55 CTS)",
  "Inclusione Lavorativa & Politiche Attive Fragili"
];

const PROFILI_WELFARE = [
  { id: "cittadino", nome: "Cittadino / Famiglia / Caregiver", desc: "Assegni di cura, assistenza domiciliare, disabilità, sostegni minori e abitare" },
  { id: "pubblico", nome: "Ente Terzo Settore (ETS / OdV / APS / Coop)", desc: "Co-progettazione Art. 55 CTS, bandi fondazioni, povertà educativa e inclusione" },
  { id: "impresa", nome: "Ente Pubblico / Zona Sociale / Struttura", desc: "Programmi integrati socio-sanitari, servizi territoriali e progetti d'ambito" }
];

const bandiArray = Array.isArray(bandiRealiJson) ? bandiRealiJson : [];

function DossierPage() {
  const search = Route.useSearch();

  const civic = useCivic() || ({} as any);
  const state = civic.state || {};
  const update = civic.update;
  const rawPunti = civic.puntiDisponibili;
  const user = civic.user;

  const [macroSettore, setMacroSettore] = useState<"citta" | "welfare">("citta");
  const [step, setStep] = useState(0);
  const [profilo, setProfilo] = useState("");
  const [quartiere, setQuartiere] = useState("");
  const [obiettivo, setObiettivo] = useState("");
  const [asseWelfareScelto, setAsseWelfareScelto] = useState("");
  const [cercaQuartiere, setCercaQuartiere] = useState("");
  const [custom, setCustom] = useState({ titolo: "", descrizione: "", area: "" });
  const [usaPunti, setUsaPunti] = useState(false);
  const [emailDossier, setEmailDossier] = useState("");
  const [noteCliente, setNoteCliente] = useState("");
  const [inviato, setInviato] = useState(false);

  const bandiAttivi = bandiArray.filter(
    (b: any) => state?.auditBandi?.[normKey(b.nome || b.titolo)]?.stato !== "Scartato"
  );
  const bandiCitta = bandiAttivi.filter((b: any) => b.categoria_macro !== "welfare");
  const bandiWelfare = bandiAttivi.filter((b: any) => b.categoria_macro === "welfare");

  const obiettiviLocali = Array.isArray(OBIETTIVI) ? OBIETTIVI : [];
  const profiliLocali = macroSettore === "welfare" ? PROFILI_WELFARE : (Array.isArray(PROFILI) ? PROFILI : []);
  const quartieriLocali = Array.isArray(QUARTIERI) ? QUARTIERI : [];

  const costoPunti = COSTI_PREMI?.sconto || 500;
  const saldo = typeof rawPunti === "number" ? rawPunti : typeof rawPunti === "function" ? rawPunti() : 0;
  const puoScontare = saldo >= costoPunti;
  const prezzoPieno = 14.90;
  const prezzoScontato = 9.90;

  // Matching silenzioso dei bandi (NON mostrati al cliente, ma inviati in Regia a Lorenzo)
  const bandiIndividuatiSegreti = (() => {
    if (macroSettore === "welfare" || obiettivo === "o6") {
      const perAsse = bandiWelfare.filter((b: any) => !asseWelfareScelto || b.asse_specifico === asseWelfareScelto);
      return (perAsse.length > 0 ? perAsse : bandiWelfare).slice(0, 6);
    }
    const perOb = bandiCitta.filter((b: any) => {
      if (!obiettivo) return true;
      return (b.obiettivo_id || b.obiettivo) === obiettivo;
    });
    return (perOb.length > 0 ? perOb : bandiCitta).slice(0, 6);
  })();

  const profiloNome = profiliLocali.find((p: any) => p.id === profilo)?.nome ?? (profilo || "Cittadino / Impresa");
  const obiettivoNome =
    macroSettore === "welfare" && asseWelfareScelto
      ? `Welfare: ${asseWelfareScelto}`
      : obiettiviLocali.find((o: any) => o.id === obiettivo)?.nome ?? (obiettivo || "Sviluppo e Rigenerazione");

  const quartieriFiltrati = quartieriLocali.filter(
    (q: any) => typeof q === "string" && q.toLowerCase().includes(cercaQuartiere.trim().toLowerCase())
  );

  useEffect(() => {
    if (user?.email && !emailDossier) {
      setEmailDossier(user.email);
    }
  }, [user, emailDossier]);

  useEffect(() => {
    if (search?.settore === "welfare" || search?.obiettivo === "o6") {
      setMacroSettore("welfare");
    } else if (search?.settore === "citta") {
      setMacroSettore("citta");
    }
    if (search?.quartiere || search?.obiettivo) {
      if (search.quartiere) setQuartiere(search.quartiere);
      if (search.obiettivo) setObiettivo(search.obiettivo);
      if (!profilo) setProfilo("cittadino");
      if (!quartiere && !search.quartiere) setQuartiere("Centro Storico");
      setStep(search.quartiere && search.obiettivo ? 3 : search.obiettivo ? 2 : 1);
    }
  }, [search]);

  const aggiungiCustom = () => {
    if (!custom.titolo.trim()) return toast.error("Descrivi brevemente il tuo obiettivo.");
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
    toast.success("Obiettivo specifico impostato.");
  };

  const generaDossier = async () => {
    if (!emailDossier || !emailDossier.includes("@")) {
      return toast.error("Inserisci un indirizzo email valido per essere ricontattato.");
    }
    toast.info("Elaborazione e invio in Regia per la supervisione...");
    try {
      await registraDossierGenerato({
        profilo: profiloNome,
        quartiere: quartiere || "Centro Storico",
        obiettivo: noteCliente ? `${obiettivoNome} (${noteCliente.trim()})` : obiettivoNome,
        settore: macroSettore,
        email: emailDossier.trim(),
        sconto_punti: usaPunti && puoScontare,
        prezzo_applicato: usaPunti && puoScontare ? prezzoScontato : prezzoPieno,
        azione: "Dossier Inviato in Regia (In attesa di supervisione)",
        bandi: bandiIndividuatiSegreti.map((b: any) => ({ nome: b.nome || b.titolo, ente: b.ente || b.portale })),
        bandi_completi: bandiIndividuatiSegreti
      });
      if (usaPunti && puoScontare && typeof update === "function") {
        update((s: any) => ({ ...s, puntiSpesi: (s.puntiSpesi || 0) + costoPunti }));
      }
      setInviato(true);
      toast.success("Richiesta inviata! Il tuo Dossier ? ora in verifica da parte di Lorenzo.");
    } catch (err: any) {
      toast.error(`Errore: ${err.message}`);
    }
  };

  const card = (sel: boolean) =>
    `rounded-xl border p-4 text-left transition-all hover-lift ${
      sel ? "border-primary bg-secondary shadow-md" : "border-border hover:bg-secondary/60"
    }`;
  const progressVal = ((step + 1) / FASI.length) * 100;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 animate-fade-up">
      {/* HEADER */}
      <div className="mb-8 text-center">
        <div className="mb-3 flex flex-wrap justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1 text-xs font-semibold text-accent">
            <ShieldCheck className="size-3.5" /> Servizio di Consulenza & Dossier Bandi su Misura · Supervisionato da Lorenzo
          </span>
        </div>
        <h1 className="text-3xl font-bold md:text-4xl">
          Configura il tuo <span className="text-ember-gradient">Dossier Bandi IA</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
          Seleziona il tuo profilo, il quartiere di Terni e l'obiettivo del tuo progetto. Il nostro motore incrocia le misure regionali, nazionali ed europee attive e prepara il tuo Dossier operativo.
        </p>
      </div>

      {/* SCELTA MACRO-AMBITO: CITTA & IMPRESE VS WELFARE & SOCIALE */}
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <button
          onClick={() => {
            setMacroSettore("citta");
            setAsseWelfareScelto("");
          }}
          className={`p-5 rounded-2xl border text-left transition-all hover-lift ${
            macroSettore === "citta" ? "border-sky-400 bg-sky-500/10 shadow-md" : "border-border bg-secondary/20 hover:bg-secondary/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-sky-400 flex items-center gap-1.5">
              <Building2 className="size-4" /> Linea 1 · Finanziamenti Città, Imprese & Energia
            </span>
            <span className="text-xs font-semibold text-muted-foreground">{bandiCitta.length} misure monitorate</span>
          </div>
          <div className="text-lg font-bold mt-1.5">Imprese, Commercio, Fotovoltaico, CER & Rigenerazione</div>
          <p className="text-xs text-muted-foreground mt-1">
            Contributi tra <b>€ 5.000 e € 150.000+</b> per aperture attività, locali sfitti, efficientamento energetico, innovazione digitale e riqualificazione.
          </p>
        </button>

        <button
          onClick={() => {
            setMacroSettore("welfare");
            setObiettivo("o6");
          }}
          className={`p-5 rounded-2xl border text-left transition-all hover-lift ${
            macroSettore === "welfare" ? "border-rose-400 bg-rose-500/10 shadow-md" : "border-border bg-secondary/20 hover:bg-secondary/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-rose-400 flex items-center gap-1.5">
              <HeartHandshake className="size-4" /> Linea 2 · Welfare, Famiglie & Terzo Settore
            </span>
            <span className="text-xs font-semibold text-muted-foreground">{bandiWelfare.length} misure monitorate</span>
          </div>
          <div className="text-lg font-bold mt-1.5">Politiche Sociali, Disabilità, Caregiver, Minori & ETS</div>
          <p className="text-xs text-muted-foreground mt-1">
            Assegni di cura, assistenza domiciliare, Vita Indipendente, bandi per Associazioni/ETS (Art. 55 CTS) e progetti socio-educativi.
          </p>
        </button>
      </div>

      {/* CONFIGURATORE GUIDATO IN 4 FASI */}
      <div id="configuratore-dossier" className="surface-panel p-6 md:p-8 border rounded-2xl shadow-lg">
        <div className="mb-6">
          <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs uppercase text-muted-foreground">
            {FASI.map((s, i) => (
              <span key={s} className={i <= step ? "text-accent font-bold" : ""}>
                {s}
              </span>
            ))}
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressVal}%` }}></div>
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Chi richiede il Dossier?</h2>
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
                  <p className="font-bold">{p.nome}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">In quale quartiere o zona di Terni si colloca il progetto/esigenza?</h2>
            <input
              type="text"
              value={cercaQuartiere}
              onChange={(e) => setCercaQuartiere(e.target.value)}
              placeholder="Cerca uno dei 36 quartieri di Terni (es. Centro Storico, Borgo Rivo, Polymer, Cesi)..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            />
            <div className="flex flex-wrap gap-2">
              {quartieriFiltrati.map((q: string) => (
                <button
                  key={q}
                  onClick={() => {
                    setQuartiere(q);
                    setStep(2);
                  }}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
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
              ← Indietro
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold">
              Qual è l'obiettivo prioritario ({macroSettore === "welfare" ? "Area Welfare & Sociale" : "Area Città, Imprese & Energia"})?
            </h2>

            {macroSettore === "welfare" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {ASSI_WELFARE.map((asse) => (
                  <button
                    key={asse}
                    onClick={() => {
                      setAsseWelfareScelto(asse);
                      setObiettivo("o6");
                    }}
                    className={card(asseWelfareScelto === asse)}
                  >
                    <div className="flex items-center gap-3">
                      <img src="/sdg/sdg-3.svg" alt="Welfare SDG" className="w-11 h-11 rounded-md shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">{asse}</p>
                        <p className="text-xs text-rose-400 mt-0.5">SDG 3 & 10 · Welfare & Inclusione</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {obiettiviLocali.map((o: any) => {
                  const sdg = SDG_META[o.id];
                  return (
                    <button key={o.id} onClick={() => setObiettivo(o.id)} className={card(obiettivo === o.id)}>
                      <div className="flex items-center gap-3">
                        {sdg && (
                          <img src={sdg.img} alt={sdg.label} className="w-12 h-12 rounded-md shrink-0 shadow-sm" />
                        )}
                        <div>
                          <p className="font-semibold">{o.nome}</p>
                          {sdg && <p className="text-xs text-accent mt-0.5 font-medium">{sdg.label}</p>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="rounded-xl border border-dashed border-accent/60 p-4 bg-secondary/20">
              <p className="mb-2 text-sm font-semibold">
                <Plus className="size-4 inline text-accent" /> Hai un progetto o una necessità specifica? Descrivila qui (Opzionale):
              </p>
              <input
                type="text"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm mb-2"
                value={noteCliente}
                onChange={(e) => setNoteCliente(e.target.value)}
                placeholder="Es. Vorrei aprire un laboratorio artigiano in centro / Cerco contributi per assistenza familiare..."
              />
            </div>

            <div className="flex gap-3">
              <button
                className="h-10 px-4 rounded-md border bg-background hover:bg-accent text-sm font-medium"
                onClick={() => setStep(1)}
              >
                ← Indietro
              </button>
              <button
                disabled={!obiettivo && !asseWelfareScelto}
                className="flex-1 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
                onClick={() => setStep(3)}
              >
                Verifica Fattibilità & Contenuti del Dossier →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            {/* ESITO DI FATTIBILITA SENZA SPOILER DEI BANDI */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5">
              <div className="flex items-center gap-3.5">
                <img
                  src={SDG_META[obiettivo]?.img || "/sdg/sdg-11.svg"}
                  alt="SDG"
                  className="w-14 h-14 rounded-lg shadow-sm shrink-0"
                />
                <div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 uppercase">
                    <CheckCircle2 className="size-4" /> Analisi Preliminare Positiva · {quartiere || "Terni"}
                  </span>
                  <h2 className="text-xl font-bold mt-0.5">
                    Individuate <span className="text-accent">{bandiIndividuatiSegreti.length} Misure Agevolative Compatibili</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Profilo: <b>{profiloNome}</b> · Ambito: <b>{obiettivoNome}</b>
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="inline-flex items-center gap-1 rounded-full bg-background/80 border border-border px-3 py-1 text-xs font-bold text-accent">
                  <Lock className="size-3" /> Bandi Riservati nel Dossier
                </span>
              </div>
            </div>

            {/* COSA CONTIENE IL DOSSIER TESTUALE (NESSUNO SPOILER DEI NOMI DEI BANDI) */}
            <div className="rounded-xl border border-border bg-secondary/30 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ListChecks className="size-5 text-accent" /> Cosa conterrà il tuo Dossier Operativo Personalizzato
                </h3>
                <span className="text-xs font-semibold text-muted-foreground">Documento Testuale Completo</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Il Dossier viene generato dal sistema e <b>sottoposto alla revisione tecnica di Lorenzo</b> prima dell'invio, per garantirti solo misure realmente attivabili per il tuo caso specifico. Ecco l'indice dei contenuti che riceverai:
              </p>

              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-lg border border-border bg-background/70 p-3.5">
                  <b className="text-accent block mb-1">1. Elenco Ufficiale delle {bandiIndividuatiSegreti.length} Misure Compatibili</b>
                  Titolo esatto dei bandi individuati, Ente erogatore (Regione, Comune, GSE, Invitalia, FSE+/MLPS) e riferimenti normativi.
                </div>
                <div className="rounded-lg border border-border bg-background/70 p-3.5">
                  <b className="text-accent block mb-1">2. Importi, Percentuali a Fondo Perduto e Cumulabilità</b>
                  Dettaglio delle quote a fondo perduto, finanziamenti a tasso zero, massimali di spesa e possibilità di cumulo tra più fondi.
                </div>
                <div className="rounded-lg border border-border bg-background/70 p-3.5">
                  <b className="text-accent block mb-1">3. Requisiti di Accesso e Spese Ammissibili</b>
                  Elenco chiaro di cosa puoi finanziare (opere, impianti, attrezzature, affitti, servizi o voucher) nel quartiere <b>{quartiere || "scelto"}</b>.
                </div>
                <div className="rounded-lg border border-border bg-background/70 p-3.5">
                  <b className="text-accent block mb-1">4. Checklist Documentale, Scadenze e Link Diretti</b>
                  Lista passo-passo dei documenti da preparare, tempistiche di apertura sportello e link diretti alle piattaforme ufficiali di domanda.
                </div>
              </div>
            </div>

            {/* BOX PREZZO E MODELLO CONCIERGE */}
            <div className="p-6 border border-accent/40 rounded-xl bg-background flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 uppercase mb-1">
                  <Sparkles className="size-3.5" /> Supervisione Umana in Regia · Nessun Pagamento Automatico sul Sito
                </span>
                <h3 className="font-bold text-lg">Richiedi la Verifica e Preparazione del Dossier</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                  Inserendo la tua email, la richiesta viene registrata nella Regia di Lorenzo. Verificheremo la bontà dei {bandiIndividuatiSegreti.length} bandi per il tuo caso e ti contatteremo via email con il riepilogo e le istruzioni per ricevere il Dossier completo (tramite PayPal o Bonifico diretto).
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="text-xs text-muted-foreground">Costo del Dossier Completo</div>
                <div className="text-2xl font-black text-accent">
                  € {usaPunti && puoScontare ? prezzoScontato.toFixed(2) : prezzoPieno.toFixed(2)}
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold">Paghi solo dopo il contatto di conferma</div>
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
                <h3 className="text-lg font-bold text-emerald-400">Dossier generato e inviato in Regia per la supervisione!</h3>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                  Lorenzo ha ricevuto il tuo Dossier preliminare con le {bandiIndividuatiSegreti.length} misure individuate. A breve riceverai una comunicazione all'indirizzo <b>{emailDossier}</b>.
                </p>
              </div>
            ) : (
              <div className="p-5 border rounded-xl bg-secondary/50">
                <label htmlFor="dossierEmail" className="font-bold text-accent text-sm leading-none">
                  📧 Il tuo Indirizzo Email (Obbligatorio per ricevere il contatto da Lorenzo)
                </label>
                <input
                  id="dossierEmail"
                  type="email"
                  value={emailDossier}
                  onChange={(e) => setEmailDossier(e.target.value)}
                  placeholder="tua@email.it"
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
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
                ← Modifica Scelte
              </button>
              {!inviato && (
                <button
                  className="flex-1 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90"
                  onClick={generaDossier}
                >
                  Invia Richiesta Dossier in Regia →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
