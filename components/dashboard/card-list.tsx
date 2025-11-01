"use client";

import * as React from "react";

import { deleteCardAction, reorderCardAction } from "@/app/(dashboard)/dashboard/actions";
import { CardEditorDialog } from "@/components/dashboard/card-editor-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import type { Card } from "@/drizzle/schema";

type CardListProps = {
  cards: Card[];
};

export function CardList({ cards }: CardListProps) {
  const [isPending, startTransition] = React.useTransition();
  const undoStack = React.useRef<{ cardId: string; direction: "up" | "down" }[]>([]);
  const redoStack = React.useRef<{ cardId: string; direction: "up" | "down" }[]>([]);
  const performingRef = React.useRef<"none" | "undo" | "redo">("none");

  const handleDelete = (cardId: string) => {
    startTransition(async () => {
      try {
        await deleteCardAction(cardId);
        toast.success("Card removed");
      } catch (_error) {
        toast.error("Failed to remove card");
      }
    });
  };

  const handleReorder = (cardId: string, direction: "up" | "down") => {
    startTransition(async () => {
      try {
        await reorderCardAction(cardId, direction);
        if (performingRef.current === "none") {
          undoStack.current.push({ cardId, direction });
          // clear redo on new user action
          redoStack.current = [];
        }
      } catch (_error) {
        toast.error("Unable to reorder card");
      }
    });
  };

  const handleUndo = () => {
    const op = undoStack.current.pop();
    if (!op) return;
    performingRef.current = "undo";
    const opposite = op.direction === "up" ? "down" : "up";
    startTransition(async () => {
      try {
        await reorderCardAction(op.cardId, opposite);
        redoStack.current.push(op);
      } finally {
        performingRef.current = "none";
      }
    });
  };

  const handleRedo = () => {
    const op = redoStack.current.pop();
    if (!op) return;
    performingRef.current = "redo";
    startTransition(async () => {
      try {
        await reorderCardAction(op.cardId, op.direction);
        undoStack.current.push(op);
      } finally {
        performingRef.current = "none";
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cards</h2>
        <CardEditorDialog
          trigger={
            <Button size="sm" disabled={isPending}>
              New card
            </Button>
          }
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleUndo} aria-label="Undo last reorder" disabled={undoStack.current.length === 0}>
          Undo
        </Button>
        <Button variant="outline" size="sm" onClick={handleRedo} aria-label="Redo reorder" disabled={redoStack.current.length === 0}>
          Redo
        </Button>
      </div>
      <div className="space-y-3" aria-live="polite">
        {cards.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No cards yet. Add your first link, email capture, or highlight using the button above.
          </p>
        ) : null}
        {cards.map((card, index) => (
          <div
            key={card.id}
            className="flex flex-col gap-3 rounded-xl border bg-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{card.title}</p>
                <Badge variant="secondary">{card.type}</Badge>
              </div>
              {card.subtitle ? (
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              ) : null}
              {card.url ? (
                <p className="text-xs text-muted-foreground break-all">{card.url}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">{card.cols}x{card.rows} grid</p>
              <p className="text-xs text-muted-foreground">Clicks: {card.clickCount}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleReorder(card.id, "up")}
                disabled={isPending || index === 0}
                aria-label={`Move ${card.title} up`}
              >
                ↑
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleReorder(card.id, "down")}
                disabled={isPending || index === cards.length - 1}
                aria-label={`Move ${card.title} down`}
              >
                ↓
              </Button>
              <CardEditorDialog
                card={card}
                trigger={
                  <Button variant="outline" disabled={isPending}>
                    Edit
                  </Button>
                }
              />
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => handleDelete(card.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
