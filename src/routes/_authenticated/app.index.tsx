import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { generateSite } from "@/lib/ai.functions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n, type Language } from "@/lib/i18n";
import {
  Sparkles,
  Send,
  Loader2,
  Store,
  Briefcase,
  ShoppingBag,
  Hotel,
  GraduationCap,
  Building2,
  Image as ImageIcon,
  X,
  Globe,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/")({
  component: ChatIndex,
});

type SiteType = "vitrine" | "portfolio" | "ecommerce" | "hotel" | "school" | "erp";

function ChatIndex() {
  const { lang, changeLanguage, t } = useI18n();
  const [siteType, setSiteType] = useState<SiteType>("vitrine");
  const [whatsapp, setWhatsapp] = useState("");
  const [pwa, setPwa] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const siteTypes: { id: SiteType; label: string; desc: string; icon: typeof Store }[] = [
    {
      id: "vitrine",
      label: t.appIndex.showcase,
      desc: "Site de présentation entreprise / service",
      icon: Store,
    },
    {
      id: "portfolio",
      label: t.appIndex.service,
      desc: "Mise en valeur d'un créatif / freelance",
      icon: Briefcase,
    },
    {
      id: "ecommerce",
      label: t.appIndex.ecommerce,
      desc: "Boutique en ligne (WhatsApp + Firebase)",
      icon: ShoppingBag,
    },
    {
      id: "hotel",
      label: t.appIndex.hotel,
      desc: "Gestion hôtelière : chambres, réservations, clients",
      icon: Hotel,
    },
    {
      id: "school",
      label: t.appIndex.school,
      desc: "Gestion scolaire : élèves, notes, présences, paiements",
      icon: GraduationCap,
    },
    {
      id: "erp",
      label: t.appIndex.organization,
      desc: "Gestion d'entreprise : ventes, stock, compta, RH",
      icon: Building2,
    },
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => textareaRef.current?.focus(), []);

  const submit = async () => {
    if ((!prompt.trim() && !imageBase64) || loading) return;
    if (siteType === "ecommerce" && !whatsapp.trim()) {
      toast.error(
        lang === "mg"
          ? "Tsy maintsy ampidirina ny laharana WhatsApp amin'ny varotra"
          : "Le numéro WhatsApp est obligatoire pour un site e-commerce"
      );
      return;
    }
    setLoading(true);
    try {
      const res = await generateSite({
        data: {
          prompt: prompt.trim() || "Créer un site web basé sur l'image d'inspiration fournie",
          siteType,
          whatsappNumber: whatsapp.trim() || undefined,
          pwaEnabled: pwa,
          language: lang,
          imageBase64: imageBase64 || undefined,
        },
      });
      queryClient.invalidateQueries();
      const askedQuestions = !res.files || Object.keys(res.files).length === 0;
      toast.success(
        askedQuestions
          ? lang === "mg"
            ? "Misy fanontaniana kely avy amin'i DEVWEBIA…"
            : "DEVWEBIA a quelques questions pour vous…"
          : lang === "mg"
            ? "Lasa soa aman-tsara ny tranonkala !"
            : "Site créé !"
      );
      navigate({ to: "/app/$projectId", params: { projectId: res.projectId! } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("insufficient_credits")) {
        toast.error(lang === "mg" ? "Tsy ampy ny kredity" : "Crédits insuffisants");
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
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t.appIndex.title}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t.appIndex.subtitle}
          </p>
        </div>

        {/* Site type picker */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
          {siteTypes.map((item) => {
            const Icon = item.icon;
            const active = siteType === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSiteType(item.id)}
                className={`text-left rounded-xl border p-4 transition-colors ${
                  active
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border bg-card hover:bg-accent/50"
                }`}
              >
                <Icon
                  className={`h-5 w-5 mb-2 ${active ? "text-primary" : "text-muted-foreground"}`}
                />
                <div className="font-semibold">{item.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Ecom extras */}
        {siteType === "ecommerce" && (
          <div className="rounded-xl border border-border bg-card p-4 mb-4 space-y-3">
            <div>
              <Label htmlFor="wa">{t.appIndex.whatsappLabel}</Label>
              <Input
                id="wa"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+261 34 12 345 67"
                className="mt-1"
              />
            </div>
          </div>
        )}

        {/* PWA toggle */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 mb-4">
          <div>
            <div className="font-medium">{t.appIndex.pwaLabel}</div>
            <div className="text-xs text-muted-foreground">
              Installable sur mobile & desktop, fonctionne hors ligne.
            </div>
          </div>
          <Switch checked={pwa} onCheckedChange={setPwa} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-lg shadow-primary/5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">{t.appIndex.aiLangLabel}</span>
              <select
                value={lang}
                onChange={(e) => changeLanguage(e.target.value as Language)}
                className="text-xs bg-background border border-border rounded-lg px-2.5 py-1 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="fr">{t.common.fr}</option>
                <option value="mg">{t.common.mg}</option>
                <option value="en">{t.common.en}</option>
                <option value="zh">{t.common.zh}</option>
                <option value="it">{t.common.it}</option>
              </select>
            </div>
            <span className="text-xs text-muted-foreground">{t.appIndex.creditCost}</span>
          </div>

          {imageBase64 && (
            <div className="relative inline-block">
              <img
                src={imageBase64}
                alt="Inspiration"
                className="h-20 w-auto object-contain rounded-lg border border-border bg-background p-1 shadow"
              />
              <button
                type="button"
                onClick={() => setImageBase64(null)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow hover:bg-destructive/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <div className="flex items-start gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 text-muted-foreground hover:text-primary mt-1"
              onClick={() => fileInputRef.current?.click()}
              title={t.appIndex.uploadImageTooltip}
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
              }}
              placeholder={
                imageBase64
                  ? t.appIndex.promptPlaceholderImage
                  : t.appIndex.promptPlaceholder
              }
              rows={4}
              className="border-0 bg-transparent focus-visible:ring-0 resize-none text-base"
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">{t.appIndex.cmdEnter}</span>
            <Button onClick={submit} disabled={loading || (!prompt.trim() && !imageBase64)}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {t.appIndex.generateBtn}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {t.appIndex.quickIdeas.map((s) => (
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
