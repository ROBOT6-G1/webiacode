import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachFirebaseAuth } from "@/integrations/firebase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    // Server-function calls expect JSON, not the fullscreen HTML error page.
    const url = request?.url ?? "";
    if (url.includes("/_serverFn/")) {
      return new Response(JSON.stringify({ error: message || "Erreur serveur" }), {
        status: 500,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachFirebaseAuth],
  requestMiddleware: [errorMiddleware],
}));
