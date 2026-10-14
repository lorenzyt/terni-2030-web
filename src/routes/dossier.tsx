import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Lock,
  Radar,
  AlertCircle,
  Plus,
  CheckCircle2,
  Globe,
  Sparkles,
  Building2,
  HeartHandshake,
  Search,
  ExternalLink,
  Clock,
  Filter
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useCivic, registraDossierGenerato, COSTI_PREMI, nuovoId } from "@/lib/civic-store";
import { OBIETTIVI, PROFILI, QUARTIERI } from "@/lib/terni-data";
import bandiRealiJson from "@/lib/bandi_reali.json";
import syncMetaJson from "@/lib/sync_meta.json";

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

const FASI = ["Profilo", "Quartiere / Ambito", "Obiettivo & Asse", "Dossier IA"];

function normKey(titolo: string): string {
  return String(titolo || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
}

function stimaValoreBando(b: any): number {
  if (typeof b?.valore_stimato_euro === "number" && b.valore_stimato_euro > 0) {
    return b.valore_stimato_euro;
  }
  return b?.semaforo === "verde" ? 350000 : 95000;
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

const ASSI_CITTA = [
  "Rigenerazione Urbana & Spazi",
  "Energia, CER & Clima",
  "Mobilità Dolce & Elettrica",
  "Sviluppo Industriale & Lavoro",
  "Commercio & Nuove Imprese",
  "Digitale & Transizione 5.0"
];

const PROFILI_WELFARE = [
  { id: "cittadino", nome: "Cittadino / Famiglia / Caregiver", desc: "Assegni di cura, Home Care Premium, disabilità, bonus minori e abitare" },
  { id: "pubblico", nome: "Ente Terzo Settore (ETS / OdV / APS / Coop)", desc: "Co-progettazione Art. 55 CTS, bandi Carit, DesTEENazione, Povertà Educativa" },
  { id: "impresa", nome: "Comune / Zona Sociale (ATS) / Distretto USL", desc: "Fondi PNRR M5C2 e M6, FNA, Quota Servizi Fondo Povertà, LEPS e PUA" }
];

const bandiArray = Array.isArray(bandiRealiJson) ? bandiRealiJson : [];
const syncMeta: any = syncMetaJson || {};

function DossierPage() {
  const search = Route.useSearch();

  const civic = useCivic() || ({} as any);
  const state = civic.state || {};
  const update = civic.update;
  const rawPunti = civic.puntiDisponibili;
  const user = civic.user;

  // Modalita attiva: "tutti" | "citta" | "welfare"
  const [macroSettore, setMacroSettore] = useState<"tutti" | "citta" | "welfare">("tutti");

  // Ricerca Diretta Bandi (Funziona sia per Citta sia per Welfare!)
  const [queryRicerca, setQueryRicerca] = useState("");
  const [filtroAsse, setFiltroAsse] = useState("");
  const [filtroAmbito, setFiltroAmbito] = useState("");
  const [filtroCanale, setFiltroCanale] = useState("");
  const [bandoSelezionato, setBandoSelezionato] = useState<any | null>(null);

  // Stati Configuratore Dossier
  const [step, setStep] = useState(0);
  const [profilo, setProfilo] = useState("");
  const [quartiere, setQuartiere] = useState("");
  const [obiettivo, setObiettivo] = useState("");
  const [asseWelfareScelto, setAsseWelfareScelto] = useState("");
  const [cercaQuartiere, setCercaQuartiere] = useState("");
  const [custom, setCustom] = useState({ titolo: "", descrizione: "", area: "" });
  const [usaPunti, setUsaPunti] = useState(false);
  const [emailDossier, setEmailDossier] = useState("");
  const [inviato, setInviato] = useState(false);

  const bandiAttivi = bandiArray.filter(
    (b: any) => state?.auditBandi?.[normKey(b.nome || b.titolo)]?.stato !== "Scartato"
  );

  const bandiCitta = bandiAttivi.filter((b: any) => b.categoria_macro !== "welfare");
  const bandiWelfare = bandiAttivi.filter((b: any) => b.categoria_macro === "welfare");

  const valoreCitta = bandiCitta.reduce((acc: number, b: any) => acc + stimaValoreBando(b), 0);
  const valoreWelfare = bandiWelfare.reduce((acc: number, b: any) => acc + stimaValoreBando(b), 0);
  const fmtEuro = (val: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);

  // Filtraggio in tempo reale per il Motore di Ricerca Bandi (Citta + Welfare)
  const bandiRicercaRisultati = bandiAttivi.filter((b: any) => {
    const cat = b.categoria_macro || "citta";
    if (macroSettore !== "tutti" && cat !== macroSettore) return false;
    if (filtroAsse && (b.asse_specifico || "") !== filtroAsse) return false;
    if (filtroAmbito && Array.isArray(b.ambiti) && !b.ambiti.includes(filtroAmbito)) return false;
    if (filtroCanale && !`${b.portale || ""} ${b.ente || ""}`.toLowerCase().includes(filtroCanale.toLowerCase())) return false;
    if (queryRicerca.trim()) {
      const q = queryRicerca.toLowerCase();
      const corpo = `${b.titolo || ""} ${b.descrizione || ""} ${b.portale || ""} ${b.ente || ""} ${b.asse_specifico || ""} ${b.importo || ""}`.toLowerCase();
      if (!corpo.includes(q)) return false;
    }
    return true;
  });

  const obiettiviLocali = Array.isArray(OBIETTIVI) ? OBIETTIVI : [];
  const profiliLocali = macroSettore === "welfare" ? PROFILI_WELFARE : (Array.isArray(PROFILI) ? PROFILI : []);
  const quartieriLocali = Array.isArray(QUARTIERI) ? QUARTIERI : [];

  const costoPunti = COSTI_PREMI?.sconto || 500;
  const saldo = typeof rawPunti === "number" ? rawPunti : typeof rawPunti === "function" ? rawPunti() : 0;
  const puoScontare = saldo >= costoPunti;
  const prezzoPieno = 14.90;
  const prezzoScontato = 9.90;

  // Bandi abbinati nel passo 4 del Configuratore Dossier
  const bandiDossierWizard = (() => {
    if (bandoSelezionato) {
      const correlati = bandiAttivi.filter(
        (b: any) =>
          b.id !== bandoSelezionato.id &&
          (b.asse_specifico === bandoSelezionato.asse_specifico || b.obiettivo_id === bandoSelezionato.obiettivo_id)
      );
      return [bandoSelezionato, ...correlati].slice(0, 5);
    }
    if (macroSettore === "welfare" || obiettivo === "o6") {
      const perAsse = bandiWelfare.filter((b: any) => !asseWelfareScelto || b.asse_specifico === asseWelfareScelto);
      return (perAsse.length > 0 ? perAsse : bandiWelfare).slice(0, 6);
    }
    const perOb = bandiCitta.filter((b: any) => {
      if (!obiettivo) return true;
      const obId = b.obiettivo_id || b.obiettivo;
      return obId === obiettivo;
    });
    return (perOb.length > 0 ? perOb : bandiAttivi).slice(0, 6);
  })();

  const valoreDossier = bandiDossierWizard.reduce((acc: number, b: any) => acc + stimaValoreBando(b), 0);

  const profiloNome = profiliLocali.find((p: any) => p.id === profilo)?.nome ?? (profilo || "Cittadino / Ente / Impresa");
  const obiettivoNome = bandoSelezionato
    ? bandoSelezionato.titolo
    : asseWelfareScelto
    ? `Welfare: ${asseWelfareScelto}`
    : obiettiviLocali.find((o: any) => o.id === obiettivo)?.nome ?? (obiettivo || "Bandi Territoriali");

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
    }
  }, [search]);

  const selezionaBandoDiretto = (b: any) => {
    setBandoSelezionato(b);
    setMacroSettore(b.categoria_macro === "welfare" ? "welfare" : "citta");
    setObiettivo(b.obiettivo_id || "o1");
    if (b.categoria_macro === "welfare") setAsseWelfareScelto(b.asse_specifico || "");
    if (!profilo) setProfilo("cittadino");
    if (!quartiere) setQuartiere("Centro Storico");
    setStep(3);
    const el = document.getElementById("configuratore-dossier");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

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
      await registraDossierGenerato({
        profilo: profiloNome,
        quartiere: quartiere || "Centro Storico",
        obiettivo: obiettivoNome,
        settore: macroSettore,
        email: emailDossier.trim(),
        sconto_punti: usaPunti && puoScontare,
        prezzo_applicato: usaPunti && puoScontare ? prezzoScontato : prezzoPieno,
        azione: "Anteprima Concierge Richiesta",
        bandi: bandiDossierWizard.map((b: any) => ({ nome: b.nome || b.titolo, ente: b.ente || b.portale }))
      });
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
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      {/* HEADER */}
      <div className="mb-6 text-center">
        <div className="mb-3 flex flex-wrap justify-center gap-2">
          <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
            Motore Unificato Scremato · Zero Duplicati · Curato da Lorenzo
          </span>
          <Link
            to="/regia"
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-0.5 text-xs text-muted-foreground hover:border-accent hover:text-accent transition"
          >
            <Lock className="size-3" /> Regia Operatori
          </Link>
        </div>
        <h1 className="text-3xl font-bold md:text-4xl">
          Ricerca Bandi & <span className="text-ember-gradient">Dossier IA</span>
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          <Clock className="inline size-3.5 text-emerald-400 mr-1" />
          Aggiornamento giornaliero automatico (Ore 09:00): <b>{syncMeta.ultimo_aggiornamento || "Attivo"}</b> · {bandiAttivi.length} bandi unici certificati ({syncMeta.duplicati_rimossi || 121} sovrapposizioni eliminate)
        </p>
      </div>

      {/* SWITCH PRINCIPALE: TUTTI | CITTA & IMPRESE | WELFARE & SOCIALE */}
      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        <button
          onClick={() => {
            setMacroSettore("tutti");
            setFiltroAsse("");
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            macroSettore === "tutti" ? "border-accent bg-accent/10 shadow-sm" : "border-border bg-secondary/20 hover:bg-secondary/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-accent">Visione Globale</span>
            <span className="text-xs font-bold">{bandiAttivi.length} bandi</span>
          </div>
          <div className="text-xl font-black mt-1">{fmtEuro(valoreCitta + valoreWelfare)}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Tutti i bandi Città + Welfare unificati</p>
        </button>

        <button
          onClick={() => {
            setMacroSettore("citta");
            setFiltroAsse("");
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            macroSettore === "citta" ? "border-sky-400 bg-sky-500/10 shadow-sm" : "border-border bg-secondary/20 hover:bg-secondary/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-sky-400 flex items-center gap-1">
              <Building2 className="size-3.5" /> 1. Bandi Città & Imprese
            </span>
            <span className="text-xs font-bold text-sky-400">{bandiCitta.length} bandi</span>
          </div>
          <div className="text-xl font-black mt-1">{fmtEuro(valoreCitta)}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">PR FESR, FSC, PNRR, GSE, Invitalia, CCIAA</p>
        </button>

        <button
          onClick={() => {
            setMacroSettore("welfare");
            setFiltroAsse("");
            setObiettivo("o6");
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            macroSettore === "welfare" ? "border-rose-400 bg-rose-500/10 shadow-sm" : "border-border bg-secondary/20 hover:bg-secondary/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-rose-400 flex items-center gap-1">
              <HeartHandshake className="size-3.5" /> 2. Bandi Welfare & Sociale
            </span>
            <span className="text-xs font-bold text-rose-400">{bandiWelfare.length} bandi</span>
          </div>
          <div className="text-xl font-black mt-1">{fmtEuro(valoreWelfare)}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">PR FSE+, PNRR M5C2/M6, FNA, MLPS, INPS, Art. 55 CTS</p>
        </button>
      </div>

      {/* MOTORE DI RICERCA DIRETTA BANDI (CITTA + WELFARE) */}
      <section className="surface-panel mb-8 p-5 md:p-6 border rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Search className="size-5 text-accent" />
              Ricerca Diretta Bandi {macroSettore === "welfare" ? "Welfare & Politiche Sociali" : macroSettore === "citta" ? "Città, Imprese & Energia" : "(Città + Welfare)"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Cerca per parola chiave, filtra per Asse d'intervento o Destinatario e clicca su <b>"Includi nel Dossier"</b>.
            </p>
          </div>
          <span className="text-xs font-bold text-accent">
            {bandiRicercaRisultati.length} misure trovate
          </span>
        </div>

        {/* BARRA FILTRI */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-5">
          <input
            type="text"
            value={queryRicerca}
            onChange={(e) => setQueryRicerca(e.target.value)}
            placeholder={
              macroSettore === "welfare"
                ? "Cerca es. FNA, caregiver, disabilità, Art. 55, PUA, minori..."
                : "Cerca es. fotovoltaico, CER, sfitti, startup, FESR, FNA..."
            }
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
          />

          <select
            value={filtroAsse}
            onChange={(e) => setFiltroAsse(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="">Tutti gli Assi ({macroSettore === "welfare" ? "7 Assi Welfare" : macroSettore === "citta" ? "6 Assi Città" : "Città + Welfare"})</option>
            {(macroSettore === "welfare"
              ? ASSI_WELFARE
              : macroSettore === "citta"
              ? ASSI_CITTA
              : [...ASSI_CITTA, ...ASSI_WELFARE]
            ).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            value={filtroAmbito}
            onChange={(e) => setFiltroAmbito(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="">Tutti i Destinatari</option>
            <option value="cittadino">Cittadini, Famiglie & Caregiver</option>
            <option value="impresa">Imprese, PMI & Partite IVA</option>
            <option value="pubblico">Enti Pubblici, Zone Sociali & Terzo Settore (ETS)</option>
          </select>

          <select
            value={filtroCanale}
            onChange={(e) => setFiltroCanale(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="">Tutti i Canali / Enti</option>
            <option value="FESR">PR FESR 2021/2027</option>
            <option value="FSE">PR FSE+ 2021/2027 & ARPAL</option>
            <option value="PNRR">PNRR (Transizione 5.0, M5C2, M6)</option>
            <option value="MLPS">Fondi Nazionali MLPS / FNA / Povertà</option>
            <option value="INPS">INPS Home Care Premium</option>
            <option value="GSE">GSE (Conto Termico & CER)</option>
            <option value="Invitalia">Invitalia</option>
            <option value="Camera di Commercio">Camera di Commercio</option>
            <option value="Terni">Comune di Terni & Fondazione Carit</option>
          </select>
        </div>

        {/* GRIGLIA RISULTATI RICERCA BANDI */}
        <div className="grid gap-3 md:grid-cols-2">
          {bandiRicercaRisultati.map((b: any) => {
            const isWelfare = b.categoria_macro === "welfare";
            const sdg = SDG_META[b.obiettivo_id || "o1"] || SDG_META.o1;
            return (
              <div
                key={b.id || b.titolo}
                className="rounded-xl border border-border bg-background/70 p-4 flex flex-col justify-between hover:border-accent transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          isWelfare ? "bg-rose-500/20 text-rose-400" : "bg-sky-500/20 text-sky-400"
                        }`}
                      >
                        {isWelfare ? "🤝 Welfare" : "🏙️ Città & Imprese"}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-semibold">
                        {b.portale || b.ente}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent text-[10px] font-bold">
                        {b.asse_specifico || b.obiettivo_nome}
                      </span>
                    </div>
                    <img src={b.sdg_img || sdg.img} alt={sdg.label} className="w-9 h-9 rounded-md shrink-0 shadow-sm" />
                  </div>

                  <h3 className="font-bold text-sm leading-snug">{b.titolo}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{b.descrizione}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px]">
                    <span className="text-muted-foreground">Plafond / Misura: </span>
                    <b className="text-emerald-400">{fmtEuro(stimaValoreBando(b))}</b>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[240px]">{b.importo}</div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={b.link}
                      target="_blank"
                      rel="noreferrer"
                      className="h-8 px-2.5 rounded-md border border-border bg-secondary/50 hover:bg-secondary text-xs font-semibold inline-flex items-center gap-1"
                    >
                      Fonte <ExternalLink className="size-3" />
                    </a>
                    <button
                      onClick={() => selezionaBandoDiretto(b)}
                      className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
                    >
                      Richiedi Dossier →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CONFIGURATORE GUIDATO DOSSIER (CITTA + WELFARE) */}
      <div id="configuratore-dossier" className="surface-panel p-5 md:p-7 border rounded-2xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">
              Configuratore Guidato Dossier IA ({macroSettore === "welfare" ? "Modalità Welfare & Sociale" : "Modalità Città & Imprese"})
            </h2>
            {bandoSelezionato && (
              <button
                onClick={() => setBandoSelezionato(null)}
                className="text-xs text-accent underline"
              >
                Mostra tutti i bandi dell'obiettivo
              </button>
            )}
          </div>
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
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
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

            <div className="rounded-lg border border-dashed border-accent/60 p-4">
              <p className="mb-3 font-semibold">
                <Plus className="size-4 inline" /> Obiettivo Personalizzato (Progetto Specifico Città o Welfare)
              </p>
              <input
                type="text"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm mb-2"
                value={custom.titolo}
                onChange={(e) => setCustom({ ...custom, titolo: e.target.value })}
                placeholder="Descrivi il tuo obiettivo (es. Riapertura locale, Impianto fotovoltaico, Co-progettazione Welfare)"
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
                disabled={!obiettivo && !asseWelfareScelto}
                className="flex-1 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                onClick={() => setStep(3)}
              >
                Genera Quadro Bandi Compatibili →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={SDG_META[obiettivo]?.img || "/sdg/sdg-11.svg"}
                  alt="SDG"
                  className="w-14 h-14 rounded-lg shadow-sm shrink-0"
                />
                <div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-accent uppercase">
                    <Globe className="size-3.5" /> {SDG_META[obiettivo]?.label || "Allineamento Strategico Agenda 2030"}
                  </span>
                  <h2 className="text-2xl font-bold mt-0.5">
                    Risultato Preliminare · {quartiere || "Terni"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Profilo: <b>{profiloNome}</b> · Focus: <b>{obiettivoNome}</b>
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                  {bandiDossierWizard.length} Misure Compatibili
                </span>
                <div className="text-xs text-muted-foreground mt-1">
                  Plafond stimato: <b className="text-foreground">{fmtEuro(valoreDossier)}</b>
                </div>
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {bandiDossierWizard.map((b: any) => (
                <div key={b.id || b.titolo} className="rounded-lg border border-border bg-background/60 p-3.5 text-left">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-accent font-semibold">
                    <span>{b.portale || b.ente}</span>
                    <span>{fmtEuro(stimaValoreBando(b))}</span>
                  </div>
                  <p className="font-bold text-sm mt-1">{b.titolo || b.nome}</p>
                  <p className="text-xs text-muted-foreground mt-1">{b.importo || "Contributo / Agevolazione"}</p>
                </div>
              ))}
            </div>

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
                <h3 className="text-lg font-bold text-emerald-400">Richiesta registrata in Regia con successo!</h3>
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
