import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bot, FileCheck2, TrendingUp } from "lucide-react";
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

  // Dati Grafico 1: Quartieri
  const perQuartiere = QUARTIERI_OSS.map((q) => {
    const s = segn.filter((x) => x.quartiere === q || x.quartiere.includes(q));
    return { quartiere: q, segnalazioni: s.length, voti: s.reduce((a, x) => a + x.voti, 0) };
  });

  // Dati Grafico 2: Tematiche (ex Istituzionali vs Cittadini)
  const perTematica = CATEGORIE.map((c) => {
    return {
      tema: c.replace("Proposta ", "").replace("Edifici ", ""),
      segnalazioni: segn.filter((s) => s.categoria === c).length
    };
  });

  // Calcolo Match Bandi-Dossier (Sostituisce gli 0 €)
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

        {/* Grafico 2: Tematiche (Sostituisce il vecchio grafico) */}
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

        {/* Box Testuali e KPI */}
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <FileCheck2 className="size-4 text-accent" /> Match Progetti / Bandi
            </p>
            <p className="mt-1 font-display text-3xl font-bold text-ember-gradient">
              {totaleBandiIntercettati}
            </p>
            <p className="text-xs text-muted-foreground">
              Bandi attivi incrociati e inseriti nei Dossier generati dagli utenti.
            </p>
          </div>
          
          <div className="flex-1 rounded-lg border border-accent/40 bg-secondary/50 p-3 text-sm">
            <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-accent">
              <Bot className="size-4" /> Osservazione automatica dell'IA
            </p>
            <p className="text-xs leading-relaxed">
              Il quartiere più attivo è <b>{top?.quartiere}</b> con {top?.voti || 0} voti. 
              {topSegn ? ` La proposta cittadina con più consenso è «${topSegn.titolo}» (${topSegn.voti} voti).` : " Nessuna proposta ancora registrata in mappa."} 
              Sono stati generati <b>{state.dossierGenerati.length} Dossier</b> che hanno individuato <b>{totaleBandiIntercettati} opportunità di finanziamento</b>. La discussione civica conta {commentiTot} commenti totali.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
