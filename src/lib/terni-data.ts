export const TERNI_CENTER: [number, number] = [42.5636, 12.6427];

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

export const SEGNALAZIONI_INIZIALI: Segnalazione[] = [
  {
    id: "s1",
    titolo: "Riqualificazione Parco Le Grazie",
    descrizione: "Proposta di riqualificazione illuminazione e arredi.",
    categoria: "Spazi Verdi",
    quartiere: "Le Grazie",
    lat: 42.5684,
    lng: 12.6512,
    voti: 0,
    stato: "Aperta",
    data: new Date().toISOString().split('T')[0],
  }
];

export type Sondaggio = {
  id: string;
  domanda: string;
  contesto: string;
  opzioni: { id: string; testo: string; voti: number }[];
};

export const SONDAGGI: Sondaggio[] = [
  {
    id: "p1",
    domanda: "Quale priorità per il centro storico di Terni nel 2027?",
    contesto: "Sondaggio territoriale",
    opzioni: [
      { id: "a", testo: "Pedonalizzazione di Corso Tacito", voti: 0 },
      { id: "b", testo: "Riuso dei locali sfitti", voti: 0 },
      { id: "c", testo: "Più verde in Piazza Tacito", voti: 0 },
    ],
  }
];

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

export const BANDI: Record<string, Bando[]> = {
  ristrutturazione: [],
  apertura: [],
  sfitto: [],
  energia: [],
  cultura: [],
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
