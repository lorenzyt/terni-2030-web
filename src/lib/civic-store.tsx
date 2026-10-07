import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  BACHECA,
  POI_LIST,
  RARITA_STANDARD,
  SEGNALAZIONI_INIZIALI,
  SONDAGGI,
  type Associazione,
  type POI,
  type RaritaPOI,
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
  aggiornato?: string;
};

export type DossierLog = {
  id: string;
  orario: string;
  profilo: string;
  quartiere: string;
  obiettivo: string;
  azione: string;
  numero_bandi: number;
  elenco_bandi: string[];
};

export type PropostaModerazione = {
  id: string;
  tipo: "poi" | "bacheca" | "sondaggio" | "mappa";
  titolo: string;
  autore: string;
  contatto: string;
  data: string;
  stato: "In attesa" | "Approvata" | "Rifiutata";
  dati: any;
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
  poiExtra: POI[];
  bachecaExtra: Associazione[];
  auditBandi: Record<string, AuditBando>;
  dossierGenerati: DossierLog[];
  proposteModerazione: PropostaModerazione[];
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
  poiExtra: [],
  bachecaExtra: [],
  auditBandi: {},
  dossierGenerati: [],
  proposteModerazione: [],
};

const KEY = "terni2030-state-v5-clean-poi";

type Ctx = {
  state: CivicState;
  update: (fn: (s: CivicState) => CivicState) => void;
  ricaricaCloud: () => Promise<void>;
  puntiGuadagnati: number;
  puntiDisponibili: number;
};

const CivicContext = createContext<Ctx | null>(null);

export function CivicProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CivicState>(INIZIALE);
  const hydrated = useRef(false);

  const ricaricaCloud = useCallback(async () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const salvato = JSON.parse(raw) as Partial<CivicState>;
        setState((prev) => ({
          ...prev,
          checkin: salvato.checkin ?? prev.checkin,
          puntiSpesi: salvato.puntiSpesi ?? prev.puntiSpesi,
          scontoDossier: salvato.scontoDossier ?? prev.scontoDossier,
          badgeEsploratore: salvato.badgeEsploratore ?? prev.badgeEsploratore,
          votiSegnalazioni: salvato.votiSegnalazioni ?? prev.votiSegnalazioni,
          votiSondaggi: salvato.votiSondaggi ?? prev.votiSondaggi,
        }));
      }
    } catch {}

    if (!supabase) return;
    const { data } = await supabase.from("segnalazioni").select("*").order("created_at", { ascending: false });
    if (data) {
      const soloSegnalazioniMappa: Segnalazione[] = [];
      const mappaAudit: Record<string, AuditBando> = {};
      const listaDossier: DossierLog[] = [];
      const listaProposte: PropostaModerazione[] = [];
      const poiApprovati: POI[] = [];
      const bachecaApprovata: Associazione[] = [];
      const postApprovati: PostSocial[] = [];
      const sondaggiApprovati: SondaggioCivico[] = [];

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
              aggiornato: parsed.aggiornato || item.created_at,
            };
          } catch {
            mappaAudit[bandoKey] = { stato: item.stato || "Certificato", nota: item.descrizione || "" };
          }
        } else if (idStr.startsWith("dossier_")) {
          try {
            const parsed = JSON.parse(item.descrizione || "{}");
            listaDossier.push({
              id: idStr,
              orario: parsed.orario || item.created_at || "-",
              profilo: parsed.profilo || item.titolo || "-",
              quartiere: parsed.quartiere || item.quartiere || "-",
              obiettivo: parsed.obiettivo || "-",
              azione: parsed.azione || item.stato || "Dossier",
              numero_bandi: typeof parsed.numero_bandi === "number" ? parsed.numero_bandi : (item.voti || 0),
              elenco_bandi: Array.isArray(parsed.elenco_bandi) ? parsed.elenco_bandi : [],
            });
          } catch {}
        } else if (idStr.startsWith("prop_")) {
          try {
            const parsed = JSON.parse(item.descrizione || "{}");
            const stProp = (item.stato || parsed.stato || "In attesa") as PropostaModerazione["stato"];
            const propObj: PropostaModerazione = {
              id: idStr,
              tipo: parsed.tipo || "bacheca",
              titolo: item.titolo || parsed.titolo || "Proposta Utente",
              autore: parsed.autore || "Cittadino",
              contatto: parsed.contatto || "-",
              data: parsed.data || item.created_at || oggi(),
              stato: stProp,
              dati: parsed.dati || {},
            };
            listaProposte.push(propObj);

            if (stProp === "Approvata") {
              if (propObj.tipo === "poi" && propObj.dati) {
                const raritaScelta: RaritaPOI =
                  propObj.dati.rarita && RARITA_STANDARD[propObj.dati.rarita as RaritaPOI]
                    ? (propObj.dati.rarita as RaritaPOI)
                    : "Comune";
                poiApprovati.push({
                  id: idStr,
                  nome: propObj.dati.nome || propObj.titolo,
                  autore: propObj.dati.autore || propObj.autore,
                  anno: propObj.dati.anno || "Storico / Contemporaneo",
                  categoria: propObj.dati.categoria || "Architettura d'autore",
                  lat: Number(propObj.dati.lat) || 42.5636,
                  lng: Number(propObj.dati.lng) || 12.6427,
                  punti: RARITA_STANDARD[raritaScelta].punti,
                  rarita: raritaScelta,
                  descrizione: propObj.dati.descrizione || "",
                  curiosita: propObj.dati.curiosita || "Luogo certificato dalla Regia Terni 2030.",
                  immagine: propObj.dati.immagine,
                  articolo: propObj.dati.articolo,
                });
              } else if (propObj.tipo === "bacheca" && propObj.dati) {
                bachecaApprovata.push({
                  id: idStr,
                  nome: propObj.dati.nome || propObj.titolo,
                  tipo: propObj.dati.tipo || "Associazione",
                  descrizione: propObj.dati.descrizione || "",
                  ambito: propObj.dati.ambito || "Territorio",
                  contatto: propObj.contatto || propObj.dati.contatto || "",
                });
                postApprovati.push({
                  id: idStr,
                  pagina: propObj.dati.nome || propObj.titolo,
                  tipo: "Iniziativa",
                  testo: propObj.dati.descrizione || "",
                  temi: [propObj.dati.ambito || "Terni2030"],
                  data: propObj.data,
                  reazioni: item.voti || 0,
                  link: propObj.dati.link || "#",
                  segnalatoDaUtente: true,
                });
              } else if (propObj.tipo === "sondaggio" && propObj.dati) {
                sondaggiApprovati.push({
                  id: idStr,
                  domanda: propObj.dati.domanda || propObj.titolo,
                  contesto: propObj.dati.contesto || `Proposto da ${propObj.autore}`,
                  community: true,
                  opzioni: Array.isArray(propObj.dati.opzioni)
                    ? propObj.dati.opzioni
                    : [
                        { id: "a", testo: "Favorevole / Prioritario", voti: 0 },
                        { id: "b", testo: "Da valutare con modifiche", voti: 0 },
                      ],
                });
              }
            }
          } catch {}
        } else {
          // Segnalazioni Mappa: se sono "In revisione" vanno anche nella coda di moderazione Admin
          if (item.stato === "In revisione") {
            listaProposte.push({
              id: idStr,
              tipo: "mappa",
              titolo: item.titolo || "Segnalazione Mappa",
              autore: "Cittadino su Mappa GIS",
              contatto: item.quartiere || "Terni",
              data: item.created_at || oggi(),
              stato: "In attesa",
              dati: item,
            });
          } else if (item.stato !== "Rifiutata") {
            soloSegnalazioniMappa.push({
              ...item,
              data: item.created_at,
            });
          }
        }
      }

      setState((s) => ({
        ...s,
        segnalazioni: soloSegnalazioniMappa,
        poiExtra: poiApprovati,
        bachecaExtra: bachecaApprovata,
        postSocial: postApprovati,
        sondaggi: [...SONDAGGI, ...sondaggiApprovati],
        auditBandi: mappaAudit,
        dossierGenerati: listaDossier,
        proposteModerazione: listaProposte,
      }));
    }
  }, []);

  useEffect(() => {
    void ricaricaCloud();
    hydrated.current = true;
  }, [ricaricaCloud]);

  const update = useCallback((fn: (s: CivicState) => CivicState) => {
    setState((prev) => {
      const next = fn(prev);
      try {
        localStorage.setItem(KEY, JSON.stringify({
          checkin: next.checkin,
          puntiSpesi: next.puntiSpesi,
          scontoDossier: next.scontoDossier,
          badgeEsploratore: next.badgeEsploratore,
          votiSegnalazioni: next.votiSegnalazioni,
          votiSondaggi: next.votiSondaggi,
        }));
      } catch {}
      if (supabase) {
        const diff = next.segnalazioni.find((n, i) => n.voti !== prev.segnalazioni[i]?.voti);
        if (diff) supabase.from("segnalazioni").update({ voti: diff.voti }).eq("id", diff.id).then();
      }
      return next;
    });
  }, []);

  const tuttiPoi = [...POI_LIST, ...state.poiExtra];
  const puntiGuadagnati = tuttiPoi.filter((p) => state.checkin.includes(p.id)).reduce((a, p) => a + p.punti, 0);

  return (
    <CivicContext.Provider
      value={{ state, update, ricaricaCloud, puntiGuadagnati, puntiDisponibili: puntiGuadagnati - state.puntiSpesi }}
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

// Le segnalazioni mappa entrano con stato "In revisione" per passare dal permesso Admin
export async function inviaSegnalazione(segnalazione: Omit<Segnalazione, 'id' | 'created_at' | 'data'>) {
  if (!supabase) return;
  const { error } = await supabase.from("segnalazioni").insert({
    ...segnalazione,
    stato: "In revisione",
    id: nuovoId("s"),
    created_at: new Date().toISOString().split('T')[0]
  });
  if (error) console.error("Errore invio:", error);
}

// Invia una candidatura/proposta (Luogo POI, Bacheca, Sondaggio) alla coda di moderazione Admin
export async function inviaPropostaModerazione(payload: {
  tipo: "poi" | "bacheca" | "sondaggio";
  titolo: string;
  autore: string;
  contatto: string;
  dati: any;
}) {
  if (!supabase) return;
  const idRow = `prop_${payload.tipo}_${Date.now().toString(36)}`;
  await supabase.from("segnalazioni").insert({
    id: idRow,
    titolo: payload.titolo.slice(0, 120),
    quartiere: payload.dati?.quartiere || "Terni",
    categoria: "Proposta_Moderazione",
    stato: "In attesa",
    voti: 0,
    lat: Number(payload.dati?.lat) || 42.5636,
    lng: Number(payload.dati?.lng) || 12.6427,
    descrizione: JSON.stringify({
      ...payload,
      stato: "In attesa",
      data: oggi(),
    }),
    created_at: oggi(),
  });
}

// Permette all'Admin in Regia di Approvare o Rifiutare qualsiasi proposta
export async function inserisciPoiDirettoAdmin(payload: any) {
  if (!supabase) return;
  const idRow = `prop_poi_${Date.now().toString(36)}`;
  await supabase.from("segnalazioni").insert({
    id: idRow,
    titolo: payload.titolo.slice(0, 120),
    quartiere: "Regia",
    categoria: "Proposta_Moderazione",
    stato: "Approvata",
    voti: 0,
    lat: payload.lat || 42.5636,
    lng: payload.lng || 12.6427,
    descrizione: JSON.stringify({
      tipo: "poi",
      titolo: payload.titolo,
      autore: payload.autore,
      contatto: "Admin Diretto",
      data: oggi(),
      stato: "Approvata",
      dati: {
        nome: payload.titolo,
        autore: payload.autore,
        anno: payload.anno,
        categoria: payload.categoria,
        rarita: payload.rarita,
        punti: payload.punti,
        lat: payload.lat,
        lng: payload.lng,
        descrizione: payload.descrizione,
        curiosita: payload.curiosita,
        immagine: payload.immagine,
        articolo: payload.articolo,
      },
    }),
    created_at: oggi(),
  });
}

export async function gestisciPropostaAdmin(
  proposta: PropostaModerazione,
  esito: "Approvata" | "Rifiutata",
  raritaOverride?: RaritaPOI
) {
  if (!supabase) return;
  if (proposta.tipo === "mappa") {
    if (esito === "Approvata") {
      await supabase.from("segnalazioni").update({ stato: "Aperta" }).eq("id", proposta.id);
    } else {
      await supabase.from("segnalazioni").delete().eq("id", proposta.id);
    }
    return;
  }
  if (esito === "Rifiutata") {
    await supabase.from("segnalazioni").delete().eq("id", proposta.id);
  } else {
    const datiAggiornati = { ...(proposta.dati || {}) };
    if (proposta.tipo === "poi" && raritaOverride) {
      datiAggiornati.rarita = raritaOverride;
      datiAggiornati.punti = RARITA_STANDARD[raritaOverride].punti;
    }
    await supabase.from("segnalazioni").update({
      stato: "Approvata",
      descrizione: JSON.stringify({
        tipo: proposta.tipo,
        titolo: proposta.titolo,
        autore: proposta.autore,
        contatto: proposta.contatto,
        data: proposta.data,
        stato: "Approvata",
        dati: datiAggiornati,
      }),
    }).eq("id", proposta.id);
  }
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
      created_at: oggi(),
    });
  } catch (e) {
    console.error("Errore log dossier:", e);
  }
}

export async function salvaAuditBandoCloud(
  bandoKey: string,
  titolo: string,
  audit: AuditBando
) {
  if (!supabase) return;
  const idRow = `audit_${bandoKey}`;
  await supabase.from("segnalazioni").delete().eq("id", idRow);
  await supabase.from("segnalazioni").insert({
    id: idRow,
    titolo: titolo.slice(0, 120),
    quartiere: "Regia",
    categoria: "Audit_Bando",
    stato: audit.stato,
    voti: 0,
    lat: 42.5636,
    lng: 12.6427,
    descrizione: JSON.stringify(audit),
    created_at: oggi(),
  });
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
