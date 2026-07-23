import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/preview")({
  component: PreviewIndex,
});

function PreviewIndex() {
  const projects = useQuery({
    queryKey: ["projects-preview"],
    queryFn: async () =>
      (
        await supabase
          .from("projects")
          .select("id, name, updated_at")
          .order("updated_at", { ascending: false })
      ).data ?? [],
  });
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Eye className="h-8 w-8 text-primary" />
        Preview des sites
      </h1>
      <p className="text-muted-foreground mt-1">
        Cliquez sur un projet pour voir le site, le code, télécharger le ZIP ou publier.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {projects.data?.length === 0 && (
          <p className="text-muted-foreground col-span-full text-sm">
            Aucun projet —{" "}
            <Link to="/app" className="text-primary hover:underline">
              créez-en un
            </Link>
            .
          </p>
        )}
        {projects.data?.map((p) => (
          <Link
            key={p.id}
            to="/app/$projectId"
            params={{ projectId: p.id }}
            className="rounded-2xl border border-border bg-card p-4 hover:border-primary/50 transition-colors"
          >
            <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 mb-3 flex items-center justify-center">
              <Eye className="h-8 w-8 text-primary/50" />
            </div>
            <p className="font-semibold truncate">{p.name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(p.updated_at).toLocaleDateString("fr-FR")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
