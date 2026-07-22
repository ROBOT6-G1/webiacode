import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { adminDb } from "@/integrations/firebase/admin";
import { z } from "zod";

export const approvePayment = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .validator((input: unknown) =>
    z.object({
      paymentId: z.string(),
      action: z.enum(["validated", "rejected"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const payment = await adminDb.getPayment(data.paymentId);
    if (!payment) throw new Error("payment_not_found");
    if (payment.status !== "pending") throw new Error("payment_already_processed");

    await adminDb.updatePayment(data.paymentId, {
      status: data.action,
      validated_at: new Date().toISOString(),
      validated_by: userId,
    });

    if (data.action === "validated") {
      const profile = await adminDb.getProfile(payment.user_id);
      const currentCredits = profile?.credits ?? 0;

      if (payment.kind !== "ai_sub" && payment.credits > 0) {
        await adminDb.updateProfile(payment.user_id, {
          credits: currentCredits + payment.credits,
        });
      }

      if (payment.kind === "pro") {
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await adminDb.updateProfile(payment.user_id, {
          plan: "pro",
          plan_expires_at: expires.toISOString(),
        });
      }

      if (payment.kind === "ai_sub") {
        const currentExp = profile?.ai_sub_expires_at ? new Date(profile.ai_sub_expires_at) : new Date();
        const base = currentExp.getTime() > Date.now() ? currentExp : new Date();
        const expires = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
        await adminDb.updateProfile(payment.user_id, {
          ai_sub_expires_at: expires.toISOString(),
        });
      }
    }

    return { ok: true };
  });
