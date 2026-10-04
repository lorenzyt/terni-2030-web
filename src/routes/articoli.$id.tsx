import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Clock, PenLine, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Discussione } from "@/components/Discussione";
import { ARTICOLI, AUTORE } from "@/lib/articoli";
import { POI_LIST } from "@/lib/terni-data";
import { useCivic } from "@/lib/civic-store";

export const Route = createFileRoute("/articoli/$id")({
  loader: ({ params }) => {
    const art = ARTICOLI[params.id];
    const poi = POI_LIST.find((p) => p.id === params.id);
    if (!art || !poi) throw notFound();
    return { art, poi };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Articolo non trovato — Terni 2030" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.art.titolo} — Terni 2030`;
    return {
      meta: [
        { title: t },
        { name: "description", content: loaderData.art.occhiello },
        { property: "og:title", content: t },
        { property: "og:description", content: loaderData.art.occhiello },
        { property: "og:type", content: "article" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="p-10 text-center">
      Articolo non trovato. <Link to="/urban-go" className="text-accent underline">Torna a Urban GO</Link>
    </div>
  ),
  component: ArticoloPage,
});

function ArticoloPage() {
  const { art, poi } = Route.useLoaderData();
  const { state, update } = useCivic();
  const [editing, setEditing] = useState(false);
  const [bozza, setBozza] = useState("");
  const note = state.noteArticoli[art.id] ?? [];

  const salva = () => {
    if (!bozza.trim()) return void toast.error("Scrivi il nuovo paragrafo.");
    update((s) => ({ ...s, noteArticoli: { ...s.noteArticoli, [art.id]: [...note, bozza.trim()] } }));
    setBozza("");
    setEditing(false);
    toast.success("Articolo aggiornato.");
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Link to="/urban-go" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Terni Urban GO
      </Link>
      <Badge variant="secondary" className="mb-3">{poi.categoria}</Badge>
      <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">{art.titolo}</h1>
      <p className="mt-3 text-lg italic text-muted-foreground">{art.occhiello}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-border py-3 text-xs uppercase tracking-wider text-muted-foreground">
        <span>di <b className="text-foreground">{AUTORE}</b></span>
        <span>Ricerca e impaginazione: IA</span>
        <span className="flex items-center gap-1"><Clock className="size-3" /> {art.lettura} min di lettura</span>
        <span>{art.data}</span>
      </div>

      <div className="mt-8 space-y-10 text-[17px] leading-8">
        {art.sezioni.map((s, i) => (
          <section key={s.titolo}>
            <h2 className="mb-3 text-2xl font-bold">{s.titolo}</h2>
            {s.paragrafi.map((p, j) => (
              <p key={j} className={`mb-4 ${i === 0 && j === 0 ? "first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:font-bold first-letter:text-primary" : ""}`}>
                {p}
              </p>
            ))}
            {s.citazione && (
              <blockquote className="my-6 border-l-4 border-primary pl-5 font-display text-xl italic text-accent">
                <Quote className="mb-1 size-5" />
                {s.citazione}
              </blockquote>
            )}
          </section>
        ))}
        {note.length > 0 && (
          <section>
            <h2 className="mb-3 text-2xl font-bold">Aggiornamenti dell'autore</h2>
            {note.map((n, i) => <p key={i} className="mb-4">{n}</p>)}
          </section>
        )}
      </div>

      <div className="mt-8">
        {editing ? (
          <div className="space-y-2">
            <Textarea value={bozza} onChange={(e) => setBozza(e.target.value)} className="min-h-32" placeholder="Nuovo paragrafo, approfondimento o correzione…" />
            <div className="flex gap-2">
              <Button onClick={salva}>Salva</Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Annulla</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <PenLine className="size-4" /> Scrivi/Modifica Articolo
          </Button>
        )}
      </div>

      <div className="surface-panel mt-10 p-5">
        <Discussione chiave={`art:${art.id}`} titolo="Commenti dei lettori" />
      </div>
    </article>
  );
}
