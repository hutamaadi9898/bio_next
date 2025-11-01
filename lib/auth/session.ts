import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/lucia";

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
