"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { registerAction, checkHandleAvailabilityAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import type { ActionResult } from "@/lib/actions/types";
import { Check, X, Loader2 } from "lucide-react";

const initialState: ActionResult | null = null;

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(registerAction, initialState);
  const [password, setPassword] = React.useState("");
  const [handle, setHandle] = React.useState("");
  const [handleStatus, setHandleStatus] = React.useState<
    | { state: "idle" }
    | { state: "checking" }
    | { state: "available" }
    | { state: "taken" }
    | { state: "invalid"; message: string }
  >({ state: "idle" });
  const handleRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (state && !state.success) {
      const message = Object.values(state.errors).join("\n");
      toast.error(message || "Unable to create account");
    } else if (state && state.success && state.data) {
      // Auto sign in after successful registration
      const email = (state.data as { email: string }).email;
      signIn("credentials", {
        email,
        password,
        redirect: false,
      }).then((result) => {
        if (result?.error) {
          toast.error("Account created but sign in failed. Please sign in manually.");
          router.push("/login");
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      });
    }
  }, [state, password, router]);

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
          ref={handleRef}
          onChange={(e) => {
            setHandle(e.target.value);
            setHandleStatus({ state: "idle" });
          }}
          onBlur={async () => {
            const value = handleRef.current?.value?.trim() || "";
            if (!value) return;
            const validRe = /^[a-z0-9_-]{3,25}$/i;
            if (!validRe.test(value)) {
              setHandleStatus({ state: "invalid", message: "3–25 chars, letters/numbers/_/-" });
              return;
            }
            setHandleStatus({ state: "checking" });
            try {
              const res = await checkHandleAvailabilityAction(value);
              if (res.success && res.data?.available) setHandleStatus({ state: "available" });
              else if (res.success && !res.data?.available) setHandleStatus({ state: "taken" });
              else setHandleStatus({ state: "invalid", message: "Invalid handle" });
            } catch {
              setHandleStatus({ state: "idle" });
            }
          }}
        />
        {state && !state.success && state.errors.handle ? (
          <p className="text-sm text-destructive">{state.errors.handle}</p>
        ) : null}
        <HandleHint status={handleStatus} />
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
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
        />
        {state && !state.success && state.errors.password ? (
          <p className="text-sm text-destructive">{state.errors.password}</p>
        ) : null}
        <PasswordStrengthHint value={password} />
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

function HandleHint({
  status,
}: {
  status:
    | { state: "idle" }
    | { state: "checking" }
    | { state: "available" }
    | { state: "taken" }
    | { state: "invalid"; message: string };
}) {
  if (status.state === "idle") return null;
  return (
    <p className="flex items-center gap-2 text-sm" aria-live="polite">
      {status.state === "checking" ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Checking availability…</span>
        </>
      ) : status.state === "available" ? (
        <>
          <Check className="h-4 w-4 text-emerald-500" />
          <span className="text-emerald-600">Handle is available</span>
        </>
      ) : status.state === "taken" ? (
        <>
          <X className="h-4 w-4 text-destructive" />
          <span className="text-destructive">Handle is taken</span>
        </>
      ) : (
        <>
          <X className="h-4 w-4 text-destructive" />
          <span className="text-destructive">{status.message}</span>
        </>
      )}
    </p>
  );
}

function PasswordStrengthHint({ value }: { value: string }) {
  const { label, className } = React.useMemo(() => {
    const v = value || "";
    if (v.length === 0) return { label: "", className: "" };
    const lengthOk = v.length >= 12;
    const hasLower = /[a-z]/.test(v);
    const hasUpper = /[A-Z]/.test(v);
    const hasNumber = /\d/.test(v);
    const hasSymbol = /[^A-Za-z0-9]/.test(v);
    const score = [lengthOk, hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
    if (score >= 4) return { label: "Strong password", className: "text-emerald-600" };
    if (score >= 3) return { label: "Good — consider adding symbols", className: "text-amber-600" };
    return { label: "Weak — use 12+ chars & variety", className: "text-destructive" };
  }, [value]);
  if (!label) return null;
  return <p className={`text-xs ${className}`}>{label}</p>;
}
