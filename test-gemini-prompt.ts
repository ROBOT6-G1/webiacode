import { GoogleGenAI } from "@google/genai";

function siteTypeBlock(siteType: string, whatsapp: string | null): string {
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
  return `\nTYPE DE SITE : AUTRE. Les 10 sections s'appliquent.`;
}

function buildSystemPrompt(
  siteType: string,
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
  };
  const langName = languageNames[language] || "Français";
  const languageBlock = `\nLANGUE DE SORTIE ET DE CLARIFICATION OBLIGATOIRE : ${langName}.
- Toutes les questions, options de quiz, textes du site web (index.html, admin.html, etc.), slogans et descriptions DOIVENT être intégralement rédigés en ${langName}.`;

  const clarificationBlock = hasExistingFiles
    ? `\nCONTEXTE : Le site existe déjà. Applique directement la modification et renvoie TOUS les fichiers (site + admin). Ne pose PAS de questions.`
    : `\nPHASE DE CLARIFICATION (OBLIGATOIRE avant un NOUVEAU site) :
- Pose tes questions STRICTEMENT dans la langue de l'utilisateur (si l'utilisateur parle en malagasy, réponds 100% en malagasy sans fautes ni caractères chinois ; si en français, réponds 100% en français).
- Pose au moins 15 QUESTIONS CLÉS, STRUCTURÉES ET PROFESSIONNELLES pour la création du site (15 questions minimum) afin de construire un site web hautement professionnel, moderne et attrayant.
- DEVOIR STRICT DE DEVWEBIA (OBLIGATOIRE) : Dès que l'utilisateur répond aux questions, l'IA DOIT STRICTEMENT ET INTÉGRALEMENT APPLIQUER TOUTES LES RÉPONSES DANS LE CODE HTML/CSS/JS ET LA CONFIGURATION DU SITE.
- Retourne les questions dans le tableau \`questions\`. \`files\` DOIT être \`{}\` vide durant cette phase.`;

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
${siteTypeBlock(siteType, whatsapp)}
${userFirebaseSnippet}`;
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.log("No API key");
    return;
  }

  const sys = buildSystemPrompt("vitrine", "+261340000000", false, "", false, "free", "mg");
  const userMsg = "Mamorona site web ho an'ny trano fisakafoanana malagasy vaovao.";

  console.log("Sending request to gemini-3.6-flash...");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userMsg }] }],
        systemInstruction: { parts: [{ text: sys }] },
        generationConfig: { temperature: 0.7, maxOutputTokens: 32768 },
      }),
    },
  );

  if (!res.ok) {
    console.log("API Call Failed:", await res.text());
    return;
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  console.log("Response text length:", text.length);
  console.log("First 300 chars of response:", text.slice(0, 300));
  console.log("Last 300 chars of response:", text.slice(-300));

  // Test parsing
  const m = text.match(/<JSON>([\s\S]*?)<\/JSON>/);
  console.log("Found <JSON> tag:", !!m);
  if (m) {
    try {
      const parsed = JSON.parse(m[1].trim());
      console.log("JSON parsed successfully!");
      console.log("Explanation:", parsed.explanation);
      console.log("Name:", parsed.name);
      console.log("Questions count:", parsed.questions?.length);
      console.log("Files count:", Object.keys(parsed.files || {}).length);
    } catch (e) {
      console.log("JSON parsing FAILED:", e);
    }
  }
}

main();
