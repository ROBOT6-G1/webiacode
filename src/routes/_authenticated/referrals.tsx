import { createFileRoute } from "@tanstack/react-router";
import { auth, db } from "@/integrations/firebase/client";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, Copy, Gift, AlertCircle, CheckCircle2, UserCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/referrals")({
  component: Referrals,
});

function Referrals() {
  const profile = useQuery({
    queryKey: ["profile-referral"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return null;
      const profRef = doc(db, "profiles", user.uid);
      const snap = await getDoc(profRef);
      let code = snap.exists() ? snap.data()?.referral_code : "";

      // Auto-generate code if user doesn't have one
      if (!code) {
        code = `REF-${user.uid.slice(0, 6).toUpperCase()}`;
        await setDoc(profRef, { referral_code: code }, { merge: true });
      }

      const q = query(collection(db, "referrals"), where("referrer_id", "==", user.uid));
      const refSnap = await getDocs(q);
      const refs = refSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
        id: string;
        referred_email?: string;
        bonus_granted?: boolean;
        created_at?: string;
      }>;

      const paidCount = refs.filter((r) => r.bonus_granted).length;
      const bonus = paidCount * 5;

      return { code, count: refs.length, paidCount, bonus, list: refs };
    },
  });

  const url = profile.data?.code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/auth?mode=signup&ref=${profile.data.code}`
    : "";
  const paidCount = profile.data?.paidCount ?? 0;
  const isMaxReached = paidCount >= 10;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Programme de Parrainage
        </h1>
        <p className="text-muted-foreground mt-1">
          Invitez vos amis à rejoindre DEVWEBIA et gagnez{" "}
          <strong className="text-primary">5 crédits bonus</strong> par ami inscrit (limité à{" "}
          <strong>10 amis maximum</strong>, soit jusqu'à <strong>50 crédits offerts</strong>).
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Filleuls Inscrits</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-4xl font-bold">{profile.data?.count ?? 0}</p>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-primary/10 text-primary">
              {paidCount} / 10 rémunérés
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Gift className="h-4 w-4" />
            Bonus Gagnés
          </p>
          <p className="text-4xl font-bold mt-1 text-primary">{profile.data?.bonus ?? 0} crédits</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <div className="flex justify-between items-center text-sm font-medium">
          <span>Progression du Bonus (Max 10 amis)</span>
          <span className="text-primary font-bold">{paidCount} / 10</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (paidCount / 10) * 100)}%` }}
          />
        </div>
        {isMaxReached ? (
          <p className="text-xs text-amber-500 font-semibold flex items-center gap-1 mt-2">
            <AlertCircle className="h-4 w-4" />
            Limite atteinte ! Vous avez déjà reçu le bonus maximum pour 10 amis parrainés.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Il vous reste {10 - paidCount} place(s) éligible(s) pour obtenir 5 crédits gratuits par
            ami.
          </p>
        )}
      </div>

      {/* Referral Link Box */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <p className="text-sm font-semibold">Votre lien de parrainage exclusif</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 rounded-xl bg-muted px-3 py-2 text-sm font-mono border border-border"
          />
          <Button
            onClick={() => {
              navigator.clipboard.writeText(url);
              toast.success("Lien copié dans le presse-papier !");
            }}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copier
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Code de parrainage :{" "}
          <span className="font-mono font-bold text-primary">{profile.data?.code}</span>
        </p>
      </div>

      {/* List of Referred Users */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          Historique de vos Filleuls ({profile.data?.list?.length ?? 0})
        </h3>

        {!profile.data?.list || profile.data.list.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Aucun ami n'a encore utilisé votre lien. Partagez votre lien de parrainage pour recevoir
            des crédits !
          </p>
        ) : (
          <div className="space-y-2">
            {profile.data.list.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30 text-sm"
              >
                <div>
                  <p className="font-medium">{item.referred_email || "Utilisateur anonyme"}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Inscrit"}
                  </p>
                </div>
                <div>
                  {item.bonus_granted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      +5 Crédits
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                      Sans bonus (Max 10 dépassé)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
