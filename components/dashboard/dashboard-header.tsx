import Link from "next/link";

import { logoutAction } from "@/app/(auth)/actions";
import { publishProfileAction, unpublishProfileAction } from "@/app/(dashboard)/dashboard/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/drizzle/schema";

type DashboardHeaderProps = {
  profile: Profile;
  user: { id: string; email: string | null };
  cardCount: number;
};

export function DashboardHeader({ profile, user, cardCount }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {profile.publishedAt ? (
            <form action={unpublishProfileAction}>
              <Button variant="secondary" aria-label="Unpublish profile">Unpublish</Button>
            </form>
          ) : (
            <form action={publishProfileAction}>
              <Button variant="default" aria-label="Publish profile">Publish</Button>
            </form>
          )}
          <form action={logoutAction}>
            <Button variant="outline">Sign out</Button>
          </form>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <Badge variant="secondary">Handle: @{profile.handle}</Badge>
        {profile.publishedAt ? (
          <Badge variant="outline">Published</Badge>
        ) : (
          <Badge variant="destructive">Draft</Badge>
        )}
        <Badge variant="outline">Cards: {cardCount}</Badge>
        {cardCount < 3 ? (
          <Link href="/onboarding" className="text-primary hover:underline">
            Quick start
          </Link>
        ) : null}
        <Link href={`/u/${profile.handle}`} className="text-primary hover:underline">
          View public profile
        </Link>
      </div>
    </div>
  );
}
