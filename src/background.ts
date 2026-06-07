// Minimal MV3 service worker. Muninn runs storage migrations on install/update
// and handles exactly one message: a BYOK prompt upgrade requested by the
// on-page Enhance button.
//
// Routing the upgrade through the background is deliberate: the API key is read
// from storage HERE and used to call the provider directly. It is never sent to,
// injected into, or exposed to the host page (and the page's CSP can't block the
// request). The content script only ever sends the prompt text and gets back the
// refined text.

import { runMigrations, getSettings } from './lib/storage';
import { runByokUpgrade, ByokError } from './lib/prompt/byok';
import type { UpgradeRequest, UpgradeResult } from './lib/messaging';

chrome.runtime.onInstalled.addListener(() => {
  void runMigrations();
});

chrome.runtime.onMessage.addListener((msg: unknown, _sender, sendResponse) => {
  if ((msg as Partial<UpgradeRequest>)?.type !== 'muninn:upgrade') return; // not ours
  void handleUpgrade(msg as UpgradeRequest).then(sendResponse);
  return true; // keep the message channel open for the async response
});

async function handleUpgrade(msg: UpgradeRequest): Promise<UpgradeResult> {
  const settings = await getSettings();
  if (!settings.apiKey.trim()) {
    return { ok: false, reason: 'Add your API key in Options to use your-key mode.' };
  }
  try {
    const text = await runByokUpgrade({
      input: msg.input,
      tone: msg.tone,
      aggressiveness: msg.aggressiveness,
      settings,
      stream: false, // a single response is simplest to hand back over messaging
    });
    return { ok: true, text };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof ByokError ? e.message : 'Upgrade failed. Please try again.',
    };
  }
}
