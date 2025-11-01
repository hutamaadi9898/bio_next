import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to edit your Bento grid.</p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account yet?{' '}
        <Link href="/register" className="font-medium text-primary">
          Register now
        </Link>
      </p>
    </div>
  );
}
