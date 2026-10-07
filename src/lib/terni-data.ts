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
  anno: string;
  categoria: "Architettura d'autore" | "Arte pubblica" | "Archeologia industriale" | "Storia e fede";
  lat: number;
  lng: number;
  punti: number;
  rarita: RaritaPOI;
  descrizione: string;
  curiosita: string;
  immagine?: string;
  articolo?: string;
};

// Lista iniziale vuota: tutti i luoghi vengono inseriti da Lorenzo o dagli utenti previa approvazione Admin
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
