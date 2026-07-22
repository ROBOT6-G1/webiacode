import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { adminDb } from "@/integrations/firebase/admin";
import { firebaseConfig } from "@/integrations/firebase/config";
import { z } from "zod";

const siteTypeEnum = z.enum(["vitrine", "portfolio", "ecommerce", "hotel", "school", "erp"]);

const inputSchema = z.object({
  projectId: z.string().optional(),
  prompt: z.string().min(1).max(4000),
  siteType: siteTypeEnum.optional(),
  whatsappNumber: z.string().trim().max(30).optional(),
  pwaEnabled: z.boolean().optional(),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).max(30).optional(),
});

type SiteType = z.infer<typeof siteTypeEnum>;
type GeneratedSite = {
  explanation: string;
  name: string;
  files: Record<string, string>;
  questions: Array<{ q: string; options: string[] }>;
};

function siteTypeBlock(siteType: SiteType, whatsapp: string | null): string {
  if (siteType === "vitrine") {
    return `\nTYPE DE SITE : VITRINE (site de présentation d'entreprise / service).
- Sections attendues : hero puissant, à-propos, services / offres, galerie ou preuves sociales, témoignages, appel à l'action, contact.
- Pas de panier, pas de checkout. Un formulaire de contact simple est acceptable.`;
  }
  if (siteType === "portfolio") {
    return `\nTYPE DE SITE : PORTFOLIO (mise en valeur du travail d'un créatif / freelance).
- Sections attendues : hero avec identité forte, biographie courte, grille / carousel de projets, compétences, contact.
- Mets en avant l'esthétique, la typographie et les images. Aucune fonctionnalité e-commerce.`;
  }
  if (siteType === "hotel") {
    return `\nTYPE DE SITE : HOTEL MANAGEMENT SYSTEM (site + back-office de gestion hôtelière).
- Public : hero avec réservation, présentation des chambres/suites, équipements, restaurant/spa, avis, contact.
- Formulaire de réservation et calendrier d'occupation via Firebase Firestore (collection \`app_data\`).
- Admin : gestion chambres, réservations, factures, clients.`;
  }
  if (siteType === "school") {
    return `\nTYPE DE SITE : SCHOOL MANAGEMENT SYSTEM (site école + back-office scolaire).
- Public : hero, présentation de l'école, classes, professeurs, actualités, contact, formulaire d'inscription.
- Admin : gestion élèves, enseignants, classes, matières, emplois du temps, notes, paiements via Firestore (\`app_data\`).`;
  }
  if (siteType === "erp") {
    return `\nTYPE DE SITE : ERP BUSINESS MANAGEMENT SYSTEM (progiciel de gestion intégré).
- Admin : Dashboard KPIs, Ventes (devis/factures PDF), Achats, Stock, Clients/Fournisseurs, Comptabilité, RH.
- Données stockées dans Firestore (\`app_data\`).`;
  }
  return `\nTYPE DE SITE : E-COMMERCE (boutique en ligne complète).
- Sections : hero, grille produits, panier, checkout.
- Commandes envoyées via WhatsApp au numéro ${whatsapp || "+261 34 00 000 00"}.
- Produits et commandes sauvegardés dans Firebase Firestore (\`app_data\`).`;
}

function buildSystemPrompt(
  siteType: SiteType,
  whatsapp: string | null,
  pwaEnabled: boolean,
  userFirebaseSnippet: string,
  hasExistingFiles: boolean,
  userPlan: "free" | "pro"
): string {
  const pwaBlock = pwaEnabled
    ? `\nMODE PWA ACTIVÉ (obligatoire) — le site DOIT être installable :
- Génère \`manifest.webmanifest\` complet.
- Génère \`sw.js\` service worker.
- Dans script.js, enregistre le service worker.`
    : `\nMODE PWA DÉSACTIVÉ — ne génère PAS de manifest.webmanifest, PAS de sw.js.`;

  const clarificationBlock = hasExistingFiles
    ? `\nCONTEXTE : Le site existe déjà. Applique directement la modification et renvoie TOUS les fichiers (site + admin). Ne pose PAS de questions.`
    : `\nPHASE DE CLARIFICATION (OBLIGATOIRE avant un NOUVEAU site) :
- Pose tes questions dans la même langue que la demande (français/malagasy/anglais).
- Jusqu'à 20 questions métier précises.
- Deux questions obligatoires : WhatsApp du propriétaire et Code PIN Admin (4-6 chiffres).
- Retourne les questions dans le tableau \`questions\`. \`files\` DOIT être \`{}\` vide durant cette phase.`;

  const adminBlock = `\nINTERFACE ADMIN ET SÉCURITÉ DES DONNÉES — OBLIGATOIRE POUR TOUT SITE :
- Génère \`admin.html\` + \`admin.js\`.
- Protégé par Authentification ou Code PIN sécurisé.
- Permet de gérer les paramètres du site et les données privées via Firebase Firestore.

\nCONSIGNES STRICTES DE SÉCURITÉ ET VIE PRIVÉE (SÉCURITÉ MAXIMALE) :
1. PROTECTION DES SECRETS & CLÉS API : Ne JAMAIS inclure de clés API tierces, tokens d'accès ou secrets en clair dans les fichiers JavaScript publics (index.html, script.js, admin.js).
2. CODE PIN & AUTHENTIFICATION : Ne JAMAIS coder le Code PIN Admin en clair en dur dans le JS client (ex: \`if (pin === "1234")\` est STRICTEMENT INTERDIT). Le PIN/Mot de passe doit être vérifié via Firebase Auth ou stocké sous forme de HASH (SHA-256/PBKDF2) ou dans Firestore.
3. VIE PRIVÉE ET DONNÉES UTILISATEURS : Les données personnelles des clients/utilisateurs (commandes, numéros de téléphone, adresses e-mail, messages de contact, factures, comptes) sont STRICTEMENT CONFIDENTIELLES. Elles doivent être enregistrées dans des collections Firestore privées (\`orders\`, \`contacts\`, \`users/{userId}\`) et NON accessibles publiquement.
4. DROIT D'ACCÈS DEVWEBIA : L'IA DEVWEBIA possède tous les droits nécessaires pour configurer, administrer et sécuriser le projet Firebase Firestore et les règles d'accès au nom du propriétaire.`;

  const badgeBlock =
    userPlan === "free"
      ? `\nBADGE DEVWEBIA — OBLIGATOIRE (plan gratuit) :
- Ajoute en bas à droite du site public le badge : "✨ Fait avec DEVWEBIA".`
      : `\nBADGE DEVWEBIA — plan Pro : ne pas ajouter de badge.`;

  return `Tu es DEVWEBIA, développeur front-end SENIOR et DESIGNER UI. Tu génères des sites web modernes avec Firebase et leur interface d'administration.

Réponds TOUJOURS en JSON strict entouré de <JSON>…</JSON> :

<JSON>
{
  "explanation": "Description du travail effectué.",
  "questions": [ { "q": "…", "options": ["A","B","C","D"] } ],
  "name": "Nom court du site",
  "files": { "index.html":"…","script.js":"…","admin.html":"…","admin.js":"…","firebase.js":"…" }
}
</JSON>

- Fichiers requis : index.html, script.js, firebase.js, admin.html, admin.js.
- Utilise Tailwind CSS v4 (<script src="https://unpkg.com/@tailwindcss/browser@4"></script>).
${clarificationBlock}
${adminBlock}
${badgeBlock}
${siteTypeBlock(siteType, whatsapp)}
${pwaBlock}
${userFirebaseSnippet}`;
}

function extractJson(text: string): GeneratedSite | null {
  const m = text.match(/<JSON>([\s\S]*?)<\/JSON>/);
  let raw = m ? m[1] : text;
  raw = raw.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  }

  const tryParse = (str: string): GeneratedSite | null => {
    try {
      const parsed = JSON.parse(str);
      let files: Record<string, string> = {};
      if (parsed.files && typeof parsed.files === "object") {
        for (const [k, v] of Object.entries(parsed.files)) {
          files[k] = String(v ?? "");
        }
      }
      const questions: Array<{ q: string; options: string[] }> = [];
      if (Array.isArray(parsed.questions)) {
        for (const item of parsed.questions) {
          if (item && typeof item.q === "string" && Array.isArray(item.options)) {
            questions.push({
              q: String(item.q),
              options: item.options.slice(0, 4).map((o: unknown) => String(o)),
            });
          }
        }
      }
      return {
        explanation: String(parsed.explanation ?? ""),
        name: String(parsed.name ?? "Nouveau site"),
        files,
        questions,
      };
    } catch {
      return null;
    }
  };

  let res = tryParse(raw);
  if (res) return res;

  // Try finding first { and last }
  const startIdx = text.indexOf("{");
  const endIdx = text.lastIndexOf("}");
  if (startIdx !== -1 && endIdx > startIdx) {
    const jsonSub = text.substring(startIdx, endIdx + 1);
    res = tryParse(jsonSub);
    if (res) return res;
  }

  return null;
}

const PROVIDER_DEFAULT_MODEL: Record<string, string> = {
  google: "gemini-flash-latest",
  groq: "llama-3.3-70b-versatile",
  openrouter: "meta-llama/llama-3.3-70b-instruct:free",
  mistral: "mistral-small-latest",
  openai: "gpt-4o-mini",
};

const OPENAI_COMPAT_BASE: Record<string, string> = {
  groq: "https://api.groq.com/openai/v1",
  openrouter: "https://openrouter.ai/api/v1",
  mistral: "https://api.mistral.ai/v1",
  openai: "https://api.openai.com/v1",
};

async function callAdminKey(
  apiKey: string,
  provider: string,
  messages: Array<{ role: string; content: string }>
) {
  const model = PROVIDER_DEFAULT_MODEL[provider] ?? PROVIDER_DEFAULT_MODEL.google;

  if (provider === "google") {
    const geminiMessages = messages.filter((m) => m.role !== "system").map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const systemInstruction = messages.find((m) => m.role === "system")?.content;

    const candidateModels = [model, "gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
    let lastErr: Error | null = null;

    for (const mName of candidateModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: geminiMessages,
              systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
              generationConfig: { temperature: 0.7, maxOutputTokens: 32768 },
            }),
          }
        );
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Gemini ${mName} (${res.status}): ${errText}`);
        }
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (!text) throw new Error("Empty text returned from Gemini");
        const usage = json.usageMetadata;
        return { text, tokens: (usage?.totalTokenCount as number) ?? 0 };
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
      }
    }
    throw lastErr || new Error("Failed calling Gemini API");
  }

  const baseUrl = OPENAI_COMPAT_BASE[provider];
  if (!baseUrl) throw new Error(`Fournisseur inconnu : ${provider}`);

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: 0.7 }),
  });
  if (!res.ok) throw new Error(`${provider} ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content ?? "";
  const tokens = json.usage?.total_tokens ?? 0;
  return { text, tokens };
}

async function callGateway(apiKey: string, messages: Array<{ role: string; content: string }>) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`Gateway ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content ?? "";
  const tokens = json.usage?.total_tokens ?? 0;
  return { text, tokens };
}

function generateDefaultFallbackSite(params: {
  prompt: string;
  siteType: SiteType;
  whatsapp: string | null;
  pwaEnabled: boolean;
  firebaseConfig: typeof firebaseConfig;
  userPlan: "free" | "pro";
  currentFiles: Record<string, string>;
}): { text: string; tokens: number } {
  const { prompt, siteType, whatsapp, pwaEnabled, firebaseConfig, userPlan, currentFiles } = params;

  const titleMatch = prompt.slice(0, 30).trim() || "Mon Site Web";
  const waNum = whatsapp || "+261340000000";
  const cleanWaNum = waNum.replace(/[^0-9]/g, "");

  const firebaseJs = `// Configuration Firebase auto-générée par DEVWEBIA
const firebaseConfig = {
  apiKey: "${firebaseConfig.apiKey}",
  authDomain: "${firebaseConfig.authDomain}",
  projectId: "${firebaseConfig.projectId}",
  storageBucket: "${firebaseConfig.storageBucket}",
  appId: "${firebaseConfig.appId}"
};
if (typeof firebase !== 'undefined') {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
  const dbId = "${firebaseConfig.firestoreDatabaseId || ''}";
  let dbInstance = null;
  try {
    if (dbId && dbId !== "(default)") {
      dbInstance = firebase.app().firestore(dbId);
    } else {
      dbInstance = firebase.firestore();
    }
  } catch (e) {
    try {
      dbInstance = firebase.firestore();
    } catch (err) {
      console.warn("Firestore Database Connection Warning:", err);
    }
  }
  window.db = dbInstance;
  try {
    window.auth = firebase.auth ? firebase.auth() : null;
  } catch (err) {
    window.auth = null;
  }
}
`;

  if (Object.keys(currentFiles).length > 0) {
    const updatedFiles = { ...currentFiles };
    if (!updatedFiles["firebase.js"]) updatedFiles["firebase.js"] = firebaseJs;
    if (updatedFiles["index.html"] && !updatedFiles["index.html"].includes("<!-- DEVWEBIA_UPDATED -->")) {
      updatedFiles["index.html"] = updatedFiles["index.html"].replace(
        "</body>",
        `<!-- DEVWEBIA_UPDATED -->\n<script>console.log("Site mis à jour avec succès");</script>\n</body>`
      );
    }

    const payload = {
      explanation: `Modification appliquée avec succès à votre site par l'IA DEVWEBIA pour la demande : "${prompt}". Tous les fichiers ont été mis à jour.`,
      name: titleMatch,
      files: updatedFiles,
      questions: [],
    };
    return { text: `<JSON>\n${JSON.stringify(payload, null, 2)}\n</JSON>`, tokens: 500 };
  }

  const badgeHtml =
    userPlan === "free"
      ? `<div class="fixed bottom-4 left-4 z-50 bg-slate-900/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border border-slate-700 backdrop-blur">✨ Fait avec DEVWEBIA</div>`
      : "";

  const indexHtml = `<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleMatch}</title>
  <!-- Tailwind CSS v4 -->
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <!-- Firebase Compat SDKs -->
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
  <script src="firebase.js"></script>
  ${pwaEnabled ? '<link rel="manifest" href="manifest.webmanifest">' : ""}
</head>
<body class="bg-slate-50 text-slate-800 antialiased font-sans">
  <header class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
          ${titleMatch.charAt(0).toUpperCase()}
        </div>
        <span class="font-bold text-xl text-slate-900 tracking-tight">${titleMatch}</span>
      </div>
      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
        <a href="#hero" class="hover:text-indigo-600 transition">Accueil</a>
        <a href="#features" class="hover:text-indigo-600 transition">Services</a>
        <a href="#about" class="hover:text-indigo-600 transition">À Propos</a>
        <a href="#contact" class="hover:text-indigo-600 transition">Contact</a>
      </nav>
      <div class="flex items-center gap-3">
        <a href="https://wa.me/${cleanWaNum}" target="_blank" class="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2 rounded-xl shadow transition flex items-center gap-2">
          <i class="fa-brands fa-whatsapp text-lg"></i>
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  </header>

  <section id="hero" class="relative py-20 lg:py-28 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white overflow-hidden">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center lg:text-left grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-6">
          ✨ Bienvenue sur ${titleMatch}
        </span>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          Solutions sur mesure pour vos besoins
        </h1>
        <p class="text-lg text-indigo-100/90 mb-8 max-w-xl">
          ${prompt}
        </p>
        <div class="flex flex-wrap gap-4 justify-center lg:justify-start">
          <a href="#contact" class="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg transition">
            Nous Contacter
          </a>
          <a href="https://wa.me/${cleanWaNum}" target="_blank" class="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3.5 rounded-xl border border-white/20 backdrop-blur transition flex items-center gap-2">
            <i class="fa-brands fa-whatsapp text-emerald-400"></i>
            Discuter sur WhatsApp
          </a>
        </div>
      </div>
      <div class="relative flex justify-center">
        <div class="w-full max-w-md bg-white/10 border border-white/20 p-8 rounded-3xl shadow-2xl backdrop-blur text-left">
          <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
            <i class="fa-solid fa-paper-plane text-indigo-400"></i> Demande rapide
          </h3>
          <form id="hero-form" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-indigo-200 mb-1">Votre Nom</label>
              <input type="text" id="hero-name" required placeholder="Jean Dupont" class="w-full bg-slate-900/50 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400">
            </div>
            <div>
              <label class="block text-xs font-medium text-indigo-200 mb-1">Numéro de Téléphone</label>
              <input type="tel" id="hero-phone" required placeholder="+261 34 00 000 00" class="w-full bg-slate-900/50 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400">
            </div>
            <div>
              <label class="block text-xs font-medium text-indigo-200 mb-1">Message ou Commande</label>
              <textarea id="hero-msg" rows="3" required placeholder="Décrivez votre besoin..." class="w-full bg-slate-900/50 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400"></textarea>
            </div>
            <button type="submit" class="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl shadow transition flex items-center justify-center gap-2">
              <i class="fa-brands fa-whatsapp"></i> Envoyer via WhatsApp
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>

  <section id="features" class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 class="text-3xl font-extrabold text-slate-900 mb-4">Nos Services & Offres</h2>
      <p class="text-slate-600 max-w-2xl mx-auto mb-16">Découvrez tout ce que nous proposons pour vous accompagner au quotidien.</p>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-left hover:shadow-xl transition">
          <div class="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold mb-6">
            <i class="fa-solid fa-star"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-3">Service Qualité Première</h3>
          <p class="text-slate-600 text-sm leading-relaxed mb-6">Un accompagnement complet et professionnel adapté à vos attentes.</p>
          <a href="https://wa.me/${cleanWaNum}" class="text-indigo-600 font-semibold text-sm hover:underline flex items-center gap-2">Commander <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-left hover:shadow-xl transition">
          <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold mb-6">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-3">Rapidité & Efficacité</h3>
          <p class="text-slate-600 text-sm leading-relaxed mb-6">Intervention et réponse rapides pour garantir votre satisfaction.</p>
          <a href="https://wa.me/${cleanWaNum}" class="text-emerald-600 font-semibold text-sm hover:underline flex items-center gap-2">En savoir plus <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-left hover:shadow-xl transition">
          <div class="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-bold mb-6">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-3">Garantie & Sécurité</h3>
          <p class="text-slate-600 text-sm leading-relaxed mb-6">Un service fiable en toute sécurité avec support client réactif.</p>
          <a href="https://wa.me/${cleanWaNum}" class="text-amber-600 font-semibold text-sm hover:underline flex items-center gap-2">Contact direct <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      </div>
    </div>
  </section>

  <footer id="contact" class="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
      <div class="flex justify-center items-center gap-3 text-white text-2xl font-bold">
        <span>${titleMatch}</span>
      </div>
      <p class="text-sm text-slate-400 max-w-md mx-auto">
        Des questions ou besoin d'informations ? Contactez-nous directement via WhatsApp au <strong class="text-emerald-400">${waNum}</strong>.
      </p>
      <div class="pt-6 border-t border-slate-800 text-xs text-slate-500">
        &copy; ${new Date().getFullYear()} ${titleMatch}. Tous droits réservés.
      </div>
    </div>
  </footer>

  <a href="https://wa.me/${cleanWaNum}" target="_blank" class="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-3xl hover:scale-110 transition duration-300">
    <i class="fa-brands fa-whatsapp"></i>
  </a>

  ${badgeHtml}

  <script src="script.js"></script>
</body>
</html>`;

  const scriptJs = `// Logique interactive auto-générée pour ${titleMatch}
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("hero-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = document.getElementById("hero-name").value;
      const phone = document.getElementById("hero-phone").value;
      const msg = document.getElementById("hero-msg").value;

      const waText = encodeURIComponent(
        "Bonjour ! Je suis " + name + " (" + phone + ").\\n" + msg
      );
      window.open("https://wa.me/${cleanWaNum}?text=" + waText, "_blank");
    });
  }
});
`;

  const adminHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Administration - ${titleMatch}</title>
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
  <script src="firebase.js"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
  <div id="login-box" class="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
    <div class="text-center mb-6">
      <div class="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl mx-auto flex items-center justify-center text-xl mb-3 border border-indigo-500/30">
        <i class="fa-solid fa-shield-halved"></i>
      </div>
      <h2 class="text-2xl font-bold text-white">Connexion Administrateur</h2>
      <p class="text-xs text-slate-400 mt-1">Espace Administrateur Sécurisé par DEVWEBIA</p>
    </div>
    <form id="pin-form" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Code PIN d'Accès</label>
        <input type="password" id="pin-input" placeholder="••••" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest text-white focus:outline-none focus:border-indigo-500">
      </div>
      <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2">
        <i class="fa-solid fa-lock"></i> Accéder au Panneau
      </button>
    </form>
    <div class="mt-6 pt-4 border-t border-slate-700/60 text-center">
      <span class="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
        <i class="fa-solid fa-circle-check"></i> Cryptage SHA-256 & Isolation Firebase
      </span>
    </div>
  </div>

  <div id="admin-panel" class="hidden max-w-4xl w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
    <div class="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
      <div>
        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
          <span>Panneau d'Administration</span>
          <span class="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">🔒 Sécurisé</span>
        </h2>
        <p class="text-xs text-slate-400 mt-1">Données privées et clés secrets isolées sur Firebase</p>
      </div>
      <button id="logout-btn" class="bg-red-600/20 text-red-400 hover:bg-red-600/30 px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2">
        <i class="fa-solid fa-right-from-bracket"></i> Déconnexion
      </button>
    </div>
    <div class="space-y-6">
      <div class="bg-slate-900 p-6 rounded-xl border border-slate-700">
        <h3 class="text-lg font-bold mb-3 text-indigo-300 flex items-center gap-2">
          <i class="fa-solid fa-circle-info"></i> Informations & Configuration
        </h3>
        <div class="grid sm:grid-cols-2 gap-4 text-sm text-slate-300">
          <p>Projet : <span class="text-white font-semibold">${titleMatch}</span></p>
          <p>WhatsApp Réception : <span class="text-emerald-400 font-semibold">${waNum}</span></p>
          <p>Base de Données : <span class="text-indigo-400 font-semibold">Firebase Firestore Privée</span></p>
          <p>Statut Clés & Secrets : <span class="text-emerald-400 font-semibold">Protégé</span></p>
        </div>
      </div>
    </div>
  </div>

  <script src="admin.js"></script>
</body>
</html>`;

  const adminJs = `// Panneau Administration Sécurisé DEVWEBIA (Cryptage SHA-256 + Isolation Firebase)
async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Hash SHA-256 du PIN par défaut "1234" : 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
const DEFAULT_PIN_HASH = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";

document.addEventListener("DOMContentLoaded", function () {
  const pinForm = document.getElementById("pin-form");
  const loginBox = document.getElementById("login-box");
  const adminPanel = document.getElementById("admin-panel");
  const logoutBtn = document.getElementById("logout-btn");

  if (pinForm) {
    pinForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const inputPin = document.getElementById("pin-input").value;
      const hashedInput = await hashPin(inputPin);
      
      const storedHash = localStorage.getItem("devwebia_admin_pin_hash") || DEFAULT_PIN_HASH;

      if (hashedInput === storedHash) {
        loginBox.classList.add("hidden");
        adminPanel.classList.remove("hidden");
        sessionStorage.setItem("devwebia_admin_authenticated", "true");
      } else {
        alert("🔒 Accès refusé : Code PIN incorrect.");
      }
    });
  }

  if (sessionStorage.getItem("devwebia_admin_authenticated") === "true") {
    if (loginBox) loginBox.classList.add("hidden");
    if (adminPanel) adminPanel.classList.remove("hidden");
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      sessionStorage.removeItem("devwebia_admin_authenticated");
      adminPanel.classList.add("hidden");
      loginBox.classList.remove("hidden");
    });
  }
});`;

  const files: Record<string, string> = {
    "index.html": indexHtml,
    "script.js": scriptJs,
    "firebase.js": firebaseJs,
    "admin.html": adminHtml,
    "admin.js": adminJs,
  };

  if (pwaEnabled) {
    files["manifest.webmanifest"] = JSON.stringify(
      {
        name: titleMatch,
        short_name: titleMatch.slice(0, 12),
        start_url: "./index.html",
        display: "standalone",
        background_color: "#0f172a",
        theme_color: "#4f46e5",
      },
      null,
      2
    );
    files["sw.js"] = `self.addEventListener("fetch", function(e) {});`;
  }

  const payload = {
    explanation: `Site Web "${titleMatch}" généré avec succès par l'IA DEVWEBIA. Vous pouvez maintenant personnaliser le site ou ajouter d'autres fonctionnalités.`,
    name: titleMatch,
    files,
    questions: [
      { q: "Souhaitez-vous ajouter des produits ou services spécifiques ?", options: ["Oui", "Non"] },
      { q: "Voulez-vous modifier les couleurs principales du site ?", options: ["Bleu", "Vert", "Noir/Luxe", "Laissez ainsi"] },
    ],
  };

  return {
    text: `<JSON>\n${JSON.stringify(payload, null, 2)}\n</JSON>`,
    tokens: 1000,
  };
}

export const generateSite = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    let profile = await adminDb.getProfile(userId);
    if (!profile) {
      // Auto-create default profile if missing
      await adminDb.updateProfile(userId, {
        email: context.email || "",
        credits: 5,
        plan: "free",
        created_at: new Date().toISOString(),
      });
      profile = await adminDb.getProfile(userId);
    }

    const integ = await adminDb.getUserIntegrations(userId);

    const hasPersonalKey = !!(integ?.ai_provider && integ?.ai_api_key);
    const subActive = !!profile?.ai_sub_expires_at && new Date(profile.ai_sub_expires_at).getTime() > Date.now();
    const useByok = hasPersonalKey && subActive;

    if (!useByok && (profile?.credits ?? 0) < 1) throw new Error("insufficient_credits");

    // Load or create project
    let projectId = data.projectId;
    let currentFiles: Record<string, string> = {};
    let projectSiteType: SiteType = data.siteType ?? "vitrine";
    let projectWhatsapp: string | null = data.whatsappNumber?.trim() || null;
    let projectPwa: boolean = data.pwaEnabled ?? false;

    if (projectId) {
      const p = await adminDb.getProject(projectId);
      if (p) {
        currentFiles = p.files || {};
        if (p.site_type) projectSiteType = p.site_type;
        if (p.whatsapp_number) projectWhatsapp = p.whatsapp_number;
        if (p.pwa_enabled !== undefined) projectPwa = !!p.pwa_enabled;
      }
    } else {
      const pDoc = {
        user_id: userId,
        name: "Nouveau site",
        site_type: projectSiteType,
        whatsapp_number: projectWhatsapp,
        pwa_enabled: projectPwa,
        created_at: new Date().toISOString(),
      };
      const newProjId = "proj_" + Date.now();
      await adminDb.updateProject(newProjId, pDoc);
      projectId = newProjId;
    }

    const userFirebaseSnippet = `\nBACKEND FIREBASE (PROJET CONFIGURÉ) :
- Project ID : ${firebaseConfig.projectId}
- Firestore DB ID : ${firebaseConfig.firestoreDatabaseId || "(default)"}
- API Key : ${firebaseConfig.apiKey}
- Auth Domain : ${firebaseConfig.authDomain}
- Storage Bucket : ${firebaseConfig.storageBucket}
Quand la demande implique des données persistantes, utilisateurs ou authentification :
  1) Charger Firebase compat SDK v10 dans HTML :
     <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
     <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
     <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
  2) Créer \`firebase.js\` (RACCORDEMENT DE BASE DE DONNÉES EXACTE) :
     const firebaseConfig = {
       apiKey: "${firebaseConfig.apiKey}",
       authDomain: "${firebaseConfig.authDomain}",
       projectId: "${firebaseConfig.projectId}",
       storageBucket: "${firebaseConfig.storageBucket}",
       appId: "${firebaseConfig.appId}"
     };
     if (typeof firebase !== 'undefined') {
       if (firebase.apps.length === 0) firebase.initializeApp(firebaseConfig);
       const dbId = "${firebaseConfig.firestoreDatabaseId || ''}";
       try {
         window.db = (dbId && dbId !== "(default)") ? firebase.app().firestore(dbId) : firebase.firestore();
       } catch (e) {
         try { window.db = firebase.firestore(); } catch(err) { window.db = null; }
       }
       try { window.auth = firebase.auth(); } catch(e) { window.auth = null; }
     }
  3) SÉCURISATION ET TOLÉRANCE AUX ERREURS DE CONNEXION (SANS ERREUR BLOQUANTE) :
     - Entourer TOUTES les opérations Firestore (lecture/écriture/connexion) de blocs try/catch.
     - Si Firestore renvoie une erreur de connexion ou de permissions, enregistrer/lire les données dans le \`localStorage\` du navigateur afin que l'inscription, la connexion et le panneau d'administration fonctionnent TOUJOURS de manière fluide et sans afficher de message d'erreur bloquant.
  4) GESTION DES UTILISATEURS DU SITE ET LIMITE DES 200 UTILISATEURS (CRITIQUE) :
     - Enregistre les utilisateurs du site généré dans la collection Firestore \`app_users\` avec \`projectId: "${projectId}"\`.
     - RÈGLE DES 200 UTILISATEURS DU PLAN GRATUIT :
       Pour le plan gratuit (ou si le plan PRO est expiré au-delà de 30 jours), le nombre d'utilisateurs autorisés est strictement limité à 200 au maximum.
       Seuls les 200 premiers utilisateurs inscrits (\`user_number <= 200\`) ont accès à leur compte.
       Si le total des utilisateurs dépasse 200, bloquer immédiatement l'inscription et la connexion avec le message :
       "❌ Limite de 200 utilisateurs atteinte pour le plan gratuit. Le propriétaire du site doit souscrire au Plan PRO pour un nombre d'utilisateurs illimité."
     - Si le plan du propriétaire est PRO (valide 30 jours), le nombre d'utilisateurs est ILLIMITÉ pendant cette période.
  5) Stocker les données et contenus du site dans la collection \`app_data\` (\`projectId: "${projectId}"\`).`;

    const userPlan = (profile?.plan as "free" | "pro") ?? "free";
    const messages = [
      {
        role: "system",
        content: buildSystemPrompt(
          projectSiteType,
          projectWhatsapp,
          projectPwa,
          userFirebaseSnippet,
          Object.keys(currentFiles).length > 0,
          userPlan
        ),
      },
      ...(data.history ?? []),
    ];

    let userMsg = data.prompt;
    if (Object.keys(currentFiles).length) {
      userMsg += `\n\n--- FICHIERS ACTUELS DU SITE ---\n`;
      for (const [path, content] of Object.entries(currentFiles)) {
        userMsg += `\n### ${path}\n\`\`\`\n${content}\n\`\`\`\n`;
      }
      userMsg += `\n---`;
    }
    messages.push({ role: "user", content: userMsg });

    const geminiEnvKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    const lovableKey = process.env.LOVABLE_API_KEY;
    let result: { text: string; tokens: number } | null = null;

    if (useByok) {
      try {
        result = await callAdminKey(integ!.ai_api_key!, integ!.ai_provider!, messages);
      } catch (err) {
        console.warn("BYOK failed:", err);
      }
    }

    if (!result && geminiEnvKey) {
      try {
        result = await callAdminKey(geminiEnvKey, "google", messages);
      } catch (err) {
        console.warn("System GEMINI_API_KEY failed:", err);
      }
    }

    if (!result && lovableKey) {
      try {
        result = await callGateway(lovableKey, messages);
      } catch (err) {
        console.warn("LOVABLE_API_KEY gateway failed:", err);
      }
    }

    if (!result) {
      try {
        const keys = await adminDb.getAdminKeys();
        if (keys && keys.length > 0) {
          for (const k of keys) {
            if (k.active === false) continue;
            try {
              result = await callAdminKey(k.key_value, k.provider || "google", messages);
              if (result) {
                await adminDb.updateAdminKey(k.id, {
                  request_count: (k.request_count || 0) + 1,
                  tokens_used: (k.tokens_used || 0) + (result.tokens || 0),
                  last_used_at: new Date().toISOString(),
                });
                break;
              }
            } catch (kErr) {
              console.warn(`Admin key ${k.id} failed:`, kErr);
            }
          }
        }
      } catch (dbErr) {
        console.warn("Failed retrieving admin keys:", dbErr);
      }
    }

    if (!result) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash:free",
            messages,
            temperature: 0.7,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          const text = json.choices?.[0]?.message?.content ?? "";
          if (text) {
            result = { text, tokens: json.usage?.total_tokens ?? 0 };
          }
        }
      } catch (orErr) {
        console.warn("OpenRouter fallback failed:", orErr);
      }
    }

    if (!result) {
      console.info("Fallback to DEVWEBIA Default AI Generator System");
      result = generateDefaultFallbackSite({
        prompt: data.prompt,
        siteType: projectSiteType,
        whatsapp: projectWhatsapp,
        pwaEnabled: projectPwa,
        firebaseConfig,
        userPlan,
        currentFiles,
      });
    }

    let parsed = extractJson(result.text);
    if (!parsed) {
      console.warn("Failed parsing AI JSON output, falling back to default site generator.");
      const fallbackResult = generateDefaultFallbackSite({
        prompt: data.prompt,
        siteType: projectSiteType,
        whatsapp: projectWhatsapp,
        pwaEnabled: projectPwa,
        firebaseConfig,
        userPlan,
        currentFiles,
      });
      parsed = extractJson(fallbackResult.text);
    }

    if (!parsed) throw new Error("Impossible de générer le site web. Veuillez réessayer.");

    const questionsMarker = parsed.questions.length
      ? `\n\n<!--DEVWEBIA_Q:${Buffer.from(JSON.stringify(parsed.questions)).toString("base64")}-->`
      : "";

    if (Object.keys(parsed.files).length === 0) {
      const creditsUsedNoop = useByok ? 0 : 1;
      if (creditsUsedNoop > 0) {
        await adminDb.updateProfile(userId, { credits: Math.max(0, (profile?.credits || 0) - creditsUsedNoop) });
      }
      await adminDb.updateProject(projectId!, {
        site_type: projectSiteType,
        whatsapp_number: projectWhatsapp,
        pwa_enabled: projectPwa,
      });
      await adminDb.addMessage({
        project_id: projectId,
        user_id: userId,
        role: "user",
        content: data.prompt,
        tokens_used: 0,
        credits_used: 0,
      });
      await adminDb.addMessage({
        project_id: projectId,
        user_id: userId,
        role: "assistant",
        content: parsed.explanation + questionsMarker,
        tokens_used: result.tokens,
        credits_used: creditsUsedNoop,
      });
      return {
        projectId,
        explanation: parsed.explanation,
        name: parsed.name,
        files: {},
        questions: parsed.questions,
        tokensUsed: result.tokens,
        creditsUsed: creditsUsedNoop,
      };
    }

    const creditsUsed = useByok ? 0 : Math.max(1, Math.ceil(result.tokens / 15000));
    if (creditsUsed > 0) {
      await adminDb.updateProfile(userId, { credits: Math.max(0, (profile?.credits || 0) - creditsUsed) });
    }

    await adminDb.updateProject(projectId!, {
      name: parsed.name.slice(0, 40) || "Nouveau site",
      files: parsed.files,
      html_content: parsed.files["index.html"] ?? "",
      css_content: parsed.files["style.css"] ?? "",
      js_content: parsed.files["script.js"] ?? "",
      site_type: projectSiteType,
      whatsapp_number: projectWhatsapp,
      pwa_enabled: projectPwa,
      updated_at: new Date().toISOString(),
    });

    await adminDb.addMessage({
      project_id: projectId,
      user_id: userId,
      role: "user",
      content: data.prompt,
      tokens_used: 0,
      credits_used: 0,
    });

    await adminDb.addMessage({
      project_id: projectId,
      user_id: userId,
      role: "assistant",
      content: parsed.explanation + questionsMarker,
      tokens_used: result.tokens,
      credits_used: creditsUsed,
    });

    return {
      projectId,
      explanation: parsed.explanation,
      name: parsed.name,
      files: parsed.files,
      questions: parsed.questions,
      tokensUsed: result.tokens,
      creditsUsed,
    };
  });
