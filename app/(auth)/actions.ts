"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/actions/types";
import { registerSchema } from "@/lib/validation/auth";
import { cards, profiles, users } from "@/drizzle/schema";
import { randomUUID } from "node:crypto";
import { hitRateLimit } from "@/lib/rate-limit";
import { log } from "@/lib/log";
import { logAuditSafe } from "@/lib/audit";

export async function registerAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const ua = h.get("user-agent") || "unknown";
  const rlKey = `register:${ip}:${ua.slice(0, 42)}`;
  if (await hitRateLimit("register", rlKey, { windowSeconds: 60, max: 5 })) {
    log({ msg: "rate_limited", action: "register", key: rlKey, level: "warn" });
    return { success: false, errors: { form: "Too many attempts. Please wait a minute and try again." } };
  }
  const parseResult = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    handle: formData.get("handle"),
    displayName: formData.get("displayName"),
  });

  if (!parseResult.success) {
    return {
      success: false,
      errors: Object.fromEntries(parseResult.error.issues.map((issue) => [issue.path[0]?.toString() ?? "form", issue.message])),
    };
  }

  const { email, password, handle, displayName } = parseResult.data;

  const existingUser = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.email, email),
  });

  if (existingUser) {
    return {
      success: false,
      errors: { email: "Email is already registered" },
    };
  }

  const existingHandle = await db.query.profiles.findFirst({
    where: (table, { eq }) => eq(table.handle, handle),
  });

  if (existingHandle) {
    return {
      success: false,
      errors: { handle: "Handle is already taken" },
    };
  }

  const hashedPassword = await hashPassword(password);
  const userId = randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      email,
      hashedPassword,
    });

    const [profile] = await tx
      .insert(profiles)
      .values({
        userId,
        handle,
        displayName,
        bio: null,
        publishedAt: new Date(),
      })
      .returning({ id: profiles.id });
    if (!profile) {
      throw new Error("Failed to create profile");
    }

    await tx.insert(cards).values({
      profileId: profile.id,
      type: "link",
      title: "My portfolio",
      subtitle: "See recent work",
      url: "https://example.com",
      position: 1,
      cols: 3,
      rows: 1,
    });
  });

  await logAuditSafe({ userId, action: "register", entity: "user", entityId: userId });

  // Return success - client will handle sign in
  return { success: true, data: { email } };
}

export async function logoutAction() {
  await logAuditSafe({ userId: null, action: "logout", entity: "user", entityId: null });
  redirect("/api/auth/signout");
}
