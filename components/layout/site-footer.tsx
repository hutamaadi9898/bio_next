import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-background py-10">
      <div className="container flex flex-col gap-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>&copy; {new Date().getFullYear()} Biogrid. Crafted for creators.</p>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="mailto:hello@example.com" className="hover:text-foreground">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
