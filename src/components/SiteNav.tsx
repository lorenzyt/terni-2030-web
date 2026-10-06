import { Link } from "@tanstack/react-router";
import { Map, Compass, FileSearch, Handshake, Flame } from "lucide-react";

const LINKS = [
  { to: "/", label: "Mappa & Segnalazioni", icon: Map },
  { to: "/urban-go", label: "Terni Urban GO", icon: Compass },
  { to: "/dossier", label: "Bandi & Dossier IA", icon: FileSearch },
  { to: "/partner", label: "Partner & Sponsor" },
  { to: "/regia", label: "🔒 Regia", icon: Handshake },
] as const;

export function SiteNav() {
  return (
    <header className="sticky top-0 z-[1000] border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md metal-edge bg-primary">
            <Flame className="size-5 text-primary-foreground" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold tracking-tight">
              TERNI <span className="text-ember-gradient">2030</span>
            </span>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Città dell'Amore e dell'Acciaio
            </span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-1 md:justify-end">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{
                className:
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-secondary text-foreground font-medium",
              }}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
