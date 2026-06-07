// Messaging helpers between Muninn's contexts: the popup asks the on-page
// content script to insert text (the content script owns the site adapters),
// and the content script asks the background worker to run a BYOK upgrade so
// the API key never enters the page.

import type { Tone, Aggressiveness } from './types';

export interface InsertMessage {
  type: 'muninn:insert';
  text: string;
}

export interface CaptureRequest {
  type: 'muninn:capture-request';
}

/** Content script → background: run a BYOK prompt upgrade (key stays in bg). */
export interface UpgradeRequest {
  type: 'muninn:upgrade';
  input: string;
  tone: Tone;
  aggressiveness: Aggressiveness;
}

export type Message = InsertMessage | CaptureRequest | UpgradeRequest;

export interface InsertResult {
  ok: boolean;
  reason?: string;
}

export type UpgradeResult = { ok: true; text: string } | { ok: false; reason: string };

/**
 * Ask the active tab's content script to append `text` into the site's input.
 * Resolves with ok:false (never throws) when the tab isn't one of the
 * supported sites or the script isn't present.
 */
export async function insertIntoActiveTab(text: string): Promise<InsertResult> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { ok: false, reason: 'No active tab.' };
  try {
    const res = (await chrome.tabs.sendMessage(tab.id, {
      type: 'muninn:insert',
      text,
    } satisfies InsertMessage)) as InsertResult | undefined;
    return res ?? { ok: false, reason: 'No response from page.' };
  } catch {
    return {
      ok: false,
      reason: 'Open a supported AI site (Claude, ChatGPT, or Gemini) to insert here.',
    };
  }
}

/**
 * Ask the background service worker to run a BYOK prompt upgrade. The content
 * script never sees the API key: the background reads it from storage, makes
 * the request, and returns only the refined text. Resolves with ok:false
 * (never throws) when the worker can't be reached.
 */
export async function upgradeViaBackground(args: {
  input: string;
  tone: Tone;
  aggressiveness: Aggressiveness;
}): Promise<UpgradeResult> {
  try {
    const res = (await chrome.runtime.sendMessage({
      type: 'muninn:upgrade',
      input: args.input,
      tone: args.tone,
      aggressiveness: args.aggressiveness,
    } satisfies UpgradeRequest)) as UpgradeResult | undefined;
    return res ?? { ok: false, reason: 'No response from Muninn. Try reloading the page.' };
  } catch {
    return { ok: false, reason: 'Could not reach Muninn. Try reloading the extension.' };
  }
}
