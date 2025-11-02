"use server";

import { revalidatePath } from "next/cache";

import { and, eq, sql } from "drizzle-orm";

import { cards, profiles } from "@/drizzle/schema";
import type { ActionResult } from "@/lib/actions/types";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { THEME_PRESETS } from "@/lib/themes";
import { normalizeSocialOrLink } from "@/lib/social";
import { onboardingSchema } from "@/lib/validation/onboarding";
import { logAuditSafe } from "@/lib/audit";

function normaliseColor(color?: string | null) {
  if (!color) return null;
  return color.startsWith("#") ? color : `#${color}`;
}

export async function completeOnboardingAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ publicUrl: string }>> {
  const { profile, id: userId } = await (async () => {
    const u = await requireUser();
    return { profile: u.profile!, id: u.id };
  })();

  const parsed = onboardingSchema.safeParse({
    preset: formData.get("preset"),
    link1: formData.get("link1") ?? "",
    link2: formData.get("link2") ?? "",
    link3: formData.get("link3") ?? "",
  });
  if (!parsed.success) {
    return {
      success: false,
      errors: Object.fromEntries(parsed.error.issues.map((i) => [i.path[0]?.toString() ?? "form", i.message])),
    };
  }

  const { preset, link1, link2, link3 } = parsed.data;
  const linksRaw = [link1, link2, link3].map((v) => (typeof v === "string" ? v.trim() : ""));
  const normalized = linksRaw
    .map((v) => (v ? normalizeSocialOrLink(v) : null))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));

  const nextTheme = THEME_PRESETS[preset];

  await db.transaction(async (tx) => {
    // Update theme preset
    await tx
      .update(profiles)
      .set({
        theme: { preset: nextTheme.preset, accent: nextTheme.palette.accent, background: nextTheme.palette.background },
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profile.id));

    // Determine next position base
    const maxRows = await tx
      .select({ max: sql<number>`coalesce(max(${cards.position}), 0)` })
      .from(cards)
      .where(eq(cards.profileId, profile.id));
    const maxPos = maxRows[0]?.max ?? 0;
    let pos = maxPos + 1;

    const accent = nextTheme.palette.accent;

    const hasAnyCards = maxPos > 0;
    if (!hasAnyCards) {
      // Ensure a hero tile
      await tx.insert(cards).values({
        profileId: profile.id,
        type: "text",
        title: `Hi, I'm ${profile.displayName}`,
        subtitle: profile.bio ?? "",
        url: null,
        cols: 6,
        rows: 2,
        position: pos++,
        accentColor: normaliseColor(accent),
      });

      // "About" tile
      await tx.insert(cards).values({
        profileId: profile.id,
        type: "text",
        title: "About",
        subtitle: profile.bio ?? "",
        url: null,
        cols: 3,
        rows: 1,
        position: pos++,
      });
    }

    // Up to three link/social tiles
    for (const l of normalized.slice(0, 3)) {
      await tx.insert(cards).values({
        profileId: profile.id,
        type: l.type === "social" ? "social" : "link",
        title: l.title,
        subtitle: null,
        url: l.url,
        cols: 3,
        rows: 1,
        position: pos++,
      });
    }

    // Publish profile
    await tx
      .update(profiles)
      .set({ publishedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(profiles.id, profile.id)));
  });

  const publicUrl = `/u/${profile.handle}`;
  revalidatePath(publicUrl);
  await logAuditSafe({ userId, action: "onboarding.complete", entity: "profile", entityId: profile.id });
  return { success: true, data: { publicUrl } };
}
