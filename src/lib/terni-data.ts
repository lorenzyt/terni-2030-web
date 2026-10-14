import bandiReali from './bandi_reali.json';

export const TERNI_CENTER: [number, number] = [42.5636, 12.6427];

export const FONDI_STIMATI: Record<string, number> = {
  "Spazi Verdi": 0,
  "Viabilità": 0,
  "Edifici Sfitti": 0,
  "Decoro": 0,
  "Proposta Progettuale": 0,
};

export const PROFILI: { id: string; nome: string; desc: string }[] = [
  {
    id: "pubblico",
    nome: "Ambito Pubblico & Enti",
    desc: "Enti pubblici, scuole, istituti, associazioni e partenariati pubblico-privati",
  },
  {
    id: "impresa",
    nome: "Privato d'Impresa",
    desc: "PMI, attività commerciali, nuovi impianti industriali, artigiani, startup e P.IVA",
  },
  {
    id: "cittadino",
    nome: "Privato Personale Cittadino",
    desc: "Singoli cittadini residenti, nuclei familiari, proprietari immobiliari e condomini",
  },
];

const OBIETTIVI_BASE: { id: string; nome: string; desc?: string; sdg?: string[] }[] = [
  { id: "o1", nome: "Riqualificazione Urbana", desc: "Rigenerazione spazi, decoro, edilizia e recupero aree", sdg: ["SDG 11", "SDG 15"] },
  { id: "o2", nome: "Sostenibilità Energetica", desc: "Fotovoltaico, Conto Termico, CER ed efficientamento", sdg: ["SDG 7", "SDG 13"] },
  { id: "o3", nome: "Mobilità Dolce & Sostenibile", desc: "Piste ciclabili, micromobilità, sharing e trasporto green", sdg: ["SDG 11", "SDG 13"] },
  { id: "o4", nome: "Nuovo Impianto & Sviluppo Industriale", desc: "Insediamenti produttivi, macchinari, manifattura e ricerca", sdg: ["SDG 8", "SDG 9"] },
  { id: "o5", nome: "Commercio & Riuso Locali Sfitti", desc: "Botteghe, negozi di vicinato, vetrine e rilancio centro", sdg: ["SDG 8", "SDG 11"] },
  { id: "o6", nome: "Cultura, Turismo & Terzo Settore", desc: "Eventi, valorizzazione territoriale, inclusione e giovani", sdg: ["SDG 8", "SDG 11"] },
  { id: "o7", nome: "Digitalizzazione & Innovazione", desc: "Voucher digitali, IA, software e transizione 5.0", sdg: ["SDG 9"] },
];

const mappaObiettivi = new Map<string, { id: string; nome: string; desc?: string; sdg?: string[] }>();
for (const ob of OBIETTIVI_BASE) {
  mappaObiettivi.set(ob.id, ob);
}
for (const b of (bandiReali as any[])) {
  const idB = b.obiettivo_id || b.obiettivo;
  const nomeB = b.obiettivo_nome;
  if (idB && nomeB && !mappaObiettivi.has(idB)) {
    mappaObiettivi.set(idB, { id: idB, nome: nomeB, desc: "Obiettivo rilevato dai bandi attivi", sdg: ["SDG 11"] });
  }
}

export const OBIETTIVI: { id: string; nome: string; desc?: string; sdg?: string[] }[] = Array.from(mappaObiettivi.values());

// Tassonomia Agenda 2030 ONU calcolata dinamicamente sui bandi reali
export type GoalAgenda2030 = {
  codice: string;
  numero: number;
  titolo: string;
  colore: string;
  descrizione: string;
  obiettiviCollegati: string[];
  categorieMappa: string[];
};

export const AGENDA_2030_GOALS: GoalAgenda2030[] = [
  {
    codice: "SDG 7",
    numero: 7,
    titolo: "Energia Pulita e Accessibile",
    colore: "#fcc30b",
    descrizione: "Comunità Energetiche (CER), fotovoltaico, Conto Termico ed efficienza negli edifici.",
    obiettiviCollegati: ["o2"],
    categorieMappa: ["Proposta Progettuale"],
  },
  {
    codice: "SDG 8",
    numero: 8,
    titolo: "Lavoro Dignitoso e Crescita Economica",
    colore: "#a21942",
    descrizione: "Occupazione giovanile (FSE+), rilancio del commercio di vicinato, turismo e nuove aperture.",
    obiettiviCollegati: ["o5", "o6"],
    categorieMappa: ["Edifici Sfitti"],
  },
  {
    codice: "SDG 9",
    numero: 9,
    titolo: "Imprese, Innovazione e Infrastrutture",
    colore: "#fd6925",
    descrizione: "Nuovi impianti industriali, ricerca e sviluppo (PR FESR), digitalizzazione e Transizione 5.0.",
    obiettiviCollegati: ["o4", "o7"],
    categorieMappa: ["Proposta Progettuale"],
  },
  {
    codice: "SDG 11",
    numero: 11,
    titolo: "Città e Comunità Sostenibili",
    colore: "#fd9d24",
    descrizione: "Rigenerazione dei 36 quartieri di Terni, recupero spazi pubblici, decoro e housing sociale.",
    obiettiviCollegati: ["o1", "o3", "o5"],
    categorieMappa: ["Decoro", "Edifici Sfitti", "Viabilità"],
  },
  {
    codice: "SDG 13",
    numero: 13,
    titolo: "Lotta contro il Cambiamento Climatico",
    colore: "#3f7e44",
    descrizione: "Mobilità dolce e ciclabile, colonnine elettriche, decarbonizzazione e riduzione emissioni.",
    obiettiviCollegati: ["o2", "o3"],
    categorieMappa: ["Viabilità"],
  },
  {
    codice: "SDG 15",
    numero: 15,
    titolo: "Vita sulla Terra & Verde Urbano",
    colore: "#56c02b",
    descrizione: "Tutela dei parchi cittadini, riforestazione urbana, beni comuni e corridoi ecologici.",
    obiettiviCollegati: ["o1"],
    categorieMappa: ["Spazi Verdi"],
  },
];

export const CATEGORIA_TO_OBIETTIVO: Record<string, string> = {
  "Spazi Verdi": "o1",
  "Viabilità": "o3",
  "Edifici Sfitti": "o5",
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
  stato: "Aperta" | "In valutazione" | "Presa in carico" | "In revisione";
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

export type RaritaPOI = "Comune" | "Raro" | "Epico" | "Leggendario" | "Unico";

export const RARITA_STANDARD: Record<
  RaritaPOI,
  { punti: number; colore: string; label: string; desc: string }
> = {
  Comune: {
    punti: 25,
    colore: "#94a3b8",
    label: "Comune · 25 pt",
    desc: "Tappa urbana diffusa o punto d'interesse di quartiere",
  },
  Raro: {
    punti: 50,
    colore: "#3b82f6",
    label: "Raro · 50 pt",
    desc: "Luogo storico, artistico o identitario di rilievo cittadino",
  },
  Epico: {
    punti: 100,
    colore: "#a855f7",
    label: "Epico · 100 pt",
    desc: "Monumento, archeologia industriale o architettura d'eccellenza",
  },
  Leggendario: {
    punti: 200,
    colore: "#f59e0b",
    label: "Leggendario · 200 pt",
    desc: "Capolavoro simbolo della storia e dell'identità di Terni",
  },
  Unico: {
    punti: 500,
    colore: "#ef4444",
    label: "Unico · 500 pt",
    desc: "Patrimonio irripetibile di valore assoluto",
  },
};

export const ORDINE_RARITA: RaritaPOI[] = ["Comune", "Raro", "Epico", "Leggendario", "Unico"];

export type POI = {
  id: string;
  nome: string;
  autore: string;
  autoreScheda?: string;
  anno: string;
  categoria: "Architettura d'autore" | "Arte pubblica" | "Archeologia industriale" | "Storia e fede";
  lat: number;
  lng: number;
  punti: number;
  rarita: RaritaPOI;
  descrizione: string;
  
  immagine?: string;
  articolo?: string;
};

// Lista iniziale vuota: tutti i luoghi vengono inseriti da Lorenzo o dagli utenti previa approvazione Admin
export const POI_LIST: POI[] = [
  {
    id: "poi_1",
    nome: "Lancia di Luce (Obelisco di Arnaldo Pomodoro)",
    autore: "Arnaldo Pomodoro",
    anno: "1995",
    categoria: "Arte contemporanea",
    lat: 42.5646,
    lng: 12.6495,
    punti: 500,
    rarita: "Leggendario",
    descrizione: "Punto d'attrattività georeferenziato #1 di Terni (Arte contemporanea). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_2",
    nome: "Palazzo Spada",
    autore: "Antonio da Sangallo il Giovane",
    anno: "1546",
    categoria: "Architettura storica",
    lat: 42.5606,
    lng: 12.6467,
    punti: 200,
    rarita: "Epico",
    descrizione: "Punto d'attrattività georeferenziato #2 di Terni (Architettura storica). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_3",
    nome: "Anfiteatro Romano Fausto",
    autore: "Epoca Romana",
    anno: "32 d.C.",
    categoria: "Archeologia",
    lat: 42.5591,
    lng: 12.6443,
    punti: 200,
    rarita: "Epico",
    descrizione: "Punto d'attrattività georeferenziato #3 di Terni (Archeologia). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_4",
    nome: "Cattedrale di Santa Maria Assunta (Duomo)",
    autore: "Bernini / Barocci",
    anno: "XII-XVII sec.",
    categoria: "Architettura religiosa",
    lat: 42.5597,
    lng: 12.6436,
    punti: 100,
    rarita: "Raro",
    descrizione: "Punto d'attrattività georeferenziato #4 di Terni (Architettura religiosa). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_5",
    nome: "Basilica di San Valentino",
    autore: "Tradizione Paleocristiana",
    anno: "XVII sec.",
    categoria: "Luogo identitario",
    lat: 42.5501,
    lng: 12.6392,
    punti: 500,
    rarita: "Leggendario",
    descrizione: "Punto d'attrattività georeferenziato #5 di Terni (Luogo identitario). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_6",
    nome: "Chiesa di San Francesco e Cappella Paradisi",
    autore: "Scuola Trecentesca",
    anno: "1265",
    categoria: "Architettura religiosa",
    lat: 42.563,
    lng: 12.6438,
    punti: 100,
    rarita: "Raro",
    descrizione: "Punto d'attrattività georeferenziato #6 di Terni (Architettura religiosa). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_7",
    nome: "Chiesa di San Salvatore (Tempio del Sole)",
    autore: "Origine Romana / Paleocristiana",
    anno: "V-XI sec.",
    categoria: "Archeologia",
    lat: 42.5615,
    lng: 12.6472,
    punti: 100,
    rarita: "Raro",
    descrizione: "Punto d'attrattività georeferenziato #7 di Terni (Archeologia). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_8",
    nome: "Chiesa di Sant'Alo'",
    autore: "Ordine di Malta",
    anno: "XI sec.",
    categoria: "Architettura religiosa",
    lat: 42.5637,
    lng: 12.6455,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #8 di Terni (Architettura religiosa). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_9",
    nome: "Chiesa di San Pietro in Trivio",
    autore: "Architettura Medievale",
    anno: "XIII sec.",
    categoria: "Architettura religiosa",
    lat: 42.5612,
    lng: 12.6492,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #9 di Terni (Architettura religiosa). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_10",
    nome: "Chiesa di San Lorenzo",
    autore: "Architettura Medievale",
    anno: "XIII sec.",
    categoria: "Architettura religiosa",
    lat: 42.5603,
    lng: 12.6481,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #10 di Terni (Architettura religiosa). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_11",
    nome: "Chiesa di San Cristoforo",
    autore: "Fondazione Romanica",
    anno: "XII sec.",
    categoria: "Architettura religiosa",
    lat: 42.5621,
    lng: 12.6458,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #11 di Terni (Architettura religiosa). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_12",
    nome: "Palazzo Mazzancolli (Archivio di Stato)",
    autore: "Architettura Rinascimentale",
    anno: "XV sec.",
    categoria: "Architettura storica",
    lat: 42.561,
    lng: 12.6452,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #12 di Terni (Architettura storica). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_13",
    nome: "Palazzo Gazzoli",
    autore: "Architettura Settecentesca",
    anno: "XVIII sec.",
    categoria: "Architettura storica",
    lat: 42.5618,
    lng: 12.645,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #13 di Terni (Architettura storica). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_14",
    nome: "Palazzo Carrara",
    autore: "Architettura Nobiliare",
    anno: "XVII sec.",
    categoria: "Architettura storica",
    lat: 42.5608,
    lng: 12.6476,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #14 di Terni (Architettura storica). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_15",
    nome: "Palazzo Bianchini Riccardi",
    autore: "Architettura Rinascimentale",
    anno: "XVI sec.",
    categoria: "Architettura storica",
    lat: 42.5601,
    lng: 12.6455,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #15 di Terni (Architettura storica). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_16",
    nome: "Palazzo Castelli",
    autore: "Architettura Storica",
    anno: "XVI sec.",
    categoria: "Architettura storica",
    lat: 42.5625,
    lng: 12.6468,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #16 di Terni (Architettura storica). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_17",
    nome: "Palazzo Manassei",
    autore: "Architettura Storica",
    anno: "XVII sec.",
    categoria: "Architettura storica",
    lat: 42.5616,
    lng: 12.6461,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #17 di Terni (Architettura storica). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_18",
    nome: "Palazzo Montani",
    autore: "Architettura Ottocentesca",
    anno: "XIX sec.",
    categoria: "Architettura storica",
    lat: 42.562,
    lng: 12.6466,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #18 di Terni (Architettura storica). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_19",
    nome: "Palazzo Primavera",
    autore: "Mario Ridolfi e Wolfgang Frankl",
    anno: "1950",
    categoria: "Architettura d'autore",
    lat: 42.5622,
    lng: 12.6445,
    punti: 100,
    rarita: "Raro",
    descrizione: "Punto d'attrattività georeferenziato #19 di Terni (Architettura d'autore). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_20",
    nome: "Fontana dello Zodiaco (Piazza Tacito)",
    autore: "Mario Ridolfi, Volfango Frankl, Corrado Cagli",
    anno: "1936-1961",
    categoria: "Architettura d'autore",
    lat: 42.5642,
    lng: 12.6468,
    punti: 200,
    rarita: "Epico",
    descrizione: "Punto d'attrattività georeferenziato #20 di Terni (Architettura d'autore). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_21",
    nome: "Palazzo delle Poste e Telegrafi",
    autore: "Cesare Bazzani",
    anno: "1936",
    categoria: "Architettura d'autore",
    lat: 42.5635,
    lng: 12.6462,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #21 di Terni (Architettura d'autore). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_22",
    nome: "Palazzo del Governo (Prefettura)",
    autore: "Cesare Bazzani",
    anno: "1934",
    categoria: "Architettura d'autore",
    lat: 42.564,
    lng: 12.6475,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #22 di Terni (Architettura d'autore). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_23",
    nome: "Teatro Comunale Giuseppe Verdi",
    autore: "Luigi Poletti",
    anno: "1849",
    categoria: "Architettura d'autore",
    lat: 42.5614,
    lng: 12.6459,
    punti: 100,
    rarita: "Raro",
    descrizione: "Punto d'attrattività georeferenziato #23 di Terni (Architettura d'autore). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_24",
    nome: "Torre Romano-Medievale dei Barbarasa",
    autore: "Architettura Fortificata",
    anno: "XIII sec.",
    categoria: "Architettura storica",
    lat: 42.5619,
    lng: 12.6454,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #24 di Terni (Architettura storica). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_25",
    nome: "Porta Sant'Angelo",
    autore: "Mura Urbiche",
    anno: "XIV-XVI sec.",
    categoria: "Architettura storica",
    lat: 42.5594,
    lng: 12.6398,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #25 di Terni (Architettura storica). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_26",
    nome: "Porta Spoletina",
    autore: "Mura Urbiche",
    anno: "XIV sec.",
    categoria: "Architettura storica",
    lat: 42.5658,
    lng: 12.6453,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #26 di Terni (Architettura storica). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_27",
    nome: "Porta Romana",
    autore: "Mura Urbiche",
    anno: "XVI sec.",
    categoria: "Architettura storica",
    lat: 42.5579,
    lng: 12.6462,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #27 di Terni (Architettura storica). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_28",
    nome: "Corso Tacito (Asse Storico Pedonale)",
    autore: "Urbanistica Ottocentesca",
    anno: "XIX-XX sec.",
    categoria: "Spazio urbano",
    lat: 42.5627,
    lng: 12.6463,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #28 di Terni (Spazio urbano). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_29",
    nome: "Piazza della Repubblica e Biblioteca BCT",
    autore: "Riqualificazione Contemporanea",
    anno: "2006",
    categoria: "Cultura e Spazio urbano",
    lat: 42.5612,
    lng: 12.6465,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #29 di Terni (Cultura e Spazio urbano). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_30",
    nome: "Piazza Europa",
    autore: "Urbanistica Novecentesca",
    anno: "XX sec.",
    categoria: "Spazio urbano",
    lat: 42.5604,
    lng: 12.6469,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #30 di Terni (Spazio urbano). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_31",
    nome: "Piazza Solferino",
    autore: "Centro Storico",
    anno: "XIX sec.",
    categoria: "Spazio urbano",
    lat: 42.5623,
    lng: 12.6456,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #31 di Terni (Spazio urbano). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_32",
    nome: "Piazza San Francesco",
    autore: "Centro Storico",
    anno: "XIII sec.",
    categoria: "Spazio urbano",
    lat: 42.5629,
    lng: 12.6439,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #32 di Terni (Spazio urbano). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_33",
    nome: "Piazza dei Bambini e delle Bambine",
    autore: "Mario Ridolfi (Contesto)",
    anno: "XX sec.",
    categoria: "Spazio urbano",
    lat: 42.5624,
    lng: 12.6448,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #33 di Terni (Spazio urbano). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_34",
    nome: "Piazza Clai",
    autore: "Centro Storico",
    anno: "XX sec.",
    categoria: "Spazio urbano",
    lat: 42.5615,
    lng: 12.6485,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #34 di Terni (Spazio urbano). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_35",
    nome: "Piazza Bruno Buozzi (Valnerina)",
    autore: "Urbanistica Storica",
    anno: "XIX sec.",
    categoria: "Spazio urbano",
    lat: 42.5653,
    lng: 12.6487,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #35 di Terni (Spazio urbano). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_36",
    nome: "Largo Villa Glori",
    autore: "Mario Ridolfi (Sistemazione)",
    anno: "1955",
    categoria: "Spazio urbano",
    lat: 42.5632,
    lng: 12.6449,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #36 di Terni (Spazio urbano). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_37",
    nome: "Case Franconi",
    autore: "Mario Ridolfi e Volfango Frankl",
    anno: "1959",
    categoria: "Architettura d'autore",
    lat: 42.5633,
    lng: 12.6479,
    punti: 100,
    rarita: "Raro",
    descrizione: "Punto d'attrattività georeferenziato #37 di Terni (Architettura d'autore). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_38",
    nome: "Casa Briganti",
    autore: "Mario Ridolfi",
    anno: "1959",
    categoria: "Architettura d'autore",
    lat: 42.5602,
    lng: 12.6498,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #38 di Terni (Architettura d'autore). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_39",
    nome: "Casa Chitarrini",
    autore: "Mario Ridolfi",
    anno: "1951",
    categoria: "Architettura d'autore",
    lat: 42.5648,
    lng: 12.646,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #39 di Terni (Architettura d'autore). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_40",
    nome: "Casa Pallotta",
    autore: "Mario Ridolfi",
    anno: "1960",
    categoria: "Architettura d'autore",
    lat: 42.5586,
    lng: 12.6482,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #40 di Terni (Architettura d'autore). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_41",
    nome: "Casa De Mario",
    autore: "Mario Ridolfi",
    anno: "1963",
    categoria: "Architettura d'autore",
    lat: 42.5655,
    lng: 12.6435,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #41 di Terni (Architettura d'autore). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_42",
    nome: "Scuola Media Leonardo da Vinci",
    autore: "Mario Ridolfi e Volfango Frankl",
    anno: "1952-1960",
    categoria: "Architettura d'autore",
    lat: 42.5665,
    lng: 12.6442,
    punti: 100,
    rarita: "Raro",
    descrizione: "Punto d'attrattività georeferenziato #42 di Terni (Architettura d'autore). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_43",
    nome: "Istituto Tecnico Industriale A. Volta",
    autore: "Architettura Razionalista",
    anno: "1938",
    categoria: "Architettura d'autore",
    lat: 42.5652,
    lng: 12.6525,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #43 di Terni (Architettura d'autore). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_44",
    nome: "Liceo Classico Cornelio Tacito",
    autore: "Cesare Bazzani",
    anno: "1933",
    categoria: "Architettura d'autore",
    lat: 42.5645,
    lng: 12.6482,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #44 di Terni (Architettura d'autore). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_45",
    nome: "Quartiere INA-Casa Corso del Popolo",
    autore: "Mario Ridolfi",
    anno: "1954",
    categoria: "Architettura d'autore",
    lat: 42.5592,
    lng: 12.6478,
    punti: 100,
    rarita: "Raro",
    descrizione: "Punto d'attrattività georeferenziato #45 di Terni (Architettura d'autore). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_46",
    nome: "Passerella Protetta sul Fiume Nera",
    autore: "Architettura Contemporanea",
    anno: "XXI sec.",
    categoria: "Spazio urbano",
    lat: 42.5584,
    lng: 12.6471,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #46 di Terni (Spazio urbano). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_47",
    nome: "Ponte Carrara",
    autore: "Ingegneria Storica e Ricostruzione",
    anno: "XX sec.",
    categoria: "Spazio urbano",
    lat: 42.5596,
    lng: 12.6428,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #47 di Terni (Spazio urbano). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_48",
    nome: "Ponte Garibaldi",
    autore: "Ingegneria Urbana",
    anno: "XX sec.",
    categoria: "Spazio urbano",
    lat: 42.5582,
    lng: 12.6458,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #48 di Terni (Spazio urbano). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_49",
    nome: "Ponte Allende",
    autore: "Ingegneria Urbana",
    anno: "XX sec.",
    categoria: "Spazio urbano",
    lat: 42.5598,
    lng: 12.6522,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #49 di Terni (Spazio urbano). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_50",
    nome: "CAOS - Centro Arti Opificio Siri",
    autore: "Archeologia Industriale / Riuso",
    anno: "1919-2008",
    categoria: "Archeologia industriale",
    lat: 42.5595,
    lng: 12.6368,
    punti: 200,
    rarita: "Epico",
    descrizione: "Punto d'attrattività georeferenziato #50 di Terni (Archeologia industriale). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_51",
    nome: "Grande Pressa da 12.000 Tonnellate (Piazza Stazione)",
    autore: "Acciaierie di Terni",
    anno: "1935",
    categoria: "Archeologia industriale",
    lat: 42.5701,
    lng: 12.6502,
    punti: 200,
    rarita: "Epico",
    descrizione: "Punto d'attrattività georeferenziato #51 di Terni (Archeologia industriale). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_52",
    nome: "Acciaierie di Terni (Ingresso Storico Viale Brin)",
    autore: "Vincenzo Stefano Breda",
    anno: "1884",
    categoria: "Archeologia industriale",
    lat: 42.5662,
    lng: 12.6654,
    punti: 500,
    rarita: "Leggendario",
    descrizione: "Punto d'attrattività georeferenziato #52 di Terni (Archeologia industriale). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_53",
    nome: "Biblioteca e Archivio Storico ICSIM / AST",
    autore: "Patrimonio Industriale",
    anno: "XX sec.",
    categoria: "Archeologia industriale",
    lat: 42.5658,
    lng: 12.6621,
    punti: 100,
    rarita: "Raro",
    descrizione: "Punto d'attrattività georeferenziato #53 di Terni (Archeologia industriale). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_54",
    nome: "Ex Officine Bosco",
    autore: "Archeologia Industriale",
    anno: "1890",
    categoria: "Archeologia industriale",
    lat: 42.5681,
    lng: 12.6542,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #54 di Terni (Archeologia industriale). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_55",
    nome: "Ex Jutificio Centurini",
    autore: "Archeologia Industriale",
    anno: "1886",
    categoria: "Archeologia industriale",
    lat: 42.5628,
    lng: 12.6598,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #55 di Terni (Archeologia industriale). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_56",
    nome: "Ex Lanificio Gruber",
    autore: "Archeologia Industriale",
    anno: "1882",
    categoria: "Archeologia industriale",
    lat: 42.5641,
    lng: 12.6352,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #56 di Terni (Archeologia industriale). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_57",
    nome: "Centrale Idroelettrica di Galleto",
    autore: "Ingegneria Idroelettrica",
    anno: "1929",
    categoria: "Archeologia industriale",
    lat: 42.5582,
    lng: 12.7031,
    punti: 100,
    rarita: "Raro",
    descrizione: "Punto d'attrattività georeferenziato #57 di Terni (Archeologia industriale). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_58",
    nome: "Ex Stabilimento Elettrochimico di Papigno (Studi Cinematografici)",
    autore: "Archeologia Industriale / Cinema",
    anno: "1901-1997",
    categoria: "Archeologia industriale",
    lat: 42.5565,
    lng: 12.6952,
    punti: 200,
    rarita: "Epico",
    descrizione: "Punto d'attrattività georeferenziato #58 di Terni (Archeologia industriale). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_59",
    nome: "Stazione Ferroviaria di Terni e Pensilina Storica",
    autore: "Ingegneria Ferroviaria",
    anno: "1866-1950",
    categoria: "Spazio urbano",
    lat: 42.5708,
    lng: 12.6505,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #59 di Terni (Spazio urbano). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_60",
    nome: "Villaggio Operaio Matteotti",
    autore: "Giancarlo De Carlo",
    anno: "1969-1975",
    categoria: "Architettura d'autore",
    lat: 42.5528,
    lng: 12.6645,
    punti: 200,
    rarita: "Epico",
    descrizione: "Punto d'attrattività georeferenziato #60 di Terni (Architettura d'autore). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_61",
    nome: "Villaggio Polymer",
    autore: "Urbanistica Industriale",
    anno: "1950",
    categoria: "Archeologia industriale",
    lat: 42.5535,
    lng: 12.6152,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #61 di Terni (Archeologia industriale). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_62",
    nome: "Parco Archeologico e Passeggiata (La Passeggiata)",
    autore: "Giardini Pubblici / Mura",
    anno: "XIX sec.",
    categoria: "Natura e Parchi",
    lat: 42.5598,
    lng: 12.6418,
    punti: 100,
    rarita: "Raro",
    descrizione: "Punto d'attrattività georeferenziato #62 di Terni (Natura e Parchi). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_63",
    nome: "Parco Ciaurro",
    autore: "Verde Urbano",
    anno: "XX sec.",
    categoria: "Natura e Parchi",
    lat: 42.5593,
    lng: 12.6449,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #63 di Terni (Natura e Parchi). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_64",
    nome: "Parco Rosselli (Viale Trento)",
    autore: "Verde Urbano",
    anno: "XX sec.",
    categoria: "Natura e Parchi",
    lat: 42.5542,
    lng: 12.6445,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #64 di Terni (Natura e Parchi). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_65",
    nome: "Parco Le Grazie",
    autore: "Verde Urbano e Panorama",
    anno: "XX sec.",
    categoria: "Natura e Parchi",
    lat: 42.5515,
    lng: 12.6512,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #65 di Terni (Natura e Parchi). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_66",
    nome: "Parco di Viale Campofregoso (Lungo Nera)",
    autore: "Percorso Fluviale del Nera",
    anno: "XXI sec.",
    categoria: "Natura e Parchi",
    lat: 42.5592,
    lng: 12.6545,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #66 di Terni (Natura e Parchi). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_67",
    nome: "Parco Chico Mendes (Maratta)",
    autore: "Verde Attrezzato",
    anno: "XX sec.",
    categoria: "Natura e Parchi",
    lat: 42.5612,
    lng: 12.6195,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #67 di Terni (Natura e Parchi). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_68",
    nome: "Parco Emanuela Loi (Viale Trieste)",
    autore: "Verde di Quartiere",
    anno: "XX sec.",
    categoria: "Natura e Parchi",
    lat: 42.5562,
    lng: 12.6578,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #68 di Terni (Natura e Parchi). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_69",
    nome: "Stadio Libero Liberati",
    autore: "Ingegneria Sportiva",
    anno: "1969",
    categoria: "Sport e Impianti",
    lat: 42.5621,
    lng: 12.6341,
    punti: 100,
    rarita: "Raro",
    descrizione: "Punto d'attrattività georeferenziato #69 di Terni (Sport e Impianti). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_70",
    nome: "PalaTerni (Palazzetto dello Sport)",
    autore: "Architettura Contemporanea",
    anno: "2023",
    categoria: "Sport e Impianti",
    lat: 42.5608,
    lng: 12.6325,
    punti: 100,
    rarita: "Raro",
    descrizione: "Punto d'attrattività georeferenziato #70 di Terni (Sport e Impianti). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_71",
    nome: "Piscine dello Stadio (Foro Boario)",
    autore: "Impianto Sportivo",
    anno: "XX sec.",
    categoria: "Sport e Impianti",
    lat: 42.5615,
    lng: 12.6358,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #71 di Terni (Sport e Impianti). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_72",
    nome: "Ciclovia del Nera (Accesso Urbano Est)",
    autore: "Mobilità Dolce",
    anno: "XXI sec.",
    categoria: "Natura e Parchi",
    lat: 42.5618,
    lng: 12.6712,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #72 di Terni (Natura e Parchi). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_73",
    nome: "Santuario di Santa Maria delle Grazie",
    autore: "Architettura Rinascimentale",
    anno: "XV sec.",
    categoria: "Architettura religiosa",
    lat: 42.5508,
    lng: 12.6525,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #73 di Terni (Architettura religiosa). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_74",
    nome: "Convento di San Valentino e Colle",
    autore: "Architettura Storica",
    anno: "XVII sec.",
    categoria: "Architettura religiosa",
    lat: 42.5495,
    lng: 12.6388,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #74 di Terni (Architettura religiosa). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_75",
    nome: "Cimitero Monumentale di Terni",
    autore: "Architettura Funeraria",
    anno: "XIX sec.",
    categoria: "Architettura storica",
    lat: 42.5668,
    lng: 12.6745,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #75 di Terni (Architettura storica). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_76",
    nome: "Cascata delle Marmore - Belvedere Inferiore (Piazzale Byron)",
    autore: "Manio Curio Dentato (271 a.C.)",
    anno: "271 a.C.",
    categoria: "Natura e Parchi",
    lat: 42.5562,
    lng: 12.7145,
    punti: 500,
    rarita: "Leggendario",
    descrizione: "Punto d'attrattività georeferenziato #76 di Terni (Natura e Parchi). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_77",
    nome: "Cascata delle Marmore - Belvedere Superiore (Specola)",
    autore: "Pio VI / Andrea Vici",
    anno: "1781",
    categoria: "Natura e Parchi",
    lat: 42.5502,
    lng: 12.7195,
    punti: 500,
    rarita: "Leggendario",
    descrizione: "Punto d'attrattività georeferenziato #77 di Terni (Natura e Parchi). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_78",
    nome: "Sentiero 1 e Balcone degli Innamorati (Marmore)",
    autore: "Parco Fluviale del Nera",
    anno: "Storico",
    categoria: "Natura e Parchi",
    lat: 42.5535,
    lng: 12.7168,
    punti: 200,
    rarita: "Epico",
    descrizione: "Punto d'attrattività georeferenziato #78 di Terni (Natura e Parchi). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_79",
    nome: "Lago di Piediluco - Lungolago e Borgo dei Pescatori",
    autore: "Paesaggio Lacustre",
    anno: "Storico",
    categoria: "Natura e Parchi",
    lat: 42.5332,
    lng: 12.7548,
    punti: 200,
    rarita: "Epico",
    descrizione: "Punto d'attrattività georeferenziato #79 di Terni (Natura e Parchi). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_80",
    nome: "Rocca Albornoziana di Piediluco",
    autore: "Cardinale Albornoz",
    anno: "1364",
    categoria: "Architettura storica",
    lat: 42.5361,
    lng: 12.7555,
    punti: 100,
    rarita: "Raro",
    descrizione: "Punto d'attrattività georeferenziato #80 di Terni (Architettura storica). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_81",
    nome: "Santuario di San Francesco a Piediluco",
    autore: "Architettura Gotico-Francescana",
    anno: "1298",
    categoria: "Architettura religiosa",
    lat: 42.5338,
    lng: 12.7539,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #81 di Terni (Architettura religiosa). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_82",
    nome: "Centro Nazionale di Canottaggio Paolo D'Aloja (Piediluco)",
    autore: "Impianto Olimpico Federale",
    anno: "XX sec.",
    categoria: "Sport e Impianti",
    lat: 42.5315,
    lng: 12.7612,
    punti: 100,
    rarita: "Raro",
    descrizione: "Punto d'attrattività georeferenziato #82 di Terni (Sport e Impianti). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_83",
    nome: "Area Archeologica di Carsulae - Arco di San Damiano",
    autore: "Municipium Romano sulla Via Flaminia",
    anno: "III sec. a.C.",
    categoria: "Archeologia",
    lat: 42.6392,
    lng: 12.5618,
    punti: 500,
    rarita: "Leggendario",
    descrizione: "Punto d'attrattività georeferenziato #83 di Terni (Archeologia). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_84",
    nome: "Teatro e Anfiteatro Romano di Carsulae",
    autore: "Epoca Giulio-Claudia",
    anno: "I sec. d.C.",
    categoria: "Archeologia",
    lat: 42.6381,
    lng: 12.5605,
    punti: 200,
    rarita: "Epico",
    descrizione: "Punto d'attrattività georeferenziato #84 di Terni (Archeologia). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_85",
    nome: "Borgo di Cesi - Porta dell'Umbria e Mura Poligonali",
    autore: "Epoca Umbro-Romana e Medievale",
    anno: "VI sec. a.C.",
    categoria: "Borghi storici",
    lat: 42.6125,
    lng: 12.5962,
    punti: 200,
    rarita: "Epico",
    descrizione: "Punto d'attrattività georeferenziato #85 di Terni (Borghi storici). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_86",
    nome: "Chiesa di Santa Maria Assunta a Cesi",
    autore: "Architettura Storica",
    anno: "XII-XVII sec.",
    categoria: "Borghi storici",
    lat: 42.6131,
    lng: 12.5958,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #86 di Terni (Borghi storici). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_87",
    nome: "Sant'Erasmo di Cesi (Balcone Panoramico sulla Conca)",
    autore: "Natura e Osservatorio",
    anno: "Medievale",
    categoria: "Natura e Parchi",
    lat: 42.6215,
    lng: 12.5992,
    punti: 100,
    rarita: "Raro",
    descrizione: "Punto d'attrattività georeferenziato #87 di Terni (Natura e Parchi). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_88",
    nome: "Borgo di Collescipoli - Collegiata di Santa Maria Maggiore (Organo Hermans)",
    autore: "Willem Hermans",
    anno: "1678",
    categoria: "Borghi storici",
    lat: 42.5342,
    lng: 12.6198,
    punti: 100,
    rarita: "Raro",
    descrizione: "Punto d'attrattività georeferenziato #88 di Terni (Borghi storici). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_89",
    nome: "Collegiata di San Nicolò a Collescipoli",
    autore: "Architettura Romanico-Barocca",
    anno: "XII-XVII sec.",
    categoria: "Borghi storici",
    lat: 42.5335,
    lng: 12.6208,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #89 di Terni (Borghi storici). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_90",
    nome: "Chiostro di Santa Cecilia a Collescipoli",
    autore: "Convento Clarisse",
    anno: "XVI sec.",
    categoria: "Borghi storici",
    lat: 42.5348,
    lng: 12.6191,
    punti: 25,
    rarita: "Comune",
    descrizione: "Punto d'attrattività georeferenziato #90 di Terni (Borghi storici). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_91",
    nome: "Borgo di Papigno",
    autore: "Castello Medievale su Rupe",
    anno: "XIII sec.",
    categoria: "Borghi storici",
    lat: 42.5542,
    lng: 12.6995,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #91 di Terni (Borghi storici). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_92",
    nome: "Borgo di Miranda (Stella di Miranda)",
    autore: "Borgo Montano Panoramico",
    anno: "XII sec.",
    categoria: "Borghi storici",
    lat: 42.5321,
    lng: 12.7012,
    punti: 100,
    rarita: "Raro",
    descrizione: "Punto d'attrattività georeferenziato #92 di Terni (Borghi storici). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_93",
    nome: "Borgo di Torreorsina e Museo Aurelio De Felice",
    autore: "Scultura del Novecento",
    anno: "XIII-XX sec.",
    categoria: "Borghi storici",
    lat: 42.5698,
    lng: 12.7352,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #93 di Terni (Borghi storici). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_94",
    nome: "Borgo e Castello di Casteldilago",
    autore: "Fortificazione in Valnerina",
    anno: "XII sec.",
    categoria: "Borghi storici",
    lat: 42.5735,
    lng: 12.7421,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #94 di Terni (Borghi storici). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  },
  {
    id: "poi_95",
    nome: "Rocca San Zenone (Le Due Rocche)",
    autore: "Fortificazione sul Serra",
    anno: "XII sec.",
    categoria: "Borghi storici",
    lat: 42.5812,
    lng: 12.6785,
    punti: 50,
    rarita: "Non Comune",
    descrizione: "Punto d'attrattività georeferenziato #95 di Terni (Borghi storici). Scheda base pronta per la personalizzazione.",
    autoreScheda: "Lorenzo Covicchio"
  }
];

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
  "Centro Storico", "Città Giardino", "Villaggio Matteotti", "San Giovanni", "Cospea",
  "San Valentino", "Cesure", "Valenza", "Campomaggiore", "Polymer / Viale Brin",
  "Sabbione", "Borgo Bovio", "Le Grazie", "Rocca San Zenone", "Colle dell'Oro",
  "Palestro", "San Francesco", "Cardeto / Stazione", "Prisciano", "Borgo Rivo",
  "Campitello", "Gabelletta", "Maratta", "Fontana di Polo", "Cesi",
  "Carsulae / Portaria", "Collescipoli", "Piediluco", "Marmore", "Papigno",
  "Miranda", "Larviano", "Collestatte", "Torreorsina", "San Liberatore",
  "Poggio Lavarino / Battiferro",
];

export type Bando = {
  nome: string;
  ente: string;
  contributo: string;
  scadenza: string;
  match: number;
  nota: string;
  link?: string;
  ambiti?: string[];
  obiettivo_id?: string;
};

const tuttiBandiMappati: Bando[] = (bandiReali as any[]).map((b) => ({
  nome: b.titolo || "Bando Territoriale",
  ente: b.portale || b.ente || "Ente Pubblico",
  contributo: b.importo || "Consulta avviso",
  scadenza: b.scadenza || "Attivo",
  match: 88,
  nota: b.descrizione || "",
  link: b.link || "",
  ambiti: Array.isArray(b.ambiti) ? b.ambiti : ["pubblico", "impresa", "cittadino"],
  obiettivo_id: b.obiettivo_id || b.obiettivo || "o1",
}));

export const BANDI: Record<string, Bando[]> = {
  o1: tuttiBandiMappati.filter((b) => b.obiettivo_id === "o1"),
  o2: tuttiBandiMappati.filter((b) => b.obiettivo_id === "o2"),
  o3: tuttiBandiMappati.filter((b) => b.obiettivo_id === "o3"),
  o4: tuttiBandiMappati.filter((b) => b.obiettivo_id === "o4"),
  o5: tuttiBandiMappati.filter((b) => b.obiettivo_id === "o5"),
  o6: tuttiBandiMappati.filter((b) => b.obiettivo_id === "o6"),
  o7: tuttiBandiMappati.filter((b) => b.obiettivo_id === "o7"),
  ristrutturazione: tuttiBandiMappati.filter((b) => b.obiettivo_id === "o1"),
  apertura: tuttiBandiMappati.filter((b) => b.obiettivo_id === "o4" || b.obiettivo_id === "o5"),
  sfitto: tuttiBandiMappati.filter((b) => b.obiettivo_id === "o5"),
  energia: tuttiBandiMappati.filter((b) => b.obiettivo_id === "o2"),
  cultura: tuttiBandiMappati.filter((b) => b.obiettivo_id === "o6"),
};

export function filtraBandiPerDossier(
  profiloId: string,
  obiettivoId: string,
  testoObiettivoCustom?: string
): Bando[] {
  return tuttiBandiMappati.filter((b) => {
    const okProfilo = !profiloId || !b.ambiti || b.ambiti.includes(profiloId);
    if (!okProfilo) return false;
    if (testoObiettivoCustom) {
      const parole = testoObiettivoCustom.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      if (parole.length === 0) return false;
      const corpo = `${b.nome} ${b.nota} ${b.ente}`.toLowerCase();
      return parole.some((p) => corpo.includes(p));
    }
    return b.obiettivo_id === obiettivoId;
  });
}

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
    descrizione: "Contatta Terni.2030@outlook.it per apparire qui (pagamento concordato via PayPal, Revolut o Bonifico).",
    citta: "Terni",
    certificato: false,
    livello: "Sostenitore",
  }
];
