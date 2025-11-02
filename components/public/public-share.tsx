"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { ShareSheet } from "@/components/share/share-sheet";

type PublicShareButtonProps = {
  url: string;
  title?: string;
  size?: "sm" | "default";
};

export function PublicShareButton({ url, title = "Check this out", size = "sm" }: PublicShareButtonProps) {
  const [open, setOpen] = React.useState(false);

  async function onShare() {
    const abs = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ url: abs, title });
        return;
      } catch {
        // fall through to sheet
      }
    }
    setOpen(true);
  }

  return (
    <>
      <Button size={size} variant="outline" onClick={onShare} aria-label="Share profile">
        Share
      </Button>
      <ShareSheet open={open} onOpenChange={setOpen} url={url} title={title} />
    </>
  );
}

