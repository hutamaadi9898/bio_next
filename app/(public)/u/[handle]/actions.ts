"use server";

import { eq, sql } from "drizzle-orm";

import { cards } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { hitRateLimit } from "@/lib/rate-limit";

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
