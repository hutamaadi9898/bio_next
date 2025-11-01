import type { SVGProps } from "react";

import Link from "next/link";

import { BentoGrid } from "@/components/bento/bento-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const previewCards = [
  {
    id: "hero-card-1",
    title: "Latest podcast episode",
    subtitle: "Listen on Spotify",
    type: "link" as const,
    cols: 3,
    rows: 2,
    accentColor: "rgba(56, 189, 248, 0.6)",
  },
  {
    id: "hero-card-2",
    title: "Newsletter",
    subtitle: "2k subscribers",
    type: "email" as const,
    cols: 3,
    rows: 1,
    accentColor: "rgba(251, 191, 36, 0.6)",
  },
  {
    id: "hero-card-3",
    title: "Instagram",
    subtitle: "@biogrid",
    type: "social" as const,
    cols: 2,
    rows: 1,
  },
  {
    id: "hero-card-4",
    title: "Work in public",
    description: "Weekly build logs and metrics.",
    type: "text" as const,
    cols: 4,
    rows: 1,
  },
];

export default function MarketingPage() {
  return (
    <div className="space-y-32 pb-20">
      <section className="container grid gap-10 py-24 md:grid-cols-2">
        <div className="space-y-6">
          <Badge variant="secondary">Next.js + Server Actions</Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Your bio link, reimagined as an animated Bento grid.
          </h1>
          <p className="text-lg text-muted-foreground">
            Biogrid helps creators, agencies, and teams ship beautiful link hubs in minutes. Upload media to R2, drag cards into place, and publish instantly.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">Create your page</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/u/biogrid">See a live demo</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Hosted on your infrastructure via Coolify, backed by PostgreSQL 17 and Cloudflare R2.
          </p>
        </div>

        <div className="rounded-3xl border bg-gradient-to-br from-background via-background to-muted p-6 shadow-xl">
          <BentoGrid items={previewCards} />
        </div>
      </section>

      <section id="features" className="container space-y-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Built for teams shipping fast.</h2>
          <p className="mt-3 text-muted-foreground">
            A modern stack with type-safe data, first-class animations, and a minimal environment footprint.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {featureCards.map((feature) => (
            <div key={feature.title} className="rounded-2xl border bg-card p-6 shadow-sm">
              <feature.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="container rounded-3xl border bg-muted/40 p-12">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight">Simple, self-hosted pricing.</h2>
            <p className="text-muted-foreground">
              Deploy once on your Coolify instance. Unlimited pages, members, and analytics baked in.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-6 rounded-2xl border bg-background p-8 shadow-sm">
            <div>
              <p className="text-4xl font-semibold">$0</p>
              <p className="text-sm text-muted-foreground">Self-host forever. Optional pro support if you need a hand.</p>
            </div>
            <Button asChild size="lg">
              <Link href="mailto:hello@example.com">Talk to us</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="faq" className="container grid gap-10 md:grid-cols-2">
        {faqs.map((faq) => (
          <div key={faq.question} className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold">{faq.question}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

const featureCards = [
  {
    title: "Server Actions",
    description: "Lucia-powered auth and Drizzle mutations run entirely through server actions for a compact API surface.",
    icon: function IconHighlight(props: SVGProps<SVGSVGElement>) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
          <path d="M4 19h16M4 5h16" />
          <path d="M9 9h6v6H9z" />
        </svg>
      );
    },
  },
  {
    title: "Drizzle + Postgres 17",
    description: "Schema-safe migrations, analytics columns, and ordering logic ready for production.",
    icon: function IconDatabase(props: SVGProps<SVGSVGElement>) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v6c0 1.657 4.03 3 9 3s9-1.343 9-3V5" />
          <path d="M3 11v6c0 1.657 4.03 3 9 3s9-1.343 9-3v-6" />
        </svg>
      );
    },
  },
  {
    title: "Cloudflare R2",
    description: "S3-compatible asset pipeline keeps profile media fast and inexpensive without egress fees.",
    icon: function IconCloud(props: SVGProps<SVGSVGElement>) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
          <path d="M12 4a5 5 0 00-4.9 6.1A4 4 0 007 18h9a4 4 0 00.62-7.96A5 5 0 0012 4z" />
        </svg>
      );
    },
  },
];

const faqs = [
  {
    question: "Is OAuth supported?",
    answer: "Email + password ships first. The auth layer is ready for OAuth providers when you decide to add them.",
  },
  {
    question: "Can I self-host anywhere?",
    answer: "Yes. Coolify deploys the standalone Next.js output. Just provide DATABASE_URL and R2 credentials.",
  },
  {
    question: "Do you track analytics?",
    answer: "Each card can record click counts today. The schema includes placeholders for richer analytics later.",
  },
  {
    question: "Will this integrate with custom domains?",
    answer: "Phase two. Profiles currently live under /u/:handle but the routing layer is structured for future domain mapping.",
  },
];
