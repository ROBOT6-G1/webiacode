import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useServerFn } from "@tanstack/react-start";
import { generateSite } from "@/lib/ai.functions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, Send, Loader2, Store, Briefcase, ShoppingBag, Hotel, GraduationCap, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/")({
  component: ChatIndex,
});

type SiteType = "vitrine" | "portfolio" | "ecommerce" | "hotel" | "school" | "erp";

const siteTypes: { id: SiteType; label: string; desc: string; icon: typeof Store }[] = [
  { id: "vitrine", label: "Vitrine", desc: "Site de présentation entreprise / service", icon: Store },
  { id: "portfolio", label: "Portfolio", desc: "Mise en valeur d'un créatif / freelance", icon: Briefcase },
  { id: "ecommerce", label: "E-commerce", desc: "Boutique en ligne (WhatsApp + Firebase)", icon: ShoppingBag },
  { id: "hotel", label: "Hôtel", desc: "Gestion hôtelière : chambres, réservations, clients", icon: Hotel },
  { id: "school", label: "École", desc: "Gestion scolaire : élèves, notes, présences, paiements", icon: GraduationCap },
  { id: "erp", label: "ERP", desc: "Gestion d'entreprise : ventes, stock, compta, RH", icon: Building2 },
];

const suggestionsByType: Record<SiteType, string[]> = {
  vitrine: [
    "Site vitrine moderne pour un restaurant malgache à Antananarivo",
    "Site vitrine pour un salon de coiffure, avec formulaire de réservation",
  ],
  portfolio: [
    "Portfolio minimaliste pour un photographe de mariage",
    "Portfolio design pour un développeur front-end senior",
  ],
  ecommerce: [
    "Boutique de vêtements traditionnels malgaches avec 6 produits d'exemple",
    "E-commerce de café artisanal, catalogue et checkout WhatsApp",
  ],
  hotel: [
    "Hôtel boutique 12 chambres à Nosy Be avec réservation en ligne",
    "Lodge écotouristique à Andasibe avec 3 catégories de bungalows",
  ],
  school: [
    "École primaire privée à Antananarivo, du CP au CM2, gestion notes et paiements",
    "Collège-lycée bilingue avec bulletins trimestriels et suivi de présence",
  ],
  erp: [
    "ERP pour une PME de distribution alimentaire à Madagascar (Ariary, TVA 20%)",
    "ERP pour un atelier de couture : stock tissus, ventes, paie de 8 employés",
  ],
};

function ChatIndex() {
  const [siteType, setSiteType] = useState<SiteType>("vitrine");
  const [whatsapp, setWhatsapp] = useState("");
  const [pwa, setPwa] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const generate = useServerFn(generateSite);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => textareaRef.current?.focus(), []);

  const submit = async () => {
    if (!prompt.trim() || loading) return;
    if (siteType === "ecommerce" && !whatsapp.trim()) {
      toast.error("Le numéro WhatsApp est obligatoire pour un site e-commerce");
      return;
    }
    setLoading(true);
    try {
      const res = await generate({
        data: {
          prompt: prompt.trim(),
          siteType,
          whatsappNumber: whatsapp.trim() || undefined,
          pwaEnabled: pwa,
        },
      });
      queryClient.invalidateQueries();
      const askedQuestions = !res.files || Object.keys(res.files).length === 0;
      toast.success(askedQuestions ? "DEVWEBIA a quelques questions pour vous…" : "Site créé !");
      navigate({ to: "/app/$projectId", params: { projectId: res.projectId! } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("insufficient_credits")) {
        toast.error("Crédits insuffisants");
        navigate({ to: "/credits" });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary text-primary-foreground mb-4">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Que souhaitez-vous créer ?</h1>
          <p className="text-muted-foreground mt-2">Choisissez le type de site — DEVWEBIA le construit pour vous.</p>
        </div>

        {/* Site type picker */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
          {siteTypes.map((t) => {
            const Icon = t.icon;
            const active = siteType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSiteType(t.id)}
                className={`text-left rounded-xl border p-4 transition-colors ${
                  active
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border bg-card hover:bg-accent/50"
                }`}
              >
                <Icon className={`h-5 w-5 mb-2 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <div className="font-semibold">{t.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Ecom extras */}
        {siteType === "ecommerce" && (
          <div className="rounded-xl border border-border bg-card p-4 mb-4 space-y-3">
            <div>
              <Label htmlFor="wa">Numéro WhatsApp du client (obligatoire)</Label>
              <Input
                id="wa"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+261 34 12 345 67"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Toutes les commandes seront envoyées à ce numéro avec nom, adresse et articles.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              La boutique enregistre produits & commandes sur Firebase. Vos identifiants Firebase sont automatiquement configurés.
            </p>
          </div>
        )}

        {/* PWA toggle */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 mb-4">
          <div>
            <div className="font-medium">Application PWA</div>
            <div className="text-xs text-muted-foreground">Installable sur mobile & desktop, fonctionne hors ligne.</div>
          </div>
          <Switch checked={pwa} onCheckedChange={setPwa} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-lg shadow-primary/5">
          <Textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            placeholder="Décrivez précisément votre site (nom, style, sections, couleurs, contenu)… DEVWEBIA suit vos instructions à la lettre."
            rows={5}
            className="border-0 bg-transparent focus-visible:ring-0 resize-none text-base"
            disabled={loading}
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">⌘ + Entrée pour envoyer · ~1 crédit / génération</span>
            <Button onClick={submit} disabled={loading || !prompt.trim()}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Générer
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {suggestionsByType[siteType].map((s) => (
            <button
              key={s}
              onClick={() => setPrompt(s)}
              className="text-left rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/50 p-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
