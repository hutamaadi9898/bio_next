"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

/**
 * Small button used in the global header to switch between light and dark
 * themes. Using `next-themes` keeps state in sync across client boundaries.
 */
export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const mode = theme === "system" ? resolvedTheme : theme;

  const handleToggle = React.useCallback(() => {
    setTheme(mode === "dark" ? "light" : "dark");
  }, [mode, setTheme]);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={handleToggle}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
