export type Articolo = {
  id: string; // = POI id
  titolo: string;
  occhiello: string;
  lettura: number;
  data: string;
  sezioni: { titolo: string; paragrafi: string[]; citazione?: string }[];
};

export const AUTORE = "Lorenzo Covicchio";

export const ARTICOLI: Record<string, Articolo> = {
  poi1: {
    id: "poi1",
    titolo: "La Fontana dello Zodiaco: il cielo dentro la piazza dell'acciaio",
    occhiello: "Piazza Tacito come cerniera fra la città ottocentesca e quella industriale",
    lettura: 7,
    data: "2026-09-10",
    sezioni: [
      {
        titolo: "Una vasca come orologio civico",
        paragrafi: [
          "Piazza Tacito nasce come atto di fondazione della Terni moderna. La vasca circolare progettata da Mario Ridolfi, con i mosaici zodiacali di Corrado Cagli, trasforma un incrocio di traffico in un orologio cosmico: il tempo delle stagioni si sovrappone al tempo dei turni di fabbrica.",
          "Il dualismo che attraversa l'intera città — l'Amore di San Valentino e l'Acciaio delle acciaierie — trova qui una sintesi geometrica: il cerchio, figura dell'unione, inciso in una piazza dal disegno razionale e industriale.",
        ],
        citazione: "«A Terni il cielo si guarda in basso: è disegnato sul fondo di una fontana.»",
      },
      {
        titolo: "Lettura compositiva",
        paragrafi: [
          "La fontana funziona come perno visivo degli assi di Corso Tacito e Viale della Stazione. Il bordo basso invita alla sosta, i getti d'acqua scandiscono il ritmo dell'attraversamento. Oggi la sfida è restituire alla piazza la sua vocazione pedonale e un'illuminazione che valorizzi i mosaici di notte.",
        ],
      },
    ],
  },
  poi2: {
    id: "poi2",
    titolo: "Largo Villa Glori: la fossa generativa di Ridolfi e Frankl",
    occhiello: "Dalle macerie dei 108 bombardamenti nasce un laboratorio dell'architettura del dopoguerra",
    lettura: 9,
    data: "2026-09-05",
    sezioni: [
      {
        titolo: "La città ferita",
        paragrafi: [
          "Fra il 1943 e il 1944 Terni subì 108 bombardamenti: la città dell'acciaio era un obiettivo strategico. Largo Villa Glori nasce letteralmente da una ferita, una depressione del terreno — la «fossa» — che Ridolfi e Wolfgang Frankl trasformano in principio generativo del progetto.",
          "Il Piano Regolatore di Ridolfi e Frankl non si limita a ricostruire: ripensa Terni come città-laboratorio, in cui ogni edificio è sperimentazione su laterizio, ferro e dettaglio artigianale.",
        ],
        citazione: "«Il dettaglio costruttivo è una forma di rispetto per chi abiterà la casa.» — Mario Ridolfi",
      },
      {
        titolo: "Balconi, tetti, mattoni",
        paragrafi: [
          "Le palazzine INA-Casa si dispongono attorno al vuoto della fossa come un anfiteatro domestico. Balconi sagomati, coperture articolate, infissi disegnati uno per uno: un catalogo di soluzioni che ha reso Terni tappa obbligata per generazioni di architetti.",
        ],
      },
    ],
  },
  poi3: {
    id: "poi3",
    titolo: "Villaggio Matteotti: i ballatoi di De Carlo e l'architettura della partecipazione",
    occhiello: "Quando gli operai della Terni hanno progettato le proprie case",
    lettura: 10,
    data: "2026-08-28",
    sezioni: [
      {
        titolo: "Progettare con gli abitanti",
        paragrafi: [
          "Fra il 1969 e il 1975 Giancarlo De Carlo intervista le famiglie operaie e propone decine di tipologie di alloggio. Il Villaggio Matteotti diventa uno dei manifesti mondiali dell'architettura partecipata.",
          "I ballatoi e i percorsi pedonali sopraelevati separano il traffico dalla vita sociale: sotto le auto, sopra i bambini, i giardini pensili, gli incontri.",
        ],
        citazione: "«L'architettura è troppo importante per lasciarla soltanto agli architetti.» — Giancarlo De Carlo",
      },
      {
        titolo: "Una lezione per Terni 2030",
        paragrafi: [
          "La manutenzione delle corti verdi e dei ballatoi è oggi la condizione per mantenere vivo quel patto sociale. È lo spirito con cui questa piattaforma invita i cittadini a segnalare, discutere e co-progettare.",
        ],
      },
    ],
  },
  poi4: {
    id: "poi4",
    titolo: "La Lancia di Luce di Pomodoro: l'acciaio che diventa simbolo",
    occhiello: "Trenta metri di acciaio inox ternano verso il cielo",
    lettura: 6,
    data: "2026-08-20",
    sezioni: [
      {
        titolo: "Un obelisco industriale",
        paragrafi: [
          "Nel 1995 Arnaldo Pomodoro dona alla città un obelisco realizzato con l'acciaio delle acciaierie ternane. La Lancia di Luce è letteralmente fatta della materia della città: un monumento al lavoro più che al potere.",
          "Le superfici riflettenti catturano la luce e la restituiscono mutevole: l'acciaio, materia dura, diventa vibrazione luminosa.",
        ],
        citazione: "«La scultura deve rivelare la forza nascosta della materia.»",
      },
    ],
  },
  poi5: {
    id: "poi5",
    titolo: "C.A.O.S.: dalle sintesi chimiche alle sintesi culturali",
    occhiello: "L'ex opificio SIRI come modello di rigenerazione dell'archeologia industriale",
    lettura: 8,
    data: "2026-08-12",
    sezioni: [
      {
        titolo: "Capriate e residenze artistiche",
        paragrafi: [
          "Nell'ex stabilimento SIRI nacque la sintesi industriale dell'ammoniaca in Italia. Oggi le grandi capriate ospitano museo archeologico, pinacoteca, teatro e spazi per la creatività contemporanea.",
          "Il C.A.O.S. dimostra che il riuso è una strategia economica oltre che culturale: replicarne il modello a Papigno e nelle altre aree dismesse è uno degli obiettivi di Terni 2030.",
        ],
      },
    ],
  },
  poi6: {
    id: "poi6",
    titolo: "San Valentino: perché Terni è la città dell'Amore",
    occhiello: "Il santuario del vescovo patrono degli innamorati",
    lettura: 6,
    data: "2026-08-01",
    sezioni: [
      {
        titolo: "Il polo dell'Amore",
        paragrafi: [
          "La Basilica custodisce le spoglie di San Valentino, vescovo di Terni. Ogni febbraio la Promessa di Fedeltà richiama coppie da tutta Italia: è l'altro polo del dualismo ternano, complementare all'acciaio.",
          "Un percorso pedonale e luminoso fra Basilica e centro può trasformare questa ricorrenza in un'infrastruttura turistica permanente.",
        ],
        citazione: "«Amore e Acciaio non sono opposti: sono le due mani della stessa città.»",
      },
    ],
  },
};
