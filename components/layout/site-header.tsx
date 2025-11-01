import Link from "next/link";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  className?: string;
  currentUser?: { id: string; email: string | null; handle: string | null } | null;
};

export function SiteHeader({ className, currentUser }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur",
        className,
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">β</span>
          <span>Biogrid</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link className="text-muted-foreground transition hover:text-foreground" href="#features">
            Features
          </Link>
          <Link className="text-muted-foreground transition hover:text-foreground" href="#pricing">
            Pricing
          </Link>
          <Link className="text-muted-foreground transition hover:text-foreground" href="#faq">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {currentUser ? (
            <div className="flex items-center gap-2">
              {currentUser.handle ? (
                <Button asChild variant="ghost">
                  <Link href={`/u/${currentUser.handle}`}>View profile</Link>
                </Button>
              ) : null}
              <Button asChild variant="default">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            </div>
          ) : (
            <Button asChild variant="secondary">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
