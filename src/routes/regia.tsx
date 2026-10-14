import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  FileText,
  Radar,
  Trash2,
  CheckCircle2,
  Clock,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  Mail,
  Building2,
  HeartHandshake,
  Lock
} from "lucide-react";
import {
  useCivic,
  supabase,
  salvaAuditBandoCloud,
  eliminaDossierAdmin,
  modificaStatoDossierAdmin,
  registraDossierGenerato,
  gestisciPropostaAdmin
} from "@/lib/civic-store";
import bandiRealiJson from "@/lib/bandi_reali.json";
import syncMetaJson from "@/lib/sync_meta.json";

export const Route = createFileRoute("/regia")({
  component: RegiaPage,
});

function normKey(titolo: string): string {
  return String(titolo || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
}

function fmtEuro(val: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val || 0);
}

function normalizzaRigaDossier(row: any): any {
  const idStr = String(row?.id || "");
  let parsed: any = {};
  if (typeof row?.descrizione === "string") {
    try {
      parsed = JSON.parse(row.descrizione);
    } catch {
      parsed = {};
    }
  } else if (row && typeof row === "object") {
    parsed = row;
  }

  // Gestisce sia array di stringhe (elenco_bandi) sia array di oggetti ({nome, ente})
  let bandiList: string[] = [];
  if (Array.isArray(parsed.elenco_bandi) && parsed.elenco_bandi.length > 0) {
    bandiList = parsed.elenco_bandi.map((x: any) =>
      typeof x === "string" ? x : `${x?.nome || x?.titolo || "Bando"} (${x?.ente || x?.portale || ""})`
    );
  } else if (Array.isArray(parsed.bandi) && parsed.bandi.length > 0) {
    bandiList = parsed.bandi.map((x: any) =>
      typeof x === "string" ? x : `${x?.nome || x?.titolo || "Bando"} (${x?.ente || x?.portale || ""})`
    );
  } else if (Array.isArray(row?.bandi_trovati)) {
    bandiList = row.bandi_trovati.map((x: any) => String(x));
  }

  const emailEstratta =
    parsed.email ||
    row?.email ||
    (typeof row?.titolo === "string" && row.titolo.includes("@") ? row.titolo.replace("Dossier di ", "").trim() : "Non specificata");

  return {
    id: idStr || `dossier_${Math.random().toString(36).slice(2, 7)}`,
    orario: parsed.orario || row?.orario || row?.created_at || "Oggi",
    email: emailEstratta,
    profilo: parsed.profilo || row?.profilo || "Cittadino / Impresa",
    quartiere: parsed.quartiere || row?.quartiere || "Terni",
    obiettivo: parsed.obiettivo || row?.obiettivo || "Analisi Bandi",
    azione: parsed.azione || row?.azione || "Richiesta Dossier",
    stato: row?.stato || parsed.stato || "Da Contattare",
    prezzo: parsed.prezzo_applicato || 14.90,
    sconto: Boolean(parsed.sconto_punti),
    numero_bandi: bandiList.length,
    elenco_bandi: bandiList,
  };
}

function RegiaPage() {
  const { state, ricaricaCloud } = useCivic() || ({} as any);
  const [pinOk, setPinOk] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [tab, setTab] = useState<"dossier" | "bandi" | "moderazione">("dossier");

  const [dossiers, setDossiers] = useState<any[]>([]);
  const [loadingDossier, setLoadingDossier] = useState(false);

  // Filtri Bandi in Regia
  const [qBandi, setQBandi] = useState("");
  const [fMacro, setFMacro] = useState<"" | "citta" | "welfare">("");
  const [fStato, setFStato] = useState<"" | "verde" | "giallo" | "rosso">("");
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});
  const [linkInput, setLinkInput] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      if (localStorage.getItem("terni2030_regia_auth") === "1") {
        setPinOk(true);
      }
    } catch {}
  }, []);

  const caricaDossiersLive = async () => {
    setLoadingDossier(true);
    const mappaDossier = new Map<string, any>();

    // 1. Legge da state.dossierGenerati se presenti
    if (Array.isArray(state?.dossierGenerati)) {
      for (const d of state.dossierGenerati) {
        const norm = normalizzaRigaDossier(d);
        mappaDossier.set(norm.id, norm);
      }
    }

    // 2. Interroga direttamente Supabase (tabella segnalazioni + eventuale dossier_generati)
    if (supabase) {
      try {
        const { data: rowsSeg } = await supabase
          .from("segnalazioni")
          .select("*")
          .or("id.like.dossier_%,categoria.eq.Dossier_Generato")
          .order("created_at", { ascending: false });

        if (Array.isArray(rowsSeg)) {
          for (const r of rowsSeg) {
            const norm = normalizzaRigaDossier(r);
            mappaDossier.set(norm.id, norm);
          }
        }
      } catch {}

      try {
        const { data: rowsTab } = await supabase
          .from("dossier_generati")
          .select("*")
          .order("created_at", { ascending: false });
        if (Array.isArray(rowsTab)) {
          for (const r of rowsTab) {
            const norm = normalizzaRigaDossier({ ...r, id: `dg_${r.id}` });
            const giaPresente = Array.from(mappaDossier.values()).some(
              (x) => x.email === norm.email && x.obiettivo === norm.obiettivo
            );
            if (!giaPresente) {
              mappaDossier.set(norm.id, norm);
            }
          }
        }
      } catch {}
    }

    setDossiers(Array.from(mappaDossier.values()));
    setLoadingDossier(false);
  };

  useEffect(() => {
    if (pinOk) {
      void caricaDossiersLive();
    }
  }, [pinOk, state?.dossierGenerati]);

  const sbloccaRegia = () => {
    const code = pinInput.trim().toUpperCase();
    if (code === "TERNI2030" || code === "LORENZO" || code === "REGIONE") {
      setPinOk(true);
      try {
        localStorage.setItem("terni2030_regia_auth", "1");
      } catch {}
      toast.success("Accesso Operatore autorizzato");
    } else {
      toast.error("Codice non valido. Usa: TERNI2030");
    }
  };

  const aggiornaStatoDossier = async (id: string, nuovoStato: string) => {
    try {
      if (id.startsWith("dg_") && supabase) {
        await supabase.from("dossier_generati").update({ stato: nuovoStato }).eq("id", id.replace("dg_", ""));
      } else {
        await modificaStatoDossierAdmin(id, nuovoStato);
      }
      setDossiers((prev) => prev.map((d) => (d.id === id ? { ...d, stato: nuovoStato } : d)));
      if (typeof ricaricaCloud === "function") void ricaricaCloud();
      toast.success(`Stato aggiornato a: ${nuovoStato}`);
    } catch (e: any) {
      toast.error("Errore aggiornamento: " + e.message);
    }
  };

  const cancellaDossier = async (id: string) => {
    try {
      if (id.startsWith("dg_") && supabase) {
        await supabase.from("dossier_generati").delete().eq("id", id.replace("dg_", ""));
      } else {
        await eliminaDossierAdmin(id);
      }
      setDossiers((prev) => prev.filter((d) => d.id !== id));
      if (typeof ricaricaCloud === "function") void ricaricaCloud();
      toast.success("Richiesta Dossier eliminata.");
    } catch (e: any) {
      toast.error("Errore eliminazione: " + e.message);
    }
  };

  const creaDossierTest = async () => {
    try {
      await registraDossierGenerato({
        profilo: "Cittadino / Impresa (Test Regia)",
        quartiere: "Centro Storico",
        obiettivo: "Sostenibilità Energetica & Welfare",
        email: "lorenzo.test@terni2030.it",
        prezzo_applicato: 14.90,
        azione: "Verifica Funzionamento Regia",
        bandi: [
          { nome: "Conto Termico 3.0 GSE", ente: "GSE" },
          { nome: "PR FSE+ Umbria Inclusione e Welfare", ente: "Regione Umbria" }
        ]
      });
      toast.success("Dossier di prova registrato! Ricarico la tabella...");
      await caricaDossiersLive();
      if (typeof ricaricaCloud === "function") void ricaricaCloud();
    } catch (e: any) {
      toast.error("Errore creazione test: " + e.message);
    }
  };

  const bandiList = Array.isArray(bandiRealiJson) ? bandiRealiJson : [];
  const meta: any = syncMetaJson || {};

  const getStatoBando = (b: any) => {
    const k = normKey(b.titolo || b.nome);
    const audit = state?.auditBandi?.[k];
    if (audit) {
      if (audit.stato === "Scartato") return { col: "rosso", label: "Scartato da Operatore", nota: audit.nota || "", link: audit.linkUfficiale || b.link };
      if (audit.stato === "Certificato") return { col: "verde", label: "Certificato da Operatore", nota: audit.nota || "", link: audit.linkUfficiale || b.link };
      return { col: "giallo", label: "Da Verificare", nota: audit.nota || "", link: audit.linkUfficiale || b.link };
    }
    const isVerde = b.semaforo === "verde";
    return {
      col: isVerde ? "verde" : "giallo",
      label: isVerde ? "Fonte Istituzionale" : "Da Verificare (Feed)",
      nota: "",
      link: b.link || "#"
    };
  };

  const bandiFiltrati = bandiList.filter((b: any) => {
    const info = getStatoBando(b);
    const txt = `${b.titolo || ""} ${b.descrizione || ""} ${b.portale || ""} ${b.asse_specifico || ""}`.toLowerCase();
    if (qBandi && !txt.includes(qBandi.toLowerCase())) return false;
    if (fMacro && (b.categoria_macro || "citta") !== fMacro) return false;
    if (fStato && info.col !== fStato) return false;
    return true;
  });

  const bandiAttiviNonScartati = bandiList.filter((b: any) => getStatoBando(b).col !== "rosso");
  const valCitta = bandiAttiviNonScartati
    .filter((b: any) => b.categoria_macro !== "welfare")
    .reduce((acc: number, b: any) => acc + (Number(b.valore_stimato_euro) || 250000), 0);
  const valWelfare = bandiAttiviNonScartati
    .filter((b: any) => b.categoria_macro === "welfare")
    .reduce((acc: number, b: any) => acc + (Number(b.valore_stimato_euro) || 250000), 0);

  if (!pinOk) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="surface-panel border p-8 rounded-2xl shadow-lg">
          <Lock className="mx-auto size-12 text-accent mb-4" />
          <h1 className="text-2xl font-bold mb-2">Regia Operatori · Terni 2030</h1>
          <p className="text-xs text-muted-foreground mb-6">
            Inserisci il codice operatore (es. <b>TERNI2030</b> o <b>LORENZO</b>) per gestire i Dossier Generati, i Bandi Città/Welfare e la Moderazione.
          </p>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sbloccaRegia()}
            placeholder="Codice Operatore..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-center text-sm mb-4"
          />
          <button
            onClick={sbloccaRegia}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90"
          >
            Entra nella Regia
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      {/* HEADER REGIA */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-accent">
            <ShieldCheck className="size-4" /> Pannello di Controllo Direzionale · Operatore Lorenzo
          </span>
          <h1 className="text-3xl font-bold mt-1">Regia Unificata Dossier, Bandi Città & Welfare</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Ultimo aggiornamento automatico bandi: <b>{meta.ultimo_aggiornamento || "Attivo"}</b> · Pianificazione: <b>{meta.stato_automazione || "Ogni giorno ore 09:00"}</b> ({meta.duplicati_rimossi || 0} sovrapposizioni eliminate)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTab("dossier")}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
              tab === "dossier" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 border-border"
            }`}
          >
            📊 1. Dossier Generati ({dossiers.length})
          </button>
          <button
            onClick={() => setTab("bandi")}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
              tab === "bandi" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 border-border"
            }`}
          >
            🔎 2. Verifica Bandi Città & Welfare ({bandiList.length})
          </button>
          <button
            onClick={() => setTab("moderazione")}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
              tab === "moderazione" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 border-border"
            }`}
          >
            🛡️ 3. Moderazione Mappa & POI ({state?.proposteModerazione?.length || 0})
          </button>
        </div>
      </div>

      {/* KPI ECONOMICI GLOBALI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="surface-panel border p-4 rounded-xl">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Richieste Dossier (Concierge)</span>
          <div className="text-2xl font-black text-accent mt-1">{dossiers.length} richieste</div>
          <span className="text-[11px] text-muted-foreground">
            {dossiers.filter((d) => d.stato === "Venduto").length} sbloccati / venduti
          </span>
        </div>
        <div className="surface-panel border p-4 rounded-xl">
          <span className="text-xs text-sky-400 uppercase font-semibold flex items-center gap-1">
            <Building2 className="size-3.5" /> Valore Bandi Città Attivi
          </span>
          <div className="text-2xl font-black mt-1">{fmtEuro(valCitta)}</div>
          <span className="text-[11px] text-muted-foreground">
            {bandiAttiviNonScartati.filter((b: any) => b.categoria_macro !== "welfare").length} misure uniche Città/Imprese
          </span>
        </div>
        <div className="surface-panel border p-4 rounded-xl">
          <span className="text-xs text-rose-400 uppercase font-semibold flex items-center gap-1">
            <HeartHandshake className="size-3.5" /> Valore Fondi Welfare Attivi
          </span>
          <div className="text-2xl font-black mt-1">{fmtEuro(valWelfare)}</div>
          <span className="text-[11px] text-muted-foreground">
            {bandiAttiviNonScartati.filter((b: any) => b.categoria_macro === "welfare").length} misure uniche Welfare/Sociale
          </span>
        </div>
        <div className="surface-panel border p-4 rounded-xl">
          <span className="text-xs text-emerald-400 uppercase font-semibold flex items-center gap-1">
            <Clock className="size-3.5" /> Automazione Ore 09:00
          </span>
          <div className="text-lg font-bold text-emerald-400 mt-1">Scrematura Attiva ✓</div>
          <span className="text-[11px] text-muted-foreground">
            {meta.grezzi_analizzati || 148} analizzati → {bandiList.length} unici reali
          </span>
        </div>
      </div>

      {/* ===================== TAB 1: DOSSIER GENERATI ===================== */}
      {tab === "dossier" && (
        <div className="space-y-4">
          <div className="surface-panel border p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Gestione Richieste Dossier (Modello Concierge MVP)</h2>
              <p className="text-xs text-muted-foreground">
                Ogni richiesta inviata dalla pagina <Link to="/dossier" className="text-accent underline">/dossier</Link> compare qui con l'email dell'utente e i bandi individuati.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={creaDossierTest}
                className="inline-flex items-center gap-1.5 rounded-md border border-accent/50 bg-accent/10 px-3 py-2 text-xs font-bold text-accent hover:bg-accent/20"
              >
                <PlusCircle className="size-4" /> Crea Dossier di Test
              </button>
              <button
                onClick={caricaDossiersLive}
                disabled={loadingDossier}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-2 text-xs font-bold hover:bg-secondary/80"
              >
                <RefreshCw className={`size-4 ${loadingDossier ? "animate-spin" : ""}`} /> Aggiorna Elenco
              </button>
            </div>
          </div>

          {dossiers.length === 0 ? (
            <div className="surface-panel border p-12 rounded-xl text-center space-y-3">
              <FileText className="mx-auto size-12 text-muted-foreground" />
              <h3 className="text-lg font-bold">Nessuna richiesta Dossier registrata al momento</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Clicca su <b>"Crea Dossier di Test"</b> qui sopra oppure compila il passo 4 nella pagina Bandi & Dossier IA per verificare la ricezione istantanea.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {dossiers.map((d) => (
                <div key={d.id} className="surface-panel border p-5 rounded-xl flex flex-col lg:flex-row justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          d.stato === "Venduto"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : d.stato === "In Lavorazione"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        }`}
                      >
                        {d.stato}
                      </span>
                      <span className="text-xs text-muted-foreground">{d.orario}</span>
                      <span className="text-xs font-bold text-accent">
                        Valore: € {Number(d.prezzo || 14.9).toFixed(2)} {d.sconto ? "(Sconto 500 pt)" : ""}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <a
                        href={`mailto:${d.email}?subject=Anteprima Dossier Bandi Terni 2030 - ${d.obiettivo}`}
                        className="inline-flex items-center gap-1.5 text-base font-bold text-accent hover:underline"
                      >
                        <Mail className="size-4" /> {d.email}
                      </a>
                      <span className="text-xs bg-secondary px-2.5 py-1 rounded-md">
                        Profilo: <b>{d.profilo}</b>
                      </span>
                      <span className="text-xs bg-secondary px-2.5 py-1 rounded-md">
                        Quartiere: <b>{d.quartiere}</b>
                      </span>
                      <span className="text-xs bg-secondary px-2.5 py-1 rounded-md">
                        Obiettivo: <b>{d.obiettivo}</b>
                      </span>
                    </div>

                    <div className="pt-2">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Bandi abbinati nell'anteprima ({d.elenco_bandi?.length || 0}):
                      </p>
                      {Array.isArray(d.elenco_bandi) && d.elenco_bandi.length > 0 ? (
                        <ul className="list-disc pl-5 text-xs space-y-0.5 text-foreground/90">
                          {d.elenco_bandi.map((bStr: string, i: number) => (
                            <li key={i}>{bStr}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs italic text-muted-foreground">Ricerca personalizzata richiesta dall'utente</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col justify-end gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-border pt-3 lg:pt-0 lg:pl-4">
                    <button
                      onClick={() => aggiornaStatoDossier(d.id, "Da Contattare")}
                      className="px-3 py-1.5 rounded-md border border-border bg-secondary/60 hover:bg-secondary text-xs font-semibold"
                    >
                      🟡 Da Contattare
                    </button>
                    <button
                      onClick={() => aggiornaStatoDossier(d.id, "In Lavorazione")}
                      className="px-3 py-1.5 rounded-md border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-semibold"
                    >
                      🔵 Invia Anteprima
                    </button>
                    <button
                      onClick={() => aggiornaStatoDossier(d.id, "Venduto")}
                      className="px-3 py-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold"
                    >
                      ✅ Segna Venduto
                    </button>
                    <button
                      onClick={() => cancellaDossier(d.id)}
                      className="px-3 py-1.5 rounded-md border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold inline-flex items-center justify-center gap-1"
                    >
                      <Trash2 className="size-3.5" /> Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: VERIFICA BANDI UNIFICATA ===================== */}
      {tab === "bandi" && (
        <div className="space-y-4">
          <div className="surface-panel border p-4 rounded-xl flex flex-wrap gap-3 items-center">
            <input
              type="text"
              value={qBandi}
              onChange={(e) => setQBandi(e.target.value)}
              placeholder="Cerca bando per titolo, ente, FNA, FESR, CER..."
              className="flex h-9 flex-1 min-w-[220px] rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
            <select
              value={fMacro}
              onChange={(e) => setFMacro(e.target.value as any)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold"
            >
              <option value="">Tutti i Settori (Città + Welfare)</option>
              <option value="citta">🏙️ Solo Finanziamenti Città & Imprese</option>
              <option value="welfare">🤝 Solo Fondi Welfare & Sociale</option>
            </select>
            <select
              value={fStato}
              onChange={(e) => setFStato(e.target.value as any)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold"
            >
              <option value="">Tutti gli Stati</option>
              <option value="verde">🟢 Certificati / Istituzionali</option>
              <option value="giallo">🟡 Da Verificare</option>
              <option value="rosso">🔴 Scartati</option>
            </select>
          </div>

          <div className="grid gap-3">
            {bandiFiltrati.map((b: any, i: number) => {
              const info = getStatoBando(b);
              const k = normKey(b.titolo || b.nome);
              const isWelfare = b.categoria_macro === "welfare";
              return (
                <div key={b.id || i} className="surface-panel border p-4 rounded-xl flex flex-col lg:flex-row justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          info.col === "verde"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : info.col === "rosso"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {info.label}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isWelfare ? "bg-rose-500/20 text-rose-400" : "bg-sky-500/20 text-sky-400"
                        }`}
                      >
                        {isWelfare ? "🤝 Welfare & Sociale" : "🏙️ Città & Imprese"}
                      </span>
                      <span className="text-xs font-bold text-accent">{b.portale || b.ente}</span>
                      <span className="text-xs font-bold text-emerald-400">{fmtEuro(b.valore_stimato_euro || 250000)}</span>
                    </div>
                    <h3 className="font-bold text-sm">{b.titolo}</h3>
                    <p className="text-xs text-muted-foreground">{b.descrizione}</p>
                    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground pt-1">
                      <span>Asse: <b>{b.asse_specifico || b.obiettivo_nome}</b></span>
                      <span>Dotazione: <b>{b.importo}</b></span>
                      {Array.isArray(b.portali_correlati) && b.portali_correlati.length > 1 && (
                        <span className="text-accent">Portali unificati: {b.portali_correlati.join(", ")}</span>
                      )}
                    </div>
                    {info.nota && <p className="text-xs text-amber-400 font-semibold">Nota Operatore: {info.nota}</p>}
                  </div>

                  <div className="flex flex-col gap-2 min-w-[260px] shrink-0">
                    <div className="flex gap-1.5">
                      <button
                        onClick={async () => {
                          await salvaAuditBandoCloud(k, b.titolo, "Certificato", noteInput[k] || info.nota, linkInput[k] || info.link);
                          if (typeof ricaricaCloud === "function") void ricaricaCloud();
                          toast.success("Bando certificato!");
                        }}
                        className="flex-1 py-1.5 px-2 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold"
                      >
                        ✅ Certifica
                      </button>
                      <button
                        onClick={async () => {
                          await salvaAuditBandoCloud(k, b.titolo, "Scartato", noteInput[k] || "Scartato da Regia", linkInput[k] || info.link);
                          if (typeof ricaricaCloud === "function") void ricaricaCloud();
                          toast.info("Bando nascosto dal sito pubblico");
                        }}
                        className="flex-1 py-1.5 px-2 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold"
                      >
                        ❌ Scarta
                      </button>
                      <a
                        href={info.link}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-2.5 rounded bg-secondary hover:bg-secondary/80 text-xs font-bold inline-flex items-center"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    </div>
                    <input
                      type="text"
                      placeholder="Nota operatore..."
                      value={noteInput[k] ?? ""}
                      onChange={(e) => setNoteInput({ ...noteInput, [k]: e.target.value })}
                      className="h-7 rounded border border-input bg-background px-2 text-xs"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: MODERAZIONE PROPOSTE ===================== */}
      {tab === "moderazione" && (
        <div className="space-y-3">
          {(state?.proposteModerazione || []).length === 0 ? (
            <div className="surface-panel border p-8 rounded-xl text-center text-sm text-muted-foreground">
              Nessuna proposta in attesa di moderazione.
            </div>
          ) : (
            (state?.proposteModerazione || []).map((p: any) => (
              <div key={p.id} className="surface-panel border p-4 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase text-accent">{p.tipo} · {p.stato}</span>
                  <h3 className="font-bold">{p.titolo}</h3>
                  <p className="text-xs text-muted-foreground">Autore: {p.autore} · Data: {p.data}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await gestisciPropostaAdmin(p.id, "Approvata");
                      if (typeof ricaricaCloud === "function") void ricaricaCloud();
                      toast.success("Proposta approvata!");
                    }}
                    className="px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold"
                  >
                    Approva
                  </button>
                  <button
                    onClick={async () => {
                      await gestisciPropostaAdmin(p.id, "Rifiutata");
                      if (typeof ricaricaCloud === "function") void ricaricaCloud();
                      toast.info("Proposta rifiutata");
                    }}
                    className="px-3 py-1.5 rounded bg-red-500/20 text-red-400 text-xs font-bold"
                  >
                    Rifiuta
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
