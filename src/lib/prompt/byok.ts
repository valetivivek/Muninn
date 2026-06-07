// Bring-your-own-key prompt upgrade. Calls the user's chosen provider directly
// via fetch, streaming when supported. The API key never leaves this flow: it
// goes only into the provider request and is never logged or included in error
// messages.

import type { Settings, Tone, Aggressiveness } from '../types';
import { getProvider } from './providers';

const TONE_LABEL: Record<Tone, string> = {
  auto: 'Auto (you choose what best fits the prompt)',
  business: 'Business',
  creative: 'Creative',
  technical: 'Technical',
};

const AGGRESSIVENESS_LABEL: Record<Aggressiveness, string> = {
  conservative: 'Conservative',
  balanced: 'Balanced',
  radical: 'Radical',
};

/** Build the system instruction exactly as specified, substituting controls. */
export function buildSystemInstruction(tone: Tone, aggressiveness: Aggressiveness): string {
  return (
    "You are a prompt-engineering assistant. Rewrite the user's prompt to be clearer and more " +
    'effective for a large language model. Preserve their original intent exactly — do not invent ' +
    `new requirements. Tone: ${TONE_LABEL[tone]}. Revision strength: ${AGGRESSIVENESS_LABEL[aggressiveness]} ` +
    '(Conservative = minimal edits; Radical = full restructure with explicit persona, constraints, ' +
    'and output format). Return only the rewritten prompt, no commentary.'
  );
}

/**
 * Ensure the optional host permission for this provider is granted, requesting
 * it from the user if needed. Returns true if granted.
 */
export async function ensureProviderPermission(provider = 'anthropic'): Promise<boolean> {
  const origin =
    provider === 'openai' ? 'https://api.openai.com/*' : 'https://api.anthropic.com/*';
  const has = await chrome.permissions.contains({ origins: [origin] });
  if (has) return true;
  return chrome.permissions.request({ origins: [origin] });
}

export interface UpgradeArgs {
  input: string;
  tone: Tone;
  aggressiveness: Aggressiveness;
  settings: Settings;
  /** Called with the accumulated text as it streams in. */
  onChunk?: (fullText: string) => void;
  signal?: AbortSignal;
}

/** A safe error that never embeds the API key. */
export class ByokError extends Error {}

/**
 * Run a BYOK upgrade. Streams when the provider supports it, calling onChunk
 * with the cumulative text; otherwise resolves once with the full text.
 */
export async function runByokUpgrade(args: UpgradeArgs): Promise<string> {
  const { input, tone, aggressiveness, settings, onChunk, signal } = args;
  const provider = getProvider(settings.provider);

  if (!settings.apiKey.trim()) {
    throw new ByokError('No API key set. Add one in Options to use this mode.');
  }

  const granted = await ensureProviderPermission(settings.provider);
  if (!granted) {
    throw new ByokError(
      `Permission to contact ${provider.label} was not granted. Enable it to use this mode.`,
    );
  }

  const stream = provider.supportsStreaming;
  const req = provider.buildRequest({
    apiKey: settings.apiKey,
    model: settings.model || provider.defaultModel,
    system: buildSystemInstruction(tone, aggressiveness),
    userPrompt: input,
    stream,
  });

  let res: Response;
  try {
    res = await fetch(req.url, {
      method: 'POST',
      headers: req.headers,
      body: req.body,
      signal,
    });
  } catch {
    // Never surface the underlying error object — it could include the request
    // (and thus the key) in some environments.
    throw new ByokError(`Could not reach ${provider.label}. Check your connection and try again.`);
  }

  if (!res.ok) {
    // Read a short, key-free status message.
    const status = res.status;
    let detail = '';
    try {
      const text = await res.text();
      detail = sanitize(text, settings.apiKey).slice(0, 200);
    } catch {
      /* ignore */
    }
    throw new ByokError(
      `${provider.label} returned ${status}.${detail ? ` ${detail}` : ''}`,
    );
  }

  if (stream && res.body) {
    return consumeStream(res.body, (json) => provider.parseStreamEvent(json), onChunk);
  }

  const json = await res.json();
  const text = provider.parseFull(json);
  onChunk?.(text);
  return text;
}

/** Strip any occurrence of the API key from a string before it's shown. */
function sanitize(text: string, apiKey: string): string {
  if (!apiKey) return text;
  return text.split(apiKey).join('***');
}

/**
 * Read an SSE stream, parse each `data:` line as JSON, and accumulate the text
 * each provider event yields. Calls onChunk with the running total.
 */
async function consumeStream(
  body: ReadableStream<Uint8Array>,
  extract: (json: unknown) => string,
  onChunk?: (full: string) => void,
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by blank lines; split on newlines and read data:.
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? ''; // keep the trailing partial line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const piece = extract(json);
        if (piece) {
          full += piece;
          onChunk?.(full);
        }
      } catch {
        // Ignore unparseable keep-alive / partial lines.
      }
    }
  }
  return full;
}
