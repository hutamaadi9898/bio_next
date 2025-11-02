"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { completeOnboardingAction } from "@/app/(dashboard)/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { THEME_PRESETS } from "@/lib/themes";
import { themePresetValues } from "@/lib/validation/cards";
import type { ActionResult } from "@/lib/actions/types";
import { ShareSheet } from "@/components/share/share-sheet";

export function OnboardingForm() {
  const initialState: ActionResult<{ publicUrl: string }> | null = null;
  const [state, action] = useActionState(completeOnboardingAction, initialState);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (state?.success && state.data?.publicUrl) setOpen(true);
  }, [state]);
  const shareUrl = state && state.success && state.data ? state.data.publicUrl : "";
  return (
    <>
      <form action={action} className="space-y-8">
        <PresetStep />
        <LinksStep />
        <FinishButton />
        {state && !state.success ? (
          <p className="text-sm text-destructive">{Object.values(state.errors).join(" ")}</p>
        ) : null}
      </form>
      <ShareSheet open={open} onOpenChange={setOpen} url={shareUrl} />
    </>
  );
}

function PresetStep() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">1. Choose a preset</h2>
        <p className="text-sm text-muted-foreground">Pick a theme to start with. You can tweak it later.</p>
      </div>
      <fieldset className="grid gap-3 sm:grid-cols-2">
        {themePresetValues.map((preset) => (
          <label key={preset} className="flex cursor-pointer items-center justify-between rounded-xl border p-4">
            <div>
              <div className="font-medium capitalize">{preset}</div>
              <div className="text-xs text-muted-foreground">Accent: {THEME_PRESETS[preset].palette.accent}</div>
            </div>
            <input type="radio" name="preset" value={preset} defaultChecked={preset === "minimal"} aria-label={`Select ${preset}`} />
          </label>
        ))}
      </fieldset>
    </section>
  );
}

function LinksStep() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">3. Add 3 links</h2>
        <p className="text-sm text-muted-foreground">Paste URLs or type patterns like "twitter @janedoe".</p>
      </div>
      <div className="grid gap-3">
        <Input name="link1" placeholder="https://… or e.g. twitter @janedoe" />
        <Input name="link2" placeholder="https://… or e.g. instagram @janedoe" />
        <Input name="link3" placeholder="https://… or e.g. github @janedoe" />
      </div>
    </section>
  );
}

function FinishButton() {
  const { pending } = useFormStatus();
  return (
    <div className="flex justify-end">
      <Button type="submit" disabled={pending} aria-label="Finish and publish">
        {pending ? "Working…" : "Finish & Publish"}
      </Button>
    </div>
  );
}
