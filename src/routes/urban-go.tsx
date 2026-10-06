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
import {
  BACHECA, ORDINE_RARITA, POI_LIST, RARITA_STANDARD, TERNI_CENTER,
  type POI, type RaritaPOI
} from "@/lib/terni-data";
import { COSTI_PREMI, inviaPropostaModerazione, useCivic } from "@/lib/civic-store";

export const Route = createFileRoute("/urban-go")({
  head: () => ({
    meta: [
      { title: "Terni Urban GO & TerniDex GPS — Terni 2030" },
      { name: "description", content: "Esplora i luoghi di Terni approvati dalla community, sblocca il TerniDex col GPS e proponi nuove tappe." },
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

const CATEGORIE_POI: POI["categoria"][] = [
  "Architettura d'autore",
  "Arte pubblica",
  "Archeologia industriale",
  "Storia e fede",
];

const RAGGIO_SBLOCCO_METRI = 150;

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

function calcolaGradoEsploratore(perc: number, nScoperti: number): string {
  if (nScoperti === 0) return "🌱 In attesa della prima scoperta";
  if (perc >= 100) return "🏆 Maestro Leggendario di Terni 2030";
  if (perc >= 60) return "⚡ Custode d'Acciaio di Interamna";
  if (perc >= 25) return "🧭 Esploratore Urbano Certificato";
  return "🌱 Esploratore della Conca";
}

function UrbanGo() {
  const { state, update, puntiGuadagnati, puntiDisponibili } = useCivic();
  const tuttiPoi: POI[] = [...POI_LIST, ...state.poiExtra];
  const tuttaBacheca = [...BACHECA, ...state.bachecaExtra];
  const esplorati = state.checkin.filter((id) => tuttiPoi.some((p) => p.id === id));

  const [attivo, setAttivo] = useState<POI | undefined>(tuttiPoi[0]);
  const [premiOpen, setPremiOpen] = useState(false);
  const [ternidexOpen, setTernidexOpen] = useState(false);
  const [candidaturaOpen, setCandidaturaOpen] = useState(false);
  const [tipoCandidatura, setTipoCandidatura] = useState<"poi" | "bacheca" | "sondaggio">("poi");

  const [gpsAttivo, setGpsAttivo] = useState(false);
  const [posUtente, setPosUtente] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [formProp, setFormProp] = useState({
    autore: "",
    contatto: "",
    titolo: "",
    sottotitolo: "",
    anno: "",
    categoriaPoi: "Architettura d'autore" as POI["categoria"],
    raritaPoi: "Comune" as RaritaPOI,
    lat: "42.5636",
    lng: "12.6427",
    descrizione: "",
    curiosita: "",
    opzione1: "",
    opzione2: "",
    opzione3: "",
  });

  useEffect(() => {
    if (!attivo && tuttiPoi.length > 0) {
      setAttivo(tuttiPoi[0]);
    }
  }, [tuttiPoi.length]);

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
        toast.success("📡 Radar GPS attivo! Avvicinati a meno di 150m dai luoghi per sbloccarli.");
      },
      () => {
        toast.error("Permesso GPS negato. Abilita la posizione nel browser per giocare a Terni Urban GO.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const usaMiaPosizioneNelForm = () => {
    if (posUtente) {
      setFormProp((f) => ({ ...f, lat: posUtente.lat.toFixed(5), lng: posUtente.lng.toFixed(5) }));
      toast.success("Coordinate GPS attuali inserite nel modulo!");
      return;
    }
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormProp((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(5),
          lng: pos.coords.longitude.toFixed(5),
        }));
        toast.success("Coordinate GPS rilevate e inserite!");
      });
    }
  };

  const puntiTotali = tuttiPoi.reduce((a, p) => a + p.punti, 0);
  const percTernidex = tuttiPoi.length > 0 ? Math.round((esplorati.length / tuttiPoi.length) * 100) : 0;
  const gradoUtente = calcolaGradoEsploratore(percTernidex, esplorati.length);

  const tentaCheckinGps = (poi: POI, forzaAdmin = false) => {
    const giaFatto = esplorati.includes(poi.id);
    if (giaFatto) {
      toast.info(`${poi.nome} è già registrato nel tuo TerniDex!`);
      return;
    }
    if (!forzaAdmin) {
      if (!posUtente) {
        toast.error("📡 Attiva prima il Radar GPS in alto per verificare che ti trovi vicino al luogo!");
        attivaRadarGps();
        return;
      }
      const dist = calcolaDistanzaMetri(posUtente.lat, posUtente.lng, poi.lat, poi.lng);
      if (dist > RAGGIO_SBLOCCO_METRI) {
        toast.error(
          `Sei a ${dist} metri da «${poi.nome}». Avvicinati a meno di ${RAGGIO_SBLOCCO_METRI}m per riscuotere +${poi.punti} pt (${poi.rarita})!`
        );
        return;
      }
    }
    update((s) => ({ ...s, checkin: [...s.checkin, poi.id] }));
    setAttivo(poi);
    toast.success(`🎉 Luogo ${poi.rarita} sbloccato nel TerniDex! +${poi.punti} Punti Esploratore!`);
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
      const infoRar = RARITA_STANDARD[formProp.raritaPoi];
      await inviaPropostaModerazione({
        tipo: "poi",
        titolo: formProp.titolo.trim(),
        autore: formProp.autore.trim(),
        contatto: formProp.contatto.trim(),
        dati: {
          nome: formProp.titolo.trim(),
          autore: formProp.sottotitolo.trim() || formProp.autore.trim(),
          anno: formProp.anno.trim() || "Storico / Contemporaneo",
          categoria: formProp.categoriaPoi,
          rarita: formProp.raritaPoi,
          punti: infoRar.punti,
          lat: parseFloat(formProp.lat) || 42.5636,
          lng: parseFloat(formProp.lng) || 12.6427,
          descrizione: formProp.descrizione.trim(),
          curiosita: formProp.curiosita.trim() || "Luogo proposto dalla community e validato dalla Regia Terni 2030.",
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
      autore: "", contatto: "", titolo: "", sottotitolo: "", anno: "",
      categoriaPoi: "Architettura d'autore", raritaPoi: "Comune",
      lat: "42.5636", lng: "12.6427", descrizione: "", curiosita: "",
      opzione1: "", opzione2: "", opzione3: "",
    });
    setCandidaturaOpen(false);
    toast.success("Proposta inviata alla Regia! Comparirà sulla mappa dopo il consenso dell'amministratore.");
  };

  const pins = tuttiPoi.map((p) => {
    const sbloccato = esplorati.includes(p.id);
    const dist = posUtente ? calcolaDistanzaMetri(posUtente.lat, posUtente.lng, p.lat, p.lng) : null;
    const infoRar = RARITA_STANDARD[p.rarita] || RARITA_STANDARD.Comune;
    return {
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      color: sbloccato ? "#22c55e" : infoRar.colore,
      label: `${p.nome} (${p.rarita})`,
      glow: !sbloccato,
      popup: (
        <div className="space-y-2">
          <p className="font-semibold">{p.nome}</p>
          <p className="text-xs opacity-80">{p.rarita} · +{p.punti} pt · {p.autore}</p>
          {dist !== null && (
            <p className="text-[11px] font-mono">
              📍 Distanza: <b>{dist} m</b> {dist <= RAGGIO_SBLOCCO_METRI ? "🟢 (Sbloccabile!)" : "🔒 (Avvicinati)"}
            </p>
          )}
          <button
            onClick={() => tentaCheckinGps(p)}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
          >
            {sbloccato ? "✔ Scoperto nel TerniDex" : `📡 Check-in GPS (+${p.punti} pt)`}
          </button>
        </div>
      ),
    };
  });

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="secondary" className="mb-2">
            5 Gradi di Rarità: Comune (25) · Raro (50) · Epico (100) · Leggendario (200) · Unico (500)
          </Badge>
          <h1 className="text-3xl font-bold md:text-4xl">
            Terni <span className="text-ember-gradient">Urban GO</span> & TerniDex
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Esplora i luoghi culturali e architettonici inseriti e approvati dalla community di Terni 2030, avvicinati col GPS per riscuotere i punti e proponi nuove tappe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => { setTipoCandidatura("poi"); setCandidaturaOpen(true); }} className="h-auto py-2.5 border-accent/60 text-accent">
            <Plus className="mr-1.5 size-4" /> Proponi Nuovo Luogo / Ping
          </Button>

          <Button variant={gpsAttivo ? "secondary" : "default"} onClick={attivaRadarGps} className="h-auto py-2.5">
            <Navigation className={`mr-2 size-4 ${gpsAttivo ? "text-emerald-400" : ""}`} />
            {gpsAttivo && posUtente ? `Radar GPS Attivo (±${posUtente.acc}m)` : "📡 Attiva Radar GPS"}
          </Button>

          <button onClick={() => setTernidexOpen(true)} className="surface-panel flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:border-accent">
            <Trophy className="size-6 text-accent" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent">
                TerniDex: {esplorati.length}/{tuttiPoi.length} ({percTernidex}%)
              </p>
              <p className="text-[11px] text-muted-foreground">{gradoUtente}</p>
              <Progress value={percTernidex} className="mt-1 h-1.5 w-36" />
            </div>
          </button>

          <button onClick={() => setPremiOpen(true)} className="surface-panel flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:border-accent">
            <Award className="size-6 text-accent" />
            <div>
              <p className="text-sm font-semibold">{puntiDisponibili} pt disponibili</p>
              <p className="text-[11px] text-muted-foreground">{puntiGuadagnati}/{puntiTotali} pt · Premi →</p>
            </div>
          </button>
        </div>
      </div>

      {/* Legenda Standard Rarità */}
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-xs">
        <span className="font-semibold uppercase tracking-wider text-muted-foreground mr-1">Scala Rarità Luoghi:</span>
        {ORDINE_RARITA.map((r) => {
          const info = RARITA_STANDARD[r];
          return (
            <span
              key={r}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold"
              style={{ backgroundColor: `${info.colore}22`, color: info.colore, border: `1px solid ${info.colore}55` }}
            >
              {r} · +{info.punti} pt
            </span>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <div className="h-[460px] overflow-hidden rounded-xl border border-border metal-edge">
            <TerniMap center={posUtente ? [posUtente.lat, posUtente.lng] : TERNI_CENTER} zoom={14} pins={pins} />
          </div>

          {tuttiPoi.length === 0 ? (
            <div className="surface-panel p-8 text-center">
              <MapPin className="mx-auto mb-3 size-10 text-accent" />
              <h3 className="text-lg font-bold">Nessun luogo ancora pubblicato sulla mappa</h3>
              <p className="mx-auto mt-1 max-w-xl text-xs text-muted-foreground">
                La mappa di Terni Urban GO è pronta e pulita: tutti i luoghi (Comuni, Rari, Epici, Leggendari e Unici) vengono inseriti da te o proposti dai cittadini e pubblicati solo dopo il tuo consenso nella Regia Operatori.
              </p>
              <Button className="mt-4" onClick={() => { setTipoCandidatura("poi"); setCandidaturaOpen(true); }}>
                <Plus className="mr-1.5 size-4" /> Inserisci o Proponi il Primo Luogo
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {tuttiPoi.map((p) => {
                const fatto = esplorati.includes(p.id);
                const dist = posUtente ? calcolaDistanzaMetri(posUtente.lat, posUtente.lng, p.lat, p.lng) : null;
                const inRaggio = dist !== null && dist <= RAGGIO_SBLOCCO_METRI;
                const infoRar = RARITA_STANDARD[p.rarita] || RARITA_STANDARD.Comune;

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
                        <Badge
                          className="border-0 text-[10px] font-bold"
                          style={{ backgroundColor: `${infoRar.colore}25`, color: infoRar.colore }}
                        >
                          {p.rarita} · +{p.punti} pt
                        </Badge>
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
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <section className="surface-panel p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Megaphone className="size-5 text-accent" /> Bacheca Territorio, Luoghi & Sondaggi Cittadini
                </h2>
                <p className="text-xs text-muted-foreground">
                  Proponi nuove schede luogo, associazioni o sondaggi: ogni proposta viene verificata dalla Regia Admin prima della pubblicazione.
                </p>
              </div>
              <Button size="sm" onClick={() => setCandidaturaOpen(true)}>
                <Plus className="mr-1 size-4" /> Candidati / Proponi alla Regia
              </Button>
            </div>

            {state.postSocial.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nessuna iniziativa pubblicata al momento. Usa il pulsante «Candidati / Proponi alla Regia» per inviare una proposta all'amministratore.
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
                    🔓 Sbloccato nel tuo TerniDex ({attivo.rarita} · +{attivo.punti} pt)
                  </Badge>
                  <h3 className="mt-2 text-lg font-semibold">{attivo.nome}</h3>
                  <p className="text-xs text-muted-foreground">{attivo.autore} · {attivo.anno}</p>
                  <p className="mt-3 whitespace-pre-line text-sm">{attivo.descrizione}</p>
                  <p className="mt-3 rounded-md border border-border bg-surface-2 p-3 text-sm text-muted-foreground">
                    <span className="font-semibold text-accent">Curiosità segreta sbloccata: </span>
                    {attivo.curiosita}
                  </p>
                </>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-border p-5 text-center">
                  <Lock className="mx-auto mb-2 size-8 text-muted-foreground" />
                  <h3 className="font-semibold">{attivo.nome}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Luogo di rarità <b>{attivo.rarita} (+{attivo.punti} pt)</b>. Recati a meno di <b>{RAGGIO_SBLOCCO_METRI} metri</b> dal punto con il Radar GPS attivo e premi <b>Check-in GPS</b> per leggere l'approfondimento completo!
                  </p>
                  <Button size="sm" className="mt-4" onClick={() => tentaCheckinGps(attivo)}>
                    <Navigation className="mr-1.5 size-3.5" /> Verifica Posizione GPS Ora
                  </Button>
                </div>
              )
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Non appena un luogo viene approvato nella Regia, potrai selezionarlo sulla mappa per leggerne il dossier storico sbloccabile via GPS.
              </p>
            )}
          </div>

          <div className="surface-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Users className="size-4 text-accent" /> Bacheca del Territorio
              </h2>
              <Button size="sm" variant="ghost" className="text-xs text-accent" onClick={() => { setTipoCandidatura("bacheca"); setCandidaturaOpen(true); }}>
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

      {/* DIALOG 1: Il TerniDex Personale */}
      <Dialog open={ternidexOpen} onOpenChange={setTernidexOpen}>
        <DialogContent className="z-[2000] max-h-[88vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Trophy className="size-5 text-accent" /> Il Tuo Profilo TerniDex — {percTernidex}% Completato
            </DialogTitle>
            <DialogDescription>
              Grado attuale: <b>{gradoUtente}</b> · Hai scoperto <b>{esplorati.length}</b> su <b>{tuttiPoi.length}</b> luoghi approvati ({puntiGuadagnati} Punti Esploratore totali).
            </DialogDescription>
          </DialogHeader>

          <Progress value={percTernidex} className="my-2 h-2.5" />

          {tuttiPoi.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Il TerniDex è pronto! Non appena approverai i primi luoghi nella Regia Operatori, compariranno qui numerati come caselle collezionabili.
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {tuttiPoi.map((p, index) => {
                const scoperto = esplorati.includes(p.id);
                const infoRar = RARITA_STANDARD[p.rarita] || RARITA_STANDARD.Comune;
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-4 transition-all ${
                      scoperto ? "border-emerald-500/50 bg-emerald-500/10" : "border-border bg-surface-2 opacity-65"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-muted-foreground">#{String(index + 1).padStart(3, "0")}</span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ backgroundColor: `${infoRar.colore}25`, color: infoRar.colore }}
                      >
                        {scoperto ? `✔ ${p.rarita} (+${p.punti} pt)` : `🔒 ${p.rarita} (+${p.punti} pt)`}
                      </span>
                    </div>
                    <h4 className="mt-2 font-bold text-sm">{scoperto ? p.nome : "??? (Luogo da Scoprire)"}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {scoperto ? `${p.autore} (${p.anno})` : `Categoria: ${p.categoria} — Avvicinati a meno di ${RAGGIO_SBLOCCO_METRI}m per registrarlo.`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Premi & Riscossione */}
      <Dialog open={premiOpen} onOpenChange={setPremiOpen}>
        <DialogContent className="z-[2000] max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Gift className="size-5 text-accent" /> Premi & Ricompense Esploratore</DialogTitle>
            <DialogDescription>
              Ogni luogo sbloccato col GPS fa guadagnare Punti in base alla rarità (Comune 25 · Raro 50 · Epico 100 · Leggendario 200 · Unico 500). Hai <b>{puntiDisponibili}</b> punti disponibili.
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

      {/* DIALOG 3: Candidatura Luoghi (con 5 Rarità Standardizzate), Bacheca e Sondaggi */}
      <Dialog open={candidaturaOpen} onOpenChange={setCandidaturaOpen}>
        <DialogContent className="z-[2000] max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-accent" /> Candidatura & Inserimento in Regia
            </DialogTitle>
            <DialogDescription>
              Ogni luogo, scheda bacheca o sondaggio proposto passa prima nella Regia Operatori per la verifica e l'approvazione finale di Lorenzo.
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
                <Label>Il tuo Nome / Autore</Label>
                <Input value={formProp.autore} onChange={(e) => setFormProp({ ...formProp, autore: e.target.value })} placeholder="Es. Lorenzo / Cittadino..." />
              </div>
              <div>
                <Label>Email o Contatto</Label>
                <Input value={formProp.contatto} onChange={(e) => setFormProp({ ...formProp, contatto: e.target.value })} placeholder="email o riferimento" />
              </div>
            </div>

            <div>
              <Label>
                {tipoCandidatura === "poi" ? "Nome del Luogo / Architettura" : tipoCandidatura === "bacheca" ? "Nome Associazione / Iniziativa" : "Domanda del Sondaggio Cittadino"}
              </Label>
              <Input value={formProp.titolo} onChange={(e) => setFormProp({ ...formProp, titolo: e.target.value })} />
            </div>

            {tipoCandidatura === "poi" && (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <Label>Categoria del Luogo</Label>
                    <select
                      value={formProp.categoriaPoi}
                      onChange={(e) => setFormProp({ ...formProp, categoriaPoi: e.target.value as POI["categoria"] })}
                      className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-xs"
                    >
                      {CATEGORIE_POI.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Livello di Rarità Standard</Label>
                    <select
                      value={formProp.raritaPoi}
                      onChange={(e) => setFormProp({ ...formProp, raritaPoi: e.target.value as RaritaPOI })}
                      className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-xs font-semibold"
                    >
                      {ORDINE_RARITA.map((r) => (
                        <option key={r} value={r}>{RARITA_STANDARD[r].label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <Label>Architetto / Autore storico</Label>
                    <Input value={formProp.sottotitolo} onChange={(e) => setFormProp({ ...formProp, sottotitolo: e.target.value })} placeholder="Es. Mario Ridolfi..." />
                  </div>
                  <div>
                    <Label>Anno / Epoca</Label>
                    <Input value={formProp.anno} onChange={(e) => setFormProp({ ...formProp, anno: e.target.value })} placeholder="Es. 1936 / XVI Secolo" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label>Coordinate GPS (Latitudine, Longitudine)</Label>
                    <button type="button" onClick={usaMiaPosizioneNelForm} className="text-[11px] font-semibold text-accent hover:underline">
                      📍 Usa la mia posizione GPS attuale
                    </button>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <Input value={formProp.lat} onChange={(e) => setFormProp({ ...formProp, lat: e.target.value })} placeholder="42.5636" />
                    <Input value={formProp.lng} onChange={(e) => setFormProp({ ...formProp, lng: e.target.value })} placeholder="12.6427" />
                  </div>
                </div>

                <div>
                  <Label>Curiosità segreta (sbloccabile col GPS sul posto)</Label>
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
              <Label>{tipoCandidatura === "poi" ? "Articolo / Scheda storica del luogo" : "Descrizione dettagliata"}</Label>
              <Textarea value={formProp.descrizione} onChange={(e) => setFormProp({ ...formProp, descrizione: e.target.value })} rows={4} />
            </div>

            <Button className="w-full" onClick={inviaCandidatura}>
              Invia alla Regia per Approvazione
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
