import { cookies } from "next/headers";
import { cache } from "react";
import process from "node:process";

import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import type { PostgreSQLSessionTable, PostgreSQLUserTable } from "@lucia-auth/adapter-drizzle";
import { Lucia } from "lucia";

import { sessions, users } from "@/drizzle/schema";
import { db } from "@/lib/db";

const adapter = new DrizzlePostgreSQLAdapter(
  db,
  sessions as unknown as PostgreSQLSessionTable,
  users as unknown as PostgreSQLUserTable,
);

export const auth = new Lucia<Record<string, never>, { email: string }>(adapter, {
  sessionCookie: {
    name: "biogrid_session",
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  },
  getUserAttributes: (attributes) => ({
    email: (attributes as { email: string }).email,
  }),
});

export type Auth = typeof auth;

/**
 * Fetch the active Lucia session (memoised per request).
 */
export const getCurrentSession = cache(async () => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(auth.sessionCookieName)?.value;
  if (!sessionId) return null;
  const result = await auth.validateSession(sessionId);
  // refresh cookie if needed
  if (result.session && result.session.fresh) {
    const sessionCookie = auth.createSessionCookie(result.session.id);
    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  }
  if (!result.session) {
    const sessionCookie = auth.createBlankSessionCookie();
    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  }
  return result.session;
});

/**
 * Convenience helper to fetch the current user, including their profile handle.
 */
export const getCurrentUser = cache(async () => {
  const session = await getCurrentSession();
  if (!session) return null;
  const user = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.id, session.userId),
    with: {
      profile: true,
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    profile: user.profile,
  };
});
