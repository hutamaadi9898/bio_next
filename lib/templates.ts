import type { Card } from "@/drizzle/schema";
import type { LayoutTemplate } from "@/lib/validation/cards";

export type TemplateResult = Array<Pick<Card, "id" | "cols" | "rows" | "position">>;

// Given an ordered list of cards, return updated sizing/positions.
export function applyTemplateToCards(template: LayoutTemplate, cards: Card[]): TemplateResult {
  const sorted = [...cards].sort((a, b) => a.position - b.position);
  switch (template) {
    case "hero_2":
      return heroPlusTwo(sorted);
    case "hero_masonry":
      return heroMasonry(sorted);
    case "cards_only":
    default:
      return cardsOnly(sorted);
  }
}

function cardsOnly(cards: Card[]): TemplateResult {
  return cards.map((c, i) => ({ id: c.id, cols: 3, rows: 1, position: i + 1 }));
}

function heroPlusTwo(cards: Card[]): TemplateResult {
  const res: TemplateResult = [];
  cards.forEach((c, i) => {
    if (i === 0) {
      res.push({ id: c.id, cols: 6, rows: 2, position: 1 });
    } else if (i === 1 || i === 2) {
      res.push({ id: c.id, cols: 3, rows: 1, position: i + 1 });
    } else {
      res.push({ id: c.id, cols: 3, rows: 1, position: i + 1 });
    }
  });
  return res;
}

function heroMasonry(cards: Card[]): TemplateResult {
  const res: TemplateResult = [];
  cards.forEach((c, i) => {
    if (i === 0) {
      res.push({ id: c.id, cols: 6, rows: 2, position: 1 });
      return;
    }
    // Alternate 2-row and 1-row, keep 3 cols for balance
    const alt = i % 2 === 1;
    res.push({ id: c.id, cols: 3, rows: alt ? 2 : 1, position: i + 1 });
  });
  return res;
}

