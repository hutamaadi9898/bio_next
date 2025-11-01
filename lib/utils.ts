import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind-friendly class name merger. Keeps utility order deterministic
 * and avoids the usual `clsx` + `tailwind-merge` boilerplate scattered around.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolve an absolute URL using the application origin env variable.
 */
export function absoluteUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

/**
 * Simple helper to clamp a value between two numbers.
 */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Extract a YouTube video ID from common URL formats.
 * Returns null if not a YouTube URL.
 */
export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id && id.length >= 10 ? id : null;
    }
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "");
      return id && id.length >= 10 ? id : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function youTubeThumbUrl(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Convert an open.spotify.com URL to an embed URL. Supports common types like
 * track, album, playlist, artist, show, episode. Returns null if not Spotify.
 */
export function toSpotifyEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("open.spotify.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const [type, id] = parts;
    if (!type || !id) return null;
    // Force dark theme = 0
    const darkParam = "theme=0";
    return `https://open.spotify.com/embed/${type}/${id}?${darkParam}`;
  } catch {
    return null;
  }
}
