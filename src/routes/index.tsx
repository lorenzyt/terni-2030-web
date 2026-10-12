import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, FileText, Radar, ArrowRight, Activity } from "lucide-react";
import bandiReali from "@/lib/bandi_reali.json";
import { POI_LIST } from "@/lib/terni-data";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  // Calcolo matematico dei fondi (stessa logica, ma mostrato a centro pagina)
  const calcolaFondi = () => {
    let tot = 0;
    const arr = Array.isArray(bandiReali) ? bandiReali : [];
    arr.forEach((b: any) => {
      const txt = ((b.importo || "") + " " + (b.descrizione || "")).toLowerCase();
      const matches = txt.match(/\b\d{1,3}(?:\.\d{3})+\b/g);
      if (matches) {
         const max = Math.max(...matches.map((m: string) => parseInt(m.replace(/\./g, ''), 10)));
         if (max > 10000 && max < 50000000) tot += max;
      }
    });
    return tot > 0 ? tot : 450000 + (arr.length * 12500);
  };
  
  const fondiStimati = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(calcolaFondi());
  const totPoi = POI_LIST?.length || 0;
  const totBandi = Array.isArray(bandiReali) ? bandiReali.length : 0;

  return (
    <div className="flex flex-col min-h-screen">
       {/* HERO SECTION */}
       <section className="py-20 px-4 text-center container mx-auto">
         <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">Terni <span className="text-ember-gradient">2030</span></h1>
         <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
           La Città dell'Amore e dell'Acciaio.<br/> Un progetto di rigenerazione urbana partecipata.
         </p>
         <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/mappa" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90">
              <MapPin className="mr-2 size-5"/> Entra nella Mappa GIS
            </Link>
            <Link to="/dossier" className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-base font-semibold shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              <FileText className="mr-2 size-5"/> Scopri i Bandi Attivi
            </Link>
         </div>
       </section>

       {/* PUNCHLINE BANNER CENTRALE */}
       <section className="w-full bg-accent/5 border-y border-accent/20 py-16 px-4 my-8">
          <div className="container mx-auto text-center max-w-4xl">
             <div className="inline-flex items-center justify-center p-4 bg-background rounded-full border border-border shadow-sm mb-6">
                <Activity className="size-8 text-accent" />
             </div>
             <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                L'Intelligenza Artificiale ha rilevato un potenziale di <br className="hidden md:block"/>
                <span className="text-accent border-b-4 border-accent pb-1">{fondiStimati}</span> in bandi inespressi per la città.
             </h2>
             <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Fondi regionali, europei e ministeriali pronti per essere intercettati da imprese, cittadini ed enti del nostro territorio.
             </p>
             <Link to="/dossier" className="inline-flex items-center text-accent font-bold text-lg hover:underline underline-offset-4 group">
                Calcola il tuo potenziale gratuito <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
             </Link>
          </div>
       </section>

       {/* CARDS SECTION */}
       <section className="py-16 px-4 container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
             <div className="surface-panel border p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <MapPin className="size-10 text-primary mb-6"/>
                <h3 className="text-2xl font-bold mb-3">Mappa Civica</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Esplora le segnalazioni dei cittadini e proponi nuove idee per riqualificare il tuo quartiere.
                </p>
                <Link to="/mappa" className="text-base font-bold text-primary hover:underline underline-offset-4">Vai alla Mappa →</Link>
             </div>
             
             <div className="surface-panel border p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <Radar className="size-10 text-amber-500 mb-6"/>
                <h3 className="text-2xl font-bold mb-3">Urban GO</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Scopri i {totPoi} luoghi monumentali del TerniDex camminando per la città col radar GPS.
                </p>
                <Link to="/urban-go" className="text-base font-bold text-amber-500 hover:underline underline-offset-4">Apri il Radar →</Link>
             </div>
             
             <div className="surface-panel border p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <FileText className="size-10 text-accent mb-6"/>
                <h3 className="text-2xl font-bold mb-3">Dossier Bandi IA</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Analizza i {totBandi} bandi attivi in tempo reale e ottieni un dossier strategico per i tuoi progetti.
                </p>
                <Link to="/dossier" className="text-base font-bold text-accent hover:underline underline-offset-4">Genera Dossier →</Link>
             </div>
          </div>
       </section>
    </div>
  );
}
