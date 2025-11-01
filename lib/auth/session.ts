import { cache } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth/nextauth";

export const getCurrentUser = cache(async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const user = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.id, userId),
    with: { profile: true },
  });

  if (!user) return null;
  return { id: user.id, email: user.email, profile: user.profile };
});

/**
 * Ensures that a user is authenticated. Redirects to the login page otherwise.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireProfile() {
  const user = await requireUser();
  if (!user.profile) {
    redirect("/onboarding");
  }
  return { user, profile: user.profile };
}
