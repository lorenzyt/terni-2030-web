import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bot, Coins, TrendingUp } from "lucide-react";
import { useCivic } from "@/lib/civic-store";

const pct = (a: number, b: number) => (a + b ? Math.round((a / (a + b)) * 100) : 0);
const QUARTIERI_OSS = ["Centro Storico", "Borgo Bovio", "Villaggio Matteotti", "Polymer / Viale Brin", "Marmore", "Cesure"];

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
    const s = segn.filter((x) => x.quartiere === q);
    return { quartiere: q.replace(" / Viale Brin", ""), segnalazioni: s.length, voti: s.reduce((a, x) => a + x.voti, 0) };
  });

  let defOpz = 0, defVoti = 0, comOpz = 0, comVoti = 0;
  for (const s of state.sondaggi) {
    for (const o of s.opzioni) {
      const v = o.voti + (state.votiSondaggi[s.id] === o.id ? 1 : 0);
      if (o.community || s.community) { comOpz++; comVoti += v; } else { defOpz++; defVoti += v; }
    }
  }
  comOpz += state.obiettiviCommunity.length;
  const confronto = [
    { tipo: "Quota obiettivi %", Istituzionali: pct(defOpz, comOpz), Cittadini: pct(comOpz, defOpz) },
    { tipo: "Quota voti %", Istituzionali: pct(defVoti, comVoti), Cittadini: pct(comVoti, defVoti) },
  ];

  const top = [...perQuartiere].sort((a, b) => b.voti - a.voti)[0];
  const topSegn = [...segn].sort((a, b) => b.voti - a.voti)[0];
  const catCount = segn.reduce<Record<string, number>>((a, s) => ((a[s.categoria] = (a[s.categoria] ?? 0) + 1), a), {});
  const catTop = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];
  const quotaCom = comOpz + defOpz ? Math.round((comOpz / (comOpz + defOpz)) * 100) : 0;
  const commentiTot = Object.values(state.commenti).reduce((a, l) => a + l.length, 0);

  return (
    <section className="surface-panel mb-6 p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <TrendingUp className="size-5 text-accent" /> Osservatorio IA & Rendicontazione Live
          </h2>
          <p className="text-xs text-muted-foreground">
            Dati ricalcolati in tempo reale a ogni voto, commento o proposta · Elaborazione: IA (esecutore analitico) · Curatela: Lorenzo Covicchio
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs">
          <span className="size-2 animate-pulse rounded-full bg-accent" /> live
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
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
        <div className="rounded-lg border border-border p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Istituzionali vs proposti dai cittadini</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confronto} margin={{ left: -20, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="tipo" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Istituzionali" fill="var(--steel)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cittadini" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Coins className="size-4" /> Fondi e incentivi teorici attivabili
            </p>
            <p className="mt-1 font-display text-3xl font-bold text-ember-gradient">
              0 €
            </p>
            <p className="text-xs text-muted-foreground">In attesa di abbinamento bando reale</p>
          </div>
          <div className="flex-1 rounded-lg border border-accent/40 bg-secondary/50 p-3 text-sm">
            <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-accent">
              <Bot className="size-4" /> Osservazione automatica dell'IA
            </p>
            <p>
              Il quartiere più attivo è <b>{top?.quartiere}</b> con {top?.voti} voti. La proposta con più consenso è
              «{topSegn?.titolo}» ({topSegn?.voti} voti). La categoria dominante è <b>{catTop?.[0]}</b>. Gli obiettivi
              proposti dai cittadini sono il <b>{quotaCom}%</b> del totale e la discussione conta {commentiTot} commenti.
              {quotaCom >= 40 ? " Il protagonismo civico supera la soglia di attenzione: priorità a percorsi co-progettati." : " Suggerito: stimolare nuove proposte dal basso nei quartieri periferici."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
