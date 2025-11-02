"use client";

import * as React from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { useThemeContext } from "@/components/theme/theme-context";

export type BentoCardType =
  | "link"
  | "social"
  | "email"
  | "text"
  | "image"
  | "video"
  | "music"
  | "map"
  | "divider";

export type BentoCardData = {
  id: string;
  title: string;
  subtitle?: string | null;
  href?: string | null;
  type: BentoCardType;
  cols: number;
  rows: number;
  accentColor?: string | null;
  description?: string | null;
  icon?: React.ReactNode;
  media?: React.ReactNode;
};

export type BentoGridProps = {
  items: BentoCardData[];
  className?: string;
  typography?: { label: string; title: string };
};

/**
 * Animated Bento grid that we reuse for both the marketing preview and the
 * dashboard/public views. Passing LayoutGroup keys keeps reorder animations
 * fluid when cards move between positions.
 */
export function BentoGrid({ items, className, typography }: BentoGridProps) {
  const reduceMotion = useReducedMotion();
  const themeCtx = useThemeContext();
  const labelClass = themeCtx?.tokens.typography.label ?? typography?.label ?? "text-xs uppercase tracking-widest";
  const titleClass = themeCtx?.tokens.typography.title ?? typography?.title ?? "text-lg font-semibold leading-tight sm:text-xl";
  return (
    <LayoutGroup>
      <div
        className={cn(
          "grid gap-4 sm:grid-cols-6",
          className,
        )}
      >
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.article
              key={item.id}
              layout
              layoutId={item.id}
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", damping: 18, stiffness: 220 }}
              className={cn(
                "group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border bg-card/70 p-5 text-card-foreground shadow-sm backdrop-blur supports-[backdrop-filter]:backdrop-blur",
                // Micro-interactions: hover lift, tap scale, focus ring
                "transition-transform will-change-transform hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.995] focus-within:ring-2 focus-within:ring-primary/40",
                item.accentColor ? "border-transparent" : undefined,
              )}
              style={{
                gridColumn: `span ${item.cols} / span ${item.cols}`,
                gridRow: `span ${item.rows} / span ${item.rows}`,
                boxShadow: item.accentColor ? `0 0 0 1px ${item.accentColor} inset` : undefined,
                backgroundImage: (item.accentColor || themeCtx?.tokens.accent)
                  ? `linear-gradient(135deg, ${(item.accentColor ?? themeCtx?.tokens.accent)!}10, transparent 70%)`
                  : undefined,
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.03] animate-stripe"
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, ${(item.accentColor ?? themeCtx?.tokens.accent) ?? "#2563eb"}22 0 10px, transparent 12px 22px)`,
                }}
              />
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <p className={cn("text-muted-foreground", labelClass)}>
                    {item.type}
                  </p>
                  <h3 className={cn(titleClass)}> 
                    {item.title}
                  </h3>
                  {item.subtitle ? (
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                  ) : null}
                </div>
                {item.icon ? <div className="text-muted-foreground">{item.icon}</div> : null}
              </div>
              {item.description ? (
                <p className="mt-6 text-sm text-muted-foreground">{item.description}</p>
              ) : null}
              {item.media ? <div className="mt-6">{item.media}</div> : null}
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
