"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createCardAction, updateCardAction } from "@/app/(dashboard)/dashboard/actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import type { ActionResult } from "@/lib/actions/types";
import { cardTypeValues } from "@/lib/validation/cards";
import type { Card } from "@/drizzle/schema";

type CardEditorDialogProps = {
  trigger: React.ReactNode;
  card?: Card;
};

const initialState: ActionResult | null = null;

export function CardEditorDialog({ trigger, card }: CardEditorDialogProps) {
  const [open, setOpen] = React.useState(false);
  const action = card ? updateCardAction : createCardAction;
  const [state, formAction] = useActionState(action, initialState);

  React.useEffect(() => {
    if (state?.success) {
      setOpen(false);
      toast.success(card ? "Card updated" : "Card added");
    }
    if (state && !state.success) {
      toast.error(Object.values(state.errors).join("\n") || "Unable to save card");
    }
  }, [state, card]);

  const accentInitial = card?.accentColor ?? "#2563eb";
  const [accentColor, setAccentColor] = React.useState(accentInitial);

  React.useEffect(() => {
    setAccentColor(accentInitial);
  }, [accentInitial, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{card ? "Edit card" : "Add new card"}</DialogTitle>
          <DialogDescription>
            {card
              ? "Update the content and layout for this card."
              : "Define the content, type, and size of the new card."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {card ? <input type="hidden" name="cardId" value={card.id} /> : null}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={card?.title} required />
            {state && !state.success && state.errors.title ? (
              <p className="text-sm text-destructive">{state.errors.title}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input id="subtitle" name="subtitle" defaultValue={card?.subtitle ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                defaultValue={card?.type ?? cardTypeValues[0]}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {cardTypeValues.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {state && !state.success && state.errors.type ? (
                <p className="text-sm text-destructive">{state.errors.type}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent</Label>
              <Input
                id="accentColor"
                name="accentColor"
                type="color"
                value={accentColor}
                onChange={(event) => setAccentColor(event.target.value)}
                className="h-10 w-16 p-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input id="url" name="url" defaultValue={card?.url ?? ""} placeholder="https://"
              aria-describedby="url-help" />
            <p id="url-help" className="text-xs text-muted-foreground">
              For video/music/map, paste the public link (YouTube, Spotify, Google Maps, etc.).
            </p>
            {state && !state.success && state.errors.url ? (
              <p className="text-sm text-destructive">{state.errors.url}</p>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cols">Columns</Label>
              <Input
                id="cols"
                name="cols"
                type="number"
                min={1}
                max={6}
                defaultValue={card?.cols ?? 3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rows">Rows</Label>
              <Input
                id="rows"
                name="rows"
                type="number"
                min={1}
                max={3}
                defaultValue={card?.rows ?? 1}
              />
            </div>
          </div>
          <DialogFooter>
            <SubmitButton label={card ? "Save changes" : "Create card"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving..." : label}
    </Button>
  );
}
