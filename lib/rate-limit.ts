import { and, eq, sql } from "drizzle-orm";

import { rateLimits } from "@/drizzle/schema";
import { db } from "@/lib/db";

function windowStart(ts: Date, windowSeconds: number) {
  const epoch = Math.floor(ts.getTime() / 1000);
  const start = epoch - (epoch % windowSeconds);
  return new Date(start * 1000);
}

export async function hitRateLimit(
  action: string,
  key: string,
  { windowSeconds, max }: { windowSeconds: number; max: number },
) {
  const now = new Date();
  const win = windowStart(now, windowSeconds);

  try {
    const existing = await db
      .select({ id: rateLimits.id, count: rateLimits.count })
      .from(rateLimits)
      .where(and(eq(rateLimits.action, action), eq(rateLimits.key, key), eq(rateLimits.windowStart, win)))
      .limit(1);

    if (existing[0]) {
      const row = existing[0];
      if (row.count >= max) return true;
      await db
        .update(rateLimits)
        .set({ count: sql`${rateLimits.count} + 1` })
        .where(and(eq(rateLimits.id, row.id)));
      return false;
    }

    await db.insert(rateLimits).values({ action, key, windowStart: win, count: 1 });
    return false;
  } catch {
    // Fail-open to avoid blocking auth/logging due to DB blip
    return false;
  }
}

