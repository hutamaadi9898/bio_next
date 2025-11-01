"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";

import { loginAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import type { ActionResult } from "@/lib/actions/types";

const initialState: ActionResult | null = null;

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  React.useEffect(() => {
    if (state && !state.success) {
      const message = Object.values(state.errors).join("\n");
      toast.error(message || "Unable to sign in");
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
        {state && !state.success && state.errors.email ? (
          <p className="text-sm text-destructive">{state.errors.email}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
            Forgot?
          </Link>
        </div>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
        {state && !state.success && state.errors.password ? (
          <p className="text-sm text-destructive">{state.errors.password}</p>
        ) : null}
      </div>
      <SubmitButton label="Sign in" />
      <p className="text-sm text-muted-foreground">
        Need an account?{" "}
        <Link href="/register" className="font-medium text-primary">
          Create one
        </Link>
      </p>
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
