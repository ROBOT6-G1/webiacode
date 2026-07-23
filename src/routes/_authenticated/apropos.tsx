import { createFileRoute } from "@tanstack/react-router";
import {
  Info,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  Sparkles,
  Globe,
  HeartHandshake,
  Cpu,
  Lock,
  CheckCircle2,
  Award,
  Terminal,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/apropos")({
  component: AproposComponent,
});

function AproposComponent() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Hero Header */}
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-primary/10 text-primary shrink-0">
            <Sparkles className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">À propos de DEVWEBIA</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Plateforme SaaS révolutionnaire de génération de sites web professionnels, PWA et CMS
              administrables par Intelligence Artificielle.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-border">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Calendar className="h-5 w-5 text-primary" /> Date de Fondation & Origine du Projet
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Le projet officiel DEVWEBIA a démarré et a été fondé le{" "}
              <strong className="text-foreground">23 Juillet 2026</strong>. Né de la vision d'offrir
              aux entrepreneurs, PME et créateurs à Madagascar et à l'international un outil
              ultra-puissant pour digitaliser leur activité en quelques clics sans compétences en
              programmation.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Cpu className="h-5 w-5 text-primary" /> Rotation Intelligente Multi-IA
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La plateforme intègre une rotation transparente entre 9+ modèles IA de pointe (Gemini
              2.5 Flash, 3.6 Flash, 3.5 Flash, 2.5 Pro, etc.). Si un modèle sature, le système
              bascule automatiquement sur le suivant pour garantir une génération de code 100%
              ininterrompue.
            </p>
          </div>
        </div>
      </div>

      {/* Pillars / Features */}
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 w-fit">
            <Globe className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold">Sites Pro & PWA</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Chaque site généré comprend un design responsive soigné, un catalogue interactif, des
            Hero multiples, un sitemap.xml, des balises open-graph et un support PWA installable sur
            smartphone.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 w-fit">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold">CMS & Sécurité PIN</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Espace admin sécurisé par code PIN, chiffrement SHA-256, synchronisation en temps réel
            avec Firebase Firestore et module AUTO-SEO avec Google Ping direct.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 w-fit">
            <Award className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold">Paiement Orange Money</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Recharges de crédits et abonnements simplifiés via Orange Money Malagasy, avec
            validation rapide et suivi transparent des transactions.
          </p>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-3">
          <HeartHandshake className="h-6 w-6 text-primary" /> Contactez l'Équipe Dirigeante &
          Support
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pour toute question, assistance technique, partenariat, ou validation de recharges Orange
          Money (au numéro 0323911654 au nom de RAVELOMANANTSOA URMIN), vous pouvez nous joindre
          directement :
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <a
            href="tel:0323911654"
            className="flex items-center gap-4 p-5 rounded-2xl bg-muted/50 border border-border hover:border-primary/50 transition group shadow-sm"
          >
            <div className="p-4 rounded-xl bg-orange-500/10 text-orange-500 group-hover:scale-105 transition">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Téléphone / WhatsApp / Orange Money
              </p>
              <p className="text-lg font-extrabold text-foreground tracking-wide">0323911654</p>
              <p className="text-[11px] text-muted-foreground">RAVELOMANANTSOA URMIN</p>
            </div>
          </a>

          <a
            href="mailto:horlandobe@gmail.com"
            className="flex items-center gap-4 p-5 rounded-2xl bg-muted/50 border border-border hover:border-primary/50 transition group shadow-sm"
          >
            <div className="p-4 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-105 transition">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">E-mail Officiel & Support</p>
              <p className="text-base font-extrabold text-foreground truncate max-w-[220px]">
                horlandobe@gmail.com
              </p>
              <p className="text-[11px] text-muted-foreground">Réponse sous 24h</p>
            </div>
          </a>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          DEVWEBIA Corporation — Madagascar
        </p>
        <p className="text-sm text-muted-foreground">
          Tous droits réservés © 2026. Fondé le 23 Juillet 2026. L'excellence de la création web
          propulsée par l'Intelligence Artificielle.
        </p>
      </div>
    </div>
  );
}
