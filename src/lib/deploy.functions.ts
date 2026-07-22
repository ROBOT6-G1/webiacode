import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { adminDb } from "@/integrations/firebase/admin";
import { z } from "zod";

function toBase64(str: string): string {
  return Buffer.from(str, "utf-8").toString("base64");
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "site"
  );
}

export const publishSite = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const integ = await adminDb.getUserIntegrations(userId);

    const missing: string[] = [];
    if (!integ?.github_token) missing.push("Token GitHub");
    if (!integ?.github_username) missing.push("Nom d'utilisateur GitHub");
    if (!integ?.vercel_token) missing.push("Token Vercel");
    if (missing.length) {
      throw new Error(`Configuration incomplète — allez sur /connections et renseignez : ${missing.join(", ")}.`);
    }

    const project = await adminDb.getProject(data.projectId);
    if (!project) throw new Error("Projet introuvable");

    const files: Record<string, string> = project.files || {};
    if (!files["index.html"]) throw new Error("Aucun index.html à publier");

    const ghToken = integ!.github_token!;
    const ghUser = integ!.github_username!;
    const vercelToken = integ!.vercel_token!;
    const vercelTeam = integ!.vercel_team_id?.trim() || null;

    const teamQS = vercelTeam ? `?teamId=${encodeURIComponent(vercelTeam)}` : "";

    const repoName = project.github_repo?.split("/").pop() || `devwebia-${slugify(project.name)}-${data.projectId.slice(0, 6)}`;
    let repoFullName = project.github_repo ?? `${ghUser}/${repoName}`;

    // Sync files to GitHub (best effort, non-blocking for Vercel deployment)
    try {
      let repoExists = false;
      if (project.github_repo) {
        const checkRes = await fetch(`https://api.github.com/repos/${project.github_repo}`, {
          headers: {
            Authorization: `Bearer ${ghToken}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "DEVWEBIA",
          },
        });
        if (checkRes.ok) {
          repoExists = true;
          repoFullName = project.github_repo;
        }
      }

      if (!repoExists) {
        const createRepoRes = await fetch("https://api.github.com/user/repos", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ghToken}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "DEVWEBIA",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: repoName,
            description: `Site généré par DEVWEBIA — ${project.name}`,
            private: false,
            auto_init: true,
          }),
        });

        if (createRepoRes.ok) {
          const createJson = (await createRepoRes.json()) as { full_name?: string };
          repoFullName = createJson.full_name || `${ghUser}/${repoName}`;
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else if (createRepoRes.status === 422) {
          repoFullName = `${ghUser}/${repoName}`;
        } else {
          console.warn("GitHub create repo notice:", await createRepoRes.text());
        }
      }

      for (const [path, content] of Object.entries(files)) {
        const encodedPath = path.split("/").map((p) => encodeURIComponent(p)).join("/");

        let sha: string | undefined;
        try {
          const getRes = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${encodedPath}`, {
            headers: {
              Authorization: `Bearer ${ghToken}`,
              Accept: "application/vnd.github+json",
              "User-Agent": "DEVWEBIA",
            },
          });
          if (getRes.ok) {
            const j = (await getRes.json()) as { sha?: string };
            sha = j.sha;
          }
        } catch {
          // ignore get content error
        }

        const putRes = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${encodedPath}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${ghToken}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "DEVWEBIA",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `DEVWEBIA update ${path}`,
            content: toBase64(content),
            sha,
          }),
        });

        if (!putRes.ok) {
          console.warn(`GitHub upload warning for ${path}: ${putRes.status}`, await putRes.text());
        }
      }
    } catch (ghError) {
      console.warn("GitHub sync skipped due to error:", ghError);
    }

    let vercelProjectId = project.vercel_project_id ?? null;
    if (!vercelProjectId) {
      const findRes = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(repoName)}${teamQS}`, {
        headers: { Authorization: `Bearer ${vercelToken}` },
      });
      if (findRes.ok) {
        const j = (await findRes.json()) as { id?: string };
        vercelProjectId = j.id ?? null;
      }
      if (!vercelProjectId) {
        const createProjRes = await fetch(`https://api.vercel.com/v10/projects${teamQS}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: repoName, framework: null }),
        });
        if (!createProjRes.ok) {
          throw new Error(`Vercel create project: ${createProjRes.status} ${await createProjRes.text()}`);
        }
        const j = (await createProjRes.json()) as { id: string };
        vercelProjectId = j.id;
      }
    }

    const deployFiles = Object.entries(files).map(([path, content]) => ({
      file: path,
      data: content,
    }));

    const deployRes = await fetch(`https://api.vercel.com/v13/deployments${teamQS}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: repoName,
        project: vercelProjectId,
        target: "production",
        files: deployFiles,
        projectSettings: { framework: null },
      }),
    });
    if (!deployRes.ok) {
      throw new Error(`Vercel deploy: ${deployRes.status} ${await deployRes.text()}`);
    }
    const deployJson = (await deployRes.json()) as { url?: string; alias?: string[] };
    const liveUrl = (deployJson.alias && deployJson.alias[0]) || deployJson.url || null;
    const finalUrl = liveUrl ? `https://${liveUrl}` : null;

    await adminDb.updateProject(data.projectId, {
      github_repo: repoFullName,
      vercel_project_id: vercelProjectId,
      vercel_url: finalUrl,
    });

    return { url: finalUrl, repo: repoFullName };
  });
