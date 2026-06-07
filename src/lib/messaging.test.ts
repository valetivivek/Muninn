import { describe, it, expect, vi } from 'vitest';
import { upgradeViaBackground } from './messaging';

describe('upgradeViaBackground', () => {
  it('sends an upgrade request to the background and returns its response', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true, text: 'refined' });
    chrome.runtime.sendMessage = sendMessage;

    const res = await upgradeViaBackground({
      input: 'rough prompt',
      tone: 'technical',
      aggressiveness: 'balanced',
    });

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'muninn:upgrade',
      input: 'rough prompt',
      tone: 'technical',
      aggressiveness: 'balanced',
    });
    expect(res).toEqual({ ok: true, text: 'refined' });
  });

  it('reports a friendly failure when the background cannot be reached', async () => {
    chrome.runtime.sendMessage = vi.fn().mockRejectedValue(new Error('no service worker'));

    const res = await upgradeViaBackground({
      input: 'x',
      tone: 'auto',
      aggressiveness: 'conservative',
    });

    expect(res.ok).toBe(false);
  });
});
