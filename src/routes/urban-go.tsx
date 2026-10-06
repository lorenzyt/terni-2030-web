import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Award, BadgeCheck, CheckCircle2, Compass, ExternalLink, Gift, Heart,
  Lock, MapPin, Megaphone, Navigation, Plus, ShieldCheck, Sparkles, Trophy, Users
} from "lucide-react";
import { TerniMap } from "@/components/TerniMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BACHECA, PARTNERS, POI_LIST, TERNI_CENTER, type POI } from "@/lib/terni-data";
import { COSTI_PREMI, inviaPropostaModerazione, useCivic } from "@/lib/civic-store";

export const Route = createFileRoute("/urban-go")({
  head: () => ({
    meta: [
      { title: "Terni Urban GO & TerniDex GPS — Terni 2030" },
      { name: "description", content: "Avvicinati fisicamente ai monumenti di Terni, sblocca il TerniDex con il GPS, leggi gli articoli e ottieni ricompense." },
    ],
  }),
  component: UrbanGo,
});

const COLORI_POI: Record<POI["categoria"], string> = {
  "Architettura d'autore": "#e8b23a",
  "Arte pubblica": "#e2603a",
  "Archeologia industriale": "#8f9aa8",
  "Storia e fede": "#d84a6d",
};

const RAGGIO_SBLOCCO_METRI = 150;

// Formula di Haversine per calcolare la distanza reale in metri tra smartphone e monumento
function calcolaDistanzaMetri(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function calcolaGradoEsploratore(perc: number): string {
  if (perc >= 100) return "🏆 Maestro Leggendario di Terni 2030";
  if (perc >= 60) return "⚡ Custode d'Acciaio di Interamna";
  if (perc >= 25) return "🧭 Esploratore Urbano Certificato";
  return "🌱 Novizio della Conca";
}

function UrbanGo() {
  const { state, update, puntiGuadagnati, puntiDisponibili } = useCivic();
  const tuttiPoi: POI[] = [...POI_LIST, ...state.poiExtra];
  const tuttaBacheca = [...BACHECA, ...state.bachecaExtra];
  const esplorati = state.checkin;

  const [attivo, setAttivo] = useState<POI | undefined>(tuttiPoi[0]);
  const [premiOpen, setPremiOpen] = useState(false);
  const [ternidexOpen, setTernidexOpen] = useState(false);
  const [candidaturaOpen, setCandidaturaOpen] = useState(false);
  const [tipoCandidatura, setTipoCandidatura] = useState<"poi" | "bacheca" | "sondaggio">("poi");

  // Stato GPS Live in stile Pokémon GO
  const [gpsAttivo, setGpsAttivo] = useState(false);
  const [posUtente, setPosUtente] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modulo candidatura sottoposto a permesso Admin
  const [formProp, setFormProp] = useState({
    autore: "",
    contatto: "",
    titolo: "",
    sottotitolo: "",
    categoriaPoi: "Architettura d'autore" as POI["categoria"],
    lat: "42.5636",
    lng: "12.6427",
    descrizione: "",
    curiosita: "",
    opzione1: "",
    opzione2: "",
    opzione3: "",
  });

  useEffect(() => {
    try {
      setIsAdmin(Boolean(sessionStorage.getItem("terni2030_regia_op")));
    } catch {}
  }, []);

  const attivaRadarGps = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Il tuo browser o dispositivo non supporta il GPS.");
      return;
    }
    toast.info("Aggancio satelliti GPS in corso...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosUtente({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: Math.round(pos.coords.accuracy),
        });
        setGpsAttivo(true);
        toast.success("📡 Radar GPS attivo! Avvicinati a meno di 150m dai monumenti per sbloccarli.");
      },
      () => {
        toast.error("Permesso GPS negato. Abilita la posizione nel browser per giocare a Terni Urban GO.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const puntiTotali = tuttiPoi.reduce((a, p) => a + p.punti, 0);
  const percTernidex = tuttiPoi.length > 0 ? Math.round((esplorati.length / tuttiPoi.length) * 100) : 0;
  const gradoUtente = calcolaGradoEsploratore(percTernidex);

  const tentaCheckinGps = (poi: POI, forzaAdmin = false) => {
    const giaFatto = esplorati.includes(poi.id);
    if (giaFatto) {
      toast.info(`${poi.nome} è già registrato nel tuo TerniDex!`);
      return;
    }

    if (!forzaAdmin) {
      if (!posUtente) {
        toast.error("📡 Attiva prima il Radar GPS in alto per verificare che ti trovi vicino al monumento!");
        attivaRadarGps();
        return;
      }
      const dist = calcolaDistanzaMetri(posUtente.lat, posUtente.lng, poi.lat, poi.lng);
      if (dist > RAGGIO_SBLOCCO_METRI) {
        toast.error(
          `Sei a ${dist} metri da «${poi.nome}». Avvicinati a meno di ${RAGGIO_SBLOCCO_METRI}m per riscuotere +${poi.punti} pt e sbloccare l'articolo!`
        );
        return;
      }
    }

    update((s) => ({ ...s, checkin: [...s.checkin, poi.id] }));
    setAttivo(poi);
    toast.success(`🎉 Monumento sbloccato nel TerniDex! +${poi.punti} Punti Esploratore — Ora puoi leggere il dossier storico!`);
  };

  const spendi = (costo: number, patch: (s: typeof state) => typeof state, msg: string) => {
    if (puntiDisponibili < costo) return void toast.error(`Servono ${costo} punti: ne hai ${puntiDisponibili}.`);
    update((s) => ({ ...patch(s), puntiSpesi: s.puntiSpesi + costo }));
    toast.success(msg);
  };

  const inviaCandidatura = async () => {
    if (!formProp.autore.trim() || !formProp.titolo.trim() || !formProp.descrizione.trim()) {
      return void toast.error("Compila nome proponente, titolo e descrizione.");
    }

    if (tipoCandidatura === "poi") {
      await inviaPropostaModerazione({
        tipo: "poi",
        titolo: formProp.titolo.trim(),
        autore: formProp.autore.trim(),
        contatto: formProp.contatto.trim(),
        dati: {
          nome: formProp.titolo.trim(),
          autore: formProp.sottotitolo.trim() || "Architettura Ternana",
          anno: "Storico / Contemporaneo",
          categoria: formProp.categoriaPoi,
          lat: parseFloat(formProp.lat) || 42.5636,
          lng: parseFloat(formProp.lng) || 12.6427,
          punti: 75,
          descrizione: formProp.descrizione.trim(),
          curiosita: formProp.curiosita.trim() || "Luogo candidato dai cittadini e validato dalla Regia.",
        },
      });
    } else if (tipoCandidatura === "bacheca") {
      await inviaPropostaModerazione({
        tipo: "bacheca",
        titolo: formProp.titolo.trim(),
        autore: formProp.autore.trim(),
        contatto: formProp.contatto.trim(),
        dati: {
          nome: formProp.titolo.trim(),
          tipo: "Associazione",
          ambito: formProp.sottotitolo.trim() || "Attivismo & Territorio",
          descrizione: formProp.descrizione.trim(),
          contatto: formProp.contatto.trim(),
          link: formProp.curiosita.trim() || "#",
        },
      });
    } else {
      const opzioni = [formProp.opzione1, formProp.opzione2, formProp.opzione3]
        .map((x) => x.trim())
        .filter(Boolean)
        .map((testo, i) => ({ id: `op${i + 1}`, testo, voti: 0 }));
      await inviaPropostaModerazione({
        tipo: "sondaggio",
        titolo: formProp.titolo.trim(),
        autore: formProp.autore.trim(),
        contatto: formProp.contatto.trim(),
        dati: {
          domanda: formProp.titolo.trim(),
          contesto: formProp.descrizione.trim(),
          opzioni: opzioni.length >= 2 ? opzioni : [
            { id: "a", testo: "Favorevole / Prioritario", voti: 0 },
            { id: "b", testo: "Contrario / Altra priorità", voti: 0 },
          ],
        },
      });
    }

    setFormProp({
      autore: "", contatto: "", titolo: "", sottotitolo: "",
      categoriaPoi: "Architettura d'autore", lat: "42.5636", lng: "12.6427",
      descrizione: "", curiosita: "", opzione1: "", opzione2: "", opzione3: "",
    });
    setCandidaturaOpen(false);
    toast.success("Candidatura inviata alla Regia! Sarà pubblicata dopo la verifica dell'amministratore.");
  };

  const pins = tuttiPoi.map((p) => {
    const sbloccato = esplorati.includes(p.id);
    const dist = posUtente ? calcolaDistanzaMetri(posUtente.lat, posUtente.lng, p.lat, p.lng) : null;
    return {
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      color: sbloccato ? "#22c55e" : COLORI_POI[p.categoria],
      label: p.nome,
      glow: !sbloccato,
      popup: (
        <div className="space-y-2">
          <p className="font-semibold">{p.nome}</p>
          <p className="text-xs opacity-80">{p.autore} · {p.anno}</p>
          {dist !== null && (
            <p className="text-[11px] font-mono">
              📍 Distanza da te: <b>{dist} m</b> {dist <= RAGGIO_SBLOCCO_METRI ? "🟢 (In raggio!)" : "🔒 (Avvicinati)"}
            </p>
          )}
          <button
            onClick={() => tentaCheckinGps(p)}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
          >
            {sbloccato ? "✔ Sbloccato nel TerniDex" : `📡 Sblocca col GPS (+${p.punti} pt)`}
          </button>
        </div>
      ),
    };
  });

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
      {/* Barra Superiore: Titolo + Radar GPS + TerniDex + Premi */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="secondary" className="mb-2">
            Geolocalizzazione Reale · Sblocco entro {RAGGIO_SBLOCCO_METRI} metri
          </Badge>
          <h1 className="text-3xl font-bold md:text-4xl">
            Terni <span className="text-ember-gradient">Urban GO</span> & TerniDex
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Avvicinati fisicamente alle architetture e ai monumenti di Terni per riscuotere i Punti Esploratore, sbloccare gli articoli storici e completare il tuo TerniDex.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={gpsAttivo ? "secondary" : "default"}
            onClick={attivaRadarGps}
            className="h-auto py-2.5"
          >
            <Navigation className={`mr-2 size-4 ${gpsAttivo ? "text-emerald-400" : ""}`} />
            {gpsAttivo && posUtente
              ? `Radar GPS Attivo (±${posUtente.acc}m)`
              : "📡 Attiva Radar GPS sul Campo"}
          </Button>

          <button
            onClick={() => setTernidexOpen(true)}
            className="surface-panel flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:border-accent"
          >
            <Trophy className="size-6 text-accent" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent">
                TerniDex: {esplorati.length}/{tuttiPoi.length} ({percTernidex}%)
              </p>
              <p className="text-[11px] text-muted-foreground">{gradoUtente}</p>
              <Progress value={percTernidex} className="mt-1 h-1.5 w-36" />
            </div>
          </button>

          <button
            onClick={() => setPremiOpen(true)}
            className="surface-panel flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:border-accent"
          >
            <Award className="size-6 text-accent" />
            <div>
              <p className="text-sm font-semibold">{puntiDisponibili} pt disponibili</p>
              <p className="text-[11px] text-muted-foreground">{puntiGuadagnati}/{puntiTotali} pt · Riscuoti Premi →</p>
            </div>
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <div className="h-[460px] overflow-hidden rounded-xl border border-border metal-edge">
            <TerniMap center={posUtente ? [posUtente.lat, posUtente.lng] : TERNI_CENTER} zoom={14} pins={pins} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {tuttiPoi.map((p) => {
              const fatto = esplorati.includes(p.id);
              const dist = posUtente ? calcolaDistanzaMetri(posUtente.lat, posUtente.lng, p.lat, p.lng) : null;
              const inRaggio = dist !== null && dist <= RAGGIO_SBLOCCO_METRI;

              return (
                <article
                  key={p.id}
                  onClick={() => setAttivo(p)}
                  className={`surface-panel cursor-pointer p-4 transition-all ${attivo?.id === p.id ? "border-primary/70" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className="border-0" style={{ backgroundColor: `${COLORI_POI[p.categoria]}22`, color: COLORI_POI[p.categoria] }}>
                        {p.categoria}
                      </Badge>
                      {p.rarita && <Badge variant="secondary" className="text-[10px]">{p.rarita}</Badge>}
                    </div>
                    {fatto ? (
                      <Badge className="border-0 bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="mr-1 size-3.5" /> Scoperto
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        <Lock className="mr-1 size-3" /> Bloccato
                      </Badge>
                    )}
                  </div>

                  <h3 className="mt-2 font-semibold leading-tight">{p.nome}</h3>
                  <p className="text-xs text-muted-foreground">{p.autore} · {p.anno}</p>

                  {dist !== null && (
                    <p className={`mt-2 text-xs font-mono ${inRaggio ? "text-emerald-400 font-semibold" : "text-muted-foreground"}`}>
                      📍 Distanza attuale: {dist} metri {inRaggio ? "— Sei sul posto! Sblocca ora!" : `(Avvicinati a <${RAGGIO_SBLOCCO_METRI}m)`}
                    </p>
                  )}

                  <p className="mt-2 text-sm text-muted-foreground">
                    {fatto ? p.descrizione : `${p.descrizione.slice(0, 75)}... [Avvicinati col GPS per sbloccare la scheda completa]`}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={fatto ? "secondary" : "default"}
                      onClick={(e) => {
                        e.stopPropagation();
                        tentaCheckinGps(p);
                      }}
                    >
                      {fatto ? (
                        <><CheckCircle2 className="mr-1 size-4 text-emerald-400" /> Riscosso (+{p.punti} pt)</>
                      ) : (
                        <><Compass className="mr-1 size-4" /> Check-in GPS · +{p.punti} pt</>
                      )}
                    </Button>

                    {isAdmin && !fatto && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          tentaCheckinGps(p, true);
                        }}
                      >
                        🔓 Sblocco Test Admin
                      </Button>
                    )}

                    {fatto && (
                      <Button size="sm" variant="ghost" className="text-accent" asChild onClick={(e) => e.stopPropagation()}>
                        <Link to="/articoli/$id" params={{ id: p.id }}>Leggi Articolo Sbloccato →</Link>
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <section className="surface-panel p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Megaphone className="size-5 text-accent" /> Bacheca Territorio, Luoghi & Sondaggi Cittadini
                </h2>
                <p className="text-xs text-muted-foreground">
                  Proponi nuove schede monumento, associazioni o sondaggi: ogni proposta viene verificata dalla Regia Admin prima della pubblicazione.
                </p>
              </div>
              <Button size="sm" onClick={() => setCandidaturaOpen(true)}>
                <Plus className="mr-1 size-4" /> Candidati / Proponi alla Regia
              </Button>
            </div>

            {state.postSocial.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nessuna iniziativa pubblicata al momento. Usa il pulsante «Candidati / Proponi alla Regia» per sottoporre la prima proposta all'amministratore.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {state.postSocial.map((p) => (
                  <div key={p.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{p.pagina}</p>
                      <Badge variant="secondary">{p.tipo}</Badge>
                    </div>
                    <p className="mt-2 text-sm">{p.testo}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <button
                        className="flex items-center gap-1 hover:text-primary"
                        onClick={() =>
                          update((s) => ({
                            ...s,
                            postSocial: s.postSocial.map((x) => (x.id === p.id ? { ...x, reazioni: x.reazioni + 1 } : x)),
                          }))
                        }
                      >
                        <Heart className="size-3" /> {p.reazioni}
                      </button>
                      <span>{p.data}</span>
                      {p.link !== "#" && (
                        <a href={p.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-accent">
                          Apri link <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <div className="surface-panel p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="size-4 text-accent" /> Dossier Storico & Curiosità
            </h2>
            {attivo ? (
              esplorati.includes(attivo.id) ? (
                <>
                  <Badge className="mt-3 border-0 bg-emerald-500/20 text-emerald-400">
                    🔓 Sbloccato nel tuo TerniDex
                  </Badge>
                  <h3 className="mt-2 text-lg font-semibold">{attivo.nome}</h3>
                  <p className="text-xs text-muted-foreground">{attivo.autore} · {attivo.anno}</p>
                  <p className="mt-3 text-sm">{attivo.descrizione}</p>
                  <p className="mt-3 rounded-md border border-border bg-surface-2 p-3 text-sm text-muted-foreground">
                    <span className="font-semibold text-accent">Curiosità segreta sbloccata: </span>
                    {attivo.curiosita}
                  </p>
                  <Button className="mt-4 w-full" asChild>
                    <Link to="/articoli/$id" params={{ id: attivo.id }}>
                      Leggi l'articolo d'autore completo →
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-border p-5 text-center">
                  <Lock className="mx-auto mb-2 size-8 text-muted-foreground" />
                  <h3 className="font-semibold">{attivo.nome}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Questo dossier storico è ancora bloccato. Recati a meno di <b>{RAGGIO_SBLOCCO_METRI} metri</b> dal monumento con il Radar GPS attivo e premi <b>Check-in GPS</b> per sbloccare l'articolo e ricevere <b>+{attivo.punti} punti</b>!
                  </p>
                  <Button size="sm" className="mt-4" onClick={() => tentaCheckinGps(attivo)}>
                    <Navigation className="mr-1.5 size-3.5" /> Verifica Posizione GPS Ora
                  </Button>
                </div>
              )
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Seleziona un monumento sulla mappa.</p>
            )}
          </div>

          <div className="surface-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Users className="size-4 text-accent" /> Bacheca del Territorio
              </h2>
              <Button size="sm" variant="ghost" className="text-xs text-accent" onClick={() => setCandidaturaOpen(true)}>
                + Proponi
              </Button>
            </div>
            <div className="mt-3 space-y-3">
              {tuttaBacheca.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Le schede della Bacheca Territoriale compaiono qui non appena vengono approvate dall'Admin in Regia.
                </p>
              ) : (
                tuttaBacheca.map((b) => (
                  <div key={b.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">{b.nome}</h3>
                      <Badge variant="secondary">{b.tipo}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{b.descrizione}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-wide text-accent">{b.ambito} · {b.contatto}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* DIALOG 1: Il TerniDex Personale (Stile Pokédex) */}
      <Dialog open={ternidexOpen} onOpenChange={setTernidexOpen}>
        <DialogContent className="z-[2000] max-h-[88vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Trophy className="size-5 text-accent" /> Il Tuo Profilo TerniDex — {percTernidex}% Completato
            </DialogTitle>
            <DialogDescription>
              Grado attuale: <b>{gradoUtente}</b> · Hai scoperto <b>{esplorati.length}</b> su <b>{tuttiPoi.length}</b> monumenti di Terni ({puntiGuadagnati} Punti Esploratore totali).
            </DialogDescription>
          </DialogHeader>

          <Progress value={percTernidex} className="my-2 h-2.5" />

          <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {tuttiPoi.map((p, index) => {
              const scoperto = esplorati.includes(p.id);
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border p-4 transition-all ${
                    scoperto ? "border-emerald-500/50 bg-emerald-500/10" : "border-border bg-surface-2 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground">#{String(index + 1).padStart(3, "0")}</span>
                    <Badge variant={scoperto ? "default" : "secondary"} className="text-[10px]">
                      {scoperto ? `✔ +${p.punti} pt` : `🔒 ${p.rarita || "Raro"}`}
                    </Badge>
                  </div>
                  <h4 className="mt-2 font-bold text-sm">{scoperto ? p.nome : "??? (Luogo Misterioso)"}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {scoperto ? `${p.autore} (${p.anno})` : `Indizio: ${p.categoria} — Avvicinati a meno di ${RAGGIO_SBLOCCO_METRI}m per registrarlo nel TerniDex.`}
                  </p>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Premi & Riscossione */}
      <Dialog open={premiOpen} onOpenChange={setPremiOpen}>
        <DialogContent className="z-[2000] max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Gift className="size-5 text-accent" /> Premi & Ricompense Esploratore</DialogTitle>
            <DialogDescription>
              Ogni monumento sbloccato col GPS fa guadagnare Punti Esploratore. Hai <b>{puntiDisponibili}</b> punti disponibili.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Premio
              titolo="Sconto 5 € sul Dossier Bandi IA"
              desc="Il PDF completo scende da 14,90 € a 9,90 €."
              costo={COSTI_PREMI.sconto}
              fatto={state.scontoDossier}
              onClick={() => spendi(COSTI_PREMI.sconto, (s) => ({ ...s, scontoDossier: true }), "Sconto attivato: il Dossier costa ora 9,90 €.")}
            />
            <Premio
              titolo="Badge «Esploratore Certificato»"
              desc="Appare accanto al tuo nome nei commenti e nelle proposte."
              costo={COSTI_PREMI.badge}
              fatto={state.badgeEsploratore}
              onClick={() => spendi(COSTI_PREMI.badge, (s) => ({ ...s, badgeEsploratore: true }), "Badge Esploratore Certificato ottenuto!")}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: Candidatura Luoghi, Bacheca e Sondaggi (Sottoposti a Moderazione Admin) */}
      <Dialog open={candidaturaOpen} onOpenChange={setCandidaturaOpen}>
        <DialogContent className="z-[2000] max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-accent" /> Candidatura & Proposta alla Regia
            </DialogTitle>
            <DialogDescription>
              Proponi un nuovo luogo per Terni Urban GO, un'iniziativa per la Bacheca del territorio o un nuovo Sondaggio cittadino. Ogni proposta viene revisionata e approvata dall'Admin prima della pubblicazione.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex gap-2">
              <Button size="sm" variant={tipoCandidatura === "poi" ? "default" : "secondary"} className="flex-1 text-xs" onClick={() => setTipoCandidatura("poi")}>
                📍 Nuovo Luogo / POI
              </Button>
              <Button size="sm" variant={tipoCandidatura === "bacheca" ? "default" : "secondary"} className="flex-1 text-xs" onClick={() => setTipoCandidatura("bacheca")}>
                🏛️ Bacheca & Attivismo
              </Button>
              <Button size="sm" variant={tipoCandidatura === "sondaggio" ? "default" : "secondary"} className="flex-1 text-xs" onClick={() => setTipoCandidatura("sondaggio")}>
                📊 Nuovo Sondaggio
              </Button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label>Il tuo Nome / Ente</Label>
                <Input value={formProp.autore} onChange={(e) => setFormProp({ ...formProp, autore: e.target.value })} placeholder="Es. Marco R. / Comitato..." />
              </div>
              <div>
                <Label>Email o Contatto (per verifica)</Label>
                <Input value={formProp.contatto} onChange={(e) => setFormProp({ ...formProp, contatto: e.target.value })} placeholder="email o telefono" />
              </div>
            </div>

            <div>
              <Label>
                {tipoCandidatura === "poi" ? "Nome del Monumento / Luogo da esplorare" : tipoCandidatura === "bacheca" ? "Nome Associazione / Pagina / Iniziativa" : "Domanda del Sondaggio Cittadino"}
              </Label>
              <Input value={formProp.titolo} onChange={(e) => setFormProp({ ...formProp, titolo: e.target.value })} />
            </div>

            {tipoCandidatura === "poi" && (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <Label>Architetto / Autore e Anno</Label>
                    <Input value={formProp.sottotitolo} onChange={(e) => setFormProp({ ...formProp, sottotitolo: e.target.value })} placeholder="Es. Mario Ridolfi · 1960" />
                  </div>
                  <div>
                    <Label>Coordinate GPS (Lat, Lng)</Label>
                    <div className="flex gap-1">
                      <Input value={formProp.lat} onChange={(e) => setFormProp({ ...formProp, lat: e.target.value })} placeholder="42.563" />
                      <Input value={formProp.lng} onChange={(e) => setFormProp({ ...formProp, lng: e.target.value })} placeholder="12.642" />
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Curiosità segreta (sbloccabile col GPS)</Label>
                  <Input value={formProp.curiosita} onChange={(e) => setFormProp({ ...formProp, curiosita: e.target.value })} />
                </div>
              </>
            )}

            {tipoCandidatura === "bacheca" && (
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label>Ambito (Cultura, Ambiente, Giovani...)</Label>
                  <Input value={formProp.sottotitolo} onChange={(e) => setFormProp({ ...formProp, sottotitolo: e.target.value })} />
                </div>
                <div>
                  <Label>Link Social / Sito Web (opzionale)</Label>
                  <Input value={formProp.curiosita} onChange={(e) => setFormProp({ ...formProp, curiosita: e.target.value })} placeholder="https://..." />
                </div>
              </div>
            )}

            {tipoCandidatura === "sondaggio" && (
              <div className="space-y-2">
                <Label>Opzioni di voto proposte</Label>
                <Input value={formProp.opzione1} onChange={(e) => setFormProp({ ...formProp, opzione1: e.target.value })} placeholder="Opzione 1..." />
                <Input value={formProp.opzione2} onChange={(e) => setFormProp({ ...formProp, opzione2: e.target.value })} placeholder="Opzione 2..." />
                <Input value={formProp.opzione3} onChange={(e) => setFormProp({ ...formProp, opzione3: e.target.value })} placeholder="Opzione 3 (opzionale)..." />
              </div>
            )}

            <div>
              <Label>{tipoCandidatura === "poi" ? "Testo Scheda / Articolo d'approfondimento" : "Descrizione dettagliata"}</Label>
              <Textarea value={formProp.descrizione} onChange={(e) => setFormProp({ ...formProp, descrizione: e.target.value })} rows={4} />
            </div>

            <Button className="w-full" onClick={inviaCandidatura}>
              Invia Proposta per Approvazione Admin
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Premio({ titolo, desc, costo, fatto, onClick }: { titolo: string; desc: string; costo: number; fatto: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div>
        <p className="font-semibold">{titolo}</p>
        <p className="text-xs text-muted-foreground">{desc} · {costo} punti</p>
      </div>
      {fatto ? (
        <span className="flex items-center gap-1 text-xs text-accent"><BadgeCheck className="size-4" /> Attivo</span>
      ) : (
        <Button size="sm" onClick={onClick}>Usa punti</Button>
      )}
    </div>
  );
}
