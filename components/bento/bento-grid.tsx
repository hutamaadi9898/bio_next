"use client";

import * as React from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

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
};

/**
 * Animated Bento grid that we reuse for both the marketing preview and the
 * dashboard/public views. Passing LayoutGroup keys keeps reorder animations
 * fluid when cards move between positions.
 */
export function BentoGrid({ items, className }: BentoGridProps) {
  const reduceMotion = useReducedMotion();
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
                "group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border bg-card p-5 text-card-foreground shadow-sm",
                item.accentColor ? "border-transparent" : undefined,
              )}
              style={{
                gridColumn: `span ${item.cols} / span ${item.cols}`,
                gridRow: `span ${item.rows} / span ${item.rows}`,
                boxShadow: item.accentColor
                  ? `0 0 0 1px ${item.accentColor} inset`
                  : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {item.type}
                  </p>
                  <h3 className="text-lg font-semibold leading-tight sm:text-xl">
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
