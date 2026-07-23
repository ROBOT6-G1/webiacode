import { type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { auth, firebaseSignOut, db } from "@/integrations/firebase/client";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit as limitQuery } from "firebase/firestore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  MessageSquare,
  CreditCard,
  Plug,
  HelpCircle,
  Headphones,
  Users,
  Globe,
  LogOut,
  Coins,
  Shield,
  Plus,
  BrainCircuit,
  ShieldAlert,
  Smartphone,
  MapPin,
  Lock,
} from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const queryClient = useQueryClient();

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return null;
      const snap = await getDoc(doc(db, "profiles", user.uid));
      const profileData = snap.exists() ? snap.data() : null;

      const roleSnap = await getDoc(doc(db, "user_roles", user.uid));
      const isAdminRole = roleSnap.exists() && roleSnap.data()?.role === "admin";
      const isSuperAdminEmail =
        user.email === "horlandobe@gmail.com" ||
        user.email === "boutiquemevasoa@gmail.com";
      const isAdmin = isAdminRole || isSuperAdminEmail;
      return { ...profileData, isAdmin };
    },
  });

  const projects = useQuery({
    queryKey: ["projects-list"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return [];
      const q = query(
        collection(db, "projects"),
        where("user_id", "==", user.uid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{ id: string; name: string; updated_at?: string }>;
      list.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
      return list.slice(0, 30);
    },
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await firebaseSignOut(auth);
    navigate({ to: "/auth", replace: true });
  };

  const nav = [
    { title: "Chat", url: "/app" as const, icon: MessageSquare },
    { title: "Recharger crédits", url: "/credits" as const, icon: CreditCard },
    { title: "Ma clé IA", url: "/ai-settings" as const, icon: BrainCircuit },
    { title: "Applications", url: "/connections" as const, icon: Plug },
    { title: "FAQ", url: "/faq" as const, icon: HelpCircle },
    { title: "Support client", url: "/support" as const, icon: Headphones },
    { title: "Parrainage", url: "/referrals" as const, icon: Users },
    { title: "Domaine", url: "/domain" as const, icon: Globe },
  ];

  // Check if current user is suspended for multi-account violations
  const isSuspended = profile.data?.status === "suspended" || profile.data?.is_suspended === true;

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-destructive/40 rounded-2xl p-6 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Lock className="h-5 w-5 text-destructive" />
              Compte Suspendu
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {profile.data?.suspension_reason ||
                "Un nouveau compte a été créé ou utilisé sur cet appareil. Votre ancien compte a été automatiquement suspendu pour empêcher le cumul abusif de crédits multi-comptes."}
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-xl text-left space-y-2 text-xs font-mono border border-border">
            <p className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" /> Appareil :</span>
              <span className="text-foreground font-semibold">{profile.data?.device_id || "Détecté"}</span>
            </p>
            {profile.data?.suspended_at && (
              <p className="flex items-center justify-between text-muted-foreground">
                <span>Date suspension :</span>
                <span className="text-foreground">{new Date(profile.data.suspended_at).toLocaleString("fr-FR")}</span>
              </p>
            )}
            <p className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Statut Sécurité :</span>
              <span className="text-destructive font-semibold">Firebase Security Enforced</span>
            </p>
          </div>

          <Button variant="destructive" className="w-full font-bold" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Se Déconnecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border">
            <Link to="/app" className="flex items-center gap-2 px-2 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-base font-bold tracking-tight group-data-[collapsible=icon]:hidden">DEVWEBIA</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {nav.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={pathname === item.url}>
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {profile.data?.isAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/admin")}>
                        <Link to="/admin"><Shield className="h-4 w-4" /><span>Admin</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Historique projets</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/app"><Plus className="h-4 w-4" /><span>Nouveau projet</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {projects.data?.map((p) => (
                    <SidebarMenuItem key={p.id}>
                      <SidebarMenuButton asChild isActive={pathname === `/app/${p.id}`}>
                        <Link to="/app/$projectId" params={{ projectId: p.id }}>
                          <MessageSquare className="h-4 w-4" />
                          <span className="truncate">{p.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <div className="p-2 border-t border-sidebar-border">
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" /><span className="group-data-[collapsible=icon]:hidden">Se déconnecter</span>
            </Button>
          </div>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 gap-4 bg-card/50 backdrop-blur">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-sm">
                <Coins className="h-4 w-4 text-primary" />
                <span className="font-semibold text-primary">{profile.data?.credits ?? 0}</span>
                <span className="text-muted-foreground text-xs">crédits WEB IA</span>
              </div>
              {profile.data?.plan === "pro" && (
                <span className="rounded-full bg-accent/20 border border-accent/40 px-3 py-1 text-xs font-semibold text-accent">PRO</span>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
