"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/components/theme/theme-context";

type Props = {
  className?: string;
  children: React.ReactNode;
};

// Wraps preview content and reflects the active theme's accent color
// using subtle borders/shadows. Keeps it purely presentational.
export function ThemePreviewContainer({ className, children }: Props) {
  const theme = useThemeContext();
  const accent = theme?.tokens.accent ?? "#2563eb";
  return (
    <div
      className={cn(
        "relative rounded-3xl border bg-card/70 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:backdrop-blur",
        className,
      )}
      style={{
        boxShadow: `inset 0 0 0 1px ${accent}20, 0 20px 45px -15px ${accent}3a`,
        backgroundImage: `linear-gradient(135deg, ${accent}10, transparent 70%)`,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] animate-stripe"
        style={{ backgroundImage: `repeating-linear-gradient(45deg, ${accent}22 0 10px, transparent 12px 22px)` }}
      />
      {children}
    </div>
  );
}
