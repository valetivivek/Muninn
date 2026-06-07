// claude.ai adapter. The composer is a ProseMirror contenteditable.

import {
  type SiteAdapter,
  setContentEditableText,
  readContentEditableText,
} from './types';

export const claudeAdapter: SiteAdapter = {
  id: 'claude',
  matches: (host) => host.endsWith('claude.ai'),

  findInput() {
    return (
      document.querySelector<HTMLElement>('div[contenteditable="true"].ProseMirror') ??
      document.querySelector<HTMLElement>('div[contenteditable="true"]')
    );
  },

  readText(input) {
    return readContentEditableText(input);
  },

  setText(input, text) {
    setContentEditableText(input, text);
  },

  findAnchor() {
    return this.findInput()?.closest('div[class*="composer"], fieldset, form') ?? this.findInput();
  },

  findSendButton() {
    return (
      document.querySelector<HTMLElement>('button[aria-label*="Send" i]') ??
      document.querySelector<HTMLElement>('button[type="submit"]')
    );
  },

  lastMessageText() {
    const nodes = document.querySelectorAll<HTMLElement>(
      '.font-claude-message, .font-claude-response, [data-testid="user-message"], [data-testid*="message"]',
    );
    for (let i = nodes.length - 1; i >= 0; i--) {
      const t = (nodes[i].innerText ?? '').trim();
      if (t) return t;
    }
    return '';
  },
};
