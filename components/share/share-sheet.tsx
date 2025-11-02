"use client";

import * as React from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ShareSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title?: string;
};

export function ShareSheet({ open, onOpenChange, url, title = "Check out my Biogrid" }: ShareSheetProps) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function webShare() {
    try {
      if (navigator.share) {
        await navigator.share({ url: url.startsWith("http") ? url : window.location.origin + url, title });
      }
    } catch {}
  }

  const shareUrlAbs = React.useMemo(() => {
    if (typeof window !== "undefined") {
      return url.startsWith("http") ? url : `${window.location.origin}${url}`;
    }
    return url;
  }, [url]);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrlAbs)}`;

  const twitter = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrlAbs)}&text=${encodeURIComponent(title)}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrlAbs)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share your page</DialogTitle>
          <DialogDescription>Copy, share, or scan to visit your public profile.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input readOnly value={shareUrlAbs} />
            <Button onClick={copy} variant="secondary">{copied ? "Copied" : "Copy"}</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={webShare}>System Share</Button>
            <a href={twitter} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">Share on Twitter</Button>
            </a>
            <a href={linkedin} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">Share on LinkedIn</Button>
            </a>
          </div>
          <div className="mt-2 flex items-center gap-4">
            <img src={qrSrc} alt="QR code" className="h-40 w-40 rounded-md border bg-muted" />
            <p className="text-sm text-muted-foreground">Scan the QR code to open your profile.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

