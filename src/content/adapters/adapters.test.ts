import { describe, it, expect, vi, beforeEach } from 'vitest';
import { selectAdapter, safeAdapter } from './index';
import { claudeAdapter } from './claude';
import { chatgptAdapter } from './chatgpt';
import { geminiAdapter } from './gemini';
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
    conversationText() {
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

  it('conversationText returns "" when the underlying adapter throws', () => {
    const safe = safeAdapter(broken);
    expect(() => safe.conversationText()).not.toThrow();
    expect(safe.conversationText()).toBe('');
  });
});

describe('conversationText', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('chatgpt', () => {
    it('returns both turns in document order with role labels', () => {
      document.body.innerHTML = `
        <main>
          <article>
            <div data-message-author-role="user">What is 2 + 2?</div>
          </article>
          <article>
            <div data-message-author-role="assistant">It is 4.</div>
          </article>
        </main>`;
      const out = chatgptAdapter.conversationText();
      expect(out).toBe('You:\nWhat is 2 + 2?\n\nChatGPT:\nIt is 4.');
    });

    it('returns "" when no conversation is present', () => {
      document.body.innerHTML = '<main><div>nothing here</div></main>';
      expect(chatgptAdapter.conversationText()).toBe('');
    });
  });

  describe('claude', () => {
    it('returns user and assistant turns in document order with role labels', () => {
      document.body.innerHTML = `
        <div>
          <div data-testid="user-message">Hello Claude</div>
          <div class="font-claude-message">Hello, how can I help?</div>
        </div>`;
      const out = claudeAdapter.conversationText();
      expect(out).toBe('You:\nHello Claude\n\nClaude:\nHello, how can I help?');
    });

    it('returns "" when no conversation is present', () => {
      document.body.innerHTML = '<div><p>just a page</p></div>';
      expect(claudeAdapter.conversationText()).toBe('');
    });
  });

  describe('gemini', () => {
    it('returns user query and model response in document order with role labels', () => {
      document.body.innerHTML = `
        <div class="conversation-container">
          <user-query><div class="query-text">Hi Gemini</div></user-query>
          <model-response><div class="model-response-text">Hello there!</div></model-response>
        </div>`;
      const out = geminiAdapter.conversationText();
      expect(out).toBe('You:\nHi Gemini\n\nGemini:\nHello there!');
    });

    it('returns "" when no conversation is present', () => {
      document.body.innerHTML = '<div><span>empty</span></div>';
      expect(geminiAdapter.conversationText()).toBe('');
    });

    it('prefers the innermost text element so nested matches are not duplicated', () => {
      // .query-text nests inside <user-query>; only the inner text should emit.
      document.body.innerHTML = `
        <div class="conversation-container">
          <user-query><div class="query-text">Just the query</div></user-query>
          <model-response><div class="model-response-text">Just the answer</div></model-response>
        </div>`;
      const out = geminiAdapter.conversationText();
      expect(out).toBe('You:\nJust the query\n\nGemini:\nJust the answer');
    });
  });
});
