import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ProfileNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-24 text-center">
      <h1 className="text-3xl font-semibold">Profile not found</h1>
      <p className="text-muted-foreground">
        This bio link is not published yet. Double-check the handle or reach out to the creator.
      </p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
