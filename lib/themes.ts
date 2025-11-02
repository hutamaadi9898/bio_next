export type ThemePresetName = "minimal" | "studio" | "neon" | "pastel";

// Resolved tokens used by UI. We avoid storing class names in DB; instead,
// we map a stored preset name to concrete classes at runtime.
export type ResolvedTypography = {
  label: string; // tailwind class names
  title: string; // tailwind class names
};

export type ResolvedPalette = {
  accent: string; // hex string
  background: string; // hex string (used in gradients/containers)
};

export type ResolvedTheme = {
  preset: ThemePresetName;
  palette: ResolvedPalette;
  typography: ResolvedTypography;
};

export const THEME_PRESETS: Record<ThemePresetName, ResolvedTheme> = {
  minimal: {
    preset: "minimal",
    palette: { accent: "#2563eb", background: "#0f172a" },
    typography: {
      label: "text-[10px] uppercase tracking-[0.2em]",
      title: "text-lg font-semibold leading-tight sm:text-xl",
    },
  },
  studio: {
    preset: "studio",
    palette: { accent: "#22c55e", background: "#0b1020" },
    typography: {
      label: "text-xs uppercase tracking-[0.18em]",
      title: "text-xl font-semibold leading-tight sm:text-2xl",
    },
  },
  neon: {
    preset: "neon",
    palette: { accent: "#a855f7", background: "#0a0a0f" },
    typography: {
      label: "text-[11px] uppercase tracking-[0.25em]",
      title: "text-xl font-bold leading-tight sm:text-2xl",
    },
  },
  pastel: {
    preset: "pastel",
    palette: { accent: "#fb7185", background: "#111827" },
    typography: {
      label: "text-xs uppercase tracking-[0.15em]",
      title: "text-lg font-medium leading-tight sm:text-xl",
    },
  },
};

// Resolve stored JSON into a concrete theme; fills missing fields, defaults to minimal.
export function resolveTheme(input: unknown): ResolvedTheme {
  function isThemePresetName(x: unknown): x is ThemePresetName {
    return typeof x === "string" && Object.hasOwn(THEME_PRESETS, x);
  }
  const json = (input ?? {}) as Partial<{
    preset: ThemePresetName;
    accent: string;
    background: string;
  }>;
  const validPreset = isThemePresetName(json.preset) ? json.preset : "minimal";
  const base = THEME_PRESETS[validPreset];
  return {
    preset: validPreset,
    palette: {
      accent: json.accent ?? base.palette.accent,
      background: json.background ?? base.palette.background,
    },
    typography: base.typography,
  };
}

// Phase 3: auto-palette extraction from avatar/hero images.
// Uses a dynamic import of `node-vibrant` so client bundles stay slim and
// environments without the dependency installed gracefully fall back.
// Server‑only color extraction has been moved to lib/themes-server.ts to avoid
// bundling optional dependencies in Client Components.
