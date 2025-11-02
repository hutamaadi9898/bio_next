"use server";

import { eq, sql } from "drizzle-orm";

import { cards, profiles, users } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { hitRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { env } from "@/lib/env";

type ActionResult<T = Record<string, never>> =
  | { success: true; data?: T }
  | { success: false; errors: Record<string, string> };

export async function trackCardClickAction(cardId: string) {
  if (!cardId) return;
  const h = await headers();
  const ua = (h.get("user-agent") || "").toLowerCase();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const isBot = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|discord|preview|link|embed/i.test(ua);
  if (isBot) return; // ignore bot clicks

  // Simple debounce: allow one click per 3s per card and IP/UA
  const key = `click:${cardId}:${ip}:${ua.slice(0, 32)}`;
  const limited = await hitRateLimit("card_click", key, { windowSeconds: 3, max: 1 });
  if (limited) return;

  await db
    .update(cards)
    .set({ clickCount: sql`${cards.clickCount} + 1`, updatedAt: new Date() })
    .where(eq(cards.id, cardId));
}

const contactSchema = z.object({
  cardId: z.string().uuid(),
  name: z.string().min(1).max(80),
  email: z.string().email().max(200),
  message: z.string().min(1).max(2000),
});

export async function sendContactMessageAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const cardId = String(formData.get("cardId") || "");
  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "");
  const message = String(formData.get("message") || "");
  const parsed = contactSchema.safeParse({ cardId, name, email, message });
  if (!parsed.success) {
    return {
      success: false,
      errors: Object.fromEntries(parsed.error.issues.map((i) => [i.path[0]?.toString() ?? "form", i.message])),
    };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";

  // Find card -> profile -> user (recipient)
  const card = await db.query.cards.findFirst({
    where: (t, { eq }) => eq(t.id, parsed.data.cardId),
    with: { profile: true },
  });
  if (!card || !card.profileId) {
    return { success: false, errors: { form: "Invalid card" } };
  }
  const profile = await db.query.profiles.findFirst({
    where: (t, { eq }) => eq(t.id, card.profileId),
  });
  if (!profile) return { success: false, errors: { form: "Profile not found" } };

  const user = await db.query.users.findFirst({
    where: (t, { eq }) => eq(t.id, profile.userId),
  });
  if (!user) return { success: false, errors: { form: "Recipient unavailable" } };

  // Debounce + rate limit: 2 messages per 10 minutes per IP per profile
  const rlKey = `contact:${profile.id}:${ip}`;
  const limited = await hitRateLimit("contact_submit", rlKey, { windowSeconds: 600, max: 2 });
  if (limited) {
    return { success: false, errors: { form: "Too many messages. Please try later." } };
  }

  // If Resend configured, send server-side email; otherwise, fail to client so it can use mailto fallback
  if (env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(env.RESEND_API_KEY);
      const from = env.CONTACT_FROM_EMAIL ?? "no-reply@localhost";
      await resend.emails.send({
        from,
        to: user.email,
        subject: `[Biogrid] Message from ${name}`,
        reply_to: email,
        text: message,
      } as any);
      return { success: true };
    } catch (error) {
      return { success: false, errors: { form: "Failed to send. Try mailto." } };
    }
  }

  // No email provider configured
  return { success: false, errors: { form: "Email not configured" } };
}
