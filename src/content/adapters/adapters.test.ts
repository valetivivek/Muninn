import { describe, it, expect, vi, beforeEach } from 'vitest';
import { selectAdapter, safeAdapter } from './index';
import type { SiteAdapter } from './types';

describe('selectAdapter', () => {
  it('matches each supported host and nothing else', () => {
    expect(selectAdapter('claude.ai')?.id).toBe('claude');
    expect(selectAdapter('chatgpt.com')?.id).toBe('chatgpt');
    expect(selectAdapter('chat.openai.com')?.id).toBe('chatgpt');
    expect(selectAdapter('gemini.google.com')?.id).toBe('gemini');
    expect(selectAdapter('example.com')).toBeNull();
  });
});

describe('safeAdapter resilience', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  // An adapter whose selectors all throw, simulating a site DOM change.
  const broken: SiteAdapter = {
    id: 'broken',
    matches: () => true,
    findInput() {
      throw new Error('selector broke');
    },
    readText() {
      throw new Error('selector broke');
    },
    setText() {
      throw new Error('selector broke');
    },
    findAnchor() {
      throw new Error('selector broke');
    },
    findSendButton() {
      throw new Error('selector broke');
    },
    lastMessageText() {
      throw new Error('selector broke');
    },
  };

  it('never throws, returns safe fallbacks, and logs quietly when selectors break', () => {
    const safe = safeAdapter(broken);
    // First failing call should log a quiet warning rather than throw.
    expect(() => safe.findInput()).not.toThrow();
    expect(console.warn).toHaveBeenCalled();
    expect(safe.findInput()).toBeNull(); // null → launcher hides itself
    expect(safe.readText(document.body)).toBe('');
    expect(() => safe.setText(document.body, 'x')).not.toThrow();
    expect(safe.findAnchor()).toBeNull();
    expect(safe.findSendButton()).toBeNull();
    expect(safe.lastMessageText()).toBe('');
  });
});
