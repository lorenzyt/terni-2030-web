import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("terni2030_cookie_consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("terni2030_cookie_consent", "accepted");
    setIsVisible(false);
    // Qui si inizializzerebbe l'Analytics di Vercel se fosse disattivata di default
  };

  const handleDecline = () => {
    localStorage.setItem("terni2030_cookie_consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur-md sm:p-6 animate-fade-up">
      <div className="container mx-auto flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-start gap-3">
          <Cookie className="mt-1 size-6 text-accent shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Informativa sui Cookie & Privacy</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground max-w-3xl">
              Utilizziamo cookie tecnici essenziali per il funzionamento della piattaforma e cookie analitici anonimizzati (Vercel Web Analytics) per misurare il traffico, senza profilazione a fini di marketing. 
              Puoi leggere la nostra <a href="/privacy" className="text-accent hover:underline">Privacy Policy completa</a>.
            </p>
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" size="sm" onClick={handleDecline} className="text-xs">
            Solo Essenziali
          </Button>
          <Button variant="default" size="sm" onClick={handleAccept} className="text-xs font-bold">
            Accetta Tutti
          </Button>
          <button onClick={handleDecline} className="absolute right-2 top-2 p-2 text-muted-foreground md:hidden">
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
