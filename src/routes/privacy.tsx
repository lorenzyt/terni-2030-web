import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShieldCheck, Lock, Eye, Server, MapPin, Cookie, Mail, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & Cookie Policy (GDPR) — Terni 2030" },
      {
        name: "description",
        content: "Informativa sul trattamento dei dati personali e Cookie Policy ai sensi dell'art. 13 del Regolamento UE 2016/679 (GDPR).",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const [statoConsenso, setStatoConsenso] = useState<string>("Non espresso");

  useEffect(() => {
    try {
      const c = localStorage.getItem("terni2030_cookie_consent");
      if (c === "accepted") setStatoConsenso("Tutti i cookie accettati (Analitici inclusi)");
      else if (c === "declined") setStatoConsenso("Solo cookie tecnici essenziali");
      else setStatoConsenso("In attesa di scelta");
    } catch {}
  }, []);

  const aggiornaConsenso = (val: "accepted" | "declined") => {
    try {
      localStorage.setItem("terni2030_cookie_consent", val);
      setStatoConsenso(val === "accepted" ? "Tutti i cookie accettati (Analitici inclusi)" : "Solo cookie tecnici essenziali");
      toast.success("Preferenze privacy aggiornate con successo.");
    } catch {}
  };

  const resettaBanner = () => {
    try {
      localStorage.removeItem("terni2030_cookie_consent");
      setStatoConsenso("In attesa di scelta");
      toast.info("Preferenze azzerate. Ricarica la pagina per rivedere il banner.");
    } catch {}
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 space-y-8 animate-fade-up">
      <div className="border-b border-border pb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
          <ShieldCheck className="size-3.5" /> Conformità Regolamento UE 2016/679 (GDPR)
        </span>
        <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">Informativa Privacy & Cookie Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ultimo aggiornamento: Ottobre 2026 · Documento redatto in conformità agli artt. 13 e 14 del GDPR e alle Linee Guida del Garante Privacy.
        </p>
      </div>

      {/* PANNELLO GESTIONE IMMEDIATA CONSENSO COOKIE */}
      <section className="surface-panel border border-accent/40 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Cookie className="size-6 text-accent shrink-0" />
            <div>
              <h2 className="text-base font-bold">Il tuo stato attuale del consenso Cookie</h2>
              <p className="text-xs text-muted-foreground">
                Stato registrato sul tuo browser: <b className="text-accent">{statoConsenso}</b>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => aggiornaConsenso("declined")}>
              Usa Solo Essenziali
            </Button>
            <Button size="sm" variant="default" onClick={() => aggiornaConsenso("accepted")}>
              <CheckCircle2 className="mr-1.5 size-3.5" /> Accetta Analitici
            </Button>
            <Button size="sm" variant="ghost" onClick={resettaBanner}>
              <RotateCcw className="mr-1 size-3.5" /> Reset
            </Button>
          </div>
        </div>
      </section>

      {/* 1. TITOLARE DEL TRATTAMENTO */}
      <section className="surface-panel border rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-bold flex items-center gap-2 text-accent">
          <Lock className="size-5" /> 1. Titolare del Trattamento dei Dati
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Il Titolare del trattamento dei dati raccolti tramite la piattaforma civica <b>Terni 2030</b> è l'Autore e Curatore del progetto:
        </p>
        <ul className="list-disc pl-5 text-sm space-y-1 text-foreground">
          <li><b>Titolare:</b> Lorenzo Covicchio</li>
          <li><b>Email di contatto ordinaria:</b> <a href="mailto:Terni.2030@outlook.it" className="text-accent underline">Terni.2030@outlook.it</a></li>
          <li><b>Domicilio Digitale / PEC ufficiale:</b> <a href="mailto:lorenzo.covicchio@pec.it" className="font-mono text-accent underline">lorenzo.covicchio@pec.it</a></li>
          <li><b>Ambito territoriale:</b> Comune di Terni (TR), Umbria, Italia</li>
        </ul>
      </section>

      {/* 2. TIPOLOGIA DI DATI TRATTATI E FINALITA */}
      <section className="surface-panel border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2 text-accent">
          <Eye className="size-5" /> 2. Quali dati raccogliamo e perché (Finalità e Base Giuridica)
        </h2>
        <div className="grid gap-4 md:grid-cols-2 text-xs leading-relaxed">
          <div className="rounded-lg border border-border bg-background/60 p-4">
            <b className="text-foreground text-sm block mb-1">A. Richiesta Dossier Bandi IA & Contatti</b>
            Quando richiedi la verifica di un Dossier nella pagina <i>Bandi & Dossier IA</i> o compili il modulo di contatto, raccogliamo il tuo <b>indirizzo email</b>, il profilo scelto (Cittadino, Impresa, Ente), il quartiere di riferimento e l'obiettivo progettuale.
            <br /><span className="text-accent font-semibold">Base giuridica:</span> Esecuzione di misure precontrattuali o contrattuali richieste dall'interessato (art. 6, par. 1, lett. b GDPR).
          </div>

          <div className="rounded-lg border border-border bg-background/60 p-4">
            <b className="text-foreground text-sm block mb-1">B. Registrazione Area Cittadino & TerniDex</b>
            Se crei volontariamente un profilo utente (tramite Email Magic Link o Google OAuth), memorizziamo il tuo indirizzo email e i progressi ludico-civici (luoghi sbloccati nel TerniDex e Punti Esploratore) per permetterti di conservarli su più dispositivi.
            <br /><span className="text-accent font-semibold">Base giuridica:</span> Esecuzione di un servizio richiesto dall'utente (art. 6, par. 1, lett. b GDPR).
          </div>

          <div className="rounded-lg border border-border bg-background/60 p-4">
            <b className="text-foreground text-sm block mb-1">C. Segnalazioni Mappa GIS & Proposte Civiche</b>
            Le segnalazioni urbane, i commenti e le proposte di nuovi luoghi/sondaggi vengono sottoposti a moderazione prima della pubblicazione. Il nome autore è facoltativo (puoi pubblicare come "Cittadino").
            <br /><span className="text-accent font-semibold">Base giuridica:</span> Consenso dell'interessato manifestato tramite l'invio spontaneo del contributo (art. 6, par. 1, lett. a GDPR).
          </div>

          <div className="rounded-lg border border-border bg-background/60 p-4">
            <b className="text-foreground text-sm block mb-1 flex items-center gap-1">
              <MapPin className="size-3.5 text-emerald-400" /> D. Geolocalizzazione GPS (Terni Urban-Go)
            </b>
            Quando attivi il <i>Radar GPS</i> per sbloccare un monumento a meno di 150 metri, il calcolo della distanza avviene <b>esclusivamente in locale sul tuo telefono/browser</b>. Le tue coordinate GPS personali <b>non vengono mai inviate né salvate</b> sui nostri server.
          </div>
        </div>
      </section>

      {/* 3. INFRASTRUTTURA TECNICA E SUB-RESPONSABILI */}
      <section className="surface-panel border rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-bold flex items-center gap-2 text-accent">
          <Server className="size-5" /> 3. Infrastruttura Cloud, Sicurezza e Conservazione
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          I dati sono trattati con strumenti informatici protetti da protocollo crittografico HTTPS/TLS e non vengono mai ceduti a terzi per finalità di marketing:
        </p>
        <ul className="list-disc pl-5 text-xs space-y-2 text-muted-foreground">
          <li>
            <b className="text-foreground">Hosting & Statistiche Anonimizzate (Vercel Inc.):</b> Il sito è ospitato su infrastruttura cloud Vercel. Il servizio <i>Vercel Web Analytics</i> raccoglie metriche aggregate di navigazione senza utilizzare cookie di profilazione e senza tracciare l'indirizzo IP in chiaro dei visitatori.
          </li>
          <li>
            <b className="text-foreground">Database & Autenticazione (Supabase):</b> I dati delle segnalazioni civiche, dei profili registrati e dei Dossier sono archiviati su database PostgreSQL protetto da criteri <i>Row Level Security (RLS)</i>.
          </li>
          <li>
            <b className="text-foreground">Memoria Locale Tecnica (localStorage):</b> Utilizziamo il <i>localStorage</i> del tuo browser esclusivamente per ricordare la tua scelta sul banner cookie (`terni2030_cookie_consent`) e i tuoi voti/check-in locali.
          </li>
        </ul>
      </section>

      {/* 4. DIRITTI DELL'INTERESSATO */}
      <section className="surface-panel border rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-bold flex items-center gap-2 text-accent">
          <Mail className="size-5" /> 4. Diritti dell'Interessato (Artt. 15–22 GDPR)
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          In qualsiasi momento hai il diritto di chiedere al Titolare l'accesso ai tuoi dati personali, la rettifica, la cancellazione immediata (<i>Diritto all'Oblio</i>) di un tuo Dossier, account o segnalazione, nonché la limitazione o l'opposizione al trattamento, scrivendo a <a href="mailto:Terni.2030@outlook.it" className="text-accent underline">Terni.2030@outlook.it</a> o via PEC a <a href="mailto:lorenzo.covicchio@pec.it" className="text-accent underline">lorenzo.covicchio@pec.it</a>. Hai inoltre il diritto di proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).
        </p>
        <div className="pt-2">
          <Link to="/" className="text-xs font-bold text-accent hover:underline">
            ← Torna alla Home di Terni 2030
          </Link>
        </div>
      </section>
    </div>
  );
}
