import type { ProviderConfig } from './types';

// Anthropic Messages API. Calling directly from a browser extension page
// requires the `anthropic-dangerous-direct-browser-access` header, which opts
// into CORS — there is no Muninn proxy; the request goes straight to Anthropic.
export const anthropic: ProviderConfig = {
  id: 'anthropic',
  label: 'Anthropic (Claude)',
  origin: 'https://api.anthropic.com/*',
  defaultModel: 'claude-sonnet-4-6',
  supportsStreaming: true,

  buildRequest({ apiKey, model, system, userPrompt, stream }) {
    return {
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        system,
        stream,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    };
  },

  parseStreamEvent(json) {
    // content_block_delta events carry { delta: { type: 'text_delta', text } }
    const e = json as { type?: string; delta?: { type?: string; text?: string } };
    if (e?.type === 'content_block_delta' && e.delta?.type === 'text_delta') {
      return e.delta.text ?? '';
    }
    return '';
  },

  parseFull(json) {
    const r = json as { content?: Array<{ type?: string; text?: string }> };
    return (r.content ?? [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('');
  },
};
