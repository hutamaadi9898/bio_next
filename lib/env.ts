import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_BASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  // Optional: used for contact form (Phase 5)
  RESEND_API_KEY: z.string().min(1).optional(),
  CONTACT_FROM_EMAIL: z.string().email().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
