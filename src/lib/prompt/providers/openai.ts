import type { ProviderConfig } from './types';

// OpenAI Chat Completions API. The system instruction maps to a system-role
// message; streaming uses SSE chunks with choices[].delta.content.
export const openai: ProviderConfig = {
  id: 'openai',
  label: 'OpenAI (GPT)',
  origin: 'https://api.openai.com/*',
  defaultModel: 'gpt-4o',
  supportsStreaming: true,

  buildRequest({ apiKey, model, system, userPrompt, stream }) {
    return {
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
      }),
    };
  },

  parseStreamEvent(json) {
    const e = json as { choices?: Array<{ delta?: { content?: string } }> };
    return e?.choices?.[0]?.delta?.content ?? '';
  },

  parseFull(json) {
    const r = json as { choices?: Array<{ message?: { content?: string } }> };
    return r?.choices?.[0]?.message?.content ?? '';
  },
};
