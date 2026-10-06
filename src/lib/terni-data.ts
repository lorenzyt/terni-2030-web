import bandiReali from './bandi_reali.json';

export const TERNI_CENTER: [number, number] = [42.5636, 12.6427];

export const FONDI_STIMATI: Record<string, number> = {
  "Spazi Verdi": 0,
  "Viabilità": 0,
  "Edifici Sfitti": 0,
  "Decoro": 0,
  "Proposta Progettuale": 0,
};

export const OBIETTIVI: { id: string; nome: string }[] = [
  { id: "o1", nome: "Riqualificazione Urbana" },
  { id: "o2", nome: "Sostenibilità Energetica" },
];

export const PROFILI: { id: string; nome: string; desc: string }[] = [
  { id: "cittadino", nome: "Cittadino", desc: "Privato residente" },
  { id: "impresa", nome: "Impresa", desc: "Attività commerciale" },
];

export const CATEGORIA_TO_OBIETTIVO: Record<string, string> = {
  "Spazi Verdi": "o1",
  "Viabilità": "o1",
  "Edifici Sfitti": "o2",
  "Decoro": "o1",
  "Proposta Progettuale": "o2",
};

export type CategoriaSegnalazione =
  | "Spazi Verdi"
  | "Viabilità"
  | "Edifici Sfitti"
  | "Decoro"
  | "Proposta Progettuale";

export const CATEGORIE: CategoriaSegnalazione[] = [
  "Spazi Verdi",
  "Viabilità",
  "Edifici Sfitti",
  "Decoro",
  "Proposta Progettuale",
];

export const COLORI_CATEGORIA: Record<CategoriaSegnalazione, string> = {
  "Spazi Verdi": "#4ea86b",
  Viabilità: "#e2833a",
  "Edifici Sfitti": "#8f9aa8",
  Decoro: "#d8574a",
  "Proposta Progettuale": "#e8b23a",
};

export type Segnalazione = {
  id: string;
  titolo: string;
  descrizione: string;
  categoria: CategoriaSegnalazione;
  quartiere: string;
  lat: number;
  lng: number;
  voti: number;
  stato: "Aperta" | "In valutazione" | "Presa in carico";
  data: string;
};

export const SEGNALAZIONI_INIZIALI: Segnalazione[] = [];

export type Sondaggio = {
  id: string;
  domanda: string;
  contesto: string;
  opzioni: { id: string; testo: string; voti: number; community?: boolean }[];
  community?: boolean;
};

export const SONDAGGI: Sondaggio[] = [];

export type POI = {
  id: string;
  nome: string;
  autore: string;
  anno: string;
  categoria: "Architettura d'autore" | "Arte pubblica" | "Archeologia industriale" | "Storia e fede";
  lat: number;
  lng: number;
  punti: number;
  descrizione: string;
  curiosita: string;
};

export const POI_LIST: POI[] = [];

export type Associazione = {
  id: string;
  nome: string;
  tipo: "Associazione" | "Attivismo giovanile" | "Pagina social" | "Evento";
  descrizione: string;
  ambito: string;
  contatto: string;
};

export const BACHECA: Associazione[] = [];

export const QUARTIERI = [
  "Centro", "Borgo Bovio", "Le Grazie", "Villaggio Matteotti", "Rivo",
  "Polymer / Viale Brin", "Cospea", "Gabelletta", "Papigno", "Marmore", "Cesure",
];

export type Bando = {
  nome: string;
  ente: string;
  contributo: string;
  scadenza: string;
  match: number;
  nota: string;
};

const tuttiBandiMappati: Bando[] = (bandiReali as any[]).map((b) => ({
  nome: b.titolo || "Bando Territoriale",
  ente: b.ente || "Ente Pubblico",
  contributo: b.importo || "Consulta avviso",
  scadenza: b.scadenza || "Attivo",
  match: 85,
  nota: b.descrizione || "",
}));

export const BANDI: Record<string, Bando[]> = {
  o1: tuttiBandiMappati,
  o2: tuttiBandiMappati,
  ristrutturazione: tuttiBandiMappati,
  apertura: tuttiBandiMappati,
  sfitto: tuttiBandiMappati,
  energia: tuttiBandiMappati,
  cultura: tuttiBandiMappati,
};

export type Partner = {
  id: string;
  nome: string;
  settore: string;
  descrizione: string;
  citta: string;
  certificato: boolean;
  livello: "Platinum" | "Gold" | "Sostenitore";
};

export const PARTNERS: Partner[] = [
  {
    id: "p1",
    nome: "Spazio Sponsor Disponibile",
    settore: "Prenota la tua vetrina a 14,90€",
    descrizione: "Contatta Terni.2030@outlook.it per apparire qui.",
    citta: "Terni",
    certificato: false,
    livello: "Sostenitore",
  }
];
