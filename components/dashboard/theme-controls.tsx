"use client";

import * as React from "react";
import { useActionState } from "react";

import { applyLayoutTemplateAction, applyThemePresetAction } from "@/app/(dashboard)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import type { ActionResult } from "@/lib/actions/types";
import { useThemeContext } from "@/components/theme/theme-context";
import type { ThemePresetName } from "@/lib/themes";

const initialState: ActionResult | null = null;

export function ThemeControls() {
  const [themeState, themeAction] = useActionState(applyThemePresetAction, initialState);
  const [layoutState, layoutAction] = useActionState(applyLayoutTemplateAction, initialState);
  const themeCtx = useThemeContext();
  const currentPreset: ThemePresetName = themeCtx?.tokens.preset ?? "minimal";
  const prevPresetRef = React.useRef<ThemePresetName>(currentPreset);

  React.useEffect(() => {
    if (themeState?.success) toast.success("Theme applied");
    if (layoutState?.success) toast.success("Layout updated");
    const err = themeState && !themeState.success ? themeState.errors : layoutState && !layoutState.success ? layoutState.errors : null;
    if (err) toast.error(Object.values(err).join("\n") || "Action failed");
    // Revert optimistic change on error
    if (themeState && !themeState.success && themeCtx) {
      themeCtx.setPresetOptimistic(prevPresetRef.current);
    }
  }, [themeState, layoutState, themeCtx, currentPreset]);

  const accent = themeCtx?.tokens.accent ?? "#2563eb";
  return (
    <div
      className="relative space-y-4 rounded-2xl border bg-card/70 p-5 shadow-sm backdrop-blur supports-[backdrop-filter]:backdrop-blur"
      style={{ boxShadow: `inset 0 0 0 1px ${accent}20`, backgroundImage: `linear-gradient(135deg, ${accent}10, transparent 70%)` }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.03] animate-stripe" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${accent}22 0 10px, transparent 12px 22px)` }} />
      <div>
        <h2 className="text-lg font-semibold">Theme & Layout</h2>
        <p className="text-sm text-muted-foreground">Pick a preset and grid template.</p>
      </div>
      <div className="space-y-2">
        <Label>Theme preset</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              { id: "minimal", label: "Minimal" },
              { id: "studio", label: "Studio" },
              { id: "neon", label: "Neon" },
              { id: "pastel", label: "Pastel" },
            ] as const
          ).map((p) => (
            <form
              key={p.id}
              action={themeAction}
              onSubmit={() => {
                if (!themeCtx) return;
                prevPresetRef.current = currentPreset;
                themeCtx.setPresetOptimistic(p.id);
              }}
            >
              <input type="hidden" name="preset" value={p.id} />
              {(() => {
                const isActive = currentPreset === p.id;
                return (
              <Button
                type="submit"
                variant={isActive ? "default" : "outline"}
                className="w-full"
                aria-pressed={isActive}
              >
                {p.label}
              </Button>
                );
              })()}
            </form>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Layout template</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { id: "hero_2", label: "Hero + 2" },
            { id: "hero_masonry", label: "Hero + Masonry" },
            { id: "cards_only", label: "Cards Only" },
          ].map((t) => (
            <form key={t.id} action={layoutAction} className="w-full">
              <input type="hidden" name="template" value={t.id} />
              <Button type="submit" variant="outline" className="w-full !p-0">
                <TemplatePreview id={t.id as "hero_2" | "hero_masonry" | "cards_only"} label={t.label} />
              </Button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplatePreview({ id, label }: { id: "hero_2" | "hero_masonry" | "cards_only"; label: string }) {
  // A tiny 6-col grid with rectangles to visualize the layout.
  return (
    <div className="w-full p-3">
      <div className="mb-2 text-center text-xs text-muted-foreground">{label}</div>
      <div className="grid grid-cols-6 gap-1">
        {renderTemplateCells(id).map((cell, idx) => (
          <div
            key={idx}
            className="rounded-sm bg-muted"
            style={{ gridColumn: `span ${cell.cols} / span ${cell.cols}`, gridRow: `span ${cell.rows} / span ${cell.rows}`, height: cell.rows === 2 ? 18 : 10 }}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

function renderTemplateCells(id: "hero_2" | "hero_masonry" | "cards_only"): Array<{ cols: number; rows: number }> {
  switch (id) {
    case "hero_2":
      return [
        { cols: 6, rows: 2 },
        { cols: 3, rows: 1 },
        { cols: 3, rows: 1 },
        { cols: 3, rows: 1 },
        { cols: 3, rows: 1 },
      ];
    case "hero_masonry":
      return [
        { cols: 6, rows: 2 },
        { cols: 3, rows: 2 },
        { cols: 3, rows: 1 },
        { cols: 3, rows: 2 },
        { cols: 3, rows: 1 },
      ];
    case "cards_only":
    default:
      return [{ cols: 3, rows: 1 }, { cols: 3, rows: 1 }, { cols: 3, rows: 1 }, { cols: 3, rows: 1 }];
  }
}
