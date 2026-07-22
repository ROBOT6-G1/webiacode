import { createFileRoute } from "@tanstack/react-router";

/**
 * DEVWEBIA automation endpoint.
 *
 * POST /api/public/devwebia/sql
 * Headers:
 *   x-devwebia-secret: <DEVWEBIA_SQL_SECRET>
 *   Content-Type: application/json
 * Body: { "sql": "CREATE TABLE ..." }
 *
 * Ny IA (DEVWEBIA) afaka manoratra table na manao configuration
 * mivantana amin'ny base de données amin'ny alalan'ity endpoint ity,
 * mampiasa ny service_role tao ambadika. Tsy mila client mihitsy.
 */
export const Route = createFileRoute("/api/public/devwebia/sql")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const providedSecret = request.headers.get("x-devwebia-secret");
        const expectedSecret = process.env.DEVWEBIA_SQL_SECRET;

        if (!expectedSecret) {
          return json({ error: "Server misconfigured: DEVWEBIA_SQL_SECRET missing" }, 500);
        }
        if (!providedSecret || providedSecret !== expectedSecret) {
          return json({ error: "Unauthorized" }, 401);
        }

        let payload: { sql?: unknown };
        try {
          payload = (await request.json()) as { sql?: unknown };
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const sql = payload.sql;
        if (typeof sql !== "string" || sql.trim().length === 0) {
          return json({ error: "Missing `sql` string in body" }, 400);
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const rpc = supabaseAdmin.rpc.bind(supabaseAdmin) as unknown as (
            fn: string,
            args: Record<string, unknown>,
          ) => Promise<{ data: unknown; error: { message: string } | null }>;

          const { data, error } = await rpc("exec_sql", { query: sql });

          if (error) return json({ error: error.message }, 400);
          return json({ ok: true, result: data });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[devwebia/sql]", message, err);
          return json({ error: message }, 500);
        }
      },
    },
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
