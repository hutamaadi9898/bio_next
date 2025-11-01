import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Account",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-16">
      <div className="w-full max-w-md space-y-8 rounded-2xl border bg-card p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
