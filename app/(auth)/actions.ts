"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { revalidatePath } from "next/cache";

import { auth, getCurrentSession } from "@/lib/auth/lucia";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/actions/types";
import { loginSchema, registerSchema } from "@/lib/validation/auth";
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

  const session = await auth.createSession(userId, {});
  const sessionCookie = auth.createSessionCookie(session.id);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  revalidatePath("/dashboard");
  await logAuditSafe({ userId, action: "register", entity: "user", entityId: userId });
  redirect("/dashboard");
}

export async function loginAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const ua = h.get("user-agent") || "unknown";
  const rlKey = `login:${ip}:${ua.slice(0, 42)}`;
  if (await hitRateLimit("login", rlKey, { windowSeconds: 60, max: 10 })) {
    log({ msg: "rate_limited", action: "login", key: rlKey, level: "warn" });
    return { success: false, errors: { form: "Too many attempts. Please wait a minute and try again." } };
  }
  const parseResult = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parseResult.success) {
    return {
      success: false,
      errors: Object.fromEntries(parseResult.error.issues.map((issue) => [issue.path[0]?.toString() ?? "form", issue.message])),
    };
  }

  const { email, password } = parseResult.data;

  const user = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.email, email),
  });

  if (!user) {
    return { success: false, errors: { email: "Account not found" } };
  }

  const passwordValid = await verifyPassword(user.hashedPassword, password);

  if (!passwordValid) {
    return { success: false, errors: { password: "Incorrect password" } };
  }

  const session = await auth.createSession(user.id, {});
  const sessionCookie = auth.createSessionCookie(session.id);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  revalidatePath("/dashboard");
  await logAuditSafe({ userId: user.id, action: "login", entity: "user", entityId: user.id });
  redirect("/dashboard");
}

export async function logoutAction() {
  const session = await getCurrentSession();
  if (session) {
    await auth.invalidateSession(session.id);
    const blankCookie = auth.createBlankSessionCookie();
    const cookieStore = await cookies();
    cookieStore.set(blankCookie.name, blankCookie.value, blankCookie.attributes);
  }
  await logAuditSafe({ userId: session?.userId ?? null, action: "logout", entity: "user", entityId: session?.userId ?? null });
  redirect("/");
}
