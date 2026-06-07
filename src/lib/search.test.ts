import { describe, it, expect } from 'vitest';
import { scoreText, fuzzySearch } from './search';

describe('scoreText', () => {
  it('scores an exact substring higher than a fuzzy match', () => {
    expect(scoreText('plan', 'project plan')).toBeGreaterThan(scoreText('pln', 'project plan'));
  });
  it('rewards earlier matches', () => {
    expect(scoreText('plan', 'plan ahead')).toBeGreaterThan(scoreText('plan', 'a plan'));
  });
  it('returns 0 when a query char is missing', () => {
    expect(scoreText('xyz', 'project plan')).toBe(0);
  });
  it('returns 0 for empty query or text', () => {
    expect(scoreText('', 'anything')).toBe(0);
    expect(scoreText('q', '')).toBe(0);
  });
});

describe('fuzzySearch', () => {
  const items = [{ name: 'budget' }, { name: 'breakfast' }, { name: 'meeting notes' }];

  it('returns everything (score 0) for an empty query', () => {
    expect(fuzzySearch('', items, (i) => [i.name])).toHaveLength(3);
  });

  it('ranks matches by score descending', () => {
    const res = fuzzySearch('bu', items, (i) => [i.name]);
    expect(res[0].item.name).toBe('budget');
  });

  it('drops non-matches', () => {
    const res = fuzzySearch('zzz', items, (i) => [i.name]);
    expect(res).toHaveLength(0);
  });
});
