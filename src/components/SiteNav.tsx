import { useState, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu, X, UserCircle, ShieldCheck } from "lucide-react";
import { useCivic } from "@/lib/civic-store";
import { LoginDialog } from "@/components/LoginDialog";
import { Button } from "@/components/ui/button";

export function SiteNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { pathname } = useLocation();
  const { user } = useCivic() || {};

  useEffect(() => {
    try {
      setIsAdmin(
        sessionStorage.getItem("terni2030_regia_session") === "authorized" ||
        localStorage.getItem("terni2030_is_admin") === "1"
      );
    } catch {}
  }, [pathname, loginOpen]);

  const linkClass = (path: string) =>
    `text-sm font-medium transition-colors hover:text-accent ${pathname.startsWith(path) ? "text-accent font-semibold" : "text-muted-foreground"}`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-xl font-bold tracking-tight transition-transform group-hover:scale-[1.02]">
            Terni <span className="text-accent">2030</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/mappa" className={linkClass("/mappa")}>Mappa GIS</Link>
          <Link to="/urban-go" className={linkClass("/urban-go")}>Urban GO (95 POI)</Link>
          <Link to="/dossier" className={linkClass("/dossier")}>Bandi & Dossier IA</Link>
          <Link to="/partner" className={linkClass("/partner")}>Partner</Link>

          <div className="ml-4 border-l border-border pl-6 flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/regia"
                className="inline-flex items-center justify-center rounded-md text-xs font-bold bg-accent/15 text-accent border border-accent/40 hover:bg-accent/25 h-9 px-3 gap-1.5"
              >
                <ShieldCheck className="size-4" /> Regia Lorenzo
              </Link>
            )}
            {user ? (
              <Link
                to="/profilo"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2 gap-2"
              >
                <UserCircle className="size-4" /> Area Cittadino
              </Link>
            ) : (
              <Button variant="default" size="sm" onClick={() => setLoginOpen(true)}>
                Accedi
              </Button>
            )}
          </div>
        </nav>

        <button className="md:hidden p-2 text-foreground" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-b border-border bg-background px-4 py-4">
          <nav className="flex flex-col space-y-4">
            <Link to="/mappa" className={linkClass("/mappa")} onClick={() => setIsOpen(false)}>Mappa GIS</Link>
            <Link to="/urban-go" className={linkClass("/urban-go")} onClick={() => setIsOpen(false)}>Urban GO (95 POI)</Link>
            <Link to="/dossier" className={linkClass("/dossier")} onClick={() => setIsOpen(false)}>Bandi & Dossier IA</Link>
            <Link to="/partner" className={linkClass("/partner")} onClick={() => setIsOpen(false)}>Partner</Link>
            {isAdmin && (
              <Link to="/regia" className="text-sm font-bold text-accent" onClick={() => setIsOpen(false)}>
                Regia Esclusiva Lorenzo
              </Link>
            )}
            <div className="pt-4 border-t border-border flex flex-col gap-2">
              {user ? (
                <Link
                  to="/profilo"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground h-9 px-4 py-2 gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <UserCircle className="size-4" /> Area Cittadino
                </Link>
              ) : (
                <Button variant="default" className="w-full" onClick={() => { setIsOpen(false); setLoginOpen(true); }}>
                  Accedi
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  );
}
