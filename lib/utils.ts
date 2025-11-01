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
