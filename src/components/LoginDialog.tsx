import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/civic-store";

export function LoginDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (o: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const loginGoogle = async () => {
    if (!supabase) return toast.error("Supabase non connesso");
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + "/profilo" }
    });
  };

  const loginMagicLink = async () => {
    if (!supabase) return toast.error("Supabase non connesso");
    if (!email || !email.includes("@")) return toast.error("Inserisci un'email valida.");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/profilo" }
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Magic Link inviato! Controlla la tua casella di posta per accedere.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[2000]">
        <DialogHeader>
          <DialogTitle>Accedi a Terni 2030</DialogTitle>
          <DialogDescription>
            Entra per salvare i tuoi progressi nel TerniDex, accumulare punti e gestire i tuoi dossier.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button onClick={loginGoogle} variant="outline" className="w-full font-semibold">
             Continua con Google
          </Button>
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-border"></div>
            <span className="mx-2 text-xs text-muted-foreground uppercase">Oppure con Email</span>
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
              {loading ? "Invio in corso..." : "Invia Magic Link (Senza Password)"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
