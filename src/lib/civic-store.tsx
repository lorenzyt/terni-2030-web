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
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

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
};

const KEY = "terni2030-state-v2";

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
      if (supabase) {
        const { data } = await supabase.from("segnalazioni").select("*");
        if (data) setState((s) => ({ ...s, segnalazioni: data as Segnalazione[] }));
      } else {
        try {
          const raw = localStorage.getItem(KEY);
          if (raw) setState({ ...INIZIALE, ...(JSON.parse(raw) as Partial<CivicState>) });
        } catch {}
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
