import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { auth, db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Headphones, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/support")({
  component: Support,
});

function Support() {
  const [msg, setMsg] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const tickets = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return [];
      const q = query(collection(db, "support_tickets"), where("user_id", "==", user.uid));
      const snap = await getDocs(q);
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

  const submit = async () => {
    if (!msg.trim()) return;
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Non connecté");

      await addDoc(collection(db, "support_tickets"), {
        user_id: user.uid,
        message: msg.trim(),
        image_url: file ? file.name : null,
        status: "open",
        created_at: new Date().toISOString(),
      });

      toast.success("Message envoyé au support !");
      setMsg(""); setFile(null);
      queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2"><Headphones className="h-8 w-8 text-primary" />Support client</h1>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div>
          <Label>Votre message</Label>
          <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={5} placeholder="Décrivez votre problème..." className="mt-1" />
        </div>
        <div>
          <Label>Image (optionnel)</Label>
          <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1" />
        </div>
        <Button onClick={submit} disabled={loading}><Send className="h-4 w-4 mr-2" />Envoyer</Button>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-3">Vos tickets</h2>
        <div className="space-y-3">
          {tickets.data?.length === 0 && <p className="text-sm text-muted-foreground">Aucun ticket.</p>}
          {tickets.data?.map((t) => (
            <div key={t.id} className="rounded-lg border border-border bg-card p-4 text-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("fr-FR")}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{t.status}</span>
              </div>
              <p className="whitespace-pre-wrap">{t.message}</p>
              {t.admin_reply && <div className="mt-3 pt-3 border-t border-border"><p className="text-xs text-primary font-semibold mb-1">Réponse admin :</p><p className="whitespace-pre-wrap">{t.admin_reply}</p></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
