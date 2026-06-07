import { describe, it, expect } from 'vitest';
import { buildSystemInstruction } from './byok';
import { PROVIDERS } from './providers';

describe('buildSystemInstruction', () => {
  it('embeds the tone and aggressiveness and the fixed framing', () => {
    const sys = buildSystemInstruction('technical', 'radical');
    expect(sys).toContain('prompt-engineering assistant');
    expect(sys).toContain('Preserve their original intent exactly');
    expect(sys).toContain('Technical');
    expect(sys).toContain('Radical');
    expect(sys).toContain('Return only the rewritten prompt');
  });
});

describe('provider configs', () => {
  it('anthropic builds a Messages request with the browser-access header', () => {
    const req = PROVIDERS.anthropic.buildRequest({
      apiKey: 'k',
      model: 'm',
      system: 's',
      userPrompt: 'u',
      stream: true,
    });
    expect(req.url).toContain('api.anthropic.com');
    expect(req.headers['x-api-key']).toBe('k');
    expect(req.headers['anthropic-dangerous-direct-browser-access']).toBe('true');
    expect(JSON.parse(req.body).system).toBe('s');
  });

  it('openai builds a chat-completions request with a system message', () => {
    const req = PROVIDERS.openai.buildRequest({
      apiKey: 'k',
      model: 'm',
      system: 's',
      userPrompt: 'u',
      stream: false,
    });
    expect(req.url).toContain('api.openai.com');
    expect(req.headers.authorization).toBe('Bearer k');
    const body = JSON.parse(req.body);
    expect(body.messages[0]).toEqual({ role: 'system', content: 's' });
  });

  it('parses streaming deltas', () => {
    expect(
      PROVIDERS.anthropic.parseStreamEvent({
        type: 'content_block_delta',
        delta: { type: 'text_delta', text: 'hi' },
      }),
    ).toBe('hi');
    expect(
      PROVIDERS.openai.parseStreamEvent({ choices: [{ delta: { content: 'yo' } }] }),
    ).toBe('yo');
  });

  it('parses full responses', () => {
    expect(
      PROVIDERS.anthropic.parseFull({ content: [{ type: 'text', text: 'done' }] }),
    ).toBe('done');
    expect(
      PROVIDERS.openai.parseFull({ choices: [{ message: { content: 'done' } }] }),
    ).toBe('done');
  });
});
