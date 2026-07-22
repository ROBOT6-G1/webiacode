import { createFileRoute, redirect } from "@tanstack/react-router";
import { auth, db, getAuthToken } from "@/integrations/firebase/client";
import { doc, getDoc, collection, query, getDocs, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { approvePayment } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Shield, Check, X, Key, Users as UsersIcon, MessageSquare } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const user = auth.currentUser;
    if (!user) throw redirect({ to: "/auth" });
    const isSuperAdminEmail =
      user.email === "horlandobe@gmail.com" ||
      user.email === "boutiquemevasoa@gmail.com";
    if (isSuperAdminEmail) return;

    const snap = await getDoc(doc(db, "user_roles", user.uid));
    if (!snap.exists() || snap.data()?.role !== "admin") throw redirect({ to: "/app" });
  },
  component: Admin,
});

function Admin() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="h-8 w-8 text-primary" />Administration</h1>
      <Tabs defaultValue="payments">
        <TabsList>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="keys">Clés IA</TabsTrigger>
          <TabsTrigger value="tickets">Support</TabsTrigger>
        </TabsList>
        <TabsContent value="payments"><PaymentsTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="keys"><KeysTab /></TabsContent>
        <TabsContent value="tickets"><TicketsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function PaymentsTab() {
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "payments"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
        id: string;
        amount_ar: number;
        credits: number;
        kind: string;
        reference: string;
        status: string;
        created_at: string;
      }>;
      list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      return list;
    },
  });
  const act = async (id: string, status: "validated" | "rejected") => {
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await approvePayment({ data: { paymentId: id, action: status }, headers });
      toast.success(`Paiement ${status}`);
      queryClient.invalidateQueries();
    } catch (err) { toast.error(err instanceof Error ? err.message : String(err)); }
  };
  return (
    <div className="space-y-3 mt-4">
      {q.data?.length === 0 && <p className="text-sm text-muted-foreground">Aucun paiement.</p>}
      {q.data?.map((p) => (
        <div key={p.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold">{p.amount_ar.toLocaleString()} Ar — {p.credits} crédits ({p.kind})</p>
            <p className="text-xs text-muted-foreground">Réf {p.reference} · {new Date(p.created_at).toLocaleString("fr-FR")}</p>
            <p className="text-xs text-muted-foreground">Statut: <span className="font-semibold">{p.status}</span></p>
          </div>
          {p.status === "pending" && (
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={() => act(p.id, "validated")}><Check className="h-4 w-4" /></Button>
              <Button size="sm" variant="destructive" onClick={() => act(p.id, "rejected")}><X className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "profiles"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
        id: string;
        email: string;
        display_name?: string;
        credits: number;
        plan?: string;
        created_at?: string;
      }>;
      list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      return list;
    },
  });
  const setCredits = async (id: string, credits: number) => {
    try {
      await updateDoc(doc(db, "profiles", id), { credits });
      toast.success("MàJ réussie");
      queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };
  return (
    <div className="space-y-2 mt-4">
      {q.data?.map((u) => (
        <div key={u.id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between gap-4 text-sm">
          <div className="min-w-0">
            <p className="font-semibold flex items-center gap-2 truncate"><UsersIcon className="h-4 w-4" />{u.display_name ?? u.email}</p>
            <p className="text-xs text-muted-foreground truncate">{u.email} · Plan {u.plan || "free"}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Input type="number" defaultValue={u.credits} className="w-24" onBlur={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v !== u.credits) setCredits(u.id, v); }} />
            <span className="text-xs text-muted-foreground">crédits</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const PROVIDERS: Array<{ id: string; label: string; model: string; url: string }> = [
  { id: "google", label: "Google Gemini (AI Studio)", model: "gemini-flash-latest (auto)", url: "https://aistudio.google.com/apikey" },
  { id: "groq", label: "Groq Cloud", model: "llama-3.3-70b-versatile (auto)", url: "https://console.groq.com/keys" },
  { id: "openrouter", label: "OpenRouter (modèles :free)", model: "llama-3.3-70b-instruct:free (auto)", url: "https://openrouter.ai/settings/keys" },
  { id: "mistral", label: "Mistral AI (La Plateforme)", model: "mistral-small-latest (auto)", url: "https://console.mistral.ai/api-keys" },
  { id: "cohere", label: "Cohere (trial gratuit)", model: "command-r-08-2024 (auto)", url: "https://dashboard.cohere.com/api-keys" },
  { id: "together", label: "Together AI (modèles Free)", model: "Llama-3.3-70B-Instruct-Turbo-Free (auto)", url: "https://api.together.ai/settings/api-keys" },
  { id: "cerebras", label: "Cerebras Cloud", model: "llama-3.3-70b (auto)", url: "https://cloud.cerebras.ai/platform" },
  { id: "sambanova", label: "SambaNova Cloud", model: "Meta-Llama-3.3-70B-Instruct (auto)", url: "https://cloud.sambanova.ai/apis" },
  { id: "nvidia", label: "NVIDIA NIM", model: "llama-3.3-70b-instruct (auto)", url: "https://build.nvidia.com/explore/discover" },
  { id: "huggingface", label: "Hugging Face Inference", model: "Llama-3.3-70B-Instruct (auto)", url: "https://huggingface.co/settings/tokens" },
];

function KeysTab() {
  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [provider, setProvider] = useState("google");
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-keys"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "admin_gemini_keys"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
        id: string;
        label: string;
        key_value: string;
        provider?: string;
        active?: boolean;
        request_count?: number;
        error_count?: number;
        tokens_used?: number;
        created_at?: string;
      }>;
      list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      return list;
    },
  });
  const add = async () => {
    if (!label.trim() || !key.trim()) return;
    try {
      await addDoc(collection(db, "admin_gemini_keys"), {
        label: label.trim(),
        key_value: key.trim(),
        provider,
        active: true,
        request_count: 0,
        error_count: 0,
        tokens_used: 0,
        created_at: new Date().toISOString(),
      });
      toast.success("Clé ajoutée"); setLabel(""); setKey(""); queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };
  const toggle = async (id: string, active?: boolean) => {
    await updateDoc(doc(db, "admin_gemini_keys", id), { active: !active });
    queryClient.invalidateQueries();
  };
  const del = async (id: string) => {
    await deleteDoc(doc(db, "admin_gemini_keys", id));
    queryClient.invalidateQueries();
  };
  const current = PROVIDERS.find((p) => p.id === provider) ?? PROVIDERS[0];
  return (
    <div className="space-y-4 mt-4">
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <p className="font-semibold flex items-center gap-2"><Key className="h-4 w-4" />Ajouter une clé API IA</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground">Fournisseur</label>
            <select
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">Modèle : {current.model}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Obtenir une clé (gratuit)</label>
            <a
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center justify-center w-full rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent"
            >
              Ouvrir {current.label} ↗
            </a>
          </div>
        </div>
        <Input placeholder="Label (ex: key-1)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Input placeholder="Clé API..." value={key} onChange={(e) => setKey(e.target.value)} type="password" />
        <Button onClick={add}>Ajouter</Button>
      </div>
      <div className="space-y-2">
        {q.data?.map((k) => (
          <div key={k.id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between gap-4 text-sm">
            <div className="min-w-0">
              <p className="font-semibold truncate">
                {k.label}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({PROVIDERS.find((p) => p.id === (k.provider ?? "google"))?.label ?? k.provider ?? "google"})
                </span>
              </p>
              <p className="text-xs text-muted-foreground font-mono">{k.key_value.slice(0, 8)}...{k.key_value.slice(-4)}</p>
              <p className="text-xs text-muted-foreground">Requêtes: {k.request_count || 0} · Tokens: {k.tokens_used ?? 0}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant={k.active ? "default" : "outline"} onClick={() => toggle(k.id, k.active)}>
                {k.active ? "Active" : "Inactive"}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => del(k.id)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TicketsTab() {
  const [reply, setReply] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "support_tickets"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
        id: string;
        message: string;
        status: string;
        admin_reply?: string;
        created_at: string;
      }>;
      list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      return list;
    },
  });
  const send = async (id: string) => {
    const r = reply[id]?.trim();
    if (!r) return;
    try {
      await updateDoc(doc(db, "support_tickets", id), { admin_reply: r, status: "resolved" });
      toast.success("Réponse envoyée");
      queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };
  return (
    <div className="space-y-3 mt-4">
      {q.data?.map((t) => (
        <div key={t.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
          <div className="flex justify-between items-start">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="h-3 w-3" />{new Date(t.created_at).toLocaleString("fr-FR")}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{t.status}</span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{t.message}</p>
          {t.admin_reply ? (
            <p className="text-sm text-primary border-l-2 border-primary pl-3">{t.admin_reply}</p>
          ) : (
            <div className="flex gap-2">
              <Textarea rows={2} placeholder="Votre réponse..." value={reply[t.id] ?? ""} onChange={(e) => setReply({ ...reply, [t.id]: e.target.value })} />
              <Button onClick={() => send(t.id)}>Envoyer</Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
