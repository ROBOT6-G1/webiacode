import { createFileRoute } from "@tanstack/react-router";
import { Plug, Github, Rocket, Database, ExternalLink, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, db } from "@/integrations/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseConfig } from "@/integrations/firebase/config";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/connections")({
  component: Connections,
});

type Integrations = {
  github_token: string;
  github_username: string;
  vercel_token: string;
  vercel_team_id: string;
};

const EMPTY: Integrations = {
  github_token: "",
  github_username: "",
  vercel_token: "",
  vercel_team_id: "",
};

function Connections() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["user_integrations"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return null;
      const snap = await getDoc(doc(db, "user_integrations", user.uid));
      return snap.exists() ? snap.data() : null;
    },
  });

  const [form, setForm] = useState<Integrations>(EMPTY);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setForm((f) => ({
        ...f,
        github_username: data.github_username ?? "",
        vercel_team_id: data.vercel_team_id ?? "",
      }));
    }
  }, [data]);

  const set = (k: keyof Integrations) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(section: "github" | "vercel", fields: Partial<Integrations>) {
    setSaving(section);
    const user = auth.currentUser;
    if (!user) {
      setSaving(null);
      return;
    }
    try {
      const ref = doc(db, "user_integrations", user.uid);
      const snap = await getDoc(ref);
      const prev = snap.exists() ? snap.data() : {};
      await setDoc(ref, { ...prev, user_id: user.uid, ...fields }, { merge: true });
      toast.success("Connexion enregistrée");
      qc.invalidateQueries({ queryKey: ["user_integrations"] });
    } catch (err) {
      toast.error("Erreur d'enregistrement : " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(null);
    }
  }

  const connected = {
    github: !!data?.github_username,
    vercel: !!data?.vercel_team_id || !!form.vercel_token,
    firebase: true,
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Plug className="h-8 w-8 text-primary" />
          Applications connectées
        </h1>
        <p className="text-muted-foreground mt-2">
          Reliez vos comptes via clé API pour publier vos sites automatiquement et utiliser Firebase pour le stockage et l'authentification.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* GITHUB */}
          <IntegrationCard
            icon={Github}
            title="GitHub"
            connected={connected.github}
            description="Obligatoire pour envoyer votre code sur GitHub avant le déploiement Vercel."
            docLink={{ href: "https://github.com/settings/tokens/new?scopes=repo,workflow&description=DEVWEBIA", label: "Générer un token GitHub" }}
          >
            <Field label="Nom d'utilisateur GitHub" placeholder="ex: octocat" value={form.github_username} onChange={set("github_username")} />
            <Field label="Personal Access Token (classic)" type="password" placeholder="ghp_..." value={form.github_token} onChange={set("github_token")} />
            <Button
              onClick={() => save("github", { github_token: form.github_token, github_username: form.github_username })}
              disabled={saving === "github" || !form.github_token}
            >
              {saving === "github" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Enregistrer GitHub
            </Button>
          </IntegrationCard>

          {/* VERCEL */}
          <IntegrationCard
            icon={Rocket}
            title="Vercel"
            connected={connected.vercel}
            description="Déploiement automatique de vos sites en un clic depuis DEVWEBIA."
            docLink={{ href: "https://vercel.com/account/tokens", label: "Créer un token Vercel" }}
          >
            <Field label="Vercel Access Token" type="password" placeholder="vercel_..." value={form.vercel_token} onChange={set("vercel_token")} />
            <Field label="Team ID (optionnel)" placeholder="team_..." value={form.vercel_team_id} onChange={set("vercel_team_id")} />
            <Button
              onClick={() => save("vercel", { vercel_token: form.vercel_token, vercel_team_id: form.vercel_team_id })}
              disabled={saving === "vercel" || !form.vercel_token}
            >
              {saving === "vercel" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Enregistrer Vercel
            </Button>
          </IntegrationCard>

          {/* FIREBASE */}
          <IntegrationCard
            icon={Database}
            title="Firebase (Base de données & Auth)"
            connected={connected.firebase}
            description="Base de données Firestore, Stockage et Authentification connectés pour vos sites générés."
            docLink={{ href: `https://console.firebase.google.com/project/${firebaseConfig.projectId}`, label: "Ouvrir la console Firebase" }}
          >
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-sm font-mono">
              <div><span className="text-muted-foreground">Project ID:</span> {firebaseConfig.projectId}</div>
              <div><span className="text-muted-foreground">Auth Domain:</span> {firebaseConfig.authDomain}</div>
              <div><span className="text-muted-foreground">Firestore DB:</span> {firebaseConfig.firestoreDatabaseId}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              Toutes les inscriptions et données de vos sites web générés sont stockées dans ce projet Firebase.
            </p>
          </IntegrationCard>
        </>
      )}
    </div>
  );
}

function IntegrationCard({
  icon: Icon,
  title,
  description,
  connected,
  docLink,
  children,
}: {
  icon: typeof Github;
  title: string;
  description: string;
  connected: boolean;
  docLink: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {title}
              {connected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-xs font-medium text-primary">
                  <Check className="h-3 w-3" /> Connecté
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </div>
      <a
        href={docLink.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        {docLink.label}
      </a>
      <div className="space-y-3 pt-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Input type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete="off" />
    </div>
  );
}
