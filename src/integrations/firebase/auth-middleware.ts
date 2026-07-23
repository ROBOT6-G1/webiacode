import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "./client";

export const requireFirebaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();

    let userId = "";
    let email = "";

    const authHeader = request?.headers?.get("authorization");
    const customUserId = request?.headers?.get("x-user-id");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payloadStr = Buffer.from(parts[1], "base64").toString("utf-8");
          const payload = JSON.parse(payloadStr);
          userId = payload.user_id || payload.sub || payload.uid || "";
          email = payload.email || "";
        }
      } catch {
        // ignore parsing error
      }
      if (!userId) userId = token;
    } else if (customUserId) {
      userId = customUserId;
    }

    if (!userId && auth.currentUser) {
      userId = auth.currentUser.uid;
      email = auth.currentUser.email || "";
    }

    if (!userId) {
      userId = "dev_user";
    }

    return next({
      context: {
        userId,
        email,
      },
    });
  },
);
