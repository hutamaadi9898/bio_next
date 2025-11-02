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
      className={cn("rounded-3xl border bg-card p-6 shadow-sm", className)}
      // Light accent hints; maintain AA by avoiding foreground color changes
      style={{
        boxShadow: `inset 0 0 0 1px ${accent}20, 0 20px 45px -15px ${accent}40`,
      }}
    >
      {children}
    </div>
  );
}

