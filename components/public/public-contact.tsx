"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/actions/types";
import { sendContactMessageAction } from "@/app/(public)/u/[handle]/actions";

type PublicContactFormProps = {
  cardId: string;
  mailtoHref: string;
};

export function PublicContactForm({ cardId, mailtoHref }: PublicContactFormProps) {
  const initial: ActionResult | null = null;
  const [state, formAction] = React.useActionState(sendContactMessageAction, initial);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (state?.success) setDone(true);
  }, [state]);

  if (done) {
    return <p className="text-sm text-muted-foreground">Thanks! Your message was sent.</p>;
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="cardId" value={cardId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="name" placeholder="Your name" required />
        <Input type="email" name="email" placeholder="you@example.com" required />
      </div>
      <Textarea name="message" placeholder="Say hello…" required rows={4} />
      {state && !state.success && state.errors?.form && (
        <p className="text-sm text-destructive">{state.errors.form}</p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit">Send message</Button>
        <a href={mailtoHref} className="text-sm text-muted-foreground underline" aria-label="Email directly">
          or email me directly
        </a>
      </div>
    </form>
  );
}

