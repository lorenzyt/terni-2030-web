import bandiRealiJson from "@/lib/bandi_reali.json";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink, FileText, Inbox, Lock, RefreshCw, Search, ShieldCheck, AlertTriangle, XCircle, Zap, MapPin } from "lucide-react";
import { TerniMap } from "@/components/TerniMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ORDINE_RARITA, RARITA_STANDARD, type RaritaPOI, type POI } from "@/lib/terni-data";
import { gestisciPropostaAdmin, inserisciPoiDirettoAdmin, eliminaPoiAdmin, modificaPoiAdmin, salvaAuditBandoCloud, getDossiersAdmin, eliminaDossierAdmin, modificaStatoDossierAdmin, useCivic, type AuditBando, type PropostaModerazione } from "@/lib/civic-store";

export const Route = createFileRoute("/regia")({
  head: () => ({
    meta: [
      { title: "Regia Controllo Bandi, Dossier & Moderazione — Terni 2030" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RegiaPage,
});

const CATEGORIE_POI: POI["categoria"][] = ["Architettura d'autore", "Arte pubblica", "Archeologia industriale", "Storia e fede"];

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
  const [tab, setTab] = useState<"bandi" | "dossier" | "proposte" | "luoghi">("bandi");
  const [ricerca, setRicerca] = useState("");
  const [filtroStato, setFiltroStato] = useState<string>("tutti");
  const [filtroPortale, setFiltroPortale] = useState<string>("tutti");
  const [bozze, setBozze] = useState<Record<string, { link: string; nota: string }>>({});
  const [raritaSceltaAdmin, setRaritaSceltaAdmin] = useState<Record<string, RaritaPOI>>({});
    const [inserimentoOpen, setInserimentoOpen] = useState(false);
  const [editModeId, setEditModeId] = useState<string | null>(null);
  const [formDir, setFormDir] = useState({
    titolo: "", autoreStorico: "", autoreScheda: "Lorenzo Covicchio", anno: "", categoria: "Architettura d'autore" as POI["categoria"],
    rarita: "Comune" as RaritaPOI, lat: "42.5636", lng: "12.6427", descrizione: "", immagine: "", articolo: ""
  });

  const salvaPoiDiretto = async () => {
    const titolo = formDir.titolo.trim() || "Luogo Senza Nome";
    const descrizione = formDir.descrizione.trim() || "Recati sul posto con il GPS per sbloccare la scheda e leggere il Dossier storico completo.";
    const infoRar = RARITA_STANDARD[formDir.rarita] || RARITA_STANDARD["Comune"];
    
    setInserimentoOpen(false);

    try {
      toast.info(editModeId ? "Aggiornamento in corso..." : "Invio al database in corso...");
      const payload = {
        titolo: titolo,
        autoreStorico: formDir.autoreStorico.trim() || "Non specificato",
        autoreScheda: formDir.autoreScheda.trim() || "Lorenzo Covicchio",
        anno: formDir.anno.trim() || "Storico / Contemporaneo",
        categoria: formDir.categoria || "Arte pubblica",
        rarita: formDir.rarita,
        punti: infoRar.punti,
        lat: parseFloat(formDir.lat) || 42.5636,
        lng: parseFloat(formDir.lng) || 12.6427,
        descrizione: descrizione,
        immagine: formDir.immagine.trim(),
        articolo: formDir.articolo.trim(),
      };
      
      if (editModeId) {
        await modificaPoiAdmin(editModeId, payload);
      } else {
        await inserisciPoiDirettoAdmin(payload);
      }
      
      await ricaricaCloud();
      setFormDir({ ...formDir, titolo: "", descrizione: "", immagine: "", articolo: "" });
      toast.success(editModeId ? "✅ Luogo aggiornato con successo!" : "✅ Luogo pubblicato! Controlla la mappa di Terni Urban GO.");
      setEditModeId(null);
    } catch (err: any) {
      toast.error(`❌ Errore di salvataggio DB: ${err.message}`);
    }
  };

  const eliminaPoi = async (id: string) => {
    if (!confirm("Sei sicuro di voler rimuovere definitivamente questo luogo dal sito?")) return;
    toast.info("Eliminazione in corso...");
    await eliminaPoiAdmin(id);
    await ricaricaCloud();
    toast.success("🗑️ Luogo rimosso dal sito.");
  };

  const usaMiaPosizioneNelForm = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormDir((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(5),
          lng: pos.coords.longitude.toFixed(5),
        }));
        toast.success("Coordinate GPS rilevate e inserite!");
      });
    }
  };

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
    await salvaAuditBandoCloud, getDossiersAdmin, eliminaDossierAdmin, modificaStatoDossierAdmin(k, b.titolo, record);
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
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
            setEditModeId(null);
            setFormDir({ titolo: "", autoreStorico: "", autoreScheda: "Lorenzo Covicchio", anno: "", categoria: "Architettura d'autore", rarita: "Comune", lat: "42.5636", lng: "12.6427", descrizione: "", immagine: "", articolo: "" });
            setInserimentoOpen(true);
          }}>
            <Zap className="mr-1 size-3.5" /> Inserimento Rapido POI
          </Button>
          <Button size="sm" variant={tab === "bandi" ? "default" : "secondary"} onClick={() => setTab("bandi")}>
            🔎 1. Verifica Bandi ({tuttiBandi.length})
          </Button>
          <Button size="sm" variant={tab === "dossier" ? "default" : "secondary"} onClick={() => setTab("dossier")}>
            📊 2. Dossier Generati ({state.dossierGenerati.length})
          </Button>
          <Button size="sm" variant={tab === "proposte" ? "default" : "secondary"} onClick={() => setTab("proposte")}>
            📥 3. Proposte da Approvare ({proposteInAttesa.length})
          </Button>
          <Button size="sm" variant={tab === "luoghi" ? "default" : "secondary"} onClick={() => setTab("luoghi")}>
            📍 4. Luoghi Pubblicati ({state.poiExtra.length})
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

      {tab === "dossier" && <PannelloDossier />}
      {tab === "dossier_vecchio" && (
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
          {proposteInAttesa.length === 0 ? (
            <div className="surface-panel p-8 text-center text-sm text-muted-foreground">
              <Inbox className="mx-auto mb-2 size-8 text-accent" />
              Nessuna candidatura o proposta in coda di moderazione. Quando un cittadino propone una scheda luogo, un'associazione per la bacheca, un sondaggio o un pin mappa, comparirà qui per la tua approvazione.
            </div>
          ) : (
            proposteInAttesa.map((prop) => (
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

      {tab === "luoghi" && (
        <div className="space-y-4">
          {state.poiExtra.length === 0 ? (
            <div className="surface-panel p-8 text-center text-sm text-muted-foreground">
              <MapPin className="mx-auto mb-2 size-8 text-accent" />
              Nessun luogo attualmente pubblicato sul TerniDex.
            </div>
          ) : (
            state.poiExtra.map((poi) => (
              <div key={poi.id} className="surface-panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-0 bg-emerald-500/20 text-emerald-400">🟢 Pubblicato</Badge>
                      <Badge variant="secondary">{poi.categoria}</Badge>
                      <Badge variant="outline" className="text-[10px] uppercase text-accent border-accent">{poi.rarita}</Badge>
                    </div>
                    <h3 className="text-base font-bold pt-1">{poi.nome}</h3>
                    <p className="text-sm text-muted-foreground">{poi.descrizione}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <MapPin className="inline size-3 mr-1" /> {poi.lat}, {poi.lng}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => {
                      setEditModeId(poi.id);
                      setFormDir({
                        titolo: poi.nome,
                        autoreStorico: poi.autore,
                        autoreScheda: (poi as any).autoreScheda || "Lorenzo Covicchio",
                        anno: poi.anno,
                        categoria: poi.categoria,
                        rarita: poi.rarita,
                        lat: String(poi.lat || "42.5636"),
                        lng: String(poi.lng || "12.6427"),
                        descrizione: poi.descrizione,
                        immagine: poi.immagine || "",
                        articolo: poi.articolo || "",
                      });
                      setInserimentoOpen(true);
                    }}>
                      ✏️ Modifica
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => eliminaPoi(poi.id)}>
                      🗑️ Rimuovi
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Dialog open={inserimentoOpen} onOpenChange={setInserimentoOpen}>
        <DialogContent className="z-[2000] max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="size-5 text-emerald-500" /> {editModeId ? "Modifica Luogo/POI" : "Inserimento Diretto Luogo/POI"}
            </DialogTitle>
            <DialogDescription>
              Pubblica istantaneamente una nuova scheda nel TerniDex senza passare dalla coda di moderazione.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label>Nome del Luogo / Architettura</Label>
                <Input value={formDir.titolo} onChange={(e) => setFormDir({ ...formDir, titolo: e.target.value })} />
              </div>
              <div>
                <Label>Autore storico / Architetto</Label>
                <Input value={formDir.autoreStorico} onChange={(e) => setFormDir({ ...formDir, autoreStorico: e.target.value })} placeholder="Es. Mario Ridolfi" />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label>Categoria</Label>
                <Input 
                  list="categorie-list" 
                  value={formDir.categoria} 
                  onChange={(e) => setFormDir({ ...formDir, categoria: e.target.value as POI["categoria"] })} 
                  placeholder="Seleziona o scrivi nuova..." 
                  className="mt-1 h-9 text-xs" 
                />
                <datalist id="categorie-list">
                  {CATEGORIE_POI.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <Label>Livello di Rarità</Label>
                <select
                  value={formDir.rarita}
                  onChange={(e) => setFormDir({ ...formDir, rarita: e.target.value as RaritaPOI })}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-xs font-semibold"
                >
                  {ORDINE_RARITA.map((r) => <option key={r} value={r}>{RARITA_STANDARD[r].label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Coordinate (Clicca sulla Mappa per impostare)</Label>
                <button type="button" onClick={usaMiaPosizioneNelForm} className="text-[11px] font-semibold text-accent hover:underline">
                  📍 Usa il mio GPS attuale
                </button>
              </div>
              <div className="h-[200px] w-full rounded-md border border-border overflow-hidden mb-2">
                <TerniMap 
                  center={[parseFloat(formDir.lat) || 42.5636, parseFloat(formDir.lng) || 12.6427]} 
                  zoom={15} 
                  pins={[{id:'preview', lat:parseFloat(formDir.lat)||42.5636, lng:parseFloat(formDir.lng)||12.6427, color:'#10b981', label:'Anteprima', popup:<span>Anteprima Posizione</span>}]} 
                  onMapClick={(lat, lng) => setFormDir({...formDir, lat: lat.toString(), lng: lng.toString()})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input value={formDir.lat} onChange={(e) => setFormDir({ ...formDir, lat: e.target.value })} placeholder="Latitudine" />
                <Input value={formDir.lng} onChange={(e) => setFormDir({ ...formDir, lng: e.target.value })} placeholder="Longitudine" />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label>Anno / Epoca</Label>
                <Input value={formDir.anno} onChange={(e) => setFormDir({ ...formDir, anno: e.target.value })} placeholder="Es. 1936" />
              </div>
              <div>
                <Label>Autore Scheda (Admin)</Label>
                <Input list="autori-admin-list" value={formDir.autoreScheda} onChange={(e) => setFormDir({ ...formDir, autoreScheda: e.target.value })} className="mt-1 h-9 text-xs" />
                <datalist id="autori-admin-list">
                  <option value="Lorenzo Covicchio" />
                  <option value="Thyrus IA" />
                </datalist>
              </div>
            </div>
            <div>
              <Label>Immagine Principale (URL Web)</Label>
              <Input value={formDir.immagine} onChange={(e) => setFormDir({ ...formDir, immagine: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Breve Anteprima (Sempre visibile a tutti)</Label>
              <Textarea value={formDir.descrizione} onChange={(e) => setFormDir({ ...formDir, descrizione: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Articolo Completo (Sbloccabile col GPS sul posto)</Label>
              <Textarea value={formDir.articolo} onChange={(e) => setFormDir({ ...formDir, articolo: e.target.value })} rows={5} />
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={salvaPoiDiretto}>
              <Zap className="mr-1.5 size-4" /> {editModeId ? "Salva Modifiche" : "Pubblica Subito sul Sito"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



function PannelloDossier() {
  const [lista, setLista] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getDossiersAdmin().then(d => { setLista(d); setLoading(false); });
  }, []);

  const handleElimina = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare definitivamente questo dossier dal database?")) return;
    await eliminaDossierAdmin(id);
    setLista(lista.filter(x => x.id !== id));
  };

  const handleStato = async (id: string, stato: string) => {
    await modificaStatoDossierAdmin(id, stato);
    setLista(lista.map(x => x.id === id ? { ...x, stato } : x));
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground text-sm font-bold">Caricamento dossier in corso...</div>;
  if (lista.length === 0) return <div className="p-8 text-center text-muted-foreground text-sm">Nessun dossier è stato ancora richiesto.</div>;

  return (
    <div className="space-y-4">
      {lista.map(d => {
        const dati = JSON.parse(d.descrizione || "{}");
        const email = dati.email || "Nessuna email";
        const isVenduto = d.stato === "Venduto";
        
        return (
          <div key={d.id} className="surface-panel p-5 border border-border rounded-xl">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <h3 className="font-bold text-accent text-base">{d.titolo}</h3>
                <p className="text-sm text-muted-foreground mt-1">📧 Email Contatto: <b className="text-white">{email}</b></p>
                <p className="text-xs mt-1 text-muted-foreground">Profilo: {dati.profilo || "ND"} | Quartiere: {dati.quartiere || "ND"} | Obiettivo: {dati.obiettivo || "ND"}</p>
                <div className="mt-3">
                  <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full ${isVenduto ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {d.stato}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <button 
                  className="px-3 py-1.5 text-xs font-bold rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors" 
                  onClick={() => window.location.href = `mailto:${email}?subject=Il tuo Dossier Terni 2030`}
                >
                  📧 Contatta
                </button>
                <button 
                  className="px-3 py-1.5 text-xs font-bold rounded bg-secondary text-white hover:bg-secondary/80 transition-colors" 
                  onClick={() => handleStato(d.id, isVenduto ? "Da Contattare" : "Venduto")}
                >
                  {isVenduto ? "Segna come Da Contattare" : "✅ Segna come Venduto"}
                </button>
                <button 
                  className="px-3 py-1.5 text-xs font-bold rounded bg-red-600 text-white hover:bg-red-500 transition-colors" 
                  onClick={() => handleElimina(d.id)}
                >
                  🗑️ Elimina
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
