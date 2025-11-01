"use server";

import { revalidatePath } from "next/cache";

import { and, asc, desc, eq, gt, lt, sql } from "drizzle-orm";

import { assets, cards, profiles } from "@/drizzle/schema";
import type { ActionResult } from "@/lib/actions/types";
import { requireProfile } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import {
  createCardSchema,
  deleteCardSchema,
  profileUpdateSchema,
  reorderCardSchema,
  updateCardSchema,
} from "@/lib/validation/cards";
import { uploadImageToR2 } from "@/lib/storage/r2";
import { logAuditSafe } from "@/lib/audit";

function normaliseColor(color?: string | null) {
  if (!color) return null;
  return color.startsWith("#") ? color : `#${color}`;
}

function ensureUrlForType(type: string) {
  return type === "link" || type === "social" || type === "email";
}

function revalidateDashboard(handle: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/u/${handle}`);
}

export async function createCardAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { profile } = await requireProfile();

  const parseResult = createCardSchema.safeParse({
    title: formData.get("title"),
    subtitle: formData.get("subtitle") || null,
    type: formData.get("type"),
    url: formData.get("url") || null,
    cols: formData.get("cols") ?? 3,
    rows: formData.get("rows") ?? 1,
    accentColor: formData.get("accentColor") || null,
  });

  if (!parseResult.success) {
    return {
      success: false,
      errors: Object.fromEntries(parseResult.error.issues.map((issue) => [issue.path[0]?.toString() ?? "form", issue.message])),
    };
  }

  const payload = parseResult.data;

  if (ensureUrlForType(payload.type) && !payload.url) {
    return {
      success: false,
      errors: { url: "URL is required for this card type" },
    };
  }

  const positionResult = await db
    .select({ max: sql<number>`coalesce(max(${cards.position}), 0)` })
    .from(cards)
    .where(eq(cards.profileId, profile.id));

  const nextPosition = positionResult[0]?.max ?? 0;

  await db.insert(cards).values({
    profileId: profile.id,
    type: payload.type,
    title: payload.title,
    subtitle: payload.subtitle,
    url: payload.url,
    cols: payload.cols,
    rows: payload.rows,
    position: nextPosition + 1,
    accentColor: normaliseColor(payload.accentColor),
  });

  revalidateDashboard(profile.handle);
  await logAuditSafe({ userId: profile.userId, action: "card.create", entity: "card", entityId: "(auto)" });
  return { success: true };
}

export async function updateCardAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { profile } = await requireProfile();

  const parseResult = updateCardSchema.safeParse({
    id: formData.get("cardId"),
    title: formData.get("title"),
    subtitle: formData.get("subtitle") || null,
    type: formData.get("type"),
    url: formData.get("url") || null,
    cols: formData.get("cols") ?? 3,
    rows: formData.get("rows") ?? 1,
    accentColor: formData.get("accentColor") || null,
  });

  if (!parseResult.success) {
    return {
      success: false,
      errors: Object.fromEntries(parseResult.error.issues.map((issue) => [issue.path[0]?.toString() ?? "form", issue.message])),
    };
  }

  const payload = parseResult.data;

  if (ensureUrlForType(payload.type) && !payload.url) {
    return {
      success: false,
      errors: { url: "URL is required for this card type" },
    };
  }

  await db
    .update(cards)
    .set({
      title: payload.title,
      subtitle: payload.subtitle,
      type: payload.type,
      url: payload.url,
      cols: payload.cols,
      rows: payload.rows,
      accentColor: normaliseColor(payload.accentColor),
      updatedAt: new Date(),
    })
    .where(and(eq(cards.id, payload.id), eq(cards.profileId, profile.id)));

  revalidateDashboard(profile.handle);
  await logAuditSafe({ userId: profile.userId, action: "card.update", entity: "card", entityId: parseResult.data.id });
  return { success: true };
}

export async function deleteCardAction(cardId: string) {
  const { profile } = await requireProfile();
  const parsed = deleteCardSchema.safeParse({ cardId });
  if (!parsed.success) {
    return;
  }

  await db.delete(cards).where(and(eq(cards.id, parsed.data.cardId), eq(cards.profileId, profile.id)));

  revalidateDashboard(profile.handle);
  await logAuditSafe({ userId: profile.userId, action: "card.delete", entity: "card", entityId: parsed.data.cardId });
}

export async function reorderCardAction(cardId: string, direction: "up" | "down") {
  const { profile } = await requireProfile();
  const parsed = reorderCardSchema.safeParse({ cardId, direction });
  if (!parsed.success) return;

  const current = await db.query.cards.findFirst({
    where: (table, { eq }) => and(eq(table.id, parsed.data.cardId), eq(table.profileId, profile.id)),
  });
  if (!current) return;

  const neighbour = await db.query.cards.findFirst({
    where: (table, { eq }) =>
      and(
        eq(table.profileId, profile.id),
        parsed.data.direction === "up"
          ? lt(table.position, current.position)
          : gt(table.position, current.position),
      ),
    orderBy: (table) => (parsed.data.direction === "up" ? desc(table.position) : asc(table.position)),
  });

  if (!neighbour) return;

  await db.transaction(async (tx) => {
    // Use a temporary out-of-band position to avoid violating the unique (profile_id, position) constraint
    const maxResult = await tx
      .select({ max: sql<number>`coalesce(max(${cards.position}), 0)` })
      .from(cards)
      .where(eq(cards.profileId, profile.id));
    const currentMax = maxResult[0]?.max ?? 0;
    const tempPos = currentMax + 1;

    await tx.update(cards).set({ position: tempPos }).where(eq(cards.id, current.id));
    await tx.update(cards).set({ position: current.position }).where(eq(cards.id, neighbour.id));
    await tx.update(cards).set({ position: neighbour.position }).where(eq(cards.id, current.id));
  });

  revalidateDashboard(profile.handle);
  await logAuditSafe({ userId: profile.userId, action: "card.reorder", entity: "card", entityId: cardId });
}

export async function updateProfileAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { profile } = await requireProfile();

  const parseResult = profileUpdateSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio") || null,
    accentColor: formData.get("accentColor") || null,
  });

  if (!parseResult.success) {
    return {
      success: false,
      errors: Object.fromEntries(parseResult.error.issues.map((issue) => [issue.path[0]?.toString() ?? "form", issue.message])),
    };
  }

  const payload = parseResult.data;

  const existingTheme = (profile.theme ?? { accent: "#2563eb", background: "#0f172a" }) as {
    accent?: string | null;
    background?: string | null;
  };

  await db
    .update(profiles)
    .set({
      displayName: payload.displayName,
      bio: payload.bio,
      theme: {
        accent: normaliseColor(payload.accentColor) ?? existingTheme.accent ?? "#2563eb",
        background: existingTheme.background ?? "#0f172a",
      },
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profile.id));

  revalidateDashboard(profile.handle);
  await logAuditSafe({ userId: profile.userId, action: "profile.update", entity: "profile", entityId: profile.id });
  return { success: true };
}

export async function uploadAvatarAction(_prev: unknown, formData: FormData): Promise<ActionResult<{ url: string }>> {
  const { user, profile } = await requireProfile();
  const file = formData.get("avatar");

  if (!(file instanceof File)) {
    return { success: false, errors: { avatar: "Please choose an image" } };
  }

  try {
    const upload = await uploadImageToR2(user.id, file);

    const [asset] = await db
      .insert(assets)
      .values({
        userId: user.id,
        bucket: env.R2_BUCKET_NAME,
        key: upload.key,
        contentType: upload.contentType,
        url: upload.url,
        sizeBytes: upload.sizeBytes,
      })
      .returning({ id: assets.id, url: assets.url });
    if (!asset) {
      throw new Error("Failed to persist uploaded asset");
    }

    await db
      .update(profiles)
      .set({ avatarAssetId: asset.id, updatedAt: new Date() })
      .where(eq(profiles.id, profile.id));

    revalidateDashboard(profile.handle);
    return { success: true, data: { url: asset.url } };
  } catch (error) {
    console.error("Avatar upload failed", error);
    return { success: false, errors: { avatar: error instanceof Error ? error.message : "Upload failed" } };
  }
}
