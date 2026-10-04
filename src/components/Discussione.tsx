import { useState } from "react";
import { BadgeCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { aggiungiCommento, useCivic } from "@/lib/civic-store";

export function Discussione({ chiave, titolo = "Discussione & Idee dei Cittadini" }: { chiave: string; titolo?: string }) {
  const { state, update } = useCivic();
  const [autore, setAutore] = useState("");
  const [testo, setTesto] = useState("");
  const lista = state.commenti[chiave] ?? [];

  const pubblica = () => {
    if (!testo.trim()) {
      toast.error("Scrivi un commento prima di pubblicare.");
      return;
    }
    aggiungiCommento(update, chiave, autore.trim(), testo.trim(), state.badgeEsploratore);
    setTesto("");
    toast.success("Commento pubblicato.");
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {titolo} · {lista.length}
      </p>
      <div className="max-h-60 space-y-2 overflow-y-auto">
        {lista.length === 0 && <p className="text-xs text-muted-foreground">Nessun commento: apri tu la discussione.</p>}
        {lista.map((c) => (
          <div key={c.id} className="rounded-md border border-border bg-surface-2 p-2 text-sm">
            <p className="flex items-center gap-1 text-xs font-semibold">
              {c.autore}
              {c.esploratore && (
                <span className="inline-flex items-center gap-0.5 text-accent">
                  <BadgeCheck className="size-3" /> Esploratore Certificato
                </span>
              )}
              <span className="ml-auto font-normal text-muted-foreground">{c.data}</span>
            </p>
            <p className="mt-1">{c.testo}</p>
          </div>
        ))}
      </div>
      <Input placeholder="Il tuo nome (facoltativo)" value={autore} onChange={(e) => setAutore(e.target.value)} />
      <Textarea placeholder="Commento o variante progettuale…" value={testo} onChange={(e) => setTesto(e.target.value)} className="min-h-16" />
      <Button size="sm" onClick={pubblica}>
        <Send className="size-4" /> Pubblica
      </Button>
    </div>
  );
}
