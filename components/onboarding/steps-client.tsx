"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { completeOnboardingAction } from "@/app/(dashboard)/onboarding/actions";
import { uploadAvatarAction, uploadBannerAction } from "@/app/(dashboard)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShareSheet } from "@/components/share/share-sheet";
import type { ActionResult } from "@/lib/actions/types";

export function AvatarUploader() {
  const initial: ActionResult<{ url: string }> | null = null;
  const [state, formAction] = useActionState(uploadAvatarAction, initial);
  const [preview, setPreview] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    if (state?.success && state.data?.url) {
      setPreview(state.data.url);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [state]);
  return (
    <form action={formAction} className="space-y-2 rounded-xl border p-4">
      <Label>Avatar</Label>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 overflow-hidden rounded-full border bg-muted">
          {preview ? <img src={preview} alt="Avatar" className="h-full w-full object-cover" /> : null}
        </div>
        <Input ref={inputRef} name="avatar" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
        <Button type="submit" variant="outline">Upload</Button>
      </div>
      {state && !state.success ? (
        <p className="text-sm text-destructive">{state.errors.avatar ?? "Unable to upload avatar"}</p>
      ) : null}
    </form>
  );
}

export function BannerUploader() {
  const initial: ActionResult<{ url: string }> | null = null;
  const [state, formAction] = useActionState(uploadBannerAction, initial);
  const [preview, setPreview] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    if (state?.success && state.data?.url) {
      setPreview(state.data.url);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [state]);
  return (
    <form action={formAction} className="space-y-2 rounded-xl border p-4">
      <Label>Banner</Label>
      <div className="flex items-center gap-3">
        <div className="h-12 w-full overflow-hidden rounded-lg border bg-muted">
          {preview ? <img src={preview} alt="Banner" className="h-full w-full object-cover" /> : null}
        </div>
        <Input ref={inputRef} name="banner" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
        <Button type="submit" variant="outline">Upload</Button>
      </div>
      {state && !state.success ? (
        <p className="text-sm text-destructive">{state.errors.banner ?? "Unable to upload banner"}</p>
      ) : null}
    </form>
  );
}

export function FinishStep() {
  const initialState: ActionResult<{ publicUrl: string }> | null = null;
  const [state, action] = useActionState(completeOnboardingAction, initialState);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (state?.success && state.data?.publicUrl) setOpen(true);
  }, [state]);
  const shareUrl = state && state.success && state.data ? state.data.publicUrl : "";
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">4. Finish & publish</h2>
        <p className="text-sm text-muted-foreground">We’ll generate a hero, an about, and your first links.</p>
      </div>
      <form action={action} className="space-y-4">
        <div className="flex justify-end">
          <FinishButton />
        </div>
        {state && !state.success ? (
          <p className="text-sm text-destructive">{Object.values(state.errors).join(" ")}</p>
        ) : null}
      </form>
      <ShareSheet open={open} onOpenChange={setOpen} url={shareUrl} />
    </section>
  );
}

function FinishButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-label="Finish and publish">
      {pending ? "Working…" : "Finish & Publish"}
    </Button>
  );
}
