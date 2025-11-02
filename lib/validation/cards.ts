import { z } from "zod";

export const cardTypeValues = [
  "link",
  "social",
  "email",
  "text",
  // Phase 3
  "video",
  "music",
  "map",
  // Phase 5
  "gallery",
  "contact",
  "divider",
] as const;

export const cardSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(80),
  subtitle: z.string().max(120).optional().nullable(),
  type: z.enum(cardTypeValues),
  url: z.string().url().optional().nullable(),
  cols: z.coerce.number().int().min(1).max(6),
  rows: z.coerce.number().int().min(1).max(3),
  accentColor: z.string().regex(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i).optional().nullable(),
});

export const createCardSchema = cardSchema.omit({ id: true }).extend({
  data: z.record(z.string(), z.any()).optional(),
});

export const updateCardSchema = cardSchema.extend({
  data: z.record(z.string(), z.any()).optional(),
});

export const deleteCardSchema = z.object({
  cardId: z.string().uuid(),
});

export const reorderCardSchema = z.object({
  cardId: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2).max(60),
  bio: z.string().max(280).optional().nullable(),
  accentColor: z.string().regex(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i).optional().nullable(),
});

// Phase 3 — Themes & Layout Templates
export const themePresetValues = ["minimal", "studio", "neon", "pastel"] as const;
export const applyThemePresetSchema = z.object({
  preset: z.enum(themePresetValues),
});

export const layoutTemplateValues = ["hero_2", "hero_masonry", "cards_only"] as const;
export const applyLayoutTemplateSchema = z.object({
  template: z.enum(layoutTemplateValues),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ThemePreset = (typeof themePresetValues)[number];
export type LayoutTemplate = (typeof layoutTemplateValues)[number];

// Phase 5 — per-type data payloads (discriminated at usage sites)
export const galleryDataSchema = z.object({
  images: z
    .array(
      z.object({
        url: z.string().url(),
        id: z.string().uuid().optional(),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
        alt: z.string().max(120).optional(),
      }),
    )
    .min(1),
});

export const mapDataSchema = z
  .object({
    lat: z.number().finite(),
    lng: z.number().finite(),
    label: z.string().max(120).optional(),
  })
  .partial();

export const contactDataSchema = z.object({
  recipientEmail: z.string().email().optional(),
});

export function validateDataForType(type: (typeof cardTypeValues)[number], data: unknown) {
  switch (type) {
    case "gallery":
      return galleryDataSchema.safeParse(data);
    case "map":
      return mapDataSchema.safeParse(data);
    case "contact":
      return contactDataSchema.safeParse(data);
    default:
      // Other types don't require structured data
      return { success: true as const, data: undefined } as const;
  }
}
