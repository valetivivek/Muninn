import { describe, it, expect } from 'vitest';
import {
  createCard,
  addCard,
  updateCard,
  deleteCard,
  togglePin,
  normalizeTags,
  parseTags,
  sortCards,
  searchCards,
} from './cards';
import type { Card } from './types';

function card(partial: Partial<Card>): Card {
  return {
    id: partial.id ?? Math.random().toString(36).slice(2),
    title: partial.title ?? 'Untitled',
    body: partial.body ?? 'body',
    tags: partial.tags ?? [],
    createdAt: partial.createdAt ?? 0,
    updatedAt: partial.updatedAt ?? 0,
    pinned: partial.pinned ?? false,
    source: partial.source ?? 'manual',
  };
}

describe('tag normalization', () => {
  it('trims, lowercases, de-dupes, drops empties', () => {
    expect(normalizeTags([' Work ', 'work', 'WORK', '', '  '])).toEqual(['work']);
  });
  it('parses a comma/newline string', () => {
    expect(parseTags('Work, ideas\nDraft')).toEqual(['work', 'ideas', 'draft']);
  });
});

describe('card CRUD', () => {
  it('creates with trimmed title and normalized tags', () => {
    const c = createCard({ title: '  Hello  ', body: 'b', tags: ['A', 'a'] });
    expect(c.title).toBe('Hello');
    expect(c.tags).toEqual(['a']);
    expect(c.source).toBe('manual');
  });

  it('adds to the front', () => {
    const list = addCard([card({ title: 'old' })], { title: 'new', body: 'b' });
    expect(list[0].title).toBe('new');
    expect(list).toHaveLength(2);
  });

  it('updates fields and bumps updatedAt', () => {
    const orig = card({ id: '1', title: 'a', updatedAt: 0 });
    const [updated] = updateCard([orig], '1', { title: 'b' });
    expect(updated.title).toBe('b');
    expect(updated.updatedAt).toBeGreaterThan(0);
  });

  it('deletes by id', () => {
    expect(deleteCard([card({ id: '1' }), card({ id: '2' })], '1')).toHaveLength(1);
  });

  it('toggles pin', () => {
    const [c] = togglePin([card({ id: '1', pinned: false })], '1');
    expect(c.pinned).toBe(true);
  });
});

describe('sorting and search', () => {
  it('floats pinned to the top, then most-recently-updated', () => {
    const list = [
      card({ id: 'a', pinned: false, updatedAt: 10 }),
      card({ id: 'b', pinned: true, updatedAt: 1 }),
      card({ id: 'c', pinned: false, updatedAt: 20 }),
    ];
    expect(sortCards(list).map((c) => c.id)).toEqual(['b', 'c', 'a']);
  });

  it('searches over title and tags, empty query returns pinned-first list', () => {
    const list = [
      card({ id: 'a', title: 'Budget plan', tags: ['finance'] }),
      card({ id: 'b', title: 'Recipe', tags: ['cooking'], pinned: true }),
    ];
    expect(searchCards(list, '').map((c) => c.id)).toEqual(['b', 'a']);
    expect(searchCards(list, 'budget').map((c) => c.id)).toEqual(['a']);
    expect(searchCards(list, 'cooking').map((c) => c.id)).toEqual(['b']);
  });

  it('keeps pinned matches above unpinned matches', () => {
    const list = [
      card({ id: 'a', title: 'plan A' }),
      card({ id: 'b', title: 'plan B', pinned: true }),
    ];
    expect(searchCards(list, 'plan')[0].id).toBe('b');
  });
});
