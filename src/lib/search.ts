// Tiny dependency-free fuzzy scorer. Used to search cards over title + tags.
//
// Scoring is intentionally simple and deterministic so it is easy to unit test:
//   - exact substring match scores highest, weighted by how early it appears
//   - otherwise a subsequence (fuzzy) match scores lower, rewarding adjacency
//   - empty query returns everything with score 0 (caller keeps original order)

export interface ScoredMatch<T> {
  item: T;
  score: number;
}

/** Score a single haystack against a query. Higher is better; 0 = no match. */
export function scoreText(query: string, text: string): number {
  const q = query.trim().toLowerCase();
  const t = text.toLowerCase();
  if (!q) return 0;
  if (!t) return 0;

  // Exact substring: strong base score, bonus for matching at the start.
  const idx = t.indexOf(q);
  if (idx !== -1) {
    const positionBonus = 1 - idx / Math.max(t.length, 1); // earlier = better
    const coverage = q.length / t.length; // shorter haystack = tighter match
    return 100 + positionBonus * 30 + coverage * 20;
  }

  // Subsequence (fuzzy) match: every query char appears in order.
  let ti = 0;
  let matched = 0;
  let adjacency = 0;
  let lastMatchPos = -2;
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi];
    let found = -1;
    for (let j = ti; j < t.length; j++) {
      if (t[j] === ch) {
        found = j;
        break;
      }
    }
    if (found === -1) return 0; // a query char is missing → no match
    if (found === lastMatchPos + 1) adjacency++;
    lastMatchPos = found;
    ti = found + 1;
    matched++;
  }
  return 20 + (matched / q.length) * 20 + adjacency * 5;
}

/**
 * Fuzzy-search a list. `fields` returns the searchable strings for an item
 * (Muninn passes title + tags). Returns matches sorted by score desc; an empty
 * query returns the list untouched (score 0) so callers can apply their own
 * default ordering.
 */
export function fuzzySearch<T>(
  query: string,
  items: T[],
  fields: (item: T) => string[],
): ScoredMatch<T>[] {
  const q = query.trim();
  if (!q) return items.map((item) => ({ item, score: 0 }));

  const results: ScoredMatch<T>[] = [];
  for (const item of items) {
    const best = Math.max(0, ...fields(item).map((f) => scoreText(q, f)));
    if (best > 0) results.push({ item, score: best });
  }
  results.sort((a, b) => b.score - a.score);
  return results;
}
