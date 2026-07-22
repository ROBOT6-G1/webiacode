import { createMiddleware } from "@tanstack/react-start";
import { getAuthToken } from "./client";

export const attachFirebaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const token = await getAuthToken();
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
);
