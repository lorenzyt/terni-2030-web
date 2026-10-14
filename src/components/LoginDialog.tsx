import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase, useCivic } from "@/lib/civic-store";

export function LoginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { user } = useCivic() || {};
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && open) {
      onOpenChange(false);
    }
  }, [user, open, onOpenChange]);

  const loginGoogle = async () => {
    if (!supabase) return toast.error("Supabase non connesso");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/profilo" }
    });
    if (error) toast.error("Errore accesso Google: " + error.message);
  };

  const loginMagicLink = async () => {
    if (!supabase) return toast.error("Supabase non connesso");
    if (!email || !email.includes("@")) return toast.error("Inserisci un'email valida.");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + "/profilo" }
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setOtpSent(true);
      toast.success("Ti abbiamo inviato l'email! Clicca sul Magic Link oppure inserisci qui il codice se presente.");
    }
  };

  const verificaCodiceOtp = async () => {
    if (!supabase) return;
    if (!otpCode.trim()) return toast.error("Inserisci il codice ricevuto via email.");
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otpCode.trim(),
      type: "email",
    });
    setLoading(false);
    if (error) {
      toast.error("Codice non valido o scaduto: " + error.message);
    } else {
      toast.success("Accesso effettuato con successo!");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[2000]">
        <DialogHeader>
          <DialogTitle>Accedi all'Area Cittadino · Terni 2030</DialogTitle>
          <DialogDescription>
            Salva in cloud i monumenti sbloccati nel TerniDex, accumula Punti Esploratore e ottieni sconti sui Dossier IA.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button onClick={loginGoogle} variant="outline" className="w-full font-semibold">
            Continua con Google
          </Button>
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-border"></div>
            <span className="mx-2 text-xs text-muted-foreground uppercase">Oppure senza password via Email</span>
            <div className="flex-grow border-t border-border"></div>
          </div>
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="tua@email.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={loginMagicLink} disabled={loading} className="w-full">
              {loading ? "Invio in corso..." : otpSent ? "Invia di nuovo Magic Link" : "Ricevi Magic Link via Email"}
            </Button>

            {otpSent && (
              <div className="mt-4 rounded-lg border border-accent/40 bg-secondary/40 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Hai ricevuto un codice numerico nell'email? Inseriscilo qui per entrare subito:
                </p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Codice OTP (es. 123456)"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                  />
                  <Button variant="secondary" onClick={verificaCodiceOtp} disabled={loading}>
                    Verifica
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
