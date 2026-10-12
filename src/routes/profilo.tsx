import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, useCivic } from "@/lib/civic-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User, LogOut, Map } from "lucide-react";
import { LoginDialog } from "@/components/LoginDialog";
import { POI_LIST } from "@/lib/terni-data";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/profilo")({
  component: ProfiloPage,
});

function ProfiloPage() {
  const { state, puntiDisponibili, user } = useCivic();
  const [loginOpen, setLoginOpen] = useState(false);

  const handleLogout = async () => {
    if(supabase) await supabase.auth.signOut();
    toast.success("Disconnesso con successo");
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <User className="mx-auto mb-4 size-16 text-muted-foreground" />
        <h1 className="mb-4 text-3xl font-bold">Area Cittadino</h1>
        <p className="mb-8 text-muted-foreground">Accedi per sbloccare il tuo TerniDex in cloud, accumulare punti esploratore e tenere traccia dei tuoi progressi.</p>
        <Button size="lg" onClick={() => setLoginOpen(true)}>Accedi / Registrati Gratis</Button>
        <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      </div>
    );
  }

  const tuttiPoi = [...POI_LIST, ...(state.poiExtra || [])];
  const sbloccati = tuttiPoi.filter(p => state.checkin.includes(p.id));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Il tuo Profilo</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 size-4" /> Esci
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="surface-panel p-6 border rounded-xl">
          <h2 className="mb-4 text-xl font-bold">Punti Esploratore</h2>
          <div className="text-4xl font-black text-accent">{puntiDisponibili} pt</div>
          <p className="mt-2 text-sm text-muted-foreground">Usali per ottenere sconti sui Dossier IA o per i futuri badge.</p>
        </div>
        
        <div className="surface-panel p-6 border rounded-xl">
          <h2 className="mb-4 text-xl font-bold">TerniDex</h2>
          <div className="text-4xl font-black text-primary">{sbloccati.length} / {tuttiPoi.length}</div>
          <p className="mt-2 text-sm text-muted-foreground">Luoghi monumentali scoperti in città.</p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-6 text-2xl font-bold">La tua Collezione (Luoghi Esplorati)</h2>
        {sbloccati.length === 0 ? (
          <div className="surface-panel p-8 border rounded-xl text-center">
            <Map className="mx-auto mb-4 size-10 text-muted-foreground" />
            <p className="text-muted-foreground font-medium">Non hai ancora sbloccato nessun luogo.</p>
            <p className="text-sm text-muted-foreground mt-1">Vai su "Terni Urban GO" e avvicinati ai monumenti col GPS!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {sbloccati.map((p) => (
              <div key={p.id} className="surface-panel border p-5 rounded-xl">
                <h3 className="font-bold">{p.nome}</h3>
                <p className="text-xs text-muted-foreground mt-1">{p.categoria}</p>
                <div className="mt-3">
                   <Badge variant="default" className="bg-primary text-primary-foreground">+{p.punti} pt</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
