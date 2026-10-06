import bandiRealiJson from "@/lib/bandi_reali.json";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink, FileText, Inbox, Lock, RefreshCw, Search, ShieldCheck, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ORDINE_RARITA, RARITA_STANDARD, type RaritaPOI } from "@/lib/terni-data";
import { gestisciPropostaAdmin, salvaAuditBandoCloud, useCivic, type AuditBando, type PropostaModerazione } from "@/lib/civic-store";

export const Route = createFileRoute("/regia")({
  head: () => ({
    meta: [
      { title: "Regia Controllo Bandi, Dossier & Moderazione — Terni 2030" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RegiaPage,
});

const CODICI_ABILITATI: Record<string, string> = {
  "Tr2030!Admin#Lollo95": "Lorenzo (Admin)",
  "Umbria#2030!RegiaBandi": "Controllore Regione",
};

function normKey(titolo: string): string {
  return String(titolo || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
}

function RegiaPage() {
  const { state, update, ricaricaCloud } = useCivic();
  const [operatore, setOperatore] = useState<string>(() => {
    try { return sessionStorage.getItem("terni2030_regia_op") || ""; } catch { return ""; }
  });
  const [codiceInput, setCodiceInput] = useState("");
  const [tab, setTab] = useState<"bandi" | "dossier" | "proposte">("bandi");
  const [ricerca, setRicerca] = useState("");
  const [filtroStato, setFiltroStato] = useState<string>("tutti");
  const [filtroPortale, setFiltroPortale] = useState<string>("tutti");
  const [bozze, setBozze] = useState<Record<string, { link: string; nota: string }>>({});
  const [raritaSceltaAdmin, setRaritaSceltaAdmin] = useState<Record<string, RaritaPOI>>({});
  const [loading, setLoading] = useState(false);

  const eseguiAccesso = () => {
    const ruolo = CODICI_ABILITATI[codiceInput.trim()];
    if (!ruolo) return void toast.error("Codice di accesso non valido.");
    try { sessionStorage.setItem("terni2030_regia_op", ruolo); } catch {}
    setOperatore(ruolo);
    toast.success(`Accesso effettuato: ${ruolo}`);
  };

  const esci = () => {
    try { sessionStorage.removeItem("terni2030_regia_op"); } catch {}
    setOperatore("");
    setCodiceInput("");
  };

  if (!operatore) {
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-4">
        <div className="surface-panel p-6 text-center md:p-8">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-secondary text-accent">
            <Lock className="size-6" />
          </div>
          <h1 className="text-2xl font-bold">Regia Terni 2030</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Accesso riservato per verifica veridicità bandi, supervisione Dossier IA e approvazione proposte dei cittadini.
          </p>
          <div className="mt-5 space-y-3 text-left">
            <Input
              type="password"
              value={codiceInput}
              onChange={(e) => setCodiceInput(e.target.value)}
              placeholder="Inserisci il codice operatore..."
              onKeyDown={(e) => e.key === "Enter" && eseguiAccesso()}
            />
            <Button className="w-full" onClick={eseguiAccesso}>
              <ShieldCheck className="mr-1.5 size-4" /> Entra nella Regia
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tuttiBandi = bandiRealiJson as any[];
  const proposteInAttesa = (state.proposteModerazione || []).filter((p) => p.stato === "In attesa");

  const calcolaStato = (b: any) => {
    const k = normKey(b.titolo);
    const a = state.auditBandi[k];
    if (a) {
      if (a.stato === "Scartato") return { col: "rosso", label: "Scartato da Operatore", audit: a };
      if (a.stato === "Certificato") return { col: "verde", label: "Certificato da Operatore", audit: a };
      return { col: "giallo", label: "Da Verificare / Dubbio", audit: a };
    }
    if (b.semaforo === "verde") return { col: "verde", label: "Fonte Istituzionale Diretta", audit: undefined };
    return { col: "giallo", label: "Da Verificare (Feed Web)", audit: undefined };
  };

  let verdi = 0, gialli = 0, rossi = 0;
  for (const b of tuttiBandi) {
    const st = calcolaStato(b).col;
    if (st === "verde") verdi++;
    else if (st === "giallo") gialli++;
    else rossi++;
  }

  const bandiFiltrati = tuttiBandi.filter((b) => {
    const info = calcolaStato(b);
    const portale = String(b.portale || b.ente || "");
    const testo = `${b.titolo} ${b.descrizione} ${portale} ${b.obiettivo_nome || ""} ${info.audit?.nota || ""}`.toLowerCase();
    if (ricerca.trim() && !testo.includes(ricerca.trim().toLowerCase())) return false;
    if (filtroStato !== "tutti" && info.col !== filtroStato) return false;
    if (filtroPortale !== "tutti" && !portale.toLowerCase().includes(filtroPortale.toLowerCase())) return false;
    return true;
  });

  const salvaRevisione = async (b: any, nuovoStato: AuditBando["stato"]) => {
    const k = normKey(b.titolo);
    const bozza = bozze[k];
    const precedente = state.auditBandi[k];
    const record: AuditBando = {
      stato: nuovoStato,
      linkUfficiale: bozza?.link !== undefined ? bozza.link.trim() : (precedente?.linkUfficiale || ""),
      nota: bozza?.nota !== undefined ? bozza.nota.trim() : (precedente?.nota || ""),
      operatore,
      aggiornato: new Date().toLocaleString("it-IT"),
    };
    update((s) => ({ ...s, auditBandi: { ...s.auditBandi, [k]: record } }));
    await salvaAuditBandoCloud(k, b.titolo, record);
    toast.success(`Bando aggiornato (${nuovoStato}) da ${operatore}`);
  };

  const decidiProposta = async (prop: PropostaModerazione, esito: "Approvata" | "Rifiutata") => {
    const rar = raritaSceltaAdmin[prop.id] || (prop.dati?.rarita as RaritaPOI) || "Comune";
    await gestisciPropostaAdmin(prop, esito, rar);
    await ricaricaCloud();
    toast.success(esito === "Approvata" ? `Proposta «${prop.titolo}» approvata e pubblicata sul sito!` : `Proposta «${prop.titolo}» rifiutata e rimossa.`);
  };

  const aggiornaDati = async () => {
    setLoading(true);
    await ricaricaCloud();
    setLoading(false);
    toast.info("Dati sincronizzati con il cloud.");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <Badge variant="secondary" className="mb-2">Operatore attivo: {operatore}</Badge>
          <h1 className="text-2xl font-bold md:text-3xl">
            Regia <span className="text-ember-gradient">Bandi, Dossier & Moderazione</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Pannello Admin per validazione fonti bandi, lettura Dossier generati e approvazione candidature utenti.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant={tab === "bandi" ? "default" : "secondary"} onClick={() => setTab("bandi")}>
            🔎 1. Verifica Bandi ({tuttiBandi.length})
          </Button>
          <Button size="sm" variant={tab === "dossier" ? "default" : "secondary"} onClick={() => setTab("dossier")}>
            📊 2. Dossier Generati ({state.dossierGenerati.length})
          </Button>
          <Button size="sm" variant={tab === "proposte" ? "default" : "secondary"} onClick={() => setTab("proposte")}>
            📥 3. Proposte da Approvare ({proposteInAttesa.length})
          </Button>
          <Button size="sm" variant="outline" onClick={aggiornaDati} disabled={loading}>
            <RefreshCw className={`mr-1 size-3.5 ${loading ? "animate-spin" : ""}`} /> Sincronizza
          </Button>
          <Button size="sm" variant="ghost" onClick={esci}>Esci</Button>
        </div>
      </div>

      {tab === "bandi" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="surface-panel p-4">
              <p className="text-xs text-muted-foreground">🟢 Fonti Istituzionali / Certificate</p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">{verdi}</p>
            </div>
            <div className="surface-panel p-4">
              <p className="text-xs text-muted-foreground">🟡 Da Verificare (Feed / Rassegna)</p>
              <p className="mt-1 text-2xl font-bold text-amber-400">{gialli}</p>
            </div>
            <div className="surface-panel p-4">
              <p className="text-xs text-muted-foreground">🔴 Scartati (Nascosti dal sito)</p>
              <p className="mt-1 text-2xl font-bold text-red-400">{rossi}</p>
            </div>
          </div>

          <div className="surface-panel flex flex-wrap items-center gap-3 p-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input value={ricerca} onChange={(e) => setRicerca(e.target.value)} placeholder="Cerca per parola chiave, ente, obiettivo..." className="pl-9" />
            </div>
            <select value={filtroStato} onChange={(e) => setFiltroStato(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-xs">
              <option value="tutti">Tutti i Semafori (🟢 + 🟡 + 🔴)</option>
              <option value="giallo">🟡 Solo Da Verificare manualmente</option>
              <option value="verde">🟢 Solo Istituzionali / Certificati</option>
              <option value="rosso">🔴 Solo Scartati</option>
            </select>
            <select value={filtroPortale} onChange={(e) => setFiltroPortale(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-xs">
              <option value="tutti">Tutti i 9 Canali & Fondi</option>
              <option value="FESR">PR FESR 2021/2027</option>
              <option value="FSE">FSE / PR FSE+ 2021/2027</option>
              <option value="FSC">FSC (Fondo Sviluppo e Coesione)</option>
              <option value="PNRR">PNRR</option>
              <option value="Regione Umbria">Regione Umbria</option>
              <option value="Comune di Terni">Comune di Terni</option>
              <option value="GSE">GSE</option>
              <option value="Invitalia">Invitalia</option>
              <option value="Camera di Commercio">Camera di Commercio</option>
            </select>
          </div>

          <div className="space-y-3">
            {bandiFiltrati.map((b, i) => {
              const k = normKey(b.titolo);
              const info = calcolaStato(b);
              const linkAttuale = info.audit?.linkUfficiale || b.link || "#";
              const valLink = bozze[k]?.link !== undefined ? bozze[k].link : (info.audit?.linkUfficiale || "");
              const valNota = bozze[k]?.nota !== undefined ? bozze[k].nota : (info.audit?.nota || "");

              return (
                <div key={k + i} className="surface-panel p-4">
                  <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {info.col === "verde" && <Badge className="border-0 bg-emerald-500/20 text-emerald-400">🟢 {info.label}</Badge>}
                        {info.col === "giallo" && <Badge className="border-0 bg-amber-500/20 text-amber-400">🟡 {info.label}</Badge>}
                        {info.col === "rosso" && <Badge className="border-0 bg-red-500/20 text-red-400">🔴 {info.label}</Badge>}
                        <Badge variant="secondary">{b.portale || b.ente}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Obiettivo: <b>{b.obiettivo_nome || b.obiettivo_id}</b> · Ambiti: <b>{(b.ambiti || []).join(", ")}</b>
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-bold">{b.titolo}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{b.descrizione}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                        <span><b>Importo:</b> {b.importo || "-"}</span>
                        <span><b>Scadenza/Data:</b> {b.scadenza || "-"}</span>
                        <a href={linkAttuale} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-accent hover:underline">
                          Verifica Fonte Attuale <ExternalLink className="size-3.5" />
                        </a>
                      </div>
                      {info.audit && (
                        <p className="mt-2 text-[11px] text-accent">
                          Ultima revisione: <b>{info.audit.operatore}</b> ({info.audit.aggiornato})
                          {info.audit.nota ? ` — Nota: «${info.audit.nota}»` : ""}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col justify-between gap-2 rounded-lg border border-border bg-secondary/30 p-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Button size="sm" variant="secondary" className="flex-1 text-xs" onClick={() => salvaRevisione(b, "Certificato")}>
                          <CheckCircle2 className="mr-1 size-3.5 text-emerald-400" /> Certifica
                        </Button>
                        <Button size="sm" variant="secondary" className="flex-1 text-xs" onClick={() => salvaRevisione(b, "Da Verificare")}>
                          <AlertTriangle className="mr-1 size-3.5 text-amber-400" /> Dubbio
                        </Button>
                        <Button size="sm" variant="secondary" className="flex-1 text-xs" onClick={() => salvaRevisione(b, "Scartato")}>
                          <XCircle className="mr-1 size-3.5 text-red-400" /> Scarta
                        </Button>
                      </div>
                      <Input value={valLink} onChange={(e) => setBozze({ ...bozze, [k]: { link: e.target.value, nota: valNota } })} placeholder="Incolla URL ufficiale corretto..." className="h-8 text-xs" />
                      <div className="flex gap-1.5">
                        <Input value={valNota} onChange={(e) => setBozze({ ...bozze, [k]: { link: valLink, nota: e.target.value } })} placeholder="Nota operatore..." className="h-8 text-xs" />
                        <Button size="sm" className="h-8 px-3 text-xs" onClick={() => salvaRevisione(b, info.audit?.stato || "Certificato")}>Salva</Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "dossier" && (
        <div className="space-y-4">
          {state.dossierGenerati.length === 0 ? (
            <div className="surface-panel p-8 text-center text-sm text-muted-foreground">
              <FileText className="mx-auto mb-2 size-8 text-accent" />
              Nessun Dossier generato dagli utenti finora.
            </div>
          ) : (
            state.dossierGenerati.map((d) => (
              <div key={d.id} className="surface-panel p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{d.orario}</Badge>
                    <Badge className="border-0 bg-accent/20 text-accent">{d.profilo}</Badge>
                    <span className="text-sm font-bold">{d.quartiere}</span>
                    <span className="text-sm text-muted-foreground">→ {d.obiettivo}</span>
                  </div>
                  <Badge variant={d.numero_bandi > 0 ? "default" : "secondary"}>
                    {d.azione} ({d.numero_bandi} bandi)
                  </Badge>
                </div>
                {d.elenco_bandi.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                    {d.elenco_bandi.map((eb, idx) => <li key={idx}>{eb}</li>)}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "proposte" && (
        <div className="space-y-4">
          {state.proposteModerazione.length === 0 ? (
            <div className="surface-panel p-8 text-center text-sm text-muted-foreground">
              <Inbox className="mx-auto mb-2 size-8 text-accent" />
              Nessuna candidatura o proposta in coda di moderazione. Quando un cittadino propone una scheda luogo, un'associazione per la bacheca, un sondaggio o un pin mappa, comparirà qui per la tua approvazione.
            </div>
          ) : (
            state.proposteModerazione.map((prop) => (
              <div key={prop.id} className="surface-panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={prop.stato === "Approvata" ? "default" : "secondary"}>
                        {prop.stato === "Approvata" ? "🟢 Pubblicata sul Sito" : "🟡 In attesa di approvazione Admin"}
                      </Badge>
                      <Badge className="border-0 bg-accent/20 text-accent uppercase text-[10px]">
                        Tipo: {prop.tipo}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Proposto da: <b>{prop.autore}</b> ({prop.contatto}) · {prop.data}
                      </span>
                    </div>
                    <h3 className="text-base font-bold pt-1">{prop.titolo}</h3>
                    <p className="text-sm text-muted-foreground">
                      {prop.dati?.descrizione || prop.dati?.contesto || JSON.stringify(prop.dati)}
                    </p>
                    {prop.dati?.curiosita && (
                      <p className="text-xs text-accent">Dettaglio / Link / Curiosità: {prop.dati.curiosita}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {prop.tipo === "poi" && (
                      <select
                        value={raritaSceltaAdmin[prop.id] || prop.dati?.rarita || "Comune"}
                        onChange={(e) => setRaritaSceltaAdmin({ ...raritaSceltaAdmin, [prop.id]: e.target.value as RaritaPOI })}
                        className="h-9 rounded-md border border-border bg-background px-3 text-xs font-semibold"
                      >
                        {ORDINE_RARITA.map((r) => (
                          <option key={r} value={r}>{RARITA_STANDARD[r].label}</option>
                        ))}
                      </select>
                    )}
                    {prop.stato !== "Approvata" && (
                      <Button size="sm" onClick={() => decidiProposta(prop, "Approvata")}>
                        <CheckCircle2 className="mr-1 size-4" /> Approva / Aggiorna
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => decidiProposta(prop, "Rifiutata")}>
                      <XCircle className="mr-1 size-4" /> Rifiuta / Rimuovi
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
