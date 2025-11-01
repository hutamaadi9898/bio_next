import type { Metadata, Viewport } from "next";
// Removed next/font/google to avoid network fetches in dev/build
// When network is available, consider using `next/font/local` instead.
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";

import "./globals.css";

// Font is controlled via CSS variable in globals.css (`--font-sans`).

export const metadata: Metadata = {
  title: {
    default: "Biogrid — Build your bio link",
    template: "%s | Biogrid",
  },
  description:
    "Create a beautiful bento-style bio link in minutes. Drag and drop cards, upload images, and share your page.",
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  keywords: [
    "bio link",
    "link in bio",
    "bento grid",
    "next.js",
    "creator tools",
  ],
  openGraph: {
    type: "website",
    title: "Biogrid — Build your bio link",
    description:
      "Create a beautiful bento-style bio link in minutes. Drag and drop cards, upload images, and share your page.",
    url: "/",
    siteName: "Biogrid",
  },
  twitter: {
    card: "summary_large_image",
    title: "Biogrid — Build your bio link",
    description:
      "Create a beautiful bento-style bio link in minutes. Drag and drop cards, upload images, and share your page.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  // Dark-only UI
  themeColor: [{ color: "#0a0a0a" }],
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const currentUser = await getCurrentUser();
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <div className="flex min-h-screen flex-col">
          <a href="#main" className="skip-link">Skip to content</a>
          <SiteHeader
            currentUser={
              currentUser
                ? {
                    id: currentUser.id,
                    email: currentUser.email,
                    handle: currentUser.profile?.handle ?? null,
                  }
                : null
            }
          />
          <main id="main" className="flex-1">{children}</main>
          <SiteFooter />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
