"use server";

import { eq, sql } from "drizzle-orm";

import { cards } from "@/drizzle/schema";
import { db } from "@/lib/db";

export async function trackCardClickAction(cardId: string) {
  if (!cardId) return;
  await db
    .update(cards)
    .set({ clickCount: sql`${cards.clickCount} + 1`, updatedAt: new Date() })
    .where(eq(cards.id, cardId));
}
