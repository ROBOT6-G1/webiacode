import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Coins, Upload, CheckCircle2, Clock } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({ plan: z.enum(["credits", "pro", "ai"]).optional() });

export const Route = createFileRoute("/_authenticated/credits")({
  validateSearch: (s) => searchSchema.parse(s),
  component: CreditsPage,
});

type Plan = "credits" | "pro" | "ai";

const CREDIT_STEP = 20; // 20 crédits par palier
const PRICE_PER_STEP = 5000; // 5 000 Ar par palier

function CreditsPage() {
  const search = useSearch({ from: "/_authenticated/credits" });
  const [plan, setPlan] = useState<Plan>(search.plan ?? "credits");
  const [credits, setCredits] = useState(CREDIT_STEP);
  const [ref, setRef] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (search.plan) setPlan(search.plan);
  }, [search.plan]);

  const amount =
    plan === "pro" ? 5000 :
    plan === "ai" ? 10000 :
    (credits / CREDIT_STEP) * PRICE_PER_STEP;

  const creditsAwarded =
    plan === "pro" ? 15 :
    plan === "ai" ? 0 :
    credits;

  const payments = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return [];
      const q = query(collection(db, "payments"), where("user_id", "==", user.uid));
      const snap = await getDocs(q);
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

  const clampCredits = (v: number) => {
    if (isNaN(v) || v < CREDIT_STEP) return CREDIT_STEP;
    return Math.round(v / CREDIT_STEP) * CREDIT_STEP;
  };

  const submit = async () => {
    if (!ref.trim()) { toast.error("Référence Mvola requise"); return; }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Non connecté");

      await addDoc(collection(db, "payments"), {
        user_id: user.uid,
        amount_ar: amount,
        credits: creditsAwarded,
        kind: plan === "pro" ? "pro" : plan === "ai" ? "ai_sub" : "credits",
        reference: ref.trim(),
        proof_url: file ? file.name : null,
        status: "pending",
        created_at: new Date().toISOString(),
      });

      toast.success("Paiement soumis ! Admin va valider sous 24h.");
      setRef(""); setFile(null);
      queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Coins className="h-8 w-8 text-primary" />Recharger crédits</h1>
        <p className="text-muted-foreground mt-1">
          1 crédit = 15 000 tokens. <strong>{CREDIT_STEP} crédits = {PRICE_PER_STEP.toLocaleString()} Ar</strong>. Paiement Mvola Malagasy.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <button onClick={() => setPlan("credits")} className={`rounded-2xl border p-6 text-left transition-colors ${plan === "credits" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"}`}>
          <h3 className="text-lg font-semibold">Pack Crédits</h3>
          <p className="text-sm text-muted-foreground mt-1">{CREDIT_STEP} crédits = {PRICE_PER_STEP.toLocaleString()} Ar · palier de {CREDIT_STEP}</p>
        </button>
        <button onClick={() => setPlan("pro")} className={`rounded-2xl border p-6 text-left transition-colors ${plan === "pro" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"}`}>
          <h3 className="text-lg font-semibold">Plan PRO — 5 000 Ar/mois</h3>
          <p className="text-sm text-muted-foreground mt-1">+15 crédits bonus · sans logo · domaine perso · Firebase illimité (30 jours)</p>
        </button>
        <button onClick={() => setPlan("ai")} className={`rounded-2xl border p-6 text-left transition-colors ${plan === "ai" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"}`}>
          <h3 className="text-lg font-semibold">Abonnement IA — 10 000 Ar/mois</h3>
          <p className="text-sm text-muted-foreground mt-1">Utilise TA clé IA (30+ fournisseurs) · zéro crédit consommé pendant 30 jours</p>
        </button>
      </div>

      {plan === "credits" && (
        <div className="rounded-xl border border-border bg-card p-4">
          <Label>Nombre de crédits (palier de {CREDIT_STEP})</Label>
          <Input
            type="number"
            min={CREDIT_STEP}
            step={CREDIT_STEP}
            value={credits}
            onChange={(e) => setCredits(clampCredits(parseInt(e.target.value)))}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Exemple : {CREDIT_STEP} crédits = {PRICE_PER_STEP.toLocaleString()} Ar · {CREDIT_STEP * 2} crédits = {(PRICE_PER_STEP * 2).toLocaleString()} Ar · {CREDIT_STEP * 4} crédits = {(PRICE_PER_STEP * 4).toLocaleString()} Ar.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Montant à payer</span>
          <span className="text-3xl font-bold text-primary">{amount.toLocaleString()} Ar</span>
        </div>
        <div className="text-sm space-y-1 pt-3 border-t border-border">
          <p><strong>Numéro Mvola :</strong> 0323911654</p>
          <p><strong>Nom :</strong> RAVELOMANANTSOA URMIN</p>
          <p><strong>Montant :</strong> {amount.toLocaleString()} Ar</p>
          {plan === "ai" && <p className="text-xs text-muted-foreground pt-1">Après validation, votre clé IA personnelle sera active 30 jours sans consommer de crédits DEVWEBIA.</p>}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <Label htmlFor="ref">Référence de la transaction Mvola *</Label>
          <Input id="ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Ex: MP2401..." className="mt-1" />
        </div>
        <div>
          <Label htmlFor="proof">Capture d'écran (optionnel)</Label>
          <Input id="proof" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1" />
        </div>
        <Button onClick={submit} disabled={loading} className="w-full">
          <Upload className="h-4 w-4 mr-2" />Soumettre le paiement
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Historique</h2>
        <div className="space-y-2">
          {payments.data?.length === 0 && <p className="text-sm text-muted-foreground">Aucun paiement.</p>}
          {payments.data?.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm">
              <div>
                <p className="font-medium">{p.amount_ar.toLocaleString()} Ar — {p.kind === "ai_sub" ? "Abo IA (30j)" : `${p.credits} crédits`}</p>
                <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("fr-FR")} · Réf {p.reference}</p>
              </div>
              {p.status === "validated" && <span className="flex items-center gap-1 text-primary"><CheckCircle2 className="h-4 w-4" />Validé</span>}
              {p.status === "pending" && <span className="flex items-center gap-1 text-amber-500"><Clock className="h-4 w-4" />En attente</span>}
              {p.status === "rejected" && <span className="text-destructive">Rejeté</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
