import { z } from "zod";

export const cardTypeValues = ["link", "social", "email", "text"] as const;

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
  data: z.record(z.any()).optional(),
});

export const updateCardSchema = cardSchema.extend({
  data: z.record(z.any()).optional(),
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

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
