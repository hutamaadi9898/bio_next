import type { SVGProps } from "react";

import Link from "next/link";

import { BentoGrid } from "@/components/bento/bento-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/error-boundary";

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
          <Badge variant="secondary" aria-label="Tech stack badge">Next.js + Server Actions</Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Build a beautiful bio link. Share it everywhere.
          </h1>
          <p className="text-lg text-muted-foreground">
            Biogrid helps creators and freelancers ship gorgeous bento‑style link hubs in minutes. Drag cards into place, add your links, and publish instantly.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register" aria-label="Create your page for free">Get started free</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/u/biogrid" aria-label="See a live demo">See a live demo</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Free plan available. Upgrade anytime.</p>
        </div>

        <div className="rounded-3xl border bg-gradient-to-br from-background via-background to-muted p-6 shadow-xl">
          <ErrorBoundary>
            <BentoGrid items={previewCards} />
          </ErrorBoundary>
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

      <section id="pricing" className="container space-y-10 rounded-3xl border bg-muted/40 p-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Pricing for creators</h2>
          <p className="mt-3 text-muted-foreground">Start free. Unlock advanced customization and analytics as you grow.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-background p-8 shadow-sm" aria-label="Free plan">
            <p className="text-xl font-semibold">Free</p>
            <p className="mt-1 text-4xl font-bold">$0</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• 1 bio page</li>
              <li>• Core card types</li>
              <li>• Basic click counts</li>
            </ul>
            <Button asChild className="mt-6 w-full" variant="secondary">
              <Link href="/register" aria-label="Start free">Start free</Link>
            </Button>
          </div>
          <div className="rounded-2xl border bg-background p-8 shadow-sm ring-1 ring-primary/20" aria-label="Pro plan">
            <p className="text-xl font-semibold">Pro</p>
            <p className="mt-1 text-4xl font-bold">$5</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Everything in Free</li>
              <li>• Advanced themes</li>
              <li>• Priority support</li>
            </ul>
            <Button asChild className="mt-6 w-full">
              <Link href="/register" aria-label="Choose Pro">Choose Pro</Link>
            </Button>
          </div>
          <div className="rounded-2xl border bg-background p-8 shadow-sm" aria-label="Max plan">
            <p className="text-xl font-semibold">Max</p>
            <p className="mt-1 text-4xl font-bold">$20</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Everything in Pro</li>
              <li>• Custom domains</li>
              <li>• Analytics v2</li>
            </ul>
            <Button asChild className="mt-6 w-full">
              <Link href="/register" aria-label="Go Max">Go Max</Link>
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
