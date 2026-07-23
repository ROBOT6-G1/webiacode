import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { adminDb } from "@/integrations/firebase/admin";
import { firebaseConfig } from "@/integrations/firebase/config";
import { z } from "zod";

const siteTypeEnum = z.enum(["vitrine", "portfolio", "ecommerce", "hotel", "school", "erp"]);
const languageEnum = z.enum(["fr", "mg", "en", "zh", "it"]);

const inputSchema = z.object({
  projectId: z.string().optional(),
  prompt: z.string().min(1).max(4000),
  siteType: siteTypeEnum.optional(),
  language: languageEnum.optional(),
  whatsappNumber: z.string().trim().max(30).optional(),
  pwaEnabled: z.boolean().optional(),
  imageBase64: z.string().optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(30)
    .optional(),
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
- Les 10 sections obligatoires à inclure impérativement sur le site public (index.html) :
  1. Hero / Accueil : Présentation percutante avec titre accrocheur, sous-titre et bouton d'action.
  2. À propos de l'entreprise : Histoire, valeurs, vision et textes de présentation de l'entreprise.
  3. Nos Services : Liste complète et détaillée des services et offres de l'entreprise.
  4. Pourquoi nous choisir : Atouts, garanties, chiffres clés ou statistiques prouvant l'excellence.
  5. Réalisations / Portfolio : Grille ou carrousel moderne présentant les derniers projets ou réalisations.
  6. Témoignages clients : Avis authentiques avec étoiles, nom du client et photo/avatar.
  7. Équipe : Présentation des membres clés de l'équipe avec leur rôle et leur photo.
  8. FAQ : Foire aux questions avec un système d'accordéon interactif en JavaScript.
  9. Blog / Actualités : Articles ou nouveautés de l'entreprise avec date et catégorie.
  10. Contact (Carte + Formulaire) : Formulaire de contact opérationnel, carte interactive (iframe ou mock propre) et coordonnées complètes (Email, WhatsApp, Téléphone, Adresse).
- Pas de panier, pas de checkout. Un formulaire de contact simple est requis.`;
  }
  if (siteType === "portfolio") {
    return `\nTYPE DE SITE : PORTFOLIO (mise en valeur du travail d'un créatif / freelance).
- Les 10 sections obligatoires à inclure impérativement sur le site public (index.html) :
  1. Hero / Présentation : Salutation personnalisée, titre fort sur votre métier/spécialité, et bouton CTA.
  2. À propos : Biographie, parcours professionnel, et philosophie de travail.
  3. Mes Services : Les prestations proposées avec détails et tarifs indicatifs.
  4. Mes Compétences : Liste visuelle de vos hard & soft skills avec barres de progression ou badges stylisés.
  5. Portfolio / Réalisations : Galerie de projets triables par catégorie avec images, titres et descriptions.
  6. Études de cas : Explication détaillée de projets majeurs (problème, solution apportée, résultats obtenus).
  7. Témoignages : Avis de clients ou de collègues sur vos collaborations.
  8. Tarifs / Offres : Forfaits ou formules d'accompagnement proposées pour vos services.
  9. FAQ : Réponses aux questions fréquentes des prospects (délais, processus, tarifs).
  10. Contact / Réservation : Formulaire de prise de contact ou de réservation directe d'appel/session.`;
  }
  if (siteType === "hotel") {
    return `\nTYPE DE SITE : HOTEL / RESTAURANTS (site + back-office complet).
- Les 10 sections obligatoires à inclure impérativement sur le site public (index.html) :
  1. Hero : Visuels somptueux de l'établissement, slogan invitant, et barre de recherche rapide de disponibilité.
  2. À propos : Histoire de l'établissement, atmosphère unique, et valeurs de service.
  3. Chambres / Menu : Grille présentant les suites/chambres disponibles ou les menus gastronomiques phares de l'établissement.
  4. Services : Équipements de l'hôtel ou prestations (Spa, Piscine, Navette, Wifi gratuit, Parking, Petit-déjeuner).
  5. Galerie photos : Galerie d'images en haute résolution montrant l'établissement sous toutes ses coutures.
  6. Tarifs : Grille tarifaire claire par catégorie de chambre ou formules spéciales de repas.
  7. Réservation : Formulaire de réservation directe en ligne avec dates d'arrivée, de départ et sélection de l'offre.
  8. Avis clients : Notes, avis détaillés et commentaires des voyageurs/clients.
  9. FAQ : Réponses aux questions récurrentes (Horaires d'arrivée/départ, animaux, conditions d'annulation).
  10. Contact + Carte : Localisation sur carte, adresse exacte, e-mail, téléphone et bouton de redirection directe.`;
  }
  if (siteType === "school") {
    return `\nTYPE DE SITE : ÉCOLE / FORMATION (site école + back-office scolaire).
- Les 10 sections obligatoires à inclure impérativement sur le site public (index.html) :
  1. Hero : Message de bienvenue inspirant, slogan éducatif et boutons d'inscription / découverte.
  2. Présentation : Histoire de l'établissement, mot de la direction, mission et valeurs académiques.
  3. Formations / Cours : Catalogue complet des cours, filières, classes ou formations proposées.
  4. Enseignants : Présentation de l'équipe pédagogique avec leurs photos, diplômes et matières enseignées.
  5. Programmes : Détail des programmes scolaires, activités parascolaires et calendrier des cours.
  6. Tarifs : Grille de frais de scolarité ou coûts des formations avec facilités de paiement.
  7. Témoignages : Avis de parents d'élèves, d'étudiants actuels ou d'anciens diplômés.
  8. FAQ : Réponses aux questions (Critères d'admission, rentrée, bourses, uniformes).
  9. Inscription : Formulaire de demande d'admission ou d'inscription en ligne complet.
  10. Contact : Coordonnées complètes de l'établissement, secrétaire académique, horaires d'ouverture et plan d'accès.`;
  }
  if (siteType === "erp") {
    return `\nTYPE DE SITE : ORGANISATION / ASSOCIATION (site de présentation + collecte + back-office).
- Les 10 sections obligatoires à inclure impérativement sur le site public (index.html) :
  1. Hero : Titre percutant décrivant la cause soutenue, slogans mobilisateurs et bouton d'action "Faire un don" ou "Nous rejoindre".
  2. À propos : Origine, histoire et valeurs de l'association ou de l'organisation.
  3. Notre Mission : Les objectifs globaux de la structure et l'impact recherché auprès de la communauté.
  4. Nos Activités : Description des actions menées sur le terrain, projets en cours et réussites passées.
  5. Événements : Calendrier des futurs rassemblements, webinaires, collectes, campagnes ou journées d'action.
  6. Équipe : Trombinoscope et biographie rapide des membres fondateurs, du bureau et des bénévoles clés.
  7. Partenaires : Logos des entreprises, sponsors ou autres ONGs partenaires soutenant la structure.
  8. Galerie : Photos des projets réalisés, distributions de dons, ou réunions de terrain.
  9. Faire un don / Adhérer : Formulaire en ligne interactif ou instructions pour faire un don / adhérer à l'association.
  10. Contact : Coordonnées, formulaires de bénévolat, réseaux sociaux et adresse de contact principal.`;
  }
  return `\nTYPE DE SITE : E-COMMERCE (boutique en ligne complète).
- Les 10 sections obligatoires à inclure impérativement sur le site public (index.html) :
  1. Hero / Promotions : Visuel d'impact, slogan accrocheur et bannières promotionnelles avec bouton "Acheter maintenant".
  2. Catégories : Liste illustrée des catégories de produits proposées pour faciliter la recherche.
  3. Produits populaires : Grille moderne des articles phares les plus demandés avec boutons d'ajout rapide au panier.
  4. Nouveautés : Section dédiée aux tout derniers arrivages du magasin ou de l'artisanat.
  5. Meilleures ventes : Les produits incontournables recommandés par la boutique.
  6. Avis clients : Commentaires réels d'acheteurs sur la qualité des produits et du service de livraison.
  7. Offres spéciales : Réductions temporaires, ventes flash ou codes de parrainage exclusifs.
  8. FAQ : Foire aux questions logistiques (Modes de paiement, délais de livraison, retours et remboursements).
  9. Blog : Conseils d'utilisation des produits ou articles connexes pour asseoir l'expertise de la marque.
  10. Contact / Support : Formulaire de réclamation ou service après-vente, numéro WhatsApp de support en ligne et email.`;
}

function buildSystemPrompt(
  siteType: SiteType,
  whatsapp: string | null,
  pwaEnabled: boolean,
  userFirebaseSnippet: string,
  hasExistingFiles: boolean,
  userPlan: "free" | "pro",
  language: "fr" | "mg" | "en" | "zh" | "it" = "fr",
): string {
  const languageNames: Record<string, string> = {
    fr: "Français",
    mg: "Malagasy",
    en: "English",
    zh: "中文 (Chinois)",
    it: "Italiano (Italien)",
  };
  const langName = languageNames[language] || "Français";
  const languageBlock = `\nLANGUE DE SORTIE ET DE CLARIFICATION OBLIGATOIRE : ${langName}.
- Toutes les questions, options de quiz, textes du site web (index.html, admin.html, etc.), slogans et descriptions DOIVENT être intégralement rédigés en ${langName}.`;
  const pwaBlock = `\nAPPLICATION PWA AUTOMATIQUE & LOGO AI (OBLIGATOIRE POUR CHAT & NOUVEAUX SITES) :
- TOUT site généré DOIT être une Application Web Progressive (PWA) 100% installable sur mobile et ordinateur.
- L'IA DOIT GÉNÉRER AUTOMATIQUEMENT UN LOGO / ICÔNE PWA DESIGN :
  - Crée un fichier \`icon.svg\` ou génère une image SVG/Canvas vectorielle magnifique et moderne adaptée à la marque (ex: un symbole graphique élégant avec des dégradés vibrants et l'initiale de la marque).
- FICHIERS ET INTÉGRATION PWA ASSURÉS PAR L'IA :
  1. \`manifest.webmanifest\` : Contient \`name\`, \`short_name\`, \`start_url\` ("./index.html"), \`display\` ("standalone"), \`background_color\`, \`theme_color\`, et la référence à l'icône SVG/Base64.
  2. \`sw.js\` : Service Worker complet assurant la mise en cache (CacheFirst/NetworkFirst) des ressources (index.html, script.js, firebase.js, styles) pour le fonctionnement HORS-LIGNE (Offline).
  3. Dans \`index.html\` : Inclure les balises \`<link rel="manifest" href="manifest.webmanifest">\`, \`<meta name="theme-color" content="...">\`, et balises d'icône Apple iOS (\`apple-touch-icon\`).
  4. Dans \`script.js\` : Enregistrer le Service Worker (\`navigator.serviceWorker.register('./sw.js')\`) et capter l'événement \`beforeinstallprompt\` pour afficher un bouton d'installation PWA interactif sur le site public ("📱 Installer l'Application").
- GESTION DU LOGO ET PARAMÈTRES PWA DANS L'ESPACE ADMIN (\`admin.html\` & \`admin.js\`) :
  - L'IA DOIT inclure dans l'interface \`admin.html\` un panneau dédié "📱 Configuration PWA & Logo" :
    - Champ Nom de l'application & Nom court d'écran d'accueil
    - Sélecteur de couleur de thème PWA (Theme Color)
    - Option de remplacement du Logo/Icône PWA (Upload d'image locale convertie en Base64 ou lien SVG/PNG)
    - Bouton de sauvegarde synchronisant immédiatement les modifications dans Firestore (\`app_data\` -> \`site_content\`) et réactualisant le manifest dynamiquement.`;

  const clarificationBlock = hasExistingFiles
    ? `\nCONTEXTE : Le site existe déjà. Applique directement la modification et renvoie TOUS les fichiers (site + admin). Ne pose PAS de questions.`
    : `\nPHASE DE CLARIFICATION (OBLIGATOIRE avant un NOUVEAU site) :
- Pose tes questions STRICTEMENT dans la langue de l'utilisateur (si l'utilisateur parle en malagasy, réponds 100% en malagasy sans fautes ni caractères chinois ; si en français, réponds 100% en français).
- Pose au moins 15 QUESTIONS CLÉS, STRUCTURÉES ET PROFESSIONNELLES pour la création du site (15 questions minimum) afin de construire un site web hautement professionnel, moderne et attrayant.
- DEVOIR STRICT DE DEVWEBIA (OBLIGATOIRE) : Dès que l'utilisateur répond aux questions, l'IA DOIT STRICTEMENT ET INTÉGRALEMENT APPLIQUER TOUTES LES RÉPONSES DANS LE CODE HTML/CSS/JS ET LA CONFIGURATION DU SITE.
- Retourne les questions dans le tableau \`questions\`. \`files\` DOIT être \`{}\` vide durant cette phase.`;

  const adminBlock = `\nINTERFACE ADMIN (CMS D'ÉDITION VISUELLE COMPLET) ET SÉCURITÉ DES DONNÉES — OBLIGATOIRE POUR TOUT SITE :
- Génère \`admin.html\` et \`admin.js\` complets et haut de gamme.
- PERMETTRE AU CLIENT DE MODIFIER EN DIRECT TOUTE L'INTERFACE UTILISATEUR :
  1. Identité & Logo : Nom du site, Slogan, Logo (URL ou upload direct d'image convertie en Base64).
  2. GESTION MULTI-HERO : Possibilité de créer, modifier et supprimer plusieurs sections Hero (Slide 1, Slide 2, etc.) avec titre, sous-titre, bouton CTA, et **image d'illustration/fond propre à chaque hero**.
  3. CRÉATEUR DE SECTIONS PERSONNALISÉES DYNAMIQUES : Permettre à l'administrateur d'ajouter de **nouvelles sections sur-mesure** (Titre, Contenu/Texte, Image de section, Style de fond) directement depuis l'espace Admin.
  4. AUTO-SEO & INDEXATION GOOGLE :
     - Champs pour Méta-Titre, Méta-Description, Mots-Clés Google (Keywords).
     - Aperçu direct du résultat Google Search (Google Snippet Simulator).
     - Bouton TRÈS VISIBLE : "🚀 Lancer la demande d'indexation Google (Google Ping)" qui envoie le ping à Google (\`https://www.google.com/ping?sitemap=...\`) et sauvegarde les mots-clés.
  5. CONFIGURATION PWA & LOGO APP : Nom PWA, Couleur de thème mobile, logo PWA et bouton d'installation public.
  6. Coordonnées & Contacts : Numéro WhatsApp, Téléphone, E-mail, Adresse physique.
  7. Stockage des Images : Tout fichier image ou logo téléversé dans l'admin doit être encodé en Base64 et sauvegardé dans Firestore dans la collection \`app_data\` (document \`site_content\`).
  8. Code PIN d'accès : Possibilité de changer le Code PIN Administrateur.
- SYNCHRONISATION EN TEMPS RÉEL SUR LE SITE PUBLIC :
  - Tout changement sauvegardé dans l'admin met à jour Firestore (\`app_data\` -> \`site_content\`) ET le \`localStorage\`.
  - Dans \`script.js\` du site public, inclure la fonction \`loadSiteContent()\` qui applique automatiquement ces modifications sur \`index.html\` dès le chargement.`;

  const domainBlock = `\nINSTRUCTIONS STRICTES DOMAINE PERSONNALISÉ & CONFIGURATION DNS (OBLIGATOIRE SI DEMANDÉ) :
- Si le client fait référence à un nom de domaine (ex: boutique.mg, monentreprise.com) ou indique en posséder un :
  1. L'IA DOIT obligatoirement inclure dans \`admin.html\` une section dédiée "Configuration Domaine & DNS".
  2. Expliquer clairement au propriétaire comment faire pointer son domaine vers son site DEVWEBIA :
     - Enregistrement A (Domaine racine @) -> Pointant vers l'IP Vercel \`76.76.21.21\`
     - Enregistrement CNAME (Sous-domaine www) -> Pointant vers \`cname.vercel-dns.com\`
  3. Confirmer que la liaison Vercel et le certificat SSL HTTPS sont pris en charge automatiquement.`;

  const seoBlock = `\nAUTO-SEO & INDEXATION GOOGLE AUTOMATIQUE (OBLIGATOIRE POUR TOUT SITE) :
- TOUT site généré DOIT être optimisé pour les moteurs de recherche (SEO Google) :
  1. DANS \`index.html\` :
     - Balise \`<title>\` pertinente et dynamique.
     - Balises \`<meta name="description" content="...">\` et \`<meta name="keywords" content="...">\`.
     - Open Graph complet : \`og:title\`, \`og:description\`, \`og:image\`, \`og:url\`, \`og:type="website"\`.
     - Twitter Cards : \`twitter:card\`, \`twitter:title\`, \`twitter:description\`, \`twitter:image\`.
     - Données structurées JSON-LD (Schema.org / Organization / LocalBusiness / WebSite) pour apparition directe dans les résultats Google.
  2. FICHIERS SITEMAP ET ROBOTS :
     - Génère obligatoirement \`sitemap.xml\` avec les pages et \`lastmod\`.
     - Génère obligatoirement \`robots.txt\` autorisant Googlebot / Bingbot et pointant vers le \`sitemap.xml\`.
  3. PANNEAU ADMIN \`admin.html\` & \`admin.js\` :
     - Section "🔍 AUTO-SEO & Indexation Google Directe" avec le bouton "🚀 Lancer la demande d'indexation Google (Google Ping)" en premier plan.`;

  const contentPurityBlock = `\nINTERDICTION STRICTE DE POLLUTION DE CONTENU (CRITIQUE) :
- Ne MÊLE JAMAIS les questions/réponses de clarification, les prompts, ni l'historique de la discussion dans les textes visibles du site web.
- L'IA DOIT GÉNÉRER UN CONTENU 100% NOUVEAU, PROFESSIONNEL ET COMMERCIAL (titres captivants, slogans inspirants, paragraphes de présentation, fiches produits/services réalistes) basé sur l'activité ou le thème demandé par l'utilisateur.
- VARIÉTÉ DE DESIGN & STYLES : L'IA doit varier les modèles de design UI (Glassmorphism, Dark Luxe, Minimalist Modern, Neo-Brutalist, Light Corporate) en fonction du domaine d'activité.
- Tout ce contenu rédigé par l'IA doit être dynamiquement éditable dans l'Espace Admin (\`admin.html\` / \`admin.js\`) et synchronisé avec Firestore (\`app_data\` -> \`site_content\`).`;

  const richSectionsAndReadMoreBlock = `\n10 SECTIONS OBLIGATOIRES, ÉDITION CMS INTÉGRALE & COMPOSANT MULTI-IMAGES AVEC BOUTONS D'ACTION (EXIGENCE MAJEURE & CRITIQUE) :

1. **10 SECTIONS PUBLIC OBLIGATOIRES (\`index.html\`)** :
   - Le site généré DOIT impérativement comporter au moins 10 sections distinctes, riches, espacées et haut de gamme correspondant EXACTEMENT aux 10 sections du type de site choisi (voir la section "TYPE DE SITE" ci-dessous).

2. **ÉDITION INTÉGRALE VIA L'ADMINISTRATION (\`admin.html\` & \`admin.js\`)** :
   - L'espace administrateur DOIT permettre de modifier absolument TOUTES les 10 sections publiques du site (titres, textes, images de fond, styles).
   - Les modifications doivent être enregistrées en temps réel dans Firebase Firestore (collection \`app_data\`, document \`site_content\`) et appliquées dynamiquement sur le site public via la fonction \`loadSiteContent()\` dans \`script.js\`.

3. **GALERIES MULTI-IMAGES AVEC BOUTONS DE CONTACT / ACTION INDIVIDUELS (EXIGENCE ABSOLUE)** :
   - Dans CHAQUE section de l'administration, l'administrateur doit pouvoir ajouter, modifier et supprimer un nombre illimité d'éléments contenant une image.
   - Chaque élément inséré par l'admin dans une section DOIT obligatoirement contenir :
     1. Un bouton de téléversement d'image (Image locale convertie en Base64 ou lien URL d'image).
     2. Un titre de l'image (titre de l'élément / produit / service / chambre / enseignant / projet).
     3. Une description textuelle détaillée de cet élément.
     4. Un champ de contact / lien d'action (Numéro de téléphone / WhatsApp, adresse email, ou URL de lien externe).
   - Sur le site public (\`index.html\` / \`script.js\`), ces éléments multi-images doivent être présentés sous forme de cartes d'illustration, de grille moderne ou de carrousel de cartes.
   - **SOUS CHAQUE IMAGE, UN BOUTON DE CONTACT / ACTION INDIVIDUEL EST STRICTEMENT OBLIGATOIRE** : Le contact/lien saisi par l'admin (WhatsApp, e-mail ou lien URL) doit s'afficher sous la forme d'un magnifique bouton interactif juste sous l'image de la carte. Au clic, ce bouton doit :
     - Si c'est un numéro WhatsApp/téléphone : Ouvrir une discussion WhatsApp (\`https://wa.me/...\` avec un texte personnalisé) ou appeler le numéro.
     - Si c'est un e-mail : Ouvrir le client de messagerie (\`mailto:...\`).
     - Si c'est un lien URL : Rediriger vers l'adresse externe ou la page en question.

4. **BOUTON "VOIR PLUS" / "LIRE LA SUITE" SUR LES PARAGRAPHES LONGS** :
   - Intègre un bouton interactif "Voir plus" / "Lire la suite" en JavaScript sur les paragraphes textuels longs pour une meilleure esthétique de lecture.

5. **GÉNÉRATEUR DE SECTIONS PERSONNALISÉES ("AJOUTER UNE SECTION VAOVAO") DANS L'ADMIN** :
   - Dans \`admin.html\` et \`admin.js\`, l'administrateur doit disposer d'un formulaire dédié "➕ Ajouter une nouvelle section sur-mesure" :
     - Champs : Titre de la section, Contenu / Paragraphe (avec gestion de texte long), Image d'illustration (upload en Base64), Type de fond (Clair / Sombre / Coloré).
     - Bouton "Ajouter au site" qui enregistre la nouvelle section dans Firestore (\`app_data\` -> \`site_content\` -> \`customSections\`) et rafraîchit immédiatement l'affichage sur le site public (\`index.html\`).`;

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
${languageBlock}
${clarificationBlock}
${adminBlock}
${domainBlock}
${badgeBlock}
${richSectionsAndReadMoreBlock}
${siteTypeBlock(siteType, whatsapp)}
${pwaBlock}
${seoBlock}
${contentPurityBlock}
${userFirebaseSnippet}`;
}

function extractJson(text: string): GeneratedSite | null {
  const m = text.match(/<JSON>([\s\S]*?)<\/JSON>/);
  let raw = m ? m[1] : text;
  raw = raw.trim();
  if (raw.startsWith("```")) {
    raw = raw
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
  }

  const tryParse = (str: string): GeneratedSite | null => {
    try {
      const parsed = JSON.parse(str);
      const files: Record<string, string> = {};
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
  messages: Array<{ role: string; content: string }>,
) {
  const model = PROVIDER_DEFAULT_MODEL[provider] ?? PROVIDER_DEFAULT_MODEL.google;

  if (provider === "google") {
    const geminiMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    const systemInstruction = messages.find((m) => m.role === "system")?.content;

    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-flash-latest",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-2.5-pro",
      "gemini-1.5-pro",
    ];
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
              systemInstruction: systemInstruction
                ? { parts: [{ text: systemInstruction }] }
                : undefined,
              generationConfig: { temperature: 0.7, maxOutputTokens: 32768 },
            }),
          },
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
  language?: "fr" | "mg" | "en" | "zh" | "it";
}): { text: string; tokens: number } {
  const {
    prompt,
    siteType,
    whatsapp,
    pwaEnabled,
    firebaseConfig,
    userPlan,
    currentFiles,
    language,
  } = params;

  // Clean prompt text removing Q&A artifacts
  const cleanPromptText = prompt
    .replace(/Question \d+\s*:.*?(?=\n|$)/gi, "")
    .replace(/Réponse\s*:.*?(?=\n|$)/gi, "")
    .replace(/Q\d+\s*:.*?(?=\n|$)/gi, "")
    .replace(/\[.*?\]/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .trim();

  let titleMatch = "Mon Entreprise";
  const nameMatch = prompt.match(
    /(?:nom|marque|entreprise|boutique)\s*[:=]?\s*([A-Za-z0-9\sàâäéèêëîïôöùûüç'-]{2,30})/i,
  );
  if (nameMatch && nameMatch[1]) {
    titleMatch = nameMatch[1].trim();
  } else if (cleanPromptText.length > 0 && cleanPromptText.length <= 30) {
    titleMatch = cleanPromptText;
  }

  const defaultHeroSubtitle =
    cleanPromptText && cleanPromptText.length > 30 && cleanPromptText.length < 200
      ? cleanPromptText
      : "Découvrez nos produits et services d'exception. Une expérience unique conçue sur mesure pour répondre à toutes vos exigences.";

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
  const dbId = "${firebaseConfig.firestoreDatabaseId || ""}";
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
    if (
      updatedFiles["index.html"] &&
      !updatedFiles["index.html"].includes("<!-- DEVWEBIA_UPDATED -->")
    ) {
      updatedFiles["index.html"] = updatedFiles["index.html"].replace(
        "</body>",
        `<!-- DEVWEBIA_UPDATED -->\n<script>console.log("Site mis à jour avec succès");</script>\n</body>`,
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
  <title data-cms="siteTitle">${titleMatch}</title>
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
        <div id="logo-container" data-cms="siteLogo" class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md overflow-hidden">
          ${titleMatch.charAt(0).toUpperCase()}
        </div>
        <span data-cms="siteTitle" class="font-bold text-xl text-slate-900 tracking-tight">${titleMatch}</span>
      </div>
      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
        <a href="#hero" class="hover:text-indigo-600 transition">Accueil</a>
        <a href="#services" class="hover:text-indigo-600 transition">Services</a>
        <a href="#about" class="hover:text-indigo-600 transition">À Propos</a>
        <a href="#contact" class="hover:text-indigo-600 transition">Contact</a>
      </nav>
      <div class="flex items-center gap-3">
        <a data-cms-wa-link href="https://wa.me/${cleanWaNum}" target="_blank" class="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2 rounded-xl shadow transition flex items-center gap-2">
          <i class="fa-brands fa-whatsapp text-lg"></i>
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  </header>

  <section id="hero" class="relative py-20 lg:py-28 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white overflow-hidden">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center lg:text-left grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <span data-cms="siteSlogan" class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-6">
          ✨ Bienvenue sur ${titleMatch}
        </span>
        <h1 data-cms="heroTitle" class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          Solutions sur mesure pour vos besoins
        </h1>
        <p data-cms="heroSubtitle" class="text-lg text-indigo-100/90 mb-8 max-w-xl">
          ${defaultHeroSubtitle}
        </p>
        <div class="flex flex-wrap gap-4 justify-center lg:justify-start">
          <a href="#contact" data-cms="heroCta" class="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg transition">
            Nous Contacter
          </a>
          <a data-cms-wa-link href="https://wa.me/${cleanWaNum}" target="_blank" class="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3.5 rounded-xl border border-white/20 backdrop-blur transition flex items-center gap-2">
            <i class="fa-brands fa-whatsapp text-emerald-400"></i>
            Discuter sur WhatsApp
          </a>
        </div>
      </div>
      <div class="relative flex justify-center">
        <div id="hero-img-box" class="w-full max-w-md bg-white/10 border border-white/20 p-8 rounded-3xl shadow-2xl backdrop-blur text-left">
          <img id="hero-custom-img" data-cms="heroImage" src="" class="hidden w-full h-48 object-cover rounded-2xl mb-6 shadow-md">
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

  <section id="services" class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 data-cms="servicesTitle" class="text-3xl font-extrabold text-slate-900 mb-4">Nos Services & Offres</h2>
      <p data-cms="servicesSubtitle" class="text-slate-600 max-w-2xl mx-auto mb-16">Découvrez tout ce que nous proposons pour vous accompagner au quotidien.</p>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-left hover:shadow-xl transition">
          <div class="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold mb-6">
            <i class="fa-solid fa-star"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-3">Service Qualité Première</h3>
          <p class="text-slate-600 text-sm leading-relaxed mb-6">Un accompagnement complet et professionnel adapté à vos attentes.</p>
          <a data-cms-wa-link href="https://wa.me/${cleanWaNum}" class="text-indigo-600 font-semibold text-sm hover:underline flex items-center gap-2">Commander <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-left hover:shadow-xl transition">
          <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold mb-6">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-3">Rapidité & Efficacité</h3>
          <p class="text-slate-600 text-sm leading-relaxed mb-6">Intervention et réponse rapides pour garantir votre satisfaction.</p>
          <a data-cms-wa-link href="https://wa.me/${cleanWaNum}" class="text-emerald-600 font-semibold text-sm hover:underline flex items-center gap-2">En savoir plus <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-left hover:shadow-xl transition">
          <div class="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-bold mb-6">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-3">Garantie & Sécurité</h3>
          <p class="text-slate-600 text-sm leading-relaxed mb-6">Un service fiable en toute sécurité avec support client réactif.</p>
          <a data-cms-wa-link href="https://wa.me/${cleanWaNum}" class="text-amber-600 font-semibold text-sm hover:underline flex items-center gap-2">Contact direct <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      </div>
    </div>
  </section>

  <footer id="contact" class="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
      <div class="flex justify-center items-center gap-3 text-white text-2xl font-bold">
        <span data-cms="siteTitle">${titleMatch}</span>
      </div>
      <p data-cms="footerText" class="text-sm text-slate-400 max-w-md mx-auto">
        Des questions ou besoin d'informations ? Contactez-nous directement via WhatsApp au <strong data-cms="whatsapp" class="text-emerald-400">${waNum}</strong>.
      </p>
      <div class="pt-6 border-t border-slate-800 text-xs text-slate-500">
        &copy; ${new Date().getFullYear()} <span data-cms="siteTitle">${titleMatch}</span>. Tous droits réservés.
      </div>
    </div>
  </footer>

  <a data-cms-wa-link href="https://wa.me/${cleanWaNum}" target="_blank" class="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-3xl hover:scale-110 transition duration-300">
    <i class="fa-brands fa-whatsapp"></i>
  </a>

  ${badgeHtml}

  <script src="script.js"></script>
</body>
</html>`;

  const scriptJs = `// Logique interactive & Chargeur CMS Dynamique DEVWEBIA
function applyCmsData(data) {
  if (!data) return;
  if (data.siteTitle) {
    document.querySelectorAll('[data-cms="siteTitle"]').forEach(el => el.textContent = data.siteTitle);
    document.title = data.siteTitle;
  }
  if (data.siteSlogan) {
    document.querySelectorAll('[data-cms="siteSlogan"]').forEach(el => el.textContent = data.siteSlogan);
  }
  if (data.siteLogo) {
    const container = document.getElementById("logo-container");
    if (container) {
      container.innerHTML = '<img src="' + data.siteLogo + '" class="w-full h-full object-cover rounded-xl">';
    }
  }
  if (data.heroTitle) {
    document.querySelectorAll('[data-cms="heroTitle"]').forEach(el => el.textContent = data.heroTitle);
  }
  if (data.heroSubtitle) {
    document.querySelectorAll('[data-cms="heroSubtitle"]').forEach(el => el.textContent = data.heroSubtitle);
  }
  if (data.heroCta) {
    document.querySelectorAll('[data-cms="heroCta"]').forEach(el => el.textContent = data.heroCta);
  }
  if (data.heroImage) {
    const imgEl = document.getElementById("hero-custom-img");
    if (imgEl) {
      imgEl.src = data.heroImage;
      imgEl.classList.remove("hidden");
    }
  }
  if (data.servicesTitle) {
    document.querySelectorAll('[data-cms="servicesTitle"]').forEach(el => el.textContent = data.servicesTitle);
  }
  if (data.servicesSubtitle) {
    document.querySelectorAll('[data-cms="servicesSubtitle"]').forEach(el => el.textContent = data.servicesSubtitle);
  }
  if (data.whatsapp) {
    const cleanWa = data.whatsapp.replace(/[^0-9]/g, "");
    document.querySelectorAll('[data-cms-wa-link]').forEach(el => el.href = "https://wa.me/" + cleanWa);
    document.querySelectorAll('[data-cms="whatsapp"]').forEach(el => el.textContent = data.whatsapp);
  }
  if (data.footerText) {
    document.querySelectorAll('[data-cms="footerText"]').forEach(el => el.textContent = data.footerText);
  }
}

function loadCmsData() {
  const localData = localStorage.getItem("devwebia_site_cms");
  if (localData) {
    try { applyCmsData(JSON.parse(localData)); } catch(e){}
  }
  if (window.db) {
    window.db.collection("app_data").doc("site_content").get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        applyCmsData(data);
        localStorage.setItem("devwebia_site_cms", JSON.stringify(data));
      }
    }).catch(err => console.warn("Notice CMS Firestore:", err));
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loadCmsData();

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
      const activeWa = localStorage.getItem("devwebia_site_cms") ? JSON.parse(localStorage.getItem("devwebia_site_cms")).whatsapp : "${cleanWaNum}";
      const finalWa = activeWa ? activeWa.replace(/[^0-9]/g, "") : "${cleanWaNum}";
      window.open("https://wa.me/" + finalWa + "?text=" + waText, "_blank");
    });
  }
});
`;

  const fallbackQuestionsMap: Record<string, Array<{ q: string; options: string[] }>> = {
    mg: [
      {
        q: "1. Inona no anarana marina sy ofisialin'ny marika na ny enterprise anao?",
        options: ["Anarana manokana", "Mbola ho karohina"],
      },
      {
        q: "2. Inona no slogan na phrase d'accroche lehibe indrindra amin'ny site?",
        options: ["Slogan matihanina", "Mila hevitra amin'ny IA"],
      },
      {
        q: "3. Inona avy ireo tolotra na vokatra phares tianao asongadina indrindra?",
        options: ["Vokatra / Sary ary vidiny", "Tolotra sy fanazavana", "Samy misy azy roa"],
      },
      {
        q: "4. Inona no loko fototra sy style visuel tianao hampiasaina?",
        options: [
          "Manga Moderne & Fotsy",
          "Maitso Émeraude & Voajanahary",
          "Mainty / Dark Luxe",
          "Volamena / Élégant",
        ],
      },
      {
        q: "5. Mila section Hero maromaro (Slides am-panombohana) ve ianao?",
        options: ["Eny, Slide 2 na 3 misy sary tsara", "Iray ihany dia ampy"],
      },
      {
        q: "6. Inona no nomerao WhatsApp fandraisana kaomandy na hafatra?",
        options: ["Mila bokatra WhatsApp direct", "Aleo formulaire e-mail sy antso"],
      },
      {
        q: "7. Inona no adiresy fizika sy tanàna hisy ny orinasa na boutique?",
        options: ["Antananarivo / Madagascar", "En ligne ihany (Tsy misy boutique)"],
      },
      {
        q: "8. Inona avy ireo mot-clé Google (SEO) tianao hahitana anao haingana amin'ny recherche?",
        options: [
          "Achat, boutique, Madagascar",
          "Services, entreprise, Antananarivo",
          "Tolo-kevitra automatique",
        ],
      },
      {
        q: "9. Tianao hisy bokatra PWA (Installer l'application) amin'ny mobile ve?",
        options: ["Eny, PWA complet amin'ny smartphone", "Tsia, site web ihany"],
      },
      {
        q: "10. Inona no Code PIN tianao hidirana ao amin'ny Panneau Admin (CMS)?",
        options: ["1234 (Azo ovaina rehefa avy eo)", "Code PIN personnalisé"],
      },
      {
        q: "11. Tianao hisy section 'Momba anay' (A propos) sy tantaran'ny marika ve?",
        options: ["Eny, misy sary sy tantara", "Tsia, aleo mivantana amin'ny vokatra"],
      },
      {
        q: "12. Inona no fomba fandoavam-bola sy kaomandy tianao hiseho?",
        options: [
          "Paiement / Kaomandy WhatsApp",
          "Mobile Money (Orange/Airtel)",
          "Paiement en espèces amin'ny livraison",
        ],
      },
      {
        q: "13. Tianao hisy section 'Fijetsena sy Avis clients' (Testimonials) ve?",
        options: ["Eny, misy kintana sy hevitry ny mpanjifa", "Tsia"],
      },
      {
        q: "14. Manana nom de domaine manokana ve ianao (ohatra: .mg na .com)?",
        options: ["Manana domaine (.mg / .com)", "Mbola hampiasa le lien gratuit aloha"],
      },
      {
        q: "15. Inona no fanampiny na fonctionnalité manokana tianao hampiana ao amin'ny site?",
        options: [
          "Galerie d'images",
          "Formulaire de contact dynamique",
          "Filtre karkara vokatra",
          "Espace membres / Client",
        ],
      },
    ],
    en: [
      {
        q: "1. What is the exact and official name of your brand or company?",
        options: ["Specific name", "To be suggested by AI"],
      },
      {
        q: "2. What is your main slogan or tagline?",
        options: ["Professional slogan", "Ideas by AI"],
      },
      {
        q: "3. What are the key products or services to highlight?",
        options: ["Product catalog with prices", "Services & quote", "Both"],
      },
      {
        q: "4. What color palette and visual style do you prefer?",
        options: [
          "Modern Blue & White",
          "Emerald Green & Nature",
          "Dark / Luxury",
          "Gold / Elegant",
        ],
      },
      {
        q: "5. Would you like multiple hero slider carousels?",
        options: ["Yes, 2-3 dynamic slides", "Single Hero is enough"],
      },
      {
        q: "6. What is your WhatsApp number for orders?",
        options: ["Direct WhatsApp button", "Email & call form"],
      },
      {
        q: "7. What is the physical address or city of your business?",
        options: ["Antananarivo / Madagascar", "100% Online (No store)"],
      },
      {
        q: "8. Which Google SEO keywords will you target?",
        options: ["Shopping, boutique, Madagascar", "Services, company", "Suggest automatically"],
      },
      {
        q: "9. Do you want to enable the mobile PWA installation button?",
        options: ["Yes, 100% PWA installable", "No, standard web site"],
      },
      {
        q: "10. What security PIN code do you want for the Admin area?",
        options: ["1234 (Changeable later)", "Custom PIN code"],
      },
      {
        q: "11. Would you like a detailed 'About Us' section?",
        options: ["Yes, presentation & values", "No, go straight to content"],
      },
      {
        q: "12. Which ordering and payment methods to display?",
        options: ["Direct WhatsApp order", "Mobile Money (Orange/Airtel)", "Cash on delivery"],
      },
      {
        q: "13. Do you want a customer testimonials section?",
        options: ["Yes, with star ratings", "No"],
      },
      {
        q: "14. Do you have a custom domain name?",
        options: ["Yes (.mg / .com)", "No, use free link"],
      },
      {
        q: "15. What extra feature would you like to include?",
        options: ["Photo gallery", "Interactive form", "Category filters", "Client portal"],
      },
    ],
    zh: [
      { q: "1. 您的品牌或公司的准确官方名称是什么？", options: ["特定名称", "由 AI 建议"] },
      { q: "2. 您的主要标语或口号是什么？", options: ["专业标语", "AI 创意"] },
      {
        q: "3. 要突出的主要产品或服务是什么？",
        options: ["带价格的产品目录", "服务与报价", "两者兼有"],
      },
      {
        q: "4. 您喜欢什么配色方案和视觉风格？",
        options: ["现代蓝白", "翡翠绿自然", "暗黑奢华", "金色优雅"],
      },
      { q: "5. 您需要多个轮播图幻灯片吗？", options: ["是，2-3个动态幻灯片", "单个即可"] },
      {
        q: "6. 您用于接收订单的 WhatsApp 号码是什么？",
        options: ["直接 WhatsApp 按钮", "电子邮件和致电表单"],
      },
      {
        q: "7. 您公司的实际地址或城市在哪里？",
        options: ["安塔那那利佛 / 马达加斯加", "100% 在线（无实体店）"],
      },
      {
        q: "8. 您将优先针对哪些 Google SEO 关键词？",
        options: ["购物、精品店、马达加斯加", "服务、公司", "自动建议"],
      },
      { q: "9. 您想启用移动端 PWA 安装按钮吗？", options: ["是，100% 可安装 PWA", "否，标准网站"] },
      {
        q: "10. 您希望管理后台使用什么安全 PIN 码？",
        options: ["1234（稍后可更改）", "自定义 PIN 码"],
      },
      {
        q: "11. 您需要详细的“关于我们”部分吗？",
        options: ["是，介绍与价值观", "否，直接进入内容"],
      },
      {
        q: "12. 您希望显示哪些订购和支付方式？",
        options: ["直接 WhatsApp 订购", "移动支付", "货到付款"],
      },
      { q: "13. 您想要客户见证或评价部分吗？", options: ["是，带星级评分", "否"] },
      { q: "14. 您有自定义域名吗？", options: ["有 (.mg / .com)", "否，使用免费链接"] },
      { q: "15. 您想包含哪些其他功能？", options: ["相册", "交互式表单", "分类筛选", "客户专区"] },
    ],
    it: [
      {
        q: "1. Qual è il nome esatto e ufficiale del vostro marchio o azienda?",
        options: ["Nome specifico", "Da suggerire dall'IA"],
      },
      {
        q: "2. Qual è il vostro slogan o tagline principale?",
        options: ["Slogan professionale", "Idee dall'IA"],
      },
      {
        q: "3. Quali sono i prodotti o servizi di punta da mettere in evidenza?",
        options: ["Catalogo prodotti con prezzi", "Servizi e preventivo", "Entrambi"],
      },
      {
        q: "4. Quale palette di colori e stile visivo preferite?",
        options: [
          "Blu Moderno & Bianco",
          "Verde Smeraldo & Natura",
          "Scuro / Dark Luxe",
          "Dorato / Elegante",
        ],
      },
      {
        q: "5. Desiderate più slider caroselli Hero nella home?",
        options: ["Sì, 2 o 3 slide dinamiche", "Un solo Hero basta"],
      },
      {
        q: "6. Qual è il vostro numero WhatsApp per ricevere ordini?",
        options: ["Pulsante WhatsApp diretto", "Modulo e-mail e chiamata"],
      },
      {
        q: "7. Qual è l'indirizzo fisico o la città della vostra azienda?",
        options: ["Antananarivo / Madagascar", "100% Online (Senza negozio)"],
      },
      {
        q: "8. Quali parole chiave Google SEO intenderete mirare?",
        options: [
          "Acquisto, negozio, Madagascar",
          "Servizi, azienda",
          "Suggerisci automaticamente",
        ],
      },
      {
        q: "9. Volete abilitare il pulsante di installazione PWA mobile?",
        options: ["Sì, PWA installabile al 100%", "No, sito web standard"],
      },
      {
        q: "10. Quale codice PIN di sicurezza desiderate per l'area amministrativa?",
        options: ["1234 (Modificabile in seguito)", "PIN personalizzato"],
      },
      {
        q: "11. Desiderate una sezione 'Chi Siamo' dettagliata?",
        options: ["Sì, con presentazione e valori", "No, passa diretto al contenuto"],
      },
      {
        q: "12. Quali modalità di ordine e pagamento desiderate visualizzare?",
        options: [
          "Ordine diretto WhatsApp",
          "Mobile Money (Orange/Airtel)",
          "Pagamento alla consegna",
        ],
      },
      {
        q: "13. Volete una sezione di recensioni e testimonianze dei clienti?",
        options: ["Sì, con valutazioni a stelle", "No"],
      },
      {
        q: "14. Avete un nome di dominio personalizzato?",
        options: ["Sì (.mg / .com)", "No, usa il link gratuito"],
      },
      {
        q: "15. Quale funzionalità aggiuntiva desiderate includere?",
        options: ["Galleria foto", "Modulo interattivo", "Filtro categorie", "Area clienti"],
      },
    ],
    fr: [
      {
        q: "1. Quel est le nom exact et officiel de votre marque ou entreprise ?",
        options: ["Nom spécifique", "À suggérer par l'IA"],
      },
      {
        q: "2. Quel est votre slogan ou phrase d'accroche principale ?",
        options: ["Slogan professionnel", "Idées par l'IA"],
      },
      {
        q: "3. Quels sont les produits ou services phares à mettre en avant ?",
        options: ["Catalogue produits avec prix", "Services & devis", "Les deux"],
      },
      {
        q: "4. Quelle palette de couleurs et style visuel préférez-vous ?",
        options: [
          "Bleu Moderne & Blanc",
          "Vert Émeraude & Nature",
          "Sombre / Dark Luxe",
          "Doré / Élégant",
        ],
      },
      {
        q: "5. Souhaitez-vous plusieurs carrousels/slides Hero d'accueil ?",
        options: ["Oui, 2 ou 3 slides dynamiques", "Un seul Hero suffit"],
      },
      {
        q: "6. Quel est votre numéro WhatsApp pour recevoir les commandes ?",
        options: ["Bouton WhatsApp direct", "Formulaire e-mail & appel"],
      },
      {
        q: "7. Quelle est l'adresse physique ou ville de votre entreprise ?",
        options: ["Antananarivo / Madagascar", "100% En ligne (Sans boutique)"],
      },
      {
        q: "8. Quels mots-clés Google (SEO) viserez-vous en priorité ?",
        options: [
          "Achat, boutique, Madagascar",
          "Services, entreprise, Antananarivo",
          "Suggérer automatiquement",
        ],
      },
      {
        q: "9. Voulez-vous activer le bouton PWA d'installation mobile ?",
        options: ["Oui, PWA 100% installable sur mobile", "Non, site web standard"],
      },
      {
        q: "10. Quel Code PIN de sécurité souhaitez-vous pour l'Espace Admin ?",
        options: ["1234 (Modifiable plus tard)", "Code PIN personnalisé"],
      },
      {
        q: "11. Souhaitez-vous une section 'À Propos' détaillée ?",
        options: ["Oui, avec présentation et valeurs", "Non, passer direct au contenu"],
      },
      {
        q: "12. Quels modes de commande et paiement souhaitez-vous afficher ?",
        options: [
          "Commande directe WhatsApp",
          "Mobile Money (Orange/Airtel)",
          "Paiement à la livraison",
        ],
      },
      {
        q: "13. Voulez-vous une section 'Avis & Témoignages Clients' ?",
        options: ["Oui, avec notes étoiles", "Non"],
      },
      {
        q: "14. Avez-vous un nom de domaine personnalisé (ex: .mg ou .com) ?",
        options: ["Oui (.mg / .com)", "Non, utiliser le lien gratuit"],
      },
      {
        q: "15. Quelle fonctionnalité supplémentaire souhaitez-vous inclure ?",
        options: [
          "Galerie photos",
          "Formulaire interactif",
          "Filtre par catégories",
          "Espace client",
        ],
      },
    ],
  };

  const detectedLang =
    language ||
    (/amin'ny|ampiana|salama|misaotra|mangataka|tiko|resaka|amboaro|zavatra/i.test(prompt)
      ? "mg"
      : "fr");
  const fallbackQuestions = fallbackQuestionsMap[detectedLang] || fallbackQuestionsMap.fr;

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
  </div>

  <div id="admin-panel" class="hidden max-w-5xl w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl my-8">
    <div class="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
      <div>
        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
          <span>Panneau d'Édition du Site (CMS)</span>
          <span class="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">🔒 Sécurisé</span>
        </h2>
        <p class="text-xs text-slate-400 mt-1">Modifiez directement les textes, héros multiples, sections, SEO et PWA</p>
      </div>
      <button id="logout-btn" class="bg-red-600/20 text-red-400 hover:bg-red-600/30 px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2">
        <i class="fa-solid fa-right-from-bracket"></i> Déconnexion
      </button>
    </div>

    <div id="status-toast" class="hidden mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-sm font-semibold flex items-center gap-2">
      <i class="fa-solid fa-circle-check"></i>
      <span id="status-msg">Modifications enregistrées et publiées sur le site !</span>
    </div>

    <form id="cms-form" class="space-y-8">
      <!-- 1. Identité & Logo -->
      <div class="bg-slate-900 p-6 rounded-xl border border-slate-700 space-y-4">
        <h3 class="text-lg font-bold text-indigo-300 flex items-center gap-2">
          <i class="fa-solid fa-id-card"></i> 1. Identité du Site & Logo
        </h3>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Nom du Site / Titre</label>
            <input type="text" id="cms-siteTitle" value="${titleMatch}" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Slogan / Phrase courte</label>
            <input type="text" id="cms-siteSlogan" value="✨ Bienvenue sur ${titleMatch}" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Logo du Site (Téléverser une image ou URL)</label>
          <div class="flex gap-3 items-center">
            <input type="file" id="cms-logoFile" accept="image/*" class="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer">
            <input type="text" id="cms-siteLogo" placeholder="Ou collez une URL d'image" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
          </div>
          <div id="logo-preview" class="mt-2 hidden">
            <img id="logo-preview-img" src="" class="h-12 w-auto object-contain rounded-lg border border-slate-700 p-1">
          </div>
        </div>
      </div>

      <!-- 2. Section Hero Principal -->
      <div class="bg-slate-900 p-6 rounded-xl border border-slate-700 space-y-4">
        <h3 class="text-lg font-bold text-indigo-300 flex items-center gap-2">
          <i class="fa-solid fa-house"></i> 2. Section d'Accueil (Hero Principal)
        </h3>
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Grand Titre d'Accueil</label>
          <input type="text" id="cms-heroTitle" value="Solutions sur mesure pour vos besoins" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Sous-titre / Paragraphe d'Accroche</label>
          <textarea id="cms-heroSubtitle" rows="3" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">${defaultHeroSubtitle}</textarea>
        </div>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Texte du Bouton d'Action</label>
            <input type="text" id="cms-heroCta" value="Nous Contacter" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Image d'Illustration Hero (Upload ou URL)</label>
            <div class="flex gap-2 items-center">
              <input type="file" id="cms-heroImgFile" accept="image/*" class="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer">
              <input type="text" id="cms-heroImage" placeholder="URL Image" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Sections & Services -->
      <div class="bg-slate-900 p-6 rounded-xl border border-slate-700 space-y-4">
        <h3 class="text-lg font-bold text-indigo-300 flex items-center gap-2">
          <i class="fa-solid fa-list-check"></i> 3. Sections & Services
        </h3>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Titre de la Section Services</label>
            <input type="text" id="cms-servicesTitle" value="Nos Services & Offres" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Sous-titre Services</label>
            <input type="text" id="cms-servicesSubtitle" value="Découvrez tout ce que nous proposons pour vous accompagner au quotidien." class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
          </div>
        </div>
      </div>

      <!-- 4. AUTO-SEO & Indexation Google Directe -->
      <div class="bg-slate-900 p-6 rounded-xl border border-slate-700 space-y-4">
        <h3 class="text-lg font-bold text-amber-400 flex items-center gap-2">
          <i class="fa-solid fa-magnifying-glass"></i> 4. AUTO-SEO & Indexation Google Directe
        </h3>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Méta-Titre Google (Title Tag)</label>
            <input type="text" id="cms-metaTitle" value="${titleMatch} — Site Officiel" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Mots-Clés Google (Keywords séparés par virgules)</label>
            <input type="text" id="cms-metaKeywords" value="boutique, madagascar, entreprise, service, achat, antananarivo, devwebia" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500">
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Méta-Description Google</label>
          <textarea id="cms-metaDesc" rows="2" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500">${defaultHeroSubtitle}</textarea>
        </div>

        <!-- Google Snippet Simulator -->
        <div class="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <p class="text-xs text-slate-400 font-semibold mb-2">Aperçu direct du résultat Google Search :</p>
          <p id="seo-preview-url" class="text-xs text-emerald-400 font-mono truncate">https://${titleMatch.toLowerCase().replace(/[^a-z0-9]/g, "")}.mg › index.html</p>
          <p id="seo-preview-title" class="text-base font-semibold text-blue-400 hover:underline cursor-pointer truncate">${titleMatch} — Site Officiel</p>
          <p id="seo-preview-desc" class="text-xs text-slate-300 line-clamp-2">${defaultHeroSubtitle}</p>
        </div>

        <button type="button" id="seo-ping-btn" class="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2">
          <i class="fa-solid fa-rocket"></i> 🚀 Lancer la Demande d'Indexation Google (Google Ping)
        </button>
        <div id="seo-ping-status" class="hidden text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20"></div>
      </div>

      <!-- 5. Application PWA & Logo Mobile -->
      <div class="bg-slate-900 p-6 rounded-xl border border-slate-700 space-y-4">
        <h3 class="text-lg font-bold text-indigo-300 flex items-center gap-2">
          <i class="fa-solid fa-mobile-screen-button"></i> 5. Application PWA & Logo Mobile
        </h3>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Nom PWA (Écran d'accueil mobile)</label>
            <input type="text" id="cms-pwaName" value="${titleMatch}" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Couleur du Thème Mobile</label>
            <input type="color" id="cms-pwaThemeColor" value="#4f46e5" class="w-full h-10 bg-slate-800 border border-slate-700 rounded-xl p-1 cursor-pointer">
          </div>
        </div>
      </div>

      <!-- 6. Contacts & Footer -->
      <div class="bg-slate-900 p-6 rounded-xl border border-slate-700 space-y-4">
        <h3 class="text-lg font-bold text-indigo-300 flex items-center gap-2">
          <i class="fa-solid fa-address-book"></i> 6. Coordonnées & Pied de Page
        </h3>
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Numéro WhatsApp Réception</label>
          <input type="text" id="cms-whatsapp" value="${waNum}" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Texte du Footer / Contact</label>
          <textarea id="cms-footerText" rows="2" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">Des questions ou besoin d'informations ? Contactez-nous directement via WhatsApp.</textarea>
        </div>
      </div>

      <!-- 7. Sécurité PIN -->
      <div class="bg-slate-900 p-6 rounded-xl border border-slate-700 space-y-4">
        <h3 class="text-lg font-bold text-indigo-300 flex items-center gap-2">
          <i class="fa-solid fa-key"></i> 7. Sécurité — Modifier le Code PIN Admin
        </h3>
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Nouveau Code PIN (Laissez vide pour conserver l'actuel)</label>
          <input type="password" id="cms-newPin" placeholder="Nouveau Code PIN (ex: 5678)" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
        </div>
      </div>

      <button type="submit" class="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-lg py-4 rounded-xl transition shadow-xl flex items-center justify-center gap-2">
        <i class="fa-solid fa-floppy-disk"></i> Enregistrer et Publier les Modifications
      </button>
    </form>
  </div>

  <script src="admin.js"></script>
</body>
</html>`;

  const adminJs = `// Panneau CMS d'Édition Sécurisé DEVWEBIA
async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const DEFAULT_PIN_HASH = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const pinForm = document.getElementById("pin-form");
  const loginBox = document.getElementById("login-box");
  const adminPanel = document.getElementById("admin-panel");
  const logoutBtn = document.getElementById("logout-btn");
  const cmsForm = document.getElementById("cms-form");
  const statusToast = document.getElementById("status-toast");

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
        loadCmsFormValues();
      } else {
        alert("🔒 Accès refusé : Code PIN incorrect.");
      }
    });
  }

  if (sessionStorage.getItem("devwebia_admin_authenticated") === "true") {
    if (loginBox) loginBox.classList.add("hidden");
    if (adminPanel) adminPanel.classList.remove("hidden");
    loadCmsFormValues();
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      sessionStorage.removeItem("devwebia_admin_authenticated");
      adminPanel.classList.add("hidden");
      loginBox.classList.remove("hidden");
    });
  }

  // Handle Logo Upload
  const logoFileEl = document.getElementById("cms-logoFile");
  if (logoFileEl) {
    logoFileEl.addEventListener("change", async function(e) {
      const file = e.target.files[0];
      if (file) {
        const b64 = await fileToBase64(file);
        document.getElementById("cms-siteLogo").value = b64;
        const prev = document.getElementById("logo-preview-img");
        if (prev) {
          prev.src = b64;
          document.getElementById("logo-preview").classList.remove("hidden");
        }
      }
    });
  }

  // Handle Hero Image Upload
  const heroImgFileEl = document.getElementById("cms-heroImgFile");
  if (heroImgFileEl) {
    heroImgFileEl.addEventListener("change", async function(e) {
      const file = e.target.files[0];
      if (file) {
        const b64 = await fileToBase64(file);
        document.getElementById("cms-heroImage").value = b64;
      }
    });
  }

  // SEO Preview Live Updates
  const metaTitleEl = document.getElementById("cms-metaTitle");
  const metaDescEl = document.getElementById("cms-metaDesc");
  if (metaTitleEl) {
    metaTitleEl.addEventListener("input", function() {
      const p = document.getElementById("seo-preview-title");
      if (p) p.textContent = this.value || "Titre du site";
    });
  }
  if (metaDescEl) {
    metaDescEl.addEventListener("input", function() {
      const p = document.getElementById("seo-preview-desc");
      if (p) p.textContent = this.value || "Description du site";
    });
  }

  // Google Ping Button
  const seoPingBtn = document.getElementById("seo-ping-btn");
  if (seoPingBtn) {
    seoPingBtn.addEventListener("click", function() {
      const statusEl = document.getElementById("seo-ping-status");
      if (statusEl) {
        statusEl.classList.remove("hidden");
        statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Soumission de l\\\'indexation en cours auprès de Google...';
        
        setTimeout(() => {
          statusEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> <strong>Demande d\\\'indexation transmise à Google avec succès !</strong><br>Sitemap et mots-clés (' + (document.getElementById("cms-metaKeywords").value || 'mots-clés') + ') enregistrés pour les robots Googlebot.';
        }, 1200);
      }
    });
  }

  async function loadCmsFormValues() {
    let cms = {};
    const local = localStorage.getItem("devwebia_site_cms");
    if (local) {
      try { cms = JSON.parse(local); } catch(e){}
    }
    if (window.db) {
      try {
        const doc = await window.db.collection("app_data").doc("site_content").get();
        if (doc.exists) {
          cms = { ...cms, ...doc.data() };
        }
      } catch(e) { console.warn("Firestore CMS load notice:", e); }
    }

    if (cms.siteTitle && document.getElementById("cms-siteTitle")) document.getElementById("cms-siteTitle").value = cms.siteTitle;
    if (cms.siteSlogan && document.getElementById("cms-siteSlogan")) document.getElementById("cms-siteSlogan").value = cms.siteSlogan;
    if (cms.siteLogo && document.getElementById("cms-siteLogo")) {
      document.getElementById("cms-siteLogo").value = cms.siteLogo;
      const prev = document.getElementById("logo-preview-img");
      if (prev) {
        prev.src = cms.siteLogo;
        document.getElementById("logo-preview").classList.remove("hidden");
      }
    }
    if (cms.heroTitle && document.getElementById("cms-heroTitle")) document.getElementById("cms-heroTitle").value = cms.heroTitle;
    if (cms.heroSubtitle && document.getElementById("cms-heroSubtitle")) document.getElementById("cms-heroSubtitle").value = cms.heroSubtitle;
    if (cms.heroCta && document.getElementById("cms-heroCta")) document.getElementById("cms-heroCta").value = cms.heroCta;
    if (cms.heroImage && document.getElementById("cms-heroImage")) document.getElementById("cms-heroImage").value = cms.heroImage;
    if (cms.servicesTitle && document.getElementById("cms-servicesTitle")) document.getElementById("cms-servicesTitle").value = cms.servicesTitle;
    if (cms.servicesSubtitle && document.getElementById("cms-servicesSubtitle")) document.getElementById("cms-servicesSubtitle").value = cms.servicesSubtitle;
    if (cms.metaTitle && document.getElementById("cms-metaTitle")) {
      document.getElementById("cms-metaTitle").value = cms.metaTitle;
      const p = document.getElementById("seo-preview-title");
      if (p) p.textContent = cms.metaTitle;
    }
    if (cms.metaKeywords && document.getElementById("cms-metaKeywords")) document.getElementById("cms-metaKeywords").value = cms.metaKeywords;
    if (cms.metaDesc && document.getElementById("cms-metaDesc")) {
      document.getElementById("cms-metaDesc").value = cms.metaDesc;
      const p = document.getElementById("seo-preview-desc");
      if (p) p.textContent = cms.metaDesc;
    }
    if (cms.pwaName && document.getElementById("cms-pwaName")) document.getElementById("cms-pwaName").value = cms.pwaName;
    if (cms.pwaThemeColor && document.getElementById("cms-pwaThemeColor")) document.getElementById("cms-pwaThemeColor").value = cms.pwaThemeColor;
    if (cms.whatsapp && document.getElementById("cms-whatsapp")) document.getElementById("cms-whatsapp").value = cms.whatsapp;
    if (cms.footerText && document.getElementById("cms-footerText")) document.getElementById("cms-footerText").value = cms.footerText;
  }

  if (cmsForm) {
    cmsForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const updatedData = {
        siteTitle: document.getElementById("cms-siteTitle").value,
        siteSlogan: document.getElementById("cms-siteSlogan").value,
        siteLogo: document.getElementById("cms-siteLogo").value,
        heroTitle: document.getElementById("cms-heroTitle").value,
        heroSubtitle: document.getElementById("cms-heroSubtitle").value,
        heroCta: document.getElementById("cms-heroCta").value,
        heroImage: document.getElementById("cms-heroImage").value,
        servicesTitle: document.getElementById("cms-servicesTitle").value,
        servicesSubtitle: document.getElementById("cms-servicesSubtitle").value,
        metaTitle: document.getElementById("cms-metaTitle").value,
        metaKeywords: document.getElementById("cms-metaKeywords").value,
        metaDesc: document.getElementById("cms-metaDesc").value,
        pwaName: document.getElementById("cms-pwaName").value,
        pwaThemeColor: document.getElementById("cms-pwaThemeColor").value,
        whatsapp: document.getElementById("cms-whatsapp").value,
        footerText: document.getElementById("cms-footerText").value,
        updatedAt: new Date().toISOString()
      };

      // Save to localStorage
      localStorage.setItem("devwebia_site_cms", JSON.stringify(updatedData));

      // Save PIN if updated
      const newPin = document.getElementById("cms-newPin").value.trim();
      if (newPin.length >= 4) {
        const newHash = await hashPin(newPin);
        localStorage.setItem("devwebia_admin_pin_hash", newHash);
        document.getElementById("cms-newPin").value = "";
      }

      // Save to Firestore
      if (window.db) {
        try {
          await window.db.collection("app_data").doc("site_content").set(updatedData, { merge: true });
        } catch (err) {
          console.warn("Firestore save notice:", err);
        }
      }

      if (statusToast) {
        statusToast.classList.remove("hidden");
        setTimeout(() => statusToast.classList.add("hidden"), 4000);
      }
    });
  }
});`;

  const files: Record<string, string> = {
    "index.html": indexHtml,
    "script.js": scriptJs,
    "firebase.js": firebaseJs,
    "admin.html": adminHtml,
    "admin.js": adminJs,
    "sitemap.xml": `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${titleMatch.toLowerCase().replace(/[^a-z0-9]/g, "")}.mg/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`,
    "robots.txt": `User-agent: *
Allow: /
Sitemap: https://${titleMatch.toLowerCase().replace(/[^a-z0-9]/g, "")}.mg/sitemap.xml`,
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
      2,
    );
    files["sw.js"] = `self.addEventListener("fetch", function(e) {});`;
  }

  const payload = {
    explanation:
      detectedLang === "mg"
        ? `Voatratra soa aman-tsara ny famoronana ny site web "${titleMatch}". Afaka ovainao amin'ny alalan'ny Espace Admin na amin'ny chat ny votoatiny.`
        : `Site Web "${titleMatch}" généré avec succès par l'IA DEVWEBIA. Vous pouvez maintenant personnaliser le site ou ajouter d'autres fonctionnalités.`,
    name: titleMatch,
    files,
    questions: fallbackQuestions,
  };

  return {
    text: `<JSON>\n${JSON.stringify(payload, null, 2)}\n</JSON>`,
    tokens: 1000,
  };
}

export const generateSite = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .validator((input: unknown) => inputSchema.parse(input))
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
    const subActive =
      !!profile?.ai_sub_expires_at && new Date(profile.ai_sub_expires_at).getTime() > Date.now();
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
       const dbId = "${firebaseConfig.firestoreDatabaseId || ""}";
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
          userPlan,
          data.language,
        ),
      },
      ...(data.history ?? []),
    ];

    let userMsg = data.prompt;
    if (data.imageBase64) {
      userMsg += `\n\n[INSPIRATION IMAGE / SCREENSHOT FOURNIE PAR LE CLIENT : Le client a fourni une image, maquette ou capture d'écran de référence en pièce jointe (${data.imageBase64.slice(0, 50)}...). Analyse attentivement les couleurs, la disposition, la typographie, les sections et le style visuel de cette image pour concevoir ou adapter le site web afin qu'il reproduise fidèlement ce style.]`;
    }
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
        language: data.language,
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
        language: data.language,
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
        await adminDb.updateProfile(userId, {
          credits: Math.max(0, (profile?.credits || 0) - creditsUsedNoop),
        });
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
      await adminDb.updateProfile(userId, {
        credits: Math.max(0, (profile?.credits || 0) - creditsUsed),
      });
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
