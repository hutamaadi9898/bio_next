import type { Adapter, AdapterSession, AdapterUser } from "next-auth/adapters";
import { eq } from "drizzle-orm";

import type { DbClient } from "@/lib/db";
import { sessions, users } from "@/drizzle/schema";

function toAdapterUser(u: { id: string; email: string }): AdapterUser {
  return { id: u.id, email: u.email, emailVerified: null, name: null, image: null };
}

function toAdapterSession(s: { id: string; userId: string; expiresAt: Date }): AdapterSession {
  return { sessionToken: s.id, userId: s.userId, expires: s.expiresAt };
}

export function drizzleAdapter(db: DbClient): Adapter {
  return {
    // User management (Credentials-only flow does not auto-create users)
    async createUser() {
      throw new Error("createUser not supported; use app registerAction");
    },
    async getUser(id) {
      const u = await db.query.users.findFirst({ where: (t, { eq: _eq }) => _eq(t.id, id) });
      return u ? toAdapterUser(u) : null;
    },
    async getUserByEmail(email) {
      const u = await db.query.users.findFirst({ where: (t, { eq: _eq }) => _eq(t.email, email) });
      return u ? toAdapterUser(u) : null;
    },
    async getUserByAccount() {
      // No OAuth accounts in MVP
      return null;
    },
    async updateUser() {
      throw new Error("updateUser not implemented in MVP");
    },
    async deleteUser() {
      return null;
    },
    async linkAccount() {
      throw new Error("linkAccount not supported in MVP");
    },
    async unlinkAccount() {
      throw new Error("unlinkAccount not supported in MVP");
    },

    // Sessions -> map to existing `sessions` table (id=sessionToken)
    async createSession(data) {
      await db.insert(sessions).values({ id: data.sessionToken, userId: data.userId, expiresAt: data.expires });
      return { sessionToken: data.sessionToken, userId: data.userId, expires: data.expires };
    },
    async getSessionAndUser(sessionToken) {
      const s = await db.query.sessions.findFirst({ where: (t, { eq: _eq }) => _eq(t.id, sessionToken) });
      if (!s) return null;
      const u = await db.query.users.findFirst({ where: (t, { eq: _eq }) => _eq(t.id, s.userId) });
      if (!u) return null;
      return { session: toAdapterSession(s as any), user: toAdapterUser(u) };
    },
    async updateSession(data) {
      const s = await db.query.sessions.findFirst({ where: (t, { eq: _eq }) => _eq(t.id, data.sessionToken) });
      if (!s) return null;
      const expires = data.expires ?? s.expiresAt;
      await db.update(sessions).set({ expiresAt: expires }).where(eq(sessions.id, data.sessionToken));
      return { sessionToken: data.sessionToken, userId: s.userId, expires };
    },
    async deleteSession(sessionToken) {
      await db.delete(sessions).where(eq(sessions.id, sessionToken));
    },

    // Email verifications (unused)
    async createVerificationToken() {
      throw new Error("createVerificationToken not supported in MVP");
    },
    async useVerificationToken() {
      return null;
    },
  };
}

