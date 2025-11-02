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
export async function extractAutoPaletteFromImage(
  imageUrl: string,
  fallback: ResolvedPalette,
): Promise<ResolvedPalette> {
  try {
    const res = await fetch(imageUrl, { cache: "no-store" });
    if (!res.ok) return fallback;
    const ab = await res.arrayBuffer();
    const buf = Buffer.from(ab);

    // Dynamic import to avoid bundling in client and optionalize the dep
    const VibrantMod = await import("node-vibrant").catch(() => null as unknown as { default: any });
    const Vibrant = VibrantMod?.default ?? (VibrantMod as any);
    if (!Vibrant) return fallback;

    const palette = await Vibrant.from(buf).getPalette();
    const swatch =
      palette.Vibrant ||
      palette.LightVibrant ||
      palette.DarkVibrant ||
      palette.Muted ||
      palette.DarkMuted ||
      null;
    const hex = typeof swatch?.getHex === "function" ? (swatch.getHex() as string) : null;
    const accent = normalizeHex(hex) ?? fallback.accent;

    // Make sure we don't pick a color with poor contrast against background
    if (!hasAcceptableContrast(accent, fallback.background)) {
      return fallback;
    }

    return { accent, background: fallback.background };
  } catch {
    return fallback;
  }
}

function normalizeHex(input: string | null | undefined): string | null {
  if (!input) return null;
  const hex = input.startsWith("#") ? input : `#${input}`;
  if (/^#([0-9a-fA-F]{6})$/.test(hex)) return hex.toLowerCase();
  if (/^#([0-9a-fA-F]{3})$/.test(hex)) {
    const r = hex[1]!, g = hex[2]!, b = hex[3]!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

// Basic WCAG contrast check; for accent vs background we aim for >= 3:1
function hasAcceptableContrast(fgHex: string, bgHex: string, min = 3): boolean {
  const ratio = contrastRatio(hexToLuminance(fgHex), hexToLuminance(bgHex));
  return ratio >= min;
}

function hexToLuminance(hex: string): number {
  const m = /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(
    normalizeHex(hex) ?? "#000000",
  );
  const r = m ? parseInt(m[1]!, 16) : 0;
  const g = m ? parseInt(m[2]!, 16) : 0;
  const b = m ? parseInt(m[3]!, 16) : 0;
  const rl = toLinear(r);
  const gl = toLinear(g);
  const bl = toLinear(b);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function toLinear(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function contrastRatio(l1: number, l2: number): number {
  const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (light + 0.05) / (dark + 0.05);
}
