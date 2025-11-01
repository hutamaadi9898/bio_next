"use client";

import * as React from "react";

import { trackCardClickAction } from "@/app/(public)/u/[handle]/actions";
import { Button } from "@/components/ui/button";

type PublicCardLinkProps = {
  cardId: string;
  href: string;
  label?: string;
  newTab?: boolean;
};

/**
 * Button wrapper that tracks clicks via a server action before navigating to
 * the destination URL.
 */
export function PublicCardLink({ cardId, href, label = "Open", newTab = true }: PublicCardLinkProps) {
  const [isPending, startTransition] = React.useTransition();

  const handleClick = React.useCallback(() => {
    startTransition(async () => {
      try {
        await trackCardClickAction(cardId);
      } catch (error) {
        // Tracking failure should not block navigation.
        console.error("Failed to record click", error);
      }
    });
  }, [cardId]);

  return (
    <Button asChild variant="secondary" disabled={isPending} className="w-full">
      <a href={href} onClick={handleClick} target={newTab ? "_blank" : undefined} rel={newTab ? "noreferrer" : undefined}>
        {isPending ? "Loading..." : label}
      </a>
    </Button>
  );
}
