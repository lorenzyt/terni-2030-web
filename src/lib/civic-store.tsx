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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://qmkhbwlqbpswcrvszjxd.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_yqbhDlGA6_Q7oQz1flEa9w_4Jw1DkF3";
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export type Commento = { id: string; autore: string; testo: string; data: string; esploratore?: boolean; };
export type OpzioneSondaggio = { id: string; testo: string; voti: number; community?: boolean };
export type SondaggioCivico = { id: string; domanda: string; contesto: string; community?: boolean; opzioni: OpzioneSondaggio[]; };
export type ObiettivoCommunity = { id: string; titolo: string; descrizione: string; area: string; };
export type Recensione = { id: string; autore: string; ruolo: string; stelle: number; testo: string; data: string; verificata: boolean; };
export type PostSocial = { id: string; pagina: string; tipo: "Post" | "Video" | "Iniziativa"; testo: string; temi: string[]; data: string; reazioni: number; link: string; segnalatoDaUtente?: boolean; };
export type AuditBando = { stato: "Certificato" | "Da Verificare" | "Scartato"; linkUfficiale?: string; nota?: string; operatore?: string; aggiornato?: string; };
export type DossierLog = { id: string; orario: string; profilo: string; quartiere: string; obiettivo: string; email?: string; azione: string; stato?: string; numero_bandi: number; elenco_bandi: string[]; bozza_testuale?: string; };
export type PropostaModerazione = { id: string; tipo: "poi" | "bacheca" | "sondaggio" | "mappa"; titolo: string; autore: string; contatto: string; data: string; stato: "In attesa" | "Approvata" | "Rifiutata"; dati: any; };

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

export const oggi = () => new Date().toISOString().split("T")[0];
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
  user: any;
};

const CivicContext = createContext<Ctx | null>(null);

export function CivicProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CivicState>(INIZIALE);
  const [user, setUser] = useState<any>(null);
  const userRef = useRef<any>(null);
  const hydrated = useRef(false);

  const ricaricaCloud = useCallback(async (sessionUser?: any) => {
    const activeUser = sessionUser !== undefined ? sessionUser : userRef.current;
    let dbCheckin: string[] | undefined = undefined;
    let dbPuntiSpesi: number | undefined = undefined;

    if (supabase && activeUser) {
      if (Array.isArray(activeUser.user_metadata?.luoghi_scoperti)) {
        dbCheckin = activeUser.user_metadata.luoghi_scoperti;
      }
      if (typeof activeUser.user_metadata?.punti_spesi === "number") {
        dbPuntiSpesi = activeUser.user_metadata.punti_spesi;
      }
      try {
        const { data } = await supabase.from("profili").select("luoghi_scoperti, punti_spesi").eq("id", activeUser.id).maybeSingle();
        if (data) {
          if (Array.isArray(data.luoghi_scoperti) && data.luoghi_scoperti.length > (dbCheckin?.length || 0)) {
            dbCheckin = data.luoghi_scoperti;
          }
          if (typeof data.punti_spesi === "number") {
            dbPuntiSpesi = Math.max(dbPuntiSpesi || 0, data.punti_spesi);
          }
        }
      } catch {}
    }

    try {
      const raw = localStorage.getItem(KEY);
      const salvato = raw ? (JSON.parse(raw) as Partial<CivicState>) : {};
      setState((prev) => {
        const mergedCheckin = Array.from(new Set([...(dbCheckin || []), ...(salvato.checkin || []), ...prev.checkin]));
        return {
          ...prev,
          checkin: mergedCheckin,
          puntiSpesi: dbPuntiSpesi ?? salvato.puntiSpesi ?? prev.puntiSpesi,
          scontoDossier: salvato.scontoDossier ?? prev.scontoDossier,
          badgeEsploratore: salvato.badgeEsploratore ?? prev.badgeEsploratore,
          votiSegnalazioni: salvato.votiSegnalazioni ?? prev.votiSegnalazioni,
          votiSondaggi: salvato.votiSondaggi ?? prev.votiSondaggi,
        };
      });
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
            const elenco = Array.isArray(parsed.elenco_bandi)
              ? parsed.elenco_bandi
              : Array.isArray(parsed.bandi)
              ? parsed.bandi.map((b: any) => (typeof b === "string" ? b : `${b.nome || b.titolo} (${b.ente || ""})`))
              : [];
            listaDossier.push({
              id: idStr,
              orario: parsed.orario || item.created_at || "-",
              profilo: parsed.profilo || item.titolo || "-",
              quartiere: parsed.quartiere || item.quartiere || "-",
              obiettivo: parsed.obiettivo || "-",
              email: parsed.email || "-",
              azione: parsed.azione || item.stato || "Richiesta Dossier",
              stato: item.stato || "Da Supervisionare",
              numero_bandi: typeof parsed.numero_bandi === "number" ? parsed.numero_bandi : elenco.length,
              elenco_bandi: elenco,
              bozza_testuale: parsed.bozza_testuale,
            });
          } catch {}
        } else if (idStr.startsWith("prop_")) {
          try {
            const parsed = JSON.parse(item.descrizione || "{}");
            const stProp = (item.stato || parsed.stato || "In attesa") as PropostaModerazione["stato"];
            if (stProp === "Rifiutata") { supabase.from("segnalazioni").delete().eq("id", idStr).then(); continue; }
            if (stProp === "Rifiutata") {
              supabase.from("segnalazioni").delete().eq("id", idStr).then();
              continue;
            }
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
                const raritaScelta: RaritaPOI = propObj.dati.rarita && RARITA_STANDARD[propObj.dati.rarita as RaritaPOI] ? (propObj.dati.rarita as RaritaPOI) : "Comune";
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
                  autoreScheda: propObj.dati.autoreScheda || propObj.autore,
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
                  opzioni: Array.isArray(propObj.dati.opzioni) ? propObj.dati.opzioni : [{ id: "a", testo: "Favorevole / Prioritario", voti: 0 }, { id: "b", testo: "Da valutare con modifiche", voti: 0 }],
                });
              }
            }
          } catch {}
        } else if (idStr !== "config_admin_auth") {
          if (item.stato === "In revisione") {
            listaProposte.push({ id: idStr, tipo: "mappa", titolo: item.titolo || "Segnalazione Mappa", autore: "Cittadino su Mappa GIS", contatto: item.quartiere || "Terni", data: item.created_at || oggi(), stato: "In attesa", dati: item });
          } else if (item.stato !== "Rifiutata") {
            soloSegnalazioniMappa.push({ ...item, data: item.created_at });
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
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const u = session?.user ?? null;
        userRef.current = u;
        setUser(u);
        void ricaricaCloud(u);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
        const u = session?.user ?? null;
        userRef.current = u;
        setUser(u);
        void ricaricaCloud(u);
      });
      return () => subscription.unsubscribe();
    } else {
      void ricaricaCloud();
    }
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

        const currentUser = userRef.current;
        if (currentUser) {
          supabase.auth.updateUser({
            data: {
              luoghi_scoperti: next.checkin,
              punti_spesi: next.puntiSpesi,
            }
          }).catch(() => {});

          supabase.from("profili").upsert({
            id: currentUser.id,
            email: currentUser.email,
            luoghi_scoperti: next.checkin,
            punti_spesi: next.puntiSpesi,
          }).then();
        }
      }
      return next;
    });
  }, []);

  const puntiGuadagnati = [...POI_LIST, ...state.poiExtra].filter((p) => state.checkin.includes(p.id)).reduce((a, p) => a + p.punti, 0);
  const puntiDisponibili = Math.max(0, puntiGuadagnati - state.puntiSpesi);

  return (
    <CivicContext.Provider value={{ state, update, ricaricaCloud, puntiGuadagnati, puntiDisponibili, user }}>
      {children}
    </CivicContext.Provider>
  );
}

export function useCivic() {
  const c = useContext(CivicContext);
  if (!c) throw new Error("useCivic fuori dal CivicProvider");
  return c;
}

export const COSTI_PREMI = { sconto: 500, badge: 1000, partner: 150 } as const;

export async function inviaSegnalazione(segnalazione: Omit<Segnalazione, "id" | "created_at" | "data">) {
  if (!supabase) return;
  await supabase.from("segnalazioni").insert({ ...segnalazione, stato: "In revisione", id: nuovoId("s"), created_at: oggi() });
}

export async function inviaPropostaModerazione(payload: { tipo: "poi" | "bacheca" | "sondaggio"; titolo: string; autore: string; contatto: string; dati: any; }) {
  if (!supabase) return;
  await supabase.from("segnalazioni").insert({
    id: `prop_${payload.tipo}_${Date.now().toString(36)}`,
    titolo: payload.titolo.slice(0, 120),
    quartiere: payload.dati?.quartiere || "Terni",
    categoria: "Proposta_Moderazione",
    stato: "In attesa",
    voti: 0,
    lat: Number(payload.dati?.lat) || 42.5636,
    lng: Number(payload.dati?.lng) || 12.6427,
    descrizione: JSON.stringify({ ...payload, stato: "In attesa", data: oggi() }),
    created_at: oggi(),
  });
}

export async function gestisciPropostaAdmin(id: string, stato: string) {
  if (!supabase) return;
  if (stato === "Rifiutata") {
    await supabase.from("segnalazioni").delete().eq("id", id);
    return;
  }
  const { data: row } = await supabase.from("segnalazioni").select("descrizione").eq("id", id).maybeSingle();
  let nuovaDesc = row?.descrizione;
  if (nuovaDesc) {
    try {
      const p = JSON.parse(nuovaDesc);
      p.stato = stato;
      nuovaDesc = JSON.stringify(p);
    } catch {}
  }
  await supabase.from("segnalazioni").update({ stato, ...(nuovaDesc ? { descrizione: nuovaDesc } : {}) }).eq("id", id);
}

export async function inserisciPoiDirettoAdmin(payload: any) {
  if (!supabase) return;
  await supabase.from("segnalazioni").insert({
    id: `prop_poi_${Date.now().toString(36)}`,
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
      autore: payload.autoreStorico || payload.autore || "Non specificato",
      autoreScheda: payload.autoreScheda || "Lorenzo Covicchio",
      contatto: "Admin Diretto",
      data: oggi(),
      stato: "Approvata",
      dati: {
        nome: payload.titolo,
        autore: payload.autoreStorico || payload.autore || "Non specificato",
        autoreScheda: payload.autoreScheda || "Lorenzo Covicchio",
        anno: payload.anno,
        categoria: payload.categoria,
        rarita: payload.rarita,
        punti: payload.punti,
        lat: payload.lat,
        lng: payload.lng,
        descrizione: payload.descrizione,
        immagine: payload.immagine,
        articolo: payload.articolo,
      },
    }),
    created_at: oggi(),
  });
}

export async function modificaPoiAdmin(id: string, payload: any) {
  if (!supabase) return;
  await supabase.from("segnalazioni").update({
    titolo: payload.titolo.slice(0, 120),
    lat: payload.lat || 42.5636,
    lng: payload.lng || 12.6427,
    descrizione: JSON.stringify({
      tipo: "poi",
      titolo: payload.titolo,
      autore: payload.autoreStorico || payload.autore || "Non specificato",
      autoreScheda: payload.autoreScheda || "Lorenzo Covicchio",
      contatto: "Admin Diretto",
      data: oggi(),
      stato: "Approvata",
      dati: {
        nome: payload.titolo,
        autore: payload.autoreStorico || payload.autore || "Non specificato",
        autoreScheda: payload.autoreScheda || "Lorenzo Covicchio",
        anno: payload.anno,
        categoria: payload.categoria,
        rarita: payload.rarita,
        punti: payload.punti,
        lat: payload.lat,
        lng: payload.lng,
        descrizione: payload.descrizione,
        immagine: payload.immagine,
        articolo: payload.articolo,
      },
    }),
  }).eq("id", id);
}

export async function eliminaPoiAdmin(id: string) {
  if (!supabase) return;
  await supabase.from("segnalazioni").delete().eq("id", id);
}

export async function getDossiersAdmin() {
  if (!supabase) return [];
  const { data } = await supabase.from("segnalazioni").select("*").eq("categoria", "Dossier_Generato").order("created_at", { ascending: false });
  return data || [];
}

export async function eliminaDossierAdmin(id: string) {
  if (!supabase) return;
  await supabase.from("segnalazioni").delete().eq("id", id);
}

export async function modificaStatoDossierAdmin(id: string, stato: string) {
  if (!supabase) return;
  await supabase.from("segnalazioni").update({ stato }).eq("id", id);
}

export async function registraDossierGenerato(payload: any) {
  if (!supabase) return;
  const emailInput = document.getElementById("dossierEmail") as HTMLInputElement | null;
  const email = (payload.email || emailInput?.value || "").trim();
  if (!email || !email.includes("@")) throw new Error("Email non valida.");

  const orario = new Date().toLocaleString("it-IT");
  const bandiRaw = Array.isArray(payload.bandi_completi) ? payload.bandi_completi : Array.isArray(payload.bandi) ? payload.bandi : [];
  const elencoBandi = bandiRaw.map((b: any) => typeof b === "string" ? b : `${b.titolo || b.nome} — ${b.portale || b.ente || ""} (${b.importo || ""})`);

  const righeSchede = bandiRaw.map((b: any, idx: number) => {
    if (typeof b === "string") return `${idx + 1}.${b}`;
    return [
      `----------------------------------------------------------------------`,
      `MISURA #${idx + 1}:${b.titolo || b.nome}`,
      `----------------------------------------------------------------------`,
      `• Ente / Canale Erogatore: ${b.ente || b.portale || "Istituzionale"}`,
      `• Asse d'Intervento: ${b.asse_specifico || b.obiettivo_nome || payload.obiettivo}`,
      `• Dotazione / Agevolazione: ${b.importo || "Contributo a fondo perduto / finanziamento agevolato"}`,
      `• Stato / Scadenza: ${b.scadenza || "Sportello attivo"}`,
      `• Sintesi Operativa: ${b.descrizione || "-"}`,
      `• Pagina Specifica del Bando / Sportello: ${b.link || "https://www.regione.umbria.it/bandi"}`
    ].join("\n");
  }).join("\n\n");

  const bozzaTestuale = [
    `======================================================================`,
    ` DOSSIER STRATEGICO BANDI & FINANZIAMENTI — TERNI 2030`,
    ` Supervisionato da Lorenzo Covicchio`,
    `======================================================================`,
    `Data elaborazione: ${orario}`,
    `Destinatario: ${email}`,
    `Profilo Richiedente: ${payload.profilo || "Cittadino / Impresa"}`,
    `Quartiere / Ambito di Terni: ${payload.quartiere || "Terni"}`,
    `Obiettivo Progettuale: ${payload.obiettivo || "Generale"}`,
    `Misure Compatibili Individuate: ${bandiRaw.length}`,
    ``,
    `1. QUADRO DELLE MISURE E DEI BANDI INDIVIDUATI`,
    righeSchede || "Ricerca personalizzata su misura in fase di istruttoria.",
    ``,
    `2. CHECKLIST DOCUMENTALE E PASSI OPERATIVI CONSIGLIATI`,
    `• Verifica dei requisiti soggettivi (SPID/CIE per privati, Visura Camerale e DURC regolare per imprese/ETS).`,
    `• Raccolta preventivi di spesa analitici e cronoprogramma dell'intervento nel quartiere ${payload.quartiere || "indicato"}.`,
    `• Verifica di cumulabilità tra incentivi regionali (PR FESR/FSE+), nazionali (GSE/Invitalia/MLPS) e comunali.`,
    `======================================================================`
  ].join("\n");

  const fullPayload = { ...payload, email, orario, numero_bandi: elencoBandi.length, elenco_bandi: elencoBandi, bozza_testuale: bozzaTestuale };
  const idRow = `dossier_${Date.now().toString(36)}`;
  
  await supabase.from("segnalazioni").insert({
    id: idRow,
    titolo: `Dossier di ${email}`,
    quartiere: payload.quartiere || "ND",
    categoria: "Dossier_Generato",
    stato: "Da Supervisionare",
    voti: elencoBandi.length,
    lat: 42.5636,
    lng: 12.6427,
    descrizione: JSON.stringify(fullPayload),
    created_at: oggi()
  });

  try {
    await supabase.from("dossier_generati").insert({
      email, profilo: payload.profilo || "Cittadino", quartiere: payload.quartiere || "Terni", obiettivo: payload.obiettivo || "Generale", bandi_trovati: elencoBandi, stato: "Da Supervisionare"
    });
  } catch {}
}

export async function salvaAuditBandoCloud(key: string, titolo: string, record: AuditBando) {
  if (!supabase) return;
  const idRow = `audit_${key}`;
  await supabase.from("segnalazioni").delete().eq("id", idRow);
  await supabase.from("segnalazioni").insert({
    id: idRow,
    titolo: titolo.slice(0, 120),
    quartiere: "Regia",
    categoria: "Audit_Bando",
    stato: record.stato,
    voti: 0,
    lat: 42.5636,
    lng: 12.6427,
    descrizione: JSON.stringify(record),
    created_at: oggi()
  });
}

export async function aggiungiCommento(autore: string, testo: string, poiId: string) {
  if (!supabase) return;
  await supabase.from("segnalazioni").insert({
    id: `commento_${Date.now().toString(36)}`,
    titolo: `Commento di ${autore}`,
    quartiere: poiId,
    categoria: "Commento",
    stato: "Pubblicato",
    voti: 0,
    lat: 42.5636,
    lng: 12.6427,
    descrizione: JSON.stringify({ autore, testo, data: oggi() }),
    created_at: oggi()
  });
}
