// Pure transformation rules for the local (offline) prompt upgrade. Each rule
// takes a prompt (and sometimes a tone) and returns a new prompt. Rules are
// composed by ./index.ts according to the aggressiveness level. No I/O, no
// network — every rule is deterministic and unit-testable.

import type { Tone } from '../../types';

/** Tone-dependent persona line. 'auto' picks a neutral, broadly-useful expert. */
export function personaLine(tone: Tone): string {
  switch (tone) {
    case 'business':
      return 'You are a seasoned business strategist who writes with clarity and an eye for outcomes.';
    case 'creative':
      return 'You are an imaginative creative collaborator with a strong, distinctive voice.';
    case 'technical':
      return 'You are a senior software engineer who is precise, rigorous, and concise.';
    case 'auto':
    default:
      return 'You are a knowledgeable, helpful expert who explains things clearly.';
  }
}

/** Prepend a persona line. Caller ensures one isn't already present. */
export function addPersona(prompt: string, tone: Tone): string {
  return `${personaLine(tone)}\n\n${prompt.trim()}`;
}

/** Append an explicit output-format request. Caller ensures none exists. */
export function addFormat(prompt: string): string {
  return `${prompt.trim()}\n\nFormat your response clearly: use short paragraphs, and use bullet points or a numbered list when it aids readability.`;
}

/** Append a specificity clause for terse prompts. */
export function addSpecificity(prompt: string): string {
  return `${prompt.trim()}\n\nBe specific and concrete. Include relevant details, assumptions, and examples. If anything essential is ambiguous, state the assumption you are making and proceed.`;
}

/** Append full constraint scaffolding (Radical only). */
export function addConstraints(prompt: string): string {
  return `${prompt.trim()}\n\nConstraints:\n- Stay strictly on topic and preserve my original intent.\n- Prioritize accuracy; do not fabricate facts, sources, or figures.\n- Call out important caveats, trade-offs, or risks.\n- End with a brief summary of the key takeaways.`;
}
