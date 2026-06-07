// Pure detection predicates for the local prompt-upgrade rules. Each answers a
// yes/no question about a raw prompt so a rule can decide whether to add
// something. Kept side-effect-free and individually unit-testable.

const PERSONA_PATTERNS = [
  /\byou are\b/i,
  /\bact as\b/i,
  /\bas an? (?:expert|professional|senior|experienced)\b/i,
  /\bpretend (?:to be|you)\b/i,
  /\byour role is\b/i,
  /\bassume the role\b/i,
];

const FORMAT_PATTERNS = [
  /\b(?:bullet points?|bulleted)\b/i,
  /\bnumbered list\b/i,
  /\b(?:as|in) a list\b/i,
  /\btable\b/i,
  /\bjson\b/i,
  /\bmarkdown\b/i,
  /\bstep[-\s]?by[-\s]?step\b/i,
  /\bformat(?:ted)?\b/i,
  /\bcode block\b/i,
  /\bparagraphs?\b/i,
  /\bin (?:\d+|one|two|three) (?:sentences?|words?|paragraphs?)\b/i,
];

/** Does the prompt already establish a persona / role for the model? */
export function hasPersona(prompt: string): boolean {
  return PERSONA_PATTERNS.some((re) => re.test(prompt));
}

/** Does the prompt already request a specific output format? */
export function hasFormat(prompt: string): boolean {
  return FORMAT_PATTERNS.some((re) => re.test(prompt));
}

/** Count sentence-like segments (rough, good enough for the terse heuristic). */
export function sentenceCount(prompt: string): number {
  const parts = prompt
    .trim()
    .split(/[.!?]+(?:\s|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
  return Math.max(parts.length, prompt.trim() ? 1 : 0);
}

/**
 * Terse = a single short instruction. These benefit most from a specificity
 * clause asking the model what details it needs.
 */
export function isTerse(prompt: string): boolean {
  const words = prompt.trim().split(/\s+/).filter(Boolean).length;
  return sentenceCount(prompt) <= 1 && words <= 8;
}
