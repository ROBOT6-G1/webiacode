import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, googleProvider, db } from "@/integrations/firebase/config";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, increment } from "firebase/firestore";
import { enforceDeviceSecurity } from "@/lib/security";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional().default("signin"),
  ref: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate({ to: "/app" });
    });
    return () => unsubscribe();
  }, [navigate]);

  const ensureProfile = async (uid: string, userEmail: string, displayName?: string) => {
    const profRef = doc(db, "profiles", uid);
    const snap = await getDoc(profRef);
    if (!snap.exists()) {
      const myReferralCode = `REF-${uid.slice(0, 6).toUpperCase()}`;
      let referredByCode = search.ref || "";

      // Handle referral bonus if valid referral code present
      if (referredByCode) {
        try {
          // Find referrer profile by referral_code or id
          let referrerId = "";
          const refQuery = query(collection(db, "profiles"), where("referral_code", "==", referredByCode));
          const refSnap = await getDocs(refQuery);
          if (!refSnap.empty) {
            referrerId = refSnap.docs[0].id;
          } else {
            const directDoc = await getDoc(doc(db, "profiles", referredByCode));
            if (directDoc.exists()) referrerId = directDoc.id;
          }

          if (referrerId && referrerId !== uid) {
            // Check how many referrals the referrer already has
            const existingRefsQuery = query(collection(db, "referrals"), where("referrer_id", "==", referrerId));
            const existingRefsSnap = await getDocs(existingRefsQuery);
            const existingCount = existingRefsSnap.size;

            const canGetBonus = existingCount < 10;
            if (canGetBonus) {
              // Add 5 credits bonus to referrer
              await updateDoc(doc(db, "profiles", referrerId), {
                credits: increment(5),
              });
              await addDoc(collection(db, "referrals"), {
                referrer_id: referrerId,
                referred_user_id: uid,
                referred_email: userEmail,
                bonus_granted: true,
                bonus_credits: 5,
                created_at: new Date().toISOString(),
              });
            } else {
              // Limit reached (>10 referrals), no bonus granted
              await addDoc(collection(db, "referrals"), {
                referrer_id: referrerId,
                referred_user_id: uid,
                referred_email: userEmail,
                bonus_granted: false,
                bonus_credits: 0,
                note: "Limite de 10 parrainages rémunérés atteinte",
                created_at: new Date().toISOString(),
              });
            }
          }
        } catch (err) {
          console.warn("Referral processing notice:", err);
        }
      }

      await setDoc(profRef, {
        id: uid,
        email: userEmail,
        display_name: displayName || name || userEmail.split("@")[0],
        credits: 5,
        plan: "free",
        referral_code: myReferralCode,
        referred_by: referredByCode,
        created_at: new Date().toISOString(),
      });
    }

    // Run security anti-multi-account check
    const secResult = await enforceDeviceSecurity(uid, userEmail);
    if (secResult.isSuspended) {
      toast.error("🔒 " + (secResult.reason || "Ce compte est suspendu."));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await ensureProfile(cred.user.uid, cred.user.email || email, name);
        toast.success("Compte créé ! Bienvenue sur DEVWEBIA.");
        navigate({ to: "/app" });
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await ensureProfile(cred.user.uid, cred.user.email || email);
        navigate({ to: "/app" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'authentification");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        await ensureProfile(res.user.uid, res.user.email || "", res.user.displayName || "");
        navigate({ to: "/app" });
      }
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      const code = errorObj?.code || "";
      const msg = errorObj?.message || String(err);
      if (code === "auth/unauthorized-domain" || msg.includes("unauthorized-domain")) {
        const host = typeof window !== "undefined" ? window.location.hostname : "votre-domaine.vercel.app";
        toast.error(
          `Domaine non autorisé dans Firebase (${host}). Pour activer la connexion Google sur Vercel, ajoutez ${host} dans la Console Firebase > Authentication > Paramètres > Domaines autorisés. Vous pouvez vous connecter par Email & Mot de passe ci-dessous.`,
          { duration: 8000 }
        );
      } else {
        toast.error(msg || "Erreur Google sign-in");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">DEVWEBIA</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8">
          <h1 className="text-2xl font-bold">
            {mode === "signup" ? "Créer un compte" : "Se connecter"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup" ? "5 crédits offerts pour commencer." : "Continuez à créer votre site."}
          </p>

          <Button onClick={google} variant="outline" className="w-full mt-6">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continuer avec Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" />OU<div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Nom</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "..." : mode === "signup" ? "Créer mon compte" : "Se connecter"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
            <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="text-primary hover:underline">
              {mode === "signup" ? "Se connecter" : "Créer un compte"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
