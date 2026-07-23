import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { auth, db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Globe, Server, CheckCircle2, Clock, Trash2, ArrowRight, ShieldCheck, Copy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/domain")({
  component: Domain,
});

function Domain() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const domains = useQuery({
    queryKey: ["firebase-domains"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return [];
      const q = query(collection(db, "custom_domains"), where("user_id", "==", user.uid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
        id: string;
        domain: string;
        status: string;
        created_at: string;
      }>;
    },
  });

  const add = async () => {
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!cleanDomain) {
      toast.error("Veuillez saisir un nom de domaine valide (ex: monentreprise.mg)");
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Vous devez être connecté");

      await addDoc(collection(db, "custom_domains"), {
        user_id: user.uid,
        domain: cleanDomain,
        status: "pending",
        created_at: new Date().toISOString(),
      });

      toast.success(`Domaine ${cleanDomain} enregistré ! Suivez les étapes de configuration DNS ci-dessous.`);
      setDomain("");
      queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const removeDomain = async (id: string, domainName: string) => {
    if (!confirm(`Voulez-vous supprimer le domaine ${domainName} ?`)) return;
    try {
      await deleteDoc(doc(db, "custom_domains", id));
      toast.success("Domaine supprimé.");
      queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié !`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Globe className="h-8 w-8 text-primary" />
          Domaine Personnalisé & DNS
        </h1>
        <p className="text-muted-foreground mt-1">
          Liez votre propre nom de domaine (ex: <span className="font-mono text-primary font-medium">boutique.mg</span>, <span className="font-mono text-primary font-medium">monentreprise.com</span>) à vos sites web générés sur DEVWEBIA.
        </p>
      </div>

      {/* Domain Addition Form */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-lg font-bold">
          <Server className="h-5 w-5 text-primary" />
          Ajouter un nouveau domaine
        </div>
        <div className="space-y-2">
          <Label htmlFor="domain-input">Nom de domaine</Label>
          <div className="flex gap-2 sm:flex-row flex-col">
            <Input
              id="domain-input"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Ex: boutique.mg ou www.monentreprise.com"
              className="flex-1"
            />
            <Button onClick={add} disabled={loading} className="font-semibold">
              {loading ? "Enregistrement..." : "Ajouter le Domaine"}
            </Button>
          </div>
        </div>
      </div>

      {/* DNS Setup Guide */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          Guide de Configuration DNS (Obligatoire chez votre fournisseur de domaine)
        </h3>
        <p className="text-sm text-muted-foreground">
          Pour que votre domaine pointe vers vos sites DEVWEBIA, connectez-vous au panneau de votre fournisseur de domaine (OVH, Hostinger, GoDaddy, LWS, Namecheap, etc.) et ajoutez ces deux enregistrements DNS :
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <span>Type A (Domaine Racine)</span>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">Recommandé</span>
            </div>
            <div className="space-y-1 font-mono text-sm">
              <p><span className="text-muted-foreground">Nom :</span> <strong>@</strong> (ou vide)</p>
              <div className="flex justify-between items-center bg-muted p-2 rounded-lg">
                <span><span className="text-muted-foreground">Valeur :</span> <strong>76.76.21.21</strong></span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyToClipboard("76.76.21.21", "Adresse IP Vercel")}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <span>Type CNAME (Sous-domaine www)</span>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">Recommandé</span>
            </div>
            <div className="space-y-1 font-mono text-sm">
              <p><span className="text-muted-foreground">Nom :</span> <strong>www</strong></p>
              <div className="flex justify-between items-center bg-muted p-2 rounded-lg">
                <span><span className="text-muted-foreground">Valeur :</span> <strong>cname.vercel-dns.com</strong></span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyToClipboard("cname.vercel-dns.com", "Target CNAME")}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic">
          💡 Remarque : La propagation DNS mondiale peut prendre entre 5 minutes et 24 heures selon votre registraire.
        </p>
      </div>

      {/* List of Configured Domains */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold">Vos Domaines Enregistrés ({domains.data?.length ?? 0})</h3>
        {(!domains.data || domains.data.length === 0) ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border text-muted-foreground text-sm">
            Aucun domaine personnalisé enregistré pour le moment.
          </div>
        ) : (
          <div className="space-y-3">
            {domains.data.map((d) => (
              <div key={d.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border border-border bg-card gap-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-mono font-bold text-base">{d.domain}</span>
                    <p className="text-xs text-muted-foreground">
                      Ajouté le {new Date(d.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
                  {d.status === "active" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Actif & Sécurisé
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Clock className="h-3.5 w-3.5" />
                      En attente de propagation DNS
                    </span>
                  )}

                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeDomain(d.id, d.domain)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}