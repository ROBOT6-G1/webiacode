import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db, getAuthToken } from "@/integrations/firebase/client";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { generateSite } from "@/lib/ai.functions";
import { publishSite } from "@/lib/deploy.functions";
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Send, Loader2, Eye, Code, Download, Rocket, ExternalLink, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import JSZip from "jszip";

export const Route = createFileRoute("/_authenticated/app/$projectId")({
  component: ProjectView,
});

function buildPreviewHtml(files: Record<string, string>): string {
  const index = files["index.html"];
  if (!index) {
    return "<html><body style='display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#888'>Aucun contenu</body></html>";
  }
  let html = index;
  html = html.replace(
    /<link([^>]*?)href=["']([^"']+)["']([^>]*)>/gi,
    (match, before: string, href: string, after: string) => {
      const attrs = `${before}${after}`;
      if (!/rel=["']?stylesheet/i.test(attrs)) return match;
      if (/^https?:\/\//i.test(href) || href.startsWith("//")) return match;
      const key = href.replace(/^\.\//, "");
      if (files[key] == null) return match;
      return `<style data-src="${key}">${files[key]}</style>`;
    },
  );
  html = html.replace(
    /<script([^>]*?)src=["']([^"']+)["']([^>]*)><\/script>/gi,
    (match, before: string, src: string, after: string) => {
      if (/^https?:\/\//i.test(src) || src.startsWith("//")) return match;
      const key = src.replace(/^\.\//, "");
      if (files[key] == null) return match;
      const attrs = `${before}${after}`.replace(/\bdefer\b/gi, "").replace(/\basync\b/gi, "");
      return `<script${attrs} data-src="${key}">${files[key]}</script>`;
    },
  );
  return html;
}

type ProjectRow = {
  id: string;
  name: string;
  html_content?: string;
  css_content?: string;
  js_content?: string;
  files: Record<string, string> | null;
  vercel_url: string | null;
  github_repo: string | null;
};

function getFilesMap(p: ProjectRow | null | undefined): Record<string, string> {
  if (!p) return {};
  const f = (p.files ?? {}) as Record<string, string>;
  if (f && Object.keys(f).length) return f;
  const legacy: Record<string, string> = {};
  if (p.html_content) legacy["index.html"] = p.html_content;
  if (p.css_content) legacy["style.css"] = p.css_content;
  if (p.js_content) legacy["script.js"] = p.js_content;
  return legacy;
}

type Question = { q: string; options: string[] };

function parseQuestionsFromMessage(content: string): { text: string; questions: Question[] } {
  const m = content.match(/<!--DEVWEBIA_Q:([A-Za-z0-9+/=]+)-->/);
  if (!m) return { text: content, questions: [] };
  try {
    const decoded = typeof atob === "function" ? atob(m[1]) : Buffer.from(m[1], "base64").toString("utf-8");
    const arr = JSON.parse(decoded) as Question[];
    return { text: content.replace(m[0], "").trim(), questions: arr };
  } catch {
    return { text: content, questions: [] };
  }
}

function ProjectView() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [upToDate, setUpToDate] = useState(false);
  const [tab, setTab] = useState("chat");
  const [streamFile, setStreamFile] = useState<{ path: string; content: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const project = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const snap = await getDoc(doc(db, "projects", projectId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as unknown as ProjectRow;
    },
  });

  const messages = useQuery({
    queryKey: ["messages", projectId],
    queryFn: async () => {
      const q = query(collection(db, "messages"), where("project_id", "==", projectId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
        id: string;
        role: "user" | "assistant";
        content: string;
        created_at?: string;
      }>;
      list.sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
      return list;
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data?.length, streamFile]);

  const runGenerate = async (userPrompt: string) => {
    setLoading(true);
    setStreamFile(null);
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await generateSite({
        data: { projectId, prompt: userPrompt },
        headers,
      });
      const entries = Object.entries(res.files || {});
      for (const [path, content] of entries) {
        const preview = content.slice(0, 600);
        const stepSize = Math.max(8, Math.ceil(preview.length / 40));
        for (let i = 0; i <= preview.length; i += stepSize) {
          setStreamFile({ path, content: preview.slice(0, i) });
          await new Promise((r) => setTimeout(r, 25));
        }
      }
      setStreamFile(null);
      if (entries.length > 0) setUpToDate(false);
      await queryClient.invalidateQueries();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("insufficient_credits")) toast.error("Crédits insuffisants — allez sur /credits");
      else toast.error(msg);
    } finally {
      setStreamFile(null);
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!prompt.trim() || loading) return;
    const p = prompt.trim();
    setPrompt("");
    await runGenerate(p);
  };

  const submitQuiz = async (answers: string) => {
    if (loading) return;
    await runGenerate(answers);
  };

  const download = async () => {
    if (!project.data) return;
    const filesMap = getFilesMap(project.data);
    if (Object.keys(filesMap).length === 0) {
      toast.error("Aucun fichier à télécharger");
      return;
    }
    const zip = new JSZip();
    for (const [path, content] of Object.entries(filesMap)) {
      zip.file(path, content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.data.name.replace(/[^a-z0-9]/gi, "_")}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doPublish = async () => {
    setPublishing(true);
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await publishSite({ data: { projectId }, headers });
      if (res.url) {
        toast.success("Publié ! " + res.url);
        window.open(res.url, "_blank");
      } else {
        toast.success("Déploiement lancé");
      }
      setUpToDate(true);
      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setPublishing(false);
    }
  };

  const filesMap = getFilesMap(project.data);
  const fullHtml = buildPreviewHtml(filesMap);
  const filePaths = Object.keys(filesMap).sort((a, b) =>
    a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b),
  );

  const lastQuestionsMsg = useMemo(() => {
    const list = messages.data ?? [];
    for (let i = list.length - 1; i >= 0; i--) {
      const m = list[i];
      if (m.role !== "assistant") continue;
      const parsed = parseQuestionsFromMessage(m.content);
      if (parsed.questions.length > 0) {
        const followedByUser = list.slice(i + 1).some((mm) => mm.role === "user");
        return followedByUser ? null : { id: m.id, questions: parsed.questions };
      }
      break;
    }
    return null;
  }, [messages.data]);

  const alreadyPublished = !!project.data?.vercel_url;
  const publishLabel = publishing
    ? "Publication…"
    : alreadyPublished
      ? upToDate
        ? "À jour"
        : "Mettre à jour"
      : "Publier";

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
        <div className="border-b border-border px-4 py-2 flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="preview"><Eye className="h-4 w-4 mr-1.5" />Vue site</TabsTrigger>
            <TabsTrigger value="code"><Code className="h-4 w-4 mr-1.5" />Vue code</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            {project.data?.vercel_url && (
              <a href={project.data.vercel_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline px-2">
                <ExternalLink className="h-3.5 w-3.5" />Site live
              </a>
            )}
            <Button variant="outline" size="sm" onClick={download}><Download className="h-4 w-4 mr-1.5" />ZIP</Button>
            <Button
              size="sm"
              onClick={doPublish}
              disabled={publishing || (alreadyPublished && upToDate)}
              variant={alreadyPublished && upToDate ? "outline" : "default"}
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : alreadyPublished && upToDate ? (
                <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-500" />
              ) : (
                <Rocket className="h-4 w-4 mr-1.5" />
              )}
              {publishLabel}
            </Button>
          </div>
        </div>

        <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 m-0">
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.data?.map((m) => {
              const parsed = m.role === "assistant" ? parseQuestionsFromMessage(m.content) : { text: m.content, questions: [] };
              return (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                    <div className="prose prose-sm prose-invert max-w-none [&>*]:my-1"><ReactMarkdown>{parsed.text}</ReactMarkdown></div>
                  </div>
                </div>
              );
            })}
            {lastQuestionsMsg && !loading && (
              <QuizCard
                key={lastQuestionsMsg.id}
                questions={lastQuestionsMsg.questions}
                onSubmit={submitQuiz}
              />
            )}
            {loading && <GeneratingAnimation streamFile={streamFile} />}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-border p-4 space-y-2">
            <div className="rounded-xl border border-border bg-card flex items-end gap-2 p-2">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
                placeholder="Décrivez une modification..."
                rows={2}
                className="border-0 bg-transparent focus-visible:ring-0 resize-none"
                disabled={loading}
              />
              <Button onClick={submit} disabled={loading || !prompt.trim()} size="icon">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => runGenerate("Continue la génération là où tu t'es arrêté. Ne repose pas de questions. Renvoie TOUS les fichiers complets et à jour (index.html, script.js, firebase.js, admin.html, admin.js + tout autre).")}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
                Continuer la génération
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 m-0 bg-white">
          <iframe title="preview" srcDoc={fullHtml} className="w-full h-full border-0" sandbox="allow-scripts" />
        </TabsContent>

        <TabsContent value="code" className="flex-1 m-0 overflow-auto">
          <div className="p-4 space-y-4">
            {filePaths.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun fichier — envoyez un prompt pour générer le site.</p>
            )}
            {filePaths.map((path) => (
              <CodeBlock key={path} title={path} code={filesMap[path]} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuizCard({ questions, onSubmit }: { questions: Question[]; onSubmit: (answers: string) => void }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[][]>(() => questions.map(() => []));
  const [freeText, setFreeText] = useState<string[]>(() => questions.map(() => ""));
  const [submitted, setSubmitted] = useState(false);

  const total = questions.length;
  const isLast = step === total - 1;
  const showSummary = step === total;

  const toggle = (opt: string) => {
    setSelected((prev) => {
      const next = prev.map((a) => [...a]);
      const arr = next[step];
      const i = arr.indexOf(opt);
      if (i >= 0) arr.splice(i, 1);
      else arr.push(opt);
      return next;
    });
  };

  const canProceed = selected[step]?.length > 0 || (freeText[step] ?? "").trim().length > 0;

  const compile = () => {
    const lines: string[] = ["Réponses aux questions :"];
    questions.forEach((q, i) => {
      const parts: string[] = [];
      if (selected[i]?.length) parts.push(selected[i].join(", "));
      if (freeText[i]?.trim()) parts.push(`(précision : ${freeText[i].trim()})`);
      lines.push(`${i + 1}. ${q.q} → ${parts.join(" ") || "(aucune réponse)"}`);
    });
    lines.push("\nGénère maintenant le site complet.");
    return lines.join("\n");
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    onSubmit(compile());
  };

  if (showSummary) {
    return (
      <div className="flex justify-start">
        <div className="w-full max-w-[90%] rounded-2xl bg-card border border-border p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="text-sm font-semibold">Résumé de vos réponses</div>
          <div className="space-y-2 text-sm">
            {questions.map((q, i) => {
              const answers = [...(selected[i] ?? [])];
              if (freeText[i]?.trim()) answers.push(`« ${freeText[i].trim()} »`);
              return (
                <div key={i} className="rounded-lg bg-muted/40 p-2.5">
                  <div className="text-xs text-muted-foreground">{q.q}</div>
                  <div className="mt-1 font-medium">{answers.length ? answers.join(" · ") : "—"}</div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(total - 1)} disabled={submitted}>
              Retour
            </Button>
            <Button onClick={handleSubmit} disabled={submitted}>
              {submitted ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Soumettre et générer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[step];
  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[90%] rounded-2xl bg-card border border-border p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Question {step + 1} / {total}</div>
          <div className="h-1 w-24 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
          </div>
        </div>
        <div className="text-sm font-semibold">{q.q}</div>
        <div className="space-y-2">
          {q.options.map((opt) => {
            const checked = selected[step]?.includes(opt) ?? false;
            return (
              <label
                key={opt}
                className={`flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                  checked ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40"
                }`}
              >
                <Checkbox checked={checked} onCheckedChange={() => toggle(opt)} className="mt-0.5" />
                <span className="text-sm">{opt}</span>
              </label>
            );
          })}
          <div className="rounded-lg border border-dashed border-border p-2.5">
            <div className="text-xs text-muted-foreground mb-1.5">Réponse libre (optionnel — texte, lien, précision…)</div>
            <Textarea
              value={freeText[step]}
              onChange={(e) => {
                const v = e.target.value;
                setFreeText((prev) => prev.map((x, i) => (i === step ? v : x)));
              }}
              rows={2}
              placeholder="Votre précision ou un lien https://…"
              className="text-sm"
            />
          </div>
        </div>
        <div className="flex justify-between pt-1">
          <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Précédent
          </Button>
          {isLast ? (
            <Button size="sm" onClick={() => setStep(total)} disabled={!canProceed}>
              Voir le résumé
            </Button>
          ) : (
            <Button size="sm" onClick={() => setStep((s) => s + 1)} disabled={!canProceed}>
              Suivant
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function languageOf(path: string): string {
  if (path.endsWith(".html")) return "HTML";
  if (path.endsWith(".css")) return "CSS";
  if (path.endsWith(".js")) return "JavaScript";
  if (path.endsWith(".svg")) return "SVG";
  if (path.endsWith(".json") || path.endsWith(".webmanifest")) return "JSON";
  return "Fichier";
}

function GeneratingAnimation({ streamFile }: { streamFile: { path: string; content: string } | null }) {
  const [step, setStep] = useState(0);
  const steps = ["Analyse de votre demande…", "Conception de la palette et de la typographie…", "Structure des sections…", "Génération avec Tailwind CSS v4…"];
  useEffect(() => {
    if (streamFile) return;
    const id = setInterval(() => setStep((s) => (s + 1) % steps.length), 1600);
    return () => clearInterval(id);
  }, [streamFile, steps.length]);

  if (streamFile) {
    return (
      <div className="flex justify-start">
        <div className="w-full max-w-[90%] rounded-2xl bg-card border border-border overflow-hidden animate-in fade-in">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 border-b border-border">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-mono">{streamFile.path}</span>
            <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
              Écriture {languageOf(streamFile.path)}
            </span>
          </div>
          <pre className="text-[11px] leading-relaxed p-3 max-h-56 overflow-hidden font-mono whitespace-pre-wrap break-all">
            <code>{streamFile.content}</code>
            <span className="inline-block w-1.5 h-3 align-middle bg-primary animate-pulse ml-0.5" />
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="rounded-2xl bg-card border border-border px-4 py-3 min-w-[280px] max-w-[80%]">
        <div className="flex items-center gap-3">
          <div className="relative h-6 w-6">
            <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
            <div className="absolute inset-1 rounded-full bg-primary animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground truncate">{steps[step]}</div>
            <div className="mt-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full w-1/3 rounded-full bg-primary/60 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="bg-muted px-4 py-2 text-xs font-mono flex justify-between items-center">
        <span>{title}</span>
        <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(code); toast.success("Copié"); }}>Copier</Button>
      </div>
      <pre className="bg-card p-4 text-xs overflow-auto max-h-96"><code>{code || "// vide"}</code></pre>
    </div>
  );
}
