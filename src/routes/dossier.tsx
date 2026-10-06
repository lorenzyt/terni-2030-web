import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, FileText, PhoneCall, Plus, Radar, Star, BadgeCheck, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BANDI, OBIETTIVI, PROFILI, QUARTIERI, type Bando } from "@/lib/terni-data";
import { COSTI_PREMI, nuovoId, oggi, useCivic } from "@/lib/civic-store";
import { useContact } from "@/components/ContactDialog";

type Search = { quartiere?: string; obiettivo?: string; caso?: string };

export const Route = createFileRoute("/dossier")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    ...(typeof s['quartiere'] === "string" ? { quartiere: s['quartiere'] } : {}),
    ...(typeof s['obiettivo'] === "string" ? { obiettivo: s['obiettivo'] } : {}),
    ...(typeof s['caso'] === "string" ? { caso: s['caso'] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Bandi & Dossier IA — Terni 2030" },
      { name: "description", content: "Radar dei portali bandi e dossier di fattibilità su misura per Terni: anteprima gratuita, PDF completo a 14,90 €." },
      { property: "og:title", content: "Bandi & Dossier IA — Terni 2030" },
      { property: "og:description", content: "Profilo, quartiere e obiettivo: i bandi attivi su misura per il tuo progetto a Terni." },
    ],
  }),
  component: DossierPage,
});

const STEPS = ["Profilo", "Quartiere", "Obiettivo", "Dossier"];

const PORTALI = [
  { nome: "Regione Umbria", n: 0, ambito: "FESR, FSE+, rigenerazione, borghi" },
  { nome: "Comune di Terni", n: 0, ambito: "Facciate, sfitti, commercio di vicinato" },
  { nome: "GSE", n: 0, ambito: "Conto Termico, CER, fotovoltaico" },
  { nome: "PNRR", n: 0, ambito: "Transizione energetica, inclusione, cultura" },
  { nome: "Invitalia", n: 0, ambito: "Nuove imprese, autoimpiego, startup" },
  { nome: "Camera di Commercio", n: 0, ambito: "Digitalizzazione, voucher, internazionalizzazione" },
];

const INDICE = [
  "Sintesi esecutiva e punteggio di fattibilità",
  "Profilo richiedente e requisiti soggettivi",
  "Inquadramento del quartiere e vincoli urbanistici",
  "Matrice di compatibilità normativa/finanziaria",
  "Scheda bando n.1 — requisiti e spese ammissibili",
  "Scheda bando n.2 — requisiti e spese ammissibili",
  "Cumulabilità con detrazioni e altri incentivi",
  "Quadro economico stimato dell'intervento",
  "Analisi costi/benefici e ritorno dell'investimento",
  "Cronoprogramma operativo",
  "Checklist documentale",
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
  const bandi: Bando[] = obCustom
    ? [BANDI['cultura']?.[0], BANDI['ristrutturazione']?.[1], BANDI['energia']?.[0]].filter((b): b is Bando => !!b).map((b) => ({ ...b, match: b.match - 12 }))
    : (BANDI[obiettivo] ?? []);
  const profiloNome = PROFILI.find((p) => p.id === profilo)?.nome ?? "";
  const obiettivoNome = obCustom?.titolo ?? OBIETTIVI.find((o) => o.id === obiettivo)?.nome ?? "";
  const scontoAttivo = state.scontoDossier || usaPunti;
  const prezzo = scontoAttivo ? "9,90 €" : "14,90 €";

  const avanti = () => {
    if (step === 0 && !profilo) return void toast.error("Seleziona il tuo profilo.");
    if (step === 1 && !quartiere) return void toast.error("Seleziona un quartiere di Terni.");
    if (step === 2 && !obiettivo) return void toast.error("Seleziona il tuo obiettivo.");
    setStep((s) => Math.min(s + 1, 3));
  };

  const aggiungiCustom = () => {
    if (!custom.titolo.trim()) return void toast.error("Dai un titolo al tuo obiettivo.");
    const nuovo = { id: nuovoId("oc"), titolo: custom.titolo.trim(), descrizione: custom.descrizione.trim(), area: custom.area || quartiere || "Centro" };
    update((s) => ({ ...s, obiettiviCommunity: [...s.obiettiviCommunity, nuovo] }));
    setObiettivo(nuovo.id);
    setCustom({ titolo: "", descrizione: "", area: "" });
    toast.success("Obiettivo personalizzato aggiunto e selezionato.");
  };

  const sblocca = () => {
    if (usaPunti && !state.scontoDossier) {
      if (puntiDisponibili < COSTI_PREMI.sconto) return void toast.error(`Servono ${COSTI_PREMI.sconto} Punti Esploratore.`);
      update((s) => ({ ...s, scontoDossier: true, puntiSpesi: s.puntiSpesi + COSTI_PREMI.sconto }));
    }
    contatta({
      oggetto: `Sblocco Dossier PDF — ${prezzo}`,
      contesto: `Profilo: ${profiloNome} · Quartiere: ${quartiere} · Obiettivo: ${obiettivoNome}${search.caso ? ` · Caso: ${search.caso}` : ""} · Prezzo: ${prezzo}`,
    });
  };

  const inviaRecensione = () => {
    if (!rec.testo.trim() || !rec.autore.trim()) return void toast.error("Inserisci nome e recensione.");
    update((s) => ({ ...s, recensioni: [{ id: nuovoId("r"), autore: rec.autore.trim(), ruolo: rec.ruolo.trim() || "Utente Terni 2030", stelle: rec.stelle, testo: rec.testo.trim(), data: oggi(), verificata: false }, ...s.recensioni] }));
    setRec({ autore: "", ruolo: "", stelle: 5, testo: "" });
    toast.success("Grazie! Recensione pubblicata.");
  };

  const media = state.recensioni.length ? state.recensioni.reduce((a, r) => a + r.stelle, 0) / state.recensioni.length : 0;
  const card = (sel: boolean) => `rounded-lg border p-4 text-left transition-colors ${sel ? "border-primary bg-secondary" : "border-border hover:bg-secondary/60"}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-8 text-center">
        <Badge variant="secondary" className="mb-3">Analisi eseguita dall'IA · curata da Lorenzo Covicchio</Badge>
        <h1 className="text-3xl font-bold md:text-4xl">Bandi & <span className="text-ember-gradient">Dossier IA</span></h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
          Tre domande per ottenere la fotografia delle agevolazioni attive su Terni, con stima di fattibilità e prossimi passi.
        </p>
      </div>

      <section className="surface-panel mb-6 p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Radar className="size-5 text-accent" /> Radar Portali Bandi Attivi</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          L'IA monitora i portali istituzionali, classifica ogni bando per beneficiari, area, spese ammissibili e scadenza, poi lo incrocia con profilo, quartiere e obiettivo per stimare una compatibilità preliminare teorica (da verificare sempre sul testo ufficiale).
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PORTALI.map((p) => (
            <div key={p.nome} className="rounded-md border border-border p-3">
              <p className="flex items-center justify-between text-sm font-semibold">{p.nome}<span className="text-accent">{p.n} bandi</span></p>
              <p className="text-xs text-muted-foreground">{p.ambito}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="surface-panel p-5 md:p-7">
        {search.caso && (
          <p className="mb-4 rounded-md border border-accent/40 bg-secondary/50 p-3 text-sm">
            Caso dalla mappa: <b>{search.caso}</b>
          </p>
        )}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-xs uppercase tracking-wide text-muted-foreground">
            {STEPS.map((s, i) => <span key={s} className={i <= step ? "text-accent" : ""}>{i + 1}. {s}</span>)}
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
        </div>

        {step === 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {PROFILI.map((p) => (
              <button key={p.id} onClick={() => setProfilo(p.id)} className={card(profilo === p.id)}>
                <p className="font-semibold">{p.nome}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-wrap gap-2">
            {QUARTIERI.map((q) => (
              <button key={q} onClick={() => setQuartiere(q)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${quartiere === q ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                {q}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Obiettivi di Default</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {OBIETTIVI.map((o) => (
                  <button key={o.id} onClick={() => setObiettivo(o.id)} className={card(obiettivo === o.id)}>
                    <p className="font-semibold">{o.nome}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">Proposti dai Cittadini (Community) · {quartiere || "tutti i quartieri"}</p>
              {communityOb.length === 0 && <p className="text-xs text-muted-foreground">Nessuna proposta per questo quartiere: sii il primo.</p>}
              <div className="grid gap-3 sm:grid-cols-2">
                {communityOb.map((o) => (
                  <button key={o.id} onClick={() => setObiettivo(o.id)} className={`${card(obiettivo === o.id)} border-dashed`}>
                    <Badge className="mb-1 border-0 bg-accent/20 text-[10px] text-accent">Community · {o.area}</Badge>
                    <p className="font-semibold">{o.titolo}</p>
                    <p className="text-xs text-muted-foreground">{o.descrizione}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-dashed border-accent/60 p-4">
              <p className="mb-3 flex items-center gap-1 font-semibold"><Plus className="size-4" /> Aggiungi Obiettivo Personalizzato / Proposta Specifica</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>Titolo</Label><Input value={custom.titolo} onChange={(e) => setCustom({ ...custom, titolo: e.target.value })} /></div>
                <div>
                  <Label>Area</Label>
                  <Select value={custom.area || quartiere || "Centro"} onValueChange={(v) => setCustom({ ...custom, area: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{QUARTIERI.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3"><Label>Descrizione</Label><Textarea value={custom.descrizione} onChange={(e) => setCustom({ ...custom, descrizione: e.target.value })} /></div>
              <Button size="sm" className="mt-3" onClick={aggiungiCustom}>Aggiungi e seleziona</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-surface-2 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Dossier di fattibilità · anteprima gratuita</p>
              <h2 className="mt-1 text-xl font-semibold">{obiettivoNome} — {quartiere}</h2>
              <p className="text-sm text-muted-foreground">Profilo: {profiloNome}{obCustom ? " · obiettivo della community" : ""}</p>
            </div>

            <div className="space-y-3">
              {bandi.map((b) => (
                <div key={b.nome} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{b.nome}</h3>
                    <Badge className="border-0 bg-accent text-accent-foreground">compatibilità {b.match}%</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{b.ente}</p>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p><span className="text-muted-foreground">Contributo: </span>{b.contributo}</p>
                    <p><span className="text-muted-foreground">Scadenza: </span>{b.scadenza}</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{b.nota}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 font-semibold"><FileText className="size-5 text-accent" /> Anteprima del Dossier PDF completo · 14 pagine</h3>
                <Badge variant="secondary">estratto reale</Badge>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Indice</p>
                  <ol className="space-y-1 text-sm">
                    {INDICE.map((t, i) => (
                      <li key={t} className="flex gap-2"><span className="w-6 text-right font-mono text-xs text-accent">{i + 1}</span>{t}</li>
                    ))}
                  </ol>
                </div>
                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Matrice di compatibilità (pag. 4)</p>
                    <table className="w-full text-xs">
                      <thead><tr className="text-left text-muted-foreground"><th className="py-1">Bando</th><th>Requisiti</th><th>Area</th><th>Cumulabile</th></tr></thead>
                      <tbody>
                        {bandi.map((b) => (
                          <tr key={b.nome} className="border-t border-border">
                            <td className="py-1.5 pr-2">{b.nome}</td>
                            <td>{b.match >= 85 ? "✔ pieno" : "◐ parziale"}</td>
                            <td>✔ {quartiere}</td>
                            <td>{b.match >= 80 ? "✔" : "verificare"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cronoprogramma operativo (pag. 10)</p>
                    {[["Mese 1", "Verifica requisiti e sopralluogo tecnico", 15], ["Mese 2", "Progetto, preventivi e documentazione", 40], ["Mese 3", "Presentazione della domanda", 60], ["Mesi 4-9", "Istruttoria, avvio e rendicontazione lavori", 100]].map(([m, t, w]) => (
                      <div key={m as string} className="mb-2 text-xs">
                        <p><b>{m}</b> · {t}</p>
                        <div className="mt-1 h-1.5 rounded bg-secondary"><div className="h-1.5 rounded bg-primary" style={{ width: `${w}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-secondary/50 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Prezzo di lancio</p>
                  <p className="font-display text-3xl font-bold">
                    {scontoAttivo && <span className="mr-2 text-lg text-muted-foreground line-through">14,90 €</span>}
                    {prezzo}
                  </p>
                  {state.scontoDossier ? (
                    <p className="flex items-center gap-1 text-xs text-accent"><Award className="size-3" /> Sconto Punti Esploratore già attivo</p>
                  ) : (
                    <label className="mt-1 flex items-center gap-2 text-xs">
                      <Switch checked={usaPunti} onCheckedChange={setUsaPunti} disabled={puntiDisponibili < COSTI_PREMI.sconto} />
                      Usa {COSTI_PREMI.sconto} Punti Esploratore (ne hai {puntiDisponibili}) → 9,90 €
                    </label>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={sblocca}><FileText className="size-4" /> Sblocca PDF — {prezzo}</Button>
                  <Button variant="outline" onClick={() => contatta({ oggetto: "Richiedi consulenza", contesto: `Dossier — Profilo: ${profiloNome} · Quartiere: ${quartiere} · Obiettivo: ${obiettivoNome}` })}>
                    <PhoneCall className="size-4" /> Richiedi consulenza
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-7 flex justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            <ArrowLeft className="size-4" /> Indietro
          </Button>
          {step < 3 ? (
            <Button onClick={avanti}>{step === 2 ? "Genera dossier" : "Avanti"} <ArrowRight className="size-4" /></Button>
          ) : (
            <Button variant="secondary" onClick={() => { setStep(0); setProfilo(""); setQuartiere(""); setObiettivo(""); }}>
              <Check className="size-4" /> Nuovo dossier
            </Button>
          )}
        </div>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-2xl font-bold">Esperienze e Recensioni sul Dossier</h2>
          <p className="flex items-center gap-2 text-sm"><Stelle n={Math.round(media)} /> {media.toFixed(1)} su 5 · {state.recensioni.length} recensioni</p>
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
            <div><Label>Ruolo (cittadino, tecnico, commerciante…)</Label><Input value={rec.ruolo} onChange={(e) => setRec({ ...rec, ruolo: e.target.value })} /></div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">Valutazione: <Stelle n={rec.stelle} onSet={(v) => setRec({ ...rec, stelle: v })} /></div>
          <Textarea className="mt-3" value={rec.testo} onChange={(e) => setRec({ ...rec, testo: e.target.value })} placeholder="Com'è andata con il Dossier?" />
          <Button className="mt-3" onClick={inviaRecensione}>Pubblica recensione</Button>
        </div>
      </section>
    </div>
  );
}
