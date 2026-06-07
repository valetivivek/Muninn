// Messaging helpers between the popup and the on-page content script.
// The content script (running only on the four AI sites) owns the site
// adapters, so the popup asks it to insert text rather than reimplementing
// DOM logic.

export interface InsertMessage {
  type: 'muninn:insert';
  text: string;
}

export interface CaptureRequest {
  type: 'muninn:capture-request';
}

export type Message = InsertMessage | CaptureRequest;

export interface InsertResult {
  ok: boolean;
  reason?: string;
}

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
