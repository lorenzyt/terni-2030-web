import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase, useCivic } from "@/lib/civic-store";
import { useNavigate } from "@tanstack/react-router";
import { Lock, Mail, UserCheck } from "lucide-react";

// Hash SHA-256 predefinito per le credenziali di prova iniziali:
// Nome Utente: admin_lorenzo  |  Password: Terni2030!Prova
export const DEFAULT_ADMIN_HASH = "e6b3f0a341c4fe833804e05136a4a5fa8d8e6234e6f89b82a7c87dc16f8fd242";

export async function calcolaHashCredenziali(username: string, password: string): Promise<string> {
  const cleanUser = username.trim().toLowerCase();
  const payload = `terni2030_exclusive_salt::${cleanUser}::${password}`;
  const msgBuffer = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verificaCredenzialiAdminEsclusive(username: string, password: string): Promise<boolean> {
  const hashInserito = await calcolaHashCredenziali(username, password);

  // 1. Controlla se Lorenzo ha salvato nuove credenziali cifrate su Supabase Cloud
  if (supabase) {
    try {
      const { data } = await supabase
        .from("segnalazioni")
        .select("descrizione")
        .eq("id", "config_admin_auth")
        .maybeSingle();
      if (data?.descrizione) {
        const parsed = JSON.parse(data.descrizione);
        if (parsed.hash) {
          return hashInserito === parsed.hash;
        }
      }
    } catch {}
  }

  // 2. Controlla eventuale hash salvato in locale
  try {
    const localHash = localStorage.getItem("terni2030_custom_admin_hash");
    if (localHash) {
      return hashInserito === localHash;
    }
  } catch {}

  // 3. Verifica con le credenziali di prova iniziali (admin_lorenzo / Terni2030!Prova)
  const hashProva = await calcolaHashCredenziali("admin_lorenzo", "Terni2030!Prova");
  return hashInserito === hashProva || hashInserito === DEFAULT_ADMIN_HASH;
}

export function LoginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { user } = useCivic() || {};
  const navigate = useNavigate();
  const [modo, setModo] = useState<"credenziali" | "magic">("credenziali");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailMagic, setEmailMagic] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && open) {
      onOpenChange(false);
    }
  }, [user, open, onOpenChange]);

  const handleLoginCredenziali = async () => {
    if (!usernameOrEmail.trim() || !password) {
      return toast.error("Inserisci Nome Utente (o Email) e Password.");
    }
    setLoading(true);
    try {
      // 1. Verifica se sono le credenziali esclusive di Regia (Lorenzo)
      const isRegiaAdmin = await verificaCredenzialiAdminEsclusive(usernameOrEmail, password);
      if (isRegiaAdmin) {
        sessionStorage.setItem("terni2030_regia_session", "authorized");
        localStorage.setItem("terni2030_is_admin", "1");
        setLoading(false);
        onOpenChange(false);
        toast.success("Accesso Esclusivo Regia riconosciuto! Benvenuto Lorenzo.");
        navigate({ to: "/regia" });
        return;
      }

      // 2. Altrimenti prova il normale login cittadino con Email + Password su Supabase
      if (supabase && usernameOrEmail.includes("@")) {
        const { error } = await supabase.auth.signInWithPassword({
          email: usernameOrEmail.trim(),
          password,
        });
        if (!error) {
          setLoading(false);
          onOpenChange(false);
          toast.success("Accesso effettuato!");
          navigate({ to: "/profilo" });
          return;
        }
      }

      setLoading(false);
      toast.error("Credenziali non valide. Se sei un cittadino senza password, usa il tab 'Magic Link / Google'.");
    } catch (e: any) {
      setLoading(false);
      toast.error("Errore durante la verifica: " + e.message);
    }
  };

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
    if (!emailMagic || !emailMagic.includes("@")) return toast.error("Inserisci un'email valida.");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: emailMagic.trim(),
      options: { emailRedirectTo: window.location.origin + "/profilo" }
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setOtpSent(true);
      toast.success("Ti abbiamo inviato l'email! Clicca sul link oppure inserisci il codice OTP.");
    }
  };

  const verificaCodiceOtp = async () => {
    if (!supabase || !otpCode.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: emailMagic.trim(),
      token: otpCode.trim(),
      type: "email",
    });
    setLoading(false);
    if (error) {
      toast.error("Codice non valido: " + error.message);
    } else {
      toast.success("Accesso effettuato!");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[2000]">
        <DialogHeader>
          <DialogTitle>Accedi a Terni 2030</DialogTitle>
          <DialogDescription>
            Accedi con Nome Utente e Password oppure entra nell'Area Cittadino con Email/Google.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/60 rounded-lg mt-2">
          <button
            onClick={() => setModo("credenziali")}
            className={`py-1.5 text-xs font-bold rounded-md transition ${
              modo === "credenziali" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
            }`}
          >
            <Lock className="inline size-3.5 mr-1" /> Utente & Password
          </button>
          <button
            onClick={() => setModo("magic")}
            className={`py-1.5 text-xs font-bold rounded-md transition ${
              modo === "magic" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
            }`}
          >
            <Mail className="inline size-3.5 mr-1" /> Magic Link / Google
          </button>
        </div>

        {modo === "credenziali" ? (
          <div className="space-y-3 py-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Nome Utente o Email</label>
              <Input
                type="text"
                placeholder="Nome utente o tua@email.it"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Password</label>
              <Input
                type="password"
                placeholder="????????????"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLoginCredenziali()}
                className="mt-1"
              />
            </div>
            <Button onClick={handleLoginCredenziali} disabled={loading} className="w-full font-bold">
              <UserCheck className="mr-2 size-4" /> {loading ? "Verifica in corso..." : "Accedi Ora"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-3">
            <Button onClick={loginGoogle} variant="outline" className="w-full font-semibold">
              Continua con Google
            </Button>
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-border"></div>
              <span className="mx-2 text-xs text-muted-foreground uppercase">Oppure senza password</span>
              <div className="flex-grow border-t border-border"></div>
            </div>
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="tua@email.it"
                value={emailMagic}
                onChange={(e) => setEmailMagic(e.target.value)}
              />
              <Button onClick={loginMagicLink} disabled={loading} className="w-full">
                {loading ? "Invio in corso..." : "Ricevi Magic Link via Email"}
              </Button>
              {otpSent && (
                <div className="flex gap-2 pt-2">
                  <Input
                    type="text"
                    placeholder="Codice OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                  />
                  <Button variant="secondary" onClick={verificaCodiceOtp} disabled={loading}>
                    Verifica
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
