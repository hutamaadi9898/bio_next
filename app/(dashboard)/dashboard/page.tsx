import { redirect } from "next/navigation";

import { BentoGrid, type BentoCardData } from "@/components/bento/bento-grid";
import { CardList } from "@/components/dashboard/card-list";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { ThemeControls } from "@/components/dashboard/theme-controls";
import { ScrollArea } from "@/components/ui/scroll-area";
import { requireProfile } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { resolveTheme } from "@/lib/themes";
import { ThemeProvider } from "@/components/theme/theme-context";
import { ThemePreviewContainer } from "@/components/theme/theme-preview-container";

export default async function DashboardPage() {
  const { user, profile } = await requireProfile();

  const profileRecord = await db.query.profiles.findFirst({
    where: (table, { eq: eqProfile }) => eqProfile(table.id, profile.id),
    with: {
      avatarAsset: true,
      bannerAsset: true,
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
  const theme = resolveTheme(profile.theme);

  return (
    <ThemeProvider
      initialPreset={theme.preset}
      initialAccent={theme.palette.accent}
      initialTypography={theme.typography}
    >
      <div className="grid gap-10 lg:grid-cols-[2fr,1fr] xl:grid-cols-[3fr,1.2fr]">
        <section className="space-y-6">
          <DashboardHeader profile={profile} user={user} cardCount={cardRecords.length} />
          <ThemePreviewContainer>
            <BentoGrid items={bentoItems} className="min-h-[480px]" />
          </ThemePreviewContainer>
        </section>
        <aside className="space-y-6">
          <ProfileForm
            initialValues={{
              displayName: profile.displayName,
              bio: profile.bio ?? "",
              accentColor: (profile.theme as { accent?: string } | null)?.accent ?? "#2563eb",
              avatarUrl: profileRecord?.avatarAsset?.url ?? null,
              bannerUrl: profileRecord?.bannerAsset?.url ?? null,
            }}
          />
          <ThemeControls />
          <ScrollArea className="h-[520px] rounded-2xl border bg-card p-4">
            <CardList cards={cardRecords} />
          </ScrollArea>
        </aside>
      </div>
    </ThemeProvider>
  );
}
