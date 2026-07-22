import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, db } from "@/integrations/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BrainCircuit, Check, ExternalLink, Loader2, KeyRound, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ai-settings")({
  component: AiSettings,
});

export const AI_PROVIDERS: Array<{ id: string; label: string; url: string; model: string; free: boolean }> = [
  { id: "google", label: "Google Gemini (AI Studio)", url: "https://aistudio.google.com/apikey", model: "gemini-flash-latest", free: true },
  { id: "groq", label: "Groq Cloud", url: "https://console.groq.com/keys", model: "llama-3.3-70b-versatile", free: true },
  { id: "openrouter", label: "OpenRouter", url: "https://openrouter.ai/settings/keys", model: "llama-3.3-70b-instruct:free", free: true },
  { id: "mistral", label: "Mistral AI", url: "https://console.mistral.ai/api-keys", model: "mistral-small-latest", free: true },
  { id: "cohere", label: "Cohere", url: "https://dashboard.cohere.com/api-keys", model: "command-r-08-2024", free: true },
  { id: "together", label: "Together AI", url: "https://api.together.ai/settings/api-keys", model: "Llama-3.3-70B-Instruct-Turbo-Free", free: true },
  { id: "cerebras", label: "Cerebras", url: "https://cloud.cerebras.ai/platform", model: "llama-3.3-70b", free: true },
  { id: "sambanova", label: "SambaNova Cloud", url: "https://cloud.sambanova.ai/apis", model: "Meta-Llama-3.3-70B-Instruct", free: true },
  { id: "nvidia", label: "NVIDIA NIM", url: "https://build.nvidia.com/explore/discover", model: "llama-3.3-70b-instruct", free: true },
  { id: "huggingface", label: "Hugging Face", url: "https://huggingface.co/settings/tokens", model: "Llama-3.3-70B-Instruct", free: true },
  { id: "openai", label: "OpenAI", url: "https://platform.openai.com/api-keys", model: "gpt-4o-mini", free: false },
  { id: "anthropic", label: "Anthropic Claude", url: "https://console.anthropic.com/settings/keys", model: "claude-3-5-haiku-latest", free: false },
  { id: "deepseek", label: "DeepSeek", url: "https://platform.deepseek.com/api_keys", model: "deepseek-chat", free: false },
  { id: "xai", label: "xAI Grok", url: "https://console.x.ai/", model: "grok-2-latest", free: false },
  { id: "perplexity", label: "Perplexity", url: "https://www.perplexity.ai/settings/api", model: "llama-3.1-sonar-large-128k-online", free: false },
  { id: "fireworks", label: "Fireworks AI", url: "https://fireworks.ai/api-keys", model: "accounts/fireworks/models/llama-v3p3-70b-instruct", free: true },
  { id: "anyscale", label: "Anyscale Endpoints", url: "https://console.anyscale.com/credentials", model: "meta-llama/Llama-3.1-70B-Instruct", free: false },
  { id: "octoai", label: "OctoAI", url: "https://octoai.cloud/settings/tokens", model: "meta-llama-3.1-70b-instruct", free: true },
  { id: "replicate", label: "Replicate", url: "https://replicate.com/account/api-tokens", model: "meta/meta-llama-3.1-70b-instruct", free: false },
  { id: "novita", label: "Novita AI", url: "https://novita.ai/settings/key-management", model: "meta-llama/llama-3.1-70b-instruct", free: true },
  { id: "deepinfra", label: "DeepInfra", url: "https://deepinfra.com/dash/api_keys", model: "meta-llama/Meta-Llama-3.1-70B-Instruct", free: true },
  { id: "hyperbolic", label: "Hyperbolic", url: "https://app.hyperbolic.xyz/settings", model: "meta-llama/Meta-Llama-3.1-70B-Instruct", free: true },
  { id: "lepton", label: "Lepton AI", url: "https://dashboard.lepton.ai/", model: "llama3-1-70b", free: true },
  { id: "ai21", label: "AI21 Labs (Jamba)", url: "https://studio.ai21.com/account/api-key", model: "jamba-1.5-large", free: true },
  { id: "voyage", label: "Voyage AI", url: "https://dash.voyageai.com/api-keys", model: "voyage-large-2", free: true },
  { id: "reka", label: "Reka AI", url: "https://platform.reka.ai/apikeys", model: "reka-core", free: true },
  { id: "aleph", label: "Aleph Alpha", url: "https://app.aleph-alpha.com/profile", model: "luminous-supreme", free: false },
  { id: "friendli", label: "Friendli AI", url: "https://suite.friendli.ai/personal-settings/tokens", model: "meta-llama-3.1-70b-instruct", free: true },
  { id: "cloudflare", label: "Cloudflare Workers AI", url: "https://dash.cloudflare.com/profile/api-tokens", model: "@cf/meta/llama-3.1-70b-instruct", free: true },
  { id: "kluster", label: "Kluster.ai", url: "https://platform.kluster.ai/apikeys", model: "klusterai/Meta-Llama-3.1-70B-Instruct-Turbo", free: true },
  { id: "featherless", label: "Featherless", url: "https://featherless.ai/account/api-keys", model: "meta-llama/Meta-Llama-3.1-70B-Instruct", free: false },
];

function AiSettings() {
  const qc = useQueryClient();
  const [provider, setProvider] = useState("google");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  const q = useQuery({
    queryKey: ["ai-settings"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return null;
      const [integSnap, profSnap] = await Promise.all([
        getDoc(doc(db, "user_integrations", user.uid)),
        getDoc(doc(db, "profiles", user.uid)),
      ]);
      return {
        integ: integSnap.exists() ? integSnap.data() : null,
        profile: profSnap.exists() ? profSnap.data() : null,
      };
    },
  });

  useEffect(() => {
    const i = q.data?.integ as { ai_provider?: string | null } | null | undefined;
    if (i?.ai_provider) setProvider(i.ai_provider);
  }, [q.data]);

  const subExpires = (q.data?.profile as { ai_sub_expires_at?: string | null } | null | undefined)?.ai_sub_expires_at;
  const subActive = !!subExpires && new Date(subExpires).getTime() > Date.now();

  const current = AI_PROVIDERS.find((p) => p.id === provider) ?? AI_PROVIDERS[0];

  const save = async () => {
    if (!apiKey.trim()) return toast.error("Clé API requise");
    setSaving(true);
    const user = auth.currentUser;
    if (!user) { setSaving(false); return; }
    try {
      const ref = doc(db, "user_integrations", user.uid);
      const snap = await getDoc(ref);
      const prev = snap.exists() ? snap.data() : {};
      await setDoc(ref, { ...prev, user_id: user.uid, ai_provider: provider, ai_api_key: apiKey.trim() }, { merge: true });
      toast.success("Clé IA enregistrée");
      qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const ref = doc(db, "user_integrations", user.uid);
    await setDoc(ref, { user_id: user.uid, ai_provider: null, ai_api_key: null }, { merge: true });
    setApiKey("");
    toast.success("Clé IA supprimée");
    qc.invalidateQueries();
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BrainCircuit className="h-8 w-8 text-primary" />
          Ma clé IA personnelle
        </h1>
        <p className="text-muted-foreground mt-2">
          Utilisez votre propre clé API IA (30+ fournisseurs). Vous ne consommez plus de crédits DEVWEBIA
          — un simple abonnement mensuel de <strong>10 000 Ar / mois</strong> suffit.
        </p>
      </div>

      <div className={`rounded-2xl border p-5 ${subActive ? "border-primary/40 bg-primary/5" : "border-amber-500/40 bg-amber-500/5"}`}>
        <div className="flex items-start gap-3">
          {subActive ? <Check className="h-5 w-5 text-primary mt-0.5" /> : <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5" />}
          <div className="flex-1">
            <p className="font-semibold">
              {subActive ? "Abonnement IA actif" : "Abonnement IA requis"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {subActive
                ? `Valide jusqu'au ${new Date(subExpires!).toLocaleDateString("fr-FR")}. Votre clé IA fonctionne sans consommer de crédits.`
                : "Sans abonnement actif, votre clé IA personnelle est enregistrée mais NE sera PAS utilisée. Souscrivez pour activer."}
            </p>
            {!subActive && (
              <Button asChild className="mt-3" size="sm">
                <Link to="/credits" search={{ plan: "ai" } as any}>S'abonner (10 000 Ar / mois)</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Fournisseur & clé API</h3>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Fournisseur</Label>
          <select
            className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            {AI_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} {p.free ? "· free tier" : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Modèle auto-sélectionné : <code>{current.model}</code>
          </p>
          <a
            href={current.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Obtenir une clé API {current.free ? "gratuite" : ""} sur {current.label}
          </a>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Clé API</Label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..., AIza..., gsk_..."
            className="mt-1"
            autoComplete="off"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={save} disabled={saving || !apiKey.trim()}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Enregistrer la clé
          </Button>
          {apiKey && (
            <Button variant="outline" onClick={clear}>Supprimer</Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Astuce : la plupart des fournisseurs marqués <em>free tier</em> offrent un quota gratuit permanent.
        DEVWEBIA détecte automatiquement le meilleur modèle disponible chez votre fournisseur.
      </p>
    </div>
  );
}
