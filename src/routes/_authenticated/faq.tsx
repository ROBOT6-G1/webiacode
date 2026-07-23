import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  Calendar,
  Phone,
  Mail,
  Sparkles,
  Shield,
  Cpu,
  Globe,
  CreditCard,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/faq")({
  component: FAQ,
});

const defaultFaqs = [
  {
    q: "1. Quelle est la date exacte de création et de lancement du projet DEVWEBIA ?",
    a: "Le projet officiel a été fondé et lancé le 23 Juillet 2026. Il a été conçu pour révolutionner la création de sites web professionnels, de boutiques en ligne, de PWA et d'applications d'entreprise grâce à l'intelligence artificielle générative et une architecture cloud ultra-sécurisée.",
  },
  {
    q: "2. Comment fonctionne le système de rotation intelligente des modèles IA ?",
    a: "DEVWEBIA intègre une rotation automatique de pointe entre plusieurs modèles Gemini (Gemini 2.5 Flash, Gemini 3.6 Flash, Gemini 3.5 Flash, Gemini 2.5 Flash-Lite, Gemini Flash Latest, Gemini 2.0 Flash, Gemini 1.5 Flash, Gemini 2.5 Pro, etc.). Si un modèle atteint sa limite ou rencontre une indisponibilité, le système bascule instantanément et de manière transparente sur le modèle suivant pour garantir une continuité absolue de vos développements sans interruption.",
  },
  {
    q: "3. Quels sont les contacts officiels de l'équipe support en cas d'assistance ?",
    a: "Vous pouvez joindre notre équipe dirigeante et notre support technique directement 7j/7 par téléphone / WhatsApp au 0323911654 ou par e-mail officiel à horlandobe@gmail.com.",
  },
  {
    q: "4. Comment effectuer le paiement des recharges et abonnements par Orange Money ?",
    a: "Pour recharger vos crédits ou souscrire aux plans PRO/IA, effectuez le transfert Orange Money sur notre numéro officiel : 0323911654 au nom de RAVELOMANANTSOA URMIN. Ensuite, indiquez la référence de transaction dans la section 'Recharger crédits'. La validation est effectuée rapidement par notre équipe.",
  },
  {
    q: "5. Comment fonctionne le processus de clarification avec 15 questions structurées ?",
    a: "Lors de la création d'un nouveau projet, notre IA pose un questionnaire approfondi de 15 questions clés (nom de la marque, slogan, palette de couleurs, services phares, numéro WhatsApp, code PIN admin, etc.) pour s'assurer que le site généré correspond exactement à vos attentes professionnelles et ne soit jamais un template générique.",
  },
  {
    q: "6. Comment fonctionne l'Espace Admin (CMS) intégré et la synchronisation Firestore ?",
    a: "Chaque site généré comprend un fichier admin.html et admin.js sécurisé par un code PIN. Toutes vos modifications (textes, images encodées en Base64, héros multiples, contacts WhatsApp) sont instantanément enregistrées dans Firestore (collection app_data) et synchronisées en temps réel sur le site public.",
  },
  {
    q: "7. Qu'est-ce que l'AUTO-SEO et comment lancer un Google Ping ?",
    a: "L'Espace Admin intègre un module AUTO-SEO complet avec un simulateur de résultat Google Search en direct. Vous pouvez y définir vos balises Méta-Titre, Méta-Description et Mots-Clés, puis cliquer sur le bouton '🚀 Lancer la Demande d'Indexation Google (Google Ping)' pour notifier automatiquement les serveurs Googlebot et indexer votre site.",
  },
  {
    q: "8. Les sites générés sont-ils des Applications Web Progressives (PWA) ?",
    a: "Oui ! 100% des sites créés sur DEVWEBIA sont des PWA installables sur mobile (Android/iOS) et ordinateur, dotés d'un manifeste PWA, d'un service worker et d'un logo moderne vectoriel généré sur mesure.",
  },
  {
    q: "9. Comment fonctionne l'indicateur de sécurité et l'audit anti-intrusion ?",
    a: "L'application analyse en permanence la robustesse de votre code et de vos configurations Firebase, vérifie l'absence de secrets exposés et vous fournit un rapport de sécurité en temps réel avec un bouton de correction automatique ('Fix') pour blinder votre site contre les vulnérabilités.",
  },
  {
    q: "10. Comment lier un nom de domaine personnalisé (.mg ou .com) ?",
    a: "Dans la section 'Domaine' de votre tableau de bord, vous pouvez configurer vos enregistrements DNS (CNAME, A) pour pointer votre nom de domaine personnalisé directement vers votre application hébergée.",
  },
  {
    q: "11. Comment fonctionnent les crédits de génération ? Combien coûte chaque site ?",
    a: "Chaque génération de code et d'application consomme des crédits. Vous pouvez acquérir des packs de crédits ou opter pour le plan PRO (5 000 Ar/mois) ou l'abonnement IA (10 000 Ar/mois) pour utiliser votre propre clé API sans consommer vos crédits.",
  },
  {
    q: "12. Que faire en cas de problème technique ou de question spécifique ?",
    a: "Notre support est à votre entière disposition. Contactez-nous sans hésiter au 0323911654 ou par e-mail à horlandobe@gmail.com pour toute assistance personnalisée.",
  },
];

function FAQ() {
  const faqs = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data } = await supabase.from("faqs").select("*").order("sort_order");
      return data ?? [];
    },
  });
  const items =
    faqs.data && faqs.data.length > 0
      ? faqs.data.map((f) => ({ q: f.question, a: f.answer }))
      : defaultFaqs;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-primary" /> FAQ & Guide Officiel DEVWEBIA
        </h1>
        <p className="text-muted-foreground text-sm">
          Retrouvez toutes les réponses détaillées concernant la plateforme, le projet fondé le{" "}
          <strong className="text-foreground">23 Juillet 2026</strong>, la rotation des IA, le
          paiement Orange Money et la sécurité.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 grid sm:grid-cols-3 gap-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Date de Lancement</p>
            <p className="text-sm font-bold text-foreground">23 Juillet 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
            <Phone className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Orange Money / Tél</p>
            <p className="text-sm font-bold text-foreground">0323911654</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">E-mail Support</p>
            <p className="text-sm font-bold text-foreground truncate max-w-[150px]">
              horlandobe@gmail.com
            </p>
          </div>
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {items.map((f, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className="bg-card border border-border rounded-2xl px-6 py-2 shadow-sm"
          >
            <AccordionTrigger className="text-left font-semibold text-base py-3 hover:text-primary transition">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4 pt-1">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Besoin d'aide supplémentaire ?
        </p>
        <p className="text-sm text-muted-foreground">
          Contactez directement notre service client au{" "}
          <strong className="text-foreground">0323911654</strong> ou par e-mail à{" "}
          <strong className="text-foreground">horlandobe@gmail.com</strong>.
        </p>
      </div>
    </div>
  );
}
