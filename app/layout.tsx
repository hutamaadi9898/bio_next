import type { Metadata, Viewport } from "next";
// Removed next/font/google to avoid network fetches in dev/build
// When network is available, consider using `next/font/local` instead.
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/auth/lucia";
import { env } from "@/lib/env";

import "./globals.css";

// Font is controlled via CSS variable in globals.css (`--font-sans`).

export const metadata: Metadata = {
  title: {
    default: "Biogrid — Bento bio link builder",
    template: "%s | Biogrid",
  },
  description:
    "Design a highly visual bento-style bio link page with drag and drop cards, analytics and R2-backed media storage.",
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }, { color: "#ffffff" }],
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const currentUser = await getCurrentUser();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
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
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
