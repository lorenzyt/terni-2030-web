import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Copy, Mail, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const EMAIL_CONTATTO = "Terni.2030@outlook.it";

type Richiesta = { oggetto: string; contesto?: string };
const ContactCtx = createContext<(r: Richiesta) => void>(() => {});

export function useContact() {
  return useContext(ContactCtx);
}

export function ContactProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [req, setReq] = useState<Richiesta>({ oggetto: "" });
  const [nome, setNome] = useState("");
  const [mail, setMail] = useState("");
  const [msg, setMsg] = useState("");

  const apri = (r: Richiesta) => {
    setReq(r);
    setMsg("");
    setOpen(true);
  };

  const copia = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL_CONTATTO);
      toast.success("Indirizzo copiato negli appunti.");
    } catch {
      toast.info(EMAIL_CONTATTO);
    }
  };

  const invia = () => {
    const corpo = [
      `Richiesta: ${req.oggetto}`,
      req.contesto ? `Contesto: ${req.contesto}` : "",
      `Nome: ${nome || "-"}`,
      `Email di risposta: ${mail || "-"}`,
      "",
      msg || "(nessun messaggio aggiuntivo)",
      "",
      "— Inviato da Terni 2030",
    ]
      .filter((l) => l !== "")
      .join("\n");
    const href = `mailto:${EMAIL_CONTATTO}?subject=${encodeURIComponent(`[Terni 2030] ${req.oggetto}`)}&body=${encodeURIComponent(corpo)}`;
    window.location.href = href;
    toast.success("Si sta aprendo il tuo programma di posta con la richiesta pre-compilata.");
    setOpen(false);
  };

  return (
    <ContactCtx.Provider value={apri}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="z-[2000]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="size-5 text-accent" /> {req.oggetto}
            </DialogTitle>
            <DialogDescription>
              La richiesta arriva direttamente all'autore del progetto, Lorenzo Covicchio.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-2 px-3 py-2">
            <a href={`mailto:${EMAIL_CONTATTO}`} className="font-medium text-accent underline-offset-4 hover:underline">
              {EMAIL_CONTATTO}
            </a>
            <Button size="sm" variant="ghost" onClick={copia}>
              <Copy className="size-4" /> Copia
            </Button>
          </div>
          {req.contesto && (
            <p className="rounded-md border border-border p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Dati inclusi: </span>
              {req.contesto}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="c-nome">Nome</Label>
              <Input id="c-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="c-mail">La tua email</Label>
              <Input id="c-mail" type="email" value={mail} onChange={(e) => setMail(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="c-msg">Messaggio</Label>
            <Textarea id="c-msg" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Descrivi brevemente la tua richiesta" />
          </div>
          <Button onClick={invia} className="w-full">
            <Send className="size-4" /> Invia a {EMAIL_CONTATTO}
          </Button>
        </DialogContent>
      </Dialog>
    </ContactCtx.Provider>
  );
}
