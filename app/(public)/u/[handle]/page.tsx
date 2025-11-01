import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { BentoGrid, type BentoCardData } from "@/components/bento/bento-grid";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { PublicCardLink } from "@/components/public/card-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import type { Card as CardRow } from "@/drizzle/schema";

const getProfile = cache(async (handle: string) => {
  const profile = await db.query.profiles.findFirst({
    where: (table, { eq: eqHandle }) => eqHandle(table.handle, handle.toLowerCase()),
    with: {
      cards: {
        orderBy: (table, { asc }) => asc(table.position),
      },
      avatarAsset: true,
    },
  });
  return profile;
});

type PageParams = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfile(handle);
  if (!profile) {
    return {
      title: "Profile not found",
    };
  }

  return {
    title: `${profile.displayName} | Biogrid`,
    description: profile.bio ?? `Discover ${profile.displayName}'s curated links and highlights`,
    openGraph: {
      title: profile.displayName,
      description: profile.bio ?? undefined,
      url: `/u/${profile.handle}`,
      images: [
        {
          url: `/u/${profile.handle}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${profile.displayName} — Biogrid`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: profile.displayName,
      description: profile.bio ?? undefined,
      images: [`/u/${profile.handle}/opengraph-image`],
    },
  };
}

export default async function PublicProfilePage({ params }: PageParams) {
  const { handle } = await params;
  const profile = await getProfile(handle);
  if (!profile || !profile.isPublic || !profile.publishedAt) {
    notFound();
  }

  const bentoItems = profile.cards.map((card) => mapCard(card));
  const theme = (profile.theme as { accent?: string; background?: string } | null) ?? {};
  const accent = theme.accent ?? "#2563eb";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 py-16">
      <Card
        className="border-none bg-gradient-to-br from-background via-background to-muted shadow-none"
        style={{ boxShadow: `inset 0 0 0 1px ${accent}20` }}
      >
        <CardHeader className="flex flex-col items-center gap-4 text-center">
          <div className="h-24 w-24 overflow-hidden rounded-full border bg-muted">
            {profile.avatarAsset?.url ? (
              <img src={profile.avatarAsset.url} alt={`${profile.displayName} avatar`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                {profile.displayName.at(0)}
              </div>
            )}
          </div>
          <Badge variant="secondary" style={{ backgroundColor: `${accent}1a`, color: accent }}>
            @{profile.handle}
          </Badge>
          <CardTitle className="text-4xl font-semibold">{profile.displayName}</CardTitle>
          {profile.bio ? <CardDescription className="max-w-2xl text-base">{profile.bio}</CardDescription> : null}
        </CardHeader>
      </Card>
      <div
        className="rounded-3xl border bg-card p-6 shadow-sm"
        style={{ boxShadow: `0 20px 45px -15px ${accent}55` }}
      >
        <ErrorBoundary>
          <BentoGrid items={bentoItems} className="min-h-[420px]" />
        </ErrorBoundary>
      </div>
    </div>
  );
}

function mapCard(card: CardRow): BentoCardData {
  const accentColor = card.accentColor ?? undefined;
  const common = {
    id: card.id,
    title: card.title,
    subtitle: card.subtitle ?? undefined,
    type: card.type,
    cols: card.cols,
    rows: card.rows,
    accentColor,
  } satisfies Partial<BentoCardData>;

  switch (card.type) {
    case "link":
    case "social": {
      const href = card.url ?? "#";
      return {
        ...common,
        href,
        media: <PublicCardLink cardId={card.id} href={href} label="Open" />,
      } as BentoCardData;
    }
    case "email": {
      const emailHref = card.url?.startsWith("mailto:") ? card.url : `mailto:${card.url ?? "hello@example.com"}`;
      return {
        ...common,
        href: emailHref,
        media: <PublicCardLink cardId={card.id} href={emailHref} label="Send email" newTab={false} />,
      } as BentoCardData;
    }
    case "text":
    default:
      return {
        ...common,
        description: card.subtitle ?? card.url ?? undefined,
      } as BentoCardData;
  }
}
