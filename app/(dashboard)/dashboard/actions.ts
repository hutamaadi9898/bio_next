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
  applyThemePresetSchema,
  applyLayoutTemplateSchema,
  type ThemePreset,
} from "@/lib/validation/cards";
import { THEME_PRESETS } from "@/lib/themes";
import { applyTemplateToCards } from "@/lib/templates";
import { uploadImageToR2 } from "@/lib/storage/r2";
import { logAuditSafe } from "@/lib/audit";
import { log } from "@/lib/log";
import { resolveTheme } from "@/lib/themes";
import { extractAutoPaletteFromImage } from "@/lib/themes-server";
import { parseLatLngFromUrl } from "@/lib/maps";

function normaliseColor(color?: string | null) {
  if (!color) return null;
  return color.startsWith("#") ? color : `#${color}`;
}

function ensureUrlForType(type: string) {
  // Require URL for types that link out
  return (
    type === "link" ||
    type === "social" ||
    type === "email" ||
    type === "video" ||
    type === "music" ||
    type === "map"
  );
}

function revalidateDashboard(_handle: string) {
  // Only revalidate the dashboard during editing. Public profile paths are
  // revalidated on publish/unpublish to avoid unnecessary cache churn.
  revalidatePath("/dashboard");
}

export async function createCardAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { profile, user } = await requireProfile();

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

  if (payload.type === "map" && payload.url) {
    const ok = parseLatLngFromUrl(payload.url);
    if (!ok) {
      return { success: false, errors: { url: "Could not parse location from URL" } };
    }
  }

  const positionResult = await db
    .select({ max: sql<number>`coalesce(max(${cards.position}), 0)` })
    .from(cards)
    .where(eq(cards.profileId, profile.id));

  const nextPosition = positionResult[0]?.max ?? 0;

  try {
    if (payload.type === "gallery") {
      const filesRaw = formData.getAll("images");
      const files = filesRaw.filter((f): f is File => f instanceof File);
      if (files.length === 0) {
        return { success: false, errors: { images: "Please add at least one image" } };
      }
      const limited = files.slice(0, 6);

      const uploaded = [] as { id: string; url: string }[];
      for (const file of limited) {
        const up = await uploadImageToR2(user.id, file);
        const [asset] = await db
          .insert(assets)
          .values({
            userId: user.id,
            bucket: env.R2_BUCKET_NAME,
            key: up.key,
            contentType: up.contentType,
            url: up.url,
            sizeBytes: up.sizeBytes,
          })
          .returning({ id: assets.id, url: assets.url });
        if (asset) uploaded.push({ id: asset.id, url: asset.url });
      }

      await db.insert(cards).values({
        profileId: profile.id,
        type: payload.type,
        title: payload.title,
        subtitle: payload.subtitle,
        url: null,
        cols: Math.max(3, payload.cols),
        rows: Math.max(2, payload.rows),
        position: nextPosition + 1,
        accentColor: normaliseColor(payload.accentColor),
        data: { images: uploaded },
      } as any);
    } else {
      // Contact: default to mailto if URL not provided
      const url = payload.type === "contact" && !payload.url ? `mailto:${user.email}` : payload.url;
      await db.insert(cards).values({
        profileId: profile.id,
        type: payload.type,
        title: payload.title,
        subtitle: payload.subtitle,
        url,
        cols: payload.cols,
        rows: payload.rows,
        position: nextPosition + 1,
        accentColor: normaliseColor(payload.accentColor),
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("enum card_type") || message.includes("invalid input value for enum")) {
      return {
        success: false,
        errors: {
          type:
            "Database not migrated for new card types. Please run 'pnpm db:migrate' and try again.",
        },
      };
    }
    return { success: false, errors: { form: "Failed to create card." } };
  }

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

  if (payload.type === "map" && payload.url) {
    const ok = parseLatLngFromUrl(payload.url);
    if (!ok) {
      return { success: false, errors: { url: "Could not parse location from URL" } };
    }
  }
  try {
    if (payload.type === "gallery") {
      // Merge: remove checked images, then add new uploads
      const existing = await db.query.cards.findFirst({
        where: (t, { and: AND, eq }) => AND(eq(t.id, payload.id), eq(t.profileId, profile.id)),
      });
      const currentImages: Array<{ id?: string; url?: string }> =
        (existing?.data && typeof (existing as any).data === "object" && Array.isArray((existing as any).data.images))
          ? ((existing as any).data.images as Array<{ id?: string; url?: string }>)
          : [];

      const removeIds = formData.getAll("removeImage").map(String).filter(Boolean);
      const kept = currentImages.filter((img) => !img.id || !removeIds.includes(String(img.id)));

      const filesRaw = formData.getAll("images");
      const files = filesRaw.filter((f): f is File => f instanceof File).slice(0, 6);
      const uploaded = [] as { id: string; url: string }[];
      for (const file of files) {
        const up = await uploadImageToR2(profile.userId, file);
        const [asset] = await db
          .insert(assets)
          .values({
            userId: profile.userId,
            bucket: env.R2_BUCKET_NAME,
            key: up.key,
            contentType: up.contentType,
            url: up.url,
            sizeBytes: up.sizeBytes,
          })
          .returning({ id: assets.id, url: assets.url });
        if (asset) uploaded.push({ id: asset.id, url: asset.url });
      }

      const nextImages = [...kept, ...uploaded];

      await db
        .update(cards)
        .set({
          title: payload.title,
          subtitle: payload.subtitle,
          type: payload.type,
          url: null,
          cols: Math.max(3, payload.cols),
          rows: Math.max(2, payload.rows),
          accentColor: normaliseColor(payload.accentColor),
          data: { images: nextImages } as any,
          updatedAt: new Date(),
        })
        .where(and(eq(cards.id, payload.id), eq(cards.profileId, profile.id)));
    } else {
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
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("enum card_type") || message.includes("invalid input value for enum")) {
      return {
        success: false,
        errors: {
          type:
            "Database not migrated for new card types. Please run 'pnpm db:migrate' and try again.",
        },
      };
    }
    return { success: false, errors: { form: "Failed to update card." } };
  }

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
        preset: (existingTheme as { preset?: ThemePreset }).preset ?? "minimal",
      },
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profile.id));

  revalidateDashboard(profile.handle);
  await logAuditSafe({ userId: profile.userId, action: "profile.update", entity: "profile", entityId: profile.id });
  return { success: true };
}

export async function applyThemePresetAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { profile } = await requireProfile();
  const parsed = applyThemePresetSchema.safeParse({ preset: formData.get("preset") });
  if (!parsed.success) {
    return { success: false, errors: { preset: "Invalid theme preset" } };
  }

  const preset = parsed.data.preset;
  const next = THEME_PRESETS[preset];

  await db
    .update(profiles)
    .set({
      theme: {
        preset: next.preset,
        accent: next.palette.accent,
        background: next.palette.background,
      },
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profile.id));

  revalidateDashboard(profile.handle);
  await logAuditSafe({ userId: profile.userId, action: "profile.theme_preset", entity: "profile", entityId: profile.id });
  return { success: true };
}

export async function applyLayoutTemplateAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { profile } = await requireProfile();
  const parsed = applyLayoutTemplateSchema.safeParse({ template: formData.get("template") });
  if (!parsed.success) {
    return { success: false, errors: { template: "Invalid template" } };
  }
  const template = parsed.data.template;

  const currentCards = await db.query.cards.findMany({
    where: (t, { eq }) => eq(t.profileId, profile.id),
    orderBy: (t, { asc }) => asc(t.position),
  });

  if (currentCards.length === 0) {
    return { success: true };
  }

  const updates = applyTemplateToCards(template, currentCards);
  await db.transaction(async (tx) => {
    // Phase 1: Move all to temporary out-of-band positions to avoid unique position conflicts
    const tempBase = (currentCards.length + 1) * 10;
    for (let i = 0; i < updates.length; i++) {
      const u = updates[i]!;
      await tx.update(cards).set({ position: tempBase + i + 1 }).where(eq(cards.id, u.id));
    }
    // Phase 2: Apply target sizes and final positions
    for (const u of updates) {
      await tx
        .update(cards)
        .set({ cols: u.cols, rows: u.rows, position: u.position, updatedAt: new Date() })
        .where(eq(cards.id, u.id));
    }
  });

  revalidateDashboard(profile.handle);
  await logAuditSafe({ userId: profile.userId, action: "profile.layout_template", entity: "profile", entityId: profile.id });
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

    // Auto-palette: only override accent if user hasn't customized it away from preset
    const current = resolveTheme(profile.theme);
    const auto = await extractAutoPaletteFromImage(asset.url, current.palette);
    const storedAccent = normaliseColor((profile.theme as { accent?: string } | null)?.accent ?? null);
    const defaultAccent = normaliseColor((THEME_PRESETS[current.preset]?.palette.accent) ?? current.palette.accent);
    const accentUnchanged = storedAccent === defaultAccent;

    // Always set avatar; conditionally update theme accent
    await db.update(profiles)
      .set({
        avatarAssetId: asset.id,
        ...(accentUnchanged ? { theme: { preset: current.preset, accent: auto.accent, background: current.palette.background } } : {}),
        updatedAt: new Date(),
      } as any)
      .where(eq(profiles.id, profile.id));

    revalidateDashboard(profile.handle);
    return { success: true, data: { url: asset.url } };
  } catch (error) {
    log({ msg: "avatar_upload_failed", level: "error", error: error instanceof Error ? error.message : String(error) });
    return { success: false, errors: { avatar: error instanceof Error ? error.message : "Upload failed" } };
  }
}

export async function uploadBannerAction(_prev: unknown, formData: FormData): Promise<ActionResult<{ url: string }>> {
  const { user, profile } = await requireProfile();
  const file = formData.get("banner");

  if (!(file instanceof File)) {
    return { success: false, errors: { banner: "Please choose an image" } };
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

    const current = resolveTheme(profile.theme);
    const auto = await extractAutoPaletteFromImage(asset.url, current.palette);
    const storedAccent = normaliseColor((profile.theme as { accent?: string } | null)?.accent ?? null);
    const defaultAccent = normaliseColor((THEME_PRESETS[current.preset]?.palette.accent) ?? current.palette.accent);
    const accentUnchanged = storedAccent === defaultAccent;

    await db
      .update(profiles)
      .set({
        bannerAssetId: asset.id,
        ...(accentUnchanged ? { theme: { preset: current.preset, accent: auto.accent, background: current.palette.background } } : {}),
        updatedAt: new Date(),
      } as any)
      .where(eq(profiles.id, profile.id));

    revalidateDashboard(profile.handle);
    return { success: true, data: { url: asset.url } };
  } catch (error) {
    log({ msg: "banner_upload_failed", level: "error", error: error instanceof Error ? error.message : String(error) });
    return { success: false, errors: { banner: error instanceof Error ? error.message : "Upload failed" } };
  }
}

export async function publishProfileAction() {
  const { profile } = await requireProfile();
  await db
    .update(profiles)
    .set({ publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(profiles.id, profile.id));
  revalidatePath(`/u/${profile.handle}`);
  await logAuditSafe({ userId: profile.userId, action: "profile.publish", entity: "profile", entityId: profile.id });
}

export async function unpublishProfileAction() {
  const { profile } = await requireProfile();
  await db
    .update(profiles)
    .set({ publishedAt: null, updatedAt: new Date() })
    .where(eq(profiles.id, profile.id));
  revalidatePath(`/u/${profile.handle}`);
  await logAuditSafe({ userId: profile.userId, action: "profile.unpublish", entity: "profile", entityId: profile.id });
}
