import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu, X, UserCircle } from "lucide-react";
import { useCivic } from "@/lib/civic-store";
import { LoginDialog } from "@/components/LoginDialog";
import { Button } from "@/components/ui/button";

export function SiteNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { pathname } = useLocation();
  const { user } = useCivic() || {};

  const linkClass = (path: string) =>
    `text-sm font-medium transition-colors hover:text-accent ${pathname.startsWith(path) ? "text-accent" : "text-muted-foreground"}`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">Terni <span className="text-accent">2030</span></span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/mappa" className={linkClass("/mappa")}>Mappa GIS</Link>
          <Link to="/urban-go" className={linkClass("/urban-go")}>Urban GO</Link>
          <Link to="/dossier" className={linkClass("/dossier")}>Bandi & Dossier IA</Link>
          <Link to="/partner" className={linkClass("/partner")}>Partner</Link>
          
          {/* Sezione Autenticazione */}
          <div className="ml-4 border-l border-border pl-6 flex items-center">
            {user ? (
              <Link to="/profilo" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2 gap-2">
                 <UserCircle className="size-4" /> Area Cittadino
              </Link>
            ) : (
              <Button variant="default" size="sm" onClick={() => setLoginOpen(true)}>
                Accedi / Registrati
              </Button>
            )}
          </div>
        </nav>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden p-2 text-foreground" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-b border-border bg-background px-4 py-4">
          <nav className="flex flex-col space-y-4">
            <Link to="/mappa" className={linkClass("/mappa")} onClick={() => setIsOpen(false)}>Mappa GIS</Link>
            <Link to="/urban-go" className={linkClass("/urban-go")} onClick={() => setIsOpen(false)}>Urban GO</Link>
            <Link to="/dossier" className={linkClass("/dossier")} onClick={() => setIsOpen(false)}>Bandi & Dossier IA</Link>
            <Link to="/partner" className={linkClass("/partner")} onClick={() => setIsOpen(false)}>Partner</Link>
            <div className="pt-4 border-t border-border flex flex-col gap-2">
              {user ? (
                 <Link to="/profilo" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2 gap-2" onClick={() => setIsOpen(false)}>
                   <UserCircle className="size-4" /> Area Cittadino
                 </Link>
              ) : (
                <Button variant="default" className="w-full" onClick={() => { setIsOpen(false); setLoginOpen(true); }}>
                  Accedi / Registrati
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
