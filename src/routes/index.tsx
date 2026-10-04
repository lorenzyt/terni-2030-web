import { createFileRoute, Link } from "@tanstack/react-router";
import { Map, FileText, LayoutDashboard, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Terni 2030 — <span className="text-accent">La Città dell'Amore e dell'Acciaio</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Un progetto di rigenerazione urbana partecipata. La tua voce, i dati reali, il futuro di Terni.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/mappa" className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition">
            Entra nella Mappa GIS <ArrowRight className="ml-2 size-4" />
          </Link>
          <Link to="/dossier" className="inline-flex items-center justify-center px-8 py-4 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 transition">
            Scopri i Bandi Attivi
          </Link>
        </div>
      </section>

      {/* Cruscotto Live */}
      <section className="container mx-auto px-6 py-12">
        <div className="bg-surface-2 border border-border p-8 rounded-2xl shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
            <LayoutDashboard className="size-5" /> Cruscotto Live di Jarvis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-4xl font-bold text-accent">0</p>
              <p className="text-sm text-muted-foreground">Proposte raccolte</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-accent">0</p>
              <p className="text-sm text-muted-foreground">Bandi monitorati</p>
            </div>
            <div>
              <p className="text-sm font-mono text-muted-foreground">Ultima scansione: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Mondi */}
      <section className="container mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">
        {[
          { title: "Mappa Civica & Sondaggi", desc: "Segnala criticità e vota le priorità di quartiere.", icon: Map, link: "/mappa" },
          { title: "Terni Urban GO", desc: "Architettura, storia e visioni per la città.", icon: LayoutDashboard, link: "/urban-go" },
          { title: "Dossier Bandi IA", desc: "Monitoraggio automatico dei finanziamenti disponibili.", icon: FileText, link: "/dossier" },
        ].map((card) => (
          <Link key={card.title} to={card.link} className="p-8 border border-border rounded-2xl hover:border-accent transition group">
            <card.icon className="size-8 text-accent mb-4" />
            <h3 className="text-xl font-bold mb-2">{card.title}</h3>
            <p className="text-muted-foreground">{card.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
