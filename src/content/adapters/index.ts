// Adapter registry + a defensive wrapper. selectAdapter picks the right site
// adapter; safeAdapter wraps every method so a thrown error or failed selector
// becomes a quiet null / no-op and is logged once — never breaking the page.

import type { SiteAdapter } from './types';
import { claudeAdapter } from './claude';
import { chatgptAdapter } from './chatgpt';
import { geminiAdapter } from './gemini';

const ADAPTERS: SiteAdapter[] = [claudeAdapter, chatgptAdapter, geminiAdapter];

export function selectAdapter(hostname = location.hostname): SiteAdapter | null {
  return ADAPTERS.find((a) => a.matches(hostname)) ?? null;
}

let warned = false;
function warnOnce(method: string, err: unknown): void {
  if (warned) return;
  warned = true;
  // Quiet, single, non-throwing log. Never includes page or user content.
  console.warn(`[Muninn] adapter selector failed in ${method}; hiding launcher.`, err);
}

/**
 * Wrap an adapter so callers never have to try/catch. Any throw is swallowed
 * and surfaced as a benign null/empty/no-op; the launcher treats a null input
 * as "hide me".
 */
export function safeAdapter(adapter: SiteAdapter): SiteAdapter {
  return {
    id: adapter.id,
    matches: (h) => adapter.matches(h),
    findInput() {
      try {
        return adapter.findInput();
      } catch (e) {
        warnOnce('findInput', e);
        return null;
      }
    },
    readText(input) {
      try {
        return adapter.readText(input);
      } catch (e) {
        warnOnce('readText', e);
        return '';
      }
    },
    setText(input, text) {
      try {
        adapter.setText(input, text);
      } catch (e) {
        warnOnce('setText', e);
      }
    },
    findAnchor() {
      try {
        return adapter.findAnchor();
      } catch (e) {
        warnOnce('findAnchor', e);
        return null;
      }
    },
    findSendButton() {
      try {
        return adapter.findSendButton();
      } catch (e) {
        warnOnce('findSendButton', e);
        return null;
      }
    },
    lastMessageText() {
      try {
        return adapter.lastMessageText();
      } catch (e) {
        warnOnce('lastMessageText', e);
        return '';
      }
    },
  };
}
