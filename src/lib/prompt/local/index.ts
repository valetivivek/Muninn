// Local (offline) prompt upgrade pipeline. Composes the pure rules from
// ./rules.ts based on the chosen aggressiveness, only applying a rule when the
// matching detector says it's needed. This function makes NO network calls —
// that invariant is asserted in the unit tests.

import type { Tone, Aggressiveness } from '../../types';
import { hasPersona, hasFormat, isTerse } from './detect';
import { addPersona, addFormat, addSpecificity, addConstraints } from './rules';

export interface LocalUpgradeOptions {
  tone: Tone;
  aggressiveness: Aggressiveness;
}

export interface LocalUpgradeResult {
  output: string;
  /** Which rules actually fired — useful for UI hints and tests. */
  applied: string[];
}

/**
 * Aggressiveness ladder (each level is a superset of the one before):
 *   Conservative → persona + format
 *   Balanced     → + specificity
 *   Radical      → + full constraint scaffolding
 * Persona/format are only added when the prompt doesn't already have them;
 * specificity is only added to terse prompts.
 */
export function runLocalUpgrade(
  input: string,
  { tone, aggressiveness }: LocalUpgradeOptions,
): LocalUpgradeResult {
  const applied: string[] = [];
  let out = input.trim();
  if (!out) return { output: '', applied };

  // Conservative tier: persona + format.
  if (!hasPersona(out)) {
    out = addPersona(out, tone);
    applied.push('persona');
  }
  if (!hasFormat(out)) {
    out = addFormat(out);
    applied.push('format');
  }

  // Balanced tier: add specificity for terse prompts.
  if (aggressiveness === 'balanced' || aggressiveness === 'radical') {
    if (isTerse(input)) {
      out = addSpecificity(out);
      applied.push('specificity');
    }
  }

  // Radical tier: full constraint scaffolding.
  if (aggressiveness === 'radical') {
    out = addConstraints(out);
    applied.push('constraints');
  }

  return { output: out, applied };
}
