// Injection template handling. When the "wrap context" setting is on, a card's
// body is substituted into the user's editable template so the model is asked
// to acknowledge the context before acting.

import { DEFAULT_INJECTION_TEMPLATE } from './types';

const PLACEHOLDER = '{{card.body}}';

/**
 * Wrap a card body using the template. If wrapping is disabled, returns the raw
 * body. If the template lacks the placeholder, we append the body so the user
 * never silently loses their context.
 */
export function wrapBody(body: string, template: string, wrap: boolean): string {
  if (!wrap) return body;
  const tpl = template && template.trim() ? template : DEFAULT_INJECTION_TEMPLATE;
  if (tpl.includes(PLACEHOLDER)) {
    return tpl.split(PLACEHOLDER).join(body);
  }
  return `${tpl}\n${body}`;
}

/** True when the template still has a usable placeholder (for settings hints). */
export function templateHasPlaceholder(template: string): boolean {
  return template.includes(PLACEHOLDER);
}

/**
 * Append text after existing input, separated by a blank line. Used both for
 * card injection on the page and "insert into page" from the upgrade view.
 * Never overwrites what's already there.
 */
export function appendToText(existing: string, addition: string): string {
  const base = existing.replace(/\s+$/, '');
  if (!base) return addition;
  return `${base}\n\n${addition}`;
}
