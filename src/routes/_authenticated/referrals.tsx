import { createFileRoute } from "@tanstack/react-router";
import { auth, db } from "@/integrations/firebase/client";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, Copy, Gift } from "lucide-react";

export const Route = createFileRoute("/_authenticated/referrals")({
  component: Referrals,
});

function Referrals() {
  const profile = useQuery({
    queryKey: ["profile-referral"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return null;
      const snap = await getDoc(doc(db, "profiles", user.uid));
      const code = snap.exists() ? snap.data()?.referral_code : "";

      const q = query(collection(db, "referrals"), where("referrer_id", "==", user.uid));
      const refSnap = await getDocs(q);
      const refs = refSnap.docs.map((d) => d.data());
      const bonus = refs.filter((r) => r.bonus_granted).length * 5;

      return { code, count: refs.length, bonus };
    },
  });

  const url = profile.data?.code ? `${typeof window !== "undefined" ? window.location.origin : ""}/auth?mode=signup&ref=${profile.data.code}` : "";

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2"><Users className="h-8 w-8 text-primary" />Parrainage</h1>
      <p className="text-muted-foreground">Invitez vos amis et gagnez <strong className="text-primary">5 crédits</strong> par inscription !</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Filleuls</p>
          <p className="text-4xl font-bold mt-1">{profile.data?.count ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <p className="text-sm text-muted-foreground flex items-center gap-1"><Gift className="h-4 w-4" />Bonus gagnés</p>
          <p className="text-4xl font-bold mt-1 text-primary">{profile.data?.bonus ?? 0} crédits</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <p className="text-sm font-semibold">Votre lien de parrainage</p>
        <div className="flex gap-2">
          <input readOnly value={url} className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono" />
          <Button onClick={() => { navigator.clipboard.writeText(url); toast.success("Copié !"); }}><Copy className="h-4 w-4 mr-2" />Copier</Button>
        </div>
        <p className="text-xs text-muted-foreground">Code : <span className="font-mono text-primary">{profile.data?.code}</span></p>
      </div>
    </div>
  );
}
