// Pure card logic: id generation, CRUD-on-array, pinned-first sorting, search.
// These functions never touch storage directly — they take an array in and
// return a new array — which keeps them trivially unit-testable. The popup
// composes them with the storage layer.

import type { Card } from './types';
import { fuzzySearch } from './search';

/** RFC4122-ish id; falls back to a random string if crypto is unavailable. */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `card_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface NewCardInput {
  title: string;
  body: string;
  tags?: string[];
  pinned?: boolean;
  source?: Card['source'];
}

export function createCard(input: NewCardInput): Card {
  const now = Date.now();
  return {
    id: newId(),
    title: input.title.trim(),
    body: input.body,
    tags: normalizeTags(input.tags ?? []),
    createdAt: now,
    updatedAt: now,
    pinned: input.pinned ?? false,
    source: input.source ?? 'manual',
  };
}

/** Add a card to the front of the working set. */
export function addCard(cards: Card[], input: NewCardInput): Card[] {
  return [createCard(input), ...cards];
}

export function updateCard(
  cards: Card[],
  id: string,
  patch: Partial<Omit<Card, 'id' | 'createdAt' | 'source'>>,
): Card[] {
  return cards.map((c) =>
    c.id === id
      ? {
          ...c,
          ...patch,
          tags: patch.tags ? normalizeTags(patch.tags) : c.tags,
          title: patch.title !== undefined ? patch.title.trim() : c.title,
          updatedAt: Date.now(),
        }
      : c,
  );
}

export function deleteCard(cards: Card[], id: string): Card[] {
  return cards.filter((c) => c.id !== id);
}

export function togglePin(cards: Card[], id: string): Card[] {
  return cards.map((c) =>
    c.id === id ? { ...c, pinned: !c.pinned, updatedAt: Date.now() } : c,
  );
}

/** Trim, lowercase, drop empties, de-dupe — keeps tags tidy for search. */
export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.trim().toLowerCase();
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

/** Parse a comma/space separated tag string from a form input. */
export function parseTags(input: string): string[] {
  return normalizeTags(input.split(/[,\n]/).flatMap((s) => s.split(/\s{2,}/)));
}

/**
 * Sort pinned cards to the top. Within each group, most-recently-updated first.
 * Stable enough to be predictable in tests.
 */
export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

/**
 * Search over title + tags, then keep pinned-first ordering. When the query is
 * empty we return the full pinned-first sorted list; otherwise we return fuzzy
 * matches but still float pinned matches above unpinned ones.
 */
export function searchCards(cards: Card[], query: string): Card[] {
  if (!query.trim()) return sortCards(cards);
  const matches = fuzzySearch(query, cards, (c) => [c.title, ...c.tags]);
  // Sort by pinned first, then by match score.
  return matches
    .sort((a, b) => {
      if (a.item.pinned !== b.item.pinned) return a.item.pinned ? -1 : 1;
      return b.score - a.score;
    })
    .map((m) => m.item);
}
