import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/faq")({
  component: FAQ,
});

const defaultFaqs = [
  { q: "Comment fonctionnent les crédits ?", a: "1 crédit = 15 000 tokens Gemini. Chaque génération consomme au minimum 1 crédit selon la taille du site." },
  { q: "Comment publier mon site ?", a: "Connectez GitHub et Vercel dans /connections, puis cliquez sur Publish depuis n'importe quel projet." },
  { q: "Comment payer ?", a: "Via Mvola au 0323911654 (RAVELOMANANTSOA URMIN), puis soumettez la référence dans /credits." },
  { q: "Différence entre Free et Pro ?", a: "Free : logo DEVWEBIA affiché, 1 Go de stockage. Pro (5000 Ar/mois) : sans logo, Supabase illimité, domaine personnel." },
  { q: "Comment parrainer ?", a: "Partagez votre code de parrainage depuis /referrals. Vous gagnez 5 crédits par ami inscrit." },
];

function FAQ() {
  const faqs = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data } = await supabase.from("faqs").select("*").order("sort_order");
      return data ?? [];
    },
  });
  const items = (faqs.data && faqs.data.length > 0) ? faqs.data.map((f) => ({ q: f.question, a: f.answer })) : defaultFaqs;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold flex items-center gap-2"><HelpCircle className="h-8 w-8 text-primary" />FAQ</h1>
      <p className="text-muted-foreground mt-1">Questions fréquentes sur DEVWEBIA.</p>
      <Accordion type="single" collapsible className="mt-6">
        {items.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}