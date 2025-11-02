// Server-only helpers for theme color extraction.
import type { ResolvedPalette, ThemePresetName, ResolvedTheme } from "@/lib/themes";
import { THEME_PRESETS } from "@/lib/themes";

export type { ResolvedPalette, ThemePresetName, ResolvedTheme };
export { THEME_PRESETS };

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

function toLinear(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
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

function contrastRatio(l1: number, l2: number): number {
  const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (light + 0.05) / (dark + 0.05);
}

function hasAcceptableContrast(fgHex: string, bgHex: string, min = 3): boolean {
  const ratio = contrastRatio(hexToLuminance(fgHex), hexToLuminance(bgHex));
  return ratio >= min;
}

export async function extractAutoPaletteFromImage(imageUrl: string, fallback: ResolvedPalette): Promise<ResolvedPalette> {
  try {
    const res = await fetch(imageUrl, { cache: "no-store" });
    if (!res.ok) return fallback;
    const ab = await res.arrayBuffer();
    const buf = Buffer.from(ab);

    // Optional require without bundler resolution; works only on Node runtime.
    let Vibrant: any = null;
    try {
      // eslint-disable-next-line no-eval
      const req = (eval("require") as NodeRequire);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      Vibrant = req("node-vibrant");
    } catch {
      Vibrant = null;
    }
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

    if (!hasAcceptableContrast(accent, fallback.background)) {
      return fallback;
    }

    return { accent, background: fallback.background };
  } catch {
    return fallback;
  }
}

