import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase, useCivic, COSTI_PREMI } from "@/lib/civic-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User, LogOut, Map, Sparkles, RefreshCw, Award } from "lucide-react";
import { LoginDialog } from "@/components/LoginDialog";
import { POI_LIST } from "@/lib/terni-data";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/profilo")({
  component: ProfiloPage,
});

function ProfiloPage() {
  const { state, puntiDisponibili, puntiGuadagnati, ricaricaCloud, user } = useCivic();
  const [loginOpen, setLoginOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    toast.success("Disconnesso con successo");
  };

  const handleSync = async () => {
    setSyncing(true);
    await ricaricaCloud();
    setSyncing(false);
    toast.success("Progressi sincronizzati con il Cloud!");
  };

  const tuttiPoi = [...POI_LIST, ...(state.poiExtra || [])];
  const sbloccati = tuttiPoi.filter((p) => state.checkin.includes(p.id));
  const puoScontare = puntiDisponibili >= (COSTI_PREMI?.sconto || 500);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <User className="mx-auto mb-4 size-16 text-accent" />
        <h1 className="mb-4 text-3xl font-bold">Area Cittadino · Terni 2030</h1>
        <p className="mb-6 text-muted-foreground">
          Accedi con la tua email o con Google per salvare in cloud il tuo TerniDex, accumulare Punti Esploratore e sbloccare sconti sui Dossier Bandi IA.
        </p>
        {sbloccati.length > 0 && (
          <div className="mb-6 inline-block rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm text-accent font-semibold">
            Hai già {sbloccati.length} luoghi scoperti ({puntiDisponibili} pt) su questo dispositivo! Accedi per salvarli nel tuo account Cloud.
          </div>
        )}
        <div>
          <Button size="lg" onClick={() => setLoginOpen(true)}>
            Accedi / Registrati Gratis
          </Button>
        </div>
        <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent">Account Cittadino Verificato</span>
          <h1 className="text-3xl font-bold">Il tuo Profilo</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-2 size-4 ${syncing ? "animate-spin" : ""}`} /> Sincronizza Cloud
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 size-4" /> Esci
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="surface-panel p-6 border rounded-xl">
          <h2 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">Punti Disponibili</h2>
          <div className="text-4xl font-black text-accent">{puntiDisponibili} pt</div>
          <p className="mt-2 text-xs text-muted-foreground">Totale guadagnati: {puntiGuadagnati} pt</p>
        </div>

        <div className="surface-panel p-6 border rounded-xl">
          <h2 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">Collezione TerniDex</h2>
          <div className="text-4xl font-black text-primary">{sbloccati.length} / {tuttiPoi.length}</div>
          <p className="mt-2 text-xs text-muted-foreground">Luoghi monumentali scoperti in città.</p>
        </div>

        <div className="surface-panel p-6 border rounded-xl flex flex-col justify-between">
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase text-muted-foreground flex items-center gap-1">
              <Award className="size-4 text-amber-400" /> Vantaggio Dossier IA
            </h2>
            <p className="text-sm font-bold">
              {puoScontare ? "✅ Sconto €5,00 Attivo!" : `Ti mancano ${500 - puntiDisponibili} pt per lo sconto €5`}
            </p>
          </div>
          <Link to="/dossier" className="mt-4 inline-flex items-center text-xs font-bold text-accent hover:underline">
            <Sparkles className="mr-1 size-3.5" /> Vai al Simulatore Dossier →
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">La tua Collezione (Luoghi Esplorati)</h2>
          <Link to="/urban-go" className="text-sm font-bold text-primary hover:underline">
            Esplora con Urban GO →
          </Link>
        </div>
        {sbloccati.length === 0 ? (
          <div className="surface-panel p-8 border rounded-xl text-center">
            <Map className="mx-auto mb-4 size-10 text-muted-foreground" />
            <p className="text-muted-foreground font-medium">Non hai ancora sbloccato nessun luogo nel TerniDex.</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Vai su "Urban GO" e avvicinati ai monumenti di Terni col GPS per guadagnare i tuoi primi punti!
            </p>
            <Link to="/urban-go" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
              Apri Radar Urban GO
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {sbloccati.map((p) => (
              <div key={p.id} className="surface-panel border p-5 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase text-accent">{p.rarita}</span>
                  <h3 className="font-bold mt-0.5">{p.nome}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{p.categoria}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                  <Badge variant="default" className="bg-primary text-primary-foreground">+{p.punti} pt</Badge>
                  <span className="text-[11px] text-muted-foreground">Sbloccato ✓</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
