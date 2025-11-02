import { z } from "zod";
import { themePresetValues } from "@/lib/validation/cards";

export const onboardingSchema = z.object({
  preset: z.enum(themePresetValues),
  link1: z.string().trim().optional().default(""),
  link2: z.string().trim().optional().default(""),
  link3: z.string().trim().optional().default(""),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

