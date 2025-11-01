"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { registerAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import type { ActionResult } from "@/lib/actions/types";

const initialState: ActionResult | null = null;

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);

  React.useEffect(() => {
    if (state && !state.success) {
      const message = Object.values(state.errors).join("\n");
      toast.error(message || "Unable to create account");
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" name="displayName" required placeholder="Jane Doe" />
        {state && !state.success && state.errors.displayName ? (
          <p className="text-sm text-destructive">{state.errors.displayName}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="handle">Handle</Label>
        <Input
          id="handle"
          name="handle"
          required
          placeholder="janedoe"
          autoComplete="username"
        />
        {state && !state.success && state.errors.handle ? (
          <p className="text-sm text-destructive">{state.errors.handle}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
        {state && !state.success && state.errors.email ? (
          <p className="text-sm text-destructive">{state.errors.email}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" />
        {state && !state.success && state.errors.password ? (
          <p className="text-sm text-destructive">{state.errors.password}</p>
        ) : null}
      </div>
      <SubmitButton label="Create account" />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Working..." : label}
    </Button>
  );
}
