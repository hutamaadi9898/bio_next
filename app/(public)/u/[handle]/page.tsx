import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { BentoGrid, type BentoCardData } from "@/components/bento/bento-grid";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { PublicCardLink } from "@/components/public/card-link";
import { Badge } from "@/components/ui/badge";
import { PublicShareButton } from "@/components/public/public-share";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { resolveTheme } from "@/lib/themes";
import { extractYouTubeId, toSpotifyEmbedUrl } from "@/lib/utils";
import { YouTubeLite } from "@/components/public/youtube-lite";
import { SpotifyEmbed } from "@/components/public/spotify-embed";
import { staticMapPreviewFromUrl } from "@/lib/maps";
import { PublicContactForm } from "@/components/public/public-contact";
import type { Card as CardRow } from "@/drizzle/schema";

const getProfile = cache(async (handle: string) => {
  const profile = await db.query.profiles.findFirst({
    where: (table, { eq: eqHandle }) => eqHandle(table.handle, handle.toLowerCase()),
    with: {
      cards: {
        orderBy: (table, { asc }) => asc(table.position),
      },
      avatarAsset: true,
      bannerAsset: true,
      user: true,
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

  const bentoItems = profile.cards.map((card) => mapCard(card, profile.user?.email ?? undefined));
  const resolved = resolveTheme(profile.theme);
  const accent = resolved.palette.accent ?? "#2563eb";
  const hasBanner = Boolean(profile.bannerAsset?.url);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 py-16">
      <Card
        className="overflow-hidden border-none bg-background/60 shadow-none backdrop-blur supports-[backdrop-filter]:backdrop-blur"
        style={{
          boxShadow: `inset 0 0 0 1px ${accent}20`,
          backgroundImage: `linear-gradient(135deg, ${accent}14, transparent 60%)`,
        }}
      >
        {profile.bannerAsset?.url ? (
          <div className="relative h-32 w-full border-b bg-muted sm:h-40">
            <img
              src={profile.bannerAsset.url}
              alt={`${profile.displayName} banner`}
              className="z-0 h-full w-full object-cover"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-background/90 to-transparent"
            />
          </div>
        ) : null}
        <div className={hasBanner ? "relative z-20 -mt-12 flex justify-center" : "mt-6 flex justify-center"}>
          <div
            className="h-24 w-24 overflow-hidden rounded-full border-4 border-background bg-muted shadow-md"
            style={{ boxShadow: `0 0 0 2px ${accent}, 0 12px 28px -14px ${accent}66` }}
          >
            {profile.avatarAsset?.url ? (
              <img src={profile.avatarAsset.url} alt={`${profile.displayName} avatar`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                {profile.displayName.at(0)}
              </div>
            )}
          </div>
        </div>
        <CardHeader className="flex flex-col items-center gap-4 text-center">
          <Badge variant="secondary" style={{ backgroundColor: `${accent}1a`, color: accent }}>
            @{profile.handle}
          </Badge>
          <CardTitle className="text-4xl font-semibold">{profile.displayName}</CardTitle>
          {profile.bio ? <CardDescription className="max-w-2xl text-base">{profile.bio}</CardDescription> : null}
          <div className="mt-2">
            <PublicShareButton url={`/u/${profile.handle}`} title={`${profile.displayName} | Biogrid`} />
          </div>
        </CardHeader>
      </Card>
      <div
        className="rounded-3xl border bg-card/70 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:backdrop-blur"
        style={{ boxShadow: `0 20px 45px -15px ${accent}55`, backgroundImage: `linear-gradient(135deg, ${accent}10, transparent 70%)` }}
      >
        <ErrorBoundary>
          <BentoGrid
            items={bentoItems}
            className="min-h-[420px]"
            typography={{ label: resolved.typography.label, title: resolved.typography.title }}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}

function mapCard(card: CardRow, profileEmail?: string): BentoCardData {
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
    case "video": {
      const href = card.url ?? "#";
      const ytId = card.url ? extractYouTubeId(card.url) : null;
      return {
        ...common,
        href,
        media: ytId ? (
          <div className="mt-2">
            <YouTubeLite videoId={ytId} title={card.title} />
          </div>
        ) : (
          <PublicCardLink cardId={card.id} href={href} label="Watch" />
        ),
      } as BentoCardData;
    }
    case "music": {
      const href = card.url ?? "#";
      const embedUrl = card.url ? toSpotifyEmbedUrl(card.url) : null;
      return {
        ...common,
        href,
        media: embedUrl ? (
          <div className="mt-2">
            <SpotifyEmbed embedUrl={embedUrl} title={card.title} />
          </div>
        ) : (
          <PublicCardLink cardId={card.id} href={href} label="Listen" />
        ),
      } as BentoCardData;
    }
    case "map": {
      const href = card.url ?? "#";
      const preview = card.url ? staticMapPreviewFromUrl(card.url, 1024, 360, 13) : null;
      return {
        ...common,
        href,
        media: (
          <div className="space-y-2">
            {preview ? (
              <img src={preview} alt="Map preview" className="w-full rounded-xl border" loading="lazy" />
            ) : null}
            <PublicCardLink cardId={card.id} href={href} label="Open map" />
          </div>
        ),
      } as BentoCardData;
    }
    case "gallery": {
      const images = Array.isArray((card as any).data?.images)
        ? ((card as any).data.images as Array<{ url?: string }>)
            .map((i) => (typeof i?.url === "string" ? i.url : null))
            .filter((u): u is string => Boolean(u))
        : [];
      return {
        ...common,
        media: images.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {images.slice(0, 6).map((src, idx) => (
              <img key={idx} src={src} alt="Gallery image" className="h-24 w-full rounded-lg object-cover sm:h-28" loading="lazy" />
            ))}
          </div>
        ) : undefined,
      } as BentoCardData;
    }
    case "contact": {
      const mailto = card.url && card.url.startsWith("mailto:")
        ? card.url
        : profileEmail
          ? `mailto:${profileEmail}`
          : undefined;
      return {
        ...common,
        media: mailto ? (
          <PublicContactForm cardId={card.id} mailtoHref={mailto} />
        ) : (
          <p className="text-sm text-muted-foreground">Contact unavailable</p>
        ),
      } as BentoCardData;
    }
    case "divider":
      return {
        ...common,
        description: undefined,
        media: (
          <div aria-hidden className="my-2 h-px w-full bg-border" />
        ),
      } as BentoCardData;
    case "text":
    default:
      return {
        ...common,
        description: card.subtitle ?? card.url ?? undefined,
      } as BentoCardData;
  }
}
