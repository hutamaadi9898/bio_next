"use client";

import * as React from "react";
import type { ThemePresetName } from "@/lib/themes";
import { THEME_PRESETS } from "@/lib/themes";

export type ThemeTypography = { label: string; title: string };

export type ThemeTokens = {
  preset: ThemePresetName;
  accent: string;
  typography: ThemeTypography;
};

type ThemeContextValue = {
  tokens: ThemeTokens;
  setPresetOptimistic: (preset: ThemePresetName) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  initialPreset: ThemePresetName;
  initialAccent: string;
  initialTypography: ThemeTypography;
  children: React.ReactNode;
};

export function ThemeProvider({ initialPreset, initialAccent, initialTypography, children }: ThemeProviderProps) {
  const [tokens, setTokens] = React.useState<ThemeTokens>({
    preset: initialPreset,
    accent: initialAccent,
    typography: initialTypography,
  });

  const setPresetOptimistic = React.useCallback((preset: ThemePresetName) => {
    const next = THEME_PRESETS[preset];
    setTokens({ preset: next.preset, accent: next.palette.accent, typography: next.typography });
  }, []);

  const value = React.useMemo<ThemeContextValue>(() => ({ tokens, setPresetOptimistic }), [tokens, setPresetOptimistic]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue | null {
  return React.useContext(ThemeContext);
}

