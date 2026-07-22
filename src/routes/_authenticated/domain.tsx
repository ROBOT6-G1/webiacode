import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Globe } from "lucide-react";

export const Route = createFileRoute("/_authenticated/domain")({
  component: Domain,
});

function Domain() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const domains = useQuery({
    queryKey: ["domains"],
    queryFn: async () => {
      const { data } = await supabase.from("custom_domains").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const add = async () => {
    if (!domain.trim()) return;
    setLoading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) throw new Error("Non connecté");
      const { error } = await supabase.from("custom_domains").insert({
        user_id: userRes.user.id,
        domain: domain.trim().toLowerCase(),
        status: "pending",
      });
      if (error) throw error;
      toast.success("Domaine ajouté ! L'IA configurera Vercel automatiquement.");
      setDomain("");
      queryClient.invalidateQueries();
    } catch (err) { toast.error(err instanceof Error ? err.message : String(err)); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2"><Globe className="h-8 w-8 text-primary" />Domaine personnalisé</h1>
      <p className="text-muted-foreground">Connectez votre propre domaine (Plan PRO requis). Notre IA configure Vercel pour vous.</p>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <Label>Nom de domaine</Label>
        <div className="flex gap-2">
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="mondomaine.mg" />
          <Button onClick={add} disabled={loading}>Ajouter</Button>
        </div>
      </div>

      <div className="space-y-2">
        {domains.data?.map((d) => (
          <div key={d.id} className="flex justify-between items-center rounded-lg border border-border bg-card p-3">
            <span className="font-mono text-sm">{d.domain}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{d.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}