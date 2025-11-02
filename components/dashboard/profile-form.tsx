"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { updateProfileAction } from "@/app/(dashboard)/dashboard/actions";
import { uploadAvatarAction, uploadBannerAction } from "@/app/(dashboard)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import type { ActionResult } from "@/lib/actions/types";

type ProfileFormProps = {
  initialValues: {
    displayName: string;
    bio: string;
    accentColor: string;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
  };
};

const initialState: ActionResult | null = null;

export function ProfileForm({ initialValues }: ProfileFormProps) {
  const [state, formAction] = useActionState(updateProfileAction, initialState);
  const [accentColor, setAccentColor] = React.useState(initialValues.accentColor ?? "#2563eb");
  const [avatarUrl, setAvatarUrl] = React.useState(initialValues.avatarUrl ?? null);
  const [bannerUrl, setBannerUrl] = React.useState(initialValues.bannerUrl ?? null);

  React.useEffect(() => {
    if (state?.success) {
      toast.success("Profile updated");
    }
    if (state && !state.success) {
      toast.error(Object.values(state.errors).join("\n") || "Unable to update profile");
    }
  }, [state]);

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground">Control how your public page appears.</p>
      </div>
      <AvatarUploader avatarUrl={avatarUrl} onUploaded={setAvatarUrl} />
      <BannerUploader bannerUrl={bannerUrl} onUploaded={setBannerUrl} />
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input id="displayName" name="displayName" defaultValue={initialValues.displayName} required />
          {state && !state.success && state.errors.displayName ? (
            <p className="text-sm text-destructive">{state.errors.displayName}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" name="bio" defaultValue={initialValues.bio} rows={4} placeholder="A short introduction" />
          {state && !state.success && state.errors.bio ? (
            <p className="text-sm text-destructive">{state.errors.bio}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="accentColor">Accent color</Label>
          <div className="flex items-center gap-3">
            <Input
              id="accentColor"
              name="accentColor"
              type="color"
              value={accentColor}
              onChange={(event) => setAccentColor(event.target.value)}
              className="h-10 w-16 p-1"
            />
            <span className="text-sm text-muted-foreground">Used for highlight accents.</span>
          </div>
          {state && !state.success && state.errors.accentColor ? (
            <p className="text-sm text-destructive">{state.errors.accentColor}</p>
          ) : null}
        </div>
        <SubmitButton label="Save changes" />
      </form>
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

type AvatarUploaderProps = {
  avatarUrl: string | null;
  onUploaded: (url: string | null) => void;
};

const avatarInitialState: ActionResult<{ url: string }> | null = null;

function AvatarUploader({ avatarUrl, onUploaded }: AvatarUploaderProps) {
  const [state, formAction] = useActionState(uploadAvatarAction, avatarInitialState);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (state?.success && state.data) {
      onUploaded(state.data.url);
      toast.success("Avatar updated");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
    if (state && !state.success) {
      toast.error(state.errors.avatar ?? "Unable to upload avatar");
    }
  }, [state, onUploaded]);

  return (
    <form action={formAction} className="flex items-center gap-4">
      <div className="h-16 w-16 overflow-hidden rounded-full border bg-muted">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-1 items-center gap-3">
        <Input ref={inputRef} name="avatar" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
        <AvatarSubmitButton />
      </div>
    </form>
  );
}

function AvatarSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? "Uploading..." : "Upload"}
    </Button>
  );
}

type BannerUploaderProps = {
  bannerUrl: string | null;
  onUploaded: (url: string | null) => void;
};

const bannerInitialState: ActionResult<{ url: string }> | null = null;

function BannerUploader({ bannerUrl, onUploaded }: BannerUploaderProps) {
  const [state, formAction] = useActionState(uploadBannerAction, bannerInitialState);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (state?.success && state.data) {
      onUploaded(state.data.url);
      toast.success("Banner updated");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
    if (state && !state.success) {
      toast.error(state.errors.banner ?? "Unable to upload banner");
    }
  }, [state, onUploaded]);

  return (
    <form action={formAction} className="flex items-center gap-4">
      <div className="h-16 w-full overflow-hidden rounded-xl border bg-muted sm:h-20">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No banner
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Input ref={inputRef} name="banner" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
        <BannerSubmitButton />
      </div>
    </form>
  );
}

function BannerSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? "Uploading..." : "Upload"}
    </Button>
  );
}
