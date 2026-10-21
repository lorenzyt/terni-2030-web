import { useEffect, useState } from "react";
import { Building2, Sparkles, ArrowRight } from "lucide-react";
import { useContact } from "@/components/ContactDialog";

type SponsorProps = {
  posizione?: string;
  adSenseSlot?: string;
};

export function SponsorBanner({ posizione = "Fondo Pagina", adSenseSlot }: SponsorProps) {
  const contatta = useContact();
  const [consensoMarketing, setConsensoMarketing] = useState(false);

  useEffect(() => {
    try {
      const c = localStorage.getItem("terni2030_cookie_consent");
      setConsensoMarketing(c === "accepted");
    } catch {}
  }, []);

  return (
    <div className="my-6 mx-auto max-w-5xl px-4">
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-secondary/25 px-5 py-4 transition-all hover:border-accent/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent border border-accent/30">
              <Building2 className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded">
                  Spazio Partner & Sostenitori · {posizione}
                </span>
                {consensoMarketing && adSenseSlot && (
                  <span className="text-[10px] text-muted-foreground">Annuncio personalizzato attivo</span>
                )}
              </div>
              <p className="mt-1 text-sm font-bold text-foreground">
                Sei uno Studio Tecnico, un'Impresa o un'Attività di Terni?
              </p>
              <p className="text-xs text-muted-foreground">
                Sostieni l'infrastruttura civica indipendente Terni 2030 e posiziona qui la tua vetrina annuale (da 14,90 €/anno).
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              contatta({
                oggetto: "Attivazione Banner Partner Non Invasivo — Terni 2030",
                contesto: "Richiesta informazioni per posizionamento Banner Partner (" + posizione + ")",
              })
            }
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 shrink-0"
          >
            <Sparkles className="size-3.5" /> Prenota Spazio <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
