// Append text into the site's input via the adapter, never overwriting what's
// already there. Shared by launcher card-clicks and the popup's "insert into
// page" message.

import type { SiteAdapter } from './adapters/types';
import { appendToText } from '../lib/template';
import type { InsertResult } from '../lib/messaging';

export function insertText(adapter: SiteAdapter, text: string): InsertResult {
  const input = adapter.findInput();
  if (!input) return { ok: false, reason: 'Could not find the chat input on this page.' };
  const existing = adapter.readText(input);
  adapter.setText(input, appendToText(existing, text));
  return { ok: true };
}

/**
 * Replace the site's input with `text`. Used by Enhance, which rewrites the
 * prompt the user already typed (so it overwrites rather than appends).
 */
export function replaceText(adapter: SiteAdapter, text: string): InsertResult {
  const input = adapter.findInput();
  if (!input) return { ok: false, reason: 'Could not find the chat input on this page.' };
  adapter.setText(input, text);
  return { ok: true };
}
