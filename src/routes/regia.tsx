import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  FileText,
  Trash2,
  Clock,
  RefreshCw,
  ExternalLink,
  Mail,
  Building2,
  HeartHandshake,
  Lock,
  KeyRound,
  Copy,
  Download,
  Eye,
  LogOut,
  MapPin,
  Plus,
  Pencil,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  useCivic,
  supabase,
  salvaAuditBandoCloud,
  eliminaDossierAdmin,
  modificaStatoDossierAdmin,
  gestisciPropostaAdmin,
  inserisciPoiDirettoAdmin,
  modificaPoiAdmin,
  eliminaPoiAdmin,
} from "@/lib/civic-store";
import { calcolaHashCredenziali, verificaCredenzialiAdminEsclusive } from "@/components/LoginDialog";
import { TerniMap } from "@/components/TerniMap";
import { ORDINE_RARITA, RARITA_STANDARD, TERNI_CENTER, type POI, type RaritaPOI } from "@/lib/terni-data";
import bandiRealiJson from "@/lib/bandi_reali.json";
import syncMetaJson from "@/lib/sync_meta.json";

export const Route = createFileRoute("/regia")({
  component: RegiaPage,
});

function normKey(titolo: string): string {
  return String(titolo || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
}

function fmtEuro(val: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val || 0);
}

function estraiNomeCommittente(emailOrName: string, fallback: string): string {
  const raw = String(emailOrName || "").trim();
  if (!raw || raw === "Non specificata" || raw === "-") {
    return String(fallback || "Committente").replace(/[^a-zA-Z0-9._-]/g, "_");
  }
  const base = raw.includes("@") ? raw.split("@")[0] : raw;
  return base.replace(/[^a-zA-Z0-9._-]/g, "_") || "Committente";
}

const DEFAULT_POI_FORM = {
  id: "",
  titolo: "",
  autoreStorico: "",
  autoreScheda: "Lorenzo Covicchio",
  anno: "Storico / Contemporaneo",
  categoria: "Architettura d'autore",
  rarita: "Comune" as RaritaPOI,
  lat: 42.5636,
  lng: 12.6427,
  descrizione: "",
  immagine: "",
  articolo: "",
};

function normalizzaRigaDossier(row: any): any {
  const idStr = String(row?.id || "");
  let parsed: any = {};
  if (typeof row?.descrizione === "string") {
    try {
      parsed = JSON.parse(row.descrizione);
    } catch {
      parsed = {};
    }
  } else if (row && typeof row === "object") {
    parsed = row;
  }

  let bandiList: string[] = [];
  if (Array.isArray(parsed.elenco_bandi) && parsed.elenco_bandi.length > 0) {
    bandiList = parsed.elenco_bandi.map((x: any) =>
      typeof x === "string" ? x : (x?.nome || x?.titolo || "Bando") + " (" + (x?.ente || x?.portale || "") + ")"
    );
  } else if (Array.isArray(parsed.bandi) && parsed.bandi.length > 0) {
    bandiList = parsed.bandi.map((x: any) =>
      typeof x === "string" ? x : (x?.nome || x?.titolo || "Bando") + " (" + (x?.ente || x?.portale || "") + ")"
    );
  }

  const emailEstratta =
    parsed.email ||
    row?.email ||
    (typeof row?.titolo === "string" && row.titolo.includes("@") ? row.titolo.replace("Dossier di ", "").trim() : "Non specificata");

  const NL = String.fromCharCode(10);
  const bozzaDefault = [
    "======================================================================",
    " DOSSIER STRATEGICO BANDI & FINANZIAMENTI — TERNI 2030",
    " Supervisionato da Lorenzo Covicchio",
    "======================================================================",
    "Destinatario: " + emailEstratta,
    "Profilo: " + (parsed.profilo || "Cittadino / Impresa") + " | Quartiere: " + (parsed.quartiere || "Terni"),
    "Obiettivo: " + (parsed.obiettivo || "Analisi Bandi"),
    "",
    "MISURE COMPATIBILI INDIVIDUATE:",
    ...(bandiList.length > 0 ? bandiList.map((b, i) => String(i + 1) + ". " + b) : ["Ricerca personalizzata in istruttoria"]),
    "",
    "PASSI CONSIGLIATI:",
    "1. Verifica requisiti soggettivi e preventivi di spesa.",
    "2. Invio domanda telematica tramite sportello ufficiale.",
  ].join(NL);

  return {
    id: idStr || "dossier_" + Math.random().toString(36).slice(2, 7),
    orario: parsed.orario || row?.orario || row?.created_at || "Oggi",
    email: emailEstratta,
    profilo: parsed.profilo || row?.profilo || "Cittadino / Impresa",
    quartiere: parsed.quartiere || row?.quartiere || "Terni",
    obiettivo: parsed.obiettivo || row?.obiettivo || "Analisi Bandi",
    azione: parsed.azione || row?.azione || "In attesa di supervisione",
    stato: row?.stato || parsed.stato || "Da Supervisionare",
    prezzo: parsed.prezzo_applicato || 14.9,
    sconto: Boolean(parsed.sconto_punti),
    numero_bandi: bandiList.length,
    elenco_bandi: bandiList,
    bozza_testuale: parsed.bozza_testuale || bozzaDefault,
  };
}

function RegiaPage() {
  const { state, ricaricaCloud } = useCivic() || ({} as any);
  const [authOk, setAuthOk] = useState(false);
  const [operatoreNome, setOperatoreNome] = useState("Lorenzo Covicchio");
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [tab, setTab] = useState<"dossier" | "bandi" | "moderazione" | "urbango" | "sicurezza">("dossier");
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [dossierAperto, setDossierAperto] = useState<string | null>(null);
  const [testiModificati, setTestiModificati] = useState<Record<string, string>>({});

  const [poiForm, setPoiForm] = useState(DEFAULT_POI_FORM);
  const [editingPoiId, setEditingPoiId] = useState<string | null>(null);
  const [savingPoi, setSavingPoi] = useState(false);

  const [ruoloTarget, setRuoloTarget] = useState<"lorenzo" | "gianluca">("lorenzo");
  const [nuovoUser, setNuovoUser] = useState("");
  const [nuovaPass, setNuovaPass] = useState("");
  const [confermaPass, setConfermaPass] = useState("");
  const [isDefaultPassword, setIsDefaultPassword] = useState(false);
  const [feedbackCredenziali, setFeedbackCredenziali] = useState<string | null>(null);

  const [qBandi, setQBandi] = useState("");
  const [fMacro, setFMacro] = useState<"" | "citta" | "welfare">("");
  const [fStato, setFStato] = useState<"" | "verde" | "giallo" | "rosso">("");

  useEffect(() => {
    try {
      if (sessionStorage.getItem("terni2030_regia_session") === "authorized") {
        setAuthOk(true);
        const op = sessionStorage.getItem("terni2030_regia_operatore");
        if (op) {
          setOperatoreNome(op);
          if (op.includes("Gianluca") && !localStorage.getItem("terni2030_custom_admin_hash_gianluca")) {
            setIsDefaultPassword(true);
          } else if (op.includes("Lorenzo") && !localStorage.getItem("terni2030_custom_admin_hash")) {
            setIsDefaultPassword(true);
          }
        }
      }
    } catch {}
  }, []);

  const handleLoginEsclusivo = async () => {
    if (!loginUser.trim() || !loginPass) {
      return toast.error("Inserisci Nome Utente e Password.");
    }
    setVerifying(true);
    const rawEsito: any = await verificaCredenzialiAdminEsclusive(loginUser, loginPass);
    setVerifying(false);
    const isOk = typeof rawEsito === "boolean" ? rawEsito : Boolean(rawEsito?.ok);
    const opName = typeof rawEsito === "object" && rawEsito?.operatore ? rawEsito.operatore : "Lorenzo Covicchio";
    if (isOk) {
      sessionStorage.setItem("terni2030_regia_session", "authorized");
      sessionStorage.setItem("terni2030_regia_operatore", opName);
      localStorage.setItem("terni2030_is_admin", "1");
      setOperatoreNome(opName);
      if (loginPass === "Terni2030!Gianluca" || loginPass === "Terni2030!Prova") {
        setIsDefaultPassword(true);
      }
      setAuthOk(true);
      toast.success("Accesso Regia autorizzato. Benvenuto " + opName + "!");
    } else {
      toast.error("Credenziali non autorizzate per la Regia.");
    }
  };

  const handleLogoutRegia = () => {
    sessionStorage.removeItem("terni2030_regia_session");
    sessionStorage.removeItem("terni2030_regia_operatore");
    localStorage.removeItem("terni2030_is_admin");
    setAuthOk(false);
    setLoginPass("");
    toast.info("Sessione Regia chiusa.");
  };

  const salvaNuoveCredenzialiCifrate = async () => {
    setFeedbackCredenziali(null);
    if (nuovoUser.trim().length < 4) {
      return toast.error("Scegli un Nome Utente di almeno 4 caratteri.");
    }
    if (nuovaPass.length < 8) {
      return toast.error("Scegli una Password sicura di almeno 8 caratteri.");
    }
    if (nuovaPass !== confermaPass) {
      return toast.error("Le due password non coincidono.");
    }
    try {
      const nuovoHash = await calcolaHashCredenziali(nuovoUser, nuovaPass);
      if (ruoloTarget === "lorenzo") {
        localStorage.setItem("terni2030_custom_admin_hash", nuovoHash);
      } else {
        localStorage.setItem("terni2030_custom_admin_hash_gianluca", nuovoHash);
      }
      setIsDefaultPassword(false);

      if (supabase) {
        let payloadPrecedente: any = {};
        const { data: existing } = await supabase
          .from("segnalazioni")
          .select("descrizione")
          .eq("id", "config_admin_auth")
          .maybeSingle();
        if (existing?.descrizione) {
          try {
            payloadPrecedente = JSON.parse(existing.descrizione);
          } catch {}
        }

        const nuovoPayload = {
          ...payloadPrecedente,
          ...(ruoloTarget === "lorenzo" ? { hash: nuovoHash } : { hash_gianluca: nuovoHash }),
          aggiornato: new Date().toLocaleString("it-IT"),
        };

        await supabase.from("segnalazioni").delete().eq("id", "config_admin_auth");
        await supabase.from("segnalazioni").insert({
          id: "config_admin_auth",
          titolo: "Configurazione Sicurezza Regia",
          quartiere: "Regia",
          categoria: "System_Config",
          stato: "Attivo",
          voti: 0,
          lat: 42.5636,
          lng: 12.6427,
          descrizione: JSON.stringify(nuovoPayload),
          created_at: new Date().toISOString().split("T")[0],
        });
      }

      const nomeProfilo = ruoloTarget === "lorenzo" ? "Lorenzo Covicchio (Admin)" : "Gianluca (Collaboratore Regia)";
      const msgConferma =
        "Credenziali per " +
        nomeProfilo +
        " aggiornate con successo (Nuovo Utente: «" +
        nuovoUser.trim() +
        "» · Cifratura SHA-256 attiva il " +
        new Date().toLocaleTimeString("it-IT") +
        "). Le vecchie credenziali temporanee sono state disattivate.";

      setNuovoUser("");
      setNuovaPass("");
      setConfermaPass("");
      setFeedbackCredenziali(msgConferma);
      toast.success("✅ " + msgConferma);
    } catch (e: any) {
      toast.error("Errore salvataggio: " + e.message);
    }
  };

  const caricaDossiersLive = async () => {
    setLoadingDossier(true);
    const mappaDossier = new Map<string, any>();

    if (Array.isArray(state?.dossierGenerati)) {
      for (const d of state.dossierGenerati) {
        const norm = normalizzaRigaDossier(d);
        mappaDossier.set(norm.id, norm);
      }
    }

    if (supabase) {
      try {
        const { data: rowsSeg } = await supabase
          .from("segnalazioni")
          .select("*")
          .or("id.like.dossier_%,categoria.eq.Dossier_Generato")
          .order("created_at", { ascending: false });

        if (Array.isArray(rowsSeg)) {
          for (const r of rowsSeg) {
            const norm = normalizzaRigaDossier(r);
            mappaDossier.set(norm.id, norm);
          }
        }
      } catch {}
    }

    setDossiers(Array.from(mappaDossier.values()));
    setLoadingDossier(false);
  };

  useEffect(() => {
    if (authOk) {
      void caricaDossiersLive();
    }
  }, [authOk, state?.dossierGenerati]);

  const aggiornaStatoDossier = async (id: string, nuovoStato: string) => {
    try {
      await modificaStatoDossierAdmin(id, nuovoStato);
      setDossiers((prev) => prev.map((d) => (d.id === id ? { ...d, stato: nuovoStato } : d)));
      if (typeof ricaricaCloud === "function") void ricaricaCloud();
      toast.success("Stato aggiornato a: " + nuovoStato);
    } catch (e: any) {
      toast.error("Errore: " + e.message);
    }
  };

  const cancellaDossier = async (id: string) => {
    try {
      await eliminaDossierAdmin(id);
      setDossiers((prev) => prev.filter((d) => d.id !== id));
      if (typeof ricaricaCloud === "function") void ricaricaCloud();
      toast.success("Dossier eliminato.");
    } catch (e: any) {
      toast.error("Errore: " + e.message);
    }
  };

  const esportaDossierPdfBrandizzato = (d: any) => {
    let contenuto = testiModificati[d.id] ?? d.bozza_testuale;

    const mappaLinkSpecifici: Record<string, string> = {
      "https://www.regione.umbria.it/programmazione-fesr": "https://www.sviluppoumbria.it/imprese-e-enti-locali/bandi-per-le-imprese/pr-fesr-2021-2027-azione-2.1.1",
      "https://www.sviluppoumbria.it/bandi-e-avvisi": "https://www.sviluppoumbria.it/imprese-e-enti-locali/bandi-per-le-imprese/investimenti-produttivi-pmi-azione-1.3.1",
      "https://www.arpalumbria.it/avvisi-e-bandi": "https://www.arpalumbria.it/incentivi-alle-assunzioni-pr-fse-2021-2027",
      "https://www.regione.umbria.it/fse": "https://www.arpalumbria.it/creazione-dimpresa-e-lavoro-autonomo-pr-fse",
      "https://www.italiadomani.gov.it": "https://www.italiadomani.gov.it/content/sogei-ng/it/it/Interventi/investimenti/rafforzamento-mobilita-ciclabile.html",
      "https://www.comune.terni.it": "https://www.comune.terni.it/servizi/commercio-e-imprese/suape-sportello-unico-attivita-produttive-ed-edilizie",
      "https://www.gse.it/servizi-per-te/mobilita-sostenibile": "https://www.mimit.gov.it/it/incentivi/bonus-colonnine-domestiche-e-condominiali",
      "https://www.umbria.camcom.it/bandi-e-contributi": "https://www.umbria.camcom.it/promozione-e-sviluppo-delle-imprese/pid-punto-impresa-digitale/bando-voucher-digitali-i4.0",
      "https://www.regione.umbria.it/sociale": "https://www.regione.umbria.it/sociale/disabilita-e-vita-indipendente-pr-fse-2021-2027",
      "https://www.inps.it": "https://www.inps.it/it/it/dettaglio-scheda.schede-servizio-strumento.schede-servizi.bando-di-concorso-home-care-premium-assistenza-domiciliare.html",
    };

    Object.entries(mappaLinkSpecifici).forEach(([vecchioUrl, nuovoUrl]) => {
      contenuto = String(contenuto || "").split(vecchioUrl).join(nuovoUrl);
    });

    const escapeHtml = (s: string) =>
      String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Nasconde l'URL lungo e lo incorpora direttamente nell'etichetta gialla cliccabile APRI BANDO
    const formattaRigaConLink = (line: string) => {
      const urlRegex = /(https?:\/\/[^\s<]+)/g;
      const parts = String(line || "").split(urlRegex);
      return parts
        .map((part) => {
          if (/^https?:\/\//.test(part)) {
            const cleanUrl = part.trim();
            return (
              '<a href="' +
              cleanUrl +
              '" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#fef3c7;color:#92400e;border:1.5px solid #f59e0b;padding:3px 12px;border-radius:6px;font-size:11px;font-weight:800;text-decoration:none;letter-spacing:0.03em;margin-left:4px;">APRI BANDO ↗</a>'
            );
          }
          return escapeHtml(part);
        })
        .join("");
    };

    const NL = String.fromCharCode(10);
    const righe = String(contenuto || "").split(NL);
    let corpoHtml = "";
    for (const rawLine of righe) {
      const l = rawLine.trim();
      if (!l || l.startsWith("====")) continue;
      if (l.startsWith("----")) {
        corpoHtml += '<hr style="border:none;border-top:1px dashed #cbd5e1;margin:12px 0;" />';
      } else if (l.startsWith("MISURA #")) {
        corpoHtml +=
          '<div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:9px 14px;margin-top:14px;margin-bottom:8px;border-radius:0 8px 8px 0;page-break-inside:avoid;">' +
          '<h3 style="margin:0;font-size:13.5px;color:#92400e;text-transform:uppercase;letter-spacing:0.03em;">' +
          escapeHtml(l) +
          "</h3></div>";
      } else if (/^\d+\.\s+[A-Z]/.test(l)) {
        corpoHtml +=
          '<h2 style="margin-top:20px;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #0f172a;font-size:14.5px;color:#0f172a;text-transform:uppercase;letter-spacing:0.05em;">' +
          escapeHtml(l) +
          "</h2>";
      } else if (l.startsWith("•") || l.startsWith("-")) {
        const testoPunto = l.replace(/^[•\-]\s*/, "");
        const idxDuePunti = testoPunto.indexOf(":");
        if (idxDuePunti > 0 && idxDuePunti < 48) {
          const etichetta = escapeHtml(testoPunto.slice(0, idxDuePunti));
          const valore = formattaRigaConLink(testoPunto.slice(idxDuePunti + 1));
          corpoHtml +=
            '<div style="margin:6px 0 6px 10px;font-size:12px;line-height:1.6;color:#1e293b;">' +
            '<span style="color:#d97706;font-weight:700;">▪ ' +
            etichetta +
            ":</span> " +
            valore +
            "</div>";
        } else {
          corpoHtml +=
            '<div style="margin:6px 0 6px 10px;font-size:12px;line-height:1.6;color:#1e293b;">▪ ' +
            formattaRigaConLink(testoPunto) +
            "</div>";
        }
      } else {
        corpoHtml +=
          '<p style="margin:4px 0;font-size:12px;line-height:1.55;color:#334155;">' +
          formattaRigaConLink(l) +
          "</p>";
      }
    }

    // Nome del file PDF automatico basato sul committente del dossier
    const nomeCommittente = estraiNomeCommittente(d.email, d.quartiere || "Terni");
    const titoloFilePdf = "Dossier_Terni2030_" + nomeCommittente;

    const htmlDoc =
      "<!DOCTYPE html><html lang='it'><head><meta charset='utf-8' />" +
      "<title>" + escapeHtml(titoloFilePdf) + "</title>" +
      "<link href='https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap' rel='stylesheet'>" +
      "<style>" +
      "@page { size: A4; margin: 0mm; }" +
      "html, body { font-family: 'Inter', sans-serif; color: #0f172a; background: #f1f5f9; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }" +
      ".toolbar { max-width: 820px; margin: 18px auto; background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; }" +
      ".btn-print { background: #f59e0b; color: #0f172a; border: none; padding: 9px 18px; border-radius: 6px; font-weight: 800; font-size: 13px; cursor: pointer; }" +
      ".page { max-width: 820px; margin: 0 auto 24px auto; background: #ffffff; padding: 16mm 18mm; box-sizing: border-box; width: 100%; border-top: 8px solid #f59e0b; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }" +
      ".header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 18px; }" +
      ".brand { font-family: 'Archivo', sans-serif; font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }" +
      ".brand span { color: #d97706; }" +
      ".sub-brand { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; font-weight: 700; margin-top: 4px; }" +
      ".badge-doc { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; font-size: 10.5px; font-weight: 700; padding: 5px 10px; border-radius: 6px; text-align: right; }" +
      ".meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 18px; font-size: 12px; }" +
      ".meta-item b { display: block; font-size: 10px; text-transform: uppercase; color: #64748b; }" +
      ".meta-item span { font-weight: 700; color: #0f172a; font-size: 12.5px; }" +
      ".footer { margin-top: 28px; padding-top: 12px; border-top: 2px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; page-break-inside: avoid; }" +
      "@media print { html, body { background: #ffffff; } .toolbar { display: none !important; } .page { margin: 0; max-width: 100%; box-shadow: none; border-radius: 0; } }" +
      "</style></head><body>" +
      "<div class='toolbar'>" +
      "<div><b>File pronto: " + escapeHtml(titoloFilePdf) + ".pdf</b><br/><span style='font-size:11px;color:#cbd5e1;'>Seleziona «Salva come PDF» — Tutti i pulsanti gialli APRI BANDO resteranno cliccabili nel PDF!</span></div>" +
      "<button class='btn-print' onclick='window.print()'>🖨️ Salva PDF (" + escapeHtml(titoloFilePdf) + ")</button>" +
      "</div>" +
      "<div class='page'>" +
      "<div class='header'>" +
      "<div><div class='brand'>Terni <span>2030</span></div><div class='sub-brand'>Intelligence Bandi & Rigenerazione Urbana · Città e Welfare</div></div>" +
      "<div class='badge-doc'>DOSSIER STRATEGICO VERIFICATO<br/><span style='font-weight:500;font-size:9.5px;'>Protocollo: " + escapeHtml(d.id) + "</span></div>" +
      "</div>" +
      "<div class='meta-grid'>" +
      "<div class='meta-item'><b>Committente / Destinatario</b><span>" + escapeHtml(d.email) + "</span></div>" +
      "<div class='meta-item'><b>Data di Elaborazione</b><span>" + escapeHtml(d.orario) + "</span></div>" +
      "<div class='meta-item'><b>Profilo Richiedente</b><span>" + escapeHtml(d.profilo) + "</span></div>" +
      "<div class='meta-item'><b>Quartiere / Ambito di Terni</b><span>" + escapeHtml(d.quartiere) + "</span></div>" +
      "<div class='meta-item' style='grid-column: span 2;'><b>Obiettivo Progettuale Dichiarato</b><span>" + escapeHtml(d.obiettivo) + "</span></div>" +
      "</div>" +
      "<div>" + corpoHtml + "</div>" +
      "<div class='footer'>" +
      "<div><b>Terni 2030</b> · Dossier revisionato e validato da <b>Lorenzo Covicchio</b> (Autore e Curatore)</div>" +
      "<div>Contatti: <a href='mailto:Terni.2030@outlook.it' style='color:#d97706;text-decoration:none;'>Terni.2030@outlook.it</a> · PEC: <a href='mailto:lorenzo.covicchio@pec.it' style='color:#0f172a;font-weight:700;text-decoration:none;'>lorenzo.covicchio@pec.it</a></div>" +
      "</div>" +
      "</div>" +
      "<script>window.onload = function(){ document.title = " + JSON.stringify(titoloFilePdf) + "; setTimeout(function(){ window.print(); }, 400); };</script>" +
      "</body></html>";

    // Usa un Blob URL: elimina "about:blank", imposta il titolo col nome del committente e mantiene attivi i link nel PDF!
    const blob = new Blob([htmlDoc], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, "_blank");
    if (!win) {
      toast.error("Consenti l'apertura dei popup nel browser per salvare il PDF.");
      return;
    }
    toast.success("Generazione PDF pronta: " + titoloFilePdf + ".pdf");
  };

  const tuttiPoi: POI[] = state?.poiExtra || [];
  const proposteInAttesa = (state?.proposteModerazione || []).filter((p: any) => p.stato === "In attesa");

  const avviaModificaPoi = (p: POI) => {
    setEditingPoiId(p.id);
    setPoiForm({
      id: p.id,
      titolo: p.nome,
      autoreStorico: p.autore || "",
      autoreScheda: p.autoreScheda || "Lorenzo Covicchio",
      anno: p.anno || "Storico / Contemporaneo",
      categoria: p.categoria || "Architettura d'autore",
      rarita: p.rarita || "Comune",
      lat: Number(p.lat) || 42.5636,
      lng: Number(p.lng) || 12.6427,
      descrizione: p.descrizione || "",
      immagine: p.immagine || "",
      articolo: p.articolo || "",
    });
    window.scrollTo({ top: 180, behavior: "smooth" });
  };

  const resetPoiForm = () => {
    setEditingPoiId(null);
    setPoiForm(DEFAULT_POI_FORM);
  };

  const salvaPoi = async () => {
    if (!poiForm.titolo.trim()) {
      return toast.error("Inserisci il nome del luogo (POI).");
    }
    setSavingPoi(true);
    try {
      const infoRar = RARITA_STANDARD[poiForm.rarita] || RARITA_STANDARD.Comune;
      const payload = {
        titolo: poiForm.titolo.trim(),
        autoreStorico: poiForm.autoreStorico.trim() || "Non specificato",
        autoreScheda: poiForm.autoreScheda.trim() || "Lorenzo Covicchio",
        anno: poiForm.anno.trim() || "Storico / Contemporaneo",
        categoria: poiForm.categoria.trim() || "Architettura d'autore",
        rarita: poiForm.rarita,
        punti: infoRar.punti,
        lat: Number(poiForm.lat) || 42.5636,
        lng: Number(poiForm.lng) || 12.6427,
        descrizione: poiForm.descrizione.trim(),
        immagine: poiForm.immagine.trim(),
        articolo: poiForm.articolo.trim() || poiForm.descrizione.trim(),
      };

      if (editingPoiId) {
        await modificaPoiAdmin(editingPoiId, payload);
        toast.success("Luogo aggiornato con successo su Terni Urban-Go!");
      } else {
        await inserisciPoiDirettoAdmin(payload);
        toast.success("Nuovo luogo pubblicato su Terni Urban-Go!");
      }
      resetPoiForm();
      if (typeof ricaricaCloud === "function") await ricaricaCloud();
    } catch (e: any) {
      toast.error("Errore salvataggio POI: " + e.message);
    } finally {
      setSavingPoi(false);
    }
  };

  const rimuoviPoi = async (id: string, nome: string) => {
    try {
      await eliminaPoiAdmin(id);
      if (editingPoiId === id) resetPoiForm();
      if (typeof ricaricaCloud === "function") await ricaricaCloud();
      toast.success("«" + nome + "» rimosso definitivamente da Terni Urban-Go.");
    } catch (e: any) {
      toast.error("Errore rimozione: " + e.message);
    }
  };

  const bandiList = Array.isArray(bandiRealiJson) ? bandiRealiJson : [];
  const meta: any = syncMetaJson || {};

  const getStatoBando = (b: any) => {
    const k = normKey(b.titolo || b.nome);
    const audit = state?.auditBandi?.[k];
    if (audit) {
      if (audit.stato === "Scartato") return { col: "rosso", label: "Scartato", nota: audit.nota || "", link: audit.linkUfficiale || b.link };
      if (audit.stato === "Certificato") return { col: "verde", label: "Certificato", nota: audit.nota || "", link: audit.linkUfficiale || b.link };
      return { col: "giallo", label: "Da Verificare", nota: audit.nota || "", link: audit.linkUfficiale || b.link };
    }
    return {
      col: b.semaforo === "verde" ? "verde" : "giallo",
      label: b.semaforo === "verde" ? "Istituzionale" : "Da Verificare",
      nota: "",
      link: b.link || "#",
    };
  };

  const bandiFiltrati = bandiList.filter((b: any) => {
    const info = getStatoBando(b);
    const txt = ((b.titolo || "") + " " + (b.descrizione || "") + " " + (b.portale || "") + " " + (b.asse_specifico || "")).toLowerCase();
    if (qBandi && !txt.includes(qBandi.toLowerCase())) return false;
    if (fMacro && (b.categoria_macro || "citta") !== fMacro) return false;
    if (fStato && info.col !== fStato) return false;
    return true;
  });

  const bandiAttiviNonScartati = bandiList.filter((b: any) => getStatoBando(b).col !== "rosso");
  const valCitta = bandiAttiviNonScartati
    .filter((b: any) => b.categoria_macro !== "welfare")
    .reduce((acc: number, b: any) => acc + (Number(b.valore_stimato_euro) || 250000), 0);
  const valWelfare = bandiAttiviNonScartati
    .filter((b: any) => b.categoria_macro === "welfare")
    .reduce((acc: number, b: any) => acc + (Number(b.valore_stimato_euro) || 250000), 0);

  const pinsRegia = [
    {
      id: "pin_editor_corrente",
      lat: Number(poiForm.lat) || 42.5636,
      lng: Number(poiForm.lng) || 12.6427,
      color: "#ef4444",
      glow: true,
      label: editingPoiId ? "In modifica: " + (poiForm.titolo || "POI") : "Nuovo Pin (Clicca sulla mappa per posizionarlo)",
      popup: (
        <div className="text-xs">
          <b>{poiForm.titolo || "Posizione Selezionata"}</b>
          <p>
            {Number(poiForm.lat).toFixed(5)}, {Number(poiForm.lng).toFixed(5)}
          </p>
        </div>
      ),
    },
    ...tuttiPoi
      .filter((p) => p.id !== editingPoiId)
      .map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        color: RARITA_STANDARD[p.rarita]?.colore || "#22c55e",
        label: p.nome,
        imageUrl: p.immagine,
        isPremium: ["Epico", "Leggendario", "Unico"].includes(p.rarita),
        popup: (
          <div className="space-y-1.5 text-xs">
            <p className="font-bold">{p.nome}</p>
            <p className="opacity-75">
              {p.rarita} · +{p.punti} pt
            </p>
            <button
              onClick={() => avviaModificaPoi(p)}
              className="rounded bg-primary px-2 py-1 text-[11px] font-bold text-primary-foreground"
            >
              Modifica questo luogo
            </button>
          </div>
        ),
      })),
  ];

  if (!authOk) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 animate-fade-up">
        <div className="surface-panel border p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-6">
            <Lock className="mx-auto size-12 text-accent mb-3" />
            <h1 className="text-2xl font-bold">Accesso Esclusivo Regia</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Inserisci le tue credenziali operatore per accedere alla Regia.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Nome Utente</label>
              <input
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="Nome utente operatore..."
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Password</label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLoginEsclusivo()}
                placeholder="••••••••••••"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
            </div>
            <button
              onClick={handleLoginEsclusivo}
              disabled={verifying}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90"
            >
              {verifying ? "Verifica Crittografica..." : "Entra nella Regia"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 animate-fade-up">
      {isDefaultPassword && (
        <div className="mb-5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-6 text-amber-500 shrink-0" />
            <div>
              <p className="font-bold text-amber-500 text-sm">Avviso di Sicurezza: Credenziali Temporanee Monouso in uso</p>
              <p className="text-xs text-amber-500/90 mt-0.5">
                Stai utilizzando una password iniziale temporanea. Apri subito il Tab 5 (Credenziali) per impostare la tua password cifrata personale.
              </p>
            </div>
          </div>
          <button
            onClick={() => setTab("sicurezza")}
            className="whitespace-nowrap px-4 py-2 rounded-lg bg-amber-500 text-amber-950 font-bold text-xs hover:bg-amber-400"
          >
            Cambia Credenziali Ora
          </button>
        </div>
      )}

      {/* HEADER REGIA */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-accent">
            <ShieldCheck className="size-4" /> Operatore Attivo: {operatoreNome}
          </span>
          <h1 className="text-3xl font-bold mt-1">Regia Supervisione Terni 2030</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Ultimo sync automatico (Ore 09:00): <b>{meta.ultimo_aggiornamento || "Attivo"}</b> · {bandiList.length} misure uniche certificate
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTab("dossier")}
            className={
              "px-3.5 py-2 rounded-lg text-xs font-bold border transition " +
              (tab === "dossier" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 border-border")
            }
          >
            📄 1. Dossier ({dossiers.length})
          </button>
          <button
            onClick={() => setTab("bandi")}
            className={
              "px-3.5 py-2 rounded-lg text-xs font-bold border transition " +
              (tab === "bandi" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 border-border")
            }
          >
            🔎 2. Pool Bandi ({bandiList.length})
          </button>
          <button
            onClick={() => setTab("moderazione")}
            className={
              "px-3.5 py-2 rounded-lg text-xs font-bold border transition " +
              (tab === "moderazione" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 border-border")
            }
          >
            🛡️ 3. Moderazione ({proposteInAttesa.length})
          </button>
          <button
            onClick={() => setTab("urbango")}
            className={
              "px-3.5 py-2 rounded-lg text-xs font-bold border transition " +
              (tab === "urbango" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 border-border")
            }
          >
            📍 4. Gestione Urban GO ({tuttiPoi.length})
          </button>
          <button
            onClick={() => setTab("sicurezza")}
            className={
              "px-3.5 py-2 rounded-lg text-xs font-bold border transition " +
              (tab === "sicurezza" ? "bg-accent text-accent-foreground border-accent" : "bg-secondary/50 border-border")
            }
          >
            🔐 5. Credenziali
          </button>
          <button
            onClick={handleLogoutRegia}
            className="px-3 py-2 rounded-lg text-xs font-bold border border-red-500/40 text-red-400 hover:bg-red-500/10 inline-flex items-center gap-1"
          >
            <LogOut className="size-3.5" /> Esci
          </button>
        </div>
      </div>

      {/* KPI ECONOMICI CALIBRATI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="surface-panel border p-4 rounded-xl">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Dossier Ricevuti</span>
          <div className="text-2xl font-black text-accent mt-1">{dossiers.length} dossier</div>
          <span className="text-[11px] text-muted-foreground">
            {dossiers.filter((d) => d.stato === "Venduto").length} confermati / venduti
          </span>
        </div>
        <div className="surface-panel border p-4 rounded-xl">
          <span className="text-xs text-sky-400 uppercase font-semibold flex items-center gap-1">
            <Building2 className="size-3.5" /> Quota Bacino Terni (Città)
          </span>
          <div className="text-2xl font-black mt-1">{fmtEuro(valCitta)}</div>
          <span className="text-[11px] text-muted-foreground">16 misure uniche Città & Imprese</span>
        </div>
        <div className="surface-panel border p-4 rounded-xl">
          <span className="text-xs text-rose-400 uppercase font-semibold flex items-center gap-1">
            <HeartHandshake className="size-3.5" /> Quota Bacino Terni (Welfare)
          </span>
          <div className="text-2xl font-black mt-1">{fmtEuro(valWelfare)}</div>
          <span className="text-[11px] text-muted-foreground">11 misure uniche Welfare & Sociale</span>
        </div>
        <div className="surface-panel border p-4 rounded-xl">
          <span className="text-xs text-emerald-400 uppercase font-semibold flex items-center gap-1">
            <Clock className="size-3.5" /> Luoghi TerniDex Attivi
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{tuttiPoi.length} POI</div>
          <span className="text-[11px] text-muted-foreground">{proposteInAttesa.length} proposte in coda</span>
        </div>
      </div>

      {/* TAB 1: DOSSIER */}
      {tab === "dossier" && (
        <div className="space-y-4">
          <div className="surface-panel border p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Supervisione Dossier Generati</h2>
              <p className="text-xs text-muted-foreground">
                Revisiona il testo e clicca su <b>Esporta / Salva PDF Brandizzato</b>: il PDF avrà il nome del committente e i pulsanti gialli <b>APRI BANDO ↗</b> direttamente cliccabili.
              </p>
            </div>
            <button
              onClick={caricaDossiersLive}
              disabled={loadingDossier}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-2 text-xs font-bold hover:bg-secondary/80"
            >
              <RefreshCw className={"size-4 " + (loadingDossier ? "animate-spin" : "")} /> Aggiorna Elenco
            </button>
          </div>

          {dossiers.length === 0 ? (
            <div className="surface-panel border p-12 rounded-xl text-center space-y-2">
              <FileText className="mx-auto size-12 text-muted-foreground" />
              <h3 className="text-lg font-bold">Nessun Dossier in coda di supervisione</h3>
              <p className="text-xs text-muted-foreground">
                Non appena un utente invierà una richiesta dalla pagina Dossier, comparirà qui con la bozza testuale completa.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {dossiers.map((d) => {
                const isOpen = dossierAperto === d.id;
                const testoCorrente = testiModificati[d.id] ?? d.bozza_testuale;
                const nomeFileCommittente = "Dossier_Terni2030_" + estraiNomeCommittente(d.email, d.quartiere || "Terni") + ".pdf";
                return (
                  <div key={d.id} className="surface-panel border p-5 rounded-xl space-y-4">
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={
                              "px-2.5 py-0.5 rounded-full text-xs font-bold " +
                              (d.stato === "Venduto"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/40")
                            }
                          >
                            {d.stato}
                          </span>
                          <span className="text-xs text-muted-foreground">{d.orario}</span>
                          <span className="text-xs font-bold text-accent">
                            Prezzo Dossier: € {Number(d.prezzo || 14.9).toFixed(2)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <a
                            href={"mailto:" + d.email + "?subject=Dossier Bandi Terni 2030 - " + d.obiettivo}
                            className="inline-flex items-center gap-1.5 text-base font-bold text-accent hover:underline"
                          >
                            <Mail className="size-4" /> {d.email}
                          </a>
                          <span className="text-xs bg-secondary px-2.5 py-1 rounded-md">
                            Profilo: <b>{d.profilo}</b>
                          </span>
                          <span className="text-xs bg-secondary px-2.5 py-1 rounded-md">
                            Quartiere: <b>{d.quartiere}</b>
                          </span>
                          <span className="text-xs bg-secondary px-2.5 py-1 rounded-md">
                            Obiettivo: <b>{d.obiettivo}</b>
                          </span>
                        </div>

                        <div className="pt-1">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">
                            Bandi riservati inclusi nel Dossier ({d.elenco_bandi?.length || 0}):
                          </p>
                          <ul className="list-disc pl-5 text-xs space-y-0.5">
                            {(d.elenco_bandi || []).map((bStr: string, i: number) => (
                              <li key={i}>{bStr}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex flex-wrap lg:flex-col justify-end gap-2 shrink-0">
                        <button
                          onClick={() => setDossierAperto(isOpen ? null : d.id)}
                          className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5"
                        >
                          <Eye className="size-3.5" /> {isOpen ? "Chiudi Documento" : "Revisiona Dossier & PDF"}
                        </button>
                        <button
                          onClick={() => esportaDossierPdfBrandizzato(d)}
                          className="px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-bold inline-flex items-center gap-1.5"
                        >
                          <Download className="size-3.5" /> Scarica PDF ({estraiNomeCommittente(d.email, d.quartiere)})
                        </button>
                        <button
                          onClick={() => aggiornaStatoDossier(d.id, "Venduto")}
                          className="px-3 py-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs font-semibold"
                        >
                          ✅ Segna Venduto
                        </button>
                        <button
                          onClick={() => cancellaDossier(d.id)}
                          className="px-3 py-1.5 rounded-md border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Trash2 className="size-3.5" /> Elimina
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="border-t border-border pt-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-accent uppercase">
                            Editor Supervisione Dossier · Nome PDF automatico: {nomeFileCommittente}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(testoCorrente);
                                toast.success("Dossier copiato negli appunti!");
                              }}
                              className="px-3 py-1 rounded bg-secondary hover:bg-secondary/80 text-xs font-bold inline-flex items-center gap-1"
                            >
                              <Copy className="size-3.5" /> Copia Testo
                            </button>
                            <button
                              onClick={() => esportaDossierPdfBrandizzato(d)}
                              className="px-3.5 py-1.5 rounded bg-accent text-accent-foreground text-xs font-bold inline-flex items-center gap-1.5 shadow-sm hover:opacity-90"
                            >
                              <Download className="size-3.5" /> 📄 Esporta PDF ({nomeFileCommittente})
                            </button>
                          </div>
                        </div>
                        <textarea
                          rows={14}
                          value={testoCorrente}
                          onChange={(e) => setTestiModificati({ ...testiModificati, [d.id]: e.target.value })}
                          className="w-full rounded-lg border border-input bg-background p-3 font-mono text-xs leading-relaxed"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: POOL BANDI */}
      {tab === "bandi" && (
        <div className="space-y-4">
          <div className="surface-panel border p-4 rounded-xl flex flex-wrap gap-3 items-center">
            <input
              type="text"
              value={qBandi}
              onChange={(e) => setQBandi(e.target.value)}
              placeholder="Filtra tra le 27 misure uniche..."
              className="flex h-9 flex-1 min-w-[220px] rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
            <select
              value={fMacro}
              onChange={(e) => setFMacro(e.target.value as any)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold"
            >
              <option value="">Tutti i Settori (Città + Welfare)</option>
              <option value="citta">Solo Città & Imprese (16)</option>
              <option value="welfare">Solo Welfare & Sociale (11)</option>
            </select>
            <select
              value={fStato}
              onChange={(e) => setFStato(e.target.value as any)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold"
            >
              <option value="">Tutti gli Stati</option>
              <option value="verde">Attivi / Certificati</option>
              <option value="rosso">Scartati</option>
            </select>
          </div>

          <div className="grid gap-3">
            {bandiFiltrati.map((b: any, i: number) => {
              const k = normKey(b.titolo || b.nome);
              return (
                <div key={b.id || i} className="surface-panel border p-4 rounded-xl flex flex-col lg:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-secondary text-xs font-bold">{b.portale}</span>
                      <span className="text-xs font-bold text-emerald-400">Quota Terni: {fmtEuro(b.valore_stimato_euro)}</span>
                    </div>
                    <h3 className="font-bold text-sm">{b.titolo}</h3>
                    <p className="text-xs text-muted-foreground">{b.descrizione}</p>
                    <p className="text-[11px] text-accent font-semibold">Agevolazione: {b.importo}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        await salvaAuditBandoCloud(k, b.titolo, { stato: "Certificato", linkUfficiale: b.link, operatore: operatoreNome });
                        if (typeof ricaricaCloud === "function") void ricaricaCloud();
                        toast.success("Bando certificato!");
                      }}
                      className="px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold"
                    >
                      Certifica
                    </button>
                    <button
                      onClick={async () => {
                        await salvaAuditBandoCloud(k, b.titolo, { stato: "Scartato", linkUfficiale: b.link, operatore: operatoreNome });
                        if (typeof ricaricaCloud === "function") void ricaricaCloud();
                        toast.info("Bando nascosto dal portale.");
                      }}
                      className="px-3 py-1.5 rounded bg-red-500/20 text-red-400 text-xs font-bold"
                    >
                      Scarta
                    </button>
                    <a href={b.link} target="_blank" rel="noreferrer" className="p-2 rounded bg-secondary">
                      <ExternalLink className="size-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MODERAZIONE */}
      {tab === "moderazione" && (
        <div className="space-y-3">
          {proposteInAttesa.length === 0 ? (
            <div className="surface-panel border p-8 rounded-xl text-center text-sm text-muted-foreground">
              Nessuna proposta in attesa di moderazione. Le proposte rifiutate vengono eliminate automaticamente e non restano in elenco.
            </div>
          ) : (
            proposteInAttesa.map((p: any) => (
              <div key={p.id} className="surface-panel border p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase text-accent">
                    {p.tipo} · Proposto da {p.autore} ({p.contatto})
                  </span>
                  <h3 className="font-bold text-base">{p.titolo}</h3>
                  {p.dati?.descrizione && <p className="text-xs text-muted-foreground">{p.dati.descrizione}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={async () => {
                      await gestisciPropostaAdmin(p.id, "Approvata");
                      if (typeof ricaricaCloud === "function") await ricaricaCloud();
                      toast.success("Proposta approvata e pubblicata!");
                    }}
                    className="px-3.5 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <CheckCircle2 className="size-3.5" /> Approva
                  </button>
                  <button
                    onClick={async () => {
                      await gestisciPropostaAdmin(p.id, "Rifiutata");
                      if (typeof ricaricaCloud === "function") await ricaricaCloud();
                      toast.info("Proposta rifiutata e rimossa definitivamente.");
                    }}
                    className="px-3.5 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <XCircle className="size-3.5" /> Rifiuta ed Elimina
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: GESTIONE DINAMICA TERNI URBAN GO */}
      {tab === "urbango" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <div className="surface-panel border p-4 rounded-2xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold flex items-center gap-1.5">
                    <MapPin className="size-4 text-accent" /> Mappa Interattiva di Posizionamento POI
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Clicca in qualsiasi punto della mappa di Terni per impostare automaticamente Latitudine e Longitudine del luogo.
                  </p>
                </div>
                <span className="text-xs font-mono bg-secondary px-2.5 py-1 rounded">
                  📍 {Number(poiForm.lat).toFixed(5)}, {Number(poiForm.lng).toFixed(5)}
                </span>
              </div>
              <div className="h-[460px] overflow-hidden rounded-xl border border-border">
                <TerniMap
                  center={[Number(poiForm.lat) || TERNI_CENTER[0], Number(poiForm.lng) || TERNI_CENTER[1]]}
                  zoom={14}
                  pins={pinsRegia}
                  onMapClick={(lat, lng) => {
                    setPoiForm((prev) => ({
                      ...prev,
                      lat: Number(lat.toFixed(5)),
                      lng: Number(lng.toFixed(5)),
                    }));
                    toast.info("Coordinate impostate: " + lat.toFixed(5) + ", " + lng.toFixed(5));
                  }}
                />
              </div>
            </div>

            <div className="surface-panel border p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h3 className="font-bold text-base flex items-center gap-1.5">
                  {editingPoiId ? (
                    <>
                      <Pencil className="size-4 text-accent" /> Modifica Luogo Selezionato
                    </>
                  ) : (
                    <>
                      <Plus className="size-4 text-emerald-400" /> Inserisci Nuovo Luogo (POI)
                    </>
                  )}
                </h3>
                {editingPoiId && (
                  <button onClick={resetPoiForm} className="text-xs text-muted-foreground hover:text-foreground underline">
                    Annulla modifica
                  </button>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="font-semibold">Nome del Luogo / Monumento</label>
                  <input
                    type="text"
                    value={poiForm.titolo}
                    onChange={(e) => setPoiForm({ ...poiForm, titolo: e.target.value })}
                    placeholder="Es. Lancia di Luce / Fontana dello Zodiaco..."
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold">Categoria</label>
                    <input
                      list="regia-cat-poi"
                      value={poiForm.categoria}
                      onChange={(e) => setPoiForm({ ...poiForm, categoria: e.target.value })}
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                    />
                    <datalist id="regia-cat-poi">
                      <option value="Architettura d'autore" />
                      <option value="Arte pubblica" />
                      <option value="Archeologia industriale" />
                      <option value="Storia e fede" />
                    </datalist>
                  </div>
                  <div>
                    <label className="font-semibold">Grado di Rarità</label>
                    <select
                      value={poiForm.rarita}
                      onChange={(e) => setPoiForm({ ...poiForm, rarita: e.target.value as RaritaPOI })}
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-xs font-semibold"
                    >
                      {ORDINE_RARITA.map((r) => (
                        <option key={r} value={r}>
                          {RARITA_STANDARD[r].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold">Autore / Architetto Storico</label>
                    <input
                      type="text"
                      value={poiForm.autoreStorico}
                      onChange={(e) => setPoiForm({ ...poiForm, autoreStorico: e.target.value })}
                      placeholder="Es. Mario Ridolfi / Arnaldo Pomodoro"
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold">Anno / Epoca</label>
                    <input
                      type="text"
                      value={poiForm.anno}
                      onChange={(e) => setPoiForm({ ...poiForm, anno: e.target.value })}
                      placeholder="Es. 1995 / XVI Secolo"
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold">Latitudine (o clicca mappa)</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={poiForm.lat}
                      onChange={(e) => setPoiForm({ ...poiForm, lat: parseFloat(e.target.value) || 42.5636 })}
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold">Longitudine (o clicca mappa)</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={poiForm.lng}
                      onChange={(e) => setPoiForm({ ...poiForm, lng: parseFloat(e.target.value) || 12.6427 })}
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold">Autore Scheda</label>
                    <input
                      type="text"
                      value={poiForm.autoreScheda}
                      onChange={(e) => setPoiForm({ ...poiForm, autoreScheda: e.target.value })}
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold">URL Immagine (opzionale)</label>
                    <input
                      type="text"
                      value={poiForm.immagine}
                      onChange={(e) => setPoiForm({ ...poiForm, immagine: e.target.value })}
                      placeholder="https://..."
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold">Breve Anteprima (visibile sulla scheda)</label>
                  <textarea
                    rows={2}
                    value={poiForm.descrizione}
                    onChange={(e) => setPoiForm({ ...poiForm, descrizione: e.target.value })}
                    placeholder="Sintesi breve che incuriosisce l'esploratore..."
                    className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold">Dossier / Articolo Storico Completo (sbloccato col GPS)</label>
                  <textarea
                    rows={4}
                    value={poiForm.articolo}
                    onChange={(e) => setPoiForm({ ...poiForm, articolo: e.target.value })}
                    placeholder="Approfondimento storico, architettonico e culturale..."
                    className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs"
                  />
                </div>

                <button
                  onClick={salvaPoi}
                  disabled={savingPoi}
                  className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90"
                >
                  {savingPoi
                    ? "Salvataggio in corso..."
                    : editingPoiId
                    ? "💾 Salva Modifiche al Luogo"
                    : "🚀 Pubblica Nuovo Luogo su Urban GO"}
                </button>
              </div>
            </div>
          </div>

          <div className="surface-panel border p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Elenco Luoghi Attivi su Terni Urban-Go ({tuttiPoi.length})</h3>
                <p className="text-xs text-muted-foreground">
                  Modifica qualsiasi testo/coordinata oppure rimuovi con un clic i punti di interesse dalla mappa pubblica.
                </p>
              </div>
            </div>

            {tuttiPoi.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                Nessun punto di interesse attualmente presente. Usa il modulo e la mappa qui sopra per inserire il primo luogo!
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {tuttiPoi.map((p) => {
                  const infoRar = RARITA_STANDARD[p.rarita] || RARITA_STANDARD.Comune;
                  return (
                    <div key={p.id} className="rounded-xl border border-border bg-background/60 p-4 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                            style={{ backgroundColor: infoRar.colore + "25", color: infoRar.colore }}
                          >
                            {p.rarita} · +{p.punti} pt
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {Number(p.lat).toFixed(4)}, {Number(p.lng).toFixed(4)}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm mt-2">{p.nome}</h4>
                        <p className="text-xs text-muted-foreground">
                          {p.autore} · {p.anno} · {p.categoria}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{p.descrizione}</p>
                      </div>

                      <div className="flex gap-2 border-t border-border pt-3">
                        <button
                          onClick={() => avviaModificaPoi(p)}
                          className="flex-1 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-xs font-bold inline-flex items-center justify-center gap-1"
                        >
                          <Pencil className="size-3.5" /> Modifica
                        </button>
                        <button
                          onClick={() => rimuoviPoi(p.id, p.nome)}
                          className="px-3 py-1.5 rounded-md bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-bold inline-flex items-center justify-center gap-1"
                        >
                          <Trash2 className="size-3.5" /> Rimuovi
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: CAMBIO CREDENZIALI CON FEEDBACK VISIVO DI CONFERMA */}
      {tab === "sicurezza" && (
        <div className="mx-auto max-w-lg surface-panel border p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-accent font-bold">
            <KeyRound className="size-5" /> Gestione Credenziali Cifrate Operatori Regia
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Aggiorna il Nome Utente e la Password cifrata SHA-256 per l'accesso alla Regia.
          </p>

          {feedbackCredenziali && (
            <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/15 p-4 text-xs text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-400 text-sm">Cambio Credenziali Completato!</p>
                <p className="mt-1 leading-relaxed">{feedbackCredenziali}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-lg text-xs font-bold">
            <button
              onClick={() => {
                setRuoloTarget("lorenzo");
                setFeedbackCredenziali(null);
              }}
              className={
                "py-2 rounded-md transition " +
                (ruoloTarget === "lorenzo" ? "bg-primary text-primary-foreground" : "text-muted-foreground")
              }
            >
              Profilo Lorenzo (Admin)
            </button>
            <button
              onClick={() => {
                setRuoloTarget("gianluca");
                setFeedbackCredenziali(null);
              }}
              className={
                "py-2 rounded-md transition " +
                (ruoloTarget === "gianluca" ? "bg-primary text-primary-foreground" : "text-muted-foreground")
              }
            >
              Profilo Gianluca (Collaboratore)
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold">
                Nuovo Nome Utente per {ruoloTarget === "lorenzo" ? "Lorenzo" : "Gianluca"}
              </label>
              <input
                type="text"
                value={nuovoUser}
                onChange={(e) => setNuovoUser(e.target.value)}
                placeholder={ruoloTarget === "lorenzo" ? "Es. admin_lorenzo" : "Es. gianluca_regia"}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Nuova Password Segreta (min. 8 caratteri)</label>
              <input
                type="password"
                value={nuovaPass}
                onChange={(e) => setNuovaPass(e.target.value)}
                placeholder="••••••••••••"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Conferma Nuova Password</label>
              <input
                type="password"
                value={confermaPass}
                onChange={(e) => setConfermaPass(e.target.value)}
                placeholder="••••••••••••"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <button
              onClick={salvaNuoveCredenzialiCifrate}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90"
            >
              Salva Credenziali Cifrate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
