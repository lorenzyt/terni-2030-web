import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  POI_LIST,
  SEGNALAZIONI_INIZIALI,
  SONDAGGI,
  type Segnalazione,
} from "@/lib/terni-data";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export type Commento = {
  id: string;
  autore: string;
  testo: string;
  data: string;
  esploratore?: boolean;
};

export type OpzioneSondaggio = { id: string; testo: string; voti: number; community?: boolean };
export type SondaggioCivico = {
  id: string;
  domanda: string;
  contesto: string;
  community?: boolean;
  opzioni: OpzioneSondaggio[];
};

export type ObiettivoCommunity = {
  id: string;
  titolo: string;
  descrizione: string;
  area: string;
};

export type Recensione = {
  id: string;
  autore: string;
  ruolo: string;
  stelle: number;
  testo: string;
  data: string;
  verificata: boolean;
};

export type PostSocial = {
  id: string;
  pagina: string;
  tipo: "Post" | "Video" | "Iniziativa";
  testo: string;
  temi: string[];
  data: string;
  reazioni: number;
  link: string;
  segnalatoDaUtente?: boolean;
};

export type AuditBando = {
  stato: "Certificato" | "Da Verificare" | "Scartato";
  linkUfficiale?: string;
  nota?: string;
  operatore?: string;
  data?: string;
};

export type CivicState = {
  segnalazioni: Segnalazione[];
  votiSegnalazioni: string[];
  commenti: Record<string, Commento[]>;
  sondaggi: SondaggioCivico[];
  votiSondaggi: Record<string, string>;
  obiettiviCommunity: ObiettivoCommunity[];
  checkin: string[];
  puntiSpesi: number;
  scontoDossier: boolean;
  badgeEsploratore: boolean;
  premiPartner: string[];
  recensioni: Recensione[];
  noteArticoli: Record<string, string[]>;
  postSocial: PostSocial[];
  auditBandi: Record<string, AuditBando>;
};

const oggi = () => new Date().toISOString().slice(0, 10);
export const nuovoId = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const INIZIALE: CivicState = {
  segnalazioni: SEGNALAZIONI_INIZIALI,
  votiSegnalazioni: [],
  commenti: {},
  sondaggi: SONDAGGI.map((s) => ({ ...s, opzioni: s.opzioni.map((o) => ({ ...o })) })),
  votiSondaggi: {},
  obiettiviCommunity: [],
  checkin: [],
  puntiSpesi: 0,
  scontoDossier: false,
  badgeEsploratore: false,
  premiPartner: [],
  recensioni: [],
  noteArticoli: {},
  postSocial: [],
  auditBandi: {},
};

const KEY = "terni2030-state-v3-clean";

type Ctx = {
  state: CivicState;
  update: (fn: (s: CivicState) => CivicState) => void;
  puntiGuadagnati: number;
  puntiDisponibili: number;
};

const CivicContext = createContext<Ctx | null>(null);

export function CivicProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CivicState>(INIZIALE);
  const hydrated = useRef(false);

  useEffect(() => {
    async function loadData() {
      try {
        localStorage.removeItem("terni2030-state-v1");
        localStorage.removeItem("terni2030-state-v2");
      } catch {}
      if (supabase) {
        const { data } = await supabase.from("segnalazioni").select("*");
        if (data) {
          const soloSegnalazioniMappa: Segnalazione[] = [];
          const mappaAudit: Record<string, AuditBando> = {};

          for (const item of data as any[]) {
            const idStr = String(item.id || "");
            if (idStr.startsWith("audit_")) {
              const bandoKey = idStr.replace("audit_", "");
              try {
                const parsed = JSON.parse(item.descrizione || "{}");
                mappaAudit[bandoKey] = {
                  stato: item.stato || parsed.stato || "Certificato",
                  linkUfficiale: parsed.linkUfficiale || "",
                  nota: parsed.nota || "",
                  operatore: parsed.operatore || "Controllore",
                  data: item.created_at,
                };
              } catch {
                mappaAudit[bandoKey] = { stato: item.stato || "Certificato", nota: item.descrizione || "" };
              }
            } else if (!idStr.startsWith("dossier_")) {
              soloSegnalazioniMappa.push({
                ...item,
                data: item.created_at,
              });
            }
          }
          setState((s) => ({ ...s, segnalazioni: soloSegnalazioniMappa, auditBandi: mappaAudit }));
        }
      }
      hydrated.current = true;
    }
    loadData();
  }, []);

  const update = useCallback((fn: (s: CivicState) => CivicState) => {
    setState((prev) => {
      const next = fn(prev);
      if (supabase) {
        const diff = next.segnalazioni.find((n, i) => n.voti !== prev.segnalazioni[i]?.voti);
        if (diff) supabase.from("segnalazioni").update({ voti: diff.voti }).eq("id", diff.id).then();
      } else {
        localStorage.setItem(KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const puntiGuadagnati = POI_LIST.filter((p) => state.checkin.includes(p.id)).reduce((a, p) => a + p.punti, 0);

  return (
    <CivicContext.Provider
      value={{ state, update, puntiGuadagnati, puntiDisponibili: puntiGuadagnati - state.puntiSpesi }}
    >
      {children}
    </CivicContext.Provider>
  );
}

export function useCivic() {
  const c = useContext(CivicContext);
  if (!c) throw new Error("useCivic fuori dal CivicProvider");
  return c;
}

export async function inviaSegnalazione(segnalazione: Omit<Segnalazione, 'id' | 'created_at' | 'data'>) {
  if (!supabase) return;
  const { error } = await supabase.from("segnalazioni").insert({
    ...segnalazione,
    id: nuovoId("s"),
    created_at: new Date().toISOString().split('T')[0]
  });
  if (error) console.error("Errore invio:", error);
}

export async function registraDossierGenerato(payload: {
  profilo: string;
  quartiere: string;
  obiettivo: string;
  azione: string;
  bandi: { nome: string; ente: string }[];
}) {
  if (!supabase) return;
  try {
    await supabase.from("segnalazioni").insert({
      id: `dossier_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
      titolo: `${payload.profilo} · ${payload.obiettivo}`,
      quartiere: payload.quartiere || "Terni",
      categoria: "Dossier_Log",
      stato: payload.azione,
      voti: payload.bandi.length,
      lat: 42.5636,
      lng: 12.6427,
      descrizione: JSON.stringify({
        orario: new Date().toLocaleString("it-IT"),
        profilo: payload.profilo,
        quartiere: payload.quartiere,
        obiettivo: payload.obiettivo,
        azione: payload.azione,
        numero_bandi: payload.bandi.length,
        elenco_bandi: payload.bandi.map((b) => `${b.nome} (${b.ente})`),
      }),
      created_at: new Date().toISOString().split("T")[0],
    });
  } catch (e) {
    console.error("Errore log dossier:", e);
  }
}

export function aggiungiCommento(update: Ctx["update"], chiave: string, autore: string, testo: string, esploratore: boolean) {
  update((s) => ({
    ...s,
    commenti: {
      ...s.commenti,
      [chiave]: [...(s.commenti[chiave] ?? []), { id: nuovoId("c"), autore: autore || "Cittadino anonimo", testo, data: oggi(), esploratore }],
    },
  }));
}

export { oggi };
export const COSTI_PREMI = { sconto: 300, badge: 200, partner: 150 } as const;
