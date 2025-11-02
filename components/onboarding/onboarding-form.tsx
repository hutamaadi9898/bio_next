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
import { CheckCircle2 } from "lucide-react";

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
  const [selected, setSelected] = React.useState<string>("minimal");
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">1. Choose a preset</h2>
        {selected ? <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden /> : null}
      </div>
      <p className="text-sm text-muted-foreground">Pick a theme to start with. You can tweak it later.</p>
      <fieldset className="grid gap-3 sm:grid-cols-2">
        {themePresetValues.map((preset) => {
          const accent = THEME_PRESETS[preset].palette.accent;
          const isSelected = selected === preset;
          return (
            <label
              key={preset}
              className={`relative flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-shadow focus-within:ring-2 focus-within:ring-primary/40 ${
                isSelected ? "shadow-[0_0_0_1px_var(--ring)]" : ""
              }`}
              style={{
                // subtle accent border on selection
                // @ts-ignore -- css var injection
                ["--ring" as any]: accent,
                boxShadow: isSelected ? `inset 0 0 0 1px ${accent}` : undefined,
              }}
            >
              <div>
                <div className="font-medium capitalize">{preset}</div>
                <div className="text-xs text-muted-foreground">Accent: {accent}</div>
              </div>
              <input
                type="radio"
                name="preset"
                value={preset}
                defaultChecked={preset === "minimal"}
                aria-label={`Select ${preset}`}
                onChange={() => setSelected(preset)}
              />
            </label>
          );
        })}
      </fieldset>
    </section>
  );
}

function LinksStep() {
  const [values, setValues] = React.useState({ link1: "", link2: "", link3: "" });
  const anyFilled = values.link1 || values.link2 || values.link3;
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">3. Add up to 3 links</h2>
        {anyFilled ? <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden /> : null}
      </div>
      <p className="text-sm text-muted-foreground">Paste URLs or type patterns like “twitter @janedoe”. You can change or add more later.</p>
      <div className="grid gap-3">
        <Input name="link1" placeholder="https://… or e.g. twitter @janedoe" onChange={(e) => setValues((v) => ({ ...v, link1: e.target.value }))} />
        <Input name="link2" placeholder="https://… or e.g. instagram @janedoe" onChange={(e) => setValues((v) => ({ ...v, link2: e.target.value }))} />
        <Input name="link3" placeholder="https://… or e.g. github @janedoe" onChange={(e) => setValues((v) => ({ ...v, link3: e.target.value }))} />
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
