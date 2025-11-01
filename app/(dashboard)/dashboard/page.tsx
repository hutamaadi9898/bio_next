import { redirect } from "next/navigation";

import { BentoGrid, type BentoCardData } from "@/components/bento/bento-grid";
import { CardList } from "@/components/dashboard/card-list";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { requireProfile } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const { user, profile } = await requireProfile();
  if (!profile) {
    redirect("/register");
  }

  const profileRecord = await db.query.profiles.findFirst({
    where: (table, { eq: eqProfile }) => eqProfile(table.id, profile.id),
    with: {
      avatarAsset: true,
    },
  });

  const cardRecords = await db.query.cards.findMany({
    where: (table, { eq }) => eq(table.profileId, profile.id),
    orderBy: (table, { asc }) => asc(table.position),
  });

  const bentoItems: BentoCardData[] = cardRecords.map((card) => ({
    id: card.id,
    title: card.title,
    subtitle: card.subtitle ?? undefined,
    type: card.type,
    cols: card.cols,
    rows: card.rows,
    accentColor: card.accentColor ?? undefined,
    description: card.type === "text" ? card.subtitle ?? undefined : undefined,
    href: card.url ?? undefined,
  }));

  return (
    <div className="grid gap-10 lg:grid-cols-[2fr,1fr] xl:grid-cols-[3fr,1.2fr]">
      <section className="space-y-6">
        <DashboardHeader profile={profile} user={user} cardCount={cardRecords.length} />
        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <BentoGrid items={bentoItems} className="min-h-[480px]" />
        </div>
      </section>
      <aside className="space-y-6">
        <ProfileForm
          initialValues={{
            displayName: profile.displayName,
            bio: profile.bio ?? "",
            accentColor: (profile.theme as { accent?: string } | null)?.accent ?? "#2563eb",
            avatarUrl: profileRecord?.avatarAsset?.url ?? null,
          }}
        />
        <ScrollArea className="h-[520px] rounded-2xl border bg-card p-4">
          <CardList cards={cardRecords} />
        </ScrollArea>
      </aside>
    </div>
  );
}
