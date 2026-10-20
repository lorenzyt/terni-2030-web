import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bot, TrendingUp } from "lucide-react";
import { useCivic } from "@/lib/civic-store";
import { CATEGORIE } from "@/lib/terni-data";

const QUARTIERI_OSS = ["Centro Storico", "Borgo Bovio", "Villaggio Matteotti", "Polymer", "Marmore", "Cesure"];

const tooltipStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--foreground)",
  fontSize: 12,
};

export function Osservatorio() {
  const { state } = useCivic();
  const segn = state.segnalazioni;

  const perQuartiere = QUARTIERI_OSS.map((q) => {
    const s = segn.filter((x) => x.quartiere === q || x.quartiere.includes(q));
    return { quartiere: q, segnalazioni: s.length, voti: s.reduce((a, x) => a + x.voti, 0) };
  });

  const perTematica = CATEGORIE.map((c) => {
    return {
      tema: c.replace("Proposta ", "").replace("Edifici ", ""),
      segnalazioni: segn.filter((s) => s.categoria === c).length,
    };
  });

  const totaleBandiIntercettati = state.dossierGenerati.reduce((acc, d) => acc + d.numero_bandi, 0);
  const top = [...perQuartiere].sort((a, b) => b.voti - a.voti)[0];
  const topSegn = [...segn].sort((a, b) => b.voti - a.voti)[0];
  const commentiTot = Object.values(state.commenti).reduce((a, l) => a + l.length, 0);

  return (
    <section className="surface-panel mb-6 p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <TrendingUp className="size-5 text-accent" /> Osservatorio IA & Rendicontazione Live
          </h2>
          <p className="text-xs text-muted-foreground">
            Dati ricalcolati in tempo reale su Mappa e Dossier · Esecutore analitico: IA · Curatela: L. Covicchio
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs">
          <span className="size-2 animate-pulse rounded-full bg-accent" /> live
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Grafico 1: Quartieri */}
        <div className="rounded-lg border border-border p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Segnalazioni per quartiere</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perQuartiere} margin={{ left: -20, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="quartiere" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} interval={0} angle={-20} height={40} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
                <Bar dataKey="segnalazioni" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafico 2: Tematiche */}
        <div className="rounded-lg border border-border p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Distribuzione per Tematica</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perTematica} margin={{ left: -20, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="tema" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={0} angle={-15} height={40} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
                <Bar dataKey="segnalazioni" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Box Osservazione Automatica dell'IA a tutta altezza */}
        <div className="flex flex-col justify-between rounded-lg border border-accent/40 bg-secondary/50 p-5 text-sm">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
              <Bot className="size-4" /> Osservazione automatica dell'IA
            </p>
            <p className="text-sm leading-relaxed text-foreground/95">
              Il quartiere attualmente più attivo è <b className="text-accent">{top?.quartiere}</b> con <b>{top?.voti || 0} voti</b> registrati.
              {topSegn
                ? ` La proposta cittadina con più consenso è «${topSegn.titolo}» (${topSegn.voti} voti).`
                : " Nessuna proposta prioritaria ancora consolidata in mappa: inserisci il primo pin per avviare l'analisi territoriale."}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              L'incrocio continuo tra bisogni civici e finanza agevolativa ha generato finora <b>{state.dossierGenerati.length} Dossier Strategici</b>, individuando complessivamente <b>{totaleBandiIntercettati} opportunità di finanziamento</b> compatibili. La discussione civica conta {commentiTot} contributi totali.
            </p>
          </div>
          <div className="mt-4 border-t border-border/60 pt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Sintesi generativa in tempo reale</span>
            <span className="font-semibold text-accent">Motore Analitico Terni 2030</span>
          </div>
        </div>
      </div>
    </section>
  );
}
