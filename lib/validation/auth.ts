import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().email({ message: "Enter a valid email" }).toLowerCase(),
    password: z.string().min(8, "Use at least 8 characters"),
    handle: z
      .string()
      .min(3, "Handle is too short")
      .max(25, "Handle is too long")
      .regex(/^[a-z0-9_-]+$/i, "Letters, numbers, underscore and dash only"),
    displayName: z.string().min(2, "Display name is required").max(60),
  })
  .transform((values) => ({
    ...values,
    handle: values.handle.toLowerCase(),
  }));

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
