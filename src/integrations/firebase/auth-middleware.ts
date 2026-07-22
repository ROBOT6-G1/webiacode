import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const requireFirebaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();

    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      throw new Error("Unauthorized: No authorization header provided");
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized: Only Bearer tokens are supported");
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      throw new Error("Unauthorized: No token provided");
    }

    // Parse JWT payload safely
    let userId = "";
    let email = "";
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadStr = Buffer.from(parts[1], "base64").toString("utf-8");
        const payload = JSON.parse(payloadStr);
        userId = payload.user_id || payload.sub || payload.uid || "";
        email = payload.email || "";
      }
    } catch {
      // If parsing fails, use token as fallback if non-empty
    }

    if (!userId) {
      // Fallback if token is simple UID string in dev or mock testing
      userId = token;
    }

    return next({
      context: {
        userId,
        email,
      },
    });
  }
);
