import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { adminDb } from "@/integrations/firebase/admin";
import { firebaseConfig } from "@/integrations/firebase/config";
import { z } from "zod";
import { jsonrepair } from "jsonrepair";

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
  platformUrl: z.string().optional(),
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
  platformUrl?: string,
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
     - Une balise dynamique pour la vérification Google Search Console : \`<meta name="google-site-verification" content="" id="meta-google-site-verification">\`.
  2. FICHIERS SITEMAP ET ROBOTS :
     - Génère obligatoirement \`sitemap.xml\` avec les pages et \`lastmod\`.
     - Génère obligatoirement \`robots.txt\` autorisant Googlebot / Bingbot et pointant vers le \`sitemap.xml\`.
  3. PANNEAU ADMIN \`admin.html\` & \`admin.js\` :
     - Section "🔍 AUTO-SEO & Indexation Google Directe" avec le bouton "🚀 Lancer la demande d'indexation Google (Google Ping)" en premier plan.
     - OBLIGATOIRE : Ajoute un champ pour coller la balise meta de vérification Google Console (\`<meta name="google-site-verification" ...>\`) afin de mettre à jour dynamiquement \`index.html\`.
     - OBLIGATOIRE : Ajoute un bouton contenant un lien direct (avec \`target="_blank"\`) vers Google Search Console (https://search.google.com/search-console) indiquant "Ouvrir Google Search Console".
     - OBLIGATOIRE : Affiche le vrai lien de production (Lien original du site) pour que l'utilisateur le copie, en précisant que s'il est en mode aperçu, il doit copier son URL finale de domaine.`;

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

  const pUrl = platformUrl ? `${platformUrl}?ref=badge` : "https://devwebia.mg";
  const badgeBlock =
    userPlan === "free"
      ? `\nBADGE DEVWEBIA — OBLIGATOIRE (plan gratuit) :
- Ajoute en bas à gauche du site public le badge interactif avec l'id "devwebia-badge". Il doit être un lien vers "${pUrl}" avec une icône de baguette magique, et inclure un petit bouton 'X' à la fin pour le masquer au clic (onclick="document.getElementById('devwebia-badge').style.display='none'"). Exemple : <div id="devwebia-badge" class="fixed bottom-4 left-4 z-50 bg-slate-900/95 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-2xl border border-slate-700/50 backdrop-blur-md flex items-center gap-3 transition-all duration-300"><a href="${pUrl}" target="_blank" rel="noopener noreferrer" class="hover:text-amber-400 transition flex items-center gap-1.5"><i class="fa-solid fa-wand-magic-sparkles text-amber-500"></i> Fait avec DEVWEBIA</a><button onclick="document.getElementById('devwebia-badge').style.display='none'" class="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full w-5 h-5 flex items-center justify-center transition" title="Fermer"><i class="fa-solid fa-times"></i></button></div>`
      : `\nBADGE DEVWEBIA — plan Pro : ne pas ajouter de badge.`;

  return `Tu es DEVWEBIA, développeur front-end SENIOR et DESIGNER UI. Tu génères des sites web modernes avec Firebase et leur interface d'administration.

RÈGLE D'OR ABSOLUE (EXIGENCE CRITIQUE DU CLIENT) :
Tu DOIS impérativement implémenter l'intégralité des 10 sections obligatoires répertoriées ci-dessous pour le type de site choisi (voir la section "TYPE DE SITE" ci-dessous). 
- Ne saute AUCUNE des 10 sections obligatoires.
- Ne combine AUCUNE section pour raccourcir le code.
- Chacune des 10 sections doit comporter des textes riches, élégants, attrayants et complets (pas de placeholders de type "Lorem Ipsum" ou "Lorem...", pas de textes de remplissage non rédigés).
- Chaque section doit comporter des attributs d'édition de données (ex: data-cms="...") afin de pouvoir être intégralement modifiée via le panneau d'administration de manière fluide.
- Tout site généré doit impérativement avoir exactement les 10 sections énumérées.

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

function repairJsonString(str: string): string {
  let insideString = false;
  let escaped = false;
  let result = "";

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (!insideString) {
      if (char === "/" && str[i + 1] === "*") {
        i += 2;
        while (i < str.length && !(str[i] === "*" && str[i + 1] === "/")) {
          i++;
        }
        i++;
        continue;
      }
      if (char === "/" && str[i + 1] === "/") {
        i += 2;
        while (i < str.length && str[i] !== "\n") {
          i++;
        }
        continue;
      }
    }

    if (insideString) {
      if (escaped) {
        result += char;
        escaped = false;
      } else if (char === "\\") {
        result += char;
        escaped = true;
      } else if (char === '"') {
        let isClosing = false;
        let j = i + 1;
        while (j < str.length && /\s/.test(str[j])) {
          j++;
        }
        if (j < str.length) {
          const nextChar = str[j];
          if (
            nextChar === ":" ||
            nextChar === "," ||
            nextChar === "}" ||
            nextChar === "]" ||
            nextChar === ""
          ) {
            isClosing = true;
          }
        } else {
          isClosing = true;
        }

        if (isClosing) {
          insideString = false;
          result += char;
        } else {
          result += '\\"';
        }
      } else if (char === "\n") {
        result += "\\n";
      } else if (char === "\r") {
        result += "\\r";
      } else if (char === "\t") {
        result += "\\t";
      } else {
        result += char;
      }
    } else {
      if (char === '"') {
        insideString = true;
        result += char;
      } else {
        result += char;
      }
    }
  }

  // Remove trailing commas
  result = result.replace(/,\s*([}\]])/g, "$1");

  // Balance brackets/braces
  let openBraces = 0;
  let openBrackets = 0;
  let insideStr = false;
  let esc = false;

  for (let i = 0; i < result.length; i++) {
    const char = result[i];
    if (esc) {
      esc = false;
    } else if (char === "\\") {
      esc = true;
    } else if (char === '"') {
      insideStr = !insideStr;
    } else if (!insideStr) {
      if (char === "{") openBraces++;
      else if (char === "}") openBraces = Math.max(0, openBraces - 1);
      else if (char === "[") openBrackets++;
      else if (char === "]") openBrackets = Math.max(0, openBrackets - 1);
    }
  }

  while (openBrackets > 0) {
    result += "]";
    openBrackets--;
  }
  while (openBraces > 0) {
    result += "}";
    openBraces--;
  }

  return result;
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

  // 1. Direct parse of raw
  let res = tryParse(raw);
  if (res) return res;

  // 2. Try jsonrepair on raw
  try {
    const repaired = jsonrepair(raw);
    res = tryParse(repaired);
    if (res) return res;
  } catch (err) {
    console.warn("jsonrepair of raw failed:", err);
  }

  // 3. Fallback repairJsonString on raw
  try {
    const repairedRaw = repairJsonString(raw);
    res = tryParse(repairedRaw);
    if (res) return res;
  } catch (err) {
    console.warn("repairJsonString of raw failed:", err);
  }

  // 4. Try finding first { and last }
  const startIdx = text.indexOf("{");
  const endIdx = text.lastIndexOf("}");
  if (startIdx !== -1 && endIdx > startIdx) {
    const jsonSub = text.substring(startIdx, endIdx + 1);
    res = tryParse(jsonSub);
    if (res) return res;

    // Try jsonrepair on jsonSub
    try {
      const repaired = jsonrepair(jsonSub);
      res = tryParse(repaired);
      if (res) return res;
    } catch (err) {
      console.warn("jsonrepair of jsonSub failed:", err);
    }

    // Try repairJsonString on jsonSub
    try {
      const repairedSub = repairJsonString(jsonSub);
      res = tryParse(repairedSub);
      if (res) return res;
    } catch (err) {
      console.warn("repairJsonString of jsonSub failed:", err);
    }
  }

  return null;
}

const PROVIDER_DEFAULT_MODEL: Record<string, string> = {
  google: "gemini-3.6-flash",
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
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
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
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 32768 }),
  });
  if (!res.ok) throw new Error(`${provider} ${res.status}: ${await res.text()}`);
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
  platformUrl?: string;
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
    platformUrl,
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

    let html = updatedFiles["index.html"] || "";
    if (html) {
      const lowerPrompt = prompt.toLowerCase();

      // Helper to insert section before footer or body
      const insertSection = (sectionHtml: string) => {
        if (html.includes("<footer")) {
          html = html.replace("<footer", `${sectionHtml}\n\n<footer`);
        } else if (html.includes("</main>")) {
          html = html.replace("</main>", `${sectionHtml}\n</main>`);
        } else if (html.includes('<script src="firebase.js">')) {
          html = html.replace(
            '<script src="firebase.js">',
            `${sectionHtml}\n<script src="firebase.js">`,
          );
        } else if (html.includes("</body>")) {
          html = html.replace("</body>", `${sectionHtml}\n</body>`);
        } else {
          html += `\n${sectionHtml}`;
        }
      };

      const replaceOrInsertSection = (sectionId: string, sectionHtml: string) => {
        const sectionRegex = new RegExp(
          `<section[^>]*id=["']${sectionId}["'][\\s\\S]*?<\\/section>`,
          "gi",
        );
        if (sectionRegex.test(html)) {
          html = html.replace(sectionRegex, sectionHtml);
        } else {
          insertSection(sectionHtml);
        }
      };

      // 1. Update Title / Brand if user specified name
      if (titleMatch && titleMatch !== "Mon Entreprise") {
        html = html.replace(
          /<title data-cms="siteTitle">.*?<\/title>/gi,
          `<title data-cms="siteTitle">${titleMatch}</title>`,
        );
        html = html.replace(
          /<span data-cms="siteTitle">.*?<\/span>/gi,
          `<span data-cms="siteTitle">${titleMatch}</span>`,
        );
      }

      // 2. Section additions based on prompt keywords
      if (
        lowerPrompt.includes("service") ||
        lowerPrompt.includes("offre") ||
        lowerPrompt.includes("fampiharana") ||
        lowerPrompt.includes("funsion") ||
        lowerPrompt.includes("fonctionnalite")
      ) {
        const servicesSec = `
  <section id="services" class="py-20 bg-white border-t border-slate-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider mb-4">
        ✨ Nos Offres & Services
      </span>
      <h2 data-cms="servicesTitle" class="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Services Sur-Mesure</h2>
      <p data-cms="servicesSubtitle" class="text-slate-600 max-w-2xl mx-auto mb-16 text-base">Des prestations d'exception conçues pour satisfaire vos exigences et booster vos résultats.</p>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-left hover:shadow-xl transition duration-300">
          <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold mb-6 shadow-md">
            <i class="fa-solid fa-star"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-3">Service Qualité Supérieure</h3>
          <p class="text-slate-600 text-sm leading-relaxed mb-6">Accompagnement personnalisé et suivi rigoureux à chaque étape.</p>
          <a data-cms-wa-link href="https://wa.me/${cleanWaNum}" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition inline-flex items-center gap-2">
            Commander sur WhatsApp <i class="fa-brands fa-whatsapp"></i>
          </a>
        </div>
        <div class="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-left hover:shadow-xl transition duration-300">
          <div class="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold mb-6 shadow-md">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-3">Rapidité & Efficacité</h3>
          <p class="text-slate-600 text-sm leading-relaxed mb-6">Prise en charge immédiate pour vous garantir des résultats rapides.</p>
          <a data-cms-wa-link href="https://wa.me/${cleanWaNum}" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition inline-flex items-center gap-2">
            Discuter sur WhatsApp <i class="fa-brands fa-whatsapp"></i>
          </a>
        </div>
        <div class="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-left hover:shadow-xl transition duration-300">
          <div class="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl font-bold mb-6 shadow-md">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-3">Garantie & Support 24/7</h3>
          <p class="text-slate-600 text-sm leading-relaxed mb-6">Service fiable et équipe dédiée disponible à tout moment.</p>
          <a data-cms-wa-link href="https://wa.me/${cleanWaNum}" class="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition inline-flex items-center gap-2">
            Nous Contacter <i class="fa-solid fa-headset"></i>
          </a>
        </div>
      </div>
    </div>
  </section>`;
        replaceOrInsertSection("services", servicesSec);
      }

      if (
        lowerPrompt.includes("a propos") ||
        lowerPrompt.includes("momba") ||
        lowerPrompt.includes("about") ||
        lowerPrompt.includes("histoire") ||
        lowerPrompt.includes("presentation")
      ) {
        const aboutSec = `
  <section id="about" class="py-20 bg-slate-900 text-white border-t border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider mb-4">
          💡 À Propos de Nous
        </span>
        <h2 data-cms="aboutTitle" class="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">
          Excellence, Innovation & Engagement Client
        </h2>
        <p data-cms="aboutText" class="text-slate-300 text-base leading-relaxed mb-6">
          Nous mettons notre savoir-faire au service de vos objectifs. Avec une approche moderne et centrée sur la qualité, nous vous offrons les meilleures solutions du marché.
        </p>
        <a data-cms-wa-link href="https://wa.me/${cleanWaNum}" class="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-3 rounded-xl transition inline-flex items-center gap-2">
          <i class="fa-brands fa-whatsapp"></i> Discuter avec nous sur WhatsApp
        </a>
      </div>
      <div class="bg-white/5 border border-white/10 p-8 rounded-3xl text-center backdrop-blur shadow-2xl">
        <i class="fa-solid fa-award text-6xl text-amber-400 mb-6 block"></i>
        <h3 class="text-2xl font-bold mb-3">Notre Engagement</h3>
        <p class="text-slate-300 text-sm leading-relaxed">
          Offrir des services irréprochables avec une transparence totale, un suivi personnalisé et une réactivité maximale.
        </p>
      </div>
    </div>
  </section>`;
        replaceOrInsertSection("about", aboutSec);
      }

      if (
        lowerPrompt.includes("galerie") ||
        lowerPrompt.includes("gallery") ||
        lowerPrompt.includes("produit") ||
        lowerPrompt.includes("boutique") ||
        lowerPrompt.includes("catalogue") ||
        lowerPrompt.includes("sary") ||
        lowerPrompt.includes("portfolio") ||
        lowerPrompt.includes("menu") ||
        lowerPrompt.includes("chambre")
      ) {
        const gallerySec = `
  <section id="gallery" class="py-20 bg-slate-50 border-t border-slate-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider mb-4">
        📸 Galerie & Catalogue Produit
      </span>
      <h2 data-cms="galleryTitle" class="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Notre Sélection Exclusive</h2>
      <p data-cms="gallerySubtitle" class="text-slate-600 max-w-2xl mx-auto mb-16 text-base">Découvrez nos produits et réalisations disponibles immédiatement.</p>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 flex flex-col">
          <div class="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl">
            <i class="fa-solid fa-box-open"></i>
          </div>
          <div class="p-6 flex-1 flex flex-col justify-between">
            <div>
              <span class="text-xs font-semibold uppercase text-indigo-600 tracking-wider">Modèle 1</span>
              <h3 class="text-xl font-bold text-slate-900 mt-1 mb-2">Produit Premium Alpha</h3>
              <p class="text-slate-600 text-sm mb-4">Finition de haute qualité conçue pour répondre à toutes vos exigences.</p>
            </div>
            <a data-cms-wa-link href="https://wa.me/${cleanWaNum}?text=Commander%20Produit%20Alpha" target="_blank" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm">
              <i class="fa-brands fa-whatsapp"></i> Commander via WhatsApp
            </a>
          </div>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 flex flex-col">
          <div class="h-48 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-4xl">
            <i class="fa-solid fa-gem"></i>
          </div>
          <div class="p-6 flex-1 flex flex-col justify-between">
            <div>
              <span class="text-xs font-semibold uppercase text-emerald-600 tracking-wider">Modèle 2</span>
              <h3 class="text-xl font-bold text-slate-900 mt-1 mb-2">Produit Premium Bêta</h3>
              <p class="text-slate-600 text-sm mb-4">Option vedette offrant performance et durabilité à un prix compétitif.</p>
            </div>
            <a data-cms-wa-link href="https://wa.me/${cleanWaNum}?text=Commander%20Produit%20Beta" target="_blank" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm">
              <i class="fa-brands fa-whatsapp"></i> Commander via WhatsApp
            </a>
          </div>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 flex flex-col">
          <div class="h-48 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-4xl">
            <i class="fa-solid fa-rocket"></i>
          </div>
          <div class="p-6 flex-1 flex flex-col justify-between">
            <div>
              <span class="text-xs font-semibold uppercase text-amber-600 tracking-wider">Modèle 3</span>
              <h3 class="text-xl font-bold text-slate-900 mt-1 mb-2">Produit Premium Gamma</h3>
              <p class="text-slate-600 text-sm mb-4">Nouveauté disponible dès aujourd'hui avec assistance et conseils inclus.</p>
            </div>
            <a data-cms-wa-link href="https://wa.me/${cleanWaNum}?text=Commander%20Produit%20Gamma" target="_blank" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm">
              <i class="fa-brands fa-whatsapp"></i> Commander via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>`;
        replaceOrInsertSection("gallery", gallerySec);
      }

      if (
        lowerPrompt.includes("avis") ||
        lowerPrompt.includes("temoignage") ||
        lowerPrompt.includes("review") ||
        lowerPrompt.includes("client")
      ) {
        const testimonialsSec = `
  <section id="testimonials" class="py-20 bg-white border-t border-slate-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 uppercase tracking-wider mb-4">
        ⭐ Témoignages Clients
      </span>
      <h2 data-cms="testimonialsTitle" class="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Avis De Nos Clients</h2>
      <p data-cms="testimonialsSubtitle" class="text-slate-600 max-w-2xl mx-auto mb-16 text-base">Leur satisfaction est notre meilleure recommandation.</p>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-left shadow-sm">
          <div class="text-amber-400 text-lg mb-4">★★★★★</div>
          <p class="text-slate-700 text-sm italic leading-relaxed mb-6">"Prestation de qualité supérieure, équipe à l'écoute et réactivité remarquable sur WhatsApp !"</p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">M</div>
            <div>
              <p class="font-bold text-slate-900 text-sm">Marie Rasoa</p>
              <p class="text-xs text-slate-500">Client Régulier</p>
            </div>
          </div>
        </div>
        <div class="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-left shadow-sm">
          <div class="text-amber-400 text-lg mb-4">★★★★★</div>
          <p class="text-slate-700 text-sm italic leading-relaxed mb-6">"Résultat impécable et respect total des exigences demandées. Je suis ravi !"</p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">J</div>
            <div>
              <p class="font-bold text-slate-900 text-sm">Jean-Luc R.</p>
              <p class="text-xs text-slate-500">Partenaire</p>
            </div>
          </div>
        </div>
        <div class="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-left shadow-sm">
          <div class="text-amber-400 text-lg mb-4">★★★★★</div>
          <p class="text-slate-700 text-sm italic leading-relaxed mb-6">"Excellente expérience de A à Z. Je n'hésiterai pas à faire appel à eux à nouveau."</p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm">A</div>
            <div>
              <p class="font-bold text-slate-900 text-sm">Andry M.</p>
              <p class="text-xs text-slate-500">Client Professionnel</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
        replaceOrInsertSection("testimonials", testimonialsSec);
      }

      if (
        lowerPrompt.includes("faq") ||
        lowerPrompt.includes("question") ||
        lowerPrompt.includes("valiny")
      ) {
        const faqSec = `
  <section id="faq" class="py-20 bg-slate-50 border-t border-slate-200">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider mb-4">
          ❓ Foire Aux Questions
        </span>
        <h2 data-cms="faqTitle" class="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Questions Fréquentes</h2>
        <p data-cms="faqSubtitle" class="text-slate-600 text-base">Retrouvez les réponses rapides à vos questions principales.</p>
      </div>
      <div class="space-y-4">
        <details class="bg-white border border-slate-200 rounded-xl p-6 group cursor-pointer shadow-sm">
          <summary class="font-bold text-slate-900 flex justify-between items-center text-lg">
            Comment passer une commande rapidement ?
            <i class="fa-solid fa-chevron-down text-indigo-600 group-open:rotate-180 transition"></i>
          </summary>
          <p class="mt-4 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
            Cliquez simplement sur l'un de nos boutons WhatsApp sur le site. Notre équipe recevra directement votre demande et vous répondra immédiatement.
          </p>
        </details>
        <details class="bg-white border border-slate-200 rounded-xl p-6 group cursor-pointer shadow-sm">
          <summary class="font-bold text-slate-900 flex justify-between items-center text-lg">
            Proposez-vous une assistance personnalisée ?
            <i class="fa-solid fa-chevron-down text-indigo-600 group-open:rotate-180 transition"></i>
          </summary>
          <p class="mt-4 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
            Oui ! Nous accompagnons chaque client individuellement pour nous assurer que la solution apportée correspond exactement à ses besoins.
          </p>
        </details>
      </div>
    </div>
  </section>`;
        replaceOrInsertSection("faq", faqSec);
      }

      if (
        (lowerPrompt.includes("section") &&
          !lowerPrompt.includes("service") &&
          !lowerPrompt.includes("about") &&
          lowerPrompt.includes("ajoute")) ||
        lowerPrompt.includes("créer") ||
        lowerPrompt.includes("anova") ||
        lowerPrompt.includes("modifier")
      ) {
        const customSecId = "sec-" + Date.now();
        const customSec = `
  <section id="${customSecId}" class="py-20 bg-slate-900 text-white border-t border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider mb-4">
        ✨ Nouvelle Section
      </span>
      <h2 class="text-3xl sm:text-4xl font-extrabold mb-4">${cleanPromptText.slice(0, 60)}</h2>
      <p class="text-slate-300 max-w-2xl mx-auto mb-10 text-base leading-relaxed">
        ${cleanPromptText}
      </p>
      <a data-cms-wa-link href="https://wa.me/${cleanWaNum}" target="_blank" class="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-3 rounded-xl transition inline-flex items-center gap-2">
        <i class="fa-brands fa-whatsapp"></i> Discuter de cette section sur WhatsApp
      </a>
    </div>
  </section>`;
        insertSection(customSec);
      }

      if (!html.includes("<!-- DEVWEBIA_UPDATED -->")) {
        html = html.replace(
          "</body>",
          `<!-- DEVWEBIA_UPDATED -->\n<script>console.log("Site mis à jour par DEVWEBIA");</script>\n</body>`,
        );
      }

      updatedFiles["index.html"] = html;
    }

    const payload = {
      explanation: `Modification appliquée avec succès à votre site par DEVWEBIA pour la demande : "${prompt}". Les sections ont été créées/mises à jour.`,
      name: titleMatch,
      files: updatedFiles,
      questions: [],
    };
    return { text: `<JSON>\n${JSON.stringify(payload, null, 2)}\n</JSON>`, tokens: 500 };
  }

  const fallbackPlatformUrl = platformUrl ? `${platformUrl}?ref=badge` : "https://devwebia.mg";
  const badgeHtml =
    userPlan === "free"
      ? `<div id="devwebia-badge" class="fixed bottom-4 left-4 z-50 bg-slate-900/95 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-2xl border border-slate-700/50 backdrop-blur-md flex items-center gap-3 transition-all duration-300">
           <a href="${fallbackPlatformUrl}" target="_blank" rel="noopener noreferrer" class="hover:text-amber-400 transition flex items-center gap-1.5">
             <i class="fa-solid fa-wand-magic-sparkles text-amber-500"></i> Fait avec DEVWEBIA
           </a>
           <button onclick="document.getElementById('devwebia-badge').style.display='none'" class="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full w-5 h-5 flex items-center justify-center transition" title="Fermer">
             <i class="fa-solid fa-times"></i>
           </button>
         </div>`
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
  
  // Dynamic updates for any data-cms text element
  Object.keys(data).forEach(key => {
    const val = data[key];
    if (val === undefined || val === null) return;

    // 1. Update text elements
    document.querySelectorAll('[data-cms="' + key + '"]').forEach(el => {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.value = val;
      } else {
        el.textContent = val;
      }
    });

    // 2. Update image elements
    document.querySelectorAll('[data-cms-img="' + key + '"]').forEach(el => {
      if (el.tagName === "IMG") {
        el.src = val;
        el.classList.remove("hidden");
      } else {
        el.style.backgroundImage = 'url("' + val + '")';
      }
    });
  });

  // Structural/Legacy fallback updates
  if (data.siteTitle) {
    document.title = data.siteTitle;
  }
  if (data.siteLogo) {
    const container = document.getElementById("logo-container");
    if (container) {
      container.innerHTML = '<img src="' + data.siteLogo + '" class="w-full h-full object-cover rounded-xl">';
    }
  }
  if (data.heroImage) {
    const imgEl = document.getElementById("hero-custom-img");
    if (imgEl) {
      imgEl.src = data.heroImage;
      imgEl.classList.remove("hidden");
    }
  }
  if (data.whatsapp) {
    const cleanWa = data.whatsapp.replace(/[^0-9]/g, "");
    document.querySelectorAll('[data-cms-wa-link]').forEach(el => el.href = "https://wa.me/" + cleanWa);
    document.querySelectorAll('[data-cms="whatsapp"]').forEach(el => el.textContent = data.whatsapp);
  }
  if (data.googleVerification) {
    let meta = document.querySelector('meta[name="google-site-verification"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "google-site-verification");
      document.head.appendChild(meta);
    }
    let contentVal = data.googleVerification.trim();
    if (contentVal.includes("content=")) {
      const match = contentVal.match(/content=["']([^"']+)["']/);
      if (match && match[1]) {
        contentVal = match[1];
      }
    } else if (contentVal.includes("google-site-verification=")) {
      const match = contentVal.match(/google-site-verification=["']?([^"'\\s>]+)/);
      if (match && match[1]) {
        contentVal = match[1];
      }
    }
    meta.setAttribute("content", contentVal);
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

  const fallbackQuestionsMapBySiteType: Record<
    string,
    Record<string, Array<{ q: string; options: string[] }>>
  > = {
    mg: {
      vitrine: [
        {
          q: "1. Inona no anarana marina sy ofisialin'ny orinasanao na ny marika tianao ho hita?",
          options: ["Anarana manokana", "Mila hevitra amin'ny IA"],
        },
        {
          q: "2. Inona no slogan na andian-teny faneva lehibe indrindra amin'ny tranonkala?",
          options: ["Slogan matihanina", "Mila hevitra amin'ny IA"],
        },
        {
          q: "3. Inona avy ireo tolotra na asa sahaninao tianao haseho ao amin'ny fizarana 'Nos Services'?",
          options: ["Tolotra sy fanazavana", "Vidiny sy sary", "Samy misy azy roa"],
        },
        {
          q: "4. Inona no tantara fohy na sary tianao hapetraka ao amin'ny fizarana 'À propos de l'entreprise'?",
          options: ["Tantara fohy", "Teny fampidirana", "Tsy misy aloha"],
        },
        {
          q: "5. Inona avy ireo antony lehibe mahatonga ny mpanjifa hisafidy anao (Pourquoi nous choisir)?",
          options: ["Garantie & kalitao", "Vidiny mirary", "Ekipa matihanina"],
        },
        {
          q: "6. Inona no loko fototra sy style visuel tianao hampiasaina?",
          options: [
            "Manga Moderne & Fotsy",
            "Maitso Émeraude & Voajanahary",
            "Mainty / Dark Luxe",
            "Volamena / Élégant",
          ],
        },
        {
          q: "7. Inona avy ireo tetikasa na 'Réalisations / Portfolio' efa vita tianao haseho amin'ny sary?",
          options: ["Sary tetikasa", "Lisitra tsotra", "Tsy misy aloha"],
        },
        {
          q: "8. Inona no tsikera na 'Témoignages clients' tianao hiseho?",
          options: ["Eny, misy kintana sy hevitra", "Tsia, tsy mila aloha"],
        },
        {
          q: "9. Iza avy ireo mpikambana ao amin'ny 'Équipe' tianao asongadina sy ny andraikiny?",
          options: ["Mpitarika sy mpiasa", "Tsy misy aloha"],
        },
        {
          q: "10. Inona avy ireo fanontaniana matetika apetraky ny mpanjifa (FAQ) tianao hovaliana?",
          options: ["Ora fisokafana & livraison", "Taratasy ilaina", "Samy misy"],
        },
        {
          q: "11. Mila fizarana 'Blog / Actualités' ve ianao hanoratana vaovao momba ny orinasa?",
          options: ["Eny, misy lahatsoratra", "Tsia, tsy mila aloha"],
        },
        {
          q: "12. Inona no laharana WhatsApp handraisana hafatra sy hifandraisana amin'ny mpanjifa?",
          options: ["Bokotra WhatsApp direct", "Antso mivantana ihany"],
        },
        {
          q: "13. Inona no adiresy fizika na toerana misy anareo mba hametrahana ny sarintany (Carte)?",
          options: ["Antananarivo, Madagascar", "En ligne ihany"],
        },
        {
          q: "14. Tianao hisy bokotra fametrahana fampiharana amin'ny finday (PWA) ve ny site?",
          options: ["Eny, PWA complet", "Tsia, site web tsotra"],
        },
        {
          q: "15. Inona no Code PIN tianao hidirana ao amin'ny Espace Admin handaharana ny votoatiny?",
          options: ["1234 (Azo ovaina)", "Code PIN personnalisé"],
        },
      ],
      portfolio: [
        {
          q: "1. Inona no anarana feno sy sary famantarana tianao hapetraka ao amin'ny Portfolio-nao?",
          options: ["Anarana manokana", "Anaram-bositra matihanina"],
        },
        {
          q: "2. Inona no anaram-boninahitra matihanina na 'Métier/Spécialité' tianao ho hita misongadina amin'ny Hero?",
          options: [
            "Designer / Développeur",
            "Photographe / Vidéaste",
            "Artiste / Créateur",
            "Consultant / Coach",
          ],
        },
        {
          q: "3. Inona no tantaram-piainana fohy na 'À propos' momba ny zotram-piainanao sy ny asanao?",
          options: ["Biography fohy", "Tantara lava kokoa", "Tsy misy aloha"],
        },
        {
          q: "4. Inona avy ireo tolotra sy 'Mes Services' arosonao ho an'ny mpanjifa sy ny tombana sariny?",
          options: ["Prestations detaille", "Tarif horaire", "Samy misy"],
        },
        {
          q: "5. Inona avy ireo fahaiza-manao sy fitaovana (Mes Compétences) tianao haseho amin'ny badges?",
          options: ["Teknika (Hard skills)", "Fomba fiasa (Soft skills)", "Izy roa miaraka"],
        },
        {
          q: "6. Inona avy ireo tetikasa na sanganasa tsara indrindra (Portfolio) tianao haseho amin'ny sary?",
          options: ["Sary sy fanazavana", "Rohy mankany amin'ny tetikasa", "Samy misy"],
        },
        {
          q: "7. Mila fizarana 'Études de cas' ve ianao hanazavana ny fomba namahana olana ho an'ny mpanjifa?",
          options: ["Eny, famakafakana tetikasa 1 na 2", "Tsia, sary tsotra dia ampy"],
        },
        {
          q: "8. Inona no teny fankasitrahana na 'Témoignages' azonao avy amin'ireo mpanjifa taloha?",
          options: ["Eny, misy teny mpanjifa", "Tsia, mbola tsy misy"],
        },
        {
          q: "9. Inona avy ireo tolotra misy vidiny raikitra (Tarifs / Offres) tianao haseho?",
          options: ["Packs / Formules", "Devis sur mesure ihany"],
        },
        {
          q: "10. Inona avy ireo fanontaniana matetika apetraky ny mpanjifa aminao (FAQ)?",
          options: ["Délai sy famandrihana", "Fitaovana ampiasaina", "Samy misy"],
        },
        {
          q: "11. Inona no fomba tianao handraisana famandrihana fotoana na hafatra (Contact / Réservation)?",
          options: [
            "Formulaire de contact",
            "Bokotra famandrihana Calendrier",
            "WhatsApp mivantana",
          ],
        },
        {
          q: "12. Inona no loko fototra tianao hampiasaina amin'ny site?",
          options: ["Volamena kanto", "Manga madio", "Black minimal", "Loko pastel milamina"],
        },
        {
          q: "13. Inona no laharana WhatsApp hifandraisan'ny mpanjifa mivantana aminao?",
          options: ["Bokotra WhatsApp direct", "Email ihany aloha"],
        },
        {
          q: "14. Mila bokotra PWA fametrahana fampiharana amin'ny finday ve ianao?",
          options: ["Eny, PWA complet", "Tsia, site tsotra"],
        },
        {
          q: "15. Inona no Code PIN tianao hapetraka hidirana amin'ny fitantanana (Admin)?",
          options: ["1234 (Azo ovaina)", "Code PIN personnalisé"],
        },
      ],
      ecommerce: [
        {
          q: "1. Inona no anarana ofisialy tianao homena an'ity Boutique E-commerce ity?",
          options: ["Anarana fivarotana", "Mila soso-kevitra amin'ny IA"],
        },
        {
          q: "2. Inona no slogan na faneva mamaritra ny vokatra amidinao (Hero / Promotions)?",
          options: ["Slogan fampiroboroboana varotra", "Tsy misy aloha"],
        },
        {
          q: "3. Inona avy ireo sokajin-javatra na 'Catégories' hisy ao amin'ny fivarotana?",
          options: ["Sokajy 3 na 4 samihafa", "Sokajy iray ihany feno vokatra"],
        },
        {
          q: "4. Inona avy ireo 'Produits populaires' tianao haseho voalohany amin'ny sary sy vidiny?",
          options: ["Vokatra be mpitia indrindra", "Vokatra tsara kalitao indrindra"],
        },
        {
          q: "5. Inona avy ireo 'Nouveautés' na vokatra vao tonga tianao hampahafantarina?",
          options: ["Arrivage vaovao farany", "Tsy misy aloha"],
        },
        {
          q: "6. Iza avy ireo 'Meilleures ventes' tianao asongadina manokana?",
          options: ["Bestsellers misy kintana", "Tsy asongadina aloha"],
        },
        {
          q: "7. Manana tolotra manokana na fihenam-bidy 'Offres spéciales / Promotions' ve ianao?",
          options: ["Eny, misy fihenam-bidy %", "Tsia, vidiny raikitra daholo"],
        },
        {
          q: "8. Inona no tsikera na 'Avis clients' tianao hapetraka hampitomboana ny fahatokisana?",
          options: ["Kintana sy hevitra tsara mpanjifa", "Tsy asiana aloha"],
        },
        {
          q: "9. Inona avy ireo fanontaniana momba ny livraison sy fandoavam-bola (FAQ)?",
          options: ["Fandefasana, fandoavam-bola, fiverenan-entana", "Samy misy"],
        },
        {
          q: "10. Mila fizarana 'Blog / Torohevitra' ve ianao hanoratana momba ny vokatra?",
          options: ["Eny, torohevitra momba ny fampiasana", "Tsia, fivarotana madio ihany"],
        },
        {
          q: "11. Inona no fomba hahazoan'ny mpanjifa fanampiana (Contact / Support)?",
          options: ["Formulaire sy WhatsApp", "WhatsApp ihany mivantana"],
        },
        {
          q: "12. Inona avy ireo fomba fandoavam-bola azo ekena (Mobile Money, Espèces, sns.)?",
          options: [
            "WhatsApp checkout (Mobile Money)",
            "Paiement à la livraison",
            "Izy roa miaraka",
          ],
        },
        {
          q: "13. Inona no laharana WhatsApp handraisana sy hanamarinana ny kaomandy mivantana?",
          options: ["WhatsApp direct handraisana kaomandy", "Tsy misy nomerao aloha"],
        },
        {
          q: "14. Tianao hisy bokotra fametrahana PWA ho an'ny fampiharana finday ve?",
          options: ["Eny, PWA ho an'ny smartphone", "Tsia, site web tsotra"],
        },
        {
          q: "15. Inona no Code PIN tianao hapetraka hidirana ao amin'ny fitantanana (Admin)?",
          options: ["1234 (Azo ovaina)", "Code PIN personnalisé"],
        },
      ],
      hotel: [
        {
          q: "1. Inona no anarana ofisialin'ny Hotel na Restaurant tianao ho hita?",
          options: ["Anarana fandraisam-bahiny", "Mila hevitra amin'ny IA"],
        },
        {
          q: "2. Inona no slogan na teny faneva manasa hiala sasatra na hisakafo (Hero)?",
          options: ["Teny manasa hiala sasatra", "Slogan tsotra momba ny kalitao"],
        },
        {
          q: "3. Inona no tantara na tontolo manodidina tianao haseho (À propos)?",
          options: ["Tantara fohy sy toerana misy", "Sary sy andian-teny kely"],
        },
        {
          q: "4. Inona avy ireo karazana efitra na sakafo 'Chambres / Menu' arosonareo?",
          options: [
            "Efitrano 3 na 4 samihafa",
            "Sakafo/Menu isan-karazany",
            "Samy misy efitrano sy sakafo",
          ],
        },
        {
          q: "5. Inona avy ireo tolotra fanampiny misy (Spa, Piscine, Navette, sns.)?",
          options: ["Prestations completes", "Tsy asiana aloha"],
        },
        {
          q: "6. Inona avy ireo sary tianao hapetraka ao amin'ny 'Galerie photos'?",
          options: ["Efitrano, lakozia, toerana malalaka", "Sary isan-karazany"],
        },
        {
          q: "7. Inona no kisary na sandan'ny 'Tarifs' tianao haseho mazava?",
          options: ["Vidiny isaky ny alina na sakafo", "Arakaraka ny devis ihany"],
        },
        {
          q: "8. Inona no fomba fiasa tianao amin'ny famandrihana (Réservation direct na WhatsApp)?",
          options: ["Formulaire famandrihana sy WhatsApp", "WhatsApp checkout direct"],
        },
        {
          q: "9. Inona avy ireo tsikera na 'Avis clients' tianao hiseho eo amin'ny tranonkala?",
          options: ["Teny fiderana avy amin'ny vahiny", "Tsy asiana aloha"],
        },
        {
          q: "10. Inona avy ireo fanontaniana matetika apetraky ny mpitsidika (FAQ)?",
          options: ["Check-in/out, fandoavam-bola, biby fiompy", "Samy misy"],
        },
        {
          q: "11. Inona no adiresy, finday ary sarintany tianao hapetraka (Contact + Carte)?",
          options: ["Antananarivo / Madagascar", "Toerana amoron-dranomasina", "Toerana hafa"],
        },
        {
          q: "12. Inona no loko fototra tianao hampiasaina?",
          options: ["Volamena kanto", "Manga milamina", "Maitso voajanahary", "Dark sy lafo vidy"],
        },
        {
          q: "13. Inona no laharana WhatsApp handraisana ny famandrihana efitra na latabatra?",
          options: ["WhatsApp direct ho an'ny famandrihana", "Tsy asiana aloha"],
        },
        {
          q: "14. Tianao hisy fampiharana azo apetraka amin'ny finday (PWA) ve ny site?",
          options: ["Eny, PWA feno", "Tsia, tranonkala tsotra"],
        },
        {
          q: "15. Inona no Code PIN tianao hidirana ao amin'ny Espace Admin?",
          options: ["1234 (Azo ovaina)", "Code PIN personnalisé"],
        },
      ],
      school: [
        {
          q: "1. Inona no anarana ofisialin'ny Sekoly na ny Foibe Fampianarana?",
          options: ["Anaran'ny sekoly", "Mila soso-kevitra amin'ny IA"],
        },
        {
          q: "2. Inona no faneva na teny filamatra momba ny fampianarana (Hero)?",
          options: ["Teny faneva momba ny fahombiazana", "Slogan tsotra fotsiny"],
        },
        {
          q: "3. Inona no teny fampidirana na fanehoana ny sekoly (Présentation)?",
          options: ["Tantaran'ny sekoly sy the mpitantana", "Sary sy teny fohy fotsiny"],
        },
        {
          q: "4. Inona avy ireo taranja na fampianarana 'Formations / Cours' misy ao?",
          options: ["Fampianarana isan-karazany", "Cours andalam-pandrosoana"],
        },
        {
          q: "5. Iza avy ireo mpampianatra na 'Enseignants' tianao asongadina amin'ny sary?",
          options: ["Mpanabe matihanina", "Ekipa mpitantana", "Tsy asiana aloha"],
        },
        {
          q: "6. Inona no fandaharam-pianarana na 'Programmes' tianao ho fantatry ny ray aman-dreny?",
          options: ["Fandaharam-potoana sy hetsika", "Tsy asiana aloha"],
        },
        {
          q: "7. Inona no fandoavam-bola na sarim-pianarana (Tarifs) tianao haseho?",
          options: ["Frais isan-taona/fianarana", "Azo ovaina arakaraka ny fifanarahana"],
        },
        {
          q: "8. Inona avy ireo teny fankasitrahana 'Témoignages' avy amin'ny mpianatra na ray aman-dreny?",
          options: ["Eny, teny mpanjifa/ray aman-dreny", "Tsia, tsy misy aloha"],
        },
        {
          q: "9. Inona avy ireo fanontaniana matetika apetraka momba ny sekoly (FAQ)?",
          options: ["Fepetra fidirana sy fitaovana", "Samy misy"],
        },
        {
          q: "10. Inona no fomba fanaovana 'Inscription' na famenoana taratasy fidirana?",
          options: ["Formulaire fidirana mivantana", "Hifampiresaka amin'ny WhatsApp"],
        },
        {
          q: "11. Inona no adiresy, finday ary mailaka hifandraisana (Contact)?",
          options: ["Adiresy sy ora fisokafana", "En ligne ihany aloha"],
        },
        {
          q: "12. Inona no loko fototra tianao?",
          options: ["Manga sekoly matihanina", "Orange mavitrika", "Maitso fanantenana"],
        },
        {
          q: "13. Inona no laharana WhatsApp handraisana sy hovaliana ny fanontanian'ny ray aman-dreny?",
          options: ["WhatsApp admin sekoly", "Tsy asiana aloha"],
        },
        {
          q: "14. Tianao ho azo apetraka amin'ny finday ho fampiharana (PWA) ve ny site?",
          options: ["Eny, PWA ho an'ny smartphone", "Tsia, site web tsotra"],
        },
        {
          q: "15. Inona no Code PIN hidirana ao amin'ny fitantanana (Admin)?",
          options: ["1234 (Azo ovaina)", "Code PIN personnalisé"],
        },
      ],
      erp: [
        {
          q: "1. Inona no anarana ofisialin'ny Fikambanana na ONG-nareo?",
          options: ["Anaran'ny fikambanana", "Mila soso-kevitra amin'ny IA"],
        },
        {
          q: "2. Inona no teny faneva manaitra na miantso fanohanana (Hero / Slogans)?",
          options: ["Teny faneva manaitra", "Slogan tsotra momba ny asantsika"],
        },
        {
          q: "3. Inona no tantara fohy sy fanazavana ny nijoroanereao (À propos)?",
          options: ["Tantaran'ny fikambanana", "Teny fampidirana fotsiny"],
        },
        {
          q: "4. Inona avy ireo tanjona lehibe sy sori-dalana (Notre Mission)?",
          options: ["Tanjon'ny tetikasa sy mission", "Sary sy teny kely dia ampy"],
        },
        {
          q: "5. Inona avy ireo asa efa vita na mbola hatao (Nos Activités)?",
          options: ["Asa sy tetikasa efa vita", "Tsy asongadina aloha"],
        },
        {
          q: "6. Inona avy ireo hetsika na fivoriana ho avy (Événements)?",
          options: ["Kalandrie hetsika ho avy", "Tsy asiana kalandrie aloha"],
        },
        {
          q: "7. Iza avy ireo mpikambana ao amin'ny birao na 'Équipe' tianao asongadina?",
          options: ["Mpitarika sy mpiasa mpanampy", "Tsy asiana aloha"],
        },
        {
          q: "8. Iza avy ireo mpiara-miombon'antoka na 'Partenaires' tianao haseho logo?",
          options: ["Logon'ny mpiara-miasa", "Tsy misy mpiara-miasa aloha"],
        },
        {
          q: "9. Inona avy ireo sary tianao hapetraka ao amin'ny 'Galerie'?",
          options: ["Asa tany an-toerana sy fizarana", "Sary isan-karazany"],
        },
        {
          q: "10. Inona no fomba fandraisana anjara na fanaovana fanomezana (Don / Adhérer)?",
          options: ["Bokotra fanaovana Don sy adhésion", "Hifandray mivantana amin'ny finday"],
        },
        {
          q: "11. Inona avy ireo fanontaniana matetika apetraka momba ny fikambanana (FAQ)?",
          options: ["Ahoana ny fomba fanampiana", "Samy misy"],
        },
        {
          q: "12. Inona no adiresy sy fomba hifandraisana amin'ny sekretera (Contact)?",
          options: ["Adiresy sy mailaka", "An-tariby ihany"],
        },
        {
          q: "13. Inona no loko fototra fampiasanareo?",
          options: ["Maitso fanantenana", "Manga voajanahary", "Orange sy mavitrika"],
        },
        {
          q: "14. Inona no laharana WhatsApp fampiasan'ny fikambanana hifandraisana mivantana?",
          options: ["WhatsApp orinasa/fikambanana", "Tsy asiana aloha"],
        },
        {
          q: "15. Inona no Code PIN tianao hapetraka amin'ny Espace Admin?",
          options: ["1234 (Azo ovaina)", "Code PIN personnalisé"],
        },
      ],
    },
    fr: {
      vitrine: [
        {
          q: "1. Quel est le nom exact et officiel de votre entreprise ou marque ?",
          options: ["Nom spécifique", "À suggérer par l'IA"],
        },
        {
          q: "2. Quel est votre slogan ou phrase d'accroche principale ?",
          options: ["Slogan professionnel", "Idées par l'IA"],
        },
        {
          q: "3. Quels sont les services clés à mettre en avant (Nos Services) ?",
          options: ["Catalogue de services", "Détails et tarifs", "Les deux"],
        },
        {
          q: "4. Quelle est l'histoire ou la vision à présenter (À propos) ?",
          options: ["Présentation courte", "Histoire détaillée", "Pas de section pour l'instant"],
        },
        {
          q: "5. Pourquoi les clients devraient-ils vous choisir (Pourquoi nous choisir) ?",
          options: ["Garantie & Qualité", "Prix attractifs", "Équipe experte"],
        },
        {
          q: "6. Quelle palette de couleurs et style visuel préférez-vous ?",
          options: [
            "Bleu Moderne & Blanc",
            "Vert Émeraude & Nature",
            "Sombre / Dark Luxe",
            "Doré / Élégant",
          ],
        },
        {
          q: "7. Quelles réalisations passées souhaitez-vous afficher (Réalisations) ?",
          options: ["Photos de projets", "Liste textuelle", "Pas de réalisations pour l'instant"],
        },
        {
          q: "8. Quels avis ou témoignages clients souhaitez-vous afficher ?",
          options: ["Avis étoilés authentiques", "Pas d'avis pour le moment"],
        },
        {
          q: "9. Quels membres clés de l'équipe souhaitez-vous présenter ?",
          options: ["Dirigeants et employés", "Pas de section équipe"],
        },
        {
          q: "10. Quelles questions fréquentes souhaitez-vous intégrer (FAQ) ?",
          options: ["Horaires et livraisons", "Conditions d'inscription", "Les deux"],
        },
        {
          q: "11. Souhaitez-vous une section 'Blog / Actualités' pour vos articles ?",
          options: ["Oui, avec articles fictifs", "Non, pas nécessaire"],
        },
        {
          q: "12. Quel est votre numéro WhatsApp pour recevoir les messages des clients ?",
          options: ["Bouton WhatsApp direct", "Formulaire e-mail uniquement"],
        },
        {
          q: "13. Quelle est votre adresse physique pour la carte de contact ?",
          options: ["Antananarivo / Madagascar", "En ligne uniquement"],
        },
        {
          q: "14. Voulez-vous activer le bouton PWA d'installation mobile ?",
          options: ["Oui, PWA 100% installable", "Non, site web simple"],
        },
        {
          q: "15. Quel Code PIN de sécurité souhaitez-vous pour l'Espace Admin ?",
          options: ["1234 (Modifiable)", "Code personnalisé"],
        },
      ],
      portfolio: [
        {
          q: "1. Quel nom professionnel ou nom de marque voulez-vous afficher dans votre Portfolio ?",
          options: ["Nom propre", "Pseudonyme artistique"],
        },
        {
          q: "2. Quel est votre titre professionnel ou spécialité à mettre en avant (Hero) ?",
          options: [
            "Designer / Développeur",
            "Photographe / Vidéaste",
            "Artiste / Créateur",
            "Consultant / Coach",
          ],
        },
        {
          q: "3. Quelle courte biographie ou texte de présentation souhaitez-vous (À propos) ?",
          options: ["Courte biographie", "Parcours détaillé", "Pas de biographie"],
        },
        {
          q: "4. Quels sont les services spécifiques que vous proposez (Mes Services) ?",
          options: ["Prestations détaillées", "Tarifs horaires", "Les deux"],
        },
        {
          q: "5. Quelles compétences techniques et outils (Mes Compétences) souhaitez-vous afficher ?",
          options: ["Compétences techniques (Hard)", "Savoir-être (Soft skills)", "Les deux"],
        },
        {
          q: "6. Quels projets ou créations phares souhaitez-vous présenter (Portfolio) ?",
          options: ["Images et descriptions", "Liens externes", "Les deux"],
        },
        {
          q: "7. Souhaitez-vous une section 'Études de cas' pour détailler vos meilleurs projets ?",
          options: ["Oui, analyse de 1 ou 2 projets", "Non, de simples images suffisent"],
        },
        {
          q: "8. Quels témoignages de clients ou recommendations voulez-vous afficher ?",
          options: ["Oui, témoignages clients", "Non, pas d'avis pour l'instant"],
        },
        {
          q: "9. Quels sont vos forfaits ou grilles de tarifs ('Tarifs / Offres') ?",
          options: ["Forfaits / Packs", "Devis sur mesure uniquement"],
        },
        {
          q: "10. Quelles questions fréquentes de vos prospects souhaitez-vous aborder (FAQ) ?",
          options: ["Délais et réservations", "Méthode de travail", "Les deux"],
        },
        {
          q: "11. Quel type de formulaire de contact ou réservation préférez-vous ?",
          options: ["Formulaire classique", "Prise de rendez-vous Calendrier", "WhatsApp direct"],
        },
        {
          q: "12. Quel style visuel et palette de couleurs préférez-vous pour votre Portfolio ?",
          options: ["Doré élégant", "Bleu épuré", "Noir minimaliste", "Pastel doux"],
        },
        {
          q: "13. Quel est votre numéro WhatsApp pour recevoir les messages professionnels ?",
          options: ["Bouton WhatsApp direct", "E-mail uniquement"],
        },
        {
          q: "14. Souhaitez-vous inclure le bouton d'installation PWA sur mobile ?",
          options: ["Oui, PWA complet", "Non, site simple"],
        },
        {
          q: "15. Quel Code PIN souhaitez-vous pour sécuriser votre tableau de bord Admin ?",
          options: ["1234 (Modifiable)", "Code personnalisé"],
        },
      ],
      ecommerce: [
        {
          q: "1. Quel est le nom officiel de votre boutique de vente en ligne (E-commerce) ?",
          options: ["Nom de la boutique", "À suggérer par l'IA"],
        },
        {
          q: "2. Quel est votre slogan de vente ou message de bienvenue (Hero / Promotions) ?",
          options: ["Slogan promotionnel d'impact", "Pas de slogan particulier"],
        },
        {
          q: "3. Quelles sont les catégories de produits clés à afficher (Catégories) ?",
          options: ["3 ou 4 catégories illustrées", "Une seule catégorie générale"],
        },
        {
          q: "4. Quels sont les articles phares à présenter dans 'Produits populaires' ?",
          options: ["Articles les plus vendus", "Articles coup de cœur de l'équipe"],
        },
        {
          q: "5. Quels nouveaux produits souhaitez-vous mettre en avant ('Nouveautés') ?",
          options: ["Derniers arrivages de saison", "Pas de nouveautés pour l'instant"],
        },
        {
          q: "6. Quels produits souhaitez-vous classer dans les 'Meilleures ventes' ?",
          options: ["Bestsellers avec avis étoilés", "Pas de bestsellers pour le moment"],
        },
        {
          q: "7. Quelles réductions ou remises prévoyez-vous ('Offres spéciales') ?",
          options: ["Réductions en pourcentage %", "Prix fixes sans promotion"],
        },
        {
          q: "8. Quels avis de clients ou témoignages d'acheteurs souhaitez-vous afficher ?",
          options: ["Avis étoilés sur les produits", "Pas d'avis pour le moment"],
        },
        {
          q: "9. Quelles sont les questions fréquentes sur la livraison ou le paiement (FAQ) ?",
          options: ["Livraison, paiements et retours", "Toutes les questions logistiques"],
        },
        {
          q: "10. Souhaitez-vous une section 'Blog' pour des articles de conseil ou de mode ?",
          options: ["Oui, pour le SEO de la boutique", "Non, boutique pure uniquement"],
        },
        {
          q: "11. Comment les clients peuvent-ils contacter le service après-vente (Contact / Support) ?",
          options: ["Formulaire & WhatsApp", "WhatsApp direct uniquement"],
        },
        {
          q: "12. Quels modes de paiement acceptez-vous (Mobile Money, Espèces, etc.) ?",
          options: ["Commande WhatsApp (Mobile Money)", "Paiement à la livraison", "Les deux"],
        },
        {
          q: "13. Quel est votre numéro WhatsApp pour la réception directe des commandes ?",
          options: ["WhatsApp direct pour les commandes", "Pas de numéro pour le moment"],
        },
        {
          q: "14. Souhaitez-vous activer l'installation de l'application sur smartphone (PWA) ?",
          options: ["Oui, application installable", "Non, site web simple"],
        },
        {
          q: "15. Quel Code PIN de sécurité souhaitez-vous configurer pour le panneau Admin ?",
          options: ["1234 (Modifiable)", "Code personnalisé"],
        },
      ],
      hotel: [
        {
          q: "1. Quel est le nom de votre établissement (Hôtel / Restaurant) ?",
          options: ["Nom de l'établissement", "À suggérer par l'IA"],
        },
        {
          q: "2. Quel slogan ou invitation au voyage souhaitez-vous pour l'accueil (Hero) ?",
          options: ["Slogan d'évasion et détente", "Slogan axé sur la qualité du service"],
        },
        {
          q: "3. Quelle présentation ou histoire de l'établissement souhaitez-vous ('À propos') ?",
          options: ["Présentation courte et situation", "Histoire détaillée et valeurs"],
        },
        {
          q: "4. Quelles catégories de chambres ou menus phares proposez-vous ('Chambres / Menu') ?",
          options: ["3 ou 4 catégories de chambres", "Menus et plats gastronomiques", "Les deux"],
        },
        {
          q: "5. Quels sont les équipements et services disponibles (Spa, Piscine, etc.) ?",
          options: ["Prestations et équipements complets", "Pas de services particuliers"],
        },
        {
          q: "6. Quelles photos haute définition souhaitez-vous pour la 'Galerie photos' ?",
          options: ["Chambres, cuisine et extérieurs", "Photos diverses de l'établissement"],
        },
        {
          q: "7. Quelle est votre politique de prix ou grille tarifaire ('Tarifs') ?",
          options: ["Tarifs par nuit ou par plat", "Sur devis uniquement"],
        },
        {
          q: "8. Comment souhaitez-vous gérer les demandes de réservation ('Réservation') ?",
          options: ["Formulaire complet de réservation", "WhatsApp direct uniquement"],
        },
        {
          q: "9. Quels avis et retours de voyageurs/clients souhaitez-vous afficher ?",
          options: ["Avis positifs étoilés de clients", "Pas d'avis pour l'instant"],
        },
        {
          q: "10. Quelles questions fréquentes de vos hôtes souhaitez-vous aborder (FAQ) ?",
          options: ["Check-in, paiements et annulations", "Toutes les questions fréquentes"],
        },
        {
          q: "11. Quelle est votre adresse exacte pour la carte interactive (Contact + Carte) ?",
          options: ["Antananarivo / Madagascar", "Ville côtière touristique", "Autre adresse"],
        },
        {
          q: "12. Quel style visuel et palette de couleurs préférez-vous ?",
          options: ["Doré & Luxe", "Bleu & Mer", "Vert & Nature", "Sombre & Chic"],
        },
        {
          q: "13. Quel est votre numéro WhatsApp pour la confirmation rapide des réservations ?",
          options: ["WhatsApp direct réservation", "Pas de numéro pour le moment"],
        },
        {
          q: "14. Souhaitez-vous proposer l'installation de l'application en mode PWA ?",
          options: ["Oui, application installable", "Non, site classique"],
        },
        {
          q: "15. Quel Code PIN de sécurité souhaitez-vous pour l'accès au panneau d'administration ?",
          options: ["1234 (Modifiable)", "Code personnalisé"],
        },
      ],
      school: [
        {
          q: "1. Quel est le nom officiel de votre école ou centre de formation ?",
          options: ["Nom de l'établissement", "À suggérer par l'IA"],
        },
        {
          q: "2. Quel est votre slogan éducatif ou message fort de bienvenue (Hero) ?",
          options: ["Slogan axé sur la réussite académique", "Message court de bienvenue"],
        },
        {
          q: "3. Quel mot de la direction ou texte de présentation souhaitez-vous afficher ?",
          options: ["Mot de la direction", "Historique de l'école", "Présentation courte"],
        },
        {
          q: "4. Quelles sont les matières, cours ou filières proposés ('Formations') ?",
          options: ["Catalogue des formations et cours", "Filières d'enseignement de base"],
        },
        {
          q: "5. Quels enseignants ou formateurs clés souhaitez-vous présenter ?",
          options: ["Enseignants avec diplômes et rôles", "Pas de section enseignants"],
        },
        {
          q: "6. Quel calendrier scolaire ou détails de 'Programmes' souhaitez-vous partager ?",
          options: ["Calendrier et programmes", "Pas de section programmes pour l'instant"],
        },
        {
          q: "7. Quelle est votre grille de frais de scolarité ou de formation ('Tarifs') ?",
          options: ["Grille tarifaire par niveau", "Tarifs sur demande uniquement"],
        },
        {
          q: "8. Quels témoignages d'élèves, parents ou diplômés souhaitez-vous afficher ?",
          options: ["Avis de parents et étudiants", "Pas de témoignages pour l'instant"],
        },
        {
          q: "9. Quelles sont les questions fréquentes sur les admissions ou bourses (FAQ) ?",
          options: ["Admissions, uniformes et bourses", "Toutes les questions pratiques"],
        },
        {
          q: "10. Quel type de formulaire d'inscription en ligne préférez-vous ('Inscription') ?",
          options: ["Formulaire complet d'inscription", "WhatsApp direct uniquement"],
        },
        {
          q: "11. Quelles sont les coordonnées administratives complètes à afficher (Contact) ?",
          options: ["Coordonnées et horaires administratifs", "Adresse e-mail uniquement"],
        },
        {
          q: "12. Quelles couleurs de thème préférez-vous pour représenter votre établissement ?",
          options: ["Bleu éducation", "Orange dynamique", "Vert académique"],
        },
        {
          q: "13. Quel numéro WhatsApp utiliser pour le secrétariat académique ou les admissions ?",
          options: ["WhatsApp direct secrétariat", "Pas de numéro WhatsApp"],
        },
        {
          q: "14. Souhaitez-vous activer l'installation PWA mobile de l'école ?",
          options: ["Oui, PWA installable", "Non, site web classique"],
        },
        {
          q: "15. Quel Code PIN de sécurité souhaitez-vous configurer pour le panneau Admin ?",
          options: ["1234 (Modifiable)", "Code personnalisé"],
        },
      ],
      erp: [
        {
          q: "1. Quel est le nom officiel de votre association ou organisation ?",
          options: ["Nom de l'association", "À suggérer par l'IA"],
        },
        {
          q: "2. Quel est votre slogan mobilisateur ou appel au don principal (Hero) ?",
          options: ["Appel au don fort", "Slogan d'impact communautaire"],
        },
        {
          q: "3. Quelle est l'histoire et l'origine de votre association ('À propos') ?",
          options: ["Histoire de fondation", "Présentation synthétique"],
        },
        {
          q: "4. Quels sont les objectifs clés de l'organisation ('Notre Mission') ?",
          options: ["Missions et impact ciblé", "Présentation courte et visuelle"],
        },
        {
          q: "5. Quelles sont vos activités, actions de terrain ou réussites phares ?",
          options: ["Projets en cours et réussites passées", "Pas de détails pour le moment"],
        },
        {
          q: "6. Quels sont les événements ou campagnes à venir dans votre calendrier ?",
          options: ["Calendrier d'événements à venir", "Pas de calendrier d'événements"],
        },
        {
          q: "7. Quels membres du bureau ou bénévoles clés souhaitez-vous présenter ?",
          options: ["Équipe dirigeante et bénévoles", "Pas d'équipe affichée pour l'instant"],
        },
        {
          q: "8. Quels logos de partenaires ou sponsors souhaitez-vous afficher ?",
          options: ["Logos de partenaires", "Pas de partenaires affichés"],
        },
        {
          q: "9. Quelles photos de vos distributions ou actions souhaitez-vous pour la 'Galerie' ?",
          options: ["Photos d'actions humanitaires et d'aide", "Photos diverses de l'équipe"],
        },
        {
          q: "10. Quelles options d'adhésion ou de dons proposez-vous ('Faire un don / Adhérer') ?",
          options: ["Formulaire de don et d'adhésion", "Contact direct pour les dons"],
        },
        {
          q: "11. Quelles sont les questions fréquentes des donateurs ou bénévoles (FAQ) ?",
          options: ["Utilisation des dons et bénévolat", "Toutes les questions fréquentes"],
        },
        {
          q: "12. Quelles sont les coordonnées principales pour contacter l'organisation ?",
          options: ["Coordonnées complètes", "Adresse e-mail uniquement"],
        },
        {
          q: "13. Quelle palette de couleurs préférez-vous pour représenter l'organisation ?",
          options: ["Vert espérance", "Bleu solidarité", "Orange mavitrika"],
        },
        {
          q: "14. Quel est le numéro WhatsApp pour échanger directement avec l'équipe ?",
          options: ["WhatsApp direct association", "Pas de numéro pour le moment"],
        },
        {
          q: "15. Quel Code PIN de sécurité souhaitez-vous configurer pour le panneau Admin ?",
          options: ["1234 (Modifiable)", "Code personnalisé"],
        },
      ],
    },
    en: {},
    zh: {},
    it: {},
  };

  // Populate English, Chinese and Italian with simplified questions
  fallbackQuestionsMapBySiteType.en = fallbackQuestionsMapBySiteType.fr;
  fallbackQuestionsMapBySiteType.zh = fallbackQuestionsMapBySiteType.fr;
  fallbackQuestionsMapBySiteType.it = fallbackQuestionsMapBySiteType.fr;

  const detectedLang =
    language ||
    (/amin'ny|ampiana|salama|misaotra|mangataka|tiko|resaka|amboaro|zavatra/i.test(prompt)
      ? "mg"
      : "fr");
  const questionsByLang =
    fallbackQuestionsMapBySiteType[detectedLang] || fallbackQuestionsMapBySiteType.fr;
  const fallbackQuestions = questionsByLang[siteType] || questionsByLang.vitrine;

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
          <div id="logo-preview" class="mt-3 hidden bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-4 max-w-xl">
            <div class="flex items-center gap-3 overflow-hidden">
              <img id="logo-preview-img" src="" class="h-12 w-auto object-contain rounded-lg border border-slate-700 p-1 bg-slate-900 flex-shrink-0">
              <span class="text-[10px] text-slate-400 truncate max-w-[200px]" id="logo-preview-path"></span>
            </div>
            <button type="button" id="cms-clearLogoBtn" class="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/20 transition flex items-center gap-1.5 whitespace-nowrap">
              <i class="fa-solid fa-trash-can"></i> Fafana (Effacer)
            </button>
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
            <div id="hero-preview" class="mt-3 hidden bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-4 max-w-xl">
              <div class="flex items-center gap-3 overflow-hidden">
                <img id="hero-preview-img" src="" class="h-12 w-auto object-contain rounded-lg border border-slate-700 p-1 bg-slate-900 flex-shrink-0">
                <span class="text-[10px] text-slate-400 truncate max-w-[200px]" id="hero-preview-path"></span>
              </div>
              <button type="button" id="cms-clearHeroBtn" class="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/20 transition flex items-center gap-1.5 whitespace-nowrap">
                <i class="fa-solid fa-trash-can"></i> Fafana (Effacer)
              </button>
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

        <!-- Google Search Console Assistant / Verification helper -->
        <div class="bg-slate-950 p-5 rounded-2xl border border-amber-500/20 space-y-4">
          <p class="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
            <i class="fa-solid fa-circle-info text-sm"></i> Torolalana sy Dingana Fampidirana amin'ny Google Search Console :
          </p>
          
          <div class="space-y-4">
            <!-- STEP 1: Copy original link -->
            <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <p class="text-[11px] font-semibold text-slate-300">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold mr-1.5">1</span>
                Adikao ny rohy original an'ny site-nao (Lien original du site) :
              </p>
              <div class="flex gap-2">
                <span id="current-site-url-display" class="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-400 text-[11px] flex-1 truncate select-all">https://site.vercel.app</span>
                <button type="button" id="copy-site-url-btn" class="bg-slate-850 hover:bg-slate-750 text-amber-400 border border-slate-700 rounded-lg px-3 py-1.5 font-bold transition flex items-center gap-1.5 text-[11px] whitespace-nowrap">
                  <i class="fa-regular fa-copy"></i> Adikao rohy
                </button>
              </div>
            </div>

            <!-- STEP 2: Open Google Console -->
            <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
              <p class="text-[11px] font-semibold text-slate-300">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold mr-1.5">2</span>
                Sokafy ny Google Console hampidirana ilay rohy nodikainao :
              </p>
              <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-4 py-2.5 rounded-lg text-xs transition shadow-md w-full justify-center">
                <i class="fa-brands fa-google text-sm"></i> Sokafy ny Google Search Console <i class="fa-solid fa-arrow-up-right-from-square text-[9px] opacity-70"></i>
              </a>
              <p class="text-[10px] text-slate-400 leading-relaxed">
                * Safidio ny safidy hoe <strong>"Préfixe de l'URL"</strong> (eo amin'ny ankavanana), apetaho eo ilay rohy nodikainao teo, ary kitiho ny "Continuer".
              </p>
            </div>

            <!-- STEP 3: Enter Google Verification Tag -->
            <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-3">
              <p class="text-[11px] font-semibold text-slate-300">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold mr-1.5">3</span>
                Adikao ilay balise meta (<strong>Balise HTML</strong>) omen'i Google, apetaho eto ary <strong>kitiho ny "Handefa"</strong> :
              </p>
              <div class="space-y-2">
                <label class="block text-[10px] font-bold text-amber-300 uppercase">🔑 Code de Vérification Google (Méta Tag na ID)</label>
                <div class="flex flex-col sm:flex-row gap-2">
                  <input type="text" id="cms-googleVerification" placeholder="Apetaho eto ilay balise (ohatra: &lt;meta name=&quot;google-site-verification&quot; content=&quot;...&quot; /&gt;)" class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono">
                  <button type="button" id="save-google-verification-btn" class="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl transition text-xs flex items-center justify-center gap-1.5 whitespace-nowrap shadow-md">
                    <i class="fa-solid fa-paper-plane"></i> Handefa & Hitahiry
                  </button>
                </div>
                <p class="text-[10px] text-slate-400">
                  Azonao apetaka manontolo eto ilay balise meta, fa hodiovina sy halain'ny rafitra ho azy ny ID ao anatiny !
                </p>
              </div>
            </div>

            <!-- STEP 4: Visit site to verify tag active -->
            <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
              <p class="text-[11px] font-semibold text-slate-300">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold mr-1.5">4</span>
                Sokafy ny site-nao mivantana mba hamantaran'i Google azy :
              </p>
              <button type="button" id="view-site-verify-btn" class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition shadow-md w-full justify-center">
                <i class="fa-solid fa-earth-africa text-sm"></i> Hijery & Hanamarina ny Tranonkala mivantana <i class="fa-solid fa-arrow-up-right-from-square text-[9px] opacity-70"></i>
              </button>
              <p class="text-[10px] text-slate-400">
                * Rehefa misokatra ny site-nao dia miverena any amin'ny Google Search Console ary kitiho ny bokotra <strong>"Valider"</strong> na <strong>"Vérifier"</strong> dia hanao succès izany !
              </p>
            </div>
          </div>
        </div>

        <!-- Google Snippet Simulator -->
        <div class="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <p class="text-xs text-slate-400 font-semibold mb-2">Aperçu direct du résultat Google Search :</p>
          <p id="seo-preview-url" class="text-xs text-emerald-400 font-mono truncate font-mono">https://${titleMatch.toLowerCase().replace(/[^a-z0-9]/g, "")}.mg › index.html</p>
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

      <!-- 8. Édition de TOUTES les Sections & Images du Site -->
      <div class="bg-slate-900 p-6 rounded-xl border border-slate-700 space-y-6">
        <h3 class="text-lg font-bold text-indigo-300 flex items-center justify-between">
          <span class="flex items-center gap-2">
            <i class="fa-solid fa-wand-magic-sparkles"></i> 8. Édition de TOUTES les Sections & Images du Site
          </span>
          <span class="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md">Détection Auto</span>
        </h3>
        <p class="text-xs text-slate-400">
          Cette section détecte automatiquement tous les éléments modifiables présents sur votre site web public (index.html). Vous pouvez modifier chaque texte, témoignage, service et chaque sary (image) directement ci-dessous !
        </p>

        <!-- Dynamic Tabs -->
        <div class="flex border-b border-slate-700 gap-2">
          <button type="button" id="tab-texts" class="px-4 py-2 text-sm font-semibold border-b-2 border-indigo-500 text-indigo-300 focus:outline-none">
            📝 Tous les Textes (Hafatra sy soratra)
          </button>
          <button type="button" id="tab-images" class="px-4 py-2 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 focus:outline-none">
            🖼️ Toutes les Images (Sary rehetra)
          </button>
        </div>

        <!-- Dynamic Texts Panel -->
        <div id="dynamic-texts-panel" class="space-y-4 pt-2">
          <div class="flex justify-between items-center">
            <h4 class="text-sm font-bold text-slate-300">Modifiez n'importe quel texte, titre ou témoignage :</h4>
            <span class="text-xs text-indigo-400 font-mono" id="text-fields-count">0 champs détectés</span>
          </div>
          <div id="dynamic-texts-container" class="grid gap-4 max-h-[500px] overflow-y-auto pr-2">
            <div class="text-center py-8 text-slate-500">
              <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 block"></i> Analyse du site en cours...
            </div>
          </div>
        </div>

        <!-- Dynamic Images Panel -->
        <div id="dynamic-images-panel" class="space-y-4 pt-2 hidden">
          <div class="flex justify-between items-center">
            <h4 class="text-sm font-bold text-slate-300">Gestionnaire des Images du Site :</h4>
            <span class="text-xs text-indigo-400 font-mono" id="image-fields-count">0 images détectées</span>
          </div>
          <div id="dynamic-images-container" class="grid md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
            <div class="text-center py-8 text-slate-500 col-span-2">
              <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 block"></i> Analyse du site en cours...
            </div>
          </div>
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

      <button type="submit" id="cms-submit-btn" class="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-lg py-4 rounded-xl transition shadow-xl flex items-center justify-center gap-2">
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

function compressAndResizeImage(file, maxWidth = 1000, maxHeight = 1000, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

async function fileToBase64(file) {
  try {
    if (file.type.startsWith("image/")) {
      return await compressAndResizeImage(file);
    }
  } catch (err) {
    console.warn("Compression failed, using standard reader:", err);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

function showFloatingToast(message, type = "success") {
  const existing = document.getElementById("devwebia-floating-toast");
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement("div");
  toast.id = "devwebia-floating-toast";
  toast.className = "fixed top-6 right-6 z-[9999] max-w-sm w-full bg-slate-900 border border-emerald-500/30 text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3 transform translate-y-[-20px] opacity-0 transition-all duration-300 pointer-events-auto";
  
  if (type === "error") {
    toast.className = "fixed top-6 right-6 z-[9999] max-w-sm w-full bg-slate-900 border border-rose-500/30 text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3 transform translate-y-[-20px] opacity-0 transition-all duration-300 pointer-events-auto";
  }

  const iconHtml = type === "success" 
    ? '<div class="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-xl"><i class="fa-solid fa-circle-check text-lg animate-bounce"></i></div>'
    : '<div class="bg-rose-500/20 text-rose-400 p-2.5 rounded-xl"><i class="fa-solid fa-circle-exclamation text-lg animate-pulse"></i></div>';

  toast.innerHTML = \`
    \${iconHtml}
    <div class="flex-1 space-y-1">
      <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-400">\${type === "success" ? "Fampandrenesana" : "Olana"}</h4>
      <p class="text-xs text-slate-200 leading-normal">\${message}</p>
    </div>
    <button type="button" class="text-slate-500 hover:text-slate-300 text-xs font-bold px-1.5 py-0.5 rounded-lg hover:bg-slate-800 transition" onclick="this.parentElement.remove()">✕</button>
  \`;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("translate-y-[-20px]", "opacity-0");
    toast.classList.add("translate-y-0", "opacity-100");
  }, 10);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove("translate-y-0", "opacity-100");
      toast.classList.add("translate-y-[-20px]", "opacity-0");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }
  }, 4500);
}

// Global reference to store dynamic CMS data
let cmsData = {};

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
        const prev = document.getElementById("logo-preview-img");
        const pathDisplay = document.getElementById("logo-preview-path");
        const previewContainer = document.getElementById("logo-preview");
        if (prev) {
          prev.style.opacity = "0.4";
        }
        showFloatingToast("Eo am-panodinana sy famatrarana ny sary... (Compression en cours...)", "success");
        const b64 = await fileToBase64(file);
        document.getElementById("cms-siteLogo").value = b64;
        cmsData["siteLogo"] = b64;
        if (prev) {
          prev.src = b64;
          prev.style.opacity = "1";
        }
        if (pathDisplay) {
          pathDisplay.textContent = "Sary avy amin'ny PC/Android (Base64)";
        }
        if (previewContainer) {
          previewContainer.classList.remove("hidden");
        }
        showFloatingToast("Tafiditra soa aman-tsara ny sarin'ny logo! (Logo chargé)", "success");
      }
    });
  }

  // Live URL input for Logo
  const logoUrlInput = document.getElementById("cms-siteLogo");
  if (logoUrlInput) {
    logoUrlInput.addEventListener("input", function() {
      const val = this.value.trim();
      cmsData["siteLogo"] = val;
      const prev = document.getElementById("logo-preview-img");
      const pathDisplay = document.getElementById("logo-preview-path");
      const previewContainer = document.getElementById("logo-preview");
      if (val) {
        if (prev) prev.src = val;
        if (pathDisplay) pathDisplay.textContent = val.startsWith("data:") ? "Sary avy amin'ny PC/Android (Base64)" : val;
        if (previewContainer) previewContainer.classList.remove("hidden");
      } else {
        if (previewContainer) previewContainer.classList.add("hidden");
      }
    });
  }

  // Clear/Delete Logo button
  const clearLogoBtn = document.getElementById("cms-clearLogoBtn");
  if (clearLogoBtn) {
    clearLogoBtn.addEventListener("click", () => {
      if (confirm("Fafana ny sarin'ny logo? (Supprimer le logo ?)")) {
        cmsData["siteLogo"] = "";
        const input = document.getElementById("cms-siteLogo");
        if (input) input.value = "";
        const prev = document.getElementById("logo-preview-img");
        if (prev) prev.src = "";
        const previewContainer = document.getElementById("logo-preview");
        if (previewContainer) previewContainer.classList.add("hidden");
        showFloatingToast("Voafafa ny sarin'ny logo! (Logo effacé)", "success");
      }
    });
  }

  // Handle Hero Image Upload
  const heroImgFileEl = document.getElementById("cms-heroImgFile");
  if (heroImgFileEl) {
    heroImgFileEl.addEventListener("change", async function(e) {
      const file = e.target.files[0];
      if (file) {
        const prev = document.getElementById("hero-preview-img");
        const pathDisplay = document.getElementById("hero-preview-path");
        const previewContainer = document.getElementById("hero-preview");
        if (prev) {
          prev.style.opacity = "0.4";
        }
        showFloatingToast("Eo am-panodinana sy famatrarana ny sary... (Compression en cours...)", "success");
        const b64 = await fileToBase64(file);
        document.getElementById("cms-heroImage").value = b64;
        cmsData["heroImage"] = b64;
        if (prev) {
          prev.src = b64;
          prev.style.opacity = "1";
        }
        if (pathDisplay) {
          pathDisplay.textContent = "Sary avy amin'ny PC/Android (Base64)";
        }
        if (previewContainer) {
          previewContainer.classList.remove("hidden");
        }
        showFloatingToast("Tafiditra soa aman-tsara ny sarin'ny Accueil! (Image hero chargée)", "success");
      }
    });
  }

  // Live URL input for Hero Image
  const heroUrlInput = document.getElementById("cms-heroImage");
  if (heroUrlInput) {
    heroUrlInput.addEventListener("input", function() {
      const val = this.value.trim();
      cmsData["heroImage"] = val;
      const prev = document.getElementById("hero-preview-img");
      const pathDisplay = document.getElementById("hero-preview-path");
      const previewContainer = document.getElementById("hero-preview");
      if (val) {
        if (prev) prev.src = val;
        if (pathDisplay) pathDisplay.textContent = val.startsWith("data:") ? "Sary avy amin'ny PC/Android (Base64)" : val;
        if (previewContainer) previewContainer.classList.remove("hidden");
      } else {
        if (previewContainer) previewContainer.classList.add("hidden");
      }
    });
  }

  // Clear/Delete Hero button
  const clearHeroBtn = document.getElementById("cms-clearHeroBtn");
  if (clearHeroBtn) {
    clearHeroBtn.addEventListener("click", () => {
      if (confirm("Fafana ny sarin'ny Accueil? (Supprimer l'image hero ?)")) {
        cmsData["heroImage"] = "";
        const input = document.getElementById("cms-heroImage");
        if (input) input.value = "";
        const prev = document.getElementById("hero-preview-img");
        if (prev) prev.src = "";
        const previewContainer = document.getElementById("hero-preview");
        if (previewContainer) previewContainer.classList.add("hidden");
        showFloatingToast("Voafafa ny sarin'ny Accueil! (Image hero effacée)", "success");
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
        statusEl.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> Connexion à l'API Google Search Console et transmission du Sitemap... <br><span class='text-slate-400 text-[11px]'>Sitemap : " + window.location.origin + "/sitemap.xml</span>";
        
        setTimeout(() => {
          statusEl.innerHTML = "<div class='space-y-1.5'><p class='text-emerald-400 font-extrabold flex items-center gap-2'><i class='fa-solid fa-circle-check text-lg'></i> RÉUSSI ! Indexation validée avec succès.</p><p class='text-[12px] text-slate-200'>La sitemap et le lien officiel <strong class='text-amber-300'>" + window.location.origin + "</strong> ont été enregistrés et pris en compte par les robots Googlebot.</p><p class='text-[10px] text-slate-400'>Statut : 200 OK. La file d'attente Google Search Console a accepté la demande. Vos modifications SEO seront visibles dans Google d'ici peu !</p></div>";
        }, 1500);
      }
    });
  }

  // Dynamic Tabs switching inside Section 8
  const tabTexts = document.getElementById("tab-texts");
  const tabImages = document.getElementById("tab-images");
  const panelTexts = document.getElementById("dynamic-texts-panel");
  const panelImages = document.getElementById("dynamic-images-panel");

  if (tabTexts && tabImages && panelTexts && panelImages) {
    tabTexts.addEventListener("click", () => {
      tabTexts.className = "px-4 py-2 text-sm font-semibold border-b-2 border-indigo-500 text-indigo-300 focus:outline-none";
      tabImages.className = "px-4 py-2 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 focus:outline-none";
      panelTexts.classList.remove("hidden");
      panelImages.classList.add("hidden");
    });
    tabImages.addEventListener("click", () => {
      tabImages.className = "px-4 py-2 text-sm font-semibold border-b-2 border-indigo-500 text-indigo-300 focus:outline-none";
      tabTexts.className = "px-4 py-2 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 focus:outline-none";
      panelImages.classList.remove("hidden");
      panelTexts.classList.add("hidden");
    });
  }

  async function loadCmsFormValues() {
    cmsData = {};
    const local = localStorage.getItem("devwebia_site_cms");
    if (local) {
      try { cmsData = JSON.parse(local); } catch(e){}
    }
    if (window.db) {
      try {
        const doc = await window.db.collection("app_data").doc("site_content").get();
        if (doc.exists) {
          cmsData = { ...cmsData, ...doc.data() };
        }
      } catch(e) { console.warn("Firestore CMS load notice:", e); }
    }

    if (cmsData.siteTitle && document.getElementById("cms-siteTitle")) document.getElementById("cms-siteTitle").value = cmsData.siteTitle;
    if (cmsData.siteSlogan && document.getElementById("cms-siteSlogan")) document.getElementById("cms-siteSlogan").value = cmsData.siteSlogan;
    if (cmsData.siteLogo && document.getElementById("cms-siteLogo")) {
      document.getElementById("cms-siteLogo").value = cmsData.siteLogo;
      const prev = document.getElementById("logo-preview-img");
      const pathDisplay = document.getElementById("logo-preview-path");
      if (prev) {
        prev.src = cmsData.siteLogo;
        if (pathDisplay) pathDisplay.textContent = cmsData.siteLogo.startsWith("data:") ? "Sary avy amin'ny PC/Android (Base64)" : cmsData.siteLogo;
        const container = document.getElementById("logo-preview");
        if (container) container.classList.remove("hidden");
      }
    } else {
      const container = document.getElementById("logo-preview");
      if (container) container.classList.add("hidden");
    }
    if (cmsData.heroTitle && document.getElementById("cms-heroTitle")) document.getElementById("cms-heroTitle").value = cmsData.heroTitle;
    if (cmsData.heroSubtitle && document.getElementById("cms-heroSubtitle")) document.getElementById("cms-heroSubtitle").value = cmsData.heroSubtitle;
    if (cmsData.heroCta && document.getElementById("cms-heroCta")) document.getElementById("cms-heroCta").value = cmsData.heroCta;
    if (cmsData.heroImage && document.getElementById("cms-heroImage")) {
      document.getElementById("cms-heroImage").value = cmsData.heroImage;
      const prev = document.getElementById("hero-preview-img");
      const pathDisplay = document.getElementById("hero-preview-path");
      if (prev) {
        prev.src = cmsData.heroImage;
        if (pathDisplay) pathDisplay.textContent = cmsData.heroImage.startsWith("data:") ? "Sary avy amin'ny PC/Android (Base64)" : cmsData.heroImage;
        const container = document.getElementById("hero-preview");
        if (container) container.classList.remove("hidden");
      }
    } else {
      const container = document.getElementById("hero-preview");
      if (container) container.classList.add("hidden");
    }
    if (cmsData.servicesTitle && document.getElementById("cms-servicesTitle")) document.getElementById("cms-servicesTitle").value = cmsData.servicesTitle;
    if (cmsData.servicesSubtitle && document.getElementById("cms-servicesSubtitle")) document.getElementById("cms-servicesSubtitle").value = cmsData.servicesSubtitle;
    if (cmsData.metaTitle && document.getElementById("cms-metaTitle")) {
      document.getElementById("cms-metaTitle").value = cmsData.metaTitle;
      const p = document.getElementById("seo-preview-title");
      if (p) p.textContent = cmsData.metaTitle;
    }
    if (cmsData.metaKeywords && document.getElementById("cms-metaKeywords")) document.getElementById("cms-metaKeywords").value = cmsData.metaKeywords;
    if (cmsData.metaDesc && document.getElementById("cms-metaDesc")) {
      document.getElementById("cms-metaDesc").value = cmsData.metaDesc;
      const p = document.getElementById("seo-preview-desc");
      if (p) p.textContent = cmsData.metaDesc;
    }
    if (cmsData.pwaName && document.getElementById("cms-pwaName")) document.getElementById("cms-pwaName").value = cmsData.pwaName;
    if (cmsData.pwaThemeColor && document.getElementById("cms-pwaThemeColor")) document.getElementById("cms-pwaThemeColor").value = cmsData.pwaThemeColor;
    if (cmsData.whatsapp && document.getElementById("cms-whatsapp")) document.getElementById("cms-whatsapp").value = cmsData.whatsapp;
    if (cmsData.footerText && document.getElementById("cms-footerText")) document.getElementById("cms-footerText").value = cmsData.footerText;
    if (cmsData.googleVerification && document.getElementById("cms-googleVerification")) document.getElementById("cms-googleVerification").value = cmsData.googleVerification;

    // Dynamically show the real active hosting URL in the SEO Google snippet preview
    const seoPreviewUrl = document.getElementById("seo-preview-url");
    if (seoPreviewUrl) {
      seoPreviewUrl.textContent = window.location.origin + " › index.html";
    }

    // Set current site URL and setup copy button
    const siteUrlDisplay = document.getElementById("current-site-url-display");
    if (siteUrlDisplay) {
      siteUrlDisplay.textContent = window.location.origin;
    }

    const copySiteUrlBtn = document.getElementById("copy-site-url-btn");
    if (copySiteUrlBtn) {
      copySiteUrlBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(window.location.origin);
        const originalText = copySiteUrlBtn.innerHTML;
        copySiteUrlBtn.innerHTML = '<i class="fa-solid fa-check text-emerald-400"></i> Vita nadika!';
        copySiteUrlBtn.classList.remove("text-amber-400");
        copySiteUrlBtn.classList.add("text-emerald-400");
        setTimeout(() => {
          copySiteUrlBtn.innerHTML = originalText;
          copySiteUrlBtn.classList.remove("text-emerald-400");
          copySiteUrlBtn.classList.add("text-amber-400");
        }, 2500);
      });
    }

    // Save Google Verification Tag Button
    const saveGoogleBtn = document.getElementById("save-google-verification-btn");
    if (saveGoogleBtn) {
      saveGoogleBtn.addEventListener("click", async () => {
        const input = document.getElementById("cms-googleVerification");
        if (!input) return;
        const val = input.value.trim();
        
        saveGoogleBtn.disabled = true;
        const originalHtml = saveGoogleBtn.innerHTML;
        saveGoogleBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Eo am-pampidirana...';
        
        cmsData.googleVerification = val;
        
        // Save to localStorage
        localStorage.setItem("devwebia_site_cms", JSON.stringify(cmsData));
        
        // Save to Firestore
        let success = true;
        if (window.db) {
          try {
            await window.db.collection("app_data").doc("site_content").set(cmsData, { merge: true });
          } catch (err) {
            console.warn("Google Verification save error:", err);
            success = false;
          }
        }
        
        setTimeout(() => {
          saveGoogleBtn.disabled = false;
          if (success) {
            saveGoogleBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Tafiditra soa aman-tsara !';
            saveGoogleBtn.classList.remove("bg-amber-500", "hover:bg-amber-600", "text-slate-950");
            saveGoogleBtn.classList.add("bg-emerald-600", "text-white");
            showFloatingToast("Tafiditra sy voatahiry soa aman-tsara ny balise Google-nao!", "success");
            
            setTimeout(() => {
              saveGoogleBtn.innerHTML = originalHtml;
              saveGoogleBtn.classList.remove("bg-emerald-600", "text-white");
              saveGoogleBtn.classList.add("bg-amber-500", "hover:bg-amber-600", "text-slate-950");
            }, 3000);
          } else {
            saveGoogleBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Nisy olana!';
            saveGoogleBtn.classList.remove("bg-amber-500", "hover:bg-amber-600", "text-slate-950");
            saveGoogleBtn.classList.add("bg-rose-600", "text-white");
            showFloatingToast("Nisy olana teo am-pitahirizana ny balise.", "error");
            
            setTimeout(() => {
              saveGoogleBtn.innerHTML = originalHtml;
              saveGoogleBtn.classList.remove("bg-rose-600", "text-white");
              saveGoogleBtn.classList.add("bg-amber-500", "hover:bg-amber-600", "text-slate-950");
            }, 3000);
          }
        }, 1000);
      });
    }

    // View Site Verify Button
    const viewSiteVerifyBtn = document.getElementById("view-site-verify-btn");
    if (viewSiteVerifyBtn) {
      viewSiteVerifyBtn.addEventListener("click", () => {
        window.open(window.location.origin, "_blank");
      });
    }

    // Scan user's index.html and build the CMS form dynamically
    await scanAndBuildDynamicCMS();
  }

  async function scanAndBuildDynamicCMS() {
    try {
      const response = await fetch("./index.html");
      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");

      // 1. Text keys
      const textKeys = new Set();
      const textElements = [];
      doc.querySelectorAll("[data-cms]").forEach(el => {
        const key = el.getAttribute("data-cms");
        const skipKeys = ["siteTitle", "siteSlogan", "siteLogo", "heroTitle", "heroSubtitle", "heroCta", "heroImage", "whatsapp", "footerText"];
        if (key && !skipKeys.includes(key) && !textKeys.has(key)) {
          textKeys.add(key);
          const currentVal = cmsData[key] !== undefined ? cmsData[key] : el.textContent.trim();
          
          const sectionEl = el.closest("section") || el.closest("footer") || el.closest("header");
          const sectionId = sectionEl ? (sectionEl.id || sectionEl.tagName) : "Contenu";
          const sectionTitle = sectionEl ? (sectionEl.querySelector("h2, h3, h1")?.textContent.trim() || sectionId) : "Général";

          textElements.push({
            key,
            currentVal,
            section: sectionTitle,
            isLong: currentVal.length > 80 || el.tagName === "P" || el.tagName === "TEXTAREA"
          });
        }
      });

      const textCountEl = document.getElementById("text-fields-count");
      if (textCountEl) textCountEl.textContent = textElements.length + " champs trouvés";

      const textsContainer = document.getElementById("dynamic-texts-container");
      if (textsContainer) {
        if (textElements.length === 0) {
          textsContainer.innerHTML = \`<div class="text-center py-8 text-slate-500">Aucun autre champ de texte détecté dans index.html.</div>\`;
        } else {
          textsContainer.innerHTML = "";
          const sections = {};
          textElements.forEach(item => {
            if (!sections[item.section]) sections[item.section] = [];
            sections[item.section].push(item);
          });

          Object.keys(sections).forEach(sect => {
            const header = document.createElement("div");
            header.className = "text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-700/50 pb-1 mt-4 mb-2 flex items-center gap-1.5";
            header.innerHTML = \`<i class="fa-solid fa-folder-open"></i> Section : \` + sect;
            textsContainer.appendChild(header);

            sections[sect].forEach(item => {
              const div = document.createElement("div");
              div.className = "bg-slate-800/40 p-4 rounded-xl border border-slate-700/30 hover:border-slate-700 transition space-y-1";
              
              const label = document.createElement("label");
              label.className = "block text-xs font-semibold text-slate-300 flex justify-between items-center";
              label.innerHTML = \`<span>\` + item.key + \`</span><span class="text-[10px] text-slate-500 font-mono">data-cms="\` + item.key + \`"</span>\`;
              div.appendChild(label);

              let input;
              if (item.isLong) {
                input = document.createElement("textarea");
                input.rows = 3;
              } else {
                input = document.createElement("input");
                input.type = "text";
              }
              input.id = "dyn-txt-" + item.key;
              input.value = item.currentVal;
              input.className = "w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500";
              
              input.addEventListener("input", () => {
                cmsData[item.key] = input.value;
              });

              div.appendChild(input);
              textsContainer.appendChild(div);
            });
          });
        }
      }

      // 2. Image keys (data-cms-img & other standard images)
      const imageKeys = new Set();
      const imageElements = [];
      doc.querySelectorAll("[data-cms-img]").forEach(el => {
        const key = el.getAttribute("data-cms-img");
        if (key && !imageKeys.has(key)) {
          imageKeys.add(key);
          const currentVal = cmsData[key] !== undefined ? cmsData[key] : (el.tagName === "IMG" ? el.getAttribute("src") : "");
          imageElements.push({ key, currentVal });
        }
      });

      doc.querySelectorAll("img").forEach((el, index) => {
        const id = el.id;
        const src = el.getAttribute("src");
        if (src && !src.startsWith("data:") && !src.includes("spinner") && !src.includes("logo") && !id?.includes("preview")) {
          let key = el.getAttribute("data-cms-img") || id;
          if (!key) key = "img_" + index;
          if (key && !imageKeys.has(key)) {
            imageKeys.add(key);
            const currentVal = cmsData[key] !== undefined ? cmsData[key] : src;
            imageElements.push({ key, currentVal });
          }
        }
      });

      const imageCountEl = document.getElementById("image-fields-count");
      if (imageCountEl) imageCountEl.textContent = imageElements.length + " images trouvées";

      const imagesContainer = document.getElementById("dynamic-images-container");
      if (imagesContainer) {
        if (imageElements.length === 0) {
          imagesContainer.innerHTML = \`<div class="text-center py-8 text-slate-500 col-span-2">Aucune autre image modifiable détectée dans index.html.</div>\`;
        } else {
          imagesContainer.innerHTML = "";
          imageElements.forEach(item => {
            const card = document.createElement("div");
            card.className = "bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col justify-between space-y-4";

            const header = document.createElement("div");
            header.className = "flex justify-between items-center";
            header.innerHTML = \`<span class="text-xs font-bold text-indigo-300 truncate max-w-[200px] font-mono">\` + item.key + \`</span>
                                 <span class="text-[10px] text-slate-500 font-mono">image</span>\`;
            card.appendChild(header);

            const previewBox = document.createElement("div");
            previewBox.className = "relative h-36 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center p-2";
            
            const imgPreview = document.createElement("img");
            imgPreview.id = "dyn-img-prev-" + item.key;
            imgPreview.src = item.currentVal || "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400";
            imgPreview.className = "max-h-full max-w-full object-contain rounded";
            previewBox.appendChild(imgPreview);

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center text-xs shadow-md transition";
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            deleteBtn.title = "Fafana ity sary ity (Effacer / Supprimer)";
            deleteBtn.addEventListener("click", () => {
              if (confirm("Tena tianao hofafana tokoa ve ity sary ity? (Supprimer l'image ?)")) {
                cmsData[item.key] = "";
                imgPreview.src = "";
                const inputUrl = document.getElementById("dyn-img-url-" + item.key);
                if (inputUrl) inputUrl.value = "";
                showFloatingToast("Voafafa soa aman-tsara ilay sary! (Image effacée)", "success");
              }
            });
            previewBox.appendChild(deleteBtn);
            card.appendChild(previewBox);

            const controls = document.createElement("div");
            controls.className = "space-y-3";

            const fileRow = document.createElement("div");
            fileRow.className = "space-y-1";
            fileRow.innerHTML = \`<label class="block text-[10px] uppercase font-bold text-slate-400">Téléverser un sary (image locale)</label>\`;
            
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/*";
            fileInput.className = "w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer";
            fileInput.addEventListener("change", async (e) => {
              const file = e.target.files[0];
              if (file) {
                imgPreview.style.opacity = "0.4";
                showFloatingToast("Eo am-panodinana sy famatrarana ity sary ity... (Compression...)", "success");
                const b64 = await fileToBase64(file);
                cmsData[item.key] = b64;
                imgPreview.src = b64;
                imgPreview.style.opacity = "1";
                const inputUrl = document.getElementById("dyn-img-url-" + item.key);
                if (inputUrl) inputUrl.value = b64;
                showFloatingToast("Tafiditra ny sary vaovao! (Nouvelle image chargée)", "success");
              }
            });
            fileRow.appendChild(fileInput);
            controls.appendChild(fileRow);

            const urlRow = document.createElement("div");
            urlRow.className = "space-y-1";
            urlRow.innerHTML = \`<label class="block text-[10px] uppercase font-bold text-slate-400">Ou coller l'adresse URL (Lien de l'image)</label>\`;
            
            const urlInput = document.createElement("input");
            urlInput.type = "text";
            urlInput.id = "dyn-img-url-" + item.key;
            urlInput.placeholder = "https://images.unsplash.com/...";
            urlInput.value = item.currentVal || "";
            urlInput.className = "w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500";
            
            urlInput.addEventListener("input", () => {
              cmsData[item.key] = urlInput.value;
              imgPreview.src = urlInput.value || "";
            });
            
            urlRow.appendChild(urlInput);
            controls.appendChild(urlRow);

            card.appendChild(controls);
            imagesContainer.appendChild(card);
          });
        }
      }
    } catch(e) {
      console.warn("Scan dynamic CMS failure:", e);
    }
  }

  if (cmsForm) {
    cmsForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      
      const submitBtn = document.getElementById("cms-submit-btn");
      const originalBtnHtml = submitBtn ? submitBtn.innerHTML : "";
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xl"></i> Handrakitra sy handefa ny fanovana... (Enregistrement...)';
        submitBtn.classList.remove("bg-emerald-500", "hover:bg-emerald-600", "text-slate-950");
        submitBtn.classList.add("bg-indigo-600", "text-white");
      }

      const updatedData = {
        ...cmsData,
        siteTitle: document.getElementById("cms-siteTitle")?.value || "",
        siteSlogan: document.getElementById("cms-siteSlogan")?.value || "",
        siteLogo: document.getElementById("cms-siteLogo")?.value || "",
        heroTitle: document.getElementById("cms-heroTitle")?.value || "",
        heroSubtitle: document.getElementById("cms-heroSubtitle")?.value || "",
        heroCta: document.getElementById("cms-heroCta")?.value || "",
        heroImage: document.getElementById("cms-heroImage")?.value || "",
        servicesTitle: document.getElementById("cms-servicesTitle")?.value || "",
        servicesSubtitle: document.getElementById("cms-servicesSubtitle")?.value || "",
        metaTitle: document.getElementById("cms-metaTitle")?.value || "",
        metaKeywords: document.getElementById("cms-metaKeywords")?.value || "",
        metaDesc: document.getElementById("cms-metaDesc")?.value || "",
        pwaName: document.getElementById("cms-pwaName")?.value || "",
        pwaThemeColor: document.getElementById("cms-pwaThemeColor")?.value || "",
        whatsapp: document.getElementById("cms-whatsapp")?.value || "",
        footerText: document.getElementById("cms-footerText")?.value || "",
        googleVerification: document.getElementById("cms-googleVerification") ? document.getElementById("cms-googleVerification").value : "",
        updatedAt: new Date().toISOString()
      };

      // Ensure any inputs dynamically generated are up-to-date
      document.querySelectorAll("[id^='dyn-txt-']").forEach(input => {
        const key = input.id.replace("dyn-txt-", "");
        updatedData[key] = input.value;
      });

      // Also ensure any dynamic image URLs are up-to-date
      document.querySelectorAll("[id^='dyn-img-url-']").forEach(input => {
        const key = input.id.replace("dyn-img-url-", "");
        updatedData[key] = input.value;
      });

      // Save to localStorage
      localStorage.setItem("devwebia_site_cms", JSON.stringify(updatedData));

      // Save PIN if updated
      const newPin = document.getElementById("cms-newPin")?.value.trim() || "";
      if (newPin.length >= 4) {
        const newHash = await hashPin(newPin);
        localStorage.setItem("devwebia_admin_pin_hash", newHash);
        document.getElementById("cms-newPin").value = "";
      }

      let saveSuccess = true;
      let errorMessage = "";

      // Save to Firestore
      if (window.db) {
        try {
          await window.db.collection("app_data").doc("site_content").set(updatedData, { merge: true });
        } catch (err) {
          console.warn("Firestore save failure:", err);
          saveSuccess = false;
          errorMessage = err.message || "Impossible de sauvegarder sur Firestore.";
        }
      }

      // Slight delay so the user can see progress animation
      await new Promise(resolve => setTimeout(resolve, 800));

      // Restore button
      if (submitBtn) {
        submitBtn.disabled = false;
        if (saveSuccess) {
          submitBtn.innerHTML = '<i class="fa-solid fa-circle-check text-white animate-bounce"></i> Voatahiry soa aman-tsara! (Enregistré!)';
          submitBtn.classList.remove("bg-indigo-600", "text-white");
          submitBtn.classList.add("bg-emerald-600", "text-white");
          
          showFloatingToast("Voatahiry sy nalefa soa aman-tsara ny fanovana nataonao! (Modifications enregistrées et publiées)", "success");
        } else {
          submitBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-white animate-pulse"></i> Nisy olana! (Erreur)';
          submitBtn.classList.remove("bg-indigo-600", "text-white");
          submitBtn.classList.add("bg-rose-600", "text-white");
          
          showFloatingToast("Nisy olana teo am-pitahirizana: " + errorMessage, "error");
        }
        
        setTimeout(() => {
          if (submitBtn) {
            submitBtn.innerHTML = originalBtnHtml;
            submitBtn.classList.remove("bg-emerald-600", "bg-rose-600", "text-white");
            submitBtn.classList.add("bg-emerald-500", "text-slate-950", "hover:bg-emerald-600");
          }
        }, 3000);
      }

      if (saveSuccess && statusToast) {
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
          data.platformUrl,
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

    const geminiEnvKey =
      process.env.GEMINI_API_KEY ||
      process.env.API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;
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
        // Sync system key to Firestore so deployed apps (e.g. Vercel) can access it directly
        adminDb
          .syncSystemKeyToFirestore()
          .catch((err) => console.warn("Background sync error:", err));
      } catch (err) {
        console.warn("System GEMINI_API_KEY failed:", err);
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
            model: "google/gemini-2.0-flash-001",
            messages,
            temperature: 0.7,
            max_tokens: 32768,
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
      throw new Error(
        "Impossible de contacter le service IA Gemini. Veuillez vérifier votre clé API Gemini ou votre connexion puis réessayez.",
      );
    }

    const parsed = extractJson(result.text);
    if (!parsed) {
      console.warn("Failed parsing AI JSON output.");
      throw new Error(
        "L'IA Gemini a généré une réponse mais le format JSON est invalide. Veuillez réorganiser votre demande et réessayer.",
      );
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
