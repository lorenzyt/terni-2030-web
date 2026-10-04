import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  POI_LIST,
  SEGNALAZIONI_INIZIALI,
  SONDAGGI,
  type Segnalazione,
} from "@/lib/terni-data";

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

const fb = (q: string) => `https://www.facebook.com/search/top?q=${encodeURIComponent(q)}`;

const INIZIALE: CivicState = {
  segnalazioni: SEGNALAZIONI_INIZIALI,
  votiSegnalazioni: [],
  commenti: {
    s3: [
      { id: "c1", autore: "Giulia R.", testo: "Sarebbe perfetto come cinema d'essai con bar sociale al piano terra.", data: "2026-09-04" },
      { id: "c2", autore: "Marco T. (architetto)", testo: "Variante: sala polivalente modulare, con accesso anche da Via Cavour.", data: "2026-09-06" },
    ],
    s5: [{ id: "c3", autore: "FIAB Terni", testo: "Serve un tratto protetto lungo la Flaminia a Papigno.", data: "2026-07-02" }],
    s2: [{ id: "c4", autore: "Residente Viale Brin", testo: "In orario di cambio turno il traffico pesante peggiora tutto.", data: "2026-08-01" }],
  },
  sondaggi: SONDAGGI.map((s) => ({ ...s, opzioni: s.opzioni.map((o) => ({ ...o })) })),
  votiSondaggi: {},
  obiettiviCommunity: [
    { id: "oc1", titolo: "Orti urbani condivisi", descrizione: "Corti verdi gestite dagli abitanti con compostiera di quartiere.", area: "Villaggio Matteotti" },
    { id: "oc2", titolo: "Vetrine sfitte per artigiani under 35", descrizione: "Canone simbolico per 24 mesi in cambio di apertura serale.", area: "Centro" },
    { id: "oc3", titolo: "Belvedere attrezzato alla Cascata", descrizione: "Punto sosta ciclisti e info-point multilingue.", area: "Marmore" },
  ],
  checkin: [],
  puntiSpesi: 0,
  scontoDossier: false,
  badgeEsploratore: false,
  premiPartner: [],
  recensioni: [
    { id: "r1", autore: "Federica M.", ruolo: "Commerciante — Corso Tacito", stelle: 5, testo: "Mi ha fatto capire in 10 minuti quali bandi erano cumulabili per la vetrina. Il cronoprogramma è stato utilissimo col commercialista.", data: "2026-09-12", verificata: true },
    { id: "r2", autore: "Ing. Paolo S.", ruolo: "Tecnico — Studio a Borgo Bovio", stelle: 4, testo: "Matrice di compatibilità chiara, la uso come prima scrematura con i clienti. Da integrare con i vincoli puntuali del PRG.", data: "2026-09-03", verificata: true },
    { id: "r3", autore: "Anna e Luca", ruolo: "Cittadini — Villaggio Matteotti", stelle: 5, testo: "Per l'efficientamento del condominio abbiamo scoperto il Conto Termico: non lo conoscevamo.", data: "2026-08-22", verificata: true },
  ],
  noteArticoli: {},
  postSocial: [
    { id: "ps1", pagina: "Interamna WebTV", tipo: "Video", testo: "Reportage sulle aree dismesse di Papigno: cosa resta dello stabilimento e quali ipotesi di riuso.", temi: ["Archeologia industriale", "Papigno"], data: "2026-09-24", reazioni: 214, link: fb("Interamna WebTV") },
    { id: "ps2", pagina: "Insieme per cambiare Terni", tipo: "Iniziativa", testo: "Assemblea pubblica sul futuro di Corso Tacito e dei negozi sfitti del centro: aperta a tutti.", temi: ["Centro storico", "Commercio"], data: "2026-09-21", reazioni: 167, link: fb("Insieme per cambiare Terni") },
    { id: "ps3", pagina: "Interamna WebTV", tipo: "Post", testo: "Qualità dell'aria a Prisciano e Borgo Rivo: i dati della settimana e le richieste dei comitati.", temi: ["Ambiente", "Salute"], data: "2026-09-18", reazioni: 98, link: fb("Interamna WebTV") },
    { id: "ps4", pagina: "Insieme per cambiare Terni", tipo: "Post", testo: "Mappatura collettiva delle panchine e fontanelle da ripristinare nei parchi cittadini.", temi: ["Spazi verdi", "Partecipazione"], data: "2026-09-14", reazioni: 132, link: fb("Insieme per cambiare Terni") },
  ],
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
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...INIZIALE, ...(JSON.parse(raw) as Partial<CivicState>) });
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const update = useCallback((fn: (s: CivicState) => CivicState) => setState(fn), []);
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
