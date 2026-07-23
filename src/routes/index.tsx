import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { auth } from "@/integrations/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { Sparkles, Zap, Globe, Shield, CreditCard, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DEVWEBIA — Générateur de sites IA" },
      {
        name: "description",
        content:
          "Créez, prévisualisez et publiez des sites web complets avec DEVWEBIA et son backend automatisé.",
      },
      { property: "og:title", content: "DEVWEBIA — Générateur de sites IA" },
      {
        property: "og:description",
        content:
          "Générez des sites avec administration, stockage et configuration backend automatisée.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate({ to: "/app" });
      else setChecking(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  if (checking) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">DEVWEBIA</span>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost">
              <Link to="/auth">Se connecter</Link>
            </Button>
            <Button asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Commencer gratuitement
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Powered by Gemini AI
        </div>
        <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-7xl">
          Créez votre <span className="text-primary">site web</span>
          <br />
          en discutant avec l'IA
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          DEVWEBIA transforme vos idées en sites web complets. Discutez, prévisualisez, publiez sur
          Vercel — le tout depuis un seul endroit.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Créer un compte gratuit
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/auth">Se connecter</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          5 crédits offerts à l'inscription — aucune carte requise.
        </p>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 grid gap-6 md:grid-cols-3">
        {[
          { icon: MessageSquare, title: "Chat IA", desc: "Décrivez votre site, l'IA le crée." },
          { icon: Globe, title: "Publish Vercel", desc: "Déployez en un clic sur votre domaine." },
          {
            icon: Shield,
            title: "Sécurité Firebase",
            desc: "Base de données & Auth Firestore intégrés.",
          },
          { icon: Zap, title: "Rapide", desc: "Génération instantanée grâce à Gemini 2.5 Flash." },
          { icon: CreditCard, title: "Prix mini", desc: "À partir de 5000 Ar les 20 crédits." },
          { icon: Sparkles, title: "Parrainage", desc: "+5 crédits par ami parrainé." },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
            <f.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold text-center">Tarification simple</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-8">
            <h3 className="text-xl font-bold">Gratuit</h3>
            <p className="mt-2 text-3xl font-bold">0 Ar</p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>• 5 crédits offerts</li>
              <li>• Jusqu'à 200 utilisateurs sur vos sites</li>
              <li>• Badge "✨ Fait avec DEVWEBIA"</li>
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-primary bg-card p-8 relative">
            <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Recommandé
            </span>
            <h3 className="text-xl font-bold">Pro</h3>
            <p className="mt-2 text-3xl font-bold">
              5 000 Ar<span className="text-base font-normal text-muted-foreground">/mois</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>• +15 crédits bonus</li>
              <li>• Sans badge DEVWEBIA</li>
              <li>• Domaine personnel</li>
              <li>• Utilisateurs illimités sur vos sites (30 jours)</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-border mt-16">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} DEVWEBIA — Créé à Madagascar 🇲🇬
        </div>
      </footer>
    </div>
  );
}
